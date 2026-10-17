# CEL-200 — Phương án máy 2: 3b và Commit 4 phần mã

Ngày lập: 17/10/2026 (Asia/Bangkok). Trạng thái: chủ dự án đã DUYỆT ngày 17/10/2026; đang triển khai 3b, Commit 4 phần mã tiếp sau. Phần mô tả phương án bên dưới giữ làm căn cứ nghiệm thu.
Cỡ việc: LỚN — thay prompt, validator và cách dựng ngữ cảnh.

## 1. Môi trường và ranh giới

- Worktree riêng: D:/SAPP BA/tuvi-ai-van-han-3b.
- Nhánh: viec/van-han-3b, cắt từ origin/viec/van-han-lop-han tại 25ad334887a8c12ab4fa9d7eddc83a2227651002 sau git fetch origin --prune.
- Workspace chính ghi/đọc được; worktree mới ghi/đọc được (tệp thử đã xoá).
- Terminal kết nối GitHub thành công: git ls-remote trả đúng SHA trên; fetch thành công. Chưa kiểm quyền push vì chủ dự án cấm push.
- Thư mục Claude vẫn ở viec/toi-uu-token; không checkout hoặc sửa mã tại đó.
- Node 22.14.0; npm.cmd 10.9.2; tsx 4.23.15; Python 3.13.2 và openpyxl 3.1.5.
- npm.ps1 trên PATH đang trỏ sai npm-cli.js; dùng C:/Program Files/nodejs/npm.cmd và npx.cmd. Không sửa cài đặt toàn máy.
- gh chưa được cài; Git HTTPS với credential helper manager đã kết nối được.
- npm ci --no-audit --no-fund thành công: 562 gói theo lockfile, không đổi package/lockfile.
- Worktree mới thiếu kiểu LayoutProps: đã chạy next typegen theo tài liệu Next.js cục bộ, sau đó tsc --noEmit PASS. Đây là chuẩn bị môi trường, chưa phải kiểm tính năng.
- Chưa chạy kiem-moi-truong.ts: mã scripts/kiem-moi-truong.ts:160-186 có đọc bảng và gọi RPC Supabase, không phù hợp lệnh không chạm DB.
- Không đọc giá trị bí mật, không sao chép/sửa .env.local; không gọi DB, embedding, model hay eval trả tiền. Không push/merge/commit trong giai đoạn trình phương án.

Đã đọc AI-PHOI-HOP.md, AGENTS.md, bước mở phiên, docs/bay/ai-rag.md, engine.md, moi-truong.md, hướng dẫn vận hành mục chạy local; đọc các tài liệu vận hạn và diff 429fc9e phần RAG. Backlog có CEL-200 tại Backlog dòng 199; không cấp ID mới.
Tài liệu nhánh có mục đề ngày 18/10; giữ nguyên nội dung quyết định đã có tại base, không suy đó là ngày hiện tại.

## 2. Hiện trạng đã đối chiếu mã

| Điểm | Bằng chứng tại base 25ad334 | Hệ quả |
|---|---|---|
| STANDARD đã nhận cờ | lib/rag/tra-loi.ts:191,425,431,456 | Tái dùng CELES_LOP_HAN, không thêm cờ |
| Focused chưa nhận cờ đủ | lib/rag/focused/tra-loi-focused.ts:468,542; focused/hieu-cau.ts:212-225 | Phải phủ cả dựng dữ kiện, từng cửa sổ và dựng lại lượt |
| Renderer Focused chưa trình bày đầy đủ lớp mới | focused/prompt.ts:238-263 | Truyền cờ đơn thuần chưa đủ |
| Cấm lưu Hóa ở nhiều tầng | focused/kiem.ts:317; quet-ten.ts:162,223,255; hop-dong.ts:45,72 | Thay bằng kiểm quan hệ, không chỉ mở danh sách tên |
| Bảng sự thật đã có lớp và cung | lib/tuvi/tu-hoa-han.ts:32-40,59-61,112 | Chỉ đọc API engine, không tính lại |
| Dữ kiện hoá đang dùng một namXem | lib/rag/boi-canh-la-so.ts:352-374 | Cửa sổ qua Tết có thể cần hai năm |
| Truy hồi v3 mới bóc hoá vận năm | lib/rag/v3/truy-hoi-v3.ts:311-312 | Mở vai trò đại vận, không gọi DB trong test |
| Sửa chữ STANDARD chưa bảo đảm chặn chữ sai | sua-chua.ts:344,399; tra-loi.ts:604,642 | Phải kiểm lại lời ra cuối |
| Focused thử tối đa hai lần, hỏng trả rỗng | focused/chay.ts:70-105; app/api/hoi-dap/route.ts:279-283 | Dùng đường lỗi sẵn, không bịa câu luận dự phòng |
| Base còn trái C1/C3 | nghieng-ve.ts:872-896 | Máy 1 sửa 3a'; máy 2 không động tệp này |

