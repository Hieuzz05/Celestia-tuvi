# Thiết kế app iOS Celes — bản lưu

Hai canvas thiết kế app đang sống trên claude.ai dưới tài khoản **it-ba@sapp.edu.vn**.
Tài khoản đó sắp mất quyền truy cập, và artifact không chuyển chủ được — nên toàn bộ mã
nguồn được lưu ở đây. Mất tài khoản thì mất link, **không mất thiết kế**.

| Thư mục | Canvas gốc (đã xoá khỏi it-ba ngày 29/09/2026) | Ghi chú |
|---|---|---|
| `aurora/` | ~~NMRtuGEvTVXNAhsUQNchSP~~ | Bản mới nhất (bản 7, 29/09/2026). Sinh bằng `gen.py`. |
| `luong-app/` | ~~3kyf5Y9xTeRGpa5XHM3M7J~~ | "Celes iOS — luồng app", 12 màn đã duyệt ngày 27/09/2026. Viết tay, không có script sinh. |

Trước khi xoá đã đối chiếu: mọi tệp `project/*` ở đây khớp từng byte với bản trên claude.ai;
hai canvas không có bình luận, không có tệp tải lên. Phần còn lại của canvas (`artifact-type/*`,
`SKILL.md`) là mã chung của kiểu Design, tạo canvas mới là tự có.

## Xem trên web (chia sẻ cho người khác)

**https://celes-thiet-ke.vercel.app** — dự án Vercel `celes-thiet-ke` của tài khoản duyhieu24082000
(không dính mail it-ba), công khai, ai có link cũng xem được.

`aurora/index.html` là trang mục lục 16 màn, sinh cùng `gen.py`. Cập nhật sau khi sửa thiết kế:
chép `index.html` + `project/*.dc.html` sang một thư mục trống rồi `npx vercel deploy --prod --name celes-thiet-ke`
(không deploy thẳng từ repo để khỏi đẩy lên gen.py, shot.sh).

## Sửa và sinh lại `aurora/`

Mọi màn đều sinh từ `gen.py`, **đừng sửa tay `project/*.dc.html`**, lần sinh sau sẽ ghi đè.

```
cd docs/thiet-ke/celes-ios/aurora
PYTHONIOENCODING=utf-8 python gen.py      # ghi project/*.dc.html + project/canvas.json
bash shot.sh LaSo TongQuan                # chụp bằng Chrome headless ra shots/ (không commit)
```

`shot.sh` dùng đường dẫn Chrome cứng `/c/Program Files/Google/Chrome/Application/chrome.exe`.
Máy khác thì sửa dòng đó.

Flow tab Lá số: Lá số (4a) → chạm cung (4b) · Tổng quan (4c, đọc cả lá số) → Chuyên sâu
(4d, 14 chủ đề) → Đọc một chủ đề (4e) · Mạnh – yếu (4f). Ghi chú đầy đủ nằm trong
`canvas.json` (thẻ `n4`).

## Publish lại từ tài khoản khác

Nhờ Claude Code (đăng nhập tài khoản mới) làm, ví dụ:

> Tạo canvas mới từ Artifact type **Design**, tên "Celes iOS — Aurora". Gắn
> `docs/thiet-ke/celes-ios/aurora/project/canvas.json` làm tệp chính và mọi
> `project/*.dc.html` làm tệp đi kèm, giữ nguyên đường dẫn `project/…`.

Làm tương tự với `luong-app/project/`. Sau đó cập nhật link ở bảng trên và ở
`AGENTS.md` (mục App di động).

## Những gì KHÔNG mang theo được

Các thứ sau chỉ nằm trên claude.ai, mất quyền tài khoản là mất:
- Bình luận trên canvas.
- Dữ liệu lưu trong artifact (nếu có).
- Thiết lập chia sẻ: link cũ ngừng chạy, phải gửi lại link mới.

## Việc chủ dự án cần tự rà (ngoài repo)

- 30/09/2026: `ADMIN_EMAILS` trên Vercel (Production + Preview) và git user.email của repo đã
  chuyển sang `duyhieu24082000@gmail.com`.
- Tài khoản it-ba còn **23 artifact không thuộc Celes**. Cần tự sao lưu những cái còn dùng.
- Kiểm tra Vercel (`celestia-tuvi`), Supabase, Google Cloud (OAuth của SSO) và GitHub
  đang gắn mail nào. Nếu là it-ba thì thêm một chủ sở hữu khác **trước khi** mất quyền mail.
- Repo `Hieuzz05/Celestia-tuvi` đang **công khai**, nên thư mục này cũng công khai. Nội dung
  chỉ có dữ liệu mẫu, không có khoá hay dữ liệu người dùng.
