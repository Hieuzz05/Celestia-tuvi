'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, Shell } from '@/components/ui';
import type { DongPhanHoiAnToan } from '@/lib/rag/phan-hoi';

/**
 * CẦN DUYỆT (CEL-195) — hai hàng chờ trên một màn: nghiệm lý chưa duyệt và phản hồi 👎 của người dùng.
 * Chỉ dữ liệu an toàn: không câu hỏi, không câu trả lời, không người dùng (xem dongPhanHoiAnToan).
 */

interface DuLieu {
  nghiemLy: { muc_id: string; phien_ban: number; tao_luc: string }[];
  nghiemLyChuaCoBang: boolean;
  phanHoi: { huuIch: number; khongDung: number; theoLyDo: Record<string, number>; ds: DongPhanHoiAnToan[] };
}

const NHAN_LY_DO: Record<string, string> = {
  'sai-thuc-te': 'Sai với thực tế',
  'sai-thoi-diem': 'Sai thời điểm',
  'qua-chung': 'Quá chung chung',
  'gio-sinh-chua-chac': 'Ngày/giờ sinh có thể chưa chính xác',
  khac: 'Khác',
  'khong-ro': 'Không rõ',
};

async function docDuLieu(): Promise<DuLieu | { loi: string }> {
  try {
    const res = await fetch('/api/admin/can-duyet', { cache: 'no-store' });
    const j = await res.json();
    return res.ok ? (j as DuLieu) : { loi: j.loi ?? 'Không đọc được hàng chờ' };
  } catch {
    return { loi: 'Không kết nối được máy chủ' };
  }
}

export default function TrangCanDuyet() {
  const [d, setD] = useState<DuLieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    docDuLieu().then((kq) => {
      if ('loi' in kq) setLoi(kq.loi);
      else setD(kq);
    });
  }, []);

  const st = { borderColor: 'var(--line)' };
  const mo = { color: 'var(--fg-muted)' };

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · HÀNG CHỜ</Eyebrow>
        <h1 className="heading-sm">Cần duyệt</h1>
        <p className="body-sm mt-[12px]" style={mo}>
          Nghiệm lý đang chờ ký và phản hồi &ldquo;chưa đúng&rdquo; của người dùng trong 30 ngày. Màn này không hiện câu
          hỏi, câu trả lời hay danh tính người dùng.
        </p>
      </div>

      {loi && <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>{loi}</p>}

      {d && (
        <>
          <section className="flex flex-col gap-[8px] rounded-[var(--radius-cards)] border p-[16px]" style={st}>
            <h2 className="text-[16px] font-semibold">Nghiệm lý chờ duyệt ({d.nghiemLy.length})</h2>
            {d.nghiemLyChuaCoBang && <p className="text-[13px]" style={mo}>Chưa có bảng — cần chạy supabase/va-qd13-thu-vien.sql.</p>}
            {d.nghiemLy.map((n) => (
              <div key={`${n.muc_id}@${n.phien_ban}`} className="text-[14px]">
                <strong>{n.muc_id}</strong> v{n.phien_ban} <span style={mo}>· {n.tao_luc.slice(0, 10)}</span>
              </div>
            ))}
            {!!d.nghiemLy.length && <Link href="/admin/nghiem-ly" className="link-text text-[13px]">Mở Nghiệm lý của tôi để duyệt</Link>}
          </section>

          <section className="flex flex-col gap-[8px] rounded-[var(--radius-cards)] border p-[16px]" style={st}>
            <h2 className="text-[16px] font-semibold">Phản hồi 30 ngày</h2>
            <p className="text-[14px]">
              👍 {d.phanHoi.huuIch} · 👎 {d.phanHoi.khongDung}
            </p>
            <div className="flex flex-wrap gap-[12px] text-[13px]" style={mo}>
              {Object.entries(d.phanHoi.theoLyDo).map(([k, v]) => (
                <span key={k}>{NHAN_LY_DO[k] ?? k}: {v}</span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={mo} className="text-left">
                    <th className="py-[4px] pr-[8px]">Lượt</th>
                    <th className="pr-[8px]">Lúc</th>
                    <th className="pr-[8px]">Lý do</th>
                    <th className="pr-[8px]">Đường / phiên bản</th>
                    <th>Mã lỗi kiểm duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {d.phanHoi.ds.map((r) => (
                    <tr key={r.ma + r.luc} className="border-t" style={st}>
                      <td className="py-[4px] pr-[8px] font-mono">{r.ma}</td>
                      <td className="pr-[8px]">{r.luc.slice(0, 16).replace('T', ' ')}</td>
                      <td className="pr-[8px]">{NHAN_LY_DO[r.lyDo ?? 'khong-ro']}</td>
                      <td className="pr-[8px] font-mono">{Object.entries(r.phienBan).map(([k, v]) => `${k}=${v}`).join(' ')}</td>
                      <td className="font-mono">{r.maLoi.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
