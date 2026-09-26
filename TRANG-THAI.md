# Bảng bàn giao

Hai AI làm trên hai máy không nói chuyện được với nhau. Tệp này là chỗ duy nhất
chúng nói chuyện. Nó nằm trong git nên ai `git pull` cũng đọc được.

**Luật:** trước khi bắt đầu một việc thì ghi vào "Đang làm". Xong việc thì chuyển
xuống "Vừa xong" kèm mã commit. Đụng phải thứ gì đang hỏng thì ghi vào "Đang
vướng". Ghi bằng tiếng người, không bằng thuật ngữ.

Cập nhật tệp này là một commit riêng, đẩy thẳng lên `main`. Nó không ảnh hưởng mã
chạy nên không cần nhánh, và để trên nhánh riêng thì máy kia không thấy.

---

## Đang làm

| Ai | Việc | Nhánh | Chạm vào tệp nào | Bắt đầu |
|---|---|---|---|---|
| — | (chưa có việc nào đang chạy) | — | — | — |

## Đang vướng — đừng đụng vào

| Chỗ nào | Vướng gì | Ai biết rõ |
|---|---|---|
| **Cerebras hết tiền** | Cron sức khoẻ bắt được "Payment required" — model nằm trong chuỗi dự phòng nhưng không dùng được. Nạp tiền hoặc tắt nó trong trang quản trị models (ĐỪNG sửa ai_model_configs bằng code) | Claude (máy 1) |

## Vừa xong

