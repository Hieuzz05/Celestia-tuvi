# CEL-186 Vé B: Focused Chat. PHƯƠNG ÁN bản 2 (đã qua phan-bien, danh-gia-tac-dong và soat-chi-phi)

> **TRẠNG THÁI (03/10/2026, cập nhật tối):** chủ dự án **mở khoá code song song** với fix `noi_dung_ai`.
> - ĐƯỢC: code Focused, cờ, lớp `DoiTuongCauHoi`, contract theo ý định, câu code-owned, chip giữ chủ đề, validator, retry/502/hoàn lượt, DEEP, test offline/hồi quy, test cờ OFF giữ STANDARD, build/tsc/lint/CI.
> - CHƯA ĐƯỢC (tới khi fix `noi_dung_ai` gộp main): bật `CELES_FOCUSED_CHAT=1` trên Preview, eval model thật 30 ca, Barnum model thật, coi output Preview là UAT, gộp Vé B vào main.
> - Fix gộp main → trên nhánh B `git merge origin/main` (không rebase nếu đã push) → chạy lại toàn bộ hồi quy → bật env Preview riêng nhánh → eval 30 ca → Barnum 6×6 → celes-domain, bien-tap-vi, qa, soat-tai-lieu → UAT chủ dự án → mới trình gộp.
> - Không sửa vùng namespace/đệm của `noi_dung_ai`; cần chạm cùng tệp với nhánh fix thì DỪNG và báo trước.
>
> **QUYẾT ĐỊNH CỦA CHỦ DỰ ÁN (03/10/2026). Ở đâu trong tệp nói khác thì phần này thắng:**
>
> | Cờ | Quyết định |
> |---|---|
> | 1 | Duyệt: sửa nguồn căn cứ chỉ trên đường Focused. |
> | 2 | Duyệt: chủ đề chip kế thừa ở server. |
> | 3 | Duyệt theo câu chữ chủ dự án gửi kèm (chờ nhận đủ). |
> | 4 | Câu F2 tạm thời **vẫn trừ lượt** trong Vé B để không mở rộng phạm vi hạn mức. Ghi nợ UX cho sau. |
> | 5 | **Bỏ chip "Tháng nào đáng chú ý hơn?" và bỏ khuôn D′.** Đã biết engine không dò từng tháng mà vẫn đưa chip, rồi trả câu giới hạn, thì người dùng đi vào ngõ cụt. Chip của D chỉ còn "Năm nay thì sao?" và "Sang năm thì sao?". |
> | 6 | Duyệt: DEEP vẫn tuân C/D/E/F2. |
> | 7 | Sau khi sửa xong lỗi đệm, AI tự đặt `CELES_FOCUSED_CHAT=1` làm **env Preview riêng cho nhánh** `viec/cel-186-focused-chat`. Không đặt cho toàn bộ Preview. |
> | 8 | Chọn (b): dùng model thật, **trần cứng $2**, **không tự chuyển sang model miễn phí khác**. Eval phải ghim một provider/model và tắt chế độ lùi. |
> | 9 | Chỉ bỏ luật độ dài và Dấu ấn của **STANDARD cũ**. Focused **vẫn phải tuân** hợp đồng mới: NORMAL 2–4 câu, khoảng 55–120 âm tiết. |
> | 10 | Coi như Preview và Production **dùng chung Supabase** cho tới khi chứng minh được điều ngược lại. Vì vậy **chưa bật Focused trên Preview** trước khi sửa xong lỗi đệm. |
>
> **Sửa S1 theo chủ dự án:**
> - **Không** thêm `nguoiDuocHoi` hay `ep` vào `KeHoachTruyVan` dùng chung.
> - Thay vào đó, tách một **lớp phân tích riêng của Focused** (`lib/rag/focused/nguoi-duoc-hoi.ts`). Lớp này đọc câu hỏi cùng kế hoạch, rồi trả về người được hỏi và cung lục thân.
> - Dựng lại kế hoạch cho cung lục thân cũng nằm trong `focused/`. Cách làm: gọi các hàm planner có sẵn với đầu vào đã chỉnh, không đổi chữ ký hàm dùng chung.
> - Nếu buộc phải đổi hợp đồng planner dùng chung thì phải nâng `PHIEN_BAN_PLANNER` cho đúng, và chủ dự án duyệt lại.
> - Theo đó, mục 1 và mục 13.1 bên dưới coi như đã được thay.

## QUYẾT ĐỊNH CHI TIẾT CỦA CHỦ DỰ ÁN (03/10/2026). Thắng mọi mục bên dưới

**Trạng thái:** đã duyệt thiết kế, đang tạm dừng cho tới khi `[SỬA LỖI] noi_dung_ai lẫn môi trường` được nghiệm thu và merge main.

**Khi mở khoá, làm theo thứ tự:**
1. researcher;
2. cập nhật phương án theo các quyết định này;
3. phan-bien nhanh **chỉ phần thay đổi**;
4. danh-gia-tac-dong;
5. viết code.

Không hỏi lại cờ #1–#10, trừ khi gặp chặn mới.

### Kiến trúc: người được hỏi (bắt buộc)
- Tách thành lớp Focused riêng (`DoiTuongCauHoi` / `FocusedContext`), tính sau hoặc song song với planner dùng chung.
- Hợp đồng planner STANDARD không đổi, nên không nâng `PHIEN_BAN_PLANNER` và không xả đệm.
- Nếu buộc phải thêm trường vào `KeHoachTruyVan`, đó là đổi hợp đồng planner. Khi đó phải:
  - đánh giá ảnh hưởng tới phiên bản;
  - đánh giá phạm vi đệm bị xả;
  - không được mặc định "không cần nâng phiên bản".

### Từng cờ
- **#1:** STANDARD giữ nguyên để rollback được. Khi bật Focused, câu về con / cha mẹ / anh em phải lấy đúng cung và đúng người được hỏi.
- **#2:** câu mới tự xác định được chủ đề thì dùng chủ đề của câu mới. Chỉ kế thừa khi câu chip không mang đủ chủ đề. Dựng lại toàn bộ kế hoạch từ đầu vào mới cộng ngữ cảnh, không sửa lẻ từng trường của kế hoạch cũ.
- **#3, câu do mã viết.** Theo tinh thần dưới đây; được dùng quy ước sẵn có nếu tương đương:
  - **Khi nào:** "Celes chưa có đủ dữ kiện để chọn chính xác một năm hoặc tháng tốt nhất mà không so từng mốc. Với lá số hiện tại, Celes có thể đọc một năm hoặc một tháng cụ thể nếu bạn chọn mốc đó." Không bịa mốc; không coi "sắp tới" là một năm cụ thể.
  - **A hay B:** "Lá số hiện cho Celes đọc được bối cảnh của quyết định này, nhưng chưa đủ để kết luận một phương án chắc chắn tốt hơn phương án còn lại." Chip tách từng phương án. Không tuyên bố bên thắng.
  - **Vận riêng người khác:** "Lá số này là của bạn, nên Celes không dùng nó để kết luận vận riêng của người khác. Celes vẫn có thể đọc mối quan hệ giữa hai người hoặc phần liên quan trực tiếp tới bạn." Không gọi model.
  - **Tháng đã qua (N2):** "Bạn đang hỏi tháng 3 âm lịch năm 2026. Mốc này đã qua so với thời điểm hiện tại, nên phần dưới là đọc lại xu hướng của tháng đó, không phải dự báo sắp tới."
  - **Cuối năm (N4)**, áp khi tháng âm 11–12, hỏi "gần" và chỉ có căn cứ năm hiện tại: "Phần này đang đọc quãng từ hiện tại đến hết năm âm này. Phần sau Tết thuộc năm mới và cần được xem riêng." Kèm chip sang năm.
  - **Tháng nhuận:** khác bản 2, **không** tự đọc theo tháng chính. Câu: "Năm này có cả tháng X thường và tháng X nhuận. Cần xác định đúng tháng trước khi Celes đọc nguyệt hạn." Mã đặt hai chip "Tháng X" và "Tháng X nhuận"; model không tự chọn.
