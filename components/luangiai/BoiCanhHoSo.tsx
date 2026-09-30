'use client';

import { useEffect, useState } from 'react';
import { HoiBoiCanh } from './HoiBoiCanh';
import { TRUONG_THEO_CHU_DE, type BoiCanhDoc } from '@/lib/rag/v3/boi-canh-doc';
import { docBoiCanhDoc, luuBoiCanhDoc, type LaSoCua } from '@/lib/store/boi-canh-doc';

const TEN: Record<string, string> = { 'tinh-duyen': 'Tình duyên', 'con-cai': 'Con cái', 'su-nghiep': 'Sự nghiệp' };

/**
 * Mục "Hoàn cảnh hiện tại" trong thẻ lá số ở /ho-so — sửa bối cảnh người đọc mà không phải mở
 * từng chủ đề. Cùng chỗ cất với trang chuyên sâu (lib/store/boi-canh-doc.ts).
 */
export function BoiCanhHoSo({ laSo }: { laSo: LaSoCua }) {
  const [bc, setBc] = useState<BoiCanhDoc | null>(null);
  const [mo, setMo] = useState(false);
  const { ngay, thang, nam, gio, gioiTinh } = laSo;
  useEffect(() => {
    if (!mo) return;
    docBoiCanhDoc({ ngay, thang, nam, gio, gioiTinh }).then(setBc);
  }, [mo, ngay, thang, nam, gio, gioiTinh]);

  const luu = (moi: BoiCanhDoc) => {
    const gop = { ...(bc ?? {}), ...moi };
    setBc(gop);
    luuBoiCanhDoc({ ngay, thang, nam, gio, gioiTinh }, gop);
  };

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <button type="button" className="link-text self-start" aria-expanded={mo} onClick={() => setMo((x) => !x)}>
        {mo ? 'Ẩn hoàn cảnh hiện tại' : 'Hoàn cảnh hiện tại'}
      </button>
      {mo && bc && (
        <div className="flex flex-col gap-[8px]">
          <p className="caption">Celes dùng để nói đúng thì trong luận giải chuyên sâu. Lá số không đổi theo đây.</p>
          {Object.keys(TRUONG_THEO_CHU_DE).map((id) => (
            <div key={id} className="flex flex-col gap-[4px]">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>{TEN[id]}</span>
              <HoiBoiCanh chuDe={id} boiCanh={bc} gon onXong={luu} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
