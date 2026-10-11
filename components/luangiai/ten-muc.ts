import type { DiemCung } from '@/lib/rag/v3/du-kien';
import type { TuDien } from '@/lib/i18n/vi';

/** Nhãn mức của một lĩnh vực theo ngôn ngữ — TEN_MUC trong du-kien giữ bản Việt cho dữ liệu */
export const tenMuc = (muc: DiemCung['muc'], t: TuDien) =>
  ({ 'Mạnh': t.chuyenSau.mucManh, 'Bình': t.chuyenSau.mucBinh, 'Cần gắng': t.chuyenSau.mucGang })[muc];
