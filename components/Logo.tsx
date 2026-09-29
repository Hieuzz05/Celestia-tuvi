/**
 * Chữ ký thương hiệu Celestia: dấu trăng khuyết + sao bốn cánh, và chữ CELESTIA.
 *
 * Quy tắc bố cục do bộ nhận diện quy định: dấu đứng BÊN TRÁI chữ, và chiều cao
 * dấu bằng 1.2 lần chiều cao chữ. Tỉ lệ này cố định — đừng chỉnh mắt cho "cân"
 * ở từng chỗ, vì logo xuất hiện ở nhiều nền khác nhau và chỉ nhất quán khi cùng
 * một tỉ lệ.
 *
 * Bảng màu đào–tím (bộ logo 29/09/2026) là màu của riêng dấu thương hiệu. Nó
 * KHÔNG phải màu hành động của sản phẩm — nút chuyển đổi vẫn là hồng Fuchsia,
 * mực vẫn là Aubergine.
 *
 * Hình lấy từ tệp gốc của designer (`mark.svg`, `mark-small.svg`, hệ toạ độ
 * 1024). Tệp gốc khoét trăng bằng mask; ở đây trăng là một path hai cung tròn
 * cho cùng hình — react-native-svg bên app vẽ mask không ổn định, và web với app
 * phải chung một hình. Giữ đồng bộ với `app/icon.svg` và
 * `apps/celes-app/src/giao-dien/icon.tsx`.
 */

import { useId } from 'react';

/** Mã màu của bộ nhận diện */
export const MAU_THUONG_HIEU = {
  /** Ba điểm dừng của dải màu trăng: tím ở chân, đào ở giữa, kem ở ngọn */
  tim: '#9B6BFF',
  dao: '#F6C38A',
  kem: '#FFF1CC',
  /** Lõi sáng của ngôi sao */
  kemSang: '#FFF8DD',
  /** Nền của biểu tượng ứng dụng, favicon và ô nền của dấu trên bề mặt sáng */
  nenDau: '#111126',
  /** Chữ đặt trên nền tối của bộ nhận diện */
  softWhite: '#F8FAFC',
} as const;

/** Tỉ lệ chiều cao dấu so với chiều cao chữ — quy định của bộ nhận diện */
export const TI_LE_DAU = 1.2;

/**
 * Hai bản hình của designer. Bản "nhỏ" trăng dày hơn, sao to hơn — dùng khi dấu
 * dưới 40px, vì ở 16–32px bản thường chỉ còn một vệt trăng mảnh.
 * `khung` là ô vuông cắt sát hình (hình gốc lệch trái trong khung 1024).
 */
const HINH = {
  thuong: {
    trang: 'M528.92 237.52A275 275 0 1 0 528.92 786.48A300 300 0 0 1 528.92 237.52Z',
    sao: 'M535 421C555.02 491.98 555.02 491.98 626 512C555.02 532.02 555.02 532.02 535 603C514.98 532.02 514.98 532.02 444 512C514.98 491.98 514.98 491.98 535 421Z',
    dai: { x1: 319.5, y1: 787, x2: 666, y2: 264.5 },
    tam: [431.5, 512],
    canh: 580,
  },
  nho: {
    trang: 'M549.21 229.44A285 285 0 1 0 549.21 794.56A300 300 0 0 1 549.21 229.44Z',
    sao: 'M535 407C558.1 488.9 558.1 488.9 640 512C558.1 535.1 558.1 535.1 535 617C511.9 535.1 511.9 535.1 430 512C511.9 488.9 511.9 488.9 535 407Z',
    dai: { x1: 312.5, y1: 797, x2: 671.6, y2: 255.5 },
    tam: [433.5, 512],
    canh: 600,
  },
} as const;

/**
 * Dấu thương hiệu: trăng khuyết ôm một ngôi sao bốn cánh.
 *
 * Vẽ bằng SVG thay vì nhúng ảnh PNG: dấu này xuất hiện ở đủ cỡ từ 16px trên
 * thanh điều hướng tới 96px ở màn chờ, mà PNG phóng lên là vỡ nét.
 *
 * Ngôi sao màu kem gần như biến mất trên nền sáng, nên ở theme Ngày dấu nằm
 * trong một ô bo góc màu nền của biểu tượng ứng dụng (token `--dau-nen`); ở
 * theme Đêm và các dải tối, token đó trong suốt và dấu đứng trần.
 */
export function DauCelestia({
  size = 24,
  mau,
  idGradient,
}: {
  size?: number;
  /** Ghi đè màu — bỏ trống thì dùng dải màu của bộ nhận diện */
  mau?: string;
  /** Chỉ truyền khi cần một id cố định (VD: tệp SVG xuất ra ngoài) */
  idGradient?: string;
}) {
  // Dấu xuất hiện nhiều lần trên cùng một trang (header + chân trang). Hai
  // <linearGradient> trùng id là HTML sai và trình duyệt chỉ dùng cái đầu tiên,
  // nên id phải do React cấp. Bỏ dấu ':' vì id còn được nhét vào url(#...).
  const idTuDong = useId().replace(/:/g, '');
  const id = idGradient ?? `celestia-dau-${idTuDong}`;
  const h = size < 40 ? HINH.nho : HINH.thuong;

  // Khung nhìn rộng hơn hình 30% để ô nền (nếu có) chừa lề quanh dấu
  const canh = h.canh * 1.3;
  const x0 = h.tam[0] - canh / 2;
  const y0 = h.tam[1] - canh / 2;

  return (
    <svg width={size} height={size} viewBox={`${x0} ${y0} ${canh} ${canh}`} fill="none" aria-hidden>
      {!mau && (
        <defs>
          <linearGradient id={`${id}-trang`} {...h.dai} gradientUnits="userSpaceOnUse">
            <stop stopColor={MAU_THUONG_HIEU.tim} />
            <stop offset="0.47" stopColor={MAU_THUONG_HIEU.dao} />
            <stop offset="1" stopColor={MAU_THUONG_HIEU.kem} />
          </linearGradient>
          <radialGradient id={`${id}-sao`}>
            <stop stopColor={MAU_THUONG_HIEU.kemSang} />
            <stop offset="0.55" stopColor={MAU_THUONG_HIEU.kem} />
            <stop offset="1" stopColor={MAU_THUONG_HIEU.dao} />
          </radialGradient>
        </defs>
      )}

      <rect x={x0} y={y0} width={canh} height={canh} rx={canh * 0.22} style={{ fill: 'var(--dau-nen)' }} />
      <path d={h.trang} fill={mau ?? `url(#${id}-trang)`} />
      <path d={h.sao} fill={mau ?? `url(#${id}-sao)`} />
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
