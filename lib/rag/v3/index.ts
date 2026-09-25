import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { docObjectJson } from '../doc-json';
import { CAU_HOI_V3, CHU_DE_V3, PHIEN_BAN_KHUNG_V3, type CauHoiV3 } from './khung';
import { dungDuKien, hoiThoiDiem, PHIEN_BAN_DU_KIEN_V3, saoDuocPhep, type DuKienV3 } from './du-kien';
import { donTatDinh, kiemBai, type BaiV3, type LoiV3 } from './kiem-v3';
import { khoiDoDai, PHIEN_BAN_PROMPT_V3, SYSTEM_V3 } from './prompt-v3';
import { PHIEN_BAN_TRUY_HOI_V3, truyHoiChoCau, type BoNhoTruyHoi, type DoanV3 } from './truy-hoi-v3';
import { khoiDaNoi, kiemLapPhanKhac, type MucDaNoi } from './so-y';

/**
 * LUỒNG LUẬN GIẢI v3 — Tổng quan + Chuyên sâu, mỗi câu hỏi một lượt gọi.
 *
 *   engine (ma trận cung) → dữ kiện F### → RAG theo từng cung → E###
 *   → Celes viết (dàn ý có mã → bài luận → vì sao) → kiểm bằng mã
 *   → nếu có lỗi chặn: MỘT vòng sửa có chỉ đích → kiểm lại → dọn tất định
 *
 * Mỗi câu độc lập nên chạy song song được và hết giờ chỉ mất đúng câu ấy —
 * đúng chỗ bản đọc sâu cũ gãy (TRANG-THAI "Đang vướng": chặng sau chạm trần
 * 55 giây là cả phần trống).
 */

export const PHIEN_BAN_V3 = {
  khung: PHIEN_BAN_KHUNG_V3,
  duKien: PHIEN_BAN_DU_KIEN_V3,
  truyHoi: PHIEN_BAN_TRUY_HOI_V3,
  prompt: PHIEN_BAN_PROMPT_V3,
};

/** Biến thể prompt cho bộ thử nghiệm (scripts/thu-nghiem-do-ro.ts) — không dùng trong sản phẩm */
export interface ThuNghiemV3 {
  system?: string;
  themVao?: (laSo: LaSo, q: CauHoiV3) => string;
  heSoDoDai?: number;
}

export interface KetQuaCauV3 {
  id: string;
  loai: CauHoiV3['loai'];
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  doRo: 'Rõ' | 'Khá rõ' | 'Gợi ý';
  danY: BaiV3['danY'];
  duKien: DuKienV3[];
  nguon: DoanV3[];
  /** Lỗi còn lại sau vòng sửa — rỗng nghĩa là qua hết luật đếm được */
  loiConLai: LoiV3[];
  /** Lỗi của bản đầu, trước khi sửa — để đo prompt chứ không chỉ đo đầu ra */
  loiBanDau: LoiV3[];
  soLanGoi: number;
  model: string;
  ms: number;
  msTruyHoi: number;
  dat: boolean;
}

function docBai(text: string): BaiV3 | null {
  const o = docObjectJson(text) as Record<string, unknown> | null;
  if (!o || typeof o.luanGiai !== 'string' || typeof o.viSao !== 'string') return null;
  const danY = Array.isArray(o.danY)
    ? (o.danY as unknown[])
        .filter((y): y is Record<string, unknown> => !!y && typeof y === 'object')
        .map((y) => ({
          y: typeof y.y === 'string' ? y.y : '',
          canCu: Array.isArray(y.canCu) ? (y.canCu as unknown[]).filter((x): x is string => typeof x === 'string') : [],
        }))
    : [];
  return { danY, luanGiai: o.luanGiai.replace(/\r/g, '').trim(), viSao: o.viSao.replace(/\s*\n+\s*/g, ' ').trim() };
}

