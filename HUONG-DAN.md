# Hướng dẫn vận hành Tử Vi AI

Tài liệu này hướng dẫn 4 việc: chạy máy cá nhân → đưa lên Vercel → nối model AI → nối database & đăng nhập.

---

## 0. Chạy trên máy cá nhân

```bash
cd "D:\SAPP BA\tuvi-ai"
npm install
npm run dev
```

Mở http://localhost:3000. Lập lá số chạy được ngay, **không cần** API key hay database.
Luận giải AI và đăng nhập cần cấu hình ở mục 2 và 3.

Tạo file cấu hình riêng:

```bash
cp .env.example .env.local
```

Sau mỗi lần sửa `.env.local` phải khởi động lại `npm run dev`.

---

## 1. Đưa lên Vercel

### Cách A — qua GitHub (khuyến nghị, deploy tự động mỗi lần sửa code)

Repo đã tạo sẵn: **https://github.com/Hieuzz05/Celestia-tuvi**

Hướng dẫn đầy đủ cho người chưa dùng Git bao giờ — làm đúng thứ tự, mỗi bước có giải thích vì sao cần làm.

#### Bước 0 — Mở đúng thư mục

Mở terminal (PowerShell, hoặc terminal có sẵn trong VS Code) và di chuyển vào thư mục dự án:

```bash
cd "D:\SAPP BA\tuvi-ai"
```

Toàn bộ lệnh git bên dưới phải chạy trong thư mục này.

#### Bước 1 — Xem Git đang thấy gì

```bash
git status
```

Lệnh này liệt kê những file đã sửa/mới thêm mà Git chưa lưu lại. Danh sách dài là bình thường — dự án đang được xây. Git **không tự gửi gì đi** cho tới khi bạn chủ động ra lệnh ở các bước sau.

#### Bước 2 — Chọn các thay đổi để lưu (git add)

```bash
git add .
```

Lệnh này chọn tất cả file đã sửa/mới để chuẩn bị lưu lại. File nhạy cảm (như `.env.local` chứa API key thật, nếu sau này bạn tạo) sẽ **không** bị thêm vào, vì đã được khai trong file `.gitignore` để Git tự động bỏ qua.

#### Bước 3 — Lưu thành một "điểm mốc" (git commit)

```bash
git commit -m "Tu Vi AI: engine an sao, luan giai AI, dang nhap, giao dien Slash"
```

`commit` giống như chụp ảnh toàn bộ project tại thời điểm này, kèm một dòng mô tả ngắn. Đây vẫn là thao tác **lưu trên máy bạn**, chưa gửi lên mạng.

#### Bước 4 — Gắn địa chỉ GitHub (chỉ làm một lần)

```bash
git remote add origin https://github.com/Hieuzz05/Celestia-tuvi.git
git branch -M main
```

Dòng đầu báo cho Git biết "kho chứa trên GitHub" nằm ở đâu, đặt tên tắt là `origin`. Nếu chạy lại lệnh này lần 2 sẽ báo lỗi `remote origin already exists` — nghĩa là bước này **đã xong rồi**, bỏ qua và đi tiếp. Dòng thứ hai đổi tên nhánh làm việc thành `main`, đúng chuẩn hiện tại của GitHub.

#### Bước 5 — Đẩy code lên GitHub (git push)

```bash
git push -u origin main
```

Đây là bước thật sự gửi code lên mạng. Lần đầu chạy, một trong hai chuyện sẽ xảy ra:

- **Một cửa sổ trình duyệt tự bật lên** yêu cầu đăng nhập GitHub → đăng nhập tài khoản `Hieuzz05` → bấm Authorize → quay lại terminal, lệnh tự chạy tiếp. (Máy bạn đã cài sẵn Git Credential Manager nên đây là trường hợp thường gặp nhất.)
- Hoặc terminal hỏi thẳng **Username** và **Password**. Ở đây **không gõ mật khẩu tài khoản GitHub** — từ 2021 GitHub không cho dùng mật khẩu qua Git nữa, phải dùng "Personal Access Token" (xem khung dưới) dán vào ô Password.

