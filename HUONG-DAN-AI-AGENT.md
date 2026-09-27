# Hướng dẫn dùng AI Agent cho Celes — dành cho người mới bắt đầu

Tài liệu này dành cho **chủ dự án**, viết theo đúng máy đang dùng: Windows, VS Code, phần mở
rộng Claude Code (bản đang cài: `2.1.283`), gõ lệnh trong ô chat của Claude Code — không phải
terminal riêng.

Nếu bạn chưa từng dùng "AI Agent" bao giờ, cứ đọc từ đầu tới cuối một lần. Không cần nhớ, tài
liệu này ở sẵn trong repo, mở lại bất cứ lúc nào.

---

## 1. AI Agent ở đây nghĩa là gì

Trước giờ bạn nhắn cho Claude kiểu: *"xem code phần Hôm nay, rồi sửa lại theo ý này"* — một
Claude làm hết mọi việc: đọc code, suy nghĩ, viết code, tự kiểm tra. Nhắn càng nhiều, Claude nhớ
càng nhiều thứ trong một phiên, phiên càng dài thì càng tốn (xem mục 6).

Giờ có thêm ba **trợ lý phụ** (gọi là *subagent*), mỗi trợ lý chỉ làm một việc, làm xong trả kết
quả về cho Claude chính rồi quên hết — không mang mọi thứ đã đọc vào cuộc trò chuyện chính của
bạn:

| Trợ lý | Việc của nó | Có được sửa code không |
|---|---|---|
| `researcher` | Đọc code hiện tại, tóm tắt lại: đang chạy thế nào, tệp nào liên quan | KHÔNG |
| `celes-domain` | Kiểm bài luận giải Tử Vi có đúng luật không (không bịa sao, không vượt dữ kiện, không lộ thuật ngữ ra mặt trước…) | KHÔNG |
| `qa` | Chạy các lệnh kiểm tra có sẵn của repo, báo cáo cái nào qua cái nào trượt | KHÔNG |

Cả ba đều **chỉ đọc**, không tự sửa file, không tự commit. Việc sửa code vẫn là Claude chính
làm, sau khi bạn đã duyệt kế hoạch.

Ba trợ lý này đã có sẵn trong repo, nằm ở `.claude/agents/`. Bạn không cần cài thêm gì.

---

## 2. Trước khi bắt đầu — ba điều bắt buộc

1. **Mở đúng thư mục trong VS Code.** File → Open Folder → chọn `d:\SAPP BA\tuvi-ai`. Nếu
   VS Code đang mở ở một thư mục khác (ví dụ `C:\Users\Dell`), Claude Code sẽ không thấy ba trợ
   lý này.
2. **Bắt đầu một phiên chat MỚI** sau khi mở đúng thư mục (nút "+" hoặc mở lại panel Claude
   Code). Cấu hình chỉ được đọc lúc phiên khởi động — một phiên đang mở từ trước sẽ không tự
   thấy trợ lý mới.
3. **Kiểm tra đã thấy đủ chưa**: gõ `/agents` vào ô chat. Nếu đúng, bạn sẽ thấy danh sách hiện ra
   3 trợ lý ở trên. Nếu danh sách trống, quay lại bước 1–2.

---

## 3. Cách làm một tính năng mới — quy trình `/build-feature`

Đây là cách dùng chính, cho việc có sửa code thật (thêm tính năng, sửa luồng). Quy trình có 5
bước, và **luôn dừng lại chờ bạn duyệt** trước khi viết một dòng code nào.

### Bước 1 — Viết yêu cầu ra một tệp (gọi là "spec")

Thay vì gõ yêu cầu trong chat rồi Claude đoán ý, bạn viết yêu cầu ra một tệp ngắn trước. Việc
này giúp Claude không hiểu sai, và bạn có bản ghi lại đã yêu cầu gì.

1. Mở thư mục `specs/` trong repo.
2. Copy tệp `specs/_MAU.md` thành một tệp mới, đặt tên ngắn gọn không dấu, ví dụ
   `specs/thong-bao-sang.md`.
3. Điền vào các mục có sẵn trong mẫu: vấn đề, mục tiêu, tiêu chí để biết là xong (càng cụ thể
   càng tốt, ví dụ "hiện đúng 1 dòng, không hiện 2 lần").
4. Không biết điền gì cũng không sao — điền phần bạn chắc, để trống phần không chắc, Claude sẽ
   hỏi lại.

### Bước 2 — Gõ lệnh

Trong ô chat, gõ:

```
/build-feature thong-bao-sang
```

(thay `thong-bao-sang` bằng đúng tên tệp bạn vừa tạo, không có `.md`)

### Bước 3 — Claude tự làm 3 việc đầu, không hỏi bạn

- Gọi `researcher` đọc code liên quan.
- Nếu việc này đụng tới lá số / luận giải / lời văn Celes, gọi thêm `celes-domain` kiểm ràng
  buộc trước.
- Ghép lại thành một **kế hoạch**: sẽ sửa tệp nào, sửa thế nào, kiểm bằng cách nào.

### Bước 4 — DỪNG LẠI, chờ bạn duyệt

Claude sẽ in ra kế hoạch rồi **không viết code**. Bạn đọc kế hoạch:

- Đồng ý → gõ "duyệt" hoặc "ok làm đi".
- Muốn đổi gì → nói luôn, Claude sửa kế hoạch rồi hỏi lại.
- Không chắc → hỏi Claude giải thích thêm, không sao cả.

### Bước 5 — Sau khi duyệt

