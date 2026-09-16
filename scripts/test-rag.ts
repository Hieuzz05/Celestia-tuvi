/**
 * Kiểm chứng phần cắt đoạn + embedding của kho tri thức.
 * Chạy: npx tsx scripts/test-rag.ts
 * Có gọi API embedding thật (tốn quota Gemini, vài request).
 */

import { readFileSync } from 'node:fs';

for (const dong of readFileSync('.env.local', 'utf-8').split('\n')) {
  const sach = dong.trim();
  if (!sach || sach.startsWith('#')) continue;
  const [khoa, ...phan] = sach.split('=');
  const giaTri = phan.join('=').trim();
  if (giaTri) process.env[khoa.trim()] = giaTri;
}

const TAI_LIEU_MAU = `# Sao Tử Vi

Tử Vi là đế tinh, đứng đầu Bắc Đẩu, thuộc hành Thổ âm. Sao này chủ về quyền quý, sự tôn nghiêm và khả năng lãnh đạo. Người có Tử Vi thủ Mệnh thường có phong thái đường hoàng, thích được kính trọng, không ưa luồn cúi.

Tử Vi miếu địa tại Ngọ là cách cục đẹp nhất, gọi là "Tử Vi cư Ngọ vô sát tấu", chủ về công danh hiển hách. Tuy nhiên Tử Vi đơn thủ mà không có Tả Phù Hữu Bật đi kèm thì gọi là "cô quân", quyền uy giảm sút nhiều.

## Sao Thái Dương

Thái Dương thuộc hành Hỏa dương, chủ về danh tiếng, cha và chồng, sự nghiệp công khai. Thái Dương miếu tại Ngọ, vượng tại Dần Mão Thìn, hãm tại các cung từ Thân đến Hợi.

Thái Dương hãm địa mà gặp Hóa Kỵ thì chủ về hao tổn danh tiếng, quan hệ với cha hoặc chồng nhiều trắc trở. Ngược lại Thái Dương miếu vượng gặp Hóa Lộc thì danh lợi song toàn.

## Bộ Nhật Nguyệt

Thái Dương và Thái Âm là cặp âm dương của lá số. Nhật Nguyệt đồng cung tại Sửu Mùi gọi là cách "Nhật Nguyệt đồng lâm". Nhật Nguyệt sáng sủa thì cha mẹ song toàn, gia đạo hưng vượng.`;

async function main() {
  const { catThanhDoan } = await import('../lib/ai/chunk');
  const { embedTaiLieu, embedTruyVan, SO_CHIEU_VECTOR } = await import('../lib/ai/embedding');
  const { truyHoiTriThuc } = await import('../lib/ai/rag');

  let loi = 0;
  const ketLuan = (ok: boolean, moTa: string) => {
    console.log(`${ok ? '✓' : '✗'} ${moTa}`);
    if (!ok) loi++;
  };

  console.log('### 1. Cắt đoạn');
  const doans = catThanhDoan(TAI_LIEU_MAU);
  console.log(`  Tài liệu ${TAI_LIEU_MAU.length} ký tự -> ${doans.length} đoạn`);
  doans.forEach((d, i) => console.log(`  [${i}] ${d.length} ký tự: ${d.slice(0, 68).replace(/\n/g, ' / ')}…`));

  ketLuan(doans.length >= 3, 'Cắt được nhiều đoạn');
  ketLuan(
    doans.every((d) => d.length <= 1800),
    'Không đoạn nào vượt quá giới hạn kích thước'
  );
  ketLuan(
    doans.some((d) => d.startsWith('Sao Thái Dương')),
    'Đề mục được ghim vào đầu đoạn để giữ ngữ cảnh'
  );
  ketLuan(
    doans.every((d) => d.replace(/\s/g, '').length >= 40),
    'Đã loại các đoạn vụn quá ngắn'
  );

  console.log('\n### 2. Embedding');
  const v1 = await embedTaiLieu(doans[0]);
  ketLuan(v1.length === SO_CHIEU_VECTOR, `Vector tài liệu đúng ${SO_CHIEU_VECTOR} chiều`);

  const cosine = (a: number[], b: number[]) => {
    let t = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      t += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return t / (Math.sqrt(na) * Math.sqrt(nb));
  };

  const hoiLienQuan = await embedTruyVan('Sao Tử Vi có ý nghĩa gì về tính cách lãnh đạo?');
  const hoiKhongLienQuan = await embedTruyVan('Cách nấu phở bò Hà Nội ngon nhất');

  const diemGan = cosine(v1, hoiLienQuan);
  const diemXa = cosine(v1, hoiKhongLienQuan);
  console.log(`  Đoạn "Sao Tử Vi" vs câu hỏi về Tử Vi   : ${diemGan.toFixed(3)}`);
  console.log(`  Đoạn "Sao Tử Vi" vs câu hỏi về nấu phở : ${diemXa.toFixed(3)}`);
  ketLuan(diemGan > diemXa, 'Câu hỏi đúng chủ đề cho điểm tương đồng cao hơn câu lạc đề');
  ketLuan(diemGan > 0.6 && diemXa < 0.6, 'Khoảng cách đủ rộng để ngưỡng lọc 0.6 có ý nghĩa');

  console.log('\n### 3. Truy hồi khi kho chưa cấu hình');
  const rong = await truyHoiTriThuc('thử khi chưa có service role key');
  ketLuan(
    Array.isArray(rong) && rong.length === 0,
    'Trả mảng rỗng thay vì ném lỗi — luận giải vẫn chạy được khi thiếu kho'
  );

  console.log(`\n${loi === 0 ? 'TẤT CẢ ĐỀU ĐẠT.' : `${loi} mục KHÔNG đạt.`}`);
  process.exit(loi === 0 ? 0 : 1);
}

main();
