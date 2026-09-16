import { NextResponse } from 'next/server';
import { supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

/**
 * Chặn ở tầng máy chủ cho các khả năng yêu cầu tài khoản.
 *
 * Ẩn nút ở giao diện KHÔNG phải phân quyền: ai mở công cụ dành cho lập trình
 * viên cũng gọi thẳng được endpoint. Bản spec v2 nói rõ mọi cổng thương mại phải
 * kiểm tra ở server, nên mỗi route cần gọi hàm này trước khi làm việc thật.
 *
 * Khi chưa cấu hình Supabase thì sản phẩm không có tài khoản nào cả, chặn lúc đó
 * là khoá chính mình ra ngoài mà chẳng bảo vệ được gì — nên cho qua và ghi rõ ở
 * đây để người vận hành biết: muốn phân quyền thật thì phải cấu hình Supabase.
 */

export type MucQuyen = 'anonymous' | 'free_registered' | 'plus' | 'admin';

export interface KetQuaCong {
  duocPhep: boolean;
  quyen: MucQuyen;
  userId?: string;
  /** Phản hồi sẵn sàng trả về khi bị chặn */
  chan?: NextResponse;
}

/** Yêu cầu người dùng đã đăng nhập (Gate 1 — miễn phí) */
export async function canDangNhap(lyDo: string): Promise<KetQuaCong> {
  if (!supabaseDaCauHinh) {
    return { duocPhep: true, quyen: 'free_registered' };
  }

  const user = await nguoiDungHienTai();
  if (user) {
    return { duocPhep: true, quyen: 'free_registered', userId: user.id };
  }

  return {
    duocPhep: false,
    quyen: 'anonymous',
    chan: NextResponse.json(
      {
        loi: 'Phần này cần tài khoản.',
        canDangNhap: true,
        lyDo,
      },
      { status: 401 }
    ),
  };
}
