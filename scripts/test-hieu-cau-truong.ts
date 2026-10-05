/**
 * CEL-191 — hiểu câu theo trường trên đường Focused. Offline, model là hàm giả.
 *
 * Kiểm: bảng timeIntent đóng (§5.4), cổng gọi model (§4), gộp theo trường (§5): chủ đề / ý định /
 * thời gian mỗi trường một nguồn, luật thắng khi đã chắc. Nghiệm thu flow 2 và flow 18.
 */
import { lapKeHoachFocused } from '../lib/rag/focused/ke-thua';
import {
  TIME_INTENT,
  canGoiModel,
  coDauHieuThoiGian,
  giaiTimeIntent,
  gopTheoTruong,
  locPhanLoai,
  type PhanLoaiModel,
} from '../lib/rag/focused/hieu-cau-truong';
import { PHIEN_BAN_PLANNER } from '../lib/rag/planner';

let hong = 0;
const kiem = (ok: boolean, ten: string) => {
  if (!ok) {
    hong++;
    console.log(`  ✗ ${ten}`);
  }
};

const NAM = 2026;
const THANG = 8;
const luatCua = (cauHoi: string) => lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: {}, namXem: NAM, thangXem: THANG }).keHoach;
const gop = (cauHoi: string, model: PhanLoaiModel | null) => {
  const luat = luatCua(cauHoi);
  const parserRong = luat.phamViThoiGian === 'khong-ro' && luat.thangMucTieu === undefined;
  return { luat, kq: gopTheoTruong({ luat, model, vao: { cauHoi, namXem: NAM, thangXem: THANG }, parserRong }) };
};

console.log('CEL-191 hiểu câu theo trường');

// §5.4 — bảng đóng.
{
  const g = (ti: string, t = THANG) => JSON.stringify(giaiTimeIntent(ti, NAM, t));
  kiem(g('current-year') === JSON.stringify({ phamViThoiGian: 'nam', namMucTieu: 2026 }), `current-year: ${g('current-year')}`);
  kiem(g('next-year') === JSON.stringify({ phamViThoiGian: 'nam', namMucTieu: 2027 }), `next-year: ${g('next-year')}`);
  kiem(g('previous-year') === JSON.stringify({ phamViThoiGian: 'nam', namMucTieu: 2025 }), `previous-year: ${g('previous-year')}`);
  kiem(g('current-month') === JSON.stringify({ phamViThoiGian: 'thang', thangMucTieu: 8 }), `current-month: ${g('current-month')}`);
  kiem(g('next-month') === JSON.stringify({ phamViThoiGian: 'thang', thangMucTieu: 9 }), `next-month: ${g('next-month')}`);
  kiem(g('next-month', 12) === JSON.stringify({ phamViThoiGian: 'thang', thangMucTieu: 1, namMucTieu: 2027 }), `next-month qua tháng 12: ${g('next-month', 12)}`);
  kiem(g('near-future') === JSON.stringify({ phamViThoiGian: 'gan' }), `near-future: ${g('near-future')}`);
  kiem(g('long-term') === JSON.stringify({ phamViThoiGian: 'giai-doan' }), `long-term: ${g('long-term')}`);
  for (const ti of ['explicit-month', 'none', 'unclear', 'tomorrow', '2027', ''])
    kiem(giaiTimeIntent(ti, NAM, THANG) === null, `giá trị "${ti}" phải ra null`);
  kiem(giaiTimeIntent('current-month', NAM, undefined) === null, 'current-month thiếu tháng xem phải ra null');
  kiem(TIME_INTENT.length === 10, `TIME_INTENT có ${TIME_INTENT.length} ký hiệu`);
  // Lọc đầu ra thô: giá trị lạ bị bỏ, model không bịa được năm.
  kiem(locPhanLoai({ chuDe: 'su-nghiep', yDinh: 'bay-ba', timeIntent: '2027' })?.yDinh === undefined, 'yDinh lạ lọt');
  kiem(locPhanLoai({ chuDe: 'xx', yDinh: 'yy', timeIntent: 'zz' }) === null, 'toàn giá trị lạ phải ra null');
}

