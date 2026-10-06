import { NextResponse } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { donNhatKy } from '@/lib/rag/don-nhat-ky';

/**
 * Dọn nhật ký vận hành quá hạn lưu, mỗi ngày một lần (vercel.json).
 * Hạn lưu và lý do: lib/rag/don-nhat-ky.ts. Không gọi model, không tốn phí.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const bem = process.env.CRON_SECRET?.trim();
  if (!bem) return NextResponse.json({ loi: 'Chưa đặt CRON_SECRET' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${bem}`) {
    return NextResponse.json({ loi: 'Không có quyền' }, { status: 401 });
  }

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: 'Thiếu cấu hình Supabase' }, { status: 503 });

  const ketQua = await donNhatKy(supabase);
  const loi = ketQua.some((k) => k.loi);
  return NextResponse.json({ ok: !loi, ketQua }, { status: loi ? 500 : 200 });
}
