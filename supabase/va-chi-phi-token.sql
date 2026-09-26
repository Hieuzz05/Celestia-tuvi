-- ============================================================
-- Sổ chi phí token: thêm phần ĐƯỢC ĐỆM và phần SUY NGHĨ (26/09/2026)
--
-- Vì sao: token vào được nhà cung cấp đệm tính ~1/10 giá, token suy nghĩ nội bộ tính như token ra.
-- Không có hai cột này thì không tính được tiền thật cho mỗi lá số — bảng cũ chỉ có tổng vào / ra.
--
-- CHỈ CỘNG THÊM: cột mới có mặc định 0, hàm cũ ghi_nhan_su_dung giữ nguyên. Chạy lại an toàn.
-- Mã (lib/ai/usage.ts) gọi hàm v2 trước, thiếu hàm thì lùi về hàm cũ — chạy tệp này lúc nào cũng được.
-- ============================================================

alter table public.ai_usage_logs
  add column if not exists tokens_dem bigint not null default 0,
  add column if not exists tokens_nghi bigint not null default 0;

create or replace function public.ghi_nhan_su_dung_v2(
  p_provider text,
  p_model text,
  p_tokens_vao bigint default 0,
  p_tokens_ra bigint default 0,
  p_loi boolean default false,
  p_tokens_dem bigint default 0,
  p_tokens_nghi bigint default 0
)
returns void
language sql
as $fn$
  insert into public.ai_usage_logs (ngay, provider, model, so_request, so_loi, tokens_vao, tokens_ra, tokens_dem, tokens_nghi)
  values (
    (now() at time zone 'utc')::date, p_provider, p_model,
    case when p_loi then 0 else 1 end,
    case when p_loi then 1 else 0 end,
    p_tokens_vao, p_tokens_ra, p_tokens_dem, p_tokens_nghi
  )
  on conflict (ngay, provider, model) do update set
    so_request = public.ai_usage_logs.so_request + excluded.so_request,
    so_loi = public.ai_usage_logs.so_loi + excluded.so_loi,
    tokens_vao = public.ai_usage_logs.tokens_vao + excluded.tokens_vao,
    tokens_ra = public.ai_usage_logs.tokens_ra + excluded.tokens_ra,
    tokens_dem = public.ai_usage_logs.tokens_dem + excluded.tokens_dem,
    tokens_nghi = public.ai_usage_logs.tokens_nghi + excluded.tokens_nghi,
    cap_nhat_luc = now();
$fn$;
