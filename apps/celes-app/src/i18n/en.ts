import type { TuDienApp } from './vi';

/**
 * English dictionary for the app.
 *
 * Typed against the Vietnamese one, so a forgotten key is a compile error rather
 * than Vietnamese text silently appearing in front of an English reader.
 */
export const en: TuDienApp = {
  chung: {
    tiepTuc: 'Continue',
    quayLai: 'Back',
    thuLai: 'Try again',
    deSau: 'Later',
    xong: 'Done',
    huy: 'Cancel',
    dong: 'Close',
    luu: 'Save',
  },

  gioiThieu: {
    eyebrow: 'KNOW YOURSELF · SEE THE PATH · MOVE FORWARD',
    tieuDe: 'Some crossroads you shouldn’t walk alone.',
    moTa: 'Celes is here to listen, to help you see what is actually happening, and to find a direction that fits you better.',
    ctaChinh: 'Start with Celes',
    ctaPhu: 'I already have an account',
    chanTrang: 'No prior knowledge needed to begin.',
  },

  onboarding: {
    buoc: 'Step {so} of {tong}',

    tenTieuDe: 'What should Celes call you?',
    tenNhan: 'Your name',
    tenGoiY: 'Only so Celes can address you naturally.',

    ngayTieuDe: 'Your date of birth',
    ngayMoTa: 'This lets Celes build a map that belongs to you.',
    ngayNhan: 'Date of birth',
    ngayVD: 'DD/MM/YYYY',
    ngayLoi: 'That date doesn’t look right — mind checking it?',

    gioTieuDe: 'Roughly when were you born?',
    gioMo: 'Your birth time shapes most of what Celes can read. A rough time still works.',
    gioKhung: '{chi} hour',
    gioBiet: 'I know the exact time',
    gioThuGon: 'Just pick a time range',
    gioNhan: 'Time of birth',
    gioSuyRa: '{gio} · {chi} hour',
    khongNhoGio: 'I don’t know my birth time',
    khongNhoGioY1:
      'Without a birth time the starting point of the whole map is undefined. Celes will not guess an hour and hand you a result that merely looks real.',
    khongNhoGioY2:
      'Good places to look: the hospital birth record, the original household register, or ask family. If you only remember the part of day, pick the closest range and try the neighbouring ones to compare.',

    gioiTinhTieuDe: 'One last detail so Celes can finish your map',
    nam: 'Male',
    nu: 'Female',

    banKhoanTieuDe: 'What’s on your mind most right now?',
    banKhoanMoTa: 'Pick up to two. Celes will start there.',
    banKhoanCta: 'Explore with Celes',
    banKhoan: {
      congViec: 'Work',
      tinhCam: 'Relationships',
      banThan: 'Myself',
      giaDinh: 'Family',
      taiChinh: 'Money',
      quyetDinh: 'An important decision',
      chuaRo: 'Not sure — I just want to understand myself',
    },
  },

  dangTao: {
    buoc1: 'Celes is putting the first pieces together…',
    buoc2: 'Looking over what stands out in your map…',
    buoc3: 'Almost there.',
  },

  quickRead: {
    tieuDe: 'A few things Celes sees in you',
    ctaChinh: 'Save my journey',
    ctaPhu: 'Keep exploring',
  },

  viSao: {
    lienKet: 'Want to know why?',
    tieuDe: 'What Celes is working from',
    mucDiem: 'Points in your chart',
    mucGiaiDoan: 'This season',
    mucNguon: 'Sources',
    moKyThuat: 'See the traditional detail',
    dongKyThuat: 'Collapse',
    chuaCoNguon: 'This comes from your own map — nothing quoted from outside material.',
  },

  dangKy: {
    tieuDe: 'Want Celes to remember your journey?',
    moTa: 'Create an account to keep your map, the questions you’ve asked, and carry on from any device.',
    apple: 'Continue with Apple',
    google: 'Continue with Google',
    email: 'Use email',
  },

  dangNhap: {
    emailTieuDe: 'What’s your email?',
    emailMoTa: 'Celes will send a 6-digit code to this address. No password needed.',
    emailNhan: 'you@email.com',
    guiMa: 'Send code',
    maTieuDe: 'Enter the code from your email',
    maMoTa: 'We just sent it to {email}. Can’t find it? Check your Promotions or Spam folder.',
    maNhan: '6-digit code',
    xacNhan: 'Sign in',
    guiLai: 'Send a new code',
    guiLaiSau: 'Send a new code in {giay}s',
    doiEmail: 'Use a different email',
    dangGui: 'Sending…',
    loi: {
      'email-sai': 'That email address doesn’t look right. Could you check it?',
      'qua-nhieu': 'You’ve asked for a lot of codes just now. Please wait a little and try again.',
      'ma-sai': 'That code isn’t right or has expired. Type it again, or ask for a new one.',
      mang: 'Couldn’t connect. Check your network and try again.',
      khac: 'Couldn’t sign you in right now. Please try again in a few minutes.',
    },
  },

  tab: {
    homNay: 'Today',
    hanhTrinh: 'Journey',
    celes: 'Celes',
    ketNoi: 'Relationships',
    toi: 'Me',
  },

  homNay: {
    chaoSang: 'Good morning, {ten}',
    chaoChieu: 'Good afternoon, {ten}',
    chaoToi: 'Good evening, {ten}',
    nhan: 'TODAY',
    hoiVeDieuNay: 'Ask Celes about this',
    cauHoiVe: 'Tell me more about "{tieuDe}" — how is this showing up in my life?',

    giaiDoanTieuDe: 'The season you’re in',
    giaiDoanCta: 'View journey',

    chuDeTieuDe: 'What’s worth noticing?',

    hoiTieuDe: 'Something on your mind?',
    hoiCta: 'Talk to Celes',
    goiY: [
      'Should I change jobs?',
      'What is my love life telling me?',
      'What stage am I in?',
    ],

    khamPhaTieuDe: 'Explore',
    khamPha: {
      banDo: 'My map',
      ketNoi: 'Connect with someone',
      chuDe: 'Explore a topic',
      hoc: 'Learn to read a chart',
    },
  },

  banDo: {
    tieuDe: 'My map',
    phu: 'Traditional chart',
    menh: 'Self',
    than: 'Body',
    cuc: 'Element',
    banMenh: 'Nature',
    trangSinh: 'Life stage',
    hoiVeCung: 'Ask Celes about this house',
    namXem: 'Year',
    namTruoc: 'Previous year',
    namSau: 'Next year',
    luuTinh: 'Yearly stars',
    goiY: 'Tap a house to see all its stars and the houses that face it.',
    voChinhDieu: 'No main star',
    tieuHan: 'Year house',
    nguyetHan: 'Month house',
    daiVan: 'Decade',
    tuan: 'Tuần',
    triet: 'Triệt',
    tuanKhong: 'Tuần void',
    trietKhong: 'Triệt void',
    laSoMacDinh: 'Birth chart',
    namMenh: 'Male chart',
    nuMenh: 'Female chart',
    nhuan: 'leap',
    duongLich: 'Solar date',
    amLich: 'Lunar date',
    gioSinh: 'Birth hour',
    canChiNam: 'Year pillar',
    canChiThang: 'Month pillar',
    canChiNgay: 'Day pillar',
    canChiGio: 'Hour pillar',
    amDuong: 'Yin Yang',
    menhCuc: 'Self — Element',
    menhAnTai: 'Self house at',
    thanCu: 'Body house',
    menhChu: 'Self ruler',
    thanChu: 'Body ruler',
    tuoiHan: 'Lunar age',
    nhomChinhTinh: 'Main stars',
    nhomTuHoa: 'Transformations',
    nhomCat: 'Supportive stars',
    nhomHung: 'Challenging stars',
    nhomVong: 'Cycle stars',
    nhomLuu: 'Yearly stars',
    tamHop: 'Trine',
    xungChieu: 'Opposite',
    chuThichCat: 'Supportive · strong',
    chuThichHung: 'Challenging · weak',
    chuThichHan: 'Year house',
    nguHanhCung: 'House element',
  },

  celes: {
    tieuDe: 'Celes',
    phu: 'Here with you',
    rongTieuDe: 'What would you like to talk about today?',
    oNhap: 'Tell Celes…',
    dangNghi: 'Celes is looking over what’s relevant…',
    goiY: [
      'I’m torn about work',
      'Things have felt heavy lately',
      'Should I make a change now?',
      'Help me think this through',
      'What matters most this year?',
    ],
    huuIch: 'Helpful',
    chuaDung: 'Not quite',
    luuLai: 'Save',
    dangDungBanDo: 'Using map: {ten}',
    canDangNhapTieuDe: 'Sign in to talk with Celes',
    canDangNhapMoTa:
      'Celes needs to know it’s you to keep the thread of your story. What you just wrote is still here — sign in and send it again.',
    canDangNhapNut: 'Sign in with email',
    guiNhan: 'Send to Celes',
    xoaNut: 'Clear conversation',
    xoaTieuDe: 'Clear this conversation?',
    xoaMoTa:
      'Everything you’ve told Celes about this map will be deleted for good, on both web and app. Celes will start fresh.',
    hetLuotTieuDe: 'You’ve asked all {so} questions for today',
    hetLuotTieuDeChung: 'You’ve asked all your questions for today',
    hetLuotMoTa: 'What you just wrote is still here. Come back tomorrow — Celes will remember where you left off.',
  },

  hanhTrinh: {
    tieuDe: 'Your journey',
    tongQuan: 'Overview',
    nam: 'Year',
    thang: 'Month',
    dangO: 'You’re in the {tu}–{den} stage',
    xemGiaiDoan: 'View this stage',
    nenChuY: 'Worth watching',
    nenTanDung: 'Worth using',
    hoiVeNam: 'Ask Celes about this year',
    hoiVeThang: 'Ask Celes about this month',
  },

  ketNoi: {
    tieuDe: 'Understand a relationship better',
    themNguoi: 'Add someone',
    loai: {
      nguoiYeu: 'Partner',
      banBe: 'Friend',
      giaDinh: 'Family',
      dongNghiep: 'Colleague',
      doiTac: 'Business partner',
    },
    chieu: {
      giaoTiep: 'How you two communicate',
      camXuc: 'Emotional needs',
      vaCham: 'Where friction shows up',
      hoTro: 'How you support each other',
      taiChinh: 'Money and working together',
      giaiDoan: 'Where you both are now',
    },
  },

  toi: {
    tieuDe: 'Me',
    nhomTaiKhoan: 'Account',
    nhomDuLieu: 'My data',
    nhomTraiNghiem: 'Experience',
    nhomNangCao: 'Advanced',
    nhomHoTro: 'Support',

    nguoiCuaToi: 'My people',
    daLuu: 'Saved',
    goiDangDung: 'Plan',
    ngonNgu: 'Language',
    giaoDien: 'Appearance',
    thongBao: 'Notifications',
    phuongPhap: 'Chart method',
    cheDoChuyenSau: 'Expert mode',
    trogiup: 'Help',
    quyenRiengTu: 'Privacy',

    giaoDienTuDong: 'System',
    giaoDienSang: 'Light',
    giaoDienToi: 'Dark',
    chuaDangNhap: 'Not signed in',
    dangNhap: 'Sign in',
    dangXuat: 'Sign out',
    dangNhapMoTa: 'So Celes can remember your story on every device.',
  },

  trangThai: {
    rong: 'Nothing here yet. Start with your first map.',
    dangTai: 'Celes is looking over what’s relevant…',
    loi: 'Celes couldn’t finish this. Try again in a moment.',
  },
};
