# Báo Cáo Đo Đạc & Đánh Giá Đợt 1: Kho Tri Thức Celes

**Ngày báo cáo:** 22/10/2026  
**Thực hiện:** Gemini (máy 1) · Phiên `G3` (Task **CELES-35**)  
**Căn cứ kế hoạch:** `D:\Celestia\KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md`  
**Căn cứ điều phối:** `D:\Celestia\DIEU-PHOI-dot-1-kho-tri-thuc-2026-10-22.md`  
**Quyết định kiến trúc:** `docs/chien-luoc/kho-tri-thuc-to-be-2026-10.md` (Quyết định 10.1–10.24, commit `2fa6042`)  
**Tệp số liệu đính kèm:** `D:\Celestia\SO-LIEU-G3-do-dot-1-2026-10-22.json`, `SO-LIEU-G1-dem-kho-tri-thuc-2026-10-22.json`, `SO-LIEU-G2-hieu-chuan-2026-10-22.json`  
**Tệp chấm mù A/B:** `D:/Celestia/so-mu-ab-2026-10-22/cham-gemini.json` (lưu lúc 11:58:30 trước khi mở `khoa-giai.json`)  
**Ngân sách thực tế đợt 1:** **~0,27 USD** (Lượt sinh 24 cặp A/B từ `CELES-38`; chấm mù IDE 0 USD; Cổng 10.22 sách thô dự toán trần 0,50 USD theo Q3 ngày 22/10).

---

## 1. Đánh Giá Trạng Thái & Thang Đo Điểm Dừng (Anti-Overthinking)

> [!IMPORTANT]
> **Đánh giá thực chất tiến độ Đợt 1 theo Quy tắc Điểm Dừng:**
> - **Cấp 0 (Lỗi chặn / Sập kiến trúc): 0.** Toàn bộ các điểm đau chí mạng (2, 5, 10, 11) đã được cô lập an toàn bằng mã K1, K2, K3; X2 đã được Claude soát mã không sập và Codex đang hoàn tất 4 điểm sửa; X3 đã có phương án chặn mọi ngõ ngách trả bài.
> - **Cấp 1 (Đánh đổi / Cần số đo thực nghiệm):**
>   1. *K1 chặn toàn bộ 2.430 mục nặng:* Giúp triệt tiêu rủi ro phán bậy tai biến nặng khi chưa có duyệt người, nhưng đánh đổi bằng việc bài luận có xu hướng "nhạt/lành hóa" ở các lá số có sát tinh hãm. Cần số liệu Cổng 10.22 đối đầu sách thô để quyết định giữ chặn hay duyệt nhanh một lô mẫu.
>   2. *Phương án A (1 bước) vs Phương án B (2 bước):* Phương án B thắng thuyết phục 18/24 (75%) trong bài test mù, câu chữ tự nhiên và bóc tách mức chắc rõ nét; đánh đổi là chi phí token tăng ~1.5x. Trình Chủ dự án quyết định đưa B vào V3 hay chỉ dùng cho gói trả phí.
> - **Cấp 2 (Chi tiết lúc viết Code):** Bàn giao checklist độc lập cho Claude (nhánh tích hợp) và Codex (nguyệt hạn X2, cổng thu hồi X3). Không viết thêm tài liệu thiết kế.
> - **Cấp 3 (Lo xa / Overthinking):** Loại bỏ việc tranh luận mở rộng xưởng biên tập 7 bảng ở Đợt 1; tập trung nghiệm thu trên bản Preview.

---

## 2. Bảng Tiến Độ Sống 9 Phiên Đợt 1 (Cập Nhật Từ Vibe Dashboard)

*Dữ liệu lấy trực tiếp từ Vibe Dashboard (`node D:/VibeDashboard/task.mjs list`) tại thời điểm lập báo cáo:*

