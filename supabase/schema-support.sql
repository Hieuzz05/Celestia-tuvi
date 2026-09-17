-- ============================================================
-- Celestia — Support Celes ("Mời Celes một ly cà phê")
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ file này > Run
-- Chạy lại nhiều lần được.
--
-- Nguyên tắc của toàn bộ file: TRÌNH DUYỆT KHÔNG ĐƯỢC GHI TRẠNG THÁI TRẢ TIỀN.
-- Người dùng chỉ đọc được dữ liệu của chính mình; mọi thao tác cấp quyền đi qua
-- hàm security definer hoặc service role.
-- ============================================================

-- ---------- Đơn ủng hộ ----------
create table if not exists public.support_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,

  provider text not null default 'payos',
  order_code bigint not null unique,
  payment_link_id text unique,

  amount_vnd bigint not null check (amount_vnd > 0),
  currency text not null default 'VND',

  -- ask_quota | deep_map | journey_detail | connection_full | long_report
  -- | profile_limit | voluntary
  reason text not null,

  -- creating | pending | paid | cancelled | expired
  -- | create_failed | verification_failed | entitlement_granted
  status text not null,

  checkout_url text,
  qr_code text,

  -- Nơi đưa người dùng quay lại sau khi trả xong, kèm nguyên bối cảnh đang dở
  return_to jsonb,

  provider_reference text,
  provider_paid_at timestamptz,
  provider_payload jsonb,

  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_payments_user_created_idx
  on public.support_payments (user_id, created_at desc);
create index if not exists support_payments_status_idx
  on public.support_payments (status);

alter table public.support_payments enable row level security;

-- Chỉ ĐỌC. Không có policy insert/update cho người dùng: đơn được tạo và cập
-- nhật bằng service role ở phía máy chủ.
drop policy if exists "doc don ung ho cua minh" on public.support_payments;
create policy "doc don ung ho cua minh" on public.support_payments
  for select using (auth.uid() = user_id);

-- ---------- Sổ cấp quyền (chỉ ghi thêm, không sửa) ----------
create table if not exists public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  payment_id uuid not null references public.support_payments on delete cascade,

  grant_type text not null default 'supporter_24h',

  starts_at timestamptz not null,
  ends_at timestamptz not null,

  ask_quota_granted int not null default 30,
  long_report_quota_granted int not null default 1,

  created_at timestamptz not null default now(),

  -- Chính ràng buộc này làm webhook chạy lại nhiều lần vẫn an toàn
  unique (payment_id)
);

alter table public.entitlement_grants enable row level security;

drop policy if exists "doc quyen da cap cua minh" on public.entitlement_grants;
create policy "doc quyen da cap cua minh" on public.entitlement_grants
  for select using (auth.uid() = user_id);

-- ---------- Trạng thái quyền hiện tại ----------
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users on delete cascade,

  supporter_expires_at timestamptz,

  supporter_ask_balance int not null default 0,
  supporter_long_report_balance int not null default 0,

  lifetime_support_amount_vnd bigint not null default 0,
  support_count int not null default 0,

  -- Số câu miễn phí đã dùng trong ngày, kèm ngày (theo giờ Việt Nam) để reset
  free_ask_used int not null default 0,
  free_ask_date date,

  last_support_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

drop policy if exists "doc quyen cua minh" on public.user_entitlements;
create policy "doc quyen cua minh" on public.user_entitlements
  for select using (auth.uid() = user_id);

-- ---------- Nhật ký dùng ----------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,

  -- ask_celes | deep_map | journey_detail | connection | long_report
  feature text not null,
  -- reserved | success | failed | refunded
  status text not null,
  -- free_daily | supporter | admin_exempt
  quota_source text,

  model_provider text,
  model_name text,
  prompt_tokens int,
  completion_tokens int,
  estimated_cost_usd numeric,

  request_id text,
  metadata jsonb,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);
create unique index if not exists usage_events_request_idx
  on public.usage_events (request_id) where request_id is not null;

alter table public.usage_events enable row level security;

drop policy if exists "doc nhat ky cua minh" on public.usage_events;
create policy "doc nhat ky cua minh" on public.usage_events
  for select using (auth.uid() = user_id);

