import { doAnToan } from '@/lib/rag/an-toan';

/*
 * Linh vật có phải đứng nghiêm không — luật mục 9 + 12 của
 * docs/chien-luoc/celes-visual-character-system.md: SafetyOverlay != NORMAL
 * thì visualState = SERIOUS và tắt thở.
 *
 * BẤT BIẾN (chủ dự án chốt 02/10/2026):
 *   trạng thái an toàn của linh vật = safety(lượt người dùng MỚI NHẤT)
 *                                  ≠ safety(mức nặng nhất cả hội thoại)
 * Cùng khái niệm "lượt hiện tại" với máy chủ (`doAnToan` chỉ đọc câu đang
 * hỏi). Đừng đổi thành "từng có một câu nặng" — người dùng đã chuyển chủ đề
 * mà Celes vẫn nghiêm mãi là sai, và tạo ra một định nghĩa an toàn thứ hai chỉ
 * sống ở giao diện. Bài kiểm: scripts/test-linh-vat-an-toan.ts.
 *
 * Gọi ngay khi câu vừa gửi đã nằm trong danh sách, nên biết mức TRƯỚC lúc chờ
 * trả lời; tải lại trang thì chạy lại trên hội thoại nạp từ DB.
 */
export function linhVatNghiem(tinNhan: { vaiTro: string; noiDung: string }[]): boolean {
  for (let i = tinNhan.length - 1; i >= 0; i--) {
    if (tinNhan[i].vaiTro === 'nguoi-dung') return doAnToan(tinNhan[i].noiDung).muc !== 'NORMAL';
  }
  return false;
}
