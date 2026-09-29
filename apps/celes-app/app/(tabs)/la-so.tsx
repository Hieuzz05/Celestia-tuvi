import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnhDaiDien,
  BeMatKinh,
  Chu,
  ChonPhanDoan,
  DauVung,
  Eyebrow,
  HangDanhSach,
  KeNgang,
  NenVung,
  NutChinh,
  NutPhu,
  The,
  TheHero,
  useDemDayTab,
} from '@/giao-dien/co-ban';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import {
  CauTraLoi,
  DangDoc,
  ICON_CHU_DE,
  THE_DAU,
  TheCanDangNhap,
  useBaiLuan,
} from '@/giao-dien/luan-giai';
import { ManhYeu } from '@/giao-dien/manh-yeu';
import { MenhBanDayDu } from '@/giao-dien/menh-ban';
import { useHoSo } from '@/du-lieu/ho-so';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { BO_GOC, FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { CAU_HOI_V3, CHU_DE_V3 } from '@khung-v3';
import { chiTietDiemTungCung } from '@/lib/rag/v3/du-kien';

/**
 * Tab Lá số — bốn chế độ sau một bộ chọn (Aurora bản 8, mục Lá số):
 *
 * - Lá số: mệnh bàn đầy đủ (`MenhBanDayDu`, cùng bản với `/ban-do`).
 * - Tổng quan: bài tổng quan đọc ngay trong tab — ba câu đầu là "Đánh giá
 *   chung", phần còn lại là "Bức tranh chung". Logic đọc là `useBaiLuan`,
 *   chung với màn `/luan-giai/[nhom]`.
 * - Chuyên sâu: lưới 14 chủ đề; màu ô biểu tượng theo mức của cung chính chủ
 *   đề đó (điểm engine, `chiTietDiemTungCung`).
 * - Mạnh–yếu: radar 12 lĩnh vực + vì sao (`ManhYeu`).
 *
 * Chỉ chế độ đang mở mới được dựng, nên bài tổng quan chỉ gọi máy chủ khi
 * người dùng thật sự mở Tổng quan.
 */

type CheDo = 'la-so' | 'tong-quan' | 'chuyen-sau' | 'manh-yeu';

const SO_CAU_CHUYEN_SAU = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau').length;

export default function ManLaSo() {
  const t = useT();
  const router = useRouter();
  const { mau } = useTheme();
  const le = useSafeAreaInsets();
  const demDay = useDemDayTab();
  const { hoSo, laSo } = useHoSo();
  const [cheDo, setCheDo] = useState<CheDo>('la-so');

  const ten = hoSo?.ten?.trim();
  const phu =
    cheDo === 'la-so'
      ? t.laSoTab.phu.laSo
      : cheDo === 'tong-quan'
        ? t.laSoTab.phu.tongQuan
        : cheDo === 'chuyen-sau'
          ? dien(t.laSoTab.phu.chuyenSau, { so: SO_CAU_CHUYEN_SAU })
          : t.laSoTab.phu.manhYeu;

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="laSo" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: demDay,
          gap: KHOANG.x4,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, gap: KHOANG.x1 }}>
            <DauVung vung="laSo" ten={t.tab.laSo} />
            <Chu kieu="h1">{ten ? dien(t.laSoTab.tieuDe, { ten }) : t.laSoTab.tieuDeKhach}</Chu>
            <Chu kieu="bodySm" mo>
              {phu}
            </Chu>
          </View>
          <AnhDaiDien ten={hoSo?.ten} onPress={() => router.push('/toi')} nhan={t.tab.moTaiKhoan} />
        </View>

        {!laSo || !hoSo ? (
          <Chu kieu="body" mo>
            {t.trangThai.rong}
          </Chu>
        ) : (
          <>
            <ChonPhanDoan<CheDo>
              vung="laSo"
              giaTri={cheDo}
              onChange={setCheDo}
              muc={[
                { gt: 'la-so', nhan: t.laSoTab.cheDo.laSo },
                { gt: 'tong-quan', nhan: t.laSoTab.cheDo.tongQuan },
                { gt: 'chuyen-sau', nhan: t.laSoTab.cheDo.chuyenSau },
                { gt: 'manh-yeu', nhan: t.laSoTab.cheDo.manhYeu },
              ]}
            />

            {cheDo === 'la-so' && <MenhBanDayDu laSo={laSo} />}
            {cheDo === 'tong-quan' && <TongQuan moChuyenSau={() => setCheDo('chuyen-sau')} />}
            {cheDo === 'chuyen-sau' && <ChuyenSau />}
            {cheDo === 'manh-yeu' && <ManhYeu laSo={laSo} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ================================================================ Tổng quan */

const DAU_THE: Record<string, { icon: TenIcon; loai: 'tot2' | 'canY' | 'vang' }> = {
  TQ02: { icon: 'sparkle', loai: 'tot2' },
  TQ03: { icon: 'shield', loai: 'canY' },
  TQ08: { icon: 'path', loai: 'vang' },
};

function TongQuan({ moChuyenSau }: { moChuyenSau: () => void }) {
  const t = useT();
  const router = useRouter();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const { tt, thuLai } = useBaiLuan('tong-quan');

  const hoiCeles = () =>
    router.push({
      pathname: '/(tabs)/celes',
      params: { q: dien(t.luanGiai.cauHoiChuDe, { ten: t.luanGiai.tongQuan.toLowerCase() }) },
    });

  if (tt?.loai === 'can-dang-nhap')
    return <TheCanDangNhap moTa={tt.gioiHanKhach ? t.luanGiai.gioiHanKhach : undefined} />;
  if (tt?.loai === 'loi')
    return (
      <View style={{ gap: KHOANG.x3 }}>
        <Chu kieu="body">{t.luanGiai.loi}</Chu>
        <NutPhu nhan={t.chung.thuLai} onPress={thuLai} />
      </View>
    );
  if (tt?.loai !== 'xong') return <DangDoc />;

  const dau = tt.cau.filter((c) => THE_DAU.includes(c.id));
  const conLai = tt.cau.filter((c) => !THE_DAU.includes(c.id));
  const tongConLai = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && !THE_DAU.includes(q.id)).length;

  return (
    <View style={{ gap: KHOANG.x5 }}>
      <View style={{ gap: KHOANG.x3 }}>
        <View style={{ gap: 2 }}>
          <Eyebrow mauChu={v.mau}>{t.laSoTab.danhGiaChung}</Eyebrow>
          <Chu kieu="caption" mo>
            {t.laSoTab.baDiem}
          </Chu>
        </View>
        {dau.map((c) => {
          const d = DAU_THE[c.id] ?? { icon: 'sparkle' as TenIcon, loai: 'tot2' as const };
          const m = mau[d.loai];
          return (
            <The key={c.id} style={{ gap: KHOANG.x3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    backgroundColor: m.nen,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon ten={d.icon} size={16} mau={m.chu} />
                </View>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase', color: m.chu }}>
                  {t.laSoTab.theDau[c.id] ?? ''}
                </Text>
              </View>
              <CauTraLoi cau={c} />
            </The>
          );
        })}
      </View>

      {(conLai.length > 0 || tt.dangTiep) && (
        <View style={{ gap: KHOANG.x3 }}>
          <Eyebrow mauChu={v.mau}>{t.laSoTab.bucTranhChung}</Eyebrow>
          {conLai.map((c, i) => (
            <The key={c.id} style={{ gap: KHOANG.x2 }}>
              <Chu kieu="caption" mo>
                {dien(t.laSoTab.cauSo, { i: i + 1, n: tongConLai })}
              </Chu>
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
        </View>
      )}

      {!tt.dangTiep && (
        <>
          <TheHero vung="laSo" style={{ gap: KHOANG.x3 }}>
            <Eyebrow mauChu={v.mau}>{t.laSoTab.heroNhan}</Eyebrow>
            <Chu kieu="h2">{t.laSoTab.heroTieuDe}</Chu>
            <Chu kieu="bodySm" mo>
              {dien(t.laSoTab.heroPhu, { so: SO_CAU_CHUYEN_SAU })}
            </Chu>
            <NutChinh nhan={t.laSoTab.xem14} onPress={moChuyenSau} />
          </TheHero>
          <NutPhu nhan={t.luanGiai.hoiCeles} icon="sparkle" onPress={hoiCeles} />
        </>
      )}
    </View>
  );
}

/* ================================================================ Chuyên sâu */

function ChuyenSau() {
  const t = useT();
  const router = useRouter();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const { laSo } = useHoSo();

  const mucCung = useMemo(() => {
    const m = new Map<string, 'Mạnh' | 'Bình' | 'Cần gắng'>();
    if (laSo) for (const d of chiTietDiemTungCung(laSo)) m.set(d.cung, d.muc);
    return m;
  }, [laSo]);

  const soCau = (id: string) => CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === id).length;
  const moChuDe = (id: string) => router.push({ pathname: '/luan-giai/[nhom]', params: { nhom: id } });

  return (
    <View style={{ gap: KHOANG.x4 }}>
      <View style={{ gap: 2 }}>
        <Eyebrow mauChu={v.mau}>{t.laSoTab.muoiBon}</Eyebrow>
        <Chu kieu="caption" mo>
          {t.laSoTab.luuLai}
        </Chu>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {CHU_DE_V3.map((c) => {
          const muc = c.id === 'van-han' ? undefined : mucCung.get(c.cungChinh);
          const m = muc === 'Mạnh' ? mau.tot2 : muc === 'Cần gắng' ? mau.canY : null;
          const nen = m?.nen ?? `rgba(${v.rgb},0.14)`;
          const chu = m?.chu ?? v.mau;
          const n = soCau(c.id);
          const tenCd = t.luanGiai.chuDe[c.id] ?? c.ten;
          return (
            <Pressable
              key={c.id}
              onPress={() => moChuDe(c.id)}
              accessibilityRole="button"
              accessibilityLabel={tenCd}
              style={({ pressed }) => ({
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 64,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: mau.vien,
                backgroundColor: mau.the,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View
                style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: nen, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon ten={ICON_CHU_DE[c.id] ?? 'sparkle'} size={16} mau={chu} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text numberOfLines={2} style={{ fontFamily: FONT.thanDam, fontSize: 14, lineHeight: 18, color: mau.chu }}>
                  {tenCd}
                </Text>
                <Text style={{ fontFamily: FONT.than, fontSize: 12, lineHeight: 16, color: mau.chuMo }}>
                  {c.id === 'van-han' ? t.laSoTab.vanHanMoTa : dien(t.laSoTab.soCau, { so: n })}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <BeMatKinh style={{ borderRadius: BO_GOC.the, paddingHorizontal: KHOANG.x4, paddingVertical: KHOANG.x1 }}>
        <HangDanhSach
          icon="book"
          mauIcon={v.mau}
          nhan={t.luanGiai.tongQuan}
          phu={t.luanGiai.tongQuanMoTa}
          onPress={() => moChuDe('tong-quan')}
        />
        <KeNgang />
        <HangDanhSach
          icon="radar"
          mauIcon={v.mau}
          nhan={t.luanGiai.bucTranh}
          phu={t.luanGiai.bucTranhMoTa}
          onPress={() => router.push('/luan-giai/buc-tranh')}
        />
      </BeMatKinh>
    </View>
  );
}
