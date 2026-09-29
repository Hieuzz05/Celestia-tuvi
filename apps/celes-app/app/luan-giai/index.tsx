import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeMatKinh, Chu, Eyebrow, HangDanhSach, KeNgang, NenVung, NutIcon } from '@/giao-dien/co-ban';
import { ICON_CHU_DE } from '@/giao-dien/luan-giai';
import { useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { BO_GOC, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { CHU_DE_V3 } from '@khung-v3';

/**
 * Mục lục luận giải — bản app của /luan-giai/sau trên web: tổng quan, 14 mặt
 * đời theo khung v3, và bức tranh lớn ở cuối.
 *
 * Danh sách chủ đề lấy thẳng từ `lib/rag/v3/khung.ts` (không chép sang app) để
 * thứ tự và id luôn khớp máy chủ; chỉ nhãn là của app, vì cần cả tiếng Anh.
 */
export default function ManLuanGiai() {
  const router = useRouter();
  const t = useT();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const le = useSafeAreaInsets();

  const Khoi = ({ children }: { children: ReactNode }) => (
    <BeMatKinh style={{ borderRadius: BO_GOC.the, paddingHorizontal: KHOANG.x4, paddingVertical: KHOANG.x1 }}>
      {children}
    </BeMatKinh>
  );

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="laSo" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x12,
          gap: KHOANG.x5,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <View style={{ gap: KHOANG.x1 }}>
            <Chu kieu="h1">{t.luanGiai.tieuDe}</Chu>
            <Chu kieu="bodySm" mo>
              {t.luanGiai.moTa}
            </Chu>
            {!!t.luanGiai.chiTiengViet && (
              <Chu kieu="caption" mo>
                {t.luanGiai.chiTiengViet}
              </Chu>
            )}
          </View>
        </View>

        <Khoi>
          <HangDanhSach
            icon="book"
            mauIcon={v.mau}
            nhan={t.luanGiai.tongQuan}
            phu={t.luanGiai.tongQuanMoTa}
            onPress={() => router.push('/luan-giai/tong-quan')}
          />
        </Khoi>

        <View style={{ gap: KHOANG.x2 }}>
          <Eyebrow mauChu={v.mau}>{t.luanGiai.chuDeTieuDe}</Eyebrow>
          <Khoi>
            {CHU_DE_V3.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <KeNgang />}
                <HangDanhSach
                  icon={ICON_CHU_DE[c.id] ?? 'sparkle'}
                  mauIcon={v.mau}
                  nhan={t.luanGiai.chuDe[c.id] ?? c.ten}
                  onPress={() => router.push({ pathname: '/luan-giai/[nhom]', params: { nhom: c.id } })}
                />
              </View>
            ))}
          </Khoi>
        </View>

        <Khoi>
          <HangDanhSach
            icon="radar"
            mauIcon={v.mau}
            nhan={t.luanGiai.bucTranh}
            phu={t.luanGiai.bucTranhMoTa}
            onPress={() => router.push('/luan-giai/buc-tranh')}
          />
        </Khoi>
      </ScrollView>
    </View>
  );
}
