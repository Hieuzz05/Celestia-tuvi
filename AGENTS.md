<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Celestia — bối cảnh dự án

Web tử vi cá nhân hoá. Deploy: https://celestia-tuvi.vercel.app · Repo: Hieuzz05/Celestia-tuvi

Hướng dẫn vận hành đầy đủ (deploy, biến môi trường, Supabase, bật Google SSO, design system,
cấu trúc trang) nằm ở **`HUONG-DAN.md`** — đọc tệp đó trước khi sửa gì lớn.

## Ba quyết định không được tự đổi

1. **Nam phái làm chuẩn** cho an sao; Bắc phái chỉ dùng đối chiếu khi luận vận hạn.
2. **Ngân sách = 0.** Mọi dịch vụ mới phải nằm trong free tier.
3. **Celestia là thương hiệu, Celes là người dùng trò chuyện cùng.** Người dùng "hỏi Celes",
   không "hỏi AI", không "hỏi Celestia".

## Ngôn ngữ ở mặt trước

Giao diện người dùng **không nhắc**: Nam phái / Bắc phái, "an sao", tên model AI, tên nhà cung
cấp, Copy JSON, trang Quản trị. Những thứ đó chỉ sống ở `/gioi-thieu` (giải thích) hoặc `/admin`
(cấu hình). Lỗi phía AI không được lộ tên model hay quota — người dùng chỉ cần biết dữ liệu của
họ còn nguyên và nên làm gì tiếp.

## Bản đồ mã nguồn

| Việc cần làm | Sửa ở đâu |
|---|---|
| Chữ trong giao diện | `lib/i18n/vi.ts` + `lib/i18n/en.ts` (thiếu khoá bên EN là build đỏ) |
| Lời văn Quick Read (14 chính tinh, 12 cung) | `lib/tuvi/quick-read-noi-dung.ts` |
| Logic đọc lá số ra góc nhìn | `lib/tuvi/quick-read.ts` |
| Giọng và cấu trúc câu trả lời của Celes | `NHAN_CACH_CELES` trong `lib/ai/prompt.ts` |
| Token màu / kiểu chữ / bo góc | `app/globals.css` |
| Component dùng chung | `components/ui/` |
| An sao | `lib/tuvi/ansao.ts` + `lib/tuvi/constants.ts` |

## Bẫy đã gặp — đừng vấp lại

- **Kiểm tra giao diện phải dùng trình duyệt thật.** `curl` trả HTML *trước khi JS chạy*, nhìn
  vào đó kết luận là sai. Dùng Chrome headless (`--remote-debugging-port=9333`) rồi điều khiển
  qua CDP. Đã suýt chẩn đoán sai hai lần vì chuyện này.
- **`transform: scale()` + width theo % trong khung `overflow-auto`** tạo vòng lặp layout làm
  treo trình duyệt. Mệnh bàn phải dùng CSS `zoom`.
- **Biến `NEXT_PUBLIC_*` nhúng lúc build.** Thêm biến xong phải Redeploy và **bỏ tick build
  cache**, không thì bundle phía client vẫn là bản cũ.
- **Gemini 3.x tiêu thinking tokens trong `maxOutputTokens`.** Đặt hạn mức thấp sẽ trả candidate
  rỗng kèm `finishReason: MAX_TOKENS` chứ không báo lỗi.
- **Đừng đoán tên model.** Gọi `GET https://generativelanguage.googleapis.com/v1beta/models` để
  lấy danh sách thật.
- **Hồng `#df37a7` chỉ dành cho nút hành động chính**, mỗi khung nhìn đúng một cái. Màu tốt/xấu
  trong mệnh bàn dùng token riêng `--chart-tot` / `--chart-hung`.

## Kiểm tra trước khi commit

```
npx tsc --noEmit          # phải sạch
npm run build             # phải qua
npm run lint              # ĐANG có sẵn 9 lỗi set-state-in-effect — đừng để tăng thêm
node scripts/test-hover-nhay.mjs   # mệnh bàn không được nhấp nháy khi rê chuột
npm run kiem-tra-sso      # trạng thái đăng nhập Google
```

Nếu lint tăng quá 9, đó là lỗi bạn vừa thêm vào — sửa, đừng bỏ qua.

## App di động

`apps/celes-app/` — Expo + expo-router, iOS/Android. Đọc `apps/celes-app/README.md`
trước khi sửa.

Điểm dễ vấp nhất: **app không có bản sao engine an sao**, nó đọc thẳng `lib/tuvi/`
qua `metro.config.js` và bí danh `@tuvi/*`. Sửa engine là cả web lẫn app cùng đổi.
Đừng "tiện tay" sao chép engine sang app.

Web ở gốc kho và app là hai dự án npm tách biệt. `tsconfig.json` và
`eslint.config.mjs` của web đều đã loại trừ `apps/` — nếu thấy `npm run lint` ở
gốc nhảy quá 9 lỗi, kiểm tra xem loại trừ đó còn không.

## Việc còn dang dở

Xem mục "Trạng thái tính năng" trong `HUONG-DAN.md`. Hai tài liệu định hướng gốc:
`D:\Celestia\Celestia_Product_UX_Commercialization_Report.pdf` và
`D:\Celestia\Celestia_Brand_Product_UX_Master_Spec.pdf` (bản sau thay thế bản trước).

Đang chờ người dùng quyết: (1) gói và giá cho bản trả phí, (2) làm PWA hay dựng app
React Native riêng.
