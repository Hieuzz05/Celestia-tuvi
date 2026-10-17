# Bảng luật tổ hợp lớp hạn — bản trình duyệt (commit 2b)

Ngày 16/10/2026 · nhánh `viec/van-han-lop-han` · khung đã có ở `lib/tuvi/luat-to-hop.ts` (commit 16e35e0), bảng đang rỗng.

## ✅ KẾT QUẢ DUYỆT — 17/10/2026 (bản soát lại, thay cho đề xuất bên dưới)

Chủ dự án duyệt sau một vòng tham khảo nguồn ngoài, một vòng `phan-bien`, rồi soát lại từng dòng nguồn (celes-domain cùng đọc nguyên văn). Đã vào mã ở `lib/tuvi/luat-to-hop.ts`.

| Luật | Thành phần | Phạm vi | Cung xét | Chiều | Câu nghĩa | Nguồn độc lập (nguyên văn, đã đối chiếu máy) |
|---|---|---|---|---|---|---|
| `KINH_TRUNG_LUU` | Kình Dương gốc + Lưu Kình | xung-chieu | tiểu hạn, đại vận | cản trở | "Giai đoạn này dễ va chạm hoặc bị khiêu khích; giữ bình tĩnh, tránh đối đầu trực diện." | **Phú Toàn Thư:** «Kình Dương trùng phùng lưu Dương» (Vũ Tài Lục 762, Ảo bí 5465, Chìa khoá 253) · **Ứng dụng:** «hạn ngộ KÌNH có lưu KÌNH xung» (Phụ Tinh 2067), «Kình cố định gặp Kình lưu động xung hội họp» (Chính Tinh 4812) |

**Đã sửa so với lần duyệt đầu trong ngày (sai sót của Claude):**
- **Bỏ luật Hổ.** Lúc trình, Claude báo Hổ có 2 nhóm nguồn, nhưng điều đó sai. Hàm số 2567 viết «Tang Hổ gặp Lưu Tang, Lưu Hổ», còn 2587 viết «xem kỷ Tang Hổ và Lưu Tang, Lưu Hổ». Cả hai nói về **bộ Tang Hổ**, không phải Bạch Hổ đứng riêng. Chỉ nhóm Ứng dụng nói đúng Hổ đơn (Phụ Tinh 808, Chính Tinh 4812), mà nhóm này chỉ tính là 1 nguồn.
- **Kình bỏ "cung hỏi".** Vũ Tài Lục 762 chỉ nói Mệnh, các dòng còn lại chỉ nói hạn. Không dòng nào cho áp vào một cung bất kỳ như Tài hay Phu Thê.
- **Câu nghĩa Kình:**
  - Bỏ "Năm này", vì luật áp cả cho đại vận 10 năm.
  - Bỏ "tranh chấp", vì nguồn chỉ nói khiêu khích.

**Máy canh mới (để không lặp lại):**
- Mỗi nguồn trong mã phải kèm **câu trích nguyên văn**.
- Bài test mở đúng tệp sách, đúng số dòng, và đỏ khi:
  - dòng đó không chứa câu trích;
  - câu trích không gọi tên đủ các sao của luật (sao lưu phải kèm chữ «lưu»).
- Đã thử làm lệch số dòng và cắt câu trích: test đều đỏ.
- **Giới hạn:** máy không phân biệt được "Tang Hổ" với "Hổ". Chỗ đó vẫn phải đọc bằng mắt khi duyệt.
- CI không có kho sách nên phần đối chiếu chỉ chạy trên máy có `D:/Tài liệu tử vi/markdown`.

**Phạm vi `xung-chieu`:**
- Sao gốc phải nằm **đúng cung đang xét**, sao lưu nằm ở cung đó hoặc cung xung.
- Nếu cho sao gốc nằm ở cung xung thì luật khớp cả vào cung trống. Đo đột biến 17/10: số lần khớp gấp đôi.
- ⚠️ **Câu hỏi còn mở:** Phụ Tinh 2067 còn viết «ngộ lưu KÌNH có KÌNH cố định xung», tức Lưu Kình ở cung xét, Kình gốc ở cung xung. Luật hiện **không** bắt chiều này — chờ anh quyết có mở hay không.

