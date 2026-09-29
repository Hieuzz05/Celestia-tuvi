import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Chu, NutChu, ONhap } from '@/giao-dien/co-ban';
import { KhungBuoc, useKieuONhapLon } from '@/giao-dien/khung-buoc';
import { useTaiKhoan, type LoiTaiKhoan } from '@/du-lieu/tai-khoan';
import { dien, useT } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { KHOANG } from '@/thiet-ke/token';

/**
 * Đăng nhập bằng mã gửi qua email — hai bước trên cùng một màn: email, rồi mã.
 *
 * `?sau=quay-lai`: mở từ giữa chừng (vd. Celes báo cần đăng nhập) thì xong là
 * quay về đúng chỗ cũ, câu hỏi đang gõ dở vẫn còn. Mặc định vào thẳng các tab.
 *
 * Chờ 60 giây mới cho xin mã mới: nhà cung cấp cũng chặn cùng nhịp đó, để nút
 * bấm được mà gửi không đi thì người dùng tưởng app hỏng.
 */

const CHO_GUI_LAI = 60;
const EMAIL_HOP_LE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ManDangNhap() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const v = useVung('khoiDau');
  const { sau } = useLocalSearchParams<{ sau?: string }>();
  const { guiMa, xacNhanMa } = useTaiKhoan();

  const [email, setEmail] = useState('');
  const [ma, setMa] = useState('');
  const [daGui, setDaGui] = useState(false);
  const [dangLam, setDangLam] = useState(false);
  const [loi, setLoi] = useState<LoiTaiKhoan | null>(null);
  const [conLai, setConLai] = useState(0);
  const kieuEmail = useKieuONhapLon(EMAIL_HOP_LE.test(email.trim()));
  const kieuMa = useKieuONhapLon(ma.length >= 6);

  useEffect(() => {
    if (conLai <= 0) return;
    const hen = setTimeout(() => setConLai((s) => s - 1), 1000);
    return () => clearTimeout(hen);
  }, [conLai]);

  const gui = async () => {
    if (dangLam) return;
    setDangLam(true);
    setLoi(null);
    const ketQua = await guiMa(email);
    setDangLam(false);
    if (ketQua) {
      setLoi(ketQua);
      return;
    }
    setDaGui(true);
    setMa('');
    setConLai(CHO_GUI_LAI);
  };

  const xacNhan = async () => {
    if (dangLam) return;
    setDangLam(true);
    setLoi(null);
    const ketQua = await xacNhanMa(email, ma);
    setDangLam(false);
    if (ketQua) {
      setLoi(ketQua);
      return;
    }
    if (sau === 'quay-lai' && router.canGoBack()) {
      router.back();
      return;
    }
    // Về điểm rẽ: nó chờ đồng bộ lá số xong rồi mới chọn Hôm nay hay onboarding —
    // máy mới đăng nhập trước thì nhận lá số từ tài khoản, khỏi nhập lại
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const dongLoi = loi && (
    <Chu kieu="bodySm" style={{ color: mau.xau }} accessibilityLiveRegion="polite">
      {t.dangNhap.loi[loi]}
    </Chu>
  );

  if (!daGui) {
    return (
      <KhungBuoc
        eyebrow={t.dangNhap.emailEyebrow}
        tieuDe={t.dangNhap.emailTieuDe}
        moTa={t.dangNhap.emailMoTa}
        nhanTiep={dangLam ? t.dangNhap.dangGui : t.dangNhap.guiMa}
        choPhepTiep={!dangLam && EMAIL_HOP_LE.test(email.trim())}
        onTiep={gui}
      >
        <View style={{ gap: KHOANG.x2 }}>
          <ONhap
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (loi) setLoi(null);
            }}
            placeholder={t.dangNhap.emailNhan}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={() => EMAIL_HOP_LE.test(email.trim()) && gui()}
            accessibilityLabel={t.dangNhap.emailTieuDe}
            // Email dài: giữ viền ấm và chiều cao ô lớn, nhưng chữ thân cỡ thường để không tràn
            style={{ minHeight: kieuEmail.minHeight, borderColor: kieuEmail.borderColor }}
          />
          {dongLoi}
        </View>
      </KhungBuoc>
    );
  }

  return (
    <KhungBuoc
      eyebrow={t.dangNhap.maEyebrow}
      tieuDe={t.dangNhap.maTieuDe}
      moTa={dien(t.dangNhap.maMoTa, { email: email.trim().toLowerCase() })}
      nhanTiep={t.dangNhap.xacNhan}
      choPhepTiep={!dangLam && /^\d{6,10}$/.test(ma)}
      onTiep={xacNhan}
    >
      <View style={{ gap: KHOANG.x2 }}>
        <ONhap
          value={ma}
          onChangeText={(v) => {
            setMa(v.replace(/\D/g, ''));
            if (loi) setLoi(null);
          }}
          placeholder={t.dangNhap.maNhan}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={10}
          style={[kieuMa, { letterSpacing: 4 }]}
          accessibilityLabel={t.dangNhap.maNhan}
        />
        {dongLoi}
      </View>

      <View style={{ gap: KHOANG.x1 }}>
        {conLai > 0 ? (
          <Chu kieu="bodySm" mo style={{ paddingVertical: KHOANG.x3 }}>
            {dien(t.dangNhap.guiLaiSau, { giay: String(conLai) })}
          </Chu>
        ) : (
          <NutChu nhan={t.dangNhap.guiLai} mauChu={v.mau} onPress={gui} />
        )}
        <NutChu
          nhan={t.dangNhap.doiEmail}
          mauChu={mau.chuMo}
          onPress={() => {
            setDaGui(false);
            setMa('');
            setLoi(null);
          }}
        />
      </View>
    </KhungBuoc>
  );
}
