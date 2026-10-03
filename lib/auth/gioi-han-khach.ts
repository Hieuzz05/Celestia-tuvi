import { createHmac } from 'node:crypto';
import { supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { docNhieuTheoTienTo, luuNoiDung } from '@/lib/rag/noi-dung-ai';

/**
 * Giới hạn số lá số MỚI một khách chưa đăng nhập được Celes viết tổng quan
 * trong một ngày, đếm theo IP (chủ dự án yêu cầu 26/09/2026).
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN
 *
 * Tổng quan mở cho khách từ 23/09 (CEL-118), và từ khi chuyển sang v3 thì mỗi
 * lá số chưa có bài tốn ~12 lượt gọi model. Không có tài khoản nào để đặt hạn
 * mức, nên một người gõ bừa ngày sinh trong vòng lặp là đốt tiền không đáy.
 *
 * ---------------------------------------------------------------------------
 * CHỈ ĐẾM LÁ SỐ PHẢI VIẾT MỚI
 *
 * Lá số đã có bài trong đệm (của chính khách hay của ai khác cùng ngày giờ
 * sinh) không tốn lượt gọi nào, nên không đếm. Cùng một lá số mở lại, hay lượt
 * thứ hai của cùng trang (tám câu sau ba thẻ đầu), cũng không đếm thêm.
 *
 * ---------------------------------------------------------------------------
 * LƯU Ở ĐÂU
 *
 * Bảng noi_dung_ai, bề mặt 'gioi-han-khach': chart_hash = băm IP, khoa_ky =
 * "<ngày giờ VN>|<băm lá số>". Khoá duy nhất sẵn có của bảng lo việc một lá số
 * chỉ tính một lần. Không cần chạy SQL mới.
 *
 * Đọc và ghi qua lib/rag/noi-dung-ai.ts (03/10/2026), KHÔNG chạm bảng trực tiếp: sổ đếm là trạng
 * thái theo môi trường, nên khách thử trên Preview/local không ăn vào lượt của production.
 *
 * IP không bao giờ được cất thô: băm HMAC với khoá bí mật của máy chủ, nên có
 * đọc được bảng cũng không dò ngược ra IP.
 *
 * ---------------------------------------------------------------------------
 * HỎNG THÌ CHO QUA
 *
 * Không đọc được IP (chạy cục bộ) hay bảng lỗi thì cho qua. Chặn nhầm một khách
 * thật tệ hơn để lọt vài lượt gọi.
 */

function soNguyenDuong(v: string | undefined, macDinh: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : macDinh;
}

/** Số lá số mới mỗi IP mỗi ngày — đổi qua biến môi trường, không cần deploy lại mã */
export const LA_SO_MOI_MOI_NGAY = soNguyenDuong(process.env.GUEST_NEW_CHARTS_DAILY_LIMIT, 3);

const BE_MAT = 'gioi-han-khach';

function ipCua(req: Request): string | null {
  // Vercel tự đặt x-real-ip và ghi đè x-forwarded-for, người gọi không giả được
  const ip = req.headers.get('x-real-ip')?.trim() || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ip || null;
}

function bamIp(ip: string): string {
  const khoa = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.CONFIG_SECRET ?? '';
  return createHmac('sha256', khoa).update(`ip:${ip}`).digest('hex').slice(0, 24);
}

/** Ngày theo giờ Việt Nam — "hôm nay" của người dùng, không phải của UTC */
function ngayVN(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}

export async function laKhach(): Promise<boolean> {
  if (!supabaseDaCauHinh) return false;
  return !(await nguoiDungHienTai());
}

export interface KetQuaGioiHan {
  duocPhep: boolean;
  daDung: number;
  tran: number;
}

/**
 * Xin một lượt "lá số mới" cho khách đang gọi. Gọi NGAY TRƯỚC khi sinh bài, và
 * chỉ khi đệm thiếu bài — xem ghi chú đầu tệp.
 */
export async function xinLuotLaSoMoi(req: Request, chartHash: string): Promise<KetQuaGioiHan> {
  const tran = LA_SO_MOI_MOI_NGAY;
  const ip = ipCua(req);
  const supabase = taoSupabaseAdmin();
  if (!ip || !supabase) return { duocPhep: true, daDung: 0, tran };

  const maIp = bamIp(ip);
  const tienTo = `${ngayVN()}|`;
  const khoaNay = `${tienTo}${chartHash}`;
  const k = { chartHash: maIp, beMat: BE_MAT, ngonNgu: 'vi' } as const;
  try {
    // Đọc hỏng thì trả rỗng → cho qua (xem "HỎNG THÌ CHO QUA")
    const da = (await docNhieuTheoTienTo<unknown>(k, tienTo)).map((d) => d.khoaKy);
    if (da.includes(khoaNay)) return { duocPhep: true, daDung: da.length, tran };
    if (da.length >= tran) return { duocPhep: false, daDung: da.length, tran };

    await luuNoiDung({ ...k, khoaKy: khoaNay }, {}, {});
    return { duocPhep: true, daDung: da.length + 1, tran };
  } catch {
    return { duocPhep: true, daDung: 0, tran };
  }
}