- **#4:** vẫn trừ lượt. Ghi nợ sản phẩm riêng, không mở rộng CEL-186 sang thiết kế hạn mức.
- **#5:**
  - Bỏ chip "Tháng nào đáng chú ý hơn?" và bỏ khuôn D′.
  - Chỉ đưa chip mà engine trả lời được: "Tháng này thì sao?", "Tháng tới thì sao?", hoặc một tháng cụ thể nếu ngữ cảnh có.
  - Scanner chọn tháng tốt nhất để ticket sau.
- **#6:** DEEP chạy trên kiến trúc Focused, chỉ khác ở độ sâu và độ dài. Giữ nguyên: không quyết hộ, không bịa mốc, không gán vận người khác, căn cứ thật, lớp phủ an toàn.
- **#7:** sau khi lỗi đệm đã merge main:
  - AI tự đặt `CELES_FOCUSED_CHAT=1` **chỉ cho Preview của nhánh** `viec/cel-186-focused-chat`;
  - không đặt cho toàn bộ Preview, không đặt Production;
  - đặt xong thì redeploy, rồi báo alias của nhánh cùng HEAD.
- **#8:** tổng chi cho toàn bộ eval Vé B tối đa **$2**.
  - Dùng đúng model dự kiến chạy Production.
  - Không thay bằng model miễn phí khác, không tự lùi sang provider hay model khác.
  - Đặt trần cứng; vượt trần thì dừng và báo.
  - 30 ca và Barnum 6×6 là đủ nếu đạt độ phủ. Không cần dùng hết 1,8 triệu token.
- **#9:** Focused bỏ Dấu ấn và luật hình dạng / độ dài của STANDARD cũ, rồi áp hợp đồng độ dài mới.
  - NORMAL: 2–4 câu, 1–2 đoạn, khoảng 55–120 âm tiết, trả lời thẳng ngay câu đầu.
  - SENSITIVE: không cắt cứng. DEEP: được dài hơn.
  - Giữ `KHOI_GIONG_CELES`, chuẩn ngôn ngữ Celes, căn cứ thật và các validator cần thiết. Không dùng `DAN_LUAN`.
- **#10:** coi như Preview và Production dùng chung Supabase. Sau khi sửa đệm:
  - đệm đã cách ly;
  - nhưng lịch sử chat, vết và hạn mức có thể vẫn là dữ liệu Production;
  - không gọi Preview là môi trường dữ liệu độc lập.

### Eval bổ sung bắt buộc (ngoài 30 ca + Barnum)
1. "con tôi năm nay thế nào?"
2. "con nghĩ công việc của con thế nào?" ("con" là cách xưng hô)
3. "bố tôi sức khỏe thế nào?"
4. "bản thân tôi…" (không được khớp "bạn thân")
5. Chip tình cảm → "Sang năm …" → vẫn `tinh-cam`
6. Chip công việc → "Sang năm …" → vẫn `su-nghiep`
7. Tháng đã qua
8. Tháng âm 11–12 + "sắp tới"
9. Tháng nhuận
10. Không còn câu có căn cứ → thử lại 1 lần → vẫn lỗi thì 502 + hoàn lượt

Thêm một bài hồi quy chứng minh: tắt cờ thì STANDARD không đổi.

- Nhánh: `viec/cel-186-focused-chat`, tách từ main `10e351f`.
- Cỡ: **Lớn**. Đổi hợp đồng trả lời, prompt, schema đầu ra, thêm cờ.
- Nguồn: brief Vé B mục 2–15, N1–N4, researcher, celes-domain, phan-bien. Đối chiếu thêm `docs/thiet-ke/CEL-186-quick-answer.md` mục 19 (trên nhánh quick).

## 0. Nguyên tắc

1. **Bật cờ thì mọi lượt chat đi đường Focused, kể cả DEEP.** Ở chế độ DEEP, chỉ trần độ dài được nới. Các guard C/D/E/F2, câu do mã viết và nguồn căn cứ đã sửa vẫn áp nguyên. Đường STANDARD cũ chỉ chạy khi cờ tắt. Khi đó prompt, gói, hướng nghiêng và văn cuối phải giống production từng byte; mục 7 có test chụp mẫu chứng minh.
2. **Không xả đệm.** Không thành phần nào của `PHIEN_BAN_CHU` đổi.
   - Planner chỉ được **thêm trường mới** (`nguoiDuocHoi`) và **thêm tham số tuỳ chọn** (`ep`).
   - Mọi trường cũ, trên bộ vàng 100 câu cộng 120 câu cố định, phải giữ 0 diff. Nhờ vậy không phải nâng `PHIEN_BAN_PLANNER`.
3. **Một nơi nhận diện.** Nhận diện người được hỏi đặt trong planner (`nguoiDuocHoi`), không đặt ở một bộ phân loại thứ hai. `focused/phan-loai.ts` chỉ quyết khuôn, đọc từ kế hoạch.
4. **Mã chốt, model chỉ viết lời.**
   - Phần mã quyết: hướng, chiều câu chốt, câu giới hạn, câu từ chối, chip cố định, chủ đề của chip.
   - Câu do mã viết **được miễn guard**. Câu do model viết thì mọi câu đều qua guard.
5. **Không giữ câu lỗi.** Câu hỏng thì bỏ. Hết câu có căn cứ thì thử lại 1 lần. Vẫn hỏng thì trả 502 và hoàn lượt.
6. **Port có chọn lọc từ nhánh quick:**
   - lấy `nhomCuaHuong`, `cumChoChuDe`, `soatCauChot`, `docChieu`, `KHOI_GIONG_CELES`;
   - lấy phần chủ đề nặng và `nhieuVe`;
   - lấy `ngoai-tam` (danh tính bạn đời);
   - `xinSau` viết lại, chỉ khớp theo cụm.

## 1. Planner: thêm trường `nguoiDuocHoi` (sửa S1, S6)

`nguoiDuocHoi?: { vai: 'vo-chong'|'nguoi-yeu'|'con'|'bo-me'|'anh-chi-em'|'ban-be'|'cap-tren'; cung: TenCung; loai: 'quan-he'|'van-rieng' }`

