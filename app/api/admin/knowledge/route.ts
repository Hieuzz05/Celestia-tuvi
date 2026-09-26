import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { LoiNap, napTaiLieu } from '@/lib/rag/nap-tai-lieu';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';
import { xoaDemMeta } from '@/lib/rag/tai-lieu-meta';

export const maxDuration = 60;

const HE_PHAI = ['chung', 'nam-phai', 'bac-phai'];
const LOAI_NGUON = ['sach', 'ghi-chu-chuyen-gia', 'quy-tac', 'bai-viet', 'noi-bo'];
const MUC_TIN_CAY = ['cot-loi', 'chuyen-gia-duyet', 'tham-khao', 'ho-tro'];

/** Danh sách nguồn kèm phiên bản — màn Kho tri thức đọc từ đây */
export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ loi: LOI_CHUA_CAU_HINH, chuaCauHinh: true }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select(
      'id, tieu_de, ten_tep, he_phai, tac_gia, loai_nguon, muc_tin_cay, the_chu_de, luu_tru, cap_nhat_luc, tao_luc, knowledge_document_versions(id, phien_ban, trang_thai, so_chunk, canh_bao, xuat_ban_luc, tao_luc, buoc_loi, loi)'
    )
    .order('cap_nhat_luc', { ascending: false });

  if (error) {
    // Bảng chưa tồn tại: nói thẳng phải chạy schema nào, đừng để người vận hành
    // đoán từ thông báo lỗi của Postgres.
    const thieuBang = error.message.includes('does not exist') || error.code === '42P01';
    return NextResponse.json(
      {
        loi: thieuBang
          ? 'Kho tri thức chưa được tạo. Chạy supabase/schema-rag-v2.sql trong Supabase SQL Editor.'
          : error.message,
        chuaCoBang: thieuBang,
      },
      { status: thieuBang ? 503 : 500 }
    );
  }

  return NextResponse.json({ taiLieu: data ?? [] });
}

/** Nạp một phiên bản mới (nguồn mới hoặc bản mới của nguồn đã có) */
export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  const chuoi = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');

  const tieuDe = chuoi('tieuDe');
  const noiDung = chuoi('noiDung');
  const phienBan = chuoi('phienBan') || '1.0';
  const hePhai = chuoi('hePhai') || 'chung';
  const loaiNguon = chuoi('loaiNguon') || 'sach';
  const mucTinCay = chuoi('mucTinCay') || 'tham-khao';

  if (!tieuDe) return NextResponse.json({ loi: 'Thiếu tiêu đề tài liệu' }, { status: 400 });
  if (!HE_PHAI.includes(hePhai)) return NextResponse.json({ loi: 'Hệ phái không hợp lệ' }, { status: 400 });
  if (!LOAI_NGUON.includes(loaiNguon)) return NextResponse.json({ loi: 'Loại nguồn không hợp lệ' }, { status: 400 });
  if (!MUC_TIN_CAY.includes(mucTinCay)) return NextResponse.json({ loi: 'Mức tin cậy không hợp lệ' }, { status: 400 });

  try {
    const kq = await napTaiLieu({
      tieuDe,
      noiDung,
      hePhai,
      loaiNguon,
      mucTinCay,
      phienBan,
      tacGia: chuoi('tacGia') || undefined,
      tenTep: chuoi('tenTep') || undefined,
      ghiChu: chuoi('ghiChu') || undefined,
      theChuDe: Array.isArray(body.theChuDe)
        ? (body.theChuDe as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
      documentId: chuoi('documentId') || undefined,
      actor: cong.actor,
    });

    await ghiNhatKyQuanTri('nap-tai-lieu', 'knowledge_document_version', kq.versionId, cong.actor, {
      tieuDe,
      phienBan,
      soDoan: kq.soDoan,
      canhBao: kq.canhBao,
    });

    return NextResponse.json(kq);
  } catch (e) {
    if (e instanceof LoiNap) return NextResponse.json({ loi: e.message }, { status: 400 });
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi khi nạp tài liệu' },
      { status: 500 }
    );
  }
}

/**
 * Gán lại mức tin cậy / loại nguồn của một tài liệu ĐÃ tải lên (chủ dự án
 * 26/09/2026: "Tài liệu đã tải lên cũng phải cho Admin gán lại mức độ tin cậy").
 *
 * Có tác dụng ngay với lượt luận giải kế tiếp (tối đa ~1 phút, xem
 * lib/rag/tai-lieu-meta.ts), không phải nạp lại hay sinh lại vector. Đổi xong thì
 * phiên bản kho đổi, người đọc đã đăng nhập thấy nút "Tạo bản mới".
 */
export async function PATCH(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: { documentId?: string; mucTinCay?: string; loaiNguon?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }
  const documentId = body.documentId?.trim();
  if (!documentId) return NextResponse.json({ loi: 'Thiếu documentId' }, { status: 400 });
  if (body.mucTinCay !== undefined && !MUC_TIN_CAY.includes(body.mucTinCay)) {
    return NextResponse.json({ loi: 'Mức tin cậy không hợp lệ' }, { status: 400 });
  }
  if (body.loaiNguon !== undefined && !LOAI_NGUON.includes(body.loaiNguon)) {
    return NextResponse.json({ loi: 'Loại nguồn không hợp lệ' }, { status: 400 });
  }
  if (body.mucTinCay === undefined && body.loaiNguon === undefined) {
    return NextResponse.json({ loi: 'Không có gì để đổi' }, { status: 400 });
  }

  const { data: cu, error: loiDoc } = await supabase
    .from('knowledge_documents')
    .select('tieu_de, muc_tin_cay, loai_nguon')
    .eq('id', documentId)
    .maybeSingle();
  if (loiDoc) return NextResponse.json({ loi: loiDoc.message }, { status: 500 });
  if (!cu) return NextResponse.json({ loi: 'Không tìm thấy tài liệu' }, { status: 404 });

  const doi: Record<string, string> = { cap_nhat_luc: new Date().toISOString() };
  if (body.mucTinCay !== undefined) doi.muc_tin_cay = body.mucTinCay;
  if (body.loaiNguon !== undefined) doi.loai_nguon = body.loaiNguon;
  const { error } = await supabase.from('knowledge_documents').update(doi).eq('id', documentId);
  if (error) return NextResponse.json({ loi: error.message }, { status: 500 });

  xoaDemMeta();
  await ghiNhatKyQuanTri('doi-muc-tin-cay', 'knowledge_document', documentId, cong.actor, {
    tieuDe: cu.tieu_de,
    truoc: { mucTinCay: cu.muc_tin_cay, loaiNguon: cu.loai_nguon },
    sau: { mucTinCay: body.mucTinCay ?? cu.muc_tin_cay, loaiNguon: body.loaiNguon ?? cu.loai_nguon },
  });
  return NextResponse.json({ ok: true });
}
