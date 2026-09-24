# Rà soát UI/UX Celestia — 24/09/2026

Phạm vi: 11 màn người dùng (trang chủ, cách hoạt động, nhập lá số, lá số, khám phá chủ đề, luận giải chuyên sâu, hỏi Celes, kết nối, hành trình, đăng nhập, ủng hộ) × 2 khung (mobile 390×844 có chạm, desktop 1440×900). Đo trên bản build production chạy máy, Chrome headless tiếng Việt, **khách chưa đăng nhập**; các màn sau đăng nhập chụp thêm bằng phiên giả lập ở phía giao diện (không commit).

Công cụ đo nằm ngoài repo (scratchpad): `audit.mjs` (chỉ số dưới đây), `cls.mjs` (nguồn layout shift), đo tương phản bằng pixel ảnh chụp.

## 1. Chỉ số định lượng — trước → sau

| Chỉ số | Chuẩn | Trước | Sau |
|---|---|---|---|
| Tràn ngang (22 lượt đo) | 0 | 0 | 0 |
| Vùng chạm < 24px (WCAG 2.5.8 AA), tổng 22 lượt | 0 | **102** | **11** (còn logo/ link desktop) |
| Vùng chạm 24–44px (Apple HIG / WCAG 2.5.5 AAA) | giảm | 98 | 94 |
| Nút đổi năm trên mệnh bàn | ≥ 44×44 | **5×44px** | 44×44 |
| Header mobile: chiều cao | ≤ 80px | **132px** (nút "Bắt đầu miễn phí" gãy 4 dòng) | 76px |
| Trang thiếu H1 | 0 | **6** (mọi cổng đăng nhập) | 0 |
| Số `<title>` khác nhau / 11 màn | 11 | **4** | 10 |
| CLS /la-so desktop (ngưỡng tốt ≤ 0,1) | ≤ 0,1 | **0,238** | 0,109 |
| CLS /la-so mobile | ≤ 0,1 | 0 | 0 |
| CLS các màn khác | ≤ 0,1 | ≤ 0,017 | ≤ 0,018 |
| LCP (máy, build prod) | ≤ 2,5s | 40–530ms | 32–700ms |
| Nút hồng (primary) trong màn đầu trang chủ | 1 | **2** (header + hero) | 1 |
| Tương phản microcopy hero (đo pixel) | ≥ 4,5 | 5,5:1 | 7,5:1 |

Ghi chú trung thực: script đo tương phản báo 2,78:1 cho microcopy ở hero — **báo nhầm** (nền là gradient, script đọc nhầm nền tối của trang). Đo pixel thật thì bản cũ đã đạt 5,5:1; bản mới 7,5:1.

Chưa cải thiện: **chữ < 12px trên mệnh bàn mobile (149 cụm chữ)**. Mười hai cung trên bề ngang 342px không có cách nào hiện chữ cỡ đọc được; hướng hiện tại là mệnh bàn làm bản đồ, chạm một cung mở ngăn chi tiết cỡ chữ thật. Đề xuất tiếp theo ở mục 5.

## 2. Usability — tác vụ của người mới

| Tác vụ | Trước | Sau |
|---|---|---|
| T1. Từ trang chủ lập lá số đầu tiên | 4 bước, ~8 lần chạm | không đổi |
| T2. Đọc "Điểm nổi bật" trên mobile sau khi lập lá số | cuộn ~1,7 màn qua mệnh bàn chữ 9px mới tới | **hiện ngay màn đầu**; mệnh bàn có lối "Xem bàn 12 cung ↓" |
| T3. Khách bấm Khám phá / Hỏi Celes / Kết nối / Hành trình | một thẻ chữ chung: "Tiếp tục cuộc trò chuyện" (chưa từng trò chuyện), "bản đồ bạn vừa lập sẽ được giữ" (chưa lập), không H1, không lối đăng nhập cho người đã có tài khoản | tiêu đề đúng tính năng (H1), 3 điều người dùng nhận được, "Đã có tài khoản? Đăng nhập" |
| T4. Từ lá số sang Khám phá theo chủ đề (mobile) | form 5 ô chiếm trọn màn đầu; ô giờ hiện **sai "giờ Tý"** cho lá số giờ Mão | form thu thành 1 dòng tóm tắt, danh sách chủ đề hiện ngay; giờ hiện đúng |
| T5. Xem năm khác trên mệnh bàn | nút "‹ ›" 5px | nút 44×44 |
| T6. Người sinh 0 giờ mở lá số từ đường dẫn | **bị lập thành 9 giờ (giờ Tỵ)** — lá số khác hẳn | đúng giờ Tý |

