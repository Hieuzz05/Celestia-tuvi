# X2 — sửa cách xác định cung nguyệt hạn

CELES-28 · Codex (máy 2) · 22/10/2026 · Nhánh viec/nguyet-han.

Trạng thái cập nhật: đang triển khai theo chỉ đạo mới của chủ dự án “tiếp tục code theo kế hoạch” sau khi đã báo điểm chờ. Phương án và các mốc chuẩn bị bên dưới được giữ để lần lại. Chưa có phản hồi Claude trên Vibe; không ghi là Claude đã duyệt. X1 giữ nguyên ở commit f7495ca trên nhánh riêng, chờ nghiệm thu.

## Kết quả cần đạt

Hiện cung tháng Giêng trùng cung tiểu hạn cho mọi lá số. Quy tắc đã duyệt cần dịch vị trí đó theo tháng sinh âm lịch và chi giờ sinh, rồi mới đếm thuận đến tháng muốn xem. Một số tổ hợp tháng/giờ có độ dịch bằng 0 nên kết quả vẫn trùng cách cũ; không kết luận mọi lá số hiện đều sai. X2 chỉ sửa phép tính này; lời luận tháng ở mức chắc thấp thuộc K3.

## Nguồn đã đọc nguyên văn

1. Tử Vi hàm số — Nguyễn Phát Lộc, trang 26, tệp D:/Tài liệu tử vi/markdown/Tử Vi hàm số - Nguyễn Phát Lộc.md:325. Các mốc: “Khởi từ cung tiểu hạn”, “tính NGHỊCH đến tháng sinh”, “tính THUẬN đến giờ sinh”. Cung tiểu hạn được kể là tháng Giêng; điểm đến của bước tháng được kể là giờ Tý.
2. Số Tử Vi dưới mắt khoa học — Hà Thúc Hồng, trang 74–75, tệp D:/Tài liệu tử vi/markdown/Số Tử Vi dưới mắt khoa học.md:980–986. Dòng 981 xác nhận quy tắc trên và nêu “Song đi thuận mỗi cung một tháng.”
3. Cùng sách Hà Thúc Hồng, trang 136–137, dòng 1681–1689: giải thích bằng việc xoay Mệnh tới tiểu hạn, đồng thời cảnh báo hạn chế về độ chính xác của luận từng tháng. Đây không phải căn cứ để nói chắc sự kiện.
4. Dòng 2287 phân biệt nguyệt hạn khởi từ tiểu hạn với Đẩu quân khởi từ Thái Tuế; X2 không chuyển điểm khởi sang Thái Tuế.

Các số dòng là dòng bản Markdown cục bộ, không phải số trang PDF. Trang theo dấu trang trong bản trích.

## Mã tại mốc trước sửa và cách sửa

lib/tuvi/ansao.ts:446–447 hiện trả mod12(cungTieuHan(laSo, tuoiAm) + thangAm - 1).

Đề xuất trong đúng hàm cungNguyetHan:

```text
tieuHan = cungTieuHan(laSo, tuoiAm)
thangSinh = laSo.thongTin.amLich.thang
gioChi = hourToChi(laSo.thongTin.gio)  // Tý=0 ... Hợi=11
gieng = mod12(tieuHan - (thangSinh - 1) + gioChi)
ketQua = mod12(gieng + (thangAm - 1))
```

Trừ thángSinh−1 vì tháng Giêng đã ở điểm khởi; cộng chỉ số chi giờ vì Tý là 0 bước. Không lấy giờ dương 0–23 làm số bước.

Giữ tháng âm đã được lapLaSo tính sẵn sau xử lý sinh lúc 23 giờ (ansao.ts:178–187, :401); không đổi lịch thêm lần nữa. Giữ cungTieuHan, tuổi âm, chiều nam/nữ và chữ ký hàm. Tháng nhuận chưa được tách trong luồng Focused (scripts/test-focused.ts:1438–1455); X2 không tự mở thêm hỗ trợ đó.

## Chốt đáp án kiểm trước khi code

Đã đọc các đoạn quy tắc nêu trên. Chưa xác minh được ví dụ nguyệt hạn có đủ đầu vào và kết quả cụ thể trong những đoạn đã rà. Không khẳng định hai cuốn hoàn toàn không có ví dụ.

