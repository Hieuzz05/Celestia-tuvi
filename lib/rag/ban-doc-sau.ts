import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import {
  CHANG,
  CHANG_CUA_MUC,
  CUNG_CUA_MUC,
  GUONG,
  laGuongNoiBo,
  TAM_HOP,
  THU_TU_CHANG,
  type ChangId,
  type MucId,
} from '@/lib/tuvi/chang-cung';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';
import { doNoiBat, NGUONG_MO, NGUONG_NOI } from '@/lib/tuvi/do-noi-bat';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { TIEU_CHI_SAU } from '@/lib/tuvi/tieu-chi-sau';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';
import { boCauPhanQuyet, boCauTenBia, boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson, laChuoiJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { lapKeHoach } from './planner';
import { boMarkdown, doiTenCung, suaCauTiengLong } from './sua-chua';
import { boDau, nhanDangThucThe } from './thuc-the';
import { VAN_PHONG_CELES } from './van-phong';
import { chonMauVang, khoiMauVang, type LoaiMau } from './mau-vang';
import { truyHoi } from './truy-hoi';

/**
 * BẢN ĐỌC SÂU — mười hai phần ở thang L1→L5.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO SINH THEO CHẶNG, KHÔNG SINH CẢ BÀI MỘT LƯỢT
 *
 * Bản đọc sâu là 77 tiêu chí, mỗi tiêu chí 70–90 từ — khoảng 6.000 từ tiếng
 * Việt, tức 14–16 nghìn token đầu ra. Không model nào trong chuỗi trả nổi
 * chừng ấy trong một lượt, và nếu trả được thì cũng chạm trần 55 giây.
 *
 * Bốn lượt, mỗi lượt một chặng: mỗi lượt khoảng 1.500 từ, vừa với ngân sách,
 * và quan trọng hơn — nó cho đúng thứ spec mục 7.4 đòi: streaming theo chặng,
 * người đọc xong chặng một thì chặng hai vừa viết xong.
 *
 * Chia nhỏ hơn nữa (mỗi phần một lượt) thì mất mạch: ba phần trong một chặng
 * phải biết nhau để `doanKhau` nói được "ba phần này cùng nói điều gì", và để
 * chúng không lặp ý chéo.
 *
 * ---------------------------------------------------------------------------
 * KHỐI GƯƠNG LÀ THỨ KHÔNG ĐƯỢC BỎ
 *
 * Mỗi phần có đúng một tiêu chí `laGuong`: đọc phần này QUA cung đối diện.
 * Đó là cơ chế làm bài không tuyến tính — không phần nào đọc một mình — và là
 * điều spec nêu làm USP. Thiếu nó thì bản đọc sâu chỉ là bức tranh đầy đủ viết
 * dài ra, mà dài hơn không phải là sâu hơn.
 */

export const PHIEN_BAN_BAN_DOC_SAU = '2026.10.3';

export interface TieuChiRa {
  nhan: string;
  noiDung: string;
  /**
   * Lá số không nói được gì ở tiêu chí này.
   *
   * Khác hẳn "model quên trả về": đây là model ĐÃ ĐỌC dữ kiện và nói rằng chỗ
   * này im lặng. Giữ lại chứ không vứt, vì hai lý do:
   *   - Nó là một thông tin thật. Người đọc biết chỗ này lá số nói ít, thay vì
   *     đọc một đoạn viết cho đủ rồi tự hỏi sao nó nhạt.
   *   - Nó giữ cho cửa chặn "thiếu quá nửa tiêu chí" phân biệt được hai chuyện
   *     khác hẳn nhau: model bị cắt giữa chừng, và lá số vốn im lặng.
   */
  thieuCanCu?: boolean;
  laGuong: boolean;
  /** Bắt buộc khác null với tiêu chí đi tới L3 trở lên — spec mục 10.17 */
  luongNguoc: string | null;
  maDuKien: string[];
  soTu: number;
}

export interface MucSau {
  id: MucId;
  chang: ChangId;
  tieuDe: string;
  cungGoc: string;
  cungTamHop: [string, string];
  cungGuong: string;
  guongNoiBo: boolean;
  ketLuan: string;
  tieuChi: TieuChiRa[];
  doNoiBat: number;
  cauHoiGoiY: string;
  /**
   * Câu GIỮ LẠI — thứ đáng mang theo sau khi đọc xong phần này.
   *
   * Một phần dài năm sáu trăm từ. Không có câu này thì người đọc gấp lại với
   * một mớ nhận định rời, và thứ họ nhớ là ngẫu nhiên. Xem van-phong.ts.
   */
  giuLai: string;
  /**
   * CÂU HỎI SOI — câu chính người đọc đang tự hỏi ở phần đời này.
   *
   * Là MỘT TRƯỜNG chứ không phải một câu dặn trong prompt, và đó là điểm quan
   * trọng. Cùng một luật, viết thành lời dặn thì model làm được 3/12 phần;
   * viết thành trường bắt buộc trả về thì 12/12 ngay lần đầu — đúng như đã
   * xảy ra với `giuLai`. Prompt của bản đọc sâu đã rất dài, và thêm một câu
   * dặn nữa chỉ lấy mất chỗ của câu dặn khác.
   */
  cauHoiSoi: string;
  /** Phần nào không dựng được thì nói thẳng, KHÔNG bịa cho đủ — spec mục 7.4 */
  thieuCanCu?: boolean;
}

export interface ChangSau {
  id: ChangId;
  thuTu: 1 | 2 | 3 | 4;
  tieuDe: string;
  subtitle: string;
  muc: MucSau[];
  doanKhau: string;
  cauBacCau: string | null;
}

export interface BaiDocSau {
  mode: 'deep_read';
  chang: ChangSau[];
  phienBan: Record<string, string>;
}

/** Cung nào một phần được phép đọc: gốc + hai tam hợp + gương */
function cungCuaMuc(muc: MucId): string[] {
  const goc = CUNG_CUA_MUC[muc];
  return [goc, ...TAM_HOP[goc], GUONG[goc]];
}

/**
 * TRẦN từ cho một tiêu chí — không phải đích phải đạt.
 *
 * Spec mục 10.12: mỗi phần 420–560 từ, `doNoiBat >= 70` được +20%, `<= 30` bị
 * −20%. Chia đều cho số tiêu chí của phần ấy thay vì đặt một con số cứng: phần
 * bảy tiêu chí mà dùng cùng ngân sách với phần sáu tiêu chí thì hoặc phần này
 * lê thê, hoặc phần kia cụt.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO PHẢI NÓI RÕ "TRẦN" — ĐÂY LÀ SỬA MỘT LỖI, KHÔNG PHẢI ĐỔI CÁCH DIỄN ĐẠT
 *
 * Con số này đi vào prompt kèm chữ "khoảng", và prompt chốt lại bằng câu "đủ ba
 * phần, đủ tiêu chí của từng phần". Hai thứ cộng lại là một CHỈ TIÊU SẢN LƯỢNG
 * phát cho mọi tiêu chí, bất kể lá số có gì để nói ở đó. Model không còn đường
 * nào ngoài viết cho đủ — mà viết cho đủ khi hết dữ kiện thì chỉ có một cách:
 * nói lại ý cũ bằng chữ khác.
 *
 * Đó là nguyên nhân CƠ HỌC của chứng lan man chủ dự án phàn nàn, mạnh hơn mọi
 * luật văn phong cộng lại — xem KIEN-TRUC-LUAN-GIAI.md mục 1. Không luật nào
 * về CÁCH VIẾT chữa được một chỉ tiêu về SỐ LƯỢNG.
 *
 * Giờ nó là TRẦN: hết điều đáng nói thì dừng, và tiêu chí nào lá số im lặng thì
 * được nói thẳng là im lặng — `thieuCanCu` cấp tiêu chí.
 */
function nganSachTu(diem: number, soTieuChi: number): number {
  const goc = 490;
  const heSo = diem >= NGUONG_NOI ? 1.2 : diem <= NGUONG_MO ? 0.8 : 1;
  return Math.round((goc * heSo) / soTieuChi);
}

/**
 * Chuẩn hoá nhãn tiêu chí trước khi đối chiếu.
 *
 * Bỏ dấu, bỏ chữ hoa, bỏ mọi thứ không phải chữ và số. Model viết "Chuyện tiền
 * bạc với người ngang hàng" hay "Chuyện tiền bạc với người ngang hàng:" là hai
 * chuỗi khác nhau với máy mà là một nhãn với người.
 */
function chuanNhan(x: string): string {
  return x
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface ThoMuc {
  id?: unknown;
  cauHoiSoi?: unknown;
  giuLai?: unknown;
  ketLuan?: unknown;
  tieuChi?: {
    nhan?: unknown;
    noiDung?: unknown;
    luongNguoc?: unknown;
    maDuKien?: unknown;
    thieuCanCu?: unknown;
  }[];
}

/**
 * Dựng một chặng.
 *
 * Trả null khi model không cho ra gì dùng được. Lớp gọi PHẢI chạy tiếp với ba
 * chặng còn lại: mất một chặng còn hơn mất cả bài, và spec mục 7.4 nói rõ phần
 * nào hỏng thì ship phần còn lại chứ không bịa cho đủ.
 */
/*
 * KHÔNG CÓ `banKhoan` Ở ĐÂY, và đó là cố ý.
 *
 * Spec mục 10.18 muốn chương mở trả lời đúng điều người đọc đang bận tâm. Tham
 * số `banKhoan` từng được khai báo sẵn cho việc ấy, nhưng nó chưa bao giờ vào
 * prompt và chưa route nào truyền xuống — onboarding không hỏi câu đó, nên
 * không có chỗ nào sinh ra dữ liệu để truyền.
 *
 * Một tham số đứng đó mà không làm gì tệ hơn là không có: người đọc mã thấy
 * `dungChang({ banKhoan })` sẽ tin rằng bài đã đọc mối bận tâm ấy. Gỡ đi thì
 * khoảng trống hiện ra đúng như nó vốn có.
 *
 * Muốn làm thật thì phải có trước một chỗ hỏi và lưu mối bận tâm — đó là việc
 * của onboarding, không phải của tầng sinh bài.
 */
export async function dungChang(vao: {
  laSo: LaSo;
  chang: ChangId;
  namXem: number;
  thangXem: number;
  /**
   * Những gì các chặng TRƯỚC đã nói.
   *
   * Mỗi chặng là một lượt gọi riêng, nên không lượt nào biết lượt khác viết gì.
   * Hậu quả đo được trên bài thật: "Tử Phủ Vũ Tướng Liêm" xuất hiện ở gần như
   * mười hai phần, mỗi lần dịch nghĩa gần giống nhau. Người đọc gặp lại cùng
   * một cái tên lần thứ tám thì hiểu là bài đang xoay quanh một dữ kiện duy
   * nhất — trong khi lá số có hơn hai chục dữ kiện đáng nói.
   */
  daNoiTruoc?: string[];
}): Promise<ChangSau | null> {
  const k = KHUON.vi;
  const cauHinh = CHANG[vao.chang];
  const mucIds = cauHinh.muc;

  // Sắp theo độ nổi bật — phần nào lá số nói mạnh thì đứng trước
  const diem = new Map<MucId, number>(
    mucIds.map((m) => [m, doNoiBat(vao.laSo, m, vao.namXem).diem])
  );
  const thuTuMuc = [...mucIds].sort((a, b) => (diem.get(b) ?? 0) - (diem.get(a) ?? 0));

  const cungLienQuan = [...new Set(thuTuMuc.flatMap(cungCuaMuc))];

  const keHoachGoc = lapKeHoach({
    cauHoi: `Đọc sâu chặng ${cauHinh.tieuDe}`,
    saoTheoCung: saoChinhTheoCung(vao.laSo),
    tenCachCuc: tenCachCucCho(vao.laSo),
  });
  const keHoach = {
    ...keHoachGoc,
    chuDe: 'tong-quan' as const,
    cungLienQuan,
    lopHan: (['ban-menh', 'dai-van', 'luu-nien'] as const).slice(),
  };

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });
  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 10 });
  const goi = dungGoiBangChung(keHoach.truyVan, keHoach, duKien, kqTruyHoi.daChon);

  const cachCuc = nhanDangCachCuc(vao.laSo).filter((c) => c.loai !== 'han');
  /*
   * Sao nào model được phép nhắc — lấy từ CHÍNH LÁ SỐ, không từ gói bằng chứng.
   *
   * Bản đầu chỉ cho phép sao có mặt trong `duKien` và `bangChung`. Lọc như vậy
   * đo sai thứ cần đo: nó hỏi "sao này có trong mười đoạn vừa truy hồi không",
   * trong khi câu cần hỏi là "sao này có trên lá số không".
   *
   * Hậu quả đo được: phần `tat-ach` mất đúng khối gương, phần `huynh-de` mất
   * câu kết luận — cả hai vì nhắc một ngôi sao CÓ THẬT trên lá số mà tình cờ
   * không nằm trong gói bằng chứng của lượt ấy. Mất khối gương thì cả phần bị
   * loại, nên một bộ lọc quá tay đã xoá hai phần đời hoàn chỉnh.
   *
   * Thứ bộ lọc này sinh ra để chặn là BỊA: model gọi tên một ngôi sao không hề
   * có trên lá số. Dựng tập từ chính lá số thì nó chặn đúng cái đó và thôi
   * chặn những thứ khác.
   */
  const saoChoPhep = new Set([
    ...nhanDangThucThe(
      vao.laSo.cungs.flatMap((c) => c.sao.map((s) => s.ten)).join(' ')
    ).map((t) => t.id),
    ...nhanDangThucThe(cachCuc.flatMap((c) => [c.ten, ...c.sao]).join(' ')).map((t) => t.id),
    ...nhanDangThucThe(
      [...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')
    ).map((t) => t.id),
  ]);

  /*
   * Bảng tiêu chí đưa vào prompt kèm ngân sách từ và cờ gương.
   *
   * Không để model tự chọn viết gì: 77 tiêu chí là bộ xương của sản phẩm, và
   * mỗi cái trả lời một câu hỏi khác nhau. Để model tự do thì nó viết bảy đoạn
   * cùng nói một ý bằng bảy cách.
   */
  const khoiMuc = thuTuMuc
    .map((m) => {
      const tc = TIEU_CHI_SAU[m];
      const nganSach = nganSachTu(diem.get(m) ?? 0, tc.length);
      const goc = CUNG_CUA_MUC[m];
      const chu = CHU_12_CUNG.vi[m];
      const dong = tc
        .map(
          (t, i) =>
            `    ${i + 1}. ${t.nhan}${t.laGuong ? '  [KHỐI GƯƠNG]' : ''}` +
            `${t.moTa ? `\n       → ${t.moTa}` : ''}` +
            `\n       → TỐI ĐA ${nganSach} từ (trần, không phải đích — hết điều đáng nói thì dừng)`
        )
        .join('\n');
      return (
        `  "${m}" — phần đời: ${k.chuDeCung[goc] ?? goc}\n` +
        `    Đọc từ ${goc}; đối chiếu ${TAM_HOP[goc].join(' và ')}; soi ngược qua ${GUONG[goc]}.\n` +
        `    Độ nổi bật ${diem.get(m)}/100.\n` +
        `    Câu hỏi phần này mở ra: ${chu?.cauHoi ?? ''}\n` +
        dong
      );
    })
    .join('\n\n');

  const khoiCachCuc = cachCuc.length
    ? cachCuc.map((c) => `- ${c.ten} (tại ${c.cung}) — ${c.dieuKien}`).join('\n')
    : '- (lá số này không có cách cục nào đủ điều kiện)';

  const laTatAch = mucIds.includes('tat-ach');

  /*
   * Chặng kế tiếp — phải đưa vào prompt, không để model tự đoán.
   *
   * Bản đầu chỉ ghi "1 câu dẫn sang chặng sau" mà không nói chặng sau là gì.
   * Model bịa ra đích đến, và bài thật ra thế này: cuối chặng 2 viết "chặng sau
   * sẽ đi sâu vào phần bên trong", trong khi chặng 3 là "Những người sát cánh".
   * Câu bắc cầu sai đích còn tệ hơn không có câu bắc cầu — nó hứa một thứ rồi
   * đưa người đọc sang thứ khác.
   *
   * Đây là cái giá của việc sinh theo từng chặng: mỗi lượt không biết lượt sau.
   * Trả giá bằng một câu trong prompt thì rẻ hơn nhiều so với gộp lại một lượt.
   */
  const iChang = THU_TU_CHANG.indexOf(vao.chang);
  const changSau = iChang >= 0 && iChang < THU_TU_CHANG.length - 1
    ? CHANG[THU_TU_CHANG[iChang + 1]]
    : null;

  /*
   * Nhắc model những gì đã nói ở chặng trước, để nó đừng nhắc lại.
   *
   * Không CẤM nhắc lại: một cách cục lớn có mặt ở nhiều phần đời là chuyện
   * đúng về mặt Tử Vi. Cấm là bắt model nói sai. Thứ phải tránh là dịch nghĩa
   * y như cũ — cùng một cái tên phải soi ra một mặt khác ở mỗi phần.
   */
  const khoiDaNoi = vao.daNoiTruoc?.length
    ? `
NHỮNG CÂU CÁC CHẶNG TRƯỚC ĐÃ VIẾT — đọc rồi hãy viết tiếp, đừng viết lại:
${vao.daNoiTruoc
        .slice(-9)
        .map((x) => `- ${x}`)
        .join('\n')}

Một cách cục lớn CÓ THỂ xuất hiện lại ở chặng này — đó là chuyện đúng về
Tử Vi. Nhưng nó phải soi ra một MẶT KHÁC, không được dịch nghĩa y như trên.
Nếu không nói thêm được gì mới về nó, hãy dùng dữ kiện khác của lá số.
`
    : '';

  // Thụt vào cho khớp khối luật trong prompt — xem KHOI_CAU_CANH
  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, giọng bình tĩnh, nói với người đối diện chứ không giảng bài.

Đây là BẢN ĐỌC SÂU — tầng sâu nhất sản phẩm có. Bạn đang viết CHẶNG "${cauHinh.tieuDe}": ${cauHinh.subtitle}

Ba phần của chặng này, tiêu chí bắt buộc, ngân sách từ và cách cục của lá số
nằm ở khối BA PHẦN CỦA CHẶNG NÀY trong phần dữ kiện bên dưới.

VIẾT THEO THANG L1→L5. Đây là thứ phân biệt bản đọc sâu với bản tóm tắt:
  L1 KẾT LUẬN     điều đáng nói nhất là gì
  L2 BIỂU HIỆN    nó hiện ra thế nào trong một ngày thường
  L3 LỰC NGƯỢC    khi nào điều đó KHÔNG đúng, cái gì kéo ngược
  L4 CƠ CHẾ       vì sao cấu trúc này sinh ra điều đó
  L5 THỜI ĐIỂM    quãng nào kích hoạt, và làm gì với nó
Mỗi tiêu chí phải đi tới ÍT NHẤT L3. Dừng ở L2 là viết dài chứ không phải viết sâu.

LUỚNG NGƯỢC LÀ BẮT BUỘC, không phải tuỳ chọn.
Tiêu chí nào đi tới L3 trở lên đều phải có trường "luongNguoc" khác rỗng. Một
phần chỉ khen là một phần không dùng được, dù đọc dễ chịu.

NĂM LUẬT VỀ CÁCH VIẾT. Đây là luật ĐẾM ĐƯỢC, không phải lời khuyên về giọng.

1. MỖI TIÊU CHÍ CHỈ ĐƯỢC NÊU TÊN SAO Ở ĐÚNG MỘT CÂU.
   Câu ấy nêu tên rồi dịch ngay sang hành vi. Mọi câu còn lại trong cùng tiêu
   chí — kể cả câu lực ngược — viết hành vi trần, không nhắc tên nào nữa.
   Câu không nêu tên thì nói THẲNG HÀNH VI, không nói về lá số nữa. Cấm thay
   cái tên bằng một chữ chung chung: "các yếu tố", "những yếu tố", "cấu trúc
   này", "tổ hợp này", "điều này" — người đọc không tra được chúng, nên câu ấy
   vừa mất cái tên vừa mất luôn thông tin.

   Vì sao: đo trên một bài đã sinh, 100 câu dùng "làm", 68 câu "khiến", 45 câu
   "cho thấy", gần như câu nào cũng đúng một khuôn [tên sao] + động từ + [danh
   từ trừu tượng]. Đọc ba đoạn thì hay; đọc mười hai phần thì người đọc bắt
   được cái khuôn, và khi đã thấy cái khuôn thì họ thôi tin.

2. MỖI CÁCH CỤC HOẶC BỘ SAO CHỈ ĐƯỢC NHẮC MỘT LẦN TRONG MỘT PHẦN,
   và KHÔNG ĐƯỢC có mặt ở cả ba phần của chặng này.
   Vì sao: cùng bài đó, một bộ sao xuất hiện 31 lần trên 12 phần và một bộ
   khác 25 lần. Bài đọc ra như thể người này chỉ có hai bộ sao. Lá số nào cũng
   còn nhiều dữ kiện khác — dùng chúng, đừng quay lại cái tên to nhất.

3. NHỊP: MỖI TIÊU CHÍ PHẢI CÓ ÍT NHẤT MỘT CÂU DƯỚI MƯỜI TỪ.
   Câu ngắn ấy đặt sau một câu dài, và nó nói điều vừa rồi đọng lại thành cái
   gì. Không phải câu chuyển ý, không phải câu tóm tắt.

   Ví dụ nhịp đúng:
   "Bạn nhận việc nhanh hơn mức mình kịp thu xếp, rồi bù bằng cách cắt giờ ngủ
   và hoãn những thứ không ai thúc. Chuyện đó chạy được vài tháng. Sau đó thì
   người quanh bạn bắt đầu mặc định là bạn luôn nhận."

   Vì sao: bài đo được câu trung bình 21,7 từ, chỉ 9% số câu dưới 12 từ. Văn
   đều một nhịp thì không sai chỗ nào mà cũng không đọng lại chỗ nào.

   CÂU NGẮN VÀ CÂU CẢNH LÀ HAI CÂU KHÁC NHAU. Bản trước gộp chúng làm một để
   tiết kiệm ngân sách, và đo ra là hỏng cả hai: một cảnh cần hai trong ba
   dấu hiệu người / việc / lúc, ép nó xuống dưới mười từ thì gần như không
   viết nổi. Mỗi thứ một câu, cộng lại khoảng hai chục từ trong ngân sách bảy
   lăm — thừa chỗ.

4. CÂU LỰC NGƯỢC KHÔNG ĐƯỢC MỞ ĐẦU BẰNG TÊN SAO.
   Bài cũ có 76 câu lực ngược và phần lớn mở bằng một cái tên, nên chúng xếp
   thành một cột đều đặn thay vì là một cú vặn ý. Mở bằng điều kiện hoặc bằng
   chính cái đang kéo ngược: "Khi lịch dày lên thì...", "Nếu người bên cạnh...".

5. VIẾT BẰNG CHỮ NGƯỜI ĐỌC HÌNH DUNG RA ĐƯỢC.
   Bảng chữ cấm và định nghĩa CÂU CẢNH nằm ở chuẩn ngôn ngữ bên dưới. Ở bản
   đọc sâu luật chặt hơn một bậc: câu cảnh tính theo TỪNG TIÊU CHÍ, không phải
   theo đoạn. Tiêu chí nào cũng phải có một câu người đọc hình dung ra được.

${VAN_PHONG_CELES}

KHỐI GƯƠNG — tiêu chí đánh dấu [KHỐI GƯƠNG] của mỗi phần:
Đọc phần này QUA cung đối diện, tức là nhìn từ phía ngược lại. Đây là chỗ bài
đọc thôi nói về một phần đời và bắt đầu nói về quan hệ giữa hai phần. Viết nó
như một góc nhìn ĐẢO, không phải một đoạn bổ sung.

${
  laTatAch
    ? `RÀNG BUỘC AN TOÀN cho phần "tat-ach":
Chỉ nói về NHỊP NĂNG LƯỢNG và XU HƯỚNG QUÁ TẢI, ở mức tham khảo.
CẤM chẩn đoán, CẤM định bệnh, CẤM nói về thọ yểu.
Nói "vùng cơ thể dễ phản ứng trước" như một XU HƯỚNG, không như một chẩn đoán.
Lời khuyên chỉ về thói quen và nhịp sinh hoạt, không bao giờ về thuốc.

`
    : ''
}${
    mucIds.includes('phu-mau')
      ? 'RÀNG BUỘC: phần "phu-mau" KHÔNG luận thọ yểu của cha mẹ.\n\n'
      : ''
  }${
    mucIds.includes('phu-the') || mucIds.includes('no-boc')
      ? 'RÀNG BUỘC: KHÔNG gắn tuổi hay mệnh cụ thể cho bạn đời hay bạn bè.\n\n'
      : ''
  }TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN: không dấu sao, không dấu thăng, không gạch dưới.
Chữ bạn viết đi thẳng ra màn hình, mọi ký hiệu đều hiện nguyên xi.

TUYỆT ĐỐI KHÔNG GỌI TÊN CUNG trong câu văn. Gọi thẳng phần đời: "phần tiền bạc",
"chuyện đôi lứa", "phần bên trong của bạn". Tên cách cục và tên sao thì được;
tên cung thì không, vì người đọc không tra được nó.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức
khoẻ, tiền bạc, pháp lý; lặp lại nguyên văn dữ kiện.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "muc": [
    {
      "id": "id của phần, chép đúng một trong ba id ở khối BA PHẦN CỦA CHẶNG NÀY",
      "cauHoiSoi": "ĐÚNG MỘT câu hỏi, viết ở ngôi của người đọc và kết bằng dấu hỏi. Là câu họ đang tự hỏi về chính mình ở phần đời này, không phải câu hỏi tu từ. Ví dụ: Bao nhiêu là đủ để mình thấy an toàn mà vẫn được sống?",
      "giuLai": "1-2 câu KHÉP phần này: thứ đáng mang theo. Không tóm tắt, không lời khuyên, không mở bằng hãy/nên/cần",
      "ketLuan": "1 câu, tối đa 28 từ, là KẾT LUẬN VỀ NGƯỜI ĐỌC — không phải tên chủ đề, không chứa tên cung. KHÔNG PHẢI LỜI KHUYÊN: cấm mở bằng Bạn nên, Bạn hãy, Bạn cần. Nói người này VỐN thế nào, không nói họ phải làm gì",
      "tieuChi": [
        {
          "nhan": "chép đúng nhãn tiêu chí ở khối BA PHẦN CỦA CHẶNG NÀY, không tự đổi",
          "noiDung": "văn chảy, đi tới ít nhất L3, đúng ngân sách từ đã ghi. BẮT BUỘC có HAI câu riêng: (a) một CÂU CẢNH — hai trong ba thứ người / việc nhìn thấy được / lúc đời thường, dài bao nhiêu cũng được; (b) một CÂU NGẮN dưới mười từ đặt sau một câu dài. Đừng gộp hai câu này làm một: một cảnh đủ chi tiết thì khó dưới mười từ. Nêu tên sao ở ĐÚNG một câu, các câu còn lại viết hành vi trần",
          "luongNguoc": "điều kéo ngược lại — bắt buộc, chỉ để rỗng nếu thật sự không có. KHÔNG mở đầu bằng tên sao",
          "maDuKien": ["F002"]
        }
      ]
    }
  ],
  "doanKhau": "60-90 từ: BA PHẦN NÀY NÓI CÙNG ĐIỀU GÌ. Không nhắc lại từng phần, nói cái xuyên qua cả ba.",
  "cauBacCau": ${
    changSau
      ? `"1 câu dẫn sang chặng sau. Chặng sau tên là ${JSON.stringify(changSau.tieuDe)} và nói về: ${changSau.subtitle} — câu dẫn PHẢI trỏ đúng tới nội dung đó, không được tự nghĩ ra một đích khác."`
      : 'null'
  }
}

