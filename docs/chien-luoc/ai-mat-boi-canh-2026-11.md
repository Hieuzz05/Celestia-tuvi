# Vì sao AI "quên" khi làm Celes, và cách sửa

Ngày 06/11/2026. Bản 3: bản 2 đã qua phản biện; bản 3 sửa Q2, Q3, Q4 theo ý anh/chị và kiểm lại TRANG-THAI. Chỉ là nghiên cứu, chưa sửa mã. Task trên Board: CELES-62.

## 1. Kết luận ngắn

"AI quên" thật ra là sáu chuyện khác nhau. Từ phía anh/chị, chuyện nào trông cũng giống nhau. Gốc chung của chúng là **có quá nhiều việc dở cùng lúc, và quyết định không đi tới cuối đường**:

- quyết định đã chốt nhưng không được ghi vào luật,
- luật mới nằm trên nhánh chưa gộp,
- máy canh đã đề xuất nhưng chưa ai làm,
- nguyên tắc đã chốt nhưng mã cũ vẫn chạy theo cách cũ.

Thêm công cụ ghi nhớ không chữa được chuyện này. Cách chữa là **làm ít việc hơn cùng lúc, và đóng trọn từng việc**: chốt thì ghi, ghi thì gộp, gộp thì máy canh.

Giải pháp rút gọn, tính theo công sức:

1. Mỗi lần mở phiên, gộp bản luật mới nhất (`origin/main`) vào nhánh đang làm. Phiên nào cũng đọc cùng một bộ luật.
2. Dọn việc dở trước: 42 worktree, 22 nhánh chưa gộp, 26 việc mở trên Board. Sau đó không đặt trần cứng số việc; gom các quyết định đang treo thành một hàng để anh/chị quyết theo lô (bản 3, xem Q3).
3. Mỗi quyết định có một chỗ ở, có trạng thái "còn hiệu lực / đã bị thay", và có một bước "rà xuống mã".
4. Một việc một phiên. Thử hai lần không xong thì dừng và tóm gốc, không thử tiếp.
5. Mục nào xin anh/chị quyết thì phải đọc hiểu được mà không cần ngữ cảnh của AI.

## 2. Sáu cơ chế gây "quên", kèm chứng cứ

| # | Cơ chế | Chứng cứ (đã kiểm) | Thêm ngữ cảnh có chữa được không? |
|---|---|---|---|
| 1 | **Nhiều việc dở cùng lúc** (gốc của 2, 3, 5) | 42 thư mục trong `.git/worktrees`, 22 nhánh cục bộ chưa gộp, 26 việc mở trên Board (9 việc không đổi từ 19/10) | Không |
| 2 | **Luật nằm trên nhánh chưa gộp**, nên mỗi thư mục đọc một bản luật khác | `origin/main:AGENTS.md` dòng 43 vẫn ghi "Nam phái làm chuẩn" vì lệnh bỏ nằm ở nhánh `viec/bo-luat-nam-phai` chưa gộp; ngược lại nhánh này lại thiếu mục "Cấu hình đã xác nhận" có trên main, đúng câu anh/chị bực vì bị hỏi lại (31/10). `NHAT-KY.md:199-204` đã ghi cơ chế này ngày 19/10 | Không. Phải gộp |
| 3 | **Quyết định không đi tới cuối đường** | Đề xuất hook SessionStart từ 19/10 (`NHAT-KY.md:205`) đến nay chưa làm. Quyết định "không ép hai mặt" (C3) đã chốt nhưng mã vẫn ép (`nghieng-ve.ts:892`), và AI còn đưa lại phương án cũ (`NHAT-KY.md:211-217`). "C1 bản 4" nằm rải ở 9 tệp trong `D:\Celestia`, Board và memory riêng của Claude, không chỗ nào ghi bản nào còn hiệu lực | Một phần. Phải có bước rà xuống mã |
| 4 | **Luật có sẵn trước mặt mà AI không làm theo** | Luật "câu phủ định phải quét hết" nằm trong `cach-lam.md` (nạp mọi phiên) mà vẫn lặp lần 3 (`NHAT-KY.md:116`). Ẩn dụ "xe/đường" lặp dù đã có luật. 8/12 mục sổ bài học có ghi lặp từ lần 2 trở lên | Không. Chữ không đủ thì phải có máy canh (test) |
| 5 | **Phiên quá dài, việc trôi phạm vi** | Bốn phiên Claude dài nhất có 2.195–3.345 lượt AI, kéo dài nhiều ngày. CELES-34 có 45 mục lịch sử, ô "Xong khi" để trống, đã trôi từ "đường B" sang "tìm gốc câu khó hiểu" | Một phần |
| 6 | **AI trình bày bằng ngữ cảnh riêng của nó**, nên anh/chị "chưa hiểu", trông như AI quên | "chưa hiểu" xuất hiện 14 lần trong mẫu tin đã lọc; 3/5 mục xin quyết bị trả lại ngày 18/10 (`NHAT-KY.md:185-198`) | Không. Phải sửa cách trình bày |

