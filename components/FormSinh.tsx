'use client';

import { O, OChon, Truong } from '@/components/ui';
import type { GioiTinh } from '@/lib/tuvi/ansao';

export const GIO_OPTIONS = [
  { value: 23, label: 'Tý · 23:00 – 00:59' },
  { value: 1, label: 'Sửu · 01:00 – 02:59' },
  { value: 3, label: 'Dần · 03:00 – 04:59' },
  { value: 5, label: 'Mão · 05:00 – 06:59' },
  { value: 7, label: 'Thìn · 07:00 – 08:59' },
  { value: 9, label: 'Tỵ · 09:00 – 10:59' },
  { value: 11, label: 'Ngọ · 11:00 – 12:59' },
  { value: 13, label: 'Mùi · 13:00 – 14:59' },
  { value: 15, label: 'Thân · 15:00 – 16:59' },
  { value: 17, label: 'Dậu · 17:00 – 18:59' },
  { value: 19, label: 'Tuất · 19:00 – 20:59' },
  { value: 21, label: 'Hợi · 21:00 – 22:59' },
];

export interface ThongTinForm {
  hoTen: string;
  ngaySinh: string;
  gio: number;
  gioiTinh: GioiTinh;
}

/** Giữ tên cũ để các trang không phải sửa import — bên trong dùng thẳng ô nhập của design system */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Truong nhan={label}>{children}</Truong>;
}

export function FormSinh({
  giaTri,
  onChange,
}: {
  giaTri: ThongTinForm;
  onChange: (v: ThongTinForm) => void;
}) {
  const set = <K extends keyof ThongTinForm>(k: K, v: ThongTinForm[K]) =>
    onChange({ ...giaTri, [k]: v });

  return (
    <div className="grid gap-[16px] sm:grid-cols-2">
      <Truong nhan="Họ tên">
        <O
          value={giaTri.hoTen}
          onChange={(e) => set('hoTen', e.target.value)}
          placeholder="Nguyễn Văn A"
        />
      </Truong>
      <Truong nhan="Ngày sinh (dương lịch)">
        <O type="date" value={giaTri.ngaySinh} onChange={(e) => set('ngaySinh', e.target.value)} />
      </Truong>
      <Truong nhan="Giờ sinh">
        <OChon value={giaTri.gio} onChange={(e) => set('gio', Number(e.target.value))}>
          {GIO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </OChon>
      </Truong>
      <Truong nhan="Giới tính">
        <OChon
          value={giaTri.gioiTinh}
          onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
        >
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </OChon>
      </Truong>
    </div>
  );
}

export function tachNgaySinh(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}
