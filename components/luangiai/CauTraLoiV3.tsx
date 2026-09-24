'use client';

import { useEffect, useState } from 'react';
import { ghiSuKien } from '@/lib/analytics';

/**
 * Trạng thái chờ của luận giải v3.
 *
 * Bài đã đệm về trong khoảng một giây; bản trước vẫn hiện ngay "lần đầu mất
 * khoảng nửa phút", nên người đọc tưởng mỗi lần mở là một lần sinh lại (chủ dự
 * án phản ánh 24/09/2026). Chỉ nói tới "lần đầu" khi đã chờ quá 3 giây — lúc
 * đó mới thật sự là đang viết.
 */
export function DangDocV3({ chu = 'Celes đang mở bài' }: { chu?: string }) {
  const [lau, setLau] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLau(true), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="body-text" style={{ color: 'var(--fg)' }}>
        {lau ? 'Celes đang viết phần này cho lá số của bạn' : chu}
        <span className="dot-dang-doc" aria-hidden />
      </p>
      {lau && (
        <p className="body-sm max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
          Lần đầu mất khoảng nửa phút, vì mỗi câu được luận từ đúng những cung liên quan. Bài được lưu
          lại, các lần mở sau hiện ngay.
        </p>
      )}
    </div>
  );
}

export interface CauV3 {
  id: string;
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  doRo: 'Rõ' | 'Khá rõ' | 'Gợi ý';
  chuaViet: boolean;
}

/**
 * Một câu hỏi của luận giải v3: câu hỏi → bài luận liền mạch → "Muốn biết vì
 * sao không?" (ẩn mặc định).
 *
 * Phần vì sao ẨN vì nó viết bằng tên sao, tên cung — ngôn ngữ của người biết
 * Tử Vi. Người mới đọc bài luận là đủ; người muốn kiểm thì bấm mở.
 *
 * Nhãn "Độ rõ" đã bỏ khỏi giao diện theo yêu cầu chủ dự án (24/09/2026). Trường
 * `doRo` vẫn nằm trong dữ liệu để đo và để dùng lại khi cần.
 */
export function CauTraLoiV3({ cau, so }: { cau: CauV3; so?: number }) {
  const [mo, setMo] = useState(false);

  const tieuDe = (
    <h3 className="flex items-start gap-[12px] text-[19px] font-semibold leading-snug" style={{ color: 'var(--fg)' }}>
      {so !== undefined && (
        <span
          className="mt-[2px] inline-flex h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--action-fg)' }}
          aria-hidden
        >
          {so}
        </span>
      )}
      <span>{cau.cauHoi}</span>
    </h3>
  );

  if (cau.chuaViet) {
    return (
      <article className="flex flex-col gap-[8px]">
        {tieuDe}
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Celes chưa viết được câu này. Mở lại trang sau ít phút để thử lại.
        </p>
      </article>
    );
  }

  const doan = cau.luanGiai.split(/\n\s*\n/).filter((x) => x.trim());

  return (
    <article className="flex flex-col gap-[12px]">
      {tieuDe}
      {doan.map((d, i) => (
        <p key={i} className="body-text" style={{ color: 'var(--fg)' }}>
          {d}
        </p>
      ))}
      <button
        type="button"
        className="link-text link-action self-start text-[14px]"
        aria-expanded={mo}
        onClick={() => {
          if (!mo) ghiSuKien('why_opened', { cau: cau.id });
          setMo(!mo);
        }}
      >
        {mo ? 'Thu gọn' : 'Muốn biết vì sao không?'}
      </button>
      {mo && (
        <div className="flex flex-col gap-[8px] pl-[16px]" style={{ borderLeft: '2px solid var(--accent)' }}>
          <p className="eyebrow">Căn cứ trên lá số của bạn</p>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {cau.viSao}
          </p>
        </div>
      )}
    </article>
  );
}
