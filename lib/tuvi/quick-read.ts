import { cungDaiVan, cungTieuHan, type Cung, type LaSo } from './ansao';
import { CHI, CHINH_TINH } from './constants';
import { KHUON, type KhuonChu, type NgonNguDoc } from './quick-read-noi-dung';

/**
 * Quick Read — vài góc nhìn ngắn dựng thẳng từ dữ liệu lá số, KHÔNG gọi AI.
 *
 * Lý do phải deterministic: đây là thứ người dùng mới nhìn thấy đầu tiên, mà gọi
 * model thì mất 15-45 giây và có thể hỏng khi hết quota. Chờ chừng đó trước khi
 * nhận được giá trị đầu tiên là chỗ rơi người dùng nặng nhất. AI vẫn dùng cho
 * phần đọc dài phía sau, chỉ là không chặn ở bước đầu.
 *
 * Mỗi góc nhìn kèm "căn cứ" — chính các dữ kiện đã sinh ra nó, để nút "Muốn biết
 * vì sao không?" có thứ thật mà mở ra chứ không phải lời hứa suông.
 *
 * Lời văn nằm ở `quick-read-noi-dung.ts`; tệp này chỉ lo phần đọc lá số và ghép.
 */

export type YDinhDoc = 'banThan' | 'congViec' | 'tinhCam' | 'quyetDinh';

export interface CanCu {
  /** Nhãn ngắn hiện trên chip */
  nhan: string;
  /** Giải thích bằng lời đời thường, hiện khi mở phần căn cứ */
  giaiThich: string;
}

export interface GocNhin {
  id: 'diem-noi-bat' | 'dieu-thuong-can' | 'chu-de-giai-doan' | 'linh-vuc' | 'moc-hanh-trinh';
  nhomChu: string;
  tieuDe: string;
  noiDung: string;
  canCu: CanCu[];
}

/** Thay {khoa} trong khuôn câu bằng giá trị thật */
function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? ''));
}

function chinhTinhCua(cung: Cung) {
  // CHINH_TINH khai báo as const nên .includes chỉ nhận đúng 14 tên đó
  return cung.sao.filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten));
}

/** Chỉ lấy tối đa hai sao để câu không dài quá mức đọc thoải mái */
function haiChinhTinhDau(cung: Cung) {
  return chinhTinhCua(cung).slice(0, 2);
}

/**
 * Ghép danh sách thành một câu.
 *
 * Các vế sau bị cắt chủ ngữ lặp lại, và vế cuối nối bằng dấu gạch ngang thay vì
 * "và" — bản thân mỗi vế đã có "và" bên trong, nối tiếp nữa là ba chữ "và" trong
 * cùng một câu, đọc lên rất máy.
 */
function noiLietKe(items: string[], k: KhuonChu, ngonNgu: NgonNguDoc) {
  /*
   * Nét đã là câu hoàn chỉnh thì chỉ việc đặt cạnh nhau.
   *
   * Không cắt chủ ngữ, không nối bằng gạch ngang, không thêm liên từ. Mọi thủ
   * thuật bên dưới sinh ra để giấu chỗ nối giữa các MẢNH câu; khi không còn
   * mảnh thì cũng không còn chỗ nối nào để giấu.
   */
  if (k.netLaCau) return items.join(' ');
  const boChuNgu = ngonNgu === 'vi' ? /^bạn\s+/ : /^you\s+/;
  const sach = items.map((v, i) => (i === 0 ? v : v.replace(boChuNgu, '')));
  if (sach.length <= 1) return sach[0] ?? '';
  // Vế cuối vốn nối bằng một gạch ngang. Nhưng vài nét sao tự nó đã có gạch
  // ngang bên trong, và hai gạch ngang trong một câu thì chỗ nối thứ hai đọc như
  // bị chắp. Gặp trường hợp đó thì nối bằng liên từ thường.
  const noiCuoi = sach.some((v) => v.includes('—')) ? k.noiVeCuoiKhongGach : k.noiVeCuoi;
  return `${sach.slice(0, -1).join(k.noiVaiVe)}${noiCuoi}${sach[sach.length - 1]}`;
}

function canCuCung(cung: Cung, nhanCung: string, k: KhuonChu): CanCu[] {
  const ra: CanCu[] = [
    {
      nhan: dien(k.canCu.cungTai, { ten: nhanCung, chi: cung.chi }),
      giaiThich: dien(k.canCu.cungTaiY, { ten: nhanCung, chi: cung.chi }),
    },
  ];

  for (const s of chinhTinhCua(cung)) {
    const sang = s.doSang ? k.doSang[s.doSang] : undefined;
    ra.push({
      nhan: sang ? dien(k.canCu.saoDong, { sao: s.ten, sang }) : s.ten,
      giaiThich: sang
        ? dien(k.canCu.saoDongY, { sao: s.ten, sang })
        : dien(k.canCu.saoDongTrong, { sao: s.ten }),
    });
  }

  for (const s of cung.sao.filter((x) => x.ten.startsWith('Hóa '))) {
    ra.push({ nhan: s.ten, giaiThich: dien(k.canCu.tuHoaY, { sao: s.ten }) });
  }

  if (cung.coTuan || cung.coTriet) {
    const ten = [cung.coTuan && 'Tuần', cung.coTriet && 'Triệt'].filter(Boolean).join(' + ');
    ra.push({
      nhan: dien(k.canCu.tuanTriet, { ten }),
      giaiThich: dien(k.canCu.tuanTrietY, { ten }),
    });
  }

  return ra;
}

