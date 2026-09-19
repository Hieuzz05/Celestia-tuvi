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
        /*
         * `###` phải xét TRƯỚC `##`, và phải có mặt ở đây.
         *
         * Bài dài dựng mỗi điểm mạnh và mỗi chỗ dễ mắc kẹt bằng một đề mục cấp
         * ba (`dungVanBaiDai`). Bộ vẽ này chỉ biết `#` và `##`, nên mọi đề mục
         * cấp ba rơi xuống nhánh đoạn văn và hiện ra nguyên ba dấu thăng trước
         * mặt người đọc — dấu hiệu lộ liễu nhất của chữ do máy sinh chưa qua
         * khâu nào.
         *
         * Thứ tự xét là dài trước ngắn sau: `'### x'.startsWith('## ')` trả
         * false nên ba nhánh không giẫm nhau, nhưng để `###` sau `##` là mời
         * người sửa tiếp theo thêm nhầm chỗ.
         */
        if (d.startsWith('### ')) {
          return (
            <h4
              key={i}
              className={nho ? 'subheading mt-[10px]' : 'subheading mt-[16px]'}
              style={{ color: 'var(--fg)', fontSize: nho ? 15 : 17 }}
            >
              {dam(d.slice(4))}
            </h4>
          );
        }
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
        /*
         * Lưới an toàn cuối: mọi dấu thăng còn sót đều bị gỡ.
         *
         * Ba nhánh trên chỉ biết `#`, `##`, `###`. Model có thể viết `####`
         * hoặc `#####`, và bất kỳ mức nào chưa được xử lý sẽ hiện nguyên dấu
         * thăng. Thà mất một cấp đề mục còn hơn để lộ cú pháp Markdown thô —
         * người đọc không cần biết bài này đi qua Markdown.
         */
        const sach = d.replace(/^#{1,6}\s+/, '');
        return (
          <p key={i} className={coChu} style={{ color: 'var(--fg-body)', lineHeight: 1.6 }}>
            {dam(sach)}
          </p>
        );
      })}
    </div>
  );
}
