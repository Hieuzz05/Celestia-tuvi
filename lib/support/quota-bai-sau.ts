import { NextResponse } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';
import { CAU_HINH_UNG_HO } from './config';

/**
 * Hạn mức cho BÀI LUẬN GIẢI SÂU — mỗi tài khoản một bài mỗi ngày.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO KHÔNG DÙNG LẠI `quota.ts`
 *
 * Bộ kia đếm câu Hỏi Celes, và phép đếm nằm trong hàm `dat_cho_cau_hoi` ở
 * Postgres cùng hai cột `free_ask_used` / `free_ask_date`. Muốn dùng lại thì
 * phải thêm cột mới và sửa hàm SQL — tức là chủ dự án phải mở Supabase chạy tay
 * một lần nữa trước khi tính năng chạy được.
 *
 * Bảng `usage_events` thì đã có sẵn, đã có chỉ mục `(user_id, created_at desc)`,
 * và đã có đúng nhãn `long_report` trong danh sách feature của nó. Đếm trên đó
 * là không phải chạy SQL nào cả.
 *
 * ---------------------------------------------------------------------------
 * ĐẶT CHỖ TRƯỚC RỒI MỚI ĐẾM, không đếm trước rồi mới đặt
 *
 * Một bài sâu mất 25–45 giây. Đếm trước rồi mới ghi thì trong khoảng ấy người
 * dùng mở thêm tab là qua được cổng, vì cả hai lượt đều đọc thấy số 0.
 *
 * Nên: ghi dòng đặt chỗ TRƯỚC, rồi đếm. Ai ghi sau sẽ tự thấy dòng của người
 * ghi trước và tự rút lui. Không cần khoá, không cần giao dịch.
 *
 * ---------------------------------------------------------------------------
 * BA BẬC, theo đúng thứ tự
 *
 *   admin       không giới hạn, và KHÔNG ghi dòng nào
 *   supporter   trừ vào `supporter_long_report_balance` đã mua
 *   thường      một bài mỗi ngày, hết thì mời ủng hộ
 *
 * Chưa cấu hình Supabase thì cho qua hết — khoá lúc ấy là tự nhốt mình chứ
 * không bảo vệ được gì, giống cách `cong.ts` và `quota.ts` đã xử.
 */

export type NguonBaiSau = 'free_daily' | 'supporter' | 'admin_exempt';

export interface KetQuaDatChoBaiSau {
  duocPhep: boolean;
  nguon?: NguonBaiSau;
  /** Số bài miễn phí đã dùng hôm nay, sau khi tính lượt này */
  daDung?: number;
  hanMuc?: number;
  /** Còn bao nhiêu bài đã mua — chỉ có nghĩa với supporter */
  soDuConLai?: number;
  chan?: NextResponse;
}

const CHUA_CAU_HINH: KetQuaDatChoBaiSau = { duocPhep: true, nguon: 'admin_exempt' };

/** Mốc 00:00 hôm nay theo giờ Việt Nam, trả về ISO để so với `created_at` */
function dauNgayVN(): string {
  const ngay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  // +07:00 là giờ Việt Nam, không đổi theo mùa
  return new Date(`${ngay}T00:00:00+07:00`).toISOString();
}

function chanHetLuot(hanMuc: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'DEEP_READ_QUOTA_EXHAUSTED',
        message: `Hôm nay bạn đã dùng ${hanMuc} bài luận giải sâu miễn phí.`,
        supportEligible: true,
      },
      // Giữ cùng hình dạng lỗi với cổng Hỏi Celes để giao diện không phải học
      // thêm một dạng lỗi thứ hai
      loi: `Hôm nay bạn đã dùng ${hanMuc} bài luận giải sâu miễn phí. Ủng hộ Celes để mở thêm.`,
      canUngHo: true,
      lyDo: 'long_report',
    },
    { status: 429 }
  );
}

