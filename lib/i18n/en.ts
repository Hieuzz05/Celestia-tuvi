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
    banDo: 'My map',
    hanhTrinh: 'Journey',
    hoiCeles: 'Ask Celes',
    ketNoi: 'Connections',
    nguoiCuaToi: 'My people',
    taiKhoan: 'Account',
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

  chan: {
    mienTru:
      'Celes offers a perspective for you to weigh, not a verdict about your future — and it is no substitute for medical, financial or legal advice.',
  },
};
