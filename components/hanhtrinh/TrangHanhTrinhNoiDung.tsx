'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { DaiThoiGian } from '@/components/hanhtrinh/DaiThoiGian';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { Eyebrow, NutVien, OChon, Section, Shell, The, Truong } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useNgonNgu, useT } from '@/lib/i18n/context';
import { useBoiCanh } from '@/lib/store/boi-canh';
import { lapLaSo, type LaSo } from '@/lib/tuvi/ansao';
import {
  cacGiaiDoan,
  cacNam,
  cacThang,
  mocThanhGocNhin,
  nhipHienTai,
  type MocHanhTrinh,
} from '@/lib/tuvi/hanh-trinh';
import { solarToLunar } from '@/lib/tuvi/lunar';

/**
 * Hành trình — dòng thời gian giai đoạn / năm / tháng của một bản đồ.
 *
 * Ba lựa chọn đáng giải thích:
 *
 *  1. **Mốc "bây giờ" tính theo âm lịch.** Lá số chia tháng theo tuần trăng, nên
 *     lấy `getMonth()` của lịch dương rồi đem so là lệch — cuối tháng dương gần
 *     như luôn sai một cung.
 *  2. **Cửa sổ năm tách khỏi năm đang chọn.** Bấm một năm ở rìa dải mà dải tự
 *     nhảy sang giữa thì mất dấu chỗ vừa bấm; hai trạng thái riêng giữ cho dải
 *     đứng yên cho tới khi người dùng chủ động lật trang.
 *  3. **Không khoá năm tương lai.** Bảng access ladder xếp "năm hiện tại" cho
 *     tài khoản miễn phí và phần còn lại cho Plus, nhưng Plus chưa có đường mua
 *     nào — khoá lúc này là dựng tường trước một cánh cửa chưa mở. Chỗ đặt cổng
 *     Gate 2 là ngay tại `cacNam` bên dưới, khi paywall lên.
 */
