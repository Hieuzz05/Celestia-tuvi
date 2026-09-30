import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { docCauHinhChoQuanTri, lamSachCauHinh, luuCauHinhV3, CAU_HINH_MAC_DINH } from '@/lib/rag/v3/cau-hinh';

/**
 * Cấu hình luận giải v3 (độ dài bài, trần gợi ý) — CHỈ quản trị viên. Xem lib/rag/v3/cau-hinh.ts.
 *
 * GET  → { hienTai, lichSu, macDinh }
 * POST → { cauHinh, nhan }            lưu bản mới (bản đang chạy vào lịch sử)
 *        { khoiPhuc: số thứ tự }      đưa một bản trong lịch sử lên lại
 *        { veMacDinh: true }          về đúng số trong mã
 */
export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  try {
    return NextResponse.json(await docCauHinhChoQuanTri());
  } catch (e) {
    return NextResponse.json({ loi: e instanceof Error ? e.message : 'Không đọc được cấu hình' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  let body: { cauHinh?: unknown; nhan?: unknown; khoiPhuc?: unknown; veMacDinh?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không phải JSON hợp lệ' }, { status: 400 });
  }
  try {
    let cauHinh = body.cauHinh === undefined ? null : lamSachCauHinh(body.cauHinh);
    let nhan = typeof body.nhan === 'string' ? body.nhan.trim() : '';
    if (body.veMacDinh === true) {
      cauHinh = CAU_HINH_MAC_DINH;
      nhan = 'Về mặc định trong mã';
    } else if (typeof body.khoiPhuc === 'number') {
      const { lichSu } = await docCauHinhChoQuanTri();
      const ban = lichSu[body.khoiPhuc];
      if (!ban) return NextResponse.json({ loi: 'Không có bản này trong lịch sử' }, { status: 400 });
      cauHinh = lamSachCauHinh(ban.cauHinh);
      nhan = `Khôi phục: ${ban.nhan}`;
    }
    if (!cauHinh) return NextResponse.json({ loi: 'Thiếu cấu hình' }, { status: 400 });
    const ban = await luuCauHinhV3(cauHinh, nhan, cong.actor.email);
    await ghiNhatKyQuanTri('luu-cau-hinh', 'cau-hinh-v3', 'v3', cong.actor, { nhan: ban.nhan, cauHinh: ban.cauHinh });
    return NextResponse.json(await docCauHinhChoQuanTri());
  } catch (e) {
    return NextResponse.json({ loi: e instanceof Error ? e.message : 'Không lưu được cấu hình' }, { status: 500 });
  }
}
