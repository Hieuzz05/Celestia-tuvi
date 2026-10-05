<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Celestia — bối cảnh dự án

Web tử vi cá nhân hoá. Deploy: https://celestia-tuvi.vercel.app · Repo: Hieuzz05/Celestia-tuvi

> **Dự án này do HAI AI trên HAI máy cùng phát triển.** Đọc **`AI-PHOI-HOP.md`**
> trước tiên: nhánh nào được đẩy, vùng nào của ai, xử lý xung đột ra sao, và luật
> viết SQL khi hai máy dùng chung một database. Bỏ qua tệp đó là sớm muộn ghi đè
> mất việc của máy kia.

Hướng dẫn vận hành đầy đủ (deploy, biến môi trường, Supabase, bật Google SSO, design system,
cấu trúc trang) nằm ở **`HUONG-DAN.md`** — đọc tệp đó trước khi sửa gì lớn.

## Ba quyết định không được tự đổi

1. **Nam phái làm chuẩn** cho an sao; Bắc phái chỉ dùng đối chiếu khi luận vận hạn.
2. **Ngân sách = 0.** Mọi dịch vụ mới phải nằm trong free tier.
3. **Celestia là thương hiệu, Celes là người dùng trò chuyện cùng.** Người dùng "hỏi Celes",
   không "hỏi AI", không "hỏi Celestia".

## Ngôn ngữ ở mặt trước

Giao diện người dùng **không nhắc**: Nam phái / Bắc phái, "an sao", tên model AI, tên nhà cung
cấp, Copy JSON, trang Quản trị. Những thứ đó chỉ sống ở `/gioi-thieu` (giải thích) hoặc `/admin`
(cấu hình). Lỗi phía AI không được lộ tên model hay quota — người dùng chỉ cần biết dữ liệu của
họ còn nguyên và nên làm gì tiếp.

## Bản đồ mã nguồn

| Việc cần làm | Sửa ở đâu |
|---|---|
| Chữ trong giao diện | `lib/i18n/vi.ts` + `lib/i18n/en.ts` (thiếu khoá bên EN là build đỏ) |
| Lời văn Quick Read (14 chính tinh, 12 cung) | `lib/tuvi/quick-read-noi-dung.ts` |
| Logic đọc lá số ra góc nhìn | `lib/tuvi/quick-read.ts` |
| Dòng thời gian Hành trình | `lib/tuvi/hanh-trinh.ts` |
| Luận hạn chi tiết (tầng hai của Hành trình) | `lib/tuvi/luan-han.ts` |
| Bảng luận giải 8 lĩnh vực | `lib/tuvi/luan-giai-sau.ts` |
| Bộ quy tắc tính + phiên bản | `lib/tuvi/phuong-phap.ts` |
| Lá số đang xem / lá số của tôi / bản nháp | `lib/store/boi-canh.tsx` |
| Hạn mức, bậc quyền, cổng ủng hộ | `lib/support/` + `supabase/schema-support.sql` |
| Con số thương mại (hạn mức, mức tiền) | `lib/support/config.ts` — đọc từ biến môi trường |
| Dấu thương hiệu (web) | `components/Logo.tsx` — `app/icon.svg` phải sửa theo |
| Linh vật Celes (web) | `components/CelesMascot.tsx` + `.celes-anh` / `.celes-tho` trong `app/globals.css`. Bóng đổ nằm ở CSS (`--shadow-celes`, mỗi theme một giá trị), KHÔNG nướng vào ảnh. Linh vật đứng nghiêm khi câu MỚI NHẤT nặng: `lib/linh-vat.ts`. Thêm/đổi ảnh thì chạy `scripts/lam-sach-anh-celes.py` từ PNG gốc, đừng copy tay. **Nơi được đặt** là luật: `docs/chien-luoc/celes-visual-character-system.md` mục 12 — không đặt TRONG vùng nội dung (mệnh bàn, bài luận, dòng thời gian); danh sách chỗ đặt + bài kiểm CI `scripts/test-cho-dat-celes.ts` |
| Giọng và cấu trúc câu trả lời của Celes | `CHUAN_NGON_NGU_CELES` trong `lib/rag/chuan-ngon-ngu.ts` |
| Nhịp và kiểu của MỘT lượt chat | `lib/rag/hop-dong-tra-loi.ts` — hàm thuần, chỉ đổi độ dài và lối nói, KHÔNG chạm kết luận |
| Chat Focused (CEL-186 vé B, sau cờ `CELES_FOCUSED_CHAT=1`) | `lib/rag/focused/` — điểm vào `tra-loi-focused.ts`, nối ở đầu `traLoiCoCanCu`. Cờ tắt = đường STANDARD nguyên vẹn. Phương án + quyết định: `docs/chien-luoc/CEL-186-ve-B-phuong-an.md` |
| Token màu / kiểu chữ / bo góc | `app/globals.css` |
| Component dùng chung | `components/ui/` |
| An sao | `lib/tuvi/ansao.ts` + `lib/tuvi/constants.ts` |