export function TrangHanhTrinhNoiDung() {
  const { t, ngonNgu } = useNgonNgu();
  const { duocVao, dangDoc } = useTaiKhoan();
  // Lá số đang xem lấy từ bối cảnh chung: đổi ở Hỏi Celes rồi sang đây phải
  // thấy đúng lá số đó, và ngược lại (spec v4 mục 13B).
  const boiCanh = useBoiCanh();
  const hoSos = boiCanh.hoSos;

  // "Bây giờ" theo cách lá số đếm: năm và tháng âm lịch
  const nayAm = useMemo(() => {
    const n = new Date();
    const al = solarToLunar(n.getDate(), n.getMonth() + 1, n.getFullYear());
    return { nam: al.year, thang: al.month };
  }, []);

  const [namChon, setNamChon] = useState(nayAm.nam);
  const [namGiua, setNamGiua] = useState(nayAm.nam);
  const [thangChon, setThangChon] = useState(nayAm.thang);
  const [idGiaiDoan, setIdGiaiDoan] = useState<string | null>(null);

  const hoSo =
    boiCanh.hoSoDangXem ?? hoSos.find((h) => h.id === boiCanh.idMacDinh) ?? hoSos[0] ?? null;

  const laSo: LaSo | null = useMemo(() => {
    if (!hoSo) return null;
    try {
      return lapLaSo({
        ngay: hoSo.ngay,
        thang: hoSo.thang,
        nam: hoSo.nam,
        gio: hoSo.gio,
        gioiTinh: hoSo.gioiTinh,
        hoTen: hoSo.hoTen,
      });
    } catch {
      return null;
    }
  }, [hoSo]);

  const giaiDoans = useMemo(
    () => (laSo ? cacGiaiDoan(laSo, nayAm.nam, ngonNgu) : []),
    [laSo, nayAm.nam, ngonNgu]
  );
  const nams = useMemo(
    () => (laSo ? cacNam(laSo, namGiua, nayAm.nam, ngonNgu) : []),
    [laSo, namGiua, nayAm.nam, ngonNgu]
  );
  const thangs = useMemo(
    () => (laSo ? cacThang(laSo, namChon, namChon === nayAm.nam ? nayAm.thang : null, ngonNgu) : []),
    [laSo, namChon, nayAm.nam, nayAm.thang, ngonNgu]
  );

  const giaiDoanChon =
    giaiDoans.find((g) => g.id === idGiaiDoan) ?? giaiDoans.find((g) => g.dangDienRa) ?? giaiDoans[0];
  const namMoc = nams.find((n) => n.nhan === String(namChon));
  const thangMoc = thangs.find((x) => x.id === `thang-${namChon}-${thangChon}`);

  const nhip = useMemo(
    () => (laSo ? nhipHienTai(laSo, namChon, thangChon, ngonNgu) : null),
    [laSo, namChon, thangChon, ngonNgu]
  );

  const chonNam = (m: MocHanhTrinh) => {
    const n = Number(m.nhan);
    setNamChon(n);
    boiCanh.datThoiDiem(n, thangChon);
    ghiSuKien('timeline_year_opened', { nam: m.nhan });
  };

  const veHienTai = () => {
    setNamChon(nayAm.nam);
    setNamGiua(nayAm.nam);
    setThangChon(nayAm.thang);
    setIdGiaiDoan(null);
  };

  const dangONay = namChon === nayAm.nam && thangChon === nayAm.thang;

  // Khách chưa đăng nhập: cho thấy có thứ đang chờ, chặn ở cổng Gate 1
  if (!dangDoc && !duocVao) {
    return (
      <Section gon>
        <Shell className="flex flex-col gap-[24px]">
          <TieuDeTrang />
          <CongDangNhap nguon="journey" />
        </Shell>
      </Section>
    );
  }

  if (!dangDoc && !boiCanh.dangTai && !hoSo) {
    return (
      <Section gon>
        <Shell className="flex flex-col gap-[24px]">
          <TieuDeTrang />
          <The className="flex flex-col gap-[12px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.hanhTrinh.chuaCoTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.hanhTrinh.chuaCoMo}
            </p>
            <Link href="/la-so" className="btn-primary self-start">
              {t.hanhTrinh.lapBanDo}
            </Link>
          </The>
        </Shell>
      </Section>
    );
  }

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[40px]">
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <TieuDeTrang />
          {hoSos.length > 1 && (
            <Truong nhan={t.hanhTrinh.xemCua} className="w-[220px]">
              <OChon value={hoSo?.id ?? ''} onChange={(e) => boiCanh.xemHoSo(e.target.value)}>
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen?.trim() || `${h.ngay}/${h.thang}/${h.nam}`}
                    {h.id === boiCanh.idMacDinh ? ` · ${t.danhSach.laSoCuaToi}` : ''}
                  </option>
                ))}
              </OChon>
            </Truong>
          )}
        </div>

        {/* Tổng hợp ba lớp thành một đoạn — thứ người dùng đọc trước tiên */}
        {nhip && (
          <div className="flex flex-col gap-[12px]">
            <GocNhinCard gocNhin={nhip} chinh />
            {!dangONay && (
              <NutVien nho onClick={veHienTai} className="self-start">
                {t.hanhTrinh.veHienTai}
              </NutVien>
            )}
          </div>
        )}

        {/* Lớp 1: những quãng dài */}
        <Lop
          tieuDe={t.hanhTrinh.giaiDoanTieuDe}
          mo={t.hanhTrinh.giaiDoanMo}
          moc={giaiDoans}
          idChon={giaiDoanChon?.id ?? ''}
          onChon={(m) => setIdGiaiDoan(m.id)}
          chiTiet={giaiDoanChon}
          nhomChu={t.hanhTrinh.giaiDoanTieuDe}
          duongChiTiet={`/hanh-trinh/chi-tiet?cap=giai-doan&nam=${namChon}&thang=${thangChon}`}
        />

        {/* Lớp 2: từng năm, có lật trang tới lui */}
        <Lop
          tieuDe={t.hanhTrinh.namTieuDe}
          mo={t.hanhTrinh.namMo}
          moc={nams}
          idChon={`nam-${namChon}`}
          onChon={chonNam}
          chiTiet={namMoc}
          nhomChu={t.hanhTrinh.namTieuDe}
          duongChiTiet={`/hanh-trinh/chi-tiet?cap=nam&nam=${namChon}&thang=${thangChon}`}
          dieuKhien={
            <div className="flex gap-[8px]">
              <NutVien nho onClick={() => setNamGiua((n) => n - 7)}>
                ← {t.hanhTrinh.lui}
              </NutVien>
              <NutVien nho onClick={() => setNamGiua((n) => n + 7)}>
                {t.hanhTrinh.toi} →
              </NutVien>
            </div>
          }
        />

        {/* Lớp 3: từng tháng trong năm đang chọn */}
        <Lop
          tieuDe={dien(t.hanhTrinh.thangTieuDe, { nam: namChon })}
          mo={t.hanhTrinh.thangMo}
          moc={thangs}
          idChon={`thang-${namChon}-${thangChon}`}
          onChon={(m) => setThangChon(Number(m.id.split('-')[2]))}
          chiTiet={thangMoc}
          nhomChu={dien(t.hanhTrinh.thangTieuDe, { nam: namChon })}
          duongChiTiet={`/hanh-trinh/chi-tiet?cap=thang&nam=${namChon}&thang=${thangChon}`}
        />

        <div className="flex flex-wrap gap-[12px]">
          <Link href="/hoi-dap" className="btn-outline btn-sm">
            {t.hanhTrinh.hoiVe}
          </Link>
          {hoSo && (
            <Link
              href={`/la-so?ngay=${hoSo.ngay}&thang=${hoSo.thang}&nam=${hoSo.nam}&gio=${hoSo.gio}&gt=${hoSo.gioiTinh}&ten=${encodeURIComponent(hoSo.hoTen ?? '')}`}
              className="btn-outline btn-sm"
            >
              {t.hanhTrinh.moBanDo}
            </Link>
          )}
        </div>

        {/* Nói thẳng lớp còn thiếu, thay vì để người dùng tự đoán */}
        <The className="flex flex-col gap-[8px]">
          <Eyebrow>{t.hanhTrinh.ngayTieuDe}</Eyebrow>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.hanhTrinh.ngayMo}
          </p>
        </The>
      </Shell>
    </Section>
  );
}

