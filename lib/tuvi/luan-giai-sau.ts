import { cungDaiVan, cungTieuHan, tamPhuongTuChinh, type Cung, type LaSo } from './ansao';
import { PHU_TINH_TRONG_YEU } from './phu-tinh-trong-yeu';
import { CHI, CHINH_TINH } from './constants';
import { KHUON, type KhuonChu, type NgonNguDoc } from './quick-read-noi-dung';
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

export type LinhVucId =
  | 'tinh-cach'
  | 'cong-viec'
  | 'tai-loc'
  | 'tinh-duyen'
  | 'gia-dao'
  | 'quan-he'
  | 'van-han'
  | 'phat-trien';

export interface KhoiLuanGiai {
  id: LinhVucId;
  nhomChu: string;
  tieuDe: string;
  /** Một câu nói thẳng điều đáng chú ý */
  ketLuan: string;
  /** 2-4 đoạn giải thích cụ thể */
  doan: string[];
  canCu: CanCu[];
  /** Câu mở sẵn khi bấm "Hỏi Celes về phần này" */
  cauHoiGoiY: string;
}

/** Cung chính mà mỗi lĩnh vực đọc từ đó */
const CUNG_CUA_LINH_VUC: Record<Exclude<LinhVucId, 'van-han' | 'phat-trien'>, string> = {
  'tinh-cach': 'Mệnh',
  'cong-viec': 'Quan Lộc',
  'tai-loc': 'Tài Bạch',
  'tinh-duyen': 'Phu Thê',
  'gia-dao': 'Phụ Mẫu',
  'quan-he': 'Nô Bộc',
};

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

/** Số thứ tự của lĩnh vực, dùng làm phần chính của hạt chọn biến thể */
const THU_TU_LINH_VUC: Record<string, number> = {
  'tinh-cach': 0,
  'cong-viec': 1,
  'tai-loc': 2,
  'tinh-duyen': 3,
  'gia-dao': 4,
  'quan-he': 5,
  'van-han': 6,
  'phat-trien': 7,
};

function khoiTheoCung(
  id: Exclude<LinhVucId, 'van-han' | 'phat-trien'>,
  laSo: LaSo,
  giaiDoan: Cung | undefined,
  k: KhuonChu,
  ngonNgu: NgonNguDoc
): KhoiLuanGiai {
  const ten = CUNG_CUA_LINH_VUC[id];
  const cung = laSo.cungs.find((c) => c.tenCung === ten) ?? laSo.cungs[laSo.menhIndex];
  const chu = k.luanSau.linhVuc[id];
  const chuDe = k.chuDeCung[ten] ?? tenCung(cung, k);

  // Hạt chọn khuôn câu: thứ tự lĩnh vực để tám khối khác nhau, cộng chi cung
  // Mệnh để hai người khác lá số không đọc được cùng một bộ khung.
  const hat = (THU_TU_LINH_VUC[id] ?? 0) + laSo.cungs[laSo.menhIndex].chiIndex;
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

  return {
    id,
    nhomChu: chu.nhom,
    tieuDe: chu.tieuDe,
    // Câu kết luận đã có chủ ngữ ("nét rõ nhất của bạn là…"), nên vế nối vào sau
    // phải bỏ chủ ngữ của nó, bằng không thành "của bạn là bạn dễ…".
    ketLuan: net.length
      ? dien(khuon(k.luanSau.ketLuanCo), { chuDe, net: boChuNgu(net[0], ngonNgu) })
      : dien(k.luanSau.ketLuanTrong, { chuDe }),
    // Câu hỏi phản chiếu luôn đứng cuối và không bao giờ bị cắt: brand spec chốt
    // mỗi bài kết bằng một điều người đọc tự hỏi tiếp.
    doan: [...doan, k.luanSau.cauHoiPhanChieu[id]].filter(Boolean),
    canCu: canCuCua(cung, laSo, k),
    cauHoiGoiY: chu.cauHoi,
  };
}

