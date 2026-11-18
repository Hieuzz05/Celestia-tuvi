# Báo Cáo Đo Đạc & Đánh Giá Đợt 1: Kho Tri Thức Celes

**Ngày báo cáo:** 22/10/2026 (Cập nhật sau phiên chấm Cổng 10.22 và rà soát của Claude)  
**Thực hiện:** Gemini (máy 1) · Phiên `G3` (Task **CELES-35**)  
**Căn cứ kế hoạch:** `D:\Celestia\KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md`  
**Căn cứ điều phối:** `D:\Celestia\DIEU-PHOI-dot-1-kho-tri-thuc-2026-10-22.md` (mục 3, 6 và soát commit `292efca`)  
**Quyết định kiến trúc:** `docs/chien-luoc/kho-tri-thuc-to-be-2026-10.md` (Quyết định 10.1–10.24, commit `2fa6042`)  
**Tệp số liệu đính kèm:** `D:\Celestia\SO-LIEU-G3-do-dot-1-2026-10-22.json`, `SO-LIEU-G1-dem-kho-tri-thuc-2026-10-22.json`, `SO-LIEU-G2-hieu-chuan-2026-10-22.json`  
**Tệp chấm mù:** 
- A/B test (24 cặp): `D:/Celestia/so-mu-ab-2026-10-22/cham-gemini.json` (lưu lúc 11:58:30 trước khi mở khóa giải)
- Cổng 10.22 (24 cặp): `D:/Celestia/cong-1022-2026-10-22/cham-gemini.json` (lưu lúc 12:39:36 trước khi mở khóa giải)  
**Ngân sách thực tế đợt 1:** **Ước ~0,39 USD** (Lượt sinh 24 cặp A/B ước ~0,27 USD, nằm trong trần A/B 1 USD; Cổng 10.22 thật **0,1233 USD** với 41 lượt gọi / 592.506 token, nằm trong trần cổng 10.22 0,50 USD theo Q3 ngày 22/10; chấm mù IDE 0 USD).

---

## 1. Đánh Giá Trạng Thái & Thang Đo Điểm Dừng (Anti-Overthinking)

> [!IMPORTANT]
> **Đánh giá thực chất tiến độ Đợt 1 theo Quy tắc Điểm Dừng:**
> - **Cấp 0 (Lỗi chặn / Sập kiến trúc): 0.** Toàn bộ 4 điểm đau chí mạng (2, 5, 10, 11) đã được cô lập an toàn bằng mã K1, K2, K3; X2 đã được Claude soát mã không sập và Codex đang sửa 4 điểm; X3 đã có phương án chặn mọi ngõ ngách trả bài.
> - **Cấp 1 (Đánh đổi / Cần số đo thực nghiệm):**
>   1. *K1 chặn toàn bộ 2.430 mục nặng:* Ngăn ngừa rủi ro phán bậy tai biến nặng khi chưa duyệt người. Tiền bạc 1–2 trên mẫu chỉ 3 câu (nếu bỏ lá 1936 thì hòa 1–1) là dấu hiệu gợi ý chứ chưa chứng minh do K1; đề xuất giữ chặn và đo thêm mẫu.
>   2. *Phương án A (1 bước) vs Phương án B (2 bước):* **B không đúng hơn A (hòa dữ kiện và nghĩa 22/24); B đọc tự nhiên hơn A 18/24**. Chi phí token của B cao hơn ~1,6 lần (usdB 0,1066 / usdA 0,0659); độ trễ sinh bài chưa đo. Trình Chủ dự án tự đọc 6 cặp mẫu trước khi quyết định chọn B hay giữ A.
> - **Cấp 2 (Chi tiết lúc viết Code):** Bàn giao checklist độc lập cho Claude (nhánh tích hợp) và Codex (nguyệt hạn X2, cổng thu hồi X3). Không viết thêm tài liệu thiết kế.
> - **Cấp 3 (Lo xa / Overthinking):** Loại bỏ việc tranh luận mở rộng xưởng biên tập 7 bảng ở Đợt 1; vận hành phương án tối thiểu trên bản Preview.

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
| | **G3** · Cổng 10.22 & Báo cáo | `CELES-35` | `viec/bao-cao-do-dot-1` (`1ccc645`) | `review` | 100% | Đã hoàn tất chấm mù 24 cặp A/B và 24 cặp Cổng 10.22; cập nhật toàn bộ số đo thực tế vào báo cáo. |
| | **X3** · Cổng thu hồi | `CELES-27` | `viec/cong-thu-hoi` | `blocked` | 35% | Codex soạn phương án thu hồi bản 2 theo 6 câu quyết của Chủ dự án và góp ý của Claude. |

