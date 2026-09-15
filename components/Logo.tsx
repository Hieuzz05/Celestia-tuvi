/** Chữ ký thương hiệu: sao bốn cánh + chữ Celestia dạng serif giãn chữ */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-[10px]">
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        aria-hidden
        style={{ flexShrink: 0 }}
      >
        <path
          d="M12 0.5c.5 6 5 10.5 11 11-6 .5-10.5 5-11 11-.5-6-5-10.5-11-11 6-.5 10.5-5 11-11Z"
          fill="var(--accent)"
        />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-display-serif), Georgia, serif',
          fontSize: size,
          lineHeight: 1,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--fg)',
          paddingRight: '0.22em',
        }}
      >
        Celestia
      </span>
    </span>
  );
}
