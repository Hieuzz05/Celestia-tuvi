'use client';

import Link from 'next/link';
import { Shell } from '@/components/ui';
import { useT } from '@/lib/i18n/context';
import { CelesMascot } from '@/components/CelesMascot';

export default function KhongTimThay() {
  const t = useT().loiTrang;
  return (
    <Shell className="py-[60px]">
      <CelesMascot cho="loi" minhHoa="playing" cao={120} caoNho={96} ngay className="mb-[20px] block" />
      <h1 className="heading">{t.khongThayTieuDe}</h1>
      <p className="body-text mt-[18px] max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
        {t.khongThayMoTa}
      </p>
      <Link href="/" className="btn-primary mt-[24px] inline-block">
        {t.veTrangChu}
      </Link>
    </Shell>
  );
}
