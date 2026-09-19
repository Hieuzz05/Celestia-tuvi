import { goiVoiFallback } from '@/lib/ai/fallback';
import { goiModel } from '@/lib/ai/providers';
import type { ProviderId } from '@/lib/ai/types';
import type { LaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';
import type { MucId } from '@/lib/tuvi/chang-cung';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';
import { boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { doiTenCung, suaCauKeSao, suaCauTiengLong } from './sua-chua';
import { lapKeHoach } from './planner';
import { boDau, nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';

/**
 * Bảng luận giải 8 lĩnh vực của trang Lá số, do model viết.
 *
 * Bản trước là chữ tất định: mỗi dữ kiện một câu, ghép theo một thứ tự cố định.
 * Viết lại khuôn câu làm nó đỡ lộ bộ xương, nhưng không đổi được bản chất — tám
 * khối vẫn là tám lần chạy cùng một hàm, nên vẫn cùng một hình.
 *
 * §11.2 của khung luận đòi đúng thứ mà template không làm được: "Không để 8
 * domain thành 8 template giống nhau. Thứ tự và độ dài có thể khác dựa trên mức
 * độ nổi bật của domain." Độ nổi bật là một phán đoán, không phải một phép đếm.
 *
 * MỘT lượt gọi cho cả tám lĩnh vực, không phải tám lượt.
 *
 * Tám lượt cho một lần mở trang là hỏng ở ba mặt cùng lúc: cạn hạn mức ngày sau
 * hai người dùng, tám lần trả tiền cho cùng một lá số, và tám bài không biết
 * nhau nên lặp ý chéo. Một lượt thì model nhìn cả tám cùng lúc và tự phân bổ
 * được chỗ nào đáng nói dài.
 *
 * Căn cứ ("Muốn biết vì sao không?") KHÔNG lấy từ model: nó vẫn do engine tất
 * định dựng từ cung và sao. Model viết nhận định, luật giữ phần chứng minh.
 */

/**
 * Bản của bộ luật viết bài.
 *
 * ĐỔI SỐ NÀY mỗi khi sửa prompt, schema đầu ra, hay lớp lọc — nó nằm trong khoá
 * đệm, nên đổi nó là cách duy nhất để bản mới tới được người đã sinh bài. Không
 * đổi thì người dùng cũ đọc bản cũ vĩnh viễn và không ai biết.
 */
export const PHIEN_BAN_BANG_LINH_VUC = '2026.09.2';

/** Cung cần có mặt trong dữ kiện để tám lĩnh vực đều có cái mà đọc */
const CUNG_CAN_CO = [
  'Mệnh',
  'Quan Lộc',
  'Tài Bạch',
  'Phu Thê',
  'Phụ Mẫu',
  'Nô Bộc',
  'Phúc Đức',
  'Thiên Di',
];

/**
 * Nhãn mười hai phần, lấy thẳng từ kho chữ của bài luận.
 *
 * Viết lại ở đây là chắc chắn lệch: thêm một phần ở `chu-12-cung.ts` mà quên
 * bảng này thì model không bao giờ được yêu cầu viết phần ấy, và không lỗi nào
 * báo ra — chỉ là bài thiếu một khối.
 */
const NHAN_LINH_VUC: Record<MucId, string> = Object.fromEntries(
  Object.entries(CHU_12_CUNG.vi).map(([id, c]) => [id, c.nhan])
) as Record<MucId, string>;

export interface KhoiAi {
  id: MucId;
  ketLuan: string;
  doan: string[];
}

interface ThoKhoi {
  id?: unknown;
  ketLuan?: unknown;
  doan?: unknown;
}

/** Tên chính tinh đang đóng ở Mệnh và Thân — dùng làm chất liệu cho lớp sửa */
function chinhTinhNoiBat(laSo: LaSo): string[] {
  const ra = new Set<string>();
  for (const i of [laSo.menhIndex, laSo.thanIndex]) {
    for (const s of laSo.cungs[i]?.sao ?? []) {
      if (s.loai === 'chinh-tinh' || s.loai === 'tu-hoa') ra.add(s.ten);
    }
  }
  return [...ra];
}

export async function sinhBangLinhVuc(vao: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
  /**
   * Ép đúng một model, bỏ qua chuỗi fallback.
   *
   * CHỈ dùng cho bộ so model chạy tay. Đường chạy thật không truyền tham số
   * này: ép một model ở production là bỏ luôn lưới an toàn, và lúc model ấy
   * hỏng thì bảng luận giải chết hẳn thay vì lùi sang model kế tiếp.
   */
  epModel?: { provider: ProviderId; model: string; apiKey: string; mucSuyNghi?: 'low' | 'medium' | 'high' };
}): Promise<{
  noiDung: KhoiAi[];
  provider: string;
  model: string;
  phienBan: Record<string, string>;
} | null> {
  const cauHoi = 'Đọc toàn bộ lá số theo mười hai phần đời';
  const keHoachGoc = lapKeHoach({
    cauHoi,
    saoTheoCung: saoChinhTheoCung(vao.laSo),
    tenCachCuc: tenCachCucCho(vao.laSo),
  });
  const keHoach = {
    ...keHoachGoc,
    chuDe: 'tong-quan' as const,
    cungLienQuan: [...new Set([...CUNG_CAN_CO, ...keHoachGoc.cungLienQuan])],
    lopHan: (['ban-menh', 'dai-van', 'luu-nien'] as const).slice(),
  };

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });
  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 8 });
  const goi = dungGoiBangChung(cauHoi, keHoach, duKien, kqTruyHoi.daChon);

  /*
   * Sao nào model được phép nhắc tới.
   *
   * Phải gồm cả sao THÀNH VIÊN của các cách cục có trên lá số. Không có chúng
   * thì mọi câu nêu tên cách cục đều bị `sach()` trả null và biến mất — vì
   * "Tử Phủ Vũ Tướng Liêm" bung ra năm tên sao, mà năm tên ấy chưa chắc có
   * trong tám đoạn bằng chứng được chọn. Bài còn lại toàn câu chung chung, và
   * không ai biết vì sao.
   */
  const saoChoPhep = new Set([
    ...nhanDangThucThe(
      [...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')
    ).map((t) => t.id),
    ...nhanDangThucThe(
      nhanDangCachCuc(vao.laSo)
        .flatMap((c) => [c.ten, ...c.sao])
        .join(' ')
    ).map((t) => t.id),
  ]);

  const danhSach = (Object.keys(NHAN_LINH_VUC) as MucId[])
    .map((id) => `  "${id}": ${NHAN_LINH_VUC[id]}`)
    .join('\n');

  /*
   * CÁCH CỤC đưa thẳng vào prompt, kèm điều kiện đã thoả.
   *
   * `tenCachCucCho` có được truyền vào planner, nhưng planner chỉ dùng nó để
   * TRUY HỒI tài liệu — tên cách cục không bao giờ tới trước mặt model. Model
   * viết xong cả bài mà chưa từng nhìn thấy chúng.
   *
   * Đúng cơ chế đã đo được ở luồng chat: khi khối gợi ý chỉ có con số, tỉ lệ
   * bài nêu được tên cách cục tụt từ 100% xuống 60%; đưa tên vào thẳng khối thì
   * lên 93%. Model bám vào thứ gần nhất và cụ thể nhất.
   *
   * Và đây đúng là thứ người dùng đòi: bài mẫu họ gửi nêu đích danh Tử Phủ Vũ
   * Tướng Liêm, Thân cư Tài Bạch, Tang Tuế Điếu, Lục Quý Hội Mệnh — rồi dịch
   * từng cái ra hành vi. Không có tên thì không có bài đó.
   */
  const cachCuc = nhanDangCachCuc(vao.laSo).filter((c) => c.loai !== 'han');
  const khoiCachCuc = cachCuc.length
    ? cachCuc.map((c) => `- ${c.ten} (tại ${c.cung}) — ${c.dieuKien}`).join('\n')
    : '- (lá số này không có cách cục nào đủ điều kiện)';

  const thanCu =
    vao.laSo.thanCuCung && vao.laSo.thanCuCung !== 'Mệnh'
      ? `Thân cư ${vao.laSo.thanCuCung} — phần đời này là chỗ người ấy dồn sức về nửa sau cuộc đời, và là thước đo họ tự dùng để biết mình có đang ổn không.`
      : 'Thân cư Mệnh — người này lấy chính mình làm thước đo, ít khi đo bằng một phần đời bên ngoài.';

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, giọng bình tĩnh, nói với người đối diện chứ không giảng bài.

Đây là BỨC TRANH ĐẦY ĐỦ của một lá số: MƯỜI HAI phần đời.
DÙNG ĐÚNG những id dưới đây, không tự nghĩ id mới, không bỏ sót phần nào:
${danhSach}

CÁCH CỤC ĐỌC ĐƯỢC TRÊN LÁ SỐ NÀY — gọi thẳng tên, đây là ngoại lệ được phép:
${khoiCachCuc}
${thanCu}

CÁCH VIẾT — ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA CẢ BẢN HƯỚNG DẪN.

Mỗi lĩnh vực viết theo đúng nhịp ba bước, LẶP LẠI cho từng ý:
  (1) NÊU TÊN cấu trúc — tên cách cục ở trên, hoặc Thân cư, hoặc một tên sao.
      Viết in đậm bằng dấu sao đôi: **Tử Phủ Vũ Tướng Liêm**.
  (2) DỊCH NGAY ra con người — "Điều này cho thấy…", "tạo nên…", "khiến…".
  (3) HẠ XUỐNG ĐỜI SỐNG — nó lộ ra thành hành vi nào, trong tình huống nào.

Đây là hình mẫu bắt buộc, đọc kỹ nhịp của nó:
  "Bạn sở hữu bộ cách **Tử Phủ Vũ Tướng Liêm** kết hợp cùng **Binh Hình Tướng
   Ấn**. Điều này cho thấy bạn mang cốt cách của một người làm chủ, quản lý
   hoặc chỉ huy — thông minh, tầm nhìn sắc bén, toát lên sự uy dũng. Đáng chú
   ý, với đặc điểm **Thân cư Tài Bạch**, bạn là người cực kỳ thực tế: bạn coi
   trọng vật chất và xem đó là thước đo của thành công. Phong cách của bạn là
   'nói ít làm nhiều', hành động quyết liệt, đôi khi theo bản năng nhưng luôn
   hướng thẳng tới mục tiêu."

Ba điều làm đoạn trên khác hẳn một bài luận tầm thường, và bạn phải giữ đủ cả ba:
  · Nó GỌI TÊN. Không có tên thì người đọc không có lý do nào để tin.
  · Mỗi cái tên đều được DỊCH NGAY trong cùng câu hoặc câu kế. Nêu tên mà không
    dịch là kê sao, và người đọc không có chuyên môn Tử Vi sẽ bỏ qua.
  · Nó CHẢY thành văn, không phải các câu rời ghép lại. Câu sau nối vào câu
    trước bằng "Điều này…", "Đáng chú ý…", "Tuy nhiên…", "Chính vì vậy…".

MỖI DẪN CHỨNG PHẢI BỔ TRỢ CHO MỘT Ý CỤ THỂ.
Người đọc không có chuyên môn. Nêu một cấu trúc rồi không nói nó chứng minh
điều gì là bắt họ tự nối — và họ sẽ không nối.
  HỎNG: "Thứ đứng đối diện là Tài Bạch với Tử Vi, và hai bên không hoà nhau
         được: bên nào mạnh lên thì bên kia lùi." — nói để làm gì? chứng minh ý nào?
  ĐƯỢC: "Chỗ này đối diện thẳng với phần tiền bạc, nơi có **Tử Vi** — nghĩa là
         sự yên trong lòng bạn buộc phải đi qua chuyện tiền nong. Khi tài chính
         chông chênh, bạn mất yên nhanh hơn hẳn người khác."

ĐIỀU QUAN TRỌNG NHẤT: MƯỜI HAI PHẦN KHÔNG ĐƯỢC GIỐNG NHAU VỀ HÌNH.
- Lĩnh vực nào lá số nói mạnh thì viết dài và cụ thể. Lĩnh vực nào dữ kiện mỏng thì viết NGẮN, bỏ bớt trường, và nói thẳng là chỗ này lá số nói ít.
- Ít nhất BA phần phải ngắn rõ rệt so với phần còn lại. Mười hai khối dài bằng nhau là mười hai khối sai.
- "matThuan" và "dangCanNhac" được phép bỏ trống khi không có gì đáng nói. Đừng điền cho đủ ô.
- KHÔNG HAI KẾT LUẬN NÀO ĐƯỢC BẮT ĐẦU BẰNG CÙNG BA TỪ. Luật đếm được, không phải lời khuyên.
- Xoay vòng kiểu mở đầu của kết luận: khi thì bắt đầu bằng hành vi ("Bạn đo mọi thứ bằng…"), khi thì bằng hệ quả ("Chỗ này hay đến muộn…"), khi thì bằng điều kiện ("Khi được giao quyền…"), khi thì bằng chính chỗ vướng ("Điều làm bạn mệt ở đây…"). Cấm mở tất cả bằng "Một nét…" hay "Bạn có…".

ĐIỀU KIỆN ĐỂ MỘT CÂU KẾT LUẬN ĐƯỢC CHẤP NHẬN:
Nó phải nói CƠ CHẾ, tức là cấu trúc nào tạo ra hệ quả nào trong đời sống. Một tính từ về người thì không phải kết luận.
- HỎNG: "Bạn điềm tĩnh và thông minh trong cách ứng xử." — ai đọc cũng gật, không đến từ lá số nào.
- HỎNG: "Bạn dễ gần và tạo được sự thân thiện." — không có cơ chế, không có hệ quả.
- ĐƯỢC: "Bạn đo mọi thứ bằng kết quả đếm được, nên hợp việc có chỉ tiêu rõ và rất mệt ở việc phải chiều nhiều bên cùng lúc."
- ĐƯỢC: "Phần đời này của bạn hay đến muộn: thường phải qua một quãng chệch nhịp rồi mới thấy mình thật sự muốn gì."

CẤM các tính từ chung chung làm nội dung chính: thông minh, hòa nhã, thân thiện, chân thành, tận tâm, cẩn trọng, mạnh mẽ, nhạy cảm, sâu sắc, đặc biệt. Dùng chúng thì phải kèm ngay một hệ quả cụ thể, bằng không bỏ hẳn câu.

BỐN NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN LÁ SỐ (mã F###) — do engine tính. Bất khả xâm phạm.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết Tử Vi. Mọi khẳng định chuyên môn dựa vào đây.
3. Kiến thức chung của bạn — chỉ cho ngôn ngữ đời thường, KHÔNG thay cho mục 2.

LUẬT VỀ TÊN SAO VÀ MÃ:
- KHÔNG chép lại danh sách sao từ dữ kiện. "Cung này có A, B, C" là chép, không phải luận.
- TÊN CÁCH CỤC thì gọi thoải mái, càng nêu càng tốt — chúng là thứ làm bài đọc
  này khác bài của người bên cạnh. Điều kiện duy nhất: dịch ngay sau khi nêu.
- Tên sao LẺ thì tối đa hai cái một câu, và chỉ khi nó giải thích được điều vừa nói.
- Có tên cách cục thì DÙNG TÊN ẤY, đừng kể tên từng sao thành viên. "Khốc Hư"
  chứ không phải "Thiên Khốc và Thiên Hư".
- Mã F###/E### CHỈ nằm trong "maDuKien"/"maNguon". Tuyệt đối không viết vào câu văn.

TUYỆT ĐỐI KHÔNG GỌI TÊN CUNG trong câu văn: không "cung Phúc Đức", không "phần
Phúc Đức", không "tại Mệnh". Gọi thẳng phần đời — "phần bên trong của bạn",
"chuyện tiền bạc", "chuyện đôi lứa". Tên cách cục và tên sao thì được; tên cung
thì không, vì người đọc không tra được nó.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức khoẻ, tiền bạc, pháp lý; lặp lại nguyên văn dữ kiện.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "linhVuc": [
    {
      "id": "menh",
      "ketLuan": "1 câu nói thẳng điều đáng chú ý nhất ở phần đời này, cụ thể cho lá số này",
      "doan": [
        "Đoạn 1 — 3-5 câu văn CHẢY, theo nhịp ba bước: nêu tên cấu trúc in đậm, dịch ngay ra con người, rồi hạ xuống một hành vi cụ thể.",
        "Đoạn 2 — 3-5 câu: cấu trúc thứ hai, hoặc lực kéo ngược lại. Phải nói rõ nó bổ trợ cho ý nào ở đoạn trên.",
        "Đoạn 3 — 2-4 câu: chỗ dễ mắc và điều kiện để nét trên bền. Bỏ hẳn đoạn này nếu phần đời này lá số nói mỏng."
      ],
      "maDuKien": ["F002"],
      "maNguon": []
    }
  ]
}

"doan" là MẢNG CÂU VĂN, không phải các ô để điền. Bản trước chia năm ô cố định
— kết luận, biểu hiện, mặt thuận, điểm dễ mắc, đáng cân nhắc — và mọi lĩnh vực
ra đúng năm câu rời ghép lại, đọc như một biểu mẫu. Đó là thứ phải bỏ.

Đủ cả MƯỜI HAI id trong danh sách trên, theo thứ tự phần nào nổi bật nhất ở lá số này thì đứng trước. Id nào không có trong danh sách sẽ bị loại bỏ cùng toàn bộ phần đó.`;

  const user = [
    dungKhoiChoPrompt(goi),
    kqTruyHoi.daChon.length
      ? ''
      : '\nLƯU Ý: không có nguồn tham chiếu nào. Chỉ mô tả điều dữ kiện lá số nói, và nêu rõ phần học thuyết chưa có căn cứ.',
  ].join('\n');

  const yeuCau = { system, user, maxTokens: 8000, mucSuyNghi: vao.epModel?.mucSuyNghi };
  const kq = vao.epModel
    ? { ...(await goiModel(vao.epModel.provider, vao.epModel.model, vao.epModel.apiKey, yeuCau)), provider: vao.epModel.provider, model: vao.epModel.model }
    : await goiVoiFallback(yeuCau);
  const tho = docObjectJson(kq.text);
  const mang = Array.isArray((tho as { linhVuc?: unknown } | null)?.linhVuc)
    ? ((tho as { linhVuc: unknown[] }).linhVuc as ThoKhoi[])
    : null;
  if (!mang) {
    console.warn('[bang-linh-vuc] model không trả về mảng linhVuc');
    return null;
  }

  /** Bóc mã khỏi câu, và bỏ câu nhắc sao không có trong dữ liệu */
  const sach = (x: unknown): string | null => {
    if (typeof x !== 'string') return null;
    const s = x
      .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
      .replace(/\b[FE]\d{3}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;])/g, '$1')
      .trim();
    if (s.length < 12) return null;

    // Celes mô tả và nêu điều đáng cân nhắc, không ra lệnh cho người đọc. Bỏ
    // đúng câu sai vai, không bỏ cả khối — một lỗi giọng không được phép làm
    // hỏng một khối còn lại vẫn đúng.
    const khongLenh = boCauRaLenh(s);
    if (khongLenh.length < 12) return null;

    const bia = nhanDangThucThe(khongLenh).filter(
      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !saoChoPhep.has(t.id)
    );
    return bia.length ? null : khongLenh;
  };

  const hopLe = new Set(Object.keys(NHAN_LINH_VUC));
  /*
   * Chuẩn hoá id model trả về trước khi đối chiếu.
   *
   * Model viết "nô-boc" thay vì "no-boc" — bỏ dấu là khớp. Loại cả một phần đời
   * vì một dấu thanh trong khoá kỹ thuật là mất nội dung đúng vì một lý do
   * chẳng liên quan gì tới nội dung.
   */
  const chuanId = (x: unknown): MucId | null => {
    if (typeof x !== 'string') return null;
    const k = boDau(x).replace(/\s+/g, '-');
    for (const id of hopLe) if (boDau(id) === k) return id as MucId;
    return null;
  };
  const ra: KhoiAi[] = [];
  /*
   * Vì sao từng phần bị loại — không có dòng này thì lúc bảng lùi về bản tất
   * định, thông báo duy nhất là "chỉ dựng được 3 lĩnh vực" và không ai biết vì
   * sao. Ba nguyên nhân khác hẳn nhau (id lạ, câu bị lọc, thiếu đoạn) cần ba
   * cách sửa khác hẳn nhau.
   */
  const biLoai: string[] = [];
  for (const k of mang) {
    const id = chuanId(k.id);
    const ketLuan = sach(k.ketLuan);
    if (!id) {
      biLoai.push(`${String(k.id)}: id không hợp lệ`);
      continue;
    }
    if (!ketLuan) {
      biLoai.push(`${id}: kết luận bị lọc`);
      continue;
    }
    if (ra.some((x) => x.id === id)) continue;

    /*
     * `doan` có thể về dưới hai hình, và phải nhận cả hai.
     *
     * Bộ so model bắt được: các model Gemini trả `doan` là MỘT chuỗi dài hoặc
     * một mảng một phần tử, trong khi OpenAI trả đúng mảng ba đoạn. Luật "ít
     * nhất hai đoạn" ở dưới loại sạch phần của Gemini — và con số so sánh biến
     * thành phép đo mức độ BÁM SCHEMA, không phải mức độ viết hay.
     *
     * Đo sai kiểu này nguy hơn không đo: nó cho một câu trả lời có vẻ khách
     * quan cho một câu hỏi mà nó chưa từng hỏi.
     */
    const thoDoan: unknown[] = Array.isArray(k.doan)
      ? k.doan
      : typeof k.doan === 'string'
        ? k.doan.split(/\n{2,}/)
        : [];
    let doan = thoDoan.map(sach).filter((x): x is string => Boolean(x));

    /*
     * Một đoạn dài: tách theo câu thành hai khối gần bằng nhau, giữ nguyên chữ.
     *
     * Ngưỡng BA câu, không phải bốn. Bộ so model đo được: với ngưỡng bốn, mọi
     * model đều rụng 2–6 phần chỉ vì viết đúng một đoạn ba câu. Mất hẳn một
     * phần đời tệ hơn nhiều so với một phần chỉ có hai đoạn ngắn.
     *
     * Đây là chỗ luật hình thức nhường cho nội dung: "ít nhất hai đoạn" sinh ra
     * để ép bài có lực kéo ngược, không sinh ra để vứt bài.
     */
    if (doan.length === 1) {
      const cau = doan[0].split(/(?<=[.!?])\s+/).filter((c) => c.trim());
      if (cau.length >= 3) {
        const giua = Math.ceil(cau.length / 2);
        doan = [cau.slice(0, giua).join(' '), cau.slice(giua).join(' ')];
      }
    }

    /*
     * Ít nhất hai đoạn, và tối thiểu ấy là một luật nội dung chứ không phải một
     * ngưỡng kỹ thuật: một khối chỉ có kết luận và một đoạn thì không đủ chỗ
     * cho cả nét mạnh lẫn lực kéo ngược, và một bài chỉ khen là bài không dùng
     * được dù đọc dễ chịu — luật counterweight §5.3.
     */
    if (doan.length < 2) {
      biLoai.push(
        `${id}: chỉ còn ${doan.length}/${Array.isArray(k.doan) ? k.doan.length : 0} đoạn sau khi lọc`
      );
      continue;
    }

    ra.push({ id, ketLuan, doan });
  }
  if (biLoai.length) console.warn('[bang-linh-vuc] loại:', biLoai.join(' · '));

  // Thiếu quá nửa thì đừng vá víu: trả null để lớp gọi lùi hẳn về bản tất định,
  // thay vì hiện một bảng nửa AI nửa template với hai giọng khác nhau.
  if (ra.length < 5) {
    console.warn('[bang-linh-vuc] chỉ dựng được', ra.length, 'lĩnh vực — lùi về bản tất định');
    return null;
  }

  /*
   * Sửa những câu kê sao trước khi qua cổng.
   *
   * Gom cả bảng vào một lần gọi: tám lĩnh vực mà sửa riêng từng câu là tám lượt
   * cho một thứ vốn chỉ tốn một. Không có câu nào phạm thì hàm không gọi model.
   */
  /*
   * Khoá theo TỪNG ĐOẠN, không gộp cả khối thành một chuỗi.
   *
   * Bản trước gộp `[ketLuan, ...doan].join(' ')` rồi sau khi sửa lại tách theo
   * DẤU CHẤM: `cs[0]` thành kết luận, `cs.slice(1)` thành các đoạn. Tức là mỗi
   * CÂU biến thành một ĐOẠN riêng, và giao diện vẽ mỗi đoạn một thẻ <p>.
   *
   * Đó là nguyên nhân cấu trúc của dáng rời rạc mà người dùng chụp lại: bài
   * model viết thành ba đoạn văn chảy, đi qua đây xong thành tám câu đứng một
   * mình cách nhau một dòng trống. Không prompt nào sửa được chuyện đó, vì nó
   * xảy ra SAU khi model đã viết xong.
   */
  const phang: Record<string, string> = {};
  ra.forEach((k, i) => {
    phang[`k${i}|c`] = k.ketLuan;
    k.doan.forEach((d, j) => {
      phang[`k${i}|d${j}`] = d;
    });
  });
  /*
    * Gỡ tên cách cục trước khi đếm sao.
    *
    * Không có tham số này thì lớp sửa bắt đúng những câu hay nhất: "bộ cách Tử
    * Phủ Vũ Tướng Liêm" đếm ra năm tên sao, bị coi là kê sao, rồi bị viết lại
    * thành một câu không còn cái tên nào. Hệ thống tự xoá đúng thứ vừa yêu cầu
    * model phải viết.
    */
  const daSua = await suaCauKeSao(phang, { boQua: cachCuc.map((c) => c.ten) });
  ra.forEach((k, i) => {
    k.ketLuan = doiTenCung(daSua[`k${i}|c`] ?? k.ketLuan);
    k.doan = k.doan.map((d, j) => doiTenCung(daSua[`k${i}|d${j}`] ?? d));
  });

  /*
   * Sửa câu dùng tiếng lóng nội bộ TRƯỚC khi qua cổng.
   *
   * Không có lớp này thì một cụm "các yếu tố" ở một phần làm hỏng CẢ MƯỜI HAI
   * phần: cổng trả `dat: false`, hàm trả null, và lớp gọi lùi hẳn về bản tất
   * định. Người dùng mất cả bảng model viết vì ba chữ, và không ai biết vì sao.
   *
   * Cùng cách xử đã dùng ở luồng chat: sửa đúng câu sai, giữ phần còn lại. Đưa
   * kèm tên cách cục và tên sao đã đọc được, vì câu "các yếu tố" không còn cái
   * tên nào để giữ lại — người sửa phải được đưa tên, không được tự nghĩ.
   */
  const tenChoSua = [...cachCuc.map((c) => c.ten), ...chinhTinhNoiBat(vao.laSo)];
  for (const k of ra) {
    k.ketLuan = await suaCauTiengLong(k.ketLuan, tenChoSua);
    for (let j = 0; j < k.doan.length; j++) {
      k.doan[j] = await suaCauTiengLong(k.doan[j], tenChoSua);
    }
  }

  const gate = soatNgonNgu(
    ra.flatMap((k) => [k.ketLuan, ...k.doan]).join(' '),
    ra.map((k) => k.ketLuan)
  );
  if (!gate.dat) {
    console.warn('[bang-linh-vuc] không qua cổng ngôn ngữ', gate.loi.map((l) => `${l.mucDo}:${l.ma}`));
    return null;
  }

  return {
    noiDung: ra,
    provider: kq.provider,
    model: kq.model,
    phienBan: {
      bangLinhVuc: PHIEN_BAN_BANG_LINH_VUC,
      planner: keHoach.phienBan,
      truyHoi: kqTruyHoi.phienBan,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}
