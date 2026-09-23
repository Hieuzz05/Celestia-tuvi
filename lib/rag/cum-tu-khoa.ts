/**
 * Cụm từ khoá cho nhánh tìm theo chữ.
 *
 * Bộ tách 'simple' của Postgres cắt theo khoảng trắng, nên "Thiên Cơ" thành hai
 * từ "thiên" và "cơ". Nối chúng bằng HOẶC thì đoạn nào có chữ "Thiên" cũng khớp:
 * Thiên Đồng, Thiên Lương, Thiên Di, Thiên La… — tức gần như cả kho. Tên sao,
 * tên cung, tên cách cục phải được tìm NGUYÊN CỤM (`thiên <-> cơ`), còn lại mới
 * là từ lẻ nối bằng HOẶC.
 *
 * Tệp này thuần: không database, không model, để planner và bộ test offline
 * dùng được mà không kéo theo Supabase.
 */

/**
 * Chữ viết hoa đứng đầu một cụm nhưng không phải phần của tên riêng.
 * "Sao Tử Vi ở cung Mệnh" — "Sao" viết hoa vì đầu câu, không thuộc tên sao.
 */
const DAU_CUM_BO = new Set([
  'sao', 'cung', 'cách', 'cục', 'tôi', 'bạn', 'em', 'anh', 'chị', 'mình', 'hỏi',
  'cho', 'năm', 'tháng', 'khi', 'nếu', 'vì', 'có', 'là', 'người', 'lá', 'số',
  'vậy', 'thế', 'còn', 'nhưng', 'và', 'hay', 'liệu', 'tại',
]);

const tachAmTiet = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * Các cụm từ viết hoa liền nhau trong câu hỏi — tên riêng người dùng tự gõ.
 *
 * Tên cách cục không nằm trong từ điển thực thể ("Linh Xương Đà Vũ", "Thiên La
 * Địa Võng"), nhưng người Việt gần như luôn viết hoa chúng. Dấu câu cắt cụm.
 * Người gõ toàn chữ thường thì không nhận ra cụm nào — khi đó nhánh từ khoá chạy
 * y như trước, không tệ đi.
 */
export function cumVietHoa(cauHoi: string): string[] {
  const ra: string[] = [];
  let cum: string[] = [];

  const chot = () => {
    while (cum.length && DAU_CUM_BO.has(cum[0].toLowerCase())) cum.shift();
    if (cum.length >= 2) ra.push(cum.join(' '));
    cum = [];
  };

  for (const m of cauHoi.matchAll(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)) {
    const tu = m[0];
    if (/^\p{Lu}/u.test(tu)) cum.push(tu);
    else chot();
  }
  chot();

  return [...new Set(ra)];
}

export interface TuKhoaDaTach {
  /** Tìm nguyên cụm, xếp hạng cao hơn */
  cum: string[];
  /** Từ lẻ còn lại, nối bằng HOẶC */
  tuLe: string;
}

/**
 * Tách truy vấn từ khoá thành cụm và từ lẻ.
 *
 * Âm tiết của các tên trong `boAmTietCua` bị bỏ khỏi phần từ lẻ: giữ "thiên"
 * đứng riêng là mở lại đúng cái cửa mà cụm "Thiên Cơ" vừa đóng. Chỉ làm vậy với
 * tên lấy từ từ điển thực thể — chính tả của chúng là chuẩn, nên cụm chắc chắn
 * khớp nếu sách có nói tới. Cụm người dùng tự gõ thì có thể lệch chính tả với
 * sách ("Đà Vũ" / "Đà Võ"); bỏ âm tiết của nó là cụm trượt thì nhánh từ khoá
 * trắng tay. Nên các âm tiết ấy vẫn ở lại làm lưới đỡ, còn cụm thì được cộng
 * điểm gấp đôi ở SQL để đứng trên.
 */
export function tachTuKhoa(
  truyVanTuKhoa: string,
  cumVao: string[],
  boAmTietCua: string[] = cumVao
): TuKhoaDaTach {
  const cum = [...new Set(cumVao.map((c) => c.trim()).filter((c) => tachAmTiet(c).length >= 2))];
  const daPhu = new Set(boAmTietCua.filter((c) => tachAmTiet(c).length >= 2).flatMap(tachAmTiet));

  const tuLe = [
    ...new Set(
      (truyVanTuKhoa ?? '')
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t && !daPhu.has(t.toLowerCase()))
    ),
  ].join(' ');

  return { cum, tuLe };
}
