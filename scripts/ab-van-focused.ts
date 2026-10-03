/**
 * A/B văn phong đường Focused (CEL-186 vé B, 04/10/2026) — GỌI MODEL THẬT, KHÔNG nằm trong CI.
 *
 * Câu hỏi: hợp đồng `cau` mới (nghĩa đời thường trước, tên sao sau, ≤ 1–2 tên mỗi lượt NORMAL,
 * một mạch) + `VAN_PHONG_CELES_CHAT` có viết hay hơn bản cũ ("nêu tên sao rồi dịch") mà KHÔNG
 * tăng bịa / thử lại / 502 không.
 *
 * Hai nhánh chạy bằng HAI PHIÊN BẢN MÃ, không phải một cờ trong mã sản phẩm — prompt cũ không sống
 * lại trong Production chỉ để đo:
 *   1. Ở commit cũ:  npx tsx scripts/ab-van-focused.ts --nhan cu  --xuat <thư mục>/ab-cu.json
 *   2. Ở commit mới: npx tsx scripts/ab-van-focused.ts --nhan moi --xuat <thư mục>/ab-moi.json
 *   3. So + xuất bản chấm mù (không gọi model):
 *      npx tsx scripts/ab-van-focused.ts --so <ab-cu.json> <ab-moi.json> --mu <thư mục>
 *      → `mu.md` (cặp X/Y đã xáo, đưa reviewer) và `mu-khoa.json` (X/Y là bản nào — KHÔNG đưa reviewer).
 * "Cùng dữ kiện" được KIỂM, không giả định: bước 3 so danh sách mã F### và hướng đã chốt của từng ca
 * giữa hai tệp; ca lệch bị loại khỏi bảng so và in ra.
 *
 * Bắt buộc như `eval-focused.ts`: AI_GHIM_MODEL, AI_TRAN_USD (≤ 2, tính chung ngân sách eval vé B),
 * AI_GIA_VAO_USD, AI_GIA_RA_USD. Lá số đóng băng (`mau-ansao.json`), không dữ liệu người dùng.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { bayGioAm } from '../lib/tuvi/bay-gio';
import { phienBanHienTai, traLoiCoCanCu, type DauVaoTraLoi, type KetQuaTraLoi } from '../lib/rag/tra-loi';
import type { KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';
import { goiCoPhucDuc, khoaTen, quetTen, tapTenTuGoi, tenNgoaiTap } from '../lib/rag/focused/quet-ten';
import { soAmTiet } from '../lib/rag/focused/kiem';
import { coCapPhanBiet } from '../lib/rag/van-phong';
import { tienDaTinh, VuotNganSachError } from '../lib/ai/fallback';

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};

/* ------------------------------------------------------------------ ca */

/** 12 câu canonical: đủ khuôn A/B/C/F1, năm / tháng âm / tháng dương, mong và lo. */
const CA: { ma: string; cauHoi: string }[] = [
  { ma: 'nam-cong-viec', cauHoi: 'Năm nay công việc của tôi thế nào?' },
  { ma: 'nam-tien', cauHoi: 'Tiền bạc năm nay của tôi ra sao?' },
  { ma: 'nguoi-yeu', cauHoi: 'sắp tới tôi có người yêu ko? tương lai gần' },
  { ma: 'suc-khoe', cauHoi: 'Sức khỏe của tôi năm nay thế nào?' },
  { ma: 'gia-dao', cauHoi: 'Năm nay chuyện nhà cửa, gia đạo của tôi thế nào?' },
  { ma: 'thang-chuc', cauHoi: 'Năm nay tôi có được thăng chức không?' },
  { ma: 'mat-tien', cauHoi: 'Năm nay tôi có bị mất tiền không?' },
  { ma: 'chuyen-viec', cauHoi: 'Năm nay tôi có nên chuyển sang công ty mới không?' },
  { ma: 'may-thang-toi', cauHoi: 'Mấy tháng tới công việc của tôi thế nào?' },
  { ma: 'thang-sau', cauHoi: 'Tháng sau chuyện tình cảm của tôi thế nào?' },
  { ma: 'thang-duong-qua', cauHoi: 'Tháng 6 năm 2025 công việc của tôi thế nào?' },
  { ma: 'vo-chong', cauHoi: 'Tôi với chồng tôi năm nay có hợp nhau không?' },
];

const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
const khoa = Object.keys(mau);
const lapTu = (k: string): LaSo => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
};
const BAY_GIO = bayGioAm();
// Hai lá số cố định (cùng cách chọn với `eval-focused.ts`, vị trí 0 và 3 trong 6).
const LA_SO = [khoa[0], khoa[Math.floor((3 * khoa.length) / 6)]];

/* ----------------------------------------------------------------- đo */