## 3. Phương án 3b — commit mã thứ nhất

### Cờ, dữ kiện và lời giải thích theo lượt

- Đọc CELES_LOP_HAN tại boundary server rồi truyền tham số xuống Focused; không để hàm thuần tự đọc env, tránh import vòng từ tra-loi.ts.
- Phủ mọi caller chonBoiCanh/tinhNghiengVe qua grep; chỉ sửa caller trong phạm vi máy 2. Các bề mặt khác được ghi nhận, không tự đổi Hành trình của máy 1.
- boi-canh-la-so.ts: nhánh bật bổ sung dữ kiện lưu/tứ hoá đại vận theo năm và cửa sổ thực sự được hỏi; ánh xạ F/W đúng cửa sổ, xử lý đổi năm âm và đổi đại vận. Nhánh tắt giữ thứ tự, ID và chuỗi cũ.
- focused/prompt.ts: renderer lớp hạn in kết quả hạn và nền mà API máy 1 cung cấp; không tự chấm điểm, xếp nền hoặc suy mức hoá giải. Tên chỉ được cấp quyền khi có trong chữ prompt thật.
- focused/hieu-cau.ts và nơi phát metadata: thêm dấu chế độ có chữ ký chỉ ở nhánh bật; metadata khác chế độ hoặc thiếu dấu cần thiết thì loại theo cơ chế metadata không dùng được hiện có. Không dựng lại căn cứ cũ theo cờ mới. Off→off giữ schema/byte cũ. Kiểm cả bật→tắt và tắt→bật.

### Validator hoá và chữ trong lời luận

- Thay lệnh cấm lưu Hóa bằng kiểm quan hệ hoá–sao–cung–nguồn–năm/cửa sổ ở nhánh bật; nhánh tắt giữ hành vi cũ.
- Cặp phải vừa đúng bảng sự thật engine vừa có căn cứ được in trong prompt. Nói “lưu” phải đúng lớp năm, nói “đại vận” phải đúng lớp đại vận. Không dùng hợp ba bảng để hợp thức hoá nhãn sai lớp.
- Kiểm từng quan hệ trong câu nhiều sao, không ghép chéo giữa các vế/cửa sổ. Chỉ chấp nhận thiếu nhãn khi xác định duy nhất bằng căn cứ và ngữ cảnh; không chắc thì yêu cầu sửa trong vòng hiện có.
- Không có luật bắt câu trả lời phải nhắc cả hai danh sách. Có dữ kiện phía nào thì cho model thấy phía đó; không bịa phía thiếu.
- Bộ quét lời vận hạn sau cờ dùng CUM_TIENG_LONG_CAM, AN_DU_CAM nguyên regex (export từ dau-an.ts), cùng cụm xe/đường đã liệt kê trong CHIA-VIEC:89-95 và chồng lớp/tín hiệu/lực cản. Không cấm chữ “xe” đơn lẻ; không nới soatNgonNgu, không đổi PHIEN_BAN_NGON_NGU.
- Focused dùng vòng viết lại hiện có, tối đa hai lượt logic. STANDARD gom câu lỗi vào lượt sửa hiện có, không thêm vòng sửa. Quét lại lời ra cuối cùng và giữ nhất quán answer/claims/coCauTruc.
- Nếu sửa xong vẫn vi phạm: không trả câu cấm; dùng đường thất bại 502 sẵn có. Không coi việc ghi dat:false là đã chặn, không sáng tạo câu luận dự phòng đổi kết luận. Hệ quả có thể tăng lỗi trả lời khi bật cờ; cần đo trước khi bật production.

