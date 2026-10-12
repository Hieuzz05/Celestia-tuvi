/**
 * P0 — lõi chẩn đoán OFFLINE: một lượt đã chạy (vết của `chay-ca.ts`) → nguyên nhân hỏng.
 *
 * Hàm thuần, không gọi model, không chạm DB. Bài kiểm: `scripts/test-p0-chan-doan.ts`.
 *
 * Taxonomy (thứ tự = thứ tự tầng trong chuỗi, `primaryCause` = tầng hỏng SỚM NHẤT):
 *   PLANNING_ERROR → ENGINE_FACT_ERROR → KNOWLEDGE_GAP → RETRIEVAL_MISS → SELECTION_MISS → WRITING_MISS
 * Cắt ngang (không phải tầng, ghi riêng): UNSUPPORTED_CLAIM, ANSWER_OFF_TARGET.
 * Không có gì: NO_ERROR_FOUND. Cờ không dừng chẩn đoán: INPUT_UNCERTAIN, NOT_YET_VERIFIABLE.
 *
 * Mỗi phát hiện mang `nguon`: TAT_DINH (luật ở đây), JUDGE_A / JUDGE_C / JUDGE_LECH (`judge.ts`),
 * NGUOI (chủ dự án chấm tay). Kiểm tất định chỉ là TÍN HIỆU — ví dụ "không ứng viên nào nhắc cung
 * liên quan" là gần đúng cho RETRIEVAL_MISS, không phải chứng minh. Báo cáo nói rõ nguồn từng dòng.
 *
 * ENGINE_FACT_ERROR không suy được tất định từ vết (engine tự dựng F### của chính nó): chỉ gán
 * khi có nhãn NGUOI, hoặc khi F### mang năm lệch khỏi năm kế hoạch (dấu hiệu chọn sai lớp hạn).
 */

export const TANG = ['PLANNING_ERROR', 'ENGINE_FACT_ERROR', 'KNOWLEDGE_GAP', 'RETRIEVAL_MISS', 'SELECTION_MISS', 'WRITING_MISS'] as const;
export type Tang = (typeof TANG)[number];
export type CatNgang = 'UNSUPPORTED_CLAIM' | 'ANSWER_OFF_TARGET';
export type CoChanDoan = 'INPUT_UNCERTAIN' | 'NOT_YET_VERIFIABLE';
export type NguonPhatHien = 'TAT_DINH' | 'JUDGE_A' | 'JUDGE_C' | 'JUDGE_LECH' | 'NGUOI';

export interface PhatHien {
  loai: Tang | CatNgang;
  nguon: NguonPhatHien;
  /** Chỉ mã / số / ID — không chép văn trả lời vào đây */
  bangChung: string;
}

export interface ChanDoan {
  id: string;
  luot: number;
  primaryCause: Tang | null;
  secondaryCauses: Tang[];
  catNgang: CatNgang[];
  co: CoChanDoan[];
  ketLuan: 'CO_LOI' | 'NO_ERROR_FOUND';
  phatHien: PhatHien[];
  /** Ánh xạ sang mục tiêu cải thiện (theo primaryCause, rồi cắt ngang) */
  mucTieu: string[];
}

export const MUC_TIEU: Record<Tang | CatNgang, string> = {
  PLANNING_ERROR: 'Planner / hiểu câu (CEL-191: luật trước, gộp theo trường, timeIntent ký hiệu)',
  ENGINE_FACT_ERROR: 'Engine an sao / chọn lớp hạn (lib/tuvi, boi-canh-la-so) — cần celes-domain',
  KNOWLEDGE_GAP: 'Kho tri thức thiếu: thư viện nghiệm lý của chủ dự án (QĐ-13 / Owner Knowledge) hoặc nạp thêm nguồn',
  RETRIEVAL_MISS: 'Truy vấn truy hồi (truyVan / từ khoá) không chạm đúng cung — sửa planner.truyVan',
  SELECTION_MISS: 'Xếp hạng / chọn đoạn (RRF, uu-tien-nguon, soCuoi) — có đoạn đúng nhưng không được chọn',
  WRITING_MISS: 'Tầng viết: prompt Focused / validator (viết lại, 502, thiếu điểm bắt buộc)',
  UNSUPPORTED_CLAIM: 'Grounding claim ↔ căn cứ (T### / F### / E###) và validator KHONG_CAN_CU',
  ANSWER_OFF_TARGET: 'Hợp đồng trả lời: trả lời đúng câu, đúng thời điểm, đúng ngôn ngữ',
};

/* ----------------------------------------------------------- kiểu vết tối thiểu */

