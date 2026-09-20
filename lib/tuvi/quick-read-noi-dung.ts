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
  /**
   * Điều người này thường làm tốt, dạng MẢNH CÂU.
   *
   * Mảnh vì bốn bề mặt luận giải khác nhét nó vào GIỮA một câu của chúng:
   * hanh-trinh cắt chủ ngữ rồi ghép vào khuôn, luan-han bọc nó trong câu "sao
   * X tại cung Y", luan-giai-sau và nghieng-ve cũng vậy. Đổi mảnh này thành
   * câu hoàn chỉnh là làm gãy cả bốn nơi ấy cùng lúc, và gãy im lặng.
   */
  manh: string;
  /** Điều người này thường cần để thấy đủ — cũng là mảnh câu */
  can: string;
  /**
   * Cùng ý với `manh`, nhưng viết thành CÂU HOÀN CHỈNH.
   *
   * Thẻ trên trang giới thiệu ghép hai ba nét của hai ba ngôi sao. Ghép mảnh
   * thì phải có chỗ nối, và mọi chỗ nối đều lộ — bản cũ nối bằng "— đồng thời"
   * và đọc lên như bị chắp, đúng chỗ chủ dự án chỉ ra. Câu hoàn chỉnh thì chỉ
   * cần đặt cạnh nhau, không cần chỗ nối nào.
   *
   * Có, đây là hai bản của cùng một ý và chúng có thể lệch nhau theo thời
   * gian. Đổi hết bốn bề mặt kia sang câu hoàn chỉnh là việc nên làm, nhưng là
   * một việc riêng, có bộ đo riêng — không phải thứ gài kèm vào một lần sửa
   * chữ cho trang giới thiệu.
   */
  manhCau?: string;
  /** Cùng ý với `can`, dạng câu hoàn chỉnh — xem `manhCau` */
  canCau?: string;
  /**
   * Tiêu đề thẻ "Điều bạn thường cần", lấy theo ngôi sao đứng đầu.
   *
   * Một tiêu đề cố định cho mọi lá số thì nói được rất ít: người cần được ghi
   * nhận và người cần hạn chót không cần cùng một thứ. Tiêu đề đi theo nét thì
   * người đọc biết ngay thẻ này nói về chuyện gì của riêng mình.
   */
  tieuDeCan?: string;
}

const NET_VI: Record<string, NetSao> = {
  'Tử Vi': {
    manh: 'bạn thường được đặt vào vị trí phải đứng ra quyết định, kể cả khi không chủ động nhận',
    can: 'một không gian đủ rộng để tự sắp xếp mọi thứ theo cách của mình',
    manhCau:
      'Bạn thường được đặt vào vị trí phải đứng ra quyết định, kể cả khi bạn không chủ động nhận việc đó.',
    canCau:
      'Bạn cần một khoảng đủ rộng để tự sắp xếp mọi việc theo cách của mình. Khi bị cầm tay chỉ việc quá sát, bạn dễ mất hứng.',
    tieuDeCan: 'Điều giúp bạn làm việc thoải mái nhất',
  },
  'Thiên Cơ': {
    manh: 'bạn nghĩ nhanh, thích gỡ rối và hay thấy đường đi mà người khác chưa thấy',
    can: 'việc có thay đổi liên tục để không bị chán, và người chịu nghe hết lập luận của bạn',
    manhCau: 'Bạn nghĩ nhanh, thích gỡ rối và thường nhìn ra hướng đi mà người khác chưa thấy.',
    canCau:
      'Bạn cần công việc có sự thay đổi để không thấy chán. Bạn cũng cần một người chịu nghe hết lập luận của mình trước khi kết luận.',
    tieuDeCan: 'Điều giúp bạn giữ được hứng thú',
  },
  'Thái Dương': {
    manh: 'bạn dễ trở thành người kéo nhóm đi, cho đi trước rồi mới tính tới phần mình',
    can: 'được ghi nhận rõ ràng, vì bạn ít khi tự đòi phần công của mình',
    manhCau:
      'Bạn thường chủ động dẫn dắt nhóm và sẵn lòng giúp đỡ trước khi nghĩ đến phần mình.',
    canCau:
      'Bạn cần những đóng góp của mình được nhìn nhận rõ ràng, bởi bạn ít khi chủ động nhắc đến công sức hoặc đòi hỏi sự ghi nhận.',
    tieuDeCan: 'Điều giúp bạn cảm thấy được trân trọng',
  },
  'Vũ Khúc': {
    manh: 'bạn làm thật, dứt khoát, và đo mọi thứ bằng kết quả cụ thể',
    can: 'mục tiêu rõ ràng và quyền tự quyết về nguồn lực, thay vì phải chiều lòng nhiều bên',
    manhCau: 'Bạn làm việc dứt khoát và đo mọi thứ bằng kết quả cụ thể chứ không bằng lời hứa.',
    canCau:
      'Bạn cần mục tiêu rõ ràng và được tự quyết về tiền bạc, con người. Phải chiều lòng nhiều bên cùng lúc là điều khiến bạn nản nhất.',
    tieuDeCan: 'Điều giúp bạn làm việc hiệu quả hơn',
  },
  'Thiên Đồng': {
    manh: 'bạn dễ chịu, biết tự tìm niềm vui và ít khi đẩy căng thẳng lên người khác',
    can: 'một áp lực vừa đủ từ bên ngoài, vì bạn thường hoãn việc khi không có hạn chót',
    manhCau:
      'Bạn dễ chịu, biết tự tìm niềm vui và ít khi đẩy căng thẳng của mình sang người khác.',
    canCau:
      'Bạn làm việc dễ vào guồng hơn khi có thời hạn rõ ràng hoặc một chút thúc đẩy từ bên ngoài. Nếu không có mốc cụ thể, bạn dễ để việc lại sau.',
    tieuDeCan: 'Điều giúp bạn cảm thấy thoải mái hơn',
  },
  'Liêm Trinh': {
    manh: 'bạn có nguyên tắc riêng khá chắc và giữ được nó ngay cả khi bất lợi',
    can: 'môi trường công bằng, vì bạn phản ứng mạnh khi thấy luật chơi bị bẻ cong',
    manhCau:
      'Bạn có nguyên tắc riêng khá chắc và giữ được nó ngay cả khi điều đó gây bất lợi cho mình.',
    canCau:
      'Bạn cần một môi trường công bằng. Khi thấy luật chơi bị bẻ cong, bạn khó làm ngơ dù việc đó không liên quan trực tiếp đến mình.',
    tieuDeCan: 'Điều giúp bạn yên tâm gắn bó lâu dài',
  },
  'Thiên Phủ': {
    manh: 'bạn giữ được sự ổn định cho cả nhóm và là chỗ người khác tìm đến khi rối',
    can: 'sự an toàn ở mức nền, để dám thử những thứ rủi ro hơn',
    manhCau:
      'Bạn giữ được sự ổn định cho cả nhóm và thường là người được tìm đến khi mọi thứ rối lên.',
    canCau:
      'Bạn thường cần cảm giác an toàn và ổn định trước khi sẵn sàng thử điều mới hoặc chấp nhận rủi ro. Khi biết mình có điều để dựa vào, bạn sẽ yên tâm hơn với lựa chọn của mình.',
    tieuDeCan: 'Điều giúp bạn tự tin bước tiếp',
  },
  'Thái Âm': {
    manh: 'bạn tinh ý, nhớ chi tiết và chăm sóc người khác theo cách không ồn ào',
    can: 'thời gian ở một mình để nạp lại, và người chủ động hỏi han bạn trước',
    manhCau:
      'Bạn tinh ý, nhớ chi tiết và chăm sóc người khác theo cách lặng lẽ, ít khi nói ra.',
    canCau:
      'Bạn cần thời gian ở một mình để lấy lại sức. Bạn cũng mong có người chủ động hỏi han mình trước, thay vì phải tự lên tiếng.',
    tieuDeCan: 'Điều giúp bạn lấy lại năng lượng',
  },
  'Tham Lang': {
    manh: 'bạn ham học cái mới, giao tiếp rộng và thích nghi rất nhanh',
    can: 'sự đa dạng, nhưng cũng cần một trọng tâm để không dàn trải',
    manhCau: 'Bạn ham học cái mới, giao tiếp rộng và thích nghi với hoàn cảnh mới rất nhanh.',
    canCau:
      'Bạn cần sự đa dạng để không thấy tù túng. Nhưng bạn cũng cần một trọng tâm, nếu không mọi thứ dễ dàn trải mà không đi tới đâu.',
    tieuDeCan: 'Điều giúp bạn đi được đường dài',
  },
  'Cự Môn': {
    manh: 'bạn nói có sức nặng, hay đặt đúng câu hỏi mà người khác né',
    can: 'được nói thẳng, vì phải giữ trong lòng lâu là thứ làm bạn mệt nhất',
    manhCau: 'Bạn nói có sức nặng và thường đặt đúng câu hỏi mà người khác né tránh.',
    canCau:
      'Bạn cần được nói ra suy nghĩ của mình, vì giữ trong lòng quá lâu thường khiến bạn mệt mỏi.',
    tieuDeCan: 'Điều giúp bạn thấy nhẹ lòng hơn',
  },
  'Thiên Tướng': {
    manh: 'bạn đáng tin, giữ lời và thường là người đứng giữa hoà giải',
    can: 'biết rõ mình đang đứng về phía nào, vì bạn khó chịu khi phải mập mờ',
    manhCau:
      'Bạn đáng tin, giữ lời và thường là người đứng giữa để hoà giải khi có mâu thuẫn.',
    canCau:
      'Bạn cần biết rõ mình đang đứng về phía nào. Ở trong thế mập mờ quá lâu là điều khiến bạn khó chịu nhất.',
    tieuDeCan: 'Điều giúp bạn giữ được sự thoải mái',
  },
  'Thiên Lương': {
    manh: 'bạn điềm tĩnh khi việc rối và hay là chỗ dựa cho người trẻ hơn',
    can: 'ý nghĩa trong việc đang làm, vì lương cao mà rỗng thì bạn không trụ lâu',
    manhCau:
      'Khi mọi việc trở nên rối ren, bạn vẫn giữ được bình tĩnh để cùng mọi người tìm cách giải quyết. Bạn cũng thường là người mà những người trẻ hơn tìm đến để xin lời khuyên hoặc nhờ hỗ trợ.',
    canCau:
      'Bạn cần thấy ý nghĩa trong việc mình đang làm. Một công việc trả lương cao nhưng trống rỗng thường không giữ được bạn lâu.',
    tieuDeCan: 'Điều giúp bạn gắn bó với công việc',
  },
  'Thất Sát': {
    manh: 'bạn quyết nhanh, dám chịu và không ngại bắt đầu lại từ đầu',
    can: 'một mục tiêu đủ khó và đủ có ý nghĩa để theo đến cùng, vì việc quá êm làm bạn mất lửa',
    manhCau: 'Bạn quyết nhanh, dám chịu trách nhiệm và không ngại bắt đầu lại từ đầu.',
    canCau:
      'Bạn cần một mục tiêu đủ khó và đủ đáng để theo đến cùng. Việc quá êm đềm thường làm bạn mất dần động lực.',
    tieuDeCan: 'Điều giúp bạn giữ được động lực',
  },
  'Phá Quân': {
    manh: 'khi một cách làm không còn thuyết phục, bạn khá sẵn sàng bắt đầu lại thay vì cố duy trì chỉ vì đã quen',
    can: 'người tin bạn ở giai đoạn dang dở, vì đó là lúc bạn dễ bị hiểu lầm nhất',
    manhCau:
      'Khi một cách làm không còn thuyết phục, bạn sẵn sàng bắt đầu lại thay vì giữ nó chỉ vì đã quen.',
    canCau:
      'Bạn cần người tin mình ở giai đoạn còn dang dở, vì đó là lúc bạn dễ bị hiểu lầm nhất.',
    tieuDeCan: 'Điều giúp bạn đi qua giai đoạn khó',
  },
};

