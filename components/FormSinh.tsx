'use client';

import { useState } from 'react';
import { dien, useT } from '@/lib/i18n/context';
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
  { value: 23, khung: '23:00 – 00:59', chi: 'Tý' },
  { value: 1, khung: '01:00 – 02:59', chi: 'Sửu' },
  { value: 3, khung: '03:00 – 04:59', chi: 'Dần' },
  { value: 5, khung: '05:00 – 06:59', chi: 'Mão' },
  { value: 7, khung: '07:00 – 08:59', chi: 'Thìn' },
  { value: 9, khung: '09:00 – 10:59', chi: 'Tỵ' },
  { value: 11, khung: '11:00 – 12:59', chi: 'Ngọ' },
  { value: 13, khung: '13:00 – 14:59', chi: 'Mùi' },
  { value: 15, khung: '15:00 – 16:59', chi: 'Thân' },
  { value: 17, khung: '17:00 – 18:59', chi: 'Dậu' },
  { value: 19, khung: '19:00 – 20:59', chi: 'Tuất' },
  { value: 21, khung: '21:00 – 22:59', chi: 'Hợi' },
];

/**
 * Đưa giờ thật (0–23) về đúng giá trị của ô chọn khung giờ.
 *
 * Luồng nhập từng bước ở /la-so lưu GIỜ THẬT (6, 20…), còn ô chọn ở đây chỉ có
 * giá trị đầu khung (23, 1, 3, 5…). Không khớp thì trình duyệt hiện dòng đầu
 * danh sách — đo 24/09/2026: lá số giờ Mão sang Khám phá hiện "23:00 – 00:59 ·
 * giờ Tý". Bài vẫn tính đúng vì state giữ số thật, nhưng người đọc thấy sai giờ
 * sinh của chính mình — hoặc tự chọn lại thành sai thật.
 */
export function veKhungGio(gio: number): number {
  if (gio === 0 || gio === 23) return 23;
  return gio % 2 === 1 ? gio : gio - 1;
}

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
      <Truong nhan={t.formSinh.hoTen}>
        <O
          value={giaTri.hoTen}
          onChange={(e) => set('hoTen', e.target.value)}
          placeholder={t.formSinh.hoTenVD}
        />
      </Truong>
      <Truong nhan={t.onboarding.ngayNhan}>
        <O type="date" value={giaTri.ngaySinh} onChange={(e) => set('ngaySinh', e.target.value)} />
      </Truong>
      <Truong nhan={t.formSinh.gioSinh}>
        <OChon value={veKhungGio(giaTri.gio)} onChange={(e) => set('gio', Number(e.target.value))}>
          {GIO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {dien(t.formSinh.khungGio, { khung: o.khung, chi: o.chi })}
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
      <Truong nhan={t.onboarding.gioiTinh}>
        <OChon
          value={giaTri.gioiTinh}
          onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
        >
          <option value="nam">{t.onboarding.nam}</option>
          <option value="nu">{t.onboarding.nu}</option>
        </OChon>
      </Truong>
    </div>
  );
}

export function tachNgaySinh(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}
