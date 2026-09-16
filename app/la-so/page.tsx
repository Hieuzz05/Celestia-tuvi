'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { BuocNhapSinh, MAC_DINH, type ThongTinSinhForm } from '@/components/laso/BuocNhapSinh';
import { KhoiChuyenDoi } from '@/components/laso/KhoiChuyenDoi';
import { TuViChart } from '@/components/laso/TuViChart';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { HuyHieuOk, NutVien, OChon, Shell, Truong } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { goiLuanGiai, type KetQuaLuanGiai } from '@/lib/ai/goiLuanGiai';
import { luuHoSo } from '@/lib/store/hoso';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';

/** Lá số mẫu cho liên kết "Xem một lá số mẫu" từ trang chủ */
const MAU: ThongTinSinhForm = {
  hoTen: 'Lá số mẫu',
  ngaySinh: '2000-08-24',
  gio: 9,
  phut: 0,
  gioiTinh: 'nam',
};

function tachNgay(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}

function TrangLaSo() {
  const { t, ngonNgu } = useNgonNgu();
  const { duocVao } = useTaiKhoan();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<ThongTinSinhForm | null>(null);
  const [namXem, setNamXem] = useState(new Date().getFullYear());
  const [thangXem, setThangXem] = useState(new Date().getMonth() + 1);
  const [hienMenhBan, setHienMenhBan] = useState(false);
  const [daLuu, setDaLuu] = useState(false);

  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaLuanGiai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Vào thẳng bằng liên kết có sẵn dữ liệu (lá số mẫu, hoặc quay lại từ trang khác)
  useEffect(() => {
    if (params.get('mau')) {
      setForm(MAU);
      return;
    }
    const ngay = Number(params.get('ngay'));
    const thang = Number(params.get('thang'));
    const nam = Number(params.get('nam'));
    if (!ngay || !thang || !nam) return;
    setForm({
      hoTen: params.get('ten') ?? '',
      ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
      gio: Number(params.get('gio')) || 9,
      phut: 0,
      gioiTinh: (params.get('gt') as GioiTinh) || 'nam',
    });
  }, [params]);

  const laSo = useMemo(() => {
    if (!form) return null;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({
        ngay,
        thang,
        nam,
        gio: form.gio,
        phut: form.phut,
        gioiTinh: form.gioiTinh,
        hoTen: form.hoTen,
      });
    } catch {
      return null;
    }
  }, [form]);

  const gocNhin = useMemo(
    () => (laSo ? docNhanh(laSo, namXem, form?.yDinh, ngonNgu) : []),
    [laSo, namXem, form?.yDinh, ngonNgu]
  );

  useEffect(() => {
    if (!laSo) return;
    ghiSuKien('chart_generated');
    ghiSuKien('quick_read_viewed');
  }, [laSo]);

  // Đổi thông tin sinh thì bài đọc sâu cũ không còn đúng với lá số nữa
  useEffect(() => {
    setKetQua(null);
    setLoi(null);
  }, [form]);

  const luu = async () => {
    if (!form) return;
    // Lưu là khả năng của tài khoản — khách bấm vào thì đưa sang cổng, kèm ý định
    if (!duocVao) {
      ghiSuKien('auth_gate_viewed', { nguon: 'save_chart' });
      router.push('/dang-nhap?intent=save_chart&next=%2Fla-so');
      return;
    }
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    try {
      await luuHoSo({ hoTen: form.hoTen, ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh });
      setDaLuu(true);
      ghiSuKien('signup_after_result');
      setTimeout(() => setDaLuu(false), 2500);
    } catch {
      setLoi(t.quickRead.loiLuu);
    }
  };

  const docSau = async () => {
    if (!form) return;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
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
    } catch {
      // Người dùng không cần biết provider nào hỏng — chỉ cần biết lá số vẫn còn nguyên
      setLoi(t.quickRead.loiDocDai);
    } finally {
      setDangChay(false);
    }
  };

  // Nơi quay lại sau khi đăng nhập, mang sẵn thông tin sinh để không phải nhập lại
  const duongVe = laSo
    ? `/la-so?ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form?.hoTen ?? '')}`
    : '/la-so';

  const lienKetSau = laSo
    ? `/luan-giai?ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form?.hoTen ?? '')}`
    : '/luan-giai';

  // --- Chưa nhập xong: chỉ hiện luồng từng bước ---
  if (!form) {
    return (
      <Shell className="py-[48px]">
        <BuocNhapSinh giaTriDau={MAC_DINH} onXong={setForm} />
      </Shell>
    );
  }

  if (!laSo) {
    return (
      <Shell className="py-[48px]">
        <div className="card mx-auto flex max-w-[560px] flex-col gap-[16px]">
          <h1 className="heading-sm">{t.quickRead.ngaySai}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.quickRead.ngaySaiMo}
          </p>
          <NutVien nho onClick={() => setForm(null)} className="self-start">
            {t.quickRead.nhapLai}
          </NutVien>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="flex flex-col gap-[32px] py-[32px]">
      {/* ---------- Quick Read: giá trị đầu tiên, hiện ngay, không chờ AI ---------- */}
      <section className="flex flex-col gap-[16px]">
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <div>
            <h1 className="heading-sm">
              {form.hoTen?.trim()
                ? dien(t.quickRead.tieuDeCoTen, { ten: form.hoTen.trim() })
                : t.quickRead.tieuDeChinh}
            </h1>
            <p className="body-sm mt-[6px]" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.moTa}
            </p>
          </div>

          {/* Khách chưa đăng nhập không thấy nút "Giữ lại" ở đây: việc lưu đã
              nằm trong khối chuyển đổi duy nhất bên dưới. Hai chỗ cùng mời một
              hành động chính là kiểu phân tán mà bản audit chỉ ra. */}
          <div className="flex items-center gap-[12px]">
            {duocVao &&
              (daLuu ? (
                <HuyHieuOk>{t.quickRead.daGiu}</HuyHieuOk>
              ) : (
                <NutVien nho onClick={luu}>
                  {t.quickRead.giuLai}
                </NutVien>
              ))}
            <NutVien nho onClick={() => setForm(null)}>
              {t.quickRead.doiThongTin}
            </NutVien>
          </div>
        </div>

        {gocNhin[0] && <GocNhinCard gocNhin={gocNhin[0]} chinh />}

        <div className="grid gap-[16px] md:grid-cols-2">
          {gocNhin.slice(1, 3).map((g) => (
            <GocNhinCard key={g.id} gocNhin={g} nho />
          ))}
        </div>

        {loi && (
          <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
            {loi}
          </p>
        )}
      </section>

      {/* Sau ba góc nhìn, người đã đăng nhập đi tiếp; khách chỉ gặp MỘT lời mời */}
      {duocVao ? (
        <>
        {/* ---------- Đi sâu hơn ---------- */}
        <section className="grid gap-[16px] md:grid-cols-2">
          <div className="card flex flex-col gap-[12px]">
            <span className="eyebrow">{t.quickRead.sauTieuDe}</span>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.quickRead.docDai}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.sauMo}
            </p>

            {dangChay ? (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {t.quickRead.dangDoc}
              </p>
            ) : (
              <NutVien nho onClick={docSau} className="self-start">
                {ketQua ? t.quickRead.docLai : t.quickRead.docDai}
              </NutVien>
            )}

            {ketQua && (
              <>
                <MarkdownLuanGiai noiDung={ketQua.noiDung} nho />
                <NguonTriThuc nguon={ketQua.nguonTriThuc} />
              </>
            )}
          </div>

          <div className="card flex flex-col gap-[12px]">
            <span className="eyebrow">{t.nav.khamPha}</span>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.quickRead.theoChuDeTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.theoChuDeMo}
            </p>
            <div className="mt-auto flex flex-wrap gap-[12px]">
              <Link href={lienKetSau} className="btn-outline btn-sm">
                {t.quickRead.khamPhaSau}
              </Link>
              <Link href="/hoi-dap" className="btn-outline btn-sm">
                {t.quickRead.hoiThang}
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Mệnh bàn: đặt dưới, mở khi người dùng muốn ---------- */}
        <section className="flex flex-col gap-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-[16px]">
            <div>
              <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                {t.quickRead.banDoTieuDe}{' '}
                <span className="caption font-normal">· {t.quickRead.banDoPhu}</span>
              </h2>
              <p className="body-sm mt-[4px]" style={{ color: 'var(--fg-muted)' }}>
                {t.quickRead.banDoMo}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-[12px]">
              {hienMenhBan && (
                <Truong nhan={t.quickRead.thangXem} className="w-[150px]">
                  <OChon value={thangXem} onChange={(e) => setThangXem(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {dien(t.banDo.thang, { thang: m })}
                      </option>
                    ))}
                  </OChon>
                </Truong>
              )}
              <NutVien nho onClick={() => setHienMenhBan((v) => !v)}>
                {hienMenhBan ? t.quickRead.banDoDongNut : t.quickRead.banDoMoNut}
              </NutVien>
            </div>
          </div>

          {hienMenhBan && (
            <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />
          )}
        </section>
        </>
      ) : (
        <KhoiChuyenDoi
          duongVe={duongVe}
          xemTruoc={
            <TuViChart
              laSo={laSo}
              namXem={namXem}
              thangXem={thangXem}
              onNamXemChange={setNamXem}
              chiBanDo
            />
          }
        />
      )}

    </Shell>
  );
}

export default function TrangLaSoBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangLaSo />
    </Suspense>
  );
}
