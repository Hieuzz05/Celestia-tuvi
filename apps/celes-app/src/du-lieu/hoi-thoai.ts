import * as Crypto from 'expo-crypto';
import type { HoSo } from './ho-so';
import { supabase } from './supabase';

/**
 * Hội thoại với Celes, lưu theo LÁ SỐ — chung một bảng `chat_messages` với web.
 *
 * Bản sao có chủ đích của `lib/store/hoi-thoai.ts` (web): tệp đó dùng client
 * Supabase của trình duyệt và Web Crypto, cả hai đều không có trên React Native.
 * Luật thì phải giữ y nguyên, vì hỏi trên web rồi mở app phải thấy đúng mạch cũ:
 *   - khoá nhóm = sha256(`ngay-thang-nam-gio-gioiTinh`) lấy 16 ký tự hex đầu,
 *     KHỚP `bamLaSo` ở `lib/rag/nhat-ky.ts`;
 *   - cất CẢ CẶP sau khi có câu trả lời, `tao_luc` lệch nhau 1ms;
 *   - đọc 60 dòng mới nhất rồi lật lại.
 *
 * Mọi hàm im lặng khi hỏng: chưa đăng nhập hay mạng chập thì chat vẫn chạy,
 * chỉ là không có trí nhớ.
 */

const SO_LUOT_DOC = 60;

export interface LuotChat {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}

export async function bamLaSo(hoSo: HoSo): Promise<string> {
  const [nam, thang, ngay] = hoSo.ngaySinh.split('-').map(Number);
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${ngay}-${thang}-${nam}-${hoSo.gio}-${hoSo.gioiTinh}`
  );
  return hex.slice(0, 16);
}

async function nguoiDungId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function docHoiThoai(khoa: string): Promise<LuotChat[]> {
  try {
    if (!supabase || !(await nguoiDungId())) return [];
    const { data, error } = await supabase
      .from('chat_messages')
      .select('vai_tro, noi_dung')
      .eq('phien', khoa)
      .order('tao_luc', { ascending: false })
      .limit(SO_LUOT_DOC);
    if (error || !data) return [];
    return (data as { vai_tro: LuotChat['vaiTro']; noi_dung: string }[])
      .map((d) => ({ vaiTro: d.vai_tro, noiDung: d.noi_dung }))
      .reverse();
  } catch {
    return [];
  }
}

export async function luuLuot(
  khoa: string,
  cauHoi: string,
  traLoi: string,
  model?: string
): Promise<void> {
  try {
    const id = await nguoiDungId();
    if (!supabase || !id) return;
    const luc = Date.now();
    await supabase.from('chat_messages').insert([
      {
        user_id: id,
        phien: khoa,
        vai_tro: 'nguoi-dung',
        noi_dung: cauHoi,
        tao_luc: new Date(luc).toISOString(),
      },
      {
        user_id: id,
        phien: khoa,
        vai_tro: 'tro-ly',
        noi_dung: traLoi,
        model,
        tao_luc: new Date(luc + 1).toISOString(),
      },
    ]);
  } catch {
    // Cất hỏng thì lần sau thiếu mạch cũ — không đáng làm hỏng câu đang hiện
  }
}

/** Xoá THẬT trên máy chủ — người dùng bấm xoá là muốn điều đã kể biến mất */
export async function xoaHoiThoai(khoa: string): Promise<void> {
  try {
    const id = await nguoiDungId();
    if (!supabase || !id) return;
    await supabase.from('chat_messages').delete().eq('phien', khoa).eq('user_id', id);
  } catch {
    // Im lặng: màn hình vẫn được dọn, bấm lại được
  }
}
