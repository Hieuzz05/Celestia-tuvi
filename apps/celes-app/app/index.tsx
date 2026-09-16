import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { DauCelestia } from '@/giao-dien/icon';
import { useHoSo } from '@/du-lieu/ho-so';
import { useMau } from '@/thiet-ke/theme';

/**
 * Điểm rẽ khi mở app.
 *
 * Đã có hồ sơ thì vào thẳng Hôm nay; chưa có thì sang màn giới thiệu thương hiệu.
 * Trong lúc còn đang đọc hồ sơ từ kho cục bộ thì giữ nguyên dấu thương hiệu trên
 * nền — nối tiếp splash chứ không chớp sang màn trắng rồi mới quyết định.
 */
export default function DiemRe() {
  const { hoSo, dangTai } = useHoSo();
  const mau = useMau();

  if (dangTai) {
    return (
      <View style={{ flex: 1, backgroundColor: mau.nen, alignItems: 'center', justifyContent: 'center' }}>
        <DauCelestia size={56} />
      </View>
    );
  }

  return <Redirect href={hoSo ? '/(tabs)' : '/gioi-thieu'} />;
}