Thêm một điều: không phải việc nào "mãi không xong" cũng do quên. Thử mù 6 cách viết cho thấy câu khó hiểu của Celes phần lớn đến từ năng lực model rẻ (`D:\Celestia\NGUYEN-NHAN-GOC-dien-dat-Celes-2026-11-06.md`). Việc kiểu này cần bộ đo, không cần thêm trí nhớ.

**Chưa kiểm:** chưa gắn được từng câu than của anh/chị với đúng cơ chế nào. Trong phép đo sau sẽ làm việc đó (mục 5).

## 3. Bằng chứng bên ngoài, và mức tin

| Nguồn | Loại | Nói gì | Dùng thế nào |
|---|---|---|---|
| ETH Zürich, arXiv 2602.11988 | Thực nghiệm có đối chứng, nhưng đo việc sửa lỗi trong MỘT phiên, không đo nhớ qua nhiều phiên | Tệp ngữ cảnh nói chung không tăng tỷ lệ làm xong, chi phí tăng trên 20%. Phần tổng quan repo vô ích. Luật riêng, không chuẩn thì có ích, và nhìn chung được làm theo | Giữ luật riêng của Celes, bỏ phần mô tả repo AI tự đọc được. Không dùng làm lý do "cắt mạnh" |
| Tài liệu Claude Code | Hướng dẫn của hãng | Việc phải luôn xảy ra thì dùng hook, CI hoặc deny, đừng dùng chữ. `/clear` giữa các việc. Sửa hai lần không được thì làm lại từ yêu cầu mới | Cơ chế 4 và 5 |
| Anthropic, Effective harnesses | Kinh nghiệm nội bộ, không có số | Mỗi lần làm một việc. Có danh sách việc với trạng thái đạt/chưa. Mở phiên thì đọc tiến độ và git log | Board, cổng xong |
| OpenAI, Harness engineering | Tình huống thực tế, tự báo cáo. Không mở được bản gốc, chỉ đọc bài tóm tắt | AGENTS.md là mục lục ngắn; tài liệu là nguồn sự thật; CI canh tài liệu | Hướng chung |
| DORA 2025 | Khảo sát khoảng 5.000 người, chỉ là tương quan; mới đọc trang tóm tắt | AI khuếch đại điểm mạnh lẫn điểm yếu sẵn có; làm lô nhỏ là năng lực cốt lõi | Cơ chế 1 |
| METR 2025–2026 | Thử nghiệm ngẫu nhiên có đối chứng; bản 2026 tự nhận dữ liệu chưa chắc | Người dùng tự đánh giá sai tốc độ: chậm 19% mà tưởng nhanh 20% | Phải đo, không tin cảm giác |

**Chưa có nghiên cứu nào chứng minh một cách làm trọn gói chống quên cho người làm một mình với nhiều công cụ AI.** Vì vậy giải pháp dưới đây là những bước rẻ, đảo ngược được, và có đo.

## 4. Giải pháp

### Bước 0. Đổi thói quen (không cần mã, bắt đầu ngay)

- Một việc một phiên. Đổi chủ đề thì mở phiên mới, ghi `next` lên Board trước khi đóng.
- Thử hai lần không xong: dừng lại. AI tóm gốc vấn đề, nêu giả thuyết tiếp theo và cách kiểm; anh/chị quyết tiếp hay cắt.
- Việc chất lượng (lời văn, luận) phải có bộ đo khoá trước khi thử, giống phép thử mù vừa làm.

### Bước 1. Dọn việc dở (làm TRƯỚC mọi thay đổi luật)

