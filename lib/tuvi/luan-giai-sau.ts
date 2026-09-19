import { cungDaiVan, tamPhuongTuChinh, type Cung, type LaSo } from './ansao';
import { PHU_TINH_TRONG_YEU } from './phu-tinh-trong-yeu';
import { CHINH_TINH } from './constants';
import { KHUON, type KhuonChu, type NgonNguDoc } from './quick-read-noi-dung';
import {
  CHANG,
  CHANG_CUA_MUC,
  CUNG_CUA_MUC,
  GUONG,
  TAM_HOP,
  THU_TU_CHANG,
  laGuongNoiBo,
  thamChieuNgoaiChang,
  type ChangId,
  type MucId,
} from './chang-cung';
import {
  CAU_PHAN_MO,
  CHU_12_CUNG,
  CHU_CHANG,
  MO_DAU,
  MO_DAU_TRONG,
  THU_TU_KIEU_MO,
  dangTinHieu,
  type KieuMo,
} from './chu-12-cung';
import { NGUONG_MO, NGUONG_NOI, TRAN_BADGE, doNoiBat } from './do-noi-bat';
import type { CanCu } from './quick-read';

/**
 * Bảng luận giải theo lĩnh vực — phần người đã đăng nhập nhận thêm sau Quick Read.
 *
 * Spec v4 mục 11B: người dùng phải khám phá được lá số mà không cần tự đọc mệnh
 * bàn 12 cung. Tám khối dưới đây là đường đi đó.
 *
 * Vẫn KHÔNG gọi AI, cùng lý do với Quick Read và Hành trình. Thêm một lý do nữa
 * riêng cho phần này: tám khối mà gọi model thì vừa chậm vừa đắt, và mỗi lần mở
 * lại ra một bản khác — người dùng quay lại đọc tiếp sẽ thấy sản phẩm nói khác
 * đi so với hôm qua. Chữ ở đây dựng từ dữ kiện lá số nên lần nào cũng như nhau,
 * và mỗi câu đều truy ngược được về cung/sao đã sinh ra nó.
 *
 * Mỗi khối: một câu kết luận đời thường → 2-4 đoạn cụ thể → căn cứ mở được.
 */

export interface KhoiLuanGiai {
  id: MucId;
  chang: ChangId;
  /** Nhãn nhóm ngắn — KHÔNG phải tiêu đề, và không bao giờ là tên cung */
  nhomChu: string;
  /** KẾT LUẬN về người đọc, không phải tên chủ đề. Cấm chứa tên cung. */
  tieuDe: string;
  /** Một câu nói thẳng điều đáng chú ý */
  ketLuan: string;
  /** 2-4 đoạn giải thích cụ thể */
  doan: string[];
  canCu: CanCu[];
  /** Câu mở sẵn khi bấm "Hỏi Celes về phần này" */
  cauHoiGoiY: string;

  /** Cung gốc — chỉ hiện ở dòng "Đọc từ:" và trong phần căn cứ */
  cungGoc: string;
  cungTamHop: [string, string];
  cungGuong: string;
  /** Cung gương nằm cùng chặng — hai phần phải viết như một cặp đối thoại */
  guongNoiBo: boolean;
  doNoiBat: number;
  /** Badge "đáng chú ý nhất" — tối đa ba badge một bài */
  noiBat: boolean;
}

export interface ChangLuanGiai {
  id: ChangId;
  thuTu: 1 | 2 | 3 | 4;
  tieuDe: string;
  subtitle: string;
  /** Ba phần, đã sắp theo độ nổi bật */
  muc: KhoiLuanGiai[];
  /** "Ba phần này nói cùng điều gì" */
  doanKhau: string;
  /** Một câu dẫn sang chặng sau; null ở chặng cuối */
  cauBacCau: string | null;
}

/**
 * Sổ bao phủ — validator đọc cái này để biết bài có đủ không.
 *
 * Không phải số liệu trang trí: nó là cam kết sản phẩm viết thành con số. Đủ 12
 * cung, mỗi cung được tham chiếu từ ba lần trở lên, đủ bốn chặng, đủ mười hai
 * khối gương, và mười hai phần đều có ít nhất một cung tham chiếu nằm ngoài
 * chặng của nó — điều cuối là thứ chứng minh bài không đọc tuyến tính được.
 */
