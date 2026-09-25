'use client';

/**
 * THANH TAB của trang /la-so (25/09/2026).
 *
 * Vì sao có: trang lá số từng xếp dọc sáu khối — ba thẻ đánh giá, bản đồ mạnh–
 * yếu, thẻ mời chuyên sâu, luận tổng quan, đọc dài, hỏi Celes — nên phần người ta
 * đến để đọc (luận tổng quan) nằm tận màn thứ tư, và luận chuyên sâu chỉ là một
 * thẻ giữa trang. Tab cho thấy NGAY từ màn đầu trang có bao nhiêu phần, mỗi phần
 * lớn cỡ nào (số đi kèm), và mỗi phần là một chỗ riêng thay vì một đoạn cuộn.
 *
 * Dính dưới thanh điều hướng khi cuộn; trên điện thoại cuộn ngang được nếu chật.
 * Mẫu ARIA tablist: mũi tên trái/phải chuyển tab.
 */

export interface MucTab {
  id: string;
  nhan: string;
  /** Con số nhỏ bên cạnh — cho biết phần này lớn cỡ nào */
  dem?: string;
  /** Chỉ hiện dưới 1024px (tab mệnh bàn — trên máy tính mệnh bàn đã đứng ở cột trái) */
  chiDienThoai?: boolean;
}

export function TabLaSo({
  tabs,
  chon,
  onChon,
}: {
  tabs: MucTab[];
  chon: string;
  onChon: (id: string) => void;
}) {
  const diChuyen = (buoc: number) => {
    const hien = tabs.filter((t) => !t.chiDienThoai || window.innerWidth < 1024);
    const i = hien.findIndex((t) => t.id === chon);
    const moi = hien[(i + buoc + hien.length) % hien.length];
    if (!moi) return;
    onChon(moi.id);
    document.getElementById(`tab-${moi.id}`)?.focus();
  };

  return (
    <div
      className="sticky top-[76px] z-20 -mx-[24px] px-[24px] py-[8px] lg:top-[65px] lg:mx-0 lg:px-0"
      style={{ background: 'var(--bg)' }}
    >
      <div
        role="tablist"
        aria-label="Các phần của lá số"
        className="flex gap-[4px] overflow-x-auto rounded-[16px] p-[4px] [scrollbar-width:none]"
        style={{ background: 'color-mix(in srgb, var(--fg) 6%, transparent)' }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            diChuyen(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            diChuyen(-1);
          }
        }}
      >
        {tabs.map((t) => {
          const dang = chon === t.id;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={dang}
              aria-controls={`panel-${t.id}`}
              tabIndex={dang ? 0 : -1}
              onClick={() => onChon(t.id)}
              className={`flex min-h-[44px] flex-1 shrink-0 items-center justify-center gap-[8px] whitespace-nowrap rounded-[12px] px-[8px] text-[13px] transition-colors sm:px-[12px] sm:text-[14px] ${t.chiDienThoai ? 'lg:hidden' : ''}`}
              style={{
                background: dang ? 'var(--surface-card)' : 'transparent',
                boxShadow: dang ? 'var(--shadow-card)' : 'none',
                color: dang ? 'var(--fg)' : 'var(--fg-muted)',
                fontWeight: dang ? 600 : 500,
              }}
            >
              {t.nhan}
              {t.dem && (
                <span
                  className="hidden rounded-full px-[8px] text-[12px] font-semibold leading-[20px] sm:inline"
                  style={{
                    background: dang ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'color-mix(in srgb, var(--fg) 8%, transparent)',
                    color: dang ? 'var(--accent)' : 'var(--fg-muted)',
                  }}
                >
                  {t.dem}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
