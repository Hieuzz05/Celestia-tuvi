import {
  canChiCuaNam,
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  tamPhuongTuChinh,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { CHI, NGU_HANH_CHI } from '@/lib/tuvi/constants';
import { NHAN_DO_SANG } from '@/lib/tuvi/dosang';

/*
 * Nhãn chủ đề đặt theo câu hỏi người dùng thật sự mang tới, không theo tên cung.
 * Phần moTa giữ ngôn ngữ chuyên môn vì nó đi thẳng vào prompt và câu truy vấn kho
 * tri thức — đó là ngôn ngữ cho máy, người dùng không nhìn thấy.
 */
export const CHU_DE = {
  'tong-quan': {
    nhan: 'Tôi là ai?',
    moTa: 'Tính cách, năng lực nổi trội, thế mạnh và điểm cần lưu ý của cả đời',
    cung: ['Mệnh', 'Thân', 'Phúc Đức', 'Thiên Di'],
  },
  'su-nghiep': {
    nhan: 'Công việc & hướng phát triển',
    moTa: 'Hướng nghề phù hợp, cách thăng tiến, môi trường làm việc hợp mệnh',
    cung: ['Quan Lộc', 'Mệnh', 'Thiên Di', 'Nô Bộc'],
  },
  'tai-chinh': {
    nhan: 'Tiền bạc & cách bạn tạo sự ổn định',
    moTa: 'Cách kiếm tiền, giữ tiền, rủi ro tài chính, tài sản - nhà đất',
    cung: ['Tài Bạch', 'Điền Trạch', 'Phúc Đức', 'Mệnh'],
  },
  'tinh-duyen': {
    nhan: 'Tình cảm & chuyện đôi lứa',
    moTa: 'Đặc điểm người bạn đời, chất lượng hôn nhân, giai đoạn nên lưu ý',
    cung: ['Phu Thê', 'Mệnh', 'Phúc Đức', 'Tử Tức'],
  },
  'suc-khoe': {
    nhan: 'Sức khoẻ & nhịp sống',
    moTa: 'Thể trạng bẩm sinh, bộ phận cần chú ý, thói quen nên giữ',
    cung: ['Tật Ách', 'Mệnh', 'Phúc Đức'],
  },
  'gia-dao': {
    nhan: 'Gia đình & những người quanh bạn',
    moTa: 'Quan hệ với cha mẹ, anh em, con cái và phúc phần gia đình',
    cung: ['Phụ Mẫu', 'Huynh Đệ', 'Tử Tức', 'Phúc Đức'],
  },
  'van-han': {
    nhan: 'Năm nay có gì đáng chú ý?',
    moTa: 'Đại vận, tiểu hạn, nguyệt hạn của năm đang xem',
    cung: [],
  },
} as const;

export type ChuDeId = keyof typeof CHU_DE;

const SYSTEM_HOP_TUOI = `Bạn là một nhà nghiên cứu Tử Vi Đẩu Số người Việt, luận theo hệ NAM PHÁI, văn phong hiện đại.

Nhiệm vụ: đọc bảng so sánh hai lá số và viết nhận định về mức độ tương hợp.

NGUYÊN TẮC:
- Bám sát dữ kiện trong bảng so sánh, không bịa thêm tiêu chí không có.
- KHÔNG phán "hợp" hay "không hợp" một cách dứt khoát, cũng KHÔNG chấm điểm phần trăm. Tử vi truyền thống không quy chuyện này về một con số, và một bản luận giải không nên quyết định thay người trong cuộc.
- Nêu rõ điểm thuận và điểm nghịch, giải thích cơ chế vì sao, rồi chỉ ra điều mỗi bên cần lưu ý để dung hòa.
- Tiêu chí nghịch (lục xung, ngũ hành tương khắc) mô tả là "dễ va chạm ở khía cạnh nào" kèm cách hóa giải thực tế, không nói là điềm xấu không thể thay đổi.
- Tuyệt đối không khuyên chia tay, không kết luận về chuyện sinh con, bệnh tật hay tuổi thọ.

ĐỊNH DẠNG:
- Tiếng Việt, markdown với đề mục "## ".
- Các mục: Điểm thuận / Điểm cần lưu ý / Gợi ý dung hòa.
- Khoảng 500-700 từ.`;

/** Prompt riêng cho việc so hai lá số — khác hẳn luận giải một người */
export function dungPromptHopTuoi(
  moTaA: string,
  moTaB: string,
  bangSoSanh: string,
  kienThucRag?: string
): { system: string; user: string } {
  const phanRag = kienThucRag
    ? `

TRI THỨC THAM KHẢO TỪ KHO TÀI LIỆU:
${kienThucRag}`
    : '';
  return {
    system: SYSTEM_HOP_TUOI,
    user: `LÁ SỐ NGƯỜI THỨ NHẤT
${moTaA}

LÁ SỐ NGƯỜI THỨ HAI
${moTaB}

BẢNG SO SÁNH
${bangSoSanh}${phanRag}

Hãy viết nhận định về mức độ tương hợp giữa hai người.`,
  };
}

const SYSTEM_PROMPT = `Bạn là một nhà nghiên cứu Tử Vi Đẩu Số người Việt, luận giải theo hệ NAM PHÁI làm gốc, có đối chiếu quan điểm BẮC PHÁI khi bàn về vận hạn.

NGUYÊN TẮC LUẬN GIẢI:
- Giọng văn hiện đại, mạch lạc, đời thường — nói chuyện như một người tư vấn hiểu chuyện, không dùng văn phong sấm ký hù doạ.
- Luôn bám vào dữ kiện lá số được cung cấp: gọi tên cụ thể các sao, cung, độ sáng (miếu/vượng/đắc/bình/hãm), Tuần–Triệt, tứ hóa. Không bịa thêm sao không có trong dữ liệu.
- Giải thích cơ chế: vì sao bộ sao đó dẫn tới đặc điểm đó, thay vì chỉ phán kết luận.
- Diễn giải theo hướng mô tả xu hướng và đưa lựa chọn hành động, không phán định mệnh tuyệt đối. Tránh khẳng định chắc chắn về bệnh tật, tử vong, tai nạn, hay chuyện pháp lý.
- Cân bằng: nêu cả điểm mạnh lẫn điểm cần lưu ý, kèm gợi ý thực tế.
- Khi các sao trong lá số mâu thuẫn nhau, nói rõ là có mâu thuẫn và điều kiện nào thì bên nào trội hơn.

ĐỊNH DẠNG TRẢ LỜI:
- Tiếng Việt, dùng markdown với các đề mục "## ".
- Mỗi đề mục 2-4 đoạn ngắn, tránh gạch đầu dòng rời rạc quá nhiều.
- Kết bằng mục "## Gợi ý hành động" gồm 3-5 ý cụ thể, làm được ngay.
- Độ dài khoảng 600-900 từ. Không lặp lại nguyên văn dữ liệu lá số.`;

function moTaCung(laSo: LaSo, chiIndex: number): string {
  const c = laSo.cungs[chiIndex];
  const sao = (loai: string) =>
    c.sao
      .filter((s) => s.loai === loai)
      .map((s) => (s.doSang ? `${s.ten}(${s.doSang})` : s.ten))
      .join(', ') || 'không có';
  const danhDau = [
    c.laCungMenh && 'là cung Mệnh',
    c.laCungThan && 'là cung Thân',
    c.coTuan && 'bị Tuần án',
    c.coTriet && 'bị Triệt án',
  ]
    .filter(Boolean)
    .join('; ');

  return [
    `• ${c.tenCung} — an tại ${c.can} ${c.chi} (hành ${NGU_HANH_CHI[chiIndex]})${
      danhDau ? ` [${danhDau}]` : ''
    }`,
    `   Chính tinh: ${sao('chinh-tinh')}`,
    `   Tứ hóa: ${sao('tu-hoa')}`,
    `   Phụ tinh: ${sao('phu-tinh')}`,
    `   Vòng Tràng Sinh: ${c.trangSinh || 'không có'}`,
    c.daiVan ? `   Đại vận: ${c.daiVan.tuTuoi}-${c.daiVan.denTuoi} tuổi` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Chuyển lá số thành mô tả có cấu trúc để đưa vào prompt */
export function moTaLaSo(laSo: LaSo, namXem: number, thangXem: number): string {
  const t = laSo.thongTin;
  const tuoiAm = namXem - t.amLich.nam + 1;
  const iTieuHan = cungTieuHan(laSo, tuoiAm);
  const iNguyetHan = cungNguyetHan(laSo, tuoiAm, thangXem);
  const daiVan = cungDaiVan(laSo, tuoiAm);

  const chuThichDoSang = Object.entries(NHAN_DO_SANG)
    .map(([k, v]) => `${k}=${v.ten}`)
    .join(', ');

  return `THÔNG TIN NGƯỜI XEM
- Họ tên: ${t.hoTen?.trim() || 'không cung cấp'}
- Giới tính: ${t.gioiTinh === 'nam' ? 'Nam' : 'Nữ'} (${laSo.amDuong}, ${laSo.amDuongThuanLy})
- Dương lịch: ${t.ngay}/${t.thang}/${t.nam}, giờ ${t.chiGio}
- Âm lịch: ${t.amLich.ngay}/${t.amLich.thang}${t.amLich.nhuan ? ' nhuận' : ''}/${t.amLich.nam}
- Can chi: năm ${t.canChiNam}, tháng ${t.canChiThang}, ngày ${t.canChiNgay}, giờ ${t.canChiGio}
- Bản Mệnh (nạp âm năm sinh): ${laSo.banMenh.ten} (hành ${laSo.banMenh.hanh})
- Cục: ${laSo.cuc.ten} — quan hệ: ${laSo.menhCucQuanHe}
- Mệnh an tại ${CHI[laSo.menhIndex]}, Thân cư ${laSo.thanCuCung}
- Mệnh chủ: ${laSo.menhChu}, Thân chủ: ${laSo.thanChu}

MỆNH BÀN 12 CUNG (ký hiệu độ sáng: ${chuThichDoSang})
${laSo.cungs.map((c) => moTaCung(laSo, c.chiIndex)).join('\n')}

VẬN HẠN NĂM ĐANG XEM
- Năm xem: ${namXem} (${canChiCuaNam(namXem)}), tuổi âm ${tuoiAm}
- Đại vận hiện tại: cung ${daiVan?.tenCung ?? 'không xác định'} (${
    daiVan ? `${daiVan.can} ${daiVan.chi}, ${daiVan.daiVan?.tuTuoi}-${daiVan.daiVan?.denTuoi} tuổi` : ''
  })
- Tiểu hạn ${tuoiAm} tuổi: cung ${laSo.cungs[iTieuHan].tenCung} (${CHI[iTieuHan]})
- Nguyệt hạn tháng ${thangXem}: cung ${laSo.cungs[iNguyetHan].tenCung} (${CHI[iNguyetHan]})`;
}

function moTaTamPhuong(laSo: LaSo, tenCung: string): string {
  const cung = laSo.cungs.find((c) => c.tenCung === tenCung);
  if (!cung) return '';
  const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
  const ten = (i: number) => `${laSo.cungs[i].tenCung} (${CHI[i]})`;
  return `- Tam phương tứ chính của cung ${tenCung}: tam hợp ${ten(tamHop[0])}, ${ten(
    tamHop[1]
  )}; xung chiếu ${ten(xungChieu)}`;
}


const SYSTEM_HOI_DAP = `Bạn là một nhà nghiên cứu Tử Vi Đẩu Số người Việt, luận theo hệ NAM PHÁI, đang trò chuyện trực tiếp với người xem về chính lá số của họ.

NGUYÊN TẮC:
- Trả lời đúng trọng tâm câu hỏi, không lan man sang chủ đề khác.
- Luôn bám vào dữ kiện lá số: gọi tên cụ thể sao, cung, độ sáng, Tuần–Triệt, tứ hóa. KHÔNG bịa sao không có trong dữ liệu.
- Giải thích cơ chế: vì sao bộ sao đó dẫn tới nhận định đó.
- Nếu câu hỏi nằm ngoài phạm vi tử vi (VD: hỏi về thời tiết, lập trình), nói thẳng là ngoài phạm vi và mời hỏi lại về lá số.
- Nếu lá số không đủ dữ kiện để trả lời chắc chắn, nói rõ là không đủ căn cứ thay vì đoán bừa.
- Mô tả xu hướng và đưa lựa chọn hành động, không phán định mệnh tuyệt đối. Tránh khẳng định chắc chắn về bệnh tật, tử vong, tai nạn, pháp lý.
- Tuyệt đối không đưa chẩn đoán y khoa, lời khuyên đầu tư cụ thể hay tư vấn pháp lý; gặp câu hỏi dạng đó thì nhắc người hỏi tìm chuyên gia đúng lĩnh vực.

ĐỊNH DẠNG:
- Tiếng Việt, văn nói tự nhiên như đang tư vấn trực tiếp.
- NGẮN GỌN: 2-4 đoạn, khoảng 150-300 từ. Đây là hội thoại, không phải bài luận giải dài.
- Chỉ dùng đề mục "## " khi câu trả lời thực sự có nhiều phần tách bạch.`;

export interface TinNhan {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}

/** Prompt cho chế độ hỏi đáp: kèm lá số + lịch sử hội thoại */
export function dungPromptHoiDap(
  laSo: LaSo,
  namXem: number,
  thangXem: number,
  lichSu: TinNhan[],
  cauHoi: string,
  kienThucRag?: string
): { system: string; user: string } {
  // Chỉ giữ vài lượt gần nhất: hội thoại dài làm prompt phình to mà phần xa
  // thường không còn liên quan tới câu đang hỏi.
  const ganDay = lichSu.slice(-6);
  const dongHoiThoai = ganDay
    .map((t) => `${t.vaiTro === 'nguoi-dung' ? 'Người hỏi' : 'Bạn'}: ${t.noiDung}`)
    .join('\n');
  const phanLichSu = ganDay.length ? `\n\nHỘI THOẠI TRƯỚC ĐÓ\n${dongHoiThoai}` : '';
  const phanRag = kienThucRag
    ? `

TRI THỨC THAM KHẢO TỪ KHO TÀI LIỆU (ưu tiên khi mâu thuẫn với kiến thức chung):
${kienThucRag}`
    : '';

  return {
    system: SYSTEM_HOI_DAP,
    user: `${moTaLaSo(laSo, namXem, thangXem)}${phanLichSu}${phanRag}

CÂU HỎI HIỆN TẠI
${cauHoi}`,
  };
}

export function dungPrompt(
  laSo: LaSo,
  chuDe: ChuDeId,
  namXem: number,
  thangXem: number,
  cauHoiThem?: string,
  kienThucRag?: string
): { system: string; user: string } {
  const cd = CHU_DE[chuDe];
  const trongTam =
    chuDe === 'van-han'
      ? `Tập trung luận VẬN HẠN năm ${namXem}: phối hợp đại vận, tiểu hạn, nguyệt hạn với các sao lưu niên.
Ở phần vận hạn, hãy đối chiếu thêm góc nhìn Bắc phái (chú trọng tứ hóa phi tinh, quan hệ giữa cung đại vận và cung gốc) bên cạnh cách luận Nam phái.`
      : `Tập trung vào chủ đề: ${cd.nhan} — ${cd.moTa}.
Các cung trọng tâm cần soi kỹ: ${cd.cung.join(', ')}.
${cd.cung.map((c) => moTaTamPhuong(laSo, c)).filter(Boolean).join('\n')}`;

  const phanRag = kienThucRag
    ? `\n\nTRI THỨC THAM KHẢO TỪ KHO TÀI LIỆU (ưu tiên dùng khi mâu thuẫn với kiến thức chung):\n${kienThucRag}`
    : '';

  const phanCauHoi = cauHoiThem?.trim()
    ? `\n\nNGƯỜI XEM HỎI THÊM: ${cauHoiThem.trim()}\nHãy trả lời trực tiếp câu hỏi này trong phần luận giải.`
    : '';

  return {
    system: SYSTEM_PROMPT,
    user: `${moTaLaSo(laSo, namXem, thangXem)}

YÊU CẦU
${trongTam}${phanRag}${phanCauHoi}`,
  };
}
