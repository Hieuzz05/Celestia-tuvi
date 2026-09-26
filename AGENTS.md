<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Celestia — bối cảnh dự án

Web tử vi cá nhân hoá. Deploy: https://celestia-tuvi.vercel.app · Repo: Hieuzz05/Celestia-tuvi

> **Dự án này do HAI AI trên HAI máy cùng phát triển.** Đọc **`AI-PHOI-HOP.md`**
> trước tiên: nhánh nào được đẩy, vùng nào của ai, xử lý xung đột ra sao, và luật
> viết SQL khi hai máy dùng chung một database. Bỏ qua tệp đó là sớm muộn ghi đè
> mất việc của máy kia.

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
| Dòng thời gian Hành trình | `lib/tuvi/hanh-trinh.ts` |
| Luận hạn chi tiết (tầng hai của Hành trình) | `lib/tuvi/luan-han.ts` |
| Bảng luận giải 8 lĩnh vực | `lib/tuvi/luan-giai-sau.ts` |
| Bộ quy tắc tính + phiên bản | `lib/tuvi/phuong-phap.ts` |
| Lá số đang xem / lá số của tôi / bản nháp | `lib/store/boi-canh.tsx` |
| Hạn mức, bậc quyền, cổng ủng hộ | `lib/support/` + `supabase/schema-support.sql` |
| Con số thương mại (hạn mức, mức tiền) | `lib/support/config.ts` — đọc từ biến môi trường |
| Dấu thương hiệu (web) | `components/Logo.tsx` — `app/icon.svg` phải sửa theo |
| Giọng và cấu trúc câu trả lời của Celes | `NHAN_CACH_CELES` trong `lib/ai/prompt.ts` |
| Token màu / kiểu chữ / bo góc | `app/globals.css` |
| Component dùng chung | `components/ui/` |
| An sao | `lib/tuvi/ansao.ts` + `lib/tuvi/constants.ts` |

## Luật theo vùng — đọc TRƯỚC khi sửa

Các bẫy đã gặp nằm ở `docs/bay/`, tách theo vùng để không nạp vào mọi lượt:

| Sửa vùng này | Đọc trước |
|---|---|
| `app/**` giao diện, `components/**`, `lib/store/**`, `lib/i18n/**` | `docs/bay/giao-dien.md` |
| `lib/support/**`, `app/api/webhooks/**`, `app/api/support/**`, `app/admin/**` | `docs/bay/quyen-thanh-toan.md` |
| `lib/tuvi/**`, `apps/celes-app/**` | `docs/bay/engine.md` |
| `lib/rag/**`, `lib/ai/**`, `app/api/luan-giai*`, `app/api/hoi-dap`, `lib/ket-noi/**` | `docs/bay/ai-rag.md` |
| Deploy, biến môi trường, sửa tệp bằng dòng lệnh | `docs/bay/moi-truong.md` |

## Tiết kiệm ngữ cảnh (mọi AI làm trên repo này)

- Một việc = một phiên. Xong việc thì xoá ngữ cảnh (`/clear`), đừng kéo một phiên qua nhiều ngày.
- Tìm trước, đọc sau: dùng grep / glob, chỉ đọc đoạn cần. KHÔNG đọc nguyên các tệp lớn:
  `MAU-DE-VIET-LAI.md` (~500KB), `MAU-VANG-LUAN-GIAI*.md`, `KIEN-TRUC-LUAN-GIAI.md`, `HUONG-DAN.md`.
- Việc đọc rộng (rà repo, lần luồng dữ liệu) giao subagent `researcher`; phiên chính chỉ nhận bản tóm tắt.
- Lệnh có output dài (build, test, log, JSON): lọc bằng `tail`, `grep`, `head` trước khi đưa vào ngữ cảnh.
- Không chạy lại cả bộ so mù / sinh bài dài trong phiên khi không cần — tốn cả tiền API lẫn ngữ cảnh.

## Kiểm tra trước khi commit

