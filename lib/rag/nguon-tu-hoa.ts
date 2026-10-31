import type { KeHoachTruyVan } from './planner';
import { boDau } from './thuc-the';
import { coTinHieuThoiGian, hoiLucNay } from './van-han-qua-luot';

/**
 * Sách tứ hoá chỉ làm nguồn cho câu vận hạn (chủ dự án quyết 31/10/2026).
 *
 * Bốn cuốn nạp ngày 26/10 (Tứ Hoá Phái tập 1, 2; Tinh thành tập 2; Phi tinh Lương phái)
 * viết theo lối phi hoá, tứ hoá theo can cung — đúng chỗ cho câu "năm nay / đại vận này",
 * lệch chỗ cho câu luận lá gốc ("tính tôi thế nào"). Chúng chiếm khoảng một phần ba số
 * đoạn trong kho, nên để chung là lấn sách luận lá gốc ở mọi bề mặt.
 *
 * Ngoại lệ: người hỏi nhắc thẳng tứ hoá ("Hóa Kỵ ở Mệnh nghĩa là gì", "phi hoá") thì
 * vẫn được dùng, vì đó là chỗ duy nhất trong kho giảng kỹ về hoá.
 *
 * Nhận sách theo TIÊU ĐỀ, không theo `he_phai`: sau này có thể nạp sách bắc phái không
 * viết về tứ hoá, và sách đó không nên bị giới hạn theo.
 */
const TIEU_DE_SACH_TU_HOA = [/tu hoa phai/, /tinh thanh/, /phi tinh luong phai/];

export function laSachTuHoa(tieuDe: string): boolean {
  const s = boDau(tieuDe);
  return TIEU_DE_SACH_TU_HOA.some((r) => r.test(s));
}

/**
 * "tứ hoá", "tự hoá", "phi hoá", "Hóa Lộc / Quyền / Khoa / Kỵ" — viết có dấu hay không dấu.
 * Bỏ dấu rồi "tự hoà giải", "phí hoá đơn" cũng thành "tu hoa", "phi hoa": loại riêng.
 */
const NHAC_TU_HOA = /(^|[^a-z])(tu hoa(?! (giai|hop|thuan|binh|nha))|phi hoa(?! don)|hoa (loc|quyen|khoa|ky|ki))($|[^a-z])/;

export function nhacTuHoa(cauHoi: string): boolean {
  return NHAC_TU_HOA.test(boDau(cauHoi));
}

/** Lượt này được lấy đoạn từ sách tứ hoá không */
export function choNguonTuHoa(vao: { vanHan: boolean; cauHoi?: string }): boolean {
  return vao.vanHan || (!!vao.cauHoi && nhacTuHoa(vao.cauHoi));
}

/**
 * Kế hoạch truy vấn của chat có phải câu vận hạn không. KHÔNG dựa vào `lopHan`: planner tự
 * thêm lưu niên cho cả câu không mốc thời gian ("tính tôi thế nào"), xem `doanLopHan`.
 * Tính là vận hạn khi người hỏi nói mốc / lớp hạn / "khi nào", hoặc hỏi về lúc này dù không
 * nói mốc ("có nên…", có/không về một chuyện đời) — xem van-han-qua-luot.ts.
 */
export function choNguonTuHoaTheoKeHoach(
  keHoach: Pick<KeHoachTruyVan, 'yDinh' | 'phamViThoiGian' | 'thucThe' | 'namMucTieu' | 'thangMucTieu'>,
  cauHoi: string
): boolean {
  return choNguonTuHoa({ vanHan: coTinHieuThoiGian(keHoach) || hoiLucNay(keHoach, cauHoi), cauHoi });
}
