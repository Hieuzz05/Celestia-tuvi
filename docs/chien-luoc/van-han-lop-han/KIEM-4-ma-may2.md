# CEL-200 máy 2 — kiểm Commit 4 phần mã v3

Ngày 17/10/2026, nhánh viec/van-han-3b. Commit 3b trước đó: 17a9ab3. Chỉ mã v3; không kho DB hay đệm.

| Cổng | Kết quả hiện có |
|---|---|
| Snapshot cờ tắt | PASS 247 hash so nguồn lib tại git25ad334: mọi câu trong khung trên 6 lá + SYSTEM_V3 |
| Câu hỏi thời điểm | PASS 102 trường hợp: giữ F, sao/nội dung/cách cục gốc; lớp hạn→nền, hoá đại vận đúng engine và parser |
| Nhiều cung | PASS TB05: dữ kiện hạn/nền mới không nhận hậu tố nền phụ “chỉ dùng để đỡ ý”; mẫu tắt giữ nguyên |
| Domain | PASS cả bản đầu và delta renderer |
| Biên tập VI | PASS vòng 2; không đổi i18n/UI/chuẩn ngôn ngữ |
| TypeScript | PASS sau delta renderer |
| Kiểm theo diff trước thêm CI mới | PASS tsc/lint và 11 bài liên quan, gồm hồi quy 3b/Focused/meta |
| QA toàn bộ và runtime mock cuối | PASS 39 cổng (tsc/lint/37 bài offline), 82 ca mock runtime (41 câu × cờ0/1), build bản cuối 56 trang |

QA đã kiểm runtime bản cuối bằng hàm giả, 82 ca toàn bộ khung × cờ0/1: chuanBiCau → truyHoiChoCau → luanMotCau cho TQ08/TQ09/TQ01, cờ0/1; global.fetch chặn mạng. TQ08 số truy vấn 7→11, TQ09 11→15 do thêm bốn quan hệ hoá đại vận; TQ01 8→8. Đây là đếm truy vấn trong mock, không phải đo độ trễ hoặc tiền thật. Không khẳng định chi phí vận hành tăng bằng0.

Cờ tắt giữ chuỗi và thứ tự cũ; câu không hỏi thời điểm vẫn giữ dữ kiện cũ cả khi bật cờ. Khi bật cho câu thời điểm, chỉ thêm tag nhóm và dòng tứ hoá đại vận, không bỏ dữ kiện gốc hoặc tự tính nền/hoá giải. Vai trò cũ giữ để truy hồi cung chính không đổi. System mới giữ mẫu giọng, bỏ ép hai mặt và giữ nguyên luật an toàn.

Không sửa lib/tuvi, nghieng-ve.ts, v3/xu-ly.ts, DB, THE_HE_DEM, PHUONG_PHAP.phienBan hoặc phiên bản ngôn ngữ. Phần phép cân C1/C3, kho và Hành trình thuộc máy1; không coi kết quả này là nghiệm thu toàn tính năng. Không bật cờ, không push/merge hoặc chạy model/embedding thật.

Backlog cập nhật ba sheet CEL-200; JSON áp lại scripts/tam-cel200/backlog-4-ma.json. JSON3b cũng giữ local. Khi gộp lấy xlsx của nhánh đích và áp lại thay đổi máy2; nếu máy1 đã sửa cùng ô Luồng hiện tại/Logic3 thì đối chiếu, giữ cả cập nhật máy1 thay vì chép đè nguyên văn cũ.

Soát tác động diff: VỪA, không mở rộng ngoài phương án đã duyệt. Tăng số truy vấn trong mock chưa phải tăng thời gian/token đo thật. Đã giữ nguyên chữ truy vấn hoá năm cũ (và khoá RAM tương ứng), chỉ truy vấn mới của hoá đại vận có nhãn đại vận. Soát tài liệu: PASS ba sheet và JSON replay khớp, không trỏ mã chết.

Build sau lần giữ nguyên truy vấn năm cũ: PASS compile, TypeScript và 56 trang. Kiểm trùng ID CEL: PASS (không cấp ID mới). Quét bí mật phần máy2: không có dấu hiệu khoá/API token, private key, email khách hoặc tệp bí mật. Vùng cấm diff rỗng. Nhánh nguồn sau fetch là 8090f1b, đi trước base25ad334 ở tài liệu/phối hợp/bài học, chưa có thay đổi mã so base; không tự merge theo lệnh chủ dự án.
