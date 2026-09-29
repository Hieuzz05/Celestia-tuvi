import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, ChuNhan, Eyebrow, NenVung, NutChinh, NutIcon, ThanhTienDo } from '@/giao-dien/co-ban';
import { Icon, type TenIcon } from '@/giao-dien/icon-aurora';
import { dien, useT } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, CHU, FONT, KHOANG, LE_NGANG, type TenVung } from '@/thiet-ke/token';

export const TONG_BUOC = 5;

/**
 * Chuỗi có cụm nhấn đánh dấu bằng dấu sao: "Celes nên *gọi bạn* là gì?".
 * Phần giữa hai dấu sao tô màu vùng (bản thiết kế là chữ gradient — xem ChuNhan).
 * Giữ cú pháp ở i18n để người dịch tự chọn cụm nhấn hợp với câu tiếng của họ.
 */
export function ChuCoNhan({ chu, vung }: { chu: string; vung: TenVung }) {
  return (
    <>
      {chu.split('*').map((doan, i) =>
        i % 2 === 1 ? (
          <ChuNhan key={i} vung={vung}>
            {doan}
          </ChuNhan>
        ) : (
          doan
        ),
      )}
    </>
  );
}

/**
 * Ô lựa chọn lớn của onboarding (giới tính, điều bận tâm, khung giờ) — bản
 * `gt_tile` / ô bận tâm trong thiết kế: đang chọn thì viền và nền ấm màu vùng,
 * góc phải có dấu tick tròn. Không phải Pill: đây là câu trả lời chính của màn,
 * cần to và dễ chạm.
 */
