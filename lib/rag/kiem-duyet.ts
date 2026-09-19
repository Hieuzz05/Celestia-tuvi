import type { GoiBangChung, TraLoiCoCauTruc } from './bang-chung';
import { TEN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
import { nhanDangThucThe, boDau, KHONG_QUET_TU_DO, TEN_SAO_TRONG_TU_DIEN } from './thuc-the';
import { TEN_CUNG } from '@/lib/tuvi/constants';

/**
 * Validator tất định — chạy trước, và với phần lớn lỗi là chạy thay cho LLM thứ hai.
 *
 * Tử Vi có từ vựng đóng, nên ba loại lỗi nguy hiểm nhất đều bắt được bằng luật:
 *
 *   1. Bịa mã: model trích F009 trong khi gói chỉ có tới F007.
 *   2. Bịa sao: model nói "Thiên Riêu tại Quan Lộc" mà dữ kiện không hề có.
 *   3. Khẳng định chuyên môn không nguồn: nói một quy tắc tử vi mà không gắn
 *      mã nào — tức là lấy từ trí nhớ model, đúng thứ spec cấm.
 *
 * Gọi một model thứ hai để kiểm ba thứ này vừa chậm vừa đắt vừa kém tin cậy hơn
 * so sánh chuỗi.
 */

export const PHIEN_BAN_VALIDATOR = '2026.09.3';

export type MucDo = 'chan' | 'canh-bao';

export interface LoiKiemDuyet {
  ma: string;
  mucDo: MucDo;
  moTa: string;
  /** Tiêu đề ý chính chứa lỗi, nếu lỗi thuộc về một ý cụ thể */
  tai?: string;
}

export interface KetQuaKiemDuyet {
  dat: boolean;
  loi: LoiKiemDuyet[];
  /** Tỉ lệ ý chính có ít nhất một mã nguồn — chỉ số evidence coverage của spec */
  phuSong: number;
  phienBan: string;
}

/**
 * Câu có phải khẳng định chuyên môn tử vi không?
 *
 * Dùng chính từ điển thực thể: một câu nhắc tới tên sao, tên cung hay Tứ Hóa thì
 * đang nói về học thuyết, chứ không phải đang động viên chung chung. Chỉ những
 * câu như vậy mới bị bắt buộc có nguồn — nếu bắt mọi câu thì lời khuyên đời
 * thường cũng bị chặn, và đó không phải điều spec yêu cầu.
 */
function laKhangDinhChuyenMon(cau: string): boolean {
  return nhanDangThucThe(cau).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION');
}

/**
 * Tên chuyên môn dùng để bắt câu hỏi ngược sai vai — đã bỏ dấu sẵn.
 *
 * Lọc qua `KHONG_QUET_TU_DO` của từ điển thực thể: danh sách ấy giữ những tên
 * một âm tiết trùng từ tiếng Việt thường ("Tử" trùng "tự", "Suy" trùng "suy
 * nghĩ"). Không lọc thì "Bạn đã TỰ hỏi vì sao muốn đi chưa?" bị coi là hỏi về
 * lá số — đo được ngay khi vừa viết luật.
 */
const TEN_CHUYEN_MON: string[] = [...TEN_CUNG, ...TEN_SAO_TRONG_TU_DIEN, ...TEN_CACH_CUC]
  .map(boDau)
  .filter((t) => !KHONG_QUET_TU_DO.has(t));

/**
 * Mọi cụm 1–5 từ trong một câu.
 *
 * Khớp theo TỪ, không theo chuỗi con. Luật này đã trả giá hai lần ở cổng ngôn
 * ngữ ("thiên cơ" bắt nhầm sao Thiên Cơ, "không hợp" bắt nhầm "không hợp lý")
 * và suýt trả lần thứ ba ở đây: tên "Tử" — một giai đoạn vòng Tràng Sinh —
 * khớp vào giữa "Tử Vi", và sẽ khớp cả vào "tự hỏi" sau khi bỏ dấu.
 */
function cumTu(khongDau: string): Set<string> {
  const tu = khongDau.split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i < tu.length; i++) {
    for (let n = 1; n <= 5 && i + n <= tu.length; n++) ra.add(tu.slice(i, i + n).join(' '));
  }
  return ra;
}

