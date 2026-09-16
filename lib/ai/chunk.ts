/**
 * Cắt tài liệu thành đoạn vừa đủ để embedding.
 *
 * Cắt theo ranh giới tự nhiên (đề mục markdown → đoạn văn → câu) thay vì cắt
 * cứng theo số ký tự: tài liệu tử vi hay có cấu trúc "mỗi sao một mục", cắt
 * giữa chừng sẽ làm mất ngữ cảnh của sao đang nói tới.
 */

const KICH_THUOC_TOI_DA = 1200;
const PHAN_CHONG_LAN = 150;

function chiaTheoDoan(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((d) => d.trim())
    .filter(Boolean);
}

function chiaTheoCau(doan: string): string[] {
  // Tách sau dấu kết câu; giữ lại dấu để đoạn đọc được trọn vẹn
  return doan.split(/(?<=[.!?…])\s+/).filter(Boolean);
}

/** Cắt một khối quá dài thành nhiều mảnh, có phần chồng lấn để không đứt mạch */
function catKhoiDai(khoi: string): string[] {
  const cau = chiaTheoCau(khoi);
  const manh: string[] = [];
  let hienTai = '';

  for (const c of cau) {
    if (hienTai.length + c.length + 1 > KICH_THUOC_TOI_DA && hienTai) {
      manh.push(hienTai.trim());
      hienTai = hienTai.slice(-PHAN_CHONG_LAN) + ' ' + c;
    } else {
      hienTai += (hienTai ? ' ' : '') + c;
    }
  }
  if (hienTai.trim()) manh.push(hienTai.trim());

  // Câu đơn lẻ dài hơn cả giới hạn thì đành cắt cứng
  return manh.flatMap((m) =>
    m.length <= KICH_THUOC_TOI_DA * 1.5
      ? [m]
      : (m.match(new RegExp(`.{1,${KICH_THUOC_TOI_DA}}`, 'gs')) ?? [m])
  );
}

export function catThanhDoan(noiDung: string): string[] {
  const sach = noiDung.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!sach) return [];

  const doans = chiaTheoDoan(sach);
  const ketQua: string[] = [];
  let gom = '';
  // Đề mục markdown được ghim vào các đoạn theo sau, để đoạn nào cũng biết nó
  // đang nói về mục gì khi bị tách khỏi tài liệu gốc
  let deMuc = '';

  const day = () => {
    const t = gom.trim();
    if (t) ketQua.push(deMuc ? `${deMuc}\n${t}` : t);
    gom = '';
  };

  for (const doan of doans) {
    if (/^#{1,6}\s/.test(doan)) {
      day();
      deMuc = doan.replace(/^#{1,6}\s*/, '').trim();
      continue;
    }

    const doDaiKhiThem = gom.length + doan.length + deMuc.length + 2;
    if (doDaiKhiThem > KICH_THUOC_TOI_DA && gom) day();

    if (doan.length + deMuc.length > KICH_THUOC_TOI_DA) {
      day();
      for (const m of catKhoiDai(doan)) {
        ketQua.push(deMuc ? `${deMuc}\n${m}` : m);
      }
      continue;
    }

    gom += (gom ? '\n\n' : '') + doan;
  }
  day();

  return ketQua.filter((d) => d.replace(/\s/g, '').length >= 40);
}
