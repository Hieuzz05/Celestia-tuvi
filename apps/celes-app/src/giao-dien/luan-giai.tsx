import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Chu, Eyebrow, NutChinh, NutChu, OrbCeles, The, TheHero } from './co-ban';
import type { TenIcon } from './icon-aurora';
import { docNhomV3, docTomLaiV3, LoiCanDangNhap, type CauV3 } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { useT } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, type TenVung } from '@/thiet-ke/token';
import { CAU_HOI_V3, CHU_DE_V3 } from '@khung-v3';

/**
 * Mảnh dùng chung của các màn luận giải — bản RN của `CauTraLoiV3` / `DangDocV3`,
 * cùng hook đọc bài `useBaiLuan` cho màn `/luan-giai/[nhom]` và chế độ Tổng quan
 * của tab Lá số (hai nơi, một logic).
 */

/** Tách đoạn theo dòng trống, như web */
export const tachDoan = (s: string) => s.split(/\n\s*\n/).filter((x) => x.trim());

/* ================================================================ Đọc bài */

/** Ba câu của ba thẻ đầu web (TQ02, TQ03, TQ08) đi trước trong Tổng quan */
export const THE_DAU = ['TQ02', 'TQ03', 'TQ08'];

function chiaLuot(nhom: string): [string[], string[]] {
  if (nhom === 'tong-quan') {
    const sau = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && !THE_DAU.includes(q.id)).map((q) => q.id);
    return [THE_DAU, sau];
  }
  const ids = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === nhom).map((q) => q.id);
  const dau = ids.length >= 4 ? Math.ceil(ids.length / 2) : ids.length;
  return [ids.slice(0, dau), ids.slice(dau)];
}

export type TrangThaiBai =
  | { loai: 'dang-doc' }
  | { loai: 'can-dang-nhap'; gioiHanKhach?: boolean }
  | { loai: 'loi' }
  | { loai: 'xong'; cau: CauV3[]; dangTiep: boolean; loiSau: boolean };

/**
 * Một bài luận: tổng quan (`nhom = tong-quan`) hoặc một trong 14 mặt đời.
 *
 * Gọi cùng tuyến `/api/luan-giai-v3` với web, cùng năm xem (năm dương lịch) và
 * cùng cách chia lượt, nên bài web đã viết thì app mở ra có ngay — máy chủ đệm
 * theo lá số chứ không theo người.
 *
 * Chia HAI LƯỢT NỐI TIẾP như web: nửa đầu hiện trước, nửa sau viết tiếp khi
 * người đọc còn đang đọc. Một lượt cả nhóm thì phải chờ câu chậm nhất.
 *
 * Tổng quan mở cho khách; chủ đề sâu cần đăng nhập — khỏi gọi máy chủ khi biết
 * chắc sẽ nhận 401.
 */
export function useBaiLuan(nhom: string) {
  const t = useT();
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
  const [kq, setKq] = useState<{ khoa: string; tt: TrangThaiBai } | null>(null);
  const [tomLai, setTomLai] = useState<{ khoa: string; chu: string | null; xong: boolean } | null>(null);

  useEffect(() => {
    if (!hoSo || !khoa) return;
    let huy = false;
    const [dau, sau] = chiaLuot(nhom);
    const dat = (tt: TrangThaiBai) => !huy && setKq({ khoa, tt });

    const bienLoi = (e: unknown): TrangThaiBai =>
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

  const tt: TrangThaiBai | null = canDangNhap
    ? { loai: 'can-dang-nhap' }
    : kq && kq.khoa === khoa
      ? kq.tt
      : khoa
        ? { loai: 'dang-doc' }
        : null;
  const tom = tomLai && tomLai.khoa === khoa ? tomLai : null;

  return {
    hoSo,
    laTongQuan,
    hopLe,
    ten,
    chuDeSau,
    tt,
    tom,
    thuLai: () => setLanThu((n) => n + 1),
  };
}

/* ============================================================== Giao diện */

/** Icon của 9 chủ đề — theo bảng chủ đề của Aurora bản 8 */
export const ICON_CHU_DE: Record<string, TenIcon> = {
  'tinh-cach': 'sparkle',
  'su-nghiep': 'briefcase',
  'tien-bac': 'coin',
  'tinh-duyen': 'heart',
  'con-cai': 'baby',
  'gia-dinh': 'tree',
  'suc-khoe': 'leaf',
  'ra-ngoai': 'compass',
  'van-han': 'path',
};

/**
 * Trạng thái chờ. Bài đã đệm về trong khoảng một giây, nên chỉ nói tới "lần
 * đầu mất nửa phút" khi đã chờ quá 3 giây — lúc đó mới thật sự là đang viết.
 * Hình: thẻ viền đứt kèm orb Celes, như "Celes đang viết tiếp" của bản thiết kế.
 */
export function DangDoc({ chu }: { chu?: string }) {
  const t = useT();
  const mau = useMau();
  const [lau, setLau] = useState(false);
  useEffect(() => {
    const hen = setTimeout(() => setLau(true), 3000);
    return () => clearTimeout(hen);
  }, []);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: KHOANG.x3,
        padding: KHOANG.x4,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: mau.vien,
      }}
      accessibilityLiveRegion="polite"
    >
      <OrbCeles size={26} />
      <View style={{ flex: 1, gap: KHOANG.x1 }}>
        <Chu kieu="body">{lau ? t.luanGiai.dangViet : (chu ?? t.luanGiai.dangMo)}…</Chu>
        {lau && (
          <Chu kieu="bodySm" mo>
            {t.luanGiai.dangVietMoTa}
          </Chu>
        )}
      </View>
    </View>
  );
}

