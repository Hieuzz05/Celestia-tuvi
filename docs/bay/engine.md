# Bẫy đã gặp — Engine tử vi (lib/tuvi)

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Đổi bất kỳ quy tắc tính nào thì phải tăng `PHUONG_PHAP.phienBan`.** Không tăng thì hai kết quả
  khác nhau cùng mang một nhãn và không ai lần lại được.
- **`cungNguyetHan` nhận tháng ÂM.** Mọi mặc định "tháng này" lấy từ
  `lib/tuvi/bay-gio.ts`, đừng gọi `getMonth() + 1`. Đã từng có bốn chỗ đưa tháng
  dương vào đó, nên Bản đồ và Hành trình ra hai cung nguyệt hạn khác nhau.
- **`scripts/test-ansao-chuan.ts` đóng băng 60 lá số ở `scripts/mau-ansao.json`.** Engine đổi kết
  quả mà `phienBan` không đổi là CI đỏ — đó chính là luật ở mục đầu, giờ có máy canh. Cố ý đổi
  quy tắc: tăng `phienBan`, chạy lại với `--cap-nhat`, và đọc diff của tệp mẫu trước khi commit.
- **Engine không tự chặn ngày không có thật**: 31/4 lặng lẽ thành 1/5 (số Julian tràn sang tháng
  sau), `Date.parse('1990-04-31')` của V8 cũng vậy. Mọi chỗ nhận ngày sinh từ bên ngoài phải qua
  `laNgayDuongCoThat` (`lib/tuvi/kiem-ngay.ts`) trước khi gọi `lapLaSo`.
