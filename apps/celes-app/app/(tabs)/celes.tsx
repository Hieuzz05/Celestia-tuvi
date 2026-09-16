import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chu, Eyebrow, ONhap, Pill, The } from '@/giao-dien/co-ban';
import { IconCeles, IconGui, MAU_LINH_VUC } from '@/giao-dien/icon';
import { LienKetViSao } from '@/giao-dien/vi-sao';
import { hoiCeles, type TinNhanGui } from '@/du-lieu/api';
import { useHoSo } from '@/du-lieu/ho-so';
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
 */

interface TinNhan extends TinNhanGui {
  id: string;
  loi?: boolean;
}

export default function ManCeles() {
  const t = useT();
  const mau = useMau();
  const le = useSafeAreaInsets();
  const { hoSo } = useHoSo();

  const [tin, setTin] = useState<TinNhan[]>([]);
  const [nhap, setNhap] = useState('');
  const [dangCho, setDangCho] = useState(false);
  const danhSach = useRef<FlatList<TinNhan>>(null);

  useEffect(() => {
    ghiSuKien('celes_opened');
  }, []);

  const gui = async (noiDung: string) => {
    const cau = noiDung.trim();
    if (!cau || !hoSo || dangCho) return;

    const cuaToi: TinNhan = { id: `u${Date.now()}`, vaiTro: 'nguoi-dung', noiDung: cau };
    const truoc = tin;
    setTin([...truoc, cuaToi]);
    setNhap('');
    setDangCho(true);
    ghiSuKien('celes_message_sent');

    try {
      const traLoi = await hoiCeles(
        hoSo,
        cau,
        truoc.map(({ vaiTro, noiDung }) => ({ vaiTro, noiDung }))
      );
      setTin((x) => [...x, { id: `c${Date.now()}`, vaiTro: 'tro-ly', noiDung: traLoi }]);
      ghiSuKien('celes_response_received');
    } catch {
      setTin((x) => [
        ...x,
        { id: `e${Date.now()}`, vaiTro: 'tro-ly', noiDung: t.trangThai.loi, loi: true },
      ]);
    } finally {
      setDangCho(false);
      setTimeout(() => danhSach.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const rong = tin.length === 0;

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
              <The am style={{ gap: KHOANG.x3 }}>
                <Eyebrow mauChu={MAU_LINH_VUC.celes}>{t.celes.tieuDe}</Eyebrow>
                <Chu kieu="body" style={item.loi ? { color: mau.xau } : undefined}>
                  {item.noiDung}
                </Chu>
                {!item.loi && <LienKetViSao onPress={() => {}} />}
              </The>
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
          style={{ flex: 1, maxHeight: 120, paddingTop: KHOANG.x3 }}
          accessibilityLabel={t.celes.oNhap}
        />
        <Pressable
          onPress={() => gui(nhap)}
          disabled={!nhap.trim() || dangCho}
          accessibilityRole="button"
          accessibilityLabel={t.celes.oNhap}
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
