'use client';

import { useState } from 'react';
import type { GocNhin } from '@/lib/tuvi/quick-read';
import { ghiSuKien } from '@/lib/analytics';
import { NhanPill, The } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Một góc nhìn kèm nút mở căn cứ.
 *
 * "Muốn biết vì sao không?" là tương tác chữ ký của sản phẩm chứ không phải một
 * chi tiết trang trí: nó vừa làm người mới tin được, vừa là đường dẫn để người
 * biết Tử Vi lần xuống tới cung và sao. Vì vậy nó luôn miễn phí và luôn có mặt.
 */
export function GocNhinCard({
  gocNhin,
  nho = false,
  chinh = false,
}: {
  gocNhin: GocNhin;
  /** Thẻ phụ: chữ nhỏ hơn, dùng cho hai góc nhìn đứng sau */
  nho?: boolean;
  /** Thẻ dẫn đầu: tiêu đề cỡ lớn, chiếm trọn bề ngang */
  chinh?: boolean;
}) {
  const t = useT();
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
        className={chinh ? 'heading-sm' : nho ? 'text-[17px] font-semibold' : 'text-[20px] font-semibold'}
        style={{ color: 'var(--fg)' }}
      >
        {gocNhin.tieuDe}
      </h3>

      <p className={chinh ? 'body-lg' : nho ? 'body-sm' : 'body-text'} style={chinh ? { color: 'var(--fg)' } : undefined}>
        {gocNhin.noiDung}
      </p>

      <button
        onClick={doiTrangThai}
        className="link-text link-action self-start"
        aria-expanded={moCanCu}
      >
        {moCanCu ? t.quickRead.viSaoDong : t.quickRead.viSao}
      </button>

      {moCanCu && (
        <div
          className="flex flex-col gap-[12px] pt-[12px]"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p className="eyebrow">{t.quickRead.viSaoTieuDe}</p>
          <p className="caption">{t.quickRead.viSaoMo}</p>

          <div className="flex flex-wrap gap-[8px]">
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
