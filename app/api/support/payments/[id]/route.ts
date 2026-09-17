import { NextResponse } from 'next/server';
import { quyenHienTai } from '@/lib/support/entitlements';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Trạng thái một đơn ủng hộ.
 *
 * Trang thanh toán hỏi endpoint này chứ KHÔNG đọc tham số trên URL trả về.
 * Tham số đó người dùng tự sửa được; chỉ webhook đã xác thực chữ ký mới đổi
 * được trạng thái trong bảng.
 */
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await nguoiDungHienTai();
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  }

  const db = taoSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: { code: 'PAYMENT_NOT_CONFIGURED' } }, { status: 503 });
  }

  const { data: don } = await db
    .from('support_payments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Không phân biệt "không có" với "của người khác": trả lời khác nhau là để lộ
  // đơn nào tồn tại.
  if (!don || don.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  const daCap = don.status === 'entitlement_granted';
  const quyen = daCap ? await quyenHienTai() : null;

  return NextResponse.json(
    {
      paymentId: don.id,
      status: don.status,
      amount: Number(don.amount_vnd),
      expiresAt: don.expires_at,
      checkoutUrl: don.checkout_url,
      qrCode: don.qr_code,
      entitlementGranted: daCap,
      supporterExpiresAt: quyen?.supporterExpiresAt ?? null,
      askBalance: quyen?.ask.supporterBalance ?? null,
      returnTo: don.return_to,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
