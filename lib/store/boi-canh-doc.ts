'use client';

import { laySupabaseClient } from '@/lib/supabase/client';
import { lamSachBoiCanh, type BoiCanhDoc } from '@/lib/rag/v3/boi-canh-doc';

/**
 * Nơi cất BỐI CẢNH NGƯỜI ĐỌC (lib/rag/v3/boi-canh-doc.ts) — theo TỪNG lá số, vì bối cảnh là
 * của người trong lá số chứ không phải của tài khoản (xem lá số của mẹ thì "đã có con").
 *
 *  - Luôn ghi vào localStorage của trình duyệt, khoá theo ngày giờ sinh + giới tính.
 *  - Đã đăng nhập và lá số là một hồ sơ trong tài khoản: ghi thêm cột `charts.boi_canh`
 *    (supabase/va-boi-canh-la-so.sql) để máy khác đọc được. Cột chưa có thì lỗi bị nuốt —
 *    trình duyệt vẫn nhớ.
 */

export interface LaSoCua {
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: string;
}

const khoa = (l: LaSoCua) => `celestia:boi-canh:${l.ngay}-${l.thang}-${l.nam}-${l.gio}-${l.gioiTinh}`;

function docMay(l: LaSoCua): BoiCanhDoc {
  try {
    const raw = window.localStorage.getItem(khoa(l));
    return raw ? lamSachBoiCanh(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** Hồ sơ trong tài khoản trùng lá số này (id + bối cảnh đã cất), hoặc null */
async function hoSoTaiKhoan(l: LaSoCua) {
  try {
    const supabase = await laySupabaseClient();
    if (!supabase) return null;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase
      .from('charts')
      .select('*')
      .eq('ngay', l.ngay)
      .eq('thang', l.thang)
      .eq('nam', l.nam)
      .eq('gio', l.gio)
      .eq('gioi_tinh', l.gioiTinh)
      .limit(5);
    if (!data?.length) return null;
    return { supabase, ds: data as { id: string; boi_canh?: unknown }[] };
  } catch {
    return null;
  }
}

/** Đọc bối cảnh: trình duyệt trước; trống thì lấy từ tài khoản (và chép về trình duyệt) */
export async function docBoiCanhDoc(l: LaSoCua): Promise<BoiCanhDoc> {
  const may = docMay(l);
  if (Object.keys(may).length) return may;
  const hs = await hoSoTaiKhoan(l);
  const tk = hs?.ds.map((d) => lamSachBoiCanh(d.boi_canh)).find((b) => Object.keys(b).length);
  if (tk) {
    try {
      window.localStorage.setItem(khoa(l), JSON.stringify(tk));
    } catch {
      /* chế độ riêng tư */
    }
    return tk;
  }
  return {};
}

export async function luuBoiCanhDoc(l: LaSoCua, bc: BoiCanhDoc): Promise<void> {
  const sach = lamSachBoiCanh(bc);
  try {
    window.localStorage.setItem(khoa(l), JSON.stringify(sach));
  } catch {
    /* chế độ riêng tư */
  }
  const hs = await hoSoTaiKhoan(l);
  if (!hs) return;
  try {
    await hs.supabase.from('charts').update({ boi_canh: sach }).in('id', hs.ds.map((d) => d.id));
  } catch {
    /* cột chưa tạo — trình duyệt vẫn nhớ */
  }
}
