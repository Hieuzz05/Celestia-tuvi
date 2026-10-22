# X2 — chọn Cách 1 xác định cung nguyệt hạn

CELES-28 · Codex (máy 2) · 22/10/2026 · Nhánh viec/nguyet-han.

Cập nhật theo PROMPT-LAM-TIEP-dot-1-2026-10-22.md, mục2 A1–A4 và kết quả Claude soát X2 trong tệp điều phối mục7. Mã hiện tại đã chọn Cách1; lượt này bổ sung kiểm và sửa mô tả, không đổi công thức hoặc đáp án mẫu đã duyệt. Claude tăng phiên bản bằng commit riêng khi tích hợp; Codex không tăng PHUONG_PHAP.phienBan hoặc THE_HE_DEM.

## Lựa chọn phương pháp

Chọn cách thông dụng ba sách cùng nói (Hàm số325, Hà Thúc Hồng981/1681, Ảo Bí1904 Cách1), theo quyết định10.23.

Cách trước đặt tháng Giêng ngay tại cung tiểu hạn là Cách2 có trong Ảo Bí1905; đây là một phương pháp được sách ghi nhận. X2 thống nhất Cách1 làm chuẩn của Celes, không kết luận Cách2 không có căn cứ. Các tổ hợp tháng/giờ có độ dịch bằng0 vẫn cho cùng kết quả giữa hai cách.

## Nguồn đã đọc nguyên văn

- Tử Vi hàm số — Nguyễn Phát Lộc, trang26, D:/Tài liệu tử vi/markdown/Tử Vi hàm số - Nguyễn Phát Lộc.md:325: từ tiểu hạn, nghịch đến tháng sinh; tại đó kể giờ Tý, thuận đến giờ sinh để khởi Giêng.
- Số Tử Vi dưới mắt khoa học — Hà Thúc Hồng, trang74–75, D:/Tài liệu tử vi/markdown/Số Tử Vi dưới mắt khoa học.md:981: cùng quy tắc và đi thuận mỗi cung một tháng. Dòng1681 giải thích bằng xoay Mệnh tới tiểu hạn;1682–1689 nêu giới hạn của dự báo từng tháng.
- Tử Vi ảo bí — Việt Viêm Tử, trang155, D:/Tài liệu tử vi/markdown/Tử Vi ảo bí - Việt Viêm Tử.md:1904–1905: ghi cả Cách1 và Cách2 như trên.
- Tử vi tổng hợp — Nguyễn Phát Lộc, trang116, D:/Tài liệu tử vi/markdown/Tử vi tổng hợp.md:1329–1330: nêu xem tháng nhuận trong cùng cung tháng chính; lối chia nửa tháng nhuận sang hai cung còn tranh chấp.
- Hà Thúc Hồng:2287 phân biệt nguyệt hạn khởi tiểu hạn với Đẩu quân khởi Thái Tuế. X2 giữ điểm khởi tiểu hạn.

Dòng là dòng bản Markdown cục bộ, không phải số trang PDF. Không từ việc chọn cung suy ra độ chắc cao của lời luận.

## Công thức và ranh giới

```text
tieuHan = cungTieuHan(laSo, tuoiAm)
gioChi = hourToChi(laSo.thongTin.gio)  // Tý=0 ... Hợi=11
gieng = mod12(tieuHan - (laSo.thongTin.amLich.thang - 1) + gioChi)
ketQua = mod12(gieng + thangAm - 1)
```

Dùng tháng âm đã được lapLaSo xử lý cho giờ23h, không đổi lịch lần hai. Giữ nguyên cungTieuHan/tuổi âm/chiều nam nữ và chữ ký hàm.

Engine đã chọn tháng xem nhuận cùng cung tháng chính; không áp dụng lối chia nửa tháng. Đây là quy ước phép tính nhận số tháng, không mở guard chat tháng nhuận: các ca focused-nhuan-chua-tach vẫn giữ nguyên.

## Đáp án đếm tay và bất biến độc lập

Sáu ca A–F là đáp án đếm tay độc lập được chuyên gia kiểm theo quy tắc nguồn; không phải ví dụ có kết quả in sẵn trong sách. Tất cả chỉ số cung Tý=0 đến Hợi=11.

