import type { Metadata } from 'next';
import { TrangHomeNoiDung } from '@/components/home/TrangHomeNoiDung';

export const metadata: Metadata = {
  title: 'Hôm nay',
};

export default function TrangHome() {
  return <TrangHomeNoiDung />;
}
