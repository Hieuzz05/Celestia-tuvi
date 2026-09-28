import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutChinh, NutChu, NutPhu, ONhap, Pill, The } from '@/giao-dien/co-ban';
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
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Mối quan hệ — bản app của /hop-tuoi trên web.
 *
 * Người thứ nhất luôn là lá số của bạn; người thứ hai chọn trong "Người của tôi".
 * Rồi chọn ý định (tình cảm, làm ăn…) — cùng một cặp nhưng câu hỏi khác thì máy
 * chủ đọc cung khác và trả mục khác, nên ý định đi trước nút bấm.
 *
 * KHÔNG chấm một điểm tổng kiểu 82/100. Kết luận trước, bảng kỹ thuật sau và
 * đóng sẵn — giống web.
 *
 * Quyền: web chặn khách ở cả trang, máy chủ chặn ở API (401) và chỉ mở cho
 * người ủng hộ (402). Thanh toán TẠM ẨN trên iOS nên 402 ra thẻ khoá không có
 * nút mua. Máy chủ còn trả tên model — `docKetNoi` đã bỏ nó đi.
 */

type TrangThai =
  | { loai: 'dang-so' }
  | { loai: 'xong'; kq: KetQuaKetNoi }
  | { loai: 'khoa' }
  | { loai: 'can-dang-nhap' }
  | { loai: 'loi' };

export default function ManKetNoi() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
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
            <Chu kieu="bodySm" style={{ fontWeight: '600', flex: 1 }}>
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

  const ketQuaXong = (ketQua: KetQuaKetNoi) => {
    const { soSanh, ketNoi } = ketQua;
    if (!ketNoi)
      return (
        <View style={{ gap: KHOANG.x3 }}>
          <Chu kieu="bodySm" mo>
            {t.ketNoi.aiChuaXong}
          </Chu>
          <NutChu nhan={t.ketNoi.thuLaiDienGiai} onPress={so} style={{ alignSelf: 'flex-start' }} />
          <The>
            <BangKyThuat ketQua={ketQua} />
          </The>
        </View>
      );

    return (
      <View style={{ gap: KHOANG.x6 }}>
        <View style={{ gap: KHOANG.x2 }}>
          <Eyebrow>{`${soSanh.tenA} & ${soSanh.tenB} · ${cauHinh.nhan}`}</Eyebrow>
          <Chu kieu="h3">{ketNoi.dangChuY.tieuDe}</Chu>
          <Chu kieu="body">{ketNoi.dangChuY.noiDung}</Chu>
        </View>

        {ketNoi.muc
          .filter((m) => m.noiDung)
          .map((m) => (
            <View key={m.id} style={{ gap: KHOANG.x2 }}>
              <Chu kieu="body" style={{ fontWeight: '600' }}>
                {m.tieuDe}
              </Chu>
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
            <Eyebrow>{t.ketNoi.cauHoiCuaBan}</Eyebrow>
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

        <NutChinh
          nhan={t.ketNoi.hoiThem}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/celes',
              params: { q: dien(t.ketNoi.cauHoiTiep, { a: soSanh.tenA, b: soSanh.tenB }) },
            })
          }
        />

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

  const noiDung = () => {
    if (!hoSo)
      return (
        <Chu kieu="body" mo>
          {t.ketNoi.canLaSo}
        </Chu>
      );
    if (!phien) return <TheCanDangNhap moTa={t.ketNoi.moiDangNhap} />;

    return (
      <>
        {/* Hai người */}
        <View style={{ gap: KHOANG.x3 }}>
          <The style={{ gap: KHOANG.x1 }}>
            <Eyebrow>{t.ketNoi.ban}</Eyebrow>
            <Chu kieu="body">{hoSo.ten || t.ketNoi.khongTen}</Chu>
          </The>
          <The style={{ gap: KHOANG.x3 }}>
            <Eyebrow>{t.ketNoi.nguoiKia}</Eyebrow>
            {nguoiKhac.length === 0 ? (
              <>
                <Chu kieu="bodySm" mo>
                  {t.ketNoi.chuaCoNguoi}
                </Chu>
                <NutPhu nhan={t.ketNoi.themNguoi} onPress={() => router.push('/nguoi-cua-toi')} />
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>
                  {nguoiKhac.map((n) => (
                    <Pill
                      key={n.id}
                      nhan={`${n.hoTen || t.ketNoi.khongTen} · ${n.ngay}/${n.thang}/${n.nam}`}
                      dangChon={n.id === b?.id}
                      onPress={() => setIdB(n.id)}
                    />
                  ))}
                </View>
                <NutChu
                  nhan={t.ketNoi.quanLyNguoi}
                  onPress={() => router.push('/nguoi-cua-toi')}
                  style={{ alignSelf: 'flex-start' }}
                />
              </>
            )}
          </The>
        </View>

        {b && (
          <>
            {/* Ý định */}
            <View style={{ gap: KHOANG.x3 }}>
              <Chu kieu="h3">{t.ketNoi.yDinhTieuDe}</Chu>
              {Y_DINH_KET_NOI.map((y) => {
                const chon = y === yDinh;
                return (
                  <The
                    key={y}
                    onPress={() => {
                      setYDinh(y);
                      ghiSuKien('connection_intent_selected', { yDinh: y });
                    }}
                    style={{
                      gap: KHOANG.x1,
                      borderWidth: 1.5,
                      borderColor: chon ? mau.hanhDong : 'transparent',
                    }}
                  >
                    <Chu kieu="body" style={{ fontWeight: '600' }}>
                      {t.ketNoi.yDinh[y].nhan}
                    </Chu>
                    <Chu kieu="caption" mo>
                      {t.ketNoi.yDinh[y].moTa}
                    </Chu>
                  </The>
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
            {tt?.loai === 'xong' && ketQuaXong(tt.kq)}
          </>
        )}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: le.top + KHOANG.x5,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x12,
          gap: KHOANG.x6,
        }}
      >
        <View style={{ gap: KHOANG.x2 }}>
          <Chu kieu="h2">{t.ketNoi.tieuDe}</Chu>
          <Chu kieu="bodySm" mo>
            {t.ketNoi.moTa}
          </Chu>
        </View>
        {noiDung()}
      </ScrollView>
    </View>
  );
}
