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
import { TU_HOA } from '@/lib/tuvi/constants';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { nhanDangThucThe } from '../thuc-the';
import { CHU_DE_V3, type CauHoiV3, type ChuDeV3 } from './khung';

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

export const PHIEN_BAN_DU_KIEN_V3 = '2026.09.6';

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
  return (
    q.van.length > 0 ||
    /khi nào|giai đoạn|sớm hay muộn|năm nào|năm nay|tuổi|đỉnh|lộ trình|mốc|về già|tuổi già/i.test(`${q.cauHoi} ${q.nhanDuoc}`)
  );
}

function moTaCung(laSo: LaSo, c: Cung, saoChuDe: Set<string>, coMoc = true): { noiDung: string; sao: string[] } {
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  const hoa = c.sao.filter((s) => s.loai === 'tu-hoa');
  const phu = c.sao.filter(
    (s) =>
      (s.loai === 'phu-tinh' || s.loai === 'vong-sao') &&
      (CAT[s.ten] !== undefined || HUNG[s.ten] !== undefined || saoChuDe.has(s.ten))
  );
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
  if (c.coTuan) phan.push('gặp Tuần');
  if (c.coTriet) phan.push('gặp Triệt');
  if (c.laCungThan && c.tenCung !== 'Mệnh') phan.push('là cung an Thân');
  const dv = coMoc && c.daiVan ? `, đại vận ${c.daiVan.tuTuoi}–${c.daiVan.denTuoi} tuổi` : '';
  /*
   * Nghĩa nền của chính tinh — câu do engine giữ, không do model nhớ.
   * CHỈ cho Mệnh và Thân: câu nghĩa nền viết cho con người, gắn vào cung khác
   * thì thành "Tử Vi ở Tài Bạch khiến tiền bạc cần tự quyết" — đo được ở lượt 2.
   */
  const nen = (c.tenCung === 'Mệnh' || c.laCungThan ? chinh : [])
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
  const laMenhThan = c.tenCung === 'Mệnh' || c.laCungThan;
  const netChung = (laMenhThan ? [] : chinh)
    .map((s) => (KHUON.vi.netSao[s.ten] ? `${s.ten}: ${KHUON.vi.netSao[s.ten].manh}` : ''))
    .filter(Boolean);
  const netPhu = [...hoa, ...phu]
    .map((s) => (KHUON.vi.netPhuTinh[s.ten] ? `${s.ten}: ${KHUON.vi.netPhuTinh[s.ten]}` : ''))
    .filter(Boolean);
  const tuanTriet = [
    c.coTriet ? `Triệt: chặn, làm gãy${coMoc ? ' — theo quan niệm phổ biến tác động mạnh ở tiền vận (khoảng trước 30 tuổi)' : ''}` : '',
    c.coTuan ? `Tuần: làm chậm, che bớt${coMoc ? ' — theo quan niệm phổ biến tác động mạnh ở hậu vận' : ''}` : '',
  ].filter(Boolean);
  const nghia = [
    netChung.length ? `Nét chung của chính tinh (diễn giải theo phần đời của cung này) — ${netChung.join('; ')}.` : '',
    netPhu.length ? `Nghĩa phụ tinh/tứ hóa — ${netPhu.join('; ')}.` : '',
    tuanTriet.length ? `${tuanTriet.join('; ')}.` : '',
  ].filter(Boolean).join(' ');
  return {
    noiDung: `Cung ${c.tenCung} — mặt đời ${LINH_VUC_CUNG[c.tenCung] ?? c.tenCung} (${c.can} ${c.chi}${dv}): ${phan.join('; ')}.${nen ? ` Nghĩa nền (nói về CON NGƯỜI, không phải nghĩa của phần đời cung này) — ${nen}` : ''}${nghia ? ` ${nghia}` : ''}`,
    // Thứ tự có nghĩa: truy hồi lấy mấy sao đầu làm truy vấn, nên sao nặng ký phải đứng trước
    sao: [...new Set([...chinh, ...hoa, ...phu, ...c.sao].map((s) => s.ten))],
  };
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
  const dua = (c: Cung | undefined, vai: string) => {
    if (!c || daCo.has(c.tenCung)) return;
    daCo.add(c.tenCung);
    cungVai.push({ c, vai });
  };
  const chinhDs = q.cung.length ? q.cung : [cd?.cungChinh ?? 'Mệnh'];
  const goc = timCung(laSo, chinhDs[0], namXem);
  dua(goc, chinhDs[0] === 'DV' ? 'cung đại vận đang chạy (chính)' : chinhDs[0] === 'TH' ? `cung tiểu hạn năm ${namXem} (chính)` : 'cung chính');
  if (goc) {
    const { xungChieu, tamHop } = tamPhuongTuChinh(goc.chiIndex);
    dua(laSo.cungs[xungChieu], `xung chiếu của ${goc.tenCung}`);
    dua(laSo.cungs[tamHop[0]], `tam hợp của ${goc.tenCung}`);
    dua(laSo.cungs[tamHop[1]], `tam hợp của ${goc.tenCung}`);
  }
  for (const t of chinhDs.slice(1)) dua(timCung(laSo, t, namXem), 'cung chính (cùng xét)');
  // Tổng quan chỉ đọc đúng các cung khung đã chỉ — thêm phụ trợ của chủ đề là
  // biến một câu 60–110 từ thành bài đọc nửa lá số.
  for (const p of q.loai === 'chuyen-sau' ? (cd?.phuTro ?? []) : []) {
    for (const ten of p.cung.split('/').map((x) => x.trim())) {
      if (ten === 'Thân') dua(timCung(laSo, 'THAN', namXem), `phụ trợ — ${p.vaiTro}`);
      else if (LINH_VUC_CUNG[ten]) dua(timCung(laSo, ten, namXem), `phụ trợ — ${p.vaiTro}`);
    }
  }
  for (const { c, vai } of cungVai) {
    const m = moTaCung(laSo, c, saoChuDe, hoiThoiDiem(q));
    them(vai, m.noiDung, m.sao, c.tenCung);
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
  for (const cc of nhanDangCachCuc(laSo)) {
    if (cc.loai === 'han' && !xetHan) continue;
    // Cách cục chỉ vào khi nó nằm trên một cung đang đọc — cách cục của Mệnh không
    // phải căn cứ cho câu về năm nay hay chuyện nhà cửa.
    if (!daCo.has(cc.cung)) continue;
    them('cách cục', `Cách cục ${cc.ten} (tại ${cc.cung}). ${cc.dieuKien}`, [...cc.sao], cc.cung);
  }

  // Lớp vận
  if (q.van.includes('dv')) {
    const dv = cungDaiVan(laSo, ta);
    if (dv?.daiVan) {
      const { xungChieu, tamHop } = tamPhuongTuChinh(dv.chiIndex);
      const tp = [xungChieu, ...tamHop]
        .map((i) => laSo.cungs[i])
        .map((c) => `${c.tenCung}: ${c.sao.filter((s) => s.loai === 'chinh-tinh').map(tenSao).join(', ') || 'không có chính tinh'}${c.sao.some((s) => s.loai === 'tu-hoa') ? ` (${c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => s.ten).join(', ')})` : ''}`)
        .join('; ');
      them(
        'đại vận đang chạy',
        `Đại vận ${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi} tuổi (âm) chạy qua cung ${dv.tenCung}. Tam phương của cung vận — ${tp}.`,
        [...dv.sao.map((s) => s.ten), ...[xungChieu, ...tamHop].flatMap((i) => laSo.cungs[i].sao.filter((s) => s.loai !== 'vong-sao').map((s) => s.ten))],
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
        `(${c.sao.filter((s) => s.loai === 'chinh-tinh').map(tenSao).join(', ') || 'không có chính tinh'}${c.sao.some((s) => s.loai === 'tu-hoa') ? '; ' + c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => s.ten).join(', ') : ''}). ` +
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
