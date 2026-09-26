import { boDau, nhanDangThucThe } from '../thuc-the';
import { truyHoi, type DoanUngVien } from '../truy-hoi';
import { doTrung, NGUONG_TRUNG } from '../uu-tien-nguon';
import { docMetaTaiLieu, LOAI_NGUON_AN } from '../tai-lieu-meta';
import type { DuKienV3 } from './du-kien';

/**
 * TRUY HỒI THEO CUNG cho luồng v3.
 *
 * Truy hồi cũ nhận MỘT truy vấn cho cả một chặng. Với câu hỏi đọc năm cung,
 * một truy vấn như thế chỉ kéo về đoạn của cung nổi nhất, bốn cung còn lại
 * trắng nguồn — và model lấp chỗ trống bằng trí nhớ, đúng điều AGENTS.md cấm.
 *
 * Nên mỗi cung một truy vấn (sao của cung + tên cung + từ khoá chủ đề), rồi
 * xếp lại theo MỨC KHỚP: đoạn nói đúng sao VÀ đúng cung được ưu tiên. Dò kho
 * ngày 23/09 cho thấy vì sao cần bước này: truy vấn "Thiên Cơ cung Tật Ách"
 * trả về một đoạn "Thiên Đồng ... đàn bà thủ mệnh" và một bảng tên sao trần —
 * có điểm RRF cao mà chẳng dùng được.
 */

export const PHIEN_BAN_TRUY_HOI_V3 = '2026.09.6';

/**
 * MỨC TIN CẬY CÓ TÁC DỤNG THẬT (2026.09.6, chủ dự án 26/09/2026: "mức độ tin
 * cậy có value thực sự"). Trước đây v3 bỏ qua hẳn mức tin cậy.
 *
 * Cộng vào điểm SAU khi đoạn đã qua cổng khớp (đúng sao, đúng cung): mức tin
 * cậy chọn giữa các đoạn đã liên quan, không kéo đoạn lạc đề lên. Cỡ cộng đặt
 * cạnh các điểm khớp khác: "cốt lõi" nặng gần bằng một lần khớp đúng cung
 * (0,02), "bổ trợ" bị trừ bằng một sao khớp (0,012). Mục sách đúng tên cung
 * (0,03) vẫn nặng hơn mọi mức tin cậy.
 */
export const DIEM_TIN_CAY: Record<string, number> = {
  'cot-loi': 0.02,
  'chuyen-gia-duyet': 0.012,
  'tham-khao': 0,
  'ho-tro': -0.012,
};

/**
 * Tên tắt sách cổ hay dùng: "Vũ, Tướng: làm ra song khó nhọc". Không nhận tắt
 * thì đúng những câu phú quý nhất của kho bị chấm là "không nhắc sao nào".
 * Chỉ lấy tên tắt ít trùng lời thường; "Cơ", "Đồng", "Cự" để ngoài.
 */
export const TEN_TAT: Record<string, string[]> = {
  'Vũ Khúc': ['vu'], 'Thiên Tướng': ['tuong'], 'Liêm Trinh': ['liem'], 'Tham Lang': ['tham'],
  'Phá Quân': ['pha'], 'Thiên Lương': ['luong'], 'Thái Âm': ['nguyet'], 'Thái Dương': ['nhat'],
  'Thất Sát': ['that sat'], 'Thiên Phủ': ['phu'], 'Tử Vi': ['tu vi'], 'Thiên Cơ': ['thien co'],
};

/** Đoạn không phải lời luận: bảng tên sao, lá số mẫu, lịch sử môn học, rác chuyển PDF */
const CHINH_TINH_TEN = new Set([
  'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ',
  'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân',
]);

const TIEU_DE_RAC = /(la so|lich su|chu tinh|thuat ngu|pdf|muc luc|loi noi dau|an sao|cach an|bang tra|dieu thuyen)/;
export function laDoanRac(d: { tieuDe: string; duongDeMuc: string | null; noiDung: string }): boolean {
  const td = boDau(`${d.tieuDe} ${d.duongDeMuc ?? ''}`);
  if (TIEU_DE_RAC.test(td)) return true;
  const tu = boDau(d.noiDung).split(/[^a-z0-9]+/).filter(Boolean);
  if (tu.length < 25) return true;
  // Mật độ tên sao: bảng liệt kê có quá nửa số chữ là tên sao
  const soTen = nhanDangThucThe(d.noiDung).length;
  if (soTen / (tu.length / 2) > 0.5) return true;
  // Bảng lá số: gần như toàn chữ viết hoa đầu, gần như không có dấu chấm câu
  const tho = d.noiDung.split(/\s+/).filter(Boolean);
  const hoa = tho.filter((w) => /^[A-ZÀ-ỸĐ]/.test(w)).length / tho.length;
  const cham = (d.noiDung.match(/[.;:?!]/g) ?? []).length / (tho.length / 100);
  return hoa > 0.5 && cham < 2;
}

