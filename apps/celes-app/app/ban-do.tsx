import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, NutPhu, Pill, The } from '@/giao-dien/co-ban';
import { IconQuayLai } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { useTheme } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, FONT, KHOANG, LE_NGANG } from '@/thiet-ke/token';
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

/**
 * Bản đồ của tôi — lá số đầy đủ, một phiên bản duy nhất, cùng nội dung với
 * mệnh bàn trên web (`components/laso/PalaceCell.tsx`, `CenterPanel.tsx`).
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
 * Màu: cát/miếu vượng xanh, hung/hãm đỏ, tứ hoá mỗi hoá một màu, vạch trên đầu
 * ô theo ngũ hành của địa chi cung. KHÔNG tô màu theo ngũ hành từng sao — engine
 * chưa có bảng hành của sao, và bịa bảng đó ở giao diện là sai luật.
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
const LE_LUOI = KHOANG.x2;
const DEM_O = 3;

/* Cỡ chữ riêng của mệnh bàn — chỉ dùng ở màn này */
const SAO = { fontSize: 7.5, lineHeight: 9.5 };
const CHINH = { fontSize: 10, lineHeight: 12.5 };
const TEN_CUNG = { fontSize: 10.5, lineHeight: 13 };
const PHU = { fontSize: 8, lineHeight: 10 };
const O_GIUA = { fontSize: 9.5, lineHeight: 12 };

/** Bảng giữa cần chừng này chỗ để hiện đủ 17 dòng thông tin */
const CAO_O_GIUA = 300;

/** Màu ngũ hành — tông vừa, đọc được trên cả nền kem lẫn nền aubergine */
const MAU_NGU_HANH: Record<NguHanh, string> = {
  Kim: '#A1A1AA',
  Mộc: '#22A355',
  Thủy: '#3B82F6',
  Hỏa: '#F97316',
  Thổ: '#D97706',
};

/** Bốn hoá phải phân biệt được cả bằng màu lẫn chữ */
const MAU_TU_HOA: Record<string, string> = {
  'Hóa Lộc': '#22A355',
  'Hóa Quyền': '#9333EA',
  'Hóa Khoa': '#3B82F6',
  'Hóa Kỵ': '#EF4444',
};

type TrangThai = 'thuong' | 'chon' | 'tam-hop' | 'xung-chieu' | 'mo';

interface DuLieuO {
  cung: Cung;
  chinhTinh: Sao[];
  tuHoa: Sao[];
  cot1: Sao[];
  cot2: Sao[];
  luu: { ten: string; tinhChat?: string }[];
}

function tachSao(cung: Cung, luu: DuLieuO['luu']): DuLieuO {
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
    2 + // vạch ngũ hành
    PHU.lineHeight +
    TEN_CUNG.lineHeight +
    3 +
    Math.max(1, o.chinhTinh.length) * CHINH.lineHeight +
    (o.tuHoa.length ? 3 + Math.ceil(o.tuHoa.length / 3) * 12 : 0) +
    (soCot ? 3 + soCot * SAO.lineHeight : 0) +
    (o.luu.length ? 2 + Math.ceil(o.luu.length / 2) * SAO.lineHeight : 0) +
    4 +
    PHU.lineHeight +
    4 // dư một chút cho làm tròn của hệ điều hành
  );
}

/** Dòng chữ nhỏ của mệnh bàn — dùng Text trần để kiểm soát cỡ và nét */
function Nho({
  co,
  mau,
  dam,
  nghieng,
  canh,
  vua,
  children,
}: {
  co: { fontSize: number; lineHeight: number };
  mau: string;
  dam?: boolean;
  nghieng?: boolean;
  canh?: TextStyle['textAlign'];
  /** Một dòng, tự co chữ cho vừa bề ngang thay vì gãy giữa tên sao */
  vua?: boolean;
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
        fontFamily: dam ? FONT.thanDam : FONT.than,
        fontStyle: nghieng ? 'italic' : 'normal',
        textAlign: canh,
      }}
    >
      {children}
    </Text>
  );
}

