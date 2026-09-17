-- ============================================================
-- Celestia — Kho tri thức v2 (RAG production)
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
-- Chạy sau schema.sql. Chạy lại nhiều lần được.
--
-- Vì sao có v2 thay vì sửa schema-rag.sql:
--   v1 coi "tài liệu" là một thứ bất biến — nạp lên là vào thẳng truy hồi. Thực
--   tế một nguồn tử vi được sửa nhiều lần, và câu trả lời tháng trước phải giải
--   thích được là đã dựa trên bản nào. Nên tài liệu tách làm hai tầng: bản ghi
--   nguồn (không đổi) và các PHIÊN BẢN của nó (đánh số, có trạng thái). Chỉ
--   phiên bản 'da_xuat_ban' mới được truy hồi.
-- ============================================================

create extension if not exists vector;
-- pg_trgm cho so khớp gần đúng tên sao viết sai dấu ("Thiên Riêu"/"Thiên Diêu")
create extension if not exists pg_trgm;

-- ============================================================
-- 1. NGUỒN TRI THỨC
-- ============================================================

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  ten_tep text,
  he_phai text not null default 'chung' check (he_phai in ('chung', 'nam-phai', 'bac-phai')),
  so_chunk int not null default 0,
  so_ky_tu int not null default 0,
  tao_luc timestamptz not null default now()
);

-- Các cột v2 thêm vào bảng đã có (an toàn khi bảng vừa tạo mới)
alter table public.knowledge_documents
  add column if not exists tac_gia text,
  add column if not exists loai_nguon text not null default 'sach',
  add column if not exists muc_tin_cay text not null default 'tham-khao',
  add column if not exists the_chu_de text[] not null default '{}',
  add column if not exists ghi_chu text,
  add column if not exists nguoi_tao uuid references auth.users on delete set null,
  add column if not exists luu_tru boolean not null default false,
  add column if not exists cap_nhat_luc timestamptz not null default now();

do $ct$ begin
  alter table public.knowledge_documents
    add constraint knowledge_documents_loai_nguon_check
    check (loai_nguon in ('sach', 'ghi-chu-chuyen-gia', 'quy-tac', 'bai-viet', 'noi-bo'));
exception when duplicate_object then null; end $ct$;

-- Thang tin cậy này quyết định thứ tự ưu tiên khi hai nguồn nói ngược nhau.
-- 'cot-loi' = quy tắc gốc không được phép mâu thuẫn; 'ho-tro' = chỉ làm dày ngữ cảnh.
do $ct$ begin
  alter table public.knowledge_documents
    add constraint knowledge_documents_muc_tin_cay_check
    check (muc_tin_cay in ('cot-loi', 'chuyen-gia-duyet', 'tham-khao', 'ho-tro'));
exception when duplicate_object then null; end $ct$;

-- ============================================================
-- 2. PHIÊN BẢN TÀI LIỆU
-- ============================================================

create table if not exists public.knowledge_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents on delete cascade,
  phien_ban text not null,
  -- Trạng thái quyết định tài liệu có được truy hồi hay không. Chỉ đúng một
  -- giá trị mở cổng: 'da_xuat_ban'. Mọi trạng thái khác đều là không.
  trang_thai text not null default 'nhap'
    check (trang_thai in ('nhap', 'dang_xu_ly', 'can_duyet', 'da_xuat_ban', 'that_bai', 'luu_tru')),
  buoc_loi text,
  loi text,
  checksum text,
  so_chunk int not null default 0,
  so_ky_tu int not null default 0,
  canh_bao text[] not null default '{}',
  model_embedding text,
  ngay_hieu_luc date,
  xuat_ban_luc timestamptz,
  nguoi_xuat_ban uuid references auth.users on delete set null,
  tao_luc timestamptz not null default now(),
  unique (document_id, phien_ban)
);

create index if not exists kdv_document_idx
  on public.knowledge_document_versions (document_id, tao_luc desc);

