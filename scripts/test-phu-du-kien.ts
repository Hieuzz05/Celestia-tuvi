/**
 * ĐỘ PHỦ DỮ KIỆN — npx tsx scripts/test-phu-du-kien.ts  (offline, không gọi model, không chạm DB)
 *
 * 01/10/2026, chủ dự án: "mọi chính, phụ tinh đều được xét đến để luận giải, không có một hạn chế
 * nào"; "Tả Hữu ở Phu Thê mà luận như Tả Hữu ở Mệnh thì sai hoàn toàn"; "sao lại không xét cung
 * xung chiếu". Bài này đo đúng ba điều đó trên 60 lá số đóng băng (scripts/mau-ansao.json) × mọi
 * câu v3, và CHẶN nếu tụt:
 *
 *   1. Cung chính: MỌI sao (chính, phụ, vòng, tứ hóa, Tràng Sinh) có mặt KÈM câu nghĩa.
 *   2. Xung chiếu: mọi chính tinh, tứ hóa, phụ tinh nặng có nghĩa, kèm nhãn "chiếu thẳng vào".
 *      Mọi sao còn lại của xung chiếu / tam hợp có mặt ít nhất bằng tên.
 *   3. Cung ≠ Mệnh (và cung Thân khi câu không hỏi Thân) không nhận "Nghĩa nền (nói về CON NGƯỜI)",
 *      và có nhãn đổi chủ ngữ.
 *
 * In thêm độ dài gói dữ kiện (ký tự) để theo dõi chi phí token.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lapLaSo, tamPhuongTuChinh, type Cung, type LaSo } from '../lib/tuvi/ansao';
import { chuDeCua, dungDuKien, laSaoNang } from '../lib/rag/v3/du-kien';
import { CAU_HOI_V3 } from '../lib/rag/v3/khung';
import { KHUON } from '../lib/tuvi/quick-read-noi-dung';

const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
const dsLaSo: LaSo[] = Object.keys(mau).map((k) => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
});

const NAM_XEM = 2026;
const nghia = (ten: string) => KHUON.vi.netPhuTinh[ten] ?? KHUON.vi.netSao[ten]?.manh ?? KHUON.vi.netTrangSinh[ten];
/** "Tên (độ sáng…): nghĩa" hoặc "Tên: nghĩa" — có câu nghĩa ngay sau tên trong cùng F### */
const coNghia = (noiDung: string, ten: string) => {
  const n = nghia(ten);
  return !!n && noiDung.includes(n.slice(0, 24)) && new RegExp(`${ten}( \\([^)]*\\))?: `).test(noiDung);
};

type Dem = { co: number; tong: number };
const dem: Record<string, Dem> = {};
const cong = (k: string, dat: boolean) => {
  dem[k] ??= { co: 0, tong: 0 };
  dem[k].tong++;
  if (dat) dem[k].co++;
};
const loi: string[] = [];
let tongKyTu = 0;
let soGoi = 0;

