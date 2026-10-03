# specs/ — đặc tả tính năng

Mỗi tính năng lớn có một tệp `specs/<mã>.md` (ví dụ `specs/journey-v2.md`) viết TRƯỚC khi code.
Agent đọc spec thay vì đoán ý từ một câu chat.

- Mẫu: `specs/_MAU.md` — sao ra rồi điền.
- Làm tính năng: gõ `/lam-tinh-nang <mã hoặc mô tả>` trong Claude Code. Spec là tuỳ chọn — có tệp thì skill đọc nó.
- Tiêu chí chấp nhận (AC) phải kiểm được: agent `qa` sẽ trả PASS/FAIL cho từng dòng.
- Spec nói **cái gì và vì sao**; `PRODUCT-BACKLOG.xlsx` vẫn là nơi ghi trạng thái và nhật ký.
