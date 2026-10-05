/**
 * LỐI DỪNG BẰNG MÃ — máy canh của luật dừng lượt (CEL-186 vé B, chủ dự án 04/10).
 *
 * Lỗi UAT 04/10: "khi nào tôi có việc mới" nhận câu mã, model không được gọi,
 * vẫn trừ lượt. Gốc là luật chữ được quyền tự kết thúc lượt. Từ nay một lượt chỉ
 * được trả bằng mã (không gọi model) khi thuộc MỘT trong ba loại:
 *
 *   DU_KIEN   dữ kiện máy kiểm được: mốc trước ngày sinh, tháng nhuận engine chưa tách.
 *   HOI_LAI   hỏi lại vì thiếu dữ kiện thật (F2: lá số đang mở là của ai). Bắt buộc
 *             KHÔNG tính lượt và có chip đi tiếp một chạm (test-focused kiểm chip).
 *   NGOAI_LE_TAM  đúng MỘT mục: AGE-02. Không tính lượt, đóng băng, bước 2 phải hạ.
 *
 * Thêm lối `traNgay(...)` mới mà không thêm vào danh sách → đỏ. Thêm ngoại lệ tạm
 * thứ hai → đỏ. Đổi loại một mục sang HOI_LAI / NGOAI_LE_TAM mà tính lượt → đỏ.
 *
 * Offline: chỉ đọc mã nguồn.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// Nối bài này vào đồ thị import để `kiem-nhanh` chọn nó khi tệp điều phối đổi.
import { PHIEN_BAN_FOCUSED } from '../lib/rag/focused/tra-loi-focused';

type Loai = 'DU_KIEN' | 'HOI_LAI' | 'NGOAI_LE_TAM';

interface Muc {
  loai: Loai;
  /** Số lời gọi được phép (lượt một + lưới lượt hai). */
  soLan: number;
  lyDo: string;
}

const CHO_PHEP: Record<string, Muc> = {
  'focused-truoc-sinh': { loai: 'DU_KIEN', soLan: 1, lyDo: 'AGE-01: mốc hỏi trước ngày sinh, chưa có vận để đọc' },
  'focused-nhuan-chua-tach': { loai: 'DU_KIEN', soLan: 2, lyDo: 'engine chưa tách nguyệt hạn tháng nhuận' },
  'focused-f2': { loai: 'HOI_LAI', soLan: 1, lyDo: 'chưa biết lá số đang mở là của ai' },
  'focused-chua-hop-tuoi': { loai: 'NGOAI_LE_TAM', soLan: 1, lyDo: 'AGE-02, đóng băng 04/10, bước 2 hạ thành cách nói' },
};

/** Trần cứng — chủ dự án 04/10: "Temporary terminal allowlist chỉ được có đúng AGE-02". */
const TRAN_NGOAI_LE_TAM = 1;

const hong: string[] = [];
const kiem = (dk: boolean, loi: string) => {
  if (!dk) hong.push(loi);
};

const tep = 'lib/rag/focused/tra-loi-focused.ts';
const ma = readFileSync(join(__dirname, '..', tep), 'utf8');

// Mọi lời gọi traNgay(…) — cắt tới dấu ")" khớp ngoặc của chính lời gọi.
function loiGoi(nguon: string): string[] {
  const ra: string[] = [];
  const re = /\btraNgay\s*\(/g;
  for (let m = re.exec(nguon); m; m = re.exec(nguon)) {
    let sau = 1;
    let i = m.index + m[0].length;
    for (; i < nguon.length && sau > 0; i++) {
      if (nguon[i] === '(') sau++;
      else if (nguon[i] === ')') sau--;
    }
    ra.push(nguon.slice(m.index, i));
  }
  return ra;
}

// Chính định nghĩa `const traNgay = (cm: CauMa, …)` không phải lời gọi.
const goi = loiGoi(ma).filter((g) => !/^traNgay\s*\(\s*cm\s*:/.test(g));
const dem = new Map<string, number>();
for (const g of goi) {
  const ten = /'(focused-[\w-]+)'/.exec(g)?.[1];
  if (!ten) {
    hong.push(`lời gọi traNgay không có tên lối bằng chữ cố định: ${g.replace(/\s+/g, ' ')}`);
    continue;
  }
  dem.set(ten, (dem.get(ten) ?? 0) + 1);
  const muc = CHO_PHEP[ten];
  if (!muc) {
    hong.push(`lối dừng bằng mã "${ten}" không có trong danh sách cho phép — mọi khuôn khác phải đi qua model`);
    continue;
  }
  const khongTinh = /,\s*true\s*\)$/.test(g.replace(/\s+/g, ' ').replace(/\s*\)$/, ')'));
  if (muc.loai !== 'DU_KIEN') kiem(khongTinh, `"${ten}" (${muc.loai}) phải KHÔNG tính lượt (tham số cuối true)`);
}

for (const [ten, muc] of Object.entries(CHO_PHEP)) {
  const n = dem.get(ten) ?? 0;
  kiem(n <= muc.soLan, `"${ten}" có ${n} lời gọi, danh sách cho ${muc.soLan}`);
}

const tam = Object.entries(CHO_PHEP).filter(([, m]) => m.loai === 'NGOAI_LE_TAM');
kiem(tam.length <= TRAN_NGOAI_LE_TAM, `ngoại lệ tạm có ${tam.length} mục (${tam.map(([t]) => t).join(', ')}), trần ${TRAN_NGOAI_LE_TAM}`);

// Lượt bằng mã chỉ được dựng ở MỘT chỗ (traNgay); lối khác dựng `provider: 'ma'` là lách danh sách.
const soMa = (ma.match(/provider:\s*'ma'/g) ?? []).length;
kiem(soMa === 1, `tệp điều phối dựng provider 'ma' ở ${soMa} chỗ, chỉ được 1 (trong traNgay)`);

// D không được quay lại thành câu mã (lỗi UAT 04/10).
kiem(!/'focused-d'/.test(ma), '"focused-d" quay lại — "khi nào" phải đi qua model');

if (hong.length) {
  console.error(`HỎNG ${hong.length}:`);
  for (const h of hong) console.error(`  - ${h}`);
  process.exit(1);
}
console.log(`Lối dừng bằng mã (${PHIEN_BAN_FOCUSED}): ${goi.length} lời gọi, ${dem.size} lối, đều trong danh sách. Ngoại lệ tạm: ${tam.map(([t]) => t).join(', ')}.`);
