'use client';

import { useEffect, useState } from 'react';
import { IconMatTrang, IconMatTroi } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

export type Theme = 'day' | 'night';
export const KHOA_THEME = 'tuvi-ai:theme';

function apDung(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
}

function docTheme(): Theme {
  let luu: Theme | null = null;
  try {
    luu = window.localStorage.getItem(KHOA_THEME) as Theme | null;
  } catch {
    // Chế độ riêng tư chặn localStorage — rơi về theme đang gắn trên trang
  }
  return luu ?? (document.documentElement.getAttribute('data-theme') as Theme) ?? 'day';
}

export function ThemeToggle() {
  const t = useT();
  // Design system gốc là theme sáng nên Ngày là mặc định
  const [theme, setTheme] = useState<Theme>('day');

  // Đọc tách khỏi setState, đặt state trong .then (mẫu chữa set-state-in-effect, AGENTS.md)
  useEffect(() => {
    Promise.resolve(docTheme()).then(setTheme);
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
      className="pill-tag flex items-center gap-[8px]"
      aria-label={theme === 'night' ? t.nav.cheDoSang : t.nav.cheDoToi}
      title={theme === 'night' ? t.nav.cheDoSang : t.nav.cheDoToi}
    >
      {theme === 'night' ? <IconMatTroi size={14} /> : <IconMatTrang size={14} />}
      <span>{theme === 'night' ? t.nav.cheDoSang : t.nav.cheDoToi}</span>
    </button>
  );
}
