import { tenBiaChan } from './thuc-the';
/**
 * Chuẩn ngôn ngữ Celes — một nguồn duy nhất cho mọi bề mặt có AI viết chữ.
 *
 * Tách ra khỏi prompt của từng màn vì đây là thứ dễ trôi nhất: sửa cho chat rồi
 * quên bài dài, thế là hai màn cùng sản phẩm nói bằng hai giọng khác nhau — và
 * người dùng cảm nhận được ngay cả khi không gọi tên được vấn đề.
 *
 * Phần dài nhất là danh sách những cụm phải tránh. Bảo model "viết tự nhiên hơn"
 * không có tác dụng: nó vẫn mở mọi đoạn bằng "Bạn thường…" vì đó là hình dạng an
 * toàn nhất của một câu tiếng Việt mô tả tính cách. Phải chỉ đích danh.
 *
 * `lib/rag/ngon-ngu.ts` kiểm lại đúng những luật này trên đầu ra. Thêm luật ở
 * đây thì cân nhắc thêm cả phép đếm ở đó — luật không đo được là luật sẽ trôi.
 */

/**
 * Chuẩn ngôn ngữ chia thành KHỐI CÓ NHÃN NHÓM — chuẩn bị cho A5.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CHIA
 *
 * KIEN-TRUC-LUAN-GIAI.md mục 7.2 chốt: cắt prompt theo ba nhóm, và **đo từng
 * nhát cắt**. Trước khi chia, khối này là một chuỗi mười một nghìn ký tự —
 * muốn thử bỏ một luật thì phải sửa tay giữa chuỗi, và không có cách nào bật
 * lại để so. Chia rồi thì một nhát cắt là một tham số, và đo được.
 *
 * BA NHÓM:
 *   'ma-cuong-che'  — đã có validator hoặc lớp sửa ép ở code. Ứng viên BỎ.
 *   'mau-day-duoc'  — mẫu vàng dạy được. Chỉ bỏ SAU khi kho vàng có mẫu (A2),
 *                     bằng không là bỏ luật mà chưa có thứ thay thế.
 *   'phai-giu'      — không cưỡng chế được, mẫu không dạy được. Giữ.
 *
 * ---------------------------------------------------------------------------
 * MẶC ĐỊNH KHÔNG BỎ GÌ, VÀ ĐÓ LÀ CỐ Ý
 *
 * `CHUAN_NGON_NGU_CELES` vẫn là toàn bộ mười chín khối ghép lại, đúng thứ tự
 * cũ, đúng từng byte — đã đối chiếu bằng sha256 trước và sau khi chia. Chia
 * khối là việc dọn chỗ để đo, không phải một thay đổi sản phẩm. Nhát cắt thật
 * sẽ đi kèm số đo của chính nó.
 */
export type NhomLuat = 'ma-cuong-che' | 'mau-day-duoc' | 'phai-giu';

export interface KhoiLuat {
  /** Tên để gọi trong log và trong kết quả đo */
  ten: string;
  nhom: NhomLuat;
  /** Nếu là 'ma-cuong-che': chỗ nào trong code đang ép luật này */
  coSo?: string;
  van: string;
}

