import { NextResponse } from 'next/server';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Cổng quyền cho mọi API quản trị RAG.
 *
 * Spec mục 17: ẩn mục menu là chuyện giao diện, chặn thật phải ở máy chủ. Mỗi
 * route tự viết lại vòng kiểm tra là mỗi route có cơ hội viết thiếu, nên gom về
 * một chỗ và bắt buộc dùng.
 */

export interface DanhTinhQuanTri {
  id?: string;
  email?: string;
}

export async function canQuanTri(): Promise<
  { duocPhep: true; actor: DanhTinhQuanTri } | { duocPhep: false; chan: NextResponse }
> {
  // Chưa bật Supabase thì chưa có hệ thống tài khoản — chỉ xảy ra khi chạy cục bộ.
  if (!supabaseDaCauHinh) return { duocPhep: true, actor: {} };

  const user = await nguoiDungHienTai();
  if (!user) {
    return { duocPhep: false, chan: NextResponse.json({ loi: 'Cần đăng nhập' }, { status: 401 }) };
  }
  if (!laAdmin(user.email)) {
    return {
      duocPhep: false,
      chan: NextResponse.json({ loi: 'Tài khoản không có quyền quản trị' }, { status: 403 }),
    };
  }

  return { duocPhep: true, actor: { id: user.id, email: user.email ?? undefined } };
}
