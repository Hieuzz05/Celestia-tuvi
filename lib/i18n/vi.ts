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
    eyebrow: 'HÀNH TRÌNH',
    tieuDe: 'Bạn đang ở đâu trong nhịp của mình',
    moTa: 'Cuộc đời trong lá số không chạy đều: có quãng dài đổi hướng, có năm nổi lên một chuyện, có tháng chỉ cần giữ nhịp. Đây là ba lớp đó xếp chồng lên nhau.',
    xemCua: 'Đang xem hành trình của',
    giaiDoanTieuDe: 'Những quãng dài',
    giaiDoanMo: 'Mỗi quãng khoảng mười năm và thường đổi trọng tâm khi sang quãng mới.',
    namTieuDe: 'Từng năm',
    namMo: 'Chọn một năm bất kỳ — đã qua hay chưa tới — để xem năm đó nghiêng về đâu.',
    thangTieuDe: 'Từng tháng trong năm {nam}',
    thangMo: 'Tháng ở đây tính theo cách chia của lá số, nên có thể lệch với lịch treo tường vài ngày.',
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

  chan: {
    mienTru:
      'Celes đưa ra góc nhìn để bạn cân nhắc, không phải phán quyết về tương lai — và không thay thế tư vấn y tế, tài chính hay pháp lý.',
  },
};

/** Ràng buộc cấu trúc khoá cho các bản dịch khác — giá trị vẫn là string tự do */
export type TuDien = typeof vi;
