import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, NutChinh, NutChu } from '@/giao-dien/co-ban';
import { DauCelestia } from '@/giao-dien/icon';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Đăng ký mềm — xuất hiện SAU khi người dùng đã đọc Quick Read.
 *
 * "Để sau" luôn có mặt và luôn đi tiếp được. Spec cấm chặn trải nghiệm giá trị
 * đầu tiên sau tài khoản, nên màn này là lời mời, không phải cổng.
 *
 * Từ 28/09/2026 chỉ có email (mã 6 số). Nút Apple/Google ĐÃ GỠ: trước đó chúng
 * chỉ lặng lẽ "để sau", người dùng tưởng đã đăng nhập rồi mới bị Celes chặn.
 * Thêm lại khi nối thật — cần khoá OAuth riêng cho app (Google Cloud; Apple cần
 * tài khoản Developer). Khoá i18n `apple`/`google` giữ sẵn cho lúc đó.
 */
export default function ManDangKy() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { coTaiKhoan } = useTaiKhoan();

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
        {coTaiKhoan && (
          <NutChinh nhan={t.dangKy.email} onPress={() => router.push('/dang-nhap')} />
        )}
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
