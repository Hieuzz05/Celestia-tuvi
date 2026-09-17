/**
 * Nghiệm thu nạp một tài liệu trong một lần — npx tsx scripts/test-nap-mot-lan.ts [đường-dẫn-md]
 *
 * Chạy đúng đường đi mà giao diện chạy: pha A lưu đoạn, rồi lặp pha B cho tới
 * khi xong. Tốn quota embedding thật, và ghi vào database thật.
 *
 * Mặc định dùng tài liệu nhỏ nhất rồi XOÁ đi sau khi kiểm. Muốn nạp thật thì
 * truyền đường dẫn và thêm cờ --giu.
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const THU_MUC = 'D:/Tài liệu tử vi/markdown';
const MAC_DINH = `${THU_MUC}/Phú Tử Vi Lê Quý Đôn.md`;

async function main() {
  const doiSo = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  const giu = process.argv.includes('--giu');
  const tep = doiSo[0] ?? MAC_DINH;

  const { napTaiLieu, embedTiep } = await import('../lib/rag/nap-tai-lieu');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { catThanhDoan } = await import('../lib/ai/chunk');

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    console.log('DỪNG: chưa có SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let sai = 0;
  const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
    if (!ok) sai += 1;
    console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
  };

  const noiDungTho = readFileSync(tep, 'utf-8');
  const ten = basename(tep, '.md');
  console.log(`\n== ${ten} (${(noiDungTho.length / 1024).toFixed(0)} KB) ==\n`);

  // Frontmatter phải bị cắt trước khi cắt đoạn
  const coFrontmatter = noiDungTho.startsWith('---');
  console.log(`  tệp có frontmatter: ${coFrontmatter}`);

  console.log('\n-- PHA A: cắt đoạn và lưu, chưa sinh vector --');
  const t0 = Date.now();
  const nap = await napTaiLieu({
    tieuDe: `[NGHIỆM THU] ${ten}`,
    noiDung: noiDungTho,
    hePhai: 'chung',
    loaiNguon: 'sach',
    mucTinCay: 'tham-khao',
    phienBan: `nghiem-thu-${Date.now()}`,
  });
  console.log(`  ${nap.soDoan} đoạn, ${Date.now() - t0}ms`);
  kiem('Pha A dưới 20 giây', Date.now() - t0 < 20000, Date.now() - t0);

  const donDep = async () => {
    if (giu) return;
    await supabase.from('knowledge_documents').delete().eq('id', nap.documentId);
  };

  try {
    // Đối chiếu với chính catThanhDoan chạy trên bản đã bỏ frontmatter
    const sach = noiDungTho
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    kiem('Số đoạn khớp catThanhDoan trên bản đã làm sạch', nap.soDoan === catThanhDoan(sach).length, {
      nap: nap.soDoan,
      tinhLai: catThanhDoan(sach).length,
    });

    const { count: chuaCoVector } = await supabase
      .from('knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('version_id', nap.versionId)
      .is('embedding', null);
    kiem('Sau pha A, mọi đoạn đều chưa có vector', chuaCoVector === nap.soDoan, {
      chuaCo: chuaCoVector,
      tong: nap.soDoan,
    });

    const { data: ver1 } = await supabase
      .from('knowledge_document_versions')
      .select('trang_thai')
      .eq('id', nap.versionId)
      .single();
    kiem('Version đang ở "dang_xu_ly"', ver1?.trang_thai === 'dang_xu_ly', ver1?.trang_thai);

    console.log('\n-- PHA B: điền vector từng lượt --');
    let luot = 0;
    let lauNhat = 0;
    for (;;) {
      const t = Date.now();
      const td = await embedTiep(nap.versionId);
      const ms = Date.now() - t;
      lauNhat = Math.max(lauNhat, ms);
      luot += 1;
      console.log(
        `  lượt ${luot}: ${td.daXong}/${td.tong} đoạn, ${ms}ms` +
          (td.choGiay ? ` — chờ ${td.choGiay}s` : '')
      );
      if (td.xong) {
        if (td.canhBao?.length) for (const c of td.canhBao) console.log(`     cảnh báo: ${c}`);
        break;
      }
      if (td.hetNgay) {
        console.log('  DỪNG: đã cạn hạn mức embedding của cả ngày (1.000 đoạn/ngày ở gói miễn phí)');
        break;
      }
      if (luot > 40) {
        kiem('Không quá 40 lượt', false, luot);
        break;
      }
      // Hạn mức là nút thắt, không phải tốc độ — chờ đúng số giây được báo
      if (td.choGiay) await new Promise((r) => setTimeout(r, td.choGiay! * 1000));
    }
    kiem('Không lượt nào chạm 60 giây', lauNhat < 60000, `${lauNhat}ms`);

    console.log('\n-- PHA C: chốt --');
    const { count: conThieu } = await supabase
      .from('knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('version_id', nap.versionId)
      .is('embedding', null);
    kiem('Không còn đoạn nào thiếu vector', conThieu === 0, conThieu);

    const { data: ver2 } = await supabase
      .from('knowledge_document_versions')
      .select('trang_thai, so_chunk')
      .eq('id', nap.versionId)
      .single();
    kiem('Version chuyển sang "can_duyet"', ver2?.trang_thai === 'can_duyet', ver2?.trang_thai);

    // Liên kết thực thể: có, và không bị nhân đôi
    const { data: chunkIds } = await supabase
      .from('knowledge_chunks')
      .select('id')
      .eq('version_id', nap.versionId)
      .limit(1000);
    const ids = (chunkIds ?? []).map((c) => c.id);
    const { data: lienKet } = await supabase
      .from('chunk_entities')
      .select('chunk_id, entity_id')
      .in('chunk_id', ids.slice(0, 200));
    kiem('Có liên kết thực thể', (lienKet?.length ?? 0) > 0, lienKet?.length);
    const khoa = (lienKet ?? []).map((x) => `${x.chunk_id}|${x.entity_id}`);
    kiem('Không có liên kết trùng', new Set(khoa).size === khoa.length, {
      tong: khoa.length,
      rieng: new Set(khoa).size,
    });

    // Gọi lại pha chốt lần nữa — phải chạy được và không nhân đôi
    console.log('\n-- Gọi lại lượt cuối (kiểm tính chạy lại được) --');
    await embedTiep(nap.versionId);
    const { data: lienKet2 } = await supabase
      .from('chunk_entities')
      .select('chunk_id, entity_id')
      .in('chunk_id', ids.slice(0, 200));
    kiem('Gọi lại không làm liên kết nhân đôi', (lienKet2?.length ?? 0) === (lienKet?.length ?? 0), {
      truoc: lienKet?.length,
      sau: lienKet2?.length,
    });
  } finally {
    if (!giu) {
      console.log('\n-- DỌN DẸP --');
      await donDep();
      const { count } = await supabase
        .from('knowledge_documents')
        .select('id', { count: 'exact', head: true })
        .eq('id', nap.documentId);
      kiem('Đã xoá tài liệu nghiệm thu', (count ?? 0) === 0, count);
    } else {
      console.log(`\nGIỮ LẠI trong kho: ${nap.documentId}`);
    }
  }

  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} KIỂM TRA SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main();
