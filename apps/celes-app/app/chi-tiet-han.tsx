import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, DauVung, Eyebrow, NenVung, NutChinh, NutChu, NutIcon, NutPhu, The, TheHero } from '@/giao-dien/co-ban';
import { DangDoc, TheCanDangNhap } from '@/giao-dien/luan-giai';
import { docLuanHan, LoiCanDangNhap, type KetQuaLuanHan } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useNgonNgu } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { thangAmHienTai } from '@tuvi/bay-gio';
import type { CapLuanHan } from '@tuvi/luan-han';
import { KHUON } from '@tuvi/quick-read-noi-dung';

/**
 * "Xem chi tiết" của Hành trình — tầng luận hạn, bản app của /hanh-trinh/chi-tiet.
 *
 * Cùng thứ tự với web: tiêu đề đời thường → ba chuyển động → tóm tắt → theo lĩnh
 * vực → căn cứ (đóng sẵn) → sang Celes. Nhãn khối lấy từ KHUON của engine, cùng
 * chỗ với chữ đã sinh ra nội dung, để web và app không lệch lời.
 *
 * Chưa mở quyền (`day = false`): máy chủ chỉ trả tiêu đề và chủ đề chính. Thanh
 * toán đang TẠM ẨN trên iOS nên thẻ khoá chỉ nói phần này dành cho ai, không có
 * nút mua.
 *
 * Giao diện: Aurora bản 8 — vùng màu Hành trình, một nút fuchsia duy nhất là
 * lối sang Celes ở cuối bài.
 */
