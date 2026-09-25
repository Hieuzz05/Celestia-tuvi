'use client';

import { useEffect, useState } from 'react';

interface DongSuCo {
  nguon: string;
  provider: string;
  model: string | null;
  loai: string;
  nang: boolean;
  thong_diep: string;
  luc: string;
}

const NHAN_LOAI: Record<string, string> = {
  quota: 'Hết credit / hết quota',
  auth: 'API key không hợp lệ',
  'rate-limit': 'Gọi quá nhanh',
  server: 'Lỗi nhà cung cấp',
  network: 'Lỗi mạng',
};

/**
 * Sự cố AI 24 giờ qua, đặt ĐẦU trang quản trị.
 *
 * Có sự cố nặng (hết credit, key sai) thì hiện dải đỏ — thứ không tự khỏi, phải
 * có người làm gì đó. Chỉ sự cố nhẹ thì hiện gọn một dòng. Không có gì thì im.
 */
export function SuCoAi() {
  const [ds, setDs] = useState<DongSuCo[] | null>(null);
  const [coWebhook, setCoWebhook] = useState(true);

  useEffect(() => {
    fetch('/api/admin/su-co')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setDs(d?.suCo ?? []);
        setCoWebhook(Boolean(d?.coWebhook));
      })
      .catch(() => setDs([]));
  }, []);

  if (!ds || ds.length === 0) return null;
  const nang = ds.filter((d) => d.nang);

  return (
    <section
      className="card flex flex-col gap-[12px]"
      style={{ borderLeft: `4px solid ${nang.length ? 'var(--chart-hung)' : 'var(--line-strong)'}` }}
      role={nang.length ? 'alert' : undefined}
    >
      <h2 className="text-[19px] font-semibold" style={{ color: 'var(--fg)' }}>
        {nang.length
          ? `${nang.length} sự cố AI cần xử lý trong 24 giờ qua`
          : `${ds.length} sự cố AI nhẹ trong 24 giờ qua (thường tự hết)`}
      </h2>
      <ul className="flex flex-col gap-[8px]">
        {ds.slice(0, 8).map((d, i) => (
          <li key={i} className="body-sm" style={{ color: d.nang ? 'var(--chart-hung)' : 'var(--fg-muted)' }}>
            <strong>{NHAN_LOAI[d.loai] ?? d.loai}</strong> · {d.provider}
            {d.model ? `/${d.model}` : ''} · {d.nguon} · {new Date(d.luc).toLocaleString('vi-VN')}
            <br />
            <span className="caption">{d.thong_diep}</span>
          </li>
        ))}
      </ul>
      {!coWebhook && (
        <p className="caption">
          Muốn nhận báo ngay qua Slack / Discord / Google Chat: đặt biến môi trường CANH_BAO_WEBHOOK_URL trên Vercel.
        </p>
      )}
    </section>
  );
}
