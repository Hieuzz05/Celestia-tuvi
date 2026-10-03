# Cách làm việc — bài học đã chưng cất

Nạp vào MỌI phiên (qua `CLAUDE.md`). Chỉ chứa luật về CÁCH LÀM của AI; bẫy kỹ thuật theo vùng
mã nằm ở `docs/bay/`. Mỗi luật có nguồn trong `docs/bai-hoc/NHAT-KY.md` hoặc một sự cố có ngày.
**Giữ dưới 40 luật.** Luật nào đã có máy canh (test, hook, CI) thì rút còn một dòng trỏ tới máy canh.
Thêm, sửa, rút luật: dùng `/bai-hoc`.

## Kiểm và báo

- **Trước khi nói "push được", phải chạy thật rồi báo bảng.** Gồm `node scripts/kiem-nhanh.mjs --chay`,
  `git log --oneline origin/main..HEAD` (nhánh có thể mang commit của phiên khác: `d99019d` suýt lọt,
  02/10) và quét bí mật trên diff. Kết bằng "push được" hoặc "chưa". Dùng `/kiem-truoc-push`.
  Chủ dự án không muốn phải hỏi lại "rà ok hết chưa?".
- **Trong lúc sửa thì chỉ test đúng vùng vừa động, CI lo toàn bộ** (chủ dự án quyết 02/10/2026).
  Không chạy build hay cả bộ test sau mỗi lần sửa.
- **Reviewer chỉ cho việc LỚN** (02/10/2026). Việc lớn là: đổi kiến trúc, đổi hợp đồng trả lời,
  đổi chữ quan trọng ở mặt trước, hoặc đóng một tính năng lớn. Gồm `phan-bien`, `danh-gia-tac-dong`,
  `bien-tap-vi`. Lỗi nhỏ thì không gọi.
- **Nói "đã kiểm" chỉ khi đã chạy.** Mới đọc diff thì nói là mới đọc diff.

## Phối hợp hai máy

- **Một thư mục chỉ cho một phiên checkout tại một thời điểm.** Phiên thứ hai dùng `git worktree add`.
  Ngày 27/09, hai phiên `git checkout` cùng lúc trong thư mục chính và hai nhánh lẫn commit của nhau.
  Thư mục chính đang có thay đổi chưa commit trên nhánh không phải việc của mình thì coi như có phiên khác.
- **Cấp ID `CEL-` bằng `python .claude/skills/cap-nhat-backlog/backlog.py xem`.** Đừng nhìn sheet
  rồi tự cộng 1: nhánh chưa gộp có thể đã giữ ID đó (trùng CEL-150, phải gỡ ở `87f5b0c`).
- **Memory của Claude là CỤC BỘ một máy, máy kia không đọc được.** Bài học dùng chung phải vào
  `docs/bai-hoc/` hoặc `docs/bay/`, không ghi riêng vào memory.

## Giao tiếp với chủ dự án

- **Tệp trình chủ dự án đọc phải nằm ở chỗ dễ tìm**: máy 1 dùng `D:\Celestia\`, rồi in đường dẫn ra.
  Không đưa đường dẫn AppData hay scratchpad. Ngày 02/10 chủ dự án đã không tìm được tệp phương án.
- **Thiếu dấu loại việc (`[CODE]`…) thì hỏi một câu ngắn**, đừng tự đoán rồi đi sai luồng.
