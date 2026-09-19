import { goiVoiFallback } from '@/lib/ai/fallback';
import type { TinNhan } from '@/lib/ai/prompt';
import type { LaSo } from '@/lib/tuvi/ansao';
import { PHIEN_BAN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import {
  chamDoChac,
  docTraLoi,
  dungGoiBangChung,
  PHIEN_BAN_SCHEMA_OUTPUT,
  type GoiBangChung,
  type TraLoiCoCauTruc,
} from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';
import { haGiong, loiDiTiep, type LoiDiTiep } from './hinh-dang-tra-loi';
import { laCauNoiTiep } from './tiep-noi';
import { kiemDuyet, locYHong, PHIEN_BAN_VALIDATOR, type KetQuaKiemDuyet } from './kiem-duyet';
import { PHIEN_BAN_NGON_NGU, soatNgonNgu, type KetQuaNgonNgu } from './ngon-ngu';
import { PHIEN_BAN_UU_TIEN } from './uu-tien-nguon';
import { ghiLanTruyHoi } from './nhat-ky';
import { lapKeHoach, lapKeHoachDayDu, PHIEN_BAN_PLANNER, type YDinh } from './planner';
import { dungPromptCoCanCu } from './prompt-co-can-cu';
import { truyHoi, PHIEN_BAN_TRUY_HOI, type CauHinhTruyHoi } from './truy-hoi';

/**
 * Ghép toàn bộ đường đi: planner → bối cảnh lá số → truy hồi → gói bằng chứng →
 * model → kiểm duyệt → dựng chữ.
 *
 * Tách khỏi route API để Retrieval Lab và bộ eval chạy được đúng đường đi đó,
 * chứ không chạy một bản sao gần giống. Hai đường đi gần giống nhau là cách chắc
 * chắn nhất để eval báo xanh còn người dùng gặp lỗi.
 */

export interface DauVaoTraLoi {
  laSo: LaSo;
  cauHoi: string;
  namXem: number;
  thangXem: number;
  lichSu?: TinNhan[];
  requestId?: string;
  cauHinhTruyHoi?: Partial<CauHinhTruyHoi>;
  /** Không ghi nhật ký khi chạy thử trong Lab hay eval */
  ghiNhatKy?: boolean;
  /**
   * Cho phép planner gọi model khi luật không kết luận được chủ đề.
   *
   * Mặc định BẬT cho người dùng thật. Tắt trong eval và Retrieval Lab: một bước
   * có model ở giữa là hai lần chạy cùng câu hỏi ra hai kế hoạch khác nhau, và
   * lúc đó con số eval không so được với lần trước.
   */
  dungModelPhanLoai?: boolean;
}

export interface KetQuaTraLoi {
  van: string;
  coCauTruc: TraLoiCoCauTruc | null;
  goi: GoiBangChung;
  kiemDuyet: KetQuaKiemDuyet | null;
  ngonNgu: KetQuaNgonNgu | null;
  soYBiBo: number;
  provider: string;
  model: string;
  runId: string | null;
  khoTrong: boolean;
  phienBan: Record<string, string>;
  doTreMs: { truyHoi: number; model: number; tong: number };
}

/**
 * Dựng markdown từ câu trả lời có cấu trúc — UI hiện tại đọc markdown.
 *
 * HAI khuôn, không phải một.
 *
 * Bản cũ luôn ghép `### Tiêu đề` cho từng ý rồi `### Cần cân nhắc` rồi `### Có
 * thể làm gì`. Mọi câu trả lời — dài hay ngắn, câu mở chủ đề hay câu hỏi lại
 * một chữ — đều ra cùng một khuôn BÁO CÁO. Mà đây là chat: người ta gõ một
 * dòng rồi nhận về một bản báo cáo có mục lục thì đọc như đang tra cứu, không
 * như đang nói chuyện.
 *
 * Khuôn TIN NHẮN dùng khi câu hỏi nhỏ: tra cứu, câu nối tiếp, hoặc ít hơn ba
 * ý. Không heading nào cả, các đoạn nối liền mạch.
 *
 * Khuôn BÁO CÁO giữ nguyên cho câu mở chủ đề lớn, từ ba ý trở lên — ở đó
 * heading là thứ giúp người đọc quét chứ không phải thứ làm phiền họ.
 */
export interface NguCanhVan {
  yDinh?: YDinh;
  /** Câu hỏi hiện tại là câu nối tiếp mạch đang nói dở */
  laCauNoi?: boolean;
  /** Lối đi tiếp, do bảng tra dựng — xem hinh-dang-tra-loi.ts */
  loiDi?: LoiDiTiep[];
}

export function dungVan(t: TraLoiCoCauTruc, nc: NguCanhVan = {}): string {
  const tinNhan = nc.yDinh === 'tra-cuu' || nc.laCauNoi === true || t.yChinh.length <= 2;
  const phan: string[] = [t.tomTat.trim()];

  for (const y of t.yChinh) {
    /*
     * Giọng chắc chắn do LUẬT quyết, không do model.
     *
     * Engine đã chấm mức bằng cách đếm số tài liệu độc lập. Để model tự chọn
     * cụm ngôn ngữ theo mức là để nó tự chấm độ chắc của chính nó — và không
     * ai tự chấm mình thấp cả.
     */
    const doan: string[] = [haGiong(y.noiDung.trim(), y.mucChacChan)];
    // Lực ngược đi liền sau ý chứ không gom xuống cuối bài: nó là phần làm cho ý
    // đó đáng tin, tách ra thì người đọc mất mối nối.
    if (y.luongNguoc) doan.push(y.luongNguoc.trim());
    // Cùng lý do với lực ngược: lời khuyên dạng điều kiện thuộc về CHÍNH ý này,
    // gom nó xuống cuối bài là tách nó khỏi cái cớ sinh ra nó.
    if (y.neuThi) doan.push(y.neuThi.trim());

    const than = doan.join('\n\n');
    phan.push(tinNhan || !y.tieuDe ? than : `### ${y.tieuDe}\n${than}`);
  }

  /*
   * Khuôn tin nhắn bỏ TIÊU ĐỀ, không bỏ gạch đầu dòng.
   *
   * Các mục trong canNhac thường là MẨU CÂU ("Tình hình tài chính cá nhân hiện
   * tại"), không phải câu. Nối chúng bằng dấu cách ra đúng một dòng vô nghĩa —
   * đo được trên bài thật. Gạch đầu dòng không phải heading và đọc bình thường
   * trong chat, nên giữ.
   */
  if (t.canNhac?.length) {
    const muc = t.canNhac.map((c) => `- ${c.trim()}`).join('\n');
    phan.push(tinNhan ? muc : `### Cần cân nhắc\n${muc}`);
  }

  // buocTiepTheo chỉ còn giữ việc KHÔNG thuộc riêng ý nào. Rỗng thì bỏ hẳn mục,
  // đừng in một tiêu đề trống.
  if (t.buocTiepTheo?.length) {
    const muc = t.buocTiepTheo.map((c) => `- ${c.trim()}`).join('\n');
    phan.push(tinNhan ? muc : `### Có thể làm gì\n${muc}`);
  }

  // Lớp tự kiểm đứng trước câu hỏi ngược: nó là thứ người đọc mang đi dùng,
  // còn câu hỏi ngược là thứ kéo họ quay lại đây.
  if (t.tuKiem) phan.push(t.tuKiem.trim());

  // Câu hỏi ngược luôn là đoạn CUỐI TRƯỚC LIÊN KẾT, không heading, không bullet
  // — nó là một câu nói với người đối diện, không phải một mục trong bài.
  if (t.hoiLai) phan.push(t.hoiLai.trim());

  /*
   * Lối đi tiếp, dựng từ bảng tra — model không bao giờ sinh URL.
   *
   * Đặt cuối cùng và viết thành một dòng liên kết markdown: người đọc đã đọc
   * xong thì mới cần biết đi đâu tiếp, đặt lên trên là cắt ngang mạch đọc.
   */
  if (nc.loiDi?.length) {
    phan.push(nc.loiDi.map((l) => `[${l.nhan}](${l.duong})`).join(' · '));
  }

  return phan.filter(Boolean).join('\n\n');
}

/**
 * Gom lời khuyên về đúng chỗ của nó, cho câu hỏi dạng quyết định.
 *
 * Với câu quyết định, lời khuyên phải nằm trong `neuThi` của ý sinh ra nó —
 * dồn xuống `canNhac` / `buocTiepTheo` ở cuối bài là tách nó khỏi cái cớ, đúng
 * lỗi mà `luongNguoc` đã được đặt liền sau ý để tránh.
 *
 * Prompt đã nói thẳng điều này và model vẫn rải: đo qua ba lần sửa prompt, tỉ
 * lệ lời khuyên dạng điều kiện dừng ở 75–79% chứ không lên nổi 80%. Xin thêm
 * lần nữa là lặp lại cái đã không ăn hai lần.
 *
 * An toàn vì có điều kiện: chỉ bỏ khi bài ĐÃ CÓ ít nhất một `neuThi`. Lúc ấy
 * lời khuyên đã nằm đúng chỗ, hai mảng kia chỉ là bản lặp. Bài không có
 * `neuThi` nào thì giữ nguyên — thà giọng sai còn hơn mất hết lời khuyên.
 */
function gomLoiKhuyen(t: TraLoiCoCauTruc, yDinh: YDinh): TraLoiCoCauTruc {
  if (yDinh !== 'quyet-dinh') return t;
  if (!t.yChinh.some((y) => y.neuThi)) return t;
  return { ...t, canNhac: [], buocTiepTheo: [] };
}

export async function traLoiCoCanCu(vao: DauVaoTraLoi): Promise<KetQuaTraLoi> {
  const batDau = Date.now();

  // Planner cần biết sao nào đứng ở cung nào để viết lại truy vấn bằng đúng
  // thuật ngữ tài liệu, nên lá số phải được đọc trước khi lập kế hoạch.
  /*
   * Hai lượt lập kế hoạch, đều là hàm thuần nên rẻ.
   *
   * Cách cục cần biết CUNG TRỌNG TÂM để chọn đúng bộ, mà cung trọng tâm lại do
   * planner suy ra — vòng tròn. Gỡ bằng cách chạy luật một lượt để biết cung,
   * lấy cách cục của cung đó, rồi lập kế hoạch thật với tên cách cục trong tay.
   */
  const saoTheoCung = saoChinhTheoCung(vao.laSo);
  const so = lapKeHoach({ cauHoi: vao.cauHoi, saoTheoCung });
  const dauVaoPlanner = {
    cauHoi: vao.cauHoi,
    saoTheoCung,
    tenCachCuc: tenCachCucCho(vao.laSo, so.cungLienQuan[0]),
  };
  const keHoach =
    vao.dungModelPhanLoai === false
      ? lapKeHoach(dauVaoPlanner)
      : await lapKeHoachDayDu(dauVaoPlanner);

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });

  const kqTruyHoi = await truyHoi(keHoach, vao.cauHinhTruyHoi);

  const runId =
    vao.ghiNhatKy === false
      ? null
      : await ghiLanTruyHoi(keHoach, kqTruyHoi, {
          requestId: vao.requestId,
          cauHoi: vao.cauHoi,
        });

  const goi = dungGoiBangChung(vao.cauHoi, keHoach, duKien, kqTruyHoi.daChon);
  const { system, user } = dungPromptCoCanCu(goi, vao.lichSu ?? []);

  const truocModel = Date.now();
  const kq = await goiVoiFallback({ system, user, maxTokens: 3000 });
  const doTreModel = Date.now() - truocModel;

  const coCauTruc = docTraLoi(kq.text);

  // Model không trả về JSON đọc được: không bỏ cả câu trả lời, nhưng cũng không
  // giả vờ đã kiểm duyệt. Người dùng vẫn nhận được chữ, còn trace ghi rõ lượt
  // này không qua validator.
  if (!coCauTruc) {
    return {
      van: kq.text,
      coCauTruc: null,
      goi,
      kiemDuyet: null,
      ngonNgu: null,
      soYBiBo: 0,
      provider: kq.provider,
      model: kq.model,
      runId,
      khoTrong: kqTruyHoi.khoTrong,
      phienBan: phienBanHienTai(),
      doTreMs: { truyHoi: kqTruyHoi.doTreMs, model: doTreModel, tong: Date.now() - batDau },
    };
  }

  const daCham = chamDoChac(coCauTruc, goi);
  const ketQuaKiem = kiemDuyet(daCham, goi);
  const { traLoi: daLocY, soYBiBo } = locYHong(daCham, ketQuaKiem);
  const daLoc = gomLoiKhuyen(daLocY, keHoach.yDinh);

  const van = dungVan(daLoc, {
    yDinh: keHoach.yDinh,
    laCauNoi: laCauNoiTiep(vao.cauHoi, vao.lichSu ?? []),
    loiDi: loiDiTiep({
      chuDe: keHoach.chuDe,
      lopHan: keHoach.lopHan,
      yDinh: keHoach.yDinh,
      cungTrongTam: keHoach.cungLienQuan[0],
    }),
  });
  const ketQuaNgonNgu = soatNgonNgu(
    van,
    daLoc.yChinh.map((y) => y.tieuDe || y.noiDung),
    daLoc.yChinh
      .filter((y) => y.mucChacChan)
      .map((y) => ({ moDau: y.noiDung, muc: y.mucChacChan! }))
  );

  return {
    van,
    coCauTruc: daLoc,
    goi,
    kiemDuyet: ketQuaKiem,
    ngonNgu: ketQuaNgonNgu,
    soYBiBo,
    provider: kq.provider,
    model: kq.model,
    runId,
    khoTrong: kqTruyHoi.khoTrong,
    phienBan: phienBanHienTai(),
    doTreMs: { truyHoi: kqTruyHoi.doTreMs, model: doTreModel, tong: Date.now() - batDau },
  };
}

export function phienBanHienTai(): Record<string, string> {
  return {
    engine: PHUONG_PHAP.id,
    phuongPhap: PHUONG_PHAP.phienBan,
    planner: PHIEN_BAN_PLANNER,
    cachCuc: PHIEN_BAN_CACH_CUC,
    truyHoi: PHIEN_BAN_TRUY_HOI,
    schemaOutput: PHIEN_BAN_SCHEMA_OUTPUT,
    validator: PHIEN_BAN_VALIDATOR,
    ngonNgu: PHIEN_BAN_NGON_NGU,
    uuTienNguon: PHIEN_BAN_UU_TIEN,
  };
}
