/**
 * Chat cân theo lớp hạn (CEL-200, commit 3a) — sau cờ server CELES_LOP_HAN.
 *
 * Khoá hai điều:
 *   A. Cờ tắt (thiếu `lopHanMoi`) = đường cũ đúng từng byte: tinhNghiengVe, khoiNghiengVe,
 *      chonBoiCanh. Câu bản mệnh có cờ cũng y nguyên (công tắc là `lopHan` có lớp hạn).
 *   B. Cờ bật: chiều chỉ lấy từ lớp hạn. Sao gốc ở phần đang hỏi chỉ ở mục nền, không
 *      vào hai danh sách; sao gốc ở cung hạn không cộng lẻ; luôn đủ hai mặt khi có;
 *      sao lưu đã nằm trong luật tổ hợp không cộng lại; dữ kiện tứ hoá theo hạn nối cuối
 *      gói, đúng sao đúng cung như bảng sự thật.
 *
 * Kèm bảng đo phân bố hai phía (60 lá × 2024–2030 × 4 chủ đề), chỉ IN RA: ngưỡng chấp
 * nhận chờ chủ dự án duyệt sau khi xem số (phản biện L3, 16/10/2026). Offline, không gọi model.
 *
 *   npx tsx scripts/test-lop-han-chat.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { khoiNghiengVe, tinhNghiengVe, type HuongNghieng } from '../lib/rag/nghieng-ve';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from '../lib/rag/boi-canh-la-so';
import { lapKeHoach, type ChuDe, type LopHan } from '../lib/rag/planner';
import { lopHan as bangLopHan } from '../lib/tuvi/tu-hoa-han';
import { khopLuatToHop } from '../lib/tuvi/luat-to-hop';

for (const k of Object.keys(process.env)) {
  if (/SUPABASE|_API_KEY$/.test(k)) delete process.env[k];
}

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

const NAM_THANG: LopHan[] = ['ban-menh', 'dai-van', 'luu-nien'];
const CHU_DE: ChuDe[] = ['su-nghiep', 'tai-chinh', 'tinh-cam', 'suc-khoe'];
const NAM = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
const LA: LaSo[] = [];
for (const k of Object.keys(mau)) {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/);
  if (m) LA.push(lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' }));
}
const DOI_CHIEU = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 30, gioiTinh: 'nam' });

/* ------------------------------------------------ A. cờ tắt = y nguyên */
console.log('== A. Cờ tắt = đường cũ đúng từng byte ==');
{
  let lech = 0;
  for (const laSo of LA.slice(0, 20)) {
    for (const chuDe of CHU_DE) {
      for (const lopHan of [NAM_THANG, ['ban-menh'] as LopHan[], ['ban-menh', 'dai-van'] as LopHan[]]) {
        const vao = { laSo, chuDe, lopHan, namXem: 2026, thangXem: 10 };
        const cu = JSON.stringify(tinhNghiengVe(vao));
        if (cu !== JSON.stringify(tinhNghiengVe({ ...vao, lopHanMoi: false }))) lech++;
        if (khoiNghiengVe(tinhNghiengVe(vao)) !== khoiNghiengVe(tinhNghiengVe({ ...vao, lopHanMoi: false }))) lech++;
        // Câu bản mệnh: cờ bật cũng không đổi gì
        if (lopHan.length === 1 && cu !== JSON.stringify(tinhNghiengVe({ ...vao, lopHanMoi: true }))) lech++;
      }
    }
  }
  kiem(lech === 0, `${lech} ca tinhNghiengVe/khoiNghiengVe đổi khi cờ tắt hoặc câu bản mệnh`);

  let lechBc = 0;
  for (const laSo of LA.slice(0, 20)) {
    for (const cau of ['Năm nay công việc của tôi thế nào?', 'Tính cách tôi thế nào?', 'Đại vận này tiền bạc ra sao?']) {
      const keHoach = lapKeHoach({ cauHoi: cau, saoTheoCung: saoChinhTheoCung(laSo), tenCachCuc: tenCachCucCho(laSo) });
      const vao = { laSo, keHoach, namXem: 2026, thangXem: 10 };
      const cu = chonBoiCanh(vao);
      if (JSON.stringify(cu) !== JSON.stringify(chonBoiCanh({ ...vao, lopHanMoi: false }))) lechBc++;
      // Cờ bật: các mục cũ giữ nguyên mã F### và nội dung — mục mới chỉ nối cuối
      const moi = chonBoiCanh({ ...vao, lopHanMoi: true });
      if (JSON.stringify(moi.duKien.slice(0, cu.duKien.length)) !== JSON.stringify(cu.duKien)) lechBc++;
      if (!keHoach.lopHan.some((l) => l !== 'ban-menh') && moi.duKien.length !== cu.duKien.length) lechBc++;
    }
  }
  kiem(lechBc === 0, `${lechBc} gói chonBoiCanh đổi khi cờ tắt, hoặc cờ bật làm dịch mục cũ`);
}

