/**
 * KHO VÀNG — những đoạn văn mẫu do người viết, dùng để DẠY chứ không để ép.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN, TRONG KHI PROMPT ĐÃ ĐẦY LUẬT
 *
 * `CHUAN_NGON_NGU_CELES` khoảng mười một nghìn ký tự, và phần lớn là điều CẤM.
 * Luật cấm hoạt động ở cấp câu: cấm một cụm từ, cấm một kiểu mở đoạn, cấm một
 * tính từ. Nhưng thứ chủ dự án phàn nàn — lan man, lủng củng, đọc mười hai
 * phần thấy lặp — là thuộc tính cấp ĐOẠN và cấp BÀI. Không luật cấp câu nào
 * dạy được mạch văn, cũng như không có danh sách cấm nào dạy được một người
 * cách kể chuyện.
 *
 * Một bản mẫu hoàn chỉnh dạy được điều đó trong một lần đọc. Đây là chỗ để
 * chứa nó. Xem KIEN-TRUC-LUAN-GIAI.md mục A2, A3, A4.
 *
 * ---------------------------------------------------------------------------
 * KHO NÀY ĐANG RỖNG, VÀ ĐÓ LÀ TRẠNG THÁI ĐÚNG
 *
 * Mẫu vàng phải do NGƯỜI viết hoặc người sửa lại từ bản máy. Em không tự sinh
 * mẫu rồi đưa cho model học: lúc ấy nó học chính giọng đang bị chê, và cả hệ
 * thống quay một vòng tròn kín.
 *
 * Mọi hàm ở đây chạy đúng khi kho rỗng: `khoiMauVang()` trả chuỗi rỗng, prompt
 * không mọc thêm dòng nào. Đổ mẫu vào là nó chạy, không phải sửa chỗ nào khác.
 *
 * ---------------------------------------------------------------------------
 * ĐẶT Ở `user`, KHÔNG ĐẶT Ở `system` — VÀ ĐÂY LÀ RÀNG BUỘC KỸ THUẬT
 *
 * Mẫu vàng chọn theo từng lá số nên nó là nội dung ĐỘNG. Nhà cung cấp đệm
 * prompt theo tiền tố: một dòng động nằm trong `system` là toàn bộ khối luật
 * phía sau nó mất quyền đệm, cho mọi lượt gọi, mãi mãi — đo được ở CEL-111.
 * Đặt ở `user` thì vừa giữ đệm, vừa để mẫu nằm gần điểm sinh chữ nhất.
 */

import type { MucId } from '@/lib/tuvi/chang-cung';

/** Bề mặt nào đang xin mẫu — mỗi bề mặt có hình dạng bài khác nhau */
export type BeMatMau =
  | 'ban-doc-sau'
  | 'bai-dai'
  | 'bang-linh-vuc'
  | 'be-mat-ngan'
  | 'moc-hanh-trinh'
  | 'chat';

/**
 * Sáu loại bài của kho vàng — A2 đòi đủ sáu loại × hai bản.
 *
 * Chia theo TÌNH HUỐNG VIẾT chứ không theo phần đời: cái khó của một đoạn
 * không nằm ở chỗ nó nói về tiền hay về tình cảm, mà ở chỗ lá số cho nhiều
 * hay ít, thuận hay nghịch, và đoạn ấy đang làm việc gì trong bài.
 */
export type LoaiMau =
  /** Dữ kiện dày, tín hiệu rõ — chỗ dễ viết dài mà nhạt nhất */
  | 'day-du-kien'
  /** Lá số nói ít — bài phải ngắn và thành thật, không được độn */
  | 'thua-du-kien'
  /** Hai dữ kiện kéo ngược nhau — phải giữ cả hai, không chọn bên cho gọn */
  | 'mau-thuan'
  /** Đọc phần này qua cung đối diện — góc nhìn đảo, không phải đoạn bổ sung */
  | 'khoi-guong'
  /** Câu khép: giữ lại, câu hỏi soi */
  | 'cau-khep'
  /** Miền rủi ro: sức khoẻ, tiền bạc, pháp lý — nói được mà không phán */
  | 'mien-rui-ro';

