'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Lịch sử ủng hộ của chính người dùng.
 *
 * Chỉ bốn cột: ngày, số tiền, trạng thái, và phần nào đã mở ra từ lần đó. Spec
 * cấm hiện mã đơn của nhà cung cấp, payload thô hay thông tin ngân hàng ở đây —
 * người dùng không cần chúng, còn để lộ thì chẳng được gì.
 */

interface Don {
  id: string;
  soTien: number;
  lyDo: string;
  trangThai: string;
  luc: string;
}

export function LichSuUngHo() {
  const t = useT();
  const [don, setDon] = useState<Don[] | null>(null);

  useEffect(() => {
    fetch('/api/support/lich-su', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDon(d?.don ?? []))
      .catch(() => setDon([]));
  }, []);

  if (!don) return null;

  return (
    <section className="flex flex-col gap-[12px]">
      <Eyebrow>{t.ungHo.lichSuTieuDe}</Eyebrow>

      {don.length === 0 ? (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {t.ungHo.lichSuTrong}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr>
                {[t.ungHo.lichSuNgay, t.ungHo.lichSuSoTien, t.ungHo.lichSuTrangThai, t.ungHo.lichSuNguon].map(
                  (h) => (
                    <th
                      key={h}
                      className="caption pb-[8px] font-normal"
                      style={{ borderBottom: '1px solid var(--line)' }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {don.map((d) => (
                <tr key={d.id}>
                  <td className="body-sm py-[10px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {new Date(d.luc).toLocaleDateString('vi-VN')}
                  </td>
                  <td
                    className="body-sm py-[10px] tabular-nums"
                    style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}
                  >
                    {d.soTien.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="body-sm py-[10px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {t.ungHo.trangThaiDon[d.trangThai as keyof typeof t.ungHo.trangThaiDon] ??
                      d.trangThai}
                  </td>
                  <td className="body-sm py-[10px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {t.ungHo.nguonDon[d.lyDo as keyof typeof t.ungHo.nguonDon] ?? d.lyDo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