const NET_EN: Record<string, NetSao> = {
  'Tử Vi': {
    manh: 'you tend to end up as the one who has to decide, even when you never asked for it',
    can: 'enough room to arrange things your own way',
    manhCau:
      'You often end up the one who has to decide, even when you never asked for it.',
    canCau:
      'You need enough room to arrange things your own way. Being managed too closely is what drains you fastest.',
    tieuDeCan: 'What lets you work at your best',
  },
  'Thiên Cơ': {
    manh: 'you think fast, enjoy untangling problems, and often see a route others have not spotted',
    can: 'work that keeps changing so you do not go stale, and someone who hears your reasoning out',
    manhCau:
      'You think fast, enjoy untangling problems, and often see a route others have not spotted.',
    canCau:
      'You need work that keeps changing so you do not go stale. You also need someone who hears your reasoning out before deciding.',
    tieuDeCan: 'What keeps you interested',
  },
  'Thái Dương': {
    manh: 'you easily become the one pulling the group along, giving first and counting your share later',
    can: 'to be acknowledged plainly, because you rarely claim credit for yourself',
    manhCau:
      'You usually take the lead and help the whole group move forward, giving before you count your own share.',
    canCau:
      'You need your contribution named plainly, because you rarely bring up your own effort or ask for credit.',
    tieuDeCan: 'What makes you feel valued',
  },
  'Vũ Khúc': {
    manh: 'you get things actually done, decide cleanly, and measure everything by concrete results',
    can: 'a clear target and real authority over resources, instead of having to please everyone',
    manhCau:
      'You decide cleanly and measure everything by concrete results rather than promises.',
    canCau:
      'You need a clear target and real say over money and people. Having to please several sides at once is what wears you down.',
    tieuDeCan: 'What helps you work effectively',
  },
  'Thiên Đồng': {
    manh: 'you are easy to be around, find your own enjoyment, and rarely push your stress onto others',
    can: 'just enough outside pressure, because you tend to postpone whatever has no deadline',
    manhCau:
      'You are easy to be around, find your own enjoyment, and rarely push your stress onto others.',
    canCau:
      'You get going more easily with a clear deadline or a little push from outside. Without a fixed date, you tend to leave things for later.',
    tieuDeCan: 'What makes things easier for you',
  },
  'Liêm Trinh': {
    manh: 'you hold a firm set of personal principles and keep to them even when it costs you',
    can: 'a fair environment, because you react strongly when the rules get bent',
    manhCau:
      'You hold a firm set of personal principles and keep to them even when it costs you.',
    canCau:
      'You need a fair environment. When the rules get bent you find it hard to look away, even when it is not your business.',
    tieuDeCan: 'What lets you commit for the long run',
  },
  'Thiên Phủ': {
    manh: 'you keep a group steady and become the person others come to when things get messy',
    can: 'a baseline of security, so you can afford to try the riskier thing',
    manhCau:
      'You keep a group steady and are usually the person others come to when things get messy.',
    canCau:
      'You need a sense of safety before you are ready to try something new or take a risk. Knowing you have something to fall back on makes you surer of your choices.',
    tieuDeCan: 'What helps you move forward with confidence',
  },
  'Thái Âm': {
    manh: 'you notice a lot, remember detail, and look after people without making noise about it',
    can: 'time alone to refill, and someone who asks after you first',
    manhCau:
      'You notice a lot, remember detail, and look after people quietly, without saying so.',
    canCau:
      'You need time alone to refill. You also hope someone asks after you first, rather than having to raise it yourself.',
    tieuDeCan: 'What helps you get your energy back',
  },
  'Tham Lang': {
    manh: 'you pick up new things eagerly, connect widely, and adapt very quickly',
    can: 'variety — but also one centre of gravity so you do not spread too thin',
    manhCau:
      'You pick up new things eagerly, connect widely, and adapt to new settings very quickly.',
    canCau:
      'You need variety so you do not feel boxed in. But you also need one centre of gravity, or things spread thin and go nowhere.',
    tieuDeCan: 'What helps you go the distance',
  },
  'Cự Môn': {
    manh: 'what you say carries weight, and you tend to ask the question everyone else avoids',
    can: 'to be able to say things straight, because holding it in is what wears you down',
    manhCau:
      'What you say carries weight, and you tend to ask the question everyone else avoids.',
    canCau:
      'You need to be able to say what you think, because holding it in too long is what wears you down.',
    tieuDeCan: 'What takes the weight off you',
  },
  'Thiên Tướng': {
    manh: 'you are dependable, you keep your word, and you often end up mediating',
    can: 'to know clearly which side you are on, because ambiguity sits badly with you',
    manhCau:
      'You are dependable, you keep your word, and you often end up mediating when there is friction.',
    canCau:
      'You need to know clearly which side you are on. Sitting in ambiguity too long is what unsettles you most.',
    tieuDeCan: 'What keeps you at ease',
  },
  'Thiên Lương': {
    manh: 'you stay level when things get tangled and often become the steady one for those younger',
    can: 'meaning in the work itself — a well-paid but hollow role will not hold you long',
    manhCau:
      'When things get tangled you stay level and help everyone find a way through. You are also the person younger people come to for advice or a hand.',
    canCau:
      'You need to see the point of what you are doing. A well-paid but hollow role will not hold you for long.',
    tieuDeCan: 'What keeps you committed to your work',
  },
  'Thất Sát': {
    manh: 'you decide quickly, carry the consequences, and are not afraid to start over',
    can: 'a fight worth having, because things that are too smooth drain your drive',
    manhCau:
      'You decide quickly, carry the consequences, and are not afraid to start over.',
    canCau:
      'You need a target hard enough and worth enough to see through. Things that run too smoothly drain your drive.',
    tieuDeCan: 'What keeps your drive up',
  },
  'Phá Quân': {
    manh: 'you are willing to tear down the old arrangement and rebuild it the way you believe in',
    can: 'people who trust you mid-way through, because that is when you are most easily misread',
    manhCau:
      'When an approach stops convincing you, you are willing to start again rather than keep it out of habit.',
    canCau:
      'You need people who trust you mid-way through, because that is when you are most easily misread.',
    tieuDeCan: 'What carries you through a hard stretch',
  },
};

