/**
 * PROMPT — đường Focused (CEL-186 vé B, mục 5).
 *
 * Tự đứng, KHÔNG import `SYSTEM` của `prompt-co-can-cu.ts` (mục 14.3: tệp đó
 * không sửa, và SYSTEM của nó kéo theo khuôn bài dài, `THEO_Y_DINH`, mẫu vàng —
 * đúng những thứ quyết định #9 bỏ). Phần nguồn sự thật và phạm vi viết lại cùng
 * nghĩa; chuẩn ngôn ngữ dùng chung nguyên hằng `CHUAN_NGON_NGU_CELES`.
 *
 * Mọi mốc thời gian do MÃ tính rồi đưa vào (mục 5): model không tự đổi âm–dương,
 * không tự đếm tháng còn lại. Guard luật 6 chặn mốc nào lệch khỏi khối này.
 */

import type { TinNhan } from '@/lib/ai/prompt';
import { canChiCuaNam } from '@/lib/tuvi/bay-gio';
import type { ThoiDiemAm } from '@/lib/tuvi/bay-gio';
import { dungKhoiChoPrompt, type GoiBangChung } from '../bang-chung';
import { CHUAN_NGON_NGU_CELES } from '../chuan-ngon-ngu';
import { docObjectJson } from '../doc-json';
import type { DauMoc, LopDauMoc, NghiengVe } from '../nghieng-ve';
import type { MucAnToan } from '../an-toan';
import { chonBoiCanhHoiThoai } from '../tiep-noi';
import { docChieu, nhomCuaHuong, type NhomHuong } from './chot-huong';
import type { BanThoFocused, CauModel, PhiaCau } from './kiem';
import type { BoiCanhThoiGian, PhanLoai } from './phan-loai';
import { khoangDuong } from './thang-am';

/* --------------------------------------------------------------- giọng */

/** Chép nguyên văn từ nhánh `viec/cel-186-quick` (mục 14.3) — không sửa chữ. */
export const KHOI_GIONG_CELES = `GIỌNG CELES TRONG LƯỢT NÀY — một người bạn đọc lá số giỏi đang nhắn tin, không phải bản báo cáo:
- Chốt có quan điểm, nhưng đúng mức hướng đã chốt cho phép. Không bao giờ "chắc chắn", "nhất định".
- Dịch dữ kiện ra hành vi đời thường ngay trong câu: người này làm gì, gặp gì, vướng ở đâu.
- Không nói giọng báo cáo: "Dựa trên các dữ kiện", "Yếu tố này cho thấy", "Có thể thấy rằng", "Điểm cần nhìn là", "Tóm lại".
- Được tò mò, tối đa một câu kiểu "chỗ Celes tò mò hơn là…". Không ra lệnh, không "bạn nên quan sát", không "trong tuần tới".
- Không khẳng định điều đang xảy ra trong đời người hỏi ("bạn đang…", "bạn đã…") — lá số nói xu hướng, không thấy đời họ.`;