export const BI_DANH_CUNG: Record<string, string[]> = {
  'Mệnh': ['menh', 'mang'],
  'Phụ Mẫu': ['phu mau'],
  'Phúc Đức': ['phuc duc', 'phuc'],
  'Điền Trạch': ['dien trach', 'dien'],
  'Quan Lộc': ['quan loc', 'quan'],
  'Nô Bộc': ['no boc', 'no'],
  'Thiên Di': ['thien di', 'di'],
  'Tật Ách': ['tat ach', 'tat', 'ach'],
  'Tài Bạch': ['tai bach', 'tai'],
  'Tử Tức': ['tu tuc'],
  'Phu Thê': ['phu the', 'vo chong', 'the'],
  'Huynh Đệ': ['huynh de', 'bao', 'huynh'],
};

/**
 * Từ khoá nhận ra một đoạn bàn ĐÚNG phần đời của câu hỏi (không bỏ dấu, so trên
 * chữ đã bỏ dấu). Cộng điểm nhẹ khi đoạn nhắc tới — đoạn khớp sao mà nói chuyện
 * khác (sao ấy ở Tài Bạch trong khi câu hỏi về vợ chồng) tụt xuống.
 */
const TU_NHAN_CHU_DE: Record<string, string[]> = {
  'tinh-cach': ['tinh tinh', 'tinh cach', 'con nguoi', 'tam tinh'],
  'su-nghiep': ['cong danh', 'quan loc', 'su nghiep', 'nghe nghiep', 'lam quan'],
  'tien-bac': ['tien tai', 'tai loc', 'cua cai', 'giau', 'tai bach', 'hao tai'],
  'tinh-duyen': ['vo chong', 'phu the', 'hon nhan', 'lay vo', 'lay chong', 'tinh duyen'],
  'con-cai': ['con cai', 'tu tuc', 'sinh con'],
  'gia-dinh': ['cha me', 'phu mau', 'song than'],
  'anh-em': ['anh em', 'huynh de'],
  'quy-nhan': ['ban be', 'no boc', 'quy nhan', 'giup do'],
  'phuc-duc': ['phuc duc', 'ho hang', 'to tien'],
  'suc-khoe': ['benh', 'tat ach', 'suc khoe', 'tai nan'],
  'nha-cua': ['nha cua', 'dien trach', 'dien san', 'nha dat'],
  'ra-ngoai': ['thien di', 'xuat ngoai', 'di xa', 'ra ngoai'],
  'hoc-van': ['thi cu', 'hoc hanh', 'khoa bang', 'van chuong'],
};

const TU_KHOA_CHU_DE: Record<string, string> = {
  'tong-quan': 'tính tình công danh tiền tài',
  'tinh-cach': 'tính tình',
  'su-nghiep': 'công danh nghề nghiệp',
  'tien-bac': 'tiền tài của cải',
  'tinh-duyen': 'vợ chồng hôn nhân',
  'con-cai': 'con cái',
  'gia-dinh': 'cha mẹ',
  'anh-em': 'anh em',
  'quy-nhan': 'bạn bè quý nhân',
  'phuc-duc': 'phúc đức họ hàng',
  'suc-khoe': 'bệnh tật sức khỏe',
  'nha-cua': 'nhà đất điền sản',
  'ra-ngoai': 'xuất ngoại đi xa',
  'hoc-van': 'học hành thi cử',
  'van-han': 'vận hạn',
};

export interface DoanV3 {
  id: string;
  tieuDe: string;
  duongDeMuc: string | null;
  noiDung: string;
  documentId: string;
  chunkId: string;
  diem: number;
  /** Đoạn này khớp đúng sao + đúng cung của truy vấn nào */
  khopCung: string;
  khopSao: string[];
  /** Mức tin cậy hiện hành của tài liệu (đọc tươi từ kho, tai-lieu-meta.ts) */
  mucTinCay: string;
  /** Luật ngầm — Celes dùng để định hướng, bài không được nhắc tới (LOAI_NGUON_AN) */
  an: boolean;
}

export type BoNhoTruyHoi = Map<string, Promise<DoanUngVien[]>>;

