import { goiVoiFallback } from '@/lib/ai/fallback';
import { chonMauVang, khoiMauVang } from './mau-vang';

import type { LaSo } from '@/lib/tuvi/ansao';

import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';

import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';

import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';

import { CAU_RA_LENH, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';

import { docObjectJson } from './doc-json';

import { soatNgonNgu } from './ngon-ngu';

import { lapKeHoach } from './planner';

import { nhanDangThucThe } from './thuc-the';

import { truyHoi } from './truy-hoi';



/**

 * Chữ cho các mốc trên dòng thời gian Hành trình.

 *

 * Mốc trước đây là một câu tất định: "Nghiêng về {chủ đề cung}." Mười mốc xếp

 * dọc thành mười dòng cùng một khuôn, và không dòng nào nói quãng ấy mang lại

 * gì — chỉ nói nó thuộc đề tài nào.

 *

 * MỘT lượt gọi cho cả nhóm mốc, không phải mỗi mốc một lượt.

 *

 * Đây là chỗ khác biệt lớn nhất so với các bề mặt kia. Một dòng thời gian có

 * khoảng mười giai đoạn, bảy năm trong cửa sổ, và mười hai tháng của năm đang

 * chọn — hai mươi chín mốc. Sinh riêng từng mốc là hai mươi chín lượt cho MỘT

 * lần mở trang, trong khi gói miễn phí của Gemini cho hai mươi lượt cả ngày.

 * Gọi một lượt cho cả nhóm còn được thêm một thứ mà gọi riêng không có: model

 * nhìn thấy cả dãy nên biết mốc nào đã nói gì, và không lặp lại ý ở mốc sau.

 *

 * Mỗi nhóm cất riêng theo khoá của nó, nên lật cửa sổ năm hay đổi năm đang chọn

 * chỉ tốn thêm đúng một lượt cho nhóm mới.

 */



export const PHIEN_BAN_MOC = '2026.09.2';



export type LoaiMoc = 'giai-doan' | 'nam' | 'thang';



export interface MocChoSinh {

  /** Id thật của mốc ở phía giao diện */

  id: string;

  /** Nhãn người đọc thấy: "36–45 tuổi", "2026", "Tháng 3 âm" */

  nhan: string;

  /** Cung mà mốc này ứng vào */

  tenCung: string;

  chi: string;

  /** Chính tinh đóng ở cung đó, kèm độ sáng */

  sao: string;

  /** Có Tuần hoặc Triệt không */

  vong: string;

}



const NHAN_LOAI: Record<LoaiMoc, string> = {

  'giai-doan': 'các quãng mười năm của cả đời',

  nam: 'từng năm trong một dải năm',

  thang: 'từng tháng âm lịch trong một năm',

};



const DAI_TOI_DA: Record<LoaiMoc, number> = {

  'giai-doan': 40,

  nam: 32,

  thang: 28,

};



/*
 * Cụm thời gian mở đầu — thứ không mang thông tin nào.
 *
 * Người đọc đang nhìn đúng cái nhãn "36–45 tuổi" ngay cạnh câu, nên "Giai đoạn
 * này…" chỉ nói lại cái họ vừa đọc. Vấn đề là cả dãy cùng mở như thế: đo được
 * chín trên mười hai mốc bắt đầu bằng cùng ba từ, và đọc dọc xuống thì thấy
 * ngay một cái khuôn.
 *
 * Dặn model đừng làm thế đã thử hai lần và không ăn thua, nên cắt bằng luật.
 * Cắt chứ không viết lại: phần còn lại vẫn nguyên chữ của model.
 */
const MO_DAU_THUA =
  /^(?:trong\s+|vào\s+)?(?:giai đoạn|quãng|thời gian|thời điểm|khoảng thời gian|tháng|năm)\s+(?:này|đó|ấy)\s*,?\s*/i;

function catMoDauThua(cau: string): string {
  const con = cau.replace(MO_DAU_THUA, '').trim();
  // Cắt xong mà còn quá ngắn thì cụm đó đang gánh phần lớn câu — giữ nguyên
  if (con.length < 20) return cau;
  return con.charAt(0).toUpperCase() + con.slice(1);
}

export async function sinhMocHanhTrinh(vao: {

  laSo: LaSo;

  loai: LoaiMoc;

  moc: MocChoSinh[];

  namXem: number;

  thangXem: number;

}): Promise<{

  noiDung: Record<string, string>;

  provider: string;

  model: string;

  phienBan: Record<string, string>;

} | null> {

  if (!vao.moc.length) return null;



  const cauHoi = `Dòng thời gian: ${NHAN_LOAI[vao.loai]}`;

  const keHoachGoc = lapKeHoach({
    cauHoi,
    saoTheoCung: saoChinhTheoCung(vao.laSo),
    tenCachCuc: tenCachCucCho(vao.laSo),
  });

  const keHoach = {

    ...keHoachGoc,

    chuDe: 'tong-quan' as const,

    cungLienQuan: [...new Set([...vao.moc.map((m) => m.tenCung), ...keHoachGoc.cungLienQuan])],

    lopHan: (['ban-menh', 'dai-van', 'luu-nien'] as const).slice(),

  };



  const { duKien } = chonBoiCanh({

    laSo: vao.laSo,

    keHoach,

    namXem: vao.namXem,

    thangXem: vao.thangXem,

  });

  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 6 });

  const goi = dungGoiBangChung(cauHoi, keHoach, duKien, kqTruyHoi.daChon);



  const saoChoPhep = new Set(

    nhanDangThucThe(

      [

        ...duKien.map((f) => f.noiDung),

        ...goi.bangChung.map((e) => e.noiDung),

        ...vao.moc.map((m) => m.sao),

      ].join(' ')

    ).map((t) => t.id)

  );



  // Đánh số lại khi đưa xuống model: id thật dài và dễ bị chép sai, mà chép sai

  // một id là mất hẳn một mốc.

  const bang = vao.moc

    .map((m, i) => {

      const phan = [`M${i + 1}`, m.nhan, `cung ${m.tenCung} (${m.chi})`, m.sao || 'không có chính tinh'];

      if (m.vong) phan.push(m.vong);

      return phan.join(' | ');

    })

    .join('\n');



  const toiDa = DAI_TOI_DA[vao.loai];



  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, bình tĩnh, nói với người đối diện.



