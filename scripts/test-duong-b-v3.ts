/**
 * Kiểm đường B của luận giải V3 — npx tsx scripts/test-duong-b-v3.ts
 *
 * CELES-38 (22/10/2026): đường B tách lập ý khỏi diễn đạt, CHỈ cho bộ so mù A/B. Bộ này kiểm các hàm
 * thuần của bước lọc ý (không gọi model, không chạm DB) và kiểm sản phẩm không thể vô tình đi đường B:
 * cờ `duongB` chỉ được bật từ scripts/.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { docDanY, khoiDienDat, kiemDanY, saoChoDienDat, SYSTEM_LAP_Y, type YLuan } from '../lib/rag/v3/duong-b';
import type { DuKienV3 } from '../lib/rag/v3/du-kien';

let sai = 0;
const kiem = (ten: string, dung: boolean, chiTiet?: unknown) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}${!dung && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
};

const duKien: DuKienV3[] = [
  { id: 'F001', vaiTro: 'cung chính', noiDung: 'Cung Quan Lộc: Tử Vi, Thiên Phủ', sao: ['Tử Vi', 'Thiên Phủ'], cung: 'Quan Lộc' },
  { id: 'F002', vaiTro: 'xung chiếu', noiDung: 'Cung Phu Thê: Phá Quân', sao: ['Phá Quân'], cung: 'Phu Thê' },
  { id: 'F003', vaiTro: 'tam hợp', noiDung: 'Cung Tài Bạch: Vũ Khúc', sao: ['Vũ Khúc'], cung: 'Tài Bạch' },
];
const vao = {
  maDuKien: new Set(duKien.map((d) => d.id)),
  maNguon: new Set(['E001', 'T001']),
  saoDuocPhep: new Set(duKien.flatMap((d) => d.sao)),
};
const y = (o: Partial<YLuan>): YLuan => ({ y: 'một ý', canCu: [], mucChac: 'manh', sao: [], ...o });

// Đọc đầu ra bước lập ý
const doc = docDanY('```json\n{"danY":[{"y":"Hợp làm quản lý","canCu":["F001"],"mucChac":"la","sao":["Tử Vi"]},{"y":""},{"canCu":["F001"]}]}\n```');
kiem('docDanY đọc JSON có rào code, bỏ ý rỗng', doc?.length === 1, doc);
kiem('docDanY: mức chắc lạ thành yeu', doc?.[0].mucChac === 'yeu', doc);
kiem('docDanY: không phải JSON thì null', docDanY('xin chào') === null);

// Lọc ý
const { giu, bo } = kiemDanY(
  [
    y({ y: 'Không mã', canCu: [] }),
    y({ y: 'Mã lạ', canCu: ['F001', 'F099'] }),
    y({ y: 'Thất Sát làm bạn quyết liệt', canCu: ['F001'] }),
    y({ y: 'Ý có sao khai ngoài lá số', canCu: ['F001'], sao: ['Thất Sát'] }),
    y({ y: 'Mạnh đủ căn cứ', canCu: ['F001', 'F002', 'E001'], sao: ['Tử Vi'] }),
    y({ y: 'Mạnh nhưng không có nguồn', canCu: ['F001', 'F002', 'F003'] }),
    y({ y: 'Mạnh một mã', canCu: ['F001', 'F001'] }),
    y({ y: 'Yếu nhiều mã', canCu: ['F001', 'E001', 'T001'], mucChac: 'yeu' }),
  ],
  vao
);
const lyDo = Object.fromEntries(bo.map((b) => [b.y, b.lyDo]));
kiem('bỏ ý không mã', lyDo['Không mã'] === 'khong-ma', lyDo);
kiem('bỏ ý có mã ngoài dữ kiện / nguồn', lyDo['Mã lạ']?.startsWith('ma-la:F099'), lyDo);
kiem('bỏ ý nêu sao ngoài lá số trong câu', lyDo['Thất Sát làm bạn quyết liệt']?.startsWith('sao-ngoai'), lyDo);
kiem('bỏ ý khai sao ngoài lá số', lyDo['Ý có sao khai ngoài lá số']?.startsWith('sao-ngoai'), lyDo);
const muc = Object.fromEntries(giu.map((g) => [g.y, g.mucChac]));
kiem('mạnh giữ khi ≥3 mã có nguồn', muc['Mạnh đủ căn cứ'] === 'manh', muc);
kiem('mạnh hạ thành vừa khi không có nguồn', muc['Mạnh nhưng không có nguồn'] === 'vua', muc);
kiem('mạnh hạ thành yếu khi một mã (mã trùng tính một)', muc['Mạnh một mã'] === 'yeu', muc);
kiem('không bao giờ nâng mức', muc['Yếu nhiều mã'] === 'yeu', muc);

// Mức chắc theo loại căn cứ (celes-domain 22/10)
const loai = kiemDanY(
  [
    y({ y: 'Một mã cung chính', canCu: ['F001'] }),
    y({ y: 'F cùng nguồn bổ trợ', canCu: ['F002', 'E002'] }),
    y({ y: 'F cùng nguồn thật', canCu: ['F002', 'T001'] }),
  ],
  { ...vao, maNguon: new Set(['E001', 'E002', 'T001']), maHoTro: new Set(['E002']), maChinh: new Set(['F001']) }
).giu;
const ml = Object.fromEntries(loai.map((g) => [g.y, g.mucChac]));
kiem('một mã cung chính / cách cục: sàn là vừa', ml['Một mã cung chính'] === 'vua', ml);
kiem('nguồn bổ trợ không nâng lên mạnh', ml['F cùng nguồn bổ trợ'] === 'yeu', ml);
kiem('F + nguồn không bổ trợ: mạnh', ml['F cùng nguồn thật'] === 'manh', ml);

// Sao được nêu ở bước diễn đạt thu về sao của ý đã giữ
const phep = saoChoDienDat([y({ canCu: ['F002'], sao: ['Tử Vi'] })], duKien);
kiem('sao diễn đạt = sao khai + sao của F được dẫn', phep.has('Tử Vi') && phep.has('Phá Quân') && !phep.has('Vũ Khúc'), [...phep]);
const dkTamPhuong: DuKienV3[] = [
  duKien[0],
  { id: 'F004', vaiTro: 'xung chiếu của Quan Lộc', noiDung: 'Cung Phu Thê: Phá Quân', sao: ['Phá Quân'], cung: 'Phu Thê' },
  { id: 'F005', vaiTro: 'tam hợp của Tài Bạch', noiDung: 'Cung Mệnh: Vũ Khúc', sao: ['Vũ Khúc'], cung: 'Mệnh' },
];
const phep2 = saoChoDienDat([y({ canCu: ['F001'] })], dkTamPhuong);
kiem('sao xung chiếu của cung được dẫn vẫn được nêu (luật 17)', phep2.has('Phá Quân') && !phep2.has('Vũ Khúc'), [...phep2]);
kiem('bước lập ý mang luật an toàn', SYSTEM_LAP_Y.includes('D. An toàn'));

const khoi = khoiDienDat(giu);
kiem('khối diễn đạt liệt kê đủ ý đã giữ, kèm mã', giu.every((g) => khoi.includes(g.y) && khoi.includes(g.canCu[0])));
kiem('khối diễn đạt dặn mức chắc cho ý yếu', khoi.includes('có khả năng'));
kiem('ý mạnh vẫn là lời xu hướng, không "nói chắc"', !khoi.includes('[nói chắc]') && khoi.includes('xu hướng'));

// Sản phẩm không đi đường B: ngoài scripts/ không nơi nào bật cờ duongB
const quet = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) return f === 'node_modules' ? [] : quet(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const batCo = ['app', 'lib', 'components']
  .flatMap(quet)
  .filter((p) => /duongB\s*:\s*true/.test(readFileSync(p, 'utf8')));
kiem('không mã sản phẩm nào bật duongB', batCo.length === 0, batCo);

/*
 * Cờ tắt = y như cũ (tích hợp đợt 1, 22/10): chạy luanMotCau với model và DB giả, ghi lại mọi lời gọi
 * model. Không truyền cờ và truyền { duongB: false } phải gửi ĐÚNG cùng chuỗi lời gọi, không có bước
 * lập ý hay khối dàn ý; bật cờ thì lời gọi đầu là bước lập ý.
 */
