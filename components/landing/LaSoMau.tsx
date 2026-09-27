'use client';

import { useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { PillTag } from '@/components/ui';
import { useNgonNgu } from '@/lib/i18n/context';
import type { MauDaTinh } from '@/lib/tuvi/la-so-mau';

/**
 * Khối xem trước trên landing.
 *
 * Đây là góc nhìn thật, tính từ một ngày sinh mẫu bằng chính engine của sản phẩm,
 * chứ không phải chữ viết sẵn. Người chưa tạo lá số vẫn bấm được "Vì sao?" và thấy
 * đúng thứ họ sẽ nhận — đó là cách thuyết phục rẻ nhất mà không phải hứa hẹn gì.
 *
 * Người mẫu đầu tính sẵn ở máy chủ (`lib/tuvi/la-so-mau.ts`); bấm người khác mới nạp
 * engine về và tính — engine không nằm trong gói JS tải trước lần vẽ đầu.
 */
export function LaSoMau({
  nhan,
  mauDau,
  namXem,
}: {
  nhan: { nhan: string; nhanEn: string }[];
  mauDau: MauDaTinh;
  namXem: number;
}) {
  const { ngonNgu, t } = useNgonNgu();
  const [chon, setChon] = useState(0);
  const [daTinh, setDaTinh] = useState<Record<number, MauDaTinh>>({ 0: mauDau });

  const chonMau = (i: number) => {
    setChon(i);
    if (daTinh[i]) return;
    import('@/lib/tuvi/la-so-mau').then(({ tinhMotMau }) => {
      setDaTinh((cu) => (cu[i] ? cu : { ...cu, [i]: tinhMotMau(i, namXem) }));
    });
  };

  // Chưa tính xong người vừa chọn thì giữ thẻ đang hiện — không để khoảng trống nhảy
  const gocNhin = (daTinh[chon] ?? daTinh[0])[ngonNgu];

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center justify-center gap-[8px]">
        <span className="caption">{t.landing.thuNgaySinhKhac}</span>
        {nhan.map((m, i) => (
          // Nhãn "1 / 2 / 3" (32px) không nói mình đang xem gì — đo 24/09/2026
          <PillTag
            key={m.nhan}
            dangChon={i === chon}
            aria-pressed={i === chon}
            className="min-h-[44px]"
            onClick={() => chonMau(i)}
          >
            {ngonNgu === 'en' ? m.nhanEn : m.nhan}
          </PillTag>
        ))}
      </div>

      <div className="grid gap-[16px] md:grid-cols-3">
        {gocNhin.map((g) => (
          // Nằm trong hero, ngay dưới h1 — chưa có h2 nào phía trên nên thẻ dùng h2
          <GocNhinCard key={g.id} gocNhin={g} nho cap="h2" />
        ))}
      </div>
    </div>
  );
}
