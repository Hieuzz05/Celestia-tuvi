/**
 * Dấu ấn Celes — OFFLINE, không chạm DB, không gọi model thật.
 *
 *   npx tsx scripts/test-dau-an.ts
 *
 * Hai phần:
 *   1–5. cổng của `chonDauAn`: chống lặp, không ketLuan, checker tiếng lóng
 *   6–11. đầu-cuối trên VĂN CUỐI: planner → an toàn → hợp đồng → `dauAnChoLuot`
 *        → `dungVan` → `suaCauTiengLong` (fetch giả) → `doiTenCung` → miễn trừ
 *        → `soatNgonNgu`. Cùng thứ tự với `traLoiCoCanCu`; chỉ thay bước model
 *        sinh bài bằng một bài dựng sẵn.
 *
 * Cổng chống lặp chỉ quét tin TRỢ LÝ LIỀN TRƯỚC. Lặp xa hơn một lượt không chặn ở đây; chuyện
 * model bắt chước câu cũ nó đọc thấy trong lịch sử thì chỉ
 * `scripts/eval-chat-quyet-dinh.ts` đo được.
 */
// Cấu hình model qua biến môi trường để không chạm database — như test-sua-chua-tach
process.env.OPENAI_API_KEY = 'key-openai';
process.env.AI_FALLBACK_ORDER = 'openai|gpt-4o-mini';
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

import type { TinNhan } from '../lib/ai/prompt';
import { datMienTruTamLy, doAnToan } from '../lib/rag/an-toan';
import type { TraLoiCoCauTruc } from '../lib/rag/bang-chung';
import { chonDauAn, kiemCauDauAn, THU_VIEN_DAN_LUAN, type DauVaoDauAn, type LyDoKhong } from '../lib/rag/dau-an';
import { boDanDat, khoiHopDong, tinhHopDong } from '../lib/rag/hop-dong-tra-loi';
import { soatNgonNgu } from '../lib/rag/ngon-ngu';
import { lapKeHoach, type ChuDe, type KeHoachTruyVan, type YDinh } from '../lib/rag/planner';
import { doiTenCung, suaCauTiengLong } from '../lib/rag/sua-chua';
import { laCauNoiTiep } from '../lib/rag/tiep-noi';
import { dauAnChoLuot, dungVan } from '../lib/rag/tra-loi';

const GOC: DauVaoDauAn = {
  chuDe: 'su-nghiep',
  yDinh: 'quyet-dinh',
  mucAnToan: 'NORMAL',
  chacChan: true,
  laCauNoi: false,
  coKetLuan: true,
  boDanDat: false,
};

const MOI_DAU_AN = Object.values(THU_VIEN_DAN_LUAN).flat();

let loi = 0;
function kiem(ten: string, dung: boolean, chiTiet = '') {
  console.log(`${dung ? 'PASS' : 'FAIL'}  ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`);
  if (!dung) loi++;
}

const cauSeChon = chonDauAn(GOC).cau;
kiem('mốc: không lịch sử thì có dấu ấn', cauSeChon !== null);
const cau = cauSeChon ?? '';

// Một câu khác chắc chắn là dấu ấn: lấy từ một yDinh khác.
const cauKhac = chonDauAn({ ...GOC, yDinh: 'giai-thich' }).cau ?? '';
kiem('mốc: câu đối chứng khác câu sẽ chọn', cauKhac !== '' && cauKhac !== cau);

const voiLichSu = (lichSu: TinNhan[]) => chonDauAn({ ...GOC, lichSu });

// 1. Trợ lý liền trước chứa đúng câu sẽ chọn → bỏ.
{
  const r = voiLichSu([
    { vaiTro: 'nguoi-dung', noiDung: 'Có nên đổi việc không?' },
    { vaiTro: 'tro-ly', noiDung: `Nên giữ.\n\n${cau}\n\nPhần còn lại.` },
  ]);
  kiem('1. liền trước chứa đúng câu → không dùng', r.cau === null && r.lyDo === 'lap-lien-truoc', `lyDo=${r.lyDo}`);
}