## Luật theo vùng — đọc TRƯỚC khi sửa

Các bẫy đã gặp nằm ở `docs/bay/`, tách theo vùng để không nạp vào mọi lượt:

| Sửa vùng này | Đọc trước |
|---|---|
| `app/**` giao diện, `components/**`, `lib/store/**`, `lib/i18n/**` | `docs/bay/giao-dien.md` |
| `lib/support/**`, `app/api/webhooks/**`, `app/api/support/**`, `app/admin/**` | `docs/bay/quyen-thanh-toan.md` |
| `lib/tuvi/**`, `apps/celes-app/**` | `docs/bay/engine.md` |
| `lib/rag/**`, `lib/ai/**`, `app/api/luan-giai*`, `app/api/hoi-dap`, `lib/ket-noi/**` | `docs/bay/ai-rag.md` |
| Deploy, biến môi trường, sửa tệp bằng dòng lệnh | `docs/bay/moi-truong.md` |

## Luồng làm việc — LUẬT, không phải gợi ý

Dự án này có 9 subagent trong `.claude/agents/`. Luồng dưới đây là bắt buộc với
mọi AI làm trên repo, cả hai máy.

### Mở phiên: chủ dự án đánh dấu loại việc

`[CHIẾN LƯỢC]` · `[CODE]` · `[SỬA LỖI]`. Không có dấu thì AI hỏi lại một câu
ngắn, đừng tự đoán rồi đi sai luồng.

Mỗi dấu có một skill chứa các bước làm được — **thấy dấu thì AI tự gọi skill, không chờ gõ lệnh**:

| Dấu | Skill | Bước chung lúc mở phiên |
|---|---|---|
| `[CHIẾN LƯỢC]` | `/chien-luoc` | `.claude/skills/lam-tinh-nang/mo-phien.md` |
| `[CODE]` | `/lam-tinh-nang` | (đọc TRANG-THAI, worktree nếu thư mục có phiên khác, |
| `[SỬA LỖI]` | `/sua-loi` | nhánh `viec/*`, ghi "Đang làm" lên main, đọc `docs/bay`) |

Ba skill phụ: `/kiem-truoc-push` (bảng "push được / chưa"), `/cap-nhat-backlog` (ghi
`PRODUCT-BACKLOG.xlsx`, cấp ID không trùng), `/bai-hoc` (xem dưới). Luật CỨNG vẫn nằm ở tệp này;
skill chỉ là các bước. Đổi luồng thì grep cả `.claude/skills/` và `AI-PHOI-HOP.md` — ba nơi
nói ngược nhau là chuyện đã xảy ra (`docs/bai-hoc/NHAT-KY.md`, 03/10/2026).

**Cỡ việc (chủ dự án quyết 02/10/2026).** `phan-bien`, `danh-gia-tac-dong`, `bien-tap-vi` chỉ bắt
buộc với việc LỚN: đổi kiến trúc, đổi hợp đồng trả lời / prompt / schema, đổi chữ quan trọng ở mặt
trước, thêm dịch vụ, tính năng mới cần ID, chạm vùng Chung, hoặc đóng một tính năng lớn. Việc nhỏ
bỏ ba reviewer đó; `researcher` và `qa` vẫn giữ. Không chắc thì coi là Lớn và nói rõ đã chọn cỡ nào.

