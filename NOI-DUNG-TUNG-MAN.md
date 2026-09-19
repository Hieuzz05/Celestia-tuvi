# Nội dung từng màn: đâu do AI viết, đâu là chữ cố định

Rà ngày 19/09/2026, đọc từ mã nguồn chứ không từ trí nhớ.

Bốn loại nguồn:

| Ký hiệu | Nghĩa |
|---|---|
| **AI** | Gọi model thật. Có ghi kỳ làm mới. |
| **MẪU** | Chữ tất định dựng trong mã từ dữ kiện lá số. Mở bao nhiêu lần cũng như nhau. |
| **GIAO DIỆN** | Chuỗi cố định trong `lib/i18n`. Không liên quan lá số. |
| **ENGINE** | Số liệu engine tính: tên sao, vị trí cung, ngày tháng. Không phải văn. |

**Luật chung cho mọi bề mặt AI:** model hỏng, hết hạn mức, hoặc bài trượt kiểm
duyệt thì tuyến trả 204 và giao diện giữ nguyên bản MẪU. Không bao giờ trắng màn.

---

## Bảng tổng: mọi thứ do AI viết

| Bề mặt | Ở màn | Khoá bộ nhớ đệm | Làm mới khi |
|---|---|---|---|
| Điểm nổi bật + câu mang theo | Hôm nay, Lá số | `ngay:2026-09-19` | **Mỗi ngày** |
| Giai đoạn | Hôm nay | `giai-doan:36-45` | **Mỗi đại vận** (10 năm) |
| Bảng 8 lĩnh vực | Lá số | `nam:2026` | **Mỗi năm** |
| Điều đang chuyển động | Hành trình | `thang:2026-08` | **Mỗi tháng âm** |
| Mốc giai đoạn | Hành trình | `tat-ca` | **Một lần cho mỗi lá số** |
| Mốc năm | Hành trình | `cua-so:2023-2029` | Mỗi lần lật dải năm |
| Mốc tháng | Hành trình | `nam:2026` | Mỗi năm được chọn |
| Luận giải chi tiết | Hành trình → Xem chi tiết | `giai-doan:36-45` · `nam:2026` · `thang:2026-08` | Mỗi mốc được mở |
| Bài đọc dài | Lá số, Khám phá sâu | **không có đệm** | **Mỗi lần bấm** |
| Trả lời chat | Hỏi Celes | **không có đệm** | **Mỗi câu hỏi** |
| Bài kết nối hai người | Kết nối | **không có đệm** | **Mỗi lần xem** |

Ba dòng cuối cố ý không đệm: chúng đều do người dùng chủ động yêu cầu, và mỗi
lần yêu cầu là một câu hỏi khác nhau. Đệm một câu trả lời cho một câu hỏi tự do
thì lần sau hỏi khác lại nhận bài cũ.

Bảng lưu ở `noi_dung_ai`, khoá là bộ bốn (lá số, bề mặt, kỳ, ngôn ngữ).

---

## Trang chủ khách — `/`

Không có AI. Toàn bộ là GIAO DIỆN, trừ một chỗ:

| Khối | Nguồn |
|---|---|
| Tiêu đề, mô tả, các khối giới thiệu, CTA | GIAO DIỆN |
| Lá số mẫu kèm ba thẻ góc nhìn | MẪU — `lib/tuvi/quick-read.ts` trên một ngày sinh mẫu |

## Hôm nay — `/home`

| Khối | Nguồn | Làm mới |
|---|---|---|
| Lời chào, các nhãn | GIAO DIỆN | — |
| **Điểm nổi bật** (thẻ lớn) | **AI** — `/api/diem-noi-bat` | Mỗi ngày |
| **Câu để mang theo hôm nay** | **AI** — cùng lượt gọi trên | Mỗi ngày |
| **Giai đoạn bạn đang đi qua** (đoạn văn) | **AI** — `/api/nhip` cấp giai đoạn | Mỗi đại vận |
| Khoảng tuổi và tên cung của giai đoạn | ENGINE | — |
| Ô nhập "nói với Celes", các chip chủ đề, lưới lối tắt | GIAO DIỆN | — |

Thẻ Điểm nổi bật có bản MẪU hiện ngay, bài AI đè lên khi về.

## Lá số — `/la-so`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Thẻ dẫn đầu** | **AI** — `/api/diem-noi-bat` | Mỗi ngày |
| Hai thẻ góc nhìn nhỏ | MẪU — `docNhanh` | — |
| **Bảng luận giải 8 lĩnh vực** | **AI** — `/api/luan-giai-sau` | Mỗi năm |
| Căn cứ của từng khối (Muốn biết vì sao không) | MẪU — do luật dựng, model không đụng | — |
| **Bài đọc dài** (bấm mới chạy) | **AI** — `/api/luan-giai` | Mỗi lần bấm |
| Mệnh bàn 12 cung | ENGINE | — |
| Khối "Khám phá sâu hơn", nhãn nút | GIAO DIỆN | — |

