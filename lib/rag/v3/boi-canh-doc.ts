/**
 * BỐI CẢNH NGƯỜI ĐỌC (30/09/2026) — vài điều người đọc tự chọn về hoàn cảnh hiện tại
 * (duyên, con cái, công việc, cách gọi người bạn đời), để Celes viết đúng GÓC NHÌN và THÌ.
 *
 * Chủ dự án: người đã có gia đình đọc câu "bao giờ gặp người ấy" là thấy Celes không biết
 * mình là ai. Nhưng lá số không đổi theo lời kể: bối cảnh chỉ đổi cách nói (đã/đang/sẽ, gọi
 * "vợ" hay "người ấy"), KHÔNG đổi kết luận — luật này nằm ngay trong khối gửi model.
 *
 * Tệp THUẦN (không chạm DB, không chạm trình duyệt): route, trang và bộ thử đều dùng chung.
 * Lưu ở đâu: lib/store/boi-canh-doc.ts.
 */

export type TruongBoiCanh = 'duyen' | 'xungHo' | 'con' | 'viec';

export interface BoiCanhDoc {
  duyen?: 'doc-than' | 'dang-yeu' | 'da-cuoi' | 'da-chia-tay' | 'khong-noi';
  xungHo?: 'nguoi-ay' | 'vo' | 'chong';
  con?: 'chua-co' | 'dang-mong' | 'da-co' | 'khong-noi';
  viec?: 'dang-hoc' | 'di-lam' | 'tu-kinh-doanh' | 'dang-tim' | 'nghi-huu' | 'khong-noi';
}

/** Lựa chọn hiện trên chip — `moTa` là câu gửi model */
export const LUA_CHON: { [K in TruongBoiCanh]: { hoi: string; chon: { id: NonNullable<BoiCanhDoc[K]>; ten: string; moTa: string }[] } } = {
  duyen: {
    hoi: 'Chuyện tình cảm của bạn hiện giờ',
    chon: [
      { id: 'doc-than', ten: 'Đang độc thân', moTa: 'Đang độc thân' },
      { id: 'dang-yeu', ten: 'Đang có người thương', moTa: 'Đang trong một mối quan hệ, chưa kết hôn' },
      { id: 'da-cuoi', ten: 'Đã kết hôn', moTa: 'Đã kết hôn' },
      { id: 'da-chia-tay', ten: 'Từng kết hôn / đã chia tay', moTa: 'Đã đi qua một cuộc hôn nhân hoặc một lần chia tay lớn' },
      { id: 'khong-noi', ten: 'Không muốn nói', moTa: '' },
    ],
  },
  xungHo: {
    hoi: 'Celes gọi người ấy của bạn là',
    chon: [
      { id: 'nguoi-ay', ten: 'Người ấy', moTa: '' },
      { id: 'vo', ten: 'Vợ', moTa: 'vợ' },
      { id: 'chong', ten: 'Chồng', moTa: 'chồng' },
    ],
  },
  con: {
    hoi: 'Chuyện con cái hiện giờ',
    chon: [
      { id: 'chua-co', ten: 'Chưa có con', moTa: 'Chưa có con' },
      { id: 'dang-mong', ten: 'Đang mong con', moTa: 'Đang mong có con' },
      { id: 'da-co', ten: 'Đã có con', moTa: 'Đã có con' },
      { id: 'khong-noi', ten: 'Không muốn nói', moTa: '' },
    ],
  },
  viec: {
    hoi: 'Công việc của bạn hiện giờ',
    chon: [
      { id: 'dang-hoc', ten: 'Đang đi học', moTa: 'Đang đi học, chưa đi làm chính thức' },
      { id: 'di-lam', ten: 'Đang đi làm', moTa: 'Đang đi làm công ăn lương' },
      { id: 'tu-kinh-doanh', ten: 'Tự kinh doanh', moTa: 'Đang tự kinh doanh / làm chủ' },
      { id: 'dang-tim', ten: 'Đang tìm hướng mới', moTa: 'Đang tìm việc hoặc tìm hướng đi mới' },
      { id: 'nghi-huu', ten: 'Đã nghỉ hưu', moTa: 'Đã nghỉ hưu' },
      { id: 'khong-noi', ten: 'Không muốn nói', moTa: '' },
    ],
  },
};

