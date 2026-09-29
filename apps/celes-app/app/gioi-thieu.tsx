import { useRouter } from 'expo-router';
import { useId } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { BeMatKinh, Chu, Eyebrow, NenVung, NutChinh, NutChu } from '@/giao-dien/co-ban';
import { DauCelestia } from '@/giao-dien/icon';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { ChuCoNhan } from '@/giao-dien/khung-buoc';
import { useNgonNgu, useT } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Màn Chào — cửa vào của người dùng mới (Aurora bản 8, vùng Khởi đầu).
 *
 * Dấu thương hiệu lớn ở giữa với quầng sáng ấm, lời chào của Celes, ba dòng hứa
 * hẹn ngắn, rồi đúng một nút chính. Nền là nền đêm của vùng Khởi đầu (chân trời
 * ấm ở đáy) nên chữ lấy theo token theme như mọi màn khác.
 */

const QUANG = 200;

export default function ManGioiThieu() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('khoiDau');
  const { theme } = useTheme();
  const { ngonNgu, datNgonNgu } = useNgonNgu();
  const le = useSafeAreaInsets();
  const id = `chao-${useId().replace(/:/g, '')}`;

  const diem: [TenIcon, string][] = [
    ['clock', t.gioiThieu.diem1],
    ['sparkle', t.gioiThieu.diem2],
    ['compass', t.gioiThieu.diem3],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="khoiDau" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x4,
        }}
      >
        {/* Đổi ngôn ngữ ngay ở màn đầu — người đọc tiếng Anh không phải mò vào cài đặt */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: KHOANG.x1 }}>
          {(['vi', 'en'] as const).map((n) => (
            <NutChu
              key={n}
              nhan={n.toUpperCase()}
              mauChu={ngonNgu === n ? mau.chu : mau.chuNhat}
              onPress={() => datNgonNgu(n)}
              style={{ minWidth: 44, alignItems: 'center' }}
            />
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 22, paddingVertical: KHOANG.x4 }}>
          <View style={{ width: QUANG, height: QUANG, alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'toi' && (
              <Svg width={QUANG} height={QUANG} style={{ position: 'absolute' }}>
                <Defs>
                  <RadialGradient id={id} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={`rgb(${v.rgb})`} stopOpacity={0.22} />
                    <Stop offset="1" stopColor={`rgb(${v.rgb})`} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={QUANG / 2} cy={QUANG / 2} r={QUANG / 2} fill={`url(#${id})`} />
              </Svg>
            )}
            <DauCelestia size={136} />
          </View>

          <View style={{ gap: 10, alignItems: 'center' }}>
            <Eyebrow mauChu={v.mau}>{t.gioiThieu.eyebrow}</Eyebrow>
            <Chu kieu="displayXl" giua accessibilityRole="header">
              <ChuCoNhan chu={t.gioiThieu.tieuDe} vung="khoiDau" />
            </Chu>
            <Chu kieu="bodyLg" mo giua style={{ maxWidth: 320 }}>
              {t.gioiThieu.moTa}
            </Chu>
          </View>

          <View style={{ alignSelf: 'stretch', gap: KHOANG.x2, marginTop: 6 }}>
            {diem.map(([icon, chu]) => (
              <BeMatKinh
                key={chu}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: KHOANG.x3,
                }}
              >
                <Icon ten={icon} size={18} net={2} mau={v.mau} />
                <Chu kieu="bodySm" style={{ flex: 1, fontFamily: FONT.thanVua }}>
                  {chu}
                </Chu>
              </BeMatKinh>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: LE_NGANG, paddingBottom: le.bottom + KHOANG.x4, gap: KHOANG.x1 }}>
        <NutChinh nhan={t.gioiThieu.ctaChinh} onPress={() => router.push('/onboarding/ten')} />
        <NutChu
          nhan={t.gioiThieu.ctaPhu}
          onPress={() => router.push('/dang-ky')}
          style={{ alignItems: 'center' }}
        />
      </View>
    </View>
  );
}