| Việc | Commit | Ngày |
|---|---|---|
| **ĐÃ LÊN PRODUCTION**: CEL-136 lăng kính riêng từng chủ đề (`LANG_KINH` trong `lib/rag/v3/index.ts`), khung Tính cách ba tầng (khung 2026.09.4), chống lặp cụm từ + cụm quen tay (`so-y.ts`). Không tăng `THE_HE_DEM`: route chỉ nhận bài cùng câu hỏi nên chỉ câu đổi nghĩa sinh lại; khoá tóm lại / bức tranh kèm phiên bản khung | `01ed7f7` | 26/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-135 khung chuyên sâu mới cho cả 14 chủ đề (khung 2026.09.3, 87 câu — id ĐỔI NGHĨA), sức khỏe được nêu nhóm cơ quan dạng xu hướng (chủ dự án duyệt), "Bức tranh lớn" (mục cuối mục lục, cần ≥3 chủ đề) + "Muốn đi sâu hơn"; route chỉ nhận bài cùng câu hỏi; `THE_HE_DEM` = 7 | `4931459` | 26/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-134 chuyên sâu thành một mạch đọc — khung Sự nghiệp mới (id SN01–SN08 ĐỔI NGHĨA), công thức viết chuyên sâu, phần "Tóm lại" cuối mỗi chủ đề (`lib/rag/v3/tom-lai.ts`, khoá `…|tom-lai`), câu dẫn 14 chủ đề; `THE_HE_DEM` = 6. Đừng đưa câu ví dụ vào prompt cho yêu cầu kiểu "khoảnh khắc đúng quá" — model chép nguyên | `649b1c4` | 26/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-132 luận v3 không kết bằng lời khuyên — trường `goiY` riêng, gom ở `components/luangiai/GoiYCeles.tsx` (cuối tổng quan, cuối mỗi chủ đề); bỏ "việc làm được ngay"; `THE_HE_DEM` = 5. CEL-133 bộ đo tiết kiệm token: `--chi` / `--tu` ở do-chat-luong-v3, giám khảo rẻ dừng sớm ở so-sanh-v3 — ĐỪNG sinh lại bản mốc mỗi vòng | `e277ed3` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-131 phiên cải thiện chất lượng luận giải — truy hồi v3 ưu tiên cung chính của chủ đề, chuyên sâu dùng nguồn RAG + "việc làm được ngay", TQ04 nêu hai đầu thang và vì sao, chặn tên sách, trang chuyên sâu gọi hai lượt nối tiếp; `THE_HE_DEM` = 4. Đo: `scripts/so-sanh-v3.ts` (so mù từng cặp) — DÙNG ≥3 giám khảo (`--giam-khao`), một giám khảo tự chấm dao động ±30% | `031c86b` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-130 chống lặp giữa các phần luận — phân quyền dữ kiện (cung tam phương không kèm diễn nghĩa), sổ ý `lib/rag/v3/so-y.ts`, một câu giữ mốc mỗi chủ đề; điểm nổi bật xoay 7 góc theo ngày; `THE_HE_DEM` = 3. Bộ đo: `scripts/do-chat-luong-v3.ts` (gemini hay 503 → giám khảo lùi về model viết, có cảnh báo) | `bb98aae` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-129 nút quay lại dùng chung (`components/QuayLai.tsx`) cho `/luan-giai/sau`, `/luan-giai`, `/dang-nhap`, `/hoi-dap` — về đúng lá số + đúng tab qua `?ve=`. Trang con mới thì gắn `<QuayLai>` và cho trang gọi truyền `themVe(...)` | `3e5a7bc` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: `THE_HE_DEM` 1 → 2 ở `/api/luan-giai-v3` — mọi lá số cũ sinh lại một lần theo bản C khi được mở; câu sinh lại hỏng thì tạm trả bài thế hệ trước. Đã kiểm trên production: lần 1 sinh lại 19s, lần 2 lấy từ đệm 2s | `004fe2e` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-128 trang `/la-so` chia tab Tổng quan · Chuyên sâu (14 chủ đề) · Mạnh – yếu (radar 12 cung) · Lá số (chỉ điện thoại); tab nhớ trên URL `?tab=`. Đã bỏ thẻ đọc dài cũ, liên kết `/luan-giai` và thẻ Hỏi Celes lớn khỏi trang — đường lùi tiếng Anh vẫn giữ | `a84c6f1` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-127 thiết kế lại Bản đồ mạnh – yếu — thanh lệch hai phía quanh mức giữa, đủ 12 dòng, chữ viết lại dễ hiểu; tên nhóm mới Thuận lợi / Ổn định / Cần chăm chút dùng chung với prompt (`TEN_MUC` trong `lib/rag/v3/du-kien.ts`) | `7245d59` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-127 Bản đồ mạnh – yếu 12 mặt đời ở `/la-so` (engine, chạm dòng mở "vì sao" + "Đọc sâu về …" sang `/luan-giai/sau?chuDe=`), hung tinh đắc địa trừ nửa điểm; CEL-126 "bản C" luận sâu hơn trong prompt v3. Bản C CHỈ áp cho lá số chưa có bài — THE_HE_DEM chưa tăng, chờ chủ dự án chốt có sinh lại bài cũ không. 3 câu SQL 25/09 đã chạy | `4f0d75c` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: đợt tối ưu 3 — cảnh báo sự cố AI + cron sức khoẻ (CEL-124), phễu sự kiện tự ghi DB (CEL-063/082), tổng quan ba thẻ đầu trước + đệm RAG (CEL-125), Kết nối sửa tiếng lóng, mệnh bàn mobile dạng danh sách (CEL-072), Hỏi Celes dùng lá số vừa lập | `5b58368` | 25/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-123 — rà soát UI/UX + responsive mobile (báo cáo `UIUX-RA-SOAT-2026-09-24.md`), GỘP LUÔN `viec/mobile-adaptive` (CEL-112). Bẫy cần nhớ: `.link-action` đặt display ngoài layer nên thắng `hidden`/`lg:hidden` — muốn ẩn thì bọc ngoài | `582cfbd` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-122 — luận giải lá số (tổng quan + chuyên sâu) chỉ sinh MỘT lần mỗi lá số + năm + nhóm; khoá `/api/luan-giai-v3` không còn phiên bản. ĐỪNG thêm phiên bản lại vào khoá này; muốn làm mới toàn bộ thì tăng `THE_HE_DEM` | `50f0820` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-121 — sửa an sao sau đối chiếu tuvivietnam: độ sáng Thiên Khốc/Thiên Hư, Hóa Kỵ đắc tứ mộ, thêm Lưu Tang Môn/Bạch Hổ; phiên bản phương pháp vào khoá đệm (mọi bài sinh lại). Thiên Khôi/Việt năm Canh CHƯA đổi — chờ chủ dự án chốt | `e7c040b` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: CEL-120 — mọi màn luận giải (hỏi Celes, kết nối, khám phá chủ đề, hành trình, điểm nổi bật) dùng chung bộ quy tắc của phần lá số (`lib/rag/quy-tac-luan-giai.ts`, khối đầu của chuẩn ngôn ngữ). Lời khuyên không còn bị cắt sạch — chỉ cắt lời khuyên rỗng. Chuẩn đổi → mọi bài đệm sinh lại lần đầu | `ae2129c` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: chống lặp ý giữa các câu chuyên sâu (không gắn mốc tuổi vào câu không hỏi thời điểm, chia phạm vi theo các câu cùng chủ đề, bắt kết bằng lời khuyên riêng) + chặn chữ không phải tiếng Việt. Phiên bản prompt/dữ kiện đổi → mọi bài đệm sinh lại lần đầu. Đo lá số A: giám khảo 4,06 → 4,15. OpenAI đã được nạp lại credit | `233e0f1` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: giao diện luận giải v3 — ba thẻ đầu `/la-so` lấy từ v3, tổng quan thành thẻ đánh số, nút chính vào `/luan-giai/sau`, bỏ dòng hạn mức; `/luan-giai/sau` mục lục mới + nút "Đọc lại" (nhánh `viec/giao-dien-luan-giai-v3`) | `9a62ddd` | 24/09/2026 |
| **ĐÃ LÊN PRODUCTION**: sửa truy hồi (nhánh `viec/rag-chat-luong-truy-hoi`, SQL `va-rag-chat-luong.sql` ĐÃ CHẠY) + luận giải v3 có giao diện (CEL-119). `/la-so` đọc tổng quan v3 cho cả khách; `/luan-giai/sau` thành 14 chủ đề chuyên sâu, cần đăng nhập; không hạn mức. Bản đọc sâu 4 chặng (CEL-092, CEL-117) tạm dừng ở giao diện — route và thư viện giữ nguyên | `0b80a42` | 23/09/2026 |
| CEL-119 — luận giải v3 (11 câu tổng quan + 61 câu chuyên sâu, đọc nhiều cung, Celes chạy thật từ đầu đến cuối) + route `/api/luan-giai-v3`, CHƯA có giao diện, CHƯA gộp. Nhánh `viec/luan-giai-v3`, dựng TRÊN nhánh RAG bên dưới → gộp RAG trước. Chạm: `lib/rag/v3/*` (mới), `app/api/luan-giai-v3` (mới), `lib/rag/noi-dung-ai.ts` (thêm bề mặt `luan-giai-v3`) | `0bbff65` | 23/09/2026 |
| Sửa tầng truy hồi: hnsw, tìm nguyên cụm tên riêng, bỏ bản chép giữa các sách, phân cấp nguồn (nhánh `viec/rag-chat-luong-truy-hoi`, CHƯA gộp, cần chạy SQL — xem "Đang vướng"). Chạm: `lib/rag/truy-hoi.ts`, `uu-tien-nguon.ts`, `planner.ts`, `cum-tu-khoa.ts` (mới) | `f717a85` | 23/09/2026 |
| **ĐÃ LÊN PRODUCTION**: văn phong + Phase A + mở tổng quan cho khách (7 commit, gộp theo quyết định của chủ dự án). `viec/mobile-adaptive` CHƯA gộp | `6020772` | 23/09/2026 |
| CEL-118 — phần tổng quan mở cho khách, chỉ luận giải chuyên sâu cần đăng nhập; kèm sửa thanh điều hướng tràn trên iPhone (nhánh `viec/mo-tong-quan-cho-khach`) | `a0024db` | 23/09/2026 |
| A5 nhát cắt đầu + cắm mẫu vàng cho sáu bề mặt (nhánh `viec/kien-truc-phase-a`) | `57934ca` | 23/09/2026 |
| Phase A của `KIEN-TRUC-LUAN-GIAI.md`: A1 (ngân sách từ thành trần) + A3 (chỗ cắm mẫu vàng) + chia ba nhóm luật cho A5 — nhánh `viec/kien-truc-phase-a` | `10b7dc5` | 22/09/2026 |
| CEL-112 — bản adaptive cho điện thoại (nhánh `viec/mobile-adaptive`) | `36ac30d` | 22/09/2026 |
| CEL-111 — xếp luật trước, dữ kiện sau để nhà cung cấp đệm được prompt | `b941869` | 22/09/2026 |
| CEL-110 — đếm và chặn một cách cục bám quá nhiều phần (7/12 → 4/12) | `9e11ac8` | 22/09/2026 |
| CEL-110 — văn phong Celes cho chat và bảng 12 lĩnh vực; bảng tách hai lượt gọi song song (52,3s → 43,3s) | `b041f2e` | 22/09/2026 |
| CEL-088 — trí nhớ hội thoại xuyên phiên (KHÔNG cần SQL mới) | `(bản này)` | 19/09/2026 |
| Spec Chat Quality v1: P1-6b — chat biết bài tổng quan đã nói gì | `261dde7` | 19/09/2026 |
| Spec Chat Quality v1: P1-5/7/8 — giọng chắc chắn, lối đi tiếp, lớp tự kiểm | `492fe16` | 19/09/2026 |
| Spec Chat Quality v1: P2-10 — bộ đo chat quyết định, 6 tiêu chí | `c95fbbd` | 19/09/2026 |
| Spec Chat Quality v1: P0-3 + P0-4 — chat ra hình dạng tin nhắn, biết hỏi ngược | `f27d802` | 19/09/2026 |
| Spec Chat Quality v1: P0-1 — lớp cách cục, 22 luật | `df3702e` | 19/09/2026 |
| Spec Chat Quality v1: P0-2 — planner có trục ý định | `32474f7` | 19/09/2026 |
| Bản theo dõi tính năng `PRODUCT-BACKLOG.xlsx` + luật cập nhật | `713a6d9` | 19/09/2026 |
| Luận theo lĩnh vực do model viết, bốn sửa nhỏ màn Lá số | `ec3327d` | 19/09/2026 |
| Rà soát từng màn: đâu do AI viết, kỳ làm mới | `d7a9b78` | 19/09/2026 |
| Mệnh bàn to hơn 41%, thanh công cụ dính theo khi cuộn | `ae240b4` | 19/09/2026 |
| Bỏ hàng chọn chế độ bản đồ, tab cho trang quản trị | `c36b43a` | 19/09/2026 |
| Căn cứ chỉ cho quản trị, sửa bug lưu trùng, bố cục hai cột | `7144719` | 19/09/2026 |
| Trí nhớ hội thoại cho Hỏi Celes theo §12.5 | `7322d40` | 18/09/2026 |
| Sửa câu kê sao thay vì vứt cả bài | `1f36f6f` | 18/09/2026 |
| Mốc dòng thời gian do model viết, một lượt gọi cho cả nhóm | `b151749` | 18/09/2026 |
| Bảng 8 lĩnh vực do model viết | `4447a85` | 18/09/2026 |
| Tab Lá số, sửa lịch âm, bắt đầu chuyển bề mặt tất định sang AI | `a04efc7` | 18/09/2026 |

