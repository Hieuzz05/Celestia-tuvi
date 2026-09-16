import { NextResponse } from 'next/server';
import { catThanhDoan } from '@/lib/ai/chunk';
import { embedNhieuDoan } from '@/lib/ai/embedding';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';

export const maxDuration = 60;

/** Kho tri thức chỉ dành cho quản trị viên — nạp tài liệu là thao tác tốn quota */
async function chanQuyen(): Promise<string | null> {
  if (!supabaseDaCauHinh) return null;
  const user = await nguoiDungHienTai();
  if (!user) return 'Cần đăng nhập';
  if (!laAdmin(user.email)) return 'Tài khoản không có quyền quản trị';
  return null;
}

export async function GET() {
  const loiQuyen = await chanQuyen();
  if (loiQuyen) return NextResponse.json({ loi: loiQuyen }, { status: 403 });

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH, chuaCauHinh: true }, { status: 503 });

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .order('tao_luc', { ascending: false });
  if (error) return NextResponse.json({ loi: error.message }, { status: 500 });

  return NextResponse.json({ taiLieu: data ?? [] });
}

export async function POST(req: Request) {
  const loiQuyen = await chanQuyen();
  if (loiQuyen) return NextResponse.json({ loi: loiQuyen }, { status: 403 });

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH, chuaCauHinh: true }, { status: 503 });

  let body: { tieuDe?: string; noiDung?: string; hePhai?: string; tenTep?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  const tieuDe = body.tieuDe?.trim();
  const noiDung = body.noiDung?.trim();
  const hePhai = body.hePhai ?? 'chung';

  if (!tieuDe) return NextResponse.json({ loi: 'Thiếu tiêu đề tài liệu' }, { status: 400 });
  if (!noiDung || noiDung.length < 100) {
    return NextResponse.json({ loi: 'Nội dung quá ngắn (tối thiểu 100 ký tự)' }, { status: 400 });
  }
  if (!['chung', 'nam-phai', 'bac-phai'].includes(hePhai)) {
    return NextResponse.json({ loi: 'Hệ phái không hợp lệ' }, { status: 400 });
  }

  const doans = catThanhDoan(noiDung);
  if (doans.length === 0) {
    return NextResponse.json({ loi: 'Không cắt được đoạn nào từ nội dung' }, { status: 400 });
  }
  // Free tier embedding có hạn mức theo phút; tài liệu quá lớn nên chia nhỏ rồi
  // nạp làm nhiều lần thay vì để request chết giữa chừng.
  if (doans.length > 60) {
    return NextResponse.json(
      {
        loi: `Tài liệu bị cắt thành ${doans.length} đoạn, vượt mức xử lý một lần (60). Hãy chia nhỏ tài liệu rồi nạp từng phần.`,
      },
      { status: 400 }
    );
  }

  let vectors: number[][];
  try {
    vectors = await embedNhieuDoan(doans);
  } catch (e) {
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi khi sinh vector' },
      { status: 502 }
    );
  }

  const { data: doc, error: loiDoc } = await supabase
    .from('knowledge_documents')
    .insert({
      tieu_de: tieuDe,
      ten_tep: body.tenTep ?? null,
      he_phai: hePhai,
      so_chunk: doans.length,
      so_ky_tu: noiDung.length,
    })
    .select()
    .single();
  if (loiDoc) return NextResponse.json({ loi: loiDoc.message }, { status: 500 });

  const { error: loiChunk } = await supabase.from('knowledge_chunks').insert(
    doans.map((noi, i) => ({
      document_id: doc.id,
      thu_tu: i,
      noi_dung: noi,
      embedding: vectors[i],
    }))
  );
  if (loiChunk) {
    // Xoá tài liệu để không để lại bản ghi rỗng không có đoạn nào
    await supabase.from('knowledge_documents').delete().eq('id', doc.id);
    return NextResponse.json({ loi: loiChunk.message }, { status: 500 });
  }

  return NextResponse.json({ taiLieu: doc, soDoan: doans.length });
}

export async function DELETE(req: Request) {
  const loiQuyen = await chanQuyen();
  if (loiQuyen) return NextResponse.json({ loi: loiQuyen }, { status: 403 });

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ loi: 'Thiếu id tài liệu' }, { status: 400 });

  // knowledge_chunks có on delete cascade nên xoá tài liệu là sạch cả đoạn
  const { error } = await supabase.from('knowledge_documents').delete().eq('id', id);
  if (error) return NextResponse.json({ loi: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
