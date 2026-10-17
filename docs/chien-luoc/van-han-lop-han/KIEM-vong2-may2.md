# CEL-200 máy 2 — vòng 2, việc 1–2

Ngày 17/10/2026. Nhánh `viec/van-han-3b`, nối sau `2b627de`. Theo `D:/Celestia/VIEC-MAY2-tiep-3b-vong2.md`; chuyên môn theo B4 bản7 đã được duyệt.

## Thay đổi

- Gom đọc cờ vào module lá `co-lop-han.ts`, đọc lúc gọi. `tra-loi.ts` re-export giữ API, Focused không import ngược runtime từ STANDARD.
- Prompt v3 nói nền chỉ dẫn chứng/giải thích mức độ, không đảo chiều nhận định thời gian. Không giả định engine đã đưa một chiều chốt cho v3.
- Validator chặn thêm “lớp nền”, “nền sẵn”, “lớp hạn”. Không thêm vòng sửa model.
- B4 sửa cả khi tắt cờ: Triệt rõ nhất quãng đầu đời, nhạt dần khi tự lập; Tuần nhẹ hơn nhưng dai, suốt đời. Không nêu tuổi của Triệt. Sửa dữ kiện, TQ10 và TC01 (TC01 vẫn còn cùng chỉ dẫn sai ngoài hai điểm giao ban đầu). Mốc 30 còn của cung Thân không thuộc B4.

## Kiểm chứng

- `test-lop-han-env.ts`: PASS 20 prompt tại entry point bài dài và hai nửa bảng, cả fallback và epModel. Env thật đổi thiếu → 0 → 1 → 0 trong cùng module; kiểm system/user và khôi phục byte. Chỉ thay I/O bằng module giả, chặn fetch và ghi nhật ký; model giả dừng sau khi nhận prompt. Bài này kiểm trước model, không chấm chất lượng bài trả lời model thật.
- `test-lop-han-v3.ts`: PASS 248 hash, 102 câu thời điểm và hai lá thật do engine tìm có Mệnh Tuần/Triệt, mỗi lá chạy cả hai cờ. Không tự gắn sao vào lá số để làm ca kiểm.
- `test-lop-han-3b.ts`: mẫu 25 hash gốc không đổi; thêm ba ca chữ cấm.
- Review chuyên môn và biên tập VI: PASS; phản biện/tác động không còn blocker. Tác động VỪA, không cần duyệt lại vì nằm trong việc1–2 đã được duyệt.
- Bộ kiểm toàn nhánh: PASS 40 cổng (tsc/lint và các bài offline CI, vì đổi cấu hình CI). TypeScript cuối sạch; QA độc lập build PASS56 trang. ID không trùng, không cấp mới; quét bí mật không thấy token/private key/email khách/điện thoại, apiKey trong test chỉ là giá trị giả. Build không gọi model/DB.

## Baseline B4 độc lập

Base lịch sử `25ad334` cộng CHỈ bản vá B4 tại `du-kien.ts` và `khung.ts`. Commit baseline cục bộ `6944f2730e16a9b55db9d7132e9c2151adc9f98e`; tree `43d32620a579cc1324b6b11026df38b94a1cf28f`. Đây là commit dựng bằng index tạm, không nằm trên nhánh sản phẩm và không checkout thư mục Claude.

Bản vá tái dựng được lưu trong `scripts/dong-bang/lop-han-v3-b4.patch`: lấy cây25ad334, áp bản vá rồi ghi tree sẽ cho đúng hash trên. Không cần tải commit baseline cục bộ từ GitHub. Cây lib giải nén tại `node_modules/.cache/cel200-base-b4`; chỉ sửa đường import alias thành đường tương đối về chính cây đó, không thay logic. Các tệp nhị phân giữ nguyên bytes.

Generator đọc cả `du-kien`, `prompt-v3` và `khung` từ base-root; mọi import engine trong cây base quay về cây base. Khi ghi mẫu phải có `--base-root` và `--base-commit`, và diff của base so25ad334 phải bằng đúng patch đã lưu, và toàn bộ157 tệp lib tại base-root phải khớp nguồn commit sau đổi alias. Thử chọn base-root hiện tại với SHA baseline đã bị chặn trước ghi mẫu. Mẫu có SHA commit/tree và lý do. Câu hỏi không còn lấy lẫn từ nhánh mới khi sinh mẫu.

Đối chiếu mẫu trước: SYSTEM_V3 giữ nguyên, **96/246** hash dữ kiện đổi do B4; thêm một hash toàn khung để bắt hồi quy TQ10/TC01. Tổng247→248. Đây là ngoại lệ B4 đã duyệt; không dùng toàn mã mới làm base tự xác nhận.

## Phạm vi và bàn giao

Không sửa `lib/tuvi/**`, `nghieng-ve.ts`, `luat-to-hop.ts`, DB, v3/xu-ly, khoá đệm hoặc các phiên bản dữ kiện/khung/ngôn ngữ/thế hệ đệm. Bài cũ trong đệm vẫn có thể chứa câu B4 sai đến đợt tăng đệm do chủ dự án quyết. Không bật cờ, không gọi model thật, không push/merge.

Backlog cập nhật đủ ba sheet; delta áp lại ở `scripts/tam-cel200/backlog-3b.json` (bản vòng1 lưu riêng `backlog-3b-vong1.json`, Commit4 giữ `backlog-4-ma.json`). Khi gộp lấy workbook mới của đích, giữ thay đổi máy1 và áp từng delta phù hợp, không ghi đè nguyên ô cũ.

Thứ tự tệp giao việc: việc1→2→QA/domain→push khi chủ dự án bảo→việc3 trên `viec/ca-dap-an`. Do chưa có lệnh push, chưa mở nhánh việc3 hoặc cấp ID mới.

Nhánh nguồn sau fetch: `56636f0`, chưa có thay đổi lib/scripts/.github so25ad334; không tự gộp. Các commit ngoài hai commit máy2 trước đó là lịch sử kế thừa nhánh lớp hạn (CEL-085/199/200), không phải việc lạc được viết trong phiên này.
