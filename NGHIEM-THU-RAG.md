# Nghiệm thu kho tri thức

Trả lời bốn câu hỏi bằng số, không bằng cảm nhận:

1. Truy hồi có lấy đúng đoạn không?
2. Bài trả lời có thật sự dùng đoạn đó không?
3. Có kho thì hơn không kho ở chỗ nào?
4. **Bài có CHUYỂN HOÁ tri thức, hay chỉ chép lại sách?**

Câu thứ tư là câu dễ bị bỏ sót nhất, và là câu quan trọng nhất. Bám nguồn càng
chặt thì càng đẩy model về phía chép nguyên văn, mà chép nguyên văn là hỏng theo
một cách khác: đúng sách, đúng nguồn, và người đọc không hiểu gì. Yêu cầu là lấy
dữ kiện X rồi nói lại thành X' bằng lời thường, không phải "sách nói X nên luận
giải là X".

```bash
npx tsx scripts/eval-rag.ts                      # tầng 1, không gọi model, rẻ
npx tsx scripts/eval-rag.ts --sinh               # thêm tầng 2 và 4, gọi model
npx tsx scripts/eval-rag.ts --sinh --so-sanh     # thêm tầng 3
npx tsx scripts/eval-rag.ts --sinh --chi-tiet    # in cả đoạn lấy về và bài viết
```

Mã thoát khác 0 khi có tiêu chí trượt, nên dùng làm cổng chặn được.

---

## Bộ vàng

`lib/rag/bo-vang-rag.ts`, 12 câu: 10 câu có đáp án nằm trong kho, 2 câu đối chứng
âm nằm hoàn toàn ngoài phạm vi.

Nguyên tắc chọn câu, theo thứ tự ưu tiên:

1. **Tri thức phải đặc thù.** "Sao Tử Vi là đế tinh" thì model nào cũng nói được,
   nên nó không phân biệt được có kho hay không. "Cự Cơ đồng cung ở cung Bào thì
   có anh chị em dị bào, thường cùng mẹ khác cha" thì phải có sách mới nói đúng.
   Chỉ loại thứ hai mới đo được điều gì.
2. **Đáp án kiểm được bằng chuỗi**, không cần người đọc phán xét.
3. **Câu hỏi viết như người Việt hỏi thật.**

---

## Tiêu chí và mức đã đo

Đo ngày 18/09/2026 · kho 7.559 đoạn của 15 cuốn · embedding `text-embedding-3-small`
· model viết `gpt-4o-mini`.

### Tầng 1 — truy hồi

| Tiêu chí | Ngưỡng | Đo được |
|---|---|---|
| Đoạn mang đáp án nằm trong 6 đoạn cuối | ≥ 80% | **90%** |
| MRR | ≥ 0,55 | **0,695** |
| Mất hẳn, không truy hồi được | — | 1/10 |

### Tầng 2 — bám nguồn

| Tiêu chí | Ngưỡng | Đo được |
|---|---|---|
| Bài có trích nguồn | 100% | **100%** |
| Ý có gắn mã nguồn | — | **100%** |
| Trích trúng đúng đoạn mang đáp án | ≥ 50% | 70% |
| Đối chứng âm chối đúng | 100% | **2/2** |

Chỉ số "trích trúng đoạn" dao động mạnh: ba lượt liên tiếp cho 50%, 80%, 50%.
Nguyên nhân là `gpt-4o-mini` mỗi lượt trích một nguồn khác, dù bài vẫn đúng. Nên
ngưỡng đặt ở SÀN đo được, không ở trung bình — ngưỡng nằm giữa vùng dao động thì
lần đỏ lần xanh, và một cổng lúc đỏ lúc xanh thì cũng như không có.

### Tầng 4 — chuyển hoá chứ không chép

| Tiêu chí | Ngưỡng | Đo được |
|---|---|---|
| Bài chép từ 12 từ liên tiếp trở lên của nguồn | 0 | **0/10** |
| Bài còn sót chữ chuyên môn chưa dịch | 0 | **0/10** |
| Bài có nêu lực ngược | ≥ 90% | **10/10** |
| Bài qua cổng ngôn ngữ | ≥ 90% | **10/10** |

Chuỗi chép dài nhất trung bình **4,1 từ** — đúng bằng độ dài một tên sao kèm tên
cung, tức là mức không thể tránh. Không bài nào bê nguyên mệnh đề của sách.

---

## Tầng 3 — có kho so với không kho

Cùng model, cùng câu hỏi, chỉ tắt truy hồi. Hai ví dụ nói lên tất cả.

**"Thiên La Địa Võng nằm ở cung nào?"**

