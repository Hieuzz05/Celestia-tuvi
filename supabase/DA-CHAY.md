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
| `va-boi-canh-la-so.sql` | Thêm cột `charts.boi_canh jsonb` (nullable) — hoàn cảnh người đọc cho luận giải chuyên sâu, đi theo tài khoản. Chưa chạy thì bối cảnh chỉ nằm ở trình duyệt, mã tự bỏ qua lỗi | rồi (01/10/2026) |
| `va-rag-chat-luong.sql` | Chỉ mục vector ivfflat → hnsw (xoá CHỈ MỤC, không xoá dữ liệu); `tsquery_cum`, `tim_kien_thuc_tu_khoa_cum` — tìm nguyên cụm cho tên riêng. Hàm cũ giữ nguyên, mã mới tự lùi về hàm cũ khi tệp này chưa chạy. Thân `tim_kien_thuc_tu_khoa_cum` trong tệp này đã bị thay bởi `va-rag-tu-khoa-hai-tang.sql` | rồi (dò DB 11/11/2026: có chỉ mục hnsw, `tsquery_cum`; 15/11 đối chiếu thân hàm trên DB khớp tệp này, trước khi thay) |
| `schema-support.sql` | Quyền, thanh toán, hạn mức: `user_entitlements`, `support_payments`, `usage_events` | rồi |
| `schema-ai-models.sql` | `ai_model_configs` — chuỗi model quản lý được từ `/admin/models` | rồi |
| `schema-noi-dung-ai.sql` | `noi_dung_ai` — bộ nhớ đệm nội dung do AI sinh | rồi |
| `va-danh-gia-bai.sql` | `danh_gia_bai_luan` — quản trị viên chấm bài luận (Hay/Chưa hay, 1–5, nhận xét, gợi ý cách viết). Chưa chạy thì nút Lưu ở thẻ chấm báo lỗi, trang người dùng không ảnh hưởng | rồi (dò DB 11/11/2026) |
| `va-priv-01.sql` | PRIV-01: nới NOT NULL `retrieval_runs.cau_hoi/truy_van` + chú thích cột — trace Production không giữ văn người dùng. Mã không phụ thuộc tệp này (ghi chuỗi canh `[an]` khi cột còn NOT NULL) | rồi (dò DB 11/11/2026: hai cột đã cho phép rỗng) |
| `va-priv-01-don.sql` | Làm trắng văn trace CŨ. **DỪNG**: dữ liệu cũ không phân biệt Production / Preview / eval — chờ chủ dự án chọn (A) hay (B) trong tệp | **không chạy** |
| `va-qd13-thu-vien.sql` | QĐ-13: `muc_thu_vien` + `muc_thu_vien_phien_ban` (nội dung bất biến, duyệt theo phiên bản, RLS chỉ service role). Chưa chạy thì trang "Nghiệm lý của tôi" báo chưa chạy, chat Focused coi như 0 nghiệm lý; luận v3 không đổi (vẫn đọc `noi_dung_ai`) | rồi (dò DB 11/11/2026) |
| `va-chi-phi-token.sql` | Thêm cột `ai_usage_logs.tokens_dem`, `tokens_nghi`; hàm `ghi_nhan_su_dung_v2` — đếm token theo ngày | rồi (dò DB 11/11/2026) |
| `va-rag-toc-do.sql` | Cột `knowledge_chunks.tsv` + chỉ mục `knowledge_chunks_tsv_idx`; viết lại `tim_kien_thuc_tu_khoa_cum` dùng cột đó | rồi (dò DB 11/11/2026). Cột + chỉ mục còn dùng; HÀM đã bị `va-rag-chat-luong.sql` ghi đè (dò 15/11), nay thay bằng `va-rag-tu-khoa-hai-tang.sql` |
| `va-su-co-ai.sql` | Bảng `su_co_ai` (sự cố tầng model, cột thời gian `luc`), RLS bật. Dọn sau 90 ngày bằng cron `don-nhat-ky` | rồi (dò DB 11/11/2026) |
| `va-su-kien.sql` | Bảng `su_kien` (phễu sự kiện, cột thời gian `luc`), RLS bật. Dọn sau 90 ngày bằng cron `don-nhat-ky` | rồi (dò DB 11/11/2026) |
| `va-thu-hoi-muc.sql` | Bảng `thu_hoi_muc_thu_vien` + chỉ mục `thu_hoi_muc_hieu_luc` (cổng thu hồi, CELES-27), RLS bật | rồi (dò DB 11/11/2026) |
| `va-rag-tu-khoa-hai-tang.sql` | Thân mới cho `tim_kien_thuc_tu_khoa_cum`: hai tầng, dùng cột `tsv`, không tính lại tsvector (CELES-78). Chữ ký giữ nguyên. Cần chạy SAU `va-rag-tu-khoa.sql`, `va-rag-chat-luong.sql`, `va-rag-toc-do.sql`. Hoàn tác: `va-rag-tu-khoa-hai-tang-HOAN-TAC.sql` | rồi (15/11/2026, AI chạy qua công cụ Supabase theo luật mới; đo 16/16 câu khớp hàm cũ: `scripts/do-tu-khoa-hai-tang.ts`) |

Ngày 11/11/2026 (rà soát A1) đã dò lại bằng câu SELECT chỉ đọc trên danh mục hệ thống: mọi đối tượng
của các tệp ghi "rồi" ở trên đều có trên DB thật. Bốn dòng trước đó ghi "chưa" là sổ lạc hậu, không
phải DB thiếu.

### Bảng nghi không dùng (rà soát T2, 11/11/2026) — GHI CHÚ, KHÔNG XOÁ

| Bảng | Số dòng (11/11) | Mã chạm tới |
|---|---|---|
| `readings` (`schema.sql`) | 0 | Chỉ `app/api/admin/nguoi-dung/route.ts` đọc để đếm bài luận theo người, nên cột đó luôn ra 0. Không chỗ nào ghi: bài luận nằm ở `noi_dung_ai` |
| `eval_datasets`, `eval_cases`, `eval_runs` (`schema-rag-v2.sql`) | 0 | Chỉ `scripts/kiem-moi-truong.ts` dò sự có mặt. Bộ đo hiện chạy bằng tệp trong `scripts/`, không ghi DB |

Xoá bảng là việc không đảo ngược được, cần chủ dự án quyết riêng. Trước khi xoá `readings` phải
sửa trang quản trị bỏ cột đếm đó.

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
