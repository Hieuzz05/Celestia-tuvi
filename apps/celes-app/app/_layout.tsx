import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { InterTight_600SemiBold, InterTight_700Bold } from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BanNhapProvider } from '@/du-lieu/ban-nhap';
import { HoSoProvider } from '@/du-lieu/ho-so';
import { NgonNguProvider } from '@/i18n/context';
import { ThemeProvider, useTheme } from '@/thiet-ke/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Vỏ ngoài của toàn app: nạp font, dựng các lớp bối cảnh, đặt màu thanh trạng thái.
 *
 * Thứ tự lồng nhau có ý nghĩa — hồ sơ cần biết ngôn ngữ hiện tại để dựng góc nhìn
 * đúng thứ tiếng, nên NgonNguProvider phải nằm ngoài HoSoProvider.
 */
export default function VoNgoai() {
  const [fontXong] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InterTight_600SemiBold,
    InterTight_700Bold,
    JetBrainsMono_400Regular,
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
            <HoSoProvider>
              <BanNhapProvider>
                <ThanhTrangThai />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                />
              </BanNhapProvider>
            </HoSoProvider>
          </NgonNguProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThanhTrangThai() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'toi' ? 'light' : 'dark'} />;
}
