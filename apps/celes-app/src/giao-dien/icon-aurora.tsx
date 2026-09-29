import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';

/**
 * Bộ icon Aurora: nét 1.75, đầu và khớp bo tròn, lưới 24.
 *
 * SINH từ bảng `IC` của `docs/thiet-ke/celes-ios/aurora/gen.py` — thêm icon thì
 * thêm vào bản thiết kế trước rồi chép sang đây, để canvas và app cùng một nét.
 * Spec cấm trộn họ icon, cấm emoji, cấm biểu tượng tarot / hoàng đạo.
 */

type NetVe =
  | ['p', { d: string }]
  | ['c', { cx: number; cy: number; r: number }]
  | ['r', { x: number; y: number; width: number; height: number; rx: number }];

const HINH = {
  sun: [['c', { cx: 12, cy: 12, r: 4 }], ['p', { d: 'M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4' }]],
  path: [['p', { d: 'M4 19c4 0 4-6 8-6s4-6 8-6' }], ['c', { cx: 4, cy: 19, r: 1.6 }], ['c', { cx: 20, cy: 7, r: 1.6 }]],
  rel: [['c', { cx: 9, cy: 12, r: 5.5 }], ['c', { cx: 15, cy: 12, r: 5.5 }]],
  user: [['c', { cx: 12, cy: 8, r: 4 }], ['p', { d: 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6' }]],
  briefcase: [['r', { x: 3, y: 7, width: 18, height: 13, rx: 3 }], ['p', { d: 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18' }]],
  coin: [['c', { cx: 12, cy: 12, r: 8.5 }], ['p', { d: 'M14.6 9.3c-.6-.8-1.5-1.3-2.6-1.3-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.6-1.3M12 6.5V8M12 16v1.5' }]],
  heart: [['p', { d: 'M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z' }]],
  home: [['p', { d: 'M4 11l8-6.5 8 6.5V19.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z' }]],
  sparkle: [['p', { d: 'M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z' }], ['p', { d: 'M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z' }]],
  leaf: [['p', { d: 'M5 19.5C5 11 10 5.5 19.5 4.5 19.5 14 14 19.5 5 19.5z' }], ['p', { d: 'M5 19.5l7.5-7.5' }]],
  sign: [['p', { d: 'M12 3v18' }], ['p', { d: 'M6 5.5h10.5L19 8l-2.5 2.5H6z' }], ['p', { d: 'M18 13.5H7.5L5 16l2.5 2.5H18z' }]],
  eye: [['p', { d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z' }], ['c', { cx: 12, cy: 12, r: 3 }]],
  check: [['p', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  arrow: [['p', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  back: [['p', { d: 'M15 5l-7 7 7 7' }]],
  chev: [['p', { d: 'M9 5l7 7-7 7' }]],
  up: [['p', { d: 'M12 19V5M5.5 11.5L12 5l6.5 6.5' }]],
  plus: [['p', { d: 'M12 5v14M5 12h14' }]],
  bell: [['p', { d: 'M6 9.5a6 6 0 0 1 12 0c0 5.5 2.5 7 2.5 7h-17S6 15 6 9.5z' }], ['p', { d: 'M10 20a2 2 0 0 0 4 0' }]],
  clock: [['c', { cx: 12, cy: 12, r: 8.5 }], ['p', { d: 'M12 7.5V12l3 2' }]],
  wave: [['p', { d: 'M3 12c2 0 2-4 4.5-4S10 16 12.5 16 15 8 17.5 8 19 12 21 12' }]],
  mic: [['r', { x: 9, y: 3, width: 6, height: 11, rx: 3 }], ['p', { d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21' }]],
  book: [['p', { d: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z' }], ['p', { d: 'M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z' }]],
  memory: [['p', { d: 'M12 3a6 6 0 0 0-6 6c0 2.2 1.2 3.6 2.5 4.8.8.8 1.5 1.7 1.5 3.2h4c0-1.5.7-2.4 1.5-3.2C16.8 12.6 18 11.2 18 9a6 6 0 0 0-6-6z' }], ['p', { d: 'M10 20.5h4' }]],
  shield: [['p', { d: 'M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z' }]],
  moon: [['p', { d: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' }]],
  trash: [['p', { d: 'M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13' }]],
  mail: [['r', { x: 3, y: 5, width: 18, height: 14, rx: 3 }], ['p', { d: 'M4 7l8 6 8-6' }]],
  bookmark: [['p', { d: 'M6.5 4h11v16.5L12 16.5l-5.5 4z' }]],
  radar: [['p', { d: 'M12 3l8 5.5-3 9.5H7L4 8.5z' }], ['p', { d: 'M12 8l3.5 2.5-1.3 4.2H9.8l-1.3-4.2z' }]],
  new: [['p', { d: 'M12 20H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V12' }], ['p', { d: 'M17 15v6M14 18h6' }]],
  laso: [['r', { x: 3.5, y: 3.5, width: 17, height: 17, rx: 3 }], ['r', { x: 8.5, y: 8.5, width: 7, height: 7, rx: 1 }], ['p', { d: 'M3.5 8.5h5M15.5 8.5h5M3.5 15.5h5M15.5 15.5h5M8.5 3.5v5M15.5 3.5v5M8.5 15.5v5M15.5 15.5v5' }]],
  share: [['p', { d: 'M12 3.5v11M7.5 8L12 3.5 16.5 8' }], ['p', { d: 'M5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6' }]],
  x: [['p', { d: 'M6 6l12 12M18 6L6 18' }]],
  compass: [['c', { cx: 12, cy: 12, r: 8.5 }], ['p', { d: 'M15.5 8.5l-2 5-5 2 2-5z' }]],
  users: [['c', { cx: 9, cy: 8, r: 3 }], ['c', { cx: 16.5, cy: 9.5, r: 2.5 }], ['p', { d: 'M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14.5 14.2c.6-.2 1.3-.3 2-.3 2.5 0 4 1.9 4 4.6' }]],
  cap: [['p', { d: 'M2.5 9.5L12 5l9.5 4.5L12 14z' }], ['p', { d: 'M6.5 11.5v4c1.5 1.5 3.3 2 5.5 2s4-.5 5.5-2v-4' }]],
  baby: [['c', { cx: 12, cy: 12, r: 8.5 }], ['p', { d: 'M9.5 15c1.4 1.1 3.6 1.1 5 0M12 3.5c-1 1.2-1 2.3 0 3' }], ['c', { cx: 9.3, cy: 11, r: 0.7 }], ['c', { cx: 14.7, cy: 11, r: 0.7 }]],
  tree: [['c', { cx: 12, cy: 5.5, r: 2.5 }], ['c', { cx: 6, cy: 18, r: 2.5 }], ['c', { cx: 18, cy: 18, r: 2.5 }], ['p', { d: 'M12 8v4M6 15.5V12h12v3.5' }]],
  caret: [['p', { d: 'M7 10l5 5 5-5' }]],
} satisfies Record<string, NetVe[]>;

export type TenIcon = keyof typeof HINH;

export function Icon({
  ten,
  size = 22,
  mau = '#F3F1F4',
  net = 1.75,
}: {
  ten: TenIcon;
  size?: number;
  mau?: ColorValue;
  /** Độ dày nét — tab đang chọn và nút nhỏ dùng nét đậm hơn */
  net?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={mau}
      strokeWidth={net}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(HINH[ten] as NetVe[]).map((n, i) =>
        n[0] === 'p' ? <Path key={i} {...n[1]} /> : n[0] === 'c' ? <Circle key={i} {...n[1]} /> : <Rect key={i} {...n[1]} />,
      )}
    </Svg>
  );
}

/** Hình quả táo cho nút đăng nhập Apple — hình đặc, không theo nét */
export function IconApple({ size = 20, mau = '#000000' }: { size?: number; mau?: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={mau}>
      <Path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.8zM14.1 5.9c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z" />
    </Svg>
  );
}
