-- ============================================================
-- Celestia — Cấu hình model AI sửa được trên giao diện
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
-- Chạy lại nhiều lần được.
--
-- Vì sao cần bảng này: trước đây thứ tự fallback và API key chỉ đọc từ biến môi
-- trường, nên thêm một model là phải sửa biến trên Vercel rồi chờ deploy lại.
-- Với một hệ thống mà nhà cung cấp free tier đổi tên model vài tháng một lần,
-- vòng đó quá chậm.
--
-- Bảng này ĐÈ LÊN biến môi trường khi có ít nhất một dòng. Không có dòng nào thì
-- hệ thống quay về đọc env như cũ — nên chạy file này chưa làm đổi gì cả.
-- ============================================================

create table if not exists public.ai_model_configs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (
    provider in ('gemini', 'groq', 'cerebras', 'openrouter', 'openai', 'anthropic')
  ),
  model text not null,
  -- Ciphertext dạng iv.tag.data (AES-256-GCM), khoá nằm ở CONFIG_SECRET trên
  -- deployment. Để trống nghĩa là dùng key từ biến môi trường của provider đó.
  api_key_ma text,
  uu_tien int not null default 0,
  bat boolean not null default true,
  ghi_chu text,
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now(),
  -- Cùng một provider có thể khai nhiều model, nhưng không khai trùng model
  unique (provider, model)
);

create index if not exists ai_model_configs_uu_tien_idx
  on public.ai_model_configs (uu_tien);

-- RLS bật, không policy nào: anon key không đọc được. Bảng này chứa credential
-- của các nhà cung cấp có tính tiền, nên mọi truy cập phải đi qua service role
-- sau khi đã kiểm quyền quản trị.
alter table public.ai_model_configs enable row level security;
