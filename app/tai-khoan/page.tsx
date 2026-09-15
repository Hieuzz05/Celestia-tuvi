'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/FormSinh';
import { datTenHienThi, taiTaiKhoan, type HoSoTaiKhoan } from '@/lib/store/profile';
import { supabaseDaCauHinh } from '@/lib/supabase/config';

export default function TaiKhoanPage() {
  const [taiKhoan, setTaiKhoan] = useState<HoSoTaiKhoan | null>(null);
  const [ten, setTen] = useState('');
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState<{ loai: 'loi' | 'ok'; noiDung: string } | null>(null);
  const [daTai, setDaTai] = useState(false);

  useEffect(() => {
    taiTaiKhoan().then((tk) => {
      setTaiKhoan(tk);
      setTen(tk?.tenHienThi ?? '');
      setDaTai(true);
    });
  }, []);

  const luu = async (e: React.FormEvent) => {
    e.preventDefault();
    setDangLuu(true);
    setThongBao(null);
    try {
      await datTenHienThi(ten);
      setTaiKhoan((tk) => (tk ? { ...tk, tenHienThi: ten.trim() } : tk));
      setThongBao({ loai: 'ok', noiDung: 'Đã lưu tên hiển thị.' });
    } catch (err) {
      setThongBao({ loai: 'loi', noiDung: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    } finally {
      setDangLuu(false);
    }
  };

  if (!supabaseDaCauHinh) {
    return (
      <main className="py-[60px]">
        <h1 className="heading">Chưa bật đăng nhập</h1>
        <p className="body-text mt-[18px]" style={{ color: 'var(--fg-muted)' }}>
          Tính năng tài khoản cần Supabase. Xem hướng dẫn trong tệp HUONG-DAN.md.
        </p>
      </main>
    );
  }

  if (daTai && !taiKhoan) {
    return (
      <main className="py-[60px]">
        <h1 className="heading">Chưa đăng nhập</h1>
        <p className="body-text mt-[18px]" style={{ color: 'var(--fg-muted)' }}>
          Đăng nhập để đặt tên hiển thị và quản lý lá số đã lưu.
        </p>
        <a href="/dang-nhap" className="btn-primary mt-[24px] inline-block">
          Đăng nhập
        </a>
      </main>
    );
  }

  return (
    <main className="flex max-w-[520px] flex-col gap-[24px] py-[20px]">
      <div>
        <p className="eyebrow">Tài khoản</p>
        <h1 className="heading mt-[10px]">Hồ sơ của bạn.</h1>
      </div>

      <div
        className="flex flex-col gap-[6px] rounded-[var(--radius-cards)] border p-[18px]"
        style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
      >
        <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
          Email đăng nhập
        </span>
        <span className="text-[15px]">{taiKhoan?.email ?? '—'}</span>
      </div>

      <form onSubmit={luu} className="flex flex-col gap-[18px]">
        <Field label="Tên hiển thị">
          <input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            maxLength={60}
            placeholder="Tên bạn muốn hiện trên thanh điều hướng"
            className="field-input"
          />
        </Field>

        {thongBao && (
          <p
            className="text-[13px]"
            style={{ color: thongBao.loai === 'loi' ? 'var(--chart-hung)' : 'var(--chart-cat)' }}
          >
            {thongBao.noiDung}
          </p>
        )}

        <button type="submit" disabled={dangLuu} className="btn-primary self-start">
          {dangLuu ? 'Đang lưu…' : 'Lưu tên hiển thị'}
        </button>
      </form>
    </main>
  );
}