Claude viết code theo đúng kế hoạch, rồi tự gọi `qa` chạy kiểm tra. Bạn sẽ thấy một bảng
"đạt / trượt" cho từng tiêu chí đã ghi trong spec. Nếu trượt, Claude tự sửa rồi kiểm lại (tối đa
2 lần), sau đó báo bạn kết quả cuối.

Việc còn lại (cập nhật backlog, commit, đẩy nhánh) Claude tự làm theo đúng luật đã có sẵn của
repo — bạn không cần gõ gì thêm.

---

## 4. Không cần theo quy trình trên: tự gọi từng trợ lý

Với việc nhỏ, chỉ cần hỏi — không cần sửa gì — bạn có thể gọi thẳng một trợ lý bằng lời, không
cần viết spec:

> *"Dùng trợ lý researcher, xem hiện tại trang Hành trình đang tính mốc thời gian thế nào. Đừng
> sửa gì."*

> *"Dùng trợ lý celes-domain, kiểm lại 3 câu tính cách vừa viết cho lá số này có bịa sao nào
> không."*

> *"Dùng trợ lý qa, chạy kiểm tra cho phần vừa sửa xong."*

Claude sẽ giao việc cho đúng trợ lý, đọc kết quả rồi tóm tắt lại cho bạn — bạn không thấy hết
những gì trợ lý đã đọc, chỉ thấy kết luận.

---

## 5. Muốn thêm trợ lý mới hoặc quy trình mới

Nói thẳng với Claude, ví dụ: *"Tạo thêm một trợ lý chuyên viết nội dung marketing"* — Claude sẽ
tạo một tệp mới trong `.claude/agents/`, theo đúng khuôn của ba tệp đang có. Không cần biết cú
pháp, chỉ cần mô tả trợ lý đó nên và không nên làm gì.

---

## 6. Dùng sao cho đỡ tốn — vì sao việc này quan trọng

Máy này đã dùng khoảng **3 tỷ "token"** trong 12 ngày để code Celes (đo được từ nhật ký, xem
`AI lập trình` trong file kế hoạch kinh doanh). Phần lớn không phải vì việc nhiều, mà vì **một
cuộc trò chuyện để quá lâu** — Claude phải đọc lại toàn bộ những gì đã nói từ đầu phiên ở MỖI
câu trả lời. Trò chuyện càng dài, mỗi câu trả lời sau càng tốn.

Bốn thói quen sau giúp giảm hẳn:

1. **Một việc xong thì bắt đầu phiên mới.** Gõ `/clear` (xoá sạch, bắt đầu lại) khi đã xong một
   việc, đừng nối tiếp việc mới vào cuối một cuộc trò chuyện dài đang có.
2. **Không phải việc nào cũng cần model mạnh nhất.** Gõ `/model` để chọn:
   - **Sonnet** — mặc định, dùng cho việc sửa code thường ngày. Nhanh và rẻ hơn.
   - **Opus** — chỉ bật khi cần suy nghĩ sâu: thiết kế lại một phần lớn, gỡ một lỗi khó tìm.
3. **Xem đang tốn bao nhiêu**: gõ `/context` để xem cuộc trò chuyện hiện tại đang chiếm bao
   nhiêu, gõ `/usage` để xem đã dùng bao nhiêu % hạn mức gói đang có.
4. **Việc "đọc rộng" nên giao cho `researcher`** thay vì tự đọc nhiều tệp lớn trong cuộc trò
   chuyện chính (xem mục 3–4) — đây chính là lý do ba trợ lý này giúp tiết kiệm, không chỉ giúp
   có tổ chức hơn.

Nếu một tuần mà bạn thấy báo "hết hạn mức" hơn một lần, đó là dấu hiệu nên nâng gói Claude đang
dùng — không phải dấu hiệu phải dùng ít đi.

---

## 7. Sự cố thường gặp

| Thấy gì | Vì sao | Làm gì |
|---|---|---|
| Gõ `/agents` không thấy 3 trợ lý | Đang mở sai thư mục, hoặc phiên chat mở từ trước khi cấu hình có | Mở đúng `d:\SAPP BA\tuvi-ai`, mở phiên chat mới |
| Gõ `/build-feature` báo không tìm thấy | Gõ sai tên, hoặc tệp spec chưa tạo | Kiểm lại tên tệp trong `specs/`, không gõ đuôi `.md` |
| Claude cứ viết code luôn, không dừng chờ duyệt | Bạn gõ yêu cầu thẳng trong chat, không qua `/build-feature` | Việc nhỏ thì không sao; việc lớn nên đi lại từ Bước 1 |
| Muốn xem lại đã đổi gói Claude nào chưa | — | Gõ `/model` không kèm gì để xem đang chọn gì |

---

## 8. Việc này có ảnh hưởng gì tới quy tắc hai máy không

Không đổi gì cả. Luật ở `AI-PHOI-HOP.md` (đọc trạng thái trước khi làm, làm trên nhánh riêng,
không commit thẳng lên `main`…) vẫn giữ nguyên — quy trình `/build-feature` ở trên đã tự làm
đúng các bước đó cho bạn (đọc `TRANG-THAI.md`, tạo nhánh, ghi lại khi xong).

---

## Bảng tra nhanh

| Muốn làm gì | Gõ gì |
|---|---|
| Xem có 3 trợ lý chưa | `/agents` |
| Làm tính năng mới theo quy trình đầy đủ | `/build-feature <tên-spec>` |
| Đổi model (Sonnet ⇄ Opus) | `/model` |
| Xoá sạch, bắt đầu lại | `/clear` |
| Xem cuộc trò chuyện đang nặng cỡ nào | `/context` |
| Xem đã dùng bao nhiêu % hạn mức | `/usage` |
| Gộp bớt lịch sử trò chuyện đang dài (không xoá hẳn) | `/compact` |
