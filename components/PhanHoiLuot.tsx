'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { LY_DO_PHAN_HOI, type LyDoPhanHoi } from '@/lib/rag/phan-hoi';

/**
 * 👍👎 dưới một lượt Celes (CEL-195). 👎 mở danh sách lý do ĐÓNG — không có ô chữ tự do, để người
 * dùng không gõ lại ngày sinh hay chuyện riêng vào một nơi chỉ cần một nhãn.
 */
export function PhanHoiLuot({ requestId }: { requestId: string }) {
  const t = useT().hoiCeles.phanHoi;
  const [trangThai, setTrangThai] = useState<'chua' | 'hoi-ly-do' | 'da-gui' | 'loi'>('chua');
  const [dangGui, setDangGui] = useState(false);

  async function gui(phanHoi: 'huu_ich' | 'khong_dung', lyDo?: LyDoPhanHoi) {
    setDangGui(true);
    try {
      const res = await fetch('/api/hoi-dap/phan-hoi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, phanHoi, ...(lyDo ? { lyDo } : {}) }),
      });
      setTrangThai(res.ok ? 'da-gui' : 'loi');
    } catch {
      setTrangThai('loi');
    } finally {
      setDangGui(false);
    }
  }

  const nut = 'min-h-[44px] min-w-[44px] rounded-[10px] px-[10px] text-[13px]';
  const mo = { color: 'var(--fg-muted)' };

  if (trangThai === 'da-gui') return <p className="text-[13px]" style={mo}>{t.camOn}</p>;
  if (trangThai === 'loi') return <p className="text-[13px]" style={mo}>{t.loi}</p>;

  if (trangThai === 'hoi-ly-do')
    return (
      <div className="flex flex-col gap-[8px]">
        <p className="text-[13px]" style={mo}>{t.hoiLyDo}</p>
        <div className="flex flex-wrap gap-[8px]">
          {LY_DO_PHAN_HOI.map((l) => (
            <button key={l} className="pill-tag min-h-[44px]" disabled={dangGui} onClick={() => gui('khong_dung', l)}>
              {t.lyDo[l]}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex items-center gap-[4px]" style={mo}>
      <button className={nut} disabled={dangGui} onClick={() => gui('huu_ich')} aria-label={t.huuIch} title={t.huuIch}>
        👍
      </button>
      <button className={nut} disabled={dangGui} onClick={() => setTrangThai('hoi-ly-do')} aria-label={t.khongDung} title={t.khongDung}>
        👎
      </button>
    </div>
  );
}
