import { cungDaiVan, cungTieuHan, type Cung, type LaSo } from './ansao';
import { CHI, CHINH_TINH } from './constants';

/**
 * Quick Read — ba góc nhìn ngắn dựng thẳng từ dữ liệu lá số, KHÔNG gọi AI.
 *
 * Lý do phải deterministic: đây là thứ người dùng mới nhìn thấy đầu tiên, mà gọi
 * model thì mất 15-45 giây và có thể hỏng khi hết quota. Chờ chừng đó trước khi
 * nhận được giá trị đầu tiên là chỗ rơi người dùng nặng nhất. AI vẫn dùng cho
 * phần luận giải dài phía sau, chỉ là không chặn ở bước đầu.
 *
 * Mỗi góc nhìn kèm "căn cứ" — chính là các dữ kiện trong lá số đã sinh ra nó, để
 * nút "Vì sao Celestia nói vậy?" có thứ thật mà mở ra chứ không phải lời hứa suông.
 */

export interface CanCu {
  /** Nhãn ngắn hiện trên chip, VD "Cung Mệnh tại Mão" */
  nhan: string;
  /** Giải thích bằng lời đời thường, hiện khi mở phần căn cứ */
  giaiThich: string;
}

export interface GocNhin {
  id: 'diem-noi-bat' | 'dieu-thuong-can' | 'chu-de-giai-doan';
  nhomChu: string;
  tieuDe: string;
  noiDung: string;
  canCu: CanCu[];
}

/**
 * Mô tả đời thường cho 14 chính tinh.
 *
 * Viết theo nguyên tắc của bản review: dùng "thường / dễ / có xu hướng" chứ không
 * khẳng định bản chất, nói về tình huống sống chứ không nói về thuật ngữ, và không
 * hứa hẹn kết quả.
 */
const NET_CHINH_TINH: Record<string, { manh: string; can: string }> = {
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

/** Nét chủ đạo của từng cung chức năng — dùng cho phần giai đoạn hiện tại */
const CHU_DE_CUNG: Record<string, string> = {
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

const TEN_DO_SANG: Record<string, string> = {
  M: 'miếu',
  V: 'vượng',
  D: 'đắc địa',
  L: 'lợi',
  B: 'bình hoà',
  H: 'hãm',
};

function chinhTinhCua(cung: Cung) {
  // CHINH_TINH khai báo as const nên .includes chỉ nhận đúng 14 tên đó
  return cung.sao.filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten));
}

/** Chỉ lấy tối đa hai sao để câu không dài quá mức đọc thoải mái */
function haiChinhTinhDau(cung: Cung) {
  return chinhTinhCua(cung).slice(0, 2);
}

function moTaDoSang(ma?: string | null) {
  return ma ? TEN_DO_SANG[ma] : undefined;
}

/**
 * Ghép danh sách thành câu tiếng Việt: "A", "A và B", "A, B và C".
 *
 * Các vế sau bị cắt chủ ngữ "bạn" lặp lại, vì nối nguyên vẹn sẽ ra kiểu
 * "bạn nghĩ nhanh và bạn điềm tĩnh" — đọc lên rất máy.
 */
function noiLietKe(items: string[]) {
  const sach = items.map((v, i) => (i === 0 ? v : v.replace(/^bạn\s+/, '')));
  if (sach.length <= 1) return sach[0] ?? '';
  // Bản thân mỗi vế đã có "và" bên trong, nối tiếp bằng "và" nữa sẽ ra ba chữ "và"
  // trong một câu — dùng dấu gạch ngang cho nhịp đọc gãy ra.
  return `${sach.slice(0, -1).join(', ')} — đồng thời ${sach[sach.length - 1]}`;
}

function canCuCung(cung: Cung, nhanCung: string): CanCu[] {
  const ra: CanCu[] = [];
  ra.push({
    nhan: `${nhanCung} tại ${cung.chi}`,
    giaiThich: `Trong lá số, ${nhanCung.toLowerCase()} rơi vào vị trí ${cung.chi}. Đây là điểm xuất phát để đọc mọi thứ còn lại.`,
  });

  for (const s of chinhTinhCua(cung)) {
    const sang = moTaDoSang(s.doSang);
    ra.push({
      nhan: sang ? `${s.ten} ${sang}` : s.ten,
      giaiThich: sang
        ? `${s.ten} đóng tại đây ở mức ${sang} — mức này cho biết nét của sao thể hiện rõ hay bị kìm lại.`
        : `${s.ten} đóng tại đây.`,
    });
  }

  const tuHoa = cung.sao.filter((s) => s.ten.startsWith('Hóa '));
  for (const s of tuHoa) {
    ra.push({
      nhan: s.ten,
      giaiThich: `${s.ten} làm lệch cách nét trên biểu hiện ra, nên cùng một bộ sao vẫn cho ra trải nghiệm khác nhau.`,
    });
  }

  if (cung.coTuan || cung.coTriet) {
    const ten = [cung.coTuan && 'Tuần', cung.coTriet && 'Triệt'].filter(Boolean).join(' và ');
    ra.push({
      nhan: `Có ${ten} tại cung này`,
      giaiThich: `${ten} làm nét của cung khó hiện ra sớm, thường phải qua một giai đoạn mới rõ.`,
    });
  }

  return ra;
}

