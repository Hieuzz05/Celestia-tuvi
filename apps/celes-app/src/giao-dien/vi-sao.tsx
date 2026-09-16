import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { CanCu } from '@tuvi/quick-read';
import { Chu, Eyebrow, NutChu, Pill } from '@/giao-dien/co-ban';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * "Muốn biết vì sao không?" — tương tác chữ ký của cả sản phẩm.
 *
 * Quy tắc từ spec, và cũng là lý do nó đáng tin: mở ra thì thấy lời giải thích dễ
 * hiểu TRƯỚC, phần thuật ngữ Tử Vi chỉ hiện khi người dùng chủ động mở tiếp. Đảo
 * thứ tự này là biến nó thành bảng dữ liệu, mất hết tác dụng với người mới.
 *
 * Nó luôn miễn phí và luôn có mặt — đây là thứ tạo niềm tin, không phải tính năng
 * để bán.
 */

export function LienKetViSao({ onPress }: { onPress: () => void }) {
  const t = useT();
  return <NutChu nhan={t.viSao.lienKet} onPress={onPress} />;
}

export function BangViSao({
  hienThi,
  onDong,
  canCu,
  tomTat,
}: {
  hienThi: boolean;
  onDong: () => void;
  canCu: CanCu[];
  /** Một câu đời thường mở đầu, viết cho người chưa biết gì về Tử Vi */
  tomTat?: string;
}) {
  const t = useT();
  const mau = useMau();
  const sheet = useRef<BottomSheet>(null);
  const [moKyThuat, setMoKyThuat] = useState(false);

  const nac = useMemo(() => ['62%', '90%'], []);

  const nenMo = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.35} />
    ),
    []
  );

  if (!hienThi) return null;

  return (
    <BottomSheet
      ref={sheet}
      snapPoints={nac}
      enablePanDownToClose
      onClose={onDong}
      backdropComponent={nenMo}
      backgroundStyle={{
        backgroundColor: mau.the,
        borderTopLeftRadius: BO_GOC.bottomSheet,
        borderTopRightRadius: BO_GOC.bottomSheet,
      }}
      handleIndicatorStyle={{ backgroundColor: mau.vien, width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x5,
        }}
      >
        <Chu kieu="h2">{t.viSao.tieuDe}</Chu>

        {/* Lớp một: lời đời thường. Người mới chỉ cần đọc tới đây là đủ. */}
        {tomTat && <Chu kieu="body">{tomTat}</Chu>}

        <View style={{ gap: KHOANG.x3 }}>
          <Eyebrow>{t.viSao.mucDiem}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
            {canCu.map((c) => (
              <Pill key={c.nhan} nhan={c.nhan} />
            ))}
          </View>
        </View>

        {/* Lớp hai: thuật ngữ, chỉ mở khi người dùng muốn */}
        <Pressable
          onPress={() => setMoKyThuat((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: moKyThuat }}
          style={{
            minHeight: CHAM_TOI_THIEU,
            justifyContent: 'center',
            borderTopWidth: 1,
            borderColor: mau.vien,
            paddingTop: KHOANG.x3,
          }}
        >
          <Chu kieu="bodySm" style={{ color: mau.hanhDong }}>
            {moKyThuat ? t.viSao.dongKyThuat : t.viSao.moKyThuat}
          </Chu>
        </Pressable>

        {moKyThuat && (
          <View style={{ gap: KHOANG.x4 }}>
            {canCu.map((c) => (
              <View key={c.nhan} style={{ gap: KHOANG.x1 }}>
                <Chu kieu="bodySm" style={{ fontWeight: '600' }}>
                  {c.nhan}
                </Chu>
                <Chu kieu="bodySm" mo>
                  {c.giaiThich}
                </Chu>
              </View>
            ))}

            <View style={{ gap: KHOANG.x2 }}>
              <Eyebrow>{t.viSao.mucNguon}</Eyebrow>
              <Chu kieu="caption" mo>
                {t.viSao.chuaCoNguon}
              </Chu>
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
