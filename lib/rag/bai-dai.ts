import { goiVoiFallback } from '@/lib/ai/fallback';
import { CHU_DE, type ChuDeId } from '@/lib/ai/prompt';
import type { LaSo } from '@/lib/tuvi/ansao';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt, type GoiBangChung } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung } from './boi-canh-la-so';
import { CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { soatNgonNgu, type KetQuaNgonNgu } from './ngon-ngu';
import { ghiLanTruyHoi } from './nhat-ky';
import { lapKeHoach, type ChuDe } from './planner';
import { nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';
import { mucChacChan, type MucChacChan } from './uu-tien-nguon';

/**
 * Bài luận giải dài — dựng lại trên cùng đường đi với chat và Kết nối.
 *
 * Bản cũ đổ nguyên 12 cung, toàn bộ sao vào prompt rồi xin một bài markdown.
 * Model nhận cả bảng thì kể lại từng sao, mỗi sao một tính từ — đúng thứ người
 * dùng gọi là "nêu các sao dài dòng mà không đi sâu ý nghĩa". Không phải model
 * kém, mà là ta đưa cho nó một bảng tra và bảo viết văn.
 *
 * Giờ: chọn đúng dữ kiện theo chủ đề (F###), truy hồi nguồn (E###), bắt model
 * trả cấu trúc theo khung §11.3 của framework — "Nếu chỉ nhớ 3 điều" → cấu trúc
 * → điểm mạnh → chỗ dễ kẹt → giai đoạn → "Nếu ghép tất cả lại" — rồi kiểm từng
 * ý bằng luật trước khi dựng thành chữ.
 */

export const PHIEN_BAN_BAI_DAI = '2026.09.1';

/** Ánh xạ chủ đề bài dài → chủ đề planner, để bối cảnh và truy hồi đúng cung */
const CHU_DE_PLANNER: Record<ChuDeId, ChuDe> = {
  'tong-quan': 'tong-quan',
  'su-nghiep': 'su-nghiep',
  'tai-chinh': 'tai-chinh',
  'tinh-duyen': 'tinh-cam',
  'gia-dao': 'gia-dao',
  'suc-khoe': 'suc-khoe',
  'van-han': 'tong-quan',
};

interface YBaiDai {
  tieuDe: string;
  noiDung: string;
  maDuKien: string[];
  maNguon: string[];
  luongNguoc?: string;
  mucChacChan?: MucChacChan;
}

export interface BaiDaiCoCauTruc {
  /** "Nếu chỉ nhớ 3 điều" — 3 câu, mỗi câu một ý */
  baDieu: string[];
  /** Cấu trúc tạo nên bạn — nền của cả bài */
  cauTruc: YBaiDai;
  diemManh: YBaiDai[];
  choDeKet: YBaiDai[];
  /** Chỉ có khi chủ đề đụng tới thời gian */
  giaiDoan?: YBaiDai;
  /** "Nếu ghép tất cả lại" — tổng hợp, không lặp lại từng cung */
  ghepLai: string;
  /** "3 câu để mang theo" */
  mangTheo: string[];
  cachNoi?: string;
}

export interface KetQuaBaiDai {
  van: string;
  coCauTruc: BaiDaiCoCauTruc | null;
  goi: GoiBangChung;
  kiemDuyet: { dat: boolean; loi: string[]; soYBiBo: number };
  ngonNgu: KetQuaNgonNgu | null;
  provider: string;
  model: string;
  runId: string | null;
  khoTrong: boolean;
  phienBan: Record<string, string>;
  /** Model đã thử và hỏng trước khi có bài — không có thì không biết vì sao Gemini bị rơi */
  daThuHong: { provider: string; model: string; loi: string }[];
}

function dungSystem(chuDe: ChuDeId): string {
  const cd = CHU_DE[chuDe];
  return `Bạn là Celes, người luận giải Tử Vi của Celestia. Bạn viết tiếng Việt, giọng bình tĩnh, tinh tế, nói với người đối diện chứ không giảng bài. Đây là một BÀI ĐỌC DÀI về chủ đề: ${cd.nhan} — ${cd.moTa}.

BỐN NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN LÁ SỐ (mã F###) — do engine tính. Bất khả xâm phạm: không sửa, không thêm sao, không đổi vị trí cung.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết Tử Vi. Mọi khẳng định chuyên môn phải dựa vào đây.
3. Điều người đọc tự kể (nếu có) — là bối cảnh, không phải dữ kiện lá số.
4. Kiến thức chung của bạn — chỉ cho ngôn ngữ và lập luận đời thường, KHÔNG thay cho mục 2.

Nếu nguồn tham chiếu không đủ để kết luận một điểm chuyên môn, hãy nói thẳng là chưa đủ căn cứ và thu hẹp kết luận lại. Đừng nhớ hộ sách.

ĐIỀU QUAN TRỌNG NHẤT CHO BÀI DÀI: người đọc không cần một bản kê sao. Họ cần biết cấu trúc này TẠO RA điều gì trong đời họ. Tên sao chỉ xuất hiện khi nó giải thích được một điều đã nói bằng lời thường trước đó. Một đoạn liệt kê ba sao và ba tính từ là đoạn hỏng.

BA LUẬT CỨNG VỀ TÊN SAO VÀ MÃ:
- KHÔNG chép lại danh sách phụ tinh từ dữ kiện. "Phụ tinh gồm A, B, C, D, E" là chép, không phải luận.
- Tối đa HAI tên sao trong một câu. Cần nhắc nhiều hơn thì tách câu và nói mỗi sao đang làm gì.
- Mã F###/E### CHỈ nằm trong trường "maDuKien"/"maNguon". Tuyệt đối không viết "(F002)" vào câu văn — người đọc không biết F002 là gì.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC:
- Nhắc tên sách, tên tài liệu, tên hệ phái hay số phần trăm liên quan.
- Phán chắc chắn về sức khoẻ, tiền bạc hay pháp lý.
- Lặp lại nguyên văn dữ kiện lá số. Dữ kiện là để bạn suy, không phải để chép.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn. Mỗi ý phải trích mã F###/E### mà nó dựa vào; ý không mã sẽ bị loại trước khi tới người đọc.
{
  "baDieu": ["3 câu ngắn, mỗi câu một điều đáng nhớ nhất, cụ thể cho lá số này"],
  "cauTruc": { "tieuDe": "Cấu trúc tạo nên bạn", "noiDung": "4-7 câu: cấu trúc chính đang vận hành và nó thể hiện ra đời sống thế nào", "maDuKien": ["F002"], "maNguon": [], "luongNguoc": "lực kéo ngược, nếu có" },
  "diemManh": [ { "tieuDe": "ngắn, không mở bằng cụm bị cấm", "noiDung": "3-5 câu: điểm mạnh, cách nó biểu hiện, cái giá của nó", "maDuKien": [], "maNguon": [], "luongNguoc": "" } ],
  "choDeKet": [ { "tieuDe": "ngắn", "noiDung": "3-5 câu: chỗ dễ mắc kẹt, khi nào nó lộ ra, điều đáng cân nhắc", "maDuKien": [], "maNguon": [], "luongNguoc": "" } ],
  "giaiDoan": { "tieuDe": "Giai đoạn bạn đang đi qua", "noiDung": "3-6 câu — CHỈ khi dữ kiện có lớp hạn; không có thì bỏ trường này", "maDuKien": [], "maNguon": [] },
  "ghepLai": "5-8 câu: nếu ghép tất cả lại thì bức tranh là gì. Đây là chỗ tạo giá trị tổng hợp — không lặp từng phần ở trên",
  "mangTheo": ["3 câu để mang theo: mỗi câu một điều đáng cân nhắc hoặc một câu hỏi phản chiếu"],
  "cachNoi": "1-2 câu: các dữ kiện nối với nhau thành mạch nào"
}

2-4 điểm mạnh, 2-4 chỗ dễ kẹt. Tổng bài 900-1500 từ.`;
}

interface Tho {
  baDieu?: unknown;
  cauTruc?: Partial<YBaiDai>;
  diemManh?: Partial<YBaiDai>[];
  choDeKet?: Partial<YBaiDai>[];
  giaiDoan?: Partial<YBaiDai>;
  ghepLai?: unknown;
  mangTheo?: unknown;
  cachNoi?: unknown;
}

function docJson(text: string): Tho | null {
  const sach = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const dau = sach.indexOf('{');
  const cuoi = sach.lastIndexOf('}');
  if (dau === -1 || cuoi <= dau) return null;
  const than = sach.slice(dau, cuoi + 1);

  const thu = (x: string): unknown => {
    try {
      return JSON.parse(x);
    } catch {
      return null;
    }
  };

  const mot = thu(than);
  if (mot && typeof mot === 'object' && !Array.isArray(mot)) return mot as Tho;

  // Model dài hơi hay đóng object sớm rồi mở object mới cho phần còn lại:
  // `{...},{"ghepLai": ...}`. Nội dung vẫn đủ và đúng, sai đúng một dấu ngoặc.
  // Vứt cả bài vì chuyện đó là phí — đo được trên gpt-5.4-mini: bài sâu, có
  // căn cứ, mà người đọc nhận về một khối JSON thô. Gộp lại rồi dùng tiếp.
  const nhieu = thu(`[${than}]`);
  if (Array.isArray(nhieu)) {
    const gop = nhieu.reduce<Record<string, unknown>>(
      (t, x) => (x && typeof x === 'object' && !Array.isArray(x) ? { ...t, ...(x as object) } : t),
      {}
    );
    if (Object.keys(gop).length) return gop as Tho;
  }
  return null;
}

const mangChuoi = (x: unknown): string[] =>
  Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : [];

/** Dựng markdown cho trang hiện tại — theo đúng thứ tự khung §11.3 */
export function dungVanBaiDai(b: BaiDaiCoCauTruc): string {
  const y = (m: YBaiDai) =>
    `### ${m.tieuDe}\n${m.noiDung.trim()}${m.luongNguoc ? `\n\n${m.luongNguoc.trim()}` : ''}`;
  const phan: string[] = [];
  if (b.baDieu.length) phan.push(`## Nếu chỉ nhớ ba điều\n${b.baDieu.map((c) => `- ${c}`).join('\n')}`);
  phan.push(`## Cấu trúc tạo nên bạn\n${b.cauTruc.noiDung.trim()}${b.cauTruc.luongNguoc ? `\n\n${b.cauTruc.luongNguoc.trim()}` : ''}`);
  if (b.diemManh.length) phan.push(`## Điểm mạnh nổi bật\n\n${b.diemManh.map(y).join('\n\n')}`);
  if (b.choDeKet.length) phan.push(`## Chỗ dễ mắc kẹt\n\n${b.choDeKet.map(y).join('\n\n')}`);
  if (b.giaiDoan?.noiDung) phan.push(`## ${b.giaiDoan.tieuDe || 'Giai đoạn bạn đang đi qua'}\n${b.giaiDoan.noiDung.trim()}`);
  if (b.ghepLai) phan.push(`## Nếu ghép tất cả lại\n${b.ghepLai.trim()}`);
  if (b.mangTheo.length) phan.push(`## Ba câu để mang theo\n${b.mangTheo.map((c) => `- ${c}`).join('\n')}`);
  return phan.join('\n\n');
}

export interface DauVaoBaiDai {
  laSo: LaSo;
  chuDe: ChuDeId;
  namXem: number;
  thangXem: number;
  cauHoiThem?: string;
  requestId?: string;
  uuTienModel?: string;
  ghiNhatKy?: boolean;
}

export async function luanBaiDai(vao: DauVaoBaiDai): Promise<KetQuaBaiDai> {
  const cd = CHU_DE[vao.chuDe];

  // Planner một người lo phần truy vấn; chủ đề bài dài đã biết trước nên ép
  // cung theo cấu hình chủ đề thay vì để nó đoán từ câu hỏi.
  const cauHoi = vao.cauHoiThem?.trim() || `${cd.nhan} ${cd.moTa}`;
  const keHoachGoc = lapKeHoach({ cauHoi, saoTheoCung: saoChinhTheoCung(vao.laSo) });
  const cungChuDe = (cd.cung as readonly string[]).filter((c) => c !== 'Thân');
  const keHoach = {
    ...keHoachGoc,
    chuDe: CHU_DE_PLANNER[vao.chuDe] ?? keHoachGoc.chuDe,
    cungLienQuan: [...new Set([...cungChuDe, ...keHoachGoc.cungLienQuan])],
    // Bài "Vận hạn" cần cả ba lớp; các chủ đề khác chỉ cần bản mệnh + lưu niên
    lopHan:
      vao.chuDe === 'van-han'
        ? (['ban-menh', 'dai-van', 'luu-nien', 'nguyet-han'] as const).slice()
        : keHoachGoc.lopHan,
  };

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });

  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 8 });
  const runId =
    vao.ghiNhatKy === false
      ? null
      : await ghiLanTruyHoi(keHoach, kqTruyHoi, { requestId: vao.requestId, cauHoi });

  const goi = dungGoiBangChung(cauHoi, keHoach, duKien, kqTruyHoi.daChon);

  const user = [
    dungKhoiChoPrompt(goi),
    vao.cauHoiThem?.trim() ? `\nNGƯỜI ĐỌC HỎI THÊM — trả lời trong bài:\n${vao.cauHoiThem.trim()}` : '',
    kqTruyHoi.daChon.length
      ? ''
      : '\nLƯU Ý: không có nguồn tham chiếu nào. Chỉ được mô tả những gì dữ kiện lá số nói, và nêu rõ phần học thuyết chưa có căn cứ.',
  ].join('\n');

  const kq = await goiVoiFallback({ system: dungSystem(vao.chuDe), user, maxTokens: 6000 }, vao.uuTienModel);
  const tho = docJson(kq.text);

  const phienBan = {
    baiDai: PHIEN_BAN_BAI_DAI,
    planner: keHoach.phienBan,
    truyHoi: kqTruyHoi.phienBan,
    phuongPhap: PHUONG_PHAP.phienBan,
  };

  // Không đọc được JSON: vẫn trả chữ về cho người đọc, nhưng ghi rõ lượt này
  // không qua kiểm duyệt — đừng giả vờ đã kiểm.
  if (!tho || typeof tho.cauTruc?.noiDung !== 'string') {
    return {
      van: kq.text,
      coCauTruc: null,
      goi,
      kiemDuyet: { dat: false, loi: ['Model không trả về đúng cấu trúc'], soYBiBo: 0 },
      ngonNgu: null,
      provider: kq.provider,
      model: kq.model,
      runId,
      daThuHong: kq.daThuHong,
      khoTrong: kqTruyHoi.khoTrong,
      phienBan,
    };
  }

  // --- Kiểm duyệt tất định: mã có tồn tại không, sao có trong dữ liệu không ---
  const maDuKien = new Set(duKien.map((f) => f.id));
  const maNguon = new Map(goi.bangChung.map((e) => [e.id, e]));
  const choPhep = new Set(
    nhanDangThucThe([...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')).map(
      (t) => t.id
    )
  );
  const loi: string[] = [];
  let soYBiBo = 0;

  const chuan = (m: Partial<YBaiDai> | undefined, tieuDeMacDinh: string): YBaiDai | null => {
    if (!m || typeof m.noiDung !== 'string' || !m.noiDung.trim()) return null;

    // Model hay viết "(F002, E001)" ngay trong câu, dù đã dặn. Người đọc không
    // biết F002 là gì — bóc ra khỏi chữ, nhưng GIỮ làm căn cứ: cái nó trích là
    // thật, chỉ đặt nhầm chỗ. Cũng định tuyến lại vì model hay nhét F### vào
    // maNguon và ngược lại.
    const maTrongVan = [...m.noiDung.matchAll(/\b([FE]\d{3})\b/g)].map((x) => x[1]);
    const noiDung = m.noiDung
      .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
      .replace(/\b[FE]\d{3}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;])/g, '$1')
      .trim();
    const tatCaMa = [...mangChuoi(m.maDuKien), ...mangChuoi(m.maNguon), ...maTrongVan];
    const dk = [...new Set(tatCaMa.filter((x) => x.startsWith('F')))].filter((x) => {
      if (maDuKien.has(x)) return true;
      loi.push(`Dữ kiện ${x} không tồn tại`);
      return false;
    });
    const ng = [...new Set(tatCaMa.filter((x) => x.startsWith('E')))].filter((x) => {
      if (maNguon.has(x)) return true;
      loi.push(`Nguồn ${x} không tồn tại`);
      return false;
    });
    const tieuDe = typeof m.tieuDe === 'string' && m.tieuDe.trim() ? m.tieuDe.trim() : tieuDeMacDinh;

    // Kê sao: câu nào nhắc từ ba tên sao trở lên là đang chép dữ kiện, không luận.
    // Ghi nhận để đo được, không loại — loại là mất ý, mà ý có thể vẫn đúng.
    for (const cau of noiDung.split(/(?<=[.!?])\s+/)) {
      const soSao = new Set(nhanDangThucThe(cau).filter((t) => t.loai === 'STAR').map((t) => t.id)).size;
      if (soSao >= 3) loi.push(`"${tieuDe}": một câu kê ${soSao} tên sao`);
    }

    // Sao được nhắc mà không có trong dữ kiện lẫn nguồn → bịa → loại cả ý
    const bia = nhanDangThucThe(noiDung).filter(
      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !choPhep.has(t.id)
    );
    if (bia.length) {
      loi.push(`"${tieuDe}" nhắc ${bia.map((t) => t.ten).join(', ')} không có trong dữ liệu`);
      soYBiBo += 1;
      return null;
    }
    // Khẳng định chuyên môn mà không mã nào → loại
    const coSao = nhanDangThucThe(noiDung).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION');
    if (dk.length === 0 && ng.length === 0 && coSao) {
      loi.push(`"${tieuDe}" nói về sao nhưng không gắn dữ kiện hay nguồn nào`);
      soYBiBo += 1;
      return null;
    }
    return {
      tieuDe,
      noiDung,
      maDuKien: dk,
      maNguon: ng,
      luongNguoc: typeof m.luongNguoc === 'string' && m.luongNguoc.trim() ? m.luongNguoc.trim() : undefined,
      mucChacChan: mucChacChan(
        ng.map((x) => maNguon.get(x)!).map((e) => ({ documentId: e.documentId, mucTinCay: e.mucTinCay }))
      ),
    };
  };

  const cauTruc = chuan(tho.cauTruc, 'Cấu trúc tạo nên bạn');
  const diemManh = (tho.diemManh ?? []).map((m, i) => chuan(m, `Điểm mạnh ${i + 1}`)).filter((x): x is YBaiDai => !!x);
  const choDeKet = (tho.choDeKet ?? []).map((m, i) => chuan(m, `Chỗ dễ kẹt ${i + 1}`)).filter((x): x is YBaiDai => !!x);
  const giaiDoan = chuan(tho.giaiDoan, 'Giai đoạn bạn đang đi qua') ?? undefined;

  const bocMa = (x: string) =>
    x
      .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
      .replace(/\b[FE]\d{3}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;])/g, '$1')
      .trim();

  const coCauTruc: BaiDaiCoCauTruc = {
    baDieu: mangChuoi(tho.baDieu).slice(0, 3).map(bocMa),
    cauTruc: cauTruc ?? { tieuDe: 'Cấu trúc tạo nên bạn', noiDung: String(tho.cauTruc?.noiDung ?? ''), maDuKien: [], maNguon: [] },
    diemManh,
    choDeKet,
    giaiDoan,
    ghepLai: typeof tho.ghepLai === 'string' ? bocMa(tho.ghepLai) : '',
    mangTheo: mangChuoi(tho.mangTheo).slice(0, 3).map(bocMa),
    cachNoi: typeof tho.cachNoi === 'string' ? tho.cachNoi : undefined,
  };

  const van = dungVanBaiDai(coCauTruc);
  const ngonNgu = soatNgonNgu(
    van,
    [coCauTruc.cauTruc, ...diemManh, ...choDeKet].map((m) => m.noiDung)
  );

  return {
    van,
    coCauTruc,
    goi,
    kiemDuyet: { dat: loi.length === 0, loi, soYBiBo },
    ngonNgu,
    provider: kq.provider,
    model: kq.model,
    runId,
    daThuHong: kq.daThuHong,
    khoTrong: kqTruyHoi.khoTrong,
    phienBan,
  };
}
