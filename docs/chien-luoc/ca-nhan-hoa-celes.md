# Cá nhân hoá cách Celes trả lời — quyết định đã chốt

**Ngày chốt:** 01/10/2026 · **Phiên:** `[CHIẾN LƯỢC]` · **Trạng thái:** đã duyệt, chờ thi công Phase 0–3

Tệp này ghi các quyết định đã chốt. Nó KHÔNG phải bản thiết kế để bàn lại — muốn đổi
thì mở phiên `[CHIẾN LƯỢC]` mới và ghi đè có ngày tháng.

---

## 1. Nguyên tắc gốc: WHAT khác HOW

Engine quyết định **nói GÌ**. Cá nhân hoá chỉ quyết định **nói THẾ NÀO**.

```
ENGINE
├── ketLuan        ← engine chốt
├── nghiengVe      ← engine ĐẾM, không phải model chọn
├── F###           ← dữ kiện lá số
└── E###           ← nguồn
        ↓
RESPONSE CONTRACT   ← chỉ cách trình bày
├── rhythm
├── style
├── playfulness
└── characterHook
        ↓
RENDER
```

**Không có đường ngược từ Character về Engine.**

`lib/rag/bang-chung.ts` đã ghi sẵn luật này trong chú thích của `ketLuan`:
*"Hướng nghiêng do ENGINE đếm, không do model chọn — xem `nghieng-ve.ts`. Model chỉ
viết câu chữ quanh hướng đã chốt."*

Vì vậy `response_contract` **CẤM** chứa bất kỳ trường nào sau đây:

```
direction · leaning · recommendation · decision
better_option · positive/negative conclusion
```

---

## 2. `ResponseContract` — bản chốt Phase 3

```ts
type ResponseContract = {
  rhythm: 'COMPACT' | 'MEDIUM' | 'DEEP';
  style: 'PRACTICAL' | 'ANALYTICAL' | 'COMPANION';
  playfulness: 0 | 1 | 2;
  characterHook: 'NONE' | 'INSIGHT_FOUND' | 'DRY_HUMOR' | 'LIGHT_TEASE';
};
```

### Playfulness — ba bậc, không phải bốn

| Bậc | Tên | Cho phép gì |
|---|---|---|
| 0 | SERIOUS / OFF | Không đùa, không trêu, không giọng khô hài |
| 1 | SUBTLE — **mặc định** | Chữ sắc hơn, một nhận xét nhẹ, `INSIGHT_FOUND` |
| 2 | PLAYFUL | `DRY_HUMOR`, `LIGHT_TEASE` |

**Vì sao bỏ bậc 3:** không viết được bộ kiểm phân biệt "vui" với "vui hơn".
Theo `lib/rag/chuan-ngon-ngu.ts:15` — *"luật không đo được là luật sẽ trôi."*

Nhân vật Celes trên mạng xã hội vẫn có thể "180% personality" — nhưng đó là
**chỉ dẫn sáng tạo**, không phải enum chạy trong chat.

### Bảng hook theo bậc

| Hook | Bậc 0 | Bậc 1 | Bậc 2 |
|---|:---:|:---:|:---:|
| `INSIGHT_FOUND` | Có* | Có | Có |
| `DRY_HUMOR` | Không | Không | Có |
| `LIGHT_TEASE` | Không | Không | Có |

`*` Bậc 0 **do SafetyOverlay ép** → `characterHook = NONE`, không ngoại lệ.
Bậc 0 **do người dùng thích nghiêm túc** → vẫn được `INSIGHT_FOUND` ở dạng trung tính,
để người thích nghiêm túc vẫn thấy Celes có cá tính.

---

## 3. SafetyOverlay nằm NGOÀI contract

```ts
type SafetyOverlay = {
  seriousness: 'NORMAL' | 'SENSITIVE' | 'CRITICAL';
  topic: SeriousTopic | null;
};
```

```
if seriousness != NORMAL:
    playfulness = 0
    characterHook = NONE
```

**An toàn luôn thắng. Model không được ghi đè.**

An toàn là lớp PHỦ, không phải một Kiểu — nó không ép câu trả lời sang `COMPANION`,
Nhịp × Kiểu giữ nguyên.

---

## 4. Flourish đếm bằng SỰ KIỆN, không đếm CHỮ

Đây là quyết định quan trọng nhất của bản chốt.

