'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { BuocNhapSinh, MAC_DINH, type ThongTinSinhForm } from '@/components/laso/BuocNhapSinh';
import { TuViChart } from '@/components/laso/TuViChart';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { HuyHieuOk, NutVien, OChon, Shell, Truong } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
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

  const gocNhin = useMemo(() => (laSo ? docNhanh(laSo, namXem) : []), [laSo, namXem]);

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
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    try {
      await luuHoSo({ hoTen: form.hoTen, ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh });
      setDaLuu(true);
      ghiSuKien('signup_after_result');
      setTimeout(() => setDaLuu(false), 2500);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Chưa lưu được — thử lại sau một chút.');
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
      setLoi('Phần diễn giải đang tạm gián đoạn. Lá số của bạn vẫn được giữ nguyên — thử lại sau một chút.');
    } finally {
      setDangChay(false);
    }
  };

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
          <h1 className="heading-sm">Ngày sinh chưa đúng</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Celestia chưa đọc được ngày bạn vừa nhập. Kiểm tra lại giúp nhé.
          </p>
          <NutVien nho onClick={() => setForm(null)} className="self-start">
            Nhập lại
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
              {form.hoTen?.trim() ? `Góc nhìn dành cho ${form.hoTen.trim()}` : 'Góc nhìn dành cho bạn'}
            </h1>
            <p className="body-sm mt-[6px]" style={{ color: 'var(--fg-muted)' }}>
              Ba điều đáng chú ý nhất, đọc từ chính lá số vừa lập.
            </p>
          </div>

          <div className="flex items-center gap-[12px]">
            {daLuu ? <HuyHieuOk>Đã lưu</HuyHieuOk> : (
              <NutVien nho onClick={luu}>
                Lưu để xem lại
              </NutVien>
            )}
            <NutVien nho onClick={() => setForm(null)}>
              Đổi thông tin
            </NutVien>
          </div>
        </div>

        <div className="grid gap-[16px] md:grid-cols-3">
          {gocNhin.map((g) => (
            <GocNhinCard key={g.id} gocNhin={g} />
          ))}
        </div>

        {loi && (
          <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
            {loi}
          </p>
        )}
      </section>

      {/* ---------- Đi sâu hơn ---------- */}
      <section className="grid gap-[16px] md:grid-cols-2">
        <div className="card flex flex-col gap-[12px]">
          <span className="eyebrow">ĐỌC DÀI HƠN</span>
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            Một bức tranh liền mạch về bạn
          </h2>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Nối các phần rời trong lá số thành một bài đọc, thay vì ba đoạn ngắn ở trên.
          </p>

          {dangChay ? (
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              Celestia đang ghép các phần trong lá số của bạn thành một bức tranh dễ hiểu…
            </p>
          ) : (
            <NutVien nho onClick={docSau} className="self-start">
              {ketQua ? 'Đọc lại' : 'Đọc bản đầy đủ'}
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
          <span className="eyebrow">THEO CHỦ ĐỀ</span>
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            Bạn đang muốn hiểu điều gì?
          </h2>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Công việc, tiền bạc, tình cảm, gia đình, sức khoẻ — hoặc hỏi thẳng một câu của riêng bạn.
          </p>
          <div className="mt-auto flex flex-wrap gap-[12px]">
            <Link href={lienKetSau} className="btn-outline btn-sm">
              Khám phá sâu hơn
            </Link>
            <Link href="/hoi-dap" className="btn-outline btn-sm">
              Hỏi Celestia
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Mệnh bàn: đặt dưới, mở khi người dùng muốn ---------- */}
      <section className="flex flex-col gap-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[16px]">
          <div>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              Lá số đầy đủ
            </h2>
            <p className="body-sm mt-[4px]" style={{ color: 'var(--fg-muted)' }}>
              Toàn bộ 12 cung và các sao — dành cho lúc bạn muốn đối chiếu chi tiết.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[12px]">
            {hienMenhBan && (
              <Truong nhan="Tháng đang xem" className="w-[150px]">
                <OChon value={thangXem} onChange={(e) => setThangXem(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </OChon>
              </Truong>
            )}
            <NutVien nho onClick={() => setHienMenhBan((v) => !v)}>
              {hienMenhBan ? 'Thu gọn lá số' : 'Xem lá số đầy đủ'}
            </NutVien>
          </div>
        </div>

        {hienMenhBan && (
          <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />
        )}
      </section>
    </Shell>
  );
}

export default function TrangLaSoBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]">Đang mở…</Shell>}>
      <TrangLaSo />
    </Suspense>
  );
}
