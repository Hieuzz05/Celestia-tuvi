import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useMau } from '@/thiet-ke/theme';
import {
  BO_GOC,
  CHAM_TOI_THIEU,
  CHU,
  DO_NOI,
  FONT,
  GRADIENT_CHU_KY,
  GRADIENT_DIEM_DUNG,
  KHOANG,
} from '@/thiet-ke/token';

/**
 * Các khối dựng cơ bản của giao diện.
 *
 * Spec cấm tự chế kiểu riêng khi đã có component dùng lại được, nên mọi màn hình
 * lắp từ đây. Nhờ vậy đổi token là cả app đổi theo, và không màn nào lệch nhịp.
 */

/* ---------------------------------------------------------------- Chữ */

type KieuChu = keyof typeof CHU;

export function Chu({
  kieu = 'body',
  mo,
  nhat,
  giua,
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
  style?: StyleProp<TextStyle>;
  children: ReactNode;
} & React.ComponentProps<typeof Text>) {
  const mau = useMau();
  const thang = CHU[kieu];

  // Heading dùng họ chữ display, phần còn lại dùng họ thân — ranh giới này là
  // chữ ký của hệ, không được phá.
  const laHeading = kieu.startsWith('display') || kieu === 'h1' || kieu === 'h2' || kieu === 'h3';
  const hoChu = laHeading
    ? kieu === 'h3'
      ? FONT.displayVua
      : FONT.display
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

/** Nhãn mono viết hoa mở đầu một khối — dùng rất hạn chế */
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
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ---------------------------------------------------------------- Nút */

interface NutProps {
  nhan: string;
  onPress?: () => void;
  vohieu?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Nút hành động chính — mỗi màn CHỈ được có đúng một cái nổi trội */
export function NutChinh({ nhan, onPress, vohieu, style }: NutProps) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      disabled={vohieu}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!vohieu }}
      style={({ pressed }) => [
        kieu.nut,
        { backgroundColor: mau.hanhDong, opacity: vohieu ? 0.4 : pressed ? 0.86 : 1 },
        style,
      ]}
    >
      <Text style={[CHU.body, { fontFamily: FONT.thanDam, color: mau.chuTrenHanhDong }]}>
        {nhan}
      </Text>
    </Pressable>
  );
}

/** Hành động hạng hai — nền trong suốt, viền mảnh */
export function NutPhu({ nhan, onPress, vohieu, style }: NutProps) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      disabled={vohieu}
      accessibilityRole="button"
      style={({ pressed }) => [
        kieu.nut,
        {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: mau.vien,
          opacity: vohieu ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={[CHU.body, { fontFamily: FONT.thanVua, color: mau.chu }]}>{nhan}</Text>
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
      <Text style={[CHU.bodySm, { fontFamily: FONT.thanVua, color: mauChu ?? mau.hanhDong }]}>
        {nhan}
      </Text>
    </Pressable>
  );
}

/** Chip bo tròn — dùng cho gợi ý câu hỏi, bộ lọc, nhãn phân loại */
export function Pill({
  nhan,
  dangChon,
  onPress,
  style,
}: {
  nhan: string;
  dangChon?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!dangChon } : undefined}
      style={({ pressed }) => [
        {
          paddingHorizontal: KHOANG.x4,
          paddingVertical: KHOANG.x2 + 2,
          borderRadius: BO_GOC.vien,
          borderWidth: 1,
          borderColor: dangChon ? mau.chu : mau.vien,
          backgroundColor: dangChon ? mau.chu : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          CHU.bodySm,
          { fontFamily: FONT.thanVua, color: dangChon ? mau.nen : mau.chu },
        ]}
      >
        {nhan}
      </Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Bề mặt */

export function The({
  children,
  am,
  style,
  onPress,
}: {
  children: ReactNode;
  /** Bề mặt kem ấm — dùng cho thẻ mang tính cảm xúc */
  am?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const mau = useMau();
  const noiDung = (
    <View
      style={[
        {
          backgroundColor: am ? mau.theAm : mau.the,
          borderRadius: BO_GOC.the,
          padding: KHOANG.x5,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: mau.vien,
        },
        DO_NOI.the,
        style,
      ]}
    >
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
 * Nền gradient chữ ký.
 *
 * Spec giới hạn rõ chỗ dùng: onboarding, hero ở Hôm nay, khoảnh khắc trả phí,
 * mốc hành trình, thẻ chia sẻ. Đừng phủ gradient lên mọi khối.
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

/* ---------------------------------------------------------------- Ô nhập */

export function ONhap({ style, ...rest }: TextInputProps) {
  const mau = useMau();
  return (
    <TextInput
      placeholderTextColor={mau.chuNhat}
      style={[
        CHU.body,
        {
          fontFamily: FONT.than,
          color: mau.chu,
          backgroundColor: mau.the,
          borderRadius: BO_GOC.oNhap,
          borderWidth: 1,
          borderColor: mau.vien,
          paddingHorizontal: KHOANG.x4,
          minHeight: 52,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/* ---------------------------------------------------------------- Khác */

/** Bộ chọn dạng phân đoạn — dùng cho chế độ bản đồ, ngôn ngữ, khoảng thời gian */
export function ChonPhanDoan<T extends string>({
  muc,
  giaTri,
  onChange,
  style,
}: {
  muc: { gt: T; nhan: string }[];
  giaTri: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: mau.theAm,
          borderRadius: BO_GOC.vien,
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
              minHeight: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: BO_GOC.vien,
              backgroundColor: chon ? mau.the : 'transparent',
            }}
          >
            <Text
              style={[
                CHU.bodySm,
                { fontFamily: chon ? FONT.thanDam : FONT.than, color: mau.chu },
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

/** Thanh tiến độ của onboarding */
export function ThanhTienDo({ buoc, tong }: { buoc: number; tong: number }) {
  const mau = useMau();
  return (
    <View style={{ flexDirection: 'row', gap: KHOANG.x1 }} accessible={false}>
      {Array.from({ length: tong }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i < buoc ? mau.chu : mau.vien,
          }}
        />
      ))}
    </View>
  );
}

const kieu = StyleSheet.create({
  nut: {
    minHeight: 48,
    borderRadius: BO_GOC.nut,
    paddingHorizontal: KHOANG.x6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
