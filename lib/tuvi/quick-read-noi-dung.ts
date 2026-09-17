/**
 * Nội dung chữ cho Quick Read, tách theo ngôn ngữ.
 *
 * Để riêng khỏi `quick-read.ts` vì đây là phần VIẾT, không phải phần TÍNH: sửa
 * lời văn không được đụng tới logic đọc lá số, và bản tiếng Anh phải viết lại chứ
 * không dịch máy từng chữ — "Thiên Cơ" mà dịch thẳng thì người đọc tiếng Anh
 * không hiểu gì hơn.
 *
 * Giọng theo brand spec: dùng "thường / dễ / có xu hướng", nói về tình huống sống
 * chứ không về thuật ngữ, và không hứa hẹn kết quả.
 */

export type NgonNguDoc = 'vi' | 'en';

export interface NetSao {
  /** Điều người này thường làm tốt */
  manh: string;
  /** Điều người này thường cần để thấy đủ */
  can: string;
}

const NET_VI: Record<string, NetSao> = {
  'Tử Vi': {
    manh: 'bạn thường được đặt vào vị trí phải đứng ra quyết định, kể cả khi không chủ động nhận',
    can: 'một không gian đủ rộng để tự sắp xếp mọi thứ theo cách của mình',
  },
  'Thiên Cơ': {
    manh: 'bạn nghĩ nhanh, thích gỡ rối và hay thấy đường đi mà người khác chưa thấy',
    can: 'việc có thay đổi liên tục để không bị chán, và người chịu nghe hết lập luận của bạn',
  },
  'Thái Dương': {
    manh: 'bạn dễ trở thành người kéo nhóm đi, cho đi trước rồi mới tính tới phần mình',
    can: 'được ghi nhận rõ ràng, vì bạn ít khi tự đòi phần công của mình',
  },
  'Vũ Khúc': {
    manh: 'bạn làm thật, dứt khoát, và đo mọi thứ bằng kết quả cụ thể',
    can: 'mục tiêu rõ ràng và quyền tự quyết về nguồn lực, thay vì phải chiều lòng nhiều bên',
  },
  'Thiên Đồng': {
    manh: 'bạn dễ chịu, biết tự tìm niềm vui và ít khi đẩy căng thẳng lên người khác',
    can: 'một áp lực vừa đủ từ bên ngoài, vì bạn thường hoãn việc khi không có hạn chót',
  },
  'Liêm Trinh': {
    manh: 'bạn có nguyên tắc riêng khá chắc và giữ được nó ngay cả khi bất lợi',
    can: 'môi trường công bằng, vì bạn phản ứng mạnh khi thấy luật chơi bị bẻ cong',
  },
  'Thiên Phủ': {
    manh: 'bạn giữ được sự ổn định cho cả nhóm và là chỗ người khác tìm đến khi rối',
    can: 'sự an toàn ở mức nền, để dám thử những thứ rủi ro hơn',
  },
  'Thái Âm': {
    manh: 'bạn tinh ý, nhớ chi tiết và chăm sóc người khác theo cách không ồn ào',
    can: 'thời gian ở một mình để nạp lại, và người chủ động hỏi han bạn trước',
  },
  'Tham Lang': {
    manh: 'bạn ham học cái mới, giao tiếp rộng và thích nghi rất nhanh',
    can: 'sự đa dạng, nhưng cũng cần một trọng tâm để không dàn trải',
  },
  'Cự Môn': {
    manh: 'bạn nói có sức nặng, hay đặt đúng câu hỏi mà người khác né',
    can: 'được nói thẳng, vì phải giữ trong lòng lâu là thứ làm bạn mệt nhất',
  },
  'Thiên Tướng': {
    manh: 'bạn đáng tin, giữ lời và thường là người đứng giữa hoà giải',
    can: 'biết rõ mình đang đứng về phía nào, vì bạn khó chịu khi phải mập mờ',
  },
  'Thiên Lương': {
    manh: 'bạn điềm tĩnh khi việc rối và hay là chỗ dựa cho người trẻ hơn',
    can: 'ý nghĩa trong việc đang làm, vì lương cao mà rỗng thì bạn không trụ lâu',
  },
  'Thất Sát': {
    manh: 'bạn quyết nhanh, dám chịu và không ngại bắt đầu lại từ đầu',
    can: 'một trận đánh đáng để đánh, vì việc quá êm làm bạn mất lửa',
  },
  'Phá Quân': {
    manh: 'bạn dám phá bỏ cái cũ để làm lại theo cách mình tin',
    can: 'người tin bạn ở giai đoạn dang dở, vì đó là lúc bạn dễ bị hiểu lầm nhất',
  },
};

