'use client';

/** Markdown tối giản: đủ cho đề mục ##, **đậm**, gạch đầu dòng và đoạn văn */
export function MarkdownLuanGiai({ noiDung, nho }: { noiDung: string; nho?: boolean }) {
  const dong = noiDung.split('\n').filter((d) => d.trim());
  const coChu = nho ? 'text-[14px]' : 'text-[16px]';

  const dam = (s: string) =>
    s.split(/\*\*(.+?)\*\*/g).map((phan, j) =>
      j % 2 === 1 ? (
        <strong key={j} style={{ color: 'var(--fg)' }}>
          {phan}
        </strong>
      ) : (
        <span key={j}>{phan}</span>
      )
    );

  return (
    <div className="flex flex-col gap-[10px]">
      {dong.map((d, i) => {
        if (d.startsWith('## ')) {
          return (
            <h3
              key={i}
              className={nho ? 'subheading mt-[14px]' : 'heading-sm mt-[20px]'}
              style={nho ? { fontSize: 18 } : undefined}
            >
              {d.slice(3)}
            </h3>
          );
        }
        if (d.startsWith('# ')) {
          return (
            <h2 key={i} className="heading-sm mt-[18px]">
              {d.slice(2)}
            </h2>
          );
        }
        if (/^[-*]\s/.test(d)) {
          return (
            <p key={i} className={`${coChu} pl-[16px]`} style={{ color: 'var(--fg-body)' }}>
              • {dam(d.replace(/^[-*]\s/, ''))}
            </p>
          );
        }
        if (/^-{3,}$/.test(d)) return null;
        return (
          <p key={i} className={coChu} style={{ color: 'var(--fg-body)', lineHeight: 1.6 }}>
            {dam(d)}
          </p>
        );
      })}
    </div>
  );
}
