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

### 2.3 Groq và Cerebras — free tier, không cần thẻ

Hai nhà cung cấp này dùng chung giao thức OpenAI nên hệ thống hỗ trợ sẵn, chỉ cần thêm key:

- **Groq** — https://console.groq.com/keys → `GROQ_API_KEY`. Khoảng 1000 request/ngày, tốc độ
  rất nhanh. Model gợi ý: `llama-3.3-70b-versatile`.
- **Cerebras** — https://cloud.cerebras.ai → `CEREBRAS_API_KEY`. Model gợi ý: `llama-3.3-70b`.

> Có nhà cung cấp free tier khác (Mistral ~1B token/tháng) nhưng **đòi bạn đồng ý cho dùng dữ liệu
> để huấn luyện**. App này xử lý ngày giờ sinh và câu hỏi riêng tư của người dùng, nên tôi không
> đưa vào mặc định. Muốn dùng thì cân nhắc kỹ phần quyền riêng tư trước.

### 2.4 OpenAI / Anthropic — chỉ khi có ngân sách

Hai nhà cung cấp này **không còn tier miễn phí thật cho API** (bản free chỉ áp dụng cho giao diện chat trên web). Khi nào có ngân sách thì thêm:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2.5 Đặt thứ tự fallback

```
AI_FALLBACK_ORDER=gemini|gemini-3.6-flash,openrouter|deepseek/deepseek-chat-v3-0324:free
```

Bỏ trống biến này thì thứ tự mặc định là:
Gemini → Groq → Cerebras → OpenRouter → OpenAI → Anthropic.

### 2.6 Kiểm tra

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

#### Bật đăng nhập bằng Google (làm một lần, ~10 phút)

**Đã bật xong ngày 16/09/2026** — nút "Tiếp tục với Google" hiện sẵn trên trang đăng nhập.
Giữ lại hướng dẫn dưới đây phòng khi phải làm lại (đổi project Supabase, Client Secret hết hạn...).

Nút chỉ hiện khi provider được bật thật trong Supabase, nên nếu thấy mất nút thì chạy
`npm run kiem-tra-sso` — lệnh này hỏi thẳng Supabase và in ra bước còn thiếu.

**Bước 1 — Tạo OAuth Client trong Google Cloud Console**

1. Mở https://console.cloud.google.com/ → góc trên bên trái chọn **Select a project** →
   **New Project** → đặt tên `Celestia` → **Create**. (Nếu đã có project thì chọn project đó.)
2. Vào menu trái **APIs & Services → OAuth consent screen**:
   - User Type: chọn **External** → **Create**
   - App name: `Celestia`, User support email: chọn email của bạn
   - Kéo xuống Developer contact information: điền lại email của bạn → **Save and Continue**
   - Các màn Scopes / Test users: bấm **Save and Continue** để bỏ qua → **Back to Dashboard**
   - Ở mục **Publishing status**, bấm **Publish app** → **Confirm**. Không publish thì chỉ những
     email bạn thêm vào Test users mới đăng nhập được.
3. Vào **APIs & Services → Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Celestia Web`
   - **Authorized JavaScript origins** → Add URI, thêm 2 dòng:
     - `https://celestia-tuvi.vercel.app`
     - `http://localhost:3000`
   - **Authorized redirect URIs** → Add URI, thêm đúng 1 dòng này (đây là địa chỉ của Supabase,
     không phải của web bạn — điền sai chỗ này là lỗi `redirect_uri_mismatch`):
     - `https://wqhxksgtkyoqknicombi.supabase.co/auth/v1/callback`
   - Bấm **Create** → hiện popup có **Client ID** và **Client Secret**. Copy cả hai, để tạm đâu đó.
     Client Secret xem lại được sau nên không sợ mất.

**Bước 2 — Dán vào Supabase**

1. Mở [Authentication → Sign In / Providers](https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/auth/providers)
   → tìm **Google** → gạt công tắc **Enable Sign in with Google**.
2. Dán **Client ID** và **Client Secret** vừa lấy ở Bước 1 → **Save**.

**Bước 3 — Khai báo địa chỉ được phép quay về**

Vào [Authentication → URL Configuration](https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/auth/url-configuration):

- **Site URL**: `https://celestia-tuvi.vercel.app`
- **Redirect URLs** → Add URL, thêm 2 dòng:
  - `https://celestia-tuvi.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Thiếu bước này thì Google xác thực xong nhưng Supabase từ chối đẩy người dùng về web.

**Kiểm tra**

Mở https://celestia-tuvi.vercel.app/dang-nhap (hoặc `http://localhost:3000/dang-nhap`) —
phải thấy nút **Tiếp tục với Google** phía trên ô email. Bấm vào, chọn tài khoản Google,
sẽ được đưa thẳng về trang chủ và tên hiện trên thanh điều hướng.

Nếu có trục trặc, web sẽ đưa bạn về trang đăng nhập kèm dòng chữ đỏ nói rõ lý do:

| Dòng báo lỗi | Nguyên nhân | Sửa |
|---|---|---|
| `redirect_uri_mismatch` | Authorized redirect URI ở Google Cloud sai | Bước 1.3 — phải là địa chỉ `...supabase.co/auth/v1/callback` |
| `Unsupported provider: provider is not enabled` | Chưa bật Google trong Supabase | Bước 2 |
| `requested path is invalid` | Thiếu địa chỉ trong Redirect URLs | Bước 3 |
| `access_denied` | Bạn bấm Huỷ ở màn chọn tài khoản, hoặc app chưa Publish | Bước 1.2 — Publish app |

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

