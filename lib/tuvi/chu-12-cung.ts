import type { MucId } from './chang-cung';
import type { NgonNguDoc } from './quick-read-noi-dung';

/**
 * Chữ cho mười hai phần của bài luận.
 *
 * Tách khỏi `quick-read-noi-dung.ts` vì hai lý do, cả hai đều là lý do kỹ thuật
 * chứ không phải để cho gọn:
 *
 *  1. Tệp kia đã hơn một nghìn dòng và giữ chữ cho BỐN bề mặt khác nhau. Thêm
 *     mười hai phần × bốn tiêu đề mẫu vào đó là biến nó thành chỗ không ai đọc
 *     hết được nữa.
 *  2. Đây là chữ của MỘT bề mặt và có luật riêng của nó — luật tiêu đề ở dưới.
 *     Luật nằm cạnh thứ nó điều chỉnh thì người sửa sau đọc được ngay.
 *
 * LUẬT TIÊU ĐỀ — chỗ dễ làm sai nhất.
 *
 * Tiêu đề mỗi phần phải là một KẾT LUẬN VỀ NGƯỜI ĐỌC, không phải tên chủ đề.
 * "Tiền của bạn vào theo đợt, không theo dòng đều" — được. "Tài chính" hay
 * "Cung Tài Bạch" — không, và đó đúng là thứ mọi sản phẩm tra cứu đang làm.
 *
 * Tên cung KHÔNG ĐƯỢC xuất hiện trong tiêu đề, trong câu kết luận, và trong hai
 * câu đầu của mỗi phần. Chỗ duy nhất nó được hiện là dòng "Đọc từ:" và phần
 * "Vì sao Celes nói vậy".
 *
 * Bốn biến thể cho mỗi phần, chọn theo dạng tín hiệu trội của cung:
 *   xung  hai lực kéo ngược nhau — chỗ người ta thấy mình mâu thuẫn
 *   manh  tín hiệu mạnh và cùng hướng
 *   vua   có tín hiệu nhưng không nổi
 *   mo    lá số gần như không nói gì ở phần này
 *
 * Bốn biến thể là tối thiểu để hai lá số khác nhau không ra cùng một mục lục.
 * Thêm nữa thì tốt hơn, nhưng phải giữ đúng luật trên.
 */

export type DangTinHieu = 'xung' | 'manh' | 'vua' | 'mo';

export interface MucChu {
  /** Nhãn nhóm ngắn, chỉ dùng ở chỗ cần một chữ để xếp — không phải tiêu đề */
  nhan: string;
  /** Bốn tiêu đề mẫu, chọn theo dạng tín hiệu */
  tieuDeMau: Record<DangTinHieu, string>;
  /** Câu mở sẵn khi bấm "Hỏi Celes về phần này" */
  cauHoi: string;
}