**Máy kiểm đếm theo nhóm nguồn:**
- Vũ Tài Lục, Chìa khoá và Ảo bí cùng chép một câu phú, tính là một nhóm.
- Tổng hợp và Hàm số tính là một nhóm.
- Hai tệp Ứng dụng tính là một nhóm.
- Hai tệp Thiên Lương tính là một nhóm.

**Để ngoài, chờ thêm sách:**
- Bạch Hổ + Lưu Hổ: chỉ có nhóm Ứng dụng.
- Tang + Lưu Tang: chỉ có Nguyễn Phát Lộc. Bộ Tang Hổ + Lưu Tang Hổ cũng chỉ có nhóm này.
- Đà gốc + Lưu Đà: phần nghĩa chỉ có một nguồn. Tổng hợp 3707 nằm trong mục Điền/Tài, chỉ nói họa tài sản.
- Song Lộc Tồn: Tổng hợp 1102 nói trung tính, còn Chính Tinh 4301/4303 là lời bàn cho một lá số cụ thể.
- Lưu Kình + Lưu Tang: bỏ.
- Thất Sát + «刑忌»: chỉ có một câu phú. Lưu ý: «刑» trong Trung văn là Kình Dương.
- Kỵ gốc + lưu Kỵ: chờ đợt anh bổ sung tài liệu tứ hoá.

---

*(Phần dưới là bản đề xuất ban đầu ngày 16/10, giữ lại để tra.)*

**Anh cần làm:** với mỗi dòng, ghi **Duyệt / Bỏ / Sửa** (sửa chiều, phạm vi, câu nghĩa). Dòng nào chưa duyệt thì không vào mã.
Commit 3 vẫn chạy được với bảng rỗng, nên bảng này không chặn việc khác.

## Đọc bảng thế nào

- **Trích dẫn:** giữ nguyên chữ sách, chỉ sửa lỗi quét OCR của bộ Ứng dụng ("BẠCH HÀ" → BẠCH HỔ, "cốđịnh" → cố định, "đÀ" → ĐÀ).

- **Luật** = sao gốc chỉ lên tiếng khi đi cùng một thứ thuộc lớp hạn (sao lưu, lưu hoá, hoá đại vận). Đây là đúng hướng đã chốt: sao gốc chỉ là dẫn chứng.
- **Phạm vi:** `đồng cung` = cùng ở cung đang xét. `tam phương` = cung đang xét + hai cung tam hợp + cung xung chiếu.
- **Cung xét:** cung tiểu hạn, cung đại vận, cung đang hỏi.
- **Sách độc lập:** tôi tính theo tác giả chứ không theo số tệp. *Tử vi tổng hợp* và *Tử Vi hàm số* coi là một nhóm (cùng trường phái Nguyễn Phát Lộc). *Ứng dụng – Chính Tinh* và *Ứng dụng – Phụ Tinh* là một bộ. Vũ Tài Lục, Chìa khoá và Ảo bí đều dịch chung một câu phú gốc.
  ⚠ Máy kiểm `kiemBangLuat` hiện chỉ đếm **số tệp**. Nếu dòng nào chỉ dựa vào hai tệp cùng tác giả thì máy vẫn cho qua. Tôi chỉ xếp vào nhóm I những dòng có từ 2 nguồn độc lập trở lên.
- **Tần suất** là tỉ lệ (lá số × năm) mà luật khớp ở cung tiểu hạn. Đo offline trên 7.680 ca: lá sinh từ 1950 đến 2012, năm xem từ 2024 đến 2028. Luật nào khớp quá thường xuyên thì không còn là tín hiệu "năm này đặc biệt".

### Tần suất đo được