export interface SoBaoPhu {
  cungChinh: number;
  cungThamChieuDuBa: boolean;
  soChang: number;
  soGuong: number;
  phanCoThamChieuNgoaiChang: number;
  dat: boolean;
}

export interface BaiLuanGiai {
  chang: ChangLuanGiai[];
  baoPhu: SoBaoPhu;
}

function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? ''));
}

function capHoaDau(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function chinhTinhCua(cung: Cung) {
  return cung.sao.filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten)).slice(0, 2);
}

/** Bỏ chủ ngữ đầu câu — dùng khi vế được ghép vào sau một mệnh đề đã có chủ ngữ */
function boChuNgu(cau: string, ngonNgu: NgonNguDoc) {
  return cau.replace(ngonNgu === 'vi' ? /^bạn\s+/ : /^you\s+/, '');
}

function noiLietKe(items: string[], k: KhuonChu, ngonNgu: NgonNguDoc) {
  const sach = items.map((v, i) => (i === 0 ? v : boChuNgu(v, ngonNgu)));
  if (sach.length <= 1) return sach[0] ?? '';
  // Vế cuối vốn nối bằng một gạch ngang. Nhưng vài nét sao tự nó đã có gạch
  // ngang bên trong, và hai gạch ngang trong một câu thì chỗ nối thứ hai đọc như
  // bị chắp. Gặp trường hợp đó thì nối bằng liên từ thường.
  const noiCuoi = sach.some((v) => v.includes('—')) ? k.noiVeCuoiKhongGach : k.noiVeCuoi;
  return `${sach.slice(0, -1).join(k.noiVaiVe)}${noiCuoi}${sach[sach.length - 1]}`;
}

function tenCung(cung: Cung, k: KhuonChu) {
  return k.tenCung[cung.tenCung] ?? cung.tenCung;
}

/** Độ sáng được coi là "hiện ra rõ" — miếu, vượng, đắc địa, lợi */
const SANG_RO = new Set(['M', 'V', 'D', 'L']);

/**
 * Sao mang lực cản. Nét của nhóm này thuộc về đoạn lực ngược, không phải đoạn
 * điểm mạnh — trộn chung là lý do bản cũ đọc như một danh sách không có hướng.
 */
const SAO_TRO_LUC = new Set([
  'Kình Dương',
  'Đà La',
  'Hỏa Tinh',
  'Linh Tinh',
  'Địa Không',
  'Địa Kiếp',
  'Thiên Hình',
  'Thiên Riêu',
]);

/**
 * Căn cứ của một khối: chỉ liệt kê thứ THỰC SỰ tham gia vào kết luận.
 *
 * Spec cấm đổ cả lá số ra đây. Một danh sách dài ai đọc cũng thấy "có vẻ đúng"
 * thì không chứng minh được gì; vài dòng đúng chỗ mới làm người ta tin.
 */