const VI: Record<MucId, MucChu> = {
  // ---------------------------------------------- Chặng 1 · Thế giới bên trong
  menh: {
    nhan: 'Cốt cách',
    tieuDeMau: {
      xung: 'Bạn quyết nhanh, nhưng chỉ khi tự mình nắm được toàn cảnh',
      manh: 'Bạn biết mình muốn gì sớm hơn phần lớn người quanh bạn',
      vua: 'Bạn thay hình đổi dạng theo việc, và đó là một lợi thế',
      mo: 'Bạn khó bị đóng khung, kể cả bởi chính mình',
    },
    cauHoi: 'Điều gì ở tôi khiến tôi hay phản ứng khác người khác?',
  },
  'phuc-duc': {
    nhan: 'Phần bên trong',
    tieuDeMau: {
      xung: 'Bạn thấy thiếu ngay cả lúc mọi thứ đang đủ',
      manh: 'Bạn có một chỗ tựa bên trong mà hoàn cảnh khó lay',
      vua: 'Sự yên của bạn phụ thuộc vào vài điều rất cụ thể',
      mo: 'Bạn ít khi tự hỏi mình có đang ổn không — và đó vừa nhẹ vừa nguy',
    },
    cauHoi: 'Điều gì làm tôi thấy yên, và điều gì làm tôi mất yên?',
  },
  'tat-ach': {
    nhan: 'Nhịp sống',
    tieuDeMau: {
      xung: 'Bạn chịu được rất lâu, rồi sập rất nhanh',
      manh: 'Sức của bạn bền, miễn là nhịp không bị ai khác đặt hộ',
      vua: 'Bạn mệt theo đợt, và đợt ấy đoán trước được',
      mo: 'Cơ thể bạn ít lên tiếng — nên khi nó lên tiếng thì đã muộn',
    },
    cauHoi: 'Dấu hiệu nào cho thấy tôi sắp quá tải?',
  },

  // ---------------------------------------------- Chặng 2 · Con đường gây dựng
  'quan-loc': {
    nhan: 'Công việc',
    tieuDeMau: {
      xung: 'Bạn làm tốt nhất ở chỗ vừa có quyền quyết vừa có người chắn',
      manh: 'Bạn lên bằng việc làm được, không bằng việc được để ý',
      vua: 'Bạn cần một khoảng tự quyết, dù nhỏ, mới bật lên được',
      mo: 'Công việc với bạn là chỗ đi qua, không phải chỗ để định nghĩa mình',
    },
    cauHoi: 'Môi trường làm việc nào hợp với tôi nhất?',
  },
  'tai-bach': {
    nhan: 'Tiền bạc',
    tieuDeMau: {
      xung: 'Tiền của bạn vào theo đợt, không theo dòng đều',
      manh: 'Bạn kiếm được từ đúng thứ bạn giỏi, và điều đó hiếm',
      vua: 'Tiền của bạn đến chậm nhưng ở lại lâu',
      mo: 'Tiền không phải thứ lá số bạn nói nhiều — nó theo sau những phần khác',
    },
    cauHoi: 'Tiền của tôi thường rò rỉ ở chỗ nào?',
  },
  'thien-di': {
    nhan: 'Ra ngoài',
    tieuDeMau: {
      xung: 'Người ta thấy ở bạn một người khác hẳn người bạn biết',
      manh: 'Bạn được việc ở bên ngoài nhiều hơn ở trong nhà',
      vua: 'Cơ hội của bạn đến qua người, không đến qua tin tức',
      mo: 'Bạn không cần ra xa mới tìm được thứ mình cần',
    },
    cauHoi: 'Người khác thường hiểu nhầm gì về tôi?',
  },

  // ---------------------------------------------- Chặng 3 · Những người sát cánh
  'phu-the': {
    nhan: 'Bạn đời',
    tieuDeMau: {
      xung: 'Bạn cần gần, nhưng gần quá thì bạn rút',
      manh: 'Bạn chọn một lần rồi ở lại rất lâu',
      vua: 'Bạn gắn bó bằng việc làm chứ không bằng lời',
      mo: 'Chuyện đôi lứa ở bạn diễn ra êm hơn ở phần lớn người',
    },
    cauHoi: 'Tôi thực sự cần gì ở một người ở cạnh?',
  },
  'huynh-de': {
    nhan: 'Người ngang vai',
    tieuDeMau: {
      xung: 'Bạn hợp tác tốt tới đúng lúc phải chia phần',
      manh: 'Bạn có người đứng cùng, và bạn biết dùng điều đó',
      vua: 'Bạn làm cùng người khác được, nhưng cần luật rõ từ đầu',
      mo: 'Bạn quen tự xoay hơn là quen gọi người',
    },
    cauHoi: 'Tôi nên làm một mình hay nên có cộng sự?',
  },
  'no-boc': {
    nhan: 'Mạng lưới',
    tieuDeMau: {
      xung: 'Bạn quen rất nhiều người, và dựa được vào rất ít',
      manh: 'Người quanh bạn là thứ đỡ bạn đứng dậy mỗi lần vấp',
      vua: 'Bạn giữ một vòng nhỏ và không thấy cần rộng hơn',
      mo: 'Quan hệ xã hội với bạn là phương tiện, không phải chỗ dựa',
    },
    cauHoi: 'Tôi nên giữ khoảng cách với kiểu người nào?',
  },

  // ---------------------------------------------- Chặng 4 · Điều để lại
  'phu-mau': {
    nhan: 'Gốc gác',
    tieuDeMau: {
      xung: 'Bạn mang theo một chuẩn mà chính bạn không chọn',
      manh: 'Bạn được đỡ từ phía trên, và điều đó theo bạn suốt',
      vua: 'Điều bạn nhận từ nhà rõ hơn ở phần nề nếp, mờ hơn ở phần tình cảm',
      mo: 'Bạn tự dựng phần lớn những gì mình có',
    },
    cauHoi: 'Tôi đã nhận gì từ nền giáo dưỡng mà đến giờ vẫn mang theo?',
  },
  'dien-trach': {
    nhan: 'Chỗ thuộc về',
    tieuDeMau: {
      xung: 'Bạn muốn một chỗ cố định, nhưng ở yên một chỗ thì bạn ngợp',
      manh: 'Bạn tạo được chỗ mà người khác muốn tới',
      vua: 'Nơi ở đổi trạng thái của bạn nhiều hơn bạn nghĩ',
      mo: 'Chỗ ở với bạn là nơi để về, không phải thứ để dựng',
    },
    cauHoi: 'Không gian sống ảnh hưởng tới tôi thế nào?',
  },
  'tu-tuc': {
    nhan: 'Điều tạo ra',
    tieuDeMau: {
      xung: 'Bạn nuôi được một thứ từ đầu, nhưng khó buông khi nó lớn',
      manh: 'Bạn có duyên làm cho một thứ nhỏ thành một thứ sống được',
      vua: 'Bạn dẫn người non hơn bằng cách để họ tự va',
      mo: 'Bạn ít bận tâm tới việc để lại gì — bạn bận với việc đang làm',
    },
    cauHoi: 'Tôi thường vướng gì khi phải trao lại một thứ mình tạo ra?',
  },
};

