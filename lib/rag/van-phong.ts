/**
 * VĂN PHONG LUẬN GIẢI CELES — bộ quy tắc rút ra từ một bản người viết lại.
 *
 * ---------------------------------------------------------------------------
 * NÓ ĐẾN TỪ ĐÂU
 *
 * Chủ dự án lấy nguyên một bản đọc sâu do máy sinh, giữ nguyên mọi nhận định,
 * rồi viết lại CÁCH NÓI. Không thêm một dữ kiện nào, không bỏ một kết luận
 * nào — chỉ đổi cách đặt câu, cách gọi tên đề mục, cách dẫn người đọc đi.
 *
 * Bản viết lại ấy đọc hay hơn hẳn, và cái hay ấy KHÔNG nằm ở chữ đẹp. Nó nằm
 * ở vài thói quen lặp đi lặp lại, đếm được. Tệp này là những thói quen đó,
 * tách khỏi một lá số cụ thể để dùng cho mọi lá số về sau.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO TÁCH RA MỘT TỆP RIÊNG
 *
 * Nhét mấy đoạn này thẳng vào prompt của bản đọc sâu thì chúng chỉ sống ở đó.
 * Chat, bài dài, bảng lĩnh vực sẽ tiếp tục viết theo lối cũ, và sản phẩm nói
 * bằng hai giọng. Đặt ở một chỗ thì bề mặt nào cũng dùng được, và sửa một lần
 * là sửa cho tất cả.
 *
 * ---------------------------------------------------------------------------
 * BỐN QUY TẮC, VÀ VÌ SAO LÀ BỐN NÀY
 *
 * Bản viết lại khác bản máy ở rất nhiều chỗ nhỏ. Nhưng phần lớn chỗ nhỏ ấy đã
 * có luật rồi — cấm chữ trừu tượng, câu cảnh, nhịp câu, một tên sao mỗi câu.
 * Bốn điều dưới đây là thứ CHƯA có luật nào chạm tới, và chúng là thứ làm bản
 * viết lại đọc như người viết chứ không như máy điền.
 */

/**
 * Quy tắc 1 — CẶP PHÂN BIỆT.
 *
 * Bản viết lại dùng đi dùng lại một khuôn: nói rõ điều này KHÔNG phải là gì,
 * rồi mới nói nó là gì. "Bạn không cần một cuộc đời không có thay đổi để thấy
 * bình yên. Bạn cần biết mình đang thay đổi vì điều gì."
 *
 * Nó không phải thủ pháp tu từ. Người đọc bước vào bài với một cách hiểu sẵn
 * trong đầu, và nếu không gỡ cách hiểu ấy ra trước thì câu đúng đi vào cũng
 * bị đọc lệch. Nói "bạn cần ổn định" thì họ nghe thành "đừng thay đổi". Phải
 * chặn nghĩa sai trước, nghĩa đúng mới có chỗ.
 */
const THAN_CAP_PHAN_BIET = `Nói rõ điều này KHÔNG phải là gì, rồi mới nói nó là gì.
  "Thứ bạn cần không phải luôn luôn thay đổi, cũng không phải giữ mọi thứ nguyên như cũ. Bạn cần một cuộc sống đủ ổn để mình vẫn có thể tiếp tục phát triển."
  "Điều làm bạn mệt không phải lúc nào cũng là số giờ làm. Nhiều khi đó là số việc vẫn còn nằm trong đầu mà chưa có điểm kết thúc."
Người đọc bước vào với một cách hiểu sẵn. Không gỡ cách hiểu ấy ra trước thì
câu đúng đi vào cũng bị đọc lệch.`;

export const QUY_TAC_CAP_PHAN_BIET = `CẶP PHÂN BIỆT — mỗi phần ít nhất một lần.
${THAN_CAP_PHAN_BIET}`;

/**
 * Quy tắc 2 — CÂU HỎI CỦA CHÍNH NGƯỜI ĐỌC.
 *
 * Bản viết lại đặt vào bài đúng câu mà người đọc đang tự hỏi, viết ở ngôi thứ
 * nhất: "Tôi có tự lo được cho cuộc sống của mình không?", "Mình đang cố vì
 * điều này vẫn quan trọng với mình, hay chỉ vì mình sợ cảm giác mình chưa đủ
 * tốt?"
 *
 * Một câu hỏi buộc người đọc dừng lại và tự trả lời. Một câu khẳng định thì họ
 * chỉ gật hoặc lắc rồi đọc tiếp. Đây là chỗ khác nhau giữa một bài được đọc và
 * một bài được lướt.
 */
