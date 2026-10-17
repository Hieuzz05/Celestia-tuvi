# Chia việc vận hạn theo lớp hạn: máy 1 và máy 2 (17/10/2026, sửa theo chốt C1–C4 tối 17/10)

Căn cứ:
- `QUYET-DINH-van-han-dung-sao-luu.md`
- `PHUONG-AN-van-han-lop-han.md`
- `GIAI-PHAP-chot-van-han-lop-han.md` (bản 3)

Năm tệp này sẽ được chép vào repo ở `docs/chien-luoc/van-han-lop-han/` để máy 2 đọc được.

## Còn lại những việc gì để xong toàn bộ phần đã chốt

| # | Việc | Ai | Cần anh làm gì trước | Phụ thuộc |
|---|---|---|---|---|
| 1 | Đưa bài học lặp lần 2 ("dẫn sách phải đọc nguyên văn") lên main | Máy 1 | Cho phép push main | Không |
| 2 | Chép 5 tài liệu vào repo, commit trên `viec/van-han-lop-han` | Máy 1 | Không | Không |
| 3 | **Push nhánh `viec/van-han-lop-han`** (4 commit 1, 2a, 2b, 3a) | Máy 1 | **Cho phép push.** Không push thì máy 2 không có gì để tách nhánh | Việc 2 |
| 4 | **3a'**: sửa phép cân theo C1–C4 bản 3. Gồm: khoá chống đếm đôi theo (tên, lớp, cung); vị trí bộ = sao neo; hệ số 1 / 0.8 / 0.6, giáp và nhị hợp bằng 0; thang manh/vua/nhe; "rõ" khoá cho tới khi bảng đủ hai chiều; bài kiểm tỉ lệ nhãn (C3); Kình bắt hai chiều (C4) | Máy 1 | Chốt C1–C4 | Việc 3 |
| 5 | **Bảng bộ sao đợt 2**: soạn luật thuận và luật cản, mỗi luật kèm trích nguyên văn và mức, anh duyệt từng dòng | Máy 1 soạn, anh duyệt | Bổ sung sách tứ hoá (nếu có) | Việc 4 |
| 6 | **3b**: đường chat Focused nhận cờ lớp hạn, bỏ cấm "lưu Hóa", validator kiểm cặp (hoá, sao), không ép hai mặt (C3), Q-nguon, Q2 | **Máy 2** | Không (đã chốt) | Việc 3 |
| 7 | **Commit 4, phần mã**: câu `thoiDiem` của bài luận v3 xếp lớp hạn lên trước, sau cờ | **Máy 2** | Không | Việc 6 |
| 8 | Commit 4, phần kho: sửa nhãn sao trong DB thật | Máy 1 | Cho phép chạm DB (kho dùng chung, không có cờ) | Việc 7 |
| 9 | Commit 5: Hành trình (`lib/tuvi/luan-han.ts`) và khoá `\|nhip:` | Máy 1 | Không | Việc 4 |
| 10 | Chạy `eval-chat-quyet-dinh.ts` (model thật, tốn tiền) | Anh bấm | Cho phép chi | Việc 4, 6 |
| 11 | Gộp `viec/sua-do-sang-cach-cuc` vào main, sau đó gộp `viec/van-han-3b` vào `viec/van-han-lop-han` | Anh duyệt | Nghiệm thu | Việc 6 và 7 |
| 12 | Bật cờ `CELES_LOP_HAN` trên production, tăng `THE_HE_DEM` đúng lúc này (đếm chỉ-đọc trước) | Anh bấm | Bảng đạt điều kiện C2 | Tất cả |

## Vì sao chia như vậy

Máy 2 chỉ làm ở **lớp lời nói và kiểm tra**: Focused, validator, prompt, khung bài v3.
Máy 1 giữ **lớp tính toán và bộ sao**: `nghieng-ve.ts`, `luat-to-hop.ts`, `lib/tuvi/**`, DB.

Hai bên không sửa chung tệp nào. Riêng `PRODUCT-BACKLOG.xlsx` là tệp nhị phân, không gộp được; cách xử lý ghi ở mục cuối.

Máy 2 không phải chờ máy 1 chốt C1–C4. 3b chỉ đọc kết quả `tinhNghiengVe`, nên máy 1 đổi cách cân bên trong thì máy 2 không phải sửa gì.

## Việc của máy 1, theo thứ tự

1. Bài học lặp lần 2 lên main, khi anh cho phép.
2. Chép tài liệu vào repo và commit. Push khi anh cho phép.
3. Chờ anh chốt C1–C4, rồi làm 3a'. `luat-to-hop.ts` nằm trong vùng Chung, nên phải ghi TRANG-THAI lên main trước.
4. Soạn bảng bộ sao đợt 2 để anh duyệt.
5. Commit 4 phần kho, khi anh cho phép chạm DB.
6. Commit 5 Hành trình.

