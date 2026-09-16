import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, NutPhu, The } from '@/giao-dien/co-ban';
import { IconKetNoi, IconMuiTenPhai } from '@/giao-dien/icon';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Kết nối — thay cho "Hợp tuổi" của web.
 *
 * Khác biệt quan trọng: KHÔNG chấm một điểm tổng kiểu 82/100. Spec cấm, và lý do
 * đúng: một con số biến mối quan hệ thành phán quyết, trong khi thứ có ích là
 * biết hai người dễ đồng điệu ở đâu và cần hiểu nhau thêm ở đâu.
 *
 * Màn này hiện là khung: chọn loại quan hệ và thêm người. Phần so sánh thật cần
 * lá số của người thứ hai, nối vào khi phần "Người của tôi" chạy được.
 */
export default function ManKetNoi() {
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();

  const loai = [
    t.ketNoi.loai.nguoiYeu,
    t.ketNoi.loai.banBe,
    t.ketNoi.loai.giaDinh,
    t.ketNoi.loai.dongNghiep,
    t.ketNoi.loai.doiTac,
  ];

  const chieu = [
    t.ketNoi.chieu.giaoTiep,
    t.ketNoi.chieu.camXuc,
    t.ketNoi.chieu.vaCham,
    t.ketNoi.chieu.hoTro,
    t.ketNoi.chieu.taiChinh,
    t.ketNoi.chieu.giaiDoan,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x5,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x5,
        }}
      >
        <Chu kieu="h2">{t.ketNoi.tieuDe}</Chu>

        <View style={{ gap: KHOANG.x2 }}>
          {loai.map((l) => (
            <The key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
              <IconKetNoi size={22} mau={mau.chu} />
              <Chu kieu="body" style={{ flex: 1 }}>
                {l}
              </Chu>
              <IconMuiTenPhai size={18} mau={mau.chuNhat} />
            </The>
          ))}
        </View>

        <NutPhu nhan={t.ketNoi.themNguoi} />

        {/* Cho thấy trước sẽ đọc được những gì — không có điểm tổng */}
        <View style={{ gap: KHOANG.x3 }}>
          <Chu kieu="h3">{t.ketNoi.chieu.giaoTiep.split(' ')[0]}</Chu>
          <View style={{ gap: KHOANG.x2 }}>
            {chieu.map((c) => (
              <Chu key={c} kieu="bodySm" mo>
                · {c}
              </Chu>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
