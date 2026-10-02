/**
 * Đo độ phủ của thư viện dấu ấn Celes (`lib/rag/dau-an.ts`) — mục 23.
 *
 * In BA tập RIÊNG, không gộp — gộp chúng là chặn merge sai:
 *
 *   1. Toàn keyspace (mọi chuDe × mọi yDinh có dấu ấn) → UNREACHABLE.
 *      > 0 là CHẶN (mã thoát 1): có câu đã duyệt mà không khoá hợp lệ nào tới được.
 *   2. Bộ vàng planner → UNHIT_ON_GOLD. Chỉ cảnh báo: bộ vàng chưa chạm,
 *      nhưng khoá hợp lệ khác vẫn tới được.
 *   3. 15 lượt thật gần nhất (`retrieval_runs`, che_do = 'that') → phân bố.
 *      Cảnh báo khi một câu chiếm > 25%. Thiếu DB thì bỏ qua tập này, có báo.
 *
 * Cổng 1b, CHẶN: SENSITIVE / CRITICAL / tra-cuu / tong-quan:mo-ta khi planner
 * không chắc / câu nối tiếp / bài không có ketLuan — tất cả phải ra 0 dấu ấn.
 *
 * NO_KET_LUAN_GATE chỉ đo được trên đầu vào dựng (1b). Câu trả lời không lưu
 * vào DB (`retrieval_runs`, `ai_requests` không giữ văn bản), nên tập 2 và 3
 * giả định mọi lượt CÓ ketLuan — số ở đó là trần trên. Tụt độ phủ vì cổng
 * này là tụt đúng, không phải hồi quy.
 *
 * Tập 2 và 3 in HAI thước đo tách riêng: phân bố chuDe:yDinh của PLANNER và phân
 * bố từng CÂU. Một câu > 25% thường là planner đang hút fallback, không phải
 * thư viện lệch — nhìn bảng planner trước khi sửa câu. Cảnh báo phân bố KHÔNG
 * làm đỏ script.
 *
 * Cổng thư viện, CHẶN: mọi câu phải qua `kiemCauDauAn` (hai bất biến không nhắc
 * chủ đề / không hứa bố cục, cụm nhạt, đổi độ chắc), và mỗi yDinh phải đúng
 * `SO_BIEN_THE` câu.
 *
 * Độ phủ (tỉ lệ có dấu ấn) KHÔNG phải KPI phải giữ: giảm vì planner không chắc
 * hay vì câu nối tiếp là giảm đúng chỗ.
 *
 * Planner chạy bằng luật (`lapKeHoach`), không gọi model.
 *
 *   npx tsx scripts/do-coverage-dau-an.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { chonDauAn, kiemCauDauAn, SO_BIEN_THE, THU_VIEN_DAN_LUAN, type DauVaoDauAn } from '../lib/rag/dau-an';
import { doAnToan } from '../lib/rag/an-toan';
import { BO_VANG_PLANNER } from '../lib/rag/bo-vang';
import { lapKeHoach, type ChuDe, type YDinh } from '../lib/rag/planner';
import { boDanDat, tinhHopDong } from '../lib/rag/hop-dong-tra-loi';

const CHU_DE: ChuDe[] = ['su-nghiep', 'tai-chinh', 'tinh-cam', 'gia-dao', 'suc-khoe', 'tong-quan'];
const Y_DINH = Object.keys(THU_VIEN_DAN_LUAN) as Exclude<YDinh, 'tra-cuu'>[];
const NGUONG_PHAN_BO = 0.25;

const moiBienThe = Y_DINH.flatMap((y) => THU_VIEN_DAN_LUAN[y].map((_, i) => `${y}#${i}`));
let chan = 0;

function phanTram(a: number, b: number) {
  return b ? `${((a / b) * 100).toFixed(1).replace('.', ',')}%` : '—';
}
function tang(m: Map<string, number>, k: string) {
  m.set(k, (m.get(k) ?? 0) + 1);
}

// ── 0. Thư viện ──────────────────────────────────────────────────────────────
console.log('=== 0. THƯ VIỆN (chặn) ===');
for (const y of Y_DINH) {
  const ds = THU_VIEN_DAN_LUAN[y];
  if (ds.length !== SO_BIEN_THE) {
    chan += 1;
    console.log(`  CHẶN  ${y}: ${ds.length} câu, phải đúng ${SO_BIEN_THE}`);
  }
  ds.forEach((c, i) => {
    const loi = kiemCauDauAn(c);
    if (loi.length) {
      chan += 1;
      console.log(`  CHẶN  ${y}#${i}: ${loi.join('; ')}`);
    }
  });
}
console.log(`  ${moiBienThe.length} câu, ${Y_DINH.length} yDinh × ${SO_BIEN_THE}`);

// ── 1. Toàn keyspace ─────────────────────────────────────────────────────────
// Khoá hợp lệ = planner chắc + lượt đầu. Hai cổng chỉ BỎ dấu ấn, không mở thêm
// khoá nào, nên tới được ở đây là tới được trên đường thật.
console.log('\n=== 1. TOÀN KEYSPACE (chặn) ===');
const LUOT_DAU = { chacChan: true, laCauNoi: false, coKetLuan: true, boDanDat: false } as const;
const toiDuoc = new Set<string>();
for (const y of Y_DINH) {
  const dong: string[] = [];
  for (const c of CHU_DE) {
    const d = chonDauAn({ chuDe: c, yDinh: y, mucAnToan: 'NORMAL', ...LUOT_DAU });
    if (d.bienThe) toiDuoc.add(d.bienThe);
    dong.push(`${c}→${d.bienThe?.split('#')[1] ?? '-'}`);
  }
  console.log(`  ${y.padEnd(11)} ${dong.join('  ')}`);
}
const unreachable = moiBienThe.filter((b) => !toiDuoc.has(b));
console.log(
  `  Khoá: ${CHU_DE.length * Y_DINH.length}   UNREACHABLE: ${unreachable.length}/${moiBienThe.length}${unreachable.length ? `  → ${unreachable.join(', ')}` : ''}`
);
if (unreachable.length) chan += 1;

// ── 1b. Cổng không-dấu-ấn ────────────────────────────────────────────────────
console.log('\n=== 1b. CỔNG KHÔNG DẤU ẤN (chặn) ===');
function cong(ten: string, vao: DauVaoDauAn[]) {
  const lot = vao.filter((v) => chonDauAn(v).cau);
  if (lot.length) chan += 1;
  console.log(
    `  ${lot.length ? 'CHẶN' : 'OK  '}  ${ten.padEnd(38)} ${lot.length}/${vao.length} có dấu ấn${lot.length ? `  → ${lot.map((v) => `${v.chuDe}:${v.yDinh}`).join(', ')}` : ''}`
  );
}
const TAT_CA_Y: YDinh[] = [...Y_DINH, 'tra-cuu'];
const moiKhoa = CHU_DE.flatMap((c) => TAT_CA_Y.map((y) => ({ chuDe: c, yDinh: y })));
cong('SENSITIVE', moiKhoa.map((k) => ({ ...k, mucAnToan: 'SENSITIVE', ...LUOT_DAU })));
cong('CRITICAL', moiKhoa.map((k) => ({ ...k, mucAnToan: 'CRITICAL', ...LUOT_DAU })));
cong('tra-cuu', CHU_DE.map((c) => ({ chuDe: c, yDinh: 'tra-cuu', mucAnToan: 'NORMAL', ...LUOT_DAU })));
cong('tong-quan:mo-ta + !chacChan', [
  { chuDe: 'tong-quan', yDinh: 'mo-ta', mucAnToan: 'NORMAL', ...LUOT_DAU, chacChan: false },
]);
cong('tong-quan:mo-ta + phân loại bằng model', [
  {
    chuDe: 'tong-quan',
    yDinh: 'mo-ta',
    mucAnToan: 'NORMAL',
    ...LUOT_DAU,
    phanLoaiBangModel: true,
  },
]);
cong('laCauNoi', moiKhoa.map((k) => ({ ...k, mucAnToan: 'NORMAL', ...LUOT_DAU, laCauNoi: true })));
cong('độ sâu QUICK', moiKhoa.map((k) => ({ ...k, mucAnToan: 'NORMAL', ...LUOT_DAU, doSau: 'QUICK' as const })));
// Mọi khoá lẽ ra CÓ dấu ấn (NORMAL, planner chắc, lượt đầu) — chỉ thiếu ketLuan.
const khongKetLuan: DauVaoDauAn[] = CHU_DE.flatMap((c) =>
  Y_DINH.map((y) => ({ chuDe: c, yDinh: y, mucAnToan: 'NORMAL' as const, ...LUOT_DAU, coKetLuan: false }))
);
cong('không ketLuan', khongKetLuan);
const noKetLuanGate = khongKetLuan.filter((v) => chonDauAn(v).lyDo === 'khong-ket-luan').length;
console.log(`  NO_KET_LUAN_GATE = ${noKetLuanGate}/${khongKetLuan.length} khoá bị cổng ketLuan chặn`);
// Câu một dòng: hợp đồng tự quyết khoá nào nhận "bỏ phần dẫn dắt" — không tự liệt kê ở đây.
const CAU_NGAN = 20;
const boDanDatKhoa: DauVaoDauAn[] = CHU_DE.flatMap((c) =>
  Y_DINH.map((y) => ({ chuDe: c, yDinh: y, mucAnToan: 'NORMAL' as const, ...LUOT_DAU })).filter((v) =>
    boDanDat(tinhHopDong({ yDinh: v.yDinh, chuDe: v.chuDe, doDaiCauHoi: CAU_NGAN, mucAnToan: 'NORMAL' }), v.yDinh)
  ).map((v) => ({ ...v, boDanDat: true }))
);
cong('bỏ dẫn dắt (COMPACT)', boDanDatKhoa);
console.log(`  BO_DAN_DAT_GATE = ${boDanDatKhoa.length} khoá câu ngắn bị cổng hợp đồng chặn`);
if (!boDanDatKhoa.length) {
  chan += 1;
  console.log('  CHẶN  không khoá nào nhận "bỏ phần dẫn dắt" — cổng này không còn được thử');
}

// ── Hai thước đo tách riêng: planner và câu ──────────────────────────────────
function inPhanBo(nhan: string, dem: Map<string, number>, tong: number, canhBao: boolean) {
  console.log(`  ${nhan} (trên ${tong}):`);
  for (const [b, n] of [...dem].sort((a, b) => b[1] - a[1])) {
    const vuot = canhBao && n / tong > NGUONG_PHAN_BO;
    console.log(`    ${vuot ? 'CẢNH BÁO ' : '         '}${b.padEnd(24)} ${String(n).padStart(3)}  ${phanTram(n, tong)}`);
  }
}

interface Luot {
  cauHoi: string;
  laCauNoi: boolean;
}

function doTap(ten: string, ds: Luot[], inTungLuot: boolean): Map<string, number> {
  const planner = new Map<string, number>();
  const cau = new Map<string, number>();
  const lyDo = new Map<string, number>();
  let co = 0;
  for (const l of ds) {
    const k = lapKeHoach({ cauHoi: l.cauHoi });
    const d = chonDauAn({
      chuDe: k.chuDe,
      yDinh: k.yDinh,
      mucAnToan: doAnToan(l.cauHoi).muc,
      chacChan: k.chacChan,
      phanLoaiBangModel: k.phanLoaiBangModel,
      laCauNoi: l.laCauNoi,
      // Câu trả lời không lưu → không biết có ketLuan không; giả định có (trần trên).
      coKetLuan: true,
      boDanDat: boDanDat(
        tinhHopDong({ yDinh: k.yDinh, chuDe: k.chuDe, doDaiCauHoi: l.cauHoi.length, mucAnToan: doAnToan(l.cauHoi).muc }),
        k.yDinh
      ),
    });
    tang(planner, `${k.chuDe}:${k.yDinh}${k.chacChan ? '' : ' (?)'}`);
    if (d.bienThe) {
      co += 1;
      tang(cau, d.bienThe);
    } else tang(lyDo, d.lyDo ?? '?');
    if (inTungLuot) {
      const nhan = d.bienThe ?? `— ${d.lyDo}`;
      const kh = `${k.chuDe}:${k.yDinh}${k.chacChan ? '' : '(?)'}${l.laCauNoi ? ' [nối]' : ''}`;
      console.log(`  ${nhan.padEnd(22)} ${kh.padEnd(28)} «${l.cauHoi.replace(/\s+/g, ' ').slice(0, 50)}»`);
    }
  }
  console.log(`  ${ten}: có dấu ấn ${co}/${ds.length} = ${phanTram(co, ds.length)} (trần trên)`);
  console.log('  NO_KET_LUAN_GATE = không đo được — câu trả lời không lưu vào DB');
  inPhanBo('Không dấu ấn, theo lý do', lyDo, ds.length - co, false);
  inPhanBo('PLANNER chuDe:yDinh — (?) = không chắc', planner, ds.length, true);
  inPhanBo('CÂU dấu ấn', cau, co, true);
  return cau;
}

// ── 2. Bộ vàng ───────────────────────────────────────────────────────────────
console.log(`\n=== 2. BỘ VÀNG ${BO_VANG_PLANNER.length} CÂU (cảnh báo) ===`);
const demVang = doTap(
  'Bộ vàng',
  BO_VANG_PLANNER.map((c) => ({ cauHoi: c.cauHoi, laCauNoi: false })),
  false
);
const unhit = moiBienThe.filter((b) => !demVang.has(b));
console.log(`  UNHIT_ON_GOLD: ${unhit.length}/${moiBienThe.length}${unhit.length ? `  → ${unhit.join(', ')}` : ''}`);

// ── 3. Lượt thật ─────────────────────────────────────────────────────────────
/*
 * `retrieval_runs` không lưu lịch sử hội thoại, nên `laCauNoi` dựng lại GẦN
 * ĐÚNG: có lượt trước của cùng người chạy trong 30 phút thì coi như đã có một
 * câu trả lời, rồi đưa qua chính `laCauNoiTiep`. Cờ chip gợi ý không dựng lại được.
 */