export const QUY_TAC_CAU_HOI = `CÂU HỎI CỦA CHÍNH NGƯỜI ĐỌC — mỗi phần ít nhất một câu.
Đặt vào bài đúng câu họ đang tự hỏi, viết ở ngôi của họ:
  "Tôi có tự lo được cho cuộc sống của mình không?"
  "Bao nhiêu là đủ để mình cảm thấy an toàn mà vẫn được sống?"
  "Mình đang cố vì điều này vẫn quan trọng với mình, hay chỉ vì mình sợ cảm giác mình chưa đủ tốt?"
Một câu hỏi buộc người đọc dừng lại và tự trả lời. Một câu khẳng định thì họ
gật hoặc lắc rồi đọc tiếp.
KHÔNG dùng câu hỏi tu từ mà chính bạn trả lời ngay ở câu sau. Hỏi xong thì để
đấy, hoặc trả lời bằng một điều đọc được từ lá số.`;

/**
 * Quy tắc 3 — CÂU GIỮ LẠI.
 *
 * Mỗi phần trong bản viết lại kết bằng một khối có tên: "Điều Celes muốn bạn
 * giữ lại". Một câu, nói thẳng thứ đáng mang theo.
 *
 * Một phần đọc sâu dài năm sáu trăm từ. Không có câu này thì người đọc gấp
 * trang lại với một mớ nhận định rời, và thứ họ nhớ là ngẫu nhiên. Có nó thì
 * chính bài chọn giúp họ điều đáng nhớ nhất.
 *
 * Nó KHÔNG phải bản tóm tắt. Tóm tắt là nói lại ngắn hơn; câu này nói một điều
 * mà cả phần vừa rồi dẫn tới nhưng chưa nói thẳng.
 */
export const QUY_TAC_GIU_LAI = `CÂU GIỮ LẠI — mỗi phần đúng một câu, đặt ở trường "giuLai".
Một tới hai câu, nói thẳng thứ đáng mang theo sau khi đọc xong phần này.
  "Bạn không yếu vì cần nghỉ. Với một người có đầu óc luôn hoạt động như bạn, biết dừng đúng lúc cũng là một khả năng."
  "Điểm mạnh của bạn là khả năng chịu trách nhiệm. Nhưng trách nhiệm chỉ thật sự là sức mạnh khi bạn có quyền lựa chọn và quyền từ chối."
KHÔNG phải bản tóm tắt. Tóm tắt là nói lại ngắn hơn; câu này nói một điều mà
cả phần vừa rồi dẫn tới nhưng chưa nói thẳng.
KHÔNG phải lời khuyên. Không mở bằng "hãy", "nên", "cần phải".`;

/**
 * Quy tắc 4 — MỞ BẰNG NGƯỜI ĐỌC, KHÔNG MỞ BẰNG LÁ SỐ.
 *
 * Bản máy hay mở bằng dữ kiện rồi mới tới người: "Sát Phá Tham kéo phần bên
 * trong về phía thay đổi, nên bạn…". Bản viết lại đảo lại: nói về người trước,
 * dữ kiện đi sau như phần giải thích.
 *
 * Người đọc mở bài lên để đọc về mình. Câu đầu tiên mà là một cái tên họ không
 * biết thì họ đã phải trả một khoản phí trước khi nhận được gì.
 */
const THAN_MO_BANG_NGUOI = `Tên sao xuất hiện ở câu sau, như phần giải thích cho điều vừa nói.
  Sai:  "Sát Phá Tham kéo phần bên trong về phía thay đổi, nên bạn khó ngồi yên."
  Đúng: "Bạn khó ở mãi trong một nhịp sống chỉ vì nó an toàn. Sát Phá Tham ở phần đời sống bên trong cho thấy điều đó."
Người đọc mở bài lên để đọc về mình. Câu đầu mà là một cái tên họ không biết
thì họ đã phải trả một khoản phí trước khi nhận được gì.`;

export const QUY_TAC_MO_BANG_NGUOI = `MỞ BẰNG NGƯỜI ĐỌC, KHÔNG MỞ BẰNG LÁ SỐ.
Câu đầu của mỗi tiêu chí nói về HỌ. ${THAN_MO_BANG_NGUOI}`;

