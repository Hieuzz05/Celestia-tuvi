# Rà soát Core Web Vitals Celestia — 27/09/2026 (CEL-150)

Nối tiếp `UIUX-RA-SOAT-2026-09-24.md`. Bản 24/09 đo trên máy, không mạng, không giảm tốc
(LCP 32–700ms) — đúng kỹ thuật nhưng không phản ánh người dùng thật. Bản này đo **production
thật** (`celestia-tuvi.vercel.app`) bằng Lighthouse 12, mobile mô phỏng (Moto G Power, CPU chậm
4×, ~1,6 Mbps, RTT 150ms), 6 trang × trình duyệt tiếng Anh (mặc định của Lighthouse /
PageSpeed Insights) và tiếng Việt. Số lab, không phải CrUX (trang chưa đủ lượt truy cập).

## 1. Trước → sau (production, mobile, trình duyệt tiếng Anh)

| Trang | Perf | LCP | CLS |
|---|---|---|---|
| `/` | 82 → 88 | 4,3s → **1,6s** | 0 → 0,192 ⚠️ (xem mục 3) |
| `/la-so` | 71 → 88 | 3,9s → 3,4s | **0,343 → 0** |
| `/dang-nhap` | 80 → **97** | 4,9s → **2,2s** | 0 → 0,016 |
| `/gioi-thieu` | 88 → **98** | 3,7s → **2,0s** | 0,014 → 0,014 |
| `/home` | 80 → 91 | 3,8s → 3,4s | 0,187 → 0,008 |
| `/hoi-dap` | 86 → 95 | 3,5s → 2,9s | 0,131 → 0,001 |

Trình duyệt tiếng Việt (đa số người dùng): `/` Perf 96, LCP 2,6s, CLS 0; `/gioi-thieu` 98;
`/dang-nhap` 97; `/la-so` 84 (LCP 3,8s).
**Accessibility, Best Practices, SEO: 100 ở cả 12 lượt** (trước: 98 / 96 / 90).

## 2. Nguyên nhân tìm ra và đã sửa

| Vấn đề | Nguyên nhân | Sửa |
|---|---|---|
| LCP 3,5–4,9s với trình duyệt EN | Server render tiếng Việt, sau hydrate `NgonNguProvider` đổi sang tiếng Anh → chữ LCP vẽ lại lúc JS chạy xong | **Chưa sửa tận gốc** — mục 3 |
| Font ~240KB / trang | `next/font/google` khai báo bộ ký tự chồng nhau; ă/đ/ơ/ư kéo file latin-ext (Inter 85KB) | Font tự phục vụ `app/fonts/`, 1 file latin+Việt / họ chữ → 116KB; cắt lại bằng `scripts/cat-font.py` |
| Font trang trí tranh băng thông | Permanent Marker, JetBrains Mono preload ở mọi trang | `preload: false` |
| CSS chặn hiển thị ~150ms | Tệp CSS `<link>` | `experimental.inlineCss` |
| supabase-js 67KB trong gói đầu mọi trang | import tĩnh ở `lib/supabase/client.ts` | `laySupabaseClient()` nạp khi cần |
| Engine an sao trong gói trang chủ | Lá số mẫu tính ở trình duyệt | Người mẫu đầu tính sẵn ở máy chủ, người khác nạp engine khi bấm |
| CLS 0,34 `/la-so`, 0,13 `/hoi-dap` | Khung chờ thấp → chân trang trong màn bị đẩy xuống | `main` `min-h-svh`; khung chờ `/la-so` cao một màn |
| CLS `/dang-nhap` | Nút SSO chèn trên form sau khi hỏi Supabase; nút Quay lại `fallback={null}` | Giữ chỗ cỡ một nút; fallback là chính cái nút |
| CLS 0,18 `/home` | Thẻ khách hiện sau khi đọc phiên, đẩy "Đi tiếp từ đây" | Khung giữ chỗ 208px |
| Lỗi 401 console `/la-so` | Luôn gọi `/api/diem-noi-bat` kể cả khách — và bài này chỉ hiện ở nhánh bảng cũ | Chỉ gọi khi đăng nhập **và** thẻ đó thật sự hiện (bớt 1 lượt model/ngày/lá số) |
| Tương phản chữ hồng | #df37a7 chỉ 4,01:1 trên trắng, 3,32:1 trên nền hồng nhạt; Đêm 4,39:1 | Token `--accent-chu` (#b62b8b Ngày, #e55bb7 Đêm) ≥ 4,69:1 |
| Thứ bậc tiêu đề h1 → h3 | `GocNhinCard` gắn cứng h3; tiêu đề khối `/la-so` là `<p>` | `cap="h2"` cho `GocNhinCard` / `Eyebrow` |
| Nhãn nút ngôn ngữ ≠ chữ hiện | `aria-label="Ngôn ngữ"`, chữ hiện "VI" | aria-label chứa "VI" (WCAG 2.5.3) |
| Chữ liên kết không mô tả | Nút header "Start" | Phần mô tả ẩn "your free chart" |
| Không sitemap / robots | — | `app/sitemap.ts`, `app/robots.ts` (URL gốc ở `lib/trang-web.ts`) |

## 3. Còn lại — cần chủ dự án quyết

1. **Đổi Việt→Anh sau hydrate** (trình duyệt tiếng Anh, gồm PageSpeed Insights): CLS 0,19 ở trang
   chủ, LCP các trang bị đẩy về lúc JS chạy xong. Hai cách:
   - **Tách route `[lang]`** theo mẫu chính thức Next.js (`app/[lang]/…`, render tĩnh cả `vi`/`en`,
     `proxy.ts` rewrite ngầm theo cookie / Accept-Language — URL không đổi, vẫn phát từ CDN).
     Phải chuyển mọi thư mục trang vào `app/[lang]/` — bước này bị chặn quyền ở chế độ tự động.
   - Hoặc đổi hành vi: lần đầu không tự đổi sang tiếng Anh, hiện một gợi ý cố định "View in English?"
     (không gây dịch bố cục). Trái spec "mặc định theo locale thiết bị".
2. **LCP trang cần dữ liệu phía trình duyệt** (`/la-so` 3,4–3,8s, `/home` 3,2–3,4s, `/hoi-dap`
   2,9–3,1s): nội dung chính chỉ vẽ sau khi hydrate + gọi API (function chạy ở `iad1`, Mỹ).
   Hướng: render phía server phần đầu `/la-so` (lá số + bài tổng quan đã có trong đệm).
3. Function Vercel chạy ở `iad1` (Mỹ) trong khi người dùng ở Việt Nam: mỗi API / trang động thêm
   ~300–500ms. Cân nhắc đổi region sau khi xem Supabase đặt ở đâu.
4. `proxy.ts` gọi `supabase.auth.getUser()` ở mọi request của người đã đăng nhập.

## 4. Cách đo lại

Lighthouse: `npx lighthouse@12 <url> --form-factor=mobile --throttling-method=simulate`, thêm
`--chrome-flags="--lang=vi-VN --accept-lang=vi-VN,vi"` để đo trình duyệt tiếng Việt. Đo trên máy
(`next start`) dùng gzip nên phạt `inlineCss` (CSS nằm 3 lần trong HTML); Vercel dùng brotli —
lấy số production làm chuẩn.
