import { lapLaSo } from '../lib/tuvi/ansao';

/**
 * Đối chiếu với lá số mẫu từ tuvivietnam.vn (24/8/2000, giờ Tuất, nam).
 * Liệt kê sao theo từng cung như bản in của họ.
 */
const MAU: Record<string, string[]> = {
  'Tỵ': ['Thiên Cơ','Thiên Hỷ','Thiếu Dương','Thiên Không','Cô Thần','Đại Hao','Kiếp Sát','Thiên Sứ'],
  'Ngọ': ['Tử Vi','Thiên Việt','Thiên Phúc','Giải Thần','Phượng Các','Phục Binh','Tang Môn'],
  'Mùi': ['Thiên Y','Thiếu Âm','Đà La','Thiên Riêu','Quan Phù'],
  'Thân': ['Phá Quân','Lộc Tồn','Bác Sĩ','Long Trì','Quan Phủ','Đẩu Quân'],
  'Dậu': ['Đào Hoa','Lực Sĩ','Nguyệt Đức','Địa Kiếp','Kình Dương','Tử Phù'],
  'Tuất': ['Liêm Trinh','Thiên Phủ','Tả Phù','Tam Thai','Thiên Thọ','Thiên Hư','Địa Võng'],
  'Hợi': ['Thái Âm','Hóa Khoa','Hồng Loan','LN Văn Tinh','Thiên Quan','Long Đức','Tiểu Hao'],
  'Tý': ['Tham Lang','Văn Xương','Phong Cáo','Hỏa Tinh','Linh Tinh','Tướng Quân','Bạch Hổ'],
  'Sửu': ['Thiên Đồng','Cự Môn','Địa Giải','Tấu Thư','Đường Phù','Phúc Đức','Địa Không','Hóa Kỵ','Quả Tú','Phá Toái'],
  'Dần': ['Vũ Khúc','Thiên Tướng','Văn Khúc','Thiên Khôi','Hóa Quyền','Thiên Giải','Thiên Trù','Thiên Mã','Thiên Tài','Phi Liêm','Điếu Khách','Thiên Khốc'],
  'Mão': ['Thái Dương','Thiên Lương','Hóa Lộc','Thiên Quý','Hỉ Thần','Thiên Hình','Trực Phù','Thiên Thương'],
  'Thìn': ['Thất Sát','Hữu Bật','Thai Phụ','Bát Tọa','Quốc Ấn','Hoa Cái','Bệnh Phù','Lưu Hà','Thái Tuế','Thiên La'],
};

/** Tên 12 cung theo đúng bản mẫu */
const CUNG_MAU: Record<string, string> = {
  'Tuất': 'Mệnh', 'Dậu': 'Huynh Đệ', 'Thân': 'Phu Thê', 'Mùi': 'Tử Tức',
  'Ngọ': 'Tài Bạch', 'Tỵ': 'Tật Ách', 'Thìn': 'Thiên Di', 'Mão': 'Nô Bộc',
  'Dần': 'Quan Lộc', 'Sửu': 'Điền Trạch', 'Tý': 'Phúc Đức', 'Hợi': 'Phụ Mẫu',
};

/**
 * Hai cặp sao mà bản mẫu và bảng tra Nam phái (Thái Thứ Lang / CanChi) ghi
 * nhãn ngược nhau, nhưng CÙNG đóng ở đúng hai cung đó. Coi là tương đương để
 * không báo sai nhầm.
 */
const CAP_TUONG_DUONG: [string, string][] = [
  ['Thiên Khôi', 'Thiên Việt'],
  ['Quan Phù', 'Quan Phủ'],
];

const ls = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 19, gioiTinh: 'nam' });

// --- Kiểm tra tên cung trước ---
let cungSai = 0;
for (const c of ls.cungs) {
  if (c.tenCung !== CUNG_MAU[c.chi]) {
    console.log(`✗ CUNG SAI: ${c.chi} engine="${c.tenCung}" mẫu="${CUNG_MAU[c.chi]}"`);
    cungSai++;
  }
}
console.log(
  cungSai === 0 ? '✓ 12/12 cung đúng tên' : `✗ ${cungSai} cung sai tên`
);
console.log();
let thieu = 0;
let thua = 0;
for (const c of ls.cungs) {
  const mau = MAU[c.chi] ?? [];
  const cua = new Set(c.sao.map((s) => s.ten.replace('Hỉ Thần', 'Hỷ Thần')));
  const mauChuan = mau.map((m) => m.replace('Hỉ Thần', 'Hỷ Thần'));
  const tuongDuong = (ten: string) =>
    CAP_TUONG_DUONG.flatMap((cap) =>
      cap.includes(ten) ? cap.filter((x) => x !== ten) : []
    );
  const chuaCo = mauChuan.filter(
    (m) => !cua.has(m) && !tuongDuong(m).some((t) => cua.has(t))
  );
  const duThua = [...cua].filter(
    (s) => !mauChuan.includes(s) && !tuongDuong(s).some((t) => mauChuan.includes(t))
  );
  thieu += chuaCo.length;
  thua += duThua.length;
  const dau = chuaCo.length === 0 ? '✓' : '✗';
  console.log(`${dau} ${c.chi.padEnd(5)} ${c.tenCung.padEnd(10)} — mẫu ${mauChuan.length} sao`);
  if (chuaCo.length) console.log(`     THIẾU : ${chuaCo.join(', ')}`);
  if (duThua.length) console.log(`     mình có thêm: ${duThua.join(', ')}`);
}
console.log(`\nTổng sao thiếu so với bản mẫu: ${thieu}`);
console.log(`Tổng sao mình có mà bản mẫu không in: ${thua}`);
process.exit(cungSai === 0 && thieu === 0 ? 0 : 1);
