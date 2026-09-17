import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai, taoSupabaseServer } from '@/lib/supabase/server';
import { CAU_HINH_UNG_HO } from './config';

/**
 * Quyền hiện tại của một tài khoản — đọc ở phía máy chủ.
 *
 * Ba bậc, theo đúng thứ tự ưu tiên spec chốt:
 *   1. admin  → miễn hoàn toàn khỏi luật thương mại, KHÔNG tạo quyền giả
 *   2. supporter còn hạn → tiêu quota đã trả tiền
 *   3. free   → tiêu quota miễn phí trong ngày
 *
 * Vai trò admin đọc từ biến môi trường phía máy chủ, không bao giờ suy ra từ
 * email do trình duyệt gửi lên.
 */

export type BacQuyen = 'anonymous' | 'free' | 'supporter' | 'admin';

export interface Quyen {
  tier: BacQuyen;
  supporterExpiresAt: string | null;
  ask: {
    freeDailyUsed: number;
    freeDailyLimit: number;
    supporterBalance: number;
    /** Còn bao nhiêu câu dùng được ngay lúc này; null nghĩa là không bị giới hạn */
    remaining: number | null;
  };
  longReportsRemaining: number;
  profileLimit: number | null;
  features: {
    deepMap: boolean;
    journeyDetail: boolean;
    connectionFull: boolean;
    expertExport: boolean;
  };
  /** Các con số thương mại, gửi kèm để giao diện không phải chép lại chúng */
  cauHinh: {
    suggestedAmounts: number[];
    minAmount: number;
    maxAmount: number;
    freeAskDailyLimit: number;
    profileLimitFree: number;
    profileLimitSupporter: number;
  };
}

const CAU_HINH_CHUNG = {
  suggestedAmounts: [...CAU_HINH_UNG_HO.suggestedAmounts],
  minAmount: CAU_HINH_UNG_HO.minSupportAmount,
  maxAmount: CAU_HINH_UNG_HO.maxSupportAmount,
  freeAskDailyLimit: CAU_HINH_UNG_HO.freeAskDailyLimit,
  profileLimitFree: CAU_HINH_UNG_HO.profileLimitFree,
  profileLimitSupporter: CAU_HINH_UNG_HO.profileLimitSupporter,
};

const KHACH: Quyen = {
  tier: 'anonymous',
  supporterExpiresAt: null,
  ask: { freeDailyUsed: 0, freeDailyLimit: CAU_HINH_UNG_HO.freeAskDailyLimit, supporterBalance: 0, remaining: 0 },
  longReportsRemaining: 0,
  profileLimit: 0,
  features: { deepMap: false, journeyDetail: false, connectionFull: false, expertExport: false },
  cauHinh: CAU_HINH_CHUNG,
};

function quyenAdmin(): Quyen {
  return {
    tier: 'admin',
    supporterExpiresAt: null,
    ask: {
      freeDailyUsed: 0,
      freeDailyLimit: CAU_HINH_UNG_HO.freeAskDailyLimit,
      supporterBalance: 0,
      remaining: null,
    },
    longReportsRemaining: Number.MAX_SAFE_INTEGER,
    profileLimit: null,
    features: { deepMap: true, journeyDetail: true, connectionFull: true, expertExport: true },
    cauHinh: CAU_HINH_CHUNG,
  };
}

/**
 * Chưa cấu hình Supabase thì sản phẩm không có tài khoản nào cả. Khoá lúc đó là
 * tự nhốt mình chứ không bảo vệ được gì, nên mở hết — giống cách `lib/auth/cong.ts`
 * đã xử lý cho cổng đăng nhập.
 */
export async function quyenHienTai(): Promise<Quyen> {
  if (!supabaseDaCauHinh) return quyenAdmin();

  const user = await nguoiDungHienTai();
  if (!user) return KHACH;
  if (laAdmin(user.email)) return quyenAdmin();

  const supabase = await taoSupabaseServer();
  const { data } = (await supabase
    ?.from('user_entitlements')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()) ?? { data: null };

  const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  // Bộ đếm của ngày hôm qua không còn nghĩa gì — coi như chưa dùng câu nào
  const daDung = data?.free_ask_date === homNay ? (data?.free_ask_used ?? 0) : 0;
  const soDu = data?.supporter_ask_balance ?? 0;
  const hetHan = data?.supporter_expires_at ?? null;
  const conSupporter = Boolean(hetHan && new Date(hetHan).getTime() > Date.now());

  const conMienPhi = Math.max(CAU_HINH_UNG_HO.freeAskDailyLimit - daDung, 0);

  return {
    tier: conSupporter ? 'supporter' : 'free',
    supporterExpiresAt: hetHan,
    ask: {
      freeDailyUsed: daDung,
      freeDailyLimit: CAU_HINH_UNG_HO.freeAskDailyLimit,
      supporterBalance: soDu,
      remaining: conSupporter ? soDu + conMienPhi : conMienPhi,
    },
    longReportsRemaining: conSupporter ? (data?.supporter_long_report_balance ?? 0) : 0,
    profileLimit: conSupporter
      ? CAU_HINH_UNG_HO.profileLimitSupporter
      : CAU_HINH_UNG_HO.profileLimitFree,
    features: {
      deepMap: conSupporter,
      journeyDetail: conSupporter,
      connectionFull: conSupporter,
      expertExport: conSupporter,
    },
    cauHinh: CAU_HINH_CHUNG,
  };
}

/** Bậc quyền có được dùng một khả năng trả phí không */
export function moDuoc(quyen: Quyen, kha: keyof Quyen['features']): boolean {
  return quyen.tier === 'admin' || quyen.features[kha];
}
