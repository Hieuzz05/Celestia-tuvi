'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Eyebrow, HuyHieuOk, NutChinh, NutVien, Section, Shell, The } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useT } from '@/lib/i18n/context';

/**
 * Màn thanh toán một đơn ủng hộ.
 *
 * Điểm quan trọng nhất ở đây là thứ màn này KHÔNG làm: nó không đọc tham số
 * `status` trên URL trả về để kết luận đã trả xong. Tham số đó ai cũng gõ thêm
 * được. Trạng thái thật chỉ đến từ `/api/support/payments/:id`, mà cột trạng
 * thái trong bảng thì chỉ webhook đã xác thực chữ ký mới đổi được.
 *
 * Người dùng đóng trình duyệt giữa chừng cũng không mất gì: tiền về là webhook
 * cấp quyền, lần mở sau đọc lại là thấy.
 */

type TrangThai =
  | 'creating'
  | 'pending'
  | 'paid'
  | 'entitlement_granted'
  | 'cancelled'
  | 'expired'
  | 'create_failed'
  | 'verification_failed';

interface Don {
  paymentId: string;
  status: TrangThai;
  amount: number;
  expiresAt: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  entitlementGranted: boolean;
  supporterExpiresAt: string | null;
  returnTo: { path?: string; draftMessage?: string | null } | null;
}

type TrangThaiHienThi =
  | 'creating'
  | 'pending'
  | 'paid_processing_entitlement'
  | 'success'
  | 'cancelled'
  | 'expired'
  | 'failed';

/** Trạng thái kỹ thuật -> trạng thái người dùng đọc được */
function nhomTrangThai(d: Don | null, hetHan: boolean): TrangThaiHienThi {
  if (!d) return 'creating';
  if (d.entitlementGranted) return 'success';
  if (d.status === 'paid') return 'paid_processing_entitlement';
  if (d.status === 'cancelled') return 'cancelled';
  if (d.status === 'create_failed' || d.status === 'verification_failed') return 'failed';
  if (hetHan) return 'expired';
  return 'pending';
}

function demNguoc(den: string | null, bayGio: number): string {
  if (!den || !bayGio) return '';
  const con = new Date(den).getTime() - bayGio;
  if (con <= 0) return '00:00';
  const phut = Math.floor(con / 60000);
  const giay = Math.floor((con % 60000) / 1000);
  return `${String(phut).padStart(2, '0')}:${String(giay).padStart(2, '0')}`;
}