> **Nếu bị hỏi Password mà không thấy cửa sổ trình duyệt nào bật lên:**
> 1. Vào https://github.com/settings/tokens → **Generate new token → Generate new token (classic)**.
> 2. Đặt tên bất kỳ (VD: `tuvi-ai-laptop`), tick quyền **repo**, bấm **Generate token**.
> 3. Copy token hiện ra (chỉ hiện **một lần duy nhất** — đóng trang là mất, phải tạo token mới nếu quên copy).
> 4. Dán token đó vào ô **Password** khi terminal hỏi (Username vẫn là `Hieuzz05`).

Push xong, terminal in vài dòng kết thúc bằng `main -> main`, không có chữ `error` hay `fatal` là **thành công**.

#### Bước 6 — Kiểm tra lại trên GitHub

Mở https://github.com/Hieuzz05/Celestia-tuvi — phải thấy đủ các thư mục `app`, `components`, `lib`... File nào bắt đầu bằng `.env` (trừ `.env.example`) **không được xuất hiện** ở đây; nếu có nghĩa API key thật đã bị lộ, cần báo ngay để xử lý.

#### Bước 7 — Nối với Vercel để deploy

1. Vào https://vercel.com/duyhieu24082000-6871s-projects → **Add New… → Project**.
2. Chọn **Import Git Repository** → tìm `Celestia-tuvi` → **Import**. (Nếu Vercel chưa thấy repo, bấm **Adjust GitHub App Permissions** và cấp quyền truy cập repo này.)
3. Vercel tự nhận diện Next.js — giữ nguyên mọi thiết lập mặc định → **Deploy**.
4. Đợi khoảng 1–2 phút, Vercel cho một đường link dạng `celestia-tuvi.vercel.app` — mở thử để xem trang đã chạy trên mạng (lúc này chưa có API key nên luận giải AI và đăng nhập chưa hoạt động, đó là bình thường).
5. Khai báo biến môi trường theo mục **1.1** ngay dưới đây, rồi vào tab **Deployments** → bấm **⋯** ở bản mới nhất → **Redeploy** để biến có hiệu lực.

#### 1.1 Khai báo biến môi trường trên Vercel

Giao diện Vercel mới **không còn** mục "Environment Variables" ở sidebar nữa — nó nằm bên trong
từng Environment.

Đường tắt: https://vercel.com/duyhieu24082000-6871s-projects/celestia-tuvi/settings/environment-variables

Hoặc bấm theo đường dẫn: **Settings** → **Environments** → bấm vào dòng **Production** → cuộn
xuống khu **Environment Variables**.

Cần khai 4 biến bắt buộc (lấy giá trị từ file `.env.local` trên máy bạn):

| Key | Lấy ở đâu | Ai đọc được |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio | Chỉ server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Trình duyệt (bình thường) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API Keys (`sb_publishable_...`) | Trình duyệt (bình thường) |
| `ADMIN_EMAILS` | Email của bạn, ngăn cách bằng dấu phẩy | Chỉ server |