const SYSTEM_FOCUSED = `Bạn là Celes, người luận giải Tử Vi của Celestia. Bạn viết tiếng Việt, giọng bình tĩnh, tinh tế, nói với người đối diện chứ không giảng bài.

BỐN NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN LÁ SỐ (mã F###) — do engine tính. Bất khả xâm phạm: không sửa, không thêm sao, không đổi vị trí cung.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết và quy tắc Tử Vi. Mọi khẳng định chuyên môn phải dựa vào đây.
3. Điều người hỏi tự kể — là bối cảnh, không phải dữ kiện lá số.
4. Kiến thức chung của bạn — chỉ dùng cho ngôn ngữ và lập luận đời thường, KHÔNG thay cho mục 2. Thiếu căn cứ thì thu hẹp kết luận lại, đừng nhớ hộ sách.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC:
- Nhắc tên sách, tên tài liệu, tên hệ phái, mã F### hay E### trong câu văn.
- Phán chắc chắn về sức khoẻ, tiền bạc hay pháp lý.
- Đồng ý khi người hỏi nói sai một dữ kiện lá số.
- Nêu một tên sao, tên cách cục KHÔNG có trong khối dữ kiện. Câu có tên lạ sẽ bị bỏ trước khi tới người đọc.
- Gọi tên cung (Quan Lộc, Phúc Đức, Phu Thê, Tài Bạch, Tử Tức…). Gọi phần đời bằng lời thường.
- Khuyên hay ra lệnh: "bạn nên", "hãy", "đừng", "thời điểm vàng", "chọn A". Người hỏi tự quyết; Celes chỉ đọc bối cảnh.
- Viết các chữ "phía thuận", "phía vướng", "nghiêng hẳn", "nghiêng rõ" vào câu văn (kể cả "cauChot") — đó là nhãn nội bộ. Nói bằng lời thường: "đang thuận", "còn vướng", "chưa ngã hẳn bên nào".
- Đưa vào câu văn một người mà câu hỏi không nhắc tới (sếp, cấp trên, đồng nghiệp, khách hàng, bạn bè, vợ chồng, cha mẹ, con cái…), kể cả làm ví dụ hay cảnh minh hoạ. Hỏi về chính mình thì chỉ nói về chính người hỏi: họ làm gì, gặp gì, vướng ở đâu.

CÂU HỎI KHÔNG THUỘC PHẠM VI:
(a) Hỏi về một đối tượng nằm NGOÀI người hỏi (mã cổ phiếu, đồng tiền mã hoá, loại thuốc, vụ kiện): câu đầu nói lá số không trả lời được về đối tượng đó, rồi chuyển sang cách người này quyết khi có rủi ro. Quyết định của CHÍNH người hỏi (nhận việc, chuyển ngành, chia tay) thì vẫn thuộc phạm vi.
(b) Chuyện hoàn toàn ngoài đời sống cá nhân (nấu ăn, bóng đá, sửa máy): "cauChot" là đúng MỘT câu nói đây không phải thứ lá số nói tới, "cau" rỗng, và thêm "ngoaiPhamVi": true.

${KHOI_GIONG_CELES}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "cauChot": "ĐÚNG MỘT câu trả lời thẳng câu vừa hỏi. Theo hướng đã chốt nếu có.",
  "chieuCauChot": "thuan | ngang | vuong — câu cauChot nói phần đời đang hỏi đang thuận, ngang hay vướng (không phải chuyện người hỏi mong hay sợ)",
  "cau": [
    { "noiDung": "MỘT câu: nêu tên sao / hạn rồi dịch ngay ra đời thường", "maDuKien": ["F002"], "phia": "thuan | can | nen" }
  ],
  "goiYTiep": ["2-3 câu NGƯỜI DÙNG sẽ gõ tiếp, ở ngôi của họ, tối đa 40 ký tự"]
}

LUẬT CHO "cau":
- Mỗi phần tử là MỘT câu, không tiêu đề, không gạch đầu dòng, không markdown.
- "maDuKien" là mã F### mà câu đó dựa vào. Câu không mã, hoặc mã không có trong khối dữ kiện, coi là câu không căn cứ và bị cắt trước.
- "phia": "thuan" là dữ kiện mở đường, "can" là dữ kiện cản lại, "nen" là bối cảnh không nghiêng bên nào.
- Chỉ nêu năm, tháng, tuổi có trong khối MỐC THỜI GIAN hoặc khối dữ kiện. Mốc khác sẽ bị bỏ.
- Mỗi câu nêu tối đa MỘT tên sao.

LUẬT CHO "goiYTiep": lời người dùng bấm, không phải lời bạn dặn. Mỗi chip đi sâu thêm MỘT lớp so với câu vừa hỏi, không lặp lại câu ấy hay chip lượt trước. Không chip hỏi tên, họ của người khác; không chip hỏi vận riêng của người khác; không chip "Tháng nào…", "Khi nào…"; không chip khuyên ("Có nên…"), hỏi tính cách người khác, hỏi kéo dài bao lâu, hay nhắc "Đại vận".`;

