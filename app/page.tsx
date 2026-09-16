import type { Metadata } from 'next';
import { TrangChuNoiDung } from '@/components/landing/TrangChuNoiDung';

export const metadata: Metadata = {
  title: 'Celestia — Hiểu mình. Rõ đường. Vững bước.',
  description:
    'Khi công việc, tình cảm hay một quyết định khiến bạn mất phương hướng, Celes ở đây để lắng nghe và giúp bạn nhìn rõ điều đang xảy ra.',
};

// Nội dung nằm ở component client vì toàn bộ chữ đi qua lớp ngôn ngữ VI/EN;
// vỏ server này giữ lại phần metadata mà component client không khai báo được.
export default function TrangChu() {
  return <TrangChuNoiDung />;
}