const EN: Record<MucId, MucChu> = {
  menh: {
    nhan: 'Core',
    tieuDeMau: {
      xung: 'You decide fast, but only once you can see the whole thing',
      manh: 'You know what you want earlier than most people around you',
      vua: 'You change shape to fit the work, and that is an advantage',
      mo: 'You are hard to box in, including by yourself',
    },
    cauHoi: 'What makes me react differently from other people?',
  },
  'phuc-duc': {
    nhan: 'Inner life',
    tieuDeMau: {
      xung: 'You feel short even when everything is enough',
      manh: 'You have an inner footing that circumstances rarely shake',
      vua: 'Your calm rests on a few very specific things',
      mo: 'You rarely ask whether you are alright — light, and risky',
    },
    cauHoi: 'What makes me feel settled, and what takes it away?',
  },
  'tat-ach': {
    nhan: 'Rhythm',
    tieuDeMau: {
      xung: 'You hold out for a long time, then drop fast',
      manh: 'Your stamina holds, as long as the pace is not set for you',
      vua: 'You tire in waves, and the waves are predictable',
      mo: 'Your body speaks up late — so when it does, it is already late',
    },
    cauHoi: 'What are the early signs that I am overloaded?',
  },
  'quan-loc': {
    nhan: 'Work',
    tieuDeMau: {
      xung: 'You do best where you both decide and have someone covering you',
      manh: 'You rise on what you deliver, not on being noticed',
      vua: 'You need some room to decide, however small, to come alive',
      mo: 'Work is somewhere you pass through, not where you define yourself',
    },
    cauHoi: 'What kind of work environment suits me best?',
  },
  'tai-bach': {
    nhan: 'Money',
    tieuDeMau: {
      xung: 'Your money arrives in bursts, not as a steady stream',
      manh: 'You earn from the thing you are actually good at, which is rare',
      vua: 'Money reaches you slowly but stays a long time',
      mo: 'Money is not what your chart talks about — it follows other parts',
    },
    cauHoi: 'Where does my money usually leak?',
  },
  'thien-di': {
    nhan: 'Outside',
    tieuDeMau: {
      xung: 'People see someone quite different from the person you know',
      manh: 'You get more done out in the world than at home',
      vua: 'Your openings come through people, not through listings',
      mo: 'You do not need to go far to find what you need',
    },
    cauHoi: 'What do people usually misread about me?',
  },
  'phu-the': {
    nhan: 'Partner',
    tieuDeMau: {
      xung: 'You want closeness, and pull back when it gets too close',
      manh: 'You choose once and stay a long while',
      vua: 'You show attachment by doing, not by saying',
      mo: 'Partnership runs quieter for you than for most',
    },
    cauHoi: 'What do I actually need from a partner?',
  },
  'huynh-de': {
    nhan: 'Peers',
    tieuDeMau: {
      xung: 'You collaborate well right up until the split has to be agreed',
      manh: 'You have people standing with you, and you know how to use that',
      vua: 'You can work with others, but you need the rules set early',
      mo: 'You are more used to handling it yourself than to calling someone',
    },
    cauHoi: 'Should I work alone or with a partner?',
  },
  'no-boc': {
    nhan: 'Network',
    tieuDeMau: {
      xung: 'You know a great many people and can lean on very few',
      manh: 'The people around you are what gets you up after a fall',
      vua: 'You keep a small circle and feel no need for a wider one',
      mo: 'Social ties are a means for you, not a place to rest',
    },
    cauHoi: 'What kind of people should I keep at a distance?',
  },
  'phu-mau': {
    nhan: 'Origins',
    tieuDeMau: {
      xung: 'You carry a standard you did not choose',
      manh: 'You were backed from above, and it has stayed with you',
      vua: 'What you took from home shows more in habits than in warmth',
      mo: 'You built most of what you have yourself',
    },
    cauHoi: 'What did my upbringing install in me that I still carry?',
  },
  'dien-trach': {
    nhan: 'Belonging',
    tieuDeMau: {
      xung: 'You want a fixed place, and staying in one place overwhelms you',
      manh: 'You make a place other people want to come to',
      vua: 'Where you live shifts your state more than you think',
      mo: 'Home is somewhere to return to, not something to build',
    },
    cauHoi: 'How does my living space affect me?',
  },
  'tu-tuc': {
    nhan: 'What you make',
    tieuDeMau: {
      xung: 'You can raise something from nothing, and struggle to let it go',
      manh: 'You have a knack for turning something small into something alive',
      vua: 'You guide younger people by letting them hit things themselves',
      mo: 'You think little about what you leave — you are busy with the work',
    },
    cauHoi: 'What do I struggle with when handing over something I made?',
  },
};

