'use client';

import { taoSupabaseClient } from '@/lib/supabase/client';

/**
 * Hội thoại Hỏi Celes, lưu theo LÁ SỐ chứ không theo tab trình duyệt.
 *
 * Trước đây `tinNhan` chỉ là state React: refresh trang, đóng tab, hay đổi máy
 * là mất sạch. Mà mạch hội thoại lại chính là thứ làm Celes khác một ô tìm
 * kiếm — người ta kể ra mức lương, quy mô đội, ai là quản lý, rồi lượt sau
 * Celes quên hết và hỏi lại y như lần đầu.
 *
 * Dùng bảng `chat_messages` đã có sẵn trong `schema.sql` từ đầu dự án và chưa
 * ai dùng. Cột `phien` ở đó được đặt ra đúng cho việc này — chú thích gốc ghi
 * "cho phép hỏi đáp cả khi lá số chưa được lưu thành hồ sơ" — nên khoá nhóm là
 * `chartHash`, không phải id hồ sơ. Hỏi về một lá số vừa lập mà chưa lưu thì
 * mạch vẫn được giữ.
 *
 * KHÔNG cần chạy SQL gì thêm: bảng đã nằm trên production, RLS đã bật, policy
 * `chi thao tac hoi thoai cua minh` đã có. Đọc và ghi ngay từ trình duyệt là an
 * toàn — Postgres chỉ trả về dòng của chính người đang đăng nhập.
 *
 * Mọi hàm ở đây im lặng khi hỏng. Chưa đăng nhập, chưa cấu hình Supabase, hay
 * mạng chập thì chat vẫn chạy như trước, chỉ là không có trí nhớ. Đây là thứ
 * làm sản phẩm tốt hơn, không phải thứ nó cần để hoạt động.
 */

/**
 * Bằm lá số, bản chạy ở TRÌNH DUYỆT.
 *
 * Phải cho ra ĐÚNG chuỗi mà `lib/rag/nhat-ky.ts::bamLaSo` cho ra ở máy chủ —
 * cùng một lá số phải ra cùng một khoá, bằng không mạch hội thoại rẽ làm hai
 * và không bên nào thấy bên nào. Nên công thức phải chép y nguyên: sha256 của
 * `ngay-thang-nam-gio-gioiTinh`, lấy 16 ký tự hex đầu.
 *
 * Không gọi thẳng `bamLaSo` được vì nó dùng `node:crypto`. Web Crypto làm được
 * đúng việc đó, chỉ khác ở chỗ nó bất đồng bộ và cần HTTPS hoặc localhost.
 *
 * Dùng bằm chứ không dùng thẳng ngày sinh: `phien` là cột text, ném ngày sinh
 * vào đó là rải dữ liệu sinh thêm một chỗ nữa mà không được gì.
 */
