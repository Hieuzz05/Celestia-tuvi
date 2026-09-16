'use client';

import { useEffect, useRef, useState } from 'react';
import { useNgonNgu, type NgonNgu } from '@/lib/i18n/context';

const NHAN: Record<NgonNgu, string> = { vi: 'VI', en: 'EN' };
const TEN_DAY_DU: Record<NgonNgu, string> = { vi: 'Tiếng Việt', en: 'English' };

/**
 * Nút đổi ngôn ngữ: icon quả địa cầu + mã hiện tại, bấm ra danh sách.
 *
 * Brand spec nói rõ không dùng checkbox — checkbox diễn đạt bật/tắt, mà đây là
 * chọn một trong nhiều, và sau này còn thêm ngôn ngữ nữa.
 */
export function ChuyenNgonNgu() {
  const { ngonNgu, datNgonNgu, t } = useNgonNgu();
  const [mo, setMo] = useState(false);
  const boc = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mo) return;
    const dong = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener('mousedown', dong);
    return () => document.removeEventListener('mousedown', dong);
  }, [mo]);

  return (
    <div className="relative" ref={boc}>
      <button
        onClick={() => setMo((v) => !v)}
        className="pill-tag flex items-center gap-[6px]"
        aria-label={t.nav.ngonNgu}
        aria-expanded={mo}
        aria-haspopup="menu"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
        </svg>
        {NHAN[ngonNgu]}
      </button>

      {mo && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 flex min-w-[160px] flex-col gap-[2px] rounded-[var(--radius-cards)] p-[8px]"
          style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-elevated)' }}
        >
          {(['vi', 'en'] as NgonNgu[]).map((n) => (
            <button
              key={n}
              role="menuitemradio"
              aria-checked={n === ngonNgu}
              onClick={() => {
                datNgonNgu(n);
                setMo(false);
              }}
              className="link-text rounded-[var(--radius-buttons)] px-[10px] py-[8px] text-left"
              data-active={n === ngonNgu}
            >
              {TEN_DAY_DU[n]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
