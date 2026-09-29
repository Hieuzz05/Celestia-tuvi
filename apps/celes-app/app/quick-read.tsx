import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import type { GocNhin } from '@tuvi/quick-read';
import { Chu, Eyebrow, NenVung, NutChinh, NutChu, TheHero } from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { ChuCoNhan } from '@/giao-dien/khung-buoc';
import { BangViSao } from '@/giao-dien/vi-sao';
import { useHoSo } from '@/du-lieu/ho-so';
import { dien, useT } from '@/i18n/context';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useMau, useVung } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Quick Read — giá trị đầu tiên, trước khi hỏi tài khoản (Aurora bản 8, màn 1b).
 *
 * Đây là màn quan trọng nhất của toàn bộ luồng kích hoạt. Không có tường chắn nào
 * ở đây: các thẻ góc nhìn đọc được trọn vẹn, lời mời lưu nằm ở tấm đáy KHÔNG che
 * thẻ, và vẫn đi tiếp được nếu từ chối.
 *
 * Thẻ vuốt ngang, mỗi thẻ một góc nhìn; "Muốn biết vì sao không?" có trên từng
 * thẻ và luôn miễn phí.
 */

const KHE = 12;
const hai = (n: number) => String(n).padStart(2, '0');

export default function ManQuickRead() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('khoiDau');
  const le = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { gocNhin, hoSo } = useHoSo();

  const [dangXem, setDangXem] = useState(0);
  const [moViSao, setMoViSao] = useState<GocNhin | null>(null);

  const rongThe = width - LE_NGANG * 2;
  const tong = gocNhin.length;

  useEffect(() => {
    ghiSuKien('quick_read_viewed', { soGocNhin: gocNhin.length });
  }, [gocNhin.length]);

  const khiVuot = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (rongThe + KHE));
    setDangXem(Math.max(0, Math.min(tong - 1, i)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="khoiDau" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x6,
          paddingBottom: KHOANG.x6,
          gap: KHOANG.x5,
        }}
      >
        <View style={{ paddingHorizontal: LE_NGANG, gap: 6 }}>
          {hoSo?.ten ? (
            <Eyebrow mauChu={v.mau}>{dien(t.quickRead.eyebrow, { ten: hoSo.ten.trim() })}</Eyebrow>
          ) : null}
          <Chu kieu="display" accessibilityRole="header">
            <ChuCoNhan chu={t.quickRead.tieuDe} vung="khoiDau" />
          </Chu>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={rongThe + KHE}
          snapToAlignment="start"
          disableIntervalMomentum
          onMomentumScrollEnd={khiVuot}
          contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: KHE }}
        >
          {gocNhin.map((g, i) => (
            <TheHero
              key={g.id}
              vung="khoiDau"
              style={{ width: rongThe, minHeight: 320, gap: 10, padding: 22 }}
            >
              <VongTrangTri mau={v.mau} sang={v.sang} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: BO_GOC.vien,
                    borderWidth: 1,
                    borderColor: `rgba(${v.rgb},0.40)`,
                    backgroundColor: `rgba(${v.rgb},0.16)`,
                  }}
                >
                  <Text style={{ fontFamily: FONT.mono, fontSize: 13, lineHeight: 16, color: v.sang }}>
                    {dien(t.quickRead.dem, { so: hai(i + 1), tong: hai(tong) })}
                  </Text>
                </View>
                <Eyebrow mauChu={v.mau} style={{ flexShrink: 1 }}>
                  {g.nhomChu}
                </Eyebrow>
              </View>

              <Chu kieu="h2" style={{ marginTop: 6, fontSize: 27, lineHeight: 30 }}>
                {g.tieuDe}
              </Chu>
              <Chu kieu="body" mo>
                {g.noiDung}
              </Chu>

              <Pressable
                onPress={() => setMoViSao(g)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  minHeight: CHAM_TOI_THIEU,
                  paddingLeft: 18,
                  paddingRight: 16,
                  borderRadius: BO_GOC.nut,
                  borderWidth: 1,
                  borderColor: mau.vienKinh,
                  backgroundColor: mau.theAm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: FONT.thanDam, fontSize: 15, color: mau.chu }}>{t.viSao.lienKet}</Text>
                <Icon ten="arrow" size={16} net={2.2} mau={mau.chu} />
              </Pressable>
            </TheHero>
          ))}
        </ScrollView>

        {tong > 1 && (
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            accessible
            accessibilityLabel={dien(t.quickRead.theSo, { so: dangXem + 1, tong })}
          >
            {gocNhin.map((g, i) => (
              <View
                key={g.id}
                style={{
                  width: i === dangXem ? 28 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === dangXem ? v.mau : mau.chuNhat,
                }}
              />
            ))}
            <Chu kieu="caption" mo style={{ marginLeft: 10, fontSize: 13 }}>
              {t.quickRead.vuot}
            </Chu>
          </View>
        )}
      </ScrollView>

      {/* Lời mời lưu — tấm đáy nằm dưới thẻ, không phủ lên nội dung đã đọc */}
      <View
        style={{
          borderTopLeftRadius: BO_GOC.bottomSheet,
          borderTopRightRadius: BO_GOC.bottomSheet,
          borderTopWidth: 1,
          borderColor: mau.vienKinh,
          backgroundColor: mau.theNoi,
          paddingTop: 10,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x3,
          gap: 10,
        }}
      >
        <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: mau.ranh }} />
        <Chu kieu="h2" style={{ marginTop: 4, fontSize: 22, lineHeight: 26 }}>
          {t.quickRead.luuTieuDe}
        </Chu>
        <Chu kieu="bodySm" mo>
          {t.quickRead.luuMoTa}
        </Chu>
        <NutChinh
          nhan={t.quickRead.ctaChinh}
          style={{ marginTop: 4 }}
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

      <BangViSao
        hienThi={moViSao !== null}
        onDong={() => setMoViSao(null)}
        canCu={moViSao?.canCu ?? []}
        tomTat={moViSao?.noiDung}
      />
    </View>
  );
}

/** Các vòng quỹ đạo mờ ở góc phải-trên thẻ — trang trí, không nhận chạm */
function VongTrangTri({ mau, sang }: { mau: string; sang: string }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'flex-end' }]}>
      <Svg width={200} height={200} viewBox="0 0 200 200" style={{ marginTop: -60, marginRight: -60, opacity: 0.7 }}>
        <G fill="none" stroke={mau} strokeOpacity={0.22}>
          <Circle cx={100} cy={100} r={40} />
          <Circle cx={100} cy={100} r={64} strokeDasharray="2 6" />
          <Circle cx={100} cy={100} r={92} />
        </G>
        <Circle cx={164} cy={100} r={5} fill={mau} />
        <Circle cx={100} cy={8} r={3.5} fill={sang} fillOpacity={0.6} />
      </Svg>
    </View>
  );
}
