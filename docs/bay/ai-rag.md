# Bẫy đã gặp — AI, RAG, model, nội dung AI

Tách từ `AGENTS.md` (27/09/2026) để không nạp vào mọi lượt. Đọc tệp này TRƯỚC khi sửa vùng tương ứng.

- **Gemini 3.x tiêu thinking tokens trong `maxOutputTokens`.** Đặt hạn mức thấp sẽ trả candidate
  rỗng kèm `finishReason: MAX_TOKENS` chứ không báo lỗi.
- **Đừng đoán tên model.** Gọi `GET https://generativelanguage.googleapis.com/v1beta/models` để
  lấy danh sách thật.
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
- **Sửa truy hồi, planner, prompt hay model thì chạy `scripts/eval-rag.ts`.** Nó có
  ngưỡng và mã thoát, nên chặn được hồi quy. Bốn tầng: truy hồi, bám nguồn, so có
  kho với không kho, và CHUYỂN HOÁ chứ không chép. Tầng cuối là tầng hay bị bỏ
  sót: bám nguồn càng chặt càng đẩy model về phía chép nguyên văn sách, mà chép
  nguyên văn là hỏng theo cách khác — đúng nguồn, và người đọc không hiểu gì.
  Tiêu chí và mức đã đo nằm ở `NGHIEM-THU-RAG.md`.
- **Nhánh từ khoá phải mang theo chữ của chính câu hỏi**, không chỉ thực thể có
  trong từ điển. Tên cách cục không nằm trong từ điển, nhưng luôn xuất hiện
  nguyên chữ trong câu người hỏi. Bỏ chúng đi thì recall tụt từ 90% xuống 50%.
- **Danh sách từ dừng tiếng Việt phải CÓ DẤU.** Bỏ dấu thì "Đà" trùng "đã", "Cơ"
  trùng "có", "La" trùng "là" — nuốt mất tên sao mà không ai thấy.
- **Nút thắt khi nạp kho là EMBEDDING, không phải kích thước tệp.** Pha lưu đoạn xử
  được cả cuốn trong một lượt. Gemini gói miễn phí chặn ở 1.000 đoạn/ngày nên nó
  dừng giữa chừng, và người ta tưởng phải chia nhỏ tệp. Chia nhỏ không giúp gì:
  tổng số đoạn không đổi. Đặt `EMBEDDING_PROVIDER=openai` là hết trần ngày.
- **Đổi nhà cung cấp embedding thì PHẢI sinh lại vector cho toàn bộ kho**
  (`scripts/nap-lai-embedding.ts --tat-ca`), và phải đặt cùng giá trị trên Vercel.
  Vector hai model nằm ở hai không gian khác nhau; trộn chúng không báo lỗi, truy
  vấn vẫn chạy, chỉ là kết quả vô nghĩa.
- **`text-embedding-3-small` nhận tham số `dimensions`** nên trả đúng 768 chiều,
  khớp cột `vector(768)` đang có. Không phải đổi bảng, không phải đổi cách cắt đoạn.
- **Bề mặt ngắn gọi model theo NHÓM, không theo từng phần tử.** Dòng thời gian có
  ~29 mốc; sinh riêng từng mốc là 29 lượt cho một lần mở trang, trong khi gói miễn
  phí của Gemini cho 20 lượt cả ngày. `moc-hanh-trinh.ts` và `bang-linh-vuc.ts`
  gọi một lượt cho cả nhóm. Gọi theo nhóm còn được thêm một thứ: model nhìn cả dãy
  nên không lặp ý ở phần tử sau.
- **Mọi nội dung AI đều đi qua `layHoacSinh` và cất vào `noi_dung_ai`.** Khoá là
  (lá số, bề mặt, kỳ). Kỳ quyết định khi nào làm mới: ngày cho Điểm nổi bật, tháng
  ÂM cho Hành trình, khoảng tuổi cho giai đoạn, năm cho bảng 8 lĩnh vực. Bảng này
  phải chạy tay: `supabase/schema-noi-dung-ai.sql`. Thiếu bảng thì có lớp đệm RAM
  đỡ tạm, nhưng nó không chia sẻ giữa các instance.
- **Bề mặt AI luôn phải có đường lùi về chữ tất định.** Model hỏng, hết hạn mức,
  hay bài trượt kiểm duyệt thì tuyến trả 204 và giao diện giữ nguyên bản template.
  Trang trắng hỏng nặng hơn chữ nhạt. Đừng xoá engine tất định trong `lib/tuvi/`.
- **Lọc câu ra lệnh bằng `CAU_RA_LENH`, và BỎ CÂU chứ đừng bỏ cả khối.** Bản đầu
  loại thẳng cả khối: một câu "bạn nên…" lọt vào trường bắt buộc là mất cả bảng vì
  không đủ số khối tối thiểu. Dùng `boCauRaLenh`.
- **Model không giữ được luật "đừng mở giống nhau" dù dặn hai lần.** Chín trên mười
  hai mốc vẫn mở bằng "Giai đoạn này". Xử bằng luật: `catMoDauThua` cắt cụm thời
  gian mở đầu — cụm đó không mang thông tin vì người đọc đang nhìn đúng cái nhãn
  ngay cạnh. Cắt chứ không viết lại.
- **Dòng `gpt-5` trở lên của OpenAI dùng tham số khác**: `max_completion_tokens` chứ không phải
  `max_tokens`, và chỉ nhận nhiệt độ mặc định. Gửi sai là 400 ngay, trông hệt như key hỏng. Token
  nghĩ nội bộ cũng trừ vào ngân sách đó nên `chatOpenAiCompat` cộng thêm 2048 chỗ; thiếu chỗ thì bài
  dài bị cắt giữa chừng và JSON gãy.
- **Đọc JSON của model phải chịu được ngoặc đóng sớm.** Model dài hơi hay đóng object rồi mở object
  mới cho phần còn lại (`{...},{"ghepLai":...}`). Đo trên gpt-5.4-mini: bài đúng và sâu mà bị vứt cả
  vì một dấu ngoặc. `docJson` thử gộp `[...]` trước khi chịu thua.
- **Dữ kiện lá số (F###) chỉ mang phụ tinh TRỌNG YẾU** (`PHU_TINH_TRONG_YEU`), không dump cả cung.
  Đưa 6-8 phụ tinh vào dữ kiện là model chép nguyên danh sách ấy vào bài — đo được: 78% câu có tên
  sao, có câu kê 7 sao. Đây mới là gốc của "nêu sao dài dòng", không phải prompt.
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