### 3.3a Vì sao bài đọc bỗng nhạt đi — hãy xem model nào đang viết

Bài luận giải dài, Hỏi Celes và Kết nối giờ đi chung một đường: chọn đúng dữ kiện theo chủ đề
(không đổ cả 12 cung), truy hồi nguồn, bắt model trả cấu trúc, kiểm từng ý bằng luật, rồi mới dựng
thành chữ. Đường đi đó **làm bài đúng hơn**, nhưng **độ sâu và giọng văn vẫn do model quyết định**.
Cùng một dữ kiện, một prompt, đo ngày 18/09/2026:

| Model | Số từ | Câu có tên sao | Ý có lực ngược | Đọc ra sao |
|---|---|---|---|---|
| `openai / gpt-5.4-mini` | 1420 | **2%** | 3 | Nói cấu trúc ấy tạo ra gì trong đời, hầu như không kê sao. Hết 20 giây. **Đang dùng.** |
| `gemini-3.6-flash` | — | — | — | Văn tiếng Việt tốt — nhưng free tier chỉ cho **20 bài mỗi ngày** (`GenerateRequestsPerDay… = 20`), cạn là 429 |
| `groq / gpt-oss-120b` | — | — | — | Cụ thể, có "cái giá" của mỗi điểm mạnh; còn hay lấy tên sao làm chủ ngữ |
| `openai / gpt-4o-mini` | 992 | 15% | 1 | Nhạt, tính từ chung chung ("nhạy cảm", "mạnh mẽ", "đặc biệt") |
| `openai / gpt-5.5` | — | — | — | **Không dùng được**: quá 55 giây, mà hàm trên Vercel Hobby chỉ sống 60 giây |

Ba thứ dễ khiến bạn tưởng "chẳng có gì thay đổi":

1. **Thứ tự trong `/admin/models`.** Model đứng đầu viết gần như mọi bài. Đứng đầu là một model
   yếu thì cả pipeline phía sau có tốt đến mấy, bài vẫn nhạt.
2. **Gemini hết hạn mức ngày.** Khi đó nó im lặng rơi xuống model kế tiếp. Trang `/luan-giai` trả về
   kèm trường `daThuHong` — bấm F12 → Network xem là biết bài này do ai viết và vì sao model trước rơi.
3. **Bản trên máy chủ chưa kịp lên.** Mở `https://celestia-tuvi.vercel.app/api/phien-ban` là thấy mã
   commit đang chạy, so với commit mới nhất trên GitHub. Vercel mất khoảng 50 giây cho mỗi lần đẩy.

**Điều đáng nhớ nhất từ lần đo này: model quyết định độ sâu, không phải đường đi.** Cùng một dữ
kiện và một prompt, `gpt-4o-mini` cho bài 992 từ đầy tính từ chung chung, còn `gpt-5.4-mini` cho bài
1420 từ gần như không nhắc tên sao mà vẫn nói đúng lá số. Đó là khoảng cách mà không prompt nào lấp
được.

Dòng `gpt-5` trở lên đổi giao kèo gọi API: nó từ chối `max_tokens` (phải là `max_completion_tokens`)
và từ chối mọi nhiệt độ khác mặc định. Trước bản sửa 18/09/2026, chọn bất kỳ model gpt-5 nào cũng
nhận 400 ngay ở nút "Thử kết nối" — trông hệt như key hỏng. Giờ đã xử đúng, nên khoá OpenAI trả tiền
dùng được cả dòng mới.

Trần 60 giây của Vercel Hobby là giới hạn thật: model càng nghĩ lâu càng dễ chạm. `gpt-5.5` viết hay
hơn nhưng mất hơn 55 giây nên bị huỷ giữa chừng và rơi xuống model sau — đừng xếp nó đứng đầu khi
chưa nâng gói.

### 3.3b Lưới đỡ khi model chính hỏng

Chỉ có một nhà cung cấp là không có lưới. Trong lúc dựng phần này, Gemini trả về
`503 high demand` giữa chừng và Celes câm hoàn toàn cho tới khi nó tự hồi.

Hệ thống tự xếp mọi provider **có key** vào cuối hàng chờ, kể cả khi bạn không
nhắc chúng trong `AI_FALLBACK_ORDER` — nên chỉ cần điền key là xong, không phải
sửa gì thêm.

Tình trạng các free tier (đo ngày 17/09/2026, tự kiểm lại khi thấy lỗi lạ):

| Nhà cung cấp | Model | Tình trạng |
|---|---|---|
| Gemini | `gemini-3.6-flash` | Dùng được. Văn tiếng Việt tốt nhất, nhưng chậm (~10–20s) và hay quá tải |
| Groq | `openai/gpt-oss-120b` | Dùng được. Nhanh gấp 5 (~4s), văn mỏng hơn — hợp làm lưới đỡ |
| Cerebras | `gpt-oss-120b`, `qwen-3.8-27b` | **Đòi thanh toán**, cả hai model. Không dùng được nếu chưa bật billing |
| OpenAI | `gpt-4o-mini` | Hết credit |

Hai điều dễ vấp:

