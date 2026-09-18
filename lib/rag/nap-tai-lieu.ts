import { createHash } from 'node:crypto';
import { catThanhDoan } from '@/lib/ai/chunk';
import { embedLoTaiLieu, SO_CHIEU_VECTOR } from '@/lib/ai/embedding';
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

/**
 * Trần đoạn cho một lần nạp.
 *
 * Trước đây là 60, vì đoạn và vector phải sinh ra cùng lúc trong một HTTP
 * request. Giờ vector điền sau theo từng lô nên trần đó không còn lý do tồn tại;
 * con số này chỉ còn để chặn trường hợp dán nhầm cả một tệp khổng lồ.
 */
const TRAN_DOAN = 5000;

/**
 * Số đoạn xử lý mỗi lượt điền vector.
 *
 * Trần thật không phải thời gian mà là HẠN MỨC: free tier của
 * gemini-embedding-001 cho 100 đoạn mỗi phút, và mỗi phần tử trong lô tính là
 * một request. Lấy 90 để một lượt gần chạm trần mà không vượt, rồi client chờ
 * theo đúng số giây nhà cung cấp báo. Đặt cao hơn không nhanh hơn — chỉ khiến
 * lượt nào cũng bị chặn giữa chừng.
 */
const DOAN_MOI_LUOT = Number(process.env.EMBED_MOI_LUOT ?? 90);

/** Số dòng mỗi lần chèn xuống PostgREST — chèn cả nghìn dòng một lúc thì vỡ payload */
const LO_CHEN = 500;

/**
 * Bỏ YAML frontmatter và chú thích HTML.
 *
 * Chúng không phải nội dung tri thức. Lọt vào đoạn thì vừa làm nhiễu vector, vừa
 * đi thẳng vào ngữ cảnh gửi cho model — và một dòng `source_encoding: VNI-Times`
 * nằm giữa bài luận về sao Tử Vi là thứ không ai muốn giải thích.
 */
/**
 * Dấu hiệu của phần mềm chuyển PDF, không phải nội dung sách.
 *
 * Sách quét thường mang một dòng quảng cáo trên MỖI trang. Trong kho hiện tại nó
 * còn nằm ở dạng đề mục `###`, mà bộ cắt đoạn ghim đề mục vào đầu đoạn để giữ
 * ngữ cảnh — nên dòng quảng cáo thành tiêu đề của cả một loạt đoạn. Đo được: hai
 * trên bốn đoạn truy hồi được cho câu hỏi về sao Vũ Khúc là dòng quảng cáo.
 *
 * Danh sách cố ý hẹp, chỉ nhắm đúng tên công cụ và địa chỉ của chúng. Lọc rộng
 * tay thì cắt nhầm nội dung sách, mà mất một câu phú thì không ai phát hiện ra.
 */
const RAC_CHUYEN_DOI = [
  /pdffactory/i,
  /context-gmbh\.de/i,
  /created with .{0,30}(pdf|scanner|converter)/i,
  /(trial|evaluation|demo) version of/i,
  /www\.(pdfill|nitropdf|foxitsoftware)\.com/i,
];