**Không đưa** các câu đặc trưng ("Khoan.", "Mình không phán xét. Mình chỉ nhớ.") vào
`CUM_QUEN_TAY` (`lib/rag/so-y.ts:215-218`). Vào đó thì luật hiện hành chặn sau MỘT lần
dùng mỗi chủ đề — mâu thuẫn với việc muốn chúng tạo nhân dạng.

Thay vào đó: `characterHook` là một **trường enum**. Schema chỉ có một trường ⇒ mỗi câu
trả lời đúng 0 hoặc 1 hook. **Không cần NLP, không cần bộ đếm mới.**

Điều này thoả nguyên tắc `lib/rag/ngon-ngu.ts:12-18`:
*"Mọi luật ở đây đều là luật ĐẾM, không phải luật đọc hiểu."*

### Câu đặc trưng là VÍ DỤ, không phải LUẬT

Mọi câu signature trong `nhan-vat-celes.md` mang nhãn **DESIGN EXAMPLE — NOT RUNTIME RULE**.
Model được viết biến thể. Bộ kiểm chỉ quan tâm `characterHook ≤ 1`, không quan tâm có
dùng đúng chữ "Khoan" hay không.

### Ngân sách theo chủ đề

Truy vấn trước khi render:

```sql
select 1 from chat_messages
where phien = :phien and chu_de = :chuDe and character_hook is not null
limit 1;
```

Có rồi ⇒ `characterHook = NONE`. Không giữ state trong bộ nhớ tiến trình —
Vercel serverless không giữ state giữa các request.

---

## 5. `SIDE_EYE` / `NOT_BUYING_IT` là trạng thái HÌNH, không phải hook chữ

```
ResponseContract  ≠  MascotState
```

Sau này giao diện có thể ánh xạ
`characterHook = LIGHT_TEASE` + `playfulness = 2` + mâu thuẫn trong chính lượt này
→ `SIDE_EYE`. Nhưng không nhét trạng thái hình vào hợp đồng ngôn ngữ.

---

## 6. `hoiLai` — giữ nguyên, không thêm trường

`lib/rag/bang-chung.ts` định nghĩa `hoiLai` là **ĐÚNG MỘT** câu hỏi về **dữ kiện đời thực**.
Giữ nguyên semantics đó. **Không thêm `clarificationQuestion`. Không bump `THE_HE_DEM`.**

### Luật mới thay luật cũ

| Bỏ | Thay bằng |
|---|---|
| Không đủ căn cứ → hỏi để làm rõ ý định ẩn | **Không đủ căn cứ → không bắt bài. Trả lời đúng câu đang hỏi.** |

Chỉ hỏi lại khi thiếu một dữ kiện đời thực **thực sự cần** cho việc luận.

**Cấm:** người dùng hỏi "Công việc năm sau thế nào?" → *"Bạn hỏi vậy vì đang muốn nghỉ việc đúng không?"*

**Đúng:** người dùng hỏi "Nên chọn công ty A hay B?" mà chưa nói gì về A/B →
`hoiLai`: *"Điều khác nhau lớn nhất giữa hai lựa chọn hiện tại là gì: vai trò, thu nhập hay môi trường?"*

### Vì sao quan trọng

Đo ngày 01/10/2026: `THE_HE_DEM` (`lib/rag/v3/xu-ly.ts:46`, hiện 8) **không được chat dùng** —
grep trong `app/api/hoi-dap/route.ts` và `lib/rag/tra-loi.ts` không ra kết quả nào. Nó chỉ
chi phối bài luận giải v3 (`noi_dung_ai`).

⇒ Thay đổi chỉ chạm chat có rủi ro bộ đệm **bằng 0**.
⇒ Cái giá chỉ phát sinh khi một trường mới đi vào ĐƯỜNG LUẬN GIẢI. Ghi nhớ điều này khi
tính chi phí cho Phase 4.

Chú thích tại `xu-ly.ts` ghi lại cái giá thật của một lần tăng: lá số của chủ dự án bị sinh
lại TÁM lần trong hai ngày 24–25/09. Luật: **không tăng khi chưa hỏi chủ dự án.**

---

## 7. Cấm mọi câu thống kê tần suất

Không dùng, dù đã làm mờ con số:

```
"Bạn đã quay lại chủ đề tài chính khá nhiều."
"lần thứ 7"  ·  "nhiều lần"  ·  "liên tục hỏi"
```

