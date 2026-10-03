# Môi trường phát triển: staging hay Preview theo nhánh — quyết định 03/10/2026

Phiên `[CHIẾN LƯỢC]` 03/10/2026. Đề xuất gốc (một AI ngoài) là đổi luồng sang
`viec/* → staging (UAT) → main (Production)`. Qua ba vòng `phan-bien`, chủ dự án chốt như dưới.

## Quyết định

1. **Chưa tạo nhánh `staging`.** Luồng giữ nguyên: `viec/* → Preview (alias cố định của nhánh)
   → chủ dự án nghiệm thu → gộp main → Production`.
2. **Chưa bật ruleset `require PR` cho `main`** trong lúc luồng còn hai ngoại lệ commit thẳng main
   (`TRANG-THAI.md`, `docs/bai-hoc/`) và gộp bằng merge cục bộ. Hướng dài hạn chủ dự án nghiêng về:
   main chỉ nhận PR, không ngoại lệ, phần phối hợp chuyển khỏi main. Làm ở một việc riêng.
3. **Chưa đổi repo sang private.** Repo đang public nên GitHub Free thực thi được ruleset; đổi
   private trên gói Free là âm thầm mất toàn bộ lớp bảo vệ. Đổi private thì phải lên gói trả phí
   hoặc có cách canh khác bằng máy — không được chỉ dựa vào luật chữ.
4. **Sửa lỗi đệm `noi_dung_ai` lẫn môi trường TRƯỚC Vé B (CEL-186).** Phiên `[SỬA LỖI]` riêng,
   brief ở mục "Việc phát sinh".
5. **Mọi runtime không phải Vercel Production đều coi là nguy hiểm**, kể cả local dev có
   `.env.local` trỏ Supabase production với service role key. Code phải an toàn trong trường hợp đó;
   kết quả audit `.env.local` không được dùng làm lý do bỏ lớp chặn trong code.
6. **Vercel Hobby chỉ cho phép dùng cá nhân / phi thương mại.** Nếu project đang ở Hobby thì tạm
   tắt thanh toán PayOS thật: gỡ `PAYOS_*` khỏi Production (giữ code), cho tới khi quyết gói hosting.
   Không gộp việc này vào sửa đệm.

Tên gọi đúng sau khi sửa đệm: **"Preview theo nhánh an toàn hơn để UAT code và nội dung"** — KHÔNG
gọi là staging hay UAT độc lập, vì tài khoản, hạn mức, hội thoại, nhật ký vẫn chung DB production.

## Vì sao không làm staging lúc này

- Staging dùng chung Supabase production không phải UAT độc lập: đệm bài, `/admin`, hạn mức, dữ
  liệu người dùng vẫn chạm production; đổi schema vẫn phải chạy SQL trên production trước khi UAT.
  Nó nguy hiểm ngang Preview mà còn tạo cảm giác an toàn giả.
- Thứ staging thêm được so với Preview chỉ là bắt lỗi khi gộp A+B. Chưa có sự cố nào như vậy.
- Chuyện nhầm link (vụ linh vật) giải bằng alias cố định của nhánh, Vercel đã có sẵn.
- Phải sửa ~20 chỗ trong tài liệu/skill/script đang giả định `origin/main`, và phải có máy canh
  "main ⊂ staging" vì hai ngoại lệ commit thẳng main làm staging lệch liên tục.

## Phương án đã loại

| Phương án | Loại vì |
|---|---|
| B. Staging dùng chung DB production | An toàn giả (xem trên) |
| C. Staging + Supabase riêng | Đúng nghĩa UAT nhưng công lớn: 7+ tệp SQL chạy tay, nạp lại kho RAG + embedding (tốn tiền model), cấu hình lại Google provider; Supabase free tự tạm dừng sau 7 ngày không dùng. **Để dành** |
| Vercel Custom Environment | Chỉ có ở gói Pro/Enterprise — phạm ngân sách = 0 |
| Chỉ thêm phiên bản prompt vào khoá đệm | Không đủ: đổi validator/engine/định dạng mà prompt không đổi vẫn đè nhau; và đây là bài toán phiên bản, khác bài toán tách môi trường |
| Guard PayOS trong code `VERCEL_ENV !== 'production'` | Thừa: đặt `PAYOS_*` và `NEXT_PUBLIC_APP_URL` chỉ cho Production trên Vercel là đủ, route tự lấy origin của request |

## Khi nào mở lại phương án C (staging + Supabase riêng)

Khi có một trong các điều: có người dùng trả phí thật · đổi schema thường xuyên · admin quản trị
dữ liệu thật · thanh toán cần UAT nghiêm túc · nhiều người/AI release song song thường xuyên · cần
thử migration trước production. Lúc đó mới `viec/* → staging → main`, KHÔNG dựng staging chung DB.

