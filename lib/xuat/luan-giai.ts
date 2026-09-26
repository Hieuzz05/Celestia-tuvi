import path from 'node:path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * XUẤT LUẬN GIẢI CHUYÊN SÂU ra Excel / PDF (CEL-137) — chỉ tài khoản quản trị.
 *
 * Nhận đúng những gì trang /luan-giai/sau đang hiện (các câu, "Tóm lại", "Bức
 * tranh lớn"), nên file xuất ra khớp từng chữ với bài người xem đọc — không sinh
 * lại, không đọc đệm theo đường riêng.
 *
 * PDF nhúng font Be Vietnam Pro (OFL, lib/xuat/fonts): font chuẩn của PDF không
 * có dấu tiếng Việt.
 */

export interface CauXuat {
  id: string;
  cauHoi: string;
  luanGiai: string;
  viSao?: string;
  goiY?: string;
  chuaViet?: boolean;
}

export interface ChuDeXuat {
  id: string;
  ten: string;
  dan?: string;
  cau: CauXuat[];
  tomLai?: string | null;
}

export interface GoiXuat {
  ten?: string;
  thongTinSinh: string;
  namXem: number;
  chuDe: ChuDeXuat[];
  bucTranh?: string | null;
}

const doanVan = (s: string | null | undefined) =>
  (s ?? '')
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);

const ngayXuat = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

// ---------------------------------------------------------------- Excel

const FONT = 'Arial';
const MAU_DAU = 'FF3B2A6B';

function kieuDau(row: ExcelJS.Row) {
  row.font = { name: FONT, bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU_DAU } };
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 22;
}