- **Chỉ kích hoạt khi có định danh sở hữu**, viết có dấu hoặc không dấu:
  - Dạng "bố/mẹ/con/anh/chị/em/vợ/chồng/sếp + tôi/mình/em/của tôi".
  - "bạn thân tôi", "người yêu tôi", "con gái/trai tôi".
  - Đại từ xưng hô trần ("con năm nay…", "em có người yêu không", "anh có nên…") là **người hỏi**, không kích hoạt.
- **Ánh xạ cung:** vợ/chồng/người yêu → Phu Thê · con → Tử Tức · bố/mẹ → Phụ Mẫu · anh/chị/em → Huynh Đệ · bạn bè/đồng nghiệp → Nô Bộc · sếp → Phụ Mẫu (người đi trước).
- **Phân `loai`:**
  - `quan-he` khi câu nói về quan hệ hai người: hợp, gần, xa, đỡ, giúp, xung đột, va chạm, hiếu, nhờ, "với tôi", "có thương tôi"…
  - `van-rieng` khi người kia là chủ ngữ của chuyện vận: thăng chức, giàu, đỗ, cưới, bệnh, sức khoẻ, hạn, có con, mất…
  - Không rõ thì `quan-he`. Câu `quan-he` vẫn chịu guard F1, nên an toàn hơn câu `van-rieng`: lỡ trả về `quan-he` sai thì chỉ nói về mối quan hệ, không gán vận cho ai.
- **Lỗi "bạn thân" trùng "bản thân":** bí danh Mệnh `ban than` bỏ dấu ra trùng "bạn thân". Xử lý bằng cách so trên chuỗi có dấu trước. Phần không dấu chỉ lấy "ban than toi" cùng ngữ cảnh "phan / choi / giup".
- **Planner không tự dùng trường mới.** `chuDe` và `cungLienQuan` cũ giữ nguyên, nên đường cũ không đổi gì.
- **Tham số mới `ep?: { chuDe?, cungDau? }`** để Focused dựng lại **toàn bộ** kế hoạch với cung lục thân đứng đầu. Gồm cả `truyVan`, `cumTuKhoa`, và `tenCachCuc` lấy theo cung đó. Không vá lẻ từng trường.
- **Test:** đủ 14 câu biên ở mục F4 của domain, chạy qua `lapKeHoach` thật (không tiêm chủ đề). Có thêm các ca âm:
  - "con năm nay có lấy được chồng không ạ" → không có `nguoiDuocHoi`, khuôn A.
  - "em có nên nghỉ việc không" → khuôn C.

## 2. Phân khuôn: `lib/rag/focused/phan-loai.ts` (hàm thuần, đọc kế hoạch)

| Khuôn | Khi nào | Câu đầu do ai viết |
|---|---|---|
| **A** có/không | `co-khong`, không có `nguoiDuocHoi` | Model viết, qua guard chiều. Trượt thì dùng `cauChotDuPhong`. |
| **B** mô tả có mốc | `mo-ta` + gan/nam/thang | Model viết, giọng xu hướng ("quãng này phần … đang mở / vướng"). |
| **C** quyết định | `quyet-dinh` | Model viết, nói bối cảnh. Guard C2 chặn mọi lời khuyên hành động. |
| **D** khi nào | `thoi-diem`, không có năm/tháng mục tiêu | **Mã** viết câu giới hạn. Model viết 1–2 câu về năm hiệu lực. |
| **D′** tháng nào | chip do mã đặt, "Tháng nào đáng chú ý hơn?" (khớp nguyên văn), hoặc "tháng nào … tốt / đáng chú ý" | **Mã** viết: "Celes chưa so từng tháng với nhau…". Model đọc tháng âm hiện tại. Chip "Tháng tới thì sao?". |
| **E** A hay B | Hai vế động từ hành động nối bằng "hay / hoặc / hay là" | **Mã** viết câu giới hạn. Model viết bối cảnh. Guard C2 và E1. |
| **F1** quan hệ | `nguoiDuocHoi.loai = quan-he` | Model viết, đọc cung lục thân (dựng lại kế hoạch với `ep`). |
| **F2** vận riêng | `nguoiDuocHoi.loai = van-rieng` | **Mã viết toàn bộ, không gọi model.** |
| **G** không hướng | `giai-thich`, `tra-cuu`, `mo-ta` không mốc | Model viết 1 câu chính và 1–2 câu có căn cứ. |

- **Thứ tự chạy:** `lapKeHoach` (theo luật) → nếu là F2 thì **trả lời ngay**, trước `lapKeHoachDayDu`. Nhờ vậy F2 không gọi model phân loại.
- **E, nhận diện:**
  - Có bảng động từ hành động: ở lại, chuyển, nghỉ, đổi, mua, thuê, bán, giữ, cưới, chờ, học tiếp, đi làm, kinh doanh…
  - Có bảng loại trừ: "hay không", "hay chưa", "có … hay không", "hay là không", và "hay" mang nghĩa "thú vị".
  - Có test âm.
- **`loaiSuKien`**, theo luật A2 của domain:
  - Bảng từ có cả tiếng lóng: có bồ, có ny, thoát ế, lên lương, trúng, có bầu, mất việc, bị cắm sừng…
  - Không rõ thì xếp `trung-tinh`. Eval đo tỉ lệ câu A rơi vào nhóm này, ngưỡng ≤ 10%.
- **SENSITIVE** là lớp phủ lên khuôn: giọng COMPANION, lời miễn trừ do mã, không tinh nghịch, không cắt theo 120 âm tiết (brief mục 6). CRITICAL và tiên lượng vẫn chặn ở route như cũ.
- **DEEP** chỉ bật khi khớp cụm (brief mục 6). Có test âm cho "kỹ sư", "phân tích dữ liệu", "làm kỹ thuật". DEEP = cùng khuôn, cùng guard, trần độ dài khoảng 8 câu / 3 đoạn, vẫn không có tiêu đề.

## 3. Kế thừa chủ đề của chip (N3, sửa S3)

1. **Chip do mã đặt** (D, D′, E, F2, N4, N2, chip sang năm) được nhận diện bằng **nguyên văn nhãn**.
   - Bảng nhãn → hành động là tất định. Ví dụ "Sang năm <Can Chi> thì sao?" cho ra năm sau, cộng khuôn và chủ đề của lượt trước.
   - Chip F2 hỏi quan hệ với người đó thì ra F1, đúng cung lục thân.
2. **Chip do model viết, hoặc câu ngắn** (≤ 6 âm tiết):
   - **Chỉ kế thừa khi chính câu đó ra `tong-quan`** và không có `nguoiDuocHoi`. Chip đã mang chủ đề riêng ("Còn tiền bạc thì sao?") thì giữ chủ đề của nó.
   - Nguồn kế thừa là tin **người dùng gần nhất** trong `lichSu` mà khi chạy lại `lapKeHoach` và phân khuôn thì ra chủ đề cụ thể hoặc có `nguoiDuocHoi`.
   - Từ tin đó lấy chủ đề và cung (gồm cả cung lục thân), rồi **dựng lại toàn bộ kế hoạch** qua `lapKeHoach({…, ep})`. Trục thời gian vẫn lấy từ câu chip.
