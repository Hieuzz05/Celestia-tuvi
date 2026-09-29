import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useId, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import {
  BO_GOC,
  CAO_NUT,
  CHAM_TOI_THIEU,
  CHU,
  DO_NOI,
  FONT,
  GRADIENT_CHU_KY,
  GRADIENT_DIEM_DUNG,
  GRADIENT_NUT,
  GRADIENT_NUT_DIEM,
  GRADIENT_ORB,
  GRADIENT_ORB_DIEM,
  KHOANG,
  NHIP,
  THANH_TAB,
  VUNG,
  type CapMau,
  type TenVung,
} from '@/thiet-ke/token';

/**
 * Các khối dựng cơ bản của giao diện — hệ Aurora bản 8.
 *
 * Spec cấm tự chế kiểu riêng khi đã có component dùng lại được, nên mọi màn hình
 * lắp từ đây. Nhờ vậy đổi token là cả app đổi theo, và không màn nào lệch nhịp.
 * Bản gốc của từng khối: `docs/thiet-ke/celes-ios/aurora/gen.py` (GLASS, CTA,
 * zone_hero, zone_on, zone_mark, icon_btn, orb, avatar...).
 */

/* ---------------------------------------------------------------- Chữ */

type KieuChu = keyof typeof CHU;

export function Chu({
  kieu = 'body',
  mo,
  nhat,
  giua,
  dam,
  style,
  children,
  ...rest
}: {
  kieu?: KieuChu;
  /** Dùng màu chữ phụ */
  mo?: boolean;
  /** Dùng màu chữ nhạt nhất — chỉ cho chú thích rất phụ */
  nhat?: boolean;
  giua?: boolean;
  /** Thân bài đậm (600) — nhãn hàng, tên mục */
  dam?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
} & React.ComponentProps<typeof Text>) {
  const mau = useMau();
  const thang = CHU[kieu];

  // Heading dùng Bricolage, phần còn lại dùng Be Vietnam Pro — ranh giới này là
  // chữ ký của hệ, không được phá.
  const laHeading = kieu.startsWith('display') || kieu === 'h1' || kieu === 'h2' || kieu === 'h3';
  const hoChu = laHeading
    ? kieu === 'h3'
      ? FONT.displayVua
      : FONT.display
    : dam
      ? FONT.thanDam
      : FONT.than;

  return (
    <Text
      style={[
        thang,
        { fontFamily: hoChu, color: nhat ? mau.chuNhat : mo ? mau.chuMo : mau.chu },
        giua && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/**
 * Cụm chữ nhấn nằm TRONG một tiêu đề (VD "mình là <Celes>").
 *
 * Bản thiết kế tô dải gradient màu vùng; React Native không cắt gradient theo
 * chữ lồng trong dòng mà không thêm thư viện, nên ở đây là màu vùng đặc — cùng
 * sắc, chỉ thiếu độ chuyển.
 */
export function ChuNhan({ vung, children }: { vung?: TenVung; children: ReactNode }) {
  const v = useVung(vung ?? 'celes');
  return <Text style={{ color: v.mau }}>{children}</Text>;
}

/** Giọng Celes — chữ nghiêng Newsreader, dùng cho câu Celes nói với người dùng */
export function Giong({
  children,
  co = 18,
  style,
  ...rest
}: { children: ReactNode; co?: number; style?: StyleProp<TextStyle> } & React.ComponentProps<typeof Text>) {
  const mau = useMau();
  return (
    <Text
      style={[{ fontFamily: FONT.giong, fontSize: co, lineHeight: co * 1.32, color: mau.giong }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/** Nhãn mono viết hoa mở đầu một khối */
export function Eyebrow({
  children,
  style,
  mauChu,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  mauChu?: string;
}) {
  const mau = useMau();
  return (
    <Text
      style={[
        CHU.eyebrow,
        {
          fontFamily: FONT.mono,
          color: mauChu ?? mau.chuMo,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Dấu định vị đầu màn: chấm sáng màu vùng + tên vùng */
export function DauVung({ vung, ten }: { vung: TenVung; ten: string }) {
  const v = useVung(vung);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: v.mau,
          shadowColor: v.mau,
          shadowOpacity: 0.9,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v.mau,
        }}
      >
        {ten}
      </Text>
    </View>
  );
}

/* ---------------------------------------------------------------- Nút */

interface NutProps {
  nhan: string;
  onPress?: () => void;
  vohieu?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Nút hành động chính — mỗi màn CHỈ được có đúng một cái.
 * Dải fuchsia 135°, cao 56, bo 14, kèm mũi tên khi dẫn sang bước tiếp.
 */
export function NutChinh({
  nhan,
  onPress,
  vohieu,
  style,
  muiTen = true,
  icon,
}: NutProps & { muiTen?: boolean; icon?: TenIcon }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={vohieu}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!vohieu }}
      style={({ pressed }) => [
        { borderRadius: BO_GOC.nut, opacity: vohieu ? 0.4 : pressed ? 0.88 : 1 },
        !vohieu && DO_NOI.nut,
        style,
      ]}
    >
      <LinearGradient
        colors={[...GRADIENT_NUT]}
        locations={[...GRADIENT_NUT_DIEM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={kieu.nutChinh}
      >
        {icon && <Icon ten={icon} size={18} net={2.2} mau="#FFFFFF" />}
        <Text style={kieu.chuNutChinh}>{nhan}</Text>
        {muiTen && !icon && <Icon ten="arrow" size={18} net={2.2} mau="#FFFFFF" />}
      </LinearGradient>
    </Pressable>
  );
}

/** Hành động hạng hai — bề mặt kính, cùng chiều cao nút chính */
export function NutPhu({ nhan, onPress, vohieu, style, icon }: NutProps & { icon?: TenIcon }) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      disabled={vohieu}
      accessibilityRole="button"
      style={({ pressed }) => [{ opacity: vohieu ? 0.4 : pressed ? 0.7 : 1 }, style]}
    >
      <BeMatKinh
        style={{
          minHeight: CAO_NUT,
          borderRadius: BO_GOC.nut,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: KHOANG.x2,
        }}
      >
        {icon && <Icon ten={icon} size={18} net={2} mau={mau.chu} />}
        <Text style={{ fontFamily: FONT.thanDam, fontSize: 15, color: mau.chu }}>{nhan}</Text>
      </BeMatKinh>
    </Pressable>
  );
}

/** Hành động dạng chữ — vẫn giữ vùng chạm 44px dù nhìn chỉ là một dòng chữ */
export function NutChu({
  nhan,
  onPress,
  mauChu,
  style,
}: NutProps & { mauChu?: string }) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={10}
      style={({ pressed }) => [
        { minHeight: CHAM_TOI_THIEU, justifyContent: 'center', opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={[CHU.bodySm, { fontFamily: FONT.thanDam, color: mauChu ?? mau.chuMo }]}>
        {nhan}
      </Text>
    </Pressable>
  );
}

/** Nút icon vuông 44, bo 14, nền kính; `cham` là chấm vàng báo có điều mới */
export function NutIcon({
  ten,
  nhan,
  onPress,
  cham,
  style,
}: {
  ten: TenIcon;
  /** Nhãn cho trình đọc màn hình — nút chỉ có hình thì bắt buộc */
  nhan: string;
  onPress?: () => void;
  cham?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, style]}
    >
      <BeMatKinh style={kieu.nutIcon}>
        <Icon ten={ten} size={20} net={2} mau={mau.chu} />
        {cham && <View style={kieu.cham} />}
      </BeMatKinh>
    </Pressable>
  );
}

/**
 * Chip bo tròn — CHỈ cho lựa chọn, bộ lọc, nhãn phân loại (không cho hành động).
 * Đang chọn: nền màu vùng rất nhạt, viền và chữ màu vùng sáng.
 */
export function Pill({
  nhan,
  dangChon,
  onPress,
  vung,
  icon,
  style,
}: {
  nhan: string;
  dangChon?: boolean;
  onPress?: () => void;
  vung?: TenVung;
  icon?: TenIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  const v = useVung(vung ?? 'celes');
  const mauChu = dangChon ? v.sang : mau.chu;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!dangChon } : undefined}
      hitSlop={onPress ? 4 : undefined}
      style={({ pressed }) => [
        {
          minHeight: 36,
          paddingHorizontal: 14,
          borderRadius: BO_GOC.vien,
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderColor: dangChon ? `rgba(${v.rgb},0.40)` : mau.vienKinh,
          backgroundColor: dangChon ? `rgba(${v.rgb},0.16)` : mau.the,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {(icon || dangChon) && (
        <Icon ten={icon ?? 'check'} size={15} net={2.4} mau={dangChon ? v.sang : mau.chuMo} />
      )}
      <Text style={[CHU.bodySm, { fontFamily: dangChon ? FONT.thanRatDam : FONT.thanVua, color: mauChu }]}>
        {nhan}
      </Text>
    </Pressable>
  );
}

/** Nhãn trạng thái không bấm được: Thuận lợi / Cần chăm chút / Bình thường */
export function NhanTrangThai({
  nhan,
  loai = 'vua',
  nho,
}: {
  nhan: string;
  loai?: 'tot' | 'canY' | 'vua' | 'vang';
  nho?: boolean;
}) {
  const mau = useMau();
  const cap: CapMau = loai === 'tot' ? mau.tot2 : loai === 'canY' ? mau.canY : loai === 'vang' ? mau.vang : mau.vua;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        minHeight: nho ? 24 : 30,
        paddingHorizontal: nho ? 8 : 12,
        borderRadius: BO_GOC.vien,
        backgroundColor: cap.nen,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: FONT.thanRatDam, fontSize: nho ? 11 : 13, color: cap.chu }}>{nhan}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------- Bề mặt */

/** Bề mặt kính mờ — dải trắng rất nhạt từ trên xuống, viền mảnh */
export function BeMatKinh({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const mau = useMau();
  return (
    <LinearGradient
      colors={[...mau.kinh]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[{ borderWidth: 1, borderColor: mau.vienKinh }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function The({
  children,
  am,
  style,
  onPress,
}: {
  children: ReactNode;
  /** Bề mặt nhấn nhẹ hơn một bậc — thẻ mang tính cảm xúc */
  am?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const mau = useMau();
  const noiDung = (
    <BeMatKinh
      style={[
        { borderRadius: BO_GOC.the, padding: KHOANG.x4 },
        am && { backgroundColor: mau.theAm },
        style,
      ]}
    >
      {children}
    </BeMatKinh>
  );

  if (!onPress) return noiDung;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {noiDung}
    </Pressable>
  );
}

/**
 * Thẻ chính của một vùng: nền tối, quầng màu vùng ở góc phải-trên, viền mảnh
 * cùng màu. Mỗi màn tối đa một thẻ này — nó là "điều quan trọng nhất ở đây".
 */
export function TheHero({
  vung,
  children,
  style,
  onPress,
}: {
  vung: TenVung;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const v = useVung(vung);
  const id = `hero-${useId().replace(/:/g, '')}`;
  const toi = theme === 'toi';

  const noiDung = (
    <View
      style={[
        {
          borderRadius: BO_GOC.theHero,
          borderWidth: 1,
          borderColor: `rgba(${v.rgb},${toi ? 0.3 : 0.22})`,
          overflow: 'hidden',
          padding: KHOANG.x5,
        },
        DO_NOI.hero,
        !toi && { shadowColor: '#6B0A6E', shadowOpacity: 0.12 },
        style,
      ]}
    >
      <LinearGradient
        colors={toi ? ['#19161D', '#121015'] : ['#FFFFFF', '#FFF6FA']}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="100%" cy="0%" rx="110%" ry="90%" fx="100%" fy="0%">
            <Stop offset="0" stopColor={`rgb(${v.rgb})`} stopOpacity={toi ? 0.2 : 0.14} />
            <Stop offset="0.62" stopColor={`rgb(${v.rgb})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );

  if (!onPress) return noiDung;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {noiDung}
    </Pressable>
  );
}

/**
 * Nền gradient chữ ký (pastel hồng–kem–vàng).
 * Chỉ còn dùng cho hero Hôm nay ở theme sáng và thẻ chia sẻ.
 */
export function NenGradient({
  children,
  style,
  goc = 145,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  goc?: number;
}) {
  // Quy đổi góc CSS sang cặp điểm đầu/cuối của expo-linear-gradient
  const rad = ((goc - 90) * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);

  return (
    <LinearGradient
      colors={[...GRADIENT_CHU_KY]}
      locations={[...GRADIENT_DIEM_DUNG]}
      start={{ x: 0.5 - x / 2, y: 0.5 - y / 2 }}
      end={{ x: 0.5 + x / 2, y: 0.5 + y / 2 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * Nền của cả màn theo vùng: màu đêm + các quầng sáng + dấu riêng của vùng
 * (bầu trời sao ở Lá số, quỹ đạo ở Hành trình, chân trời ở Khởi đầu).
 * Đặt làm con ĐẦU TIÊN của màn; nó không nhận chạm.
 */
export function NenVung({ vung }: { vung: TenVung }) {
  const { width: W, height: H } = useWindowDimensions();
  const { theme } = useTheme();
  const mau = useMau();
  const v = useVung(vung);
  const id = `nen-${useId().replace(/:/g, '')}`;
  const toi = theme === 'toi';

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: mau.nen }]}>
      <Svg width={W} height={H}>
        <Defs>
          {v.quang.map((q, i) => (
            <RadialGradient
              key={i}
              id={`${id}-${i}`}
              gradientUnits="userSpaceOnUse"
              cx={q.x * W}
              cy={q.y * H}
              fx={q.x * W}
              fy={q.y * H}
              rx={q.rx * W}
              ry={q.ry * H}
            >
              <Stop offset="0" stopColor={`rgb(${q.rgb})`} stopOpacity={q.a} />
              <Stop offset="1" stopColor={`rgb(${q.rgb})`} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {v.quang.map((_, i) => (
          <Rect key={i} width={W} height={H} fill={`url(#${id}-${i})`} />
        ))}
        {toi && <DauRiengVung vung={vung} W={W} H={H} />}
      </Svg>
    </View>
  );
}

/** Sao nền cố định (không random mỗi lần vẽ) — hạt giống giống bản thiết kế */
const SAO_NEN = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 46 }, () => ({
    x: r(),
    y: r() * 0.62,
    r: [0.6, 0.8, 1, 1.3][Math.floor(r() * 4)],
    a: [0.18, 0.28, 0.4, 0.55][Math.floor(r() * 4)],
  }));
})();

function DauRiengVung({ vung, W, H }: { vung: TenVung; W: number; H: number }) {
  if (vung === 'laSo') {
    return (
      <G>
        {SAO_NEN.map((d, i) => (
          <Circle key={i} cx={d.x * W} cy={d.y * H} r={d.r} fill="#FFFFFF" opacity={d.a} />
        ))}
      </G>
    );
  }
  if (vung === 'hanhTrinh') {
    return (
      <G fill="none" stroke={VUNG.hanhTrinh.mau} strokeOpacity={0.1}>
        <Circle cx={W} cy={0} r={180} />
        <Circle cx={W} cy={0} r={260} strokeDasharray="2 7" />
      </G>
    );
  }
  if (vung === 'khoiDau') {
    return (
      <Ellipse
        cx={W / 2}
        cy={H * 1.4}
        rx={W * 1.33}
        ry={H * 0.5}
        fill="none"
        stroke="#FFD9A8"
        strokeOpacity={0.35}
        strokeWidth={1.2}
      />
    );
  }
  return null;
}

/** Khoảng đệm đáy cho nội dung cuộn dưới thanh tab nổi */
export function useDemDayTab(): number {
  const le = useSafeAreaInsets();
  return Math.max(le.bottom, THANH_TAB.cachDay) + THANH_TAB.cao + KHOANG.x6;
}

/* ---------------------------------------------------------------- Celes */

/**
 * Quả cầu Celes — thay cho khuôn mặt nhân vật. "Thở" chậm 7 giây một nhịp; tắt
 * khi người dùng bật Giảm chuyển động.
 */
export function OrbCeles({ size = 48, tho = true, sang = true }: { size?: number; tho?: boolean; sang?: boolean }) {
  const giamChuyenDong = useReducedMotion();
  const nhip = useSharedValue(0);
  const id = `orb-${useId().replace(/:/g, '')}`;
  const chay = tho && !giamChuyenDong;

  useEffect(() => {
    if (!chay) return;
    nhip.value = withRepeat(
      withTiming(1, { duration: NHIP.tho / 2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [chay, nhip]);

  const kieuTho = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + nhip.value * 0.06 }, { rotate: `${nhip.value * 12}deg` }],
  }));

  return (
    <Animated.View
      accessible={false}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        sang && {
          shadowColor: '#FF8BD0',
          shadowOpacity: 0.55,
          shadowRadius: size / 4,
          shadowOffset: { width: 0, height: 0 },
        },
        kieuTho,
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="32%" cy="28%" fx="32%" fy="28%" r="78%">
            {GRADIENT_ORB.map((c, i) => (
              <Stop key={c} offset={GRADIENT_ORB_DIEM[i]} stopColor={c} />
            ))}
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Ảnh đại diện có vòng màu — góc phải-trên các tab, mở Tài khoản */
export function AnhDaiDien({
  ten,
  size = 44,
  onPress,
  nhan,
}: {
  ten?: string;
  size?: number;
  onPress?: () => void;
  nhan?: string;
}) {
  const { theme } = useTheme();
  const mau = useMau();
  const chuCai = (ten?.trim()[0] ?? 'C').toUpperCase();
  const vong = (
    <LinearGradient
      colors={['#FFBDD3', '#FFCB0F', '#FF8BD0', '#D32298']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, padding: 2 }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: mau.nen,
          backgroundColor: theme === 'toi' ? '#1F1B24' : '#FFBDD3',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: FONT.display, fontSize: size * 0.36, color: mau.chu }}>{chuCai}</Text>
      </View>
    </LinearGradient>
  );
  if (!onPress) return vong;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={nhan}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      {vong}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Ô nhập */

export function ONhap({ style, ...rest }: TextInputProps) {
  const mau = useMau();
  return (
    <TextInput
      placeholderTextColor={mau.chuNhat}
      style={[
        {
          fontFamily: FONT.than,
          fontSize: 16,
          color: mau.chu,
          backgroundColor: mau.the,
          borderRadius: BO_GOC.oNhap,
          borderWidth: 1,
          borderColor: mau.vienKinh,
          paddingHorizontal: KHOANG.x4,
          minHeight: 56,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/* ---------------------------------------------------------------- Khác */

/** Bộ chọn dạng phân đoạn — chế độ lá số, khoảng thời gian, Dương/Âm lịch */
export function ChonPhanDoan<T extends string>({
  muc,
  giaTri,
  onChange,
  vung,
  style,
}: {
  muc: { gt: T; nhan: string }[];
  giaTri: T;
  onChange: (v: T) => void;
  vung?: TenVung;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  const v = useVung(vung ?? 'celes');
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: mau.the,
          borderWidth: 1,
          borderColor: mau.vien,
          borderRadius: BO_GOC.nut,
          padding: 3,
        },
        style,
      ]}
    >
      {muc.map((m) => {
        const chon = m.gt === giaTri;
        return (
          <Pressable
            key={m.gt}
            onPress={() => onChange(m.gt)}
            accessibilityRole="tab"
            accessibilityState={{ selected: chon }}
            style={{
              flex: 1,
              minHeight: 40,
              paddingHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 11,
              borderWidth: 1,
              borderColor: chon ? `rgba(${v.rgb},0.40)` : 'transparent',
              backgroundColor: chon ? `rgba(${v.rgb},0.16)` : 'transparent',
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                CHU.bodySm,
                { fontFamily: chon ? FONT.thanRatDam : FONT.thanVua, color: chon ? v.sang : mau.chuMo },
              ]}
            >
              {m.nhan}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Thanh tiến độ của onboarding: các đoạn đã qua sáng màu vùng */
export function ThanhTienDo({ buoc, tong, vung = 'khoiDau' }: { buoc: number; tong: number; vung?: TenVung }) {
  const mau = useMau();
  const v = useVung(vung);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessible={false}>
      {Array.from({ length: tong }, (_, i) => (
        <View
          key={i}
          style={[
            { flex: 1, height: 5, borderRadius: 3, backgroundColor: i < buoc ? v.mau : mau.ranh },
            i < buoc && {
              shadowColor: v.mau,
              shadowOpacity: 0.5,
              shadowRadius: 5,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Thanh tiến độ mảnh (đọc tiếp, mức hoàn thành) */
export function VachTienDo({ ti, vung }: { ti: number; vung: TenVung }) {
  const mau = useMau();
  const v = useVung(vung);
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: mau.ranh, overflow: 'hidden' }}>
      <LinearGradient
        colors={[v.sang, v.mau]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: `${Math.max(0, Math.min(1, ti)) * 100}%`, height: '100%', borderRadius: 3 }}
      />
    </View>
  );
}

/** Hàng danh sách trên bề mặt kính: icon · chữ · mũi tên */
export function HangDanhSach({
  icon,
  nhan,
  phu,
  onPress,
  mauIcon,
  mauChu,
  phai,
}: {
  icon?: TenIcon;
  nhan: string;
  phu?: string;
  onPress?: () => void;
  mauIcon?: string;
  mauChu?: string;
  /** Phần tử bên phải thay cho mũi tên */
  phai?: ReactNode;
}) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: KHOANG.x3,
        paddingVertical: KHOANG.x2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && <Icon ten={icon} size={20} net={1.9} mau={mauIcon ?? mau.chuMo} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: FONT.thanDam, fontSize: 15, lineHeight: 20, color: mauChu ?? mau.chu }}>{nhan}</Text>
        {phu ? <Text style={{ fontFamily: FONT.than, fontSize: 13, lineHeight: 18, color: mau.chuMo }}>{phu}</Text> : null}
      </View>
      {phai ?? (onPress ? <Icon ten="chev" size={18} net={2} mau={mau.chuNhat} /> : null)}
    </Pressable>
  );
}

/** Đường kẻ mảnh giữa các hàng trong một thẻ */
export function KeNgang() {
  const mau = useMau();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: mau.vien }} />;
}

const kieu = StyleSheet.create({
  nutChinh: {
    minHeight: CAO_NUT,
    borderRadius: BO_GOC.nut,
    paddingHorizontal: KHOANG.x6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: KHOANG.x2,
  },
  chuNutChinh: {
    fontFamily: FONT.thanRatDam,
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  nutIcon: {
    width: CHAM_TOI_THIEU,
    height: CHAM_TOI_THIEU,
    borderRadius: BO_GOC.nut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cham: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCB0F',
  },
});