function doRoCua(q: CauHoiV3, dk: DuKienV3[], nguon: DoanV3[]): KetQuaCauV3['doRo'] {
  if (q.cung[0] === 'TH' || q.van.includes('nguyet')) return 'Gợi ý';
  const chinh = dk.find((d) => d.vaiTro.includes('(chính)') || d.vaiTro === 'cung chính');
  const vcd = chinh?.noiDung.includes('không có chính tinh');
  const khop = nguon.filter((n) => n.khopCung && n.khopSao.length).length;
  if (vcd) return 'Khá rõ';
  return khop >= 2 ? 'Rõ' : 'Khá rõ';
}

/** Câu tổng quan nào hỏi về mặt đời nào — để truy hồi dùng đúng từ khoá */
const TU_KHOA_TONG_QUAN: Record<string, string> = {
  TQ01: 'tinh-cach', TQ05: 'su-nghiep', TQ06: 'tien-bac', TQ07: 'tinh-duyen', TQ08: 'van-han', TQ09: 'van-han', TQ10: 'van-han',
};

/**
 * PHẠM VI của từng câu tổng quan. Mười một câu hiện trên một màn hình nhưng
 * sinh song song, nên không câu nào biết câu kia nói gì. Đo ở lượt 2: năm câu
 * cùng kết bằng "đừng làm một mình", vì cách cục Tả Hữu có mặt trong dữ kiện
 * của cả năm. Chia phạm vi bằng mã rẻ hơn gộp mười một câu vào một lượt gọi.
 */
const PHAM_VI_TONG_QUAN: Record<string, string> = {
  TQ01: 'Chỉ nói con người: tính khí, cách ứng xử, mặt trong và mặt ngoài. Không bàn nghề, tiền, tình duyên, quý nhân.',
  TQ02: 'Chỉ MỘT điểm mạnh lớn nhất, nó hiện ra thế nào trong đời, và kết bằng cách dùng điểm mạnh ấy cho đúng chỗ. Không kể thêm điểm yếu.',
  TQ03: 'Chỉ MỘT điều cần lưu ý nhất (kiểu sai lặp lại hoặc mặt đời yếu nhất) và dấu hiệu nhận ra. Không nhắc lại điểm mạnh.',
  // Bản đồ mạnh – yếu trên trang đã liệt kê đủ ba nhóm; bài kể lại danh sách thì hết chữ cho phần "vì sao" (giám khảo 3/5, 25/09/2026)
  TQ04: 'Bản đồ trên trang đã liệt kê đủ ba nhóm Thuận lợi / Ổn định / Cần chăm chút — KHÔNG kể lại danh sách. Nói vì sao hai mặt mạnh nhất lại mạnh và hai mặt cần chăm chút nhất cần chăm (bằng phần đời, dựa dữ kiện "vì sao"), hai đầu ấy hiện ra thế nào trong đời, rồi kết bằng một lời khuyên dùng mặt mạnh để đỡ mặt yếu.',
  TQ05: 'Chỉ nói hướng nghề: nhóm nghề cụ thể và vai trò hợp. Không bàn tiền, tình duyên.',
  TQ06: 'Chỉ nói tiền bạc: kiếm dễ hay khó, giữ được không, nguồn chính, mốc thay đổi nếu dữ kiện có.',
  TQ07: 'Chỉ nói tình duyên: kiểu duyên, sớm hay muộn, người hợp.',
  TQ08: 'Chỉ nói giai đoạn 10 năm đang chạy: tên gọi giai đoạn, chủ đề chính, một lưu ý.',
  TQ09: 'Chỉ nói năm xem: chủ đề năm, một hai việc nên làm và nên tránh, dựa trên vận năm trong dữ kiện.',
  TQ10: 'Kể đường đời theo BA chặng lớn — tiền vận, trung vận, hậu vận — mỗi chặng một hai câu về xu hướng chung và điều đổi khác giữa các chặng. KHÔNG liệt kê từng giai đoạn 10 năm (phần đó thuộc Vận hạn chuyên sâu).',
  TQ11: 'Chỉ gợi ý 2–3 phần nên xem sâu trước và lý do ngắn cho từng phần.',
};

