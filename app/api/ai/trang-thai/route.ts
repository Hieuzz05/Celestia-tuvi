import { NextResponse } from 'next/server';
import { trangThaiModel } from '@/lib/ai/config';

export async function GET() {
  const ds = trangThaiModel();
  return NextResponse.json({
    models: ds,
    soModelSanSang: ds.filter((m) => m.daCauHinh).length,
  });
}
