'use client';

import Link from 'next/link';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { dien, useT } from '@/lib/i18n/context';
import { useQuyen } from '@/lib/support/useQuyen';

/**
 * Dải cảm ơn khi quyền Supporter vừa được mở.
 *
 * Vì sao cần: người dùng chuyển tiền xong thường không ở lại màn thanh toán —
 * họ trả bằng app ngân hàng trên điện thoại, hoặc payOS mở ở tab khác, rồi quay
 * về Celestia bằng một đường khác. Lúc đó quyền đã mở thật nhưng không màn nào
 * nói ra, nên cảm giác là "trả tiền xong chẳng thấy gì".
 *
 * Dải này gắn ở layout nên hiện ở bất kỳ trang nào. Nó đọc trạng thái thật từ
 * máy chủ chứ không dựa vào việc người dùng đi qua màn nào.
 *
 * Khoá ghi nhớ gắn theo thời điểm hết hạn: mỗi lần ủng hộ mới đẩy hạn ra xa nên
 * sinh một khoá mới — người ủng hộ tiếp vẫn được cảm ơn lần nữa, còn người đã
 * bấm "Đã rõ" thì không bị nhắc lại suốt 24 giờ.
 */
const KHOA = 'celestia:da-cam-on-supporter';

/** Đọc localStorage kiểu React đọc được: có ảnh chụp riêng cho lượt dựng ở máy chủ */
function docDaDong(): string | null {
  try {
    return window.localStorage.getItem(KHOA);
  } catch {
    return null;
  }
}

const khongTheoDoi = () => () => {};

export function BangCamOn() {
  const t = useT();
  const { quyen, dangTai } = useQuyen();
  const [daBam, setDaBam] = useState(false);

  // useSyncExternalStore thay cho useEffect + setState: localStorage là kho dữ
  // liệu ngoài React, và cách này có sẵn ảnh chụp cho lượt dựng ở máy chủ nên
  // không lệch khi hydrate.
  const daDong = useSyncExternalStore(khongTheoDoi, docDaDong, () => null);

  const han = quyen?.supporterExpiresAt ?? null;

  const dong = useCallback(() => {
    try {
      if (han) window.localStorage.setItem(KHOA, han);
    } catch {
      // Chế độ riêng tư chặn localStorage — cùng lắm là hiện lại lần sau
    }
    setDaBam(true);
  }, [han]);

  if (dangTai || quyen?.tier !== 'supporter' || !han) return null;
  if (daBam || daDong === han) return null;

  return (
    <div
      className="no-print"
      role="status"
      aria-live="polite"
      style={{ background: 'var(--surface-wash)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-[16px] gap-y-[8px] px-[24px] py-[12px]">
        <span className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
          {t.ungHo.camOn}
        </span>
        <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {dien(t.ungHo.camOnMo, {
            luc: new Date(han).toLocaleString('vi-VN'),
            so: quyen.ask.supporterBalance,
          })}
        </span>
        <span className="ml-auto flex items-center gap-[16px]">
          <Link href="/support" className="link-text">
            {t.ungHo.xemChiTietQuyen}
          </Link>
          <button onClick={dong} className="link-text">
            {t.ungHo.daHieu}
          </button>
        </span>
      </div>
    </div>
  );
}