Ví dụ Hàm số dòng 324 và Hà Thúc Hồng dòng 974–977 là tiểu hạn; không được dùng làm đáp án nguyệt hạn. Cũng không dùng chính công thức mới tính ra đáp án rồi gọi đó là chứng cứ sách.

Claude cần soát và xác định một trong hai đường trước triển khai:

- Chỉ ra ví dụ nguyệt hạn gốc đủ điểm tiểu hạn, tháng sinh, giờ sinh và cung tháng kết quả; ghi cả trang và vị trí đoạn trích.
- Nếu chưa có ví dụ phù hợp, chốt rõ việc dùng đáp án đếm tay độc lập từ quy tắc nguồn, được chuyên gia kiểm lại. Đây là thay điều kiện “ca test lấy từ ví dụ sách” nên Codex chưa tự áp dụng.

Sau khi nguồn đáp án được chốt, bài kiểm mới phải có: ca đối chiếu theo đường đã được chốt (phân biệt ví dụ sách với đáp án đếm tay độc lập); kiểm không đếm thừa điểm khởi; tháng sinh âm/dương khác nhau; giờ Tý và Hợi; mốc 23 giờ qua tháng âm; vòng qua Tý/Hợi; nam/nữ dùng đúng tiểu hạn hiện có; tháng xem 1 và 12. Các ca biên bổ sung không được gắn nhãn ví dụ sách nếu chỉ là ca kỹ thuật.

Có thể dùng tính chất xoay Mệnh tới tiểu hạn theo dòng 1681 để kiểm bổ sung độc lập. Tính chất này không thay điều kiện đáp án sách đã được giao.

## Tệp dự kiến và cách kiểm

- lib/tuvi/ansao.ts: sửa thân cungNguyetHan và mô tả quy tắc.
- scripts/test-nguyet-han.ts mới: đáp án đã chốt có nguồn, ca biên và bất biến.
- .github/workflows/kiem-tra.yml và docs/quy-trinh/danh-sach-kiem-tra.md: đăng ký bài kiểm offline mới.
- Không sửa PHUONG_PHAP.phienBan, THE_HE_DEM, dữ kiện RAG, prompt, cấu hình model, DB hoặc workbook. Claude cập nhật workbook và phiên bản lúc gộp theo ngoại lệ kế hoạch.

Trước sửa: chạy riêng bài đóng băng bối cảnh để có mốc hiện tại. Sau sửa: chạy bài mới và kiem-nhanh --chay. Bộ 60 mẫu an sao chỉ lấy vanTay(lapLaSo), không gọi cungNguyetHan (scripts/test-ansao-chuan.ts:273–286); bộ đó xanh chưa chứng minh nguyệt hạn đúng.

Bộ bối cảnh có tháng xem (scripts/test-boi-canh-dong-bang.ts:61–90) có thể lệch sau sửa. Nếu đỏ, lưu chênh lệch và báo Claude; không chạy --sinh hoặc sửa mẫu cũ cho khớp mã. Không gọi model, DB thật hoặc chạy eval trả phí.

## Tác động và điều kiện phát hành

Hàm dùng chung cho mệnh bàn web, Hành trình, luận hạn, dữ kiện RAG và mệnh bàn app. Dẫn mã: components/laso/TuViChart.tsx:161; lib/tuvi/hanh-trinh.ts:208, :245; lib/tuvi/luan-han.ts:223; lib/rag/boi-canh-la-so.ts:238, :266; lib/rag/v3/du-kien.ts:707; apps/celes-app/src/giao-dien/menh-ban.tsx:786.

Không có task app đang làm trong danh sách Vibe đã đọc, nhưng chưa đủ chứng minh phiên app đã dừng. Claude cần xác nhận trước sửa vùng Chung. App dùng engine chung nên cần dựng lại khi phát hành.

Đã rà diff viec/van-han-3b và viec/van-han-lop-han: không sửa ansao.ts/phuong-phap.ts, nhưng có sửa bài đóng băng bối cảnh và dữ kiện. Không tự chép thay đổi của hai nhánh này.

K2 đang sửa khoá đệm; origin/main chưa có nhánh K2. X2 không tự tăng phiên bản. Claude phải chốt và kiểm hợp đồng phiên bản phương pháp, khoá V3, đường dự phòng và cách xử lý bài đệm cũ khi tích hợp với K2. Chưa khép điều kiện này thì chưa gộp/phát hành engine mới. X2 không tự quyết sinh lại bài hoặc chi phí sinh lại.

