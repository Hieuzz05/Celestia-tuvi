'use client';

import type { ChuDeId } from '@/lib/ai/prompt';
import type { GioiTinh } from '@/lib/tuvi/ansao';

export interface YeuCauLuanGiai {
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: GioiTinh;
  hoTen?: string;
  chuDe: ChuDeId;
  namXem: number;
  thangXem: number;
  cauHoi?: string;
  model?: string;
}

export interface KetQuaLuanGiai {
  noiDung: string;
  model: string;
  daThuHong: { provider: string; model: string; loi: string }[];
}

/** Gọi API luận giải — dùng chung cho panel tổng quan và trang chi tiết */
export async function goiLuanGiai(yeuCau: YeuCauLuanGiai): Promise<KetQuaLuanGiai> {
  const res = await fetch('/api/luan-giai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(yeuCau),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.loi ?? 'Luận giải thất bại');
  return data as KetQuaLuanGiai;
}