### Q-nguon và Q2

- Quét toàn bộ prompt runtime, không giới hạn “4 prompt”: prompt-co-can-cu.ts, focused/prompt.ts, bai-dai.ts, bang-linh-vuc.ts và mọi điểm grep tìm thêm; kiểm cả scripts/oracle-ten-prompt.ts và docs/chien-luoc/CEL-186-ve-B-phuong-an.md.
- Bỏ lời tự thuật thiếu kho/tài liệu/nguồn; giữ mức chắc chắn và thu hẹp kết luận theo dữ kiện. Prompt runtime thay đổi sau cờ để đường tắt vẫn nguyên byte; không sửa câu “chưa đủ căn cứ” chỉ vì khớp chuỗi nếu câu đó nói đúng mức chắc chắn.
- Q2 thay đúng câu: “Nam phái làm chuẩn cho an sao. Khi luận vận hạn, kết hợp sao lưu với tứ hoá theo hạn; cả hai cùng là căn cứ của lớp hạn.” (QUYET-DINH:58-59).
- AGENTS.md là vùng Chung. User cấm push nên không thực hiện bước ghi TRANG-THAI lên main; hiện chỉ đăng ký phạm vi trong phương án này. Trước khi sửa Q2 cần chủ dự án xác nhận đăng ký vùng Chung đã có trên main hoặc cho ngoại lệ rõ ràng; không mặc nhiên dùng duyệt phương án làm quyền push.

## 4. Commit 4 phần mã — chỉ làm khi 3b xanh

- v3/index.ts truyền tham số cờ vào dungDuKien (hiện caller tại :260); giữ cờ server.
- v3/du-kien.ts: với câu thoiDiem, nhánh bật đưa khối lớp hạn lên trước; ngay sau là nền cung đang xét, giữ sao gốc và cách cục gốc. Không lược bỏ dữ kiện gốc, không coi nền chỉ là trang trí.
- Bổ sung hoá đại vận bằng API engine, định dạng “Hóa X vào Sao (Cung)”; v3/truy-hoi-v3.ts bóc thêm vai trò đại vận và loại trùng truy vấn khi đúng cùng quan hệ, giữ lớp/năm đúng.
- v3/prompt-v3.ts tránh ép hai mặt đối với câu vận hạn sau cờ, không thay kết luận máy 1.
- Không sửa DB, kho tri thức, THE_HE_DEM, PHUONG_PHAP.phienBan hoặc khoá đệm. Không bật cờ production.

## 5. Tệp dự kiến

3b: lib/rag/focused/{tra-loi-focused,hieu-cau,prompt,kiem,quet-ten,hop-dong,chay}.ts; lib/rag/{boi-canh-la-so,tra-loi,kiem-duyet,sua-chua,dau-an,prompt-co-can-cu,bai-dai,bang-linh-vuc}.ts; AGENTS.md theo điều kiện vùng Chung; scripts/oracle-ten-prompt.ts và các bài test Focused/hieu-cau/lop-han/sửa câu liên quan; tài liệu CEL-186 cần đồng bộ.

Commit 4: lib/rag/v3/{index,du-kien,truy-hoi-v3,prompt-v3}.ts và bài test tương ứng.

