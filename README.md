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

## Công nghệ

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres + pgvector)
