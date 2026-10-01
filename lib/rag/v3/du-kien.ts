import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { CHINH_TINH as DS_CHINH_TINH, TU_HOA } from '@/lib/tuvi/constants';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { nhanDangThucThe } from '../thuc-the';
import { CHU_DE_V3, type CauHoiV3, type ChuDeV3 } from './khung';
import { dongTrangThaiDuyen } from './trang-thai-duyen';

/**
 * DỮ KIỆN CHO MỘT CÂU HỎI v3 — engine đọc lá số theo ma trận cung.
 *
 * Đây là nửa "luận" mà trước đây Claude làm tay trong bản nháp. Nó phải nằm ở
 * mã chứ không nằm ở prompt: cùng một câu hỏi thì luôn đọc cùng những cung ấy,
 * theo cùng thứ tự ưu tiên, dù model là gì. Để model tự chọn cung thì mỗi lượt
 * một kiểu, và "đã xem đủ Tật Ách chưa" không kiểm được.
 *
 * Mỗi dữ kiện mang mã F### để model trích khi dựng dàn ý; validator đối chiếu.
 */

export const PHIEN_BAN_DU_KIEN_V3 = '2026.10.1';

export interface DuKienV3 {
  id: string;
  vaiTro: string;
  noiDung: string;
  /** Tên sao có mặt trong dữ kiện này — tập được phép nêu ở phần "Vì sao" */
  sao: string[];
  cung?: string;
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const mod = (n: number, m: number) => ((n % m) + m) % m;

export function tuoiAm(laSo: LaSo, namXem: number): number {
  return namXem - laSo.thongTin.amLich.nam + 1;
}

export function chuDeCua(q: CauHoiV3): ChuDeV3 | undefined {
  return CHU_DE_V3.find((c) => c.id === q.chuDe);
}

function timCung(laSo: LaSo, ten: string, namXem: number): Cung | undefined {
  if (ten === 'THAN') return laSo.cungs.find((c) => c.laCungThan);
  if (ten === 'DV') return cungDaiVan(laSo, tuoiAm(laSo, namXem));
  if (ten === 'TH') return laSo.cungs[cungTieuHan(laSo, tuoiAm(laSo, namXem))];
  return laSo.cungs.find((c) => c.tenCung === ten);
}

const DO_SANG = KHUON.vi.doSang;

/* -------------------------------------------------------------------------- */
/* ĐIỂM MẠNH – YẾU TỪNG CUNG — luật cố định, chờ chuyên gia chỉnh trọng số      */
/* -------------------------------------------------------------------------- */

const DIEM_SANG: Record<string, number> = { M: 2, V: 1.5, D: 1, L: 0.5, B: 0, H: -1.5 };
const CAT: Record<string, number> = {
  'Tả Phù': 1, 'Hữu Bật': 1, 'Văn Xương': 1, 'Văn Khúc': 1, 'Thiên Khôi': 1, 'Thiên Việt': 1,
  'Lộc Tồn': 1, 'Hóa Lộc': 1.5, 'Hóa Quyền': 1, 'Hóa Khoa': 1, 'Thiên Quan': 0.5, 'Thiên Phúc': 0.5,
  'Ân Quang': 0.5, 'Thiên Quý': 0.5, 'Long Trì': 0.5, 'Phượng Các': 0.5, 'Thiên Mã': 0.5,
  'Tam Thai': 0.5, 'Bát Tọa': 0.5, 'Thiên Đức': 0.5, 'Nguyệt Đức': 0.5, 'Giải Thần': 0.5,
};
const HUNG: Record<string, number> = {
  'Kình Dương': 1, 'Đà La': 1, 'Hỏa Tinh': 1, 'Linh Tinh': 1, 'Địa Không': 1, 'Địa Kiếp': 1,
  'Hóa Kỵ': 1.5, 'Thiên Hình': 0.5, 'Kiếp Sát': 0.5, 'Đại Hao': 0.5, 'Tiểu Hao': 0.5,
  'Tang Môn': 0.5, 'Bạch Hổ': 0.5, 'Thiên Riêu': 0.5,
};

/** Một sao góp vào điểm của cung — để giao diện nói được VÌ SAO một mặt đời mạnh hay yếu */
export interface GopDiem {
  ten: string;
  diem: number;
  /** Để giao diện giải nghĩa bằng lời thường thay vì đọc tên sao */
  loai: 'chinh' | 'vcd' | 'cat' | 'hung' | 'tuan';
  sao?: string;
  doSang?: string;
}

/** Tên ba nhóm khi nói với người đọc — prompt và Bản đồ mạnh–yếu dùng chung, để hai bên gọi cùng một tên */
export const TEN_MUC: Record<DiemCung['muc'], string> = {
  'Mạnh': 'Thuận lợi',
  'Bình': 'Ổn định',
  'Cần gắng': 'Cần chăm chút',
};

function chiTietBanCung(c: Cung, xung?: Cung): { diem: number; gop: GopDiem[] } {
  const gop: GopDiem[] = [];
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  for (const s of chinh)
    gop.push({
      ten: `${s.ten}${s.doSang ? ` (${DO_SANG[s.doSang] ?? s.doSang})` : ''}`,
      diem: DIEM_SANG[s.doSang ?? 'B'] ?? 0,
      loai: 'chinh',
      sao: s.ten,
      doSang: s.doSang ?? undefined,
    });
  if (!chinh.length && xung) {
    const muon = xung.sao.filter((s) => s.loai === 'chinh-tinh');
    gop.push({
      ten: `Vô chính diệu, mượn ${muon.map((s) => s.ten).join(', ') || 'cung đối'}`,
      diem: 0.5 * muon.reduce((a, s) => a + (DIEM_SANG[s.doSang ?? 'B'] ?? 0), 0) - 0.5,
      loai: 'vcd',
      sao: muon.map((s) => s.ten).join(', ') || undefined,
    });
  }
  for (const s of c.sao) {
    // Văn tinh hãm không còn là cát tinh
    if ((s.ten === 'Văn Xương' || s.ten === 'Văn Khúc') && s.doSang === 'H') continue;
    if (CAT[s.ten]) gop.push({ ten: s.ten, diem: CAT[s.ten], loai: 'cat', sao: s.ten });
    /*
     * Hung tinh ĐẮC ĐỊA chỉ trừ một nửa (25/09/2026). Bản trước trừ như nhau bất
     * kể vị trí: Kình Dương ở tứ mộ hay Hóa Kỵ ở Thìn Tuất Sửu Mùi — sách xếp là
     * bớt hung, có khi thành dụng — vẫn kéo cung xuống ngang lúc hãm địa.
     */
    if (HUNG[s.ten]) {
      const dac = s.doSang === 'D';
      gop.push({ ten: `${s.ten}${dac ? ' (đắc)' : ''}`, diem: -(dac ? HUNG[s.ten] / 2 : HUNG[s.ten]), loai: 'hung', sao: s.ten, doSang: s.doSang ?? undefined });
    }
  }
  let d = gop.reduce((a, g) => a + g.diem, 0);
  // Tuần / Triệt làm giảm cả cát lẫn hung
  if (c.coTuan || c.coTriet) {
    d *= 0.6;
    const ten = c.coTuan && c.coTriet ? 'Tuần và Triệt' : c.coTuan ? 'Tuần' : 'Triệt';
    gop.push({ ten: `${ten} — làm dịu cả tốt lẫn xấu`, diem: 0, loai: 'tuan', sao: ten });
  }
  return { diem: d, gop };
}

function diemBanCung(c: Cung, xung?: Cung): number {
  return chiTietBanCung(c, xung).diem;
}

export interface DiemCung {
  cung: string;
  linhVuc: string;
  diem: number;
  muc: 'Mạnh' | 'Bình' | 'Cần gắng';
}

export const LINH_VUC_CUNG: Record<string, string> = {
  'Mệnh': 'Tính cách', 'Quan Lộc': 'Sự nghiệp', 'Tài Bạch': 'Tiền bạc', 'Phu Thê': 'Tình duyên',
  'Tử Tức': 'Con cái', 'Phụ Mẫu': 'Cha mẹ', 'Huynh Đệ': 'Anh chị em', 'Nô Bộc': 'Bạn bè, quý nhân',
  'Phúc Đức': 'Đời sống tinh thần', 'Tật Ách': 'Sức khỏe', 'Điền Trạch': 'Nhà cửa', 'Thiên Di': 'Ra ngoài',
};

/**
 * Điểm từng cung KÈM chi tiết — cho Bản đồ mạnh–yếu ở /la-so.
 * `trongCung`: sao của chính cung góp bao nhiêu; `soiVao`: cung đối diện và hai
 * cung tam hợp góp bao nhiêu (trọng số nhỏ hơn, đúng như `diemTungCung`).
 */
export interface ChiTietDiemCung extends DiemCung {
  trongCung: GopDiem[];
  soiVao: { cung: string; linhVuc: string; diem: number }[];
}

export function chiTietDiemTungCung(laSo: LaSo): ChiTietDiemCung[] {
  const theoChi = (i: number) => laSo.cungs[mod(i, 12)];
  const ds = diemTungCung(laSo);
  const lam = (n: number) => Math.round(n * 10) / 10;
  return laSo.cungs.map((c) => {
    const { xungChieu, tamHop } = tamPhuongTuChinh(c.chiIndex);
    const x = theoChi(xungChieu);
    const [t1, t2] = [theoChi(tamHop[0]), theoChi(tamHop[1])];
    return {
      ...ds.find((v) => v.cung === c.tenCung)!,
      trongCung: chiTietBanCung(c, x).gop,
      soiVao: [
        { cung: x.tenCung, linhVuc: LINH_VUC_CUNG[x.tenCung] ?? x.tenCung, diem: lam(0.5 * diemBanCung(x, c)) },
        { cung: t1.tenCung, linhVuc: LINH_VUC_CUNG[t1.tenCung] ?? t1.tenCung, diem: lam(0.3 * diemBanCung(t1)) },
        { cung: t2.tenCung, linhVuc: LINH_VUC_CUNG[t2.tenCung] ?? t2.tenCung, diem: lam(0.3 * diemBanCung(t2)) },
      ],
    };
  });
}

export function diemTungCung(laSo: LaSo): DiemCung[] {
  const theoChi = (i: number) => laSo.cungs[mod(i, 12)];
  const ds = laSo.cungs.map((c) => {
    const { xungChieu, tamHop } = tamPhuongTuChinh(c.chiIndex);
    const x = theoChi(xungChieu);
    const d =
      diemBanCung(c, x) +
      0.5 * diemBanCung(x, c) +
      0.3 * diemBanCung(theoChi(tamHop[0])) +
      0.3 * diemBanCung(theoChi(tamHop[1]));
    return { cung: c.tenCung, linhVuc: LINH_VUC_CUNG[c.tenCung] ?? c.tenCung, diem: Math.round(d * 10) / 10 };
  });
  const xep = [...ds].sort((a, b) => b.diem - a.diem);
  return ds.map((d) => {
    const hang = xep.indexOf(d);
    return { ...d, muc: hang < 4 ? 'Mạnh' : hang >= 8 ? 'Cần gắng' : 'Bình' };
  });
}

/* -------------------------------------------------------------------------- */
/* MÔ TẢ CUNG                                                                  */
/* -------------------------------------------------------------------------- */

function tenSao(s: { ten: string; doSang?: string | null }): string {
  return s.doSang ? `${s.ten} (${DO_SANG[s.doSang] ?? s.doSang})` : s.ten;
}

/**
 * Câu hỏi có hỏi về THỜI ĐIỂM không (giai đoạn, tuổi, năm, sớm/muộn).
 *
 * Câu không hỏi thời điểm thì dữ kiện không kèm mốc tuổi. Đo 24/09/2026 trên
 * lá số A: "trước khoảng 30 tuổi dòng tiền dễ bị chặn" lặp ở bảy câu, "giai
 * đoạn 25–34 tuổi" ở bảy câu khác — vì MỌI cung đều mang nhãn "đại vận X–Y
 * tuổi" và Triệt luôn kèm "trước 30 tuổi", nên model gắn mốc vào cả câu hỏi
 * "tôi hợp nghề gì". Người đọc đi hết một chủ đề thấy cùng một mốc năm lần.
 */
export function hoiThoiDiem(q: CauHoiV3): boolean {
  // 30/09/2026: đọc trường thoiDiem của khung thay cho regex trên câu chữ (regex bắt nhầm "đỉnh", "tuổi" trong phần mô tả)
  return q.thoiDiem !== 'khong';
}

/*
 * Câu ngang hàng (TQ12, 01/10/2026): nét chính tinh trong KHUON viết cho "bạn", nên ở
 * cung Phụ Mẫu nó thành "Thái Dương: bạn dễ kéo nhóm đi" — model chép nguyên thành tính
 * của người đọc, luật trong phạm vi câu hỏi không cãi lại được dữ kiện. Ở các cung này
 * nhãn phải nói rõ sao tả AI, và sao hãm phải được đánh dấu (KHUON chỉ có nét lúc sáng).
 */
const CHU_NGU_NGANG_HANG: Record<string, string> = {
  'Phụ Mẫu': 'cha mẹ, người đi trước',
  'Huynh Đệ': 'anh chị em',
  'Nô Bộc': 'bạn bè, người cộng tác',
  'Phu Thê': 'người phối ngẫu và mối gắn bó đôi lứa',
  'Tử Tức': 'con cái, người mình nuôi dạy',
};

/*
 * SAO Ở CUNG NÀO THÌ NÓI VỀ CHUYỆN CỦA CUNG ẤY (01/10/2026, chủ dự án: "Tả Hữu ở Phu Thê mà
 * luận như Tả Hữu ở Mệnh thì sai hoàn toàn"). Câu nghĩa trong KHUON viết cho "bạn"; trước đây
 * chỉ ba cung ngang hàng có nhãn đổi chủ ngữ, các cung khác chỉ có "(diễn giải theo phần đời
 * của cung này)" ở chính tinh và KHÔNG có nhãn nào ở phụ tinh — model chép thẳng thành tính
 * cách người đọc. Giờ mọi cung ≠ Mệnh/Thân đều có nhãn, cho cả chính tinh lẫn phụ tinh.
 */
const CHU_NGU_VIEC: Record<string, string> = {
  'Tài Bạch': 'chuyện tiền bạc — cách tiền đến, giữ và đi',
  'Quan Lộc': 'chuyện công việc, sự nghiệp',
  'Điền Trạch': 'chuyện nhà cửa, gia sản, nơi ở',
  'Phúc Đức': 'chuyện bên trong — thứ khiến người ta thấy yên, và nếp nhà, họ hàng',
  'Tật Ách': 'chuyện sức khoẻ và mức năng lượng',
  'Thiên Di': 'chuyện ra ngoài, người ngoài và môi trường bên ngoài',
};

/** Nhãn đổi chủ ngữ cho các nét viết cho "bạn" — rỗng ở Mệnh/Thân */
function nhanChuNgu(c: Cung, docLaThan = false): string {
  if (c.tenCung === 'Mệnh' || (c.laCungThan && docLaThan)) return '';
  const nguoi = CHU_NGU_NGANG_HANG[c.tenCung];
  // celes-domain 01/10: đổi chủ ngữ máy móc làm Thiên Riêu ở Phu Thê thành "bạn đời dễ sa vào điều không nên"
  // — nên chỉ chuyển TÍNH CHẤT, cấm suy ra ngoại tình / bệnh / mất mát / tai nạn của người khác
  if (nguoi)
    return `ở cung này sao tả ${nguoi}, KHÔNG tả bạn; chữ "bạn" trong nét dưới đọc là "${nguoi}" — chỉ giữ tính chất chung của nét (thuận hay vướng, gần hay xa, có người đỡ hay không), không suy ra ngoại tình, bệnh tật, mất mát hay tai nạn của người ấy`;
  const viec = CHU_NGU_VIEC[c.tenCung];
  return viec
    ? `ở cung này sao nói về ${viec} — chỉ chuyển tính chất chung của nét dưới (thuận hay vướng, nhanh hay chậm, giữ được hay hao) sang chuyện ấy, KHÔNG thành tính cách bạn và không tự thêm chi tiết cụ thể mà dữ kiện, nguồn không nói`
    : '(diễn giải theo phần đời của cung này)';
}

/*
 * SAO NẶNG / SAO NHẸ. Mọi sao của cung chính đều vào dữ kiện (chủ dự án 01/10: "mọi chính,
 * phụ tinh đều được xét"); nhưng đổ cả 15 sao ngang hàng thì 78% câu thành danh sách sao
 * (docs/bay/ai-rag.md). Nên chia hai tầng: sao nặng dựng ý, sao nhẹ chỉ làm sắc thái.
 * Sao nặng = cát/hung có trọng số chấm điểm + tứ hóa + nhóm đào hoa/cô quả/khốc hư (đổi hẳn
 * nghĩa một cung) + sao chủ đề của câu.
 */
const NANG_THEM = new Set(['Thiên Khốc', 'Thiên Hư', 'Đào Hoa', 'Hồng Loan', 'Thiên Hỷ', 'Cô Thần', 'Quả Tú', 'Thiên Không', 'Lưu Hà', 'Phá Toái']);
export function laSaoNang(s: { ten: string; loai: string }, saoChuDe: Set<string> = new Set()): boolean {
  if (s.loai === 'chinh-tinh' || s.loai === 'tu-hoa') return true;
  return CAT[s.ten] !== undefined || HUNG[s.ten] !== undefined || NANG_THEM.has(s.ten) || saoChuDe.has(s.ten);
}

/** Theo TÊN (truy hồi chỉ có tên): chính tinh, tứ hóa, cát/hung có trọng số, nhóm đào hoa/cô quả/khốc hư */
const CHINH_TINH = new Set<string>(DS_CHINH_TINH);
export function laTenSaoNang(ten: string): boolean {
  return CHINH_TINH.has(ten) || ten.startsWith('Hóa ') || CAT[ten] !== undefined || HUNG[ten] !== undefined || NANG_THEM.has(ten);
}

/**
 * Mã F### của cung chính và cung xung chiếu có sao hung nặng (hoặc Hóa Kỵ) — bài nên có ít nhất một ý
 * trích những mã này. Dùng cho cảnh báo độ phủ của kiem-v3 (đo, chưa chặn).
 */
export function maCanNhac(dk: DuKienV3[]): string[] {
  return dk
    .filter((d) => d.noiDung.startsWith('Cung ') && (d.vaiTro === 'cung chính' || d.vaiTro.startsWith('xung chiếu')))
    // Hung tinh đắc địa được ghi "(đắc địa: …)" trước dấu hai chấm — chỉ hung tinh KHÔNG đắc mới đòi một ý lực kéo
    .filter((d) => d.sao.some((t) => HUNG[t] !== undefined && d.noiDung.includes(`${t}: `)))
    .map((d) => d.id);
}

/** Độ sáng của PHỤ tinh đổi chiều nghĩa — KHUON chỉ có nét lúc bình thường */
function dauSangPhu(s: { ten: string; doSang?: string | null }): string {
  if (HUNG[s.ten] !== undefined && ['M', 'V', 'D'].includes(s.doSang ?? '')) return ' (đắc địa: bớt hại, có khi thành lực)';
  if ((s.ten === 'Thiên Khốc' || s.ten === 'Thiên Hư') && ['M', 'V', 'D'].includes(s.doSang ?? '')) return ' (đắc địa: trước vất vả sau thành, buồn lo hoá động lực)';
  if (CAT[s.ten] !== undefined && s.doSang === 'H') return ' (hãm: nét tốt yếu đi nhiều)';
  return '';
}
const dauHam = (s: { doSang?: string | null }) => (s.doSang === 'H' ? ' (HÃM: nét dưới yếu đi hoặc lệch — nói mặt kém, không tả như khi sáng)' : '');

/** Vai của một cung trong gói dữ kiện: cung chính đọc đủ, xung chiếu tác động mạnh thứ hai, tam hợp đỡ/kéo */
type CheDoCung = 'chinh' | 'xung' | 'tam-hop';

/*
 * GIÁP CUNG — hai cung liền kề kẹp cung chính. Trước 01/10 dữ kiện không có, nên "Tả Hữu giáp
 * Phu Thê" hay "Kình Đà giáp Mệnh" không bao giờ tới được model.
 */
const CAP_GIAP: [string, string, 'cát' | 'hung'][] = [
  ['Tả Phù', 'Hữu Bật', 'cát'],
  ['Văn Xương', 'Văn Khúc', 'cát'],
  ['Thiên Khôi', 'Thiên Việt', 'cát'],
  ['Thái Dương', 'Thái Âm', 'cát'],
  ['Tử Vi', 'Thiên Phủ', 'cát'],
  ['Hóa Lộc', 'Hóa Quyền', 'cát'],
  ['Hóa Khoa', 'Hóa Quyền', 'cát'],
  ['Lộc Tồn', 'Hóa Lộc', 'cát'],
  ['Kình Dương', 'Đà La', 'hung'],
  ['Địa Không', 'Địa Kiếp', 'hung'],
  ['Hỏa Tinh', 'Linh Tinh', 'hung'],
];
function giapCung(laSo: LaSo, c: Cung): { noiDung: string; sao: string[] } | null {
  const truoc = laSo.cungs[mod(c.chiIndex - 1, 12)];
  const sau = laSo.cungs[mod(c.chiIndex + 1, 12)];
  const co = (x: Cung, t: string) => x.sao.some((s) => s.ten === t);
  const sang = (t: string) => [truoc, sau].some((x) => x.sao.some((s) => s.ten === t && ['M', 'V', 'D'].includes(s.doSang ?? '')));
  const thay = CAP_GIAP.filter(([a, b]) => (co(truoc, a) && co(sau, b)) || (co(truoc, b) && co(sau, a)))
    // Nhật Nguyệt giáp chỉ là cách tốt khi cả hai sao sáng
    .filter(([a]) => a !== 'Thái Dương' || (sang('Thái Dương') && sang('Thái Âm')));
  if (!thay.length) return null;
  const mat = LINH_VUC_CUNG[c.tenCung] ?? c.tenCung;
  const cat = thay.filter((t) => t[2] === 'cát').map(([a, b]) => `${a}–${b}`);
  const hung = thay.filter((t) => t[2] === 'hung').map(([a, b]) => `${a}–${b}`);
  return {
    noiDung:
      `Giáp cung: ${c.tenCung} nằm giữa hai cung liền kề (${truoc.tenCung}, ${sau.tenCung}), đọc theo mặt đời ${mat} — lực nhẹ hơn sao trong cung và tam phương: ` +
      [
        cat.length ? `giáp cát ${cat.join(', ')} — được nâng đỡ từ hai phía` : '',
        // Kình Đà luôn giáp Lộc Tồn (Kình = Lộc Tồn + 1, Đà = Lộc Tồn − 1): cái bị kẹp là phần lộc
        hung.length ? `giáp hung ${hung.join(', ')} — bị kẹp, áp lực dồn từ hai phía${hung.includes('Kình Dương–Đà La') && co(c, 'Lộc Tồn') ? '; Kình Đà kẹp Lộc Tồn: có lộc mà khó giữ trọn' : ''}` : '',
      ]
        .filter(Boolean)
        .join('; ') +
      '.',
    sao: thay.flatMap(([a, b]) => [a, b]),
  };
}

function moTaCung(
  laSo: LaSo,
  c: Cung,
  saoChuDe: Set<string>,
  coMoc = true,
  cheDo: CheDoCung = 'chinh',
  ngangHang = false,
  cungGoc?: Cung,
  docLaThan = false
): { noiDung: string; sao: string[] } {
  const gon = cheDo !== 'chinh';
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  const hoa = c.sao.filter((s) => s.loai === 'tu-hoa');
  const phuMoi = c.sao.filter((s) => s.loai === 'phu-tinh' || s.loai === 'vong-sao');
  const phu = phuMoi.filter((s) => laSaoNang(s, saoChuDe));
  const nhe = phuMoi.filter((s) => !laSaoNang(s, saoChuDe));
  const phan: string[] = [];
  if (chinh.length) {
    phan.push(`chính tinh ${chinh.map(tenSao).join(', ')}`);
  } else {
    const x = laSo.cungs[tamPhuongTuChinh(c.chiIndex).xungChieu];
    const muon = x.sao.filter((s) => s.loai === 'chinh-tinh');
    phan.push(
      `không có chính tinh (vô chính diệu)${muon.length ? `, mượn chính tinh cung xung chiếu ${x.tenCung}: ${muon.map(tenSao).join(', ')}` : ''}`
    );
  }
  if (hoa.length) phan.push(`tứ hóa ${hoa.map((s) => s.ten).join(', ')}`);
  if (phu.length) phan.push(`phụ tinh ${phu.map(tenSao).join(', ')}`);
  if (nhe.length) phan.push(`sao nhẹ ${nhe.map(tenSao).join(', ')}`);
  if (c.trangSinh && cheDo === 'chinh') phan.push(`vòng Tràng Sinh ở ${c.trangSinh}`);
  if (c.coTuan) phan.push('gặp Tuần');
  if (c.coTriet) phan.push('gặp Triệt');
  if (c.laCungThan && c.tenCung !== 'Mệnh') phan.push('là cung an Thân');
  const dv = coMoc && c.daiVan ? `, đại vận ${c.daiVan.tuTuoi}–${c.daiVan.denTuoi} tuổi` : '';
  /*
   * Nghĩa nền của chính tinh — câu do engine giữ, không do model nhớ.
   * CHỈ cho Mệnh và Thân: câu nghĩa nền viết cho con người, gắn vào cung khác
   * thì thành "Tử Vi ở Tài Bạch khiến tiền bạc cần tự quyết" — đo được ở lượt 2.
   */
  /*
   * 01/10/2026: cung an Thân chỉ đọc như CON NGƯỜI khi câu hỏi gọi nó với tư cách cung Thân
   * (TQ01…). Thân cư Phu Thê mà câu hỏi về bạn đời thì sao ở đó vẫn tả người phối ngẫu — bản
   * trước cấp Nghĩa nền con người cho mọi cung an Thân, đúng lỗi "sao Phu Thê luận như Mệnh".
   */
  const laMenhThan = c.tenCung === 'Mệnh' || (c.laCungThan && docLaThan);
  const nen = (laMenhThan ? chinh : [])
    .map((s) => KHUON.vi.netSao[s.ten])
    .filter(Boolean)
    .map((n, i) => `${chinh[i].ten}: ${n.manhCau ?? n.manh}`)
    .join(' ');
  /*
   * NGHĨA SAO do engine giữ (KHUON.vi.netPhuTinh, netSao). Lượt 5, giám khảo
   * đếm 135 nhận định không căn cứ / 30 bài, gần hết là model tự gán nghĩa sao
   * từ trí nhớ ("Thiên Mã là di chuyển") — đúng sách, nhưng không có trong gói
   * được cấp, tức vi phạm luật AGENTS "không lấp học thuyết bằng trí nhớ".
   * Cấp luôn nghĩa đã biên tập thì phần "Vì sao" có chỗ dựa kiểm được.
   */
  // Ở cung xung chiếu, Mệnh/Thân cũng không cấp Nghĩa nền — nét chính tinh đọc như lực chiếu vào cung chính
  const netChung = (laMenhThan && cheDo === 'chinh' ? [] : chinh)
    .map((s) => (KHUON.vi.netSao[s.ten] ? `${s.ten}${dauHam(s)}: ${KHUON.vi.netSao[s.ten].manh}` : ''))
    .filter(Boolean);
  const nghiaPhu = (ds: typeof phu) =>
    ds.map((s) => (KHUON.vi.netPhuTinh[s.ten] ? `${s.ten}${dauSangPhu(s)}: ${KHUON.vi.netPhuTinh[s.ten]}` : '')).filter(Boolean);
  // Tam hợp: chỉ tứ hóa và sao nặng nhất (trọng số ≥ 1) có nghĩa — cung ấy là lực đỡ/kéo, không phải chủ thể
  const netPhu = nghiaPhu(cheDo === 'tam-hop' ? [...hoa, ...phu.filter((s) => (CAT[s.ten] ?? HUNG[s.ten] ?? 0) >= 1)] : [...hoa, ...phu]);
  const netNhe = cheDo === 'chinh' ? nghiaPhu(nhe) : [];
  const netTs = cheDo === 'chinh' && c.trangSinh && KHUON.vi.netTrangSinh[c.trangSinh] ? `${c.trangSinh}: ${KHUON.vi.netTrangSinh[c.trangSinh]}` : '';
  const nhan = nhanChuNgu(c, docLaThan);
  const tuanTriet = [
    c.coTriet ? `Triệt: chặn, làm gãy${coMoc ? ' — theo quan niệm phổ biến tác động mạnh ở tiền vận (khoảng trước 30 tuổi)' : ''}` : '',
    c.coTuan ? `Tuần: làm chậm, che bớt${coMoc ? ' — theo quan niệm phổ biến tác động mạnh ở hậu vận' : ''}` : '',
  ].filter(Boolean);
  /*
   * Lượt 3 TQ12 (01/10/2026): Thiên Di có Triệt + Địa Không hãm, model vẫn chỉ kể
   * Thiên Khôi "gặp người chỉ đường" — luật chung "có Triệt thì nói chỗ vướng" ở phạm
   * vi câu hỏi không đủ. Câu ngang hàng liệt kê đích danh chỗ vướng ngay trong dữ kiện.
   */
  const vuong = [
    ...chinh.filter((s) => s.doSang === 'H').map((s) => `${s.ten} hãm`),
    ...hoa.filter((s) => s.ten === 'Hóa Kỵ' && !['M', 'V', 'D'].includes(s.doSang ?? '')).map((s) => s.ten),
    // hung tinh đắc / miếu / vượng chỉ kéo nửa (như diemTungCung) — không bắt nói thành chỗ vướng
    ...phu.filter((s) => HUNG[s.ten] !== undefined && !['M', 'V', 'D'].includes(s.doSang ?? '')).map(tenSao),
    ...(c.coTriet ? ['Triệt'] : []),
    ...(c.coTuan ? ['Tuần'] : []),
  ];
  /*
   * GỌN (25/09/2026) → TAM PHƯƠNG CÓ NGHĨA (01/10/2026). Bản 25/09 bỏ hẳn nghĩa ở cung
   * xung chiếu / tam hợp vì Nghĩa nền tính cách của Mệnh (tam hợp của Tài Bạch) và nét
   * Hỏa Linh của Phúc Đức (xung chiếu) làm câu nào cũng kể lại tính cách. Cái giá: cung
   * đối diện — lực mạnh thứ hai theo sách — tới model chỉ còn tên sao, model hoặc bỏ qua
   * hoặc tự nhớ nghĩa. Giờ cấp lại nghĩa, nhưng gắn nhãn đọc là LỰC CHIẾU VÀO cung chính,
   * và vẫn không cấp Nghĩa nền con người ở đây.
   */
  const matGoc = cungGoc ? (LINH_VUC_CUNG[cungGoc.tenCung] ?? cungGoc.tenCung) : '';
  const nghiaChinh = [
    netChung.length && cheDo !== 'tam-hop' ? `chính tinh — ${netChung.join('; ')}` : '',
    netPhu.length ? `phụ tinh/tứ hóa — ${netPhu.join('; ')}` : '',
  ].filter(Boolean);
  const nghia =
    cheDo === 'chinh'
      ? [
          // Nhãn chủ ngữ nói MỘT lần cho cả cung — lặp ở từng nhóm sao là ba lần cùng một câu
          nhan && (netChung.length || netPhu.length || netNhe.length) ? `Đọc mọi nét dưới đây: ${nhan}.` : '',
          netChung.length ? `Nét chung của chính tinh — ${netChung.join('; ')}.` : '',
          netPhu.length ? `Nghĩa phụ tinh/tứ hóa — ${netPhu.join('; ')}.` : '',
          netNhe.length || netTs
            ? `Sao nhẹ (chỉ làm sắc thái: dùng khi cùng chiều với sao nặng ở trên hoặc chạm thẳng câu hỏi, không dựng ý riêng từ một sao nhẹ) — ${[...netNhe, ...(netTs ? [`vòng Tràng Sinh ${netTs}`] : [])].join('; ')}.`
            : '',
          tuanTriet.length ? `${tuanTriet.join('; ')}.` : '',
          ngangHang && vuong.length ? `BẮT BUỘC có một ý nói chỗ vướng của nhóm này (dù nhóm có sao tốt): ${vuong.join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join(' ')
      : [
          cheDo === 'xung'
            ? `Cung này CHIẾU THẲNG vào cung ${cungGoc?.tenCung} (${matGoc}) — tác động mạnh thứ hai sau cung chính: đọc các nét dưới là lực tác động lên ${matGoc}, KHÔNG tả tính cách bạn và không kể chuyện riêng của mặt đời ${LINH_VUC_CUNG[c.tenCung] ?? c.tenCung}.`
            : `Cung tam hợp của ${cungGoc?.tenCung} (${matGoc}) — chỉ nâng hoặc kéo nhẹ thêm cho cung chính, yếu hơn cung chính và cung xung chiếu; không dựng ý riêng từ cung này, không tả tính cách bạn.`,
          nghiaChinh.length ? `Nét để đọc lực ấy: ${nghiaChinh.join('. ')}.` : '',
          tuanTriet.length ? `${tuanTriet.join('; ')}.` : '',
        ]
          .filter(Boolean)
          .join(' ');
  const nenHien = nen && !gon;
  return {
    noiDung: `Cung ${c.tenCung} — mặt đời ${LINH_VUC_CUNG[c.tenCung] ?? c.tenCung} (${c.can} ${c.chi}${dv}): ${phan.join('; ')}.${nenHien ? ` Nghĩa nền (nói về CON NGƯỜI, không phải nghĩa của phần đời cung này) — ${nen}` : ''}${nghia ? ` ${nghia}` : ''}`,
    // Thứ tự có nghĩa: truy hồi lấy mấy sao đầu làm truy vấn, nên sao nặng ký phải đứng trước
    sao: [...new Set([...chinh.map((s) => s.ten), ...hoa.map((s) => s.ten), ...phu.map((s) => s.ten), ...nhe.map((s) => s.ten), ...c.sao.map((s) => s.ten), ...(cheDo === 'chinh' && c.trangSinh ? [c.trangSinh] : [])])],
  };
}

/**
 * Cách cục của một cung TAM PHƯƠNG đi vào chủ đề nào (25/09/2026). Cách cục nằm
 * ở Mệnh mà là tam hợp của Tài Bạch/Quan Lộc thì trước đây vào cả câu tiền bạc
 * lẫn câu nghề — bốn cách cục của Mệnh lá số A (Tử Phủ Vũ Tướng, Khôi Việt, Tả
 * Hữu, Khốc Hư) có mặt ở gần như mọi câu, và mọi câu kể lại "thấy thiếu", "có
 * người cùng gánh". Cách cục trên cung chính của câu thì luôn vào.
 */
const CACH_CUC_CHU_DE: [string, string[]][] = [
  ['Tử Phủ Vũ Tướng', ['su-nghiep', 'tien-bac']],
  ['Sát Phá Tham', ['su-nghiep', 'ra-ngoai']],
  ['Cơ Nguyệt Đồng Lương', ['su-nghiep']],
  ['Cự Nhật', ['su-nghiep', 'ra-ngoai']],
  ['Khôi Việt', ['su-nghiep', 'quy-nhan', 'hoc-van']],
  ['Xương Khúc', ['hoc-van', 'su-nghiep']],
  ['Tả Hữu', ['su-nghiep', 'quy-nhan']],
  ['Song Lộc', ['tien-bac']],
  ['Khốc Hư', ['phuc-duc']],
  ['Không Kiếp', ['tien-bac']],
  ['Đào Hồng', ['tinh-duyen']],
  ['Long Phượng', ['hoc-van']],
];
function cachCucHopChuDe(ten: string, chuDe: string): boolean {
  const dong = CACH_CUC_CHU_DE.find(([k]) => ten.startsWith(k));
  return dong ? dong[1].includes(chuDe) : false;
}

/* -------------------------------------------------------------------------- */
/* DỰNG GÓI DỮ KIỆN                                                            */
/* -------------------------------------------------------------------------- */

export function dungDuKien(laSo: LaSo, q: CauHoiV3, namXem: number, thangXem = 1): DuKienV3[] {
  const ra: DuKienV3[] = [];
  const them = (vaiTro: string, noiDung: string, sao: string[] = [], cung?: string) =>
    ra.push({ id: `F${String(ra.length + 1).padStart(3, '0')}`, vaiTro, noiDung, sao, cung });

  const cd = chuDeCua(q);
  const saoChuDe = new Set(
    nhanDangThucThe(`${cd?.saoToanCuc ?? ''} ${q.yeuToThem}`)
      .filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION')
      .map((t) => t.ten)
  );
  const ta = tuoiAm(laSo, namXem);
  const namDuong = namXem - laSo.thongTin.nam;

  them(
    'nền',
    `${laSo.thongTin.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}, năm xem ${namXem}: ${namDuong} tuổi (${ta} tuổi âm). ${laSo.cuc.ten}, bản mệnh ${laSo.banMenh.ten}, ${laSo.menhCucQuanHe}, ${laSo.amDuongThuanLy}. Thân cư ${laSo.thanCuCung}. Mệnh chủ ${laSo.menhChu}, Thân chủ ${laSo.thanChu}.`
  );

  // Danh sách cung phải đọc, kèm vai trò
  const daCo = new Set<string>();
  const cungVai: { c: Cung; vai: string }[] = [];
  const docThan = new Set<string>();
  const dua = (c: Cung | undefined, vai: string, laThan = false) => {
    if (!c || daCo.has(c.tenCung)) return;
    daCo.add(c.tenCung);
    if (laThan) docThan.add(c.tenCung);
    cungVai.push({ c, vai });
  };
  const chinhDs = q.cung.length ? q.cung : [cd?.cungChinh ?? 'Mệnh'];
  const goc = timCung(laSo, chinhDs[0], namXem);
  dua(goc, chinhDs[0] === 'DV' ? 'cung đại vận đang chạy (chính)' : chinhDs[0] === 'TH' ? `cung tiểu hạn năm ${namXem} (chính)` : 'cung chính', chinhDs[0] === 'THAN');
  if (goc && !q.ngangHang) {
    const { xungChieu, tamHop } = tamPhuongTuChinh(goc.chiIndex);
    dua(laSo.cungs[xungChieu], `xung chiếu của ${goc.tenCung}`);
    dua(laSo.cungs[tamHop[0]], `tam hợp của ${goc.tenCung}`);
    dua(laSo.cungs[tamHop[1]], `tam hợp của ${goc.tenCung}`);
  }
  for (const t of chinhDs.slice(1)) dua(timCung(laSo, t, namXem), 'cung chính (cùng xét)', t === 'THAN');
  // Tổng quan chỉ đọc đúng các cung khung đã chỉ — thêm phụ trợ của chủ đề là
  // biến một câu 60–110 từ thành bài đọc nửa lá số.
  for (const p of q.loai === 'chuyen-sau' ? (cd?.phuTro ?? []) : []) {
    for (const ten of p.cung.split('/').map((x) => x.trim())) {
      if (ten === 'Thân') dua(timCung(laSo, 'THAN', namXem), `phụ trợ — ${p.vaiTro}`, true);
      else if (LINH_VUC_CUNG[ten]) dua(timCung(laSo, ten, namXem), `phụ trợ — ${p.vaiTro}`);
    }
  }
  const cheDo = (vai: string): CheDoCung => (vai.startsWith('xung chiếu') ? 'xung' : vai.startsWith('tam hợp') ? 'tam-hop' : 'chinh');
  for (const { c, vai } of cungVai) {
    const m = moTaCung(laSo, c, saoChuDe, hoiThoiDiem(q), cheDo(vai), !!q.ngangHang, goc, docThan.has(c.tenCung));
    them(vai, m.noiDung, m.sao, c.tenCung);
  }
  // Giáp của cung chính (và các cung chính cùng xét của câu ngang hàng)
  for (const { c, vai } of cungVai.filter((x) => x.vai.startsWith('cung'))) {
    const g = giapCung(laSo, c);
    if (g) them(`giáp ${vai === 'cung chính (cùng xét)' ? 'cung cùng xét' : 'cung chính'}`, g.noiDung, g.sao, c.tenCung);
  }

  // Sao toàn cục của chủ đề: vị trí trên cả lá
  if (saoChuDe.size) {
    const viTri: string[] = [];
    for (const ten of saoChuDe) {
      const o = laSo.cungs.filter((c) => c.sao.some((s) => s.ten === ten)).map((c) => c.tenCung);
      if (o.length) viTri.push(`${ten} ở ${o.join(', ')}`);
    }
    if (viTri.length) them('sao cần quét trên cả lá', `Vị trí: ${viTri.join('; ')}.`, [...saoChuDe]);
  }
  if (cd?.phuTro.some((p) => p.cung.includes('Thái Dương'))) {
    const o = ['Thái Dương', 'Thái Âm'].map((ten) => {
      const c = laSo.cungs.find((x) => x.sao.some((s) => s.ten === ten));
      const s = c?.sao.find((x) => x.ten === ten);
      return c ? `${ten}${s?.doSang ? ` (${DO_SANG[s.doSang]})` : ''} ở ${c.tenCung}` : '';
    });
    them('cha (Thái Dương) / mẹ (Thái Âm)', `${o.filter(Boolean).join('; ')}.`, ['Thái Dương', 'Thái Âm']);
  }

  // Cách cục có dính tới các cung đang đọc
  const xetHan = q.van.some((v) => v === 'th' || v === 'th3' || v === 'dv');
  /*
   * Cách cục xét quanh CẢ cung chính của câu (01/10/2026). nhanDangCachCuc luôn đặt Mệnh trước và
   * bỏ trùng theo mã, nên "Tả Hữu" của tam phương Phu Thê bị bản của Mệnh nuốt mất. Engine chỉ đọc
   * menhIndex để chọn cung gốc (cach-cuc.ts:442), nên xoay gốc về cung chính là đủ — không sửa engine.
   */
  const dsCachCuc = [...nhanDangCachCuc(laSo), ...(goc && goc.chiIndex !== laSo.menhIndex ? nhanDangCachCuc({ ...laSo, menhIndex: goc.chiIndex }) : [])];
  const daCoCc = new Set<string>();
  for (const cc of dsCachCuc) {
    if (daCoCc.has(`${cc.ma}|${cc.cung}`)) continue;
    daCoCc.add(`${cc.ma}|${cc.cung}`);
    if (cc.loai === 'han' && !xetHan) continue;
    // Cách cục chỉ vào khi nó nằm trên một cung đang đọc — cách cục của Mệnh không
    // phải căn cứ cho câu về năm nay hay chuyện nhà cửa.
    if (!daCo.has(cc.cung)) continue;
    const vaiCung = cungVai.find((x) => x.c.tenCung === cc.cung)?.vai ?? '';
    // Chuyên sâu: cách cục chỉ vào khi nằm trên cung chính CỦA CHỦ ĐỀ (không phải cung đầu danh sách câu —
    // TD01 "yêu kiểu nào" đọc Mệnh trước, và bốn cách cục của Mệnh theo vào chủ đề tình duyên), hoặc khi liên quan
    if (q.loai === 'chuyen-sau' && cc.cung !== cd?.cungChinh && !cachCucHopChuDe(cc.ten, q.chuDe)) continue;
    void vaiCung;
    // Cung Thân được hỏi như con người thì cách cục ở đó vẫn là tính cách; cách cục của Mệnh khi Mệnh không phải
    // cung chính chỉ là lực chiếu vào câu đang hỏi
    const laThanDoc = laSo.cungs.some((x) => x.tenCung === cc.cung && x.laCungThan && docThan.has(x.tenCung));
    const docTheo =
      cc.cung === 'Mệnh' || laThanDoc
        ? goc && goc.tenCung !== cc.cung
          ? ` Cách cục này ở ${cc.cung}, không ở cung chính — chỉ là lực chiếu vào ${LINH_VUC_CUNG[goc.tenCung] ?? goc.tenCung}, không phải nhận định chính của câu.`
          : ''
        : LINH_VUC_CUNG[cc.cung]
          ? ` Câu trên viết cho người đọc; ở đây chỉ giữ tính chất chung (thuận hay vướng, có người đỡ hay không) và áp vào ${LINH_VUC_CUNG[cc.cung]} của cung ${cc.cung}, không thành tính cách bạn, không thêm chi tiết dữ kiện không có.`
          : '';
    them('cách cục', `Cách cục ${cc.ten} (tại ${cc.cung}). ${cc.dieuKien}${docTheo}`, [...cc.sao], cc.cung);
  }

  // Duyên sớm / muộn / mỏng — engine gộp luật sách (trang-thai-duyen.ts), để mọi lượt cùng một kết luận
  if (q.chuDe === 'tinh-duyen' || q.id === 'TQ07') {
    const d = dongTrangThaiDuyen(laSo);
    if (d) them('trạng thái duyên (engine tổng hợp theo luật sách)', d.noiDung, d.sao, 'Phu Thê');
  }

  // Lớp vận
  if (q.van.includes('dv')) {
    const dv = cungDaiVan(laSo, ta);
    if (dv?.daiVan) {
      const { xungChieu, tamHop } = tamPhuongTuChinh(dv.chiIndex);
      // 01/10/2026: kèm phụ tinh nặng — trước đây tam phương cung vận chỉ có chính tinh và tứ hóa
      const tomCung = (c: Cung) => {
        const nang = c.sao.filter((s) => (s.loai === 'phu-tinh' || s.loai === 'vong-sao') && laSaoNang(s, saoChuDe)).map(tenSao);
        return `${c.sao.filter((s) => s.loai === 'chinh-tinh').map(tenSao).join(', ') || 'không có chính tinh'}${c.sao.some((s) => s.loai === 'tu-hoa') ? ` (${c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => s.ten).join(', ')})` : ''}${nang.length ? `; phụ tinh ${nang.join(', ')}` : ''}${c.coTuan ? '; Tuần' : ''}${c.coTriet ? '; Triệt' : ''}`;
      };
      const tp = [xungChieu, ...tamHop]
        .map((i) => laSo.cungs[i])
        .map((c) => `${c.tenCung}: ${tomCung(c)}`)
        .join('; ');
      them(
        'đại vận đang chạy',
        `Đại vận ${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi} tuổi (âm) chạy qua cung ${dv.tenCung} (${tomCung(dv)}). Tam phương của cung vận — ${tp}.`,
        [...dv.sao.map((s) => s.ten), ...[xungChieu, ...tamHop].flatMap((i) => laSo.cungs[i].sao.map((s) => s.ten))],
        dv.tenCung
      );
    }
  }
  if (q.van.includes('chuoi') || q.van.includes('diem')) {
    const diem = new Map(diemTungCung(laSo).map((d) => [d.cung, d]));
    const chuoi = [...laSo.cungs]
      .filter((c) => c.daiVan && c.daiVan.tuTuoi <= 85)
      .sort((a, b) => a.daiVan!.tuTuoi - b.daiVan!.tuTuoi)
      .map((c) => {
        const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh').map(tenSao).join(', ') || 'không có chính tinh';
        const hoa = c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => s.ten);
        const dang = ta >= c.daiVan!.tuTuoi && ta <= c.daiVan!.denTuoi ? ' ← ĐANG CHẠY' : '';
        return `${c.daiVan!.tuTuoi}–${c.daiVan!.denTuoi}: cung ${c.tenCung} (${chinh}${hoa.length ? '; ' + hoa.join(', ') : ''}${c.coTuan ? '; Tuần' : ''}${c.coTriet ? '; Triệt' : ''}) — mặt đời ${LINH_VUC_CUNG[c.tenCung]}, nền cung: ${TEN_MUC[diem.get(c.tenCung)?.muc ?? 'Bình']}${dang}`;
      });
    if (q.van.includes('chuoi')) them('chuỗi đại vận (tuổi âm)', chuoi.join('\n'), laSo.cungs.flatMap((c) => c.sao.filter((s) => s.loai !== 'vong-sao').map((s) => s.ten)));
  }
  const phuNangCua = (c: Cung) => {
    const nang = c.sao.filter((s) => (s.loai === 'phu-tinh' || s.loai === 'vong-sao') && laSaoNang(s, saoChuDe)).map(tenSao);
    return `${nang.length ? `; phụ tinh ${nang.join(', ')}` : ''}${c.coTuan ? '; Tuần' : ''}${c.coTriet ? '; Triệt' : ''}`;
  };
  const moTaNam = (nam: number) => {
    const c = laSo.cungs[cungTieuHan(laSo, tuoiAm(laSo, nam))];
    const can = mod(nam + 6, 10);
    const [loc, quyen, khoa, ky] = TU_HOA[can];
    const oDau = (ten: string) => laSo.cungs.find((x) => x.sao.some((s) => s.ten === ten))?.tenCung ?? '?';
    const nghiaHoa = (hoaTen: string, sao: string) => {
      const cung = oDau(sao);
      return `${hoaTen} vào ${sao} (${cung}) — ở mặt đời ${LINH_VUC_CUNG[cung] ?? cung}: ${KHUON.vi.netPhuTinh[hoaTen] ?? ''}`;
    };
    const luu = luuTinhTheoNam(nam)
      .map((s) => `${s.ten} ở ${laSo.cungs[s.chiIndex].tenCung}`)
      .join('; ');
    return {
      c,
      noiDung:
        `Năm ${nam} (${CAN[can]} ${CHI[mod(nam + 8, 12)]}, ${tuoiAm(laSo, nam)} tuổi âm): tiểu hạn tại cung ${c.tenCung} ` +
        `(${c.sao.filter((s) => s.loai === 'chinh-tinh').map(tenSao).join(', ') || 'không có chính tinh'}${c.sao.some((s) => s.loai === 'tu-hoa') ? '; ' + c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => s.ten).join(', ') : ''}${phuNangCua(c)}). ` +
        `Lưu tứ hóa theo can năm: ${[nghiaHoa('Hóa Lộc', loc), nghiaHoa('Hóa Quyền', quyen), nghiaHoa('Hóa Khoa', khoa), nghiaHoa('Hóa Kỵ', ky)].join('; ')}. ` +
        `Lưu tinh: ${luu}. Nghĩa: Thái Tuế — ${KHUON.vi.netPhuTinh['Thái Tuế'] ?? ''}.`,
      sao: [...c.sao.map((s) => s.ten), loc, quyen, khoa, ky, 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ', 'Thái Tuế', 'Lộc Tồn', 'Kình Dương', 'Đà La', 'Thiên Mã', 'Thiên Khốc', 'Thiên Hư'],
    };
  };
  if (q.van.includes('th')) {
    const n = moTaNam(namXem);
    them(`vận năm ${namXem}`, n.noiDung, n.sao, n.c.tenCung);
  }
  if (q.van.includes('th3')) {
    for (const nam of [namXem, namXem + 1, namXem + 2]) {
      if (nam === namXem && q.van.includes('th')) continue;
      const n = moTaNam(nam);
      them(`vận năm ${nam}`, n.noiDung, n.sao, n.c.tenCung);
    }
  }
  if (q.van.includes('nguyet')) {
    const thang = Array.from({ length: 12 }, (_, i) => `tháng ${i + 1}: ${laSo.cungs[cungNguyetHan(laSo, ta, i + 1)].tenCung}`);
    them(`nguyệt hạn năm ${namXem} (tháng âm)`, thang.join('; ') + '.');
    void thangXem;
  }
  if (q.van.includes('diem')) {
    const ds = diemTungCung(laSo);
    them(
      'điểm mạnh – yếu 12 mặt đời (engine chấm theo luật)',
      (['Mạnh', 'Bình', 'Cần gắng'] as const)
        .map((m) => `${TEN_MUC[m]}: ${ds.filter((d) => d.muc === m).sort((a, b) => b.diem - a.diem).map((d) => `${d.linhVuc} (cung ${d.cung})`).join(', ')}`)
        .join('. ') + '.'
    );
    /*
     * VÌ SAO của hai đầu thang (25/09/2026). Giám khảo chấm TQ04 thấp nhất cả nhóm
     * ("chia nhóm rõ nhưng lý giải sơ lược, chưa cho thấy vì sao") — dữ kiện chỉ
     * có tên nhóm. Cấp đúng những sao engine đã dùng để chấm, cùng nguồn với Bản
     * đồ mạnh – yếu trên trang, để bài luận và bản đồ nói cùng một lý do.
     */
    if (q.id === 'TQ04') {
      const ct = chiTietDiemTungCung(laSo).sort((a, b) => b.diem - a.diem);
      const lyDo = (d: ChiTietDiemCung) => {
        const don = d.trongCung.filter((g) => g.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 3).map((g) => g.ten);
        const keo = d.trongCung.filter((g) => g.diem < 0).sort((a, b) => a.diem - b.diem).slice(0, 2).map((g) => g.ten);
        return `${d.linhVuc} (cung ${d.cung}): ${don.length ? `đỡ bởi ${don.join(', ')}` : 'ít sao đỡ'}${keo.length ? `; kéo bởi ${keo.join(', ')}` : ''}`;
      };
      const dau = [...ct.slice(0, 2), ...ct.slice(-2)];
      them(
        'vì sao mạnh / vì sao cần chăm chút (sao engine dùng để chấm)',
        `${dau.map(lyDo).join('. ')}.`,
        [...new Set(dau.flatMap((d) => d.trongCung.map((g) => g.sao).filter((x): x is string => Boolean(x))))]
      );
    }
  }
  return ra;
}

/** Tập sao được phép nêu ở phần "Vì sao": chỉ những sao có trong gói dữ kiện của câu này */
export function saoDuocPhep(dk: DuKienV3[]): Set<string> {
  return new Set(dk.flatMap((d) => d.sao));
}

/** Cung đang đọc, theo thứ tự ưu tiên — để dựng truy vấn RAG */
export function cungDangDoc(dk: DuKienV3[]): { cung: string; vaiTro: string; sao: string[] }[] {
  return dk.filter((d) => d.cung && d.noiDung.startsWith('Cung ')).map((d) => ({ cung: d.cung!, vaiTro: d.vaiTro, sao: d.sao }));
}