## 3. Chấm theo 10 heuristic Nielsen (1–5, chấm bằng quan sát + số đo)

| Heuristic | Trước | Sau | Căn cứ chính |
|---|---|---|---|
| 1. Hiển thị trạng thái | 3 | 4 | "Lần đầu mất nửa phút" hiện cả khi đọc từ đệm → nay chỉ hiện khi chờ > 3s; khung chờ giữ chỗ |
| 2. Khớp với đời thực | 3 | 4 | ô giờ hiện sai giờ sinh; chip mẫu "1 2 3" vô nghĩa → "Nam · 2000"… |
| 3. Kiểm soát & tự do | 3 | 4 | lối tắt xuống mệnh bàn, lối đăng nhập trong cổng |
| 4. Nhất quán | 3 | 4 | cùng một cụm chữ cho 4 cổng khác nhau; hai nút hồng một màn |
| 5. Phòng lỗi | 2 | 4 | giờ 0 → 9; ô giờ hiện Tý khiến người dùng tự chọn lại thành sai |
| 6. Nhận ra hơn nhớ | 3 | 4 | form đã điền thu gọn thành tóm tắt thay vì bày lại 5 ô |
| 7. Linh hoạt | 3 | 3 | chưa đổi |
| 8. Tối giản | 3 | 4 | header mobile 132 → 76px; thẻ lớn 20px/17 dòng → 16px trên mobile |
| 9. Nhận diện lỗi | 3 | 3 | chưa đổi |
| 10. Trợ giúp | 3 | 3 | chưa đổi |

## 4. Đã sửa (nhánh `viec/uiux-ra-soat`)

- Header: CTA không xuống dòng, nhãn ngắn trên mobile; trang chủ dùng nút viền trên header (hero giữ nút chính).
- Cổng đăng nhập chế độ `toanTrang`: H1, lợi ích cụ thể theo tính năng, lối đăng nhập, bỏ câu nói sai.
- /la-so: mobile bài đọc trước mệnh bàn, lối "Xem bàn 12 cung ↓"; thẻ lớn nhỏ hơn H1 một bậc, 16px trên mobile; khung chờ giữ chỗ; đọc URL lúc khởi tạo (hết màn trống rồi nhảy); đo mệnh bàn trước khi vẽ (useLayoutEffect).
- Mệnh bàn: nút năm 44×44; "In" thật sự ẩn trên mobile.
- Form: ô giờ quy về đúng khung chi (`veKhungGio`); sửa `|| 9` làm mất giờ 0 ở /la-so và /luan-giai.
- Gộp nhánh `viec/mobile-adaptive` (CEL-112, chưa từng gộp): `useManHep`, `KhoiGap` — Khám phá thu form thành tóm tắt.
- Tiêu đề tab riêng cho 8 route client.
- Vùng chạm ≥ 44px cho link đứng riêng (Muốn biết vì sao, chân trang, đăng nhập, trang chủ).
- Phát hiện kỹ thuật: `.link-action` đặt `display` NGOÀI layer nên thắng mọi `hidden`/`lg:hidden` của Tailwind gắn cùng phần tử — muốn ẩn thì bọc ngoài.

## 5. Đề xuất tiếp (chưa làm)

1. Mệnh bàn mobile: chế độ "danh sách 12 cung" (mỗi cung một thẻ chữ cỡ thật, cung Mệnh/Thân lên đầu) thay cho lưới 4×4 chữ 9px.
2. Hỏi Celes mobile: thu form khi đã có lá số trong phiên (hiện chỉ thu khi đã chọn lá số).
3. Onboarding 4 bước: cho phép bỏ qua bước "Điều gì đưa bạn đến đây" (không ảnh hưởng tính toán).
4. CLS /la-so desktop còn 0,109 — phần còn lại là chân trang dịch khi lá số dựng xong; giữ chỗ chiều cao cột mệnh bàn.
5. Chạy usability test thật 5 người mới (tác vụ T1–T6) để có SUS; số ở mục 3 là đánh giá chuyên gia, không thay test thật.