## Việc phát sinh (mỗi việc một phiên, theo thứ tự)

1. **`[SỬA LỖI]` đệm `noi_dung_ai` lẫn môi trường** — trước Vé B.
   - Lỗi: `lib/rag/noi-dung-ai.ts` đọc và upsert theo `chart_hash + be_mat + khoa_ky + ngon_ngu`;
     `phien_ban` chỉ là metadata. Preview/local ghi bài vào đệm production; ngược lại Preview đọc
     trúng bài cũ của production nên chủ dự án nghiệm thu thấy nội dung cũ.
   - Phân loại `BeMat`:
     - Cấu hình — đọc chung, chỉ Production được ghi (chặn ở server, không chỉ ẩn UI):
       `thu-vien`, `mau-giong`, `cau-hinh-v3`.
     - Đệm / trạng thái — tách namespace: `diem-noi-bat`, `nhip-hien-tai`, `moc-giai-doan`,
       `moc-nam`, `moc-thang`, `luan-han-chi-tiet`, `bang-linh-vuc`, `ban-doc-sau`,
       `luan-giai-v3`, `gioi-han-khach` (trạng thái giới hạn khách, không phải cấu hình).
       Phiên sửa phải kiểm lại danh sách `BeMat` đầy đủ trong mã.
   - Namespace bằng tiền tố trên `khoa_ky` (cột `text`), Production giữ nguyên khoá cũ để không xả
     đệm: Preview `preview:<VERCEL_GIT_COMMIT_REF>:<khoaKy>`, local
     `local:<CELES_CACHE_NAMESPACE|local>:<khoaKy>`. Áp ở cả `docNoiDung`, `luuNoiDung`,
     `docNoiDungMoiNhat`, `docNhieuTheoTienTo` và đệm RAM.
   - Lưu ý thiết kế (kiểm 03/10): hai hàm đọc theo tiền tố dùng `LIKE '${tienTo}%'` neo đầu chuỗi,
     nên production không đọc trúng bản `preview:`/`local:` — TRỪ khi `tienTo` rỗng. Phải chặn hoặc
     kiểm trường hợp đó.
   - Nghiệm thu: đệm cũ production vẫn đọc được · Preview không đọc được bài production · Preview
     không đè production · hai nhánh Preview không đè nhau · local tách khỏi production · hai hàm
     đọc theo tiền tố không xuyên namespace · `gioi-han-khach` ngoài prod không đổi trạng thái prod ·
     cấu hình đọc được nhưng không ghi được ngoài prod (kể cả local có Supabase) · không migration,
     không xả đệm production ngoài chủ đích.
   - Audit `.env.local` hai máy: chỉ báo hostname/ref của project, có service role hay không, có
     trùng production không. Không in khoá, không sửa tệp.
2. **Việc nhỏ sau sửa đệm:** `noindex, nofollow` và không phát sitemap ngoài production
   (`lib/trang-web.ts` ghi cứng URL production).
3. **Chủ dự án bấm trên dashboard:** `PAYOS_*` và `NEXT_PUBLIC_APP_URL` chỉ đặt cho Production
   trên Vercel; kiểm Redirect URLs Supabase khớp alias nhánh; kiểm đăng nhập xong host vẫn là
   Preview (không khớp thì Supabase lặng lẽ đưa về production).
4. **Việc riêng sau:** chuẩn hoá Git workflow + ruleset `main`. Trước đó mỗi máy báo
   `gh auth status` (chỉ tài khoản, không in token). Lưu ý khi bật: tên check bắt buộc là tên job
   `kiem-tra` hiện trên PR, không phải tên workflow "Kiem tra".

Báo nghiệm thu mọi việc theo nhánh: `BRANCH · HEAD · CI · UAT BRANCH URL (alias cố định, không
dùng URL của từng deployment) · PRODUCTION URL`.

## Nguồn (kiểm 03/10/2026)

- Vercel Custom Environments chỉ Pro/Enterprise: https://vercel.com/changelog/custom-environments-support-for-marketplace-integrations
- Vercel Hobby chỉ dùng cá nhân/phi thương mại: https://vercel.com/legal/terms
- GitHub protected branches/rulesets: Free cho repo public, private cần Pro/Team: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- Supabase free tạm dừng khi ít hoạt động ~7 ngày: https://supabase.com/docs/guides/platform/free-project-pausing
- Mã: `lib/rag/noi-dung-ai.ts` (khoá đọc dòng 74-76, đọc theo tiền tố ~148, ~180), `lib/trang-web.ts:6`,
  `app/api/support/payments/route.ts:115`, `lib/payments/payos.ts:21-23`, `.github/workflows/kiem-tra.yml`.
