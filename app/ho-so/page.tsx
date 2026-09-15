'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { danhSachHoSo, luuHoSo, xoaHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

export default function HoSoPage() {
  const [ds, setDs] = useState<HoSo[]>([]);
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-01-01',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [dangThem, setDangThem] = useState(false);

  useEffect(() => setDs(danhSachHoSo()), []);

  const them = () => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    luuHoSo({ hoTen: form.hoTen, ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh });
    setDs(danhSachHoSo());
    setDangThem(false);
    setForm({ hoTen: '', ngaySinh: '2000-01-01', gio: 9, gioiTinh: 'nam' });
  };

  const xoa = (id: string) => {
    xoaHoSo(id);
    setDs(danhSachHoSo());
  };

  return (
    <main className="flex flex-col gap-[36px] py-[36px]">
      <div>
        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          Hồ sơ đã lưu
        </p>
        <h1 className="display mt-[18px]">Lá số của bạn và người thân.</h1>
        <p className="body-text mt-[24px] max-w-[520px]" style={{ color: 'var(--fg-body)' }}>
          Hiện hồ sơ được lưu ngay trên trình duyệt này. Khi kết nối database, dữ liệu sẽ đồng bộ
          theo tài khoản và dùng được trên mọi thiết bị.
        </p>
      </div>

      {dangThem ? (
        <section className="flex max-w-[560px] flex-col gap-[24px]">
          <FormSinh giaTri={form} onChange={setForm} />
          <div className="flex items-center gap-[18px]">
            <button onClick={them} className="btn-primary">
              Lưu hồ sơ
            </button>
            <button onClick={() => setDangThem(false)} className="link-text">
              Huỷ
            </button>
          </div>
        </section>
      ) : (
        <button onClick={() => setDangThem(true)} className="btn-primary self-start">
          Thêm hồ sơ
        </button>
      )}

      <section className="flex flex-col">
        {ds.length === 0 && (
          <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
            Chưa có hồ sơ nào được lưu.
          </p>
        )}
        {ds.map((h) => {
          let tomTat = '';
          try {
            const ls = lapLaSo({
              ngay: h.ngay,
              thang: h.thang,
              nam: h.nam,
              gio: h.gio,
              gioiTinh: h.gioiTinh,
            });
            tomTat = `Mệnh ${CHI[ls.menhIndex]} · ${ls.cuc.ten} · ${ls.banMenh.ten}`;
          } catch {
            tomTat = 'Không tính được lá số';
          }
          return (
            <div
              key={h.id}
              className="flex flex-wrap items-baseline justify-between gap-[12px] py-[18px]"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex flex-col gap-[3px]">
                <span className="subheading">
                  {h.hoTen || 'Không tên'}
                </span>
                <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                  {h.ngay}/{h.thang}/{h.nam} · {h.gioiTinh === 'nam' ? 'Nam' : 'Nữ'} · {tomTat}
                </span>
              </div>
              <div className="flex items-center gap-[18px]">
                <Link
                  href={`/?ngay=${h.ngay}&thang=${h.thang}&nam=${h.nam}&gio=${h.gio}&gt=${h.gioiTinh}&ten=${encodeURIComponent(h.hoTen)}`}
                  className="link-text"
                >
                  Xem lá số
                </Link>
                <button onClick={() => xoa(h.id)} className="link-text">
                  Xoá
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
