/**
 * ĐO LÁT CẮT "SỰ NGHIỆP — LÁ SỐ GỐC" — KIEN-TRUC-LUAN-GIAI.md mục 11.2.
 *
 *   npx tsx scripts/do-thu-vien.ts --ra <thư mục NGOÀI repo> [--nghiem-thu] [--so-la N] [--cau SN01,SN02] [--chi-do-phu] [--chi-b B2] [--dot sn-2]
 *
 * --chi-b <tên>: chỉ sinh lại bản có thư viện (sau khi sửa khâu chọn / thư viện), ghi
 *   <tên>.json + chi-tiet-<tên>.json; bản A giữ nguyên từ lượt trước để so cùng mốc.
 *
 * Sinh bản A (luồng v3 hiện tại) và bản B (A + thư viện) trên cùng 12 lá số TỔNG
 * HỢP × 5 câu (SN01 SN02 SN03 SN05 SN06), rồi tính tiêu chí 1, 2, 3, 5. Tiêu chí 4
 * (so mù) chạy riêng:
 *   npx tsx scripts/so-sanh-v3.ts <ra>/A.json <ra>/B.json --du
 *
 * Lá số sinh bằng hạt giống cố định — không phải lá số thật. Đầu ra có bài viết
 * và mã căn cứ, không có câu trích sách; vẫn ghi ra ngoài repo cho gọn.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { boLaSo, CAU_LAT_CAT } from './lat-cat-su-nghiep';
import { batDauLuotThu } from './thu-chung';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}
batDauLuotThu('do-thu-vien');
const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

const CUNG_DO_PHU = ['Quan Lộc', 'Mệnh', 'Tài Bạch', 'Thiên Di'];

const p95 = (ds: number[]) => {
  const s = [...ds].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)] ?? 0;
};

async function main() {
  const ra = thamSo('ra');
  if (!ra) throw new Error('Thiếu --ra <thư mục ngoài repo>');
  mkdirSync(ra, { recursive: true });
  /*
   * MẪU NHỎ MẶC ĐỊNH (26/09/2026 — tiết kiệm token test): thăm dò 6 lá × 3 câu = 18 cặp. Chỉ
   * --nghiem-thu mới chạy đủ 12 lá × 5 câu = 60 cặp (ngưỡng 11.2). Kết quả phẳng thấy rõ từ 18 cặp.
   */
  const nghiemThu = process.argv.includes('--nghiem-thu');
  const soLa = Number(thamSo('so-la', nghiemThu ? '12' : '6'));
  const CAU = nghiemThu ? CAU_LAT_CAT : (thamSo('cau') || 'SN01,SN02,SN05').split(',');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau } = await import('../lib/rag/v3');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  const { khopThuVien } = await import('../lib/rag/thu-vien/khop');
  const { saoCuaMuc } = await import('../lib/rag/thu-vien/kieu');
  type KetQuaCauV3 = import('../lib/rag/v3').KetQuaCauV3;

  // --dot: chỉ dùng một đợt trích (so đợt mới với mốc mà không lẫn đợt cũ)
  const thuVien = await docThuVien('su-nghiep', thamSo('dot') || undefined);
  if (!thuVien.length) throw new Error('Thư viện rỗng — chạy scripts/dung-thu-vien.ts trước');
  const la = boLaSo(soLa);
  console.log(`Thư viện ${thuVien.length} mục · ${la.length} lá số × ${CAU.length} câu${nghiemThu ? ' (nghiệm thu)' : ' (thăm dò — thêm --nghiem-thu để chạy đủ 60 cặp)'}`);

  // ---- Tiêu chí 3: độ phủ (không gọi model) ----
  let donVi = 0, phu = 0;
  for (const l of la) {
    const laSo = lapLaSo(l);
    for (const c of CUNG_DO_PHU) {
      donVi++;
      if (khopThuVien(laSo, thuVien, [c]).length) phu++;
    }
  }
  const doPhu = Math.round((1000 * phu) / donVi) / 10;
  console.log(`Tiêu chí 3 — độ phủ: ${phu}/${donVi} = ${doPhu}% (ngưỡng ≥ 80%)`);
  if (process.argv.includes('--chi-do-phu')) return;

  // ---- Sinh A và B xen kẽ từng lá (cùng tải máy chủ cho cả hai) ----
  const A: (KetQuaCauV3 & { khoa: string })[] = [];
  const B: (KetQuaCauV3 & { khoa: string })[] = [];
  for (let i = 0; i < la.length; i++) {
    const laSo = lapLaSo(la[i]);
    const chiB = thamSo('chi-b');
    if (chiB) {
      const b = await luanNhieuCau({ laSo, ids: CAU, namXem: 2026, songSong: 5, thuVien: { muc: thuVien, cau: new Set(CAU) } });
      B.push(...b.map((k) => ({ ...k, khoa: `L${String(i + 1).padStart(2, '0')}-${k.id}` })));
      console.log(`  lá ${i + 1}/${la.length}: ${chiB} ${b.filter((k) => k.luanGiai).length}/5`);
      continue;
    }
    const a = await luanNhieuCau({ laSo, ids: CAU, namXem: 2026, songSong: 5 });
    const b = await luanNhieuCau({ laSo, ids: CAU, namXem: 2026, songSong: 5, thuVien: { muc: thuVien, cau: new Set(CAU) } });
    A.push(...a.map((k) => ({ ...k, khoa: `L${String(i + 1).padStart(2, '0')}-${k.id}` })));
    B.push(...b.map((k) => ({ ...k, khoa: `L${String(i + 1).padStart(2, '0')}-${k.id}` })));
    console.log(`  lá ${i + 1}/${la.length}: A ${a.filter((k) => k.luanGiai).length}/5 · B ${b.filter((k) => k.luanGiai).length}/5 · T trung bình ${(b.reduce((s, k) => s + (k.thuVien?.daChon.length ?? 0), 0) / b.length).toFixed(1)}`);
  }

  const chiBTen = thamSo('chi-b');
  if (chiBTen) {
    writeFileSync(join(ra, `${chiBTen}.json`), JSON.stringify({ phien: B.map((k) => ({ id: k.khoa, cauHoi: k.cauHoi, luanGiai: k.luanGiai })) }, null, 1));
    writeFileSync(join(ra, `chi-tiet-${chiBTen}.json`), JSON.stringify({ B }, null, 1));
    const p95B = p95(B.filter((k) => k.luanGiai).map((k) => k.ms));
    console.log(`Đã ghi ${chiBTen}. p95 ${p95B} ms · T trung bình ${(B.reduce((s, k) => s + (k.thuVien?.daChon.length ?? 0), 0) / B.length).toFixed(1)} · cặp ngược chiều ${B.reduce((s, k) => s + (k.thuVien?.nguocChieu.length ?? 0), 0)}`);
    return;
  }
  // Tệp cho so-sanh-v3 (id duy nhất theo lá + câu)
  const phien = (ds: typeof A) => ({ phien: ds.map((k) => ({ id: k.khoa, cauHoi: k.cauHoi, luanGiai: k.luanGiai })) });
  writeFileSync(join(ra, 'A.json'), JSON.stringify(phien(A), null, 1));
  writeFileSync(join(ra, 'B.json'), JSON.stringify(phien(B), null, 1));

  // ---- Tiêu chí 1: ghép bỏ qua thư viện ----
  const tongY = B.reduce((s, k) => s + k.danY.length, 0);
  let boQua = 0, ghep = 0;
  const viDuBoQua: string[] = [];
  for (const k of B) {
    for (const y of k.danY) {
      if (!y.ghep) continue;
      ghep++;
      const sao = y.sao ?? [];
      if (sao.length < 2) continue;
      const coMuc = (k.thuVien?.khopHet ?? []).some((m) => m.sao.length >= 2 && sao.every((s) => m.sao.includes(s)));
      if (coMuc) {
        boQua++;
        if (viDuBoQua.length < 5) viDuBoQua.push(`${k.khoa}: ${sao.join(' + ')}`);
      }
    }
  }
  const tiBoQua = tongY ? Math.round((1000 * boQua) / tongY) / 10 : 0;

  // ---- Tiêu chí 2: tỉ lệ ý có mã nguồn (E / T) ----
  const coNguon = (ds: typeof A) => {
    const y = ds.flatMap((k) => k.danY);
    return y.length ? Math.round((1000 * y.filter((x) => x.canCu.some((m) => /^[ET]\d/.test(m))).length) / y.length) / 10 : 0;
  };
  const nguonA = coNguon(A), nguonB = coNguon(B);

  // ---- Tiêu chí 5: p95 thời gian mỗi câu ----
  const p95A = p95(A.filter((k) => k.luanGiai).map((k) => k.ms));
  const p95B = p95(B.filter((k) => k.luanGiai).map((k) => k.ms));

  // ---- Theo dõi ----
  const tDung = B.reduce((s, k) => s + (k.thuVien?.daChon.length ?? 0), 0) / B.length;
  const yTrichT = B.flatMap((k) => k.danY).filter((y) => y.canCu.some((m) => /^T\d/.test(m))).length;
  const nguoc = B.reduce((s, k) => s + (k.thuVien?.nguocChieu.length ?? 0), 0);
  const tokA = A.reduce((s, k) => s + k.token.vao, 0), tokB = B.reduce((s, k) => s + k.token.vao, 0);
  const datA = A.filter((k) => k.dat).length, datB = B.filter((k) => k.dat).length;
  const muc = new Set(B.flatMap((k) => k.thuVien?.khopHet.map((m) => m.id) ?? []));

  const kq = {
    thuVien: thuVien.length,
    tieuChi: {
      '1_ghepBoQuaThuVien': { giaTri: `${tiBoQua}%`, boQua, ghep, tongY, dat: tiBoQua <= 1, viDu: viDuBoQua },
      '2_yCoMaNguon': { A: `${nguonA}%`, B: `${nguonB}%`, dat: nguonB > nguonA },
      '3_doPhu': { giaTri: `${doPhu}%`, phu, donVi, dat: doPhu >= 80 },
      '5_p95': { A: p95A, B: p95B, dat: p95B <= p95A + 2000 && p95B <= 45000 },
    },
    theoDoi: {
      mucTDuaVaoMoiBai: Number(tDung.toFixed(1)),
      yTrichT: `${yTrichT}/${tongY}`,
      capNguocChieu: nguoc,
      soMucKhacNhauDaKhop: muc.size,
      tokenVaoA: tokA,
      tokenVaoB: tokB,
      datHetLuatA: `${datA}/${A.length}`,
      datHetLuatB: `${datB}/${B.length}`,
    },
    saoGhep: B.flatMap((k) => k.danY.filter((y) => y.ghep).map((y) => (y.sao ?? []).join(' + '))).filter(Boolean),
  };
  writeFileSync(join(ra, 'ket-qua.json'), JSON.stringify(kq, null, 1));
  writeFileSync(join(ra, 'chi-tiet.json'), JSON.stringify({ A, B }, null, 1));
  console.log(JSON.stringify(kq.tieuChi, null, 1));
  console.log(JSON.stringify(kq.theoDoi));
  void saoCuaMuc;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
