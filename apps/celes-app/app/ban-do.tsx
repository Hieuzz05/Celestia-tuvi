import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutPhu, The } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { PHU_TINH_TRONG_YEU } from '@tuvi/phu-tinh-trong-yeu';
import type { Cung } from '@tuvi/ansao';

/**
 * Bản đồ của tôi — lá số đầy đủ, một phiên bản duy nhất.
 *
 * Trước đây màn này chia ba mức (Dễ hiểu/Cổ điển/Chuyên sâu) và lưới cuộn ngang
 * rộng gấp đôi màn hình — không ai đọc hết được lá số cùng lúc. Giờ 12 cung luôn
 * hiện đủ trên một màn hình dọc, chữ rất nhỏ (token `micro`/`nano`, chỉ dùng ở
 * đây) — đánh đổi có chủ đích: đọc tổng quan trước, chạm vào cung để phóng to.
 */

/** Vị trí cố định của từng chi trên lưới 4×4 truyền thống */
const VI_TRI: Record<number, { hang: number; cot: number }> = {
  5: { hang: 0, cot: 0 },
  6: { hang: 0, cot: 1 },
  7: { hang: 0, cot: 2 },
  8: { hang: 0, cot: 3 },
  4: { hang: 1, cot: 0 },
  9: { hang: 1, cot: 3 },
  3: { hang: 2, cot: 0 },
  10: { hang: 2, cot: 3 },
  2: { hang: 3, cot: 0 },
  1: { hang: 3, cot: 1 },
  0: { hang: 3, cot: 2 },
  11: { hang: 3, cot: 3 },
};

/** true nếu là ô trống ở giữa lưới (không phải cung) */
const TRONG = (hang: number, cot: number) => hang >= 1 && hang <= 2 && cot >= 1 && cot <= 2;

export default function ManBanDo() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { laSo } = useHoSo();
  const { width } = useWindowDimensions();

  const [cungChon, setCungChon] = useState<Cung | null>(null);

  if (!laSo) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen, padding: LE_NGANG, paddingTop: le.top + KHOANG.x10 }}>
        <Chu kieu="body" mo>
          {t.trangThai.rong}
        </Chu>
      </View>
    );
  }

  // Lưới 4×4 fit đúng bề ngang màn hình — không cuộn ngang
  const oRong = (width - LE_NGANG * 2) / 4;
  const oCao = oRong * 1.35;

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <View
        style={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          gap: KHOANG.x2,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.chung.quayLai}
          hitSlop={8}
          style={{
            width: CHAM_TOI_THIEU,
            height: CHAM_TOI_THIEU,
            justifyContent: 'center',
            marginLeft: -KHOANG.x3,
          }}
        >
          <IconQuayLai size={22} mau={mau.chu} />
        </Pressable>

        <View>
          <Chu kieu="h2">{t.banDo.tieuDe}</Chu>
          <Chu kieu="caption" mo>
            {t.banDo.phu}
          </Chu>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x4,
        }}
      >
        <View style={{ width: oRong * 4, height: oCao * 4, alignSelf: 'center' }}>
          {laSo.cungs.map((c) => {
            const vt = VI_TRI[c.chiIndex];
            const laMenh = c.laCungMenh;
            const laThan = c.laCungThan;
            return (
              <Pressable
                key={c.chiIndex}
                onPress={() => setCungChon(c)}
                accessibilityRole="button"
                accessibilityLabel={`${c.tenCung} ${c.chi}`}
                style={{
                  position: 'absolute',
                  left: vt.cot * oRong,
                  top: vt.hang * oCao,
                  width: oRong,
                  height: oCao,
                  padding: 4,
                  borderWidth: laMenh ? 1.5 : 0.5,
                  borderColor: laMenh ? mau.chu : mau.vien,
                  backgroundColor: cungChon?.chiIndex === c.chiIndex ? mau.theAm : mau.the,
                  gap: 1,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Chu kieu="nano" nhat>
                    {c.can}.{c.chi}
                  </Chu>
                  {c.daiVan && (
                    <Chu kieu="nano" nhat>
                      {c.daiVan.tuTuoi}
                    </Chu>
                  )}
                </View>

                <Chu kieu="micro" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {c.tenCung}
                  {laThan ? ` · ${t.banDo.than}` : ''}
                </Chu>

                {c.sao
                  .filter((s) => s.loai === 'chinh-tinh')
                  .map((s) => (
                    <Chu key={s.ten} kieu="micro" numberOfLines={1}>
                      {s.ten}
                      {s.doSang ? ` (${s.doSang})` : ''}
                    </Chu>
                  ))}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                  {c.sao
                    .filter((s) => s.loai === 'phu-tinh' && PHU_TINH_TRONG_YEU.has(s.ten))
                    .slice(0, 4)
                    .map((s) => (
                      <Chu key={s.ten} kieu="nano" nhat numberOfLines={1}>
                        {s.ten}
                      </Chu>
                    ))}
                </View>

                {(c.coTuan || c.coTriet) && (
                  <Chu kieu="nano" style={{ color: mau.xau, position: 'absolute', bottom: 3, right: 4 }}>
                    {[c.coTuan && 'Tuần', c.coTriet && 'Triệt'].filter(Boolean).join(' ')}
                  </Chu>
                )}
              </Pressable>
            );
          })}

          {/* Ô trung tâm — thông tin bản mệnh, không phải một cung */}
          <View
            style={{
              position: 'absolute',
              left: oRong,
              top: oCao,
              width: oRong * 2,
              height: oCao * 2,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: KHOANG.x2,
            }}
          >
            <Eyebrow>{laSo.cuc.ten}</Eyebrow>
            <Chu kieu="bodySm" giua style={{ fontWeight: '600' }}>
              {laSo.banMenh.ten}
            </Chu>
            <Chu kieu="caption" mo giua numberOfLines={2}>
              {laSo.thongTin.canChiNam}
            </Chu>
          </View>
        </View>

        {/* Chi tiết cung — mở đầy đủ bên dưới lưới khi chạm vào một ô */}
        {cungChon && (
          <The style={{ gap: KHOANG.x3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Eyebrow>{`${cungChon.can} ${cungChon.chi}`}</Eyebrow>
                <Chu kieu="h3">
                  {cungChon.tenCung}
                  {cungChon.laCungMenh ? ` · ${t.banDo.menh}` : ''}
                  {cungChon.laCungThan ? ` · ${t.banDo.than}` : ''}
                </Chu>
              </View>
              {cungChon.daiVan && (
                <Chu kieu="caption" mo>
                  {cungChon.daiVan.tuTuoi}–{cungChon.daiVan.denTuoi}
                </Chu>
              )}
            </View>

            {cungChon.sao.map((s) => (
              <View key={s.ten} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Chu kieu="bodySm">{s.ten}</Chu>
                {s.doSang && (
                  <Chu kieu="caption" mo>
                    {s.doSang}
                  </Chu>
                )}
              </View>
            ))}

            {(cungChon.coTuan || cungChon.coTriet) && (
              <Chu kieu="bodySm" style={{ color: mau.xau }}>
                {[cungChon.coTuan && 'Tuần Không', cungChon.coTriet && 'Triệt Không']
                  .filter(Boolean)
                  .join(' · ')}
              </Chu>
            )}

            <Chu kieu="caption" mo>
              {t.banDo.trangSinh}: {cungChon.trangSinh}
            </Chu>

            <NutPhu nhan={t.chung.dong} onPress={() => setCungChon(null)} />
          </The>
        )}
      </ScrollView>
    </View>
  );
}
