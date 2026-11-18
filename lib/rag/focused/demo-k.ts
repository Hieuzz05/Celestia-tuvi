/**
 * DEMO_K (thử, KHÔNG gộp) — 08/10/2026.
 *
 * Gốc của câu trừu tượng ("có cơ hội thể hiện năng lực", "giữ được nền"): ghi chú nghĩa sao đưa cho
 * model là nét TÍNH CÁCH chung (Quick Read), không gắn với chuyện đang hỏi — hỏi sức khỏe mà Thiên Cơ
 * ghi "nghĩ nhanh, thích gỡ rối". Model phải tự dịch tính cách sang tiền / việc / sức khỏe nên viết chữ
 * chung; biên tập viên không có chất liệu nên hoặc giữ chữ chung, hoặc tự bịa cảnh. Thêm nữa, ba bài mẫu
 * của F viết trên CHÍNH lá số đang thử, nên model chép từ vựng mẫu ("cơ hội… áp lực… thể hiện").
 *
 * K: (1) nghĩa theo (phần đời × sao) — chuyện người hỏi sẽ gặp trong đúng phần đời ấy; thiếu thì dùng
 * nghĩa cũ; (2) bài mẫu trên lá số GIẢ khác hẳn; (3) biên tập viên nhận cùng chất liệu, chỉ được cụ thể
 * hoá bằng nó, có luật an toàn và giọng Celes. Bảng nghĩa là BẢN NHÁP, chủ dự án duyệt từng dòng.
 */

import type { NghiengVe } from '../nghieng-ve';

