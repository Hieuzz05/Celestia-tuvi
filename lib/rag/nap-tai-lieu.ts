import { createHash } from 'node:crypto';
import { catThanhDoan } from '@/lib/ai/chunk';
import { embedNhieuDoan, SO_CHIEU_VECTOR } from '@/lib/ai/embedding';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { nhanDangThucThe, TU_DIEN_THUC_THE } from './thuc-the';

/**
 * Nạp tài liệu vào kho — parse, cắt đoạn, rút thực thể, sinh vector, lập chỉ mục.
 *
 * Điểm khác cốt lõi so với bản cũ: tài liệu nạp xong KHÔNG tự đi vào truy hồi.
 * Nó dừng ở trạng thái `can_duyet`, và chỉ chuyển sang `da_xuat_ban` khi có
 * người bấm xuất bản. Một tài liệu cắt hỏng mà đi thẳng vào production thì mọi
 * câu trả lời sau đó đều nhiễm, và không ai biết vì nó vẫn "chạy bình thường".
 */

const GIOI_HAN_DOAN_MOT_LAN = 60;

export interface DauVaoNap {
  tieuDe: string;
  noiDung: string;
  hePhai: string;
  loaiNguon: string;
  mucTinCay: string;
  phienBan: string;
  tacGia?: string;
  tenTep?: string;
  theChuDe?: string[];
  ghiChu?: string;
  /** Nạp thêm phiên bản mới cho một nguồn đã có */
  documentId?: string;
  actor?: { id?: string; email?: string };
}

export interface KetQuaNap {
  documentId: string;
  versionId: string;
  soDoan: number;
  canhBao: string[];
  soThucThe: number;
}

export class LoiNap extends Error {}

/** Ước lượng token: tiếng Việt xấp xỉ 1 token mỗi 3 ký tự với bộ tách của Gemini */
const uocTinhToken = (s: string) => Math.ceil(s.length / 3);

/** Đề mục được ghim vào đầu mỗi đoạn bởi catThanhDoan — tách ra để lưu riêng */
function tachDeMuc(doan: string): { deMuc: string | null; than: string } {
  const xuong = doan.indexOf('\n');
  if (xuong === -1) return { deMuc: null, than: doan };
  const dong1 = doan.slice(0, xuong);
  // Đề mục là dòng đầu ngắn, không kết câu — đúng hình dạng catThanhDoan ghim vào
  if (dong1.length <= 120 && !/[.!?…]$/.test(dong1.trim())) {
    return { deMuc: dong1.trim(), than: doan.slice(xuong + 1) };
  }
  return { deMuc: null, than: doan };
}

/**
 * Cảnh báo chất lượng cắt đoạn.
 *
 * Không chặn nạp — người vận hành cần nhìn thấy tài liệu rồi mới quyết định.
 * Nhưng có cảnh báo thì tài liệu phải qua mắt người trước khi xuất bản, đúng
 * vai trò của trạng thái `can_duyet`.
 */
function soatChatLuong(doans: string[]): string[] {
  const canhBao: string[] = [];

  const qua_ngan = doans.filter((d) => d.replace(/\s/g, '').length < 120).length;
  if (qua_ngan > doans.length * 0.3) {
    canhBao.push(`${qua_ngan}/${doans.length} đoạn ngắn dưới 120 ký tự — tài liệu có thể bị cắt vụn.`);
  }

  const khongDeMuc = doans.filter((d) => !tachDeMuc(d).deMuc).length;
  if (khongDeMuc === doans.length && doans.length > 3) {
    canhBao.push('Không đoạn nào có đề mục. Thêm tiêu đề dạng markdown (#, ##) sẽ giúp truy hồi chính xác hơn.');
  }

  const trung = new Set(doans.map((d) => d.trim())).size;
  if (trung < doans.length) {
    canhBao.push(`${doans.length - trung} đoạn trùng lặp nội dung.`);
  }

  const khongThucThe = doans.filter((d) => nhanDangThucThe(d).length === 0).length;
  if (khongThucThe > doans.length * 0.5) {
    canhBao.push(
      `${khongThucThe}/${doans.length} đoạn không nhắc tới sao hay cung nào — kiểm tra xem có phải nội dung tử vi không.`
    );
  }

  return canhBao;
}

