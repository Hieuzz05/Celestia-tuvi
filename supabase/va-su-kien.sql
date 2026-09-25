-- SỰ KIỆN PHỄU — thay cho dịch vụ analytics bên ngoài (CEL-082, 25/09/2026).
--
-- Ghi từ /api/su-kien (lib/analytics.ts gửi bằng sendBeacon). Không có dữ liệu
-- cá nhân: `khach` là mã ngẫu nhiên trong trình duyệt, thuộc tính chỉ là mã khối,
-- nguồn, ý định. Xem phễu ở trang quản trị (/api/admin/pheu).
-- Chạy một lần trên Supabase SQL editor.

create table if not exists su_kien (
  id bigint generated always as identity primary key,
  ten text not null,
  thuoc_tinh jsonb not null default '{}'::jsonb,
  khach text,
  trang text,
  luc timestamptz not null default now()
);

create index if not exists su_kien_luc_idx on su_kien (luc desc);
create index if not exists su_kien_ten_luc_idx on su_kien (ten, luc desc);

alter table su_kien enable row level security;