- **Tên model free tier thay khá thường.** Groq và Cerebras đã bỏ hẳn dòng Llama 3.3
  mà `MODEL_MAC_DINH` từng trỏ tới, nên báo `404 model_not_found`. Gặp lỗi đó thì
  hỏi thẳng nhà cung cấp: `curl -H "Authorization: Bearer <key>" https://api.groq.com/openai/v1/models`.
- **Dòng `gpt-oss` là model suy luận.** Nó tiêu ngân sách output cho chuỗi nghĩ nội
  bộ, và chuỗi đó nằm ở trường `reasoning`, không phải `content`. Gọi với
  `maxTokens` nhỏ là `content` rỗng và trông hệt như model hỏng. Lệnh test kết nối
  đã gửi `reasoning_effort: low` để tránh; nếu tự gọi thì nhớ để `maxTokens` rộng.

### 3.4 Bật kho tri thức (RAG)

Kho tri thức cho phép nạp tài liệu tử vi của riêng bạn để Celes dựa vào khi luận giải, thay vì chỉ
dùng kiến thức chung của model.

**1. Tạo bảng.** Mở https://supabase.com/dashboard/project/wqhxksgtkyoqknicombi/sql/new, dán toàn bộ
`supabase/schema-rag-v2.sql` rồi Run. File bật `pgvector` + `pg_trgm`, tạo bảng nguồn, bảng phiên
bản, bảng đoạn, từ điển thực thể, nhật ký truy hồi và bộ đánh giá. Chạy lại nhiều lần được.

> `schema-rag.sql` (bản cũ) giữ lại cho tương thích, **không cần chạy nữa**. Bản v2 tạo đủ mọi thứ
> bản cũ tạo.

> Nếu bạn đã chạy `schema-rag-v2.sql` **trước ngày 17/09/2026**, chạy thêm `supabase/va-rag-tu-khoa.sql`.
> Bản đầu dùng `plainto_tsquery` vốn nối mọi từ bằng AND, khiến nhánh tìm theo từ khoá luôn trả về
> rỗng — truy hồi vẫn chạy nhưng rơi về vector thuần mà không báo gì.

**2. Lấy service role key.** Project Settings → API Keys → `service_role`. Thêm vào `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=...
```

Trên Vercel khai báo kiểu **Secret**, **không** có tiền tố `NEXT_PUBLIC_`.

> **Vì sao cần service role?** Mọi bảng kho tri thức bật RLS nhưng **cố tình không có policy nào**,
> nên anon key bị chặn hoàn toàn. Chỉ mã chạy trên server mới đọc/ghi được — tài liệu bản quyền của
> bạn không nên tải được từ trình duyệt của bất kỳ ai. Key này bỏ qua mọi RLS, nên tuyệt đối không
> để nó ra phía trình duyệt.

> Nếu bạn đã chạy `schema-rag-v2.sql` trước ngày 18/09/2026, chạy thêm
> `supabase/schema-rag-v3.sql`. Bản đầu bắt mỗi đoạn phải có vector ngay lúc lưu, nên cả tài liệu
> phải lọt trong một request — tài liệu hơn 60 đoạn là không nạp nổi.

**3. Nạp nguồn.** Vào `/admin` → *Kho tri thức* → **Thêm nguồn**. Khai tiêu đề, phiên bản, hệ phái,
loại nguồn và mức tin cậy, rồi chọn tệp `.txt`/`.md` hoặc dán nội dung.

**3b. Chờ sinh vector.** Nạp xong đoạn, trang tự chạy tiếp phần sinh vector và hiện tiến độ.
Đừng đóng tab — vòng lặp chạy từ trình duyệt.

> **Nạp một cuốn sách mất bao lâu?** Không phụ thuộc máy mà phụ thuộc hạn mức của Gemini. Gói miễn
> phí có hai trần, đo được ngày 18/09/2026:
>
> | Trần | Giá trị | Ý nghĩa |
> |---|---|---|
> | Mỗi phút | 100 đoạn | Chờ vài chục giây rồi chạy tiếp — trang tự chờ hộ bạn |
> | **Mỗi ngày** | **1.000 đoạn** | Chờ bao lâu cũng vô ích, phải sang hôm sau |
>
> Nghĩa là **một ngày nạp được khoảng một cuốn sách vừa**. Toàn bộ 14 tài liệu (7.743 đoạn) cần
> khoảng **8 ngày** ở gói miễn phí.
>
> Muốn nạp liền một mạch thì bật thanh toán cho khoá Gemini. Embedding rất rẻ: 7.743 đoạn khoảng
> 3 triệu token, dưới một đô la cho toàn bộ kho.
>
> Đóng tab giữa chừng cũng không mất gì. Mở lại `/admin/knowledge`, phiên bản đó nằm ở trạng thái
> *Đang xử lý* kèm nút **Nạp tiếp** — bấm vào là chạy tiếp từ đoạn chưa có vector, không làm lại từ
> đầu và không tốn thêm quota.

**4. Xuất bản.** Đây là bước dễ quên nhất, và nó quan trọng:

> **Nạp xong tài liệu CHƯA được Celes dùng.** Nó dừng ở trạng thái *Cần duyệt*. Bạn phải mở bảng
> phiên bản và bấm **Xuất bản** thì truy hồi mới chạm tới nó. Cột *Được truy hồi?* nói thẳng điều
> này cho từng phiên bản.

Lý do: một tài liệu cắt hỏng mà đi thẳng vào production sẽ nhiễm vào mọi câu trả lời sau đó, và
không ai phát hiện ra vì hệ thống vẫn "chạy bình thường". Mỗi nguồn chỉ có đúng một phiên bản đang
xuất bản — ràng buộc nằm ở tầng database, không phải ở giao diện.

