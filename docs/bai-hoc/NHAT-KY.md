# Nhật ký bài học

Sổ thô, chỉ thêm vào cuối. Mỗi mục là một lần AI làm sai hoặc tìm ra cách tốt hơn **có cái giá thật**
(mất thời gian, lỗi lọt ra, chủ dự án phải sửa lưng, hoặc cách mới tiết kiệm đo được).
Không có giá thì không ghi, vì mục độn làm sổ mất giá trị.

Luật chưng cất được NÂNG đi chỗ khác. Sổ này giữ câu chuyện và nguyên nhân gốc để sau còn lần lại:

| Loại luật | Nâng lên |
|---|---|
| Cách làm việc của AI (kiểm, báo, phối hợp, giao tiếp) | `docs/bai-hoc/cach-lam.md` (nạp mọi phiên) |
| Bẫy kỹ thuật của một vùng mã | `docs/bay/<vùng>.md` |
| Luật sản phẩm đã trả giá | cột `Luật bất biến` của `PRODUCT-BACKLOG.xlsx` |
| Lặp lại lần 2 | **máy canh**: test, hook hoặc bước CI. Chữ rút còn một dòng trỏ tới nó |

Sổ được commit thẳng lên `main` (chủ dự án duyệt 03/10/2026), để máy kia `git pull` là thấy ngay.
`.gitattributes` khai `merge=union`, nên hai máy cùng thêm vào cuối sổ cũng không xung đột.
Cách ghi: `/bai-hoc`.

Mẫu một mục:

```
## dd/mm/yyyy · <tóm tắt ≤ 10 từ> · <vùng: quy-trinh|giao-dien|engine|ai-rag|quyen-thanh-toan|moi-truong>
- Thẻ: <3–5 từ khoá không dấu, để lần sau grep ra lần lặp>
- Chuyện gì:
- Gốc: <vì sao xảy ra, không phải nó là gì>
- Giá: <thời gian / lỗi / ai phải sửa>
- Luật: <một câu làm được>
- Nâng: <tệp đã nâng tới, hoặc "chưa — lý do">
- Lần: 1
```

---

## 03/10/2026 · Skill build-feature lệch luật mà không ai biết · quy-trinh
- Thẻ: skill, quy-trinh, tai-lieu-lech, nhieu-nguon-luat
- Chuyện gì: `.claude/skills/build-feature` (27/09) bảo tự đẩy nhánh, thiếu `phan-bien` và
  `danh-gia-tac-dong`, và dựa vào `specs/` mà thư mục này chưa từng có spec thật. Trong khi đó
  AGENTS.md đã đổi luồng.
- Gốc: luật nằm ở bốn nơi (AGENTS.md, AI-PHOI-HOP.md, memory cục bộ, skill). Sửa một nơi thì
  không có gì nhắc phải sửa ba nơi còn lại. AI-PHOI-HOP.md §4 và §5 cũng đã lệch quyết định 02/10.
- Giá: chưa lọt lỗi, nhưng ai gõ `/build-feature` sẽ bỏ qua bước phản biện.
- Luật: đổi luồng làm việc thì grep cả `.claude/skills/`, `AI-PHOI-HOP.md` và `AGENTS.md`.
  Luật cứng nằm ở AGENTS.md, skill chỉ chứa các bước.
- Nâng: AGENTS.md mục "Luồng làm việc"; build-feature đã xoá.
- Lần: 1

## 03/10/2026 · Cấp ID CEL nhìn mỗi sheet thì trùng · quy-trinh
- Thẻ: id-cel, backlog, trung-id, nhanh-chua-gop
- Chuyện gì: backlog trên `main` dừng ở CEL-185, trong khi nhánh `viec/cel-186-planner-time` đã dùng
  CEL-186 và một nhánh khác đã dùng CEL-187.
- Gốc: xlsx là tệp nhị phân, mỗi nhánh giữ một bản riêng; nhìn sheet thì không thấy ID của nhánh chưa gộp.
- Giá: đã trùng CEL-150 một lần, phải gỡ ở `87f5b0c`.
- Luật: cấp ID bằng `backlog.py xem`, script quét cả commit của mọi nhánh.
- Nâng: máy canh, là `.claude/skills/cap-nhat-backlog/backlog.py`; cach-lam.md một dòng.
- Lặp 05/10: máy 1 cấp CEL-194 (nghiệm lý QĐ-13) lúc 21:17 trên `viec/batch-p0-cel191` chưa push;
  N1 push CEL-194 (hạn lưu nhật ký, `1e80349`) lúc 21:21. Lúc cấp, nhánh kia chưa lên remote nên
  `backlog.py xem` không thể thấy. Gốc thật: chỗ duy nhất thấy được cả hai là lúc nhánh thứ hai
  push, mà ở đó không có gì canh. Giá: đổi sang CEL-196 ở `fb2b023` (ba sheet, chú thích mã, bước
  CI), gộp xlsx bằng script ba phía.
