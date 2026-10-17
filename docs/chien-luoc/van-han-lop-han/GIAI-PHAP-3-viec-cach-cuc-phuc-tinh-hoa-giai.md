# GIẢI PHÁP 3 việc cho C1 bản 4: nhãn cách cục, phúc tinh và cứu tinh, luật hoá giải

Bản 5, 18/10/2026. Việc A viết lại theo ý anh: xét **hợp hay không hợp** theo bộ trên tam phương, không đếm sao tốt sao xấu. Việc B, C giữ như bản 2. Mục "Phản biện" ở cuối ghi những gì các bản trước sai và đã sửa.
Anh chỉ cần duyệt giải pháp. Mọi câu sách đã được đọc nguyên văn trong kho `D:/Tài liệu tử vi/markdown`, có ghi
số dòng. Phần nào sách không có thì ghi rõ "tôi tự đặt".

**Ba việc này dùng để làm gì.** Theo C1 bản 4, khi xét một năm hay một đại vận, Celes xét thêm cung gốc: cung
đang hỏi, Mệnh (thêm Thân ở hậu vận), Phúc Đức. Cung gốc tốt thì năm xấu nhẹ bớt, cung gốc xấu thì năm xấu nặng
thêm. Mức chỉnh tối đa một bậc, không lật chiều. Muốn máy biết cung gốc tốt hay xấu thì cần ba thứ:
- việc A: sao trong cung có hợp với chính tinh không;
- việc B: Phúc Đức thế nào là có sao cứu;
- việc C: sao gốc nào làm nhẹ được hạn xấu.

Trong tài liệu, mỗi phần của cung gốc được chấm **+1 (đỡ), 0 (không chỉnh), −1 (làm nặng)**. Đó là số nội bộ để
máy chạy. **Celes không bao giờ nói những chữ này.** Celes nói tên sao, tên cung, chuyện đời cụ thể.

---

## Việc A. Chấm một cung gốc: hợp hay không hợp, theo bộ

### Hai bước đổi so với bản 2
1. **Không gắn nhãn tốt/xấu cho từng sao nữa.** Bản 2 coi cát tinh là tốt, sát tinh hãm là xấu, tức là đếm sao,
   đúng điều anh nói là máy móc. Bây giờ máy hỏi: **sao này có hợp với bộ chính tinh của cung không.** Cùng một
   Địa Kiếp đắc: đi với Sát Phá Tham thì hợp, đi với Cơ Nguyệt Đồng Lương thì không hợp.
2. **Bộ lấy theo chính tinh đóng trong cung; sát tinh, cát tinh xét trên cả tam phương tứ chính.** Bản 3 chỉ xét
   sao đóng cùng cung, nên các cặp "hợp" gần như không bao giờ xảy ra được (ví dụ Phá Quân miếu ở Tý Ngọ không bao
   giờ đóng cùng Kình Đà Không Kiếp đắc). Bản 4 lấy bộ bằng cách bắt đủ sao trên tam phương như engine, nhưng như vậy
   Cơ Nguyệt Đồng Lương chỉ đủ bộ khi Tử Vi ở cung lẻ, Tử Phủ Vũ Tướng Liêm chỉ đủ khi Tử Vi ở cung chẵn: nửa số cung
   không thuộc bộ nào, và cùng một Thiên Lương gặp Địa Kiếp ra hai điểm khác nhau. Bản này lấy bộ theo chính tinh
   của cung, và cung có hai chính tinh khác bộ thì xét cả hai bộ.

Sách dùng đúng chữ "hợp". *Hàm số* 1458–1459: "Các sao hợp với Phá quân miếu địa gồm có: - Cát tinh (Xương Khúc,
Tả Hữu, Tam Hóa). - Sát tinh đắc địa (Kình, Đà, Không, Kiếp). b) Các sao phá hoại Phá quân miếu địa gồm có: -
Sát tinh hãm địa." *Hàm số* 1467 nói rõ là hội chiếu: "Phá miếu địa được cát tinh hỗ trợ và sát tinh đắc địa hội
chiếu thì mới tốt".

### A1. Bộ của cung và độ sáng
- **Bộ của cung** là bộ của các chính tinh đóng trong cung, theo đúng cách chia bốn bộ của engine
  (`cach-cuc.ts:100-126`): Tử Phủ Vũ Tướng Liêm, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật. Ví dụ cung Tử Vi
  Thất Sát thuộc cả Tử Phủ Vũ Tướng Liêm lẫn Sát Phá Tham. Cung vô chính diệu không có bộ, chỉ dùng luật vô chính
  diệu ở A3.
- **Độ sáng chính tinh** đọc ở chính tinh **đóng trong cung** (`dosang.ts`): mọi chính tinh Miếu, Vượng, Đắc là
  sáng; có Hãm mà không có sao sáng là hãm; còn lại là thường.
