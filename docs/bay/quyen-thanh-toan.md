# Bẫy đã gặp — Quyền, trả phí, admin

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Khả năng trả phí phải dựng ở máy chủ.** Bảng luận giải 8 lĩnh vực và luận hạn chi tiết đi qua
  `/api/luan-giai-sau` và `/api/luan-han` chứ không tính trong trình duyệt — ẩn ở giao diện không
  phải phân quyền.
- **Chỉ webhook đã xác thực chữ ký mới mở được quyền.** Đừng bao giờ đọc `status` trên URL trả về
  rồi kết luận đã trả xong.
- **Vai trò admin đọc từ máy chủ, không so email ở trình duyệt.** `/api/entitlements/me` trả về
  `tier: 'admin'`; dùng nó để quyết định HIỆN gì. Email nằm trong tay người dùng, `ADMIN_EMAILS`
  chỉ máy chủ mới biết.
- **Chặn quyền vào `/admin` đã nằm ở `app/admin/layout.tsx`** — server component, chạy trước mọi
  trang con, và in ra đúng email đang đăng nhập khi từ chối. Đừng thêm cổng thứ hai ở tầng page:
  nó không bao giờ chạy tới, mà lại gây hiểu nhầm là chưa có cổng nào.
