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
import type { DauMoc, LopDauMoc, NghiengVe } from '../nghieng-ve';
import type { MucAnToan } from '../an-toan';
import { chonBoiCanhHoiThoai } from '../tiep-noi';
import { nhomCuaHuong, type NhomHuong } from './chot-huong';
import { khoaTen, tapTenTuGoi } from './quet-ten';
import type { LoiCung } from './hop-dong';
import type { NgonNgu } from './ngon-ngu';
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
- Nêu một tên sao, tên cách cục KHÔNG có trong khối dữ kiện. Bài có tên lạ sẽ bị viết lại toàn bộ.
- Gọi tên cung (Quan Lộc, Phúc Đức, Phu Thê, Tài Bạch, Tử Tức…). Gọi phần đời bằng lời thường.
- Khuyên hay ra lệnh: "bạn nên", "hãy", "đừng", "thời điểm vàng", "chọn A". Người hỏi tự quyết; Celes chỉ đọc bối cảnh.
- Viết các chữ "phía thuận", "phía vướng", "nghiêng hẳn", "nghiêng rõ" vào "answer" — đó là nhãn nội bộ. Nói bằng lời thường: "đang thuận", "còn vướng", "chưa ngã hẳn bên nào".
- Đưa vào câu văn một người mà câu hỏi không nhắc tới (sếp, cấp trên, đồng nghiệp, khách hàng, bạn bè, vợ chồng, cha mẹ, con cái…), kể cả làm ví dụ hay cảnh minh hoạ. Hỏi về chính mình thì chỉ nói về chính người hỏi: họ làm gì, gặp gì, vướng ở đâu.

CÂU HỎI KHÔNG THUỘC PHẠM VI:
(a) Hỏi về một đối tượng nằm NGOÀI người hỏi (mã cổ phiếu, đồng tiền mã hoá, loại thuốc, vụ kiện): câu đầu nói lá số không trả lời được về đối tượng đó, rồi chuyển sang cách người này quyết khi có rủi ro. Quyết định của CHÍNH người hỏi (nhận việc, chuyển ngành, chia tay) thì vẫn thuộc phạm vi.
(b) Chuyện hoàn toàn ngoài đời sống cá nhân (nấu ăn, bóng đá, sửa máy): "answer" là đúng MỘT câu nói đây không phải thứ lá số nói tới, "claims" rỗng, và thêm "outOfScope": true.

${KHOI_GIONG_CELES}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "answer": "Câu trả lời trọn vẹn bằng văn xuôi — người đọc thấy đúng chuỗi này. Câu đầu trả lời thẳng câu vừa hỏi, theo hướng đã chốt nếu có.",
  "claims": [
    { "claim": "Một câu tóm MỘT kết luận của answer", "evidenceIds": ["F002"], "direction": "thuan | ngang | vuong", "timeRefs": ["nam"] }
  ],
  "suggestedQuestions": ["2-3 câu NGƯỜI DÙNG sẽ gõ tiếp, ở ngôi của họ, tối đa 40 ký tự"],
  "hoanCanhNhanRa": ["hoàn cảnh người hỏi tự kể, tối đa 3 nhãn, mỗi nhãn tối đa 6 từ — có thì ghi, không thì bỏ trường này"]
}

LUẬT CHO "answer":
- Văn xuôi liền mạch: không tiêu đề, không gạch đầu dòng, không markdown, không mã F### / E###.
- Trả lời đủ ý câu hỏi, không lặp ý, không kể lại câu hỏi. Câu đơn thì gọn; câu nhiều ý hay hai nửa tháng khác chiều thì đủ để người đọc hiểu.
- Chỉ nêu năm, tháng, tuổi có trong khối MỐC THỜI GIAN hoặc khối dữ kiện.
- Nếu câu hỏi tự kể hoàn cảnh thì trả lời TRONG hoàn cảnh đó.

LUẬT CHO "claims" — người đọc KHÔNG thấy, dùng để kiểm căn cứ:
- claims[0] là kết luận chính của answer. "direction" của claims[0] nói phần đời đang hỏi đang thuận, ngang hay vướng (không phải chuyện người hỏi mong hay sợ).
- Mỗi claim dẫn ít nhất một mã F### hoặc E### có trong gói lượt này. Mã không có trong gói là căn cứ bịa: cả bài bị viết lại.
- "timeRefs" chỉ khi claim nói về một mốc ("nam" = năm đang đọc).