-- ============================================================
-- Hàm đặt chỗ quota — CHẠY NGUYÊN KHỐI
--
-- Mở nhiều tab rồi bấm gửi cùng lúc là cách dễ nhất để vượt hạn mức. Đặt chỗ ở
-- đây, trong một câu lệnh update có điều kiện, nên hai yêu cầu song song không
-- thể cùng lấy được một lượt.
-- ============================================================
create or replace function public.dat_cho_cau_hoi(
  p_user_id uuid,
  p_han_muc_mien_phi int,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := p_user_id;
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_row public.user_entitlements%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  insert into public.user_entitlements (user_id, free_ask_date)
  values (v_user, v_hom_nay)
  on conflict (user_id) do nothing;

  select * into v_row from public.user_entitlements
  where user_id = v_user for update;

  -- Sang ngày mới (giờ Việt Nam) thì bộ đếm miễn phí về 0
  if v_row.free_ask_date is distinct from v_hom_nay then
    update public.user_entitlements
      set free_ask_used = 0, free_ask_date = v_hom_nay, updated_at = now()
      where user_id = v_user
      returning * into v_row;
  end if;

  -- Ưu tiên quota đã trả tiền khi Supporter còn hiệu lực: giữ lại phần miễn phí
  -- cho lúc hết hạn trong cùng ngày.
  if v_row.supporter_expires_at is not null
     and v_row.supporter_expires_at > now()
     and v_row.supporter_ask_balance > 0 then
    update public.user_entitlements
      set supporter_ask_balance = supporter_ask_balance - 1, updated_at = now()
      where user_id = v_user
      returning * into v_row;

    insert into public.usage_events (user_id, feature, status, quota_source, request_id)
    values (v_user, 'ask_celes', 'reserved', 'supporter', p_request_id)
    on conflict do nothing;

    return jsonb_build_object(
      'allowed', true,
      'quotaSource', 'supporter',
      'freeUsed', v_row.free_ask_used,
      'freeLimit', p_han_muc_mien_phi,
      'supporterBalanceRemaining', v_row.supporter_ask_balance
    );
  end if;

  if v_row.free_ask_used >= p_han_muc_mien_phi then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exhausted',
      'freeUsed', v_row.free_ask_used,
      'freeLimit', p_han_muc_mien_phi,
      'supporterBalanceRemaining', v_row.supporter_ask_balance
    );
  end if;

  update public.user_entitlements
    set free_ask_used = free_ask_used + 1, updated_at = now()
    where user_id = v_user
    returning * into v_row;

  insert into public.usage_events (user_id, feature, status, quota_source, request_id)
  values (v_user, 'ask_celes', 'reserved', 'free_daily', p_request_id)
  on conflict do nothing;

  return jsonb_build_object(
    'allowed', true,
    'quotaSource', 'free_daily',
    'freeUsed', v_row.free_ask_used,
    'freeLimit', p_han_muc_mien_phi,
    'supporterBalanceRemaining', v_row.supporter_ask_balance
  );
end;
$$;

