import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnhDaiDien,
  Chu,
  ChuNhan,
  DauVung,
  Eyebrow,
  Giong,
  NenGradient,
  NenVung,
  NutChinh,
  NutChu,
  OrbCeles,
  Pill,
  The,
  TheHero,
  useDemDayTab,
} from '@/giao-dien/co-ban';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { BangViSao } from '@/giao-dien/vi-sao';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { dien, useT } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { BANG_MAU, BO_GOC, CHAM_TOI_THIEU, DO_NOI, FONT, KHOANG, LE_NGANG, VUNG, VUNG_SANG, type TenVung } from '@/thiet-ke/token';
import { cungDaiVan } from '@tuvi/ansao';
import { namAmHienTai } from '@tuvi/bay-gio';

/**
 * Hôm nay — lý do mở app mỗi ngày (hệ Aurora bản 8, vùng vàng "homNay").
 *
 * Không phải bảng điều khiển: mỗi khối là một câu chuyện ngắn, xếp theo thứ tự
 * cảm xúc chứ không theo mức độ đầy đủ dữ liệu. Theme tối: thẻ chính là thẻ
 * đêm viền vàng; theme sáng giữ mảng pastel chữ ký như bản thiết kế.
 *
 * Bản thiết kế có "Giờ thuận / Nhịp ngày" và "Celes vẫn nhớ" — app chưa có dữ
 * liệu thật cho các ô đó, nên hai ô trong thẻ chính đọc giai đoạn đại vận (có
 * thật từ engine) và khối Celes là lời mời trò chuyện. Không bịa số liệu.
 *
 * Lá số ở đây là "lá số của tôi" (`useHoSo` = idMacDinh): xem tạm lá số khác ở
 * màn khác không làm đổi trang chủ.
 */
