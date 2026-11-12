/**
 * Máy canh luật "không sao nào mặc định tốt hay xấu" — npx tsx scripts/test-chieu-sao.ts
 *
 * Chạy OFFLINE, không chạm database, không gọi model.
 *
 * Quyết định của chủ dự án (11/11/2026, CELES-72): "trong tử vi không được xét mặc
 * định một sao là tốt hay xấu", "phải xét các bộ sao liên kết", "không có chuyện sao
 * ở cung xung chiếu là lực cản", "không có sao nào luôn đắc". Nguồn sách và lý do:
 * docs/ra-soat/QUYET-DINH-2026-11-11.md.
 *
 * Bốn tầng:
 *  1. Ca dựng tay: từng bộ sao trong quyết định ra đúng chiều (lib/tuvi/chieu-sao.ts).
 *  2. Mẫu rộng lá số thật: không vỡ, và không sát tinh / chính tinh nào chỉ ra
 *     MỘT chiều trên mọi lá số (nếu có, tức là nó đang bị gán nhãn cố định).
 *  3. Không đọc `tinhChat` để luận: chỉ mệnh bàn được dùng nó để chia cột.
 *  4. Không còn câu khuôn cũ ép "luôn có lực ngược" trong chữ gửi model / người dùng.
 */

import fs from 'node:fs';
import path from 'node:path';
import { lapLaSo, type Cung, type GioiTinh, type LaSo } from '../lib/tuvi/ansao';
import {
  capKhacTrongCung,
  chieuCungDoi,
  chieuSao,
  chieuSaoLuu,
  chieuTuanTriet,
  SAT_TINH,
  xetVoChinhDieu,
  type Chieu,
} from '../lib/tuvi/chieu-sao';
import { CHI, CHINH_TINH, type Sao } from '../lib/tuvi/constants';

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
  );
}

// ---------------------------------------------------------------------------
// Lá số dựng tay
// ---------------------------------------------------------------------------

const CHINH = new Set<string>(CHINH_TINH);
type DoSang = Sao['doSang'];
type DatCung = {
  sao?: [string, DoSang?][];
  tuan?: boolean;
  triet?: boolean;
  tenCung?: string;
  trangSinh?: string;
};

function taoSao(ten: string, doSang?: DoSang): Sao {
  const loai = ten.startsWith('Hóa ') ? 'tu-hoa' : CHINH.has(ten) ? 'chinh-tinh' : 'phu-tinh';
  return { ten, loai, doSang: doSang ?? null };
}

/** canNamIndex 0 = Giáp: Hóa Kỵ đi với Thái Dương, Hóa Lộc với Liêm Trinh */
function laSoGia(dat: Record<number, DatCung>, canNamIndex = 0): LaSo {
  const cungs: Cung[] = Array.from({ length: 12 }, (_, i) => {
    const d = dat[i] ?? {};
    return {
      chiIndex: i,
      chi: CHI[i],
      can: '',
      tenCung: d.tenCung ?? `Cung ${i}`,
      laCungMenh: false,
      laCungThan: false,
      sao: (d.sao ?? []).map(([t, s]) => taoSao(t, s)),
      trangSinh: d.trangSinh ?? 'Trường Sinh',
      coTuan: !!d.tuan,
      coTriet: !!d.triet,
    };
  });
  return { cungs, canNamIndex } as unknown as LaSo;
}

function chieuCua(laSo: LaSo, chi: number, ten: string): Chieu | undefined {
  const cung = laSo.cungs[chi];
  const s = cung.sao.find((x) => x.ten === ten);
  return s ? chieuSao(laSo, cung, s).chieu : undefined;
}

const TY = 0, SUU = 1, DAN = 2, MAO = 3, THIN = 4, NGO = 6, THAN = 8;

console.log('\n1. Bộ sao dựng tay');

