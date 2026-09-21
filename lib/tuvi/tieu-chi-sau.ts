import type { MucId } from './chang-cung';

/**
 * Bảy mươi bảy tiêu chí của BẢN ĐỌC SÂU, một bảng cho cả mười hai phần.
 *
 * ---------------------------------------------------------------------------
 * BẢNG NÀY BÓC BẰNG MÁY TỪ SPEC, KHÔNG CHÉP TAY
 *
 * `Celestia_Luan_Giai_12_Cung_Spec_v1.md` mục 4 liệt kê tiêu chí cho từng
 * phần — tổng cộng bảy mươi bảy dòng. Chép tay chừng ấy dòng là chắc chắn sai
 * ở đâu đó, và sai ở đây không báo lỗi: nó chỉ làm một phần đời bị luận thiếu
 * một góc, mà không ai biết góc nào đã mất.
 *
 * Nếu spec đổi, chạy lại bộ bóc thay vì sửa tay từng dòng ở đây.
 *
 * ---------------------------------------------------------------------------
 * MỖI PHẦN ĐÚNG MỘT TIÊU CHÍ `laGuong`
 *
 * Đó là khối đảo màu, đọc phần này QUA cung đối diện. Spec đòi đủ 12/12 phần
 * có khối gương, và bộ bóc đã chặn: phần nào không đúng một tiêu chí gương thì
 * nó dừng chứ không ghi ra file.
 *
 * Khối gương là thứ làm bài đọc không tuyến tính — không phần nào đọc một
 * mình, và đó là điều spec mục 12 nêu làm USP.
 */

export interface TieuChiSau {
  /** Nhãn hiển thị, dùng body-lg 18/600 chứ KHÔNG dùng h3 — spec mục 7.2 */
  nhan: string;
  /** Mô tả cho model biết tiêu chí này phải trả lời điều gì */
  moTa?: string;
  /** true => render thành khối đảo màu, đọc qua cung gương */
  laGuong?: boolean;
}

