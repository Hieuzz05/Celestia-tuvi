import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Pill } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import type { BanKhoan } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { KHOANG } from '@/thiet-ke/token';

/**
 * Bước 5 — điều đang khiến người dùng nghĩ nhiều nhất.
 *
 * Không phải câu hỏi cho có: lựa chọn ở đây quyết định góc nhìn nào được đưa lên
 * đầu ở màn Quick Read. Người đang rối chuyện công việc và người đang rối chuyện
 * tình cảm không nên đọc cùng một thứ đầu tiên, dù lá số y hệt nhau.
 *
 * Cho chọn tối đa hai — chọn hết thì không còn là ưu tiên nữa.
 */

const TOI_DA = 2;

const THU_TU: BanKhoan[] = [
  'congViec',
  'tinhCam',
  'banThan',
  'giaDinh',
  'taiChinh',
  'quyetDinh',
  'chuaRo',
];

export default function BuocBanKhoan() {
  const router = useRouter();
  const t = useT();
  const { banNhap, dat } = useBanNhap();

  const doiChon = (b: BanKhoan) => {
    const dang = banNhap.banKhoan;
    if (dang.includes(b)) {
      dat('banKhoan', dang.filter((x) => x !== b));
      return;
    }
    // "Chưa rõ" loại trừ các lựa chọn khác — chọn nó nghĩa là chưa muốn khoanh vùng
    if (b === 'chuaRo') {
      dat('banKhoan', ['chuaRo']);
      return;
    }
    const sach = dang.filter((x) => x !== 'chuaRo');
    dat('banKhoan', [...sach, b].slice(-TOI_DA));
  };

  return (
    <KhungBuoc
      buoc={5}
      tieuDe={t.onboarding.banKhoanTieuDe}
      moTa={t.onboarding.banKhoanMoTa}
      nhanTiep={t.onboarding.banKhoanCta}
      choPhepTiep={banNhap.banKhoan.length > 0}
      onTiep={() => router.push('/dang-tao')}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
        {THU_TU.map((b) => (
          <Pill
            key={b}
            nhan={t.onboarding.banKhoan[b]}
            dangChon={banNhap.banKhoan.includes(b)}
            onPress={() => doiChon(b)}
          />
        ))}
      </View>
    </KhungBuoc>
  );
}
