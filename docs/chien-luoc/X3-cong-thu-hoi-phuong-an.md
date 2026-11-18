# X3 — cổng thu hồi tri thức, phương án trước code

CELES-27 · Codex (máy 2) · 22/10/2026 · Nền ghim viec/so-mu-cach-viet tại306b539ab3b92a6b768cf9231044a6a932d22e7f (đã có K1+K2+K3 tháng), theo prompt làm tiếp mục2 B1.

Trạng thái B1: chỉ phương án để Claude soát; chưa có mã X3. Worktree tài liệu riêng D:/SAPP BA/tuvi-ai/wt-phuong-an-thu-hoi, nhánh viec/phuong-an-thu-hoi từ306b539. Không sửa worktree Claude và không tạo nhánh mã từ main.

Theo prompt mới, B2 chỉ bắt đầu sau Claude ghi góp ý/gỡ block CELES-27 và có origin/viec/tich-hop-dot-1. Khi đó tạo viec/cong-thu-hoi từ nhánh tích hợp này; chưa có thì chờ. Điều kiện này thay điều kiện cũ chờ K2 lên main, không tự gộp K2/main. Quyền push nhánh tích hợp thuộc Claude, Codex vẫn không push.

## Mục tiêu và ranh giới

Một mục đã thu hồi không được đưa vào prompt mới hoặc được dùng lại qua bài V3 có căn cứ đã lưu. Phủ từng câu hỏi V3, Tóm lại, Bức tranh lớn, mọi đường giữ bài cũ/thế hệ trước và Sổ kết luận ở lượt chat mới. Không xoá lịch sử chat, không sinh lại bài hàng loạt, không thêm dịch vụ hoặc cron, không tự triển khai xưởng biên tập đợt 2.

Đơn vị câu trả lời là nguyên CauTraRaV3 của một câu hỏi, gồm luanGiai/viSao/yChinh/goiY, không cắt một câu văn. Tóm lại và Bức tranh là hai đơn vị dẫn xuất riêng. Không ẩn cả chủ đề nếu chỉ một câu hỏi bị ảnh hưởng.

## Hiện trạng đã kiểm trên nền306b539

- xu-ly.ts:163–174,499 lưu canCu từng câu: thuVien {ma,id,dot,dau}, nguon {ma,documentId,versionId,chunkId}. Mã T###/E### không là định danh thu hồi.
- Tóm lại và Bức tranh mới lưu text/kho/lg, chưa có hợp căn cứ (xu-ly.ts:345–398).
- Các đường cần chặn: cache hit 433; khách hết lượt trả banCu 441; giữ bài cũ khi sinh hỏng 516/534; thế hệ trước 523–524; Bức tranh/Tóm lại fallback 370/391–394; sổ ý dùng bài trước khi sinh 468–471.
- Matcher khop.ts:91–108 chỉ bỏ bi-bac. RAM thư viện kho.ts:22–62 có thể trả dữ liệu cũ khi đọc lỗi; không được chỉ lọc một lần lúc nạp gói.
- Sổ kết luận so-ket-luan.ts:29–50 rút Tóm lại hoặc yChinh trước khi cấp chat, chưa có cổng hiệu lực. Chặn bản ghi trước khi lấy cauDau/yChinh.
- CanCuMuc của mục thư viện chỉ có documentId/chunkId, chưa có versionId (thu-vien/kieu.ts:49–53). Không giả canCu.nguon riêng đã bao hết nguồn sách đứng sau mục thư viện.

## Thiết kế đề xuất

### 1. Danh sách thu hồi và định danh

Thêm bảng registry nhỏ, chỉ server/service-role đọc/ghi; RLS bật, không policy anon/authenticated. Bản SQL chỉ CREATE TABLE/INDEX IF NOT EXISTS và cấu hình quyền phù hợp; không DROP/DELETE/đổi kiểu bảng hiện có, không chạy DB trong phiên.

Dự kiến mỗi hàng gồm:
- loai: muc-phien-ban, muc-noi-dung, document, version hoặc chunk (CHECK);
- dinh_danh: text không rỗng;
- su_kien_id: UUID để nhóm các khoá của cùng một lệnh thu hồi; khoá chính theo pham_vi/su_kien_id/loai/dinh_danh, không ép mỗi target chỉ có một sự kiện;
- pham_vi: all hoặc phạm vi server trả về từ phamViDem; Preview test chỉ ghi đúng namespace của nhánh Preview, không ghi all/production;
- huy_luc/huy_boi: nullable, hoàn tác mềm đúng sự kiện, không DELETE lịch sử;
- ly_do: lý do vận hành, không gửi ra mặt trước;
- thu_hoi_luc: timestamptz mặc định now();
- nguoi_thu_hoi: thông tin người vận hành theo cách audit sẵn có, không lấy quyền từ trình duyệt.

