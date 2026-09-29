import { useRouter } from 'expo-router';
import { useEffect, useId, useMemo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  AnhDaiDien,
  Chu,
  ChuNhan,
  ChonPhanDoan,
  DauVung,
  Eyebrow,
  NenVung,
  NutChinh,
  NutChu,
  NutPhu,
  Pill,
  The,
  TheHero,
  useDemDayTab,
} from '@/giao-dien/co-ban';
import { TheGocNhin } from '@/giao-dien/the-goc-nhin';
import { BangViSao, LienKetViSao } from '@/giao-dien/vi-sao';
import { docMoc, docNhip, type NhipAi } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useNgonNgu } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { namAmHienTai, thangAmHienTai } from '@tuvi/bay-gio';
import {
  cacGiaiDoan,
  cacNam,
  cacThang,
  mocThanhGocNhin,
  nhipHienTai,
  tuoiAmTaiNam,
  type MocHanhTrinh,
} from '@tuvi/hanh-trinh';

/**
 * Hành trình — thời gian dưới dạng câu chuyện, không phải bảng tra.
 *
 * Cùng ba lớp với web (giai đoạn / năm / tháng), cùng dựng từ `lib/tuvi/hanh-trinh.ts`.
 * Màn hẹp nên ba lớp nằm sau một bộ chọn thay vì xếp chồng như web.
 *
 * Chữ tất định của engine hiện ngay; có phiên thì chữ model viết (`/api/moc`,
 * `/api/nhip`) thay vào khi về tới. Model hỏng thì trang vẫn đủ chữ, chỉ là chữ
 * cũ. Khách vẫn đọc được lớp tất định — ba tuyến kia cần đăng nhập nên app
 * không gọi, chỉ mời.
 *
 * Năm ở đây là năm ÂM, như web: khoá đệm chữ trên máy chủ có năm xem.
 *
 * Giao diện: Aurora bản 8 (`docs/thiet-ke/celes-ios/aurora/gen.py`, mục 2c).
 */

type Lop = 'giai-doan' | 'nam' | 'thang';