-- Mỗi nguồn chỉ được có MỘT phiên bản đang xuất bản. Ràng buộc ở tầng dữ liệu
-- chứ không ở tầng ứng dụng: hai bản cùng published là hai câu trả lời khác
-- nhau cho cùng một câu hỏi, và không ai phát hiện ra cho tới khi đã muộn.
create unique index if not exists kdv_mot_ban_xuat_ban
  on public.knowledge_document_versions (document_id)
  where trang_thai = 'da_xuat_ban';

-- ============================================================
-- 3. ĐOẠN VĂN BẢN
-- ============================================================

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents on delete cascade,
  thu_tu int not null,
  noi_dung text not null,
  embedding vector(768) not null,
  tao_luc timestamptz not null default now()
);

alter table public.knowledge_chunks
  add column if not exists version_id uuid references public.knowledge_document_versions on delete cascade,
  add column if not exists duong_de_muc text,
  -- Bản gốc dùng để trích nguồn; contextual prefix (P2) sẽ nằm ở cột riêng để
  -- chữ do AI sinh không bao giờ lẫn vào phần hiển thị cho người đọc.
  add column if not exists noi_dung_ngu_canh text,
  add column if not exists so_token int not null default 0,
  add column if not exists sieu_du_lieu jsonb not null default '{}'::jsonb,
  add column if not exists trang_thai text not null default 'hoat_dong',
  add column if not exists so_lan_duoc_chon int not null default 0;

do $ct$ begin
  alter table public.knowledge_chunks
    add constraint knowledge_chunks_trang_thai_check
    check (trang_thai in ('hoat_dong', 'loai_tru', 'canh_bao'));
exception when duplicate_object then null; end $ct$;

create index if not exists knowledge_chunks_document_idx
  on public.knowledge_chunks (document_id, thu_tu);
create index if not exists knowledge_chunks_version_idx
  on public.knowledge_chunks (version_id, thu_tu);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Chỉ mục toàn văn. Dùng cấu hình 'simple': Postgres không có bộ phân tích
-- tiếng Việt, mà tử vi cũng không cần lấy gốc từ — tên sao là danh từ riêng,
-- cắt gốc chỉ làm hỏng. 'simple' tách theo khoảng trắng, đúng thứ ta cần.
create index if not exists knowledge_chunks_fts_idx
  on public.knowledge_chunks using gin (to_tsvector('simple', noi_dung));
create index if not exists knowledge_chunks_trgm_idx
  on public.knowledge_chunks using gin (noi_dung gin_trgm_ops);

-- ============================================================
-- 4. TỪ ĐIỂN THỰC THỂ
-- ============================================================

-- Từ điển gốc nằm trong code (lib/rag/thuc-the.ts) vì engine tính toán cũng
-- dùng chính danh sách đó. Bảng này là bản đồng bộ để truy vấn SQL lọc được
-- theo thực thể và để Retrieval Lab tra cứu mà không phải nạp code.
create table if not exists public.knowledge_entities (
  id text primary key,
  loai text not null check (loai in ('STAR', 'PALACE', 'TRANSFORMATION', 'PERIOD', 'MARKER')),
  ten text not null,
  bi_danh text[] not null default '{}',
  cap_nhat_luc timestamptz not null default now()
);

create table if not exists public.chunk_entities (
  chunk_id uuid not null references public.knowledge_chunks on delete cascade,
  entity_id text not null references public.knowledge_entities on delete cascade,
  so_lan int not null default 1,
  primary key (chunk_id, entity_id)
);

create index if not exists chunk_entities_entity_idx on public.chunk_entities (entity_id);

-- ============================================================
-- 5. NHẬT KÝ TRUY HỒI (trace)
-- ============================================================

create table if not exists public.retrieval_runs (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  cau_hoi text not null,
  truy_van text not null,
  y_dinh text,
  thuc_the text[] not null default '{}',
  cung_lien_quan text[] not null default '{}',
  bo_loc jsonb not null default '{}'::jsonb,
  cau_hinh jsonb not null default '{}'::jsonb,
  phien_ban jsonb not null default '{}'::jsonb,
  do_tre_ms int,
  che_do text not null default 'that' check (che_do in ('that', 'thu_nghiem')),
  nguoi_chay uuid references auth.users on delete set null,
  tao_luc timestamptz not null default now()
);

create index if not exists retrieval_runs_tao_luc_idx on public.retrieval_runs (tao_luc desc);

