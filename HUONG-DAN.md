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
5. Vào **Settings → Environment Variables**, khai báo các biến ở mục 2 & 3 bên dưới, rồi vào tab **Deployments** → bấm **⋯** ở bản mới nhất → **Redeploy** để biến môi trường có hiệu lực.

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
AI_FALLBACK_ORDER=gemini|gemini-2.5-flash,openrouter|deepseek/deepseek-chat-v3-0324:free
```

Bỏ trống biến này thì thứ tự mặc định là: Gemini → OpenRouter → OpenAI → Anthropic.

### 2.5 Kiểm tra

Vào trang **/admin**: xem model nào đã có key, dán thử key vào ô *Test kết nối* để xác nhận key và tên model dùng được, trước khi đưa lên Vercel.

---

## 3. Nối database & bật đăng nhập (Supabase)

Supabase cho cả 4 thứ trong một gói miễn phí: database Postgres, đăng nhập, lưu file, và pgvector cho RAG.

### 3.1 Tạo project

1. Đăng ký tại https://supabase.com → **New project**.
2. Đặt tên `tuvi-ai`, chọn region gần Việt Nam (Singapore), đặt mật khẩu database và **lưu lại**.
3. Vào **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (chỉ dùng phía server, không bao giờ để lộ)

### 3.2 Bật đăng nhập

- **Email/mật khẩu**: đã bật sẵn. Trong **Authentication → Providers → Email**, nếu muốn đăng nhập được ngay không cần xác nhận email thì tắt *Confirm email* (giai đoạn thử nghiệm).
- **Google**: vào **Authentication → Providers → Google**, bật lên và điền Client ID / Client Secret lấy từ Google Cloud Console. Trong phần **URL Configuration**, thêm:
  - Site URL: `https://<tên-project>.vercel.app`
  - Redirect URLs: `https://<tên-project>.vercel.app/auth/callback` và `http://localhost:3000/auth/callback`

### 3.3 Chỉ định tài khoản quản trị

```
ADMIN_EMAILS=it-ba@sapp.edu.vn
```

Khi biến này để trống, trang `/admin` mở cho tất cả — chỉ nên như vậy lúc chạy máy cá nhân.

### 3.4 Các bảng sẽ tạo ở bước sau

Khi bạn gửi thông tin Supabase, tôi sẽ tạo migration cho:

| Bảng | Dùng để |
|---|---|
| `profiles` | Thông tin tài khoản |
| `charts` | Lá số đã lưu (thay cho localStorage hiện tại) |
| `readings` | Các bản luận giải AI đã tạo |
| `knowledge_documents`, `knowledge_chunks` | Kho tri thức + vector cho RAG |
| `ai_provider_configs`, `ai_usage_logs` | Cấu hình model và log sử dụng |

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
| `SUPABASE_SERVICE_ROLE_KEY` | Sau này | Thao tác phía server |
| `ADMIN_EMAILS` | Nên có khi public | Giới hạn quyền vào `/admin` |

---

## 5. Trạng thái tính năng

| Tính năng | Hiện tại |
|---|---|
| Lập lá số, an sao Nam phái | Xong |
| Mệnh bàn 12 cung, độ sáng sao, Tuần–Triệt, tam phương tứ chính | Xong |
| Đại vận / tiểu hạn / nguyệt hạn | Xong |
| Lịch âm dương, giờ hoàng đạo | Xong |
| Luận giải AI 7 chủ đề, fallback nhiều model | Xong — cần API key |
| Đăng nhập email + Google | Xong — cần Supabase |
| Lưu hồ sơ | Đang lưu ở trình duyệt, sẽ chuyển sang database |
| Kho tri thức RAG | Chưa — cần database |
| Xem ngày tốt, hợp tuổi, chat hỏi đáp | Chưa |
