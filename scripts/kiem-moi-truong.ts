/**
 * Bác sĩ môi trường — npx tsx scripts/kiem-moi-truong.ts
 *
 * Chạy đầu tiên khi dựng Celestia trên một máy mới, và mỗi khi thấy một thứ
 * "đáng lẽ phải chạy" mà không chạy.
 *
 * Trả lời đúng ba câu hỏi hay làm mất thời gian nhất:
 *   1. Biến môi trường nào còn thiếu?
 *   2. Bảng nào trong Supabase chưa được tạo — tức file SQL nào chưa chạy?
 *   3. Máy chủ production đang chạy commit nào, có khớp với máy này không?
 *
 * Chỉ ĐỌC. Không tạo bảng, không sửa gì, không gọi model.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

/** Biến bắt buộc mới chạy được, và biến chỉ cần cho một tính năng */
const BAT_BUOC = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const CAN_MOT_TRONG = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY'];
const TUY_CHON: Record<string, string> = {
  CONFIG_SECRET: 'quản trị model trong /admin/models (mã hoá API key lưu ở database)',
  CRON_SECRET: 'tuyến cron',
  PAYOS_CLIENT_ID: 'thanh toán payOS',
  PAYOS_API_KEY: 'thanh toán payOS',
  PAYOS_CHECKSUM_KEY: 'thanh toán payOS',
};

/** Bảng → file SQL đã tạo ra nó. Thiếu bảng nghĩa là file đó chưa chạy. */
const BANG_THEO_TEP: Record<string, string> = {
  profiles: 'supabase/schema.sql',
  charts: 'supabase/schema.sql',
  readings: 'supabase/schema.sql',
  chat_messages: 'supabase/schema.sql',
  knowledge_documents: 'supabase/schema-rag.sql',
  knowledge_document_versions: 'supabase/schema-rag.sql',
  knowledge_chunks: 'supabase/schema-rag.sql',
  knowledge_entities: 'supabase/schema-rag-v2.sql',
  chunk_entities: 'supabase/schema-rag-v2.sql',
  retrieval_runs: 'supabase/schema-rag-v2.sql',
  retrieval_results: 'supabase/schema-rag-v2.sql',
  ai_requests: 'supabase/schema-rag-v2.sql',
  admin_audit_log: 'supabase/schema-rag-v2.sql',
  eval_datasets: 'supabase/schema-rag-v2.sql',
  eval_cases: 'supabase/schema-rag-v2.sql',
  eval_runs: 'supabase/schema-rag-v2.sql',
  user_entitlements: 'supabase/schema-support.sql',
  support_payments: 'supabase/schema-support.sql',
  entitlement_grants: 'supabase/schema-support.sql',
  usage_events: 'supabase/schema-support.sql',
  ai_usage_logs: 'supabase/schema-support.sql',
  ai_model_configs: 'supabase/schema-ai-models.sql',
  noi_dung_ai: 'supabase/schema-noi-dung-ai.sql',
};

/**
 * Hàm SQL → file tạo ra nó, kèm ĐÚNG tham số để gọi thử.
 *
 * Gọi rỗng không dùng được: PostgREST trả cùng một lỗi PGRST202 cho cả hàm có
 * thật lẫn hàm không tồn tại, nên bản đầu báo thiếu cả những hàm đang chạy tốt
 * trên production. Phải gọi đúng chữ ký mới phân biệt được.
 *
 * Tham số cố ý vô hại: vector toàn số không, chuỗi rỗng, uuid rỗng. Mục đích là
 * xem hàm có tồn tại không, không phải lấy kết quả.
 */
const HAM_THEO_TEP: { ten: string; tep: string; tham: Record<string, unknown> }[] = [
  {
    ten: 'tim_kien_thuc',
    tep: 'supabase/schema-rag-v3.sql',
    tham: {
      vector_truy_van: new Array(768).fill(0),
      so_luong: 1,
      nguong_toi_thieu: 0.99,
      loc_he_phai: null,
    },
  },
  {
    ten: 'tim_kien_thuc_vector',
    tep: 'supabase/schema-rag-v3.sql',
    tham: {
      vector_truy_van: new Array(768).fill(0),
      so_luong: 1,
      nguong_toi_thieu: 0.99,
      loc_he_phai: null,
    },
  },
  { ten: 'tsquery_hoac', tep: 'supabase/va-rag-tu-khoa.sql', tham: { cau: 'tu vi' } },
  {
    ten: 'tim_kien_thuc_tu_khoa',
    tep: 'supabase/va-rag-tu-khoa.sql',
    tham: { cau_truy_van: 'tu vi', so_luong: 1, loc_he_phai: null, loc_thuc_the: null },
  },
  {
    ten: 'tim_kien_thuc_tu_khoa_cum',
    tep: 'supabase/va-rag-chat-luong.sql',
    tham: { cau_tu_le: 'tu', cum_tu: ['Tử Vi'], so_luong: 1, loc_he_phai: null, loc_thuc_the: null },
  },
  {
    ten: 'xoa_lien_ket_thuc_the',
    tep: 'supabase/schema-rag-v3.sql',
    tham: { p_version_id: '00000000-0000-0000-0000-000000000000' },
  },
];

