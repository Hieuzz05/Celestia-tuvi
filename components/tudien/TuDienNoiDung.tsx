'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Section, SectionHeader, Shell } from '@/components/ui';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { dungTuDien, locTuDien } from '@/lib/tu-dien';

/**
 * Từ điển Tử Vi (CEL-075).
 *
 * Trang tĩnh, không gọi AI. Lời giải nghĩa là nét THƯỜNG GẶP lấy từ bản đọc
 * nhanh (xem lib/tu-dien.ts), không phải lời phán cho riêng ai — nên cuối trang
 * mời người đọc mở lá số để xem sao nào của mình nằm ở đâu. Không đặt linh vật:
 * danh sách chỗ đặt ở scripts/test-cho-dat-celes.ts không có trang này.
 */
export function TuDienNoiDung() {
  const { t, ngonNgu } = useNgonNgu();
  const [q, setQ] = useState('');
  const ds = useMemo(() => dungTuDien(ngonNgu, t.tuDien), [ngonNgu, t]);
  const hien = locTuDien(ds, q);

  return (
    <>
      <Section>
        <Shell rong="hep">
          <SectionHeader cap="h1" eyebrow={t.tuDien.eyebrow} tieuDe={t.tuDien.tieuDe} mo={t.tuDien.intro} />
          <label className="mt-[24px] block">
            <span className="field-label">{t.tuDien.timNhan}</span>
            <input
              type="search"
              className="field-input mt-[8px] w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.tuDien.timGoiY}
            />
          </label>
          {!q && (
            <nav aria-label={t.tuDien.mucLuc} className="mt-[16px] flex flex-wrap gap-x-[24px]">
              {ds.map((n) => (
                <a key={n.nhom} href={`#nhom-${n.nhom}`} className="link-text inline-flex min-h-[44px] items-center">
                  {t.tuDien.nhom[n.nhom]}
                </a>
              ))}
            </nav>
          )}
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell rong="hep" className="flex flex-col gap-[32px]">
          {hien.length === 0 && (
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              {dien(t.tuDien.khongThay, { q: q.trim() })}
            </p>
          )}
          {hien.map((n) => (
            <section key={n.nhom} id={`nhom-${n.nhom}`} aria-labelledby={`tieu-de-${n.nhom}`} className="scroll-mt-[88px]">
              <h2 id={`tieu-de-${n.nhom}`} className="heading-sm">
                {t.tuDien.nhom[n.nhom]}
              </h2>
              <p className="body-sm mt-[8px]" style={{ color: 'var(--fg-muted)' }}>
                {t.tuDien.moNhom[n.nhom]}
              </p>
              <dl className="mt-[20px] flex flex-col gap-[16px]">
                {n.muc.map((m) => (
                  <div key={m.id} id={m.id} className="scroll-mt-[88px] pb-[16px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    <dt className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
                      {m.ten}
                    </dt>
                    <dd className="body-text mt-[4px]" style={{ color: 'var(--fg-body)' }}>
                      {m.nghia}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <div className="flex flex-col items-start gap-[12px]">
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              {t.tuDien.cuoi}
            </p>
            <Link href="/la-so" className="btn-primary">
              {t.tuDien.moLaSo}
            </Link>
          </div>
        </Shell>
      </Section>
    </>
  );
}
