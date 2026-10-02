import Image from 'next/image'
import type { CSSProperties } from 'react'

/*
 * Linh vật Celes trên web.
 *
 * Luật đặt (docs/chien-luoc/celes-visual-character-system.md mục 12):
 * Celes đứng ở đầu trang, thẻ rỗng / màn vào, màn chờ, cổng, lỗi và sự kiện —
 * KHÔNG đứng TRONG vùng nội dung (mệnh bàn, bài luận, dòng thời gian, kết quả
 * hợp tuổi, danh sách lá số). Mỗi khung nhìn tối đa một con; ngoại lệ duy nhất
 * là /hoi-dap (đầu trang + một con ở thân, và không bao giờ cả hai cùng nghĩ).
 *
 * Danh sách tệp được đặt nằm ở `scripts/test-cho-dat-celes.ts`. Đặt ở tệp mới
 * là CI đỏ cho đến khi cập nhật mục 12 và danh sách đó.
 */

/**
 * Trạng thái ĐỘNG — đổi theo tín hiệu lúc chạy (chat, chờ, an toàn, sự kiện).
 * Giá trị là tên TỆP (kebab-case). Chúng KHÔNG cùng enum với `characterHook`
 * (mục 5) — Phase 3 nối dây qua một bảng ánh xạ, đừng map thẳng một-một.
 */
export const TRANG_THAI_CELES = ['default', 'listening', 'thinking', 'serious', 'celebrate'] as const

/**
 * Minh hoạ TĨNH — gắn cố định theo ngữ cảnh màn. KHÔNG chọn theo sao, theo
 * hạn hay theo kết quả của người dùng (mục 10).
 */
export const MINH_HOA_CELES = [
  'tiny-smile',
  'one-ear-up',
  'leaning-closer',
  'reading',
  'moving',
  'curious',
  'sitting-neutral',
  'neutral',
  'proud',
  'using-laptop',
  'waving',
  'concerned',
  'playing',
] as const

/**
 * Mọi ảnh có tệp ở `public/celes/<ten>.webp` — bài kiểm CI so 1-1 với thư mục.
 * Artwork khoá (mục 12) không có ở đây và không có tệp: mở khoá là quyết định
 * của chủ dự án, không phải một dòng thêm vào mảng.
 */
export const TEN_ANH_CELES = [...TRANG_THAI_CELES, ...MINH_HOA_CELES] as const

export type TrangThaiCeles = (typeof TRANG_THAI_CELES)[number]
export type MinhHoaCeles = (typeof MINH_HOA_CELES)[number]

/**
 * Loại chỗ đặt → ảnh được phép. Đặt sai ảnh vào chỗ là `tsc` đỏ.
 * - dau-trang: cạnh tiêu đề / hero, ngoài vùng nội dung.
 * - rong: thẻ rỗng, màn vào, form nhập — trước khi có nội dung để đọc.
 * - cho: đang tải / đang nghĩ thật. Không đặt cho màn chớp dưới 1 giây.
 * - cong: phải đăng nhập mới đi tiếp.
 * - loi: lỗi HỆ THỐNG hoặc thanh toán. Không dùng cho lỗi nhập liệu, không
 *   bao giờ phản ứng với NỘI DUNG lá số.
 * - su-kien: đúng lúc một việc vừa thành công, một lần.
 */
export const ANH_THEO_CHO = {
  'dau-trang': ['default', 'listening', 'serious', 'tiny-smile', 'moving', 'neutral', 'using-laptop', 'waving'],
  rong: ['default', 'one-ear-up', 'leaning-closer', 'reading', 'curious', 'sitting-neutral'],
  cho: ['thinking', 'serious'],
  cong: ['waving'],
  loi: ['concerned', 'playing'],
  'su-kien': ['proud', 'celebrate'],
} as const satisfies Record<string, readonly (TrangThaiCeles | MinhHoaCeles)[]>

export type ChoDatCeles = keyof typeof ANH_THEO_CHO
type AnhCho<C extends ChoDatCeles> = (typeof ANH_THEO_CHO)[C][number]

/** Hai ảnh tự đứng yên: nghiêm (mục 9) và lo lắng (đang báo lỗi). */
const DUNG_YEN: readonly string[] = ['serious', 'concerned']

type Props<C extends ChoDatCeles> = {
  cho: C
  /** Cỡ ô vuông, px. */
  cao?: number
  /** Cỡ dưới 640px. Bỏ trống thì giữ `cao`. Đổi bằng CSS, không bằng JS (SSR khớp hydrate). */
  caoNho?: number
  /** Ảnh trên nếp gấp → `loading="eager"`. Không dùng `priority` (lỗi thời ở Next 16). */
  ngay?: boolean
  /** Tắt thở ngoài hai ảnh tự đứng yên. Mục 9: an toàn thắng nhân vật. */
  tatChuyenDong?: boolean
  className?: string
} & (
  | { trangThai: Extract<AnhCho<C>, TrangThaiCeles>; minhHoa?: never }
  | { minhHoa: Extract<AnhCho<C>, MinhHoaCeles>; trangThai?: never }
)

export function CelesMascot<C extends ChoDatCeles>(props: Props<C>) {
  const { cao = 56, caoNho, ngay = false, tatChuyenDong = false, className = '' } = props
  const ten: string = props.minhHoa ?? props.trangThai ?? 'default'
  const dungYen = tatChuyenDong || DUNG_YEN.includes(ten)

  const co: Record<string, string> = { '--celes-cao': `${cao}px` }
  if (caoNho) co['--celes-cao-nho'] = `${caoNho}px`

  return (
    <Image
      src={`/celes/${ten}.webp`}
      alt=""
      aria-hidden
      width={cao}
      height={cao}
      /*
       * Ảnh nguồn: 512px vuông, nền trong suốt, khung nhân vật cao 86% — cả 18
       * ảnh chuẩn hoá bằng `scripts/lam-sach-anh-celes.py` (nguồn v2.3). Cùng
       * `cao` thì cùng chiều cao KHUNG, không cùng chiều cao THÂN: tư thế nằm
       * ngang (concerned, leaning-closer, playing) trông nhỏ hơn — đã chấp nhận.
       * Bóng đổ KHÔNG nằm trong ảnh (xem `.celes-anh` trong globals.css).
       *
       * Tắt tối ưu của Next: tệp tĩnh 30–44KB, đi qua bộ biến đổi ảnh chỉ tốn
       * hạn mức Vercel mà không nhẹ thêm — luật "Ngân sách = 0".
       */
      unoptimized
      loading={ngay ? 'eager' : 'lazy'}
      draggable={false}
      className={`celes-anh ${dungYen ? '' : 'celes-tho'} ${className}`}
      /*
       * Cỡ đi qua biến CSS, không qua `width` inline: inline thắng class nên màn
       * hẹp không đè được. Thuộc tính width/height ở trên giữ chỗ chống CLS.
       */
      style={co as CSSProperties}
    />
  )
}