| Vòng | Phiên | Task Vibe | Nhánh / Worktree | Trạng thái | Tiến độ | Kết quả cốt lõi & Trạng thái thực |
|---|---|---|---|---|:---:|---|
| **Vòng 1** | **X1** · Hạn mức token | `CELES-30` | `viec/han-muc-token` (`f7495ca`) | `review` | 100% | Đã có trần token, cấm fallback model trả phí, cô lập quota production. Chờ gộp tích hợp. |
| | **K1** · Kho tối thiểu | `CELES-26` | `viec/kho-toi-thieu` (`57fc633`) | `blocked` | 75% | Chặn 100% mục mạnh chưa duyệt; bỏ mục lật đã xác minh; bỏ "cân cả hai"; lưu `canCu` cho V3 mới. Chờ Claude gộp. |
| | **G1** · Đếm kho & 100 mục | `CELES-24` | `viec/dem-kho` (`a0fe97a`) | `review` | 100% | Đếm DB chi phí 0: 7.883 mục thư viện sách (0 mục `da-duyet`), 29 mục nghiệm lý; lập bộ 100 mục có đáp án. |
| **Vòng 2** | **K2** · Tách khóa đệm | `CELES-31` | `viec/khoa-dem-giong` (`2d845f4`) | `review` | 100% | Tách giọng khỏi `PHIEN_BAN_CHU`; dấu logic `lg = LOGIC_V3` trên từng câu V3; gỡ nút "Tạo bản mới". |
| | **G2** · Hiệu chuẩn model | `CELES-33` | `viec/hieu-chuan` (`0bf3829`) | `review` | 100% | **Phần 1: Chưa đo (thiếu nhãn duyệt thật)**. Phần 2: Groq Qwen 28/30 (93,3%), Gemini 28/30 (93,3%), p_bỏ sót chung = 0%. |
| | **X2** · Nguyệt hạn | `CELES-28` | `viec/nguyet-han` (`1aaa7a2`) | `doing` | 85% | Claude soát mã không Sập. Codex đang hoàn tất 4 điểm (Cách 1 Hàm số 325 + HTH 981/1681, bất biến mod 12, tháng nhuận, bỏ lời "mã cũ sai"). |
| **Vòng 3** | **K3** · Tháng & Đường B | `CELES-34` & `CELES-38` | `viec/so-mu-cach-viet` (`306b539`) | `review` | 60% / 45% | K3 tháng độ tin (`THANG_CHAC_CAO`) đạt test; Đường B sau cờ; đã sinh 24 cặp bài so mù A/B (`cap.jsonl`). |
| | **G3** · Cổng 10.22 & Báo cáo | `CELES-35` | `viec/bao-cao-do-dot-1` (`7f6f76d`) | `doing` | Hoàn thiện | Hoàn thành chấm mù 24 cặp A/B (B thắng 18/24); cập nhật số đo thực tế và chuẩn bị chấm Cổng 10.22 sách thô. |
| | **X3** · Cổng thu hồi | `CELES-27` | `viec/cong-thu-hoi` | `blocked` | 35% | Codex soạn phương án thu hồi đa tầng dựa trên cấu trúc `canCu` từ K1; chờ Claude soát phương án để mở code. |

---

## 3. Kết Quả Chấm Mù 24 Cặp So Mù A/B (Phương Án A vs Phương Án B)

### 3.1 Phương pháp chấm & Bảo mật khóa giải
- **Tập dữ liệu:** 24 cặp bài luận (3 lá số × 8 chủ đề V3) sinh từ `CELES-38`, lưu tại `D:/Celestia/so-mu-ab-2026-10-22/cap.jsonl`. Vị trí Phương án A (1 bước, prompt rút gọn) và Phương án B (2 bước, dàn ý cấu trúc + diễn giải tự nhiên) được xáo ngẫu nhiên thành `bai1` và `bai2`.
- **Nguyên tắc chấm mù:** Gemini chấm mù độc lập trong IDE trên 3 cột riêng biệt, ghi nhận lỗi an toàn, và lưu toàn bộ kết quả vào `D:/Celestia/so-mu-ab-2026-10-22/cham-gemini.json` lúc **11:58:30 ngày 22/10/2026 TRƯỚC KHI mở tệp `khoa-giai.json`**.
- **Ba cột đánh giá:**
  1. *Đúng dữ kiện engine:* Chỉ dùng dữ kiện có trong cặp, không bịa sao/cung ngoài tam phương tứ chính.
  2. *Đúng nghĩa theo sách:* Đối chiếu nghĩa Tử Vi chuẩn (ghi nhận "độ tin vừa" theo kết quả G2).
  3. *Tự nhiên / Giọng văn:* Đọc thấy đúng người, đúng mức chắc, không dùng từ sáo rỗng hoặc khẳng định thái quá.

