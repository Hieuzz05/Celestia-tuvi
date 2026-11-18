#!/usr/bin/env node
/**
 * Hook SessionStart (CELES-4) — lúc mở phiên và sau mỗi lần nén ngữ cảnh, in CHỈ những gì
 * AI dễ quên:
 *   1. Nhánh đang đứng chậm origin/main bao nhiêu commit, và luật (AGENTS.md, cach-lam.md,
 *      AI-PHOI-HOP.md, skill) có khác bản trên main không. Ngày 19/10 một phiên đọc luật cũ vì
 *      thư mục đứng ở nhánh cũ; luật có rồi mà vẫn lặp, nên cần máy canh.
 *   2. next / blocker / câu hỏi đang mở của task Vibe Board gắn với nhánh này.
 *
 * KHÔNG in lại luật: luật đã nạp qua CLAUDE.md, in thêm là hai bản luật trong ngữ cảnh.
 * Không bao giờ chặn phiên: lỗi gì cũng im lặng thoát 0. Không cần mạng: fetch hỏng thì dùng
 * origin/main đang có và nói rõ.
 *
 * Đọc thẳng data/tasks/*.json của Vibe Board (không pull) để mở phiên nhanh; con số có thể cũ
 * vài phút, AI vẫn phải chạy `T list` / `T show` theo luật.
 *
 * Chạy tay để thử: node .claude/hooks/mo-phien.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LUAT = ['AGENTS.md', 'CLAUDE.md', 'AI-PHOI-HOP.md', 'docs/bai-hoc/cach-lam.md', '.claude/skills', '.claude/agents']
const MO = new Set(['todo', 'doing', 'blocked', 'review'])

function git(args, timeout = 4000) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

/** Đọc task của Vibe Board từ đĩa. Trả [] khi máy chưa cài. */
export function docTask(goc) {
  const dir = [goc, 'D:/VibeDashboard', join(homedir(), 'VibeDashboard')]
    .filter(Boolean)
    .map((g) => join(g, 'data', 'tasks'))
    .find((d) => existsSync(d))
  if (!dir) return []
  const out = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    try {
      out.push(JSON.parse(readFileSync(join(dir, f), 'utf8')))
    } catch {
      /* tệp hỏng thì bỏ qua */
    }
  }
  return out
}

/** Hàm thuần: dựng lời nhắc từ dữ kiện đã thu. Trả '' khi không có gì đáng nói. */
export function taoLoiNhac({ nhanh, cham, luatLech, fetchHong, tasks, nen }) {
  const dong = []
  if (cham > 0) {
    dong.push(
      `⚠ Nhánh ${nhanh} chậm origin/main ${cham} commit.` +
        (luatLech.length ? ` Luật trên main đã khác bản đang đọc: ${luatLech.join(', ')}.` : '') +
        ' Gộp origin/main trước khi làm (git merge origin/main), rồi đọc lại phần luật vừa đổi.',
    )
  }
  if (fetchHong) dong.push('(Không kéo được origin; số trên tính theo origin/main đã có trên máy.)')
  const cua = tasks.filter((t) => MO.has(t.status) && nhanh && t.branch === nhanh)
  for (const t of cua.slice(0, 3)) {
    const p = [`Task ${t.id} [${t.status}] ${t.title}`]
    if (t.next) p.push(`  next: ${t.next}`)
    if (t.blocker) p.push(`  chờ: ${t.blocker}`)
    if (t.decision) p.push(`  câu hỏi đang mở (chưa có đáp án, đừng tự quyết): ${String(t.decision).slice(0, 400)}`)
    const qd = (t.decisions || []).slice(-2)
    for (const d of qd) p.push(`  đã quyết ${String(d.at).slice(0, 10)}: ${String(d.a).slice(0, 200)}`)
    dong.push(p.join('\n'))
  }
  if (!dong.length) return ''
  const dau = nen ? 'Nhắc lại sau khi nén ngữ cảnh (Vibe Board, git):' : 'Lúc mở phiên (Vibe Board, git):'
  return [dau, ...dong].join('\n')
}

function main() {
  let vao = {}
  try {
    vao = JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    /* chạy tay thì không có stdin */
  }
  const nhanh = git(['branch', '--show-current']) || ''
  const fetchHong = git(['fetch', '-q', 'origin', 'main'], 8000) === null
  const cham = Number(git(['rev-list', '--count', 'HEAD..origin/main']) || 0)
  let luatLech = []
  if (cham > 0) {
    const ds = git(['diff', '--name-only', 'HEAD...origin/main', '--', ...LUAT]) || ''
    const hang = (f) => LUAT.findIndex((l) => f === l || f.startsWith(l + '/'))
    luatLech = ds.split('\n').filter(Boolean).sort((x, y) => hang(x) - hang(y)).slice(0, 6)
  }
  const s = taoLoiNhac({ nhanh, cham, luatLech, fetchHong, tasks: docTask(process.env.VIBE_BOARD_DIR), nen: vao.source === 'compact' })
  if (s) process.stdout.write(s + '\n')
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  try {
    main()
  } catch {
    /* không bao giờ chặn phiên */
  }
  process.exit(0)
}
