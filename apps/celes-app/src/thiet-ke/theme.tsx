import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { MAU_THEO_THEME, type BoMau, type TenTheme } from './token';

/**
 * Theme sáng/tối.
 *
 * Mặc định đi theo hệ điều hành; người dùng đổi được ở `Tôi → Cài đặt`, và lựa
 * chọn đó thắng cài đặt máy cho tới khi họ chọn lại "Theo máy".
 */

type LuaChon = 'tu-dong' | TenTheme;
const KHOA = 'celestia:theme';

interface BoiCanh {
  theme: TenTheme;
  luaChon: LuaChon;
  mau: BoMau;
  datTheme: (v: LuaChon) => void;
}

const Ctx = createContext<BoiCanh | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const cuaMay = useColorScheme();
  const [luaChon, setLuaChon] = useState<LuaChon>('tu-dong');

  useEffect(() => {
    AsyncStorage.getItem(KHOA)
      .then((v) => {
        if (v === 'sang' || v === 'toi' || v === 'tu-dong') setLuaChon(v);
      })
      .catch(() => {
        // Không đọc được kho cục bộ thì cứ theo máy, không làm hỏng luồng khởi động
      });
  }, []);

  const datTheme = useCallback((v: LuaChon) => {
    setLuaChon(v);
    AsyncStorage.setItem(KHOA, v).catch(() => {});
  }, []);

  const theme: TenTheme = luaChon === 'tu-dong' ? (cuaMay === 'dark' ? 'toi' : 'sang') : luaChon;

  return (
    <Ctx.Provider value={{ theme, luaChon, mau: MAU_THEO_THEME[theme], datTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): BoiCanh {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme phải nằm trong ThemeProvider');
  return c;
}

/** Lối tắt khi component chỉ cần bảng màu */
export function useMau(): BoMau {
  return useTheme().mau;
}
