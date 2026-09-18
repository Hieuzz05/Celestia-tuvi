# Làm Celestia trên hai máy, với hai AI

Viết cho chủ dự án. Không cần biết lập trình. Đọc hết mất khoảng 20 phút, làm
theo mục 2 mất khoảng 45 phút và chỉ phải làm một lần.

---

## 1. Trả lời thẳng bốn câu hỏi của bạn

### "Bạn code rồi đẩy toàn bộ lên GitHub, đúng không?"

Đúng, nhưng **không phải toàn bộ**. Ba thứ cố ý không nằm trên GitHub:

| Thứ | Ở đâu | Vì sao không đẩy lên |
|---|---|---|
| `.env.local` — 30 khoá bí mật | Chỉ ở máy này | Đẩy lên là lộ khoá. Ai đọc được cũng dùng được tài khoản OpenAI và database của bạn |
| `D:\Tài liệu tử vi\markdown` — 15 cuốn sách, 7,5 MB | Chỉ ở máy này | Sách có bản quyền, mà kho mã lại đang công khai |
| `D:\Celestia` — các bản đặc tả PDF | Chỉ ở máy này | Đó là tài liệu sản phẩm của bạn |

Ngoài ba thứ đó, mọi dòng mã đều ở trên GitHub. Máy mới chỉ cần tải về là có đủ.

Còn hai thư mục `node_modules` và `.next` cũng không nằm trên GitHub, nhưng chúng
tự sinh ra khi chạy `npm install`. Không phải lo.

### "Tôi quản lý theo từng branch trên Vercel được không?"

Được, và đây chính là cách nên làm.

- Nhánh `main` là **bản thật**, ở địa chỉ `celestia-tuvi.vercel.app`. Đẩy lên
  `main` là người dùng thấy ngay sau khoảng 40 giây.
- Mọi nhánh khác được Vercel dựng thành một **bản xem thử**, có địa chỉ riêng
  dạng `celestia-tuvi-git-<ten-nhanh>-....vercel.app`. Chỉ ai có link mới vào.

Nghĩa là mỗi AI làm trên nhánh của mình, có địa chỉ riêng để bạn xem, và không ai
đụng vào bản thật cho tới khi bạn đồng ý.

Có một việc phải làm một lần, xem mục 2 bước 6: bật biến môi trường cho môi
trường Preview, bằng không bản xem thử sẽ trắng vì thiếu khoá.

### "Có file nào chỉ chạy ở máy này, sang máy khác không thao tác được không?"

Có, đúng ba thứ ở bảng trên. Mục 2 hướng dẫn chuyển từng thứ.

### "Mục tiêu là phát triển hoàn toàn độc lập ở máy khác, model khác."

Làm được. Sau mục 2, máy thứ hai có đủ mã, đủ khoá, đủ tài liệu, và một database
riêng để thử. Nó không cần máy này nữa.

---

## 2. Dựng Celestia trên máy thứ hai

Làm tuần tự. Bước nào lỗi thì dừng, đừng làm tiếp.

### Bước 1 — Cài ba phần mềm

1. **Node.js 22** — <https://nodejs.org> (chọn bản LTS).
2. **Git** — <https://git-scm.com/downloads>.
3. **AI viết mã** bạn định dùng, ví dụ Claude Code hoặc Cursor.

Kiểm tra: mở Terminal (Windows gọi là PowerShell) và gõ

```bash
node -v
git --version
```

Phải ra `v22.x.x` và một dòng có chữ `git version`. Không ra thì cài lại.

### Bước 2 — Tải mã về

```bash
git clone https://github.com/Hieuzz05/Celestia-tuvi.git
cd Celestia-tuvi
npm install
```

Lệnh cuối chạy vài phút, đó là lúc nó tải thư viện.

### Bước 3 — Chép khoá bí mật sang

Ở **máy cũ**, mở tệp `.env.local` trong thư mục dự án. Chép **toàn bộ** nội dung.

Ở **máy mới**, tạo một tệp tên đúng là `.env.local` trong thư mục `Celestia-tuvi`
rồi dán vào.

