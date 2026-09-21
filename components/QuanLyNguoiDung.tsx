'use client';

import { useEffect, useState } from 'react';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

interface LaSoCuaUser {
  id: string;
  hoTen: string;
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: 'nam' | 'nu';
  taoLuc: string;
}

interface NguoiDung {
  id: string;
  email: string | null;
  tenHienThi: string | null;
  taoLuc: string;
  dangNhapCuoi: string | null;
  laQuanTri: boolean;
  soLuanGiai: number;
  laSo: LaSoCuaUser[];
}

function tomTatLaSo(l: LaSoCuaUser): string {
  try {
    const ls = lapLaSo({
      ngay: l.ngay,
      thang: l.thang,
      nam: l.nam,
      gio: l.gio,
      gioiTinh: l.gioiTinh,
    });
    return `Mệnh ${CHI[ls.menhIndex]} · ${ls.cuc.ten} · ${ls.banMenh.ten}`;
  } catch {
    return 'Không tính được lá số';
  }
}

const ngayGio = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export function QuanLyNguoiDung() {
  const [ds, setDs] = useState<NguoiDung[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [moRong, setMoRong] = useState<string | null>(null);
  const [daTai, setDaTai] = useState(false);

  useEffect(() => {
    fetch('/api/admin/nguoi-dung')
      .then((r) => r.json())
      .then((d) => {
        if (d.loi) setLoi(d.loi);
        else setDs(d.nguoiDung ?? []);
        setDaTai(true);
      })
      .catch(() => {
        setLoi('Không kết nối được tới máy chủ');
        setDaTai(true);
      });
  }, []);

  if (!daTai) return null;

  return (
    <section className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[8px]">
        <h2 className="heading-sm">Tài khoản {ds.length > 0 && `(${ds.length})`}</h2>
        <p className="body-text max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          Danh sách người dùng và lá số họ đã lưu. Đây là dữ liệu cá nhân — ngày giờ sinh của người
          khác — nên chỉ dùng cho việc vận hành, đừng chia sẻ ra ngoài.
        </p>
      </div>

      {loi && (
        <p
          className="rounded-[var(--radius-cards)] border p-[14px] text-[13px]"
          style={{ borderColor: 'var(--chart-hung)', color: 'var(--chart-hung)' }}
        >
          {loi}
        </p>
      )}

      {!loi && ds.length === 0 && (
        <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
          Chưa có tài khoản nào đăng ký.
        </p>
      )}

      <div className="flex flex-col">
        {ds.map((u) => (
          <div key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
            <button
              onClick={() => setMoRong(moRong === u.id ? null : u.id)}
              className="flex w-full flex-wrap items-baseline justify-between gap-[12px] py-[14px] text-left"
            >
              <div className="flex flex-col gap-[4px]">
                <span className="flex items-baseline gap-[8px]">
                  <span className="text-[15px]" style={{ color: 'var(--fg)' }}>
                    {u.tenHienThi || u.email?.split('@')[0] || 'Không tên'}
                  </span>
                  {u.laQuanTri && (
                    <span className="pill-tag">Quản trị</span>
                  )}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {u.email} · đăng ký {ngayGio(u.taoLuc)} · đăng nhập gần nhất{' '}
                  {ngayGio(u.dangNhapCuoi)}
                </span>
              </div>
              <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                {u.laSo.length} lá số · {u.soLuanGiai} luận giải{' '}
                <span style={{ color: 'var(--fg)' }}>{moRong === u.id ? '▲' : '▼'}</span>
              </span>
            </button>

            {moRong === u.id && (
              <div className="flex flex-col gap-[8px] pb-[16px] pl-[14px]">
                {u.laSo.length === 0 ? (
                  <span className="text-[13px]" style={{ color: 'var(--fg-subtle)' }}>
                    Người này chưa lưu lá số nào.
                  </span>
                ) : (
                  u.laSo.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-baseline justify-between gap-[12px] rounded-[var(--radius-cards)] border p-[12px]"
                      style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
                    >
                      <div className="flex flex-col gap-[4px]">
                        <span className="text-[14px]" style={{ color: 'var(--fg)' }}>
                          {l.hoTen || 'Không tên'}
                        </span>
                        <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                          {l.ngay}/{l.thang}/{l.nam} · giờ {l.gio}h ·{' '}
                          {l.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}
                        </span>
                      </div>
                      <span className="text-[12px]" style={{ color: 'var(--fg-body)' }}>
                        {tomTatLaSo(l)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