const NET_EN: Record<string, NetSao> = {
  'Tử Vi': {
    manh: 'you tend to end up as the one who has to decide, even when you never asked for it',
    can: 'enough room to arrange things your own way',
  },
  'Thiên Cơ': {
    manh: 'you think fast, enjoy untangling problems, and often see a route others have not spotted',
    can: 'work that keeps changing so you do not go stale, and someone who hears your reasoning out',
  },
  'Thái Dương': {
    manh: 'you easily become the one pulling the group along, giving first and counting your share later',
    can: 'to be acknowledged plainly, because you rarely claim credit for yourself',
  },
  'Vũ Khúc': {
    manh: 'you get things actually done, decide cleanly, and measure everything by concrete results',
    can: 'a clear target and real authority over resources, instead of having to please everyone',
  },
  'Thiên Đồng': {
    manh: 'you are easy to be around, find your own enjoyment, and rarely push your stress onto others',
    can: 'just enough outside pressure, because you tend to postpone whatever has no deadline',
  },
  'Liêm Trinh': {
    manh: 'you hold a firm set of personal principles and keep to them even when it costs you',
    can: 'a fair environment, because you react strongly when the rules get bent',
  },
  'Thiên Phủ': {
    manh: 'you keep a group steady and become the person others come to when things get messy',
    can: 'a baseline of security, so you can afford to try the riskier thing',
  },
  'Thái Âm': {
    manh: 'you notice a lot, remember detail, and look after people without making noise about it',
    can: 'time alone to refill, and someone who asks after you first',
  },
  'Tham Lang': {
    manh: 'you pick up new things eagerly, connect widely, and adapt very quickly',
    can: 'variety — but also one centre of gravity so you do not spread too thin',
  },
  'Cự Môn': {
    manh: 'what you say carries weight, and you tend to ask the question everyone else avoids',
    can: 'to be able to say things straight, because holding it in is what wears you down',
  },
  'Thiên Tướng': {
    manh: 'you are dependable, you keep your word, and you often end up mediating',
    can: 'to know clearly which side you are on, because ambiguity sits badly with you',
  },
  'Thiên Lương': {
    manh: 'you stay level when things get tangled and often become the steady one for those younger',
    can: 'meaning in the work itself — a well-paid but hollow role will not hold you long',
  },
  'Thất Sát': {
    manh: 'you decide quickly, carry the consequences, and are not afraid to start over',
    can: 'a fight worth having, because things that are too smooth drain your drive',
  },
  'Phá Quân': {
    manh: 'you are willing to tear down the old arrangement and rebuild it the way you believe in',
    can: 'people who trust you mid-way through, because that is when you are most easily misread',
  },
};

/** Nét chủ đạo của từng cung chức năng */
const CHU_DE_VI: Record<string, string> = {
  Mệnh: 'nhìn lại chính mình và cách bạn muốn được nhìn nhận',
  'Phụ Mẫu': 'quan hệ với thế hệ trên và những người có ảnh hưởng tới bạn',
  'Phúc Đức': 'sự yên trong lòng và điều bạn thấy là đáng',
  'Điền Trạch': 'chỗ ở, nơi làm việc và những gì thuộc về nền tảng lâu dài',
  'Quan Lộc': 'công việc, vai trò và hướng phát triển',
  'Nô Bộc': 'bạn bè, đồng nghiệp và những mối quan hệ quanh bạn',
  'Thiên Di': 'việc ra ngoài, dịch chuyển và cơ hội đến từ bên ngoài',
  'Tật Ách': 'sức khoẻ, nhịp sinh hoạt và những thứ bào mòn bạn âm thầm',
  'Tài Bạch': 'tiền bạc và cách bạn tạo ra sự ổn định',
  'Tử Tức': 'con cái, thế hệ sau và những gì bạn gây dựng rồi trao lại',
  'Phu Thê': 'chuyện đôi lứa và cách bạn ở cạnh một người',
  'Huynh Đệ': 'anh chị em và những người ngang hàng đi cùng bạn',
};

const CHU_DE_EN: Record<string, string> = {
  Mệnh: 'how you see yourself and how you want to be seen',
  'Phụ Mẫu': 'the generation above you and the people who shaped you',
  'Phúc Đức': 'inner ease, and what you consider worth it',
  'Điền Trạch': 'home, workplace, and whatever forms your long-term footing',
  'Quan Lộc': 'work, the role you hold, and where it is heading',
  'Nô Bộc': 'friends, colleagues, and the circle around you',
  'Thiên Di': 'going out into the world, moving, and what arrives from outside',
  'Tật Ách': 'health, daily rhythm, and what quietly wears you down',
  'Tài Bạch': 'money, and how you build stability',
  'Tử Tức': 'children, what comes after you, and what you build to hand on',
  'Phu Thê': 'partnership, and how you are alongside another person',
  'Huynh Đệ': 'siblings and the peers walking beside you',
};

const DO_SANG_VI: Record<string, string> = {
  M: 'miếu',
  V: 'vượng',
  D: 'đắc địa',
  L: 'lợi',
  B: 'bình hoà',
  H: 'hãm',
};

const DO_SANG_EN: Record<string, string> = {
  M: 'at its strongest',
  V: 'thriving',
  D: 'well placed',
  L: 'favourable',
  B: 'neutral',
  H: 'constrained',
};

