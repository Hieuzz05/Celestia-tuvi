/**
 * Quick answer (CEL-186a) — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-quick-answer.ts
 *
 * Khoá:
 *  1. Prompt: không truyền `quick` thì ra đúng như gọi không có tham số thứ
 *     bảy (prompt STANDARD không đổi). Prompt QUICK không có khối "XU HƯỚNG
 *     ENGINE ĐÃ CHỐT", "CÓ / THUẬN", mẫu vàng, khối hợp đồng; khối nghiêng QUICK
 *     không có tự kiểm / kế hoạch / hỏi lại.
 *  2. `kiemQuick`: mỗi lý do dự phòng có một ca; câu dự phòng đúng bảng §22,
 *     tiền tố năm chỉ khi người dùng hỏi về năm; lệch hướng bỏ cả phần thân.
 *  3. Ngoài tầm: kết luận do mã đặt, không bị soát / thay.
 *  4. Trần 150 âm tiết, không cắt giữa câu; không heading, không canNhac /
 *     buocTiepTheo; emoji chỉ giữ một khi được trêu.
 *  5. Chip: ≤ 40 ký tự, không cắt, bỏ chip hỏi tên, bù tới 2, tối đa 3.
 *  6. `dungVan` QUICK: khuôn tin nhắn, không heading.
 *  7. `laKhangDinhDoiThat`, `choPhepTinhNghich`.
 *
 * Bài này KHÔNG kiểm model có nghe hay không. Chuyện đó là eval model thật.
 *
 * Prompt STANDARD còn được so TỪNG BYTE với bản trước CEL-186a một lần khi
 * viết (96 tổ hợp lá số × câu hỏi × lịch sử × hợp đồng, lệch 0). Bài này giữ
 * phần so được mà không cần bản cũ.
 */
import { lapLaSo } from '../lib/tuvi/ansao';
import { lapKeHoach } from '../lib/rag/planner';
import { chonBoiCanh } from '../lib/rag/boi-canh-la-so';
import { dungGoiBangChung, type TraLoiCoCauTruc } from '../lib/rag/bang-chung';
import { dungPromptCoCanCu } from '../lib/rag/prompt-co-can-cu';
import { khoiNghiengVe, tinhNghiengVe, type HuongNghieng } from '../lib/rag/nghieng-ve';
import { tinhHopDong } from '../lib/rag/hop-dong-tra-loi';
import { cauChotDuPhong, cumChoChuDe } from '../lib/rag/chot-huong';
import { cauKetLuanNgoaiTam, CAU_NGOAI_TAM, nhanDangNgoaiTam } from '../lib/rag/ngoai-tam';
import {
  choPhepTinhNghich,
  demAmTiet,
  kiemQuick,
  laKhangDinhDoiThat,
  locChipQuick,
  TRAN_AM_TIET,
  vanQuickDeDo,
  type LyDoDuPhong,
  type VaoKiemQuick,
} from '../lib/rag/kiem-quick';
import { nhanDangThucThe, TU_DIEN_THUC_THE } from '../lib/rag/thuc-the';
import { dungVan } from '../lib/rag/tra-loi';