create table if not exists public.retrieval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.retrieval_runs on delete cascade,
  chunk_id uuid references public.knowledge_chunks on delete set null,
  hang_vector int,
  diem_vector float,
  hang_tu_khoa int,
  diem_tu_khoa float,
  diem_rrf float,
  duoc_chon boolean not null default false,
  ly_do_loai text
);

create index if not exists retrieval_results_run_idx on public.retrieval_results (run_id);

-- ============================================================
-- 6. NHẬT KÝ TRẢ LỜI
-- ============================================================

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text unique,
  user_id uuid references auth.users on delete set null,
  -- Lá số ghi bằng mã băm, không ghi ngày giờ sinh: trace phục vụ gỡ lỗi, không
  -- phải là bản sao thứ hai của dữ liệu cá nhân.
  chart_hash text,
  tinh_nang text not null default 'hoi-dap',
  cau_hoi text,
  run_id uuid references public.retrieval_runs on delete set null,
  phien_ban jsonb not null default '{}'::jsonb,
  provider text,
  model text,
  tokens_vao int,
  tokens_ra int,
  do_tre_ms int,
  ket_qua_kiem_duyet jsonb,
  dat boolean,
  phan_hoi text check (phan_hoi in ('huu_ich', 'khong_dung')),
  ly_do_phan_hoi text,
  tao_luc timestamptz not null default now()
);

create index if not exists ai_requests_tao_luc_idx on public.ai_requests (tao_luc desc);
create index if not exists ai_requests_phan_hoi_idx on public.ai_requests (phan_hoi) where phan_hoi is not null;

-- ============================================================
-- 7. BỘ ĐÁNH GIÁ (golden set)
-- ============================================================

create table if not exists public.eval_datasets (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  mo_ta text,
  tao_luc timestamptz not null default now()
);

create table if not exists public.eval_cases (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.eval_datasets on delete cascade,
  cau_hoi text not null,
  y_dinh_mong_doi text,
  thuc_the_bat_buoc text[] not null default '{}',
  cung_mong_doi text[] not null default '{}',
  chunk_mong_doi uuid[] not null default '{}',
  nguon_cam text[] not null default '{}',
  cau_tra_loi_mau text,
  the text[] not null default '{}',
  tao_luc timestamptz not null default now()
);

create index if not exists eval_cases_dataset_idx on public.eval_cases (dataset_id);

create table if not exists public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.eval_datasets on delete cascade,
  ten text not null,
  cau_hinh jsonb not null default '{}'::jsonb,
  phien_ban jsonb not null default '{}'::jsonb,
  so_case int not null default 0,
  so_dat int not null default 0,
  recall float,
  ty_le_thuc_the float,
  ty_le_sai_he_phai float,
  ket_qua jsonb,
  tao_luc timestamptz not null default now()
);

create index if not exists eval_runs_dataset_idx on public.eval_runs (dataset_id, tao_luc desc);

-- ============================================================
-- 8. NHẬT KÝ THAO TÁC QUẢN TRỊ
-- ============================================================

-- Xuất bản/lưu trữ/xoá đều đổi thứ mà người dùng cuối nhận được, nên phải biết
-- ai làm và lúc nào.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users on delete set null,
  actor_email text,
  hanh_dong text not null,
  doi_tuong text,
  doi_tuong_id text,
  chi_tiet jsonb not null default '{}'::jsonb,
  tao_luc timestamptz not null default now()
);

create index if not exists admin_audit_log_tao_luc_idx on public.admin_audit_log (tao_luc desc);

-- ============================================================
-- 9. BẢO MẬT
-- ============================================================

-- Bật RLS, không tạo policy nào: anon key không đọc/ghi được gì. Mọi truy cập
-- đi qua service role ở phía máy chủ, sau khi đã kiểm quyền admin.
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_document_versions enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_entities enable row level security;
alter table public.chunk_entities enable row level security;
alter table public.retrieval_runs enable row level security;
alter table public.retrieval_results enable row level security;
alter table public.ai_requests enable row level security;
alter table public.eval_datasets enable row level security;
alter table public.eval_cases enable row level security;
alter table public.eval_runs enable row level security;
alter table public.admin_audit_log enable row level security;