- Phân loại 42 worktree và 22 nhánh thành ba nhóm: gộp, bỏ, giữ. AI lập bảng, anh/chị duyệt. Không xoá nhánh, chỉ gắn nhãn rồi gỡ worktree. Việc này nằm trong CELES-23, nâng ưu tiên lên.
- Gộp ngay nhánh `viec/bo-luat-nam-phai` để main hết ghi "Nam phái làm chuẩn".
- Rà 26 việc mở trên Board: việc nào còn làm thì điền "Xong khi" kiểm được, việc nào hết cần thì đặt `dropped`.
- Sau khi dọn xong: KHÔNG đặt trần cứng (bản 3, xem Q3). Thay bằng lệnh in hàng chờ quyết định để anh/chị quyết theo lô; chuyện AI có được tự đẩy nhánh `viec/*` hay không chờ anh/chị quyết. Việc xong kỹ thuật mà chưa muốn bật thì gộp sau cờ, như Focused đang làm.

### Bước 2. Mỗi phiên đọc cùng một bộ luật

- Khi mở phiên, gộp `origin/main` vào nhánh đang làm (`git fetch` rồi `git merge origin/main`), trước khi làm gì khác. Ghi bước này vào đầu skill mở phiên. Với Claude, thêm một hook SessionStart chỉ để cảnh báo khi nhánh chậm hơn main.
- Hook KHÔNG in lại luật, để không có hai bản luật nói ngược nhau trong ngữ cảnh. Hook chỉ in `next`, `blocker`, `decision` của task đang làm. Sau mỗi lần nén (matcher `compact`), hook in lại chừng đó.
- Codex và Antigravity: thử hook trên chính máy này trước. Bản IDE của Antigravity chưa chắc chạy hook dự án. Không chạy thì để skill mở phiên làm thay.

### Bước 3. Quyết định đi tới cuối đường

- Mỗi quyết định ghi đúng một chỗ, có trạng thái "còn hiệu lực" hoặc "bị thay bởi …" (anh/chị chọn chỗ ở câu Q1).
- Mỗi quyết định có thêm một dòng **"Đã rà mã chưa"**. Quyết định nguyên tắc (như C3) chỉ coi là xong khi đã grep mã đang chạy và sửa, hoặc đã có test canh.
- Rà lại các máy canh đã đề xuất mà chưa làm (hook SessionStart 19/10, máy canh mục xin quyết, …). Mỗi cái: làm, hoặc ghi rõ là bỏ.
- Rút `AGENTS.md`: bỏ phần mô tả repo AI tự đọc được, giữ luật riêng. Làm sau Bước 1, qua nhánh và CI như mọi thay đổi khác. Không đặt chỉ tiêu số dòng cứng.

### Bước 4. Ba công cụ, cùng luật, cùng máy canh

- Không phân vai (anh/chị quyết 06/11). Công cụ nào cũng làm được mọi việc. Chỉ giữ một luật chống va chạm: tại một thời điểm, một nhánh chỉ có một công cụ viết; công cụ khác muốn làm cùng việc thì mở worktree riêng (luật này đã có trong `cach-lam.md`).
- Sửa 10 chỗ trỏ sai `.Codex/skills/...` trong 5 skill ở `.agents/skills`. Thêm một bài CI đỏ khi bản sao skill lệch bản `.claude`. Không viết bộ sinh tự động vì định dạng `.toml` của Codex khác hẳn, thêm việc phải bảo trì.
- Commit `.agents/` và `.codex/` vào git để hai công cụ kia không đọc bản cũ trên máy.
- Sửa `AGENTS.md` và `AI-PHOI-HOP.md`: hiện ghi "hai AI hai máy", không nhắc Gemini. Cách sửa phụ thuộc câu hỏi còn mở: anh/chị còn dùng máy thứ hai không (xem Q4).
- Đặt tên người ghi cho từng công cụ khi ghi Board. Hiện `config.local.json` mặc định là "Claude (máy 1)" cho cả máy, nên Codex và Gemini quên `--by` là bị ghi nhầm tên.

### Bước 5. Trình bày cho anh/chị hiểu được

- Mỗi mục xin quyết trả lời đủ: chức năng gì, người dùng gặp ở đâu, hiện chạy thế nào, đổi gì (có ví dụ), mỗi lựa chọn dẫn tới đâu, AI đề xuất gì. Luật này đã có trong `cach-lam.md`. Việc mới là đưa vào skill thành mẫu điền sẵn.

### Không làm

