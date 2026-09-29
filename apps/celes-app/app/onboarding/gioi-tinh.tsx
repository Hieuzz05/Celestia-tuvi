import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { KhungBuoc, OChon } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { dien, useT } from '@/i18n/context';
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
  const ten = banNhap.ten.trim() || t.onboarding.banMacDinh;

  return (
    <KhungBuoc
      buoc={4}
      eyebrow={dien(t.onboarding.gioiTinhEyebrow, { ten })}
      tieuDe={t.onboarding.gioiTinhTieuDe}
      moTa={t.onboarding.gioiTinhMoTa}
      onTiep={() => router.push('/onboarding/ban-khoan')}
    >
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
        {(
          [
            ['nam', t.onboarding.nam],
            ['nu', t.onboarding.nu],
          ] as [GioiTinh, string][]
        ).map(([gt, nhan]) => (
          <OChon
            key={gt}
            nhan={nhan}
            nhanLon
            cao={120}
            dangChon={banNhap.gioiTinh === gt}
            onPress={() => dat('gioiTinh', gt)}
            style={{ flex: 1 }}
          />
        ))}
      </View>
    </KhungBuoc>
  );
}
