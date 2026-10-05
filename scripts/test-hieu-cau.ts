/**
 * HIỂU CÂU QUA LƯỢT — MetaLuot, F2 chờ hỏi lại, giải thích lượt trước (CEL-186 Answer Contract v2,
 * spec 2.3 + 6, commit F). Offline: không Supabase, không mạng — model là hàm giả, truy hồi và
 * `layDoanTheoId` tiêm qua tham số thứ năm của `traLoiFocused`.
 *
 *   npx tsx scripts/test-hieu-cau.ts
 *
 * Thứ tự theo spec F:
 *   1. Gói F### dựng lại từ MetaLuot ra ĐÚNG y gói lượt gốc (mã + nội dung), trên lá số hợp đồng
 *      và 6 lá đầu của mẫu đóng băng × mọi lượt của 30 flow.
 *   2. HMAC: sửa một byte / thiếu khoá / phiên bản lệch → bỏ ('ky').
 *   2b. Ràng buộc: lá A→B 'la-so', người X→Y 'nguoi-dung', lượt N−1 'luot'.
 *   2c. E### bền: truy hồi lượt sau không trả lại X → gói vẫn có X; X đã gỡ → canCuEMat.
 *   3. F2 chờ hỏi lại: các nhánh của giaiHoiLai; phát lại không ra F2 vòng hai.
 *   4. Giải thích lượt trước: câu "vì sao" ngắn → mượn lượt trước; câu có chủ đề riêng → không.
 *   5. Câu phát lại rơi vào lối an toàn → anToanPhatLai, không gọi model trả lời.
 *   6. Thiếu khoá: không phát meta (STANDARD không đi qua đây, cờ tắt không có meta).
 */
for (const k of Object.keys(process.env)) {
  if (/SUPABASE|_API_KEY$|^AI_GHIM_MODEL$|^AI_FALLBACK_ORDER$|^CELES_/.test(k)) delete process.env[k];
}
process.env.GROQ_API_KEY = 'khoa-gia-test';
process.env.CELES_META_KHOA = 'khoa-meta-test';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TinNhan } from '../lib/ai/prompt';
import type { DoanUngVien } from '../lib/rag/truy-hoi';
import type { KetQuaFocused, PhuThuocFocused } from '../lib/rag/focused/tra-loi-focused';
import type { DauVaoTraLoi } from '../lib/rag/tra-loi';
import type { MetaLuot } from '../lib/rag/focused/hieu-cau';

let loi = 0;
function kiem(dk: boolean, ten: string) {
  if (dk) return;
  loi++;
  console.error(`  ✗ ${ten}`);
}

/* ------------------------------------------------------------ model giả */

/** Nhãn bộ hỏi lại giả: theo câu người dùng vừa gõ (dòng cuối của user message). */
let nhanHoiLai: (cau: string) => string = (cau) => (/lá số này của tôi/i.test(cau) ? 'nguoi-hoi' : 'khong-lien-quan');
/** Chiều model giả trả — null: đúng chiều engine yêu cầu trong prompt. */
let chieuEp: string | null = null;
let soLanGoiTraLoi = 0;
let soLanGoiHoiLai = 0;
let userCuoi = '';

function traLoiGia(user: string, system: string): string {
  soLanGoiTraLoi++;
  userCuoi = user;
  const f = user.match(/\bF\d{3}\b/)?.[0] ?? 'F001';
  const e = user.match(/\bE\d{3}\b/)?.[0];
  const chieu = chieuEp ?? /"direction" của claims\[0\] lượt này phải là "(\w+)"/.exec(user + system)?.[1] ?? 'thuan';
  return JSON.stringify({
    answer: 'Năm nay mọi việc đi khá đều. Có một điểm tựa giúp mọi việc đi đều.',
    claims: [{ claim: 'Mọi việc đi khá đều', evidenceIds: [f, ...(e ? [e] : [])], direction: chieu }],
    suggestedQuestions: ['Sang năm thì sao?'],
  });
}

globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const u = String(url instanceof Request ? url.url : url);
  if (!u.includes('api.groq.com')) return new Response('khong co mang trong test', { status: 500 });
  const body = typeof init?.body === 'string' ? init.body : '';
  const msgs = (JSON.parse(body).messages ?? []) as { role: string; content: string }[];
  const system = msgs.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const user = msgs.filter((m) => m.role === 'user').pop()?.content ?? '';
  let noiDung: string;
  if (system.includes('bộ phân loại câu hỏi')) noiDung = 'khong-ro';
  else if (system.includes('LÁ SỐ CỦA AI')) {
    soLanGoiHoiLai++;
    noiDung = nhanHoiLai(/Người dùng vừa gõ: "(.*)"/.exec(user)?.[1] ?? '');
  } else noiDung = traLoiGia(user, system);
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: noiDung }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}) as typeof fetch;

/* --------------------------------------------------------------- tiện ích */

function doan(id: string): DoanUngVien {
  return {
    chunkId: `chunk-${id}`,
    documentId: `doc-${id}`,
    versionId: `ver-${id}`,
    noiDung: `Đoạn kiến thức ${id}.`,
    duongDeMuc: null,
    tieuDe: `Tài liệu ${id}`,
    hePhai: 'chung',
    mucTinCay: 'cao',
    phienBanTaiLieu: '1',
    diemRRF: 0,
    duocChon: true,
  } as DoanUngVien;
}

function laSoTuMau(khoa: string) {
  const m = /^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu|nữ)$/u.exec(khoa);
  if (!m) return null;
  return {
    ngay: Number(m[1]),
    thang: Number(m[2]),
    nam: Number(m[3]),
    gio: Number(m[4]),
    gioiTinh: (m[5] === 'nam' ? 'nam' : 'nu') as 'nam' | 'nu',
  };
}

