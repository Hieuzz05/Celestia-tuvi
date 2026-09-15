'use client';

import { useMemo, useState } from 'react';
import { Field } from '@/components/FormSinh';
import { thongTinNgay } from '@/lib/tuvi/lich';
import { lunarToSolar } from '@/lib/tuvi/lunar';

function homNay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function LichPage() {
  const [ngayDuong, setNgayDuong] = useState(homNay());
  const [amNgay, setAmNgay] = useState(1);
  const [amThang, setAmThang] = useState(1);
  const [amNam, setAmNam] = useState(new Date().getFullYear());
  const [amNhuan, setAmNhuan] = useState(false);

  const tt = useMemo(() => {
    const [y, m, d] = ngayDuong.split('-').map(Number);
    if (!y || !m || !d) return null;
    return thongTinNgay(d, m, y);
  }, [ngayDuong]);

  const duongTuAm = useMemo(
    () => lunarToSolar(amNgay, amThang, amNam, amNhuan),
    [amNgay, amThang, amNam, amNhuan]
  );

  return (
    <main className="flex flex-col gap-[36px] py-[36px]">
      <div>
        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          Lịch âm dương
        </p>
        <h1 className="display mt-[18px]">Xem ngày, xem giờ.</h1>
      </div>

      <section className="grid gap-[60px] lg:grid-cols-2">
        <div className="flex flex-col gap-[24px]">
          <h2 className="heading-sm">Dương lịch sang âm lịch</h2>
          <Field label="Chọn ngày dương lịch">
            <input
              type="date"
              value={ngayDuong}
              onChange={(e) => setNgayDuong(e.target.value)}
              className="field-input"
            />
          </Field>

          {tt && (
            <div className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[3px]">
                <span className="heading-sm">
                  {tt.amLich.ngay}/{tt.amLich.thang}
                  {tt.amLich.nhuan && ' (nhuận)'}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                  Âm lịch năm {tt.amLich.nam} — {tt.canChiNam}
                </span>
              </div>

              <div className="flex flex-col gap-[6px] text-[14px]">
                <Dong nhan="Ngày" giaTri={tt.canChiNgay} />
                <Dong nhan="Tháng" giaTri={tt.canChiThang} />
                <Dong nhan="Năm" giaTri={tt.canChiNam} />
              </div>

              <div className="mt-[12px]">
                <h3 className="eyebrow" style={{ color: 'var(--accent)' }}>
                  Giờ hoàng đạo
                </h3>
                <div className="mt-[12px] grid grid-cols-2 gap-x-[24px] gap-y-[6px] text-[14px]">
                  {tt.gioHoangDao.map((g) => (
                    <div key={g.chi} className="flex justify-between gap-2">
                      <span>{g.chi}</span>
                      <span style={{ color: 'var(--fg-muted)' }}>{g.khungGio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[24px]">
          <h2 className="heading-sm">Âm lịch sang dương lịch</h2>
          <div className="grid grid-cols-3 gap-[18px]">
            <Field label="Ngày">
              <input
                type="number"
                min={1}
                max={30}
                value={amNgay}
                onChange={(e) => setAmNgay(Number(e.target.value))}
                className="field-input"
              />
            </Field>
            <Field label="Tháng">
              <input
                type="number"
                min={1}
                max={12}
                value={amThang}
                onChange={(e) => setAmThang(Number(e.target.value))}
                className="field-input"
              />
            </Field>
            <Field label="Năm">
              <input
                type="number"
                value={amNam}
                onChange={(e) => setAmNam(Number(e.target.value))}
                className="field-input"
              />
            </Field>
          </div>
          <label className="flex items-center gap-[8px] text-[13px]">
            <input
              type="checkbox"
              checked={amNhuan}
              onChange={(e) => setAmNhuan(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Tháng nhuận
          </label>

          <div>
            {duongTuAm ? (
              <span className="heading-sm">
                {duongTuAm.day}/{duongTuAm.month}/{duongTuAm.year}
              </span>
            ) : (
              <span className="body-text" style={{ color: 'var(--chart-hung)' }}>
                Năm {amNam} không có tháng {amThang} nhuận.
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-[6px]">
      <span style={{ color: 'var(--fg-muted)' }}>{nhan}</span>
      <span>{giaTri}</span>
    </div>
  );
}