- **Sát tinh** (Kình Dương, Đà La, Địa Không, Địa Kiếp, Hoả Tinh, Linh Tinh) xét **từng sao** trên tam phương tứ
  chính, mỗi sao theo độ sáng của chính nó.
- **Cát tinh** xét theo **đủ cặp** trên tam phương, đúng bảng bộ phụ tinh engine đang có (`cach-cuc.ts:201-266`):
  Khôi Việt, Xương Khúc, Tả Hữu, Song Lộc, Đào Hồng, Long Phượng. Một sao lẻ không tính.

### A2. Bảng hợp và không hợp

| # | Bộ của cung | Gặp | Kết | Nguồn nguyên văn |
|---|---|---|---|---|
| 1 | Sát Phá Tham, mọi chính tinh trong cung sáng | sát tinh **đắc** | hợp | *Khảo luận* 3071 (mục 3069 "các chính tinh cung đại vận và các cung nhị, tam hợp, xung chiếu"): "Hung tinh đắc địa thì tốt, gặp đúng quan thầy trong bộ Sát Phá Tham càng tốt hơn". *Hàm số* 1458, 1467. *Hàm số* 2750: "Sát Phá Liêm Tham đắc địa được sự hội tụ… của sát tinh đắc địa như Kình, Đà, Không, Kiếp". *Khảo luận* 2610: Không Kiếp "nể mặt… các sao Sát Phá Tham nhất là Phá quân là thầy của chúng". |
| 2 | Sát Phá Tham, chính tinh trong cung hãm hoặc thường | sát tinh đắc | hai mặt | *Hàm số* 1459: "Nếu Phá quân hãm địa gặp sát tinh đắc địa thì được giàu sang, nhưng chóng tà hay bị tai họa." |
| 3 | Sát Phá Tham | sát tinh **hãm** | không hợp | *Hàm số* 1459 (sát tinh hãm "phá hoại Phá quân miếu địa"). *Khảo luận* 3071: "Hung tinh hãm địa thì xấu lắm." *Hàm số* 2747: Kiếp Không hãm "Đi với võ tinh hãm địa như Sát Phá, Liêm Tham… càng tác họa mạnh mẽ thêm gấp bội." |
| 4 | Tử Phủ Vũ Tướng Liêm | sát tinh **đắc** | hai mặt | *Hàm số* 2280: "nếu bị Kình, Không, Kiếp, Hỏa Linh đắc địa đi kèm thì đắc vị trong thời loạn… đòi hỏi sự đấu tranh chật vật". *Nghiệm lý toàn thư* 467: "dẫu là Tử Phủ đắc địa gặp họ cũng đắc địa càng có sự tranh chấp quyết liệt." |
| 5 | Tử Phủ Vũ Tướng Liêm | sát tinh **hãm** | không hợp | *Khảo luận* 2609: Không Kiếp "gặp… Tử vi, Thiên phủ… thì chúng phá cho tan tành". *Hàm số* 2305: "Tử - Vi gặp sát tinh khác nhất là Không Kiếp, Kình Đà, Linh Hỏa. Đây là trường hợp bất lợi nhất." *Hàm số* 2263 (Tử Vi bình hoà "cần tránh gặp… Kình, Đà, Không, Kiếp"). |
| 5a | Tử Vi hoặc Thiên Phủ **miếu, vượng** trong cung | Không Kiếp hãm | hai mặt (giảm, không xoá) | *Hàm số* 2746: "chỉ có Tử - vi và Thiên phủ miếu và vượng địa mới có nhiều hiệu lực đối với Kiếp Không". Câu ngay trước, 2745: "hung họa vẫn tiềm tàng, chỉ giảm bớt được ít nhiều chớ không mất hẳn." |
| 5b | Tử Vi trong cung, **không** ở Tý, Hợi, Mão, Dậu | Hoả Tinh, Linh Tinh hãm | hai mặt (giảm, không xoá) | *Hàm số* 2270: "Đặc biệt Tử - Vi chế được hung tính của hai sao Hỏa Tinh và Linh Tinh." 2271–2272: ở Hợi, Tý, Mão, Dậu "Tử - Vi không còn rực rỡ, do đó hiệu lực cứu giải… giảm thiểu đi nhiều". |
| 5c | Tử Vi hoặc Thiên Phủ trong cung | Không Kiếp **đóng cùng cung** (dù đắc) | không hợp | *Khảo luận* 591: "Vua gặp kẻ cướp… Mệnh có Tử Phủ gặp Không Kiếp đồng cung". Tử Phủ đồng cung chỉ ở Dần Thân, đúng chỗ Không Kiếp đắc (`dosang.ts:48-49`). |
| 6 | Cơ Nguyệt Đồng Lương | sát tinh hãm, hoặc Không Kiếp dù đắc | không hợp | *Khảo luận* 2609 (Không Kiếp phá tan Cơ Nguyệt Đồng Lương, không kèm điều kiện). Cùng câu này nói cả Tử Phủ, nhưng Tử Phủ có câu riêng nói hai mặt khi đắc (dòng 4); Cơ Nguyệt Đồng Lương không có câu riêng nào ngược lại, nên giữ. *Hàm số* 2017, mục cách xấu: "Đồng Không Kiếp, Hỏa Linh". *Khảo luận* 1102: "Cơ gặp sát tinh đồng cung thì trộm cướp". |
| 6a | Cơ Nguyệt Đồng Lương | Kình, Đà, Hoả, Linh **đắc** | không xét | *Nghiệm lý toàn thư* 467: Cơ Nguyệt Đồng Lương "bị chi phối tuỳ theo bộ sao Lục Sát và vị trí đắc hay hãm địa của họ". Câu không nói chiều nào. |
| 7 | Cự Nhật | sát tinh, khi Thái Dương hoặc Thái Âm trong cung hãm | không hợp | *Khảo luận* 736: "Nhật Nguyệt hãm cung phùng ác sát, lao toái bôn ba". Các ca khác của Cự Nhật: chưa có câu sách, không xét. |
| 8 | Tham Lang (với Vũ Khúc) ở Sửu, Mùi | Hoả Tinh hoặc Linh Tinh **đóng cùng cung**, dù engine ghi hãm | hợp | *Hàm số* 809: "Tham hỏa tương phùng Cung Mệnh hay Quan an tại Tứ mộ, có Tham Vũ tọa thủ đồng cung" (Tham Vũ đồng cung chỉ ở Sửu, Mùi). *Hàm số* 1562: "Tham Hỏa đồng cung miếu địa… phú quí tột bực" (Tham miếu chỉ ở Sửu, Mùi). Thìn, Tuất không đưa vào vì chỉ có *Khảo luận* 578 đỡ, còn *Đẩu số toàn thư* 1992 lại đặt cách này ở Mão. |
| 9 | Thiên Đồng ở Ngọ | Kình Dương đóng cùng cung | không xét | Sách ngược nhau. *Hàm số* 2016: "Đồng Kình ở Ngọ: có uy vũ lớn". Nhưng Đồng ở Ngọ luôn đi cùng Thái Âm hãm, và *Khảo luận* 734: "Mệnh có Thái âm gặp Kình dương hay Đà la đồng cung thì tan vỡ tình vợ chồng và hao tài tốn của", *Khảo luận* 736: "Nhật Nguyệt hãm cung phùng ác sát". |
| 10 | Mọi bộ, chính tinh sáng | một bộ cát tinh đủ cặp | hợp | *Hàm số* 2280: "Hay nhất là cách Tử Phủ Vũ Tướng có kèm theo cát tinh kể trên." *Hàm số* 1467. *Khảo luận* 3091 (Cơ Nguyệt Đồng Lương cần Xương Khúc, Khoa Quyền Lộc). |
| 10a | Mọi bộ, chính tinh hãm | một bộ cát tinh đủ cặp | đỡ cho chính tinh hãm (không lên +1) | *Tử vi tổng hợp* 1403: "Gặp chính tinh hãm, cần có nhiều phụ tinh tốt". |
| 11 | Sát Phá Tham | Xương Khúc | không xét | Sách ngược nhau: *Nghiệm lý toàn thư* 203 "đụng nhằm Sát Phá Tham là tối kỵ"; *Hàm số* 1458 xếp Xương Khúc vào sao hợp Phá Quân miếu. |
| 12 | Có Địa Không hoặc Địa Kiếp hãm trên tam phương | | dòng 10, 10a không tính | *Hàm số* 2745: "Kiếp Không hãm địa làm giảm sự tốt đẹp của cát tinh". |