export async function napTaiLieu(vao: DauVaoNap): Promise<KetQuaNap> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new LoiNap('Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY');

  const noiDung = vao.noiDung.trim();
  if (noiDung.length < 100) throw new LoiNap('Nội dung quá ngắn (tối thiểu 100 ký tự)');

  const doans = catThanhDoan(noiDung);
  if (doans.length === 0) throw new LoiNap('Không cắt được đoạn nào từ nội dung');
  if (doans.length > GIOI_HAN_DOAN_MOT_LAN) {
    throw new LoiNap(
      `Tài liệu bị cắt thành ${doans.length} đoạn, vượt mức xử lý một lần (${GIOI_HAN_DOAN_MOT_LAN}). Hãy chia nhỏ tài liệu rồi nạp từng phần.`
    );
  }

  const checksum = createHash('sha256').update(noiDung).digest('hex');

  // Trùng byte với một phiên bản đã có nghĩa là nạp lại đúng tệp cũ. Chặn ở đây
  // để kho không phình lên bằng các bản sao làm lệch xếp hạng truy hồi.
  const { data: daCo } = await supabase
    .from('knowledge_document_versions')
    .select('id, phien_ban, document_id')
    .eq('checksum', checksum)
    .maybeSingle();
  if (daCo) {
    throw new LoiNap(
      `Nội dung này đã có trong kho (phiên bản ${daCo.phien_ban}). Sửa nội dung hoặc mở phiên bản cũ thay vì nạp lại.`
    );
  }

  // Tạo/ lấy bản ghi nguồn trước, để nếu embedding hỏng giữa chừng thì vẫn còn
  // vết của lần thử — phiên bản sẽ mang trạng thái 'that_bai'.
  let documentId = vao.documentId;
  if (!documentId) {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        tieu_de: vao.tieuDe,
        ten_tep: vao.tenTep ?? null,
        he_phai: vao.hePhai,
        tac_gia: vao.tacGia ?? null,
        loai_nguon: vao.loaiNguon,
        muc_tin_cay: vao.mucTinCay,
        the_chu_de: vao.theChuDe ?? [],
        ghi_chu: vao.ghiChu ?? null,
        nguoi_tao: vao.actor?.id ?? null,
      })
      .select('id')
      .single();
    if (error) throw new LoiNap(error.message);
    documentId = data.id;
  }

  const { data: ver, error: loiVer } = await supabase
    .from('knowledge_document_versions')
    .insert({
      document_id: documentId,
      phien_ban: vao.phienBan,
      trang_thai: 'dang_xu_ly',
      checksum,
      so_ky_tu: noiDung.length,
      so_chunk: doans.length,
      model_embedding: `gemini-embedding-001@${SO_CHIEU_VECTOR}`,
    })
    .select('id')
    .single();
  if (loiVer) {
    throw new LoiNap(
      loiVer.code === '23505'
        ? `Nguồn này đã có phiên bản ${vao.phienBan}. Dùng số phiên bản khác.`
        : loiVer.message
    );
  }
  const versionId = ver.id;

  const hong = async (buoc: string, loi: string) => {
    await supabase
      .from('knowledge_document_versions')
      .update({ trang_thai: 'that_bai', buoc_loi: buoc, loi })
      .eq('id', versionId);
    throw new LoiNap(loi);
  };

  let vectors: number[][];
  try {
    vectors = await embedNhieuDoan(doans);
  } catch (e) {
    await hong('embedding', e instanceof Error ? e.message : 'Lỗi khi sinh vector');
    throw e;
  }

  const banGhi = doans.map((d, i) => {
    const { deMuc, than } = tachDeMuc(d);
    return {
      document_id: documentId,
      version_id: versionId,
      thu_tu: i,
      noi_dung: d,
      duong_de_muc: deMuc,
      so_token: uocTinhToken(than),
      embedding: vectors[i],
      sieu_du_lieu: {
        hePhai: vao.hePhai,
        mucTinCay: vao.mucTinCay,
        theChuDe: vao.theChuDe ?? [],
        thucThe: nhanDangThucThe(d).map((t) => t.id),
      },
    };
  });

  const { data: chunkDaLuu, error: loiChunk } = await supabase
    .from('knowledge_chunks')
    .insert(banGhi)
    .select('id, thu_tu');
  if (loiChunk) {
    await hong('luu-chunk', loiChunk.message);
  }

  // Bảng nối chunk ↔ thực thể: cho phép lọc truy hồi theo sao/cung mà không phải
  // đọc jsonb của từng dòng.
  await dongBoTuDienThucThe();
  const noi: { chunk_id: string; entity_id: string; so_lan: number }[] = [];
  for (const c of chunkDaLuu ?? []) {
    const doan = doans[c.thu_tu];
    for (const tt of nhanDangThucThe(doan)) {
      const so = boDauDem(doan, tt.ten) || 1;
      noi.push({ chunk_id: c.id, entity_id: tt.id, so_lan: so });
    }
  }
  if (noi.length) {
    // Bỏ qua lỗi ở đây từng làm cả bộ lọc theo thực thể chết lặng: tài liệu nạp
    // xong trông như bình thường, chỉ có điều không đoạn nào gắn được sao nào.
    const { error } = await supabase.from('chunk_entities').insert(noi);
    if (error) await hong('gan-thuc-the', error.message);
  }

  const canhBao = soatChatLuong(doans);

  await supabase
    .from('knowledge_document_versions')
    .update({ trang_thai: 'can_duyet', canh_bao: canhBao })
    .eq('id', versionId);

  await supabase
    .from('knowledge_documents')
    .update({ so_chunk: doans.length, so_ky_tu: noiDung.length, cap_nhat_luc: new Date().toISOString() })
    .eq('id', documentId);

  return {
    documentId: documentId!,
    versionId,
    soDoan: doans.length,
    canhBao,
    soThucThe: new Set(noi.map((n) => n.entity_id)).size,
  };
}

