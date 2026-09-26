import { lapLaSo } from '@/lib/tuvi/ansao';
import { doSangCuaSao } from '@/lib/tuvi/dosang';
import { boDau } from '../thuc-the';
import { BI_DANH_CUNG, TEN_TAT } from '../v3/truy-hoi-v3';
import { QUAN_HE, type CheDo, type MucThuVien } from './kieu';

/**
 * KIỂM TẤT ĐỊNH một mục vừa trích (KIEN-TRUC-LUAN-GIAI.md mục 7.3). Không nhờ
 * model: câu trích có thật chưa chắc quy tắc đúng — model có thể trích câu nói
 * về Mệnh mà ghi điều kiện là Quan Lộc. Trượt thì bỏ mục.
 */

let tuDien: Set<string> | null = null;
/** Mọi tên sao engine an được — dựng từ chính engine, không chép tay */
export function tuDienSao(): Set<string> {
  if (tuDien) return tuDien;
  const s = new Set<string>();
  for (let y = 1960; y < 2000; y += 7)
    for (let m = 1; m <= 12; m += 4)
      for (let g = 1; g < 24; g += 6)
        for (const gt of ['nam', 'nu'] as const)
          for (const c of lapLaSo({ ngay: 1 + ((y + m) % 27), thang: m, nam: y, gio: g, gioiTinh: gt }).cungs)
            for (const x of c.sao) s.add(x.ten);
  tuDien = s;
  return s;
}

/** Sao có độ sáng trong engine — điều kiện độ sáng cho sao khác là không khớp được */
export function coDoSang(ten: string): boolean {
  for (let i = 0; i < 12; i++) if (doSangCuaSao(ten, i)) return true;
  return false;
}

