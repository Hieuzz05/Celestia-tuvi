import type { Metadata } from 'next';
import { TrangChuNoiDung } from '@/components/landing/TrangChuNoiDung';
import { NHAN_MAU, tinhMotMau } from '@/lib/tuvi/la-so-mau';

// Lá số mẫu tính theo năm hiện tại — dựng lại mỗi ngày để sang năm mới không kẹt năm cũ
export const revalidate = 86400;

export const metadata: Metadata = {
  // Trang gốc dùng đúng tiêu đề mặc định, không chèn thêm hậu tố thương hiệu
  title: { absolute: 'Celestia — Hiểu mình. Rõ đường. Vững bước.' },
  description:
    'Khi công việc, tình cảm hay một quyết định khiến bạn mất phương hướng, Celes ở đây để lắng nghe và giúp bạn nhìn rõ điều đang xảy ra.',
};

// Nội dung nằm ở component client vì toàn bộ chữ đi qua lớp ngôn ngữ VI/EN;
// vỏ server này giữ lại phần metadata mà component client không khai báo được,
// và tính sẵn lá số mẫu đầu để engine không phải tải về trước lần vẽ đầu.
export default function TrangChu() {
  const namXem = new Date().getFullYear();
  return <TrangChuNoiDung laSoMau={{ nhan: NHAN_MAU, mauDau: tinhMotMau(0, namXem), namXem }} />;
}
