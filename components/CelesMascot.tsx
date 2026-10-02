import Image from 'next/image'

/*
 * Linh vật Celes trên web.
 *
 * Luật đặt (docs/chien-luoc/celes-visual-character-system.md mục 12):
 * Celes xuất hiện nơi người dùng đang CHỜ hoặc đang TRÒ CHUYỆN — không xuất
 * hiện nơi người ta đang ĐỌC nội dung. Đừng gắn vào trang luận giải hay mệnh bàn.
 *
 * Trạng thái hình ánh xạ TỪ `characterHook`, không phải cùng một enum với nó
 * (mục 5). Phase 3 chưa có `characterHook` trong mã nên mọi chỗ truyền tay;
 * khi Phase 3 xong thì chỉ việc nối dây vào `trangThai`.
 */

/**
 * Bảy trạng thái bật ở Phase 3. HAS_RECEIPTS và NOT_BUYING_IT bị khoá —
 * xem mục 4 (asset loading) và mục 6 (Phase 3 lock).
 *
 * Giá trị ở đây là tên TỆP (kebab-case). Tài liệu viết tên khái niệm IN HOA:
 * 'found-something' ứng với FOUND_SOMETHING. Chúng KHÔNG cùng enum với
 * `characterHook` — mục 5 nói rõ, đừng map thẳng một-một.
 */
export type TrangThaiCeles =
  | 'default'
  | 'listening'
  | 'thinking'
  | 'serious'
  | 'celebrate'

type Props = {
  trangThai?: TrangThaiCeles
  /** Cỡ ô vuông, px. Mục 12 chốt: 56 trang Hỏi Celes, 80 màn chờ và trạng thái rỗng. */
  cao?: number
  /**
   * Tắt thở khi ngữ cảnh nghiêm túc. Mục 9: `SafetyOverlay != NORMAL` thì tắt.
   * "Con thỏ không được nhún nhảy khi người ta đang nói chuyện mất mát."
   */
  tatChuyenDong?: boolean
  className?: string
}

export function CelesMascot({
  trangThai = 'default',
  cao = 56,
  tatChuyenDong = false,
  className = '',
}: Props) {
  // `serious` tự tắt thở, không cần nơi gọi nhớ truyền cờ.
  const dungYen = tatChuyenDong || trangThai === 'serious'

  return (
    <Image
      src={`/celes/${trangThai}.webp`}
      alt=""
      aria-hidden
      width={cao}
      height={cao}
      /*
       * Ảnh nguồn: 512px vuông, nền trong suốt, nhân vật cao 86% khung — cả
       * bảy state đã chuẩn hoá cùng khung và cùng tỉ lệ bằng
       * `scripts/lam-sach-anh-celes.py`, nên cùng một `cao` thì con thỏ ở mọi
       * trạng thái ra bằng nhau. Bóng đổ KHÔNG nằm trong ảnh (xem `.celes-anh`
       * trong globals.css): nướng bóng vào ảnh thì nền tối hiện ra vệt trắng.
       *
       * Tắt tối ưu của Next: tệp tĩnh 38–43KB, đi qua bộ biến đổi ảnh chỉ tốn
       * hạn mức Vercel mà không nhẹ thêm — luật "Ngân sách = 0".
       */
      unoptimized
      draggable={false}
      className={`celes-anh ${dungYen ? '' : 'celes-tho'} ${className}`}
      /* width/height cố định để không đẩy layout — docs/bay/giao-dien.md, CLS. */
      style={{ width: cao, height: cao, flexShrink: 0 }}
    />
  )
}
