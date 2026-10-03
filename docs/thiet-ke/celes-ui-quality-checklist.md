# Celes UI Quality Checklist

Soát trước khi coi một màn web là xong. Quyết định gốc: `docs/chien-luoc/cong-cu-thiet-ke-2026-10.md`.

**Chỉ chứa luật không mang gu thẩm mỹ.** Font, bo góc, gradient, kiểu thẻ, màu, bố cục là việc của
design system Celes (`app/globals.css`, `docs/bay/giao-dien.md`), không nằm ở đây. Một luật ở đây
mà buộc phải đổi những thứ đó thì luật sai, không phải design system sai.

Cột **Ai kiểm**:
- **Máy** — `node scripts/test-man-hinh.mjs` đo được, chạy LOCAL với Supabase thật + hồ sơ Chrome
  sạch (đầu tệp có cách chạy). Chưa nằm trong CI.
- **Tay** — người hoặc AI soát, mở ảnh trong `.anh-man-hinh/` hoặc dùng bàn phím trên trình duyệt thật.

## 1. Trạng thái đo

| Luật | Ai kiểm |
|---|---|
| Đo ở trạng thái **khách**. Không để trống `NEXT_PUBLIC_SUPABASE_*`: làm thế ai cũng thành admin và che mất thứ khách thấy (thanh điều hướng tràn 404px, 23/09). | Máy — script dừng nếu tier khác `anonymous` |
| Màn có cổng (hỏi Celes, luận giải sâu): soát cả bản khách thấy (màn chắn) lẫn bản người đã đăng nhập thấy. Bản đăng nhập soát tay. | Tay |

## 2. Bố cục ở màn hẹp

| Luật | Ai kiểm |
|---|---|
| Không trang nào cuộn ngang ở 390 / 820 / 1180 / 1440px. | Máy |
| Khung nhìn đúng bề ngang máy (trang không bị trình duyệt thu nhỏ cho vừa). | Máy |
| Header dính không chiếm quá 1/6 chiều cao màn. | Máy |
| Chữ dài (tên, email, câu tiếng Việt không dấu cách) không làm vỡ khung: có `min-w-0`, xuống dòng hoặc cắt có chủ ý. | Tay — xem ảnh |

## 3. Vùng chạm (chỉ khi `pointer: coarse`)

Hợp đồng nằm ở `app/globals.css` (`.nav-link`, `.link-text`, `.link-action`).

| Luật | Ai kiểm |
|---|---|
| Nút, `.btn-*`, `.link-action`, ô nhập, điều khiển đứng riêng: hộp thật ≥ 44×44px. | Máy — dòng "hộp DOM" |
| `.nav-link`, `.link-text`: vùng bấm là `::after` cao 44px. Không nới padding: gạch chân chỉ báo trang sẽ rời khỏi chữ. | Máy — dòng "::after" |
| Link nằm giữa câu văn: không áp 44px, để giữ nhịp dòng. | Máy bỏ qua có chủ ý |
| Hai vùng chạm cạnh nhau không chồng lên nhau. `::after` của hai link sát nhau có thể chồng; xếp cách ra. | Tay |

## 4. Bàn phím và focus

| Luật | Ai kiểm |
|---|---|
| Mọi thứ bấm được đều tới được bằng Tab, theo thứ tự đọc. | Tay |
| Focus luôn nhìn thấy: dùng `:focus-visible` toàn cục, không `outline: none` mà thiếu thay thế. | Tay |
| Menu, hộp thoại: Esc đóng được, focus quay về nút đã mở nó. Panel đóng thì không còn trong luồng Tab (dựng khi mở, không giấu bằng CSS). | Tay |
| Không dùng `div`/`span` có `onClick` làm nút. Dùng `button` hoặc `a`. | Tay |

## 5. Ngữ nghĩa và trợ năng

| Luật | Ai kiểm |
|---|---|
| Hành động là `button`, điều hướng là `a`/`Link`. Mỗi trang có đúng một `h1`, các cấp tiêu đề không nhảy cóc. | Tay |
| Nút chỉ có biểu tượng phải có `aria-label`. Biểu tượng trang trí có `aria-hidden`. | Tay |
| Ô nhập có `label` gắn đúng ô. Placeholder không thay cho label. | Tay |
| Ảnh có `alt`. Ảnh trang trí dùng `alt=""`. | Tay |
| Tương phản chữ thường ≥ 4.5:1, chữ lớn và biểu tượng ≥ 3:1, ở CẢ theme sáng lẫn tối. | Tay |
| Không truyền nghĩa chỉ bằng màu (tốt/xấu trong mệnh bàn có chữ hoặc ký hiệu kèm). | Tay |

## 6. Trạng thái

| Luật | Ai kiểm |
|---|---|
| Mỗi khối có dữ liệu đều có đủ: đang tải · rỗng · lỗi · có dữ liệu. | Tay |
| Khối chờ giữ chỗ gần bằng nội dung thật. CLS (cửa sổ phiên lớn nhất) ≤ 0,1. | Máy — đo trên `next dev` |
| Lỗi nói người dùng nên làm gì tiếp, không lộ tên model, nhà cung cấp hay quota (AGENTS.md "Ngôn ngữ ở mặt trước"). | Tay |
| Nút đang gửi thì khoá lại, không cho bấm hai lần. | Tay |

## 7. Chuyển động

| Luật | Ai kiểm |
|---|---|
| Mọi chuyển động có nhánh `@media (prefers-reduced-motion: reduce)` tắt hoặc giảm nó. | Tay |
| Chỉ chuyển động `transform`/`opacity`. Không `transition: all`. | Tay |
| Rê chuột không làm đổi kích thước bố cục (mệnh bàn từng nhấp nháy). | Máy — `scripts/test-hover-nhay.mjs` |

## Khi thêm luật

Chỉ thêm luật đến từ một lỗi đã lọt hoặc một chuẩn trung tính (WCAG, nền tảng). Luật đo được thì
thêm phép đo vào `test-man-hinh.mjs` và đổi cột thành "Máy". Một số luật ở mục 4–7 viết lại theo ý
từ Vercel Web Interface Guidelines (https://github.com/vercel-labs/web-interface-guidelines, giấy
phép MIT); không chép nguyên văn.
