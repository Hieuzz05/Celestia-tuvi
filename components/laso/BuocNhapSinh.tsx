'use client';

import { useState } from 'react';
import { NutChinh, NutVien, O, OChon, PillTag, Truong } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useT } from '@/lib/i18n/context';
import { hourToChi } from '@/lib/tuvi/lunar';
import { CHI } from '@/lib/tuvi/constants';
import type { GioiTinh } from '@/lib/tuvi/ansao';

/**
 * Onboarding: Celes làm quen với người dùng.
 *
 * Bước đầu KHÔNG hỏi ngày sinh mà hỏi điều đang khiến họ bận tâm. Hai lý do: câu
 * đầu tiên quyết định người ta cảm thấy đang nói chuyện với ai, và lựa chọn đó
 * còn dùng để chọn góc nhìn nào nên đưa lên trước ở màn kết quả.
 *
 * Các bước sau chia nhỏ để mỗi màn chỉ hỏi một việc, và luôn nói rõ vì sao cần
 * thông tin đó.
 */

export type YDinh = 'banThan' | 'congViec' | 'tinhCam' | 'quyetDinh';

export interface ThongTinSinhForm {
  hoTen: string;
  ngaySinh: string;
  /** Giờ trong ngày 0-23 */
  gio: number;
  phut: number;
  gioiTinh: GioiTinh;
  /** Điều người dùng đang bận tâm — dùng để sắp xếp góc nhìn ở màn kết quả */
  yDinh?: YDinh;
}

export const MAC_DINH: ThongTinSinhForm = {
  hoTen: '',
  ngaySinh: '',
  gio: 9,
  phut: 0,
  gioiTinh: 'nam',
};

const THU_TU_Y_DINH: YDinh[] = ['banThan', 'congViec', 'tinhCam', 'quyetDinh'];
const TONG_BUOC = 4;

export function BuocNhapSinh({
  giaTriDau = MAC_DINH,
  onXong,
}: {
  giaTriDau?: ThongTinSinhForm;
  onXong: (v: ThongTinSinhForm) => void;
}) {
  const t = useT();
  const [buoc, setBuoc] = useState(1);
  const [form, setForm] = useState<ThongTinSinhForm>(giaTriDau);
  const [hienGiaiThichGio, setHienGiaiThichGio] = useState(false);

  const set = <K extends keyof ThongTinSinhForm>(k: K, v: ThongTinSinhForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const ngayHopLe =
    /^\d{4}-\d{2}-\d{2}$/.test(form.ngaySinh) && !Number.isNaN(Date.parse(form.ngaySinh));

  const tien = () => {
    if (buoc === 1) ghiSuKien('birth_flow_started', { yDinh: form.yDinh });
    if (buoc < TONG_BUOC) {
      setBuoc((b) => b + 1);
      return;
    }
    onXong(form);
  };

  const gioChi = CHI[hourToChi(form.gio)];

  return (
    <div className="card mx-auto flex w-full max-w-[560px] flex-col gap-[24px]">
      {/* Chỉ báo tiến độ — cho biết còn bao xa, giảm cảm giác form dài vô tận */}
      <div className="flex flex-col gap-[8px]">
        <span className="eyebrow">
          {t.onboarding.buoc} {buoc} / {TONG_BUOC}
        </span>
        <div className="flex gap-[4px]" aria-hidden>
          {Array.from({ length: TONG_BUOC }, (_, i) => (
            <span
              key={i}
              className="h-[3px] flex-1 rounded-full"
              style={{ background: i < buoc ? 'var(--fg)' : 'var(--line)' }}
            />
          ))}
        </div>
      </div>

      {buoc === 1 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">{t.onboarding.yDinhTieuDe}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.onboarding.yDinhMo}
          </p>

          <div className="flex flex-col gap-[8px]">
            {THU_TU_Y_DINH.map((y) => (
              <button
                key={y}
                onClick={() => set('yDinh', y)}
                className="flex flex-col gap-[2px] rounded-[var(--radius-buttons)] p-[14px] text-left transition-colors"
                style={{
                  boxShadow:
                    form.yDinh === y
                      ? 'inset 0 0 0 2px var(--fg)'
                      : 'inset 0 0 0 1px var(--line-input)',
                }}
                aria-pressed={form.yDinh === y}
              >
                <span className="text-[16px] font-medium" style={{ color: 'var(--fg)' }}>
                  {t.onboarding.yDinh[y]}
                </span>
                <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {t.onboarding.yDinhMoTa[y]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {buoc === 2 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">{t.onboarding.ngayTieuDe}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.onboarding.ngayMo}
          </p>
          <Truong nhan={t.onboarding.ngayNhan}>
            <O
              type="date"
              value={form.ngaySinh}
              onChange={(e) => set('ngaySinh', e.target.value)}
              autoFocus
            />
          </Truong>
        </div>
      )}

      {buoc === 3 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">{t.onboarding.gioTieuDe}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.onboarding.gioMo}
          </p>

          <div className="grid grid-cols-2 gap-[16px]">
            <Truong nhan={t.onboarding.gioNhan}>
              <OChon value={form.gio} onChange={(e) => set('gio', Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </OChon>
            </Truong>
            <Truong nhan={t.onboarding.phutNhan}>
              <OChon value={form.phut} onChange={(e) => set('phut', Number(e.target.value))}>
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </OChon>
            </Truong>
          </div>

          <p className="body-sm" style={{ color: 'var(--fg)' }}>
            {dien(t.onboarding.gioKhop, { chi: gioChi })}
          </p>

          <button
            type="button"
            onClick={() => setHienGiaiThichGio((v) => !v)}
            className="link-text self-start"
            aria-expanded={hienGiaiThichGio}
          >
            {t.onboarding.khongNhoGio}
          </button>

          {hienGiaiThichGio && (
            <div
              className="flex flex-col gap-[8px] pt-[12px]"
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
        </div>
      )}

      {buoc === 4 && (
        <div className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">{t.onboarding.xacNhanTieuDe}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.onboarding.xacNhanMo}
          </p>

          <Truong nhan={t.onboarding.gioiTinh} goiY={t.onboarding.gioiTinhY}>
            <div className="flex gap-[8px]">
              <PillTag
                dangChon={form.gioiTinh === 'nam'}
                onClick={() => set('gioiTinh', 'nam')}
              >
                {t.onboarding.nam}
              </PillTag>
              <PillTag dangChon={form.gioiTinh === 'nu'} onClick={() => set('gioiTinh', 'nu')}>
                {t.onboarding.nu}
              </PillTag>
            </div>
          </Truong>

          <Truong nhan={t.onboarding.tenGoi} goiY={t.onboarding.tenGoiY}>
            <O
              value={form.hoTen}
              onChange={(e) => set('hoTen', e.target.value)}
              placeholder={t.onboarding.tenGoiVD}
            />
          </Truong>
        </div>
      )}

      <div className="flex items-center gap-[12px]">
        {buoc > 1 && (
          <NutVien nho onClick={() => setBuoc((b) => b - 1)}>
            {t.chung.quayLai}
          </NutVien>
        )}
        <NutChinh
          onClick={tien}
          disabled={(buoc === 1 && !form.yDinh) || (buoc === 2 && !ngayHopLe)}
          className="ml-auto"
        >
          {buoc < TONG_BUOC ? t.chung.tiepTuc : t.onboarding.xong}
        </NutChinh>
      </div>
    </div>
  );
}