LUẬT CHO "suggestedQuestions": lời người dùng bấm, không phải lời bạn dặn. Mỗi chip đi sâu thêm MỘT lớp so với câu vừa hỏi, không lặp lại câu ấy hay chip lượt trước. Không chip hỏi tên, họ của người khác; không chip hỏi vận riêng của người khác; không chip "Tháng nào…", "Khi nào…"; không chip khuyên ("Có nên…"), hỏi tính cách người khác, hỏi kéo dài bao lâu, hay nhắc "Đại vận".`;

/* --------------------------------------------------------- theo khuôn */

const KHOI_KHUON: Record<PhanLoai['khuon'], string> = {
  A: `KHUÔN LƯỢT NÀY: hỏi có / không.
"answer" nói thẳng nghiêng về "có" hay "chưa", đúng mức hướng đã chốt, bằng lời thường.`,
  B: `KHUÔN LƯỢT NÀY: mô tả một quãng thời gian.
"answer" nói giọng xu hướng: quãng này phần đời đang hỏi đang mở ra, đang chững, hay đang vướng.`,
  C: `KHUÔN LƯỢT NÀY: người hỏi đang cân một quyết định.
"answer" đọc BỐI CẢNH của quyết định (quãng này đỡ hay cản việc ấy), KHÔNG nói họ nên làm gì. Không câu nào được là lời khuyên hay lựa chọn hộ.`,
  D: `KHUÔN LƯỢT NÀY: câu có chữ hỏi thời điểm ("khi nào", "bao giờ"…).
Nếu người hỏi THẬT SỰ hỏi bao giờ một việc tới: lượt này đọc ở mức NĂM. "answer" nói năm đang đọc (theo khối MỐC THỜI GIAN) mở hay cản việc ấy. Nói bằng lời của mình (không lặp một câu quen) rằng lượt này chưa chọn ra tháng nào, và họ muốn xem tháng nào thì hỏi riêng tháng đó. Người hỏi có kể hoàn cảnh (đang thất nghiệp, vừa chia tay…) thì nhắc tới hoàn cảnh ấy.
KHÔNG nêu tháng, mùa, quý, "cuối năm", "đầu năm", "sau Tết" hay bất kỳ mốc nào nhỏ hơn một năm.
Nếu câu chỉ có chữ ấy mà không hỏi thời điểm ("lúc nào cũng mệt…", "chưa bao giờ…") thì trả lời đúng điều họ hỏi như mọi câu khác.`,
  E: `KHUÔN LƯỢT NÀY: người hỏi đưa ra hai phương án.
Câu mở đã có sẵn (do Celes viết). "answer" chỉ nói về bối cảnh chung của quãng này. KHÔNG so hai phương án, KHÔNG nói phương án nào hợp hơn, KHÔNG nhắc lại tên phương án như một lựa chọn.
"suggestedQuestions": để rỗng — chip đã có sẵn.`,
  F1: `KHUÔN LƯỢT NÀY: hỏi về mối quan hệ với một người thân.
Đọc phần đời ứng với NGƯỜI ĐÓ trong lá số của người hỏi, nói về mối quan hệ giữa hai người — không phán vận riêng của người kia.
Nghĩa sao trong danh sách là nét chung; ở đây dịch nó thành chuyện giữa người hỏi và người kia, KHÔNG gán thành tính cách của người hỏi ("cho thấy bạn…").
"answer" trả lời thẳng.`,
  F2: '',
  G: `KHUÔN LƯỢT NÀY: hỏi giải thích hoặc tra cứu, không có hướng thuận / cản.
