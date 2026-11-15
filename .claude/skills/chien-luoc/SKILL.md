---
name: chien-luoc
description: Luồng A — một câu hỏi chiến lược của Celes (định vị, giá, gói, đối thủ, hướng sản phẩm, chọn công nghệ lớn). Thu dữ liệu, tổng hợp, BẮT BUỘC qua phan-bien, trình bày Sập / Lung lay / Đứng được, chủ dự án quyết, ghi quyết định ra tệp. Dùng khi có dấu [CHIẾN LƯỢC] hoặc /chien-luoc. Không chạm lib/, app/, components/.
---

# /chien-luoc <câu hỏi>

Luật gốc nằm ở mục "Luồng A" của AGENTS.md. **Luật cứng: không trình bày kết luận nào chưa qua
`phan-bien`.**

## 0. Mở phiên
Làm bước 0, 2 và 6 của `.claude/skills/lam-tinh-nang/mo-phien.md`. Trước khi nghiên cứu, đọc các
quyết định đã có để khỏi làm lại:
```bash
ls docs/chien-luoc/ docs/doi-thu/ ; grep -ril "<từ khoá>" docs/chien-luoc docs/doi-thu | head
```
Hai tài liệu định hướng gốc nằm ở `D:\Celestia\Celestia_Brand_Product_UX_Master_Spec.pdf` (bản
này thay bản Commercialization Report).

## 1. Dữ liệu
- Cần biết đối thủ làm gì thì gọi `quet-doi-thu`. Gọi song song khi có nhiều đối thủ. Lưu dữ liệu
  thô vào `docs/doi-thu/<tên>.md`.
- Cần biết sản phẩm mình đang thế nào thì gọi `researcher`. Số liệu đo được nằm ở sheet
  `Chỉ số & cấu hình` của backlog.
- Mỗi con số phải có nguồn và ngày.

## 2. Tổng hợp → phản biện
Viết kết luận nháp, gọi `phan-bien`, sửa theo. Kết luận chạm chuyên môn tử vi thì gọi thêm
`chuyen-gia-tu-vi` cùng lượt. Phương án nào bị đánh "Sập" thì bỏ hoặc nói rõ
điều kiện để nó đứng được. Đừng giấu đi.

Kiểm thêm theo hai quyết định không được tự đổi trong AGENTS.md: ngân sách bằng 0, Celes là người
trò chuyện. Phương án nào phạm một trong hai thì phải nói thẳng là cần chủ dự án đổi luật. ("Nam phái
làm chuẩn" đã bỏ, không dùng để chặn phương án.)

## 3. 🛑 Trình bày
Trình bày ngắn: kết luận, các lựa chọn kèm đề xuất, mục "Sập / Lung lay / Đứng được", và câu hỏi
cần chủ dự án trả lời. Bản dài thì ghi ra `D:\Celestia\` và in đường dẫn.

**Khuôn mỗi câu xin chủ dự án quyết** (cả trong chat, tệp trình và ô "Cần quyết" trên Vibe Board).
Mỗi câu tự đứng được, đọc một lần là quyết được:
```
- Chức năng gì, người dùng gặp ở đâu:
- Hiện đang chạy thế nào:
- Đổi gì (kèm ví dụ trước / sau):
- Các lựa chọn, mỗi cái dẫn tới đâu (tốn gì, mất gì):
- AI đề xuất gì, vì sao:
```
Không lấy mã bước, tên tệp hay tên reviewer làm chủ ngữ (18/10: 3/5 câu bị trả lại "chưa hiểu").
Ghi câu hỏi bằng `T block <mã> --decision "..."`; chủ dự án trả lời thì `T answer <mã> "<ngày> quyết gì"` ngay.


## 4. Ghi quyết định
Chủ dự án quyết xong thì ghi vào `docs/chien-luoc/<chủ đề>-<yyyy-mm>.md`, kèm: quyết định, lý do,
các phương án đã loại và vì sao, số liệu có nguồn. Commit trên nhánh `viec/chien-luoc-<chủ đề>`.
Quyết định không ghi ra tệp coi như chưa quyết. Ghi thêm lên Vibe Board: `T answer <mã> "..."` nếu
thuộc một task, `T decide --title ... --result ...` nếu là luật chung (thay quyết định cũ thì `--replaces`).

Quyết định làm đổi luật làm việc hay luật sản phẩm thì sửa luôn AGENTS.md hoặc AI-PHOI-HOP.md, rồi
grep `.claude/skills/` để không còn chỗ nói ngược (bài học 03/10/2026).

## 5. Kết thúc
`/bai-hoc` nếu có giá thật. Việc mã phát sinh thì mở phiên `/lam-tinh-nang` mới, không làm trong
phiên này.