- Máy canh (05/10): CI `.github/workflows/kiem-id-cel.yml` chạy `scripts/kiem-id-cel.ts` trên MỌI
  lần đẩy (kể cả chỉ đổi xlsx). ID mới của nhánh trùng main, hoặc trùng ID mới của nhánh remote
  khác, mà khác "Tính năng" thì đỏ. Dựng lại ca 05/10 (`--dau 184fc44 --main c226d67`) thì bắt
  được. `backlog.py` nay fetch, quét Backlog của mọi nhánh remote, nhắc push ngay sau commit mang ID.
- **Đọc git log:** bốn commit `6eae482`, `bb95480`, `19f20a2`, `184fc44` ghi CEL-194 trong thông
  điệp nhưng nghĩa là **CEL-196** (nghiệm lý QĐ-13). CEL-194 thật là hạn lưu nhật ký của N1
  (`1e80349`). Không sửa lịch sử vì các commit đó đã push.
- Lần: 3

## 04/10/2026 · Bộ đo tự xác nhận qua cùng nguồn sai với guard · ai-rag
- Thẻ: guard ten, d.sao, oracle, eval tu xac nhan, van phong
- Chuyện gì: A/B văn phong CEL-186 — reviewer mù bắt Phá Toái, Thiên Y (chỉ có ở `d.sao`) trong bài, trong khi eval báo 0 tên ngoài gói.
- Gốc: guard và bộ đo cùng dựng tập tên từ `tapTenTuGoi` (có `d.sao`), nên cùng mù một chỗ; đầu mốc in tên vào khối nghiêng là cửa sau thứ hai.
- Giá: một vòng A/B ($0,11) đo trên guard hỏng, một phiên sửa + một phiên final hardening.
- Luật: tập được phép dựng từ chữ prompt đã in; bộ đo dùng oracle render prompt, không gọi hàm guard; kèm thử đột biến.
- Nâng: `docs/bay/ai-rag.md` (5 dòng cuối) + máy canh `GROUND-04` trong `scripts/test-focused.ts`.
- Lần: 2
- Lặp 16/10: `scripts/test-cach-cuc.ts` chỉ kiểm "luật có phát ít nhất một lần", không có đáp án theo sách,
  nên Nhật Nguyệt tịnh minh phát 20% lá số (đúng sách ~3%) mà bài vẫn xanh; mẫu quét lại chỉ dùng giờ
  chi lẻ nên Tả Hữu không bao giờ vào tam phương Mệnh. Sửa ở 2983612 (nhánh viec/sua-do-sang-cach-cuc):
  đáp án độc lập `DUNG_SACH` hai chiều cho 3 cách, quét giờ chẵn lẻ. Đề xuất máy canh (chờ chủ dự án):
  bài cách cục ĐỎ khi có mã cách cục phát ra mà không có dòng `DUNG_SACH`, làm cùng khung cách cục ở phiên
  [CODE] sau.

## 05/10/2026 · Sao gốc lọt làm căn cứ năm xem · engine
- Thẻ: vong thai tue, tang tue dieu, sao goc, lop thoi gian, van han, formation
- Chuyện gì: bài vận hạn 2026 và 2027 (lá 24/08/2000 20:30 nam) cùng dựng một mục trên Tang Tuế Điếu
  và Thiên Mã gặp Tuế Phá. Hai tổ hợp này đọc vòng Thái Tuế của lá GỐC, tức vòng năm sinh. Quét 60
  lá mẫu: 570 lần lọt.
- Gốc: dữ kiện không mang lớp thời gian, nên không test nào hỏi được câu "dữ kiện này có đổi khi đổi
  năm không". `theoHan` đặt tên vận hạn cho một luật quét tam phương Mệnh. Bài dài lại không có
  kiểm FORMATION như chat, nên không chặn được tên tổ hợp.
