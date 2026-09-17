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
- **Vàng kim `#D4AF37` là màu của RIÊNG dấu thương hiệu**, không phải màu hành động. Nền Midnight
  Indigo `#0F172A` chỉ dùng cho biểu tượng ứng dụng và favicon.
- **Mệnh bàn đầy đủ nằm sau cổng đăng nhập.** Kiểm tra bằng trình duyệt thì chạy dev server với
  `NEXT_PUBLIC_SUPABASE_*` để trống, bằng không phiên sạch chỉ thấy bản xem trước mờ.
- **Không màn nào được tự gọi `danhSachHoSo()` rồi lấy `hoSos[0]`.** Lá số đang xem nằm ở
  `useBoiCanh()`; làm khác đi là đổi lá số ở màn này xong sang màn kia lại thấy người khác.
- **`default_profile_id` và `active_profile_id` là hai thứ khác nhau.** Xem tạm một lá số khác
  KHÔNG được đổi "Lá số của tôi" — chỉ nút "Đặt làm lá số của tôi" mới đổi.
- **Đổi bất kỳ quy tắc tính nào thì phải tăng `PHUONG_PHAP.phienBan`.** Không tăng thì hai kết quả
  khác nhau cùng mang một nhãn và không ai lần lại được.
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
- **Hôm nay đọc `idMacDinh`, không phải `idDangXem`.** Xem tạm lá số khác ở màn khác không được
  làm đổi trang chủ.

### Kho tri thức (RAG)

- **Chỉ phiên bản `da_xuat_ban` mới được truy hồi.** Nạp tài liệu xong nó dừng ở `can_duyet`.
  Ràng buộc này nằm trong `tim_kien_thuc_vector`/`tim_kien_thuc_tu_khoa` chứ không ở tầng ứng dụng —
  đừng viết truy vấn thẳng vào `knowledge_chunks` để "cho nhanh".
- **Đổi bảng từ khoá hay bảng chủ đề → cung thì phải tăng `PHIEN_BAN_PLANNER`**, rồi chạy lại
  `scripts/eval-planner.ts`. Không đánh số thì hai lần eval không so được với nhau.
- **Từ điển `lib/rag/thuc-the.ts` phải phủ đúng mọi sao `lib/tuvi/ansao.ts` an được.** Thiếu một sao
  là validator không bắt được khi model bịa ra nó. `scripts/test-rag-planner.ts` tự đối chiếu.
- **Không cộng điểm vector với điểm từ khoá.** Hai thang đo khác nhau; trộn bằng RRF theo thứ hạng.
- **Ngưỡng cosine không phải hằng số.** Mặc định của `truyHoi` là 0 (không lọc); con số nào cũng
  phải chỉnh bằng eval chứ không chọn bằng cảm giác. Bản cũ để cứng 0.6 và không ai biết nó cắt mất gì.
- **Model không được lấp học thuyết tử vi bằng trí nhớ của nó.** Thiếu nguồn thì thu hẹp kết luận.
  Câu "kho trống thì vẫn chạy bằng kiến thức sẵn có của model" là sai kiến trúc, đừng viết lại.
- **Validator bỏ ý hỏng, nhưng không bao giờ trả về bài rỗng.** Nếu mọi ý đều hỏng thì giữ nguyên
  bài và ghi `dat: false` — xem ghi chú trong `locYHong` để biết vì sao.
- **Chuẩn ngôn ngữ chỉ có MỘT bản: `lib/rag/chuan-ngon-ngu.ts`.** Cả prompt chat lẫn prompt bài
  dài đều nhúng nó. Chép sang màn khác là hai màn cùng sản phẩm nói bằng hai giọng, và người dùng
  cảm nhận được ngay cả khi không gọi tên được vấn đề.
- **Bài đọc sâu 8 lĩnh vực là TEMPLATE TẤT ĐỊNH, không có AI.** Nó vẫn phải theo chuẩn ngôn ngữ —
  người dùng cảm nhận nó như luận giải. Các khuôn câu hay lặp đã thành mảng biến thể trong
  `quick-read-noi-dung.ts`, và `chonBienThe` chọn theo lĩnh vực + chi cung Mệnh: khác khối thì khác
  khuôn, cùng lá số thì luôn ra đúng bài cũ. Thêm câu mẫu mới nhớ thêm cả biến thể.
- **Luật của cổng ngôn ngữ phải khớp theo TỪ, không theo chuỗi con.** Đã trả giá hai lần: "thiên cơ"
  bắt nhầm sao Thiên Cơ, "không hợp" bắt nhầm "không hợp lý". Và phải bỏ qua câu phủ định — câu
  miễn trừ "không phải một sự việc chắc chắn sẽ xảy ra" chứa đúng cụm bị cấm nhưng đang nói ngược lại.
