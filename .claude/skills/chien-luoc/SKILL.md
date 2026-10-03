---
name: chien-luoc
description: Luồng A — một câu hỏi chiến lược của Celes (định vị, giá, gói, đối thủ, hướng sản phẩm, chọn công nghệ lớn). Thu dữ liệu, tổng hợp, BẮT BUỘC qua phan-bien, trình bày Sập / Lung lay / Đứng được, chủ dự án quyết, ghi quyết định ra tệp. Dùng khi có dấu [CHIẾN LƯỢC] hoặc /chien-luoc. Không chạm lib/, app/, components/.
---

# /chien-luoc <câu hỏi>

Luật gốc nằm ở mục "Luồng A" của AGENTS.md. **Luật cứng: không trình bày kết luận nào chưa qua
`phan-bien`.**

## 0. Mở phiên
Làm bước 2 và 6 của `.claude/skills/lam-tinh-nang/mo-phien.md`. Trước khi nghiên cứu, đọc các
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
Viết kết luận nháp, gọi `phan-bien`, sửa theo. Phương án nào bị đánh "Sập" thì bỏ hoặc nói rõ
điều kiện để nó đứng được. Đừng giấu đi.

Kiểm thêm theo ba quyết định không được tự đổi trong AGENTS.md: ngân sách bằng 0, Nam phái làm
chuẩn, Celes là người trò chuyện. Phương án nào phạm một trong ba thì phải nói thẳng là cần chủ dự
án đổi luật.

## 3. 🛑 Trình bày
Trình bày ngắn: kết luận, các lựa chọn kèm đề xuất, mục "Sập / Lung lay / Đứng được", và câu hỏi
cần chủ dự án trả lời. Bản dài thì ghi ra `D:\Celestia\` và in đường dẫn.

## 4. Ghi quyết định
Chủ dự án quyết xong thì ghi vào `docs/chien-luoc/<chủ đề>-<yyyy-mm>.md`, kèm: quyết định, lý do,
các phương án đã loại và vì sao, số liệu có nguồn. Commit trên nhánh `viec/chien-luoc-<chủ đề>`.
Quyết định không ghi ra tệp coi như chưa quyết.

Quyết định làm đổi luật làm việc hay luật sản phẩm thì sửa luôn AGENTS.md hoặc AI-PHOI-HOP.md, rồi
grep `.claude/skills/` để không còn chỗ nói ngược (bài học 03/10/2026).

## 5. Kết thúc
`/bai-hoc` nếu có giá thật. Việc mã phát sinh thì mở phiên `/lam-tinh-nang` mới, không làm trong
phiên này.