Giữ từ bản 2, vì vốn đã là luật theo bộ: Nhật Nguyệt tịnh minh hợp (*Hàm số* 1775–1776); Khốc Hư hãm không hợp
(*Hàm số* 3831); Mã đầu đới kiếm theo nhánh engine đã duyệt 16/10. Hình Tướng Ấn, Tuần Triệt án ngữ không xét ở
việc A (lý do như bản 2).

### A3. Chấm điểm cung
Lấy mọi dòng khớp, rồi xét theo thứ tự:
1. Có cả **hợp** lẫn **không hợp** (kể cả dòng "hai mặt"): **0**. Celes nói cả hai mặt.
2. Chỉ có **không hợp**: **−1**, dù chính tinh sáng.
3. Chỉ có **hợp**: **+1**.
4. Không khớp dòng nào:
   - chính tinh hãm: **−1** (*Khảo luận* 3070: "Chính tinh đắc địa thì tốt, hãm địa thì xấu"), trừ khi có dòng
     10a thì **0**;
   - vô chính diệu có Thái Dương, Thái Âm sáng cùng chiếu: **+1** (*Hàm số* 1777);
   - còn lại: **0**.

### Đã đo (2000 lá ngẫu nhiên × 12 cung = 24.000 cung, script tạm, chưa vào mã)