-- ============================================================
-- 10. HÀM TRUY HỒI
-- ============================================================

-- Bản v1 còn được ba màn luận giải cũ (lá số, luận giải, hợp tuổi) gọi. Giữ lại
-- nguyên chữ ký, nhưng thêm điều kiện "chỉ phiên bản đã xuất bản" — nếu không nó
-- thành cửa sau: tài liệu chưa duyệt vẫn đi vào bài qua đường cũ.
create or replace function public.tim_kien_thuc(
  vector_truy_van vector(768),
  so_luong int default 6,
  nguong_toi_thieu float default 0.6,
  loc_he_phai text default null
)
returns table (
  id uuid,
  noi_dung text,
  tieu_de text,
  he_phai text,
  diem_tuong_dong float
)
language sql
stable
as $fn$
  select
    c.id, c.noi_dung, d.tieu_de, d.he_phai,
    1 - (c.embedding <=> vector_truy_van) as diem_tuong_dong
  from public.knowledge_chunks c
  join public.knowledge_document_versions v on v.id = c.version_id
  join public.knowledge_documents d on d.id = c.document_id
  where v.trang_thai = 'da_xuat_ban'
    and c.trang_thai <> 'loai_tru'
    and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
    and 1 - (c.embedding <=> vector_truy_van) >= nguong_toi_thieu
  order by c.embedding <=> vector_truy_van
  limit so_luong;
$fn$;

-- Tìm theo vector, chỉ trong các phiên bản đang xuất bản.
-- KHÔNG có ngưỡng mặc định cứng: ngưỡng là tham số được chỉnh bằng eval, không
-- phải hằng số ai đó chọn một lần rồi quên.
create or replace function public.tim_kien_thuc_vector(
  vector_truy_van vector(768),
  so_luong int default 15,
  nguong_toi_thieu float default 0,
  loc_he_phai text default null,
  loc_thuc_the text[] default null
)
returns table (
  chunk_id uuid,
  version_id uuid,
  document_id uuid,
  noi_dung text,
  duong_de_muc text,
  tieu_de text,
  he_phai text,
  muc_tin_cay text,
  phien_ban text,
  diem float
)
language sql
stable
as $fn$
  select
    c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
    d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
    1 - (c.embedding <=> vector_truy_van) as diem
  from public.knowledge_chunks c
  join public.knowledge_document_versions v on v.id = c.version_id
  join public.knowledge_documents d on d.id = c.document_id
  where v.trang_thai = 'da_xuat_ban'
    and c.trang_thai <> 'loai_tru'
    and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
    and (
      loc_thuc_the is null
      or exists (
        select 1 from public.chunk_entities ce
        where ce.chunk_id = c.id and ce.entity_id = any(loc_thuc_the)
      )
    )
    and 1 - (c.embedding <=> vector_truy_van) >= nguong_toi_thieu
  order by c.embedding <=> vector_truy_van
  limit so_luong;
$fn$;

-- Biến một chuỗi thành tsquery nối bằng OR. Trả về null khi chuỗi rỗng hoặc chỉ
-- gồm ký tự bị bộ tách bỏ đi — để hàm gọi biết mà không so khớp với query rỗng.
create or replace function public.tsquery_hoac(cau text)
returns tsquery
language sql
immutable
as $fn$
  select nullif(replace(plainto_tsquery('simple', coalesce(cau, ''))::text, '&', '|'), '')::tsquery;
$fn$;

