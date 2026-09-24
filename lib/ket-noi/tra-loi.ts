import { goiVoiFallback } from '@/lib/ai/fallback';
import { docObjectJson } from '@/lib/rag/doc-json';
import { mucChacChan, luatUuTienNguon, NHAN_TIN_CAY, type MucChacChan } from '@/lib/rag/uu-tien-nguon';
import { soatNgonNgu, type KetQuaNgonNgu } from '@/lib/rag/ngon-ngu';
import { QUY_TAC_LUAN_GIAI } from '@/lib/rag/quy-tac-luan-giai';
import { truyHoi, type DoanUngVien } from '@/lib/rag/truy-hoi';
import { nhanDangThucThe } from '@/lib/rag/thuc-the';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import type { LaSo } from '@/lib/tuvi/ansao';
import { dungDuKienCap, type DuKienCap } from './du-kien-cap';
import { lapKeHoachKetNoi } from './ke-hoach';
import { CAU_HINH_Y_DINH, type YDinhKetNoi } from './y-dinh';

/**
 * Đường đi của một lần so hai người.
 *
 * Cùng bộ xương với luận giải một người — lập kế hoạch, chọn dữ kiện, truy hồi,
 * gói bằng chứng, model, kiểm duyệt — nhưng dữ kiện là dữ kiện CẶP (PF###) và
 * các mục kết quả do ý định quyết định.
 *
 * Bảng so sánh kỹ thuật vẫn do engine tính độc lập ở tầng route: model hỏng thì
 * người dùng vẫn phải nhận được phần đó.
 */

// 2026.09.2: dùng bộ quy tắc luận giải chung (chủ dự án yêu cầu 24/09/2026)
export const PHIEN_BAN_KET_NOI = '2026.09.2';

export interface MucKetQua {
  id: string;
  tieuDe: string;
  noiDung: string;
  maDuKien: string[];
  maNguon: string[];
  luongNguoc?: string;
  mucChacChan?: MucChacChan;
}

export interface KetQuaKetNoi {
  yDinh: YDinhKetNoi;
  dangChuY: { tieuDe: string; noiDung: string; maDuKien: string[]; maNguon: string[] };
  muc: MucKetQua[];
  cauHoiCuaBan?: { cauHoi: string; traLoi: string; maDuKien: string[]; maNguon: string[] };
  canCu: {
    duKien: { id: string; noiDung: string }[];
    cachNoi?: string | null;
    coNguon: boolean;
    phuongPhap: string;
  };
  kiemDuyet: { dat: boolean; loi: string[] };
  ngonNgu: KetQuaNgonNgu | null;
  provider: string;
  model: string;
  phienBan: Record<string, string>;
}