### Bài học — làm sai một lần, cả hai máy cùng nhớ

Có cái giá thật (mất thời gian, lỗi lọt, chủ dự án phải sửa lưng, hoặc cách mới đo được là tốt
hơn) thì gọi `/bai-hoc`: ghi `docs/bai-hoc/NHAT-KY.md`, nâng luật lên `docs/bai-hoc/cach-lam.md`
(nạp mọi phiên qua `CLAUDE.md`) hoặc `docs/bay/<vùng>.md`. **Lặp lần 2 thì chữ không đủ — đề xuất
máy canh** (test / hook / CI). Chủ dự án nói "sai rồi", "lại quên", "không phải thế" là tín hiệu
phải gọi. Memory của Claude là cục bộ một máy — bài học dùng chung KHÔNG ghi vào đó.

### Luồng A — `[CHIẾN LƯỢC]`

```
quet-doi-thu (nếu cần dữ liệu ngoài) → tổng hợp → phan-bien → trình bày → chủ
dự án quyết → GHI QUYẾT ĐỊNH RA TỆP → đóng phiên
```

**Luật cứng: không trình bày một kết luận chiến lược nào mà chưa qua
`phan-bien`.** Trình bày phải kèm mục "Sập / Lung lay / Đứng được".

Phiên này **không chạm** `lib/`, `app/`, `components/`. Quyết xong thì mở phiên
`[CODE]` mới.

Quyết định không ghi ra tệp coi như chưa quyết — `/clear` một cái là mất, tuần
sau nghiên cứu lại từ đầu.

### Luồng B — `[CODE]`

```
git status → tạo nhánh viec/<tên> → researcher → trình phương án
  → phan-bien ← TRƯỚC khi viết dòng code nào
  → danh-gia-tac-dong ← cờ "CẦN CHỦ DỰ ÁN DUYỆT" bật thì DỪNG, trình trước
  → chủ dự án duyệt → viết code (phiên chính, KHÔNG giao subagent)
  → celes-domain + qa + bien-tap-vi ← gọi trong MỘT lượt, chạy song song
  → soat-tai-lieu → cập nhật PRODUCT-BACKLOG.xlsx → commit
  → chủ dự án nghiệm thu → push khi được bảo
```

Thêm `soat-chi-phi` khi thay đổi chạm dịch vụ ngoài, model AI, cron, hay thư
viện mới.

`danh-gia-tac-dong` trả lời câu khác `phan-bien`: không phải "ý này có sai không" mà
"làm ý này thì cái gì đang chạy đổi theo" — bộ đệm, luật cốt lõi, app, chi phí, bộ đo.
Chạy lại nó trên diff thật trước commit nếu code đã lệch khỏi phương án.

**Phản biện phương án tốn hai phút; vứt code đã viết tốn cả buổi.** Đây là lý do
`phan-bien` đứng trước bước viết code, không phải sau.

### Luồng C — `[SỬA LỖI]`

```
researcher (tìm nguyên nhân gốc) → sửa → qa (+ celes-domain nếu chạm luận giải)
  → commit → nghiệm thu → push
```

Bỏ `phan-bien`: lỗi thì không có phương án để phản biện.

### Ba việc KHÔNG giao subagent

1. **Viết code.** Subagent viết xong thì phiên chính không nắm được nó viết gì,
   lần sửa sau mâu thuẫn với chính mình.
2. **Ra quyết định sản phẩm.** Subagent chuẩn bị dữ liệu, chủ dự án quyết.
3. **Nghiệm thu và push.** Luôn là người.

### Nhiều phiên song song

Tối đa 2–3 phiên, **mỗi phiên một nhánh**, và chúng phải ở **vùng mã tách biệt**.

