-- CHẤM BÀI LUẬN — quản trị viên chấm từng câu luận giải: Hay / Chưa hay, điểm 1–5,
-- nhận xét, gợi ý cách viết. Gom một chỗ để định kỳ (hoặc khi chủ dự án bảo) đọc lại,
-- tìm luật viết cần sửa. Ghi/đọc từ app/api/admin/danh-gia-bai (01/10/2026).
--
-- Bản chụp bài (luan_giai, vi_sao, goi_y) là CHỮ ADMIN ĐANG THẤY lúc chấm; khop_dem cho
-- biết nó có trùng bài đang nằm trong đệm không (lùi bản cũ / thế hệ trước thì có thể lệch).
-- Chạy một lần trên Supabase SQL editor. Chạy lại an toàn.

create table if not exists danh_gia_bai_luan (
  id uuid primary key default gen_random_uuid(),
  chart_hash text not null,
  khoa_ky text not null,
  nhom text not null,
  id_cau text not null,
  cau_hoi text,
  luan_giai text,
  vi_sao text,
  goi_y text,
  phien_ban_prompt text,          -- lấy từ chính câu trong đệm; rỗng = bài viết trước 01/10/2026
  model text,
  khop_dem boolean,
  danh_gia text check (danh_gia in ('hay', 'chua-hay')),
  diem smallint check (diem between 1 and 5),
  binh_luan text,
  goi_y_viet text,
  nguoi_cham text not null,       -- id tài khoản quản trị ('cuc-bo' khi chạy máy không có đăng nhập)
  email_cham text,                -- KHÔNG đưa vào bản xuất tổng hợp
  tao_luc timestamptz not null default now(),
  sua_luc timestamptz not null default now(),
  unique (nguoi_cham, chart_hash, khoa_ky, id_cau)
);

create index if not exists danh_gia_bai_luan_sua_idx on danh_gia_bai_luan (sua_luc desc);
create index if not exists danh_gia_bai_luan_cau_idx on danh_gia_bai_luan (id_cau);

-- Chỉ service_role ở máy chủ đọc/ghi
alter table danh_gia_bai_luan enable row level security;