Không coi id mục hiện tại là bền: scripts/dung-thu-vien.ts:467–469 cấp id sau sắp xếp, nên dựng lại có thể đổi nghĩa cùng id. dauMuc trong v3/index.ts:268 chỉ là SHA-1 rút8hex, không dùng riêng nó làm định danh nội dung toàn cục.

Khi thu hồi một mục phải ghi cùng một sự kiện gồm hai khoá bổ sung nhau (một giao dịch của người có quyền):
- muc-phien-ban: JSON chuẩn hoá của bộ [dot,id,dau], nhận diện chính xác tham chiếu đã lưu K1, không chỉ id.
- muc-noi-dung: SHA-256 đầy đủ trên biểu diễn chuẩn hoá của câu nghĩa/điều kiện dùng để so nội dung, kèm bản chụp canonical để đối chiếu. Dùng cùng một helper có version cho cả ghi thu hồi và kiểm candidate; không lấy dấu8hex thay SHA-256. Không bao gồm id/dot để cùng nội dung bị cấp id mới vẫn bị chặn. Chuẩn hoá không tuyên bố phát hiện mọi cách diễn đạt tương đương về nghĩa.

Candidate thư viện mới kiểm cả hai: cùng id nhưng nội dung khác không tự bị rút vì trùng id; cùng nội dung đổi id vẫn trùng khoá nội dung. Bài tracked cũ có bộ [dot,id,dau] kiểm chính xác trước; cần so khoá nội dung mà không giải được mục cũ thì unknown, không lấy bản hiện tại thay cho bản lịch sử. Từ câu mới lưu thêm fingerprintVersion/hash đầy đủ để tránh phụ thuộc gói lịch sử. Không tự cập nhật dấu của bài cũ.

Document/version/chunk so đúng loại định danh. Không tự gỡ lệnh khi ra gói mới hoặc cấp lại id; TC-12 cho phép hoàn tác đúng một sự kiện thử như phần Preview dưới đây; không tự gỡ lệnh theo gói mới. SQL thao tác ghi sự kiện phải đảm bảo hai khoá mục nhất quán; thiếu khoá/bản chụp canonical là sự kiện không hợp lệ, chưa coi là thu hồi được cả lịch sử lẫn prompt mới.

Bảng không tạo giao diện quản trị mới; SQL/ghi lệnh thu hồi do người có quyền thực hiện theo bàn giao. Đây là thiết kế đề xuất, chưa xác nhận schema thật hoặc kiểm được SQL chạy hai lần.

### 2. Bộ kiểm hiệu lực dùng chung

Một bộ kiểm trả ba trạng thái: con-hieu-luc, da-thu-hoi, chua-xac-minh. Nhận danh sách thu hồi và căn cứ có kiểu, không suy hiệu lực từ kho/lg hoặc thế hệ.

- Đọc registry theo batch ở ranh giới request, phân trang đầy đủ, lỗi đọc không được thành danh sách rỗng. Không dùng một RAM snapshot thu hồi cũ để trả đệm DB.
- Mục trong RAM thư viện vẫn qua bộ kiểm mục/cha nguồn sau cache, trước matcher/giới hạn chọn. Tích hợp trong v3/index.ts:chuanBiCau, trước dungKhoiThuVien; không chỉ lọc ở lúc đọc gói.
- Nguồn trực tiếp từ truyHoiChoCau được kiểm document/version/chunk trước ghép prompt trong chuanBiCau, kể cả kết quả từ BoNhoTruyHoi. Nguồn cha của mục thư viện cũng phải được giải và kiểm ba loại này trước dungKhoiThuVien. Không chờ đến sau sinh mới phát hiện nguồn đã rút.
- Kiểm trạng thái trước mọi lần gọi model chính, sửa cục bộ và thử lại trong index.ts; tất cả dùng tập căn cứ đã lọc. Nếu căn cứ cần dùng bị chặn hoặc chưa xác minh hết thì trả trung tính, số lời gọi model viết/sửa bài bằng0 (zero-writer-call); không hứa chưa có embedding truy vấn ở bước truy hồi trước đó. Sau sinh vẫn kiểm lại để bắt thu hồi xảy ra giữa chừng.
- Bài tracked trùng bất kỳ căn cứ đã thu hồi thì ẩn nguyên đơn vị; bài tracked chưa xác minh được thì trả trung tính, không lùi sang bài tracked cũng chưa xác minh.
- Bài thực sự cũ, vắng cả marker và canCu: giữ theo 10.9/10.18. canCu rỗng hợp lệ khác canCu hỏng; bản mới có marker nhưng mất canCu không được đi cửa legacy.
- Lệnh thu hồi có thể xuất hiện trong lúc model đang viết: kiểm lại căn cứ sau sinh, trước lưu/trả. Không trả văn vừa sinh nếu đã mất hiệu lực. Phải đọc trạng thái registry mới sau sinh, không kiểm lại cùng snapshot đầu request; nếu đọc mới lỗi thì tracked unknown. Thu hồi giữa lúc model đang chạy không hoàn lại token đã tiêu.
- Không biến bài bị thu hồi thành chuaViet để luồng điền câu thiếu tự gọi model. Thu hồi tự nó không tạo lời gọi hoặc tiêu hạn mức mới.

