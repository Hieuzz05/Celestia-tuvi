'use client';

import { useMemo, useState } from 'react';
import type { GocNhin } from '@/lib/tuvi/quick-read';
import { tachCauDau } from '@/lib/tach-cau';
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
  cap = 'h3',
}: {
  gocNhin: GocNhin;
  /** Thẻ phụ: chữ nhỏ hơn, dùng cho hai góc nhìn đứng sau */
  nho?: boolean;
  /** Thẻ dẫn đầu: tiêu đề cỡ lớn, chiếm trọn bề ngang */
  chinh?: boolean;
  /** Cấp tiêu đề: 'h2' khi thẻ đứng ngay dưới h1 của trang (không được nhảy cấp h1 → h3) */
  cap?: 'h2' | 'h3';
}) {
  const TieuDe = cap;
  const t = useT();
  const [moCanCu, setMoCanCu] = useState(false);

  /*
   * Hiện MỘT câu, phần còn lại nằm sau nút.
   *
   * Thẻ này in trọn 4-6 câu ngay khi mở, và bốn thẻ liền nhau thành một tường
   * chữ — đúng chỗ người dùng kêu "nhiều chữ quá, không đọc". Nội dung KHÔNG
   * mất đi: `tachCauDau` chỉ cắt, không viết lại, nên bấm mở là thấy nguyên
   * văn cũ.
   */
  const [moThem, setMoThem] = useState(false);
  const cau = useMemo(() => tachCauDau(gocNhin.noiDung), [gocNhin.noiDung]);
  const coThem = cau.conLai.length > 0;

  const doiTrangThai = () => {
    const moi = !moCanCu;
    setMoCanCu(moi);
    if (moi) ghiSuKien('why_opened', { gocNhin: gocNhin.id });
  };

  return (
    <The className="flex flex-col gap-[12px]">
      <span className="eyebrow eyebrow-nhan">{gocNhin.nhomChu}</span>

      <TieuDe
        className={chinh ? 'heading-sm' : nho ? 'text-[17px] font-semibold' : 'text-[20px] font-semibold'}
        style={{ color: 'var(--fg)' }}
      >
        {gocNhin.tieuDe}
      </TieuDe>

      <p className={chinh ? 'body-lg' : nho ? 'body-sm' : 'body-text'} style={chinh ? { color: 'var(--fg)' } : undefined}>
        {moThem ? gocNhin.noiDung : cau.cauDau}
      </p>

      <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[4px]">
        {coThem && (
          <button
            onClick={() => setMoThem((v) => !v)}
            className="link-text link-action"
            aria-expanded={moThem}
          >
            {moThem ? t.quickRead.thuGonCau : t.quickRead.docTiepCau}
          </button>
        )}

        <button onClick={doiTrangThai} className="link-text link-action" aria-expanded={moCanCu}>
          {moCanCu ? t.quickRead.viSaoDong : t.quickRead.viSao}
        </button>
      </div>

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