## Nội dung workbook bàn giao Claude

- Backlog: X2 đã triển khai cung nguyệt hạn theo tháng sinh âm và chi giờ; 9 nhóm kiểm mới PASS, hồi quy bối cảnh 192 ca không lệch sau ngoại lệ cập nhật mẫu đã duyệt. Chờ nghiệm thu mã và tích hợp cùng K2; điền commit mã từ dashboard CELES-28.
- Logic chi tiết: tiểu hạn → nghịch tháng sinh → thuận chi giờ → thuận tháng xem; giữ tháng âm đã xử lý Tý muộn; không đổi tiểu hạn/tháng nhuận.
- Nhật ký thay đổi: vì cách hiện tại đồng nhất tháng Giêng với tiểu hạn, bỏ hai đầu vào đã có trong lá số. Chỉ ghi hoàn tất và commit mã khi X2 thực sự qua kiểm.

## Cổng bàn giao ở mốc chuẩn bị (trước chỉ đạo tiếp tục code)

Researcher và celes-domain đã đọc hiện trạng. Chuyên gia Tử Vi PASS công thức và cách đếm; chưa đủ nguồn đáp án nghiệm thu. Phản biện PASS để bàn giao sau khi chỉnh nhất quán đường đáp án và cổng tích hợp đệm. Đánh giá tác động: CAO, PASS bàn giao; không phát sinh việc cần chủ dự án duyệt ngoài X2 đã được giao. Bước Claude soát vẫn bắt buộc theo kế hoạch.

- Sập: chưa chốt được nguồn đáp án số độc lập nên chưa đủ điều kiện viết mã và nghiệm thu.
- Lung lay: thay engine tác động nhiều bề mặt; phải phối hợp phiên app, đệm K2 và hai nhánh vận hạn chưa gộp. Snapshot đỏ không được tự đổi để cho qua.
- Đứng được: công thức và phạm vi đúng hai nguồn đã chọn; giữ tiểu hạn, tháng âm/chi giờ, không tự nâng độ chắc lời luận hoặc mở tháng nhuận.

Kiểm mốc trước sửa đã chạy: scripts/test-boi-canh-dong-bang.ts PASS, 192 ca lệch 0 và 2 lời gọi model giả cho cờ tắt. kiem-nhanh --chay xác nhận chỉ đổi tài liệu, không có tệp mã cần kiểm. Đây là kiểm mốc hiện tại, chưa phải kết quả nghiệm thu công thức mới.

Claude cần soát phương án, ghi nguồn đáp án được chốt và xác nhận phối hợp vùng Chung trên CELES-28. Nếu thay yêu cầu ví dụ sách bằng đếm tay độc lập thì phải ghi rõ ngoại lệ được chốt, không đổi tên đáp án thành ví dụ sách. Codex chỉ tiếp tục mã sau bước này. Không push hoặc merge trong phiên chuẩn bị.

## Triển khai sau chỉ đạo mới của chủ dự án

Chủ dự án đã yêu cầu “tiếp tục code theo kế hoạch” sau khi được báo thiếu ví dụ số và điểm chờ Claude. Tiếp tục đúng công thức đã qua chuyên gia/phản biện/tác động, dùng ca đếm tay độc lập được chuyên gia kiểm lại. Ghi rõ nguồn quy tắc và loại đáp án, không gọi là ví dụ sách, không giả đã có phản hồi Claude. Vibe CELES-28 ghi mốc chuyển lại đang làm. Không có quyền push/merge hoặc đổi mẫu kiểm cũ.

### Bảng đáp án độc lập

Tất cả chỉ số cung: Tý=0 tới Hợi=11. Cột giờ là chi giờ, không phải số giờ dương. Các đáp án cố định đã được chuyên gia kiểm bằng chuỗi tên chi, không chạy công thức triển khai.

| Ca | Tiểu hạn | Tháng sinh âm | Chi giờ | Giêng | Tháng xem | Kết quả |
|---|---|---|---|---|---|---|
| A | Tuất (10) | 1 | Tý (0) | Tuất (10) | 1 | Tuất (10) |
| B | Tuất (10) | 5 | Mão (3) | Dậu (9) | 1 | Dậu (9) |
| C | Sửu (1) | 12 | Hợi (11) | Sửu (1) | 12 | Tý (0) |
| D | Mùi (7) | 2 | Hợi (11) | Tỵ (5) | 12 | Thìn (4) |
| E | Tý (0) | 12 | Tý (0) | Sửu (1) | 1 | Sửu (1) |
| F | Hợi (11) | 1 | Sửu (1) | Tý (0) | 2 | Sửu (1) |

