import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import type { DuKienLaSo } from './boi-canh-la-so';
import { NHAN_CHU_DE, NHAN_LOP_HAN, PHIEN_BAN_PLANNER, type KeHoachTruyVan } from './planner';
import { PHIEN_BAN_TRUY_HOI, type DoanUngVien } from './truy-hoi';

/**
 * Evidence Pack — ranh giới giữa tầng dữ liệu và tầng suy luận.
 *
 * Model nhận đúng ba thứ: câu hỏi, các dữ kiện lá số (F###) và các đoạn nguồn
 * (E###). Nó không được nhìn thấy gì khác, và mọi khẳng định chuyên môn nó đưa
 * ra phải gắn với ít nhất một mã trong đó.
 *
 * Mã là thứ làm cho việc kiểm tra thành khả thi. Không có mã thì "câu này có
 * căn cứ không" là một câu hỏi phải đọc hiểu mới trả lời được; có mã thì nó chỉ
 * là phép so sánh chuỗi.
 */

export const PHIEN_BAN_SCHEMA_OUTPUT = '1.0';

export interface Bangchung {
  id: string;
  chunkId: string;
  documentId: string;
  versionId: string;
  tieuDe: string;
  phienBanTaiLieu: string;
  duongDeMuc: string | null;
  hePhai: string;
  mucTinCay: string;
  noiDung: string;
}

export interface GoiBangChung {
  cauHoi: string;
  chuDe: string;
  lopHan: string[];
  cungLienQuan: string[];
  duKien: DuKienLaSo[];
  bangChung: Bangchung[];
  phienBan: {
    engine: string;
    phuongPhap: string;
    planner: string;
    truyHoi: string;
    schemaOutput: string;
  };
}

export function dungGoiBangChung(
  cauHoi: string,
  keHoach: KeHoachTruyVan,
  duKien: DuKienLaSo[],
  doan: DoanUngVien[]
): GoiBangChung {
  return {
    cauHoi,
    chuDe: NHAN_CHU_DE[keHoach.chuDe],
    lopHan: keHoach.lopHan.map((l) => NHAN_LOP_HAN[l]),
    cungLienQuan: keHoach.cungLienQuan,
    duKien,
    bangChung: doan.map((d, i) => ({
      id: `E${String(i + 1).padStart(3, '0')}`,
      chunkId: d.chunkId,
      documentId: d.documentId,
      versionId: d.versionId,
      tieuDe: d.tieuDe,
      phienBanTaiLieu: d.phienBanTaiLieu,
      duongDeMuc: d.duongDeMuc,
      hePhai: d.hePhai,
      mucTinCay: d.mucTinCay,
      noiDung: d.noiDung,
    })),
    phienBan: {
      engine: PHUONG_PHAP.id,
      phuongPhap: PHUONG_PHAP.phienBan,
      planner: PHIEN_BAN_PLANNER,
      truyHoi: PHIEN_BAN_TRUY_HOI,
      schemaOutput: PHIEN_BAN_SCHEMA_OUTPUT,
    },
  };
}

/** Khối văn bản chèn vào prompt. Cố ý không có tên sách ngoài phần đã liệt kê. */
export function dungKhoiChoPrompt(goi: GoiBangChung): string {
  const duKien = goi.duKien.map((f) => `${f.id}. ${f.noiDung}`).join('\n');

  const bangChung = goi.bangChung.length
    ? goi.bangChung
        .map(
          (e) =>
            `${e.id}. [${e.tieuDe} v${e.phienBanTaiLieu}${e.duongDeMuc ? ` — ${e.duongDeMuc}` : ''}]\n${e.noiDung}`
        )
        .join('\n\n')
    : '(Không có nguồn nào trong kho tri thức khớp với câu hỏi này.)';

  return [
    `CHỦ ĐỀ: ${goi.chuDe}`,
    `LỚP HẠN CẦN ĐỌC: ${goi.lopHan.join(', ')}`,
    `CUNG LIÊN QUAN: ${goi.cungLienQuan.join(', ')}`,
    '',
    'DỮ KIỆN LÁ SỐ (do engine tính, không được sửa hay thêm):',
    duKien,
    '',
    'NGUỒN THAM CHIẾU:',
    bangChung,
  ].join('\n');
}

/** Cấu trúc bắt buộc của câu trả lời. Gửi kèm prompt để model biết khuôn. */
export const SCHEMA_TRA_LOI = {
  type: 'object',
  required: ['tomTat', 'yChinh'],
  properties: {
    tomTat: { type: 'string' },
    yChinh: {
      type: 'array',
      items: {
        type: 'object',
        required: ['tieuDe', 'noiDung', 'maDuKien', 'maNguon'],
        properties: {
          tieuDe: { type: 'string' },
          noiDung: { type: 'string' },
          maDuKien: { type: 'array', items: { type: 'string' } },
          maNguon: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    canNhac: { type: 'array', items: { type: 'string' } },
    buocTiepTheo: { type: 'array', items: { type: 'string' } },
  },
} as const;

export interface YChinh {
  tieuDe: string;
  noiDung: string;
  maDuKien: string[];
  maNguon: string[];
}

export interface TraLoiCoCauTruc {
  tomTat: string;
  yChinh: YChinh[];
  canNhac?: string[];
  buocTiepTheo?: string[];
}

/**
 * Đọc JSON từ câu trả lời của model.
 *
 * Model hay bọc JSON trong ```json dù đã dặn không — nên gỡ rào trước, và nếu
 * vẫn không parse được thì trả về null để tầng gọi tự quyết, chứ không đoán.
 */
export function docTraLoi(text: string): TraLoiCoCauTruc | null {
  const sach = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const dau = sach.indexOf('{');
  const cuoi = sach.lastIndexOf('}');
  if (dau === -1 || cuoi <= dau) return null;

  try {
    const d = JSON.parse(sach.slice(dau, cuoi + 1));
    if (typeof d?.tomTat !== 'string' || !Array.isArray(d?.yChinh)) return null;
    return {
      tomTat: d.tomTat,
      yChinh: d.yChinh
        .filter((y: unknown): y is YChinh => !!y && typeof (y as YChinh).noiDung === 'string')
        .map((y: YChinh) => ({
          tieuDe: typeof y.tieuDe === 'string' ? y.tieuDe : '',
          noiDung: y.noiDung,
          maDuKien: Array.isArray(y.maDuKien) ? y.maDuKien.filter((x) => typeof x === 'string') : [],
          maNguon: Array.isArray(y.maNguon) ? y.maNguon.filter((x) => typeof x === 'string') : [],
        })),
      canNhac: Array.isArray(d.canNhac) ? d.canNhac.filter((x: unknown) => typeof x === 'string') : [],
      buocTiepTheo: Array.isArray(d.buocTiepTheo)
        ? d.buocTiepTheo.filter((x: unknown) => typeof x === 'string')
        : [],
    };
  } catch {
    return null;
  }
}
