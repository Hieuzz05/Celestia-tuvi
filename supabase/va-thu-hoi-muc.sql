-- ============================================================
-- X3 — CỔNG THU HỒI tri thức: lệnh thu hồi MỤC THƯ VIỆN (CELES-27, 22/10/2026)
-- ============================================================
--
-- Vì sao: một mục thư viện sai đã đi vào bài V3 đã lưu thì gỡ mục khỏi thư viện không đủ — bài cũ
-- trong đệm vẫn hiện nguyên. Bảng này ghi "dấu nội dung nào đã bị thu hồi"; máy chủ đọc nó (60 giây
-- một lần) và viết lại đúng câu đã dựa vào mục đó khi có người mở (lib/rag/thu-hoi/).
--
-- Quyết định của chủ dự án (22/10/2026):
--   1a — đoạn SÁCH thu hồi bằng knowledge_chunks.trang_thai = 'loai_tru', KHÔNG qua bảng này.
--        Bảng này chỉ giữ MỤC THƯ VIỆN, khoá theo dấu nội dung (`dau`, 8 ký tự hex — thu-vien/dau.ts).
--   2  — thêm đúng 1 bảng: chỉ thêm, IF NOT EXISTS, RLS bật, KHÔNG policy (chỉ service-role đọc / ghi).
--
-- pham_vi: 'all' = mọi môi trường (production); 'preview:<nhánh>-<băm>' / 'local:<tên>' = chỉ máy chủ
-- có đúng phamViDem đó (lib/moi-truong-dem.ts) — để thu hồi THỬ trên Preview mà production không thấy.
--
-- Hoàn tác = điền huy_luc, không xoá hàng: còn trả lời được "ai thu hồi gì, lúc nào".
-- Chạy lặp được. Chạy trên Supabase SQL Editor TRƯỚC khi bật CELES_CONG_THU_HOI=1.

create table if not exists thu_hoi_muc_thu_vien (
  su_kien_id uuid not null,
  dau text not null check (dau ~ '^[0-9a-f]{8}$'),
  pham_vi text not null check (pham_vi = 'all' or pham_vi ~ '^(preview|local):[a-z0-9-]+$'),
  ly_do text not null default '',
  nguoi text not null default '',
  thu_hoi_luc timestamptz not null default now(),
  huy_luc timestamptz,
  huy_boi text,
  primary key (su_kien_id, dau)
);

create index if not exists thu_hoi_muc_hieu_luc on thu_hoi_muc_thu_vien (pham_vi) where huy_luc is null;

alter table thu_hoi_muc_thu_vien enable row level security;
-- Cố tình KHÔNG có policy: anon / authenticated không đọc được; chỉ service-role (bỏ qua RLS).
