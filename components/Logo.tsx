/**
 * Chữ ký thương hiệu Celestia: dấu sao–vành trăng vàng kim + chữ CELESTIA.
 *
 * Quy tắc bố cục do bộ nhận diện quy định: dấu đứng BÊN TRÁI chữ, và chiều cao
 * dấu bằng 1.2 lần chiều cao chữ. Tỉ lệ này cố định — đừng chỉnh mắt cho "cân"
 * ở từng chỗ, vì logo xuất hiện ở nhiều nền khác nhau và chỉ nhất quán khi cùng
 * một tỉ lệ.
 *
 * Vàng kim #D4AF37 là màu của riêng dấu thương hiệu. Nó KHÔNG phải màu hành động
 * của sản phẩm — nút chuyển đổi vẫn là hồng Fuchsia, mực vẫn là Aubergine.
 */

import { useId } from 'react';

/** Mã màu của bộ nhận diện */
export const MAU_THUONG_HIEU = {
  /** Vàng kim — màu của dấu thương hiệu */
  gold: '#D4AF37',
  goldSang: '#EBD489',
  goldTram: '#B08B24',
  /** Nền dùng cho biểu tượng ứng dụng và các bề mặt mang dấu thương hiệu */
  midnightIndigo: '#0F172A',
  midnightIndigoSau: '#0A0E1A',
  /** Chữ đặt trên nền tối của bộ nhận diện */
  softWhite: '#F8FAFC',
} as const;

/** Tỉ lệ chiều cao dấu so với chiều cao chữ — quy định của bộ nhận diện */
export const TI_LE_DAU = 1.2;

/**
 * Dấu thương hiệu: ngôi sao năm cánh lồng trong vành trăng khuyết.
 *
 * Vẽ bằng SVG thay vì nhúng ảnh PNG: dấu này xuất hiện ở đủ cỡ từ 16px trên
 * thanh điều hướng tới 96px ở màn chờ, mà PNG phóng lên là vỡ nét.
 */
export function DauCelestia({
  size = 24,
  mau,
  idGradient,
}: {
  size?: number;
  /** Ghi đè màu — bỏ trống thì dùng gradient vàng kim */
  mau?: string;
  /** Chỉ truyền khi cần một id cố định (VD: tệp SVG xuất ra ngoài) */
  idGradient?: string;
}) {
  // Dấu xuất hiện nhiều lần trên cùng một trang (header + chân trang). Hai
  // <linearGradient> trùng id là HTML sai và trình duyệt chỉ dùng cái đầu tiên,
  // nên id phải do React cấp. Bỏ dấu ':' vì id còn được nhét vào url(#...).
  const idTuDong = useId().replace(/:/g, '');
  const id = idGradient ?? `celestia-gold-${idTuDong}`;
  const net = mau ?? `url(#${id})`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {!mau && (
        <defs>
          <linearGradient id={id} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor={MAU_THUONG_HIEU.goldSang} />
            <stop offset="0.5" stopColor={MAU_THUONG_HIEU.gold} />
            <stop offset="1" stopColor={MAU_THUONG_HIEU.goldTram} />
          </linearGradient>
        </defs>
      )}

      {/* Vành trăng khuyết, hở ở phía trên để ngọn sao vươn ra ngoài */}
      <path
        d="M15.4 13.7A15 15 0 1 0 32.6 13.7"
        stroke={net}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Nét trong, gợi lại chuyển động của quỹ đạo */}
      <path
        d="M13.6 21.1A11.5 11.5 0 0 0 28.9 36.4"
        stroke={net}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Ngôi sao năm cánh, vẽ nét chứ không tô đặc */}
      <path
        d="M24 8 27.1 16.8 36.4 17 29 22.6 31.6 31.5 24 26.2 16.4 31.5 19.1 22.6 11.6 17 20.9 16.8Z"
        stroke={net}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Dấu + chữ CELESTIA, áp đúng tỉ lệ 1.2 lần chiều cao chữ */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span className="flex items-center gap-[12px]">
      <DauCelestia size={size * TI_LE_DAU} />
      <span
        style={{
          fontFamily: 'var(--font-display-sans), ui-sans-serif, system-ui, sans-serif',
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          paddingRight: '0.16em',
        }}
      >
        Celestia
      </span>
    </span>
  );
}