/** Vòng số thứ tự — viền màu vùng, số mono (không dùng fuchsia: đó là màu của nút chính) */
export function SoThuTu({ so, vung = 'laSo' }: { so: number; vung?: TenVung }) {
  const v = useVung(vung);
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: `rgba(${v.rgb},0.5)`,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
      }}
    >
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: v.mau }}>{String(so).padStart(2, '0')}</Text>
    </View>
  );
}

/**
 * Một câu: câu hỏi → bài luận → "Muốn biết vì sao không?" (ẩn mặc định, vì
 * phần căn cứ viết bằng tên sao, tên cung — ngôn ngữ của người biết Tử Vi).
 * Nút vì sao luôn miễn phí.
 */
export function CauTraLoi({ cau, so, vung = 'laSo' }: { cau: CauV3; so?: number; vung?: TenVung }) {
  const t = useT();
  const mau = useMau();
  const v = useVung(vung);
  const [mo, setMo] = useState(false);

  return (
    <View style={{ gap: KHOANG.x3 }}>
      <View style={{ flexDirection: 'row', gap: KHOANG.x3, alignItems: 'flex-start' }}>
        {so !== undefined && <SoThuTu so={so} vung={vung} />}
        <Chu kieu="h3" style={{ flex: 1, fontSize: 18, lineHeight: 23 }}>
          {cau.cauHoi}
        </Chu>
      </View>

      {cau.chuaViet ? (
        <Chu kieu="bodySm" mo>
          {t.luanGiai.chuaViet}
        </Chu>
      ) : (
        <>
          {tachDoan(cau.luanGiai).map((d, i) => (
            <Chu key={i} kieu="body" style={{ fontSize: 15.5, lineHeight: 24 }}>
              {d}
            </Chu>
          ))}
          {!!cau.viSao && (
            <NutChu
              nhan={mo ? t.luanGiai.viSaoDong : t.luanGiai.viSaoMo}
              onPress={() => setMo(!mo)}
              mauChu={v.mau}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
          {mo && (
            <View
              style={{
                gap: KHOANG.x2,
                paddingLeft: KHOANG.x4,
                borderLeftWidth: 2,
                borderLeftColor: `rgba(${v.rgb},0.6)`,
              }}
            >
              <Eyebrow>{t.luanGiai.viSaoNhan}</Eyebrow>
              <Chu kieu="bodySm" mo>
                {cau.viSao}
              </Chu>
            </View>
          )}
        </>
      )}
    </View>
  );
}

/** Khối "Tóm lại" cuối bài chủ đề — thẻ hero của vùng, chữ display */
export function TheTomLai({ chu, xong, vung = 'laSo' }: { chu: string | null; xong: boolean; vung?: TenVung }) {
  const t = useT();
  const v = useVung(vung);
  return (
    <TheHero vung={vung} style={{ gap: KHOANG.x2 }}>
      <Eyebrow mauChu={v.mau}>{t.luanGiai.tomLai}</Eyebrow>
      {!xong ? (
        <Chu kieu="bodySm" mo>
          {t.luanGiai.dangTom}
        </Chu>
      ) : chu ? (
        tachDoan(chu).map((d, i) => (
          <Chu key={i} kieu="h3" style={{ fontSize: 18, lineHeight: 25 }}>
            {d}
          </Chu>
        ))
      ) : null}
    </TheHero>
  );
}

/** Thẻ mời đăng nhập — khách đọc được tổng quan, còn lại cần tài khoản */
export function TheCanDangNhap({ moTa }: { moTa?: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <The am style={{ gap: KHOANG.x3 }}>
      <Chu kieu="h3">{t.luanGiai.canDangNhapTieuDe}</Chu>
      <Chu kieu="bodySm" mo>
        {moTa ?? t.luanGiai.canDangNhapMoTa}
      </Chu>
      <NutChinh nhan={t.luanGiai.dangNhapNut} onPress={() => router.push('/dang-nhap?sau=quay-lai')} />
    </The>
  );
}
