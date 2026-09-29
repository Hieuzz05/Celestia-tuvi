import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NenVung, NutChinh, NutIcon, NutPhu, Pill, The } from '@/giao-dien/co-ban';
import { CauTraLoi, DangDoc, TheCanDangNhap, TheTomLai, useBaiLuan } from '@/giao-dien/luan-giai';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { CAU_HOI_V3, CHU_DE_V3 } from '@khung-v3';

/**
 * Một bài luận: tổng quan (`nhom = tong-quan`) hoặc một trong 14 mặt đời.
 * Logic đọc bài (hai lượt nối tiếp, cổng đăng nhập, tóm lại) nằm ở
 * `useBaiLuan` trong `src/giao-dien/luan-giai.tsx` — tab Lá số dùng chung.
 *
 * Giao diện theo `BaiDoc` của Aurora bản 8: dải chip chủ đề trên đầu, câu trả
 * lời đánh số trong vòng màu vùng, "Tóm lại" là thẻ hero, cuối bài là nút đọc
 * chủ đề kế tiếp (nút chính) và "Hỏi Celes" (nút phụ).
 */
export default function ManBaiLuan() {
  const router = useRouter();
  const t = useT();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const le = useSafeAreaInsets();
  const { nhom = 'tong-quan' } = useLocalSearchParams<{ nhom: string }>();
  const { hoSo, laTongQuan, hopLe, ten, chuDeSau, tt, tom, thuLai } = useBaiLuan(nhom);

  const soCau = CAU_HOI_V3.filter((q) =>
    laTongQuan ? q.loai === 'tong-quan' : q.loai === 'chuyen-sau' && q.chuDe === nhom
  ).length;

  const hoiCeles = () =>
    router.push({
      pathname: '/(tabs)/celes',
      params: { q: dien(t.luanGiai.cauHoiChuDe, { ten: ten.toLowerCase() }) },
    });

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="laSo" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x2,
          paddingBottom: le.bottom + KHOANG.x12,
          gap: KHOANG.x5,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Đầu màn: quay lại · tên phần đọc */}
        <View style={{ paddingHorizontal: LE_NGANG, flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.displayVua, fontSize: 17, lineHeight: 21, color: mau.chu }} numberOfLines={1}>
              {laTongQuan ? t.luanGiai.tongQuan : t.laSoTab.luanChuyenSau}
            </Text>
            <Chu kieu="caption" mo numberOfLines={1}>
              {laTongQuan ? t.laSoTab.phu.tongQuan : t.luanGiai.tieuDe}
            </Chu>
          </View>
        </View>

        {/* Dải chip 14 chủ đề — chỉ ở bài chuyên sâu */}
        {!laTongQuan && hopLe && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x2, paddingVertical: 4 }}
          >
            {CHU_DE_V3.map((c) => (
              <Pill
                key={c.id}
                nhan={t.luanGiai.chuDe[c.id] ?? c.ten}
                dangChon={c.id === nhom}
                vung="laSo"
                onPress={() =>
                  c.id !== nhom && router.replace({ pathname: '/luan-giai/[nhom]', params: { nhom: c.id } })
                }
              />
            ))}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x5 }}>
          <View style={{ gap: KHOANG.x2 }}>
            <Eyebrow mauChu={v.mau}>
              {[laTongQuan ? t.luanGiai.tieuDe : t.laSoTab.heroNhan, soCau ? dien(t.laSoTab.soCau, { so: soCau }) : null]
                .filter(Boolean)
                .join(' · ')}
            </Eyebrow>
            <Chu kieu="h1" style={{ fontSize: 25, lineHeight: 29 }}>
              {ten}
            </Chu>
            {laTongQuan && (
              <Chu kieu="bodySm" mo>
                {t.luanGiai.tongQuanMoTa}
              </Chu>
            )}
            {!!t.luanGiai.chiTiengViet && (
              <Chu kieu="caption" mo>
                {t.luanGiai.chiTiengViet}
              </Chu>
            )}
          </View>

          {!hoSo || !hopLe ? (
            <Chu kieu="body" mo>
              {t.trangThai.rong}
            </Chu>
          ) : tt?.loai === 'can-dang-nhap' ? (
            <TheCanDangNhap moTa={tt.gioiHanKhach ? t.luanGiai.gioiHanKhach : undefined} />
          ) : tt?.loai === 'loi' ? (
            <View style={{ gap: KHOANG.x3 }}>
              <Chu kieu="body">{t.luanGiai.loi}</Chu>
              <NutPhu nhan={t.chung.thuLai} onPress={thuLai} />
            </View>
          ) : tt?.loai === 'xong' ? (
            <>
              {tt.cau.map((c, i) => (
                <The key={c.id}>
                  <CauTraLoi cau={c} so={i + 1} />
                </The>
              ))}
              {tt.dangTiep && <DangDoc chu={t.luanGiai.dangVietTiep.replace(/…$/, '')} />}
              {tt.loiSau && (
                <View style={{ gap: KHOANG.x3 }}>
                  <Chu kieu="bodySm" mo>
                    {t.luanGiai.loiPhanSau}
                  </Chu>
                  <NutPhu nhan={t.chung.thuLai} onPress={thuLai} />
                </View>
              )}

              {!laTongQuan && !tt.dangTiep && !tt.loiSau && <TheTomLai chu={tom?.chu ?? null} xong={!!tom} />}

              {!tt.dangTiep && (
                <View style={{ gap: KHOANG.x2 }}>
                  {laTongQuan ? (
                    <NutChinh nhan={t.luanGiai.docChuDe} onPress={() => router.push('/luan-giai')} />
                  ) : chuDeSau ? (
                    <NutChinh
                      nhan={dien(t.luanGiai.docTiep, { ten: t.luanGiai.chuDe[chuDeSau.id] ?? chuDeSau.ten })}
                      onPress={() => router.replace({ pathname: '/luan-giai/[nhom]', params: { nhom: chuDeSau.id } })}
                    />
                  ) : (
                    <NutChinh nhan={t.luanGiai.xemBucTranh} onPress={() => router.push('/luan-giai/buc-tranh')} />
                  )}
                  <NutPhu nhan={t.luanGiai.hoiCeles} icon="sparkle" onPress={hoiCeles} />
                </View>
              )}
            </>
          ) : (
            <DangDoc />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