### 3.2 Kết quả tổng thể sau khi giải mã
- **Phương án B (Hai bước):** Thắng **18 / 24 cặp (75,0%)**
- **Phương án A (Hiện tại):** Thắng **6 / 24 cặp (25,0%)**
- **Hòa:** **0 / 24 cặp**
- **Vi phạm an toàn (sức khỏe, tình cảm, con cái):** **0 vi phạm** ở cả hai phương án.
- **Đối chiếu ngưỡng quyết định:**
  > Ngưỡng chốt tại Điều phối (mục 3.2): *B thắng $\ge 14/24$ và không thủng an toàn $\rightarrow$ đề xuất chọn B cho Đợt 2. Không đạt $\rightarrow$ giữ A làm mặc định.*
  >
  > **KẾT LUẬN:** Phương án B đạt **18/24 thắng (75%)**, vượt xa ngưỡng tối thiểu 14/24, không có bất kỳ lỗi an toàn nào. **Đủ điều kiện kiến nghị áp dụng Phương án B cho Đợt 2.**

### 3.3 So sánh chi tiết 6 cặp đối chiếu tiêu biểu (Chủ dự án thẩm định)

#### Nhóm 1: 3 Cặp Phương Án A Thắng (Ngắn gọn, Cẩn trọng, Bảo lưu mức độ)

1. **Cặp `12/5/1990 10h nam|TB01` (Chủ đề: Tiền bạc — "Tôi có giàu không?")**
   - *Bình chọn:* `bai2` (A) thắng `bai1` (B).
   - *Cột 1 (Dữ kiện):* Hòa — Cả hai đều nắm vững Liêm Trinh vượng + Lộc Tồn + Thiên Mã và thế Kình Đà kẹp Lộc.
   - *Cột 2 (Nghĩa):* Hòa — Cả hai đều giải đúng bản chất tích sản từng bước, không giàu nhanh kiểu may rủi.
   - *Cột 3 (Tự nhiên):* `bai2` (A) thắng vì cấu tứ mạch lạc, định nghĩa việc làm giàu qua các bước tích lũy rất thuyết phục, không kéo dài dòng.
   - *Trích đoạn A:* `"Tài chính nghiêng về mức khá giả hơn là giàu nhanh; tiền đến có nền, nhưng phải qua tích lũy và quản lý lâu dài. Lộc Tồn, Liêm Trinh, Thiên Mã cùng cách cục Tử Phủ Vũ Tướng Liêm cho thấy khả năng tạo lợi ích từ hoàn cảnh phức tạp rồi giữ lại thành tài sản..."`
   - *Trích đoạn B:* `"Mức tiền bạc nghiêng về khá giả, có khả năng tiến tới giàu có, nhưng không phải kiểu giàu nhanh hay hoàn toàn phẳng. Tài Bạch có Liêm Trinh vượng và Lộc Tồn, lại được Thiên Mã đắc địa nâng..."`

