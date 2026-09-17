import { docDonPayos } from '@/lib/payments/payos';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { CAU_HINH_UNG_HO } from './config';

/**
 * Đối soát một đơn với payOS.
 *
 * Vì sao cần: webhook là luồng chính, nhưng nó hỏng im lặng được — khai sai URL
 * ở payOS, gói tin rơi, hoặc khai webhook trước khi deploy có khoá. Khi đó người
 * dùng đã chuyển tiền, payOS báo thành công, còn Celestia vẫn treo đơn ở
 * `pending` mãi mãi. Đúng cảnh vừa gặp trên bản chạy thật.
 *
 * Hàm này KHÔNG phải cách đi vòng qua xác thực: vẫn là payOS nói đơn đã trả,
 * chỉ khác ở chỗ ta chủ động hỏi thay vì ngồi chờ được báo. Số tiền vẫn đối
 * chiếu, và việc cấp quyền vẫn đi qua `cap_quyen_ung_ho` — hàm có
 * `unique(payment_id)` nên webhook về sau cũng không cấp thêm lần nữa.
 */

interface Don {
  id: string;
  order_code: string | number;
  payment_link_id: string | null;
  amount_vnd: string | number;
  status: string;
}

export type KetQuaDoiSoat = 'da-cap' | 'chua-tra' | 'huy' | 'het-han' | 'lech-tien' | 'khong-doi';

export async function doiSoatDon(don: Don): Promise<KetQuaDoiSoat> {
  // Chỉ đụng tới đơn còn đang chờ. Đơn đã cấp quyền thì không được chạm nữa.
  if (don.status !== 'pending' && don.status !== 'paid') return 'khong-doi';

  const db = taoSupabaseAdmin();
  if (!db) return 'khong-doi';

  const ben = await docDonPayos(don.payment_link_id ?? don.order_code);
  if (!ben) return 'khong-doi';

  const nay = new Date().toISOString();

  if (ben.status === 'CANCELLED') {
    await db.from('support_payments').update({ status: 'cancelled', updated_at: nay }).eq('id', don.id);
    return 'huy';
  }
  if (ben.status === 'EXPIRED') {
    await db.from('support_payments').update({ status: 'expired', updated_at: nay }).eq('id', don.id);
    return 'het-han';
  }
  if (ben.status !== 'PAID') return 'chua-tra';

  // Trả rồi, nhưng số tiền phải khớp mới được cấp
  if (Number(don.amount_vnd) !== Number(ben.amount)) {
    await db
      .from('support_payments')
      .update({ status: 'verification_failed', updated_at: nay })
      .eq('id', don.id);
    return 'lech-tien';
  }

  await db
    .from('support_payments')
    .update({
      status: 'paid',
      provider_reference: ben.reference ?? null,
      provider_paid_at: nay,
      updated_at: nay,
    })
    .eq('id', don.id);

  const { error } = await db.rpc('cap_quyen_ung_ho', {
    p_payment_id: don.id,
    p_gio_hieu_luc: CAU_HINH_UNG_HO.supporterDurationHours,
    p_so_cau: CAU_HINH_UNG_HO.supporterAskQuotaPerPayment,
    p_so_bao_cao: CAU_HINH_UNG_HO.supporterLongReportsPerPayment,
  });

  if (error) {
    console.error('[ung-ho] đối soát: cấp quyền hỏng:', error.message);
    return 'khong-doi';
  }
  return 'da-cap';
}