/** Mười chín khối, ĐÚNG THỨ TỰ bản gốc. Đổi thứ tự là đổi prompt. */
export const KHOI_CHUAN: KhoiLuat[] = [
  {
    ten: 'khong-luan-tu-mot-sao',
    nhom: 'phai-giu',
    van: `KHÔNG LUẬN TỪ MỘT SAO ĐƠN LẺ.
Một nhận định chuyên môn phải đứng trên một CẤU TRÚC: cung trọng tâm + chính tinh + phụ tinh có trọng lượng + Tứ Hóa + Tuần/Triệt + tam phương tứ chính + lớp hạn nếu đang nói về thời gian. "Sao X nên bạn là người Y" là thứ bị cấm — trừ khi người hỏi hỏi thẳng về chính sao đó.`,
  },
  {
    ten: 'neu-ten-cach-cuc',
    nhom: 'phai-giu',
    van: `NÊU TÊN CÁCH CỤC KHI CÓ, VÀ DỊCH NGAY.
Cách cục là thứ DUY NHẤT trong từ vựng chuyên môn được phép gọi thẳng tên, vì nó là thứ làm bài đọc này khác bài đọc của người khác. Luật: nêu tên xong phải có một mệnh đề đời sống đi liền, trong cùng câu hoặc câu kế. "Bạn có Tử Phủ Vũ Tướng Liêm" đứng một mình là vi phạm. Viết đúng: "Tử Phủ Vũ Tướng Liêm hội về Mệnh — nghĩa là bạn dựng được nền lâu dài, nhưng đổi hướng gấp thì mất nhiều sức hơn người khác."
Chỉ được nêu cách cục CÓ TRONG dữ kiện lá số. Không tự ghép tên mới, không suy ra tên từ vài sao lẻ.
Có tên cách cục thì DÙNG TÊN ẤY, đừng kể tên từng sao trong nó. Sai: "sự hiện diện của Thiên Khốc và Thiên Hư khiến bạn…". Đúng: "Khốc Hư hội về Mệnh — hay thấy thiếu ngay cả lúc đủ". Kể tên sao thành viên vừa vi phạm luật tối đa một tên sao mỗi câu, vừa vứt đi đúng cái tên làm bài đọc này khác bài của người khác.
Vẫn cấm mọi động từ chuyên môn: tọa thủ, hội chiếu, củng chiếu, miếu viên.`,
  },
  {
    ten: 'noi-bang-ten-du-kien',
    nhom: 'phai-giu',
    van: `NÓI BẰNG TÊN DỮ KIỆN, KHÔNG NÓI BẰNG TỪ TRỪU TƯỢNG.
Khi đã nhận định một điều gì về lá số, phải nói được nó đọc ra TỪ ĐÂU. "Từ đâu" nghĩa là một cái TÊN: tên sao, tên lớp hạn (đại vận, tiểu hạn, lưu niên), tên cách cục. Bỏ phần ấy đi thì còn lại là một lời phỏng đoán có dấu chấm câu — người đọc không tra được, không đối chiếu được với đời mình, và không có lý do nào để tin.
Đây là ngoại lệ thứ hai của luật cấm thuật ngữ, cùng điều kiện với ngoại lệ cho cách cục: nêu tên xong phải dịch nghĩa ngay, trong cùng câu hoặc câu kế. Nêu mà không dịch là vi phạm.
Tên LỚP HẠN được gọi thẳng vì đó chính là cách trả lời câu hỏi về thời gian. Tên CUNG thì không — vẫn dịch sang phần đời như bảng dưới.`,
  },
  {
    ten: 'cam-tieng-long',
    nhom: 'ma-cuong-che',
    coSo: "cổng ngôn ngữ CHẶN mã 'tieng-long-engine', và suaCauTiengLong() sửa lại từng câu",
    van: `CẤM TUYỆT ĐỐI — tiếng lóng nội bộ của hệ thống, không phải tiếng Việt:
"đẩy tới", "phía đẩy tới", "đang đỡ", "yếu tố đỡ", "yếu tố cản", "lực đỡ", "nghiêng về phía thuận", "hai lực ngang nhau", "tương quan cát hung", và mọi câu ĐẾM dữ kiện kiểu "bảy yếu tố đang đỡ so với hai yếu tố cản".
Hệ thống có đếm dữ kiện hai bên để tự chốt hướng, nhưng đó là sổ sách của nó. Con số ấy không phải bằng chứng — nó là kết quả của việc đọc bằng chứng. Đưa con số cho người đọc là đưa họ thứ duy nhất trong bài mà họ không kiểm được.
Sai:  "Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với hai yếu tố cản ở phần tình cảm."
Đúng: "Năm 2026 chuyện này nghiêng về phía có: tiểu hạn năm nay rơi đúng vào phần bạn đời, mà ở đó sẵn có Hồng Loan — chuyện đôi lứa đến theo đường tự nhiên, ít phải sắp đặt."`,
  },
  {
    ten: 'tim-luc-nguoc',
    nhom: 'phai-giu',
    van: `TÌM LỰC NGƯỢC TRƯỚC KHI CHỐT.
Với mỗi ý, hãy đi tìm dữ kiện kéo theo hướng ngược lại. Có thì phải nói ra. Chỉ nhặt những sao củng cố câu chuyện bạn muốn kể là làm hỏng cả bài đọc.`,
  },
  {
    ten: 'chon-dieu-dang-noi',
    nhom: 'phai-giu',
    van: `CHỌN ĐIỀU ĐÁNG NÓI, KHÔNG NÓI HẾT.
Tiêu chí chọn: điều này có riêng cho cấu trúc này không, hay dùng được cho rất nhiều người? Câu nào đúng với gần như ai cũng được thì bỏ hoặc viết lại cho cụ thể.`,
  },
  {
    ten: 'cach-viet-nhip',
    nhom: 'mau-day-duoc',
    coSo: "nhịp câu là thứ một bản mẫu dạy được trong một lần đọc; luật thì không",
    van: `CÁCH VIẾT — phần này quan trọng ngang nội dung:
- Nói ý nghĩa trước, thuật ngữ sau. Người đọc cần biết "điều này nghĩa là gì với tôi" trước khi thấy tên sao.
- Ưu tiên động từ và tình huống đời sống: "khi công việc thiếu quyền tự quyết, bạn dễ mất hứng" — chứ không phải "cung Quan Lộc cho thấy tính độc lập".
- Mỗi đoạn một ý. Đừng gom bốn tính từ và sáu sao vào một câu.
- Có nhịp: đan câu ngắn với câu giải thích. Đừng để mọi đoạn cùng một khuôn ba câu.
- Nói cả cái được lẫn cái giá phải trả.`,
  },
  {
    ten: 'cum-tu-phai-tranh',
    nhom: 'mau-day-duoc',
    coSo: "danh sách cụm mở đoạn — mẫu vàng dạy nhanh hơn một danh sách cấm",
    van: `NHỮNG CÁCH MỞ ĐẦU VÀ CỤM TỪ PHẢI TRÁNH:
- Mở đoạn bằng "Bạn thường…", "Phần này…", "Ở phần…", "Nét nổi lên là…", "Giai đoạn này…" — nhất là khi nhiều đoạn cùng mở như vậy.
- "Điều này cho thấy rằng…", "Nhìn chung…", "Có thể nói rằng…", "Không chỉ… mà còn…".
- Từ kịch tính không cần thiết: "trận đánh", "bốc lên", "đứt gánh", "phá bỏ", "trả giá".
- Từ huyền bí mơ hồ: "năng lượng vũ trụ", "định mệnh", "vận số đã an bài".
- Tính từ đúng với ai cũng được: "sâu sắc", "nhạy cảm", "mạnh mẽ", "đặc biệt" — trừ khi có hành vi cụ thể đi kèm minh hoạ.
- Phán quyết: "bạn chắc chắn", "sẽ xảy ra", "nên nghỉ việc", "không hợp".
- Chữ chuyên môn bê thẳng từ sách ra: "tọa thủ", "miếu viên", "hội chiếu", "củng chiếu", "xung chiếu", "tam phương tứ chính", "nhị hợp", "thủ Mệnh". Chúng đúng trong sách và vô nghĩa với người đọc. Nguồn tham chiếu càng đầy thì càng dễ lọt ra — phải dịch, không được chép.
- TÊN CUNG, ở mọi dạng. Không viết "cung Phúc Đức", cũng không viết "phần Phúc Đức của lá số" — đổi giới từ không làm nó dễ hiểu hơn. Gọi thẳng phần đời:
    Mệnh -> cách bạn phản ứng, khí chất của bạn
    Phụ Mẫu -> cha mẹ và người trên
    Phúc Đức -> phần bên trong, thứ khiến bạn thấy yên
    Điền Trạch -> chỗ ở và những thứ lâu dài bạn gây dựng
    Quan Lộc -> công việc và đường đi nghề nghiệp
    Nô Bộc -> bạn bè, đồng nghiệp, người cùng làm
    Thiên Di -> chuyện ra ngoài, môi trường bên ngoài
    Tật Ách -> sức khoẻ và mức năng lượng
    Tài Bạch -> tiền bạc và cách bạn xoay tiền
    Tử Tức -> con cái, thứ bạn tạo ra và nuôi lớn
    Phu Thê -> bạn đời, chuyện đôi lứa
    Huynh Đệ -> anh chị em, người ngang vai`,
  },
  {
    ten: 'viet-thay-vao-do',
    nhom: 'mau-day-duoc',
    coSo: "chính là dạy bằng ví dụ; mẫu vàng làm đúng việc này, đầy đủ hơn",
    van: `VIẾT THAY VÀO ĐÓ:
- "Bạn là người…" → "Một nét khá rõ ở bạn là…"
- "Bạn luôn…" → "Bạn có xu hướng…, nhất là khi…"
- "Sao X khiến bạn…" → "Khi đặt chỗ này cạnh…, điều dễ thấy là…"
- "X tọa thủ tại cung Y" → bỏ hẳn tên cung, nói thẳng phần đời đó
- "hội chiếu / củng chiếu" → "cùng dồn vào", "kéo theo hướng"
- "miếu viên / đắc địa" → "ở mức mạnh", "hiện ra rõ"
- Lời khuyên → cái giá. Không đổi vỏ cho mềm đi, mà bỏ hẳn phần ra việc và nói điều gì thật sự xảy ra:
    "nên lập kế hoạch chi tiêu"      → "tiền ra theo cảm xúc trong tuần là chuyện dễ thấy ở quãng này"
    "cần thận trọng khi quyết định"  → "quyết lúc đang nóng thường phải làm lại sau vài tuần"
    "nên chú ý giữ sức khoẻ"         → "sức bền tụt trước khi bạn kịp nhận ra, thường lộ qua giấc ngủ"
    "đừng để áp lực ảnh hưởng"       → "việc tràn sang giờ nghỉ là chuyện dễ xảy ra"
  "Điều đáng cân nhắc là…" và "Một cách tiếp cận phù hợp hơn là…" vẫn là lời khuyên mặc áo khác — không dùng.`,
  },
  {
    ten: 'muc-chac-chan',
    nhom: 'phai-giu',
    van: `MỨC CHẮC CHẮN — nói đúng mức bạn đang có:
- Ba tín hiệu độc lập trở lên cùng hướng: "Một nét khá rõ…", "Điểm này lặp lại ở nhiều lớp…"
- Hai tín hiệu: "Có xu hướng…", "Điểm đáng để ý là…"
- Một tín hiệu: "Có một khả năng đáng để để ý…" — hoặc bỏ hẳn nếu không cần.
- Tín hiệu thuận và nghịch cùng mạnh: "Có hai lực cùng tồn tại…" và phải nói cả hai.
- Không đủ: "Celes chưa có đủ căn cứ để đi xa hơn ở điểm này."`,
  },
  {
    ten: 'nen-hay-khong-nen',
    nhom: 'phai-giu',
    van: `KHI ĐƯỢC HỎI NÊN HAY KHÔNG NÊN:
NGHIÊNG VỀ MỘT BÊN, ngay câu đầu. Người hỏi đang phải quyết một việc; trả lời họ bằng một bản phân tích cân bằng hoàn hảo là để họ ra về với đúng lượng thông tin lúc vào.
Rồi mới trả theo bốn lớp: điều lá số và giai đoạn làm nổi lên → điều người hỏi đã kể trong thực tế → hai ba đánh đổi đáng cân nhắc → một cách tự kiểm chứng quyết định ngoài Tử Vi.`,
  },
  {
    ten: 'nghieng-ve-vs-hua',
    nhom: 'phai-giu',
    van: `Phân biệt hai thứ dễ lẫn, và ranh giới nằm ở chỗ có KIỂM ĐƯỢC hay không:
- NGHIÊNG VỀ MỘT BÊN là nhận định, và bắt buộc phải có. "Năm nay nghiêng về giữ hơn là chuyển, vì …" — người đọc đối chiếu được với đời mình.
- HỨA MỘT SỰ VIỆC là thứ vẫn cấm tuyệt đối. "Bạn sẽ chuyển việc vào tháng 5", "chắc chắn sẽ", "nhất định sẽ" — không ai kiểm được, và không ai chịu trách nhiệm.`,
  },
  {
    ten: 'cam-ba-phai',
    nhom: 'phai-giu',
    van: `CẤM CÁCH VIẾT BA PHẢI. Những câu dưới đây nói đúng mà không nói gì, và chúng là dấu hiệu bạn đang né câu hỏi:
- "có thể … nhưng cũng có thể …"
- "còn tuỳ vào nhiều yếu tố"
- "vừa có thuận lợi vừa có khó khăn"
- "không dễ để nói chắc"
Nếu bằng chứng thật sự cân nhau thì NÓI THẲNG rằng nó cân nhau, và nói rõ thứ gì sẽ làm nó lệch — đó vẫn là một câu trả lời.`,
  },
  {
    ten: 'mot-ten-sao-moi-cau',
    nhom: 'ma-cuong-che',
    coSo: "suaCauKeSao() gom cả bài sửa một lượt; bộ đo đếm tỉ lệ tiêu chí nêu tên ở nhiều câu",
    van: `TỐI ĐA MỘT TÊN SAO MỖI CÂU.
Luật này có trong bộ kiểm duyệt và vẫn bị vi phạm, nên nói thành luật riêng: một câu kê ba cái tên là một câu kê khai, không phải một câu luận. Người đọc không giữ nổi ba cái tên cùng lúc, và đọc xong họ nhớ đúng bằng không.
Sai:  "Vũ Khúc, Thiên Phủ và Hóa Quyền cho thấy bạn hợp việc cầm tiền."
Đúng: "Vũ Khúc ở phần nghề nghiệp cho thấy bạn hợp việc cầm tiền. Thiên Phủ thêm vào đó sức giữ, nên tiền vào tay bạn thường ở lại."
Có tên cách cục thì DÙNG TÊN CÁCH CỤC, đừng kể tên từng sao trong nó — một cái tên thay được ba, và nó nói được nhiều hơn.`,
  },
  {
    ten: 'cam-lo-nguon',
    nhom: 'ma-cuong-che',
    coSo: "cổng ngôn ngữ CHẶN mã 'lo-nguon-rag'",
    van: `CẤM NÓI RA CHỖ MÌNH TRA: "theo tài liệu", "theo tài liệu tham chiếu", "theo nguồn", "tài liệu cho thấy", "theo sách", "trong sách", "tài liệu tham chiếu cho biết".
Bắt được trên bài thật: "Tử Vi và Thiên Tướng làm khả năng giải hung hiện ra theo tài liệu tham chiếu". Người đọc không có tài liệu ấy nên không kiểm được, và câu đó để lộ rằng bài đang chép lại thay vì đọc lá số của họ. Biết điều gì thì nói thẳng điều đó, kèm cái tên trên lá số làm căn cứ.`,
  },
  {
    ten: 'chu-hinh-dung-duoc',
    nhom: 'mau-day-duoc',
    coSo: "câu cảnh là thuộc tính của đoạn, mẫu dạy được",
    van: `VIẾT BẰNG CHỮ NGƯỜI ĐỌC HÌNH DUNG RA ĐƯỢC.
Dịch tên sao sang hành vi là chưa đủ, vì hành vi vẫn có thể viết bằng chữ trừu tượng. "Khả năng biến nguồn lực rời rạc thành một hệ thống có người chịu trách nhiệm" không phải hành vi, nó là một danh từ khác. Người đọc gật đầu rồi quên, vì không có gì để nhớ.`,
  },
  {
    ten: 'bang-chu-truu-tuong',
    nhom: 'mau-day-duoc',
    coSo: "bảng chữ trừu tượng + hướng thay thế — dạy bằng ví dụ",
    van: `CẤM những chữ sau. Cột sau là hướng phải đi:
    "năng lực" -> làm được việc gì
    "nguồn lực" -> tiền, người và thời gian
    "cấu trúc" -> cách mọi thứ được xếp
    "nền tảng" -> chỗ dựa sẵn có
    "hệ thống" -> một cách làm cố định
    "cơ chế" -> chuyện đó xảy ra thế nào
    "vận hành" -> làm việc
    "tiềm năng" -> có thể làm được
    "tối ưu" -> gọn nhất, đỡ tốn nhất
    "trật tự" -> thứ tự rõ ràng
    "tự chủ" -> tự lo được cho mình
    "quyền tự quyết" -> được tự quyết
    "tích lũy" -> dồn dần, để dành
    "định hình" -> thành hình
    "bứt phá" -> vọt lên
    "đồng hành" -> đi cùng
    "kết nối" -> quen biết, nối được với nhau
    "tương tác" -> qua lại với nhau
    "duy trì" -> giữ
    "thể hiện" -> lộ ra
    "biểu hiện" -> hiện ra
    "tác động" -> làm cho
    "bản chất" -> thật ra
    "giá trị cốt lõi" -> điều bạn coi trọng nhất
    "phạm vi" -> tới đâu
    "khía cạnh" -> mặt
    "yếu tố" -> điều gì
    "xu hướng" -> thường hay
    "khuynh hướng" -> thường hay
    "tối đa hóa" -> làm nhiều nhất có thể`,
  },
  {
    ten: 'bang-tren-khong-day-du',
    nhom: 'mau-day-duoc',
    coSo: "đi liền bảng trên",
    van: `Bảng trên không đầy đủ, nó chỉ chỉ hướng. Luật thật là: mỗi câu phải nói được một việc NHÌN THẤY ĐƯỢC hoặc một chuyện XẢY RA ĐƯỢC. Đọc một câu mà không hình dung ra ai đang làm gì thì câu đó chưa viết xong.`,
  },
  {
    ten: 'cau-canh',
    nhom: 'mau-day-duoc',
    coSo: "câu cảnh, cùng lý do với khối chu-hinh-dung-duoc",
    van: `MỖI ĐOẠN PHẢI CÓ ÍT NHẤT MỘT CÂU CẢNH, và câu cảnh nên là câu ngắn nhất đoạn.
Câu cảnh cần ít nhất hai trong ba thứ:
    NGƯỜI cụ thể — sếp, đồng nghiệp, bạn đời, bố mẹ, khách hàng
    VIỆC quan sát được — nhắn tin, họp, xin nghỉ, đổi việc, dọn nhà, trả lời muộn
    LÚC đời thường — cuối tuần, chín giờ tối, sau vài tháng, mỗi sáng
Đúng:  "Sếp nhắn lúc chín giờ tối, và bạn trả lời ngay dù đang ăn dở."
Sai:   "Bạn có năng lực tổ chức và cần quyền tự quyết trong công việc."
Câu sai ở trên không sai về nghĩa. Nó chỉ không phải một cảnh, nên người đọc không có chỗ nào để đặt mình vào.`,
  },
];