interface Bai {
  ma: string;
  laSo: string;
  cauHoi: string;
  van: string;
  /** Mã F### của gói, đã sắp — để kiểm "cùng dữ kiện" */
  goi: string[];
  /** Nội dung từng dữ kiện ("F001: …") — cho người chấm soát "đúng dữ kiện" */
  duKienChu: string[];
  /** Khuôn đã phân (A/B/C…) — cùng câu, cùng lá số thì phải trùng giữa hai nhánh */
  huong: string | null;
  loi502: boolean;
  lanGoi: number;
  thuLai: string | null;
  duPhong: boolean;
  /** Câu guard bỏ, kèm lý do */
  boCau: string[];
  /** Tên sao / cách cục nêu trong phần model viết (không tính tên cung) */
  soTen: number;
  tenNgoaiGoi: string[];
  /** Câu thân mở bằng tên sao */
  moBangTen: number;
  soCauThan: number;
  canCu: number;
  amTiet: number;
  capPhanBiet: boolean;
}

function do1(ma: string, laSo: string, cauHoi: string, kq: KetQuaFocused): Bai {
  const goi = kq.goi;
  const pd = goiCoPhucDuc(goi.duKien);
  const tap = tapTenTuGoi(goi.duKien);
  const vet = kq.vetFocused;
  const than = (kq.coCauTruc?.yChinh ?? []).map((y) => y.noiDung);
  const phanModel = [vet?.dungDuPhong ? '' : kq.coCauTruc?.ketLuan ?? '', ...than].filter(Boolean);
  const ten = (s: string) => quetTen(s, pd).filter((t) => t.loai !== 'cung');
  return {
    ma,
    laSo,
    cauHoi,
    van: kq.van,
    goi: goi.duKien.map((d) => d.id).sort(),
    duKienChu: goi.duKien.map((d) => `${d.id}: ${d.noiDung}`),
    huong: kq.phienBan.focused ?? null,
    loi502: !kq.van,
    lanGoi: vet?.lanGoi ?? 0,
    thuLai: vet?.thuLai ?? null,
    duPhong: !!vet?.dungDuPhong,
    boCau: (vet?.boCau ?? []).map((b) => `${b.lyDo.join(',')}: ${b.noiDung}`),
    soTen: phanModel.reduce((n, c) => n + ten(c).length, 0),
    tenNgoaiGoi: phanModel.flatMap((c) => tenNgoaiTap(c, tap, pd)),
    // Tên đứng trong ba từ đầu câu = câu mở bằng lá số chứ không mở bằng người đọc.
    moBangTen: than.filter((c) => ten(c.split(/\s+/).slice(0, 3).join(' ')).length > 0).length,
    soCauThan: than.length,
    canCu: (kq.coCauTruc?.yChinh ?? []).filter((y) => (y.maDuKien ?? []).length > 0).length,
    amTiet: soAmTiet(kq.van),
    capPhanBiet: coCapPhanBiet(phanModel.join(' ')),
  };
}

/* ---------------------------------------------------------------- chạy */

async function chay(nhan: string, tep: string) {
  const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
  if (thieu.length) throw new Error(`Thiếu ${thieu.join(', ')} — A/B phải ghim model và đặt trần tiền.`);
  if (Number(process.env.AI_TRAN_USD) > 2) throw new Error('AI_TRAN_USD vượt $2.');
  for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
    const s = d.trim();
    if (!s || s.startsWith('#')) continue;
    const [k, ...p] = s.split('=');
    const v = p.join('=').trim();
    if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
  }
  process.env.CELES_FOCUSED_CHAT = '1';
  process.env.AI_NHAN = 'test';

  const ra: Bai[] = [];
  const ghi = () =>
    writeFileSync(
      tep,
      JSON.stringify({ nhan, luc: new Date().toISOString(), model: process.env.AI_GHIM_MODEL, phienBan: phienBanHienTai, tien: tienDaTinh(), bai: ra }, null, 2)
    );
  try {
    for (const ca of CA) {
      for (const k of LA_SO) {
        const vao: DauVaoTraLoi = { laSo: lapTu(k), cauHoi: ca.cauHoi, namXem: BAY_GIO.nam, thangXem: BAY_GIO.thang, lichSu: [], ghiNhatKy: false };
        const kq = (await traLoiCoCanCu(vao)) as KetQuaTraLoi as KetQuaFocused;
        const b = do1(ca.ma, k, ca.cauHoi, kq);
        ra.push(b);
        console.log(`  ${ca.ma.padEnd(16)} ${b.loi502 ? '502' : `${b.soCauThan}c ${b.amTiet}at ${b.soTen}ten`}  $${tienDaTinh().toFixed(3)}`);
      }
    }
  } catch (e) {
    if (!(e instanceof VuotNganSachError)) throw e;
    console.error(`Dừng: vượt trần $${process.env.AI_TRAN_USD}.`);
  }
  ghi();
  console.log(`Ghi ${tep} · ${ra.length} bài · $${tienDaTinh().toFixed(4)}`);
}

/* ----------------------------------------------------------------- so */

