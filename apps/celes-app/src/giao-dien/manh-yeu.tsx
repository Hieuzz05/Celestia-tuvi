import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';
import { Chu, NhanTrangThai, NutChu, The } from './co-ban';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
import { cungDaiVan, cungTieuHan, type LaSo } from '@tuvi/ansao';
import { namAmHienTai } from '@tuvi/bay-gio';
import { CHU_DE_V3 } from '@khung-v3';
import { chiTietDiemTungCung, type ChiTietDiemCung, type GopDiem } from '@/lib/rag/v3/du-kien';

/**
 * Mạnh–yếu — bản app của `components/luangiai/BanDoManhYeu.tsx` trên web.
 *
 * Điểm từng cung lấy thẳng `chiTietDiemTungCung` của web (`lib/rag/v3/du-kien.ts`,
 * qua bí danh `@/lib/*`) — không chép logic chấm điểm sang app. Biểu đồ radar
 * xếp 12 lĩnh vực theo vòng cung bắt đầu từ Mệnh, bán kính co giãn trong CHÍNH
 * lá số (thấp nhất → cao nhất), vòng nét đứt là mức giữa (trung vị), như web.
 *
 * Nhãn quanh radar là vùng chạm 44px; dưới radar có nhóm ba mức (cũng là chú
 * giải) để chạm được mọi lĩnh vực mà không phải nhắm vào chữ nhỏ.
 */

type Muc = ChiTietDiemCung['muc'];
const KHOA_MUC: Record<Muc, 'manh' | 'binh' | 'canGang'> = { 'Mạnh': 'manh', 'Bình': 'binh', 'Cần gắng': 'canGang' };
const THU_TU_MUC: Muc[] = ['Mạnh', 'Bình', 'Cần gắng'];

/** Chiều rộng ô nhãn quanh radar và khoảng cách nhãn tới vòng ngoài */
const RONG_NHAN = 64;
const CACH_NHAN = 14;

