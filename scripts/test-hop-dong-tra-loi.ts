/**
 * contract-khong-cham-nhanh-tinh-huong — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-hop-dong-tra-loi.ts
 *
 * Hợp đồng trả lời chọn NHỊP và KIỂU. Bài này khoá bốn điều nó không được phá
 * và một điều nó phải làm đúng:
 *
 *  1. `quyet-dinh` / `co-khong` KHÔNG BAO GIỜ nhận COMPACT — kể cả câu năm ký
 *     tự, kể cả khi mọi luật khác đẩy về COMPACT. Kẹp này ở trong MÃ, không
 *     phải lời dặn trong prompt.
 *  2. Phủ đủ 6 ý định × 6 chủ đề × 6 bậc độ dài × 4 mức an toàn (kể cả bỏ trống): không ném, không
 *     trả `undefined`. Thêm giá trị vào `YDinh`/`ChuDe` mà quên ở đây thì đỏ.
 *  3. Khối hợp đồng đứng TRƯỚC `THEO_Y_DINH` trong phần `user`. Model nghiêng
 *     về chỉ thị đọc sau cùng, nên luật cứng phải đứng cuối. Ai đảo thứ tự thì
 *     bài này đỏ.
 *  4. Nhãn máy (COMPACT / PRACTICAL / COMPANION …) không được lọt vào prompt —
 *     từ vựng của máy rơi vào bài đọc là người dùng nhìn thấy.
 *  5. Nối dây: `dungPromptCoCanCu` phát ĐÚNG khối của ô đang xét, và các ô đã
 *     có `THEO_Y_DINH` nói rồi thì KHÔNG phát thêm khối nào.
 *
 * Bài này KHÔNG kiểm model có nghe hay không — nó không gọi model. Chuyện đó
 * chỉ `scripts/eval-chat-quyet-dinh.ts` đo được, và nó tốn token.
 */
import { readFileSync } from 'node:fs';
import { dungPromptCoCanCu } from '../lib/rag/prompt-co-can-cu';
import { khoiHopDong, tinhHopDong, type Kieu, type Nhip } from '../lib/rag/hop-dong-tra-loi';
import type { ChuDe, YDinh } from '../lib/rag/planner';
import type { MucAnToan } from '../lib/rag/an-toan';
import type { GoiBangChung } from '../lib/rag/bang-chung';

let loi = 0;
const kiem = (ten: string, dung: boolean) => {
  console.log(`${dung ? '✓' : '✗'} ${ten}`);
  if (!dung) loi++;
};

const Y_DINH: YDinh[] = ['quyet-dinh', 'co-khong', 'thoi-diem', 'giai-thich', 'tra-cuu', 'mo-ta'];
const CHU_DE: ChuDe[] = ['su-nghiep', 'tai-chinh', 'tinh-cam', 'suc-khoe', 'gia-dao', 'tong-quan'];
const AN_TOAN: (MucAnToan | undefined)[] = [undefined, 'NORMAL', 'SENSITIVE', 'CRITICAL'];
const DO_DAI = [5, 60, 61, 219, 220, 900];

const NHIP: Nhip[] = ['COMPACT', 'MEDIUM', 'DEEP'];
const KIEU: Kieu[] = ['PRACTICAL', 'ANALYTICAL', 'COMPANION'];

/* ---- 1. quyet-dinh / co-khong không bao giờ bị nén ---- */

let nenSai = 0;
for (const yDinh of ['quyet-dinh', 'co-khong'] as YDinh[]) {
  for (const chuDe of CHU_DE) {
    for (const mucAnToan of AN_TOAN) {
      for (const doDaiCauHoi of DO_DAI) {
        if (tinhHopDong({ yDinh, chuDe, doDaiCauHoi, mucAnToan }).nhip === 'COMPACT') nenSai++;
      }
    }
  }
}
kiem('quyet-dinh/co-khong không bao giờ COMPACT (mọi tổ hợp)', nenSai === 0);
kiem(
  'câu 5 ký tự hỏi quyet-dinh vẫn không bị nén',
  tinhHopDong({ yDinh: 'quyet-dinh', chuDe: 'su-nghiep', doDaiCauHoi: 5 }).nhip !== 'COMPACT'
);

/* ---- 2. phủ đủ mọi tổ hợp, không ném, không undefined ---- */

