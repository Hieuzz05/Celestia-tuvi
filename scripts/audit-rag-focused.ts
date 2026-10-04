/**
 * Audit RAG đường Focused (CEL-186 Answer Contract v2, commit B — spec mục 11 B).
 *
 *   npx tsx scripts/audit-rag-focused.ts [--xuat <tệp.md>] [--json <tệp.json>]
 *
 * CHẠM DB THẬT (chỉ SELECT) + gọi embedding truy vấn (~$0,0001 cả bộ). KHÔNG gọi model chat.
 * KHÔNG nằm trong CI. Đọc `.env.local` tự nạp — không in khoá nào.
 *
 * 20 ca (4 UAT, 6 chủ đề × 2, 4 tháng, 2 EN, 2 hỏi lại lượt trước), lá số từ `mau-ansao.json`.
 * Mỗi ca đi lại đúng đường Focused tới gói bằng chứng (lapKeHoachFocused → themLopChoThang →
 * chonBoiCanh → truyHoi → dungGoiBangChung), KHÔNG model phân loại (như `dungModelPhanLoai:false`).
 *
 * Thực thể kỳ vọng = cung trọng tâm (`cungLienQuan[0]`) + chính tinh / tứ hoá đóng ở cung đó trên
 * lá số — tính từ engine, không do người đoán nghĩa (spec cấm đề xuất nghĩa trước audit).
 *
 * Năm bước cho mỗi thực thể kỳ vọng:
 *   1. trong kho     — số đoạn đang xuất bản, không bị loại trừ, có gắn thực thể đó
 *   2. truy hồi về   — có trong `ungVien` (kèm hạng vector / từ khoá / RRF)
 *   3. được chọn     — có trong `daChon`
 *   4. đưa cho model — có trong `goi.bangChung` (mã E###, chính là khối `dungKhoiChoPrompt`)
 *   5. dùng trong claim — chỉ với `--buoc5` (sau commit D): chạy `traLoiFocused` bằng MODEL THẬT
 *      (bắt buộc AI_GHIM_MODEL + AI_TRAN_USD ≤ 0.5 + giá), xem có claim nào dẫn mã E### của một
 *      đoạn gắn thực thể đó không. Lượt Focused tự truy hồi lại, nên đối chiếu theo đoạn CỦA LƯỢT ĐÓ.
 * Kết luận ca = khâu hỏng sớm nhất trên các thực thể kỳ vọng:
 *   kien-thuc | truy-hoi | chon-loc | prompt-dung | khong-lo-hong
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LaSo } from '../lib/tuvi/ansao';
import type { TinNhan } from '../lib/ai/prompt';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};

type Nhom = 'uat' | 'chu-de' | 'thang' | 'en' | 'hoi-lai';
interface CaAudit {
  ma: string;
  nhom: Nhom;
  laSo: string;
  cauHoi: string;
  lichSu?: TinNhan[];
  thangXem?: number;
}

const LA = ['12/5/1990 10h nam', '24/8/2000 9h nam', '12/5/1990 23h nu', '29/2/2000 0h nu', '31/12/1999 22h nu', '14/9/2006 16h nu'];

const CA: CaAudit[] = [
  // 4 UAT
  { ma: 'U1-that-nghiep', nhom: 'uat', laSo: LA[0], cauHoi: 'Hiện tại tôi đang thất nghiệp, khi nào thì tìm được việc mới?' },
  { ma: 'U2-thang-10', nhom: 'uat', laSo: LA[0], cauHoi: 'Tháng 10 tôi tìm việc được không?' },
  {
    ma: 'U3-vi-sao',
    nhom: 'uat',
    laSo: LA[0],
    cauHoi: 'Giải thích vì sao lại vậy?',
    lichSu: [
      { vaiTro: 'nguoi-dung', noiDung: 'Hiện tại tôi đang thất nghiệp, khi nào thì tìm được việc mới?' },
      { vaiTro: 'tro-ly', noiDung: 'Năm nay chuyện việc làm có cửa mở dần, nửa cuối năm rõ hơn.' },
    ],
  },
  { ma: 'U4-con-toi', nhom: 'uat', laSo: LA[5], cauHoi: 'Năm nay con tôi học hành thế nào?' },
  // 6 chủ đề × 2
  { ma: 'C1-cong-viec', nhom: 'chu-de', laSo: LA[1], cauHoi: 'Năm nay công việc của tôi ra sao?' },
  { ma: 'C2-cong-viec', nhom: 'chu-de', laSo: LA[3], cauHoi: 'Tôi có nên đổi việc năm nay không?' },
  { ma: 'C3-tai-chinh', nhom: 'chu-de', laSo: LA[2], cauHoi: 'Năm nào cũng vất vả, năm nay tiền bạc ra sao?' },
  { ma: 'C4-tai-chinh', nhom: 'chu-de', laSo: LA[4], cauHoi: 'Năm nay tôi có nên đầu tư không?' },
  { ma: 'C5-tinh-cam', nhom: 'chu-de', laSo: LA[3], cauHoi: 'Tôi chưa bao giờ có người yêu, năm nay có không?' },
  { ma: 'C6-tinh-cam', nhom: 'chu-de', laSo: LA[1], cauHoi: 'Năm nay chuyện tình cảm của tôi thế nào?' },
  { ma: 'C7-suc-khoe', nhom: 'chu-de', laSo: LA[0], cauHoi: 'Lúc nào cũng mệt, năm nay sức khỏe tôi thế nào?' },
  { ma: 'C8-suc-khoe', nhom: 'chu-de', laSo: LA[4], cauHoi: 'Năm nay tôi cần giữ gìn sức khỏe điều gì?' },
  { ma: 'C9-gia-dao', nhom: 'chu-de', laSo: LA[2], cauHoi: 'Vì sao tôi hay cãi nhau với mẹ?' },
  { ma: 'C10-gia-dao', nhom: 'chu-de', laSo: LA[1], cauHoi: 'Năm nay nhà cửa gia đình tôi có yên không?' },
  { ma: 'C11-hoc-tap', nhom: 'chu-de', laSo: LA[5], cauHoi: 'Năm nay tôi thi cử có thuận không?' },
  { ma: 'C12-ban-than', nhom: 'chu-de', laSo: LA[3], cauHoi: 'Tính cách tôi mạnh yếu ở đâu?' },
  // 4 tháng
  { ma: 'T1-thang-am-10', nhom: 'thang', laSo: LA[2], cauHoi: 'Tháng 10 âm năm nay công việc thế nào?' },
  { ma: 'T2-thang-6', nhom: 'thang', laSo: LA[1], cauHoi: 'Tháng 6 năm nay tôi có nên chuyển nhà không?' },
  { ma: 'T3-thang-nay', nhom: 'thang', laSo: LA[4], cauHoi: 'Tháng này tiền bạc của tôi thế nào?', thangXem: 10 },
  { ma: 'T4-thang-12', nhom: 'thang', laSo: LA[3], cauHoi: 'Tháng 12 tình cảm của tôi có gì mới không?' },
  // 2 EN
  { ma: 'E1-career', nhom: 'en', laSo: LA[0], cauHoi: 'How will my career go this year?' },
  { ma: 'E2-october', nhom: 'en', laSo: LA[2], cauHoi: 'Will I find a job this October?' },
  // 2 hỏi lại lượt trước (U3 là ca thứ ba của nhóm, tính trong UAT)
  {
    ma: 'H1-vi-sao-tien',
    nhom: 'hoi-lai',
    laSo: LA[4],
    cauHoi: 'Vì sao lại vậy?',
    lichSu: [
      { vaiTro: 'nguoi-dung', noiDung: 'Năm nay tiền bạc của tôi thế nào?' },
      { vaiTro: 'tro-ly', noiDung: 'Tiền bạc năm nay vào ra thất thường, nên giữ phần dự phòng.' },
    ],
  },
  {
    ma: 'H2-giai-thich',
    nhom: 'hoi-lai',
    laSo: LA[3],
    cauHoi: 'Giải thích thêm được không?',
    lichSu: [
      { vaiTro: 'nguoi-dung', noiDung: 'Năm nay chuyện tình cảm của tôi thế nào?' },
      { vaiTro: 'tro-ly', noiDung: 'Tình cảm năm nay có người mới xuất hiện nhưng cần thời gian.' },
    ],
  },
];

type Khau = 'kien-thuc' | 'truy-hoi' | 'chon-loc' | 'prompt-dung' | 'khong-lo-hong';
const THU_TU: Khau[] = ['kien-thuc', 'truy-hoi', 'chon-loc', 'prompt-dung', 'khong-lo-hong'];

interface DongThucThe {
  id: string;
  ten: string;
  trongKho: number;
  truyHoi: number;
  hangTotNhat?: { vector?: number; tuKhoa?: number; rrf: number };
  duocChon: number;
  maE: string[];
  khau: Khau;
  /** Bước 5: true = có claim dẫn E### của đoạn gắn thực thể; null = lượt 502, không đo */
  dungTrongClaim?: boolean | null;
}