- Không thêm Beads, Mem0, bộ nhớ vector hay MCP memory: thêm một nguồn nữa để lệch, không có bằng chứng độc lập, cần máy chủ.
- Không áp Spec Kit hay Kiro: bằng chứng lẫn lộn, sinh thêm tài liệu dễ lệch.
- Không đặt cổng kiểu "lịch sử quá 10 dòng thì chặn": nó khuyến khích AI ghi ít đi.
- Hoãn thử Agent Teams (CELES-41) tới sau đợt đo, vì nhiều tác tử sẽ nhân lên đúng các lỗi trên.

## 5. Đo thế nào

Bản 1 lấy "số lần nén mỗi phiên" làm chỉ số chính. Chỉ số đó đã bị đánh sập vì nó phụ thuộc thiết lập `autoCompactWindow`. Nó đo độ dài phiên, không đo việc quên. Thay bằng:

| Chỉ số | Cách đo | Nền |
|---|---|---|
| Số lần anh/chị phải nhắc lại điều đã nói, **gắn với cơ chế 1–6** | Script quét log cả ba công cụ, anh/chị xác nhận 5 phút mỗi tuần | Đếm lại 30 ngày qua để có nền (đã thấy ít nhất 7 câu từ 17/10 tới 05/11) |
| Số việc đang mở và tuổi nhánh | Board, git | 26 việc mở, 22 nhánh |
| Quyết định có dòng "đã rà mã" | Sổ quyết định | 0 |
| Việc qua 2 vòng thử không đạt mà vẫn chạy tiếp | Board | CELES-34 là một ca |

Đo **4 tuần** chứ không phải 2: mỗi tuần chỉ khoảng 1–2 câu than, hai tuần không đủ để phân biệt thật với ngẫu nhiên. Cơ chế nào không giảm thì bỏ phần giải pháp tương ứng.

## 6. Hình mẫu cho dự án khác

1. Ít luật lúc đầu. Chỉ thêm luật khi đã trả giá; lặp lần hai thì làm máy canh.
2. Luật chỉ có một bản, trên main; mở phiên thì gộp main.
3. Ít việc dở; gộp nhỏ, gộp sớm.
4. Quyết định có trạng thái và có bước rà mã.
5. Board giữ trạng thái việc; một việc một phiên.
6. Bộ đo đi trước, không tin cảm giác.

## 7. Phản biện: Sập / Lung lay / Đứng được

**Sập (đã bỏ hoặc sửa trong bản này)**
- Luận đề bản 1 "đã ghi nhưng không tới được phiên cần nó" chỉ đúng một phần. Nhiều lần lặp xảy ra khi luật đã nằm trong ngữ cảnh (cơ chế 4), hoặc khi quyết định không được kéo xuống mã (cơ chế 3). Đã viết lại chẩn đoán.
- Chỉ số "số lần nén" (mục tiêu 5,2 xuống ≤1) bị thiết lập máy chi phối. Đã thay.
- "Commit thẳng main các tệp trí nhớ" bị bỏ: mâu thuẫn với chính số liệu 16% commit chỉ để sửa TRANG-THAI, bỏ qua CI, và dễ xung đột khi nhiều worktree cùng đẩy.
- Hook in luật từ `origin/main` bị bỏ: tạo ra hai bản luật trong cùng ngữ cảnh. Thay bằng gộp main lúc mở phiên.
- Câu "C1 bản 4 chỉ có ở NHAT-KY và memory" sai: nó có ở 9 tệp `D:\Celestia` và trên Board. Đã sửa. Kết luận "quyết định không có nhà" vẫn đúng.
- Thứ tự cũ (rút AGENTS.md trước khi dọn nhánh) sai. Đã đảo.

**Lung lay (đã ghi rõ giới hạn)**
- Dẫn ETH quá mức: bài đó không đo nhớ qua nhiều phiên. Đã hạ mức dùng.
- Hook của Antigravity bản IDE và của Codex chưa thử trên máy này.
- Cơ chế "ba công cụ" chưa có số đo, vì mọi số liệu đều lấy từ log Claude.
- Số liệu nhỏ: TRANG-THAI được trỏ tới từ 11 tệp trên main (bản 2 ghi 6 là đếm thiếu), thêm 2 bản sao chưa commit. CELES-34 nay ở 85%. Có 50 script test và 36 bước CI. Kiểm lại số do phiên trước đo: nhánh chậm main 56 commit (đúng); commit chỉ sửa TRANG-THAI là 91/569 (16%), không phải 99; 187 lần nén chưa kiểm lại.

