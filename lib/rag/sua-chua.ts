import { goiVoiFallback } from '@/lib/ai/fallback';
import { docObjectJson } from './doc-json';
import { nhanDangThucThe } from './thuc-the';

/**
 * Sửa câu kê sao, thay vì vứt cả bài vì nó.
 *
 * Luật cho bề mặt ngắn: tối đa MỘT tên sao trong một câu, và chỉ khi tên đó
 * giải thích được điều vừa nói bằng lời thường. Đo trên gpt-4o-mini: thỉnh
 * thoảng thẻ Điểm nổi bật vẫn ra "…thể hiện qua Vũ Khúc và Thiên Phủ trong cung
 * Mệnh" — hai tên sao trong một câu, đúng thứ prompt cấm.
 *
 * Hai cách xử đều tệ theo cách riêng:
 *  - Loại cả thẻ: mất một bài đúng vì một câu sai hình. Người dùng thấy bản
 *    template, và không ai biết vì sao.
 *  - Bỏ qua: luật thành lời khuyên, và lời khuyên thì model không giữ.
 *
 * Cách thứ ba là sửa. Gom mọi câu phạm luật của cả lượt sinh vào MỘT lần gọi,
 * xin viết lại bằng lời thường. Giữ nguyên ý, chỉ bỏ cái tên. Một lần gọi nhỏ
 * cho cả lượt, và chỉ khi thật sự có câu phạm.
 *
 * Sửa hỏng thì trả lại nguyên văn: câu kê sao vẫn hơn không có câu nào.
 */

/**
 * Số tên sao riêng biệt trong một câu.
 *
 * `boQua` là danh sách TÊN CÁCH CỤC có trên lá số. Chúng được gỡ khỏi câu trước
 * khi đếm, và đó không phải một ngoại lệ cho tiện.
 *
 * "Bạn sở hữu bộ cách Tử Phủ Vũ Tướng Liêm" chứa năm tên sao theo từ điển thực
 * thể — Tử Vi, Thiên Phủ, Vũ Khúc, Thiên Tướng, Liêm Trinh — nên luật kê sao
 * bắt nó ngay, rồi lớp sửa viết lại thành một câu không còn cái tên nào. Tức là
 * hệ thống tự tay xoá đúng thứ làm bài đọc này khác bài của người bên cạnh, và
 * xoá đúng thứ người dùng đang đòi.
 *
 * Một cách cục là MỘT dữ kiện, không phải năm. Đếm nó thành năm là đếm sai.
 */
export function demTenSao(cau: string, boQua: readonly string[] = []): number {
  let s = cau;
  for (const ten of boQua) s = s.split(ten).join(' ');
  return new Set(
    nhanDangThucThe(s)
      .filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION')
      .map((t) => t.id)
  ).size;
}

/** Câu nào có từ hai tên sao trở lên thì đang kê sao chứ không luận */
export function laCauKeSao(cau: string, tran = 2, boQua: readonly string[] = []): boolean {
  return demTenSao(cau, boQua) >= tran;
}

/**
 * Một CÂU có dùng tiếng lóng nội bộ của engine không.
 *
 * Cố ý viết lại ở đây thay vì mượn từ `ngon-ngu.ts`: bộ soát ở đó làm việc trên
 * CẢ BÀI và trộn hai cách khớp (có dấu / không dấu) cho các cụm khác nhau. Ở
 * đây chỉ cần một phép thử trên một câu, và nó phải khớp CÓ DẤU — bỏ dấu thì
 * "cản" trùng "cần", và câu "những yếu tố cần thiết" sẽ bị lôi đi sửa oan.
 */
const TIENG_LONG_MOT_CAU =
  /đẩy tới|yếu tố đỡ|yếu tố cản|yếu tố đang (?:đỡ|cản)|(?:các|những|nhiều|một số|vài)\s+yếu\s+tố|lực đỡ|nghiêng về phía (?:thuận|cản)|hai lực ngang nhau/iu;