- **`npx tsx scripts/test-chuan-ngon-ngu.ts` chạy offline** và phải luôn xanh: 8 lá số qua cổng, tỉ
  lệ lặp khuôn mở đầu dưới 50%, và sáu ca kiểm cổng không bắt nhầm / không bỏ sót.
- **Không có nguồn gốc RAG nào được ra tới trình duyệt.** Không tên tài liệu, không hệ phái theo
  đoạn, không điểm liên quan, không mã chunk. `components/CanCu.tsx` chỉ hiện dữ kiện lá số, mạch
  suy luận và điểm kéo ngược. Toàn bộ provenance nằm ở `retrieval_runs`/`ai_requests` cho quản trị.
  `soatNgonNgu` có một luật CHẶN riêng cho việc này.
- **Hai nguồn RAG nói ngược nhau thì theo `lib/rag/uu-tien-nguon.ts`**: mức tin cậy phân xử, nhưng
  chỉ khi hai đoạn đã ngang nhau về độ liên quan (băng dung sai 5%). Mức tin cậy không được thay
  thế độ liên quan — một nguồn "cốt lõi" lạc đề vẫn là lạc đề.
- **Nhiều đoạn cùng một tài liệu chỉ là MỘT tiếng nói.** `mucChacChan` đếm số tài liệu khác nhau,
  không đếm số đoạn. Đếm nhầm thì nhận định nào cũng trông "mạnh".
- **Mỗi ý phải có lực ngược nếu có.** Chỉ nhặt sao củng cố câu chuyện là cherry-pick, và bài đọc
  nào cũng mạch lạc một cách đáng ngờ.
- **Nút thắt khi nạp tài liệu là HẠN MỨC, không phải tốc độ.** Free tier của
  `gemini-embedding-001` có HAI trần, và mỗi phần tử trong lô `batchEmbedContents` tính là một
  request:
  - **100 đoạn mỗi phút** — chờ vài chục giây rồi chạy tiếp được.
  - **1.000 đoạn mỗi NGÀY** (`EmbedContentRequestsPerDayPerUserPerProjectPerModel-FreeTier`) —
    chờ bao lâu cũng vô ích.

  Gộp lô giảm số lần đi về nhưng không nâng thông lượng. Tăng `EMBED_MOI_LUOT` không làm nhanh hơn.
  Toàn bộ 14 tài liệu (7.743 đoạn) cần **8 ngày** ở gói miễn phí, hoặc bật thanh toán.
- **Gemini trả cùng mã 429 và cùng câu "Please retry in Ns" cho CẢ HAI trần.** Bám vào câu đó là
  hệ thống ngồi chờ đến sáng mà không tiến thêm đoạn nào — đã đo thấy: dừng ở đúng 720/1134 rồi
  lặp 27 lượt chờ 58 giây vô ích. Dấu hiệu tin được là `quotaId` có chứa `PerDay`.
- **429 không phải lỗi, là áp lực ngược.** `embedTiep` trả về `choGiay` để client chờ, và KHÔNG
  đánh dấu phiên bản là `that_bai` — đánh dấu thất bại chỉ vì nạp hơi nhanh sẽ khiến người vận hành
  đi tìm một cái bug không tồn tại.
- **Chạm hạn mức giữa chừng thì giữ phần đã làm.** `embedLoTaiLieu` trả về số vector đã lấy được
  kèm `choGiay`, không ném đi. Ném lỗi là vứt luôn quota đã trả tiền để đổi lấy chúng.
- **Nạp tài liệu đi ba pha**: lưu đoạn (không vector) → điền vector từng lượt → chốt. Mỗi request
  ngắn nên không phụ thuộc gói Vercel, và đứt giữa chừng thì bấm "Nạp tiếp" chạy tiếp từ chỗ dở vì
  pha B luôn chọn `embedding is null`.
- **Pha chốt phải chạy lại được.** Client có thể gọi trùng lượt cuối; không xoá liên kết thực thể
  trước khi chèn thì số lần đếm nhân đôi, làm lệch xếp hạng truy hồi mà không lỗi nào báo ra.
- **PostgREST trả tối đa 1000 dòng.** `.select()` trần trụi trên bảng đoạn sẽ lặng lẽ bỏ sót đuôi
  của tài liệu lớn. Đọc theo trang bằng `.range()`.
- **Chuỗi model: có dòng trong `ai_model_configs` thì bảng đó là nguồn DUY NHẤT.** Không trộn với
  biến môi trường, không tự chèn thêm provider từ env vào cuối. Bản cũ có chèn, với lý do "thêm key
  mà hệ thống lặng lẽ bỏ qua là một cái bẫy" — lý do đó đúng khi cấu hình chỉ nằm ở env, nhưng khi
  đã có nút Xoá trên giao diện thì một dòng tự mọc lại là cái bẫy lớn hơn. Provider có key mà chưa
  khai được hiện ra ở cuối trang kèm lời mời thêm.