function canCuCua(cung: Cung, laSo: LaSo, k: KhuonChu): CanCu[] {
  const ra: CanCu[] = [
    {
      nhan: dien(k.canCu.cungTai, { ten: tenCung(cung, k), chi: cung.chi }),
      giaiThich: dien(k.canCu.cungTaiY, { ten: tenCung(cung, k), chi: cung.chi }),
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

  for (const s of cung.sao.filter((x) => x.loai === 'tu-hoa')) {
    ra.push({ nhan: s.ten, giaiThich: dien(k.canCu.tuHoaY, { sao: s.ten }) });
  }

  if (cung.coTuan || cung.coTriet) {
    const ten = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' + ');
    ra.push({
      nhan: dien(k.canCu.tuanTriet, { ten }),
      giaiThich: dien(k.canCu.tuanTrietY, { ten }),
    });
  }

  const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
  const ho = tamHop.map((i) => tenCung(laSo.cungs[i], k)).join(' · ');
  ra.push({
    nhan: `${ho} · ${tenCung(laSo.cungs[xungChieu], k)}`,
    giaiThich: dien(k.luanSau.doanTamPhuong, {
      hoTro: ho,
      xung: tenCung(laSo.cungs[xungChieu], k),
    }),
  });

  return ra;
}

/** Một khối đọc từ một cung cụ thể */
/**
 * Chọn một biến thể câu.
 *
 * Tám khối của bài đọc sâu trước đây dùng chung một khuôn câu cho mỗi vai trò,
 * nên đọc liền tám khối là thấy ngay bộ xương: khối nào cũng mở bằng "Ở phần…",
 * khối nào cũng có đúng một câu "Đối diện là… luôn kéo bạn về hướng ngược lại".
 * Đó là thứ khiến người đọc nhận ra template chứ không phải nội dung sai.
 *
 * Chọn theo `hat` — số thứ tự lĩnh vực cộng một chữ số lấy từ chính lá số — nên
 * hai khối cạnh nhau gần như luôn khác khuôn, mà cùng một lá số đọc lại vẫn ra
 * đúng bài cũ. Ngẫu nhiên thật thì mỗi lần tải trang lại một kiểu, và không ai
 * đối chiếu được gì nữa.
 */
function chonBienThe(bienThe: readonly string[], hat: number): string {
  return bienThe[((hat % bienThe.length) + bienThe.length) % bienThe.length];
}

/** Số thứ tự canonical của mười hai phần — phần chính của hạt chọn biến thể */
const THU_TU_MUC: Record<MucId, number> = Object.fromEntries(
  THU_TU_CHANG.flatMap((c, i) => CHANG[c].muc.map((m, j) => [m, i * 3 + j]))
) as Record<MucId, number>;

function khoiTheoCung(
  id: MucId,
  laSo: LaSo,
  giaiDoan: Cung | undefined,
  k: KhuonChu,
  ngonNgu: NgonNguDoc,
  /** Kiểu mở đã được phân cho phần này — xem ngân sách mở đầu trong luanGiaiSau */
  kieuMo: KieuMo,
  diem: { diem: number; xungDot: boolean },
  noiBat: boolean
): KhoiLuanGiai {
  const ten = CUNG_CUA_MUC[id];
  const cung = laSo.cungs.find((c) => c.tenCung === ten) ?? laSo.cungs[laSo.menhIndex];
  const chu = CHU_12_CUNG[ngonNgu][id];
  const chuDe = k.chuDeCung[ten] ?? tenCung(cung, k);

  // Hạt chọn khuôn câu: thứ tự phần để mười hai khối khác nhau, cộng chi cung
  // Mệnh để hai người khác lá số không đọc được cùng một bộ khung.
  const hat = THU_TU_MUC[id] + laSo.cungs[laSo.menhIndex].chiIndex;
  const khuon = (bt: readonly string[]) => chonBienThe(bt, hat);
  const chinh = chinhTinhCua(cung);

  const net = chinh.map((s) => k.netSao[s.ten]?.manh).filter(Boolean) as string[];
  const can = chinh.map((s) => k.netSao[s.ten]?.can).filter(Boolean) as string[];

  /*
   * Ba đoạn, mỗi đoạn một nhiệm vụ kể chuyện — KHÔNG phải mỗi dữ kiện một câu.
   *
   * Bản cũ phát lần lượt: nét phụ → nhu cầu → độ sáng → tứ hoá → Tuần Triệt →
   * phụ tinh → đối cung → trạng sinh → giai đoạn, rồi cắt còn sáu câu đầu. Thứ
   * tự ấy cố định ở cả tám khối, nên đọc khối thứ hai là người ta đã đoán được
   * khối thứ ba nói gì ở dòng nào. Cắt ở câu thứ sáu còn làm mất đúng những lớp
   * đặt ở cuối — phụ tinh, nhịp, giai đoạn — tức là phần khiến hai lá số khác
   * nhau đọc ra khác nhau.
   *
   * Giờ gom theo nghĩa: cấu trúc này tạo ra gì → cái gì kéo ngược lại → nó cần
   * điều kiện nào và đang ở nhịp nào. Đó là khung luận của tài liệu: nói hệ quả
   * trước, luôn có lực ngược, và không kê sao.
   */

  // Đoạn 1 — cấu trúc này tạo ra gì trong đời sống
  const doanCauTruc: string[] = [];
  if (!net.length) {
    doanCauTruc.push(k.luanSau.doanTrong);
  } else if (net.length > 1) {
    // Chỉ nói những sao CHƯA nằm ở câu kết luận, bằng không nửa đoạn này lặp
    // nguyên văn dòng ngay phía trên.
    doanCauTruc.push(
      capHoaDau(dien(khuon(k.luanSau.doanNet), { net: noiLietKe(net.slice(1), k, ngonNgu) }))
    );
  }

  const doSang = chinh.find((s) => s.doSang)?.doSang;
  if (doSang) {
    const mau = khuon(SANG_RO.has(doSang) ? k.luanSau.doanSangRo : k.luanSau.doanSangKim);
    doanCauTruc.push(dien(mau, { sang: k.doSang[doSang] ?? doSang }));
  }

  const tuHoa = cung.sao.filter((x) => x.loai === 'tu-hoa');
  const cauTuHoa = (ten: string) => {
    const netTh = k.netPhuTinh[ten];
    return netTh
      ? dien(k.luanSau.doanTuHoaRo, { sao: ten, net: netTh })
      : dien(k.luanSau.doanTuHoa, { sao: ten });
  };
  for (const x of tuHoa.filter((y) => y.ten !== 'Hóa Kỵ')) doanCauTruc.push(cauTuHoa(x.ten));

  // Đoạn 2 — cái gì kéo ngược lại. Đối cung luôn tham gia vào cách đọc một cung;
  // bỏ nó đi là mất hẳn phần khiến bài đọc không thành lời khen một chiều.
  const doiCung = laSo.cungs[tamPhuongTuChinh(cung.chiIndex).xungChieu];
  const chinhDoi = chinhTinhCua(doiCung);
  const doanLucNguoc: string[] = [
    chinhDoi.length
      ? dien(khuon(k.luanSau.doanDoiCung), {
          cung: tenCung(doiCung, k),
          sao: chinhDoi.map((x) => x.ten).join(', '),
        })
      : dien(k.luanSau.doanDoiCungTrong, { cung: tenCung(doiCung, k) }),
  ];

  if (cung.coTuan || cung.coTriet) {
    const tenVong = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' + ');
    doanLucNguoc.push(dien(k.luanSau.doanTuanTriet, { ten: tenVong }));
  }

  const tenPhu = cung.sao.filter((x) => PHU_TINH_TRONG_YEU.has(x.ten)).map((x) => x.ten);
  const netTheoTen = (ds: string[]) =>
    ds.map((t) => k.netPhuTinh[t]).filter(Boolean).slice(0, 2) as string[];
  const phuCan = netTheoTen(tenPhu.filter((t) => SAO_TRO_LUC.has(t)));
  const phuDo = netTheoTen(tenPhu.filter((t) => !SAO_TRO_LUC.has(t)));

  if (phuCan.length) {
    doanLucNguoc.push(
      capHoaDau(dien(khuon(k.luanSau.doanPhuTinh), { net: noiLietKe(phuCan, k, ngonNgu) }))
    );
  }
  for (const x of tuHoa.filter((y) => y.ten === 'Hóa Kỵ')) doanLucNguoc.push(cauTuHoa(x.ten));

  // Đoạn 3 — nó cần điều kiện gì, và đang ở nhịp nào
  const doanDieuKien: string[] = [];
  if (can.length) {
    doanDieuKien.push(
      capHoaDau(dien(khuon(k.luanSau.doanCan), { can: boChuNgu(noiLietKe(can, k, ngonNgu), ngonNgu) }))
    );
  }
  if (phuDo.length) {
    // Lệch một nhịp so với đoạn lực ngược, để hai đoạn không mở bằng cùng một khuôn
    doanDieuKien.push(
      capHoaDau(
        dien(chonBienThe(k.luanSau.doanPhuTinh, hat + 1), {
          net: noiLietKe(phuDo, k, ngonNgu),
        })
      )
    );
  }

  const trangSinh = k.netTrangSinh[cung.trangSinh];
  if (trangSinh) doanDieuKien.push(dien(khuon(k.luanSau.doanTrangSinh), { net: trangSinh }));

  // Giai đoạn đang chạy có chạm vào lĩnh vực này không — thông tin quyết định
  // người đọc nên để tâm phần này bây giờ hay để dành cho quãng sau.
  if (giaiDoan?.daiVan) {
    const trong = new Set([
      giaiDoan.chiIndex,
      ...tamPhuongTuChinh(giaiDoan.chiIndex).tamHop,
      tamPhuongTuChinh(giaiDoan.chiIndex).xungChieu,
    ]);
    doanDieuKien.push(
      trong.has(cung.chiIndex)
        ? dien(khuon(k.luanSau.doanGiaiDoanCham), {
            tu: giaiDoan.daiVan.tuTuoi,
            den: giaiDoan.daiVan.denTuoi,
          })
        : khuon(k.luanSau.doanGiaiDoanKhongCham)
    );
  }

  const doan = [doanCauTruc, doanLucNguoc, doanDieuKien]
    .map((v) => v.filter(Boolean).join(' ').trim())
    .filter((v) => v.length > 0);

  /*
   * Câu mở — theo KIỂU đã được phân, không theo hạt.
   *
   * Hạt cho ra phân phối may rủi: lá số xui thì năm phần mở giống hệt nhau, và
   * người đọc nhận ra khuôn ngay ở phần thứ ba. Kiểu được phân từ ngoài theo
   * vòng nên trần 3/12 là bảo đảm bằng cấu trúc.
   *
   * Câu kết luận đã có chủ ngữ ("nét rõ nhất của bạn là…"), nên vế nối vào sau
   * phải bỏ chủ ngữ của nó, bằng không thành "của bạn là bạn dễ…".
   */
  const netDau = net.length ? boChuNgu(net[0], ngonNgu) : '';
  const ketLuan = !net.length
    ? dien(chonBienThe(MO_DAU_TRONG[ngonNgu], hat), { chuDe })
    : dien(chonBienThe(MO_DAU[ngonNgu][kieuMo], hat), {
        chuDe,
        net: netDau,
        netHoa: capHoaDau(netDau),
        tu: giaiDoan?.daiVan?.tuTuoi ?? '',
        den: giaiDoan?.daiVan?.denTuoi ?? '',
      });

  /*
   * Phần gần như không có tín hiệu vẫn được viết, chỉ ngắn hơn và mở bằng một
   * câu thành thật. Ẩn nó đi là phá cam kết "đủ 12"; viết dài bằng phần khác là
   * bịa cho đủ. Nói thẳng rằng ở đây lá số im lặng cũng là một thông tin.
   */
  const doanCuoi = catChoVua(
    diem.diem <= NGUONG_MO
      ? [chonBienThe(CAU_PHAN_MO[ngonNgu], hat), ...doan.slice(0, 2)]
      : doan,
    ketLuan,
    diem.diem
  );

  return {
    id,
    chang: CHANG_CUA_MUC[id],
    nhomChu: chu.nhan,
    tieuDe: chu.tieuDeMau[dangTinHieu(diem.diem, diem.xungDot)],
    ketLuan,
    // Câu hỏi phản chiếu luôn đứng cuối và không bao giờ bị cắt: brand spec chốt
    // mỗi bài kết bằng một điều người đọc tự hỏi tiếp.
    doan: [...doanCuoi, chu.cauHoi].filter(Boolean),
    canCu: canCuCua(cung, laSo, k),
    cauHoiGoiY: chu.cauHoi,
    cungGoc: ten,
    cungTamHop: TAM_HOP[ten],
    cungGuong: GUONG[ten],
    guongNoiBo: laGuongNoiBo(id),
    doNoiBat: diem.diem,
    noiBat,
  };
}

