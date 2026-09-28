import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutChinh, NutPhu, The } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { CauTraLoi, DangDoc, tachDoan, TheCanDangNhap } from '@/giao-dien/luan-giai';
import { docNhomV3, docTomLaiV3, LoiCanDangNhap, type CauV3 } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { CAU_HOI_V3, CHU_DE_V3 } from '@khung-v3';

/**
 * Một bài luận: tổng quan (`nhom = tong-quan`) hoặc một trong 14 mặt đời.
 *
 * Gọi cùng tuyến `/api/luan-giai-v3` với web, cùng năm xem (năm dương lịch) và
 * cùng cách chia lượt, nên bài web đã viết thì app mở ra có ngay — máy chủ đệm
 * theo lá số chứ không theo người.
 *
 * Chia HAI LƯỢT NỐI TIẾP như web: nửa đầu hiện trước, nửa sau viết tiếp khi
 * người đọc còn đang đọc. Một lượt cả nhóm thì phải chờ câu chậm nhất.
 * Tổng quan: ba câu của ba thẻ đầu web (TQ02, TQ03, TQ08) đi trước.
 *
 * Tổng quan mở cho khách; chủ đề sâu cần đăng nhập — khỏi gọi máy chủ khi biết
 * chắc sẽ nhận 401.
 */

const THE_DAU = ['TQ02', 'TQ03', 'TQ08'];

function chiaLuot(nhom: string): [string[], string[]] {
  if (nhom === 'tong-quan') {
    const sau = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && !THE_DAU.includes(q.id)).map((q) => q.id);
    return [THE_DAU, sau];
  }
  const ids = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === nhom).map((q) => q.id);
  const dau = ids.length >= 4 ? Math.ceil(ids.length / 2) : ids.length;
  return [ids.slice(0, dau), ids.slice(dau)];
}

type TrangThai =
  | { loai: 'dang-doc' }
  | { loai: 'can-dang-nhap'; gioiHanKhach?: boolean }
  | { loai: 'loi' }
  | { loai: 'xong'; cau: CauV3[]; dangTiep: boolean; loiSau: boolean };

export default function ManBaiLuan() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { nhom = 'tong-quan' } = useLocalSearchParams<{ nhom: string }>();
  const { hoSo } = useHoSo();
  const { phien } = useTaiKhoan();

  const laTongQuan = nhom === 'tong-quan';
  const viTri = CHU_DE_V3.findIndex((c) => c.id === nhom);
  const hopLe = laTongQuan || viTri >= 0;
  const ten = laTongQuan ? t.luanGiai.tongQuan : (t.luanGiai.chuDe[nhom] ?? CHU_DE_V3[viTri]?.ten ?? '');
  const chuDeSau = !laTongQuan && viTri >= 0 ? CHU_DE_V3[viTri + 1] : undefined;
  const canDangNhap = !laTongQuan && !phien;

  const [lanThu, setLanThu] = useState(0);
  const khoa = hoSo && hopLe && !canDangNhap ? `${hoSo.ngaySinh}|${hoSo.gio}|${hoSo.gioiTinh}|${nhom}|${lanThu}` : null;
  const [kq, setKq] = useState<{ khoa: string; tt: TrangThai } | null>(null);
  const [tomLai, setTomLai] = useState<{ khoa: string; chu: string | null; xong: boolean } | null>(null);

  useEffect(() => {
    if (!hoSo || !khoa) return;
    let huy = false;
    const [dau, sau] = chiaLuot(nhom);
    const dat = (tt: TrangThai) => !huy && setKq({ khoa, tt });

    const bienLoi = (e: unknown): TrangThai =>
      e instanceof LoiCanDangNhap
        ? { loai: 'can-dang-nhap', gioiHanKhach: e.message === 'gioi-han-khach' }
        : { loai: 'loi' };

    docNhomV3(hoSo, nhom, dau)
      .then(async (cauDau) => {
        dat({ loai: 'xong', cau: cauDau, dangTiep: sau.length > 0, loiSau: false });
        let cau = cauDau;
        if (sau.length > 0) {
          try {
            cau = [...cauDau, ...(await docNhomV3(hoSo, nhom, sau))];
            dat({ loai: 'xong', cau, dangTiep: false, loiSau: false });
          } catch {
            dat({ loai: 'xong', cau, dangTiep: false, loiSau: true });
          }
        }
        // Tổng quan không có "tóm lại" — web cũng không có
        if (laTongQuan || huy) return;
        const chu = await docTomLaiV3(hoSo, nhom);
        if (!huy) setTomLai({ khoa, chu, xong: true });
      })
      .catch((e) => dat(bienLoi(e)));

    return () => {
      huy = true;
    };
  }, [hoSo, khoa, nhom, laTongQuan]);

  const tt: TrangThai | null = canDangNhap
    ? { loai: 'can-dang-nhap' }
    : kq && kq.khoa === khoa
      ? kq.tt
      : khoa
        ? { loai: 'dang-doc' }
        : null;
  const tom = tomLai && tomLai.khoa === khoa ? tomLai : null;

  const hoiCeles = () =>
    router.push({
      pathname: '/(tabs)/celes',
      params: { q: dien(t.luanGiai.cauHoiChuDe, { ten: ten.toLowerCase() }) },
    });

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
        <Chu kieu="h2">{ten}</Chu>
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
          <NutPhu nhan={t.chung.thuLai} onPress={() => setLanThu((n) => n + 1)} />
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
              <NutPhu nhan={t.chung.thuLai} onPress={() => setLanThu((n) => n + 1)} />
            </View>
          )}

          {!laTongQuan && !tt.dangTiep && !tt.loiSau && (
            <The am style={{ gap: KHOANG.x2 }}>
              <Eyebrow>{t.luanGiai.tomLai}</Eyebrow>
              {!tom ? (
                <Chu kieu="bodySm" mo>
                  {t.luanGiai.dangTom}
                </Chu>
              ) : tom.chu ? (
                tachDoan(tom.chu).map((d, i) => (
                  <Chu key={i} kieu="body">
                    {d}
                  </Chu>
                ))
              ) : null}
            </The>
          )}

          {!tt.dangTiep && (
            <View style={{ gap: KHOANG.x2 }}>
              <NutChinh nhan={t.luanGiai.hoiCeles} onPress={hoiCeles} />
              {laTongQuan ? (
                <NutPhu nhan={t.luanGiai.docChuDe} onPress={() => router.push('/luan-giai')} />
              ) : chuDeSau ? (
                <NutPhu
                  nhan={dien(t.luanGiai.docTiep, { ten: t.luanGiai.chuDe[chuDeSau.id] ?? chuDeSau.ten })}
                  onPress={() => router.replace({ pathname: '/luan-giai/[nhom]', params: { nhom: chuDeSau.id } })}
                />
              ) : (
                <NutPhu nhan={t.luanGiai.xemBucTranh} onPress={() => router.push('/luan-giai/buc-tranh')} />
              )}
            </View>
          )}
        </>
      ) : (
        <DangDoc />
      )}
    </ScrollView>
  );
}
