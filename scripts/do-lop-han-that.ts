/**
 * Đo lớp vận hạn trên MODEL THẬT — bật cờ so với tắt cờ, cùng câu, cùng lá số.
 *
 *   npx tsx scripts/do-lop-han-that.ts [--la-so 2] [--xuat <tệp.json>] [--env <tệp env>]
 *
 * Mỗi câu chạy hai lượt liền nhau (tắt rồi bật) để hai bên gặp cùng trạng thái model.
 * Đếm số lượt gọi model của từng lượt chat bằng cách đếm request tới nhà cung cấp:
 * lượt chính là 1 (2 nếu JSON gãy phải gọi lại), phần dư là lớp sửa câu. `van` rỗng là
 * lượt hỏng — người dùng thấy báo lỗi và được hoàn lượt.
 *
 * GỌI MODEL THẬT. Không nằm trong CI.
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Worktree không có .env.local: --env <đường dẫn> trỏ về tệp của thư mục chính
const tepEnv = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : '.env.local';
for (const d of readFileSync(tepEnv, 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const CAU = [
  'Năm nay công việc của tôi thế nào?',
  'Năm 2027 tài chính của tôi ra sao?',
  'Có nên đổi việc không?',
  'Năm nay có nên mua nhà không?',
  'Khi nào tôi lập gia đình?',
  'Đại vận này sức khoẻ cần lưu ý gì?',
  'Tháng sau tình cảm của tôi thế nào?',
  'Năm nay tôi có nhảy việc không?',
  'Sắp tới có nên đầu tư không?',
  'Năm nay bố mẹ tôi sức khoẻ thế nào?',
  'Tính cách tôi thế nào?',
  'Hóa Kỵ ở cung Quan Lộc năm nay ảnh hưởng gì?',
];

const tham = (ten: string) => {
  const i = process.argv.indexOf(ten);
  return i > 0 ? process.argv[i + 1] : undefined;
};

let demGoi = 0;
const fetchGoc = globalThis.fetch;
globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
  const u = String(url instanceof Request ? url.url : url);
  if (!/supabase|embeddings|embedContent/.test(u)) demGoi++;
  return fetchGoc(url, init);
}) as typeof fetch;

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { LA_SO_DO } = await import('../lib/rag/bo-vang-quyet-dinh');
  const { DEM_SUA, datLaiDemSua } = await import('../lib/rag/sua-chua');

  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();
  const soLaSo = Number(tham('--la-so') ?? 2);
  const ra: unknown[] = [];

  for (const vaoLaSo of LA_SO_DO.slice(0, soLaSo)) {
    const laSo = lapLaSo(vaoLaSo);
    const chiCau = tham('--cau')?.split(',').map(Number);
    const chiChe = tham('--che');
    for (const cauHoi of CAU.filter((_, i) => !chiCau || chiCau.includes(i))) {
      for (const che of (['tat', 'bat'] as const).filter((c) => !chiChe || c === chiChe)) {
        process.env.CELES_LOP_HAN = che === 'bat' ? '1' : '0';
        demGoi = 0;
        datLaiDemSua();
        const t0 = Date.now();
        let kq: Awaited<ReturnType<typeof traLoiCoCanCu>> | null = null;
        let loi: string | null = null;
        try {
          kq = await traLoiCoCanCu({ laSo, cauHoi, namXem, thangXem, ghiNhatKy: false, dungModelPhanLoai: false });
        } catch (e) {
          loi = e instanceof Error ? e.message : String(e);
        }
        const dong = {
          laSo: `${vaoLaSo.ngay}/${vaoLaSo.thang}/${vaoLaSo.nam}`,
          cauHoi,
          che,
          rong: !kq?.van,
          loi,
          soGoi: demGoi,
          msTong: Date.now() - t0,
          model: kq?.model ?? null,
          khoTrong: kq?.khoTrong ?? null,
          lopHan: kq?.goi?.lopHan ?? [],
          sachNguon: [...new Set((kq?.goi?.bangChung ?? []).map((d) => d.tieuDe))],
          cauSua: DEM_SUA.tiengLong.soCauPham,
          luotSua: DEM_SUA.tiengLong.soLuotGoi,
          ngonNguDat: kq?.ngonNgu?.dat ?? null,
          van: kq?.van ?? '',
        };
        ra.push(dong);
        console.log(`${che.padEnd(3)} | ${dong.rong ? 'RỖNG' : 'ok  '} | gọi ${dong.soGoi} | sửa ${dong.cauSua} câu | ${(dong.msTong / 1000).toFixed(0)}s | ${dong.laSo} | ${cauHoi}${loi ? ' | LỖI ' + loi.slice(0, 80) : ''}`);
      }
    }
  }
  const tep = tham('--xuat');
  if (tep) writeFileSync(tep, JSON.stringify(ra, null, 2), 'utf-8');
}

main();
