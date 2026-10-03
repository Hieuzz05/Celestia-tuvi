# Mở phiên — bước chung của /lam-tinh-nang, /sua-loi, /chien-luoc

Nguồn luật: `AI-PHOI-HOP.md` §1–§3. Đây là bản làm được từng bước của các mục đó.
Riêng `/chien-luoc` chỉ làm bước 2 và 6, vì phiên chiến lược không chạm mã.

1. **Thư mục này có phải của mình không.**
   ```bash
   git status --short | grep -v '^??' ; git branch --show-current ; git worktree list
   ```
   Nếu có thay đổi chưa commit hoặc đang đứng ở nhánh `viec/*` không phải việc này, coi như có phiên
   khác đang dùng thư mục. KHÔNG `checkout`. Dựng worktree riêng ở bước 4. Lý do: sự cố 27/09
   trong `TRANG-THAI.md`.

2. **Máy kia đang làm gì.**
   ```bash
   git fetch origin
   git show origin/main:TRANG-THAI.md | sed -n '/^## Đang làm/,/^## Vừa xong/p'
   ```
   Có ai đang chạm cùng tệp hoặc cùng vùng thì DỪNG, báo chủ dự án. Bảng "Đang làm" rỗng không có
   nghĩa là không ai làm; xem thêm `git branch -r --sort=-committerdate | head`.

3. **Máy này đủ điều kiện chạy không.** Bước này chỉ cho việc mã:
   `npx tsx scripts/kiem-moi-truong.ts 2>&1 | tail -20`.

4. **Nhánh riêng, cắt từ `origin/main`.**
   - Thư mục sạch và là của mình: `git switch -c viec/<ten> origin/main`.
   - Không thì dùng worktree: `git worktree add "D:/SAPP BA/tuvi-ai-<ten>" -b viec/<ten> origin/main`.
     Worktree mới chưa có `node_modules`. Chạy web trong worktree có `node_modules` liên kết thì
     phải dùng `next dev --webpack`, xem `docs/bay/moi-truong.md`.

5. **Ghi dòng "Đang làm" lên `main`.** Ghi vào `TRANG-THAI.md`, cột Ai ghi kèm thư mục đang dùng.
   Làm bằng worktree tách riêng như `/bai-hoc` bước 5, đổi `docs/bai-hoc/` thành `TRANG-THAI.md`,
   commit `DOCS: TRANG-THAI — dang lam <viec>`. Sắp chạm vùng **Chung** (`lib/tuvi/`, `AGENTS.md`,
   `package.json`, `supabase/`) thì ghi rõ ở cột "Chạm vào tệp nào".

6. **Đọc bẫy của vùng sắp chạm.** Đọc `docs/bay/<vùng>.md` theo bảng "Luật theo vùng" trong
   AGENTS.md. Grep thêm `docs/bai-hoc/NHAT-KY.md` theo 2–3 từ khoá của việc này. `cach-lam.md`
   thì đã được nạp sẵn.