const CUA_SO_NOI_MS = 30 * 60 * 1000;

async function luotThat() {
  console.log('\n=== 3. 15 LƯỢT THẬT (cảnh báo > 25%) ===');
  if (!existsSync('.env.local')) {
    console.log('  BỎ QUA: không có .env.local');
    return;
  }
  for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
    const s = d.trim();
    if (!s || s.startsWith('#')) continue;
    const [k, ...p] = s.split('=');
    const v = p.join('=').trim();
    if (v) process.env[k.trim()] = v;
  }
  try {
    const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
    const { laCauNoiTiep } = await import('../lib/rag/tiep-noi');
    const sb = taoSupabaseAdmin();
    if (!sb) {
      console.log('  BỎ QUA: thiếu SUPABASE_SERVICE_ROLE_KEY');
      return;
    }
    const { data, error } = await sb
      .from('retrieval_runs')
      .select('cau_hoi, tao_luc, nguoi_chay')
      .eq('che_do', 'that')
      .order('tao_luc', { ascending: false })
      .limit(60);
    if (error) throw error;
    const hang = data ?? [];
    const ds: Luot[] = hang.slice(0, 15).map((r, i) => {
      const truoc = hang.slice(i + 1).find((t) => t.nguoi_chay && t.nguoi_chay === r.nguoi_chay);
      const gan =
        truoc !== undefined && new Date(r.tao_luc).getTime() - new Date(truoc.tao_luc).getTime() < CUA_SO_NOI_MS;
      const lichSu = gan
        ? [
            { vaiTro: 'nguoi-dung' as const, noiDung: truoc.cau_hoi },
            { vaiTro: 'tro-ly' as const, noiDung: '…' },
          ]
        : [];
      return { cauHoi: r.cau_hoi, laCauNoi: laCauNoiTiep(r.cau_hoi, lichSu) };
    });
    doTap('Lượt thật', ds, true);
  } catch (e) {
    console.log(`  BỎ QUA: không đọc được DB — ${(e as Error).message}`);
  }
}

luotThat().then(() => {
  console.log(`\n${chan ? `ĐỎ — ${chan} lỗi chặn` : 'XANH — UNREACHABLE = 0, mọi cổng không-dấu-ấn = 0, thư viện qua cổng'}`);
  process.exit(chan ? 1 : 0);
});