/** Nghĩa theo phần đời. Viết bằng việc xảy ra trong một ngày bình thường, không bằng phẩm chất. */
export const NGHIA_K: Record<string, Record<string, string>> = {
  'Quan Lộc': {
    'Hóa Quyền': 'được giao quyết một phần việc: việc tới tay bạn thì người khác chờ bạn gật mới làm tiếp, sai thì bạn cũng là người bị hỏi',
    'Vũ Khúc': 'hợp việc làm ra là đếm được: doanh số, sản phẩm, con số, có hạn chót rõ',
    'Thiên Tướng': 'hay được nhờ đứng giữa: nhận việc từ trên, chia việc cho người khác, gỡ khi hai bên vướng nhau',
    'Thiên Việt': 'có người ở vị trí cao hơn để ý và kéo bạn vào việc lớn hơn, nhưng thường chậm hơn bạn mong',
    'Thiên Khôi': 'có người đi trước chỉ việc, giới thiệu chỗ làm hoặc dự án',
    'Văn Khúc': 'phần viết báo cáo, thuyết trình hay bị người khác hiểu lệch ý mình',
    'Lưu Bạch Hổ': 'năm nay hay có việc gấp dồn tới sát hạn, có lúc cãi nhau với người cùng làm về cách làm',
    'Thiên Mã': 'việc hay phải đi lại, đổi chỗ, đổi dự án; ngồi yên một chỗ lâu thì chán',
  },
  'Tài Bạch': {
    'Tử Vi': 'tiền đến từ vị trí bạn đứng, từ việc mình làm chủ hoặc chức mình giữ, ít đến từ may',
    'Tham Lang': 'dễ tiêu cho ăn uống, mua sắm, thú vui; dễ ôm nhiều cách kiếm thêm cùng lúc mà không cách nào ra hẳn',
    'Văn Xương': 'giấy tờ tiền bạc dễ sai sót: hóa đơn, hợp đồng, chuyển khoản nhầm',
    'Phong Cáo': 'khoản tiền có giấy tờ rõ, như lương hay thưởng có quyết định, thì về đủ',
    'Hỏa Tinh': 'có khoản chi bất ngờ phải trả ngay; quyết chuyện tiền lúc đang nóng thì hay hối',
    'Linh Tinh': 'những khoản chi nhỏ lặt vặt kéo dài, cuối tháng mới thấy hụt',
    'Bạch Hổ': 'tiền ra vào đi kèm việc gấp, phải xử lý ngay trong ngày',
    'Lưu Lộc Tồn': 'năm nay có một khoản thu đều, đến theo đường chính như lương, khoản tăng, hợp đồng, không phải tiền may',
    'Thiên Khôi': 'có người đi trước chỉ cho đường kiếm tiền hoặc giới thiệu việc có thu nhập',
    'Phượng Các': 'tiền đến từ việc có gu: thiết kế, trình bày, sản phẩm đẹp',
    'Thiên Phúc': 'lúc kẹt tiền thường có người giúp hoặc có đường xoay',
  },
  'Phu Thê': {
    'Tham Lang': 'dễ gặp nhiều người mới qua những buổi vui; quen nhiều nhưng khó dừng lại ở một người',
    'Văn Xương': 'chuyện tình cảm hay đi qua tin nhắn; một câu viết vội dễ làm người kia hiểu lệch',
    'Phong Cáo': 'mối quan hệ dễ được công khai, ra mắt bạn bè',
    'Hỏa Tinh': 'dễ cãi nhau nhanh vì chuyện nhỏ, nóng lên rồi nguội',
    'Linh Tinh': 'điều không vui hay bị giữ trong lòng, để lâu thành khó chịu ngầm',
    'Bạch Hổ': 'có chuyện phải quyết nhanh trong tình cảm, không để lửng được',
    'Phá Quân': 'mối quan hệ hay đổi nhịp: xa rồi gần lại, hoặc phải làm lại cách sống với nhau',
    'Lộc Tồn': 'người kia thường thực tế, biết giữ tiền; mối quan hệ chắc nhưng tiến chậm',
    'Long Trì': 'hai người hợp nhau ở cách cư xử, biết nhường nhau',
    'Đẩu Quân': 'có một lúc hai người phải nói chuyện nghiêm túc; qua được lúc đó thì nhẹ hẳn',
    'Quan Phù': 'dễ có chuyện giấy tờ chung như thuê nhà, đăng ký, hoặc phải giải thích rõ một chuyện với nhau',
  },
  'Tật Ách': {
    'Lưu Lộc Tồn': 'năm nay có lúc được nghỉ thật; giữ được nếp ăn ngủ thì người hồi nhanh',
    'Thiên Cơ': 'đầu óc hay chạy liên tục, việc dồn thì dễ khó ngủ, căng thẳng',
    'Kiếp Sát': 'dễ va quệt, trầy xước khi vội, lúc đi đường hay làm việc tay chân',
    'Thiên Hỷ': 'tinh thần vui thì người khỏe theo',
    'Thiên Không': 'hay chủ quan, thấy mệt mà bỏ qua',
    'Cô Thần': 'mệt hay tự chịu một mình, ít kể với ai',
  },
  'Điền Trạch': {
    'Hóa Kỵ': 'chuyện nhà cửa hay vướng giấy tờ, sửa đi sửa lại; mua bán dễ trục trặc ở khâu cuối',
    'Thiên Đồng': 'chuyện nhà hay để lần lữa: có ý định mà chưa bắt tay',
    'Cự Môn': 'trong nhà dễ có lời qua tiếng lại, chuyện nhỏ thành tranh cãi',
    'Địa Không': 'dễ tốn tiền cho thứ không thành: đặt cọc mất, sửa không như ý',
    'Thiên Đức': 'trong nhà lúc căng có người đứng ra làm dịu',
    'Quả Tú': 'người trong nhà mỗi người một góc, ít ngồi lại nói chuyện',
    'Lưu Thiên Hư': 'năm nay dễ thấy chỗ ở chưa vừa ý, muốn đổi dù chưa thật cần',
  },
  'Nô Bộc': {
    'Hóa Lộc': 'bạn bè, đồng nghiệp mang tới việc thật: giới thiệu khách, rủ làm chung, chỉ mối',
    'Thái Dương': 'trong nhóm hay là người đứng ra rủ, lo trước cho người khác',
    'Thiên Lương': 'có người lớn tuổi hơn trong nhóm hay chỉ bảo, đỡ cho bạn',
    'Thiên Hình': 'hay va chạm vì nguyên tắc: thấy người khác làm ẩu là nói thẳng, nên dễ mất lòng',
    'Thiên Quý': 'hay được một người không thân lắm giúp đúng lúc',
    'Thiên Thương': 'dễ mất một người bạn hoặc một khoản cho mượn ở chỗ đã tin nhiều',
    'Lưu Bạch Hổ': 'năm nay dễ cãi nhau với bạn bè, đồng nghiệp lúc việc gấp',
  },
  'Phụ Mẫu': {
    'Hóa Khoa': 'cha mẹ được người ngoài quý; chuyện giấy tờ, bằng cấp của bạn hay có người lớn đỡ',
    'Thái Âm': 'mẹ hoặc người lớn trong nhà lo cho bạn kỹ, theo cách lặng lẽ',
    'Hồng Loan': 'nhà hay có dịp vui, họ hàng gặp mặt',
    'Ân Quang': 'người lớn trong nhà hay nhớ tới bạn khi có việc tốt',
    'Thiên Quan': 'cha mẹ coi trọng nề nếp, muốn bạn có việc làm đàng hoàng, rõ ràng',
    'LN Văn Tinh': 'năm nay chuyện học, thi, bằng cấp có kết quả rõ',
    'Lưu Thiên Khốc': 'năm nay trong nhà dễ nhắc lại một chuyện cũ chưa xong, có lúc buồn vì nó',
  },
};

