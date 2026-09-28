import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutChinh, NutPhu, The } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { DangDoc, tachDoan, TheCanDangNhap } from '@/giao-dien/luan-giai';
import { docBucTranhV3, LoiCanDangNhap, type BucTranh } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Bức tranh lớn — máy chủ ghép phần "tóm lại" của những chủ đề đã đọc. Chưa đủ
 * số chủ đề tối thiểu thì máy chủ trả `canToiThieu`, app mời đọc thêm thay vì
 * báo lỗi.
 */
export default function ManBucTranh() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
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
    <ScrollView
      style={{ flex: 1, backgroundColor: mau.nen }}
      contentContainerStyle={{
        paddingTop: le.top + KHOANG.x2,
        paddingHorizontal: LE_NGANG,
        paddingBottom: le.bottom + KHOANG.x12,
        gap: KHOANG.x6,
      }}
    >
      <View style={{ gap: KHOANG.x2 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.chung.quayLai}
          hitSlop={8}
          style={{ width: CHAM_TOI_THIEU, height: CHAM_TOI_THIEU, justifyContent: 'center', marginLeft: -KHOANG.x3 }}
        >
          <IconQuayLai size={22} mau={mau.chu} />
        </Pressable>
        <Eyebrow>{t.luanGiai.tieuDe}</Eyebrow>
        <Chu kieu="h2">{t.luanGiai.bucTranh}</Chu>
        <Chu kieu="bodySm" mo>
          {t.luanGiai.bucTranhMoTa}
        </Chu>
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
          <The style={{ gap: KHOANG.x3 }}>
            {tachDoan(bt.bucTranh).map((d, i) => (
              <Chu key={i} kieu="body">
                {d}
              </Chu>
            ))}
          </The>
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
  );
}