export async function taoExcel(g: GoiXuat): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Celestia';
  wb.created = new Date();

  // Trang 1 — thông tin lá số và mục lục
  const tq = wb.addWorksheet('Tổng quan');
  tq.columns = [{ width: 26 }, { width: 70 }, { width: 12 }];
  tq.addRow(['Luận giải chuyên sâu — Celestia']).font = { name: FONT, bold: true, size: 14 };
  tq.addRow([]);
  for (const [k, v] of [
    ['Lá số', g.ten || '(không tên)'],
    ['Thông tin sinh', g.thongTinSinh],
    ['Năm xem', String(g.namXem)],
    ['Xuất lúc', ngayXuat()],
  ]) {
    const r = tq.addRow([k, v]);
    r.getCell(1).font = { name: FONT, bold: true };
    r.getCell(2).font = { name: FONT };
  }
  tq.addRow([]);
  kieuDau(tq.addRow(['Chủ đề', 'Câu dẫn', 'Số câu']));
  for (const c of g.chuDe) {
    const r = tq.addRow([c.ten, c.dan ?? '', c.cau.length]);
    r.font = { name: FONT };
    r.alignment = { vertical: 'top', wrapText: true };
  }

  // Trang 2 — từng câu, mỗi câu một dòng để lọc / so sánh
  const lg = wb.addWorksheet('Luận giải', { views: [{ state: 'frozen', ySplit: 1 }] });
  lg.columns = [
    { header: 'STT', width: 6 },
    { header: 'Chủ đề', width: 18 },
    { header: 'Mã câu', width: 9 },
    { header: 'Câu hỏi', width: 40 },
    { header: 'Luận giải', width: 90 },
    { header: 'Muốn biết vì sao', width: 60 },
    { header: 'Gợi ý của Celes', width: 45 },
  ];
  kieuDau(lg.getRow(1));
  let stt = 0;
  for (const c of g.chuDe) {
    for (const q of c.cau) {
      const r = lg.addRow([
        ++stt,
        c.ten,
        q.id,
        q.cauHoi,
        q.chuaViet ? '(Celes chưa viết được câu này)' : q.luanGiai,
        q.viSao ?? '',
        q.goiY ?? '',
      ]);
      r.font = { name: FONT };
      r.alignment = { vertical: 'top', wrapText: true };
    }
  }
  lg.autoFilter = { from: 'A1', to: 'G1' };

  // Trang 3 — phần tổng hợp: Tóm lại từng chủ đề và Bức tranh lớn
  const th = wb.addWorksheet('Tóm lại', { views: [{ state: 'frozen', ySplit: 1 }] });
  th.columns = [
    { header: 'Chủ đề', width: 22 },
    { header: 'Tóm lại', width: 110 },
  ];
  kieuDau(th.getRow(1));
  for (const c of g.chuDe) {
    const r = th.addRow([c.ten, c.tomLai ?? '(chưa có)']);
    r.font = { name: FONT };
    r.alignment = { vertical: 'top', wrapText: true };
  }
  if (g.bucTranh) {
    const r = th.addRow(['Bức tranh lớn', g.bucTranh]);
    r.font = { name: FONT };
    r.getCell(1).font = { name: FONT, bold: true };
    r.alignment = { vertical: 'top', wrapText: true };
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------------------------------------------------------------- PDF

const THU_MUC_FONT = path.join(process.cwd(), 'lib', 'xuat', 'fonts');
const MAU = { chu: '#1f1a2e', phu: '#6b6580', nhan: '#5b3fb0', vien: '#d9d4e8' };

export function taoPdf(g: GoiXuat): Promise<Buffer> {
  // font: false — không nạp Helvetica mặc định (đọc tệp .afm trong node_modules, dễ lỗi khi đóng gói)
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 60, left: 56, right: 56 },
    bufferPages: true,
    font: false as unknown as string,
    info: { Title: `Luận giải chuyên sâu${g.ten ? ` — ${g.ten}` : ''}`, Author: 'Celestia' },
  });
  doc.registerFont('thuong', path.join(THU_MUC_FONT, 'BeVietnamPro-Regular.ttf'));
  doc.registerFont('dam', path.join(THU_MUC_FONT, 'BeVietnamPro-Bold.ttf'));
  doc.registerFont('nghieng', path.join(THU_MUC_FONT, 'BeVietnamPro-Italic.ttf'));
  doc.font('thuong');

  const ra: Buffer[] = [];
  doc.on('data', (b: Buffer) => ra.push(b));
  const xong = new Promise<Buffer>((ok, hong) => {
    doc.on('end', () => ok(Buffer.concat(ra)));
    doc.on('error', hong);
  });

  const rong = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const trai = doc.page.margins.left;
  const doan = (s: string, font = 'thuong', co = 10.5, mau = MAU.chu) => {
    doc.font(font).fontSize(co).fillColor(mau).text(s, trai, doc.y, { width: rong, align: 'justify', lineGap: 3 });
    doc.moveDown(0.5);
  };
  const nhan = (s: string) => {
    doc.font('dam').fontSize(8.5).fillColor(MAU.nhan).text(s.toUpperCase(), trai, doc.y, { width: rong, characterSpacing: 1 });
    doc.moveDown(0.3);
  };
  const ke = () => {
    doc.moveTo(trai, doc.y).lineTo(trai + rong, doc.y).lineWidth(0.6).strokeColor(MAU.vien).stroke();
    doc.moveDown(0.8);
  };
  // Tiêu đề không đứng trơ trọi cuối trang
  const canCho = (h: number) => {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
  };

  // Bìa
  nhan('Celestia · Luận giải chuyên sâu');
  doc.font('dam').fontSize(24).fillColor(MAU.chu).text(g.ten || 'Lá số', { width: rong });
  doc.moveDown(0.4);
  doc.font('thuong').fontSize(11).fillColor(MAU.phu).text(`${g.thongTinSinh} · Năm xem ${g.namXem}`, { width: rong });
  doc.text(`Xuất lúc ${ngayXuat()} · ${g.chuDe.length} chủ đề`, { width: rong });
  doc.moveDown(1);
  ke();
  nhan('Mục lục');
  g.chuDe.forEach((c, i) => doan(`${i + 1}. ${c.ten} — ${c.cau.length} câu`, 'thuong', 10.5));
  if (g.bucTranh) doan(`${g.chuDe.length + 1}. Bức tranh lớn`, 'thuong', 10.5);

  for (const c of g.chuDe) {
    doc.addPage();
    nhan('Chủ đề');
    doc.font('dam').fontSize(20).fillColor(MAU.chu).text(c.ten, { width: rong });
    doc.moveDown(0.3);
    if (c.dan) doan(c.dan, 'nghieng', 11, MAU.phu);
    if (c.id === 'suc-khoe') {
      doan('Đây là dự đoán xu hướng từ lá số để lưu ý — không thay cho khám và chẩn đoán y khoa.', 'nghieng', 9.5, MAU.phu);
    }
    ke();

    c.cau.forEach((q, i) => {
      canCho(90);
      doc.font('dam').fontSize(12.5).fillColor(MAU.chu).text(`${i + 1}. ${q.cauHoi}`, trai, doc.y, { width: rong, lineGap: 2 });
      doc.moveDown(0.4);
      if (q.chuaViet) doan('(Celes chưa viết được câu này)', 'nghieng', 10.5, MAU.phu);
      else doanVan(q.luanGiai).forEach((d) => doan(d));
      if (q.viSao?.trim()) {
        canCho(40);
        nhan('Muốn biết vì sao');
        doanVan(q.viSao).forEach((d) => doan(d, 'thuong', 9.5, MAU.phu));
      }
      doc.moveDown(0.6);
    });

    if (c.tomLai?.trim()) {
      canCho(80);
      ke();
      nhan('Tóm lại');
      doanVan(c.tomLai).forEach((d) => doan(d));
    }
    const goiY = c.cau.map((q) => q.goiY?.trim()).filter((x): x is string => Boolean(x));
    if (goiY.length) {
      canCho(60);
      doc.moveDown(0.4);
      nhan('Gợi ý của Celes');
      goiY.forEach((x) => doan(`•  ${x}`));
    }
  }

  if (g.bucTranh?.trim()) {
    doc.addPage();
    nhan('Tổng hợp');
    doc.font('dam').fontSize(20).fillColor(MAU.chu).text('Bức tranh lớn', { width: rong });
    doc.moveDown(0.6);
    ke();
    doanVan(g.bucTranh).forEach((d) => doan(d));
  }

  // Chân trang: số trang
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    const lePhuoi = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // viết vào lề dưới mà không tự sang trang mới
    doc.font('thuong').fontSize(8).fillColor(MAU.phu).text(`Celestia · ${i + 1}/${count}`, trai, y, { width: rong, align: 'center' });
    doc.page.margins.bottom = lePhuoi;
  }

  doc.end();
  return xong;
}
