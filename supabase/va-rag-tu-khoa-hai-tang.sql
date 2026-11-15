-- NHÁNH TỪ KHOÁ HAI TẦNG (CELES-78, 15/11/2026)
--
-- Thay thân hàm tim_kien_thuc_tu_khoa_cum. CHỮ KÝ VÀ CỘT TRẢ VỀ GIỮ NGUYÊN, code
-- không phải đổi. Quyền EXECUTE giữ nguyên (create or replace không đụng grant).
--
-- Vì sao: bản đang chạy (va-rag-chat-luong.sql) đã ghi đè bản dùng cột tsv của
-- va-rag-toc-do.sql, nên mỗi lần gọi tính lại to_tsvector ba lần trên mỗi đoạn,
-- và vế "từ lẻ" là phép HOẶC nên lọt ~92% số đoạn. Đo 15/11: 1,9–10,7 giây một
-- lần gọi, quá trần 8 giây của vai authenticator → Production báo "canceling
-- statement due to statement timeout", nhánh từ khoá rỗng.
--
-- Cách làm:
--   Tầng 1: đếm số đoạn khớp ĐÚNG cụm (q_cum, phép <->), lọc trước bằng phép VÀ
--           (q_du = q_cum với <-> đổi thành &) cho chỉ mục GIN gánh.
--   Đủ so_luong đoạn → chỉ chấm trên tập ứng viên khớp q_du (top max(4×, 60)),
--           rồi chấm lại đúng công thức cũ và lấy so_luong.
--   Không đủ (cụm hiếm) → chạy đúng công thức cũ trên c.tsv (vẫn nhanh hơn
--           bản cũ vì không tính lại tsvector).
-- Công thức điểm giữ nguyên: 2 × ts_rank(cụm) + ts_rank(từ lẻ), cờ chuẩn hoá 1.
-- Đo trên 16 câu thật: 15/15 đoạn trùng, cùng thứ tự, lệch điểm 0.
--
-- PHỤ THUỘC (chạy trước): va-rag-tu-khoa.sql (tsquery_hoac),
-- va-rag-chat-luong.sql (tsquery_cum), va-rag-toc-do.sql (cột tsv + chỉ mục
-- knowledge_chunks_tsv_idx).
-- HOÀN TÁC: va-rag-tu-khoa-hai-tang-HOAN-TAC.sql (thân hàm nguyên văn trước đó).

create or replace function public.tim_kien_thuc_tu_khoa_cum(
  cau_tu_le text,
  cum_tu text[],
  so_luong int default 15,
  loc_he_phai text default null,
  loc_thuc_the text[] default null
)
returns table (
  chunk_id uuid, version_id uuid, document_id uuid, noi_dung text,
  duong_de_muc text, tieu_de text, he_phai text, muc_tin_cay text,
  phien_ban text, diem double precision
)
language plpgsql
stable
as $fn$
#variable_conflict use_column
declare
  q_cum tsquery;
  q_le tsquery;
  q_du tsquery;
  q_all tsquery;
  n int := 0;
begin
  q_cum := public.tsquery_cum(cum_tu);
  q_le := public.tsquery_hoac(cau_tu_le);
  q_all := case
    when q_cum is null then q_le
    when q_le is null then q_cum
    else q_cum || q_le
  end;
  if q_all is null then
    return;
  end if;

  if q_cum is not null then
    q_du := replace(q_cum::text, '<->', '&')::tsquery;
    select count(*) into n from (
      select 1
      from public.knowledge_chunks c
      join public.knowledge_document_versions v on v.id = c.version_id
      join public.knowledge_documents d on d.id = c.document_id
      where v.trang_thai = 'da_xuat_ban'
        and c.trang_thai <> 'loai_tru'
        and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
        and (loc_thuc_the is null or exists (
          select 1 from public.chunk_entities ce
          where ce.chunk_id = c.id and ce.entity_id = any(loc_thuc_the)))
        and c.tsv @@ q_du
        and c.tsv @@ q_cum
      limit so_luong
    ) s;
  end if;

  if n >= so_luong then
    return query
    with ung as (
      select c.id, c.tsv
      from public.knowledge_chunks c
      join public.knowledge_document_versions v on v.id = c.version_id
      join public.knowledge_documents d on d.id = c.document_id
      where v.trang_thai = 'da_xuat_ban'
        and c.trang_thai <> 'loai_tru'
        and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
        and (loc_thuc_the is null or exists (
          select 1 from public.chunk_entities ce
          where ce.chunk_id = c.id and ce.entity_id = any(loc_thuc_the)))
        and c.tsv @@ q_du
      order by 2 * ts_rank(c.tsv, q_du, 1) + coalesce(ts_rank(c.tsv, q_le, 1), 0) desc
      limit greatest(so_luong * 4, 60)
    )
    select c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
      d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
      (2 * coalesce(ts_rank(u.tsv, q_cum, 1), 0)
        + coalesce(ts_rank(u.tsv, q_le, 1), 0))::float as diem
    from ung u
    join public.knowledge_chunks c on c.id = u.id
    join public.knowledge_document_versions v on v.id = c.version_id
    join public.knowledge_documents d on d.id = c.document_id
    order by diem desc
    limit so_luong;
  else
    return query
    select c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
      d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
      (2 * coalesce(ts_rank(c.tsv, q_cum, 1), 0)
        + coalesce(ts_rank(c.tsv, q_le, 1), 0))::float as diem
    from public.knowledge_chunks c
    join public.knowledge_document_versions v on v.id = c.version_id
    join public.knowledge_documents d on d.id = c.document_id
    where v.trang_thai = 'da_xuat_ban'
      and c.trang_thai <> 'loai_tru'
      and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
      and (loc_thuc_the is null or exists (
        select 1 from public.chunk_entities ce
        where ce.chunk_id = c.id and ce.entity_id = any(loc_thuc_the)))
      and c.tsv @@ q_all
    order by diem desc
    limit so_luong;
  end if;
end
$fn$;
