import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Chu, ONhap } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { KHOANG } from '@/thiet-ke/token';

/**
 * Bước 2 — ngày sinh.
 *
 * Nhập tay theo NN/TT/NNNN thay vì mở lịch hệ thống: người dùng phải cuộn lùi
 * vài chục năm trên bánh xe chọn ngày, rất mệt. Gõ tám chữ số nhanh hơn nhiều,
 * và tự chèn dấu gạch để không phải căn tay.
 */

function chuanHoa(nhap: string) {
  const so = nhap.replace(/\D/g, '').slice(0, 8);
  if (so.length <= 2) return so;
  if (so.length <= 4) return `${so.slice(0, 2)}/${so.slice(2)}`;
  return `${so.slice(0, 2)}/${so.slice(2, 4)}/${so.slice(4)}`;
}

/** Trả về YYYY-MM-DD nếu hợp lệ, ngược lại null */
export function doiSangISO(hienThi: string): string | null {
  const m = hienThi.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const ngay = Number(dd);
  const thang = Number(mm);
  const nam = Number(yyyy);
  if (thang < 1 || thang > 12) return null;
  if (nam < 1900 || nam > new Date().getFullYear()) return null;

  // Kiểm tra ngày có thật trong tháng đó — 31/02 phải bị chặn
  const d = new Date(nam, thang - 1, ngay);
  if (d.getFullYear() !== nam || d.getMonth() !== thang - 1 || d.getDate() !== ngay) return null;

  return `${yyyy}-${mm}-${dd}`;
}

export default function BuocNgaySinh() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const { banNhap, dat } = useBanNhap();

  const [hienThi, setHienThi] = useState(() => {
    if (!banNhap.ngaySinh) return '';
    const [y, m, d] = banNhap.ngaySinh.split('-');
    return `${d}/${m}/${y}`;
  });

  const iso = doiSangISO(hienThi);
  const daGoDu = hienThi.replace(/\D/g, '').length === 8;

  return (
    <KhungBuoc
      buoc={2}
      tieuDe={t.onboarding.ngayTieuDe}
      moTa={t.onboarding.ngayMoTa}
      choPhepTiep={!!iso}
      onTiep={() => {
        if (!iso) return;
        dat('ngaySinh', iso);
        router.push('/onboarding/gio-sinh');
      }}
    >
      <View style={{ gap: KHOANG.x2 }}>
        <ONhap
          value={hienThi}
          onChangeText={(v) => setHienThi(chuanHoa(v))}
          placeholder={t.onboarding.ngayVD}
          keyboardType="number-pad"
          autoFocus
          maxLength={10}
          accessibilityLabel={t.onboarding.ngayNhan}
        />
        {daGoDu && !iso && (
          <Chu kieu="caption" style={{ color: mau.xau }}>
            {t.onboarding.ngayLoi}
          </Chu>
        )}
      </View>
    </KhungBuoc>
  );
}