3. **Không đổi client.** Web và app đều đã gửi `lichSu` và `tuChip`.
4. **Test:**
   - tình cảm → "Sang năm thì sao?" vẫn là `tinh-cam`;
   - công việc → "Ở lại thì sao?" vẫn là `su-nghiep`;
   - F2 "Anh tôi có giàu không" → chip quan hệ → F1 Huynh Đệ (không phải Tài Bạch);
   - "Còn tiền bạc thì sao?" phải đổi sang `tai-chinh`.

## 4. Sửa nguồn căn cứ (chỉ trên đường Focused, qua tham số `focused`)

| # | Sửa |
|---|---|
| 4.1 | `tinhNghiengVe` nhận `cungChinh`. Có `nguoiDuocHoi` thì lấy cung lục thân, không đi đường `gia-dao` sang Điền Trạch nữa. |
| 4.2 | Chính tinh hãm lấy nét theo đúng độ sáng. Mốc `trung` (Lưu Thái Tuế) không vào phía thuận hay phía cản. |
| 4.3 | Khi `can-bang`, top-N giữ ít nhất 1 mốc thuận và 1 mốc cản. |
| 4.4 (N1) | Phạm vi `thang` thì thêm `dai-van` và `luu-nien` vào `lopHan` ngay trong tra-loi (planner không đổi). `khoiNghiengVe` chỉ in lớp nào có F### trong gói. |
| 4.5 (N1) | `boi-canh-la-so.ts` thêm F### "lưu tinh năm ở cung đang hỏi" cho câu năm/tháng. Gồm 9 lưu tinh engine có, không có lưu Tứ Hoá. |

## 5. Prompt và schema: `focused/prompt.ts`

- **Cấu trúc prompt:** phần SYSTEM dùng chung, cộng `KHOI_GIONG_CELES`, cộng khối theo khuôn.
  - **Không dùng** `THEO_Y_DINH['quyet-dinh' | 'thoi-diem']` cũ, kể cả ở DEEP.
  - Tinh nghịch: mặc định TẮT. Chỉ bật khi `CELES_TINH_NGHICH=1` và cổng cho phép: NORMAL, không thuộc C/E/F, lượt trước không nặng.
- **Schema đầu ra:**
  ```json
  { "cauChot": "…", "chieuCauChot": "thuan|ngang|vuong",
    "cau": [ { "noiDung": "…", "maDuKien": ["F012"], "phia": "thuan|can|nen" } ],
    "goiYTiep": ["…"] }
  ```
  - Đọc bằng `docFocused`.
  - D, D′, E: mã giữ câu đầu.
  - A: brief mục 4 yêu cầu câu 4 là lực giữ lại "nếu thật cần", nên tối đa 1 câu, không bắt buộc.
- **Mốc do mã tính sẵn rồi đưa vào prompt:** năm âm và Can Chi; "tháng N âm (khoảng dd/mm–dd/mm)"; cờ "tháng đã qua"; cờ "còn k tháng âm"; cờ "sau Tết đổi đại vận".
- **maxTokens:** giữ ngân sách 6000 như đường cũ. Lý do: token suy nghĩ trừ vào cùng ngân sách, đã có ghi chú ở tra-loi.ts:456-465. Không hạ xuống 1200.

## 6. Guard: `focused/kiem.ts` (hàm thuần, chỉ áp cho câu model viết)

1. **Whitelist tên (sửa S2).**
   - Tập cho phép mặc định = tên có trong `goi.duKien`, cộng tên có trong câu hỏi khi câu thuộc `tra-cuu`.
   - **Câu chốt** của A/B/C khi có `nghieng` thì chỉ được dùng tên thuộc **giao** của tập trên với `dauMoc`.
   - **Bộ quét tên riêng của Focused**, không dùng lại `nhanDangThucThe`. Nó nhận:
     - đủ "Lưu + 9 lưu tinh";
     - "Lưu Hóa/Hoá …" → luôn trượt (R0.2);
     - tên ghép Tả Hữu, Xương Khúc, Không Kiếp, Kình Đà, Song Lộc, Khôi Việt, Hình Riêu, Long Phượng, Thai Tọa;
     - Tuần, Triệt (từ đứng riêng);
     - "Phúc Đức": coi là tên sao nếu sao này có trong gói, nếu không thì coi là tên cung và trượt.
   - **Giới hạn đã biết:** guard kiểm **tên**, không kiểm **thuộc tính** (sao ở cung nào). Thuộc tính do celes-domain đọc trên kết quả eval. Báo cáo sẽ ghi "100% tên có trong gói", không ghi "100% đúng".
2. Mặt trước sạch: không tên cung, không jargon hay giọng báo cáo. Dùng lại danh sách sẵn có cộng `CUM_AI` và `RO_RI_RAG`.
3. Không phán quyết: chặn `CAU_PHAN_QUYET`, "chắc chắn", "nhất định", "sẽ không", "không bao giờ", "100%".
4. Không khuyên, không chọn (C2 và E1): chặn "nên / đừng / hãy + hành động", "thời điểm vàng", "nghiêng về [hành động]", "Celes khuyên", "A hơn / chọn A".
5. G1: khuôn G, hoặc `nghieng = null`, thì cấm "nghiêng về…".
6. D1 mở rộng: không nêu năm nào khác `namHieuLuc`, không nêu **tháng** nào khác `thangHieuLuc`, không nêu tuổi ngoài cận đại vận có trong gói.
7. N2: tháng đã qua thì cấm "sẽ", "sắp", "tới đây".
8. Câu chốt:
   - chiều phải khớp `huong` (sau khi đảo theo `loaiSuKien`);
   - mức chữ phải khớp mức nghiêng;
   - trượt thì dùng `cauChotDuPhong`.
9. Cân bằng: `can-bang` phải còn ít nhất 1 câu căn cứ thuận và 1 câu căn cứ cản. Hướng khác: 1 căn cứ mạnh, tối đa 1 lực ngược.
10. **Độ dài (đúng brief):**
    - NORMAL 2–4 câu, **tính cả câu do mã viết**. Trần 120 âm tiết. Vượt thì bỏ câu không có căn cứ trước. Vẫn vượt 140 thì thử lại.
    - Sàn 55 âm tiết chỉ đo trong eval.
    - SENSITIVE không cắt. DEEP trần khoảng 8 câu.
11. **Jargon:** nếu câu chỉ trượt vì jargon thì chạy `suaCauTiengLong` **trên đúng câu đó**, rồi guard lại. Còn trượt thì bỏ câu.
12. **Câu mở hỏng ở G:** đẩy câu có căn cứ hợp lệ đầu tiên lên đầu. Hết câu thì thử lại, rồi 502.
13. **Chip:**
    - 2–3 chip;
    - bỏ chip hỏi tên/họ, chip hỏi vận riêng người khác, chip ra lệnh;
    - bỏ chip trùng câu vừa hỏi hoặc trùng chip lượt trước. Đây là cơ chế "đi sâu một lớp": prompt yêu cầu, guard chặn chip lặp;
    - D, D′, E, F2, N4: chip do mã đặt. N4: chip "Sang năm <Can Chi> thì sao?" đứng đầu.

