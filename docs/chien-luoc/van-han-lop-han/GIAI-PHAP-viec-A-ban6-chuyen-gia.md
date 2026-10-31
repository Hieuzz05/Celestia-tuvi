# Việc A, bản 6: luật dùng để XÉT, AI dùng để PHÁN, bộ ca đáp án dùng để ĐO

Ngày 17/10/2026. Đã qua `phan-bien` (2 vòng) và agent chuyên gia tử vi mới (`chuyen-gia-tu-vi`).
Bản này thay bản 5 trong `GIAI-PHAP-3-viec-cach-cuc-phuc-tinh-hoa-giai.md` (việc A).

## 1. Vì sao không để luật tự phán

Bảng luật đứng ra phán thì không qua được rủi ro thứ hai (cứng, không luận được ca đặc biệt). Phản biện chỉ ra hai lý do:

- **Ca đặc biệt chưa có trong bảng vẫn bị luật chung phán sai.** Người dùng nhận bài sai trước khi kịp bổ sung luật.
- **Phản vi kỳ cách trong sách đặt điều kiện theo tuổi và theo mạng:**
  - Ảo bí 2582: Cự Môn ở Thìn Tuất, tuổi Tân;
  - Ảo bí 4217: Cơ Âm ở Dần, "mạng Mộc hay mạng Thủy, gặp được Khoa Quyền Lộc là cách phản vi kỳ";
  - Ảo bí 5517: người mạng Thuỷ hoặc Hoả.

  Engine hiện không xét tuổi hay mạng khi nhận cách cục.

Để AI tự đọc sách mà không có luật thì cũng không ổn:
- Kho có đoạn chữ quét lỗi và bảng lá số mẫu bị dàn thành câu.
- Sách nói ngược nhau mà AI tự chọn bên.
- Không có gì để kiểm khi kho thay đổi.

## 2. Cách làm: ba phần

### Phần 1. Engine dựng hồ sơ đầy đủ (tất định)

Hồ sơ là các dữ kiện trên lá số, chưa có lời phán. Với cung đang hỏi và cung hạn, engine ghi:
- chính tinh trong cung: độ sáng, toạ thủ hay chiếu (Hàm số 737);
- mọi sao trên tam phương và giáp cung, kèm độ sáng;
- Tuần và Triệt, tách thành hai thành phần riêng;
- tứ hoá gốc, đại vận, lưu niên;
- cách cục.

**Thêm mới:** can năm sinh, hành mạng, hành cung, cục, Thân nằm ở cung nào, tuổi người xem.

### Phần 2. Luật QUAN HỆ giữa các sao (đặt trước, có nguồn)

Luật ở đây không ghi "cung này tốt hay xấu". Luật chỉ ghi **sao nào chế hoặc giải được sao nào, với điều kiện gì, mạnh tới đâu**. Ví dụ, tất cả đã đối chiếu nguyên văn:

| Quan hệ | Điều kiện | Nguồn |
|---|---|---|
| Sao cứu giải mạnh: Vũ Khúc, Hóa Khoa, Tử Vi, Thiên Phủ, Thiên Lương, Thiên Đồng, Tuần Triệt | — | Khảo luận 1671 |
| Sao cứu giải nhỏ: Địa Giải, Giải Thần, Thiên/Nguyệt/Phúc/Long Đức, Thanh Long, Thiếu Dương, Thiếu Âm, Thiên Quan, Thiên Phúc, Hóa Lộc, Lộc Tồn, Trường Sinh, Đế Vượng | — | Khảo luận 1672 |
| Tuần Triệt giảm cả cái tốt lẫn cái xấu | Tuần nhẹ, chỉ làm xấu bớt xấu. Triệt mạnh, có thể đảo chiều | Khảo luận 2670, Hàm số 4236 |
| Thiên Phủ chế được Kình, Đà, Hoả, Linh | Gặp đủ cả 4 thì "không chế nổi" | Hàm số 2145 |
| Thiên Quan, Thiên Phúc giải hung | Phải nhập Mệnh hoặc Thân | Bổ Túc 494 |
| Hóa Kỵ đồng cung Liêm Tham ở Tỵ Hợi là sao GIẢI, không phải sao cản | — | Hàm số 2919 |
| Chất quan trọng hơn số lượng | "Lộc Quyền Khoa cộng lại cũng chỉ mạnh bằng một sao xấu Hóa kỉ" | Khảo luận 2553 |

Mỗi luật phải có ca kiểm trên lá số thật. CI kiểm câu trích có thật trong sách.

Phần cách cục chỉ có một nơi định nghĩa là `cach-cuc.ts`. Luật cách cục được thêm điều kiện tuổi và mạng.

### Phần 3. AI phán "hợp với việc gì, không hợp với việc gì"

- **AI nhận:** hồ sơ, các quan hệ đã khớp, cách cục, và các đoạn sách truy hồi về đúng tổ hợp đó.
- **AI xét theo thứ tự sách dạy** (Hàm số 446–456):
  1. Phúc, Mệnh, Thân;
  2. chính tinh;
  3. cách cục: có đủ bộ không, có bị phá không;
  4. bộ sao kết hợp với phụ tinh, kèm quan hệ chế và giải;
  5. tứ hoá;
  6. sao đơn, chỉ dùng để mô tả.
- **Bỏ chỗ máy đếm sao rồi chốt chiều** (`nghieng-ve.ts`).
- **Kết luận theo bốn trục:** hợp với việc gì, không hợp với việc gì, cần điều kiện gì mới thành, và bền hay không bền theo giai đoạn đời (Khảo luận 1613; Chìa khóa 1237).