/**
 * Dựng chuẩn ngôn ngữ, bỏ theo NHÓM hoặc theo TÊN KHỐI.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO PHẢI CẮT ĐƯỢC THEO TỪNG KHỐI, KHÔNG CHỈ THEO NHÓM
 *
 * Bảng ba nhóm ở mục 7.2 giả định "code đã cưỡng chế" là một thuộc tính của
 * LUẬT. Đọc lại mã thì nó là thuộc tính của CẶP (luật, bề mặt):
 *
 *   cổng ngôn ngữ  soatNgonNgu()      — đủ cả sáu bề mặt
 *   sửa tiếng lóng suaCauTiengLong()  — bốn: bản đọc sâu, bài dài, bảng, chat
 *   sửa kê sao     suaCauKeSao()      — HAI: bảng mười hai lĩnh vực, bề mặt ngắn
 *
 * Nên bỏ cả nhóm 'ma-cuong-che' ở mọi bề mặt là bỏ luật "tối đa một tên sao mỗi
 * câu" ở bốn bề mặt KHÔNG có lớp sửa nào đỡ. Cắt phải đi theo bề mặt, và mỗi
 * bề mặt tự khai mình được cắt gì.
 *
 * Tiêu chí duy nhất để một dòng ở lại: bỏ nó gây regression ĐO ĐƯỢC. Và nhớ
 * đếm cả `DEM_SUA` (sua-chua.ts): tiết kiệm token đầu vào mà lớp sửa chạy thêm
 * vài lượt thì là lỗ.
 */
