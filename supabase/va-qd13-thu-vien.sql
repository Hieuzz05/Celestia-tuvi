-- ============================================================
-- QĐ-13 — thư viện tri thức ra bảng riêng, CÓ PHIÊN BẢN (05/10/2026)
-- ============================================================
--
-- Vì sao: thư viện đang nằm trong `noi_dung_ai` (bề mặt 'thu-vien'), mỗi mục một dòng, upsert
-- GHI ĐÈ (lib/rag/thu-vien/kho.ts) — sửa một mục là mất bản cũ, không trả lời được "câu trả lời
-- tuần trước dựa trên phiên bản nào của mục này". Nghiệm lý của chủ dự án (truongPhai 'celes')
-- cần người duyệt + thời điểm duyệt trên TỪNG phiên bản trước khi được vào chat Focused.
--
-- Hai bảng (trần của batch: ≤ 2 bảng mới):
--   muc_thu_vien            — danh tính mục + trạng thái + con trỏ phiên bản đang dùng
--   muc_thu_vien_phien_ban  — nội dung BẤT BIẾN của từng phiên bản (sửa = thêm phiên bản mới)
--
-- Duyệt nằm trên PHIÊN BẢN, không trên mục: duyệt v2 không ngầm duyệt v3.
-- Mục được dùng ở chat Focused khi và chỉ khi (lọc ở mã, cờ CELES_OWNER_KNOWLEDGE_FOCUSED):
--   muc.truong_phai = 'celes' AND muc.trang_thai = 'dang-dung'
--   AND phiên bản trỏ tới có duyet = 'da-duyet', approved_by, approved_at không null.
--
-- Luận v3 Production KHÔNG đổi: kho.ts vẫn đọc noi_dung_ai. Chuyển v3 sang bảng mới là việc sau,
-- có cờ riêng (chạm khoá đệm khoaGoi).
--
-- Chỉ cộng thêm, chạy hai lần vẫn an toàn. RLS bật, KHÔNG policy: chỉ service role (API admin,
-- máy chủ) đọc/ghi; trình duyệt người dùng không thấy.
--
-- TRẠNG THÁI: CHƯA CHẠY (MIGRATION_NOT_APPLIED). Chủ dự án chạy tay trên Supabase SQL Editor.
-- Mã chịu được bảng chưa có: đọc lỗi → coi như 0 mục, admin báo "chưa chạy va-qd13-thu-vien.sql".

create table if not exists public.muc_thu_vien (
  id text primary key,
  truong_phai text not null default 'celes'
    check (truong_phai in ('chung', 'nam-phai', 'bac-phai', 'celes')),
  trang_thai text not null default 'nhap'
    check (trang_thai in ('nhap', 'dang-dung', 'luu-tru')),
  -- Phiên bản đang dùng (null khi chưa có bản nào được chọn)
  phien_ban_dang_dung integer,
  tao_boi text,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);

create table if not exists public.muc_thu_vien_phien_ban (
  muc_id text not null references public.muc_thu_vien (id) on delete restrict,
  phien_ban integer not null check (phien_ban >= 1),
  -- Ảnh chụp MucThuVien (lib/rag/thu-vien/kieu.ts): chuDe, dieuKien, y, nhan, cheDo, dich, canCu
  noi_dung jsonb not null,
  schema_version integer not null default 1,
  duyet text not null default 'chua'
    check (duyet in ('chua', 'da-duyet', 'bi-bac', 'tranh-chap')),
  approved_by text,
  approved_at timestamptz,
  tao_boi text,
  tao_luc timestamptz not null default now(),
  primary key (muc_id, phien_ban),
  -- Đã duyệt thì phải có người duyệt và thời điểm
  constraint muc_tv_pb_duyet_du check (duyet <> 'da-duyet' or (approved_by is not null and approved_at is not null))
);

create index if not exists muc_thu_vien_loc_idx
  on public.muc_thu_vien (truong_phai, trang_thai);
create index if not exists muc_thu_vien_pb_duyet_idx
  on public.muc_thu_vien_phien_ban (duyet);

-- Nội dung một phiên bản là bất biến: chỉ được đổi các cột duyệt.
create or replace function public.muc_tv_pb_bat_bien() returns trigger
language plpgsql as $$
begin
  if new.noi_dung is distinct from old.noi_dung
     or new.schema_version is distinct from old.schema_version
     or new.muc_id is distinct from old.muc_id
     or new.phien_ban is distinct from old.phien_ban then
    raise exception 'muc_thu_vien_phien_ban: noi dung phien ban la bat bien — them phien ban moi';
  end if;
  return new;
end $$;

drop trigger if exists muc_tv_pb_bat_bien on public.muc_thu_vien_phien_ban;
create trigger muc_tv_pb_bat_bien
  before update on public.muc_thu_vien_phien_ban
  for each row execute function public.muc_tv_pb_bat_bien();

alter table public.muc_thu_vien enable row level security;
alter table public.muc_thu_vien_phien_ban enable row level security;

comment on table public.muc_thu_vien is
  'QĐ-13: danh tính mục thư viện + trạng thái (nhap/dang-dung/luu-tru) + phiên bản đang dùng.';
comment on table public.muc_thu_vien_phien_ban is
  'QĐ-13: nội dung bất biến từng phiên bản; duyệt (approved_by/approved_at) theo phiên bản.';
