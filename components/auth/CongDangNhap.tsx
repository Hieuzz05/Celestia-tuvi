'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ghiSuKien } from '@/lib/analytics';
import { Eyebrow, IconKhien, The } from '@/components/ui';

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

export type NguonCong = 'save_chart' | 'full_chart' | 'ask_celes' | 'deep_read' | 'connection';

const LOI_ICH: Record<NguonCong, { tieuDe: string; moTa: string }> = {
  save_chart: {
    tieuDe: 'Giữ lại bản đồ này',
    moTa: 'Tạo tài khoản miễn phí để Celes nhớ bản đồ của bạn, và lần sau mở lên là có ngay — trên máy nào cũng vậy.',
  },
  full_chart: {
    tieuDe: 'Xem toàn bộ 12 cung',
    moTa: 'Bản đầy đủ có tất cả các cung, các sao và độ sáng. Tạo tài khoản miễn phí để mở, và để bản đồ được lưu lại.',
  },
  ask_celes: {
    tieuDe: 'Tiếp tục cuộc trò chuyện với Celes',
    moTa: 'Tạo tài khoản miễn phí để Celes nhớ bản đồ của bạn và giữ lại cuộc trò chuyện này cho lần sau.',
  },
  deep_read: {
    tieuDe: 'Đi sâu vào điều bạn đang bận tâm',
    moTa: 'Mỗi chủ đề là một bài đọc riêng, dựa trên chính bản đồ của bạn. Tạo tài khoản miễn phí để mở và lưu lại.',
  },
  connection: {
    tieuDe: 'Xem hai người vận hành cùng nhau thế nào',
    moTa: 'Cần lưu được cả hai người thì mới so được. Tạo tài khoản miễn phí để bắt đầu.',
  },
};

export function CongDangNhap({
  nguon,
  xemTruoc,
}: {
  nguon: NguonCong;
  /** Thứ đang chờ phía sau cổng — cho thấy để người dùng biết mình đổi được gì */
  xemTruoc?: React.ReactNode;
}) {
  const pathname = usePathname();
  const loiIch = LOI_ICH[nguon];

  useEffect(() => {
    ghiSuKien('auth_gate_viewed', { nguon });
  }, [nguon]);

  // Giữ cả ý định lẫn nơi cần quay về, để sau khi đăng nhập người dùng rơi lại
  // đúng chỗ vừa bấm chứ không phải trang chủ
  const duong = `/dang-nhap?intent=${nguon}&next=${encodeURIComponent(pathname)}`;

  return (
    <The className="flex flex-col gap-[16px]">
      <Eyebrow>ĐÂY MỚI CHỈ LÀ PHẦN ĐẦU</Eyebrow>

      <div className="flex items-start gap-[12px]">
        <span style={{ color: 'var(--fg)' }}>
          <IconKhien size={22} />
        </span>
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {loiIch.tieuDe}
          </h2>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {loiIch.moTa}
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
        Tạo tài khoản miễn phí
      </Link>

      <p className="caption">Miễn phí, không cần thẻ. Bản đồ bạn vừa lập sẽ được giữ lại.</p>
    </The>
  );
}
