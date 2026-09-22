import { goiVoiFallback } from '@/lib/ai/fallback';
import { goiModel } from '@/lib/ai/providers';
import type { ProviderId } from '@/lib/ai/types';
import type { LaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';
import { CHANG_CUA_MUC, THU_TU_CHANG, type MucId } from '@/lib/tuvi/chang-cung';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';
import { boCauPhanQuyet, boCauTenBia, boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { boMarkdown, doiTenCung, suaCauKeSao, suaCauTiengLong } from './sua-chua';
import { lapKeHoach } from './planner';
import { boDau, nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';
import { VAN_PHONG_CELES } from './van-phong';

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
 * HAI lượt gọi SONG SONG, mỗi lượt sáu phần — không phải một lượt, cũng không
 * phải mười hai.
 *
 * Mười hai lượt cho một lần mở trang là hỏng ở ba mặt cùng lúc: cạn hạn mức
 * ngày sau hai người dùng, mười hai lần trả tiền cho cùng một lá số, và mười
 * hai bài không biết nhau nên lặp ý chéo.
 *
 * Một lượt cho cả mười hai phần thì gọn hơn, và đó là bản chạy suốt từ đầu.
 * Nhưng nó ĐÃ SÁT TƯỜNG trước khi ai thêm gì: đo ngày 22/09/2026 trên lá số
 * mẫu, một lượt mất 52,3 giây cho 2.927 từ, trong khi trần một lượt gọi là 55
 * giây và ngân sách cả chuỗi fallback là 50. Tức là bảng đang sống nhờ may:
 * model chậm hơn vài phần trăm, hoặc bài dài hơn vài trăm từ, là chạm trần —
 * và chạm trần thì KHÔNG CÒN CHỖ để lùi sang model thứ hai, nên cả bảng rơi
 * về bản tất định. Thêm hai câu khép cho mỗi phần làm đúng chuyện đó, đo được
 * hai lần liên tiếp.
 *
 * Hai lượt song song thì mỗi lượt viết một nửa, xong trong khoảng nửa thời
 * gian, và mỗi lượt có ngân sách fallback riêng. Cái giá: hai nửa không nhìn
 * thấy nhau, nên chúng có thể cùng bám vào một cách cục. Đo ngay sau khi tách:
 * cái tên to nhất của lá số bám 7/12 phần, so với 5/12 ở bản một-lượt. Vì thế
 * prompt của MỖI NỬA mang một luật đếm được riêng: không cách cục nào có mặt
 * quá ba trong sáu phần của lượt ấy — hai nửa cộng lại thì trần là sáu, tức
 * bằng bản cũ. `scripts/test-be-mat-ai.ts` đếm lại con số này sau mỗi lần sinh,
 * vì một cái giá chỉ nằm trong ghi chú thì không bao giờ đỏ lên.
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
export const PHIEN_BAN_BANG_LINH_VUC = '2026.09.6';

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
  /**
   * CÂU HỎI SOI và CÂU GIỮ LẠI — hai trong bốn thói quen viết, xem `van-phong.ts`.
   *
   * Là TRƯỜNG chứ không phải lời dặn trong prompt, và đó là điểm quan trọng:
   * đo ở bản đọc sâu cho thấy cùng một luật, viết thành lời dặn thì model làm
   * được 3/12 phần, viết thành trường bắt buộc trả về thì 12/12 ngay lần đầu.
   *
   * Tuỳ chọn ở phía nhận: thiếu một câu khép thì phần ấy vẫn đọc được, còn bỏ
   * cả phần đời vì thiếu nó là đổi một mất mát lớn lấy một mất mát nhỏ. Cùng
   * cách xử với `ban-doc-sau.ts`.
   */
  cauHoiSoi?: string;
  giuLai?: string;
}

interface ThoKhoi {
  id?: unknown;
  ketLuan?: unknown;
  doan?: unknown;
  cauHoiSoi?: unknown;
  giuLai?: unknown;
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

export interface TokenMotLuot {
  vao: number;
  ra: number;
  /** Phần đầu vào nhà cung cấp lấy từ bộ đệm của họ — xem ChatResult.tokensDem */
  dem: number;
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
  /**
   * Token của hai lượt cộng lại.
   *
   * Trả ra ngoài vì `dem` là thứ duy nhất cho biết phần luật trong `system` có
   * đang được nhà cung cấp đệm hay không, và đó là khoản tiết kiệm chạy mỗi
   * ngày. Một con số không ai nhìn thấy là một con số sẽ trôi.
   */
  tokens: TokenMotLuot;
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

  /*
   * Chia theo CHẶNG, không chia theo độ nổi bật.
   *
   * Ba phần của một chặng nói về cùng một vùng đời sống, nên để chúng trong
   * cùng một lượt thì model còn thấy mối nối giữa chúng. Chia theo độ nổi bật
   * thì mỗi nửa là một mớ phần rời rạc, và mối nối mất sạch.
   */
  const moiMuc = Object.keys(NHAN_LINH_VUC) as MucId[];
  const nuaDau = moiMuc.filter((id) => THU_TU_CHANG.indexOf(CHANG_CUA_MUC[id]) < 2);
  const nuaSau = moiMuc.filter((id) => THU_TU_CHANG.indexOf(CHANG_CUA_MUC[id]) >= 2);

  const danhSachCua = (ids: MucId[]) =>
    ids.map((id) => `  "${id}": ${NHAN_LINH_VUC[id]}`).join('\n');

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

  const dungSystem = (ids: MucId[], idsKia: MucId[]) => `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, giọng bình tĩnh, nói với người đối diện chứ không giảng bài.

Bức tranh đầy đủ của một lá số gồm mười hai phần đời. LƯỢT NÀY bạn viết SÁU
phần trong số đó, và chỉ sáu phần ấy.
DÙNG ĐÚNG những id dưới đây, không tự nghĩ id mới, không bỏ sót phần nào:
${danhSachCua(ids)}

SÁU PHẦN CÒN LẠI (${idsKia.join(', ')}) do một lượt viết khác lo. Đừng viết
chúng, đừng luận sang chúng, và đừng nhắc rằng bài còn phần khác — người đọc
nhận cả mười hai phần liền một mạch và không thấy chỗ nối.

CÁCH VIẾT — ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA CẢ BẢN HƯỚNG DẪN.

Mỗi lĩnh vực viết theo đúng nhịp ba bước, LẶP LẠI cho từng ý:
  (1) NÓI VỀ NGƯỜI ĐỌC — điều họ làm, điều họ gặp, chỗ họ hay vướng. Câu đầu
      của mỗi phần không được mở bằng một cái tên họ chưa biết.
  (2) RỒI MỚI NÊU TÊN cấu trúc sinh ra điều đó — tên cách cục trong khối CÁCH
      CỤC ở phần dữ kiện, hoặc Thân cư, hoặc một tên sao — và dịch nó ngay: "cho thấy chỗ ấy…", "là
      chỗ điều đó đến từ…".
  (3) HẠ XUỐNG ĐỜI SỐNG — nó lộ ra thành hành vi nào, trong tình huống nào.

Nhịp này KHÔNG bỏ bớt cái tên nào, nó chỉ đổi chỗ hai nhịp đầu. Không có tên
thì người đọc không có lý do nào để tin; nhưng mở bài bằng tên thì họ phải trả
một khoản phí trước khi nhận được gì.

TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN: không dấu sao, không dấu thăng, không gạch dưới,
không ngoặc kép quanh tên. Chữ bạn viết đi THẲNG ra màn hình, không qua bộ dịch
Markdown nào — nên mọi ký hiệu đều hiện nguyên xi trước mặt người đọc, và một
dòng "**Tham Lang**" là dấu hiệu lộ liễu nhất của chữ máy sinh chưa qua khâu nào.
Tên viết trơn: Tử Phủ Vũ Tướng Liêm. Nhấn mạnh bằng CÁCH ĐẶT CÂU, không bằng ký hiệu.

Đây là hình mẫu bắt buộc, đọc kỹ nhịp của nó:
  "Bạn hay là người đứng ra cầm phần quyết khi một việc chưa có ai nhận, và
   bạn làm chuyện đó gần như theo phản xạ. Bộ cách Tử Phủ Vũ Tướng Liêm đi
   cùng Binh Hình Tướng Ấn là chỗ điều ấy đến từ: cốt cách của một người làm
   chủ, nhìn được xa và giữ được uy. Đáng chú ý, với Thân cư Tài Bạch, bạn đo
   mọi thứ bằng cái đếm được — tiền, kết quả, thứ hạng — nên bạn thực tế hơn
   hẳn mức người ngoài đoán. Phong cách của bạn là nói ít làm nhiều: quyết
   nhanh, đôi khi theo bản năng, nhưng luôn hướng thẳng tới đích."

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
  ĐƯỢC: "Chỗ này đối diện thẳng với phần tiền bạc, nơi có Tử Vi — nghĩa là
         sự yên trong lòng bạn buộc phải đi qua chuyện tiền nong. Khi tài chính
         chông chênh, bạn mất yên nhanh hơn hẳn người khác."

MỘT CÁCH CỤC KHÔNG ĐƯỢC CÓ MẶT Ở QUÁ BA TRONG SÁU PHẦN CỦA LƯỢT NÀY.
Luật đếm được, không phải lời khuyên về giọng. Đo trên bài thật: khi không có
luật này, cái tên to nhất của lá số bám tới bảy trên mười hai phần, và bài đọc
ra như thể người này chỉ có một bộ sao. Lá số nào cũng còn nhiều dữ kiện khác —
sao lẻ, Tứ Hoá, Tuần Triệt, lớp hạn — dùng chúng, đừng quay lại cái tên to nhất.
Phần nào thật sự không đọc được gì ngoài cái tên ấy thì viết NGẮN và nói thẳng
là chỗ này lá số nói ít, hơn là nhắc lại nó lần thứ tư.

ĐIỀU QUAN TRỌNG NHẤT: SÁU PHẦN NÀY KHÔNG ĐƯỢC GIỐNG NHAU VỀ HÌNH.
- Lĩnh vực nào lá số nói mạnh thì viết dài và cụ thể. Lĩnh vực nào dữ kiện mỏng thì viết NGẮN, bỏ bớt trường, và nói thẳng là chỗ này lá số nói ít.
- Ít nhất HAI phần phải ngắn rõ rệt so với phần còn lại. Sáu khối dài bằng nhau là sáu khối sai.
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

${VAN_PHONG_CELES}

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức khoẻ, tiền bạc, pháp lý; lặp lại nguyên văn dữ kiện.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "linhVuc": [
    {
      "id": "menh",
      "ketLuan": "1 câu nói thẳng điều đáng chú ý nhất ở phần đời này, cụ thể cho lá số này",
      "cauHoiSoi": "ĐÚNG MỘT câu hỏi, viết ở ngôi của người đọc và kết bằng dấu hỏi. Là câu họ đang tự hỏi về chính mình ở phần đời này, không phải câu hỏi tu từ và không tự trả lời ngay câu sau. Ví dụ: Bao nhiêu là đủ để mình thấy an toàn mà vẫn được sống?",
      "giuLai": "1-2 câu KHÉP phần này: thứ đáng mang theo sau khi đọc xong. Không tóm tắt, không lời khuyên, không mở bằng hãy/nên/cần",
      "doan": [
        "Đoạn 1 — 3-5 câu văn CHẢY, theo nhịp ba bước: nêu tên cấu trúc, dịch ngay ra con người, rồi hạ xuống một hành vi cụ thể. Không dùng dấu sao hay bất kỳ ký hiệu Markdown nào.",
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

Đủ cả SÁU id trong danh sách trên, theo thứ tự phần nào nổi bật nhất ở lá số này thì đứng trước. Id nào không có trong danh sách sẽ bị loại bỏ cùng toàn bộ phần đó.`;

  /*
   * DỮ KIỆN CỦA LÁ SỐ NÀY nằm ở khối `user`, KHÔNG nằm trong `system`.
   *
   * Không phải chuyện gọn gàng. Mọi nhà cung cấp lớn đều đệm prompt theo TIỀN
   * TỐ: hai lượt gọi có cùng chuỗi đầu thì lượt sau chỉ trả tiền cho phần
   * khác. Trước đây khối cách cục và Thân cư nằm ngay sau đoạn mở của
   * `system`, tức dữ kiện riêng của MỘT người nằm trên bảy nghìn ký tự luật
   * dùng chung — nên tiền tố chung chỉ dài vài trăm ký tự và toàn bộ phần luật
   * phía sau bị trả tiền lại từ đầu, cho từng lá số, từng lượt, mãi mãi.
   *
   * Giờ `system` là luật thuần: cùng một chuỗi cho mọi người dùng và cho cả
   * hai nửa của cùng một bảng. `ChatResult.tokensDem` là chỗ kiểm lại rằng
   * nhà cung cấp có thật sự đệm hay không — đừng tin suông.
   */
  const user = [
    `CÁCH CỤC ĐỌC ĐƯỢC TRÊN LÁ SỐ NÀY — gọi thẳng tên, đây là ngoại lệ được phép:
${khoiCachCuc}
${thanCu}`,
    dungKhoiChoPrompt(goi),
    kqTruyHoi.daChon.length
      ? ''
      : '\nLƯU Ý: không có nguồn tham chiếu nào. Chỉ mô tả điều dữ kiện lá số nói, và nêu rõ phần học thuyết chưa có căn cứ.',
  ].join('\n');

  /*
   * Ngân sách 5.000 token cho mỗi nửa, không phải 8.000 cho cả bài.
   *
   * Nửa sáu phần đo được khoảng 1.500 từ, tức chưa tới 3.000 token — 5.000 là
   * dư chỗ cho cả hai câu khép mới. Và trần token KHÔNG phải chỗ nên nới cho
   * rộng tay: với dòng gpt-5 nó cũng là chỗ model tự cho phép mình viết dài
   * hơn và nghĩ lâu hơn. Đã thử nâng bản một-lượt từ 8.000 lên 10.000 và lượt
   * gọi chạm thẳng trần 55 giây.
   */
  const goiMotNua = async (ids: MucId[], idsKia: MucId[]) => {
    const yeuCau = {
      system: dungSystem(ids, idsKia),
      user,
      maxTokens: 5000,
      mucSuyNghi: vao.epModel?.mucSuyNghi,
    };
    const r = vao.epModel
      ? {
          ...(await goiModel(vao.epModel.provider, vao.epModel.model, vao.epModel.apiKey, yeuCau)),
          provider: vao.epModel.provider,
          model: vao.epModel.model,
        }
      : await goiVoiFallback(yeuCau);
    const tho = docObjectJson(r.text);
    const m = Array.isArray((tho as { linhVuc?: unknown } | null)?.linhVuc)
      ? ((tho as { linhVuc: unknown[] }).linhVuc as ThoKhoi[])
      : null;
    if (!m) console.warn('[bang-linh-vuc] một nửa không trả về mảng linhVuc');
    return { r, m };
  };

  /*
   * Một nửa hỏng thì vẫn giữ nửa kia.
   *
   * `Promise.all` sẽ ném ngay khi một nửa ném, và ném ở đây nghĩa là vứt luôn
   * nửa đã viết xong — sáu phần đúng bị bỏ vì sáu phần khác lỗi. Bắt riêng
   * từng nửa rồi mới quyết: còn nửa nào thì đi tiếp với nửa đó, hỏng cả hai
   * thì mới ném ra đúng lỗi đầu tiên để lớp trên xử như trước.
   */
  const [ketA, ketB] = await Promise.all([
    goiMotNua(nuaDau, nuaSau).catch((e: unknown) => ({ loi: e })),
    goiMotNua(nuaSau, nuaDau).catch((e: unknown) => ({ loi: e })),
  ]);
  const lay = (x: typeof ketA) => ('loi' in x ? null : x);
  const a = lay(ketA);
  const b = lay(ketB);
  if (!a && !b) throw (ketA as { loi: unknown }).loi;
  if (!a || !b) {
    console.warn(
      '[bang-linh-vuc] một nửa hỏng, đi tiếp với nửa còn lại:',
      ((!a ? ketA : ketB) as { loi: unknown }).loi
    );
  }

  const kq = (a ?? b)!.r;
  const tokens: TokenMotLuot = {
    vao: (a?.r.tokensIn ?? 0) + (b?.r.tokensIn ?? 0),
    ra: (a?.r.tokensOut ?? 0) + (b?.r.tokensOut ?? 0),
    dem: (a?.r.tokensDem ?? 0) + (b?.r.tokensDem ?? 0),
  };
  const mang = [...(a?.m ?? []), ...(b?.m ?? [])];
  if (mang.length === 0) {
    console.warn('[bang-linh-vuc] không nửa nào trả về mảng linhVuc');
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

  /*
   * Câu hỏi soi và câu giữ lại đi qua thêm một lớp: bỏ câu phán quyết.
   *
   * Hai câu này KHÉP một phần đời, nên chúng là chỗ model dễ buột ra một lời
   * chắc nịch nhất ("bạn chắc chắn sẽ…"). Mà cụm ấy là lỗi mức CHẶN ở cổng
   * ngôn ngữ, và cổng chặn ở đây nghĩa là trả null: mất cả mười hai phần vì
   * một câu khép. Bỏ đúng câu sai rẻ hơn nhiều lần.
   *
   * `sach` của kết luận và các đoạn KHÔNG dùng lớp này, và đó là cố ý: ở đó
   * câu phán quyết hiếm hơn hẳn, còn bỏ nhầm một câu giữa thân bài thì để lại
   * một lỗ hổng lập luận mà người đọc thấy ngay.
   */
  const sachCauKhep = (x: unknown): string => {
    const co = sach(x);
    if (!co) return '';
    const con = boCauPhanQuyet(co);
    return con.length < 12 ? '' : con;
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

    ra.push({
      id,
      ketLuan,
      doan,
      cauHoiSoi: sachCauKhep(k.cauHoiSoi),
      giuLai: sachCauKhep(k.giuLai),
    });
  }
  if (biLoai.length) console.warn('[bang-linh-vuc] loại:', biLoai.join(' · '));

  /*
   * Thiếu quá nửa thì đừng vá víu: trả null để lớp gọi lùi hẳn về bản tất
   * định, thay vì hiện một bảng nửa AI nửa template với hai giọng khác nhau.
   *
   * Từ khi sinh theo hai nửa, dạng hỏng hay gặp nhất KHÔNG còn là vài phần
   * rụng lẻ tẻ mà là mất trọn một nửa: sáu phần. Sáu vẫn qua được ngưỡng này,
   * và đó là cố ý — sáu phần do model viết vẫn hơn không có phần nào. Nhưng
   * lúc ấy trang có hai giọng thật, nên dòng cảnh báo ngay trên phải nói rõ
   * nửa nào hỏng vì lý do gì.
   */
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
  /*
   * `boMarkdown` chạy CUỐI, sau mọi lớp sửa.
   *
   * Hai lớp trên đều gọi model, và model sửa chữ cũng tự in đậm theo thói quen.
   * Gỡ trước chúng là gỡ nhầm lượt.
   */
  /*
   * Bỏ CÂU có tên sao bịa trước khi vào cổng — xem CEL-097.
   *
   * Cổng đặt "tên sao bịa" ở mức chặn, mà chặn ở đây nghĩa là trả null và
   * người đọc không nhận được gì. Với bài dài thì mất một câu rẻ hơn mất cả
   * bài rất nhiều lần.
   *
   * Chat CỐ Ý không làm thế: câu trả lời bên ấy chỉ vài câu, khoét đi một câu
   * là thấy ngay, nên để cổng chặn rồi sinh lại.
   */
  ra.forEach((k, i) => {
    k.ketLuan = boCauTenBia(boMarkdown(doiTenCung(daSua[`k${i}|c`] ?? k.ketLuan)));
    k.doan = k.doan.map((d, j) =>
      boCauTenBia(boMarkdown(doiTenCung(daSua[`k${i}|d${j}`] ?? d)))
    );
    /*
     * Hai câu khép KHÔNG đi qua lớp sửa câu kê sao, và đó là cố ý: theo luật
     * chúng không nêu tên sao nào — câu hỏi viết ở ngôi người đọc, câu giữ lại
     * nói thứ đáng mang theo. Đưa chúng vào đó chỉ là thêm một lượt model cho
     * hai câu không có gì để sửa. Nhưng Markdown và tên cung thì vẫn phải gỡ,
     * như mọi chữ khác đi ra màn hình.
     */
    if (k.cauHoiSoi) k.cauHoiSoi = boCauTenBia(boMarkdown(doiTenCung(k.cauHoiSoi)));
    if (k.giuLai) k.giuLai = boCauTenBia(boMarkdown(doiTenCung(k.giuLai)));
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
    if (k.cauHoiSoi) k.cauHoiSoi = await suaCauTiengLong(k.cauHoiSoi, tenChoSua);
    if (k.giuLai) k.giuLai = await suaCauTiengLong(k.giuLai, tenChoSua);
  }

  /*
   * Hai câu khép nằm TRONG phần chữ cổng soát, không đứng ngoài.
   *
   * Chúng hiện ra màn hình như mọi câu khác, nên miễn cho chúng là để lại đúng
   * cái lỗ đã sinh ra bộ quy tắc này: một bề mặt của sản phẩm nói bằng giọng
   * riêng vì không ai soát nó.
   */
  const gate = soatNgonNgu(
    ra.flatMap((k) => [k.ketLuan, ...k.doan, k.cauHoiSoi ?? '', k.giuLai ?? '']).join(' '),
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
    tokens,
    phienBan: {
      bangLinhVuc: PHIEN_BAN_BANG_LINH_VUC,
      planner: keHoach.phienBan,
      truyHoi: kqTruyHoi.phienBan,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}
