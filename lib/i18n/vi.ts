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
    banDo: 'Khám phá bản đồ',
    hanhTrinh: 'Hành trình',
    hoiCeles: 'Hỏi Celes',
    ketNoi: 'Kết nối',
    nguoiCuaToi: 'Lá số',
    taiKhoan: 'Tài khoản',
    quanTri: 'Quản trị',
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
    moBucTranhTieuDe: 'Muốn hiểu toàn bộ bức tranh của bạn?',
    moBucTranhMo:
      'Đăng nhập để Celes ghi nhớ lá số này và mở các phần chuyên sâu về tính cách, công việc, tài lộc, tình cảm, gia đình, quan hệ và những giai đoạn bạn đang đi qua.',
    moLuanGiaiDayDu: 'Mở luận giải đầy đủ',
    chuMoBucTranh: 'Miễn phí để bắt đầu · Lá số của bạn sẽ được giữ lại cho lần sau.',
    moiLaPhanDau: 'Đây mới chỉ là phần đầu',
    giuHanhTrinh: 'Giữ lại hành trình của tôi',
    chiXemTongQuan: 'Tôi chỉ muốn xem tổng quan',
    dangChoTieuDe: 'Những gì mở ra sau đó',
    dangChoMo: 'Bốn phần dưới đây đọc tiếp từ chính bản đồ bạn vừa lập. Tạo tài khoản miễn phí là mở được hết.',
    khoa: 'Cần tài khoản',
    khoaBanDo: 'Toàn bộ 12 cung, các sao và độ sáng.',
    khoaKhamPha: 'Từng chủ đề một bài đọc riêng: công việc, tiền bạc, tình cảm, gia đình.',
    khoaHoi: 'Hỏi thẳng Celes điều bạn đang vướng, trả lời dựa trên bản đồ này.',
    khoaHanhTrinh: 'Quãng bạn đang đi qua, năm nay, và tháng này.',
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
    mangTheo: 'Câu để mang theo hôm nay',
    doTuoi: '{tu}–{den} tuổi',
    diTiep: 'Đi tiếp từ đây',
    composerNhan: 'Hôm nay bạn đang nghĩ gì?',
    composerGoiY: 'Viết vài dòng — Celes bắt đầu từ chính chỗ bạn đang vướng.',
    composerGui: 'Nói với Celes',
    chuDeTieuDe: 'Hoặc bắt đầu từ một điều quen thuộc',
    chuDeCongViec: 'Công việc',
    chuDeTinhCam: 'Tình cảm',
    chuDeBanThan: 'Bản thân',
    chuDeQuyetDinh: 'Một quyết định',
    quyetDinhCauHoi: 'Tôi đang đứng trước một quyết định và chưa biết nên nhìn nó từ đâu.',
    xemHanhTrinh: 'Xem cả hành trình',
    chuaCoTieuDe: 'Chưa có bản đồ nào được lưu',
    chuaCoMo: 'Lập bản đồ đầu tiên để Celes có thứ để đọc cùng bạn mỗi ngày.',
  },

  hanhTrinh: {
    eyebrow: 'HÀNH TRÌNH CỦA BẠN',
    dangMo: 'Đang mở ra',
    dangCang: 'Đang căng',
    canCho: 'Cần chờ',
    tieuDe: 'Nhìn lại những giai đoạn đang định hình bạn',
    moTa: 'Có những thay đổi diễn ra trong nhiều năm, có chuyện chỉ nổi lên trong một năm, và có tháng chỉ cần chú ý đúng một điều. Celes đặt các lớp đó cạnh nhau để bạn thấy điều gì là xu hướng dài, điều gì chỉ là một nhịp ngắn.',
    xemCua: 'Đang xem hành trình của',
    giaiDoanTieuDe: 'Những quãng dài',
    giaiDoanMo: 'Nhìn vào những giai đoạn kéo dài nhiều năm để thấy trọng tâm cuộc sống đang dịch chuyển về đâu.',
    namTieuDe: 'Từng năm',
    namMo: 'Mỗi năm làm nổi lên một vài chủ đề khác nhau. Chọn năm bạn muốn xem để biết điều gì đáng chú ý và vì sao.',
    thangTieuDe: 'Từng tháng trong năm {nam}',
    thangMo: 'Đi sâu vào nhịp ngắn hơn: cơ hội, điểm dễ căng và những thay đổi chỉ xuất hiện trong một khoảng thời gian ngắn. Tháng ở đây tính theo cách chia của lá số nên có thể lệch lịch treo tường vài ngày.',
    dangDienRa: 'Đang ở đây',
    veHienTai: 'Về hiện tại',
    lui: 'Lùi',
    toi: 'Tới',
    daChon: 'Đang chọn',
    hoiVe: 'Hỏi Celes về quãng này',
    moBanDo: 'Mở bản đồ ở thời điểm này',
    ngayTieuDe: 'Còn từng ngày thì sao?',
    ngayMo: 'Lớp ngày cần một quy tắc tính riêng mà Celestia chưa đối chiếu xong với bản mẫu, nên tạm chưa mở. Ba lớp trên đã đủ để thấy nhịp của một giai đoạn.',
    chuaCoTieuDe: 'Chưa có bản đồ nào được lưu',
    chuaCoMo: 'Hành trình đọc ra từ bản đồ của bạn, nên cần lập bản đồ trước đã.',
    lapBanDo: 'Lập bản đồ của tôi',
  },

  banDo: {
    cheDoDeHieu: 'Dễ hiểu',
    cheDoDeHieuMo: 'Chỉ những sao chính và giai đoạn đang chạy — đủ để nhìn ra hình dạng chung.',
    cheDoCoDien: 'Cổ điển',
    cheDoCoDienMo: 'Lá số như cách vẫn được lập: đủ sao, độ sáng, Tứ Hóa, Tuần Triệt.',
    cheDoChuyenSau: 'Chuyên sâu',
    cheDoChuyenSauMo: 'Thêm lưu tinh theo năm xem, và mở khoá từng lớp hiển thị để tự bật tắt.',
    namXem: 'Năm xem',
    namTruoc: 'Năm trước',
    namSau: 'Năm sau',
    lopHienThi: 'Hiển thị',
    xuatAnh: 'Xuất ảnh',
    inRa: 'In',
    thang: 'Tháng {thang}',
  },

  cong: {
    eyebrow: 'ĐÂY MỚI CHỈ LÀ PHẦN ĐẦU',
    cta: 'Tạo tài khoản miễn phí',
    chu: 'Miễn phí, không cần thẻ. Bản đồ bạn vừa lập sẽ được giữ lại.',
    loiIch: {
      save_chart: {
        tieuDe: 'Giữ lại bản đồ này',
        moTa: 'Tạo tài khoản miễn phí để Celes nhớ bản đồ của bạn, và lần sau mở lên là có ngay — trên máy nào cũng vậy.',
      },
      full_chart: {
        tieuDe: 'Xem toàn bộ 12 cung',
        moTa: 'Bản đầy đủ có tất cả các cung, các sao và độ sáng. Tạo tài khoản miễn phí để mở, và để bản đồ được lưu lại.',
      },
      ask_celes: {
        tieuDe: 'Tiếp tục cuộc trò chuyện với Celes',
        moTa: 'Tạo tài khoản miễn phí để Celes nhớ bản đồ của bạn và giữ lại cuộc trò chuyện này cho lần sau.',
      },
      deep_read: {
        tieuDe: 'Đi sâu vào điều bạn đang bận tâm',
        moTa: 'Mỗi chủ đề là một bài đọc riêng, dựa trên chính bản đồ của bạn. Tạo tài khoản miễn phí để mở và lưu lại.',
      },
      connection: {
        tieuDe: 'Xem hai người vận hành cùng nhau thế nào',
        moTa: 'Cần lưu được cả hai người thì mới so được. Tạo tài khoản miễn phí để bắt đầu.',
      },
      journey: {
        tieuDe: 'Xem bạn đang ở đâu trong nhịp của mình',
        moTa: 'Hành trình đọc ra từ bản đồ đã lưu: quãng dài bạn đang đi qua, năm nay nghiêng về đâu, tháng này nổi lên chuyện gì. Tạo tài khoản miễn phí để mở.',
      },
    },
  },

  luanSau: {
    eyebrow: 'BỨC TRANH ĐẦY ĐỦ',
    tieuDe: 'Còn đây là những gì Celes đọc kỹ hơn',
    moTa: 'Mỗi phần mở đầu bằng điều đáng chú ý nhất, rồi mới tới chi tiết. Chỗ nào bạn thấy chưa thuyết phục, mở phần căn cứ ngay dưới để xem Celes dựa vào đâu.',
    hoiVePhanNay: 'Hỏi Celes về phần này',
    // Chữ cho bốn chặng. "Đọc từ" là chỗ DUY NHẤT tên cung được hiện ở mặt trước.
    phan: 'phần',
    noiBat: 'Đáng chú ý nhất',
    docTu: 'Đọc từ:',
    cung: 'cùng',
    soiQua: 'soi qua',
    doanKhau: 'BA PHẦN NÀY NÓI CÙNG ĐIỀU GÌ',
    theoNoiBat: 'Đọc theo điều đang khiến bạn nghĩ nhiều ⇅',
    theoChang: 'Quay lại bốn chặng ⇅',
    // Chỉ dẫn mở chặng. Bốn tiêu đề đóng mà không có dấu hiệu bấm được thì
    // người lần đầu vào đọc tưởng ba chặng sau chưa có nội dung.
    moChang: 'Xem 3 phần',
    dongChang: 'Thu lại',
    dangDoc: 'Celes đang đọc lá số của bạn',
    dangDocMo:
      'Mười hai phần được đọc trong một lượt để chúng biết nhau, nên phần này tới chậm hơn các phần trên. Thường mất khoảng mười đến hai mươi giây.',
  },

  giuLaSo: {
    tieuDeDaDangNhap: 'Bạn muốn giữ lại lá số này trước khi rời đi?',
    moTaDaDangNhap:
      'Nếu lưu lại, Celes sẽ nhớ lá số này để bạn tiếp tục xem Hành trình, Hỏi Celes hoặc quay lại đúng phần đang đọc mà không cần nhập lại.',
    luu: 'Giữ lại lá số này',
    roiDi: 'Rời đi không lưu',
    oLai: 'Ở lại',
    tieuDeKhach: 'Muốn giữ lại lá số này cho lần sau?',
    moTaKhach:
      'Lá số này đang chỉ nằm trên máy bạn. Đăng nhập một lần là Celes nhớ được, và lần sau mở lên đã có sẵn.',
    dangNhapDeLuu: 'Đăng nhập để lưu',
    dangLuu: 'Đang lưu…',
  },

  danhSach: {
    eyebrow: 'DANH SÁCH LÁ SỐ',
    tieuDe: 'Những lá số bạn đang giữ',
    laSoCuaToi: 'Lá số của tôi',
    datLamCuaToi: 'Đặt làm lá số của tôi',
    dangDat: 'Đang đặt…',
    themLaSo: '+ Thêm lá số',
    xemLaSo: 'Xem lá số',
    sua: 'Sửa',
    xoa: 'Xoá',
    xacNhanXoa: 'Xoá lá số của {ten}? Thao tác này không hoàn lại được.',
    khongXoaMacDinh:
      'Đây đang là "Lá số của tôi". Chọn một lá số khác làm mặc định trước khi xoá lá số này.',
    trong: 'Chưa có lá số nào được giữ. Thêm lá số đầu tiên để Celes có thứ để đọc cùng bạn.',
    luuTheoTaiKhoan: 'Đang lưu theo tài khoản của bạn — mở ở máy nào cũng thấy.',
    luuTheoTrinhDuyet:
      'Đang lưu ngay trên trình duyệt này. Đăng nhập để giữ lại và dùng được trên mọi thiết bị.',
    chuyenLenTaiKhoan: 'Chuyển những lá số đang lưu ở trình duyệt này lên tài khoản',
    khongCoGiDeChuyen: 'Không có lá số nào đang lưu ở trình duyệt này để chuyển.',
    luuLai: 'Lưu lại',
    huy: 'Huỷ',
    khongTen: 'Không tên',
    gio: '{gio} giờ',
    nam: 'Nam',
    nu: 'Nữ',
    loiLuu: 'Chưa lưu được — thử lại sau một chút.',
    loiDat: 'Chưa đặt được — thử lại sau một chút.',
    loiXoa: 'Chưa xoá được — thử lại sau một chút.',
    loiChuyen: 'Chưa chuyển được — thử lại sau một chút.',
    khongTinhDuoc: 'Không tính được lá số',
    xemLaSoKhac: 'Xem một lá số khác',
    taoLaSoKhac: 'Tạo lá số khác',
  },

  hoiCeles: {
    eyebrow: 'HỎI CELES',
    tieuDe: 'Bạn đang băn khoăn điều gì?',
    dangNoiVe: 'Đang nói về',
    nguoiVuaNhap: '— Lá số vừa nhập —',
    hoiVeNguoiKhac: 'Hỏi về một lá số khác',
    hoiVeNguoiNay: 'Hỏi về lá số này',
    canBietAi: 'Celes cần biết đang nói về lá số nào',
    canBietAiMo:
      'Chọn một lá số đã lưu, hoặc điền ngày giờ sinh ở bên trái. Không có lá số thì câu trả lời chỉ còn là lời khuyên chung chung.',
    oNhap: 'Nói với Celes…',
    gui: 'Gửi',
    dangTraLoi: 'Celes đang đọc bản đồ của bạn…',
    loi: 'Celes chưa trả lời được lúc này. Câu hỏi của bạn vẫn được giữ — thử lại sau một chút.',
    xoaHoiThoai: 'Xoá hội thoại',
    canCuMo: 'Muốn biết vì sao không?',
    canCuCachNoi: 'Cách Celes nối dữ kiện',
    canCuLuongNguoc: 'Điểm kéo ngược lại',
    canCuMucChac: 'Mức chắc chắn',
    chacManh: 'khá rõ — nhiều nguồn độc lập cùng hướng',
    chacVua: 'có xu hướng — hai nguồn cùng hướng',
    chacYeu: 'mới là một khả năng đáng để ý',
    chacTraiChieu: 'còn trái chiều — có hai lực cùng tồn tại',
    chacChuaDu: 'chưa đủ căn cứ từ nguồn tài liệu',
    canCuDong: 'Thu gọn căn cứ',
    canCuLaSo: 'Lá số của bạn',
    canCuNguon: 'Đoạn tri thức đã dùng',
    canCuPhuongPhap: 'Bộ quy tắc an sao đã dùng',
    canCuPhuongPhapMo: 'Đây là phiên bản luật tính lá số, không phải tên tài liệu trong kho.',
    canCuChuDe: 'Chủ đề đọc được',
    canCuKhongNguon:
      'Chưa có nguồn tài liệu nào trong kho khớp với câu hỏi này, nên phần nhận định chuyên môn đã được thu hẹp lại.',
    mienTru:
      'Celes đưa ra góc nhìn để bạn cân nhắc, không phải phán quyết — và không thay thế tư vấn y tế, tài chính hay pháp lý.',
    goiYTieuDe: 'Chưa biết bắt đầu từ đâu?',
    goiY: [
      'Điểm mạnh nào của tôi đang bị bỏ quên?',
      'Tôi dễ mắc kẹt ở đâu trong công việc?',
      'Giai đoạn này tôi nên ưu tiên điều gì?',
      'Tình cảm hiện tại đang cho tôi bài học gì?',
      'Năm nay điều gì đáng chú ý nhất?',
      'Giải thích cung Mệnh của tôi theo cách dễ hiểu.',
      'Vì sao Celes nói tôi đang ở một giai đoạn cần thay đổi?',
      'Cho tôi xem căn cứ Tử Vi phía sau nhận định này.',
    ],
    khamPhaNhanhTieuDe: 'Khám phá nhanh',
    khamPhaNhanh: [
      { nhan: 'Bản thân', cauHoi: 'Điều gì đang nổi bật nhất ở bản thân tôi lúc này?' },
      { nhan: 'Công việc', cauHoi: 'Công việc hiện tại có hợp với cách tôi vận hành không?' },
      { nhan: 'Tình cảm', cauHoi: 'Tôi thường lặp lại điều gì trong các mối quan hệ?' },
      { nhan: 'Tài chính', cauHoi: 'Tôi đang mất cân bằng ở đâu về tiền bạc?' },
      { nhan: 'Gia đình', cauHoi: 'Tôi đang gánh vai trò gì trong gia đình mà không nhận ra?' },
      { nhan: 'Giai đoạn hiện tại', cauHoi: 'Giai đoạn này đang muốn nói gì với tôi?' },
    ],
    tuXemTieuDe: 'Muốn tự xem bản đồ?',
    tuXemMo:
      'Mở toàn bộ 12 cung, các sao và độ sáng — dành cho lúc bạn muốn tự đối chiếu thay vì hỏi.',
    tuXemNut: 'Khám phá bản đồ',
  },

  chiTietHan: {
    xemChiTiet: 'Xem chi tiết',
    xemChiTietMo:
      'Không chỉ cho biết vận đang đi qua cung nào. Celes ghép sao, các cung liên hệ và những lớp vận đang cùng hoạt động để giải thích bức tranh đầy đủ hơn.',
    quayLai: 'Hành trình',
    tongQuan: 'Tổng quan',
    viSao: 'Vì sao Celes nói vậy?',
    viSaoDong: 'Thu gọn căn cứ',
    theoLinhVuc: 'Luận theo lĩnh vực',
    ctaTieuDe: 'Có điều gì trong giai đoạn này khiến bạn băn khoăn?',
    ctaNut: 'Hỏi Celes về giai đoạn này',
    chuaCoLaSo: 'Chưa có lá số nào để luận',
    chuaCoLaSoMo: 'Chọn hoặc lập một lá số trước, rồi quay lại phần này.',
  },

  cachHoatDong: {
    eyebrow: 'CÁCH CELES ĐỒNG HÀNH CÙNG BẠN',
    tieuDe: 'Bắt đầu từ điều bạn đang băn khoăn',
    intro:
      'Bạn không cần biết Tử Vi, cũng không cần chuẩn bị một câu hỏi thật “đúng”. Chỉ cần bắt đầu từ điều đang khiến bạn nghĩ nhiều. Phần còn lại, Celes sẽ cùng bạn gỡ từng lớp.',
    buoc: [
      {
        tieuDe: 'Kể Celes biết điều bạn đang nghĩ',
        noiDung:
          'Chọn một chủ đề hoặc nói thẳng điều đang khiến bạn phân vân. Công việc, tình cảm, một quyết định, hay đơn giản là muốn hiểu mình hơn.',
      },
      {
        tieuDe: 'Celes nhìn vào bức tranh của riêng bạn',
        noiDung:
          'Celes đọc lá số và giai đoạn bạn đang đi qua, rồi nối các chi tiết liên quan với nhau để tìm ra điều thực sự đáng chú ý.',
      },
      {
        tieuDe: 'Bạn nhận một góc nhìn để tự quyết định',
        noiDung:
          'Celes không quyết thay bạn. Mỗi nhận định đều có phần “Vì sao?” để bạn xem căn cứ, cân nhắc và chọn bước tiếp theo theo cách của mình.',
      },
    ],
    tinEyebrow: 'VÌ SAO TIN ĐƯỢC',
    tinTieuDe: 'Ba điều Celes không làm',
    tin: [
      {
        ten: 'Không nói vo',
        mo: 'Điều Celes dùng để đọc lá số được tính trước và có thể đối chiếu lại.',
      },
      {
        ten: 'Không giấu căn cứ',
        mo: 'Bạn có thể mở “Vì sao?” để xem Celes đang dựa vào cung, sao, mối liên hệ và giai đoạn nào.',
      },
      {
        ten: 'Không phán thay bạn',
        mo: 'Celes nói về xu hướng và điều nên lưu ý, không khẳng định tương lai chắc chắn sẽ xảy ra.',
      },
    ],
    phuongPhapEyebrow: 'PHƯƠNG PHÁP TÍNH',
    phuongPhapTieuDe: 'Phần dành cho ai muốn kiểm chứng',
    phuongPhapMo:
      'Phần dưới đây là lớp kỹ thuật. Không cần đọc để dùng Celestia, nhưng nó luôn ở đây cho ai muốn đối chiếu.',
    lop: [
      {
        ten: 'Phần được tính cố định',
        mo: 'Chuyển ngày dương sang âm lịch, xác định Mệnh, Thân, Cục, rồi an toàn bộ sao lên 12 cung. Toàn bộ bước này chạy bằng công thức. Cùng một ngày giờ sinh luôn ra cùng một lá số, hôm nay hay năm sau cũng vậy.',
      },
      {
        ten: 'Phần được diễn giải',
        mo: 'Các góc nhìn ngắn, bảng luận giải theo lĩnh vực và bài luận hạn đều dựng bằng công thức từ chính dữ liệu trên, nên hiện ra tức thì và lần nào cũng như nhau. Chỉ bài đọc dài theo chủ đề và phần trò chuyện mới được viết lại thành câu chuyện liền mạch.',
      },
      {
        ten: 'Phần bạn kiểm chứng được',
        mo: 'Mỗi nhận định đều có nút mở ra xem nó dựa trên cung nào, sao nào, độ sáng ra sao, và bộ quy tắc phiên bản nào đã tính ra nó.',
      },
    ],
    hoiEyebrow: 'CÂU HỎI THƯỜNG GẶP',
    hoiTieuDe: 'Những điều nên biết trước',
    hoi: [
      {
        hoi: 'Celestia tính theo quy tắc nào?',
        dap: 'Celestia dùng một bộ quy tắc có tên và có phiên bản, thay vì gắn nhãn một trường phái chung chung. Mỗi bài luận đều ghi kèm phiên bản đã dùng, nên đọc lại sau này vẫn biết kết quả sinh ra từ đâu. Chi tiết bộ quy tắc nằm ở phần căn cứ của từng bài.',
      },
      {
        hoi: 'Vì sao lại cần giờ sinh?',
        dap: 'Giờ sinh quyết định cung Mệnh nằm ở đâu, mà gần như mọi thứ còn lại đều đọc từ đó. Lệch một canh giờ là lá số khác hẳn. Nếu bạn không chắc giờ sinh, Celestia sẽ nói rõ điều đó thay vì lặng lẽ đưa ra một kết quả có thể sai.',
      },
      {
        hoi: 'Celes có tự nghĩ ra dữ kiện không?',
        dap: 'Không. Mọi dữ kiện lá số và giai đoạn đều do phần tính toán cung cấp; phần diễn giải chỉ được dùng lại đúng những dữ kiện đó. Khi có tài liệu trong kho tri thức, phần trích dẫn ghi rõ lấy từ tài liệu nào.',
      },
      {
        hoi: 'Celestia có đoán trước tương lai không?',
        dap: 'Không. Celestia mô tả xu hướng của một giai đoạn, không khẳng định sự việc sẽ xảy ra. Bạn nên đọc nó như một góc nhìn thêm trước khi tự quyết định, không phải như một lời phán.',
      },
    ],
    cuoiEyebrow: 'THỬ XEM SAO',
    cuoiTieuDe: 'Đọc thì lâu, xem thì nhanh hơn',
    cuoiMo: 'Lập một lá số và tự mở phần căn cứ — nhanh hơn là đọc hết trang này.',
    cuoiNut: 'Lập lá số miễn phí',
  },

  ungHo: {
    ten: 'Ủng hộ Celes',
    moiLyCaPhe: 'Mời Celes một ly cà phê',
    tiepTucCung: 'Tiếp tục cùng Celes',

    conCau: 'Hôm nay bạn còn {con}/{tong} câu miễn phí.',
    hetCau: 'Bạn đã dùng hết {tong} câu miễn phí hôm nay.',

    cong: {
      ask_quota: {
        tieuDe: 'Muốn tiếp tục câu chuyện này?',
        moTa: 'Bạn đã dùng {tong} câu miễn phí hôm nay. Nếu những góc nhìn của Celes đang hữu ích, bạn có thể ủng hộ một khoản tuỳ ý để tiếp tục trong 24 giờ.',
        cta: 'Ủng hộ & tiếp tục',
      },
      deep_map: {
        tieuDe: 'Muốn hiểu toàn bộ bức tranh của bạn?',
        moTa: 'Phần tổng quan là miễn phí. Một lời ủng hộ sẽ mở các phần chuyên sâu về tính cách, công việc, tài lộc, tình cảm, gia đình, quan hệ, vận hạn và hướng phát triển.',
        cta: 'Mở luận giải đầy đủ',
      },
      journey_detail: {
        tieuDe: 'Muốn nhìn kỹ giai đoạn này?',
        moTa: 'Celes sẽ đọc sâu hơn theo các lớp vận, sao lưu, tam phương tứ chính và những yếu tố đang tác động trong thời điểm bạn chọn.',
        cta: 'Mở luận giải giai đoạn này',
      },
      connection_full: {
        tieuDe: 'Muốn hiểu mối quan hệ này sâu hơn?',
        moTa: 'Mở đầy đủ cách hai người giao tiếp, nhu cầu tình cảm, điểm dễ va chạm, cách hỗ trợ nhau và giai đoạn đang ảnh hưởng tới mối quan hệ.',
        cta: 'Mở phân tích đầy đủ',
      },
      long_report: {
        tieuDe: 'Muốn một bản đọc dài, viết liền mạch?',
        moTa: 'Báo cáo chuyên sâu là bản đọc dài nhất Celes viết được cho một lá số. Nó nằm trong phần đã mở khi bạn còn lượt báo cáo.',
        cta: 'Tạo báo cáo chuyên sâu',
      },
      profile_limit: {
        tieuDe: 'Muốn giữ thêm lá số?',
        moTa: 'Tài khoản miễn phí giữ được {soHoSoFree} lá số. Một lời ủng hộ nâng lên {soHoSoPlus} lá số trong thời gian Supporter còn hiệu lực.',
        cta: 'Ủng hộ để thêm lá số',
      },
      voluntary: {
        tieuDe: 'Nếu Celes đang hữu ích với bạn',
        moTa: 'Một lời ủng hộ giúp sản phẩm tiếp tục được cải thiện, và mở thêm chiều sâu cho chính trải nghiệm của bạn.',
        cta: 'Ủng hộ Celes',
      },
    },

    loiIch: [
      'Tiếp tục Hỏi Celes.',
      'Mở luận giải sâu hơn.',
      'Xem Hành trình chi tiết.',
      'Giữ nguyên cuộc trò chuyện đang dở.',
    ],
    quayLaiNgayMai: 'Quay lại vào ngày mai',
    khongPhuThuocSoTien: 'Bạn tự chọn số tiền. Quyền mở không phụ thuộc số tiền bạn ủng hộ.',

    soTienTieuDe: 'Ủng hộ Celes',
    soTienMoTa: 'Một lời ủng hộ giúp Celes tiếp tục đồng hành và mở thêm chiều sâu cho trải nghiệm của bạn.',
    soKhac: 'Số khác',
    nhapSoTien: 'Nhập số tiền',
    banNhanDuoc: 'Bạn nhận được:',
    nhan: [
      'Quyền Supporter trong 24 giờ',
      'Thêm lượt Hỏi Celes',
      'Mở luận giải đầy đủ, Hành trình chi tiết và Kết nối',
      'Một báo cáo chuyên sâu nếu còn lượt',
    ],
    tiepTucThanhToan: 'Tiếp tục thanh toán',
    chuyenKhoanAnToan: 'Thanh toán qua chuyển khoản ngân hàng.',
    dangTao: 'Đang tạo phiên thanh toán…',
    loiTao: 'Chưa tạo được phiên thanh toán. Thử lại sau một chút.',
    dong: 'Đóng',

    quetMa: 'Quét mã bằng ứng dụng ngân hàng để hoàn tất.',
    moTrangThanhToan: 'Mở trang thanh toán',
    maQrThayThe: 'Mã QR thanh toán {soTien}',
    donHoTro: 'Đơn hỗ trợ',
    hetHanSau: 'Hết hạn sau',
    trangThai: {
      creating: 'Đang tạo phiên thanh toán…',
      pending: 'Đang chờ thanh toán… Tự động xác nhận khi tiền về.',
      paid_processing_entitlement: 'Đã nhận thanh toán. Celes đang mở quyền cho bạn…',
      success: 'Cảm ơn bạn đã đồng hành cùng Celes.',
      cancelled: 'Bạn đã huỷ thanh toán.',
      expired: 'Phiên thanh toán đã hết hạn.',
      failed: 'Chưa xác nhận được thanh toán này.',
    },
    tiepTucNoiDangDo: 'Tiếp tục nơi bạn đang dở',
    thuLai: 'Thử lại',
    taoMaMoi: 'Tạo mã mới',

    camOn: 'Cảm ơn bạn đã đồng hành cùng Celes.',
    camOnMo: 'Quyền Supporter đang hoạt động đến {luc} — còn {so} câu Hỏi Celes.',
    xemChiTietQuyen: 'Xem chi tiết',
    daHieu: 'Đã rõ',
    supporterDangHoatDong: 'Supporter đang hoạt động',
    denKhi: 'Đến {luc}',
    conCauHoi: 'Còn {so} câu Hỏi Celes',
    conBaoCao: '{so} báo cáo chuyên sâu',
    ungHoThem: 'Ủng hộ thêm',
    lichSuNgay: 'Ngày',
    lichSuSoTien: 'Số tiền',
    lichSuTrangThai: 'Trạng thái',
    lichSuNguon: 'Mở từ',
    trangThaiDon: {
      creating: 'Đang tạo',
      pending: 'Chờ thanh toán',
      paid: 'Đã nhận tiền',
      entitlement_granted: 'Thành công',
      cancelled: 'Đã huỷ',
      expired: 'Hết hạn',
      create_failed: 'Không tạo được',
      verification_failed: 'Cần đối soát',
    },
    nguonDon: {
      ask_quota: 'Hỏi Celes',
      deep_map: 'Luận giải đầy đủ',
      journey_detail: 'Hành trình chi tiết',
      connection_full: 'Kết nối',
      long_report: 'Báo cáo chuyên sâu',
      profile_limit: 'Thêm lá số',
      voluntary: 'Tự nguyện',
    },
    lichSuTieuDe: 'Những lần bạn đã ủng hộ',
    lichSuTrong: 'Chưa có lần ủng hộ nào.',
  },

  chan: {
    mienTru:
      'Celes đưa ra góc nhìn để bạn cân nhắc, không phải phán quyết về tương lai — và không thay thế tư vấn y tế, tài chính hay pháp lý.',
  },
};

/** Ràng buộc cấu trúc khoá cho các bản dịch khác — giá trị vẫn là string tự do */
export type TuDien = typeof vi;