Cách này qua được ca đặc biệt chưa có luật: AI thấy đủ dữ kiện và đọc được đoạn sách nói về ca đó.

## 3. Đo độ ĐÚNG trước khi chọn

**Bộ ca đáp án:** 30–50 lá số. Mỗi lá có kết luận đúng cho vài cung, do chuyên gia soát và chủ dự án chốt. Bộ ca phải có các ca chuyên gia đề xuất:
- Liêm Tham ở Tỵ Hợi, có và không có Kỵ;
- Thất Sát với Kình Đà, rồi thêm Hoả Linh;
- Phá Quân miếu với Không Kiếp đắc địa, so với Không Kiếp hãm;
- Không Kiếp hãm gặp Tuần;
- Cự Môn ở Thìn Tuất, tuổi Tân so với tuổi khác;
- Cơ Âm ở Dần, mạng Mộc, có Khoa Quyền Lộc;
- Thiên Phủ gặp 1 sát tinh, so với đủ 4 sát tinh;
- Thái Âm ở Sửu Mùi có Tuần và Kỵ.

Hai cách được so trên cùng bộ ca:
- **cách cũ:** đếm sao;
- **cách mới:** luật quan hệ cộng với AI phán.

Cách nào đúng hơn thì chọn.

## 4. Vượt ba rủi ro

| Rủi ro | Cách giải |
|---|---|
| R1. Không phủ đủ cách cục | Luật chỉ phủ quan hệ chế và giải, là nhóm ít và sách liệt kê sẵn (Khảo luận 1671–1672). Cách cục chưa có luật thì AI vẫn đọc được từ sách |
| R2. Cứng, ca đặc biệt và phản vi kỳ cách không luận được | Luật không phán thay AI. Hồ sơ có đủ tuổi và mạng, nên phản vi kỳ cách viết được điều kiện |
| R3. Thêm kiến thức thì khó theo dõi | Mỗi luật có mã, nguồn, ca kiểm. Đổi kho, prompt hay luật thì chạy lại bộ ca đáp án và báo ca nào đổi kết luận. Mã đoạn sách được ghi vào vết. Phiên bản kho, prompt và luật đều nằm trong khoá đệm |

## 5. Số đoạn sách: 6

- Số 6 được đặt từ ngày dựng lớp truy hồi (commit `7045ef3`). **Chưa có bài đo nào chọn ra nó.**
- Bài đo hiện có (`scripts/eval-rag.ts`) chỉ đo câu hỏi một dữ kiện, ở đúng mức 6 đoạn. Các bề mặt khác đang dùng 5, 8 hoặc 10 đoạn.
- Lấy nhiều đoạn hơn thì prompt dài hơn, và đoạn rác dễ lọt vào hơn (kho có đoạn chữ quét lỗi, bảng lá số mẫu). Lấy ít đoạn thì một cung có cả chục tổ hợp sẽ thiếu đoạn cho từng tổ hợp. **Chưa đo nên chưa biết số nào là đủ.**
- Cách đo: chạy 6 / 10 / 15 / 20 đoạn trên bộ câu hỏi về tổ hợp. Đếm tỉ lệ có đoạn đúng và tỉ lệ đoạn rác. Lọc bảng lá số mẫu ra khỏi kho trước khi đo.

## 6. Sách nói ngược nhau: chủ dự án chọn

1. **Tử Phủ gặp tứ sát:**
   - Chìa khóa 756: "Tử Vi - Thiên Phủ 'Mới sợ' tứ sát tinh";
   - Khảo luận 1331: "Thiên phủ chế giảm được tính hung ác của Kình Đà Linh Hỏa".
2. **Cơ Nguyệt Đồng Lương gặp sát:**
   - Khảo luận 2453: "Thiên đồng không sợ sát tinh";
   - Bổ Túc 491: "Cơ Nguyệt Đồng Lương tối kỵ Hỏa Linh xâm phá".
3. **Triệt ở Mệnh:**
   - Ảo bí 5308: Triệt "khắc chế được mọi hung nguy";
   - Bổ Túc 469: "Mệnh có Tuần Triệt là thiếu niên vất vả".
4. **Triệt chỉ mạnh tới khoảng 30 tuổi** (Hàm số 4248). Chính Hàm số 4210 và Khảo luận 2004 lại nghi ngờ mốc 30 này.

## 7. Ví dụ hoá giải của chủ dự án: đã kiểm

- **Danh sách "Hóa Khoa, Giải Thần, Tử Vi, Tuần Triệt" có trong sách, nhưng câu gốc hẹp.** Khảo luận 2109 nói các sao này giải **La Võng**, không phải luật chung. Danh sách đầy đủ ở Khảo luận 1671–1672 (bảng ở phần 2).
- **Từng sao có điều kiện:**
  - Tử Vi ở Hợi, Tý, Mão, Dậu thì giải kém (Hàm số 2271);
  - Hóa Khoa ở cung Hoả thì yếu nhất (Hàm số 2883).
- **"Phá Quân chế Không Kiếp" có trong sách.** Khảo luận 2482: "Phá quân giải trừ được ác tính của Không Kiếp, cũng như Thất sát giải trừ Kình Đà". Agent chuyên gia báo "không tìm thấy" là sót; đã kiểm lại nguyên văn. Đây là lý do mọi kết quả của agent đều phải đối chiếu lại.