> **Đừng gửi tệp này qua Zalo, Messenger hay email.** Dùng trình quản lý mật khẩu
> (Bitwarden, 1Password), hoặc USB, hoặc gõ tay. Khoá lọt ra ngoài là người khác
> tiêu tiền OpenAI của bạn và đọc được database.

Trong tệp có một dòng `CONFIG_SECRET=...`. **Hai máy phải để giống hệt nhau.**
Khác nhau thì máy kia không giải mã được các khoá model đã lưu trong database.

### Bước 4 — Chép tài liệu nguồn sang

Đây là 15 cuốn sách Tử Vi mà Celes dùng để tra cứu, cộng các bản đặc tả sản phẩm.
Không có chúng thì không nạp thêm tri thức được, và không đọc được luật luận giải.

Cách bền nhất là tạo **một kho GitHub riêng tư** cho tài liệu:

1. Vào <https://github.com/new>, đặt tên `Celestia-tai-lieu`, chọn **Private**.
2. Ở máy cũ:

```bash
cd "D:/Tài liệu tử vi"
git init
git add .
git commit -m "Tai lieu nguon Celestia"
git remote add origin https://github.com/<tên-của-bạn>/Celestia-tai-lieu.git
git push -u origin main
```

3. Ở máy mới: `git clone` kho đó về.

Sau này thêm sách mới thì chỉ cần `git add`, `git commit`, `git push` là cả hai
máy đều có.

Nếu ngại làm kho riêng thì nén hai thư mục thành zip rồi chép bằng USB cũng được.
Chỉ là lần sau thêm tài liệu lại phải chép tay lần nữa.

### Bước 5 — Cho máy mới một database riêng

**Đây là bước quan trọng nhất để hai máy không giẫm lên nhau.**

Hiện cả hai máy dùng chung một Supabase. Nghĩa là AI ở máy hai đổi cấu trúc bảng
thì mã ở máy một hỏng ngay, mà người ở máy một không hiểu vì sao.

Làm thế này:

1. Vào <https://supabase.com>, bấm **New project**. Đặt tên `celestia-dev`. Gói
   miễn phí là đủ.
2. Vào **Project Settings > API**, chép ba giá trị: `Project URL`, `anon public`,
   `service_role`.
3. Ở máy mới, sửa `.env.local`, thay ba dòng này bằng giá trị vừa chép:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Vào **SQL Editor** của dự án mới, chạy lần lượt **tám** tệp trong thư mục
   `supabase/` của mã nguồn, theo đúng thứ tự ghi trong `supabase/DA-CHAY.md`.
   Mỗi tệp: mở ra, chép hết, dán vào SQL Editor, bấm **Run**.

Giờ máy hai có database riêng. Nó thử gì cũng không chạm vào dữ liệu thật.

> Không muốn làm bước này cũng được, nhưng khi đó hai máy dùng chung một
> database. Đọc kỹ mục 4 để biết luật phải giữ.

### Bước 6 — Bật bản xem thử trên Vercel

Một lần duy nhất, ở máy nào cũng được:

1. Vào <https://vercel.com>, mở dự án Celestia.
2. Vào **Settings > Environment Variables**.
3. Với **mỗi** biến đang có, kiểm tra xem nó đã bật cho cả ba môi trường
   Production, Preview, Development chưa. Chưa thì sửa lại cho đủ.

Không làm bước này thì mọi bản xem thử đều lỗi vì thiếu khoá, và bạn sẽ tưởng AI
làm hỏng.

### Bước 7 — Kiểm tra máy mới đã sẵn sàng

```bash
npx tsx scripts/kiem-moi-truong.ts
```

Lệnh này tự kiểm ba thứ: thiếu khoá nào, thiếu bảng nào trong database, và máy
chủ đang chạy bản nào. Nó chỉ đọc, không sửa gì.

Hiện ra `SẴN SÀNG` là xong. Hiện `CẦN XỬ LÝ` thì nó nói rõ thiếu gì và phải chạy
tệp SQL nào.

Cuối cùng chạy thử:

```bash
npm run dev
```