"answer" là câu trả lời chính, có căn cứ. KHÔNG dùng chữ "nghiêng về". "claims" không cần "direction".`,
};

function khoiKhuon(pl: PhanLoai, muc: MucAnToan): string {
  const dong = [KHOI_KHUON[pl.khuon]].filter(Boolean);
  if (pl.loaiSuKien === 'xau') {
    dong.push(
      'Người hỏi đang lo một chuyện KHÔNG mong. "direction" của claims[0] vẫn nói về phần đời ấy (thuận = phần đời đó êm), không phải về việc chuyện xấu có tới hay không. Câu đầu nói phần đời ấy êm hay vướng; KHÔNG mở bằng "có" — với câu hỏi này, "có" nghĩa là chuyện xấu sẽ tới.'
    );
  }
  if (pl.sau) {
    dong.push('Người hỏi muốn nghe kỹ.');
  }
  if (muc === 'SENSITIVE') {
    dong.push('Người hỏi đang ở chỗ dễ tổn thương. Viết chậm, ấm, không đùa; không cắt ngắn câu trả lời chỉ để gọn.');
  }
  return dong.join('\n');
}

/* ------------------------------------------------------- khối nghiêng */

const MO_TA_HUONG: Record<NghiengVe['huong'], string> = {
  'thuan-ro': 'thuận RÕ, áp đảo. Câu trả lời nói rõ điều đó, không rào đón — nhưng không "chắc chắn".',
  'thuan-nhe': 'thuận nhưng không áp đảo. Nói có nghiêng, và phần chưa chắc nằm ở đâu.',
  'can-bang': 'hai phía ngang nhau thật. Nói thẳng là ngang — đó vẫn là câu trả lời — rồi nêu MỘT căn cứ mỗi phía.',
  'can-nhe': 'vướng nhưng không áp đảo. Nói có nghiêng, và chỗ còn mở.',
  'can-ro': 'vướng RÕ, áp đảo. Câu trả lời nói rõ điều đó, không rào đón — nhưng không "chắc chắn".',
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

export interface NghiengHienThi {
  /** Đầu mốc in KÈM tên: tên có trong chữ dữ kiện */
  dauMoc: DauMoc[];
  /** Đầu mốc in KHÔNG tên: sao chỉ có ở `d.sao` — giữ nét đời sống cho hướng, không cấp quyền gọi tên */
  anTen: DauMoc[];
  cachCuc: string[];
}

/**
 * Đầu mốc và cách cục mà `khoiNghiengFocused` thực sự in ra. Guard tên đọc
 * cùng hàm này, nên tên được phép gọi không lệch khỏi chữ model thấy.
 *
 * Chỉ in lớp có F### trong gói. Sao chỉ có ở `d.sao` (phụ tinh không trọng yếu,
 * không có trong câu dữ kiện) vẫn vào khối nhưng mất tên: in tên là để metadata
 * cấp quyền gọi tên qua cửa sau (A/B 04/10/2026: Phá Toái, Thiên Y).
 */
export function nghiengHienThi(
  n: NghiengVe | null,
  goi: Pick<GoiBangChung, 'duKien'>,
  khuon: PhanLoai['khuon']
): NghiengHienThi | null {
  if (!n || khuon === 'G') return null;
  const lop = lopCoTrongGoi(goi);
  const trongChu = tapTenTuGoi(goi.duKien);
  const trongSao = new Set(goi.duKien.flatMap((d) => (d.sao ?? []).map(khoaTen)));
  const dauMoc: DauMoc[] = [];
  const anTen: DauMoc[] = [];
  for (const d of n.dauMoc) {
    if (!lop.has(d.lop)) continue;
    const k = khoaTen(d.ten);
    if (trongChu.has(k)) dauMoc.push(d);
    else if (trongSao.has(k)) anTen.push(d);
  }
  return { dauMoc, anTen, cachCuc: [...n.cachCuc] };
}

/**
 * Tập tên guard cho phép trong một lượt, dựng từ đúng các mặt chữ prompt in ra:
 * `noiDung` của dữ kiện, khối nghiêng (đầu mốc có tên, cách cục) và câu hỏi khi
 * tra cứu đích danh. `tenHien` là đầu mốc + cách cục đã in, dùng cho lớp sửa tên.
 */
export function tenDuocGoiTrongLuot(v: {
  goi: Pick<GoiBangChung, 'duKien'>;
  nghieng: NghiengVe | null;
  khuon: PhanLoai['khuon'];
  cauTraCuu?: string;
}): { tapTen: Set<string>; tenHien: string[] } {
  const hien = nghiengHienThi(v.nghieng, v.goi, v.khuon);
  const tenHien = hien ? [...hien.dauMoc.map((d) => d.ten), ...hien.cachCuc] : [];
  const chu = [khoiNghiengFocused(v.nghieng, v.goi, v.khuon), ...(v.cauTraCuu ? [v.cauTraCuu] : [])];
  return { tapTen: tapTenTuGoi(v.goi.duKien, chu, tenHien), tenHien };
}

/**
 * Khối hướng của Focused. Khác `khoiNghiengVe` (STANDARD) ở ba chỗ: chỉ in lớp
 * có F### trong gói, không có lời dặn khuôn bài dài, và nói rõ chiều mã đã chốt
 * để model điền `direction` của `claims[0]`.
 */
export function khoiNghiengFocused(n: NghiengVe | null, goi: Pick<GoiBangChung, 'duKien'>, khuon: PhanLoai['khuon']): string {
  const hien = nghiengHienThi(n, goi, khuon);
  if (!n || !hien) return '';
  const coTen = new Set(hien.dauMoc);
  // Giữ thứ tự gốc (theo trọng số) — đầu mốc không tên đứng đúng chỗ của nó.
  const dauMoc = n.dauMoc.filter((d) => coTen.has(d) || hien.anTen.includes(d));
  const dong = (d: DauMoc) =>
    coTen.has(d)
      ? `- ${d.ten} (${TEN_LOP[d.lop](n)}) — ${d.y}`
      : `- Một sao phụ riêng, KHÔNG gọi tên và không gán nét này cho sao khác (${TEN_LOP[d.lop](n)}) — ${d.y}`;
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
"direction" của claims[0] lượt này phải là "${NHAN_CHIEU[nhomCuaHuong(n.huong)]}". Câu trả lời chỉ được gọi tên các dữ kiện CÓ TÊN trong hai danh sách trên.`;
}

