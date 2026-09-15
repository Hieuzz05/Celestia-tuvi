'use client';

import type { GioiTinh } from '@/lib/tuvi/ansao';

export interface HoSo {
  id: string;
  hoTen: string;
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: GioiTinh;
  ghiChu?: string;
  taoLuc: number;
}

const KHOA = 'tuvi-ai:ho-so';

/**
 * Lưu hồ sơ ở trình duyệt. Khi bật Supabase, lớp này sẽ được thay bằng bảng
 * `charts` — giao diện gọi qua đúng 4 hàm dưới đây nên chỉ cần sửa một chỗ.
 */
export function danhSachHoSo(): HoSo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KHOA);
    return raw ? (JSON.parse(raw) as HoSo[]) : [];
  } catch {
    return [];
  }
}

export function luuHoSo(hoSo: Omit<HoSo, 'id' | 'taoLuc'>): HoSo {
  const moi: HoSo = { ...hoSo, id: crypto.randomUUID(), taoLuc: Date.now() };
  const ds = [moi, ...danhSachHoSo()];
  window.localStorage.setItem(KHOA, JSON.stringify(ds));
  return moi;
}

export function xoaHoSo(id: string) {
  const ds = danhSachHoSo().filter((h) => h.id !== id);
  window.localStorage.setItem(KHOA, JSON.stringify(ds));
}

export function timHoSo(id: string): HoSo | undefined {
  return danhSachHoSo().find((h) => h.id === id);
}
