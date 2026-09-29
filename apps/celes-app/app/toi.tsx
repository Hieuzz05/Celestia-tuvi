import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnhDaiDien,
  Chu,
  ChonPhanDoan,
  DauVung,
  Eyebrow,
  HangDanhSach,
  KeNgang,
  NenVung,
  NutChinh,
  NutIcon,
  The,
} from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { useNgonNgu, useT, type NgonNgu } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { BO_GOC, FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Tài khoản — mở từ ảnh đại diện ở đầu các tab, là màn chồng (stack), không
 * phải một tab: có nút quay lại, và đáy chỉ chừa vùng an toàn chứ không chừa
 * thanh tab nổi.
 *
 * Ngôn ngữ và giao diện đặt ở đây dưới dạng bộ chọn phân đoạn, không phải ô tích:
 * ô tích diễn đạt bật/tắt, mà đây là chọn một trong nhiều.
 *
 * Phần phương pháp lập lá số nằm sâu trong cài đặt và chưa mở — đổi phương pháp
 * làm đổi vị trí sao, nên cần màn xác nhận riêng trước khi tính lại.
 *
 * Giao diện: Aurora bản 8 (`docs/thiet-ke/celes-ios/aurora/gen.py`, mục Toi).
 * Bản thiết kế có "Celes đang nhớ", Thông báo, Quyền riêng tư, Xoá tài khoản —
 * app chưa có dữ liệu hay luồng cho các mục đó nên chưa hiện, không dựng hàng rỗng.
 */
export default function ManToi() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('toi');
  const le = useSafeAreaInsets();
  const { ngonNgu, datNgonNgu } = useNgonNgu();
  const { luaChon, datTheme } = useTheme();
  const { hoSo } = useHoSo();
  const { coTaiKhoan, dangNap, email, dangXuat } = useTaiKhoan();

  const quayLai = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="toi" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + 24,
          gap: KHOANG.x5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={quayLai} />
          <DauVung vung="toi" ten={t.toi.nhomTaiKhoan} />
        </View>

        {/* Hồ sơ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <AnhDaiDien ten={hoSo?.ten} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Chu kieu="h1" numberOfLines={2}>
              {hoSo?.ten?.trim() || t.toi.tieuDe}
            </Chu>
            <Chu kieu="bodySm" mo numberOfLines={1}>
              {email ?? t.toi.chuaDangNhap}
            </Chu>
          </View>
        </View>

        {/* Lá số của tôi — lối nhanh vào mệnh bàn */}
        <Pressable
          onPress={() => router.push('/ban-do')}
          accessibilityRole="button"
          accessibilityLabel={t.nguoi.cuaToi}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <The style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: BO_GOC.nho,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `rgba(${v.rgb},0.14)`,
              }}
            >
              <Icon ten="laso" size={22} net={1.8} mau={v.sang} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: FONT.thanDam, fontSize: 16, lineHeight: 21, color: mau.chu }}>
                {t.nguoi.cuaToi}
              </Text>
              <Chu kieu="caption" mo>
                {t.toi.laSoPhu}
              </Chu>
            </View>
            <Icon ten="chev" size={18} net={2} mau={mau.chuNhat} />
          </The>
        </Pressable>

        {/* Dữ liệu của tôi */}
        <View style={{ gap: KHOANG.x2 }}>
          <Eyebrow>{t.toi.nhomDuLieu}</Eyebrow>
          <The style={{ paddingVertical: KHOANG.x1 }}>
            <HangDanhSach icon="users" nhan={t.toi.nguoiCuaToi} onPress={() => router.push('/nguoi-cua-toi')} />
            <KeNgang />
            <HangDanhSach icon="bookmark" nhan={t.toi.daLuu} />
          </The>
        </View>

        {/* Cài đặt: giao diện, ngôn ngữ, phương pháp */}
        <View style={{ gap: KHOANG.x2 }}>
          <Eyebrow>{t.toi.caiDat}</Eyebrow>
          <The style={{ gap: KHOANG.x4 }}>
            <View style={{ gap: KHOANG.x2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
                <Icon ten="moon" size={20} net={1.9} mau={mau.chuMo} />
                <Chu kieu="body" dam>
                  {t.toi.giaoDien}
                </Chu>
              </View>
              <ChonPhanDoan
                vung="toi"
                giaTri={luaChon}
                onChange={datTheme}
                muc={[
                  { gt: 'toi' as const, nhan: t.toi.giaoDienToi },
                  { gt: 'sang' as const, nhan: t.toi.giaoDienSang },
                  { gt: 'tu-dong' as const, nhan: t.toi.giaoDienTuDong },
                ]}
              />
            </View>

            <KeNgang />

            <View style={{ gap: KHOANG.x2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
                <Icon ten="compass" size={20} net={1.9} mau={mau.chuMo} />
                <Chu kieu="body" dam>
                  {t.toi.ngonNgu}
                </Chu>
              </View>
              <ChonPhanDoan<NgonNgu>
                vung="toi"
                giaTri={ngonNgu}
                onChange={datNgonNgu}
                muc={[
                  { gt: 'vi', nhan: 'Tiếng Việt' },
                  { gt: 'en', nhan: 'English' },
                ]}
              />
            </View>

            <KeNgang />

            <HangDanhSach icon="book" nhan={t.toi.phuongPhap} phu={t.trangThai.rong} />
          </The>
        </View>

        {/* Tài khoản: ẩn hẳn khi app dựng thiếu cấu hình, và trong lúc đọc phiên cũ */}
        {coTaiKhoan && !dangNap && (
          <View style={{ gap: KHOANG.x2 }}>
            <Eyebrow>{t.toi.nhomTaiKhoan}</Eyebrow>
            {email ? (
              <The style={{ paddingVertical: KHOANG.x1 }}>
                <HangDanhSach
                  icon="back"
                  nhan={t.toi.dangXuat}
                  onPress={dangXuat}
                  mauIcon={mau.xau}
                  mauChu={mau.xau}
                  phai={<View />}
                />
              </The>
            ) : (
              <The style={{ gap: KHOANG.x3 }}>
                <Chu kieu="bodySm" mo>
                  {t.toi.dangNhapMoTa}
                </Chu>
                <NutChinh nhan={t.toi.dangNhap} onPress={() => router.push('/dang-nhap?sau=quay-lai')} />
              </The>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
