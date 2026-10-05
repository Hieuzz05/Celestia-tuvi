-- ============================================================
-- PRIV-01 — trace Production không giữ văn người dùng (05/10/2026)
-- ============================================================
--
-- Mã từ commit PRIV-01 trở đi KHÔNG ghi văn thô vào trace khi che_do = 'that':
--   retrieval_runs.cau_hoi / truy_van  → chuỗi canh '[an]' (cột còn NOT NULL nên chưa ghi null được)
--   ai_requests.cau_hoi                → không truyền (null)
--   ai_requests.chart_hash             → null (băm không muối của ngày giờ sinh dò ngược được)
--   ai_requests.ket_qua_kiem_duyet     → chỉ mã / số / phiên bản
--
-- Tệp này CHỈ nới ràng buộc để bản sau ghi được null thay cho chuỗi canh. Chỉ cộng thêm,
-- chạy hai lần vẫn an toàn, bản đang chạy trên Production không bị ảnh hưởng (nó vẫn ghi chuỗi).
-- KHÔNG xoá, KHÔNG sửa dòng cũ — dọn dữ liệu cũ nằm ở `va-priv-01-don.sql` và đang DỪNG.
--
-- TRẠNG THÁI: CHƯA CHẠY (MIGRATION_NOT_APPLIED). Chủ dự án chạy tay trên Supabase SQL Editor.

alter table public.retrieval_runs alter column cau_hoi drop not null;
alter table public.retrieval_runs alter column truy_van drop not null;

comment on column public.retrieval_runs.cau_hoi is
  'PRIV-01: che_do=that không giữ câu hỏi thô (null hoặc ''[an]''). Chỉ thu_nghiem (admin thử truy hồi) giữ văn.';
comment on column public.retrieval_runs.truy_van is
  'PRIV-01: che_do=that không giữ truy vấn (chứa câu người dùng). Chỉ thu_nghiem giữ văn.';
comment on column public.ai_requests.cau_hoi is
  'PRIV-01: Production không ghi. Cột giữ cho dữ liệu cũ, chờ dọn (va-priv-01-don.sql).';
comment on column public.ai_requests.chart_hash is
  'PRIV-01: Production ghi null — sha256 không muối của ngày giờ sinh dò ngược được bằng vét cạn.';