| Ca | Tiểu hạn | Tháng sinh âm | Chi giờ | Giêng | Tháng xem | Kết quả |
|---|---|---|---|---|---|---|
| A | Tuất10 | 1 | Tý0 | Tuất10 | 1 | Tuất10 |
| B | Tuất10 | 5 | Mão3 | Dậu9 | 1 | Dậu9 |
| C | Sửu1 | 12 | Hợi11 | Sửu1 | 12 | Tý0 |
| D | Mùi7 | 2 | Hợi11 | Tỵ5 | 12 | Thìn4 |
| E | Tý0 | 12 | Tý0 | Sửu1 | 1 | Sửu1 |
| F | Hợi11 | 1 | Sửu1 | Tý0 | 2 | Sửu1 |

CaB phân biệt lựa chọn: Cách2 cho Tuất10, Cách1 cho Dậu9. Đây là ca phân biệt hai cách đã được sách ghi nhận.

A2 kiểm quan hệ độc lập theo Hà Thúc Hồng1681:
(nguyetHan(tháng1) − tieuHan) ≡ (2 − cung Mệnh) mod12.
Lấy cung Mệnh đã an của lá thật, không tính lại bằng công thức nguyệt hạn. Đọc đủ60 khóa mẫu của test-ansao-chuan trong mau-ansao.json; mỗi lá kiểm tuổi1/2/12/13/36, tổng300ca. Assert có sinh tháng nhuận âm và23h. Không dùng fixture A–F sửa riêng tháng/giờ cho bất biến này.

A3 chuyển ngày1 và20 của tháng6/2025 thường/nhuận sang dương rồi kiểm ngược cờ nhuận/tháng/năm. Hai kỳ khác ngày dương nhưng cùng số tháng âm6; cùng lá và tuổi phải cho cùng cung. Phủ cả trước/sau rằm để khóa lựa chọn không chia nửa tháng.

## Phạm vi tác động

Engine dùng chung qua components/laso/TuViChart.tsx:161, lib/tuvi/hanh-trinh.ts:208/245, lib/tuvi/luan-han.ts:223, lib/rag/boi-canh-la-so.ts:238/266, lib/rag/nghieng-ve.ts:340, lib/rag/v3/du-kien.ts:707 và apps/celes-app/src/giao-dien/menh-ban.tsx:786.

Claude tăng phiên bản phương pháp bằng commit riêng khi gộp X2 vào nhánh tích hợp; không tăng THE_HE_DEM. Kiểm đường dự phòng thế hệ trước không trả câu nguyệt hạn mang dấu logic cũ là phần Claude tích hợp. App dựng lại sau khi lên production theo Q8, không thuộc lượt sửa này.

## Mẫu bối cảnh và kiểm

Mốc18bc889 đã cập nhật chọn lọc120trường trong60/192ca bối cảnh sau khi chủ dự án duyệt và QA đối chiếu;132ca khác giữ nguyên. Không chạy --sinh. Lượt A1–A4 này không đổi thêm mẫu.

Bài test-nguyet-han hiện11nhóm, gồm sáu đáp án và các ca âm/dương, chi giờ, Tý muộn, A2/300ca, A3/thángnhuận. Bài an sao và đóng băng bối cảnh phải xanh; kiem-nhanh/tsc/lint kiểm theo phạm vi. Không gọi model/DB thật.

## Bàn giao workbook cho Claude

- Backlog: chọn Cách1 nguyệt hạn làm chuẩn; A1–A4 hoàn thiện theo prompt tiếp tục, cập nhật commit mới từ CELES-28 sau kiểm. Không cấp CEL mới.
- Logic chi tiết: tiểu hạn → nghịch tháng sinh âm → thuận chi giờ → thuận tháng xem; tháng xem nhuận dùng cùng cung chính. Thêm bất biến xoay Mệnh trên60lá chuẩn/300ca và ánh xạ thường-nhuận2025.
- Nhật ký thay đổi, cột Vì sao: chọn cách thông dụng ba sách cùng nói (Hàm số325, HTH981/1681, Ảo Bí1904 Cách1), theo quyết định10.23. Cách2 ở Ảo Bí1905 là phương pháp khác có nguồn, không quy kết thành lỗi của sách hoặc mã.

Chỉ Claude cập nhật workbook cuối đợt. Chưa push/merge hoặc tăng phiên bản trong nhánh Codex.

## Kết quả A1–A4

QA và domain PASS. test-nguyet-han:11nhóm PASS (A2:300ca trên60lá, A3:hai ngày thường/nhuận); test-ansao-chuan và test-boi-canh-dong-bang PASS, bối cảnh192ca không lệch. Toàn bộ34cổng của kiem-nhanh lần này đều xanh (tsc, lint và32bài offline; kiểu route đã có sẵn). Không thay snapshot hoặc kết quả engine trong lượt A1–A4. Claude lấy commit mới trên CELES-28 để gộp rồi tăng phiên bản riêng.
