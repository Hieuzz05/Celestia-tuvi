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
      nhan: 'Cốt cách chủ đạo',
      moTa: 'L1→L4; nêu cách cục nếu thành cách',
    },
    {
      nhan: 'Mệnh và Thân',
      moTa: 'cái sẵn có từ đầu đối với cái hình thành sau; Thân cư cung nào thì trọng tâm đời dịch về đâu',
    },
    {
      nhan: 'Cục và chính tinh',
      moTa: 'hợp hay khắc, quyết định đời phát sớm hay muộn',
    },
    {
      nhan: 'Cách bạn ra quyết định',
      moTa: 'nhanh/chậm, dựa dữ kiện hay cảm nhận, điều gì khiến bạn đổi ý',
    },
    {
      nhan: 'Thứ tự ưu tiên giá trị',
      moTa: 'tam hợp Tài Bạch + Quan Lộc: bạn hy sinh cái nào trước khi buộc phải chọn',
    },
    {
      nhan: 'Điều người khác hay hiểu nhầm về bạn',
      moTa: 'khoảng cách giữa bản chất và hình ảnh',
      laGuong: true,
    },
    {
      nhan: 'Điều kiện để cốt cách này thành lợi thế',
      moTa: '+ lực ngược nếu thiếu điều kiện',
    },
  ],
  'phuc-duc': [
    {
      nhan: 'Nguồn an yên',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Phúc phần từ gốc',
      moTa: 'nền tinh thần thừa hưởng; điều gì được cho sẵn, điều gì phải tự gây dựng',
    },
    {
      nhan: 'Ngưỡng chịu đựng và cách bạn tự làm khổ mình',
      moTa: 'dạng lo âu đặc trưng của cấu trúc này',
    },
    {
      nhan: 'Đời sống tinh thần',
      moTa: 'thứ bạn tin vào khi mọi thứ khó; tam hợp Phu Thê: bạn cần ai ở cạnh để thấy yên',
    },
    {
      nhan: 'Sự an yên và tiền',
      moTa: 'vì sao ngưỡng "đủ" của bạn co giãn; vì sao tăng thu nhập chưa chắc hết lo',
      laGuong: true,
    },
    {
      nhan: 'Chất lượng hậu vận',
      moTa: 'và điều kiện để "yên thật" thay vì "yên tạm"',
    },
  ],
  'tat-ach': [
    {
      nhan: 'Nhịp năng lượng',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Kiểu quá tải đặc trưng',
      moTa: 'thể chất trước hay tinh thần trước, và chuỗi dẫn tới nó',
    },
    {
      nhan: 'Vùng cơ thể dễ phản ứng trước',
      moTa: 'theo ngũ hành cung và chính tinh — mô tả xu hướng, không định bệnh',
    },
    {
      nhan: 'Môi trường và chỗ dựa',
      moTa: 'tam hợp Điền Trạch (không gian sống) + Huynh Đệ (người san sẻ)',
    },
    {
      nhan: 'Áp lực kỳ vọng',
      moTa: 'stress đến từ bề trên / chuẩn mực đã cài từ nhỏ',
      laGuong: true,
    },
    {
      nhan: 'Nhịp hồi phục và giai đoạn cần giữ nhịp kỹ hơn',
      moTa: 'lời khuyên về thói quen, không về thuốc',
    },
  ],
  'quan-loc': [
    {
      nhan: 'Phong cách làm việc',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Thứ người khác sẵn sàng trả tiền cho bạn',
      moTa: 'phân biệt với thứ bạn giỏi nhưng không tạo giá trị trao đổi',
    },
    {
      nhan: 'Dạng tổ chức và dạng người quản lý phù hợp',
      moTa: 'làm công / làm chủ / làm nghề tự do, kèm điều kiện, không phán quyết',
    },
    {
      nhan: 'Bạn thường đi lên bằng đường nào',
      moTa: 'tam hợp Mệnh + Tài Bạch: lên bằng chuyên môn, bằng quan hệ, hay bằng việc mở địa bàn mới',
    },
    {
      nhan: 'Mô thức thất bại lặp lại',
      moTa: 'kiểu vấp có xu hướng lặp và dấu hiệu nhận ra sớm',
    },
    {
      nhan: 'Cái giá của sự nghiệp',
      moTa: 'sự nghiệp lấy đi gì của đời sống riêng',
      laGuong: true,
    },
    {
      nhan: 'Giai đoạn nghề nghiệp',
      moTa: 'đại vận nào mở, đại vận nào nên tích lũy + điều đáng cân nhắc',
    },
  ],
  'tai-bach': [
    {
      nhan: 'Tiền của bạn có thể đến từ đâu',
      moTa: 'nguồn chính / nguồn phụ / nguồn chỉ nên thử trong giai đoạn nhất định. L1→L5',
    },
    {
      nhan: 'Quy luật dòng tiền của riêng bạn',
      moTa: 'vào đều hay vào theo đợt; điểm rò rỉ thật sự nằm ở đâu',
    },
    {
      nhan: 'Cách quản lý tiền bạc',
      moTa: 'cơ chế hợp với tính cách (tự động hóa hay kiểm soát thủ công), và vì sao cách còn lại sẽ thất bại với bạn',
    },
    {
      nhan: 'Tâm thế đầu tư',
      moTa: 'chịu rủi ro tới đâu, phản ứng điển hình khi thị trường ngược chiều, sai lầm tâm lý đặc trưng',
    },
    {
      nhan: 'Con đường xây và tích góp tài sản',
      moTa: 'tam hợp Mệnh + Quan Lộc cho biết tiền sinh từ năng lực nào',
    },
    {
      nhan: 'Tiền và sự an yên',
      moTa: 'vì sao ngưỡng "đủ" co giãn; vì sao tăng thu nhập chưa chắc hết lo',
      laGuong: true,
    },
    {
      nhan: 'Rủi ro cần tránh + lời khuyên',
      moTa: '2–3 rủi ro cụ thể, mỗi rủi ro kèm dấu hiệu nhận biết sớm',
    },
  ],
  'thien-di': [
    {
      nhan: 'Hình ảnh đối ngoại',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Khoảng cách giữa con người thật và hình ảnh',
      moTa: 'một trong những insight "dính" nhất toàn bài',
      laGuong: true,
    },
    {
      nhan: 'Cơ hội đến qua kênh nào',
      moTa: 'người giới thiệu, môi trường mới, hay tự tìm',
    },
    {
      nhan: 'Xuất ngoại / chuyển vùng / đổi môi trường',
      moTa: 'xu hướng và điều kiện',
    },
    {
      nhan: 'Chỗ nào bạn làm tốt nhất',
      moTa: 'tam hợp Phu Thê + Phúc Đức: một–một, nhóm nhỏ, hay đám đông',
    },
    {
      nhan: 'Rủi ro khi ra ngoài',
      moTa: 'dạng va chạm đặc trưng ở môi trường lạ',
    },
    {
      nhan: 'Giai đoạn nên mở rộng / nên thu về',
    },
  ],
  'phu-the': [
    {
      nhan: 'Kiểu gắn bó của bạn',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Người bạn đời của bạn có thể là ai',
      moTa: 'mô tả xu hướng tính cách. Cấm đoán tuổi / mệnh / nghề nghiệp cụ thể',
    },
    {
      nhan: 'Mô thức lặp lại trong các mối quan hệ',
      moTa: 'vòng lặp thường thấy và chỗ nó hay gãy',
    },
    {
      nhan: 'Cách bạn xử lý xung đột',
      moTa: 'rút lui, đối đầu, hay im lặng tích tụ',
    },
    {
      nhan: 'Điều kiện để mối quan hệ bền',
      moTa: 'tam hợp Phúc Đức: bạn cần thấy đủ ở đâu thì mới ở lại được',
    },
    {
      nhan: 'Sự nghiệp và đời sống riêng',
      moTa: 'hai thứ này tranh nhau nguồn lực nào ở bạn',
      laGuong: true,
    },
    {
      nhan: 'Nhịp thời gian của tình cảm',
      moTa: 'giai đoạn dễ khởi sự, giai đoạn dễ căng + điều đáng cân nhắc',
    },
  ],
  'huynh-de': [
    {
      nhan: 'Quan hệ đồng đẳng',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Bạn nên hợp tác hay nên đi một mình',
      moTa: 'nêu điều kiện cụ thể, không kết luận tuyệt đối',
    },
    {
      nhan: 'Kiểu cộng sự hợp và kiểu dễ vỡ',
    },
    {
      nhan: 'Chuyện tiền bạc với người ngang hàng',
      moTa: 'vay mượn, góp vốn, chia phần',
    },
    {
      nhan: 'Chỗ dựa khi khó',
      moTa: 'tam hợp Điền Trạch + Tật Ách: ai và nơi nào đỡ bạn khi đuối',
    },
    {
      nhan: 'Thân thiết và rộng rãi',
      moTa: 'chất lượng đối với số lượng quan hệ *(gương nội bộ chặng 3 — viết như một cặp với phần 3.3)*',
      laGuong: true,
    },
  ],
  'no-boc': [
    {
      nhan: 'Bạn quen biết theo kiểu gì',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Bạn là người cho hay người nhận trong mạng lưới',
    },
    {
      nhan: 'Dạng người hợp và dạng người nên giữ khoảng cách',
      moTa: 'mô tả hành vi, cấm gắn tuổi / mệnh',
    },
    {
      nhan: 'Cấp dưới và đội ngũ',
      moTa: 'tam hợp Tử Tức + Phụ Mẫu: bạn dẫn dắt kiểu gì, và ai đỡ đầu bạn',
    },
    {
      nhan: 'Vòng trong và vòng ngoài',
      moTa: '*(gương nội bộ — phải nối tiếp, không lặp lại 3.2)*',
      laGuong: true,
    },
    {
      nhan: 'Rủi ro từ quan hệ',
      moTa: 'thị phi, bị lợi dụng, gánh hộ; nêu dấu hiệu sớm',
    },
  ],
  'phu-mau': [
    {
      nhan: 'Quan hệ với cha mẹ',
      moTa: 'L1→L4, mô tả động lực quan hệ',
    },
    {
      nhan: 'Nền giáo dưỡng đã cài gì vào bạn',
      moTa: 'niềm tin nền, chuẩn "được công nhận" bạn mang theo',
    },
    {
      nhan: 'Quan hệ với thẩm quyền',
      moTa: 'sếp, thầy, thể chế: bạn tìm sự công nhận hay né sự kiểm soát',
    },
    {
      nhan: 'Quý nhân và người đỡ đầu',
      moTa: 'tam hợp Nô Bộc: dạng người có xu hướng nâng bạn lên',
    },
    {
      nhan: 'Giấy tờ, học vấn, danh phận',
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
      nhan: 'Ý nghĩa của "chỗ thuộc về" với bạn',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Tài sản cố định',
      moTa: 'mua sớm hay muộn, tự tạo hay thừa hưởng, giữ được hay hay đổi',
    },
    {
      nhan: 'Chỗ ở làm bạn ra sao',
      moTa: 'tam hợp Tật Ách: môi trường và sức khỏe',
    },
    {
      nhan: 'Kho của cải',
      moTa: 'Điền Trạch là nơi tiền dừng lại; vì sao tiền của bạn ở lại hay đi tiếp',
    },
    {
      nhan: 'Gia đạo và nếp nhà',
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
      nhan: 'Quan hệ với thế hệ sau',
      moTa: 'L1→L4',
    },
    {
      nhan: 'Phong cách nuôi dạy / dẫn dắt người non hơn',
      moTa: 'bảo bọc, thả, hay đòi hỏi',
    },
    {
      nhan: '"Đứa con tinh thần"',
      moTa: 'dạng sản phẩm / tác phẩm / đội nhóm bạn có duyên tạo ra',
    },
    {
      nhan: 'Cách bạn nuôi một thứ từ 0 tới 1',
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
