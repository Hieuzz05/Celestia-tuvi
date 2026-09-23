# Sổ ghi SQL đã chạy

Supabase không tự nhớ giúp file nào đã chạy. Không có sổ này thì người tiếp theo
chỉ có hai lựa chọn: chạy lại tất cả và hy vọng không hỏng, hoặc đoán.

**Luật:** chạy xong một file thì thêm một dòng vào bảng dưới, ngay trong cùng
commit với file SQL đó. Không ghi sổ thì coi như chưa chạy.

Kiểm nhanh thực tế bất cứ lúc nào:

```bash
npx tsx scripts/kiem-moi-truong.ts
```

Script đó dò từng bảng và từng hàm trên database thật rồi báo file nào còn thiếu.
Nó là nguồn đáng tin hơn bảng dưới, vì bảng dưới do người ghi tay.

---

## Dự án Supabase chính (production)

| File | Nội dung chính | Đã chạy |
|---|---|---|
| `schema.sql` | `profiles`, `charts`, `readings`, `chat_messages` | rồi |
| `schema-rag.sql` | Kho tri thức: `knowledge_documents`, `knowledge_document_versions`, `knowledge_chunks` | rồi |
| `schema-rag-v2.sql` | Từ điển thực thể, nhật ký truy hồi, `ai_requests`, `admin_audit_log`, bộ eval | rồi |
| `schema-rag-v3.sql` | Cho phép `embedding` rỗng, `tim_kien_thuc`, `tim_kien_thuc_vector`, `xoa_lien_ket_thuc_the` | rồi |
| `va-rag-tu-khoa.sql` | `tsquery_hoac`, `tim_kien_thuc_tu_khoa` — tìm theo từ khoá với ngữ nghĩa HOẶC | rồi |
| `va-rag-chat-luong.sql` | Chỉ mục vector ivfflat → hnsw (xoá CHỈ MỤC, không xoá dữ liệu); `tsquery_cum`, `tim_kien_thuc_tu_khoa_cum` — tìm nguyên cụm cho tên riêng. Hàm cũ giữ nguyên, mã mới tự lùi về hàm cũ khi tệp này chưa chạy | **chưa** |
| `schema-support.sql` | Quyền, thanh toán, hạn mức: `user_entitlements`, `support_payments`, `usage_events` | rồi |
| `schema-ai-models.sql` | `ai_model_configs` — chuỗi model quản lý được từ `/admin/models` | rồi |
| `schema-noi-dung-ai.sql` | `noi_dung_ai` — bộ nhớ đệm nội dung do AI sinh | rồi |

`chat_messages` nằm trong `schema.sql` từ đầu dự án nhưng mãi tới 19/09/2026 mới
có mã dùng tới (trí nhớ hội thoại, CEL-088). **Không cần chạy thêm SQL nào** —
bảng, chỉ mục và policy RLS đã có sẵn từ lần chạy `schema.sql` đầu tiên.

Trạng thái trên xác nhận bằng `scripts/kiem-moi-truong.ts` ngày 18/09/2026: đủ cả
23 bảng và 5 hàm.

---

## Luật viết file SQL mới

Hai máy dùng chung một database thì một câu lệnh phá là hỏng cho cả hai, và người
kia không biết vì sao. Nên:

1. **Chỉ viết câu lệnh cộng thêm.** `create table if not exists`, `add column if
   not exists`, `create index if not exists`. Không `drop table`, không `drop
   column`, không đổi kiểu cột đang có dữ liệu.
2. **Chạy lại phải an toàn.** File nào chạy hai lần mà hỏng là file viết sai.
3. **Một file một việc**, đặt tên theo việc chứ không theo số thứ tự: người đọc
   cần biết nó làm gì, không cần biết nó là file thứ mấy.
4. **Cột mới phải cho phép rỗng** hoặc có giá trị mặc định. Bản cũ đang chạy trên
   production không biết cột đó tồn tại.
5. **Ghi sổ ngay**, trong cùng commit.

---

## Kiểm RLS bằng tay — script không làm thay được

`scripts/test-hoi-thoai.ts` chạy bằng **service role**, mà service role đi vòng
qua RLS. Nên nó chứng minh được bảng hoạt động, **không** chứng minh được người
này không đọc được hội thoại của người kia.

Phần đó phải kiểm bằng hai tài khoản thật, mỗi lần đụng tới policy:

1. Đăng nhập tài khoản A, vào `/hoi-dap`, hỏi Celes một câu bất kỳ.
2. Đăng xuất, đăng nhập tài khoản B, mở **cùng một lá số** (cùng ngày giờ sinh,
   cùng giới tính — khoá hội thoại là bằm của lá số nên nó giống hệt nhau).
3. Khung chat của B phải **trống**. Thấy câu của A là policy hỏng.

Bước 2 cố ý dùng cùng lá số: đó là trường hợp duy nhất mà khoá `phien` trùng
nhau, nên nếu RLS hỏng thì nó hỏng đúng ở đây. Dùng hai lá số khác nhau thì
không kiểm được gì — chúng vốn đã tách nhau bằng khoá.