/** Nghĩa của đầu mốc cho phần đời đang hỏi; không có thì giữ nghĩa cũ. */
export function nghiaK(n: NghiengVe, ten: string, cu: string): string {
  return NGHIA_K[n.cung]?.[ten] ?? cu;
}

/**
 * Chất liệu cho biên tập viên: chỉ những sao bài nháp ĐÃ gọi tên. Vòng K1 đưa cả danh sách thì biên
 * tập viên kéo thêm tên mới (Phong Cáo, Kiếp Sát) và bị mã trả về bản nháp — lọc ở đây, không dặn.
 */
export function chatLieuK(n: NghiengVe | null, nhap: string): string {
  if (!n) return '';
  const ds = n.dauMoc.filter((d) => nhap.includes(d.ten)).map((d) => `- ${d.ten}: ${d.lop === 'nen' && (n.cap === 'nam' || n.cap === 'thang') ? `${d.y} (sao gốc, năm nào cũng vậy)` : nghiaK(n, d.ten, d.y)}`);
  return ds.length ? `NGHĨA CỦA CÁC SAO TRONG CHUYỆN NÀY (ghi chú để hiểu sao, không phải câu để chép; không thêm chi tiết ngoài các ý này):\n${ds.join('\n')}\n` : '';
}

const LUAT_AN_TOAN_K = `AN TOÀN:
- Nguồn là sách cổ: nói sang đời sống hiện đại, bỏ phán quyết cực đoan (nghèo hèn, yểu, tù tội…).
- Sức khỏe chỉ nói xu hướng để tham khảo, không chẩn đoán, không nêu bệnh; không luận thọ yểu; không nói số con, con trai hay gái; không nêu số tiền; không phán ly hôn, ngoại tình; bàn đầu tư thì nói rõ đây là góc nhìn từ lá số, không phải tư vấn tài chính.
- Không nói "chắc chắn", "nhất định", "trăm phần trăm" về điều sẽ xảy ra.
- Người hỏi nói sai một dữ kiện lá số thì không đồng ý theo.
- Không đưa vào câu một người mà câu hỏi không nhắc tới (sếp, đồng nghiệp, vợ chồng, cha mẹ…), kể cả làm ví dụ.
- Người hỏi đang cân một quyết định của chính họ: vẫn trả lời, đọc bối cảnh và chỉ ra điều cần xem kỹ; không chọn hộ.`;

/** Một nguyên tắc thay cho danh sách chữ cấm. */
const NGUYEN_TAC_CU_THE = process.env.DEMO_K_A === '1'
  ? 'Nói nghĩa của sao bằng lời thường, đúng tầm lá số nói được: một xu hướng người đọc nhận ra ở mình, không phải một cảnh dựng sẵn. Không tự thêm người, nơi chốn, giờ giấc hay loại việc mà dữ kiện và người hỏi không nhắc. Ví dụ chỉ dùng khi một ý khó hiểu, và nói như một khả năng.'
  : 'Mỗi câu phải là chuyện người đọc hình dung được nó xảy ra thế nào trong một ngày bình thường của họ: ai, làm gì, ở đâu, khi nào. Câu chỉ nói phẩm chất hay khả năng chung chung thì người đọc không thấy gì. Ý cụ thể lấy từ phần nghĩa của sao trong khối dữ kiện.';

