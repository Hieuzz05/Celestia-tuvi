import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, NutChinh, NutChu } from '@/giao-dien/co-ban';
import { TheGocNhin } from '@/giao-dien/the-goc-nhin';
import { MAU_LINH_VUC } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Quick Read — giá trị đầu tiên, trước khi hỏi tài khoản.
 *
 * Đây là màn quan trọng nhất của toàn bộ luồng kích hoạt. Không có tường chắn nào
 * ở đây: người dùng đọc xong rồi mới được mời tạo tài khoản, và vẫn đi tiếp được
 * nếu từ chối.
 */
export default function ManQuickRead() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { gocNhin, hoSo } = useHoSo();

  useEffect(() => {
    ghiSuKien('quick_read_viewed', { soGocNhin: gocNhin.length });
  }, [gocNhin.length]);

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x8,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x8,
          gap: KHOANG.x5,
        }}
      >
        <Chu kieu="h1">{t.quickRead.tieuDe}</Chu>

        {gocNhin.map((g, i) => (
          <TheGocNhin
            key={g.id}
            gocNhin={g}
            noiBat={i === 0}
            mauNhan={i === 0 ? MAU_LINH_VUC.celes : undefined}
          />
        ))}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x4,
          paddingTop: KHOANG.x2,
          gap: KHOANG.x1,
          borderTopWidth: 1,
          borderColor: mau.vien,
          backgroundColor: mau.nen,
        }}
      >
        <NutChinh
          nhan={t.quickRead.ctaChinh}
          onPress={() => {
            ghiSuKien('signup_started', { tu: 'quick_read' });
            router.push('/dang-ky');
          }}
        />
        <NutChu
          nhan={t.quickRead.ctaPhu}
          mauChu={mau.chuMo}
          onPress={() => router.replace('/(tabs)')}
          style={{ alignItems: 'center' }}
        />
      </View>
    </View>
  );
}
