/**
 * Phân cấp lại tài liệu đã nạp — npx tsx scripts/phan-cap-kho.ts [thư-mục] [--ghi]
 *
 *   npx tsx scripts/phan-cap-kho.ts          chỉ IN ra những gì sẽ đổi, không ghi gì
 *   npx tsx scripts/phan-cap-kho.ts --ghi    ghi thật xuống database
 *
 * Đọc `manifest.json` trong thư mục sách, khớp theo tiêu đề, rồi đặt lại
 * `muc_tin_cay`, `he_phai`, `loai_nguon` cho từng tài liệu. Không đụng tới đoạn
 * hay vector: truy hồi đọc mức tin cậy từ bảng tài liệu qua phép join, nên đổi ở
 * đây là có hiệu lực ngay ở lượt hỏi sau, không cần nạp lại.
 *
 * Vì sao cần: cả 15 cuốn trong kho được nạp với cùng mức 'tham-khao' và hệ phái
 * 'chung', nên thứ bậc nguồn trong lib/rag/uu-tien-nguon.ts chưa bao giờ có tác
 * dụng. Mức tin cậy là quyết định của người hiểu tử vi, không phải của mã — script
 * này chỉ chép quyết định đó từ manifest vào kho.
 *
 * Mỗi dòng manifest:
 *   { "file": "toan-thu.md", "title": "...", "muc_tin_cay": "chuyen-gia-duyet",
 *     "he_phai": "nam-phai", "loai_nguon": "sach" }
 *
 * Mức tin cậy:
 *   cot-loi           quy tắc chuẩn Celes chọn theo (tài liệu do chuyên gia soạn)
 *   chuyen-gia-duyet  sách gốc, bản chuẩn, đã có chuyên gia đọc đối chiếu
 *   tham-khao         sách phổ thông, bản chép lại, sách chưa đối chiếu
 *   ho-tro            bài viết, ghi chép, bản quét chất lượng kém
 *
 * Script ghi vào database thật.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const THU_MUC_MAC_DINH = 'D:/Tài liệu tử vi/markdown';

const HOP_LE: Record<string, string[]> = {
  muc_tin_cay: ['cot-loi', 'chuyen-gia-duyet', 'tham-khao', 'ho-tro'],
  he_phai: ['chung', 'nam-phai', 'bac-phai'],
  loai_nguon: ['sach', 'ghi-chu-chuyen-gia', 'quy-tac', 'bai-viet', 'noi-bo'],
};

type Truong = 'muc_tin_cay' | 'he_phai' | 'loai_nguon';
const TRUONG: Truong[] = ['muc_tin_cay', 'he_phai', 'loai_nguon'];

interface HangManifest {
  file: string;
  title?: string;
  muc_tin_cay?: string;
  he_phai?: string;
  loai_nguon?: string;
}

async function main() {
  const ghi = process.argv.includes('--ghi');
  const thuMuc = process.argv.slice(2).find((x) => !x.startsWith('--')) ?? THU_MUC_MAC_DINH;

  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { ghiNhatKyQuanTri } = await import('../lib/rag/nhat-ky');
  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    console.log('DỪNG: chưa có SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let manifest: HangManifest[];
  try {
    manifest = JSON.parse(readFileSync(join(thuMuc, 'manifest.json'), 'utf-8'));
  } catch (e) {
    console.log(`DỪNG: không đọc được ${join(thuMuc, 'manifest.json')} — ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  // Soát cả manifest trước khi ghi dòng nào: gõ sai một giá trị mà ghi dở dang
  // thì kho nằm ở trạng thái nửa cũ nửa mới
  for (const h of manifest) {
    for (const t of TRUONG) {
      const v = h[t];
      if (v !== undefined && !HOP_LE[t].includes(v)) {
        console.log(`DỪNG: ${h.file} ghi ${t} = "${v}". Chỉ nhận: ${HOP_LE[t].join(', ')}.`);
        process.exit(1);
      }
    }
  }

  const { data: taiLieu, error } = await supabase
    .from('knowledge_documents')
    .select('id, tieu_de, muc_tin_cay, he_phai, loai_nguon');
  if (error) {
    console.log(`DỪNG: ${error.message}`);
    process.exit(1);
  }
  const theoTieuDe = new Map((taiLieu ?? []).map((d) => [String(d.tieu_de).toLowerCase(), d]));

  console.log(`\n${ghi ? 'GHI THẬT' : 'CHẠY THỬ — thêm --ghi để ghi'} · ${manifest.length} dòng manifest\n`);

  let doi = 0;
  let khongThay = 0;
  for (const h of manifest) {
    const tieuDe = h.title ?? h.file.replace(/\.md$/i, '');
    const d = theoTieuDe.get(tieuDe.toLowerCase());
    if (!d) {
      console.log(`  KHÔNG THẤY  ${tieuDe}`);
      khongThay += 1;
      continue;
    }

    const moi: Partial<Record<Truong, string>> = {};
    for (const t of TRUONG) {
      const v = h[t];
      if (v !== undefined && v !== d[t]) moi[t] = v;
    }
    if (!Object.keys(moi).length) continue;

    const moTa = Object.entries(moi)
      .map(([t, v]) => `${t}: ${d[t as Truong]} → ${v}`)
      .join(', ');
    console.log(`  ĐỔI  ${tieuDe} — ${moTa}`);
    doi += 1;

    if (ghi) {
      const { error: loi } = await supabase
        .from('knowledge_documents')
        .update({ ...moi, cap_nhat_luc: new Date().toISOString() })
        .eq('id', d.id);
      if (loi) {
        console.log(`        HỎNG: ${loi.message}`);
        process.exit(1);
      }
      await ghiNhatKyQuanTri('phan-cap-tai-lieu', 'knowledge_document', d.id, { email: 'scripts/phan-cap-kho.ts' }, {
        truoc: Object.fromEntries(Object.keys(moi).map((t) => [t, d[t as Truong]])),
        sau: moi,
      });
    }
  }

  console.log(`\n${doi} tài liệu ${ghi ? 'đã đổi' : 'sẽ đổi'} · ${khongThay} dòng manifest không khớp tài liệu nào\n`);
  process.exit(0);
}

main();
