import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseDaCauHinh } from '@/lib/supabase/config';
import { ghiLuotGoi, laRouteTonModel } from '@/lib/gioi-han-toc-do';

/** Làm mới phiên đăng nhập trên mỗi request để cookie không hết hạn giữa chừng */
export async function proxy(request: NextRequest) {
  if (request.method === 'POST' && laRouteTonModel(request.nextUrl.pathname)) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'khong-ro';
    const choGiay = ghiLuotGoi(ip);
    if (choGiay > 0) {
      return NextResponse.json(
        { loi: `Bạn đang hỏi hơi dồn. Đợi khoảng ${choGiay} giây rồi thử lại nhé — dữ liệu của bạn vẫn còn nguyên.` },
        { status: 429, headers: { 'Retry-After': String(choGiay) } }
      );
    }
  }

  if (!supabaseDaCauHinh) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // api/su-kien: beacon phễu gửi dày, không cần làm mới phiên — bỏ qua cho đỡ một lượt gọi Supabase mỗi sự kiện
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/su-kien|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
