import { useRouter } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, NutChinh, NutChu, NutPhu } from '@/giao-dien/co-ban';
import { DauCelestia } from '@/giao-dien/icon';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Đăng ký mềm — xuất hiện SAU khi người dùng đã đọc Quick Read.
 *
 * "Để sau" luôn có mặt và luôn đi tiếp được. Spec cấm chặn trải nghiệm giá trị
 * đầu tiên sau tài khoản, nên màn này là lời mời, không phải cổng.
 *
 * Các nút mạng xã hội hiện chưa nối — nối thật cần Supabase Auth cùng khoá OAuth
 * riêng cho ứng dụng di động, là việc cấu hình phía người vận hành.
 */
export default function ManDangKy() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();

  const deSau = () => router.replace('/(tabs)');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: mau.nen,
        paddingTop: le.top + KHOANG.x10,
        paddingBottom: le.bottom + KHOANG.x4,
        paddingHorizontal: LE_NGANG,
      }}
    >
      <View style={{ flex: 1, gap: KHOANG.x5 }}>
        <DauCelestia size={44} />
        <Chu kieu="h1">{t.dangKy.tieuDe}</Chu>
        <Chu kieu="body" mo>
          {t.dangKy.moTa}
        </Chu>
      </View>

      <View style={{ gap: KHOANG.x3 }}>
        {Platform.OS === 'ios' && <NutChinh nhan={t.dangKy.apple} onPress={deSau} />}
        {Platform.OS === 'ios' ? (
          <NutPhu nhan={t.dangKy.google} onPress={deSau} />
        ) : (
          <NutChinh nhan={t.dangKy.google} onPress={deSau} />
        )}
        <NutPhu nhan={t.dangKy.email} onPress={deSau} />
        <NutChu
          nhan={t.chung.deSau}
          mauChu={mau.chuMo}
          onPress={deSau}
          style={{ alignItems: 'center' }}
        />
      </View>
    </View>
  );
}