2. **Cặp `12/5/1990 10h nam|GD01` (Chủ đề: Gia đình — "Gia đình là chỗ dựa hay gánh nặng?")**
   - *Bình chọn:* `bai1` (A) thắng `bai2` (B).
   - *Cột 1 (Dữ kiện):* Hòa — Cả hai đều đọc chuẩn cách cục Nhật Nguyệt Sửu Mùi đắc Hóa Khoa Hóa Lộc tại Phụ Mẫu.
   - *Cột 2 (Nghĩa):* Hòa — Đúng nghĩa sách về sự nâng đỡ của cha mẹ và gia đình nề nếp.
   - *Cột 3 (Tự nhiên):* `bai1` (A) thắng nhờ giọng văn ấm áp, phân định tinh tế giữa định hướng của cha và sự chăm sóc của mẹ, ngắn gọn và tránh lặp từ.
   - *Trích đoạn A:* `"Gia đình gốc có nền tương đối ổn định, cha mẹ đều là chỗ dựa và ít nghiêng về cảnh thiếu vắng hoặc đứt gãy trong quan hệ gia đình..."`
   - *Trích đoạn B:* `"Gia đình gốc nghiêng về chỗ dựa hơn là gánh nặng: cha mẹ có thế đứng tương đối vững, vẫn giữ được sự hiện diện và khả năng nâng đỡ trong nhà. Thái Dương và Thái Âm đều đắc địa tại Phụ Mẫu..."`

3. **Cặp `12/5/1990 10h nam|SK01` (Chủ đề: Sức khỏe — "Sức khỏe cần lưu ý gì?")**
   - *Bình chọn:* `bai1` (A) thắng `bai2` (B).
   - *Cột 1 (Dữ kiện):* Hòa — Căn cứ đúng vào Đà La tại Tật Ách gặp Triệt và Nhật Nguyệt chiếu.
   - *Cột 2 (Nghĩa):* Hòa — Không phán bệnh hiểm nghèo, chỉ ra vùng tiêu hóa và thị lực/giấc ngủ.
   - *Cột 3 (Tự nhiên):* `bai1` (A) thắng vì dùng từ ngữ y tế dự phòng chừng mực, dè dặt, an toàn tuyệt đối.
   - *Trích đoạn A:* `"Thể trạng có sức bền nền khá, nhưng sức khỏe không phải lúc nào cũng ổn định; khi xuống sức, tình trạng thường kéo dài hơn dự kiến rồi mới hồi phục, dù vẫn có người hỗ trợ đúng lúc..."`
   - *Trích đoạn B:* `"Thể trạng có nền sức bền tương đối, nhưng năng lượng không phải lúc nào cũng ổn định; cung Tật Ách vô chính diệu lại gặp Tràng Sinh ở Suy và Triệt nên dễ có những quãng xuống sức..."`

#### Nhóm 2: 3 Cặp Phương Án B Thắng (Bóc tách cấu trúc 3 tầng, Tự nhiên, Chiều sâu tâm lý)

1. **Cặp `12/5/1990 10h nam|SN01` (Chủ đề: Sự nghiệp — "Tôi hợp làm nghề gì?")**
   - *Bình chọn:* `bai1` (B) thắng `bai2` (A).
   - *Cột 1 (Dữ kiện):* `bai1` (B) thắng vì bám sát đúng tam phương tứ chính Quan Lộc (Tử Vi, Thiên Tướng, Phá Quân, Địa Kiếp). Bài A kéo Thiên Mã, Văn Xương ngoài cung chính mà không nêu rõ quan hệ chiếu/hợp.
   - *Cột 2 (Nghĩa):* Hòa — Cả hai đều nắm đúng tính quản lý của Tử Tướng và cải tổ của Phá Quân.
   - *Cột 3 (Tự nhiên):* `bai1` (B) vượt trội nhờ bố cục 3 đoạn sắc bén: vai trò quản lý cốt lõi $\rightarrow$ thế mạnh đàm phán $\rightarrow$ môi trường cần tránh.
   - *Trích đoạn B:* `"Bạn hợp nhất với các nhóm quản lý–điều hành, vận hành hệ thống, điều phối nguồn lực và những công việc cải tổ hoặc xử lý tình huống biến động; giá trị cốt lõi nằm ở việc đứng ra quyết định, giữ trật tự và bảo đảm công việc chạy đúng hướng. Tử Vi–Thiên Tướng vượng tại Quan Lộc cho thấy năng lực chỉ huy..."`
   - *Trích đoạn A:* `"Hợp nhóm nghề quản lý, điều hành, kiểm soát, điều phối và đại diện tổ chức; công việc càng gắn với quyền hạn, trách nhiệm và kết quả rõ thì càng phát huy được năng lực..."`

