import type { Metadata } from 'next';
import { TrangUngHo } from '@/components/support/TrangUngHo';

export const metadata: Metadata = {
  title: 'Ủng hộ Celes',
  description:
    'Nếu Celes đang hữu ích với bạn, một lời ủng hộ giúp sản phẩm tiếp tục được cải thiện và mở thêm chiều sâu cho trải nghiệm của bạn.',
};

export default function TrangUngHoCeles() {
  return <TrangUngHo />;
}
