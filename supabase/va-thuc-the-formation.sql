-- Cho phép loại thực thể FORMATION (cách cục) mà mã đã dùng từ commit df3702e.
-- Thiếu dòng này thì mọi lần nạp tài liệu vào kho tri thức đều hỏng ở bước
-- "đồng bộ từ điển thực thể". Chỉ nới rộng ràng buộc, chạy hai lần vẫn an toàn.
alter table public.knowledge_entities drop constraint if exists knowledge_entities_loai_check;
alter table public.knowledge_entities add constraint knowledge_entities_loai_check
  check (loai in ('STAR', 'PALACE', 'TRANSFORMATION', 'PERIOD', 'MARKER', 'FORMATION'));