---

## 3. Kết Quả Chấm Mù 24 Cặp So Mù A/B (Phương Án A vs Phương Án B)

### 3.1 Phương pháp chấm & Bảo mật khóa giải
- **Tập dữ liệu:** 24 cặp bài luận (3 lá số × 8 chủ đề V3) sinh từ `CELES-38`, lưu tại `D:/Celestia/so-mu-ab-2026-10-22/cap.jsonl`. Vị trí Phương án A (1 bước, prompt rút gọn) và Phương án B (2 bước, dàn ý cấu trúc + diễn giải tự nhiên) được xáo ngẫu nhiên thành `bai1` và `bai2`.
- **Nguyên tắc chấm mù:** Gemini chấm mù độc lập trong IDE trên 3 cột riêng biệt, ghi nhận lỗi an toàn, và lưu toàn bộ kết quả vào `D:/Celestia/so-mu-ab-2026-10-22/cham-gemini.json` lúc **11:58:30 ngày 22/10/2026 TRƯỚC KHI mở tệp `khoa-giai.json`**.
- **Ba cột đánh giá:**
  1. *Đúng dữ kiện engine:* Chỉ dùng dữ kiện có trong cặp, không bịa sao/cung ngoài tam phương tứ chính.
  2. *Đúng nghĩa theo sách:* Đối chiếu nghĩa Tử Vi chuẩn (ghi nhận "độ tin vừa" theo kết quả G2).
  3. *Tự nhiên / Giọng văn:* Đọc thấy đúng người, đúng mức chắc, không dùng từ sáo rỗng hoặc khẳng định thái quá.

### 3.2 Kết quả tổng thể sau khi giải mã (Có rà soát độc lập của Claude)
- **Cột Dữ kiện engine:** Hòa **22 / 24 cặp** (B thắng 2, A thắng 0).
- **Cột Đúng nghĩa theo sách:** Hòa **22 / 24 cặp** (B thắng 2, A thắng 0).
- **Cột Độ tự nhiên / Giọng văn:** B thắng **18 / 24 cặp**, A thắng **6 / 24 cặp**. Tổng kết `tongKet` trùng hoàn toàn với cột Tự nhiên ở cả 24 cặp.
- **Vi phạm an toàn (sức khỏe, tình cảm, con cái):** **0 vi phạm** ở cả hai phương án.
- **Khẳng định chuẩn xác:** **Phương án B không đúng hơn Phương án A; Phương án B đọc tự nhiên hơn Phương án A 18/24**.
- **Độ dài bài viết:** Không gây thiên lệch kết quả (bài dài hơn chỉ thắng ở 10/24 cặp).
- **Giới hạn đo lường:** Đợt chấm này chỉ có **1 giám khảo** (Gemini trong IDE). Chủ dự án nên tự đọc 6 cặp mẫu dưới đây trước khi đưa ra quyết định cuối cùng.
- **Chi phí vận hành B so với A:**
  - Lấy từ `so-luot.json`: `usdB = 0,1066 USD` / `usdA = 0,0659 USD` $\approx$ **1,62 lần**.
  - Số lượt gọi model: B tốn 54 lượt gọi, A tốn 35 lượt gọi.
  - *Lưu ý:* `so-luot.json` ghi nhận mốc `cap: 16` trong khi `cap.jsonl` có 24 cặp (số tiền thực tế có thể cao hơn một chút, Claude sẽ đối chiếu với log chi tiết). Tổng ước tính cho A/B giữ ở mức ~0,27 USD (nằm trong trần A/B 1 USD).

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

