/**
 * Bộ đo chất lượng luận (CEL-197) — chạy: npx tsx scripts/do-chat-luong-luan.ts
 *
 * Chấm một câu trả lời đã có sẵn theo 11 tiêu chí, KHÔNG gọi model, 0đ.
 *
 *   Tầng 1, mọi câu
 *     T1 có kết luận            T5 độ dài đúng nhịp
 *     T2 không ba phải          T6 không câu cụt
 *     T3 tên sao có trong gói   T7 giọng Celes (tạm, chờ CEL-201)
 *     T4 khẳng định có nguồn    T8 không lộ từ cấm
 *   Tầng 2, theo lớp hạn / ý định
 *     T9  lưu niên, nguyệt hạn: có câu LUẬN bằng sao lưu, không chỉ kê tên.
 *         Đây là đòi hỏi SẢN PHẨM (bài năm phải có lớp lưu tinh), không phải
 *         chuẩn Tử Vi: Nam phái luận tiểu hạn chủ yếu bằng sao gốc của cung hạn.
 *         Chỉ nhận sao lưu engine an (`luuTinhTheoNam`); "Lưu Hóa X" engine
 *         không sinh nên không tính.
 *     T10 câu hỏi nhắm đại vận: nêu quãng tuổi bằng số
 *     T11 tra cứu: không gọi tên ngoài phần đang tra
 *
 * Hai chế độ:
 *
 *   (mặc định, CI) Tự kiểm bộ chấm: chấm các mẫu viết tay trong
 *   `scripts/du-lieu/mau-do-chat-luong.json`, mỗi mẫu có `kyVong` cho từng
 *   tiêu chí. Bộ chấm phán khác kỳ vọng thì thoát mã 1. Mẫu tốt phải đậu,
 *   mẫu hỏng phải rớt đúng tiêu chí nó cố tình phạm.
 *
 *   --tep <a.json>  Đo văn thật đã lưu: mảng { cauHoi, namXem, thangXem?,
 *   traLoi } (traLoi là object hoặc chuỗi JSON model trả). In tỉ lệ đạt theo ô
 *   yDinh × lopHan × chuDe. Không có ngưỡng nên không bao giờ thoát mã 1 —
 *   ngưỡng nghiệm thu chốt cùng chủ dự án.
 *
 *   --ca-tai-hien  In ca "năm 2026 có nên đổi việc không": yDinh, lopHan, gói
 *   dữ kiện thật mà đường STANDARD đưa cho model.
 *
 * Gói dữ kiện dựng lại offline giống đường STANDARD (`focused: false`, không
 * có đoạn nguồn): cùng lá số, cùng câu hỏi thì cùng gói. Lá số cố định
 * 12/5/1990 10h nam, như các bài kiểm khác.
 *
 * GIỚI HẠN ĐÃ BIẾT: đường STANDARD không đưa lưu tinh vào gói (chỉ Focused),
 * nên T9 trên văn STANDARD thật sẽ rớt hàng loạt. Đó là hiện trạng cần đo,
 * không phải lỗi bộ chấm — xem CEL-199. Mẫu G1, G2 mô phỏng gói CÓ lưu tinh.
 * T10 chỉ kiểm có quãng tuổi, không so số với engine (sai số thì T4 cũng không
 * bắt). T11 dựng gói không có đoạn nguồn E###, nên tên hợp lệ lấy từ đoạn nguồn
 * sẽ bị tính là ngoài tập. T8 so từ cấm trên chữ bỏ dấu, nên "ăn sao" cũng
 * khớp "an sao". `thangXem` là tháng ÂM, như engine.
 */

import { readFileSync } from 'node:fs';
import { dungGoiBangChung, docTraLoi, type GoiBangChung, type TraLoiCoCauTruc } from '../lib/rag/bang-chung';
import { chonBoiCanh } from '../lib/rag/boi-canh-la-so';
import { CUM_TIENG_LONG_CAM } from '../lib/rag/chuan-ngon-ngu';
import { CUM_FILLER_CAM } from '../lib/rag/dau-an';
import { tapTenTuGoi, tenNgoaiTap } from '../lib/rag/focused/quet-ten';
import { tinhHopDong, type Nhip } from '../lib/rag/hop-dong-tra-loi';
import { kiemDuyet } from '../lib/rag/kiem-duyet';
import { CUM_AI, soatNgonNgu } from '../lib/rag/ngon-ngu';
import { lapKeHoach, type KeHoachTruyVan, type LopHan } from '../lib/rag/planner';
import { boDau } from '../lib/rag/thuc-the';
import { lapLaSo, luuTinhTheoNam } from '../lib/tuvi/ansao';