**Đứng được**
- Luật nằm trên nhánh chưa gộp làm mỗi thư mục đọc một bộ luật khác: có chứng cứ độc lập.
- Không thêm Beads hay bộ nhớ vector.
- Lỗi đường dẫn `.Codex/skills` có thật: 10 chỗ trong 5 tệp.
- Một việc một phiên; thử hai lần không xong thì dừng.
- Hook sau nén chỉ nạp lại `next` và `decision` của task.

**Đổi ở bản 3 (đã qua phản biện lần 2, 06/11)**
- Rút đề xuất bỏ TRANG-THAI: chưa đủ chứng cứ (Q2).
- Bỏ trần cứng số việc: đánh sai chỗ, vì đa số việc mở là việc chờ (Q3). Luật "chờ quá 7 ngày" và "báo khi mở phiên" bị phản biện đánh sập (CELES-14 đã ghi rõ chờ gì mà vẫn đứng; chữ không có máy canh). Thay bằng lệnh in hàng chờ quyết.
- Giữ nguyên TRANG-THAI rồi dọn một lần cũng bị đánh sập (lệch lại ngay). Thay bằng hai lựa chọn tuỳ câu hỏi máy 2.
- Bỏ phân vai theo quyết định của anh/chị (Q4).

## 8. Cần anh/chị quyết

**Q1. Quyết định đã chốt nên ghi ở đâu?**
Hiện quyết định rải ở Board, `D:\Celestia`, sổ bài học và memory của Claude, không chỗ nào ghi bản nào còn hiệu lực. Ví dụ "C1 bản 4" có ở 9 tệp.
- (a) **Trên Vibe Board**, thêm một danh sách "Quyết định" cho mỗi dự án, có trạng thái hiệu lực / bị thay và dòng "đã rà mã". Board không có nhánh, tự đồng bộ, ba công cụ đều gọi được. Cần sửa `task.mjs` thêm lệnh mới.
- (b) **Một tệp trong repo** (`docs/quyet-dinh/SO.md`), đi qua nhánh như mọi thay đổi khác. Đọc bằng mắt dễ hơn, nhưng lại phụ thuộc chuyện gộp nhánh, tức đúng lỗi đang muốn chữa.
- **Đề xuất: (a)**, và vẫn làm được cho dự án khác.

**Q2. Có bỏ `TRANG-THAI.md` không? — Bản 3: KHÔNG bỏ lúc này**
Anh/chị hỏi tôi đã đủ bối cảnh để chắc chưa. Câu trả lời thẳng: **chưa đủ để bỏ**, nên tôi rút đề xuất "bỏ".

Đã kiểm (06/11, trên `origin/main` và Board):
- Tệp làm 4 việc khác nhau:
  - "Đang làm" (8 dòng): ai làm gì, nhánh nào, chạm tệp nào. **Đã lệch hết.** Board có 4 việc đang làm (CELES-34, 47, 54, 56), không việc nào có ở đây. 7 dòng là việc từ 11/10, dòng còn lại là vận hạn, đã xong trên Board.
  - "Đang vướng" (4 dòng): cảnh báo đừng đụng (Cerebras hết tiền, hai phiên cùng một thư mục…).
  - "Vừa xong" (93 dòng): lịch sử. Git log và Board đã có.
  - "Điều cả hai máy cần biết": kiến thức lâu dài (production là `main`, kho mẫu vàng rỗng, không tự đổi model). Không phải trạng thái việc.
- Luật dùng tệp này làm chỗ báo **trước khi chạm vùng Chung** (`lib/tuvi/`, `AGENTS.md`…) và **trước khi chạy SQL trên database thật** (`AI-PHOI-HOP.md`). Board **không có** trường "chạm tệp nào", chỉ có ô chữ tự do.
- 11 tệp trên main trỏ tới nó (28 chỗ): skill mở và đóng phiên `[CODE]`, `researcher`, `AGENTS.md`, `AI-PHOI-HOP.md`, `PHOI-HOP.md`, `HUONG-DAN-AI-AGENT.md`, `README.md`, CI, một tài liệu chiến lược, một chú thích trong mã.
- 30 ngày qua chỉ có 11 commit sửa tệp, lần cuối 31/10. Thực tế AI đã gần như thôi ghi vào đây.