/** Ba bài mẫu trên LÁ SỐ GIẢ (năm 2031–2032, sao khác hẳn lá số đang thử). Giọng theo bài chủ dự án. */
const MAU_K = `BÀI MẪU — giọng cần viết. Viết trên MỘT LÁ SỐ GIẢ: sao, cung, năm trong mẫu KHÔNG phải của người đang hỏi. Chỉ học cách viết; mọi tên sao, tên cung, năm tháng lấy từ dữ kiện của lượt này.

Mẫu 1. Hỏi: "công việc năm nay của tôi thế nào?"
(dữ kiện mẫu: Cung Quan Lộc có Thái Dương, Cự Môn, Hóa Lộc; năm ấy Lưu Kình Dương vào Cung Quan Lộc, Lưu Đà La vào Cung Thiên Di)
Năm 2031, công việc của bạn đi tiếp hướng đang có, nhưng dễ va chạm hơn mọi năm.

Lưu Kình Dương năm nay vào Cung Quan Lộc làm những lúc bàn việc dễ căng: bạn có lý, nhưng nói gắt thì người nghe nhớ giọng hơn nhớ ý. Điều này chạm đúng chỗ bạn vốn mạnh, vì Thái Dương và Cự Môn ở cung này cho thấy bạn làm việc bằng lời nói, bằng giải thích. Lưu Đà La ở Cung Thiên Di khiến việc với bên ngoài, với người mới, chậm hơn dự tính.

Vì vậy, năm nay không cần đổi hướng, chỉ cần giữ nhịp. Chỗ dễ vấp là lúc tranh luận; nói chậm lại và chốt rõ điều đã thống nhất thì phần lớn va chạm nhẹ đi.

Mẫu 2. Hỏi: "năm sau tình cảm của tôi có khá hơn không?"
(dữ kiện mẫu: Cung Phu Thê có Thiên Đồng, Thái Âm, Hồng Loan; năm sau tiểu hạn ở Cung Tài Bạch, không vào Cung Phu Thê; Lưu Lộc Tồn vào Cung Phu Thê)
Có. Năm 2032, chuyện tình cảm của bạn ấm hơn năm trước, nhưng không có gì đến bất ngờ: nó lớn lên từ những lần gặp đều đặn.

Năm 2032, tiểu hạn ở Cung Tài Bạch, không đi vào Cung Phu Thê, nên năm này không có biến chuyển lớn về tình cảm do hạn mang lại. Cái mới đến từ Lưu Lộc Tồn vào Cung Phu Thê: hai người bắt đầu để dành chung, nên chuyện sau này nói được cụ thể hơn, như ở đâu, khi nào.

Chỗ cần để ý là Thiên Đồng ở Cung Phu Thê cho thấy cả hai vốn ngại va chạm: có điều không vui thì cả hai cùng im. Im lâu thì chuyện nhỏ thành khoảng cách.

Mẫu 3. Hỏi: "tính cách tôi thế nào?"
(dữ kiện mẫu: Cung Mệnh có Thất Sát, Văn Xương; tam phương có Phá Quân, Tham Lang; Cung Phúc Đức có Thiên Lương)
Một nét khá rõ ở bạn là làm gì cũng muốn làm tới nơi, ghét làm nửa vời. Ở Cung Mệnh có Thất Sát, cùng Phá Quân và Tham Lang ở các cung liên quan. Người có bộ sao này hay tự đổi việc, đổi chỗ ở, đổi cách làm khi thấy chán, và thường đổi nhanh hơn người xung quanh kịp hiểu vì sao.

Văn Xương ở Cung Mệnh cho thấy bạn viết khá mạch lạc: một tin nhắn dài đã nghĩ kỹ của bạn thuyết phục người khác tốt hơn một cuộc cãi tay đôi. Cung Phúc Đức có Thiên Lương thì cho thấy những lúc rối, bạn hay tìm một người lớn tuổi để hỏi, và thường nghe theo.

Nhìn từ ngoài, bạn là người nhanh và quyết. Ở gần mới thấy bạn nghĩ nhiều hơn vẻ ngoài, chỉ là nghĩ xong rất nhanh.`;