Đây là DÒNG THỜI GIAN — ${NHAN_LOAI[vao.loai]}. Mỗi mốc CHỈ một câu, tối đa ${toiDa} từ.



MỤC TIÊU CỦA MỘT MỐC: nói quãng đó thường mang lại điều gì trong đời sống. Không nói nó "thuộc về chủ đề nào" — người đọc đã thấy nhãn rồi.

- HỎNG: "Nghiêng về chuyện tiền bạc." — đó là cái nhãn, không phải nhận định.

- HỎNG: "Quãng này có Thái Dương đắc địa." — đó là dữ kiện, không phải nghĩa.

- ĐƯỢC: "Quãng dễ được người đi trước cất nhắc, nhưng thường tới muộn hơn bạn mong."

- ĐƯỢC: "Chỗ ở và nơi làm việc hay đổi trong quãng này, và mỗi lần đổi lại kéo theo một đợt sắp xếp lại."



NĂM LUẬT CỨNG:

- KHÔNG HAI MỐC NÀO ĐƯỢC BẮT ĐẦU BẰNG CÙNG BA TỪ. Đây là luật đếm được, không phải lời khuyên: đọc dọc xuống mà thấy "Giai đoạn này…" lặp bảy lần là cả dãy hỏng.
- Xoay vòng kiểu mở đầu: khi thì bắt đầu bằng việc đang xảy ra ("Chỗ ở hay đổi…"), khi thì bằng người ("Người đi trước…"), khi thì bằng cảm giác ("Dễ thấy sốt ruột…"), khi thì bằng mệnh đề điều kiện ("Nếu có chuyện phải quyết…"). Đừng mở cả dãy bằng một danh từ chỉ thời gian.