## 7. Câu do mã viết: `focused/cau-ma.ts` (bản nháp, cần duyệt chữ, cờ ③)

**`cauChotDuPhong`** = mốc + phần đời + khung theo mức + **1–2 tên dauMoc kèm nghĩa đời thường** (domain A5, chống Barnum). Ví dụ khuôn A, mức `thuan-nhe`:

> "Từ giờ đến hết năm Bính Ngọ, chuyện tình cảm nghiêng về phía có, nhưng chưa hẳn: Hồng Loan năm nay chiếu vào phần này, dễ có người để ý, còn Đà La làm mọi thứ đi chậm."

Năm mức × ba loại sự kiện:
- mong muốn: nghiêng rõ về có → … → nghiêng rõ về chưa;
- chuyện xấu: đảo chiều, "nghiêng về phía khó xảy ra";
- trung tính: chỉ nói bối cảnh "phần … đang mở / vướng".

**Các câu giới hạn:**
- **D:** "Celes chưa dò từng năm để chỉ đúng năm cho chuyện này, nên không đoán một con số. Đọc được rõ nhất là quãng {moc}:"
  Chip: "Năm nay thì sao?" · "Sang năm thì sao?" · "Tháng nào đáng chú ý hơn?"
- **D′:** "Celes chưa so từng tháng với nhau để chọn ra tháng đẹp nhất. Điều đọc được là tháng {N} âm này (khoảng …):"
  Chip: "Tháng tới thì sao?"
- **E:** "Lá số cho thấy phần đời này đang thuận hay vướng, chứ không đặt hai lựa chọn lên bàn cân để chọn hộ bạn."
  Chip lấy theo hai vế người dùng gõ; không tách được thì dùng chip mặc định.
- **F2:** đổi ngôi trước khi lắp câu ("bố tôi" → "bố bạn"). Năm biến thể:
  - công việc / thăng tiến;
  - học hành / đỗ đạt;
  - tiền bạc;
  - sức khoẻ / hạn — không nói gì về bệnh hay sống chết;
  - chung (cưới hỏi, mọi chuyện khác).

  Mẫu: "Chuyện {việc} của {bố bạn} phải đọc trên lá số của chính {ông/bà/người ấy}. Lá số của bạn chỉ cho thấy mối gắn bó giữa hai người."
  Chip:
  - "Tôi với {bố} có hợp nhau không?" → đi khuôn F1;
  - nếu là vợ/chồng/người yêu thì `loiDi` dẫn sang Kết nối (nối hai lá số).
- **N4:** "Năm {CanChi} chỉ còn khoảng {k} tháng âm, nên điều dưới đây đọc cho quãng từ giờ đến hết năm ấy." Nếu sang năm đổi đại vận thì thêm: "Sau Tết bạn bước sang một quãng mới, Celes sẽ đọc riêng khi bạn hỏi."
- **N2:** "Tháng {N} âm năm nay (khoảng …) đã qua, nên đây là nhìn lại chứ không phải dự báo:"
  Câu không nêu năm thì thêm chip "Tháng {N} năm sau thì sao?".
- **Tháng nhuận:** "Năm nay có tháng {N} nhuận; Celes đọc theo tháng {N} chính."
- **A6:** "Câu này Celes chưa đủ căn cứ để nói nghiêng về phía nào, nhưng có một điều đọc được rõ:"

## 8. Route và vết (sửa phần "route gần như không đổi")

- Tra-loi đường Focused trả về `coCauTruc` dạng tối thiểu: `goiYTiep`, `ketLuan`, `yChinh` lấy từ `cau`. Nhờ vậy route đọc chip và căn cứ cho admin như cũ.
- F2: `kq.provider = 'ma'`, `model = 'focused-f2'`. `chotCauHoi` ghi nhãn đúng.
- `phienBanHienTai` thêm `focused: khuon|null` và `PHIEN_BAN_FOCUSED`. Bản ghi này chỉ đi vào vết, không đi vào khoá đệm.
- Vết cho eval và admin ghi: bản thô, bản sau guard, bản cuối, câu nào bị bỏ và vì sao, có dùng câu dự phòng không, số lần thử lại.

## 9. Test và eval

**Offline, đưa vào CI: `scripts/test-focused.ts`**
- **Cờ OFF giữ nguyên:** chụp mẫu `chonBoiCanh`, `dungGoiBangChung`, `tinhNghiengVe`, `khoiNghiengVe`, `dungPromptCoCanCu` với `focused` tắt trên 60 lá số đóng băng × 6 câu. So với main phải trùng từng byte. Thêm một kiểm: `PHIEN_BAN_CHU` không đổi.
- **Planner:** `nguoiDuocHoi` đủ 14 câu biên + ca âm. Bộ vàng 100 câu và 120 câu cố định giữ 0 diff ở các trường cũ.
- **Phân khuôn:** khoảng 90 câu, gồm câu âm cho DEEP, E, F2.
- **`loaiSuKien`** có tiếng lóng.
- **Guard:** mỗi luật có ít nhất 1 ca qua và 1 ca trượt. Thêm 2 nhóm ca:
  - G và A6 vẫn giữ được câu có tên;
  - câu do mã viết được miễn guard.
- **Bộ quét tên:** "Lưu Hóa Kỵ" trượt; Tả Hữu, Tuần, "Phúc Đức" là sao hay cung.
- **`cauChotDuPhong`:** 5 mức × 3 loại, và luôn chứa tên dauMoc.
- **N2, N4, tháng nhuận:** chạy với mốc tháng âm tiêm vào (tháng 3 khi đang tháng 8; tháng 11 và 12).
- **N3:** 4 ca ở mục 3.
- **Nguồn căn cứ:** các sửa 4.1–4.5 trên lá số đóng băng.

**Model thật: `scripts/eval-focused.ts`** — dùng lá số đóng băng, không có dữ liệu người dùng
- **30 ca:**
  - 1 câu đích danh "sắp tới tôi có người yêu ko? tương lai gần";
  - 5 câu canonical còn lại;
  - A ×2 (chuyện mong muốn / chuyện xấu);
  - B gan;
  - C ×2, trong đó 1 câu "nghỉ việc";
  - D; D′; năm cụ thể; tháng đã qua; tháng 11 âm gan (tiêm mốc);
  - E;
  - F1 ×2;
  - F2 ×2 (không gọi model);
  - xưng "con / em" về chính mình;
  - SENSITIVE ×2;
  - chuỗi chip ×2;
  - G giải thích; G tra cứu;
  - DEEP + quyết định;
  - câu âm "kỹ sư".
