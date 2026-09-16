import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, ChonPhanDoan, Eyebrow, NutPhu, The } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import type { Cung } from '@tuvi/ansao';

/**
 * Bản đồ của tôi — thay cho trang "Lá số" của web.
 *
 * Quy tắc quan trọng nhất ở màn này: KHÔNG thu nhỏ mệnh bàn 920px của web xuống
 * màn điện thoại. Chữ sẽ nhỏ tới mức không đọc nổi và thao tác chạm thành trò may
 * rủi. Thay vào đó:
 *   - "Dễ hiểu" không hiện lưới 12 cung, mà kể bằng thẻ;
 *   - "Cổ điển" dựng lưới riêng cho di động, ô đủ lớn để chạm, cuộn ngang được;
 *   - "Chuyên sâu" thêm các lớp sao bật tắt.
 */

type CheDo = 'deHieu' | 'coDien' | 'chuyenSau';

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

export default function ManBanDo() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { laSo } = useHoSo();
  const { width } = useWindowDimensions();

  const [cheDo, setCheDo] = useState<CheDo>('deHieu');
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

  const cungMenh = laSo.cungs[laSo.menhIndex];

  // Ô cung rộng bằng ~46% bề ngang màn hình để chữ còn đọc được; lưới cuộn ngang
  const oRong = Math.max(150, width * 0.46);
  const oCao = oRong * 1.15;

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <View
        style={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          gap: KHOANG.x4,
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

        <ChonPhanDoan<CheDo>
          giaTri={cheDo}
          onChange={setCheDo}
          muc={[
            { gt: 'deHieu', nhan: t.banDo.cheDo.deHieu },
            { gt: 'coDien', nhan: t.banDo.cheDo.coDien },
            { gt: 'chuyenSau', nhan: t.banDo.cheDo.chuyenSau },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x4,
        }}
      >
        {cheDo === 'deHieu' ? (
          <>
            {/* Không đổ lưới 12 cung vào mặt người mới — kể bằng thẻ trước */}
            <The am style={{ gap: KHOANG.x2 }}>
              <Eyebrow>{t.banDo.menh}</Eyebrow>
              <Chu kieu="h3">{cungMenh.chi}</Chu>
              <Chu kieu="body">
                {cungMenh.sao
                  .filter((s) => s.loai === 'chinh-tinh')
                  .map((s) => s.ten)
                  .join(' · ') || '—'}
              </Chu>
            </The>

            <View style={{ flexDirection: 'row', gap: KHOANG.x3 }}>
              <The style={{ flex: 1, gap: KHOANG.x1 }}>
                <Eyebrow>{t.banDo.than}</Eyebrow>
                <Chu kieu="body">{laSo.thanCuCung}</Chu>
              </The>
              <The style={{ flex: 1, gap: KHOANG.x1 }}>
                <Eyebrow>{t.banDo.cuc}</Eyebrow>
                <Chu kieu="body">{laSo.cuc.ten}</Chu>
              </The>
            </View>

            <The style={{ gap: KHOANG.x1 }}>
              <Eyebrow>{t.banDo.banMenh}</Eyebrow>
              <Chu kieu="body">{laSo.banMenh.ten}</Chu>
            </The>

            <NutPhu nhan={t.banDo.xemCoDien} onPress={() => setCheDo('coDien')} />
          </>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ width: oRong * 4, height: oCao * 4 }}>
              {laSo.cungs.map((c) => {
                const vt = VI_TRI[c.chiIndex];
                const laMenh = c.laCungMenh;
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
                      padding: KHOANG.x2,
                      borderWidth: laMenh ? 2 : 1,
                      borderColor: laMenh ? mau.chu : mau.vien,
                      borderRadius: BO_GOC.nut,
                      backgroundColor: mau.the,
                      gap: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Chu kieu="eyebrow" nhat>
                        {c.can}.{c.chi}
                      </Chu>
                      <Chu kieu="eyebrow" nhat>
                        {c.daiVan ? `${c.daiVan.tuTuoi}` : ''}
                      </Chu>
                    </View>

                    <Chu kieu="caption" style={{ fontWeight: '600' }}>
                      {c.tenCung}
                    </Chu>

                    {c.sao
                      .filter((s) => s.loai === 'chinh-tinh')
                      .map((s) => (
                        <Chu key={s.ten} kieu="caption">
                          {s.ten}
                          {s.doSang ? ` (${s.doSang})` : ''}
                        </Chu>
                      ))}

                    {cheDo === 'chuyenSau' &&
                      c.sao
                        .filter((s) => s.loai === 'phu-tinh')
                        .slice(0, 6)
                        .map((s) => (
                          <Chu key={s.ten} kieu="eyebrow" nhat>
                            {s.ten}
                          </Chu>
                        ))}

                    {(c.coTuan || c.coTriet) && (
                      <Chu kieu="eyebrow" style={{ color: mau.xau }}>
                        {[c.coTuan && 'Tuần', c.coTriet && 'Triệt'].filter(Boolean).join(' ')}
                      </Chu>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Chi tiết cung — mở toàn màn chứ không phải ngăn kéo bên cạnh như web */}
        {cungChon && (
          <The style={{ gap: KHOANG.x3 }}>
            <Eyebrow>{`${cungChon.can} ${cungChon.chi}`}</Eyebrow>
            <Chu kieu="h3">{cungChon.tenCung}</Chu>
            {cungChon.sao.map((s) => (
              <Chu key={s.ten} kieu="bodySm" mo>
                {s.ten}
                {s.doSang ? ` · ${s.doSang}` : ''}
              </Chu>
            ))}
            <NutPhu nhan={t.chung.dong} onPress={() => setCungChon(null)} />
          </The>
        )}
      </ScrollView>
    </View>
  );
}
