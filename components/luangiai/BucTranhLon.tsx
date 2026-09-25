'use client';

import { useEffect, useState } from 'react';
import { DangDocV3 } from './CauTraLoiV3';

/**
 * BỨC TRANH LỚN CỦA CUỘC ĐỜI (26/09/2026) — tầng cuối của luận giải chuyên sâu.
 * Ghép phần "Tóm lại" của các chủ đề đã đọc + tổng quan (route `bucTranh: true`).
 * Chưa đọc đủ chủ đề thì nói rõ còn thiếu bao nhiêu, không viết từ bức tranh thiếu.
 * Mỗi lần mở là một lần hỏi lại: đọc thêm chủ đề thì bức tranh được viết lại cho đủ.
 */
type Ket = { dang: true } | { dang: false; bucTranh: string | null; soChuDe?: number; can?: number; loi?: string };

export function BucTranhLon({
  thongTin,
  onMoChuDe,
}: {
  thongTin: { ngay: number; thang: number; nam: number; gio: number; gioiTinh: string; namXem: number };
  onMoChuDe: () => void;
}) {
  const [ket, setKet] = useState<Ket>({ dang: true });
  const { ngay, thang, nam, gio, gioiTinh, namXem } = thongTin;

  useEffect(() => {
    let huy = false;
    fetch('/api/luan-giai-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, namXem, nhom: 'tinh-cach', bucTranh: true }),
    })
      .then(async (r) => ({ ok: r.ok, d: await r.json() }))
      .then(({ ok, d }) => {
        if (huy) return;
        setKet(
          ok
            ? { dang: false, bucTranh: d.bucTranh ?? null, soChuDe: d.soChuDe, can: d.canToiThieu }
            : { dang: false, bucTranh: null, loi: d?.loi ?? 'Celes chưa ghép được bức tranh lớn.' }
        );
      })
      .catch(() => {
        if (!huy) setKet({ dang: false, bucTranh: null, loi: 'Không kết nối được. Thử lại sau ít phút.' });
      });
    return () => {
      huy = true;
    };
  }, [ngay, thang, nam, gio, gioiTinh, namXem]);

  if (ket.dang) return <DangDocV3 chu="Celes đang ghép các phần bạn đã đọc thành một bức tranh" />;
  if (ket.bucTranh) {
    return (
      <section className="card flex flex-col gap-[16px]" style={{ borderTop: '3px solid var(--accent)' }}>
        {ket.bucTranh
          .split(/\n\s*\n/)
          .filter((x) => x.trim())
          .map((d, i) => (
            <p key={i} className="body-text md:text-[18px] md:leading-[1.6]" style={{ color: 'var(--fg)' }}>
              {d}
            </p>
          ))}
        <p className="caption">
          Ghép từ phần tổng quan và {ket.soChuDe} chủ đề bạn đã đọc. Đọc thêm chủ đề, bức tranh sẽ đầy đủ hơn.
        </p>
      </section>
    );
  }
  if (ket.loi) {
    return (
      <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
        {ket.loi}
      </p>
    );
  }
  const con = Math.max(1, (ket.can ?? 3) - (ket.soChuDe ?? 0));
  return (
    <div className="card flex flex-col gap-[12px]">
      <p className="body-text" style={{ color: 'var(--fg)' }}>
        Bức tranh lớn được ghép từ những chủ đề bạn đã đọc hết. Bạn đọc thêm {con} chủ đề nữa, Celes sẽ nối chúng thành một câu chuyện về cả cuộc đời.
      </p>
      <button type="button" className="btn-primary self-start" onClick={onMoChuDe}>
        Chọn một chủ đề để đọc
      </button>
    </div>
  );
}
