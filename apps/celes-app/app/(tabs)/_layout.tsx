import { Tabs } from 'expo-router';
import { ThanhTab } from '@/giao-dien/thanh-tab';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';

/**
 * Điều hướng đáy — đúng năm tab, không hơn (hệ Aurora, 29/09/2026):
 * Hôm nay · Lá số · Celes · Hành trình · Mối quan hệ.
 *
 * Celes nằm giữa và là tab chữ ký. Tài khoản mở từ ảnh đại diện góc phải-trên
 * (`app/toi.tsx`), không chiếm một ô tab. Những khái niệm của web như "Luận giải
 * chi tiết", "Hỏi đáp", "Hồ sơ", "Quản trị" KHÔNG xuất hiện ở đây.
 */
export default function KhungTab() {
  const mau = useMau();
  const t = useT();

  return (
    <Tabs
      tabBar={(p) => <ThanhTab {...p} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: mau.nen },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tab.homNay }} />
      <Tabs.Screen name="la-so" options={{ title: t.tab.laSo }} />
      <Tabs.Screen name="celes" options={{ title: t.tab.celes }} />
      <Tabs.Screen name="hanh-trinh" options={{ title: t.tab.hanhTrinh }} />
      <Tabs.Screen name="ket-noi" options={{ title: t.tab.ketNoi }} />
    </Tabs>
  );
}