{
  const ls = laSoGia({ [NGO]: { sao: [['Kình Dương', 'D'], ['Thất Sát', 'M']] } });
  kiem('Kình Dương đắc đi cùng Thất Sát (cặp chỉ huy) → thuận', chieuCua(ls, NGO, 'Kình Dương') === 'thuan');
}
{
  const ls = laSoGia({ [TY]: { sao: [['Kình Dương', 'H']] } });
  kiem('Kình Dương hãm đứng một mình → cản', chieuCua(ls, TY, 'Kình Dương') === 'can');
}
{
  const ls = laSoGia({ [TY]: { sao: [['Kình Dương', 'H']] }, [THIN]: { sao: [['Tử Vi', 'M']] } });
  kiem('Kình Dương hãm bị Tử Vi sáng ở tam hợp chế → hai mặt', chieuCua(ls, TY, 'Kình Dương') === 'hai-mat');
}
{
  const ls = laSoGia({ [TY]: { sao: [['Địa Kiếp', 'H']] }, [THIN]: { sao: [['Tử Vi', 'M']] } });
  kiem('Địa Kiếp hãm: Tử Vi không chế được Không Kiếp → cản', chieuCua(ls, TY, 'Địa Kiếp') === 'can');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Đà La', 'H']] } });
  kiem('Đà La ở tứ sinh → hai mặt, không xếp cản', chieuCua(ls, DAN, 'Đà La') === 'hai-mat');
}
{
  const ls = laSoGia({ [SUU]: { sao: [['Thái Dương', 'H'], ['Hóa Kỵ']], tuan: true } });
  kiem('Hóa Kỵ đi với Thái Dương ở Sửu có Tuần → thuận (HS:1749)', chieuCua(ls, SUU, 'Hóa Kỵ') === 'thuan');
  const ls2 = laSoGia({ [SUU]: { sao: [['Thái Dương', 'H'], ['Hóa Kỵ']] } });
  kiem('Hóa Kỵ với Thái Dương ở Sửu KHÔNG Tuần Triệt → không thuận', chieuCua(ls2, SUU, 'Hóa Kỵ') !== 'thuan');
}
// Ca chuyên gia 12/11/2026 (CELES-72)
{
  const nn = (them: [string, DoSang?][], o: Partial<DatCung>) =>
    laSoGia({ [7]: { sao: [['Thái Dương', 'D'], ['Thái Âm', 'D'], ...them], ...o } });
  kiem('Nhật Nguyệt ở Mùi + Tuần → thuận', chieuCua(nn([], { tuan: true }), 7, 'Thái Âm') === 'thuan');
  kiem('Nhật Nguyệt ở Mùi + Tuần + Đà đồng cung → hai mặt', chieuCua(nn([['Đà La', 'H']], { tuan: true }), 7, 'Thái Âm') === 'hai-mat');
  kiem('Nhật Nguyệt ở Mùi chỉ có Triệt → hai mặt (nặng tiền vận)', chieuCua(nn([], { triet: true }), 7, 'Thái Dương') === 'hai-mat');
}
{
  // Mệnh Hợi tuổi Nhâm: Vũ Phá hãm, Vũ Khúc Hóa Kỵ, Lộc Tồn, Tuần → Kỵ vẫn cản (Kình Đà giáp Kỵ, VTL:761)
  const ls = laSoGia(
    { [11]: { sao: [['Vũ Khúc', 'H'], ['Phá Quân', 'H'], ['Hóa Kỵ'], ['Lộc Tồn']], tuan: true } },
    8
  );
  kiem('Kỵ gặp Tuần không nhẹ đi: Mệnh Hợi tuổi Nhâm → Kỵ cản', chieuCua(ls, 11, 'Hóa Kỵ') === 'can');
  kiem('…còn Vũ Phá hãm gặp Tuần thì giảm xấu → hai mặt', chieuCua(ls, 11, 'Phá Quân') === 'hai-mat');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Vũ Khúc', 'D'], ['Thiên Tướng', 'D'], ['Hóa Kỵ']], triet: true } }, 8);
  kiem('Vũ Tướng + Kỵ + Triệt: Kỵ không nhẹ đi → hai mặt', chieuCua(ls, DAN, 'Hóa Kỵ') === 'hai-mat');
  const ls2 = laSoGia({ [DAN]: { sao: [['Vũ Khúc', 'D'], ['Hóa Kỵ'], ['Địa Kiếp', 'H']], triet: true } }, 8);
  kiem('Kỵ + Triệt + Địa Kiếp đồng cung → nặng thêm, cản', chieuCua(ls2, DAN, 'Hóa Kỵ') === 'can');
  const ls3 = laSoGia({ [TY]: { sao: [['Kình Dương', 'H'], ['Hóa Kỵ']], tuan: true } });
  kiem('Cung có Kỵ thì Tuần không "giải" trọn → tối đa hai mặt', chieuTuanTriet(ls3.cungs[TY])?.chieu !== 'thuan');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Thiên Hình', 'D']], triet: true } });
  kiem('Thiên Hình đắc gặp Triệt → yếu (kiếm gẫy, KL:2647)', chieuCua(ls, DAN, 'Thiên Hình') === 'yeu');
  kiem('…và Tuần Triệt ở cung đó không ra "giải"', chieuTuanTriet(ls.cungs[DAN])?.chieu !== 'thuan');
  const ls2 = laSoGia({ [TY]: { sao: [['Thiên Hình', 'H']], tuan: true } });
  kiem('Thiên Hình hãm gặp Tuần → hai mặt, không lên thuận', chieuCua(ls2, TY, 'Thiên Hình') === 'hai-mat');
}
{
  // Tuổi Đinh: Cự Môn Hóa Kỵ. Gốc sáng ở Tý xung sang Ngọ
  const ls = laSoGia({ [TY]: { sao: [['Cự Môn', 'V'], ['Hóa Kỵ']] } }, 3);
  const r = chieuCungDoi(ls, ls.cungs[NGO]);
  kiem('Kỵ gốc sáng xung về → kyXung, mức hai mặt', r.kyXung && r.chieu === 'hai-mat', r.chieu);
  const ls2 = laSoGia({ [TY]: { sao: [['Cự Môn', 'V'], ['Hóa Kỵ']] }, [NGO]: { sao: [['Lộc Tồn']] } }, 3);
  kiem('Lộc bị Kỵ xung → cản bất kể gốc (VTL:701)', chieuCungDoi(ls2, ls2.cungs[NGO]).chieu === 'can');
  const ls3 = laSoGia({ [THIN]: { sao: [['Cự Môn', 'H'], ['Hóa Kỵ']] }, [10]: { sao: [['Thiên Đồng', 'H']] } }, 3);
  kiem('Đồng ở Tuất tuổi Đinh, Cự Kỵ xung về là cách tốt → không xung phá', !chieuCungDoi(ls3, ls3.cungs[10]).kyXung);
}
{
  const ls = laSoGia({ [TY]: { sao: [['Thái Dương', 'H'], ['Hóa Kỵ']] } });
  kiem('Hóa Kỵ trên Thái Dương hãm ở Tý → cản', chieuCua(ls, TY, 'Hóa Kỵ') === 'can');
}
{
  const ls = laSoGia({ [TY]: { sao: [['Thiên Phủ', 'M']], tuan: true } });
  kiem('Thiên Phủ gặp Tuần (kho rỗng) → cản', chieuCua(ls, TY, 'Thiên Phủ') === 'can');
}
{
  const ls = laSoGia({ [NGO]: { sao: [['Tử Vi', 'M']], tuan: true } });
  kiem('Chính tinh sáng gặp Tuần → yếu (nét còn, không ra sức)', chieuCua(ls, NGO, 'Tử Vi') === 'yeu');
}
{
  const ls = laSoGia({ [MAO]: { sao: [['Thiên Cơ', 'H']], triet: true } });
  kiem('Chính tinh hãm gặp Triệt → hai mặt (giảm xấu)', chieuCua(ls, MAO, 'Thiên Cơ') === 'hai-mat');
}
{
  const ls = laSoGia({ [MAO]: { sao: [['Thiên Cơ', 'H']] } });
  kiem('Chính tinh hãm không gặp sát → yếu, không phải cản', chieuCua(ls, MAO, 'Thiên Cơ') === 'yeu');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Thiên Mã'], ['Đà La', 'H']] } });
  kiem('Thiên Mã gặp Đà La (chiết túc) → cản', chieuCua(ls, DAN, 'Thiên Mã') === 'can');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Thiên Mã']], tuan: true } });
  kiem('Thiên Mã gặp Tuần → cản: không có sao nào luôn đắc', chieuCua(ls, DAN, 'Thiên Mã') === 'can');
}
{
  const ls = laSoGia({ [DAN]: { sao: [['Thiên Mã'], ['Lộc Tồn']] } });
  kiem('Thiên Mã gặp Lộc Tồn → thuận', chieuCua(ls, DAN, 'Thiên Mã') === 'thuan');
}
{
  const ls = laSoGia({ [THIN]: { sao: [['Hóa Lộc'], ['Địa Kiếp', 'H']] } });
  kiem('Hóa Lộc gặp Địa Kiếp đồng cung → cản', chieuCua(ls, THIN, 'Hóa Lộc') === 'can');
}
{
  const ls = laSoGia({ [THIN]: { sao: [['Hóa Lộc'], ['Hóa Kỵ']] } });
  kiem('Cặp khắc thật: Lộc gặp Kỵ', capKhacTrongCung(ls, ls.cungs[THIN]).includes('loc-ky'));
  const ls2 = laSoGia({ [THIN]: { sao: [['Văn Xương'], ['Thiên Hình']] } });
  kiem(
    'Có sao nhóm cát lẫn nhóm sát trong cung KHÔNG tự thành cặp khắc',
    capKhacTrongCung(ls2, ls2.cungs[THIN]).length === 0
  );
}