Registry đọc mới bảo vệ đường DB; dữ liệu RAM khác tuân giới hạn tối đa khoảng 30 phút của quyết định10.8. Không hứa chặn tuyệt đối tức thời trên mọi máy.

### 3. Phụ thuộc nguồn sách gián tiếp

Đối với canCu.thuVien, chỉ nhận bản mục tra lại đúng id/dot và kiểm dấu/bản chụp; chưa chứng minh có kho lưu mọi bản lịch sử theo dau, nên không gọi gói theo đợt hiện hành là gói đóng băng. Nếu bản hiện tại không khớp thì unknown, không thay thế. Candidate mới đã có thân mục nên lấy trực tiếp documentId/chunkId từ canCu của nó trước prompt. Khi cần kiểm thu hồi version, ánh xạ chunk sang version bằng nguồn dữ liệu đọc hiện có. Không suy version từ tên sách hoặc phiên bản gói.

Thiếu gói cũ, thiếu chunk/version hoặc lỗi tra cứu: phần phụ thuộc đó là chua-xac-minh, không được khẳng định sạch. Từ bài mới có thể lưu thêm định danh nguồn gián tiếp đã xác minh để giảm tra lại; không sửa hồi tố bài cũ hoặc thay ý nghĩa căn cứ K1. Thiết kế chi tiết của resolver cần được rà lại khi có nền nhánh tích hợp trước B2. Đây là phần có nguy cơ phải bổ sung ngoài mốc lưu ban đầu của K1, phải phản biện/tác động trước code.

### 4. Căn cứ dẫn xuất cho Tóm lại/Bức tranh

- Tóm lại: hợp toàn bộ căn cứ của các câu thực cấp để tóm tắt.
- Bức tranh: hợp căn cứ của tất cả Tóm lại và Tổng quan thực cấp.
- Loại bản thu hồi/không xác minh trước dựng prompt/sổ ý. Hợp căn cứ không chỉ dựa vào mã model tự nhắc.
- Lưu marker theo dõi, trạng thái phủ day-du/co-phan-cu và danh sách phụ thuộc. Đầu vào có phần legacy không được giả là đã truy vết đầy đủ; cũng không tự thu hồi phần legacy chỉ vì thiếu dấu.
- Aggregate đã lưu có phụ thuộc tracked bị thu hồi: trả trung tính, không tự sinh lại. Aggregate cũ không có metadata được nhận diện riêng và giữ theo ngoại lệ, không suy rằng có kho/lg tức là có canCu.

### 5. Chặn mọi đường trả và Sổ kết luận

Dùng cùng predicate ở mọi nhánh đã liệt kê, không rải các phép so id khác nhau. Đầu ra ẩn không lộ tên tài liệu, T###, model, lý do nội bộ hoặc quota. Gợi ý lời trung tính: “Phần này đang được kiểm tra lại. Bạn có thể xem các phần còn lại.” Chữ cuối cần biên tập VI/EN nếu thay đổi bề mặt khi code.

Sổ kết luận lọc nguyên đơn vị và aggregate trước cauDau/yChinh; không đưa kết luận từ nội dung bị thu hồi vào chat mới. Không rà ngữ nghĩa để xoá câu người dùng đã thấy hoặc toàn lịch sử hội thoại.

## Tệp dự kiến và kiểm

Tệp mới cho registry/hiệu lực/union provenance trong lib/rag; sửa thu-vien/khop.ts hoặc điểm nạp matcher với predicate thuần; v3/xu-ly.ts, v3/so-ket-luan.ts; SQL chỉ thêm dưới supabase; test mới và CI/danh sách kiểm. Nếu cần resolver nguồn gián tiếp, ghi rõ tệp/lookup trước sửa. Không sửa engine, model config, workbook hoặc khoá đệm logic/giọng của K2.

