import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Newsreader_400Regular_Italic, Newsreader_500Medium_Italic } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BanNhapProvider } from '@/du-lieu/ban-nhap';
import { HoSoProvider } from '@/du-lieu/ho-so';
import { TaiKhoanProvider } from '@/du-lieu/tai-khoan';
import { NgonNguProvider } from '@/i18n/context';
import { ThemeProvider, useMau, useTheme } from '@/thiet-ke/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Vỏ ngoài của toàn app: nạp font, dựng các lớp bối cảnh, đặt màu thanh trạng thái.
 *
 * Thứ tự lồng nhau có ý nghĩa — hồ sơ cần biết ngôn ngữ hiện tại để dựng góc nhìn
 * đúng thứ tiếng, nên NgonNguProvider phải nằm ngoài HoSoProvider.
 */
export default function VoNgoai() {
  const [fontXong] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium_Italic,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontXong) SplashScreen.hideAsync().catch(() => {});
  }, [fontXong]);

  if (!fontXong) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NgonNguProvider>
            <TaiKhoanProvider>
              <HoSoProvider>
                <BanNhapProvider>
                  <ThanhTrangThai />
                  <KhungStack />
                </BanNhapProvider>
              </HoSoProvider>
            </TaiKhoanProvider>
          </NgonNguProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Nền của Stack theo theme — không để lộ nền trắng mặc định khi chuyển màn */
function KhungStack() {
  const mau = useMau();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: mau.nen },
      }}
    />
  );
}

function ThanhTrangThai() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'toi' ? 'light' : 'dark'} />;
}