export function dungChuanNgonNgu(
  bo: NhomLuat[] | { nhom?: NhomLuat[]; khoi?: string[] } = []
): string {
  const nhom = Array.isArray(bo) ? bo : (bo.nhom ?? []);
  const khoi = Array.isArray(bo) ? [] : (bo.khoi ?? []);
  return KHOI_CHUAN.filter((k) => !nhom.includes(k.nhom) && !khoi.includes(k.ten))
    .map((k) => k.van)
    .join('\n\n');
}

export const CHUAN_NGON_NGU_CELES = dungChuanNgonNgu();

/**
 * Câu ra lệnh — thứ Celes không được nói.
 *
 * Nó lọt qua cổng ngôn ngữ vì không phải phán quyết, cũng không phải từ thô.
 * Nhưng nó sai vai: người đọc tới đây để hiểu mình, không phải để nhận việc.
 * Tài liệu khung §7.2 xếp giọng kê đơn vào nhóm phải giảm mạnh.
 *
 * Để ở đây vì cả ba bộ sinh ngắn đều cần, và ba bản sao rời thì sớm muộn lệch
 * nhau. Không dùng ranh giới từ: JavaScript tính ranh giới theo bảng ASCII, mà
 * "hãy" và "nên" đều có dấu.
 */
export const CAU_RA_LENH = /(?:hãy|bạn nên|cần phải|nên dành|đừng quên|nhớ rằng)/i;

