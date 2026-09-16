'use client';

import { useEffect, useState } from 'react';

interface DongNhatKy {
  ngay: string;
  provider: string;
  model: string;
  soRequest: number;
  soLoi: number;
  tokensVao: number;
  tokensRa: number;
}

interface DuLieu {
  homNay: Record<string, number>;
  hanMuc: Record<string, number | null>;
  nhatKy: DongNhatKy[];
}

export function NhatKySuDung() {
  const [duLieu, setDuLieu] = useState<DuLieu | null>(null);

  useEffect(() => {
    fetch('/api/ai/su-dung')
      .then((r) => r.json())
      .then((d) => {
        if (!d.loi) setDuLieu(d);
      })
      .catch(() => setDuLieu(null));
  }, []);

  if (!duLieu) return null;

  const providers = Object.keys(duLieu.hanMuc);
  const coNhatKy = duLieu.nhatKy.length > 0;

  return (
    <section className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <h2 className="heading-sm">Mức sử dụng hôm nay</h2>
        <p className="body-text max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          Model dùng gần hết hạn mức miễn phí sẽ bị bỏ qua trước khi gọi, thay vì tiêu một lượt chỉ
          để nhận lỗi. Hạn mức dưới đây là con số ước lượng, đặt thấp hơn thực tế cho an toàn.
        </p>
      </div>

      <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-4">
        {providers.map((p) => {
          const daDung = duLieu.homNay[p] ?? 0;
          const han = duLieu.hanMuc[p];
          const tyLe = han ? Math.min(100, (daDung / han) * 100) : 0;
          const sapCan = han !== null && tyLe >= 80;

          return (
            <div
              key={p}
              className="flex flex-col gap-[8px] rounded-[var(--radius-cards)] border p-[14px]"
              style={{
                borderColor: sapCan ? 'var(--chart-hung)' : 'var(--line)',
                background: 'var(--surface-card)',
              }}
            >
              <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                {p}
              </span>
              <span className="text-[22px]" style={{ color: 'var(--fg)' }}>
                {daDung}
                {han !== null && (
                  <span className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                    {' '}
                    / {han}
                  </span>
                )}
              </span>
              {han !== null ? (
                <div className="h-[3px] w-full overflow-hidden" style={{ background: 'var(--line)' }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${tyLe}%`,
                      background: sapCan ? 'var(--chart-hung)' : 'var(--accent)',
                    }}
                  />
                </div>
              ) : (
                <span className="text-[12px]" style={{ color: 'var(--fg-subtle)' }}>
                  Trả phí — không chặn theo lượt
                </span>
              )}
              {sapCan && (
                <span className="text-[12px]" style={{ color: 'var(--chart-hung)' }}>
                  Sắp cạn, hệ thống sẽ chuyển sang model dự phòng
                </span>
              )}
            </div>
          );
        })}
      </div>

      {coNhatKy && (
        <div className="flex flex-col">
          <h3 className="subheading mb-[8px]">7 ngày gần đây</h3>
          <div
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-[16px] gap-y-[6px] text-[13px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            <span>Ngày</span>
            <span>Model</span>
            <span className="text-right">Lượt</span>
            <span className="text-right">Lỗi</span>
            <span className="text-right">Token ra</span>
            {duLieu.nhatKy.map((d, i) => (
              <div key={i} className="contents">
                <span>{d.ngay}</span>
                <span style={{ color: 'var(--fg-body)' }}>
                  {d.provider}/{d.model}
                </span>
                <span className="text-right tabular-nums" style={{ color: 'var(--fg-body)' }}>
                  {d.soRequest}
                </span>
                <span
                  className="text-right tabular-nums"
                  style={{ color: d.soLoi > 0 ? 'var(--chart-hung)' : undefined }}
                >
                  {d.soLoi}
                </span>
                <span className="text-right tabular-nums">{d.tokensRa.toLocaleString('vi')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
