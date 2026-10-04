/**
 * KẾ THỪA CHỦ ĐỀ — đường Focused (CEL-186 vé B, cờ #2, mục 3).
 *
 * Bấm chip "Sang năm Đinh Mùi thì sao?" sau câu về tình cảm thì câu chip tự nó
 * không có chủ đề: planner ra `tong-quan` và đọc Mệnh. Server giữ chủ đề thay
 * người dùng, theo hai luật của chủ dự án:
 *   - câu mới TỰ CÓ chủ đề (hoặc người được hỏi) thì tin câu mới, không kế thừa;
 *   - kế thừa thì DỰNG LẠI cả kế hoạch, không vá từng trường.
 *
 * Dựng lại theo tinh thần 15 L1: lập kế hoạch cho câu ghép "<cung nguồn> + câu
 * chip" để lấy chủ đề, cung, truy vấn; trục thời gian lấy từ câu GỐC. Không lấy
 * thời gian từ câu ghép: "Phu Thê 2027 thì sao?" làm planner mất năm trần đứng
 * đầu, còn "2027 thì sao?" giữ được.
 *
 * Hàm thuần, không gọi model, không sửa planner dùng chung.
 */

import type { TinNhan } from '@/lib/ai/prompt';
import { lapKeHoach, lapKeHoachVoiChuDe, type KeHoachTruyVan } from '../planner';
import { ghepKeHoach, nhanDangDoiTuong, type DoiTuongCauHoi } from './doi-tuong';
import { khopCum } from './khop';

type SaoTheoCung = Parameters<typeof lapKeHoach>[0]['saoTheoCung'];

export interface DauVaoKeThua {
  cauHoi: string;
  laTiepTuChip?: boolean;
  lichSu?: TinNhan[];
  saoTheoCung: SaoTheoCung;
  namXem?: number;
  thangXem?: number;
  /** Tên cách cục của cung trọng tâm — lượt lập thứ hai, như đường STANDARD */
  tenCachCuc?: string[];
}

export interface KetQuaKeThua {
  keHoach: KeHoachTruyVan;
  doiTuong: DoiTuongCauHoi | null;
  /** Có kế thừa thì ghi câu nguồn — để vết, không vào prompt */
  keThuaTu?: string;
}

/** Câu ngắn tới mức này mà không có chủ đề thì coi là câu nối tiếp. */
const TRAN_AM_TIET_CAU_NGAN = 6;
/** Chỉ lùi chừng này lượt người dùng: xa hơn thì chủ đề cũ không còn là ngữ cảnh. */
const SO_LUOT_LUI = 4;

const soAmTiet = (s: string) => s.split(/[^\p{L}\p{M}\d]+/u).filter(Boolean).length;

/** Câu tự đứng được: có chủ đề cụ thể, hoặc nói về một người cụ thể. */
function coChuDeRieng(keHoach: KeHoachTruyVan, doiTuong: DoiTuongCauHoi | null): boolean {
  return !!doiTuong || keHoach.chuDe !== 'tong-quan';
}

/* ------------------------------------------------- chỉnh chủ đề (TOPIC) */

/*
 * Hai chỗ bảng dùng chung đọc lệch mà sửa ở planner thì đổi cả STANDARD và xả
 * đệm (`PHIEN_BAN_PLANNER`), nên chỉnh ở đây, chỉ đường Focused đọc:
 *   TOPIC-01 "bản thân tôi … công việc": "bản thân" là bí danh của Mệnh, Mệnh
 *     đứng trước nên thắng, câu ra tổng quan. "Bản thân" chỉ là người hỏi tự
 *     xưng — bỏ nó đi thì phần còn lại nói đúng chủ đề.
 *   TOPIC-02 "nhà cửa / chỗ ở / chuyển nhà / ra ở riêng": chuyện nơi ở là gia
 *     đạo (Điền Trạch), không phải tài chính.
 *   TOPIC-03 mua nhà / bất động sản / vay / đầu tư / giá trị tài sản: vẫn là
 *     tài chính — không chỉnh.
 */
const BAN_THAN = 'bản thân';
const BAN_THAN_KD = 'ban than';
const NHA_O = 'nhà cửa|chỗ ở|nơi ở|chuyển nhà|dọn nhà|ra ở riêng|ở riêng|nhà ở';
const NHA_O_KD = 'nha cua|cho o|noi o|chuyen nha|don nha|ra o rieng|o rieng|nha o';
const NHA_TIEN =
  'mua nhà|bán nhà|mua đất|bán đất|bất động sản|bđs|vay tiền|vay nợ|vay ngân hàng|vay mua|vay vốn|đi vay|thế chấp|trả góp|đầu tư|giá nhà|giá trị|tài sản|đất đai|tiền|sổ đỏ|cho thuê';
const NHA_TIEN_KD =
  // Không có "vay" / "tien" trần: gõ không dấu "vậy", "thuận tiện" cũng ra hai chữ đó.
  'mua nha|ban nha|mua dat|ban dat|bat dong san|bds|vay tien|vay no|vay ngan hang|vay mua|vay von|di vay|the chap|tra gop|dau tu|gia nha|gia tri|tai san|dat dai|tien bac|tien nha|tien mua|tien thue|so do|cho thue';
/** Cung khác ngoài hai cung này được gọi tên thì người hỏi đã tự chọn chỗ nhìn — không chỉnh. */
const CUNG_NHA = new Set(['Điền Trạch', 'Mệnh']);

