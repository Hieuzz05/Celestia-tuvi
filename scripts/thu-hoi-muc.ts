/**
 * X3 (CELES-27) — THU HỒI MỤC THƯ VIỆN khỏi bài V3 đã lưu (cổng thu hồi, lib/rag/thu-hoi/).
 *
 * Chạy:
 *   npx tsx scripts/thu-hoi-muc.ts xem      (--preview-url <url> | --pham-vi all)
 *   npx tsx scripts/thu-hoi-muc.ts liet-ke  (--preview-url <url> | --pham-vi all) [--so-hang 5] [--chart <đầu chart_hash>]
 *        CHỈ ĐỌC: các bài V3 mới nhất trong phạm vi, mỗi câu kèm mục thư viện đã dùng (dấu + ý) — để chọn
 *        đúng dấu mà thu hồi thử (dấu nằm ẩn trong đệm, giao diện không hiện).
 *   npx tsx scripts/thu-hoi-muc.ts thu-hoi  (--preview-url <url> | --pham-vi all --ghi-production)
 *        (--dau <8hex>[,<8hex>…] | --id <id> --chu-de <cd> | --theo-chunk <chunkId>)
 *        --ly-do "…" [--nguoi "…"] [--ap-dung]
 *   npx tsx scripts/thu-hoi-muc.ts hoan-tac (--preview-url <url> | --pham-vi all --ghi-production)
 *        --su-kien <uuid> [--nguoi "…"] [--ap-dung]
 *
 * LUẬT AN TOÀN (chủ dự án 22/10/2026):
 *   - MẶC ĐỊNH CHẠY KHÔ: không `--ap-dung` thì chỉ in, không ghi gì.
 *   - Phạm vi bắt buộc. `--preview-url` → hỏi `/api/phien-ban` của CHÍNH bản xem thử đó để lấy
 *     `phamViDem` phía server (phải bắt đầu bằng `preview:`). `--pham-vi all` = production, cần `--ghi-production`.
 *   - KHÔNG BAO GIỜ đụng `knowledge_chunks` (không bật `loai_tru` để thử — `loai_tru` ăn ngay trên production).
 *     `--theo-chunk` chỉ ĐỌC gói thư viện để tìm các mục dựng từ đoạn đó.
 *
 * Việc thu hồi không xoá bài: câu dính được viết lại khi có người mở (tính như sinh thường); hoàn tác thì
 * câu viết lại vẫn giữ, câu chưa ai mở thì hiện lại bản gốc.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CO_GHI_PRODUCTION } from '../lib/moi-truong-dem';

export type Viec = 'xem' | 'liet-ke' | 'thu-hoi' | 'hoan-tac';

export interface Lenh {
  viec: Viec;
  previewUrl?: string;
  phamViAll: boolean;
  ghiProduction: boolean;
  apDung: boolean;
  dau: string[];
  id?: string;
  chuDe?: string;
  theoChunk?: string;
  suKien?: string;
  lyDo: string;
  nguoi: string;
  soHang: number;
  chart?: string;
}

const lay = (argv: readonly string[], co: string) => {
  const i = argv.indexOf(co);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined;
};

/** Đọc + kiểm lệnh, KHÔNG chạm mạng / DB. Trả `{ loi }` khi phải từ chối. */
export function docLenh(argv: readonly string[]): Lenh | { loi: string } {
  const viec = argv.find((a) => !a.startsWith('--')) as Viec | undefined;
  if (viec !== 'xem' && viec !== 'liet-ke' && viec !== 'thu-hoi' && viec !== 'hoan-tac') {
    return { loi: 'Thiếu việc: xem | liet-ke | thu-hoi | hoan-tac' };
  }
  const pv = lay(argv, '--pham-vi');
  const l: Lenh = {
    viec,
    previewUrl: lay(argv, '--preview-url'),
    phamViAll: pv === 'all',
    ghiProduction: argv.includes(CO_GHI_PRODUCTION),
    apDung: argv.includes('--ap-dung'),
    dau: (lay(argv, '--dau') ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    id: lay(argv, '--id'),
    chuDe: lay(argv, '--chu-de'),
    theoChunk: lay(argv, '--theo-chunk'),
    suKien: lay(argv, '--su-kien'),
    lyDo: lay(argv, '--ly-do') ?? '',
    nguoi: lay(argv, '--nguoi') ?? process.env.USERNAME ?? process.env.USER ?? 'script',
    soHang: Math.min(50, Math.max(1, Number(lay(argv, '--so-hang') ?? 5) || 5)),
    chart: lay(argv, '--chart'),
  };
  if (pv !== undefined && pv !== 'all') return { loi: '--pham-vi chỉ nhận "all". Thử trên bản xem thử thì dùng --preview-url.' };
  if (l.previewUrl && l.phamViAll) return { loi: 'Chọn MỘT phạm vi: --preview-url hoặc --pham-vi all.' };
  if (!l.previewUrl && !l.phamViAll) return { loi: 'Thiếu phạm vi: --preview-url <url bản xem thử> hoặc --pham-vi all.' };
  if (l.previewUrl && l.ghiProduction) return { loi: `--preview-url không đi cùng ${CO_GHI_PRODUCTION}.` };
  // xem / liet-ke chỉ đọc: production không cần cờ ghi
  if (l.phamViAll && l.viec !== 'xem' && l.viec !== 'liet-ke' && !l.ghiProduction) {
    return { loi: `--pham-vi all là production: thêm ${CO_GHI_PRODUCTION} (và --ap-dung để ghi thật).` };
  }
  if (l.viec === 'thu-hoi') {
    const soCach = [l.dau.length > 0, Boolean(l.id), Boolean(l.theoChunk)].filter(Boolean).length;
    if (soCach !== 1) return { loi: 'thu-hoi cần đúng MỘT trong: --dau | --id --chu-de | --theo-chunk' };
    if (l.id && !l.chuDe) return { loi: '--id cần --chu-de (id mục chỉ duy nhất trong một gói).' };
    if (l.dau.some((d) => !/^[0-9a-f]{8}$/.test(d))) return { loi: '--dau phải là 8 ký tự hex.' };
    if (l.apDung && !l.lyDo.trim()) return { loi: 'Ghi thật cần --ly-do (sau này còn trả lời được vì sao gỡ).' };
  }
  if (l.viec === 'hoan-tac' && !(l.suKien && /^[0-9a-f-]{36}$/i.test(l.suKien))) return { loi: 'hoan-tac cần --su-kien <uuid>.' };
  return l;
}

/** Phạm vi ghi vào bảng: 'all' hoặc phamViDem của server bản xem thử (không bao giờ tự đoán) */
export async function giaiPhamVi(l: Lenh, layJson: (url: string) => Promise<unknown> = macDinhLayJson): Promise<string> {
  if (l.phamViAll) return 'all';
  const goc = l.previewUrl!.replace(/\/+$/, '');
  const j = (await layJson(`${goc}/api/phien-ban`)) as { phamViDem?: unknown };
  const pv = typeof j?.phamViDem === 'string' ? j.phamViDem : '';
  if (!/^preview:[a-z0-9-]+$/.test(pv)) {
    throw new Error(`${goc} trả phamViDem "${pv}" — không phải bản xem thử. Từ chối (không thu hồi thử lên production).`);
  }
  return pv;
}

async function macDinhLayJson(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url} trả ${r.status}`);
  return r.json();
}

function napEnv() {
  if (!existsSync('.env.local')) return;
  for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
    const s = d.trim();
    if (!s || s.startsWith('#')) continue;
    const [k, ...p] = s.split('=');
    const v = p.join('=').trim();
    if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
  }
}

type CauDem = { id: string; cauHoi?: string; chuaViet?: boolean; canCu?: { thuVien?: { ma?: string; id?: string; dau: string }[] }; thayThuHoi?: string[] };

/** Gói thư viện HIỆN HÀNH của mọi chủ đề (chỉ đọc) — để giải dấu ↔ ý */
async function napGoi() {
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  const { THU_VIEN_THEO_CHU_DE } = await import('../lib/rag/v3/xu-ly');
  const goi = new Map<string, Awaited<ReturnType<typeof docThuVien>>>();
  for (const [cd, t] of Object.entries(THU_VIEN_THEO_CHU_DE)) goi.set(cd, await docThuVien(cd, t.dot));
  return goi;
}

/** CHỈ ĐỌC: bài V3 mới nhất của phạm vi, mỗi câu kèm mục thư viện đã vào prompt (dấu + ý) */
async function lietKe(db: SupabaseClient, phamVi: string, l: Lenh) {
  const { dauMuc } = await import('../lib/rag/thu-vien/dau');
  const tatCa = [...(await napGoi()).values()].flat();
  const yCua = new Map(tatCa.map((m) => [dauMuc(m), m.y] as const));
  let q = db.from('noi_dung_ai').select('chart_hash, khoa_ky, noi_dung, tao_luc').eq('be_mat', 'luan-giai-v3').like('khoa_ky', '%|nhom:%');
  q = phamVi === 'all' ? q.not('khoa_ky', 'like', 'preview:%').not('khoa_ky', 'like', 'local:%') : q.like('khoa_ky', `${phamVi}:%`);
  if (l.chart) q = q.like('chart_hash', `${l.chart}%`);
  const { data, error } = await q.order('tao_luc', { ascending: false }).limit(l.soHang * 4);
  if (error) throw new Error(error.message);
  const hang = (data ?? []).filter((r) => Array.isArray(r.noi_dung) && !/\|tom-lai|\|buc-tranh/.test(r.khoa_ky)).slice(0, l.soHang);
  if (!hang.length) {
    console.log('Chưa có bài V3 nào trong phạm vi này. Mở bản xem thử, đọc một chủ đề chuyên sâu rồi chạy lại.');
    return;
  }
  let coDau = 0;
  for (const r of hang) {
    const nhom = /\|nhom:([^|]+)/.exec(r.khoa_ky)?.[1] ?? '?';
    console.log(`\nLá số ${String(r.chart_hash).slice(0, 10)}…  chủ đề ${nhom}  (lưu ${r.tao_luc})`);
    for (const c of r.noi_dung as CauDem[]) {
      const tv = c.canCu?.thuVien ?? [];
      console.log(`  [${c.id}] ${(c.cauHoi ?? '').slice(0, 70)}`);
      if (c.chuaViet) { console.log('      (chưa viết)'); continue; }
      if (!c.canCu) { console.log('      (không có căn cứ — viết trước K1, cổng không thấy)'); continue; }
      if (!tv.length) { console.log('      (không dùng mục thư viện nào)'); continue; }
      for (const m of tv) {
        coDau++;
        const y = yCua.get(m.dau);
        console.log(`      ${m.dau}  ${m.ma ?? ''} ${m.id ?? ''}  ${y ? `"${y.slice(0, 90)}"` : '(mục không còn trong gói hiện hành)'}`);
      }
    }
  }
  console.log(coDau
    ? `\nChọn MỘT dấu ở trên rồi chạy (chạy khô trước, bỏ --ap-dung):\n  npx tsx scripts/thu-hoi-muc.ts thu-hoi ${l.previewUrl ? `--preview-url ${l.previewUrl}` : '--pham-vi all --ghi-production'} --dau <dấu> --ly-do "thử TC-11" --ap-dung`
    : '\nKhông câu nào có dấu thư viện — đọc thêm một chủ đề (tình duyên / sự nghiệp …) trên bản xem thử rồi chạy lại.');
}

/**
 * Đếm hàng đệm V3 của PHẠM VI ĐÍCH sẽ bị viết lại khi mở. Có phân trang — PostgREST cắt 1000 hàng lặng lẽ.
 * `all` = khoá không mang tiền tố preview:/local:; preview = đúng tiền tố ns của phạm vi đó.
 */
async function demDem(db: SupabaseClient, phamVi: string, dau: ReadonlySet<string>, cauThuVien: ReadonlySet<string>) {
  const { dinhThuHoi } = await import('../lib/rag/thu-hoi/cong');
  const kq = { hang: 0, cauDinh: 0, hangCauDinh: 0, tongHopDinh: 0, khongCanCu: 0 };
  const TRANG = 500;
  for (let tu = 0; ; tu += TRANG) {
    let q = db.from('noi_dung_ai').select('chart_hash, khoa_ky, noi_dung').eq('be_mat', 'luan-giai-v3');
    q = phamVi === 'all' ? q.not('khoa_ky', 'like', 'preview:%').not('khoa_ky', 'like', 'local:%') : q.like('khoa_ky', `${phamVi}:%`);
    const { data, error } = await q.order('chart_hash').order('khoa_ky').range(tu, tu + TRANG - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      kq.hang++;
      const nd = r.noi_dung as unknown;
      if (Array.isArray(nd)) {
        const ds = nd as CauDem[];
        const dinh = ds.filter((c) => dinhThuHoi(c, dau)).length;
        kq.cauDinh += dinh;
        if (dinh) kq.hangCauDinh++;
        if (ds.some((c) => cauThuVien.has(c.id) && !c.chuaViet && !c.canCu)) kq.khongCanCu++;
      } else if (nd && typeof nd === 'object' && Array.isArray((nd as { dauTV?: unknown }).dauTV)) {
        if (((nd as { dauTV: string[] }).dauTV).some((d) => dau.has(d))) kq.tongHopDinh++;
      }
    }
    if (!data || data.length < TRANG) break;
  }
  return kq;
}

async function main() {
  const lenh = docLenh(process.argv.slice(2));
  if ('loi' in lenh) {
    console.error(`Từ chối: ${lenh.loi}`);
    process.exit(2);
  }
  // Script chạy tay: khai chế độ TRƯỚC mọi import đọc phamViDem (luật moi-truong-dem)
  const { khaiBaoScript } = await import('../lib/moi-truong-dem');
  khaiBaoScript(process.argv);
  napEnv();
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const db = taoSupabaseAdmin();
  if (!db) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  const phamVi = await giaiPhamVi(lenh);
  console.log(`Phạm vi: ${phamVi}${lenh.apDung ? '' : '   (CHẠY KHÔ — thêm --ap-dung để ghi)'}`);

  if (lenh.viec === 'xem') {
    const { data, error } = await db
      .from('thu_hoi_muc_thu_vien')
      .select('su_kien_id, dau, ly_do, nguoi, thu_hoi_luc')
      .eq('pham_vi', phamVi)
      .is('huy_luc', null)
      .order('thu_hoi_luc');
    if (error) throw new Error(error.message);
    if (!data?.length) console.log('Không có lệnh thu hồi nào còn hiệu lực.');
    for (const r of data ?? []) console.log(`  ${r.su_kien_id}  ${r.dau}  ${r.thu_hoi_luc}  ${r.nguoi}  — ${r.ly_do}`);
    if (phamVi !== 'all') console.log('(Máy chủ bản xem thử còn áp cả lệnh phạm vi "all"; xem bằng --pham-vi all.)');
    return;
  }

  if (lenh.viec === 'liet-ke') return lietKe(db, phamVi, lenh);

  if (lenh.viec === 'hoan-tac') {
    const { data, error } = await db
      .from('thu_hoi_muc_thu_vien')
      .select('dau')
      .eq('su_kien_id', lenh.suKien!)
      .eq('pham_vi', phamVi)
      .is('huy_luc', null);
    if (error) throw new Error(error.message);
    if (!data?.length) {
      console.log('Không có dòng còn hiệu lực của sự kiện này trong phạm vi đã chọn.');
      return;
    }
    console.log(`Sẽ hoàn tác ${data.length} dấu: ${data.map((r) => r.dau).join(', ')}`);
    if (!lenh.apDung) return;
    const { error: e2 } = await db
      .from('thu_hoi_muc_thu_vien')
      .update({ huy_luc: new Date().toISOString(), huy_boi: lenh.nguoi })
      .eq('su_kien_id', lenh.suKien!)
      .eq('pham_vi', phamVi)
      .is('huy_luc', null);
    if (e2) throw new Error(e2.message);
    console.log('Đã hoàn tác. Dấu nào còn sự kiện hiệu lực khác thì vẫn bị thu hồi. Máy chủ thấy sau ≤ 60 giây.');
    return;
  }

  // thu-hoi — giải ra dấu từ gói thư viện HIỆN HÀNH (chỉ đọc)
  const { dauMuc } = await import('../lib/rag/thu-vien/dau');
  const { CAU_THU_VIEN } = await import('../lib/rag/v3/xu-ly');
  const goi = await napGoi();
  const tatCa = [...goi.values()].flat();

  let dau = lenh.dau;
  if (lenh.id) {
    const ds = (goi.get(lenh.chuDe!) ?? []).filter((m) => m.id === lenh.id);
    if (!ds.length) throw new Error(`Không thấy mục ${lenh.id} trong gói hiện hành của ${lenh.chuDe}`);
    dau = ds.map(dauMuc);
  }
  if (lenh.theoChunk) {
    const ds = tatCa.filter((m) => m.canCu.some((c) => c.chunkId === lenh.theoChunk));
    if (!ds.length) console.log(`Không mục nào trong các gói hiện hành dựng từ đoạn ${lenh.theoChunk}.`);
    dau = ds.map(dauMuc);
  }
  dau = [...new Set(dau)];
  if (!dau.length) return;

  for (const d of dau) {
    const trung = tatCa.filter((m) => dauMuc(m) === d);
    console.log(`  ${d}  — ${trung.length} mục mang dấu này${trung[0] ? `: "${trung[0].y}"` : ' (không còn trong gói hiện hành)'}`);
  }
  const dem = await demDem(db, phamVi, new Set(dau), CAU_THU_VIEN);
  console.log(
    `Đệm V3 trong phạm vi ${phamVi}: ${dem.hang} hàng; ${dem.cauDinh} câu ở ${dem.hangCauDinh} hàng sẽ được viết lại khi mở` +
      ` (tính như sinh thường); ${dem.tongHopDinh} Tóm lại / Bức tranh đã ghi dấu cũng sẽ viết lại.`
  );
  console.log(`Điểm mù: ${dem.khongCanCu} hàng có câu thư viện nhưng KHÔNG có căn cứ (viết trước K1) — cổng không thấy, không chặn.`);
  if (!lenh.apDung) return;

  const suKien = randomUUID();
  const { error } = await db
    .from('thu_hoi_muc_thu_vien')
    .insert(dau.map((d) => ({ su_kien_id: suKien, dau: d, pham_vi: phamVi, ly_do: lenh.lyDo, nguoi: lenh.nguoi })));
  if (error) throw new Error(error.message);
  console.log(`Đã ghi sự kiện ${suKien}. Hoàn tác: npx tsx scripts/thu-hoi-muc.ts hoan-tac --su-kien ${suKien} ... --ap-dung`);
  console.log('Cổng chỉ có tác dụng khi máy chủ bật CELES_CONG_THU_HOI=1; máy chủ thấy lệnh sau ≤ 60 giây.');
}

if (/thu-hoi-muc\.ts$/.test(process.argv[1] ?? '')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
