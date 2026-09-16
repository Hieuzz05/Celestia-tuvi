'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { Field, GIO_OPTIONS, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { TuViChart } from '@/components/laso/TuViChart';
import { goiLuanGiai, type KetQuaLuanGiai } from '@/lib/ai/goiLuanGiai';
import { luuHoSo } from '@/lib/store/hoso';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

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

  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaLuanGiai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

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
      return lapLaSo({
        ngay,
        thang,
        nam,
        gio: form.gio,
        gioiTinh: form.gioiTinh,
        hoTen: form.hoTen,
      });
    } catch {
      return null;
    }
  }, [form]);

  // Đổi thông tin sinh thì bản luận giải cũ không còn đúng với lá số nữa
  useEffect(() => {
    setKetQua(null);
    setLoi(null);
  }, [form.ngaySinh, form.gio, form.gioiTinh]);

  const set = <K extends keyof ThongTinForm>(k: K, v: ThongTinForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const luu = async () => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    try {
      await luuHoSo({ hoTen: form.hoTen, ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh });
      setDaLuu(true);
      setTimeout(() => setDaLuu(false), 2500);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không lưu được hồ sơ');
    }
  };

  const luanGiai = async () => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    try {
      setKetQua(
        await goiLuanGiai({
          ngay,
          thang,
          nam,
          gio: form.gio,
          gioiTinh: form.gioiTinh,
          hoTen: form.hoTen,
          chuDe: 'tong-quan',
          namXem,
          thangXem,
        })
      );
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setDangChay(false);
    }
  };

  const lienKetChiTiet = laSo
    ? `/luan-giai?ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form.hoTen)}`
    : '/luan-giai';

  return (
    <main className="flex flex-col gap-[20px] py-[20px]">
      <section
        className="no-print grid gap-x-[18px] gap-y-[12px] rounded-[var(--radius-cards)] border p-[16px] md:grid-cols-2 xl:grid-cols-6"
        style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
      >
        <Field label="Họ tên">
          <input
            value={form.hoTen}
            onChange={(e) => set('hoTen', e.target.value)}
            placeholder="Nguyễn Văn A"
            className="field-input"
          />
        </Field>
        <Field label="Ngày sinh">
          <input
            type="date"
            value={form.ngaySinh}
            onChange={(e) => set('ngaySinh', e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Giờ sinh">
          <select
            value={form.gio}
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
            value={form.gioiTinh}
            onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
            className="field-input"
          >
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
          </select>
        </Field>
        <Field label="Năm xem">
          <input
            type="number"
            value={namXem}
            onChange={(e) => setNamXem(Number(e.target.value))}
            className="field-input"
          />
        </Field>
        <Field label="Tháng xem">
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
      </section>

      {!laSo && (
        <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
          Ngày sinh không hợp lệ, vui lòng kiểm tra lại.
        </p>
      )}

      {laSo && (
        <section className="grid gap-[20px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />

          <aside
            className="no-print flex max-h-[80vh] flex-col gap-[14px] overflow-y-auto rounded-[var(--radius-cards)] border p-[20px]"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="subheading">Luận giải tổng quan</h2>
              <button onClick={luu} className="link-text">
                {daLuu ? 'Đã lưu ✓' : 'Lưu hồ sơ'}
              </button>
            </div>

            <div
              className="flex flex-wrap gap-x-[14px] gap-y-[4px] pb-[12px] text-[13px]"
              style={{ color: 'var(--fg-muted)', borderBottom: '1px solid var(--line)' }}
            >
              <span>
                Mệnh <b style={{ color: 'var(--fg)' }}>{CHI[laSo.menhIndex]}</b>
              </span>
              <span style={{ color: 'var(--fg)' }}>{laSo.cuc.ten}</span>
              <span>
                Bản mệnh <b style={{ color: 'var(--fg)' }}>{laSo.banMenh.ten}</b>
              </span>
              <span>
                Thân cư <b style={{ color: 'var(--fg)' }}>{laSo.thanCuCung}</b>
              </span>
            </div>

            {!ketQua && !dangChay && (
              <>
                <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                  AI đọc trực tiếp dữ liệu an sao của lá số bên cạnh — tên sao, độ sáng, Tuần Triệt,
                  tứ hóa — rồi diễn giải theo Nam phái.
                </p>
                <button onClick={luanGiai} className="btn-primary self-start">
                  Luận giải lá số này
                </button>
              </>
            )}

            {dangChay && (
              <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                Đang đọc lá số và soạn luận giải… mất khoảng 15–45 giây.
              </p>
            )}

            {loi && (
              <p className="text-[14px]" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}

            {ketQua && (
              <>
                <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  Soạn bởi <span style={{ color: 'var(--accent)' }}>{ketQua.model}</span>
                </p>
                <MarkdownLuanGiai noiDung={ketQua.noiDung} nho />
                <NguonTriThuc nguon={ketQua.nguonTriThuc} />
                <button onClick={luanGiai} className="link-text self-start">
                  Luận giải lại
                </button>
              </>
            )}

            <Link href={lienKetChiTiet} className="btn-outline mt-auto self-start">
              Luận giải chi tiết theo chủ đề
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="py-[40px]">Đang tải…</main>}>
      <TrangLaSo />
    </Suspense>
  );
}