// 1b. Lượt QUICK (CEL-186a) → không dấu ấn; STANDARD tường minh giữ nguyên như cũ.
{
  const r = chonDauAn({ ...GOC, doSau: 'QUICK' });
  kiem('1b. QUICK → không dấu ấn', r.cau === null && r.lyDo === 'do-sau-quick', `lyDo=${r.lyDo}`);
  kiem('1b. STANDARD tường minh → như không truyền', chonDauAn({ ...GOC, doSau: 'STANDARD' }).cau === cau);
}

// 2. Trợ lý liền trước chứa một dấu ấn KHÁC → vẫn dùng.
{
  const r = voiLichSu([
    { vaiTro: 'nguoi-dung', noiDung: 'Vì sao tôi hay như vậy?' },
    { vaiTro: 'tro-ly', noiDung: `Mở đầu.\n\n${cauKhac}\n\nPhần còn lại.` },
  ]);
  kiem('2. liền trước chứa dấu ấn khác → vẫn dùng', r.cau === cau, `lyDo=${r.lyDo}`);
}

// 3. Không có tin trợ lý nào trước đó → vẫn dùng.
{
  const r = voiLichSu([{ vaiTro: 'nguoi-dung', noiDung: 'Xin chào' }]);
  kiem('3. không có tin trợ lý trước → vẫn dùng', r.cau === cau, `lyDo=${r.lyDo}`);
}

// 3b. Câu nằm ở tin trợ lý CŨ HƠN, tin liền trước thì không → vẫn dùng (chỉ quét một tin).
{
  const r = voiLichSu([
    { vaiTro: 'tro-ly', noiDung: `Cũ.\n\n${cau}` },
    { vaiTro: 'nguoi-dung', noiDung: 'Hỏi tiếp' },
    { vaiTro: 'tro-ly', noiDung: 'Câu trả lời không có dấu ấn.' },
    { vaiTro: 'nguoi-dung', noiDung: 'Hỏi nữa' },
  ]);
  kiem('3b. chỉ quét tin trợ lý liền trước', r.cau === cau, `lyDo=${r.lyDo}`);
}

// 4. Không có ketLuan → không dấu ấn, với MỌI ý định có thư viện.
for (const yDinh of ['quyet-dinh', 'co-khong', 'thoi-diem', 'giai-thich', 'mo-ta'] as const) {
  const r = chonDauAn({ ...GOC, yDinh, coKetLuan: false });
  kiem(`4. ${yDinh} không ketLuan → không dùng`, r.cau === null && r.lyDo === 'khong-ket-luan', `lyDo=${r.lyDo}`);
}

// 5. Checker quét cùng danh sách tiếng lóng với prompt (CUM_TIENG_LONG_CAM).
{
  const hong = kiemCauDauAn('Một chữ có hay không đáng tin hơn khi biết những căn cứ nào đang đỡ lấy nó.');
  kiem('5a. "đang đỡ" → checker bắt', hong.some((l) => l.includes('đang đỡ')), hong.join('; '));
  const dung = kiemCauDauAn('Một chữ có hay không đáng tin hơn khi biết nó dựa vào những căn cứ nào.');
  kiem('5b. "dựa vào những căn cứ nào" → qua', dung.length === 0, dung.join('; '));
  for (const cau of ['Không tách khỏi nhịp chung của lá số.', 'Đó chỉ là phần nổi.', 'Đặt lên nền của bạn.']) {
    const l = kiemCauDauAn(cau);
    kiem(`5c. ẩn dụ đã bỏ bị bắt: «${cau}»`, l.some((x) => x.startsWith('ẩn dụ')), l.join('; '));
  }
  const ghep = kiemCauDauAn('Câu này nói về nềnếp.');
  kiem('5d. không bắt nhầm âm tiết ghép', !ghep.some((x) => x.startsWith('ẩn dụ')), ghep.join('; '));
  for (const cau of ['Mốc đến khi nhiều dấu hiệu cùng đổi.', 'Nguyên do nằm ở lá số.']) {
    const l = kiemCauDauAn(cau);
    kiem(`5f. từ dễ hiểu nhầm bị bắt: «${cau}»`, l.some((x) => x.startsWith('dễ hiểu nhầm')), l.join('; '));
  }
  // Cả thư viện phải qua checker — cùng cổng mà do-coverage chặn merge.
  const hongTV = MOI_DAU_AN.flatMap((c) => kiemCauDauAn(c).map((l) => `${c} → ${l}`));
  kiem('5e. cả thư viện qua kiemCauDauAn', hongTV.length === 0, hongTV.join(' | '));
}