export default function ManChiTietHan() {
  const router = useRouter();
  const { t, ngonNgu } = useNgonNgu();
  const mau = useMau();
  const v = useVung('hanhTrinh');
  const le = useSafeAreaInsets();
  const { hoSo } = useHoSo();
  const { phien } = useTaiKhoan();
  const k = KHUON[ngonNgu].luanHan;

  const p = useLocalSearchParams<{ cap?: string; nam?: string; thang?: string }>();
  const cap: CapLuanHan = p.cap === 'giai-doan' || p.cap === 'thang' ? p.cap : 'nam';
  const nam = Number(p.nam) || new Date().getFullYear();
  // Thiếu tháng thì lấy tháng ÂM hiện tại, không phải tháng Giêng
  const thang = Number(p.thang) || thangAmHienTai();

  const [lanThu, setLanThu] = useState(0);
  const [moCanCu, setMoCanCu] = useState(false);
  const khoa = hoSo && phien ? `${hoSo.ngaySinh}|${hoSo.gio}|${hoSo.gioiTinh}|${cap}|${nam}|${thang}|${ngonNgu}|${lanThu}` : null;
  const [kq, setKq] = useState<{ khoa: string; bai?: KetQuaLuanHan; loi?: 'dang-nhap' | 'khac' } | null>(null);

  useEffect(() => {
    if (!hoSo || !khoa) return;
    let huy = false;
    docLuanHan(hoSo, cap, nam, thang, ngonNgu)
      .then((bai) => !huy && setKq({ khoa, bai }))
      .catch((e) => !huy && setKq({ khoa, loi: e instanceof LoiCanDangNhap ? 'dang-nhap' : 'khac' }));
    return () => {
      huy = true;
    };
  }, [hoSo, khoa, cap, nam, thang, ngonNgu]);

  const hienTai = kq && kq.khoa === khoa ? kq : null;
  const ketQua = hienTai?.bai;

  const DanhSach = ({ ds, trong }: { ds: { cau: string }[]; trong: string }) =>
    ds.length ? (
      <View style={{ gap: KHOANG.x2 }}>
        {ds.map((y, i) => (
          <Chu key={i} kieu="bodySm" mo>
            {`• ${y.cau}`}
          </Chu>
        ))}
      </View>
    ) : (
      <Chu kieu="bodySm" mo>
        {trong}
      </Chu>
    );

  const noiDung = () => {
    if (!hoSo)
      return (
        <Chu kieu="body" mo>
          {t.trangThai.rong}
        </Chu>
      );
    if (!phien || hienTai?.loi === 'dang-nhap') return <TheCanDangNhap moTa={t.hanhTrinh.moiDangNhap} />;
    if (hienTai?.loi)
      return (
        <View style={{ gap: KHOANG.x3 }}>
          <Chu kieu="body">{t.chiTietHan.loi}</Chu>
          <NutPhu nhan={t.chung.thuLai} onPress={() => setLanThu((n) => n + 1)} />
        </View>
      );
    if (!ketQua) return <DangDoc />;

    const { bai, day, ai } = ketQua;
    return (
      <>
        <View style={{ gap: KHOANG.x2 }}>
          <Chu kieu="h1">{bai.tieuDe}</Chu>
          <Chu kieu="bodySm" mo>
            {bai.subline}
          </Chu>
        </View>

        {!day && (
          <The am style={{ gap: KHOANG.x3 }}>
            <Eyebrow mauChu={v.mau}>{k.chuDeChinh}</Eyebrow>
            <Chu kieu="body">{bai.chuDeChinh}</Chu>
            <Chu kieu="h3">{t.chiTietHan.khoaTieuDe}</Chu>
            <Chu kieu="bodySm" mo>
              {t.chiTietHan.khoaMoTa}
            </Chu>
          </The>
        )}

        {day && ai && (
          <View style={{ gap: KHOANG.x3 }}>
            {(
              [
                [t.hanhTrinh.dangMo, ai.dangMo],
                [t.hanhTrinh.dangCang, ai.dangCang],
                [t.hanhTrinh.canCho, ai.canCho],
              ] as const
            ).map(([nhan, cd]) => (
              <The key={nhan} style={{ gap: KHOANG.x2 }}>
                <Eyebrow mauChu={v.mau}>{nhan}</Eyebrow>
                {!!cd.tieuDe && <Chu kieu="h3">{cd.tieuDe}</Chu>}
                <Chu kieu="bodySm" mo>
                  {cd.noiDung}
                </Chu>
              </The>
            ))}
            <TheHero vung="hanhTrinh" style={{ gap: KHOANG.x2 }}>
              <Eyebrow mauChu={v.mau}>{k.nhomTongHop}</Eyebrow>
              <Chu kieu="body">{ai.ghepLai}</Chu>
            </TheHero>
          </View>
        )}

        {day && (
          <View style={{ gap: KHOANG.x3 }}>
            <The style={{ gap: KHOANG.x2 }}>
              <Eyebrow mauChu={v.mau}>{k.chuDeChinh}</Eyebrow>
              <Chu kieu="body">{bai.chuDeChinh}</Chu>
            </The>
            <The style={{ gap: KHOANG.x2 }}>
              <Eyebrow mauChu={v.mau}>{k.nhipHanhDong}</Eyebrow>
              <Chu kieu="h3">{bai.nhip.nhan}</Chu>
              <Chu kieu="bodySm" mo>
                {bai.nhip.mo}
              </Chu>
            </The>
            <The style={{ gap: KHOANG.x3 }}>
              <Eyebrow mauChu={v.mau}>{k.tanDung}</Eyebrow>
              <DanhSach ds={bai.tanDung} trong={k.tanDungTrong} />
            </The>
            <The style={{ gap: KHOANG.x3 }}>
              <Eyebrow mauChu={v.mau}>{k.luuY}</Eyebrow>
              <DanhSach ds={bai.luuY} trong={k.luuYTrong} />
            </The>
          </View>
        )}

        {day && bai.linhVuc.length > 0 && (
          <View style={{ gap: KHOANG.x3 }}>
            <Chu kieu="h3">{t.chiTietHan.theoLinhVuc}</Chu>
            {bai.linhVuc.map((lv) => (
              <The key={lv.id} style={{ gap: KHOANG.x2 }}>
                <Chu kieu="body" dam>
                  {lv.nhan}
                </Chu>
                {/* Model viết nếu có; không thì rơi về khuôn câu của lớp luật */}
                <Chu kieu="bodySm" mo>
                  {ai?.linhVuc?.[lv.id] ?? lv.cau}
                </Chu>
              </The>
            ))}
            <Chu kieu="caption" mo>
              {k.khongThayTheYTe}
            </Chu>
          </View>
        )}

        {day && bai.canCu.length > 0 && (
          <View style={{ gap: KHOANG.x3 }}>
            <NutChu
              nhan={moCanCu ? t.chiTietHan.viSaoDong : t.chiTietHan.viSao}
              mauChu={v.mau}
              onPress={() => {
                const moi = !moCanCu;
                setMoCanCu(moi);
                if (moi) ghiSuKien('evidence_opened', { man: 'luan-han', cap });
              }}
              style={{ alignSelf: 'flex-start' }}
            />
            {moCanCu && (
              <The style={{ gap: KHOANG.x4 }}>
                {bai.canCu.map((nhom) => (
                  <View key={nhom.nhan} style={{ gap: KHOANG.x2 }}>
                    <Eyebrow>{nhom.nhan}</Eyebrow>
                    {nhom.dong.map((d, i) => (
                      <Chu key={i} kieu="bodySm" mo>
                        {d}
                      </Chu>
                    ))}
                  </View>
                ))}
              </The>
            )}
          </View>
        )}

        <The style={{ gap: KHOANG.x3 }}>
          <Chu kieu="h3">{t.chiTietHan.ctaTieuDe}</Chu>
          <NutChinh
            nhan={t.chiTietHan.ctaNut}
            onPress={() => router.push({ pathname: '/(tabs)/celes', params: { q: bai.cauHoiGoiY } })}
          />
        </The>
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="hanhTrinh" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: le.bottom + 48,
          gap: KHOANG.x5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x3 }}>
          <NutIcon ten="back" nhan={t.chung.quayLai} onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <DauVung
              vung="hanhTrinh"
              ten={[t.chiTietHan.quayLai, String(nam), cap === 'thang' ? dien(KHUON[ngonNgu].hanhTrinh.thangNhan, { thang }) : null]
                .filter(Boolean)
                .join(' › ')}
            />
          </View>
        </View>
        {noiDung()}
      </ScrollView>
    </View>
  );
}