Dự kiến thêm helper thuần lib/rag/kiem-lop-han.ts dùng chung cho quan hệ hoá/quét lời giữa STANDARD và Focused; không đọc env hay gọi dịch vụ trong helper. Không sửa lib/rag/nghieng-ve.ts hoặc lib/tuvi/**. Nếu máy 1 đổi hợp đồng kết quả, dừng ở điểm tích hợp và cập nhật phương án, không tự phát minh hợp đồng mới.

## 6. Kiểm nghiệm dự kiến — chưa chạy kiểm tính năng

- Mốc so byte là base 25ad334; cố định ngày, năm xem, request ID, model và truy hồi bằng mock. Không so văn model thật vốn dao động.
- Cờ thiếu/0: dữ kiện, F/W, prompt, metadata, validator và đầu ra pipeline giống base từng byte; v3 tương tự. Không đổi các phiên bản/khoá bị cấm.
- Cờ bật: đúng cặp qua; sai sao/cung/lớp/năm/cửa sổ phải trượt; nhiều quan hệ, mơ hồ và ca cặp đúng ở W1 nhưng gán W2 phải trượt.
- Qua Tết, đổi đại vận, metadata bật↔tắt và thiếu dấu; xác nhận không dùng căn cứ sai lượt.
- Oracle độc lập dựng từ prompt render; thử đột biến cấp quyền từ metadata hoặc mở sai cặp phải làm test đỏ.
- Đột biến bỏ quét tiếng lóng/ẩn dụ phải đỏ; “tai nạn xe cộ” không bị cấm vì chữ xe. Sửa lỗi thành công, sửa vẫn lỗi, hết thời gian, 502 và coCauTruc nhất quán.
- Không ép hai mặt, không bịa nội dung thiếu nguồn; v3 thứ tự hạn→nền, giữ sao/cách cục và regex đại vận.
- Chạy node scripts/kiem-nhanh.mjs --chay --tu origin/viec/van-han-lop-han để kiểm delta riêng; nếu nhánh đích tiến thêm, ghim base đã ghi để không bỏ sót delta. Kiểm tập bài thực tế trước khi chạy, chỉ OFFLINE.
- Sau code: celes-domain + qa + bien-tap-vi song song; soat-tai-lieu; kiem-truoc-push chỉ rà, không push.
- Hai commit mã riêng, mỗi commit cập nhật CEL-200 ở Backlog/Logic chi tiết/Nhật ký, giữ JSON replay backlog để nhánh đích áp lại xlsx. Không sửa xlsx trong giai đoạn phương án.

## 7. Phản biện: Sập / Lung lay / Đứng được

- Sập: nhận định có sẵn “fallback câu sạch” đã bị bác; đã thay bằng kiểm lại và đường thất bại hiện có, không dựng kết luận giả.
- Lung lay: đổi chế độ giữa các lượt, gán hoá sai cửa sổ, cấp quyền tên từ metadata, và tăng tần suất sửa. Phương án thêm dấu chế độ có chữ ký, kiểm quan hệ theo F/W, oracle độc lập và test chuyển chế độ; chưa được coi là đã giải quyết cho tới khi test thật.
- Đứng được: ranh giới không sửa máy 1; một cờ, đường tắt nguyên byte; validator quan hệ thay lệnh cấm; hai commit riêng; v3 giữ nền cung gốc.
- Phụ thuộc: base nghieng-ve còn ép hai mặt và coi nền chỉ dẫn chứng. Máy 1 phải sửa 3a'; máy 2 không thể báo toàn hệ đạt C1/C3 trước khi tích hợp.

## 8. Chi phí và điều kiện nghiệm thu

soat-chi-phi: PASS có điều kiện cho nghiên cứu/kiểm OFFLINE; CHƯA đủ bằng chứng cho vận hành tăng thêm bằng 0.
Không thêm dịch vụ/thư viện/cron/model. Trần Focused giữ 2 lượt; STANDARD dùng lượt sửa hiện có (maxTokens 900), nhưng detector rộng hơn có thể tăng tần suất sửa và regex mới có thể tăng truy hồi/embedding. Chuỗi fallback hiện có provider trả phí; AI_NGAN_SACH_TOKEN=0 không phải công tắc cấm chi.
Trong phiên này không phát sinh lời gọi API model/embedding/DB. Không tự chạy eval-chat-quyet-dinh.ts; chủ dự án quyết chạy sau khi 3a' và 3b tích hợp, trước bật cờ.

## 9. Đánh giá tác động sau phản biện

Mức tác động: CAO. CẦN CHỦ DỰ ÁN DUYỆT: CÓ — đổi luật lời trả và Q2 thuộc vùng Chung. Không phải thay engine.

| Phần | Tác động/giới hạn |
|---|---|
| Engine | Không đổi phép tính hoặc 60 fixture; phụ thuộc kết quả 3a' máy 1 |
| Dữ kiện/truy hồi | Thêm hoá theo năm/cửa sổ, đổi thứ tự v3; số token/truy vấn tăng chưa đo |
| Prompt/validator | Quan hệ sai, chữ cấm phải sửa hoặc thất bại; tỉ lệ thử lại/502 chưa đo |
| Meta hội thoại | Thêm marker chỉ nhánh bật; đổi chế độ loại căn cứ cũ. Cam kết byte-identical cho off→off; chuyển chế độ là ca kiểm hành vi riêng |
| Bộ đệm | Giữ khoá/thế hệ; bài v3 cũ có thể vẫn được phục vụ. Nghiệm thu logic mới bằng mock trước, không xả đệm |
| Phiên bản | Không tăng hằng validator toàn cục làm đổi off. Nếu cần phiên bản mới, chọn giá trị hiệu lực chỉ khi bật; cả trace và kết quả kiểm off giữ giá trị cũ (tra-loi.ts:669, kiem-duyet.ts:347) |
| App | Không sửa engine/app; app dùng chung API chat nên có thể nhận chữ/lỗi mới. Kiểm hợp đồng API/meta bằng mock; không tuyên bố đã nghiệm thu app |
| DB/SQL | 0 thay đổi schema/dữ liệu thật. Marker nằm trong hợp đồng meta hiện có, không thêm bảng/cột |
| Chi phí/độ trễ | Giữ trần gọi, chưa biết mức tăng tần suất sửa/embedding, chưa đủ chứng minh ngân sách vận hành 0 |
| Tài liệu/backlog | CEL-200, hai commit mã riêng cùng JSON replay; Q2 chờ điều kiện thông báo vùng Chung |

Điều kiện trước code: chủ dự án duyệt phương án, gồm cách xử lý meta chuyển chế độ và sửa thất bại. Q2 chỉ áp dụng sau khi đăng ký vùng Chung trên main đã được xác nhận hoặc chủ dự án cho ngoại lệ; không tự push.

Kiểm lại nguồn cuối phiên: origin/viec/van-han-lop-han vừa tiến lên 017b69b, chỉ thêm docs/chien-luoc/van-han-lop-han/GIAI-PHAP-3-viec-cach-cuc-phuc-tinh-hoa-giai.md. Đã đọc phần mở đầu xác nhận đó là đề xuất nhãn nền/hoá giải của máy 1. Không có mã thay đổi giữa 25ad334 và 017b69b. Worktree giữ base 25ad334 đã rà; trước code fetch lại và cập nhật base an toàn trong chính worktree này, không checkout ở thư mục Claude.

## 10. Bàn giao giai đoạn phương án

- Hoàn tất kiểm quyền ghi, kết nối GitHub đọc/fetch, cài phụ thuộc và kiểm TypeScript nền.
- Hoàn tất researcher + celes-domain (ràng buộc), phan-bien, soat-chi-phi, danh-gia-tac-dong.
- Chỉ thêm tài liệu phương án này; chưa đổi mã tính năng, chưa commit, chưa nghiệm thu tính năng, chưa chạy eval model thật.
- Chưa chạy kiem-truoc-push vì giai đoạn này chỉ trình phương án, không có commit mã để rà và không báo “push được”.
- Còn lại: duyệt → code theo thứ tự 3b rồi Commit 4 mã → kiểm offline/reviewer → backlog/commit → chủ dự án nghiệm thu. Không push hoặc merge.



Cập nhật triển khai 3b: main đã có đăng ký vùng Chung nêu đích danh AGENTS.md quyết định số 1 của đợt vận hạn, nên Q2 được áp dụng trong nhánh máy 2; không push trạng thái. Reviewer bắt các ca nhiều vế/chip, đã thêm regression và ghi bài học. Kết quả kiểm cuối ghi trong báo cáo bàn giao, không coi phần kế hoạch kiểm ở trên là kết quả đã chạy.
