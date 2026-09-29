import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChonPhanDoan,
  Chu,
  DauVung,
  Eyebrow,
  NenVung,
  NutChinh,
  NutChu,
  NutIcon,
  NutPhu,
  ONhap,
  Pill,
  The,
} from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { thongTinSinh, useHoSo } from '@/du-lieu/ho-so';
import { khungGio, type NguoiLuu, type NguoiMoi } from '@/du-lieu/la-so-luu';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { CHI } from '@tuvi/constants';
import type { GioiTinh } from '@tuvi/ansao';
import { doiSangISO } from './onboarding/ngay-sinh';

/**
 * Người của tôi — lá số của mình và của những người mình muốn hiểu hơn.
 *
 * Cùng danh sách với web (bảng `charts`) khi đã đăng nhập. "Lá số của tôi" chỉ
 * đổi khi người dùng tự bấm — xem một người khác KHÔNG đổi lá số của mình
 * (docs/bay/giao-dien.md: mặc định ≠ đang xem).
 *
 * Form thêm người gọn hơn onboarding: chỉ chọn khung giờ (12 chi), vì đây là lá
 * số người khác mà ít ai nhớ tới phút. Giờ lưu là giờ đầu khung, đúng như ô chọn
 * khung giờ bên web lưu.
 *
 * Giao diện: Aurora bản 8 — vùng màu Mối quan hệ. Nút fuchsia duy nhất là
 * "Lưu" trong form; ngoài form chỉ có nút phụ "Thêm người".
 */

const KHUNG = Array.from({ length: 12 }, (_, i) => (23 + i * 2) % 24);
const hai = (n: number) => String(n).padStart(2, '0');

/** Nền chữ cái đầu — cùng dãy pastel với hàng người ở tab Mối quan hệ */
const MAU_NGUOI = ['#FFF1BD', '#BBF7D0', '#E6DDEA', '#BAE6FD', '#FFD6CF'];

function ChuCaiDau({ ten, nen }: { ten: string; nen: string }) {
  return (
    <View
      accessible={false}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: nen, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: FONT.display, fontSize: 18, color: '#240029' }}>
        {(ten.trim()[0] ?? '·').toUpperCase()}
      </Text>
    </View>
  );
}

function chuanHoaNgay(nhap: string) {
  const so = nhap.replace(/\D/g, '').slice(0, 8);
  if (so.length <= 2) return so;
  if (so.length <= 4) return `${so.slice(0, 2)}/${so.slice(2)}`;
  return `${so.slice(0, 2)}/${so.slice(2, 4)}/${so.slice(4)}`;
}

