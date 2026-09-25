import type { CauV3 } from './CauTraLoiV3';

/**
 * GỢI Ý CỦA CELES — gom gợi ý của các câu thành MỘT phần riêng (25/09/2026).
 *
 * Chủ dự án: "không nên mỗi câu hỏi đều có lời khuyên, có thể tổng hợp thành một
 * phần riêng" — câu nào cũng kết bằng lời khuyên thì đọc như bị giao việc. Mỗi
 * câu giờ trả gợi ý ở trường `goiY` (không nằm trong bài luận); khối này gom lại,
 * bỏ trùng, tối đa năm gợi ý, kèm câu hỏi nó đi ra để người đọc biết vì sao.
 * Không tốn thêm lượt gọi model nào.
 */
export function GoiYCeles({ cau, moTa }: { cau: CauV3[] | null; moTa?: string }) {
  const daCo = new Set<string>();
  const ds = (cau ?? [])
    .filter((c) => !c.chuaViet && c.goiY?.trim())
    .filter((c) => {
      const k = c.goiY!.trim().toLowerCase();
      if (daCo.has(k)) return false;
      daCo.add(k);
      return true;
    })
    .slice(0, 5);
  if (!ds.length) return null;

  return (
    <section
      className="flex flex-col gap-[16px] rounded-[var(--radius-cards)] p-[24px]"
      style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)' }}
      aria-labelledby="goi-y-celes"
    >
      <div className="flex flex-col gap-[4px]">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
          Gợi ý của Celes
        </span>
        <h2 id="goi-y-celes" className="text-[20px] font-semibold leading-snug" style={{ color: 'var(--fg)' }}>
          Vài điều bạn có thể cân nhắc
        </h2>
        {moTa && (
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {moTa}
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-[16px]">
        {ds.map((c) => (
          <li key={c.id} className="flex items-start gap-[12px]">
            <span className="mt-[8px] h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden />
            <span className="flex flex-col gap-[4px]">
              <span className="body-text" style={{ color: 'var(--fg)' }}>
                {c.goiY}
              </span>
              <span className="caption" style={{ color: 'var(--fg-muted)' }}>
                Từ phần “{c.cauHoi}”
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="caption" style={{ color: 'var(--fg-muted)' }}>
        Đây là gợi ý để tham khảo, không phải việc bắt buộc — bạn chọn điều hợp với mình.
      </p>
    </section>
  );
}