async function main() {
  const { HOP_DONG, HOM_NAY, LA_SO, NAM_XEM, chayFlow } = await import('./hop-dong-focused');
  const { traLoiFocused } = await import('../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../lib/rag/tra-loi');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const hc = await import('../lib/rag/focused/hieu-cau');
  const { PHIEN_BAN_FOCUSED } = await import('../lib/rag/focused/tra-loi-focused');

  let pt: PhuThuocFocused = {};
  const goi = (vao: DauVaoTraLoi): Promise<KetQuaFocused> => traLoiFocused(vao, phienBanHienTai, async () => [], HOM_NAY, pt);

  /* ---------------------------------------------- 1. dựng lại F### */
  const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')) as { mau: Record<string, string> };
  const laMau = Object.keys(mau.mau)
    .map(laSoTuMau)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .slice(0, 6);
  kiem(laMau.length === 6, `đọc được 6 lá mẫu đóng băng (được ${laMau.length})`);
  const cacLa = [
    ...Object.entries(LA_SO).map(([ten, f]) => ({ ten, laSo: f() })),
    ...laMau.map((v) => ({ ten: `${v.ngay}/${v.thang}/${v.nam} ${v.gio}h`, laSo: lapLaSo(v) })),
  ];
  let soMau = 0;
  let soLech = 0;
  for (const la of cacLa) {
    for (const flow of HOP_DONG) {
      const ds = await chayFlow(flow, goi, { laSo: la.laSo });
      for (const [i, l] of ds.entries()) {
        const kq = l.kq;
        if (!kq.meta || kq.provider === 'ma' || !kq.van) continue;
        soMau++;
        const tai = JSON.parse(JSON.stringify(kq.meta)) as MetaLuot;
        const lai = hc.dungLaiBoiCanh(la.laSo, tai, HOM_NAY.thang).duKien;
        const goc = kq.goi.duKien;
        const giong =
          lai.length === goc.length && lai.every((d, k) => d.id === goc[k].id && d.noiDung === goc[k].noiDung && d.loai === goc[k].loai);
        if (!giong) {
          soLech++;
          if (soLech <= 5) {
            const k = lai.findIndex((d, j) => d.id !== goc[j]?.id || d.noiDung !== goc[j]?.noiDung);
            console.error(
              `  ✗ dựng lại lệch: lá ${la.ten}, flow ${flow.so}#${i + 1} "${l.cauHoi}" — ${goc.length} vs ${lai.length} mã; lệch đầu tiên ở ${k}: ${goc[k]?.id}/${lai[k]?.id}`
            );
          }
        }
        // Mã căn cứ của meta đều có trong gói dựng lại
        const maLai = new Set(lai.map((d) => d.id));
        kiem(tai.canCuF.every((m) => maLai.has(m)), `canCuF có trong gói dựng lại (lá ${la.ten}, flow ${flow.so}#${i + 1})`);
      }
    }
  }
  if (soLech) loi++;
  kiem(soMau >= 60, `đủ mẫu dựng lại (được ${soMau}, cần ≥ 60)`);
  console.log(`1. Dựng lại F###: ${soMau - soLech}/${soMau} lượt khớp đúng y gói gốc trên ${cacLa.length} lá`);
  if (soLech) {
    console.error('\nTRƯỢT ở bài dựng lại — spec F: DỪNG, báo lại.');
    process.exit(1);
  }

  /* ---------------------------------------------- lượt mẫu có meta */
  const laA = LA_SO.chinh();
  const coBan: DauVaoTraLoi = {
    laSo: laA,
    cauHoi: 'Năm nay sự nghiệp của tôi thế nào?',
    namXem: NAM_XEM,
    thangXem: HOM_NAY.thang,
    ghiNhatKy: false,
    lichSu: [],
    chartHashLaSo: 'la-A',
    nguoiDung: 'nguoi-X',
  };
  pt = { truyHoi: async () => ({ daChon: [doan('X'), doan('Y')], khoTrong: false, doTreMs: 0 }) as never };
  const l1 = await goi(coBan);
  kiem(!!l1.van && !!l1.meta, 'lượt mẫu có văn và meta');
  const m1 = l1.meta!;
  const lichSu1: TinNhan[] = [
    { vaiTro: 'nguoi-dung', noiDung: coBan.cauHoi },
    { vaiTro: 'tro-ly', noiDung: l1.van },
  ];
  const rb = { laSo: 'la-A', nguoiDung: 'nguoi-X' };
  kiem(m1.canCuE.some((e) => e.chunkId === 'chunk-X'), 'meta.canCuE giữ định danh bền của E001 (chunk-X)');
  kiem(hc.kiemLuotTruoc(JSON.parse(JSON.stringify(m1)), rb, lichSu1, PHIEN_BAN_FOCUSED).meta !== null, 'meta qua JSON vẫn được nhận');

  /* ---------------------------------------------- 2. HMAC */
  const suaKy = { ...m1, ky: (m1.ky[0] === 'A' ? 'B' : 'A') + m1.ky.slice(1) };
  kiem(hc.kiemLuotTruoc(suaKy, rb, lichSu1, PHIEN_BAN_FOCUSED).bo === 'ky', '2. sửa một byte chữ ký → bỏ (ky)');
  kiem(hc.kiemLuotTruoc({ ...m1, namHieuLuc: m1.namHieuLuc + 1 }, rb, lichSu1, PHIEN_BAN_FOCUSED).bo === 'ky', '2. sửa một trường → bỏ (ky)');
  kiem(hc.kiemLuotTruoc(m1, rb, lichSu1, 'focused-khac').bo === 'ky', '2. phiên bản lệch → bỏ (ky)');
  kiem(hc.kiemLuotTruoc({ ...m1, v: 2 }, rb, lichSu1, PHIEN_BAN_FOCUSED).bo === 'ky', '2. hình dạng sai → bỏ (ky)');
  delete process.env.CELES_META_KHOA;
  kiem(hc.kiemLuotTruoc(m1, rb, lichSu1, PHIEN_BAN_FOCUSED).bo === 'ky', '2. thiếu khoá → bỏ (ky)');
  process.env.CELES_META_KHOA = 'khoa-meta-test';

  /* ---------------------------------------------- 2b. ràng buộc */
  kiem(hc.kiemLuotTruoc(m1, { ...rb, laSo: 'la-B' }, lichSu1, PHIEN_BAN_FOCUSED).bo === 'la-so', '2b. lá A → lá B: bỏ (la-so)');
  kiem(hc.kiemLuotTruoc(m1, { ...rb, nguoiDung: 'nguoi-Y' }, lichSu1, PHIEN_BAN_FOCUSED).bo === 'nguoi-dung', '2b. người X → Y: bỏ (nguoi-dung)');
  const lichSuN: TinNhan[] = [...lichSu1, { vaiTro: 'nguoi-dung', noiDung: 'Sang năm thì sao?' }, { vaiTro: 'tro-ly', noiDung: 'Một câu trả lời khác.' }];
  kiem(hc.kiemLuotTruoc(m1, rb, lichSuN, PHIEN_BAN_FOCUSED).bo === 'luot', '2b. meta lượt N−1 khi lịch sử đã tới lượt N: bỏ (luot)');
  const lechLa = await goi({ ...coBan, cauHoi: 'giải thích vì sao lại vậy', lichSu: lichSu1, luotTruoc: m1, chartHashLaSo: 'la-B' });
  kiem(lechLa.vetPreview?.luotTruocBo === 'la-so', '2b. đầu-cuối: vết ghi luotTruocBo = la-so');
  kiem(lechLa.vetPreview?.hieu.giaiThichLuotTruoc === false, '2b. đầu-cuối: meta bị bỏ thì không giải thích lượt trước');

  /* ---------------------------------------------- 2c + 4. giải thích lượt trước, E### bền */
  const hoiViSao = { ...coBan, cauHoi: 'giải thích vì sao lại vậy', lichSu: lichSu1, luotTruoc: m1 };
  pt = {
    truyHoi: async () => ({ daChon: [doan('Z')], khoTrong: false, doTreMs: 0 }) as never,
    layDoanTheoId: async (ids) => ids.flatMap((i) => (i.chunkId === 'chunk-X' ? [doan('X')] : i.chunkId === 'chunk-Y' ? [doan('Y')] : [])),
  };
  const l2 = await goi(hoiViSao);
  kiem(l2.vetPreview?.hieu.giaiThichLuotTruoc === true, '4. "giải thích vì sao lại vậy" → giải thích lượt trước');
  kiem(l2.vetPreview?.hieu.nguon === 'luot-truoc', '4. nguồn kế hoạch = luot-truoc');
  kiem(l2.vetPreview?.hieu.chuDe === m1.chuDe && l2.vetPreview?.hieu.khuon === m1.khuon, '4. chủ đề, khuôn lấy từ lượt trước');
  kiem(l2.goi.bangChung[0]?.chunkId === 'chunk-X', '2c. chunk X (truy hồi lượt này không trả) vẫn trong gói, đứng đầu');
  kiem(l2.goi.bangChung.some((e) => e.chunkId === 'chunk-Z'), '2c. đoạn truy hồi mới vẫn vào gói sau đoạn cũ');
  kiem(new Set(l2.goi.bangChung.map((e) => e.chunkId)).size === l2.goi.bangChung.length, '2c. gói khử trùng theo chunkId');
  const giongF = l2.goi.duKien.map((d) => d.id + d.noiDung).join('|') === l1.goi.duKien.map((d) => d.id + d.noiDung).join('|');
  kiem(giongF, '4. gói F### lượt "vì sao" đúng y gói lượt trước');
  kiem(userCuoi.includes('LƯỢT TRƯỚC') && userCuoi.includes('Mọi việc đi khá đều'), '4. prompt có khối LƯỢT TRƯỚC kèm kết luận');
  kiem(!!l2.van && !!l2.meta, '4. lượt "vì sao" có văn và phát meta mới');

  pt = { ...pt, layDoanTheoId: async () => [] };
  const l2b = await goi(hoiViSao);
  kiem(l2b.vetPreview?.canCuEMat === m1.canCuE.length, `2c. đoạn đã gỡ xuất bản → canCuEMat = ${m1.canCuE.length} (được ${l2b.vetPreview?.canCuEMat})`);

  // Kết luận không được lật: model giả đổi chiều → NGUOC_HUONG, viết lại, vẫn lật → 502
  chieuEp = m1.ketLuanChinh?.direction === 'vuong' ? 'thuan' : 'vuong';
  const lat = await goi(hoiViSao);
  chieuEp = null;
  kiem(lat.vetPreview?.lan[0]?.loi.some((x) => x.ma === 'NGUOC_HUONG') === true, '4. lật chiều kết luận lượt trước → NGUOC_HUONG');
  kiem(!lat.van, '4. vẫn lật sau viết lại → 502');

  // Câu "vì sao" có chủ đề riêng: không mượn lượt trước
  const rieng = await goi({ ...hoiViSao, cauHoi: 'Vì sao tôi hay cãi nhau với mẹ?' });
  kiem(rieng.vetPreview?.hieu.giaiThichLuotTruoc === false, '4. "Vì sao tôi hay cãi nhau với mẹ?" (8 âm tiết) không giải thích lượt trước');
  const tinhYeu = await goi({ ...hoiViSao, cauHoi: 'Vì sao tình duyên lận đận?' });
  kiem(tinhYeu.vetPreview?.hieu.giaiThichLuotTruoc === false, '4. câu "vì sao" có chủ đề riêng không mượn lượt trước');
  // Không meta → câu mới
  const khongMeta = await goi({ ...hoiViSao, luotTruoc: undefined });
  kiem(khongMeta.vetPreview?.hieu.giaiThichLuotTruoc === false, '4. không có lượt trước → không giải thích lượt trước');

  /* ---------------------------------------------- 3. F2 chờ hỏi lại */
  pt = { truyHoi: async () => ({ daChon: [], khoTrong: true, doTreMs: 0 }) as never };
  const cauF2 = 'Con tôi năm nay học hành thế nào?';
  const f2 = await goi({ ...coBan, cauHoi: cauF2 });
  kiem(f2.model === 'focused-f2' && f2.khongTinhLuot === true, '3. lượt 1 ra F2, không tính lượt');
  kiem(f2.meta?.choHoiLai?.cauHoiGoc === cauF2 && f2.meta?.choHoiLai?.doiTuong.vai === 'con', '3. meta.choHoiLai mang câu gốc + vai');
  kiem(f2.meta?.laSoCuaAi === 'chua-ro', '3. lượt F2: laSoCuaAi = chua-ro');
  const lichSuF2: TinNhan[] = [
    { vaiTro: 'nguoi-dung', noiDung: cauF2 },
    { vaiTro: 'tro-ly', noiDung: f2.van },
  ];
  const sau = (cau: string) => goi({ ...coBan, cauHoi: cau, lichSu: lichSuF2, luotTruoc: f2.meta });
  const chip1 = f2.coCauTruc?.goiYTiep?.[0] ?? '';

  soLanGoiHoiLai = 0;
  const a = await sau(chip1);
  kiem(soLanGoiHoiLai === 0, '3. bấm chip 1: đường tất định, không gọi model hỏi lại');
  kiem(a.model !== 'focused-f2' && a.vetPreview?.hieu.nguon === 'phat-lai-hoi-lai', '3. chip 1 → phát lại, không F2 vòng hai');
  kiem(a.meta?.laSoCuaAi === 'nguoi-duoc-hoi' && a.meta?.choHoiLai === null, '3. chip 1 → laSoCuaAi nguoi-duoc-hoi, choHoiLai null');
  kiem(a.vetPreview?.hieu.chuDe === 'su-nghiep', `3. "học hành" phát lại ra su-nghiep (được ${a.vetPreview?.hieu.chuDe})`);
  kiem(userCuoi.includes('người được hỏi (con của người dùng)'), '3. prompt có dòng lá số của người được hỏi');

  soLanGoiHoiLai = 0;
  const b = await sau('lá số của con tôi');
  kiem(soLanGoiHoiLai === 0, '3. "lá số của con tôi": đường tất định');
  kiem(b.model !== 'focused-f2' && b.meta?.laSoCuaAi === 'nguoi-duoc-hoi', '3. "lá số của con tôi" → nguoi-duoc-hoi, không F2 vòng hai');

  soLanGoiHoiLai = 0;
  const c = await sau('lá số này của tôi mà');
  kiem(soLanGoiHoiLai === 1, '3. câu tự do → gọi model hỏi lại đúng một lần');
  kiem(c.model !== 'focused-f2' && c.vetPreview?.hieu.khuon === 'F1', `3. lá số của người hỏi → phát lại câu gốc khuôn F1 (được ${c.vetPreview?.hieu.khuon})`);
  kiem(c.meta?.laSoCuaAi === 'nguoi-hoi', '3. lá số của người hỏi → laSoCuaAi nguoi-hoi');
  kiem(userCuoi.includes('Lá số đang mở là của chính người dùng'), '3. prompt có dòng lá số của chính người dùng');

  const chip2 = f2.coCauTruc?.goiYTiep?.[1] ?? '';
  soLanGoiHoiLai = 0;
  const d = await sau(chip2);
  kiem(soLanGoiHoiLai === 0 && d.vetPreview?.hieu.nguon !== "phat-lai-hoi-lai", `3. chip 2 → không liên quan, chạy câu mới (${chip2} / goi ${soLanGoiHoiLai} / nguon ${d.vetPreview?.hieu.nguon} / model ${d.model})`);

  nhanHoiLai = () => 'tra loi linh tinh';
  const e = await sau('Thôi, xem giúp tôi chuyện tiền bạc năm nay');
  kiem(e.vetPreview?.hieu.nguon !== 'phat-lai-hoi-lai', '3. model trả nhãn hỏng → khong-lien-quan, chạy câu mới');
  nhanHoiLai = (cau) => (/lá số này của tôi/i.test(cau) ? 'nguoi-hoi' : 'khong-lien-quan');

  /* ---------------------------------------------- 5. câu phát lại rơi vào lối an toàn */
  const cauNguy = 'Con tôi muốn tự tử thì năm nay thế nào?';
  const f2n = await goi({ ...coBan, cauHoi: cauNguy });
  if (f2n.meta?.choHoiLai) {
    soLanGoiTraLoi = 0;
    const n = await goi({
      ...coBan,
      cauHoi: 'lá số của con tôi',
      lichSu: [
        { vaiTro: 'nguoi-dung', noiDung: cauNguy },
        { vaiTro: 'tro-ly', noiDung: f2n.van },
      ],
      luotTruoc: f2n.meta,
    });
    kiem(n.anToanPhatLai === 'CRITICAL' && !n.van, '5. câu phát lại CRITICAL → anToanPhatLai, không văn');
    kiem(soLanGoiTraLoi === 0, '5. câu phát lại CRITICAL không gọi model trả lời');
  } else {
    // Không dựng được F2 cho câu nguy hiểm: kiểm trực tiếp qua một meta ký tay
    const { kyMeta } = hc;
    const { ky: _bo, ...than } = f2.meta!;
    void _bo;
    const giaMeta = kyMeta({ ...than, choHoiLai: { ...f2.meta!.choHoiLai!, cauHoiGoc: cauNguy } }, 'khoa-meta-test');
    soLanGoiTraLoi = 0;
    const n = await goi({ ...coBan, cauHoi: 'lá số của con tôi', lichSu: lichSuF2, luotTruoc: giaMeta });
    kiem(n.anToanPhatLai === 'CRITICAL' && !n.van, '5. câu phát lại CRITICAL → anToanPhatLai, không văn');
    kiem(soLanGoiTraLoi === 0, '5. câu phát lại CRITICAL không gọi model trả lời');
  }

  /* ---------------------------------------------- 6. thiếu khoá: không meta */
  delete process.env.CELES_META_KHOA;
  pt = {};
  const kk = await goi(coBan);
  kiem(!!kk.van && kk.meta === undefined, '6. thiếu CELES_META_KHOA → không phát meta');
  const kkF2 = await goi({ ...coBan, cauHoi: cauF2 });
  kiem(kkF2.meta === undefined, '6. thiếu khoá: lượt F2 cũng không phát meta');

  if (loi) {
    console.error(`\nTRƯỢT: ${loi} lỗi`);
    process.exit(1);
  }
  console.log('\nĐẠT');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