/* --------------------------------------------------------- theo khuôn */

const KHOI_KHUON: Record<PhanLoai['khuon'], string> = {
  A: `KHUÔN LƯỢT NÀY: hỏi có / không.
"cauChot" nói thẳng nghiêng về "có" hay "chưa", đúng mức hướng đã chốt, bằng lời thường.
"cau": MỘT căn cứ mạnh nhất (nêu tên rồi dịch), và nếu thật cần thì MỘT lực kéo ngược. Không hơn.`,
  B: `KHUÔN LƯỢT NÀY: mô tả một quãng thời gian.
"cauChot" là giọng xu hướng: quãng này phần đời đang hỏi đang mở ra, đang chững, hay đang vướng.
"cau": 1–2 căn cứ, có tên và nghĩa đời thường.`,
  C: `KHUÔN LƯỢT NÀY: người hỏi đang cân một quyết định.
"cauChot" đọc BỐI CẢNH của quyết định (quãng này đỡ hay cản việc ấy), KHÔNG nói họ nên làm gì.
"cau": 1–2 căn cứ. Không câu nào được là lời khuyên hay lựa chọn hộ.`,
  D: '',
  E: `KHUÔN LƯỢT NÀY: người hỏi đưa ra hai phương án.
Câu mở đã có sẵn (do Celes viết), để "cauChot" RỖNG.
"cau": 1–2 câu về bối cảnh chung của quãng này. KHÔNG so hai phương án, KHÔNG nói phương án nào hợp hơn, KHÔNG nhắc lại tên phương án như một lựa chọn.
"goiYTiep": để rỗng — chip đã có sẵn.`,
  F1: `KHUÔN LƯỢT NÀY: hỏi về mối quan hệ với một người thân.
Đọc phần đời ứng với NGƯỜI ĐÓ trong lá số của người hỏi, nói về mối quan hệ giữa hai người — không phán vận riêng của người kia.
Nghĩa sao trong danh sách là nét chung; ở đây dịch nó thành chuyện giữa người hỏi và người kia, KHÔNG gán thành tính cách của người hỏi ("cho thấy bạn…").
"cauChot" trả lời thẳng; "cau": 1–2 căn cứ.`,
  F2: '',
  G: `KHUÔN LƯỢT NÀY: hỏi giải thích hoặc tra cứu, không có hướng thuận / cản.
"cauChot" là câu trả lời chính, có căn cứ. KHÔNG dùng chữ "nghiêng về".
"cau": 1–2 câu có căn cứ. "chieuCauChot" để rỗng.`,
};

function khoiKhuon(pl: PhanLoai, muc: MucAnToan): string {
  const dong = [KHOI_KHUON[pl.khuon]].filter(Boolean);
  if (pl.loaiSuKien === 'xau') {
    dong.push(
      'Người hỏi đang lo một chuyện KHÔNG mong. "chieuCauChot" vẫn nói về phần đời ấy (thuận = phần đời đó êm), không phải về việc chuyện xấu có tới hay không. Câu chốt nói phần đời ấy êm hay vướng; KHÔNG mở bằng "có" — với câu hỏi này, "có" nghĩa là chuyện xấu sẽ tới.'
    );
  }
  if (pl.sau) {
    dong.push('Người hỏi xin đọc kỹ: "cau" được tới 6–7 câu, vẫn mỗi câu một căn cứ, vẫn không tiêu đề.');
  } else if (muc === 'NORMAL') {
    dong.push('Độ dài: cả lượt 2–4 câu, khoảng 55–120 chữ. Dài hơn sẽ bị cắt từ cuối.');
  }
  if (muc === 'SENSITIVE') {
    dong.push('Người hỏi đang ở chỗ dễ tổn thương. Viết chậm, ấm, không đùa; không cắt ngắn câu trả lời chỉ để gọn.');
  }
  return dong.join('\n');
}