let toHop = 0;
let hong = 0;
for (const yDinh of Y_DINH) {
  for (const chuDe of CHU_DE) {
    for (const mucAnToan of AN_TOAN) {
      for (const doDaiCauHoi of DO_DAI) {
        toHop++;
        try {
          const h = tinhHopDong({ yDinh, chuDe, doDaiCauHoi, mucAnToan });
          if (!NHIP.includes(h.nhip) || !KIEU.includes(h.kieu)) hong++;
          if (typeof khoiHopDong(h, yDinh) !== 'string') hong++;
        } catch {
          hong++;
        }
      }
    }
  }
}
kiem(`phủ ${toHop} tổ hợp, không ném và không giá trị lạ`, hong === 0 && toHop === 864);

/*
 * PRACTICAL CHƯA ĐƯỢC NỐI DÂY — khẳng định điều đó ra mặt.
 *
 * `KIEU` liệt ba giá trị nên vòng phủ ở trên trông như đã kiểm cả ba, nhưng
 * `tinhHopDong` chỉ trả ANALYTICAL hoặc COMPANION. Không nói rõ thì người đọc
 * sau tin PRACTICAL đang chạy. Nối nó (ví dụ su-nghiep/tai-chinh) là một
 * quyết định sản phẩm, không phải việc dọn mã — và phải soát câu chữ của nó
 * trong một prompt thật trước đã.
 */
const kieuThucTe = new Set<Kieu>();
for (const yDinh of Y_DINH) {
  for (const chuDe of CHU_DE) {
    for (const mucAnToan of AN_TOAN) {
      for (const doDaiCauHoi of DO_DAI) {
        kieuThucTe.add(tinhHopDong({ yDinh, chuDe, doDaiCauHoi, mucAnToan }).kieu);
      }
    }
  }
}
kiem(
  'PRACTICAL chưa nối dây (chỉ ANALYTICAL + COMPANION sinh ra được)',
  !kieuThucTe.has('PRACTICAL') && kieuThucTe.has('ANALYTICAL') && kieuThucTe.has('COMPANION')
);

/* ---- luật chủ đề và luật an toàn ---- */

kiem(
  'tinh-cam → COMPANION',
  tinhHopDong({ yDinh: 'mo-ta', chuDe: 'tinh-cam', doDaiCauHoi: 100 }).kieu === 'COMPANION'
);
kiem(
  'gia-dao → COMPANION',
  tinhHopDong({ yDinh: 'mo-ta', chuDe: 'gia-dao', doDaiCauHoi: 100 }).kieu === 'COMPANION'
);
kiem(
  'suc-khoe mức NORMAL KHÔNG tự sang COMPANION (doAnToan đã gác)',
  tinhHopDong({ yDinh: 'mo-ta', chuDe: 'suc-khoe', doDaiCauHoi: 100, mucAnToan: 'NORMAL' }).kieu !==
    'COMPANION'
);
kiem(
  'SENSITIVE cấm COMPACT',
  tinhHopDong({ yDinh: 'mo-ta', chuDe: 'su-nghiep', doDaiCauHoi: 5, mucAnToan: 'SENSITIVE' }).nhip !==
    'COMPACT'
);
kiem(
  'SENSITIVE ép COMPANION',
  tinhHopDong({ yDinh: 'mo-ta', chuDe: 'su-nghiep', doDaiCauHoi: 5, mucAnToan: 'SENSITIVE' }).kieu ===
    'COMPANION'
);

/* ---- 3+4+5. nối dây vào prompt ---- */

const goi = (yDinh: YDinh, chuDe: ChuDe): GoiBangChung => ({
  cauHoi: 'Năm nay cung Quan của tôi thế nào?',
  chuDe,
  yDinh,
  lopHan: [],
  cungLienQuan: ['Quan Lộc'],
  duKien: [],
  bangChung: [],
  phienBan: { engine: 'x', phuongPhap: 'x', planner: 'x', truyHoi: 'x', schemaOutput: 'x' },
});

const NHAN_MAY = /\b(COMPACT|MEDIUM|DEEP|PRACTICAL|ANALYTICAL|COMPANION)\b/;

const hdMoTa = tinhHopDong({ yDinh: 'mo-ta', chuDe: 'tinh-cam', doDaiCauHoi: 100 });
const raMoTa = dungPromptCoCanCu(goi('mo-ta', 'tinh-cam'), [], [], '', false, hdMoTa).user;

