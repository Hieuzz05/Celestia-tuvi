-- ============================================================
-- Celestia — Kho tri thức (RAG)
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
-- Chạy sau schema.sql. Chạy lại nhiều lần được.
-- ============================================================

-- pgvector cho phép lưu và so khớp vector ngữ nghĩa ngay trong Postgres,
-- khỏi phải dựng thêm dịch vụ vector database riêng.
create extension if not exists vector;

-- ---------- Tài liệu gốc ----------
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  ten_tep text,
  he_phai text not null default 'chung' check (he_phai in ('chung', 'nam-phai', 'bac-phai')),
  so_chunk int not null default 0,
  so_ky_tu int not null default 0,
  tao_luc timestamptz not null default now()
);

-- ---------- Đoạn văn bản đã cắt + vector ----------
-- 768 chiều khớp với gemini-embedding-001 (outputDimensionality = 768)
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents on delete cascade,
  thu_tu int not null,
  noi_dung text not null,
  embedding vector(768) not null,
  tao_luc timestamptz not null default now()
);

create index if not exists knowledge_chunks_document_idx
  on public.knowledge_chunks (document_id, thu_tu);

-- Index xấp xỉ cho tìm kiếm cosine. lists = 100 hợp với kho vài nghìn đoạn;
-- kho lớn hơn thì tăng lên theo công thức sqrt(số dòng).
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------- Bảo mật ----------
-- Bật RLS nhưng KHÔNG tạo policy nào: mọi truy cập bằng anon key đều bị chặn.
-- Chỉ service role (chạy phía server, bỏ qua RLS) mới đọc/ghi được — đúng với
-- việc quản trị viên nạp tài liệu và server truy hồi khi luận giải.
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

-- ---------- Hàm truy hồi ----------
-- Trả về các đoạn gần nghĩa nhất với câu truy vấn, kèm điểm tương đồng 0..1.
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
as $$
  select
    c.id,
    c.noi_dung,
    d.tieu_de,
    d.he_phai,
    1 - (c.embedding <=> vector_truy_van) as diem_tuong_dong
  from public.knowledge_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  where
    (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
    and 1 - (c.embedding <=> vector_truy_van) >= nguong_toi_thieu
  order by c.embedding <=> vector_truy_van
  limit so_luong;
$$;

-- ============================================================
-- Nhật ký dùng model AI (Phase 4)
-- Gộp vào file này để chỉ phải chạy một lần trong SQL Editor.
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
  -- Mỗi ngày mỗi model một dòng, cộng dồn thay vì ghi từng lượt gọi:
  -- kho log nhỏ gọn và truy vấn hạn mức còn lại chỉ tốn một lần đọc.
  unique (ngay, provider, model)
);

alter table public.ai_usage_logs enable row level security;

-- Cộng dồn một lượt gọi. Dùng upsert nên không cần kiểm tra tồn tại trước.
create or replace function public.ghi_nhan_su_dung(
  p_provider text,
  p_model text,
  p_tokens_vao bigint default 0,
  p_tokens_ra bigint default 0,
  p_loi boolean default false
)
returns void
language sql
as $$
  insert into public.ai_usage_logs (ngay, provider, model, so_request, so_loi, tokens_vao, tokens_ra)
  values (
    (now() at time zone 'utc')::date,
    p_provider,
    p_model,
    case when p_loi then 0 else 1 end,
    case when p_loi then 1 else 0 end,
    p_tokens_vao,
    p_tokens_ra
  )
  on conflict (ngay, provider, model) do update set
    so_request = public.ai_usage_logs.so_request + excluded.so_request,
    so_loi = public.ai_usage_logs.so_loi + excluded.so_loi,
    tokens_vao = public.ai_usage_logs.tokens_vao + excluded.tokens_vao,
    tokens_ra = public.ai_usage_logs.tokens_ra + excluded.tokens_ra,
    cap_nhat_luc = now();
$$;
