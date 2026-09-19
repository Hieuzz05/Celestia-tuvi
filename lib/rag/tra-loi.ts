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
import { khoiNghiengVe, tinhNghiengVe, PHIEN_BAN_NGHIENG } from './nghieng-ve';
import { suaCauTiengLong } from './sua-chua';
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
   * Bằm lá số — để đọc bài tổng quan đã sinh trước đó cho chính lá số này.
   *
   * Không bắt buộc: thiếu nó thì chat vẫn chạy, chỉ là không biết hai màn đã
   * nói gì với nhau.
   */
  chartHash?: string;
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
  /** Lối đi tiếp — giao diện dựng, KHÔNG nằm trong `van` */
  loiDi: LoiDiTiep[];
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
}

export function dungVan(t: TraLoiCoCauTruc, nc: NguCanhVan = {}): string {
  const tinNhan = nc.yDinh === 'tra-cuu' || nc.laCauNoi === true || t.yChinh.length <= 2;

  /*
   * Kết luận đứng TRƯỚC tóm tắt, không phải trong nó.
   *
   * Người hỏi "năm 2026 có chuyển việc không" cần câu trả lời ở dòng đầu, chứ
   * không phải ở đoạn thứ tư sau khi đã đọc hết phần phân tích. Tách riêng
   * thành một đoạn để nó đứng một mình — gộp vào tomTat là nó chìm ngay.
   */
  const phan: string[] = [];
  if (t.ketLuan) phan.push(t.ketLuan.trim());
  phan.push(t.tomTat.trim());

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
   * Lối đi tiếp KHÔNG nằm trong bài nữa.
   *
   * Bản trước nhét nó vào chính chuỗi markdown, nên nó đọc như một phần của
   * bài luận — người dùng đọc xong một đoạn Celes vừa nói rồi vấp vào hai cái
   * liên kết. Nó là điều hướng, không phải nội dung. Giờ tuyến trả nó ra riêng
   * và giao diện dựng, cạnh các chip gợi ý.
   */
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
  if (yDinh !== 'quyet-dinh' && yDinh !== 'co-khong') return t;
  if (!t.yChinh.some((y) => y.neuThi)) return t;
  return { ...t, canNhac: [], buocTiepTheo: [] };
}

/**
 * Câu kết luận của bảng tám lĩnh vực đã sinh cho lá số này, nếu có.
 *
 * Đọc ĐỆM, không sinh mới: một lượt chat đã tốn một lượt gọi model, thêm một
 * lượt nữa chỉ để biết bài tổng quan nói gì là nhân đôi chi phí mỗi câu hỏi.
 * Chưa có bài tổng quan thì trả mảng rỗng và chat chạy như cũ.
 *
 * Mọi lỗi đều nuốt: đây là thứ làm bài hay hơn, không phải thứ bài cần để
 * đúng. Bảng chưa tạo, mạng chập, đệm trống — chat vẫn phải trả lời được.
 */
async function ketLuanBaiTongQuan(chartHash: string | undefined, namXem: number): Promise<string[]> {
  if (!chartHash) return [];
  try {
    const { docNoiDung } = await import('./noi-dung-ai');
    const ban = await docNoiDung<{ id: string; ketLuan: string }[]>({
      chartHash,
      beMat: 'bang-linh-vuc',
      khoaKy: `nam:${namXem}`,
      ngonNgu: 'vi',
    });
    if (!ban) return [];
    return (ban.noiDung ?? [])
      .map((k) => k?.ketLuan)
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 20)
      // Sáu câu là đủ để giữ giọng; nhiều hơn thì khối này lấn át chính dữ kiện
      // lá số ở ngay phía trên nó.
      .slice(0, 6);
  } catch {
    return [];
  }
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
  const daNoiTruoc = await ketLuanBaiTongQuan(vao.chartHash, vao.namXem);

  /*
   * Hướng nghiêng chỉ tính cho câu CẦN một câu trả lời thẳng.
   *
   * "Tính cách tôi thế nào" không có bên nào để nghiêng về, và ép một hướng
   * vào đó là bịa ra một câu hỏi người ta không hỏi.
   */
  const canNghieng =
    keHoach.yDinh === 'quyet-dinh' ||
    keHoach.yDinh === 'co-khong' ||
    keHoach.yDinh === 'thoi-diem';
  const nghieng = canNghieng
    ? tinhNghiengVe({
        laSo: vao.laSo,
        chuDe: keHoach.chuDe,
        lopHan: keHoach.lopHan,
        namXem: vao.namXem,
        thangXem: vao.thangXem,
      })
    : null;

  const { system, user } = dungPromptCoCanCu(
    goi,
    vao.lichSu ?? [],
    daNoiTruoc,
    khoiNghiengVe(nghieng)
  );

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
      loiDi: [],
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

  const loiDi = loiDiTiep({
    chuDe: keHoach.chuDe,
    lopHan: keHoach.lopHan,
    yDinh: keHoach.yDinh,
    cungTrongTam: keHoach.cungLienQuan[0],
  });

  const vanTho = dungVan(daLoc, {
    yDinh: keHoach.yDinh,
    laCauNoi: laCauNoiTiep(vao.cauHoi, vao.lichSu ?? []),
  });

  /*
   * Sửa câu dùng tiếng lóng nội bộ, TRƯỚC khi soát lần cuối.
   *
   * Cổng ngôn ngữ xếp lỗi này ở mức "chặn", nhưng "chặn" ở đó nghĩa là ghi vào
   * trace ở mức nặng nhất — nó không giữ chữ lại, và route vẫn trả `van` cho
   * người đọc. Đúng cho mọi luật chặn khác, vì vứt cả bài vì một câu sai giọng
   * là phản ứng quá tay.
   *
   * Với lỗi này thì để nguyên cũng không được: đo trên 69 bài, 2 bài vẫn viết
   * "các yếu tố cản vẫn khá mạnh" — đúng câu đã làm người dùng phàn nàn. Nên
   * sửa đúng câu ấy, giữ phần còn lại, và chỉ gọi model khi thật sự có câu phạm.
   *
   * Đưa kèm tên dữ kiện engine đã đọc được: câu "yếu tố cản" không còn cái tên
   * nào để giữ lại, nên người sửa phải được đưa tên, không được tự nghĩ ra.
   */
  const van = await suaCauTiengLong(
    vanTho,
    nghieng ? [...nghieng.dauMoc.map((d) => d.ten), ...nghieng.cachCuc] : []
  );

  const ketQuaNgonNgu = soatNgonNgu(
    van,
    daLoc.yChinh.map((y) => y.tieuDe || y.noiDung),
    daLoc.yChinh
      .filter((y) => y.mucChacChan)
      .map((y) => ({ moDau: y.noiDung, muc: y.mucChacChan! })),
    daNoiTruoc
  );

  return {
    van,
    loiDi,
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
    nghieng: PHIEN_BAN_NGHIENG,
    truyHoi: PHIEN_BAN_TRUY_HOI,
    schemaOutput: PHIEN_BAN_SCHEMA_OUTPUT,
    validator: PHIEN_BAN_VALIDATOR,
    ngonNgu: PHIEN_BAN_NGON_NGU,
    uuTienNguon: PHIEN_BAN_UU_TIEN,
  };
}
