import { NextResponse } from 'next/server';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai, taoSupabaseServer } from '@/lib/supabase/server';
import { CAU_HINH_UNG_HO } from './config';

/**
 * Đặt chỗ và hoàn lại lượt Hỏi Celes.
 *
 * Đặt chỗ TRƯỚC khi gọi model, hoàn lại nếu model hỏng. Làm ngược lại — trừ sau
 * khi có câu trả lời — thì mở mười tab bấm cùng lúc là vượt hạn mức, còn trừ
 * trước mà không hoàn thì người dùng mất một câu đã trả tiền vì lỗi của mình.
 *
 * Toàn bộ phép đếm nằm trong hàm `dat_cho_cau_hoi` ở Postgres. Đếm ở tầng
 * JavaScript thì hai yêu cầu song song đọc cùng một số cũ rồi cùng ghi đè.
 */

export type NguonQuota = 'free_daily' | 'supporter' | 'admin_exempt';

export interface KetQuaDatCho {
  duocPhep: boolean;
  nguon?: NguonQuota;
  freeUsed?: number;
  freeLimit?: number;
  supporterBalanceRemaining?: number;
  /** Phản hồi sẵn sàng trả về khi hết lượt */
  chan?: NextResponse;
}

const CHUA_CAU_HINH: KetQuaDatCho = { duocPhep: true, nguon: 'admin_exempt' };

function chanHetLuot(freeUsed: number, freeLimit: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'ASK_QUOTA_EXHAUSTED',
        message: `Bạn đã dùng hết ${freeLimit} câu miễn phí hôm nay.`,
        supportEligible: true,
      },
      // Giữ hình dạng lỗi cũ để giao diện đang có không vỡ
      loi: `Bạn đã dùng hết ${freeLimit} câu miễn phí hôm nay.`,
      freeUsed,
      freeLimit,
    },
    { status: 402 }
  );
}

export async function datChoCauHoi(requestId: string): Promise<KetQuaDatCho> {
  if (!supabaseDaCauHinh) return CHUA_CAU_HINH;

  const user = await nguoiDungHienTai();
  if (!user) return CHUA_CAU_HINH; // cổng đăng nhập đã chặn trước đó

  // Admin không bị tính lượt và cũng KHÔNG được cấp quyền supporter giả
  if (laAdmin(user.email)) return { duocPhep: true, nguon: 'admin_exempt' };

  const supabase = await taoSupabaseServer();
  if (!supabase) return CHUA_CAU_HINH;

  const { data, error } = await supabase.rpc('dat_cho_cau_hoi', {
    p_han_muc_mien_phi: CAU_HINH_UNG_HO.freeAskDailyLimit,
    p_request_id: requestId,
  });

  // Chưa chạy schema-support.sql thì hàm chưa tồn tại. Chặn lúc đó là làm hỏng
  // tính năng đang chạy được, nên cho qua và để người vận hành thấy log.
  if (error) {
    console.warn('[ung-ho] chưa đặt chỗ được, bỏ qua hạn mức:', error.message);
    return CHUA_CAU_HINH;
  }

  const kq = data as {
    allowed: boolean;
    quotaSource?: NguonQuota;
    freeUsed?: number;
    freeLimit?: number;
    supporterBalanceRemaining?: number;
  };

  if (!kq?.allowed) {
    const freeUsed = kq?.freeUsed ?? CAU_HINH_UNG_HO.freeAskDailyLimit;
    const freeLimit = kq?.freeLimit ?? CAU_HINH_UNG_HO.freeAskDailyLimit;
    return { duocPhep: false, freeUsed, freeLimit, chan: chanHetLuot(freeUsed, freeLimit) };
  }

  return {
    duocPhep: true,
    nguon: kq.quotaSource,
    freeUsed: kq.freeUsed,
    freeLimit: kq.freeLimit,
    supporterBalanceRemaining: kq.supporterBalanceRemaining,
  };
}

/** Trả lại lượt đã đặt chỗ khi phía AI hỏng */
export async function hoanCauHoi(nguon: NguonQuota | undefined, requestId: string) {
  if (!supabaseDaCauHinh || !nguon || nguon === 'admin_exempt') return;
  const supabase = await taoSupabaseServer();
  await supabase?.rpc('hoan_cau_hoi', { p_nguon: nguon, p_request_id: requestId });
}

/** Ghi nhận một lượt đã dùng thành công */
export async function chotCauHoi(requestId: string, model?: string) {
  if (!supabaseDaCauHinh) return;
  const supabase = await taoSupabaseServer();
  await supabase
    ?.from('usage_events')
    .update({ status: 'success', completed_at: new Date().toISOString(), model_name: model })
    .eq('request_id', requestId);
}