## 4. Kết Quả Chấm Mù Cổng 10.22 ("Không Thua Sách Thô") & Bằng Chứng Thực Nghiệm Điểm Đau 2

### 4.1 Phương pháp chấm mù Cổng 10.22
- **Dữ liệu đối đầu:** 24 cặp bài luận (3 lá số × 8 chủ đề V3) sinh từ script `scripts/sinh-cong-1022.ts` (Claude máy 1), lưu tại `D:/Celestia/cong-1022-2026-10-22/cap.jsonl`.
  - Một nhánh là **Bài có thư viện sách tối thiểu** (theo K1).
  - Một nhánh là **Bài chỉ sách thô** (thư viện tắt, chỉ đoạn sách thô).
  - Model ghim cố định: `gpt-5.6-luna`. Chi phí thực tế: **0,1233 USD** (41 lượt gọi, 592.506 token; nằm an toàn trong trần cổng 10.22 0,50 USD).
  - Bài sách thô vượt qua kiểm tra tự động **23 / 24 ca**; có **1 ca trượt kiểm** (`25/5/1936 16h nu|SN01` do máy kiểm báo lỗi hình thức `["do-dai", "cau-dai"]`, gọi 3 lần vẫn vượt trần độ dài câu).
- **Bảo mật:** Gemini chấm mù độc lập, lưu `D:/Celestia/cong-1022-2026-10-22/cham-gemini.json` lúc **12:39:36 ngày 22/10/2026 TRƯỚC KHI mở `khoa-giai.json`**.

### 4.2 Kết quả tổng thể Cổng 10.22 sau khi giải mã
- **Thư viện sách thắng:** **19 / 24 cặp (79,2%)**
- **Sách thô thắng:** **5 / 24 cặp (20,8%)**
- **Hòa:** **0 / 24 cặp**
- **Bỏ riêng cặp SN01 lá 1936 (sách thô trượt kiểm):** Kết quả là **18 – 5** (78,3%). Vì cặp này Thư viện vốn đã thắng, việc loại bỏ ca trượt kiểm này không làm thay đổi kết luận chung.
- **Lỗi an toàn:** 0 lỗi ở cả hai nhánh.

### 4.3 Đánh giá chi tiết theo từng chủ đề trong 8 chủ đề

| STT | Chủ đề V3 | Tổng số câu | Thư viện thắng | Sách thô thắng | Hòa | Đánh giá Cổng 10.22 | Khuyến nghị |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Sự nghiệp** (`su-nghiep`) | 3 câu | **2** | 1 | 0 | Thư viện thắng áp đảo | [🟢 ĐẠT — GIỮ BẬT] |
| 2 | **Tình duyên** (`tinh-duyen`) | 3 câu | **2** | 1 | 0 | Thư viện thắng áp đảo | [🟢 ĐẠT — GIỮ BẬT] |
| 3 | **Con cái** (`con-cai`) | 3 câu | **3** | 0 | 0 | Thư viện thắng tuyệt đối | [🟢 ĐẠT — GIỮ BẬT] |
| 4 | **Tiền bạc** (`tien-bac`) | 3 câu | 1 | **2** | 0 | **Thư viện THUA sách thô** | [🔴 CẢNH BÁO — XEM XÉT] |
| 5 | **Gia đình** (`gia-dinh`) | 3 câu | **2** | 1 | 0 | Thư viện thắng áp đảo | [🟢 ĐẠT — GIỮ BẬT] |
| 6 | **Sức khoẻ** (`suc-khoe`) | 3 câu | **3** | 0 | 0 | Thư viện thắng tuyệt đối | [🟢 ĐẠT — GIỮ BẬT] |
| 7 | **Ra ngoài** (`ra-ngoai`) | 3 câu | **3** | 0 | 0 | Thư viện thắng tuyệt đối | [🟢 ĐẠT — GIỮ BẬT] |
| 8 | **Tính cách** (`tinh-cach`) | 3 câu | **3** | 0 | 0 | Thư viện thắng tuyệt đối | [🟢 ĐẠT — GIỮ BẬT] |
| **TỔNG** | **8 chủ đề** | **24 câu** | **19 (79,2%)** | **5 (20,8%)** | **0** | **7 / 8 chủ đề THẮNG** | **Giữ bật 7 chủ đề, xử lý Tiền bạc** |