function boRacChuyenDoi(s: string): string {
  return s
    .split(/\r?\n/)
    .filter((dong) => {
      const sach = dong.replace(/^#{1,6}\s*/, '').trim();
      if (!sach) return true;
      return !RAC_CHUYEN_DOI.some((r) => r.test(sach));
    })
    .join('\n');
}

function lamSachMarkdown(s: string): string {
  return boRacChuyenDoi(s)
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

  const noiDung = lamSachMarkdown(vao.noiDung);
  if (noiDung.length < 100) throw new LoiNap('Nội dung quá ngắn (tối thiểu 100 ký tự)');

  const doans = catThanhDoan(noiDung);
  if (doans.length === 0) throw new LoiNap('Không cắt được đoạn nào từ nội dung');
  if (doans.length > TRAN_DOAN) {
    throw new LoiNap(
      `Tài liệu bị cắt thành ${doans.length} đoạn, vượt trần ${TRAN_DOAN}. Kiểm tra xem có dán nhầm tệp không.`
    );
  }

  // Checksum tính trên bản ĐÃ làm sạch. Tính trên bản thô thì sửa một dòng
  // frontmatter là checksum đổi, và cơ chế chặn nạp trùng mất tác dụng.
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

  // Lưu đoạn KHÔNG kèm vector. Sinh vector cho cả nghìn đoạn không thể lọt vào
  // 60 giây của một request, nên việc đó chuyển sang `embedTiep` và chạy nhiều
  // lượt ngắn. Version ở lại 'dang_xu_ly' cho tới khi xong.
  for (let i = 0; i < doans.length; i += LO_CHEN) {
    const { error } = await supabase.from('knowledge_chunks').insert(
      doans.slice(i, i + LO_CHEN).map((d, k) => {
        const { deMuc, than } = tachDeMuc(d);
        return {
          document_id: documentId,
          version_id: versionId,
          thu_tu: i + k,
          noi_dung: d,
          duong_de_muc: deMuc,
          so_token: uocTinhToken(than),
          embedding: null,
          sieu_du_lieu: {
            hePhai: vao.hePhai,
            mucTinCay: vao.mucTinCay,
            theChuDe: vao.theChuDe ?? [],
            thucThe: nhanDangThucThe(d).map((t) => t.id),
          },
        };
      })
    );
    if (error) await hong('luu-chunk', error.message);
  }

  await supabase
    .from('knowledge_documents')
    .update({ so_chunk: doans.length, so_ky_tu: noiDung.length, cap_nhat_luc: new Date().toISOString() })
    .eq('id', documentId);

  return { documentId: documentId!, versionId, soDoan: doans.length, canhBao: [], soThucThe: 0 };
}

export interface TienDoEmbed {
  daXong: number;
  tong: number;
  xong: boolean;
  canhBao?: string[];
  /** Số giây phải chờ trước lượt sau — hạn mức nhà cung cấp, không phải lỗi */
  choGiay?: number;
  /** Hạn mức THEO NGÀY đã cạn: chờ thêm vô ích, mai bấm "Nạp tiếp" */
  hetNgay?: boolean;
}

/**
 * Pha điền vector — gọi lại nhiều lượt cho tới khi xong.
 *
 * Luôn chọn theo `embedding is null`, nên đứt mạng giữa chừng thì bấm lại là
 * chạy tiếp từ chỗ dở: không embed lại đoạn đã xong, không tốn quota.
 */
export async function embedTiep(versionId: string): Promise<TienDoEmbed> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new LoiNap('Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY');

  const { data: ver } = await supabase
    .from('knowledge_document_versions')
    .select('id, document_id, so_chunk')
    .eq('id', versionId)
    .maybeSingle();
  if (!ver) throw new LoiNap('Không tìm thấy phiên bản');

  const { data: con } = await supabase
    .from('knowledge_chunks')
    .select('id, thu_tu, noi_dung')
    .eq('version_id', versionId)
    .is('embedding', null)
    .order('thu_tu')
    .limit(DOAN_MOI_LUOT);

  let choGiay: number | undefined;
  let hetNgay: boolean | undefined;

  if (con?.length) {
    let vectors: number[][];
    try {
      const kq = await embedLoTaiLieu(con.map((c) => c.noi_dung));
      vectors = kq.vectors;
      choGiay = kq.choGiay;
      hetNgay = kq.hetNgay;
    } catch (e) {
      const loi = e instanceof Error ? e.message : 'Lỗi khi sinh vector';
      await supabase
        .from('knowledge_document_versions')
        .update({ trang_thai: 'that_bai', buoc_loi: 'embedding', loi })
        .eq('id', versionId);
      throw new LoiNap(loi);
    }

    // Cập nhật từng dòng theo id: không đụng tới cột nào khác, nên một lượt hỏng
    // giữa chừng không làm hỏng dữ liệu đã có. Chạy 8 dòng song song thay vì
    // tuần tự — vài trăm lượt đi về Supabase nối đuôi nhau tốn nhiều giây hơn cả
    // phần sinh vector, và đó là thứ đẩy request chạm trần thời gian.
    //
    // `vectors` có thể ngắn hơn `con` khi chạm hạn mức giữa chừng; phần chưa có
    // vector để nguyên cho lượt sau.
    const SONG_SONG = 8;
    for (let i = 0; i < vectors.length; i += SONG_SONG) {
      const loi = (
        await Promise.all(
          con.slice(i, Math.min(i + SONG_SONG, vectors.length)).map(async (c, k) => {
            const { error } = await supabase
              .from('knowledge_chunks')
              .update({ embedding: vectors[i + k] })
              .eq('id', c.id);
            return error?.message;
          })
        )
      ).find(Boolean);
      if (loi) throw new LoiNap(`Lưu vector lỗi: ${loi}`);
    }
  }

  const { count: conLai } = await supabase
    .from('knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('version_id', versionId)
    .is('embedding', null);

  const daXong = ver.so_chunk - (conLai ?? 0);
  if ((conLai ?? 0) > 0) return { daXong, tong: ver.so_chunk, xong: false, choGiay, hetNgay };

  const canhBao = await hoanTatNap(supabase, versionId, ver.document_id, ver.so_chunk);
  return { daXong, tong: ver.so_chunk, xong: true, canhBao };
}

/**
 * Pha chốt — gắn thực thể, soát chất lượng, chuyển sang `can_duyet`.
 *
 * Phải chạy lại được: client có thể gọi trùng lượt cuối, và một lần chốt thứ hai
 * không được phép làm số liệu lệch đi.
 */
async function hoanTatNap(
  supabase: NonNullable<ReturnType<typeof taoSupabaseAdmin>>,
  versionId: string,
  documentId: string,
  soChunk: number
): Promise<string[]> {
  // Đọc theo trang. PostgREST mặc định trả tối đa 1000 dòng, nên `.select()`
  // trần trụi sẽ lặng lẽ bỏ sót đuôi của tài liệu lớn — và hậu quả là những đoạn
  // cuối sách không bao giờ có liên kết thực thể, không lỗi nào báo ra.
  const TRANG = 1000;
  const chunks: { id: string; noi_dung: string }[] = [];
  for (let tu = 0; tu < soChunk; tu += TRANG) {
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('id, thu_tu, noi_dung')
      .eq('version_id', versionId)
      .order('thu_tu')
      .range(tu, tu + TRANG - 1);
    if (error) throw new LoiNap(`Đọc đoạn lỗi: ${error.message}`);
    if (!data?.length) break;
    chunks.push(...data);
  }

  await dongBoTuDienThucThe();

  // Xoá trước khi chèn: gọi trùng lượt cuối mà không xoá thì số lần đếm được
  // nhân đôi, làm lệch xếp hạng truy hồi mà không có lỗi nào báo.
  const { error: loiXoa } = await supabase.rpc('xoa_lien_ket_thuc_the', {
    p_version_id: versionId,
  });
  if (loiXoa) throw new LoiNap(`Xoá liên kết cũ lỗi: ${loiXoa.message}`);

  const noi: { chunk_id: string; entity_id: string; so_lan: number }[] = [];
  for (const c of chunks) {
    for (const tt of nhanDangThucThe(c.noi_dung)) {
      noi.push({ chunk_id: c.id, entity_id: tt.id, so_lan: boDauDem(c.noi_dung, tt.ten) || 1 });
    }
  }
  for (let i = 0; i < noi.length; i += LO_CHEN) {
    const { error } = await supabase.from('chunk_entities').insert(noi.slice(i, i + LO_CHEN));
    if (error) throw new LoiNap(`Gắn thực thể lỗi: ${error.message}`);
  }

  const canhBao = soatChatLuong(chunks.map((c) => c.noi_dung));

  await supabase
    .from('knowledge_document_versions')
    .update({ trang_thai: 'can_duyet', canh_bao: canhBao, buoc_loi: null, loi: null })
    .eq('id', versionId);

  await supabase
    .from('knowledge_documents')
    .update({ so_chunk: chunks.length, cap_nhat_luc: new Date().toISOString() })
    .eq('id', documentId);

  return canhBao;
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