console.log('\n2. Cung đối chiếu sang không mặc định là cản');
{
  const ls = laSoGia({ [NGO]: { sao: [['Tử Vi', 'M']] } });
  const r = chieuCungDoi(ls, ls.cungs[TY]);
  kiem('Đối diện có Tử Vi sáng, không Kỵ → thuận', r.chieu === 'thuan', r.chieu);
}
{
  const ls = laSoGia({ [TY]: { sao: [['Thái Dương', 'H'], ['Hóa Kỵ']] } });
  const r = chieuCungDoi(ls, ls.cungs[NGO]);
  kiem('Đối diện có Hóa Kỵ xung về → cản', r.chieu === 'can' && r.kyXung, r);
}
{
  const ls = laSoGia({ [SUU]: { sao: [['Thái Dương', 'H'], ['Hóa Kỵ']], tuan: true } });
  const r = chieuCungDoi(ls, ls.cungs[7]);
  kiem('Kỵ đã thành tốt ở cung đối (Nhật ở Sửu) → không xung phá', !r.kyXung && r.chieu !== 'can', r);
}
{
  const ls = laSoGia({});
  kiem('Đối diện trống → trung, không cản', chieuCungDoi(ls, ls.cungs[TY]).chieu === 'trung');
}

console.log('\n3. Tuần Triệt và vô chính diệu');
{
  const ls = laSoGia({ [TY]: { sao: [['Kình Dương', 'H']], tuan: true } });
  kiem('Tuần trên sát hãm → giải', chieuTuanTriet(ls.cungs[TY])?.ly === 'giai');
  const ls2 = laSoGia({ [TY]: { sao: [['Tử Vi', 'M']], tuan: true } });
  kiem('Tuần trên chính tinh sáng → bẻ', chieuTuanTriet(ls2.cungs[TY])?.ly === 'be');
  const ls3 = laSoGia({ [TY]: { sao: [['Tử Vi', 'M']], tuan: true, tenCung: 'Tật Ách' } });
  kiem('Tuần ở Tật Ách → tốt', chieuTuanTriet(ls3.cungs[TY])?.ly === 'tat-ach');
  kiem('Cung không Tuần Triệt → null', chieuTuanTriet(laSoGia({}).cungs[TY]) === null);
}
{
  const ls = laSoGia({ [TY]: { tuan: true }, [THIN]: { triet: true }, [THAN]: { sao: [['Địa Không', 'H']] } });
  const r = xetVoChinhDieu(ls, ls.cungs[TY]);
  kiem('Vô chính diệu gặp Tam Không → thuận', r?.chieu === 'thuan' && r.soKhong >= 3, r);
}