Mẫu lấy ngẫu nhiên đủ 24 giờ, mọi ngày từ 1950 đến 2009, nam nữ (bộ 60 lá mẫu cũ chỉ có giờ Tý, Thìn, Thân nên lệch).
Script cài đủ bảng A2, A3 và luật Khốc Hư; chưa cài Nhật Nguyệt tịnh minh và Mã đầu đới kiếm (hiếm).

| Phạm vi xét sát tinh | +1 | 0 | −1 |
|---|---|---|---|
| Chỉ trong cung | 29,0% | 47,1% | 23,9% |
| Trong cung + cung xung chiếu | 21,1% | 48,8% | 30,1% |
| **Tam phương tứ chính (bản này)** | **14,6%** | **54,0%** | **31,4%** |

- Theo từng cung gốc (Mệnh, Quan Lộc, Tài Bạch, Phu Thê, Tật Ách, Phúc Đức) số gần như nhau: −1 từ 29% đến 33%.
- **Lệch về phía làm nặng, khoảng 2 cung −1 trên 1 cung +1.** Vẫn trong mốc 40%, nhưng anh nên biết. Gốc: mỗi lá số
  có trung bình ba bốn sát tinh hãm, nên tam phương của phần lớn cung có ít nhất một sao.
- **Sát tinh đắc gần như không tự kéo cung lên được: chỉ 0,3% số cung lên +1 nhờ riêng sát tinh.** Lý do: cùng tam
  phương gần như luôn có thêm một sát tinh hãm, nên cung ra "hai mặt" (0). Đúng ý sách ("giàu sang nhưng chóng tàn",
  "tranh chấp"), Celes nói cả hai mặt. Nếu anh muốn sát tinh đắc gặp Sát Phá Tham có tiếng nói lớn hơn, cách có
  nguồn là cho sao **đóng trong cung** nặng hơn sao chiếu (*Hàm số* 737); tôi đo rồi trình.
- Tham Hoả tương phùng ở Sửu, Mùi: 54 lần trên 2000 lá.

### Ví dụ (lá số có thể có)
- Quan Lộc ở Dần có Tham Lang, Hoả Tinh đóng ở Ngọ chiếu về, không có sát tinh hãm: +1. Celes: "Quan Lộc của bạn
  có Tham Lang, lại gặp Hoả Tinh. Hai sao này đi với nhau thì công việc dễ có dịp lên nhanh." (*Khảo luận* 3071.)
- Quan Lộc có Thiên Lương, tam phương có Địa Kiếp: −1. Celes: "Quan Lộc có Thiên Lương nhưng gặp Địa Kiếp. Công việc
  dễ đổ vỡ giữa chừng, tiền dễ hao." (*Khảo luận* 2609.)
- Quan Lộc có Tử Vi miếu, tam phương có Kình Dương đắc: hai mặt, 0. Celes: "Quan Lộc có Tử Vi đi với Kình Dương: có
  quyền, nhưng phải tranh giành mới giữ được." (*Hàm số* 2280, *Nghiệm lý* 467.)

### Câu ngược anh cần biết
1. ***Khảo luận* 3088**, nếu đọc lướt thì ngược ví dụ của anh: "Nếu cung Mệnh có Tử Phủ Vũ Tướng mà cung Vận có
   Kình Đà Không Kiếp, Hỏa Linh lại có dịp đi lên". Câu này nói **Mệnh gặp vận** (lá số gốc gặp vận hạn), không nói
   sao trên tam phương của cùng một cung gốc. Không dùng ở việc A; đoạn 3085–3092 sẽ là nguồn chính cho việc riêng
   "xem Mệnh đặt vào vận".
2. ***Hàm số* 2750**: Kiếp Không đắc với Tử Phủ Vũ Tướng đắc là "cách nguyên thủ". *Hàm số* 2280 và *Nghiệm lý
   toàn thư* 467 lại nói Tử Phủ gặp sát tinh đắc là đấu tranh, tranh chấp. Bản này chọn **hai mặt** (dòng 4), không
   chấm xấu như ví dụ của anh, vì sách không cùng nói xấu.
3. ***Hàm số* 1856**: "Sát gặp Tứ Sát (Kình Đà Linh Hỏa): bị tật, chết trận rất thê thảm", không nêu độ sáng. Dòng 1
   vẫn cho Thất Sát gặp sát tinh đắc là hợp, theo *Khảo luận* 3071 vì câu đó nói rõ độ sáng.
