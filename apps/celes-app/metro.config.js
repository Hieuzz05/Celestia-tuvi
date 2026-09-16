// Cấu hình Metro cho app.
//
// Điểm quan trọng nhất ở đây: app KHÔNG sao chép engine an sao mà đọc thẳng
// `lib/tuvi/` của web ở gốc kho mã. Sao chép engine là con đường chắc chắn dẫn
// tới việc hai bên tính ra hai lá số khác nhau sau vài tháng sửa đổi, mà lỗi
// kiểu đó rất khó phát hiện: cả hai đều "chạy được", chỉ khác kết quả.
//
// Metro mặc định chỉ nhìn trong thư mục dự án, nên phải khai báo thư mục engine
// vào watchFolders thì nó mới theo dõi và bundle được các tệp nằm ngoài.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const escapeRegExp = require('escape-string-regexp');

const thuMucApp = __dirname;
const gocKhoMa = path.resolve(thuMucApp, '../..');

const config = getDefaultConfig(thuMucApp);

config.watchFolders = [path.resolve(gocKhoMa, 'lib')];

// Gốc kho mã là dự án Next.js với bộ phụ thuộc hoàn toàn khác. Nếu Metro lần
// ngược lên đó nó sẽ nhặt nhầm bản React của web và app hỏng theo kiểu rất khó
// đoán. Chặn thẳng thư mục ấy.
//
// Lưu ý: KHÔNG dùng disableHierarchicalLookup ở đây. Một số gói (expo-router)
// đặt phụ thuộc lồng trong node_modules của chính nó, tắt tra cứu phân cấp là
// Metro không tìm ra chúng nữa.
const nodeModulesGoc = path.resolve(gocKhoMa, 'node_modules');
config.resolver.blockList = [
  new RegExp(`^${escapeRegExp(nodeModulesGoc)}${escapeRegExp(path.sep)}.*$`),
];

module.exports = config;
