# Bẫy đã gặp — Engine tử vi (lib/tuvi)

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Đổi bất kỳ quy tắc tính nào thì phải tăng `PHUONG_PHAP.phienBan`.** Không tăng thì hai kết quả
  khác nhau cùng mang một nhãn và không ai lần lại được.
- **`cungNguyetHan` nhận tháng ÂM.** Mọi mặc định "tháng này" lấy từ
  `lib/tuvi/bay-gio.ts`, đừng gọi `getMonth() + 1`. Đã từng có bốn chỗ đưa tháng
  dương vào đó, nên Bản đồ và Hành trình ra hai cung nguyệt hạn khác nhau.
