import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { docNoiDung } from '@/lib/rag/noi-dung-ai';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { khoaDemV3, type BodyV3, type CauTraRaV3 } from '@/lib/rag/v3/xu-ly';

/**
 * CHẤM BÀI LUẬN — chỉ quản trị viên (01/10/2026). Bảng: supabase/va-danh-gia-bai.sql.
 *
 * POST { laSo, idCau, cauHoi, luanGiai, viSao, goiY, danhGia, diem, binhLuan, goiYViet }
 *      → lưu (chấm lại cùng câu cùng lá số là SỬA lượt cũ). Khoá đệm do MÁY CHỦ tính từ
 *        `laSo`; bản chụp là chữ admin đang thấy, kèm `khop_dem` so với bài trong đệm.
 * GET  ?ngay&thang&nam&gio&gioiTinh&namXem&nhom   → lượt chấm của CHÍNH admin này cho lá số đó
 * GET  ?idCau&chuaHay=1&diemToiDa&gioiHan          → danh sách cho trang /admin/nhan-xet
 */

type LaSo = Pick<BodyV3, 'ngay' | 'thang' | 'nam' | 'gio' | 'gioiTinh' | 'namXem' | 'nhom' | 'boiCanh'>;

const chu = (v: unknown, tran: number) => (typeof v === 'string' ? v.trim().slice(0, tran) : '');
const nguoiCham = (actor: { id?: string }) => actor.id ?? 'cuc-bo';
const COT = 'id, nhom, id_cau, cau_hoi, luan_giai, vi_sao, goi_y, phien_ban_prompt, model, khop_dem, danh_gia, diem, binh_luan, goi_y_viet, email_cham, tao_luc, sua_luc';

export async function GET(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình Supabase' }, { status: 503 });

  const q = new URL(req.url).searchParams;
  const so = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  let truyVan = db.from('danh_gia_bai_luan').select(COT).order('sua_luc', { ascending: false });

  if (q.has('ngay')) {
    const khoa = khoaDemV3({ ngay: so('ngay'), thang: so('thang'), nam: so('nam'), gio: so('gio'), gioiTinh: q.get('gioiTinh') ?? undefined, namXem: so('namXem'), nhom: q.get('nhom') ?? undefined } as LaSo);
    if (!khoa) return NextResponse.json({ loi: 'Thông tin lá số không hợp lệ' }, { status: 400 });
    truyVan = truyVan.eq('chart_hash', khoa.chartHash).eq('khoa_ky', khoa.khoaKy).eq('nguoi_cham', nguoiCham(cong.actor));
  } else {
    if (q.get('idCau')) truyVan = truyVan.eq('id_cau', q.get('idCau')!);
    if (q.get('chuaHay') === '1') truyVan = truyVan.eq('danh_gia', 'chua-hay');
    const diemToiDa = so('diemToiDa');
    if (diemToiDa) truyVan = truyVan.lte('diem', diemToiDa);
  }
  const { data, error } = await truyVan.limit(Math.min(Math.max(so('gioiHan') ?? 300, 1), 1000));
  if (error) return NextResponse.json({ loi: `Không đọc được bảng chấm bài (đã chạy supabase/va-danh-gia-bai.sql chưa?) — ${error.message}` }, { status: 500 });
  return NextResponse.json({ danhGia: data ?? [] });
}

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình Supabase' }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không phải JSON hợp lệ' }, { status: 400 });
  }
  const khoa = khoaDemV3((b.laSo ?? {}) as LaSo);
  if (!khoa) return NextResponse.json({ loi: 'Thông tin lá số không hợp lệ' }, { status: 400 });
  const idCau = chu(b.idCau, 20);
  if (!/^[A-Z]{2}\d{2}$/.test(idCau)) return NextResponse.json({ loi: 'Mã câu không hợp lệ' }, { status: 400 });
  const danhGia = b.danhGia === 'hay' || b.danhGia === 'chua-hay' ? b.danhGia : null;
  const diem = typeof b.diem === 'number' && Number.isInteger(b.diem) && b.diem >= 1 && b.diem <= 5 ? b.diem : null;
  const binhLuan = chu(b.binhLuan, 4000);
  const goiYViet = chu(b.goiYViet, 4000);
  if (!danhGia && !diem && !binhLuan && !goiYViet) return NextResponse.json({ loi: 'Chưa có đánh giá nào để lưu' }, { status: 400 });

  // Đối chiếu với bài đang đệm: trang có thể đang hiện bản cũ / bản thế hệ trước
  const luanGiai = chu(b.luanGiai, 8000);
  // khoaKy dựng trong khoaDemV3 — đã gắn THE_HE_DEM, cùng công thức với route luận giải
  const { chartHash, khoaKy } = khoa;
  const dem = await docNoiDung<CauTraRaV3[]>({
    chartHash,
    beMat: 'luan-giai-v3',
    khoaKy,
    ngonNgu: 'vi',
  }).catch(() => null);
  const trongDem = Array.isArray(dem?.noiDung) ? dem!.noiDung.find((c) => c.id === idCau) : undefined;
  const gon = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
  const khop = trongDem ? gon(trongDem.luanGiai) === gon(luanGiai) : false;

  const bay = new Date().toISOString();
  const { error } = await db.from('danh_gia_bai_luan').upsert(
    {
      chart_hash: khoa.chartHash,
      khoa_ky: khoa.khoaKy,
      nhom: khoa.nhom,
      id_cau: idCau,
      cau_hoi: chu(b.cauHoi, 500) || trongDem?.cauHoi || null,
      luan_giai: luanGiai || null,
      vi_sao: chu(b.viSao, 4000) || null,
      goi_y: chu(b.goiY, 1000) || null,
      // Phiên bản chỉ tin được khi bản chụp trùng bài đệm; câu cũ (trước 01/10/2026) không có `pb`
      phien_ban_prompt: khop ? (trongDem?.pb ?? null) : null,
      model: khop ? (trongDem?.model ?? dem?.model ?? null) : null,
      khop_dem: khop,
      danh_gia: danhGia,
      diem,
      binh_luan: binhLuan || null,
      goi_y_viet: goiYViet || null,
      nguoi_cham: nguoiCham(cong.actor),
      email_cham: cong.actor.email ?? null,
      sua_luc: bay,
    },
    { onConflict: 'nguoi_cham,chart_hash,khoa_ky,id_cau' }
  );
  if (error) return NextResponse.json({ loi: `Không lưu được (đã chạy supabase/va-danh-gia-bai.sql chưa?) — ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, khopDem: khop });
}
