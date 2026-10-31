/**
 * Lớp vận hạn (CEL-200) BẬT mặc định từ 31/10/2026 (chủ dự án: "bỏ chặn lưu tứ hoá").
 * `CELES_LOP_HAN=0` là công tắc tắt khẩn cấp, trả về đúng đường cũ.
 * Đọc lúc gọi: thay đổi cờ không bị giữ lại từ lúc nạp mô-đun.
 */
export const lopHanBat = () => process.env.CELES_LOP_HAN !== '0';