export async function bamLaSoTrinhDuyet(
  ngay: number,
  thang: number,
  nam: number,
  gio: number,
  gioiTinh: string
): Promise<string> {
  const chuoi = `${ngay}-${thang}-${nam}-${gio}-${gioiTinh}`;
  const byte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chuoi));
  return [...new Uint8Array(byte)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export interface LuotChat {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}

/**
 * Số lượt đọc lại khi mở trang.
 *
 * Hai mươi lượt là khoảng mười lượt hỏi đáp — đủ dài để giữ mạch một buổi, đủ
 * ngắn để không phải cuộn qua chuyện của tuần trước mới thấy câu vừa hỏi.
 * Tuyến `/api/hoi-dap` dù sao cũng chỉ nhận 10 lượt cuối vào prompt.
 */
const SO_LUOT_DOC = 20;

interface DongChat {
  vai_tro: 'nguoi-dung' | 'tro-ly';
  noi_dung: string;
}

/** Đọc lại mạch hội thoại của một lá số. Mảng rỗng khi chưa có gì hoặc không đọc được. */
export async function docHoiThoai(chartHash: string): Promise<LuotChat[]> {
  const supabase = taoSupabaseClient();
  if (!supabase || !chartHash) return [];

  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return [];

    /*
     * Lấy N dòng MỚI NHẤT rồi lật lại, thay vì lấy N dòng đầu.
     *
     * Sắp xuôi rồi `limit` là lấy được đoạn đầu của cuộc trò chuyện — tức phần
     * đã cũ nhất — và người dùng mở trang lên thấy câu hỏi của tháng trước còn
     * câu vừa hỏi thì mất.
     */
    const { data: dong, error } = await supabase
      .from('chat_messages')
      .select('vai_tro, noi_dung')
      .eq('phien', chartHash)
      .order('tao_luc', { ascending: false })
      .limit(SO_LUOT_DOC);

    if (error || !dong) return [];
    return (dong as DongChat[])
      .map((d) => ({ vaiTro: d.vai_tro, noiDung: d.noi_dung }))
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Cất một cặp hỏi–đáp.
 *
 * Cất CẢ CẶP trong một lần gọi, sau khi đã có câu trả lời. Cất câu hỏi ngay lúc
 * gửi thì khi model hỏng sẽ còn lại một câu hỏi lơ lửng không ai trả lời, và
 * lần mở sau Celes đọc nó như một lượt đã xong.
 */
export async function luuLuot(
  chartHash: string,
  cauHoi: string,
  traLoi: string,
  model?: string
): Promise<void> {
  const supabase = taoSupabaseClient();
  if (!supabase || !chartHash) return;

  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    /*
     * Đặt `tao_luc` TƯỜNG MINH, lệch nhau 1ms.
     *
     * Cột này mặc định `now()`, mà trong Postgres `now()` là mốc của CẢ GIAO
     * DỊCH — hai dòng chèn cùng một lệnh nhận đúng một giá trị. Sắp theo nó thì
     * hai dòng ngang nhau và Postgres trả về theo thứ tự nào tuỳ nó. Lượt sau
     * model có thể đọc được một hội thoại đảo ngược: Celes nói trước, người
     * dùng đáp lại.
     *
     * Không dùng mẹo sắp phụ theo `vai_tro`. Mẹo đó đúng chỉ vì 'nguoi-dung' <
     * 'tro-ly' theo bảng chữ cái, và một cái đúng nhờ trùng hợp thì lần đổi tên
     * vai trò sau sẽ hỏng mà không ai lần ra vì sao.
     */
    const luc = Date.now();
    await supabase.from('chat_messages').insert([
      {
        user_id: data.user.id,
        phien: chartHash,
        vai_tro: 'nguoi-dung',
        noi_dung: cauHoi,
        tao_luc: new Date(luc).toISOString(),
      },
      {
        user_id: data.user.id,
        phien: chartHash,
        vai_tro: 'tro-ly',
        noi_dung: traLoi,
        model,
        tao_luc: new Date(luc + 1).toISOString(),
      },
    ]);
  } catch {
    // Cất hỏng thì lần sau không có mạch cũ — không đáng để làm hỏng câu trả lời
    // đang hiện trên màn hình.
  }
}

/**
 * Xoá toàn bộ hội thoại của một lá số.
 *
 * Phải có, và phải nằm ngay cạnh nút xoá màn hình. Từ lúc hội thoại được cất
 * lên máy chủ, "Xoá hội thoại" không còn là dọn màn hình nữa — người dùng bấm
 * nó là muốn thứ họ đã kể biến mất thật, chứ không phải ẩn đi.
 */
export async function xoaHoiThoai(chartHash: string): Promise<void> {
  const supabase = taoSupabaseClient();
  if (!supabase || !chartHash) return;

  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    // RLS đã chặn xoá dòng của người khác; lọc theo user_id ở đây là để câu lệnh
    // tự đọc được, không phải để bảo mật.
    await supabase.from('chat_messages').delete().eq('phien', chartHash).eq('user_id', data.user.id);
  } catch {
    // Im lặng: màn hình vẫn được dọn, và người dùng bấm lại được.
  }
}