Vòng đời một phiên bản:

| Trạng thái | Celes dùng? | Nghĩa là |
|---|---|---|
| Nháp | Không | Đã tạo bản ghi, chưa xử lý |
| Đang xử lý | Không | Đang cắt đoạn, rút thực thể, sinh vector |
| Cần duyệt | Không | Xử lý xong, chờ bạn xem rồi xuất bản |
| Đã xuất bản | **Có** | Bản đang dùng thật |
| Thất bại | Không | Hỏng ở bước nào đó, có ghi lỗi |
| Lưu trữ | Không | Giữ vết nhưng không còn dùng |

**5. Kiểm tra bằng Retrieval Lab.** `/admin/retrieval-lab` chạy đúng bộ lập kế hoạch và truy hồi mà
Celes dùng, nhưng **không gọi model**. Nhập câu hỏi rồi xem:

- **Bộ lập kế hoạch**: chủ đề đọc được, các cung liên quan, lớp hạn, thực thể nhận ra, và câu truy
  vấn đã viết lại. Sai ở đây thì không phải lỗi của embedding.
- **Bảng kết quả**: hạng và điểm của nhánh vector, hạng và điểm của nhánh từ khoá, điểm RRF, và đoạn
  nào thật sự vào bài. Hai cột điểm để riêng vì chúng là hai thang đo khác nhau — cộng lại là mất
  luôn khả năng gỡ lỗi.

### 3.4b Celes dùng kho như thế nào

Đường đi của một câu hỏi:

```
Câu hỏi
  ↓  nhận dạng thực thể (sao / cung / Tứ Hóa / lớp hạn) bằng từ điển
  ↓  lập kế hoạch: chủ đề → cung liên quan → lớp hạn → viết lại truy vấn
  ↓  chọn dữ kiện lá số (F001, F002…) — không đổ cả 12 cung
  ↓  truy hồi: vector ‖ từ khoá  →  trộn RRF  →  6 đoạn (E001, E002…)
  ↓  gói bằng chứng  →  model  →  JSON có trích mã
  ↓  validator đối chiếu mã và tên sao
Câu trả lời + phần "căn cứ"
```

Vài điểm đáng biết:

- **Truy vấn không phải câu bạn gõ.** Nó được viết lại để nói cả tiếng người dùng lẫn thuật ngữ tài
  liệu: "năm nay có nên đổi việc" trở thành câu hỏi kèm *Cung liên quan: Quan Lộc, Mệnh, Tài Bạch,
  Thiên Di* và tên các sao thật sự đứng ở những cung đó.
- **Tìm bằng hai nhánh.** Vector bắt đúng ý, từ khoá bắt đúng chữ. Cần cả hai vì "Thiên Riêu" và
  "Thiên Y" rất gần nhau trong không gian vector nhưng là hai sao khác hẳn.
- **Mỗi khẳng định phải có mã.** Model trích `F003` (dữ kiện lá số) hoặc `E002` (nguồn tài liệu);
  validator đối chiếu lại. Ý nào nhắc tên sao không có trong dữ kiện lẫn nguồn thì bị loại.
