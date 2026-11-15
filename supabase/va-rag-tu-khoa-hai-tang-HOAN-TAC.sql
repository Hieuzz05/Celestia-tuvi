-- HOÀN TÁC va-rag-tu-khoa-hai-tang.sql (CELES-78)
--
-- Thân hàm tim_kien_thuc_tu_khoa_cum NGUYÊN VĂN như trên DB thật trước khi áp
-- (lấy bằng pg_get_functiondef ngày 15/11/2026). Đây là bản của va-rag-chat-luong.sql:
-- chậm (1,9–10,7 giây), hay quá trần 8 giây. Chỉ chạy khi bản hai tầng gây lỗi.
-- Bản hai tầng là plpgsql, bản này là sql: create or replace đổi được ngôn ngữ vì
-- chữ ký và kiểu trả về giữ nguyên. Quyền EXECUTE không đổi.

create or replace function public.tim_kien_thuc_tu_khoa_cum(
  cau_tu_le text,
  cum_tu text[],
  so_luong integer default 15,
  loc_he_phai text default null::text,
  loc_thuc_the text[] default null::text[]
)
returns table (
  chunk_id uuid, version_id uuid, document_id uuid, noi_dung text,
  duong_de_muc text, tieu_de text, he_phai text, muc_tin_cay text,
  phien_ban text, diem double precision
)
language sql
stable
as $function$
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
      2 * coalesce(ts_rank(to_tsvector('simple', c.noi_dung), qq.q_cum, 1), 0)
      + coalesce(ts_rank(to_tsvector('simple', c.noi_dung), qq.q_le, 1), 0)
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
    and to_tsvector('simple', c.noi_dung) @@ qq.q_tat_ca
  order by diem desc
  limit so_luong;
$function$;
