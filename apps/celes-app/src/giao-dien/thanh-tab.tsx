import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrbCeles } from '@/giao-dien/co-ban';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { useT } from '@/i18n/context';
import { useMau, useTheme } from '@/thiet-ke/theme';
import { FONT, THANH_TAB, VUNG, VUNG_SANG, type TenVung } from '@/thiet-ke/token';

/**
 * Thanh tab nổi của hệ Aurora: một viên bo 24 cách đáy 22, năm ô bằng nhau,
 * Celes ở giữa là quả cầu 50px nhô lên 18px.
 *
 * Tab đang chọn: icon nằm trong viên 44×30 màu vùng của tab đó, nhãn đậm. Nhờ
 * vậy người dùng biết mình ở vùng nào mà không cần đọc tiêu đề.
 *
 * Tài khoản KHÔNG còn là tab (29/09/2026) — mở từ ảnh đại diện góc phải-trên.
 */

/** Kiểu props của thanh tab — expo-router gói sẵn react-navigation nên lấy từ chính Tabs */
export type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB: Record<string, { icon: TenIcon | null; vung: TenVung }> = {
  index: { icon: 'sun', vung: 'homNay' },
  'la-so': { icon: 'laso', vung: 'laSo' },
  celes: { icon: null, vung: 'celes' },
  'hanh-trinh': { icon: 'path', vung: 'hanhTrinh' },
  'ket-noi': { icon: 'rel', vung: 'moiQuanHe' },
};

export function ThanhTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const mau = useMau();
  const { theme } = useTheme();
  const t = useT();
  const le = useSafeAreaInsets();
  const toi = theme === 'toi';

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t.tab.dieuHuong}
      style={{
        position: 'absolute',
        left: THANH_TAB.le,
        right: THANH_TAB.le,
        bottom: Math.max(le.bottom - 8, 0) + THANH_TAB.cachDay - (le.bottom > 0 ? 8 : 0),
        height: THANH_TAB.cao,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: mau.vienTab,
        backgroundColor: mau.thanhTab,
        flexDirection: 'row',
        shadowColor: toi ? '#000000' : '#6B0A6E',
        shadowOpacity: toi ? 0.6 : 0.16,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 18 },
        elevation: 12,
      }}
    >
      {state.routes.map((route, i) => {
        const cauHinh = TAB[route.name];
        if (!cauHinh) return null;
        const dangChon = state.index === i;
        const { options } = descriptors[route.key];
        const nhan = typeof options.title === 'string' ? options.title : route.name;
        const vung = toi ? VUNG[cauHinh.vung] : VUNG_SANG;

        const bam = () => {
          const suKien = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!dangChon && !suKien.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        const chu = (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: dangChon ? FONT.thanRatDam : FONT.thanVua,
              fontSize: 11,
              lineHeight: 14,
              color: dangChon ? mau.chu : mau.tabTat,
            }}
          >
            {nhan}
          </Text>
        );

        return (
          <Pressable
            key={route.key}
            onPress={bam}
            accessibilityRole="tab"
            accessibilityState={{ selected: dangChon }}
            accessibilityLabel={nhan}
            style={{ flex: 1, height: THANH_TAB.cao, alignItems: 'center', justifyContent: cauHinh.icon ? 'center' : 'flex-end', gap: 3, paddingBottom: cauHinh.icon ? 0 : 9 }}
          >
            {cauHinh.icon ? (
              <>
                <View
                  style={{
                    width: 44,
                    height: 30,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: dangChon ? (toi ? `rgba(${vung.rgb},0.16)` : 'rgba(211,34,152,0.10)') : 'transparent',
                  }}
                >
                  <Icon ten={cauHinh.icon} size={22} net={dangChon ? 1.9 : 1.75} mau={dangChon ? vung.mau : mau.tabTat} />
                </View>
                {chu}
              </>
            ) : (
              <>
                {/* Orb nhô lên khỏi thanh; vòng ngoài màu nền tách nó khỏi viền thanh */}
                <View
                  style={{
                    position: 'absolute',
                    top: -THANH_TAB.orbNho,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: mau.nen,
                  }}
                >
                  {dangChon ? (
                    <LinearGradient
                      colors={[VUNG.celes.mau, '#D32298']}
                      style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: mau.nen, alignItems: 'center', justifyContent: 'center' }}>
                        <OrbCeles size={46} />
                      </View>
                    </LinearGradient>
                  ) : (
                    <OrbCeles size={50} tho={false} />
                  )}
                </View>
                {chu}
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