export const CHU_12_CUNG: Record<NgonNguDoc, Record<MucId, MucChu>> = { vi: VI, en: EN };

/**
 * Chọn dạng tín hiệu từ điểm nổi bật và cờ xung đột.
 *
 * Xung đột xét TRƯỚC điểm: một cung vừa có lực đỡ vừa có lực cản là chỗ người
 * đọc thấy mình mâu thuẫn và không tự giải thích được — đó là tiêu đề dính
 * nhất, kể cả khi tổng điểm chỉ ở mức trung bình.
 */
export function dangTinHieu(diem: number, xungDot: boolean): DangTinHieu {
  if (xungDot) return 'xung';
  if (diem >= 70) return 'manh';
  if (diem <= 30) return 'mo';
  return 'vua';
}

// ---------------------------------------------------------------- mở đầu

/**
 * Năm kiểu mở một phần.
 *
 * Trần 3/12 cho mỗi kiểu là luật của spec, và nó được bảo đảm bằng CẤU TRÚC chứ
 * không bằng hạt ngẫu nhiên: mười hai phần chia vòng cho năm kiểu ra 3-3-2-2-2.
 * Chọn bằng hạt thì phân phối là chuyện may rủi, và lá số xui sẽ có năm phần mở
 * giống hệt nhau.
 */
export type KieuMo = 'tinh-huong' | 'cau-hoi' | 'nhan-dinh' | 'doi-lap' | 'moc-thoi-gian';

export const THU_TU_KIEU_MO: KieuMo[] = [
  'nhan-dinh',
  'tinh-huong',
  'doi-lap',
  'cau-hoi',
  'moc-thoi-gian',
];

/**
 * Khuôn câu mở, theo kiểu.
 *
 * `{net}` là nét đã bỏ chủ ngữ. `{chuDe}` là chủ đề đời thường của cung — KHÔNG
 * phải tên cung, vì tên cung bị cấm ở câu kết luận. `{tu}`/`{den}` chỉ có ở
 * kiểu mốc thời gian.
 */
