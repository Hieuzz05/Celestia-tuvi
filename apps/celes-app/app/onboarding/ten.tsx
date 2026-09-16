import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chu, ONhap } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT } from '@/i18n/context';
import { KHOANG } from '@/thiet-ke/token';

/** Bước 1 — tên gọi. Chưa hỏi email ở đây: đó là rào cản, không phải làm quen. */
export default function BuocTen() {
  const router = useRouter();
  const t = useT();
  const { banNhap, dat } = useBanNhap();

  return (
    <KhungBuoc
      buoc={1}
      tieuDe={t.onboarding.tenTieuDe}
      onTiep={() => router.push('/onboarding/ngay-sinh')}
      choPhepTiep={banNhap.ten.trim().length > 0}
    >
      <View style={{ gap: KHOANG.x2 }}>
        <ONhap
          value={banNhap.ten}
          onChangeText={(v) => dat('ten', v)}
          placeholder={t.onboarding.tenNhan}
          autoFocus
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel={t.onboarding.tenNhan}
        />
        <Chu kieu="caption" mo>
          {t.onboarding.tenGoiY}
        </Chu>
      </View>
    </KhungBuoc>
  );
}
