'use client';

import { useEffect, useRef } from 'react';
import type { MocHanhTrinh } from '@/lib/tuvi/hanh-trinh';
import { useT } from '@/lib/i18n/context';

/**
 * Một dải mốc cuộn ngang — dùng chung cho cả ba lớp giai đoạn / năm / tháng.
 *
 * Cuộn ngang thay vì lưới xuống dòng vì dòng thời gian phải đọc ra là *một
 * đường*: có trước, có sau, và mình đang đứng ở đâu trên đó. Lưới xuống dòng làm
 * mất luôn cảm giác đó.
 *
 * Mốc đang diễn ra không dùng hồng Fuchsia: hệ chỉ cho một điểm hồng mỗi khung
 * nhìn và điểm đó đã thuộc về nút hành động chính. Ở đây đánh dấu bằng mực
 * Aubergine đặc + chữ nghịch đảo, đủ nổi mà không phạm luật.
 */
export function DaiThoiGian({
  moc,
  idDangChon,
  onChon,
}: {
  moc: MocHanhTrinh[];
  idDangChon: string;
  onChon: (moc: MocHanhTrinh) => void;
}) {
  const t = useT();
  const khungRef = useRef<HTMLDivElement>(null);
  const chonRef = useRef<HTMLButtonElement>(null);

  // Trên màn hẹp, mốc đang chọn thường nằm ngoài khung nhìn của dải — kéo nó vào
  // giữa, bằng không mở trang lên là không thấy mình đang đứng ở đâu.
  //
  // Đặt scrollLeft thẳng tay chứ không dùng scrollIntoView: hàm đó cuộn cả trang
  // khi phần tử nằm dưới khung nhìn, mà trang này có ba dải — vừa mở đã bị đẩy
  // xuống tận dải cuối.
  useEffect(() => {
    const khung = khungRef.current;
    const nut = chonRef.current;
    if (!khung || !nut) return;
    khung.scrollLeft = nut.offsetLeft - (khung.clientWidth - nut.clientWidth) / 2;
  }, [idDangChon]);

  return (
    <div ref={khungRef} className="-mx-[24px] overflow-x-auto px-[24px] pb-[4px]">
      <div className="flex min-w-max gap-[10px]">
        {moc.map((m) => {
          const chon = m.id === idDangChon;
          return (
            <button
              key={m.id}
              ref={chon ? chonRef : undefined}
              onClick={() => onChon(m)}
              aria-current={chon}
              className="flex min-w-[124px] flex-col gap-[4px] rounded-[var(--radius-buttons)] px-[14px] py-[12px] text-left transition-colors"
              style={{
                background: chon ? 'var(--fg)' : 'var(--surface-card)',
                color: chon ? 'var(--bg)' : 'var(--fg)',
                boxShadow: chon ? 'none' : 'inset 0 0 0 1px var(--line-strong)',
              }}
            >
              <span className="text-[15px] font-semibold">{m.nhan}</span>
              <span
                className="text-[12px]"
                style={{ color: chon ? 'var(--bg)' : 'var(--fg-muted)', opacity: chon ? 0.8 : 1 }}
              >
                {m.phu}
              </span>
              {m.dangDienRa && (
                <span
                  className="mt-[2px] text-[11px] font-semibold uppercase"
                  style={{
                    letterSpacing: '0.08em',
                    color: chon ? 'var(--bg)' : 'var(--chart-tot)',
                  }}
                >
                  {t.hanhTrinh.dangDienRa}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