- **Kho trống thì Celes thu hẹp kết luận**, nói rõ là chưa đủ căn cứ chuyên môn — chứ **không** tự
  bổ sung học thuyết từ trí nhớ của model. Đây là chủ ý, không phải thiếu sót.


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
| Kho tri thức RAG | Xong — cần chạy `schema-rag-v2.sql` + service role key |
| Từ điển thực thể + Query Planner | Xong — bộ vàng 62 câu đạt 100% |
| Truy hồi lai vector + từ khoá (RRF) | Xong — cần schema v2 |
| Vòng đời nguồn: phiên bản, duyệt, xuất bản | Xong — `/admin/knowledge` |
| Retrieval Lab | Xong — `/admin/retrieval-lab` |
| Gói bằng chứng + validator tất định | Xong |
| Nhật ký dùng model + cảnh báo quota | Xong — cần service role key |
| Chủ động bỏ qua model đã cạn lượt miễn phí | Xong |
| Hợp tuổi — so hai lá số | Xong |
| Lưu tinh theo năm xem | Xong — bật trong Tuỳ chọn hiển thị |
| Quản trị xem tài khoản + lá số của user | Xong — cần service role key |
| Chat hỏi đáp tự do theo lá số | Xong |
| Landing ở `/`, công cụ ở `/la-so` | Xong |
| Nhân cách Celes (thương hiệu Celestia, người đồng hành Celes) | Xong |
| Chuyển ngữ VI/EN, tự nhận theo thiết bị, nhớ lựa chọn | Xong — đã phủ toàn bộ đường đi của khách mới |
| Onboarding hỏi ý định trước khi hỏi ngày sinh | Xong — 4 bước |
| Quick Read một góc nhìn chính + hai phụ, sắp theo ý định | Xong |
| Cấu trúc trả lời của Celes (Phản chiếu → Trả lời → Vì sao → Lưu ý → Bước tiếp) | Xong — ở tầng prompt |
| Góc nhìn nhanh (3 insight) trước khi đăng ký | Xong — tính bằng công thức, không gọi AI |
| Nút "Vì sao Celestia nói vậy?" | Xong — mở căn cứ từ chính lá số |
| Nhập thông tin sinh theo từng bước | Xong — 3 bước, có xử lý "không nhớ giờ sinh" |
| Quên mật khẩu | Xong |
| Trang chủ cá nhân hoá sau đăng nhập | Xong — `/home`, có ô "Hôm nay bạn đang nghĩ gì?" và lối tắt chủ đề |
| Hành trình: dòng thời gian giai đoạn / năm / tháng | Xong — `/hanh-trinh`, tính bằng công thức, không gọi AI |
| Hành trình: tầng "Xem chi tiết" luận hạn đa lớp | Xong — `/hanh-trinh/chi-tiet`, ghép nền lá số + đại hạn + năm + tháng + lưu tinh |
| Bảng luận giải 8 lĩnh vực sau đăng nhập | Xong — `lib/tuvi/luan-giai-sau.ts`, mỗi khối có căn cứ riêng |
| Danh sách lá số + badge "Lá số của tôi" | Xong — cần chạy lại `supabase/schema.sql` để có cột `la_so_mac_dinh` |
| Giữ bối cảnh xuyên tab, cảnh báo lá số chưa lưu | Xong — `lib/store/boi-canh.tsx` + `CanhBaoRoiTrang` |
| Bộ quy tắc tính có phiên bản | Xong — `lib/tuvi/phuong-phap.ts`, ghi kèm mỗi bài luận hạn |
| Hành trình lớp NGÀY | Chưa — cần đối chiếu quy tắc an ngày hạn với bản mẫu trước |
| Mệnh bàn 3 chế độ Dễ hiểu / Cổ điển / Chuyên sâu | Xong — ba mức độ dày, an sao không đổi |
| Web trên màn hình điện thoại | Xong — không trang nào tràn ngang, vùng chạm 45px |
| Mệnh bàn bản mobile (mini-chart + carousel 12 cung) | Chưa — hiện giữ tỉ lệ 0.5 và cho vuốt ngang trong khung riêng |
| App Expo (`apps/celes-app/`) | **Tạm dừng** — chưa có dự định đẩy lên store |
| Ủng hộ Celes (pay-what-you-want, payOS) | Xong phần sản phẩm — **cần khoá payOS mới nhận được tiền** |
| Hạn mức Hỏi Celes + cổng ủng hộ | Xong — chặn ở máy chủ, đặt chỗ nguyên khối trong Postgres |
| Khoá luận giải 8 lĩnh vực / Hành trình chi tiết theo bậc quyền | Xong — dựng ở máy chủ, không phải ẩn ở giao diện |
| Trang quản trị `/admin/support` | Xong — chỉ đọc, vào bằng địa chỉ |
| Tác vụ đối soát đơn định kỳ | Xong — Vercel Cron 15 phút/lần, **cần `CRON_SECRET`** |
| Lịch sử ủng hộ ở trang Tài khoản | Xong |
| Cổng ủng hộ cho Kết nối | Xong — chặn ở máy chủ trước khi gọi model |
| Rà soát gian lận nâng cao (giới hạn tần suất tạo đơn) | Chưa — hiện dùng lại đơn đang chờ cùng số tiền |
| Bộ kiểm thử E2E theo spec | Chưa |
| Xuất PDF, từ điển thuật ngữ | Chưa |

---

## 5b. Ủng hộ Celes — kết nối payOS

Tính năng chạy được ngay cả khi **chưa khai báo gì**: lúc đó không có hạn mức, không có cổng ủng
hộ, sản phẩm y hệt trước. Phần dưới là cách bật nó lên thật.

### Mất bao nhiêu tiền

Từ **23/01/2026** payOS miễn phí không giới hạn cho **cá nhân và hộ kinh doanh**: miễn phí khởi
tạo, miễn phí duy trì, miễn phí giao dịch. Celestia thuộc nhóm này.

| Khoản | Cá nhân / hộ kinh doanh | Doanh nghiệp |
|---|---|---|
| Khởi tạo | 0đ | 0đ |
| Duy trì hàng tháng | 0đ | 0đ |
| Mỗi giao dịch | 0đ | Theo gói số lượng, hoặc gói Flex tính % |

Cách nhận gói miễn phí: đăng ký xong thì dùng lần lượt **Free – 100** (100 giao dịch) rồi
**Pioneer – 500** (500 giao dịch). Hết hai gói đó thì lấy **KLB – 1000** (1000 giao dịch) —
gói này lấy lại được nhiều lần, nên thực tế là không giới hạn. Điều kiện của KLB – 1000 là có
tài khoản Kienlongbank, mở online bằng eKYC mất khoảng 5 phút.

Tiền đi **thẳng vào tài khoản ngân hàng đã liên kết** (chuyển khoản VietQR), không qua ví trung
gian nên không có bước đối soát hay rút tiền riêng.

Phía Celestia không phát sinh chi phí nào: Vercel và Supabase vẫn nằm trong free tier.

### Bảy bước kết nối

**1. Đăng ký tài khoản** tại `my.payos.vn`. Chỉ cần CCCD, không cần hợp đồng.

**2. Xác thực tổ chức.** Chọn nhóm "chưa có pháp nhân" (kinh doanh cá thể) nếu chưa có mã số
doanh nghiệp. Nhập số CCCD rồi thực hiện một lệnh chuyển khoản xác thực; hệ thống tự đối chiếu.
Nếu không khớp thì gửi ảnh hai mặt CCCD (kèm giấy phép kinh doanh có mộc đỏ nếu có) tới
`verify@payos.vn` để xác thực tay.