- **Barnum:** 6 câu × 6 lá số.
  1. Đổi gói: câu trả lời của lá số A được kiểm bằng whitelist của lá số B, tính tỉ lệ tên bị trượt.
  2. So **phần lời sau khi bỏ tên** giữa các lá số. Lá số khác hướng thì độ tương đồng phải thấp.
  3. Ghép mù: chỉ nhìn tên căn cứ, ghép câu trả lời về đúng lá số, độ chính xác ≥ 80%.
  4. Cùng lá số, đổi năm 2026 ↔ 2031: tên ở lớp năm phải đổi.
- **Ngưỡng đạt:**
  - 100% tên có trong gói (đo bản cuối);
  - lật chiều kết luận **trên bản thô** ≤ 10%, trên bản cuối = 0;
  - 0 câu khuyên hay chọn hộ (C2/E1) trên bản cuối;
  - người được nêu không có trong câu hỏi hoặc ngữ cảnh: 0, đo tự động bằng bảng vai người;
  - N1: phạm vi tháng thì ≥ 1 F### nguyệt hạn, và các lớp được nêu đều nằm trong các lớp có trong gói;
  - NORMAL: ≥ 90% ca có 2–4 câu và 55–120 âm tiết, `evidenceAfter ≥ 1`;
  - tỉ lệ dùng câu dự phòng ≤ 25%, thử lại ≤ 20%, trả 502 ≤ 3%.
- **Giọng:** bien-tap-vi và chủ dự án đọc 6 câu canonical. celes-domain chấm thuộc tính căn cứ.

## 10. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Chi phí eval | Khoảng 30 + 36 + 2 = 68 lượt × 1–3 lần gọi ≈ 70–200 lần gọi mỗi vòng, tối đa 2 vòng. Chưa biết chuỗi model thật trong `ai_model_configs` có phải free tier không, nên gọi `soat-chi-phi` trước khi chạy. |
| Chi phí khi chạy thật | soat-chi-phi: đường cũ chỉ gọi `suaCauTiengLong` ở khoảng 3% bài (sua-chua.ts:352), nên bỏ nó gần như không tiết kiệm. Focused ước **đắt hơn 10–25%** (1,2–1,3 lần gọi/lượt so với 1,03–1,1), chưa đo. Trần thử lại = 1 lần. |
| Tỉ lệ 502 | Đặt ngưỡng ≤ 3%. Không đạt thì nới guard jargon trước khi cho Preview. |
| Khoá đệm | Không nâng `PHIEN_BAN_*`. Bất biến được test, bản đệm bị xả = 0. |
| Lệch web–app | Shape phản hồi giữ nguyên. Cờ production = 0 nên app không đổi. |
| Lỗi nguồn căn cứ còn ở đường cũ | Cố ý để lại (brief mục 3). Ticket sau: port sang đường cũ, hoặc tự hết khi bật cờ. |
| Hai nơi giữ từ khoá | Đã gom: nhận diện người nằm ở planner, phân khuôn chỉ đọc kế hoạch. |

## 11. Tệp

- **Mới:**
  - `lib/rag/focused/{phan-loai,cau-ma,prompt,kiem,quet-ten,ke-thua,chay}.ts`
  - `scripts/test-focused.ts`
  - `scripts/eval-focused.ts`
- **Sửa:**
  - `lib/rag/planner.ts`: `nguoiDuocHoi`, tham số `ep`; trường cũ 0 diff, không nâng phiên bản.
  - `lib/rag/tra-loi.ts`: rẽ nhánh, `phienBanHienTai`.
  - `lib/rag/nghieng-ve.ts`: tham số `focused`, `cungChinh`.
  - `lib/rag/boi-canh-la-so.ts`: F### lưu tinh năm, chỉ khi `focused`.
  - `app/api/hoi-dap/route.ts`: nhãn F2, trường vết.
  - `.github/workflows/kiem-tra.yml`, `scripts/kiem-nhanh.mjs`.
  - `AGENTS.md`, `HUONG-DAN.md`, `PRODUCT-BACKLOG.xlsx`.
- **Không sửa:** `kiem-duyet.ts`, `chuan-ngon-ngu.ts`, `hop-dong-tra-loi.ts`, `prompt-co-can-cu.ts` (đường cũ), `dau-an.ts`, `lib/tuvi/**`, `apps/**`, UI web.
- **Backlog:** cập nhật dòng CEL-186 (Vé B). Thêm mục "Focused Chat" vào sheet Logic. Thêm một dòng Nhật ký.
- **Commit:**
  1. planner `nguoiDuocHoi` + test;
  2. phân khuôn, câu do mã viết, kế thừa + test;
  3. nguồn căn cứ + test;
  4. prompt, guard, nối tra-loi/route + test;
  5. eval;
  6. tài liệu + backlog.

## 12. Cờ CẦN CHỦ DỰ ÁN DUYỆT

1. **Sửa nguồn căn cứ chỉ trên đường Focused.** Đường cũ vẫn đọc Điền Trạch cho câu hỏi về con / cha mẹ / anh em cho tới khi bật cờ. *Khuyến nghị: duyệt.*
2. **Chủ đề chip kế thừa ở server** theo mục 3, client không đổi. *Khuyến nghị: duyệt.*
3. **Chữ các câu do mã viết** ở mục 7.
4. **F2 không gọi model có trừ lượt không.** Brief chỉ nói "quota chip không đổi", không nói về F2. *Khuyến nghị: vẫn trừ lượt như mọi câu hỏi*, để không đụng luật hạn mức trong vé này.
5. **Chip "Tháng nào đáng chú ý hơn?"** có trong brief, nhưng brief cũng cấm scanner. Phương án: giữ chip, trả lời theo khuôn D′ (câu giới hạn + đọc tháng hiện tại). Phương án khác: bỏ chip.
6. **DEEP khi cờ bật vẫn tuân C/D/E/F2**, chỉ dài hơn. *Khuyến nghị: duyệt.*
7. **Đặt `CELES_FOCUSED_CHAT=1` cho Preview trên Vercel:** chủ dự án tự đặt, hoặc cho phép tôi đặt.
8. **Ngân sách eval model thật** (theo soat-chi-phi):
   - Free tier không đủ cho một vòng trong một ngày, vì Gemini khoảng 20 lần/ngày và Groq khoảng 22 lượt/ngày theo token. Chuỗi mặc định lùi sang openai/anthropic có tính phí mà không báo.
   - Đề xuất:
     - đặt `AI_NGAN_SACH_TOKEN` và `AI_NHAN=test`;
     - vòng 1 có 30 ca, trần 1,2 triệu token;
     - Barnum 36 lượt chỉ chạy khi vòng 1 đạt;
     - vòng 2 chỉ chạy lại các ca trượt, trần 0,6 triệu;
     - tổng ≤ 1,8 triệu token, chia qua 2–3 ngày.
   - **Chủ dự án chọn một trong hai:**
     - (a) chỉ dùng provider miễn phí: tắt openai/anthropic trong `/admin/models` hoặc đặt `AI_FALLBACK_ORDER`, hết hạn mức thì dừng;
     - (b) cho phép tối đa khoảng 1–2 USD openai cho eval.
   - Chuỗi thật trong `ai_model_configs` cần chủ dự án xem ở `/admin/models`. Tôi không đọc `.env.local`.
