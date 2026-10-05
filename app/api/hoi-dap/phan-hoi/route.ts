import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { chuanHoaPhanHoi, laUuid } from '@/lib/rag/phan-hoi';

/**
 * POST { requestId, phanHoi: 'huu_ich' | 'khong_dung', lyDo? } — 👍👎 trên một lượt Celes (CEL-195).
 *
 * Chỉ người đã đăng nhập, chỉ lượt của chính mình: lệnh ghi lọc cả request_id lẫn user_id, nên lượt
 * người khác và lượt không tồn tại cùng trả 404 (không lộ lượt nào có thật). Bấm lại thì ghi đè.
 */
export async function POST(req: Request) {
  const cong = await canDangNhap('phan-hoi');
  if (!cong.duocPhep) return cong.chan!;
  // Không có userId (máy chưa cấu hình Supabase) thì không kiểm được chủ lượt → không ghi.
  if (!laUuid(cong.userId)) return NextResponse.json({ loi: 'Chưa ghi được phản hồi.' }, { status: 503 });

  const b = await req.json().catch(() => null);
  const kq = chuanHoaPhanHoi(b);
  if (!kq.ok) return NextResponse.json({ loi: 'Phản hồi không hợp lệ.' }, { status: 400 });

  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa ghi được phản hồi.' }, { status: 503 });

  const u = await db
    .from('ai_requests')
    .update({ phan_hoi: kq.phanHoi, ly_do_phan_hoi: kq.lyDo })
    .eq('request_id', kq.requestId)
    .eq('user_id', cong.userId)
    .select('id');
  if (u.error) return NextResponse.json({ loi: 'Chưa ghi được phản hồi.' }, { status: 500 });
  if (!u.data?.length) return NextResponse.json({ loi: 'Không tìm thấy lượt này.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
