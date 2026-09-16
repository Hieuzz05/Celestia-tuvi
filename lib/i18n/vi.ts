/**
 * Từ điển tiếng Việt — nguồn chân lý cho cấu trúc khoá.
 *
 * Bản tiếng Anh phải khớp đúng bộ khoá này (TypeScript kiểm tra giúp), nên thêm
 * khoá mới ở đây là bên kia báo thiếu ngay, không âm thầm rơi về tiếng Việt.
 *
 * Giọng văn theo brand spec: Celestia là thương hiệu, Celes là người mà người
 * dùng trực tiếp trò chuyện. Không nhắc AI, model, trường phái ở mặt trước.
 */
export const vi = {
  chung: {
    tenApp: 'Celestia',
    tenBan: 'Celes',
    brandLine: 'Hiểu mình. Rõ đường. Vững bước.',
    ctaChinh: 'Bắt đầu cùng Celes',
    quayLai: 'Quay lại',
    tiepTuc: 'Tiếp tục',
    dongY: 'Xong',
    huy: 'Huỷ',
    dangMo: 'Đang mở…',
  },

  nav: {
    khamPha: 'Khám phá',
    cachHoatDong: 'Cách hoạt động',
    cauChuyen: 'Câu chuyện Celestia',
    veCelestia: 'Về Celestia',
    batDauMienPhi: 'Bắt đầu miễn phí',
    homNay: 'Hôm nay',
    banDo: 'Bản đồ của tôi',
    hanhTrinh: 'Hành trình',
    hoiCeles: 'Hỏi Celes',
    ketNoi: 'Kết nối',
    nguoiCuaToi: 'Người của tôi',
    taiKhoan: 'Tài khoản',
    dangNhap: 'Đăng nhập',
    dangXuat: 'Đăng xuất',
    ngonNgu: 'Ngôn ngữ',
    cheDoSang: 'Chế độ sáng',
    cheDoToi: 'Chế độ tối',
  },

  landing: {
    eyebrow: 'HIỂU MÌNH · RÕ ĐƯỜNG · VỮNG BƯỚC',
    tieuDe: 'Có những ngã rẽ bạn không nên đi một mình',
    moTa: 'Khi công việc, tình cảm hay một quyết định khiến bạn mất phương hướng, Celes ở đây để lắng nghe, giúp bạn nhìn rõ điều đang xảy ra và tìm ra hướng đi phù hợp với chính mình.',
    ctaPhu: 'Xem Celes có thể giúp gì',
    microcopy: 'Chỉ cần vài phút để bắt đầu · Không cần tạo tài khoản ngay.',
    thuNgaySinhKhac: 'Thử với một ngày sinh khác:',

    theEyebrow: 'NHỮNG CÂU BẠN CÓ THỂ MANG TỚI',
    theTieuDe: 'Bạn không cần tự mình xoay xở với mọi câu hỏi',
    the: [
      {
        tieuDe: 'Vì sao tôi cứ mắc kẹt ở đây?',
        noiDung:
          'Có những vấn đề cứ quay lại dù hoàn cảnh đã thay đổi. Celes giúp bạn nhìn ra điều gì đang lặp lại và vì sao.',
        cta: 'Nhìn sâu hơn',
      },
      {
        tieuDe: 'Tôi nên tiếp tục hay thay đổi?',
        noiDung:
          'Không phải lựa chọn nào cũng cần được đưa ra ngay. Điều quan trọng là biết mình đang đứng ở đâu và đang đánh đổi điều gì.',
        cta: 'Cùng Celes nhìn lại',
      },
      {
        tieuDe: 'Giai đoạn này đang muốn nói gì với tôi?',
        noiDung:
          'Có lúc nên tiến, có lúc nên giữ, có lúc chỉ cần sắp xếp lại ưu tiên trước khi bước tiếp.',
        cta: 'Xem điều đang nổi bật',
      },
    ],

    caiGiEyebrow: 'CELES LÀM GÌ CÙNG BẠN',
    caiGiTieuDe: 'Không phải một lời phán. Một góc nhìn đủ rõ.',
    caiGi: [
      {
        ten: 'Lắng nghe trước',
        mo: 'Celes gọi tên điều bạn đang băn khoăn trước khi đưa ra bất cứ nhận định nào.',
      },
      {
        ten: 'Soi ra điều đang lặp lại',
        mo: 'Thứ bạn thường mạnh, thứ bạn hay vướng, và điều gì đang nổi lên trong giai đoạn này.',
      },
      {
        ten: 'Kết bằng một bước nhỏ',
        mo: 'Không quyết thay bạn — chỉ đưa ra một điều bạn có thể làm hoặc tự hỏi tiếp.',
      },
    ],

    tinEyebrow: 'VÌ SAO TIN ĐƯỢC',
    tinTieuDe: 'Mỗi điều Celes nói đều mở ra xem được căn cứ',
    tinMo: 'Bạn đọc bản dễ hiểu trước. Khi muốn biết điều đó dựa trên đâu, mọi lớp bên dưới vẫn còn nguyên.',
    tin: [
      {
        ten: 'Không nói vo',
        mo: 'Các dữ kiện Celes dựa vào được tính cố định, không phải do máy nghĩ ra lúc trả lời.',
      },
      {
        ten: 'Luôn mở ra được',
        mo: 'Mỗi nhận định có một đường dẫn tới đúng những căn cứ đã sinh ra nó.',
      },
      {
        ten: 'Biết chỗ dừng',
        mo: 'Celes nói về xu hướng của giai đoạn, không khẳng định điều gì chắc chắn sẽ xảy ra.',
      },
    ],
    xemCachTinh: 'Xem Celes dựa vào đâu',

    cuoiEyebrow: 'SẴN SÀNG CHƯA?',
    cauChuyenEyebrow: 'CÂU CHUYỆN CELESTIA',
    cauChuyenTieuDe: 'Vì sao Celes tồn tại',
    cauChuyenDoan1:
      'Phần lớn những lúc bế tắc, chúng ta không thiếu thông tin. Chúng ta đã nghĩ rất nhiều rồi mà vẫn không biết nên tiếp tục, dừng lại hay bắt đầu lại.',
    cauChuyenDoan2:
      'Celestia ra đời cho đúng khoảnh khắc đó. Không phải để thêm một lời khuyên nữa vào đống lời khuyên bạn đã nghe, mà để giúp bạn nhìn vấn đề từ một góc khác — bình tĩnh hơn, rõ hơn, và gần với chính bạn hơn.',
    cauChuyenDoan3:
      'Celestia là nơi bạn đến. Celes là người bạn trò chuyện cùng — một người bạn để lắng nghe, một người thầy để soi sáng, và một người đồng hành ở những ngã rẽ.',
    khongLamEyebrow: 'ĐIỀU CELES KHÔNG LÀM',
    khongLam: [
      {
        ten: 'Không phán số phận',
        mo: 'Celes nói về xu hướng của một giai đoạn, không khẳng định điều gì chắc chắn sẽ xảy ra. Bạn vẫn là người quyết định.',
      },
      {
        ten: 'Không doạ để bán',
        mo: 'Không có "hạn nặng", không có "hoá giải gấp". Nếu một giai đoạn khó, Celes nói rõ khó ở chỗ nào và có thể làm gì.',
      },
      {
        ten: 'Không nói vo',
        mo: 'Mỗi nhận định đều mở ra được để xem nó dựa trên đâu. Không mở ra được thì Celes không nói.',
      },
    ],
    cuoiTieuDe: 'Bắt đầu từ chính bạn',
    cuoiMo: 'Chỉ cần ngày và giờ sinh. Bạn nhận góc nhìn đầu tiên ngay, rồi mới cần quyết định có giữ lại hay không.',
  },

  onboarding: {
    buoc: 'Bước',
    yDinhTieuDe: 'Điều gì đưa bạn đến đây hôm nay?',
    yDinhMo: 'Không cần chọn thật chính xác — Celes chỉ cần biết bạn đang nghĩ nhiều về điều gì.',
    yDinh: {
      banThan: 'Bản thân',
      congViec: 'Công việc',
      tinhCam: 'Tình cảm',
      quyetDinh: 'Một quyết định',
    },
    yDinhMoTa: {
      banThan: 'Tôi muốn hiểu mình rõ hơn',
      congViec: 'Công việc đang khiến tôi phân vân',
      tinhCam: 'Một mối quan hệ đang cần nhìn lại',
      quyetDinh: 'Tôi đang đứng trước một ngã rẽ',
    },

    ngayTieuDe: 'Bạn sinh ngày nào?',
    ngayMo: 'Để Celes hiểu bạn rõ hơn, hãy bắt đầu từ thời điểm bạn sinh ra. Nhập theo dương lịch, đúng như trên giấy khai sinh.',
    ngayNhan: 'Ngày sinh (dương lịch)',

    gioTieuDe: 'Bạn sinh khoảng mấy giờ?',
    gioMo: 'Giờ sinh quyết định phần lớn những gì Celes đọc được. Nhớ tương đối cũng dùng được.',
    gioNhan: 'Giờ',
    phutNhan: 'Phút',
    gioKhop: 'Khớp với giờ {chi}.',
    khongNhoGio: 'Tôi không nhớ giờ sinh',
    khongNhoGioY1:
      'Không có giờ sinh thì điểm xuất phát của cả bản đồ không xác định được. Celes sẽ không đoán bừa một giờ rồi đưa cho bạn kết quả trông như thật.',
    khongNhoGioY2:
      'Chỗ thường tìm được: giấy chứng sinh của bệnh viện, sổ hộ tịch bản gốc, hoặc hỏi lại người nhà. Nếu chỉ nhớ áng chừng buổi, cứ chọn giờ gần nhất rồi thử vài giờ lân cận để so.',

    xacNhanTieuDe: 'Vậy là đủ rồi',
    xacNhanMo: 'Còn một thông tin ảnh hưởng tới cách tính, và một chỗ để bạn dễ nhận ra bản đồ này về sau.',
    gioiTinh: 'Giới tính',
    gioiTinhY: 'Cách tính truyền thống chia theo hai nhóm để xác định chiều đi của các giai đoạn.',
    nam: 'Nam',
    nu: 'Nữ',
    tenGoi: 'Tên gọi (không bắt buộc)',
    tenGoiY: 'Chỉ dùng để bạn phân biệt khi lưu nhiều người.',
    tenGoiVD: 'VD: Mình, Mẹ, Anh Nam',
    xong: 'Xem điều Celes thấy',
  },

  quickRead: {
    tieuDeChinh: 'Có một điều khá rõ ở bạn…',
    tieuDeCoTen: 'Có một điều khá rõ ở {ten}…',
    moTa: 'Celes bắt đầu từ điểm nổi lên rõ nhất, rồi mới tới hai điều đáng để ý tiếp.',
    viSao: 'Muốn biết vì sao không?',
    viSaoDong: 'Thu gọn',
    viSaoTieuDe: 'Celes dựa vào đâu',
    viSaoMo: 'Điều trên dựa vào những chi tiết sau trong bản đồ của bạn:',
    giuLai: 'Giữ lại những điều này',
    daGiu: 'Đã giữ lại',
    doiThongTin: 'Đổi thông tin',

    sauTieuDe: 'Muốn hiểu sâu hơn?',
    sauMo: 'Celes có thể nối các phần rời thành một bức tranh liền mạch, hoặc đi thẳng vào điều bạn đang băn khoăn.',
    docDai: 'Cùng Celes nhìn kỹ hơn',
    docLai: 'Đọc lại',
    dangDoc: 'Celes đang ghép các phần trong bản đồ của bạn thành một bức tranh dễ hiểu…',
    hoiThang: 'Hỏi Celes',
    khamPhaSau: 'Khám phá sâu hơn',
    theoChuDeTieuDe: 'Đi thẳng vào điều bạn đang băn khoăn',
    theoChuDeMo: 'Công việc, tiền bạc, tình cảm, gia đình, sức khoẻ — hoặc hỏi Celes một câu của riêng bạn.',

    banDoTieuDe: 'Bản đồ đầy đủ',
    banDoPhu: 'Lá số Tử Vi',
    banDoMo: 'Toàn bộ 12 cung và các sao — dành cho lúc bạn muốn đối chiếu chi tiết.',
    banDoMoNut: 'Xem bản đồ đầy đủ',
    banDoDongNut: 'Thu gọn',
    thangXem: 'Tháng đang xem',
    loiLuu: 'Chưa giữ lại được — thử lại sau một chút.',
    loiDocDai: 'Phần diễn giải đang tạm gián đoạn. Bản đồ của bạn vẫn được giữ nguyên — thử lại sau một chút.',
    ngaySai: 'Ngày sinh chưa đúng',
    ngaySaiMo: 'Celes chưa đọc được ngày bạn vừa nhập. Kiểm tra lại giúp nhé.',
    nhapLai: 'Nhập lại',
  },

  auth: {
    tieuDe: 'Chào mừng bạn quay lại.',
    moTa: 'Những điều bạn đã khám phá cùng Celes vẫn ở đây.',
    tieuDeDangKy: 'Bắt đầu cùng Celes',
    moTaDangKy: 'Tạo một chỗ để giữ lại những gì bạn đã khám phá.',
    tiepTucVoi: 'Tiếp tục với {ten}',
    hoacEmail: 'hoặc dùng email',
    email: 'Email',
    matKhau: 'Mật khẩu',
    tenHienThi: 'Tên hiển thị',
    tenHienThiVD: 'Tên bạn muốn Celes gọi',
    nutDangNhap: 'Tiếp tục với Celes',
    nutDangKy: 'Tạo tài khoản',
    dangXuLy: 'Đang xử lý…',
    quenMatKhau: 'Quên mật khẩu?',
    chuaCoTaiKhoan: 'Mới dùng Celestia? Tạo tài khoản miễn phí.',
    daCoTaiKhoan: 'Đã có tài khoản? Đăng nhập',
    panelEyebrow: 'BẠN SẼ GIỮ LẠI ĐƯỢC',
    panelTieuDe: 'Những điều bạn đã khám phá cùng Celes, ở một nơi.',
    panelY: [
      'Bản đồ của bạn và người thân, không phải nhập lại mỗi lần.',
      'Xem lại những gì đã đọc, trên máy nào cũng thấy.',
      'Tiếp tục cuộc trò chuyện đang dở với Celes.',
    ],
    canEmailTruoc: 'Điền email của bạn ở trên trước đã nhé.',
    daGuiEmail: 'Đã gửi email đặt lại mật khẩu. Mở hộp thư và bấm liên kết trong đó.',
    loiGuiEmail: 'Chưa gửi được email đặt lại — thử lại sau một chút.',
    daTaoTaiKhoan:
      'Đã tạo tài khoản. Nếu hộp thư của bạn nhận được email xác nhận, hãy bấm liên kết trong đó trước khi đăng nhập.',
    chuaBat: 'Chưa bật đăng nhập',
    chuaBatMo: 'Tính năng tài khoản cần được cấu hình trước. Xem hướng dẫn trong tệp HUONG-DAN.md.',
  },

  home: {
    chao: 'Chào {ten}',
    chaoKhongTen: 'Điều đáng chú ý lúc này',
    dangNoiBat: 'Điều đang nổi bật',
    giaiDoan: 'Giai đoạn bạn đang đi qua',
    doTuoi: '{tu}–{den} tuổi',
    diTiep: 'Đi tiếp từ đây',
    chuaCoTieuDe: 'Chưa có bản đồ nào được lưu',
    chuaCoMo: 'Lập bản đồ đầu tiên để Celes có thứ để đọc cùng bạn mỗi ngày.',
  },

  chan: {
    mienTru:
      'Celes đưa ra góc nhìn để bạn cân nhắc, không phải phán quyết về tương lai — và không thay thế tư vấn y tế, tài chính hay pháp lý.',
  },
};

/** Ràng buộc cấu trúc khoá cho các bản dịch khác — giá trị vẫn là string tự do */
export type TuDien = typeof vi;