-- Tìm theo từ khoá. Cần cho tên sao hiếm: vector coi "Thiên Riêu" và
-- "Thiên Diêu" gần như nhau, còn ở đây chúng là hai từ khác nhau.
--
-- Dùng OR chứ không AND. `plainto_tsquery` nối mọi từ bằng `&`, nên một truy vấn
-- mười chữ đòi đoạn phải chứa đủ cả mười — thực tế là không đoạn nào khớp, và
-- nhánh từ khoá im lặng trả về rỗng mãi mãi. Đổi `&` thành `|` cho đoạn nào
-- chạm được từ nào cũng vào danh sách, rồi để ts_rank xếp hạng theo số từ trúng.
create or replace function public.tim_kien_thuc_tu_khoa(
  cau_truy_van text,
  so_luong int default 15,
  loc_he_phai text default null,
  loc_thuc_the text[] default null
)
returns table (
  chunk_id uuid,
  version_id uuid,
  document_id uuid,
  noi_dung text,
  duong_de_muc text,
  tieu_de text,
  he_phai text,
  muc_tin_cay text,
  phien_ban text,
  diem float
)
language sql
stable
as $fn$
  select
    c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
    d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
    ts_rank(to_tsvector('simple', c.noi_dung), public.tsquery_hoac(cau_truy_van))::float as diem
  from public.knowledge_chunks c
  join public.knowledge_document_versions v on v.id = c.version_id
  join public.knowledge_documents d on d.id = c.document_id
  where v.trang_thai = 'da_xuat_ban'
    and c.trang_thai <> 'loai_tru'
    and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
    and (
      loc_thuc_the is null
      or exists (
        select 1 from public.chunk_entities ce
        where ce.chunk_id = c.id and ce.entity_id = any(loc_thuc_the)
      )
    )
    and public.tsquery_hoac(cau_truy_van) is not null
    and to_tsvector('simple', c.noi_dung) @@ public.tsquery_hoac(cau_truy_van)
  order by diem desc
  limit so_luong;
$fn$;

-- ============================================================
-- 11. XUẤT BẢN PHIÊN BẢN
-- ============================================================

-- Gói trong một hàm để việc "hạ bản cũ, nâng bản mới" là một giao dịch. Làm
-- bằng hai lệnh update rời có lúc để nguồn không còn bản nào xuất bản.
create or replace function public.xuat_ban_phien_ban(p_version_id uuid, p_actor uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_doc uuid;
begin
  select document_id into v_doc
  from public.knowledge_document_versions where id = p_version_id;

  if v_doc is null then
    raise exception 'Không tìm thấy phiên bản %', p_version_id;
  end if;

  update public.knowledge_document_versions
  set trang_thai = 'luu_tru'
  where document_id = v_doc and trang_thai = 'da_xuat_ban' and id <> p_version_id;

  update public.knowledge_document_versions
  set trang_thai = 'da_xuat_ban',
      xuat_ban_luc = now(),
      nguoi_xuat_ban = p_actor
  where id = p_version_id;

  update public.knowledge_documents set cap_nhat_luc = now() where id = v_doc;
end;
$fn$;

revoke execute on function public.xuat_ban_phien_ban(uuid, uuid) from public, anon, authenticated;
grant execute on function public.xuat_ban_phien_ban(uuid, uuid) to service_role;

-- ============================================================
-- 12. NHẬT KÝ DÙNG MODEL (giữ nguyên từ v1)
-- ============================================================

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  ngay date not null default (now() at time zone 'utc')::date,
  provider text not null,
  model text not null,
  so_request int not null default 0,
  so_loi int not null default 0,
  tokens_vao bigint not null default 0,
  tokens_ra bigint not null default 0,
  cap_nhat_luc timestamptz not null default now(),
  unique (ngay, provider, model)
);

alter table public.ai_usage_logs enable row level security;

create or replace function public.ghi_nhan_su_dung(
  p_provider text,
  p_model text,
  p_tokens_vao bigint default 0,
  p_tokens_ra bigint default 0,
  p_loi boolean default false
)
returns void
language sql
as $fn$
  insert into public.ai_usage_logs (ngay, provider, model, so_request, so_loi, tokens_vao, tokens_ra)
  values (
    (now() at time zone 'utc')::date, p_provider, p_model,
    case when p_loi then 0 else 1 end,
    case when p_loi then 1 else 0 end,
    p_tokens_vao, p_tokens_ra
  )
  on conflict (ngay, provider, model) do update set
    so_request = public.ai_usage_logs.so_request + excluded.so_request,
    so_loi = public.ai_usage_logs.so_loi + excluded.so_loi,
    tokens_vao = public.ai_usage_logs.tokens_vao + excluded.tokens_vao,
    tokens_ra = public.ai_usage_logs.tokens_ra + excluded.tokens_ra,
    cap_nhat_luc = now();
$fn$;
