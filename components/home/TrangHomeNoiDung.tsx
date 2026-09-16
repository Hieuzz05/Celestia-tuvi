'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import {
  Eyebrow,
  IconDongHo,
  IconHaiNguoi,
  IconLaSo,
  IconMuiTenPhai,
  IconTroChuyen,
  Section,
  Shell,
  The,
} from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { cungDaiVan, lapLaSo, type LaSo } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';

/**
 * Trang chủ cá nhân hoá — nơi người đã đăng nhập đáp xuống.
 *
 * Bản spec v2 chỉ ra vấn đề: đăng nhập xong người dùng vẫn phải tự đi lại giữa
 * các công cụ rời rạc, không có "nơi của tôi". Trang này là nơi đó — mỗi lần mở
 * lên có một điều đáng chú ý, biết mình đang ở giai đoạn nào, và có đường đi
 * tiếp rõ ràng.
 *
 * Không làm theo kiểu bảng điều khiển đếm số: xếp theo thứ tự cảm xúc, mỗi khối
 * là một câu chuyện ngắn.
 */
export function TrangHomeNoiDung() {
  const { t, ngonNgu } = useNgonNgu();
  const { taiKhoan, dangDoc } = useTaiKhoan();
  const [hoSos, setHoSos] = useState<HoSo[]>([]);

  useEffect(() => {
    ghiSuKien('home_returned');
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
  }, []);

  const chinh = hoSos[0];

  const laSo: LaSo | null = useMemo(() => {
    if (!chinh) return null;
    try {
      return lapLaSo({
        ngay: chinh.ngay,
        thang: chinh.thang,
        nam: chinh.nam,
        gio: chinh.gio,
        gioiTinh: chinh.gioiTinh,
        hoTen: chinh.hoTen,
      });
    } catch {
      return null;
    }
  }, [chinh]);

  const namNay = new Date().getFullYear();
  const gocNhin = useMemo(
    () => (laSo ? docNhanh(laSo, namNay, undefined, ngonNgu) : []),
    [laSo, namNay, ngonNgu]
  );

  const giaiDoan = useMemo(() => {
    if (!laSo) return null;
    return cungDaiVan(laSo, namNay - laSo.thongTin.amLich.nam + 1) ?? null;
  }, [laSo, namNay]);

  const ten = taiKhoan?.tenHienThi ?? chinh?.hoTen ?? '';

  const loiTat = [
    { icon: <IconLaSo />, nhan: t.nav.banDo, href: '/la-so' },
    { icon: <IconTroChuyen />, nhan: t.nav.hoiCeles, href: '/hoi-dap' },
    { icon: <IconDongHo />, nhan: t.nav.khamPha, href: '/luan-giai' },
    { icon: <IconHaiNguoi />, nhan: t.nav.ketNoi, href: '/hop-tuoi' },
  ];

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[40px]">
        <div>
          <Eyebrow className="mb-[12px]">{t.nav.homNay}</Eyebrow>
          <h1 className="heading-sm">
            {ten ? dien(t.home.chao, { ten }) : t.home.chaoKhongTen}
          </h1>
        </div>

        {/* Chưa có bản đồ nào thì việc tiếp theo chỉ có một, nói thẳng ra */}
        {!dangDoc && !chinh && (
          <The className="flex flex-col gap-[12px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.home.chuaCoTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.home.chuaCoMo}
            </p>
            <Link href="/la-so" className="btn-primary self-start">
              {t.nav.batDauMienPhi}
            </Link>
          </The>
        )}

        {/* Điều đáng chú ý lúc này */}
        {gocNhin[0] && (
          <div className="flex flex-col gap-[16px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.home.dangNoiBat}
            </h2>
            <GocNhinCard gocNhin={gocNhin[0]} chinh />
          </div>
        )}

        {/* Giai đoạn đang đi qua */}
        {giaiDoan?.daiVan && (
          <div className="flex flex-col gap-[16px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.home.giaiDoan}
            </h2>
            <The className="flex flex-col gap-[8px]">
              <Eyebrow>
                {dien(t.home.doTuoi, {
                  tu: giaiDoan.daiVan.tuTuoi,
                  den: giaiDoan.daiVan.denTuoi,
                })}
              </Eyebrow>
              <p className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                {giaiDoan.tenCung}
              </p>
              {gocNhin[1] && (
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {gocNhin[1].noiDung}
                </p>
              )}
            </The>
          </div>
        )}

        {/* Đường đi tiếp */}
        <div className="flex flex-col gap-[16px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.home.diTiep}
          </h2>
          <div className="grid gap-[12px] sm:grid-cols-2">
            {loiTat.map((m) => (
              <Link key={m.href} href={m.href} className="card flex items-center gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{m.icon}</span>
                <span className="body-text flex-1">{m.nhan}</span>
                <IconMuiTenPhai size={18} />
              </Link>
            ))}
          </div>
        </div>
      </Shell>
    </Section>
  );
}
