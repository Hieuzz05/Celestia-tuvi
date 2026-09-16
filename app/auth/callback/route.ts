import { NextResponse } from 'next/server';
import { taoSupabaseServer } from '@/lib/supabase/server';

/**
 * Điểm nhận redirect sau khi đăng nhập bằng nhà cung cấp ngoài (Google...).
 *
 * Mọi nhánh thất bại đều quay về trang đăng nhập KÈM lý do. Nếu cứ chuyển
 * hướng như thành công thì người dùng bấm Google xong thấy mình vẫn chưa đăng
 * nhập mà không hiểu vì sao — lỗi kiểu đó rất khó lần ra.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Sau proxy (Vercel), origin trong request.url là host nội bộ chứ không phải
  // địa chỉ người dùng đang mở, nên phải lấy theo header chuyển tiếp.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const goc = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  const veTrangDangNhap = (lyDo: string) =>
    NextResponse.redirect(`${goc}/dang-nhap?loi=${encodeURIComponent(lyDo)}`);

  // Nhà cung cấp trả lỗi (người dùng bấm Huỷ, client ID sai, chưa cấp quyền...)
  const loiNhaCungCap = searchParams.get('error_description') ?? searchParams.get('error');
  if (loiNhaCungCap) return veTrangDangNhap(loiNhaCungCap);

  const code = searchParams.get('code');
  if (!code) return veTrangDangNhap('Không nhận được mã xác thực từ nhà cung cấp');

  const supabase = await taoSupabaseServer();
  if (!supabase) return veTrangDangNhap('Máy chủ chưa cấu hình Supabase');

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return veTrangDangNhap(`Không đổi được mã lấy phiên đăng nhập: ${error.message}`);

  // Quay lại đúng trang người dùng đang đứng trước khi bấm đăng nhập.
  // Chỉ nhận đường dẫn nội bộ để không bị lợi dụng chuyển hướng ra ngoài.
  const next = searchParams.get('next');
  const dich = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return NextResponse.redirect(`${goc}${dich}`);
}
