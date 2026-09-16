import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NenGradient, NutChu, Pill, The } from '@/giao-dien/co-ban';
import { BangViSao } from '@/giao-dien/vi-sao';
import { IconBanDo, IconKetNoi, IconMuiTenPhai, IconSach, MAU_LINH_VUC } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { dien, useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { BANG_MAU, BO_GOC, DO_NOI, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { cungDaiVan } from '@tuvi/ansao';

/**
 * Hôm nay — lý do mở app mỗi ngày.
 *
 * Không phải bảng điều khiển: mỗi khối là một câu chuyện ngắn, xếp theo thứ tự
 * cảm xúc chứ không theo mức độ đầy đủ dữ liệu. Thẻ hero dùng gradient chữ ký,
 * còn lại là thẻ trắng — spec cấm phủ gradient lên mọi khối.
 *
 * Nội dung "hôm nay" hiện lấy từ góc nhìn đã tính sẵn của bản đồ. Khi có tầng
 * nội dung theo ngày thật thì thay ở đây, bố cục giữ nguyên.
 */
export default function ManHomNay() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { hoSo, laSo, gocNhin } = useHoSo();
  const [moViSao, setMoViSao] = useState(false);

  useEffect(() => {
    ghiSuKien('home_viewed');
  }, []);

  const loiChao = useMemo(() => {
    const gio = new Date().getHours();
    const mau_ =
      gio < 11 ? t.homNay.chaoSang : gio < 18 ? t.homNay.chaoChieu : t.homNay.chaoToi;
    return dien(mau_, { ten: hoSo?.ten?.trim() || '' }).replace(/,\s*$/, '');
  }, [hoSo?.ten, t]);

  const chinh = gocNhin[0];
  const giaiDoan = useMemo(() => {
    if (!laSo || !hoSo) return null;
    const tuoiAm = new Date().getFullYear() - laSo.thongTin.amLich.nam + 1;
    return cungDaiVan(laSo, tuoiAm) ?? null;
  }, [laSo, hoSo]);

  const chuDe = gocNhin.slice(1, 4);

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x5,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x8,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: LE_NGANG }}>
          <Chu kieu="h2">{loiChao}</Chu>
        </View>

        {/* --- Khối 1: điều nổi bật hôm nay, trên gradient chữ ký --- */}
        {chinh && (
          <View style={{ paddingHorizontal: LE_NGANG }}>
            <NenGradient
              style={{
                borderRadius: BO_GOC.theHero,
                padding: KHOANG.x6,
                gap: KHOANG.x3,
                ...DO_NOI.hero,
              }}
            >
              <Eyebrow mauChu={BANG_MAU.aubergine}>{t.homNay.nhan}</Eyebrow>
              <Chu kieu="h2" style={{ color: BANG_MAU.aubergine }}>
                {chinh.tieuDe}
              </Chu>
              <Chu kieu="body" style={{ color: BANG_MAU.aubergine, opacity: 0.85 }}>
                {chinh.noiDung}
              </Chu>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x4 }}>
                <NutChu
                  nhan={t.homNay.hoiVeDieuNay}
                  mauChu={BANG_MAU.aubergine}
                  onPress={() => {
                    ghiSuKien('daily_insight_opened');
                    router.push('/(tabs)/celes');
                  }}
                />
                <NutChu
                  nhan={t.viSao.lienKet}
                  mauChu={BANG_MAU.aubergine}
                  onPress={() => setMoViSao(true)}
                />
              </View>
            </NenGradient>
          </View>
        )}

        {/* --- Khối 2: giai đoạn đang đi qua --- */}
        {giaiDoan?.daiVan && (
          <View style={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x3 }}>
            <Chu kieu="h3">{t.homNay.giaiDoanTieuDe}</Chu>
            <The onPress={() => router.push('/(tabs)/hanh-trinh')} style={{ gap: KHOANG.x2 }}>
              <Eyebrow mauChu={MAU_LINH_VUC.celes}>
                {dien(t.hanhTrinh.dangO, {
                  tu: giaiDoan.daiVan.tuTuoi,
                  den: giaiDoan.daiVan.denTuoi,
                })}
              </Eyebrow>
              <Chu kieu="h3">{giaiDoan.tenCung}</Chu>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x2 }}>
                <Chu kieu="bodySm" style={{ color: mau.hanhDong }}>
                  {t.homNay.giaiDoanCta}
                </Chu>
                <IconMuiTenPhai size={16} mau={mau.hanhDong} />
              </View>
            </The>
          </View>
        )}

        {/* --- Khối 3: điều đáng chú ý --- */}
        {chuDe.length > 0 && (
          <View style={{ gap: KHOANG.x3 }}>
            <Chu kieu="h3" style={{ paddingHorizontal: LE_NGANG }}>
              {t.homNay.chuDeTieuDe}
            </Chu>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x3 }}
            >
              {chuDe.map((g) => (
                <The key={g.id} style={{ width: 260, gap: KHOANG.x2 }}>
                  <Eyebrow>{g.nhomChu}</Eyebrow>
                  <Chu kieu="body" numberOfLines={4}>
                    {g.noiDung}
                  </Chu>
                </The>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --- Khối 4: mời trò chuyện --- */}
        <View style={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x3 }}>
          <Chu kieu="h3">{t.homNay.hoiTieuDe}</Chu>
          <The am onPress={() => router.push('/(tabs)/celes')} style={{ gap: KHOANG.x3 }}>
            <Chu kieu="h3">{t.homNay.hoiCta}</Chu>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
              {t.homNay.goiY.map((g) => (
                <Pill key={g} nhan={g} />
              ))}
            </View>
          </The>
        </View>

        {/* --- Khối 5: khám phá --- */}
        <View style={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x3 }}>
          <Chu kieu="h3">{t.homNay.khamPhaTieuDe}</Chu>
          <View style={{ gap: KHOANG.x2 }}>
            {[
              { nhan: t.homNay.khamPha.banDo, icon: IconBanDo, di: '/ban-do' as const },
              { nhan: t.homNay.khamPha.ketNoi, icon: IconKetNoi, di: '/(tabs)/ket-noi' as const },
              { nhan: t.homNay.khamPha.hoc, icon: IconSach, di: '/(tabs)/toi' as const },
            ].map((m) => (
              <The
                key={m.nhan}
                onPress={() => router.push(m.di)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}
              >
                <m.icon size={22} mau={mau.chu} />
                <Chu kieu="body" style={{ flex: 1 }}>
                  {m.nhan}
                </Chu>
                <IconMuiTenPhai size={18} mau={mau.chuNhat} />
              </The>
            ))}
          </View>
        </View>
      </ScrollView>

      {chinh && (
        <BangViSao
          hienThi={moViSao}
          onDong={() => setMoViSao(false)}
          canCu={chinh.canCu}
          tomTat={chinh.noiDung}
        />
      )}
    </View>
  );
}