/**
 * Một mảnh văn bản: hoặc là CÂU (được phép sửa), hoặc là PHẦN NGĂN CÁCH (không
 * bao giờ được đụng tới).
 *
 * Vì sao phải giữ phần ngăn cách thành mảnh riêng: bản cũ tách câu bằng
 * `split(/(?<=[.!?])\s+/)` rồi ráp bằng `join(' ')`. Phép tách vứt đi thứ nó
 * cắt, nên phép ráp không còn cách nào biết chỗ đó từng là `\n\n`. Mọi xuống
 * dòng thành một dấu cách: "kết luận đứng một mình" (`tra-loi.ts`) dính vào câu
 * sau, khuôn BÁO CÁO mất tiêu đề và danh sách. Mà chỉ những bài có câu phải sửa
 * mới bị, nên lỗi ấy im lặng.
 *
 * Bất biến của cặp hàm dưới: `rapManh(tachManh(x)) === x` với mọi x.
 */
export type ManhVanBan =
  | { loai: 'NOI_DUNG'; text: string }
  | { loai: 'PHAN_CACH'; text: string };

/** Dấu đầu dòng của Markdown: tiêu đề, gạch đầu dòng, danh sách đánh số, trích dẫn */
const DAU_DONG = /^[ \t]*(?:#{1,6}[ \t]+|[-*+][ \t]+|\d{1,3}[.)][ \t]+|>[ \t]?)?/;

/**
 * Ranh giới câu trong một khối chữ liền.
 *
 * Tính cả dấu đóng đứng ngay sau dấu kết câu — `.)`, `.”`, `.**` — vì model hay
 * kết câu trong ngoặc hoặc trong chữ đậm, và cắt trước chúng là để lại một mảnh
 * `)` hay `**` mồ côi ở đầu câu sau.
 *
 * KHÔNG tính `…`: trong văn Celes nó thường là quãng ngừng giữa câu ("có lúc…
 * rồi lại"), và cắt ở đó là chia một câu kê sao thành hai nửa, mỗi nửa dưới
 * ngưỡng `laCauKeSao`. Bản tách cũ cũng không cắt ở `…`.
 */
const RANH_GIOI_CAU = /((?<=[.!?]["”’)\]*_]*)\s+)/u;

/**
 * Cắt văn bản thành mảnh câu và mảnh ngăn cách, KHÔNG mất ký tự nào.
 *
 * Đi theo dòng. Dấu đầu dòng, khoảng trắng cuối dòng và ký tự xuống dòng đều là
 * PHAN_CACH, với một ngoại lệ: một dòng xuống đơn giữa hai dòng chữ thường (không
 * có dấu đầu dòng nào) là xuống dòng mềm của Markdown, tức vẫn là một đoạn. Giữ
 * nó trong câu để câu bị ngắt giữa chừng — "các\nyếu tố" — vẫn được nhận ra.
 */
export function tachManh(van: string): ManhVanBan[] {
  const dong = van.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  // Bỏ mảnh rỗng cuối cùng mà `$` luôn khớp thêm
  if (dong.length && dong[dong.length - 1] === '') dong.pop();

  const ra: ManhVanBan[] = [];
  const day = (loai: ManhVanBan['loai'], text: string) => {
    if (!text) return;
    const cuoi = ra[ra.length - 1];
    if (cuoi && cuoi.loai === 'PHAN_CACH' && loai === 'PHAN_CACH') cuoi.text += text;
    else ra.push({ loai, text });
  };

  let khoi = '';
  const xaKhoi = () => {
    // Khoảng trắng đầu/cuối khối không thuộc câu nào
    const m = khoi.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    day('PHAN_CACH', m[1]);
    m[2].split(RANH_GIOI_CAU).forEach((p, i) => day(i % 2 ? 'PHAN_CACH' : 'NOI_DUNG', p));
    day('PHAN_CACH', m[3]);
    khoi = '';
  };

  const phanTich = (d: string) => {
    const [, than, het] = d.match(/^([^\r\n]*)(\r\n|\n|\r|)$/)!;
    const dau = than.match(DAU_DONG)![0];
    return { dau, noi: than.slice(dau.length), het, coDau: dau.trim().length > 0 };
  };

  dong.forEach((d, i) => {
    const hien = phanTich(d);
    if (hien.coDau) {
      xaKhoi();
      day('PHAN_CACH', hien.dau);
      khoi += hien.noi;
    } else {
      // Chỉ thụt lề, không có dấu: vẫn là chữ của khối đang dở
      khoi += hien.dau + hien.noi;
    }
    const sau = i + 1 < dong.length ? phanTich(dong[i + 1]) : null;
    const xuongMem =
      hien.het && hien.noi.trim() && !hien.coDau && sau && sau.noi.trim() && !sau.coDau;
    if (xuongMem) {
      khoi += hien.het;
    } else {
      xaKhoi();
      day('PHAN_CACH', hien.het);
    }
  });
  xaKhoi();
  return ra;
}

/** Ráp lại đúng như cũ — nối thẳng, không chèn, không chuẩn hoá gì */
export function rapManh(manh: readonly ManhVanBan[]): string {
  return manh.map((m) => m.text).join('');
}

/**
 * Câu model viết lại phải là MỘT câu trơn.
 *
 * Nó sẽ được đặt vào đúng chỗ của một mảnh NOI_DUNG, nên mọi cấu trúc nó tự mang
 * theo — xuống dòng, tiền tố `C1.` lặp lại từ đề bài, gạch đầu dòng — sẽ chèn
 * thêm cấu trúc vào bài. Đó là cùng loại lỗi đang sửa, chỉ theo chiều ngược lại.
 */
function lamSachCauMoi(moi: string, goc: string): string {
  let ra = moi
    // Xuống dòng — kèm luôn dấu đầu dòng model chèn sau nó — thành một dấu cách
    .replace(/\s*[\r\n]+[ \t]*(?:(?:[-*+]|\d{1,3}[.)]|#{1,6}|>)[ \t]+)?/g, ' ')
    .replace(/^(?:C\d+\.\s*|#{1,6}\s+|[-*+]\s+|\d{1,3}[.)]\s+)/i, '')
    .trim();
  /*
   * Giữ lại dấu nhấn bị lẻ của câu gốc.
   *
   * `RANH_GIOI_CAU` cho dấu đóng đi theo câu, nên "**Hai. Ba.**" tách thành
   * "**Hai." và "Ba.**" — mỗi mảnh mang MỘT nửa cặp. Model viết lại "Ba.**" mà
   * bỏ `**` thì chữ đậm mở ở câu trước không bao giờ đóng và loang hết phần sau
   * của bài. Câu gốc lẻ dấu nào thì câu mới phải lẻ đúng dấu ấy, cùng phía.
   */
  for (const dau of ['**', '__']) {
    const le = (x: string) => x.split(dau).length % 2 === 0;
    if (!le(goc) || le(ra)) continue;
    ra = goc.trimStart().startsWith(dau) ? dau + ra : ra + dau;
  }
  return ra;
}

/**
 * Mảnh câu này có phải nội dung một dòng tiêu đề không.
 *
 * Tiêu đề không có dấu kết câu nên đứng riêng một mảnh, mà tiêu đề model viết
 * vẫn có thể khớp tiếng lóng ("### Các yếu tố đang cản"). Gửi nó đi viết lại
 * như một câu thì nhận về một câu dài nằm sau `###` — tiêu đề thành đoạn văn.
 * Để nguyên: cổng ngôn ngữ vẫn ghi nó vào trace.
 */
function laTieuDe(manh: readonly ManhVanBan[], i: number): boolean {
  const truoc = manh[i - 1];
  return !!truoc && truoc.loai === 'PHAN_CACH' && /#{1,6}[ \t]+$/.test(truoc.text);
}

/** Thay các mảnh câu theo vị trí, giữ nguyên mọi mảnh ngăn cách */
function thayManh(manh: readonly ManhVanBan[], sua: ReadonlyMap<number, string>): string {
  return rapManh(manh.map((m, i) => (m.loai === 'NOI_DUNG' && sua.has(i) ? { ...m, text: sua.get(i)! } : m)));
}

/**
 * Viết lại những câu kê sao trong một tập văn bản.
 *
 * Nhận vào một bảng khoá → đoạn, trả về bảng đã sửa. Không có câu nào phạm thì
 * trả lại nguyên bảng cũ và KHÔNG gọi model.
 */
/**
 * ĐẾM SỐ LẦN LỚP SỬA PHẢI CHẠY — phép đo bắt buộc cho A5.
 *
 * KIEN-TRUC-LUAN-GIAI.md mục 7.2 cho phép bỏ khỏi prompt những luật mà code đã
 * cưỡng chế. Nhưng "code cưỡng chế" ở đây phần lớn là LỚP SỬA, mà lớp sửa gọi
 * model. Bỏ một luật khỏi prompt để tiết kiệm vài trăm token đầu vào, rồi đổi
 * lại lớp sửa chạy thêm vài lượt mỗi bài, là lỗ — và không ai thấy nếu không
 * đếm.
 *
 * Đếm ở đây chứ không đếm ở chỗ gọi: một bộ đếm nằm cạnh chính hàm sửa thì
 * không có đường nào quên cập nhật khi thêm bề mặt mới.
 *
 * `soCauPham` là số CÂU phải viết lại, `soLuotGoi` là số lượt gọi model. Hai
 * con số khác nhau: `suaCauKeSao` gom cả bài thành một lượt.
 */
export const DEM_SUA = {
  keSao: { soLuotGoi: 0, soCauPham: 0 },
  tiengLong: { soLuotGoi: 0, soCauPham: 0 },
};

/** Đặt lại bộ đếm — bộ đo gọi trước mỗi lần sinh để số không cộng dồn */
export function datLaiDemSua(): void {
  DEM_SUA.keSao = { soLuotGoi: 0, soCauPham: 0 };
  DEM_SUA.tiengLong = { soLuotGoi: 0, soCauPham: 0 };
}

export async function suaCauKeSao(
  van: Record<string, string>,
  tuyChon: { tran?: number; toiDa?: number; boQua?: readonly string[] } = {}
): Promise<Record<string, string>> {
  const tran = tuyChon.tran ?? 2;
  const toiDa = tuyChon.toiDa ?? 6;
  const boQua = tuyChon.boQua ?? [];

  // Gom mọi câu phạm luật của cả lượt sinh
  const viPham: { khoa: string; viTri: number; cau: string }[] = [];
  const manhTheoKhoa = new Map<string, ManhVanBan[]>();
  for (const [khoa, doan] of Object.entries(van)) {
    const manh = tachManh(doan);
    manhTheoKhoa.set(khoa, manh);
    manh.forEach((m, i) => {
      if (m.loai !== 'NOI_DUNG' || laTieuDe(manh, i)) return;
      if (viPham.length < toiDa && laCauKeSao(m.text, tran, boQua)) viPham.push({ khoa, viTri: i, cau: m.text });
    });
  }
  if (!viPham.length) return van;

  DEM_SUA.keSao.soLuotGoi += 1;
  DEM_SUA.keSao.soCauPham += viPham.length;

  const danhSach = viPham.map((p, i) => `C${i + 1}. ${p.cau}`).join('\n');

  const system = `Bạn là biên tập viên của Celestia. Việc duy nhất: viết lại từng câu cho bớt tên sao.

LUẬT:
- Giữ nguyên ý và giữ nguyên giọng. Đây là sửa chữ, không phải viết lại nội dung.
- Bỏ tên sao Tử Vi khỏi câu. Nếu ý của câu dựa vào một tên sao thì giữ đúng MỘT tên, bỏ phần còn lại.
- Nói bằng lời thường: điều đó tạo ra gì trong đời sống, chứ không phải nó tên là gì.
- Không thêm ý mới, không thêm lời khuyên, không dài hơn câu gốc.
- TUYỆT ĐỐI KHÔNG thay tên sao bằng chữ "một sao", "một yếu tố", "các sao khác".
  Sai:  "phần công việc của bạn có một sao và một sao khác, kết hợp với một yếu tố."
  Đúng: "ở phần công việc, bạn vừa nghĩ nhanh vừa cân nhắc kỹ — nên hợp việc cần
         quyết gấp mà vẫn phải chịu trách nhiệm dài."
  Bỏ cái tên nghĩa là nói THẲNG nét nó tạo ra, không phải nói rằng có một cái tên.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:
{ "cau": [ { "id": "C1", "moi": "..." } ] }`;

  let sua: Record<string, string> = {};
  try {
    const kq = await goiVoiFallback(
      { system, user: danhSach, maxTokens: 1200, temperature: 0.3 },
      undefined
    );
    const tho = docObjectJson(kq.text);
    const mang = Array.isArray((tho as { cau?: unknown } | null)?.cau)
      ? ((tho as { cau: unknown[] }).cau as { id?: unknown; moi?: unknown }[])
      : [];
    for (const m of mang) {
      if (typeof m.id !== 'string' || typeof m.moi !== 'string') continue;
      const so = Number(m.id.replace(/^C/i, ''));
      if (!viPham[so - 1]) continue;
      const moi = lamSachCauMoi(m.moi, viPham[so - 1].cau);
      // Sửa xong mà vẫn kê sao, cụt hơn hẳn câu gốc, hoặc thành rỗng nghĩa
      if (moi.length < 12 || laCauKeSao(moi, tran, boQua) || CAU_RONG_NGHIA.test(moi)) continue;
      sua[`${viPham[so - 1].khoa}|${viPham[so - 1].viTri}`] = moi;
    }
  } catch {
    // Sửa hỏng thì giữ nguyên văn — câu kê sao vẫn hơn không có câu nào
    sua = {};
  }
  if (!Object.keys(sua).length) return van;

  const ra: Record<string, string> = {};
  for (const [khoa, manh] of manhTheoKhoa) {
    const suaKhoa = new Map<number, string>();
    manh.forEach((_, i) => {
      const moi = sua[`${khoa}|${i}`];
      if (moi !== undefined) suaKhoa.set(i, moi);
    });
    // Khoá không có câu nào được sửa thì trả lại đúng chuỗi gốc
    ra[khoa] = suaKhoa.size ? thayManh(manh, suaKhoa) : van[khoa];
  }
  return ra;
}

/**
 * Viết lại câu dùng tiếng lóng nội bộ của engine.
 *
 * VÌ SAO CẦN, dù cổng ngôn ngữ đã xếp lỗi này ở mức "chặn".
 *
 * "Chặn" ở `soatNgonNgu` nghĩa là GHI VÀO TRACE ở mức nặng nhất, không nghĩa là
 * giữ chữ lại: `app/api/luan-giai/route.ts` đưa `dat` vào nhật ký rồi vẫn trả
 * `kq.van` cho người đọc. Đúng cho mọi luật chặn khác ở tệp đó, và đúng ở chỗ
 * nó đúng — vứt cả bài vì một câu sai giọng là phản ứng quá tay.
 *
 * Nhưng với lỗi này thì để nguyên cũng không được: đo trên 69 bài, 2 bài vẫn
 * viết "các yếu tố cản vẫn khá mạnh". Hai bài ấy tới người đọc với đúng câu đã
 * làm họ phàn nàn.
 *
 * Nên dùng cách thứ ba, cùng cách `suaCauKeSao` đã dùng: sửa đúng câu sai, giữ
 * phần còn lại. Chỉ gọi model khi thật sự có câu phạm — 3% số bài.
 *
 * Khác `suaCauKeSao` ở một điểm quan trọng: ở đây model phải THÊM thông tin, vì
 * "yếu tố cản" không có tên nào để giữ lại. Nên phải đưa kèm danh sách dữ kiện
 * có tên để nó lấy ra dùng, chứ không được để nó tự nghĩ.
 */
export async function suaCauTiengLong(
  van: string,
  tenDuKien: string[]
): Promise<string> {
  const manh = tachManh(van);
  const pham = manh
    .map((m, i) => ({ c: m.text, i, loai: m.loai }))
    .filter(({ c, i, loai }) => loai === 'NOI_DUNG' && !laTieuDe(manh, i) && TIENG_LONG_MOT_CAU.test(c));
  if (!pham.length) return van;

  DEM_SUA.tiengLong.soLuotGoi += 1;
  DEM_SUA.tiengLong.soCauPham += pham.length;

  const system = `Bạn là biên tập viên của Celestia. Việc duy nhất: viết lại từng câu cho bỏ hết tiếng lóng nội bộ.

BỊ CẤM, vì người đọc không tra được và không đối chiếu được với đời mình:
"yếu tố đỡ", "yếu tố cản", "các yếu tố", "đẩy tới", "lực đỡ", "nghiêng về phía thuận", và mọi câu đếm dữ kiện kiểu "bảy yếu tố đang đỡ so với hai yếu tố cản".

VIẾT THAY VÀO ĐÓ: gọi ĐÍCH DANH dữ kiện trên lá số rồi dịch nghĩa ngay.
Các tên được phép dùng, lấy từ chính bài này: ${tenDuKien.length ? tenDuKien.join(', ') : '(bài không nêu tên nào — lúc đó hãy nói thẳng chuyện quan sát được ở đời thực, đừng nhắc "yếu tố")'}

LUẬT:
- Giữ nguyên kết luận và giữ nguyên hướng nghiêng. Đây là sửa chữ, không phải đổi ý.
- Không thêm tên sao nào NGOÀI danh sách trên. Bịa một cái tên còn tệ hơn câu gốc.
- Không dài hơn câu gốc quá một nửa.
- Không thêm lời khuyên, không thêm câu hỏi.

Sai:  "Năm 2026 chưa rõ khả năng mua nhà, vì các yếu tố cản vẫn khá mạnh."
Đúng: "Năm 2026 chưa phải lúc: Hóa Kỵ đóng ở phần nền tảng vật chất, nghĩa là việc ở đây hay vướng và hay phải làm lại."

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:
{ "cau": [ { "id": "C1", "moi": "..." } ] }`;

  const danhSach = pham.map((p, i) => `C${i + 1}. ${p.c}`).join('\n');

  const sua = new Map<number, string>();
  try {
    const kq = await goiVoiFallback(
      { system, user: danhSach, maxTokens: 900, temperature: 0.3 },
      undefined
    );
    const tho = docObjectJson(kq.text);
    const mang = Array.isArray((tho as { cau?: unknown } | null)?.cau)
      ? ((tho as { cau: unknown[] }).cau as { id?: unknown; moi?: unknown }[])
      : [];
    for (const m of mang) {
      if (typeof m.id !== 'string' || typeof m.moi !== 'string') continue;
      const so = Number(m.id.replace(/^C/i, ''));
      const goc = pham[so - 1];
      if (!goc) continue;
      const moi = lamSachCauMoi(m.moi, goc.c);
      // Sửa xong mà vẫn phạm, hoặc cụt hơn hẳn câu gốc, thì coi như hỏng
      if (moi.length < 15 || TIENG_LONG_MOT_CAU.test(moi)) continue;
      sua.set(goc.i, moi);
    }
  } catch {
    // Sửa hỏng thì giữ nguyên văn: một câu sai giọng vẫn hơn không có câu nào
    return van;
  }
  if (!sua.size) return van;

  return thayManh(manh, sua);
}

/**
 * Đổi tên cung lọt ra mặt trước thành phần đời mà nó nói tới.
 *
 * TẤT ĐỊNH — không gọi model. Đây là một phép tra bảng: mười hai cái tên, mười
 * hai mệnh đề đời sống, ánh xạ một-một và không phụ thuộc ngữ cảnh. Gọi model
 * cho một việc tra bảng là trả tiền và trả độ trễ cho một kết quả kém tin hơn.
 *
 * Vì sao cần, dù chuẩn ngôn ngữ đã cấm tên cung ở mọi dạng và prompt đã đưa sẵn
 * bảng dịch: đo trên 69 bài, 24 bài vẫn lọt. Và tỉ lệ ấy CÒN TĂNG sau khi lớp
 * dữ kiện mới bảo model "nêu đích danh tên sao và tên lớp hạn" — dặn nêu tên là
 * làm tăng áp lực lên đúng cái ranh giới này.
 *
 * Chặn bằng cổng thì phải vứt 35% số bài, tức là làm hỏng sản phẩm để làm hài
 * lòng cái máy. Sửa thì giữ được bài và bỏ được cái tên.
 *
 * Cụm thay thế viết NGẮN, khác bảng `chuDeCung` vốn dài và dùng làm tiêu đề:
 * ở đây chúng phải lọt vừa vào giữa một câu đã viết xong.
 *
 * Và không cụm nào được mang sẵn "của bạn". Câu gốc thường đã có sẵn sở hữu
 * ("Phúc Đức của bạn có Thiên Lương"), nên cụm mang thêm một lần nữa là ra
 * "phần bên trong của bạn của bạn". Cùng loại lỗi với hai gạch ngang trong một
 * câu: mỗi mảnh đều đúng, ghép lại thì câu gãy.
 */
const CUM_THAY_TEN_CUNG: [string, string][] = [
  ['Phụ Mẫu', 'phần cha mẹ và người trên'],
  ['Phúc Đức', 'phần bên trong'],
  ['Điền Trạch', 'phần chỗ ở và nền tảng'],
  ['Quan Lộc', 'phần công việc'],
  ['Nô Bộc', 'phần bạn bè và đồng nghiệp'],
  ['Thiên Di', 'phần chuyện ra ngoài'],
  ['Tật Ách', 'phần sức khoẻ'],
  ['Tài Bạch', 'phần tiền bạc'],
  ['Tử Tức', 'phần con cái'],
  ['Phu Thê', 'phần bạn đời'],
  ['Huynh Đệ', 'phần anh chị em'],
];

/**
 * "Mệnh" xử riêng, và CHỈ khi có giới từ đi kèm.
 *
 * Đứng một mình nó trùng những chữ tiếng Việt bình thường — "số mệnh", "vận
 * mệnh", "sứ mệnh", "định mệnh" — và trùng cả hai khái niệm khác của chính bộ
 * môn: "bản Mệnh" (nạp âm năm sinh) và "Mệnh chủ". Thay bừa là làm hỏng câu
 * đúng, mà một bộ sửa làm hỏng câu đúng thì tệ hơn là không có.
 */
const MENH_CO_GIOI_TU =
  /(?<!(?:bản|số|vận|sứ|định)\s)(cung|phần|tại|ở|hội về|hội tại|tọa|thủ|đóng tại|về)\s+Mệnh(?!\s*chủ)(?![\p{L}])/giu;

/**
 * Giới từ nào cần giữ lại chữ "ở" phía trước cụm thay.
 *
 * "tại Mệnh" → "ở phần khí chất" thì câu liền mạch; "cung Mệnh" → "phần khí
 * chất" cũng liền. Nhưng "hội về Mệnh" → "phần khí chất" thì mất động từ và
 * câu gãy, nên nhóm này giữ nguyên động từ rồi mới nối cụm.
 */
const GIOI_TU_GIU_NGUYEN = new Set(['hội về', 'hội tại', 'tọa', 'thủ', 'đóng tại', 'về']);

/**
 * KHÔNG dùng `\b` quanh tên cung, và đây không phải chuyện thẩm mỹ.
 *
 * `\b` của JavaScript tính ranh giới theo bảng ASCII. "Điền" mở đầu bằng Đ và
 * "Thê" kết thúc bằng ê — cả hai đều KHÔNG phải ký tự từ theo ASCII, nên không
 * có ranh giới nào ở đó và biểu thức không bao giờ khớp. Đúng cái hố mà
 * `CAU_RA_LENH` ở `chuan-ngon-ngu.ts` đã ghi lại: "hãy" và "nên" đều có dấu.
 *
 * Thay bằng `(?![\p{L}])` — không được có CHỮ CÁI nào ngay sau, tính theo
 * Unicode. Phía trước thì tên cung luôn đi sau giới từ hoặc khoảng trắng nên
 * không cần chặn.
 */
function cuoiTu(ten: string): string {
  return `${ten}(?![\\p{L}])`;
}

/**
 * Dọn chữ thừa sinh ra ở chỗ nối.
 *
 * "Phần Tật Ách cho thấy…" thay xong ra "Phần phần sức khoẻ cho thấy…", vì câu
 * gốc đã mở bằng "Phần" viết hoa nên không khớp luật "phần X", rồi tên cung trơ
 * bị thay bằng một cụm vốn đã mang sẵn chữ "phần".
 *
 * Cùng loại với lỗi "của bạn của bạn" gặp trước đó: mỗi mảnh đều đúng, ghép lại
 * thì câu gãy. Khớp không phân biệt hoa thường ở trên đã bớt phần lớn, nhưng
 * vẫn cần một lượt dọn cuối vì tiếng Việt có nhiều chỗ nối hơn thế.
 */
/**
 * Câu sửa xong mà thành RỖNG NGHĨA — phải vứt, giữ câu gốc.
 *
 * Lớp sửa kê sao được bảo "bỏ tên sao đi", và nó làm đúng theo nghĩa đen: câu
 * "Quan Lộc có Thiên Cơ và Thái Âm, kết hợp Hóa Khoa" ra thành "phần công việc
 * của bạn có một sao và một sao khác, kết hợp với một yếu tố."
 *
 * Câu ấy không còn tên sao nào, nên nó qua được luật kê sao — và nó tệ hơn hẳn
 * câu gốc, vì câu gốc ít ra còn nói được điều gì đó. Một lớp sửa được phép làm
 * câu khác đi, không được phép làm câu rỗng đi.
 */
const CAU_RONG_NGHIA =
  /một sao|các sao khác|một yếu tố|những yếu tố|một số sao|vài ngôi sao|một ngôi sao/iu;

function donChuThua(van: string): string {
  return van
    .replace(/(Phần|phần)\s+phần(?![\p{L}])/gu, '$1')
    .replace(/(Cung|cung)\s+phần(?![\p{L}])/gu, 'phần')
    .replace(/(?<![\p{L}])ở\s+ở(?![\p{L}])/gu, 'ở')
    .replace(/của bạn của bạn/gu, 'của bạn')
    .replace(/[ \t]{2,}/g, ' ')
    /*
     * Viết hoa lại đầu câu.
     *
     * "Phần Quan Lộc của bạn…" thay xong thành "phần công việc của bạn…" —
     * đúng nội dung, mất chữ hoa. Người đọc thấy ngay một câu mở bằng chữ
     * thường, và một lỗi chính tả ở câu đầu làm hỏng lòng tin vào cả đoạn.
     */
    .replace(
      /(^|[.!?]\s+)(\p{Ll})/gu,
      (_, dau: string, chu: string) => dau + chu.toUpperCase()
    );
}

export function doiTenCung(van: string): string {
  let ra = van;

  for (const [ten, cum] of CUM_THAY_TEN_CUNG) {
    // "cung X" / "phần X" -> cụm (cụm đã tự mang chữ "phần").
    // Cờ `i`: model viết hoa đầu câu — "Phần Tật Ách…" — và không có cờ này thì
    // câu ấy rơi xuống luật cuối và thành "Phần phần sức khoẻ".
    ra = ra.replace(new RegExp(`(?:cung|phần)\\s+${cuoiTu(ten)}`, 'giu'), cum);
    // "tại X" / "ở X" -> "ở cụm", giữ lại giới từ để câu không gãy
    ra = ra.replace(new RegExp(`(?:tại|ở)\\s+${cuoiTu(ten)}`, 'giu'), `ở ${cum}`);
    // Còn trơ lại tên cung thì thay nốt
    ra = ra.replace(new RegExp(cuoiTu(ten), 'gu'), cum);
  }

  ra = ra.replace(MENH_CO_GIOI_TU, (_, gt: string) => {
    const g = gt.toLowerCase();
    if (GIOI_TU_GIU_NGUYEN.has(g)) return `${gt} phần khí chất`;
    return g === 'tại' || g === 'ở' ? 'ở phần khí chất' : 'phần khí chất';
  });

  /*
   * Chỉ dọn khi THẬT SỰ có thay.
   *
   * `donChuThua` viết hoa lại đầu câu, và nếu chạy vô điều kiện thì nó sửa cả
   * những câu không có tên cung nào — bộ kiểm bắt được ngay: ba câu thuộc nhóm
   * "không được đụng tới" đều bị đổi. Lớp dọn này tồn tại để vá chỗ nối do
   * chính phép thay tạo ra, nên không có phép thay thì không có gì để vá.
   */
  return ra === van ? van : donChuThua(ra);
}

/**
 * Gỡ ký hiệu Markdown khỏi chữ đi tới bề mặt KHÔNG dịch Markdown.
 *
 * Bảng Bức tranh đầy đủ vẽ từng đoạn bằng một thẻ <p> trần, không qua
 * `MarkdownLuanGiai`. Nên khi prompt dặn model in đậm tên cách cục, người đọc
 * nhận về đúng chữ "**Tham Lang**" kèm bốn dấu sao.
 *
 * Đã bỏ lời dặn ấy khỏi prompt, nhưng lời dặn không phải bảo đảm: model đời mới
 * tự in đậm tên riêng theo thói quen, kể cả khi không ai bảo. Nên phải có một
 * lượt gỡ tất định ở tầng sinh chữ.
 *
 * Gỡ, KHÔNG phải dịch sang thẻ đậm. Chủ dự án muốn chữ trơn, và nhấn mạnh phải
 * nằm ở cách đặt câu chứ không ở ký hiệu.
 */
export function boMarkdown(van: string): string {
  return van
    // **đậm** và __đậm__ -> chữ trơn
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // *nghiêng* -> chữ trơn, nhưng KHÔNG đụng dấu sao đứng một mình hay đầu dòng
    .replace(/(?<![\p{L}\d*])\*([^*\n]+)\*(?![\p{L}\d*])/gu, '$1')
    // Dấu thăng mở đầu dòng
    .replace(/^#{1,6}\s+/gm, '')
    // Dấu sao còn sót lẻ loi giữa câu
    .replace(/\*/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