export function TrangThanhToan({ paymentId }: { paymentId: string }) {
  const t = useT();
  const router = useRouter();
  const [don, setDon] = useState<Don | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  // Mốc thời gian hiện tại giữ trong state chứ không gọi Date.now() lúc dựng
  // giao diện: gọi trong lúc render thì hai lần vẽ ra hai kết quả khác nhau.
  const [bayGio, setBayGio] = useState(0);
  const daBaoXong = useRef(false);

  const tai = useCallback(async (): Promise<Don | null> => {
    try {
      const res = await fetch(`/api/support/payments/${paymentId}`, { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as Don;
    } catch {
      return null;
    }
  }, [paymentId]);

  const capNhat = useCallback(
    (d: Don | null) => {
      setBayGio(Date.now());
      if (d) setDon(d);
      else setLoi(t.ungHo.loiTao);
    },
    [t.ungHo.loiTao]
  );

  useEffect(() => {
    ghiSuKien('support_checkout_opened');
    tai().then(capNhat);
  }, [tai, capNhat]);

  // Hỏi lại mỗi 3 giây trong lúc còn chờ. Dừng hẳn khi đã xong hoặc đã hết hạn —
  // để chạy tiếp là vừa tốn vừa giữ tab nóng mà không đổi được gì.
  useEffect(() => {
    if (don?.entitlementGranted || don?.status === 'cancelled') return;
    const id = setInterval(() => {
      tai().then(capNhat);
    }, 3000);
    return () => clearInterval(id);
  }, [tai, capNhat, don?.entitlementGranted, don?.status]);

  useEffect(() => {
    if (don?.entitlementGranted && !daBaoXong.current) {
      daBaoXong.current = true;
      ghiSuKien('support_entitlement_granted');
    }
  }, [don?.entitlementGranted]);

  const hetHan = Boolean(
    don?.expiresAt && bayGio > 0 && new Date(don.expiresAt).getTime() <= bayGio
  );
  const trangThai = nhomTrangThai(don, hetHan);
  const conLai = demNguoc(don?.expiresAt ?? null, bayGio);
  const soTien = don ? `${don.amount.toLocaleString('vi-VN')}đ` : '';

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[24px]">
        <div>
          <Eyebrow className="mb-[10px]">{t.ungHo.ten}</Eyebrow>
          <h1 className="heading-sm">{soTien}</h1>
        </div>

        <div className="grid gap-[16px] md:grid-cols-2">
          {/* Cột trái: mình đang trả cho cái gì */}
          <The className="flex flex-col gap-[12px]">
            <span className="eyebrow">{t.ungHo.banNhanDuoc}</span>
            <ul className="flex flex-col gap-[6px]">
              {t.ungHo.nhan.map((n) => (
                <li key={n} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  · {n}
                </li>
              ))}
            </ul>
            {don && (
              <p className="caption">
                {t.ungHo.donHoTro}: {don.paymentId.slice(0, 8).toUpperCase()}
                {conLai && trangThai === 'pending' ? ` · ${t.ungHo.hetHanSau} ${conLai}` : ''}
              </p>
            )}
          </The>

          {/* Cột phải: trả bằng cách nào, và đang tới đâu rồi */}
          <The className="flex flex-col items-start gap-[12px]">
            {/* aria-live để trình đọc màn hình thông báo khi trạng thái đổi */}
            <p className="body-text" aria-live="polite" style={{ color: 'var(--fg)' }}>
              {t.ungHo.trangThai[trangThai]}
            </p>

            {trangThai === 'pending' && (
              <>
                {don?.qrCode && (
                  <>
                    <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                      {t.ungHo.quetMa}
                    </p>
                    {/* Ảnh QR do payOS trả về dạng chuỗi dữ liệu VietQR; dựng bằng
                        dịch vụ ảnh của họ thì phải gọi ra ngoài, nên hiện chuỗi
                        kèm nút mở trang thanh toán là đường chắc chắn nhất. */}
                    <code
                      className="w-full overflow-x-auto rounded-[var(--radius-inputs)] p-[10px] text-[11px]"
                      style={{ background: 'var(--surface-panel)', color: 'var(--fg-muted)' }}
                      aria-label={dien(t.ungHo.maQrThayThe, { soTien })}
                    >
                      {don.qrCode}
                    </code>
                  </>
                )}
                {don?.checkoutUrl && (
                  <a
                    href={don.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    {t.ungHo.moTrangThanhToan}
                  </a>
                )}
              </>
            )}

            {trangThai === 'success' && (
              <>
                <HuyHieuOk>{t.ungHo.supporterDangHoatDong}</HuyHieuOk>
                {don?.supporterExpiresAt && (
                  <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    {dien(t.ungHo.denKhi, {
                      luc: new Date(don.supporterExpiresAt).toLocaleString('vi-VN'),
                    })}
                  </p>
                )}
                <NutChinh
                  onClick={() => {
                    ghiSuKien('support_resume_action');
                    router.push(don?.returnTo?.path ?? '/home');
                  }}
                >
                  {t.ungHo.tiepTucNoiDangDo}
                </NutChinh>
              </>
            )}

            {(trangThai === 'cancelled' || trangThai === 'failed') && (
              <Link href="/support" className="btn-primary">
                {t.ungHo.thuLai}
              </Link>
            )}

            {trangThai === 'expired' && (
              <Link href="/support" className="btn-primary">
                {t.ungHo.taoMaMoi}
              </Link>
            )}

            {loi && (
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}
          </The>
        </div>

        <NutVien nho onClick={() => router.push(don?.returnTo?.path ?? '/home')} className="self-start">
          {t.chung.quayLai}
        </NutVien>
      </Shell>
    </Section>
  );
}