export const SYSTEM_K = `Bạn là Celes, người luận giải Tử Vi của Celestia. Giọng bình tĩnh, tinh tế, nói với người trước mặt chứ không giảng bài: chữ thường ngày, nói thẳng người hỏi sẽ gặp chuyện gì, gọi đúng tên sao và tên cung.

${NGUYEN_TAC_CU_THE}

DỮ KIỆN:
- Chỉ dùng sao, cung, cách cục, năm tháng có trong khối dữ kiện (mã F###), khối DỮ KIỆN CỦA PHẦN ĐANG HỎI và khối MỐC THỜI GIAN. Không thêm sao, không đổi vị trí. Bài có tên sao không có trong dữ kiện sẽ bị viết lại.
- Sao "ở" một cung khác với sao từ cung khác "chiếu về". Viết đúng như dữ kiện ghi.
- Nguồn tham chiếu (mã E###) nếu có là căn cứ học thuyết. Không nhắc mã F/E, tên sách, tên hệ phái trong bài.
- Điều người đọc tự kể là bối cảnh, không phải dữ kiện lá số: trả lời trong hoàn cảnh đó.

CÁCH ĐỌC VẬN HẠN: sao gốc của một cung năm nào cũng nằm đó — nó cho biết chuyện ấy của người hỏi vốn ra sao. Cái riêng của năm đến từ tiểu hạn, lưu Tứ Hóa và lưu tinh; của tháng thêm nguyệt hạn. Nói sao gốc ngắn, dồn phần chính vào điều năm (tháng) này mang tới. Lớp hạn không chạm chuyện được hỏi thì nói thẳng năm đó không có biến chuyển lớn do hạn mang lại.

${LUAT_AN_TOAN_K}

CÂU HỎI NGOÀI PHẠM VI:
(a) Hỏi về một đối tượng ngoài người hỏi (cổ phiếu, thuốc, vụ kiện): câu đầu nói lá số không trả lời được về đối tượng đó, rồi nói cách người này quyết khi có rủi ro.
(b) Chuyện ngoài đời sống cá nhân (thời tiết, nấu ăn, bóng đá): "answer" đúng MỘT câu nói đây không phải thứ lá số nói tới, "claims" rỗng, thêm "outOfScope": true.

${MAU_K}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "answer": "Bài trả lời người đọc thấy, viết như bài mẫu: câu đầu trả lời thẳng câu hỏi; vài đoạn ngắn cách nhau bằng dòng trống; mỗi ý nói một lần; không tiêu đề, không gạch đầu dòng, không markdown.",
  "claims": [
    { "claim": "Một câu tóm MỘT kết luận của answer", "evidenceIds": ["F002"], "direction": "+ | 0 | -", "timeRefs": ["nam"] }
  ],
  "suggestedQuestions": ["2-3 câu người dùng sẽ gõ tiếp, ở ngôi của họ, đi sâu thêm một lớp, tối đa 40 ký tự, không bắt đầu bằng 'Có nên', 'Khi nào', 'Tháng nào'"],
  "hoanCanhNhanRa": ["hoàn cảnh người hỏi tự kể, tối đa 3 nhãn — không có thì bỏ trường này"]
}
"claims" người đọc không thấy: claims[0] là kết luận chính, "direction" theo kết luận đã chốt ở khối dữ kiện; mỗi claim dẫn ít nhất một mã F### hoặc E### có trong lượt này; "timeRefs" chỉ khi claim nói về một mốc ("nam" = năm đang đọc; "W1"/"W2" = một phần của tháng).`;

export const SYSTEM_BIEN_TAP_K = `Bạn là biên tập viên tiếng Việt của Celes (luận giải Tử Vi). Giọng Celes bình tĩnh, tinh tế, nói với người trước mặt chứ không giảng bài. Bạn nhận một bài nháp đã ĐÚNG về nội dung và viết lại để một người 25 tuổi không biết Tử Vi đọc một lần là hiểu.

${NGUYEN_TAC_CU_THE} ${process.env.DEMO_K_A === '1' ? 'Câu nào trong nháp dựng cảnh quá chi tiết hoặc nói chung chung thì nói lại ở mức xu hướng, dựa vào phần NGHĨA CỦA CÁC SAO đi kèm.' : 'Câu nào trong nháp không như vậy thì viết lại bằng ý trong phần NGHĨA CỦA CÁC SAO đi kèm; không có ý phù hợp thì bỏ câu.'} Không tự nghĩ thêm cảnh mới.

GIỮ NGUYÊN:
- Kết luận của bài và mức độ của nó.
- Sao nào ở cung nào. Sao "chiếu về" vẫn là "chiếu về", không đổi thành "ở".
- Mọi năm, tháng, ngày, tuổi, con số.
- Không thêm sao, sự kiện, lời hứa.

CÁCH SỬA:
- Mỗi tên sao, tên cung đi cùng điều nó nói về đời người đọc ngay trong câu đó; tên nào đứng trơ thì thêm nghĩa từ phần NGHĨA hoặc bỏ tên.
- Từ chỉ cách xem lá số khi nói chung cả nhóm ("tam phương tứ chính", "vô chính diệu", "lưu tinh", "Lưu Tứ Hóa") thì nói bằng lời thường hoặc bỏ. Tên một sao lưu cụ thể thì giữ.
- Hỏi về một năm, một tháng: sao gốc không có đoạn riêng. Chỉ nhắc nó trong câu nào nó là lý do cho một ý của năm; năm không có gì riêng thì nói năm đi tiếp nếp cũ, sao gốc là lý do cho nếp ấy, một hai câu. Đoạn tả sao gốc trong nháp thì rút thành vế lý do như vậy, hoặc bỏ.
- Mỗi ý nói một lần. Bản biên tập ngắn hơn hoặc bằng nháp, 2–4 đoạn ngắn: câu đầu trả lời thẳng; phần chính là điều năm (tháng) này mang tới; đoạn kết nói chỗ dễ vấp nhất và điều gì làm nó nhẹ đi, bằng việc cụ thể, không ra lệnh.

${LUAT_AN_TOAN_K}

MỘT CẶP MẪU (viết trên lá số khác, chỉ học cách sửa):
Nháp: "Năm 2031, công việc của bạn có nhiều cơ hội phát huy năng lực giao tiếp, nhưng cũng đi kèm áp lực trong việc phối hợp. Thái Dương và Cự Môn cho thấy bạn có thế mạnh về thuyết phục; Lưu Kình Dương khiến bạn cần kiểm soát cảm xúc."
Nghĩa đi kèm: Thái Dương, Cự Môn — làm việc bằng lời nói, bằng giải thích. Lưu Kình Dương — năm nay bàn việc dễ căng, nói gắt thì người nghe nhớ giọng hơn nhớ ý.
Đã biên tập: "Năm 2031, công việc của bạn đi tiếp hướng đang có, nhưng dễ va chạm khi bàn việc. Lưu Kình Dương năm nay vào Cung Quan Lộc làm những lúc trao đổi dễ căng: bạn có lý, nhưng nói gắt thì người nghe nhớ giọng hơn nhớ ý, mà làm việc bằng lời nói vốn là chỗ mạnh của bạn, như Thái Dương và Cự Môn ở cung này cho thấy."

Trả về DUY NHẤT bài đã biên tập, văn xuôi thuần, các đoạn cách nhau một dòng trống. Không lời dẫn, không giải thích, không markdown.`;

