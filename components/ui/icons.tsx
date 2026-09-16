/**
 * Bộ icon theo lối Phosphor: một độ dày nét, một màu (kế thừa currentColor, tức
 * là Aubergine ở mọi chỗ), cỡ mặc định 24px.
 *
 * Vẽ tay bằng SVG inline thay vì nạp font icon — dự án chạy ngân sách 0 và mỗi
 * font tải thêm là một request chặn render, trong khi ở đây chỉ cần chục glyph.
 */

type IconProps = { size?: number; className?: string };

function Khung({ size = 24, className = '', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const IconSao = (p: IconProps) => (
  <Khung {...p}>
    <path d="M12 2.6c.6 5.2 4.2 8.8 9.4 9.4-5.2.6-8.8 4.2-9.4 9.4-.6-5.2-4.2-8.8-9.4-9.4 5.2-.6 8.8-4.2 9.4-9.4Z" />
  </Khung>
);

export const IconLaSo = (p: IconProps) => (
  <Khung {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </Khung>
);

export const IconTroChuyen = (p: IconProps) => (
  <Khung {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-12.2 7.7L3 21l1.3-5.8A8.5 8.5 0 1 1 21 12Z" />
  </Khung>
);

export const IconHaiNguoi = (p: IconProps) => (
  <Khung {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.6 20a6.6 6.6 0 0 1 12.8 0" />
    <path d="M16.2 5.2a3.2 3.2 0 0 1 0 5.9M17.6 14.2A6.6 6.6 0 0 1 21.4 20" />
  </Khung>
);

export const IconSach = (p: IconProps) => (
  <Khung {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Z" />
    <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3" />
  </Khung>
);

export const IconKhien = (p: IconProps) => (
  <Khung {...p}>
    <path d="M12 2.8 20 6v5.6c0 4.4-3.2 8.2-8 9.6-4.8-1.4-8-5.2-8-9.6V6Z" />
    <path d="M8.8 12.2 11 14.4l4.2-4.4" />
  </Khung>
);

export const IconTiaSet = (p: IconProps) => (
  <Khung {...p}>
    <path d="M13.5 2.5 4.5 13.6h6l-.4 7.9 9.4-11.4h-6.2Z" />
  </Khung>
);

export const IconDongHo = (p: IconProps) => (
  <Khung {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.8V12l3.6 2.2" />
  </Khung>
);

export const IconNguoiDung = (p: IconProps) => (
  <Khung {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.2a7.8 7.8 0 0 1 15 0" />
  </Khung>
);

export const IconMatTroi = (p: IconProps) => (
  <Khung {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </Khung>
);

export const IconMatTrang = (p: IconProps) => (
  <Khung {...p}>
    <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.3 8.3 0 1 0 10.5 10.5Z" />
  </Khung>
);

export const IconMuiTenPhai = (p: IconProps) => (
  <Khung {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Khung>
);
