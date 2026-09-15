import { NextResponse } from 'next/server';
import { layApiKey } from '@/lib/ai/config';
import { testKetNoi } from '@/lib/ai/providers';
import { TEN_PROVIDER, type ProviderId } from '@/lib/ai/types';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * Endpoint này nhận API key do quản trị viên dán vào để thử kết nối, nên chỉ mở
 * cho admin khi hệ thống đã có đăng nhập. Khi chưa cấu hình Supabase (giai đoạn
 * phát triển cục bộ) thì cho phép, vì lúc đó app chưa public.
 */
async function kiemTraQuyen(): Promise<string | null> {
  if (!supabaseDaCauHinh) return null;
  const user = await nguoiDungHienTai();
  if (!user) return 'Cần đăng nhập để dùng chức năng này';
  if (!laAdmin(user.email)) return 'Tài khoản của bạn không có quyền quản trị';
  return null;
}

export async function POST(req: Request) {
  const loiQuyen = await kiemTraQuyen();
  if (loiQuyen) return NextResponse.json({ ok: false, thongDiep: loiQuyen }, { status: 403 });

  let body: { provider?: string; model?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, thongDiep: 'Body không hợp lệ' }, { status: 400 });
  }

  const provider = body.provider as ProviderId;
  if (!provider || !TEN_PROVIDER[provider]) {
    return NextResponse.json({ ok: false, thongDiep: 'Nhà cung cấp không hợp lệ' }, { status: 400 });
  }
  const model = body.model?.trim();
  if (!model) {
    return NextResponse.json({ ok: false, thongDiep: 'Thiếu tên model' }, { status: 400 });
  }

  // Không truyền key thì dùng key đang cấu hình trong biến môi trường
  const apiKey = body.apiKey?.trim() || layApiKey(provider);
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, thongDiep: `Chưa có API key cho ${TEN_PROVIDER[provider]}` },
      { status: 400 }
    );
  }

  const kq = await testKetNoi(provider, model, apiKey);
  return NextResponse.json(kq);
}
