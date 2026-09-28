import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Chu, Eyebrow, NutChinh, NutChu, The } from './co-ban';
import type { CauV3 } from '@/du-lieu/api';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG } from '@/thiet-ke/token';

/**
 * Mảnh dùng chung của các màn luận giải — bản RN của `CauTraLoiV3` / `DangDocV3`.
 */

/** Tách đoạn theo dòng trống, như web */
export const tachDoan = (s: string) => s.split(/\n\s*\n/).filter((x) => x.trim());

/**
 * Trạng thái chờ. Bài đã đệm về trong khoảng một giây, nên chỉ nói tới "lần
 * đầu mất nửa phút" khi đã chờ quá 3 giây — lúc đó mới thật sự là đang viết.
 */
export function DangDoc({ chu }: { chu?: string }) {
  const t = useT();
  const [lau, setLau] = useState(false);
  useEffect(() => {
    const hen = setTimeout(() => setLau(true), 3000);
    return () => clearTimeout(hen);
  }, []);
  return (
    <View style={{ gap: KHOANG.x2 }} accessibilityLiveRegion="polite">
      <Chu kieu="body">{lau ? t.luanGiai.dangViet : (chu ?? t.luanGiai.dangMo)}…</Chu>
      {lau && (
        <Chu kieu="bodySm" mo>
          {t.luanGiai.dangVietMoTa}
        </Chu>
      )}
    </View>
  );
}

/**
 * Một câu: câu hỏi → bài luận → "Muốn biết vì sao không?" (ẩn mặc định, vì
 * phần căn cứ viết bằng tên sao, tên cung — ngôn ngữ của người biết Tử Vi).
 */
export function CauTraLoi({ cau, so }: { cau: CauV3; so?: number }) {
  const t = useT();
  const mau = useMau();
  const [mo, setMo] = useState(false);

  return (
    <View style={{ gap: KHOANG.x3 }}>
      <View style={{ flexDirection: 'row', gap: KHOANG.x3, alignItems: 'flex-start' }}>
        {so !== undefined && (
          <View
            style={{
              minWidth: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: mau.hanhDong,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <Chu kieu="caption" style={{ color: mau.chuTrenHanhDong }}>
              {so}
            </Chu>
          </View>
        )}
        <Chu kieu="h3" style={{ flex: 1 }}>
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
            <Chu key={i} kieu="body">
              {d}
            </Chu>
          ))}
          {!!cau.viSao && (
            <NutChu
              nhan={mo ? t.luanGiai.viSaoDong : t.luanGiai.viSaoMo}
              onPress={() => setMo(!mo)}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
          {mo && (
            <View
              style={{
                gap: KHOANG.x2,
                paddingLeft: KHOANG.x4,
                borderLeftWidth: 2,
                borderLeftColor: mau.hanhDong,
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
