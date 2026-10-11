import type { Metadata } from 'next';
import { TuDienNoiDung } from '@/components/tudien/TuDienNoiDung';

export const metadata: Metadata = {
  title: 'Từ điển Tử Vi',
  description:
    'Mười bốn chính tinh, mười hai cung, phụ tinh, vòng Trường Sinh và các khái niệm về thời gian trong lá số Tử Vi — giải thích bằng lời thường.',
};

export default function TrangTuDien() {
  return <TuDienNoiDung />;
}