/**
 * PHẠM VI của một câu chuyên sâu, dựng từ chính khung: các câu cùng chủ đề
 * sinh song song nên không câu nào biết câu kia nói gì. Đo 24/09/2026 (lá số
 * A, 19 câu): chữ gần như không trùng (<2% câu) nhưng Ý lặp dày — cùng một
 * nét tính cách, cùng một mốc tuổi, cùng một lời khuyên đi qua bốn năm câu.
 * Nói cho mỗi câu biết các câu anh em lo phần nào là cách rẻ nhất để chia ý.
 */
/**
 * Câu GIỮ DÒNG THỜI GIAN của từng chủ đề (25/09/2026). Đo lá số A: chủ đề Tiền
 * bạc có ba câu (TB02, TB06, TB07) cùng kể lại "35–44 nhà cửa làm lại, 45–54
 * sáng nhất" — mỗi câu đều nhận chuỗi đại vận. Chỉ câu này kể đủ các mốc; câu
 * khác trong chủ đề nêu tối đa một mốc trả lời đúng câu hỏi của nó.
 */
const CAU_GIU_MOC: Record<string, string> = {
  'tinh-cach': 'TC07', 'su-nghiep': 'SN06', 'tien-bac': 'TB06', 'tinh-duyen': 'TD03', 'con-cai': 'CC01',
  'suc-khoe': 'SK02', 'nha-cua': 'NC01', 'van-han': 'VH01',
};

function luatMoc(q: CauHoiV3): string {
  if (!hoiThoiDiem(q)) return '';
  const giu = CAU_GIU_MOC[q.chuDe];
  if (giu === q.id) {
    return q.chuDe === 'van-han'
      ? ''
      : 'Câu này giữ dòng thời gian của chủ đề: ở mỗi mốc chỉ nói điều xảy ra với ĐÚNG phần đời của chủ đề này. Không gọi tên chủ đề chung của giai đoạn (kiểu "giai đoạn nhà cửa", "đoạn đời sống tinh thần") và không kể lại dòng đời chung — phần đó thuộc Vận hạn. Chỉ nêu những mốc thật sự làm phần đời này đổi khác, không cần đủ mọi giai đoạn.';
  }
  const cauGiu = giu && CAU_HOI_V3.find((x) => x.id === giu);
  return cauGiu
    ? `Các mốc giai đoạn của chủ đề này do câu "${cauGiu.cauHoi}" kể — câu này nêu tối đa MỘT mốc, đúng mốc trả lời câu hỏi của nó.`
    : '';
}

function phamViChuyenSau(q: CauHoiV3): string {
  const anhEm = CAU_HOI_V3.filter((x) => x.loai === 'chuyen-sau' && x.chuDe === q.chuDe && x.id !== q.id);
  const ten = CHU_DE_V3.find((c) => c.id === q.chuDe)?.ten ?? q.chuDe;
  const dong = [
    `Đây là một trong ${anhEm.length + 1} câu của chủ đề "${ten}"; người đọc đọc liền các câu trên cùng một trang. Chỉ đi sâu đúng trọng tâm câu này.`,
    anhEm.length
      ? `Những phần sau đã có câu khác trả lời — KHÔNG triển khai lại ở đây; nếu buộc phải chạm tới thì tối đa nửa câu làm cầu nối:\n${anhEm
          .map((x) => `- ${x.cauHoi} (${x.nhanDuoc})`)
          .join('\n')}`
      : '',
    hoiThoiDiem(q)
      ? luatMoc(q)
      : 'Câu này KHÔNG hỏi về thời điểm: không nêu mốc tuổi, giai đoạn mười năm hay năm cụ thể.',
    q.chuDe === 'tinh-cach'
      ? ''
      : 'Không tả lại tính cách chung của người này — phần đó thuộc chủ đề Tính cách. Nét tính cách chỉ được dùng một vế để giải thích một biểu hiện riêng của câu này.',
    // Lượt 8: chia phạm vi xong thì ba câu kết bài mà không khuyên gì (giám khảo 4 → 1)
    'Bài vẫn PHẢI kết bằng một lời khuyên hành động cụ thể ("bạn nên…" / "không nên…"), đi ra từ chính phần luận của câu này. Tránh lời khuyên chung là để thay bằng lời khuyên riêng — không phải để bỏ lời khuyên.',
  ];
  return dong.filter(Boolean).join('\n');
}