function coTu(s: string, tu: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${tu.replace(/ /g, '[^a-z0-9]+')}($|[^a-z0-9])`).test(s);
}

/*
 * Đệm truy hồi TRONG TIẾN TRÌNH, dùng chung giữa các request (25/09/2026).
 *
 * `nho` chỉ sống trong một request. Nhưng tổ hợp "sao + cung" lặp lại rất nhiều
 * giữa các lá số và giữa tổng quan với chuyên sâu, trong khi một truy vấn RAG
 * tốn 2,7–4,3 giây và các truy vấn đồng thời tranh nhau ở nhánh từ khoá (15 cái
 * cùng lúc mất 15 giây). Instance serverless còn ấm thì dùng lại được.
 * Chỉ giữ kết quả CÓ đoạn: kết quả rỗng có thể do lỗi tạm thời (hết credit
 * embedding, DB chậm) — giữ lại là khoá luôn cái lỗi ấy suốt 30 phút.
 */
const DEM_CHUNG = new Map<string, { luc: number; ds: DoanUngVien[] }>();
const HAN_DEM_MS = 30 * 60 * 1000;
const TRAN_DEM = 600;

async function motTruyVan(q: string, tuKhoa: string, nho: BoNhoTruyHoi): Promise<DoanUngVien[]> {
  const khoa = `${q}|${tuKhoa}`;
  const co = nho.get(khoa);
  if (co) return co;
  const chung = DEM_CHUNG.get(khoa);
  if (chung && Date.now() - chung.luc < HAN_DEM_MS) {
    const p = Promise.resolve(chung.ds);
    nho.set(khoa, p);
    return p;
  }
  /*
   * Nhánh từ khoá nhận chuỗi NGẮN (tên sao + tên cung). Chuỗi dài kèm từ khoá chủ
   * đề thành một phép OR rộng trên 7.559 đoạn, và Postgres cắt ngang vì quá thời
   * gian — đo được 5 lần trong lượt chạy đầu. Vector vẫn nhận chuỗi đủ nghĩa.
   */
  /*
   * Thực thể lấy từ chuỗi từ khoá NGẮN, không từ truy vấn vector. Từ bản truy hồi
   * 2026.09.4, mỗi tên thực thể thành một cụm tìm nguyên văn với điểm gấp đôi;
   * lấy từ truy vấn dài thì cụm "Tử Vi" quay lại và khớp tên môn học ở đầu gần
   * như mọi đoạn — đúng lỗi mà chuỗi từ khoá ngắn sinh ra để tránh.
   */
  const p = truyHoi(
    { truyVan: q, truyVanTuKhoa: tuKhoa, thucThe: nhanDangThucThe(tuKhoa) },
    { soCuoi: 8, soUngVienVector: 15, soUngVienTuKhoa: 15 }
  )
    .then((k) => {
      if (k.daChon.length) {
        if (DEM_CHUNG.size >= TRAN_DEM) {
          const cu = DEM_CHUNG.keys().next().value;
          if (cu) DEM_CHUNG.delete(cu);
        }
        DEM_CHUNG.set(khoa, { luc: Date.now(), ds: k.daChon });
      }
      return k.daChon;
    })
    .catch(() => [] as DoanUngVien[]);
  nho.set(khoa, p);
  return p;
}

/** Cắt đoạn quanh chỗ nhắc sao đầu tiên — sách cổ hay dồn nhiều sao vào một khối dài */
function catQuanh(noiDung: string, sao: string[], dai = 650): string {
  const s = noiDung.replace(/\s+/g, ' ').trim();
  if (s.length <= dai) return s;
  const bd = boDau(s);
  let vt = -1;
  for (const x of sao) {
    const i = bd.indexOf(boDau(x));
    if (i >= 0 && (vt < 0 || i < vt)) vt = i;
  }
  const dau = Math.max(0, (vt < 0 ? 0 : vt) - 120);
  return (dau > 0 ? '… ' : '') + s.slice(dau, dau + dai) + (dau + dai < s.length ? ' …' : '');
}

export async function truyHoiChoCau(vao: {
  chuDe: string;
  /** Câu tổng quan mượn từ khoá của chủ đề nó thật sự hỏi (TQ05 → sự nghiệp) */
  chuDeTuKhoa?: string;
  cauHoi: string;
  duKien: DuKienV3[];
  nho: BoNhoTruyHoi;
  soDoan?: number;
  /** Cung chính của CHỦ ĐỀ (Phu Thê cho tình duyên) — đứng trước mọi cung khác khi chia chỗ */
  cungUuTien?: string;
}): Promise<DoanV3[]> {
  const tuKhoa = TU_KHOA_CHU_DE[vao.chuDeTuKhoa ?? vao.chuDe] ?? '';
  /*
   * Thứ tự cung theo VAI TRÒ (2026.09.5): cung chính → cùng xét → phụ trợ → tam
   * phương. Bản trước lấy năm cung đầu theo thứ tự dữ kiện (chính, xung, tam hợp,
   * tam hợp, cùng xét) rồi chia đều chỗ: câu "tôi yêu kiểu nào" (Phu Thê) nhận
   * sáu trên tám đoạn nói về Tài Bạch, Quan Lộc, Mệnh — model không dùng được.
   */
  const hangVai = (v: string) =>
    v === 'cung chính' || v.endsWith('(chính)') ? 0 : v.startsWith('cung chính') ? 1 : v.startsWith('phụ trợ') ? 2 : 3;
  const cungDoc = vao.duKien
    .filter((d) => d.cung && d.noiDung.startsWith('Cung '))
    .map((d, i) => ({ d, i }))
    .sort(
      (a, b) =>
        (a.d.cung === vao.cungUuTien ? -1 : hangVai(a.d.vaiTro)) - (b.d.cung === vao.cungUuTien ? -1 : hangVai(b.d.vaiTro)) ||
        a.i - b.i
    )
    .map((x) => x.d)
    .slice(0, 5);
  const gioiTinh = /^Nữ,/.test(vao.duKien.find((d) => d.vaiTro === 'nền')?.noiDung ?? '') ? 'nu' : 'nam';
  const tuNhan = TU_NHAN_CHU_DE[vao.chuDeTuKhoa ?? vao.chuDe] ?? [];

  /*
   * Mỗi cung một truy vấn. Truy vấn chỉ mang chính tinh + tứ hóa (cung không có
   * chính tinh thì mượn ba phụ tinh đầu): nhồi năm sáu phụ tinh vào làm loãng
   * nghĩa, và lượt 3 đo được đúng hậu quả — "Tử Vi … Tài Bạch" không kéo về câu
   * "cùng Tử Vi có của ăn của để" của mục TỨ TÀI BẠCH CUNG. Phụ tinh vẫn dùng
   * để CHẤM khớp, chỉ không dùng để HỎI.
   */
  const truyVan = cungDoc.map((d) => {
    const cungCo = d.sao.filter((s) =>
      nhanDangThucThe(s).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION')
    );
    const chinhHoa = cungCo.filter((s) => CHINH_TINH_TEN.has(s) || s.startsWith('Hóa '));
    const hoi = (chinhHoa.length ? chinhHoa : cungCo).slice(0, 3);
    return {
      cung: d.cung!,
      sao: cungCo.slice(0, 6),
      q: `${hoi.join(' ')} cung ${d.cung} ${tuKhoa}`.trim(),
      // "Tử Vi" còn là tên môn học, đứng ở tiêu đề của gần như mọi đoạn trong kho:
      // đưa nó vào nhánh từ khoá là xếp hạng theo tên sách. Nhánh từ khoá hỏi bằng
      // tên cung + các sao khác; bước chấm khớp vẫn đòi đoạn phải nhắc Tử Vi.
      k: `${hoi.filter((x) => x !== 'Tử Vi').slice(0, 2).join(' ')} ${d.cung}`.trim(),
      laCung: true,
    };
  });
  const cachCuc = vao.duKien.filter((d) => d.vaiTro === 'cách cục').slice(0, 2);
  for (const c of cachCuc) {
    const ten = c.noiDung.match(/^Cách cục (.+?) \(/)?.[1];
    if (ten) truyVan.push({ cung: c.cung ?? '', sao: c.sao.slice(0, 4), q: `${ten} ${tuKhoa}`, k: ten, laCung: false });
  }
  // Vận năm: nghĩa của từng lưu tứ hóa ở đúng cung nó rơi vào
  for (const d of vao.duKien.filter((x) => x.vaiTro.startsWith('vận năm')).slice(0, 1)) {
    for (const m of d.noiDung.matchAll(/(Hóa (?:Lộc|Quyền|Khoa|Kỵ)) vào ([^(]+?) \(([^)]+)\)/g)) {
      const [, hoa, sao, cung] = m;
      truyVan.push({ cung, sao: [sao.trim(), hoa], q: `${sao.trim()} ${hoa} cung ${cung} vận hạn`, k: `${sao.trim()} ${hoa}`, laCung: false });
    }
  }

  const [ketQua, meta] = await Promise.all([
    Promise.all(truyVan.map((t) => motTruyVan(t.q, t.k, vao.nho))),
    docMetaTaiLieu(),
  ]);

  /*
   * Chấm từng đoạn theo truy vấn đã kéo nó về, rồi CHỌN XOAY VÒNG giữa các truy
   * vấn. Lượt chạy đầu chọn theo điểm tổng, và đoạn của cách cục (khớp bốn năm
   * sao cùng lúc) lấn hết chỗ: ba câu tổng quan khác hẳn nhau nhận đúng tám đoạn
   * y hệt nhau, kể cả câu về năm nay.
   */
  const theoTruyVan: DoanV3[][] = ketQua.map((ds, i) => {
    const t = truyVan[i];
    return ds
      .map((d) => {
        const bd = boDau(d.noiDung);
        const khopSao = t.sao.filter((s) => coTu(bd, boDau(s)) || (TEN_TAT[s] ?? []).some((x) => coTu(bd, x)));
        const biDanh = BI_DANH_CUNG[t.cung] ?? [];
        const khopCung = biDanh.some((b) => coTu(bd, b));
        // Mục sách đặt tên theo cung ("TỨ TÀI BẠCH CUNG", "CUNG PHU-THÊ") là nguồn đắt nhất
        const deMucCung = coTu(boDau(`${d.tieuDe} ${d.duongDeMuc ?? ''}`), biDanh[0] ?? '§');
        const dungChuDe = tuNhan.some((w) => coTu(bd, w));
        const m = meta.get(d.documentId);
        const mucTinCay = m?.mucTinCay ?? d.mucTinCay;
        let diem =
          d.diemRRF +
          0.012 * Math.min(khopSao.length, 3) +
          (khopCung && khopSao.length ? 0.02 : 0) +
          (deMucCung ? 0.03 : 0) +
          (dungChuDe ? 0.015 : 0) +
          (DIEM_TIN_CAY[mucTinCay] ?? 0);
        if (laDoanRac(d)) diem = -1;
        // Câu phú viết cho giới kia ("NỮ MỆNH CA", "đàn bà thủ mệnh") không phải căn cứ cho lá số này
        const tdBd = boDau(`${d.tieuDe} ${d.duongDeMuc ?? ''} ${d.noiDung.slice(0, 160)}`);
        if (gioiTinh === 'nam' ? /nu menh|dan ba|nu mang/.test(tdBd) : /nam menh|dan ong|nam mang/.test(tdBd)) diem = -1;
        return {
          id: '',
          tieuDe: d.tieuDe,
          duongDeMuc: d.duongDeMuc,
          noiDung: catQuanh(d.noiDung, khopSao.length ? khopSao : t.sao),
          documentId: d.documentId,
          chunkId: d.chunkId,
          diem,
          khopCung: khopCung || deMucCung ? t.cung : '',
          khopSao,
          mucTinCay,
          an: LOAI_NGUON_AN.has(m?.loaiNguon ?? ''),
        };
      })
      // Truy vấn theo cung chỉ nhận đoạn nói đúng cung ấy; truy vấn cách cục /
      // lưu tứ hóa chỉ cần khớp sao
      .filter((d) => d.diem > -1 && d.khopSao.length && (!t.laCung || d.khopCung))
      .sort((a, b) => b.diem - a.diem);
  });

  const soDoan = vao.soDoan ?? 8;
  const chon: DoanV3[] = [];
  const daLay = new Set<string>();
  const demTaiLieu = new Map<string, number>();
  const thuTuChon = theoTruyVan.length ? [theoTruyVan[0], ...theoTruyVan] : [];
  for (let vong = 0; chon.length < soDoan && vong < 4; vong++) {
    for (const ds of thuTuChon) {
      if (chon.length >= soDoan) break;
      // Bỏ trùng CẢ GIỮA các truy vấn: truy hồi chỉ bỏ bản chép trong một truy vấn,
      // còn cùng câu phú do hai truy vấn kéo về thì vẫn chiếm hai chỗ
      const d = ds.find(
        (x) =>
          !daLay.has(x.chunkId) &&
          (demTaiLieu.get(x.documentId) ?? 0) < 2 &&
          !chon.some((c) => doTrung(x.noiDung, c.noiDung) >= NGUONG_TRUNG)
      );
      if (!d) continue;
      daLay.add(d.chunkId);
      demTaiLieu.set(d.documentId, (demTaiLieu.get(d.documentId) ?? 0) + 1);
      chon.push({ ...d });
    }
  }
  chon.forEach((d, i) => (d.id = `E${String(i + 1).padStart(3, '0')}`));
  return chon;
}
