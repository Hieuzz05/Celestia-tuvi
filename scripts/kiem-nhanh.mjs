/**
 * Kiểm nhanh theo vùng vừa sửa — OFFLINE, không DB, không model.
 *
 *   npm run kiem-nhanh            # chỉ các bài của vùng đã đổi
 *   npm run kiem-nhanh -- --tat-ca  # mọi bài offline (như CI, trừ build)
 *
 * Tệp đổi = diff so với merge-base của HEAD và origin/main (rơi về main, rồi
 * HEAD~1), CỘNG thay đổi chưa commit và tệp mới chưa track. Luôn chạy tsc +
 * lint; còn lại ánh xạ vùng → bài. Không chạy build — CI và cổng cuối lo việc đó.
 * Thoát ≠ 0 khi có bài đỏ.
 */
import { execSync, spawnSync } from 'node:child_process';

const tatCa = process.argv.includes('--tat-ca');

const git = (lenh) => {
  try {
    return execSync(`git ${lenh}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

const base = git('merge-base HEAD origin/main') ?? git('merge-base HEAD main') ?? git('rev-parse HEAD~1');
const tep = new Set(
  [
    base ? git(`diff --name-only ${base}`) : '',
    git('diff --name-only'),
    git('diff --name-only --cached'),
    git('ls-files --others --exclude-standard'),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter(Boolean)
);

// Mọi bài OFFLINE (không DB, không model). Bài chạm DB/model không bao giờ chạy ở đây.
const ENGINE = ['test-ansao-chuan', 'test-cach-cuc', 'test-12-cung', 'test-phu-du-kien', 'test-boi-canh-doc'];
const PLANNER = ['test-rag-planner', 'eval-planner'];
const AN_TOAN = ['test-an-toan', 'smoke-safety', 'test-linh-vat-an-toan'];
const RAG = [
  'test-hop-dong-tra-loi', 'test-dau-an', 'do-coverage-dau-an', 'test-do-sau', 'test-ngoai-tam',
  'test-quick-answer', 'test-chuan-ngon-ngu', 'test-sua-chua-tach', 'smoke-quick',
];
const OFFLINE = new Set([...ENGINE, ...PLANNER, ...AN_TOAN, ...RAG]);

const VUNG = [
  [/^lib\/tuvi\//, ENGINE],
  [/^lib\/rag\/(planner|bo-vang|thuc-the|tu-dien)/, PLANNER],
  [/^lib\/rag\/an-toan|^lib\/linh-vat/, AN_TOAN],
  [/^lib\/rag\//, RAG],
];

const bai = new Set();
if (tatCa) OFFLINE.forEach((b) => bai.add(b));
for (const t of tep) {
  for (const [mau, ds] of VUNG) if (mau.test(t)) ds.forEach((b) => bai.add(b));
  const m = t.match(/^scripts\/((?:test|smoke|eval|do)-[\w-]+)\.ts$/);
  if (m && OFFLINE.has(m[1])) bai.add(m[1]);
}

console.log(`Gốc so sánh: ${base ? base.slice(0, 8) : '(không có)'} · ${tep.size} tệp đổi`);
console.log(`Chạy: tsc, lint${bai.size ? ', ' + [...bai].join(', ') : ''}\n`);

const ketQua = [];
function chay(ten, lenh) {
  const t0 = Date.now();
  const r = spawnSync(lenh, { shell: true, encoding: 'utf8' });
  const ok = r.status === 0;
  ketQua.push([ten, ok]);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${ten} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (!ok) console.log(((r.stdout ?? '') + (r.stderr ?? '')).split('\n').slice(-25).join('\n'));
}

chay('tsc', 'npx tsc --noEmit');
chay('lint', 'node scripts/dem-loi-lint.mjs');
for (const b of bai) chay(b, `npx tsx scripts/${b}.ts`);

const hong = ketQua.filter(([, ok]) => !ok).length;
console.log(hong ? `\n✗ ${hong}/${ketQua.length} bài đỏ` : `\n✓ ${ketQua.length}/${ketQua.length} bài xanh`);
if (hong) process.exit(1);
