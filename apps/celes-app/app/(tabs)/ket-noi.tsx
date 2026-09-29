import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnhDaiDien,
  Chu,
  ChuNhan,
  DauVung,
  Eyebrow,
  Giong,
  NenVung,
  NutChinh,
  NutChu,
  NutPhu,
  ONhap,
  OrbCeles,
  The,
  TheHero,
  useDemDayTab,
} from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { DangDoc, TheCanDangNhap } from '@/giao-dien/luan-giai';
import {
  docKetNoi,
  LoiCanDangNhap,
  LoiHetLuot,
  Y_DINH_KET_NOI,
  type KetQuaKetNoi,
  type YDinhKetNoi,
} from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Mối quan hệ — bản app của /hop-tuoi trên web.
 *
 * Người thứ nhất luôn là lá số của bạn; người thứ hai chọn trong "Người của tôi".
 * Rồi chọn ý định (tình cảm, làm ăn…) — cùng một cặp nhưng câu hỏi khác thì máy
 * chủ đọc cung khác và trả mục khác, nên ý định đi trước nút bấm.
 *
 * KHÔNG chấm một điểm tổng kiểu 82/100. Kết luận trước, bảng kỹ thuật sau và
 * đóng sẵn — giống web. Hai ô số dưới thẻ chính chỉ ĐẾM tiêu chí thuận / dễ va
 * chạm mà engine đã so, không quy đổi thành điểm.
 *
 * Quyền: web chặn khách ở cả trang, máy chủ chặn ở API (401) và chỉ mở cho
 * người ủng hộ (402). Thanh toán TẠM ẨN trên iOS nên 402 ra thẻ khoá không có
 * nút mua. Máy chủ còn trả tên model — `docKetNoi` đã bỏ nó đi.
 *
 * Giao diện: Aurora bản 8 (`docs/thiet-ke/celes-ios/aurora/gen.py`, mục 3b).
 */

type TrangThai =
  | { loai: 'dang-so' }
  | { loai: 'xong'; kq: KetQuaKetNoi }
  | { loai: 'khoa' }
  | { loai: 'can-dang-nhap' }
  | { loai: 'loi' };

/** Nền chữ cái đầu của từng người — pastel cố định, chữ mực đậm đọc được ở cả hai theme */
const MAU_NGUOI = ['#FFF1BD', '#BBF7D0', '#E6DDEA', '#BAE6FD', '#FFD6CF'];
const MUC_DAM = '#240029';

const chuCai = (ten?: string) => (ten?.trim()[0] ?? '·').toUpperCase();

