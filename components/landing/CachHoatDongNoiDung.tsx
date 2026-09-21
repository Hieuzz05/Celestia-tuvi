'use client';

import Link from 'next/link';
import { BuocSo, DarkBand, Section, SectionHeader, Shell, The } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Cách hoạt động.
 *
 * Spec v4 mục 2 viết lại hẳn trang này. Bản cũ mở đầu bằng việc mô tả hệ thống —
 * phần nào do công thức, phần nào do AI — nên đọc lên giống tài liệu kỹ thuật
 * hơn là lời của một người đồng hành. Giờ mặt trước nói bằng giọng người: bắt
 * đầu từ băn khoăn của bạn, Celes nhìn vào bức tranh, bạn tự quyết định.
 *
 * Lớp kỹ thuật không bị bỏ — nó lùi xuống dưới, sau khối "vì sao tin được", để
 * ai muốn kiểm chứng vẫn có chỗ đọc.
 */
export function CachHoatDongNoiDung() {
  const t = useT();

  return (
    <>
      <Section>
        <Shell rong="hep">
          <SectionHeader
            cap="h1"
            eyebrow={t.cachHoatDong.eyebrow}
            tieuDe={t.cachHoatDong.tieuDe}
            mo={t.cachHoatDong.intro}
          />
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell>
          <div className="grid gap-[16px] md:grid-cols-3">
            {t.cachHoatDong.buoc.map((b, i) => (
              <The key={b.tieuDe}>
                <BuocSo so={i + 1} tieuDe={b.tieuDe} mo={b.noiDung} />
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      {/* Khối trust đặt ngay sau ba bước, đúng thứ tự spec */}
      <Section className="pt-0">
        <Shell rong="hep">
          <SectionHeader eyebrow={t.cachHoatDong.tinEyebrow} tieuDe={t.cachHoatDong.tinTieuDe} />
          <div className="mt-[32px] flex flex-col gap-[24px]">
            {t.cachHoatDong.tin.map((v) => (
              <div key={v.ten} className="flex flex-col gap-[8px]">
                <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {v.ten}
                </h3>
                <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
                  {v.mo}
                </p>
              </div>
            ))}
          </div>
        </Shell>
      </Section>

      {/* Lớp kỹ thuật: có mặt, nhưng không còn mở đầu trang */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            eyebrow={t.cachHoatDong.phuongPhapEyebrow}
            tieuDe={t.cachHoatDong.phuongPhapTieuDe}
            mo={t.cachHoatDong.phuongPhapMo}
          />
          <div className="mt-[32px] grid gap-[16px] md:grid-cols-3">
            {t.cachHoatDong.lop.map((l) => (
              <The key={l.ten} className="flex flex-col gap-[12px]">
                <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {l.ten}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {l.mo}
                </p>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell rong="hep">
          <SectionHeader eyebrow={t.cachHoatDong.hoiEyebrow} tieuDe={t.cachHoatDong.hoiTieuDe} />
          <div className="mt-[32px] flex flex-col gap-[24px]">
            {t.cachHoatDong.hoi.map((c) => (
              <div key={c.hoi} className="flex flex-col gap-[8px]">
                <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.hoi}
                </h3>
                <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
                  {c.dap}
                </p>
              </div>
            ))}
          </div>
        </Shell>
      </Section>

      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">{t.cachHoatDong.cuoiEyebrow}</p>
            <h2 className="heading">{t.cachHoatDong.cuoiTieuDe}</h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              {t.cachHoatDong.cuoiMo}
            </p>
          </div>
          <Link href="/la-so" className="btn-primary">
            {t.cachHoatDong.cuoiNut}
          </Link>
        </Shell>
      </DarkBand>
    </>
  );
}