export default function ManHomNay() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const { theme } = useTheme();
  const v = useVung('homNay');
  const le = useSafeAreaInsets();
  const demDay = useDemDayTab();
  const { hoSo, laSo, gocNhin } = useHoSo();
  const [moViSao, setMoViSao] = useState(false);
  const toi = theme === 'toi';

  useEffect(() => {
    ghiSuKien('home_viewed');
  }, []);

  const ten = hoSo?.ten?.trim() || '';

  // Tách lời chào quanh {ten} để tên xuống dòng và mang màu vùng như bản thiết kế
  const loiChao = useMemo(() => {
    const gio = new Date().getHours();
    const mau_ = gio < 11 ? t.homNay.chaoSang : gio < 18 ? t.homNay.chaoChieu : t.homNay.chaoToi;
    const [truoc, sau = ''] = mau_.split('{ten}');
    return { truoc: ten ? truoc.trimEnd() : truoc.replace(/,\s*$/, '').trimEnd(), sau };
  }, [ten, t]);

  const ngayHomNay = useMemo(() => {
    const d = new Date();
    return dien(t.homNay.ngay, {
      thu: t.homNay.thu[d.getDay()],
      ngay: d.getDate(),
      thang: t.homNay.thang[d.getMonth()],
    });
  }, [t]);

  const chinh = gocNhin[0];
  const giaiDoan = useMemo(() => {
    if (!laSo || !hoSo) return null;
    const tuoiAm = namAmHienTai() - laSo.thongTin.amLich.nam + 1;
    return cungDaiVan(laSo, tuoiAm) ?? null;
  }, [laSo, hoSo]);

  const chuDe = gocNhin.slice(1, 4);

  const hoiVeChinh = () => {
    if (!chinh) return;
    ghiSuKien('daily_insight_opened');
    // Chỉ điền sẵn câu hỏi — người dùng tự bấm gửi (mỗi lượt tính hạn mức)
    router.push({
      pathname: '/(tabs)/celes',
      params: { q: dien(t.homNay.cauHoiVe, { tieuDe: chinh.tieuDe }) },
    });
  };

  // Màu trong thẻ chính: tối theo vùng vàng, sáng theo mảng pastel (chữ mực tím)
  const hero = toi
    ? {
        nhan: v.mau,
        than: mau.chuMo,
        o: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: mau.vien },
        nhanO: mau.chuMo,
        chip: { backgroundColor: `rgba(${v.rgb},0.16)`, borderWidth: 1, borderColor: `rgba(${v.rgb},0.40)` },
        chuChip: v.sang,
        chu: mau.chu,
      }
    : {
        nhan: '#4A2A4A',
        than: '#3A1640',
        o: { backgroundColor: 'rgba(255,255,255,0.55)' },
        nhanO: '#4A2A4A',
        chip: { backgroundColor: BANG_MAU.aubergine },
        chuChip: '#FFF1BD',
        chu: BANG_MAU.aubergine,
      };

  const noiDungHero = chinh && (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: KHOANG.x2 }}>
        <Eyebrow mauChu={hero.nhan} style={{ flexShrink: 1 }}>
          {t.homNay.nhanDinh}
        </Eyebrow>
        <View
          style={[
            {
              minHeight: 28,
              paddingHorizontal: 10,
              borderRadius: BO_GOC.vien,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              flexShrink: 1,
            },
            hero.chip,
          ]}
        >
          <Icon ten="sparkle" size={14} net={2} mau={hero.chuChip} />
          <Text numberOfLines={1} style={{ fontFamily: FONT.thanDam, fontSize: 12, color: hero.chuChip, flexShrink: 1 }}>
            {chinh.nhomChu}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontFamily: FONT.display,
          fontSize: 22,
          lineHeight: 25,
          letterSpacing: -0.55,
          color: hero.chu,
          marginTop: 2,
        }}
      >
        {chinh.tieuDe}
      </Text>
      <Text style={{ fontFamily: FONT.than, fontSize: 14, lineHeight: 21, color: hero.than }}>{chinh.noiDung}</Text>

      {/* Hai ô số liệu: giai đoạn đại vận đang đi qua — dữ liệu thật của lá số */}
      {giaiDoan?.daiVan && (
        <Pressable
          onPress={() => router.push('/(tabs)/hanh-trinh')}
          accessibilityRole="button"
          accessibilityLabel={t.homNay.giaiDoanCta}
          style={({ pressed }) => ({ flexDirection: 'row', gap: KHOANG.x2, marginTop: 2, opacity: pressed ? 0.8 : 1 })}
        >
          <OSoLieu
            icon="clock"
            nhan={t.homNay.giaiDoanNhan}
            giaTri={dien(t.homNay.giaiDoanTuoi, { tu: giaiDoan.daiVan.tuTuoi, den: giaiDoan.daiVan.denTuoi })}
            kieuO={hero.o}
            mauNhan={hero.nhanO}
            mauChu={hero.chu}
          />
          <OSoLieu
            icon="compass"
            nhan={t.homNay.trongTamNhan}
            giaTri={giaiDoan.tenCung}
            kieuO={hero.o}
            mauNhan={hero.nhanO}
            mauChu={hero.chu}
          />
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: KHOANG.x4 }}>
        <NutChu nhan={t.homNay.hoiVeDieuNay} mauChu={toi ? v.mau : BANG_MAU.aubergine} onPress={hoiVeChinh} />
        {/* "Muốn biết vì sao không?" — luôn miễn phí, luôn có mặt */}
        <NutChu nhan={t.viSao.lienKet} mauChu={toi ? mau.chu : BANG_MAU.aubergine} onPress={() => setMoViSao(true)} />
      </View>
    </>
  );

  const khamPha: { nhan: string; icon: TenIcon; vung: TenVung; di: '/ban-do' | '/(tabs)/ket-noi' | '/luan-giai' | '/toi' }[] = [
    { nhan: t.homNay.khamPha.banDo, icon: 'laso', vung: 'laSo', di: '/ban-do' },
    { nhan: t.homNay.khamPha.ketNoi, icon: 'rel', vung: 'moiQuanHe', di: '/(tabs)/ket-noi' },
    { nhan: t.homNay.khamPha.chuDe, icon: 'book', vung: 'celes', di: '/luan-giai' },
    { nhan: t.homNay.khamPha.hoc, icon: 'cap', vung: 'toi', di: '/toi' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="homNay" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x3,
          paddingBottom: demDay,
          paddingHorizontal: LE_NGANG,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Đầu màn: dấu vùng, ngày, lời chào, ảnh đại diện --- */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ flex: 1, gap: 6 }}>
            {toi && <DauVung vung="homNay" ten={t.homNay.nhan} />}
            <Eyebrow mauChu={toi ? mau.chuMo : v.mau}>{ngayHomNay}</Eyebrow>
            <Chu kieu="h1" style={{ fontSize: 26, lineHeight: 28 }}>
              {loiChao.truoc}
              {ten ? '\n' : ''}
              {ten ? <ChuNhan vung="homNay">{ten}</ChuNhan> : null}
              {loiChao.sau}
            </Chu>
          </View>
          <AnhDaiDien ten={ten} onPress={() => router.push('/toi')} nhan={t.tab.moTaiKhoan} />
        </View>

        {/* --- Khối 1: nhận định hôm nay --- */}
        {chinh &&
          (toi ? (
            <TheHero vung="homNay" style={{ padding: 18, gap: KHOANG.x2 }}>
              {noiDungHero}
            </TheHero>
          ) : (
            <NenGradient
              style={{
                borderRadius: BO_GOC.theHero,
                padding: 18,
                gap: KHOANG.x2,
                overflow: 'hidden',
                ...DO_NOI.hero,
                shadowColor: '#FF8BD0',
                shadowOpacity: 0.32,
              }}
            >
              {noiDungHero}
            </NenGradient>
          ))}

        {/* --- Khối 2: mời trò chuyện — nút chính duy nhất của màn --- */}
        <The style={{ paddingVertical: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <OrbCeles size={30} />
            <Text style={{ fontFamily: FONT.thanDam, fontSize: 13, color: v.mau }}>{t.homNay.celesNhan}</Text>
          </View>
          <Giong co={17}>{t.homNay.hoiTieuDe}</Giong>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
            {t.homNay.goiY.map((g) => (
              <Pill
                key={g}
                nhan={g}
                vung="homNay"
                // Chỉ điền sẵn, không tự gửi — mỗi lượt gửi tính vào hạn mức
                onPress={() => router.push({ pathname: '/(tabs)/celes', params: { q: g } })}
              />
            ))}
          </View>
          <NutChinh nhan={t.homNay.hoiCta} onPress={() => router.push('/(tabs)/celes')} />
        </The>

        {/* --- Khối 3: điều đáng chú ý (cuộn ngang trong khối, không cuộn cả màn) --- */}
        {chuDe.length > 0 && (
          <View style={{ gap: KHOANG.x3, marginHorizontal: -LE_NGANG, marginTop: KHOANG.x2 }}>
            <Chu kieu="h3" style={{ paddingHorizontal: LE_NGANG }}>
              {t.homNay.chuDeTieuDe}
            </Chu>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: 10 }}
            >
              {chuDe.map((g) => (
                <The key={g.id} style={{ width: 260, gap: KHOANG.x2 }}>
                  <Eyebrow mauChu={v.mau}>{g.nhomChu}</Eyebrow>
                  <Chu kieu="bodySm" numberOfLines={5}>
                    {g.noiDung}
                  </Chu>
                </The>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --- Khối 4: khám phá — lưới hai cột như ô "Lá số / Đọc tiếp" của bản thiết kế --- */}
        <View style={{ gap: KHOANG.x3, marginTop: KHOANG.x2 }}>
          <Chu kieu="h3">{t.homNay.khamPhaTieuDe}</Chu>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {khamPha.map((m) => (
              <OKhamPha key={m.nhan} {...m} onPress={() => router.push(m.di)} />
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

/** Ô số liệu nhỏ trong thẻ chính: nhãn có icon + giá trị chữ display */
function OSoLieu({
  icon,
  nhan,
  giaTri,
  kieuO,
  mauNhan,
  mauChu,
}: {
  icon: TenIcon;
  nhan: string;
  giaTri: string;
  kieuO: object;
  mauNhan: string;
  mauChu: string;
}) {
  return (
    <View style={[{ flex: 1, minWidth: 0, borderRadius: BO_GOC.nut, paddingVertical: 9, paddingHorizontal: 12, gap: 2 }, kieuO]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon ten={icon} size={14} net={2} mau={mauNhan} />
        <Text numberOfLines={1} style={{ fontFamily: FONT.thanDam, fontSize: 12, color: mauNhan, flexShrink: 1 }}>
          {nhan}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ fontFamily: FONT.displayVua, fontSize: 17, lineHeight: 22, color: mauChu }}
      >
        {giaTri}
      </Text>
    </View>
  );
}

/** Ô khám phá: icon trong ô vuông màu vùng đích + nhãn */
function OKhamPha({ nhan, icon, vung, onPress }: { nhan: string; icon: TenIcon; vung: TenVung; onPress: () => void }) {
  const { theme } = useTheme();
  const mau = useMau();
  // Ô icon mang màu vùng ĐÍCH (Lá số tím, Mối quan hệ san hô…) để người dùng đoán trước nơi sẽ tới
  const v = theme === 'toi' ? VUNG[vung] : VUNG_SANG;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, opacity: pressed ? 0.8 : 1 })}
    >
      <The
        style={{
          borderRadius: 18,
          padding: KHOANG.x3,
          minHeight: CHAM_TOI_THIEU + 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: BO_GOC.nho,
            backgroundColor: `rgba(${v.rgb},0.16)`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon ten={icon} size={20} mau={v.mau} />
        </View>
        <Text
          numberOfLines={2}
          style={{ flex: 1, fontFamily: FONT.displayVua, fontSize: 15, lineHeight: 18, color: mau.chu }}
        >
          {nhan}
        </Text>
      </The>
    </Pressable>
  );
}
