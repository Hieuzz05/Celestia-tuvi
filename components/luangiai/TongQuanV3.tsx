'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui';
import { CauTraLoiV3, type CauV3 } from './CauTraLoiV3';

export interface ThongTinLaSoV3 {
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: 'nam' | 'nu';
  namXem: number;
}

/**
 * LUẬN GIẢI TỔNG QUAN v3 — 11 câu, mở cho cả khách.
 *
 * Hỏng thì báo lên qua `onHong` để trang dựng lại bảng lĩnh vực cũ (đường lùi
 * tất định): người đọc không bao giờ nhận một khoảng trống chỉ vì Celes lỗi.
 *
 * Khoá theo đủ thông tin sinh + năm xem: đổi năm là một bài khác. State kết quả
 * mang theo khoá của chính nó, và "đang đọc" là DẪN XUẤT từ việc khoá đó khớp
 * hay chưa — không setState đồng bộ trong effect (luật lint kho này đang giữ).
 */
export function TongQuanV3({ laSo, onHong }: { laSo: ThongTinLaSoV3; onHong?: () => void }) {
  const khoa = `${laSo.ngay}-${laSo.thang}-${laSo.nam}-${laSo.gio}-${laSo.gioiTinh}|${laSo.namXem}`;
  const [kq, setKq] = useState<{ khoa: string; cau: CauV3[] | null } | null>(null);

  useEffect(() => {
    let huy = false;
    fetch('/api/luan-giai-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...laSo, nhom: 'tong-quan' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        const cau = Array.isArray(d?.cau) ? (d.cau as CauV3[]) : null;
        setKq({ khoa, cau });
        if (!cau || cau.every((c) => c.chuaViet)) onHong?.();
      })
      .catch(() => {
        if (huy) return;
        setKq({ khoa, cau: null });
        onHong?.();
      });
    return () => {
      huy = true;
    };
    // laSo đã nằm trọn trong khoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa]);

  const dangDoc = !kq || kq.khoa !== khoa;
  if (!dangDoc && !kq.cau) return null;

  return (
    <section className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[8px]">
        <Eyebrow>Luận giải tổng quan</Eyebrow>
        <h2 className="text-[22px] font-semibold" style={{ color: 'var(--fg)' }}>
          Bức tranh chung của lá số
        </h2>
        <p className="body-sm max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          Mười một câu hỏi người ta hay tự hỏi khi xem lá số. Mỗi câu có phần căn cứ nếu bạn muốn
          biết Celes dựa vào đâu.
        </p>
      </div>

      {dangDoc ? (
        <div className="flex flex-col gap-[8px]">
          <p className="body-text" style={{ color: 'var(--fg)' }}>
            Celes đang đọc lá số của bạn
            <span className="dot-dang-doc" aria-hidden />
          </p>
          <p className="body-sm max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
            Lần đầu mất khoảng nửa phút, vì mỗi câu được luận từ đúng những cung liên quan. Các lần
            mở sau sẽ hiện ngay.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[24px]">
          {kq.cau!.map((c) => (
            <CauTraLoiV3 key={c.id} cau={c} />
          ))}
        </div>
      )}
    </section>
  );
}
