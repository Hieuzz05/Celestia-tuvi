'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n/context';
import type { TuDien } from '@/lib/i18n/vi';

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

const TEN_TRANG: [string, keyof TuDien['veTrang']][] = [
  ['/la-so', 'laSo'],
  ['/luan-giai/sau', 'luanSau'],
  ['/luan-giai', 'luanGiai'],
  ['/home', 'home'],
  ['/hoi-dap', 'hoiDap'],
  ['/hanh-trinh', 'hanhTrinh'],
  ['/ho-so', 'hoSo'],
  ['/hop-tuoi', 'hopTuoi'],
];

/** Chỉ nhận đường nội bộ — `ve` đến từ URL, không được thành lối chuyển hướng ra ngoài */
export function duongVeHopLe(ve: string | null | undefined): string | null {
  return ve && ve.startsWith('/') && !ve.startsWith('//') && !ve.startsWith('/\\') ? ve : null;
}

/** Gắn `ve` vào một đường dẫn để trang đích biết đường về */
export function themVe(href: string, ve: string): string {
  return `${href}${href.includes('?') ? '&' : '?'}ve=${encodeURIComponent(ve)}`;
}

/** Nhãn theo trang đích, theo ngôn ngữ đang chọn; trang lạ thì "Quay lại" */
const nhanCho = (duong: string, t: TuDien) => {
  const khoa = TEN_TRANG.find(([p]) => duong === p || duong.startsWith(`${p}?`))?.[1];
  return khoa ? t.veTrang[khoa] : t.chung.quayLai;
};

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
  macDinh: { href: string };
  chiKhiCoVe?: boolean;
  theoTrangTruoc?: boolean;
  className?: string;
};

/**
 * Bọc Suspense sẵn: đọc `?ve=` cần useSearchParams, trang tĩnh không bọc thì build hỏng.
 *
 * Fallback là CHÍNH cái nút với đích mặc định, không phải `null`: HTML tĩnh chỉ chứa
 * fallback, nên `null` nghĩa là nút hiện ra sau khi JS chạy và đẩy cả trang xuống 60px
 * (đo 27/09/2026 trên /dang-nhap: CLS 0,058 chỉ từ nút này). Nút `chiKhiCoVe` thì
 * mặc định vốn không hiện nên fallback rỗng là đúng.
 */
export function QuayLai(p: PropsQuayLai) {
  const t = useT();
  return (
    <Suspense fallback={p.chiKhiCoVe ? null : <LienKetQuayLai href={p.macDinh.href} nhan={nhanCho(p.macDinh.href, t)} className={p.className} />}>
      <NutQuayLai {...p} />
    </Suspense>
  );
}

function LienKetQuayLai({
  href,
  nhan,
  className = '',
  onClick,
}: {
  href: string;
  nhan: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      data-quay-lai
      href={href}
      onClick={onClick}
      className={`link-text link-action inline-flex min-h-[44px] items-center gap-[8px] self-start text-[14px] ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {nhan}
    </Link>
  );
}

function NutQuayLai({
  macDinh,
  chiKhiCoVe = false,
  theoTrangTruoc = false,
  className = '',
}: {
  macDinh: { href: string };
  /** Trang gốc (có trên thanh điều hướng): chỉ hiện nút khi trang trước dặn đường về */
  chiKhiCoVe?: boolean;
  /** Không có `ve` thì về trang vừa rời (đăng nhập: bị chặn giữa chừng, về đúng chỗ đang đứng) */
  theoTrangTruoc?: boolean;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const ve = duongVeHopLe(params.get('ve'));
  if (chiKhiCoVe && !ve) return null;

  return (
    <LienKetQuayLai
      href={ve ?? macDinh.href}
      nhan={nhanCho(ve ?? macDinh.href, t)}
      className={className}
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
    />
  );
}