Test offline phải phủ:
1. Mục thu hồi không vào prompt, kể cả từ RAM/stale-cache; lọc trước trần. Cùng id/khác nội dung không chặn nhầm; cùng nội dung/đổi id vẫn bị chặn bằng hash đầy đủ; dấu8hex không cấp quyền tự suy đồng nhất.
2. Thu hồi một mục không model nhắc nhưng đã cấp vẫn chặn.
3. Các đường cache hit/hết lượt/lỗi sinh/banCu/thế hệ trước đều không lọt.
4. Tóm lại/Bức tranh hợp provenance đầy đủ của đầu vào thực cấp và không tái dùng mục đã thu hồi.
5. Sổ kết luận loại nội dung trước rút câu; chat mới không nhận kết luận đó.
6. Legacy không canCu giữ nguyên; rỗng hợp lệ/hỏng/mất marker phân biệt đúng; không tự sinh lại.
7. Thu hồi document/version/chunk: trực tiếp và cha nguồn thư viện, kể cả retrieval cache; không ánh xạ được thì unknown, không cấp prompt. Toàn bộ căn cứ cần dùng bị chặn thì zero-writer-call, không chỉ giấu câu trả lời sau khi đã gọi.
8. Registry lỗi, hơn1000hàng, thu hồi giữa lúc sinh, aggregate trộn legacy/tracked; không phát sinh model hoặc quota do thao tác thu hồi.
9. Metadata không ra trình duyệt; lỗi trung tính; các cổng K1/K2 giữ nguyên.
10. SQL chạy lặp: chỉ tuyên bố PASS khi có môi trường local/fake phù hợp kiểm được DDL, hoặc người vận hành đã chạy hai lần; đọc chữ IF NOT EXISTS không thay cho bằng chứng chạy.

Seam sẵn có: MoiTruongV3.dem/docThuVien; client Supabase giả; test-dau-logic-v3.ts và test-thu-vien-prompt.ts. Không DB/model thật hoặc eval trả phí.

## Lệnh thử thu hồi và hoàn tác trên Preview (B2, TC-11/TC-12)

Chỉ viết/cung cấp script hoặc lệnh có hướng dẫn, không tự chạy lên Supabase. Mặc định dry-run; khi người có quyền áp dụng phải xác nhận đúng namespace Preview từ phamViDem của server. Dùng cấu hình/quyền server sẵn có, không thêm dịch vụ hoặc lộ key. khaiBaoScript hiện chỉ chọn local/production, không được lấy local của CLI làm namespace Preview; xác minh Preview đích bằng phạm vi tin cậy phía server. Preview cùng DB production nên cờ môi trường của script không được tự suy là mọi ghi đều cách ly.

- Registry thật đọc mục all cộng scope phù hợp; scope do server quyết, không tin trường do khách gửi để bỏ qua lệnh global.
- Lệnh thử TC-11 chỉ tạo sự kiện ở đúng namespace Preview, có id trả lại, nhóm các khoá mục nhất quán. Test offline: production và Preview nhánh khác không bị sự kiện thử ảnh hưởng.
- TC-12 hoàn tác mềm đúng su_kien_id trong scope Preview bằng một giao dịch nguyên tử cho toàn bộ khoá tuple/hash của sự kiện: ghi huy_luc/huy_boi, không xoá. Mục chỉ quay lại nếu không còn sự kiện thu hồi hiệu lực nào khác chặn nó hoặc cha nguồn của nó. Hoàn tác một lệnh không được huỷ lệnh độc lập khác.
- Ghi thu hồi/hoàn tác là thao tác server có quyền; chỉ hướng dẫn người dùng/Claude thực hiện khi được giao. Không mở UI mới. SQL chỉ thêm schema; thao tác dữ liệu thử phải chỉ rõ scope/sự kiện, không tự chạm production.
- Viết test áp dụng lại/hoàn tác lại không phá dữ liệu hoặc tạo quyền ngoài scope; SQL migration chạy lần hai không lỗi phải có bằng chứng chạy phù hợp, chưa kiểm ở B1.

## Trình tự tiếp tục và bàn giao

