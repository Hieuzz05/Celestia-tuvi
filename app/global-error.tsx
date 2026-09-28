'use client';

import { useEffect } from 'react';
import './globals.css';

/**
 * Chỉ hiện khi chính layout gốc hỏng (provider ngôn ngữ, bối cảnh lá số, thanh
 * điều hướng). Lúc đó không còn từ điển hay theme, nên chữ viết thẳng ở đây,
 * hai thứ tiếng, và màu lấy theo token mặc định của theme Ngày.
 */
export default function LoiGoc({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[loi-goc]', error.digest ?? '', error);
  }, [error]);

  return (
    <html lang="vi" data-theme="day">
      <body style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '60px 16px' }}>
          <h1 className="heading">Celestia vừa gặp trục trặc</h1>
          <p className="body-text" style={{ marginTop: 16, color: 'var(--fg-muted)' }}>
            Lá số và dữ liệu của bạn vẫn còn nguyên. Thử tải lại; nếu chưa được, quay lại sau ít phút.
          </p>
          <p className="body-text" style={{ marginTop: 8, color: 'var(--fg-muted)' }} lang="en">
            Your chart and data are safe. Try again, or come back in a few minutes.
          </p>
          <button type="button" className="btn-primary" style={{ marginTop: 24 }} onClick={() => retry()}>
            Thử lại · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