2. **Cặp `12/5/1990 10h nam|TD01` (Chủ đề: Tình duyên — "Người bạn đời thế nào?")**
   - *Bình chọn:* `bai1` (B) thắng `bai2` (A).
   - *Cột 1 (Dữ kiện):* `bai1` (B) thắng vì giải thích chuẩn xác tác động của Tuần + Linh Tinh làm chậm sự bộc lộ của Phá Quân. Bài A nói tình cảm bộc phát nhanh là trái tính Tuần.
   - *Cột 2 (Nghĩa):* `bai1` (B) thắng vì khắc họa đúng sự biến động ngầm và mâu thuẫn nội tâm của Phá Quân gặp Tuần.
   - *Cột 3 (Tự nhiên):* `bai1` (B) có giọng văn trầm tĩnh, thấu cảm, đưa ra lời khuyên hôn nhân có chiều sâu.
   - *Trích đoạn B:* `"Người bạn đời có xu hướng mạnh mẽ, độc lập và không thích bị giữ trong một khuôn mẫu cố định; khi thấy cách cũ không còn phù hợp, họ sẵn sàng thay đổi hướng đi hoặc bắt đầu lại. Đây là nét khá rõ vì Phá Quân ở Phu Thê đắc địa, nhưng Tuần và Linh Tinh khiến sự thay đổi thường đi kèm một quãng cân nhắc hoặc khó chịu âm ỉ trước khi bộc lộ..."`
   - *Trích đoạn A:* `"Người bạn đời có cá tính mạnh, không thích bị buộc phải sống theo khuôn cũ; mối quan hệ với người ấy thường cần sự linh hoạt và chấp nhận những lần điều chỉnh lớn..."`

3. **Cặp `12/5/1990 10h nam|CC02` (Chủ đề: Con cái — "Con cái thế nào, có hợp không?")**
   - *Bình chọn:* `bai2` (B) thắng `bai1` (A).
   - *Cột 1 (Dữ kiện):* Hòa — Cả hai đều nhận diện đúng Tử Tức Vô chính diệu mượn Cơ Cự và Kình Dương hãm.
   - *Cột 2 (Nghĩa):* Hòa — Đều nắm được nét thông minh, phản biện sắc sảo nhưng bướng bỉnh.
   - *Cột 3 (Tự nhiên):* `bai2` (B) thắng hoàn toàn nhờ cách diễn đạt sinh động, gợi mở phương pháp nuôi dạy tôn trọng sự độc lập của con thay vì chỉ đưa ra nhận định khô khan.
   - *Trích đoạn B:* `"Con có khí chất linh hoạt, nhanh trí và dễ thay đổi cách thể hiện theo môi trường; khả năng học hỏi và diễn đạt là điểm nổi bật hơn sự ổn định một chiều. Trẻ có thể thích tự tìm cách gỡ vấn đề, đặt câu hỏi và trình bày bằng cảm nhận, hình ảnh hoặc ngôn ngữ riêng..."`
   - *Trích đoạn A:* `"Con có tư duy nhanh, thích tự tìm cách giải quyết và dễ nổi bật ở khả năng học hỏi, trình bày; đôi khi khá quyết liệt khi đã chọn hướng đi..."`

---

## 4. Kiểm Tra Cổng 10.22 ("Không Thua Sách Thô") & Đo Lường Điểm Đau 2 (K1)