-- ============================================================
-- Hoàn lại lượt khi phía AI hỏng.
-- Người dùng không được mất một câu đã trả tiền vì lỗi hệ thống.
-- ============================================================
create or replace function public.hoan_cau_hoi(
  p_user_id uuid,
  p_nguon text,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := p_user_id;
  v_co boolean;
begin
  if v_user is null or p_request_id is null then return; end if;

  -- Chỉ hoàn đúng MỘT lần, và chỉ cho lượt thật sự đã đặt chỗ. Không có chốt
  -- này thì gọi lặp lại là tự nạp thêm lượt.
  select true into v_co from public.usage_events
  where user_id = v_user and request_id = p_request_id and status = 'reserved'
  limit 1;
  if v_co is not true then return; end if;

  if p_nguon = 'supporter' then
    update public.user_entitlements
      set supporter_ask_balance = supporter_ask_balance + 1, updated_at = now()
      where user_id = v_user;
  elsif p_nguon = 'free_daily' then
    update public.user_entitlements
      set free_ask_used = greatest(free_ask_used - 1, 0), updated_at = now()
      where user_id = v_user;
  end if;

  update public.usage_events
    set status = 'refunded', completed_at = now()
    where user_id = v_user and request_id = p_request_id;
end;
$$;

-- ============================================================
-- Cấp quyền sau khi webhook đã xác thực chữ ký.
--
-- Chỉ service role gọi được (revoke khỏi anon/authenticated bên dưới). Gọi lại
-- nhiều lần với cùng một đơn thì lần thứ hai trở đi không cộng thêm gì — đó là
-- điều kiện để webhook gửi trùng không nhân đôi quota.
-- ============================================================
create or replace function public.cap_quyen_ung_ho(
  p_payment_id uuid,
  p_gio_hieu_luc int,
  p_so_cau int,
  p_so_bao_cao int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.support_payments%rowtype;
  v_so_dong int := 0;
begin
  select * into v_pay from public.support_payments
  where id = p_payment_id for update;

  if v_pay.id is null then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_found');
  end if;

  insert into public.entitlement_grants (
    user_id, payment_id, starts_at, ends_at,
    ask_quota_granted, long_report_quota_granted
  )
  values (
    v_pay.user_id, v_pay.id, now(), now() + make_interval(hours => p_gio_hieu_luc),
    p_so_cau, p_so_bao_cao
  )
  on conflict (payment_id) do nothing;

  -- ROW_COUNT là bigint. Gán thẳng vào biến boolean là dựa vào phép ép kiểu
  -- qua chuỗi, chạy được với 0/1 rồi vỡ ngay khi giá trị khác.
  get diagnostics v_so_dong = row_count;

  if v_so_dong = 0 then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  insert into public.user_entitlements (user_id) values (v_pay.user_id)
  on conflict (user_id) do nothing;

  -- Cộng dồn chứ không ghi đè: người ủng hộ tiếp khi hạn cũ còn hiệu lực thì
  -- được cộng thêm giờ, không bị mất phần chưa dùng.
  update public.user_entitlements
    set supporter_expires_at =
          greatest(coalesce(supporter_expires_at, now()), now())
          + make_interval(hours => p_gio_hieu_luc),
        supporter_ask_balance = supporter_ask_balance + p_so_cau,
        supporter_long_report_balance = supporter_long_report_balance + p_so_bao_cao,
        lifetime_support_amount_vnd = lifetime_support_amount_vnd + v_pay.amount_vnd,
        support_count = support_count + 1,
        last_support_at = now(),
        updated_at = now()
    where user_id = v_pay.user_id;

  update public.support_payments
    set status = 'entitlement_granted', updated_at = now()
    where id = v_pay.id;

  return jsonb_build_object('ok', true, 'duplicate', false);
end;
$$;

-- ============================================================
-- Khoá quyền gọi ba hàm trên.
--
-- Postgres mặc định cấp EXECUTE cho PUBLIC, mà anon/authenticated đều thừa kế
-- từ đó — nên chỉ revoke khỏi hai vai đó là KHÔNG đủ, hàm vẫn gọi được bằng
-- anon key ngay từ trình duyệt. Phải revoke khỏi chính PUBLIC.
--
-- Vì sao phải khoá: `cap_quyen_ung_ho` cấp quyền cho một đơn bất kỳ, và
-- `hoan_cau_hoi` cộng lại lượt đã dùng. Để hở là ai cũng tự mở quyền hoặc tự
-- nạp thêm lượt mà không trả đồng nào.
--
-- Máy chủ Celestia gọi chúng bằng service role key nên không bị ảnh hưởng.
-- ============================================================
revoke execute on function public.dat_cho_cau_hoi(uuid, int, text) from public, anon, authenticated;
revoke execute on function public.hoan_cau_hoi(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.cap_quyen_ung_ho(uuid, int, int, int) from public, anon, authenticated;

-- Revoke khỏi PUBLIC cắt luôn service_role, vì vai đó cũng thừa kế từ PUBLIC.
-- Không cấp lại tường minh thì máy chủ Celestia hết gọi được, và hạn mức im
-- lặng tắt (mã phía server bắt lỗi rồi cho qua).
grant execute on function public.dat_cho_cau_hoi(uuid, int, text) to service_role;
grant execute on function public.hoan_cau_hoi(uuid, text, text) to service_role;
grant execute on function public.cap_quyen_ung_ho(uuid, int, int, int) to service_role;

-- Bản cũ của hai hàm quota không có tham số user_id. Nếu project đã chạy file
-- này trước đó thì bản cũ vẫn nằm lại và VẪN gọi được từ trình duyệt — bỏ hẳn.
drop function if exists public.dat_cho_cau_hoi(int, text);
drop function if exists public.hoan_cau_hoi(text, text);
