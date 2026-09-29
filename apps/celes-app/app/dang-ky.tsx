import { useRouter } from 'expo-router';
import { useId } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { BeMatKinh, Chu, Eyebrow, NenVung, NutChinh, NutChu } from '@/giao-dien/co-ban';
import { DauCelestia } from '@/giao-dien/icon';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { ChuCoNhan } from '@/giao-dien/khung-buoc';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { useT } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Đăng ký mềm — xuất hiện SAU khi người dùng đã đọc Quick Read (Aurora bản 8,
 * vùng Khởi đầu).
 *
 * "Để sau" luôn có mặt và luôn đi tiếp được. Spec cấm chặn trải nghiệm giá trị
 * đầu tiên sau tài khoản, nên màn này là lời mời, không phải cổng.
 *
 * Từ 28/09/2026 chỉ có email (mã 6 số). Nút Apple/Google ĐÃ GỠ: trước đó chúng
 * chỉ lặng lẽ "để sau", người dùng tưởng đã đăng nhập rồi mới bị Celes chặn.
 * Thêm lại khi nối thật — cần khoá OAuth riêng cho app (Google Cloud; Apple cần
 * tài khoản Developer). Khoá i18n `apple`/`google` giữ sẵn cho lúc đó.
 */

const QUANG = 140;

export default function ManDangKy() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('khoiDau');
  const { theme } = useTheme();
  const le = useSafeAreaInsets();
  const { coTaiKhoan } = useTaiKhoan();
  const id = `dk-${useId().replace(/:/g, '')}`;

  const deSau = () => router.replace('/(tabs)');

  const diem: [TenIcon, string][] = [
    ['clock', t.dangKy.diem1],
    ['heart', t.dangKy.diem2],
    ['sparkle', t.dangKy.diem3],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="khoiDau" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: le.top + KHOANG.x8,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x4,
          gap: KHOANG.x5,
        }}
      >
        <View style={{ width: QUANG, height: QUANG, alignItems: 'center', justifyContent: 'center', marginLeft: -24 }}>
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
          <DauCelestia size={72} />
        </View>

        <View style={{ gap: 10 }}>
          <Eyebrow mauChu={v.mau}>{t.dangKy.eyebrow}</Eyebrow>
          <Chu kieu="display" accessibilityRole="header">
            <ChuCoNhan chu={t.dangKy.tieuDe} vung="khoiDau" />
          </Chu>
          <Chu kieu="body" mo>
            {t.dangKy.moTa}
          </Chu>
        </View>

        <View style={{ gap: KHOANG.x2 }}>
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
      </ScrollView>

      <View style={{ paddingHorizontal: LE_NGANG, paddingBottom: le.bottom + KHOANG.x4, gap: KHOANG.x1 }}>
        {coTaiKhoan && (
          <NutChinh nhan={t.dangKy.email} onPress={() => router.push('/dang-nhap')} />
        )}
        <NutChu nhan={t.chung.deSau} mauChu={mau.chuMo} onPress={deSau} style={{ alignItems: 'center' }} />
      </View>
    </View>
  );
}