**3. Liên kết tài khoản ngân hàng.** Đây là tài khoản tiền sẽ về. Muốn lấy gói KLB – 1000 thì mở
tài khoản Kienlongbank ngay trong luồng eKYC của payOS.

**4. Tạo kênh thanh toán.** Menu *Kênh thanh toán* → đặt tên, tải logo → chọn ngân hàng chính →
*Tạo kênh thanh toán và tích hợp*. Màn cuối trả về ba khoá: **Client ID**, **API Key**,
**Checksum Key**. Chép cả ba ngay, đây là lần duy nhất chúng hiện đầy đủ.

**5. Chạy `supabase/schema-support.sql`** trong Supabase > SQL Editor. File tạo bốn bảng
(`support_payments`, `entitlement_grants`, `user_entitlements`, `usage_events`) và ba hàm
(`dat_cho_cau_hoi`, `hoan_cau_hoi`, `cap_quyen_ung_ho`). Chạy lại nhiều lần được.

**6. Khai biến môi trường trên Vercel rồi Redeploy.**

```
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
NEXT_PUBLIC_APP_URL=https://celestia-tuvi.vercel.app
```

Redeploy và **bỏ tick build cache** — `NEXT_PUBLIC_APP_URL` nhúng lúc build.

**7. Khai Webhook URL ở payOS**, sau khi bước 6 đã deploy xong:

```
https://celestia-tuvi.vercel.app/api/webhooks/payos
```

payOS gọi thử URL này ngay lúc lưu. Lưu được là xong; báo *Webhook URL invalid* thì xem mục bẫy
bên dưới.

### Kiểm tra sau khi nối

1. Mở `/support`, bấm *Ủng hộ Celes*, chọn 10.000đ, *Tiếp tục thanh toán*.
2. Phải sang được `/support/checkout/<id>` và hiện mã QR.
3. Chuyển khoản thật 10.000đ.
4. Trong vài giây màn hình tự đổi sang *Cảm ơn bạn đã đồng hành cùng Celes* — **không cần tải
   lại trang**. Nếu phải tải lại mới thấy thì webhook chưa về, kiểm tra lại bước 7.
5. Vào Supabase, bảng `entitlement_grants` phải có đúng **một** dòng cho đơn đó.

### Bẫy đã lường trước

- **Ba khoá payOS chỉ dùng phía máy chủ.** Tuyệt đối không thêm tiền tố `NEXT_PUBLIC_` — làm vậy
  là đẩy thẳng khoá vào bundle trình duyệt, ai xem mã nguồn trang cũng đọc được.
- **Khai webhook TRƯỚC khi deploy xong là hỏng.** Lúc chưa có `PAYOS_CHECKSUM_KEY`, endpoint trả
  200 rỗng nên payOS vẫn lưu được URL, nhưng webhook thật sau đó sẽ không cấp quyền cho ai.
- **Đừng khai webhook bằng URL preview của Vercel.** URL đó đổi theo từng lần deploy.
- **Webhook phải là HTTPS.** payOS từ chối HTTP.
- **Báo *Webhook URL invalid*** thường là do endpoint không trả 2XX. Endpoint của Celestia trả
  `{ok:true}` cho lời gọi thử không kèm dữ liệu đơn; nếu vẫn lỗi thì kiểm tra Vercel có chặn
  route bằng middleware hay password protection không.
- **Số tiền lệch không bao giờ được cấp quyền.** Webhook đánh dấu đơn `verification_failed` để
  soát tay.

### Ba điều không được đổi

- **Webhook là nguồn sự thật duy nhất.** Tham số `status` trên URL trả về chỉ dùng để đổi chữ
  trên màn hình, không bao giờ để mở quyền.
- **Quota đặt chỗ TRƯỚC khi gọi model, hoàn lại khi model hỏng.** Trừ sau khi có câu trả lời thì
  mở mười tab bấm cùng lúc là vượt hạn mức.
- **Admin miễn hoàn toàn, nhưng không được cấp quyền supporter giả.** `ADMIN_EMAILS` đọc ở máy
  chủ; nhật ký vẫn ghi `quota_source = admin_exempt` để thấy chi phí thật.

### Ba lớp bảo đảm tiền về thì quyền mở

Xếp theo thứ tự chạy, mỗi lớp đỡ cho lớp trước hỏng:

1. **Webhook** — nhanh nhất, gần như tức thì.
2. **Đối soát khi mở trang thanh toán** — mỗi lần màn hình hỏi trạng thái, máy chủ hỏi thẳng
   payOS. Lớp này đã cứu đúng một đơn thật khi webhook chưa khai được.
3. **Tác vụ định kỳ** `/api/cron/doi-soat` — 15 phút một lần, quét đơn còn treo trong 7 ngày.
   Lo nốt trường hợp người dùng trả tiền xong đóng trình duyệt và không quay lại.

Cả ba đều gọi chung `cap_quyen_ung_ho`, mà hàm đó có `unique(payment_id)` — nên ba lớp cùng chạy
cũng chỉ cấp quyền đúng một lần.

Tác vụ định kỳ cần `CRON_SECRET` (chuỗi ngẫu nhiên dài) trên Vercel. Bỏ trống thì nó tự tắt; hai
lớp kia vẫn chạy.