export const MO_DAU: Record<NgonNguDoc, Record<KieuMo, readonly string[]>> = {
  vi: {
    // Mọi khuôn dưới đây đặt {chuDe} ở vị trí KHÔNG cần sở hữu cách theo sau.
    // Chủ đề cung là một mệnh đề dài và nhiều cái đã chứa "bạn" bên trong, nên
    // "…{chuDe} của bạn…" ra những câu hai lần sở hữu.
    'nhan-dinh': [
      'Nhìn vào {chuDe}, nét rõ nhất là {net}.',
      'Ở {chuDe}, thứ đáng nói trước tiên là {net}.',
    ],
    'tinh-huong': [
      'Có những lúc {net} — và đó là chỗ {chuDe} lộ rõ nhất.',
      'Đặt bạn vào một tình huống phải quyết nhanh: {net}.',
    ],
    'doi-lap': [
      '{netHoa} — nhưng đúng chỗ ấy cũng là chỗ bạn dễ hụt nhất.',
      '{netHoa}, và cái giá của nó nằm ngay trong chính nét đó.',
    ],
    'cau-hoi': [
      'Bạn có hay thấy mình {net} không? Điều đó không phải tình cờ.',
      'Đã khi nào bạn tự hỏi vì sao mình {net} chưa?',
    ],
    'moc-thoi-gian': [
      'Ở quãng {tu}–{den} tuổi bạn đang đi qua, {chuDe} nổi lên bằng một nét: {net}.',
      'Quãng {tu}–{den} tuổi làm rõ đúng nét này: {net}.',
    ],
  },
  en: {
    'nhan-dinh': [
      'Looking at {chuDe}, the clearest thing is {net}.',
      'In {chuDe}, what stands out first is {net}.',
    ],
    'tinh-huong': [
      'There are moments when {net} — and that is where {chuDe} shows most.',
      'Put you in a spot that needs a fast call: {net}.',
    ],
    'doi-lap': [
      '{netHoa} — and that same place is where you are most likely to come up short.',
      '{netHoa}, and the cost of it sits inside that very trait.',
    ],
    'cau-hoi': [
      'Do you often find yourself {net}? That is not an accident.',
      'Have you ever wondered why {net}?',
    ],
    'moc-thoi-gian': [
      'In the {tu}–{den} stretch you are in now, {chuDe} is the part that {net}.',
      'The {tu}–{den} stretch brings out exactly this: {net}.',
    ],
  },
};

/**
 * Khuôn khi cung không có chính tinh.
 *
 * Phải là MẢNG, không phải một chuỗi. Vô chính diệu không hiếm — một lá số có
 * thể có hai ba cung như vậy, và một chuỗi đơn dùng ba lần là ba câu trùng
 * nguyên văn trong cùng một bài. Không bank nào cứu được chuyện đó.
 */
export const MO_DAU_TRONG: Record<NgonNguDoc, readonly string[]> = {
  vi: [
    'Ở {chuDe}, lá số bạn không có sao chủ nào đóng, nên nét ở đây mượn từ phía đối diện.',
    'Không sao chủ nào đóng ở {chuDe} — cách đọc phần này vì thế phải soi ngược từ phía bên kia.',
    'Chỗ này trống chính tinh, nên {chuDe} ở bạn không có một nét cố định mà đổi theo người bạn đang ở cạnh.',
  ],
  en: [
    'No governing star sits in this part, so its character is borrowed from the opposite side.',
    'This area has no main star, which means it reads through the palace facing it rather than on its own.',
    'With nothing governing here, this part of you shifts with whoever you are standing next to.',
  ],
};

/** Câu thành thật cho phần lá số gần như không nói gì — spec mục 5.2 */
export const CAU_PHAN_MO: Record<NgonNguDoc, readonly string[]> = {
  vi: [
    'Phần này ở lá số bạn không có tín hiệu nổi bật — đó cũng là một thông tin: đây không phải khu vực đời sống hay tạo biến động cho bạn.',
    'Lá số gần như im lặng ở đây. Im lặng cũng nói được một điều: chỗ này hiếm khi là nơi sinh chuyện với bạn.',
    'Không có gì đủ mạnh ở phần này để nói thành một nhận định chắc. Đọc nó như một nền phẳng, không phải một chỗ cần canh.',
  ],
  en: [
    'This part shows no strong signal in your chart — which is itself information: this is not an area that tends to create turbulence for you.',
    'Your chart is close to silent here. Silence says something too: this rarely becomes a source of trouble for you.',
    'Nothing here is strong enough to state firmly. Read it as flat ground, not as something to watch.',
  ],
};

// ---------------------------------------------------------------- khâu chặng

/**
 * Đoạn khâu và câu bắc cầu của từng chặng.
 *
 * Đoạn khâu trả lời "ba phần này nói cùng điều gì" — nó là thứ biến ba card rời
 * thành một chặng. Câu bắc cầu dẫn sang chặng sau, và nó đi theo GƯƠNG BẮC CẦU:
 * chặng 1 sang chặng 2 qua cặp Mệnh–Thiên Di, chặng 2 sang chặng 3 qua cặp Quan
 * Lộc–Phu Thê, chặng 3 sang chặng 4 qua tam hợp Nô Bộc–Tử Tức–Phụ Mẫu.
 *
 * Chặng 4 KHÔNG có câu bắc cầu: nó khép lại cung đường và nối ngược về chặng 1.
 */