/**
 * Cắt bài cho vừa ngân sách từ.
 *
 * Spec đặt 130–180 từ mỗi phần ở Bức tranh đầy đủ, co giãn ±20% theo độ nổi
 * bật. Ba đoạn dựng xong mà không ai cắt thì ra 170–270 từ, và mười hai phần
 * như thế là một bài không ai đọc hết.
 *
 * Cắt từ ĐUÔI đoạn cuối, không cắt đều. Đoạn đầu mang kết luận, đoạn hai mang
 * lực ngược — hai thứ framework bắt buộc phải có. Đoạn ba là lớp bổ sung: mất
 * một câu ở đó thì bài ngắn đi chứ không mất ý nào. Cắt đều thì mất cả lực
 * ngược, tức là mất đúng thứ làm bài đọc không thành lời khen một chiều.
 */
function demTu(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function catChoVua(doan: string[], ketLuan: string, diem: number): string[] {
  const tran = diem >= NGUONG_NOI ? 216 : diem <= NGUONG_MO ? 144 : 180;
  const ra = [...doan];
  let tong = demTu(ketLuan) + ra.reduce((t, d) => t + demTu(d), 0);

  while (tong > tran && ra.length > 1) {
    const cuoi = ra[ra.length - 1];
    const cau = cuoi.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (cau.length <= 1) {
      // Đoạn cuối chỉ còn một câu: bỏ cả đoạn, nhưng không bao giờ bỏ đoạn đầu
      tong -= demTu(cuoi);
      ra.pop();
      continue;
    }
    tong -= demTu(cau[cau.length - 1]);
    ra[ra.length - 1] = cau.slice(0, -1).join(' ');
  }

  return ra;
}

/**
 * Ngân sách mở đầu — phân kiểu mở cho mười hai phần.
 *
 * Luật: không kiểu nào dùng quá 3 trên 12. Bảo đảm bằng CẤU TRÚC, không bằng
 * hạt: chia vòng năm kiểu cho mười hai phần ra 3-3-2-2-2. Chọn bằng hạt thì
 * phân phối là chuyện may rủi, và một lá số xui sẽ có năm phần mở giống hệt
 * nhau — đúng thứ làm người đọc nhận ra đây là máy phát chữ.
 *
 * Điểm bắt đầu của vòng lấy từ chính lá số, nên hai người khác nhau không nhận
 * cùng một bản đồ kiểu mở, mà cùng một lá số đọc lại vẫn ra đúng bài cũ.
 */
function phanKieuMo(thuTuMuc: MucId[], lech: number): Record<MucId, KieuMo> {
  const ra = {} as Record<MucId, KieuMo>;
  thuTuMuc.forEach((m, i) => {
    ra[m] = THU_TU_KIEU_MO[(i + lech) % THU_TU_KIEU_MO.length];
  });
  return ra;
}

/**
 * Sổ bao phủ — đếm lại từ chính bài vừa dựng, không tin bảng hằng số.
 *
 * Đếm từ kết quả thật là cách duy nhất bắt được lỗi ở tầng dựng bài: bảng
 * `CHANG` có thể đúng trong khi hàm dựng bỏ sót một phần, và lúc đó một sổ đọc
 * từ bảng sẽ báo xanh cho một bài thiếu.
 */
function dungSoBaoPhu(chang: ChangLuanGiai[]): SoBaoPhu {
  const muc = chang.flatMap((c) => c.muc);
  const demThamChieu = new Map<string, number>();
  for (const m of muc) {
    for (const c of [...m.cungTamHop, m.cungGuong]) {
      demThamChieu.set(c, (demThamChieu.get(c) ?? 0) + 1);
    }
  }

  const cungChinh = new Set(muc.map((m) => m.cungGoc)).size;
  const moiCungDuBa = [...new Set(muc.map((m) => m.cungGoc))].every(
    (c) => (demThamChieu.get(c) ?? 0) >= 3
  );
  const ngoaiChang = muc.filter((m) => thamChieuNgoaiChang(m.id).length > 0).length;

  return {
    cungChinh,
    cungThamChieuDuBa: moiCungDuBa,
    soChang: chang.length,
    soGuong: muc.filter((m) => !!m.cungGuong).length,
    phanCoThamChieuNgoaiChang: ngoaiChang,
    dat:
      cungChinh === 12 &&
      moiCungDuBa &&
      chang.length === 4 &&
      muc.length === 12 &&
      ngoaiChang === 12,
  };
}

/**
 * Bài luận mười hai phần, gom trong bốn chặng.
 *
 * Thứ tự BỐN CHẶNG luôn 1→4 — đó là một cung đường kể chuyện (bên trong → ra
 * ngoài → cùng người khác → truyền lại), không phải một danh mục để sắp lại.
 * Thứ tự BA PHẦN trong mỗi chặng thì do lá số quyết, giảm dần theo độ nổi bật;
 * hoà điểm thì theo thứ tự canonical trong `CHANG`.
 *
 * Đó là chỗ phân biệt với mọi sản phẩm tra cứu: mục lục của hai người không
 * giống nhau, mà bài vẫn có một mạch cố định để đi theo.
 */
export function luanGiaiSau(
  laSo: LaSo,
  namXem: number,
  ngonNgu: NgonNguDoc = 'vi'
): BaiLuanGiai {
  const k = KHUON[ngonNgu];
  const giaiDoan = cungDaiVan(laSo, namXem - laSo.thongTin.amLich.nam + 1);

  const diemTheoMuc = new Map<MucId, { diem: number; xungDot: boolean }>();
  for (const c of THU_TU_CHANG) {
    for (const m of CHANG[c].muc) {
      const d = doNoiBat(laSo, m, namXem);
      diemTheoMuc.set(m, { diem: d.diem, xungDot: d.xungDot });
    }
  }

  // Badge chỉ cho những phần thật sự nổi, và tối đa ba: badge ở mọi phần thì
  // không còn là badge nữa.
  const duocBadge = new Set(
    [...diemTheoMuc.entries()]
      .filter(([, d]) => d.diem >= NGUONG_NOI)
      .sort((a, b) => b[1].diem - a[1].diem)
      .slice(0, TRAN_BADGE)
      .map(([m]) => m)
  );

  // Thứ tự để phân kiểu mở: theo mạch đọc thật, tức đã sắp trong từng chặng.
  const thuTuDoc: MucId[] = THU_TU_CHANG.flatMap((cid) =>
    [...CHANG[cid].muc].sort((a, b) => {
      const lech = (diemTheoMuc.get(b)?.diem ?? 0) - (diemTheoMuc.get(a)?.diem ?? 0);
      return lech !== 0 ? lech : CHANG[cid].muc.indexOf(a) - CHANG[cid].muc.indexOf(b);
    })
  );

  const kieuMo = phanKieuMo(thuTuDoc, laSo.cungs[laSo.menhIndex].chiIndex);

  const chang: ChangLuanGiai[] = THU_TU_CHANG.map((cid) => {
    const cauHinh = CHANG[cid];
    const muc = thuTuDoc
      .filter((m) => CHANG_CUA_MUC[m] === cid)
      .map((m) =>
        khoiTheoCung(
          m,
          laSo,
          giaiDoan,
          k,
          ngonNgu,
          kieuMo[m],
          diemTheoMuc.get(m) ?? { diem: 0, xungDot: false },
          duocBadge.has(m)
        )
      );

    return {
      id: cid,
      thuTu: cauHinh.thuTu,
      tieuDe: cauHinh.tieuDe,
      subtitle: cauHinh.subtitle,
      muc,
      doanKhau: CHU_CHANG[ngonNgu][cid].doanKhau,
      cauBacCau: CHU_CHANG[ngonNgu][cid].cauBacCau,
    };
  });

  return { chang, baoPhu: dungSoBaoPhu(chang) };
}

/** Mười hai phần theo mạch đọc, cho chỗ chỉ cần danh sách phẳng */
export function mucPhang(bai: BaiLuanGiai): KhoiLuanGiai[] {
  return bai.chang.flatMap((c) => c.muc);
}