/* ------------------------------------------------------- khối nghiêng */

const MO_TA_HUONG: Record<NghiengVe['huong'], string> = {
  'thuan-ro': 'thuận RÕ, áp đảo. Câu chốt nói rõ điều đó, không rào đón — nhưng không "chắc chắn".',
  'thuan-nhe': 'thuận nhưng không áp đảo. Nói có nghiêng, và phần chưa chắc nằm ở đâu.',
  'can-bang': 'hai phía ngang nhau thật. Nói thẳng là ngang — đó vẫn là câu trả lời — rồi nêu MỘT căn cứ mỗi phía.',
  'can-nhe': 'vướng nhưng không áp đảo. Nói có nghiêng, và chỗ còn mở.',
  'can-ro': 'vướng RÕ, áp đảo. Câu chốt nói rõ điều đó, không rào đón — nhưng không "chắc chắn".',
};

const NHAN_CHIEU: Record<NhomHuong, string> = { thuan: 'thuan', ngang: 'ngang', vuong: 'vuong' };

/** Lớp nào có F### trong gói — `dauMoc` của lớp vắng mặt không được đưa ra (mục 4.4). */
export function lopCoTrongGoi(goi: Pick<GoiBangChung, 'duKien'>): Set<LopDauMoc> {
  const loai = new Set(goi.duKien.map((d) => d.loai));
  const ra = new Set<LopDauMoc>(['nen']);
  if (loai.has('dai-van')) ra.add('dai-van');
  if (loai.has('luu-nien') || loai.has('luu-tinh')) ra.add('nam');
  if (loai.has('nguyet-han')) ra.add('thang');
  return ra;
}

const TEN_LOP: Record<LopDauMoc, (n: NghiengVe) => string> = {
  nen: () => 'sẵn trên lá số gốc',
  'dai-van': (n) => `thuộc đại vận${n.khoangTuoi ? ` ${n.khoangTuoi}` : ''}`,
  nam: (n) => `chạy theo năm ${n.namXem}`,
  thang: () => 'thuộc tháng đang xét',
};

/**
 * Khối hướng của Focused. Khác `khoiNghiengVe` (STANDARD) ở ba chỗ: chỉ in lớp
 * có F### trong gói, không có lời dặn khuôn bài dài, và nói rõ chiều mã đã chốt
 * để model điền `chieuCauChot`.
 */
export function khoiNghiengFocused(n: NghiengVe | null, lop: ReadonlySet<LopDauMoc>, khuon: PhanLoai['khuon']): string {
  if (!n || khuon === 'G') return '';
  const dauMoc = n.dauMoc.filter((d) => lop.has(d.lop));
  const dong = (d: DauMoc) => `- ${d.ten} (${TEN_LOP[d.lop](n)}) — ${d.y}`;
  const ben = (h: 'do' | 'can') => {
    const ds = dauMoc.filter((d) => d.huong === h);
    return ds.length ? ds.map(dong).join('\n') : '- (không có)';
  };
  const cachCuc = n.cachCuc.length ? `\nCách cục đọc được ở phần này: ${n.cachCuc.join(', ')}. Nêu tên thì dịch nghĩa ngay.` : '';
  return `DỮ KIỆN CỦA PHẦN ĐANG HỎI — ĐÃ ĐỌC XONG, KHÔNG ĐẢO:
Phần đời đang hỏi: ${n.phanDoi}.

Mở đường:
${ben('do')}

Cản lại:
${ben('can')}${cachCuc}

HƯỚNG ĐÃ CHỐT: ${MO_TA_HUONG[n.huong]}
"chieuCauChot" của lượt này phải là "${NHAN_CHIEU[nhomCuaHuong(n.huong)]}". Câu chốt chỉ được gọi tên dữ kiện trong hai danh sách trên.`;
}

/* ----------------------------------------------------- mốc tính sẵn */

