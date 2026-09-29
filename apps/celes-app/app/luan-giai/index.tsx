import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, The } from '@/giao-dien/co-ban';
import { IconMuiTenPhai, IconQuayLai } from '@/giao-dien/icon';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';
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
  const mau = useMau();
  const le = useSafeAreaInsets();

  const Dong = ({ nhan, moTa, onPress }: { nhan: string; moTa?: string; onPress: () => void }) => (
    <The onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
      <View style={{ flex: 1, gap: KHOANG.x1 }}>
        <Chu kieu="body">{nhan}</Chu>
        {moTa && (
          <Chu kieu="caption" mo>
            {moTa}
          </Chu>
        )}
      </View>
      <IconMuiTenPhai size={18} mau={mau.chuNhat} />
    </The>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: mau.nen }}
      contentContainerStyle={{
        paddingTop: le.top + KHOANG.x2,
        paddingHorizontal: LE_NGANG,
        paddingBottom: le.bottom + KHOANG.x12,
        gap: KHOANG.x6,
      }}
    >
      <View style={{ gap: KHOANG.x2 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.chung.quayLai}
          hitSlop={8}
          style={{ width: CHAM_TOI_THIEU, height: CHAM_TOI_THIEU, justifyContent: 'center', marginLeft: -KHOANG.x3 }}
        >
          <IconQuayLai size={22} mau={mau.chu} />
        </Pressable>
        <Chu kieu="h2">{t.luanGiai.tieuDe}</Chu>
        <Chu kieu="bodySm" mo>
          {t.luanGiai.moTa}
        </Chu>
        {!!t.luanGiai.chiTiengViet && (
          <Chu kieu="caption" mo>
            {t.luanGiai.chiTiengViet}
          </Chu>
        )}
      </View>

      <Dong
        nhan={t.luanGiai.tongQuan}
        moTa={t.luanGiai.tongQuanMoTa}
        onPress={() => router.push('/luan-giai/tong-quan')}
      />

      <View style={{ gap: KHOANG.x2 }}>
        <Eyebrow>{t.luanGiai.chuDeTieuDe}</Eyebrow>
        {CHU_DE_V3.map((c) => (
          <Dong
            key={c.id}
            nhan={t.luanGiai.chuDe[c.id] ?? c.ten}
            onPress={() => router.push({ pathname: '/luan-giai/[nhom]', params: { nhom: c.id } })}
          />
        ))}
      </View>

      <Dong
        nhan={t.luanGiai.bucTranh}
        moTa={t.luanGiai.bucTranhMoTa}
        onPress={() => router.push('/luan-giai/buc-tranh')}
      />
    </ScrollView>
  );
}
