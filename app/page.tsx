'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { GIO_OPTIONS, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { Eyebrow, HuyHieuOk, NutChinh, O, OChon, Shell, Truong } from '@/components/ui';
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
  const [modelChon, setModelChon] = useState('');
  const [models, setModels] = useState<{ provider: string; model: string; daCauHinh: boolean }[]>(
    []
  );

  useEffect(() => {
    fetch('/api/ai/trang-thai')
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));
  }, []);

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
          model: modelChon || undefined,
        })
      );
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setDangChay(false);
    }
  };

  const modelSanSang = models.filter((m) => m.daCauHinh);

  const lienKetChiTiet = laSo
    ? `/luan-giai?ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form.hoTen)}`
    : '/luan-giai';

  return (
    <Shell className="flex flex-col gap-[20px] py-[24px]">
      <section className="no-print card">
        <Eyebrow className="mb-[16px]">Thông tin ngày sinh</Eyebrow>
        <div className="grid gap-x-[16px] gap-y-[12px] md:grid-cols-2 xl:grid-cols-4">
          <Truong nhan="Họ tên">
            <O
              value={form.hoTen}
              onChange={(e) => set('hoTen', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </Truong>
          <Truong nhan="Ngày sinh">
            <O type="date" value={form.ngaySinh} onChange={(e) => set('ngaySinh', e.target.value)} />
          </Truong>
          <Truong nhan="Giờ sinh">
            <OChon value={form.gio} onChange={(e) => set('gio', Number(e.target.value))}>
              {GIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </OChon>
          </Truong>
          <Truong nhan="Giới tính">
            <OChon
              value={form.gioiTinh}
              onChange={(e) => set('gioiTinh', e.target.value as GioiTinh)}
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </OChon>
          </Truong>
          <Truong nhan="Năm xem">
            <O type="number" value={namXem} onChange={(e) => setNamXem(Number(e.target.value))} />
          </Truong>
          <Truong nhan="Tháng xem">
            <OChon value={thangXem} onChange={(e) => setThangXem(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </OChon>
          </Truong>

          {/* Chọn model + nút luận giải nằm ngay trong khu nhập liệu để thao tác
              gọn một chỗ, khỏi phải nhìn sang panel bên phải */}
          <Truong nhan="Model AI">
            <OChon value={modelChon} onChange={(e) => setModelChon(e.target.value)}>
              <option value="">
                {modelSanSang.length > 0
                  ? `Tự động — ưu tiên ${modelSanSang[0].provider}/${modelSanSang[0].model}`
                  : 'Tự động'}
              </option>
              {modelSanSang.map((m) => (
                <option key={`${m.provider}|${m.model}`} value={`${m.provider}|${m.model}`}>
                  {m.provider} — {m.model}
                </option>
              ))}
            </OChon>
          </Truong>

          <div className="flex items-end">
            <NutChinh onClick={luanGiai} disabled={!laSo || dangChay} className="w-full">
              {dangChay ? 'Đang luận giải…' : 'Luận giải lá số'}
            </NutChinh>
          </div>
        </div>
      </section>

      {!laSo && (
        <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
          Ngày sinh không hợp lệ, vui lòng kiểm tra lại.
        </p>
      )}

      {laSo && (
        <section className="grid gap-[20px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />

          <aside className="no-print card flex max-h-[80vh] flex-col gap-[14px] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="subheading">Luận giải tổng quan</h2>
              {daLuu ? (
                <HuyHieuOk>Đã lưu</HuyHieuOk>
              ) : (
                <button onClick={luu} className="link-text">
                  Lưu hồ sơ
                </button>
              )}
            </div>

            <div
              className="flex flex-wrap gap-x-[14px] gap-y-[4px] pb-[12px] text-[14px]"
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
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                AI đọc trực tiếp dữ liệu an sao của lá số bên cạnh — tên sao, độ sáng, Tuần Triệt,
                tứ hóa — rồi diễn giải theo Nam phái. Bấm <b style={{ color: 'var(--fg)' }}>Luận
                giải lá số</b> ở khu nhập thông tin phía trên để bắt đầu.
              </p>
            )}

            {dangChay && (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Đang đọc lá số và soạn luận giải… mất khoảng 15–45 giây.
              </p>
            )}

            {loi && (
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}

            {ketQua && (
              <>
                <p className="caption">
                  Soạn bởi{' '}
                  <span className="font-medium" style={{ color: 'var(--fg)' }}>
                    {ketQua.model}
                  </span>
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
    </Shell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Shell className="py-[40px]">Đang tải…</Shell>}>
      <TrangLaSo />
    </Suspense>
  );
}