9. **Cờ bật thì đường Focused bỏ dấu ấn Celes (`dauAnChoLuot`) và hợp đồng nhịp.** Đây là nới luật cốt lõi hiện có. Giọng do `KHOI_GIONG_CELES` giữ.
10. **Preview và Production có dùng chung Supabase không?**
    - Nếu chung, người thử Preview sẽ ghi `chat_messages`, `ai_requests` và lượt hạn mức vào dữ liệu thật.
    - Vết có `focused: khuon` nên lọc được về sau. Chủ dự án cần xác nhận trước khi bật cờ ở Preview.

## 13. Sửa theo danh-gia-tac-dong (đã gộp vào phương án)

1. **Gắn `nguoiDuocHoi` trong `dungKeHoach`** (planner.ts:826), không gắn trong `lapKeHoach`. Nhờ vậy cả nhánh luật lẫn nhánh model (planner.ts:930-940) đều có trường này.
2. **F### lưu tinh năm chỉ nối vào CUỐI danh sách và chỉ khi `focused`.**
   - Năm bề mặt khác (bai-dai, ban-doc-sau, bang-linh-vuc, moc-hanh-trinh, be-mat-ngan) dùng chung hàm này.
   - Test chụp mẫu sẽ chứng minh mã F### của đường cũ không đổi.
3. **F2 trả `goi` rỗng nhưng đủ trường, và `phienBan` đủ khoá `engine`, `phuongPhap`.** Nếu thiếu, nhánh admin ở route.ts:269-299 sẽ sập thành 502. Có test riêng cho trường hợp `laQuanTri`.
4. **Thứ tự trong tra-loi:** `lapKeHoach` → nếu là F2 thì trả ngay. Bước này đứng trước `tenCachCucCho` và `lapKeHoachDayDu`, nên không tốn lần gọi model phân loại (tối đa 8 giây).
5. **Hạn chót:** route có `maxDuration = 60`. `chay.ts` đặt hạn chót cho cả lượt; hết giờ thì không thử lại nữa mà trả 502 và hoàn lượt.
6. **Dùng lại `CUM_AI` và `RO_RI_RAG`:** thêm `export` vào `lib/rag/ngon-ngu.ts`, chỉ thêm từ khoá, không đổi nội dung mảng. `ngon-ngu.ts` vào danh sách "Sửa", và `PHIEN_BAN_CHU` vẫn không đổi (có test).
7. **Vẫn dùng `daNoiTruoc`**, để câu chat không ngược với bài đọc đã cấp cho người dùng.
8. **CI:**
   - thêm `npx tsx scripts/test-focused.ts` vào kiem-tra.yml, đúng định dạng mà kiem-nhanh đọc;
   - đưa `scripts/test-du-kien.ts` vào CI, vì vé này sửa `nghieng-ve.ts`.
9. **Admin:** Focused không có `mucChacChan`, nên cột này trên trang admin để trống. Không vỡ gì.
10. **Còn chưa kiểm, sẽ kiểm khi code:**
    - cột `provider` của bảng vết và nhãn trong `chotCauHoi` có ràng buộc giá trị không. Nếu có, F2 ghi `provider = 'ma'` sẽ không lưu được;
    - app xử lý `loiDi` sang Kết nối ra sao.

## 14. Cập nhật theo researcher 03/10 tối (thay đổi so với bản 2, sau khi mở khoá)

Mã từ 10e351f tới HEAD chỉ đổi tài liệu. Nhánh fix `noi_dung_ai` chỉ chồng với Vé B ở `.github/workflows/kiem-tra.yml` (một bước CI, gỡ khi merge). Vé B không chạm `noi-dung-ai.ts`, `so-ket-luan`, `thu-vien`, `v3`.

1. **`DoiTuongCauHoi` (thay mục 1 và 13.1).** `lib/rag/focused/doi-tuong.ts` là hàm thuần. Nó đọc câu hỏi và trả `{ vai, cung, loai: 'quan-he'|'van-rieng' } | null`.
   - **Dựng lại kế hoạch cho cung lục thân mà KHÔNG sửa `planner.ts`.** Gọi `lapKeHoach` / `lapKeHoachDayDu` công khai với câu `"<Tên cung có dấu> " + cauHoi`. Tên cung đứng đầu thì thành PALACE đầu tiên, nên `cungLienQuan[0]` là cung lục thân.
   - Chỉ dùng câu ghép này để lập kế hoạch và truy hồi. Prompt và guard vẫn thấy câu gốc.
   - Chọn cung theo `cungLienQuan[0]`, không theo `chuDe` (Tử Tức, Phụ Mẫu, Huynh Đệ đều ra `gia-dao`).
   - `tenCachCuc = tenCachCucCho(laSo, cungLucThan)`.
   - `PHIEN_BAN_PLANNER` không đổi, không xả đệm.
2. **Ba chỗ thêm `export`, không đổi nội dung:**
   - `CUM_AI`, `RO_RI_RAG` trong `ngon-ngu.ts`;
   - `TIENG_LONG_MOT_CAU` trong `sua-chua.ts`.
   - Có test khẳng định `PHIEN_BAN_CHU` bằng giá trị chụp từ main.
3. **`KHOI_GIONG_CELES`** chép từ nhánh quick vào `focused/prompt.ts`. Không sửa `prompt-co-can-cu.ts`.
4. **Port từ nhánh quick:**
   - `chot-huong.ts` vào `focused/chot-huong.ts` (bỏ bẫy `if (duPhong && !cauDuPhong) duPhong = null`); `cauChotDuPhong` viết thêm phần tên `dauMoc`;
   - `ngoai-tam.ts` vào `focused/ngoai-tam.ts` (chỉ danh tính bạn đời).
   - Không merge nhánh quick.
5. **SENSITIVE:** đường Focused tự gọi `datMienTruTamLy`, như STANDARD đang làm ở tra-loi.ts:593. Nếu không, mất lớp an toàn.
6. **Tháng nhuận và khoảng dương lịch:** thêm `focused/thang-am.ts`, không sửa `lib/tuvi`.
   - `coThangNhuan(nam, X) = lunarToSolar(1, X, nam, true) !== null`.
   - `khoangDuong` tính đúng cả khi tháng X có nhuận.
   - Test trên năm có nhuận đã biết.
7. **F### lưu tinh:** `chonBoiCanh` nhận tham số tuỳ chọn `focused`.
   - Chỉ khi có cờ này mới nối các mục lưu tinh vào CUỐI danh sách, với `loai` mới là `'luu-tinh'`.
   - Grep mọi `switch` / bảng tra theo `loai` để không chỗ nào vỡ.
   - Cờ tắt thì chụp mẫu từng byte giống main.
