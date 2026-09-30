'use client';

import { useState } from 'react';
import { LUA_CHON, TRUONG_THEO_CHU_DE, canHoiXungHo, type BoiCanhDoc, type TruongBoiCanh } from '@/lib/rag/v3/boi-canh-doc';
import { dien, useT } from '@/lib/i18n/context';

/**
 * HỎI BỐI CẢNH (30/09/2026) — lần đầu mở Tình duyên / Con cái / Sự nghiệp, Celes hỏi vài chip
 * về hoàn cảnh hiện tại trước khi viết, để bài nói đúng thì (đã kết hôn thì không hỏi "bao giờ
 * gặp người ấy"). Một chạm là xong; "Bỏ qua" cũng được — bài viết như chưa biết gì.
 *
 * `gon`: đã trả lời rồi — chỉ còn một dòng tóm tắt kèm nút "Đổi".
 */
export function HoiBoiCanh({
  chuDe,
  boiCanh,
  gon,
  onXong,
}: {
  chuDe: string;
  boiCanh: BoiCanhDoc;
  gon?: boolean;
  onXong: (bc: BoiCanhDoc) => void;
}) {
  const tt = useT().boiCanh;
  const tenChon = (id: string) => (tt.chon as Record<string, string>)[id] ?? id;
  const [nhap, setNhap] = useState<BoiCanhDoc>(boiCanh);
  const [mo, setMo] = useState(!gon);
  const truong = (TRUONG_THEO_CHU_DE[chuDe] ?? []).filter((t) => t !== 'xungHo' || canHoiXungHo(nhap));
  if (!truong.length) return null;

  if (!mo) {
    const tom = (TRUONG_THEO_CHU_DE[chuDe] ?? [])
      .filter((t) => boiCanh[t] && (t !== 'xungHo' || canHoiXungHo(boiCanh)))
      .map((t) => (t === 'xungHo' ? dien(tt.goiLa, { ten: tenChon(boiCanh[t]!).toLowerCase() }) : tenChon(boiCanh[t]!)))
      .join(' · ');
    return (
      <p className="caption flex flex-wrap items-center gap-[8px]">
        <span>{dien(tt.dangViet, { tt: tom || tt.chuaKe })}</span>
        <button type="button" className="link-text" onClick={() => { setNhap(boiCanh); setMo(true); }}>
          {tt.doi}
        </button>
      </p>
    );
  }

  const du = truong.every((t) => nhap[t]);
  const chon = (t: TruongBoiCanh, v: string) => setNhap((cu) => ({ ...cu, [t]: v }));
  const xong = (bc: BoiCanhDoc) => {
    setMo(false);
    onXong(bc);
  };
  // "Bỏ qua" = không muốn nói cho các trường còn trống — lần sau không hỏi lại
  const boQua = () => {
    const bc = { ...nhap };
    for (const t of truong) if (!bc[t]) (bc as Record<string, string>)[t] = t === 'xungHo' ? 'nguoi-ay' : 'khong-noi';
    xong(bc);
  };

  return (
    <section className="card flex flex-col gap-[16px]" aria-labelledby="hoi-boi-canh">
      <div className="flex flex-col gap-[4px]">
        <h2 id="hoi-boi-canh" className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
          {tt.tieuDe}
        </h2>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {tt.moTa}
        </p>
      </div>
      {truong.map((t) => (
        <fieldset key={t} className="flex flex-col gap-[8px]">
          <legend className="caption mb-[8px]">{tt.hoi[t]}</legend>
          <div className="flex flex-wrap gap-[8px]">
            {LUA_CHON[t].chon.map((c) => {
              const dang = nhap[t] === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={dang}
                  onClick={() => chon(t, c.id)}
                  className="min-h-[44px] rounded-full border px-[14px] text-[14px] transition-colors"
                  style={{
                    borderColor: dang ? 'var(--accent)' : 'var(--line)',
                    background: dang ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                    color: dang ? 'var(--fg)' : 'var(--fg-muted)',
                    fontWeight: dang ? 600 : 400,
                  }}
                >
                  {tenChon(c.id)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-[12px]">
        <button type="button" className="btn-primary" disabled={!du} onClick={() => xong(nhap)}>
          {tt.docTiep}
        </button>
        <button type="button" className="btn-outline" onClick={boQua}>
          {tt.boQua}
        </button>
      </div>
    </section>
  );
}
