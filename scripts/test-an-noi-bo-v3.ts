/**
 * Luận giải v3: pb / model chỉ sống trong đệm, KHÔNG được ra trình duyệt (mặt trước không lộ tên
 * model). Bài offline: môi trường giả có đệm đủ câu, không gọi model.
 *
 * Gốc lỗi (18/10/2026): đường "đủ câu trong đệm" trả `cauDem` thẳng, quên anNoiBo — hai đường
 * vừa viết thì đã gỡ. Không bài CI nào gọi xuLyLuanGiaiV3 nên lọt.
 *
 * Chạy: npx tsx scripts/test-an-noi-bo-v3.ts
 */
import { CAU_HOI_V3 } from '../lib/rag/v3';
import { xuLyLuanGiaiV3, type CauTraRaV3, type MoiTruongV3 } from '../lib/rag/v3/xu-ly';

let hong = 0;
let dat = 0;
function kiem(dk: boolean, ten: string) {
  if (dk) dat++;
  else {
    hong++;
    console.log(`  ✗ ${ten}`);
  }
}

const tongQuan = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan');
const daDem: CauTraRaV3[] = tongQuan.map((q) => ({
  id: q.id,
  cauHoi: q.cauHoi,
  luanGiai: 'bài đã viết',
  viSao: 'vì sao',
  doRo: 'ro' as CauTraRaV3['doRo'],
  chuaViet: false,
  pb: 'pb-noi-bo',
  model: 'ten-model-noi-bo',
}));

let goiModel = false;
const mt: MoiTruongV3 = {
  dem: {
    doc: async <T>() => ({ noiDung: structuredClone(daDem) as T, provider: 'nha-cung-cap', model: 'ten-model-noi-bo', taoLuc: '' }) as never,
    luu: async () => {},
    docMoiNhat: async () => null,
    docNhieu: async () => [],
  },
  canDangNhap: async () => null,
  laKhach: async () => {
    goiModel = true;
    return false;
  },
  xinLuotLaSoMoi: async () => ({ duocPhep: true, tran: 3 }),
  phienBanKho: async () => null,
  docThuVien: async () => [],
  quanTri: async () => null,
};

async function main() {
  const kq = await xuLyLuanGiaiV3({ ngay: 12, thang: 5, nam: 1995, gio: 9, gioiTinh: 'nam', namXem: 2026 }, mt);
  kiem('json' in kq && kq.status === 200, 'đường đọc đệm trả 200');
  if (!('json' in kq)) return;
  const cau = kq.json.cau as Record<string, unknown>[];
  kiem(kq.json.tuDem === true && !goiModel, 'đủ câu trong đệm → không đi tới bước gọi model');
  kiem(Array.isArray(cau) && cau.length === tongQuan.length, 'trả đủ câu tổng quan');
  kiem(cau.every((c) => !('pb' in c) && !('model' in c)), 'câu từ đệm không mang pb / model');
  kiem(!JSON.stringify(kq.json).includes('ten-model-noi-bo'), 'không chuỗi tên model nào trong phản hồi');
  kiem(daDem.every((c) => c.model === 'ten-model-noi-bo'), 'không sửa bản ghi đệm gốc');
}

main().then(() => {
  console.log(hong ? `\n✗ ${hong}/${hong + dat} ca hỏng` : `\n✓ ${dat} ca xanh`);
  process.exit(hong ? 1 : 0);
});
