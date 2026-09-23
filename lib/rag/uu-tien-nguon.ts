import type { DoanUngVien } from './truy-hoi';

/**
 * Ưu tiên khi nhiều nguồn cùng nói về một điểm.
 *
 * Hai tài liệu tử vi rất hay nói ngược nhau — khác trường phái, khác đời, khác
 * người chú giải. Tài liệu framework chỉ xếp hạng theo LOẠI nguồn (engine >
 * RAG > lời người dùng > trí nhớ model) mà không nói gì về việc hai tài liệu
 * RAG mâu thuẫn nhau thì nghe ai. Đây là phần bù vào chỗ đó.
 *
 * Nguyên tắc nền: **không cố phát hiện mâu thuẫn bằng luật.** Máy không đọc
 * được hai đoạn văn rồi kết luận chúng chỏi nhau — việc đó cần một model thứ
 * hai, chậm và không đáng tin ở P0. Thay vào đó ta làm ba việc rẻ và chắc:
 *
 *   1. Xếp hạng nguồn theo thứ bậc tường minh, rồi nói thứ bậc đó cho model.
 *      Model tự gặp mâu thuẫn trong lúc đọc, và nó có sẵn luật để xử.
 *   2. Đảm bảo gói bằng chứng có nhiều tiếng nói, không phải sáu đoạn của cùng
 *      một cuốn sách.
 *   3. Đếm số nguồn ĐỘC LẬP đồng thuận để biết một nhận định mạnh tới đâu.
 *
 * Điều dễ sai nhất và đắt nhất: coi ba đoạn cùng một tài liệu là ba tín hiệu
 * độc lập. Đó vẫn chỉ là một người nói ba lần.
 */

export const PHIEN_BAN_UU_TIEN = '2026.09.2';

/** Thứ bậc tin cậy. Số nhỏ hơn = đứng trên. */
export const BAC_TIN_CAY: Record<string, number> = {
  'cot-loi': 0,
  'chuyen-gia-duyet': 1,
  'tham-khao': 2,
  'ho-tro': 3,
};

export const NHAN_TIN_CAY: Record<string, string> = {
  'cot-loi': 'quy tắc cốt lõi',
  'chuyen-gia-duyet': 'chuyên gia đã duyệt',
  'tham-khao': 'tham khảo',
  'ho-tro': 'bổ trợ',
};

const bac = (m: string) => BAC_TIN_CAY[m] ?? 9;

/**
 * Hai điểm RRF chênh nhau dưới ngưỡng này thì coi như ngang nhau, và mức tin cậy
 * quyết định ai đứng trước.
 *
 * Vì sao là băng dung sai chứ không phải hệ số nhân: khoảng cách RRF giữa các
 * hạng liền kề vốn đã rất nhỏ (hạng 1 và hạng 5 chỉ chênh ~7%), nên bất kỳ hệ
 * số nhân nào cũng đủ để một nguồn "cốt lõi" lạc đề nhảy lên trước một nguồn
 * "tham khảo" đúng trọng tâm. Mức tin cậy chỉ nên phân xử khi hai đoạn đã ngang
 * nhau về độ liên quan — không nên thay thế độ liên quan.
 */
const BANG_DUNG_SAI = 0.05;

/**
 * Tối đa bao nhiêu đoạn từ cùng một tài liệu được vào gói bằng chứng.
 *
 * Một cuốn sách chiếm trọn sáu chỗ thì model chỉ nghe một tiếng nói, mà lại
 * tưởng mình đang đọc sáu nguồn. Chặn ở 2 buộc gói phải đa giọng khi kho có đủ
 * tài liệu; kho chỉ có một nguồn thì luật này tự nới ra (xem `chonDaDang`).
 */
const TOI_DA_MOI_TAI_LIEU = 2;

/**
 * Sắp xếp ứng viên: độ liên quan trước, mức tin cậy phân xử khi ngang ngửa.
 */