- **API key đi một chiều.** Trình duyệt gửi lên, không bao giờ nhận về. Mọi phản hồi chỉ có dạng
  rút gọn. Nút "Thử kết nối" của một dòng đã lưu gửi `id`, không gửi key.
- **Key trong database được mã hoá bằng `CONFIG_SECRET`.** Thiếu biến đó thì API từ chối lưu key —
  cố ý không có đường lưu thô. Đổi hoặc mất `CONFIG_SECRET` là phải nhập lại toàn bộ key.
- **Kết nối: ý định quyết định mọi thứ phía sau.** `lib/ket-noi/y-dinh.ts` định nghĩa cung nào được
  đọc, RAG tìm gì, bài có mục nào. Thêm ý định mới thì sửa đúng một chỗ đó.
- **Kết nối không bao giờ có phần trăm hợp nhau**, không phán hợp/không hợp, không khuyên cưới hay
  chia tay. Bảng so sánh kỹ thuật nằm dưới và đóng sẵn — nó là phần chứng minh, không phải phần
  trả lời.
- **Dùng heredoc `<<'PY'` cho script Python thì dấu gạch chéo bị nuốt một lớp**, nên mọi mẫu chứa
  `
` đều không khớp. Sửa tệp có ký tự thoát thì dùng công cụ sửa tệp, đừng dùng heredoc.
- **Bài kiểm tra offline không thay được `test-rag-toan-tuyen.ts`.** Ba lỗi nặng nhất của lớp RAG
  đều chỉ lộ ra khi chạm database thật: mã thực thể trùng làm chết lệnh upsert, hai chỗ nuốt lỗi
  giấu mất điều đó, và nhánh từ khoá không bao giờ khớp. Đổi schema hay đổi SQL thì phải chạy nó.
- **`plainto_tsquery` nối mọi từ bằng AND.** Truy vấn nhiều chữ sẽ không khớp gì cả. Dùng
  `public.tsquery_hoac` (đổi `&` thành `|`). Đây là lỗi im lặng: nhánh từ khoá trả rỗng, truy hồi
  vẫn "chạy", chỉ là thành vector thuần.
- **Nhánh từ khoá dùng `truyVanTuKhoa`, không dùng `truyVan`.** Nó tồn tại để bắt đúng chữ; ném cả
  câu văn vào thì từ nối lấn át tên sao.
- **Mã thực thể phải là duy nhất** — `thuc-the.ts` tự kiểm và ném lỗi ngay khi nạp module. Thêm sao
  mới mà bỏ dấu ra trùng sao cũ thì khai mã tay trong `ID_RIENG`, lấy tên vòng làm phần phân biệt.

## Kiểm tra trước khi commit

```
npx tsc --noEmit          # phải sạch
npm run build             # phải qua
npm run lint              # ĐANG có sẵn 7 lỗi set-state-in-effect — đừng để tăng thêm
npx tsx scripts/test-rag-planner.ts   # từ điển thực thể, planner, validator — offline
npx tsx scripts/eval-planner.ts       # bộ vàng 62 câu, ĐANG 100% — không được tụt
npx tsx scripts/test-chuan-ngon-ngu.ts  # chuẩn ngôn ngữ trên bài đọc sâu — offline
npx tsx scripts/test-rag-toan-tuyen.ts  # chạm DB thật + model thật; chạy khi đổi schema/SQL
node scripts/test-hover-nhay.mjs   # mệnh bàn không được nhấp nháy khi rê chuột
npm run kiem-tra-sso      # trạng thái đăng nhập Google
```

Nếu lint tăng quá 7, đó là lỗi bạn vừa thêm vào — sửa, đừng bỏ qua.

Cách sửa lỗi `set-state-in-effect` khi cần nạp dữ liệu lúc mở trang: tách hàm đọc thành một hàm
RỖNG khỏi setState (trả về dữ liệu hoặc `{ loi }`), rồi đặt state trong `.then` của effect. Xem
`app/admin/models/page.tsx` hoặc `app/admin/knowledge/page.tsx`.

## App di động — ĐANG TẠM DỪNG

`apps/celes-app/` (Expo + expo-router) tạm dừng: chưa có dự định đẩy lên store. Đừng làm tiếp
tính năng cho nó. Việc di động hiện tại là **bản web khi mở trên điện thoại**.

Hai luật cho web ở màn hẹp, đã đo bằng Chrome ở 390px:
- **Không trang nào được cuộn ngang.** Kiểm bằng `scrollWidth - clientWidth` phải bằng 0.
- **Vùng chạm tối thiểu 44px.** `.nav-link` và `.link-text` dùng `::after` phủ thêm chiều cao ở
  `(pointer: coarse)` — nới padding thì gạch chân chỉ báo trang rời khỏi chữ.

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