```
npx tsc --noEmit          # phải sạch
npm run build             # phải qua
npm run lint              # ĐANG có sẵn 7 lỗi set-state-in-effect — đừng để tăng thêm
npx tsx scripts/test-rag-planner.ts   # từ điển thực thể, planner, validator — offline
npx tsx scripts/eval-planner.ts       # bộ vàng 62 câu, ĐANG 100% — không được tụt
npx tsx scripts/test-chuan-ngon-ngu.ts  # chuẩn ngôn ngữ trên bài đọc sâu — offline
npx tsx scripts/test-cach-cuc.ts      # lớp cách cục: luật nào chết, sàn 2 trần 8 — offline
npx tsx scripts/test-12-cung.ts       # bài luận 12 cung: bao phủ, ngân sách mở đầu — offline
npx tsx scripts/test-hoi-thoai.ts     # trí nhớ hội thoại: chạm DB thật, KHÔNG gọi model
npx tsx scripts/eval-chat-quyet-dinh.ts # model thật; chạy khi đổi prompt / schema đầu ra / cách cục
npx tsx scripts/test-rag-toan-tuyen.ts  # chạm DB thật + model thật; chạy khi đổi schema/SQL
node scripts/test-hover-nhay.mjs   # mệnh bàn không được nhấp nháy khi rê chuột
npm run kiem-tra-sso      # trạng thái đăng nhập Google
```

Nếu lint tăng quá 7, đó là lỗi bạn vừa thêm vào — sửa, đừng bỏ qua.

**Và một việc nữa, không phải lệnh chạy được:** nếu commit này đổi một tính năng, đổi một luồng
logic, hay thêm một luật bất biến mới, thì cập nhật `PRODUCT-BACKLOG.xlsx` TRONG CÙNG commit đó.

- Đổi tính năng → sửa dòng tương ứng ở sheet `Backlog`, cập nhật cả hai cột `Cập nhật` và `Commit`.
- Đổi logic → sửa sheet `Logic chi tiết`. Backlog nói CÓ GÌ, Logic nói CHẠY THẾ NÀO; sửa mỗi
  Backlog là để lại một bản mô tả logic đã sai.
- Luôn thêm một dòng vào sheet `Nhật ký thay đổi`. Cột `Vì sao` là cột quan trọng nhất — sau vài
  tháng nó là thứ duy nhất còn giải thích được quyết định.
- Tính năng mới thì cấp ID kế tiếp, không dùng lại ID cũ.

Để việc này thành "nhớ thì làm" là hai tuần sau tệp đó mô tả một sản phẩm không còn tồn tại, và
lúc ấy nó tệ hơn không có gì — vì người đọc vẫn tin nó.

Sửa tệp .xlsx bằng openpyxl (`python -c` hoặc một script trong thư mục tạm), đừng mở bằng tay.

Cách sửa lỗi `set-state-in-effect` khi cần nạp dữ liệu lúc mở trang: tách hàm đọc thành một hàm
RỖNG khỏi setState (trả về dữ liệu hoặc `{ loi }`), rồi đặt state trong `.then` của effect. Xem
`app/admin/models/page.tsx` hoặc `app/admin/knowledge/page.tsx`.

## App di động — ĐANG TẠM DỪNG

`apps/celes-app/` (Expo + expo-router) tạm dừng: chưa có dự định đẩy lên store. Đừng làm tiếp
tính năng cho nó. Việc di động hiện tại là **bản web khi mở trên điện thoại**.

Luật màn hẹp (390px không cuộn ngang, vùng chạm ≥ 44px): xem `docs/bay/giao-dien.md`.
Đọc `apps/celes-app/README.md` trước nếu buộc phải sửa app.

Điểm dễ vấp nhất: **app không có bản sao engine an sao**, nó đọc thẳng `lib/tuvi/`
qua `metro.config.js` và bí danh `@tuvi/*`. Sửa engine là cả web lẫn app cùng đổi.
Đừng "tiện tay" sao chép engine sang app.

Web ở gốc kho và app là hai dự án npm tách biệt. `tsconfig.json` và
`eslint.config.mjs` của web đều đã loại trừ `apps/` — nếu thấy `npm run lint` ở
gốc nhảy quá 9 lỗi, kiểm tra xem loại trừ đó còn không.

## Việc còn dang dở

Xem mục "Trạng thái tính năng" trong `HUONG-DAN.md`. Ba việc lớn nhất còn lại: lớp NGÀY của Hành
trình (cần đối chiếu quy tắc an ngày hạn), bản mobile của mệnh bàn (mini-chart + carousel 12 cung),
và cổng Gate 2 cho gói Plus. Hai tài liệu định hướng gốc:
`D:\Celestia\Celestia_Product_UX_Commercialization_Report.pdf` và
`D:\Celestia\Celestia_Brand_Product_UX_Master_Spec.pdf` (bản sau thay thế bản trước).

Đang chờ người dùng quyết: (1) gói và giá cho bản trả phí, (2) làm PWA hay dựng app
React Native riêng.