| Tổ hợp | đồng cung | đồng cung + xung | tam phương |
|---|---|---|---|
| Kình gốc + Lưu Kình | 1,9% | 7,1% | 15,0% |
| Đà gốc + Lưu Đà | 2,6% | 6,6% | 16,0% |
| Bạch Hổ gốc + Lưu Bạch Hổ | 0,0% | 6,8% | 12,8% |
| Tang Môn gốc + Lưu Tang Môn | 3,1% | 6,8% | 37,4% |
| Lộc Tồn gốc + Lưu Lộc Tồn | 1,3% | 2,8% | 10,2% |
| Thiên Mã gốc + Lưu Thiên Mã | 9,2% | 18,5% | 36,8% |
| Lưu Kình + Lưu Tang Môn | **không thể** | **không thể** | 31,0% |
| Lưu Kình + Lưu Bạch Hổ | **không thể** | **không thể** | 16,8% |
| Hóa Kỵ gốc + lưu Hóa Kỵ | 1,2% | 3,3% | 13,4% |
| Thiên Hình + Kỵ theo hạn | 1,3% | 4,6% | 17,9% |

Hai điều rút ra từ bảng đo:
1. **Lưu Kình không bao giờ cùng cung hay xung chiếu với Lưu Tang / Lưu Hổ.** Nếu viết luật hai sao này "đồng cung" thì luật không bao giờ khớp. Bài CI hiện có sẽ báo đỏ trường hợp đó, vì nó đòi mỗi luật khớp ít nhất một lần.
2. Sách hay nói "**xung**" (Phụ Tinh 2067 "lưu KÌNH xung", 2988 "lưu ĐÀ LA xung MỆNH"). Khung hiện tại chỉ có hai phạm vi là đồng cung và tam phương. Nếu chọn tam phương cho Kình, Đà, Tang, Mã thì luật khớp 15–37% số năm, quá thường xuyên. → **Đề xuất thêm phạm vi thứ ba: `xung-chieu` = đồng cung + cung xung.** Đây là sửa nhỏ ở hàm `vungXet`, có thêm ca test. Anh duyệt thì tôi làm cùng commit 2b.

---

## Nhóm I — có từ 2 nguồn độc lập trở lên (đề xuất duyệt)

### I-1 `KINH_TRUNG_LUU` — Kình Dương gốc gặp Lưu Kình
- **Thành phần:** sao Kình Dương (gốc) + sao Kình Dương (lưu)
- **Phạm vi đề xuất:** đồng cung + xung (7,1%) · **Cung xét:** tiểu hạn, đại vận, cung hỏi · **Chiều:** cản trở
- **Câu nghĩa:** "Năm này dễ va chạm, tranh chấp hoặc tổn thương bất ngờ; việc gì cũng nên chậm lại một nhịp."
- **Nguồn (đã đối chiếu nguyên văn):**
  - Vũ Tài Lục 762: «Kình Dương trùng phùng lưu Dương Tây Thi khuynh vẫn thân.» (cùng câu phú: Ảo bí 5465, Chìa khoá 332)
  - Ứng dụng – Phụ Tinh 2067: «Khó chịu nhất là hạn ngộ KÌNH có lưu KÌNH xung, hoặc hạn ngộ KÌNH cố định có lưu KÌNH xung.»
  - Ứng dụng – Chính Tinh 4812: «Kình cố định gặp Kình lưu động xung hội họp»
  - Tử vi tổng hợp 3707: «Kình, Đà gặp Lưu Kình, Lưu Đà thì họa đến mau chóng…»
- **Số nguồn độc lập:** 3 (phú gốc · bộ Ứng dụng · Nguyễn Phát Lộc)