export default function ManNguoiCuaToi() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('moiQuanHe');
  const le = useSafeAreaInsets();
  const { coTaiKhoan, email } = useTaiKhoan();
  const { hoSo, nguoi, laCuaToi, themNguoi, xoaNguoi, datLamCuaToi } = useHoSo();

  const [moForm, setMoForm] = useState(false);
  const [ten, setTen] = useState('');
  const [ngay, setNgay] = useState('');
  const [gio, setGio] = useState<number | null>(null);
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nu');
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(false);

  const moTaSinh = (n: NguoiMoi) =>
    [
      `${hai(n.ngay)}/${hai(n.thang)}/${n.nam}`,
      dien(t.nguoi.gio, { chi: CHI[khungGio(n.gio)] }),
      n.gioiTinh === 'nam' ? t.onboarding.nam : t.onboarding.nu,
    ].join(' · ');

  const iso = doiSangISO(ngay);
  const duThongTin = ten.trim().length > 0 && !!iso && gio !== null;

  const luu = async () => {
    if (!duThongTin || dangLuu || !iso || gio === null) return;
    const [nam, thang, ngaySo] = iso.split('-').map(Number);
    setDangLuu(true);
    setLoi(false);
    try {
      await themNguoi({ hoTen: ten.trim(), ngay: ngaySo, thang, nam, gio, gioiTinh });
      setTen('');
      setNgay('');
      setGio(null);
      setMoForm(false);
    } catch {
      setLoi(true);
    } finally {
      setDangLuu(false);
    }
  };

  const hoiXoa = (n: NguoiLuu) =>
    Alert.alert(dien(t.nguoi.xoaTieuDe, { ten: n.hoTen }), t.nguoi.xoaMoTa, [
      { text: t.chung.huy, style: 'cancel' },
      {
        text: t.nguoi.xoa,
        style: 'destructive',
        onPress: () => xoaNguoi(n.id).catch(() => Alert.alert(t.nguoi.loi)),
      },
    ]);

  const hoiDat = (n: NguoiLuu) =>
    Alert.alert(dien(t.nguoi.datTieuDe, { ten: n.hoTen }), t.nguoi.datMoTa, [
      { text: t.chung.huy, style: 'cancel' },
      {
        text: t.chung.tiepTuc,
        onPress: () => datLamCuaToi(n.id).catch(() => Alert.alert(t.nguoi.loi)),
      },
    ]);

  const khac = nguoi.filter((n) => !laCuaToi(n));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mau.nen }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NenVung vung="moiQuanHe" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + 48,
          gap: KHOANG.x5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <DauVung vung="moiQuanHe" ten={t.tab.ketNoi} />
        </View>

        <View style={{ gap: KHOANG.x2 }}>
          <Chu kieu="h1">{t.nguoi.tieuDe}</Chu>
          <Chu kieu="bodySm" mo>
            {t.nguoi.moTa}
          </Chu>
          {coTaiKhoan && !email && (
            <Chu kieu="caption" mo>
              {t.nguoi.khach}
            </Chu>
          )}
        </View>

        {hoSo && (
          <View style={{ gap: KHOANG.x3 }}>
            <Eyebrow mauChu={v.mau}>{t.nguoi.cuaToi}</Eyebrow>
            <The onPress={() => router.push('/ban-do')} style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
              <ChuCaiDau ten={hoSo.ten || t.nguoi.cuaToi} nen="#FFBDD3" />
              <View style={{ flex: 1, gap: 2 }}>
                <Chu kieu="h3">{hoSo.ten.trim() || t.nguoi.cuaToi}</Chu>
                <Chu kieu="caption" mo>
                  {moTaSinh(thongTinSinh(hoSo))}
                </Chu>
              </View>
              <Icon ten="chev" size={18} net={2} mau={mau.chuNhat} />
            </The>
          </View>
        )}

        <View style={{ gap: KHOANG.x3 }}>
          <Eyebrow mauChu={v.mau}>{t.nguoi.nguoiKhac}</Eyebrow>
          {khac.length === 0 && !moForm && (
            <Chu kieu="bodySm" mo>
              {t.nguoi.rong}
            </Chu>
          )}
          {khac.map((n, i) => (
            <The key={n.id} style={{ gap: KHOANG.x2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
                <ChuCaiDau ten={n.hoTen} nen={MAU_NGUOI[i % MAU_NGUOI.length]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Chu kieu="h3">{n.hoTen}</Chu>
                  <Chu kieu="caption" mo>
                    {moTaSinh(n)}
                  </Chu>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4 }}>
                <NutChu
                  nhan={t.nguoi.xem}
                  mauChu={v.mau}
                  onPress={() => router.push({ pathname: '/ban-do', params: { id: n.id } })}
                />
                <NutChu nhan={t.nguoi.datCuaToi} onPress={() => hoiDat(n)} />
                <NutChu nhan={t.nguoi.xoa} mauChu={mau.xau} onPress={() => hoiXoa(n)} />
              </View>
            </The>
          ))}
        </View>

        {moForm ? (
          <The style={{ gap: KHOANG.x4 }}>
            <View style={{ gap: KHOANG.x2 }}>
              <Chu kieu="bodySm" mo>
                {t.nguoi.tenNhan}
              </Chu>
              <ONhap value={ten} onChangeText={setTen} maxLength={60} autoFocus />
            </View>

            <View style={{ gap: KHOANG.x2 }}>
              <Chu kieu="bodySm" mo>
                {t.nguoi.ngayNhan}
              </Chu>
              <ONhap
                value={ngay}
                onChangeText={(s) => setNgay(chuanHoaNgay(s))}
                placeholder={t.onboarding.ngayVD}
                keyboardType="number-pad"
                maxLength={10}
              />
              {ngay.replace(/\D/g, '').length === 8 && !iso && (
                <Chu kieu="caption" style={{ color: mau.xau }}>
                  {t.onboarding.ngayLoi}
                </Chu>
              )}
            </View>

            <View style={{ gap: KHOANG.x2 }}>
              <Chu kieu="bodySm" mo>
                {t.nguoi.gioNhan}
              </Chu>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
                {KHUNG.map((bd, i) => (
                  <Pill
                    key={bd}
                    nhan={`${CHI[i]} ${hai(bd)}–${hai((bd + 1) % 24)}`}
                    dangChon={gio === bd}
                    vung="moiQuanHe"
                    onPress={() => setGio(bd)}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: KHOANG.x2 }}>
              <Chu kieu="bodySm" mo>
                {t.nguoi.gioiTinhNhan}
              </Chu>
              <ChonPhanDoan<GioiTinh>
                vung="moiQuanHe"
                giaTri={gioiTinh}
                onChange={setGioiTinh}
                muc={[
                  { gt: 'nu', nhan: t.onboarding.nu },
                  { gt: 'nam', nhan: t.onboarding.nam },
                ]}
              />
            </View>

            {loi && (
              <Chu kieu="caption" style={{ color: mau.xau }}>
                {t.nguoi.loi}
              </Chu>
            )}

            <View style={{ gap: KHOANG.x2 }}>
              <NutChinh nhan={t.chung.luu} onPress={luu} vohieu={!duThongTin || dangLuu} />
              <NutPhu nhan={t.chung.huy} onPress={() => setMoForm(false)} />
            </View>
          </The>
        ) : (
          <NutPhu nhan={t.nguoi.them} icon="plus" onPress={() => setMoForm(true)} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