/* ------------------------------------------------------------------ dựng gói */

const LA_SO = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', hoTen: 'Thử' });

interface Luot {
  keHoach: KeHoachTruyVan;
  goi: GoiBangChung;
  namXem: number;
}

/**
 * Năm và tháng hiệu lực theo đúng luật `tra-loi.ts`: câu gọi tên mốc thì mốc
 * đó thắng mốc đang xem. Không ghi tháng thì lấy tháng 1 cho tất định.
 */
function dungLuot(cauHoi: string, namXem: number, thangXem = 1): Luot {
  const keHoach = lapKeHoach({ cauHoi });
  const nam = keHoach.namMucTieu ?? namXem;
  const thang = keHoach.thangMucTieu ?? thangXem;
  const { duKien } = chonBoiCanh({ laSo: LA_SO, keHoach, namXem: nam, thangXem: thang, focused: false });
  return { keHoach, goi: dungGoiBangChung(cauHoi, keHoach, duKien, []), namXem: nam };
}

/**
 * Lớp hạn đại diện cho ô.
 *
 * Không lấy thẳng lớp hẹp nhất trong `lopHan`: planner gắn `luu-nien` cả cho
 * "tính cách tôi thế nào" (để có dữ kiện năm làm nền). Câu không nêu mốc thời
 * gian thì không bắt nó luận bằng sao lưu — xét theo `phamViThoiGian`.
 * Planner cũng gắn `dai-van` cho mọi câu quyết định, nên ô đại vận không tự
 * kéo theo T10 — T10 chỉ áp khi câu hỏi nhắm đại vận (`HOI_DAI_VAN`).
 */
const HOI_DAI_VAN = /đại vận|vận mười năm|vận 10 năm/iu;

function lopChinh(k: KeHoachTruyVan, cauHoi: string): LopHan {
  const co = (l: LopHan) => k.lopHan.includes(l);
  // Hỏi thẳng đại vận thì là ô đại vận, dù có kèm "năm nay" / "sắp tới"
  if (HOI_DAI_VAN.test(cauHoi) && co('dai-van')) return 'dai-van';
  if (k.phamViThoiGian === 'thang' && co('nguyet-han')) return 'nguyet-han';
  if ((k.phamViThoiGian === 'nam' || k.phamViThoiGian === 'gan' || k.phamViThoiGian === 'thang') && co('luu-nien'))
    return 'luu-nien';
  return co('dai-van') ? 'dai-van' : 'ban-menh';
}

const khoaO = (k: KeHoachTruyVan, cauHoi: string) => `${k.yDinh} × ${lopChinh(k, cauHoi)} × ${k.chuDe}`;

/* ------------------------------------------------------------------ văn */

/** Các câu model viết, theo trường — bỏ canNhac/buocTiepTheo vì đó là mẩu, không phải câu */
function cacDoanVan(t: TraLoiCoCauTruc): string[] {
  const ra: string[] = [];
  if (t.ketLuan) ra.push(t.ketLuan);
  ra.push(t.tomTat);
  for (const y of t.yChinh) {
    ra.push(y.noiDung);
    if (y.luongNguoc) ra.push(y.luongNguoc);
    if (y.neuThi) ra.push(y.neuThi);
  }
  if (t.tuKiem) ra.push(t.tuKiem);
  if (t.hoiLai) ra.push(t.hoiLai);
  return ra.map((s) => s.trim()).filter(Boolean);
}

/** Toàn văn người dùng đọc (gần đúng `dungVan`, không cần dấu ấn hay tiêu đề) */
function toanVan(t: TraLoiCoCauTruc): string {
  return [...cacDoanVan(t), ...(t.canNhac ?? []), ...(t.buocTiepTheo ?? [])].join('\n\n');
}

const demTu = (s: string) => s.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w)).length;