export function OChon({
  nhan,
  phu,
  dangChon,
  onPress,
  icon,
  cao = 58,
  nhanLon,
  nhieu,
  style,
}: {
  nhan: string;
  phu?: string;
  dangChon: boolean;
  onPress: () => void;
  icon?: TenIcon;
  cao?: number;
  /** Chữ display cỡ lớn, dồn xuống đáy ô (ô giới tính) */
  nhanLon?: boolean;
  /** Chọn được nhiều ô cùng lúc — trình đọc màn hình đọc là ô đánh dấu */
  nhieu?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const mau = useMau();
  const v = useVung('khoiDau');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={nhieu ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: dangChon }}
      accessibilityLabel={phu ? `${nhan}, ${phu}` : nhan}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}
    >
      <View
        style={{
          minHeight: Math.max(cao, CHAM_TOI_THIEU),
          borderRadius: nhanLon ? BO_GOC.the : 18,
          borderWidth: 1,
          borderColor: dangChon ? `rgba(${v.rgb},0.55)` : mau.vienKinh,
          backgroundColor: dangChon ? `rgba(${v.rgb},0.12)` : mau.the,
          paddingHorizontal: nhanLon ? KHOANG.x4 : KHOANG.x3,
          paddingVertical: nhanLon ? KHOANG.x4 : KHOANG.x2,
          flexDirection: 'row',
          alignItems: nhanLon ? 'flex-end' : 'center',
          gap: 10,
        }}
      >
        {icon ? (
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: BO_GOC.nho,
              backgroundColor: dangChon ? v.mau : mau.theAm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon ten={icon} size={20} net={2} mau={dangChon ? mau.nen : mau.chuMo} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2, paddingRight: dangChon ? 22 : 0 }}>
          <Text
            style={
              nhanLon
                ? { fontFamily: FONT.display, fontSize: 24, lineHeight: 28, color: mau.chu }
                : {
                    fontFamily: dangChon ? FONT.thanRatDam : FONT.thanVua,
                    fontSize: 15,
                    lineHeight: 19,
                    color: mau.chu,
                  }
            }
          >
            {nhan}
          </Text>
          {phu ? (
            <Text style={{ fontFamily: FONT.than, fontSize: 13, lineHeight: 17, color: mau.chuMo }}>{phu}</Text>
          ) : null}
        </View>
        {dangChon ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: v.mau,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon ten="check" size={12} net={3} mau={mau.nen} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Kiểu ô nhập lớn của onboarding: chữ display, viền ấm khi đã có nội dung */
export function useKieuONhapLon(coNoiDung: boolean): TextStyle {
  const v = useVung('khoiDau');
  return {
    fontFamily: FONT.displayVua,
    fontSize: 22,
    minHeight: 60,
    borderColor: coNoiDung ? `rgba(${v.rgb},0.6)` : undefined,
  };
}

/**
 * Khung chung cho các bước onboarding — Aurora bản 8, vùng Khởi đầu.
 *
 * Mỗi màn hỏi đúng một việc — spec yêu cầu "one question per screen". Khung này
 * giữ cố định hàng đầu (nút lùi · thanh tiến độ · n/5) và nút tiếp tục ở đáy, để
 * người dùng không phải tìm lại chúng ở mỗi bước.
 *
 * Bỏ `buoc` thì khung ẩn thanh tiến độ — dùng cho màn một-câu-hỏi nằm ngoài
 * onboarding (đăng nhập), nơi "bước 3/5" là sai.
 */
export function KhungBuoc({
  buoc,
  eyebrow,
  tieuDe,
  moTa,
  children,
  nhanTiep,
  ghiChu,
  choPhepTiep = true,
  onTiep,
}: {
  buoc?: number;
  /** Nhãn mono nhỏ trên tiêu đề */
  eyebrow?: string;
  /** Có thể chứa cụm *nhấn* */
  tieuDe: string;
  moTa?: string;
  children: ReactNode;
  nhanTiep?: string;
  /** Dòng chú thích nhỏ ngay trên nút tiếp tục */
  ghiChu?: string;
  choPhepTiep?: boolean;
  onTiep: () => void;
}) {
  const router = useRouter();
  const mau = useMau();
  const v = useVung('khoiDau');
  const t = useT();
  const le = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: mau.nen }}
    >
      <NenVung vung="khoiDau" />

      <View
        style={{
          paddingTop: le.top + KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          flexDirection: 'row',
          alignItems: 'center',
          gap: KHOANG.x3,
        }}
      >
        <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
        {buoc !== undefined && (
          <>
            <View
              style={{ flex: 1 }}
              accessible
              accessibilityLabel={dien(t.onboarding.buoc, { so: buoc, tong: TONG_BUOC })}
            >
              <ThanhTienDo buoc={buoc} tong={TONG_BUOC} vung="khoiDau" />
            </View>
            <Text
              accessible={false}
              style={{ fontFamily: FONT.mono, fontSize: 12, lineHeight: 16, color: mau.chuMo }}
            >
              {`${buoc}/${TONG_BUOC}`}
            </Text>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: LE_NGANG,
          paddingTop: KHOANG.x6,
          paddingBottom: KHOANG.x8,
          gap: KHOANG.x5,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 10 }}>
          {eyebrow ? <Eyebrow mauChu={v.mau}>{eyebrow}</Eyebrow> : null}
          <Chu kieu="display" accessibilityRole="header">
            <ChuCoNhan chu={tieuDe} vung="khoiDau" />
          </Chu>
          {moTa ? (
            <Chu kieu="body" mo>
              {moTa}
            </Chu>
          ) : null}
        </View>

        {children}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x4,
          paddingTop: KHOANG.x2,
          gap: KHOANG.x3,
        }}
      >
        {ghiChu ? (
          <Text style={[CHU.caption, { fontFamily: FONT.than, fontSize: 13, color: mau.chuMo, textAlign: 'center' }]}>
            {ghiChu}
          </Text>
        ) : null}
        <NutChinh nhan={nhanTiep ?? t.chung.tiepTuc} onPress={onTiep} vohieu={!choPhepTiep} />
      </View>
    </KeyboardAvoidingView>
  );
}
