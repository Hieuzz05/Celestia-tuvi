import type { Metadata } from 'next';
import { TrangThanhToan } from '@/components/support/TrangThanhToan';

export const metadata: Metadata = {
  title: 'Ủng hộ Celes',
  robots: { index: false },
};

export default async function TrangCheckout({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  return <TrangThanhToan paymentId={paymentId} />;
}
