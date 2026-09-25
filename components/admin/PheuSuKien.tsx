'use client';

import { useEffect, useState } from 'react';

interface Buoc {
  ten: string;
  nhan: string;
  soKhach: number;
}

/** Phễu kích hoạt ở trang quản trị — xem /api/admin/pheu */
export function PheuSuKien() {
  const [soNgay, setSoNgay] = useState(7);
  const [kq, setKq] = useState<{ soNgay: number; buoc: Buoc[]; tongSuKien: number; loi?: string; chuaTaoBang?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/pheu?ngay=${soNgay}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setKq(d))
      .catch(() => setKq(null));
  }, [soNgay]);

  return (
    <section className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-baseline justify-between gap-[12px]">
        <h2 className="heading-sm">Phễu người dùng</h2>
        <div className="flex gap-[8px]">
          {[1, 7, 30].map((n) => (
            <button
              key={n}
              type="button"
              className="pill-tag min-h-[44px]"
              data-active={soNgay === n}
              aria-pressed={soNgay === n}
              onClick={() => setSoNgay(n)}
            >
              {n === 1 ? 'Hôm nay' : `${n} ngày`}
            </button>
          ))}
        </div>
      </div>
      {!kq ? (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>Đang tải…</p>
      ) : kq.chuaTaoBang ? (
        <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
          Chưa có bảng su_kien — chạy supabase/va-su-kien.sql trên Supabase.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr style={{ color: 'var(--fg-muted)' }}>
                <th className="py-[8px] pr-[16px] font-medium">Bước</th>
                <th className="py-[8px] pr-[16px] text-right font-medium">Số khách</th>
                <th className="py-[8px] text-right font-medium">So với bước trước</th>
              </tr>
            </thead>
            <tbody>
              {kq.buoc.map((b, i) => {
                const truoc = i > 0 ? kq.buoc[i - 1].soKhach : 0;
                const tiLe = i > 0 && truoc > 0 ? Math.round((b.soKhach / truoc) * 100) : null;
                return (
                  <tr key={b.ten} style={{ borderTop: '1px solid var(--line)', color: 'var(--fg)' }}>
                    <td className="py-[8px] pr-[16px]">{b.nhan}</td>
                    <td className="py-[8px] pr-[16px] text-right tabular-nums">{b.soKhach}</td>
                    <td className="py-[8px] text-right tabular-nums" style={{ color: 'var(--fg-muted)' }}>
                      {tiLe === null ? '—' : `${tiLe}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="caption mt-[8px]">
            {kq.tongSuKien} sự kiện trong {kq.soNgay} ngày. Đếm theo khách ẩn danh (mỗi trình duyệt một mã), không phải theo lượt.
          </p>
        </div>
      )}
    </section>
  );
}
