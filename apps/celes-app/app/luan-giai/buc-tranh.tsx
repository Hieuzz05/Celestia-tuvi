import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NenVung, NutChinh, NutIcon, NutPhu, The, TheHero } from '@/giao-dien/co-ban';
import { DangDoc, tachDoan, TheCanDangNhap } from '@/giao-dien/luan-giai';
import { docBucTranhV3, LoiCanDangNhap, type BucTranh } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Bức tranh lớn — máy chủ ghép phần "tóm lại" của những chủ đề đã đọc. Chưa đủ
 * số chủ đề tối thiểu thì máy chủ trả `canToiThieu`, app mời đọc thêm thay vì
 * báo lỗi.
 */
export default function ManBucTranh() {
  const router = useRouter();
  const t = useT();
  const { mau } = useTheme();
  const v = useVung('laSo');
  const le = useSafeAreaInsets();
  const { hoSo } = useHoSo();
  const { phien } = useTaiKhoan();

  const [lanThu, setLanThu] = useState(0);
  const khoa = hoSo && phien ? `${hoSo.ngaySinh}|${hoSo.gio}|${hoSo.gioiTinh}|${lanThu}` : null;
  const [kq, setKq] = useState<{ khoa: string; bt?: BucTranh; loi?: 'dang-nhap' | 'khac' } | null>(null);

  useEffect(() => {
    if (!hoSo || !khoa) return;
    let huy = false;
    docBucTranhV3(hoSo)
      .then((bt) => !huy && setKq({ khoa, bt }))
      .catch((e) => !huy && setKq({ khoa, loi: e instanceof LoiCanDangNhap ? 'dang-nhap' : 'khac' }));
    return () => {
      huy = true;
    };
  }, [hoSo, khoa]);

  const hienTai = kq && kq.khoa === khoa ? kq : null;
  const bt = hienTai?.bt;
  const thieu = bt && !bt.bucTranh ? Math.max(1, (bt.canToiThieu ?? 0) - bt.soChuDe) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="laSo" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x12,
          gap: KHOANG.x5,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <View style={{ gap: KHOANG.x2 }}>
            <Eyebrow mauChu={v.mau}>{t.luanGiai.tieuDe}</Eyebrow>
            <Chu kieu="h1">{t.luanGiai.bucTranh}</Chu>
            <Chu kieu="bodySm" mo>
              {t.luanGiai.bucTranhMoTa}
            </Chu>
          </View>
        </View>

        {!hoSo ? (
          <Chu kieu="body" mo>
            {t.trangThai.rong}
          </Chu>
        ) : !phien || hienTai?.loi === 'dang-nhap' ? (
          <TheCanDangNhap />
        ) : hienTai?.loi ? (
          <View style={{ gap: KHOANG.x3 }}>
            <Chu kieu="body">{t.luanGiai.loi}</Chu>
            <NutPhu nhan={t.chung.thuLai} onPress={() => setLanThu((n) => n + 1)} />
          </View>
        ) : !bt ? (
          <DangDoc />
        ) : bt.bucTranh ? (
          <>
            <TheHero vung="laSo" style={{ gap: KHOANG.x3 }}>
              {tachDoan(bt.bucTranh).map((d, i) => (
                <Chu key={i} kieu="body" style={{ fontSize: 15.5, lineHeight: 24 }}>
                  {d}
                </Chu>
              ))}
            </TheHero>
            <Chu kieu="caption" mo>
              {dien(t.luanGiai.bucTranhTu, { so: String(bt.soChuDe) })}
            </Chu>
            <NutPhu nhan={t.luanGiai.docChuDe} onPress={() => router.push('/luan-giai')} />
          </>
        ) : (
          <The am style={{ gap: KHOANG.x3 }}>
            <Chu kieu="body">{dien(t.luanGiai.bucTranhThieu, { so: String(thieu) })}</Chu>
            <NutChinh nhan={t.luanGiai.docChuDe} onPress={() => router.push('/luan-giai')} />
          </The>
        )}
      </ScrollView>
    </View>
  );
}