### 4.4 Dấu hiệu thực nghiệm về Điểm đau 2 (K1 chặn 2.430 mục nặng)
Kết quả đối đầu Cổng 10.22 cho thấy một số dấu hiệu đáng lưu ý:
1. **Tỷ số ở chủ đề Tiền bạc (1 thắng – 2 thua):**
   - Tiền bạc thua 1–2 trên mẫu chỉ gồm **3 câu hỏi**.
   - Trong 2 lần thua, có 1 lần thua ở lá `25/5/1936 16h nu|TB01` (Cung Tài Bạch có Liêm Trinh, Tham Lang hãm địa ngộ Hóa Kỵ). Tại ca này, bài thư viện do thiếu mục mạnh nên văn phong hiền lành, trong khi bài sách thô giữ được tính răn đe của sách cổ.
   - **Nếu bỏ lá 1936:** Tiền bạc hòa **1–1** trên 2 lá còn lại (lá 1990 thư viện thắng, lá 2000 sách thô thắng), và tổng tỷ số trên 2 lá 1990 + 2000 là **13–3**.
   - **Đánh giá khách quan:** Đây là **dấu hiệu gợi ý**, chưa đủ dữ liệu thống kê để chứng minh nguyên nhân chắc chắn là do K1. Cần cẩn trọng, không kết luận vội vã.
2. **Ý nghĩa đối với quyết định K1 của Chủ dự án:**
   - Cần một quyết định rõ ràng từ Chủ dự án để định hướng việc xử lý mục nặng cho các bước tiếp theo (xem chi tiết tại Câu 2 mục 7).

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

Dựa trên toàn bộ số liệu thực nghiệm của A/B test và Cổng 10.22, kính trình Chủ dự án xem xét và đưa ra quyết định:

### Câu 1: Áp dụng Phương án B (2 bước) cho Đợt 2 hay tiếp tục giữ Phương án A?
- **Lựa chọn B1 (Khuyến nghị theo độ tự nhiên):** Đưa Phương án B vào làm chuẩn cho V3 (hoặc kích hoạt sau cờ tính năng).
  - *Hệ quả:* Đọc tự nhiên hơn 18/24 cặp, phân cấp mức chắc rõ ràng; nhưng chi phí token tăng ~1,6 lần (usdB 0,1066 so với usdA 0,0659); độ trễ sinh bài chưa đo.
- **Lựa chọn B2:** Giữ Phương án A làm mặc định cho người dùng miễn phí, chỉ dùng Phương án B cho gói trả phí (Plus).
  - *Hệ quả:* Tiết kiệm chi phí vận hành cho bản miễn phí, tạo sự phân tầng giá trị rõ rệt cho gói trả phí.

### Câu 2: Chính sách xử lý đối với 2.430 mục nặng bị chặn (K1)?
- **Lựa chọn (a) (Đề xuất):** Giữ chặn toàn bộ mục nặng chưa duyệt, đo thêm mẫu đối chiếu cho chủ đề Tiền bạc.
  - *Lý do đề xuất:* Mẫu Tiền bạc hiện mới có 3 câu (thua 1–2, nếu bỏ lá 1936 thì hòa 1–1), chưa đủ bằng chứng để khẳng định K1 gây hại; việc giữ chặn bảo đảm an toàn tuyệt đối cho người dùng trong khi chờ thêm số đo thực nghiệm.
