-- ============================================================
-- Celestia — Vá chất lượng truy hồi (chỉ mục vector + tìm theo cụm)
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
-- Chạy sau va-rag-tu-khoa.sql. Chạy lại nhiều lần được.
--
-- Không xoá bảng, không xoá cột, không đổi dữ liệu. Bản mã đang chạy trên
-- production vẫn chạy được trước và sau khi chạy tệp này: nó không gọi tên chỉ
-- mục nào, và hàm tìm theo từ khoá cũ được giữ nguyên.
-- ============================================================

-- ============================================================
-- 1. CHỈ MỤC VECTOR: ivfflat → hnsw
-- ============================================================
--
-- Chỉ mục ivfflat cũ (schema-rag.sql) được tạo ngay cùng bảng, lúc bảng còn
-- rỗng. ivfflat chia vector thành 100 nhóm theo tâm tính TỪ DỮ LIỆU CÓ SẴN lúc
-- tạo — bảng rỗng thì tâm nhóm là rác, và tài liệu pgvector ghi rõ phải tạo sau
-- khi đã có dữ liệu. Thêm vào đó `ivfflat.probes` mặc định là 1: mỗi truy vấn chỉ
-- quét một nhóm, tức khoảng 1/100 kho, rồi mới áp các điều kiện lọc (đã xuất
-- bản, không loại trừ, có vector). Kết quả là nhánh vector có thể trả về ít hơn
-- 15 đoạn và bỏ sót đoạn đúng mà không báo gì.
--
-- hnsw không cần dữ liệu lúc tạo, không cần tạo lại khi kho lớn lên, và tìm
-- chính xác hơn hẳn ở cùng tốc độ. Kho 7.559 đoạn tạo chỉ mục mất vài chục giây.
--
-- Xoá chỉ mục không làm mất dữ liệu nào. Giữa lúc xoá và lúc tạo xong, truy vấn
-- quét toàn bảng — với kho cỡ này vẫn dưới một giây.

drop index if exists public.knowledge_chunks_embedding_idx;

create index if not exists knowledge_chunks_embedding_hnsw_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- hnsw lấy `ef_search` ứng viên (mặc định 40) rồi mới áp điều kiện lọc. Nâng lên
-- 100 để sau khi lọc bỏ các phiên bản cũ đã lưu trữ vẫn còn đủ 15 đoạn. Gắn vào
-- hàm chứ không đặt cho cả database, để không đổi hành vi của truy vấn khác.
alter function public.tim_kien_thuc_vector(vector, int, float, text, text[])
  set hnsw.ef_search = 100;

-- ============================================================
-- 2. TÌM THEO CỤM CHO TÊN RIÊNG
-- ============================================================
--
-- Bộ tách 'simple' cắt "Thiên Cơ" thành "thiên" và "cơ". Nối bằng HOẶC thì mọi
-- đoạn có chữ "Thiên" đều khớp: Thiên Đồng, Thiên Lương, Thiên Di, Thiên La…
-- Tên sao, cung, cách cục phải khớp nguyên cụm, theo đúng thứ tự (`thiên <-> cơ`).
--
-- Mã ứng dụng tách sẵn hai phần (lib/rag/cum-tu-khoa.ts):
--   cum_tu     — các tên riêng, mỗi phần tử một cụm
--   cau_tu_le  — từ lẻ còn lại, nối bằng HOẶC như cũ

-- Mảng cụm → một tsquery nối các cụm bằng HOẶC. Null khi không có cụm nào.
create or replace function public.tsquery_cum(cum text[])
returns tsquery
language sql
immutable
as $fn$
  select nullif(string_agg('(' || q::text || ')', ' | '), '')::tsquery
  from (
    select phraseto_tsquery('simple', x) as q
    from unnest(coalesce(cum, '{}'::text[])) as x
  ) t
  where q::text <> '';
$fn$;

-- Điểm = 2 × điểm theo cụm + điểm theo từ lẻ. Một đoạn nhắc đúng "Thiên Cơ" phải
-- đứng trên một đoạn chỉ tình cờ có chữ "cơ". Cờ chuẩn hoá 1 chia điểm cho log
-- độ dài đoạn: ts_rank để trần thì đoạn dài được lợi chỉ vì dài.
--
-- Điểm này chỉ dùng để XẾP HẠNG trong nhánh từ khoá; ứng dụng trộn hai nhánh
-- bằng RRF theo thứ hạng, không cộng điểm với nhánh vector.
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
$fn$;

-- PostgREST chỉ thấy hàm mới sau khi nạp lại lược đồ
notify pgrst, 'reload schema';