### I-2 `DA_TRUNG_LUU` — Đà La gốc gặp Lưu Đà
- **Thành phần:** Đà La (gốc) + Đà La (lưu)
- **Phạm vi đề xuất:** đồng cung + xung (6,6%) · **Cung xét:** tiểu hạn, đại vận, cung hỏi · **Chiều:** cản trở
- **Câu nghĩa:** "Năm này việc dễ dây dưa, bị kéo lùi hoặc vướng chuyện ngầm; đừng ép tiến độ."
- **Nguồn:**
  - Ứng dụng – Phụ Tinh 2988: «năm có lưu ĐÀ LA xung MỆNH cùng lúc có đại Hạn có ĐÀ cố định xung»
  - Ứng dụng – Chính Tinh 4319: «…khóc thầm vì lưỡng Đà lưỡng Kỵ…»
  - Tử vi tổng hợp 3707 (như I-1)
- **Số nguồn độc lập:** 2

### I-3 `HO_TRUNG_LUU` — Bạch Hổ gốc gặp Lưu Bạch Hổ
- **Thành phần:** Bạch Hổ (gốc) + Bạch Hổ (lưu)
- **Phạm vi đề xuất:** đồng cung + xung (6,8%; đồng cung đơn thuần không xảy ra trên mẫu đo) · **Cung xét:** tiểu hạn, đại vận · **Chiều:** cản trở
- **Câu nghĩa:** "Năm này nên giữ sức khoẻ và tránh rủi ro tai nạn; có thể có chuyện buồn trong nhà."
- **Nguồn:**
  - Ứng dụng – Phụ Tinh 808: «đại hạn có BẠCH HỔ cố định lại có Lưu BẠCH HỔ hội họp cung là một điều xấu, càng xấu hơn khi có lưu BẠCH HỔ xung.»
  - Tử Vi hàm số 2567: «Tang Hổ gặp Lưu Tang, Lưu Hổ: tang tốc liên tiếp, ưu phiền rất nặng, tai họa khủng khiếp.»
  - Tử Vi hàm số 2587: «…Đại, Tiểu Hạn cần lưu ý xem kỷ Tang Hổ và Lưu Tang, Lưu Hổ. Nếu đồng cung thì sự hung hiểm càng nhiều.»
- **Số nguồn độc lập:** 2

### I-4 `TANG_TRUNG_LUU` — Tang Môn gốc gặp Lưu Tang Môn
- **Thành phần:** Tang Môn (gốc) + Tang Môn (lưu)
- **Phạm vi đề xuất:** đồng cung + xung (6,8%). **Không dùng tam phương** (khớp 37,4%). · **Cung xét:** tiểu hạn, đại vận · **Chiều:** cản trở
- **Câu nghĩa:** "Năm này dễ có tin buồn hoặc nỗi lo kéo dài; nên để ý sức khoẻ người thân."
- **Nguồn:** Tử Vi hàm số 2567, 2587 (như I-3); Tử vi tổng hợp 4746 («…năm Hợi có Lưu tang, khiến cho cung Quan bị song tang, Song hổ…»). Bộ Ứng dụng chỉ nói về Hổ (808), **không nói riêng Tang Môn**.
- **Số nguồn độc lập: 1** (chỉ nhóm Nguyễn Phát Lộc) → **Đúng luật thì phải để ở nhóm II.** Tôi để dòng này ở đây chỉ vì nó đi cặp với I-3. Anh chọn một trong hai:
  - (a) gộp I-3 và I-4 thành một luật "Tang hoặc Hổ trùng lưu". Khung chưa hỗ trợ "hoặc", nên phải tách thành hai luật dùng chung nguồn.
  - (b) chỉ giữ I-3.

### I-5 `LUU_KINH_LUU_TANG` — Lưu Kình gặp Lưu Tang Môn
- **Thành phần:** Kình Dương (lưu) + Tang Môn (lưu)
- **Phạm vi:** **bắt buộc tam phương** (hai sao này không bao giờ cùng cung hay xung chiếu), khớp 31,0% — **quá thường xuyên.** · **Chiều:** cản trở
- **Nguồn:**
  - Số Tử Vi dưới mắt khoa học 1211: «Lưu Dương lưu Tang gặp cho Hạn hành năm ấy phải lo chẳng lành»
  - Phú Lê Quý Đôn 171: «Hổ, Tang, Thái Tuế cùng bày. Lưu Dương lại gặp đoán rày khắc cha.»