export default function ManKetNoi() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('moiQuanHe');
  const le = useSafeAreaInsets();
  const demDay = useDemDayTab();
  const { hoSo, nguoi, laCuaToi } = useHoSo();
  const { phien } = useTaiKhoan();

  const nguoiKhac = nguoi.filter((n) => !laCuaToi(n));
  const [idB, setIdB] = useState<string | null>(null);
  // Người đã chọn bị xoá thì rơi về người đầu danh sách, không giữ id mồ côi
  const b = nguoiKhac.find((n) => n.id === idB) ?? nguoiKhac[0] ?? null;

  const [yDinh, setYDinh] = useState<YDinhKetNoi>('tinh-cam');
  const [cauHoi, setCauHoi] = useState('');
  const thieuCauHoi = yDinh === 'khac' && cauHoi.trim().length < 10;

  // Kết quả gắn với đúng cặp + ý định đã hỏi; đổi lựa chọn là kết quả cũ tự ẩn
  const khoa = b ? `${b.id}|${yDinh}|${cauHoi.trim()}` : null;
  const [kq, setKq] = useState<{ khoa: string; tt: TrangThai } | null>(null);
  const tt = kq && kq.khoa === khoa ? kq.tt : null;

  const [moCanCu, setMoCanCu] = useState(false);
  const [moKyThuat, setMoKyThuat] = useState(false);

  const cauHinh = t.ketNoi.yDinh[yDinh];

  const so = async () => {
    if (!hoSo || !b || !khoa) return;
    setKq({ khoa, tt: { loai: 'dang-so' } });
    setMoCanCu(false);
    setMoKyThuat(false);
    ghiSuKien('connection_compare_started', { yDinh, coCauHoi: Boolean(cauHoi.trim()) });
    try {
      const ketQua = await docKetNoi(hoSo, b, yDinh, cauHoi);
      setKq({ khoa, tt: { loai: 'xong', kq: ketQua } });
      ghiSuKien('connection_compare_completed', { yDinh, coAi: Boolean(ketQua.ketNoi) });
    } catch (e) {
      if (e instanceof LoiHetLuot) {
        setKq({ khoa, tt: { loai: 'khoa' } });
        ghiSuKien('paywall_viewed', { lyDo: 'connection_full' });
      } else if (e instanceof LoiCanDangNhap) {
        setKq({ khoa, tt: { loai: 'can-dang-nhap' } });
      } else {
        setKq({ khoa, tt: { loai: 'loi' } });
        ghiSuKien('connection_compare_failed', { yDinh });
      }
    }
  };

  const BangKyThuat = ({ ketQua }: { ketQua: KetQuaKetNoi }) => (
    <View>
      {ketQua.soSanh.tieuChi.map((tc, i) => (
        <View
          key={tc.ten}
          style={{
            gap: KHOANG.x1,
            paddingVertical: KHOANG.x3,
            borderTopWidth: i ? 1 : 0,
            borderColor: mau.vien,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: KHOANG.x3 }}>
            <Chu kieu="bodySm" dam style={{ flex: 1 }}>
              {tc.ten}
            </Chu>
            <Chu kieu="caption" mo>
              {t.ketNoi.mucDo[tc.mucDo]}
            </Chu>
          </View>
          <Chu kieu="caption" mo>
            {`${ketQua.soSanh.tenA}: ${tc.giaTriA}`}
          </Chu>
          <Chu kieu="caption" mo>
            {`${ketQua.soSanh.tenB}: ${tc.giaTriB}`}
          </Chu>
          <Chu kieu="bodySm">{tc.ketQua}</Chu>
          <Chu kieu="caption" mo>
            {tc.giaiThich}
          </Chu>
        </View>
      ))}
    </View>
  );

  /** Hai ô đếm: tiêu chí thuận và tiêu chí dễ va chạm */
  const HaiODem = ({ ketQua }: { ketQua: KetQuaKetNoi }) => {
    const thuan = ketQua.soSanh.tieuChi.filter((tc) => tc.mucDo === 'thuan');
    const nghich = ketQua.soSanh.tieuChi.filter((tc) => tc.mucDo === 'nghich');
    const o = (so: number, mauSo: string, nhan: string, ten: string[]) => (
      <The style={{ flex: 1, padding: 14, gap: 2 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, lineHeight: 36, color: mauSo }}>{so}</Text>
        <Chu kieu="bodySm" dam>
          {nhan}
        </Chu>
        {ten.length > 0 && (
          <Chu kieu="caption" mo numberOfLines={2}>
            {ten.join(' · ')}
          </Chu>
        )}
      </The>
    );
    return (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {o(thuan.length, mau.tot2.chu, t.ketNoi.hopNhau, thuan.map((x) => x.ten))}
        {o(nghich.length, mau.canY.chu, t.ketNoi.canNhuong, nghich.map((x) => x.ten))}
      </View>
    );
  };

  const chiTietXong = (ketQua: KetQuaKetNoi) => {
    const { soSanh, ketNoi } = ketQua;
    if (!ketNoi)
      return (
        <View style={{ gap: KHOANG.x3 }}>
          <Chu kieu="bodySm" mo>
            {t.ketNoi.aiChuaXong}
          </Chu>
          <NutChu nhan={t.ketNoi.thuLaiDienGiai} mauChu={v.mau} onPress={so} style={{ alignSelf: 'flex-start' }} />
          <The>
            <BangKyThuat ketQua={ketQua} />
          </The>
        </View>
      );

    const cauTiep = dien(t.ketNoi.cauHoiTiep, { a: soSanh.tenA, b: soSanh.tenB });

    return (
      <View style={{ gap: KHOANG.x5 }}>
        {ketNoi.muc
          .filter((m) => m.noiDung)
          .map((m) => (
            <View key={m.id} style={{ gap: KHOANG.x2 }}>
              <Chu kieu="h3">{m.tieuDe}</Chu>
              <Chu kieu="body">{m.noiDung}</Chu>
              {!!m.luongNguoc && (
                <Chu kieu="bodySm" mo>
                  {m.luongNguoc}
                </Chu>
              )}
            </View>
          ))}

        {ketNoi.cauHoiCuaBan && (
          <The am style={{ gap: KHOANG.x2 }}>
            <Eyebrow mauChu={v.mau}>{t.ketNoi.cauHoiCuaBan}</Eyebrow>
            <Chu kieu="bodySm" mo>
              {ketNoi.cauHoiCuaBan.cauHoi}
            </Chu>
            <Chu kieu="body">{ketNoi.cauHoiCuaBan.traLoi}</Chu>
          </The>
        )}

        {/* Căn cứ: dữ kiện hai lá số và mạch suy luận — không tên tài liệu */}
        <View style={{ gap: KHOANG.x3 }}>
          <NutChu
            nhan={moCanCu ? t.ketNoi.viSaoDong : t.ketNoi.viSao}
            mauChu={v.mau}
            onPress={() => {
              const moi = !moCanCu;
              setMoCanCu(moi);
              if (moi) ghiSuKien('evidence_opened', { man: 'ket-noi', yDinh });
            }}
            style={{ alignSelf: 'flex-start' }}
          />
          {moCanCu && (
            <The style={{ gap: KHOANG.x4 }}>
              <View style={{ gap: KHOANG.x2 }}>
                <Eyebrow>{t.ketNoi.duaVao}</Eyebrow>
                {ketNoi.canCu.duKien.map((d) => (
                  <Chu key={d.id} kieu="caption" mo>
                    {d.noiDung}
                  </Chu>
                ))}
              </View>
              {!!ketNoi.canCu.cachNoi && (
                <View style={{ gap: KHOANG.x2 }}>
                  <Eyebrow>{t.ketNoi.datCanhNhau}</Eyebrow>
                  <Chu kieu="caption" mo>
                    {ketNoi.canCu.cachNoi}
                  </Chu>
                </View>
              )}
              <View style={{ gap: KHOANG.x2 }}>
                <Eyebrow>{t.ketNoi.phuongPhap}</Eyebrow>
                <Chu kieu="caption" mo>
                  {ketNoi.canCu.phuongPhap}
                </Chu>
                {!ketNoi.canCu.coNguon && (
                  <Chu kieu="caption" mo>
                    {t.ketNoi.chuaCoNguon}
                  </Chu>
                )}
              </View>
            </The>
          )}
        </View>

        {/* Lối sang Celes — dạng liên kết, vì nút fuchsia của màn đã là nút so */}
        <The style={{ flexDirection: 'row', gap: KHOANG.x3, alignItems: 'flex-start', paddingVertical: 14 }}>
          <OrbCeles size={28} sang={false} />
          <View style={{ flex: 1, gap: KHOANG.x1 }}>
            <Text style={{ fontFamily: FONT.thanDam, fontSize: 13, lineHeight: 18, color: v.mau }}>
              {t.ketNoi.celesGoiY}
            </Text>
            <Giong co={17}>{`“${cauTiep}”`}</Giong>
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/celes', params: { q: cauTiep } })}
              accessibilityRole="button"
              style={({ pressed }) => ({
                minHeight: CHAM_TOI_THIEU,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: FONT.thanDam, fontSize: 14, color: v.mau }}>{t.ketNoi.hoiVeHaiNguoi}</Text>
              <Icon ten="arrow" size={16} net={2.2} mau={v.mau} />
            </Pressable>
          </View>
        </The>

        <View style={{ gap: KHOANG.x3 }}>
          <NutChu
            nhan={moKyThuat ? t.ketNoi.kyThuatDong : t.ketNoi.kyThuat}
            onPress={() => setMoKyThuat((x) => !x)}
            style={{ alignSelf: 'flex-start' }}
          />
          {moKyThuat && (
            <The>
              <BangKyThuat ketQua={ketQua} />
            </The>
          )}
        </View>

        <Chu kieu="caption" mo>
          {t.ketNoi.ghiChu}
        </Chu>
      </View>
    );
  };

  const dauMan = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ flex: 1, gap: KHOANG.x1 }}>
        <DauVung vung="moiQuanHe" ten={t.tab.ketNoi} />
        <Chu kieu="h1">
          {t.ketNoi.tieuDeDau} <ChuNhan vung="moiQuanHe">{t.ketNoi.tieuDeNhan}</ChuNhan>
        </Chu>
        <Chu kieu="bodySm" mo>
          {t.ketNoi.moTaNgan}
        </Chu>
      </View>
      <AnhDaiDien ten={hoSo?.ten} onPress={() => router.push('/toi')} nhan={t.tab.moTaiKhoan} />
    </View>
  );

  const noiDung = () => {
    if (!hoSo)
      return (
        <Chu kieu="body" mo>
          {t.ketNoi.canLaSo}
        </Chu>
      );
    if (!phien) return <TheCanDangNhap moTa={t.ketNoi.moiDangNhap} />;

    const ketQuaXong = tt?.loai === 'xong' ? tt.kq : null;
    const tenA = hoSo.ten || t.ketNoi.khongTen;
    const tenB = b ? b.hoTen || t.ketNoi.khongTen : null;

    return (
      <>
        {/* Hàng người: bạn cố định, người kia chọn được, và lối thêm người */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -LE_NGANG }}
          contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x3 }}
        >
          <ONguoi chu={chuCai(hoSo.ten)} nen="#FFBDD3" nhan={t.ketNoi.ban} />
          {nguoiKhac.map((n, i) => (
            <ONguoi
              key={n.id}
              chu={chuCai(n.hoTen)}
              nen={MAU_NGUOI[i % MAU_NGUOI.length]}
              nhan={n.hoTen || t.ketNoi.khongTen}
              dangChon={n.id === b?.id}
              onPress={() => setIdB(n.id)}
              moTa={dien(t.ketNoi.chonNguoi, { ten: n.hoTen || t.ketNoi.khongTen })}
            />
          ))}
          <ONguoi them nhan={t.ketNoi.them} onPress={() => router.push('/nguoi-cua-toi')} moTa={t.ketNoi.themNguoi} />
        </ScrollView>
        {nguoiKhac.length > 0 && (
          <NutChu
            nhan={t.ketNoi.quanLyNguoi}
            onPress={() => router.push('/nguoi-cua-toi')}
            style={{ alignSelf: 'flex-start', marginTop: -KHOANG.x2 }}
          />
        )}

        {!b && (
          <The style={{ gap: KHOANG.x3 }}>
            <Chu kieu="bodySm" mo>
              {t.ketNoi.chuaCoNguoi}
            </Chu>
            <NutPhu nhan={t.ketNoi.themNguoi} icon="plus" onPress={() => router.push('/nguoi-cua-toi')} />
          </The>
        )}

        {b && (
          <>
            {/* Thẻ chính: cặp đang xem — kết luận khi đã có, lời mời khi chưa */}
            <TheHero vung="moiQuanHe" style={{ padding: 18, gap: KHOANG.x2 }}>
              <View accessible={false} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[kieuCap.tron, { borderColor: mau.nen, backgroundColor: 'rgba(211,34,152,0.85)' }]}>
                  <Text style={[kieuCap.chu, { color: '#FFFFFF' }]}>{chuCai(hoSo.ten)}</Text>
                </View>
                <View style={[kieuCap.tron, { borderColor: mau.nen, marginLeft: -14, backgroundColor: VUNG_MAU_B }]}>
                  <Text style={[kieuCap.chu, { color: '#2A0A06' }]}>{chuCai(b.hoTen)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: KHOANG.x3 }}>
                  <Eyebrow mauChu={v.mau}>{`${tenA} & ${tenB}`}</Eyebrow>
                </View>
              </View>
              {ketQuaXong?.ketNoi ? (
                <>
                  <Chu kieu="h2">{ketQuaXong.ketNoi.dangChuY.tieuDe}</Chu>
                  <Chu kieu="bodySm" mo>
                    {ketQuaXong.ketNoi.dangChuY.noiDung}
                  </Chu>
                  <Chu kieu="caption" nhat>
                    {cauHinh.nhan}
                  </Chu>
                </>
              ) : (
                <>
                  <Chu kieu="h2">{t.ketNoi.tieuDe}</Chu>
                  <Chu kieu="bodySm" mo>
                    {t.ketNoi.moTa}
                  </Chu>
                </>
              )}
            </TheHero>

            {ketQuaXong && <HaiODem ketQua={ketQuaXong} />}
            {ketQuaXong && chiTietXong(ketQuaXong)}

            {/* Ý định */}
            <View style={{ gap: KHOANG.x3 }}>
              <Chu kieu="h3">{t.ketNoi.yDinhTieuDe}</Chu>
              {Y_DINH_KET_NOI.map((y) => {
                const chon = y === yDinh;
                return (
                  <Pressable
                    key={y}
                    onPress={() => {
                      setYDinh(y);
                      ghiSuKien('connection_intent_selected', { yDinh: y });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: chon }}
                    style={({ pressed }) => ({
                      minHeight: 56,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: KHOANG.x3,
                      paddingHorizontal: KHOANG.x4,
                      paddingVertical: KHOANG.x3,
                      borderRadius: BO_GOC.the,
                      borderWidth: 1,
                      borderColor: chon ? `rgba(${v.rgb},0.45)` : mau.vienKinh,
                      backgroundColor: chon ? `rgba(${v.rgb},0.12)` : mau.the,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Chu kieu="body" dam style={chon ? { color: v.sang } : undefined}>
                        {t.ketNoi.yDinh[y].nhan}
                      </Chu>
                      <Chu kieu="caption" mo>
                        {t.ketNoi.yDinh[y].moTa}
                      </Chu>
                    </View>
                    {chon && <Icon ten="check" size={18} net={2.4} mau={v.sang} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Câu hỏi riêng */}
            <View style={{ gap: KHOANG.x2 }}>
              <Chu kieu="h3">{t.ketNoi.cauHoiTieuDe}</Chu>
              <ONhap
                value={cauHoi}
                onChangeText={(s) => setCauHoi(s.slice(0, 500))}
                placeholder={cauHinh.goiY}
                multiline
                style={{
                  minHeight: 96,
                  paddingVertical: KHOANG.x3,
                  textAlignVertical: 'top',
                  borderRadius: BO_GOC.oNhap,
                }}
              />
              <Chu kieu="caption" mo>
                {yDinh === 'khac' ? t.ketNoi.cauHoiBatBuoc : t.ketNoi.cauHoiTuyChon}
              </Chu>
            </View>

            <NutChinh
              nhan={tt?.loai === 'dang-so' ? t.ketNoi.dangSo : cauHinh.nut}
              vohieu={tt?.loai === 'dang-so' || thieuCauHoi}
              onPress={so}
            />
            {!!t.ketNoi.chiTiengViet && (
              <Chu kieu="caption" mo>
                {t.ketNoi.chiTiengViet}
              </Chu>
            )}

            {tt?.loai === 'dang-so' && <DangDoc chu={t.ketNoi.dangSo.replace(/…$/, '')} />}
            {tt?.loai === 'can-dang-nhap' && <TheCanDangNhap moTa={t.ketNoi.moiDangNhap} />}
            {tt?.loai === 'khoa' && (
              <The am style={{ gap: KHOANG.x2 }}>
                <Chu kieu="h3">{t.ketNoi.khoaTieuDe}</Chu>
                <Chu kieu="bodySm" mo>
                  {t.ketNoi.khoaMoTa}
                </Chu>
              </The>
            )}
            {tt?.loai === 'loi' && (
              <View style={{ gap: KHOANG.x3 }}>
                <Chu kieu="body">{t.ketNoi.loi}</Chu>
                <NutPhu nhan={t.chung.thuLai} onPress={so} />
              </View>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <NenVung vung="moiQuanHe" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: le.top + 12,
          paddingHorizontal: LE_NGANG,
          paddingBottom: demDay,
          gap: KHOANG.x4,
        }}
      >
        {dauMan}
        {noiDung()}
      </ScrollView>
    </View>
  );
}

/** Màu chữ cái người thứ hai trong thẻ cặp — cùng sắc vùng Mối quan hệ */
const VUNG_MAU_B = '#FF8F80';

const kieuCap = {
  tron: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
    borderColor: '#17141B',
  },
  chu: { fontFamily: FONT.display, fontSize: 19 },
};

/** Một người trong hàng chọn: vòng màu vùng khi đang chọn, viền đứt cho ô "Thêm" */
function ONguoi({
  chu,
  nen,
  nhan,
  dangChon,
  onPress,
  them,
  moTa,
}: {
  chu?: string;
  nen?: string;
  nhan: string;
  dangChon?: boolean;
  onPress?: () => void;
  them?: boolean;
  moTa?: string;
}) {
  const mau = useMau();
  const { theme } = useTheme();
  const v = useVung('moiQuanHe');

  const tron = them ? (
    <View
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: theme === 'toi' ? 'rgba(255,255,255,0.22)' : 'rgba(36,0,41,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon ten="plus" size={20} net={2} mau={mau.chu} />
    </View>
  ) : (
    <LinearGradient
      colors={dangChon ? [v.sang, v.mau, '#E23BA8'] : [mau.vienKinh, mau.vienKinh]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 58, height: 58, borderRadius: 29, padding: 3 }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 26,
          borderWidth: 3,
          borderColor: mau.nen,
          backgroundColor: nen,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: FONT.display, fontSize: 19, color: MUC_DAM }}>{chu}</Text>
      </View>
    </LinearGradient>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={moTa ?? nhan}
      accessibilityState={onPress && !them ? { selected: !!dangChon } : undefined}
      style={({ pressed }) => ({ width: 64, alignItems: 'center', gap: 6, opacity: pressed ? 0.75 : 1 })}
    >
      {tron}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: dangChon ? FONT.thanRatDam : FONT.thanVua,
          fontSize: 13,
          lineHeight: 17,
          color: dangChon ? mau.chu : mau.chuMo,
          maxWidth: 64,
        }}
      >
        {nhan}
      </Text>
    </Pressable>
  );
}
