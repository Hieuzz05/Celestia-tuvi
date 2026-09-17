'use client';

import { DANH_SACH_Y_DINH, type YDinhKetNoi } from '@/lib/ket-noi/y-dinh';

/**
 * Chọn mục đích so sánh.
 *
 * Dùng thẻ bấm chứ không dùng ô chọn xổ xuống. Đây là quyết định đổi hẳn nội
 * dung kết quả, nên người dùng cần nhìn thấy các lựa chọn cùng lúc và đọc được
 * một dòng giải thích — thứ mà một dropdown giấu đi mất.
 */
export function ChonYDinh({
  giaTri,
  onChon,
}: {
  giaTri: YDinhKetNoi;
  onChon: (y: YDinhKetNoi) => void;
}) {
  return (
    <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
      {DANH_SACH_Y_DINH.map((y) => {
        const dangChon = y.id === giaTri;
        return (
          <button
            key={y.id}
            type="button"
            onClick={() => onChon(y.id)}
            aria-pressed={dangChon}
            className="flex min-h-[72px] flex-col gap-[4px] rounded-[var(--radius-cards)] border p-[14px] text-left"
            style={{
              borderColor: dangChon ? 'var(--accent)' : 'var(--line)',
              background: dangChon ? 'var(--surface-panel)' : 'var(--surface-card)',
              // Viền dày thêm thay vì đổi màu nền đậm: giữ đúng một nút chính
              // rực rỡ trên mỗi màn, đây không phải nút đó.
              boxShadow: dangChon ? 'inset 0 0 0 1px var(--accent)' : 'none',
            }}
          >
            <span
              className="text-[15px] font-medium"
              style={{ color: dangChon ? 'var(--fg)' : 'var(--fg-body)' }}
            >
              {y.nhan}
            </span>
            <span className="text-[12px] leading-[1.45]" style={{ color: 'var(--fg-muted)' }}>
              {y.moTa}
            </span>
          </button>
        );
      })}
    </div>
  );
}