Làm mờ con số không đổi được bản chất — nó vẫn là thống kê giám sát.

Khi đã có `H###` (Phase 4), thay bằng ký ức có căn cứ:
*"Chuyện tài chính này có liên quan tới điều bạn từng hỏi trước đây."*

Bậc 2 được dùng *"Chủ đề tiền bạc lại xuất hiện rồi."* — **chỉ khi** có `H###` hiện hành.

---

## 8. Không đọc ý nghĩ (Phase 3)

Celes **không khẳng định** nội tâm hay ý định mà người dùng chưa nói. Lý do kỹ thuật:
engine không sinh ra dữ kiện nào về nội tâm, nên mọi khẳng định loại đó không gắn được
mã `F###`/`E###` — vi phạm `lib/rag/prompt-v3.ts:43`: *"Ý nào không có mã thì bỏ."*

Nguy hiểm hơn: `lib/rag/kiem-duyet.ts:296-331` chỉ **chặn** ý không mã khi nó nhắc tên sao
hoặc Tứ Hoá. Câu *"mình nghi bạn thực sự muốn hỏi…"* không nhắc sao nào ⇒ chỉ ở mức
`canh-bao` ⇒ **lọt**. Nên luật này phải nằm ở prompt và bộ kiểm riêng, không trông vào
bộ kiểm duyệt hiện có.

Nếu muốn chạm tới điều người dùng đang né: **hỏi, đừng khẳng định.**

---

## 9. Mâu thuẫn với lịch sử — hoãn sang Phase 4

**Phase 3:** Celes chỉ được phản ứng với mâu thuẫn nằm **ngay trong lượt hiện tại**.
Cấm nhắc lịch sử hội thoại.

**Phase 4:** thêm loại mã thứ ba.

```
F### = dữ kiện từ engine
E### = nguồn / tri thức
H### = dữ kiện hội thoại, lịch sử người dùng
```

```json
{
  "id": "H014",
  "type": "user_fact",
  "topic": "su-nghiep",
  "key": "priority",
  "value": "stability",
  "source": "explicit_user_statement",
  "status": "active",
  "last_confirmed_at": "..."
}
```

**Luật kiểm duyệt Phase 4:** mọi câu dạng *"bạn từng…"*, *"lần trước…"*, *"trước đây…"*
bắt buộc phải có `H###`. Không có ⇒ bỏ câu.

`character_hook` **không phải** `H###`. `H###` phải đến từ bộ nhớ có cấu trúc, không
phải từ metadata của hook.

**Không thêm `H###` vào `prompt-v3` ở Phase 3.**

---

## 10. Thay đổi cơ sở dữ liệu — DUY NHẤT của Phase 3

```sql
alter table public.chat_messages
  add column if not exists character_hook text,
  add column if not exists chu_de text;
```

Hai cột nullable ⇒ không phá dữ liệu cũ, không đụng RLS, index
`(user_id, phien, tao_luc)` vẫn dùng được.

> **Hai máy dùng chung một database** (xem `AI-PHOI-HOP.md`). Bắt buộc
> `add column if not exists`, và báo máy kia sau khi chạy.

### Ràng buộc ngữ nghĩa

**`character_hook`**
- chỉ ghi ở tin nhắn của trợ lý (`vai_tro = 'tro-ly'`)
- `NULL` = không dùng hook (KHÔNG lưu chuỗi `"NONE"` — để truy vấn sạch)
- chỉ nhận: `INSIGHT_FOUND` · `DRY_HUMOR` · `LIGHT_TEASE`

**`chu_de`** — dùng ĐÚNG taxonomy đã có ở `lib/rag/planner.ts:22`:

```ts
type ChuDe = 'su-nghiep' | 'tai-chinh' | 'tinh-cam' | 'gia-dao' | 'suc-khoe' | 'tong-quan';
```

**Sáu** giá trị, tiếng Việt có gạch nối. **Không tạo taxonomy song song, không dùng
tiếng Anh.** `self` và `property` KHÔNG được thêm ở Phase 3 — thêm một giá trị vào `ChuDe`
là đụng `planner.ts`, `nghieng-ve.ts`, `bai-dai.ts`, `hinh-dang-tra-loi.ts`, `bo-vang.ts`,
và bộ vàng 62 câu (đang 100%) phải chạy lại.