Phản biện chỉ ra: giữ nguyên và dọn một lần thì nó sẽ lệch lại ngay, vì AI đã không ghi vào nữa. Giữ tệp cũng không giữ được tấm chắn "báo trước khi chạm vùng Chung / SQL", vì tấm chắn đó đã ngừng chạy từ khi AI thôi ghi.

Chỗ còn thiếu để quyết: **anh/chị còn dùng máy thứ hai không** (câu hỏi ở Q4). Tệp này sinh ra cho hai máy không nói chuyện được với nhau.
- (a) **Thu gọn** (đề xuất nếu chỉ còn một máy): bỏ "Đang làm" và "Vừa xong", trỏ sang Board. Chuyển "Điều cần biết" vào `AGENTS.md`. Giữ một mục ngắn "Báo trước khi chạm vùng Chung / chạy SQL". Làm trong MỘT phiên `[CODE]`, sửa đủ 11 tệp, có grep kiểm không sót chỗ nào.
- (b) **Giữ, nhưng đặt việc ghi vào bước mở phiên của skill**, dọn cả 8 dòng lệch (đề xuất nếu còn máy 2 chưa dùng Board).
- (c) Bỏ hẳn: không đề xuất, vì Board chưa có chỗ báo vùng Chung / SQL.

**Q3. Giới hạn việc làm song song — bản 3: bỏ trần cứng; chỗ tắc thật là hàng chờ anh/chị quyết**
Anh/chị hỏi giới hạn để làm gì. Mục tiêu không phải "làm cho xong nhanh", mà là **bớt chỗ dễ lệch**. Mỗi nhánh chưa gộp mang một bản luật và một bản mã khác main (cơ chế 2). Mỗi việc dở là một chỗ phải ghi `next` cho đúng; ghi sót thì phiên sau "quên" (cơ chế 1).

Kiểm kỹ lại thì trần "tối đa 2 việc đang làm" đánh sai chỗ:
- Board chỉ có **4 việc đang làm**, nhưng có **16 việc bị chặn và 7 việc chờ nghiệm thu**. Đúng như anh/chị nói, phần lớn là việc phụ thuộc hoặc chờ người. Đặt trần thì việc chờ chặn luôn việc mới, mà việc chờ lại không do AI gỡ được.
- Phản biện bắt thêm một điểm: các việc chờ **không bị AI quên**. Ví dụ CELES-14 (7 nhánh, đứng từ 11/10) đã ghi rõ từ 19/10 rằng đang chờ anh/chị quyết 10 điểm trong `D:\Celestia\BAO-CAO-CHAY-TOKEN.md`. Khoảng 10 việc khác cũng ghi "chờ chủ dự án". Chỗ tắc thật là **hàng quyết định đang treo phía anh/chị**, vì chúng nằm rải trong từng task, không có chỗ nào gom lại cho anh/chị thấy.
- Hai luật tôi đề xuất trước đó đã bị đánh sập. "Việc chờ quá 7 ngày phải xử lý" thì CELES-14 đã thoả từ lâu mà vẫn đứng. "Báo một dòng khi mở phiên" chỉ là chữ, không có máy canh, và thực tế sẽ thành 14 dòng mỗi phiên rồi bị lờ đi.

Đề xuất mới:
1. **Không đặt trần.**
2. **Một lệnh in "hàng chờ anh/chị quyết"** cho mọi dự án: gom mọi task đang chờ anh/chị, sắp theo tuổi, mỗi mục kèm câu hỏi và đề xuất của AI. Anh/chị quyết theo lô, ví dụ mỗi tuần một lần. Đây là máy, không phải chữ. Phải thêm lệnh vào `task.mjs` của Board, và tính tuổi theo lần đổi trạng thái gần nhất, không theo lần ghi gần nhất.
3. **Chuyện đẩy nhánh lên remote: anh/chị quyết, AI không tự đổi.** 7 nhánh của CELES-14 và các nhánh K1/K2 chỉ nằm trên máy này. Hỏng máy là mất, máy canh trùng ID cũng không thấy chúng. Luật hiện có nói ngược nhau: `AI-PHOI-HOP.md` ghi "không tự đẩy, push là người"; `cach-lam.md` ghi "push nhánh ngay sau commit đầu mang ID". Lựa chọn:
   - (i) Cho AI tự đẩy nhánh `viec/*`. Không đẩy lên `main`, không gộp. Mỗi lần đẩy chạy CI và dựng bản xem thử trên Vercel.
   - (ii) Giữ "push là người", sửa `cach-lam.md` cho khớp.
   - Đề xuất (i), chỉ cho `viec/*`, vì mất việc khi hỏng máy là giá cao nhất. Chưa kiểm repo công khai hay riêng tư; nếu riêng tư thì phút GitHub Actions miễn phí có trần, cần kiểm trước khi chốt.