// ── Đầu-cuối trên văn cuối ──────────────────────────────────────────────────

/** fetch giả cho lớp sửa tiếng lóng: viết lại mọi câu C1..Cn thành một câu sạch */
let soLanGoi = 0;
global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
  soLanGoi++;
  const body = JSON.parse(String(init?.body ?? '{}')) as { messages?: { role: string; content: string }[] };
  const user = body.messages?.find((m) => m.role === 'user')?.content ?? '';
  const cau = [...user.matchAll(/^C(\d+)\. (.*)$/gm)].map((m) => ({
    id: `C${m[1]}`,
    moi: 'Năm nay việc mua nhà còn nhiều trở ngại, nên chưa phải lúc chốt.',
  }));
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ cau }) } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}) as typeof fetch;

const KET_LUAN = 'Nghiêng về có: năm nay là lúc thuận để bước tới.';
const TOM_TAT = 'Nhìn chung mọi việc đang mở ra theo hướng tốt.';
const Y1 = 'Cung Quan Lộc có Thiên Phủ, cho thấy bạn giữ việc chắc tay.';
const Y2 = 'Hoá Lộc chiếu vào giúp các mối quan hệ công việc thuận lợi.';
const Y3 = 'Nửa sau năm thường rõ việc hơn nửa đầu.';

function bai(coKetLuan: boolean, them: Partial<TraLoiCoCauTruc> = {}): TraLoiCoCauTruc {
  return {
    ...(coKetLuan ? { ketLuan: KET_LUAN } : {}),
    tomTat: TOM_TAT,
    yChinh: [
      { tieuDe: 'Sức giữ việc', noiDung: Y1, maDuKien: [], maNguon: [] },
      { tieuDe: 'Người hỗ trợ', noiDung: Y2, maDuKien: [], maNguon: [] },
      { tieuDe: 'Nửa sau năm', noiDung: Y3, maDuKien: [], maNguon: [] },
    ],
    canNhac: ['Tình hình tài chính hiện tại', 'Thời hạn hợp đồng cũ'],
    ...them,
  };
}

type KeHoachDauAn = Pick<KeHoachTruyVan, 'chuDe' | 'yDinh' | 'chacChan' | 'phanLoaiBangModel'>;

/** Cùng thứ tự với `traLoiCoCanCu` từ sau bước sinh bài. */
async function chayLuot(
  cauHoi: string,
  traLoi: TraLoiCoCauTruc,
  tuyChon: { lichSu?: TinNhan[]; keHoach?: KeHoachDauAn } = {}
) {
  const lichSu = tuyChon.lichSu ?? [];
  const keHoach = tuyChon.keHoach ?? lapKeHoach({ cauHoi });
  const mucAnToan = doAnToan(cauHoi).muc;
  const hopDong = tinhHopDong({ yDinh: keHoach.yDinh, chuDe: keHoach.chuDe, doDaiCauHoi: cauHoi.length, mucAnToan });
  const laCauNoi = laCauNoiTiep(cauHoi, lichSu);
  const dauAn = dauAnChoLuot({ keHoach, hopDong, mucAnToan, laCauNoi, traLoi, lichSu });
  const vanTho = dungVan(traLoi, { yDinh: keHoach.yDinh, laCauNoi, dauAn: dauAn.cau ?? undefined });
  soLanGoi = 0;
  const vanDaSua = await suaCauTiengLong(vanTho, []);
  const goiModel = soLanGoi;
  const vanDaDoiTen = doiTenCung(vanDaSua);
  const van = mucAnToan === 'SENSITIVE' ? datMienTruTamLy(vanDaDoiTen) : vanDaDoiTen;
  const ngonNgu = soatNgonNgu(van, traLoi.yChinh.map((y) => y.tieuDe || y.noiDung));
  const loiChan = ngonNgu.loi.filter((l) => l.mucDo === 'chan').map((l) => l.ma);
  return { van, vanTho, dauAn, goiModel, loiChan };
}

const doan = (van: string) => van.split('\n\n');
const coDauAnTrongVan = (van: string) => MOI_DAU_AN.some((c) => van.includes(c));