- Giá: lỗi lọt vào bài thật. Chủ dự án phải đối chiếu tay với một bài luận độc lập mới thấy.
- Luật: mỗi dữ kiện mang `lop`. Dữ kiện `ban-menh` phải giống hệt nhau giữa hai năm xem. Muốn gọi một
  tổ hợp "của năm" thì dựng từ lưu tinh, không dựng từ vòng gốc.
- Nâng: `docs/bay/engine.md` và máy canh `scripts/test-lop-du-kien.ts` (CI), trên nhánh
  `viec/van-han-lop-goc`.
- Lần: 1

## 16/10/2026 · Khẳng định hiện trạng sai, phải sửa nhiều lượt · quy-trinh
- Thẻ: hien-trang, khang-dinh, kiem-ma, doi-chieu-kho, giai-phap
- Chuyện gì: phiên giải đáp luồng luận giải vận hạn trình giải pháp kèm nhiều khẳng định về cái Celes đang
  có mà sau đó phải rút: "engine đã tính sẵn lưu tứ hoá" (chỉ v3 tự tính), "app dùng cach-cuc" (không),
  ví dụ "Bạch Hổ Quan Lộc 1 đoạn" (kho có 0), "sang cuộc chat khác là mất" (mỗi lá số chỉ MỘT luồng
  chat, đọc lại 60 tin), "Quick Read hiện ngay sau lập lá số" (chỉ là dự phòng khi v3 hỏng), "bảng độ
  sáng chưa chuẩn" (chưa đối chiếu sách; đối chiếu Tử Vi khảo luận thì khớp phần lớn).
- Gốc: khẳng định suy từ tên tệp, từ trí nhớ phiên trước nén ngữ cảnh, hoặc từ một kết luận của
  subagent mà phiên chính chưa tự kiểm; phản biện chạy SAU khi đã viết giải pháp nên bắt muộn.
- Giá: ba lượt phản biện, chủ dự án phải đọc rồi hỏi lại nhiều lần ("hiện tại làm gì có…"), tệp giải đáp
  viết lại hai lần.
- Luật: mỗi câu mô tả hiện trạng trong một giải pháp phải kèm dẫn chứng đã chạy trong CHÍNH lượt đó
  (tệp:dòng hoặc kết quả grep kho); chưa kiểm thì ghi rõ "chưa kiểm", không trình như sự thật.
- Nâng: `docs/bai-hoc/cach-lam.md` mục "Kiểm và báo". Lần 2 → máy canh trích nguyên văn trong
  `scripts/test-luat-to-hop.ts` (nhánh `viec/van-han-lop-han`, 10beac8).
- Lần: 3
- Lặp 17/10 (lần 3, hai chuyện): (a) giải pháp việc A ghi "câu Triệt tiền vận, Tuần hậu vận không có
  trong 15 cuốn"; chủ dự án phản đối, chuyen-gia-tu-vi tìm ra Ảo bí 4819 nói nguyên văn — grep của AI
  chỉ dùng vài biến thể chữ ("hậu vận", "sau 30") nên sót câu Hán Việt "hậu khán Tuần". (b) nói đường
  luận dùng "6 đoạn sách" trong khi v3 dùng 8 (hạ 4 khi thư viện khớp đủ) — số 6 chỉ của chat. Gốc
  chung: khẳng định PHỦ ĐỊNH ("không có", "chỉ có") cần quét hết mà AI dừng ở lần grep đầu. Giá: chủ
  dự án phải sửa lưng; bản 7 đẩy lên nhánh với câu sai, phải sửa lại (56636f0). Máy canh đề xuất:
  agent chuyen-gia-tu-vi bắt buộc soát mọi câu "sách không có / chỉ một sách" trước khi trình (thêm
  vào luật đầu ra của agent và mục Kiểm và báo); với mã, câu số liệu (số đoạn, mốc) phải kèm tệp:dòng.
- Lặp 17/10: trình chủ dự án luật Bạch Hổ + Lưu Hổ "đủ 2 nhóm nguồn" và được duyệt; celes-domain đọc
  lại thì Hàm số 2567/2587 nói BỘ Tang Hổ + Lưu Tang Hổ, không phải Hổ đơn — chỉ còn một nhóm. Kình
  cũng bị gắn "cung hỏi" mà sách chỉ nói Mệnh và hạn. Gốc: số dòng lấy từ bảng tần suất (đếm chữ),
  không đọc nguyên văn từng dòng trước khi trình. Giá: chủ dự án duyệt trên dữ kiện sai, phải duyệt
  lại. Máy canh: mỗi nguồn trong luật phải kèm câu trích, test mở tệp sách đúng dòng và đỏ khi không
  khớp nguyên văn / không gọi tên đủ sao; phần "bộ rộng hơn" máy không bắt — vẫn đọc bằng mắt.

