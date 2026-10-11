'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { Field, FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { goiLuanGiai, type KetQuaLuanGiai } from '@/lib/ai/goiLuanGiai';
import { CHU_DE, type ChuDeId } from '@/lib/ai/prompt';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';
import { Shell, KhoiGap } from '@/components/ui';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { CongUngHo } from '@/components/support/CongUngHo';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { QuayLai } from '@/components/QuayLai';
import { CelesMascot } from '@/components/CelesMascot';
import { dien, useT } from '@/lib/i18n/context';
import type { TuDien } from '@/lib/i18n/vi';

function TrangLuanGiai() {
  const t = useT();
  const { duocVao, dangDoc } = useTaiKhoan();
  const params = useSearchParams();
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  // Chủ đề bấm sang từ lối tắt ở trang chủ: đọc ngay lúc khởi tạo để thẻ đúng
  // được mở từ lần vẽ đầu, không chớp qua thẻ mặc định rồi mới nhảy.
  const chuDeUrl = params.get('chuDe');
  const [chuDe, setChuDe] = useState<ChuDeId>(
    chuDeUrl && chuDeUrl in CHU_DE ? (chuDeUrl as ChuDeId) : 'su-nghiep'
  );
  const [namXem, setNamXem] = useState(new Date().getFullYear());
  // Tháng ÂM — cùng lý do với trang Bản đồ
  const [thangXem, setThangXem] = useState(thangAmHienTai());
  const [cauHoi, setCauHoi] = useState('');
  const [hoSos, setHoSos] = useState<HoSo[]>([]);

  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaLuanGiai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  // Mở cổng ủng hộ khi hết lượt bài sâu trong ngày
  const [moCong, setMoCong] = useState(false);

  useEffect(() => {
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
  }, []);

  // Nhận thông tin sinh khi bấm sang từ tab Lá số
  useEffect(() => {
    const ngay = Number(params.get('ngay'));
    const thang = Number(params.get('thang'));
    const nam = Number(params.get('nam'));
    if (!ngay || !thang || !nam) return;
    Promise.resolve({
      hoTen: params.get('ten') ?? '',
      ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
      // Không `|| 9`: giờ 0 (sinh sau nửa đêm, giờ Tý) từng bị đổi thành 9 giờ — giờ Tỵ
      gio: params.get('gio') !== null && Number.isInteger(Number(params.get('gio'))) ? Number(params.get('gio')) : 9,
      gioiTinh: (params.get('gt') as ThongTinForm['gioiTinh']) || 'nam',
    }).then(setForm);
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


  const chay = async (chuDeChay: ChuDeId) => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    setChuDe(chuDeChay);
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
          chuDe: chuDeChay,
          namXem,
          thangXem,
          cauHoi: cauHoi || undefined,
        })
      );
    } catch (e) {
      /*
       * Hết lượt trong ngày KHÁC hẳn hỏng hạ tầng.
       *
       * Gộp hai thứ vào một dòng "đang tạm gián đoạn" là nói sai với người
       * dùng: không có gì gián đoạn cả, họ chỉ đã dùng hết lượt hôm nay. Và nó
       * giấu mất đường đi tiếp duy nhất — ủng hộ để mở thêm.
       */
      const loiQuota = e as Error & { canUngHo?: boolean };
      if (loiQuota?.canUngHo) {
        setLoi(loiQuota.message);
        setMoCong(true);
      } else {
        setLoi(t.trangLuanGiai.loiTamDung);
      }
    } finally {
      setDangChay(false);
    }
  };

  // Chưa đăng nhập thì KHÔNG dựng phần nội dung sâu — spec v2 yêu cầu chặn
  // ở tầng đường dẫn, và server cũng chặn lại ở API tương ứng.
  if (dangDoc) return <Shell className="py-[48px]"><span /></Shell>;
  if (!duocVao)
    return (
      <Shell className="flex flex-col gap-[16px] py-[32px]">
        <QuayLai theoTrangTruoc macDinh={{ href: '/home' }} />
        <div className="mx-auto max-w-[620px]">
          <CongDangNhap nguon="deep_read" toanTrang />
        </div>
      </Shell>
    );

  return (
    <Shell className="flex flex-col gap-[24px] py-[20px]">
      <QuayLai theoTrangTruoc macDinh={{ href: '/home' }} className="-mb-[16px]" />
      <div>
        <p className="eyebrow">{t.trangLuanGiai.eyebrow}</p>
        <h1 className="heading mt-[10px]">{t.trangLuanGiai.tieuDe}</h1>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/*
          Trên điện thoại: một dòng nói đang hỏi về ai và xem năm nào, các
          trường nhập gập lại phía sau. Việc chính của màn này là CHỌN CHỦ ĐỀ,
          nên chủ đề phải là thứ thấy trước — xem ghi chú trong KhoiGap.
        */}
        <KhoiGap
          moSan={!laSo}
          nhanMo={t.trangLuanGiai.doiNguoi}
          tomTat={
            <>
              {form.hoTen || t.trangLuanGiai.nguoiVuaNhap} · {tachNgaySinh(form.ngaySinh).ngay}/
              {tachNgaySinh(form.ngaySinh).thang}/{tachNgaySinh(form.ngaySinh).nam} ·{' '}
              {dien(t.trangLuanGiai.namTomTat, { nam: namXem })}
            </>
          }
        >
        <div className="flex flex-col gap-[16px]">
          {hoSos.length > 0 && (
            <Field label={t.trangLuanGiai.chonNguoiLuu}>
              <select
                className="field-input"
                defaultValue=""
                onChange={(e) => {
                  const h = hoSos.find((x) => x.id === e.target.value);
                  if (!h) return;
                  setForm({
                    hoTen: h.hoTen,
                    ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
                    gio: h.gio,
                    gioiTinh: h.gioiTinh,
                  });
                }}
              >
                <option value="">{t.trangLuanGiai.nhapTay}</option>
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || t.danhSach.khongTen} — {h.ngay}/{h.thang}/{h.nam}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <FormSinh giaTri={form} onChange={setForm} />

          <div className="grid grid-cols-2 gap-[12px]">
            <Field label={t.trangLuanGiai.namXemHan}>
              <input
                type="number"
                value={namXem}
                onChange={(e) => setNamXem(Number(e.target.value))}
                className="field-input"
              />
            </Field>
            <Field label={t.trangLuanGiai.thangXemHan}>
              <select
                value={thangXem}
                onChange={(e) => setThangXem(Number(e.target.value))}
                className="field-input"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {dien(t.banDo.thang, { thang: m })}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.trangLuanGiai.cauHoiRieng}>
            <input
              value={cauHoi}
              onChange={(e) => setCauHoi(e.target.value)}
              placeholder={t.trangLuanGiai.cauHoiVD}
              className="field-input"
            />
          </Field>

          {laSo && (
            <div
              className="flex flex-wrap gap-x-[12px] gap-y-[4px] pt-[14px] text-[13px]"
              style={{ color: 'var(--fg-muted)', borderTop: '1px solid var(--line)' }}
            >
              <span>
                {t.trangLuanGiai.menh} <b style={{ color: 'var(--fg)' }}>{CHI[laSo.menhIndex]}</b>
              </span>
              <span style={{ color: 'var(--fg)' }}>{laSo.cuc.ten}</span>
              <span>
                {t.trangLuanGiai.thanCu} <b style={{ color: 'var(--fg)' }}>{laSo.thanCuCung}</b>
              </span>
            </div>
          )}

        </div>
        </KhoiGap>

        <div className="flex flex-col gap-[16px]">
          <div className="grid gap-[12px] sm:grid-cols-2">
            {(Object.keys(CHU_DE) as ChuDeId[]).map((id) => (
              <button
                key={id}
                onClick={() => chay(id)}
                disabled={dangChay || !laSo}
                className="flex flex-col gap-[4px] rounded-[var(--radius-cards)] border p-[14px] text-left transition-colors disabled:opacity-50"
                style={{
                  borderColor: chuDe === id ? 'var(--fg)' : 'var(--line)',
                  background: 'var(--surface-card)',
                }}
              >
                <span className="text-[15px] font-medium" style={{ color: 'var(--fg)' }}>
                  {nhanChuDe(id, t)}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {moTaChuDe(id, t)}
                </span>
              </button>
            ))}
          </div>

          <div
            className="min-h-[200px] rounded-[var(--radius-cards)] border p-[22px]"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            {/* Chờ thật 15–45 giây: ảnh hiện ngay, không cần trễ. */}
            {dangChay && (
              <div className="flex items-center gap-[16px]">
                <CelesMascot cho="cho" trangThai="thinking" cao={80} caoNho={64} />
                <p className="body-text min-w-0" style={{ color: 'var(--fg-muted)' }}>
                  {dien(t.luanChuDe.dangDoc, { chuDe: nhanChuDe(chuDe, t) })}
                </p>
              </div>
            )}

            {loi && (
              <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}

            {ketQua && !dangChay && (
              <article className="flex flex-col gap-[12px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="subheading">{nhanChuDe(chuDe, t)}</h2>
                  <span className="caption">
                    {t.trangLuanGiai.soanTu}
                  </span>
                </div>
                <MarkdownLuanGiai noiDung={ketQua.noiDung} />
                <p className="mt-[14px] text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {t.trangLuanGiai.canhBao}
                </p>
              </article>
            )}

            {!ketQua && !dangChay && !loi && (
              <div className="flex items-center gap-[16px]">
                <CelesMascot cho="rong" minhHoa="reading" cao={80} caoNho={64} />
                <p className="body-text min-w-0" style={{ color: 'var(--fg-muted)' }}>
                  {t.luanChuDe.chonChuDe}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hết lượt trong ngày: mở thẳng cổng ủng hộ, vì đó là đường đi tiếp duy nhất */}
      {moCong && (
        <CongUngHo
          lyDo="long_report"
          onDong={() => setMoCong(false)}
          quayLai={{ path: '/luan-giai' }}
        />
      )}
    </Shell>
  );
}

/** Nhãn chủ đề theo ngôn ngữ — CHU_DE trong lib/ai/prompt giữ bản Việt cho prompt */
const KHOA_CHU_DE = {
  'tong-quan': 'tongQuan',
  'su-nghiep': 'suNghiep',
  'tai-chinh': 'taiChinh',
  'tinh-duyen': 'tinhDuyen',
  'suc-khoe': 'sucKhoe',
  'gia-dao': 'giaDao',
  'van-han': 'vanHan',
} as const satisfies Record<ChuDeId, keyof TuDien['chuDeLuan']>;

const nhanChuDe = (id: ChuDeId, t: TuDien) => t.chuDeLuan[KHOA_CHU_DE[id]];
const moTaChuDe = (id: ChuDeId, t: TuDien) => t.chuDeLuan[`${KHOA_CHU_DE[id]}Mo`];

export default function LuanGiaiPage() {
  const t = useT();
  return (
    <Suspense fallback={<Shell className="py-[40px]">{t.trangLuanGiai.dangTai}</Shell>}>
      <TrangLuanGiai />
    </Suspense>
  );
}