kiem('ô mo-ta: prompt có khối hợp đồng', raMoTa.includes('CÁCH VIẾT LƯỢT NÀY'));
kiem('ô mo-ta: khối mang đúng câu của COMPANION', raMoTa.includes('Nói như đang ngồi cạnh người hỏi'));
kiem('khối hợp đồng không chứa nhãn máy', !NHAN_MAY.test(raMoTa));

/*
 * Chữ trong khối đi THẲNG vào prompt, nên nó phải tuân chính bộ chuẩn nằm
 * cùng prompt. Dặn model bằng đúng chữ chuẩn cấm là đặt hai chỉ thị ngược
 * nhau — và chữ ấy rất dễ chép thẳng ra bài người đọc.
 */
const CHU_BI_CAM = [
  'cấu trúc', 'biểu hiện', 'năng lực', 'nguồn lực', 'hệ thống', 'cơ chế',
  'vận hành', 'tiềm năng', 'tối ưu', 'tự chủ', 'định hình', 'bứt phá',
  'tích lũy', 'nền tảng', 'bản chất', 'xu hướng',
];
for (const nhip of NHIP) {
  for (const kieu of KIEU) {
    const chu = khoiHopDong({ nhip, kieu }, 'mo-ta').toLowerCase();
    const dinh = CHU_BI_CAM.filter((c) => chu.includes(c));
    kiem(`khối ${nhip}/${kieu} không dùng chữ CHUAN_NGON_NGU_CELES cấm`, dinh.length === 0);
  }
}

// Thứ tự: khối hợp đồng phải đứng TRƯỚC khối THEO_Y_DINH của một ô đã có chỉ thị.
const hdQd = tinhHopDong({ yDinh: 'quyet-dinh', chuDe: 'tinh-cam', doDaiCauHoi: 100 });
const raQd = dungPromptCoCanCu(goi('quyet-dinh', 'tinh-cam'), [], [], '', false, hdQd).user;
kiem(
  'ô quyet-dinh: KHÔNG phát khối hợp đồng (THEO_Y_DINH đã nói)',
  !raQd.includes('CÁCH VIẾT LƯỢT NÀY')
);
kiem('ô quyet-dinh: vẫn giữ nguyên khối THEO_Y_DINH', raQd.includes('NGƯỜI HỎI ĐANG PHẢI QUYẾT MỘT VIỆC'));

/*
 * Khoá thứ tự bằng một ô ĐANG có cả hai khối. Hôm nay không ô nào như thế —
 * `mo-ta` là ô duy nhất phát khối hợp đồng, và nó rỗng bên `THEO_Y_DINH`. Nên
 * dựng trực tiếp trên chuỗi `user`: nếu sau này ai đó cho `mo-ta` một chỉ thị
 * `THEO_Y_DINH`, hoặc gỡ một ô khỏi `DA_CO_CHI_THI`, thứ tự phải vẫn đúng.
 */
const viTriHopDong = raMoTa.indexOf('CÁCH VIẾT LƯỢT NÀY');
const viTriCauHoi = raMoTa.indexOf('CÂU HỎI HIỆN TẠI');
kiem('khối hợp đồng nằm trước phần CÂU HỎI HIỆN TẠI', viTriHopDong > 0 && viTriHopDong < viTriCauHoi);

const nguon = readFileSync('lib/rag/prompt-co-can-cu.ts', 'utf8');
const mauUser = nguon.slice(nguon.indexOf('user: `'), nguon.indexOf('CÂU HỎI HIỆN TẠI'));
kiem(
  'mẫu prompt đặt ${khoiTruocYDinh} TRƯỚC ${phanYDinh}',
  mauUser.indexOf('${khoiTruocYDinh}') > 0 &&
    mauUser.indexOf('${khoiTruocYDinh}') < mauUser.indexOf('${phanYDinh}')
);

// Không truyền hợp đồng thì prompt phải y như trước — các bề mặt cũ không đổi.
const raKhongHopDong = dungPromptCoCanCu(goi('mo-ta', 'tinh-cam'), [], [], '', false).user;
kiem('không truyền hợp đồng thì không có khối nào', !raKhongHopDong.includes('CÁCH VIẾT LƯỢT NÀY'));

console.log(loi ? `\n${loi} lỗi` : '\nTất cả đạt');
process.exit(loi ? 1 : 0);