## 18/10/2026 · Ẩn dụ và chữ nội bộ của AI suýt thành lời Celes · ai-rag
- Thẻ: an-du, chu-noi-bo, tieng-long, loi-luan-de-hieu, xe-duong
- Chuyện gì: chủ dự án dùng ẩn dụ "cung gốc là xe, vận hạn là đường" để giải thích cách luận. AI đưa
  luôn ẩn dụ đó vào thiết kế, rồi gợi ý câu mẫu cho Celes: "năm nay đường gồ ghề, nhưng Quan Lộc gốc
  của bạn…". Trước đó cũng đã có "nền", "lực cản", "đang đỡ", "tín hiệu" lọt từ nhãn nội bộ ra lời luận
  (dấu vết: `AN_DU_CAM` ở `lib/rag/dau-an.ts`, `CUM_TIENG_LONG_CAM` ở `lib/rag/chuan-ngon-ngu.ts`).
  Chủ dự án nói đã nhắc nhiều lần.
- Gốc: AI đặt tên khái niệm để tự nghĩ (nhãn nội bộ, ẩn dụ của chủ dự án) rồi dùng đúng tên đó trong
  prompt và câu mẫu. Không có bước nào tách "chữ để thiết kế" khỏi "chữ Celes được nói". Danh sách cấm
  chỉ quét câu thư viện (`kiemCauDauAn`) và in vào prompt; lời model sinh ra trong chat không bị quét
  bằng danh sách đó (`soatNgonNgu` chỉ bắt "yếu tố đang đỡ").
- Giá: chủ dự án phải sửa lưng lần nữa; câu mẫu sai đã nằm trong tệp phương án C1 bản 4.
- Luật: ẩn dụ chủ dự án dùng để giải thích và nhãn nội bộ (vững/yếu, nền, xe, đường, lực…) KHÔNG vào
  câu mẫu hay chữ hướng dẫn model nói. Khi thiết kế, viết luôn câu Celes sẽ nói bằng lời thường (tên sao,
  tên cung, chuyện đời cụ thể) và đọc lại câu đó như người dùng không biết tử vi.
- Nâng: `docs/bai-hoc/cach-lam.md` mục "Giao tiếp với chủ dự án". Lặp nên đề xuất máy canh: validator lời
  chat lớp hạn (sau cờ, tăng `PHIEN_BAN_VALIDATOR`) quét `CUM_TIENG_LONG_CAM` + `AN_DU_CAM` + cụm ẩn dụ
  xe/đường; giao máy 2 trong 3b (việc e).
- Lần: 2

## 17/10/2026 · Ví dụ của chủ dự án bị áp nguyên làm luật · quy-trinh
- Thẻ: vi du chu du an, hoa giai, hoi chu du an quyet, quy tac tu vi
- Chuyện gì: giải pháp việc A (vận hạn) định lấy danh sách hoá giải chủ dự án nêu làm ví dụ (Hóa Khoa,
  Giải Thần, Tử Vi, Tuần Triệt) làm luật; lại hỏi chủ dự án "có cho sao toạ thủ nặng hơn sao chiếu
  không". Kiểm sách: danh sách đó là câu Khảo luận 2109 chỉ nói về La Võng; danh sách đủ ở Khảo luận
  1671–1672; toạ thủ nặng hơn chiếu là quy tắc sẵn (Hàm số 737).
- Gốc: coi lời chủ dự án là đặc tả chuyên môn, và đẩy câu hỏi chuyên môn lên người thay vì tra sách.
  Không có bước soát chuyên môn riêng trước khi trình (phan-bien soi kiến trúc, không soi tử vi).
- Giá: chủ dự án phải sửa lưng hai lần trong một lượt; bản 5 phải làm lại.
- Luật: ví dụ của chủ dự án phải qua sách; điều có quy tắc tử vi thì không hỏi người quyết.
- Nâng: `docs/bai-hoc/cach-lam.md` (Giao tiếp); máy canh = agent `chuyen-gia-tu-vi` (nhánh
  `viec/agent-chuyen-gia-tu-vi`, gọi bắt buộc khi giải pháp chạm chuyên môn).
