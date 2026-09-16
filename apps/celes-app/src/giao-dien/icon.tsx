import Svg, { Circle, Path } from 'react-native-svg';
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

/**
 * Dấu thương hiệu: vòng tròn đồng tâm quanh một điểm.
 *
 * Dùng ở splash, brand intro và header. Không thay bằng ngôi sao hay biểu tượng
 * hoàng đạo — đây là thứ giúp nhận ra Celestia ngay từ cái nhìn đầu.
 */
export function DauCelestia({ size = 40, mau }: IconProps) {
  const bangMau = useMau();
  const m = mau ?? bangMau.chu;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10.4" stroke={m} strokeWidth={1.4} />
      <Circle cx="12" cy="12" r="6.4" stroke={m} strokeWidth={1.4} />
      <Circle cx="12" cy="12" r="2.6" fill={m} />
    </Svg>
  );
}

/** Dấu + chữ CELESTIA giãn chữ — chữ ký thương hiệu đầy đủ */
export function LogoCelestia({ size = 22, mau }: IconProps) {
  const bangMau = useMau();
  const m = mau ?? bangMau.chu;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <DauCelestia size={size * 1.15} mau={m} />
      <Text
        style={{
          fontFamily: FONT.display,
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: size * 0.16,
          color: m,
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
