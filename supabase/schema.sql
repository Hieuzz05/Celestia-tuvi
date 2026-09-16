-- ============================================================
-- Tử Vi AI — cấu trúc database
-- Cách dùng: mở Supabase > SQL Editor > New query > dán toàn bộ file này > Run
-- Chạy lại nhiều lần được (dùng if not exists / drop policy if exists).
-- ============================================================

-- ---------- Hồ sơ tài khoản ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  ten_hien_thi text,
  tao_luc timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "doc ho so cua minh" on public.profiles;
create policy "doc ho so cua minh" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "sua ho so cua minh" on public.profiles;
create policy "sua ho so cua minh" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Tự tạo dòng profiles mỗi khi có người đăng ký mới
create or replace function public.tao_profile_moi()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, ten_hien_thi)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tao_profile_moi();

-- ---------- Lá số đã lưu ----------
create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ho_ten text not null default '',
  ngay int not null check (ngay between 1 and 31),
  thang int not null check (thang between 1 and 12),
  nam int not null check (nam between 1900 and 2100),
  gio int not null check (gio between 0 and 23),
  gioi_tinh text not null check (gioi_tinh in ('nam', 'nu')),
  ghi_chu text,
  tao_luc timestamptz not null default now()
);

create index if not exists charts_user_id_idx on public.charts (user_id, tao_luc desc);

alter table public.charts enable row level security;

drop policy if exists "chi thao tac la so cua minh" on public.charts;
create policy "chi thao tac la so cua minh" on public.charts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Bản luận giải AI đã tạo ----------
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  chart_id uuid references public.charts on delete set null,
  chu_de text not null,
  nam_xem int,
  thang_xem int,
  cau_hoi text,
  noi_dung text not null,
  model text,
  tao_luc timestamptz not null default now()
);

create index if not exists readings_user_id_idx on public.readings (user_id, tao_luc desc);

alter table public.readings enable row level security;

drop policy if exists "chi thao tac luan giai cua minh" on public.readings;
create policy "chi thao tac luan giai cua minh" on public.readings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Hội thoại hỏi đáp theo lá số ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  chart_id uuid references public.charts on delete cascade,
  -- Khoá nhóm hội thoại: cho phép hỏi đáp cả khi lá số chưa được lưu thành hồ sơ
  phien text not null,
  vai_tro text not null check (vai_tro in ('nguoi-dung', 'tro-ly')),
  noi_dung text not null,
  model text,
  tao_luc timestamptz not null default now()
);

create index if not exists chat_messages_phien_idx
  on public.chat_messages (user_id, phien, tao_luc);

alter table public.chat_messages enable row level security;

drop policy if exists "chi thao tac hoi thoai cua minh" on public.chat_messages;
create policy "chi thao tac hoi thoai cua minh" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
