import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BeMatKinh, Chu, HangDanhSach, NutChu, ONhap } from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { KhungBuoc, OChon, useKieuONhapLon } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT, dien } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { BO_GOC, FONT, KHOANG } from '@/thiet-ke/token';
import { CHI } from '@tuvi/constants';
import { hourToChi } from '@tuvi/lunar';

/**
 * Bước 3 — giờ sinh, cùng cách hỏi với web (`components/FormSinh.tsx`).
 *
 * Mặc định là 12 khung giờ hai tiếng, ghi giờ đồng hồ TRƯỚC rồi mới tới tên chi
 * ("23:00 – 00:59 · giờ Tý") — người chưa biết tử vi đọc được ngay chữ đầu.
 * Ai nhớ chính xác giờ phút thì mở ô nhập. Ai không nhớ thì có lời giải thích,
 * nhưng KHÔNG có nút đi tiếp với một giờ mặc định: đoán bừa một giờ thì app
 * vẫn chạy, vẫn ra kết quả trông như thật, nhưng sai từ gốc vì cung Mệnh lệch.
 *
 * Khung giờ lưu giờ ĐẦU khung (23, 1, 3…) đúng như web, để cùng một người nhập
 * ở hai nơi ra cùng một lá số.
 */

const KHOI_GIO = Array.from({ length: 12 }, (_, i) => {
  const batDau = (23 + i * 2) % 24;
  return { chiIndex: i, batDau, ketThuc: (batDau + 1) % 24 };
});

const haiSo = (n: number) => String(n).padStart(2, '0');

export default function BuocGioSinh() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('khoiDau');
  const { dat } = useBanNhap();

  const [chinhXac, setChinhXac] = useState(false);
  const [khung, setKhung] = useState<number | null>(null);
  const [gio, setGio] = useState('');
  const [moGiup, setMoGiup] = useState(false);

  const khop = gio.match(/^(\d{1,2}):(\d{2})$/);
  const gioSo = khop ? Number(khop[1]) : NaN;
  const phutSo = khop ? Number(khop[2]) : NaN;
  const gioHopLe = khop !== null && gioSo >= 0 && gioSo <= 23 && phutSo >= 0 && phutSo <= 59;

  const choPhepTiep = chinhXac ? gioHopLe : khung !== null;
  const kieuNhap = useKieuONhapLon(gioHopLe);

  const tiep = () => {
    if (chinhXac && gioHopLe) {
      dat('doChacGio', 'chinh-xac');
      dat('gio', gioSo);
      dat('phut', phutSo);
    } else if (khung !== null) {
      dat('doChacGio', 'khoang');
      dat('gio', khung);
      dat('phut', 0);
    }
    router.push('/onboarding/gioi-tinh');
  };

  const cap = Array.from({ length: KHOI_GIO.length / 2 }, (_, i) => KHOI_GIO.slice(i * 2, i * 2 + 2));

  return (
    <KhungBuoc
      buoc={3}
      eyebrow={t.onboarding.gioEyebrow}
      tieuDe={t.onboarding.gioTieuDe}
      moTa={t.onboarding.gioMo}
      choPhepTiep={choPhepTiep}
      onTiep={tiep}
    >
      {chinhXac ? (
        <View style={{ gap: KHOANG.x3 }}>
          <ONhap
            value={gio}
            onChangeText={(chu) => {
              const so = chu.replace(/\D/g, '').slice(0, 4);
              setGio(so.length <= 2 ? so : `${so.slice(0, 2)}:${so.slice(2)}`);
            }}
            placeholder="09:35"
            keyboardType="number-pad"
            maxLength={5}
            autoFocus
            accessibilityLabel={t.onboarding.gioNhan}
            style={[kieuNhap, { letterSpacing: 1 }]}
          />
          {gioHopLe && (
            <View
              style={{
                alignSelf: 'flex-start',
                minHeight: 32,
                paddingHorizontal: KHOANG.x3,
                borderRadius: BO_GOC.vien,
                borderWidth: 1,
                borderColor: `rgba(${v.rgb},0.40)`,
                backgroundColor: `rgba(${v.rgb},0.16)`,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon ten="clock" size={14} net={2.2} mau={v.sang} />
              <Text style={{ fontFamily: FONT.thanRatDam, fontSize: 13, color: v.sang }}>
                {dien(t.onboarding.gioSuyRa, {
                  gio: `${haiSo(gioSo)}:${haiSo(phutSo)}`,
                  chi: CHI[hourToChi(gioSo)],
                })}
              </Text>
            </View>
          )}
          <NutChu nhan={t.onboarding.gioThuGon} mauChu={v.mau} onPress={() => setChinhXac(false)} />
        </View>
      ) : (
        <View style={{ gap: KHOANG.x2 }}>
          {/* Lưới chọn một, hai cột — giờ đồng hồ trước, tên chi sau */}
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {cap.map((hang) => (
              <View key={hang[0].chiIndex} style={{ flexDirection: 'row', gap: 10 }}>
                {hang.map((k) => (
                  <OChon
                    key={k.chiIndex}
                    nhan={`${haiSo(k.batDau)}:00 – ${haiSo(k.ketThuc)}:59`}
                    phu={dien(t.onboarding.gioKhung, { chi: CHI[k.chiIndex] })}
                    dangChon={khung === k.batDau}
                    onPress={() => setKhung(k.batDau)}
                    style={{ flex: 1 }}
                  />
                ))}
              </View>
            ))}
          </View>
          <NutChu nhan={t.onboarding.gioBiet} mauChu={v.mau} onPress={() => setChinhXac(true)} />
        </View>
      )}

      {/* Không nhớ giờ: chỉ giải thích và chỉ chỗ tìm, KHÔNG cho đi tiếp với giờ đoán */}
      <BeMatKinh style={{ borderRadius: 16, paddingHorizontal: KHOANG.x4 }}>
        <HangDanhSach
          icon="clock"
          mauIcon={v.mau}
          nhan={t.onboarding.khongNhoGio}
          phu={t.onboarding.khongNhoGioPhu}
          onPress={() => setMoGiup((m) => !m)}
          phai={
            <View style={{ transform: [{ rotate: moGiup ? '-90deg' : '90deg' }] }}>
              <Icon ten="chev" size={18} net={2} mau={mau.chuNhat} />
            </View>
          }
        />
        {moGiup && (
          <View
            style={{
              gap: KHOANG.x2,
              paddingTop: KHOANG.x3,
              paddingBottom: KHOANG.x4,
              borderTopWidth: 1,
              borderTopColor: mau.vien,
            }}
          >
            <Chu kieu="bodySm" mo>
              {t.onboarding.khongNhoGioY1}
            </Chu>
            <Chu kieu="bodySm" mo>
              {t.onboarding.khongNhoGioY2}
            </Chu>
          </View>
        )}
      </BeMatKinh>
    </KhungBuoc>
  );
}