/** Cung chức năng ứng với điều người dùng nói đang bận tâm */
const CUNG_THEO_Y_DINH: Partial<Record<YDinhDoc, string>> = {
  congViec: 'Quan Lộc',
  tinhCam: 'Phu Thê',
};

/**
 * Góc nhìn theo đúng lĩnh vực người dùng vừa chọn ở bước đầu.
 *
 * Chỉ dựng được khi lĩnh vực đó ứng với một cung cụ thể (công việc, tình cảm).
 * Với "bản thân" và "một quyết định" thì hai góc nhìn sẵn có đã trả lời đúng hơn,
 * nên không bịa thêm một thẻ nữa cho đủ số.
 */
function gocNhinLinhVuc(
  laSo: LaSo,
  yDinh: YDinhDoc,
  k: KhuonChu,
  ngonNgu: NgonNguDoc
): GocNhin | null {
  const tenCung = CUNG_THEO_Y_DINH[yDinh];
  if (!tenCung) return null;

  const cung = laSo.cungs.find((c) => c.tenCung === tenCung);
  if (!cung) return null;

  const chuDe = k.chuDeCung[tenCung];
  const net = haiChinhTinhDau(cung)
    .map((s) => k.netSao[s.ten]?.manh)
    .filter(Boolean) as string[];

  return {
    id: 'linh-vuc',
    nhomChu: yDinh === 'congViec' ? k.linhVuc.congViecNhom : k.linhVuc.tinhCamNhom,
    tieuDe: yDinh === 'congViec' ? k.linhVuc.congViecTieuDe : k.linhVuc.tinhCamTieuDe,
    noiDung: net.length
      ? dien(k.linhVuc.co, { chuDe, net: noiLietKe(net, k, ngonNgu) })
      : dien(k.linhVuc.trong, { chuDe }),
    canCu: canCuCung(cung, k.tenCung[tenCung] ?? tenCung, k),
  };
}

/**
 * Dựng các góc nhìn ngắn cho một lá số.
 *
 * Trả về theo thứ tự ưu tiên: phần tử đầu là góc nhìn chính, các phần tử sau là
 * phụ. Thứ tự đổi theo điều người dùng nói đang bận tâm ở bước đầu onboarding —
 * cùng một lá số, nhưng người đang rối chuyện công việc và người đang rối chuyện
 * tình cảm không nên đọc cùng một thứ đầu tiên.
 */
