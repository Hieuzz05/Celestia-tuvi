import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { DauCelestia, MAU_THUONG_HIEU } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';

/**
 * Điểm rẽ khi mở app.
 *
 * Đã có hồ sơ thì vào thẳng Hôm nay; chưa có thì sang màn giới thiệu thương hiệu.
 * Trong lúc còn đang đọc hồ sơ từ kho cục bộ thì giữ nguyên dấu thương hiệu trên
 * nền — nối tiếp splash chứ không chớp sang màn trắng rồi mới quyết định. Nền
 * là màu nền của splash (`app.json`), không theo theme, cho liền mạch.
 */
export default function DiemRe() {
  const { hoSo, dangTai } = useHoSo();

  if (dangTai) {
    return (
      <View style={{ flex: 1, backgroundColor: MAU_THUONG_HIEU.nenDau, alignItems: 'center', justifyContent: 'center' }}>
        <DauCelestia size={56} nen="toi" />
      </View>
    );
  }

  return <Redirect href={hoSo ? '/(tabs)' : '/gioi-thieu'} />;
}
