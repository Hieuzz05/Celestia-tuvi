import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { View, type ColorValue } from 'react-native';
import { useMau, useTheme } from '@/thiet-ke/theme';
import { BANG_MAU, CHU, FONT } from '@/thiet-ke/token';
import { Text } from 'react-native';

/**
 * Bộ icon một họ duy nhất: nét viền 1.8px, đầu và khớp bo tròn.
 *
 * Spec cấm trộn nhiều họ icon, cấm emoji, cấm biểu tượng tarot và vòng hoàng đạo.
 * Mô-típ thương hiệu là điểm trung tâm, quỹ đạo, vòng tròn đồng tâm, đường dẫn
 * lối — các icon dưới đây bám theo đó.
 */

interface IconProps {
  size?: number;
  /** Nhận ColorValue vì thanh tab của React Navigation truyền vào kiểu này */
  mau?: ColorValue;
}

function Khung({
  size = 24,
  mau,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={mau}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

/** Hôm nay — mặt trời mọc trên đường chân trời */
export const IconHomNay = (p: IconProps) => (
  <Khung {...p}>
    <Circle cx="12" cy="12" r="3.6" />
    <Path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18" />
  </Khung>
);

/** Hành trình — đường dẫn lối có các mốc */
export const IconHanhTrinh = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M4 19c3.5 0 3.5-5 7-5s3.5-5 7-5" />
    <Circle cx="4" cy="19" r="1.6" />
    <Circle cx="11" cy="14" r="1.6" />
    <Circle cx="18" cy="9" r="1.6" />
  </Khung>
);

/** Celes — điểm trung tâm và quỹ đạo, chính là dấu thương hiệu */
export const IconCeles = (p: IconProps) => (
  <Khung {...p}>
    <Circle cx="12" cy="12" r="9.2" />
    <Circle cx="12" cy="12" r="5.4" />
    <Circle cx="12" cy="12" r="1.9" fill={p.mau} strokeWidth={0} />
  </Khung>
);

/** Kết nối — hai quỹ đạo giao nhau */
export const IconKetNoi = (p: IconProps) => (
  <Khung {...p}>
    <Circle cx="9" cy="12" r="5.6" />
    <Circle cx="15" cy="12" r="5.6" />
  </Khung>
);

/** Tôi */
export const IconToi = (p: IconProps) => (
  <Khung {...p}>
    <Circle cx="12" cy="8.6" r="3.8" />
    <Path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
  </Khung>
);

export const IconMuiTenPhai = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Khung>
);

export const IconQuayLai = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
  </Khung>
);

export const IconDong = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Khung>
);

export const IconGui = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M4.5 12h15M12 4.5l7.5 7.5L12 19.5" />
  </Khung>
);

export const IconCong = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Khung>
);

export const IconBanDo = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M3.5 5.5h17v13h-17z" />
    <Path d="M3.5 12h17M12 5.5v13" />
  </Khung>
);

export const IconSach = (p: IconProps) => (
  <Khung {...p}>
    <Path d="M4 5.2A1.2 1.2 0 0 1 5.2 4H19v14H5.2A1.2 1.2 0 0 0 4 19.2Z" />
    <Path d="M4 19.2A1.2 1.2 0 0 0 5.2 20.4H19V18" />
  </Khung>
);

/** Mã màu của bộ nhận diện (bộ logo 29/09/2026) — chỉ dùng cho dấu thương hiệu và biểu tượng ứng dụng */
export const MAU_THUONG_HIEU = {
  /** Ba điểm dừng của dải màu trăng: tím ở chân, đào ở giữa, kem ở ngọn */
  tim: '#9B6BFF',
  dao: '#F6C38A',
  kem: '#FFF1CC',
  /** Lõi sáng của ngôi sao */
  kemSang: '#FFF8DD',
  /** Nền biểu tượng ứng dụng, splash và ô nền của dấu trên bề mặt sáng */
  nenDau: '#111126',
  softWhite: '#F8FAFC',
} as const;

/** Tỉ lệ chiều cao dấu so với chiều cao chữ — quy định của bộ nhận diện */
export const TI_LE_DAU = 1.2;

/**
 * Hai bản hình của designer, cùng hình với `components/Logo.tsx` bên web — sửa
 * một bên thì sửa cả bên kia. Tệp gốc khoét trăng bằng mask; ở đây trăng là một
 * path hai cung tròn cho cùng hình, vì Mask của react-native-svg không ổn định.
 * Bản "nhỏ" (trăng dày, sao to) dùng khi dấu dưới 40px.
 */
