/**
 * ĐO THẬT "MỌI SAO, NGHĨA THEO CUNG, CÓ XUNG CHIẾU" (CEL-179) — model thật, chạy tay.
 *
 *   Sinh:  npx tsx scripts/eval-phu-du-kien.ts --sinh --ra <tệp.json> [--so-la 3] [--env <đường dẫn .env.local>]
 *   Chấm:  npx tsx scripts/eval-phu-du-kien.ts --cham <cũ.json> <mới.json> [--giam-khao provider|model]
 *
 * test-phu-du-kien.ts (offline) chỉ chứng minh dữ kiện ĐÃ TỚI model. Bài này đo model có DÙNG nó trong
 * bài thật không: cùng lá số, cùng câu, sinh bằng mã cũ và mã mới rồi so.
 *
 * - Lá số: tự chọn từ 60 mẫu đóng băng (scripts/mau-ansao.json — không phải người thật) những lá có cung
 *   chính nhiều phụ tinh nặng và cung xung chiếu có sao hung chưa đắc địa — đúng ca CEL-179 nhắm tới.
 * - Câu: 5 câu có cung chính ≠ Mệnh (TQ07 TD01 SN01 TB04 CC02) — nơi lỗi "Tả Hữu ở Phu Thê luận như ở
 *   Mệnh" xảy ra.
 * - Muốn sinh bằng mã cũ: dựng git worktree của commit cũ, chép tệp này vào scripts/ của worktree, chạy
 *   --sinh với cwd là worktree và --env trỏ về .env.local của kho chính. Phần --sinh chỉ dùng API có ở
 *   cả hai bản (luanNhieuCau, lapLaSo).
 *
 * Chấm bằng mã (tất định): % bài có dàn ý trích F### xung chiếu; số phụ tinh cung chính được nêu ở phần
 * vì sao; số sao hung xung chiếu được nêu; tỉ lệ phải sửa; token.
 * Chấm bằng giám khảo (model KHÁC model viết, không biết bài nào là bản nào), có đáp án sao lấy từ engine:
 *   saiCung (câu đọc sao của cung ≠ Mệnh thành tính cách người hỏi), xungChieu 0–2, phuTinh (số phụ tinh
 *   cung chính bài phản ánh đúng), bia (chi tiết bịa: ngoại tình, bệnh, tai nạn…), diem 1–5 "đúng theo cung".
 * Giám khảo mặc định gpt-oss-120b (Groq ↔ Cerebras, free tier, luân phiên khi chạm giới hạn tốc độ). Đừng dùng
 *   gpt-4o-mini (01/10: gắn cờ cả câu đọc ĐÚNG cung Phu Thê, chép câu mẫu vào đáp án) và đừng để luna tự chấm.
 *   Điểm 1–5 lệch giữa các giám khảo tới ±0,7 trên 15 bài — tin chỉ số bằng mã và xungChieu (ba giám khảo cùng chiều).
 * Đầu ra có bài viết → để ngoài repo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};
for (const d of readFileSync(thamSo('env', '.env.local'), 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}
process.env.AI_NHAN ??= 'test';
// Giám khảo chỉ định không gọi được thì báo lỗi, không lùi sang model viết
process.env.AI_KHONG_LUI ??= '1';
process.env.AI_NGAN_SACH_TOKEN ??= thamSo('ngan-sach', '1500000');

const CAU = ['TQ07', 'TD01', 'SN01', 'TB04', 'CC02'];
const CUNG_CHINH: Record<string, string> = { TQ07: 'Phu Thê', TD01: 'Phu Thê', SN01: 'Quan Lộc', TB04: 'Tài Bạch', CC02: 'Tử Tức' };
const HUNG = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Hóa Kỵ', 'Thiên Hình', 'Đại Hao', 'Tiểu Hao', 'Thiên Khốc', 'Thiên Hư', 'Cô Thần', 'Quả Tú', 'Kiếp Sát', 'Lưu Hà', 'Phá Toái'];
const DAC = ['M', 'V', 'D', 'Đ'];

type Sao = { ten: string; loai: string; doSang?: string | null };
type CungT = { tenCung: string; chiIndex: number; sao: Sao[] };
type Bai = {
  khoa: string; id: string; laSo: string; cungChinh: string; luanGiai: string; viSao: string; goiY: string;
  danY: { y: string; canCu: string[] }[]; duKien: { id: string; vaiTro: string; cung?: string }[];
  token?: { vao: number; ra: number; dem: number }; model: string; soLanGoi: number; loiBanDau?: unknown[]; dat: boolean; ms: number;
};

const mau = () => Object.keys(JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>);
const moLa = (k: string) => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return { ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' };
};

async function sinh() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau } = await import('../lib/rag/v3');
  const ra = thamSo('ra');
  // Chọn lá: điểm = phụ tinh nặng ở cung chính + sao hung chưa đắc ở xung chiếu, cộng trên 5 câu
  const diem = mau().map((k) => {
    const la = lapLaSo(moLa(k)) as unknown as { cungs: CungT[] };
    let d = 0;
    for (const q of CAU) {
      const c = la.cungs.find((x) => x.tenCung === CUNG_CHINH[q])!;
      const x = la.cungs[(c.chiIndex + 6) % 12];
      d += c.sao.filter((s) => s.loai !== 'chinh-tinh').length * 0.2;
      d += x.sao.filter((s) => HUNG.includes(s.ten) && !DAC.includes(s.doSang ?? '')).length;
    }
    return { k, d };
  });
  const chon = diem.sort((a, b) => b.d - a.d || a.k.localeCompare(b.k)).slice(0, +thamSo('so-la', '3')).map((x) => x.k);
  console.log('Lá số chọn:', chon.join(' · '));
  const bai: Bai[] = [];
  for (const k of chon) {
    const t = Date.now();
    const kq = await luanNhieuCau({ laSo: lapLaSo(moLa(k)), ids: CAU, namXem: 2026, songSong: CAU.length });
    for (const r of kq)
      bai.push({
        khoa: `${k}|${r.id}`, id: r.id, laSo: k, cungChinh: CUNG_CHINH[r.id], luanGiai: r.luanGiai, viSao: r.viSao ?? '', goiY: r.goiY ?? '',
        danY: r.danY, duKien: r.duKien.map((d) => ({ id: d.id, vaiTro: d.vaiTro, cung: d.cung })),
        token: r.token, model: r.model, soLanGoi: r.soLanGoi, loiBanDau: r.loiBanDau, dat: r.dat, ms: r.ms,
      });
    console.log(`  ${k}: ${kq.filter((r) => r.luanGiai).length}/${CAU.length} bài · ${Math.round((Date.now() - t) / 1000)}s`);
  }
  writeFileSync(ra, JSON.stringify({ bai }, null, 1));
  const tk = bai.reduce((a, b) => ({ vao: a.vao + (b.token?.vao ?? 0), ra: a.ra + (b.token?.ra ?? 0), dem: a.dem + (b.token?.dem ?? 0) }), { vao: 0, ra: 0, dem: 0 });
  console.log(`Đã ghi ${ra} · token vào ${tk.vao} (đệm ${tk.dem}) · ra ${tk.ra} · model ${[...new Set(bai.map((b) => b.model))].join(', ')}`);
}

async function cham() {
  const i = process.argv.indexOf('--cham');
  const [tepCu, tepMoi] = [process.argv[i + 1], process.argv[i + 2]];
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const giamKhao = thamSo('giam-khao', 'groq|openai/gpt-oss-120b,cerebras|gpt-oss-120b').split(',');
  const ban = { cu: (JSON.parse(readFileSync(tepCu, 'utf8')).bai as Bai[]), moi: (JSON.parse(readFileSync(tepMoi, 'utf8')).bai as Bai[]) };
  // model ghi trong bài có dạng "provider/model", giám khảo trả "provider|model"
  const modelViet = new Set([...ban.cu, ...ban.moi].map((b) => b.model.replace('/', '|')));

  const saoCua = (c: CungT) => c.sao.map((s) => `${s.ten}${s.doSang ? ` (${s.doSang})` : ''}`).join(', ') || '(vô chính diệu, không sao)';
  const dapAn = (b: Bai) => {
    const la = lapLaSo(moLa(b.laSo)) as unknown as { cungs: CungT[] };
    const c = la.cungs.find((x) => x.tenCung === b.cungChinh)!;
    const x = la.cungs[(c.chiIndex + 6) % 12];
    const th = [la.cungs[(c.chiIndex + 4) % 12], la.cungs[(c.chiIndex + 8) % 12]];
    return { c, x, th, text: `Cung chính của câu hỏi: ${c.tenCung} — sao: ${saoCua(c)}\nCung xung chiếu (đối diện): ${x.tenCung} — sao: ${saoCua(x)}\nTam hợp: ${th.map((t) => `${t.tenCung} — ${saoCua(t)}`).join(' | ')}` };
  };

  const SYSTEM = `Bạn là chuyên gia Tử Vi Nam phái, chấm bài luận theo ĐÚNG CUNG. Nguyên tắc: nghĩa một sao phụ thuộc cung nó đứng — sao ở cung Phu Thê nói về người phối ngẫu và chuyện hôn nhân, ở Quan Lộc nói về công việc, ở Tài Bạch nói về tiền, ở Tử Tức nói về con cái; KHÔNG được đọc thành tính cách của chính người hỏi (đó là việc của cung Mệnh). Cung xung chiếu tác động mạnh thứ hai lên cung chính. Sao hung đắc địa (M/V/Đ) không bị coi là kéo xấu. Chỉ trả JSON.`;
  const viec = (b: Bai, d: ReturnType<typeof dapAn>) => `ĐÁP ÁN SAO (từ engine):\n${d.text}\n\nCÂU HỎI: ${b.id}\n\nBÀI LUẬN:\n${b.luanGiai}\n\nPHẦN VÌ SAO:\n${b.viSao}\n\nChấm theo năm mục:
1. saiCung — các câu (trích nguyên văn từ bài) đem sao của cung chính hoặc cung xung chiếu ra nói thành tính cách, năng lực của CHÍNH người hỏi, trong khi phải nói về mặt đời của cung (bạn đời, công việc, tiền, con…). Câu nói về bạn đời / con / công việc / tiền là ĐÚNG, không đưa vào. Không có thì mảng rỗng.
2. xungChieu — 0: bài không phản ánh cung xung chiếu; 1: có nhắc nhưng mờ hoặc sai hướng; 2: phản ánh đúng tác động của cung đối diện lên chuyện đang hỏi.
3. phuTinh — số phụ tinh (không tính chính tinh) của CUNG CHÍNH mà bài phản ánh đúng nghĩa theo cung.
4. bia — các câu (trích nguyên văn) khẳng định chi tiết không có căn cứ trong đáp án: ngoại tình, bệnh tật, tai nạn, mất mát, con số cụ thể. Không có thì mảng rỗng.
5. diem — 1 đến 5, đúng theo cung: 5 = mọi nét đọc theo đúng mặt đời của cung, có cả cung chính lẫn xung chiếu; 1 = đọc như lá số Mệnh chung chung.

Trả đúng một object JSON với khoá saiCung, xungChieu, phuTinh, bia, diem.}`;

  const chamMot = async (b: Bai) => {
    const d = dapAn(b);
    // Giám khảo free tier hay chạm giới hạn tốc độ: luân phiên các giám khảo, nghỉ rồi thử lại
    for (let lan = 0; lan < 6; lan++) {
      try {
        if (lan) await new Promise((r) => setTimeout(r, 15_000));
        const g = await goiVoiFallback({ system: SYSTEM, user: viec(b, d), maxTokens: 2500, temperature: 0 }, giamKhao[lan % giamKhao.length], 120_000);
        if (modelViet.has(`${g.provider}|${g.model}`)) continue;
        const o = docObjectJson(g.text) as { saiCung?: string[]; xungChieu?: number; phuTinh?: number; bia?: string[]; diem?: number } | null;
        if (o) return { ...o, gk: `${g.provider}|${g.model}`, tk: { vao: g.tokensIn ?? 0, ra: g.tokensOut ?? 0 } };
      } catch (e) {
        console.warn(`  giám khảo lỗi ${b.khoa}: ${(e as Error).message.slice(0, 80)}`);
      }
    }
    return null;
  };

  // Tất định
  const doMa = (bs: Bai[]) => {
    let coXung = 0, phuNeu = 0, phuCo = 0, hungNeu = 0, hungCo = 0, sua = 0;
    for (const b of bs) {
      const d = dapAn(b);
      const fx = b.duKien.find((x) => x.vaiTro.startsWith('xung chiếu'))?.id;
      if (fx && b.danY.some((y) => y.canCu.includes(fx))) coXung++;
      const phu = d.c.sao.filter((s) => s.loai !== 'chinh-tinh' && s.loai !== 'tu-hoa').map((s) => s.ten);
      phuCo += phu.length;
      phuNeu += phu.filter((t) => b.viSao.includes(t)).length;
      const hung = d.x.sao.filter((s) => HUNG.includes(s.ten) && !DAC.includes(s.doSang ?? '')).map((s) => s.ten);
      hungCo += hung.length;
      hungNeu += hung.filter((t) => b.viSao.includes(t)).length;
      if (b.soLanGoi > 1) sua++;
    }
    const n = bs.length;
    return { bai: n, xungTrongDanY: `${coXung}/${n}`, phuTinhCungChinhONeuViSao: `${phuNeu}/${phuCo}`, hungXungNeuViSao: `${hungNeu}/${hungCo}`, phaiSua: `${sua}/${n}` };
  };

  // Chấm trộn thứ tự, giám khảo không biết bản
  const tatCa = [...ban.cu.map((b) => ({ b, ban: 'cu' as const })), ...ban.moi.map((b) => ({ b, ban: 'moi' as const }))].filter((x) => x.b.luanGiai);
  tatCa.sort((a, b) => (a.b.khoa + a.ban).length % 3 - (b.b.khoa + b.ban).length % 3 || a.b.khoa.localeCompare(b.b.khoa));
  const kq: { ban: 'cu' | 'moi'; khoa: string; o: Awaited<ReturnType<typeof chamMot>> }[] = [];
  for (let j = 0; j < tatCa.length; j += 2) {
    const lo = await Promise.all(tatCa.slice(j, j + 2).map(async (x) => ({ ban: x.ban, khoa: x.b.khoa, o: await chamMot(x.b) })));
    kq.push(...lo);
    process.stdout.write(`  chấm ${kq.length}/${tatCa.length}\r`);
  }
  const tong = (b: 'cu' | 'moi') => {
    const r = kq.filter((x) => x.ban === b && x.o);
    const tb = (f: (o: NonNullable<(typeof r)[0]['o']>) => number) => (r.reduce((a, x) => a + f(x.o!), 0) / (r.length || 1)).toFixed(2);
    return {
      daCham: r.length, diemDungCung: tb((o) => o.diem ?? 0), xungChieu: tb((o) => o.xungChieu ?? 0), phuTinh: tb((o) => o.phuTinh ?? 0),
      saiCung: r.reduce((a, x) => a + (x.o!.saiCung?.length ?? 0), 0), bia: r.reduce((a, x) => a + (x.o!.bia?.length ?? 0), 0),
      giamKhao: [...new Set(r.map((x) => x.o!.gk))].join(', '),
    };
  };
  const ketQua = { ma: { cu: doMa(ban.cu), moi: doMa(ban.moi) }, giamKhao: { cu: tong('cu'), moi: tong('moi') }, modelViet: [...modelViet] };
  console.log('\n' + JSON.stringify(ketQua, null, 1));
  writeFileSync(tepMoi.replace(/\.json$/, '-cham.json'), JSON.stringify({ ketQua, chiTiet: kq }, null, 1));
}

(process.argv.includes('--sinh') ? sinh() : cham()).catch((e) => {
  console.error(e);
  process.exit(1);
});