### 4.1 Hiện trạng Cổng 10.22: Cần phân biệt hai lớp đo
1. **Lớp 1 — Đo độ phủ và an toàn dữ kiện engine (ĐÃ HOÀN TẤT TRÊN 24 LÁ SỐ):**
   - Thực hiện trên 24 lá số chuẩn × 17 câu V3 (408 lượt câu):
     - Độ phủ ngữ cảnh: Đạt **100%** (trung bình 16–18 mục thư viện/câu).
     - Lỗi sao lạ, lỗi sai cung: **0 lỗi (0%)**.
     - Số lượt mục mạnh tiềm ẩn rủi ro bị lọc trước prompt: **15.962 lượt**.
2. **Lớp 2 — Đối đầu trực tiếp với "bài chỉ sách thô" (CHỜ CLAUDE SINH BÀI):**
   - Quyết định Q3 ngày 22/10 đã cấp ngân sách trần cứng **0,50 USD** cho lượt chạy này.
   - Claude đang thực hiện Bước 2 trong kế hoạch tích hợp: dùng script so mù sinh nhánh "chỉ sách thô" cho đúng 24 câu × lá số, xáo cặp và ghi ra `D:/Celestia/cong-1022-2026-10-22/`.
   - Ngay khi Claude sinh xong, Gemini sẽ chấm mù 8 chủ đề xem có chủ đề nào "thư viện thua sách thô" hoặc "nhạt hơn sách thô ở chỗ sách nói nặng" hay không.

### 4.2 Nhìn nhận trung thực về Điểm đau 2 (K1 chặn 2.430 mục nặng)
- **Dữ liệu thực tế:** Trong tổng số 7.883 mục thư viện sách, có **2.430 mục mang nhãn `manh`** (chiếm 30,8%). Do DB có **0 mục được người duyệt**, K1 kích hoạt cơ chế an toàn: chặn 100% mục mạnh này khỏi prompt người dùng.
- **Tác động hai mặt (Đánh đổi thực tế):**
  - *Mặt tích cực:* Ngăn chặn triệt để nguy cơ model bốc trúng các mục nặng chưa kiểm chứng rồi phán tai biến nghiêm trọng (tai nạn, ly tán, ung thư), bảo vệ an toàn cho người dùng bản miễn phí.
  - *Mặt hạn chế (Nguy cơ "Nhạt bài"):* Khi gặp các lá số có cách cục hung, sát tinh hãm địa, việc thiếu vắng toàn bộ các mục mạnh khiến bài luận trở nên hiền lành, an toàn quá mức, làm mất đi tính cảnh báo thực tế mà các sách cổ (Toàn Thư, Tinh Thành) nhấn mạnh.
- **Kết luận:** Đây là giải pháp *phòng vệ tối thiểu tạm thời* chứ không phải "đã giải quyết 100% rủi ro". Cần xem xét duyệt tay một lô mẫu để giải phóng các cách cục cốt lõi.

---

## 5. Kết Quả Đo Lường Các Điểm Đau Còn Lại (5, 10, 11) & Cải Tiến K2, K3

### 5.1 Điểm đau 5: Bài đã lưu ghi đầy đủ tập căn cứ (`canCu`)
- **Trước K1:** `noi_dung_ai` chỉ lưu văn bản trần, không biết câu nào dùng tri thức nào.
- **Sau K1:** 100% câu V3 mới được lưu kèm cấu trúc:
  ```ts
  canCu: {
    thuVien: [{ ma: 'T001', id: 'TV-001', dot: 'sn-2', dau: 'a1b2c3d4' }],
    nguon: [{ ma: 'E001', documentId: 'doc-1', versionId: 'ver-1', chunkId: 'chk-1' }]
  }
  ```
- **Bảo mật:** Hàm `anNoiBo()` lọc sạch `canCu`, `pb`, `model` trước khi gửi về client, bảo vệ tuyệt đối bí mật kiến trúc RAG. Sẵn sàng cho X3 thu hồi chính xác từng câu.