4. **Tham Hoả ở Sửu, Mùi** (dòng 8): engine ghi Hoả Linh hãm ở Sửu, Mùi (theo *Hàm số* 3068). Dòng 8 vượt độ
   sáng cho đúng cách này. Có nên sửa bảng độ sáng Hoả Linh hay không là việc riêng (chạm engine, kéo theo app).

### Ghi sổ, chưa làm
- Sát tinh gặp sát tinh: *Hàm số* 2756 (cùng đắc "phú quý được một thời"), *Hàm số* 3234 ("Kình Hỏa miếu địa: số
  võ nghiệp rất hiển hách").
- Cát tinh không hợp riêng: *Hàm số* 2289 ("Tử - Vi Không Kiếp Đào Hồng: số yểu vong").
- Thiên thời (*Nghiệm lý toàn thư* 468 gọi là "điều kiện tiên quyết") — thuộc việc "xem Mệnh đặt vào vận".
- Vũ Khúc, Liêm Trinh, Thiên Tướng có câu riêng (*Hàm số* 2205, 2207, 2369, 1382, 1414); bản này để chúng theo bộ
  Tử Phủ Vũ Tướng Liêm của engine. Đưa vào bảng bộ sao đợt 2 nếu đo thấy lệch.

---

## Việc B. Phúc tinh và cứu tinh

### Hai danh sách, lấy nguyên từ sách
- **Phúc tinh, 10 sao.** *Tự điển* (Đắc Lộc) 431–433: "LOẠI PHÚC TINH: Ân quang, Thiên quý, Thiên đức, Nguyệt
  đức, Phúc đức, Thiên giải, Giải thần, Thiên thọ, Thiên quan quý nhân, Thiên phúc quý nhân."
- **Cứu tinh, 8 sao.** *Tự điển* (Đắc Lộc) 511, mục CUNG GIẢI (Tật Ách): "Tốt nhất là có cứu tinh như : Giải thần,
  Thiên giải, Thiên phúc, Thiên quan, Phúc đức hay Quang Quý Sửu, Mùi, Thiên đức, Nguyệt đức thì không lo ốm đau
  tai nạn." Ân Quang, Thiên Quý chỉ tính khi đóng ở Sửu hoặc Mùi.

Engine đã an đủ các sao này (`ansao.ts:302-340`, sao Phúc Đức ở `constants.ts:227`). Lưu ý: sao Phúc Đức và
Thiên Đức luôn đóng cùng cung, nên tính là một, không đếm hai lần.

### Dùng thế nào
Câu nền: *Tự điển* (Đắc Lộc) 479: "Mệnh, Phúc tốt mà Thiên di, giải ách vận hạn ngộ hung sát thì đỡ xấu. Mệnh
không tốt, Phúc không có cứu tinh mà Thiên di, giải ách vận hạn ngộ hung sát thì rất nguy." Câu này **ghép Mệnh
với Phúc**, nên Phúc không chấm riêng:

| Mệnh gốc (theo A3) | Cung Phúc Đức gốc | Điểm của cặp |
|---|---|---|
| +1 | có cứu tinh đóng tại cung, không có Không Kiếp cùng hãm | +1 |
| −1 | không có cứu tinh đóng tại cung | −1 |
| các ô còn lại | | 0 |

- Chỉ đếm sao **đóng tại cung** Phúc Đức (*Hàm số* 737). Phạm vi hẹp này tôi tự đặt.
- **Không Kiếp hãm vượt sức cứu tinh.** Năm mà phía xấu có Không Kiếp cùng hãm thì cặp Mệnh–Phúc chỉ được +1
  khi cứu tinh là **Thiên Giải**. *Hàm số* 2746: "chỉ có Tử - vi và Thiên phủ miếu và vượng địa mới có nhiều hiệu
  lực đối với Kiếp Không. Về các phụ tinh có : Tuần, Triệt, Thiên giải và Hóa khoa, là bốn sao tương đối mạnh. Kỳ
  dư những sao giải khác như Địa Giải, Giải thần, Thiên đức, Nguyệt đức, Long đức, Phúc đức, Thiên quan, Thiên
  phúc v.v.. không đủ sức chế ngự Kiếp Không hãm địa".
- Câu hỏi **sức khoẻ**: cung đang hỏi là Tật Ách. Có cứu tinh đóng tại Tật Ách gốc thì tính như một bộ tốt trong
  việc A. Đúng phạm vi câu 511.
- Phúc tinh 10 sao chỉ để Celes **dẫn chứng**. Phép chỉnh chỉ dùng cứu tinh.
- Trong lời Celes luôn gọi "sao Phúc Đức", để không lẫn với cung Phúc Đức.

---

## Việc C. Hoá giải: Tuần, Triệt ở cung hạn

### Sách nói gì
- *Chìa khóa* 1113, câu phú: "Triệt đáo kim Cung, Tùng lâm Hỏa địa, bất kỉ sát tinh, bại diệu". Lời giải ở 1200:
  "Triệt ở Thân, Dậu, Tuất ở Thìn, Tỉ, Ngọ, Mùi nhưng Cung đó nếu có tụi Linh, Hỏa, Không, Kiếp, Kình, Đà, Kỉ,
  Kiếp Sát, Song hao, Tang, Hổ, Khốc, Hư thì vô ngại".
- *Hàm số* 4205–4206: "Lợi địa ở Tỉ, Ngọ và Thân, Dậu… hạn đến 2 bộ cung này thì tuần triệt không phá hại"; "Bại
  địa ở vị trí khác. bấy giờ hai sao này tác họa."
- *Hàm số* 4236: "Tuần vì ảnh hưởng nhẹ, vừa phải nên làm cho sao xấu bớt xấu chớ không làm thành tốt lên. Ngược
  lại, Tuần làm cho sao bớt tốt… Triệt… có thể làm cho sao xấu thành tốt và ngược lại".
- *Hàm số* 4248: "Tuần ảnh hưởng suốt đời, còn Triệt chỉ mạnh cho đến khoảng 30 tuổi".
- *Chìa khóa* 1209: "Tử, Phủ đồng Cung gặp Tuần, Triệt… hạn xấu cũng chẳng giải được xấu".

Hai sách cùng nói: Tuần Triệt chỉ giải sát tinh khi **ở đúng vị trí** (Tỵ Ngọ, Thân Dậu). Ở vị trí khác, *Chìa
khóa* 1197, 1210 vẫn nói là giải, còn *Hàm số* 4206 nói là gây hoạ. Hai bên ngược nhau, nên vị trí khác không
dùng.

### Luật
- **Cung hạn** là cung đại vận và cung tiểu hạn đang xét, không phải cung đang hỏi trên lá số gốc. Như vậy Tuần
  Triệt không bị tính hai lần (một ở cung gốc, một ở hạn).
- Cung hạn có **Tuần ở Tỵ hoặc Ngọ**, hoặc **Triệt ở Thân hoặc Dậu**, và năm đó nghiêng về cản: điểm hoá giải
  **+1**.
- Triệt chỉ tính khi người xem **dưới khoảng 30 tuổi** ở năm đang xét (*Hàm số* 4248). Mốc 30 tuổi âm.
- Cung hạn có Tử Vi và Thiên Phủ đồng cung: không giải (*Chìa khóa* 1209).
- Năm nghiêng về thuận: không chỉnh. Sách nói Tuần Triệt lợi địa "không phá hại", không nói làm tốt thêm.
- Điểm này **đi chung với cung gốc**, chung trần một bậc (xem mục Gộp). Vì vậy không bao giờ lật chiều. Bản 1 để
  luật này trong lớp quyết chiều, có thể lật năm cản thành thuận; bản này đã sửa.

### Ghi sổ, chưa làm đợt này

| Câu sách | Vì sao chưa làm |
|---|---|
| *Hàm số* 4071: "Sứ, Kình, Đà : dữ ( Tử, Đồng Lương giải được)" | Phải có luật xấu "Sứ gặp Kình Đà" trước. Đưa cả hai vào **bảng bộ sao đợt 2**. |
| *Ảo bí* 1997–1998 ("Lưu hạn gặp được Tử-vi, Thiên tướng, Lộc-tồn thì giải được hung ngay") | Câu chỉ nói cho người Mệnh Thất Sát hãm gặp hạn Thất Sát hãm hội Liêm Hình. Rất hiếm lá số khớp. |
| *Chìa khóa* 1207, 1215, 1216 (tuổi nào gặp sao nào thì "vô ngại") | Câu trỏ tới "các Sao kể trên" nhưng bản chép đã mất chỗ nó chỉ tới. |
| *Nghiệm lý toàn thư* 1272, 1296 (Nhân hoà: sao đại vận cùng bộ với Mệnh thì hoà thuận) | **Bản 1 đề xuất, phản biện đánh sập.** Theo phép an sao, nhóm Tử Phủ luôn ở những cung cùng chẵn lẻ với Tử Vi, còn nhóm Cơ Nguyệt luôn ở nhóm cung kia. Luật này hoá ra chỉ là "đại vận ở cung chẵn hay lẻ", cộng trừ xen kẽ từng mười năm cho mọi người. Ngay sách cũng coi Nhân hoà là yếu tố phụ của Thiên thời, và ví dụ của chính tác giả (1304) không trừ điểm khi khác bộ. Bỏ. |
| Thiên thời: tam hợp Thái Tuế (*Nghiệm lý toàn thư* 1295) | Chưa nghiên cứu. Ghi sổ cho việc "xem mệnh đặt vào vận". |

---

## Gộp: cung gốc và hoá giải chỉnh mức thế nào

Mỗi năm có tối đa bốn điểm:
1. cung đang hỏi trên lá số gốc (việc A);
2. Mệnh; ở hậu vận lấy Thân thay khi Mệnh được 0 (*Tử vi tổng hợp* 309);
3. cặp Mệnh–Phúc (việc B);
4. hoá giải Tuần Triệt (việc C).

Luật chống đếm đôi của C1 bản 4 giữ nguyên: cung đại vận hoặc tiểu hạn trùng với cung ở mục 1, 2 thì bỏ mục đó.

**Cộng bốn điểm lại**:
- tổng dương: năm cản thì giảm một bậc ("rõ" xuống "nhẹ"); năm thuận "nhẹ" lên "rõ";
- tổng âm: năm cản "nhẹ" lên "rõ", chỉ khi phía cản có mục mạnh đã duyệt (C2); năm thuận "rõ" xuống "nhẹ";
- tổng bằng 0: không chỉnh.

Không bao giờ quá một bậc, không đưa về "cân", không lật chiều. Cộng rồi lấy dấu là tôi tự đặt: sách không nói
khi các phần ngược nhau thì gộp thế nào.

---

## Celes sẽ nói thế nào

Celes nói tên sao, tên cung, chuyện đời. Không nói điểm, không nói "chịu tốt", "nền", "lực", "tín hiệu", "nhóm
sao", không ẩn dụ. Mức chắc của câu không vượt chữ "ít nhiều" của sách.

- Năm xấu, cung gốc tốt: "Năm nay Lưu Kình chiếu vào Quan Lộc nên công việc dễ va chạm, áp lực. Quan Lộc của bạn
  có Thiên Phủ miếu, lại có Tả Phù ngay trong cung, nên áp lực này thường nhẹ bớt."
- Có hoá giải: "Năm nay Lưu Đà chiếu vào cung sức khoẻ. Cung hạn có Triệt đóng ở Thân, nên chuyện thường nhỏ
  hơn mình lo."
- Năm xấu, Mệnh và Phúc yếu: "Năm nay Lưu Kỵ vào cung tiền bạc. Mệnh và cung Phúc Đức của bạn đều không có sao
  đỡ, nên năm này nên giữ tiền chặt hơn thường lệ."

Máy kiểm câu (việc e của máy 2) chặn các chữ cấm này.

---

## Đo trước khi bật cờ
1. Tỉ lệ +1 / 0 / −1 của cung gốc trên 60 lá mẫu. Tôi tự đặt mốc: +1 không quá 40%, −1 không quá 40%. Đo xong
   trình anh số thật, anh chỉnh mốc.
2. Số lần luật Tuần Triệt khớp.
3. Phân bố nhãn trước và sau khi thêm cung gốc. Điều kiện bật cờ của C2 giữ nguyên.

## Phản biện việc A (bản 4 → bản 5)

**Sập, đã sửa:**
- Bộ bắt bằng đủ sao trên tam phương làm nửa số cung không có bộ (tuỳ Tử Vi ở cung chẵn hay lẻ). Đã đổi: bộ theo
  chính tinh đóng trong cung.
- Số đo trên 60 lá mẫu lệch giờ sinh, và thiếu luật Khốc Hư. Đã đo lại trên 2000 lá ngẫu nhiên: −1 là 31,4%, không
  phải 18,6%.
- Dòng 9 (Đồng Kình ở Ngọ) bị *Khảo luận* 734, 736 nói ngược. Đã chuyển sang "không xét".
- Dòng 5 dùng vế "Tử Phủ hãm" của *Nghiệm lý* 467, điều kiện không bao giờ xảy ra. Đã bỏ, thay bằng *Hàm số* 2305.

**Lung lay, đã sửa:** 5a, 5b từ "không tính" thành "hai mặt" (*Hàm số* 2745 "chỉ giảm bớt được ít nhiều"); 5b loại
Tử Vi ở Tý, Hợi, Mão, Dậu (*Hàm số* 2271–2272); dòng 8 thu về Sửu, Mùi; ghi rõ chính tinh "thường" ở dòng 2; giải
thích vì sao *Khảo luận* 2609 giữ cho Cơ Nguyệt Đồng Lương mà không giữ cho Tử Phủ; bỏ *Nghiệm lý* 466 và chữ
"sáng" khỏi lời mẫu.

**Còn lung lay:** lệch 2:1 về −1; sát tinh đắc chỉ tự kéo lên 0,3% số cung; độ sáng Hoả Linh ở tứ mộ.

## Phản biện việc A (bản 3 → bản 4)

**Sập, đã sửa:**
- Bản 3 chỉ xét sao cùng cung, nên dòng Phá Quân miếu với sát tinh đắc là luật chết, và dòng "đúng cặp quan thầy" gần
  như không khớp. Đã chuyển sang tam phương.
- Bản 3 loại *Khảo luận* 3088 vì "nói về vận, không cùng cung" nhưng lại dùng *Khảo luận* 3071, 3091, *Nghiệm lý* 466
  cùng loại. Bản 4 xét tam phương nên 3071 đúng phạm vi; 3088–3092 (Mệnh gặp vận) vẫn tách sang việc riêng.
- Bản 3 chấm Tử Phủ gặp sát tinh đắc là không hợp, bỏ qua *Hàm số* 2270, 2280, 2746, *Nghiệm lý* 467. Đã sửa: đắc thì
  hai mặt, có hai ngoại lệ 5a, 5b.
- Tham Hoả tương phùng ở tứ mộ bị chấm −1, Đồng Kình ở Ngọ bị chấm −1. Đã thêm dòng 8, 9.
- Bản 3 nới *Khảo luận* 1102 (chỉ nói Thiên Cơ) ra cả bộ Cơ Nguyệt Đồng Lương. Bản 4 dựa vào *Khảo luận* 2609 (nói cả
  bộ) và để Kình Đà Hoả Linh đắc là "không xét" theo *Nghiệm lý* 467.

**Lung lay, đã sửa:** lỗ hổng "chỉ có hợp mà chính tinh hãm"; cát tinh lẻ một sao (giờ đòi đủ cặp, dùng đúng bảng
engine); cát tinh với chính tinh hãm (dòng 10a); tách bộ khác engine (giờ dùng bộ của engine); lời mẫu có lá số không
thể có và chữ "hợp nhau" trừu tượng. Tỉ lệ −1 đo trên 60 lá mẫu: 18,6% (đo lại ở bản 5).

**Còn lung lay:** (xem bản 5).

## Phản biện (bản 1 → bản 2)

**Sập, đã sửa:**
- Nhân hoà (C-2 bản 1) chỉ là luật chẵn lẻ của cung. Ở đại vận đầu, nó còn so Mệnh với chính nó. Đã bỏ.
- Luật Tuần Triệt bản 1 lấy danh sách sao từ một câu đã bị cắt mất điều kiện vị trí (*Chìa khóa* 1200). Đã sửa:
  chỉ còn vị trí Tỵ Ngọ, Thân Dậu.
- "Kình Đà cả hai hãm" không bao giờ xảy ra. Đã chuyển sang "không tính".
- Cứu tinh không đủ sức với Không Kiếp hãm (*Hàm số* 2746). Đã thêm ngoại lệ, chỉ Thiên Giải được tính.
- Ngoại lệ vô chính diệu không có tác dụng vì luật xếp đòi chính tinh. Đã đưa lên đầu thứ tự xếp.

**Lung lay, đã sửa:**
- Luật Tuần Triệt có thể lật chiều. Đã đưa vào chung trần với cung gốc.
- Triệt mạnh đến khoảng 30 tuổi. Đã thêm mốc tuổi.
- "Cung đang xét" đã định là cung hạn.
- Đổi câu dẫn cho luật cát tinh: dùng *Hàm số* 2745 thay 2748.
- Bỏ nhãn bộ chính tinh.
- Bộ phụ tinh chỉ tính khi có sao đóng ngay trong cung.
- Đã có thứ tự xếp và luật gộp.
- Bỏ luật A3 (Mệnh có Triệt), vì *Hàm số* 4250 nói Triệt gây trở ngại cho cung nó đóng.
- Lời mẫu bỏ "ít khi mất việc", "dễ mệt kéo dài", "cùng nhóm", và bỏ chữ "đi cùng" khi sao không cùng cung.

**Còn lung lay:**
- Các mốc tự đặt chưa đo: "ít nhất một sao trong cung", 40%, và cách cộng rồi lấy dấu.
- Cách lấy Thân thay Mệnh khi Mệnh được 0 là cách đọc của tôi đối với câu "lồng khung trong cung Thân".

**Đứng được:** mọi trích dẫn đúng nguyên văn và số dòng; engine có đủ sao; nhãn Nhật Nguyệt, Khốc Hư, Hình Tướng
Ấn; bỏ các câu Chìa khóa mất chỗ trỏ; ngoại lệ Tử Phủ đồng cung.

## Anh duyệt
1. Việc A: xét theo bộ trên tam phương, bảng hợp/không hợp (A2), cách chấm (A3), cách xử lý bốn câu ngược.
2. Việc B: hai danh sách, bảng Mệnh–Phúc, ngoại lệ Không Kiếp.
3. Việc C: luật Tuần Triệt lợi địa, mốc 30 tuổi, các câu ghi sổ.
4. Luật gộp.
