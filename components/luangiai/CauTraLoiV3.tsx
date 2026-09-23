'use client';

import { useState } from 'react';
import { ghiSuKien } from '@/lib/analytics';

export interface CauV3 {
  id: string;
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  doRo: 'Rõ' | 'Khá rõ' | 'Gợi ý';
  chuaViet: boolean;
}

/** Độ rõ nói bằng lời, không bằng màu tốt/xấu — đây là độ chắc, không phải điềm */
const MO_TA_DO_RO: Record<CauV3['doRo'], string> = {
  'Rõ': 'Lá số nói khá rõ về điều này',
  'Khá rõ': 'Lá số có căn cứ, nhưng còn yếu tố kéo ngược',
  'Gợi ý': 'Chỉ là gợi ý — căn cứ mỏng hoặc là vận năm',
};

/**
 * Một câu hỏi của luận giải v3: câu hỏi → bài luận liền mạch → "Muốn biết vì
 * sao không?" (ẩn mặc định).
 *
 * Phần vì sao ẨN vì nó viết bằng tên sao, tên cung — ngôn ngữ của người biết
 * Tử Vi. Người mới đọc bài luận là đủ; người muốn kiểm thì bấm mở. Đưa nó lên
 * ngang bài luận là bắt mọi người đọc thứ chỉ một số ít cần.
 */
export function CauTraLoiV3({ cau, nho = false }: { cau: CauV3; nho?: boolean }) {
  const [mo, setMo] = useState(false);

  if (cau.chuaViet) {
    return (
      <article className="flex flex-col gap-[8px]">
        <h3 className={nho ? 'text-[16px] font-semibold' : 'text-[18px] font-semibold'} style={{ color: 'var(--fg)' }}>
          {cau.cauHoi}
        </h3>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Celes chưa viết được câu này. Mở lại trang sau ít phút để thử lại.
        </p>
      </article>
    );
  }

  const doan = cau.luanGiai.split(/\n\s*\n/).filter((x) => x.trim());

  return (
    <article className="flex flex-col gap-[12px]">
      <h3 className={nho ? 'text-[16px] font-semibold' : 'text-[18px] font-semibold'} style={{ color: 'var(--fg)' }}>
        {cau.cauHoi}
      </h3>
      {doan.map((d, i) => (
        <p key={i} className="body-text" style={{ color: 'var(--fg)' }}>
          {d}
        </p>
      ))}
      <div className="flex flex-wrap items-center gap-[12px]">
        <span className="caption" title={MO_TA_DO_RO[cau.doRo]}>
          Độ rõ: {cau.doRo}
        </span>
        <button
          type="button"
          className="link-text link-action text-[14px]"
          aria-expanded={mo}
          onClick={() => {
            if (!mo) ghiSuKien('why_opened', { cau: cau.id });
            setMo(!mo);
          }}
        >
          {mo ? 'Thu gọn' : 'Muốn biết vì sao không?'}
        </button>
      </div>
      {mo && (
        <div className="flex flex-col gap-[8px] pl-[14px]" style={{ borderLeft: '2px solid var(--line)' }}>
          <p className="eyebrow">Căn cứ trên lá số của bạn</p>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {cau.viSao}
          </p>
          <p className="caption">{MO_TA_DO_RO[cau.doRo]}.</p>
        </div>
      )}
    </article>
  );
}
