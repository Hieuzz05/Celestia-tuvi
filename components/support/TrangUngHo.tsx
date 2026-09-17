'use client';

import { useState } from 'react';
import { CongUngHo } from '@/components/support/CongUngHo';
import { TheSupporter } from '@/components/support/TheSupporter';
import { Eyebrow, NutChinh, Section, Shell, The } from '@/components/ui';
import { useT } from '@/lib/i18n/context';
import { useQuyen } from '@/lib/support/useQuyen';

/**
 * Trang ủng hộ chung.
 *
 * Khác với cổng bật lên giữa luồng, đây là chỗ người dùng tự tìm tới. Vì vậy
 * không có câu nào nói về hạn mức hay chuyện bị chặn — chỉ nói sản phẩm cần gì
 * và một lời ủng hộ mở ra điều gì.
 */
export function TrangUngHo() {
  const t = useT();
  const { quyen } = useQuyen();
  const [mo, setMo] = useState(false);

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[28px]">
        <div>
          <Eyebrow className="mb-[12px]">{t.ungHo.ten}</Eyebrow>
          <h1 className="heading-sm">{t.ungHo.moiLyCaPhe}</h1>
          <p className="body-sm mt-[10px] max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
            {t.ungHo.cong.voluntary.moTa}
          </p>
        </div>

        <TheSupporter />

        <The className="flex flex-col gap-[12px]">
          <span className="eyebrow">{t.ungHo.banNhanDuoc}</span>
          <ul className="flex flex-col gap-[6px]">
            {t.ungHo.nhan.map((n) => (
              <li key={n} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                · {n}
              </li>
            ))}
          </ul>
          <NutChinh onClick={() => setMo(true)} className="self-start">
            {quyen?.tier === 'supporter' ? t.ungHo.ungHoThem : t.ungHo.cong.voluntary.cta}
          </NutChinh>
          <p className="caption">{t.ungHo.khongPhuThuocSoTien}</p>
        </The>

        {mo && (
          <CongUngHo lyDo="voluntary" onDong={() => setMo(false)} quayLai={{ path: '/support' }} />
        )}
      </Shell>
    </Section>
  );
}
