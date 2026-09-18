-- Bộ nhớ đệm nội dung do AI sinh, khoá theo (lá số, bề mặt, kỳ).
--
-- Vì sao phải có bảng này thay vì gọi model mỗi lần mở trang:
--
--  1. **Người dùng đọc lại phải thấy đúng bài cũ.** Trang Hôm nay, Hành trình và
--     các mốc thời gian là thứ người ta mở đi mở lại trong ngày. Mỗi lần một bản
--     khác thì không ai đối chiếu được gì, kể cả với chính bản họ đọc sáng nay.
--     Đây cũng là điều chủ dự án chốt: "gen từ AI nhưng không thay đổi".
--  2. **Hạn mức là có thật.** Gemini gói miễn phí cho 20 lượt sinh mỗi ngày.
--     Một trang Hành trình mà sinh riêng cho từng giai đoạn, từng năm, từng
--     tháng là vài chục lượt cho một lần mở.
--  3. **Trả tiền theo token.** Cùng một lá số, cùng một tháng, cùng một câu hỏi
--     thì không có lý do gì trả tiền hai lần.
--
-- `khoa_ky` là thứ quyết định khi nào nội dung được làm mới:
--   'ngay:2026-09-18'      → Điểm nổi bật, đổi mỗi ngày
--   'thang:2026-08'        → Điều đang chuyển động, đổi mỗi tháng ÂM LỊCH
--   'giai-doan:36-45'      → một giai đoạn, không đổi cho tới giai đoạn sau
--   'nam:2026' / 'thang-chi-tiet:2026-08'
--
-- Không đặt TTL. Hết kỳ thì khoá đổi, dòng cũ nằm lại làm lịch sử — đọc lại bài
-- tháng trước vẫn ra đúng bài tháng trước.

create table if not exists noi_dung_ai (
  id uuid primary key default gen_random_uuid(),
  chart_hash text not null,
  be_mat text not null,
  khoa_ky text not null,
  ngon_ngu text not null default 'vi',
  noi_dung jsonb not null,
  provider text,
  model text,
  phien_ban jsonb,
  run_id uuid,
  tao_luc timestamptz not null default now()
);

-- Một lá số, một bề mặt, một kỳ, một ngôn ngữ thì chỉ có đúng một bản.
-- Chặn ở đây chứ không chặn ở tầng ứng dụng: hai tab mở cùng lúc là hai request
-- song song, mà tầng ứng dụng thì không thấy nhau.
create unique index if not exists noi_dung_ai_khoa_idx
  on noi_dung_ai (chart_hash, be_mat, khoa_ky, ngon_ngu);

create index if not exists noi_dung_ai_tao_luc_idx on noi_dung_ai (tao_luc desc);

-- RLS bật mà không có policy nào: anon key không chạm được: mọi lối vào đều qua
-- service_role ở phía máy chủ. Giống các bảng tri thức khác trong dự án.
alter table noi_dung_ai enable row level security;
