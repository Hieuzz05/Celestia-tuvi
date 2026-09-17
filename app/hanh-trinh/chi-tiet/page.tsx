import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrangChiTietNoiDung } from '@/components/hanhtrinh/TrangChiTietNoiDung';
import { Shell } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Chi tiết giai đoạn',
  description:
    'Luận hạn đa lớp cho một quãng dài, một năm hoặc một tháng: điều đáng tận dụng, điều cần lưu ý, và toàn bộ căn cứ.',
};

export default function TrangChiTietHan() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangChiTietNoiDung />
    </Suspense>
  );
}