function tongHop(ds: Bai[]) {
  const n = ds.length || 1;
  const coVan = ds.filter((b) => !b.loi502);
  const m = coVan.length || 1;
  const tb = (f: (b: Bai) => number) => (coVan.reduce((s, b) => s + f(b), 0) / m).toFixed(2);
  return {
    bai: ds.length,
    loi502: ds.filter((b) => b.loi502).length,
    thuLai: `${ds.filter((b) => b.thuLai).length}/${n}`,
    duPhong: ds.filter((b) => b.duPhong).length,
    cauBiBo: ds.reduce((s, b) => s + b.boCau.length, 0),
    tenNgoaiGoi: ds.reduce((s, b) => s + b.tenNgoaiGoi.length, 0),
    tenTb: tb((b) => b.soTen),
    baiQua2Ten: coVan.filter((b) => b.soTen > 2).length,
    moBangTenTb: tb((b) => b.moBangTen),
    canCuTb: tb((b) => b.canCu),
    amTietTb: tb((b) => b.amTiet),
    capPhanBiet: `${coVan.filter((b) => b.capPhanBiet).length}/${m}`,
  };
}

/** Xáo tất định (LCG) — chạy lại ra đúng bản mù cũ. */
function xao(n: number, hat = 20261004): boolean[] {
  let s = hat;
  return Array.from({ length: n }, () => {
    // Math.imul: nhân thường vượt 2^53 thì mất bit thấp, cả dãy ra cùng một phía.
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return ((s >>> 16) & 1) === 0;
  });
}

function so(tepCu: string, tepMoi: string, thuMuc: string | null) {
  const cu = JSON.parse(readFileSync(tepCu, 'utf8')) as { bai: Bai[]; phienBan: unknown };
  const moi = JSON.parse(readFileSync(tepMoi, 'utf8')) as { bai: Bai[]; phienBan: unknown };
  const khoaBai = (b: Bai) => `${b.ma}·${b.laSo}`;
  const mMoi = new Map(moi.bai.map((b) => [khoaBai(b), b]));
  const cap: [Bai, Bai][] = [];
  for (const a of cu.bai) {
    const b = mMoi.get(khoaBai(a));
    if (!b) continue;
    if (a.goi.join() !== b.goi.join() || a.huong !== b.huong) {
      console.log(`LỆCH DỮ KIỆN, bỏ khỏi so: ${khoaBai(a)}`);
      continue;
    }
    cap.push([a, b]);
  }
  console.log(`Cặp cùng dữ kiện: ${cap.length}/${cu.bai.length}`);
  console.table({ cu: tongHop(cap.map((c) => c[0])), moi: tongHop(cap.map((c) => c[1])) });
  if (!thuMuc) return;

  const dao = xao(cap.length);
  const khoaMu: Record<string, { X: string; Y: string }> = {};
  const md: string[] = [
    '# Chấm mù văn Focused — X / Y',
    '',
    'Mỗi cặp: cùng câu hỏi, cùng lá số, cùng dữ kiện và hướng đã chốt. Thứ tự X / Y đã xáo ngẫu nhiên theo từng cặp.',
    'Câu đầu có thể là câu do hệ thống viết sẵn (quy đổi tháng, nhắc tháng đã qua) — giống nhau ở hai bản, không chấm.',
    '',
  ];
  cap.forEach(([a, b], i) => {
    const id = `C${String(i + 1).padStart(2, '0')}`;
    const [x, y] = dao[i] ? [b, a] : [a, b];
    khoaMu[id] = { X: dao[i] ? 'moi' : 'cu', Y: dao[i] ? 'cu' : 'moi' };
    md.push(`## ${id} — ${a.cauHoi}`, '', `**X:** ${x.van || '(502 — không có văn)'}`, '', `**Y:** ${y.van || '(502 — không có văn)'}`, '');
  });
  writeFileSync(join(thuMuc, 'mu.md'), md.join('\n'));
  // Dữ kiện giống nhau ở hai bản — đưa người chấm mà không lộ X/Y.
  const dk = ['# Dữ kiện từng cặp (giống nhau ở X và Y)', ''];
  cap.forEach(([a], i) => {
    dk.push(`## C${String(i + 1).padStart(2, '0')} — ${a.cauHoi} · lá số ${a.laSo}`, '', ...(a.duKienChu ?? []).map((d) => `- ${d}`), '');
  });
  writeFileSync(join(thuMuc, 'mu-du-kien.md'), dk.join('\n'));
  writeFileSync(join(thuMuc, 'mu-khoa.json'), JSON.stringify(khoaMu, null, 2));
  console.log(`Ghi ${join(thuMuc, 'mu.md')} và mu-khoa.json`);
}

/* ---------------------------------------------------------------- main */

const iSo = process.argv.indexOf('--so');
if (iSo !== -1) {
  so(process.argv[iSo + 1], process.argv[iSo + 2], arg('--mu'));
} else {
  const nhan = arg('--nhan');
  const tep = arg('--xuat');
  if (!nhan || !tep) {
    console.error('Cần --nhan <cu|moi> --xuat <tệp.json>, hoặc --so <cu.json> <moi.json> [--mu <thư mục>].');
    process.exit(2);
  }
  chay(nhan, tep).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
