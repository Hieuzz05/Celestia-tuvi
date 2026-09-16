import { lapLaSo } from '../lib/tuvi/ansao';

/** Danh sách sao chuẩn của lá số Nam phái đầy đủ, gom theo nhóm */
const CHUAN: Record<string, string[]> = {
  'Chính tinh (14)': [
    'Tử Vi','Thiên Cơ','Thái Dương','Vũ Khúc','Thiên Đồng','Liêm Trinh','Thiên Phủ',
    'Thái Âm','Tham Lang','Cự Môn','Thiên Tướng','Thiên Lương','Thất Sát','Phá Quân',
  ],
  'Lục cát tinh': ['Tả Phù','Hữu Bật','Văn Xương','Văn Khúc','Thiên Khôi','Thiên Việt'],
  'Lục sát tinh': ['Kình Dương','Đà La','Hỏa Tinh','Linh Tinh','Địa Không','Địa Kiếp'],
  'Tứ Hóa': ['Hóa Lộc','Hóa Quyền','Hóa Khoa','Hóa Kỵ'],
  'Vòng Tràng Sinh': [
    'Trường Sinh','Mộc Dục','Quan Đới','Lâm Quan','Đế Vượng','Suy','Bệnh','Tử','Mộ','Tuyệt','Thai','Dưỡng',
  ],
  'Vòng Thái Tuế': [
    'Thái Tuế','Thiếu Dương','Tang Môn','Thiếu Âm','Quan Phù','Tử Phù','Tuế Phá',
    'Long Đức','Bạch Hổ','Phúc Đức','Điếu Khách','Trực Phù',
  ],
  'Vòng Lộc Tồn (Bác Sĩ)': [
    'Bác Sĩ','Lực Sĩ','Thanh Long','Tiểu Hao','Tướng Quân','Tấu Thư','Phi Liêm',
    'Hỷ Thần','Bệnh Phù','Đại Hao','Phục Binh','Quan Phủ',
  ],
  'Sao theo can năm': [
    'Lộc Tồn','Quốc Ấn','Đường Phù','Lưu Hà','Thiên Trù','Thiên Quan','Thiên Phúc',
  ],
  'Sao theo chi năm': [
    'Thiên Mã','Đào Hoa','Hồng Loan','Thiên Hỷ','Thiên Khốc','Thiên Hư','Long Trì',
    'Phượng Các','Cô Thần','Quả Tú','Kiếp Sát','Hoa Cái','Phá Toái','Thiên Đức',
    'Nguyệt Đức','Thiên Không','Giải Thần','Thiên Thọ','Thiên Tài',
  ],
  'Sao theo tháng sinh': ['Thiên Hình','Thiên Riêu','Thiên Y','Địa Giải','Thiên Giải'],
  'Sao theo ngày sinh': ['Tam Thai','Bát Tọa','Ân Quang','Thiên Quý'],
  'Sao theo giờ sinh': ['Thai Phụ','Phong Cáo'],
  'Sao cố định theo cung': ['Thiên Thương','Thiên Sứ','Thiên La','Địa Võng'],
  'Khác': ['Đẩu Quân'],
};

// Lấy hợp của nhiều lá số khác nhau: có sao chỉ xuất hiện với can/chi nhất định
const laSos = [
  { ngay: 24, thang: 8, nam: 2000, gio: 9 },
  { ngay: 5, thang: 2, nam: 1985, gio: 1 },
  { ngay: 18, thang: 11, nam: 1993, gio: 17 },
  { ngay: 30, thang: 6, nam: 1978, gio: 23 },
  { ngay: 12, thang: 4, nam: 2011, gio: 13 },
];

const daCo = new Set<string>();
for (const t of laSos) {
  for (const gt of ['nam', 'nu'] as const) {
    const ls = lapLaSo({ ...t, gioiTinh: gt });
    for (const c of ls.cungs) {
      for (const s of c.sao) daCo.add(s.ten);
      if (c.trangSinh) daCo.add(c.trangSinh);
    }
  }
}

let thieu = 0;
let tongChuan = 0;
for (const [nhom, ds] of Object.entries(CHUAN)) {
  const chuaCo = ds.filter((s) => !daCo.has(s));
  tongChuan += ds.length;
  thieu += chuaCo.length;
  const dau = chuaCo.length === 0 ? '✓' : '✗';
  console.log(`${dau} ${nhom}: ${ds.length - chuaCo.length}/${ds.length}`);
  if (chuaCo.length) console.log(`    THIEU: ${chuaCo.join(', ')}`);
}

const thua = [...daCo].filter(
  (s) => !Object.values(CHUAN).flat().includes(s)
);
console.log(`\nTong sao chuan: ${tongChuan} | engine an duoc: ${tongChuan - thieu} | thieu: ${thieu}`);
if (thua.length) console.log(`Sao engine co ma danh sach chuan khong liet ke: ${thua.join(', ')}`);
process.exit(thieu === 0 ? 0 : 1);
