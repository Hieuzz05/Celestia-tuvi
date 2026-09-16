/**
 * Chữ ký thương hiệu: dấu vòng tròn đồng tâm + chữ Celestia giãn chữ.
 *
 * Toàn bộ dấu ăn theo currentColor (tức Aubergine). Hệ cấm dùng hồng Fuchsia cho
 * bất cứ thứ gì ngoài nền nút CTA, nên logo không được phép mượn màu đó dù nhìn
 * sẽ bắt mắt hơn.
 */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span className="flex items-center gap-[10px]">
      <svg
        width={size * 1.15}
        height={size * 1.15}
        viewBox="0 0 24 24"
        aria-hidden
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      </svg>
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