/**
 * Câu có viết dạng điều kiện không.
 *
 * "nếu" và "chừng nào" là dấu hiệu không mập mờ. "khi" thì mập mờ: nó mở được
 * một mệnh đề điều kiện ("khi người quản lý đổi, …") nhưng cũng nằm trong
 * "trước khi", "sau khi", "mỗi khi" — những cụm đi kèm câu MỆNH LỆNH nhiều hơn
 * là câu điều kiện. Đo được ngay khi vừa viết luật: "Bạn nên cân nhắc kỹ trước
 * khi quyết" lọt qua thành câu điều kiện dù nó là mệnh lệnh nguyên vẹn.
 */
const LA_DIEU_KIEN = /\bnếu\b|chừng nào|(?<!trước |sau |mỗi |đến |từ )\bkhi\b/iu;

/**
 * Cụm rào trước đón sau — đếm trên chữ đã bỏ dấu.
 *
 * Mỗi cụm một mình là bình thường; hai cụm trở lên trong một câu kết luận thì
 * câu ấy không còn nghiêng về bên nào nữa.
 */
const CUM_BA_PHAI = [
  'co the', 'cung co the', 'con tuy', 'tuy vao', 'vua co', 'khong de noi chac',
  'kho noi truoc', 'chua the khang dinh', 'mot mat', 'mat khac', 'tuy nhien cung',
];

