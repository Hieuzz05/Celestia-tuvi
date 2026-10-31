# Bẫy đã gặp — Môi trường: Vercel, biến môi trường, công cụ dòng lệnh

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Production, Preview và local dùng CHUNG một Supabase — đệm AI tách bằng tiền tố `khoa_ky`**
  (03/10/2026, `lib/moi-truong-dem.ts`). `NODE_ENV` là `development`/`test` thì luôn non-production;
  ngoài đó production chỉ khi `VERCEL=1` + `VERCEL_ENV=production` (NODE_ENV chỉ dùng để loại, không
  phải điều kiện dương); Preview `preview:<nhánh>-<băm>:`; còn lại `local:<CELES_CACHE_NAMESPACE|local>:`.
  Không tự đọc `VERCEL_ENV` ở module khác — gọi `phamViDem()` / `laProductionThat()`. `.env.local`
  không được có `VERCEL` hay `VERCEL_ENV` (`kiem-moi-truong.ts` báo đỏ).
- **Script chạy tay mặc định ghi đệm LOCAL; ghi production phải có cờ dòng lệnh `--ghi-production`**
  (`chay-lai-luan-giai.ts`, `dung-thu-vien.ts`, `nap-mau-giong.ts` gọi `khaiBaoScript(process.argv)`).
  KHÔNG đổi cờ này thành biến môi trường: script và `next dev` cùng nạp `.env.local`, ghi biến đó vào
  là `next dev` thành production. Cấu hình dùng chung (`thu-vien`, `mau-giong`, `cau-hinh-v3`) đọc
  được ở mọi môi trường nhưng ghi/xoá ngoài production là ném `LoiNgoaiProduction` (route trả 403).
- **Sau mỗi deploy production chạm đệm: mở `/api/phien-ban`, đủ bốn điều kiện mới đạt cổng —
  `commit` bằng HEAD vừa release, `nhanh=main`, `moiTruong=production`, `phamViDem=production`.**
  Lệch là mọi người dùng đang đọc một đệm trống — coi deploy hỏng, không chạy sinh/xoá đệm nào.
  Deploy tách namespace KHÔNG xả đệm production (giữ khoá cũ); không chạy `--ghi-production` chỉ để
  nghiệm thu — cờ đó chỉ dùng khi chủ dự án yêu cầu sinh lại một lá số / nhóm bề mặt cụ thể.
  Preview mới luôn bắt đầu với đệm trống (sinh lại tốn lượt model); không prewarm.

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
- **Worktree có `node_modules` liên kết sang thư mục chính thì `next dev` (Turbopack) sập** với lỗi
  "Symlink [project]/node_modules is invalid, it points out of the filesystem root". Chạy
  `npx next dev --webpack` thì được (đã thử 28/09/2026, chuyển từ memory cục bộ máy 1).
- **Python trên Windows in tiếng Việt ra console thì sập `UnicodeEncodeError` (cp1252).** Đặt
  `PYTHONIOENCODING=utf-8` trước lệnh, hoặc gọi `sys.stdout.reconfigure(encoding='utf-8')` trong script
  (`backlog.py` của skill cap-nhat-backlog đã làm vậy).

## Cấu hình chủ dự án ĐÃ xác nhận — không hỏi lại

AI không đọc được các cấu hình dưới đây (cần token quản trị Supabase / quyền bảng điều khiển Vercel, máy
không có), nên trước đây cứ mỗi lần trình test lại hỏi chủ dự án. Đã xác nhận thì ghi vào đây; trước khi
hỏi một cấu hình bảng điều khiển, đọc mục này. Chỉ hỏi lại khi có dấu hiệu nó hỏng (vd đăng nhập Preview
bị đẩy về production).

| Cấu hình | Ở đâu | Xác nhận |
|---|---|---|
| Redirect URL Preview `https://*-duyhieu24082000-6871s-projects.vercel.app/**` | Supabase → Authentication → URL Configuration | Có — chủ dự án 31/10/2026 |
| Bảng `thu_hoi_muc_thu_vien` (`supabase/va-thu-hoi-muc.sql`) | Supabase SQL | Đã chạy — chủ dự án 31/10/2026 |
| `CELES_CONG_THU_HOI` chỉ cho Preview | Vercel → Environment Variables | Có từ 25/10/2026 (AI thấy qua `vercel env ls`, chỉ tên) |

- **Log runtime Vercel Hobby chỉ giữ ~1 giờ** (`vercel logs --since` quá 1 giờ trả lỗi retention). Đo gì
  qua log (vd `[thu-hoi] doc`) phải đọc ngay sau khi gây ra request.
- **`npx vercel link` tự kéo biến môi trường về `.env.local` trong thư mục đang đứng.** Chạy link ở thư
  mục tạm thì xoá `.env.local` đó ngay, đừng để bí mật nằm ngoài repo (31/10/2026).
