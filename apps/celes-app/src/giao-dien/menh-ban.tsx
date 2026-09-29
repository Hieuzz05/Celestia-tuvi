import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutChinh, NutChu, NutIcon, NutPhu, OrbCeles, Pill } from './co-ban';
import { Icon } from './icon-aurora';
import { dien, useT } from '@/i18n/context';
import { useTheme, useVung } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, FONT, KHOANG, LE_NGANG, type BoMau } from '@/thiet-ke/token';
import { PHU_TINH_TRONG_YEU } from '@tuvi/phu-tinh-trong-yeu';
import {
  canChiCuaNam,
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from '@tuvi/ansao';
import { namAmHienTai, thangAmHienTai } from '@tuvi/bay-gio';
import { CHI, NGU_HANH, NGU_HANH_CHI, type NguHanh, type Sao } from '@tuvi/constants';
import { CHU_DE_V3 } from '@khung-v3';

/**
 * Mệnh bàn — lá số đầy đủ, một phiên bản duy nhất, cùng nội dung với mệnh bàn
 * trên web (`components/laso/PalaceCell.tsx`, `CenterPanel.tsx`). Dùng chung
 * cho tab Lá số và màn `/ban-do` (kể cả `?id=` của "Người của tôi").
 *
 * Mỗi ô cung hiện ĐỦ: can chi, số đại vận, tên cung + Thân, chính tinh kèm độ
 * sáng (hoặc Vô chính diệu), tứ hoá, toàn bộ phụ tinh và vòng sao chia hai cột
 * (cát trái, hung phải), lưu tinh khi bật, và chân ô Tiểu hạn / Tràng sinh /
 * Nguyệt hạn. Tuần/Triệt đặt trên đường biên chung của hai cung như lá số giấy.
 *
 * Chiều cao từng HÀNG được tính theo ô nhiều sao nhất trong hàng đó — thà mệnh
 * bàn dài hơn một màn còn hơn cắt mất tên sao. Bề ngang luôn vừa màn (390px
 * không cuộn ngang); chữ sao nhỏ tự co (`adjustsFontSizeToFit`) thay vì gãy dòng.
 *
 * Giao diện theo `laso_grid` của Aurora bản 8: ô kính, ô Mệnh viền gradient,
 * ô tam phương ánh vàng, tứ hoá là chip màu theo `mau.hoa`. KHÔNG tô màu theo
 * ngũ hành từng sao — engine chưa có bảng hành của sao, bịa ở giao diện là sai luật.
 */

/** Vị trí cố định của từng chi trên lưới 4×4 truyền thống */
const VI_TRI: Record<number, { hang: number; cot: number }> = {
  5: { hang: 0, cot: 0 },
  6: { hang: 0, cot: 1 },
  7: { hang: 0, cot: 2 },
  8: { hang: 0, cot: 3 },
  4: { hang: 1, cot: 0 },
  9: { hang: 1, cot: 3 },
  3: { hang: 2, cot: 0 },
  10: { hang: 2, cot: 3 },
  2: { hang: 3, cot: 0 },
  1: { hang: 3, cot: 1 },
  0: { hang: 3, cot: 2 },
  11: { hang: 3, cot: 3 },
};

/** Lề riêng của lưới — hẹp hơn lề màn hình để hai cột sao trong ô còn đủ chỗ */
export const LE_LUOI = KHOANG.x2;
/** Khe giữa hai ô và bo góc ô, theo bản thiết kế */
const KHE = 3;
const BO_O = 9;
const DEM_O = 3;

/* Cỡ chữ riêng của mệnh bàn — chỉ dùng ở lưới này (ngoại lệ duy nhất của luật ≥ 11px) */
const SAO = { fontSize: 7.5, lineHeight: 9.5 };
const CHINH = { fontSize: 10, lineHeight: 12.5 };
const TEN_CUNG = { fontSize: 8.5, lineHeight: 11 };
const PHU = { fontSize: 7, lineHeight: 10 };
const O_GIUA = { fontSize: 9, lineHeight: 11.5 };
const HOA = { fontSize: 6.5, lineHeight: 11 };

/** Bảng giữa cần chừng này chỗ để hiện đủ 17 dòng thông tin + đầu bảng */
const CAO_O_GIUA = 330;

/** Màu ngũ hành — tông vừa, đọc được trên cả nền sáng lẫn nền tối */
export const MAU_NGU_HANH: Record<NguHanh, string> = {
  Kim: '#A1A1AA',
  Mộc: '#22A355',
  Thủy: '#3B82F6',
  Hỏa: '#F97316',
  Thổ: '#D97706',
};

/** Cặp nền / chữ của một hoá theo theme */
export function mauHoa(mau: BoMau, ten: string) {
  return ten === 'Hóa Lộc'
    ? mau.hoa.loc
    : ten === 'Hóa Quyền'
      ? mau.hoa.quyen
      : ten === 'Hóa Khoa'
        ? mau.hoa.khoa
        : ten === 'Hóa Kỵ'
          ? mau.hoa.ky
          : mau.vua;
}

/** Màu chữ độ sáng: miếu vượng đắc xanh, bình lợi nhạt, hãm cam */
export function mauDoSang(mau: BoMau, d?: string | null) {
  return d === 'M' || d === 'V' || d === 'D'
    ? mau.sao.mieu
    : d === 'H'
      ? mau.sao.ham
      : d === 'B' || d === 'L'
        ? mau.sao.binh
        : mau.chuMo;
}

/** Bảng màu bề mặt ô theo theme — giá trị lấy từ `gen.py` của Aurora bản 8 */
function beMatO(toi: boolean) {
  return toi
    ? {
        nen: 'rgba(255,255,255,0.03)',
        vien: 'rgba(255,255,255,0.065)',
        tpNen: 'rgba(255,203,15,0.055)',
        tpVien: 'rgba(255,203,15,0.26)',
        menhNen: ['#1D1826', '#15121B'] as [string, string],
        menhVien: ['#A393FF', '#F28AC9', '#FFCB0F'] as [string, string, ...string[]],
        tagNen: '#15121A',
        tagChu: '#FFCB0F',
        giuaNen: 'rgba(255,255,255,0.02)',
        giuaVien: 'rgba(255,255,255,0.05)',
        dauNen: '#15121A',
        dauChu: '#FFCB0F',
        dauVien: 'rgba(255,203,15,0.6)',
      }
    : {
        nen: '#FFFFFF',
        vien: 'rgba(36,0,41,0.08)',
        tpNen: '#FFFAEB',
        tpVien: 'rgba(217,140,0,0.38)',
        menhNen: ['#FFF1F7', '#FFF6DA'] as [string, string],
        menhVien: ['#FF8BD0', '#FFCB0F'] as [string, string, ...string[]],
        tagNen: '#FDE7F3',
        tagChu: '#B8157F',
        giuaNen: 'rgba(255,255,255,0.6)',
        giuaVien: 'rgba(36,0,41,0.08)',
        dauNen: '#FFFFFF',
        dauChu: '#9A6A00',
        dauVien: 'rgba(154,106,0,0.55)',
      };
}

type SaoLuu = { ten: string; tinhChat?: string };

export interface DuLieuO {
  cung: Cung;
  chinhTinh: Sao[];
  tuHoa: Sao[];
  cot1: Sao[];
  cot2: Sao[];
  luu: SaoLuu[];
}

function tachSao(cung: Cung, luu: SaoLuu[]): DuLieuO {
  const nhom = cung.sao.filter((s) => s.loai === 'phu-tinh' || s.loai === 'vong-sao');
  // Phụ tinh đọc trước vòng sao trong cùng cột — thứ quan trọng hơn lên trên
  nhom.sort((a, b) => (a.loai === b.loai ? 0 : a.loai === 'phu-tinh' ? -1 : 1));
  return {
    cung,
    chinhTinh: cung.sao.filter((s) => s.loai === 'chinh-tinh'),
    tuHoa: cung.sao.filter((s) => s.loai === 'tu-hoa'),
    cot1: nhom.filter((s) => s.tinhChat !== 'hung'),
    cot2: nhom.filter((s) => s.tinhChat === 'hung'),
    luu,
  };
}

/** Ước chiều cao một ô theo số dòng thực sẽ vẽ */
function uocCao(o: DuLieuO): number {
  const soCot = Math.max(o.cot1.length, o.cot2.length);
  return (
    DEM_O * 2 +
    3 + // vạch ngũ hành
    PHU.lineHeight +
    TEN_CUNG.lineHeight +
    3 +
    Math.max(1, o.chinhTinh.length) * CHINH.lineHeight +
    (o.tuHoa.length ? 3 + Math.ceil(o.tuHoa.length / 2) * (HOA.lineHeight + 2) : 0) +
    (soCot ? 3 + soCot * SAO.lineHeight : 0) +
    (o.luu.length ? 2 + Math.ceil(o.luu.length / 2) * SAO.lineHeight : 0) +
    4 +
    PHU.lineHeight +
    KHE +
    4 // dư một chút cho làm tròn của hệ điều hành
  );
}

/** Dòng chữ nhỏ của mệnh bàn — dùng Text trần để kiểm soát cỡ và nét */
function Nho({
  co,
  mau,
  dam,
  ratDam,
  nghieng,
  canh,
  vua,
  mono,
  style,
  children,
}: {
  co: { fontSize: number; lineHeight: number };
  mau: string;
  dam?: boolean;
  ratDam?: boolean;
  nghieng?: boolean;
  canh?: TextStyle['textAlign'];
  /** Một dòng, tự co chữ cho vừa bề ngang thay vì gãy giữa tên sao */
  vua?: boolean;
  mono?: boolean;
  style?: TextStyle;
  children: ReactNode;
}) {
  return (
    <Text
      numberOfLines={vua ? 1 : undefined}
      adjustsFontSizeToFit={vua}
      minimumFontScale={0.7}
      allowFontScaling={false}
      style={{
        ...co,
        color: mau,
        fontFamily: mono ? FONT.mono : ratDam ? FONT.thanRatDam : dam ? FONT.thanDam : FONT.than,
        fontStyle: nghieng ? 'italic' : 'normal',
        textAlign: canh,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

/* =================================================================== Lưới */

interface LuoiProps {
  laSo: LaSo;
  o: DuLieuO[];
  namXem: number;
  thangXem: number;
  tuoiAm: number;
  iTieuHan: number;
  iNguyetHan: number;
  iDaiVan?: number;
  chon: number | null;
  onChon: (i: number) => void;
  /** Cung tâm khi bật Tam phương — ô đó và ba ô chiếu về được tô vàng */
  tamPhuongTu: number | null;
}

function LuoiMenhBan({
  laSo,
  o,
  namXem,
  thangXem,
  tuoiAm,
  iTieuHan,
  iNguyetHan,
  iDaiVan,
  chon,
  onChon,
  tamPhuongTu,
}: LuoiProps) {
  const t = useT();
  const { mau, theme } = useTheme();
  const v = useVung('laSo');
  const { width } = useWindowDimensions();
  const bm = beMatO(theme === 'toi');

  const quanHe = tamPhuongTu === null ? null : tamPhuongTuChinh(tamPhuongTu);
  const laTamPhuong = (i: number) =>
    !!quanHe && (i === tamPhuongTu || quanHe.tamHop.includes(i) || i === quanHe.xungChieu);

  // Lưới 4×4 fit đúng bề ngang màn hình — không cuộn ngang
  const oRong = (width - LE_LUOI * 2) / 4;
  const caoHang = [0, 0, 0, 0];
  for (const d of o) {
    const h = VI_TRI[d.cung.chiIndex].hang;
    caoHang[h] = Math.max(caoHang[h], uocCao(d));
  }
  // Hai hàng giữa còn phải chứa bảng thông tin trung tâm
  caoHang[1] = Math.max(caoHang[1], CAO_O_GIUA / 2);
  caoHang[2] = Math.max(caoHang[2], CAO_O_GIUA / 2);
  const dinhHang = [0, caoHang[0], caoHang[0] + caoHang[1], caoHang[0] + caoHang[1] + caoHang[2]];
  const caoLuoi = dinhHang[3] + caoHang[3];

  const mauSao = (s: Sao) =>
    s.tinhChat === 'hung'
      ? mau.sao.hung
      : s.loai === 'vong-sao'
        ? mau.sao.vong
        : PHU_TINH_TRONG_YEU.has(s.ten)
          ? mau.sao.chinh
          : mau.sao.cat;

  return (
    <View style={{ width: oRong * 4, height: caoLuoi, alignSelf: 'center' }}>
      {o.map((d) => {
        const c = d.cung;
        const vt = VI_TRI[c.chiIndex];
        const laChon = c.chiIndex === chon;
        const tp = laTamPhuong(c.chiIndex);
        const laMenh = c.laCungMenh;
        const laTieuHan = c.chiIndex === iTieuHan;
        const laDaiVan = c.chiIndex === iDaiVan;
        const rong = oRong - KHE;
        const cao = caoHang[vt.hang] - KHE;
        return (
          <Pressable
            key={c.chiIndex}
            onPress={() => onChon(c.chiIndex)}
            accessibilityRole="button"
            accessibilityLabel={`${c.tenCung} ${c.chi}`}
            accessibilityState={{ selected: laChon }}
            style={({ pressed }) => [
              {
                position: 'absolute',
                left: vt.cot * oRong + KHE / 2,
                top: dinhHang[vt.hang] + KHE / 2,
                width: rong,
                height: cao,
                borderRadius: BO_O,
                padding: DEM_O,
                paddingTop: DEM_O + 3,
                overflow: 'hidden',
                opacity: pressed ? 0.8 : 1,
              },
              laMenh
                ? { shadowColor: v.mau, shadowOpacity: theme === 'toi' ? 0.25 : 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
                : {
                    borderWidth: laChon ? 1.5 : 1,
                    borderColor: laChon ? v.mau : tp ? bm.tpVien : bm.vien,
                    backgroundColor: tp ? bm.tpNen : bm.nen,
                  },
            ]}
          >
            {/* Ô Mệnh: viền gradient 1.5 + nền gradient — vẽ hai lớp vì RN không có viền gradient */}
            {laMenh && (
              <>
                <LinearGradient
                  colors={laChon ? [v.mau, v.mau] : bm.menhVien}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: BO_O }]}
                />
                <LinearGradient
                  colors={tp ? [bm.tpNen, bm.tpNen] : bm.menhNen}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', left: 1.5, top: 1.5, right: 1.5, bottom: 1.5, borderRadius: BO_O - 1.5 }}
                />
                {tp && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 1.5,
                      top: 1.5,
                      right: 1.5,
                      bottom: 1.5,
                      borderRadius: BO_O - 1.5,
                      backgroundColor: theme === 'toi' ? '#15121B' : '#FFFFFF',
                      opacity: 0.6,
                    }}
                  />
                )}
              </>
            )}

            {/* Vạch ngũ hành của địa chi cung */}
            <View
              style={{
                position: 'absolute',
                top: laMenh ? 1.5 : 0,
                left: BO_O,
                right: BO_O,
                height: 2,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                backgroundColor: MAU_NGU_HANH[NGU_HANH_CHI[c.chiIndex]],
                opacity: 0.85,
              }}
            />

            {/* Hàng đầu: can.chi — số đại vận (vận hiện tại là pill xanh) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Nho co={PHU} mau={mau.chuMo} mono>
                {c.can.slice(0, 1)}.{c.chi}
              </Nho>
              {c.daiVan &&
                (laDaiVan ? (
                  <View style={{ borderRadius: 999, backgroundColor: mau.tot2.nen, paddingHorizontal: 3 }}>
                    <Nho co={PHU} mau={mau.tot2.chu} mono>
                      {c.daiVan.tuTuoi}
                    </Nho>
                  </View>
                ) : (
                  <Nho co={PHU} mau={mau.chuNhat} mono>
                    {c.daiVan.tuTuoi}
                  </Nho>
                ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <View style={{ flexShrink: 1 }}>
                <Nho
                  co={TEN_CUNG}
                  mau={laMenh ? v.mau : mau.chu}
                  ratDam
                  vua
                  style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}
                >
                  {c.tenCung}
                </Nho>
              </View>
              {c.laCungThan && (
                <View style={{ borderRadius: 999, backgroundColor: bm.tagNen, paddingHorizontal: 3, borderWidth: 0.5, borderColor: bm.dauVien }}>
                  <Nho co={{ fontSize: 6.5, lineHeight: 8.5 }} mau={bm.tagChu} ratDam>
                    {t.banDo.than.toUpperCase()}
                  </Nho>
                </View>
              )}
            </View>

            {/* Không `alignItems: center`: chữ phải giãn đủ bề ngang ô thì mới tự co được */}
            <View style={{ marginTop: 3 }}>
              {d.chinhTinh.length ? (
                d.chinhTinh.map((s) => (
                  <Nho key={s.ten} co={CHINH} mau={mau.sao.chinh} ratDam vua canh="center">
                    {s.ten}
                    {s.doSang ? (
                      <Text style={{ color: mauDoSang(mau, s.doSang), fontSize: 7, fontFamily: FONT.mono }}> {s.doSang}</Text>
                    ) : null}
                  </Nho>
                ))
              ) : (
                <Nho co={{ fontSize: 8.5, lineHeight: CHINH.lineHeight }} mau={mau.chuNhat} nghieng vua canh="center">
                  {t.banDo.voChinhDieu}
                </Nho>
              )}
            </View>

            {d.tuHoa.length > 0 && (
              <View style={{ marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                {d.tuHoa.map((s) => {
                  const m = mauHoa(mau, s.ten);
                  return (
                    <View
                      key={s.ten}
                      style={{ borderRadius: 999, backgroundColor: m.nen, paddingHorizontal: 4, height: HOA.lineHeight, justifyContent: 'center' }}
                    >
                      <Nho co={HOA} mau={m.chu} ratDam style={{ letterSpacing: 0.3 }}>
                        {s.ten.toUpperCase()}
                      </Nho>
                    </View>
                  );
                })}
              </View>
            )}

            {(d.cot1.length > 0 || d.cot2.length > 0) && (
              <View style={{ marginTop: 3, flexDirection: 'row', gap: 2 }}>
                <View style={{ flex: 1 }}>
                  {d.cot1.map((s) => (
                    <Nho key={s.ten} co={SAO} mau={mauSao(s)} dam={PHU_TINH_TRONG_YEU.has(s.ten)} vua>
                      {s.ten}
                    </Nho>
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  {d.cot2.map((s) => (
                    <Nho key={s.ten} co={SAO} mau={mauSao(s)} dam={PHU_TINH_TRONG_YEU.has(s.ten)} vua canh="right">
                      {s.ten}
                    </Nho>
                  ))}
                </View>
              </View>
            )}

            {d.luu.length > 0 && (
              <View style={{ marginTop: 2, flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 }}>
                {d.luu.map((s) => (
                  <Nho key={s.ten} co={SAO} mau={s.tinhChat === 'hung' ? mau.sao.hung : mau.sao.mieu} nghieng>
                    {s.ten.replace('Lưu ', 'L.')}
                  </Nho>
                ))}
              </View>
            )}

            {/* Chân ô: Tiểu hạn — Tràng sinh — Nguyệt hạn */}
            <View
              style={{
                marginTop: 'auto',
                paddingTop: 4,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                {laTieuHan && (
                  <View style={{ borderRadius: 999, backgroundColor: mau.vang.nen, paddingHorizontal: 3 }}>
                    <Nho co={PHU} mau={mau.vang.chu} ratDam vua>
                      {t.banDo.tieuHan}
                    </Nho>
                  </View>
                )}
              </View>
              <Nho co={PHU} mau={mau.chuNhat} vua>
                {c.trangSinh}
              </Nho>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {c.chiIndex === iNguyetHan && (
                  <Nho co={PHU} mau={mau.chuMo} mono>
                    T.{thangXem}
                  </Nho>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      <BangGiua
        laSo={laSo}
        namXem={namXem}
        tuoiAm={tuoiAm}
        left={oRong}
        top={dinhHang[1]}
        width={oRong * 2}
        height={caoHang[1] + caoHang[2]}
      />

      <DauTuanTriet laSo={laSo} oRong={oRong} dinhHang={dinhHang} caoHang={caoHang} />
    </View>
  );
}

/** Bảng thông tin trung tâm — cùng nội dung với `CenterPanel` của web */
function BangGiua({
  laSo,
  namXem,
  tuoiAm,
  left,
  top,
  width,
  height,
}: {
  laSo: LaSo;
  namXem: number;
  tuoiAm: number;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const t = useT();
  const { mau, theme } = useTheme();
  const bm = beMatO(theme === 'toi');
  const tt = laSo.thongTin;
  const hai = (n: number) => String(n).padStart(2, '0');

  const nhom: { nhan: string; giaTri: string; mauGiaTri?: string }[][] = [
    [
      { nhan: t.banDo.duongLich, giaTri: `${tt.ngay}/${tt.thang}/${tt.nam} — ${hai(tt.gio)}:${hai(tt.phut ?? 0)}` },
      {
        nhan: t.banDo.amLich,
        giaTri: `${tt.amLich.ngay}/${tt.amLich.thang}${tt.amLich.nhuan ? ` (${t.banDo.nhuan})` : ''} — ${tt.canChiNam}`,
      },
      { nhan: t.banDo.gioSinh, giaTri: `${tt.chiGio} (${tt.canChiGio})` },
    ],
    [
      { nhan: t.banDo.canChiNam, giaTri: tt.canChiNam },
      { nhan: t.banDo.canChiThang, giaTri: tt.canChiThang },
      { nhan: t.banDo.canChiNgay, giaTri: tt.canChiNgay },
      { nhan: t.banDo.canChiGio, giaTri: tt.canChiGio },
    ],
    [
      { nhan: t.banDo.amDuong, giaTri: `${laSo.amDuong} — ${laSo.amDuongThuanLy}` },
      { nhan: t.banDo.banMenh, giaTri: laSo.banMenh.ten, mauGiaTri: MAU_NGU_HANH[laSo.banMenh.hanh] },
      { nhan: t.banDo.cuc, giaTri: laSo.cuc.ten, mauGiaTri: MAU_NGU_HANH[laSo.cuc.hanh] },
      { nhan: t.banDo.menhCuc, giaTri: laSo.menhCucQuanHe },
    ],
    [
      { nhan: t.banDo.menhAnTai, giaTri: CHI[laSo.menhIndex] },
      { nhan: t.banDo.thanCu, giaTri: `${laSo.thanCuCung} (${CHI[laSo.thanIndex]})` },
      { nhan: t.banDo.menhChu, giaTri: laSo.menhChu },
      { nhan: t.banDo.thanChu, giaTri: laSo.thanChu },
    ],
    [
      { nhan: t.banDo.namXem, giaTri: `${namXem} — ${canChiCuaNam(namXem)}` },
      { nhan: t.banDo.tuoiHan, giaTri: String(tuoiAm) },
    ],
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: left + KHE / 2,
        top: top + KHE / 2,
        width: width - KHE,
        height: height - KHE,
        borderRadius: BO_O + 3,
        backgroundColor: bm.giuaNen,
        borderWidth: 1,
        borderColor: bm.giuaVien,
        paddingHorizontal: 8,
        paddingVertical: 6,
        justifyContent: 'center',
        gap: 5,
      }}
    >
      <View style={{ alignItems: 'center', gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <OrbCeles size={14} tho={false} sang={false} />
          <Nho co={{ fontSize: 7, lineHeight: 10 }} mau={mau.chuMo} mono style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {t.banDo.phu}
          </Nho>
        </View>
        <Nho
          co={{ fontSize: 16, lineHeight: 20 }}
          mau={mau.chu}
          vua
          canh="center"
          style={{ fontFamily: FONT.display, letterSpacing: -0.4 }}
        >
          {tt.hoTen?.trim() || t.banDo.laSoMacDinh}
        </Nho>
        <Nho co={O_GIUA} mau={mau.chuMo} canh="center">
          {tt.gioiTinh === 'nam' ? t.banDo.namMenh : t.banDo.nuMenh} · {laSo.amDuong}
        </Nho>
      </View>
      {nhom.map((n, i) => (
        <View key={i} style={{ gap: 0 }}>
          {n.map((d) => (
            <View key={d.nhan} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
              <Nho co={O_GIUA} mau={mau.chuMo}>
                {d.nhan}
              </Nho>
              <View style={{ flexShrink: 1 }}>
                <Nho co={O_GIUA} mau={d.mauGiaTri ?? mau.chu} dam canh="right">
                  {d.giaTri}
                </Nho>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Tuần / Triệt đặt trên đường biên chung của hai cung liền kề — như lá số
 * giấy, không đè vào giữa ô. Hai cung của một cặp luôn liền nhau trên vòng 12.
 */
function DauTuanTriet({
  laSo,
  oRong,
  dinhHang,
  caoHang,
}: {
  laSo: LaSo;
  oRong: number;
  dinhHang: number[];
  caoHang: number[];
}) {
  const t = useT();
  const { theme } = useTheme();
  const bm = beMatO(theme === 'toi');

  const cap = (loc: (c: Cung) => boolean) => laSo.cungs.filter(loc).map((c) => c.chiIndex);
  const dau = [
    { loai: 'tuan' as const, cungs: cap((c) => c.coTuan), nhan: t.banDo.tuan },
    { loai: 'triet' as const, cungs: cap((c) => c.coTriet), nhan: t.banDo.triet },
  ].filter((d) => d.cungs.length === 2);

  const trungCap = dau.length === 2 && dau[0].cungs.join() === dau[1].cungs.join();

  return (
    <>
      {dau.map((d, i) => {
        const [a, b] = d.cungs.map((x) => VI_TRI[x]);
        const cungHang = a.hang === b.hang;
        // Hai dấu rơi đúng một cặp cung thì tách nhau ra dọc theo đường biên
        const lech = trungCap ? (i === 0 ? -16 : 16) : 0;
        const kichThuoc = cungHang ? { w: 13, h: d.nhan.length * 8 + 8 } : { w: d.nhan.length * 5.5 + 12, h: 13 };
        const tamX = cungHang ? Math.max(a.cot, b.cot) * oRong : a.cot * oRong + oRong / 2 + lech;
        const tamY = cungHang ? dinhHang[a.hang] + caoHang[a.hang] / 2 + lech : dinhHang[Math.max(a.hang, b.hang)];
        return (
          <View
            key={d.loai}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: tamX - kichThuoc.w / 2,
              top: tamY - kichThuoc.h / 2,
              width: kichThuoc.w,
              height: kichThuoc.h,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: bm.dauVien,
              backgroundColor: bm.dauNen,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {cungHang ? (
              d.nhan
                .toUpperCase()
                .split('')
                .map((k, j) => (
                  <Text key={j} allowFontScaling={false} style={{ fontSize: 7, lineHeight: 8, color: bm.dauChu, fontFamily: FONT.mono }}>
                    {k}
                  </Text>
                ))
            ) : (
              <Text allowFontScaling={false} style={{ fontSize: 7, lineHeight: 9, color: bm.dauChu, fontFamily: FONT.mono, letterSpacing: 0.5 }}>
                {d.nhan.toUpperCase()}
              </Text>
            )}
          </View>
        );
      })}
    </>
  );
}

/* ======================================================= Mệnh bàn đầy đủ */

/**
 * Mệnh bàn kèm thanh điều khiển (năm xem, Tam phương, lưu tinh, chú giải) và
 * bảng chi tiết một cung. Đặt thẳng trong ScrollView có lề ngang LE_NGANG —
 * lưới tự nới ra hai bên cho sát lề LE_LUOI.
 */
export function MenhBanDayDu({
  laSo,
  choPhepHoi = true,
}: {
  laSo: LaSo;
  /** Lá số của người khác thì không mời "Hỏi Celes" — Celes trò chuyện theo lá số của chính bạn */
  choPhepHoi?: boolean;
}) {
  const t = useT();
  const { mau, theme } = useTheme();

  const [namXem, setNamXem] = useState(namAmHienTai());
  const [thangXem] = useState(thangAmHienTai());
  const [chon, setChon] = useState<number | null>(null);
  const [hienLuu, setHienLuu] = useState(false);
  const [hienTamPhuong, setHienTamPhuong] = useState(false);
  const [hienChuGiai, setHienChuGiai] = useState(false);
  // Cung tâm của Tam phương: cung vừa mở gần nhất, mặc định Mệnh
  const [tamPhuongTu, setTamPhuongTu] = useState<number | null>(null);

  const luuTheoCung = useMemo(() => {
    const m = new Map<number, SaoLuu[]>();
    if (!hienLuu) return m;
    for (const s of luuTinhTheoNam(namXem)) {
      if (!m.has(s.chiIndex)) m.set(s.chiIndex, []);
      m.get(s.chiIndex)!.push({ ten: s.ten, tinhChat: s.tinhChat });
    }
    return m;
  }, [namXem, hienLuu]);

  const o = useMemo(
    () => laSo.cungs.map((c) => tachSao(c, luuTheoCung.get(c.chiIndex) ?? [])),
    [laSo, luuTheoCung]
  );

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const iTieuHan = cungTieuHan(laSo, tuoiAm);
  const iNguyetHan = cungNguyetHan(laSo, tuoiAm, thangXem);
  const iDaiVan = cungDaiVan(laSo, tuoiAm)?.chiIndex;
  const bm = beMatO(theme === 'toi');

  const moCung = (i: number) => {
    setChon(i);
    setTamPhuongTu(i);
  };

  return (
    <View style={{ gap: KHOANG.x4 }}>
      {/* --- Năm xem · Chú giải --- */}
      <View style={{ gap: KHOANG.x2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: KHOANG.x2 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: BO_GOC.nut,
              borderWidth: 1,
              borderColor: mau.vienKinh,
              backgroundColor: mau.the,
            }}
          >
            <NutNam ten="back" moTa={t.banDo.namTruoc} onPress={() => setNamXem((n) => n - 1)} />
            <View style={{ alignItems: 'center', minWidth: 76 }} accessible accessibilityLabel={`${t.banDo.namXem} ${namXem}`}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, color: mau.chuMo, letterSpacing: 0.8 }}>
                {t.banDo.namXem.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: FONT.thanRatDam, fontSize: 14, lineHeight: 18, color: mau.chu }}>
                {namXem} · {canChiCuaNam(namXem)}
              </Text>
            </View>
            <NutNam ten="chev" moTa={t.banDo.namSau} onPress={() => setNamXem((n) => n + 1)} />
          </View>
          <NutChu
            nhan={hienChuGiai ? t.laSoTab.anChuGiai : t.laSoTab.chuGiai}
            onPress={() => setHienChuGiai((x) => !x)}
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: KHOANG.x2 }}>
          <Pressable
            onPress={() => setHienTamPhuong((x) => !x)}
            accessibilityRole="switch"
            accessibilityState={{ checked: hienTamPhuong }}
            hitSlop={4}
            style={({ pressed }) => ({
              minHeight: 36,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: KHOANG.x3,
              borderRadius: BO_GOC.vien,
              borderWidth: 1,
              borderColor: hienTamPhuong ? bm.tpVien : mau.vien,
              backgroundColor: hienTamPhuong ? mau.vang.nen : mau.the,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <View
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: hienTamPhuong ? mau.vang.chu : 'transparent',
                borderWidth: 1.5,
                borderColor: mau.vang.chu,
              }}
            />
            <Text style={{ fontFamily: FONT.thanDam, fontSize: 13, color: hienTamPhuong ? mau.vang.chu : mau.chuMo }}>
              {t.laSoTab.tamPhuong}
            </Text>
          </Pressable>
          <Pill nhan={t.banDo.luuTinh} dangChon={hienLuu} onPress={() => setHienLuu((v) => !v)} vung="laSo" />
        </View>
      </View>

      {/* --- Mệnh bàn --- */}
      <View style={{ marginHorizontal: -(LE_NGANG - LE_LUOI) }}>
        <LuoiMenhBan
          laSo={laSo}
          o={o}
          namXem={namXem}
          thangXem={thangXem}
          tuoiAm={tuoiAm}
          iTieuHan={iTieuHan}
          iNguyetHan={iNguyetHan}
          iDaiVan={iDaiVan}
          chon={chon}
          onChon={moCung}
          tamPhuongTu={hienTamPhuong ? (tamPhuongTu ?? laSo.menhIndex) : null}
        />
      </View>

      {/* --- Chú giải --- */}
      {hienChuGiai ? (
        <View style={{ gap: KHOANG.x2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4, rowGap: KHOANG.x1 }}>
            <ChuGiai mauCham={mau.sao.mieu} nhan={t.banDo.chuThichCat} />
            <ChuGiai mauCham={mau.sao.hung} nhan={t.banDo.chuThichHung} />
            <ChuGiai mauCham={mau.vang.nen} vien={mau.vang.chu} nhan={t.banDo.chuThichHan} />
            <ChuGiai mauCham={bm.tpNen} vien={bm.tpVien} nhan={t.laSoTab.tamPhuong} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4, rowGap: KHOANG.x1 }}>
            <Chu kieu="caption" nhat>
              {t.banDo.nguHanhCung}:
            </Chu>
            {NGU_HANH.map((h) => (
              <ChuGiai key={h} mauCham={MAU_NGU_HANH[h]} nhan={h} />
            ))}
          </View>
          <Chu kieu="caption" mo>
            {t.banDo.goiY}
          </Chu>
        </View>
      ) : null}

      <CungChiTiet
        d={chon === null ? null : o[chon]}
        o={o}
        namXem={namXem}
        thangXem={thangXem}
        iTieuHan={iTieuHan}
        iNguyetHan={iNguyetHan}
        iDaiVan={iDaiVan}
        choPhepHoi={choPhepHoi}
        onDong={() => setChon(null)}
        onChonCung={moCung}
      />
    </View>
  );
}

function NutNam({ ten, moTa, onPress }: { ten: 'back' | 'chev'; moTa: string; onPress: () => void }) {
  const { mau } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={moTa}
      style={({ pressed }) => ({
        width: CHAM_TOI_THIEU,
        height: CHAM_TOI_THIEU,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon ten={ten} size={18} net={2} mau={mau.chu} />
    </Pressable>
  );
}

function ChuGiai({ mauCham, nhan, vien }: { mauCham: string; nhan: string; vien?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: mauCham,
          borderWidth: vien ? 1 : 0,
          borderColor: vien,
        }}
      />
      <Chu kieu="caption" mo>
        {nhan}
      </Chu>
    </View>
  );
}

/* ======================================================== Bảng một cung */

function Chip({ nhan, nen, chu, vien }: { nhan: string; nen?: string; chu?: string; vien?: string }) {
  const { mau } = useTheme();
  return (
    <View
      style={{
        minHeight: 30,
        paddingHorizontal: 11,
        borderRadius: BO_GOC.vien,
        backgroundColor: nen ?? mau.theAm,
        borderWidth: 1,
        borderColor: vien ?? mau.vien,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: FONT.thanDam, fontSize: 13, lineHeight: 18, color: chu ?? mau.chu }}>{nhan}</Text>
    </View>
  );
}

function CotSao({
  tieuDe,
  ds,
  nen,
  vien,
  mauTieuDe,
}: {
  tieuDe: string;
  ds: { ten: string; phu?: string | null; mau: string; dam?: boolean }[];
  nen: string;
  vien: string;
  mauTieuDe: string;
}) {
  const t = useT();
  const { mau } = useTheme();
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: nen, borderWidth: 1, borderColor: vien, padding: KHOANG.x3, gap: 6 }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase', color: mauTieuDe }}>
        {tieuDe}
      </Text>
      {ds.length === 0 ? (
        <Text style={{ fontFamily: FONT.than, fontSize: 13, lineHeight: 18, color: mau.chuNhat }}>{t.laSoTab.khongCo}</Text>
      ) : (
        ds.map((s) => (
          <Text key={s.ten} style={{ fontFamily: s.dam ? FONT.thanDam : FONT.than, fontSize: 13, lineHeight: 18, color: s.mau }}>
            {s.ten}
            {s.phu ? <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: mau.chuMo }}> {s.phu}</Text> : null}
          </Text>
        ))
      )}
    </View>
  );
}

function CungChiTiet({
  d,
  o,
  namXem,
  thangXem,
  iTieuHan,
  iNguyetHan,
  iDaiVan,
  choPhepHoi,
  onDong,
  onChonCung,
}: {
  d: DuLieuO | null;
  o: DuLieuO[];
  namXem: number;
  thangXem: number;
  iTieuHan: number;
  iNguyetHan: number;
  iDaiVan?: number;
  choPhepHoi: boolean;
  onDong: () => void;
  onChonCung: (i: number) => void;
}) {
  const t = useT();
  const router = useRouter();
  const { mau, theme } = useTheme();
  const v = useVung('laSo');
  const le = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toi = theme === 'toi';

  const c = d?.cung;
  const quanHe = c ? tamPhuongTuChinh(c.chiIndex) : null;
  const chuDe = c ? CHU_DE_V3.find((x) => x.cungChinh === c.tenCung) : undefined;

  const hoiCeles = () => {
    if (!c) return;
    onDong();
    router.push({ pathname: '/(tabs)/celes', params: { q: dien(t.laSoTab.cauHoiCung, { ten: c.tenCung }) } });
  };
  const docChuyenSau = () => {
    if (!chuDe) return;
    onDong();
    router.push({ pathname: '/luan-giai/[nhom]', params: { nhom: chuDe.id } });
  };

  const saoDo = d
    ? [
        ...d.cot1.map((s) => ({
          ten: s.ten,
          phu: s.doSang,
          mau: s.loai === 'vong-sao' ? mau.sao.vong : mau.sao.chinh,
          dam: PHU_TINH_TRONG_YEU.has(s.ten),
        })),
        ...d.luu.filter((s) => s.tinhChat !== 'hung').map((s) => ({ ten: s.ten, mau: mau.sao.mieu, dam: false })),
      ]
    : [];
  const canDeY = d
    ? [
        ...d.cot2.map((s) => ({ ten: s.ten, phu: s.doSang, mau: mau.sao.hung, dam: PHU_TINH_TRONG_YEU.has(s.ten) })),
        ...d.luu.filter((s) => s.tinhChat === 'hung').map((s) => ({ ten: s.ten, mau: mau.sao.hung, dam: false })),
      ]
    : [];

  return (
    <Modal visible={!!d} transparent animationType="slide" onRequestClose={onDong} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.62)' }]}
          onPress={onDong}
          accessibilityRole="button"
          accessibilityLabel={t.chung.dong}
        />
        {d && c && quanHe && (
          <View
            style={{
              maxHeight: height * 0.88,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              backgroundColor: toi ? '#141117' : mau.theNoi,
              borderTopWidth: 1,
              borderColor: `rgba(${v.rgb},0.30)`,
              overflow: 'hidden',
            }}
          >
            {/* Quầng tím mờ trên đầu sheet */}
            <LinearGradient
              colors={[`rgba(${v.rgb},${toi ? 0.14 : 0.08})`, `rgba(${v.rgb},0)`]}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160 }}
              pointerEvents="none"
            />
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: mau.ranh }} />
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: LE_NGANG,
                paddingTop: KHOANG.x3,
                paddingBottom: le.bottom + KHOANG.x5,
                gap: KHOANG.x4,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Đầu sheet */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: KHOANG.x3 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Eyebrow mauChu={v.mau}>
                    {[
                      `${c.can} ${c.chi}`,
                      NGU_HANH_CHI[c.chiIndex],
                      c.daiVan ? dien(t.laSoTab.tuoi, { tu: c.daiVan.tuTuoi, den: c.daiVan.denTuoi }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Eyebrow>
                  <Text style={{ fontFamily: FONT.display, fontSize: 22, lineHeight: 26, letterSpacing: -0.5, color: mau.chu }}>
                    {dien(t.laSoTab.cung, { ten: c.tenCung })}
                    {c.laCungMenh ? ` · ${t.banDo.menh}` : ''}
                    {c.laCungThan ? ` · ${t.banDo.than}` : ''}
                  </Text>
                </View>
                <NutIcon ten="x" nhan={t.chung.dong} onPress={onDong} />
              </View>

              {/* Chip: chính tinh, tràng sinh, hạn, Tuần/Triệt */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {d.chinhTinh.length ? (
                  d.chinhTinh.map((s) => (
                    <Chip key={s.ten} nhan={s.doSang ? `${s.ten} · ${s.doSang}` : s.ten} chu={mau.sao.chinh} />
                  ))
                ) : (
                  <Chip nhan={t.banDo.voChinhDieu} chu={mau.chuMo} />
                )}
                {d.tuHoa.map((s) => {
                  const m = mauHoa(mau, s.ten);
                  return <Chip key={s.ten} nhan={s.ten} nen={m.nen} chu={m.chu} vien="transparent" />;
                })}
                <Chip nhan={`${t.banDo.trangSinh} · ${c.trangSinh}`} chu={mau.chuMo} />
                {c.coTuan && <Chip nhan={t.laSoTab.tuanAnNgu} nen={mau.vang.nen} chu={mau.vang.chu} vien="transparent" />}
                {c.coTriet && <Chip nhan={t.laSoTab.trietAnNgu} nen={mau.vang.nen} chu={mau.vang.chu} vien="transparent" />}
                {c.daiVan && (
                  <Chip
                    nhan={`${t.banDo.daiVan} ${c.daiVan.tuTuoi}–${c.daiVan.denTuoi}`}
                    nen={c.chiIndex === iDaiVan ? mau.tot2.nen : undefined}
                    chu={c.chiIndex === iDaiVan ? mau.tot2.chu : mau.chuMo}
                  />
                )}
                {c.chiIndex === iTieuHan && (
                  <Chip nhan={`${t.banDo.tieuHan} ${namXem}`} nen={mau.vang.nen} chu={mau.vang.chu} vien="transparent" />
                )}
                {c.chiIndex === iNguyetHan && <Chip nhan={`${t.banDo.nguyetHan} T.${thangXem} · ${namXem}`} chu={mau.chuMo} />}
              </View>

              {(c.coTuan || c.coTriet) && (
                <Chu kieu="caption" mo>
                  {[c.coTuan && t.banDo.tuanKhong, c.coTriet && t.banDo.trietKhong].filter(Boolean).join(' · ')}
                </Chu>
              )}

              {/* Hai cột sao đỡ / cần để ý */}
              <View style={{ flexDirection: 'row', gap: KHOANG.x2 }}>
                <CotSao
                  tieuDe={t.laSoTab.saoDo}
                  ds={saoDo}
                  nen={toi ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.06)'}
                  vien={toi ? 'rgba(74,222,128,0.22)' : 'rgba(22,163,74,0.22)'}
                  mauTieuDe={mau.tot2.chu}
                />
                <CotSao
                  tieuDe={t.laSoTab.canDeY}
                  ds={canDeY}
                  nen={toi ? 'rgba(255,120,140,0.08)' : 'rgba(194,51,74,0.05)'}
                  vien={toi ? 'rgba(255,120,140,0.24)' : 'rgba(194,51,74,0.22)'}
                  mauTieuDe={mau.hoa.ky.chu}
                />
              </View>

              {/* Tam phương chiếu về cung này */}
              <View style={{ gap: KHOANG.x1 }}>
                <Eyebrow>{dien(t.laSoTab.tamPhuongChieu, { ten: c.tenCung })}</Eyebrow>
                {[
                  ...quanHe.tamHop.map((i) => ({ i, nhan: t.banDo.tamHop })),
                  { i: quanHe.xungChieu, nhan: t.banDo.xungChieu },
                ].map(({ i, nhan }) => {
                  const k = o[i];
                  return (
                    <Pressable
                      key={i}
                      onPress={() => onChonCung(i)}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        minHeight: 52,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: KHOANG.x3,
                        paddingVertical: 6,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: mau.vien,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mau.vang.chu }} />
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={{ fontFamily: FONT.thanDam, fontSize: 14, lineHeight: 19, color: mau.chu }}>
                          {k.cung.tenCung}
                          <Text style={{ fontFamily: FONT.than, fontSize: 12, color: mau.chuNhat }}>  {nhan}</Text>
                        </Text>
                        <Text style={{ fontFamily: FONT.than, fontSize: 13, lineHeight: 18, color: mau.chuMo }}>
                          {k.chinhTinh.length
                            ? k.chinhTinh.map((s) => (s.doSang ? `${s.ten} · ${s.doSang}` : s.ten)).join(', ')
                            : t.banDo.voChinhDieu}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, maxWidth: 120, justifyContent: 'flex-end' }}>
                        {k.tuHoa.map((s) => {
                          const m = mauHoa(mau, s.ten);
                          return (
                            <View key={s.ten} style={{ borderRadius: 999, backgroundColor: m.nen, paddingHorizontal: 7, paddingVertical: 2 }}>
                              <Text style={{ fontFamily: FONT.thanRatDam, fontSize: 11, color: m.chu }}>{s.ten.replace('Hóa ', '')}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Hành động */}
              {choPhepHoi ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x2 }}>
                  <NutChinh nhan={t.laSoTab.hoiCungNay} onPress={hoiCeles} muiTen={false} icon="sparkle" style={{ flex: 1 }} />
                  {chuDe && <NutIcon ten="book" nhan={t.laSoTab.docChuyenSau} onPress={docChuyenSau} style={{ width: 56, height: 56 }} />}
                </View>
              ) : (
                <NutPhu nhan={t.chung.dong} onPress={onDong} />
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}
