#!/usr/bin/env node
/**
 * Chọn đúng bài kiểm cho phần mã vừa đổi — "test nóng đúng vùng" (quyết định 02/10/2026).
 *
 *   node scripts/kiem-nhanh.mjs            # liệt kê bài cần chạy cho thay đổi so với origin/main
 *   node scripts/kiem-nhanh.mjs --chay     # chạy luôn, in bảng ĐẠT / TRƯỢT
 *   node scripts/kiem-nhanh.mjs --tu main  # so với nhánh khác
 *
 * Danh sách bài đọc thẳng từ .github/workflows/kiem-tra.yml, nên CI thêm bài là tệp này tự biết.
 * Một bài được chọn khi tệp vừa đổi nằm trong bao đóng import của nó (lần cả import gián tiếp,
 * bí danh `@/`). Đổi cấu hình dựng (package.json, tsconfig, CI, next.config) thì chạy hết.
 *
 * Đây KHÔNG thay CI: CI vẫn chạy đủ trên mọi lần đẩy. Tệp này chỉ để vòng sửa–kiểm ngắn lại.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const GOC = process.cwd()
const thamSo = process.argv.slice(2)
const CHAY = thamSo.includes('--chay')
const TU = thamSo.includes('--tu') ? thamSo[thamSo.indexOf('--tu') + 1] : 'origin/main'

const CHAY_HET = [/^package(-lock)?\.json$/, /^tsconfig\.json$/, /^\.github\/workflows\//, /^next\.config\./]
const MA = /\.(ts|tsx|mjs|js)$/

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function tepDaDoi() {
  const dong = [
    git('diff', '--name-only', `${TU}...HEAD`),
    git('diff', '--name-only', 'HEAD'),
    git('ls-files', '--others', '--exclude-standard'),
  ].join('\n')
  return [...new Set(dong.split('\n').map((s) => s.trim()).filter(Boolean))]
    .filter((t) => !t.startsWith('apps/') && !t.startsWith('scripts/tam-'))
}

function baiTrongCI() {
  const yml = readFileSync(join(GOC, '.github/workflows/kiem-tra.yml'), 'utf8')
  return [...yml.matchAll(/npx tsx (scripts\/[\w.-]+\.ts)/g)].map((m) => m[1])
}

function giaiImport(tuTep, spec) {
  let goc
  if (spec.startsWith('@/')) goc = spec.slice(2)
  else if (spec.startsWith('.')) goc = join(dirname(tuTep), spec)
  else return null
  goc = normalize(goc).split('\\').join('/')
  for (const duoi of ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx']) {
    const p = goc + duoi
    if (existsSync(join(GOC, p)) && MA.test(p)) return p
  }
  return null
}

const boDem = new Map()
function baoDong(tep) {
  if (boDem.has(tep)) return boDem.get(tep)
  const da = new Set()
  const hang = [tep]
  while (hang.length) {
    const t = hang.pop()
    if (da.has(t)) continue
    da.add(t)
    let ma = ''
    try {
      ma = readFileSync(join(GOC, t), 'utf8')
    } catch {
      continue
    }
    for (const m of ma.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
      const p = giaiImport(t, m[1])
      if (p && !da.has(p)) hang.push(p)
    }
  }
  boDem.set(tep, da)
  return da
}

function chon(doi) {
  const tatCa = baiTrongCI()
  if (doi.some((t) => CHAY_HET.some((re) => re.test(t)))) {
    return { tsc: true, lint: true, bai: tatCa, lyDo: 'đổi cấu hình dựng → chạy hết' }
  }
  const coMa = doi.filter((t) => MA.test(t))
  const bai = tatCa.filter((b) => {
    const bd = baoDong(b)
    return coMa.some((t) => bd.has(t))
  })
  return {
    tsc: coMa.length > 0,
    lint: coMa.some((t) => /^(app|lib|components)\//.test(t)),
    bai,
    lyDo: coMa.length ? `${coMa.length} tệp mã đổi` : 'không có tệp mã đổi',
  }
}

function chayLenh(nhan, lenh, args) {
  process.stdout.write(`… ${nhan}\r`)
  const r = spawnSync(lenh, args, { encoding: 'utf8', shell: process.platform === 'win32' })
  const ra = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n')
  return { nhan, dat: r.status === 0, cuoi: ra.slice(-3).join(' | ').slice(0, 160) }
}

const doi = tepDaDoi()
const kq = chon(doi)
// LayoutProps / PageProps là kiểu Next sinh vào .next/types. Worktree mới chưa từng chạy next dev
// thì chưa có, tsc báo thiếu tên dù mã đúng — CI cũng phải sinh trước vì cùng lý do.
const canTypegen = kq.tsc && !existsSync(join(GOC, '.next/types'))
const viec = [
  ...(canTypegen ? [['next typegen', 'npx', ['next', 'typegen']]] : []),
  ...(kq.tsc ? [['tsc', 'npx', ['tsc', '--noEmit']]] : []),
  ...(kq.lint ? [['lint', 'node', ['scripts/dem-loi-lint.mjs']]] : []),
  ...kq.bai.map((b) => [b.replace(/^scripts\//, ''), 'npx', ['tsx', b]]),
]

console.log(`So với ${TU}: ${doi.length} tệp đổi (${kq.lyDo}).`)
if (doi.some((t) => /^(app|components)\//.test(t))) {
  console.log('Có đổi app/ hoặc components/: `npm run build` để CI lo, trừ khi đổi route / cấu hình trang.')
}
if (!viec.length) {
  console.log('Không có bài nào cần chạy.')
  process.exit(0)
}
if (!CHAY) {
  for (const [nhan, l, a] of viec) console.log(`  ${nhan.padEnd(28)} ${l} ${a.join(' ')}`)
  console.log('\nThêm --chay để chạy.')
  process.exit(0)
}

const bang = viec.map(([nhan, l, a]) => chayLenh(nhan, l, a))
console.log('')
for (const k of bang) console.log(`${k.dat ? 'ĐẠT ' : 'TRƯỢT'}  ${k.nhan.padEnd(28)} ${k.dat ? '' : k.cuoi}`)
const truot = bang.filter((k) => !k.dat).length
console.log(truot ? `\n${truot} bài trượt.` : '\nTất cả đạt.')
process.exit(truot ? 1 : 0)

