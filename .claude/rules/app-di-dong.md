---
paths:
  - "apps/celes-app/**"
---
## App di động — ĐANG LÀM (GĐ1, từ 27/09/2026)
`apps/celes-app/` (Expo + expo-router) mở lại ngày 27/09/2026: chủ dự án chọn dựng app riêng
(không PWA), iOS trước, một bộ code cho cả Android. Luồng và giao diện ĐÃ DUYỆT nằm trên canvas
"Celes iOS — luồng app" (12 màn, kèm ghi chú token và ba giọng viết). Chốt:
- Từ 29/09/2026 app theo thiết kế **Aurora bản 8** (`docs/thiet-ke/celes-ios/aurora/gen.py`,
  bản dựng thử https://celes-thiet-ke.vercel.app): theme tối mặc định nền `#0B0A0D`, mỗi tab một
  màu vùng, thẻ bo 20 / nút 14, nút chính vẫn gradient `#D32298`, font riêng của app. Web CHƯA
  đổi theo. Lá số hiện ĐẦY ĐỦ như web, mạnh–yếu có biểu đồ radar.
- Năm tab: Hôm nay · Lá số · Celes · Hành trình · Mối quan hệ. Tài khoản mở từ ảnh đại diện.
- Thanh toán TẠM ẨN trên iOS; mở lại thì dùng mua trong app (quy định 3.1.1), không PayOS.
- Làm bản nội bộ trước (Expo Go → TestFlight khi có tài khoản Apple Developer).

Luật màn hẹp (390px không cuộn ngang, vùng chạm ≥ 44px): xem `docs/bay/giao-dien.md`.
Đọc `apps/celes-app/README.md` trước nếu buộc phải sửa app.

Điểm dễ vấp nhất: **app không có bản sao engine an sao**, nó đọc thẳng `lib/tuvi/`
qua `metro.config.js` và bí danh `@tuvi/*`. Sửa engine là cả web lẫn app cùng đổi.
Đừng "tiện tay" sao chép engine sang app.

Web ở gốc kho và app là hai dự án npm tách biệt. `tsconfig.json` và
`eslint.config.mjs` của web đều đã loại trừ `apps/` — nếu thấy `npm run lint` ở
gốc nhảy quá 9 lỗi, kiểm tra xem loại trừ đó còn không.