export function kiemDuyet(traLoi: TraLoiCoCauTruc, goi: GoiBangChung): KetQuaKiemDuyet {
  const loi: LoiKiemDuyet[] = [];

  const maDuKien = new Set(goi.duKien.map((f) => f.id));
  const maNguon = new Set(goi.bangChung.map((e) => e.id));

  // Tên sao/cung được phép nhắc tới: lấy từ chính dữ kiện lá số và nội dung các
  // đoạn nguồn. Ngoài hai chỗ đó thì model đang tự nghĩ ra.
  const chuoiChoPhep = [
    ...goi.duKien.map((f) => f.noiDung),
    ...goi.bangChung.map((e) => e.noiDung),
  ].join(' ');
  const thucTheChoPhep = new Set(nhanDangThucThe(chuoiChoPhep).map((t) => t.id));

  /*
   * Cách cục được phép gọi thẳng tên — nhưng CHỈ những cách cục engine đã phát.
   *
   * Cùng loại lỗi với bịa sao, và bắt được bằng đúng một phép so chuỗi. Nguy
   * hiểm hơn bịa sao một bậc: một tên cách cục nghe rất chuyên môn nên người
   * đọc tin ngay, mà model thì có sẵn hàng trăm tên cách cục trong trí nhớ để
   * ghép bừa vào.
   *
   * So trên chữ đã bỏ dấu để "Tử Phủ Vũ Tướng Liêm" và "tu phu vu tuong liem"
   * là một; so theo chuỗi con vì tên cách cục luôn nằm giữa câu.
   */
  const cachCucChoPhep = goi.duKien
    .map((f) => f.tenCachCuc)
    .filter((x): x is string => !!x);
  const choPhepKhongDau = cachCucChoPhep.map(boDau);

  let soYCoNguon = 0;

  /*
   * hoiLai phải hỏi ĐỜI THỰC, không hỏi lá số.
   *
   * Mục đích của nó là lấy về thứ lá số không biết. Hỏi "cung Quan Lộc của bạn
   * thế nào" là hỏi lại chính thứ engine vừa đưa cho model — vòng tròn, và tốn
   * của người dùng một lượt.
   */
  /*
   * Lớp tự kiểm — bắt buộc với câu quyết định.
   *
   * Cảnh báo chứ chưa chặn: đây là trường mới, chưa có số về tỉ lệ tuân thủ.
   * Chặn một bài đúng vì thiếu một trường vừa thêm là đổi một lỗi hình thức
   * lấy một câu trả lời mất hẳn. Nâng lên chặn sau khi eval cho thấy model
   * điền được ổn định.
   */
  /*
   * Câu hỏi thẳng mà không có câu trả lời thẳng.
   *
   * Đây là lỗi người dùng nhận ra đầu tiên và khó chịu nhất: hỏi "năm 2026 có
   * chuyển việc không" rồi nhận về ba đoạn phân tích cân bằng hoàn hảo. Cảnh
   * báo chứ chưa chặn — bài vẫn dùng được, chỉ là nó né.
   */
  if ((goi.yDinh === 'quyet-dinh' || goi.yDinh === 'co-khong') && !traLoi.ketLuan) {
    loi.push({
      ma: 'thieu-ket-luan',
      mucDo: 'canh-bao',
      moTa: 'Câu hỏi cần một câu trả lời thẳng mà bài không có trường ketLuan.',
      tai: 'ketLuan',
    });
  }

  /*
   * Kết luận viết theo kiểu ba phải.
   *
   * Đếm được: "có thể … cũng có thể", "còn tuỳ", "vừa … vừa". Hai cụm trở lên
   * trong một hai câu thì đó không còn là thận trọng, đó là né.
   */
  if (traLoi.ketLuan) {
    const kd = boDau(traLoi.ketLuan);
    const raoTruoc = CUM_BA_PHAI.filter((c) => kd.includes(c));
    if (raoTruoc.length >= 2) {
      loi.push({
        ma: 'ket-luan-ba-phai',
        mucDo: 'canh-bao',
        moTa: 'Câu kết luận rào trước đón sau tới mức không còn nghiêng về bên nào.',
        tai: raoTruoc.join(', '),
      });
    }
  }

  if ((goi.yDinh === 'quyet-dinh' || goi.yDinh === 'co-khong') && !traLoi.tuKiem) {
    loi.push({
      ma: 'thieu-tu-kiem',
      mucDo: 'canh-bao',
      moTa: 'Câu quyết định mà không có cách tự kiểm chứng ngoài Tử Vi — thiếu lớp thứ tư của chuẩn ngôn ngữ.',
      tai: 'tuKiem',
    });
  }

  if (traLoi.tuKiem) {
    const cumTuKiem = cumTu(boDau(traLoi.tuKiem));
    if (TEN_CHUYEN_MON.some((t) => cumTuKiem.has(t))) {
      loi.push({
        ma: 'tu-kiem-van-la-tu-vi',
        mucDo: 'canh-bao',
        moTa: 'Cách tự kiểm vẫn trỏ về lá số — nó phải là việc kiểm được ở ngoài Tử Vi.',
        tai: 'tuKiem',
      });
    }
  }

  if (traLoi.hoiLai) {
    /*
     * So trên TÊN CHÍNH THỨC, không qua bộ nhận dạng thực thể.
     *
     * `nhanDangThucThe` nhận cung qua bí danh, mà bí danh của cung CỐ Ý là từ
     * đời thường — đó là cả lý do bảng bí danh tồn tại, để "công việc" trỏ
     * được tới Quan Lộc khi người ta hỏi. Dùng nó ở đây thì "Công việc hiện
     * tại của bạn có gì khiến bạn muốn đi?" bị coi là hỏi về lá số, trong khi
     * đó là câu hỏi đời thực hoàn hảo.
     *
     * Đo được: tiêu chí "có câu hỏi ngược" đứng im ở 66,7% qua hai lần đo dù
     * prompt đã bắt buộc hoiLai — bốn trên năm bài bị cờ đều là câu đời thực.
     *
     * Thứ cần chặn là tên chuyên môn: "cung Quan Lộc của bạn ra sao".
     */
    const cumHoi = cumTu(boDau(traLoi.hoiLai));
    const hoiLaSo = TEN_CHUYEN_MON.some((t) => cumHoi.has(t));
    const hoiVoNghia = /\b(?:có đúng không|đúng chứ|thấy đúng không|có giống)\b/iu.test(traLoi.hoiLai);
    if (hoiLaSo || hoiVoNghia) {
      loi.push({
        ma: 'hoi-lai-sai-vai',
        mucDo: 'canh-bao',
        moTa: hoiLaSo
          ? 'Câu hỏi ngược đang hỏi về lá số — thứ engine đã đưa sẵn — thay vì hỏi dữ kiện đời thực.'
          : 'Câu hỏi ngược chỉ xin xác nhận, không lấy thêm được dữ kiện nào.',
        tai: 'hoiLai',
      });
    }
  }

  for (const y of traLoi.yChinh) {
    const nhan = y.tieuDe || y.noiDung.slice(0, 40);

    const vanKhongDau = boDau(`${y.tieuDe ?? ''} ${y.noiDung} ${y.luongNguoc ?? ''}`);
    const biaCachCuc = TEN_CACH_CUC.filter(
      (t) => vanKhongDau.includes(boDau(t)) && !choPhepKhongDau.some((c) => c === boDau(t))
    );
    for (const t of biaCachCuc) {
      loi.push({
        ma: 'cach-cuc-khong-ton-tai',
        mucDo: 'chan',
        moTa: `Nhắc cách cục "${t}" nhưng lá số này không có nó.`,
        tai: nhan,
      });
    }

    for (const m of y.maDuKien) {
      if (!maDuKien.has(m)) {
        loi.push({
          ma: 'du-kien-khong-ton-tai',
          mucDo: 'chan',
          moTa: `Trích dữ kiện ${m} nhưng lá số không có mã này.`,
          tai: nhan,
        });
      }
    }

    /*
     * neuThi phải là câu ĐIỀU KIỆN, không phải mệnh lệnh đổi vỏ.
     *
     * Trường này sinh ra để thay cho việc dồn lời khuyên xuống cuối bài. Nếu
     * không kiểm, model sẽ viết "bạn nên cân nhắc kỹ" vào đúng chỗ ấy và ta
     * được đúng cái cũ với một cái tên mới.
     */
    if (y.neuThi && !LA_DIEU_KIEN.test(y.neuThi)) {
      loi.push({
        ma: 'neu-thi-khong-dieu-kien',
        mucDo: 'canh-bao',
        moTa: 'Trường neuThi không viết dạng điều kiện — nó đang là một lời khuyên thẳng.',
        tai: nhan,
      });
    }

    for (const m of y.maNguon) {
      if (!maNguon.has(m)) {
        loi.push({
          ma: 'nguon-khong-ton-tai',
          mucDo: 'chan',
          moTa: `Trích nguồn ${m} nhưng gói bằng chứng không có mã này.`,
          tai: nhan,
        });
      }
    }

    // Sao/Tứ Hóa xuất hiện trong lời mà không có ở đâu trong đầu vào
    for (const tt of nhanDangThucThe(y.noiDung)) {
      if (tt.loai !== 'STAR' && tt.loai !== 'TRANSFORMATION') continue;
      if (!thucTheChoPhep.has(tt.id)) {
        loi.push({
          ma: 'sao-khong-co-trong-du-lieu',
          mucDo: 'chan',
          moTa: `Nhắc tới ${tt.ten} nhưng sao này không có trong dữ kiện lá số lẫn nguồn tham chiếu.`,
          tai: nhan,
        });
      }
    }

    const coCanCu = y.maDuKien.length > 0 || y.maNguon.length > 0;
    if (y.maNguon.length > 0) soYCoNguon += 1;

    if (!coCanCu) {
      // Mức độ phụ thuộc vào ý đó nói gì. Spec cấm trình bày claim chuyên môn
      // không căn cứ như thể nó có căn cứ — nhưng một lời khuyên đời thường
      // không nhắc sao nào thì không phải claim chuyên môn, và chặn nó chỉ làm
      // câu trả lời cụt đi chứ không an toàn hơn.
      loi.push(
        laKhangDinhChuyenMon(y.noiDung)
          ? {
              ma: 'khang-dinh-chuyen-mon-khong-can-cu',
              mucDo: 'chan',
              moTa: 'Nói về sao/Tứ Hóa nhưng không gắn với dữ kiện lá số hay nguồn nào.',
              tai: nhan,
            }
          : {
              ma: 'khong-can-cu',
              mucDo: 'canh-bao',
              moTa: 'Ý này không gắn mã nào, nhưng cũng không khẳng định điều gì về tử vi.',
              tai: nhan,
            }
      );
    } else if (laKhangDinhChuyenMon(y.noiDung) && y.maNguon.length === 0) {
      // Có dữ kiện lá số nhưng không có nguồn: model đang tự diễn giải học thuyết
      // từ trí nhớ. Chưa đến mức chặn (dữ kiện vẫn thật), nhưng phải ghi lại — đây
      // chính là con số "unsupported chuyên môn" mà spec đặt ngưỡng dưới 2%.
      loi.push({
        ma: 'dien-giai-khong-nguon',
        mucDo: 'canh-bao',
        moTa: 'Khẳng định chuyên môn dựa trên dữ kiện lá số nhưng không có nguồn tài liệu nào chống lưng.',
        tai: nhan,
      });
    }
  }

  if (traLoi.yChinh.length === 0) {
    loi.push({ ma: 'khong-co-y-nao', mucDo: 'chan', moTa: 'Câu trả lời không có ý chính nào.' });
  }

  return {
    dat: !loi.some((l) => l.mucDo === 'chan'),
    loi,
    phuSong: traLoi.yChinh.length ? soYCoNguon / traLoi.yChinh.length : 0,
    phienBan: PHIEN_BAN_VALIDATOR,
  };
}

