import type { Cung, LaSo } from '@/lib/tuvi/ansao';

/**
 * TRẠNG THÁI DUYÊN — duyên đến sớm, muộn, mỏng hay chưa rõ (30/09/2026).
 *
 * Vì sao cần: TD02 và TQ07 hỏi "sớm hay muộn", nhưng dữ kiện chỉ tả sao ở Phu Thê;
 * model tự cân và mỗi lượt một kết luận, có lượt nói "duyên đến sớm" cho lá có Thất
 * Sát + Kình Dương ở Phu Thê. Luật dưới đây KHÔNG phải kiến thức của Claude: mỗi dòng
 * lấy từ một đoạn sách đã có trong kho (rà 30/09/2026, bảng nguon_tri_thuc), ghi ở
 * cột `theo`. Không thêm luật nào không có đoạn sách đi kèm.
 *
 * Chỉ xét sao TỌA THỦ tại Phu Thê (và Tuần/Triệt tại đó). Sách viết "thủ chiếu" cho
 * nhóm sát tinh, nhưng tính cả xung chiếu thì gần như lá nào cũng đủ bốn sao "muộn"
 * — mọi người đều thành duyên mỏng. Giữ chặt tay, chờ chuyên gia nới.
 *
 * Kho chưa có đoạn nào về duyên đồng giới, nên engine không suy ra điều đó; bài luận
 * giữ trung tính giới (prompt-v3 luật 15).
 */

export type TrangThaiDuyen = 'som' | 'muon' | 'mong' | 'chua-ro' | 'binh-thuong';

interface Luat {
  huong: 'som' | 'muon';
  khop: (c: Cung) => boolean;
  moTa: string;
  theo: string;
}

const co = (c: Cung, ...ten: string[]) => ten.every((t) => c.sao.some((s) => s.ten === t));
const oChi = (c: Cung, ...chi: number[]) => chi.includes(c.chiIndex);
const TY = 0, SUU = 1, DAN = 2, THIN = 4, NGO = 6, MUI = 7, TUAT = 10;
const MO = [THIN, TUAT, SUU, MUI];

const LUAT: Luat[] = [
  // — Muộn —
  { huong: 'muon', khop: (c) => co(c, 'Lộc Tồn'), moTa: 'Lộc Tồn ở Phu Thê', theo: '"Ở cung Phu Thê thì muộn vợ, muộn chồng"; "Lộc Tồn muộn vợ nhưng hay"' },
  { huong: 'muon', khop: (c) => co(c, 'Thất Sát'), moTa: 'Thất Sát ở Phu Thê', theo: '"Cả trai lẫn gái đều không thể sớm lập gia đình… hôn nhân trễ muộn"' },
  ...['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh'].map(
    (t): Luat => ({ huong: 'muon', khop: (c) => co(c, t), moTa: `${t} ở Phu Thê`, theo: '"gặp Dương Đà, Linh Hỏa phải lấy muộn mới tốt"' })
  ),
  ...['Quả Tú', 'Cô Thần', 'Địa Không', 'Địa Kiếp', 'Tang Môn', 'Bạch Hổ', 'Thiên Khốc', 'Thiên Hư'].map(
    (t): Luat => ({ huong: 'muon', khop: (c) => co(c, t), moTa: `${t} ở Phu Thê`, theo: '"Muộn vợ muộn chồng: cung Phu Thê thủ chiếu các sao Quả Tú, Cô Thần, Không Kiếp, Tang Hổ, Kình Đà, Linh Hỏa, Khốc Hư hay bị Tuần Triệt"' })
  ),
  { huong: 'muon', khop: (c) => c.coTuan, moTa: 'Phu Thê bị Tuần', theo: '"… hay bị Tuần Triệt" (cùng đoạn muộn vợ muộn chồng)' },
  { huong: 'muon', khop: (c) => c.coTriet, moTa: 'Phu Thê bị Triệt', theo: '"… hay bị Tuần Triệt" (cùng đoạn muộn vợ muộn chồng)' },
  { huong: 'muon', khop: (c) => co(c, 'Thiên Đồng', 'Cự Môn') && oChi(c, ...MO), moTa: 'Đồng Cự ở Phu Thê tại Mộ cung', theo: 'Đồng Cự ở Mộ cung: muộn vợ' },
  // "Sớm thì dễ trắc trở" — sách khuyên muộn, tính về phía muộn
  { huong: 'muon', khop: (c) => co(c, 'Tham Lang') && oChi(c, THIN, TUAT), moTa: 'Tham Lang ở Phu Thê tại Thìn/Tuất', theo: 'Tham Lang Thìn Tuất: lấy sớm dễ trắc trở' },
  { huong: 'muon', khop: (c) => co(c, 'Thiên Tướng') && oChi(c, MUI), moTa: 'Thiên Tướng ở Phu Thê tại Mùi', theo: 'Thiên Tướng ở Mùi: lấy sớm dễ trắc trở' },
  { huong: 'muon', khop: (c) => co(c, 'Vũ Khúc', 'Phá Quân'), moTa: 'Vũ Khúc – Phá Quân ở Phu Thê', theo: 'Vũ Phá: lấy sớm dễ trắc trở' },
  { huong: 'muon', khop: (c) => co(c, 'Thiên Cơ', 'Thái Âm') && oChi(c, DAN), moTa: 'Thiên Cơ – Thái Âm ở Phu Thê tại Dần', theo: 'Cơ Nguyệt ở Dần: lấy sớm dễ trắc trở' },
  // — Sớm —
  { huong: 'som', khop: (c) => co(c, 'Thiên Cơ') && oChi(c, TY, NGO, MUI), moTa: 'Thiên Cơ ở Phu Thê tại Tý/Ngọ/Mùi', theo: 'Thiên Cơ ở Tý, Ngọ, Mùi: sớm lập gia đình' },
  { huong: 'som', khop: (c) => co(c, 'Thiên Lương') && oChi(c, TY, NGO), moTa: 'Thiên Lương ở Phu Thê tại Tý/Ngọ', theo: 'Thiên Lương ở Tý Ngọ: sớm lập gia đình' },
  { huong: 'som', khop: (c) => co(c, 'Thiên Đồng', 'Thiên Lương'), moTa: 'Thiên Đồng – Thiên Lương đồng cung ở Phu Thê', theo: 'Đồng Lương đồng cung: sớm lập gia đình' },
  { huong: 'som', khop: (c) => co(c, 'Thiên Đồng', 'Thái Âm') && oChi(c, TY), moTa: 'Thiên Đồng – Thái Âm ở Phu Thê tại Tý', theo: 'Đồng Nguyệt ở Tý: sớm lập gia đình' },
  { huong: 'som', khop: (c) => co(c, 'Tham Lang') && !oChi(c, THIN, TUAT), moTa: 'Tham Lang ở Phu Thê', theo: 'Tham Lang ở Phu Thê: sớm lấy' },
  { huong: 'som', khop: (c) => co(c, 'Thiên Tướng') && !oChi(c, MUI), moTa: 'Thiên Tướng ở Phu Thê', theo: '"Tướng, Lương sớm nổi thành gia"' },
];

