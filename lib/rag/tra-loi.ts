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
import { kiemDuyet, locYHong, PHIEN_BAN_VALIDATOR, type KetQuaKiemDuyet } from './kiem-duyet';
import { PHIEN_BAN_NGON_NGU, soatNgonNgu, type KetQuaNgonNgu } from './ngon-ngu';
import { PHIEN_BAN_UU_TIEN } from './uu-tien-nguon';
import { ghiLanTruyHoi } from './nhat-ky';
import { lapKeHoach, lapKeHoachDayDu, PHIEN_BAN_PLANNER } from './planner';
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

/** Dựng markdown từ câu trả lời có cấu trúc — UI hiện tại đọc markdown. */
export function dungVan(t: TraLoiCoCauTruc): string {
  const phan: string[] = [t.tomTat.trim()];

  for (const y of t.yChinh) {
    // Lực ngược đi liền sau ý chứ không gom xuống cuối bài: nó là phần làm cho ý
    // đó đáng tin, tách ra thì người đọc mất mối nối.
    const than = y.luongNguoc ? `${y.noiDung.trim()}\n\n${y.luongNguoc.trim()}` : y.noiDung.trim();
    phan.push(y.tieuDe ? `### ${y.tieuDe}\n${than}` : than);
  }

  if (t.canNhac?.length) {
    phan.push(`### Cần cân nhắc\n${t.canNhac.map((c) => `- ${c}`).join('\n')}`);
  }
  if (t.buocTiepTheo?.length) {
    phan.push(`### Có thể làm gì\n${t.buocTiepTheo.map((c) => `- ${c}`).join('\n')}`);
  }

  return phan.join('\n\n');
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
  const { traLoi: daLoc, soYBiBo } = locYHong(daCham, ketQuaKiem);

  const van = dungVan(daLoc);
  const ketQuaNgonNgu = soatNgonNgu(
    van,
    daLoc.yChinh.map((y) => y.tieuDe || y.noiDung)
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