export interface MauVang {
  /** "MV-001" — cố định, để nhật ký eval trỏ lại được */
  id: string;
  beMat: BeMatMau;
  loai: LoaiMau;
  /** Phần đời của bản mẫu, nếu mẫu gắn với một phần cụ thể */
  muc?: MucId;
  /**
   * VÌ SAO bản này đáng học — một câu, viết cho model đọc.
   *
   * Bắt buộc. Một mẫu không kèm lý do thì model bắt chước cả những thứ tình cờ
   * có trong đó: độ dài, thứ tự, thậm chí tên sao của chính lá số ấy.
   */
  nhan: string;
  /** Nguyên văn đoạn mẫu */
  van: string;
}

/**
 * Kho mẫu — CHỦ DỰ ÁN ĐỔ VÀO.
 *
 * Cách thêm: viết (hoặc sửa từ bản máy) một đoạn, đặt `nhan` nói rõ bản này
 * đáng học ở chỗ nào, rồi thêm vào mảng. Không cần sửa gì khác.
 *
 * A2 đòi đủ sáu `LoaiMau`, mỗi loại hai bản.
 */
export const KHO_VANG: MauVang[] = [];

/**
 * Số mẫu đưa vào một lượt gọi.
 *
 * A4 chốt con số này bằng A/B 0 / 1 / 2 / 3 trên rubric, KHÔNG bằng lý lẽ.
 * Ba là trần cứng: mẫu chiếm chỗ của dữ kiện trong cùng một cửa sổ ngữ cảnh,
 * và bốn mẫu thì model bắt đầu ghép chữ của mẫu vào bài thay vì học nhịp.
 */
export const SO_MAU_MOI_LUOT = 2;

/**
 * Chọn mẫu cho một lượt sinh.
 *
 * Ưu tiên theo thứ tự: đúng bề mặt → đúng loại tình huống → đúng phần đời.
 * Không ưu tiên mẫu "đẹp nhất": mẫu gần với việc đang viết dạy được nhiều hơn
 * một mẫu hay mà lệch tình huống.
 */
export function chonMauVang(vao: {
  beMat: BeMatMau;
  loai?: LoaiMau[];
  muc?: MucId[];
  soLuong?: number;
}): MauVang[] {
  const soLuong = vao.soLuong ?? SO_MAU_MOI_LUOT;
  if (soLuong <= 0) return [];

  const dungBeMat = KHO_VANG.filter((m) => m.beMat === vao.beMat);
  if (dungBeMat.length === 0) return [];

  const diem = (m: MauVang) =>
    (vao.loai?.includes(m.loai) ? 2 : 0) + (m.muc && vao.muc?.includes(m.muc) ? 1 : 0);

  /*
   * Sắp ỔN ĐỊNH: cùng điểm thì giữ thứ tự khai báo trong kho.
   *
   * Không bốc ngẫu nhiên. Hai lần mở cùng một lá số phải ra cùng một bài —
   * cùng lý do đã khiến mọi bề mặt của sản phẩm này được đệm theo khoá thay vì
   * sinh mới mỗi lần.
   */
  return [...dungBeMat]
    .map((m, i) => ({ m, i, d: diem(m) }))
    .sort((a, b) => b.d - a.d || a.i - b.i)
    .slice(0, soLuong)
    .map((x) => x.m);
}

/**
 * Dựng khối mẫu cho prompt. Kho rỗng thì trả chuỗi rỗng — prompt không đổi.
 *
 * Nói rõ với model đây là MẪU VỀ CÁCH VIẾT, không phải dữ kiện: bằng không nó
 * sẽ mượn luôn tên sao và nhận định trong mẫu cho lá số đang viết. Đây là lỗi
 * đắt nhất có thể có ở đây — bịa dữ kiện mà nghe rất trôi chảy.
 */
export function khoiMauVang(ds: MauVang[]): string {
  if (ds.length === 0) return '';
  const than = ds
    .map((m, i) => `--- MẪU ${i + 1} — ${m.nhan}\n${m.van.trim()}`)
    .join('\n\n');
  return `MẪU VỀ CÁCH VIẾT (${ds.length} bản, do người viết)

Đây là mẫu về NHỊP VĂN và CÁCH DẪN, KHÔNG phải dữ kiện của lá số đang viết.
Tuyệt đối không mượn tên sao, tên cách cục hay nhận định nào trong mẫu — lá số
trong mẫu là người khác. Học cách đặt câu, cách mở, cách khép; viết nội dung
bằng đúng dữ kiện đang có ở dưới.

${than}
--- HẾT MẪU`;
}