---

## Điều cả hai máy cần biết

- **Production luôn là nhánh `main`.** Đẩy lên `main` là phát hành thật, khoảng
  40 giây sau là người dùng thấy.
- **Bản nào đang chạy trên máy chủ:** mở
  <https://celestia-tuvi.vercel.app/api/phien-ban>. Nó trả mã commit.
- **Chưa làm, và vì sao:**
  - Lưu trạng thái quan hệ ở Kết nối (§27) — cần quyết định sản phẩm trước.
  - Tách phần miễn phí và phần khoá (§28) — cần bảng giá trước.
  - Các kiểu quan hệ gia đình chi tiết — cần quyết định phạm vi trước.
  - **Streaming cho chat (CEL-089)** — bẫy đã lường: validator chạy SAU khi có
    JSON đầy đủ, nên chỉ được stream `tomTat` trước rồi mới đổ các ý ĐÃ LỌC.
- **Kho mẫu vàng đang RỖNG và đó là việc của chủ dự án** (A2 trong
  `KIEN-TRUC-LUAN-GIAI.md`): sáu loại × hai bản, mỗi mẫu kèm một câu nói rõ bản
  ấy đáng học ở chỗ nào. Đổ vào `KHO_VANG` trong `lib/rag/mau-vang.ts` là chạy,
  không phải sửa chỗ nào khác. Chưa có mẫu thì KHÔNG được cắt nhóm luật
  `mau-day-duoc` — cắt trước là bỏ luật mà chưa có thứ thay thế.
- **Trần chất lượng hiện tại là model.** Chuỗi model để `gpt-4o-mini` đứng đầu
  theo yêu cầu của chủ dự án. Đo được: `gpt-5.4-mini` cho bài sâu hơn hẳn với
  cùng hạng giá. Đừng tự đổi; muốn đổi thì hỏi chủ dự án.
