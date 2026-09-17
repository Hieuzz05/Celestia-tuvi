-- ============================================================
-- Celestia — Vá nhánh tìm theo từ khoá
-- Cách dùng: Supabase > SQL Editor > New query > dán toàn bộ > Run
--
-- Vì sao cần: bản đầu dùng plainto_tsquery, vốn nối mọi từ bằng AND. Truy vấn
-- mười chữ đòi đoạn phải chứa đủ cả mười, nên nhánh từ khoá luôn trả về rỗng và
-- toàn bộ truy hồi rơi về vector thuần. Bản này đổi sang OR.
--
-- An toàn khi chạy lại nhiều lần. Chỉ thay hai hàm, không đụng dữ liệu.
-- ============================================================

-- Biến một chuỗi thành tsquery nối bằng OR. Trả về null khi chuỗi rỗng hoặc chỉ
-- gồm ký tự bị bộ tách bỏ đi — để hàm gọi biết mà không so khớp với query rỗng.
create or replace function public.tsquery_hoac(cau text)
returns tsquery
language sql
immutable
as $fn$
  select nullif(replace(plainto_tsquery('simple', coalesce(cau, ''))::text, '&', '|'), '')::tsquery;
$fn$;

-- Tìm theo từ khoá. Cần cho tên sao hiếm: vector coi "Thiên Riêu" và
-- "Thiên Diêu" gần như nhau, còn ở đây chúng là hai từ khác nhau.
--
-- Dùng OR chứ không AND. `plainto_tsquery` nối mọi từ bằng `&`, nên một truy vấn
-- mười chữ đòi đoạn phải chứa đủ cả mười — thực tế là không đoạn nào khớp, và
-- nhánh từ khoá im lặng trả về rỗng mãi mãi. Đổi `&` thành `|` cho đoạn nào
-- chạm được từ nào cũng vào danh sách, rồi để ts_rank xếp hạng theo số từ trúng.
create or replace function public.tim_kien_thuc_tu_khoa(
  cau_truy_van text,
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
  select
    c.id, c.version_id, c.document_id, c.noi_dung, c.duong_de_muc,
    d.tieu_de, d.he_phai, d.muc_tin_cay, v.phien_ban,
    ts_rank(to_tsvector('simple', c.noi_dung), public.tsquery_hoac(cau_truy_van))::float as diem
  from public.knowledge_chunks c
  join public.knowledge_document_versions v on v.id = c.version_id
  join public.knowledge_documents d on d.id = c.document_id
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
    and public.tsquery_hoac(cau_truy_van) is not null
    and to_tsvector('simple', c.noi_dung) @@ public.tsquery_hoac(cau_truy_van)
  order by diem desc
  limit so_luong;
$fn$;