export const TEN_CUNG = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const TRANG_SINH = ['Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];

const chuan = (s: string) => boDau(s).replace(/\s+/g, ' ').trim();
function coTu(s: string, tu: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${tu.replace(/ /g, '[^a-z0-9]+')}($|[^a-z0-9])`).test(s);
}

/**
 * Các cách sách cổ gọi một sao: tên đủ, tên tắt ở TEN_TAT ("Vũ, Tướng"), và chữ
 * cuối của tên hai chữ ("Xương" cho Văn Xương, "Kình" cho Kình Dương, "Kỵ" cho
 * Hóa Kỵ). Rộng tay có chủ ý: đây là lưới chặn sai cung / sai sao, không phải
 * bộ lọc chính tả.
 */
function cachGoi(ten: string): string[] {
  const t = chuan(ten);
  const tu = t.split(' ');
  const ra = new Set([t, ...(TEN_TAT[ten] ?? [])]);
  if (tu.length === 2) {
    if (tu[1].length >= 2) ra.add(tu[1]);
    if (['ta', 'huu', 'kinh', 'loc', 'dao', 'hong', 'quoc', 'thai', 'tam', 'bat', 'an', 'long', 'phuong'].includes(tu[0])) ra.add(tu[0]);
  }
  return [...ra];
}

/**
 * Độ sáng theo đúng thang engine: chính tinh có M V D B H; phụ tinh chỉ có D (đắc)
 * hoặc H (hãm). Sách viết "Xương Khúc miếu" → với phụ tinh là D. Không chuẩn hoá thì
 * mục mang "M" cho Văn Xương không bao giờ khớp lá số nào.
 */
export function chuanDoSang(ten: string, ds: string[] | undefined): string[] | undefined {
  if (!ds?.length) return undefined;
  const chinhTinh = ['M', 'V', 'D', 'B', 'H'].some((m) => {
    for (let i = 0; i < 12; i++) if (doSangCuaSao(ten, i) === m && (m === 'M' || m === 'V' || m === 'B')) return true;
    return false;
  });
  const ra = chinhTinh ? ds : ds.map((m) => (m === 'B' || m === 'H' ? 'H' : 'D'));
  return [...new Set(ra.filter((m) => ['M', 'V', 'D', 'B', 'H'].includes(m)))];
}

export interface KetQuaKiemMuc {
  dat: boolean;
  lyDo: string[];
  /** Chế độ sau khi kiểm — không đủ dấu hiệu thì ép về add */
  cheDo: CheDo;
}

/** Chữ trong câu trích cho thấy tổ hợp LẬT / HOÁ GIẢI / ĐỔI nghĩa (mục 6.2) */
const DAU_HIEU: Record<Exclude<CheDo, 'add'>, RegExp> = {
  override: /(phan vi|trai lai|lai thanh|lai la|pha cach|hoa ra|nguoc lai|khong con)/,
  neutralize: /(giai|hoa giai|khong so|chang so|khong ky|chang ky|che|bot|giam)/,
  modify: /(neu|tuy|nhung|song|chi|kem|bot|giam|them|cang)/,
};

export function kiemMuc(
  m: Pick<MucThuVien, 'dieuKien' | 'y' | 'cheDo'> & { trich: string },
  doan: { noiDung: string; duongDeMuc: string | null }
): KetQuaKiemMuc {
  const lyDo: string[] = [];
  const noiDungChuan = chuan(doan.noiDung);
  const trichChuan = chuan(m.trich);
  const dict = tuDienSao();

  // 1. Câu trích có nguyên văn trong đoạn
  if (trichChuan.length < 12) lyDo.push('câu trích quá ngắn');
  const viTri = noiDungChuan.indexOf(trichChuan);
  if (viTri < 0) lyDo.push('câu trích không có nguyên văn trong đoạn');

  // 2. Tên sao, cung, quan hệ, độ sáng hợp lệ
  const dk = m.dieuKien;
  if (!dk.sao.length) lyDo.push('điều kiện không có sao nào');
  for (const s of [...dk.sao, ...(dk.khong ?? [])]) {
    if (!dict.has(s.ten)) lyDo.push(`sao không có trong engine: ${s.ten}`);
    if (!(QUAN_HE as readonly string[]).includes(s.quanHe)) lyDo.push(`quan hệ lạ: ${s.quanHe}`);
  }
  for (const s of dk.sao) if (s.doSang?.length && !coDoSang(s.ten)) lyDo.push(`${s.ten} không có độ sáng trong engine`);
  for (const c of dk.cung) if (!TEN_CUNG.includes(c)) lyDo.push(`cung lạ: ${c}`);
  for (const c of dk.chi ?? []) if (!CHI.includes(c)) lyDo.push(`chi lạ: ${c}`);
  for (const t of dk.thuocTinh?.trangSinh ?? []) if (!TRANG_SINH.includes(t)) lyDo.push(`tràng sinh lạ: ${t}`);

  // 3. Sao và cung trong điều kiện PHẢI được nhắc: câu trích + ~300 ký tự trước nó + đề mục
  const truoc = viTri >= 0 ? noiDungChuan.slice(Math.max(0, viTri - 300), viTri) : '';
  const ngu = `${chuan(doan.duongDeMuc ?? '')} ${truoc} ${trichChuan}`;
  for (const s of dk.sao) if (!cachGoi(s.ten).some((g) => coTu(ngu, g))) lyDo.push(`không thấy nhắc ${s.ten}`);
  for (const c of dk.cung) if (!(BI_DANH_CUNG[c] ?? [chuan(c)]).some((b) => coTu(ngu, b))) lyDo.push(`không thấy nhắc cung ${c}`);

  // 4. Câu nghĩa trung tính
  const soChu = m.y.trim().split(/\s+/).filter(Boolean).length;
  if (soChu < 4 || soChu > 45) lyDo.push(`câu nghĩa ${soChu} chữ (cần 4–45)`);
  if (/\bbạn\b/i.test(m.y)) lyDo.push('câu nghĩa có "bạn"');
  if (/\b(nên|hãy|cần phải)\b/i.test(m.y)) lyDo.push('câu nghĩa có lời khuyên');

  // 5. Chế độ khác add phải có dấu hiệu trong câu trích; không thì ép về add
  let cheDo: CheDo = m.cheDo;
  if (cheDo !== 'add' && !DAU_HIEU[cheDo].test(trichChuan)) cheDo = 'add';

  return { dat: lyDo.length === 0, lyDo, cheDo };
}

/** Khoá gộp: cùng điều kiện (không kể thứ tự sao) + cùng chiều */
export function khoaGop(m: Pick<MucThuVien, 'dieuKien' | 'nhan'>): string {
  const dk = m.dieuKien;
  const sao = dk.sao.map((s) => `${s.ten}@${s.quanHe}${s.doSang?.length ? `:${[...s.doSang].sort().join('')}` : ''}`).sort();
  const khong = (dk.khong ?? []).map((s) => `${s.ten}@${s.quanHe}`).sort();
  return JSON.stringify([[...dk.cung].sort(), [...(dk.chi ?? [])].sort(), sao, khong, dk.thuocTinh ?? {}, dk.gioiTinh ?? '', m.nhan.chieu]);
}

/** Khoá điều kiện, bỏ chiều — hai mục cùng khoá này mà khác chiều là mâu thuẫn */
export function khoaDieuKien(m: Pick<MucThuVien, 'dieuKien' | 'nhan'>): string {
  return khoaGop({ ...m, nhan: { ...m.nhan, chieu: 'trung' } });
}