// §4 — cổng gọi model.
{
  const cong = (cauHoi: string, x: Partial<Parameters<typeof canGoiModel>[0]> = {}) => {
    const luat = luatCua(cauHoi);
    return canGoiModel({
      keHoach: luat,
      cauHoi,
      parserRong: luat.phamViThoiGian === 'khong-ro' && luat.thangMucTieu === undefined,
      coDoiTuong: false,
      keThua: false,
      ...x,
    });
  };
  kiem(!cong('Năm nay công việc của tôi thế nào?').goi, 'chắc chắn + parser có năm → không gọi');
  kiem(!cong('Công việc của tôi thế nào?').goi, 'chắc chắn + không dấu hiệu thời gian → không gọi');
  const tg = canGoiModel({ keHoach: { chacChan: true }, cauHoi: 'Công việc của tôi this year thế nào?', parserRong: true, coDoiTuong: false, keThua: false });
  kiem(tg.goi && tg.lyDo === 'thoi-gian', `chắc chắn + có dấu hiệu + parser rỗng → 1 lời gọi: ${JSON.stringify(tg)}`);
  kiem(cong('Tôi hỏi linh tinh thôi').lyDo === 'khong-chac', 'không chắc → gọi');
  kiem(!cong('Tôi hỏi linh tinh thôi', { coDoiTuong: true }).goi, 'có người được hỏi → không gọi');
  kiem(!cong('Tôi hỏi linh tinh thôi', { keThua: true }).goi, 'kế thừa → không gọi');
  kiem(!cong('Tôi hỏi linh tinh thôi', { dungModelPhanLoai: false }).goi, 'tắt phân loại → không gọi');
  kiem(coDauHieuThoiGian('How will my career go this year?') && !coDauHieuThoiGian('Tình duyên tôi thế nào?'), 'dấu hiệu thời gian');
  kiem(!coDauHieuThoiGian('Tuần sau tôi đi phỏng vấn được không?'), 'mức ngày/tuần không phải dấu hiệu của trục năm/tháng');
}

// §5 — gộp theo trường.
{
  // Nghiệm thu flow 2: luật co-khong + model thoi-diem → co-khong; tháng vẫn của parser.
  const f2 = gop('Tháng 10 tôi tìm việc được không?', { chuDe: 'su-nghiep', yDinh: 'thoi-diem', timeIntent: 'explicit-month' });
  kiem(f2.kq.keHoach.yDinh === 'co-khong' && f2.kq.nguonTruong.yDinh === 'luat', `flow 2 yDinh: ${f2.kq.keHoach.yDinh}`);
  kiem(f2.kq.keHoach.thangMucTieu === 10 && f2.kq.nguonTruong.thoiGian === 'luat', `flow 2 tháng: ${f2.kq.keHoach.thangMucTieu}`);
  kiem(f2.kq.keHoach.chuDe === 'su-nghiep' && f2.kq.nguonTruong.chuDe === 'model', `flow 2 chủ đề: ${f2.kq.keHoach.chuDe}`);

  // Nghiệm thu flow 18: "this year" → năm xem.
  const f18 = gop('How will my career go this year?', { chuDe: 'su-nghiep', yDinh: 'mo-ta', timeIntent: 'current-year' });
  kiem(f18.kq.keHoach.phamViThoiGian === 'nam' && f18.kq.keHoach.namMucTieu === NAM, `flow 18: ${f18.kq.keHoach.phamViThoiGian} ${f18.kq.keHoach.namMucTieu}`);
  kiem(f18.kq.nguonTruong.thoiGian === 'model' && f18.kq.timeIntentModel === 'current-year', 'flow 18 nguồn thời gian');

  // luật mo-ta + model giai-thich → giai-thich.
  const gt = gop('Tôi hỏi linh tinh thôi', { yDinh: 'giai-thich' });
  kiem(gt.kq.keHoach.yDinh === 'giai-thich' && gt.kq.nguonTruong.yDinh === 'model', `mo-ta + giai-thich: ${gt.kq.keHoach.yDinh}`);

  // luật chắc + model khác chủ đề → luật.
  const chac = gop('Năm nay công việc của tôi thế nào?', { chuDe: 'tinh-cam', yDinh: 'mo-ta', timeIntent: 'next-year' });
  kiem(chac.kq.keHoach === chac.luat, 'luật chắc + parser có năm: phải trả NGUYÊN kế hoạch luật');
  kiem(chac.kq.keHoach.chuDe === 'su-nghiep' && chac.kq.keHoach.namMucTieu === NAM, 'luật chắc bị model đè');

  // model hết giờ / hỏng → luật.
  const het = gop('Tôi hỏi linh tinh thôi', null);
  kiem(het.kq.keHoach === het.luat && het.kq.nguonTruong.chuDe === 'luat' && het.kq.timeIntentModel === null, 'model null phải giữ nguyên luật');

  // Model không có dấu hiệu thời gian trong câu thì timeIntent bị bỏ qua (không bịa năm).
  const khong = gop('Tôi hỏi linh tinh thôi', { timeIntent: 'next-year' });
  kiem(khong.kq.keHoach.phamViThoiGian === 'khong-ro' && khong.kq.nguonTruong.thoiGian === 'luat', 'timeIntent dùng khi câu không có dấu hiệu thời gian');
}

kiem(PHIEN_BAN_PLANNER === '2026.10.4', `PHIEN_BAN_PLANNER đổi: ${PHIEN_BAN_PLANNER}`);

console.log(hong ? `\n${hong} mục hỏng` : 'Tất cả đạt.');
process.exit(hong ? 1 : 0);