Hai thứ dùng lại được ngay nhờ quyết định này:
- `nghieng-ve.ts:129` + `planner.ts:75` đã có sẵn ánh xạ chủ đề → cung, Phase 4 truy hồi
  theo `chu_de` không phải viết mới.
- `lib/rag/nhat-ky.ts:51` đã ghi `y_dinh: keHoach.chuDe` vào `retrieval_runs` ⇒ chủ đề
  **đã được tính sẵn mỗi lượt**, Phase 3 chỉ việc ghi thêm.

### Chưa thêm index

Không thêm `(phien, chu_de)` ở Phase 3. Truy vấn trong một `phien` vốn đã rất hẹp.
Đo query plan thật rồi mới quyết.

---

## 11. `COMPANION` không phải `yDinh`

```
yDinh  → ý định của câu hỏi (miền nội dung)
style  → cách trình bày câu trả lời
```

Câu *"Mình vừa chia tay, liệu năm nay tình cảm còn cơ hội không?"* có
`yDinh` về dự đoán tình cảm, nhưng `style = COMPANION`.

**Không thêm `COMPANION` vào enum `yDinh`.**

---

## 12. Lá số KHÔNG dùng để chọn giọng

Đã bỏ hoàn toàn lớp "sao Mệnh → Nhịp/Kiểu".

Lý do, ghi lại để không ai dựng lại:

- Không có bằng chứng nào cho thấy hệ dựa trên ngày sinh đoán được tính cách:
  Carlson 1985 (*Nature*, thử mù kép); Dean & Kelly 2003 ("time twins", >2.000 người);
  Lu và cộng sự 2020 (173.709 người). Thần số học: không có nghiên cứu ủng hộ.
  Tử Vi: chưa có nghiên cứu nào, cả ủng hộ lẫn phản bác.
- Kể cả đoán đúng tính cách, vẫn còn **bước nhảy thứ hai**: tính cách → cách muốn được
  trả lời. Thất Sát quyết đoán không có nghĩa là thích câu ngắn.
- Đoán sai ngay trước mắt người dùng làm hại uy tín của chính lá số.

Lá số là **chất liệu nói chuyện**, không phải bộ chọn giọng.
Không bao giờ nói *"Celes đoán bạn thích kiểu này."*

**Tuổi** cũng không dùng chọn giọng — chỉ dùng gợi ý chủ đề.

---

## 13. Lộ trình 7 giai đoạn

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **0** | Dọn chữ: `tui` → `mình`/`bạn`, xưng hô, khoá EN, giọng vùng miền | Code được ngay |
| **1** | `SafetyOverlay` hợp nhất + disclaimer cố định (hằng trong mã, không để model sinh) | Code được ngay |
| **2** | Nút lái một trục + luật đếm 3-lần-đổi-mặc-định | Code được ngay |
| **3** | `ResponseContract` + `characterHook` + hai cột `chat_messages` + bộ kiểm CI | Code được ngay |
| **4** | Living Memory: `H###`, schema bộ nhớ, RLS, truy hồi, hết hạn, xung đột, `MEMORY_RECALL`, mâu thuẫn lịch sử | Chờ |
| **5** | Cá nhân hoá liên tính năng: Hôm nay / Hành trình / hộp bối cảnh — **không đổi bài luận đã lưu** | Chờ |
| **6** | Chat cho khách — chỉ sau khi có hạn mức ẩn danh + chặn tần suất + trần ngân sách | Chờ |

### Phase 3 KHÔNG có

```
Ký ức / claim lịch sử · Mâu thuẫn với lượt cũ
Đọc ý nghĩ · Trường schema mới · MEMORY_RECALL
```

Chỉ dùng: tin nhắn hiện tại + bối cảnh hiện tại + `F###`/`E###`.

---

## 14. Chat cho khách — vì sao hoãn (Phase 6)

```
anonymous → không có user_id → hạn mức hiện tại không đếm được → gọi model không trần
```

`lib/support/quota-bai-sau.ts` đếm theo `user_id`. `lib/auth/cong.ts` **không có một dòng
nào về hạn mức**. Mở trước rồi thêm hạn mức sau là vi phạm thẳng luật **Ngân sách = 0**.

### Điều kiện trước khi mở

```
cookie anon_session_id có ký
+ chặn tần suất phía máy chủ
+ dự phòng theo IP chống lạm dụng
```

