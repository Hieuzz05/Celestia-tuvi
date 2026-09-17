import { NextResponse } from 'next/server';
import { danhSachModel } from '@/lib/ai/config';
import { coKhoaMaHoa, maHoa, ThieuKhoaMaHoaError } from '@/lib/ai/ma-hoa';
import { cauHinhChoQuanTri } from '@/lib/ai/nguon-cau-hinh';
import type { ProviderId } from '@/lib/ai/types';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { LOI_CHUA_CAU_HINH, taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Quản lý chuỗi model: thêm, sửa key, bật/tắt, đổi thứ tự, xoá.
 *
 * API key chỉ đi MỘT chiều: trình duyệt gửi lên, không bao giờ nhận về. Mọi phản
 * hồi chỉ có dạng rút gọn `sk-a••••b12c`.
 */

const PROVIDER: ProviderId[] = ['gemini', 'groq', 'cerebras', 'openrouter', 'openai', 'anthropic'];

const laProvider = (x: unknown): x is ProviderId =>
  typeof x === 'string' && (PROVIDER as string[]).includes(x);

export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  try {
    const d = await cauHinhChoQuanTri();
    return NextResponse.json({ ...d, coKhoaMaHoa: coKhoaMaHoa(), provider: PROVIDER });
  } catch (e) {
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Không đọc được cấu hình' },
      { status: 500 }
    );
  }
}

/** Thêm một model vào chuỗi */
export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: { provider?: string; model?: string; apiKey?: string; ghiChu?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  if (!laProvider(body.provider)) {
    return NextResponse.json({ loi: 'Nhà cung cấp không hợp lệ' }, { status: 400 });
  }
  const model = body.model?.trim();
  if (!model) return NextResponse.json({ loi: 'Thiếu tên model' }, { status: 400 });

  const key = body.apiKey?.trim();
  let apiKeyMa: string | null = null;
  if (key) {
    try {
      apiKeyMa = maHoa(key);
    } catch (e) {
      if (e instanceof ThieuKhoaMaHoaError) {
        return NextResponse.json({ loi: e.message, thieuKhoa: true }, { status: 400 });
      }
      throw e;
    }
  }

  // Lần đầu chuyển từ biến môi trường sang database: chép nguyên chuỗi đang chạy
  // xuống bảng trước, rồi mới thêm dòng mới. Nếu không, bảng chỉ có một dòng và
  // toàn bộ lưới đỡ đang hoạt động biến mất ngay lúc bấm Thêm.
  const { count } = await supabase
    .from('ai_model_configs')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) === 0) {
    const theoEnv = danhSachModel()
      .filter((m) => m.apiKey)
      .map((m, i) => ({ provider: m.provider, model: m.model, uu_tien: i, bat: true }));
    if (theoEnv.length) await supabase.from('ai_model_configs').insert(theoEnv);
  }

  const { data: cuoi } = await supabase
    .from('ai_model_configs')
    .select('uu_tien')
    .order('uu_tien', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('ai_model_configs').insert({
    provider: body.provider,
    model,
    api_key_ma: apiKeyMa,
    uu_tien: (cuoi?.uu_tien ?? -1) + 1,
    ghi_chu: body.ghiChu?.trim() || null,
  });

  if (error) {
    return NextResponse.json(
      {
        loi:
          error.code === '23505'
            ? `Đã có ${body.provider} / ${model} trong danh sách.`
            : error.message,
      },
      { status: 400 }
    );
  }

  await ghiNhatKyQuanTri('them-model', 'ai_model_config', `${body.provider}/${model}`, cong.actor);
  return NextResponse.json({ ok: true });
}

/** Sửa một dòng: key, bật/tắt, ghi chú, tên model */
export async function PATCH(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: {
    id?: string;
    model?: string;
    apiKey?: string;
    /** true = xoá key riêng, quay về dùng key từ biến môi trường */
    boKey?: boolean;
    bat?: boolean;
    ghiChu?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ loi: 'Thiếu id' }, { status: 400 });

  const doi: Record<string, unknown> = { cap_nhat_luc: new Date().toISOString() };
  if (typeof body.bat === 'boolean') doi.bat = body.bat;
  if (typeof body.model === 'string' && body.model.trim()) doi.model = body.model.trim();
  if (typeof body.ghiChu === 'string') doi.ghi_chu = body.ghiChu.trim() || null;

  if (body.boKey) {
    doi.api_key_ma = null;
  } else if (body.apiKey?.trim()) {
    try {
      doi.api_key_ma = maHoa(body.apiKey.trim());
    } catch (e) {
      if (e instanceof ThieuKhoaMaHoaError) {
        return NextResponse.json({ loi: e.message, thieuKhoa: true }, { status: 400 });
      }
      throw e;
    }
  }

  const { error } = await supabase.from('ai_model_configs').update(doi).eq('id', body.id);
  if (error) return NextResponse.json({ loi: error.message }, { status: 400 });

  // Nhật ký ghi CÓ đổi key hay không, không bao giờ ghi giá trị key
  await ghiNhatKyQuanTri('sua-model', 'ai_model_config', body.id, cong.actor, {
    doiKey: Boolean(body.apiKey?.trim()) || Boolean(body.boKey),
    bat: body.bat,
  });
  return NextResponse.json({ ok: true });
}

/** Sắp lại toàn bộ thứ tự ưu tiên */
export async function PUT(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  let body: { thuTu?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  const thuTu = Array.isArray(body.thuTu) ? body.thuTu.filter((x) => typeof x === 'string') : [];
  if (thuTu.length === 0) return NextResponse.json({ loi: 'Thiếu thứ tự' }, { status: 400 });

  // Ghi từng dòng thay vì upsert cả mảng: upsert đòi gửi kèm mọi cột not-null,
  // và gửi thiếu một cột là ghi đè mất dữ liệu đang có.
  for (let i = 0; i < thuTu.length; i++) {
    const { error } = await supabase
      .from('ai_model_configs')
      .update({ uu_tien: i, cap_nhat_luc: new Date().toISOString() })
      .eq('id', thuTu[i]);
    if (error) return NextResponse.json({ loi: error.message }, { status: 400 });
  }

  await ghiNhatKyQuanTri('sap-thu-tu-model', 'ai_model_config', thuTu.join(','), cong.actor);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  const supabase = taoSupabaseAdmin();
  if (!supabase) return NextResponse.json({ loi: LOI_CHUA_CAU_HINH }, { status: 503 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ loi: 'Thiếu id' }, { status: 400 });

  const { error } = await supabase.from('ai_model_configs').delete().eq('id', id);
  if (error) return NextResponse.json({ loi: error.message }, { status: 400 });

  await ghiNhatKyQuanTri('xoa-model', 'ai_model_config', id, cong.actor);
  return NextResponse.json({ ok: true });
}