Cặp nguy hiểm nhất: một phiên sửa `lib/tuvi/**` trong khi phiên khác sửa
`apps/celes-app/**` — app đọc thẳng engine qua `@tuvi/*`, sửa engine là cả hai
cùng đổi. Không mở song song cặp này.

### Đóng phiên

Đóng khi: việc đã commit xanh và được nghiệm thu · chuyển sang việc khác vùng mã
(kể cả đang giữa chừng) · phiên chạy quá ~2 giờ.

`/clear` thay vì đóng khi vẫn cùng vùng mã nhưng sang việc khác.

Chưa xong mà phải dừng: ghi trạng thái ra tệp trong thư mục tạm trước khi đóng.

### Trước khi đóng phiên: ghi ra tệp

Ngữ cảnh phiên không phải nơi lưu trữ. Phiên đóng là thứ chưa ghi ra tệp coi như
chưa từng có — đọc lại bản ghi `.jsonl` tốn kém hơn làm lại.

| Loại | Ghi vào | Có commit? |
|---|---|---|
| Quyết định chiến lược, định hướng | `.md` / `.xlsx` trong kho | Có |
| Phân tích đối thủ | `docs/doi-thu/<tên>.md` | Có |
| Trạng thái việc đang dở | thư mục tạm của phiên, hoặc nhánh chưa commit | Không |
| Số liệu nghiên cứu có nguồn | kèm luôn vào tệp quyết định | Có |

Khi chủ dự án nói "tóm tắt trạng thái để phiên sau tiếp", AI ghi ra tệp trong thư
mục tạm **và in đường dẫn ra màn hình** — không in thì chủ dự án không tìm lại được.

### Bảng tra nhanh

| Subagent | Dùng khi | Ai gọi |
|---|---|---|
| `researcher` | Trước mọi thay đổi mã | AI tự |
| `phan-bien` | Có kết luận / phương án / thiết kế cần đánh sập | AI tự theo luồng A, B |
| `quet-doi-thu` | Cần biết đối thủ đang làm gì | AI tự |
| `danh-gia-tac-dong` | Sau `phan-bien`, trước khi viết code: tác động lên phần đã có, cờ cần duyệt | AI tự theo luồng B |
| `celes-domain` | Sau khi chạm `lib/tuvi`, `lib/rag`, prompt, nội dung luận | AI tự |
| `qa` | Sau mọi thay đổi mã | AI tự |
| `bien-tap-vi` | Sau khi đổi chữ mặt trước | AI tự |
| `soat-tai-lieu` | Trước commit đổi tính năng / logic | AI tự |
| `soat-chi-phi` | Trước khi thêm dịch vụ, cron, model, thư viện | AI tự |

## Tiết kiệm ngữ cảnh (mọi AI làm trên repo này)

- Một việc = một phiên. Xong việc thì xoá ngữ cảnh (`/clear`), đừng kéo một phiên qua nhiều ngày.
- Tìm trước, đọc sau: dùng grep / glob, chỉ đọc đoạn cần. KHÔNG đọc nguyên các tệp lớn:
  `MAU-DE-VIET-LAI.md` (~500KB), `MAU-VANG-LUAN-GIAI*.md`, `KIEN-TRUC-LUAN-GIAI.md`, `HUONG-DAN.md`.
- Việc đọc rộng (rà repo, lần luồng dữ liệu) giao subagent `researcher`; phiên chính chỉ nhận bản tóm tắt.
- Lệnh có output dài (build, test, log, JSON): lọc bằng `tail`, `grep`, `head` trước khi đưa vào ngữ cảnh.
- Không chạy lại cả bộ so mù / sinh bài dài trong phiên khi không cần — tốn cả tiền API lẫn ngữ cảnh.

## Kiểm tra trước khi commit

Trong lúc làm: `node scripts/kiem-nhanh.mjs --chay` — chỉ chạy tsc, lint và các bài CI phủ đúng tệp
vừa đổi (đọc đồ thị import). Danh sách đầy đủ dưới đây là thứ CI chạy; tay chỉ cần khi đổi cấu
hình dựng hoặc tái hiện CI đỏ. Trước khi báo "push được": `/kiem-truoc-push`.