export function xepTheoUuTien(ds: DoanUngVien[]): DoanUngVien[] {
  return [...ds].sort((a, b) => {
    const chenh = Math.abs(a.diemRRF - b.diemRRF);
    const nguong = Math.max(a.diemRRF, b.diemRRF) * BANG_DUNG_SAI;
    if (chenh > nguong) return b.diemRRF - a.diemRRF;

    // Đã ngang nhau về độ liên quan — giờ mới tới thứ bậc nguồn
    const theoBac = bac(a.mucTinCay) - bac(b.mucTinCay);
    if (theoBac !== 0) return theoBac;

    return b.diemRRF - a.diemRRF;
  });
}

/**
 * Tỉ lệ chữ của đoạn ngắn hơn nằm lại trong đoạn dài hơn, tính trên cụm 3 từ
 * liên tiếp đã bỏ dấu. Trên ngưỡng này thì coi là chép lại nhau.
 *
 * Vì sao đo "độ chứa" chứ không đo Jaccard: hai cuốn sách chép cùng một câu phú
 * nhưng cắt đoạn ở chỗ khác nhau, nên đoạn này thường là một phần của đoạn kia.
 * Jaccard chia cho phần hợp, ra số thấp dù phần chung chiếm gần hết đoạn ngắn.
 *
 * Vì sao 0,5: đoạn nào mà một nửa chữ đã nằm sẵn trong gói thì nó không còn đủ
 * điều mới để giữ một chỗ trong sáu chỗ. Phần chồng lấn 150 ký tự giữa hai đoạn
 * liền nhau của cùng một sách chỉ chiếm ~12% đoạn, còn xa mới chạm ngưỡng.
 */
export const NGUONG_TRUNG = 0.5;

function vanTay(s: string): Set<string> {
  const tu = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + 2 < tu.length; i++) ra.add(`${tu[i]} ${tu[i + 1]} ${tu[i + 2]}`);
  return ra;
}

/** Độ chứa giữa hai đoạn, trong [0,1]. Đoạn dưới ba từ thì không so được, trả 0. */
export function doTrung(a: string, b: string): number {
  const A = vanTay(a);
  const B = vanTay(b);
  const nho = A.size <= B.size ? A : B;
  const lon = nho === A ? B : A;
  if (nho.size === 0) return 0;
  let chung = 0;
  for (const x of nho) if (lon.has(x)) chung += 1;
  return chung / nho.size;
}

/**
 * Chọn danh sách cuối: bỏ đoạn trùng, giới hạn số đoạn mỗi tài liệu.
 *
 * Bỏ trùng đi trước mọi thứ. Sách tử vi chép phú của nhau, nên cùng một câu có
 * thể về từ ba cuốn. Giữ cả ba thì gói mất ba chỗ cho một ý, và tệ hơn,
 * `mucChacChan` đếm thành ba nguồn độc lập đồng thuận — một sự đồng thuận giả.
 * Đoạn được giữ là đoạn đứng trước trong `daXep`, tức đã thắng về độ liên quan
 * rồi tới mức tin cậy; hạn mức mỗi tài liệu không cứu được chuyện này vì ba
 * bản chép nằm ở ba tài liệu khác nhau.
 *
 * Vòng một lấy theo hạn mức để gói có nhiều tiếng nói. Nếu chưa đủ số lượng —
 * kho còn ít tài liệu — vòng hai lấp nốt bằng các đoạn tốt nhất còn lại. Thà
 * một gói kém đa dạng còn hơn một gói thiếu bằng chứng. Nhưng đoạn trùng thì
 * không được lấp vào: nó không thêm bằng chứng nào.
 */
export function chonDaDang(daXep: DoanUngVien[], soCuoi: number): DoanUngVien[] {
  const dem = new Map<string, number>();
  const chon: DoanUngVien[] = [];
  const dePhong: DoanUngVien[] = [];
  // Đoạn đã giữ lại làm đại diện, kể cả đoạn đang nằm dự phòng — một đoạn trùng
  // với đoạn dự phòng cũng không nên lấp vào sau đó
  const daXet: DoanUngVien[] = [];

  for (const u of daXep) {
    const goc = daXet.find((c) => doTrung(u.noiDung, c.noiDung) >= NGUONG_TRUNG);
    if (goc) {
      u.trungVoi = goc.chunkId;
      continue;
    }
    daXet.push(u);

    const soDaCo = dem.get(u.documentId) ?? 0;
    if (chon.length < soCuoi && soDaCo < TOI_DA_MOI_TAI_LIEU) {
      chon.push(u);
      dem.set(u.documentId, soDaCo + 1);
    } else {
      dePhong.push(u);
    }
  }

  for (const u of dePhong) {
    if (chon.length >= soCuoi) break;
    chon.push(u);
  }

  return chon;
}

