'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { CelesMascot } from '@/components/CelesMascot';

/**
 * Trạng thái chờ của luận giải v3.
 *
 * Bài đã đệm về trong khoảng một giây; bản trước vẫn hiện ngay "lần đầu mất
 * khoảng nửa phút", nên người đọc tưởng mỗi lần mở là một lần sinh lại (chủ dự
 * án phản ánh 24/09/2026). Chỉ nói tới "lần đầu" khi đã chờ quá 3 giây — lúc
 * đó mới thật sự là đang viết.
 *
 * `celes`: chỉ bật ở lần chờ ĐẦU của một bài (/luan-giai/sau), không ở các
 * chỗ "đang viết tiếp" giữa bài. Ô 80px giữ chỗ ngay từ lúc gắn để không nhảy
 * layout; ảnh hiện trễ 3 giây bằng CSS, cùng mốc với `lau` — bài đệm về sớm
 * thì không bao giờ thấy linh vật.
 */
export function DangDocV3({ chu = 'Celes đang mở bài', celes = false }: { chu?: string; celes?: boolean }) {
  const [lau, setLau] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLau(true), 3000);
    return () => clearTimeout(t);
  }, []);
  const chuDoc = (
    <div className="flex min-w-0 flex-col gap-[8px]">
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
  if (!celes) return chuDoc;
  return (
    <div className="flex items-start gap-[16px]">
      <div className="celes-tre" style={{ '--celes-tre': '3s' } as CSSProperties}>
        <CelesMascot cho="cho" trangThai="thinking" cao={80} caoNho={64} />
      </div>
      {chuDoc}
    </div>
  );
}