export function docNhanh(
  laSo: LaSo,
  namXem: number,
  yDinh?: YDinhDoc,
  ngonNgu: NgonNguDoc = 'vi'
): GocNhin[] {
  const k = KHUON[ngonNgu];
  const cungMenh = laSo.cungs[laSo.menhIndex];
  const cungThan = laSo.cungs[laSo.thanIndex];
  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const daiVan = cungDaiVan(laSo, tuoiAm);
  const cungNam = laSo.cungs[cungTieuHan(laSo, tuoiAm)];

  const tenCung = (ten: string) => k.tenCung[ten] ?? ten;
  const ra: GocNhin[] = [];

  // --- 1. Điểm nổi bật: đọc từ chính tinh thủ Mệnh ---
  // Thẻ dùng bản CÂU HOÀN CHỈNH; bề mặt nào chưa có thì rơi về bản mảnh
  const netManh = haiChinhTinhDau(cungMenh)
    .map((s) => k.netSao[s.ten]?.manhCau ?? k.netSao[s.ten]?.manh)
    .filter(Boolean) as string[];
  ra.push({
    id: 'diem-noi-bat',
    nhomChu: k.diemNoiBat.nhom,
    tieuDe: netManh.length ? k.diemNoiBat.tieuDe : k.diemNoiBat.tieuDeTrong,
    noiDung: netManh.length
      ? k.netLaCau
        ? noiLietKe(netManh, k, ngonNgu)
        : `${capHoaDau(noiLietKe(netManh, k, ngonNgu))}.`
      : k.diemNoiBat.trong,
    canCu: canCuCung(cungMenh, tenCung('Mệnh'), k),
  });

  // --- 2. Điều thường cần: đọc từ cung an Thân ---
  const netCan = haiChinhTinhDau(cungThan)
    .map((s) => k.netSao[s.ten]?.canCau ?? k.netSao[s.ten]?.can)
    .filter(Boolean) as string[];
  const chuDeThan = k.chuDeCung[laSo.thanCuCung];
  /*
   * Tiêu đề thẻ lấy theo ngôi sao ĐẦU TIÊN có tiêu đề riêng.
   *
   * Một tiêu đề cố định cho mọi lá số nói được rất ít: người cần được ghi nhận
   * và người cần một hạn chót không cần cùng một thứ. Lá số không có sao nào
   * mang tiêu đề riêng thì rơi về câu chung, chứ không để trống.
   */
  const tieuDeCan =
    haiChinhTinhDau(cungThan)
      .map((sao) => k.netSao[sao.ten]?.tieuDeCan)
      .find(Boolean) ?? k.dieuThuongCan.tieuDe;
  // Chủ đề cung đứng đầu câu ở khuôn tiếng Việt, nên phải viết hoa chữ đầu
  const chuDeThanHoa = chuDeThan && k.netLaCau ? capHoaDau(chuDeThan) : (chuDeThan ?? '');
  ra.push({
    id: 'dieu-thuong-can',
    nhomChu: k.dieuThuongCan.nhom,
    tieuDe: tieuDeCan,
    noiDung: netCan.length
      ? dien(k.dieuThuongCan.mo, { net: noiLietKe(netCan, k, ngonNgu) }) +
        (chuDeThan ? dien(k.dieuThuongCan.dong, { chuDe: chuDeThanHoa }) : '')
      : dien(k.dieuThuongCan.moTrong, { chuDe: chuDeThanHoa }),
    canCu: [
      {
        nhan: dien(k.canCu.thanCu, { cung: tenCung(laSo.thanCuCung) }),
        giaiThich: dien(k.canCu.thanCuY, { cung: tenCung(laSo.thanCuCung) }),
      },
      ...canCuCung(cungThan, tenCung(cungThan.tenCung), k).slice(1),
    ],
  });

  // --- 3. Giai đoạn hiện tại: đại vận đang chạy + cung của năm đang xem ---
  const chuDeDaiVan = daiVan ? k.chuDeCung[daiVan.tenCung] : undefined;
  const chuDeNam = k.chuDeCung[cungNam.tenCung];
  ra.push({
    id: 'chu-de-giai-doan',
    nhomChu: k.giaiDoan.nhom,
    tieuDe: dien(k.giaiDoan.tieuDe, { nam: namXem }),
    noiDung: [
      chuDeDaiVan ? dien(k.giaiDoan.daiVan, { chuDe: chuDeDaiVan }) : null,
      chuDeNam ? dien(k.giaiDoan.nam, { nam: namXem, chuDe: chuDeNam }) : null,
      k.giaiDoan.nhacXuHuong,
    ]
      .filter(Boolean)
      .join(' '),
    canCu: [
      ...(daiVan
        ? [
            {
              nhan: dien(k.canCu.giaiDoanTuoi, {
                tu: daiVan.daiVan?.tuTuoi ?? '',
                den: daiVan.daiVan?.denTuoi ?? '',
                cung: tenCung(daiVan.tenCung),
              }),
              giaiThich: dien(k.canCu.giaiDoanTuoiY, {
                cung: tenCung(daiVan.tenCung),
                chi: CHI[daiVan.chiIndex],
              }),
            },
          ]
        : []),
      {
        nhan: dien(k.canCu.namUngVao, { nam: namXem, cung: tenCung(cungNam.tenCung) }),
        giaiThich: dien(k.canCu.namUngVaoY, {
          nam: namXem,
          tuoi: tuoiAm,
          cung: tenCung(cungNam.tenCung),
        }),
      },
      ...(daiVan ? canCuCung(daiVan, tenCung(daiVan.tenCung), k).slice(1, 3) : []),
    ],
  });

  return sapXepTheoYDinh(ra, laSo, k, ngonNgu, yDinh);
}

/** Đưa góc nhìn hợp với điều người dùng đang bận tâm lên đầu */
function sapXepTheoYDinh(
  ra: GocNhin[],
  laSo: LaSo,
  k: KhuonChu,
  ngonNgu: NgonNguDoc,
  yDinh?: YDinhDoc
): GocNhin[] {
  if (!yDinh) return ra;

  const rieng = gocNhinLinhVuc(laSo, yDinh, k, ngonNgu);
  if (rieng) return [rieng, ...ra.filter((g) => g.id !== 'dieu-thuong-can')];

  const dauTien: Record<YDinhDoc, GocNhin['id']> = {
    banThan: 'diem-noi-bat',
    quyetDinh: 'chu-de-giai-doan',
    congViec: 'diem-noi-bat',
    tinhCam: 'dieu-thuong-can',
  };
  const chinh = ra.find((g) => g.id === dauTien[yDinh]);
  return chinh ? [chinh, ...ra.filter((g) => g !== chinh)] : ra;
}

function capHoaDau(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
