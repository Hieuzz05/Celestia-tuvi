---
name: bai-hoc
description: Ghi một bài học (lesson learned) của Celes — khi AI làm sai có cái giá thật, khi chủ dự án sửa lưng ("sai rồi", "không phải thế", "lại quên"), khi test/reviewer bắt được thứ AI lẽ ra phải biết, hoặc khi tìm ra cách làm tốt hơn đã được kết quả chứng minh. Ghi vào docs/bai-hoc, nâng luật lên đúng chỗ, lặp lần 2 thì đề xuất máy canh. Cũng dùng ở cuối mọi phiên /lam-tinh-nang, /sua-loi, /chien-luoc.
---

# /bai-hoc [mô tả ngắn]

Mục tiêu: lần sau, ở cả HAI máy, không trả lại cái giá này. Ghi để làm khác đi, không phải để kể lại.

## 1. Có đáng ghi không

Chỉ ghi khi có **cái giá thật**:
- mất thời gian (vòng sửa thừa, chạy lại, đi sai hướng);
- lỗi lọt ra (CI đỏ, prod, reviewer bắt);
- chủ dự án phải sửa lưng hoặc hỏi lại;
- hoặc một cách mới **đã đo được** là tốt hơn.

Không có giá thì dừng và báo "không có bài học". Đừng độn cho đủ thủ tục.

## 2. Tìm lần lặp — làm TRƯỚC khi viết

```bash
grep -n -i -E "<2-3 từ khoá không dấu>" docs/bai-hoc/NHAT-KY.md docs/bai-hoc/cach-lam.md docs/bay/*.md
```

- **Chưa có:** viết mục mới, để `Lần: 1`.
- **Đã có mục cùng gốc:** KHÔNG viết mục mới. Tăng `Lần` của mục cũ, thêm một dòng
  `- Lặp dd/mm: <chuyện lần này>`. Lặp tới lần 2 là chữ đã không đủ: bắt buộc chuyển sang bước 4b.
- **Luật đã có trong cach-lam.md hoặc docs/bay mà vẫn sai:** lần này không phải thiếu luật mà luật
  không chặn được. Đó là lần lặp, đi bước 4b.

## 3. Viết mục vào NHAT-KY.md

Dùng mẫu ở đầu `docs/bai-hoc/NHAT-KY.md`. Ba dòng quan trọng:
- **Gốc**: vì sao xảy ra. "Quên chạy test" không phải gốc; "bước kiểm không nằm trong luồng mà phụ
  thuộc trí nhớ" mới là gốc.
- **Giá**: cụ thể bằng thời gian, mã commit, hoặc ai phải làm lại.
- **Luật**: một câu làm được, kiểm được. Câu kiểu "cẩn thận hơn" là chưa xong.

## 4. Nâng luật lên đúng chỗ

a. **Lần 1.** Nâng chữ lên chỗ phù hợp:
   - Cách làm việc của AI → `docs/bai-hoc/cach-lam.md`. Một gạch đầu dòng: luật in đậm, rồi lý do
     kèm ngày. Tệp đã gần 40 luật thì gộp hoặc rút luật cũ trước.
   - Bẫy kỹ thuật một vùng → `docs/bay/<vùng>.md`, theo đúng giọng các mục đang có.
   - Luật sản phẩm → cột `Luật bất biến` qua `/cap-nhat-backlog`.

b. **Lần 2 trở lên**, hoặc luật đếm được bằng mã. Đề xuất **máy canh** với chủ dự án, nêu rõ là
   test nào, hook nào hay bước CI nào, và chặn ở đâu. Đó là việc mã, nên làm trong một phiên
   `/sua-loi` hoặc `/lam-tinh-nang` riêng, chỉ làm khi được duyệt. Có máy canh rồi thì rút chữ
   trong cach-lam/bay còn một dòng trỏ tới nó.

Ghi vào dòng `Nâng:` của mục: đã nâng tới đâu, hoặc "chưa" kèm lý do.

## 5. Đưa lên main ngay

Đây là ngoại lệ thứ hai được commit thẳng `main` (AI-PHOI-HOP.md §2, chủ dự án duyệt 03/10/2026).
Ngoại lệ này chỉ áp cho `docs/bai-hoc/`. Sửa `docs/bay/` thì vẫn đi theo nhánh.

Làm trong một worktree tách riêng, để không đụng nhánh đang làm:

```bash
git fetch origin
git worktree add --detach "<scratchpad>/bai-hoc-main" origin/main
# sửa docs/bai-hoc/* TRONG worktree đó (công cụ Edit/Write, đường dẫn tuyệt đối)
git -C "<scratchpad>/bai-hoc-main" add docs/bai-hoc/
git -C "<scratchpad>/bai-hoc-main" commit -m "BAI-HOC: <tom tat khong dau>"
git -C "<scratchpad>/bai-hoc-main" push origin HEAD:main
git worktree remove "<scratchpad>/bai-hoc-main"
```

Push bị từ chối vì main vừa đổi thì `git -C … pull --rebase origin main` rồi đẩy lại. Rebase ở đây
an toàn vì commit này chưa ai tải về. Thông điệp commit viết không dấu và kết thúc bằng dòng
Co-Authored-By.

## 6. Báo lại

Báo một dòng: bài học gì, lần thứ mấy, đã nâng tới đâu. Nếu là lần 2 thì kèm đề xuất máy canh và
chờ chủ dự án quyết.
