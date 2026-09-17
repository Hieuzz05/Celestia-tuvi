-- ============================================================
-- Celestia — Nạp mỗi tài liệu trong MỘT lần
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
-- Chạy sau schema-rag-v2.sql. Chạy lại nhiều lần được.
--
-- Vì sao cần: trước đây đoạn và vector phải sinh ra cùng lúc, nên cả tài liệu
-- phải lọt trong một HTTP request. Tài liệu lớn nhất có 1.134 đoạn — không có
-- cách nào nhét vừa 60 giây của Vercel Hobby.
--
-- Bỏ ràng buộc not null cho `embedding` để lưu đoạn trước, điền vector sau theo
-- từng lô. Mỗi request vẫn ngắn, và nạp dở mà đứt thì bấm lại chạy tiếp được.
-- ============================================================

alter table public.knowledge_chunks
  alter column embedding drop not null;

-- Pha điền vector quét theo cột này. Không có index thì mỗi lượt là một lần
-- quét toàn bảng — với tám nghìn đoạn thì mỗi lượt chậm dần.
create index if not exists knowledge_chunks_cho_embed_idx
  on public.knowledge_chunks (version_id, thu_tu)
  where embedding is null;

-- ============================================================
-- Truy hồi phải bỏ qua đoạn chưa có vector
-- ============================================================
--
-- Về mặt SQL thì `1 - (null <=> v) >= nguong` trả về null nên dòng bị loại sẵn.
-- Nhưng dựa vào đó là dựa vào một hệ quả phụ: đổi ngưỡng về 0 hay đổi phép so là
-- đoạn rỗng lọt vào kết quả. Viết thẳng điều kiện ra cho nó không phụ thuộc may rủi.

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
    and c.embedding is not null
    and (loc_he_phai is null or d.he_phai = loc_he_phai or d.he_phai = 'chung')
    and 1 - (c.embedding <=> vector_truy_van) >= nguong_toi_thieu
  order by c.embedding <=> vector_truy_van
  limit so_luong;
$fn$;

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
    and c.embedding is not null
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

-- ============================================================
-- Xoá liên kết thực thể của cả một phiên bản
-- ============================================================
--
-- Pha chốt phải xoá rồi chèn lại để gọi trùng không làm số lần đếm nhân đôi.
-- Xoá qua PostgREST phải liệt kê từng chunk_id trong URL — với hơn nghìn đoạn
-- thì URL vỡ. Một hàm nhận version_id làm việc đó trong một câu lệnh.
create or replace function public.xoa_lien_ket_thuc_the(p_version_id uuid)
returns void
language sql
security definer
set search_path = public
as $fn$
  delete from public.chunk_entities ce
  using public.knowledge_chunks c
  where ce.chunk_id = c.id and c.version_id = p_version_id;
$fn$;

revoke execute on function public.xoa_lien_ket_thuc_the(uuid) from public, anon, authenticated;
grant execute on function public.xoa_lien_ket_thuc_the(uuid) to service_role;