> **Lịch cron phải hợp với gói Vercel.** Gói Hobby chỉ cho tối đa **một lần mỗi ngày**. Khai dày
> hơn trong `vercel.json` thì Vercel **từ chối cả bản deploy** — không phải chỉ bỏ qua cron, mà
> là build đỏ và production vẫn nằm ở bản cũ. Đang để `0 3 * * *`; lên Pro thì hạ được.

### Con số thương mại

Tất cả nằm ở `lib/support/config.ts`, đọc từ biến môi trường. Đổi trên Vercel rồi redeploy, đừng
sửa rải trong component.

### Nguồn

- Gói miễn phí 2026: https://payos.vn/cong-thanh-toan-mien-phi-2026/
- Tạo kênh thanh toán: https://payos.vn/docs/huong-dan-su-dung/tao-kenh-thanh-toan/
- Xác thực tổ chức: https://payos.vn/docs/huong-dan-su-dung/xac-thuc-to-chuc/
- Webhook + chữ ký: https://payos.vn/docs/du-lieu-tra-ve/webhook/

## 6. Design system

Giao diện dựng theo **Outseta** — "sunset marketplace at golden hour". Toàn bộ quy ước nằm ở
`app/globals.css`, bộ component ở `components/ui/`.

Vài luật dễ vi phạm khi sửa giao diện:

- **Hồng `#df37a7` chỉ dành cho nút hành động chính**, mỗi khung nhìn đúng một cái. Không dùng cho
  liên kết, viền, chữ nhấn hay logo. Muốn nhấn mạnh thì dùng mực Aubergine `#240029`.
- **Không dùng đen hay xám trung tính.** Chữ, viền và bóng đều ngả tím: bóng luôn là
  `rgba(32-41, 0, 36, x)`.
- **Bo góc chỉ có bốn bậc**: 999px (pill/badge) · 14px (thẻ) · 6px (nút) · 3px (ô nhập). Thêm bậc
  thứ năm là làm nhoè ranh giới "chất liệu" giữa các thành phần.
- **Gradient hoàng hôn chỉ dùng cho dải hero tràn màn**, không bao giờ cho thẻ, nút hay icon.
- **Chữ viết tay (Permanent Marker)** tối đa 3 lần mỗi trang và chỉ đặt trên dải gradient — ra nền
  trắng là mất tương phản.
- **Tối đa hai màu chữ trong một thành phần**: `--fg` và `--fg-muted`.

Màu tốt/xấu trong mệnh bàn nằm ở nhóm token riêng (`--chart-tot`, `--chart-hung`) chứ không dùng
`--accent`, vì mệnh bàn có hàng trăm nhãn mà hệ chỉ cho phép một điểm hồng mỗi khung nhìn.

### Ngày / Đêm

Design system gốc chỉ có theme sáng, nên **Ngày là mặc định**. Chế độ Đêm dựng từ Surface level 2
của chính hệ (Dark Plum `#240029` — dải CTA tối cuối trang) kéo dài ra toàn trang.

Hai dải `.hero-band` và `.dark-band` có màu cố định ở cả hai theme nên chúng tự khoá lại bộ token
khớp với nền của mình. Nếu thêm dải nền cố định mới, nhớ làm y hệt — bằng không ở chế độ Đêm chữ
trắng sẽ rơi xuống nền vàng.

---

## 7. Cấu trúc trang

Bản review sản phẩm (16/09/2026) yêu cầu tách rõ ba mặt: trang bán hàng, công cụ, và trang
phương pháp. Kết quả:

| Đường dẫn | Vai trò |
|---|---|
| `/` | Landing công khai — mở bằng nỗi băn khoăn của người đọc, không nhắc kỹ thuật |
| `/cau-chuyen` | Câu chuyện thương hiệu: vì sao có Celes, và Celes không làm gì |
| `/home` | Nơi người đã đăng nhập đáp xuống: điều đáng chú ý hôm nay, giai đoạn đang đi qua, ô trò chuyện |
| `/la-so` | Khám phá bản đồ: nhập thông tin sinh → góc nhìn nhanh → bảng luận giải 8 lĩnh vực → mệnh bàn |
| `/hanh-trinh` | Hành trình: quãng dài → từng năm → từng tháng, có mốc "đang ở đây" |
| `/hanh-trinh/chi-tiet` | Tầng hai của Hành trình: luận hạn đa lớp cho một quãng, kèm căn cứ mở được |
| `/ho-so` | Danh sách lá số, đặt "Lá số của tôi" |
| `/support` | Ủng hộ Celes — người dùng tự tìm tới, không phải cổng chặn |
| `/support/checkout/[id]` | Màn thanh toán một đơn, tự hỏi lại máy chủ cho tới khi quyền được mở |
| `/gioi-thieu` | Cách Celestia tính lá số, câu hỏi thường gặp |
| `/luan-giai` | Khám phá sâu hơn theo chủ đề |
| `/hoi-dap` | Hỏi Celestia |
| `/hop-tuoi` | Kết nối — so hai lá số |
| `/ho-so` | Người của tôi |
| `/admin` | Quản trị — chỉ tài khoản trong `ADMIN_EMAILS` vào được; link hiện trong menu tài khoản của chính họ |
| `/admin/support` | Tình hình Ủng hộ Celes — vào từ `/admin` |

> Công cụ lập lá số đã dời từ `/` sang `/la-so`. Ai đang lưu dấu trang cũ thì bookmark `/` giờ ra
> trang landing.

