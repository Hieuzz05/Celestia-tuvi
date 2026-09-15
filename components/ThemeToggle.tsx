'use client';

import { useEffect, useState } from 'react';

export type Theme = 'day' | 'night';
export const KHOA_THEME = 'tuvi-ai:theme';

function apDung(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('night');

  useEffect(() => {
    const luu = window.localStorage.getItem(KHOA_THEME) as Theme | null;
    setTheme(luu ?? (document.documentElement.getAttribute('data-theme') as Theme) ?? 'night');
  }, []);

  const doi = () => {
    const moi: Theme = theme === 'night' ? 'day' : 'night';
    setTheme(moi);
    apDung(moi);
    try {
      window.localStorage.setItem(KHOA_THEME, moi);
    } catch {
      // Chế độ riêng tư chặn localStorage — vẫn đổi được trong phiên hiện tại
    }
  };

  return (
    <button
      onClick={doi}
      className="pill-tag flex items-center gap-[6px]"
      aria-label={theme === 'night' ? 'Chuyển sang chế độ ngày' : 'Chuyển sang chế độ đêm'}
      title={theme === 'night' ? 'Chế độ ngày' : 'Chế độ đêm'}
    >
      {theme === 'night' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.3 8.3 0 1 0 10.5 10.5Z" />
        </svg>
      )}
      <span>{theme === 'night' ? 'Ngày' : 'Đêm'}</span>
    </button>
  );
}
