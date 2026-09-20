'use client';

import { useEffect, useState } from 'react';

/**
 * Còn mấy lượt đọc sâu hôm nay.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN
 *
 * Hạn mức một bài mỗi ngày có từ trước, nhưng người dùng chỉ biết mình đã hết
 * khi đã bấm và bị chặn. Chặn sau khi bấm là dạng từ chối tệ nhất: họ đã quyết
 * định đọc, đã chờ trang chuyển, rồi mới nhận ra hôm nay không được.
 *
 * ---------------------------------------------------------------------------
 * IM LẶNG KHI KHÔNG CHẮC
 *
 * Máy chủ trả `chua-ro` khi chưa cấu hình Supabase, khi chưa đăng nhập, hoặc
 * khi phép đếm hỏng. Cả ba trường hợp đều hiện lại đúng câu tĩnh cũ, không
 * đoán một con số. Hứa "còn 1 lượt" rồi chặn ở bước sau tệ hơn hẳn so với
 * không hứa gì.
 */
type Luot =
  | { bac: 'chua-ro' }
  | { bac: 'admin' }
  | { bac: 'supporter'; soDu: number }
  | { bac: 'thuong'; conLai: number; hanMuc: number };

export function LuotBaiSau({ macDinh }: { macDinh: string }) {
  const [luot, setLuot] = useState<Luot | null>(null);

  useEffect(() => {
    let huy = false;
    fetch('/api/luot-bai-sau')
      .then((r) => r.json())
      .then((d) => {
        if (!huy) setLuot(d as Luot);
      })
      .catch(() => {
        /* im lặng: câu tĩnh vẫn đúng */
      });
    return () => {
      huy = true;
    };
  }, []);

  const chu =
    luot?.bac === 'admin'
      ? 'Bạn không bị giới hạn lượt.'
      : luot?.bac === 'supporter'
        ? `Bạn còn ${luot.soDu} lượt đã ủng hộ.`
        : luot?.bac === 'thuong'
          ? luot.conLai > 0
            ? `Hôm nay bạn còn ${luot.conLai}/${luot.hanMuc} lượt.`
            : 'Hôm nay bạn đã dùng hết lượt miễn phí.'
          : macDinh;

  return <span className="caption">{chu}</span>;
}