- Lần: 1

## 17/10/2026 · Trình mâu thuẫn sách mà không có giải pháp · quy-trinh
- Thẻ: sach nguoc nhau, mau thuan, de xuat, chuyen-gia-tu-vi
- Chuyện gì: giải pháp việc A bản 6 đưa bốn chỗ "sách nói ngược nhau" để chủ dự án tự chọn bên, không
  kèm đề xuất. Đọc lại ngữ cảnh thì ít nhất ba chỗ không ngược thật: Chìa khóa 756 "tứ sát" là Không
  Kiếp Kình Đà (mục Thiên Không), không phải Hỏa Linh; Khảo luận 2453 nói SAO Thiên Đồng còn Bổ Túc
  491 nói CÁCH Cơ Nguyệt Đồng Lương; Triệt ở Mệnh "chặn hung" và "thiếu niên vất vả" là hai mặt.
- Gốc: agent chuyên gia được dặn "nêu cả hai, KHÔNG tự chọn", và tôi chép nguyên kết quả đó lên mà
  không đọc ngữ cảnh từng câu. Câu trích một dòng tách khỏi đoạn nên trông như ngược nhau.
- Giá: chủ dự án phải sửa lưng; phải soát lại cả bốn chỗ.
- Luật: chỗ sách ngược nhau phải trình kèm đề xuất hoà giải (điều kiện hoà, hoặc nghiêng bên nào và vì
  sao); chủ dự án duyệt đề xuất chứ không tự chọn từ con số không.
- Nâng: `docs/bai-hoc/cach-lam.md` (sửa luật "ví dụ chủ dự án"); agent `chuyen-gia-tu-vi` đổi định dạng
  đầu ra thành "Sách nói ngược nhau: đề xuất để chủ dự án duyệt" (commit `7df47b1`, đã gộp main).
- Lần: 2
- Lặp 19/10: trình hai điểm chuyên môn CEL-200 (Đà La đắc địa ở đâu; Nhật Nguyệt Sửu Mùi gặp Kỵ) mà
  không đề xuất, chưa qua `chuyen-gia-tu-vi`. Chuyên gia soát xong thì cả hai chỗ AI đặt tạm đều sai:
  Đà suýt sửa engine theo phía thiểu số (Thiên Lương + Ảo bí, trong khi ~6 nhóm nói tứ mộ đắc); Nhật
  Nguyệt bị hạ mức 'giam' trong khi 4 nhóm sách nói Kỵ làm sáng, và TH 4091 bị đọc nhầm là câu bác.
  Gốc mới: luật đã có trên main nhưng phiên không thấy (xem mục 18/10 "Mục xin quyết thiếu bối cảnh").

## 18/10/2026 · Mục xin quyết thiếu bối cảnh, chủ dự án không hiểu · quy-trinh
- Thẻ: xin quyet, boi canh, chua hieu, cau hoi chu du an, tom tat qua gon
- Chuyện gì: trình phương án mã 3a' (CEL-200) kèm 5 mục cần quyết. Ba mục chủ dự án trả lời "chưa
  hiểu": "luật chỉ có một nguồn", "bỏ ép hai mặt (A/B)", "C-D theo cách rẻ". Mỗi mục chỉ nêu tên kỹ
  thuật và lựa chọn, không nói đó là chức năng gì, người dùng gặp nó ở đâu, hiện đang chạy ra sao.
- Gốc: AI viết câu hỏi từ ngữ cảnh của chính nó (tên tệp, mã bước C-D, nhãn của reviewer) sau một
  phiên dài, và coi như chủ dự án cũng đang giữ ngữ cảnh đó.
- Giá: mất một vòng hỏi lại; chủ dự án phải yêu cầu đổi cách trình.
- Luật: mỗi mục xin quyết phải có đủ: (1) chức năng gì, người dùng gặp ở đâu (chat, bài luận, bản đồ…);
  (2) hiện đang chạy thế nào; (3) đổi gì, kèm một ví dụ cụ thể; (4) mỗi lựa chọn dẫn tới đâu; (5) AI
  đề xuất gì, vì sao. Không dùng mã bước (C-D), tên reviewer hay tên tệp làm chủ ngữ.
- Nâng: `docs/bai-hoc/cach-lam.md` mục "Giao tiếp với chủ dự án". Lần 2 → đề xuất máy canh (dưới), chờ
  chủ dự án duyệt.
