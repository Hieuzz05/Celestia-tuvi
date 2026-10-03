# Hướng dẫn dùng AI Agent cho Celes — dành cho chủ dự án

Tài liệu viết cho máy đang dùng: Windows, VS Code, phần mở rộng Claude Code, gõ lệnh trong ô chat
của Claude Code.

Không cần nhớ hết. Tài liệu nằm sẵn trong repo, cần thì mở lại.

---

## 1. Ba thứ giúp Claude làm việc

| Thứ | Là gì | Ở đâu |
|---|---|---|
| **Trợ lý phụ** (subagent) | Mỗi trợ lý làm một việc: đọc mã, phản biện, kiểm… Làm xong nó chỉ báo lại kết luận, không kéo theo mọi thứ đã đọc, nên cuộc trò chuyện chính đỡ nặng | `.claude/agents/` (9 trợ lý) |
| **Skill** (lệnh `/…`) | Một quy trình nhiều bước đã viết sẵn. Gõ lệnh là Claude làm đúng từng bước, ở cả hai máy | `.claude/skills/` (6 skill) |
| **Sổ bài học** | Nơi ghi lại mỗi lần AI làm sai hoặc tìm ra cách tốt hơn, để lần sau không lặp lại | `docs/bai-hoc/` |

Mọi trợ lý phụ đều **chỉ đọc**, không tự sửa mã, không tự commit. Việc viết mã luôn do Claude
chính làm, sau khi bạn đã duyệt phương án.

---

## 2. Trước khi bắt đầu

1. **Mở đúng thư mục trong VS Code**: `d:\SAPP BA\tuvi-ai`, hoặc thư mục worktree của việc đó.
   Mở sai thư mục thì Claude không thấy trợ lý lẫn skill.
2. **Mở một phiên chat MỚI** sau khi kéo cấu hình mới về (`git pull`). Phiên đã mở từ trước không
   tự thấy skill mới.
3. **Kiểm tra**: gõ `/agents` để thấy 9 trợ lý. Gõ `/` để thấy danh sách skill, trong đó có
   `/lam-tinh-nang`, `/sua-loi`…

---

## 3. Các lệnh thường dùng

| Bạn muốn | Gõ | Claude sẽ |
|---|---|---|
| Làm tính năng hoặc thay đổi mã | `/lam-tinh-nang <mô tả hoặc CEL-xxx>` (hoặc gắn `[CODE]`) | Đọc mã → lên phương án → **dừng chờ bạn duyệt** → viết → kiểm → commit → báo, **không push** |
| Sửa một lỗi | `/sua-loi <mô tả lỗi>` (hoặc `[SỬA LỖI]`) | Tái hiện lỗi → tìm gốc (và chỗ cùng gốc) → sửa → kiểm → ghi bài học |
| Bàn chiến lược (giá, đối thủ, hướng đi) | `/chien-luoc <câu hỏi>` (hoặc `[CHIẾN LƯỢC]`) | Thu dữ liệu → **phản biện bắt buộc** → trình bày "Sập / Lung lay / Đứng được" → bạn quyết → ghi quyết định ra tệp |
| Hỏi "push được chưa?" | `/kiem-truoc-push` | Chạy đúng bài kiểm theo phần đã đổi, soát commit lạc, quét bí mật → bảng kết luận "push được / chưa" |
| Ghi một bài học | `/bai-hoc <chuyện gì>` | Xem đã từng xảy ra chưa → ghi sổ → đưa luật lên đúng chỗ → lặp lần 2 thì đề xuất một bước kiểm tự động |
| Cập nhật bảng theo dõi | `/cap-nhat-backlog` | Ghi `PRODUCT-BACKLOG.xlsx` đúng ba sheet, cấp ID mới không trùng |

Gắn dấu `[CODE]`, `[SỬA LỖI]`, `[CHIẾN LƯỢC]` thì Claude tự gọi đúng skill, không cần gõ lệnh.

**Việc nhỏ và việc lớn.** Theo quyết định 02/10/2026, các trợ lý phản biện (`phan-bien`,
`danh-gia-tac-dong`, `bien-tap-vi`) chỉ dùng cho việc lớn: đổi kiến trúc, đổi cách Celes trả lời,
đổi chữ quan trọng trên giao diện, hoặc đóng một tính năng lớn. Việc nhỏ thì Claude làm nhanh,
chỉ kiểm đúng phần vừa sửa, còn GitHub (CI) chạy toàn bộ bài kiểm sau khi đẩy lên. Claude sẽ nói
rõ nó xếp việc của bạn vào cỡ nào.