Ví dụ đường đếm độc lập B: từ Tuất đếm tháng nghịch Tuất→Dậu→Thân→Mùi→Ngọ; tại Ngọ kể Tý, thuận Ngọ→Mùi→Thân→Dậu đến Mão. Giêng ở Dậu. Bài kiểm chạy trên mã cũ đã đỏ đúng ca này (Tuất 10 thay vì Dậu 9).

scripts/test-nguyet-han.ts lưu nguyên sáu đáp án, thêm kiểm các tháng đi thuận và phủ đủ 12 cung, lấy tháng âm thay vì tháng dương, hai giờ cùng chi giờ, sinh Tý muộn qua tháng/năm âm. Fixture A–F là đầu vào kỹ thuật để cô lập phép tính; không phải lá số trích trong sách. Mốc Tết/Tý muộn dùng lá số thật để kiểm nối với lịch hiện có.

Đã kiểm lại giờ Tý: 23:00–00:59 theo hourToChi; 01:00 thuộc Sửu. Fixture E dùng 00:00, không đổi đáp án Sửu (1) đã được chuyên gia đếm tay.

Mã sửa duy nhất ở cungNguyetHan; đăng ký bài mới trong CI và danh sách kiểm. Không sửa cungTieuHan, đáp án cũ, tháng nhuận, phiên bản phương pháp, THE_HE_DEM, dữ liệu hoặc prompt. Kiểm mới sau sửa: 9 nhóm PASS; QA độc lập, domain và tác động PASS diff.

Mốc kiểm chung đầu tiên: 34/35 cổng đạt (gồm typegen, tsc, lint, an sao và bài nguyệt hạn mới). Bộ bối cảnh đóng băng trượt 60/192 ca so mẫu cũ. Ở mốc này đã giữ nguyên mẫu để phân loại và xin đúng ngoại lệ bên dưới, không báo hồi quy đạt.

### Duyệt cập nhật mẫu sau QA

QA đã kiểm toàn bộ báo cáo D:/Celestia/X2-CELES-28-chenh-lech-boi-canh-2026-10-22.json: 60 ca chỉ đổi 120 trường noiDung/cung của cùng dữ kiện nguyệt hạn; không đổi tháng/năm xem hoặc trường khác. 132 ca không thay đổi. Chủ dự án đã chọn rõ “Cho cập nhật mẫu sau QA”.

Áp dụng ngoại lệ này bằng cập nhật chọn lọc từng đường dẫn đã đối chiếu giá trị cũ và hash tệp cũ; không chạy --sinh hoặc sinh lại bộ mẫu. Thêm chú thích ngoại lệ ở bài kiểm. Điều này không cấp quyền sửa phiên bản/đệm/app hoặc push/merge. Kiểm lại các cổng sau thay đổi mẫu trước khi báo hoàn tất.

### Kiểm cuối và bàn giao tích hợp

- Bài nguyệt hạn: 9 nhóm PASS; mã cũ đã được kiểm đỏ tại ca B trước sửa. QA độc lập chạy 9 nhóm PASS.
- 34 cổng trước đó đã đạt. Cổng bối cảnh trượt được chạy lại sau cập nhật chọn lọc: 192 ca lệch 0, cờ tắt có 2 lời gọi model giả PASS. Chạy lại bài nguyệt hạn và tsc đều PASS. Không cần chạy lại các cổng không bị thay đổi bởi dữ liệu mẫu.
- Domain và tác động PASS diff; không mở rộng lời luận hoặc quy tắc lịch. Diff không chứa thay đổi phiên bản, RAG, app, DB hoặc workbook.
- Claude cập nhật ba sheet cuối vòng, chốt phiên bản phương pháp/đệm V3/fallback khi tích hợp với K2, dựng lại app trước phát hành. X2 không tự sinh lại bài, không gọi DB/model thật.
- Nhánh X2 chứa commit phương án 1aaa7a2 và commit mã tiếp theo; không mang commit X1 hoặc nhánh khác. Chưa push/merge. Bản dễ tìm tại D:/Celestia được cập nhật cùng tài liệu này.