Mở <http://localhost:3000>. Thấy trang chủ Celestia là máy hai đã chạy được.

---

## 3. Cách làm việc hằng ngày

### Quy tắc một câu

**Không ai được sửa thẳng vào `main`.** Mọi việc làm trên nhánh riêng, xong mới
gộp vào `main`.

### Một vòng làm việc đầy đủ

Mỗi lần giao việc mới cho AI, bảo nó làm đúng năm bước:

1. **Lấy bản mới nhất về**

```bash
git checkout main
git pull
```

2. **Tạo nhánh cho việc này**

```bash
git checkout -b viec/sua-trang-hanh-trinh
```

Tên nhánh luôn bắt đầu bằng `viec/` rồi mô tả ngắn, không dấu.

3. **Làm việc, kiểm tra, rồi đẩy nhánh lên**

```bash
git push -u origin viec/sua-trang-hanh-trinh
```

Vercel tự dựng một bản xem thử. Link nằm trong trang dự án trên Vercel, mục
**Deployments**.

4. **Bạn xem bản xem thử.** Ưng thì sang bước 5. Chưa ưng thì bảo AI sửa tiếp
   trên đúng nhánh đó.

5. **Gộp vào bản thật.** Vào GitHub, bấm **Compare & pull request**, rồi **Merge**.
   Khoảng 40 giây sau là bản thật cập nhật.

### Ai làm phần nào

Chia theo vùng để hai AI hiếm khi chạm cùng một tệp:

| Vùng | Thư mục | Việc điển hình |
|---|---|---|
| **A — Bộ não** | `lib/rag/`, `lib/ai/`, `app/api/` | Cách luận giải, chất lượng bài viết, model, kho tri thức |
| **B — Mặt tiền** | `components/`, `app/` (trừ `app/api`), `lib/i18n/` | Giao diện, bố cục, chữ trên nút, luồng bấm |

Vài tệp cả hai đều cần. Trước khi sửa chúng thì phải ghi vào `TRANG-THAI.md`:

- `lib/tuvi/quick-read-noi-dung.ts` — kho câu chữ, hơn 1000 dòng, ai cũng đụng
- `lib/i18n/vi.ts` và `lib/i18n/en.ts`
- `AGENTS.md`

### Bảng bàn giao

Hai AI không nói chuyện được với nhau. Tệp `TRANG-THAI.md` là chỗ chúng nói
chuyện. Bắt đầu việc thì ghi vào, xong việc thì ghi lại. Bạn chỉ cần mở tệp đó ra
là biết bên kia đang làm gì.

---

## 4. Nếu hai máy dùng chung một database

Bỏ qua mục này nếu bạn đã làm bước 5.

Ba luật, bỏ luật nào cũng hỏng:

1. **Chỉ một máy được đổi cấu trúc database tại một thời điểm.** Trước khi chạy
   tệp SQL mới, ghi vào `TRANG-THAI.md` mục "Đang vướng". Chạy xong thì xoá dòng
   đó và ghi vào `supabase/DA-CHAY.md`.
2. **Câu lệnh SQL chỉ được cộng thêm, không được xoá.** Thêm bảng, thêm cột thì
   được. Xoá bảng, xoá cột, đổi kiểu cột thì không, vì bản đang chạy trên máy kia
   vẫn cần thứ đó.
3. **Mỗi máy thử bằng một ngày sinh khác nhau.** Celes nhớ bài đã viết theo lá
   số. Hai máy dùng chung một ngày sinh thì máy này đọc nhầm bài của máy kia rồi
   tưởng mã của mình không chạy.

Và một lưu ý về tiền: hai máy dùng chung khoá OpenAI thì tiêu chung một hoá đơn,
chung một hạn mức. Muốn tách bạch thì tạo khoá riêng cho máy hai tại
<https://platform.openai.com/api-keys>.

---

## 5. Hai việc nên làm sớm

### Kho mã đang công khai

Kiểm ngày 18/09/2026: <https://github.com/Hieuzz05/Celestia-tuvi> ai cũng đọc
được, không cần đăng nhập.

