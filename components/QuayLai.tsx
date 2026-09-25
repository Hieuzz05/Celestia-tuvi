'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * NÚT QUAY LẠI dùng chung cho các trang con (25/09/2026).
 *
 * Chủ dự án: bấm sang luận giải chuyên sâu thì không có chỗ nào để về màn cũ.
 * Thanh điều hướng chỉ đưa về các trang gốc, không về đúng lá số + đúng tab
 * người đọc vừa rời.
 *
 * Thứ tự ưu tiên:
 *   1. `?ve=` trên URL — trang trước ghi rõ chỗ cần về (vd. /la-so?...&tab=chuyen-sau).
 *   2. (chỉ khi `theoTrangTruoc`) trang vừa rời trong cùng phiên — ghi bởi `GhiTrangTruoc`.
 *   3. `macDinh` — mở thẳng bằng đường dẫn, không có gì để lùi.
 *
 * Không dùng `document.referrer`: điều hướng trong app Next không đổi giá trị ấy.
 */

const KHOA_TRUOC = 'celes:trang-truoc';

const TEN_TRANG: [string, string][] = [
  ['/la-so', 'Về lá số'],
  ['/luan-giai/sau', 'Về luận giải chuyên sâu'],
  ['/luan-giai', 'Về khám phá chủ đề'],
  ['/home', 'Về trang Hôm nay'],
  ['/hoi-dap', 'Về Hỏi Celes'],
  ['/hanh-trinh', 'Về Hành trình'],
  ['/ho-so', 'Về danh sách lá số'],
  ['/hop-tuoi', 'Về Kết nối'],
];

/** Chỉ nhận đường nội bộ — `ve` đến từ URL, không được thành lối chuyển hướng ra ngoài */
export function duongVeHopLe(ve: string | null | undefined): string | null {
  return ve && ve.startsWith('/') && !ve.startsWith('//') && !ve.startsWith('/\\') ? ve : null;
}

/** Gắn `ve` vào một đường dẫn để trang đích biết đường về */
export function themVe(href: string, ve: string): string {
  return `${href}${href.includes('?') ? '&' : '?'}ve=${encodeURIComponent(ve)}`;
}

const nhanCho = (duong: string) =>
  TEN_TRANG.find(([p]) => duong === p || duong.startsWith(`${p}?`))?.[1] ?? 'Quay lại';

/**
 * Ghi lại trang đang đứng MỖI KHI bấm một liên kết nội bộ — kể cả tab đang mở
 * (tab ghi bằng replaceState nên location lúc bấm đã có `?tab=`). Gắn một lần ở layout.
 */
export function GhiTrangTruoc() {
  useEffect(() => {
    const ghi = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      const href = a?.getAttribute('href');
      // Bỏ qua chính nút quay lại: ghi đè ở pha bắt thì nút đọc ra đúng trang đang đứng
      if (!href || !duongVeHopLe(href) || a?.hasAttribute('data-quay-lai')) return;
      try {
        sessionStorage.setItem(KHOA_TRUOC, window.location.pathname + window.location.search);
      } catch {
        /* chế độ riêng tư chặn bộ nhớ: nút quay lại lùi về mặc định */
      }
    };
    document.addEventListener('click', ghi, true);
    return () => document.removeEventListener('click', ghi, true);
  }, []);
  return null;
}

type PropsQuayLai = {
  macDinh: { href: string; nhan: string };
  chiKhiCoVe?: boolean;
  theoTrangTruoc?: boolean;
  className?: string;
};

/** Bọc Suspense sẵn: đọc `?ve=` cần useSearchParams, trang tĩnh không bọc thì build hỏng */
export function QuayLai(p: PropsQuayLai) {
  return (
    <Suspense fallback={null}>
      <NutQuayLai {...p} />
    </Suspense>
  );
}

function NutQuayLai({
  macDinh,
  chiKhiCoVe = false,
  theoTrangTruoc = false,
  className = '',
}: {
  macDinh: { href: string; nhan: string };
  /** Trang gốc (có trên thanh điều hướng): chỉ hiện nút khi trang trước dặn đường về */
  chiKhiCoVe?: boolean;
  /** Không có `ve` thì về trang vừa rời (đăng nhập: bị chặn giữa chừng, về đúng chỗ đang đứng) */
  theoTrangTruoc?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const ve = duongVeHopLe(params.get('ve'));
  if (chiKhiCoVe && !ve) return null;

  return (
    <Link
      data-quay-lai
      href={ve ?? macDinh.href}
      onClick={(e) => {
        if (ve || !theoTrangTruoc) return;
        let truoc: string | null = null;
        try {
          truoc = duongVeHopLe(sessionStorage.getItem(KHOA_TRUOC));
        } catch {
          truoc = null;
        }
        if (truoc && truoc !== window.location.pathname + window.location.search) {
          e.preventDefault();
          router.push(truoc);
        }
      }}
      className={`link-text link-action inline-flex min-h-[44px] items-center gap-[8px] self-start text-[14px] ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {ve ? nhanCho(ve) : macDinh.nhan}
    </Link>
  );
}
