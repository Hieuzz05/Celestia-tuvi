import { createHash } from 'node:crypto';
import type { MucThuVien } from './kieu';

/**
 * Dấu nội dung của một mục thư viện (câu nghĩa + điều kiện) — nhận ra mục khi id bị cấp lại.
 * Đã lưu trong `canCu.thuVien[].dau` của mọi câu V3 viết từ K1, và là khoá của lệnh thu hồi (X3):
 * KHÔNG đổi công thức, đổi là mọi lệnh thu hồi và căn cứ đã lưu mất khớp.
 */
export const dauMuc = (m: Pick<MucThuVien, 'y' | 'dieuKien'>) =>
  createHash('sha1').update(`${m.y}\n${JSON.stringify(m.dieuKien)}`).digest('hex').slice(0, 8);