export default function ManHanhTrinh() {
  const router = useRouter();
  const { t, ngonNgu } = useNgonNgu();
  const mau = useMau();
  const v = useVung('hanhTrinh');
  const le = useSafeAreaInsets();
  const demDay = useDemDayTab();
  const { hoSo, laSo } = useHoSo();
  const { phien } = useTaiKhoan();

  const nay = useMemo(() => ({ nam: namAmHienTai(), thang: thangAmHienTai() }), []);
  const [lop, setLop] = useState<Lop>('giai-doan');
  const [namChon, setNamChon] = useState(nay.nam);
  const [namGiua, setNamGiua] = useState(nay.nam);
  const [thangChon, setThangChon] = useState(nay.thang);
  const [idGiaiDoan, setIdGiaiDoan] = useState<string | null>(null);
  const [moViSao, setMoViSao] = useState(false);

  useEffect(() => {
    ghiSuKien('journey_viewed');
  }, []);

  const giaiDoans = useMemo(() => (laSo ? cacGiaiDoan(laSo, nay.nam, ngonNgu) : []), [laSo, nay.nam, ngonNgu]);
  const nams = useMemo(
    () => (laSo ? cacNam(laSo, namGiua, nay.nam, ngonNgu) : []),
    [laSo, namGiua, nay.nam, ngonNgu]
  );
  const thangs = useMemo(
    () => (laSo ? cacThang(laSo, namChon, namChon === nay.nam ? nay.thang : null, ngonNgu) : []),
    [laSo, namChon, nay.nam, nay.thang, ngonNgu]
  );
  const nhip = useMemo(
    () => (laSo ? nhipHienTai(laSo, namChon, thangChon, ngonNgu) : null),
    [laSo, namChon, thangChon, ngonNgu]
  );

  /*
   * Chữ model viết. Khoá gồm cả lá số: đổi lá số mà giữ chữ cũ là đọc nhầm đời
   * người khác. Ba lớp gọi song song vì không phụ thuộc nhau.
   */
  const khoaMoc = hoSo && phien ? `${hoSo.ngaySinh}|${hoSo.gio}|${hoSo.gioiTinh}|${namChon}|${ngonNgu}` : null;
  const [mocAi, setMocAi] = useState<{ khoa: string; chu: Record<string, string> } | null>(null);
  useEffect(() => {
    if (!hoSo || !khoaMoc) return;
    let huy = false;
    Promise.all((['giai-doan', 'nam', 'thang'] as const).map((l) => docMoc(hoSo, l, namChon, ngonNgu))).then(
      (ds) => {
        if (!huy) setMocAi({ khoa: khoaMoc, chu: Object.assign({}, ...ds) });
      }
    );
    return () => {
      huy = true;
    };
  }, [hoSo, khoaMoc, namChon, ngonNgu]);

  const khoaNhip = khoaMoc ? `${khoaMoc}|${thangChon}` : null;
  const [nhipAi, setNhipAi] = useState<{ khoa: string; ai: NhipAi | null } | null>(null);
  useEffect(() => {
    if (!hoSo || !khoaNhip) return;
    let huy = false;
    docNhip(hoSo, namChon, thangChon, ngonNgu).then((ai) => {
      if (!huy) setNhipAi({ khoa: khoaNhip, ai });
    });
    return () => {
      huy = true;
    };
  }, [hoSo, khoaNhip, namChon, thangChon, ngonNgu]);

  const chuAi = mocAi && mocAi.khoa === khoaMoc ? mocAi.chu : {};
  const ai = nhipAi && nhipAi.khoa === khoaNhip ? nhipAi.ai : null;
  const dapChu = (m: MocHanhTrinh): MocHanhTrinh => (chuAi[m.id] ? { ...m, chuDe: chuAi[m.id] } : m);

  const dauMan = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ flex: 1, gap: KHOANG.x1 }}>
        <DauVung vung="hanhTrinh" ten={t.tab.hanhTrinh} />
        <Chu kieu="h1">
          {t.hanhTrinh.tieuDeDau} <ChuNhan vung="hanhTrinh">{t.hanhTrinh.tieuDeNhan}</ChuNhan>
        </Chu>
        <Chu kieu="bodySm" mo>
          {t.hanhTrinh.moTaNgan}
        </Chu>
      </View>
      <AnhDaiDien ten={hoSo?.ten} onPress={() => router.push('/toi')} nhan={t.tab.moTaiKhoan} />
    </View>
  );

  if (!laSo || !hoSo) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen }}>
        <NenVung vung="hanhTrinh" />
        <View style={{ paddingTop: le.top + 12, paddingHorizontal: LE_NGANG, gap: KHOANG.x6 }}>
          {dauMan}
          <Chu kieu="body" mo>
            {t.trangThai.rong}
          </Chu>
        </View>
      </View>
    );
  }

  const giaiDoanChon =
    giaiDoans.find((g) => g.id === idGiaiDoan) ?? giaiDoans.find((g) => g.dangDienRa) ?? giaiDoans[0];
  const namMoc = nams.find((n) => n.nhan === String(namChon));
  const thangMoc = thangs.find((x) => x.id === `thang-${namChon}-${thangChon}`);
  const dangONay = namChon === nay.nam && thangChon === nay.thang;

  /** Năm âm rơi vào một giai đoạn — để "Xem chi tiết" của quãng đang chọn đọc đúng quãng đó */
  const namTrongGiaiDoan = (m: MocHanhTrinh) => {
    const dv = m.cung.daiVan;
    if (!dv) return namChon;
    const tuoi = namChon - laSo.thongTin.amLich.nam + 1;
    if (tuoi >= dv.tuTuoi && tuoi <= dv.denTuoi) return namChon;
    return laSo.thongTin.amLich.nam + dv.tuTuoi - 1;
  };

  const moChiTiet = (cap: Lop, nam: number) =>
    router.push({ pathname: '/chi-tiet-han', params: { cap, nam: String(nam), thang: String(thangChon) } });

  const DaiMoc = ({ ds, idChon, onChon }: { ds: MocHanhTrinh[]; idChon?: string; onChon: (m: MocHanhTrinh) => void }) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -LE_NGANG }}
      contentContainerStyle={{ gap: KHOANG.x2, paddingHorizontal: LE_NGANG }}
    >
      {ds.map((m) => (
        <Pill
          key={m.id}
          vung="hanhTrinh"
          nhan={m.dangDienRa ? `${m.nhan} ·` : m.nhan}
          dangChon={m.id === idChon}
          onPress={() => onChon(m)}
        />
      ))}
    </ScrollView>
  );

  const ChiTiet = ({ moc, nhomChu, cap, nam }: { moc?: MocHanhTrinh; nhomChu: string; cap: Lop; nam: number }) =>
    moc ? (
      <View style={{ gap: KHOANG.x1 }}>
        <TheGocNhin gocNhin={mocThanhGocNhin(dapChu(moc), nhomChu)} mauNhan={v.mau} />
        <NutChu
          nhan={`${t.chiTietHan.xemChiTiet} →`}
          mauChu={v.mau}
          onPress={() => moChiTiet(cap, nam)}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    ) : null;

  const quangHero = giaiDoanChon ? dapChu(giaiDoanChon) : null;
  const tuoiNay = tuoiAmTaiNam(laSo, nay.nam);

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="hanhTrinh" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: demDay,
          gap: KHOANG.x4,
        }}
      >
        {dauMan}

        <ChonPhanDoan<Lop>
          vung="hanhTrinh"
          giaTri={lop}
          onChange={setLop}
          muc={[
            { gt: 'giai-doan', nhan: t.hanhTrinh.caDoi },
            { gt: 'nam', nhan: t.hanhTrinh.nam },
            { gt: 'thang', nhan: t.hanhTrinh.thang },
          ]}
        />

        {lop === 'giai-doan' && (
          <>
            <The style={{ paddingHorizontal: KHOANG.x4, paddingTop: 14, paddingBottom: 10, borderRadius: 22 }}>
              <DuongDoi giaiDoans={giaiDoans} tuoiNay={tuoiNay} />
            </The>

            {quangHero && (
              <TheHero vung="hanhTrinh" style={{ paddingVertical: 14, paddingHorizontal: KHOANG.x4, gap: 5 }}>
                <Eyebrow mauChu={v.mau}>
                  {quangHero.dangDienRa
                    ? dien(t.hanhTrinh.quangHienTai, { nhan: quangHero.nhan })
                    : `${quangHero.nhan} · ${quangHero.phu}`}
                </Eyebrow>
                <Chu kieu="h3">{quangHero.chuDe}</Chu>
                {quangHero.dangDienRa && (
                  <Chu kieu="caption" mo>
                    {quangHero.phu}
                  </Chu>
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x5, marginBottom: -KHOANG.x2 }}>
                  <NutChu
                    nhan={`${t.chiTietHan.xemChiTiet} →`}
                    mauChu={v.mau}
                    onPress={() => moChiTiet('giai-doan', namTrongGiaiDoan(quangHero))}
                  />
                  <LienKetViSao onPress={() => setMoViSao(true)} />
                </View>
              </TheHero>
            )}

            <View style={{ gap: KHOANG.x2 }}>
              <Eyebrow>{t.hanhTrinh.quangKhac}</Eyebrow>
              <DaiMoc ds={giaiDoans} idChon={giaiDoanChon?.id} onChon={(m) => setIdGiaiDoan(m.id)} />
              <Chu kieu="caption" mo>
                {t.hanhTrinh.giaiDoanMo}
              </Chu>
            </View>
          </>
        )}

        {lop === 'nam' && (
          <View style={{ gap: KHOANG.x3 }}>
            <Chu kieu="bodySm" mo>
              {t.hanhTrinh.namMo}
            </Chu>
            <DaiMoc
              ds={nams}
              idChon={`nam-${namChon}`}
              onChon={(m) => {
                setNamChon(Number(m.nhan));
                ghiSuKien('year_selected');
              }}
            />
            <View style={{ flexDirection: 'row', gap: KHOANG.x4 }}>
              <NutChu nhan={`← ${t.hanhTrinh.lui}`} mauChu={v.mau} onPress={() => setNamGiua((n) => n - 7)} />
              <NutChu nhan={`${t.hanhTrinh.toi} →`} mauChu={v.mau} onPress={() => setNamGiua((n) => n + 7)} />
            </View>
            <ChiTiet moc={namMoc} nhomChu={t.hanhTrinh.nam} cap="nam" nam={namChon} />
          </View>
        )}

        {lop === 'thang' && (
          <View style={{ gap: KHOANG.x3 }}>
            <Chu kieu="h3">{dien(t.hanhTrinh.thangTieuDe, { nam: namChon })}</Chu>
            <Chu kieu="bodySm" mo>
              {t.hanhTrinh.thangMo}
            </Chu>
            <DaiMoc
              ds={thangs}
              idChon={`thang-${namChon}-${thangChon}`}
              onChon={(m) => {
                setThangChon(Number(m.id.split('-')[2]));
                ghiSuKien('month_selected');
              }}
            />
            <ChiTiet moc={thangMoc} nhomChu={t.hanhTrinh.thang} cap="thang" nam={namChon} />
          </View>
        )}

        {/* Ba lớp gộp thành một đoạn */}
        {nhip && (
          <View style={{ gap: KHOANG.x3, marginTop: KHOANG.x2 }}>
            <Eyebrow>{t.hanhTrinh.nhipLucNay}</Eyebrow>
            <TheGocNhin gocNhin={ai ? { ...nhip, noiDung: ai.ghepLai } : nhip} noiBat mauNhan={v.mau} />
            {ai &&
              (
                [
                  [t.hanhTrinh.dangMo, ai.dangMo],
                  [t.hanhTrinh.dangCang, ai.dangCang],
                  [t.hanhTrinh.canCho, ai.canCho],
                ] as const
              ).map(([nhan, cd]) => (
                <The key={nhan} style={{ gap: KHOANG.x2 }}>
                  <Eyebrow mauChu={v.mau}>{nhan}</Eyebrow>
                  {!!cd.tieuDe && <Chu kieu="h3">{cd.tieuDe}</Chu>}
                  <Chu kieu="bodySm" mo>
                    {cd.noiDung}
                  </Chu>
                </The>
              ))}
            {!dangONay && (
              <NutPhu
                nhan={t.hanhTrinh.veHienTai}
                onPress={() => {
                  setNamChon(nay.nam);
                  setNamGiua(nay.nam);
                  setThangChon(nay.thang);
                  setIdGiaiDoan(null);
                }}
              />
            )}
          </View>
        )}

        {!phien && (
          <The am style={{ gap: KHOANG.x3 }}>
            <Chu kieu="bodySm">{t.hanhTrinh.moiDangNhap}</Chu>
            <NutChinh nhan={t.luanGiai.dangNhapNut} onPress={() => router.push('/dang-nhap?sau=quay-lai')} />
          </The>
        )}

        <NutPhu nhan={t.hanhTrinh.hoiVe} icon="sparkle" onPress={() => router.push('/(tabs)/celes')} />

        {/* Nói thẳng lớp còn thiếu, thay vì để người dùng tự đoán */}
        <The style={{ gap: KHOANG.x2 }}>
          <Eyebrow>{t.hanhTrinh.ngayTieuDe}</Eyebrow>
          <Chu kieu="bodySm" mo>
            {t.hanhTrinh.ngayMo}
          </Chu>
        </The>
      </ScrollView>

      {quangHero && (
        <BangViSao
          hienThi={moViSao}
          onDong={() => setMoViSao(false)}
          canCu={quangHero.canCu}
          tomTat={quangHero.chuDe}
        />
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Đường đời */

const CAO = 186;
/** Lề trái/phải của trục trong khung vẽ — như bản thiết kế (16..334 trên 350) */
const LE_TRUC = 16;
const KHUNG_TUOI = 25;
const DAY = 150;

/**
 * Đường đời 25 năm quanh tuổi hiện tại: quãng đã qua là nét liền có quầng,
 * quãng tới là nét đứt; dải sáng là đại vận đang đi; chấm nhỏ là chỗ chuyển quãng.
 *
 * Độ cao của đường KHÔNG phải điểm tốt/xấu — engine chưa có thước đo đó, và vẽ
 * đỉnh/đáy tuỳ ý là nói điều lá số không nói. Mỗi quãng mười năm vì thế là một
 * nhịp sóng đều nhau: chỉ cho thấy nhịp, không chấm điểm.
 */
function DuongDoi({ giaiDoans, tuoiNay }: { giaiDoans: MocHanhTrinh[]; tuoiNay: number }) {
  const { t } = useNgonNgu();
  const mau = useMau();
  const v = useVung('hanhTrinh');
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const id = `dd-${useId().replace(/:/g, '')}`;

  // Bề ngang thật của khung: lề màn + đệm thẻ + viền
  const W = Math.max(240, width - LE_NGANG * 2 - KHOANG.x4 * 2 - 2);

  const quang = giaiDoans.find((g) => g.dangDienRa) ?? giaiDoans[0];
  const dv = quang?.cung.daiVan;
  if (!dv) return null;

  const tu = Math.max(0, Math.floor((tuoiNay - 12) / 5) * 5);
  const den = tu + KHUNG_TUOI;
  const xTuoi = (a: number) => LE_TRUC + ((a - tu) * (W - LE_TRUC * 2)) / KHUNG_TUOI;
  const yTuoi = (a: number) => 95 - 24 * Math.sin((2 * Math.PI * (a - dv.tuTuoi)) / 10);

  const net = (a: number, b: number) => {
    let d = '';
    for (let x = a; x <= b + 1e-6; x += 0.25) {
      d += `${d ? 'L' : 'M'}${xTuoi(x).toFixed(1)} ${yTuoi(x).toFixed(1)} `;
    }
    return d;
  };

  const nay = Math.min(den, Math.max(tu, tuoiNay));
  const xn = xTuoi(nay);
  const yn = yTuoi(nay);
  const daQua = net(tu, nay);
  const sapToi = net(nay, den);

  const dTu = xTuoi(Math.max(tu, dv.tuTuoi));
  const dDen = xTuoi(Math.min(den, dv.denTuoi + 1));

  const chuyenQuang = giaiDoans
    .map((g) => g.cung.daiVan?.tuTuoi)
    .filter((a): a is number => a !== undefined && a > tu && a < den && Math.abs(a - nay) > 0.8);

  const vach = Array.from({ length: KHUNG_TUOI / 5 + 1 }, (_, i) => tu + i * 5);
  const rongNhan = 84;
  const trai = Math.min(W - rongNhan, Math.max(0, xn - rongNhan / 2));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={dien(t.hanhTrinh.duongDoiNhan, { tu, den, tuoi: tuoiNay, quang: quang.nhan })}
      style={{ width: W, height: CAO }}
    >
      <Svg width={W} height={CAO}>
        <Defs>
          <LinearGradient id={`${id}-net`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={v.mau} stopOpacity={0.55} />
            <Stop offset="0.6" stopColor={v.mau} />
            <Stop offset="1" stopColor={v.sang} />
          </LinearGradient>
          <LinearGradient id={`${id}-vung`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={v.mau} stopOpacity={0.26} />
            <Stop offset="1" stopColor={v.mau} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={dTu} y={10} width={Math.max(0, dDen - dTu)} height={140} rx={10} fill={`rgba(${v.rgb},0.07)`} />

        <Path d={`${daQua}L${xn.toFixed(1)} ${DAY} L${xTuoi(tu).toFixed(1)} ${DAY} Z`} fill={`url(#${id}-vung)`} />
        <Path d={daQua} fill="none" stroke={v.mau} strokeOpacity={0.22} strokeWidth={9} strokeLinecap="round" />
        <Path d={daQua} fill="none" stroke={`url(#${id}-net)`} strokeWidth={3} strokeLinecap="round" />
        <Path
          d={sapToi}
          fill="none"
          stroke={mau.chuNhat}
          strokeWidth={2}
          strokeDasharray="3 6"
          strokeLinecap="round"
        />

        <Line x1={xn} y1={24} x2={xn} y2={DAY} stroke={v.sang} strokeOpacity={0.5} strokeDasharray="2 4" />

        {chuyenQuang.map((a) => (
          <Circle key={a} cx={xTuoi(a)} cy={yTuoi(a)} r={5} fill={mau.nen} stroke={v.mau} strokeWidth={2.5} />
        ))}

        <Circle cx={xn} cy={yn} r={14} fill={v.mau} opacity={0.28} />
        <Circle cx={xn} cy={yn} r={7.5} fill={v.sang} stroke={mau.nen} strokeWidth={3} />
      </Svg>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: trai,
          width: rongNhan,
          height: 22,
          borderRadius: 11,
          backgroundColor: v.sang,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontFamily: FONT.thanRatDam, fontSize: 11, color: theme === 'toi' ? '#06231E' : '#FFFFFF' }}
        >
          {dien(t.hanhTrinh.bayGio, { tuoi: tuoiNay })}
        </Text>
      </View>

      {vach.map((a) => (
        <Text
          key={a}
          style={{
            position: 'absolute',
            top: 162,
            left: xTuoi(a) - 16,
            width: 32,
            textAlign: 'center',
            fontFamily: FONT.mono,
            fontSize: 11,
            color: mau.chuMo,
          }}
        >
          {a}
        </Text>
      ))}
    </View>
  );
}
