---
name: lam-tinh-nang
description: Luồng B — làm một tính năng hoặc thay đổi mã của Celes từ đầu tới lúc chờ nghiệm thu. Dùng khi chủ dự án gắn dấu [CODE], gõ /lam-tinh-nang <mô tả hoặc mã CEL>, hoặc giao một việc sửa/thêm mã không phải sửa lỗi. Có bước dừng chờ duyệt phương án; không tự push.
---

# /lam-tinh-nang <việc>

Luật gốc nằm ở mục "Luồng B" của AGENTS.md. Ở đây là các bước làm được, theo thứ tự. Gặp 🛑 thì
dừng hẳn, chờ chủ dự án trả lời.

## 0. Mở phiên
Làm đủ 6 bước trong `.claude/skills/lam-tinh-nang/mo-phien.md`.

## 1. Định cỡ việc
| Cỡ | Khi nào | Reviewer |
|---|---|---|
| **Lớn** | đổi kiến trúc, đổi hợp đồng trả lời / prompt / schema đầu ra, đổi chữ quan trọng ở mặt trước, thêm dịch vụ, tính năng mới cần ID mới, hoặc chạm vùng Chung | đủ cả: `phan-bien`, `danh-gia-tac-dong`, `bien-tap-vi` (nếu đổi chữ) |
| **Nhỏ** | còn lại: một vùng, không đổi hợp đồng, sửa được trong vài giờ | bỏ `phan-bien` / `danh-gia-tac-dong` (chủ dự án quyết 02/10/2026) |

Nói rõ cỡ đã chọn ngay trong phương án. Không chắc thì chọn **Lớn**.

## 2. Hiểu mã đang chạy
Gọi `researcher`, đưa việc cần làm và các tệp đoán được. Phiên chính KHÔNG tự đọc tràn lan. Việc
chạm `lib/tuvi`, `lib/rag`, prompt hay nội dung luận thì gọi `celes-domain` CÙNG LƯỢT để lấy ràng
buộc domain.

## 3. Phương án
Phương án gồm: tệp sẽ sửa, từng bước, test sẽ chạy, rủi ro (chi phí model, khoá đệm
`THE_HE_DEM` hoặc `PHIEN_BAN_*`, lệch web–app vì app đọc thẳng `lib/tuvi`), và dòng backlog sẽ
cập nhật.

**Cỡ Lớn:** gọi `phan-bien` trên phương án, sửa theo, rồi gọi `danh-gia-tac-dong`. Thêm
`soat-chi-phi` nếu chạm dịch vụ ngoài, model, cron hay thư viện mới.

🛑 Trình phương án kèm "Sập / Lung lay / Đứng được" (với cỡ Lớn). Có cờ **CẦN CHỦ DỰ ÁN DUYỆT**
thì nêu lên đầu. Chưa có chữ "duyệt" thì chưa viết code. Phương án dài thì ghi ra
`D:\Celestia\` và in đường dẫn.

## 4. Viết code
Viết ở phiên chính, KHÔNG giao subagent. Trong lúc sửa, chạy `node scripts/kiem-nhanh.mjs --chay`
sau mỗi cụm thay đổi; nó tự chọn tsc, lint và đúng các bài CI phủ tệp vừa đổi. Chữ mặt trước
phải thêm cả `lib/i18n/vi.ts` và `en.ts`.

Code lệch khỏi phương án đã duyệt (thêm tệp, đổi hợp đồng) thì báo ngay, đừng để tới cuối mới nói.

## 5. Kiểm
Gọi trong MỘT lượt, cho chạy song song:
- `qa`: luôn gọi;
- `celes-domain`: nếu chạm luận giải;
- `bien-tap-vi`: nếu đổi chữ mặt trước;
- `danh-gia-tac-dong` trên diff thật: nếu cỡ Lớn và code đã lệch phương án.

Trượt thì sửa rồi kiểm lại, tối đa 2 vòng. Vẫn trượt thì dừng và báo rõ mục trượt.

## 6. Tài liệu + commit
- `/cap-nhat-backlog` nếu đổi tính năng hoặc logic. Hook `truoc-commit.mjs` sẽ chặn nếu quên.
- `soat-tai-lieu` với cỡ Lớn.
- `git add` từng tệp cụ thể. Thông điệp không dấu, có dòng "vì sao", kết bằng dòng Co-Authored-By.

## 7. Bài học + bàn giao
- `/bai-hoc` nếu phiên này có cái giá thật (vòng sửa thừa, reviewer bắt lỗi, chủ dự án sửa lưng).
  Không có thì ghi "không có bài học" trong báo cáo.
- `/kiem-truoc-push` rồi báo kết quả.
- 🛑 **Không push và không gộp** cho tới khi chủ dự án bảo. Được bảo push thì đẩy nhánh, chuyển
  dòng `TRANG-THAI.md` từ "Đang làm" xuống "Vừa xong" (ghi lên main như bước mở phiên), rồi báo link
  bản xem thử.
