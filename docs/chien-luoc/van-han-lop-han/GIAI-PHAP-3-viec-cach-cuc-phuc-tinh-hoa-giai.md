# GIẢI PHÁP 3 việc cho C1 bản 4: nhãn cách cục, phúc tinh và cứu tinh, luật hoá giải

Bản 2, 17/10/2026. Bản này đã qua phản biện; mục "Phản biện" ở cuối ghi những gì bản 1 sai và đã sửa thế nào.
Anh chỉ cần duyệt giải pháp. Mọi câu sách đã được đọc nguyên văn trong kho `D:/Tài liệu tử vi/markdown`, có ghi
số dòng. Phần nào sách không có thì ghi rõ "tôi tự đặt".

**Ba việc này dùng để làm gì.** Theo C1 bản 4, khi xét một năm hay một đại vận, Celes xét thêm cung gốc: cung
đang hỏi, Mệnh (thêm Thân ở hậu vận), Phúc Đức. Cung gốc tốt thì năm xấu nhẹ bớt, cung gốc xấu thì năm xấu nặng
thêm. Mức chỉnh tối đa một bậc, không lật chiều. Muốn máy biết cung gốc tốt hay xấu thì cần ba thứ:
- việc A: cách cục nào tốt, cách cục nào xấu;
- việc B: Phúc Đức thế nào là có sao cứu;
- việc C: sao gốc nào làm nhẹ được hạn xấu.

Trong tài liệu, mỗi phần của cung gốc được chấm **+1 (đỡ), 0 (không chỉnh), −1 (làm nặng)**. Đó là số nội bộ để
máy chạy. **Celes không bao giờ nói những chữ này.** Celes nói tên sao, tên cung, chuyện đời cụ thể.

---

## Việc A. Chấm một cung gốc

### A1. Chính tinh, đọc thẳng độ sáng trong cung
Không dùng nhãn của bốn bộ chính tinh (Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật). Engine bắt
các bộ này trên cả tam phương, nên cung nào cũng có ít nhất một bộ; gắn nhãn cho bộ chỉ lặp lại việc đọc độ sáng.
Thay vào đó đọc thẳng độ sáng chính tinh **đóng trong cung** (`lib/tuvi/dosang.ts`):
- mọi chính tinh trong cung đều Miếu, Vượng hoặc Đắc: phần chính tinh **tốt**;
- có chính tinh Hãm và không có chính tinh nào Miếu, Vượng, Đắc: **xấu**;
- một sáng một hãm, hoặc Bình: **thường**.

### A2. Phụ tinh và cách cục: chỉ tính bộ có sao đóng ngay trong cung
Engine bắt bộ phụ tinh trên tam phương (`cach-cuc.ts`, hàm `duCa`). Khi chấm cung gốc, chỉ tính bộ có **ít nhất
một sao đóng ngay trong cung**. Nguồn: *Hàm số* 737: "Các sao tọa thủ ở cung nào ảnh hưởng đến cung đó mạnh hơn
các sao chiếu vào cung đó." Mức "ít nhất một sao" là tôi tự đặt.

| Cách cục | Nhãn | Nguồn nguyên văn |
|---|---|---|
| Nhật Nguyệt tịnh minh | tốt | *Hàm số* 1775–1776, nhóm "CÁC CÁCH TỐT CỦA NHẬT, NGUYỆT": "Phú quý tột bực… Mệnh ở Mùi được Nhật ở Mão, Nguyệt ở Hợi chiếu: Ý nghĩa như trên." |
| Nhật Nguyệt hãm | xấu | *Hàm số* 1780–1781: "CÁC CÁCH XẤU CỦA NHẬT NGUYỆT: - Nhật Nguyệt hãm địa." |
| Khôi Việt, Xương Khúc, Tả Hữu, Long Phượng, Song Lộc, Đào Hồng | tốt | *Tử vi tổng hợp* 1405: "Có thể kể 18 cát tinh hỗ trợ. Đó là: Xương, Khúc, Tả, Hữu, Khôi, Việt, Khoa, Quyền Lộc, Đào, Hồng, Lộc Tồn, Quang, Quý, Thai, Tọa, Long, Phượng". |
| Không Kiếp | cả hai hãm: xấu; cả hai đắc: không tính | *Hàm số* 2756: "Nếu cùng đắc địa thì phú quý được một thời. Nếu cùng hãm địa cả thì rất nguy hiểm". Theo engine, Không và Kiếp luôn cùng đắc hoặc cùng hãm. |
| Hoả Linh | cả hai hãm: xấu; còn lại: không tính | *Hàm số* 2756 (câu trên), *Dưới mắt khoa học* 843 xếp vào lục sát. |
| Kình Đà | không tính | *Khảo luận* 1968: "bao giờ thì phái nào cũng chỉ có Kình hoặc Đà đắc địa mà thôi". Engine cũng vậy (`dosang.ts:50-51`): luật "cả hai hãm" không bao giờ xảy ra. Kình Đà vẫn tính ở lớp hạn qua sao lưu. |
| Khốc Hư | hãm: xấu; đắc: không tính | *Hàm số* 3831: "Bại tinh, Khốc Hư ở đâu đều làm xấu cung đó, trừ phi đắc địa". |
| Mã đầu đới kiếm | theo nhánh engine đã chọn | Đã duyệt ở phiên sửa độ sáng (16/10). |
| Hình Tướng Ấn | không tính | Sách gọi là **Binh** Hình Tướng Ấn (*Khảo luận* 2639), có Phục Binh; bộ trong engine thiếu sao này (`cach-cuc.ts:203`). Sửa bộ ở nhánh khung cách cục rồi mới gắn tốt. |
| Tuần, Triệt án ngữ | không tính ở việc A | Sách nói Tuần Triệt lúc làm nhẹ, lúc gây trở ngại (*Hàm số* 4236, 4250). Chỉ dùng ở việc C, ở vị trí sách nói rõ. |

**Luật Không Kiếp hãm.** Cung có Không Kiếp cùng hãm thì các bộ tốt trong cung không được kéo cung lên.
*Hàm số* 2745: "Kiếp Không hãm địa làm giảm sự tốt đẹp của cát tinh".

### A3. Chấm điểm cung, theo thứ tự
1. Cung **vô chính diệu**:
   - có Thái Dương, Thái Âm sáng cùng chiếu và không có nhãn xấu: **+1**. *Hàm số* 1777: "Mệnh vô chính diệu
     cũng Nhật Nguyệt sáng sủa hội chiếu Người rất thông minh, học một biết mười".
   - còn lại: **0** (chưa rõ, không chỉnh).
2. Có Không Kiếp cùng hãm: **−1**.
3. Phần chính tinh tốt, có ít nhất một bộ tốt, không có nhãn xấu: **+1**.
4. Phần chính tinh xấu, hoặc có nhãn xấu, và không có bộ tốt nào: **−1**.
5. Còn lại (kể cả có cả tốt lẫn xấu): **0**.

Luật cố ý chặt: phải có cả chính tinh sáng lẫn cát tinh ngay trong cung mới được +1. Sách chỉ nói Mệnh tốt "chế
giảm ít nhiều" cái xấu (*Tử vi tổng hợp* 309).

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
1. Việc A: cách chấm cung (A1–A3) và bảng cách cục.
2. Việc B: hai danh sách, bảng Mệnh–Phúc, ngoại lệ Không Kiếp.
3. Việc C: luật Tuần Triệt lợi địa, mốc 30 tuổi, các câu ghi sổ.
4. Luật gộp.
