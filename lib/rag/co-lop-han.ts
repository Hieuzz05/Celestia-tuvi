/** Đọc lúc gọi: thay đổi cờ không bị giữ lại từ lúc nạp mô-đun. */
export const lopHanBat = () => process.env.CELES_LOP_HAN === '1';
