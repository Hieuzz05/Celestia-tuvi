import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BeMatKinh,
  Chu,
  Giong,
  NenVung,
  NutChinh,
  NutChu,
  NutIcon,
  OrbCeles,
  The,
  useDemDayTab,
} from '@/giao-dien/co-ban';
import { Icon } from '@/giao-dien/icon-aurora';
import { Markdown } from '@/giao-dien/markdown';
import {
  hoiCeles,
  LoiCanDangNhap,
  LoiHetLuot,
  type LoiDi,
  type TinNhanGui,
} from '@/du-lieu/api';
import { bamLaSo, docHoiThoai, luuLuot, xoaHoiThoai } from '@/du-lieu/hoi-thoai';
import { useHoSo } from '@/du-lieu/ho-so';
import { useTaiKhoan } from '@/du-lieu/tai-khoan';
import { tuyenApp } from '@/du-lieu/tuyen-web';
import { ghiSuKien } from '@/du-lieu/su-kien';
import { dien, useT } from '@/i18n/context';
import { useMau, useTheme, useVung } from '@/thiet-ke/theme';
import {
  BO_GOC,
  CHAM_TOI_THIEU,
  FONT,
  GRADIENT_NUT,
  GRADIENT_NUT_DIEM,
  KHOANG,
  LE_NGANG,
} from '@/thiet-ke/token';

/**
 * Celes — tính năng chữ ký.
 *
 * Không gọi là chatbot, không hiện tên model, không hiện trạng thái kỹ thuật.
 * Lúc chờ thì nói "Celes đang nhìn lại những điều liên quan…" chứ không phải
 * "đang gọi AI"; lúc lỗi thì nói Celes chưa hoàn thành được, không phải mã lỗi.
 *
 * Hỏi Celes cần tài khoản (máy chủ chặn bằng `canDangNhap`). Chưa đăng nhập thì
 * KHÔNG gửi và KHÔNG xoá câu đang gõ — hiện thẻ mời đăng nhập, xong quay lại
 * đúng màn này bấm gửi tiếp. Hết lượt hôm nay (402) cũng vậy: câu về lại ô nhập.
 *
 * Trí nhớ: hội thoại cất theo lá số trong `chat_messages`, chung với web — hỏi
 * trên web rồi mở app vẫn thấy mạch cũ. Chip gợi ý và lối đi tiếp chỉ hiện dưới
 * lượt CUỐI của Celes, như web: hiện dưới mọi lượt là một rừng chip hết thời sự.
 *
 * `?q=` (vd. từ "Hỏi về điều này" ở Hôm nay) chỉ ĐIỀN SẴN ô nhập, không tự gửi:
 * mỗi lần gửi là một lượt trong hạn mức, người dùng phải là người bấm.
 */

interface TinNhan extends TinNhanGui {
  id: string;
  loi?: boolean;
  goiYTiep?: string[];
  loiDi?: LoiDi[];
}

type ThongBao = { loai: 'dang-nhap' } | { loai: 'het-luot'; gioiHan?: number };

