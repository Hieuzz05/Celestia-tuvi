import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Pill } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT } from '@/i18n/context';
import { KHOANG } from '@/thiet-ke/token';
import type { GioiTinh } from '@tuvi/ansao';

/**
 * Bước 4 — giới tính.
 *
 * Cách tính truyền thống chia hai nhóm để xác định chiều đi của các giai đoạn,
 * nên đây là dữ liệu bắt buộc của engine. Giữ giao diện trung tính và ngắn, không
 * giải thích dài dòng ở đây — phần phương pháp nằm trong Cài đặt.
 */
export default function BuocGioiTinh() {
  const router = useRouter();
  const t = useT();
  const { banNhap, dat } = useBanNhap();

  return (
    <KhungBuoc
      buoc={4}
      tieuDe={t.onboarding.gioiTinhTieuDe}
      onTiep={() => router.push('/onboarding/ban-khoan')}
    >
      <View style={{ flexDirection: 'row', gap: KHOANG.x3 }}>
        {(
          [
            ['nam', t.onboarding.nam],
            ['nu', t.onboarding.nu],
          ] as [GioiTinh, string][]
        ).map(([gt, nhan]) => (
          <Pill
            key={gt}
            nhan={nhan}
            dangChon={banNhap.gioiTinh === gt}
            onPress={() => dat('gioiTinh', gt)}
            style={{ flex: 1, alignItems: 'center' }}
          />
        ))}
      </View>
    </KhungBuoc>
  );
}