const NGUONG_MONG = 4;

export interface KetQuaDuyen {
  trangThai: TrangThaiDuyen;
  som: string[];
  muon: string[];
  sao: string[];
}

export function trangThaiDuyen(laSo: LaSo): KetQuaDuyen | null {
  const pt = laSo.cungs.find((c) => c.tenCung === 'Phu Thê');
  if (!pt) return null;
  const trung = LUAT.filter((l) => l.khop(pt));
  const som = trung.filter((l) => l.huong === 'som').map((l) => l.moTa);
  const muon = trung.filter((l) => l.huong === 'muon').map((l) => l.moTa);
  const trangThai: TrangThaiDuyen =
    !som.length && !muon.length ? 'binh-thuong'
    : som.length && muon.length ? 'chua-ro'
    : som.length ? 'som'
    : muon.length >= NGUONG_MONG ? 'mong'
    : 'muon';
  const sao = pt.sao.map((s) => s.ten).filter((t) => trung.some((l) => l.moTa.includes(t)));
  return { trangThai, som, muon, sao };
}

const LOI: Record<TrangThaiDuyen, string> = {
  som: 'NGHIÊNG SỚM — duyên dễ đến sớm.',
  muon: 'NGHIÊNG MUỘN — duyên đến muộn, hoặc gắn bó muộn thì bền hơn.',
  mong: 'MUỘN VÀ MỎNG — nhiều dấu hiệu muộn dồn vào cùng một chỗ: duyên đến chậm, dễ lỡ nhịp, cần thời gian mới thành.',
  'chua-ro': 'CHƯA RÕ — có cả dấu hiệu sớm lẫn muộn; nói cả hai khả năng ở mức ôn hòa, không chọn một bên.',
  'binh-thuong': 'BÌNH THƯỜNG — không có dấu hiệu sớm hay muộn nổi bật; không dựng chuyện sớm/muộn.',
};

/** Một dòng dữ kiện cho dungDuKien — null khi không có cung Phu Thê */
export function dongTrangThaiDuyen(laSo: LaSo): { noiDung: string; sao: string[] } | null {
  const kq = trangThaiDuyen(laSo);
  if (!kq) return null;
  const lyDo = [
    kq.muon.length ? `dấu hiệu muộn: ${kq.muon.join('; ')}` : '',
    kq.som.length ? `dấu hiệu sớm: ${kq.som.join('; ')}` : '',
  ].filter(Boolean).join('. ');
  return {
    noiDung: `${LOI[kq.trangThai]}${lyDo ? ` Căn cứ (luật sách về tuổi lập gia đình): ${lyDo}.` : ''} Trả lời "sớm hay muộn" PHẢI theo trạng thái này.`,
    sao: kq.sao,
  };
}
