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
