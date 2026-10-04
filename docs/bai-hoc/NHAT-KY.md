# Nhật ký bài học

Sổ thô, chỉ thêm vào cuối. Mỗi mục là một lần AI làm sai hoặc tìm ra cách tốt hơn **có cái giá thật**
(mất thời gian, lỗi lọt ra, chủ dự án phải sửa lưng, hoặc cách mới tiết kiệm đo được).
Không có giá thì không ghi, vì mục độn làm sổ mất giá trị.

Luật chưng cất được NÂNG đi chỗ khác. Sổ này giữ câu chuyện và nguyên nhân gốc để sau còn lần lại:

| Loại luật | Nâng lên |
|---|---|
| Cách làm việc của AI (kiểm, báo, phối hợp, giao tiếp) | `docs/bai-hoc/cach-lam.md` (nạp mọi phiên) |
| Bẫy kỹ thuật của một vùng mã | `docs/bay/<vùng>.md` |
| Luật sản phẩm đã trả giá | cột `Luật bất biến` của `PRODUCT-BACKLOG.xlsx` |
| Lặp lại lần 2 | **máy canh**: test, hook hoặc bước CI. Chữ rút còn một dòng trỏ tới nó |

Sổ được commit thẳng lên `main` (chủ dự án duyệt 03/10/2026), để máy kia `git pull` là thấy ngay.
`.gitattributes` khai `merge=union`, nên hai máy cùng thêm vào cuối sổ cũng không xung đột.
Cách ghi: `/bai-hoc`.

Mẫu một mục:

```
## dd/mm/yyyy · <tóm tắt ≤ 10 từ> · <vùng: quy-trinh|giao-dien|engine|ai-rag|quyen-thanh-toan|moi-truong>
- Thẻ: <3–5 từ khoá không dấu, để lần sau grep ra lần lặp>
- Chuyện gì:
- Gốc: <vì sao xảy ra, không phải nó là gì>
- Giá: <thời gian / lỗi / ai phải sửa>
- Luật: <một câu làm được>
- Nâng: <tệp đã nâng tới, hoặc "chưa — lý do">
- Lần: 1
```

---

## 03/10/2026 · Skill build-feature lệch luật mà không ai biết · quy-trinh
- Thẻ: skill, quy-trinh, tai-lieu-lech, nhieu-nguon-luat
- Chuyện gì: `.claude/skills/build-feature` (27/09) bảo tự đẩy nhánh, thiếu `phan-bien` và
  `danh-gia-tac-dong`, và dựa vào `specs/` mà thư mục này chưa từng có spec thật. Trong khi đó
  AGENTS.md đã đổi luồng.
- Gốc: luật nằm ở bốn nơi (AGENTS.md, AI-PHOI-HOP.md, memory cục bộ, skill). Sửa một nơi thì
  không có gì nhắc phải sửa ba nơi còn lại. AI-PHOI-HOP.md §4 và §5 cũng đã lệch quyết định 02/10.
- Giá: chưa lọt lỗi, nhưng ai gõ `/build-feature` sẽ bỏ qua bước phản biện.
- Luật: đổi luồng làm việc thì grep cả `.claude/skills/`, `AI-PHOI-HOP.md` và `AGENTS.md`.
  Luật cứng nằm ở AGENTS.md, skill chỉ chứa các bước.
- Nâng: AGENTS.md mục "Luồng làm việc"; build-feature đã xoá.
- Lần: 1

## 03/10/2026 · Cấp ID CEL nhìn mỗi sheet thì trùng · quy-trinh
- Thẻ: id-cel, backlog, trung-id, nhanh-chua-gop
- Chuyện gì: backlog trên `main` dừng ở CEL-185, trong khi nhánh `viec/cel-186-planner-time` đã dùng
  CEL-186 và một nhánh khác đã dùng CEL-187.
- Gốc: xlsx là tệp nhị phân, mỗi nhánh giữ một bản riêng; nhìn sheet thì không thấy ID của nhánh chưa gộp.
- Giá: đã trùng CEL-150 một lần, phải gỡ ở `87f5b0c`.
- Luật: cấp ID bằng `backlog.py xem`, script quét cả commit của mọi nhánh.
- Nâng: máy canh, là `.claude/skills/cap-nhat-backlog/backlog.py`; cach-lam.md một dòng.
- Lần: 2

## 04/10/2026 · Bộ đo tự xác nhận qua cùng nguồn sai với guard · ai-rag
- Thẻ: guard ten, d.sao, oracle, eval tu xac nhan, van phong
- Chuyện gì: A/B văn phong CEL-186 — reviewer mù bắt Phá Toái, Thiên Y (chỉ có ở `d.sao`) trong bài, trong khi eval báo 0 tên ngoài gói.
- Gốc: guard và bộ đo cùng dựng tập tên từ `tapTenTuGoi` (có `d.sao`), nên cùng mù một chỗ; đầu mốc in tên vào khối nghiêng là cửa sau thứ hai.
- Giá: một vòng A/B ($0,11) đo trên guard hỏng, một phiên sửa + một phiên final hardening.
- Luật: tập được phép dựng từ chữ prompt đã in; bộ đo dùng oracle render prompt, không gọi hàm guard; kèm thử đột biến.
- Nâng: `docs/bay/ai-rag.md` (5 dòng cuối) + máy canh `GROUND-04` trong `scripts/test-focused.ts`.
- Lần: 1