function TieuDeTrang() {
  const t = useT();
  return (
    <div>
      <Eyebrow className="mb-[12px]">{t.hanhTrinh.eyebrow}</Eyebrow>
      <h1 className="heading-sm">{t.hanhTrinh.tieuDe}</h1>
      <p className="body-sm mt-[8px] max-w-[640px]" style={{ color: 'var(--fg-muted)' }}>
        {t.hanhTrinh.moTa}
      </p>
    </div>
  );
}

/** Một lớp thời gian: tiêu đề + dải mốc + chi tiết của mốc đang chọn */
function Lop({
  tieuDe,
  mo,
  moc,
  idChon,
  onChon,
  chiTiet,
  nhomChu,
  dieuKhien,
  duongChiTiet,
}: {
  tieuDe: string;
  mo: string;
  moc: MocHanhTrinh[];
  idChon: string;
  onChon: (moc: MocHanhTrinh) => void;
  chiTiet?: MocHanhTrinh;
  nhomChu: string;
  dieuKhien?: React.ReactNode;
  /** Đường sang tầng luận hạn chi tiết của đúng mốc đang chọn */
  duongChiTiet: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-end justify-between gap-[12px]">
        <div>
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {tieuDe}
          </h2>
          <p className="body-sm mt-[4px] max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
            {mo}
          </p>
        </div>
        {dieuKhien}
      </div>

      <DaiThoiGian moc={moc} idDangChon={idChon} onChon={onChon} />

      {chiTiet && (
        <div className="flex flex-col gap-[10px]">
          <GocNhinCard gocNhin={mocThanhGocNhin(chiTiet, nhomChu)} nho />
          {/* Tầng hai: tổng quan ở trên đọc trong 10-20 giây, chi tiết nằm sau
              một cú bấm — spec v4 tách hẳn hai độ sâu này. */}
          <Link href={duongChiTiet} className="link-text self-start">
            {t.chiTietHan.xemChiTiet} →
          </Link>
        </div>
      )}
    </div>
  );
}
