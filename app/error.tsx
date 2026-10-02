'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Shell } from '@/components/ui';
import { useT } from '@/lib/i18n/context';
import { CelesMascot } from '@/components/CelesMascot';

/**
 * Lưới đỡ cho mọi lỗi runtime dưới layout gốc. Không có tệp này thì người dùng
 * thấy màn lỗi mặc định của Next — trái luật "lỗi không lộ chi tiết kỹ thuật".
 * Chi tiết lỗi chỉ ghi vào console (và `digest` để đối chiếu log Vercel).
 */
export default function LoiTrang({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useT().loiTrang;

  useEffect(() => {
    console.error('[loi-trang]', error.digest ?? '', error);
  }, [error]);

  return (
    <Shell className="py-[60px]">
      <CelesMascot cho="loi" minhHoa="concerned" cao={96} caoNho={80} ngay className="mb-[20px] block" />
      <h1 className="heading">{t.tieuDe}</h1>
      <p className="body-text mt-[16px] max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
        {t.moTa}
      </p>
      <div className="mt-[24px] flex flex-wrap items-center gap-[16px]">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          {t.thuLai}
        </button>
        <Link href="/" className="link-text">
          {t.veTrangChu}
        </Link>
      </div>
    </Shell>
  );
}