type LoiGoi = { system: string; user: string };
async function chayVoiModelGia(thuNghiem: { duongB?: boolean }): Promise<LoiGoi[]> {
  const ds: LoiGoi[] = [];
  globalThis.fetch = (async (_url: string, init?: { body?: string }) => {
    const b = JSON.parse(init?.body ?? '{}') as { messages?: { role: string; content: string }[] };
    const tim = (r: string) => b.messages?.find((m) => m.role === r)?.content ?? '';
    ds.push({ system: tim('system'), user: tim('user') });
    return Response.json({
      choices: [{ message: { content: '{"luanGiai":"Một đoạn.","viSao":[],"goiY":[],"danY":[]}' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });
  }) as unknown as typeof fetch;
  const { luanMotCau, CAU_HOI_V3 } = await import('../lib/rag/v3');
  const { dungDuKien } = await import('../lib/rag/v3/du-kien');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const q = CAU_HOI_V3.find((x) => x.id === 'SN01')!;
  const chuanBi = { duKien: dungDuKien(laSo, q, 2026), tv: null, nguon: [], msTruyHoi: 0 };
  // system cố định để khỏi đọc mẫu giọng từ DB — cùng giá trị cho mọi lượt
  await luanMotCau({ laSo, q, namXem: 2026, nho: new Map(), chuanBi, thuNghiem: { ...thuNghiem, system: 'SYS-GIA' } }).catch(() => undefined);
  return ds;
}

async function kiemCoTat() {
  const { _thayAdminChoTest } = await import('../lib/supabase/admin');
  const bang = (table: string) => {
    const kq = {
      data: table === 'ai_model_configs' ? [{ id: '0', provider: 'groq', model: 'gia', bat: true, uu_tien: 1, api_key_ma: null, ghi_chu: null }] : [],
      error: null,
    };
    const q: object = new Proxy({}, {
      get: (_t, k) =>
        k === 'then' ? (r: (x: typeof kq) => unknown) => Promise.resolve(kq).then(r)
        : k === 'maybeSingle' || k === 'single' ? async () => ({ data: null, error: null })
        : () => q,
    });
    return q;
  };
  _thayAdminChoTest({ from: bang, rpc: async () => ({ error: null }) } as never);
  for (const k of ['AI_NHAN', 'AI_NGAN_SACH_TOKEN', 'AI_MUC_DICH', 'AI_GHIM_MODEL', 'AI_TRAN_USD']) delete process.env[k];
  process.env.GROQ_API_KEY = 'offline-only';
  const khong = await chayVoiModelGia({});
  const tat = await chayVoiModelGia({ duongB: false });
  const bat = await chayVoiModelGia({ duongB: true });
  kiem('cờ tắt: có gọi model', khong.length > 0, khong.length);
  kiem('cờ tắt: chuỗi lời gọi y như không truyền cờ', JSON.stringify(khong) === JSON.stringify(tat), [khong.length, tat.length]);
  kiem('cờ tắt: không bước lập ý, không khối dàn ý', tat.every((g) => g.system !== SYSTEM_LAP_Y && !g.user.includes('DÀN Ý ĐÃ DUYỆT')));
  kiem('cờ bật: lời gọi đầu là bước lập ý', bat[0]?.system === SYSTEM_LAP_Y, bat[0]?.system.slice(0, 60));
  _thayAdminChoTest(null);
}

kiemCoTat()
  .catch((e) => kiem('chạy luanMotCau với model giả', false, String(e)))
  .finally(() => {
    console.log(sai ? `\n${sai} kiểm SAI` : '\nĐường B: ĐẠT');
    process.exit(sai ? 1 : 0);
  });
