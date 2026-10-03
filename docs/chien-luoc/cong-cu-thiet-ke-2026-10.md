# Công cụ thiết kế cho AI — quyết định 03/10/2026

Câu hỏi: 5 công cụ trong bài https://cuongmeai.com/tai-lieu/5-cong-cu-design-claude-code có giúp
Celes không. Qua hai vòng `phan-bien`, đối chiếu thêm một bản phân tích của AI khác do chủ dự án
mang vào. Chủ dự án chốt ngày 03/10/2026.

## Quyết định

1. **Không cài công cụ nào trong 5.** Bộ kiểm giao diện của Celes là chính những lỗi đã lọt, biến
   thành phép đo tự động. Không thêm "AI design skill" nào.
2. **Chưa thêm chế độ "khách giả lập" vào code quyền.** Đo giao diện vẫn chạy LOCAL với Supabase
   thật và một hồ sơ Chrome sạch. Đưa bài đo giao diện vào CI là bài toán riêng, làm sau, khi có
   cách dựng dữ liệu thử ở biên hệ thống (ví dụ Supabase cục bộ). Không thêm kiểu
   `if (E2E_GUEST)` vào logic phân quyền production.
3. **Mở một phiên `[CODE]`** để sửa `scripts/test-man-hinh.mjs` và viết checklist a11y, theo thứ tự:
   - P1. Bắt buộc đo ở trạng thái khách: bỏ hướng dẫn "để trống `NEXT_PUBLIC_SUPABASE_*`".
   - P2. Dừng ngay, báo lỗi rõ, nếu trang đang ở trạng thái admin hoặc đã đăng nhập thay vì khách.
   - P3. Chụp ảnh bằng CDP (`Page.captureScreenshot`) theo từng trang × cỡ màn, để AI xem lại.
   - P4. Đo vùng chạm theo đúng hợp đồng của design system:
     - nút, `.link-action`, điều khiển độc lập: đo hộp thật ≥ 44px;
     - `.nav-link` / `.link-text` khi `pointer: coarse`: kiểm `::after` cao 44px
       (`app/globals.css` khoảng dòng 475), vì hộp chữ chỉ 30–34px;
     - link nằm giữa đoạn văn: không áp luật 44px.
   - P5. Đo CLS bằng `PerformanceObserver('layout-shift')` nếu không làm phình phạm vi. Ảnh tĩnh
     không bắt được CLS.
   - Checklist tên "Celes UI Quality Checklist". Chỉ giữ luật không mang gu thẩm mỹ: focus-visible,
     bàn phím, ngữ nghĩa thẻ, label/lỗi/đang tải, reduced motion, vùng chạm, tràn ngang, tương phản,
     trạng thái. Font, bo góc, gradient, kiểu thẻ, bố cục do design system Celes quyết.
   - Chưa đưa vào CI. Chưa cài Playwright.

## Từng công cụ, vì sao loại

| Công cụ | Kết luận | Lý do |
|---|---|---|
| Taste Skill (bản mặc định) | Không cài | Mặc định thêm Motion/GSAP, bản v2 còn ghi experimental. "Gu" riêng của nó chọi với luật màu Celes. |
| Taste `redesign-existing-projects` | Không cài | Là skill SỬA code ("Diagnose → Fix → Apply targeted upgrades"), không phải skill chỉ review. Bước đầu tiên là "font swap". Nó gắn cờ "Inter everywhere", gradient, pill badge, mà cả ba là lựa chọn cố ý của Celes. Cấm hết những thứ đó thì phần còn lại đã có trong `docs/bay/giao-dien.md`. Heuristic trung tính thì chép vào checklist. |
| Web Design Guidelines (Vercel) | Không cài, chép một phần | Mỗi lần chạy lại tải bộ quy tắc mới từ GitHub, nên kết quả không tái lập được. Lấy các luật phù hợp vào checklist cố định trong git, giữ thông báo bản quyền (repo `vercel-labs/web-interface-guidelines` ghi MIT, chưa đọc toàn văn LICENSE). |
| Awesome DESIGN.md | Không dùng | Là bản sắc của thương hiệu khác, không có thương hiệu tâm linh nào. Một DESIGN.md riêng cho Celes sẽ thành nơi thứ ba chép luật, sau `globals.css` và `docs/bay/giao-dien.md`. |
| Image to Code | Chưa cần | Celes đã dựng thiết kế trước bằng canvas HTML rồi chụp (`docs/thiet-ke/celes-ios/aurora/gen.py`, `shot.sh`). Có thể xét lại khi làm một phần hoàn toàn mới. |
| Playwright CLI | Chưa cài | CDP tự viết đã điều hướng, chạy JS, giả lập thiết bị được, thêm chụp ảnh không khó. Cài thì phải sửa `package.json`, vùng dùng chung của hai máy. Xét lại khi cần luồng nhiều bước (form, modal, focus bằng bàn phím, cây trợ năng). Muốn thử tạm thì chạy gói `@playwright/cli` (lệnh `playwright-cli`) qua npx với phiên bản cố định, không thêm vào `package.json`. |

## Phương án đã loại và vì sao

- **Đưa Supabase thật vào CI** (thêm URL và anon key làm secret): biến bài đo giao diện thành bài
  kiểm tích hợp mạng. CI có thể đỏ vì Supabase chậm hay mạng lỗi trong khi CSS vẫn đúng. Nó cũng phá
  nguyên tắc `kiem-tra.yml`: offline, không secret.
- **Khách giả lập offline bằng một cờ trong code quyền**: khi không có Supabase, ba chỗ trả quyền
  admin (`lib/support/entitlements.ts:90`, `lib/auth/cong.ts:29`, `lib/auth/gioi-han-khach.ts:68`).
  Thêm nhánh giả lập vào vùng quyền là việc lớn, và có rủi ro cờ vô tình bật trên production.
- **Viết script chụp màn hình mới**: trùng `test-man-hinh.mjs`, vốn đã đo 390/820/1180/1440 và đo
  tràn ngang.

## Dữ kiện có nguồn (quét 03/10/2026)

- Lỗi đã lọt: thanh điều hướng tràn 404px với khách (23/09, do đo với Supabase tắt). CLS 0,34 ở
  `/la-so` (27/09). Nguồn: `docs/bay/giao-dien.md`.
- `test-man-hinh.mjs` trên main vẫn ghi "để trống `NEXT_PUBLIC_SUPABASE_*`", ngược với
  `docs/bay/giao-dien.md`. Script chưa đo CLS, chưa chụp ảnh.
- Runner Ubuntu 24.04 của GitHub có sẵn Chrome
  (https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md). Repo
  công khai nên phút Actions miễn phí. Dùng khi làm bài toán CI sau này.
- `redesign-existing-projects`:
  https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/redesign-skill/SKILL.md
- Playwright CLI: https://github.com/microsoft/playwright-cli (Apache-2.0, cài được local hoặc global).
- Lệnh `npx skills add` (vercel-labs/skills) có gửi telemetry ẩn danh, tắt bằng `DISABLE_TELEMETRY=1`.
