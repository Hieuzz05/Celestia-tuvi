import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, NutChinh, ThanhTienDo } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';

export const TONG_BUOC = 5;

/**
 * Khung chung cho các bước onboarding.
 *
 * Mỗi màn hỏi đúng một việc — spec yêu cầu "one question per screen". Khung này
 * giữ cố định vị trí thanh tiến độ, nút quay lại và nút tiếp tục, để người dùng
 * không phải tìm lại chúng ở mỗi bước.
 */
export function KhungBuoc({
  buoc,
  tieuDe,
  moTa,
  children,
  nhanTiep,
  choPhepTiep = true,
  onTiep,
}: {
  buoc: number;
  tieuDe: string;
  moTa?: string;
  children: ReactNode;
  nhanTiep?: string;
  choPhepTiep?: boolean;
  onTiep: () => void;
}) {
  const router = useRouter();
  const mau = useMau();
  const t = useT();
  const le = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: mau.nen }}
    >
      <View style={{ paddingTop: le.top + KHOANG.x2, paddingHorizontal: LE_NGANG, gap: KHOANG.x4 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.chung.quayLai}
          hitSlop={8}
          style={{
            width: CHAM_TOI_THIEU,
            height: CHAM_TOI_THIEU,
            justifyContent: 'center',
            marginLeft: -KHOANG.x3,
          }}
        >
          <IconQuayLai size={22} mau={mau.chu} />
        </Pressable>

        <ThanhTienDo buoc={buoc} tong={TONG_BUOC} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: LE_NGANG,
          paddingTop: KHOANG.x8,
          paddingBottom: KHOANG.x8,
          gap: KHOANG.x5,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: KHOANG.x3 }}>
          <Chu kieu="h1">{tieuDe}</Chu>
          {moTa && (
            <Chu kieu="body" mo>
              {moTa}
            </Chu>
          )}
        </View>

        {children}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + KHOANG.x4,
          paddingTop: KHOANG.x2,
        }}
      >
        <NutChinh
          nhan={nhanTiep ?? t.chung.tiepTuc}
          onPress={onTiep}
          vohieu={!choPhepTiep}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
