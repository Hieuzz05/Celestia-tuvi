'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { O, OChon, Truong } from '@/components/ui';
import type { GioiTinh } from '@/lib/tuvi/ansao';

/*
 * Nhãn đặt GIỜ ĐỒNG HỒ TRƯỚC, tên chi sau.
 *
 * Bản cũ ghi "Tý · 23:00 – 00:59" — đặt đúng từ người mới không hiểu lên đầu
 * danh sách. Người biết tử vi vẫn nhận ra tên chi ở vế sau, còn người chưa
 * biết gì thì đọc được ngay từ chữ đầu tiên. Không mất gì, được một nhóm.
 */
export const GIO_OPTIONS = [
  { value: 23, label: '23:00 – 00:59 · giờ Tý' },
  { value: 1, label: '01:00 – 02:59 · giờ Sửu' },
  { value: 3, label: '03:00 – 04:59 · giờ Dần' },
  { value: 5, label: '05:00 – 06:59 · giờ Mão' },
  { value: 7, label: '07:00 – 08:59 · giờ Thìn' },
  { value: 9, label: '09:00 – 10:59 · giờ Tỵ' },
  { value: 11, label: '11:00 – 12:59 · giờ Ngọ' },
  { value: 13, label: '13:00 – 14:59 · giờ Mùi' },
  { value: 15, label: '15:00 – 16:59 · giờ Thân' },
  { value: 17, label: '17:00 – 18:59 · giờ Dậu' },
  { value: 19, label: '19:00 – 20:59 · giờ Tuất' },
  { value: 21, label: '21:00 – 22:59 · giờ Hợi' },
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
  const t = useT();
  const [hienGiupGio, setHienGiupGio] = useState<boolean>(false);
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
        {/*
          LỐI THOÁT CHO NGƯỜI KHÔNG NHỚ GIỜ.
          Màn onboarding ở /la-so đã có phần này từ trước; form dùng chung ở
          Hỏi Celes và Kết nối thì chưa, nên cùng một người gặp hai trải nghiệm
          khác nhau tuỳ vào cửa họ bước vào. Dùng lại đúng chữ của onboarding
          thay vì viết lại: hai bản chữ cho cùng một việc thì sớm muộn lệch.
        */}
        <button
          type="button"
          onClick={() => setHienGiupGio((v) => !v)}
          className="link-text link-action self-start"
          aria-expanded={hienGiupGio}
        >
          {t.onboarding.khongNhoGio}
        </button>
        {hienGiupGio && (
          <div
            className="flex flex-col gap-[8px] pt-[10px]"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.onboarding.khongNhoGioY1}
            </p>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.onboarding.khongNhoGioY2}
            </p>
          </div>
        )}
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
