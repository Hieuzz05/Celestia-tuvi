import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Vòng đời một phiên bản: xuất bản, hạ xuống lưu trữ, hoặc xoá hẳn.
 *
 * Xoá là lựa chọn cuối. Mặc định của giao diện là lưu trữ — giữ được vết đã
 * từng có nguồn nào, trong khi truy hồi không còn chạm tới nó nữa.
 */

const HANH_DONG = ['xuat-ban', 'luu-tru'] as const;

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: { versionId?: string; hanhDong?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  const versionId = body.versionId?.trim();
  const hanhDong = body.hanhDong as (typeof HANH_DONG)[number];
  if (!versionId) return NextResponse.json({ loi: 'Thiếu versionId' }, { status: 400 });
  if (!HANH_DONG.includes(hanhDong)) {
    return NextResponse.json({ loi: 'Hành động không hợp lệ' }, { status: 400 });
  }

  if (hanhDong === 'xuat-ban') {
    // Qua RPC để việc hạ bản cũ và nâng bản mới nằm trong một giao dịch
    const { error } = await supabase.rpc('xuat_ban_phien_ban', {
      p_version_id: versionId,
      p_actor: cong.actor.id ?? null,
    });
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('knowledge_document_versions')
      .update({ trang_thai: 'luu_tru' })
      .eq('id', versionId);
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
  }

  await ghiNhatKyQuanTri(hanhDong, 'knowledge_document_version', versionId, cong.actor);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  const url = new URL(req.url);
  const documentId = url.searchParams.get('documentId');
  const versionId = url.searchParams.get('versionId');

  if (versionId) {
    const { error } = await supabase.from('knowledge_document_versions').delete().eq('id', versionId);
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
    await ghiNhatKyQuanTri('xoa-phien-ban', 'knowledge_document_version', versionId, cong.actor);
    return NextResponse.json({ ok: true });
  }

  if (documentId) {
    const { error } = await supabase.from('knowledge_documents').delete().eq('id', documentId);
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
    await ghiNhatKyQuanTri('xoa-nguon', 'knowledge_document', documentId, cong.actor);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ loi: 'Thiếu documentId hoặc versionId' }, { status: 400 });
}