/* ----------------------------------------------------- mốc tính sẵn */

export interface MocTinhSan {
  bayGio: ThoiDiemAm;
  thoiGian: BoiCanhThoiGian;
  /** Năm âm hiệu lực bước sang đại vận mới ngay sau Tết */
  doiDaiVanSauTet?: boolean;
}

/**
 * `khuon` D: bỏ hai dòng tự mời mốc nhỏ hơn năm ("còn N tháng", "Sau Tết") —
 * "khi nào" chỉ đọc mức năm (chủ dự án 04/10).
 */
export function khoiMoc(m: MocTinhSan, khuon?: PhanLoai['khuon']): string {
  const { namHieuLuc, thang } = m.thoiGian;
  const dong = [`Năm đang đọc: năm âm ${namHieuLuc} (${canChiCuaNam(namHieuLuc)}).`];
  if (thang) {
    const khoang = khoangDuong(thang.nam, thang.thang, thang.nhuan === 'nhuan');
    dong.push(
      `Tháng đang đọc: tháng ${thang.thang}${thang.nhuan === 'nhuan' ? ' nhuận' : ''} âm${khoang ? ` (khoảng ${khoang} dương lịch)` : ''}.`
    );
    if (thang.duong) {
      dong.push(
        `Người dùng hỏi tháng ${thang.duong.thang}/${thang.duong.nam} DƯƠNG LỊCH; phần lớn tháng đó là tháng ${thang.thang} âm ở trên. Câu mở đầu do hệ thống viết đã giải thích quy đổi — KHÔNG nhắc lại, KHÔNG viết "tháng ${thang.thang} âm"; gọi là "tháng ${thang.trangThai === 'dang' ? 'này' : 'đó'}".`
      );
    }
    if (thang.trangThai === 'da-qua') {
      dong.push('Tháng này ĐÃ QUA. Nói như nhìn lại ("quãng đó…"), không dùng "sẽ", "sắp", "tới đây".');
      dong.push('Câu mở đầu do hệ thống viết đã nêu tháng và năm — "answer" KHÔNG lặp lại tên tháng, năm. Không viết "tháng này", "quãng này".');
    } else if (thang.trangThai === 'dang') {
      dong.push('Đây là tháng hiện tại.');
    } else {
      dong.push(
        `Tháng này CHƯA TỚI: nói như dự báo ("tháng đó dễ…", "khi vào tháng đó…"), KHÔNG dùng "đang", KHÔNG gọi là "tháng này". ` +
          `Đây chính là tháng người dùng hỏi (kể cả khi họ nói "tháng sau", "tháng tới"). Căn cứ của tháng ${thang.thang} đã có trong gói — KHÔNG nói "chưa có căn cứ cho tháng sau / tháng đó".`
      );
    }
  } else {
    dong.push('Câu hỏi không chỉ một tháng cụ thể — không tự nêu tháng nào.');
  }
  if (namHieuLuc === m.bayGio.nam && khuon !== 'D') {
    const con = 12 - m.bayGio.thang;
    dong.push(con > 0 ? `Năm âm ${namHieuLuc} còn ${con} tháng sau tháng hiện tại.` : `Năm âm ${namHieuLuc} đang ở tháng cuối.`);
  }
  if (m.doiDaiVanSauTet && khuon !== 'D') dong.push('Sau Tết, người hỏi bước sang một đại vận mới.');
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
  ngonNgu?: NgonNgu;
  /** Bản lần một và lỗi cứng của nó — chỉ có ở lần viết lại (spec 5.3) */
  vietLai?: { answer: string; loi: LoiCung[] };
}

