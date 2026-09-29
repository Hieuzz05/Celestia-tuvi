import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Giong, NenVung } from '@/giao-dien/co-ban';
import { DauCelestia } from '@/giao-dien/icon';
import { useBanNhap } from '@/du-lieu/ban-nhap';
import { useHoSo } from '@/du-lieu/ho-so';
import { useT } from '@/i18n/context';
import { useMau, useVung } from '@/thiet-ke/theme';
import { KHOANG, LE_NGANG } from '@/thiet-ke/token';

/**
 * Màn chờ giữa lúc lập bản đồ.
 *
 * Việc tính toán thật chỉ mất vài mili giây vì engine chạy cục bộ, không gọi
 * mạng. Nhưng chuyển ngay lập tức từ câu hỏi cuối sang kết quả thì hụt hẫng —
 * người dùng vừa đưa ngày giờ sinh và cần một khoảnh khắc để thấy nó được nhận.
 *
 * Nên đây là nhịp có chủ đích, không phải thanh tiến độ giả: mỗi câu hiện đúng
 * 1,1 giây rồi chuyển. Và tuyệt đối không dùng từ "đang lập lá số" hay "đang gọi
 * model" — người dùng nghe thấy máy móc, không nghe thấy Celes.
 */

const NHIP_MOI_CAU = 1100;

export default function ManDangTao() {
  const router = useRouter();
  const t = useT();
  const mau = useMau();
  const { thanhHoSo, xoaTrang } = useBanNhap();
  const { luuHoSo } = useHoSo();
  const { width } = useWindowDimensions();
  const v = useVung('khoiDau');
  const coDau = Math.min(96, width * 0.24);
  const coVong = coDau * 2.3;

  const [cau, setCau] = useState(0);
  const cacCau = [t.dangTao.buoc1, t.dangTao.buoc2, t.dangTao.buoc3];

  const xoay = useRef(new Animated.Value(0)).current;
  const hienRa = useRef(new Animated.Value(0)).current;

  // Quỹ đạo quay chậm — chuyển động bình tĩnh, không phải hiệu ứng lấp lánh
  useEffect(() => {
    const vong = Animated.loop(
      Animated.timing(xoay, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    vong.start();
    return () => vong.stop();
  }, [xoay]);

  useEffect(() => {
    hienRa.setValue(0);
    Animated.timing(hienRa, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [cau, hienRa]);

  useEffect(() => {
    if (cau < cacCau.length - 1) {
      const h = setTimeout(() => setCau((c) => c + 1), NHIP_MOI_CAU);
      return () => clearTimeout(h);
    }

    const h = setTimeout(async () => {
      await luuHoSo(thanhHoSo());
      xoaTrang();
      router.replace('/quick-read');
    }, NHIP_MOI_CAU);
    return () => clearTimeout(h);
  }, [cau, cacCau.length, luuHoSo, thanhHoSo, xoaTrang, router]);

  const goc = xoay.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: mau.nen }} accessibilityLiveRegion="polite">
      <NenVung vung="khoiDau" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: LE_NGANG,
          gap: KHOANG.x10,
        }}
      >
        {/* Dấu đứng yên, chỉ quỹ đạo quanh nó xoay — dấu thương hiệu xoay trông như lỗi */}
        <View style={{ width: coVong, height: coVong, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ position: 'absolute', transform: [{ rotate: goc }] }}>
            <Svg width={coVong} height={coVong} viewBox="0 0 200 200">
              <G fill="none" stroke={v.mau} strokeOpacity={0.28}>
                <Circle cx={100} cy={100} r={64} strokeDasharray="2 6" />
                <Circle cx={100} cy={100} r={94} />
              </G>
              <Circle cx={194} cy={100} r={5} fill={v.mau} />
              <Circle cx={100} cy={36} r={3.5} fill={v.sang} fillOpacity={0.7} />
            </Svg>
          </Animated.View>
          <DauCelestia size={coDau} />
        </View>

        <Animated.View style={{ opacity: hienRa, minHeight: 56, justifyContent: 'center' }}>
          <Giong co={20} style={{ textAlign: 'center' }}>
            {cacCau[cau]}
          </Giong>
        </Animated.View>
      </View>
    </View>
  );
}