export default function ManBanDo() {
  const router = useRouter();
  const t = useT();
  const { mau, theme } = useTheme();
  const le = useSafeAreaInsets();
  const { laSo } = useHoSo();
  const { width } = useWindowDimensions();

  const [namXem, setNamXem] = useState(namAmHienTai());
  const [thangXem] = useState(thangAmHienTai());
  const [chon, setChon] = useState<number | null>(null);
  const [hienLuu, setHienLuu] = useState(false);

  const luuTheoCung = useMemo(() => {
    const m = new Map<number, { ten: string; tinhChat?: string }[]>();
    if (!hienLuu) return m;
    for (const s of luuTinhTheoNam(namXem)) {
      if (!m.has(s.chiIndex)) m.set(s.chiIndex, []);
      m.get(s.chiIndex)!.push({ ten: s.ten, tinhChat: s.tinhChat });
    }
    return m;
  }, [namXem, hienLuu]);

  const o = useMemo(
    () => (laSo ? laSo.cungs.map((c) => tachSao(c, luuTheoCung.get(c.chiIndex) ?? [])) : []),
    [laSo, luuTheoCung]
  );

  if (!laSo) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen, padding: LE_NGANG, paddingTop: le.top + KHOANG.x10 }}>
        <Chu kieu="body" mo>
          {t.trangThai.rong}
        </Chu>
      </View>
    );
  }

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const iTieuHan = cungTieuHan(laSo, tuoiAm);
  const iNguyetHan = cungNguyetHan(laSo, tuoiAm, thangXem);
  const iDaiVan = cungDaiVan(laSo, tuoiAm)?.chiIndex;
  const quanHe = chon === null ? null : tamPhuongTuChinh(chon);

  const trangThai = (i: number): TrangThai => {
    if (!quanHe || chon === null) return 'thuong';
    if (i === chon) return 'chon';
    if (quanHe.tamHop.includes(i)) return 'tam-hop';
    if (i === quanHe.xungChieu) return 'xung-chieu';
    return 'mo';
  };

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

  const nenTieuHan = theme === 'toi' ? 'rgba(255,204,17,0.14)' : 'rgba(255,204,17,0.22)';
  const nenMenh = theme === 'toi' ? 'rgba(255,189,211,0.08)' : 'rgba(255,189,211,0.18)';

  const mauDoSang = (d?: string | null) =>
    d === 'M' || d === 'V' ? mau.tot : d === 'H' ? mau.xau : d === 'B' ? mau.chuNhat : mau.chuMo;

  const mauSao = (s: Sao) =>
    s.loai === 'vong-sao'
      ? s.tinhChat === 'hung'
        ? 'rgba(239,68,68,0.65)'
        : mau.chuNhat
      : s.tinhChat === 'hung'
        ? mau.xau
        : PHU_TINH_TRONG_YEU.has(s.ten)
          ? mau.chu
          : mau.chuMo;

  const cungChon = chon === null ? null : o[chon];

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }}>
      <View style={{ paddingTop: le.top + KHOANG.x2, paddingHorizontal: LE_NGANG, gap: KHOANG.x2 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.chung.quayLai}
          hitSlop={8}
          style={{ width: CHAM_TOI_THIEU, height: CHAM_TOI_THIEU, justifyContent: 'center', marginLeft: -KHOANG.x3 }}
        >
          <IconQuayLai size={22} mau={mau.chu} />
        </Pressable>
        <View>
          <Chu kieu="h2">{t.banDo.tieuDe}</Chu>
          <Chu kieu="caption" mo>
            {t.banDo.phu}
          </Chu>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: KHOANG.x4, paddingBottom: KHOANG.x12, gap: KHOANG.x4 }}>
        {/* --- Năm xem và lớp sao lưu --- */}
        <View
          style={{
            paddingHorizontal: LE_NGANG,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            rowGap: KHOANG.x2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: KHOANG.x2 }}>
            <Chu kieu="caption" mo>
              {t.banDo.namXem}
            </Chu>
            <NutNam nhan="‹" moTa={t.banDo.namTruoc} onPress={() => setNamXem((n) => n - 1)} />
            <View style={{ alignItems: 'center', minWidth: 64 }}>
              <Chu kieu="bodySm" style={{ fontFamily: FONT.thanDam }}>
                {String(namXem)}
              </Chu>
              <Chu kieu="caption" mo>
                {canChiCuaNam(namXem)}
              </Chu>
            </View>
            <NutNam nhan="›" moTa={t.banDo.namSau} onPress={() => setNamXem((n) => n + 1)} />
          </View>
          <Pill nhan={t.banDo.luuTinh} dangChon={hienLuu} onPress={() => setHienLuu((v) => !v)} />
        </View>

        {/* --- Mệnh bàn --- */}
        <View style={{ width: oRong * 4, height: caoLuoi, alignSelf: 'center' }}>
          {o.map((d) => {
            const c = d.cung;
            const vt = VI_TRI[c.chiIndex];
            const tt = trangThai(c.chiIndex);
            const laTieuHan = c.chiIndex === iTieuHan;
            const vien =
              tt === 'chon'
                ? mau.chu
                : tt === 'tam-hop'
                  ? mau.tot
                  : tt === 'xung-chieu'
                    ? mau.chuMo
                    : c.laCungMenh
                      ? mau.chuMo
                      : mau.vien;
            return (
              <Pressable
                key={c.chiIndex}
                onPress={() => setChon((cu) => (cu === c.chiIndex ? null : c.chiIndex))}
                accessibilityRole="button"
                accessibilityLabel={`${c.tenCung} ${c.chi}`}
                accessibilityState={{ selected: tt === 'chon' }}
                style={{
                  position: 'absolute',
                  left: vt.cot * oRong,
                  top: dinhHang[vt.hang],
                  width: oRong,
                  height: caoHang[vt.hang],
                  padding: DEM_O,
                  paddingTop: DEM_O + 2,
                  borderWidth: tt === 'thuong' || tt === 'mo' ? (c.laCungMenh ? 1 : 0.5) : 1.5,
                  borderColor: vien,
                  backgroundColor: laTieuHan ? nenTieuHan : c.laCungMenh ? nenMenh : mau.the,
                  opacity: tt === 'mo' ? 0.3 : 1,
                  zIndex: tt === 'thuong' || tt === 'mo' ? 0 : 1,
                }}
              >
                {/* Vạch ngũ hành của địa chi cung */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: MAU_NGU_HANH[NGU_HANH_CHI[c.chiIndex]],
                  }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Nho co={PHU} mau={mau.chuMo}>
                    {c.can.slice(0, 1)}.{c.chi}
                  </Nho>
                  {c.daiVan && (
                    <Nho co={PHU} mau={c.chiIndex === iDaiVan ? mau.tot : mau.chuMo} dam={c.chiIndex === iDaiVan}>
                      {c.daiVan.tuTuoi}
                    </Nho>
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                  <Nho co={TEN_CUNG} mau={mau.chu} dam vua>
                    {c.tenCung}
                  </Nho>
                  {c.laCungThan && (
                    <View style={{ borderWidth: 0.5, borderColor: mau.tot, borderRadius: 999, paddingHorizontal: 2 }}>
                      <Nho co={{ fontSize: 6.5, lineHeight: 8.5 }} mau={mau.tot} dam>
                        {t.banDo.than.toUpperCase()}
                      </Nho>
                    </View>
                  )}
                </View>

                {/* Không `alignItems: center`: chữ phải giãn đủ bề ngang ô thì mới tự co được */}
                <View style={{ marginTop: 3 }}>
                  {d.chinhTinh.length ? (
                    d.chinhTinh.map((s) => (
                      <Nho key={s.ten} co={CHINH} mau={mau.chu} dam vua canh="center">
                        {s.ten}
                        {s.doSang ? <Text style={{ color: mauDoSang(s.doSang), fontSize: 8 }}> ({s.doSang})</Text> : null}
                      </Nho>
                    ))
                  ) : (
                    <Nho co={CHINH} mau={mau.chuNhat} nghieng vua canh="center">
                      {t.banDo.voChinhDieu}
                    </Nho>
                  )}
                </View>

                {d.tuHoa.length > 0 && (
                  <View style={{ marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                    {d.tuHoa.map((s) => {
                      const m = MAU_TU_HOA[s.ten] ?? mau.chuMo;
                      return (
                        <View
                          key={s.ten}
                          style={{ borderRadius: 999, backgroundColor: m, paddingHorizontal: 4, paddingVertical: 1 }}
                        >
                          <Nho co={{ fontSize: 7, lineHeight: 9 }} mau="#FFFFFF" dam>
                            {s.ten.replace('Hóa ', '')}
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
                      <Nho key={s.ten} co={SAO} mau={s.tinhChat === 'hung' ? mau.xau : mau.tot} nghieng>
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
                  <View style={{ flex: 1 }}>
                    {laTieuHan && (
                      <Nho co={PHU} mau={mau.tot} dam vua>
                        {t.banDo.tieuHan}
                      </Nho>
                    )}
                  </View>
                  <Nho co={PHU} mau={mau.chuMo} vua>
                    {c.trangSinh}
                  </Nho>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    {c.chiIndex === iNguyetHan && (
                      <Nho co={PHU} mau={mau.chuMo} dam>
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

        {/* --- Chú giải --- */}
        <View style={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4, rowGap: KHOANG.x1 }}>
            <ChuGiai mauCham={mau.tot} nhan={t.banDo.chuThichCat} />
            <ChuGiai mauCham={mau.xau} nhan={t.banDo.chuThichHung} />
            <ChuGiai mauCham={nenTieuHan} vien={mau.vien} nhan={t.banDo.chuThichHan} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4, rowGap: KHOANG.x1 }}>
            <Chu kieu="caption" nhat>
              {t.banDo.nguHanhCung}:
            </Chu>
            {NGU_HANH.map((h) => (
              <ChuGiai key={h} mauCham={MAU_NGU_HANH[h]} nhan={h} />
            ))}
          </View>
          {!cungChon && (
            <Chu kieu="caption" mo>
              {t.banDo.goiY}
            </Chu>
          )}
        </View>

        {/* --- Chi tiết cung đang chọn — cỡ chữ thật --- */}
        {cungChon && quanHe && (
          <View style={{ paddingHorizontal: LE_NGANG }}>
            <The style={{ gap: KHOANG.x4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Eyebrow>{`${cungChon.cung.can} ${cungChon.cung.chi} · ${NGU_HANH_CHI[cungChon.cung.chiIndex]}`}</Eyebrow>
                  <Chu kieu="h3">
                    {cungChon.cung.tenCung}
                    {cungChon.cung.laCungMenh ? ` · ${t.banDo.menh}` : ''}
                    {cungChon.cung.laCungThan ? ` · ${t.banDo.than}` : ''}
                  </Chu>
                </View>
                {cungChon.cung.daiVan && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Chu kieu="caption" mo>
                      {t.banDo.daiVan}
                    </Chu>
                    <Chu kieu="bodySm" style={{ color: cungChon.cung.chiIndex === iDaiVan ? mau.tot : mau.chu }}>
                      {cungChon.cung.daiVan.tuTuoi}–{cungChon.cung.daiVan.denTuoi}
                    </Chu>
                  </View>
                )}
              </View>

              <NhomSao tieuDe={t.banDo.nhomChinhTinh}>
                {cungChon.chinhTinh.length ? (
                  cungChon.chinhTinh.map((s) => (
                    <The0 key={s.ten} nhan={s.ten} phu={s.doSang} mauPhu={mauDoSang(s.doSang)} mau={mau.chu} dam />
                  ))
                ) : (
                  <Chu kieu="bodySm" mo>
                    {t.banDo.voChinhDieu}
                  </Chu>
                )}
              </NhomSao>

              {cungChon.tuHoa.length > 0 && (
                <NhomSao tieuDe={t.banDo.nhomTuHoa}>
                  {cungChon.tuHoa.map((s) => (
                    <The0 key={s.ten} nhan={s.ten} mau={MAU_TU_HOA[s.ten] ?? mau.chu} dam />
                  ))}
                </NhomSao>
              )}

              {[
                { tieuDe: t.banDo.nhomCat, ds: cungChon.cot1.filter((s) => s.loai === 'phu-tinh') },
                { tieuDe: t.banDo.nhomHung, ds: cungChon.cot2.filter((s) => s.loai === 'phu-tinh') },
                {
                  tieuDe: t.banDo.nhomVong,
                  ds: [...cungChon.cot1, ...cungChon.cot2].filter((s) => s.loai === 'vong-sao'),
                },
              ]
                .filter((n) => n.ds.length > 0)
                .map((n) => (
                  <NhomSao key={n.tieuDe} tieuDe={n.tieuDe}>
                    {n.ds.map((s) => (
                      <The0
                        key={s.ten}
                        nhan={s.ten}
                        phu={s.doSang}
                        mauPhu={mauDoSang(s.doSang)}
                        mau={s.tinhChat === 'hung' ? mau.xau : mau.chu}
                        dam={PHU_TINH_TRONG_YEU.has(s.ten)}
                      />
                    ))}
                  </NhomSao>
                ))}

              {cungChon.luu.length > 0 && (
                <NhomSao tieuDe={`${t.banDo.nhomLuu} ${namXem}`}>
                  {cungChon.luu.map((s) => (
                    <The0 key={s.ten} nhan={s.ten} mau={s.tinhChat === 'hung' ? mau.xau : mau.tot} />
                  ))}
                </NhomSao>
              )}

              <View style={{ gap: KHOANG.x1 }}>
                <DongTT nhan={t.banDo.trangSinh} giaTri={cungChon.cung.trangSinh} />
                {cungChon.cung.chiIndex === iTieuHan && <DongTT nhan={t.banDo.tieuHan} giaTri={String(namXem)} />}
                {cungChon.cung.chiIndex === iNguyetHan && (
                  <DongTT nhan={t.banDo.nguyetHan} giaTri={`T.${thangXem} · ${namXem}`} />
                )}
                {(cungChon.cung.coTuan || cungChon.cung.coTriet) && (
                  <DongTT
                    nhan={[cungChon.cung.coTuan && t.banDo.tuan, cungChon.cung.coTriet && t.banDo.triet]
                      .filter(Boolean)
                      .join(' · ')}
                    giaTri={[cungChon.cung.coTuan && t.banDo.tuanKhong, cungChon.cung.coTriet && t.banDo.trietKhong]
                      .filter(Boolean)
                      .join(' · ')}
                    mauGiaTri={mau.xau}
                  />
                )}
                <DongTT
                  nhan={t.banDo.tamHop}
                  giaTri={quanHe.tamHop.map((i) => laSo.cungs[i].tenCung).join(' · ')}
                  mauGiaTri={mau.tot}
                />
                <DongTT nhan={t.banDo.xungChieu} giaTri={laSo.cungs[quanHe.xungChieu].tenCung} />
              </View>

              <NutPhu nhan={t.chung.dong} onPress={() => setChon(null)} />
            </The>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------- Phần phụ */

function NutNam({ nhan, moTa, onPress }: { nhan: string; moTa: string; onPress: () => void }) {
  const { mau } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={moTa}
      style={({ pressed }) => ({
        width: CHAM_TOI_THIEU,
        height: CHAM_TOI_THIEU,
        borderRadius: BO_GOC.vien,
        borderWidth: 1,
        borderColor: mau.vien,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontSize: 20, lineHeight: 22, color: mau.chu }}>{nhan}</Text>
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

function NhomSao({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <View style={{ gap: KHOANG.x2 }}>
      <Eyebrow>{tieuDe}</Eyebrow>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: KHOANG.x2 }}>{children}</View>
    </View>
  );
}

/** Một sao trong thẻ chi tiết — viền mảnh, không phải pill lựa chọn */
function The0({
  nhan,
  phu,
  mau: mauChu,
  mauPhu,
  dam,
}: {
  nhan: string;
  phu?: string | null;
  mau: string;
  mauPhu?: string;
  dam?: boolean;
}) {
  const { mau } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        borderWidth: 1,
        borderColor: mau.vien,
        borderRadius: BO_GOC.oNhap,
        paddingHorizontal: KHOANG.x2,
        paddingVertical: KHOANG.x1,
      }}
    >
      <Text style={{ fontSize: 14, lineHeight: 20, color: mauChu, fontFamily: dam ? FONT.thanDam : FONT.than }}>
        {nhan}
      </Text>
      {phu ? (
        <Text style={{ fontSize: 12, lineHeight: 17, color: mauPhu ?? mau.chuMo, fontFamily: FONT.thanVua }}>{phu}</Text>
      ) : null}
    </View>
  );
}

function DongTT({ nhan, giaTri, mauGiaTri }: { nhan: string; giaTri: string; mauGiaTri?: string }) {
  const { mau } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: KHOANG.x3 }}>
      <Chu kieu="bodySm" mo>
        {nhan}
      </Chu>
      <Chu kieu="bodySm" style={{ color: mauGiaTri ?? mau.chu, flexShrink: 1, textAlign: 'right' }}>
        {giaTri}
      </Chu>
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
  const { mau } = useTheme();
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
        left: left + 3,
        top: top + 3,
        width: width - 6,
        height: height - 6,
        borderRadius: 10,
        backgroundColor: mau.theAm,
        borderWidth: 0.5,
        borderColor: mau.vien,
        paddingHorizontal: 7,
        paddingVertical: 6,
        justifyContent: 'center',
        gap: 5,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Nho co={{ fontSize: 13, lineHeight: 16 }} mau={mau.chu} dam vua canh="center">
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
  const { mau } = useTheme();

  const cap = (loc: (c: Cung) => boolean) => laSo.cungs.filter(loc).map((c) => c.chiIndex);
  const dau = [
    { loai: 'tuan' as const, cungs: cap((c) => c.coTuan), nhan: t.banDo.tuan, mau: mau.chuMo },
    { loai: 'triet' as const, cungs: cap((c) => c.coTriet), nhan: t.banDo.triet, mau: mau.xau },
  ].filter((d) => d.cungs.length === 2);

  const trungCap = dau.length === 2 && dau[0].cungs.join() === dau[1].cungs.join();

  return (
    <>
      {dau.map((d, i) => {
        const [a, b] = d.cungs.map((x) => VI_TRI[x]);
        const cungHang = a.hang === b.hang;
        // Hai dấu rơi đúng một cặp cung thì tách nhau ra dọc theo đường biên
        const lech = trungCap ? (i === 0 ? -16 : 16) : 0;
        const kichThuoc = cungHang ? { w: 12, h: d.nhan.length * 8 + 6 } : { w: d.nhan.length * 5 + 10, h: 12 };
        const tamX = cungHang ? Math.max(a.cot, b.cot) * oRong : a.cot * oRong + oRong / 2 + lech;
        const tamY = cungHang
          ? dinhHang[a.hang] + caoHang[a.hang] / 2 + lech
          : dinhHang[Math.max(a.hang, b.hang)];
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
              borderColor: d.mau,
              backgroundColor: mau.nen,
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
                  <Text
                    key={j}
                    allowFontScaling={false}
                    style={{ fontSize: 7, lineHeight: 8, color: d.mau, fontFamily: FONT.thanDam }}
                  >
                    {k}
                  </Text>
                ))
            ) : (
              <Text allowFontScaling={false} style={{ fontSize: 7, lineHeight: 9, color: d.mau, fontFamily: FONT.thanDam }}>
                {d.nhan.toUpperCase()}
              </Text>
            )}
          </View>
        );
      })}
    </>
  );
}