/* ------------------------------------------------ B. cờ bật: luật lớp hạn */
console.log('== B. Cờ bật: chiều chỉ từ lớp hạn ==');
{
  let nenLot = 0;
  let saiThuTu = 0;
  let trungLuat = 0;
  let soLuat = 0;
  let saiHoa = 0;
  for (const laSo of LA) {
    const tenGoc = new Set(laSo.cungs.flatMap((c) => c.sao.map((s) => s.ten)));
    for (const namXem of NAM) {
      const lh = bangLopHan(laSo, namXem);
      for (const chuDe of CHU_DE) {
        const n = tinhNghiengVe({ laSo, chuDe, lopHan: NAM_THANG, namXem, thangXem: 10, lopHanMoi: true });
        if (!n || !n.lopHan) continue;
        // Không mục nào của hai danh sách là sao gốc / lớp nền
        if (n.dauMoc.some((d) => d.lop === 'nen' || tenGoc.has(d.ten))) nenLot++;
        // Không ép hai mặt (C3/Q2): danh sách chọn là các mốc nặng nhất, xếp giảm dần
        if (n.dauMoc.some((d, i) => i > 0 && d.trong > n.dauMoc[i - 1].trong)) saiThuTu++;
        // Lưu hoá phải đúng sao như bảng sự thật lớp hạn
        for (const d of n.dauMoc) {
          const m = d.ten.match(/^Lưu (Hóa \S+) \((.+)\)$/);
          if (m && !lh.luuTuHoa.some((h) => h.hoa === m[1] && h.sao === m[2])) saiHoa++;
        }
        // Sao lưu đã nằm trong luật khớp thì không đứng lẻ
        const cung = laSo.cungs.find((c) => c.tenCung === n.cung)!;
        for (const kl of khopLuatToHop(laSo, lh, cung.chiIndex)) {
          const tenLuat = [...new Set(kl.viTri.map((v) => v.ten))].join(' + ');
          if (!n.dauMoc.some((d) => d.ten === tenLuat)) continue;
          soLuat++;
          for (const v of kl.viTri) if (!v.laGoc && n.dauMoc.some((d) => d.ten === v.ten)) trungLuat++;
        }
      }
    }
  }
  kiem(nenLot === 0, `${nenLot} ca có sao gốc lọt vào hai danh sách lớp hạn`);
  kiem(saiThuTu === 0, `${saiThuTu} ca danh sách chọn không xếp theo trọng lượng giảm dần`);
  kiem(saiHoa === 0, `${saiHoa} mục lưu hoá không khớp bảng sự thật (sai sao)`);
  kiem(soLuat > 0, 'quét không gặp ca nào có luật tổ hợp lên danh sách — bài kiểm trùng vô nghĩa');
  kiem(trungLuat === 0, `${trungLuat} sao lưu vừa trong luật tổ hợp vừa đứng lẻ (cộng hai lần)`);

  // Sao gốc ở cung hạn không cộng lẻ: đổi hết sao gốc của cung tiểu hạn không làm đổi tổng
  // (trừ khi cung đó là cung đang hỏi — nền đã không vào tổng)
  let doiTong = 0;
  const GIU = ['Kình Dương', 'Đà La', 'Lộc Tồn', 'Văn Xương', 'Văn Khúc', 'Tả Phù', 'Hữu Bật'];
  for (const laSo of LA.slice(0, 15)) {
    const n = tinhNghiengVe({ laSo, chuDe: 'su-nghiep', lopHan: NAM_THANG, namXem: 2026, thangXem: 10, lopHanMoi: true });
    if (!n) continue;
    const ban: LaSo = JSON.parse(JSON.stringify(laSo));
    for (const c of ban.cungs) {
      // Bỏ phụ tinh gốc; giữ sao luật tổ hợp dựa vào (Kình, Đà, Lộc Tồn) và sao nhận tứ hoá
      c.sao = c.sao.filter((s) => GIU.includes(s.ten) || s.loai === 'chinh-tinh');
    }
    const n2 = tinhNghiengVe({ laSo: ban, chuDe: 'su-nghiep', lopHan: NAM_THANG, namXem: 2026, thangXem: 10, lopHanMoi: true });
    if (!n2 || n2.canNang.do !== n.canNang.do || n2.canNang.can !== n.canNang.can) doiTong++;
  }
  kiem(doiTong === 0, `${doiTong} lá đổi tổng khi bỏ phụ tinh gốc — sao gốc vẫn đang vào chiều`);

  // Ca đối chiếu: 2026 can Bính → Liêm Trinh hoá Kỵ; phải có mặt ở phía cản cho sự nghiệp
  const lh = bangLopHan(DOI_CHIEU, 2026);
  const ky = lh.luuTuHoa.find((h) => h.hoa === 'Hóa Kỵ')!;
  const n = tinhNghiengVe({ laSo: DOI_CHIEU, chuDe: 'su-nghiep', lopHan: NAM_THANG, namXem: 2026, thangXem: 10, lopHanMoi: true });
  const qlChi = DOI_CHIEU.cungs.find((c) => c.tenCung === 'Quan Lộc')!.chiIndex;
  console.log(`   lá đối chiếu 2026: Lưu Hóa Kỵ vào ${ky.sao} (${ky.tenCung}), Quan Lộc chi ${qlChi}; hướng ${n?.huong}`);
  kiem(
    !!n?.dauMoc.some((d) => d.ten === `Lưu Hóa Kỵ (${ky.sao})` && d.huong === 'can'),
    'lá đối chiếu sự nghiệp 2026: Lưu Hóa Kỵ chiếu tam phương không có mặt ở phía cản'
  );
  const khoi = khoiNghiengVe(n);
  kiem(/NỀN SẴN TRÊN LÁ SỐ GỐC/.test(khoi) && /CÓ CĂN CỨ THÌ NÊU/.test(khoi), 'khối prompt lớp hạn thiếu mục nền hoặc luật có căn cứ thì nêu');
  kiem(!/NÓI CẢ HAI MẶT/.test(khoi), 'khối prompt lớp hạn còn luật ép hai mặt (đã đảo theo C3/Q2)');
  kiem(!/Dữ kiện đang mở đường/.test(khoi), 'khối prompt lớp hạn còn tiêu đề của đường cũ');

  // Đại vận "giai đoạn": không có sao lưu / lưu hoá của một năm
  const g = tinhNghiengVe({ laSo: DOI_CHIEU, chuDe: 'su-nghiep', lopHan: ['ban-menh', 'dai-van'], namXem: 2026, thangXem: 10, lopHanMoi: true });
  kiem(!!g && g.dauMoc.every((d) => d.lop === 'dai-van'), 'câu đại vận lại có dữ kiện lớp năm');

  // Dữ kiện chat: tứ hoá theo hạn nối cuối, đúng lớp, đúng sao đúng cung
  const keHoach = lapKeHoach({
    cauHoi: 'Năm nay công việc của tôi thế nào?',
    saoTheoCung: saoChinhTheoCung(DOI_CHIEU),
    tenCachCuc: tenCachCucCho(DOI_CHIEU),
  });
  const dk = chonBoiCanh({ laSo: DOI_CHIEU, keHoach, namXem: 2026, thangXem: 10, lopHanMoi: true }).duKien;
  const fLuu = dk.find((f) => f.loai === 'luu-tu-hoa');
  kiem(fLuu?.lop === 'luu-nien', 'thiếu dữ kiện lưu tứ hoá (lớp luu-nien)');
  kiem(!!fLuu && fLuu.noiDung.includes(`Hóa Kỵ vào ${ky.sao} (cung ${ky.tenCung})`), 'dữ kiện lưu tứ hoá sai sao/cung');
  const fDv = dk.find((f) => f.loai === 'tu-hoa-dai-van');
  if (keHoach.lopHan.includes('dai-van')) kiem(fDv?.lop === 'dai-han', 'thiếu dữ kiện tứ hoá đại vận (lớp dai-han)');
}

