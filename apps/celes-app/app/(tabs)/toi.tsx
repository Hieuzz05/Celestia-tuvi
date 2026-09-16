import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, ChonPhanDoan, Eyebrow, The } from '@/giao-dien/co-ban';
import { IconBanDo, IconMuiTenPhai, IconSach, IconToi } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useNgonNgu, useT, type NgonNgu } from '@/i18n/context';
import { useMau, useTheme } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Tôi — tài khoản, dữ liệu, trải nghiệm, cài đặt nâng cao.
 *
 * Ngôn ngữ và giao diện đặt ở đây dưới dạng bộ chọn phân đoạn, không phải ô tích:
 * ô tích diễn đạt bật/tắt, mà đây là chọn một trong nhiều.
 *
 * Phần phương pháp lập lá số nằm sâu trong Nâng cao và chưa mở — đổi phương pháp
 * làm đổi vị trí sao, nên cần màn xác nhận riêng trước khi tính lại.
 */
export default function ManToi() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { ngonNgu, datNgonNgu } = useNgonNgu();
  const { luaChon, datTheme } = useTheme();
  const { hoSo } = useHoSo();

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x5,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
          <IconToi size={32} mau={mau.chu} />
          <View style={{ flex: 1 }}>
            <Chu kieu="h2">{hoSo?.ten?.trim() || t.toi.tieuDe}</Chu>
            <Chu kieu="caption" mo>
              {t.toi.chuaDangNhap}
            </Chu>
          </View>
        </View>

        {/* --- Dữ liệu của tôi --- */}
        <View style={{ gap: KHOANG.x3 }}>
          <Eyebrow>{t.toi.nhomDuLieu}</Eyebrow>
          <View style={{ gap: KHOANG.x2 }}>
            {[
              { nhan: t.toi.nguoiCuaToi, icon: IconToi },
              { nhan: t.homNay.khamPha.banDo, icon: IconBanDo, di: '/ban-do' as const },
              { nhan: t.toi.daLuu, icon: IconSach },
            ].map((m) => (
              <The
                key={m.nhan}
                onPress={m.di ? () => router.push(m.di) : undefined}
                style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}
              >
                <m.icon size={20} mau={mau.chu} />
                <Chu kieu="body" style={{ flex: 1 }}>
                  {m.nhan}
                </Chu>
                <IconMuiTenPhai size={18} mau={mau.chuNhat} />
              </The>
            ))}
          </View>
        </View>

        {/* --- Trải nghiệm --- */}
        <View style={{ gap: KHOANG.x4 }}>
          <Eyebrow>{t.toi.nhomTraiNghiem}</Eyebrow>

          <View style={{ gap: KHOANG.x2 }}>
            <Chu kieu="bodySm" mo>
              {t.toi.ngonNgu}
            </Chu>
            <ChonPhanDoan<NgonNgu>
              giaTri={ngonNgu}
              onChange={datNgonNgu}
              muc={[
                { gt: 'vi', nhan: 'Tiếng Việt' },
                { gt: 'en', nhan: 'English' },
              ]}
            />
          </View>

          <View style={{ gap: KHOANG.x2 }}>
            <Chu kieu="bodySm" mo>
              {t.toi.giaoDien}
            </Chu>
            <ChonPhanDoan
              giaTri={luaChon}
              onChange={datTheme}
              muc={[
                { gt: 'tu-dong' as const, nhan: t.toi.giaoDienTuDong },
                { gt: 'sang' as const, nhan: t.toi.giaoDienSang },
                { gt: 'toi' as const, nhan: t.toi.giaoDienToi },
              ]}
            />
          </View>
        </View>

        {/* --- Nâng cao --- */}
        <View style={{ gap: KHOANG.x3 }}>
          <Eyebrow>{t.toi.nhomNangCao}</Eyebrow>
          <The style={{ gap: KHOANG.x1 }}>
            <Chu kieu="body">{t.toi.phuongPhap}</Chu>
            <Chu kieu="caption" mo>
              {t.trangThai.rong}
            </Chu>
          </The>
        </View>
      </ScrollView>
    </View>
  );
}