/** Chủ đề nào hỏi trường nào. Chủ đề ngoài bảng này không dùng bối cảnh (khoá đệm giữ nguyên). */
export const TRUONG_THEO_CHU_DE: Record<string, TruongBoiCanh[]> = {
  'tinh-duyen': ['duyen', 'xungHo'],
  'con-cai': ['con'],
  'su-nghiep': ['viec'],
};

/** Xưng hô chỉ hỏi khi đã có người ấy */
export const canHoiXungHo = (bc: BoiCanhDoc) => bc.duyen === 'dang-yeu' || bc.duyen === 'da-cuoi';

/** Trường còn phải hỏi của chủ đề — rỗng là đủ, đọc luôn */
export function conThieu(bc: BoiCanhDoc, chuDe: string): TruongBoiCanh[] {
  return (TRUONG_THEO_CHU_DE[chuDe] ?? []).filter((t) => (t === 'xungHo' ? canHoiXungHo(bc) && !bc.xungHo : !bc[t]));
}

/** Ép dữ liệu (trình duyệt, DB) về bối cảnh hợp lệ; giá trị lạ bỏ đi */
export function lamSachBoiCanh(x: unknown): BoiCanhDoc {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  const ra: BoiCanhDoc = {};
  for (const t of Object.keys(LUA_CHON) as TruongBoiCanh[]) {
    const v = o[t];
    if (typeof v === 'string' && LUA_CHON[t].chon.some((c) => c.id === v)) (ra as Record<string, string>)[t] = v;
  }
  return ra;
}

/** Các trường có nghĩa với chủ đề này (bỏ "không muốn nói", bỏ "người ấy" vì đó là mặc định) */
function coNghia(bc: BoiCanhDoc, chuDe: string): [TruongBoiCanh, string][] {
  return (TRUONG_THEO_CHU_DE[chuDe] ?? [])
    .map((t) => [t, bc[t]] as [TruongBoiCanh, string | undefined])
    .filter((p): p is [TruongBoiCanh, string] => Boolean(p[1]) && p[1] !== 'khong-noi' && p[1] !== 'nguoi-ay')
    .filter(([t]) => t !== 'xungHo' || canHoiXungHo(bc));
}

/** Hậu tố khoá đệm — bài viết cho "đã kết hôn" không được đưa cho người "đang độc thân" */
export function khoaBoiCanh(bc: BoiCanhDoc, chuDe: string): string {
  const p = coNghia(bc, chuDe);
  return p.length ? `|bc:${p.map(([, v]) => v).join('.')}` : '';
}

/** Khối gửi model; rỗng khi không có gì để nói */
export function khoiBoiCanh(bc: BoiCanhDoc, chuDe: string): string {
  const p = coNghia(bc, chuDe);
  if (!p.length) return '';
  const moTa = (t: TruongBoiCanh, v: string) => LUA_CHON[t].chon.find((c) => c.id === v)?.moTa ?? '';
  const hoanCanh = p.filter(([t]) => t !== 'xungHo').map(([t, v]) => moTa(t, v)).filter(Boolean);
  const goi = p.find(([t]) => t === 'xungHo');
  return [
    'BỐI CẢNH NGƯỜI ĐỌC TỰ CHỌN (người đọc kể, KHÔNG phải dữ kiện lá số, không trích mã cho nó):',
    hoanCanh.length ? `- Hoàn cảnh hiện tại: ${hoanCanh.join('; ')}.` : '',
    goi ? `- Gọi người bạn đời của người đọc là "${moTa('xungHo', goi[1])}" thay cho "người ấy", "bạn đời".` : '',
    '- Bối cảnh chỉ dùng để chọn GÓC NHÌN và THÌ: chuyện đã xảy ra thì nói ở thì đã/đang (người đã kết hôn thì bàn đời sống hôn nhân đang có, không hỏi "bao giờ gặp"; chưa có con thì duyên con nói ở thì sẽ).',
    '- KHÔNG đổi kết luận của lá số, không nói tốt lên hay xấu đi vì bối cảnh. Lá số mô tả khác hoàn cảnh người đọc kể (vd. báo duyên muộn mà người đọc đã kết hôn) thì đọc nó như nét của mối quan hệ, không bảo người đọc là sai.',
  ]
    .filter(Boolean)
    .join('\n');
}