export interface UngVienVet {
  chunkId: string;
  duongDeMuc?: string;
  tieuDe?: string;
  noiDung?: string;
  duocChon?: boolean;
  diemVector?: number;
  hangVector?: number;
}
export interface LuotVet {
  stt: number;
  vao: { cauHoi: string; ngonNgu: string };
  ra: {
    van: string;
    provider: string;
    model: string;
    banNhap?: { claims?: { claim: string; evidenceIds?: string[]; timeRefs?: string[] }[]; outOfScope?: boolean } | null;
  } | null;
  loi: string | null;
  vet: {
    preview?: {
      hieu: { chuDe: string; yDinh: string; khuon: string; thoiGian: { loai: string; nam?: number; thang?: number }; coChoHoiLai: boolean };
      lan: { stt: number; loi: { ma: string }[] }[];
      loiRa: string;
    };
    duKien?: { id: string; loai?: string; noiDung: string }[];
    bangChung?: { id: string; chunkId: string }[];
    truyHoi?: { keHoach: { chuDe: string; cungLienQuan?: string[]; phamViThoiGian?: string; namMucTieu?: number; thangMucTieu?: number }; ungVien: UngVienVet[] }[];
  };
}

/** Kỳ vọng tầng hiểu. `hop-dong` = spec đã duyệt; `PROPOSED` = đề xuất, chưa phải gold. */
export interface KyVong {
  nguon: string;
  luotCuoi: Record<string, unknown> | null;
}