const AN_TOAN_SUC_KHOE = 'Đây là xu hướng để tham khảo, không phải chẩn đoán; chuyện sức khỏe cụ thể cần người có chuyên môn xem.';
const AN_TOAN_TAI_CHINH = 'Đây là góc nhìn từ lá số, không phải tư vấn tài chính.';

function datAnToan(q: CauHoiV3, bai: BaiV3): BaiV3 {
  const s = bai.luanGiai.toLowerCase();
  let luan = bai.luanGiai;
  if (q.chuDe === 'suc-khoe' && !/tham khảo|chẩn đoán/.test(s)) luan = `${luan.trim()} ${AN_TOAN_SUC_KHOE}`;
  if (/đầu tư/.test(q.cauHoi.toLowerCase()) && !s.includes('tư vấn tài chính')) luan = `${luan.trim()} ${AN_TOAN_TAI_CHINH}`;
  return { ...bai, luanGiai: luan };
}

export async function luanMotCau(vao: {
  laSo: LaSo;
  q: CauHoiV3;
  namXem: number;
  nho: BoNhoTruyHoi;
  nganSachMs?: number;
  /**
   * Mốc (Date.now()) mà cả request phải xong trước. Route trên Vercel sống tối
   * đa 60 giây; đo trên máy: nhóm tổng quan 11 câu xong ở giây 47 lần đầu. Còn
   * ít hơn 20 giây thì bỏ vòng sửa, giữ bản đầu — bản đầu lệch luật nhẹ vẫn hơn
   * cả nhóm chết vì quá trần.
   */
  hanChot?: number;
  /** CHỈ dùng cho bộ thử nghiệm — thay system prompt, thêm khối vào user, nới độ dài. Sản phẩm không truyền. */
  thuNghiem?: ThuNghiemV3;
  /** Sổ ý các phần ĐÃ SINH của cùng lá số + năm — chống lặp giữa các phần (xem so-y.ts) */
  daNoi?: MucDaNoi[];
}): Promise<KetQuaCauV3> {
  const t0 = Date.now();
  const { q } = vao;
  const duKien = dungDuKien(vao.laSo, q, vao.namXem);
  const tRag = Date.now();
  const nguon = await truyHoiChoCau({
    chuDe: q.chuDe,
    chuDeTuKhoa: TU_KHOA_TONG_QUAN[q.id],
    cungUuTien: q.loai === 'chuyen-sau' ? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh : undefined,
    cauHoi: q.cauHoi,
    duKien,
    nho: vao.nho,
  });
  const msTruyHoi = Date.now() - tRag;
  const phep = saoDuocPhep(duKien);
  // Cung chính để đánh dấu nguồn khớp: cung chính của chủ đề (chuyên sâu) hoặc cung đầu danh sách câu
  const cungChinhCau =
    (q.loai === 'chuyen-sau' ? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh : undefined) ??
    duKien.find((d) => d.vaiTro === 'cung chính' || d.vaiTro.endsWith('(chính)'))?.cung;

  const user = [
    khoiDoDai(q.loai),
    vao.thuNghiem?.themVao?.(vao.laSo, q) ?? '',
    `CÂU HỎI CỦA NGƯỜI ĐỌC: ${q.cauHoi}`,
    `NGƯỜI ĐỌC CẦN NHẬN ĐƯỢC: ${q.nhanDuoc}`,
    PHAM_VI_TONG_QUAN[q.id]
      ? `PHẠM VI CÂU NÀY: ${PHAM_VI_TONG_QUAN[q.id]}`
      : q.loai === 'chuyen-sau'
        ? `PHẠM VI CÂU NÀY:
${phamViChuyenSau(q)}`
        : '',
    khoiDaNoi(q, vao.daNoi ?? []),
    q.yeuToThem ? `YẾU TỐ NÊN XÉT: ${q.yeuToThem}` : '',
    q.khongDuoc ? `KHÔNG ĐƯỢC: ${q.khongDuoc}` : '',
    `DỮ KIỆN LÁ SỐ (engine tính, không được sửa hay thêm):\n${duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n')}`,
    `NGUỒN THAM CHIẾU (trích sách, chỉ dùng đoạn nói đúng tổ hợp sao – cung của lá số này):\n${
      nguon.length
        ? nguon
            .map(
              (n) =>
                // Không đưa tên sách vào nhãn: model chép lại nó vào phần "vì sao" ("Theo cách đọc của Tử Vi Hàm Số…")
                `${n.id} [${n.duongDeMuc ?? 'đoạn sách'}]${n.khopCung && n.khopCung === cungChinhCau ? ' [KHỚP CUNG CHÍNH]' : ''}\n${n.noiDung}`
            )
            .join('\n\n')
        : '(Kho không có đoạn nào khớp — thu hẹp kết luận, chỉ dựa vào phần Nghĩa nền trong dữ kiện.)'
    }`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const maDuKien = new Set(duKien.map((d) => d.id));
  const maNguon = new Set(nguon.map((n) => n.id));
  /*
   * Tên sách lọt vào bài (25/09/2026): luật trình bày cấm nêu tên sách, nhưng rà
   * phần "vì sao" thấy "Theo cách đọc của Tử Vi Hàm Số…". Bắt bằng tên tài liệu của
   * chính các đoạn nguồn được cấp (đủ ba chữ trở lên để không bắt nhầm "Tử Vi").
   */
  const tenSach = [...new Set(nguon.map((n) => n.tieuDe.trim()))].filter((t) => t.split(/\s+/).length >= 3);
  const kiemTenSach = (b: BaiV3) => {
    const chu = `${b.luanGiai} ${b.viSao}`.toLowerCase();
    const lo = tenSach.filter((t) => chu.includes(t.toLowerCase()));
    return lo.length
      ? [{ ma: 'ten-sach', moTa: `Nêu tên sách (${lo.join(', ')}) — bỏ tên sách, nói "sách xưa" hoặc chỉ nói điều sách nói.`, chan: true }]
      : [];
  };
  const kiem = (b: BaiV3) => [
    ...kiemBai({ bai: b, loai: q.loai, maDuKien, maNguon, saoDuocPhep: phep, hoiThoiDiem: hoiThoiDiem(q), heSoDoDai: vao.thuNghiem?.heSoDoDai }),
    ...kiemLapPhanKhac(b.luanGiai, vao.daNoi ?? [], q.id),
    ...kiemTenSach(b),
  ];

  let soLanGoi = 0;
  let model = '';
  const goi = async (u: string) => {
    soLanGoi += 1;
    const trongHan = Math.max(16_000, Math.min(vao.nganSachMs ?? 55_000, (vao.hanChot ?? Infinity) - Date.now()));
    const kq = await goiVoiFallback({ system: vao.thuNghiem?.system ?? SYSTEM_V3, user: u, maxTokens: 6000 }, undefined, trongHan);
    model = `${kq.provider}/${kq.model}`;
    return docBai(kq.text);
  };

  let bai = await goi(user);
  if (!bai) bai = await goi(user); // JSON gãy: thử lại nguyên lượt một lần
  if (!bai) {
    return {
      id: q.id, loai: q.loai, cauHoi: q.cauHoi, luanGiai: '', viSao: '', doRo: 'Gợi ý', danY: [], duKien, nguon,
      loiConLai: [{ ma: 'khong-doc-duoc', moTa: 'Model không trả JSON đọc được sau hai lượt.', chan: true }],
      loiBanDau: [], soLanGoi, model, ms: Date.now() - t0, msTruyHoi, dat: false,
    };
  }
  bai = donTatDinh(bai);
  const loiBanDau = kiem(bai);

  /*
   * MỘT vòng sửa, có chỉ đích. Gửi lại chính bài vừa viết cùng danh sách lỗi
   * bằng lời, và dặn giữ nguyên nội dung. Không viết lại từ đầu: viết lại là
   * lại tung xúc xắc với toàn bộ bài, trong khi chỉ một hai chỗ hỏng.
   */
  let loi = loiBanDau;
  const conLai = (vao.hanChot ?? Infinity) - Date.now();
  if (loi.some((l) => l.chan) && conLai > 20_000) {
    const sua = await goi(
      `${user}\n\nBÀI VỪA VIẾT (JSON):\n${JSON.stringify(bai)}\n\nLỖI CẦN SỬA — sửa ĐÚNG những lỗi này, giữ nguyên các ý và căn cứ, trả lại đủ JSON:\n${loi
        .filter((l) => l.chan)
        .map((l) => `- ${l.moTa}`)
        .join('\n')}`
    );
    if (sua) {
      const s = donTatDinh(sua);
      const loiSau = kiem(s);
      // Chỉ nhận bản sửa nếu nó không tệ hơn
      if (loiSau.filter((l) => l.chan).length <= loi.filter((l) => l.chan).length) {
        bai = s;
        loi = loiSau;
      }
    }
  }
  bai = datAnToan(q, bai);

  return {
    id: q.id,
    loai: q.loai,
    cauHoi: q.cauHoi,
    luanGiai: bai.luanGiai,
    viSao: bai.viSao,
    doRo: doRoCua(q, duKien, nguon),
    danY: bai.danY,
    duKien,
    nguon,
    loiConLai: loi,
    loiBanDau,
    soLanGoi,
    model,
    ms: Date.now() - t0,
    msTruyHoi,
    dat: !loi.some((l) => l.chan),
  };
}

/** Chạy nhiều câu với giới hạn song song — nhà cung cấp chung hạn mức cho cả hai máy */
export async function luanNhieuCau(vao: {
  laSo: LaSo;
  ids: string[];
  namXem: number;
  songSong?: number;
  hanChot?: number;
  thuNghiem?: ThuNghiemV3;
  daNoi?: MucDaNoi[];
  khiXong?: (k: KetQuaCauV3) => void;
}): Promise<KetQuaCauV3[]> {
  const nho: BoNhoTruyHoi = new Map();
  const ds = vao.ids.map((id) => CAU_HOI_V3.find((q) => q.id === id)).filter((q): q is CauHoiV3 => !!q);
  const ra: KetQuaCauV3[] = new Array(ds.length);
  let i = 0;
  const tho = async () => {
    while (i < ds.length) {
      const j = i++;
      try {
        ra[j] = await luanMotCau({ laSo: vao.laSo, q: ds[j], namXem: vao.namXem, nho, hanChot: vao.hanChot, thuNghiem: vao.thuNghiem, daNoi: vao.daNoi });
      } catch (e) {
        ra[j] = {
          id: ds[j].id, loai: ds[j].loai, cauHoi: ds[j].cauHoi, luanGiai: '', viSao: '', doRo: 'Gợi ý', danY: [],
          duKien: [], nguon: [], loiBanDau: [], soLanGoi: 0, model: '', ms: 0, msTruyHoi: 0, dat: false,
          loiConLai: [{ ma: 'loi-goi', moTa: (e as Error).message.slice(0, 200), chan: true }],
        };
      }
      vao.khiXong?.(ra[j]);
    }
  };
  await Promise.all(Array.from({ length: vao.songSong ?? 4 }, tho));
  return ra;
}

export { CAU_HOI_V3 };
