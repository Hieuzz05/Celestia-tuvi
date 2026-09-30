-- ============================================================
-- Bối cảnh người đọc theo từng lá số (30/09/2026)
--
-- Vài điều người đọc tự chọn về hoàn cảnh hiện tại (tình cảm, con cái, công việc,
-- cách gọi người bạn đời) để Celes viết đúng góc nhìn. Xem lib/rag/v3/boi-canh-doc.ts.
--
-- Chỉ cộng thêm một cột cho phép rỗng. Chạy lại an toàn. Policy của bảng charts
-- (chủ lá số được đọc/sửa lá số của mình) đã phủ cột mới — không cần policy riêng.
--
-- Chưa chạy file này thì web vẫn chạy: bối cảnh chỉ nằm trong trình duyệt.
-- ============================================================

alter table public.charts add column if not exists boi_canh jsonb;
