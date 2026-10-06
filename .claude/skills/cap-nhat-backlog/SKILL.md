---
name: cap-nhat-backlog
description: Cập nhật PRODUCT-BACKLOG.xlsx của Celes đúng luật — sửa dòng Backlog, thêm/sửa bước Logic chi tiết, luôn thêm một dòng Nhật ký thay đổi có cột "Vì sao", cấp ID CEL kế tiếp không trùng với nhánh khác. Dùng trước mọi commit đổi tính năng, luồng logic hay luật bất biến, hoặc khi hook truoc-commit chặn vì thiếu backlog.
---

# /cap-nhat-backlog

Luật gốc nằm ở AI-PHOI-HOP.md §5b. Backlog nói sản phẩm CÓ GÌ, Logic chi tiết nói CHẠY THẾ NÀO,
Nhật ký nói VÌ SAO. Sửa Backlog mà không sửa Logic là để lại một bản mô tả logic đã sai.

Công cụ: `.claude/skills/cap-nhat-backlog/backlog.py` (openpyxl). KHÔNG mở tệp bằng Excel: lưu từ
Excel làm đổi định dạng của cả những ô không đụng tới.

## 1. Xem hiện trạng
```bash
python .claude/skills/cap-nhat-backlog/backlog.py xem          # ID kế tiếp, mấy dòng cuối
python .claude/skills/cap-nhat-backlog/backlog.py tim CEL-186  # dòng Backlog + các bước Logic của ID đó
```
ID kế tiếp được tính trên sheet, trên Backlog của mọi nhánh remote (script tự `git fetch`) LẪN
commit của mọi nhánh, vì nhánh chưa gộp có thể đã giữ ID. Lấy số script đưa ra, không tự cộng.
Nhánh chưa push thì máy kia không thấy: **push nhánh ngay sau commit đầu mang ID mới**. Trùng vẫn
lọt thì CI `kiem-id-cel.yml` đỏ; nhánh gộp main sau là nhánh cấp lại.

## 2. Viết tệp yêu cầu
Viết bằng công cụ **Write** ra thư mục tạm. Đừng gõ JSON trên dòng lệnh: harness nuốt một lớp gạch
chéo. Dạng đầy đủ nằm ở đầu `backlog.py`. Ví dụ:
```json
{
  "backlog_sua": [{"id": "CEL-186", "cot": {"Trạng thái": "Đang chạy", "Việc còn lại / rủi ro": "..."}}],
  "logic_them": [{"Mã": "CEL-186", "Luồng": "Planner", "#": "4", "Bước": "...", "Logic cụ thể": "...",
                  "Luật bất biến / bẫy đã trả giá": "...", "Tệp": "lib/rag/planner.ts"}],
  "nhat_ky": {"Commit": "(nhánh viec/cel-186-planner-time)", "ID liên quan": "CEL-186",
              "Thay đổi gì": "...", "Vì sao": "...", "Ai làm": "Claude (máy 1)"},
  "commit": "(nhánh viec/cel-186-planner-time)"
}
```
- **"Vì sao"** là cột quan trọng nhất: ghi ca gốc, con số đo được, quyết định của chủ dự án. Viết
  sao cho vài tháng sau người đọc vẫn hiểu, không cần mở commit. Script từ chối nếu cột này trống.
- Tính năng mới thì dùng `backlog_moi`. Không ghi `ID` thì script tự cấp. Không dùng lại ID cũ.
- Bỏ một tính năng thì KHÔNG xoá dòng: đổi `Trạng thái` thành `Tạm dừng` và ghi lý do.
- Một con số đo được đổi thì sửa sheet `Chỉ số & cấu hình`. Script chưa hỗ trợ sheet này, nên viết
  một script openpyxl nhỏ trong thư mục tạm.
- Chưa có mã commit thì ghi `(nhánh viec/<ten>)`.

## 3. Ghi và kiểm
```bash
python .claude/skills/cap-nhat-backlog/backlog.py ghi "<đường dẫn tệp json>"
python .claude/skills/cap-nhat-backlog/backlog.py tim CEL-xxx
```
`git add PRODUCT-BACKLOG.xlsx` trong CÙNG commit với mã.

## Lưu ý
- Tệp xlsx là nhị phân (xem `.gitattributes`), git không gộp được. Nhánh dài ngày thì trước khi
  gộp: lấy bản của main (`git checkout origin/main -- PRODUCT-BACKLOG.xlsx`) rồi chạy lại tệp yêu
  cầu. Giữ lại tệp JSON đến lúc gộp là vì vậy.
- Máy chưa có openpyxl thì cài bằng `pip install openpyxl`.