export async function datChoBaiSau(requestId: string): Promise<KetQuaDatChoBaiSau> {
  if (!supabaseDaCauHinh) return CHUA_CAU_HINH;

  const user = await nguoiDungHienTai();
  if (!user) return CHUA_CAU_HINH; // cổng đăng nhập đã chặn trước đó

  // Admin không bị tính lượt, và không ghi dòng nào — nhật ký dùng để đo hành
  // vi người dùng thật, lẫn lượt của người vận hành vào là làm hỏng số liệu
  if (laAdmin(user.email)) return { duocPhep: true, nguon: 'admin_exempt' };

  const db = taoSupabaseAdmin();
  if (!db) {
    console.warn('[bai-sau] thiếu SUPABASE_SERVICE_ROLE_KEY, không áp được hạn mức');
    return CHUA_CAU_HINH;
  }

  const hanMuc = CAU_HINH_UNG_HO.freeDeepReadDailyLimit;

  // --- Supporter tiêu số dư đã mua trước, không tiêu lượt miễn phí ---
  const { data: quyen } = await db
    .from('user_entitlements')
    .select('supporter_expires_at, supporter_long_report_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  const conSupporter = Boolean(
    quyen?.supporter_expires_at && new Date(quyen.supporter_expires_at).getTime() > Date.now()
  );
  const soDu = quyen?.supporter_long_report_balance ?? 0;

  if (conSupporter && soDu > 0) {
    const { error } = await db
      .from('user_entitlements')
      .update({ supporter_long_report_balance: soDu - 1 })
      .eq('user_id', user.id)
      // Chỉ trừ khi số dư vẫn đúng như vừa đọc: hai yêu cầu song song thì chỉ
      // một cái khớp, cái kia rơi xuống nhánh miễn phí thay vì trừ hai lần
      .eq('supporter_long_report_balance', soDu);
    if (!error) {
      await ghiDatCho(db, user.id, requestId, 'supporter');
      return { duocPhep: true, nguon: 'supporter', soDuConLai: soDu - 1 };
    }
  }

  // --- Lượt miễn phí trong ngày ---
  await ghiDatCho(db, user.id, requestId, 'free_daily');

  const { count, error } = await db
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'long_report')
    .in('status', ['reserved', 'success'])
    .gte('created_at', dauNgayVN());

  if (error) {
    // Đếm hỏng thì cho qua: chặn người dùng vì lỗi hạ tầng của mình là sai
    console.warn('[bai-sau] không đếm được lượt trong ngày, bỏ qua hạn mức:', error.message);
    return { duocPhep: true, nguon: 'free_daily' };
  }

  const daDung = count ?? 1;
  if (daDung > hanMuc) {
    // Rút lại dòng vừa ghi, nếu không thì lần sau đếm vẫn thấy nó
    await db.from('usage_events').delete().eq('request_id', requestId);
    return { duocPhep: false, daDung: hanMuc, hanMuc, chan: chanHetLuot(hanMuc) };
  }

  return { duocPhep: true, nguon: 'free_daily', daDung, hanMuc };
}

async function ghiDatCho(
  db: NonNullable<ReturnType<typeof taoSupabaseAdmin>>,
  userId: string,
  requestId: string,
  nguon: NguonBaiSau
) {
  await db.from('usage_events').insert({
    user_id: userId,
    feature: 'long_report',
    status: 'reserved',
    quota_source: nguon,
    request_id: requestId,
  });
}

/**
 * Trả lại lượt khi bài hỏng.
 *
 * Người dùng mất một bài mỗi ngày vì lỗi phía mình là cái giá không ai chấp
 * nhận được — nhất là khi họ chỉ có ĐÚNG MỘT lượt.
 */
export async function hoanBaiSau(nguon: NguonBaiSau | undefined, requestId: string) {
  if (!supabaseDaCauHinh || !nguon || nguon === 'admin_exempt') return;
  const db = taoSupabaseAdmin();
  const user = await nguoiDungHienTai();
  if (!db || !user) return;

  await db.from('usage_events').delete().eq('request_id', requestId);

  if (nguon === 'supporter') {
    const { data } = await db
      .from('user_entitlements')
      .select('supporter_long_report_balance')
      .eq('user_id', user.id)
      .maybeSingle();
    await db
      .from('user_entitlements')
      .update({ supporter_long_report_balance: (data?.supporter_long_report_balance ?? 0) + 1 })
      .eq('user_id', user.id);
  }
}

/** Ghi nhận một bài đã viết xong */
export async function chotBaiSau(requestId: string, model?: string) {
  if (!supabaseDaCauHinh) return;
  const db = taoSupabaseAdmin();
  await db
    ?.from('usage_events')
    .update({ status: 'success', completed_at: new Date().toISOString(), model_name: model })
    .eq('request_id', requestId);
}
