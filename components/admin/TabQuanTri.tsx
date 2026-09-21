'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Thanh tab của khu quản trị.
 *
 * Trước đây bốn trang con nối với nhau bằng bốn dòng chữ nằm ở ĐÁY trang tổng
 * quan. Muốn sang Kho tri thức thì phải về trang tổng quan rồi cuộn hết xuống —
 * và từ chính Kho tri thức thì không có đường nào sang Retrieval Lab ngoài việc
 * gõ tay địa chỉ. Bốn trang dùng chung một công việc mà lại không thấy nhau.
 *
 * Đặt ở layout nên có mặt trên MỌI trang con, luôn ở trên đầu, và luôn chỉ rõ
 * đang đứng ở đâu.
 */

const TAB = [
  { href: '/admin', nhan: 'Tổng quan' },
  { href: '/admin/models', nhan: 'Model' },
  { href: '/admin/knowledge', nhan: 'Kho tri thức' },
  { href: '/admin/retrieval-lab', nhan: 'Retrieval Lab' },
  { href: '/admin/support', nhan: 'Ủng hộ' },
];

export function TabQuanTri() {
  const duong = usePathname();

  return (
    <nav
      className="no-print mb-[24px] flex flex-wrap gap-[8px] border-b pb-[12px]"
      style={{ borderColor: 'var(--line)' }}
      aria-label="Khu quản trị"
    >
      {TAB.map((m) => {
        // "/admin" khớp chính xác, các tab khác khớp cả trang con của nó
        const dangO = m.href === '/admin' ? duong === '/admin' : duong.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={dangO ? 'page' : undefined}
            className="rounded-[var(--radius-pill)] px-[14px] py-[7px] text-[14px] transition-colors"
            style={{
              background: dangO ? 'var(--fg)' : 'transparent',
              color: dangO ? 'var(--bg)' : 'var(--fg-muted)',
              fontWeight: dangO ? 600 : 400,
            }}
          >
            {m.nhan}
          </Link>
        );
      })}
    </nav>
  );
}