export const CHU_CHANG: Record<
  NgonNguDoc,
  Record<string, { doanKhau: string; cauBacCau: string | null }>
> = {
  vi: {
    'ben-trong': {
      doanKhau:
        'Ba phần vừa rồi nói về cùng một thứ nhìn từ ba phía: cái bạn là, cái bạn thấy đủ hay thiếu, và cái thân bạn chịu được. Chúng không tách rời nhau — thứ làm bạn thấy bất an thường cũng là thứ làm bạn mệt trước khi kịp nhận ra, và cả hai đều mọc ra từ chính nét mạnh nhất của bạn.',
      cauBacCau:
        'Nhưng người khác không nhìn thấy phần bên trong ấy. Họ nhìn thấy thứ bạn dựng ra bên ngoài.',
    },
    'con-duong': {
      doanKhau:
        'Công việc, tiền bạc và cơ hội ở bạn chạy theo cùng một logic: chúng đến qua cùng một kênh và tắc ở cùng một chỗ. Nhìn riêng từng phần thì thấy ba vấn đề khác nhau — chỗ này thiếu người, chỗ kia thiếu vốn, chỗ nọ thiếu dịp. Nhìn cùng lúc thì thấy một cơ chế duy nhất, và sửa được nó ở một chỗ là ba chỗ cùng nới ra.',
      cauBacCau:
        'Và cái giá của con đường ấy không trả bằng tiền — nó trả bằng thời gian dành cho những người ở gần bạn nhất.',
    },
    'sat-canh': {
      doanKhau:
        'Ba phần này cho thấy bạn dùng người khác theo ba cách khác nhau: một người để dựa, một nhóm để làm cùng, một mạng lưới để mở đường. Chỗ bạn mạnh ở tầng này thường là chỗ bạn yếu ở tầng kia — người giỏi giữ một mối sâu hay mỏng ở mối rộng, và ngược lại. Biết mình đang mạnh ở tầng nào thì đỡ mất sức ép mình giỏi cả ba.',
      cauBacCau:
        'Những mối quan hệ ấy không bắt đầu từ bạn. Chúng bắt đầu từ cách bạn đã được đối xử trước khi bạn kịp chọn.',
    },
    'de-lai': {
      doanKhau:
        'Chặng cuối khép lại vòng: thứ bạn nhận từ trước định hình chỗ bạn muốn thuộc về, và chỗ ấy quyết định bạn nuôi lớn được cái gì. Đọc ngược lên chặng một, sẽ thấy nét bạn tưởng là của riêng mình thật ra đã có mặt từ trước khi bạn chọn — nó đến từ nếp nhà, rồi thành cách bạn dựng chỗ ở, rồi thành cách bạn trao lại. Vòng ấy không phải định mệnh; biết nó là chỗ bắt đầu cắt được nó.',
      cauBacCau: null,
    },
  },
  en: {
    'ben-trong': {
      doanKhau:
        'These three parts describe one thing seen from three sides: who you are, what makes you feel full or short, and what your body can carry. They are not separate — what unsettles you is usually also what tires you before you notice, and both grow out of your strongest trait.',
      cauBacCau:
        'But other people do not see that inner part. They see what you build on the outside.',
    },
    'con-duong': {
      doanKhau:
        'Work, money and opportunity follow one logic in you: they arrive through the same channel and jam at the same point. Read separately they look like three problems; read together they are one mechanism.',
      cauBacCau:
        'And the cost of that road is not paid in money — it is paid in time taken from the people closest to you.',
    },
    'sat-canh': {
      doanKhau:
        'These three parts show three different ways you use other people: one person to lean on, a group to work with, a network to open doors. Where you are strong at one layer, you tend to be thin at another.',
      cauBacCau:
        'Those relationships did not start with you. They started with how you were treated before you had any say.',
    },
    'de-lai': {
      doanKhau:
        'The last stretch closes the loop: what you inherited shapes where you want to belong, and that place decides what you are able to raise. Read back to the first stretch and the trait you thought was yours alone turns out to have been there before you chose it.',
      cauBacCau: null,
    },
  },
};
