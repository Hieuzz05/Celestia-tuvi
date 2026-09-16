import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { View, type ColorValue } from 'react-native';
import { useMau } from '@/thiet-ke/theme';
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

/** Mã màu của bộ nhận diện — chỉ dùng cho dấu thương hiệu và biểu tượng ứng dụng */
export const MAU_THUONG_HIEU = {
  gold: '#D4AF37',
  goldSang: '#EBD489',
  goldTram: '#B08B24',
  midnightIndigo: '#0F172A',
  midnightIndigoSau: '#0A0E1A',
  softWhite: '#F8FAFC',
} as const;

/** Tỉ lệ chiều cao dấu so với chiều cao chữ — quy định của bộ nhận diện */
export const TI_LE_DAU = 1.2;

/**
 * Dấu thương hiệu: ngôi sao năm cánh lồng trong vành trăng khuyết, nét vàng kim.
 *
 * Dùng ở splash, màn giới thiệu và header. Vàng kim là màu của RIÊNG dấu này —
 * không phải màu hành động của sản phẩm; nút chuyển đổi vẫn là hồng Fuchsia.
 */
export function DauCelestia({ size = 40, mau }: IconProps) {
  // Nhiều dấu cùng nằm trên một màn (header + khối brand) thì id gradient phải
  // khác nhau, bằng không react-native-svg lấy nhầm định nghĩa của cái vẽ trước.
  const id = `celestia-gold-${useId().replace(/:/g, '')}`;
  const net = mau ?? `url(#${id})`;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {!mau && (
        <Defs>
          <LinearGradient id={id} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <Stop stopColor={MAU_THUONG_HIEU.goldSang} />
            <Stop offset="0.5" stopColor={MAU_THUONG_HIEU.gold} />
            <Stop offset="1" stopColor={MAU_THUONG_HIEU.goldTram} />
          </LinearGradient>
        </Defs>
      )}

      {/* Vành trăng khuyết, hở phía trên để ngọn sao vươn ra ngoài */}
      <Path d="M15.4 13.7A15 15 0 1 0 32.6 13.7" stroke={net} strokeWidth={1.6} strokeLinecap="round" />

      {/* Nét trong, gợi lại chuyển động của quỹ đạo */}
      <Path
        d="M13.6 21.1A11.5 11.5 0 0 0 28.9 36.4"
        stroke={net}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.75}
      />

      {/* Ngôi sao năm cánh, vẽ nét chứ không tô đặc */}
      <Path
        d="M24 8 27.1 16.8 36.4 17 29 22.6 31.6 31.5 24 26.2 16.4 31.5 19.1 22.6 11.6 17 20.9 16.8Z"
        stroke={net}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Dấu + chữ CELESTIA, áp đúng tỉ lệ 1.2 lần chiều cao chữ */
export function LogoCelestia({ size = 22, mau }: IconProps) {
  const bangMau = useMau();
  const mauChu = mau ?? bangMau.chu;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <DauCelestia size={size * TI_LE_DAU} />
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