Không lấy dấu vân tay thiết bị quá mức.

Hạn mức để ở biến môi trường (`lib/support/config.ts` đọc từ env — giữ đúng nếp đó):

```
ANON_CELES_CHAT_LIMIT=
```

Không hardcode con số chưa có quyết định kinh doanh. **Mặc định TẮT** cho tới khi duyệt
ngân sách.

### Chỉ nới một lý do

`canDangNhap(lyDo)` gác **năm** cửa:

| Tệp | `lyDo` |
|---|---|
| `app/api/hoi-dap/route.ts:36` | `ask_celes` ← **chỉ nới cái này** |
| `app/api/ban-doc-sau/route.ts:63` | `deep_read` |
| `app/api/hop-tuoi/route.ts:52` | `connection` |
| `app/api/diem-noi-bat/route.ts:30` | — |
| `app/api/luan-giai/route.ts:32`, `luan-giai-v3/route.ts:41` | — |

Nới chung là mở luôn luận giải sâu cho khách.

### Khách không có Living Memory

```
Khách → chỉ bối cảnh trong phiên → không có bộ nhớ lâu dài
```

Khi đăng ký mới hỏi: *"Bạn có muốn Celes lưu lại những điều hữu ích từ cuộc trò chuyện
vừa rồi không?"* — **không tự chuyển.**

---

## 15. Bộ kiểm — Phase 3

### Chặn gộp nhánh

```
response-contract-cannot-change-ketLuan
```

**Bài quan trọng nhất của toàn hệ.** Cho `nghiengVe = A`, thì dù `PRACTICAL`,
`ANALYTICAL` hay `COMPANION`, đầu ra vẫn phải nghiêng A.

Chạy **offline** (so trên `nghiengVe` do engine tính, không gọi model) ⇒ đưa vào
`.github/workflows/kiem-tra.yml` ngay từ Phase 3. **Đỏ bài này thì không gộp.**

### Các bài còn lại — Phase 3

```
same-facts-same-conclusion
seriousness-disables-playfulness
character-hook-max-one
character-hook-topic-budget
hoiLai-semantic-preserved
no-hidden-intent-claim
celes-name-budget
```

### Hoãn theo phase

```
memory-history-requires-H-id    → Phase 4
guest-chat-requires-quota       → Phase 6
```

> Tên bài viết đúng `celes-name-budget` — chữ **l thường**, không phải **I hoa**.
> Rà cả kho tránh lẫn chữ `I` hoa: tên tệp test sai là bài kiểm không bao giờ chạy.

---

## 16. Những thứ KHÔNG bị chạm

Ghi ra để lần sau không phải kiểm lại:

| Không đụng | Vì sao |
|---|---|
| `THE_HE_DEM` | Chat không dùng bộ đệm v3 |
| `TraLoiCoCauTruc` | `hoiLai` giữ nguyên, không thêm trường |
| `lib/rag/kiem-duyet.ts` | Không thêm loại mã mới ở Phase 3 |
| `lib/rag/prompt-v3.ts` | `H###` hoãn sang Phase 4 |
| `CUM_QUEN_TAY` | Câu đặc trưng là ví dụ, không phải luật chạy |
| Engine an sao `lib/tuvi/**` | Cá nhân hoá không chạm WHAT |
| Bài luận giải đã lưu | Phase 5 thêm bối cảnh, không viết lại bài |
| Ngân sách | Không dịch vụ mới, không model mới, không cron mới |

---

## 17. Còn treo

- Chữ trên nút lái thứ ba (đổi sang `COMPANION`) — chờ `bien-tap-vi`. Bỏ chữ
  "Nói với tui một chút".
- Trước khi làm lớp học dần (Phase 2 lớp 3), phải đo tỉ lệ phiên chat có quá 1 lượt và
  quá 3 lượt. Ít quá thì lớp đó gần như không chạy.
- Hệ hình ảnh nhân vật (`celes-visual-character-system.md`) — phiên riêng.
- Pháp lý / riêng tư: Luật Trẻ em (dưới 16 tuổi) và Luật BVDLCN 91/2025/QH15 (hiệu lực
  01/01/2026, Điều 24: trẻ từ 7 tuổi cần cả đồng ý của chính mình lẫn của người giám hộ)
  — chưa đánh giá, phải làm trước Phase 4 vì Living Memory lưu dữ liệu cá nhân.