export function ManhYeu({ laSo }: { laSo: LaSo }) {
  const t = useT();
  const router = useRouter();
  const { mau, theme } = useTheme();
  const v = useVung('laSo');
  const { width } = useWindowDimensions();
  const toi = theme === 'toi';

  const ds = useMemo(() => chiTietDiemTungCung(laSo), [laSo]);
  const xep = useMemo(() => [...ds].sort((a, b) => b.diem - a.diem), [ds]);
  const giua = xep.length >= 12 ? (xep[5].diem + xep[6].diem) / 2 : 0;
  const lon = xep[0]?.diem ?? 0;
  const nho = xep[xep.length - 1]?.diem ?? 0;

  const [chon, setChon] = useState<string | null>(null);
  const dangChon = ds.find((d) => d.cung === (chon ?? xep[0]?.cung)) ?? null;

  const namXem = namAmHienTai();
  const tuoi = namXem - laSo.thongTin.amLich.nam + 1;
  const cungDv = cungDaiVan(laSo, tuoi)?.tenCung;
  const iTh = cungTieuHan(laSo, tuoi);
  const cungTh = laSo.cungs.find((c) => c.chiIndex === iTh)?.tenCung;

  const mauMuc = (m: Muc) =>
    m === 'Mạnh'
      ? toi
        ? '#4ADE80'
        : mau.tot2.chu
      : m === 'Cần gắng'
        ? toi
          ? '#F0A44B'
          : mau.canY.chu
        : toi
          ? 'rgba(243,241,244,0.55)'
          : mau.vua.chu;
  const loaiMuc = (m: Muc) => (m === 'Mạnh' ? 'tot' : m === 'Cần gắng' ? 'canY' : 'vua') as 'tot' | 'canY' | 'vua';
  const tenLv = (d: { cung: string; linhVuc: string }) => t.laSoTab.linhVuc[d.cung] ?? d.linhVuc;

  // --- Hình học radar: vừa bề ngang màn, nhãn không tràn lề (390px không cuộn ngang)
  const rong = width - LE_NGANG * 2;
  const R = Math.max(70, Math.min(96, rong / 2 - CACH_NHAN - RONG_NHAN));
  const cx = rong / 2;
  const cy = R + CACH_NHAN + 24;
  const cao = cy * 2;
  const r = (d: number) => R * (lon === nho ? 0.6 : 0.18 + (0.82 * (d - nho)) / (lon - nho));
  const goc = (k: number) => -Math.PI / 2 + (k * 2 * Math.PI) / 12;
  const diem = (k: number, rr: number) => ({ x: cx + rr * Math.cos(goc(k)), y: cy + rr * Math.sin(goc(k)) });

  const menhI = laSo.menhIndex;
  const truc = Array.from({ length: 12 }, (_, k) => {
    const c = laSo.cungs[(menhI + k) % 12];
    return { k, d: ds.find((x) => x.cung === c.tenCung)! };
  }).filter((x) => x.d);

  const luoi = [0.34, 0.67, 1].map((f) =>
    truc.map(({ k }) => {
      const p = diem(k, R * f);
      return `${p.x},${p.y}`;
    }).join(' ')
  );
  const vungDiem = truc.map(({ k, d }) => {
    const p = diem(k, r(d.diem));
    return `${p.x},${p.y}`;
  }).join(' ');

  const chuDeCua = (cung: string) => CHU_DE_V3.find((c) => c.cungChinh === cung);

  return (
    <View style={{ gap: KHOANG.x4 }}>
      <Chu kieu="bodySm" mo>
        {t.laSoTab.soTrong}
      </Chu>

      {/* --- Radar --- */}
      <View style={{ width: rong, height: cao }}>
        <Svg width={rong} height={cao}>
          <Defs>
            <SvgGradient id="manhYeuNen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#A393FF" stopOpacity={toi ? 0.5 : 0.38} />
              <Stop offset="1" stopColor="#F28AC9" stopOpacity={toi ? 0.32 : 0.24} />
            </SvgGradient>
            <SvgGradient id="manhYeuVien" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={toi ? '#C9BFFF' : '#7C6AE6'} />
              <Stop offset="1" stopColor={toi ? '#F28AC9' : '#D32298'} />
            </SvgGradient>
          </Defs>
          {luoi.map((p, i) => (
            <Polygon key={i} points={p} fill="none" stroke={mau.ranh} strokeWidth={1} />
          ))}
          {truc.map(({ k }) => {
            const p = diem(k, R);
            return <Line key={k} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={mau.ranh} strokeWidth={1} />;
          })}
          <Circle cx={cx} cy={cy} r={r(giua)} fill="none" stroke={mau.chuNhat} strokeWidth={1} strokeDasharray="4 4" />
          <Polygon points={vungDiem} fill="url(#manhYeuNen)" stroke="url(#manhYeuVien)" strokeWidth={2.2} strokeLinejoin="round" />
          {truc.map(({ k, d }) => {
            const p = diem(k, r(d.diem));
            const laChon = d.cung === dangChon?.cung;
            return (
              <Circle
                key={k}
                cx={p.x}
                cy={p.y}
                r={laChon ? 7 : 4.5}
                fill={mauMuc(d.muc)}
                stroke={laChon ? (toi ? '#0B0A0D' : '#FFFFFF') : 'none'}
                strokeWidth={laChon ? 2 : 0}
              />
            );
          })}
        </Svg>

        {/* Nhãn = vùng chạm 44px */}
        {truc.map(({ k, d }) => {
          const p = diem(k, R + CACH_NHAN);
          const cos = Math.cos(goc(k));
          const canh = Math.abs(cos) < 0.2 ? 'center' : cos > 0 ? 'left' : 'right';
          const left = canh === 'center' ? p.x - RONG_NHAN / 2 - 8 : canh === 'left' ? p.x : p.x - RONG_NHAN;
          const laChon = d.cung === dangChon?.cung;
          return (
            <Pressable
              key={k}
              onPress={() => setChon(d.cung)}
              accessibilityRole="button"
              accessibilityState={{ selected: laChon }}
              accessibilityLabel={`${tenLv(d)} — ${t.laSoTab.muc[KHOA_MUC[d.muc]]}`}
              style={{
                position: 'absolute',
                left: Math.max(0, Math.min(rong - RONG_NHAN - (canh === 'center' ? 16 : 0), left)),
                top: p.y - 22,
                width: RONG_NHAN + (canh === 'center' ? 16 : 0),
                height: 44,
                justifyContent: 'center',
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.92}
                style={{
                  fontFamily: laChon ? FONT.thanRatDam : FONT.thanVua,
                  fontSize: 12,
                  lineHeight: 16,
                  color: laChon ? v.mau : mau.chuMo,
                  textAlign: canh,
                }}
              >
                {t.laSoTab.tenNgan[d.cung] ?? d.cung}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* --- Ba mức: chú giải kiêm danh sách chạm được --- */}
      <View style={{ gap: KHOANG.x3 }}>
        {THU_TU_MUC.map((m) => {
          const nhom = xep.filter((d) => d.muc === m);
          if (!nhom.length) return null;
          return (
            <View key={m} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: mauMuc(m) }} />
                <Text style={{ fontFamily: FONT.thanDam, fontSize: 13, lineHeight: 18, color: mau.chu }}>
                  {t.laSoTab.muc[KHOA_MUC[m]]}
                </Text>
                <Text style={{ flex: 1, fontFamily: FONT.than, fontSize: 13, lineHeight: 18, color: mau.chuMo }}>
                  {t.laSoTab.mucMoTa[KHOA_MUC[m]]}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {nhom.map((d) => {
                  const laChon = d.cung === dangChon?.cung;
                  return (
                    <Pressable
                      key={d.cung}
                      onPress={() => setChon(d.cung)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: laChon }}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        minHeight: 36,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: laChon ? `rgba(${v.rgb},0.5)` : mau.vien,
                        backgroundColor: laChon ? `rgba(${v.rgb},0.14)` : mau.the,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ fontFamily: FONT.thanVua, fontSize: 13, color: laChon ? v.mau : mau.chu }}>{tenLv(d)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* --- Vì sao của lĩnh vực đang chọn --- */}
      {dangChon ? (
        <ChiTiet
          d={dangChon}
          ten={tenLv(dangChon)}
          tenLv={tenLv}
          loai={loaiMuc(dangChon.muc)}
          mauMuc={mauMuc}
          laDaiVan={cungDv === dangChon.cung}
          laTieuHan={cungTh === dangChon.cung}
          namXem={namXem}
          chuDe={chuDeCua(dangChon.cung)}
          onDoc={(id) => router.push({ pathname: '/luan-giai/[nhom]', params: { nhom: id } })}
        />
      ) : (
        <Chu kieu="bodySm" mo>
          {t.laSoTab.chonLinhVuc}
        </Chu>
      )}
    </View>
  );
}

function ChiTiet({
  d,
  ten,
  tenLv,
  loai,
  mauMuc,
  laDaiVan,
  laTieuHan,
  namXem,
  chuDe,
  onDoc,
}: {
  d: ChiTietDiemCung;
  ten: string;
  tenLv: (d: { cung: string; linhVuc: string }) => string;
  loai: 'tot' | 'canY' | 'vua';
  mauMuc: (m: Muc) => string;
  laDaiVan: boolean;
  laTieuHan: boolean;
  namXem: number;
  chuDe?: { id: string; ten: string };
  onDoc: (id: string) => void;
}) {
  const t = useT();
  const { mau } = useTheme();
  const v = useVung('laSo');

  const giup = d.trongCung.filter((g) => g.diem > 0).sort((a, b) => b.diem - a.diem);
  const tro = d.trongCung.filter((g) => g.diem < 0).sort((a, b) => a.diem - b.diem);
  const ghiChu = d.trongCung.filter((g) => g.diem === 0 && (g.loai === 'tuan' || g.loai === 'chinh'));
  const hoTro = d.soiVao.filter((s) => s.diem >= 0.3);
  const keoXuong = d.soiVao.filter((s) => s.diem <= -0.3);

  /** Một dòng "vì sao": lời thường + tên sao (cho người biết Tử Vi) — như `yNghia` của web */
  const yNghia = (g: GopDiem): { loi: string; sao?: string } => {
    if (g.loai === 'chinh') return { loi: t.laSoTab.theSaoChinh[g.doSang ?? 'B'] ?? t.laSoTab.theSaoChinh.B, sao: g.sao };
    if (g.loai === 'vcd') return { loi: t.laSoTab.vcd, sao: g.sao ? dien(t.laSoTab.muon, { sao: g.sao }) : undefined };
    if (g.loai === 'tuan') return { loi: t.laSoTab.tuan, sao: g.sao };
    const nghia = t.laSoTab.nghiaNgan[g.sao ?? ''] ?? g.ten;
    const dac = g.loai === 'hung' && g.doSang === 'D';
    return { loi: nghia.charAt(0).toUpperCase() + nghia.slice(1) + (dac ? t.laSoTab.botNang : ''), sao: g.sao };
  };

  const DanhSach = ({ tieuDe, mauTieuDe, list }: { tieuDe: string; mauTieuDe: string; list: GopDiem[] }) => (
    <View style={{ gap: KHOANG.x2 }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase', color: mauTieuDe }}>
        {tieuDe}
      </Text>
      {list.map((g, k) => {
        const y = yNghia(g);
        return (
          <View key={k} style={{ flexDirection: 'row', gap: KHOANG.x2, alignItems: 'flex-start' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: mauTieuDe, marginTop: 8 }} />
            <Text style={{ flex: 1, fontFamily: FONT.than, fontSize: 15, lineHeight: 22, color: mau.chu }}>
              {y.loi}
              {y.sao ? <Text style={{ fontSize: 12, color: mau.chuMo }}> · {y.sao}</Text> : null}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <The style={{ borderRadius: 22, gap: KHOANG.x4 }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x2, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, lineHeight: 22, color: mau.chu, flexShrink: 1 }}>{ten}</Text>
          <NhanTrangThai nho loai={loai} nhan={t.laSoTab.muc[KHOA_MUC[d.muc]]} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Chu kieu="caption" mo>
            {dien(t.laSoTab.cung, { ten: d.cung })}
          </Chu>
          {laDaiVan && <NhanTrangThai nho loai="vang" nhan={t.laSoTab.vanHienTai} />}
          {laTieuHan && <NhanTrangThai nho loai="vang" nhan={dien(t.laSoTab.namX, { nam: namXem })} />}
        </View>
      </View>

      {giup.length > 0 && <DanhSach tieuDe={t.laSoTab.giup} mauTieuDe={mauMuc('Mạnh')} list={giup} />}
      {tro.length > 0 && <DanhSach tieuDe={t.laSoTab.tro} mauTieuDe={mauMuc('Cần gắng')} list={tro} />}
      {ghiChu.length > 0 && <DanhSach tieuDe={t.laSoTab.ghiChu} mauTieuDe={mau.chuMo} list={ghiChu} />}
      {giup.length === 0 && tro.length === 0 && <Chu kieu="body">{t.laSoTab.khongNoiTroi}</Chu>}

      {(hoTro.length > 0 || keoXuong.length > 0) && (
        <Chu kieu="bodySm" mo>
          {[
            hoTro.length ? dien(t.laSoTab.tiepSuc, { ds: hoTro.map(tenLv).join(', ') }) : null,
            keoXuong.length ? dien(t.laSoTab.keoXuong, { ds: keoXuong.map(tenLv).join(', ') }) : null,
          ]
            .filter(Boolean)
            .join(' ')}
        </Chu>
      )}

      {d.cung === 'Tật Ách' && (
        <Chu kieu="caption" mo>
          {t.laSoTab.tatAch}
        </Chu>
      )}

      {chuDe && (
        <NutChu
          nhan={`${dien(t.laSoTab.docChuyenSauVe, { ten: (t.luanGiai.chuDe[chuDe.id] ?? chuDe.ten).toLowerCase() })} →`}
          mauChu={v.mau}
          onPress={() => onDoc(chuDe.id)}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </The>
  );
}