export const TIEU_CHI_SAU: Record<MucId, readonly TieuChiSau[]> = {
  'menh': [
    {
      nhan: 'Nét chủ đạo trong cách bạn sống',
      moTa: 'L1→L4; nêu cách cục nếu thành cách',
    },
    {
      nhan: 'Từ điều bạn coi trọng đến khả năng tự đứng vững',
      moTa: 'cái sẵn có từ đầu đối với cái hình thành sau; Thân cư cung nào thì trọng tâm đời dịch về đâu',
    },
    {
      nhan: 'Thành quả của bạn thường đến theo cách nào',
      moTa: 'hợp hay khắc, quyết định đời phát sớm hay muộn',
    },
    {
      nhan: 'Bạn ra quyết định như thế nào',
      moTa: 'nhanh/chậm, dựa dữ kiện hay cảm nhận, điều gì khiến bạn đổi ý',
    },
    {
      nhan: 'Điều gì thường quan trọng với bạn trước tiên',
      moTa: 'tam hợp Tài Bạch + Quan Lộc: bạn hy sinh cái nào trước khi buộc phải chọn',
    },
    {
      nhan: 'Điều người khác dễ hiểu nhầm về bạn',
      moTa: 'khoảng cách giữa bản chất và hình ảnh',
      laGuong: true,
    },
    {
      nhan: 'Khi nào con người này phát huy tốt nhất',
      moTa: '+ lực ngược nếu thiếu điều kiện',
    },
  ],
  'phuc-duc': [
    {
      nhan: 'Điều gì thật sự làm bạn thấy yên',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Phần bạn được trao từ trước',
      moTa: 'nền tinh thần thừa hưởng; điều gì được cho sẵn, điều gì phải tự gây dựng',
    },
    {
      nhan: 'Nỗi bất an khó nhận ra',
      moTa: 'dạng lo âu đặc trưng của cấu trúc này',
    },
    {
      nhan: 'Bạn tìm chỗ dựa tinh thần ở đâu',
      moTa: 'thứ bạn tin vào khi mọi thứ khó; tam hợp Phu Thê: bạn cần ai ở cạnh để thấy yên',
    },
    {
      nhan: 'Sự an yên và tiền',
      moTa: 'vì sao ngưỡng "đủ" của bạn co giãn; vì sao tăng thu nhập chưa chắc hết lo',
      laGuong: true,
    },
    {
      nhan: 'Càng về sau, bình yên của bạn đổi thế nào',
      moTa: 'và điều kiện để "yên thật" thay vì "yên tạm"',
    },
  ],
  'tat-ach': [
    {
      nhan: 'Nhịp năng lượng tự nhiên của bạn',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Bạn thường quá tải theo kiểu nào',
      moTa: 'thể chất trước hay tinh thần trước, và chuỗi dẫn tới nó',
    },
    {
      nhan: 'Cơ thể thường lên tiếng theo cách nào',
      moTa: 'theo ngũ hành cung và chính tinh — mô tả xu hướng, không định bệnh',
    },
    {
      nhan: 'Không gian ảnh hưởng tới bạn nhiều hơn bạn nghĩ',
      moTa: 'tam hợp Điền Trạch (không gian sống) + Huynh Đệ (người san sẻ)',
    },
    {
      nhan: 'Áp lực kỳ vọng',
      moTa: 'stress đến từ bề trên / chuẩn mực đã cài từ nhỏ',
      laGuong: true,
    },
    {
      nhan: 'Giai đoạn cần đặc biệt giữ nhịp',
      moTa: 'lời khuyên về thói quen, không về thuốc',
    },
  ],
  'quan-loc': [
    {
      nhan: 'Cách bạn làm việc',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Người khác thật sự trả tiền cho điều gì ở bạn',
      moTa: 'phân biệt với thứ bạn giỏi nhưng không tạo giá trị trao đổi',
    },
    {
      nhan: 'Môi trường nào giúp bạn phát huy tốt',
      moTa: 'làm công / làm chủ / làm nghề tự do, kèm điều kiện, không phán quyết',
    },
    {
      nhan: 'Bạn thường đi lên bằng con đường nào',
      moTa: 'tam hợp Mệnh + Tài Bạch: lên bằng chuyên môn, bằng quan hệ, hay bằng việc mở địa bàn mới',
    },
    {
      nhan: 'Cách bạn dễ bị mắc kẹt',
      moTa: 'kiểu vấp có xu hướng lặp và dấu hiệu nhận ra sớm',
    },
    {
      nhan: 'Cái giá sự nghiệp có thể lấy',
      moTa: 'sự nghiệp lấy đi gì của đời sống riêng',
      laGuong: true,
    },
    {
      nhan: 'Giai đoạn nghề nghiệp hiện tại',
      moTa: 'đại vận nào mở, đại vận nào nên tích lũy + điều đáng cân nhắc',
    },
  ],
  'tai-bach': [
    {
      nhan: 'Tiền thường đến từ đâu',
      moTa: 'nguồn chính / nguồn phụ / nguồn chỉ nên thử trong giai đoạn nhất định. L1→L5',
    },
    {
      nhan: 'Dòng tiền của bạn có đặc điểm gì',
      moTa: 'vào đều hay vào theo đợt; điểm rò rỉ thật sự nằm ở đâu',
    },
    {
      nhan: 'Cách quản lý tiền hợp với bạn',
      moTa: 'cơ chế hợp với tính cách (tự động hóa hay kiểm soát thủ công), và vì sao cách còn lại sẽ thất bại với bạn',
    },
    {
      nhan: 'Tâm lý của bạn khi đầu tư',
      moTa: 'chịu rủi ro tới đâu, phản ứng điển hình khi thị trường ngược chiều, sai lầm tâm lý đặc trưng',
    },
    {
      nhan: 'Tài sản được xây lên tốt nhất bằng cách nào',
      moTa: 'tam hợp Mệnh + Quan Lộc cho biết tiền sinh từ năng lực nào',
    },
    {
      nhan: 'Tiền và cảm giác đủ',
      moTa: 'vì sao ngưỡng "đủ" co giãn; vì sao tăng thu nhập chưa chắc hết lo',
      laGuong: true,
    },
    {
      nhan: 'Những kiểu rủi ro đáng nhận ra sớm',
      moTa: '2–3 rủi ro cụ thể, mỗi rủi ro kèm dấu hiệu nhận biết sớm',
    },
  ],
  'thien-di': [
    {
      nhan: 'Người khác thường nhìn thấy gì ở bạn',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Khoảng cách giữa vẻ ngoài và con người thật',
      moTa: 'một trong những insight "dính" nhất toàn bài',
      laGuong: true,
    },
    {
      nhan: 'Cơ hội thường đến từ đâu',
      moTa: 'người giới thiệu, môi trường mới, hay tự tìm',
    },
    {
      nhan: 'Chuyển vùng, đổi môi trường, làm với nơi xa',
      moTa: 'xu hướng và điều kiện',
    },
    {
      nhan: 'Bạn làm tốt nhất trong kiểu tiếp xúc nào',
      moTa: 'tam hợp Phu Thê + Phúc Đức: một–một, nhóm nhỏ, hay đám đông',
    },
    {
      nhan: 'Rủi ro khi bước vào một môi trường mới',
      moTa: 'dạng va chạm đặc trưng ở môi trường lạ',
    },
    {
      nhan: 'Lúc nào nên mở rộng, lúc nào nên thu về',
    },
  ],
  'phu-the': [
    {
      nhan: 'Cách bạn gắn bó',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Người bên cạnh bạn thường cần có gì',
      moTa: 'mô tả xu hướng tính cách. Cấm đoán tuổi / mệnh / nghề nghiệp cụ thể',
    },
    {
      nhan: 'Điều dễ lặp lại trong tình yêu',
      moTa: 'vòng lặp thường thấy và chỗ nó hay gãy',
    },
    {
      nhan: 'Bạn xử lý mâu thuẫn thế nào',
      moTa: 'rút lui, đối đầu, hay im lặng tích tụ',
    },
    {
      nhan: 'Điều gì giúp một tình yêu bền',
      moTa: 'tam hợp Phúc Đức: bạn cần thấy đủ ở đâu thì mới ở lại được',
    },
    {
      nhan: 'Khi công việc bước vào tình yêu',
      moTa: 'hai thứ này tranh nhau nguồn lực nào ở bạn',
      laGuong: true,
    },
    {
      nhan: 'Nhịp tình cảm trong giai đoạn này',
      moTa: 'giai đoạn dễ khởi sự, giai đoạn dễ căng + điều đáng cân nhắc',
    },
  ],
  'huynh-de': [
    {
      nhan: 'Quan hệ với người ngang hàng',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Hợp tác hay đi một mình',
      moTa: 'nêu điều kiện cụ thể, không kết luận tuyệt đối',
    },
    {
      nhan: 'Kiểu cộng sự hợp với bạn',
    },
    {
      nhan: 'Tiền bạc giữa những người ngang hàng',
      moTa: 'vay mượn, góp vốn, chia phần',
    },
    {
      nhan: 'Khi bạn thực sự cần chỗ dựa',
      moTa: 'tam hợp Điền Trạch + Tật Ách: ai và nơi nào đỡ bạn khi đuối',
    },
    {
      nhan: 'Rộng hay sâu',
      moTa: 'chất lượng đối với số lượng quan hệ *(gương nội bộ chặng 3 — viết như một cặp với phần 3.3)*',
      laGuong: true,
    },
  ],
  'no-boc': [
    {
      nhan: 'Bạn kết nối với người khác theo cách nào',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Bạn thường là người cho hay người nhận',
    },
    {
      nhan: 'Người nào hợp để ở gần bạn',
      moTa: 'mô tả hành vi, cấm gắn tuổi / mệnh',
    },
    {
      nhan: 'Khi bạn ở vị trí dẫn dắt',
      moTa: 'tam hợp Tử Tức + Phụ Mẫu: bạn dẫn dắt kiểu gì, và ai đỡ đầu bạn',
    },
    {
      nhan: 'Vòng trong và vòng ngoài',
      moTa: '*(gương nội bộ — phải nối tiếp, không lặp lại 3.2)*',
      laGuong: true,
    },
    {
      nhan: 'Rủi ro trong quan hệ',
      moTa: 'thị phi, bị lợi dụng, gánh hộ; nêu dấu hiệu sớm',
    },
  ],
  'phu-mau': [
    {
      nhan: 'Bạn và cha mẹ thường ở thế nào với nhau',
      moTa: 'L1→L4, mô tả động lực quan hệ',
    },
    {
      nhan: 'Điều gia đình đã cài sẵn vào bạn',
      moTa: 'niềm tin nền, chuẩn "được công nhận" bạn mang theo',
    },
    {
      nhan: 'Bạn đứng thế nào trước người có quyền',
      moTa: 'sếp, thầy, thể chế: bạn tìm sự công nhận hay né sự kiểm soát',
    },
    {
      nhan: 'Ai thường đứng ra giúp bạn',
      moTa: 'tam hợp Nô Bộc: dạng người có xu hướng nâng bạn lên',
    },
    {
      nhan: 'Chuyện học hành và danh phận trong đời bạn',
      moTa: 'Phụ Mẫu như cung văn thư',
    },
    {
      nhan: 'Kỳ vọng và sức chịu đựng',
      moTa: 'cái giá cơ thể phải trả cho chuẩn mực đã nhận',
      laGuong: true,
    },
  ],
  'dien-trach': [
    {
      nhan: 'Thế nào là một nơi thuộc về bạn',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Nhà cửa và những thứ bạn giữ lâu',
      moTa: 'mua sớm hay muộn, tự tạo hay thừa hưởng, giữ được hay hay đổi',
    },
    {
      nhan: 'Chỗ ở làm bạn ra sao',
      moTa: 'tam hợp Tật Ách: môi trường và sức khỏe',
    },
    {
      nhan: 'Bạn giữ của bằng cách nào',
      moTa: 'Điền Trạch là nơi tiền dừng lại; vì sao tiền của bạn ở lại hay đi tiếp',
    },
    {
      nhan: 'Nếp sống trong nhà bạn',
      moTa: 'bầu không khí bạn tạo ra hoặc bị đặt vào',
    },
    {
      nhan: 'Giữ và tạo',
      moTa: 'sức kéo giữa tích lũy an toàn và làm ra cái mới *(gương nội bộ chặng 4 — cặp với 4.3)*',
      laGuong: true,
    },
  ],
  'tu-tuc': [
    {
      nhan: 'Bạn ở thế nào với người đi sau',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Bạn dạy và dẫn người khác ra sao',
      moTa: 'bảo bọc, thả, hay đòi hỏi',
    },
    {
      nhan: 'Thứ bạn tạo ra và coi như con mình',
      moTa: 'dạng sản phẩm / tác phẩm / đội nhóm bạn có duyên tạo ra',
    },
    {
      nhan: 'Bạn nuôi một thứ từ con số không thế nào',
      moTa: 'tam hợp Nô Bộc + Phụ Mẫu: ai giúp bạn ở đoạn nào',
    },
    {
      nhan: 'Trao đi và giữ lại',
      moTa: 'vì sao bạn khó buông thứ mình tạo *(gương nội bộ — nối tiếp 4.2, không lặp)*',
      laGuong: true,
    },
    {
      nhan: 'Điều bạn để lại',
      moTa: 'kết bài: thứ còn lại sau khi mọi thứ khác đã đi qua',
    },
  ],
};

/** Tổng số tiêu chí — dùng cho phép đếm ở bộ kiểm */
export const TONG_TIEU_CHI_SAU = Object.values(TIEU_CHI_SAU).reduce(
  (t, x) => t + x.length,
  0
);
