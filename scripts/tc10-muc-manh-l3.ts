/**
 * TC-10 (đợt 1, K1 CELES-26): in vài mục thư viện MỨC MẠNH, CHƯA DUYỆT, khớp sao của lá L3 — đúng những
 * mục K1 đang chặn khỏi prompt. Chủ dự án đọc câu sách rồi mở chủ đề tương ứng của L3 trên Preview, xem
 * bài có nói nặng hơn sách không.
 *
 * CHỈ ĐỌC: không ghi DB, không gọi model. Chạy từ thư mục repo:
 *   npx tsx scripts/tc10-muc-manh-l3.ts --env "D:/SAPP BA/tuvi-ai/.env.local" [--so 3]
 *
 * Khớp bằng chính đường chạy thật (docThuVien + dungKhoiThuVien), nên mục in ra là mục thật sự khớp
 * câu của chủ đề đó, không phải chỉ trùng tên sao.
 */
import { readFileSync } from 'node:fs';

const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));
for (const d of readFileSync(thamSo('--env')[0] ?? '.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}
const SO = Number(thamSo('--so')[0] ?? 3);
const NAM_XEM = 2026;

async function main() {
  // Nạp SAU khi có biến môi trường: lib/supabase/config đọc URL lúc import
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  const { docMetaTaiLieu } = await import('../lib/rag/tai-lieu-meta');
  const { dungKhoiThuVien } = await import('../lib/rag/thu-vien/cho-prompt');
  const { CAU_HOI_V3, CHU_DE_V3 } = await import('../lib/rag/v3/khung');
  const { dungDuKien } = await import('../lib/rag/v3/du-kien');
  const { THU_VIEN_THEO_CHU_DE } = await import('../lib/rag/v3/xu-ly');

  const laSo = lapLaSo({ ngay: 7, thang: 11, nam: 1995, gio: 14, gioiTinh: 'nam' });
  const meta = await docMetaTaiLieu();
  type Dong = { chuDe: string; cau: string; cung: string; id: string; y: string; chieu: string; trich: string; sach: string };
  const theoChuDe = new Map<string, Dong[]>();
  let tongKho = 0;

  for (const [nhom, tv] of Object.entries(THU_VIEN_THEO_CHU_DE)) {
    const kho = await docThuVien(nhom, tv.dot);
    tongKho += kho.length;
    const tenCD = CHU_DE_V3.find((c) => c.id === nhom)?.ten ?? nhom;
    const ds: Dong[] = [];
    for (const id of tv.cau) {
      const q = CAU_HOI_V3.find((c) => c.id === id);
      if (!q) continue;
      const cungChinh = q.loai === 'chuyen-sau' ? (q.cungChinh ?? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh) : undefined;
      const kq = dungKhoiThuVien({ laSo, duKien: dungDuKien(laSo, q, NAM_XEM), thuVien: kho, cungChinh, meta });
      // Tự lọc trên khopHet, không dựa boChuaDuyet: cờ cho mục mạnh đang bật thì boChuaDuyet rỗng
      for (const k of kq.khopHet) {
        if (k.muc.nhan.muc !== 'manh' || k.muc.duyet === 'da-duyet' || ds.some((d) => d.id === k.muc.id)) continue;
        const cc = k.muc.canCu[0];
        ds.push({
          chuDe: tenCD, cau: `${q.id}: ${q.cauHoi}`, cung: k.cung, id: k.muc.id, y: k.muc.y, chieu: k.muc.nhan.chieu,
          trich: (cc?.trich ?? '').replace(/\s+/g, ' ').slice(0, 260),
          sach: cc?.documentId ?? '',
        });
      }
    }
    if (ds.length) theoChuDe.set(nhom, ds);
  }

  const tong = [...theoChuDe.values()].reduce((s, d) => s + d.length, 0);
  console.log(`Lá L3 (7/11/1995 14h nam). Kho đọc được: ${tongKho} mục ở ${Object.keys(THU_VIEN_THEO_CHU_DE).length} chủ đề.`);
  console.log(`Mục MẠNH chưa duyệt khớp L3 (K1 đang chặn): ${tong}, ở ${theoChuDe.size} chủ đề.\n`);
  if (!tong) return console.log('Không có mục nào: TC-10 ghi "không áp dụng cho L3".');

  // Lấy xoay vòng qua các chủ đề để 3 mục không dồn vào một chủ đề
  const chon: Dong[] = [];
  for (let i = 0; chon.length < SO && [...theoChuDe.values()].some((d) => d.length > i); i++)
    for (const d of theoChuDe.values()) if (d[i] && chon.length < SO) chon.push(d[i]);
  chon.forEach((d, i) => {
    console.log(`#${i + 1}  Mở chủ đề: ${d.chuDe}  ·  câu ${d.cau}`);
    console.log(`    Cung: ${d.cung}  ·  chiều: ${d.chieu}  ·  mã mục: ${d.id}`);
    console.log(`    Ý mục: ${d.y}`);
    console.log(`    Câu sách (tài liệu ${d.sach}): "${d.trich}${d.trich.length >= 260 ? '…' : ''}"\n`);
  });
}

main().catch((e) => {
  console.error('Lỗi:', e instanceof Error ? e.message : e);
  process.exit(1);
});