- CẤM mở đầu bằng "Quãng này", "Giai đoạn này", "Thời gian này", "Thời điểm này", "Tháng này", "Khoảng thời gian này". Mở thẳng bằng chính điều đáng nói.

- CẤM khuyên bảo. Không "hãy", không "bạn nên", không "cần phải". Celes mô tả xu hướng và nêu điều đáng cân nhắc, không ra lệnh cho người đọc.

- ĐỘ DÀI PHẢI LỆCH NHAU. Ít nhất BA mốc dưới 15 từ. Mốc nào dữ kiện mỏng thì viết ngắn hẳn, đừng thêm thắt cho dài bằng mốc khác.

- Tối đa MỘT tên sao trong một câu, và chỉ khi nó giải thích được điều vừa nói. Phần lớn mốc không cần tên sao nào.



${CHUAN_NGON_NGU_CELES}



KHÔNG ĐƯỢC: nói một sự việc sẽ xảy ra; phán chắc chắn về sức khoẻ, tiền bạc, pháp lý; nhắc tên sách hay hệ phái.



TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:

{ "moc": [ { "id": "M1", "cau": "..." }, { "id": "M2", "cau": "..." } ] }



Đủ mọi mốc được liệt kê, đúng id đã cho.`;



  const mauMoc = khoiMauVang(chonMauVang({ beMat: 'moc-hanh-trinh', loai: ['thua-du-kien'] }));
  const user = `${dungKhoiChoPrompt(goi)}



DÒNG THỜI GIAN CẦN VIẾT (id | nhãn | cung | chính tinh | vòng):

${bang}${mauMoc ? `\n\n${mauMoc}` : ''}`;



  const kq = await goiVoiFallback({ system, user, maxTokens: 6000 });

  const tho = docObjectJson(kq.text);

  const mang = Array.isArray((tho as { moc?: unknown } | null)?.moc)

    ? ((tho as { moc: unknown[] }).moc as { id?: unknown; cau?: unknown }[])

    : null;

  if (!mang) return null;



  const ra: Record<string, string> = {};

  for (const m of mang) {

    if (typeof m.id !== 'string' || typeof m.cau !== 'string') continue;

    const so = Number(m.id.replace(/^M/i, ''));

    const goc = vao.moc[so - 1];

    if (!goc) continue;



    const cau = m.cau

      .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')

      .replace(/\b[FE]\d{3}\b/g, '')

      .replace(/\s{2,}/g, ' ')

      .trim();

    if (cau.length < 12) continue;



    // Celes không kê đơn. Câu ra lệnh lọt qua được cổng ngôn ngữ vì nó không

    // phải phán quyết cũng không phải từ thô, nhưng nó sai vai: người đọc tới

    // đây để hiểu mình, không phải để nhận việc.

    if (CAU_RA_LENH.test(cau)) continue;

    const gon = catMoDauThua(cau);



    // Sao bịa trong một câu duy nhất là hỏng cả mốc — bỏ, để mốc đó giữ chữ cũ

    const bia = nhanDangThucThe(cau).filter(

      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !saoChoPhep.has(t.id)

    );

    if (bia.length) continue;



    ra[goc.id] = gon;

  }



  // Thiếu quá nửa thì trả null: một dòng thời gian nửa AI nửa template đọc dọc

  // xuống là thấy ngay hai giọng, tệ hơn hẳn việc để nguyên một giọng cũ.

  if (Object.keys(ra).length < Math.ceil(vao.moc.length / 2)) return null;



  const gate = soatNgonNgu(Object.values(ra).join(' '), Object.values(ra));

  if (!gate.dat) return null;



  return {

    noiDung: ra,

    provider: kq.provider,

    model: kq.model,

    phienBan: {

      moc: PHIEN_BAN_MOC,

      planner: keHoach.phienBan,

      truyHoi: kqTruyHoi.phienBan,

      phuongPhap: PHUONG_PHAP.phienBan,

    },

  };

}