Thêm nếu muốn: `AI_FALLBACK_ORDER`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY`.

**Lưu ý khi nhập:**
- **Đừng tự thêm/bớt tiền tố `NEXT_PUBLIC_`.** Biến có tiền tố này được nhúng thẳng vào mã chạy
  trong trình duyệt — thêm nhầm vào `GEMINI_API_KEY` là công khai key cho cả thiên hạ.
- Tick đủ cả **Production, Preview, Development** để bản preview cũng chạy được.
- Vercel cho dán nguyên khối `KEY=value` nhiều dòng một lúc (nó tự tách thành từng biến), không
  cần nhập từng cái.
- Biến môi trường **chỉ có hiệu lực từ lần deploy sau khi thêm** — phải Redeploy, không tự áp
  dụng cho bản đã build trước đó.

#### Từ lần sau: cập nhật code

Mỗi khi sửa code xong, chỉ cần lặp lại 3 lệnh (không cần làm lại bước 4, 7):

```bash
git add .
git commit -m "Mo ta ngan gon da sua gi"
git push
```

`git push` tự động kích hoạt Vercel build lại và cập nhật trang — không cần quay lại vercel.com.

### Cách B — qua Vercel CLI (nhanh, không cần GitHub)

```bash
cd "D:\SAPP BA\tuvi-ai"
npx vercel login          # chọn Continue with GitHub/Email rồi xác nhận trong trình duyệt
npx vercel link           # chọn scope: duyhieu24082000-6871s-projects, đặt tên project: tuvi-ai
npx vercel                # deploy bản preview
npx vercel --prod         # deploy bản chính thức
```

Khai báo biến môi trường bằng CLI:

```bash
npx vercel env add GEMINI_API_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... lặp lại cho từng biến, rồi:
npx vercel --prod
```

> Lưu ý: `vercel login` cần thao tác trong trình duyệt nên phải do bạn tự chạy.

---

## 2. Nối model AI

Ứng dụng gọi model theo **thứ tự ưu tiên**; model nào hết lượt hoặc lỗi thì tự chuyển sang model kế tiếp.

### 2.1 Gemini — nên làm trước, miễn phí dùng được thật

1. Vào https://aistudio.google.com/apikey → **Create API key**.
2. Copy key, thêm vào `.env.local`:
   ```
   GEMINI_API_KEY=AIza...
   ```
3. Hạn mức miễn phí khoảng 250 request/ngày với API key.

### 2.2 OpenRouter — nguồn model miễn phí dự phòng

1. Đăng ký tại https://openrouter.ai → **Keys** → **Create Key**.
2. Thêm vào `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Chọn model có đuôi `:free`, ví dụ `deepseek/deepseek-chat-v3-0324:free`.

### 2.3 OpenAI / Anthropic — chỉ khi có ngân sách

Hai nhà cung cấp này **không còn tier miễn phí thật cho API** (bản free chỉ áp dụng cho giao diện chat trên web). Khi nào có ngân sách thì thêm:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2.4 Đặt thứ tự fallback

```
AI_FALLBACK_ORDER=gemini|gemini-3.6-flash,openrouter|deepseek/deepseek-chat-v3-0324:free
```

Bỏ trống biến này thì thứ tự mặc định là: Gemini → OpenRouter → OpenAI → Anthropic.

### 2.5 Kiểm tra

Vào trang **/admin**: xem model nào đã có key, dán thử key vào ô *Test kết nối* để xác nhận key và tên model dùng được, trước khi đưa lên Vercel.

---

## 3. Nối database & bật đăng nhập (Supabase)

Supabase cho cả 4 thứ trong một gói miễn phí: database Postgres, đăng nhập, lưu file, và pgvector cho RAG.

### 3.1 Project đang dùng

Project Supabase đã tạo: **wqhxksgtkyoqknicombi**
→ https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi

Hai biến đã khai trong `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://wqhxksgtkyoqknicombi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

> Supabase đã đổi sang định dạng key mới: `sb_publishable_...` thay cho `anon` (JWT) trước đây.
> Đây là key công khai, để lộ ra trình duyệt là bình thường — an toàn dữ liệu dựa vào Row Level
> Security ở bước 3.3, không dựa vào việc giấu key.

Nếu cần lấy lại: **Project Settings → API Keys**.

### 3.2 Bật đăng nhập

- **Email/mật khẩu**: đã bật sẵn, dùng được ngay.
  Hiện tài khoản mới **phải xác nhận email** trước khi đăng nhập được. Muốn bỏ bước này cho nhanh
  lúc thử nghiệm: [Authentication → Sign In / Providers → Email](https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/auth/providers)
  → tắt **Confirm email**.
- **Google**: hiện **chưa bật**, nên nút "Đăng nhập bằng Google" tự ẩn khỏi giao diện. Muốn bật:
  vào Authentication → Providers → Google, điền Client ID / Client Secret lấy từ Google Cloud
  Console. Sau đó vào **Authentication → URL Configuration** thêm:
  - Site URL: `https://celestia-tuvi.vercel.app`
  - Redirect URLs: `https://celestia-tuvi.vercel.app/auth/callback` và `http://localhost:3000/auth/callback`