> Thanh điều hướng khi đã đăng nhập chỉ còn bốn mục: Hôm nay · Hành trình · Hỏi Celes · Kết nối.
> "Khám phá bản đồ" (`/la-so`) vẫn là một route đầy đủ nhưng vào từ trong Hỏi Celes — hai mục đó
> cùng một ý định nên để cạnh nhau ở thanh chính là bắt người dùng tự chọn hộ.

> Khách chưa đăng nhập chỉ nhận Quick Read. Sau ba góc nhìn là **một** khối chuyển đổi duy nhất
> kèm danh sách phần đang khoá — không còn năm sáu lối đi ngang hàng như bản trước. `/hanh-trinh`,
> `/hoi-dap`, `/luan-giai`, `/hop-tuoi` đều dừng ở cổng Gate 1.

### Quy ước ngôn ngữ ở mặt trước

Giao diện người dùng **không nhắc**: Nam phái / Bắc phái, an sao, tên model AI, nhà cung cấp,
Copy JSON, trang Quản trị. Những thứ này chuyển hết vào `/gioi-thieu` (phần giải thích) hoặc
`/admin` (phần cấu hình).

Khi thêm màn mới, đối chiếu bảng từ ngữ:

| Thuật ngữ | Ngôn ngữ mặt trước |
|---|---|
| Luận giải chi tiết | Khám phá sâu hơn |
| Hỏi đáp | Hỏi Celestia |
| Hợp tuổi | Kết nối |
| Hồ sơ | Người của tôi |
| Vận hạn / đại vận / tiểu hạn | Giai đoạn / Năm nay / Tháng này |
| Model AI | Không hiển thị |

Lỗi phía AI **không được** lộ tên model, quota hay nhà cung cấp — người dùng chỉ cần biết dữ
liệu của mình còn nguyên và nên làm gì tiếp.

### Góc nhìn nhanh tính ở đâu

`lib/tuvi/quick-read.ts` dựng ba góc nhìn thẳng từ dữ liệu lá số, **không gọi AI**. Đây là thứ
người dùng mới nhìn thấy đầu tiên; gọi model mất 15-45 giây và có thể hỏng khi hết quota, nên
không được đặt ở chặn đầu. AI vẫn dùng cho bài dài theo chủ đề và phần hỏi đáp.

Muốn sửa lời văn cho 14 chính tinh thì sửa bảng `NET_CHINH_TINH` trong tệp đó.

### Ghi sự kiện phễu

`lib/analytics.ts` có sẵn các điểm gọi theo phễu kích hoạt (`chart_generated`,
`quick_read_viewed`, `why_opened`...). Hiện chỉ lưu vào sessionStorage và in ra console lúc
dev — **chưa nối dịch vụ analytics nào**. Khi chọn được nhà cung cấp, chỉ sửa hàm `ghiSuKien`,
không phải đi rải lại khắp app.

---

## 8. Nhân cách Celes và ngôn ngữ

**Celestia** là thương hiệu — tên sản phẩm, tên miền, logo. **Celes** là người dùng trò chuyện
cùng. Đừng dùng lẫn: người dùng không "hỏi Celestia", họ "hỏi Celes".

Nhân cách Celes định nghĩa ở một chỗ duy nhất — hằng `NHAN_CACH_CELES` trong
`lib/ai/prompt.ts` — và được chèn vào đầu cả prompt hội thoại lẫn prompt bài dài. Sửa giọng
văn thì sửa đúng chỗ đó, không rải ra từng prompt.

Mỗi câu trả lời đi theo năm nhịp: **Phản chiếu → Góc nhìn chính → Vì sao → Điều cần lưu ý →
Bước tiếp theo**. Không đánh số ra ngoài, viết liền mạch.

### Chuyển ngữ VI/EN

Chữ trong giao diện nằm ở `lib/i18n/vi.ts` và `lib/i18n/en.ts`. Bản tiếng Việt là nguồn chân
lý về cấu trúc khoá; bản tiếng Anh được TypeScript kiểm tra theo đúng bộ khoá đó, nên thêm khoá
mới mà quên dịch là **build đỏ ngay**, không âm thầm rơi về tiếng Việt.

Nội dung Quick Read (lời văn cho 14 chính tinh, 12 cung) nằm riêng ở
`lib/tuvi/quick-read-noi-dung.ts` — tách khỏi `quick-read.ts` vì đó là phần VIẾT, không phải
phần TÍNH. Bản tiếng Anh viết lại chứ không dịch từng chữ.

Ngôn ngữ mặc định lấy theo `navigator.languages`, lưu vào localStorage kèm cookie. Không tách
route `/vi` và `/en` — brand spec cho phép dùng locale state, mà tách route thì phải dựng lại
toàn bộ cây app router cho thứ chưa có nội dung SEO riêng.

**Chưa phủ tiếng Anh**: các trang công cụ sâu (`/luan-giai`, `/hoi-dap`, `/hop-tuoi`, `/ho-so`,
`/tai-khoan`, `/gioi-thieu`, `/cau-chuyen`, `/admin`) vẫn chỉ có tiếng Việt, và nội dung AI sinh
ra luôn trả lời tiếng Việt. Nút đổi ngôn ngữ vẫn hiện ở đó, nên người đọc tiếng Anh sẽ gặp
tiếng Việt khi đi sâu — cần dịch nốt trước khi mở cho người dùng nước ngoài.
