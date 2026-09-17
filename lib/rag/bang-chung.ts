import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { luatUuTienNguon, mucChacChan, NHAN_TIN_CAY, type MucChacChan } from './uu-tien-nguon';
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

export const PHIEN_BAN_SCHEMA_OUTPUT = '1.1';

export interface Bangchung {
  id: string;
  /** Mã ngắn của tài liệu (T1, T2…) để model biết đoạn nào cùng một nguồn */
  maTaiLieu: string;
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

/** T1, T2… theo thứ tự tài liệu xuất hiện — ngắn hơn uuid và đủ để model phân biệt */
function maTaiLieuNgan(id: string, tatCa: string[]): string {
  return `T${[...new Set(tatCa)].indexOf(id) + 1}`;
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
      maTaiLieu: maTaiLieuNgan(
        d.documentId,
        doan.map((x) => x.documentId)
      ),
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

  // Mỗi nguồn mang theo mức tin cậy và mã tài liệu. Model cần cả hai để xử mâu
  // thuẫn theo luật: mức quyết định nghe ai, mã tài liệu để biết ba đoạn cùng
  // một sách chỉ là một tiếng nói chứ không phải ba nguồn đồng thuận.
  const bangChung = goi.bangChung.length
    ? goi.bangChung
        .map(
          (e) =>
            `${e.id}. [mức: ${NHAN_TIN_CAY[e.mucTinCay] ?? e.mucTinCay} · tài liệu ${e.maTaiLieu}${e.duongDeMuc ? ` · mục "${e.duongDeMuc}"` : ''}]\n${e.noiDung}`
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
    '',
    luatUuTienNguon(),
  ].join('\n');
}

export interface YChinh {
  tieuDe: string;
  noiDung: string;
  maDuKien: string[];
  maNguon: string[];
  /**
   * Dữ kiện kéo theo hướng ngược lại.
   *
   * Framework mục 5.3 bắt buộc: trước khi chốt một nhận định, phải đi tìm thứ
   * chỏi lại nó. Không có trường này thì model chỉ nhặt những sao củng cố câu
   * chuyện nó muốn kể, và bài đọc nào cũng mạch lạc một cách đáng ngờ.
   */
  luongNguoc?: string;
  /** Độ chắc, do máy chấm từ số nguồn độc lập — không phải model tự nhận */
  mucChacChan?: MucChacChan;
}

export interface TraLoiCoCauTruc {
  tomTat: string;
  yChinh: YChinh[];
  /**
   * Một hai câu nói các dữ kiện nối với nhau ra sao.
   *
   * Đây là thứ duy nhất trong phần "Muốn biết vì sao không?" mà model viết. Nó
   * thay cho việc liệt kê tên tài liệu — người đọc cần hiểu mạch suy luận, không
   * cần biết Celes đã lấy đoạn nào từ cuốn nào.
   */
  cachNoi?: string;
  canNhac?: string[];
  buocTiepTheo?: string[];
}

/**
 * Chấm độ chắc cho từng ý, dựa trên số nguồn ĐỘC LẬP đứng sau nó.
 *
 * Máy chấm, không để model tự nhận — model nào cũng nghĩ lập luận của mình là
 * chắc. Ở đây độ chắc là một phép đếm: bao nhiêu tài liệu khác nhau, mức nào.
 */
export function chamDoChac(traLoi: TraLoiCoCauTruc, goi: GoiBangChung): TraLoiCoCauTruc {
  const theoMa = new Map(goi.bangChung.map((e) => [e.id, e]));
  return {
    ...traLoi,
    yChinh: traLoi.yChinh.map((y) => ({
      ...y,
      mucChacChan: mucChacChan(
        y.maNguon
          .map((m) => theoMa.get(m))
          .filter((e): e is Bangchung => !!e)
          .map((e) => ({ documentId: e.documentId, mucTinCay: e.mucTinCay }))
      ),
    })),
  };
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
    const chuoi = (x: unknown) => (typeof x === 'string' && x.trim() ? x.trim() : undefined);
    return {
      tomTat: d.tomTat,
      cachNoi: chuoi(d.cachNoi),
      yChinh: d.yChinh
        .filter((y: unknown): y is YChinh => !!y && typeof (y as YChinh).noiDung === 'string')
        .map((y: YChinh) => ({
          tieuDe: typeof y.tieuDe === 'string' ? y.tieuDe : '',
          noiDung: y.noiDung,
          maDuKien: Array.isArray(y.maDuKien) ? y.maDuKien.filter((x) => typeof x === 'string') : [],
          maNguon: Array.isArray(y.maNguon) ? y.maNguon.filter((x) => typeof x === 'string') : [],
          luongNguoc: chuoi(y.luongNguoc),
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