### 3.3 Tạo các bảng dữ liệu

1. Mở thẳng SQL Editor: https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/sql/new
2. Mở file `supabase/schema.sql` trong dự án, copy **toàn bộ** nội dung.
3. Dán vào ô SQL Editor → bấm **Run** (hoặc `Ctrl+Enter`).
4. Thấy dòng **Success. No rows returned** là xong. File này chạy lại nhiều lần được, không sợ hỏng dữ liệu.

Các bảng được tạo:

| Bảng | Dùng để |
|---|---|
| `profiles` | Thông tin tài khoản, tự tạo khi có người đăng ký |
| `charts` | Lá số đã lưu của từng người |
| `readings` | Các bản luận giải AI đã tạo |

Mỗi bảng đều bật **Row Level Security** — người dùng chỉ đọc/sửa được dữ liệu của chính mình,
kể cả khi ai đó lấy được `anon key` công khai.

Các bảng cho kho tri thức RAG (`knowledge_documents`, `knowledge_chunks`) và log dùng model
(`ai_provider_configs`, `ai_usage_logs`) sẽ bổ sung ở giai đoạn làm RAG.

### 3.4 Bật kho tri thức (RAG)

Kho tri thức cho phép nạp tài liệu tử vi của riêng bạn để AI trích dẫn khi luận giải, thay vì chỉ
dựa vào kiến thức chung của model.

1. **Tạo bảng**: mở https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/sql/new, dán toàn
   bộ `supabase/schema-rag.sql` rồi Run. File này bật extension `pgvector`, tạo 2 bảng kho tri thức
   và bảng nhật ký dùng model. Chạy lại nhiều lần được.
