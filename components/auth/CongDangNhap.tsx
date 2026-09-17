'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ghiSuKien } from '@/lib/analytics';
import { Eyebrow, IconKhien, The } from '@/components/ui';
import { useT } from '@/lib/i18n/context';

/**
 * Cổng đăng nhập theo ngữ cảnh (Gate 1 — miễn phí).
 *
 * Ba điều bản spec v2 nhấn mạnh, và đều là lý do cổng này không phải một tường
 * chắn thô:
 *
 *  1. Nói đúng lợi ích CỦA TÍNH NĂNG người dùng vừa bấm, không phải lợi ích
 *     chung chung của việc có tài khoản.
 *  2. Vẫn cho thấy thứ đang chờ phía sau — ẩn hoàn toàn thì không ai có lý do
 *     đăng ký.
 *  3. Đăng nhập xong quay lại ĐÚNG chỗ vừa bấm, không đá về trang chủ.
 */

export type NguonCong =
  | 'save_chart'
  | 'full_chart'
  | 'ask_celes'
  | 'deep_read'
  | 'connection'
  | 'journey';

export function CongDangNhap({
  nguon,
  xemTruoc,
  nhanCta,
  duoiNut,
  tieuDe,
  moTa,
  chu,
}: {
  nguon: NguonCong;
  /** Thứ đang chờ phía sau cổng — cho thấy để người dùng biết mình đổi được gì */
  xemTruoc?: React.ReactNode;
  /** Chữ trên nút, khi ngữ cảnh có câu hợp hơn "Tạo tài khoản miễn phí" */
  nhanCta?: string;
  /** Lối thoát phụ, đặt ngay dưới nút chính */
  duoiNut?: React.ReactNode;
  /** Ghi đè lợi ích mặc định của nguồn — dùng khi ngữ cảnh nói được câu mạnh hơn */
  tieuDe?: string;
  moTa?: string;
  /** Ghi đè dòng chữ nhỏ cuối khối */
  chu?: string;
}) {
  const pathname = usePathname();
  const t = useT();
  const loiIch = t.cong.loiIch[nguon];

  useEffect(() => {
    ghiSuKien('auth_gate_viewed', { nguon });
  }, [nguon]);

  // Giữ cả ý định lẫn nơi cần quay về, để sau khi đăng nhập người dùng rơi lại
  // đúng chỗ vừa bấm chứ không phải trang chủ
  const duong = `/dang-nhap?intent=${nguon}&next=${encodeURIComponent(pathname)}`;

  return (
    <The className="flex flex-col gap-[16px]">
      <Eyebrow>{t.cong.eyebrow}</Eyebrow>

      <div className="flex items-start gap-[12px]">
        <span style={{ color: 'var(--fg)' }}>
          <IconKhien size={22} />
        </span>
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {tieuDe ?? loiIch.tieuDe}
          </h2>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {moTa ?? loiIch.moTa}
          </p>
        </div>
      </div>

      {xemTruoc && (
        <div className="relative overflow-hidden" style={{ maxHeight: 180 }}>
          <div style={{ opacity: 0.45, pointerEvents: 'none' }} aria-hidden>
            {xemTruoc}
          </div>
          {/* Làm mờ dần xuống đáy: thấy có thứ ở đó, nhưng đọc không hết */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[90px]"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--surface-card))' }}
          />
        </div>
      )}

      <Link
        href={duong}
        className="btn-primary self-start"
        onClick={() => ghiSuKien('signup_started', { nguon })}
      >
        {nhanCta ?? t.cong.cta}
      </Link>

      {duoiNut}

      <p className="caption">{chu ?? t.cong.chu}</p>
    </The>
  );
}
