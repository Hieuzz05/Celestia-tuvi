/**
 * Smoke QUICK (CEL-186a) — OFFLINE, không DB, không model.
 *
 *   npm run smoke:quick
 *
 * Chạy đường thật của một lượt chat tới chỗ gọi model, rồi thay model bằng một
 * câu trả lời mẫu CỐ TÌNH bẩn (heading, tiêu đề ý, ba ý, canNhac, chip hỏi
 * tên, dài quá trần) và cho nó đi tiếp qua đúng các lớp hậu kỳ QUICK:
 *
 *   lapKeHoach → doAnToan → nhanDangNgoaiTam → tinhNghiengVe → tinhDoSau
 *     → dungPromptCoCanCu(quick) → [model mẫu] → docTraLoi → kiemQuick → dungVan
 *
 * In một dòng mỗi ca:  PASS "…" QUICK | tinh-cam | ngoaiTam | no-heading
 * Thoát ≠ 0 khi có ca hỏng. Model có nghe prompt hay không thì smoke này
 * không đo được — đó là việc của eval model thật.
 */
import { lapLaSo } from '../lib/tuvi/ansao';
import { doAnToan } from '../lib/rag/an-toan';
import { chonBoiCanh } from '../lib/rag/boi-canh-la-so';
import { docTraLoi, dungGoiBangChung } from '../lib/rag/bang-chung';
import { tinhDoSau, type DoSauTraLoi } from '../lib/rag/hop-dong-tra-loi';
import { demAmTiet, kiemQuick, TRAN_AM_TIET } from '../lib/rag/kiem-quick';
import { khoiNghiengVe, tinhNghiengVe } from '../lib/rag/nghieng-ve';
import { CAU_NGOAI_TAM, cauKetLuanNgoaiTam, nhanDangNgoaiTam } from '../lib/rag/ngoai-tam';
import { lapKeHoach } from '../lib/rag/planner';
import { dungPromptCoCanCu } from '../lib/rag/prompt-co-can-cu';
import { dungVan } from '../lib/rag/tra-loi';

const NAM_XEM = 2026;
const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });

const CA: Array<[string, DoSauTraLoi]> = [
  ['chồng tôi có phải Nguyễn Duy Hiếu ko?', 'QUICK'],
  ['Người yêu tôi có phải Lê Minh không?', 'QUICK'],
  ['Tôi có nên đổi việc không?', 'QUICK'],
  ['Tôi có người yêu không?', 'QUICK'],
  ['toi co nen vay tien ko', 'QUICK'],
  ['Tôi nên ở lại hay nhảy việc?', 'STANDARD'],
  ['Năm nay tôi có bị lỗ không?', 'STANDARD'],
  ['Phân tích chi tiết sự nghiệp của tôi', 'DEEP'],
];

const DAI = 'Phần này đang mở hơn mọi năm, kiểu người dễ gặp cơ hội qua bạn bè và qua công việc thường ngày.';
const mauModel = (chieu: string) =>
  JSON.stringify({
    ketLuan: '## Kết luận\nCó cửa đấy, nhưng chưa vội được.',
    chieuCauChot: chieu,
    tomTat: `**Tóm tắt.** ${DAI} ${DAI} ${DAI}`,
    yChinh: [1, 2, 3].map((i) => ({
      tieuDe: `Ý thứ ${i}`,
      noiDung: `${DAI} ${DAI}`,
      maDuKien: [],
      maNguon: [],
      luongNguoc: DAI,
    })),
    canNhac: ['Hãy nhớ giữ tinh thần lạc quan.'],
    buocTiepTheo: ['Trong tuần tới, hãy ghi lại cảm xúc.'],
    goiYTiep: ['Anh ấy tên gì?', 'Một chip dài hơn bốn mươi ký tự thì không được cắt ngắn', 'Năm nay tình cảm ra sao?'],
  });