2. **Lấy service role key**: Project Settings → API Keys → mục `service_role`. Thêm vào `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Trên Vercel khai báo biến này kiểu **Secret** (không có tiền tố `NEXT_PUBLIC_`).

> **Vì sao cần service role?** Hai bảng kho tri thức bật RLS nhưng **cố tình không có policy nào**,
> nghĩa là anon key bị chặn hoàn toàn. Chỉ mã chạy trên server mới đọc/ghi được. Đây là chủ ý:
> tài liệu bản quyền của bạn không nên tải được từ trình duyệt của bất kỳ ai.
>
> Service role key có quyền bỏ qua mọi RLS — **tuyệt đối không** đặt tiền tố `NEXT_PUBLIC_` cho nó.

3. **Nạp tài liệu**: vào trang `/admin` → mục *Kho tri thức*. Chọn tệp `.txt`/`.md` hoặc dán nội
   dung, đặt tiêu đề, chọn hệ phái (Nam phái / Bắc phái / Dùng chung) rồi bấm *Nạp vào kho*.

Cách hệ thống dùng kho:

- Câu truy vấn được dựng từ **chính các sao có thật trong lá số** (chính tinh + tứ hóa tại cung
  Mệnh, cục) cộng với chủ đề đang xem — nên tìm được đoạn nói đúng bộ sao đó, không chỉ khớp tên
  chủ đề chung chung.
- Chủ đề *Vận hạn* ưu tiên tài liệu **Bắc phái**, các chủ đề còn lại ưu tiên **Nam phái**; tài liệu
  đánh dấu *Dùng chung* luôn được xét.
- Chỉ lấy đoạn có độ liên quan **từ 60% trở lên**. Ngưỡng này đo thực tế: câu hỏi đúng chủ đề đạt
  ~79%, câu lạc đề ~49%.
- Bản luận giải hiển thị rõ đã trích từ tài liệu nào, để phân biệt được đâu là kiến thức từ kho,
  đâu là kiến thức chung của model.
- Kho trống hoặc chưa cấu hình thì luận giải **vẫn chạy bình thường** bằng kiến thức của model.

Giới hạn hiện tại: mỗi lần nạp tối đa 60 đoạn (~60.000 ký tự) vì hạn mức embedding của Gemini free
tier tính theo phút; tài liệu dài hơn thì chia nhỏ nạp làm nhiều lần. Định dạng nhận: `.txt`, `.md`,
`.csv` — PDF/DOCX cần thư viện bóc tách riêng, sẽ bổ sung sau.

### 3.5 Chỉ định tài khoản quản trị

```
ADMIN_EMAILS=it-ba@sapp.edu.vn
```

Nhiều email thì ngăn cách bằng dấu phẩy. Chỉ những email trong danh sách này mới vào được trang
`/admin`.

> **Quan trọng:** khi biến này để trống **và** chưa cấu hình Supabase, trang `/admin` mở cho tất
> cả mọi người — trang sẽ hiện băng cảnh báo đỏ. Chỉ chấp nhận được lúc chạy trên máy cá nhân;
> phải khai báo trước khi đưa lên mạng, vì trang này cho phép thử API key.

### 3.6 Hồ sơ lưu ở đâu

- **Chưa đăng nhập** — hồ sơ lưu trong `localStorage` của đúng trình duyệt đang mở.
- **Đã đăng nhập** — hồ sơ lưu vào bảng `charts`, mở ở máy nào cũng thấy.

Trang **Hồ sơ** có nút *"Chuyển hồ sơ đang lưu ở trình duyệt này lên tài khoản"* để mang dữ liệu
đã lưu từ trước lên tài khoản sau khi đăng nhập.
---

## 4. Danh sách biến môi trường

| Biến | Bắt buộc | Dùng cho |
|---|---|---|
| `GEMINI_API_KEY` | Nên có | Luận giải AI (miễn phí) |
| `OPENROUTER_API_KEY` | Nên có | Model dự phòng miễn phí |
| `OPENAI_API_KEY` | Không | Chỉ khi có ngân sách |
| `ANTHROPIC_API_KEY` | Không | Chỉ khi có ngân sách |
| `AI_FALLBACK_ORDER` | Không | Tự đặt thứ tự ưu tiên |
| `NEXT_PUBLIC_SUPABASE_URL` | Cho đăng nhập | Database + Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cho đăng nhập | Database + Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Cho kho tri thức | Đọc/ghi kho tri thức phía server |
| `ADMIN_EMAILS` | Nên có khi public | Giới hạn quyền vào `/admin` |

---

## 5. Trạng thái tính năng

| Tính năng | Hiện tại |
|---|---|
| Lập lá số, an sao Nam phái | Xong |
| Mệnh bàn 12 cung, độ sáng sao, Tuần–Triệt, tam phương tứ chính | Xong |
| Đại vận / tiểu hạn / nguyệt hạn | Xong |
| Luận giải tổng quan ngay cạnh lá số (tab Lá số) | Xong |
| Tab Luận giải chi tiết theo 7 chủ đề | Xong |
| Fallback nhiều model AI | Xong — đã test thật với Gemini |
| Đăng nhập SSO (Google/Facebook/GitHub/Microsoft/Apple) | Xong — nút tự hiện khi bật provider trong Supabase |
| Tên hiển thị (username) | Xong — đặt tại trang Tài khoản |
| Đăng nhập email + Google | Xong — cần tạo project Supabase |
| Lưu hồ sơ theo tài khoản | Xong — cần tạo project Supabase |
| Phân quyền trang quản trị | Xong — cần `ADMIN_EMAILS` |
| Kho tri thức RAG | Xong — cần chạy `schema-rag.sql` + service role key |
| Nhật ký dùng model + cảnh báo quota | Xong — cần service role key |
| Chủ động bỏ qua model đã cạn lượt miễn phí | Xong |
| Hợp tuổi — so hai lá số | Xong |
| Chat hỏi đáp tự do theo lá số | Chưa |
| Xuất PDF, từ điển thuật ngữ | Chưa |