function tachCau(doan: string): string[] {
  return doan
    .split(/(?<=[.!?…])\s+/u)
    .map((c) => c.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ tiêu chí */

export type TieuChi = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11';
const MOI_TIEU_CHI: TieuChi[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11'];

/** `null` = không áp cho lượt này (không tính vào tỉ lệ) */
type KetQua = { dat: boolean; lyDo: string } | null;

/**
 * Trần số từ theo nhịp — TẠM, chờ chủ dự án chốt (CEL-197 bước 4).
 *
 * `hop-dong-tra-loi.ts` chỉ nói nhịp bằng lời ("trả lời gọn"), không có con
 * số. Con số ở đây lấy từ các bài đã đo ở bản thử: bài COMPACT tốt quanh
 * 80–150 từ, MEDIUM 200–350, DEEP tới ~600.
 */
const TRAN_TU: Record<Nhip, number> = { COMPACT: 180, MEDIUM: 420, DEEP: 700 };
const SAN_TU = 25;

const YDINH_CAN_KET_LUAN = new Set(['quyet-dinh', 'co-khong', 'thoi-diem']);

/** Từ không được ra mặt trước (AGENTS.md "Ngôn ngữ ở mặt trước") — so trên chữ bỏ dấu */
const TU_CAM_MAT_TRUOC = [
  'nam phai', 'bac phai', 'an sao', 'gemini', 'gpt', 'openai', 'claude', 'groq', 'llama',
  'mo hinh ngon ngu', 'tri tue nhan tao', 'json', 'quota', 'quan tri',
];

/** Chữ cuối câu cho thấy câu bị cắt giữa chừng */
const DUOI_CUT = /(?:^|\s)(?:và|nhưng|vì|nên|thì|là|của|với|để|mà|hoặc|khi|nếu|bởi)$/iu;
const DAU_CUOI = /[.!?…:)"”»]$/u;

/** Câu có nói về đời sống không — một câu chỉ toàn tên sao thì không */
const DOI_SONG =
  /(?<!\p{L})(?:bạn|việc|tiền|người|chuyện|công|nhà|gia đình|sức khỏe|sức khoẻ|quan hệ|thay đổi|gặp|mất|dễ|khó|nên|cần)(?!\p{L})/iu;

function cham(t: TraLoiCoCauTruc, luot: Luot): Record<TieuChi, KetQua> {
  const { keHoach, goi, namXem } = luot;
  const kd = kiemDuyet(t, goi);
  const coLoi = (...ma: string[]) => kd.loi.filter((l) => ma.includes(l.ma));
  const lyDo = (ds: { ma: string; moTa?: string }[]) => ds.map((l) => l.ma).join(', ');
  const doan = cacDoanVan(t);
  const van = toanVan(t);
  const lop = lopChinh(keHoach, goi.cauHoi);

  const ra = {} as Record<TieuChi, KetQua>;

  // T1 — chỉ áp cho câu cần nghiêng về một bên
  if (YDINH_CAN_KET_LUAN.has(keHoach.yDinh)) {
    const loi = coLoi('thieu-ket-luan');
    const coCau = !!t.ketLuan?.trim();
    ra.T1 = { dat: coCau && !loi.length, lyDo: coCau ? lyDo(loi) : 'không có ketLuan' };
  } else ra.T1 = null;

  {
    const loi = coLoi('ket-luan-ba-phai');
    ra.T2 = { dat: !loi.length, lyDo: lyDo(loi) };
  }
  {
    const loi = coLoi('sao-khong-co-trong-du-lieu', 'cach-cuc-khong-ton-tai');
    ra.T3 = { dat: !loi.length, lyDo: lyDo(loi) };
  }
  {
    const loi = coLoi('khang-dinh-chuyen-mon-khong-can-cu', 'du-kien-khong-ton-tai', 'nguon-khong-ton-tai');
    ra.T4 = { dat: !loi.length, lyDo: lyDo(loi) };
  }

  // T5 — nhịp do hợp đồng tính, trần số từ là tạm
  {
    const { nhip } = tinhHopDong({ yDinh: keHoach.yDinh, chuDe: keHoach.chuDe, doDaiCauHoi: goi.cauHoi.length });
    const n = demTu(van);
    const dat = n >= SAN_TU && n <= TRAN_TU[nhip];
    ra.T5 = { dat, lyDo: dat ? '' : `${n} từ, nhịp ${nhip} (khoảng ${SAN_TU}–${TRAN_TU[nhip]})` };
  }

  // T6 — câu cụt: thiếu dấu kết, hoặc dừng ở một hư từ
  {
    const cut = doan.flatMap(tachCau).filter((c) => !DAU_CUOI.test(c) || DUOI_CUT.test(c.replace(/[.!?…]+$/u, '')));
    ra.T6 = { dat: !cut.length, lyDo: cut.slice(0, 2).map((c) => `"…${c.slice(-30)}"`).join(' | ') };
  }

  // T7 — TẠM (chờ CEL-201): nói với "bạn", không sáo ngữ AI
  {
    const khongDau = boDau(van.toLowerCase());
    const sao = CUM_AI.filter((c) => khongDau.includes(c));
    const coBan = /(?<!\p{L})bạn(?!\p{L})/iu.test(van);
    const dat = coBan && !sao.length;
    ra.T7 = { dat, lyDo: dat ? '' : [!coBan && 'không xưng "bạn"', ...sao.map((s) => `sáo: ${s}`)].filter(Boolean).join(', ') };
  }

  // T8 — từ cấm mặt trước, tiếng lóng nội bộ, câu nhạt, lỗi ngôn ngữ mức chặn
  {
    const thuong = van.toLowerCase();
    const khongDau = boDau(thuong);
    const loi = [
      ...TU_CAM_MAT_TRUOC.filter((c) => new RegExp(`(?<![a-z])${c}(?![a-z])`).test(khongDau)),
      ...CUM_TIENG_LONG_CAM.filter((c) => thuong.includes(c)),
      ...CUM_FILLER_CAM.filter((c) => thuong.includes(c)),
      ...soatNgonNgu(van, []).loi.filter((l) => l.mucDo === 'chan').map((l) => l.ma),
    ];
    ra.T8 = { dat: !loi.length, lyDo: loi.join(', ') };
  }

  // T9 — có ít nhất một câu LUẬN bằng sao lưu: có tên sao lưu và có lời đời sống
  if (lop === 'luu-nien' || lop === 'nguyet-han') {
    const tenLuu = luuTinhTheoNam(namXem).map((s) => s.ten);
    const coTenLuu = (c: string) => tenLuu.some((ten) => c.includes(ten));
    const cauLuu = doan.flatMap(tachCau).filter(coTenLuu);
    // Bỏ tên sao lưu đi rồi mới tìm lời đời sống: câu chỉ kê "Lưu Bạch Hổ, Lưu Tang Môn ở cung này" thì rớt
    const boTen = (c: string) => tenLuu.reduce((x, ten) => x.split(ten).join(' '), c);
    const cauLuan = cauLuu.filter((c) => DOI_SONG.test(boTen(c)) && demTu(boTen(c)) >= 6);
    ra.T9 = {
      dat: cauLuan.length > 0,
      lyDo: cauLuan.length ? '' : cauLuu.length ? 'chỉ kê tên sao lưu, không luận' : 'không có sao lưu nào',
    };
  } else ra.T9 = null;

  // T10 — đại vận nêu quãng tuổi bằng số
  if (lop === 'dai-van' && HOI_DAI_VAN.test(goi.cauHoi)) {
    const dat = /\d{1,3}\s*(?:[–-]|đến|tới)\s*\d{1,3}\s*tuổi|tuổi\s*\d{1,3}\s*(?:[–-]|đến|tới)\s*\d{1,3}/iu.test(van);
    ra.T10 = { dat, lyDo: dat ? '' : 'không có quãng tuổi bằng số' };
  } else ra.T10 = null;

  // T11 — tra cứu: chỉ gọi tên có trong phần đang tra (gói + câu hỏi)
  if (keHoach.yDinh === 'tra-cuu') {
    const tap = tapTenTuGoi(goi.duKien, [goi.cauHoi]);
    const sai = [...new Set(doan.flatMap((c) => tenNgoaiTap(c, tap)))];
    ra.T11 = { dat: !sai.length, lyDo: sai.join(', ') };
  } else ra.T11 = null;

  return ra;
}

/* ------------------------------------------------------------------ chế độ */

interface MauTuKiem {
  id: string;
  ghiChu: string;
  cauHoi: string;
  namXem: number;
  thangXem?: number;
  traLoi: TraLoiCoCauTruc;
  /** Nhân ý đầu thêm n lần — dựng bài quá dài mà không phải chép tay */
  nhanBan?: number;
  /** Tiêu chí không ghi = không quan tâm ở mẫu này */
  kyVong: Partial<Record<TieuChi, boolean | null>>;
}

function tuKiem(): number {
  const mau = JSON.parse(readFileSync('scripts/du-lieu/mau-do-chat-luong.json', 'utf8')) as MauTuKiem[];
  let sai = 0;
  let soPhan = 0;
  const phuTot = new Set<TieuChi>();
  const phuRot = new Set<TieuChi>();
  console.log(`\n== TỰ KIỂM BỘ CHẤM (${mau.length} mẫu) ==`);
  for (const m of mau) {
    const luot = dungLuot(m.cauHoi, m.namXem, m.thangXem);
    const traLoi = m.nhanBan
      ? { ...m.traLoi, yChinh: [...m.traLoi.yChinh, ...Array(m.nhanBan).fill(m.traLoi.yChinh[0])] }
      : m.traLoi;
    const kq = cham(traLoi, luot);
    const lech: string[] = [];
    for (const [tc, mong] of Object.entries(m.kyVong) as [TieuChi, boolean | null][]) {
      soPhan += 1;
      const thuc = kq[tc] === null ? null : kq[tc]!.dat;
      if (thuc === true) phuTot.add(tc);
      if (thuc === false) phuRot.add(tc);
      if (thuc !== mong) lech.push(`${tc}: mong ${mong}, ra ${thuc}${kq[tc]?.lyDo ? ` (${kq[tc]!.lyDo})` : ''}`);
    }
    if (lech.length) {
      sai += 1;
      console.log(`  SAI  ${m.id} [${khoaO(luot.keHoach, luot.goi.cauHoi)}] ${m.ghiChu}`);
      for (const l of lech) console.log(`         ${l}`);
    } else console.log(`  OK   ${m.id} [${khoaO(luot.keHoach, luot.goi.cauHoi)}] ${m.ghiChu}`);
  }
  // Bộ mẫu phải chứng minh mỗi tiêu chí BẮT được và THA được ít nhất một lần
  for (const tc of MOI_TIEU_CHI) {
    if (!phuTot.has(tc) || !phuRot.has(tc)) {
      sai += 1;
      console.log(`  SAI  bộ mẫu chưa phủ ${tc}: ${phuTot.has(tc) ? '' : 'chưa có mẫu đậu '}${phuRot.has(tc) ? '' : 'chưa có mẫu rớt'}`);
    }
  }
  console.log(`\n${sai ? `${sai} chỗ sai` : 'Tất cả đạt'} (${soPhan} phán quyết trên ${mau.length} mẫu).`);
  return sai ? 1 : 0;
}

interface VanDaLuu {
  cauHoi: string;
  namXem: number;
  thangXem?: number;
  traLoi: TraLoiCoCauTruc | string;
}

function doTep(duongDan: string): number {
  const ds = JSON.parse(readFileSync(duongDan, 'utf8')) as VanDaLuu[];
  const theoO = new Map<string, { n: number; dat: Partial<Record<TieuChi, [number, number]>> }>();
  let hong = 0;
  for (const v of ds) {
    const traLoi = typeof v.traLoi === 'string' ? docTraLoi(v.traLoi) : v.traLoi;
    if (!traLoi) {
      hong += 1;
      continue;
    }
    const luot = dungLuot(v.cauHoi, v.namXem, v.thangXem);
    const kq = cham(traLoi, luot);
    const o = theoO.get(khoaO(luot.keHoach, luot.goi.cauHoi)) ?? { n: 0, dat: {} };
    o.n += 1;
    for (const tc of MOI_TIEU_CHI) {
      if (kq[tc] === null) continue;
      const [d, n] = o.dat[tc] ?? [0, 0];
      o.dat[tc] = [d + (kq[tc]!.dat ? 1 : 0), n + 1];
    }
    theoO.set(khoaO(luot.keHoach, luot.goi.cauHoi), o);
  }
  console.log(`\n== ĐO ${ds.length} bài (${hong} bài không đọc được JSON) ==`);
  console.log(['Ô', 'n', ...MOI_TIEU_CHI].join('\t'));
  for (const [khoa, o] of [...theoO].sort()) {
    const cot = MOI_TIEU_CHI.map((tc) => {
      const x = o.dat[tc];
      return x ? `${Math.round((100 * x[0]) / x[1])}%` : '—';
    });
    console.log([khoa, o.n, ...cot].join('\t'));
  }
  return 0;
}

function caTaiHien(): number {
  const cauHoi = 'Năm 2026 tôi có nên đổi việc không?';
  const { keHoach, goi } = dungLuot(cauHoi, 2026);
  console.log(`\n== CA TÁI HIỆN: "${cauHoi}" (lá số 12/5/1990 10h nam, đường STANDARD) ==`);
  console.log(`yDinh=${keHoach.yDinh} lopHan=${keHoach.lopHan.join(',')} chuDe=${keHoach.chuDe} ô=[${khoaO(keHoach, goi.cauHoi)}]`);
  console.log(`Gói: ${goi.duKien.length} dữ kiện; lưu tinh trong gói: ${goi.duKien.some((d) => d.loai === 'luu-tinh') ? 'CÓ' : 'KHÔNG'}`);
  for (const d of goi.duKien) console.log(`  ${d.id} [${d.loai}] ${d.noiDung}`);
  return 0;
}

const viTriTep = process.argv.indexOf('--tep');
process.exitCode =
  viTriTep > 0 ? doTep(process.argv[viTriTep + 1]) : process.argv.includes('--ca-tai-hien') ? caTaiHien() : tuKiem();