- **Số nguồn độc lập:** 2. Nhưng câu Lê Quý Đôn đòi đủ Hổ + Tang + Tuế + Lưu Dương, và nghĩa là "khắc cha", tức chỉ áp cho cung Phụ Mẫu.
- **Đề xuất:** **Bỏ**, hoặc chỉ dùng như dẫn chứng phụ, không vào chiều. Lý do: hai sách nói hai nghĩa khác nhau, và chỉ khớp được ở tam phương nên khớp gần một phần ba số năm, không còn là dấu hiệu riêng của năm đó.

### I-6 `SONG_LOC_TON` — Lộc Tồn gốc gặp Lưu Lộc Tồn ⚠ SÁCH MÂU THUẪN
- **Thành phần:** Lộc Tồn (gốc) + Lộc Tồn (lưu) · **Phạm vi:** đồng cung + xung (2,8%)
- **Bên nói TỐT**, Tử vi tổng hợp:
  - 1102: «Mỗi lần sao Lưu gặp sao cố định đồng cung thì ý nghĩa được tăng cường gấp đôi, về cái hay cũng như về cái dở.»
  - 1103: «Đối với Lưu Lộc Tồn cũng vậy, sao Lưu làm tăng ý nghĩa cho sao Lộc Tồn cố định.»
- **Bên nói XẤU**, Ứng dụng – Chính Tinh:
  - 4301: «năm nào có LỘC TỒN hội họp… thì bất lợi, sang năm Canh Dần có LỘC TỒN xung, 2 LỘC TỒN xung đột nhau càng bất lợi»
  - 4303: «2 LỘC TỒN trùng phùng… Đó là những năm xấu chứ không phải là tốt.» Lưu ý cả hai câu đều nói trong bối cảnh **hạn có Thất Sát**.
- **Đề xuất:** chiều **hai mặt**. Câu nghĩa: "Năm này tiền bạc có cơ hội tăng, nhưng càng giữ chặt càng dễ vướng; nên tiêu có kế hoạch." Phương án khác: tách thành hai luật, thêm điều kiện Thất Sát cho bên xấu. Cách này cần chính tinh làm thành phần, khung đã hỗ trợ.
- **Anh quyết chiều.**

### I-7 `SAT_HINH_KY` — Thất Sát ở Mệnh/Thân, hạn gặp Thiên Hình + Hóa Kỵ
- **Thành phần đề xuất:** Thất Sát (gốc) + Thiên Hình (gốc hoặc lưu) + Hóa Kỵ (**theo hạn**)
- **Nguồn:**
  - Vũ Tài Lục 586: «Thất sát lâm Thân Mệnh lưu niên Hình Kị tai thương.» (cùng câu phú: Chìa khoá 242, Ảo bí 5453)
  - Ứng dụng – Chính Tinh 1151 trích lại câu phú: «Chỉ có MỆNH hay THÂN có THẤT SÁT hạn đến HÌNH KỴ đủ gặp họa rồi.»
- **Số nguồn độc lập: 1 câu phú gốc.** Chính Tinh chỉ bình lại câu phú đó.
- **Chỗ chưa rõ:** "lưu niên Hình Kị" có thể hiểu là Kỵ của can năm xem (lưu Kỵ), hoặc Hình Kỵ gốc nằm ở cung lưu niên. Khung còn đòi "cung xét = cung Mệnh/Thân", mà kiểu `CungXet` hiện chưa có giá trị này.
- **Đề xuất: để sau** (nhóm II).

---

## Nhóm II — chỉ 1 nguồn độc lập (không đủ luật ≥2 sách; để ghi sổ)

