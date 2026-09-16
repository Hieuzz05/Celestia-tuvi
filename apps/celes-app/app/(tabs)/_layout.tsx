import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  IconCeles,
  IconHanhTrinh,
  IconHomNay,
  IconKetNoi,
  IconToi,
} from '@/giao-dien/icon';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { FONT } from '@/thiet-ke/token';

/**
 * Điều hướng đáy — đúng năm tab, không hơn.
 *
 * Celes nằm giữa và là tab chữ ký. Những khái niệm của web như "Luận giải chi
 * tiết", "Hỏi đáp", "Hồ sơ", "Quản trị" KHÔNG xuất hiện ở đây; chúng được sắp
 * lại vào bên trong các tab này.
 */
export default function KhungTab() {
  const mau = useMau();
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: mau.chu,
        tabBarInactiveTintColor: mau.chuNhat,
        tabBarStyle: {
          backgroundColor: mau.nen,
          borderTopColor: mau.vien,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONT.than,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tab.homNay,
          tabBarIcon: ({ color }) => <IconHomNay size={24} mau={color} />,
        }}
      />
      <Tabs.Screen
        name="hanh-trinh"
        options={{
          title: t.tab.hanhTrinh,
          tabBarIcon: ({ color }) => <IconHanhTrinh size={24} mau={color} />,
        }}
      />
      <Tabs.Screen
        name="celes"
        options={{
          title: t.tab.celes,
          // Tab chữ ký được nhấn bằng màu hành động khi đang mở
          tabBarIcon: ({ color, focused }) => (
            <IconCeles size={26} mau={focused ? mau.hanhDong : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ket-noi"
        options={{
          title: t.tab.ketNoi,
          tabBarIcon: ({ color }) => <IconKetNoi size={24} mau={color} />,
        }}
      />
      <Tabs.Screen
        name="toi"
        options={{
          title: t.tab.toi,
          tabBarIcon: ({ color }) => <IconToi size={24} mau={color} />,
        }}
      />
    </Tabs>
  );
}