Khoá bí mật thì an toàn, tôi đã dò toàn bộ 69 commit và chưa lần nào có tệp khoá
bị đẩy lên. Nhưng **toàn bộ cách Celes luận giải** thì đang công khai: luật viết
câu, khung luận, cách chọn dữ kiện. Đó là phần khó làm nhất của sản phẩm.

Đổi sang riêng tư mất 30 giây và không làm hỏng gì, Vercel vẫn dựng bình thường:

> Settings > General > kéo xuống cuối > **Change repository visibility** >
> **Make private**

Sau đó máy thứ hai khi `git clone` sẽ phải đăng nhập GitHub. Chỉ vậy thôi.

### Đổi các khoá đã từng dán vào khung chat

Khoá OpenAI, Groq, Cerebras, service_role của Supabase và bộ khoá payOS đều đã
từng xuất hiện trong khung chat. Nên đổi hết, mỗi nơi mất chưa tới một phút:

- OpenAI: <https://platform.openai.com/api-keys>
- Groq: <https://console.groq.com/keys>
- Supabase: Project Settings > API > Reset service_role
- payOS: trong trang quản trị payOS

Đổi xong nhớ cập nhật lại `.env.local` ở **cả hai máy** và trên **Vercel**.

---

## 6. Khi gặp sự cố

| Hiện tượng | Nguyên nhân thường gặp | Làm gì |
|---|---|---|
| Trang trắng, hoặc báo lỗi khoá | Thiếu biến trong `.env.local` | `npx tsx scripts/kiem-moi-truong.ts` |
| Bản xem thử lỗi mà bản thật chạy tốt | Chưa bật biến cho môi trường Preview | Mục 2 bước 6 |
| Sửa xong mà trang không đổi | Vercel chưa dựng xong, hoặc chưa gộp vào `main` | Mở `/api/phien-ban`, so mã commit |
| Git báo `conflict` khi gộp | Hai máy sửa cùng một tệp | Bảo AI: "chạy `git pull origin main` rồi xử lý xung đột, giữ cả hai ý" |
| Bài luận giải không đổi dù đã sửa mã | Celes đang đọc bài cũ trong bộ nhớ đệm | Thử bằng một ngày sinh khác |
| AI nói đã xong mà bạn không thấy gì | Nó quên đẩy lên, hoặc đẩy lên nhánh khác | `git log --oneline -3` và `git branch` |

Câu hỏi hữu ích nhất khi nghi ngờ: **mở
<https://celestia-tuvi.vercel.app/api/phien-ban>**. Nó nói thẳng máy chủ đang
chạy commit nào. So với commit mới nhất trên GitHub là biết đã lên hay chưa.

---

## 7. Bảng tra nhanh

```bash
# Xem đang ở nhánh nào
git branch

# Lấy bản mới nhất
git checkout main && git pull

# Bắt đầu một việc mới
git checkout -b viec/mo-ta-ngan

# Xem mình vừa sửa gì
git status
git diff

# Đẩy nhánh lên để có bản xem thử
git push -u origin viec/mo-ta-ngan

# Chạy thử ở máy
npm run dev

# Kiểm tra máy đã đủ điều kiện chạy chưa
npx tsx scripts/kiem-moi-truong.ts

# Kiểm tra chất lượng bài Celes viết (có gọi model, tốn tiền)
npx tsx scripts/test-be-mat-ai.ts

# Kiểm tra phần không gọi model (nhanh, miễn phí)
npx tsx scripts/test-rag-planner.ts
npx tsx scripts/test-chuan-ngon-ngu.ts
```

Tài liệu liên quan:

- `AI-PHOI-HOP.md` — luật dành cho AI. Đưa tệp này cho AI ở máy mới đọc đầu tiên.
- `AGENTS.md` — luật kỹ thuật của dự án, cũng dành cho AI.
- `HUONG-DAN.md` — hướng dẫn vận hành Celestia: nạp tài liệu, cấu hình model.
- `supabase/DA-CHAY.md` — tệp SQL nào đã chạy.
- `TRANG-THAI.md` — hai AI đang làm gì.
