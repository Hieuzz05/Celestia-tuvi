import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Chu, NutChu, ONhap } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT, dien } from '@/i18n/context';
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, CHU, FONT, KHOANG } from '@/thiet-ke/token';
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

  return (
    <KhungBuoc
      buoc={3}
      tieuDe={t.onboarding.gioTieuDe}
      moTa={t.onboarding.gioMo}
      choPhepTiep={choPhepTiep}
      onTiep={tiep}
    >
      {chinhXac ? (
        <View style={{ gap: KHOANG.x2 }}>
          <ONhap
            value={gio}
            onChangeText={(v) => {
              const so = v.replace(/\D/g, '').slice(0, 4);
              setGio(so.length <= 2 ? so : `${so.slice(0, 2)}:${so.slice(2)}`);
            }}
            placeholder="09:35"
            keyboardType="number-pad"
            maxLength={5}
            autoFocus
            accessibilityLabel={t.onboarding.gioNhan}
          />
          {gioHopLe && (
            <Chu kieu="bodySm">
              {dien(t.onboarding.gioSuyRa, {
                gio: `${haiSo(gioSo)}:${haiSo(phutSo)}`,
                chi: CHI[hourToChi(gioSo)],
              })}
            </Chu>
          )}
          <NutChu nhan={t.onboarding.gioThuGon} onPress={() => setChinhXac(false)} />
        </View>
      ) : (
        <View style={{ gap: KHOANG.x2 }}>
          {/* Danh sách chọn một — mỗi dòng là một vùng chạm đủ 48px */}
          <View
            accessibilityRole="radiogroup"
            style={{
              borderWidth: 1,
              borderColor: mau.vien,
              borderRadius: BO_GOC.oNhap,
              overflow: 'hidden',
            }}
          >
            {KHOI_GIO.map((k, i) => {
              const dangChon = khung === k.batDau;
              return (
                <Pressable
                  key={k.chiIndex}
                  onPress={() => setKhung(k.batDau)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: dangChon }}
                  style={({ pressed }) => ({
                    minHeight: CHAM_TOI_THIEU + 4,
                    paddingHorizontal: KHOANG.x4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: KHOANG.x3,
                    backgroundColor: dangChon ? mau.theAm : pressed ? mau.theNoi : mau.the,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: mau.vien,
                  })}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: dangChon ? 5 : 1.5,
                      borderColor: dangChon ? mau.chu : mau.vien,
                    }}
                  />
                  <Text style={[CHU.body, { flex: 1, color: mau.chu, fontFamily: dangChon ? FONT.thanDam : FONT.than }]}>
                    {`${haiSo(k.batDau)}:00 – ${haiSo(k.ketThuc)}:59`}
                    <Text style={{ color: mau.chuMo, fontFamily: FONT.than }}>
                      {` · ${dien(t.onboarding.gioKhung, { chi: CHI[k.chiIndex] })}`}
                    </Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <NutChu nhan={t.onboarding.gioBiet} onPress={() => setChinhXac(true)} />
        </View>
      )}

      <View style={{ gap: KHOANG.x2 }}>
        <NutChu nhan={t.onboarding.khongNhoGio} onPress={() => setMoGiup((v) => !v)} />
        {moGiup && (
          <View
            style={{
              gap: KHOANG.x2,
              paddingTop: KHOANG.x3,
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
      </View>
    </KhungBuoc>
  );
}
