'use client';

import type { MucSau } from '@/lib/rag/ban-doc-sau';
import { ChuSao } from './ChuSao';

/**
 * KHỐI GƯƠNG — đọc một phần QUA cung đối diện.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO NÓ ĐẢO MÀU, VÀ VÌ SAO ĐIỀU ĐÓ KHÔNG PHẢI TRANG TRÍ
 *
 * Mười hai phần của bài đọc như mười hai chương về mười hai chuyện. Khối gương
 * là chỗ DUY NHẤT bài thôi nói về một phần đời và bắt đầu nói về QUAN HỆ giữa
 * hai phần: tiền soi qua sự an yên, công việc soi qua chuyện đôi lứa.
 *
 * Nếu nó trông giống mọi đoạn khác thì người đọc lướt qua và mất đúng thứ làm
 * bài này khác một bản tra cứu. Đảo nền là cách rẻ nhất để mắt dừng lại.
 *
 * ---------------------------------------------------------------------------
 * CHÂN KHỐI NÓI RÕ GƯƠNG ĐANG NỐI ĐI ĐÂU
 *
 * Gương BẮC CẦU sang chặng khác thì hiện "↑ nối về …" và bấm được — đó là cơ
 * chế chống đọc tuyến tính. Gương NỘI BỘ (hai phần cùng chặng soi nhau) thì
 * hiện "↔ cặp với …", vì nói "nối về" cho một thứ nằm ngay cạnh là nói sai.
 */
export function KhoiGuong({
  muc,
  noiDung,
  luongNguoc,
  nhan,
  tenPhanGuong,
  tenChangGuong,
  onNhay,
  tenCoThat = [],
}: {
  muc: MucSau;
  nhan: string;
  noiDung: string;
  luongNguoc: string | null;
  /** Tiêu đề phần mà cung gương ứng vào — dùng cho gương nội bộ */
  tenPhanGuong?: string;
  /** Tên chặng của phần gương — dùng cho gương bắc cầu */
  tenChangGuong?: string;
  onNhay?: () => void;
  /** Tên sao và cách cục có thật trên lá số — chỉ tô màu những tên này */
  tenCoThat?: readonly string[];
}) {
  const chan = muc.guongNoiBo
    ? tenPhanGuong && `↔ cặp với: ${tenPhanGuong}`
    : tenChangGuong && `↑ nối về: ${tenChangGuong}`;

  return (
    // `.dark-band` tự khoá bộ token của nền tím ở cả hai theme. Nền khối là `--surface-card`
    // của dải, kèm viền `--line`: ở theme Đêm nền trang cũng là aubergine, thiếu viền là khối chìm.
    <aside
      className="dark-band flex flex-col gap-[12px] rounded-[var(--radius-cards)] p-[24px]"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--line)' }}
    >
      <p className="text-[13px] font-semibold" style={{ color: 'var(--fg-soft)' }}>
        Soi qua {muc.cungGuong}
      </p>

      <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
        {nhan}
      </h3>

      {/*
        Trong khối đảo màu, tên sao dùng `--accent-chu` của dải (fuchsia nhạt) chứ không dùng
        `--accent`: cùng một màu đọc rất khác trên nền tím đậm và trên nền kem.
      */}
      <ChuSao
        van={noiDung}
        ten={tenCoThat}
        mauTen="var(--accent-chu)"
        className="text-[16px]"
        style={{ color: 'var(--fg-body)', lineHeight: 1.65 }}
      />

      {luongNguoc && (
        <ChuSao
          van={luongNguoc}
          ten={tenCoThat}
          mauTen="var(--accent-chu)"
          className="text-[15px]"
          style={{ color: 'var(--fg-soft)', lineHeight: 1.6 }}
        />
      )}

      {chan &&
        (onNhay ? (
          <button
            onClick={onNhay}
            className="self-start text-[13px] underline underline-offset-4"
            style={{ color: 'var(--accent-chu)' }}
          >
            {chan}
          </button>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--fg-soft)' }}>
            {chan}
          </p>
        ))}
    </aside>
  );
}