8. **Tháng thêm lớp đại vận và lưu niên (N1):** trong `focused/`, sao chép `keHoach` rồi sửa `lopHan`. Không sửa planner.
9. **Ghim model cho eval** (cờ #8): `DauVaoTraLoi` thêm trường tuỳ chọn `uuTienProvider` (`'provider|model'`), chỉ đường Focused truyền xuống `goiVoiFallback`.
   - Eval đặt `AI_KHONG_LUI=1`, ghim đúng model Production đọc từ `ai_model_configs` lúc chạy.
   - Trần $2 quy ra `AI_NGAN_SACH_TOKEN` theo giá của model đó.
   - **Việc này thuộc giai đoạn sau khi fix gộp main.**
10. **Cờ:** `const focusedBat = () => process.env.CELES_FOCUSED_CHAT === '1'`, đọc mỗi lượt như `AI_*`. Tinh nghịch vẫn tắt, vì `CELES_TINH_NGHICH` chưa tồn tại và không thêm trong vé này.
11. **Đã biết:** trên Preview sau fix, `daNoiTruoc` rỗng cho tới khi bảng lĩnh vực được sinh ở Preview. Eval phải ghi rõ chuyện này, hoặc sinh bảng lĩnh vực cho các lá số eval trước khi chạy.

## 15. Sửa mục 14 theo phan-bien 03/10 tối (thắng mục 14 ở chỗ nói ngược)

**Sập, đã sửa phương án:**

- **S1 (sửa 14.6). Dò tháng nhuận.**
  - `lunarToSolar(1, X, nam, true)` chỉ trả `null` trong nhánh năm có nhuận. Năm không nhuận (như 2026) thì mọi X đều bị coi là "có nhuận".
  - Dò đúng: `kq = lunarToSolar(1, X, nam, true)`, rồi `coThangNhuan = kq !== null && solarToLunar(kq).isLeapMonth === true && thang === X`.
  - Test bắt buộc có ca âm tính (2026, 2027: không tháng nào nhuận) và ca dương tính (một năm nhuận đã biết, kiểm đúng tháng).
- **S2 (sửa 14.9). Ghim model phải phủ MỌI lời gọi trong lượt.** Trong một lượt có tới bốn chỗ gọi model:
  - planner (`planner.ts:920`);
  - lời gọi chính;
  - lượt thử lại;
  - sửa câu (`sua-chua.ts:287/381`).
  
  Truyền `uuTienProvider` riêng cho lời gọi chính là không đủ.
  - Sửa: thêm biến môi trường CHỈ DÀNH CHO SCRIPT, `AI_GHIM_MODEL='provider|model'`, đọc trong `goiVoiFallback`. Khi có biến này, danh sách thu về đúng model đó cho MỌI lời gọi, dù có truyền `uuTienProvider` hay không. Không gọi được thì ném `KhongCoModelError`, không lùi.
  - Sản phẩm không đặt biến này, nên hành vi Production không đổi.
  - Bỏ trường `uuTienProvider` khỏi `DauVaoTraLoi`, vì không cần nữa.
  - Đây là sửa `lib/ai/fallback.ts`, tệp Chung. Nhánh fix môi trường KHÔNG chạm tệp này (đã đối chiếu danh sách tệp). Chỉ thêm một nhánh `if` đọc env. Làm ở commit script eval, chưa chạy model thật.
- **S3 (sửa 14.9). Trần $2 phải cứng thật.** `AI_NGAN_SACH_TOKEN` không phải trần cứng:
  - kiểm trước rồi mới cộng;
  - Gemini đếm thiếu token suy nghĩ;
  - lượt hỏng không được đếm;
  - lỗi vượt ngân sách bị nuốt ở planner và sửa câu;
  - bộ đếm theo tiến trình, nên gọi qua HTTP thì không có trần.
  
  Thiết kế eval:
  - Script eval gọi `traLoiCoCanCu` NGAY TRONG TIẾN TRÌNH, chạy tuần tự từng ca, không qua HTTP Preview.
  - **Giữ chỗ trước khi gọi.** Thêm biến chỉ dành cho script, `AI_TRAN_USD`, kèm giá vào/ra của model ghim. Trước MỖI lời gọi, `goiVoiFallback` cộng phần giữ chỗ bi quan, gồm token vào ước theo độ dài prompt cộng `maxTokens` tính theo giá RA. Tổng giữ chỗ vượt trần thì ném `VuotNganSachError` TRƯỚC khi gọi. Gọi xong thì thay phần giữ chỗ bằng số thật, lấy số lớn hơn giữa số báo về và phần giữ chỗ của token ra nếu provider không báo token suy nghĩ. Lượt hỏng vẫn tính trọn phần giữ chỗ.
  - Vì kiểm trước mỗi lời gọi và bộ đếm chỉ tăng, lỗi bị nuốt ở planner hay sửa câu cũng chỉ trì hoãn một bước: lời gọi chính kế tiếp vẫn bị chặn.
  - Đường Focused không nuốt `VuotNganSachError` trong vòng thử lại. Script bắt lỗi này thì dừng NGAY cả bộ, in số đã tiêu và ca đang dở.
  - Hết bộ, đối chiếu `ai_usage_logs` theo `AI_NHAN=test`.

**Lung lay, đã sửa phương án:**

- **L1 (sửa 14.1). Câu ghép tên cung chỉ dùng để lấy cung và truy hồi.**
  - Lập HAI kế hoạch: một từ câu GỐC, một từ câu GHÉP.
  - Kế hoạch dùng thật lấy mọi trường từ câu gốc (`yDinh`, `namMucTieu`, `thangMucTieu`, `phamVi`, `lopHan`, `chacChan`, `chuDe`). Riêng `cungLienQuan` lấy từ câu ghép, với cung lục thân đứng đầu.
  - Nhờ vậy, năm trần đứng đầu câu ("2027 bố tôi…") không bị mất.
  - Lọc khỏi `cungLienQuan` các cung của CHÍNH người hỏi mà câu kéo theo (Quan Lộc, Tài Bạch, Tật Ách khi người được hỏi là người khác). Với câu vận riêng người kia (F3), câu do mã viết trả lời trước nên không tới bước này.
  - `tinhNghiengVe` nhận `cungChinh` tường minh trên đường Focused, không suy từ `CUNG_THEO_CHU_DE[chuDe]`.
  - Test hợp đồng: trên 10 câu lục thân, kế hoạch dùng thật bằng kế hoạch câu gốc ở mọi trường trừ `cungLienQuan`, và `cungLienQuan[0]` là đúng cung lục thân.
- **L2 (sửa 14.5).** Miễn trừ SENSITIVE nối SAU guard độ dài, và áp cho MỌI nhánh trả văn của Focused, kể cả câu do mã viết khi `mucAnToan` là SENSITIVE.
- **L3 (sửa 14.2).**
  - Test `PHIEN_BAN_CHU` không ghim một chuỗi cứng. Nó dựng lại băm từ chính các hằng số nguồn, rồi so với `PHIEN_BAN_CHU` đang export, để chứng minh việc thêm `export` không làm đổi đầu vào băm.
  - Ba hằng số export dưới dạng `readonly`.

**Đứng được (giữ nguyên):**
- ba chỗ thêm `export`;
- loại `'luu-tinh'`;
- 14.8;
- cờ đọc mỗi lượt;
- `tenCachCucCho`.