- **Lựa chọn (b):** Chủ dự án duyệt một lô nhỏ mục nặng thuộc Tiền bạc / Sức khỏe rồi đo lại.
  - *Hệ quả:* Tốn 1–2 giờ duyệt tay của Chủ dự án, giải tỏa nghi vấn "nhạt bài" ở các cách cục hung, đồng thời tạo tập nhãn thật cho G2 Phần 1.
- **Lựa chọn (c):** Bỏ chặn mục nặng (bật lại cờ `CELES_THU_VIEN_MANH_CHUA_DUYET=1`).
  - *Hệ quả:* Bài luận đậm đà như cũ, nhưng rủi ro AI phán bậy tai biến nặng (ung thư, ly hôn, phá sản) sẽ quay trở lại 100%.

### Câu 3: Chính sách đối với 8 chủ đề V3 sau kết quả Cổng 10.22?
- **Lựa chọn C1 (Đề xuất):** Giữ bật toàn bộ 7 chủ đề đã thắng áp đảo (`su-nghiep`, `tinh-duyen`, `con-cai`, `gia-dinh`, `suc-khoe`, `ra-ngoai`, `tinh-cach`); riêng chủ đề `tien-bac` vẫn tạm giữ bật nhưng ưu tiên đo thêm mẫu hoặc biên tập sớm theo Lựa chọn (b).
  - *Hệ quả:* Không làm gián đoạn trải nghiệm người dùng, tập trung theo dõi sát điểm nghi vấn duy nhất.
- **Lựa chọn C2:** Tạm tắt thư viện ở chủ đề `tien-bac`, quay về dùng thuần sách thô cho chủ đề này cho tới khi có số đo mới.
  - *Hệ quả:* Tránh được bài nhạt ở cung Tài Bạch, nhưng mất cấu trúc trích dẫn thẻ tri thức thống nhất của V3.

### Câu 4: Lộ trình xây dựng Xưởng biên tập & Hàng chờ duyệt Đợt 2 (7 bảng DB mới)?
- **Lựa chọn X1:** Bắt đầu triển khai đầy đủ 7 bảng DB và pipeline duyệt 2 model + người ngay sau khi Đợt 1 lên production.
  - *Hệ quả:* Hoàn thiện kiến trúc TO-BE theo tài liệu thiết kế, đòi hỏi nguồn lực lập trình lớn và cam kết thời gian duyệt định kỳ của Chủ dự án.
- **Lựa chọn X2 (Tinh gọn):** Vận hành trên khung tối thiểu K1+K2+K3 hiện tại, chỉ bổ sung bảng duyệt đơn giản khi Chủ dự án bắt đầu duyệt lô mục nặng.
  - *Hệ quả:* Gọn nhẹ, không phát sinh nợ kỹ thuật và chi phí hạ tầng mới khi chưa có nhu cầu duyệt hàng loạt.

---

## 8. Kết Luận Bàn Giao Phiên G3 (Task CELES-35)

- **Trạng thái:** Đã hoàn thành 100% cả Việc 1 (chấm mù A/B, sửa 4 điểm theo góp ý) và Việc 2 (chấm mù Cổng 10.22 sách thô, phát hiện dấu hiệu thực nghiệm về chủ đề Tiền bạc).
- **Kiểm định mã nguồn:** `kiem-nhanh` sạch trên tệp đã đổi (tsc đạt, lint đạt, các test liên quan đạt).
- **Bàn giao:** Đã lưu đầy đủ 2 tệp chấm mù `cham-gemini.json` (A/B và 10.22), cập nhật tệp số liệu `SO-LIEU-G3-do-dot-1-2026-10-22.json`, đồng bộ vào worktree `viec/bao-cao-do-dot-1`.