async function e2e() {
  // 6. Bất biến: cổng dấu ấn đọc ĐÚNG điều kiện phát chỉ thị "bỏ phần dẫn dắt".
  {
    const Y: YDinh[] = ['quyet-dinh', 'co-khong', 'thoi-diem', 'giai-thich', 'mo-ta', 'tra-cuu'];
    const C: ChuDe[] = ['su-nghiep', 'tai-chinh', 'tinh-cam', 'gia-dao', 'suc-khoe', 'tong-quan'];
    let lech = 0;
    let soCo = 0;
    let tong = 0;
    for (const yDinh of Y)
      for (const chuDe of C)
        for (const doDaiCauHoi of [5, 60, 61, 219, 220, 400])
          for (const mucAnToan of ['NORMAL', 'SENSITIVE'] as const) {
            tong++;
            const h = tinhHopDong({ yDinh, chuDe, doDaiCauHoi, mucAnToan });
            const chiThi = khoiHopDong(h, yDinh).includes('bỏ phần dẫn dắt');
            if (boDanDat(h, yDinh)) soCo++;
            if (boDanDat(h, yDinh) !== chiThi) lech++;
          }
    kiem(`6. boDanDat ⇔ prompt có "bỏ phần dẫn dắt" (${tong} tổ hợp)`, lech === 0 && soCo > 0, `lệch=${lech}, bật=${soCo}`);
  }

  // 7. mo-ta ngắn + hợp đồng bỏ dẫn dắt → 0 dấu ấn, kể cả khi CÓ ketLuan.
  {
    const r = await chayLuot('tình duyên tôi thế nào', bai(true));
    kiem(
      '7. mo-ta ngắn + bỏ dẫn dắt → 0 dấu ấn',
      r.dauAn.lyDo === 'bo-dan-dat' && !coDauAnTrongVan(r.van) && doan(r.van)[0] === KET_LUAN,
      `lyDo=${r.dauAn.lyDo}`
    );
    // Đối chứng: cùng chủ đề mà câu dài thì có — cổng là của nhịp, không phải của mo-ta.
    const dai = await chayLuot(
      'Bạn xem giúp tôi chuyện tình duyên của tôi nhìn chung thế nào, tôi đang khá băn khoăn về chuyện này',
      bai(true)
    );
    kiem('7b. mo-ta câu dài → vẫn có dấu ấn', dai.dauAn.cau !== null, `lyDo=${dai.dauAn.lyDo}`);
  }

  // 8. co-khong không ketLuan → 0 dấu ấn, câu đầu vẫn là câu nghiêng hướng.
  {
    const NGHIENG = 'Nghiêng về thuận: buổi phỏng vấn này có lợi cho bạn.';
    const r = await chayLuot('Hôm nay tôi đi phỏng vấn Sapo, tôi có thuận lợi ko', bai(false, { tomTat: NGHIENG }));
    kiem(
      '8. co-khong không ketLuan → 0 dấu ấn, câu đầu là câu nghiêng',
      r.dauAn.lyDo === 'khong-ket-luan' && !coDauAnTrongVan(r.van) && doan(r.van)[0] === NGHIENG,
      `lyDo=${r.dauAn.lyDo} đầu=${JSON.stringify(doan(r.van)[0])}`
    );
  }

  // 9. Có ketLuan + được phép → ketLuan → dấu ấn → tóm tắt → yChinh, với cả năm ý định.
  for (const yDinh of ['quyet-dinh', 'co-khong', 'thoi-diem', 'giai-thich', 'mo-ta'] as const) {
    const r = await chayLuot(
      'Tôi muốn hỏi kỹ hơn về chuyện công việc của mình trong năm nay, bạn xem giúp tôi với nhé',
      bai(true),
      { keHoach: { chuDe: 'su-nghiep', yDinh, chacChan: true } }
    );
    const d = doan(r.van);
    // Khớp theo tiêu đề: `doiTenCung` đổi "Cung Quan Lộc" trong thân ý.
    const iY1 = d.findIndex((x) => x.startsWith('### Sức giữ việc'));
    kiem(
      `9. ${yDinh}: ketLuan → dấu ấn → tóm tắt → yChinh`,
      r.dauAn.cau !== null && d[0] === KET_LUAN && d[1] === r.dauAn.cau && d[2] === TOM_TAT && iY1 > 2,
      JSON.stringify(d.slice(0, 4))
    );
  }

  // 10. SENSITIVE / tra-cuu / planner không chắc / câu nối → 0 dấu ấn trên văn cuối.
  {
    const ca: { ten: string; lyDo: LyDoKhong; cauHoi: string; lichSu?: TinNhan[] }[] = [
      { ten: 'SENSITIVE', lyDo: 'an-toan', cauHoi: 'Dạo này mình thấy tuyệt vọng về mọi thứ, lá số nói gì' },
      { ten: 'tra-cuu', lyDo: 'tra-cuu', cauHoi: 'Sao Tử Vi nghĩa là gì?' },
      { ten: 'planner không chắc', lyDo: 'planner-khong-chac', cauHoi: 'hi' },
      {
        ten: 'câu nối',
        lyDo: 'cau-noi',
        // Ô planner CHẮC — để cổng câu nối, không phải cổng planner, là cổng chặn.
        cauHoi: 'thế còn tài chính của tôi thì sao',
        lichSu: [
          { vaiTro: 'nguoi-dung', noiDung: 'Năm nay tôi có nên đổi việc không?' },
          { vaiTro: 'tro-ly', noiDung: 'Nghiêng về giữ.' },
        ],
      },
    ];
    for (const c of ca) {
      const r = await chayLuot(c.cauHoi, bai(true), { lichSu: c.lichSu });
      kiem(
        `10. ${c.ten} → 0 dấu ấn (${c.lyDo})`,
        r.dauAn.lyDo === c.lyDo && !coDauAnTrongVan(r.van),
        `lyDo=${r.dauAn.lyDo}`
      );
    }
  }

  // 11. Dấu ấn + lớp sửa câu: đoạn còn nguyên, văn cuối qua cổng ngôn ngữ.
  {
    const keHoach: KeHoachDauAn = { chuDe: 'su-nghiep', yDinh: 'quyet-dinh', chacChan: true };
    const cauHoi = 'Năm nay tôi có nên dồn tiền mua nhà hay đợi thêm một thời gian nữa cho chắc';
    const sach = await chayLuot(cauHoi, bai(true), { keHoach });
    kiem('11a. bài sạch: không gọi model sửa câu', sach.goiModel === 0, `gọi=${sach.goiModel}`);
    kiem('11b. bài sạch: văn cuối không lỗi chặn', sach.loiChan.length === 0, sach.loiChan.join(', '));

    const LONG = 'Năm 2026 chưa rõ khả năng mua nhà, vì các yếu tố cản vẫn khá mạnh.';
    const tho = bai(true, {
      yChinh: [
        { tieuDe: 'Sức giữ việc', noiDung: `${Y1} ${LONG}`, maDuKien: [], maNguon: [] },
        { tieuDe: 'Người hỗ trợ', noiDung: Y2, maDuKien: [], maNguon: [] },
        { tieuDe: 'Nửa sau năm', noiDung: Y3, maDuKien: [], maNguon: [] },
      ],
    });
    const r = await chayLuot(cauHoi, tho, { keHoach });
    const truoc = doan(r.vanTho);
    const sau = doan(r.van);
    kiem('11c. có câu tiếng lóng: model sửa được gọi', r.goiModel === 1, `gọi=${r.goiModel}`);
    kiem('11d. số đoạn giữ nguyên sau sửa', truoc.length === sau.length, `${truoc.length} → ${sau.length}`);
    kiem('11e. dấu ấn vẫn đứng một đoạn, ngay sau ketLuan', sau[0] === KET_LUAN && sau[1] === r.dauAn.cau);
    kiem(
      '11f. tiêu đề và gạch đầu dòng còn nguyên',
      r.van.includes('### Sức giữ việc\n') && r.van.includes('\n- Thời hạn hợp đồng cũ')
    );
    kiem('11g. câu tiếng lóng đã được sửa', !r.van.includes('yếu tố cản'));
    kiem('11h. văn cuối không lỗi chặn', r.loiChan.length === 0, r.loiChan.join(', '));
  }
}

e2e().then(() => {
  console.log(loi === 0 ? '\nXANH' : `\nĐỎ: ${loi} lỗi`);
  process.exit(loi === 0 ? 0 : 1);
});
