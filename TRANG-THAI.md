# Bảng bàn giao

Hai AI làm trên hai máy không nói chuyện được với nhau. Tệp này là chỗ duy nhất
chúng nói chuyện. Nó nằm trong git nên ai `git pull` cũng đọc được.

**Luật:** trước khi bắt đầu một việc thì ghi vào "Đang làm". Xong việc thì chuyển
xuống "Vừa xong" kèm mã commit. Đụng phải thứ gì đang hỏng thì ghi vào "Đang
vướng". Ghi bằng tiếng người, không bằng thuật ngữ.

Cập nhật tệp này là một commit riêng, đẩy thẳng lên `main`. Nó không ảnh hưởng mã
chạy nên không cần nhánh, và để trên nhánh riêng thì máy kia không thấy.

---

## Đang làm

| Ai | Việc | Nhánh | Chạm vào tệp nào | Bắt đầu |
|---|---|---|---|---|
| — | (chưa có việc nào đang chạy) | — | — | — |

## Đang vướng — đừng đụng vào

| Chỗ nào | Vướng gì | Ai biết rõ |
|---|---|---|
| — | — | — |

## Vừa xong

| Việc | Commit | Ngày |
|---|---|---|
| Bản theo dõi tính năng `PRODUCT-BACKLOG.xlsx` + luật cập nhật | `(bản này)` | 19/09/2026 |
| Luận theo lĩnh vực do model viết, bốn sửa nhỏ màn Lá số | `ec3327d` | 19/09/2026 |
| Rà soát từng màn: đâu do AI viết, kỳ làm mới | `d7a9b78` | 19/09/2026 |
| Mệnh bàn to hơn 41%, thanh công cụ dính theo khi cuộn | `ae240b4` | 19/09/2026 |
| Bỏ hàng chọn chế độ bản đồ, tab cho trang quản trị | `c36b43a` | 19/09/2026 |
| Căn cứ chỉ cho quản trị, sửa bug lưu trùng, bố cục hai cột | `7144719` | 19/09/2026 |
| Trí nhớ hội thoại cho Hỏi Celes theo §12.5 | `7322d40` | 18/09/2026 |
| Sửa câu kê sao thay vì vứt cả bài | `1f36f6f` | 18/09/2026 |
| Mốc dòng thời gian do model viết, một lượt gọi cho cả nhóm | `b151749` | 18/09/2026 |
| Bảng 8 lĩnh vực do model viết | `4447a85` | 18/09/2026 |
| Tab Lá số, sửa lịch âm, bắt đầu chuyển bề mặt tất định sang AI | `a04efc7` | 18/09/2026 |

---

## Điều cả hai máy cần biết

- **Production luôn là nhánh `main`.** Đẩy lên `main` là phát hành thật, khoảng
  40 giây sau là người dùng thấy.
- **Bản nào đang chạy trên máy chủ:** mở
  <https://celestia-tuvi.vercel.app/api/phien-ban>. Nó trả mã commit.
- **Chưa làm, và vì sao:**
  - Lưu trạng thái quan hệ ở Kết nối (§27) — cần quyết định sản phẩm trước.
  - Tách phần miễn phí và phần khoá (§28) — cần bảng giá trước.
  - Các kiểu quan hệ gia đình chi tiết — cần quyết định phạm vi trước.
- **Trần chất lượng hiện tại là model.** Chuỗi model để `gpt-4o-mini` đứng đầu
  theo yêu cầu của chủ dự án. Đo được: `gpt-5.4-mini` cho bài sâu hơn hẳn với
  cùng hạng giá. Đừng tự đổi; muốn đổi thì hỏi chủ dự án.
