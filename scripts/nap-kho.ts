/**
 * Nạp cả kho tri thức bằng một lệnh — npx tsx scripts/nap-kho.ts [đường-dẫn] [--lai]
 *
 *   npx tsx scripts/nap-kho.ts                       nạp cả thư mục mặc định
 *   npx tsx scripts/nap-kho.ts "D:/duong/dan/sach.md"  nạp đúng một tệp
 *   npx tsx scripts/nap-kho.ts --lai                 nạp lại cả tài liệu đã có
 *
 * MỖI TỆP LÀ MỘT TÀI LIỆU. Không chia nhỏ, không cắt tay.
 *
 * Trước đây phải chia tay mỗi cuốn thành sáu bảy mảnh rồi dán từng mảnh vào màn
 * quản trị. Việc đó không bao giờ cần thiết: pha lưu đoạn xử được cả cuốn trong
 * một lượt. Thứ thật sự chặn là hạn mức embedding của gói Gemini miễn phí —
 * 1.000 đoạn mỗi ngày — nên người vận hành tưởng tệp quá lớn, trong khi vấn đề
 * nằm ở chỗ khác hẳn.
 *
 * Đặt `EMBEDDING_PROVIDER=openai` là hết trần ngày. Đo được: 120 đoạn trong 1,8
 * giây, giá 0,02 đô la cho một triệu token.
 *
 * Script ghi vào database thật và tiêu quota thật.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const THU_MUC_MAC_DINH = 'D:/Tài liệu tử vi/markdown';

interface HangManifest {
  file: string;
  title?: string;
  author?: string;
}

function docManifest(thuMuc: string): Map<string, HangManifest> {
  try {
    const tho = JSON.parse(readFileSync(join(thuMuc, 'manifest.json'), 'utf-8')) as HangManifest[];
    return new Map(tho.map((h) => [h.file, h]));
  } catch {
    return new Map();
  }
}

async function main() {
  const doiSo = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  const lai = process.argv.includes('--lai');
  const duong = doiSo[0] ?? THU_MUC_MAC_DINH;

  const { napTaiLieu, embedTiep } = await import('../lib/rag/nap-tai-lieu');
  const { TEN_MODEL_EMBEDDING, NHA_CUNG_CAP_EMBEDDING } = await import('../lib/ai/embedding');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    console.log('DỪNG: chưa có SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const laThuMuc = statSync(duong).isDirectory();
  const thuMuc = laThuMuc ? duong : '';
  const tep = laThuMuc
    ? readdirSync(duong)
        .filter((f) => extname(f).toLowerCase() === '.md' && !f.startsWith('_'))
        .sort()
        .map((f) => join(duong, f))
    : [duong];

  const manifest = laThuMuc ? docManifest(thuMuc) : new Map<string, HangManifest>();

  console.log(`\nModel embedding: ${TEN_MODEL_EMBEDDING}`);
  if (NHA_CUNG_CAP_EMBEDDING === 'gemini') {
    console.log('LƯU Ý: gói Gemini miễn phí chỉ cho 1.000 đoạn mỗi ngày.');
    console.log('       Đặt EMBEDDING_PROVIDER=openai trong .env.local là hết trần ngày.');
  }
  console.log(`Sẽ nạp ${tep.length} tài liệu từ ${duong}\n`);

  // Tài liệu đã có trong kho, đối chiếu theo tiêu đề
  const { data: daCo } = await supabase.from('knowledge_documents').select('id, tieu_de');
  const theoTieuDe = new Map((daCo ?? []).map((d) => [String(d.tieu_de).toLowerCase(), d.id]));

  let xong = 0;
  let boQua = 0;
  let hong = 0;

  for (const t of tep) {
    const ten = basename(t, '.md');
    const hang = manifest.get(basename(t));
    const tieuDe = hang?.title ?? ten;

    if (theoTieuDe.has(tieuDe.toLowerCase()) && !lai) {
      console.log(`  BỎ QUA  ${tieuDe} — đã có trong kho (dùng --lai để nạp lại)`);
      boQua += 1;
      continue;
    }

    const noiDung = readFileSync(t, 'utf-8');
    const kb = (noiDung.length / 1024).toFixed(0);
    process.stdout.write(`  ${tieuDe} (${kb} KB) ... `);

    try {
      const nap = await napTaiLieu({
        tieuDe,
        noiDung,
        hePhai: 'chung',
        loaiNguon: 'sach',
        mucTinCay: 'tham-khao',
        phienBan: new Date().toISOString().slice(0, 10),
        tacGia: hang?.author,
        tenTep: basename(t),
        documentId: theoTieuDe.get(tieuDe.toLowerCase()),
      });
      process.stdout.write(`${nap.soDoan} đoạn, đang sinh vector `);

      const batDau = Date.now();
      for (;;) {
        const td = await embedTiep(nap.versionId);
        process.stdout.write(`\r  ${tieuDe} (${kb} KB) ... ${nap.soDoan} đoạn, vector ${td.daXong}/${td.tong}   `);

        if (td.xong) {
          const giay = ((Date.now() - batDau) / 1000).toFixed(0);
          console.log(`\r  XONG    ${tieuDe} — ${nap.soDoan} đoạn, ${giay}s                    `);
          if (td.canhBao?.length) for (const c of td.canhBao) console.log(`            cảnh báo: ${c}`);
          xong += 1;
          break;
        }
        if (td.hetNgay) {
          console.log(`\n  DỪNG HẲN: cạn hạn mức embedding của cả ngày ở "${tieuDe}".`);
          console.log('  Đặt EMBEDDING_PROVIDER=openai rồi chạy lại — phần đã làm được giữ nguyên.');
          process.exit(1);
        }
        if (td.choGiay) await new Promise((r) => setTimeout(r, td.choGiay! * 1000));
      }
    } catch (e) {
      console.log(`\r  HỎNG    ${tieuDe} — ${e instanceof Error ? e.message : e}`);
      hong += 1;
    }
  }

  console.log(`\nXong ${xong} · bỏ qua ${boQua} · hỏng ${hong}`);
  console.log('Tài liệu nạp xong nằm ở trạng thái "cần duyệt". Vào /admin/knowledge để xuất bản.\n');
  process.exit(hong === 0 ? 0 : 1);
}

main();
