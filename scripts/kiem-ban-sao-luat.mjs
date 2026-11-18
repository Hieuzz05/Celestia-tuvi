#!/usr/bin/env node
/**
 * Máy canh bản sao luật cho Codex (CELES-64). Celes được làm bằng nhiều công cụ AI:
 *   - Claude đọc  .claude/skills/   và .claude/agents/*.md
 *   - Codex đọc   .agents/skills/   và .codex/agents/*.toml
 * Gốc là bản .claude. Bản Codex phải khớp từng chữ; lệch là đỏ. Trước 15/11 bản Codex là bản sao tay
 * ngày 17/10, 5/6 skill đã cũ và 10 chỗ trỏ tới thư mục không tồn tại ".Codex/skills/" (CELES-62).
 *
 *   node scripts/kiem-ban-sao-luat.mjs          # kiểm, offline (CI chạy)
 *   node scripts/kiem-ban-sao-luat.mjs --chep   # sửa bản .claude xong thì chạy tay để chép sang bản Codex
 *
 * Skill chép nguyên (đường dẫn `.claude/skills/...` bên trong là tệp có thật trong kho, Codex đọc được).
 * Agent đổi định dạng: frontmatter name/description + thân .md → name, description,
 * developer_instructions trong .toml. Trường tools/model của Claude không có bên Codex nên bỏ.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const GOC = process.cwd()
const CHEP = process.argv.includes('--chep')
const lf = (s) => s.replace(/\r\n?/g, '\n')
const loi = []

function cacTep(dir, goc = dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out.push(...cacTep(p, goc))
    else if (!/__pycache__|\.pyc$/.test(p)) out.push(relative(goc, p).replace(/\\/g, '/'))
  }
  return out.sort()
}

// ---------- skill: chép nguyên ----------
const SK_A = join(GOC, '.claude/skills')
const SK_B = join(GOC, '.agents/skills')
const tepA = cacTep(SK_A)
const tepB = new Set(cacTep(SK_B))
for (const f of tepA) {
  const a = lf(readFileSync(join(SK_A, f), 'utf8'))
  const b = tepB.has(f) ? lf(readFileSync(join(SK_B, f), 'utf8')) : null
  tepB.delete(f)
  if (a === b) continue
  if (CHEP) {
    mkdirSync(dirname(join(SK_B, f)), { recursive: true })
    writeFileSync(join(SK_B, f), a)
  } else loi.push(b === null ? `.agents/skills/${f}: thiếu (có bên .claude/skills)` : `.agents/skills/${f}: khác .claude/skills/${f}`)
}
for (const f of tepB) {
  if (CHEP) rmSync(join(SK_B, f))
  else loi.push(`.agents/skills/${f}: thừa (không có bên .claude/skills)`)
}

// ---------- agent: đổi định dạng ----------
export function tachMd(s) {
  const m = lf(s).match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/)
  if (!m) return null
  const fm = {}
  for (const d of m[1].split('\n')) {
    const k = d.match(/^([a-z_]+):\s*(.*)$/)
    if (k) fm[k[1]] = k[2].trim()
  }
  return { name: fm.name, description: fm.description, body: m[2].replace(/\s+$/, '') }
}

/** Đọc đúng ba khoá cần so. Hỗ trợ chuỗi '...' / "..." một dòng và '''...''' / """...""" nhiều dòng. */
export function docToml(s) {
  s = lf(s)
  const out = {}
  const esc = (x) =>
    x.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_, c) =>
      c[0] === 'u' || c[0] === 'U' ? String.fromCodePoint(parseInt(c.slice(1), 16)) : ({ n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' }[c] ?? c),
    )
  const re = /^([a-z_]+)\s*=\s*('''|"""|'|")/gm
  let m
  while ((m = re.exec(s))) {
    const q = m[2]
    let i = m.index + m[0].length
    if (q.length === 3 && s[i] === '\n') i++
    const j = s.indexOf(q, i)
    if (j < 0) break
    const raw = s.slice(i, j)
    out[m[1]] = q[0] === '"' ? lf(esc(raw)) : raw
    re.lastIndex = j + q.length
  }
  return out
}

export function vietToml({ name, description, body }) {
  const mot = (x) => (x.includes("'") ? JSON.stringify(x) : `'${x}'`)
  if (body.includes("'''")) throw new Error(`thân agent ${name} chứa ''' — không viết được chuỗi literal`)
  return `name = ${mot(name)}\ndescription = ${mot(description)}\ndeveloper_instructions = '''\n${body}'''\n`
}

const AG_A = join(GOC, '.claude/agents')
const AG_B = join(GOC, '.codex/agents')
const tenA = new Set()
for (const f of cacTep(AG_A).filter((x) => x.endsWith('.md') && !x.includes('/'))) {
  const md = tachMd(readFileSync(join(AG_A, f), 'utf8'))
  const ten = f.replace(/\.md$/, '')
  tenA.add(ten)
  if (!md) { loi.push(`.claude/agents/${f}: không đọc được frontmatter`); continue }
  const pB = join(AG_B, ten + '.toml')
  const tm = existsSync(pB) ? docToml(readFileSync(pB, 'utf8')) : null
  const khop = tm && tm.name === md.name && tm.description === md.description && (tm.developer_instructions || '').replace(/\s+$/, '') === md.body
  if (khop) continue
  if (CHEP) {
    mkdirSync(AG_B, { recursive: true })
    writeFileSync(pB, vietToml(md))
  } else loi.push(tm ? `.codex/agents/${ten}.toml: khác .claude/agents/${f}` : `.codex/agents/${ten}.toml: thiếu`)
}
for (const f of cacTep(AG_B).filter((x) => x.endsWith('.toml'))) {
  if (tenA.has(f.replace(/\.toml$/, ''))) continue
  if (CHEP) rmSync(join(AG_B, f))
  else loi.push(`.codex/agents/${f}: thừa (không có bên .claude/agents)`)
}

if (CHEP) {
  console.log('Đã chép bản .claude sang .agents/skills và .codex/agents. Chạy lại không cờ để kiểm.')
} else if (loi.length) {
  console.error(`✗ Bản luật cho Codex lệch bản .claude (${loi.length} chỗ):`)
  for (const l of loi) console.error('  - ' + l)
  console.error('Sửa ở bản .claude (gốc), rồi chạy: node scripts/kiem-ban-sao-luat.mjs --chep, và commit cả hai bên.')
  process.exit(1)
} else {
  console.log(`✓ Bản luật cho Codex khớp bản .claude (${tepA.length} tệp skill, ${tenA.size} agent).`)
}
