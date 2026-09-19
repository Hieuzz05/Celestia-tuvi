# Celestia Tử Vi

Web app Tử Vi AI — lập lá số theo Nam phái, luận giải hiện đại bằng nhiều model AI có cơ chế
fallback, kèm lịch âm dương, hồ sơ người dùng và trang quản trị.

## Bắt đầu

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — lập lá số chạy ngay, không cần API key hay database.

Xem hướng dẫn đầy đủ (deploy Vercel, nối model AI, nối Supabase) trong
[HUONG-DAN.md](./HUONG-DAN.md).

Kiểm máy đã đủ điều kiện chạy chưa — thiếu khoá nào, thiếu bảng nào:

```bash
npx tsx scripts/kiem-moi-truong.ts
```

## Làm trên nhiều máy

Dự án đang được phát triển bởi hai AI trên hai máy khác nhau.

- [PHOI-HOP.md](./PHOI-HOP.md) — dành cho chủ dự án: dựng máy thứ hai từ đầu, cách
  làm việc hằng ngày, xử lý sự cố.
- [AI-PHOI-HOP.md](./AI-PHOI-HOP.md) — dành cho AI: luật nhánh, chia vùng, cổng
  kiểm tra trước khi đẩy.
- [TRANG-THAI.md](./TRANG-THAI.md) — bảng bàn giao giữa hai máy.
- [supabase/DA-CHAY.md](./supabase/DA-CHAY.md) — tệp SQL nào đã chạy.
- [NGHIEM-THU-RAG.md](./NGHIEM-THU-RAG.md) — tiêu chí nghiệm thu kho tri thức và mức đã đo.
- [NOI-DUNG-TUNG-MAN.md](./NOI-DUNG-TUNG-MAN.md) — từng màn: đâu do AI viết, kỳ làm mới, đâu là chữ cố định.

## Công nghệ

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres + pgvector)