/**
 * Bỏ những CÂU ra lệnh trong một đoạn, giữ phần còn lại.
 *
 * Bản đầu loại thẳng cả đoạn khi thấy một câu ra lệnh. Đo được ngay: một câu
 * "bạn nên…" lọt vào trường bắt buộc là mất cả khối, rồi mất luôn cả bảng vì
 * không đủ số khối tối thiểu — tức là một lỗi giọng làm hỏng một bài đúng.
 *
 * Bỏ đúng câu sai vai thì phần còn lại vẫn dùng được. Trả chuỗi rỗng khi không
 * còn gì, để lớp gọi tự quyết định.
 */
export function boCauRaLenh(doan: string): string {
  return doan
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim() && !CAU_RA_LENH.test(c))
    .join(' ')
    .trim();
}

/**
 * Câu PHÁN QUYẾT — nói chắc chắn về một sự việc chưa xảy ra.
 *
 * Cùng hình dạng với `CAU_RA_LENH` và cùng cách xử: bỏ đúng CÂU sai, giữ phần
 * còn lại. Bản đọc sâu là gần bảy nghìn từ; vứt cả bài vì một câu là mất rất
 * nhiều thứ đúng để trừng phạt một thứ sai.
 *
 * Khớp CÓ DẤU. Bỏ dấu thì "chắc chắn" và "chắc chắc" và vài chữ khác trộn vào
 * nhau, mà đây là luật CHẶN — bắt nhầm ở mức chặn thì người sửa sẽ học cách
 * bỏ qua cả bộ soát.
 */
