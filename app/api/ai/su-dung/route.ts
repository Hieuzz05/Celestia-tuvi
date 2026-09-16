import { NextResponse } from 'next/server';
import { HAN_MUC_NGAY, nhatKyGanDay, soLuotHomNay } from '@/lib/ai/usage';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

export async function GET() {
  if (supabaseDaCauHinh) {
    const user = await nguoiDungHienTai();
    if (!user) return NextResponse.json({ loi: 'Cần đăng nhập' }, { status: 403 });
    if (!laAdmin(user.email)) {
      return NextResponse.json({ loi: 'Không có quyền quản trị' }, { status: 403 });
    }
  }

  const [homNay, nhatKy] = await Promise.all([soLuotHomNay(), nhatKyGanDay(7)]);
  return NextResponse.json({ homNay, hanMuc: HAN_MUC_NGAY, nhatKy });
}
