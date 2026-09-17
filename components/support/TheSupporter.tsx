'use client';

import { HuyHieuOk, The } from '@/components/ui';
import { dien, useT } from '@/lib/i18n/context';
import { useQuyen } from '@/lib/support/useQuyen';

/**
 * Thẻ trạng thái Supporter.
 *
 * Không đếm ngược, không đổi màu khi sắp hết. Spec cấm tạo áp lực ở đây: người
 * đã ủng hộ rồi thì thứ họ cần là biết mình đang có gì, không phải bị nhắc rằng
 * sắp mất.
 */
export function TheSupporter() {
  const t = useT();
  const { quyen, dangTai } = useQuyen();

  if (dangTai || !quyen || quyen.tier !== 'supporter') return null;

  return (
    <The className="flex flex-col gap-[8px]">
      <HuyHieuOk>{t.ungHo.supporterDangHoatDong}</HuyHieuOk>
      {quyen.supporterExpiresAt && (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {dien(t.ungHo.denKhi, {
            luc: new Date(quyen.supporterExpiresAt).toLocaleString('vi-VN'),
          })}
        </p>
      )}
      <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
        {dien(t.ungHo.conCauHoi, { so: quyen.ask.supporterBalance })}
        {quyen.longReportsRemaining > 0
          ? ` · ${dien(t.ungHo.conBaoCao, { so: quyen.longReportsRemaining })}`
          : ''}
      </p>
    </The>
  );
}