/** Khối vận hạn — tóm tắt giai đoạn, rồi dẫn sang Hành trình */
function khoiVanHan(laSo: LaSo, namXem: number, k: KhuonChu): KhoiLuanGiai {
  const chu = k.luanSau.linhVuc['van-han'];
  const tuoi = namXem - laSo.thongTin.amLich.nam + 1;
  const giaiDoan = cungDaiVan(laSo, tuoi);
  const cungNam = laSo.cungs[cungTieuHan(laSo, tuoi)];
  const goc = giaiDoan ?? cungNam;

  // Một đoạn liền mạch chứ không phải ba dòng rời: năm đang xem nói gì, rồi
  // ngay đó là câu nhắc đây là xu hướng chứ không phải lời hứa. Tách ra thành
  // hai dòng thì câu nhắc trông như dòng chữ nhỏ ở cuối hợp đồng.
  const nhipNam =
    k.hanhTrinh.nhipNam && k.chuDeCung[cungNam.tenCung]
      ? dien(k.hanhTrinh.nhipNam, { nam: namXem, chuDe: k.chuDeCung[cungNam.tenCung] })
      : '';
  const doan = [
    [nhipNam, k.giaiDoan.nhacXuHuong].filter(Boolean).join(' '),
    k.luanSau.vanHanDan,
  ].filter(Boolean);

  return {
    id: 'van-han',
    nhomChu: chu.nhom,
    tieuDe: chu.tieuDe,
    ketLuan: dien(k.luanSau.vanHanKetLuan, {
      chuDe: k.chuDeCung[goc.tenCung] ?? tenCung(goc, k),
    }),
    doan,
    canCu: [
      ...(giaiDoan
        ? [
            {
              nhan: dien(k.canCu.giaiDoanTuoi, {
                tu: giaiDoan.daiVan?.tuTuoi ?? '',
                den: giaiDoan.daiVan?.denTuoi ?? '',
                cung: tenCung(giaiDoan, k),
              }),
              giaiThich: dien(k.canCu.giaiDoanTuoiY, {
                cung: tenCung(giaiDoan, k),
                chi: CHI[giaiDoan.chiIndex],
              }),
            },
          ]
        : []),
      {
        nhan: dien(k.canCu.namUngVao, { nam: namXem, cung: tenCung(cungNam, k) }),
        giaiThich: dien(k.canCu.namUngVaoY, { nam: namXem, tuoi, cung: tenCung(cungNam, k) }),
      },
    ],
    cauHoiGoiY: chu.cauHoi,
  };
}

/**
 * Khối gợi ý phát triển.
 *
 * Đọc từ Mệnh (thứ sẵn có) và Thân (thứ thường thiếu), rồi kết bằng một câu hỏi
 * tự phản chiếu. Không kê đơn hành động: brand spec cấm Celes quyết thay.
 */
function khoiPhatTrien(laSo: LaSo, k: KhuonChu, ngonNgu: NgonNguDoc): KhoiLuanGiai {
  const chu = k.luanSau.linhVuc['phat-trien'];
  const cungMenh = laSo.cungs[laSo.menhIndex];
  const cungThan = laSo.cungs[laSo.thanIndex];

  const manh = chinhTinhCua(cungMenh)
    .map((s) => k.netSao[s.ten]?.manh)
    .filter(Boolean) as string[];
  const can = chinhTinhCua(cungThan)
    .map((s) => k.netSao[s.ten]?.can)
    .filter(Boolean) as string[];

  // Cái sẵn có và cái còn thiếu là hai vế của cùng một ý, nên đứng chung một
  // đoạn. Tách đôi thì thành hai mục của một bảng kiểm, không phải một nhận xét.
  const doan = [
    [
      manh.length ? dien(k.luanSau.phatTrienManh, { net: noiLietKe(manh, k, ngonNgu) }) : '',
      can.length ? dien(k.luanSau.phatTrienCan, { can: noiLietKe(can, k, ngonNgu) }) : '',
    ]
      .filter(Boolean)
      .join(' '),
    k.luanSau.phatTrienHoi,
  ].filter(Boolean);

  return {
    id: 'phat-trien',
    nhomChu: chu.nhom,
    tieuDe: chu.tieuDe,
    ketLuan: dien(k.luanSau.phatTrienKetLuan, {
      chuDe: k.chuDeCung[laSo.thanCuCung] ?? tenCung(cungThan, k),
    }),
    doan,
    canCu: [
      {
        nhan: dien(k.canCu.thanCu, { cung: k.tenCung[laSo.thanCuCung] ?? laSo.thanCuCung }),
        giaiThich: dien(k.canCu.thanCuY, {
          cung: k.tenCung[laSo.thanCuCung] ?? laSo.thanCuCung,
        }),
      },
      ...canCuCua(cungMenh, laSo, k).slice(1, 3),
    ],
    cauHoiGoiY: chu.cauHoi,
  };
}

/** Tám khối, theo đúng thứ tự spec liệt kê */
export function luanGiaiSau(
  laSo: LaSo,
  namXem: number,
  ngonNgu: NgonNguDoc = 'vi'
): KhoiLuanGiai[] {
  const k = KHUON[ngonNgu];
  const giaiDoan = cungDaiVan(laSo, namXem - laSo.thongTin.amLich.nam + 1);
  return [
    khoiTheoCung('tinh-cach', laSo, giaiDoan, k, ngonNgu),
    khoiTheoCung('cong-viec', laSo, giaiDoan, k, ngonNgu),
    khoiTheoCung('tai-loc', laSo, giaiDoan, k, ngonNgu),
    khoiTheoCung('tinh-duyen', laSo, giaiDoan, k, ngonNgu),
    khoiTheoCung('gia-dao', laSo, giaiDoan, k, ngonNgu),
    khoiTheoCung('quan-he', laSo, giaiDoan, k, ngonNgu),
    khoiVanHan(laSo, namXem, k),
    khoiPhatTrien(laSo, k, ngonNgu),
  ];
}
