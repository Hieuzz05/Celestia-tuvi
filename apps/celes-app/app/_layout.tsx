// Nhập TỪNG độ đậm theo đường dẫn con: nhập từ gốc gói kéo mọi độ đậm (hàng
// chục tệp .ttf) vào gói cài đặt dù chỉ dùng vài cái.
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader/400Regular_Italic';
import { Newsreader_500Medium_Italic } from '@expo-google-fonts/newsreader/500Medium_Italic';
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
