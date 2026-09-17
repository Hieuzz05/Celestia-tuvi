import { cungDaiVan, cungTieuHan, tamPhuongTuChinh, type Cung, type LaSo } from './ansao';
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
  return `${sach.slice(0, -1).join(k.noiVaiVe)}${k.noiVeCuoi}${sach[sach.length - 1]}`;
}

function tenCung(cung: Cung, k: KhuonChu) {
  return k.tenCung[cung.tenCung] ?? cung.tenCung;
}

/** Độ sáng được coi là "hiện ra rõ" — miếu, vượng, đắc địa, lợi */
const SANG_RO = new Set(['M', 'V', 'D', 'L']);

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
function khoiTheoCung(
  id: Exclude<LinhVucId, 'van-han' | 'phat-trien'>,
  laSo: LaSo,
  k: KhuonChu,
  ngonNgu: NgonNguDoc
): KhoiLuanGiai {
  const ten = CUNG_CUA_LINH_VUC[id];
  const cung = laSo.cungs.find((c) => c.tenCung === ten) ?? laSo.cungs[laSo.menhIndex];
  const chu = k.luanSau.linhVuc[id];
  const chuDe = k.chuDeCung[ten] ?? tenCung(cung, k);
  const chinh = chinhTinhCua(cung);

  const net = chinh.map((s) => k.netSao[s.ten]?.manh).filter(Boolean) as string[];
  const can = chinh.map((s) => k.netSao[s.ten]?.can).filter(Boolean) as string[];

  const doan: string[] = [];

  if (!net.length) {
    doan.push(k.luanSau.doanTrong);
  } else if (net.length > 1) {
    // Chỉ nhắc lại danh sách khi có nhiều hơn một sao: bằng không đoạn này lặp
    // nguyên văn câu kết luận ngay phía trên.
    doan.push(capHoaDau(dien(k.luanSau.doanNet, { net: noiLietKe(net, k, ngonNgu) })));
  }

  if (can.length) {
    doan.push(
      dien(k.luanSau.doanCan, { can: boChuNgu(noiLietKe(can, k, ngonNgu), ngonNgu) })
    );
  }

  // Độ sáng chỉ nói khi có sao chính để mà nói tới
  const doSang = chinh.find((s) => s.doSang)?.doSang;
  if (doSang) {
    const mau = SANG_RO.has(doSang) ? k.luanSau.doanSangRo : k.luanSau.doanSangKim;
    doan.push(dien(mau, { sang: k.doSang[doSang] ?? doSang }));
  }

  const tuHoa = cung.sao.filter((s) => s.loai === 'tu-hoa');
  if (tuHoa.length) {
    doan.push(dien(k.luanSau.doanTuHoa, { sao: tuHoa.map((s) => s.ten).join(', ') }));
  }

  if (cung.coTuan || cung.coTriet) {
    const tenVong = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' + ');
    doan.push(dien(k.luanSau.doanTuanTriet, { ten: tenVong }));
  }

  return {
    id,
    nhomChu: chu.nhom,
    tieuDe: chu.tieuDe,
    // Câu kết luận đã có chủ ngữ ("nét rõ nhất của bạn là…"), nên vế nối vào sau
    // phải bỏ chủ ngữ của nó, bằng không thành "của bạn là bạn dễ…".
    ketLuan: net.length
      ? dien(k.luanSau.ketLuanCo, { chuDe, net: boChuNgu(net[0], ngonNgu) })
      : dien(k.luanSau.ketLuanTrong, { chuDe }),
    // Bốn đoạn là trần: dài hơn thì không ai đọc hết, mà spec cũng chốt 2-4
    doan: doan.slice(0, 4),
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

  const doan = [
    k.hanhTrinh.nhipNam && k.chuDeCung[cungNam.tenCung]
      ? dien(k.hanhTrinh.nhipNam, { nam: namXem, chuDe: k.chuDeCung[cungNam.tenCung] })
      : '',
    k.giaiDoan.nhacXuHuong,
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

  const doan = [
    manh.length ? dien(k.luanSau.phatTrienManh, { net: noiLietKe(manh, k, ngonNgu) }) : '',
    can.length ? dien(k.luanSau.phatTrienCan, { can: noiLietKe(can, k, ngonNgu) }) : '',
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
  return [
    khoiTheoCung('tinh-cach', laSo, k, ngonNgu),
    khoiTheoCung('cong-viec', laSo, k, ngonNgu),
    khoiTheoCung('tai-loc', laSo, k, ngonNgu),
    khoiTheoCung('tinh-duyen', laSo, k, ngonNgu),
    khoiTheoCung('gia-dao', laSo, k, ngonNgu),
    khoiTheoCung('quan-he', laSo, k, ngonNgu),
    khoiVanHan(laSo, namXem, k),
    khoiPhatTrien(laSo, k, ngonNgu),
  ];
}
