import { NextResponse } from 'next/server';
import { suCoGanDay } from '@/lib/ai/su-co';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';

/** Sự cố AI 24 giờ qua — chỉ quản trị viên. Xem lib/ai/su-co.ts */
export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const ds = await suCoGanDay(24);
  return NextResponse.json({ suCo: ds, coWebhook: Boolean(process.env.CANH_BAO_WEBHOOK_URL?.trim()) });
}
