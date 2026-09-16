import type { Metadata } from 'next';
import { TrangHanhTrinhNoiDung } from '@/components/hanhtrinh/TrangHanhTrinhNoiDung';

export const metadata: Metadata = {
  title: 'Hành trình',
  description:
    'Bạn đang ở đâu trong nhịp của mình: những quãng dài, từng năm và từng tháng, đọc ra từ chính bản đồ của bạn.',
};

export default function TrangHanhTrinh() {
  return <TrangHanhTrinhNoiDung />;
}
