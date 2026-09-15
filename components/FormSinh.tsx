'use client';

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

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
        {label}
      </span>
      {children}
    </label>
  );
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
    <div className="grid gap-[18px] sm:grid-cols-2">
      <Field label="Họ tên">
        <input
          value={giaTri.hoTen}
          onChange={(e) => set('hoTen', e.target.value)}
          placeholder="Nguyễn Văn A"
          className="field-input"
        />
      </Field>
      <Field label="Ngày sinh (dương lịch)">
        <input
          type="date"
          value={giaTri.ngaySinh}
          onChange={(e) => set('ngaySinh', e.target.value)}
          className="field-input"
        />
      </Field>
      <Field label="Giờ sinh">
        <select
          value={giaTri.gio}
          onChange={(e) => set('gio', Number(e.target.value))}
          className="field-input"
        >
          {GIO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Giới tính">
        <select
          value={giaTri.gioiTinh}
          onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
          className="field-input"
        >
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </select>
      </Field>
    </div>
  );
}

export function tachNgaySinh(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}