/** Nét chủ đạo của từng cung chức năng */
const CHU_DE_VI: Record<string, string> = {
  Mệnh: 'việc hiểu chính mình, biết mình muốn sống ra sao và mong người khác nhìn nhận mình thế nào',
  'Phụ Mẫu': 'quan hệ với thế hệ trên và những người có ảnh hưởng tới bạn',
  'Phúc Đức': 'sự bình yên trong lòng và những điều thực sự có ý nghĩa với mình',
  'Điền Trạch': 'chỗ ở, nơi làm việc và việc xây dựng cuộc sống ổn định lâu dài',
  'Quan Lộc': 'công việc, vai trò bạn đảm nhận và hướng phát triển lâu dài',
  'Nô Bộc': 'bạn bè, đồng nghiệp và những mối quan hệ quanh bạn',
  'Thiên Di': 'việc ra ngoài, đi lại và những cơ hội đến từ bên ngoài',
  'Tật Ách': 'sức khoẻ, nhịp sinh hoạt và những thứ bào mòn bạn một cách âm thầm',
  'Tài Bạch': 'tiền bạc và cách bạn tạo dựng sự ổn định cho mình',
  'Tử Tức': 'con cái, thế hệ sau hoặc những thành quả bạn muốn gìn giữ và trao lại',
  'Phu Thê': 'chuyện tình cảm và cách vun đắp mối quan hệ với người bạn đời',
  'Huynh Đệ': 'anh chị em, bạn bè đồng trang lứa hoặc những người đang cùng bạn đi qua một chặng đường',
};