type DauVaoLap = Omit<DauVaoKeThua, 'laTiepTuChip' | 'lichSu'>;

/** `lapKeHoach` + hai chỉnh chủ đề của Focused. Thuần, không gọi model. */
export function lapKeHoachChinh(vao: DauVaoLap): KeHoachTruyVan {
  const p = { cauHoi: vao.cauHoi, saoTheoCung: vao.saoTheoCung, tenCachCuc: vao.tenCachCuc, namXem: vao.namXem, thangXem: vao.thangXem };
  const goc = lapKeHoach(p);
  const cung = goc.thucThe.filter((t) => t.loai === 'PALACE').map((t) => t.ten);

  if (cung[0] === 'Mệnh' && khopCum(vao.cauHoi, BAN_THAN, BAN_THAN_KD)) {
    const bo = vao.cauHoi.replace(/b[aả]n\s+th[aâ]n/giu, ' ').replace(/\s+/g, ' ').trim();
    const ke = lapKeHoach({ ...p, cauHoi: bo });
    if (ke.chuDe !== 'tong-quan') return ke;
  }

  if (
    khopCum(vao.cauHoi, NHA_O, NHA_O_KD) &&
    !khopCum(vao.cauHoi, NHA_TIEN, NHA_TIEN_KD) &&
    cung.every((c) => CUNG_NHA.has(c)) &&
    (goc.chuDe === 'tai-chinh' || goc.chuDe === 'tong-quan' || goc.chuDe === 'gia-dao')
  ) {
    // Gọi tên Điền Trạch đứng đầu để cung trọng tâm (cách cục, lối đi) là Điền Trạch, không phải Phụ Mẫu.
    return lapKeHoachVoiChuDe({ ...p, cauHoi: cung.includes('Điền Trạch') ? vao.cauHoi : `Điền Trạch ${vao.cauHoi}` }, 'gia-dao');
  }
  return goc;
}

function timNguon(vao: DauVaoKeThua): { cau: string; keHoach: KeHoachTruyVan; doiTuong: DoiTuongCauHoi | null } | null {
  const cuaNguoiDung = (vao.lichSu ?? []).filter((t) => t.vaiTro === 'nguoi-dung').map((t) => t.noiDung.trim());
  // Route có thể đã nhét câu đang hỏi vào cuối lịch sử — bỏ nó, đừng tự kế thừa chính mình.
  if (cuaNguoiDung.length && cuaNguoiDung[cuaNguoiDung.length - 1] === vao.cauHoi.trim()) cuaNguoiDung.pop();
  for (const cau of cuaNguoiDung.slice(-SO_LUOT_LUI).reverse()) {
    const keHoach = lapKeHoachChinh({ ...vao, cauHoi: cau });
    const doiTuong = nhanDangDoiTuong(cau);
    if (coChuDeRieng(keHoach, doiTuong)) return { cau, keHoach, doiTuong };
  }
  return null;
}

export function lapKeHoachFocused(vao: DauVaoKeThua): KetQuaKeThua {
  const goc = lapKeHoachChinh(vao);
  const doiTuong = nhanDangDoiTuong(vao.cauHoi);

  const datGhep = (dt: DoiTuongCauHoi) =>
    ghepKeHoach(
      goc,
      lapKeHoach({ cauHoi: `${dt.cung} ${vao.cauHoi}`, saoTheoCung: vao.saoTheoCung, tenCachCuc: vao.tenCachCuc, namXem: vao.namXem, thangXem: vao.thangXem }),
      dt
    );

  // Luật 1: câu mới tự có chủ đề thì tin câu mới.
  if (coChuDeRieng(goc, doiTuong)) {
    return { keHoach: doiTuong ? datGhep(doiTuong) : goc, doiTuong };
  }

  const laCauNoi = vao.laTiepTuChip === true || soAmTiet(vao.cauHoi) <= TRAN_AM_TIET_CAU_NGAN;
  if (!laCauNoi) return { keHoach: goc, doiTuong: null };

  const nguon = timNguon(vao);
  if (!nguon) return { keHoach: goc, doiTuong: null };

  // Luật 2: dựng lại cả kế hoạch. Người được hỏi đi theo nguồn: "Sang năm thì
  // sao?" sau câu về con vẫn là câu về con.
  if (nguon.doiTuong) {
    const keHoach = { ...datGhep(nguon.doiTuong), chuDe: nguon.keHoach.chuDe, chacChan: true };
    return { keHoach, doiTuong: nguon.doiTuong, keThuaTu: nguon.cau };
  }
  const cungNguon = nguon.keHoach.cungLienQuan[0];
  const ghep = lapKeHoach({
    cauHoi: cungNguon ? `${cungNguon} ${vao.cauHoi}` : vao.cauHoi,
    saoTheoCung: vao.saoTheoCung,
    tenCachCuc: vao.tenCachCuc,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });
  const keHoach: KeHoachTruyVan = {
    ...ghep,
    chuDe: nguon.keHoach.chuDe,
    chacChan: true,
    // Trục thời gian và ý định: của câu gốc.
    yDinh: goc.yDinh,
    lopHan: goc.lopHan,
    phamViThoiGian: goc.phamViThoiGian,
    namMucTieu: goc.namMucTieu,
    thangMucTieu: goc.thangMucTieu,
  };
  return { keHoach, doiTuong: null, keThuaTu: nguon.cau };
}
