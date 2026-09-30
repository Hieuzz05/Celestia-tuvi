'use client';

import { useState } from 'react';
import {
  LUA_CHON,
  TRUONG_THEO_CHU_DE,
  canHoiXungHo,
  tomTatBoiCanh,
  type BoiCanhDoc,
  type TruongBoiCanh,
} from '@/lib/rag/v3/boi-canh-doc';

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
  const [nhap, setNhap] = useState<BoiCanhDoc>(boiCanh);
  const [mo, setMo] = useState(!gon);
  const truong = (TRUONG_THEO_CHU_DE[chuDe] ?? []).filter((t) => t !== 'xungHo' || canHoiXungHo(nhap));
  if (!truong.length) return null;

  if (!mo) {
    const tt = tomTatBoiCanh(boiCanh, chuDe);
    return (
      <p className="caption flex flex-wrap items-center gap-[8px]">
        <span>Celes đang viết theo hoàn cảnh: {tt || 'bạn chưa kể'}</span>
        <button type="button" className="link-text" onClick={() => { setNhap(boiCanh); setMo(true); }}>
          Đổi
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
          Trước khi Celes viết
        </h2>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Cho Celes biết hoàn cảnh hiện tại để bài nói đúng chỗ bạn đang đứng. Lá số không đổi theo câu trả lời — chỉ
          cách Celes nói với bạn đổi.
        </p>
      </div>
      {truong.map((t) => (
        <fieldset key={t} className="flex flex-col gap-[8px]">
          <legend className="caption mb-[8px]">{LUA_CHON[t].hoi}</legend>
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
                  {c.ten}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-[12px]">
        <button type="button" className="btn-primary" disabled={!du} onClick={() => xong(nhap)}>
          Đọc tiếp
        </button>
        <button type="button" className="btn-outline" onClick={boQua}>
          Bỏ qua
        </button>
      </div>
    </section>
  );
}