/** Nhãn ngoài (judge / người) cho MỘT lượt */
export interface NhanNgoai {
  claim?: { stt: number; nhan: 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED' | 'UNCLEAR'; nguon: NguonPhatHien }[];
  diemBatBuoc?: { id: string; nhan: 'COVERED' | 'PARTIAL' | 'MISSING'; nguon: NguonPhatHien }[];
  lech?: { nhan: 'ON' | 'PARTIAL' | 'OFF'; nguon: NguonPhatHien };
  /** Người gán thẳng một nguyên nhân (vd ENGINE_FACT_ERROR sau khi celes-domain xác nhận) */
  nguyenNhan?: { loai: Tang | CatNgang; bangChung: string }[];
}

/* ----------------------------------------------------------- tham số */

const CHU_DE_PLANNER = new Set(['su-nghiep', 'tai-chinh', 'tinh-cam', 'gia-dao', 'suc-khoe', 'tong-quan']);

/** Cung + từ khoá đặc trưng của chủ đề — để đo "ứng viên có chạm đúng vùng không". */
export const TU_KHOA_CHU_DE: Record<string, string[]> = {
  'su-nghiep': ['quan lộc', 'công danh', 'sự nghiệp', 'nghề', 'công việc', 'quan lộc'],
  'tai-chinh': ['tài bạch', 'tiền', 'tài lộc', 'của cải', 'điền trạch'],
  'tinh-cam': ['phu thê', 'hôn nhân', 'vợ', 'chồng', 'tình duyên'],
  'gia-dao': ['phụ mẫu', 'huynh đệ', 'cha mẹ', 'anh em', 'điền trạch'],
  'suc-khoe': ['tật ách', 'bệnh', 'sức khỏe', 'sức khoẻ'],
  'tong-quan': ['mệnh', 'phúc đức', 'thân'],
};

/** Ngưỡng "kho không có": điểm vector tốt nhất dưới mức này → KNOWLEDGE_GAP. Đo trên baseline. */
export const NGUONG_DIEM_KHO = 0.45;

const CO_DAU_VIET = /[ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/i;

const chuaTuKhoa = (u: UngVienVet, tk: string[]) => {
  const s = `${u.duongDeMuc ?? ''} ${u.tieuDe ?? ''} ${u.noiDung ?? ''}`.toLowerCase();
  return tk.some((k) => s.includes(k));
};

/* ----------------------------------------------------------- kỳ vọng thời gian */

/** timeIntent ký hiệu (PROPOSED) → điều kiện trên kế hoạch / vết. Hôm nay cố định trong bộ ca. */
export function kiemThoiGianKyHieu(
  kyHieu: string,
  cauHoi: string,
  homNay: { nam: number; thangDuong: number },
  ke: { phamViThoiGian?: string; namMucTieu?: number } | undefined,
  tg: { loai: string; nam?: number; thang?: number } | undefined
): string | null {
  const nam = (n: number) => (tg?.loai === 'nam' && tg.nam === n) || (ke?.phamViThoiGian === 'nam' && (ke.namMucTieu ?? homNay.nam) === n);
  const thang = (n: number, t: number) => tg?.loai === 'thang-duong' && tg.nam === n && tg.thang === t;
  const pv = ke?.phamViThoiGian;
  switch (kyHieu) {
    case 'current-year':
      return nam(homNay.nam) ? null : `cần năm ${homNay.nam}`;
    case 'next-year':
      return nam(homNay.nam + 1) ? null : `cần năm ${homNay.nam + 1}`;
    case 'previous-year':
      return nam(homNay.nam - 1) ? null : `cần năm ${homNay.nam - 1}`;
    case 'explicit-year': {
      const m = cauHoi.match(/\b(19|20)\d{2}\b/);
      return m && nam(Number(m[0])) ? null : `cần năm ${m?.[0] ?? '?'}`;
    }
    case 'current-month':
      return thang(homNay.nam, homNay.thangDuong) ? null : `cần tháng ${homNay.thangDuong}/${homNay.nam}`;
    case 'next-month': {
      const t = homNay.thangDuong === 12 ? 1 : homNay.thangDuong + 1;
      const n = homNay.thangDuong === 12 ? homNay.nam + 1 : homNay.nam;
      return thang(n, t) ? null : `cần tháng ${t}/${n}`;
    }
    case 'explicit-month': {
      const m = cauHoi.match(/tháng\s*(\d{1,2})/i);
      return m && thang(homNay.nam, Number(m[1])) ? null : `cần tháng ${m?.[1] ?? '?'}/${homNay.nam}`;
    }
    case 'near-future':
      return pv === 'gan' ? null : `cần phạm vi gan`;
    case 'long-term':
      return pv === 'giai-doan' ? null : `cần phạm vi giai-doan`;
    case 'none':
      return !pv || pv === 'khong-ro' ? null : `cần không mốc`;
    default:
      return null;
  }
}

/* ----------------------------------------------------------- chẩn đoán */

export interface DauVaoChanDoan {
  id: string;
  luot: LuotVet;
  laLuotCuoi: boolean;
  kyVong: KyVong;
  /** Lệch tầng hiểu đã chấm bằng `chamHieu` của hợp đồng (chỉ ca nguồn hop-dong) */
  lechHopDong?: string[];
  ngonNguCa: string;
  homNay: { nam: number; thangDuong: number };
  nhan?: NhanNgoai;
}

export function chanDoanLuot(d: DauVaoChanDoan): ChanDoan {
  const ph: PhatHien[] = [];
  const co = new Set<CoChanDoan>();
  const { luot } = d;
  const pv = luot.vet.preview;
  const th = luot.vet.truyHoi?.[luot.vet.truyHoi.length - 1];
  const laMa = luot.ra?.provider === 'ma';
  const them = (loai: PhatHien['loai'], bangChung: string, nguon: NguonPhatHien = 'TAT_DINH') => ph.push({ loai, nguon, bangChung });

  if (luot.loi) them('WRITING_MISS', `ngoại lệ: ${luot.loi.split(':')[0]}`);

  /* -- cờ */
  if (pv?.hieu.coChoHoiLai) co.add('INPUT_UNCERTAIN');
  const tg = pv?.hieu.thoiGian;
  if ((tg?.nam ?? 0) > d.homNay.nam || (tg?.loai === 'thang-duong' && tg.nam === d.homNay.nam && (tg.thang ?? 0) > d.homNay.thangDuong))
    co.add('NOT_YET_VERIFIABLE');
  if (th?.keHoach.phamViThoiGian === 'gan' || th?.keHoach.phamViThoiGian === 'giai-doan') co.add('NOT_YET_VERIFIABLE');

  /* -- PLANNING (chỉ lượt cuối: kỳ vọng đặt cho lượt cuối) */
  if (d.laLuotCuoi) {
    for (const l of d.lechHopDong ?? []) them('PLANNING_ERROR', `hợp đồng: ${l}`);
    const kv = d.kyVong.luotCuoi;
    if (kv && d.kyVong.nguon === 'PROPOSED' && !laMa) {
      const cd = kv.chuDe as string | undefined;
      if (cd && CHU_DE_PLANNER.has(cd) && pv && pv.hieu.chuDe !== cd) them('PLANNING_ERROR', `chủ đề ${pv.hieu.chuDe}, đề xuất ${cd}`);
      const tk = kv.thoiGianKyHieu as string | undefined;
      if (tk) {
        const lech = kiemThoiGianKyHieu(tk, luot.vao.cauHoi, d.homNay, th?.keHoach, tg);
        if (lech) them('PLANNING_ERROR', `thời gian (${tk}): ra ${tg ? JSON.stringify(tg) : '-'} / phạm vi ${th?.keHoach.phamViThoiGian ?? '-'}; ${lech}`);
      }
    }
  }

  /* -- ENGINE: F### mang năm khác năm kế hoạch (dấu hiệu chọn sai lớp hạn) */
  const namKe = tg?.loai === 'nam' ? tg.nam : undefined;
  if (namKe) {
    for (const f of luot.vet.duKien ?? []) {
      const ns = [...f.noiDung.matchAll(/\bnăm (\d{4})\b/gi)].map((m) => Number(m[1]));
      const la = ns.filter((n) => n !== namKe && n > 1990 && Math.abs(n - namKe) <= 1);
      if (f.loai === 'luu-nien' && la.length) them('ENGINE_FACT_ERROR', `${f.id} lưu niên mang năm ${la[0]} ≠ kế hoạch ${namKe}`);
    }
  }

  /* -- KNOWLEDGE / RETRIEVAL / SELECTION (chỉ khi có truy hồi) */
  if (th && !laMa) {
    const uv = th.ungVien ?? [];
    const tk = TU_KHOA_CHU_DE[th.keHoach.chuDe] ?? [];
    const maxDiem = Math.max(0, ...uv.map((u) => u.diemVector ?? 0));
    if (!uv.length) them('KNOWLEDGE_GAP', 'không có ứng viên nào');
    else if (maxDiem < NGUONG_DIEM_KHO) them('KNOWLEDGE_GAP', `điểm vector tốt nhất ${maxDiem.toFixed(3)} < ${NGUONG_DIEM_KHO}`);
    else if (tk.length && th.keHoach.chuDe !== 'tong-quan') {
      const dung = uv.filter((u) => chuaTuKhoa(u, tk));
      const chon = uv.filter((u) => u.duocChon);
      if (!dung.length) them('RETRIEVAL_MISS', `0/${uv.length} ứng viên nhắc vùng ${th.keHoach.chuDe}`);
      else if (!chon.some((u) => chuaTuKhoa(u, tk))) them('SELECTION_MISS', `${dung.length}/${uv.length} ứng viên đúng vùng nhưng 0/${chon.length} được chọn`);
    }
  }

  /* -- WRITING */
  if (!laMa && luot.ra && !luot.ra.van) {
    const ma = pv?.lan.flatMap((l) => l.loi.map((x) => x.ma)) ?? [];
    them('WRITING_MISS', `502 sau ${pv?.lan.length ?? '?'} lần; mã ${[...new Set(ma)].join(',') || '-'}`);
  }

  /* -- cắt ngang (tất định) */
  const claims = luot.ra?.banNhap?.claims ?? [];
  const hopLe = new Set([...(luot.vet.duKien ?? []).map((f) => f.id), ...(luot.vet.bangChung ?? []).map((e) => e.id)]);
  claims.forEach((c, i) => {
    const ev = c.evidenceIds ?? [];
    if (!ev.length) them('UNSUPPORTED_CLAIM', `claim ${i + 1}: không mã căn cứ`);
    else if (ev.some((e) => !hopLe.has(e))) them('UNSUPPORTED_CLAIM', `claim ${i + 1}: mã ngoài gói ${ev.filter((e) => !hopLe.has(e)).join(',')}`);
  });
  if (d.ngonNguCa === 'en' && luot.ra?.van && CO_DAU_VIET.test(luot.ra.van.replace(/\b[A-ZĐ][\p{L}]*(?:\s[A-ZĐ][\p{L}]*)*/gu, '')))
    them('ANSWER_OFF_TARGET', 'ca tiếng Anh nhưng văn có chữ tiếng Việt ngoài tên riêng');

  /* -- nhãn ngoài */
  const n = d.nhan;
  for (const c of n?.claim ?? []) if (c.nhan === 'UNSUPPORTED') them('UNSUPPORTED_CLAIM', `claim ${c.stt}: ${c.nhan}`, c.nguon);
  const thieu = (n?.diemBatBuoc ?? []).filter((x) => x.nhan === 'MISSING');
  if (thieu.length) them('WRITING_MISS', `thiếu điểm bắt buộc ${thieu.map((x) => x.id).join(',')}`, thieu[0].nguon);
  if (n?.lech?.nhan === 'OFF') them('ANSWER_OFF_TARGET', 'lệch câu hỏi', n.lech.nguon);
  for (const x of n?.nguyenNhan ?? []) them(x.loai, x.bangChung, 'NGUOI');

  /* -- tổng hợp */
  const tang = TANG.filter((t) => ph.some((p) => p.loai === t));
  const catNgang = (['UNSUPPORTED_CLAIM', 'ANSWER_OFF_TARGET'] as const).filter((t) => ph.some((p) => p.loai === t));
  const primary = tang[0] ?? null;
  return {
    id: d.id,
    luot: luot.stt,
    primaryCause: primary,
    secondaryCauses: tang.slice(1),
    catNgang: [...catNgang],
    co: [...co],
    ketLuan: primary || catNgang.length ? 'CO_LOI' : 'NO_ERROR_FOUND',
    phatHien: ph,
    mucTieu: [...(primary ? [MUC_TIEU[primary]] : []), ...catNgang.map((c) => MUC_TIEU[c])],
  };
}