1. B1 lưu file này tại docs/chien-luoc/X3-cong-thu-hoi-phuong-an.md; ghi Vibe rồi block đúng “chờ Claude soát phương án X3”. Không viết mã/SQL tích hợp.
2. Claude ghi góp ý/gỡ block CELES-27. Khi origin/viec/tich-hop-dot-1 đã có, tạo worktree mới và nhánh viec/cong-thu-hoi từ đúng ref đó, không từ main hoặc tự gộp nhánh khác.
3. Rà lại nền tích hợp, đặc biệt đường B không có trong306b539: mọi writer/repair/retry mới phải qua cùng cổng. Không nhận B1 đã chứng minh phủ đường B ở nhánh khác. Khóa resolver/canonical/metadata bằng fixture rồi viết test trước mã.
4. B2 bắt buộc T-06: thu hồi mục → câu trả lời mới không còn mục; bài cũ không tự sinh lại; migration chạy hai lần; fallback thế hệ trước cũng chặn. Bổ sung TC-11/12 và phạm vi Preview theo mục trên.
5. QA/domain/biên tập nếu có chữ mặt trước; kiem-nhanh và tsc sạch; commit riêng. SQL/lệnh thử do người có quyền chạy. Codex không push/merge hoặc sửa workbook/AGENTS/model configs.
6. Claude cập nhật workbook: Backlog cổng thu hồi; Logic định danh/predicate/legacy/mọi đường trả/Sổ kết luận; Nhật ký vì cache/provenance thiếu có thể đưa lại nội dung đã rút. Để trạng thái B1 chuẩn bị, chưa hoàn tất X3.

## Mốc phản biện trước code

Bản nháp đầu bị đánh sập ở hai điểm: nhầm id cấp theo vị trí là id bền và chưa ghi đủ chốt nguồn trực tiếp/gián tiếp trước prompt. Đã sửa trên giấy theo dữ liệu K2: định danh phiên bản cộng hash nội dung đầy đủ, chặn cha nguồn và nguồn retrieval trước mọi lần gọi; bản lịch sử không giải được là unknown. Không có mã bị viết rồi bỏ hoặc DB bị tác động. Phản biện đã rà lại và PASS hợp đồng trên giấy. Đánh giá tác động CAO, PASS phương án chuẩn bị, không phát sinh quyền chủ dự án phải duyệt ngoài X3. Cần chốt kiểu resolver/canonical và fixture khi nhận nền tích hợp trước triển khai; chưa xác nhận runtime hoặc SQL.

## Kết luận chuẩn bị và trạng thái thật

- Researcher đã ghim và rà K2 2d845f4 ở lượt trước; lượt này đã rà drift tới306b539 và các điểm tích hợp X3 không đổi. Domain đã soát đơn vị thu hồi, provenance aggregate, legacy và Sổ kết luận.
- Phản biện PASS sau sửa hai blocker. Tác động CAO, PASS phương án chuẩn bị, không có quyết định sản phẩm mới buộc xin chủ dự án duyệt.
- Chi phí PASS có điều kiện ở mức phương án: không dịch vụ/model/cron/thư viện mới; query/metadata/latency tăng chưa đo, chưa xác minh free tier thực. Đã sửa lời hứa zero-model thành zero-writer-call.
- Không chạy test/SQL/DB/model cho X3; không có mã mới, không tạo nhánh X3, không thay X1/X2 hoặc worktree Claude. File này là bàn giao nghiên cứu, chưa phải việc X3 hoàn tất.
- Điều kiện tiếp tục theo prompt22/10 mục2 B2: Claude soát/gỡ block và origin/viec/tich-hop-dot-1 sẵn có; tạo nhánh mã từ nhánh tích hợp, không từ main.
- Bài học chuẩn bị: không gọi id là bền nếu chưa đọc chỗ sinh/cấp lại id; hash8hex hiện có không được nâng thành identity toàn cục. Lỗi bị bắt trên phương án, đã sửa trước code; khi mở nhánh X3 đưa bài học vào docs/bay/ai-rag.md và nhật ký theo quy trình, không đẩy main trong phiên này.

## Ghi chú nền và cổng review B1 mới

Researcher đã so306b539 với2d845f4: các tệp V3/thu-vien/noi-dung-ai/tra-loi/routeV3/SQL không đổi; các điểm chèn trên vẫn giữ dòng. Nhánh B chưa nằm trên306b539. Đã đọc prompt tiếp tục và mục7 tệp điều phối; thay điều kiện chờ main bằng nhánh tích hợp/gỡ block đúng B2. Phần thử/hoàn tác Preview mới cần Claude soát cùng hợp đồng thu hồi trước code.

Review B1 trên nền306b539: phản biện PASS; đánh giá tác động CAO nhưng chỉ tài liệu hiện tại nên runtime/DB chưa đổi, không phát sinh quyền chủ dự án phải duyệt mới. Đã ghi rõ xác minh namespace Preview và hoàn tác nguyên tử theo góp ý. Đây là review chuẩn bị nội bộ; vẫn phải chờ Claude soát/gỡ block đúng B1 trước B2.
