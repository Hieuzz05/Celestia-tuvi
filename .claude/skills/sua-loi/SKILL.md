---
name: sua-loi
description: Luồng C — sửa một lỗi của Celes. Tìm nguyên nhân gốc trước, sửa, kiểm, ghi bài học. Dùng khi chủ dự án gắn dấu [SỬA LỖI], gõ /sua-loi <mô tả>, hoặc báo một hành vi sai, CI đỏ hay lỗi trên production. Không tự push.
---

# /sua-loi <lỗi>

Luật gốc nằm ở mục "Luồng C" của AGENTS.md. Không có bước `phan-bien`, vì lỗi thì không có phương
án để phản biện. Nhưng nếu cách sửa đòi đổi kiến trúc hay đổi hợp đồng thì đó là việc cỡ Lớn:
chuyển sang `/lam-tinh-nang`.

## 0. Mở phiên
Làm theo `.claude/skills/lam-tinh-nang/mo-phien.md`. Hotfix an toàn hay lỗi đang trên prod vẫn
phải đi nhánh riêng, không có ngoại lệ.

## 1. Tái hiện trước khi sửa
Viết được một ca làm lỗi hiện ra thì mới sửa: một câu chat, một lá số, một lệnh. Có bài test hợp
thì **thêm ca vào test trước, thấy đỏ**, rồi mới sửa (cách đã dùng ở CEL-185). Không tái hiện được
thì báo, đừng sửa theo đoán.

## 2. Nguyên nhân gốc
Gọi `researcher` để lần luồng dữ liệu tới chỗ sinh ra lỗi, không dừng ở chỗ lỗi lộ ra. Hỏi thêm:
**còn chỗ nào cùng gốc?** Ví dụ TQ12 đã sửa một câu nhưng các câu khác có Phụ Mẫu, Huynh Đệ,
Nô Bộc vẫn dính cùng lỗi. Nêu các chỗ cùng gốc trong báo cáo, kể cả khi lần này không sửa hết.

## 3. Sửa
Viết ở phiên chính. Sửa ở gốc, không vá ở chỗ hiện ra. Sửa xong chạy
`node scripts/kiem-nhanh.mjs --chay`; ca ở bước 1 phải chuyển xanh.

Đụng tới khoá đệm, `PHIEN_BAN_*` hay `PHUONG_PHAP.phienBan` thì DỪNG, hỏi chủ dự án. Bump thế hệ
đệm làm mọi lá số phải viết lại và tốn tiền model. Muốn biết bao nhiêu bản ghi bị ảnh hưởng thì
đếm chỉ-đọc trước (cách làm ở CEL-184).

## 4. Kiểm
`qa`, kèm `celes-domain` nếu chạm luận giải. Gọi cùng một lượt.

## 5. Commit
`/cap-nhat-backlog` nếu lỗi làm đổi hành vi so với dòng Logic đang ghi. Commit không dấu, nói rõ
gốc lỗi.

## 6. Bài học — gần như luôn có
Một lỗi đã lọt ra là đã có giá. Gọi `/bai-hoc` và trả lời: vì sao test hoặc reviewer hiện có
không bắt được? Câu trả lời đó thường là máy canh còn thiếu.

## 7. Bàn giao
`/kiem-truoc-push`. 🛑 Push khi được bảo.