for (const laSo of dsLaSo) {
  for (const q of CAU_HOI_V3) {
    const dk = dungDuKien(laSo, q, NAM_XEM);
    soGoi++;
    tongKyTu += dk.reduce((a, d) => a + d.noiDung.length, 0);
    const theoCung = (vai: (v: string) => boolean) => dk.filter((d) => d.noiDung.startsWith('Cung ') && vai(d.vaiTro));
    const fChinh = theoCung((v) => v === 'cung chính' || v.endsWith('(chính)'))[0];
    if (!fChinh) continue;
    const goc = laSo.cungs.find((c) => c.tenCung === fChinh.cung)!;
    const kiemCung = (f: { noiDung: string }, c: Cung, che: 'chinh' | 'xung' | 'tam-hop') => {
      for (const s of c.sao) {
        const nhom = s.loai === 'chinh-tinh' ? 'chính tinh' : s.loai === 'tu-hoa' ? 'tứ hóa' : laSaoNang(s) ? 'phụ tinh nặng' : 'sao nhẹ';
        cong(`${che} · có mặt · ${nhom}`, f.noiDung.includes(s.ten));
        const canNghia = che === 'chinh' ? true : che === 'xung' ? nhom !== 'sao nhẹ' : false;
        if (canNghia && nghia(s.ten)) {
          // Chính tinh ở Mệnh / Thân-được-hỏi đi qua Nghĩa nền (manhCau), không qua "Tên: nét"
          const quaNen = che === 'chinh' && s.loai === 'chinh-tinh' && f.noiDung.includes('Nghĩa nền') && f.noiDung.includes(`${s.ten}: `);
          const dat = quaNen || coNghia(f.noiDung, s.ten);
          cong(`${che} · có nghĩa · ${nhom}`, dat);
          if (!dat && loi.length < 8) loi.push(`${q.id} ${c.tenCung} (${che}): ${s.ten} thiếu nghĩa`);
        }
      }
      if (che === 'chinh' && c.trangSinh) cong('chinh · có nghĩa · Tràng Sinh', f.noiDung.includes(`vòng Tràng Sinh ${c.trangSinh}: `));
    };
    kiemCung(fChinh, goc, 'chinh');
    if (!q.ngangHang) {
      const { xungChieu, tamHop } = tamPhuongTuChinh(goc.chiIndex);
      const fx = dk.find((d) => d.vaiTro.startsWith('xung chiếu') && d.cung === laSo.cungs[xungChieu].tenCung);
      if (fx) {
        kiemCung(fx, laSo.cungs[xungChieu], 'xung');
        cong('xung · có nhãn chiếu thẳng', fx.noiDung.includes(`CHIẾU THẲNG vào cung ${goc.tenCung}`));
        cong('xung · không có Nghĩa nền', !fx.noiDung.includes('Nghĩa nền'));
      }
      for (const i of tamHop) {
        const ft = dk.find((d) => d.vaiTro.startsWith('tam hợp') && d.cung === laSo.cungs[i].tenCung);
        if (ft) kiemCung(ft, laSo.cungs[i], 'tam-hop');
      }
    }
    // Nghĩa nền con người chỉ ở Mệnh, hoặc ở cung Thân khi câu hỏi gọi Thân
    for (const f of theoCung(() => true)) {
      const c = laSo.cungs.find((x) => x.tenCung === f.cung)!;
      // Câu gọi Thân: trong danh sách cung, hoặc phụ trợ "Thân" / "Mệnh / Thân" của câu chuyên sâu
      const hoiThan =
        q.cung.includes('THAN') ||
        (q.loai === 'chuyen-sau' && !!chuDeCua(q)?.phuTro.some((p) => p.cung.split('/').map((x) => x.trim()).includes('Thân')) && f.vaiTro.startsWith('phụ trợ'));
      const duocNen = c.tenCung === 'Mệnh' || (c.laCungThan && hoiThan);
      if (!duocNen) {
        const dat = !f.noiDung.includes('Nghĩa nền');
        cong('cung ≠ Mệnh không nhận Nghĩa nền con người', dat);
        if (!dat && loi.length < 8) loi.push(`${q.id} ${c.tenCung}: có Nghĩa nền con người`);
        if (f.vaiTro === 'cung chính' && /Nét chung|Nghĩa phụ tinh/.test(f.noiDung))
          cong('cung chính ≠ Mệnh có nhãn đổi chủ ngữ', /Đọc mọi nét dưới đây: /.test(f.noiDung));
      }
    }
  }
}

console.log(`${dsLaSo.length} lá số × ${CAU_HOI_V3.length} câu = ${soGoi} gói · trung bình ${Math.round(tongKyTu / soGoi)} ký tự/gói\n`);
let hong = 0;
for (const [k, d] of Object.entries(dem).sort()) {
  const pct = (100 * d.co) / d.tong;
  // Mọi mục đo là luật cứng 100%
  const dat = d.co === d.tong;
  if (!dat) hong++;
  console.log(`${dat ? '✓' : '✗'} ${k.padEnd(48)} ${pct.toFixed(1).padStart(5)}%  (${d.co}/${d.tong})`);
}
if (loi.length) console.log('\nVí dụ hỏng:\n  ' + loi.join('\n  '));
if (hong) {
  console.log(`\n✗ ${hong} mục chưa đủ 100%`);
  process.exit(1);
}
console.log('\n✓ Đủ: mọi sao của cung chính có nghĩa theo cung; xung chiếu có nghĩa; tam phương có mặt đủ tên.');
