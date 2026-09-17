import { NextResponse } from 'next/server';
import { quyenHienTai } from '@/lib/support/entitlements';

/**
 * Quyền hiện tại của tài khoản đang đăng nhập.
 *
 * Giao diện đọc endpoint này để biết còn bao nhiêu câu và mở được gì. Nó là
 * nguồn cho UX, KHÔNG phải cơ chế chặn: mọi khả năng trả phí đều phải tự kiểm
 * lại ở endpoint của chính nó.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const quyen = await quyenHienTai();
  return NextResponse.json(quyen, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