/** Khối gộp, dán vào prompt của mọi bề mặt luận giải dài */
export const VAN_PHONG_CELES = [
  'BỐN THÓI QUEN VIẾT — rút từ một bản người viết lại, và là thứ làm bài đọc ra như người viết chứ không như máy điền.',
  '',
  QUY_TAC_MO_BANG_NGUOI,
  '',
  QUY_TAC_CAP_PHAN_BIET,
  '',
  QUY_TAC_CAU_HOI,
  '',
  QUY_TAC_GIU_LAI,
].join('\n');

/**
 * KHỐI CHO CHAT — hai trong bốn quy tắc, và đó là một lựa chọn, không phải bản
 * rút gọn cho đỡ tốn chỗ.
 *
 * Chat khác bài dài ở HÌNH, không ở giọng. Một lượt chat là vài trăm từ trả lời
 * đúng câu vừa hỏi; bản đọc sâu là năm sáu trăm từ cho mỗi phần đời. Hai quy
 * tắc còn lại đã có chỗ đứng sẵn trong hình của chat, và đưa vào lần nữa thì
 * chúng đánh nhau với thứ đang chạy tốt:
 *
 *   - CÂU HỎI CỦA CHÍNH NGƯỜI ĐỌC. Bài chat đã khép bằng `hoiLai` — câu hỏi
 *     ngược, hỏi thứ người dùng biết mà lá số không biết. Prompt chat có sẵn
 *     một luật đo được: đúng MỘT câu hỏi, vì hai câu hỏi cùng lúc thì người ta
 *     trả lời một câu rồi bỏ câu kia. Thêm một câu tự vấn nữa là tự phá luật
 *     ấy, và thứ mất đi là câu lấy được dữ kiện đời thực cho lượt sau.
 *   - CÂU GIỮ LẠI. Nó sinh ra để khép một phần dài. Chat đặt kết luận ở ĐẦU
 *     bài — người hỏi "có nên nhận offer" cần câu trả lời ở dòng đầu chứ không
 *     phải ở đoạn cuối — rồi khép bằng `tuKiem` và `hoiLai`. Một câu khép thứ
 *     ba chỉ làm loãng hai câu kia.
 *
 * Hai quy tắc giữ lại thì không vướng gì: chúng nói về CÁCH ĐẶT CÂU bên trong
 * mỗi ý, nên bề mặt nào cũng dùng được.
 */
const QUY_TAC_MO_BANG_NGUOI_CHAT = `MỞ BẰNG NGƯỜI ĐỌC, KHÔNG MỞ BẰNG LÁ SỐ.
Câu đầu của mỗi ý nói về HỌ. ${THAN_MO_BANG_NGUOI}`;

const QUY_TAC_CAP_PHAN_BIET_CHAT = `CẶP PHÂN BIỆT — ít nhất một lần trong cả bài trả lời.
${THAN_CAP_PHAN_BIET}`;

/** Khối gộp cho chat — xem ghi chú ngay trên về việc vì sao chỉ có hai quy tắc */
export const VAN_PHONG_CELES_CHAT = [
  'HAI THÓI QUEN VIẾT — cùng bộ luật với bài dài, để hai bề mặt của một sản phẩm không nói bằng hai giọng.',
  '',
  QUY_TAC_MO_BANG_NGUOI_CHAT,
  '',
  QUY_TAC_CAP_PHAN_BIET_CHAT,
].join('\n');

/* -------------------------------------------------------------------------- */
/* PHÉP ĐẾM — để bốn quy tắc trên không trôi thành lời khuyên suông             */
/* -------------------------------------------------------------------------- */

const CAP_PHAN_BIET = [
  'không phải',
  'chưa phải',
  'không hẳn',
  'không nhất thiết',
  'thay vì',
  'chứ không',
];

/** Đoạn có dùng cặp phân biệt không — xem QUY_TAC_CAP_PHAN_BIET */
export function coCapPhanBiet(van: string): boolean {
  const s = van.toLowerCase();
  return CAP_PHAN_BIET.some((x) => s.includes(x));
}

/**
 * Đoạn có câu hỏi thật không.
 *
 * Đếm dấu hỏi chứ không đoán theo từ để hỏi: "bạn cần biết mình muốn gì" có
 * chữ "gì" mà không phải câu hỏi, còn "Bao nhiêu là đủ?" thì có.
 */
export function soCauHoi(van: string): number {
  return (van.match(/\?/g) ?? []).length;
}
