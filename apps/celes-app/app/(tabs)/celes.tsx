import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Chu, Eyebrow, NutChinh, NutChu, ONhap, Pill, The } from '@/giao-dien/co-ban';
import { IconCeles, IconGui, MAU_LINH_VUC } from '@/giao-dien/icon';
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
import { useMau } from '@/thiet-ke/theme';
import { BO_GOC, CHAM_TOI_THIEU, KHOANG, LE_NGANG } from '@/thiet-ke/token';

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
  const le = useSafeAreaInsets();
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

  useEffect(() => {
    ghiSuKien('celes_opened');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1, backgroundColor: mau.nen }}
    >
      {/* Đầu màn: tên và trạng thái, kèm bản đồ đang dùng làm bối cảnh */}
      <View
        style={{
          paddingTop: le.top + KHOANG.x3,
          paddingHorizontal: LE_NGANG,
          paddingBottom: KHOANG.x3,
          borderBottomWidth: 1,
          borderColor: mau.vien,
          flexDirection: 'row',
          alignItems: 'center',
          gap: KHOANG.x3,
        }}
      >
        <IconCeles size={28} mau={MAU_LINH_VUC.celes} />
        <View style={{ flex: 1 }}>
          <Chu kieu="h3">{t.celes.tieuDe}</Chu>
          <Chu kieu="caption" mo>
            {hoSo ? dien(t.celes.dangDungBanDo, { ten: hoSo.ten }) : t.celes.phu}
          </Chu>
        </View>
        {!rong && !dangCho && <NutChu nhan={t.celes.xoaNut} mauChu={mau.chuMo} onPress={xoa} />}
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
          <Chu kieu="h2">{t.celes.rongTieuDe}</Chu>
          <View style={{ gap: KHOANG.x2 }}>
            {t.celes.goiY.map((g) => (
              <Pill key={g} nhan={g} onPress={() => gui(g)} style={{ alignSelf: 'flex-start' }} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          ref={danhSach}
          data={tin}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: LE_NGANG, gap: KHOANG.x4 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => danhSach.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) =>
            item.vaiTro === 'nguoi-dung' ? (
              <View
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  backgroundColor: mau.bongNguoiDung,
                  borderRadius: BO_GOC.the,
                  paddingHorizontal: KHOANG.x4,
                  paddingVertical: KHOANG.x3,
                }}
              >
                <Chu kieu="body" style={{ color: mau.chuBongNguoiDung }}>
                  {item.noiDung}
                </Chu>
              </View>
            ) : (
              <View style={{ gap: KHOANG.x3 }}>
                <The am style={{ gap: KHOANG.x3 }}>
                  <Eyebrow mauChu={MAU_LINH_VUC.celes}>{t.celes.tieuDe}</Eyebrow>
                  {item.loi ? (
                    <Chu kieu="body" style={{ color: mau.xau }}>
                      {item.noiDung}
                    </Chu>
                  ) : (
                    <Markdown noiDung={item.noiDung} />
                  )}
                </The>

                {item === cuoi && !dangCho && !!item.goiYTiep?.length && (
                  <View style={{ gap: KHOANG.x2 }}>
                    {item.goiYTiep.map((g) => (
                      <Pill
                        key={g}
                        nhan={g}
                        onPress={() => gui(g, true)}
                        style={{ alignSelf: 'flex-start' }}
                      />
                    ))}
                  </View>
                )}

                {item === cuoi && !dangCho && <LoiDiTiep ds={item.loiDi} />}
              </View>
            )
          }
          ListFooterComponent={
            dangCho ? (
              <Chu kieu="bodySm" mo>
                {t.celes.dangNghi}
              </Chu>
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: KHOANG.x2,
          paddingHorizontal: LE_NGANG,
          paddingTop: KHOANG.x2,
          paddingBottom: KHOANG.x2,
          borderTopWidth: 1,
          borderColor: mau.vien,
        }}
      >
        <ONhap
          value={nhap}
          onChangeText={setNhap}
          placeholder={t.celes.oNhap}
          multiline
          maxLength={800}
          style={{ flex: 1, maxHeight: 120, paddingTop: KHOANG.x3 }}
          accessibilityLabel={t.celes.oNhap}
        />
        <Pressable
          onPress={() => gui(nhap)}
          disabled={!nhap.trim() || dangCho}
          accessibilityRole="button"
          accessibilityLabel={t.celes.guiNhan}
          style={{
            width: CHAM_TOI_THIEU + 4,
            height: CHAM_TOI_THIEU + 4,
            borderRadius: BO_GOC.vien,
            backgroundColor: mau.hanhDong,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !nhap.trim() || dangCho ? 0.4 : 1,
          }}
        >
          <IconGui size={22} mau={mau.chuTrenHanhDong} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/** "Rời khỏi đây" — nhẹ hơn chip một bậc. Lối nào app chưa có màn thì ẩn. */
function LoiDiTiep({ ds }: { ds?: LoiDi[] }) {
  const router = useRouter();
  const loi = (ds ?? [])
    .map((l) => ({ nhan: l.nhan, tuyen: tuyenApp(l.duong) }))
    .filter((l) => l.tuyen);
  if (!loi.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: KHOANG.x4 }}>
      {loi.map((l) => (
        <NutChu key={l.nhan} nhan={l.nhan} onPress={() => router.push(l.tuyen!)} />
      ))}
    </View>
  );
}