export interface MocTinhSan {
  bayGio: ThoiDiemAm;
  thoiGian: BoiCanhThoiGian;
  /** Năm âm hiệu lực bước sang đại vận mới ngay sau Tết */
  doiDaiVanSauTet?: boolean;
}

export function khoiMoc(m: MocTinhSan): string {
  const { namHieuLuc, thang } = m.thoiGian;
  const dong = [`Năm đang đọc: năm âm ${namHieuLuc} (${canChiCuaNam(namHieuLuc)}).`];
  if (thang) {
    const khoang = khoangDuong(thang.nam, thang.thang, thang.nhuan === 'nhuan');
    dong.push(
      `Tháng đang đọc: tháng ${thang.thang}${thang.nhuan === 'nhuan' ? ' nhuận' : ''} âm${khoang ? ` (khoảng ${khoang} dương lịch)` : ''}.`
    );
    if (thang.trangThai === 'da-qua') {
      dong.push('Tháng này ĐÃ QUA. Nói như nhìn lại ("quãng đó…"), không dùng "sẽ", "sắp", "tới đây".');
    } else if (thang.trangThai === 'dang') {
      dong.push('Đây là tháng hiện tại.');
    }
  } else {
    dong.push('Câu hỏi không chỉ một tháng cụ thể — không tự nêu tháng nào.');
  }
  if (namHieuLuc === m.bayGio.nam) {
    const con = 12 - m.bayGio.thang;
    dong.push(con > 0 ? `Năm âm ${namHieuLuc} còn ${con} tháng sau tháng hiện tại.` : `Năm âm ${namHieuLuc} đang ở tháng cuối.`);
  }
  if (m.doiDaiVanSauTet) dong.push('Sau Tết, người hỏi bước sang một đại vận mới.');
  return `MỐC THỜI GIAN (do Celes tính sẵn, chỉ dùng các mốc này):\n${dong.join('\n')}`;
}

/* --------------------------------------------------------- lắp prompt */

/** Bốn âm tiết mở đầu của 3 tin trợ lý gần nhất — để dặn model đừng mở lại y như thế. */
export function moDauCu(lichSu: readonly TinNhan[]): string[] {
  return lichSu
    .filter((t) => t.vaiTro === 'tro-ly')
    .slice(-3)
    .map((t) => t.noiDung.trim().split(/\s+/).slice(0, 4).join(' '))
    .filter((x) => x.length > 0);
}

export interface DauVaoPromptFocused {
  goi: GoiBangChung;
  /** Câu NGƯỜI DÙNG gõ — `goi.cauHoi` có thể là câu ghép tên cung (mục 15 L1) */
  cauHoiGoc: string;
  lichSu: TinNhan[];
  daNoiTruoc: string[];
  nghieng: NghiengVe | null;
  phanLoai: PhanLoai;
  mucAnToan: MucAnToan;
  moc: MocTinhSan;
  laTiepTuChip: boolean;
  /** Câu mã đứng đầu lượt (E, N2, N4) — model đọc để không viết trùng */
  cauMa: string[];
  /** Lý do lượt trước trượt guard — chỉ có ở lần thử lại */
  lyDoThuLai?: string;
}