```
npx tsc --noEmit          # phải sạch
npm run build             # phải qua
node scripts/dem-loi-lint.mjs  # lint, chặn nếu vượt mốc (đang 5 lỗi set-state-in-effect)
npx tsx scripts/test-ansao-chuan.ts   # engine an sao: công thức sách + lịch + 60 mẫu đóng băng — offline
npx tsx scripts/test-rag-planner.ts   # từ điển thực thể, planner (cả trục thời gian + chip sang năm), validator — offline
npx tsx scripts/eval-planner.ts       # bộ vàng 100 câu (tính 03/10/2026, CEL-186 vé A, có tháng mục tiêu, chặn năm sinh; có mục "đúng trục thời gian"), ĐANG 100% — không được tụt
npx tsx scripts/test-chuan-ngon-ngu.ts  # chuẩn ngôn ngữ trên bài đọc sâu — offline
npx tsx scripts/test-cach-cuc.ts      # lớp cách cục: luật nào chết, sàn 2 trần 8 — offline
npx tsx scripts/test-12-cung.ts       # bài luận 12 cung: bao phủ, ngân sách mở đầu — offline
npx tsx scripts/test-phu-du-kien.ts   # độ phủ dữ kiện: mọi sao cung chính có nghĩa theo cung, xung chiếu có nghĩa — offline
npx tsx scripts/test-boi-canh-doc.ts  # bối cảnh người đọc + cấu hình độ dài: khoá đệm, luật không đổi kết luận — offline
npx tsx scripts/test-an-toan.ts       # lớp an toàn chat: bắt đúng câu khủng hoảng, không bắt nhầm "Tử Tức" — offline
npx tsx scripts/test-hop-dong-tra-loi.ts # nhịp/kiểu lượt chat: không chạm kết luận, thứ tự khối — offline
npx tsx scripts/test-sua-chua-tach.ts  # lớp sửa câu giữ nguyên xuống dòng, tiêu đề, danh sách; ráp lại đúng nguyên văn — offline
npx tsx scripts/test-dau-an.ts         # dấu ấn Celes: cổng (an toàn, ketLuan, bỏ dẫn dắt, câu nối), chống lặp, đầu-cuối trên văn cuối — offline
npx tsx scripts/do-coverage-dau-an.ts  # dấu ấn: thư viện qua checker, UNREACHABLE = 0, mọi cổng chặn đủ — offline (tập DB bỏ qua nếu thiếu .env.local)
npx tsx scripts/test-linh-vat-an-toan.ts # linh vật nghiêm theo lượt MỚI NHẤT, không dính cả hội thoại — offline
npx tsx scripts/test-cho-dat-celes.ts   # linh vật: ảnh ↔ public/celes, không ảnh khoá, chỉ tệp trong danh sách mục 12 — offline
npx tsx scripts/test-du-kien.ts        # dữ kiện phần đang hỏi: nghiêng về, mốc, cờ Focused tắt giữ nguyên — offline
npx tsx scripts/test-focused.ts        # đường Focused: cờ tắt giữ STANDARD, guard, câu mã, hết câu có căn cứ → thử lại → 502 — offline
npx tsx scripts/test-loi-chi-ma.ts      # lối trả lượt bằng mã: chỉ dữ kiện / hỏi lại (không tính lượt) / đúng 1 ngoại lệ tạm AGE-02 — offline
npx tsx scripts/test-hieu-cau.ts        # hiểu câu qua lượt: meta ký HMAC + ràng buộc, F### dựng lại đúng y, hỏi lại "lá số của ai", giải thích lượt trước — offline
npx tsx scripts/test-fallback-giu-nguyen.ts # fallback.ts (vùng Chung): không đặt biến eval thì chọn model y như bản trước CEL-186 — offline
npx tsx scripts/test-moi-truong-dem.ts  # đệm AI tách theo môi trường: production giữ khoá cũ, Preview/local có tiền tố, cấu hình chỉ production ghi — offline
npx tsx scripts/test-priv-01.ts        # PRIV-01: vết Production không giữ câu hỏi, văn trả lời, băm lá số không muối — offline
npx tsx scripts/test-p0-chan-doan.ts   # harness P0: chẩn đoán tầng hỏng sớm nhất, cờ không chặn chẩn đoán, nhãn judge/người — offline
npx tsx scripts/test-nghiem-ly.ts      # nghiệm lý của chủ dự án (QĐ-13) + khối T###: T phải kèm F, vòng T↔T giải tất định, cờ tắt giữ nguyên — offline
npx tsx scripts/test-phan-hoi.ts       # 👍👎: chỉ nhãn đóng, chỉ lượt của chính mình, màn Cần duyệt chỉ cột an toàn — offline
npx tsx scripts/test-do-phu-viet.ts    # độ phủ tầng viết (đo, chưa đổi Writer) — offline
npx tsx scripts/test-hoi-thoai.ts     # trí nhớ hội thoại: chạm DB thật, KHÔNG gọi model
npx tsx scripts/eval-chat-quyet-dinh.ts # model thật; chạy khi đổi prompt / schema đầu ra / cách cục
npx tsx scripts/eval-focused.ts        # model thật: 30+ ca Focused + Barnum 6×6; BẮT BUỘC AI_GHIM_MODEL + AI_TRAN_USD (≤ $2) + giá — xem đầu tệp
npx tsx scripts/eval-phu-du-kien.ts --sinh|--cham  # model thật: A/B mã cũ–mới trên dữ kiện cung chính/xung chiếu (xem đầu tệp)
npx tsx scripts/test-rag-toan-tuyen.ts  # chạm DB thật + model thật; chạy khi đổi schema/SQL
node scripts/test-hover-nhay.mjs   # mệnh bàn không được nhấp nháy khi rê chuột
npm run kiem-tra-sso      # trạng thái đăng nhập Google
```