function dungPrompt(
  tenA: string,
  tenB: string,
  yDinh: YDinhKetNoi,
  muc: { id: string; tieuDe: string; huong: string }[],
  duKien: DuKienCap[],
  doan: DoanUngVien[],
  cauHoi?: string
): { system: string; user: string } {
  const cauHinh = CAU_HINH_Y_DINH[yDinh];

  const khoiDuKien = duKien.map((d) => `${d.id}. ${d.noiDung}`).join('\n');
  const khoiNguon = doan.length
    ? doan
        .map(
          (d, i) =>
            `E${String(i + 1).padStart(3, '0')}. [mức: ${NHAN_TIN_CAY[d.mucTinCay] ?? d.mucTinCay}${d.duongDeMuc ? ` · mục "${d.duongDeMuc}"` : ''}]\n${d.noiDung}`
        )
        .join('\n\n')
    : '(Không có nguồn nào trong kho tri thức khớp với chủ đề này.)';

  const khoiMuc = muc.map((m) => `- "${m.id}" — ${m.tieuDe}: ${m.huong}`).join('\n');

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Bạn đang đặt hai lá số cạnh nhau để giúp người hỏi hiểu một mối quan hệ cụ thể.

MỤC ĐÍCH NGƯỜI HỎI ĐANG QUAN TÂM: ${cauHinh.nhan} — ${cauHinh.moTa}
Mọi nhận định phải phục vụ đúng mục đích này. Cùng hai lá số ấy, người hỏi về chuyện tình cảm cần thứ khác hẳn người hỏi về chuyện làm ăn.

NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN CẶP (mã PF###) — do engine tính từ hai lá số. Không sửa, không thêm sao, không đổi vị trí cung.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết Tử Vi. Mọi khẳng định chuyên môn phải dựa vào đây.
3. Câu hỏi và bối cảnh người dùng tự kể.
4. Kiến thức chung của bạn — chỉ cho ngôn ngữ và lập luận đời thường, KHÔNG thay cho mục 2.

TUYỆT ĐỐI KHÔNG:
- Không chấm điểm phần trăm hợp nhau. Không có thang điểm nào cả.
- Không phán "hợp" hay "không hợp" như một kết luận đóng. Không nói nên cưới, nên chia tay, nên hay không nên hợp tác.
- Không nói về định mệnh, duyên số đã định.
- Không nhắc tên tài liệu, tên hệ phái hay điểm liên quan.
- Không luận từ một sao đơn lẻ. Nhận định phải đứng trên cấu trúc: cung của cả hai người, sao, Tứ Hóa, Tuần/Triệt, quan hệ chi.
- Không bịa ra người thứ ba. Chỉ có ${tenA} và ${tenB}.

${QUY_TAC_LUAN_GIAI}

CÁCH VIẾT RIÊNG CHO PHẦN SO HAI NGƯỜI (theo sau bộ quy tắc chung ở trên):
- Nói điều quan sát được trước, thuật ngữ sau.
- Ưu tiên tình huống đời sống: "khi một bên cần bàn kỹ còn bên kia muốn chốt nhanh" thay vì "cung Mệnh cho thấy tính quyết đoán".
- Mỗi mục một ý chính, viết thành đoạn liền mạch có câu chuyển tiếp. Đừng gom mọi thứ vào một câu dài.
- Nói cả chỗ hợp lẫn chỗ lệch. Một mối quan hệ chỉ toàn điểm tốt là một bài đọc không đáng tin.
- Lời khuyên cho HAI người, đi ra từ chỗ lệch vừa nói (ví dụ cách hai bên bàn một việc lớn), không phải lời khuyên chung cho mọi cặp. Vẫn không phán nên cưới, nên chia tay, nên hay không nên hợp tác.
- Tránh "Nhìn chung…", "Điều này cho thấy rằng…", và đừng để nhiều câu liền nhau cùng mở một khuôn.
- Tránh từ kịch tính và tính từ chung chung kiểu "sâu sắc", "mạnh mẽ" nếu không có hành vi cụ thể đi kèm.
- Với mỗi mục, nếu có dữ kiện kéo ngược lại nhận định thì phải nói ra ở "luongNguoc".

${luatUuTienNguon()}

Nếu không đủ căn cứ cho một mục, hãy viết ngắn và nói rõ là chưa đủ căn cứ, thay vì viết dài cho đầy.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "dangChuY": { "tieuDe": "Điều đáng chú ý nhất", "noiDung": "3-5 câu", "maDuKien": ["PF001"], "maNguon": ["E001"] },
  "cachNoi": "1-2 câu: các dữ kiện trên nối với nhau thành mạch nào",
  "muc": [
    { "id": "<đúng id bên dưới>", "noiDung": "4-8 câu", "maDuKien": ["PF002"], "maNguon": [], "luongNguoc": "nếu có" }
  ]${cauHoi ? ',\n  "cauHoiCuaBan": { "traLoi": "trả lời thẳng câu hỏi, 4-8 câu", "maDuKien": [], "maNguon": [] }' : ''}
}

CÁC MỤC PHẢI CÓ ĐỦ, ĐÚNG ID, ĐÚNG THỨ TỰ:
${khoiMuc}`;

  const user = [
    `HAI NGƯỜI: ${tenA} và ${tenB}`,
    '',
    'DỮ KIỆN CẶP (do engine tính, không được sửa hay thêm):',
    khoiDuKien,
    '',
    'NGUỒN THAM CHIẾU:',
    khoiNguon,
    cauHoi ? `\nCÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG — ưu tiên trả lời thẳng:\n${cauHoi}` : '',
  ].join('\n');

  return { system, user };
}

interface ThoModel {
  dangChuY?: { tieuDe?: string; noiDung?: string; maDuKien?: string[]; maNguon?: string[] };
  cachNoi?: string;
  muc?: { id?: string; noiDung?: string; maDuKien?: string[]; maNguon?: string[]; luongNguoc?: string }[];
  cauHoiCuaBan?: { traLoi?: string; maDuKien?: string[]; maNguon?: string[] };
}

const docJson = (text: string): ThoModel | null => docObjectJson(text) as ThoModel | null;

const mang = (x: unknown): string[] =>
  Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [];

export class LoiKetNoi extends Error {}

export interface DauVaoKetNoi {
  laSoA: LaSo;
  laSoB: LaSo;
  tenA: string;
  tenB: string;
  yDinh: YDinhKetNoi;
  cauHoi?: string;
}

export async function luanKetNoi(vao: DauVaoKetNoi): Promise<KetQuaKetNoi> {
  const saoTheoCung = (ls: LaSo) => {
    const ra: Record<string, string[]> = {};
    for (const c of ls.cungs) {
      ra[c.tenCung] = c.sao
        .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
        .map((s) => s.ten);
    }
    return ra;
  };

  const keHoach = lapKeHoachKetNoi({
    yDinh: vao.yDinh,
    cauHoi: vao.cauHoi,
    saoA: saoTheoCung(vao.laSoA),
    saoB: saoTheoCung(vao.laSoB),
    tenA: vao.tenA,
    tenB: vao.tenB,
  });

  const duKien = dungDuKienCap({
    laSoA: vao.laSoA,
    laSoB: vao.laSoB,
    tenA: vao.tenA,
    tenB: vao.tenB,
    yDinh: vao.yDinh,
    cungThem: keHoach.cung,
  });

  const kqTruyHoi = await truyHoi(keHoach);
  const doan = kqTruyHoi.daChon;

  const { system, user } = dungPrompt(
    vao.tenA,
    vao.tenB,
    vao.yDinh,
    keHoach.muc,
    duKien,
    doan,
    vao.cauHoi
  );

  // Bài Kết nối dài hơn hẳn một câu trả lời chat: tối đa sáu mục, mỗi mục 4-8
  // câu, cộng phần tóm tắt và phần trả lời câu hỏi riêng. Cắt ngân sách token là
  // JSON đứt giữa chừng, và triệu chứng hiện ra dưới dạng "model trả sai cấu
  // trúc" — một thông báo dẫn người sửa đi nhầm hướng.
  const goi = await goiVoiFallback({ system, user, maxTokens: 8000 });
  const tho = docJson(goi.text);
  if (!tho?.dangChuY?.noiDung) {
    // Kèm đầu và cuối phần model trả về: cụt ở cuối là hết token, hỏng ở đầu là
    // model không chịu khuôn. Hai nguyên nhân đó cần hai cách sửa khác nhau.
    const v = goi.text.trim();
    throw new LoiKetNoi(
      `Model không trả về đúng cấu trúc kết quả (${goi.provider}/${goi.model}, ${v.length} ký tự). ` +
        `Đầu: ${v.slice(0, 120)} … Cuối: ${v.slice(-120)}`
    );
  }

  const maDuKienCo = new Set(duKien.map((d) => d.id));
  const maNguonCo = new Map(
    doan.map((d, i) => [`E${String(i + 1).padStart(3, '0')}`, d])
  );

  // Tên sao được phép nhắc — lấy từ chính dữ kiện cặp và nội dung nguồn
  const choPhep = new Set(
    nhanDangThucThe(
      [...duKien.map((d) => d.noiDung), ...doan.map((d) => d.noiDung)].join(' ')
    ).map((t) => t.id)
  );

  const loi: string[] = [];
  const locMa = (ds: string[], co: (m: string) => boolean, nhan: string) =>
    ds.filter((m) => {
      if (co(m)) return true;
      loi.push(`${nhan} ${m} không tồn tại`);
      return false;
    });

  const soatSao = (van: string, tai: string) => {
    for (const tt of nhanDangThucThe(van)) {
      if (tt.loai !== 'STAR' && tt.loai !== 'TRANSFORMATION') continue;
      if (!choPhep.has(tt.id)) loi.push(`${tai}: nhắc ${tt.ten} nhưng không có trong dữ kiện`);
    }
  };

  const doChac = (ma: string[]): MucChacChan =>
    mucChacChan(
      ma
        .map((m) => maNguonCo.get(m))
        .filter((d): d is DoanUngVien => !!d)
        .map((d) => ({ documentId: d.documentId, mucTinCay: d.mucTinCay }))
    );

  soatSao(tho.dangChuY.noiDung, 'Điều đáng chú ý');

  // Giữ đúng thứ tự và đủ mục theo cấu hình — model trả thiếu hoặc đảo thì UI
  // vẫn phải ra đúng khuôn của ý định đó.
  const theoId = new Map((tho.muc ?? []).map((m) => [m.id, m]));
  const muc: MucKetQua[] = keHoach.muc.map((cauHinhMuc) => {
    const m = theoId.get(cauHinhMuc.id);
    const noiDung = typeof m?.noiDung === 'string' ? m.noiDung.trim() : '';
    if (!noiDung) loi.push(`Thiếu mục "${cauHinhMuc.tieuDe}"`);
    else soatSao(noiDung, cauHinhMuc.tieuDe);
    const maNguon = locMa(mang(m?.maNguon), (x) => maNguonCo.has(x), 'Nguồn');
    return {
      id: cauHinhMuc.id,
      tieuDe: cauHinhMuc.tieuDe,
      noiDung,
      maDuKien: locMa(mang(m?.maDuKien), (x) => maDuKienCo.has(x), 'Dữ kiện'),
      maNguon,
      luongNguoc: typeof m?.luongNguoc === 'string' && m.luongNguoc.trim() ? m.luongNguoc.trim() : undefined,
      mucChacChan: doChac(maNguon),
    };
  });

  const van = [tho.dangChuY.noiDung, ...muc.map((m) => m.noiDung)].join('\n\n');
  const ngonNgu = soatNgonNgu(van, muc.map((m) => m.noiDung));

  return {
    yDinh: vao.yDinh,
    dangChuY: {
      tieuDe: tho.dangChuY.tieuDe?.trim() || 'Điều đáng chú ý nhất',
      noiDung: tho.dangChuY.noiDung.trim(),
      maDuKien: locMa(mang(tho.dangChuY.maDuKien), (x) => maDuKienCo.has(x), 'Dữ kiện'),
      maNguon: locMa(mang(tho.dangChuY.maNguon), (x) => maNguonCo.has(x), 'Nguồn'),
    },
    muc,
    cauHoiCuaBan:
      vao.cauHoi && tho.cauHoiCuaBan?.traLoi
        ? {
            cauHoi: vao.cauHoi,
            traLoi: tho.cauHoiCuaBan.traLoi.trim(),
            maDuKien: locMa(mang(tho.cauHoiCuaBan.maDuKien), (x) => maDuKienCo.has(x), 'Dữ kiện'),
            maNguon: locMa(mang(tho.cauHoiCuaBan.maNguon), (x) => maNguonCo.has(x), 'Nguồn'),
          }
        : undefined,
    canCu: {
      // Chỉ dữ kiện lá số và mạch suy luận — không tên tài liệu, không điểm số.
      duKien: duKien.map((d) => ({ id: d.id, noiDung: d.noiDung })),
      cachNoi: typeof tho.cachNoi === 'string' ? tho.cachNoi.trim() : null,
      coNguon: doan.length > 0,
      phuongPhap: `${PHUONG_PHAP.id} v${PHUONG_PHAP.phienBan}`,
    },
    kiemDuyet: { dat: loi.length === 0, loi },
    ngonNgu,
    provider: goi.provider,
    model: goi.model,
    phienBan: {
      ketNoi: PHIEN_BAN_KET_NOI,
      keHoach: keHoach.phienBan,
      truyHoi: kqTruyHoi.phienBan,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}
