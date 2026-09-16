'use client';

import Link from 'next/link';
import { LaSoMau } from '@/components/landing/LaSoMau';
import {
  DarkBand,
  Eyebrow,
  GhiChuTay,
  HeroBand,
  IconDongHo,
  IconKhien,
  IconLaSo,
  IconMuiTenPhai,
  IconSao,
  IconTroChuyen,
  Section,
  SectionHeader,
  Shell,
  The,
} from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useT } from '@/lib/i18n/context';

/**
 * Landing công khai.
 *
 * Mở bằng chính nỗi băn khoăn của người đọc chứ không bằng việc sản phẩm làm gì:
 * brand spec đặt trọng tâm ở "có những ngã rẽ bạn không nên đi một mình", còn Tử
 * Vi và AI là lớp bên dưới, chỉ hiện ra khi người dùng chủ động hỏi.
 *
 * Toàn trang chỉ có MỘT câu CTA — "Bắt đầu cùng Celes" — lặp lại ở hero và cuối
 * trang. Trước đây có hai câu khác nhau ngang hàng, người đọc phải chọn giữa hai
 * thứ mà họ chưa hiểu cái nào.
 */
export function TrangChuNoiDung() {
  const t = useT();
  const bam = () => ghiSuKien('landing_cta_click');

  const ICON_CAI_GI = [<IconTroChuyen key="a" />, <IconSao key="b" />, <IconMuiTenPhai key="c" />];
  const ICON_TIN = [<IconLaSo key="a" />, <IconKhien key="b" />, <IconDongHo key="c" />];

  return (
    <>
      {/* ---------- Hero: mở bằng ngã rẽ, không mở bằng tính năng ---------- */}
      <HeroBand className="pt-[80px] pb-[96px]">
        <Shell rong="hep" className="text-center">
          <Eyebrow className="mb-[16px]">{t.landing.eyebrow}</Eyebrow>
          <h1 className="display">{t.landing.tieuDe}</h1>
          <p className="body-lg mx-auto mt-[24px] max-w-[600px]" style={{ color: 'var(--fg)' }}>
            {t.landing.moTa}
          </p>

          <div className="mt-[32px] flex flex-wrap items-center justify-center gap-[16px]">
            <Link href="/la-so" className="btn-primary" onClick={bam}>
              {t.chung.ctaChinh}
            </Link>
            <Link href="/gioi-thieu" className="btn-outline">
              {t.landing.ctaPhu}
            </Link>
          </div>

          <p className="caption mt-[16px]">{t.landing.microcopy}</p>
        </Shell>

        {/* Xem trước một góc nhìn thật, kèm nút mở căn cứ */}
        <Shell className="mt-[48px]">
          <div className="relative">
            <span className="absolute -top-[40px] right-[6%] hidden lg:block">
              <GhiChuTay huong="duoi" xoay={-4}>
                {t.quickRead.viSao}
              </GhiChuTay>
            </span>
            <LaSoMau />
          </div>
        </Shell>
      </HeroBand>

      {/* ---------- Ba câu hỏi người dùng thật sự mang tới ---------- */}
      <Section>
        <Shell>
          <SectionHeader
            canGiua
            eyebrow={t.landing.theEyebrow}
            tieuDe={t.landing.theTieuDe}
          />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {t.landing.the.map((c) => (
              <The key={c.tieuDe} className="flex flex-col gap-[12px]">
                <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.tieuDe}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {c.noiDung}
                </p>
                <Link
                  href="/la-so"
                  onClick={bam}
                  className="link-text mt-auto inline-flex items-center gap-[6px] pt-[8px]"
                >
                  {c.cta}
                  <IconMuiTenPhai size={16} />
                </Link>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      {/* ---------- Celes làm gì cùng bạn ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader canGiua eyebrow={t.landing.caiGiEyebrow} tieuDe={t.landing.caiGiTieuDe} />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {t.landing.caiGi.map((c, i) => (
              <The key={c.ten} className="flex flex-col gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{ICON_CAI_GI[i]}</span>
                <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.ten}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {c.mo}
                </p>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      {/* ---------- Vì sao tin được ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            canGiua
            eyebrow={t.landing.tinEyebrow}
            tieuDe={t.landing.tinTieuDe}
            mo={t.landing.tinMo}
          />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {t.landing.tin.map((c, i) => (
              <The key={c.ten} className="flex flex-col gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{ICON_TIN[i]}</span>
                <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.ten}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {c.mo}
                </p>
              </The>
            ))}
          </div>
          <p className="mt-[32px] text-center">
            <Link href="/gioi-thieu" className="link-text inline-flex items-center gap-[6px]">
              {t.landing.xemCachTinh}
              <IconMuiTenPhai size={16} />
            </Link>
          </p>
        </Shell>
      </Section>

      {/* ---------- Dải CTA tối cuối trang ---------- */}
      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">{t.landing.cuoiEyebrow}</p>
            <h2 className="heading">{t.landing.cuoiTieuDe}</h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              {t.landing.cuoiMo}
            </p>
          </div>

          <Link href="/la-so" className="btn-primary" onClick={bam}>
            {t.chung.ctaChinh}
          </Link>
        </Shell>
      </DarkBand>
    </>
  );
}
