import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { embedTiep, LoiNap } from '@/lib/rag/nap-tai-lieu';

export const maxDuration = 60;

/**
 * Điền vector cho một lượt đoạn.
 *
 * Client gọi lại cho tới khi `xong` — mỗi lượt là một request ngắn, nên trần 60
 * giây của Vercel Hobby không còn là giới hạn cho kích thước tài liệu.
 */
export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const body = await req.json().catch(() => ({}));
  const versionId = typeof body.versionId === 'string' ? body.versionId.trim() : '';
  if (!versionId) return NextResponse.json({ loi: 'Thiếu versionId' }, { status: 400 });

  try {
    return NextResponse.json(await embedTiep(versionId));
  } catch (e) {
    if (e instanceof LoiNap) return NextResponse.json({ loi: e.message }, { status: 400 });
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi khi sinh vector' },
      { status: 500 }
    );
  }
}