**Q4. Phân vai ba công cụ — ĐÃ QUYẾT: không phân vai (06/11).**
Còn giữ một luật chống va chạm, không phải phân vai: một nhánh chỉ một công cụ viết tại một thời điểm. Còn một câu hỏi mở, cần để sửa `AI-PHOI-HOP.md`: anh/chị **còn dùng máy thứ hai không**? Tài liệu và Board ghi "máy 2", nhưng anh/chị nói cả ba công cụ chạy trên một máy.

**Q5. Thứ tự làm — HOÃN, chờ chốt Q1–Q3.**
Bản nháp để anh/chị xem trước: Bước 0 ngay → Bước 1 dọn → Bước 2–5 → đo 4 tuần. Mỗi bước là một phiên `[CODE]` hoặc `[SỬA LỖI]` riêng. Bước 1: AI chỉ lập bảng phân loại, anh/chị duyệt từng nhánh trước khi gỡ.

## 9. Anh/chị đã quyết (07/11/2026) và thiết kế đi kèm

| Câu | Quyết định |
|---|---|
| Q1 | Ghi quyết định trên Vibe Board, **với điều kiện trạng thái luôn được cập nhật** |
| Q2 | Giữ `TRANG-THAI.md`, đánh giá lại sau đợt đo |
| Q3 | Không giới hạn số việc. Mục tiêu thật: **AI hiểu và nắm được bối cảnh các task cũ đã trao đổi**. Đồng ý phần đề xuất (lệnh in hàng chờ quyết; AI được tự đẩy nhánh `viec/*`) |
| Q4 | Không phân vai. Anh/chị **có dùng nhiều máy** |

### 9.1 Quyết định trên Board: làm sao "luôn được cập nhật" (đã qua phản biện 07/11)

Bản đầu có 7 lớp, gồm sổ `QD-n`, cờ "đã rà mã", và chặn ở mọi lần đổi trạng thái. Phản biện đánh sập phần lớn:
- Ô `decision` hiện không bao giờ tự xoá (`core.mjs:219` chỉ xoá `blocker`). Có 7 task đã xong mà ô này vẫn còn chữ. Chặn ở mọi lần đổi trạng thái thì AI sẽ quen tay gõ cờ để vượt.
- Ô này đang bị dùng lẫn: task thì ghi câu hỏi, task thì ghi đáp án. Máy không biết việc nào còn chờ.
- Sổ `QD-n` thêm một nguồn thứ hai ngay trong Board. Ô "đã rà mã" không có máy nào kiểm được.
- Gemini chưa được cài luật Board: `setup.mjs` chỉ cài cho Claude và Codex.
- Chỗ nghẽn của mục tiêu Q3 là **TÌM**, không phải GHI. `T list` ẩn task đã xong, và không có lệnh tìm theo từ khoá. Phiên mới không biết task cũ nào liên quan, nên không bao giờ mở ra đọc.

Thiết kế sau khi sửa: nhỏ hơn, không thêm thực thể mới.
1. **Tách câu hỏi khỏi câu trả lời.** Lệnh mới `T answer <task> "..."` ghi đáp án của anh/chị kèm ngày, đóng câu hỏi và ghi vào lịch sử. Chỉ chặn ở một chỗ: task đang chờ anh/chị quyết mà chuyển sang làm tiếp khi câu hỏi chưa đóng. Không chặn ở mọi lần đổi trạng thái khác.
2. **Quyết định không thuộc task nào** thì tạo một task "QĐ: …" ở trạng thái xong, gắn nhãn `quyet-dinh`. Quyết định thay một quyết định cũ thì ghi "thay cho CELES-x", và task cũ được gắn thêm nhãn `bi-thay`.
3. **`T find <từ>`** tìm cả task đã xong, kể cả trong câu hỏi, đáp án và lịch sử. Đây là phần chính phục vụ mục tiêu "AI nắm bối cảnh task cũ". Luật đi kèm: trước khi làm một yêu cầu, AI chạy `T find` với từ khoá của yêu cầu đó.
4. **`T queue`** in các câu đang chờ anh/chị quyết, sắp theo tuổi, để anh/chị quyết theo lô.
5. **Đồng bộ không im lặng.** Hiện lệnh đọc không kéo được bản mới thì im lặng dùng dữ liệu cũ (`task.mjs:68,79`). Sửa: còn bản ghi chưa đẩy hoặc kéo lỗi thì lệnh nào cũng in cảnh báo rõ, kèm cách gỡ.
6. **Cài luật cho cả ba công cụ trên mọi máy.** `setup.mjs` cài thêm cho Gemini. Mỗi công cụ có tên người ghi riêng, dạng `<công cụ> (máy N)`. Sau đó anh/chị chạy lại `setup.mjs` một lần trên mỗi máy.
7. **Một bên thắng khi các nơi nói khác nhau:** quyết định có ngày mới nhất thắng. AI thấy chỗ nào lệch thì sửa chỗ cũ ngay, hoặc thay bằng một dòng trỏ tới task. Không chuyển hàng loạt quyết định cũ sang, chỉ chuyển khi chạm tới.

