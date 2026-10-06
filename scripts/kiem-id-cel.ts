/**
 * MÁY CANH ID CEL — chặn hai nhánh cùng cấp một ID cho hai việc khác nhau. Chạy trong CI.
 *
 *   npx tsx scripts/kiem-id-cel.ts        # cần origin/main và các nhánh remote (CI: fetch-depth 0)
 *   npx tsx scripts/kiem-id-cel.ts --dau 184fc44 --main c226d67   # dựng lại một lúc trong quá khứ
 *
 * Vì sao có: đã trùng hai lần — CEL-150 (gỡ ở 87f5b0c) và CEL-194 (05/10/2026: máy 1 cấp lúc 21:17
 * trên nhánh chưa push, N1 push CEL-194 lúc 21:21; phải đổi sang CEL-196 ở fb2b023). Lúc cấp ID cả
 * hai nhánh đều chưa lên remote nên không công cụ nào ở bước cấp thấy được; chỗ sớm nhất bắt được là
 * lúc nhánh thứ hai được push. Luật trong docs/bai-hoc/cach-lam.md.
 *
 * "ID mới của một nhánh" = có trong Backlog ở đầu nhánh, không có ở merge-base với origin/main.
 * Đỏ khi một ID mới của nhánh này:
 *   1. đã có trên origin/main cho một tính năng khác (cột "Tính năng" khác) — main giữ ID;
 *   2. cũng là ID mới của một nhánh remote khác (không cùng dòng dõi, có commit trong 45 ngày)
 *      cho một tính năng khác — nhánh nào gộp main trước giữ ID, nhánh kia cấp lại;
 *   3. xuất hiện hai lần trong Backlog của chính nhánh.
 * Cùng ID + cùng "Tính năng" thì không tính (nhánh tách ra từ nhánh kia).
 */
import { execFileSync } from 'node:child_process';
import ExcelJS from 'exceljs';

const TEP = 'PRODUCT-BACKLOG.xlsx';
const doiSo = (ten: string, mac: string) => {
  const i = process.argv.indexOf(ten);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : mac;
};
const DAU = doiSo('--dau', 'HEAD');
const MAIN = doiSo('--main', 'origin/main');
const SO_NGAY = 45;

export type BangId = Map<string, string>; // ID -> Tính năng
export interface NhanhKhac {
  ten: string;
  idMoi: BangId;
}

const chuan = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

/** Hàm thuần: test offline gọi thẳng. */
export function timXungDot(cuaToi: BangId, main: BangId, khac: readonly NhanhKhac[], trungTrongNhanh: readonly string[] = []) {
  const loi: string[] = trungTrongNhanh.map((id) => `${id} xuất hiện hơn một lần trong Backlog của nhánh này.`);
  for (const [id, ten] of cuaToi) {
    const tm = main.get(id);
    if (tm !== undefined && chuan(tm) !== chuan(ten))
      loi.push(`${id}: main đã dùng cho "${tm.slice(0, 60)}", nhánh này dùng cho "${ten.slice(0, 60)}". Main giữ ID — cấp lại ở nhánh này.`);
    for (const k of khac) {
      const tk = k.idMoi.get(id);
      if (tk !== undefined && chuan(tk) !== chuan(ten))
        loi.push(`${id}: nhánh ${k.ten} cũng vừa cấp cho "${tk.slice(0, 60)}". Nhánh nào gộp main trước giữ ID, nhánh kia cấp lại.`);
    }
  }
  return loi;
}

function git(...a: string[]) {
  return execFileSync('git', a, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}
function gitThu(...a: string[]) {
  try {
    return git(...a);
  } catch {
    return null;
  }
}

const dem = new Map<string, { bang: BangId; trung: string[] }>();
async function docBang(ref: string) {
  const blob = gitThu('rev-parse', `${ref}:${TEP}`);
  if (!blob) return { bang: new Map() as BangId, trung: [] as string[] };
  const co = dem.get(blob);
  if (co) return co;
  const buf = execFileSync('git', ['cat-file', 'blob', blob], { maxBuffer: 256 * 1024 * 1024 });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.getWorksheet('Backlog');
  const bang: BangId = new Map();
  const trung: string[] = [];
  if (ws) {
    const td = (ws.getRow(1).values as unknown[]).map((v) => String(v ?? ''));
    const cId = td.indexOf('ID');
    const cTen = td.indexOf('Tính năng');
    ws.eachRow((row, r) => {
      if (r === 1) return;
      const id = String(row.getCell(cId).text ?? '').trim();
      if (!/^CEL-\d+$/.test(id)) return;
      if (bang.has(id)) trung.push(id);
      bang.set(id, String(row.getCell(cTen).text ?? ''));
    });
  }
  const kq = { bang, trung };
  dem.set(blob, kq);
  return kq;
}

async function idMoi(ref: string) {
  const mb = gitThu('merge-base', ref, MAIN);
  const dau = await docBang(ref);
  const goc = mb ? (await docBang(mb)).bang : new Map();
  const moi: BangId = new Map([...dau.bang].filter(([id]) => !goc.has(id)));
  return { moi, trung: dau.trung };
}

const laToTien = (a: string, b: string) => {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', a, b], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

async function chay() {
  if (!gitThu('rev-parse', '--verify', MAIN)) {
    console.log('Không có origin/main (clone nông?). CI cần actions/checkout với fetch-depth: 0; máy cá nhân chạy git fetch trước.');
    process.exit(1);
  }
  const head = git('rev-parse', DAU);
  const toi = await idMoi(DAU);
  const main = (await docBang(MAIN)).bang;
  const tuNgay = Date.now() / 1000 - SO_NGAY * 86400;
  const khac: NhanhKhac[] = [];
  for (const ref of git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin').split('\n')) {
    if (!ref || ref === 'origin/main' || ref === 'origin/HEAD' || ref === 'origin') continue;
    const tip = gitThu('rev-parse', ref);
    if (!tip || Number(gitThu('log', '-1', '--format=%ct', ref)) < tuNgay) continue;
    if (laToTien(tip, head) || laToTien(head, tip) || laToTien(tip, MAIN)) continue;
    khac.push({ ten: ref.replace(/^origin\//, ''), idMoi: (await idMoi(ref)).moi });
  }
  const loi = timXungDot(toi.moi, main, khac, toi.trung);
  console.log(`ID CEL mới của nhánh: ${[...toi.moi.keys()].join(', ') || '(không có)'} · so với main + ${khac.length} nhánh remote khác`);
  if (loi.length) {
    console.log('\nTRÙNG ID CEL:');
    for (const l of loi) console.log(`  ✗ ${l}`);
    console.log('\nCấp lại bằng: python .claude/skills/cap-nhat-backlog/backlog.py xem (sau git fetch), đổi ở cả ba sheet + chú thích mã.');
    process.exit(1);
  }
  console.log('Không trùng.');
}

if (/(^|[\\/])kiem-id-cel\.ts$/.test(process.argv[1] ?? '')) void chay();
