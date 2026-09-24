'use client';

import { useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { PillTag } from '@/components/ui';
import { useNgonNgu } from '@/lib/i18n/context';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';

/**
 * Khối xem trước trên landing.
 *
 * Đây là góc nhìn thật, tính từ một ngày sinh mẫu bằng chính engine của sản phẩm,
 * chứ không phải chữ viết sẵn. Người chưa tạo lá số vẫn bấm được "Vì sao?" và thấy
 * đúng thứ họ sẽ nhận — đó là cách thuyết phục rẻ nhất mà không phải hứa hẹn gì.
 */

const NGUOI_MAU = [
  { nhan: 'Nam · 2000', nhanEn: 'Male · 2000', ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' as const },
  { nhan: 'Nữ · 1995', nhanEn: 'Female · 1995', ngay: 12, thang: 3, nam: 1995, gio: 15, gioiTinh: 'nu' as const },
  { nhan: 'Nam · 1988', nhanEn: 'Male · 1988', ngay: 2, thang: 11, nam: 1988, gio: 23, gioiTinh: 'nam' as const },
];

export function LaSoMau() {
  const { ngonNgu, t } = useNgonNgu();
  const [chon, setChon] = useState(0);
  const namNay = new Date().getFullYear();

  const gocNhin = useMemo(() => {
    const m = NGUOI_MAU[chon];
    return docNhanh(lapLaSo({ ...m }), namNay, undefined, ngonNgu);
  }, [chon, namNay, ngonNgu]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center justify-center gap-[8px]">
        <span className="caption">{t.landing.thuNgaySinhKhac}</span>
        {NGUOI_MAU.map((m, i) => (
          // Nhãn "1 / 2 / 3" (32px) không nói mình đang xem gì — đo 24/09/2026
          <PillTag
            key={m.nhan}
            dangChon={i === chon}
            aria-pressed={i === chon}
            className="min-h-[44px]"
            onClick={() => setChon(i)}
          >
            {ngonNgu === 'en' ? m.nhanEn : m.nhan}
          </PillTag>
        ))}
      </div>

      <div className="grid gap-[16px] md:grid-cols-3">
        {gocNhin.map((g) => (
          <GocNhinCard key={g.id} gocNhin={g} nho />
        ))}
      </div>
    </div>
  );
}