Cái chặn đặt ở `task.mjs` (đường AI dùng). Kéo thả trên giao diện web của anh/chị không bị chặn.

**Giới hạn nói thẳng:** máy chỉ bắt được khi AI có gọi lệnh. Có hai chỗ vẫn dựa vào luật chữ:
- AI quên ghi một quyết định anh/chị nói trong chat, ở task chưa có câu hỏi.
- AI quên `T find`.

Hai chỗ này được bắt bằng `T queue` hằng tuần và chỉ số "số lần anh/chị phải nhắc". Riêng Claude có thể thêm hook nhắc khi mở phiên. Codex và Gemini thì hook chưa chắc chạy được sau nén, nên không dựa vào hook.

Thay đổi này nằm trong CLI dùng chung, nên **áp cho cả dự án Your Best Version**. Hiện 8 task của YBV có ô `decision`. Cái chặn chỉ bật khi một task chờ quyết được làm tiếp, nên rủi ro thấp.

### 9.2 Q3: đẩy nhánh `viec/*`
- Repo Celestia-tuvi là **công khai** (API GitHub trả 200 không cần đăng nhập, kiểm 07/11), nên phút GitHub Actions không tính tiền. Vercel bản Hobby có trần số lần dựng mỗi ngày: con số cụ thể chưa kiểm.
- Phải sửa cho khớp: `AI-PHOI-HOP.md` ("không tự đẩy"), `AGENTS.md`, `cach-lam.md`. Luật mới: AI được đẩy `viec/*` ngay sau commit; gộp main và nghiệm thu vẫn là người.

### 9.3 Q4: nhiều máy
- `AI-PHOI-HOP.md` giữ logic nhiều máy, sửa thành "nhiều công cụ × nhiều máy".
- Tên người ghi Board theo dạng `<công cụ> (máy N)` cho từng công cụ trên từng máy.

### 9.4 Q5 (đề xuất thứ tự, chờ duyệt)
0. Ngay: thói quen (một việc một phiên, thử hai lần không xong thì dừng).
1. **Board** (repo `vibe-board`, không chạm mã Celes): làm cả 7 mục ở 9.1, dọn ô `decision` của 7 task đã xong, rồi anh/chị chạy lại `setup.mjs` trên mỗi máy. Đi trước vì mọi bước sau ghi vào đây.
2. **Dọn:**
   - Lập bảng phân loại 42 worktree / 22 nhánh. Anh/chị duyệt từng nhánh trước khi gỡ.
   - Gộp `viec/bo-luat-nam-phai`.
   - Dọn 8 dòng "Đang làm" của TRANG-THAI.
3. **Mở phiên:** gộp `origin/main` vào nhánh, chạy `T find` theo yêu cầu. Thêm hook cho Claude.
4. **Ba công cụ:**
   - Sửa đường dẫn `.Codex/`.
   - Thêm bài CI so bản sao skill.
   - Commit `.agents/` và `.codex/`.
   - Luật cho AI đẩy `viec/*`.
   - `AI-PHOI-HOP.md` viết lại cho nhiều công cụ × nhiều máy.
   - `AGENTS.md` trỏ quyết định về Board.
5. **Mẫu xin quyết** trong skill.

Sau đó đo 4 tuần, rồi đánh giá lại TRANG-THAI (Q2).
