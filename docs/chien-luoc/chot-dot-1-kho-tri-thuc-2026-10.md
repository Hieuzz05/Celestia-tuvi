# Chốt đợt 1 kho tri thức — quyết định của chủ dự án (31/10/2026)

Trả lời 4 câu ở mục 7 của `D:\Celestia\BAO-CAO-DO-DOT-1-kho-tri-thuc.md` (báo cáo G3, CELES-35).
Kế hoạch gốc: `D:\Celestia\KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md`.

| # | Câu hỏi | Quyết định | Lý do / số liệu |
|---|---|---|---|
| 1 | Viết bài V3 theo đường A (một lượt) hay B (lập ý rồi diễn đạt)? | **Chờ đo ba nhánh A / A+ / B**, chọn nhánh rẻ nhất không thua về chất lượng. | B đọc tự nhiên hơn A 18/24 cặp nhưng tốn ×1,6 (0,1066 so với 0,0659 USD / 16 cặp, 22/10). phan-bien 31/10: B có thể thắng nhờ mức chắc từng ý chứ không nhờ tách hai lượt, nên đo thêm A+ (một lượt + mức chắc). Bộ đo: `scripts/sinh-ba-nhanh-v3.ts`, trần 0,6 USD. |
| 2 | 2.430 mục "mạnh" chưa duyệt (K1 chặn) | **Giữ chặn.** | Chuyên gia soát thử 2 lô: ~1% đạt nguyên trạng, lỗi ở máy trích (`D:\Celestia\doc-prod\KET-QUA-SOAT-THU-2-LO.md`). Đã đặt bi-bac thêm 383 mục hung vừa/nhẹ khớp ≥25% lá số (CELES-47, 31/10, sao lưu `D:\Celestia\doc-prod\sao-luu-goi-2026-10-31T12-04-21-852Z.json`). |
| 3 | 8 chủ đề V3 | **Giữ cả 8.** Tiền bạc đo thêm. | Cổng 10.22: 7/8 thắng sách thô; tiền bạc 1–2 trên mẫu 3 câu, chưa đủ để tắt. |
| 4 | Xưởng biên tập 7 bảng hay bản gọn | **Bản gọn.** | Chưa có nhu cầu duyệt hàng loạt; dựng hàng chờ duyệt trước khi sửa máy trích là duyệt mục hỏng. |

## Hệ quả cho đợt 2

Vòng đầu đợt 2 là **sửa máy trích (lỗi 3–6 trong KET-QUA-SOAT-THU-2-LO.md) rồi trích lại**, kèm máy canh điều
kiện (mục chết 0% / mục khớp ≥25% lá số) chạy trước khi nạp. Xưởng biên tập chỉ làm phần gọn: bảng duyệt đơn
giản khi bắt đầu duyệt lô mục nặng.
