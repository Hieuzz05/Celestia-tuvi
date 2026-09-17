'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NutChinh, NutVien } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Chặn việc rời trang khi lá số vừa lập chưa được lưu (spec v4 mục 13A).
 *
 * App Router không phát sự kiện điều hướng nào để hook vào, nên chặn ở chỗ
 * người dùng thực sự bấm: bắt click trên các liên kết nội bộ ở giai đoạn
 * capture, chặn lại, hỏi, rồi mới đi tiếp. Kèm `beforeunload` cho trường hợp
 * đóng tab hoặc tải lại trang — trình duyệt tự hiện hộp thoại của nó ở đó.
 *
 * Nút quay lại của trình duyệt không chặn được bằng cách này mà không giở trò
 * với history; lá số vẫn nằm trong bối cảnh phiên nên quay lại cũng không mất,
 * chỉ là không có lời nhắc.
 */
export function CanhBaoRoiTrang({
  bat,
  daDangNhap,
  onLuu,
  duongDangNhap,
}: {
  /** Chỉ chặn khi thực sự có lá số chưa lưu */
  bat: boolean;
  daDangNhap: boolean;
  /** Lưu lá số; trả về true nếu lưu xong */
  onLuu: () => Promise<boolean>;
  /** Nơi đưa khách tới để đăng nhập rồi lưu */
  duongDangNhap: string;
}) {
  const t = useT();
  const router = useRouter();
  const [dich, setDich] = useState<string | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!bat) return;

    const nhacTruocKhiDong = (e: BeforeUnloadEvent) => e.preventDefault();

    const batClick = (e: MouseEvent) => {
      // Chuột giữa, Ctrl/Cmd+click mở tab mới — không phải rời trang, đừng chặn
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;

      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a) return;

      const href = a.getAttribute('href');
      if (!href || !href.startsWith('/') || a.target === '_blank') return;
      if (href.startsWith('/la-so')) return;

      e.preventDefault();
      setDich(href);
    };

    window.addEventListener('beforeunload', nhacTruocKhiDong);
    document.addEventListener('click', batClick, true);
    return () => {
      window.removeEventListener('beforeunload', nhacTruocKhiDong);
      document.removeEventListener('click', batClick, true);
    };
  }, [bat]);

  if (!dich) return null;

  const diTiep = () => {
    const den = dich;
    setDich(null);
    router.push(den);
  };

  const luuRoiDi = async () => {
    setDangLuu(true);
    const xong = await onLuu();
    setDangLuu(false);
    if (xong) diTiep();
  };

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-[24px]"
      style={{ background: 'rgba(36, 0, 41, 0.55)' }}
    >
      <div
        className="flex w-full max-w-[460px] flex-col gap-[16px] rounded-[var(--radius-cards)] p-[28px]"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-elevated)' }}
      >
        <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
          {daDangNhap ? t.giuLaSo.tieuDeDaDangNhap : t.giuLaSo.tieuDeKhach}
        </h2>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {daDangNhap ? t.giuLaSo.moTaDaDangNhap : t.giuLaSo.moTaKhach}
        </p>

        <div className="flex flex-wrap items-center gap-[12px]">
          {daDangNhap ? (
            <NutChinh onClick={luuRoiDi} disabled={dangLuu}>
              {dangLuu ? t.giuLaSo.dangLuu : t.giuLaSo.luu}
            </NutChinh>
          ) : (
            <NutChinh
              onClick={() => {
                setDich(null);
                router.push(duongDangNhap);
              }}
            >
              {t.giuLaSo.dangNhapDeLuu}
            </NutChinh>
          )}
          <NutVien nho onClick={diTiep}>
            {t.giuLaSo.roiDi}
          </NutVien>
          <button onClick={() => setDich(null)} className="link-text">
            {t.giuLaSo.oLai}
          </button>
        </div>
      </div>
    </div>
  );
}