interface KetQuaCa {
  ma: string;
  nhom: Nhom;
  laSo: string;
  cauHoi: string;
  chuDe: string;
  yDinh: string;
  cungTrongTam: string;
  thangMucTieu?: number;
  thucTheKeHoach: string[];
  soUngVien: number;
  soDaChon: number;
  soE: number;
  soF: number;
  doTreMs: number;
  khoTrong: boolean;
  soLanThu: number;
  thucThe: DongThucThe[];
  ketLuan: Khau;
  buoc5?: { status: 200 | 502; lanGoi: number; thuLai: string | null; soClaim: number; maClaim: string[]; msTong: number };
}

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } = await import('../lib/rag/boi-canh-la-so');
  const { lapKeHoachFocused } = await import('../lib/rag/focused/ke-thua');
  const { themLopChoThang } = await import('../lib/rag/focused/tra-loi-focused');
  const { truyHoi } = await import('../lib/rag/truy-hoi');
  const { dungGoiBangChung } = await import('../lib/rag/bang-chung');
  const { traThucThe } = await import('../lib/rag/thuc-the');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');

  const buoc5 = process.argv.includes('--buoc5');
  if (buoc5) {
    const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
    if (thieu.length || Number(process.env.AI_TRAN_USD) > 0.5) throw new Error(`--buoc5 cần ${thieu.join(', ') || 'AI_TRAN_USD ≤ 0.5'}`);
  }
  const { traLoiFocused } = await import('../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../lib/rag/tra-loi');
  const { tienDaTinh } = await import('../lib/ai/fallback');

  const sb = taoSupabaseAdmin();
  if (!sb) throw new Error('Thiếu Supabase trong .env.local — audit cần DB thật (chỉ SELECT).');

  const NAM_XEM = 2026;
  const THANG_XEM = 10;

  const veLaSo = (k: string): LaSo => {
    const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
    return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
  };

  /** Đoạn đang xuất bản, không loại trừ, gắn thực thể — chỉ SELECT. */
  const demTrongKho = new Map<string, number>();
  async function soDoanTrongKho(entityId: string): Promise<number> {
    if (demTrongKho.has(entityId)) return demTrongKho.get(entityId)!;
    const { data, error } = await sb!
      .from('chunk_entities')
      .select('chunk_id, knowledge_chunks!inner(trang_thai, knowledge_document_versions!inner(trang_thai))')
      .eq('entity_id', entityId)
      .neq('knowledge_chunks.trang_thai', 'loai_tru')
      .eq('knowledge_chunks.knowledge_document_versions.trang_thai', 'da_xuat_ban')
      .limit(5000);
    if (error) throw new Error(`SELECT chunk_entities lỗi: ${error.message}`);
    const n = data?.length ?? 0;
    demTrongKho.set(entityId, n);
    return n;
  }

  /** Thực thể gắn với một nhóm đoạn — chỉ SELECT. */
  async function thucTheCuaDoan(chunkIds: string[]): Promise<Map<string, Set<string>>> {
    const ra = new Map<string, Set<string>>();
    if (!chunkIds.length) return ra;
    const { data, error } = await sb!.from('chunk_entities').select('chunk_id, entity_id').in('chunk_id', chunkIds);
    if (error) throw new Error(`SELECT chunk_entities lỗi: ${error.message}`);
    for (const d of (data ?? []) as { chunk_id: string; entity_id: string }[]) {
      if (!ra.has(d.chunk_id)) ra.set(d.chunk_id, new Set());
      ra.get(d.chunk_id)!.add(d.entity_id);
    }
    return ra;
  }

  const ketQua: KetQuaCa[] = [];
  for (const ca of CA) {
    const laSo = veLaSo(ca.laSo);
    const saoTheoCung = saoChinhTheoCung(laSo);
    const vaoKh = { cauHoi: ca.cauHoi, lichSu: ca.lichSu ?? [], saoTheoCung, namXem: NAM_XEM, thangXem: ca.thangXem ?? THANG_XEM };
    const so = lapKeHoachFocused(vaoKh);
    const tenCachCuc = tenCachCucCho(laSo, so.keHoach.cungLienQuan[0]);
    const hai = lapKeHoachFocused({ ...vaoKh, tenCachCuc });
    const keHoach = themLopChoThang(hai.keHoach);
    const namHieuLuc = keHoach.namMucTieu ?? NAM_XEM;
    const thangHieuLuc = (keHoach.thangMucTieu ?? vaoKh.thangXem) as number;
    const { duKien } = chonBoiCanh({ laSo, keHoach, namXem: namHieuLuc, thangXem: thangHieuLuc, focused: true });

    // Kho rỗng do hết giờ câu lệnh (ghi nhận, không giấu): thử lại tối đa 2 lần.
    let kq = await truyHoi(keHoach);
    let soLanThu = 1;
    while (!kq.ungVien.length && soLanThu < 3) {
      soLanThu++;
      kq = await truyHoi(keHoach);
    }
    const goi = dungGoiBangChung(ca.cauHoi, keHoach, duKien, kq.daChon);

    const cung = hai.doiTuong?.cung ?? keHoach.cungLienQuan[0];
    const tenKyVong = [cung, ...(saoTheoCung[cung] ?? [])];
    const kyVong = [...new Map(tenKyVong.map((t) => traThucThe(t)).filter((t) => !!t).map((t) => [t!.id, t!])).values()];

    const theoDoan = await thucTheCuaDoan(kq.ungVien.map((u) => u.chunkId));
    const eTheoDoan = new Map(goi.bangChung.map((e) => [e.chunkId, e.id]));

    const dong: DongThucThe[] = [];
    for (const tt of kyVong) {
      const trongKho = await soDoanTrongKho(tt.id);
      const ve = kq.ungVien.filter((u) => theoDoan.get(u.chunkId)?.has(tt.id));
      const chon = kq.daChon.filter((u) => theoDoan.get(u.chunkId)?.has(tt.id));
      const maE = chon.map((u) => eTheoDoan.get(u.chunkId)).filter((x): x is string => !!x);
      const tot = [...ve].sort((a, b) => b.diemRRF - a.diemRRF)[0];
      const khau: Khau = !trongKho ? 'kien-thuc' : !ve.length ? 'truy-hoi' : !chon.length ? 'chon-loc' : !maE.length ? 'prompt-dung' : 'khong-lo-hong';
      dong.push({
        id: tt.id,
        ten: tt.ten,
        trongKho,
        truyHoi: ve.length,
        hangTotNhat: tot ? { vector: tot.hangVector, tuKhoa: tot.hangTuKhoa, rrf: Math.round(tot.diemRRF * 1e4) / 1e4 } : undefined,
        duocChon: chon.length,
        maE,
        khau,
      });
    }
    let b5: KetQuaCa['buoc5'];
    if (buoc5) {
      const kqF = await traLoiFocused(
        {
          laSo,
          cauHoi: ca.cauHoi,
          namXem: NAM_XEM,
          thangXem: vaoKh.thangXem,
          lichSu: ca.lichSu ?? [],
          ghiNhatKy: false,
          dungModelPhanLoai: false,
          ngonNgu: ca.nhom === 'en' ? 'en' : 'vi',
        },
        phienBanHienTai,
        async () => []
      );
      const claims = kqF.banNhap?.claims ?? [];
      const maDan = new Set(claims.flatMap((c) => c.evidenceIds));
      const chunkF = kqF.vetPreview?.chunkIds ?? [];
      const ttF = await thucTheCuaDoan(chunkF);
      for (const d of dong) {
        d.dungTrongClaim = kqF.van
          ? chunkF.some((c, i) => !!ttF.get(c)?.has(d.id) && maDan.has(`E${String(i + 1).padStart(3, '0')}`))
          : null;
      }
      b5 = {
        status: kqF.van ? 200 : 502,
        lanGoi: kqF.vetFocused?.lanGoi ?? 0,
        thuLai: kqF.vetFocused?.thuLai ?? null,
        soClaim: claims.length,
        maClaim: [...maDan],
        msTong: kqF.vetPreview?.msTong ?? 0,
      };
    }
    const ketLuan = dong.length ? THU_TU[Math.min(...dong.map((d) => THU_TU.indexOf(d.khau)))] : 'khong-lo-hong';

    ketQua.push({
      ma: ca.ma,
      nhom: ca.nhom,
      laSo: ca.laSo,
      cauHoi: ca.cauHoi,
      chuDe: keHoach.chuDe,
      yDinh: keHoach.yDinh,
      cungTrongTam: cung,
      thangMucTieu: keHoach.thangMucTieu,
      thucTheKeHoach: keHoach.thucThe.map((t) => t.id),
      soUngVien: kq.ungVien.length,
      soDaChon: kq.daChon.length,
      soE: goi.bangChung.length,
      soF: duKien.length,
      doTreMs: kq.doTreMs,
      khoTrong: kq.khoTrong,
      soLanThu,
      thucThe: dong,
      ketLuan,
      ...(b5 ? { buoc5: b5 } : {}),
    });
    console.log(`${ca.ma.padEnd(18)} ${keHoach.chuDe.padEnd(10)} cung=${cung.padEnd(10)} UV=${kq.ungVien.length} chọn=${kq.daChon.length} E=${goi.bangChung.length} → ${ketLuan}${soLanThu > 1 ? ` (thử ${soLanThu} lần)` : ''}${b5 ? ` · b5 ${b5.status} gọi=${b5.lanGoi} claim=${b5.maClaim.join(',')} dùng=${dong.filter((d) => d.dungTrongClaim).length}/${dong.length} $${tienDaTinh().toFixed(3)}` : ''}`);
  }

  // Tổng hợp
  const dem = Object.fromEntries(THU_TU.map((k) => [k, ketQua.filter((c) => c.ketLuan === k).length]));
  const tatCaTT = ketQua.flatMap((c) => c.thucThe);
  const demTT = Object.fromEntries(THU_TU.map((k) => [k, tatCaTT.filter((d) => d.khau === k).length]));
  console.log('\nKết luận theo ca:', dem);
  console.log('Theo thực thể kỳ vọng:', demTT);

  const json = arg('--json');
  if (json) writeFileSync(json, JSON.stringify(ketQua, null, 1), 'utf8');

  const xuat = arg('--xuat');
  if (xuat) {
    const L: string[] = [];
    L.push('## Bảng ca\n');
    L.push('| Ca | Nhóm | Câu hỏi | Chủ đề / ý định | Cung trọng tâm | UV / chọn / E / F | Kết luận |');
    L.push('|---|---|---|---|---|---|---|');
    for (const c of ketQua) {
      L.push(`| ${c.ma} | ${c.nhom} | ${c.cauHoi} | ${c.chuDe} / ${c.yDinh}${c.thangMucTieu ? ` · tháng ${c.thangMucTieu}` : ''} | ${c.cungTrongTam} | ${c.soUngVien} / ${c.soDaChon} / ${c.soE} / ${c.soF} | **${c.ketLuan}** |`);
    }
    L.push('\n## Chi tiết từng thực thể kỳ vọng\n');
    L.push(
      buoc5
        ? 'Bước 5 (dùng trong claim): model thật, sau commit D. "có" = một claim dẫn mã E### của đoạn gắn thực thể (đoạn của chính lượt đó); "502" = lượt hỏng, không đo.\n'
        : 'Bước 5 (dùng trong claim): **chưa đo** — chạy lại với `--buoc5`.\n'
    );
    for (const c of ketQua) {
      L.push(`### ${c.ma} — ${c.laSo}\n`);
      if (c.buoc5) {
        const b = c.buoc5;
        L.push(`Lượt model: ${b.status} · ${b.lanGoi} lần gọi${b.thuLai ? ` (viết lại vì ${b.thuLai})` : ''} · ${b.soClaim} claim dẫn ${b.maClaim.join(', ') || '–'} · ${b.msTong} ms\n`);
      }
      L.push('| Thực thể | (1) trong kho | (2) truy hồi về | hạng tốt nhất (vec / từ khoá / RRF) | (3) được chọn | (4) mã E | Khâu | (5) dùng trong claim |');
      L.push('|---|---|---|---|---|---|---|---|');
      for (const d of c.thucThe) {
        const h = d.hangTotNhat ? `${d.hangTotNhat.vector ?? '–'} / ${d.hangTotNhat.tuKhoa ?? '–'} / ${d.hangTotNhat.rrf}` : '–';
        L.push(`| ${d.ten} (${d.id}) | ${d.trongKho} | ${d.truyHoi} | ${h} | ${d.duocChon} | ${d.maE.join(', ') || '–'} | ${d.khau} | ${d.dungTrongClaim === undefined ? '–' : d.dungTrongClaim === null ? '502' : d.dungTrongClaim ? 'có' : 'không'} |`);
      }
      L.push('');
    }
    L.push('## Tổng\n');
    L.push(`- Theo ca: ${THU_TU.map((k) => `${k} ${dem[k]}`).join(' · ')}`);
    L.push(`- Ca phải truy hồi lại vì hết giờ câu lệnh DB: ${ketQua.filter((c) => c.soLanThu > 1).map((c) => `${c.ma} (${c.soLanThu} lần)`).join(', ') || 'không'}`);
    L.push(`- Độ trễ truy hồi (lần cuối) p50/max: ${[...ketQua.map((c) => c.doTreMs)].sort((a, b) => a - b)[Math.floor(ketQua.length / 2)]} / ${Math.max(...ketQua.map((c) => c.doTreMs))} ms`);
    L.push(`- Theo thực thể kỳ vọng (${tatCaTT.length}): ${THU_TU.map((k) => `${k} ${demTT[k]}`).join(' · ')}`);
    if (buoc5) {
      const tt5 = tatCaTT.filter((d) => d.dungTrongClaim === true || d.dungTrongClaim === false);
      const toiPrompt = tt5.filter((d) => d.khau === 'khong-lo-hong');
      const b = ketQua.flatMap((c) => (c.buoc5 ? [c.buoc5] : []));
      const ms = b.map((x) => x.msTong).sort((x, y) => x - y);
      L.push(`- Bước 5: thực thể được claim dẫn ${tt5.filter((d) => d.dungTrongClaim).length}/${tt5.length}; riêng thực thể đã tới prompt ở lượt audit ${toiPrompt.filter((d) => d.dungTrongClaim).length}/${toiPrompt.length}`);
      L.push(`- Lượt model: 502 ${b.filter((x) => x.status === 502).length}/${b.length} · viết lại ${b.filter((x) => x.thuLai).length}/${b.length} · ca có ≥1 claim dẫn E### ${b.filter((x) => x.maClaim.some((m) => m.startsWith('E'))).length}/${b.length} · trễ p50/max ${ms[Math.floor(ms.length / 2)]} / ${ms[ms.length - 1]} ms · tiền $${tienDaTinh().toFixed(4)}`);
    }
    writeFileSync(xuat, L.join('\n') + '\n', 'utf8');
    console.log(`Đã ghi ${xuat}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