/** Đếm số lần một tên xuất hiện trong đoạn, bỏ qua dấu */
function boDauDem(doan: string, ten: string): number {
  const chuan = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const a = chuan(doan);
  const b = chuan(ten);
  if (!b) return 0;
  let dem = 0;
  let i = a.indexOf(b);
  while (i !== -1) {
    dem += 1;
    i = a.indexOf(b, i + b.length);
  }
  return dem;
}

/**
 * Đẩy từ điển thực thể từ code xuống bảng.
 *
 * Nguồn sự thật vẫn là `thuc-the.ts` — bảng chỉ là bản sao để SQL tham chiếu
 * được. Ghi đè mỗi lần nạp tài liệu nên không bao giờ lệch quá một lần nạp.
 */
export async function dongBoTuDienThucThe(): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.from('knowledge_entities').upsert(
    TU_DIEN_THUC_THE.map((t) => ({
      id: t.id,
      loai: t.loai,
      ten: t.ten,
      bi_danh: t.biDanh,
      cap_nhat_luc: new Date().toISOString(),
    })),
    { onConflict: 'id' }
  );

  // Ném lỗi thay vì bỏ qua: bảng thực thể trống thì mọi lần gắn thực thể sau đó
  // đều vi phạm khoá ngoại, và triệu chứng hiện ra ở tận bước truy hồi.
  if (error) throw new LoiNap(`Không đồng bộ được từ điển thực thể: ${error.message}`);
}
