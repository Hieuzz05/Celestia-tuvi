import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en } from './en';
import { vi, type TuDienApp } from './vi';

/**
 * Ngôn ngữ VI/EN.
 *
 * Quy tắc theo spec: lần chạy đầu đọc locale máy — máy tiếng Việt thì VI, còn
 * lại EN. Người dùng đổi được ở `Tôi → Ngôn ngữ`, và lựa chọn đó được nhớ, thắng
 * locale máy về sau.
 */

export type NgonNgu = 'vi' | 'en';

const KHOA = 'celestia:ngon-ngu';
const TU_DIEN: Record<NgonNgu, TuDienApp> = { vi, en };

interface BoiCanh {
  ngonNgu: NgonNgu;
  t: TuDienApp;
  datNgonNgu: (n: NgonNgu) => void;
}

const Ctx = createContext<BoiCanh | null>(null);

function doanTuMay(): NgonNgu {
  try {
    const ma = getLocales()[0]?.languageCode?.toLowerCase();
    return ma === 'vi' ? 'vi' : 'en';
  } catch {
    return 'vi';
  }
}

export function NgonNguProvider({ children }: { children: ReactNode }) {
  const [ngonNgu, setNgonNgu] = useState<NgonNgu>(doanTuMay);

  useEffect(() => {
    AsyncStorage.getItem(KHOA)
      .then((v) => {
        if (v === 'vi' || v === 'en') setNgonNgu(v);
      })
      .catch(() => {
        // Không đọc được kho cục bộ thì giữ nguyên phán đoán từ locale máy
      });
  }, []);

  const datNgonNgu = useCallback((n: NgonNgu) => {
    setNgonNgu(n);
    AsyncStorage.setItem(KHOA, n).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ ngonNgu, t: TU_DIEN[ngonNgu], datNgonNgu }}>{children}</Ctx.Provider>
  );
}

export function useNgonNgu(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useNgonNgu phải nằm trong NgonNguProvider');
  return c;
}

export function useT(): TuDienApp {
  return useNgonNgu().t;
}

/** Thay {khoa} trong chuỗi bằng giá trị thật */
export function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? `{${k}}`));
}