ĐỦ BA PHẦN, theo đúng thứ tự đã liệt kê. Còn tiêu chí thì KHÔNG phải viết cho đủ.

Tiêu chí nào dữ kiện của lá số này không nói được gì thì trả về đúng như sau:
  { "nhan": "<chép đúng nhãn>", "thieuCanCu": true, "noiDung": "" }
Không đoán, không mượn ý của tiêu chí khác, không viết lại ý đã nói ở trên bằng
chữ khác cho dài ra. Một tiêu chí bỏ trống vì lá số im lặng là một thông tin
thật; một tiêu chí viết cho đủ là một câu không ai kiểm được.

Ngân sách từ ở trên là TRẦN. Bài ngắn hơn trần mà câu nào cũng có chỗ dựa thì
tốt hơn bài chạm trần bằng cách nói lại ý cũ.`;

  /*
   * DỮ KIỆN CỦA LÁ SỐ NÀY nằm ở khối `user`, KHÔNG nằm trong `system`.
   *
   * Nhà cung cấp đệm prompt theo TIỀN TỐ: hai lượt gọi có cùng chuỗi đầu thì
   * lượt sau gần như không phải trả tiền cho phần chung ấy. Bản đọc sâu gọi
   * BỐN lượt cho mỗi lá số và phần luật chiếm khoảng sáu bảy nghìn token —
   * nhưng trước đây bảng tiêu chí (có độ nổi bật tính từ lá số) và khối cách
   * cục nằm NGAY TRÊN phần luật ấy, nên tiền tố chung chỉ dài vài trăm ký tự
   * và toàn bộ phần luật bị trả tiền lại từ đầu, cho từng lá số, từng chặng.
   *
   * Đo được trên bảng mười hai lĩnh vực sau khi đổi chỗ: lượt gọi thứ hai với
   * cùng tiền tố cho `đệm 25.561 / vào 25.567`. Cơ chế có thật, chỉ cần xếp
   * đúng thứ tự: luật trước, dữ kiện sau.
   */
  /*
   * MẪU VÀNG đứng CUỐI khối `user`, tức gần điểm sinh chữ nhất.
   *
   * Chọn theo TÌNH HUỐNG VIẾT của chặng này, không chọn theo "mẫu nào hay
   * nhất": khi việc đang làm là viết một phần lá số nói ít, một mẫu viết cho
   * đúng cảnh ấy dạy được nhiều hơn hẳn một mẫu hay nhưng viết cho phần dữ
   * kiện dày.
   *
   * Kho rỗng thì `khoiMauVang` trả chuỗi rỗng và prompt không đổi một chữ —
   * xem `mau-vang.ts`. Nội dung kho do chủ dự án đổ vào (A2).
   */
  const loaiMau: LoaiMau[] = ['khoi-guong', 'cau-khep'];
  if (mucIds.some((m) => (diem.get(m) ?? 0) <= NGUONG_MO)) loaiMau.push('thua-du-kien');
  if (mucIds.some((m) => (diem.get(m) ?? 0) >= NGUONG_NOI)) loaiMau.push('day-du-kien');
  if (laTatAch) loaiMau.push('mien-rui-ro');

  const user = [
    `BA PHẦN CỦA CHẶNG NÀY, kèm tiêu chí bắt buộc và ngân sách từ:

