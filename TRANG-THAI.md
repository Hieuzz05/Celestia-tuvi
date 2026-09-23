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
| Bản đọc sâu, mỗi chặng một lượt gọi | Sát trần 55 giây: đo 23/09 có chặng mất 52s, chặng sau chạm trần và cả bài hỏng. Hỏng NGẪU NHIÊN — hai lượt khác trong ngày vẫn qua. Xem CEL-117 | Claude (máy 1) |

## Vừa xong

| Việc | Commit | Ngày |
|---|---|---|
| **ĐÃ LÊN PRODUCTION**: văn phong + Phase A + mở tổng quan cho khách (7 commit, gộp theo quyết định của chủ dự án). `viec/mobile-adaptive` CHƯA gộp | `6020772` | 23/09/2026 |
| CEL-118 — phần tổng quan mở cho khách, chỉ luận giải chuyên sâu cần đăng nhập; kèm sửa thanh điều hướng tràn trên iPhone (nhánh `viec/mo-tong-quan-cho-khach`) | `a0024db` | 23/09/2026 |
| A5 nhát cắt đầu + cắm mẫu vàng cho sáu bề mặt (nhánh `viec/kien-truc-phase-a`) | `57934ca` | 23/09/2026 |
| Phase A của `KIEN-TRUC-LUAN-GIAI.md`: A1 (ngân sách từ thành trần) + A3 (chỗ cắm mẫu vàng) + chia ba nhóm luật cho A5 — nhánh `viec/kien-truc-phase-a` | `10b7dc5` | 22/09/2026 |
| CEL-112 — bản adaptive cho điện thoại (nhánh `viec/mobile-adaptive`) | `36ac30d` | 22/09/2026 |
| CEL-111 — xếp luật trước, dữ kiện sau để nhà cung cấp đệm được prompt | `b941869` | 22/09/2026 |
| CEL-110 — đếm và chặn một cách cục bám quá nhiều phần (7/12 → 4/12) | `9e11ac8` | 22/09/2026 |
| CEL-110 — văn phong Celes cho chat và bảng 12 lĩnh vực; bảng tách hai lượt gọi song song (52,3s → 43,3s) | `b041f2e` | 22/09/2026 |
| CEL-088 — trí nhớ hội thoại xuyên phiên (KHÔNG cần SQL mới) | `(bản này)` | 19/09/2026 |
| Spec Chat Quality v1: P1-6b — chat biết bài tổng quan đã nói gì | `261dde7` | 19/09/2026 |
| Spec Chat Quality v1: P1-5/7/8 — giọng chắc chắn, lối đi tiếp, lớp tự kiểm | `492fe16` | 19/09/2026 |
| Spec Chat Quality v1: P2-10 — bộ đo chat quyết định, 6 tiêu chí | `c95fbbd` | 19/09/2026 |
| Spec Chat Quality v1: P0-3 + P0-4 — chat ra hình dạng tin nhắn, biết hỏi ngược | `f27d802` | 19/09/2026 |
| Spec Chat Quality v1: P0-1 — lớp cách cục, 22 luật | `df3702e` | 19/09/2026 |
| Spec Chat Quality v1: P0-2 — planner có trục ý định | `32474f7` | 19/09/2026 |
| Bản theo dõi tính năng `PRODUCT-BACKLOG.xlsx` + luật cập nhật | `713a6d9` | 19/09/2026 |
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
  - **Streaming cho chat (CEL-089)** — bẫy đã lường: validator chạy SAU khi có
    JSON đầy đủ, nên chỉ được stream `tomTat` trước rồi mới đổ các ý ĐÃ LỌC.
- **Kho mẫu vàng đang RỖNG và đó là việc của chủ dự án** (A2 trong
  `KIEN-TRUC-LUAN-GIAI.md`): sáu loại × hai bản, mỗi mẫu kèm một câu nói rõ bản
  ấy đáng học ở chỗ nào. Đổ vào `KHO_VANG` trong `lib/rag/mau-vang.ts` là chạy,
  không phải sửa chỗ nào khác. Chưa có mẫu thì KHÔNG được cắt nhóm luật
  `mau-day-duoc` — cắt trước là bỏ luật mà chưa có thứ thay thế.
- **Trần chất lượng hiện tại là model.** Chuỗi model để `gpt-4o-mini` đứng đầu
  theo yêu cầu của chủ dự án. Đo được: `gpt-5.4-mini` cho bài sâu hơn hẳn với
  cùng hạng giá. Đừng tự đổi; muốn đổi thì hỏi chủ dự án.