---

## 4. Sổ bài học — vì sao có và dùng thế nào

Mục tiêu: **AI làm việc tốt hơn qua từng tính năng, ở cả hai máy.**

- `docs/bai-hoc/NHAT-KY.md`: mỗi lần có cái giá thật thì ghi một mục, như mất thời gian, lỗi
  lọt ra, hay bạn phải sửa lưng. Mục ghi chuyện gì xảy ra, vì sao, mất gì, và luật rút ra.
- `docs/bai-hoc/cach-lam.md`: các luật đã chắt lọc. Claude đọc tệp này ở **mọi phiên** trên cả
  hai máy.
- Bài học **lặp lại lần thứ hai** nghĩa là ghi chữ không đủ. Lúc đó Claude đề xuất biến nó thành
  một bước kiểm tự động (test, hook, CI) để máy chặn thay người nhớ.
- Sổ được đẩy thẳng lên `main` (bạn duyệt 03/10/2026), để máy kia `git pull` là có ngay.

**Bạn chỉ cần làm một việc:** khi thấy Claude làm sai một điều đáng nhớ, nói "ghi bài học" hoặc
gõ `/bai-hoc`. Claude cũng tự ghi khi bị sửa lưng, và ở cuối mỗi lần sửa lỗi.

Memory riêng của Claude chỉ nằm trên một máy, máy kia không đọc được. Vì vậy bài học dùng chung
luôn được ghi vào `docs/bai-hoc/`.

---

## 5. Gọi thẳng một trợ lý

Với câu hỏi không cần sửa gì, bạn cứ nói:

> *"Dùng researcher xem trang Hành trình đang tính mốc thời gian thế nào. Đừng sửa gì."*

> *"Dùng phan-bien đánh sập ý tưởng gói Plus 49k này."*

> *"Dùng quet-doi-thu xem Tử Vi Số đang bán gói gì."*

---

## 6. Dùng sao cho đỡ tốn

Mỗi câu trả lời, Claude phải đọc lại toàn bộ cuộc trò chuyện từ đầu phiên. Phiên càng dài thì mỗi
câu càng tốn.

1. **Một việc một phiên.** Xong việc thì gõ `/clear`.
2. **Chọn model hợp việc** bằng `/model`. Sonnet dùng cho việc thường ngày, Opus cho việc cần suy
   nghĩ sâu.
3. **Xem mức dùng**: `/context` cho phiên hiện tại, `/usage` cho hạn mức.
4. **Việc đọc rộng thì giao `researcher`.**

---

## 7. Sự cố thường gặp

| Thấy gì | Vì sao | Làm gì |
|---|---|---|
| Gõ `/lam-tinh-nang` không thấy | Sai thư mục, hoặc phiên mở trước khi `git pull` | Mở đúng thư mục, mở phiên mới |
| Claude viết mã luôn, không dừng chờ duyệt | Yêu cầu không có dấu và không qua skill | Gắn `[CODE]` hoặc gõ `/lam-tinh-nang` |
| Hai phiên Claude cùng làm một thư mục | Hai nhánh dễ lẫn commit của nhau (sự cố 27/09) | Phiên thứ hai dùng worktree riêng; skill sẽ tự đề xuất |

---

## 8. Quan hệ với luật hai máy

Luật ở `AI-PHOI-HOP.md` vẫn giữ: làm trên nhánh riêng, không commit thẳng `main`. Có **hai** ngoại
lệ được đẩy thẳng `main`: `TRANG-THAI.md` và `docs/bai-hoc/`. Các skill đã tự làm các bước này:
đọc trạng thái, tạo nhánh, ghi "Đang làm".

---

## Bảng tra nhanh

| Muốn làm gì | Gõ gì |
|---|---|
| Làm tính năng | `/lam-tinh-nang <việc>` |
| Sửa lỗi | `/sua-loi <lỗi>` |
| Bàn chiến lược | `/chien-luoc <câu hỏi>` |
| Hỏi push được chưa | `/kiem-truoc-push` |
| Ghi bài học | `/bai-hoc <chuyện gì>` |
| Xem trợ lý | `/agents` |
| Đổi model | `/model` |
| Xoá sạch, bắt đầu lại | `/clear` |
