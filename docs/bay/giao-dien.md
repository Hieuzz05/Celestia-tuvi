# Bẫy đã gặp — Giao diện, khách, lá số đang xem

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Kiểm tra giao diện phải dùng trình duyệt thật.** `curl` trả HTML *trước khi JS chạy*, nhìn
  vào đó kết luận là sai. Dùng Chrome headless (`--remote-debugging-port=9333`) rồi điều khiển
  qua CDP. Đã suýt chẩn đoán sai hai lần vì chuyện này.
- **`transform: scale()` + width theo % trong khung `overflow-auto`** tạo vòng lặp layout làm
  treo trình duyệt. Mệnh bàn phải dùng CSS `zoom`.
- **Hồng `#df37a7` chỉ dành cho nút hành động chính**, mỗi khung nhìn đúng một cái. Màu tốt/xấu
  trong mệnh bàn dùng token riêng `--chart-tot` / `--chart-hung`.
- **Vàng kim `#D4AF37` là màu của RIÊNG dấu thương hiệu**, không phải màu hành động. Nền Midnight
  Indigo `#0F172A` chỉ dùng cho biểu tượng ứng dụng và favicon.
- **Phần TỔNG QUAN mở cho khách, chỉ LUẬN GIẢI CHUYÊN SÂU cần tài khoản** (từ 23/09/2026).
  Mệnh bàn đầy đủ và bảng mười hai lĩnh vực hiện cho cả khách; bản đọc sâu, bài dài, luận hạn chi
  tiết, hỏi Celes, lưu lá số vẫn giữ cổng. Khách đọc bảng ở bậc xem trước tất định — `deepMap` của
  bậc `anonymous` là false nên không có lượt gọi model nào cho khách.
- **Đo giao diện cho khách thì chạy với Supabase BẬT và một hồ sơ Chrome sạch.** Mẹo cũ "để trống
  `NEXT_PUBLIC_SUPABASE_*`" biến mọi người thành admin — nó che mất đúng những gì khách thấy. Đã
  trả giá: thanh điều hướng tràn 404px trên iPhone với khách (thêm nút "Đăng nhập") nằm im suốt vì
  mọi lần đo trước đều chạy với Supabase tắt.
- **Không màn nào được tự gọi `danhSachHoSo()` rồi lấy `hoSos[0]`.** Lá số đang xem nằm ở
  `useBoiCanh()`; làm khác đi là đổi lá số ở màn này xong sang màn kia lại thấy người khác.
- **`default_profile_id` và `active_profile_id` là hai thứ khác nhau.** Xem tạm một lá số khác
  KHÔNG được đổi "Lá số của tôi" — chỉ nút "Đặt làm lá số của tôi" mới đổi.
- **Hôm nay đọc `idMacDinh`, không phải `idDangXem`.** Xem tạm lá số khác ở màn khác không được
  làm đổi trang chủ.
- **Trước khi sửa bất kỳ màn nào, xem `NOI-DUNG-TUNG-MAN.md`.** Nó liệt kê từng khối
  trên từng màn là AI viết hay chữ tất định, và bề mặt AI làm mới theo kỳ nào.
  Sửa nhầm tầng là chuyện đã xảy ra: viết lại khuôn câu của một bảng tất định rồi
  tưởng đã "đưa AI vào", trong khi màn đó vẫn không gọi model lần nào.

Hai luật cho web ở màn hẹp, đã đo bằng Chrome ở 390px:
- **Không trang nào được cuộn ngang.** Kiểm bằng `scrollWidth - clientWidth` phải bằng 0.
- **Vùng chạm tối thiểu 44px.** `.nav-link` và `.link-text` dùng `::after` phủ thêm chiều cao ở
  `(pointer: coarse)` — nới padding thì gạch chân chỉ báo trang rời khỏi chữ.
