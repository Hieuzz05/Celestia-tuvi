import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NenGradient, NutChinh, NutChu } from '@/giao-dien/co-ban';
import { LogoCelestia } from '@/giao-dien/icon';
import { useNgonNgu, useT } from '@/i18n/context';
import { BANG_MAU, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Màn giới thiệu thương hiệu — cửa vào của người dùng mới.
 *
 * Nền gradient chữ ký phủ toàn màn, và vì gradient là bề mặt SÁNG cố định ở cả
 * hai theme nên mọi chữ ở đây dùng thẳng màu mực Aubergine, không lấy theo token
 * theme. Nếu lấy theo theme thì ở chế độ tối chữ trắng sẽ rơi xuống nền vàng.
 */
export default function ManGioiThieu() {
  const router = useRouter();
  const t = useT();
  const { ngonNgu, datNgonNgu } = useNgonNgu();
  const le = useSafeAreaInsets();

  const muc = BANG_MAU.aubergine;

  return (
    <NenGradient style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingTop: le.top + KHOANG.x4,
          paddingBottom: le.bottom + KHOANG.x6,
          paddingHorizontal: LE_NGANG,
        }}
      >
        {/* Đổi ngôn ngữ ngay ở màn đầu — người đọc tiếng Anh không phải mò vào cài đặt */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: KHOANG.x2 }}>
          {(['vi', 'en'] as const).map((n) => (
            <NutChu
              key={n}
              nhan={n.toUpperCase()}
              mauChu={muc}
              onPress={() => datNgonNgu(n)}
              style={{ opacity: ngonNgu === n ? 1 : 0.45, paddingHorizontal: KHOANG.x2 }}
            />
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: KHOANG.x6 }}>
          <LogoCelestia size={20} mau={muc} />

          <View style={{ gap: KHOANG.x4 }}>
            <Eyebrow mauChu={muc}>{t.gioiThieu.eyebrow}</Eyebrow>
            <Chu kieu="display" style={{ color: muc }}>
              {t.gioiThieu.tieuDe}
            </Chu>
            <Chu kieu="bodyLg" style={{ color: muc, opacity: 0.85 }}>
              {t.gioiThieu.moTa}
            </Chu>
          </View>
        </View>

        <View style={{ gap: KHOANG.x3 }}>
          <NutChinh nhan={t.gioiThieu.ctaChinh} onPress={() => router.push('/onboarding/ten')} />
          <NutChu
            nhan={t.gioiThieu.ctaPhu}
            mauChu={muc}
            onPress={() => router.push('/dang-ky')}
            style={{ alignItems: 'center' }}
          />
          <Chu kieu="caption" giua style={{ color: muc, opacity: 0.7 }}>
            {t.gioiThieu.chanTrang}
          </Chu>
        </View>
      </View>
    </NenGradient>
  );
}