export default function ManCeles() {
  const t = useT();
  const mau = useMau();
  const { theme } = useTheme();
  const v = useVung('celes');
  const le = useSafeAreaInsets();
  const demDay = useDemDayTab();
  const { hoSo } = useHoSo();
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { coTaiKhoan, phien } = useTaiKhoan();

  const [tin, setTin] = useState<TinNhan[]>([]);
  const [thongBao, setThongBao] = useState<ThongBao | null>(null);
  // Có phiên rồi thì thôi mời đăng nhập — không cần effect để tắt cờ
  const theHien = thongBao?.loai === 'dang-nhap' && phien ? null : thongBao;
  const [nhap, setNhap] = useState('');
  const [dangCho, setDangCho] = useState(false);
  const [khoa, setKhoa] = useState<string | null>(null);
  const danhSach = useRef<FlatList<TinNhan>>(null);
  const userId = phien?.user.id;
  // iOS: bàn phím che luôn thanh tab nổi, nên lúc bàn phím mở ô nhập bỏ khoảng
  // chừa cho thanh tab (Android co cửa sổ lại, thanh tab vẫn nằm trên bàn phím).
  const [banPhimMo, setBanPhimMo] = useState(false);

  useEffect(() => {
    ghiSuKien('celes_opened');
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const mo = Keyboard.addListener('keyboardWillShow', () => setBanPhimMo(true));
    const dong = Keyboard.addListener('keyboardWillHide', () => setBanPhimMo(false));
    return () => {
      mo.remove();
      dong.remove();
    };
  }, []);

  useEffect(() => {
    if (q) setNhap(q);
  }, [q]);

  /*
   * Băm lá số đang dùng rồi đọc lại mạch cũ của CHÍNH lá số đó.
   * `huy` chặn lượt đọc về muộn của lá số trước đè lên lá số vừa đổi.
   * Chạy lại khi đăng nhập xong (userId đổi) để mạch cũ hiện ra ngay.
   */
  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    bamLaSo(hoSo).then(async (k) => {
      if (huy) return;
      setKhoa(k);
      if (!userId) return;
      const cu = await docHoiThoai(k);
      if (huy || cu.length === 0) return;
      // Chỉ nạp khi màn còn trống — vừa nhận câu trả lời mà mạch cũ đổ đè là mất
      setTin((ds) =>
        ds.length ? ds : cu.map((l, i) => ({ id: `h${i}`, vaiTro: l.vaiTro, noiDung: l.noiDung }))
      );
    });
    return () => {
      huy = true;
    };
  }, [hoSo, userId]);

  const gui = async (noiDung: string, tuChip = false) => {
    const cau = noiDung.trim();
    if (!cau || !hoSo || dangCho) return;

    if (coTaiKhoan && !phien) {
      setNhap(cau);
      setThongBao({ loai: 'dang-nhap' });
      return;
    }

    const cuaToi: TinNhan = { id: `u${Date.now()}`, vaiTro: 'nguoi-dung', noiDung: cau };
    // Bong lỗi không phải lời Celes đã nói — không gửi nó lên làm lịch sử
    const truoc = tin.filter((m) => !m.loi);
    setTin([...tin, cuaToi]);
    setNhap('');
    setThongBao(null);
    setDangCho(true);
    ghiSuKien('celes_message_sent');

    try {
      const kq = await hoiCeles(
        hoSo,
        cau,
        truoc.map(({ vaiTro, noiDung }) => ({ vaiTro, noiDung })),
        tuChip
      );
      setTin((x) => [
        ...x,
        {
          id: `c${Date.now()}`,
          vaiTro: 'tro-ly',
          noiDung: kq.traLoi,
          goiYTiep: kq.goiYTiep,
          loiDi: kq.loiDi,
        },
      ]);
      ghiSuKien('celes_response_received');
      // Cất CẢ CẶP sau khi có câu trả lời; không chờ — cất hỏng không làm chậm màn
      if (khoa) void luuLuot(khoa, cau, kq.traLoi, kq.model);
    } catch (e) {
      // Phiên hết hạn giữa chừng, hoặc hết lượt hôm nay: rút câu vừa gửi về ô nhập.
      // Còn phiên mà máy chủ vẫn đòi đăng nhập thì mời nữa chỉ thành vòng lặp — báo lỗi chung.
      const moiDangNhap = e instanceof LoiCanDangNhap && coTaiKhoan && !phien;
      if (moiDangNhap || e instanceof LoiHetLuot) {
        setTin((x) => x.filter((m) => m.id !== cuaToi.id));
        setNhap(cau);
        setThongBao(
          e instanceof LoiHetLuot ? { loai: 'het-luot', gioiHan: e.gioiHan } : { loai: 'dang-nhap' }
        );
        return;
      }
      setTin((x) => [
        ...x,
        { id: `e${Date.now()}`, vaiTro: 'tro-ly', noiDung: t.trangThai.loi, loi: true },
      ]);
    } finally {
      setDangCho(false);
      setTimeout(() => danhSach.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  // Xoá THẬT trên máy chủ, nên hỏi lại một lần — người dùng có thể đã kể nhiều chuyện riêng
  const xoa = () => {
    Alert.alert(t.celes.xoaTieuDe, t.celes.xoaMoTa, [
      { text: t.chung.huy, style: 'cancel' },
      {
        text: t.celes.xoaNut,
        style: 'destructive',
        onPress: () => {
          setTin([]);
          setThongBao(null);
          if (khoa) void xoaHoiThoai(khoa);
        },
      },
    ]);
  };

  const rong = tin.length === 0;
  const cuoi = tin[tin.length - 1];
  const toi = theme === 'toi';
  // Chip gợi ý tiếp chỉ hiện dưới lượt CUỐI của Celes — nằm ngay trên ô nhập như bản thiết kế
  const goiYCuoi =
    !dangCho && cuoi?.vaiTro === 'tro-ly' && !cuoi.loi && cuoi.goiYTiep?.length ? cuoi.goiYTiep : [];
  const coTheGui = !!nhap.trim() && !dangCho;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: mau.nen }}
    >
      <NenVung vung="celes" />

      {/* Đầu màn: quả cầu, tên, bản đồ đang dùng làm bối cảnh */}
      <View
        style={{
          paddingTop: le.top + KHOANG.x3,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x3,
          flexDirection: 'row',
          alignItems: 'center',
          gap: KHOANG.x3,
        }}
      >
        <OrbCeles size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{ fontFamily: FONT.display, fontSize: 24, lineHeight: 26, letterSpacing: -0.7, color: mau.chu }}
          >
            {t.celes.tieuDe}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: '#4ADE80',
                shadowColor: '#4ADE80',
                shadowOpacity: 0.9,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
            <Chu kieu="caption" mo numberOfLines={1} style={{ flexShrink: 1, fontSize: 13 }}>
              {hoSo ? dien(t.celes.dangDungBanDo, { ten: hoSo.ten }) : t.celes.phu}
            </Chu>
          </View>
        </View>
        {!rong && !dangCho && <NutIcon ten="trash" nhan={t.celes.xoaNut} onPress={xoa} />}
      </View>

      {rong ? (
        <ScrollView
          contentContainerStyle={{
            padding: LE_NGANG,
            gap: KHOANG.x4,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Giong co={24} style={{ lineHeight: 30 }}>
            {t.celes.rongTieuDe}
          </Giong>
          <View style={{ gap: KHOANG.x2 }}>
            {t.celes.goiY.map((g) => (
              <ChipGoiY key={g} nhan={g} onPress={() => gui(g)} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={danhSach}
          data={tin}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: LE_NGANG, paddingVertical: KHOANG.x2, gap: KHOANG.x4 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => danhSach.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) =>
            item.vaiTro === 'nguoi-dung' ? (
              <LinearGradient
                colors={[...GRADIENT_NUT]}
                locations={[0, 0.6, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '82%',
                  borderTopLeftRadius: 22,
                  borderTopRightRadius: 22,
                  borderBottomLeftRadius: 22,
                  borderBottomRightRadius: 6,
                  paddingHorizontal: KHOANG.x4,
                  paddingVertical: KHOANG.x3,
                }}
              >
                <Text style={{ fontFamily: FONT.than, fontSize: 15, lineHeight: 22, color: mau.chuBongNguoiDung }}>
                  {item.noiDung}
                </Text>
              </LinearGradient>
            ) : (
              <View style={{ gap: KHOANG.x2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <OrbCeles size={28} tho={false} sang={false} />
                  <BeMatKinh
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 22,
                      borderBottomLeftRadius: 22,
                      borderBottomRightRadius: 22,
                      paddingHorizontal: KHOANG.x4,
                      paddingVertical: 14,
                    }}
                  >
                    {item.loi ? (
                      <Chu kieu="body" style={{ color: mau.xau }}>
                        {item.noiDung}
                      </Chu>
                    ) : (
                      <Markdown noiDung={item.noiDung} giong />
                    )}
                  </BeMatKinh>
                </View>

                {item === cuoi && !dangCho && (
                  <View style={{ paddingLeft: 38 }}>
                    <LoiDiTiep ds={item.loiDi} mauChu={v.mau} />
                  </View>
                )}
              </View>
            )
          }
          ListFooterComponent={
            dangCho ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: KHOANG.x4 }}>
                <OrbCeles size={28} sang={false} />
                <Chu kieu="bodySm" mo style={{ flex: 1 }}>
                  {t.celes.dangNghi}
                </Chu>
              </View>
            ) : null
          }
        />
      )}

      {theHien && (
        <View style={{ paddingHorizontal: LE_NGANG, paddingBottom: KHOANG.x3 }}>
          <The am style={{ gap: KHOANG.x3 }}>
            {theHien.loai === 'dang-nhap' ? (
              <>
                <Chu kieu="h3">{t.celes.canDangNhapTieuDe}</Chu>
                <Chu kieu="bodySm" mo>
                  {t.celes.canDangNhapMoTa}
                </Chu>
                <NutChinh
                  nhan={t.celes.canDangNhapNut}
                  onPress={() => router.push('/dang-nhap?sau=quay-lai')}
                />
              </>
            ) : (
              <>
                <Chu kieu="h3">
                  {theHien.gioiHan
                    ? dien(t.celes.hetLuotTieuDe, { so: String(theHien.gioiHan) })
                    : t.celes.hetLuotTieuDeChung}
                </Chu>
                <Chu kieu="bodySm" mo>
                  {t.celes.hetLuotMoTa}
                </Chu>
              </>
            )}
          </The>
        </View>
      )}

      {/* Đáy: chip gợi ý + ô nhập, đặt TRÊN thanh tab nổi (không bị orb giữa che) */}
      <View
        style={{
          gap: 10,
          paddingTop: KHOANG.x2,
          marginBottom: banPhimMo ? KHOANG.x2 : demDay + KHOANG.x2,
        }}
      >
        {goiYCuoi.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: LE_NGANG, gap: KHOANG.x2 }}
          >
            {goiYCuoi.map((g) => (
              <ChipGoiY key={g} nhan={g} onPress={() => gui(g, true)} />
            ))}
          </ScrollView>
        )}

        <View
          style={{
            marginHorizontal: LE_NGANG,
            minHeight: 54,
            borderRadius: 18,
            backgroundColor: toi ? 'rgba(20,18,24,0.94)' : mau.theNoi,
            borderWidth: 1,
            borderColor: `rgba(${v.rgb},0.30)`,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 4,
            paddingLeft: KHOANG.x4,
            paddingRight: 5,
            paddingVertical: 4,
          }}
        >
          <TextInput
            value={nhap}
            onChangeText={setNhap}
            placeholder={t.celes.oNhap}
            placeholderTextColor={mau.chuNhat}
            multiline
            maxLength={800}
            accessibilityLabel={t.celes.oNhap}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: CHAM_TOI_THIEU,
              maxHeight: 120,
              paddingTop: 12,
              paddingBottom: 10,
              fontFamily: FONT.than,
              fontSize: 16,
              color: mau.chu,
            }}
          />
          <Pressable
            onPress={() => gui(nhap)}
            disabled={!coTheGui}
            accessibilityRole="button"
            accessibilityLabel={t.celes.guiNhan}
            accessibilityState={{ disabled: !coTheGui }}
            style={({ pressed }) => ({ opacity: !coTheGui ? 0.4 : pressed ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={[...GRADIENT_NUT]}
              locations={[...GRADIENT_NUT_DIEM]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: CHAM_TOI_THIEU,
                height: CHAM_TOI_THIEU,
                borderRadius: BO_GOC.nut,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon ten="up" size={20} net={2.3} mau={mau.chuTrenHanhDong} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Chip gợi ý câu hỏi: viền và nền hồng vùng Celes, cao 40 (vùng chạm nới thêm bằng hitSlop) */
function ChipGoiY({ nhan, onPress }: { nhan: string; onPress: () => void }) {
  const v = useVung('celes');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BO_GOC.vien,
        borderWidth: 1,
        borderColor: `rgba(${v.rgb},0.35)`,
        backgroundColor: `rgba(${v.rgb},0.08)`,
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ fontFamily: FONT.thanVua, fontSize: 14, lineHeight: 19, color: v.sang }}>{nhan}</Text>
    </Pressable>
  );
}

/**
 * "Rời khỏi đây" — nhẹ hơn chip một bậc. Lối nào app chưa có màn thì ẩn.
 *
 * `tel:` XỬ LÝ RIÊNG, KHÔNG qua `tuyenApp`. `tuyenApp` ánh xạ đường dẫn web sang
 * màn trong app; số điện thoại không phải một màn nào cả nên nó rơi vào
 * `default: return null` và bị `.filter` loại — nút "Gọi 115" của lớp an toàn
 * (CEL-180) biến mất im lặng trên app, đúng nền tảng gọi điện được dễ nhất.
 */
function LoiDiTiep({ ds, mauChu }: { ds?: LoiDi[]; mauChu?: string }) {
  const router = useRouter();
  const loi = (ds ?? [])
    .map((l) => ({ nhan: l.nhan, duong: l.duong, tuyen: tuyenApp(l.duong) }))
    .filter((l) => l.tuyen || l.duong.startsWith('tel:'));
  if (!loi.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4 }}>
      {loi.map((l) => (
        <NutChu
          key={l.nhan}
          nhan={l.nhan}
          mauChu={mauChu}
          onPress={() => {
            // Máy không gọi điện được (máy tính bảng, giả lập) thì nuốt lỗi:
            // người đang khủng hoảng không cần thêm một hộp thoại lỗi.
            if (l.duong.startsWith('tel:')) void Linking.openURL(l.duong).catch(() => {});
            else router.push(l.tuyen!);
          }}
        />
      ))}
    </View>
  );
}
