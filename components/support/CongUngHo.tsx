'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NutChinh, NutVien, O, PillTag } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useT } from '@/lib/i18n/context';
import type { LyDoUngHo } from '@/lib/support/config';
import { useQuyen } from '@/lib/support/useQuyen';

/**
 * Cổng ủng hộ + chọn số tiền.
 *
 * Hai bước trong một hộp: giải thích vì sao gặp cổng, rồi mới tới tiền. Gộp làm
 * một màn thì lời mời biến thành bảng giá; tách hẳn hai modal thì thêm một cú
 * bấm mà chẳng nói thêm điều gì.
 *
 * Giọng ở đây do brand spec chốt: đây là một lời mời, không phải cảnh báo hết
 * lượt. Không đếm ngược, không "mua ngay", không doạ.
 */

interface BoiCanhQuayLai {
  path: string;
  profileId?: string | null;
  draftMessage?: string | null;
  year?: number | null;
  month?: number | null;
}

/**
 * Hộp này do phía gọi tự gắn vào và tháo ra (`{mo && <CongUngHo …/>}`) chứ không
 * nhận cờ `mo`. Giữ nó luôn nằm trong cây rồi tự ẩn thì mỗi lần mở lại phải đặt
 * lại state bằng effect — đúng kiểu cascading render mà lint chặn.
 */
export function CongUngHo({
  lyDo,
  onDong,
  quayLai,
}: {
  lyDo: LyDoUngHo;
  onDong: () => void;
  /** Nơi và ngữ cảnh cần khôi phục sau khi trả xong */
  quayLai: BoiCanhQuayLai;
}) {
  const t = useT();
  const router = useRouter();
  const { quyen } = useQuyen();
  const [buoc, setBuoc] = useState<'moi' | 'tien'>('moi');
  const [soTien, setSoTien] = useState<number | null>(null);
  const [soKhac, setSoKhac] = useState('');
  const [dangTao, setDangTao] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    ghiSuKien('support_gate_viewed', { reason: lyDo, sourceRoute: quayLai.path });
  }, [lyDo, quayLai.path]);

  const chu = t.ungHo.cong[lyDo];
  const ch = quyen?.cauHinh;
  const goiY = ch?.suggestedAmounts ?? [19000, 39000, 79000];
  const chon = soTien ?? (soKhac ? Number(soKhac.replace(/\D/g, '')) : null);

  const dong = () => {
    ghiSuKien('support_gate_closed', { reason: lyDo });
    onDong();
  };

  const taoDon = async () => {
    if (!chon) return;
    setDangTao(true);
    setLoi(null);
    ghiSuKien('support_payment_create_started', { reason: lyDo, amount: chon });
    try {
      const res = await fetch('/api/support/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: chon, reason: lyDo, returnTo: quayLai }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? t.ungHo.loiTao);
      ghiSuKien('support_payment_created', { reason: lyDo, amount: chon });
      router.push(`/support/checkout/${data.paymentId}`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t.ungHo.loiTao);
      setDangTao(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={chu.tieuDe}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-[24px]"
      style={{ background: 'rgba(36, 0, 41, 0.55)' }}
    >
      <div
        className="flex w-full max-w-[520px] flex-col gap-[16px] rounded-[var(--radius-cards)] p-[28px]"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-elevated)' }}
      >
        {buoc === 'moi' ? (
          <>
            <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>
              {chu.tieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {dien(chu.moTa, {
                tong: ch?.freeAskDailyLimit ?? 5,
                soHoSoFree: ch?.profileLimitFree ?? 1,
                soHoSoPlus: ch?.profileLimitSupporter ?? 5,
              })}
            </p>

            <ul className="flex flex-col gap-[6px]">
              {t.ungHo.loiIch.map((l) => (
                <li key={l} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  · {l}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-[12px]">
              <NutChinh onClick={() => setBuoc('tien')}>{chu.cta}</NutChinh>
              <button onClick={dong} className="link-text">
                {lyDo === 'ask_quota' ? t.ungHo.quayLaiNgayMai : t.ungHo.dong}
              </button>
            </div>

            <p className="caption">{t.ungHo.khongPhuThuocSoTien}</p>
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.ungHo.soTienTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.ungHo.soTienMoTa}
            </p>

            <div className="flex flex-wrap gap-[10px]">
              {goiY.map((m) => (
                <PillTag
                  key={m}
                  dangChon={soTien === m}
                  onClick={() => {
                    setSoTien(m);
                    setSoKhac('');
                    ghiSuKien('support_amount_selected', { amount: m, reason: lyDo });
                  }}
                >
                  {m.toLocaleString('vi-VN')}đ
                </PillTag>
              ))}
            </div>

            <label className="flex flex-col gap-[6px]">
              <span className="field-label">{t.ungHo.soKhac}</span>
              <O
                inputMode="numeric"
                placeholder={t.ungHo.nhapSoTien}
                value={soKhac ? Number(soKhac).toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  setSoKhac(e.target.value.replace(/\D/g, '').slice(0, 9));
                  setSoTien(null);
                }}
                onBlur={() => soKhac && ghiSuKien('support_custom_amount_entered', { reason: lyDo })}
              />
            </label>

            <div className="flex flex-col gap-[6px]">
              <span className="eyebrow">{t.ungHo.banNhanDuoc}</span>
              <ul className="flex flex-col gap-[4px]">
                {t.ungHo.nhan.map((n) => (
                  <li key={n} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    · {n}
                  </li>
                ))}
              </ul>
            </div>

            {loi && (
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-[12px]">
              <NutChinh onClick={taoDon} disabled={!chon || dangTao}>
                {dangTao ? t.ungHo.dangTao : t.ungHo.tiepTucThanhToan}
              </NutChinh>
              <NutVien nho onClick={() => setBuoc('moi')}>
                {t.chung.quayLai}
              </NutVien>
              <button onClick={dong} className="link-text">
                {t.ungHo.dong}
              </button>
            </div>

            <p className="caption">{t.ungHo.chuyenKhoanAnToan}</p>
          </>
        )}
      </div>
    </div>
  );
}
