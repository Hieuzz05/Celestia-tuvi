'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import {
  Eyebrow,
  IconDongHo,
  IconKhien,
  IconLaSo,
  IconSao,
  IconTroChuyen,
} from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useT } from '@/lib/i18n/context';
import type { NguonCong } from '@/components/auth/CongDangNhap';

/**
 * Khối chuyển đổi duy nhất sau Quick Read.
 *
 * Bản audit gọi đúng tên vấn đề của màn cũ: sau ba góc nhìn, người dùng bị đặt
 * trước năm sáu lối đi ngang hàng nhau — giữ lại, đổi thông tin, đọc dài, khám
 * phá sâu, hỏi Celes, mở bản đồ — và không biết bước nào là bước tốt nhất. Ở
 * đây chỉ còn MỘT lời mời, cộng một danh sách cho thấy phía sau có gì.
 *
 * Danh sách đó vẫn hiện chứ không bị ẩn: ẩn sạch thì người dùng không biết mình
 * đổi được gì khi tạo tài khoản, mà đó lại chính là lý do để họ tạo.
 */
export function KhoiChuyenDoi({
  xemTruoc,
  duongVe,
  tieuDe,
  moTa,
  nhanCta,
  chu,
}: {
  /** Bản đồ mờ phía sau cổng — thứ đang chờ, cho thấy để có lý do đăng ký */
  xemTruoc?: React.ReactNode;
  /** Nơi quay lại sau khi đăng nhập, kèm sẵn thông tin sinh vừa nhập */
  duongVe: string;
  tieuDe?: string;
  moTa?: string;
  nhanCta?: string;
  chu?: string;
}) {
  const t = useT();
  const [an, setAn] = useState(false);

  const khoa: { icon: React.ReactNode; nhan: string; mo: string; nguon: NguonCong }[] = [
    { icon: <IconLaSo size={20} />, nhan: t.quickRead.banDoTieuDe, mo: t.quickRead.khoaBanDo, nguon: 'full_chart' },
    { icon: <IconSao size={20} />, nhan: t.nav.khamPha, mo: t.quickRead.khoaKhamPha, nguon: 'deep_read' },
    { icon: <IconTroChuyen size={20} />, nhan: t.nav.hoiCeles, mo: t.quickRead.khoaHoi, nguon: 'ask_celes' },
    { icon: <IconDongHo size={20} />, nhan: t.nav.hanhTrinh, mo: t.quickRead.khoaHanhTrinh, nguon: 'journey' },
  ];

  if (an) {
    return (
      <button onClick={() => setAn(false)} className="link-text self-start">
        {t.quickRead.moiLaPhanDau} →
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-[20px]">
      <CongDangNhap
        nguon="save_chart"
        xemTruoc={xemTruoc}
        tieuDe={tieuDe}
        moTa={moTa}
        chu={chu}
        nhanCta={nhanCta ?? t.quickRead.giuHanhTrinh}
        duoiNut={
          <button onClick={() => setAn(true)} className="link-text self-start">
            {t.quickRead.chiXemTongQuan}
          </button>
        }
      />

      <div className="flex flex-col gap-[12px]">
        <div>
          <Eyebrow className="mb-[8px]">{t.quickRead.dangChoTieuDe}</Eyebrow>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.quickRead.dangChoMo}
          </p>
        </div>

        <div className="grid gap-[12px] sm:grid-cols-2">
          {khoa.map((k) => (
            <Link
              key={k.nguon}
              href={`/dang-nhap?intent=${k.nguon}&next=${encodeURIComponent(duongVe)}`}
              onClick={() => ghiSuKien('auth_gate_viewed', { nguon: k.nguon })}
              className="card flex flex-col gap-[8px]"
            >
              <div className="flex items-center gap-[10px]" style={{ color: 'var(--fg)' }}>
                {k.icon}
                <span className="text-[16px] font-semibold">{k.nhan}</span>
                <span className="pill-tag ml-auto inline-flex items-center gap-[4px]">
                  <IconKhien size={12} />
                  {t.quickRead.khoa}
                </span>
              </div>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {k.mo}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
