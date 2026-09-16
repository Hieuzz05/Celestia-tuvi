/**
 * Từ điển tiếng Việt cho app — nguồn chân lý về cấu trúc khoá.
 *
 * Bản tiếng Anh được TypeScript ràng buộc theo đúng bộ khoá này, nên thêm khoá
 * mà quên dịch là lỗi biên dịch chứ không âm thầm rơi về tiếng Việt trước mặt
 * người đọc tiếng Anh.
 *
 * Giọng: Celestia là thương hiệu, Celes là người dùng trò chuyện cùng. Không
 * nhắc AI, model, trường phái, "engine" ở bất cứ đâu người dùng nhìn thấy.
 */
export const vi = {
  chung: {
    tiepTuc: 'Tiếp tục',
    quayLai: 'Quay lại',
    thuLai: 'Thử lại',
    deSau: 'Để sau',
    xong: 'Xong',
    huy: 'Huỷ',
    dong: 'Đóng',
    luu: 'Lưu',
  },

  gioiThieu: {
    eyebrow: 'HIỂU MÌNH · RÕ ĐƯỜNG · VỮNG BƯỚC',
    tieuDe: 'Có những ngã rẽ bạn không nên đi một mình.',
    moTa: 'Celes ở đây để lắng nghe, cùng bạn nhìn rõ điều đang xảy ra và tìm ra hướng đi phù hợp hơn.',
    ctaChinh: 'Bắt đầu cùng Celes',
    ctaPhu: 'Tôi đã có tài khoản',
    chanTrang: 'Không cần biết trước về Tử Vi để bắt đầu.',
  },

  onboarding: {
    buoc: 'Bước {so} / {tong}',

    tenTieuDe: 'Celes nên gọi bạn là gì?',
    tenNhan: 'Tên của bạn',
    tenGoiY: 'Chỉ dùng để Celes xưng hô cho tự nhiên.',

    ngayTieuDe: 'Ngày bạn bắt đầu câu chuyện này',
    ngayMoTa: 'Thông tin này giúp Celes tạo bản đồ của riêng bạn.',
    ngayNhan: 'Ngày sinh',
    ngayVD: 'NN/TT/NNNN',
    ngayLoi: 'Ngày này chưa đúng, kiểm tra lại giúp nhé.',

    gioTieuDe: 'Bạn sinh vào khoảng thời gian nào?',
    gioBiet: 'Tôi nhớ giờ cụ thể',
    gioKhoang: 'Tôi chỉ nhớ khoảng giờ',
    gioKhongChac: 'Tôi không chắc',
    gioNhan: 'Giờ sinh',
    gioSuyRa: '{gio} · Giờ {chi}',
    gioKhongChacY:
      'Không có giờ sinh thì điểm xuất phát của cả bản đồ không xác định được. Celes sẽ không đoán bừa một giờ rồi đưa cho bạn kết quả trông như thật. Bạn có thể tìm trong giấy chứng sinh, sổ hộ tịch, hoặc hỏi lại người nhà rồi quay lại sau.',

    gioiTinhTieuDe: 'Thông tin cuối cùng để Celes hoàn thiện bản đồ',
    nam: 'Nam',
    nu: 'Nữ',

    banKhoanTieuDe: 'Điều gì đang khiến bạn nghĩ nhiều nhất lúc này?',
    banKhoanMoTa: 'Chọn tối đa hai điều. Celes sẽ bắt đầu từ đó.',
    banKhoanCta: 'Khám phá cùng Celes',
    banKhoan: {
      congViec: 'Công việc',
      tinhCam: 'Tình cảm',
      banThan: 'Bản thân',
      giaDinh: 'Gia đình',
      taiChinh: 'Tài chính',
      quyetDinh: 'Một quyết định quan trọng',
      chuaRo: 'Chưa rõ — tôi chỉ muốn hiểu mình hơn',
    },
  },

  dangTao: {
    buoc1: 'Celes đang ghép những mảnh đầu tiên…',
    buoc2: 'Đang nhìn lại những điểm nổi bật trong bản đồ của bạn…',
    buoc3: 'Sắp xong rồi.',
  },

  quickRead: {
    tieuDe: 'Một vài điều Celes thấy ở bạn',
    ctaChinh: 'Lưu hành trình của tôi',
    ctaPhu: 'Tiếp tục khám phá',
  },

  viSao: {
    lienKet: 'Muốn biết vì sao không?',
    tieuDe: 'Celes dựa vào đâu?',
    mucDiem: 'Điểm trong lá số',
    mucGiaiDoan: 'Giai đoạn hiện tại',
    mucNguon: 'Nguồn tham chiếu',
    moKyThuat: 'Xem chi tiết Tử Vi',
    dongKyThuat: 'Thu gọn',
    chuaCoNguon: 'Phần này dựa trên chính bản đồ của bạn, chưa trích từ tài liệu ngoài.',
  },

  dangKy: {
    tieuDe: 'Muốn Celes nhớ hành trình của bạn?',
    moTa: 'Tạo tài khoản để lưu bản đồ, câu hỏi đã hỏi và tiếp tục ở bất kỳ thiết bị nào.',
    apple: 'Tiếp tục với Apple',
    google: 'Tiếp tục với Google',
    email: 'Dùng email',
  },

  tab: {
    homNay: 'Hôm nay',
    hanhTrinh: 'Hành trình',
    celes: 'Celes',
    ketNoi: 'Kết nối',
    toi: 'Tôi',
  },

  homNay: {
    chaoSang: 'Chào buổi sáng, {ten}',
    chaoChieu: 'Chào buổi chiều, {ten}',
    chaoToi: 'Chào buổi tối, {ten}',
    nhan: 'HÔM NAY',
    hoiVeDieuNay: 'Hỏi Celes về điều này',

    giaiDoanTieuDe: 'Giai đoạn bạn đang đi qua',
    giaiDoanCta: 'Xem hành trình',

    chuDeTieuDe: 'Điều gì đang đáng chú ý?',

    hoiTieuDe: 'Có điều gì khiến bạn băn khoăn?',
    hoiCta: 'Nói chuyện với Celes',
    goiY: [
      'Tôi có nên thay đổi công việc?',
      'Tình cảm gần đây nói lên điều gì?',
      'Tôi đang ở giai đoạn nào?',
    ],

    khamPhaTieuDe: 'Khám phá',
    khamPha: {
      banDo: 'Bản đồ của tôi',
      ketNoi: 'Kết nối với một người',
      chuDe: 'Khám phá một chủ đề',
      hoc: 'Học cách đọc lá số',
    },
  },

  banDo: {
    tieuDe: 'Bản đồ của tôi',
    phu: 'Lá số Tử Vi',
    cheDo: {
      deHieu: 'Dễ hiểu',
      coDien: 'Cổ điển',
      chuyenSau: 'Chuyên sâu',
    },
    menh: 'Mệnh',
    than: 'Thân',
    cuc: 'Cục',
    banMenh: 'Bản mệnh',
    xemCoDien: 'Xem lá số cổ điển',
    hoiVeCung: 'Hỏi Celes về cung này',
  },

  celes: {
    tieuDe: 'Celes',
    phu: 'Ở đây cùng bạn',
    rongTieuDe: 'Hôm nay bạn muốn nói về điều gì?',
    oNhap: 'Nói với Celes…',
    dangNghi: 'Celes đang nhìn lại những điều liên quan…',
    goiY: [
      'Tôi đang phân vân chuyện công việc',
      'Tình cảm gần đây khiến tôi mệt',
      'Tôi có nên thay đổi lúc này không?',
      'Giúp tôi nhìn lại chuyện này',
      'Năm nay điều gì đáng chú ý nhất?',
    ],
    huuIch: 'Hữu ích',
    chuaDung: 'Chưa đúng',
    luuLai: 'Lưu lại',
    dangDungBanDo: 'Đang dùng bản đồ: {ten}',
  },

  hanhTrinh: {
    tieuDe: 'Hành trình của bạn',
    tongQuan: 'Tổng quan',
    nam: 'Năm',
    thang: 'Tháng',
    dangO: 'Bạn đang ở giai đoạn {tu}–{den} tuổi',
    xemGiaiDoan: 'Xem giai đoạn này',
    nenChuY: 'Điều nên chú ý',
    nenTanDung: 'Điều nên tận dụng',
    hoiVeNam: 'Hỏi Celes về năm này',
    hoiVeThang: 'Hỏi Celes về tháng này',
  },

  ketNoi: {
    tieuDe: 'Hiểu một mối quan hệ sâu hơn',
    themNguoi: 'Thêm một người',
    loai: {
      nguoiYeu: 'Người yêu / Vợ chồng',
      banBe: 'Bạn bè',
      giaDinh: 'Gia đình',
      dongNghiep: 'Đồng nghiệp',
      doiTac: 'Đối tác',
    },
    chieu: {
      giaoTiep: 'Cách hai người giao tiếp',
      camXuc: 'Nhu cầu tình cảm',
      vaCham: 'Điểm dễ va chạm',
      hoTro: 'Cách hỗ trợ nhau',
      taiChinh: 'Tài chính / hợp tác',
      giaiDoan: 'Giai đoạn hiện tại',
    },
  },

  toi: {
    tieuDe: 'Tôi',
    nhomTaiKhoan: 'Tài khoản',
    nhomDuLieu: 'Dữ liệu của tôi',
    nhomTraiNghiem: 'Trải nghiệm',
    nhomNangCao: 'Nâng cao',
    nhomHoTro: 'Hỗ trợ',

    nguoiCuaToi: 'Người của tôi',
    daLuu: 'Điều đã lưu',
    goiDangDung: 'Gói đang dùng',
    ngonNgu: 'Ngôn ngữ',
    giaoDien: 'Giao diện',
    thongBao: 'Thông báo',
    phuongPhap: 'Phương pháp lập lá số',
    cheDoChuyenSau: 'Chế độ chuyên sâu',
    trogiup: 'Trợ giúp',
    quyenRiengTu: 'Quyền riêng tư',

    giaoDienTuDong: 'Theo máy',
    giaoDienSang: 'Sáng',
    giaoDienToi: 'Tối',
    chuaDangNhap: 'Chưa đăng nhập',
    dangNhap: 'Đăng nhập',
  },

  trangThai: {
    rong: 'Chưa có gì ở đây. Hãy bắt đầu bằng bản đồ đầu tiên của bạn.',
    dangTai: 'Celes đang nhìn lại những điều liên quan…',
    loi: 'Celes chưa thể hoàn thành phần này. Thử lại sau một chút nhé.',
  },
};

export type TuDienApp = typeof vi;