console.log('\n4. Sao lưu: ngoại lệ có chủ đích, giữ bảng riêng');
kiem('Lưu Kình Dương → cản', chieuSaoLuu('Lưu Kình Dương') === 'can');
kiem('Lưu Lộc Tồn → thuận', chieuSaoLuu('Lưu Lộc Tồn') === 'thuan');
kiem('Sao lưu lạ → trung', chieuSaoLuu('Lưu Gì Đó') === 'trung');

// ---------------------------------------------------------------------------
// Mẫu rộng lá số thật
// ---------------------------------------------------------------------------

console.log('\n5. Mẫu rộng lá số thật');
{
  const chieuTheoSao = new Map<string, Set<Chieu>>();
  const doiTheoChieu = new Map<Chieu, number>();
  let soLaSo = 0;
  let loi: unknown = null;
  try {
    for (let nam = 1960; nam <= 2005; nam += 3) {
      for (const thang of [1, 4, 7, 10]) {
        for (const gio of [0, 3, 6, 9]) {
          for (const gioiTinh of ['nam', 'nu'] as GioiTinh[]) {
            const laSo = lapLaSo({ ngay: 5 + (nam % 20), thang, nam, gio, gioiTinh });
            soLaSo += 1;
            for (const cung of laSo.cungs) {
              for (const s of cung.sao) {
                const c = chieuSao(laSo, cung, s).chieu;
                if (!chieuTheoSao.has(s.ten)) chieuTheoSao.set(s.ten, new Set());
                chieuTheoSao.get(s.ten)!.add(c);
              }
              const d = chieuCungDoi(laSo, cung).chieu;
              doiTheoChieu.set(d, (doiTheoChieu.get(d) ?? 0) + 1);
              chieuTuanTriet(cung);
              xetVoChinhDieu(laSo, cung);
              capKhacTrongCung(laSo, cung);
            }
          }
        }
      }
    }
  } catch (e) {
    loi = e instanceof Error ? e.message : String(e);
  }
  kiem(`Chạy ${soLaSo} lá số không vỡ`, loi === null, loi);

  const motChieu = [...SAT_TINH, ...CHINH_TINH, 'Thiên Mã', 'Hóa Kỵ', 'Hóa Lộc'].filter(
    (t) => (chieuTheoSao.get(t)?.size ?? 0) < 2
  );
  kiem(
    'Không sát tinh / chính tinh / Mã / Lộc / Kỵ nào chỉ ra một chiều trên mọi lá số',
    motChieu.length === 0,
    motChieu.map((t) => [t, [...(chieuTheoSao.get(t) ?? [])]])
  );
  const tong = [...doiTheoChieu.values()].reduce((a, b) => a + b, 0);
  const tiCan = (doiTheoChieu.get('can') ?? 0) / Math.max(tong, 1);
  kiem(
    `Cung đối chiếu sang không mặc định là cản (cản ${(tiCan * 100).toFixed(0)}% < 60%)`,
    tiCan < 0.6 && (doiTheoChieu.get('thuan') ?? 0) > 0,
    Object.fromEntries(doiTheoChieu)
  );
}