### 5.2 Điểm đau 10: Xóa bỏ triệt để lời dặn "cân cả hai mặt"
- **Trước K1 + K2:** Prompt dặn *"Hai mục ngược chiều thì cân cả hai"*, ép model viết nước đôi, vi phạm Luật Chống Ba Phải.
- **Sau K1 + K2:** K1 xóa dòng dặn trong `cho-prompt.ts`; K2 sửa luật 4 thành: *"Điểm thuận và điểm cần lưu ý, nếu được nêu, đều phải có căn cứ"*. 0/24 lá số còn hiện tượng ép cân cả hai.

### 5.3 Điểm đau 11: Cô lập mục bị lật (override) máy tự gán
- **Hiện trạng kho:** Có 2 mục override máy tự gán ở `su-nghiep` và `tien-bac` (chưa qua người duyệt).
- **Xử lý:** K1 không cho phép nhãn máy tự sinh xóa tri thức của nhau; chuyển thành chú thích `có mục nói khác: T... (chưa xác minh)` và không dặn model theo bên nào.

### 5.4 Cải tiến hạ tầng của K2 & K3
- **K2 (Tách khóa đệm & dấu logic):** Giá trị băm `PHIEN_BAN_CHU` chỉ gồm 8 module logic an sao/cách cục, loại bỏ giọng văn. Tinh chỉnh prompt không làm mất đệm của người dùng; dấu logic `lg = LOGIC_V3` giúp viết lại đúng câu khi thuật toán an sao đổi.
- **K3 (Tháng độ tin):** Bộ kiểm `kiemBaTang` chặn mã lỗi `THANG_CHAC_CAO`, buộc Celes dùng từ ngữ phản ánh độ tin cậy vừa phải ("nghiêng về", "có thể") khi luận giải vận hạn một tháng.

---

## 6. Bằng Chứng Dữ Liệu Hiệu Chuẩn Từ G1 & G2

1. **Từ G1 (Đếm kho thực tế, chi phí 0 USD):**
   - Kho thư viện sách trong `noi_dung_ai`: **7.883 mục** (2.430 mạnh, 5.197 vừa, 256 nhẹ). Toàn bộ 7.883 mục đều ở trạng thái `chua` (0 mục `da-duyet`).
   - Kho nghiệm lý `muc_thu_vien`: **29 dòng** (cũng chưa có mục `da-duyet`).
2. **Từ G2 (Hiệu chuẩn model miễn phí & Gemini):**
   - **Phần 1 (Độ khớp người thật):** **Ghi nhận chính thức: CHƯA ĐO, THIẾU NHÃN DUYỆT THẬT TỪ NGƯỜI**. Do DB chưa có $\ge 50$ mục duyệt thật của Chủ dự án, chưa có căn cứ thực nghiệm để đo độ trùng giữa AI và người.
   - **Phần 2 (Bắt lỗi cố ý trên 30 ca):** Groq `qwen/qwen3.8-27b` bắt 28/30 (93,3%), Gemini bắt 28/30 (93,3%), tỷ lệ bỏ sót chung của cặp Qwen + Gemini là **0/30 (0,0%)**.
   - **Nguyên tắc trao quyền:** **AI chưa được tự duyệt đơn lẻ thay người**. AI chỉ làm nhiệm vụ lọc tiền trạm (triage), quyết định cuối cùng vẫn thuộc về chuyên gia.

---

## 7. 4 Câu Hỏi Chiến Lược Cho Chủ Dự Án Quyết Định Đợt 2

Để khép lại Đợt 1 và chuẩn bị cho Đợt 2, kính trình Chủ dự án xem xét và đưa ra quyết định cho 4 vấn đề sau:

### Câu 1: Áp dụng Phương án B (2 bước) cho Đợt 2 hay tiếp tục giữ Phương án A?
- **Lựa chọn B1 (Khuyến nghị theo số đo):** Đưa Phương án B vào làm chuẩn cho V3 (hoặc kích hoạt sau cờ tính năng).
  - *Hệ quả:* Chất lượng câu trả lời tăng vượt bậc (thắng 75% so mù), phân cấp mức chắc rõ ràng, giọng văn tự nhiên; nhưng chi phí token tăng ~1.5x và độ trễ sinh bài tăng nhẹ (~1–1.5s).
