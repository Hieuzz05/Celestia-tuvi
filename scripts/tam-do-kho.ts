/**
 * Tạm — dò kho tri thức: có bao nhiêu tài liệu đã xuất bản, và truy hồi trả gì
 * cho vài truy vấn điển hình của luồng v3 (sao + cung + chủ đề).
 *   npx tsx scripts/tam-do-kho.ts
 */
import { readFileSync } from 'node:fs';
for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

async function main() {
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { truyHoi } = await import('../lib/rag/truy-hoi');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const sb = taoSupabaseAdmin()!;
  const { data: docs } = await sb.from('knowledge_documents').select('id,tieu_de,he_phai,muc_tin_cay').limit(200);
  console.log('Tài liệu:', docs?.length);
  for (const d of docs ?? []) console.log('  -', (d as Record<string, unknown>).tieu_de, '|', (d as Record<string, unknown>).he_phai, '|', (d as Record<string, unknown>).muc_tin_cay);
  const { data: vers } = await sb.from('knowledge_versions').select('id,document_id,trang_thai').limit(500);
  const dem: Record<string, number> = {};
  for (const v of vers ?? []) dem[(v as Record<string, string>).trang_thai] = (dem[(v as Record<string, string>).trang_thai] ?? 0) + 1;
  console.log('Phiên bản theo trạng thái:', dem);
  const { count } = await sb.from('knowledge_chunks').select('*', { count: 'exact', head: true });
  console.log('Tổng chunk:', count);

  const Q = [
    'Vũ Khúc Thiên Tướng cung Quan Lộc nghề nghiệp',
    'Liêm Trinh Thiên Phủ cung Mệnh tính cách',
    'Thiên Cơ cung Tật Ách',
    'Tham Lang hãm Hỏa Tinh Linh Tinh cung Phúc Đức',
    'Phá Quân cung Phu Thê hôn nhân',
    'Tử Vi Triệt cung Tài Bạch tiền bạc',
    'Thiên Đồng Cự Môn Hóa Kỵ Địa Không cung Điền Trạch nhà cửa',
    'Thái Dương Thiên Lương Hóa Lộc cung Nô Bộc',
    'Tử Tức vô chính diệu Đà La Triệt con cái',
    'Đại vận đi qua cung Phúc Đức',
  ];
  for (const q of Q) {
    const kq = await truyHoi({ truyVan: q, truyVanTuKhoa: q, thucThe: nhanDangThucThe(q) }, { soCuoi: 5 });
    console.log(`\n### ${q}  (ứng viên ${kq.ungVien.length}, chọn ${kq.daChon.length}, ${kq.doTreMs}ms, khoTrong=${kq.khoTrong})`);
    for (const d of kq.daChon) {
      console.log(`  [${d.tieuDe} · ${d.duongDeMuc ?? ''}] v=${d.hangVector ?? '-'} k=${d.hangTuKhoa ?? '-'}`);
      console.log('    ' + d.noiDung.replace(/\s+/g, ' ').slice(0, 260));
    }
  }
}
main();
