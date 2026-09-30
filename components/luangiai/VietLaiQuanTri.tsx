'use client';

import { useEffect, useState } from 'react';

/**
 * VIẾT LẠI (QUẢN TRỊ) — 30/09/2026, chủ dự án: "tự test gen lại khi có thay đổi cách luận".
 *
 * "Tạo bản mới" chỉ viết lại khi KHO tri thức đổi, nên sửa prompt / khung xong thì bài cũ
 * vẫn nằm trong đệm. Nút này gửi `vietLai: true` — route bỏ qua đệm của phần đang xem, viết
 * lại bằng cách luận hiện tại và ghi đè. Chỉ quản trị viên thấy nút; route kiểm lại quyền
 * (ẩn nút không phải phân quyền). Người dùng thường không bao giờ thấy khối này.
 */
export function useLaQuanTri(): boolean {
  const [la, setLa] = useState(false);
  useEffect(() => {
    // Dùng chung cổng kiểm quyền với nút xuất luận giải (CEL-137)
    fetch('/api/admin/xuat-luan-giai')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLa(Boolean(d?.laAdmin)))
      .catch(() => setLa(false));
  }, []);
  return la;
}

export function VietLaiQuanTri({ phan, onVietLai, ketQua }: {
  /** Tên phần sẽ viết lại, vd "Sự nghiệp", "phần tổng quan" */
  phan: string;
  onVietLai: () => void;
  /** Câu viết lại hỏng (route trả vietLaiHong) — đang hiện bản cũ */
  ketQua?: string[];
}) {
  const laQuanTri = useLaQuanTri();
  const [hoi, setHoi] = useState(false);
  if (!laQuanTri) return null;
  return (
    <div className="card flex flex-col gap-[8px]" style={{ borderStyle: 'dashed' }}>
      <span className="eyebrow">Quản trị</span>
      <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
        Viết lại {phan} bằng cách luận hiện tại, bỏ qua bài đã lưu. Bài mới ghi đè bài cũ cho lá số này — mọi người mở lá số này sẽ thấy bản mới.
      </p>
      {ketQua && ketQua.length > 0 && (
        <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
          Chưa viết lại được: {ketQua.join(', ')} — đang hiện bản cũ.
        </p>
      )}
      {hoi ? (
        <div className="flex flex-wrap gap-[8px]">
          <button type="button" className="btn-primary btn-sm" onClick={() => { setHoi(false); onVietLai(); }}>
            Viết lại ngay
          </button>
          <button type="button" className="btn-outline btn-sm" onClick={() => setHoi(false)}>
            Thôi
          </button>
        </div>
      ) : (
        <button type="button" className="btn-outline btn-sm self-start" onClick={() => setHoi(true)}>
          Viết lại (quản trị)
        </button>
      )}
    </div>
  );
}
