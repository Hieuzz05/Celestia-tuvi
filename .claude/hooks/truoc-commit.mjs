#!/usr/bin/env node
/**
 * Hook PreToolUse — chặn `git commit` khi thay đổi chạm sản phẩm mà
 * PRODUCT-BACKLOG.xlsx không được cập nhật trong cùng commit.
 *
 * Luật gốc (AGENTS.md): "nếu commit này đổi một tính năng, đổi một luồng logic,
 * hay thêm một luật bất biến mới, thì cập nhật PRODUCT-BACKLOG.xlsx TRONG CÙNG
 * commit đó." Để việc này thành "nhớ thì làm" là hai tuần sau tệp đó mô tả một
 * sản phẩm không còn tồn tại.
 *
 * Viết bằng Node exec-form thay vì shell script vì repo nằm ở đường dẫn có dấu
 * cách (`D:\SAPP BA\...`) và máy Windows không chắc có Git Bash hay jq.
 *
 * Quy ước thoát: 0 = cho qua, 2 = chặn (stderr là lời giải thích gửi cho AI).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Vùng mã mà thay đổi trong đó được coi là chạm sản phẩm. */
const VUNG_SAN_PHAM = [
  /^lib\//,
  /^app\//,
  /^components\//,
  /^apps\/celes-app\/(app|components|lib)\//,
  /^supabase\//,
]

/** Vùng được miễn: công cụ, tài liệu, tệp tạm — đổi ở đây không cần backlog. */
const VUNG_MIEN = [
  /^\.claude\//,
  /^scripts\/tam-/,
  /^docs\//,
  /\.md$/,
  /^\.github\//,
  /^package(-lock)?\.json$/,
]

const BACKLOG = 'PRODUCT-BACKLOG.xlsx'

function doc(stdin) {
  try {
    return JSON.parse(stdin)
  } catch {
    return null
  }
}

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function main() {
  let raw = ''
  try {
    raw = readFileSync(0, 'utf8')
  } catch {
    process.exit(0)
  }

  const input = doc(raw)
  if (!input) process.exit(0)

  const lenh = input?.tool_input?.command ?? ''
  // Chỉ quan tâm git commit. `git commit --amend` cũng tính.
  if (!/(^|[;&|]\s*)git\s+commit\b/.test(lenh)) process.exit(0)

  // Bỏ qua khi commit này chính là commit sửa backlog bằng tay.
  const staged = git('diff', '--cached', '--name-only')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  if (staged.length === 0) process.exit(0)

  const coBacklog = staged.some((f) => f.includes(BACKLOG))
  if (coBacklog) process.exit(0)

  const chamSanPham = staged.filter(
    (f) => VUNG_SAN_PHAM.some((r) => r.test(f)) && !VUNG_MIEN.some((r) => r.test(f)),
  )

  if (chamSanPham.length === 0) process.exit(0)

  process.stderr.write(
    [
      `CHẶN COMMIT — ${BACKLOG} chưa được cập nhật.`,
      '',
      'Commit này chạm vùng sản phẩm:',
      ...chamSanPham.slice(0, 12).map((f) => `  - ${f}`),
      chamSanPham.length > 12 ? `  … và ${chamSanPham.length - 12} tệp nữa` : '',
      '',
      'Luật AGENTS.md: đổi tính năng / đổi luồng logic / thêm luật bất biến thì',
      `phải cập nhật ${BACKLOG} TRONG CÙNG commit, đủ ba sheet:`,
      '  Backlog         — cập nhật cả hai cột `Cập nhật` và `Commit`',
      '  Logic chi tiết  — Backlog nói CÓ GÌ, Logic nói CHẠY THẾ NÀO',
      '  Nhật ký thay đổi — luôn thêm một dòng, cột `Vì sao` là quan trọng nhất',
      '',
      'Sửa .xlsx bằng openpyxl, đừng mở bằng tay.',
      '',
      'Nếu commit này THẬT SỰ không đổi tính năng hay logic (ví dụ chỉ sửa chính',
      'tả, chỉ thêm test), hãy nói rõ lý do với chủ dự án và xin xác nhận trước',
      'khi bỏ qua. Đừng tự quyết.',
    ]
      .filter((d) => d !== '')
      .join('\n') + '\n',
  )
  process.exit(2)
}

main()
