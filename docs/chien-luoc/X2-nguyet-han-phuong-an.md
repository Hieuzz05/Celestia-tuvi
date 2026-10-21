# X2 — sửa cách xác định cung nguyệt hạn

CELES-28 · Codex (máy 2) · 22/10/2026 · Nhánh viec/nguyet-han.

Trạng thái: phương án chuẩn bị để Claude soát trước code theo mục 4 X2 của kế hoạch bản 3. Chưa sửa engine hoặc đáp án bài kiểm. X1 giữ nguyên ở commit f7495ca trên nhánh riêng, chờ nghiệm thu.

## Kết quả cần đạt

Hiện cung tháng Giêng trùng cung tiểu hạn cho mọi lá số. Quy tắc đã duyệt cần dịch vị trí đó theo tháng sinh âm lịch và chi giờ sinh, rồi mới đếm thuận đến tháng muốn xem. Một số tổ hợp tháng/giờ có độ dịch bằng 0 nên kết quả vẫn trùng cách cũ; không kết luận mọi lá số hiện đều sai. X2 chỉ sửa phép tính này; lời luận tháng ở mức chắc thấp thuộc K3.

## Nguồn đã đọc nguyên văn

1. Tử Vi hàm số — Nguyễn Phát Lộc, trang 26, tệp D:/Tài liệu tử vi/markdown/Tử Vi hàm số - Nguyễn Phát Lộc.md:325. Các mốc: “Khởi từ cung tiểu hạn”, “tính NGHỊCH đến tháng sinh”, “tính THUẬN đến giờ sinh”. Cung tiểu hạn được kể là tháng Giêng; điểm đến của bước tháng được kể là giờ Tý.
2. Số Tử Vi dưới mắt khoa học — Hà Thúc Hồng, trang 74–75, tệp D:/Tài liệu tử vi/markdown/Số Tử Vi dưới mắt khoa học.md:980–986. Dòng 981 xác nhận quy tắc trên và nêu “Song đi thuận mỗi cung một tháng.”
3. Cùng sách Hà Thúc Hồng, trang 136–137, dòng 1681–1689: giải thích bằng việc xoay Mệnh tới tiểu hạn, đồng thời cảnh báo hạn chế về độ chính xác của luận từng tháng. Đây không phải căn cứ để nói chắc sự kiện.
4. Dòng 2287 phân biệt nguyệt hạn khởi từ tiểu hạn với Đẩu quân khởi từ Thái Tuế; X2 không chuyển điểm khởi sang Thái Tuế.

Các số dòng là dòng bản Markdown cục bộ, không phải số trang PDF. Trang theo dấu trang trong bản trích.

## Mã hiện tại và cách sửa

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

- Backlog: X2 sửa cung nguyệt hạn theo tháng sinh âm và chi giờ; trạng thái hiện mới nghiên cứu, chưa triển khai.
- Logic chi tiết: tiểu hạn → nghịch tháng sinh → thuận chi giờ → thuận tháng xem; giữ tháng âm đã xử lý Tý muộn; không đổi tiểu hạn/tháng nhuận.
- Nhật ký thay đổi: vì cách hiện tại đồng nhất tháng Giêng với tiểu hạn, bỏ hai đầu vào đã có trong lá số. Chỉ ghi hoàn tất và commit mã khi X2 thực sự qua kiểm.

## Cổng bàn giao

Researcher và celes-domain đã đọc hiện trạng. Chuyên gia Tử Vi PASS công thức và cách đếm; chưa đủ nguồn đáp án nghiệm thu. Phản biện PASS để bàn giao sau khi chỉnh nhất quán đường đáp án và cổng tích hợp đệm. Đánh giá tác động: CAO, PASS bàn giao; không phát sinh việc cần chủ dự án duyệt ngoài X2 đã được giao. Bước Claude soát vẫn bắt buộc theo kế hoạch.

- Sập: chưa chốt được nguồn đáp án số độc lập nên chưa đủ điều kiện viết mã và nghiệm thu.
- Lung lay: thay engine tác động nhiều bề mặt; phải phối hợp phiên app, đệm K2 và hai nhánh vận hạn chưa gộp. Snapshot đỏ không được tự đổi để cho qua.
- Đứng được: công thức và phạm vi đúng hai nguồn đã chọn; giữ tiểu hạn, tháng âm/chi giờ, không tự nâng độ chắc lời luận hoặc mở tháng nhuận.

Kiểm mốc trước sửa đã chạy: scripts/test-boi-canh-dong-bang.ts PASS, 192 ca lệch 0 và 2 lời gọi model giả cho cờ tắt. kiem-nhanh --chay xác nhận chỉ đổi tài liệu, không có tệp mã cần kiểm. Đây là kiểm mốc hiện tại, chưa phải kết quả nghiệm thu công thức mới.

Claude cần soát phương án, ghi nguồn đáp án được chốt và xác nhận phối hợp vùng Chung trên CELES-28. Nếu thay yêu cầu ví dụ sách bằng đếm tay độc lập thì phải ghi rõ ngoại lệ được chốt, không đổi tên đáp án thành ví dụ sách. Codex chỉ tiếp tục mã sau bước này. Không push hoặc merge trong phiên chuẩn bị.
