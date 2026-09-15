import { NextResponse } from 'next/server';
import { taoSupabaseServer } from '@/lib/supabase/server';

/** Điểm nhận redirect của OAuth (Google) — đổi code lấy session rồi về trang hồ sơ */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = await taoSupabaseServer();
    if (supabase) await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/ho-so`);
}
