-- TĂNG TỐC NHÁNH TỪ KHOÁ CỦA RAG (25/09/2026)
--
-- Đo trên máy: một truy vấn RAG trọn gói 2,7–4,3 giây, trong đó nhánh vector
-- chỉ 0,16 giây — phần còn lại là tim_kien_thuc_tu_khoa_cum. Tệ hơn, nó KHÔNG
-- chạy song song được: 15 truy vấn cùng lúc mất 15 giây. Luận giải v3 mỗi câu
-- chạy ~5 truy vấn, trang tổng quan 11 câu → vài chục truy vấn dồn một lúc.
--
-- Nguyên nhân: hàm gọi to_tsvector('simple', c.noi_dung) HAI LẦN cho mỗi đoạn
-- khớp để chấm ts_rank — tính lại tsvector từ chữ thô trên hàng nghìn đoạn mỗi
-- lần (vế "từ lẻ" là phép HOẶC nên khớp rất rộng). Chỉ mục GIN có sẵn chỉ giúp
-- khâu LỌC, không giúp khâu chấm điểm.
--
-- Sửa: cột tsv tính sẵn (generated stored) + GIN trên cột đó, hàm dùng c.tsv.
-- Chữ ký hàm giữ nguyên nên code không phải đổi gì. Kết quả xếp hạng giữ nguyên
-- (cùng biểu thức tsvector, chỉ là tính trước).
--
-- Chạy một lần trên Supabase SQL editor. Thêm cột stored sẽ ghi lại cả bảng
-- knowledge_chunks (~7.500 dòng) — vài giây.

alter table public.knowledge_chunks
  add column if not exists tsv tsvector
  generated always as (to_tsvector('simple', noi_dung)) stored;

create index if not exists knowledge_chunks_tsv_idx
  on public.knowledge_chunks using gin (tsv);

create or replace function public.tim_kien_thuc_tu_khoa_cum(
  cau_tu_le text,
  cum_tu text[],
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
  with q as (
    select public.tsquery_cum(cum_tu) as q_cum, public.tsquery_hoac(cau_tu_le) as q_le
  ), qq as (
    select
      q_cum,
      q_le,
      case
        when q_cum is null then q_le
        when q_le is null then q_cum
        else q_cum || q_le
      end as q_tat_ca
    from q
  )
  select
    c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
    d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
    (
      2 * coalesce(ts_rank(c.tsv, qq.q_cum, 1), 0)
      + coalesce(ts_rank(c.tsv, qq.q_le, 1), 0)
    )::float as diem
  from public.knowledge_chunks c
  join public.knowledge_document_versions v on v.id = c.version_id
  join public.knowledge_documents d on d.id = c.document_id
  cross join qq
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
    and qq.q_tat_ca is not null
    and c.tsv @@ qq.q_tat_ca
  order by diem desc
  limit so_luong;
$fn$;