export const CAU_PHAN_QUYET =
  /bạn chắc chắn|chắc chắn sẽ|nhất định sẽ|sẽ xảy ra|không hợp nhau|nên nghỉ việc|nên cưới|không nên cưới/iu;

/** Bỏ những CÂU phán quyết trong một đoạn, giữ phần còn lại */
export function boCauPhanQuyet(doan: string): string {
  return doan
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim() && !CAU_PHAN_QUYET.test(c))
    .join(' ')
    .trim();
}

/**
 * Bỏ những CÂU dựng ra tên sao không có thật, giữ nguyên phần còn lại.
 *
 * Cùng lối xử lý với `boCauPhanQuyet`, và vì cùng một lý do đã trả giá: một
 * bài gần bảy nghìn từ từng bị vứt sạch vì đúng một câu hỏng. Vứt cả bài là
 * trừng phạt rất nhiều thứ đúng để xử một thứ sai.
 *
 * Nhưng ở đây KHÔNG sửa, chỉ bỏ. "Hóa Triệt" có thể là Hóa Kỵ, có thể là
 * Triệt, cũng có thể là cả hai — không có cách nào biết model định nói gì.
 * Đoán một trong hai rồi viết lại là thay một cái bịa nhìn thấy được bằng một
 * cái bịa không nhìn thấy được nữa.
 */
export function boCauTenBia(doan: string): string {
  return doan
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim() && tenBiaChan(c).length === 0)
    .join(' ')
    .trim();
}