## Danh sách lá số — `/ho-so`

Không có AI. Tên, ngày sinh, mệnh, cục là ENGINE; mọi nhãn còn lại là GIAO DIỆN.

## Hành trình — `/hanh-trinh`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Điều đang chuyển động** (đoạn tổng) | **AI** — `/api/nhip` cấp tháng | Mỗi tháng âm |
| **Đang mở ra · Đang căng · Cần chờ** | **AI** — cùng lượt gọi trên | Mỗi tháng âm |
| **Chữ của từng mốc giai đoạn** | **AI** — `/api/moc` | Một lần cho mỗi lá số |
| **Chữ của từng mốc năm** | **AI** — `/api/moc` | Mỗi lần lật dải năm |
| **Chữ của từng mốc tháng** | **AI** — `/api/moc` | Mỗi năm được chọn |
| Nhãn mốc, khoảng tuổi, năm, tháng | ENGINE | — |
| Căn cứ của từng mốc | MẪU | — |

Ba nhóm mốc gọi model theo NHÓM, mỗi nhóm một lượt. Một dòng thời gian có khoảng
29 mốc; gọi riêng từng mốc là 29 lượt cho một lần mở trang.

## Hành trình chi tiết — `/hanh-trinh/chi-tiet`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Đang mở ra · Đang căng · Cần chờ** | **AI** — `/api/luan-han` | Mỗi mốc được mở |
| **Nếu ghép lại** | **AI** — cùng lượt gọi trên | Mỗi mốc được mở |
| **Luận theo lĩnh vực** (6 ô) | **AI** — cùng lượt gọi trên | Mỗi mốc được mở |
| Nhịp hành động (Tiến/Giữ/Rà soát/Thu hẹp) | MẪU — **luật đếm, model không được chọn** | — |
| Nên tận dụng · Nên lưu ý | MẪU | — |
| Căn cứ | MẪU | — |

Nhịp hành động cố ý để luật quyết: nó đếm được từ tương quan cát/hung. Để model
chọn là mở đường cho hai lần đọc ra hai kết luận trái nhau trên cùng một lá số.

Sáu ô lĩnh vực đi CHUNG lượt gọi của ba chuyển động, không tốn thêm lượt nào.
Luật vẫn quyết lĩnh vực nào đọc từ cung nào và bên nào đang đỡ; model chỉ viết
lại thành chữ, không được đảo chiều. Ô nào model viết hỏng thì riêng ô đó về
khuôn câu, các ô còn lại giữ nguyên.

## Hỏi Celes — `/hoi-dap`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Câu trả lời** | **AI** — `/api/hoi-dap` | Mỗi câu hỏi |
| Muốn biết vì sao không | MẪU + danh sách đoạn nguồn đã dùng | **Chỉ tài khoản quản trị** |
| Câu hỏi gợi ý lúc trống | GIAO DIỆN | — |

## Kết nối — `/hop-tuoi`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Bài luận hai người** | **AI** — `/api/hop-tuoi` | Mỗi lần xem |
| Bảng so sánh kỹ thuật | MẪU — `lib/tuvi/hoptuoi.ts` | — |
| Bộ chọn ý định | GIAO DIỆN | — |

Bảng so sánh cố ý vẫn trả về cả khi model hỏng.

## Khám phá sâu — `/luan-giai`

| Khối | Nguồn | Làm mới |
|---|---|---|
| **Bài theo chủ đề** | **AI** — `/api/luan-giai` | Mỗi lần bấm |
| Danh sách 7 chủ đề | GIAO DIỆN | — |

## Các màn còn lại

Không có nội dung AI nào:

- `/gioi-thieu`, `/dang-nhap`, `/tai-khoan` — GIAO DIỆN
- `/support`, `/support/checkout/[id]` — GIAO DIỆN + số liệu thanh toán
- `/admin`, `/admin/models`, `/admin/knowledge`, `/admin/support` — số liệu vận hành
- `/admin/retrieval-lab` — chạy truy hồi thật để xem lấy đoạn nào, nhưng **không**
  gọi model sinh văn

---

## Hai điều dễ hiểu nhầm

**"celestia-nam-phai v2026.09.1" không phải tài liệu trong kho.** Đó là phiên bản
bộ quy tắc AN SAO: giờ Tý sớm hay muộn, cách xử tháng nhuận, bộ Tứ Hóa, chiều an
đại vận. Nó ghi lá số được TÍNH bằng luật nào.

**Engine tất định chưa bị xoá và không được xoá.** Mọi bề mặt AI đều dựa vào nó
làm đường lùi. Xoá `lib/tuvi/quick-read-noi-dung.ts`, `luan-giai-sau.ts`,
`luan-han.ts` hay `hanh-trinh.ts` là biến mọi lần model hỏng thành một màn trắng.