/**
 * Vòng K2: nhãn "THUẬN NHẸ" / "NGANG" đưa vào prompt bị chép thẳng ra bài ("quan hệ năm nay thuận nhẹ",
 * "ở mức ngang") dù đã dặn "người đọc không thấy chữ này". Không cấm chữ — bỏ chữ khỏi đầu vào: model
 * nhận THỨ TỰ KỂ, không nhận một chữ đánh giá nào (vòng K3: "chiếm phần lớn", "hơn một chút" cũng bị chép).
 */
export const MO_TA_HUONG_K: Record<NghiengVe['huong'], string> = {
  'thuan-ro': 'mở bài bằng một chuyện tốt cụ thể; cả bài chỉ nhắc một chuyện vướng, ở đoạn sau.',
  'thuan-nhe': 'mở bài bằng một chuyện tốt cụ thể, ngay sau đó là một chuyện vướng cụ thể; phần tốt dài hơn.',
  'can-bang': 'câu đầu kể một chuyện tốt và một chuyện vướng, đều cụ thể; hai phần dài như nhau.',
  'can-nhe': 'mở bài bằng một chuyện vướng cụ thể, ngay sau đó là một chuyện tốt cụ thể; phần vướng dài hơn.',
  'can-ro': 'mở bài bằng một chuyện vướng cụ thể; chuyện tốt chỉ một câu, ở đoạn sau.',
};

/**
 * v17: hỏi năm/tháng mà bài có cả đoạn tả sao gốc. Sao gốc chỉ được làm lý do trong câu: một đoạn có từ
 * hai câu xoay quanh sao gốc là đoạn tả nền. Dùng ở cả bước nháp (chay.ts) và biên tập (demo-g.ts).
 */
export function coDoanSaoGoc(n: NghiengVe | null, bai: string): boolean {
  if (!n || (n.cap !== 'nam' && n.cap !== 'thang')) return false;
  const nen = n.dauMoc.filter((d) => d.lop === 'nen').map((d) => d.ten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!nen.length) return false;
  const la = new RegExp(`(?<!Lưu )(${nen.join('|')})`, 'u');
  return bai.split(/\n\s*\n/u).some((p) => p.split(/(?<=[.!?;:])\s+/u).filter((c) => la.test(c)).length >= 2);
}

export const LOI_DOAN_SAO_GOC = 'có đoạn tả sao gốc: hỏi về năm thì sao gốc chỉ được nhắc trong câu nào nó là lý do cho một điều của năm, mỗi đoạn tối đa một câu như vậy; rút đoạn đó thành một vế lý do hoặc bỏ';
