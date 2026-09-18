import Link from 'next/link';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';
import { Shell } from '@/components/ui';
import { TabQuanTri } from '@/components/admin/TabQuanTri';

/**
 * Chặn quyền vào trang quản trị ở phía server. Đặt ở layout thay vì trong page
 * để trang con vẫn là client component mà không lọt qua được vòng kiểm tra.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Chưa cấu hình Supabase thì chưa có hệ thống tài khoản để phân quyền — lúc này
  // app chỉ chạy cục bộ nên cho vào, nhưng phải cảnh báo rõ trước khi công khai.
  if (!supabaseDaCauHinh) {
    return (
      <>
        <div
          className="mt-[24px] rounded-[var(--radius-cards)] border p-[16px] text-[13px]"
          style={{ borderColor: 'var(--chart-hung)', color: 'var(--chart-hung)' }}
        >
          Trang quản trị đang <strong>mở cho tất cả mọi người</strong> vì chưa bật đăng nhập. Hãy
          cấu hình Supabase và khai báo <code>ADMIN_EMAILS</code> trước khi đưa trang lên mạng.
        </div>
        {children}
      </>
    );
  }

  const user = await nguoiDungHienTai();

  if (!user) {
    return (
      <Shell className="py-[60px]">
        <h1 className="heading">Cần đăng nhập</h1>
        <p className="body-text mt-[18px]" style={{ color: 'var(--fg-muted)' }}>
          Trang quản trị chỉ dành cho tài khoản được cấp quyền.
        </p>
        <Link href="/dang-nhap" className="btn-primary mt-[24px] inline-block">
          Đăng nhập
        </Link>
      </Shell>
    );
  }

  if (!laAdmin(user.email)) {
    return (
      <Shell className="py-[60px]">
        <h1 className="heading">Không có quyền</h1>
        <p className="body-text mt-[18px]" style={{ color: 'var(--fg-muted)' }}>
          Tài khoản <strong>{user.email}</strong> không nằm trong danh sách quản trị viên. Thêm
          email này vào biến môi trường <code>ADMIN_EMAILS</code> nếu đây là nhầm lẫn.
        </p>
      </Shell>
    );
  }

  /*
   * Thanh tab đặt ở layout nên có mặt trên mọi trang con.
   *
   * Trước đây bốn trang nối nhau bằng bốn dòng chữ ở ĐÁY trang tổng quan: muốn
   * sang Kho tri thức phải về tổng quan rồi cuộn hết xuống, còn từ Kho tri thức
   * sang Retrieval Lab thì không có đường nào ngoài gõ tay địa chỉ.
   */
  // Thanh tab có Shell riêng, KHÔNG bọc `children`: mỗi trang con đã tự có
  // Shell của nó, lồng hai lớp là nhân đôi lề và bóp hẹp bề ngang nội dung.
  return (
    <>
      <Shell className="pt-[24px]">
        <TabQuanTri />
      </Shell>
      {children}
    </>
  );
}