export type MucChacChan = 'manh' | 'vua' | 'yeu' | 'trai-chieu' | 'chua-du';

/**
 * Độ chắc của bằng chứng cho một nhận định, đo bằng số nguồn ĐỘC LẬP.
 *
 * Độc lập = khác tài liệu. Ba đoạn trong cùng một cuốn sách vẫn là một người
 * nói ba lần, và nếu đếm chúng thành ba thì mọi nhận định đều trông "mạnh".
 * Hai cuốn chép cùng một câu cũng vậy — trường hợp đó bị chặn từ `chonDaDang`,
 * nên nguồn đưa vào đây đã không còn bản chép.
 *
 * Nguồn mức `ho-tro` không tự nó nâng được độ chắc: nó làm dày ngữ cảnh chứ
 * không phải căn cứ.
 */
export function mucChacChan(nguon: { documentId: string; mucTinCay: string }[]): MucChacChan {
  const dangKe = nguon.filter((n) => bac(n.mucTinCay) <= BAC_TIN_CAY['tham-khao']);
  const soTaiLieu = new Set(dangKe.map((n) => n.documentId)).size;
  const coCotLoi = dangKe.some((n) => n.mucTinCay === 'cot-loi');

  if (soTaiLieu === 0) return 'chua-du';
  if (soTaiLieu >= 3 || (soTaiLieu >= 2 && coCotLoi)) return 'manh';
  if (soTaiLieu === 2 || coCotLoi) return 'vua';
  return 'yeu';
}

/** Ngôn ngữ được phép dùng ứng với từng mức — theo bảng 5.2 của framework */
export const CACH_NOI_THEO_MUC: Record<MucChacChan, string> = {
  'manh': 'Một nét khá rõ… / Điểm này lặp lại ở nhiều lớp…',
  'vua': 'Có xu hướng… / Điểm đáng để ý là…',
  'yeu': 'Có một khả năng đáng để để ý… (hoặc bỏ hẳn nếu không cần)',
  'trai-chieu': 'Có hai lực cùng tồn tại… — bắt buộc nói cả hai',
  'chua-du': 'Celes chưa có đủ căn cứ để đi xa hơn ở điểm này.',
};

/**
 * Câu luật đưa vào prompt.
 *
 * Model là chỗ duy nhất đọc hiểu được nội dung hai đoạn, nên nó phải là chỗ xử
 * mâu thuẫn — nhưng xử theo luật viết sẵn, không theo cảm tính. Phần này nói
 * cho nó biết luật đó.
 */
export function luatUuTienNguon(): string {
  return [
    'THỨ BẬC NGUỒN — dùng khi hai nguồn nói ngược nhau:',
    '1. Dữ kiện lá số (F###) là bất khả xâm phạm. Không nguồn tài liệu nào được phép phủ định nó.',
    '2. Giữa các nguồn tài liệu, thứ tự là: quy tắc cốt lõi > chuyên gia đã duyệt > tham khảo > bổ trợ.',
    '   Mỗi nguồn đã được ghi sẵn mức của nó ở đầu đoạn.',
    '3. Hai nguồn KHÁC mức mà nói ngược nhau: theo nguồn mức cao hơn, và không cần nhắc tới nguồn thấp hơn.',
    '4. Hai nguồn CÙNG mức mà nói ngược nhau: nói rõ là có hai cách đọc, nêu cả hai, đừng chọn bừa một bên.',
    '5. Nguồn mức "bổ trợ" không bao giờ được làm căn cứ duy nhất cho một nhận định chuyên môn.',
    '6. Nhiều đoạn trong CÙNG một tài liệu chỉ tính là MỘT tiếng nói. Ba đoạn cùng sách không phải ba nguồn đồng thuận.',
    '7. Không có nguồn nào đủ căn cứ thì thu hẹp kết luận và nói thẳng là chưa đủ, đừng lấy trí nhớ của bạn lấp vào.',
  ].join('\n');
}