## Việc của máy 2

3b, rồi Commit 4 phần mã. Chi tiết nằm trong prompt dưới đây.

---

## Prompt gửi máy 2 (dán nguyên khối)

```
[CODE] CEL-200 — vận hạn theo lớp hạn, phần 3b + Commit 4 phần mã (máy 2)

Bối cảnh: chủ dự án đã chốt. Câu hỏi vận hạn xét theo lớp hạn (sao lưu, lưu tứ hoá năm,
tứ hoá đại vận, luật tổ hợp) ĐẶT TRÊN nền cung gốc. Chủ dự án chốt 17/10: cung gốc là "chiếc xe",
vận hạn là "con đường"; đường xấu mà xe tốt thì bớt xấu, và ngược lại. Không được bỏ cung gốc, mà
phải đặt cung gốc vào vận để xem có hoá giải được không. Cách cân cụ thể do máy 1 làm (3a'), đọc
mục "C1 bản 4" trong GIAI-PHAP khi có. Máy 1 đã làm xong đường chat STANDARD
(commit 3a, sau cờ CELES_LOP_HAN). Phần của bạn: đưa đường Focused và bài luận v3 theo cùng luật.

ĐỌC TRƯỚC (theo thứ tự, trên nhánh viec/van-han-lop-han):
1. AI-PHOI-HOP.md, docs/bay/ai-rag.md, docs/bay/engine.md
2. docs/chien-luoc/van-han-lop-han/QUYET-DINH-van-han-dung-sao-luu.md  (đọc mục "Lượt 4")
3. docs/chien-luoc/van-han-lop-han/PHUONG-AN-van-han-lop-han.md        (Commit 3 và Commit 4)
4. docs/chien-luoc/van-han-lop-han/CHIA-VIEC-van-han-may1-may2.md      (ranh giới)
5. git show 429fc9e --stat, rồi đọc diff phần lib/rag (commit 3a: cách đường STANDARD đã làm)

NHÁNH: git fetch; tạo worktree riêng, nhánh viec/van-han-3b tách từ origin/viec/van-han-lop-han.
KHÔNG tách từ main: các commit 1, 2a, 2b, 3a chưa có trên main.

VIỆC 3b (giữ nguyên cờ CELES_LOP_HAN; cờ tắt thì đầu ra phải giống cũ từng byte, có test chứng minh):
a. Focused nhận cờ: lopHanBat phải đi tới cả lib/rag/focused/. Gồm dungLaiBoiCanh trong
   focused/hieu-cau.ts (~212-225), hàm này gọi chonBoiCanh mà chưa truyền lopHanMoi.
   Grep mọi chỗ gọi chonBoiCanh / tinhNghiengVe, đừng chỉ sửa một chỗ.
b. Bỏ cấm "lưu Hóa" trong Focused (focused/kiem.ts mã LUU_HOA, focused/quet-ten.ts,
   focused/hop-dong.ts; test scripts/test-focused.ts). Grep lại số dòng, đừng tin số cũ.
   Thay bằng validator mới: Celes nhắc lưu Hóa X thì cặp (hoá, sao) phải có trong bảng sự thật
   (lib/tuvi/tu-hoa-han.ts: gốc ∪ lưu ∪ đại vận), đúng cung. Kèm thử đột biến: cố ý ghép sai
   cặp thì test phải đỏ.
c. KHÔNG ép model trả lời hai mặt (chủ dự án chốt C3, 17/10). Có dữ kiện hai phía thì đưa cả hai
   vào ngữ cảnh; model tự nói theo dữ kiện. Không thêm validator bắt "phải nhắc cả hai danh sách".
   (Đường STANDARD 3a đang có kiểm này; máy 1 sẽ gỡ ở 3a', bạn đừng sửa tệp đó.)
d. Q-nguon: bỏ các câu khiến Celes tự nói về hệ thống ("kho chưa có", "không có tài liệu",
   "chưa đủ căn cứ" kiểu nói về nguồn), giữ cách nói mức chắc chắn. Grep lại toàn bộ prompt,
   gồm scripts/oracle-ten-prompt.ts và docs/chien-luoc/CEL-186-ve-B-phuong-an.md. PHUONG-AN
   ghi "4 prompt", nhưng con số đó đã bị phản biện bắt thiếu.
e. Chữ nội bộ và ẩn dụ (chủ dự án đã nhắc nhiều lần, bài học 18/10 trên main): lời model sinh ra ở
   câu vận hạn (STANDARD lẫn Focused, sau cờ) phải được validator quét bằng CUM_TIENG_LONG_CAM
   (lib/rag/chuan-ngon-ngu.ts) + AN_DU_CAM (lib/rag/dau-an.ts) + cụm ẩn dụ xe/đường ("chiếc xe",
   "con đường", "mặt đường", "đường xấu", "đường tốt", "xe tốt", "xe xấu", "xe vững", "xe yếu") +
   "chồng lớp", "tín hiệu", "lực cản". Bắt được thì thay hoặc viết lại theo cơ chế sửa câu có sẵn.
   Đừng cấm chữ "xe" trần: câu sức khỏe có thể nói tai nạn xe cộ. Đừng nới soatNgonNgu (đổi
   PHIEN_BAN_NGON_NGU là xả toàn bộ đệm, phải hỏi chủ dự án). Test kèm thử đột biến.
f. Q2: sửa quyết định số 1 trong AGENTS.md theo đúng câu đã chốt trong QUYET-DINH. AGENTS.md
   thuộc vùng Chung, nên phải ghi TRANG-THAI.md lên main trước theo AI-PHOI-HOP.md.

VIỆC COMMIT 4, PHẦN MÃ (làm sau khi 3b xanh, commit riêng):
- lib/rag/v3/du-kien.ts: câu thoiDiem (TQ08, TQ09, xem v3/khung.ts:89-90 và khối du-kien.ts
  ~634-710) xếp khối lớp hạn lên trước, ngay sau là khối "nền cung gốc" (sao gốc + cách cục gốc
  của cung đang xét) để bài luận đặt cung gốc vào vận. KHÔNG xoá dữ kiện sao gốc. Khối đại vận thêm dòng
  tứ hoá đại vận theo định dạng "Hóa X vào Sao (Cung)", mở rộng regex bóc sang vai trò đại vận.
  Tất cả sau cờ CELES_LOP_HAN.
- KHÔNG đụng DB / kho tri thức (đó là phần của máy 1, cần chủ dự án cho phép).
- KHÔNG tăng THE_HE_DEM (v3/xu-ly.ts). Thế hệ đệm chỉ tăng lúc bật cờ, chủ dự án bấm.

RANH GIỚI CỨNG, không sửa:
- lib/rag/nghieng-ve.ts, lib/tuvi/luat-to-hop.ts, lib/tuvi/** (máy 1 đang sửa phép cân 3a').
  Thấy lỗi ở đó thì ghi vào báo cáo cho máy 1, không tự sửa.
- Khoá đệm, PHUONG_PHAP.phienBan, THE_HE_DEM. Riêng PHIEN_BAN_VALIDATOR thì được tăng
  (chủ dự án đã duyệt).

LUỒNG: theo Luồng B trong AGENTS.md. Đây là việc LỚN (đổi validator và prompt):
researcher → trình phương án → phan-bien → danh-gia-tac-dong → chủ dự án duyệt → viết code
(phiên chính) → celes-domain + qa + bien-tap-vi song song → soat-tai-lieu → backlog → commit.
- Mọi khẳng định về mã hay sách phải grep hoặc đọc nguyên văn trong lượt, ghi dòng dẫn
  (bài học lặp lần 2).
- Backlog: dùng CEL-200, không cấp ID mới. Ghi PRODUCT-BACKLOG.xlsx trong cùng commit, và GIỮ
  tệp JSON yêu cầu trong thư mục tạm. Lúc gộp vào viec/van-han-lop-han sẽ lấy xlsx của nhánh
  đích rồi chạy lại JSON (xlsx là nhị phân, không gộp được).
- Kiểm: node scripts/kiem-nhanh.mjs --chay. Trước khi báo xong thì chạy /kiem-truoc-push.
- KHÔNG push, không gộp. Báo cáo cuối gồm: bảng kiểm, danh sách commit, và nhắc chủ dự án
  chạy eval-chat-quyet-dinh.ts (tốn tiền, không tự chạy).
- Tệp trình chủ dự án: để ở chỗ dễ tìm trên máy 2 và in đường dẫn ra.
```

---

## Xử lý tệp backlog khi gộp

Gộp `viec/van-han-3b` vào `viec/van-han-lop-han` theo các bước:
1. Lấy `PRODUCT-BACKLOG.xlsx` của nhánh đích.
2. Chạy lại các tệp JSON của máy 2 bằng `backlog.py ghi`.

Máy 1 cũng giữ các tệp JSON của mình (`backlog-lop-han-c1/c2a/c2b/c3a.json`) để chạy lại khi gộp main.