const HEADING = /^\s*(?:#|\*\*|[-*] )|^[A-ZĐÀ-Ỹ ]{8,}$/mu;

let hong = 0;
for (const [cau, cho] of CA) {
  const keHoach = lapKeHoach({ cauHoi: cau });
  const anToan = doAnToan(cau);
  const ngoaiTam = nhanDangNgoaiTam(cau);
  const canNghieng = !ngoaiTam && ['quyet-dinh', 'co-khong', 'thoi-diem'].includes(keHoach.yDinh);
  const nghieng = canNghieng
    ? tinhNghiengVe({ laSo, chuDe: keHoach.chuDe, lopHan: keHoach.lopHan, namXem: NAM_XEM, thangXem: 6 })
    : null;
  const { doSau, lyDo } = tinhDoSau({
    yDinh: keHoach.yDinh,
    chuDe: keHoach.chuDe,
    cauHoi: cau,
    namXem: NAM_XEM,
    mucAnToan: anToan.muc,
    laTiepTuChip: false,
    ngoaiTam: !!ngoaiTam,
    coNghieng: !!nghieng,
    cap: nghieng?.cap ?? null,
  });

  const loi: string[] = [];
  const nhan: string[] = [doSau, keHoach.chuDe];
  if (doSau !== cho) loi.push(`độ sâu ${doSau}/${lyDo}, chờ ${cho}`);

  if (doSau === 'QUICK') {
    if (ngoaiTam) nhan.push('ngoaiTam');
    else nhan.push(nghieng!.huong);
    const { duKien } = chonBoiCanh({ laSo, keHoach, namXem: NAM_XEM, thangXem: 6 });
    const goi = dungGoiBangChung(cau, keHoach, duKien, []);
    const prompt = dungPromptCoCanCu(goi, [], [], ngoaiTam ? '' : khoiNghiengVe(nghieng, 'QUICK'), false, undefined, {
      ngoaiTam: !!ngoaiTam,
      tinhNghich: false,
    });
    if (prompt.user.includes('XU HƯỚNG ENGINE ĐÃ CHỐT')) loi.push('prompt QUICK lọt khối hướng STANDARD');
    if (ngoaiTam && prompt.user.includes('HƯỚNG ĐÃ CHỐT')) loi.push('ngoài tầm mà prompt có hướng');

    const chieu = ngoaiTam ? '' : nghieng!.huong.startsWith('thuan') ? 'thuan' : nghieng!.huong === 'can-bang' ? 'ngang' : 'vuong';
    const tho = docTraLoi(mauModel(chieu), { choPhepTomTatRong: true });
    if (!tho) {
      loi.push('docTraLoi trả null');
    } else {
      const { traLoi, vet } = kiemQuick(tho, {
        yDinh: keHoach.yDinh,
        chuDe: keHoach.chuDe,
        cauHoi: cau,
        namXem: NAM_XEM,
        goi,
        huong: nghieng?.huong ?? null,
        ketLuanCoDinh: ngoaiTam ? cauKetLuanNgoaiTam(cau, ngoaiTam) : undefined,
        chieu: tho.chieuCauChot,
        tinhNghich: false,
      });
      const van = dungVan(traLoi, { yDinh: keHoach.yDinh, doSau });
      if (HEADING.test(van)) loi.push('văn có heading');
      else nhan.push('no-heading');
      if (vet.amTiet > TRAN_AM_TIET || demAmTiet(van) > TRAN_AM_TIET + 5) loi.push(`dài ${vet.amTiet} âm tiết`);
      if (traLoi.yChinh.length > 2) loi.push('quá 2 ý');
      if (traLoi.canNhac?.length || traLoi.buocTiepTheo?.length) loi.push('còn canNhac / buocTiepTheo');
      if ((traLoi.goiYTiep ?? []).some((c) => c.length > 40 || /tên gì/i.test(c))) loi.push('chip sai');
      if (ngoaiTam && !(CAU_NGOAI_TAM as readonly string[]).includes(traLoi.ketLuan ?? '')) loi.push('kết luận ngoài tầm không phải câu đã duyệt');
      if (!traLoi.ketLuan) loi.push('mất câu chốt');
      nhan.push(`${vet.amTiet} âm tiết`);
    }
  } else {
    nhan.push(lyDo);
  }

  if (loi.length) hong++;
  console.log(`${loi.length ? 'FAIL' : 'PASS'} "${cau}" ${nhan.join(' | ')}${loi.length ? `  ← ${loi.join('; ')}` : ''}`);
}

console.log(hong ? `\n${hong}/${CA.length} ca hỏng` : `\n${CA.length}/${CA.length} ca qua`);
if (hong) process.exit(1);
