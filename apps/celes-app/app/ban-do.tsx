import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NenVung, NutIcon } from '@/giao-dien/co-ban';
import { MenhBanDayDu } from '@/giao-dien/menh-ban';
import { dungLaSo, useHoSo } from '@/du-lieu/ho-so';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Bản đồ đầy đủ ngoài tab — mở từ Hôm nay, Tôi, Người của tôi (`?id=`) và
 * đường dẫn web. Lưới, thanh điều khiển và bảng một cung nằm ở
 * `src/giao-dien/menh-ban.tsx`, dùng chung với tab Lá số.
 */
export default function ManBanDo() {
  const router = useRouter();
  const t = useT();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const le = useSafeAreaInsets();
  const { laSo: laSoCuaToi, nguoi } = useHoSo();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // ?id= mở lá số một người trong "Người của tôi"; không có thì là lá số của mình
  const nguoiXem = id ? nguoi.find((n) => n.id === id) : undefined;
  const laSo = useMemo(
    () => (nguoiXem ? dungLaSo(nguoiXem) : laSoCuaToi),
    [nguoiXem, laSoCuaToi]
  );

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="laSo" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x12,
          gap: KHOANG.x4,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <View style={{ gap: 4 }}>
            <Eyebrow mauChu={v.mau}>{t.banDo.phu}</Eyebrow>
            <Chu kieu="h2">{nguoiXem?.hoTen?.trim() ? dien(t.laSoTab.tieuDe, { ten: nguoiXem.hoTen.trim() }) : t.banDo.tieuDe}</Chu>
            {laSo && (
              <Chu kieu="caption" mo>
                {t.laSoTab.phu.laSo}
              </Chu>
            )}
          </View>
        </View>

        {laSo ? (
          <MenhBanDayDu laSo={laSo} choPhepHoi={!nguoiXem} />
        ) : (
          <Chu kieu="body" mo>
            {id && !nguoiXem ? t.nguoi.khongTimThay : t.trangThai.rong}
          </Chu>
        )}
      </ScrollView>
    </View>
  );
}