/**
 * Dựng ba góc nhìn ngắn cho một lá số.
 *
 * @param namXem năm người dùng đang muốn nhìn vào — quyết định đại vận nào đang chạy
 */
export function docNhanh(laSo: LaSo, namXem: number): GocNhin[] {
  const cungMenh = laSo.cungs[laSo.menhIndex];
  const cungThan = laSo.cungs[laSo.thanIndex];
  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const daiVan = cungDaiVan(laSo, tuoiAm);
  const cungNam = laSo.cungs[cungTieuHan(laSo, tuoiAm)];

  const ra: GocNhin[] = [];

  // --- 1. Điểm nổi bật: đọc từ chính tinh thủ Mệnh ---
  const ctMenh = haiChinhTinhDau(cungMenh);
  const netManh = ctMenh.map((s) => NET_CHINH_TINH[s.ten]?.manh).filter(Boolean) as string[];
  ra.push({
    id: 'diem-noi-bat',
    nhomChu: 'Điểm nổi bật',
    tieuDe: netManh.length ? 'Thứ bạn thường làm tốt hơn người khác' : 'Bạn khó bị đóng khung',
    noiDung: netManh.length
      ? `${capHoaDau(noiLietKe(netManh))}.`
      : `Cung Mệnh của bạn không có chính tinh nào đóng, nên nét cá nhân được mượn từ cung đối diện. Kiểu lá số này thường khiến bạn linh hoạt hơn, nhưng cũng dễ thấy mình khác đi tuỳ môi trường đang ở.`,
    canCu: canCuCung(cungMenh, 'Cung Mệnh'),
  });

  // --- 2. Điều bạn thường cần: đọc từ cung an Thân ---
  const ctThan = haiChinhTinhDau(cungThan);
  const netCan = ctThan.map((s) => NET_CHINH_TINH[s.ten]?.can).filter(Boolean) as string[];
  const chuDeThan = CHU_DE_CUNG[laSo.thanCuCung];
  ra.push({
    id: 'dieu-thuong-can',
    nhomChu: 'Điều bạn thường cần',
    tieuDe: 'Thứ khiến bạn thấy đủ, hoặc thấy thiếu',
    noiDung: netCan.length
      ? `Bạn thường cần ${noiLietKe(netCan)}.${
          chuDeThan ? ` Phần lớn năng lượng của bạn dồn về ${chuDeThan}.` : ''
        }`
      : `Phần lớn năng lượng của bạn dồn về ${chuDeThan ?? 'những việc bạn tự chọn làm trọng tâm'} — đó thường là nơi bạn đầu tư nhiều nhất mà không tính toán thiệt hơn.`,
    canCu: [
      {
        nhan: `Thân cư ${laSo.thanCuCung}`,
        giaiThich: `Cung Thân cho biết phần đời bạn dồn sức vào nhiều nhất, thường rõ dần từ tuổi trung niên. Của bạn rơi vào ${laSo.thanCuCung}${chuDeThan ? ` — tức ${chuDeThan}` : ''}.`,
      },
      ...canCuCung(cungThan, 'Cung an Thân').slice(1),
    ],
  });

  // --- 3. Chủ đề giai đoạn hiện tại: đại vận đang chạy + cung tiểu hạn của năm xem ---
  const chuDeDaiVan = daiVan ? CHU_DE_CUNG[daiVan.tenCung] : undefined;
  const chuDeNam = CHU_DE_CUNG[cungNam.tenCung];
  ra.push({
    id: 'chu-de-giai-doan',
    nhomChu: 'Giai đoạn hiện tại',
    tieuDe: `Điều dễ nổi lên quanh năm ${namXem}`,
    noiDung: [
      daiVan && chuDeDaiVan
        ? `Bạn đang ở trong một giai đoạn dài mà trọng tâm nghiêng về ${chuDeDaiVan}.`
        : null,
      chuDeNam
        ? `Riêng năm ${namXem}, chủ đề dễ nổi lên là ${chuDeNam}.`
        : null,
      'Đây là xu hướng của giai đoạn, không phải một sự việc chắc chắn sẽ xảy ra.',
    ]
      .filter(Boolean)
      .join(' '),
    canCu: [
      ...(daiVan
        ? [
            {
              nhan: `Giai đoạn ${daiVan.daiVan?.tuTuoi}–${daiVan.daiVan?.denTuoi} tuổi ở ${daiVan.tenCung}`,
              giaiThich: `Lá số chia đời thành các giai đoạn 10 năm. Giai đoạn bạn đang đi qua rơi vào cung ${daiVan.tenCung} (${CHI[daiVan.chiIndex]}), nên chủ đề của cung đó nổi rõ hơn bình thường.`,
            },
          ]
        : []),
      {
        nhan: `Năm ${namXem} ứng vào ${cungNam.tenCung}`,
        giaiThich: `Mỗi năm ứng vào một cung khác nhau. Năm ${namXem} (tuổi âm ${tuoiAm}) rơi vào cung ${cungNam.tenCung}, nên chủ đề của cung này dễ được nhắc tới trong năm.`,
      },
      ...(daiVan ? canCuCung(daiVan, `Cung ${daiVan.tenCung}`).slice(1, 3) : []),
    ],
  });

  return ra;
}

function capHoaDau(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
