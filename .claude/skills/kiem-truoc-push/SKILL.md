---
name: kiem-truoc-push
description: Rà một nhánh Celes trước khi push — chạy đúng bài kiểm theo diff, soát commit lạc từ phiên khác, quét bí mật, kiểm backlog, rồi báo bảng kết luận "push được" hoặc "chưa". Dùng trước khi báo xong việc, khi chủ dự án hỏi "push được chưa" / "rà ok chưa", hoặc ở cuối /lam-tinh-nang và /sua-loi. Chỉ rà, KHÔNG push.
---

# /kiem-truoc-push

Chủ dự án muốn đọc một bảng là biết push được hay chưa, không phải hỏi lại. Mỗi dòng trong bảng phải
là thứ **đã chạy thật**.

Chạy các bước dưới đây trong thư mục hoặc worktree của nhánh cần rà.

## 1. Nhánh đang mang những commit nào
```bash
git fetch origin
git log --oneline origin/main..HEAD
```
Đọc từng dòng. Có commit không thuộc việc này, kiểu CEL khác hay merge lạ, thì nêu lên đầu báo cáo.
Đã từng xảy ra: `d99019d` (CEL-183) suýt lọt theo một nhánh "chỉ có tài liệu".

```bash
npx tsx scripts/kiem-id-cel.ts
```
ID CEL mới của nhánh không được trùng main hay nhánh remote khác (CI `kiem-id-cel.yml` cũng chạy).

## 2. Bài kiểm
```bash
node scripts/kiem-nhanh.mjs --chay
```
Script đọc danh sách bài từ `.github/workflows/kiem-tra.yml` và chọn bài theo đồ thị import của
tệp đã đổi. Đổi cấu hình dựng thì nó tự chạy hết. Có đổi `app/` hoặc `components/` thì nó nhắc
build: build chỉ để CI lo, trừ khi việc này đổi route, layout hay cấu hình trang, khi đó chạy
`npm run build 2>&1 | tail -15`.

Việc chạm prompt, schema đầu ra hay cách cục thì nhắc chủ dự án về các bài chạy model thật
(`eval-chat-quyet-dinh.ts`). Bài đó tốn tiền, nên KHÔNG tự chạy.

## 3. Bí mật và dữ liệu khách
```bash
git diff origin/main...HEAD | grep -n -i -E "(sk-[a-z0-9]{16,}|eyJ[a-zA-Z0-9_-]{20,}|api[_-]?key\s*[:=]|secret\s*[:=]|password\s*[:=]|service_role|@gmail\.com|\b0[0-9]{9}\b)" | head
git diff --name-only origin/main...HEAD | grep -E "\.env|\.pem$|\.key$"
```
Mỗi kết quả trúng đều phải đọc tận mắt. Có khoá thật hoặc email, số điện thoại của khách thì
**chưa push được**.

## 4. Tài liệu
- Có đổi `lib/`, `app/`, `components/` hoặc `supabase/` mà `PRODUCT-BACKLOG.xlsx` không đổi theo
  thì chưa xong. Hook cũng chặn chỗ này lúc commit.
- Có đổi luồng làm việc thì kiểm AGENTS.md, AI-PHOI-HOP.md và `.claude/skills/` có còn nói ngược
  nhau không.

## 5. Báo
```
| Mục | Kết quả |
|---|---|
| Commit trên nhánh | 3 commit, đều thuộc CEL-xxx |
| tsc / lint | ĐẠT / ĐẠT (mốc 5) |
| <từng bài kiem-nhanh chọn> | ĐẠT |
| Build | để CI (không đổi route) |
| Bí mật | sạch |
| Backlog | đã cập nhật trong <commit> |

**Push được.**   (hoặc: **Chưa** — <lý do, việc phải làm>)
```
Bước nào bỏ qua thì ghi rõ là đã bỏ qua và vì sao. KHÔNG push: push luôn là việc chủ dự án bảo.