- Lần: 2
- Lặp 19/10: xin duyệt "tăng PHIEN_BAN_NGHIENG_LOP_HAN" mà không nói đó là gì, ảnh hưởng gì; chủ dự án
  hỏi "tăng cái gì?". Gốc lần này KHÔNG phải thiếu luật: `CLAUDE.md` nạp `docs/bai-hoc/cach-lam.md` từ
  thư mục chính, mà thư mục chính đang ở nhánh `viec/toi-uu-token` rẽ trước 17/10, còn việc làm trong
  worktree `viec/van-han-lop-han` cũng cũ → ba luật 17–18/10 (xin quyết tự đứng, sách ngược kèm hoà
  giải, chạm chuyên môn qua chuyen-gia-tu-vi) không hề có trong ngữ cảnh. Bài học lên main không tới
  được phiên đang chạy trên nhánh cũ. Giá: một vòng hỏi lại, chủ dự án phải nhắc luật.
  Máy canh đề xuất: hook SessionStart so `docs/bai-hoc/cach-lam.md` đang có với
  `git show origin/main:docs/bai-hoc/cach-lam.md`; khác thì in bản main vào ngữ cảnh (kèm dòng "bài học
  mới hơn nhánh này"). Chặn ở đầu mọi phiên, cả hai máy, không phụ thuộc nhánh đang checkout.

## 18/10/2026 · Lại đề xuất luật ép model sau khi đã chốt không ép · ai-rag
- Thẻ: ep model, hai mat, luat cung prompt, noi dep, can cu
- Chuyện gì: chủ dự án đã chốt C3 "không ép trả lời hai mặt" và đã nói nhiều lần rằng luật ép cứng làm
  model luận kém đi. Vậy mà trong mã vẫn còn "NÓI CẢ HAI MẶT, LUÔN LUÔN" (do AI thêm ngày 16/10,
  `nghieng-ve.ts:892`) cùng đoạn đổi mốc cho đủ hai phía (:636). Khi trình phương án, AI còn đưa ra
  phương án (A) giữ "cân hai mặt" để chủ dự án chọn.
- Gốc: AI coi luật ép là lưới an toàn ("cho không phán một chiều"), mà không thấy rằng khi không có căn
  cứ thì ép nói đủ hai phía chính là bắt model bịa. Quyết định ở tầng nguyên tắc (C3) không được AI
  kéo xuống rà từng câu prompt đang chạy.
- Giá: chủ dự án phải nhắc lại nguyên tắc; mất một vòng quyết.
- Luật: không thêm vào prompt luật đòi model PHẢI nói một nội dung (hai mặt, điểm đẹp, lời khuyên…)
  bất kể có căn cứ hay không. Chỉ được viết "có căn cứ thì nêu, không có thì thôi". Khi chủ dự án chốt
  một nguyên tắc về prompt, grep mọi prompt đang chạy để tìm câu trái nguyên tắc đó.
- Nâng: `docs/bay/ai-rag.md` (trong commit gỡ ép hai mặt của CEL-200, nhánh `viec/van-han-lop-han`).
- Lần: 2 (chủ dự án nói đã trao đổi các lần trước; mục C3 bản 4)

## 22/10/2026 · Timeout chưa phải lượt không tiêu tài nguyên · ai-rag
- Thẻ: timeout, usage, doi soat, ngan sach, restart
- Chuyện gì: QC X1 bắt nhánh lỗi provider ghi token dự kiến rồi xóa dấu cho cả mất mạng/timeout; bộ kiểm ban đầu chỉ có 429 nên chưa bắt được.
- Gốc: gộp phản hồi từ chối rõ với kết quả chưa biết vào cùng nhánh xử lý, coi ước lượng như usage đã quyết toán.
- Giá: một vòng sửa và bổ sung ca kiểm trước commit; chưa gọi model thật hoặc ảnh hưởng người dùng.
- Luật: timeout/mất mạng/server chưa biết kết quả phải giữ dấu đối soát, dừng fallback và chặn cả sau restart; chỉ từ chối rõ mới được tiếp tục theo hợp đồng.
- Nâng: docs/bay/ai-rag.md; ca AbortError/HTTP 500 và restart trong scripts/test-ngan-sach-thu.ts đã PASS, đăng ký CI cùng X1. Ghi trên nhánh X1 vì phiên này không được push main.
- Lần: 1