let hong = 0;
function kiem(ten: string, dung: boolean, chiTiet?: unknown) {
  if (dung) console.log(`  ✓ ${ten}`);
  else {
    hong++;
    console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ` → ${JSON.stringify(chiTiet)}`}`);
  }
}

const CAU = 'Tôi có người yêu không?';
const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
const keHoach = lapKeHoach({ cauHoi: CAU });
const { duKien } = chonBoiCanh({ laSo, keHoach, namXem: 2026, thangXem: 9 });
const goi = dungGoiBangChung(CAU, keHoach, duKien, []);
const nghieng = tinhNghiengVe({ laSo, chuDe: keHoach.chuDe, lopHan: keHoach.lopHan, namXem: 2026, thangXem: 9 });

/* ------------------------------------------------------------ 1. prompt */

console.log('\n== PROMPT ==');
const khoiStd = khoiNghiengVe(nghieng);
const khoiQ = khoiNghiengVe(nghieng, 'QUICK');
kiem('engine có hướng cho ca mẫu', !!nghieng, keHoach);
kiem('khoiNghiengVe mặc định = STANDARD', khoiStd === khoiNghiengVe(nghieng, 'STANDARD'));
const hd = tinhHopDong({ yDinh: keHoach.yDinh, chuDe: keHoach.chuDe, doDaiCauHoi: CAU.length });
const a = dungPromptCoCanCu(goi, [], [], khoiStd, false, hd);
const b = dungPromptCoCanCu(goi, [], [], khoiStd, false, hd, undefined);
kiem('quick = undefined → prompt STANDARD giống từng byte', a.system === b.system && a.user === b.user);
kiem('prompt STANDARD vẫn có khối hướng engine', a.user.includes('XU HƯỚNG ENGINE ĐÃ CHỐT'));

const q = dungPromptCoCanCu(goi, [], [], khoiQ, false, undefined, { ngoaiTam: false, tinhNghich: false });
kiem('prompt QUICK: system khác STANDARD', q.system !== a.system);
kiem('prompt QUICK: không "XU HƯỚNG ENGINE ĐÃ CHỐT"', !q.user.includes('XU HƯỚNG ENGINE ĐÃ CHỐT'));
kiem('prompt QUICK: không "CÓ / THUẬN"', !/CÓ \/ THUẬN/.test(q.user + q.system));
kiem('prompt QUICK: có khối giọng Celes', q.system.includes('GIỌNG CELES'));
kiem('prompt QUICK: có hướng đã chốt', q.user.includes('HƯỚNG ĐÃ CHỐT'));
kiem('prompt QUICK: không khối hợp đồng', !q.user.includes('CÁCH VIẾT LƯỢT NÀY'));
kiem('prompt QUICK: câu hỏi đứng cuối', q.user.trimEnd().endsWith(CAU));
kiem('prompt QUICK: dặn không đùa khi không được trêu', q.user.includes('không đùa'));
kiem('khối nghiêng QUICK: không tự kiểm / kế hoạch / hỏi lại', !/tự kiểm|kế hoạch|hỏi lại|tuKiem|hoiLai/i.test(khoiQ), khoiQ);

const lichSu = [
  { vaiTro: 'nguoi-dung' as const, noiDung: 'Tôi có nên đổi việc không?' },
  { vaiTro: 'tro-ly' as const, noiDung: 'Nghe thì chuyện đổi việc của bạn đang khá thuận.\n\nPhần sau.' },
];
const qNt = dungPromptCoCanCu(goi, lichSu, [], '', false, undefined, { ngoaiTam: true, tinhNghich: true });
kiem('prompt ngoài tầm: không khối hướng', !qNt.user.includes('HƯỚNG ĐÃ CHỐT'));
kiem('prompt ngoài tầm: nhắc mở đầu cũ', qNt.user.includes('Đừng mở lại như vậy'));

/* -------------------------------------------------------- 2. kiemQuick */

console.log('\n== CÂU CHỐT DỰ PHÒNG ==');
const idTrongGoi = new Set(
  nhanDangThucThe([...goi.duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')).map((t) => t.id)
);
const saoCo = nhanDangThucThe(goi.duKien.map((f) => f.noiDung).join(' ')).find((t) => t.loai === 'STAR');
const saoKhong = TU_DIEN_THUC_THE.filter((t) => t.loai === 'STAR' && !idTrongGoi.has(t.id))
  .map((t) => t.ten)
  .find((ten) => nhanDangThucThe(`Có ${ten} nên vậy.`).some((x) => x.loai === 'STAR'));
kiem('gói mẫu có một sao để thử tên sao', !!saoCo && !!saoKhong, { saoCo, saoKhong });

const HUONG: HuongNghieng = 'thuan-nhe';
const vao = (doi: Partial<VaoKiemQuick> = {}): VaoKiemQuick => ({
  yDinh: 'co-khong',
  chuDe: 'tinh-cam',
  cauHoi: CAU,
  namXem: 2026,
  goi,
  huong: HUONG,
  chieu: 'thuan',
  tinhNghich: false,
  ...doi,
});
const bai = (ketLuan: string, doi: Partial<TraLoiCoCauTruc> = {}): TraLoiCoCauTruc => ({
  ketLuan,
  tomTat: 'Chuyện này có cửa, nhưng cần thêm thời gian để thành hình.',
  yChinh: [
    {
      tieuDe: 'Tiêu đề phải bị bỏ',
      noiDung: 'Phần tình cảm năm nay mở hơn mọi năm, kiểu người dễ gặp người hợp qua bạn bè.',
      maDuKien: [goi.duKien[0]?.id ?? 'F001'],
      maNguon: [],
      luongNguoc: 'Điểm vướng là bạn hay chần chừ ở bước đầu.',
    },
  ],
  canNhac: ['phải bị bỏ'],
  buocTiepTheo: ['phải bị bỏ'],
  goiYTiep: ['Tôi hợp mẫu người thế nào?'],
  ...doi,
});

const duPhongMau = cauChotDuPhong({ yDinh: 'co-khong', huong: HUONG, chuDe: 'tinh-cam', cauHoi: CAU, namXem: 2026 })!;
kiem('câu dự phòng không có tiền tố năm khi câu hỏi không nhắc năm', !/^Năm \d{4}/.test(duPhongMau), duPhongMau);
kiem(
  'câu dự phòng có tiền tố năm khi hỏi "năm nay"',
  /^Năm 2026, /.test(
    cauChotDuPhong({ yDinh: 'co-khong', huong: HUONG, chuDe: 'tinh-cam', cauHoi: 'Năm nay tôi có người yêu không?', namXem: 2026 }) ?? ''
  )
);

kiem('"tôi có người yêu không" → chuyện tình cảm, không phải "mối quan hệ này"', cumChoChuDe('tinh-cam', CAU) === 'chuyện tình cảm');
kiem('"người yêu tôi …" → mối quan hệ này', cumChoChuDe('tinh-cam', 'Người yêu tôi có chung thủy không?') === 'mối quan hệ này');
kiem('"chồng tôi …" → chuyện vợ chồng', cumChoChuDe('tinh-cam', 'Chồng tôi có thương tôi không?') === 'chuyện vợ chồng');

const CA_DU_PHONG: Array<[LyDoDuPhong, string, Partial<VaoKiemQuick>?]> = [
  ['rong', ''],
  ['nguoc-huong', 'Chuyện tình cảm đang khá vướng.', { chieu: 'vuong' }],
  ['qua-chac', 'Chắc chắn năm nay có người yêu.'],
  ['phan-quyet', 'Hai người không hợp nhau đâu.'],
  ['giong-report', 'Dựa trên các dữ kiện, chuyện tình cảm có cửa.'],
  ['tieng-long', 'Có yếu tố đỡ nên chuyện tình cảm có cửa.'],
  ['ten-sao', `Có ${saoCo?.ten ?? 'Thái Dương'} nên chuyện tình cảm có cửa.`],
  ['ten-bia', `Có ${saoKhong ?? 'Thất Sát'} nên chuyện tình cảm có cửa.`],
  ['khang-dinh-doi-that', 'Bạn đang thích một người rồi.'],
  ['tu-giup', 'Hãy thử mở lòng hơn với người quanh mình.'],
];
for (const [lyDo, ketLuan, doi] of CA_DU_PHONG) {
  const { traLoi, vet } = kiemQuick(bai(ketLuan), vao(doi));
  kiem(`${lyDo}: thay bằng câu dự phòng`, vet.duPhong === lyDo && traLoi.ketLuan === duPhongMau, { vet, ket: traLoi.ketLuan });
}

{
  const { traLoi, vet } = kiemQuick(bai('Chuyện này có cửa đấy, nhưng chưa vội được.'), vao());
  kiem('câu chốt sạch: giữ nguyên câu model', vet.duPhong === null && traLoi.ketLuan === 'Chuyện này có cửa đấy, nhưng chưa vội được.', vet);
}
{
  const { traLoi } = kiemQuick(bai('Chuyện tình cảm đang khá vướng.'), vao({ chieu: 'vuong' }));
  kiem('lệch hướng: bỏ cả tomTat lẫn ý', traLoi.tomTat === '' && traLoi.yChinh.length === 0, traLoi);
}
{
  const { traLoi, vet } = kiemQuick(bai('Có cửa đấy.'), vao({ chieu: undefined }));
  kiem('thiếu chieu: KHÔNG thay, chỉ ghi vết', vet.duPhong === null && vet.thieuChieu && traLoi.ketLuan === 'Có cửa đấy.', vet);
}
{
  const { traLoi } = kiemQuick(bai('Có cửa đấy. Câu thứ hai phải rụng.'), vao());
  kiem('câu chốt chỉ giữ câu đầu', traLoi.ketLuan === 'Có cửa đấy.', traLoi.ketLuan);
}

/* -------------------------------------------------------- 3. ngoài tầm */

console.log('\n== NGOÀI TẦM ==');
{
  const cau = 'chồng tôi có phải Nguyễn Duy Hiếu ko?';
  const nt = nhanDangNgoaiTam(cau)!;
  const ket = cauKetLuanNgoaiTam(cau, nt);
  const { traLoi, vet } = kiemQuick(
    bai('Có, chính là anh ấy!', {
      tomTat: 'Lá số chỉ nói được mẫu người hợp với bạn.',
      goiYTiep: ['Anh ấy tên gì?', 'Có phải Hiếu không?', 'Tôi hợp mẫu người thế nào?'],
    }),
    vao({ cauHoi: cau, huong: null, chieu: undefined, ketLuanCoDinh: ket })
  );
  kiem('ca A: kết luận do mã đặt, thuộc ba câu đã duyệt', traLoi.ketLuan === ket && (CAU_NGOAI_TAM as readonly string[]).includes(ket), traLoi.ketLuan);
  kiem('ca A: không ghi dự phòng', vet.duPhong === null);
  kiem('ca A: chip hỏi tên bị bỏ', !(traLoi.goiYTiep ?? []).some((c) => /tên gì|Hiếu/.test(c)), traLoi.goiYTiep);
  kiem('ca A: chip vẫn có ít nhất 2', (traLoi.goiYTiep ?? []).length >= 2, traLoi.goiYTiep);
}

/* -------------------------------------------------- 4. độ dài, khuôn */

console.log('\n== ĐỘ DÀI VÀ KHUÔN ==');
{
  const dai = 'Phần tình cảm năm nay mở hơn mọi năm, kiểu người dễ gặp người hợp qua bạn bè và qua công việc thường ngày.';
  const y = (i: number) => ({
    tieuDe: `Ý ${i}`,
    noiDung: `${dai} ${dai}`,
    maDuKien: [],
    maNguon: [],
    luongNguoc: `${dai}`,
  });
  const { traLoi, vet } = kiemQuick(bai('Có cửa đấy.', { tomTat: `${dai} ${dai} ${dai}`, yChinh: [y(1), y(2), y(3)] }), vao());
  kiem(`trần ${TRAN_AM_TIET} âm tiết`, vet.amTiet <= TRAN_AM_TIET && demAmTiet(vanQuickDeDo(traLoi)) === vet.amTiet, vet);
  kiem('tối đa 2 ý', traLoi.yChinh.length <= 2);
  kiem('không cắt giữa câu', [traLoi.tomTat, ...traLoi.yChinh.map((x) => x.noiDung)].every((s) => !s || /[.!?…]$/.test(s)), traLoi);
  kiem('không tiêu đề ý', traLoi.yChinh.every((x) => x.tieuDe === ''));
  kiem('canNhac / buocTiepTheo rỗng', !traLoi.canNhac?.length && !traLoi.buocTiepTheo?.length);
}
{
  const { traLoi } = kiemQuick(bai('Có cửa đấy 😄 thật 🎉.'), vao({ tinhNghich: false }));
  kiem('không được trêu: gỡ hết emoji', !/\p{Extended_Pictographic}/u.test(traLoi.ketLuan ?? ''), traLoi.ketLuan);
  const r2 = kiemQuick(bai('Có cửa đấy 😄 thật 🎉.'), vao({ tinhNghich: true }));
  kiem('được trêu: giữ đúng một emoji', ((r2.traLoi.ketLuan ?? '').match(/\p{Extended_Pictographic}/gu) ?? []).length === 1, r2.traLoi.ketLuan);
}
{
  const { traLoi } = kiemQuick(
    bai('Có cửa đấy.', {
      tomTat: 'Chuyện này có cửa. Bạn nên quan sát kỹ hơn trong tuần tới.',
      yChinh: [{ tieuDe: '', noiDung: 'Dựa trên các dữ kiện, phần này ổn.', maDuKien: [], maNguon: [] }],
    }),
    vao()
  );
  kiem('câu self-help trong tomTat bị bỏ', traLoi.tomTat === 'Chuyện này có cửa.', traLoi.tomTat);
  kiem('ý chỉ còn giọng report bị bỏ', traLoi.yChinh.length === 0, traLoi.yChinh);
}

console.log('\n== DỰNG VĂN ==');
{
  const { traLoi } = kiemQuick(bai('Có cửa đấy.'), vao());
  const van = dungVan(traLoi, { doSau: 'QUICK' });
  kiem('dungVan QUICK: không heading', !/^#|^\*\*|^[A-ZĐ ]{6,}$/m.test(van), van);
  kiem('dungVan QUICK: mở bằng câu chốt', van.startsWith('Có cửa đấy.'), van);
  kiem('dungVan QUICK: không "Muốn biết vì sao"', !/Muốn biết vì sao/.test(van));
}

/* ------------------------------------------------------------ 5. chip */

console.log('\n== CHIP ==');
{
  const dai = 'Một chip dài hơn bốn mươi ký tự thì không được cắt ngắn';
  const ra = locChipQuick([`  ${dai}  `, 'Anh ấy tên gì?', '  Năm nay tình cảm ra sao?  ', CAU, 'A?', 'B?', 'C?'], CAU, 'tinh-cam');
  kiem('chip > 40 ký tự bị bỏ, không cắt', !ra.some((c) => c.startsWith('Một chip')), ra);
  kiem('chip hỏi tên bị bỏ', !ra.includes('Anh ấy tên gì?'), ra);
  kiem('chip được trim', ra.includes('Năm nay tình cảm ra sao?'), ra);
  kiem('chip trùng câu hỏi bị bỏ', !ra.includes(CAU), ra);
  kiem('tối đa 3 chip', ra.length === 3, ra);
  kiem('rỗng → bù tới 2', locChipQuick([], CAU, 'su-nghiep').length === 2);
}

/* ------------------------------------------- 6. khẳng định đời thật */

console.log('\n== KHẲNG ĐỊNH ĐỜI THẬT ==');
for (const c of ['Bạn đang thích một người.', 'Bạn sẽ gặp người ấy trong năm nay.', 'Bạn vẫn còn nhớ người cũ.'])
  kiem(`bắt: "${c}"`, laKhangDinhDoiThat(c));
for (const c of [
  'Nếu bạn đang thích ai, đây là lúc dễ mở lời.',
  'Khi bạn đã sẵn sàng thì chuyện sẽ nhanh.',
  'Phần tình cảm của bạn đang mở.',
  'Bạn sẽ thấy mình dễ mở lòng hơn.',
  'Bạn đang thích ai à?',
])
  kiem(`không bắt: "${c}"`, !laKhangDinhDoiThat(c));

/* --------------------------------------------------------- 7. tinh nghịch */

console.log('\n== TINH NGHỊCH ==');
const TN = {
  doSau: 'QUICK' as const,
  mucAnToan: 'NORMAL' as const,
  chuDe: 'tinh-cam' as const,
  cauHoi: CAU,
  huong: 'thuan-nhe' as HuongNghieng,
  ngoaiTam: false,
  lichSu: [],
  coBat: true,
};
kiem('đủ điều kiện → được trêu', choPhepTinhNghich(TN));
kiem('cờ tắt → không', !choPhepTinhNghich({ ...TN, coBat: false }));
kiem('STANDARD → không', !choPhepTinhNghich({ ...TN, doSau: 'STANDARD' }));
kiem('SENSITIVE → không', !choPhepTinhNghich({ ...TN, mucAnToan: 'SENSITIVE' }));
kiem('hướng vướng → không', !choPhepTinhNghich({ ...TN, huong: 'can-nhe' }));
kiem('ngoài tầm, không hướng → được', choPhepTinhNghich({ ...TN, huong: null, ngoaiTam: true }));
kiem('câu chiều xấu → không', !choPhepTinhNghich({ ...TN, cauHoi: 'Tôi có chia tay không?' }));
kiem('sức khoẻ → không', !choPhepTinhNghich({ ...TN, chuDe: 'suc-khoe' }));
kiem(
  'tin trước có chủ đề nặng → không',
  !choPhepTinhNghich({ ...TN, lichSu: [{ vaiTro: 'nguoi-dung', noiDung: 'Mẹ tôi vừa phẫu thuật xong.' }] })
);

console.log(hong ? `\n✗ ${hong} ca hỏng` : '\n✓ Quick answer: tất cả ca đạt');
if (hong) process.exit(1);
