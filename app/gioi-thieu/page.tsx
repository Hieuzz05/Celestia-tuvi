import type { Metadata } from 'next';
import { CachHoatDongNoiDung } from '@/components/landing/CachHoatDongNoiDung';

export const metadata: Metadata = {
  title: 'Cách hoạt động',
  description:
    'Bắt đầu từ điều bạn đang băn khoăn, Celes nhìn vào bức tranh của riêng bạn, và bạn tự quyết định. Kèm phần phương pháp tính cho ai muốn kiểm chứng.',
};

export default function TrangCachHoatDong() {
  return <CachHoatDongNoiDung />;
}
