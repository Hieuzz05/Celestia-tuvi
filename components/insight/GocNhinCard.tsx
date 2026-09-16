'use client';

import { useState } from 'react';
import type { GocNhin } from '@/lib/tuvi/quick-read';
import { ghiSuKien } from '@/lib/analytics';
import { NhanPill, The } from '@/components/ui';

/**
 * Một góc nhìn kèm nút mở căn cứ.
 *
 * "Vì sao Celestia nói vậy?" là điểm khác biệt chính của sản phẩm chứ không phải
 * một chi tiết trang trí: nó vừa làm người mới tin được, vừa là đường dẫn để người
 * biết Tử Vi lần xuống tới cung và sao. Vì vậy nó luôn miễn phí và luôn có mặt.
 */
export function GocNhinCard({ gocNhin, nho = false }: { gocNhin: GocNhin; nho?: boolean }) {
  const [moCanCu, setMoCanCu] = useState(false);

  const doiTrangThai = () => {
    const moi = !moCanCu;
    setMoCanCu(moi);
    if (moi) ghiSuKien('why_opened', { gocNhin: gocNhin.id });
  };

  return (
    <The className="flex flex-col gap-[12px]">
      <span className="eyebrow">{gocNhin.nhomChu}</span>

      <h3
        className={nho ? 'text-[17px] font-semibold' : 'text-[20px] font-semibold'}
        style={{ color: 'var(--fg)' }}
      >
        {gocNhin.tieuDe}
      </h3>

      <p className={nho ? 'body-sm' : 'body-text'}>{gocNhin.noiDung}</p>

      <button
        onClick={doiTrangThai}
        className="link-text self-start"
        aria-expanded={moCanCu}
      >
        {moCanCu ? 'Thu gọn căn cứ' : 'Vì sao Celestia nói vậy?'}
      </button>

      {moCanCu && (
        <div
          className="flex flex-col gap-[10px] pt-[12px]"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p className="caption">Câu trên dựa vào những chi tiết sau trong lá số của bạn:</p>

          <div className="flex flex-wrap gap-[6px]">
            {gocNhin.canCu.map((c) => (
              <NhanPill key={c.nhan}>{c.nhan}</NhanPill>
            ))}
          </div>

          <ul className="flex flex-col gap-[8px]">
            {gocNhin.canCu.map((c) => (
              <li key={c.nhan} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                <b style={{ color: 'var(--fg)' }}>{c.nhan}.</b> {c.giaiThich}
              </li>
            ))}
          </ul>
        </div>
      )}
    </The>
  );
}
