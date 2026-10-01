import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { xoaDemMeta } from '@/lib/rag/tai-lieu-meta';
import { dongBoThuVien, type KetQuaDongBo } from '@/lib/rag/thu-vien/dong-bo';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Vòng đời một phiên bản: xuất bản, hạ xuống lưu trữ, hoặc xoá hẳn.
 *
 * Xoá là lựa chọn cuối. Mặc định của giao diện là lưu trữ — giữ được vết đã
 * từng có nguồn nào, trong khi truy hồi không còn chạm tới nó nữa.
 */

const HANH_DONG = ['xuat-ban', 'luu-tru'] as const;

// Đồng bộ thư viện đọc mọi gói đợt — cần trọn 60 giây của gói Hobby
export const maxDuration = 60;

/**
 * Đồng bộ thư viện sau khi tài liệu đổi bản. Hỏng thì KHÔNG làm hỏng việc xuất
 * bản đã xong — trả lời kèm lỗi để trang quản trị nói ra, quản trị viên bấm lại.
 */
async function dongBo(documentId: string, boHet = false): Promise<{ thuVien?: KetQuaDongBo; loiThuVien?: string }> {
  try {
    return { thuVien: await dongBoThuVien(documentId, { boHet }) };
  } catch (e) {
    return { loiThuVien: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: { versionId?: string; hanhDong?: string; documentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  // Bấm lại khi lần đồng bộ tự động sau xuất bản hỏng (hết giờ, lỗi mạng)
  if (body.hanhDong === 'dong-bo-thu-vien') {
    const documentId = body.documentId?.trim();
    if (!documentId) return NextResponse.json({ loi: 'Thiếu documentId' }, { status: 400 });
    const kq = await dongBo(documentId);
    if (kq.loiThuVien) return NextResponse.json({ loi: kq.loiThuVien }, { status: 500 });
    await ghiNhatKyQuanTri('dong-bo-thu-vien', 'knowledge_document', documentId, cong.actor);
    return NextResponse.json({ ok: true, ...kq });
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
    xoaDemMeta();
    const { data: ver } = await supabase.from('knowledge_document_versions').select('document_id').eq('id', versionId).maybeSingle();
    await ghiNhatKyQuanTri(hanhDong, 'knowledge_document_version', versionId, cong.actor);
    return NextResponse.json({ ok: true, ...(ver ? await dongBo(ver.document_id as string) : {}) });
  } else {
    const { error } = await supabase
      .from('knowledge_document_versions')
      .update({ trang_thai: 'luu_tru' })
      .eq('id', versionId);
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
  }

  // Lưu trữ không đụng thư viện: dungKhoiThuVien tự bỏ căn cứ của tài liệu không còn bản xuất bản
  xoaDemMeta();
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
    xoaDemMeta();
    await ghiNhatKyQuanTri('xoa-phien-ban', 'knowledge_document_version', versionId, cong.actor);
    return NextResponse.json({ ok: true });
  }

  if (documentId) {
    const { error } = await supabase.from('knowledge_documents').delete().eq('id', documentId);
    if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
    xoaDemMeta();
    await ghiNhatKyQuanTri('xoa-nguon', 'knowledge_document', documentId, cong.actor);
    // Xoá hẳn thì không có đường quay lại — gỡ vĩnh viễn câu trích của nó khỏi thư viện
    return NextResponse.json({ ok: true, ...(await dongBo(documentId, true)) });
  }

  return NextResponse.json({ loi: 'Thiếu documentId hoặc versionId' }, { status: 400 });
}
