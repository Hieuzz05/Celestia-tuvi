'use client';

import type { NguonTriThuc as Nguon } from '@/lib/ai/goiLuanGiai';

/**
 * Cho người đọc biết bản luận giải này dựa trên tài liệu nào trong kho — không
 * có phần này thì không phân biệt được đâu là kiến thức từ tài liệu đã nạp, đâu
 * là kiến thức chung của model.
 */
export function NguonTriThuc({ nguon }: { nguon?: Nguon[] }) {
  if (!nguon || nguon.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-[4px] rounded-[var(--radius-cards)] border p-[12px]"
      style={{ borderColor: 'var(--line)' }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent)' }}>
        Trích từ kho tri thức
      </span>
      {nguon.map((n, i) => (
        <span key={`${n.tieuDe}-${i}`} className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
          {n.tieuDe} · {n.hePhai} · {n.diem}% liên quan
        </span>
      ))}
    </div>
  );
}
