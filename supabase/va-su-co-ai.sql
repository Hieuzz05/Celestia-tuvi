-- SỰ CỐ AI — mỗi dòng là một lần chuỗi model hỏng, KÈM LÝ DO.
--
-- Vì sao cần: 24/09/2026 OpenAI hết credit, model viết và embedding cùng hỏng mà
-- không ai được báo. ai_usage_logs chỉ đếm số lỗi theo ngày, không phân biệt
-- "hết credit" (phải nạp tiền) với "gọi hơi nhanh" (tự hết).
--
-- Ghi từ lib/ai/su-co.ts (đã giãn cách: sự cố nặng 1 giờ/lần, nhẹ 10 phút/lần
-- cho mỗi nguồn + nhà cung cấp + loại). Chạy một lần trên Supabase SQL editor.

create table if not exists su_co_ai (
  id uuid primary key default gen_random_uuid(),
  nguon text not null,            -- 'chat' | 'embedding' | 'kiem-tra'
  provider text not null,
  model text,
  loai text not null,             -- 'quota' | 'auth' | 'rate-limit' | 'server' | 'network'
  nang boolean not null default false,
  thong_diep text,
  luc timestamptz not null default now()
);

create index if not exists su_co_ai_luc_idx on su_co_ai (luc desc);

-- Chỉ service_role ở máy chủ đọc/ghi — giống các bảng vận hành khác
alter table su_co_ai enable row level security;