// ---------------------------------------------------------------------------
// Quét mã nguồn
// ---------------------------------------------------------------------------

const GOC = path.resolve(__dirname, '..');
const THU_MUC = ['lib', 'app', 'components', 'apps/celes-app/src', 'apps/celes-app/app'];

function duyet(thuMuc: string, ra: string[] = []): string[] {
  const tuyetDoi = path.join(GOC, thuMuc);
  if (!fs.existsSync(tuyetDoi)) return ra;
  for (const ten of fs.readdirSync(tuyetDoi, { withFileTypes: true })) {
    if (ten.name === 'node_modules' || ten.name.startsWith('.')) continue;
    const tuongDoi = `${thuMuc}/${ten.name}`;
    if (ten.isDirectory()) duyet(tuongDoi, ra);
    else if (/\.(ts|tsx)$/.test(ten.name)) ra.push(tuongDoi);
  }
  return ra;
}
const TEP = THU_MUC.flatMap((t) => duyet(t));

/** Dòng chú thích không tính: chú thích được phép nhắc luật cũ để giải thích vì sao bỏ */
const laChuThich = (dong: string) => /^\s*(\*|\/\/|\/\*)/.test(dong);

console.log('\n6. Không đọc tinhChat để luận');
{
  // Chỉ mệnh bàn được dùng nhãn nhóm sách để CHIA CỘT; engine sinh ra nó; chieu-sao giải thích nó
  const DUOC_PHEP = new Set([
    'lib/tuvi/constants.ts',
    'lib/tuvi/ansao.ts',
    'lib/tuvi/chieu-sao.ts',
    'components/laso/PalaceCell.tsx',
    'components/laso/DanhSachCung.tsx',
    'components/laso/TuViChart.tsx',
    'apps/celes-app/src/giao-dien/menh-ban.tsx',
  ]);
  const vi: string[] = [];
  for (const tep of TEP) {
    if (DUOC_PHEP.has(tep)) continue;
    fs.readFileSync(path.join(GOC, tep), 'utf8')
      .split('\n')
      .forEach((dong, i) => {
        if (!laChuThich(dong) && /tinhChat/.test(dong)) vi.push(`${tep}:${i + 1}`);
      });
  }
  kiem(
    'tinhChat chỉ xuất hiện ở engine và mệnh bàn (luận phải qua lib/tuvi/chieu-sao.ts)',
    vi.length === 0,
    vi
  );
}

console.log('\n7. Không còn câu khuôn ép "luôn có lực ngược"');
{
  const CAM: RegExp[] = [
    /TÌM LỰC NGƯỢC/,
    /luôn kéo bạn về hướng ngược lại/,
    /hay kéo bạn về hướng ngược lại/,
    /giữ không kịp/,
    /bắt buộc, chỉ để rỗng nếu thật sự không có/,
    /lực kéo ngược lại\./,
  ];
  const vi: string[] = [];
  for (const tep of TEP) {
    fs.readFileSync(path.join(GOC, tep), 'utf8')
      .split('\n')
      .forEach((dong, i) => {
        if (laChuThich(dong)) return;
        const trung = CAM.find((r) => r.test(dong));
        if (trung) vi.push(`${tep}:${i + 1} ${trung}`);
      });
  }
  kiem('Không câu khuôn cũ nào trong chữ gửi model hay người dùng', vi.length === 0, vi);
}

console.log(sai ? `\n${sai} SAI` : '\nTất cả ĐẠT');
process.exit(sai ? 1 : 0);