Nếu lint vượt mốc, đó là lỗi bạn vừa thêm vào — sửa, đừng bỏ qua. Sửa bớt được lỗi cũ thì HẠ
`MOC` trong `scripts/dem-loi-lint.mjs`, đừng bao giờ nâng.

**CI (`.github/workflows/kiem-tra.yml`) chạy tự động các bài OFFLINE ở trên (tsc, lint, engine,
planner, bộ vàng, chuẩn ngôn ngữ, cách cục, 12 cung, độ phủ dữ kiện, an toàn chat, hợp đồng trả lời, sửa câu, dấu ấn, linh vật nghiêm theo lượt, chỗ đặt linh vật, dữ kiện phần đang hỏi, đường Focused, lối dừng bằng mã, hiểu câu qua lượt, fallback giữ nguyên, đệm AI tách theo môi trường, quyền riêng tư vết, harness P0, nghiệm lý, phản hồi, độ phủ tầng viết, build) trên mọi lần đẩy nhánh.** Nhánh đỏ CI
thì chưa được xin gộp. Các bài chạm DB thật / model thật vẫn chạy tay.

**Và một việc nữa, không phải lệnh chạy được:** nếu commit này đổi một tính năng, đổi một luồng
logic, hay thêm một luật bất biến mới, thì cập nhật `PRODUCT-BACKLOG.xlsx` TRONG CÙNG commit đó.

- Đổi tính năng → sửa dòng tương ứng ở sheet `Backlog`, cập nhật cả hai cột `Cập nhật` và `Commit`.
- Đổi logic → sửa sheet `Logic chi tiết`. Backlog nói CÓ GÌ, Logic nói CHẠY THẾ NÀO; sửa mỗi
  Backlog là để lại một bản mô tả logic đã sai.
- Luôn thêm một dòng vào sheet `Nhật ký thay đổi`. Cột `Vì sao` là cột quan trọng nhất — sau vài
  tháng nó là thứ duy nhất còn giải thích được quyết định.
- Tính năng mới thì cấp ID kế tiếp, không dùng lại ID cũ.

