# Tiến độ — vận hạn dùng lớp hạn (cập nhật 18/10/2026)

Worktree: `D:\SAPP BA\tuvi-ai-van-han`, nhánh `viec/van-han-lop-han`. Đã push tới `8090f1b` (gồm commit 1–3a và lần gộp main).
Căn cứ: `D:\Celestia\QUYET-DINH-van-han-dung-sao-luu.md` (mục Lượt 4) và `D:\Celestia\PHUONG-AN-van-han-lop-han.md`.

## Đã xong
- **Commit 0** `b874f6e`: gộp `viec/van-han-lop-goc` (CEL-085).
- **Commit 1** `09b209c`: bảng sự thật lớp hạn `lib/tuvi/tu-hoa-han.ts` (CEL-199), kèm bài CI `test-tu-hoa-han`. Đầu ra v3 không đổi.
- **Commit 2a** `16e35e0`: khung luật tổ hợp `lib/tuvi/luat-to-hop.ts` (CEL-200), bảng đang rỗng, kèm bài CI `test-luat-to-hop`.
- **Commit 2b** `10beac8`: bảng luật một dòng `KINH_TRUNG_LUU`, phạm vi `xung-chieu` (neo sao gốc), đếm nguồn theo nhóm, mỗi nguồn có trích nguyên văn và test đối chiếu sách. Bản duyệt: `D:\Celestia\BANG-LUAT-TO-HOP-2b.md`.
- **Commit 3a** `429fc9e`: chat đường STANDARD cân câu vận hạn theo lớp hạn, sau cờ `CELES_LOP_HAN` (tắt = đường cũ đúng từng byte).
  - Trọng số: luật tổ hợp 4.5 > lưu hoá 3 = sao lưu 3 > tứ hoá đại vận 2. Cung hỏi ×1, tam hợp/xung ×0.5.
  - Sao gốc ở cung hỏi chỉ thành mục "nền" để dẫn chứng; sao gốc ở cung hạn không cộng lẻ.
  - Celes được nói "lưu Hóa Kỵ" đúng sao; luôn nói hai mặt; phía thiếu nói "mỏng".
  - Bài CI `test-lop-han-chat`; celes-domain, qa (6/6), bien-tap-vi đã soát và đã sửa theo.
- **Câu còn mở:** có cho Kình khớp cả chiều Lưu Kình ở cung xét, Kình gốc ở cung xung không (Phụ Tinh 2067 có nói).

## Cần anh duyệt trước khi bật cờ
Phân bố đo offline (60 lá × 2024–2030 × 4 chủ đề):

| Đường | thuận rõ | thuận nhẹ | cân | cản nhẹ | cản rõ | đủ hai mặt |
|---|---|---|---|---|---|---|
| Cũ | 42.8% | 30.2% | 18.7% | 6.7% | 1.7% | 93.6% |
| Lớp hạn | 23.4% | 12.4% | 20.1% | 19.3% | 24.9% | 81.6% |

- Hết lệch về "thuận", nhưng "cản rõ" lên 1/4 số câu. Gốc: 6/9 sao lưu là hung, và Lưu Kỵ ở Mệnh chiếu sang mọi phần đời tam hợp/xung với Mệnh.
- Hệ số tam phương 0.5 và ngưỡng "rõ" chưa có sách đỡ. Nhãn "rõ" tính theo tỉ lệ, nên một dữ kiện chiếu đứng một mình vẫn ra "cản rõ".
- Đề xuất: trước khi anh duyệt, đo tách theo chủ đề (sức khỏe, tình cảm) và thêm ngưỡng tổng trọng số tối thiểu cho nhãn "rõ".

## Đã xong 18/10
- main nhận `viec/sua-do-sang-cach-cuc` (merge `bde0dc0`, TRANG-THAI `c7fedc5`). THE_HE_DEM 9 lên production: đệm luận viết lại dần.
- Nhánh vận hạn gộp main (`8090f1b`), đã push.
- C1 bản 4 đã duyệt. Giải pháp 3 việc: `D:\Celestia\GIAI-PHAP-3-viec-cach-cuc-phuc-tinh-hoa-giai.md` — việc A bản 4 (hợp/không hợp theo bộ trên tam phương, đã đo), chờ anh duyệt.

## Làm tiếp từ đây (bản 17/10 tối, sau GIAI-PHAP bản 3)
- Các điểm cần anh chốt: `D:\Celestia\GIAI-PHAP-chot-van-han-lop-han.md` bản 3 (C1–C4; C5 đã chốt).
- Chia việc máy 1 / máy 2 + prompt máy 2: `D:\Celestia\CHIA-VIEC-van-han-may1-may2.md`.
- Máy 1 kế tiếp: bài học lặp 2 lên main (chờ quyền) → push nhánh (chờ quyền, để máy 2 tách `viec/van-han-3b`) → 3a' sau khi anh chốt C1–C4 → bảng bộ sao đợt 2 → Commit 4 phần kho → Commit 5.
- Máy 2: 3b + Commit 4 phần mã.

## Nhắc
- `eval-chat-quyet-dinh.ts` chạy model thật, tốn tiền, không tự chạy. Chạy sau 3a' + 3b, trước khi bật cờ.
- Máy canh DUNG_SACH đang chờ duyệt.
- Xoá `scripts/tam-*` trong worktree khi xong đợt.
