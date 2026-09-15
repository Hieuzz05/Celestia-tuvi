'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Field, FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { TuViChart } from '@/components/laso/TuViChart';
import { luuHoSo } from '@/lib/store/hoso';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';

function TrangLaSo() {
  const params = useSearchParams();
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [namXem, setNamXem] = useState(new Date().getFullYear());
  const [thangXem, setThangXem] = useState(new Date().getMonth() + 1);
  const [daLuu, setDaLuu] = useState(false);

  // Mở lá số từ trang Hồ sơ
  useEffect(() => {
    const ngay = Number(params.get('ngay'));
    const thang = Number(params.get('thang'));
    const nam = Number(params.get('nam'));
    if (!ngay || !thang || !nam) return;
    setForm({
      hoTen: params.get('ten') ?? '',
      ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
      gio: Number(params.get('gio')) || 9,
      gioiTinh: (params.get('gt') as GioiTinh) || 'nam',
    });
  }, [params]);

  const laSo = useMemo(() => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({ ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh, hoTen: form.hoTen });
    } catch {
      return null;
    }
  }, [form]);

  const luu = () => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    luuHoSo({ hoTen: form.hoTen, ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh });
    setDaLuu(true);
    setTimeout(() => setDaLuu(false), 2500);
  };

  const lienKetLuanGiai = laSo
    ? `/luan-giai?ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form.hoTen)}`
    : '/luan-giai';

  return (
    <main className="flex flex-col">
      <section className="grid gap-[36px] py-[36px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-[60px]">
        <div>
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>
            Tử Vi Đẩu Số — Nam phái
          </p>
          <h1 className="display mt-[18px]">Lá số của bạn, đọc bằng ngôn ngữ hôm nay.</h1>
          <p
            className="body-text mt-[24px] max-w-[480px]"
            style={{ color: 'var(--fg-body)' }}
          >
            An sao theo Nam phái, đối chiếu Bắc phái khi luận vận hạn. Nhập ngày giờ sinh để dựng
            mệnh bàn đầy đủ 12 cung, rồi để AI đọc lá số cho bạn.
          </p>
        </div>

        <div className="flex flex-col gap-[24px]">
          <FormSinh giaTri={form} onChange={setForm} />
          <div className="grid grid-cols-2 gap-[18px]">
            <Field label="Xem hạn năm">
              <input
                type="number"
                value={namXem}
                onChange={(e) => setNamXem(Number(e.target.value))}
                className="field-input"
              />
            </Field>
            <Field label="Xem hạn tháng">
              <select
                value={thangXem}
                onChange={(e) => setThangXem(Number(e.target.value))}
                className="field-input"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-[24px]">
            <Link href={lienKetLuanGiai} className="btn-primary">
              Luận giải lá số này
            </Link>
            <button onClick={luu} className="link-text">
              {daLuu ? 'Đã lưu hồ sơ ✓' : 'Lưu hồ sơ'}
            </button>
          </div>
        </div>
      </section>

      <section id="la-so" className="py-[36px]">
        {laSo ? (
          <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />
        ) : (
          <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
            Ngày sinh không hợp lệ, vui lòng kiểm tra lại.
          </p>
        )}
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="py-[60px]">Đang tải…</main>}>
      <TrangLaSo />
    </Suspense>
  );
}
