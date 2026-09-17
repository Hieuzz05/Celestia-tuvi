import { NextResponse } from 'next/server';
import { cheKey } from '@/lib/ai/ma-hoa';
import { danhSachModelThuc } from '@/lib/ai/nguon-cau-hinh';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';

/**
 * Trạng thái chuỗi model.
 *
 * Chỉ quản trị viên đọc được. Bản trước để ngỏ cho mọi người: nó không lộ key
 * đầy đủ, nhưng có lộ đủ để người ngoài biết hệ thống đang chạy nhà cung cấp
 * nào, model nào, và bốn ký tự đầu/cuối của key. Không có lý do gì để công khai
 * những thứ đó.
 */
export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const { ds, tuDatabase } = await danhSachModelThuc();
  return NextResponse.json({
    nguon: tuDatabase ? 'database' : 'bien-moi-truong',
    models: ds.map((m) => ({
      provider: m.provider,
      model: m.model,
      priority: m.priority,
      daCauHinh: Boolean(m.apiKey),
      keyMasked: cheKey(m.apiKey),
    })),
    soModelSanSang: ds.filter((m) => m.enabled && m.apiKey).length,
  });
}