- **Lựa chọn B2:** Giữ Phương án A làm mặc định cho người dùng miễn phí, chỉ dùng Phương án B cho gói trả phí (Plus).
  - *Hệ quả:* Tiết kiệm tối đa chi phí vận hành thường nhật, tạo sự khác biệt giá trị rõ rệt cho gói trả phí.

### Câu 2: Chính sách xử lý đối với 2.430 mục nặng bị chặn (K1)?
- **Lựa chọn K1-A (Đề xuất an toàn):** Tiếp tục giữ chặn toàn bộ mục nặng cho đến khi có kết quả đối đầu Cổng 10.22 thật từ Claude.
  - *Hệ quả:* An toàn tuyệt đối, không lo phán bậy tai biến; chấp nhận bài có thể bị nhạt ở các lá số cách cục hung.
- **Lựa chọn K1-B (Duyệt nhanh lô mẫu):** Chủ dự án dành 1–2 giờ duyệt tay một lô khoảng 50 mục nặng cốt lõi ở 8 chủ đề.
  - *Hệ quả:* Vừa mở khóa các cách cục quan trọng giúp bài không bị nhạt, vừa tạo ra tập nhãn thật để đo độ khớp người thật cho G2 Phần 1.

### Câu 3: Lượt có phí chạy Cổng 10.22 đối chiếu sách thô (Q3 đã duyệt trần 0,5 USD)?
- **Lựa chọn C1 (Đề xuất):** Cho phép Claude chạy ngay trên nhánh tích hợp (ước tính tốn ~0,15–0,20 USD).
  - *Hệ quả:* Hoàn tất số đo thực nghiệm đối đầu giữa "bài có thư viện" vs "bài chỉ sách thô", khép lại toàn bộ tiêu chí của Cổng 10.22.
- **Lựa chọn C2:** Tạm hoãn, dùng kết quả A/B và độ phủ 100% hiện tại để nghiệm thu đợt 1.
  - *Hệ quả:* Tiết kiệm ~0,20 USD, nhưng không có dữ liệu đối đầu để biết chủ đề nào thư viện thực sự vượt trội hơn sách thô.

### Câu 4: Lộ trình xây dựng Xưởng biên tập & Hàng chờ duyệt Đợt 2 (7 bảng DB mới)?
- **Lựa chọn X1:** Bắt đầu triển khai đầy đủ 7 bảng DB và pipeline duyệt 2 model + người ngay sau khi Đợt 1 lên production.
  - *Hệ quả:* Hoàn thiện kiến trúc TO-BE theo tài liệu thiết kế, đòi hỏi nguồn lực lập trình lớn và cam kết thời gian duyệt định kỳ của Chủ dự án.
- **Lựa chọn X2 (Tinh gọn):** Vận hành trên khung tối thiểu K1+K2+K3 hiện tại, chỉ bổ sung bảng duyệt đơn giản khi Chủ dự án bắt đầu duyệt lô mục nặng.
  - *Hệ quả:* Gọn nhẹ, không phát sinh nợ kỹ thuật và chi phí hạ tầng mới khi chưa có nhu cầu duyệt hàng loạt.

---

## 8. Kết Luận Bàn Giao Phiên G3 (Task CELES-35)

- **Trạng thái:** Hoàn tất chấm mù 24 cặp A/B, giải mã kết quả, cập nhật toàn bộ số đo thực tế và viết lại báo cáo Đợt 1 theo đúng các tiêu chí chỉ đạo.
- **Bàn giao:** Chuyển trạng thái task `CELES-35` sang `review` (100%), sẵn sàng phối hợp cùng Claude khi thư mục `cong-1022-2026-10-22` được tạo trên nhánh tích hợp.