/** Khuôn câu — {ngoac} được thay bằng giá trị thật lúc dựng */
export interface KhuonChu {
  netSao: Record<string, NetSao>;
  chuDeCung: Record<string, string>;
  doSang: Record<string, string>;

  noiVaiVe: string;
  noiVeCuoi: string;

  diemNoiBat: { nhom: string; tieuDe: string; tieuDeTrong: string; trong: string };
  dieuThuongCan: { nhom: string; tieuDe: string; mo: string; moTrong: string; dong: string };
  giaiDoan: {
    nhom: string;
    tieuDe: string;
    daiVan: string;
    nam: string;
    nhacXuHuong: string;
  };
  linhVuc: {
    congViecNhom: string;
    tinhCamNhom: string;
    congViecTieuDe: string;
    tinhCamTieuDe: string;
    co: string;
    trong: string;
  };
  canCu: {
    cungTai: string;
    cungTaiY: string;
    saoDong: string;
    saoDongY: string;
    saoDongTrong: string;
    tuHoaY: string;
    tuanTriet: string;
    tuanTrietY: string;
    thanCu: string;
    thanCuY: string;
    giaiDoanTuoi: string;
    giaiDoanTuoiY: string;
    namUngVao: string;
    namUngVaoY: string;
    thangUngVao: string;
    thangUngVaoY: string;
  };
  /** Chữ cho màn luận hạn chi tiết của Hành trình */
  luanHan: {
    nhipTien: string;
    nhipGiu: string;
    nhipRaSoat: string;
    nhipThuHep: string;
    nhipTienMo: string;
    nhipGiuMo: string;
    nhipRaSoatMo: string;
    nhipThuHepMo: string;
    nhipHanhDong: string;
    chuDeChinh: string;
    tieuDeGiaiDoan: string;
    tieuDeNam: string;
    tieuDeThang: string;
    subline: string;
    tanDung: string;
    luuY: string;
    tanDungTrong: string;
    luuYTrong: string;
    nenLop: string;
    lopDaiVan: string;
    lopNam: string;
    lopThang: string;
    nhomLop: string;
    nhomCung: string;
    nhomSao: string;
    nhomTamPhuong: string;
    nhomTuHoa: string;
    nhomVongSao: string;
    nhomQuyTac: string;
    quyTacMo: string;
    linhVuc: Record<string, { nhan: string; cung: string }>;
    taiO: string;
    chamVao: string;
    khongChamVao: string;
    tuanTrietCau: string;
    linhVucCo: string;
    linhVucTrong: string;
    trangThaiThuan: string;
    trangThaiCan: string;
    trangThaiCanBang: string;
    khongThayTheYTe: string;
  };
  /** Chữ cho bảng luận giải 8 lĩnh vực của người đã đăng nhập */
  luanSau: {
    linhVuc: Record<string, { nhom: string; tieuDe: string; cauHoi: string }>;
    ketLuanCo: string;
    ketLuanTrong: string;
    doanNet: string;
    doanCan: string;
    doanSangRo: string;
    doanSangKim: string;
    doanTuHoa: string;
    doanTuanTriet: string;
    doanTamPhuong: string;
    doanTrong: string;
    vanHanKetLuan: string;
    vanHanDan: string;
    phatTrienKetLuan: string;
    phatTrienManh: string;
    phatTrienCan: string;
    phatTrienHoi: string;
  };
  /** Chữ cho màn Hành trình — dòng thời gian giai đoạn / năm / tháng */
  hanhTrinh: {
    giaiDoanNhan: string;
    giaiDoanPhu: string;
    thangNhan: string;
    tuoiAm: string;
    chuDeCo: string;
    chuDeTrong: string;
    nhipNhom: string;
    nhipTieuDe: string;
    nhipGiaiDoan: string;
    nhipNam: string;
    nhipThang: string;
  };
  tenCung: Record<string, string>;
}

/** Tên cung hiển thị — tiếng Anh giữ kèm tên gốc để người học Tử Vi vẫn đối chiếu được */
const TEN_CUNG_EN: Record<string, string> = {
  Mệnh: 'Self',
  'Phụ Mẫu': 'Parents',
  'Phúc Đức': 'Wellbeing',
  'Điền Trạch': 'Property',
  'Quan Lộc': 'Career',
  'Nô Bộc': 'Friends',
  'Thiên Di': 'Travel',
  'Tật Ách': 'Health',
  'Tài Bạch': 'Wealth',
  'Tử Tức': 'Children',
  'Phu Thê': 'Partnership',
  'Huynh Đệ': 'Siblings',
};

const TEN_CUNG_VI: Record<string, string> = Object.fromEntries(
  Object.keys(TEN_CUNG_EN).map((k) => [k, k])
);