/**
 * Bỏ những ý không qua được kiểm duyệt, giữ lại phần còn lại.
 *
 * Chặn cả câu trả lời vì một ý sai là phản ứng quá tay: người dùng mất luôn ba
 * ý đúng. Nên bỏ đúng ý hỏng.
 *
 * Nhưng nếu BỎ HẾT thì giữ nguyên bài và báo không đạt. Lúc đó nguyên nhân gần
 * như chắc chắn nằm ở phía ta — model không hiểu khuôn JSON, hoặc gói bằng chứng
 * rỗng nên chẳng có mã nào để trích — chứ không phải model bịa đặt có hệ thống.
 * Trả về một câu trả lời rỗng trong tình huống đó là tự làm hỏng sản phẩm để
 * chống một mối nguy chưa xảy ra. Bài vẫn ra, `dat: false` vào nhật ký, và tỉ lệ
 * đó nhìn được ở trang quản trị — hỏng thì thấy, chứ không im lặng.
 */
export function locYHong(
  traLoi: TraLoiCoCauTruc,
  ketQua: KetQuaKiemDuyet
): { traLoi: TraLoiCoCauTruc; soYBiBo: number } {
  const nhanHong = new Set(
    ketQua.loi.filter((l) => l.mucDo === 'chan' && l.tai).map((l) => l.tai!)
  );
  if (nhanHong.size === 0) return { traLoi, soYBiBo: 0 };

  const giu = traLoi.yChinh.filter((y) => !nhanHong.has(y.tieuDe || y.noiDung.slice(0, 40)));
  if (giu.length === 0) return { traLoi, soYBiBo: 0 };

  return { traLoi: { ...traLoi, yChinh: giu }, soYBiBo: traLoi.yChinh.length - giu.length };
}
