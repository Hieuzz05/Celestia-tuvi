# Bẫy đã gặp — Môi trường: Vercel, biến môi trường, công cụ dòng lệnh

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Biến `NEXT_PUBLIC_*` nhúng lúc build.** Thêm biến xong phải Redeploy và **bỏ tick build
  cache**, không thì bundle phía client vẫn là bản cũ.
- **Hàm trên Vercel Hobby chỉ sống 60 giây** (`TIMEOUT_MS = 55_000`). Model suy luận mạnh như
  `gpt-5.5` viết bài dài mất hơn thế, bị huỷ giữa chừng rồi rơi xuống model sau — nhìn log thấy
  "This operation was aborted". Không phải lỗi mã.
- **Môi trường Bash của harness nuốt một lớp dấu gạch chéo ở MỌI lệnh**, không chỉ heredoc: gõ hai
  gạch chéo + b thì tệp nhận một gạch chéo + b, rồi Python đọc thành ký tự backspace 0x08 nằm im
  trong regex — không bao giờ khớp mà tsc vẫn xanh. Sửa tệp có ký tự thoát thì viết script Python
  bằng công cụ Write rồi chạy, hoặc dùng công cụ Edit. Kiểm bằng cách đếm byte 0x08.
- **Dùng heredoc `<<'PY'` cho script Python thì dấu gạch chéo bị nuốt một lớp**, nên mọi mẫu chứa
  `
` đều không khớp. Sửa tệp có ký tự thoát thì dùng công cụ sửa tệp, đừng dùng heredoc.