/* ------------------------------------------------ C. đo phân bố hai phía (chỉ in) */
console.log('== C. Phân bố hướng: đường cũ vs lớp hạn (60 lá × 2024–2030 × 4 chủ đề) ==');
{
  const dem = (lopHanMoi: boolean) => {
    const d: Record<HuongNghieng | 'null', number> = { 'thuan-ro': 0, 'thuan-nhe': 0, 'can-bang': 0, 'can-nhe': 0, 'can-ro': 0, null: 0 };
    let haiMat = 0;
    let tong = 0;
    for (const laSo of LA) for (const namXem of NAM) for (const chuDe of CHU_DE) {
      const n = tinhNghiengVe({ laSo, chuDe, lopHan: NAM_THANG, namXem, thangXem: 10, lopHanMoi });
      tong++;
      if (!n) { d.null++; continue; }
      d[n.huong]++;
      if (n.dauMoc.some((x) => x.huong === 'do') && n.dauMoc.some((x) => x.huong === 'can')) haiMat++;
    }
    return { d, haiMat, tong };
  };
  /*
   * Không ép hai mặt (C3/Q2): phía có trọng lượng nhưng không lọt top 6 thì KHÔNG
   * được chèn vào. Bản cũ chèn nên số ca này luôn bằng 0.
   */
  let khongChen = 0;
  for (const laSo of LA) for (const namXem of NAM) for (const chuDe of CHU_DE) {
    const n = tinhNghiengVe({ laSo, chuDe, lopHan: NAM_THANG, namXem, thangXem: 10, lopHanMoi: true });
    if (!n || n.dauMoc.length < 6) continue;
    for (const phia of ['do', 'can'] as const) {
      if (n.canNang[phia] > 0 && !n.dauMoc.some((x) => x.huong === phia)) khongChen++;
    }
  }
  console.log(`   ca một phía nặng hẳn, phía kia không bị chèn: ${khongChen}`);
  kiem(khongChen > 0, 'top mốc vẫn bị chèn mốc phía thiếu — luật ép hai mặt chưa bỏ');
  for (const [ten, r] of [['cũ', dem(false)], ['lớp hạn', dem(true)]] as const) {
    const pc = (x: number) => `${((x / r.tong) * 100).toFixed(1)}%`;
    console.log(
      `   ${ten.padEnd(8)} thuận rõ ${pc(r.d['thuan-ro'])} · thuận nhẹ ${pc(r.d['thuan-nhe'])} · cân ${pc(r.d['can-bang'])} · cản nhẹ ${pc(r.d['can-nhe'])} · cản rõ ${pc(r.d['can-ro'])} · null ${pc(r.d.null)} · đủ hai mặt ${pc(r.haiMat)}`
    );
  }
}

console.log(`\n${soCa - loi}/${soCa} ca đạt`);
if (loi) process.exit(1);