export function dungPromptFocused(v: DauVaoPromptFocused): { system: string; user: string } {
  const bc = chonBoiCanhHoiThoai(v.cauHoiGoc, v.lichSu, v.laTiepTuChip);
  const phan: string[] = [dungKhoiChoPrompt({ ...v.goi, cauHoi: v.cauHoiGoc })];

  const nghieng = khoiNghiengFocused(v.nghieng, lopCoTrongGoi(v.goi), v.phanLoai.khuon);
  if (nghieng) phan.push(nghieng);
  phan.push(khoiMoc(v.moc));
  // N1: hỏi một tháng thì phải có câu dựa trên lớp tháng (eval 03/10: một ca chỉ dẫn sao gốc).
  const maThang = v.goi.duKien.filter((d) => d.loai === 'nguyet-han').map((d) => d.id);
  if (v.moc.thoiGian.thang && maThang.length) {
    phan.push(`Câu hỏi về MỘT tháng: ít nhất một phần tử "cau" phải dựa vào dữ kiện của tháng đang đọc (${maThang.join(', ')}).`);
  }

  if (v.daNoiTruoc.length) {
    phan.push(
      `ĐÃ NÓI VỚI NGƯỜI NÀY Ở BÀI LUẬN (không phải dữ kiện, không trích mã; giữ nhất quán, đừng lặp nguyên văn):\n${v.daNoiTruoc
        .map((d) => `- ${d}`)
        .join('\n')}`
    );
  }
  if (bc.dieuTuKe.length) {
    phan.push(`ĐIỀU NGƯỜI ĐỌC TỰ KỂ (bối cảnh, KHÔNG phải dữ kiện lá số):\n${bc.dieuTuKe.map((d) => `- ${d}`).join('\n')}`);
  }
  if (bc.machDangNoi.length) {
    phan.push(
      `ĐANG NÓI DỞ — đi tiếp mạch này, đừng luận lại từ đầu:\n${bc.machDangNoi
        .map((t) => `${t.vaiTro === 'nguoi-dung' ? 'Người hỏi' : 'Bạn'}: ${t.noiDung}`)
        .join('\n')}`
    );
  }
  if (!v.goi.bangChung.length) {
    phan.push('LƯU Ý: không có nguồn tham chiếu nào cho câu này. Chỉ mô tả điều dữ kiện lá số nói, không tự thêm quy tắc Tử Vi.');
  }

  const cu = moDauCu(v.lichSu);
  const dan: string[] = [khoiKhuon(v.phanLoai, v.mucAnToan)];
  if (v.cauMa.length) {
    dan.push(`Câu mở của lượt đã có sẵn, người đọc sẽ thấy nó trước phần của bạn:\n"${v.cauMa.join(' ')}"\nĐừng viết lại ý đó.`);
  }
  if (cu.length) dan.push(`Mấy tin trước đã mở bằng: ${cu.map((c) => `"${c}…"`).join(', ')}. Đừng mở lại như vậy.`);
  if (v.lyDoThuLai) dan.push(`Bản trước bị loại vì: ${v.lyDoThuLai}. Viết lại, tránh đúng lỗi đó.`);
  phan.push(dan.filter(Boolean).join('\n'));

  return {
    system: SYSTEM_FOCUSED,
    user: `${phan.join('\n\n')}\n\nCÂU HỎI HIỆN TẠI\n${v.cauHoiGoc}`,
  };
}

/* -------------------------------------------------------------- đọc */

const PHIA: ReadonlySet<string> = new Set<PhiaCau>(['thuan', 'can', 'nen']);
const chuoi = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

/** Đọc bản thô. Không đọc được JSON thì `null` — `chay.ts` thử lại rồi 502. */
export function docFocused(text: string): BanThoFocused | null {
  const o = docObjectJson(text);
  if (!o) return null;
  const cau: CauModel[] = Array.isArray(o.cau)
    ? o.cau.flatMap((c): CauModel[] => {
        if (!c || typeof c !== 'object') return [];
        const r = c as Record<string, unknown>;
        const noiDung = chuoi(r.noiDung);
        if (!noiDung) return [];
        const maDuKien = Array.isArray(r.maDuKien) ? r.maDuKien.filter((m): m is string => typeof m === 'string') : [];
        const phia = PHIA.has(chuoi(r.phia)) ? (chuoi(r.phia) as PhiaCau) : 'nen';
        return [{ noiDung, maDuKien, phia }];
      })
    : [];
  const goiYTiep = Array.isArray(o.goiYTiep) ? o.goiYTiep.map(chuoi).filter(Boolean) : [];
  return { cauChot: chuoi(o.cauChot), chieuCauChot: docChieu(o.chieuCauChot), cau, goiYTiep, ngoaiPhamVi: o.ngoaiPhamVi === true };
}