let sai = 0;
let canhBao = 0;
const bao = (ok: boolean, ten: string, them = '') => {
  if (!ok) sai += 1;
  console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${them ? ` — ${them}` : ''}`);
};
const nhac = (ten: string, vi: string) => {
  canhBao += 1;
  console.log(`  --   ${ten} chưa đặt — ${vi} sẽ không chạy`);
};

async function main() {
  console.log('\n=== 1. BIẾN MÔI TRƯỜNG ===\n');
  for (const k of BAT_BUOC) bao(Boolean(process.env[k]), k);
  const coModel = CAN_MOT_TRONG.filter((k) => process.env[k]);
  bao(coModel.length > 0, 'Có ít nhất một API key model', coModel.join(', ') || 'chưa có key nào');
  for (const [k, vi] of Object.entries(TUY_CHON)) if (!process.env[k]) nhac(k, vi);

  const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) {
    console.log('\nThiếu thông tin Supabase nên dừng ở đây.\n');
    process.exit(1);
  }

  console.log('\n=== 2. SCHEMA SUPABASE ===\n');
  const thieuTep = new Set<string>();

  for (const [bang, tep] of Object.entries(BANG_THEO_TEP)) {
    const r = await fetch(`${U}/rest/v1/${bang}?select=*&limit=0`, {
      headers: { apikey: K, Authorization: `Bearer ${K}` },
    });
    const co = r.ok;
    if (!co) thieuTep.add(tep);
    bao(co, `bảng ${bang}`, co ? '' : `cần chạy ${tep}`);
  }

  for (const h of HAM_THEO_TEP) {
    const r = await fetch(`${U}/rest/v1/rpc/${h.ten}`, {
      method: 'POST',
      headers: { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(h.tham),
    });
    const than = await r.text();
    // Gọi đúng chữ ký: hàm có thật thì hoặc chạy được, hoặc lỗi vì dữ liệu —
    // chỉ PGRST202 mới thật sự nghĩa là không tìm thấy hàm.
    const co = !than.includes('PGRST202');
    if (!co) thieuTep.add(h.tep);
    bao(co, `hàm ${h.ten}`, co ? '' : `cần chạy ${h.tep}`);
  }

  if (thieuTep.size) {
    console.log('\n  >> Mở Supabase > SQL Editor và chạy các file sau, theo đúng thứ tự:');
    for (const t of thieuTep) console.log(`     ${t}`);
  }

  console.log('\n=== 3. MÁY CHỦ ĐANG CHẠY BẢN NÀO ===\n');
  let cucBo = '(không đọc được)';
  try {
    cucBo = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    /* không phải kho git thì thôi */
  }
  try {
    const r = await fetch('https://celestia-tuvi.vercel.app/api/phien-ban');
    const d = (await r.json()) as { commit?: string };
    console.log(`  máy này : ${cucBo}`);
    console.log(`  máy chủ : ${d.commit}`);
    bao(
      Boolean(d.commit) && d.commit === cucBo,
      'Máy chủ khớp với bản đang có ở máy này',
      d.commit === cucBo ? '' : 'khác nhau là bình thường nếu bạn vừa sửa mà chưa đẩy, hoặc Vercel đang dựng'
    );
  } catch {
    bao(false, 'Gọi được /api/phien-ban của production');
  }

  console.log(
    sai === 0
      ? `\nSẴN SÀNG.${canhBao ? ` ${canhBao} tính năng phụ chưa bật.` : ''}\n`
      : `\n${sai} MỤC CẦN XỬ LÝ trước khi chạy.\n`
  );
  process.exit(sai === 0 ? 0 : 1);
}

main();