const CHU_DE_EN: Record<string, string> = {
  Mệnh: 'understanding yourself, how you want to live, and how you want to be seen',
  'Phụ Mẫu': 'the generation above you and the people who shaped you',
  'Phúc Đức': 'inner quiet and what genuinely matters to you',
  'Điền Trạch': 'home, workplace, and building a settled life for the long run',
  'Quan Lộc': 'work, the role you hold, and where it is heading',
  'Nô Bộc': 'friends, colleagues, and the circle around you',
  'Thiên Di': 'going out, travelling, and the chances that arrive from outside',
  'Tật Ách': 'health, daily rhythm, and what quietly wears you down',
  'Tài Bạch': 'money and how you build steadiness for yourself',
  'Tử Tức': 'children, the generation after you, or what you want to keep and hand on',
  'Phu Thê': 'your relationship and how you build it with a partner',
  'Huynh Đệ': 'siblings, people your own age, or those walking a stretch of road with you',
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
  /** Nét của phụ tinh trọng yếu — thứ làm hai lá số cùng chính tinh đọc ra khác nhau */
  netPhuTinh: Record<string, string>;
  /** Vòng Tràng Sinh: nhịp sinh khí của một cung */
  netTrangSinh: Record<string, string>;
  chuDeCung: Record<string, string>;
  doSang: Record<string, string>;

  /**
   * Nét sao đã là CÂU HOÀN CHỈNH chưa.
   *
   * Tiếng Việt đã chuyển sang câu hoàn chỉnh; tiếng Anh còn là mảnh và vẫn nối
   * theo lối cũ. Một cờ ở đây rẻ hơn nhiều so với việc dịch lại cả kho chữ chỉ
   * để hai ngôn ngữ cùng dùng một lối ghép.
   */
  netLaCau?: boolean;

  noiVaiVe: string;
  noiVeCuoi: string;
  /** Dùng thay noiVeCuoi khi một vế đã tự mang gạch ngang — hai gạch trong một câu là câu gãy */
  noiVeCuoiKhongGach: string;

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
    nhomTongHop: string;
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
    /** Dòng "nên tận dụng" — nói nét sao tạo ra gì, thay vì đọc tên sao */
    netThuan: readonly string[];
    /** Dòng "nên lưu ý" cho sao vốn mang lực cản */
    netCan: readonly string[];
    /** Dòng "nên lưu ý" cho CHÍNH TINH: nét của nó là điểm mạnh, chỗ vướng nằm ở lúc nó quá tay */
    netCanChinh: readonly string[];
    chamVao: readonly string[];
    khongChamVao: readonly string[];
    tuanTrietCau: string;
    linhVucCo: readonly string[];
    linhVucTrong: string;
    trangThaiThuan: string;
    trangThaiCan: string;
    trangThaiCanBang: string;
    khongThayTheYTe: string;
  };
  /** Chữ cho bảng luận giải 8 lĩnh vực của người đã đăng nhập */
  luanSau: {
    linhVuc: Record<string, { nhom: string; tieuDe: string; cauHoi: string }>;
    ketLuanCo: readonly string[];
    ketLuanTrong: string;
    doanNet: readonly string[];
    doanCan: readonly string[];
    doanSangRo: readonly string[];
    doanSangKim: readonly string[];
    doanTuHoa: string;
    doanTuHoaRo: string;
    doanTuanTriet: string;
    doanTamPhuong: string;
    doanTrong: string;
    doanPhuTinh: readonly string[];
    doanDoiCung: readonly string[];
    doanDoiCungTrong: string;
    doanTrangSinh: readonly string[];
    doanGiaiDoanCham: readonly string[];
    doanGiaiDoanKhongCham: readonly string[];
    cauHoiPhanChieu: Record<string, string>;
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
    chuDeCo: readonly string[];
    chuDeTrong: string;
    /** Câu thứ hai của một mốc: nét dùng được ở quãng đó, để mười mốc không giống hệt nhau */
    chuDeNet: readonly string[];
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

/**
 * Nét của phụ tinh trọng yếu.
 *
 * Hai người cùng chính tinh thủ Mệnh vẫn sống rất khác nhau, và phần lớn khác
 * biệt nằm ở nhóm sao này. Bỏ chúng đi thì mọi bản luận đều na ná nhau — đó
 * chính là lý do bảng luận giải bản đầu bị chê là nông.
 *
 * Mỗi dòng viết ở dạng mệnh đề nối được vào sau "ở phần này, bạn còn…", nên
 * không có chủ ngữ và không tự kết câu.
 */
const PHU_TINH_VI: Record<string, string> = {
  'Tả Phù': 'thường có người đứng sau đỡ một tay đúng lúc cần, nhất là khi bạn không mở lời',
  'Hữu Bật': 'hay được giúp bởi những người vốn không nợ bạn gì — và thường là người bạn từng giúp trước đó',
  'Văn Xương': 'diễn đạt mạch lạc, nên chỗ nào cần viết ra hoặc trình bày là chỗ bạn có lợi thế',
  'Văn Khúc': 'nhạy với cái hay cái đẹp, và thuyết phục người khác bằng cảm giác nhiều hơn bằng lý lẽ',
  'Thiên Khôi': 'dễ gặp người đi trước sẵn lòng chỉ đường, thường ở tình huống rất tình cờ',
  'Thiên Việt': 'hay được cất nhắc bởi người có vị thế, nhưng thường muộn hơn bạn mong',
  'Lộc Tồn': 'giữ được phần mình một cách chắc chắn, đổi lại hay ngại mạo hiểm quá mức cần thiết',
  'Thiên Mã': 'khó ngồi yên một chỗ lâu; đổi chỗ, đổi việc, đổi cách làm là thứ giúp bạn bật lên',
  'Kình Dương': 'quyết liệt khi đã chọn, nhưng cái giá thường là va chạm với người xung quanh',
  'Đà La': 'hay bị kéo dài, dây dưa — chuyện đáng xong trong một tháng dễ thành nửa năm',
  'Hỏa Tinh': 'phản ứng rất nhanh khi bị thúc ép, nhưng độ bền mới là phần cần chủ động giữ',
  'Linh Tinh': 'âm ỉ khó chịu hơn là bùng nổ: thứ làm bạn mệt thường nhỏ mà kéo dài',
  'Địa Không': 'hay mất công cho những thứ cuối cùng không thành, nhưng cũng nhờ vậy mà nghĩ khác người',
  'Địa Kiếp': 'dễ mất mát bất ngờ ở chỗ bạn tưởng đã chắc, nên phần này không nên dồn hết trứng một giỏ',
  'Thiên Hình': 'giữ nguyên tắc chặt, và thường tự phạt mình nặng hơn người khác phạt bạn',
  'Thiên Riêu': 'nhạy chuyện tình cảm, dễ bị cuốn vào thứ mình biết là không nên',
  /*
   * Nhóm đào hoa và nhóm cô quả — thêm muộn, và việc thiếu chúng là một lỗ hổng
   * thật chứ không phải chuyện làm cho đủ bảng.
   *
   * `yeuToCuaCung` và `dauMocCuaCung` đều bỏ qua sao KHÔNG có nét viết sẵn, vì
   * đưa một cái tên không giải nghĩa được vào prompt là mở đường cho model tự
   * nghĩ nghĩa. Hệ quả đo được: người hỏi "có ai đang để ý tôi không" nhận về
   * một bài không hề nhắc tới Hồng Loan hay Đào Hoa đang đóng ở đâu — đúng nhóm
   * sao mà câu hỏi ấy hỏi tới. Engine không giấu chúng; nó chưa từng đọc được.
   */
  'Đào Hoa': 'dễ được để ý, và thường là được để ý trước khi bạn kịp chủ động gì',
  'Hồng Loan': 'chuyện đôi lứa ở phần này đến theo đường tự nhiên, ít phải sắp đặt',
  'Thiên Hỷ': 'hay có tin vui do người khác mang tới, không phải từ việc bạn tự xoay',
  'Cô Thần': 'dễ thấy một mình ngay giữa chỗ đông, và hay tự chọn đứng ngoài trước khi bị bỏ lại',
  'Quả Tú': 'giữ khoảng cách như một phản xạ, nên người muốn đến gần thường phải kiên nhẫn hơn mức thường',
  'Thiên Khốc': 'hay chạm lại chuyện cũ chưa xong, và nỗi buồn thường đến muộn hơn sự việc',
  'Thiên Hư': 'thấy trống ngay cả lúc không thiếu gì — đây là cảm giác, không phải hoàn cảnh',
  'Long Trì': 'được việc nhờ giữ được chừng mực, nhất là ở chỗ cần người biết điều',
  'Phượng Các': 'có gu và có duyên bề ngoài, nên bạn hay được chọn vì ấn tượng đầu',
  'Quốc Ấn': 'được giao phần việc có thực quyền, thường sớm hơn tuổi',
  'Ân Quang': 'hay được người khác nhớ tới lúc có cơ hội, kể cả khi bạn không xin',
  'Thiên Quý': 'gặp người sẵn lòng đỡ, và thường là người chẳng liên quan gì tới bạn trước đó',
  'Thiên Không': 'thứ tưởng nắm được hay hụt vào phút cuối, nên phần này đừng tính là đã xong',
  'Kiếp Sát': 'hay mất một thứ đúng lúc đang cần nó nhất, và thường mất vì chuyện ngoài tầm',
  'Phá Toái': 'việc ở phần này hay vỡ ở đoạn cuối, chỗ đáng lẽ chỉ còn hoàn thiện',
  'Hóa Lộc': 'phần này thường mở ra cơ hội thật, không phải cảm giác dễ chịu suông',
  'Hóa Quyền': 'phần này bạn nắm được quyền quyết, đổi lại là gánh trách nhiệm nặng hơn',
  'Hóa Khoa': 'phần này được người ngoài công nhận, tiếng tốt đến trước kết quả',
  'Hóa Kỵ': 'phần này hay vướng và hay phải làm lại, nhưng cũng là chỗ bạn học được nhiều nhất',

  /*
   * BỔ SUNG 20/09/2026 — 48 phụ tinh trước đây engine KHÔNG ĐỌC ĐƯỢC.
   *
   * Engine bỏ qua mọi sao không có nét viết sẵn, và đó là luật đúng: đưa một
   * cái tên không giải nghĩa được vào prompt là mở đường cho model tự nghĩ
   * nghĩa. Nhưng hệ quả không ai thấy là gần năm chục ngôi sao CÓ trên lá số
   * mà chưa bao giờ được đọc tới — engine không giấu chúng, nó chưa từng đọc
   * được chúng.
   *
   * Nặng nhất là vòng Thái Tuế: đó là nền của mọi câu luận theo NĂM, mà cả
   * mười hai sao của vòng ấy đều trống.
   */
  'Thái Tuế': 'năm nay có việc phải đứng ra nói, ký hoặc chịu trách nhiệm trước nhiều người hơn thường lệ',
  'Thiếu Dương': 'có tin vui hoặc lời mời đến sớm hơn bạn kịp chuẩn bị, thường qua một người quen',
  'Tang Môn': 'dễ gặp chuyện phải chia tay, tiễn đi hoặc khép lại một thứ đã theo mình lâu',
  'Thiếu Âm': 'chuyện được giải quyết âm thầm, ít người biết, và bạn cũng không muốn kể ra',
  'Quan Phù': 'dễ vướng giấy tờ, hợp đồng hoặc một lần phải giải thích rõ ràng với bên thứ ba',
  'Tử Phù': 'một việc đang chạy bị dừng hẳn, và phần khó là chấp nhận rằng nó không quay lại',
  'Tuế Phá': 'kế hoạch đã xếp dễ bị cắt ngang giữa chừng, thường do phía ngoài chứ không do bạn',
  'Long Đức': 'gặp người đứng ra nói giúp đúng lúc căng nhất, và chuyện dịu đi nhanh hơn bạn nghĩ',
  'Bạch Hổ': 'chuyện đến gấp và ồn, hay phải xử lý ngay trong ngày thay vì để mai tính',
  'Phúc Đức': 'có chỗ dựa từ người nhà hoặc người trên, thường hiện ra lúc bạn không kịp xoay',
  'Điếu Khách': 'bị kéo vào chuyện của người khác, phải đi lại, thăm hỏi hoặc đứng ra đáp lời',
  'Trực Phù': 'việc phải làm đúng ngày, đúng giờ, không hoãn được, dù bạn đang bận thứ khác',
  'Bác Sĩ': 'hay được nhờ gỡ rối cho người khác, kể cả việc không thuộc phần mình',
  'Lực Sĩ': 'làm được nhiều việc nặng cùng lúc, nhưng ít khi nói ra là mình đang gánh',
  'Thanh Long': 'có quãng mọi thứ trôi hẳn: việc xong nhanh, người đúng, tiền về đúng hẹn',
  'Tiểu Hao': 'tiền ra lắt nhắt nhiều lần nhỏ, cuối tháng nhìn lại mới thấy hụt',
  'Tướng Quân': 'vào việc là dứt khoát, nhưng dễ nóng với người làm chậm hơn mình',
  'Tấu Thư': 'nói và viết có trọng lượng, hay là người được chọn để trình bày thay cả nhóm',
  'Phi Liêm': 'dễ bị nói sau lưng hoặc bị hiểu sai qua lời kể của người thứ ba',
  'Hỷ Thần': 'có chuyện vui nhỏ đến đúng lúc mệt, thường từ người thân chứ không từ công việc',
  'Bệnh Phù': 'mệt kéo dài hơn mức đáng có, và hay bỏ qua cho tới khi phải nghỉ hẳn',
  'Đại Hao': 'một khoản lớn ra khỏi tay trong thời gian ngắn, thường vì việc không lùi được',
  'Phục Binh': 'có người giữ ý không nói thẳng, nên chuyện lộ ra muộn hơn bạn cần biết',
  'Quan Phủ': 'dễ phải làm rõ đúng sai với bên có thẩm quyền, từ giấy tờ tới lời hứa cũ',
  'Tam Thai': 'được xếp vào nhóm có vai vế, dù bạn không chủ động xin chỗ đó',
  'Bát Tọa': 'chỗ ngồi của bạn trong nhóm ổn định, ít bị thay dù có xáo trộn quanh mình',
  'Thai Phụ': 'hay được người có chức trách để mắt tới, nhất là trong việc học và thi cử',
  'Phong Cáo': 'công của bạn được ghi lại bằng giấy trắng mực đen chứ không chỉ bằng lời',
  'Thiên Quan': 'hợp với việc có chức trách rõ, có người trên duyệt và có quy tắc để dựa',
  'Thiên Phúc': 'lúc khó thường có đường lui, và người giúp đến từ chỗ bạn không ngờ',
  'Hoa Cái': 'thích làm một mình theo cách riêng, nên dễ bị nhìn là khó gần dù không cố ý',
  'Thiên Tài': 'học nhanh nhiều thứ khác nhau, nhưng dễ dừng lại ngay khi vừa đủ dùng',
  'Thiên Thọ': 'giữ nhịp sống đều được lâu, và hồi lại nhanh hơn người cùng tuổi',
  'Thiên Trù': 'không thiếu ăn thiếu chỗ ở, và hay được mời, được đãi trong lúc khó',
  'Thiên Y': 'biết cách tự chăm mình và hay được chỉ đúng người, đúng thuốc khi cần',
  'Giải Thần': 'chuyện tưởng lớn thường được gỡ vào phút cuối, đôi khi chỉ nhờ một lời nói đúng chỗ',
  'Thiên Giải': 'có người đứng ra nhận giúp phần khó nhất, và bạn nhẹ đi mà không phải nhờ vả',
  'Địa Giải': 'việc rối tự hạ nhiệt sau ít ngày, miễn là bạn không cố xử lý ngay trong lúc nóng',
  'Thiên Đức': 'được người khác nể và nhường, thường vì bạn từng giữ lời trong một việc nhỏ',
  'Nguyệt Đức': 'có người phụ nữ trong nhà hoặc trong nhóm đứng ra đỡ đúng lúc bạn đuối',
  'Đường Phù': 'có quãng được nâng đỡ rõ, việc và người cùng thuận trong một khoảng ngắn',
  'Thiên La': 'thấy mình bị giữ lại một chỗ, muốn đi mà chưa đi được, thường vì ràng buộc cũ',
  'Địa Võng': 'nhiều việc nhỏ trói chân cùng lúc, gỡ được cái này thì cái kia lại níu',
  'Thiên Thương': 'dễ mất một khoản hoặc một người ở chỗ bạn đã đặt nhiều công sức',
  'Thiên Sứ': 'chuyện bất ngờ đến rất nhanh, thường đúng lúc bạn vừa thấy mọi thứ đã ổn',
  'Lưu Hà': 'dễ vướng chuyện liên quan tới nước, đi xa hoặc một lần chậm trễ ngoài ý muốn',
  'Đẩu Quân': 'có một mốc trong năm mà mọi việc dồn lại, làm xong quãng ấy thì phần còn lại nhẹ',
  'LN Văn Tinh': 'năm nay chuyện học, thi hoặc viết lách có kết quả rõ hơn các mặt khác',
};

const PHU_TINH_EN: Record<string, string> = {
  'Tả Phù': 'usually have someone step in at the right moment, especially when you have not asked',
  'Hữu Bật': 'often get help from people who owe you nothing — usually people you once helped',
  'Văn Xương': 'express yourself clearly, so anything that has to be written or presented plays to your strength',
  'Văn Khúc': 'have an eye for what is well made, and persuade people through feel more than argument',
  'Thiên Khôi': 'tend to meet people further along who will point the way, usually by chance',
  'Thiên Việt': 'get picked out by people with standing, though usually later than you would like',
  'Lộc Tồn': 'hold on to your share reliably, at the cost of avoiding risk more than you need to',
  'Thiên Mã': 'cannot sit still for long; changing place, work or method is what lifts you',
  'Kình Dương': 'are decisive once you have chosen, and the price is usually friction with people around you',
  'Đà La': 'tend to see things drag — what should take a month easily becomes half a year',
  'Hỏa Tinh': 'flare up fast and cool just as fast, so anything that needs staying power is where you drop it',
  'Linh Tinh': 'wear down slowly rather than blow up: what tires you is small but long',
  'Địa Không': 'often spend effort on things that come to nothing, which is also why you think unlike others',
  'Địa Kiếp': 'can lose suddenly where you thought you were safe, so this is not the place to put everything',
  'Thiên Hình': 'hold to your rules strictly, and usually punish yourself harder than anyone else would',
  'Thiên Riêu': 'feel things keenly, and are easily pulled toward what you know you should not',
  'Đào Hoa': 'get noticed easily, usually before you have done anything about it',
  'Hồng Loan': 'find that closeness here arrives naturally, with little arranging',
  'Thiên Hỷ': 'tend to get good news carried to you by someone else rather than earned alone',
  'Cô Thần': 'can feel alone in a full room, and often step outside before anyone leaves you out',
  'Quả Tú': 'keep distance by reflex, so anyone coming closer has to be more patient than usual',
  'Thiên Khốc': 'keep brushing against unfinished business, and the grief arrives later than the event',
  'Thiên Hư': 'feel empty even when nothing is missing — this is a feeling, not a circumstance',
  'Long Trì': 'get further by keeping proportion, especially where people value restraint',
  'Phượng Các': 'have taste and outward charm, so you often get picked on first impression',
  'Quốc Ấn': 'are handed work with real authority, usually earlier than your years',
  'Ân Quang': 'get remembered when opportunities come round, even when you never asked',
  'Thiên Quý': 'meet people willing to help, usually people with no prior tie to you',
  'Thiên Không': 'see what seemed secured slip at the last moment, so nothing here is done until it is done',
  'Kiếp Sát': 'lose something right when you need it most, usually to causes outside your reach',
  'Phá Toái': 'watch things here break at the last stretch, where only finishing was left',
  'Hóa Lộc': 'this area tends to open real opportunity, not just a pleasant feeling',
  'Hóa Quyền': 'this is where you hold the decision, and carry the heavier responsibility for it',
  'Hóa Khoa': 'this is where others recognise you — the reputation arrives before the result',
  'Hóa Kỵ': 'this area snags and has to be redone often, and is also where you learn the most',
};

/** Vòng Tràng Sinh — nhịp sinh khí của cung, đọc như giai đoạn của một chu kỳ */
const TRANG_SINH_VI: Record<string, string> = {
  'Trường Sinh': 'đang ở đầu một chu kỳ: chưa có gì rõ hình, nhưng đây là lúc gieo thì dễ mọc',
  'Mộc Dục': 'đang ở đoạn dễ phân tâm, thứ mới mẻ hấp dẫn hơn thứ đang dở',
  'Quan Đới': 'đang lên dần, sức bắt đầu đủ để nhận việc lớn hơn',
  'Lâm Quan': 'đang ở đoạn sung sức nhất của chu kỳ, làm được nhiều hơn bình thường',
  'Đế Vượng': 'đang ở đỉnh: mạnh, nhưng cũng là lúc dễ chủ quan nhất',
  'Suy': 'đang xuống dốc nhẹ, nên giữ hơn là mở thêm',
  'Bệnh': 'đang đuối sức, nên thứ gắng quá mức ở đây thường đòi bù lại về sau',
  'Tử': 'đang ở đáy chu kỳ, chuyện cũ khó kéo lại — thường là lúc nên buông',
  'Mộ': 'đang ở đoạn cất giữ: hợp với tích luỹ và sắp xếp hơn là bung ra',
  'Tuyệt': 'đang ở chỗ đứt đoạn, thứ gì đứt ở đây thường không nối lại như cũ',
  'Thai': 'đang manh nha một hướng mới, chưa thành hình nhưng đã bắt đầu',
  'Dưỡng': 'đang ở đoạn nuôi dưỡng, làm chậm mà chắc thì về sau đỡ phải sửa',
};

const TRANG_SINH_EN: Record<string, string> = {
  'Trường Sinh': 'sits at the start of a cycle: nothing has taken shape yet, but what you plant here takes',
  'Mộc Dục': 'sits where attention scatters — whatever is new looks better than what is half done',
  'Quan Đới': 'is on the way up, with just enough strength to take on something larger',
  'Lâm Quan': 'is at the strongest stretch of the cycle, able to carry more than usual',
  'Đế Vượng': 'is at the peak: strong, and also the easiest place to get complacent',
  'Suy': 'is easing downward, so holding serves you better than opening more',
  'Bệnh': 'is running thin — pushing past your limit here usually costs you later',
  'Tử': 'sits at the bottom of the cycle, where the old thing will not be revived — usually a time to let go',
  'Mộ': 'is in the storing stretch: better suited to gathering and ordering than to expanding',
  'Tuyệt': 'sits at a break, and what snaps here rarely joins back the same way',
  'Thai': 'is where a new direction stirs — not formed yet, but begun',
  'Dưỡng': 'is in the nurturing stretch, where slow and solid saves you repairs later',
};

export const KHUON: Record<NgonNguDoc, KhuonChu> = {
  vi: {
    netSao: NET_VI,
    netPhuTinh: PHU_TINH_VI,
    netTrangSinh: TRANG_SINH_VI,
    chuDeCung: CHU_DE_VI,
    doSang: DO_SANG_VI,
    netLaCau: true,
    noiVaiVe: ' ',
    noiVeCuoi: ' ',
    noiVeCuoiKhongGach: ' ',
    diemNoiBat: {
      nhom: 'Điểm nổi bật',
      tieuDe: 'Điểm mạnh của bạn',
      tieuDeTrong: 'Bạn linh hoạt trong cách thể hiện bản thân',
      trong:
        'Cung Mệnh của bạn không có chính tinh tọa thủ, còn gọi là Mệnh vô chính diệu. Khi luận giải, cần xét thêm các chính tinh ở cung đối diện để hiểu rõ hơn về tính cách. Theo cách đọc này, bạn có thể dễ thích nghi với hoàn cảnh và bộc lộ những nét khác nhau khi ở trong những môi trường khác nhau.',
    },
    dieuThuongCan: {
      nhom: 'Điều bạn thường cần',
      tieuDe: 'Điều giúp bạn thấy dễ chịu hơn',
      mo: '{net}',
      moTrong: '{chuDe} là những điều bạn dành nhiều tâm sức.',
      dong: ' {chuDe} là những điều bạn dành nhiều tâm sức.',
    },
    giaiDoan: {
      nhom: 'Giai đoạn hiện tại',
      tieuDe: 'Điều đáng chú ý trong năm {nam}',
      daiVan: 'Trong giai đoạn này, bạn quan tâm nhiều hơn đến {chuDe}.',
      nam: 'Riêng năm {nam}, sự chú ý có thể hướng nhiều hơn đến {chuDe}.',
      nhacXuHuong:
        'Đây là những chủ đề có thể được bạn quan tâm hơn, không có nghĩa một sự việc cụ thể chắc chắn sẽ xảy ra.',
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
      /*
       * Bốn câu này người dùng đọc thẳng trên màn Hành trình, nên chúng phải là
       * tiếng Việt chứ không phải sổ sách của engine.
       *
       * Bản cũ viết "các yếu tố thuận đang nhiều hơn yếu tố cản" — đúng về mặt
       * kế toán và vô nghĩa với người đọc: "yếu tố" là yếu tố nào, và họ tra ở
       * đâu? Cùng một lỗi đã rò ra mặt trước ở khối chat, và nó có gốc ở đây.
       */
      nhipTienMo:
        'Quãng này mở hơn là khép: việc đẩy ra thường có chỗ đi, ít gặp cửa đóng. Đẩy đúng chỗ bạn vốn mạnh thì đi được xa hơn bình thường.',
      nhipGiuMo:
        'Không có chiều nào thắng hẳn chiều nào. Giữ nguyên guồng đang chạy thường có lợi hơn mở thêm một mặt trận mới.',
      nhipRaSoatMo:
        'Có vài chỗ cần kiểm lại trước khi đi tiếp. Không phải dừng, mà là xem lại thứ mình đang dựa vào.',
      nhipThuHepMo:
        'Quãng này khép hơn là mở: việc dễ tắc ở đoạn giữa, và thứ đang dàn mỏng là thứ tốn sức nhất. Thu gọn lại thường đỡ mệt hơn cố giữ hết.',
      chuDeChinh: 'Chủ đề chính',
      tieuDeGiaiDoan: 'Một quãng dài nghiêng về {chuDe}',
      tieuDeNam: 'Năm {nam}: {chuDe} là thứ dễ nổi lên',
      tieuDeThang: 'Tháng {thang}/{nam}: nhịp ngắn xoay quanh {chuDe}',
      subline:
        'Dưới đây là điều đáng chú ý trong quãng này, và những gì đã dẫn Celes tới nhận định đó.',
      tanDung: 'Nên tận dụng',
      luuY: 'Nên lưu ý',
      tanDungTrong:
        'Quãng này không có chỗ dựa nào nổi hẳn lên — thường là lúc kết quả đến từ việc làm đều, không từ cơ hội bất ngờ.',
      luuYTrong:
        'Không có chỗ vướng nào nổi hẳn lên. Điều dễ hỏng nhất trong một quãng như vậy lại là chủ quan.',
      nhipHanhDong: 'Nhịp hành động',
      nhomTongHop: 'Nếu ghép lại',
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
      netThuan: [
        'Ở phần {chuDe}, thứ đang đỡ bạn là chuyện {net}.',
        'Phần {chuDe} đang có chỗ dựa: {net}.',
        'Cái chạy thuận trong quãng này nằm ở {chuDe}, cụ thể là {net}.',
      ],
      netCan: [
        'Ở phần {chuDe}, chỗ dễ vướng là chuyện {net}.',
        'Phần {chuDe} là nơi phải giữ ý: {net}.',
        'Chỗ tiêu sức trong quãng này nằm ở {chuDe}, cụ thể là {net}.',
      ],
      netCanChinh: [
        'Ở phần {chuDe}, chỗ cần canh là lúc quá tay với nét {net}.',
        'Phần {chuDe} vướng không phải vì thiếu sức, mà vì dùng quá liều cái nết {net}.',
        'Trong quãng này, {chuDe} là nơi điểm mạnh dễ quay ra làm khó chính bạn: {net}.',
      ],
      chamVao: [
        ' Quãng này chạm thẳng vào cung đó, nên phần này dễ có chuyện hơn bình thường.',
        ' Quãng đang xét đi qua đúng cung đó, nên đây là phần đáng để tâm trước.',
        ' Cung đó nằm trong tầm của quãng này, nên phần này khó giữ yên được lâu.',
      ],
      khongChamVao: [
        ' Quãng này không chạm vào cung đó, nên phần này thường giữ nhịp cũ.',
        ' Cung đó nằm ngoài tầm quãng đang xét, nên phần này ít biến động hơn.',
        ' Quãng đang xét không đi qua cung đó, nên đây chưa phải chỗ cần dồn sức.',
      ],
      tuanTrietCau: '{ten} đóng tại {cung} — {chuDe} thường chậm hiện ra đúng lúc cần',
      linhVucCo: [
        'Phần {nhan} đọc từ {cung}: {trangThai}.{them}',
        '{nhan} nhìn từ {cung} thì {trangThai}.{them}',
        'Về {nhan}, chỗ để nhìn là {cung}, và ở đó {trangThai}.{them}',
      ],
      linhVucTrong: 'Phần {nhan} không đọc được từ lá số này.',
      /*
       * Ba câu này hiện thẳng trên màn Hành trình, mỗi lĩnh vực một câu.
       *
       * Bản cũ viết "các yếu tố đang đỡ nhiều hơn cản" — người đọc không tra
       * được "yếu tố" nào và không đối chiếu được gì. Cổng ngôn ngữ giờ CHẶN
       * đúng cách nói ấy, và bộ kiểm bắt được nó ở chính đây.
       *
       * Viết lại thành thứ QUAN SÁT ĐƯỢC: nói việc ở phần đó chạy ra sao, chứ
       * không nói về sổ sách của engine.
       */
      trangThaiThuan: 'việc ở đây thường có chỗ đi, ít gặp cửa đóng',
      trangThaiCan: 'việc ở đây hay tắc ở đoạn giữa, xong muộn hơn dự tính',
      trangThaiCanBang: 'không chiều nào thắng hẳn, nên nó chạy theo thứ bạn dồn sức vào',
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
      ketLuanCo: [
        'Ở phần {chuDe}, nét rõ nhất của bạn là {net}.',
        'Nói về {chuDe}: điều dễ thấy nhất ở bạn là {net}.',
        'Khi chuyện chạm tới {chuDe}, thứ nổi lên trước tiên là {net}.',
        'Về {chuDe}, một nét khá rõ trong cách bạn vận hành là {net}.',
      ],
      ketLuanTrong:
        'Phần {chuDe} của bạn không có sao chính nào đóng, nên nét ở đây mượn từ cung đối diện.',
      doanNet: [
        'Trong đời sống hằng ngày, điều đó hiện ra thành việc {net}.',
        'Nét ấy không đứng một mình: nó đi cùng chuyện {net}.',
        'Kéo theo đó là việc {net}.',
        'Đủ lâu thì nó thành nếp: {net}.',
      ],
      doanCan: [
        'Thiếu điều kiện sau thì nét mạnh ở trên chùng xuống rất nhanh: {can}.',
        'Cái giá phải trả là một điều kiện bạn hiếm khi nói ra: {can}.',
        'Muốn nét trên bền chứ không bật lên từng đợt, bạn cần {can}.',
        'Phần này mạnh hay yếu không do sao quyết, mà do bạn có được {can}.',
      ],
      doanSangRo: [
        'Vì ở mức {sang}, nó lộ ra sớm và gần như không cần hoàn cảnh thuận — người ngoài thường thấy trước cả bạn.',
        'Ở mức {sang}, phần này đã thành nếp từ sớm chứ không phải thứ bạn phải tập.',
        'Độ sáng {sang} khiến nó bật ra mặc định, kể cả những lúc bạn không định thể hiện.',
        'Mức {sang} nghĩa là nó chạy được cả khi bạn đang cạn sức, nên bạn ít khi nhận ra mình đang dùng nó.',
        'Đủ {sang} để không phải gồng: thứ người khác phải cố thì ở bạn là mặc định.',
        'Với mức {sang}, nét này ổn định tới mức bạn dễ tưởng ai cũng như vậy.',
      ],
      doanSangKim: [
        'Chỉ ở mức {sang} nên nó có thật mà hay bị hoàn cảnh chặn lại — cảm giác muốn một đằng làm được một nẻo là chuyện quen thuộc.',
        'Ở mức {sang}, phần này còn là tiềm năng hơn là nếp sẵn: nó cần đúng hoàn cảnh mới bật ra.',
        'Độ sáng {sang} bắt phần này trả giá bằng thời gian trước khi thành hình, nên đừng đọc sự chậm ấy thành thiếu năng lực.',
        'Ở mức {sang}, nét này phải có hoàn cảnh đỡ mới ra được — nên nó hay bị hiểu nhầm là bạn không có.',
        'Mức {sang} không làm mất nét ấy, nó chỉ làm nét ấy tới muộn hơn người khác vài năm.',
        'Vì {sang}, phần này chạy dưới ngưỡng người ngoài nhìn thấy, kể cả khi bạn đang dùng nó nhiều nhất.',
      ],
      doanTuHoa:
        'Có {sao} rơi vào đây, nên cùng một bộ sao vẫn cho ra trải nghiệm khác: phần này thường đậm hơn, hoặc lệch đi so với mức bình thường.',
      doanTuHoaRo: 'Có {sao} rơi vào đây: {net}.',
      doanTuanTriet:
        'Có {ten} đóng ở đây, nên phần này hay đến muộn: nhiều người phải qua một quãng chệch nhịp rồi mới thấy rõ mình thế nào ở chỗ này.',
      doanTamPhuong:
        'Phần này không đứng một mình: nó nhận ảnh hưởng từ {hoTro}, và đối diện là {xung} — chỗ hay kéo bạn về hướng ngược lại.',
      doanTrong:
        'Vì mượn nét từ cung đối diện nên bạn thường linh hoạt ở phần này, nhưng cũng dễ thấy mình thay đổi tuỳ hoàn cảnh và tuỳ người.',
      doanPhuTinh: [
        'Cùng chỗ đó, bạn {net}.',
        'Chồng lên trên là chuyện bạn {net}.',
        'Thực tế hơn: bạn {net}.',
        'Đi liền với nó, bạn {net}.',
      ],
      doanDoiCung: [
        'Kéo ngược lại là {cung} với {sao}: phần đó đòi gần như thứ trái hẳn, nên chuyện ở đây không bao giờ là chọn một bên mà là chỉnh liều lượng.',
        'Lực ngược nằm ở {cung}, nơi {sao} đóng — ép nó im thì được yên một quãng, rồi nó quay lại to hơn.',
        'Ở phía đối diện, {cung} có {sao} kéo theo hướng khác. Lực đó không mất đi; nó chỉ chờ lúc bạn mệt nhất để lên tiếng.',
        'Cân lại phần trên là {cung} với {sao}: đây là chỗ điểm mạnh ở trên dễ quay ra làm khó chính bạn.',
        'Soi từ {cung}, nơi {sao} đóng, thì cùng một nét ấy đọc ra nghĩa gần như ngược lại.',
        'Thứ đứng đối diện là {cung} với {sao}, và hai bên không hoà nhau được: bên nào mạnh lên thì bên kia lùi, rồi đổi phiên.',
      ],
      doanDoiCungTrong:
        'Đối diện là {cung} và cũng không có sao chính nào đóng, nên phần này ít bị kéo về một hướng cố định — bạn tự do hơn, nhưng cũng ít điểm tựa hơn.',
      doanTrangSinh: [
        'Phần này nên đọc theo quãng chứ đừng đọc theo một lát cắt, vì về nhịp thì nó {net}.',
        'Đặt vào vòng sinh khí, đây là quãng {net}.',
        'Chuyện nên đẩy hay nên giữ nằm ở nhịp, mà nhịp lúc này thì {net}.',
        'Về mặt thời điểm, phần này đang ở chỗ {net}.',
        'Nhịp của nó không đều quanh năm: hiện tại là quãng {net}.',
        'Cùng một cấu trúc nhưng đọc ở hai thời điểm ra hai kết quả, và lúc này nó {net}.',
      ],
      doanGiaiDoanCham: [
        'Quãng {tu}–{den} tuổi bạn đang đi qua có chạm vào đây, nên đây là lúc phần này dễ có chuyện hơn bình thường — cả cơ hội lẫn va vấp.',
        'Giai đoạn {tu}–{den} tuổi rọi thẳng vào phần này: những gì lâu nay còn âm ỉ thì quãng này hay nổi lên thành chuyện cụ thể.',
        'Vì giai đoạn {tu}–{den} tuổi đi qua đúng chỗ này, đây là phần đáng để tâm bây giờ chứ không phải để dành.',
        'Khoảng {tu}–{den} tuổi là lúc phần này được bật lên, nên những gì bạn làm ở đây có sức nặng hơn bình thường.',
        'Trong quãng {tu}–{den} tuổi, đây là chỗ dễ đổi nhất — và đổi được theo cả hai chiều.',
        'Phần này nằm đúng đường đi của quãng {tu}–{den} tuổi, nên đừng đọc nó như một nét cố định.',
      ],
      doanGiaiDoanKhongCham: [
        'Giai đoạn bạn đang đi qua không rọi vào đây, nên phần này thường giữ nhịp cũ cho tới quãng sau.',
        'Quãng hiện tại không chạm trực tiếp vào phần này — nó vẫn chạy, chỉ là chạy lặng.',
        'Đây không phải phần được giai đoạn này làm nổi lên, nên đừng sốt ruột nếu thấy nó im.',
        'Quãng đang đi không đi qua chỗ này, nên thay đổi ở đây nếu có thì đến từ việc bạn chủ động chứ không từ hoàn cảnh.',
        'Phần này nằm ngoài tầm của giai đoạn hiện tại: nó ổn định, và sự ổn định đó là tin tốt.',
        'Giai đoạn này không làm gì phần đây cả — đó là chỗ bạn có thể để yên mà không mất gì.',
      ],
      cauHoiPhanChieu: {
        'tinh-cach': 'Lần gần nhất bạn hành xử đúng như mô tả trên là khi nào — và lúc đó bạn thấy nhẹ hay thấy mệt?',
        'cong-viec': 'Công việc hiện tại của bạn đang cho phép hay đang chặn đúng cái nét mạnh ở trên?',
        'tai-loc': 'Tiền của bạn đang chảy ra theo thói quen nào mà bạn chưa từng đặt câu hỏi?',
        'tinh-duyen': 'Điều bạn thường mong người kia hiểu mà chưa nói thành lời là gì?',
        'gia-dao': 'Vai trò bạn đang giữ trong nhà là do bạn chọn, hay do không ai khác nhận?',
        'quan-he': 'Trong những người quanh bạn, ai làm bạn đầy lên và ai làm bạn cạn đi?',
      },
      vanHanKetLuan: 'Giai đoạn bạn đang đi qua nghiêng về {chuDe}.',
      vanHanDan: 'Xem theo quãng dài, từng năm và từng tháng ở phần Hành trình.',
      phatTrienKetLuan: 'Nếu muốn đi xa hơn, chỗ đáng rèn nhất của bạn nằm quanh {chuDe}.',
      phatTrienManh: 'Vốn liếng bạn đã có sẵn, và hay quên dùng hơn là phải xây thêm, là chuyện {net}.',
      phatTrienCan: 'Chỗ lệch nằm ở phía còn lại, và nó không tự đến mà phải chủ động tạo ra: {can}.',
      phatTrienHoi:
        'Một câu đáng tự hỏi: lần gần nhất bạn dùng đúng điểm mạnh đó là khi nào, và vì sao sau đó bạn ngừng dùng?',
    },
    hanhTrinh: {
      giaiDoanNhan: '{tu}–{den} tuổi',
      giaiDoanPhu: 'Khoảng {tuNam}–{denNam}',
      thangNhan: 'Tháng {thang} âm',
      tuoiAm: 'tuổi âm {tuoi}',
      chuDeCo: [
        'Nghiêng về {chuDe}.',
        'Trọng tâm rơi vào {chuDe}.',
        'Quãng này xoay quanh {chuDe}.',
      ],
      chuDeNet: [
        'Nét dùng được nhất ở đây là {net}.',
        'Thứ đỡ bạn trong quãng đó thường là {net}.',
        'Phần này hay bật lên qua chuyện {net}.',
      ],
      chuDeTrong: 'Quãng này không có chủ đề nào nổi hẳn lên — thường là lúc mọi thứ giữ nhịp cũ.',
      nhipNhom: 'Điều đang chuyển động',
      nhipTieuDe: 'Tháng {thang} âm lịch năm {nam} của bạn',
      nhipGiaiDoan: 'Bạn đang trong quãng {tu}–{den} tuổi, trọng tâm nghiêng về {chuDe}.',
      nhipNam: 'Riêng năm {nam}, chủ đề dễ nổi lên là {chuDe}.',
      nhipThang: 'Trong tháng {thang} âm ({khoang} dương lịch), phần dễ được nhắc tới là {chuDe}.',
    },
    tenCung: TEN_CUNG_VI,
  },

  en: {
    netSao: NET_EN,
    netPhuTinh: PHU_TINH_EN,
    netTrangSinh: TRANG_SINH_EN,
    chuDeCung: CHU_DE_EN,
    doSang: DO_SANG_EN,
    netLaCau: true,
    noiVaiVe: ' ',
    noiVeCuoi: ' ',
    noiVeCuoiKhongGach: ' ',
    diemNoiBat: {
      nhom: 'What stands out',
      tieuDe: 'What you are good at',
      tieuDeTrong: 'You adapt to wherever you are',
      trong:
        'No major star sits in your Self house — a chart without a governing star. Reading it means looking at the stars in the house opposite to understand your character. Read that way, you adapt easily to circumstances and show different sides of yourself in different settings.',
    },
    dieuThuongCan: {
      nhom: 'What you tend to need',
      tieuDe: 'What makes things easier for you',
      mo: '{net}',
      /*
       * "— that is where…" chứ không phải "… is where…".
       *
       * Chủ đề cung khi thì số ít ("money and how you build steadiness"), khi
       * thì số nhiều ("work, the role you hold, and where it is heading"). Một
       * khuôn dùng thẳng động từ to be sẽ sai hợp số ở đúng một nửa số lá số.
       */
      moTrong: '{chuDe} — that is where most of your care goes.',
      dong: ' {chuDe} — that is where most of your care goes.',
    },
    giaiDoan: {
      nhom: 'This season',
      tieuDe: 'Worth noticing in {nam}',
      daiVan: 'In this stretch, you are paying more attention to {chuDe}.',
      nam: 'In {nam} specifically, your attention may turn more toward {chuDe}.',
      nhacXuHuong:
        'These are themes you may care about more; it does not mean any particular thing will happen.',
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
      nhomTongHop: 'Putting it together',
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
      netThuan: [
        'In {chuDe}, what is holding you up is that {net}.',
        'The {chuDe} side has something to lean on: {net}.',
        'What runs smoothly in this stretch sits in {chuDe}, specifically that {net}.',
      ],
      netCan: [
        'In {chuDe}, the place that snags is that {net}.',
        'The {chuDe} side is where to tread carefully: {net}.',
        'What drains you in this stretch sits in {chuDe}, specifically that {net}.',
      ],
      netCanChinh: [
        'In {chuDe}, what to watch is overplaying the fact that {net}.',
        'The {chuDe} side snags not from weakness but from too large a dose of this: {net}.',
        'In this stretch, {chuDe} is where the strength turns on you: {net}.',
      ],
      chamVao: [
        ' This stretch runs straight into that house, so this side is more likely to be live than usual.',
        ' The stretch under view passes through that house, so this is the side to watch first.',
        ' That house is within reach of this stretch, so this side rarely stays quiet for long.',
      ],
      khongChamVao: [
        ' This stretch does not touch that house, so this side usually keeps its existing rhythm.',
        ' That house sits outside the stretch under view, so this side moves less.',
        ' The stretch under view does not pass through that house, so this is not where to spend effort yet.',
      ],
      tuanTrietCau: '{ten} sits on {cung} — {chuDe} is usually slow to show up when needed',
      linhVucCo: [
        '{nhan} is read from {cung}: {trangThai}.{them}',
        'Seen from {cung}, {nhan} shows that {trangThai}.{them}',
        'For {nhan}, the place to look is {cung}, and there {trangThai}.{them}',
      ],
      linhVucTrong: '{nhan} cannot be read from this chart.',
      trangThaiThuan: 'things here tend to find a way through, with few closed doors',
      trangThaiCan: 'things here tend to stall halfway and finish later than planned',
      trangThaiCanBang: 'neither side clearly wins, so it follows wherever you put your effort',
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
      ketLuanCo: [
        'In the area of {chuDe}, what stands out most about you is {net}.',
        'On {chuDe}: the first thing that shows is {net}.',
        'When things touch {chuDe}, what surfaces first is {net}.',
        'About {chuDe}, one fairly clear pattern in how you operate is {net}.',
      ],
      ketLuanTrong:
        'No major star sits in the {chuDe} part of your chart, so it draws its character from the house opposite.',
      doanNet: [
        'Day to day, that shows up as {net}.',
        'It does not travel alone: it comes with {net}.',
        'Trailing behind it is {net}.',
        'Given long enough it becomes habit: {net}.',
      ],
      doanCan: [
        'Without the following, the strength above sags fast: {can}.',
        'The price is a condition you rarely voice: {can}.',
        'For that trait to hold rather than flare in bursts, you need {can}.',
        'Whether this area is strong is decided less by the stars than by your having {can}.',
      ],
      doanSangRo: [
        'At {sang} it surfaces early and needs almost no favourable conditions — others usually see it before you do.',
        'At {sang}, this became habit early rather than something you had to practise.',
        'Brightness {sang} makes it show by default, including when you were not trying to.',
      ],
      doanSangKim: [
        'Only at {sang}, so it is real but circumstance keeps checking it — wanting one thing and managing another is familiar here.',
        'At {sang} this stays potential more than habit: it needs the right setting to come out.',
        'Brightness {sang} makes this area pay in time before it takes shape, so do not read that slowness as lack of ability.',
      ],
      doanTuHoa:
        '{sao} falls here, so the same set of stars plays out differently: this area tends to be pushed harder, or twisted out of its usual shape.',
      doanTuHoaRo: '{sao} falls here: {net}.',
      doanTuanTriet:
        'There is {ten} sitting here, so this area tends to arrive late: many people go through a stretch of being out of step before they see how they actually are here.',
      doanTamPhuong:
        'This part does not stand alone: it draws from {hoTro}, and facing it is {xung} — the place that tends to pull you the other way.',
      doanTrong:
        'Because it borrows from the house opposite, you are usually adaptable here, but also more changeable depending on the situation and the person.',
      doanPhuTinh: [
        'In the same place, you {net}.',
        'Layered on top, you {net}.',
        'More concretely, you {net}.',
        'Right beside it, you {net}.',
      ],
      doanDoiCung: [
        'Pulling the other way is {cung} with {sao}: that side wants close to the opposite, so this is never about picking a side but about setting the dose.',
        'The counterweight sits in {cung}, where {sao} is — force it quiet and you get a calm stretch, then it comes back louder.',
        'Opposite, {cung} holds {sao} and pulls elsewhere. That pull does not go away; it waits for the day you are most tired.',
        'Balancing the above is {cung} with {sao}: this is where that strength turns around and makes things hard for you.',
      ],
      doanDoiCungTrong:
        'Facing it is {cung}, and no major star sits there either, so this area is pulled less firmly in any one direction — freer, but with less to lean on.',
      doanTrangSinh: [
        'Read this by the stretch rather than a single slice, because on rhythm it {net}.',
        'Set against the vitality cycle, this is the stretch where it {net}.',
        'Whether to push or to hold comes down to rhythm, and right now it {net}.',
      ],
      doanGiaiDoanCham: [
        'The stretch from age {tu} to {den} does touch this area, so this is when it is more likely to be live — in opportunity as much as in friction.',
        'Ages {tu}–{den} shine straight onto this area: what has been smouldering tends to surface as something concrete in this stretch.',
        'Because the stretch from {tu} to {den} runs through exactly here, this is the part worth attention now rather than later.',
      ],
      doanGiaiDoanKhongCham: [
        'The stretch you are in does not shine here, so this area usually keeps its existing rhythm until the next one.',
        'The current stretch does not touch this area directly — it still runs, it just runs quietly.',
        'This is not the part the current stretch brings forward, so do not read its quietness as a problem.',
      ],
      cauHoiPhanChieu: {
        'tinh-cach': 'When did you last act exactly as described above — and did it leave you lighter or more tired?',
        'cong-viec': 'Is your current work letting that strength out, or blocking it?',
        'tai-loc': 'Which spending habit of yours have you never actually questioned?',
        'tinh-duyen': 'What do you keep hoping the other person will understand without you saying it?',
        'gia-dao': 'Is the role you carry at home one you chose, or one nobody else would take?',
        'quan-he': 'Among the people around you, who fills you up and who drains you?',
      },
      vanHanKetLuan: 'The stretch you are moving through leans toward {chuDe}.',
      vanHanDan: 'See it by long stretch, year and month under Your journey.',
      phatTrienKetLuan: 'To go further, the ground worth working lies around {chuDe}.',
      phatTrienManh: 'The capital you already hold, more often forgotten than missing, is that {net}.',
      phatTrienCan: 'The gap sits on the other side, and it does not arrive on its own: {can}.',
      phatTrienHoi:
        'One question worth asking: when did you last use that strength properly, and why did you stop?',
    },
    hanhTrinh: {
      giaiDoanNhan: 'Ages {tu}–{den}',
      giaiDoanPhu: 'Around {tuNam}–{denNam}',
      thangNhan: 'Lunar month {thang}',
      tuoiAm: 'lunar age {tuoi}',
      chuDeCo: [
        'Leans toward {chuDe}.',
        'The centre of gravity falls on {chuDe}.',
        'This stretch turns around {chuDe}.',
      ],
      chuDeNet: [
        'The most usable trait here is that {net}.',
        'What tends to hold you up in that stretch is that {net}.',
        'This side usually comes alive through the fact that {net}.',
      ],
      chuDeTrong: 'Nothing stands out sharply in this stretch — usually a time that keeps its existing rhythm.',
      nhipNhom: 'What is in motion',
      nhipTieuDe: 'Your lunar month {thang} of {nam}',
      nhipGiaiDoan: 'You are in the stretch from age {tu} to {den}, with its centre of gravity on {chuDe}.',
      nhipNam: 'In {nam} specifically, the theme most likely to surface is {chuDe}.',
      nhipThang: 'Within lunar month {thang} ({khoang} by the solar calendar), the part most likely to come up is {chuDe}.',
    },
    tenCung: TEN_CUNG_EN,
  },
};