export const KHUON: Record<NgonNguDoc, KhuonChu> = {
  vi: {
    netSao: NET_VI,
    chuDeCung: CHU_DE_VI,
    doSang: DO_SANG_VI,
    noiVaiVe: ', ',
    noiVeCuoi: ' — đồng thời ',
    diemNoiBat: {
      nhom: 'Điểm nổi bật',
      tieuDe: 'Thứ bạn thường làm tốt hơn người khác',
      tieuDeTrong: 'Bạn khó bị đóng khung',
      trong:
        'Cung Mệnh của bạn không có chính tinh nào đóng, nên nét cá nhân được mượn từ cung đối diện. Kiểu lá số này thường khiến bạn linh hoạt hơn, nhưng cũng dễ thấy mình khác đi tuỳ môi trường đang ở.',
    },
    dieuThuongCan: {
      nhom: 'Điều bạn thường cần',
      tieuDe: 'Thứ khiến bạn thấy đủ, hoặc thấy thiếu',
      mo: 'Bạn thường cần {net}.',
      moTrong:
        'Phần lớn năng lượng của bạn dồn về {chuDe} — đó thường là nơi bạn đầu tư nhiều nhất mà không tính toán thiệt hơn.',
      dong: ' Phần lớn năng lượng của bạn dồn về {chuDe}.',
    },
    giaiDoan: {
      nhom: 'Giai đoạn hiện tại',
      tieuDe: 'Điều dễ nổi lên quanh năm {nam}',
      daiVan: 'Bạn đang ở trong một giai đoạn dài mà trọng tâm nghiêng về {chuDe}.',
      nam: 'Riêng năm {nam}, chủ đề dễ nổi lên là {chuDe}.',
      nhacXuHuong: 'Đây là xu hướng của giai đoạn, không phải một sự việc chắc chắn sẽ xảy ra.',
    },
    linhVuc: {
      congViecNhom: 'Về công việc',
      tinhCamNhom: 'Về chuyện tình cảm',
      congViecTieuDe: 'Cách bạn thường vận hành trong công việc',
      tinhCamTieuDe: 'Cách bạn thường ở cạnh một người',
      co: 'Ở phần {chuDe}, nét nổi lên là: {net}.',
      trong:
        'Phần {chuDe} trong lá số của bạn không có chính tinh nào đóng, nên nét ở đây mượn từ cung đối diện — thường khiến bạn linh hoạt, nhưng cũng dễ thấy mình thay đổi tuỳ hoàn cảnh và tuỳ người.',
    },
    canCu: {
      cungTai: '{ten} tại {chi}',
      cungTaiY:
        'Trong lá số, {ten} rơi vào vị trí {chi}. Đây là điểm xuất phát để đọc mọi thứ còn lại.',
      saoDong: '{sao} {sang}',
      saoDongY:
        '{sao} đóng tại đây ở mức {sang} — mức này cho biết nét của sao thể hiện rõ hay bị kìm lại.',
      saoDongTrong: '{sao} đóng tại đây.',
      tuHoaY:
        '{sao} làm lệch cách nét trên biểu hiện ra, nên cùng một bộ sao vẫn cho ra trải nghiệm khác nhau.',
      tuanTriet: 'Có {ten} tại cung này',
      tuanTrietY: '{ten} làm nét của cung khó hiện ra sớm, thường phải qua một giai đoạn mới rõ.',
      thanCu: 'Thân cư {cung}',
      thanCuY:
        'Cung Thân cho biết phần đời bạn dồn sức vào nhiều nhất, thường rõ dần từ tuổi trung niên. Của bạn rơi vào {cung}.',
      giaiDoanTuoi: 'Giai đoạn {tu}–{den} tuổi ở {cung}',
      giaiDoanTuoiY:
        'Lá số chia đời thành các giai đoạn 10 năm. Giai đoạn bạn đang đi qua rơi vào cung {cung} ({chi}), nên chủ đề của cung đó nổi rõ hơn bình thường.',
      namUngVao: 'Năm {nam} ứng vào {cung}',
      namUngVaoY:
        'Mỗi năm ứng vào một cung khác nhau. Năm {nam} (tuổi âm {tuoi}) rơi vào cung {cung}, nên chủ đề của cung này dễ được nhắc tới trong năm.',
      thangUngVao: 'Tháng {thang} ứng vào {cung}',
      thangUngVaoY:
        'Trong một năm, mỗi tháng lại ứng vào một cung. Tháng {thang} năm {nam} rơi vào cung {cung}, nên chuyện của cung đó dễ nổi lên trong khoảng thời gian ngắn này.',
    },
    luanHan: {
      nhipTien: 'Tiến',
      nhipGiu: 'Giữ nhịp',
      nhipRaSoat: 'Rà soát',
      nhipThuHep: 'Thu hẹp',
      nhipTienMo:
        'Các yếu tố thuận đang nhiều hơn yếu tố cản. Đây là quãng đẩy được, miễn là đẩy đúng chỗ bạn vốn mạnh.',
      nhipGiuMo:
        'Thuận và cản gần ngang nhau. Giữ nguyên guồng đang chạy thường có lợi hơn mở thêm mặt trận mới.',
      nhipRaSoatMo:
        'Có vài chỗ cần kiểm lại trước khi đi tiếp. Không phải dừng, mà là xem lại thứ mình đang dựa vào.',
      nhipThuHepMo:
        'Yếu tố cản đang trội. Thu gọn lại những thứ đang dàn mỏng thường đỡ mệt hơn là cố giữ hết.',
      chuDeChinh: 'Chủ đề chính',
      tieuDeGiaiDoan: 'Một quãng dài nghiêng về {chuDe}',
      tieuDeNam: 'Năm {nam}: {chuDe} là thứ dễ nổi lên',
      tieuDeThang: 'Tháng {thang}/{nam}: nhịp ngắn xoay quanh {chuDe}',
      subline:
        'Dưới đây là điều đáng chú ý trong quãng này, và những gì đã dẫn Celes tới nhận định đó.',
      tanDung: 'Nên tận dụng',
      luuY: 'Nên lưu ý',
      tanDungTrong:
        'Quãng này không có yếu tố thuận nào nổi hẳn lên — thường là lúc kết quả đến từ việc làm đều hơn là từ cơ hội bất ngờ.',
      luuYTrong:
        'Không có yếu tố cản nào nổi hẳn lên. Điều dễ hỏng nhất trong quãng như vậy lại là chủ quan.',
      nhipHanhDong: 'Nhịp hành động',
      nenLop: 'Nền của quãng này',
      lopDaiVan: 'Quãng {tu}–{den} tuổi tại {cung}',
      lopNam: 'Năm {nam} tại {cung}',
      lopThang: 'Tháng {thang} tại {cung}',
      nhomLop: 'Lớp đang xét',
      nhomCung: 'Cung trọng tâm',
      nhomSao: 'Chính tinh / phụ tinh',
      nhomTamPhuong: 'Tam phương tứ chính',
      nhomTuHoa: 'Tứ Hóa',
      nhomVongSao: 'Tuần / Triệt / lưu tinh',
      nhomQuyTac: 'Nguồn quy tắc',
      quyTacMo:
        'Bộ quy tắc và phiên bản đã dùng để tính quãng này. Ghi lại để kết quả đọc lại về sau vẫn tái lập được.',
      linhVuc: {
        'cong-viec': { nhan: 'Công việc & định hướng', cung: 'Quan Lộc' },
        'tai-chinh': { nhan: 'Tài chính', cung: 'Tài Bạch' },
        'tinh-cam': { nhan: 'Tình cảm & quan hệ', cung: 'Phu Thê' },
        'gia-dinh': { nhan: 'Gia đình', cung: 'Phụ Mẫu' },
        'suc-khoe': { nhan: 'Sức khoẻ & năng lượng', cung: 'Tật Ách' },
        'hoc-tap': { nhan: 'Học tập & phát triển', cung: 'Phúc Đức' },
      },
      taiO: 'tại',
      chamVao: ' Quãng này chạm trực tiếp vào cung đó, nên phần này dễ có chuyện hơn bình thường.',
      khongChamVao:
        ' Quãng này không chạm trực tiếp vào cung đó, nên phần này thường giữ nguyên nhịp cũ.',
      tuanTrietCau: '{ten} đóng tại {cung} — {chuDe} thường chậm hiện ra đúng lúc cần',
      linhVucCo: 'Phần {nhan} đọc từ {cung} — {trangThai}.{them}',
      linhVucTrong: 'Phần {nhan} không đọc được từ lá số này.',
      trangThaiThuan: 'các yếu tố ở đây đang đỡ nhiều hơn cản',
      trangThaiCan: 'các yếu tố ở đây đang cản nhiều hơn đỡ',
      trangThaiCanBang: 'thuận và cản ở đây gần ngang nhau',
      khongThayTheYTe: 'Phần sức khoẻ nói về nhịp sống và mức năng lượng, không thay thế tư vấn y tế.',
    },
    luanSau: {
      linhVuc: {
        'tinh-cach': {
          nhom: 'Tính cách',
          tieuDe: 'Khí chất và cách bạn phản ứng',
          cauHoi: 'Giải thích cung Mệnh của tôi theo cách dễ hiểu.',
        },
        'cong-viec': {
          nhom: 'Công việc & định hướng',
          tieuDe: 'Môi trường nào khiến bạn phát huy được',
          cauHoi: 'Tôi dễ mắc kẹt ở đâu trong công việc?',
        },
        'tai-loc': {
          nhom: 'Tài lộc',
          tieuDe: 'Cách bạn tạo ra và giữ nguồn lực',
          cauHoi: 'Tôi đang mất cân bằng ở đâu về tiền bạc?',
        },
        'tinh-duyen': {
          nhom: 'Tình duyên',
          tieuDe: 'Cách bạn gắn kết với một người',
          cauHoi: 'Tình cảm hiện tại đang cho tôi bài học gì?',
        },
        'gia-dao': {
          nhom: 'Gia đạo',
          tieuDe: 'Vai trò bạn thường đảm nhận trong nhà',
          cauHoi: 'Tôi đang gánh vai trò gì trong gia đình mà không nhận ra?',
        },
        'quan-he': {
          nhom: 'Quan hệ xã hội',
          tieuDe: 'Cách bạn đứng giữa những người xung quanh',
          cauHoi: 'Kiểu quan hệ nào đang tiêu hao năng lượng của tôi?',
        },
        'van-han': {
          nhom: 'Giai đoạn hiện tại',
          tieuDe: 'Nhịp bạn đang đi qua',
          cauHoi: 'Giai đoạn này tôi nên ưu tiên điều gì?',
        },
        'phat-trien': {
          nhom: 'Gợi ý phát triển',
          tieuDe: 'Chỗ đáng rèn nếu muốn đi xa hơn',
          cauHoi: 'Điểm mạnh nào của tôi đang bị bỏ quên?',
        },
      },
      ketLuanCo: 'Ở phần {chuDe}, nét rõ nhất của bạn là {net}.',
      ketLuanTrong:
        'Phần {chuDe} của bạn không có sao chính nào đóng, nên nét ở đây mượn từ cung đối diện.',
      doanNet: 'Cụ thể hơn: {net}.',
      doanCan: 'Đi kèm với nét đó là một nhu cầu ít khi nói ra: bạn thường cần {can}.',
      doanSangRo:
        'Các sao ở phần này đang ở mức {sang}, nên nét trên thường hiện ra sớm và người ngoài cũng nhận ra được.',
      doanSangKim:
        'Các sao ở phần này đang ở mức {sang}, nên nét trên có thật nhưng hay bị hoàn cảnh kìm lại — dễ thấy mình muốn một đằng mà làm được một nẻo.',
      doanTuHoa:
        'Có {sao} rơi vào đây, nên cùng một bộ sao vẫn cho ra trải nghiệm khác: phần này thường bị đẩy mạnh hơn hoặc vặn đi so với mức bình thường.',
      doanTuanTriet:
        'Có {ten} đóng ở đây. Nét của phần này thường khó hiện ra sớm — nhiều người phải qua một quãng mới thấy rõ mình thế nào ở chỗ này.',
      doanTamPhuong:
        'Phần này không đứng một mình: nó nhận ảnh hưởng từ {hoTro}, và đối diện là {xung} — chỗ hay kéo bạn về hướng ngược lại.',
      doanTrong:
        'Vì mượn nét từ cung đối diện nên bạn thường linh hoạt ở phần này, nhưng cũng dễ thấy mình thay đổi tuỳ hoàn cảnh và tuỳ người.',
      vanHanKetLuan: 'Giai đoạn bạn đang đi qua nghiêng về {chuDe}.',
      vanHanDan: 'Xem theo quãng dài, từng năm và từng tháng ở phần Hành trình.',
      phatTrienKetLuan: 'Nếu muốn đi xa hơn, chỗ đáng rèn nhất của bạn nằm quanh {chuDe}.',
      phatTrienManh: 'Thứ bạn vốn có sẵn và hay quên dùng: {net}.',
      phatTrienCan: 'Thứ bạn thường thiếu và nên chủ động tạo ra: {can}.',
      phatTrienHoi:
        'Một câu đáng tự hỏi: lần gần nhất bạn dùng đúng điểm mạnh đó là khi nào, và vì sao sau đó bạn ngừng dùng?',
    },
    hanhTrinh: {
      giaiDoanNhan: '{tu}–{den} tuổi',
      giaiDoanPhu: 'Khoảng {tuNam}–{denNam}',
      thangNhan: 'Tháng {thang}',
      tuoiAm: 'tuổi âm {tuoi}',
      chuDeCo: 'Nghiêng về {chuDe}.',
      chuDeTrong: 'Quãng này không có chủ đề nào nổi hẳn lên — thường là lúc mọi thứ giữ nhịp cũ.',
      nhipNhom: 'Điều đang chuyển động',
      nhipTieuDe: 'Tháng {thang} năm {nam} của bạn',
      nhipGiaiDoan: 'Bạn đang trong quãng {tu}–{den} tuổi, trọng tâm nghiêng về {chuDe}.',
      nhipNam: 'Riêng năm {nam}, chủ đề dễ nổi lên là {chuDe}.',
      nhipThang: 'Trong tháng {thang}, phần dễ được nhắc tới là {chuDe}.',
    },
    tenCung: TEN_CUNG_VI,
  },

  en: {
    netSao: NET_EN,
    chuDeCung: CHU_DE_EN,
    doSang: DO_SANG_EN,
    noiVaiVe: ', ',
    noiVeCuoi: ' — and at the same time ',
    diemNoiBat: {
      nhom: 'What stands out',
      tieuDe: 'What you tend to do better than most',
      tieuDeTrong: 'You don’t fit one mould',
      trong:
        'No major star sits in your Self house, so your character is drawn from the house opposite. Charts like this usually make you more adaptable — and also more likely to feel like a different person depending on where you are.',
    },
    dieuThuongCan: {
      nhom: 'What you tend to need',
      tieuDe: 'What makes you feel full, or short',
      mo: 'You tend to need {net}.',
      moTrong:
        'Most of your energy goes toward {chuDe} — usually the place you invest in most without weighing the cost.',
      dong: ' Most of your energy goes toward {chuDe}.',
    },
    giaiDoan: {
      nhom: 'This season',
      tieuDe: 'What is likely to surface around {nam}',
      daiVan: 'You are in a longer stretch whose centre of gravity leans toward {chuDe}.',
      nam: 'In {nam} specifically, the theme most likely to surface is {chuDe}.',
      nhacXuHuong: 'This is where the season leans, not something certain to happen.',
    },
    linhVuc: {
      congViecNhom: 'About work',
      tinhCamNhom: 'About relationships',
      congViecTieuDe: 'How you tend to operate at work',
      tinhCamTieuDe: 'How you tend to be alongside someone',
      co: 'In the area of {chuDe}, what stands out is: {net}.',
      trong:
        'No major star sits in the {chuDe} part of your chart, so it draws from the house opposite — usually making you adaptable here, but also more changeable depending on the situation and the person.',
    },
    canCu: {
      cungTai: '{ten} in {chi}',
      cungTaiY:
        'In your chart, {ten} falls in {chi}. That is the starting point everything else is read from.',
      saoDong: '{sao}, {sang}',
      saoDongY:
        '{sao} sits here and is {sang} — that level tells you whether the star’s character shows plainly or gets held back.',
      saoDongTrong: '{sao} sits here.',
      tuHoaY:
        '{sao} shifts how the above expresses itself, so the same set of stars can still play out differently.',
      tuanTriet: '{ten} falls on this house',
      tuanTrietY:
        '{ten} makes this house slow to show its character — it usually only becomes clear after a stretch of time.',
      thanCu: 'Body house in {cung}',
      thanCuY:
        'The Body house shows where most of your life force goes, usually becoming clear from midlife onward. Yours falls in {cung}.',
      giaiDoanTuoi: 'Ages {tu}–{den} in {cung}',
      giaiDoanTuoiY:
        'The chart splits life into ten-year stretches. The one you are in falls on {cung} ({chi}), so that house’s theme runs louder than usual.',
      namUngVao: '{nam} maps to {cung}',
      namUngVaoY:
        'Each year maps to a different house. {nam} (lunar age {tuoi}) falls on {cung}, so that house’s theme comes up more often during the year.',
      thangUngVao: 'Month {thang} maps to {cung}',
      thangUngVaoY:
        'Within a year, each month maps to a house in turn. Month {thang} of {nam} falls on {cung}, so that house’s concerns surface more easily over this short stretch.',
    },
    luanHan: {
      nhipTien: 'Push',
      nhipGiu: 'Hold the rhythm',
      nhipRaSoat: 'Review',
      nhipThuHep: 'Narrow down',
      nhipTienMo:
        'The supporting factors outweigh the resisting ones. This is a stretch you can push, as long as you push where you are already strong.',
      nhipGiuMo:
        'Support and resistance are close to even. Keeping the machine you already have running usually beats opening a new front.',
      nhipRaSoatMo:
        'A few things want checking before you carry on. Not a stop — a look at what you are leaning on.',
      nhipThuHepMo:
        'Resisting factors are the stronger side. Pulling in what is spread thin is usually less costly than trying to hold all of it.',
      chuDeChinh: 'The main theme',
      tieuDeGiaiDoan: 'A long stretch leaning toward {chuDe}',
      tieuDeNam: '{nam}: {chuDe} is what surfaces most easily',
      tieuDeThang: 'Month {thang} of {nam}: a short rhythm around {chuDe}',
      subline:
        'Below is what is worth noticing in this stretch, and what led Celes to say so.',
      tanDung: 'Worth using',
      luuY: 'Worth watching',
      tanDungTrong:
        'Nothing stands out as a clear tailwind here — usually a stretch where results come from steady work rather than from an opening.',
      luuYTrong:
        'No resisting factor stands out. In a stretch like this, the thing most likely to go wrong is complacency.',
      nhipHanhDong: 'Suggested rhythm',
      nenLop: 'What this stretch sits on',
      lopDaiVan: 'Ages {tu}–{den} in {cung}',
      lopNam: '{nam} in {cung}',
      lopThang: 'Month {thang} in {cung}',
      nhomLop: 'Layers in play',
      nhomCung: 'Focus house',
      nhomSao: 'Major / supporting stars',
      nhomTamPhuong: 'Trine and opposition',
      nhomTuHoa: 'Four Transformations',
      nhomVongSao: 'Tuần / Triệt / travelling stars',
      nhomQuyTac: 'Rule source',
      quyTacMo:
        'The rule set and version used for this stretch. Recorded so the same reading can be reproduced later.',
      linhVuc: {
        'cong-viec': { nhan: 'Work & direction', cung: 'Quan Lộc' },
        'tai-chinh': { nhan: 'Money', cung: 'Tài Bạch' },
        'tinh-cam': { nhan: 'Relationships', cung: 'Phu Thê' },
        'gia-dinh': { nhan: 'Family', cung: 'Phụ Mẫu' },
        'suc-khoe': { nhan: 'Health & energy', cung: 'Tật Ách' },
        'hoc-tap': { nhan: 'Learning & growth', cung: 'Phúc Đức' },
      },
      taiO: 'in',
      chamVao: ' This stretch touches that house directly, so this side is more likely to be live than usual.',
      khongChamVao:
        ' This stretch does not touch that house directly, so this side usually keeps its existing rhythm.',
      tuanTrietCau: '{ten} sits on {cung} — {chuDe} is usually slow to show up when needed',
      linhVucCo: '{nhan} is read from {cung} — {trangThai}.{them}',
      linhVucTrong: '{nhan} cannot be read from this chart.',
      trangThaiThuan: 'the factors here support more than they resist',
      trangThaiCan: 'the factors here resist more than they support',
      trangThaiCanBang: 'support and resistance here are close to even',
      khongThayTheYTe:
        'The health section is about rhythm and energy levels, and is no substitute for medical advice.',
    },
    luanSau: {
      linhVuc: {
        'tinh-cach': {
          nhom: 'Character',
          tieuDe: 'Your temperament, and how you react',
          cauHoi: 'Explain my Self house in plain language.',
        },
        'cong-viec': {
          nhom: 'Work & direction',
          tieuDe: 'The environment that lets you perform',
          cauHoi: 'Where do I tend to get stuck at work?',
        },
        'tai-loc': {
          nhom: 'Money',
          tieuDe: 'How you create and hold resources',
          cauHoi: 'Where am I out of balance with money?',
        },
        'tinh-duyen': {
          nhom: 'Partnership',
          tieuDe: 'How you attach to someone',
          cauHoi: 'What is my current relationship teaching me?',
        },
        'gia-dao': {
          nhom: 'Family',
          tieuDe: 'The role you tend to carry at home',
          cauHoi: 'What role am I carrying at home without noticing?',
        },
        'quan-he': {
          nhom: 'Social circle',
          tieuDe: 'Where you stand among the people around you',
          cauHoi: 'Which kind of relationship is draining me?',
        },
        'van-han': {
          nhom: 'This season',
          tieuDe: 'The rhythm you are moving through',
          cauHoi: 'What should I prioritise in this season?',
        },
        'phat-trien': {
          nhom: 'Where to grow',
          tieuDe: 'What is worth working on to go further',
          cauHoi: 'Which of my strengths am I leaving unused?',
        },
      },
      ketLuanCo: 'In the area of {chuDe}, what stands out most about you is {net}.',
      ketLuanTrong:
        'No major star sits in the {chuDe} part of your chart, so it draws its character from the house opposite.',
      doanNet: 'More concretely: {net}.',
      doanCan: 'Alongside that runs a need you rarely say out loud: you tend to need {can}.',
      doanSangRo:
        'The stars here are {sang}, so this side of you usually shows early, and other people notice it too.',
      doanSangKim:
        'The stars here are {sang}, so the trait is real but circumstances often hold it back — you may find yourself wanting one thing and managing another.',
      doanTuHoa:
        '{sao} falls here, so the same set of stars plays out differently: this area tends to be pushed harder, or twisted out of its usual shape.',
      doanTuanTriet:
        '{ten} sits here. This part is usually slow to show itself — many people only see clearly who they are here after a stretch of time.',
      doanTamPhuong:
        'This part does not stand alone: it draws from {hoTro}, and facing it is {xung} — the place that tends to pull you the other way.',
      doanTrong:
        'Because it borrows from the house opposite, you are usually adaptable here, but also more changeable depending on the situation and the person.',
      vanHanKetLuan: 'The stretch you are moving through leans toward {chuDe}.',
      vanHanDan: 'See it by long stretch, year and month under Your journey.',
      phatTrienKetLuan: 'To go further, the ground worth working lies around {chuDe}.',
      phatTrienManh: 'What you already have and often forget to use: {net}.',
      phatTrienCan: 'What you tend to be short of and should create deliberately: {can}.',
      phatTrienHoi:
        'One question worth asking: when did you last use that strength properly, and why did you stop?',
    },
    hanhTrinh: {
      giaiDoanNhan: 'Ages {tu}–{den}',
      giaiDoanPhu: 'Around {tuNam}–{denNam}',
      thangNhan: 'Month {thang}',
      tuoiAm: 'lunar age {tuoi}',
      chuDeCo: 'Leans toward {chuDe}.',
      chuDeTrong: 'Nothing stands out sharply in this stretch — usually a time that keeps its existing rhythm.',
      nhipNhom: 'What is in motion',
      nhipTieuDe: 'Your month {thang} of {nam}',
      nhipGiaiDoan: 'You are in the stretch from age {tu} to {den}, with its centre of gravity on {chuDe}.',
      nhipNam: 'In {nam} specifically, the theme most likely to surface is {chuDe}.',
      nhipThang: 'Within month {thang}, the part most likely to come up is {chuDe}.',
    },
    tenCung: TEN_CUNG_EN,
  },
};
