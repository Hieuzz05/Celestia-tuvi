/**
 * THƯ VIỆN TRI THỨC — kiểu dữ liệu (KIEN-TRUC-LUAN-GIAI.md mục 5–6).
 *
 * Một mục là MỘT phát biểu có điều kiện máy đọc được ("sao A tại cung gốc, gặp B
 * ở tam phương, không có C") kèm một câu nghĩa trung tính và câu trích nguyên văn
 * từ sách. Mục KHÔNG chứa câu văn của bài viết: viết hay là việc của khâu viết.
 *
 * Câu trích nằm trong Supabase, không bao giờ vào repo (repo công khai, sách có
 * bản quyền) — tệp này chỉ định nghĩa hình dạng.
 */

export const SCHEMA_THU_VIEN = 1;

/**
 * Bộ từ vựng quan hệ ĐÓNG, neo vào một cung gốc (mục 5.2). Chỉ những quan hệ
 * engine tính được. Phi hoá (`hoa-den`, `tu-hoa`) đặt chỗ trong tài liệu nhưng
 * CHƯA có ở đây: engine chưa tính, mục nào dùng tới sẽ không bao giờ khớp.
 */
export const QUAN_HE = ['o-cung', 'xung', 'tam-hop', 'tam-phuong', 'giap', 'muon-tu'] as const;
export type QuanHe = (typeof QUAN_HE)[number];

export interface DieuKienSao {
  ten: string;
  quanHe: QuanHe;
  /** Mã độ sáng của engine: M V D B H (phụ tinh chỉ có D / H) */
  doSang?: string[];
}

export interface DieuKienMuc {
  /** Cung gốc được phép neo — rỗng là mọi cung */
  cung: string[];
  /** Chi của cung gốc ("tại Dần Thân") — rỗng là mọi chi */
  chi?: string[];
  sao: DieuKienSao[];
  /**
   * Nhóm "ít nhất k trong số" — sách viết "gặp Kình Đà Hỏa Linh", "hội Tả Hữu Xương Khúc"
   * với nghĩa gặp các sao ấy, KHÔNG phải phải có đủ cả nhóm. Lượt 1 ghi thành điều kiện
   * "có đủ" nên gần như không lá số nào khớp (KIEN-TRUC 11.8).
   */
  nhom?: { ten: string[]; quanHe: QuanHe; toiThieu: number }[];
  /** Phải VẮNG — phá cách, ngoại lệ */
  khong?: { ten: string; quanHe: QuanHe }[];
  thuocTinh?: { tuan?: boolean; triet?: boolean; trangSinh?: string[]; voChinhDieu?: boolean };
  gioiTinh?: 'nam' | 'nu';
}

export type CheDo = 'add' | 'modify' | 'neutralize' | 'override';

export interface CanCuMuc {
  chunkId: string;
  documentId: string;
  /** Câu nguyên văn — đã kiểm tất định là có trong đoạn */
  trich: string;
}

export interface MucThuVien {
  id: string;
  schemaVersion: number;
  chuDe: string[];
  dieuKien: DieuKienMuc;
  /** MỘT câu nghĩa trung tính, ≤ 45 chữ, không "bạn", không lời khuyên */
  y: string;
  nhan: { chieu: 'cat' | 'hung' | 'trung'; muc: 'manh' | 'vua' | 'nhe'; linhVuc: string[] };
  /** Mặc định add; khác add phải có `dich` và chữ trong câu trích nói rõ */
  cheDo: CheDo;
  dich?: string[];
  canCu: CanCuMuc[];
  truongPhai: 'chung' | 'nam-phai' | 'bac-phai' | 'celes';
  duyet: 'chua' | 'da-duyet' | 'bi-bac';
  /** Đợt trích sinh ra mục — số đo độ đúng nằm ở đợt, không ở mục */
  dotTrich: string;
}

/** Tên tất cả sao trong điều kiện (có mặt) của một mục */
export function saoCuaMuc(m: MucThuVien): string[] {
  return [...new Set([...m.dieuKien.sao.map((s) => s.ten), ...(m.dieuKien.nhom ?? []).flatMap((n) => n.ten)])];
}

/** Mục tổ hợp = điều kiện có từ hai sao trở lên */
export function laToHop(m: MucThuVien): boolean {
  return saoCuaMuc(m).length >= 2;
}
