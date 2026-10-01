# Cách làm việc với Claude Code trên Celes

Tệp này viết cho **chủ dự án**, không phải cho AI. Luật dành cho AI nằm ở
`AGENTS.md` mục "Luồng làm việc".

---

## 1. Mở một phiên làm việc

Mở terminal trong VS Code ở thư mục kho, gõ `claude`.

Rồi gõ việc, **kèm dấu loại việc** ở đầu:

```
[CHIẾN LƯỢC] có nên làm tính năng so hợp đôi lứa không
[CODE] thêm lớp ngày vào Hành trình
[SỬA LỖI] mệnh bàn mobile nhấp nháy khi rê chuột
```

Dấu này để AI chọn đúng luồng. Không có dấu thì nó phải hỏi lại.

**Sau đó không cần gọi agent gì cả.** AI tự gọi theo luồng trong `AGENTS.md`.

Việc của chủ dự án trong một phiên: **duyệt phương án · nghiệm thu · bảo đẩy mã**.

---

## 2. Dấu hiệu AI làm sai luồng

| Thấy gì | Nói gì |
|---|---|
| Trình kết luận chiến lược mà **không có mục "Sập / Lung lay / Đứng được"** | "phản biện đi" |
| Bắt đầu viết mã mà chưa trình phương án | "dừng, trình phương án trước" |
| Commit xong mà không nhắc `PRODUCT-BACKLOG.xlsx` | Hook sẽ tự chặn — nhưng nếu lọt thì hỏi "backlog đâu" |

---

## 3. Đóng phiên và mở lại

### Ngữ cảnh có mất khi đóng tab không?
**Không.** Mỗi phiên lưu thành một tệp `.jsonl` ở:

```
C:\Users\Dell\.claude\projects\d--SAPP-BA-tuvi-ai\
```

### Mở lại phiên cũ

| Muốn gì | Gõ ở terminal |
|---|---|
| Tiếp phiên **gần nhất** | `claude --continue` |
| Chọn trong danh sách phiên cũ | `claude --resume` |
| Bắt đầu trắng | `claude` |

`--resume` hiện danh sách, chọn bằng phím mũi tên.

> **Chưa thử trên máy này.** `claude` không nằm trong PATH của Git Bash, nên hai
> lệnh trên chưa được xác minh ở đây. Nếu gõ ra "command not found", dùng
> PowerShell thay vì Git Bash, hoặc dùng nút lịch sử phiên của tiện ích VS Code.
> Thử một lần rồi sửa lại dòng này cho đúng.

### Khi nào tiếp, khi nào mở mới

| Tình huống | Làm gì |
|---|---|
| Việc chưa xong, cùng vùng mã | `claude --continue` |
| Việc đã xong, sang việc mới | Mở phiên mới |
| Phiên đã rất dài (chạy nhiều giờ) | Mở mới — phiên dài thì ngữ cảnh loãng, chậm, và tốn |
| Cùng vùng mã nhưng sang việc khác | Giữ tab, gõ `/clear` |

### Trước khi đóng phiên dở

```
tóm tắt trạng thái để phiên sau tiếp
```

AI ghi ra tệp và in đường dẫn. Phiên sau đưa đường dẫn đó vào là tiếp được.

**Thứ quan trọng thì đừng để trong ngữ cảnh** — bảo AI ghi vào kho và commit.
Quyết định chiến lược, phân tích đối thủ, số liệu nghiên cứu đều thuộc loại này.

---

## 4. Nhiều tab cùng lúc

**Tối đa 2–3 tab, và phải khác vùng mã.** Mỗi tab một nhánh riêng.

| An toàn | Nguy hiểm |
|---|---|
| A: `lib/rag/**` · B: `apps/celes-app/**` giao diện | A: `lib/tuvi/**` · B: `apps/celes-app/**` |
| A: phiên mã · B: phiên chiến lược | Hai phiên cùng sửa `lib/rag/` |

Cặp nguy hiểm: app đọc thẳng engine qua `@tuvi/*`, sửa engine là cả hai cùng đổi.

---

## 5. Tám subagent — chủ dự án cần nhớ gì

Hầu hết AI **tự gọi**. Chỉ cần nhớ một cái:

**`phan-bien`** — gõ "phản biện ..." khi muốn đánh sập một ý tưởng, một thiết kế,
một giải pháp. Dùng được cho mọi loại, không riêng kinh doanh:

```
phản biện màn Lá số bản Aurora 8
phản biện: có nên tách engine an sao thành gói riêng không
phản biện bài luận cung Tài Bạch này
phản biện màn này, tôi lo nhất là người dùng lần đầu không hiểu gì
```

Câu cuối là cách **ghì trọng tâm** — nêu mối lo thì nó dồn công sức vào đó.

Nó in 3–6 câu hỏi tự sinh **trước** khi phản biện. Nhìn mấy câu đó là biết nó có
soi đúng chỗ không; lệch thì nói "thêm góc pháp lý" rồi cho chạy lại.

Bảy agent còn lại (`researcher`, `qa`, `celes-domain`, `bien-tap-vi`,
`quet-doi-thu`, `soat-tai-lieu`, `soat-chi-phi`) AI tự gọi theo luồng.

---

## 6. Hook tự chặn

`.claude/hooks/truoc-commit.mjs` chặn `git commit` khi thay đổi chạm `lib/`,
`app/`, `components/`, `supabase/` mà `PRODUCT-BACKLOG.xlsx` không đổi.

Chạy tự động, không phụ thuộc AI có nhớ hay không. Muốn tắt tạm thì sửa
`.claude/settings.json` — nhưng nhớ bật lại.

---

## 7. Sửa agent

Không cần mở tệp. Bảo AI:

```
sửa phan-bien, thêm góc pháp lý vào kho góc nhìn
thêm một agent soát hiệu năng
```

Tệp agent nằm ở `.claude/agents/*.md`, đọc được như văn bản thường.