| | Trả lời |
|---|---|
| Có kho | "thường được liên kết với cung Thìn và Tuất" — **đúng sách** |
| Không kho | "Lá số không có thông tin về Thiên La Địa Võng, không thể xác định" — **không trả lời được** |

**"Linh Xương Đà Vũ là cách gì?"**

| | Trả lời |
|---|---|
| Có kho | "có thể gây ra những vấn đề trong cuộc sống cá nhân và công việc" — khớp sách |
| Không kho | "thường liên quan đến sự phát triển và biến đổi trong cuộc sống" — **sai, và nghe rất thuận tai** |

Đó là hai kiểu giá trị khác nhau của kho. Kiểu thứ nhất: không có kho thì không
trả lời được. Kiểu thứ hai nguy hơn: không có kho thì model vẫn trả lời, trôi
chảy, tự tin, và sai. Người đọc không có cách nào nhận ra.

---

## Những gì bộ đo này đã phát hiện

Bộ đo có giá trị khi nó tìm ra lỗi thật. Bốn lỗi tìm được ngay lần chạy đầu:

1. **Truy vấn từ khoá vứt mất chữ đặc trưng của câu hỏi.** Nó chỉ gom tên thực
   thể có trong từ điển, mà tên cách cục thì không có trong từ điển. Câu hỏi về
   "Linh Xương Đà Vũ" cho ra truy vấn "Mệnh Phúc Đức Thiên Di" — ba cung mà câu
   nào cũng có. Sửa xong: recall từ **50% lên 90%**, MRR từ 0,383 lên 0,695.

2. **Danh sách từ dừng bỏ dấu nuốt mất tên sao.** Bản vá đầu so từ dừng trên chữ
   đã bỏ dấu, nên "Đà" thành "da" rồi trùng với "đã", "Cơ" thành "co" rồi trùng
   "có". Tiếng Việt dấu phân biệt nghĩa; danh sách từ dừng phải có dấu.

3. **Tên cung làm loãng truy vấn từ khoá.** Nhánh này dùng ngữ nghĩa HOẶC, nên
   thêm ba cung phổ biến vào một câu đã đủ đặc trưng là đẩy đoạn đúng ra khỏi 15
   kết quả đầu. Giờ chỉ thêm tên cung khi câu hỏi không tự mang đủ chữ.

4. **Câu ngoài phạm vi vẫn được luận giải.** Hỏi về Bitcoin thì hệ thống suy từ
   cung Tài Bạch ra nhận định đầu tư — lời khuyên tài chính đội lốt luận giải.
   Hỏi cách nấu phở thì nó bịa ra "khả năng ẩm thực" từ lá số. Đã thêm luật tách
   hai loại: hỏi về một đối tượng cụ thể thì chối đối tượng rồi chuyển sang cách
   người này ra quyết định; hỏi chuyện hoàn toàn ngoài đời sống cá nhân thì chối
   hẳn và không bắc cầu sang luận tính cách.

Ngoài ra chữ "tọa thủ" từng lọt ra mặt trước. Đã thêm nhóm chữ chuyên môn vào
cổng ngôn ngữ và vào danh sách cấm của chuẩn ngôn ngữ dùng chung, nên mọi bề mặt
đều được, không riêng phần đo.

---

## Điều bộ đo này KHÔNG nói được

Nói rõ để không ai đọc quá con số:

- **Không đo được tính đúng của luận giải.** Nó đo bài có bám nguồn và có theo
  luật viết hay không. Một bài bám đúng nguồn vẫn có thể luận sai.
- **10 câu là ít.** Đủ để bắt lỗi hệ thống, không đủ để nói "chất lượng 90%".
- **Chỉ đo tiếng Việt và một lá số mẫu.**
- **Mọi con số ở tầng 2 và 4 đều phụ thuộc model đang chạy.** Đổi model là phải
  đo lại, đừng mang số cũ sang.
- **"Nêu được chi tiết đặc thù" chỉ 20-40%.** Đây là chỉ số yếu nhất: model lấy
  đúng đoạn nhưng thường diễn đạt lại ở mức khái quát thay vì nêu đúng chi tiết
  đặc thù. Đó là trần của `gpt-4o-mini`, không phải lỗi của đường đi.

---

## Khi nào chạy lại

| Vừa đổi gì | Chạy gì |
|---|---|
| Nạp thêm sách vào kho | `eval-rag.ts` (tầng 1) |
| Sửa planner, truy hồi, xếp hạng | `eval-rag.ts` + `eval-planner.ts` |
| Sửa prompt hoặc chuẩn ngôn ngữ | `eval-rag.ts --sinh` |
| Đổi model hoặc đổi nhà cung cấp embedding | `eval-rag.ts --sinh --so-sanh`, rồi cập nhật lại bảng số ở trên |
