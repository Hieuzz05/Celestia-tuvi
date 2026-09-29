import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, ChonPhanDoan, Eyebrow, NutChinh, NutChu, NutPhu, Pill, The } from '@/giao-dien/co-ban';
import { MAU_LINH_VUC } from '@/giao-dien/icon';
import { TheGocNhin } from '@/giao-dien/the-goc-nhin';
import { docMoc, docNhip, type NhipAi } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useNgonNgu } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { namAmHienTai, thangAmHienTai } from '@tuvi/bay-gio';
import {
  cacGiaiDoan,
  cacNam,
  cacThang,
  mocThanhGocNhin,
  nhipHienTai,
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
 */

type Lop = 'giai-doan' | 'nam' | 'thang';

export default function ManHanhTrinh() {
  const router = useRouter();
  const { t, ngonNgu } = useNgonNgu();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { hoSo, laSo } = useHoSo();
  const { phien } = useTaiKhoan();

  const nay = useMemo(() => ({ nam: namAmHienTai(), thang: thangAmHienTai() }), []);
  const [lop, setLop] = useState<Lop>('giai-doan');
  const [namChon, setNamChon] = useState(nay.nam);
  const [namGiua, setNamGiua] = useState(nay.nam);
  const [thangChon, setThangChon] = useState(nay.thang);
  const [idGiaiDoan, setIdGiaiDoan] = useState<string | null>(null);

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

  if (!laSo || !hoSo) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen, padding: LE_NGANG, paddingTop: le.top + KHOANG.x10 }}>
        <Chu kieu="body" mo>
          {t.trangThai.rong}
        </Chu>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: KHOANG.x2 }}>
      {ds.map((m) => (
        <Pill
          key={m.id}
          nhan={m.dangDienRa ? `${m.nhan} ·` : m.nhan}
          dangChon={m.id === idChon}
          onPress={() => onChon(m)}
        />
      ))}
    </ScrollView>
  );

  const ChiTiet = ({ moc, nhomChu, cap, nam }: { moc?: MocHanhTrinh; nhomChu: string; cap: Lop; nam: number }) =>
    moc ? (
      <View style={{ gap: KHOANG.x2 }}>
        <TheGocNhin gocNhin={mocThanhGocNhin(dapChu(moc), nhomChu)} />
        <NutChu
          nhan={`${t.chiTietHan.xemChiTiet} →`}
          onPress={() => moChiTiet(cap, nam)}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x4,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x6,
        }}
      >
        <View style={{ gap: KHOANG.x2 }}>
          <Chu kieu="h2">{t.hanhTrinh.tieuDe}</Chu>
          <Chu kieu="bodySm" mo>
            {t.hanhTrinh.moTa}
          </Chu>
        </View>

        {/* Ba lớp gộp thành một đoạn — thứ đọc trước tiên */}
        {nhip && (
          <View style={{ gap: KHOANG.x3 }}>
            <TheGocNhin gocNhin={ai ? { ...nhip, noiDung: ai.ghepLai } : nhip} noiBat mauNhan={MAU_LINH_VUC.celes} />
            {ai &&
              (
                [
                  [t.hanhTrinh.dangMo, ai.dangMo],
                  [t.hanhTrinh.dangCang, ai.dangCang],
                  [t.hanhTrinh.canCho, ai.canCho],
                ] as const
              ).map(([nhan, cd]) => (
                <The key={nhan} style={{ gap: KHOANG.x2 }}>
                  <Eyebrow>{nhan}</Eyebrow>
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

        <ChonPhanDoan<Lop>
          giaTri={lop}
          onChange={setLop}
          muc={[
            { gt: 'giai-doan', nhan: t.hanhTrinh.giaiDoan },
            { gt: 'nam', nhan: t.hanhTrinh.nam },
            { gt: 'thang', nhan: t.hanhTrinh.thang },
          ]}
        />

        {lop === 'giai-doan' && (
          <View style={{ gap: KHOANG.x4 }}>
            <Chu kieu="bodySm" mo>
              {t.hanhTrinh.giaiDoanMo}
            </Chu>
            <DaiMoc ds={giaiDoans} idChon={giaiDoanChon?.id} onChon={(m) => setIdGiaiDoan(m.id)} />
            {giaiDoanChon && (
              <ChiTiet
                moc={giaiDoanChon}
                nhomChu={t.hanhTrinh.giaiDoan}
                cap="giai-doan"
                nam={namTrongGiaiDoan(giaiDoanChon)}
              />
            )}
          </View>
        )}

        {lop === 'nam' && (
          <View style={{ gap: KHOANG.x4 }}>
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
              <NutChu nhan={`← ${t.hanhTrinh.lui}`} onPress={() => setNamGiua((n) => n - 7)} />
              <NutChu nhan={`${t.hanhTrinh.toi} →`} onPress={() => setNamGiua((n) => n + 7)} />
            </View>
            <ChiTiet moc={namMoc} nhomChu={t.hanhTrinh.nam} cap="nam" nam={namChon} />
          </View>
        )}

        {lop === 'thang' && (
          <View style={{ gap: KHOANG.x4 }}>
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

        <NutPhu nhan={t.hanhTrinh.hoiVe} onPress={() => router.push('/(tabs)/celes')} />

        {/* Nói thẳng lớp còn thiếu, thay vì để người dùng tự đoán */}
        <The style={{ gap: KHOANG.x2 }}>
          <Eyebrow>{t.hanhTrinh.ngayTieuDe}</Eyebrow>
          <Chu kieu="bodySm" mo>
            {t.hanhTrinh.ngayMo}
          </Chu>
        </The>
      </ScrollView>
    </View>
  );
}