| # | Tổ hợp | Nguồn (đã đối chiếu) | Ghi chú |
|---|---|---|---|
| II-1 | Kỵ gốc + lưu Kỵ | Phụ Tinh 313 «đáng sợ là Kỵ cố định hội họp lại có lưu HÓA KỴ tọa thủ hay hội họp»; Chính Tinh 5568 | Cùng bộ Ứng dụng. Máy kiểm sẽ cho qua vì đếm hai tệp, nhưng thực chất chỉ là 1 nguồn |
| II-2 | Thiên Hình + lưu Kỵ | Chính Tinh 4815 «Hình dễ đem lại sự trừng phạt, thương tích khi có thêm lưu Kỵ» | |
| II-3 | Lưu Kình + Lưu Bạch Hổ vào đại vận | Chính Tinh 4788 «Vào năm có lưu KÌNH tại Đại Hạn lại thêm lưu BẠCH HỔ tôi chết.» | Hai sao không bao giờ cùng cung; tam phương khớp 16,8% |
| II-4 | Thiên Mã + Lưu Mã | Tổng hợp 1102; Hàm số 3980 «Mã và Lưu Mã: Thăng quan tiến chức… đổi chỗ ở, chỗ làm» | Cùng nhóm Nguyễn Phát Lộc. Đồng cung khớp 9,2% |
| II-5 | Kình + Linh ở Mệnh, năm gặp Bạch Hổ | Vũ Tài Lục 760 (cùng câu phú: Ảo bí, Chìa khoá); Khảo luận 867 hiểu là «tiểu hạn có Bạch hổ» (Hổ gốc) | Một câu phú. Hai sách hiểu Hổ lưu hay Hổ gốc khác nhau |
| II-6 | Luật chung "sao lưu gặp sao gốc cùng tên thì tăng gấp đôi" | Tổng hợp 1102–1104 | Chỉ 1 nguồn. Nếu áp thì I-1→I-4 thành trường hợp riêng của luật này |

**Không tìm thấy nguồn nào cho:** tứ hoá đại vận (đúng như đã biết, anh sẽ bổ sung tài liệu); lưu Lộc + lưu Mã; Kỵ + Cự Môn dạng lưu.

**Sách phản đối dùng sao lưu** (ghi để anh biết, không đổi hướng đã chốt):
- Số Tử Vi dưới mắt khoa học 986: «cách xem lưu niên đại hạn, lưu niên thái tuế… chưa thấy đúng với thực tế»
- Ứng dụng – Chính Tinh 4648: «Không dùng Lưu Niên, Lưu nguyệt không chính xác…» Lưu ý: cùng bộ này ở chỗ khác vẫn dùng sao lưu rất nhiều (4812, 4788).

---

## Tóm tắt đề xuất

| Dòng | Đề xuất |
|---|---|
| I-1 Kình trùng lưu | **Duyệt**, cản trở, đồng cung + xung |
| I-2 Đà trùng lưu | **Duyệt**, cản trở, đồng cung + xung |
| I-3 Hổ trùng lưu | **Duyệt**, cản trở, đồng cung + xung |
| I-4 Tang trùng lưu | Anh chọn (a) hoặc (b) — thực chất chỉ 1 nguồn |
| I-5 Lưu Kình + Lưu Tang | **Bỏ** (khớp 31%, hai sách nói hai nghĩa) |
| I-6 Song Lộc Tồn | Anh quyết: hai mặt / tách theo Thất Sát / bỏ |
| I-7 Sát + Hình Kỵ | Để sau |
| Phạm vi `xung-chieu` mới | **Duyệt** (cần cho I-1→I-4) |
| Máy kiểm đếm theo tác giả thay vì theo tệp | Đề xuất thêm bảng nhóm tác giả vào `kiemBangLuat` |

Câu nghĩa đều viết bằng chữ đời thường, không có chữ nội bộ ("hoá chồng", "lớp hạn", tên sao lưu). Anh muốn đổi giọng câu nào thì sửa thẳng vào đây.