Để việc này thành "nhớ thì làm" là hai tuần sau tệp đó mô tả một sản phẩm không còn tồn tại, và
lúc ấy nó tệ hơn không có gì — vì người đọc vẫn tin nó.

Sửa tệp .xlsx bằng openpyxl (`python -c` hoặc một script trong thư mục tạm), đừng mở bằng tay.

Cách sửa lỗi `set-state-in-effect` khi cần nạp dữ liệu lúc mở trang: tách hàm đọc thành một hàm
RỖNG khỏi setState (trả về dữ liệu hoặc `{ loi }`), rồi đặt state trong `.then` của effect. Xem
`app/admin/models/page.tsx` hoặc `app/admin/knowledge/page.tsx`.

## App di động — ĐANG LÀM (GĐ1, từ 27/09/2026)

`apps/celes-app/` (Expo + expo-router) mở lại ngày 27/09/2026: chủ dự án chọn dựng app riêng
(không PWA), iOS trước, một bộ code cho cả Android. Luồng và giao diện ĐÃ DUYỆT nằm trên canvas
"Celes iOS — luồng app" (12 màn, kèm ghi chú token và ba giọng viết). Chốt:
- Từ 29/09/2026 app theo thiết kế **Aurora bản 8** (`docs/thiet-ke/celes-ios/aurora/gen.py`,
  bản dựng thử https://celes-thiet-ke.vercel.app): theme tối mặc định nền `#0B0A0D`, mỗi tab một
  màu vùng, thẻ bo 20 / nút 14, nút chính vẫn gradient `#D32298`, font riêng của app. Web CHƯA
  đổi theo. Lá số hiện ĐẦY ĐỦ như web, mạnh–yếu có biểu đồ radar.
- Năm tab: Hôm nay · Lá số · Celes · Hành trình · Mối quan hệ. Tài khoản mở từ ảnh đại diện.
- Thanh toán TẠM ẨN trên iOS; mở lại thì dùng mua trong app (quy định 3.1.1), không PayOS.
- Làm bản nội bộ trước (Expo Go → TestFlight khi có tài khoản Apple Developer).

Luật màn hẹp (390px không cuộn ngang, vùng chạm ≥ 44px): xem `docs/bay/giao-dien.md`.
Đọc `apps/celes-app/README.md` trước nếu buộc phải sửa app.

Điểm dễ vấp nhất: **app không có bản sao engine an sao**, nó đọc thẳng `lib/tuvi/`
qua `metro.config.js` và bí danh `@tuvi/*`. Sửa engine là cả web lẫn app cùng đổi.
Đừng "tiện tay" sao chép engine sang app.

Web ở gốc kho và app là hai dự án npm tách biệt. `tsconfig.json` và
`eslint.config.mjs` của web đều đã loại trừ `apps/` — nếu thấy `npm run lint` ở
gốc nhảy quá 9 lỗi, kiểm tra xem loại trừ đó còn không.

## Việc còn dang dở

Xem mục "Trạng thái tính năng" trong `HUONG-DAN.md`. Hai việc lớn nhất còn lại: lớp NGÀY của Hành
trình (cần đối chiếu quy tắc an ngày hạn) và cổng Gate 2 cho gói Plus. Mệnh bàn mobile (`app/ban-do.tsx`
trong `apps/celes-app`): lưới 4×4 MỘT phiên bản, từ 28/09/2026 hiện đủ nội dung như mệnh bàn web
(tứ hoá, đủ phụ tinh + vòng sao hai cột cát/hung, hạn, tam phương, bảng giữa, năm xem), vừa bề
ngang màn hình, không cuộn ngang — xem luật 3 trong `apps/celes-app/README.md`. Hai tài liệu định hướng gốc:
`D:\Celestia\Celestia_Product_UX_Commercialization_Report.pdf` và
`D:\Celestia\Celestia_Brand_Product_UX_Master_Spec.pdf` (bản sau thay thế bản trước).

Đang chờ người dùng quyết: (1) gói và giá cho bản trả phí, (2) làm PWA hay dựng app
React Native riêng.
