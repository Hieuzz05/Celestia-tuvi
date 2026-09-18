import type { TuDien } from './vi';

/**
 * English dictionary.
 *
 * Typed against the Vietnamese one, so a missing key is a build error rather than
 * a string that silently falls back to Vietnamese in front of an English reader.
 *
 * Voice follows the brand spec: Celestia is the brand, Celes is who the reader
 * talks to. No AI, model or school-of-thought terms on the front layer.
 */
export const en: TuDien = {
  chung: {
    tenApp: 'Celestia',
    tenBan: 'Celes',
    brandLine: 'Know yourself. See the path. Move forward.',
    ctaChinh: 'Start with Celes',
    quayLai: 'Back',
    tiepTuc: 'Continue',
    dongY: 'Done',
    huy: 'Cancel',
    dangMo: 'Opening…',
  },

  nav: {
    khamPha: 'Explore',
    cachHoatDong: 'How it works',
    cauChuyen: 'Our story',
    veCelestia: 'About Celestia',
    batDauMienPhi: 'Start free',
    homNay: 'Today',
    banDo: 'Explore the map',
    hanhTrinh: 'Journey',
    hoiCeles: 'Ask Celes',
    ketNoi: 'Connections',
    nguoiCuaToi: 'Charts',
    taiKhoan: 'Account',
    quanTri: 'Admin',
    dangNhap: 'Sign in',
    dangXuat: 'Sign out',
    ngonNgu: 'Language',
    cheDoSang: 'Light mode',
    cheDoToi: 'Dark mode',
  },

  landing: {
    eyebrow: 'KNOW YOURSELF · SEE THE PATH · MOVE FORWARD',
    tieuDe: 'Some crossroads you shouldn’t walk alone',
    moTa: 'When work, a relationship or a decision leaves you without bearings, Celes is here to listen, help you see what is actually going on, and find a direction that fits who you are.',
    ctaPhu: 'See what Celes can help with',
    microcopy: 'A few minutes to start · No account needed yet.',
    thuNgaySinhKhac: 'Try another birth date:',

    theEyebrow: 'QUESTIONS YOU CAN BRING HERE',
    theTieuDe: 'You don’t have to work through every question alone',
    the: [
      {
        tieuDe: 'Why do I keep getting stuck here?',
        noiDung:
          'Some problems keep coming back even after everything around you has changed. Celes helps you see what is repeating, and why.',
        cta: 'Look closer',
      },
      {
        tieuDe: 'Should I stay, or change something?',
        noiDung:
          'Not every choice has to be made right now. What matters is knowing where you stand and what you are trading away.',
        cta: 'Think it through with Celes',
      },
      {
        tieuDe: 'What is this season trying to tell me?',
        noiDung:
          'Sometimes you push, sometimes you hold, and sometimes you just reorder your priorities before moving again.',
        cta: 'See what stands out',
      },
    ],

    caiGiEyebrow: 'WHAT CELES DOES WITH YOU',
    caiGiTieuDe: 'Not a verdict. A view clear enough to act on.',
    caiGi: [
      {
        ten: 'Listens first',
        mo: 'Celes names what is actually bothering you before offering any read on it.',
      },
      {
        ten: 'Spots what repeats',
        mo: 'What you tend to do well, where you keep snagging, and what is surfacing in this season.',
      },
      {
        ten: 'Ends with one small step',
        mo: 'Never decides for you — just offers one thing you could do, or ask yourself next.',
      },
    ],

    tinEyebrow: 'WHY YOU CAN TRUST IT',
    tinTieuDe: 'Everything Celes says opens up to show its grounds',
    tinMo: 'You get the plain-language read first. When you want to know what it rests on, every layer underneath is still there.',
    tin: [
      {
        ten: 'Nothing improvised',
        mo: 'The facts Celes works from are computed the same way every time, not invented while answering.',
      },
      {
        ten: 'Always traceable',
        mo: 'Every read has a link straight to the details that produced it.',
      },
      {
        ten: 'Knows where to stop',
        mo: 'Celes talks about what a season tends toward, never about what will certainly happen.',
      },
    ],
    xemCachTinh: 'See what Celes works from',

    cuoiEyebrow: 'READY?',
    cauChuyenEyebrow: 'THE CELESTIA STORY',
    cauChuyenTieuDe: 'Why Celes exists',
    cauChuyenDoan1:
      'Most of the time when we are stuck, it is not information we are short of. We have already thought it over and still cannot tell whether to carry on, stop, or start again.',
    cauChuyenDoan2:
      'Celestia exists for exactly that moment. Not to add one more piece of advice to the pile you have already heard, but to help you see the thing from another angle — calmer, clearer, closer to yourself.',
    cauChuyenDoan3:
      'Celestia is the place you come to. Celes is who you talk with — a friend who listens, a teacher who sheds light, and someone alongside you at the crossroads.',
    khongLamEyebrow: 'WHAT CELES WILL NOT DO',
    khongLam: [
      {
        ten: 'No verdicts on fate',
        mo: 'Celes describes where a season leans, never what will certainly happen. The decision stays yours.',
      },
      {
        ten: 'No fear to sell',
        mo: 'No "severe year", no "urgent remedy". If a stretch is hard, Celes says exactly where it is hard and what can be done.',
      },
      {
        ten: 'Nothing unsupported',
        mo: 'Every read opens up to show what it rests on. If it cannot be opened, Celes does not say it.',
      },
    ],
    cuoiTieuDe: 'Start from you',
    cuoiMo: 'Just your birth date and time. You get the first read straight away, and only then decide whether to keep it.',
  },

  onboarding: {
    buoc: 'Step',
    yDinhTieuDe: 'What brings you here today?',
    yDinhMo: 'No need to get this exactly right — Celes just wants to know what is on your mind.',
    yDinh: {
      banThan: 'Myself',
      congViec: 'Work',
      tinhCam: 'A relationship',
      quyetDinh: 'A decision',
    },
    yDinhMoTa: {
      banThan: 'I want to understand myself better',
      congViec: 'Work is leaving me unsure',
      tinhCam: 'A relationship needs a second look',
      quyetDinh: 'I am standing at a crossroads',
    },

    ngayTieuDe: 'When were you born?',
    ngayMo: 'So Celes can understand you properly, start from the moment you were born. Use the solar calendar, exactly as on your birth certificate.',
    ngayNhan: 'Date of birth',

    gioTieuDe: 'Roughly what time?',
    gioMo: 'The hour shapes most of what Celes can read. A close approximation still works.',
    gioNhan: 'Hour',
    phutNhan: 'Minute',
    gioKhop: 'That falls in the {chi} hour.',
    khongNhoGio: 'I don’t know my birth time',
    khongNhoGioY1:
      'Without a birth time the starting point of the whole map is undefined. Celes will not guess an hour and hand you a result that merely looks real.',
    khongNhoGioY2:
      'Common places to find it: the hospital birth record, the original household register, or simply asking family. If you only recall roughly what part of the day it was, pick the nearest hour and compare a few neighbouring ones.',

    xacNhanTieuDe: 'That’s enough to start',
    xacNhanMo: 'One more detail that affects the calculation, and somewhere for you to recognise this map later.',
    gioiTinh: 'Gender',
    gioiTinhY: 'The traditional method splits into two groups to decide which way the life stages run.',
    nam: 'Male',
    nu: 'Female',
    tenGoi: 'Name (optional)',
    tenGoiY: 'Only so you can tell people apart once you save more than one.',
    tenGoiVD: 'e.g. Me, Mum, Nam',
    xong: 'See what Celes sees',
  },

  quickRead: {
    tieuDeChinh: 'There’s something quite clear about you…',
    tieuDeCoTen: 'There’s something quite clear about {ten}…',
    moTa: 'Celes starts from what stands out most, then two more things worth noticing.',
    viSao: 'Want to know why?',
    viSaoDong: 'Collapse',
    viSaoTieuDe: 'What Celes works from',
    viSaoMo: 'That read rests on the following details in your map:',
    giuLai: 'Keep these',
    daGiu: 'Kept',
    doiThongTin: 'Change details',

    sauTieuDe: 'Want to go deeper?',
    sauMo: 'Celes can join the separate pieces into one continuous read, or go straight at whatever is on your mind.',
    docDai: 'Look closer with Celes',
    docLai: 'Read again',
    dangDoc: 'Celes is joining the pieces of your map into something you can read…',
    hoiThang: 'Ask Celes',
    khamPhaSau: 'Explore deeper',
    theoChuDeTieuDe: 'Go straight at what’s on your mind',
    theoChuDeMo: 'Work, money, relationships, family, health — or just ask Celes something of your own.',

    banDoTieuDe: 'The full map',
    banDoPhu: 'Traditional chart',
    banDoMo: 'All twelve houses and their stars — for when you want to check the detail.',
    banDoMoNut: 'Show the full map',
    banDoDongNut: 'Collapse',
    thangXem: 'Month in view',
    loiLuu: 'Could not keep that — please try again shortly.',
    loiDocDai: 'The longer read is briefly unavailable. Your map is untouched — try again in a moment.',
    moBucTranhTieuDe: 'Want to see your whole picture?',
    moBucTranhMo:
      'Sign in and Celes will remember this chart, opening the deeper parts: character, work, money, relationships, family, social circle and the stretches you are moving through.',
    moLuanGiaiDayDu: 'Open the full reading',
    chuMoBucTranh: 'Free to start · Your chart will be kept for next time.',
    moiLaPhanDau: 'This is only the beginning',
    giuHanhTrinh: 'Keep my journey',
    chiXemTongQuan: 'I only want the overview',
    dangChoTieuDe: 'What opens up after this',
    dangChoMo: 'The four parts below read on from the map you just created. A free account opens all of them.',
    khoa: 'Account needed',
    khoaBanDo: 'All twelve houses, the stars, and how strongly each one sits.',
    khoaKhamPha: 'A separate reading per topic: work, money, relationships, family.',
    khoaHoi: 'Ask Celes what you are stuck on, answered from this map.',
    khoaHanhTrinh: 'The stretch you are in, this year, and this month.',
    ngaySai: 'That date doesn’t look right',
    ngaySaiMo: 'Celes could not read the date you entered. Mind checking it?',
    nhapLai: 'Start over',
  },

  auth: {
    tieuDe: 'Welcome back.',
    moTa: 'Everything you explored with Celes is still here.',
    tieuDeDangKy: 'Start with Celes',
    moTaDangKy: 'Somewhere to keep what you have discovered.',
    tiepTucVoi: 'Continue with {ten}',
    hoacEmail: 'or use email',
    email: 'Email',
    matKhau: 'Password',
    tenHienThi: 'Display name',
    tenHienThiVD: 'What you would like Celes to call you',
    nutDangNhap: 'Continue with Celes',
    nutDangKy: 'Create account',
    dangXuLy: 'Working…',
    quenMatKhau: 'Forgot your password?',
    chuaCoTaiKhoan: 'New to Celestia? Create a free account.',
    daCoTaiKhoan: 'Already have an account? Sign in',
    panelEyebrow: 'WHAT YOU KEEP',
    panelTieuDe: 'Everything you explored with Celes, in one place.',
    panelY: [
      'Your map and your family’s, without re-entering anything.',
      'Everything you have read, on any device.',
      'The conversation with Celes, picked up where you left it.',
    ],
    canEmailTruoc: 'Enter your email above first.',
    daGuiEmail: 'Password reset email sent. Open your inbox and follow the link.',
    loiGuiEmail: 'Could not send the reset email — please try again shortly.',
    daTaoTaiKhoan:
      'Account created. If a confirmation email arrives, follow the link in it before signing in.',
    chuaBat: 'Sign-in is not set up',
    chuaBatMo: 'Accounts need to be configured first. See HUONG-DAN.md for the steps.',
  },

  home: {
    chao: 'Hello {ten}',
    chaoKhongTen: 'Worth noticing right now',
    dangNoiBat: 'What stands out',
    giaiDoan: 'The season you are in',
    mangTheo: 'One line to carry today',
    doTuoi: 'ages {tu}–{den}',
    diTiep: 'Carry on from here',
    composerNhan: 'What is on your mind today?',
    composerGoiY: 'Write a few lines — Celes starts from wherever you are stuck.',
    composerGui: 'Tell Celes',
    chuDeTieuDe: 'Or start from something familiar',
    chuDeCongViec: 'Work',
    chuDeTinhCam: 'Relationships',
    chuDeBanThan: 'Yourself',
    chuDeQuyetDinh: 'A decision',
    quyetDinhCauHoi: 'I am facing a decision and I am not sure where to look at it from.',
    xemHanhTrinh: 'See the whole journey',
    chuaCoTieuDe: 'No map saved yet',
    chuaCoMo: 'Create your first map so Celes has something to read with you each day.',
  },

  hanhTrinh: {
    dangMo: 'Opening up',
    dangCang: 'Under strain',
    canCho: 'Not yet',
    eyebrow: 'YOUR JOURNEY',
    tieuDe: 'The stretches that are shaping you',
    moTa: 'A life in the chart does not run evenly: some long stretches change direction, some years bring one thing to the surface, some months only ask you to hold the rhythm. These are those three layers, stacked.',
    xemCua: 'Viewing the journey of',
    giaiDoanTieuDe: 'The long stretches',
    giaiDoanMo: 'Look at the stretches that run for years to see where the centre of your life is moving.',
    namTieuDe: 'Year by year',
    namMo: 'Each year brings a different handful of themes to the surface. Pick the year you want and see what is worth noticing, and why.',
    thangTieuDe: 'Month by month in {nam}',
    thangMo: 'Months here follow the chart’s own division, so they can sit a few days off the calendar on your wall.',
    dangDienRa: 'You are here',
    veHienTai: 'Back to now',
    lui: 'Back',
    toi: 'Forward',
    daChon: 'Selected',
    hoiVe: 'Ask Celes about this stretch',
    moBanDo: 'Open the map at this point',
    ngayTieuDe: 'What about single days?',
    ngayMo: 'The day layer needs a calculation rule Celestia has not finished checking against a reference chart, so it stays closed for now. The three layers above are enough to read the rhythm of a stretch.',
    chuaCoTieuDe: 'No map saved yet',
    chuaCoMo: 'The journey is read out of your map, so the map has to come first.',
    lapBanDo: 'Create my map',
  },

  banDo: {
    cheDoDeHieu: 'Plain',
    cheDoDeHieuMo: 'Only the major stars and the stretch currently running — enough to see the overall shape.',
    cheDoCoDien: 'Traditional',
    cheDoCoDienMo: 'The chart as it is normally cast: every star, its strength, the Four Transformations, Tuần and Triệt.',
    cheDoChuyenSau: 'In depth',
    cheDoChuyenSauMo: 'Adds the stars that travel with the year in view, and unlocks each display layer to toggle yourself.',
    namXem: 'Year in view',
    namTruoc: 'Previous year',
    namSau: 'Next year',
    lopHienThi: 'Layers',
    xuatAnh: 'Save image',
    inRa: 'Print',
    thang: 'Month {thang}',
  },

  cong: {
    eyebrow: 'THIS IS ONLY THE BEGINNING',
    cta: 'Create a free account',
    chu: 'Free, no card needed. The map you just created will be kept.',
    loiIch: {
      save_chart: {
        tieuDe: 'Keep this map',
        moTa: 'Create a free account so Celes remembers your map — open it next time and it is already there, on any device.',
      },
      full_chart: {
        tieuDe: 'See all twelve houses',
        moTa: 'The full version has every house, every star and how strongly each one sits. A free account opens it, and keeps the map.',
      },
      ask_celes: {
        tieuDe: 'Carry on the conversation with Celes',
        moTa: 'Create a free account so Celes remembers your map and keeps this conversation for next time.',
      },
      deep_read: {
        tieuDe: 'Go deeper into what is on your mind',
        moTa: 'Each topic is its own reading, drawn from your map. A free account opens them and saves them.',
      },
      connection: {
        tieuDe: 'See how two people run alongside each other',
        moTa: 'Both people have to be saved before they can be compared. Create a free account to start.',
      },
      journey: {
        tieuDe: 'See where you are in your own rhythm',
        moTa: 'The journey is read from a saved map: the stretch you are in, where this year leans, what surfaces this month. A free account opens it.',
      },
    },
  },

  luanSau: {
    eyebrow: 'THE FULL PICTURE',
    tieuDe: 'And here is what Celes reads more closely',
    moTa: 'Each part opens with what matters most, and only then the detail. Wherever it does not convince you, open the evidence underneath to see what Celes is drawing on.',
    hoiVePhanNay: 'Ask Celes about this part',
  },

  giuLaSo: {
    tieuDeDaDangNhap: 'Keep this chart before you go?',
    moTaDaDangNhap:
      'If you save it, Celes remembers this chart so you can carry on with Your journey, Ask Celes, or come back to the part you were reading without entering it again.',
    luu: 'Keep this chart',
    roiDi: 'Leave without saving',
    oLai: 'Stay here',
    tieuDeKhach: 'Keep this chart for next time?',
    moTaKhach:
      'Right now this chart only lives on your device. Sign in once and Celes remembers it, ready the next time you open it.',
    dangNhapDeLuu: 'Sign in to save',
    dangLuu: 'Saving…',
  },

  danhSach: {
    eyebrow: 'MY CHARTS',
    tieuDe: 'The charts you are keeping',
    laSoCuaToi: 'My chart',
    datLamCuaToi: 'Make this my chart',
    dangDat: 'Setting…',
    themLaSo: '+ Add a chart',
    xemLaSo: 'Open chart',
    sua: 'Edit',
    xoa: 'Delete',
    xacNhanXoa: 'Delete the chart for {ten}? This cannot be undone.',
    khongXoaMacDinh:
      'This one is currently "My chart". Pick another chart as the default before deleting it.',
    trong: 'No charts kept yet. Add the first one so Celes has something to read with you.',
    luuTheoTaiKhoan: 'Saved to your account — it shows up on any device.',
    luuTheoTrinhDuyet:
      'Saved on this browser only. Sign in to keep them and use them on every device.',
    chuyenLenTaiKhoan: 'Move the charts saved on this browser into your account',
    khongCoGiDeChuyen: 'There are no charts saved on this browser to move.',
    luuLai: 'Save',
    huy: 'Cancel',
    khongTen: 'Untitled',
    gio: '{gio}:00',
    nam: 'Male',
    nu: 'Female',
    loiLuu: 'Could not save — try again in a moment.',
    loiDat: 'Could not set it — try again in a moment.',
    loiXoa: 'Could not delete — try again in a moment.',
    loiChuyen: 'Could not move them — try again in a moment.',
    khongTinhDuoc: 'This chart cannot be calculated',
    xemLaSoKhac: 'Open a different chart',
    taoLaSoKhac: 'Create another chart',
  },

  hoiCeles: {
    eyebrow: 'ASK CELES',
    tieuDe: 'What is on your mind?',
    dangNoiVe: 'Talking about',
    nguoiVuaNhap: '— The chart you just entered —',
    hoiVeNguoiKhac: 'Ask about a different chart',
    hoiVeNguoiNay: 'Ask about this chart',
    canBietAi: 'Celes needs to know which chart this is about',
    canBietAiMo:
      'Pick a saved chart, or enter the birth details on the left. Without a chart the answer is only generic advice.',
    oNhap: 'Tell Celes…',
    gui: 'Send',
    dangTraLoi: 'Celes is reading your map…',
    loi: 'Celes could not answer just now. Your question is kept — try again in a moment.',
    xoaHoiThoai: 'Clear conversation',
    canCuMo: 'Want to know why?',
    canCuCachNoi: 'How Celes connected them',
    canCuLuongNguoc: 'What pulls the other way',
    canCuMucChac: 'How firm this is',
    chacManh: 'fairly clear — several independent sources agree',
    chacVua: 'a tendency — two sources agree',
    chacYeu: 'only a possibility worth noting',
    chacTraiChieu: 'still mixed — two forces coexist',
    chacChuaDu: 'not enough grounding in the sources',
    canCuDong: 'Hide the reasoning',
    canCuLaSo: 'From your chart',
    canCuNguon: 'Source passages used',
    canCuPhuongPhap: 'Chart rule set used',
    canCuPhuongPhapMo: 'This is the chart-calculation rule version, not a document in the library.',
    canCuChuDe: 'Topic detected',
    canCuKhongNguon:
      'No document in the library matched this question, so the technical claims were kept deliberately narrow.',
    mienTru:
      'Celes offers a perspective for you to weigh, not a verdict — and it is no substitute for medical, financial or legal advice.',
    goiYTieuDe: 'Not sure where to start?',
    goiY: [
      'Which of my strengths am I leaving unused?',
      'Where do I tend to get stuck at work?',
      'What should I prioritise in this season?',
      'What is my current relationship teaching me?',
      'What is most worth noticing this year?',
      'Explain my Self house in plain language.',
      'Why does Celes say I am in a season that needs change?',
      'Show me the chart evidence behind this reading.',
    ],
    khamPhaNhanhTieuDe: 'Quick explore',
    khamPhaNhanh: [
      { nhan: 'Yourself', cauHoi: 'What stands out most about me right now?' },
      { nhan: 'Work', cauHoi: 'Does my current work suit the way I operate?' },
      { nhan: 'Relationships', cauHoi: 'What do I keep repeating in my relationships?' },
      { nhan: 'Money', cauHoi: 'Where am I out of balance with money?' },
      { nhan: 'Family', cauHoi: 'What role am I carrying at home without noticing?' },
      { nhan: 'This season', cauHoi: 'What is this season trying to tell me?' },
    ],
    tuXemTieuDe: 'Would you rather read the map yourself?',
    tuXemMo:
      'Open all twelve houses, the stars and their strength — for when you want to check the detail rather than ask.',
    tuXemNut: 'Explore the map',
  },

  chiTietHan: {
    xemChiTiet: 'See the detail',
    xemChiTietMo:
      'Not just which house the period runs through. Celes puts the stars, the related houses and the overlapping period layers together to explain the fuller picture.',
    quayLai: 'Your journey',
    tongQuan: 'Overview',
    viSao: 'Why does Celes say so?',
    viSaoDong: 'Collapse the evidence',
    theoLinhVuc: 'By area of life',
    ctaTieuDe: 'Is something in this stretch on your mind?',
    ctaNut: 'Ask Celes about this stretch',
    chuaCoLaSo: 'No chart to read yet',
    chuaCoLaSoMo: 'Pick or create a chart first, then come back to this part.',
  },

  cachHoatDong: {
    eyebrow: 'HOW CELES WALKS WITH YOU',
    tieuDe: 'Start from whatever is on your mind',
    intro:
      'You do not need to know anything about Tử Vi, and you do not need a perfectly worded question. Just start from the thing you keep thinking about. Celes will work through the layers with you.',
    buoc: [
      {
        tieuDe: 'Tell Celes what is on your mind',
        noiDung:
          'Pick a topic, or just say the thing you are torn about. Work, a relationship, a decision — or simply wanting to understand yourself better.',
      },
      {
        tieuDe: 'Celes looks at your own picture',
        noiDung:
          'Celes reads your chart and the stretch you are moving through, then connects the related details to find what actually deserves attention.',
      },
      {
        tieuDe: 'You get a perspective, and you decide',
        noiDung:
          'Celes does not decide for you. Every reading has a “Why?” so you can see the evidence, weigh it, and choose your next step your own way.',
      },
    ],
    tinEyebrow: 'WHY YOU CAN TRUST IT',
    tinTieuDe: 'Three things Celes will not do',
    tin: [
      {
        ten: 'No hand-waving',
        mo: 'Everything Celes reads your chart from is calculated first and can be checked afterwards.',
      },
      {
        ten: 'No hidden reasoning',
        mo: 'Open “Why?” to see which house, star, relationship and period Celes is drawing on.',
      },
      {
        ten: 'No verdicts on your behalf',
        mo: 'Celes talks about tendencies and things worth watching, never about a future that is certain to happen.',
      },
    ],
    phuongPhapEyebrow: 'HOW IT IS CALCULATED',
    phuongPhapTieuDe: 'For those who want to check',
    phuongPhapMo:
      'What follows is the technical layer. You do not need it to use Celestia, but it is always here for anyone who wants to check the work.',
    lop: [
      {
        ten: 'What is fixed by calculation',
        mo: 'Converting the solar date to lunar, finding the Self, Body and Element, then placing every star across the twelve houses. All of it runs on formulas. The same birth moment always gives the same chart, today or next year.',
      },
      {
        ten: 'What is interpreted',
        mo: 'The short perspectives, the readings by area of life and the period readings are all built by formula from that same data, so they appear instantly and read the same every time. Only the long topic readings and the conversation are rewritten into flowing prose.',
      },
      {
        ten: 'What you can verify',
        mo: 'Every reading opens up to show which house, which star, how strongly it sits, and which version of the rule set produced it.',
      },
    ],
    hoiEyebrow: 'FREQUENTLY ASKED',
    hoiTieuDe: 'Worth knowing first',
    hoi: [
      {
        hoi: 'Which rules does Celestia calculate by?',
        dap: 'Celestia uses a named, versioned rule set rather than a vague school label. Every reading records the version it used, so you can still tell later where a result came from. The details sit in the evidence of each reading.',
      },
      {
        hoi: 'Why is the birth time needed?',
        dap: 'The birth time decides where the Self house falls, and almost everything else is read from there. One double-hour off and it is a different chart. If you are unsure of the time, Celestia says so rather than quietly handing you a result that may be wrong.',
      },
      {
        hoi: 'Does Celes invent facts?',
        dap: 'No. Every chart and period fact comes from the calculation layer; the interpretation may only reuse those facts. When there are documents in the knowledge base, citations say which document a passage came from.',
      },
      {
        hoi: 'Does Celestia predict the future?',
        dap: 'No. Celestia describes where a stretch of time leans, not what will happen. Read it as one more perspective before you decide, not as a verdict.',
      },
    ],
    cuoiEyebrow: 'SEE FOR YOURSELF',
    cuoiTieuDe: 'Reading about it takes longer than trying it',
    cuoiMo: 'Create a chart and open the evidence yourself — faster than finishing this page.',
    cuoiNut: 'Create a free chart',
  },

  ungHo: {
    ten: 'Support Celes',
    moiLyCaPhe: 'Buy Celes a coffee',
    tiepTucCung: 'Carry on with Celes',

    conCau: 'You have {con} of {tong} free questions left today.',
    hetCau: 'You have used all {tong} free questions today.',

    cong: {
      ask_quota: {
        tieuDe: 'Want to carry this conversation on?',
        moTa: 'You have used your {tong} free questions today. If what Celes sees is useful to you, support with any amount and carry on for 24 hours.',
        cta: 'Support & continue',
      },
      deep_map: {
        tieuDe: 'Want to see your whole picture?',
        moTa: 'The overview is free. A contribution opens the deeper parts: character, work, money, relationships, family, social circle, the season you are in, and where to grow.',
        cta: 'Open the full reading',
      },
      journey_detail: {
        tieuDe: 'Want a closer look at this stretch?',
        moTa: 'Celes reads deeper through the period layers, the stars travelling with the year, the trine and opposition, and everything acting on the moment you picked.',
        cta: 'Open this stretch in detail',
      },
      connection_full: {
        tieuDe: 'Want to understand this relationship more deeply?',
        moTa: 'Opens the full picture of how the two of you communicate, what each needs emotionally, where friction builds, how you support each other, and the period affecting you both.',
        cta: 'Open the full reading',
      },
      long_report: {
        tieuDe: 'Want one long, continuous reading?',
        moTa: 'The in-depth report is the longest piece Celes writes for a chart. It is included while you have report allowance left.',
        cta: 'Create an in-depth report',
      },
      profile_limit: {
        tieuDe: 'Want to keep more charts?',
        moTa: 'A free account keeps {soHoSoFree} chart. A contribution raises that to {soHoSoPlus} while Supporter access is active.',
        cta: 'Support to add charts',
      },
      voluntary: {
        tieuDe: 'If Celes is useful to you',
        moTa: 'A contribution keeps the product improving, and opens more depth in your own experience of it.',
        cta: 'Support Celes',
      },
    },

    loiIch: [
      'Carry on asking Celes.',
      'Open the deeper readings.',
      'See Your journey in detail.',
      'Keep the conversation you are in.',
    ],
    quayLaiNgayMai: 'Come back tomorrow',
    khongPhuThuocSoTien: 'You choose the amount. What opens does not depend on how much you give.',

    soTienTieuDe: 'Support Celes',
    soTienMoTa: 'A contribution keeps Celes walking with you, and opens more depth in your experience.',
    soKhac: 'Another amount',
    nhapSoTien: 'Enter an amount',
    banNhanDuoc: 'What you get:',
    nhan: [
      'Supporter access for 24 hours',
      'More questions for Celes',
      'The full reading, detailed journey and connections',
      'One in-depth report while allowance lasts',
    ],
    tiepTucThanhToan: 'Continue to payment',
    chuyenKhoanAnToan: 'Paid by bank transfer.',
    dangTao: 'Creating the payment…',
    loiTao: 'Could not create the payment. Try again in a moment.',
    dong: 'Close',

    quetMa: 'Scan the code in your banking app to complete it.',
    moTrangThanhToan: 'Open the payment page',
    maQrThayThe: 'Payment QR code for {soTien}',
    donHoTro: 'Support order',
    hetHanSau: 'Expires in',
    trangThai: {
      creating: 'Creating the payment…',
      pending: 'Waiting for payment… It confirms itself once the transfer lands.',
      paid_processing_entitlement: 'Payment received. Celes is opening your access…',
      success: 'Thank you for walking with Celes.',
      cancelled: 'You cancelled the payment.',
      expired: 'This payment session has expired.',
      failed: 'This payment could not be confirmed.',
    },
    tiepTucNoiDangDo: 'Carry on where you left off',
    thuLai: 'Try again',
    taoMaMoi: 'Create a new code',

    camOn: 'Thank you for walking with Celes.',
    camOnMo: 'Supporter access is active until {luc} — {so} questions left for Celes.',
    xemChiTietQuyen: 'See details',
    daHieu: 'Got it',
    supporterDangHoatDong: 'Supporter access is active',
    denKhi: 'Until {luc}',
    conCauHoi: '{so} questions left for Celes',
    conBaoCao: '{so} in-depth report',
    ungHoThem: 'Support again',
    lichSuNgay: 'Date',
    lichSuSoTien: 'Amount',
    lichSuTrangThai: 'Status',
    lichSuNguon: 'Opened from',
    trangThaiDon: {
      creating: 'Creating',
      pending: 'Awaiting payment',
      paid: 'Payment received',
      entitlement_granted: 'Successful',
      cancelled: 'Cancelled',
      expired: 'Expired',
      create_failed: 'Could not create',
      verification_failed: 'Needs review',
    },
    nguonDon: {
      ask_quota: 'Ask Celes',
      deep_map: 'The full reading',
      journey_detail: 'Journey in detail',
      connection_full: 'Connections',
      long_report: 'In-depth report',
      profile_limit: 'More charts',
      voluntary: 'Voluntary',
    },
    lichSuTieuDe: 'Your contributions',
    lichSuTrong: 'No contributions yet.',
  },

  chan: {
    mienTru:
      'Celes offers a perspective for you to weigh, not a verdict about your future — and it is no substitute for medical, financial or legal advice.',
  },
};
