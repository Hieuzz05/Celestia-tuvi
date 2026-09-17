import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Mã hoá API key trước khi ghi xuống database.
 *
 * Vì sao không cất thẳng: bảng cấu hình model chứa credential của những nhà cung
 * cấp có tính tiền. Nó nằm trong cùng một database mà nhiều người có thể mở bằng
 * dashboard, và bản sao lưu database thì đi xa hơn nữa. Mã hoá bằng một khoá chỉ
 * sống trong biến môi trường của deployment nghĩa là: xem được database không
 * đồng nghĩa với đọc được key.
 *
 * Đây là lớp phòng thủ thứ hai, không phải thứ nhất. Lớp thứ nhất vẫn là RLS bật
 * mà không có policy nào — anon key không chạm được vào bảng.
 *
 * Đánh đổi phải biết trước: **đổi hoặc mất `CONFIG_SECRET` là mọi key đã lưu
 * không giải mã được nữa.** Hậu quả nhẹ (nhập lại key) nhưng phải nói rõ, nên
 * `giaiMa` trả về null thay vì ném lỗi — một key hỏng không được phép làm chết
 * cả danh sách model.
 */

const THUAT_TOAN = 'aes-256-gcm';

function layKhoa(): Buffer | null {
  const bem = process.env.CONFIG_SECRET?.trim();
  if (!bem) return null;
  // Băm để luôn ra đúng 32 byte, bất kể người dùng đặt chuỗi dài ngắn thế nào
  return createHash('sha256').update(bem).digest();
}

export const coKhoaMaHoa = () => layKhoa() !== null;

export class ThieuKhoaMaHoaError extends Error {
  constructor() {
    super(
      'Chưa đặt CONFIG_SECRET nên không lưu được API key. Thêm biến này vào .env.local và Vercel ' +
        '(một chuỗi ngẫu nhiên dài), rồi thử lại. Hệ thống cố ý không lưu key dạng thô.'
    );
    this.name = 'ThieuKhoaMaHoaError';
  }
}

/** Trả về chuỗi `iv.tag.ciphertext`, tất cả base64url */
export function maHoa(van: string): string {
  const khoa = layKhoa();
  if (!khoa) throw new ThieuKhoaMaHoaError();

  const iv = randomBytes(12);
  const bo = createCipheriv(THUAT_TOAN, khoa, iv);
  const du = Buffer.concat([bo.update(van, 'utf8'), bo.final()]);
  return [iv, bo.getAuthTag(), du].map((b) => b.toString('base64url')).join('.');
}

/** null khi chuỗi hỏng, sai khoá, hoặc chưa đặt CONFIG_SECRET */
export function giaiMa(chuoi: string | null | undefined): string | null {
  const khoa = layKhoa();
  if (!khoa || !chuoi) return null;

  const phan = chuoi.split('.');
  if (phan.length !== 3) return null;

  try {
    const [iv, tag, du] = phan.map((p) => Buffer.from(p, 'base64url'));
    const bo = createDecipheriv(THUAT_TOAN, khoa, iv);
    bo.setAuthTag(tag);
    return Buffer.concat([bo.update(du), bo.final()]).toString('utf8');
  } catch {
    // Sai khoá hoặc dữ liệu bị sửa. Không log nội dung — nó là credential.
    return null;
  }
}

/** Dạng rút gọn để hiện trên giao diện. Không bao giờ gửi key đầy đủ ra trình duyệt. */
export function cheKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 10) return '••••';
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
