'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, Shell, The } from '@/components/ui';

/**
 * Trang vận hành Support Celes.
 *
 * Nằm trong /admin nên không có liên kết nào trên giao diện người dùng — vào
 * bằng địa chỉ, giống trang quản trị chính.
 *
 * Chỉ đọc. Spec cho phép admin đối soát tay và cấp/thu quyền, nhưng mỗi thao
 * tác đó phải kèm nhật ký kiểm toán; chưa có nhật ký thì không mở đường sửa
 * tiền, hơn là mở rồi không ai lần lại được ai đã đổi gì.
 */

interface SoLieu {
  tongTienDaNhan: number;
  soLanCapQuyen: number;
  soNguoiDangLaSupporter: number;
  theoTrangThai: Record<string, number>;
  theoNguon: Record<string, number>;
  canSoat: number;
  donGanDay: { soTien: number; lyDo: string; trangThai: string; luc: string }[];
}

export default function TrangQuanTriUngHo() {
  const [d, setD] = useState<SoLieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/support', { cache: 'no-store' })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).loi))))
      .then(setD)
      .catch((e) => setLoi(e instanceof Error ? e.message : 'Không đọc được'));
  }, []);

  if (loi) {
    return (
      <Shell className="py-[48px]">
        <h1 className="heading-sm">{loi}</h1>
      </Shell>
    );
  }
  if (!d) return <Shell className="py-[48px]"><span /></Shell>;

  const o = (n: number) => n.toLocaleString('vi-VN');

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · ỦNG HỘ</Eyebrow>
        <h1 className="heading-sm">Tình hình Support Celes</h1>
        <Link href="/admin" className="link-text mt-[10px] inline-block">
          ← Trang quản trị
        </Link>
      </div>

      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { nhan: 'Tổng tiền đã nhận', gt: `${o(d.tongTienDaNhan)}đ` },
          { nhan: 'Số lần cấp quyền', gt: o(d.soLanCapQuyen) },
          { nhan: 'Đang là Supporter', gt: o(d.soNguoiDangLaSupporter) },
          { nhan: 'Đơn cần soát tay', gt: o(d.canSoat) },
        ].map((x) => (
          <The key={x.nhan} className="flex flex-col gap-[8px]">
            <Eyebrow>{x.nhan}</Eyebrow>
            <span className="text-[26px] font-semibold tabular-nums" style={{ color: 'var(--fg)' }}>
              {x.gt}
            </span>
          </The>
        ))}
      </div>

      <div className="grid gap-[16px] md:grid-cols-2">
        <The className="flex flex-col gap-[8px]">
          <Eyebrow>Đơn theo trạng thái</Eyebrow>
          {Object.entries(d.theoTrangThai).map(([k, v]) => (
            <div key={k} className="flex justify-between body-sm">
              <span style={{ color: 'var(--fg-muted)' }}>{k}</span>
              <span className="tabular-nums" style={{ color: 'var(--fg)' }}>{v}</span>
            </div>
          ))}
        </The>

        <The className="flex flex-col gap-[8px]">
          <Eyebrow>Mở từ tính năng nào</Eyebrow>
          {Object.keys(d.theoNguon).length === 0 ? (
            <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>Chưa có đơn thành công</span>
          ) : (
            Object.entries(d.theoNguon).map(([k, v]) => (
              <div key={k} className="flex justify-between body-sm">
                <span style={{ color: 'var(--fg-muted)' }}>{k}</span>
                <span className="tabular-nums" style={{ color: 'var(--fg)' }}>{v}</span>
              </div>
            ))
          )}
        </The>
      </div>

      <section className="flex flex-col gap-[12px]">
        <Eyebrow>20 đơn gần nhất</Eyebrow>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                {['Lúc', 'Số tiền', 'Trạng thái', 'Mở từ'].map((h) => (
                  <th key={h} className="caption pb-[8px] font-normal" style={{ borderBottom: '1px solid var(--line)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.donGanDay.map((x, i) => (
                <tr key={i}>
                  <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {new Date(x.luc).toLocaleString('vi-VN')}
                  </td>
                  <td className="body-sm py-[9px] tabular-nums" style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                    {o(x.soTien)}đ
                  </td>
                  <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {x.trangThai}
                  </td>
                  <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                    {x.lyDo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