/** Ghim ngôn ngữ (spec 8.2) — dòng đầu system khi người đọc dùng tiếng Anh */
const GHIM_EN = 'Write `answer` and `suggestedQuestions` entirely in English. Do not use Vietnamese words.';

/** "Viết lại TOÀN BỘ" — không bảo "sửa câu X": model sửa vá thì lỗi trôi sang câu bên cạnh. */
export function khoiVietLai(v: NonNullable<DauVaoPromptFocused['vietLai']>): string {
  const loi = v.loi.map((l) => `- ${l.chiTiet}${l.doan ? ` (quanh đoạn: "${l.doan}")` : ''}`).join('\n');
  const cu = v.answer ? `\nBản trước (để biết chỗ sai, không chép lại):\n"${v.answer}"` : '';
  return `Viết lại TOÀN BỘ câu trả lời. Lỗi:\n${loi}${cu}`;
}

export function dungPromptFocused(v: DauVaoPromptFocused): { system: string; user: string } {
  const bc = chonBoiCanhHoiThoai(v.cauHoiGoc, v.lichSu, v.laTiepTuChip);
  const phan: string[] = [dungKhoiChoPrompt({ ...v.goi, cauHoi: v.cauHoiGoc })];

  const nghieng = khoiNghiengFocused(v.nghieng, v.goi, v.phanLoai.khuon);
  if (nghieng) phan.push(nghieng);
  phan.push(khoiMoc(v.moc, v.phanLoai.khuon));
  // N1: hỏi một tháng thì phải có câu dựa trên lớp tháng (eval 03/10: một ca chỉ dẫn sao gốc).
  const maThang = v.goi.duKien.filter((d) => d.loai === 'nguyet-han').map((d) => d.id);
  if (v.moc.thoiGian.thang && maThang.length) {
    phan.push(
      `Câu hỏi về MỘT tháng: ít nhất một claim phải dẫn dữ kiện của tháng đang đọc (${maThang.join(', ')}). ` +
        'Phần đó nói sao ở cung tháng làm phần ĐANG HỎI thuận hay vướng hơn trong tháng; KHÔNG mượn nghĩa của tên cung đó ' +
        '(cha mẹ, nhà cửa, anh em…) để suy sang phần đang hỏi.'
    );
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
  if (v.vietLai) dan.push(khoiVietLai(v.vietLai));
  phan.push(dan.filter(Boolean).join('\n'));

  return {
    system: v.ngonNgu === 'en' ? `${GHIM_EN}\n\n${SYSTEM_FOCUSED}` : SYSTEM_FOCUSED,
    user: `${phan.join('\n\n')}\n\nCÂU HỎI HIỆN TẠI\n${v.cauHoiGoc}`,
  };
}
