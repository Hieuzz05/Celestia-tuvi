import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Chu, ONhap, Pill, The } from '@/giao-dien/co-ban';
import { KhungBuoc } from '@/giao-dien/khung-buoc';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useT, dien } from '@/i18n/context';
import { KHOANG } from '@/thiet-ke/token';
import { CHI } from '@tuvi/constants';
import { hourToChi } from '@tuvi/lunar';
import type { DoChacGio } from '@/du-lieu/ho-so';

/**
 * Bước 3 — giờ sinh.
 *
 * Ba mức chắc chắn, và mức "không chắc" KHÔNG được âm thầm gán một giờ mặc định
 * rồi cho đi tiếp. Đây là chỗ dễ làm ẩu nhất: đoán bừa một giờ thì app vẫn chạy,
 * vẫn ra kết quả trông như thật, nhưng sai từ gốc vì cung Mệnh lệch.
 */

const KHOI_GIO = Array.from({ length: 12 }, (_, i) => {
  // Khối giờ truyền thống: Tý 23-1, Sửu 1-3, ... mỗi khối hai tiếng
  const batDau = (23 + i * 2) % 24;
  return { chiIndex: i, batDau, gioDaiDien: (batDau + 1) % 24 };
});

const haiSo = (n: number) => String(n).padStart(2, '0');

export default function BuocGioSinh() {
  const router = useRouter();
  const t = useT();
  const { banNhap, dat } = useBanNhap();

  const [doChac, setDoChac] = useState<DoChacGio>(banNhap.doChacGio);
  const [gio, setGio] = useState(() =>
    banNhap.ngaySinh ? `${haiSo(banNhap.gio)}:${haiSo(banNhap.phut)}` : ''
  );

  const khop = gio.match(/^(\d{1,2}):(\d{2})$/);
  const gioSo = khop ? Number(khop[1]) : NaN;
  const phutSo = khop ? Number(khop[2]) : NaN;
  const gioHopLe = khop !== null && gioSo >= 0 && gioSo <= 23 && phutSo >= 0 && phutSo <= 59;

  const choPhepTiep =
    doChac === 'chinh-xac' ? gioHopLe : doChac === 'khoang' ? true : false;

  const tiep = () => {
    dat('doChacGio', doChac);
    if (doChac === 'chinh-xac' && gioHopLe) {
      dat('gio', gioSo);
      dat('phut', phutSo);
    } else if (doChac === 'khoang') {
      dat('phut', 0);
    }
    router.push('/onboarding/gioi-tinh');
  };

  return (
    <KhungBuoc
      buoc={3}
      tieuDe={t.onboarding.gioTieuDe}
      choPhepTiep={choPhepTiep}
      onTiep={tiep}
    >
      <View style={{ gap: KHOANG.x3 }}>
        {(
          [
            ['chinh-xac', t.onboarding.gioBiet],
            ['khoang', t.onboarding.gioKhoang],
            ['khong-chac', t.onboarding.gioKhongChac],
          ] as [DoChacGio, string][]
        ).map(([gt, nhan]) => (
          <Pill key={gt} nhan={nhan} dangChon={doChac === gt} onPress={() => setDoChac(gt)} />
        ))}
      </View>

      {doChac === 'chinh-xac' && (
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
        </View>
      )}

      {doChac === 'khoang' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
          {KHOI_GIO.map((k) => (
            <Pill
              key={k.chiIndex}
              nhan={`${CHI[k.chiIndex]} · ${haiSo(k.batDau)}–${haiSo((k.batDau + 2) % 24)}`}
              dangChon={banNhap.gio === k.gioDaiDien}
              onPress={() => dat('gio', k.gioDaiDien)}
            />
          ))}
        </View>
      )}

      {doChac === 'khong-chac' && (
        <The am>
          <Chu kieu="bodySm">{t.onboarding.gioKhongChacY}</Chu>
        </The>
      )}
    </KhungBuoc>
  );
}