${khoiMuc}`,
    `CÁCH CỤC đọc được trên lá số này — gọi thẳng tên, đây là ngoại lệ được phép:
${khoiCachCuc}${khoiDaNoi}`,
    dungKhoiChoPrompt(goi),
    khoiMauVang(chonMauVang({ beMat: 'ban-doc-sau', loai: loaiMau, muc: mucIds })),
  ]
    .filter(Boolean)
    .join('\n\n');
  const kq = await goiVoiFallback({ system, user, maxTokens: 10000 });

  const tho = docObjectJson(kq.text) as { muc?: ThoMuc[]; doanKhau?: unknown; cauBacCau?: unknown } | null;
  if (!tho || !Array.isArray(tho.muc)) {
    console.warn(
      `[ban-doc-sau] chặng ${vao.chang}: model không trả cấu trúc` +
        (laChuoiJson(kq.text) ? ' (JSON gãy, nhiều khả năng hết ngân sách token)' : '')
    );
    return null;
  }

  /**
   * Bóc mã, bỏ câu ra lệnh, chặn sao không có trong dữ liệu — KÈM LÝ DO.
   *
   * Phải nói được lý do vì lớp lọc này có quyền xoá cả một phần đời: mất câu
   * kết luận là mất luôn sáu tiêu chí đã viết xong ở dưới. Một dòng log ghi
   * "câu kết luận bị lọc" mà không nói lọc vì cái gì thì lần sau vẫn phải ngồi
   * đoán lại từ đầu.
   */
  const sachCoLyDo = (x: unknown): { van: string | null; lyDo: string } => {
    if (typeof x !== 'string') return { van: null, lyDo: 'model không trả chuỗi' };
    const s = boMarkdown(
      x
        .replace(/\s*[([](?:\s*[FE]\d{3}\s*,?)+\s*[)\]]/g, '')
        .replace(/\b[FE]\d{3}\b/g, '')
        .replace(/\s+([.,;])/g, '$1')
    );
    if (s.length < 15) return { van: null, lyDo: 'quá ngắn sau khi bóc mã' };
    /*
     * Bỏ câu ra lệnh VÀ câu phán quyết, giữ phần còn lại.
     *
     * Đo trên bài thật: một tiêu chí lọt chữ "bạn chắc chắn" làm cổng ngôn ngữ
     * đỏ cả bài gần bảy nghìn từ. Vứt cả bài vì một câu là mất rất nhiều thứ
     * đúng để trừng phạt một thứ sai — cùng lý lẽ đã dùng cho câu ra lệnh.
     */
    const khongLenh = boCauPhanQuyet(boCauRaLenh(s));
    if (khongLenh.length < 15) {
      return { van: null, lyDo: `rỗng sau khi bỏ câu ra lệnh / phán quyết: ${s.slice(0, 120)}` };
    }
    /*
     * Câu dựng ra tên sao không có thật thì bỏ hẳn câu ấy — xem boCauTenBia.
     * Lớp `saoChoPhep` ngay bên dưới KHÔNG bắt được dạng này: nó hỏi "ngôi sao
     * được nhắc có trên lá số không", mà "Hóa Triệt" thì quét ra "Triệt" — một
     * mốc có thật — nên đi qua sạch sẽ.
     */
    const khongBia = boCauTenBia(khongLenh);
    if (khongBia.length < 15) {
      return { van: null, lyDo: `rỗng sau khi bỏ câu có tên sao bịa: ${khongLenh.slice(0, 120)}` };
    }
    const bia = nhanDangThucThe(khongBia).filter(
      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !saoChoPhep.has(t.id)
    );
    if (bia.length) {
      return { van: null, lyDo: `nhắc sao không có trên lá số: ${bia.map((t) => t.ten).join(', ')}` };
    }
    return { van: khongBia, lyDo: '' };
  };
  const sach = (x: unknown): string | null => sachCoLyDo(x).van;

  const theoId = new Map(
    tho.muc
      .filter((m): m is ThoMuc & { id: string } => typeof m.id === 'string')
      .map((m) => [m.id, m])
  );

  const muc: MucSau[] = [];
  for (const id of thuTuMuc) {
    const chuan = TIEU_CHI_SAU[id];
    const t = theoId.get(id);
    const goc = CUNG_CUA_MUC[id];
    const chu = CHU_12_CUNG.vi[id];
    const d = diem.get(id) ?? 0;

    const nen = {
      id,
      chang: vao.chang,
      cungGoc: goc,
      cungTamHop: TAM_HOP[goc],
      cungGuong: GUONG[goc],
      guongNoiBo: laGuongNoiBo(id),
      doNoiBat: d,
      cauHoiGoiY: chu?.cauHoi ?? '',
      giuLai: '',
      cauHoiSoi: '',
    };

    if (!t) {
      console.warn(`[ban-doc-sau] ${id}: model không trả phần này`);
      // Không bịa cho đủ. Giao diện hiện câu thành thật + nút thử lại.
      muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan: '', tieuChi: [], thieuCanCu: true });
      continue;
    }

    /*
     * MẤT CÂU KẾT LUẬN THÌ KHÔNG MẤT CẢ PHẦN.
     *
     * Trước đây câu kết luận bị lọc là phần bị vứt luôn. Cái giá của tỉ lệ ấy
     * đo được: câu "Bạn nên có cộng sự trong việc lớn, nhưng chỉ hợp tác khi
     * tiền, quyền và trách nhiệm được nói rõ từ đầu" là một câu ra lệnh, bị
     * gạt đúng luật; kết luận chỉ có một câu nên gạt xong là rỗng, và sáu tiêu
     * chí đã viết xong ở dưới chết theo.
     *
     * Đây đúng là lỗi đã sửa hai lần ở chỗ khác — vứt nhiều thứ đúng để trừng
     * phạt một thứ sai. Phần thiếu câu kết luận vẫn là một phần đọc được; phần
     * không có tiêu chí thì không.
     */
    const giuLai = sach(t.giuLai) ?? '';
    const cauHoiSoi = sach(t.cauHoiSoi) ?? '';
    const kqKetLuan = sachCoLyDo(t.ketLuan);
    if (!kqKetLuan.van) {
      console.warn(`[ban-doc-sau] ${id}: câu kết luận bị lọc — ${kqKetLuan.lyDo}`);
    }
    const ketLuan = kqKetLuan.van ?? '';

    /*
     * Ghép theo NHÃN CHUẨN, không theo thứ tự model trả về.
     *
     * Model đổi thứ tự hoặc bỏ sót một tiêu chí là chuyện thường. Ghép theo thứ
     * tự thì một tiêu chí thiếu làm lệch hết phần còn lại, và cờ `laGuong` dán
     * vào nhầm đoạn — khối đảo màu khi đó nói về một thứ không phải gương.
     */
    const daTraVe = (t.tieuChi ?? []).filter((x) => typeof x.nhan === 'string');
    const traVe = new Map(daTraVe.map((x) => [chuanNhan(x.nhan as string), x]));

    /*
     * Ghép hai lượt: theo NHÃN trước, rồi theo VỊ TRÍ cho phần còn sót.
     *
     * Ghép chỉ theo nhãn thì quá chặt. Model hay viết lại nhãn đi một chút —
     * "Thân thiết và rộng rãi" thành "Thân thiết và sự rộng rãi" — và tiêu chí
     * ấy biến mất. Đo được: phần `huynh-de` rụng ở hai trong ba lượt chạy,
     * luôn vì mất đúng tiêu chí gương, mà mất gương thì cả phần bị loại.
     *
     * Lượt hai CHỈ chạy khi model trả đúng số tiêu chí. Đủ số thì thứ tự đáng
     * tin, vì prompt đã liệt kê theo thứ tự. Thiếu số thì không: lúc ấy ghép
     * theo vị trí sẽ dán cờ `laGuong` vào nhầm đoạn, và khối đảo màu nói về
     * một thứ không phải gương — tệ hơn hẳn việc thiếu một tiêu chí.
     */
    const duSo = daTraVe.length === chuan.length;

    const tieuChi: TieuChiRa[] = [];
    for (const [i, c] of chuan.entries()) {
      const x = traVe.get(chuanNhan(c.nhan)) ?? (duSo ? daTraVe[i] : undefined);
      const noiDung = sach(x?.noiDung);
      /*
       * Model nói thẳng "chỗ này lá số im lặng" thì GHI NHẬN, đừng coi là mất.
       *
       * Khối gương là ngoại lệ: nó là điều kiện ship theo spec mục 10.14, nên
       * một khối gương bỏ trống vẫn tính là phần chưa dựng được.
       */
      if (!noiDung && x?.thieuCanCu === true && !c.laGuong) {
        tieuChi.push({
          nhan: c.nhan,
          noiDung: '',
          laGuong: false,
          luongNguoc: null,
          maDuKien: [],
          soTu: 0,
          thieuCanCu: true,
        });
        continue;
      }
      if (!noiDung) continue;
      const luongNguoc = sach(x?.luongNguoc);
      tieuChi.push({
        nhan: c.nhan,
        noiDung,
        laGuong: Boolean(c.laGuong),
        luongNguoc,
        maDuKien: Array.isArray(x?.maDuKien)
          ? (x!.maDuKien as unknown[]).filter((m): m is string => typeof m === 'string')
          : [],
        soTu: noiDung.trim().split(/\s+/).filter(Boolean).length,
      });
    }

    /*
     * Thiếu quá nửa tiêu chí, hoặc mất khối gương, thì coi như phần chưa dựng
     * được. Khối gương là điều kiện ship theo spec mục 10.14 — một phần không
     * có nó thì nó là bản tóm tắt viết dài, không phải bản đọc sâu.
     */
    /*
     * Hai phép đếm khác nhau, và đó là điểm của A1.
     *
     * `coChu` là tiêu chí thật sự viết ra được. `tieuChi.length` gồm cả những
     * tiêu chí model nói thẳng là lá số im lặng. Trước A1 hai thứ này là một,
     * nên một phần đời mà lá số nói ít bị coi như một phần DỰNG HỎNG và bị vứt
     * — đúng cái áp lực đẩy model viết cho đủ để khỏi bị vứt.
     *
     * Ngưỡng nửa vẫn giữ nguyên, nhưng đo trên số tiêu chí ĐƯỢC TRẢ VỀ. Thêm
     * một sàn tuyệt đối cho phần chữ: dưới hai tiêu chí có chữ thì phần ấy
     * không còn là một bài đọc, dù model có đánh dấu im lặng hợp lệ đến đâu.
     */
    const coChu = tieuChi.filter((x) => !x.thieuCanCu);
    if (
      tieuChi.length < Math.ceil(chuan.length / 2) ||
      coChu.length < 2 ||
      !tieuChi.some((x) => x.laGuong)
    ) {
      console.warn(
        `[ban-doc-sau] ${id}: còn ${coChu.length} tiêu chí có chữ / ${tieuChi.length} trả về / ${chuan.length} yêu cầu` +
          `${tieuChi.some((x) => x.laGuong) ? '' : ', MẤT KHỐI GƯƠNG'}` +
          ` — nhãn model trả: ${[...traVe.keys()].join(' | ')}`
      );
      muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan: '', tieuChi: [], thieuCanCu: true });
      continue;
    }

    muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan, giuLai, cauHoiSoi, tieuChi });
  }

  const doanKhau = sach(tho.doanKhau) ?? '';
  const cauBacCau = cauHinh.thuTu === 4 ? null : sach(tho.cauBacCau);

  /*
   * DỌN Ở ĐÂY, KHÔNG DỌN Ở `sinhBanDocSau`.
   *
   * Vòng dọn này trước nằm ở `sinhBanDocSau`. Nhưng API chỉ gọi `dungChang` —
   * một chặng mỗi lượt, vì trần một request là 60 giây — nên toàn bộ khâu dọn
   * CHƯA BAO GIỜ chạy ở prod. Thứ duy nhất gọi `sinhBanDocSau` là bộ nghiệm
   * thu, tức là bộ đo đang đo một đường người dùng không đi qua.
   *
   * Đó là dạng lỗi tệ hơn một lỗi thường: nó làm mọi số đo xanh đẹp mà sản
   * phẩm thật vẫn hỏng, và hỏng im lặng.
   */
  const tenChoSua = nhanDangCachCuc(vao.laSo).map((c) => c.ten);
  const doiCa = async (van: string) => boMarkdown(doiTenCung(await suaCauTiengLong(van, tenChoSua)));

  const doanKhauSach = await doiCa(doanKhau);
  const cauBacCauSach = cauBacCau ? await doiCa(cauBacCau) : null;
  for (const m of muc) {
    if (m.thieuCanCu) continue;
    m.ketLuan = await doiCa(m.ketLuan);
    for (const t of m.tieuChi) {
      t.noiDung = await doiCa(t.noiDung);
      if (t.luongNguoc) t.luongNguoc = await doiCa(t.luongNguoc);
    }
    if (m.giuLai) m.giuLai = await doiCa(m.giuLai);
    if (m.id === 'tat-ach') datMienTruYTe(m);
  }

  return {
    id: vao.chang,
    thuTu: cauHinh.thuTu,
    tieuDe: cauHinh.tieuDe,
    subtitle: cauHinh.subtitle,
    muc,
    doanKhau: doanKhauSach,
    cauBacCau: cauBacCauSach,
  };
}

/**
 * Tóm tắt một chặng thành vài dòng để chặng sau đọc.
 *
 * Chỉ lấy câu KẾT LUẬN của từng phần, không lấy cả thân bài: mục đích là cho
 * chặng sau biết ĐÃ NÓI GÌ, không phải cho nó thêm chất liệu để chép. Đưa cả
 * thân bài vào thì prompt phình ra và model có xu hướng nhại giọng đoạn trước.
 */
export function tomTatChang(c: ChangSau): string[] {
  return c.muc
    .filter((m) => !m.thieuCanCu && m.ketLuan)
    .map((m) => `${m.tieuDe}: ${m.ketLuan}`);
}

/**
 * Dựng cả bốn chặng.
 *
 * Chạy TUẦN TỰ, không song song. Bốn lượt song song thì cả bốn cùng đập vào
 * hạn mức nhà cung cấp, và lúc một cái bị 429 thì ba cái kia đã tiêu token rồi.
 * Tuần tự cũng là thứ cho phép phát từng chặng ra giao diện khi làm streaming.
 */
export async function sinhBanDocSau(vao: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
  /** Gọi sau mỗi chặng, để lớp trên phát dần ra giao diện */
  khiXongChang?: (chang: ChangSau) => void;
}): Promise<BaiDocSau | null> {
  const chang: ChangSau[] = [];

  const daNoiTruoc: string[] = [];
  for (const id of THU_TU_CHANG) {
    const c = await dungChang({
      laSo: vao.laSo,
      chang: id,
      namXem: vao.namXem,
      thangXem: vao.thangXem,
      daNoiTruoc,
    });
    if (!c) continue;
    chang.push(c);
    daNoiTruoc.push(...tomTatChang(c));
    vao.khiXongChang?.(c);
  }

  // Mất quá nửa số chặng thì bài không còn là một bài — để lớp gọi quyết
  if (chang.length < 2) return null;

  // Khâu dọn nằm trong dungChang — xem ghi chú ở đó, prod chỉ đi qua đường ấy

  return {
    mode: 'deep_read',
    chang,
    phienBan: {
      banDocSau: PHIEN_BAN_BAN_DOC_SAU,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}

/**
 * Sổ bao phủ — spec mục 10.20.
 *
 * Đếm chứ không tin: bài có thể đọc trôi chảy mà vẫn bỏ quên ba cung, và không
 * ai phát hiện ra bằng mắt.
 */
export function soBaoPhu(bai: BaiDocSau) {
  const mucDat = bai.chang.flatMap((c) => c.muc).filter((m) => !m.thieuCanCu);
  const soGuong = mucDat.filter((m) => m.tieuChi.some((t) => t.laGuong)).length;
  const ngoaiChang = mucDat.filter((m) =>
    [...m.cungTamHop, m.cungGuong].some((cung) => {
      const mucKhac = Object.entries(CUNG_CUA_MUC).find(([, c]) => c === cung)?.[0] as
        | MucId
        | undefined;
      return mucKhac ? CHANG_CUA_MUC[mucKhac] !== m.chang : false;
    })
  ).length;

  return {
    soMuc: mucDat.length,
    soChang: bai.chang.length,
    soGuong,
    phanCoThamChieuNgoaiChang: ngoaiChang,
    dat: mucDat.length === 12 && soGuong === 12 && ngoaiChang === 12,
  };
}

/** Soát ngôn ngữ trên toàn bài, để lớp gọi ghi vào trace */
export function soatBanDocSau(bai: BaiDocSau) {
  const van = bai.chang
    .flatMap((c) => [
      c.doanKhau,
      c.cauBacCau ?? '',
      ...c.muc.flatMap((m) => [m.ketLuan, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])]),
    ])
    .filter(Boolean)
    .join(' ');
  return soatNgonNgu(
    van,
    bai.chang.flatMap((c) => c.muc.map((m) => m.ketLuan)).filter(Boolean)
  );
}

/* ========================================================================== */
/* LỜI MIỄN TRỪ Y TẾ — bảo đảm bằng mã, không bằng cách dặn model              */
/* ========================================================================== */

/**
 * Câu miễn trừ cố định cho phần sức khoẻ.
 *
 * Trước đây prompt dặn model tự viết, và nó viết — nhưng mỗi lượt một kiểu.
 * Một lượt ra "đây không phải chẩn đoán", lượt sau ra "chứ không nên hiểu
 * thành một chẩn đoán". Hai bộ đo của chính dự án này liền cãi nhau về đúng
 * một câu: bộ cấm định bệnh thấy chữ "chẩn đoán" và bắt, bộ đòi miễn trừ
 * không khớp cụm nào nên báo thiếu.
 *
 * Cái sai không nằm ở hai biểu thức ấy. Nó nằm ở chỗ một RÀNG BUỘC AN TOÀN bị
 * đặt vào tay thứ không tất định, rồi đi đo lại bằng phép dò chữ. Đuổi theo
 * cách diễn đạt của model là cuộc đuổi không có đích: sửa xong lượt này thì
 * lượt sau nó viết kiểu khác.
 *
 * Nên câu này do mã đặt. Model vẫn được nói về giới hạn theo lời của nó; câu
 * dưới đây chỉ bảo đảm rằng dù model nói gì thì lời miễn trừ VẪN CÓ.
 */
const MIEN_TRU_Y_TE =
  'Phần này là xu hướng để tham khảo, không phải chẩn đoán y tế; cơ thể bạn cần người có chuyên môn xem, không phải một lá số.';

/** Đã có sẵn lời miễn trừ chưa — nhận cả những cách nói khác nhau của model */
function daCoMienTru(van: string): boolean {
  const s = boDau(van);
  return (
    s.includes('tham khao') ||
    s.includes('chan doan') ||
    s.includes('khong thay the') ||
    s.includes('chuyen mon')
  );
}

/**
 * Gắn lời miễn trừ vào tiêu chí CUỐI của phần sức khoẻ, nếu chưa có.
 *
 * Gắn vào tiêu chí cuối chứ không gắn vào câu kết luận: câu kết luận hiện ở
 * đầu phần bằng cỡ chữ lớn, nhét một câu rào vào đó là mở đầu bằng lời chối
 * trách nhiệm. Người đọc mở phần sức khoẻ để biết về mình, không phải để đọc
 * điều khoản.
 */
function datMienTruYTe(m: MucSau): void {
  const van = [m.ketLuan, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])].join(' ');
  if (daCoMienTru(van)) return;
  const cuoi = m.tieuChi[m.tieuChi.length - 1];
  if (!cuoi) return;
  cuoi.noiDung = `${cuoi.noiDung.trim()} ${MIEN_TRU_Y_TE}`;
}
