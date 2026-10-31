import type { TinNhan } from '@/lib/ai/prompt';
import type { KeHoachTruyVan } from './planner';
import { lopHanBat } from './co-lop-han';

/**
 * Vận hạn qua lượt (chủ dự án yêu cầu 31/10/2026).
 *
 * "Năm 2027 công việc tôi thế nào?" rồi "Vậy còn tình cảm?": lượt hai không có mốc
 * nào, planner đọc riêng câu đó nên rơi về năm đang xem — người hỏi đang hỏi 2027.
 * Lượt hai được nhận trục thời gian của câu gốc khi và chỉ khi:
 *
 *  1. câu hiện tại KHÔNG tự có tín hiệu thời gian (có thì tin câu hiện tại), và
 *  2. câu hiện tại mở hoặc kết bằng từ nối rõ ràng ("vậy còn…", "còn…", "…thì sao?").
 *
 * KHÔNG dùng `laCauNoiTiep` của tiep-noi.ts: nó coi mọi câu ≤5 chữ là nối tiếp, nên
 * "Tính tôi thế nào?" sau câu về 2027 sẽ bị luận theo 2027. Và không dò "con " không
 * dấu: "Con tôi học thế nào?" là câu mới về con cái.
 *
 * Câu gốc: lùi qua các câu người dùng cũng là câu nối (tối đa 4), tới câu đầu tiên
 * không phải câu nối. Câu đó có tín hiệu thời gian thì kế thừa, không thì thôi.
 */
const NOI_DAU = /^\s*(?:(?:vậy|thế|vay|the)\s+(?:còn|con|thì|thi)(?=[\s,?]|$)|còn\s)/i;
const NOI_CUOI = /\bth[iì]\s+sao\s*[?？.!]*\s*$/i;

export function laCauNoiRo(cauHoi: string): boolean {
  return NOI_DAU.test(cauHoi) || NOI_CUOI.test(cauHoi);
}

const THUC_THE_HAN = new Set(['PERIOD.LUU_NIEN', 'PERIOD.DAI_VAN', 'PERIOD.NGUYET_HAN']);

/** Người hỏi tự nói mốc / lớp hạn / "khi nào" — KHÔNG đọc `lopHan` (planner tự thêm lưu niên cho mọi câu) */
export function coTinHieuThoiGian(
  keHoach: Pick<KeHoachTruyVan, 'yDinh' | 'phamViThoiGian' | 'thucThe' | 'namMucTieu' | 'thangMucTieu'>
): boolean {
  return (
    keHoach.phamViThoiGian !== 'khong-ro' ||
    keHoach.yDinh === 'thoi-diem' ||
    keHoach.namMucTieu !== undefined ||
    keHoach.thangMucTieu !== undefined ||
    keHoach.thucThe.some((t) => THUC_THE_HAN.has(t.id))
  );
}

/**
 * Câu hỏi về lúc này dù không nói mốc: "Có nên đổi việc không?" (ai hỏi "có nên" cũng
 * hỏi cho bây giờ), "Tôi có nhảy việc không?" (một chuyện đời sắp tới). Câu có/không
 * về một sao, cung, cách cục, hoá ("Tử Vi ở Mệnh có tốt không?") là câu lá gốc.
 * Planner đã kéo đại vận + lưu niên cho cả hai loại (doanLopHan); hàm này chỉ dùng để
 * quyết nguồn sách tứ hoá.
 */
const THUC_THE_LA_GOC = new Set(['STAR', 'PALACE', 'FORMATION', 'TRANSFORMATION', 'MARKER']);

/**
 * Câu hỏi về bản tính, độ hợp, duyên số ("Tôi có hợp kinh doanh không?", "Vậy còn tính
 * cách tôi thì sao?"): đọc lá gốc, không mang năm. Planner không có thực thể nào cho
 * chúng, nên phải dò bằng chữ. Chỉ dùng để LOẠI, không để nhận câu vận hạn.
 */
const HOI_BAN_TINH = /(?<!\p{L})(?:hợp|tính|duyên|bản chất|thiên hướng|năng khiếu|tố chất)(?!\p{L})/iu;

export function hoiLucNay(keHoach: Pick<KeHoachTruyVan, 'yDinh' | 'thucThe'>, cauHoi = ''): boolean {
  if (keHoach.yDinh === 'quyet-dinh') return true;
  return keHoach.yDinh === 'co-khong' && !HOI_BAN_TINH.test(cauHoi) && !keHoach.thucThe.some((t) => THUC_THE_LA_GOC.has(t.loai));
}

const SO_CAU_LUI = 4;

/**
 * Trả kế hoạch đã nhận trục thời gian của câu gốc, hoặc nguyên kế hoạch nếu không kế thừa.
 * `lapLai` lập kế hoạch cho một câu cũ với cùng năm / tháng đang xem.
 */
export function keThuaVanHan(
  keHoach: KeHoachTruyVan,
  cauHoi: string,
  lichSu: readonly TinNhan[],
  lapLai: (cau: string) => KeHoachTruyVan
): KeHoachTruyVan {
  // Cờ tắt khẩn cấp (CELES_LOP_HAN=0) thì trả đúng đường cũ
  if (!lopHanBat() || coTinHieuThoiGian(keHoach) || !laCauNoiRo(cauHoi)) return keHoach;
  // "Vậy còn tính cách tôi thì sao?" sau câu 2027: bản tính không mang năm
  if (keHoach.chuDe === 'tong-quan' || HOI_BAN_TINH.test(cauHoi)) return keHoach;

  const cauCu = lichSu.filter((t) => t.vaiTro === 'nguoi-dung').map((t) => t.noiDung.trim());
  if (cauCu.at(-1) === cauHoi.trim()) cauCu.pop();

  for (const cau of cauCu.slice(-SO_CAU_LUI).reverse()) {
    const goc = lapLai(cau);
    if (coTinHieuThoiGian(goc)) {
      return {
        ...keHoach,
        ...(keHoach.yDinh === 'mo-ta' ? { yDinh: goc.yDinh } : {}),
        lopHan: goc.lopHan,
        phamViThoiGian: goc.phamViThoiGian,
        ...(goc.namMucTieu === undefined ? {} : { namMucTieu: goc.namMucTieu }),
        ...(goc.thangMucTieu === undefined ? {} : { thangMucTieu: goc.thangMucTieu }),
      };
    }
    if (!laCauNoiRo(cau)) break;
  }
  return keHoach;
}