const HINH = {
  thuong: {
    trang: 'M528.92 237.52A275 275 0 1 0 528.92 786.48A300 300 0 0 1 528.92 237.52Z',
    sao: 'M535 421C555.02 491.98 555.02 491.98 626 512C555.02 532.02 555.02 532.02 535 603C514.98 532.02 514.98 532.02 444 512C514.98 491.98 514.98 491.98 535 421Z',
    dai: { x1: 319.5, y1: 787, x2: 666, y2: 264.5 },
    tam: [431.5, 512],
    canh: 580,
  },
  nho: {
    trang: 'M549.21 229.44A285 285 0 1 0 549.21 794.56A300 300 0 0 1 549.21 229.44Z',
    sao: 'M535 407C558.1 488.9 558.1 488.9 640 512C558.1 535.1 558.1 535.1 535 617C511.9 535.1 511.9 535.1 430 512C511.9 488.9 511.9 488.9 535 407Z',
    dai: { x1: 312.5, y1: 797, x2: 671.6, y2: 255.5 },
    tam: [433.5, 512],
    canh: 600,
  },
} as const;

/**
 * Dấu thương hiệu: trăng khuyết ôm một ngôi sao bốn cánh.
 *
 * Dùng ở splash, màn giới thiệu và header. Ngôi sao màu kem gần như biến mất
 * trên nền sáng, nên trên bề mặt sáng dấu nằm trong ô bo góc màu nền biểu
 * tượng ứng dụng; trên nền tối dấu đứng trần. Mặc định theo theme; màn nào có
 * nền cố định (VD gradient pastel của màn giới thiệu) thì truyền `nen`.
 */
export function DauCelestia({ size = 40, mau, nen }: IconProps & { nen?: 'sang' | 'toi' }) {
  // Nhiều dấu cùng nằm trên một màn (header + khối brand) thì id gradient phải
  // khác nhau, bằng không react-native-svg lấy nhầm định nghĩa của cái vẽ trước.
  const id = `celestia-dau-${useId().replace(/:/g, '')}`;
  const { theme } = useTheme();
  const coO = (nen ?? theme) === 'sang';
  const h = size < 40 ? HINH.nho : HINH.thuong;

  // Khung nhìn rộng hơn hình 30% để ô nền (nếu có) chừa lề quanh dấu
  const canh = h.canh * 1.3;
  const x0 = h.tam[0] - canh / 2;
  const y0 = h.tam[1] - canh / 2;

  return (
    <Svg width={size} height={size} viewBox={`${x0} ${y0} ${canh} ${canh}`} fill="none">
      {!mau && (
        <Defs>
          <LinearGradient id={`${id}-trang`} {...h.dai} gradientUnits="userSpaceOnUse">
            <Stop stopColor={MAU_THUONG_HIEU.tim} />
            <Stop offset="0.47" stopColor={MAU_THUONG_HIEU.dao} />
            <Stop offset="1" stopColor={MAU_THUONG_HIEU.kem} />
          </LinearGradient>
          <RadialGradient id={`${id}-sao`}>
            <Stop stopColor={MAU_THUONG_HIEU.kemSang} />
            <Stop offset="0.55" stopColor={MAU_THUONG_HIEU.kem} />
            <Stop offset="1" stopColor={MAU_THUONG_HIEU.dao} />
          </RadialGradient>
        </Defs>
      )}

      {coO && <Rect x={x0} y={y0} width={canh} height={canh} rx={canh * 0.22} fill={MAU_THUONG_HIEU.nenDau} />}
      <Path d={h.trang} fill={mau ?? `url(#${id}-trang)`} />
      <Path d={h.sao} fill={mau ?? `url(#${id}-sao)`} />
    </Svg>
  );
}

/** Dấu + chữ CELESTIA, áp đúng tỉ lệ 1.2 lần chiều cao chữ */
export function LogoCelestia({ size = 22, mau, nen }: IconProps & { nen?: 'sang' | 'toi' }) {
  const bangMau = useMau();
  const mauChu = mau ?? bangMau.chu;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <DauCelestia size={size * TI_LE_DAU} nen={nen} />
      <Text
        style={{
          fontFamily: FONT.display,
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: size * 0.16,
          color: mauChu,
        }}
      >
        CELESTIA
      </Text>
    </View>
  );
}

/** Màu nhấn theo lĩnh vực — chỉ dùng làm điểm phụ, mực chính vẫn là Aubergine */
export const MAU_LINH_VUC = {
  celes: BANG_MAU.fuchsia,
  homNay: BANG_MAU.vangAm,
  congViec: '#C9B8E8',
  tinhCam: BANG_MAU.hong,
  taiChinh: '#BBF7D0',
  hanhTrinh: BANG_MAU.kem,
  tuVi: BANG_MAU.aubergine,
} as const;

/** Cỡ chữ dùng lại cho nhãn tab */
export const CHU_TAB = CHU.eyebrow;
