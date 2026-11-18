/**
 * G1 (CELES-24) — ĐẾM KHO TRI THỨC THẬT + LẬP BỘ 100 MỤC ĐÁP ÁN CHUẨN
 *
 * Chạy:
 *   npx tsx scripts/dem-kho-tri-thuc.ts [--ra-ngoai D:\Celestia]
 *
 * Nguyên tắc bắt buộc (KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md mục 2 & 9):
 *   1. CHỈ ĐỌC DB (read-only), KHÔNG ghi DB, KHÔNG gọi model AI (chi phí = 0).
 *   2. Đếm đủ 2 kho tri thức:
 *      - Kho sách trích xuất trong `noi_dung_ai` (`chart_hash = 'thu-vien'`, `be_mat = 'thu-vien'`)
 *      - Kho nghiệm lý của Chủ dự án trong `muc_thu_vien` & `muc_thu_vien_phien_ban`
 *   3. Đếm đủ 6 chỉ số:
 *      (1) Tổng mục theo chủ đề, đợt trích, trạng thái duyệt (`da-duyet` / `chua` / `bi-bac`),
 *          mức (`manh` / `vua` / `nhe`), chiều (`cat` / `hung` / `trung`), chế độ (`add` / `override` / `modify` / `neutralize`),
 *          và phân loại rủi ro theo v4 mục 5.1 (từ khoá biến cố nặng, `cheDo !== 'add'`, mâu thuẫn, mức `manh`).
 *      (2) Nhóm đã gộp có >= 2 câu trích khác nhau (`canCu.length >= 2`) và kiểm tra nguy cơ mất vế / khác phương diện (Quyết định 10.10).
 *      (3) Tài liệu nguồn (`knowledge_documents` / `knowledge_chunks`) không có đề mục `#` (`duong_de_muc` rỗng).
 *      (4) Cặp mâu thuẫn (`khoaDieuKien` trùng nhau nhưng chiều `cat` <> `hung` đối đầu) trong từng đợt và toàn kho.
 *      (5) Số bài đã lưu trong `noi_dung_ai` theo từng bề mặt (`be_mat`), thế hệ đệm (`th:9` vs cũ), và số `chart_hash` riêng biệt.
 *      (6) Tỉ lệ lá số nghèo căn cứ (`0` mục hoặc `< 2` mục khớp) theo từng chủ đề/tính năng trên 60 lá số tổng hợp cố định (`boLaSo(60)`),
 *          đo cả TRƯỚC và SAU khi chặn mục `nhan.muc === 'manh'` chưa duyệt (K1).
 *   4. Bộ 100 mục đáp án (`scripts/du-lieu/bo-100-muc-dap-an.json`):
 *      - Lưu ý 3 (mục 9 kế hoạch): KHÔNG tự gán nhãn bằng cảm tính AI. Chỉ lấy các mục có dấu vết Chủ dự án thật sự duyệt/bác làm đáp án `da-duyet` / `bi-bac`. Nếu DB hiện chưa đủ 100 mục có dấu vết duyệt/bác thật, báo cáo đúng số thật và tách rõ.
 *      - Tạo tập mục "sai cố ý" (`sai-co-y`) bằng phép biến đổi tất định (đảo chiều `cat` <-> `hung`, đảo độ sáng `M/V` <-> `H`, đổi cung, bỏ điều kiện ngoại lệ) có ghi rõ `phepSua`, `loaiLoi`, `loiKyVong` và vị trí đoạn nguồn.
 *      - Tuân thủ bản quyền (`lib/rag/thu-vien/kieu.ts:8-9`): file trong repo (`scripts/du-lieu/bo-100-muc-dap-an.json`) KHÔNG chứa nguyên văn câu trích sách có bản quyền (chỉ lưu `chunkId`, `documentId`, `tenSach`, `duongDeMuc`, `viTriDong`, `sha1Trich`). Bản kèm trích dẫn đầy đủ phục vụ chấm cục bộ lưu ngoài repo tại `D:\Celestia\bo-100-muc-dap-an-kem-trich.json`.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { boLaSo } from './lat-cat-su-nghiep';
import { lapLaSo } from '../lib/tuvi/ansao';
import { khopThuVien } from '../lib/rag/thu-vien/khop';
import { dungKhoiThuVien } from '../lib/rag/thu-vien/cho-prompt';
import { khoaDieuKien } from '../lib/rag/thu-vien/kiem';
import { saoCuaMuc, type MucThuVien } from '../lib/rag/thu-vien/kieu';
import { CAU_HOI_V3, CHU_DE_V3, type CauHoiV3 } from '../lib/rag/v3/khung';
import { dungDuKien } from '../lib/rag/v3/du-kien';
import { THU_VIEN_THEO_CHU_DE } from '../lib/rag/v3/xu-ly';

// Nạp biến môi trường từ .env.local hoặc ../tuvi-ai/.env.local (tuyệt đối không in ra)
const envPath = existsSync('.env.local')
  ? '.env.local'
  : existsSync('../tuvi-ai/.env.local')
    ? '../tuvi-ai/.env.local'
    : '';
if (!envPath) {
  throw new Error('Không tìm thấy .env.local hoặc ../tuvi-ai/.env.local');
}
for (const d of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
}

const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : macDinh;
};

// Từ khoá biến cố nặng theo kho-tri-thuc-to-be-2026-10.md mục 5.1 & 10.17
const REGEX_BIEN_CO_NANG =
  /\b(tử vong|chết yểu|đoản thọ|yểu tử|ung thư|bạo bệnh|bệnh nặng|tàn tật|mù lòa|phá sản|tán gia bại sản|tù tội|lao tù|tù ngục|ly hôn|đứt gánh|sát phu|khắc tử|tai nạn|họa lớn|tai họa|tuyệt tự)\b/i;

// Từ khoá thời gian / vận hạn để kiểm tra mục cũ có chữ thời gian (v4 mục 4.2, 4.4, 10.2)
const REGEX_THOI_GIAN =
  /\b(đại vận|đại hạn|tiểu vận|tiểu hạn|lưu niên|lưu nguyệt|lưu nhật|hạn gặp|vận gặp|vào hạn|đến hạn|năm nay|lưu thái tuế|lưu kình|lưu đà|lưu lộc|lưu mã|lưu khốc|lưu hư|lưu tang|lưu hổ|tiền vận|hậu vận|trung vận)\b/i;

function sha1(s: string): string {
  return createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 16);
}

/** Đọc phân trang PostgREST vượt trần 1000 dòng */
async function docPhanTrang<T>(
  truyVan: (tu: number, den: number) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>
): Promise<{ rows: T[]; error: { message: string; code?: string } | null }> {
  const rows: T[] = [];
  const BUOC = 1000;
  for (let tu = 0; ; tu += BUOC) {
    const { data, error } = await truyVan(tu, tu + BUOC - 1);
    if (error) return { rows, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BUOC) break;
  }
  return { rows, error: null };
}

interface DongThuVienRaw {
  khoa_ky: string;
  noi_dung: unknown;
  tao_luc: string;
}

interface DongKnowledgeDoc {
  id: string;
  tieu_de: string;
  ten_tep: string | null;
  he_phai: string | null;
  loai_nguon: string | null;
  muc_tin_cay: string | null;
  so_chunk: number | null;
  so_ky_tu: number | null;
  luu_tru: boolean | null;
  tao_luc: string;
}

interface DongKnowledgeVersion {
  id: string;
  document_id: string;
  phien_ban: string;
  trang_thai: string;
  so_chunk: number;
  tao_luc: string;
}

interface DongKnowledgeChunk {
  id: string;
  document_id: string;
  version_id: string | null;
  thu_tu: number;
  duong_de_muc: string | null;
  noi_dung: string;
  so_token: number | null;
  trang_thai: string | null;
}

async function main() {
  const thuMucNgoai = thamSo('ra-ngoai', 'D:\\Celestia');
  console.log('=== BẮT ĐẦU G1 (CELES-24): ĐẾM KHO TRI THỨC THẬT ===');

  // ---------------------------------------------------------------------------
  // PHẦN 1: ĐẾM KHO SÁCH TRONG `noi_dung_ai` (`chart_hash = 'thu-vien'`, `be_mat = 'thu-vien'`)
  // VÀ KHO NGHIỆM LÝ TRONG `muc_thu_vien` / `muc_thu_vien_phien_ban`
  // ---------------------------------------------------------------------------
  console.log('\n[1/7] Đang đọc kho sách từ bảng noi_dung_ai (chart_hash=thu-vien)...');
  const { rows: dongThuVien, error: loiThuVien } = await docPhanTrang<DongThuVienRaw>((tu, den) =>
    sb
      .from('noi_dung_ai')
      .select('khoa_ky, noi_dung, tao_luc')
      .eq('chart_hash', 'thu-vien')
      .eq('be_mat', 'thu-vien')
      .order('khoa_ky', { ascending: true })
      .range(tu, den)
  );
  if (loiThuVien) {
    throw new Error(`Lỗi đọc noi_dung_ai (thu-vien): ${loiThuVien.message}`);
  }

  const goiRows = dongThuVien.filter((d) => d.khoa_ky.startsWith('goi:'));
  const leRows = dongThuVien.filter((d) => !d.khoa_ky.startsWith('goi:'));

  // Thu thập mục từ các gói `goi:<dot>` và các dòng lẻ `<id>`
  const mucTuGoi = new Map<string, { muc: MucThuVien; goi: string; capNhatLuc: string }>();
  const thongKeGoi: Array<{
    khoaKy: string;
    soMuc: number;
    capNhatLuc: string;
    chuDe: Record<string, number>;
  }> = [];

  for (const g of goiRows) {
    const ds = Array.isArray(g.noi_dung) ? (g.noi_dung as MucThuVien[]) : [];
    const demChuDe: Record<string, number> = {};
    for (const m of ds) {
      if (!m || typeof m !== 'object' || !m.id) continue;
      const cdStr = Array.isArray(m.chuDe) ? m.chuDe.join(',') : String(m.chuDe ?? '');
      demChuDe[cdStr] = (demChuDe[cdStr] ?? 0) + 1;
      mucTuGoi.set(m.id, { muc: m, goi: g.khoa_ky, capNhatLuc: g.tao_luc });
    }
    thongKeGoi.push({
      khoaKy: g.khoa_ky,
      soMuc: ds.length,
      capNhatLuc: g.tao_luc,
      chuDe: demChuDe,
    });
  }

  const mucTuDongLe = new Map<string, { muc: MucThuVien; capNhatLuc: string }>();
  let soDongLeKhacGoi = 0;
  let soDongLeChiCoLe = 0;
  for (const l of leRows) {
    const m = l.noi_dung as MucThuVien;
    if (!m || typeof m !== 'object' || !m.id) continue;
    mucTuDongLe.set(m.id, { muc: m, capNhatLuc: l.tao_luc });
    const trongGoi = mucTuGoi.get(m.id);
    if (!trongGoi) {
      soDongLeChiCoLe++;
    } else if (trongGoi.muc.duyet !== m.duyet || trongGoi.muc.y !== m.y) {
      soDongLeKhacGoi++;
    }
  }

  // Hợp nhất giống logic docThuVien() trong lib/rag/thu-vien/kho.ts:
  // nếu đọc theo gói thì gói là nguồn chính, nhưng nếu duyệt qua suaTrangThaiDuyet() thì dòng lẻ VÀ gói đều được cập nhật.
  // Ta lấy toàn bộ mục duy nhất theo id (ưu tiên bản mới hơn nếu có khác biệt).
  const tatCaMucMap = new Map<string, MucThuVien>();
  for (const [id, v] of mucTuGoi.entries()) tatCaMucMap.set(id, v.muc);
  for (const [id, v] of mucTuDongLe.entries()) {
    if (!tatCaMucMap.has(id)) {
      tatCaMucMap.set(id, v.muc);
    } else {
      const cu = mucTuGoi.get(id)!;
      if (v.capNhatLuc > cu.capNhatLuc) {
        tatCaMucMap.set(id, v.muc);
      }
    }
  }
  const tatCaMuc = [...tatCaMucMap.values()];
  console.log(
    `  -> Tổng dòng noi_dung_ai(thu-vien): ${dongThuVien.length} (${goiRows.length} gói, ${leRows.length} dòng lẻ) => ${tatCaMuc.length} mục duy nhất.`
  );

  // Kiểm tra kho nghiệm lý `muc_thu_vien` và `muc_thu_vien_phien_ban` (QĐ13)
  console.log('[2/7] Đang kiểm tra kho nghiệm lý (muc_thu_vien & muc_thu_vien_phien_ban)...');
  const { data: dsMucNghiemLy, error: loiMucNghiemLy } = await sb
    .from('muc_thu_vien')
    .select('*')
    .limit(1000);
  const { data: dsPhienBanNghiemLy, error: loiPhienBanNghiemLy } = await sb
    .from('muc_thu_vien_phien_ban')
    .select('*')
    .limit(1000);

  const khoNghiemLy = {
    bangMucThuVienTonTai: !loiMucNghiemLy,
    loiMucThuVien: loiMucNghiemLy ? `${loiMucNghiemLy.code ?? ''} ${loiMucNghiemLy.message}`.trim() : null,
    soMucNghiemLy: dsMucNghiemLy?.length ?? 0,
    bangPhienBanTonTai: !loiPhienBanNghiemLy,
    loiPhienBan: loiPhienBanNghiemLy ? `${loiPhienBanNghiemLy.code ?? ''} ${loiPhienBanNghiemLy.message}`.trim() : null,
    soPhienBanNghiemLy: dsPhienBanNghiemLy?.length ?? 0,
  };
  console.log(
    `  -> Bảng muc_thu_vien: ${khoNghiemLy.bangMucThuVienTonTai ? `TỒN TẠI (${khoNghiemLy.soMucNghiemLy} dòng)` : `CHƯA TẠO (${khoNghiemLy.loiMucThuVien})`}`
  );

  // Kiểm tra admin_audit_log xem có lịch sử duyệt mục thư viện hay nghiệm lý nào không
  const { rows: auditLogs } = await docPhanTrang<{
    id: string;
    hanh_dong: string;
    doi_tuong: string | null;
    doi_tuong_id: string | null;
    tao_luc: string;
  }>((tu, den) =>
    sb
      .from('admin_audit_log')
      .select('id, hanh_dong, doi_tuong, doi_tuong_id, tao_luc')
      .order('tao_luc', { ascending: false })
      .range(tu, den)
  );
  const auditLienQuanThuVien = (auditLogs ?? []).filter(
    (a) =>
      /thu-vien|nghiem-ly|library|knowledge/i.test(a.hanh_dong ?? '') ||
      /thu-vien|nghiem-ly|library|knowledge/i.test(a.doi_tuong ?? '')
  );

  // ---------------------------------------------------------------------------
  // PHẦN 2: ĐẾM TÀI LIỆU NGUỒN (`knowledge_documents` & `knowledge_chunks`) TRƯỚC ĐỂ TRA CỨU ĐỀ MỤC
  // ---------------------------------------------------------------------------
  console.log('[3/7] Đang đếm tài liệu nguồn và các đoạn (knowledge_chunks) thiếu đề mục #...');
  const { rows: docs, error: loiDocs } = await docPhanTrang<DongKnowledgeDoc>((tu, den) =>
    sb
      .from('knowledge_documents')
      .select('id, tieu_de, ten_tep, he_phai, loai_nguon, muc_tin_cay, so_chunk, so_ky_tu, luu_tru, tao_luc')
      .order('tao_luc', { ascending: true })
      .range(tu, den)
  );
  if (loiDocs) throw new Error(`Lỗi đọc knowledge_documents: ${loiDocs.message}`);

  const { rows: docVersions, error: loiVersions } = await docPhanTrang<DongKnowledgeVersion>((tu, den) =>
    sb
      .from('knowledge_document_versions')
      .select('id, document_id, phien_ban, trang_thai, so_chunk, tao_luc')
      .order('tao_luc', { ascending: true })
      .range(tu, den)
  );
  if (loiVersions) throw new Error(`Lỗi đọc knowledge_document_versions: ${loiVersions.message}`);

  const { rows: chunks, error: loiChunks } = await docPhanTrang<DongKnowledgeChunk>((tu, den) =>
    sb
      .from('knowledge_chunks')
      .select('id, document_id, version_id, thu_tu, duong_de_muc, noi_dung, so_token, trang_thai')
      .order('document_id', { ascending: true })
      .order('thu_tu', { ascending: true })
      .range(tu, den)
  );
  if (loiChunks) throw new Error(`Lỗi đọc knowledge_chunks: ${loiChunks.message}`);

  const chunkMap = new Map<string, DongKnowledgeChunk>();
  const docMap = new Map<string, DongKnowledgeDoc>();
  for (const d of docs) docMap.set(d.id, d);
  for (const c of chunks) chunkMap.set(c.id, c);

  const dsChuDeCuaMuc = (m: MucThuVien): string[] =>
    Array.isArray(m.chuDe) ? m.chuDe : m.chuDe ? [String(m.chuDe)] : ['khong-ro'];
  const chuDeChinhCuaMuc = (m: MucThuVien): string => dsChuDeCuaMuc(m)[0] ?? 'khong-ro';
  const duongDeMucCuaCanCu = (c: { chunkId: string; duongDeMuc?: string }): string =>
    (c.duongDeMuc ?? chunkMap.get(c.chunkId)?.duong_de_muc ?? '').trim();

  const thongKeTaiLieu = docs.map((d) => {
    const versionsDoc = docVersions.filter((v) => v.document_id === d.id);
    const versionXuatBan = versionsDoc.find((v) => v.trang_thai === 'da_xuat_ban');
    const tatCaChunkDoc = chunks.filter((c) => c.document_id === d.id && c.trang_thai !== 'loai_tru');
    const chunkHienHanh = versionXuatBan
      ? tatCaChunkDoc.filter((c) => c.version_id === versionXuatBan.id)
      : tatCaChunkDoc;
    const dsDeMucCo = chunkHienHanh.filter((c) => c.duong_de_muc && c.duong_de_muc.trim().length > 0);
    const dsKhongDeMuc = chunkHienHanh.filter((c) => !c.duong_de_muc || c.duong_de_muc.trim().length === 0);
    const dsNganDuoi40 = chunkHienHanh.filter((c) => (c.noi_dung?.trim().length ?? 0) < 40);
    const coDauThangTrongContent = chunkHienHanh.filter((c) => /^#{1,6}\s+/m.test(c.noi_dung ?? '')).length;

    return {
      id: d.id,
      title: d.tieu_de,
      fileName: d.ten_tep,
      hePhai: d.he_phai,
      loaiNguon: d.loai_nguon,
      mucTinCay: d.muc_tin_cay,
      luuTru: d.luu_tru,
      phienBanXuatBan: versionXuatBan?.phien_ban ?? null,
      soPhienBan: versionsDoc.length,
      tongChunkMoiPhienBan: tatCaChunkDoc.length,
      soChunkPhienBanHienHanh: chunkHienHanh.length,
      soChunkCoDeMuc: dsDeMucCo.length,
      soChunkKhongDeMuc: dsKhongDeMuc.length,
      tiLeKhongDeMuc:
        chunkHienHanh.length > 0
          ? Math.round((1000 * dsKhongDeMuc.length) / chunkHienHanh.length) / 10
          : 0,
      soChunkNganDuoi40KyTu: dsNganDuoi40.length,
      soChunkCoHeadingMarkdownTrongContent: coDauThangTrongContent,
      hoanToanKhongCoDeMuc: chunkHienHanh.length > 0 && dsDeMucCo.length === 0,
    };
  });

  // Kiểm tra bao nhiêu căn cứ trong `tatCaMuc` trỏ tới chunk không có `duongDeMuc`
  let soCanCuKhongDeMuc = 0;
  let soCanCuKhongTimThayChunk = 0;
  let tongSoCanCu = 0;
  for (const m of tatCaMuc) {
    for (const c of m.canCu ?? []) {
      tongSoCanCu++;
      if (!chunkMap.has(c.chunkId)) soCanCuKhongTimThayChunk++;
      if (!duongDeMucCuaCanCu(c)) {
        soCanCuKhongDeMuc++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PHẦN 3: THỐNG KÊ CHI TIẾT CÁC MỤC TRONG KHO SÁCH (TRẠNG THÁI DUYỆT, MỨC, CHIỀU, GỘP, MÂU THUẪN)
  // ---------------------------------------------------------------------------
  console.log('[4/7] Đang phân tích trạng thái duyệt, nhóm gộp >= 2 trích dẫn và cặp mâu thuẫn...');

  const theoDuyet: Record<string, number> = { 'da-duyet': 0, chua: 0, 'bi-bac': 0, khac: 0 };
  const theoMuc: Record<string, number> = { manh: 0, vua: 0, nhe: 0, khac: 0 };
  const theoChieu: Record<string, number> = { cat: 0, hung: 0, trung: 0, khac: 0 };
  const theoCheDo: Record<string, number> = { add: 0, override: 0, modify: 0, neutralize: 0, khac: 0 };

  const theoChuDe: Record<
    string,
    {
      tong: number;
      daDuyet: number;
      chua: number;
      biBac: number;
      manh: number;
      vua: number;
      nhe: number;
      cat: number;
      hung: number;
      trung: number;
      add: number;
      override: number;
      modify: number;
      neutralize: number;
      gopTu2CanCu: number;
      coTuKhoaBienCoNang: number;
      coTuKhoaThoiGian: number;
      ruiRoCaoCanChan: number; // theo v4 5.1: manh + bienCoNang + cheDo !== 'add' + mauThuan
    }
  > = {};

  const theoDotTrich: Record<
    string,
    {
      tong: number;
      chuDe: string;
      daDuyet: number;
      chua: number;
      biBac: number;
      manh: number;
      vua: number;
      nhe: number;
      gopTu2CanCu: number;
    }
  > = {};

  // Tìm các cặp mâu thuẫn (cùng khoaDieuKien nhưng có cả cat và hung)
  // 1) Trên toàn kho
  // 2) Trong cùng chủ đề (`chuDe`)
  const nhomKhoaToanKho = new Map<string, MucThuVien[]>();
  const nhomKhoaTheoChuDe = new Map<string, Map<string, MucThuVien[]>>();

  for (const m of tatCaMuc) {
    const k = khoaDieuKien(m);
    const dsToan = nhomKhoaToanKho.get(k) ?? [];
    dsToan.push(m);
    nhomKhoaToanKho.set(k, dsToan);

    for (const cd of dsChuDeCuaMuc(m)) {
      const mapCD = nhomKhoaTheoChuDe.get(cd) ?? new Map<string, MucThuVien[]>();
      const dsCD = mapCD.get(k) ?? [];
      dsCD.push(m);
      mapCD.set(k, dsCD);
      nhomKhoaTheoChuDe.set(cd, mapCD);
    }
  }

  const idMucMauThuanToanKho = new Set<string>();
  const capMauThuanToanKho: Array<{
    khoa: string;
    chuDe: string[];
    soMucCat: number;
    soMucHung: number;
    soMucTrung: number;
    idsCat: string[];
    idsHung: string[];
    mauYCat: string;
    mauYHung: string;
  }> = [];

  for (const [k, ds] of nhomKhoaToanKho.entries()) {
    if (ds.length < 2) continue;
    const cat = ds.filter((m) => m.nhan?.chieu === 'cat');
    const hung = ds.filter((m) => m.nhan?.chieu === 'hung');
    const trung = ds.filter((m) => m.nhan?.chieu === 'trung');
    if (cat.length > 0 && hung.length > 0) {
      for (const m of ds) idMucMauThuanToanKho.add(m.id);
      capMauThuanToanKho.push({
        khoa: k,
        chuDe: [...new Set(ds.flatMap((m) => dsChuDeCuaMuc(m)))],
        soMucCat: cat.length,
        soMucHung: hung.length,
        soMucTrung: trung.length,
        idsCat: cat.map((m) => m.id),
        idsHung: hung.map((m) => m.id),
        mauYCat: cat[0].y,
        mauYHung: hung[0].y,
      });
    }
  }

  const capMauThuanTheoChuDe: Record<string, number> = {};
  const idMucMauThuanCungChuDe = new Set<string>();
  for (const [cd, mapCD] of nhomKhoaTheoChuDe.entries()) {
    let dem = 0;
    for (const [, ds] of mapCD.entries()) {
      const cat = ds.filter((m) => m.nhan?.chieu === 'cat');
      const hung = ds.filter((m) => m.nhan?.chieu === 'hung');
      if (cat.length > 0 && hung.length > 0) {
        dem++;
        for (const m of ds) idMucMauThuanCungChuDe.add(m.id);
      }
    }
    capMauThuanTheoChuDe[cd] = dem;
  }

  // Phân tích nhóm đã gộp (`canCu.length >= 2`)
  let tongMucCoNhieuCanCu = 0;
  let tongMucCoTrichKhacNhau = 0;
  let tongMucGopKhacChuongMuc = 0;
  let tongMucGopNghiMatVe = 0; // Quyết định 10.10: trích dẫn dài / khác đoạn nhưng câu y ngắn gọn hoặc chỉ giữ 1 vế
  const phanBoSoCanCu: Record<number, number> = {};
  const mauNhomDaGop: Array<{
    id: string;
    chuDe: string;
    dotTrich: string;
    soCanCu: number;
    soTrichKhacNhau: number;
    khacDeMuc: boolean;
    nghiMatVe: boolean;
    y: string;
    doDaiY: number;
    tongDoDaiTrich: number;
    deMucList: string[];
    chunkIds: string[];
  }> = [];

  let demBienCoNang = 0;
  let demThoiGianTrongYHoacTrich = 0;
  let demThoiGianTrongDeMuc = 0;
  let demRuiRoCaoV4 = 0;

  for (const m of tatCaMuc) {
    const cd = chuDeChinhCuaMuc(m);
    const duyet = m.duyet in theoDuyet ? m.duyet : 'khac';
    theoDuyet[duyet]++;

    const muc = m.nhan?.muc in theoMuc ? m.nhan.muc : 'khac';
    theoMuc[muc]++;

    const chieu = m.nhan?.chieu in theoChieu ? m.nhan.chieu : 'khac';
    theoChieu[chieu]++;

    const cheDo = m.cheDo in theoCheDo ? m.cheDo : 'khac';
    theoCheDo[cheDo]++;

    if (!theoChuDe[cd]) {
      theoChuDe[cd] = {
        tong: 0,
        daDuyet: 0,
        chua: 0,
        biBac: 0,
        manh: 0,
        vua: 0,
        nhe: 0,
        cat: 0,
        hung: 0,
        trung: 0,
        add: 0,
        override: 0,
        modify: 0,
        neutralize: 0,
        gopTu2CanCu: 0,
        coTuKhoaBienCoNang: 0,
        coTuKhoaThoiGian: 0,
        ruiRoCaoCanChan: 0,
      };
    }
    const tkCD = theoChuDe[cd];
    tkCD.tong++;
    if (m.duyet === 'da-duyet') tkCD.daDuyet++;
    else if (m.duyet === 'chua') tkCD.chua++;
    else if (m.duyet === 'bi-bac') tkCD.biBac++;

    if (m.nhan?.muc === 'manh') tkCD.manh++;
    else if (m.nhan?.muc === 'vua') tkCD.vua++;
    else if (m.nhan?.muc === 'nhe') tkCD.nhe++;

    if (m.nhan?.chieu === 'cat') tkCD.cat++;
    else if (m.nhan?.chieu === 'hung') tkCD.hung++;
    else if (m.nhan?.chieu === 'trung') tkCD.trung++;

    if (m.cheDo === 'add') tkCD.add++;
    else if (m.cheDo === 'override') tkCD.override++;
    else if (m.cheDo === 'modify') tkCD.modify++;
    else if (m.cheDo === 'neutralize') tkCD.neutralize++;

    const dot = m.dotTrich || 'khong-ro';
    if (!theoDotTrich[dot]) {
      theoDotTrich[dot] = {
        tong: 0,
        chuDe: cd,
        daDuyet: 0,
        chua: 0,
        biBac: 0,
        manh: 0,
        vua: 0,
        nhe: 0,
        gopTu2CanCu: 0,
      };
    }
    const tkDot = theoDotTrich[dot];
    tkDot.tong++;
    if (m.duyet === 'da-duyet') tkDot.daDuyet++;
    else if (m.duyet === 'chua') tkDot.chua++;
    else if (m.duyet === 'bi-bac') tkDot.biBac++;
    if (m.nhan?.muc === 'manh') tkDot.manh++;
    else if (m.nhan?.muc === 'vua') tkDot.vua++;
    else if (m.nhan?.muc === 'nhe') tkDot.nhe++;

    const soCanCu = m.canCu?.length ?? 0;
    phanBoSoCanCu[soCanCu] = (phanBoSoCanCu[soCanCu] ?? 0) + 1;

    const toanBoTrich = (m.canCu ?? []).map((c) => c.trich?.trim() ?? '').filter(Boolean);
    const toanBoDeMuc = (m.canCu ?? []).map((c) => duongDeMucCuaCanCu(c)).filter(Boolean);
    const vanBanGop = `${m.y} ${toanBoTrich.join(' ')}`;

    const coBienCoNang = REGEX_BIEN_CO_NANG.test(vanBanGop);
    if (coBienCoNang) {
      demBienCoNang++;
      tkCD.coTuKhoaBienCoNang++;
    }

    const coThoiGianTrongVanBan = REGEX_THOI_GIAN.test(vanBanGop);
    const coThoiGianTrongDeMuc = REGEX_THOI_GIAN.test(toanBoDeMuc.join(' '));
    if (coThoiGianTrongVanBan) {
      demThoiGianTrongYHoacTrich++;
      tkCD.coTuKhoaThoiGian++;
    } else if (coThoiGianTrongDeMuc) {
      demThoiGianTrongDeMuc++;
      tkCD.coTuKhoaThoiGian++;
    }

    // Quy tắc rủi ro cao theo v4 mục 5.1:
    // (1) nhan.muc === 'manh', hoặc (2) có từ khoá biến cố nặng, hoặc (3) cheDo !== 'add', hoặc (4) nằm trong cặp mâu thuẫn
    const laRuiRoCao =
      m.nhan?.muc === 'manh' ||
      coBienCoNang ||
      m.cheDo !== 'add' ||
      idMucMauThuanToanKho.has(m.id);
    if (laRuiRoCao && m.duyet !== 'da-duyet') {
      demRuiRoCaoV4++;
      tkCD.ruiRoCaoCanChan++;
    }

    if (soCanCu >= 2) {
      tongMucCoNhieuCanCu++;
      tkCD.gopTu2CanCu++;
      tkDot.gopTu2CanCu++;

      const trichDuyNhat = new Set(toanBoTrich.map((t) => t.toLowerCase()));
      const deMucDuyNhat = new Set(toanBoDeMuc);
      const khacTrich = trichDuyNhat.size >= 2;
      const khacDeMuc = deMucDuyNhat.size >= 2;
      if (khacTrich) tongMucCoTrichKhacNhau++;
      if (khacDeMuc) tongMucGopKhacChuongMuc++;

      const tongDoDaiTrich = toanBoTrich.reduce((s, t) => s + t.length, 0);
      // Nếu có >= 2 câu trích khác nhau và tổng độ dài trích gấp >= 2.2 lần câu `y`, hoặc khác đề mục chương sách -> nguy cơ gộp làm mất vế (10.10)
      const nghiMatVe = khacTrich && (khacDeMuc || tongDoDaiTrich > m.y.length * 2.2);
      if (nghiMatVe) tongMucGopNghiMatVe++;

      if (mauNhomDaGop.length < 25 && khacTrich) {
        mauNhomDaGop.push({
          id: m.id,
          chuDe: cd,
          dotTrich: m.dotTrich,
          soCanCu,
          soTrichKhacNhau: trichDuyNhat.size,
          khacDeMuc,
          nghiMatVe,
          y: m.y,
          doDaiY: m.y.length,
          tongDoDaiTrich,
          deMucList: [...deMucDuyNhat],
          chunkIds: (m.canCu ?? []).map((c) => c.chunkId),
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PHẦN 4: ĐẾM SỐ BÀI ĐÃ LƯU TRONG `noi_dung_ai` THEO BỀ MẶT (`be_mat`)
  // ---------------------------------------------------------------------------
  console.log('[5/7] Đang đếm số bài AI đã lưu trong noi_dung_ai theo từng bề mặt...');
  const { rows: tatCaNoiDungAi, error: loiNoiDungAi } = await docPhanTrang<{
    chart_hash: string;
    be_mat: string;
    khoa_ky: string;
    tao_luc: string;
  }>((tu, den) =>
    sb
      .from('noi_dung_ai')
      .select('chart_hash, be_mat, khoa_ky, tao_luc')
      .order('be_mat', { ascending: true })
      .range(tu, den)
  );
  if (loiNoiDungAi) throw new Error(`Lỗi đọc toàn bộ noi_dung_ai: ${loiNoiDungAi.message}`);

  const theoBeMat: Record<
    string,
    {
      tongDong: number;
      production: number;
      preview: number;
      local: number;
      soChartHashRieng: number;
      theHeHienTaiTh9: number;
      theHeCu: number;
      chiTietTheHe: Record<string, number>;
      capNhatMoiNhat: string;
    }
  > = {};
  const chartHashSetTheoBeMat = new Map<string, Set<string>>();

  for (const row of tatCaNoiDungAi) {
    const bm = row.be_mat;
    if (!theoBeMat[bm]) {
      theoBeMat[bm] = {
        tongDong: 0,
        production: 0,
        preview: 0,
        local: 0,
        soChartHashRieng: 0,
        theHeHienTaiTh9: 0,
        theHeCu: 0,
        chiTietTheHe: {},
        capNhatMoiNhat: row.tao_luc,
      };
      chartHashSetTheoBeMat.set(bm, new Set());
    }
    const tk = theoBeMat[bm];
    tk.tongDong++;
    if (row.tao_luc > tk.capNhatMoiNhat) tk.capNhatMoiNhat = row.tao_luc;

    if (row.chart_hash.startsWith('preview:')) tk.preview++;
    else if (row.chart_hash.startsWith('local:')) tk.local++;
    else tk.production++;

    chartHashSetTheoBeMat.get(bm)!.add(row.chart_hash);

    if (bm === 'luan-giai-v3') {
      const mTh = row.khoa_ky.match(/\|(th:\d+)$/);
      const nhanTh = mTh ? mTh[1] : 'khong-ro-th';
      tk.chiTietTheHe[nhanTh] = (tk.chiTietTheHe[nhanTh] ?? 0) + 1;
      if (nhanTh === 'th:9') tk.theHeHienTaiTh9++;
      else tk.theHeCu++;
    }
  }
  for (const [bm, setHash] of chartHashSetTheoBeMat.entries()) {
    theoBeMat[bm].soChartHashRieng = setHash.size;
  }

  // ---------------------------------------------------------------------------
  // PHẦN 5: ĐO TỈ LỆ LÁ SỐ NGHÈO CĂN CỨ THEO TÍNH NĂNG / CHỦ ĐỀ (TRÊN 60 LÁ SỐ CỐ ĐỊNH)
  // ---------------------------------------------------------------------------
  console.log('[6/7] Đang đo tỉ lệ lá số nghèo căn cứ trên 60 lá số tổng hợp cố định...');
  const SO_LA_DO_NGHEO = 60;
  const dsThongTinLa = boLaSo(SO_LA_DO_NGHEO);
  const dsLaSo = dsThongTinLa.map((l) => lapLaSo(l));

  // Gom các câu hỏi V3 theo từng chủ đề có dùng thư viện (theo THU_VIEN_THEO_CHU_DE trong lib/rag/v3/xu-ly.ts)
  const cauHoiMap = new Map<string, CauHoiV3>();
  for (const ch of CAU_HOI_V3) cauHoiMap.set(ch.id, ch);

  const metaTaiLieuMap = new Map<string, { mucTinCay: string; loaiNguon: string }>();
  for (const d of docs) {
    metaTaiLieuMap.set(d.id, {
      mucTinCay: d.muc_tin_cay ?? 'tham-khao',
      loaiNguon: d.loai_nguon ?? 'sach',
    });
  }

  // Tập mục theo từng chủ đề + đợt trích giống docThuVien(chuDe, dot) trong lib/rag/thu-vien/kho.ts
  const baoCaoNgheoCanCu: Record<
    string,
    {
      tenChuDeV3: string;
      dotDangBat: string;
      dsCauDangBat: string[];
      soCauHoiV3: number;
      tongDonViLaSoXCau: number;
      hienTai: {
        soMucKho: number;
        khongCoMucNao: number; // 0 mục
        ngheoDuoi2Muc: number; // < 2 mục (0 hoặc 1)
        tiLe0Muc: number;
        tiLeDuoi2Muc: number;
        soMucTrungBinh: number;
      };
      sauK1ChanManhChuaDuyet: {
        soMucKho: number;
        khongCoMucNao: number;
        ngheoDuoi2Muc: number;
        tiLe0Muc: number;
        tiLeDuoi2Muc: number;
        soMucTrungBinh: number;
      };
      sauChanRuiRoCaoV4ChuaDuyet: {
        soMucKho: number;
        khongCoMucNao: number;
        ngheoDuoi2Muc: number;
        tiLe0Muc: number;
        tiLeDuoi2Muc: number;
        soMucTrungBinh: number;
      };
      neuChiDungDaDuyet: {
        soMucKho: number;
        khongCoMucNao: number;
        ngheoDuoi2Muc: number;
        tiLe0Muc: number;
        tiLeDuoi2Muc: number;
      };
    }
  > = {};

  for (const [maCD, cauHinhTV] of Object.entries(THU_VIEN_THEO_CHU_DE)) {
    const tenChuDeV3 = CHU_DE_V3.find((c) => c.id === maCD)?.ten ?? maCD;
    const cacDot = new Set(
      cauHinhTV.dot
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const dsCau = cauHinhTV.cau.map((id) => cauHoiMap.get(id)).filter((x): x is CauHoiV3 => Boolean(x));

    const khoHienTai = tatCaMuc.filter(
      (m) => dsChuDeCuaMuc(m).includes(maCD) && m.duyet !== 'bi-bac' && (cacDot.size === 0 || cacDot.has(m.dotTrich))
    );
    const khoSauK1 = khoHienTai.filter(
      (m) => !(m.nhan?.muc === 'manh' && m.duyet !== 'da-duyet')
    );
    const khoSauRuiRoV4 = khoHienTai.filter((m) => {
      if (m.duyet === 'da-duyet') return true;
      const toanBoTrich = (m.canCu ?? []).map((c) => c.trich ?? '').join(' ');
      const coBienCo = REGEX_BIEN_CO_NANG.test(`${m.y} ${toanBoTrich}`);
      const laRuiRo =
        m.nhan?.muc === 'manh' ||
        coBienCo ||
        m.cheDo !== 'add' ||
        idMucMauThuanToanKho.has(m.id);
      return !laRuiRo;
    });
    const khoChiDaDuyet = khoHienTai.filter((m) => m.duyet === 'da-duyet');

    const doTrenTapKho = (kho: MucThuVien[]) => {
      let donVi = 0;
      let dem0 = 0;
      let demDuoi2 = 0;
      let tongMucChon = 0;

      for (const laSo of dsLaSo) {
        for (const cau of dsCau) {
          donVi++;
          const duKien = dungDuKien(laSo, cau, 2026);
          const cungChuDe =
            cau.loai === 'chuyen-sau'
              ? (cau.cungChinh ?? CHU_DE_V3.find((c) => c.id === cau.chuDe)?.cungChinh)
              : undefined;
          const kqTV = dungKhoiThuVien({
            laSo,
            duKien,
            thuVien: kho,
            cungChinh: cungChuDe,
            meta: metaTaiLieuMap,
          });
          const n = kqTV.daChon.length;
          tongMucChon += n;
          if (n === 0) dem0++;
          if (n < 2) demDuoi2++;
        }
      }
      return {
        soMucKho: kho.length,
        khongCoMucNao: dem0,
        ngheoDuoi2Muc: demDuoi2,
        tiLe0Muc: donVi > 0 ? Math.round((1000 * dem0) / donVi) / 10 : 0,
        tiLeDuoi2Muc: donVi > 0 ? Math.round((1000 * demDuoi2) / donVi) / 10 : 0,
        soMucTrungBinh: donVi > 0 ? Math.round((100 * tongMucChon) / donVi) / 100 : 0,
      };
    };

    const kqHienTai = doTrenTapKho(khoHienTai);
    const kqSauK1 = doTrenTapKho(khoSauK1);
    const kqSauRuiRoV4 = doTrenTapKho(khoSauRuiRoV4);
    const kqChiDaDuyet = doTrenTapKho(khoChiDaDuyet);

    baoCaoNgheoCanCu[maCD] = {
      tenChuDeV3,
      dotDangBat: cauHinhTV.dot,
      dsCauDangBat: cauHinhTV.cau,
      soCauHoiV3: dsCau.length,
      tongDonViLaSoXCau: dsLaSo.length * dsCau.length,
      hienTai: kqHienTai,
      sauK1ChanManhChuaDuyet: kqSauK1,
      sauChanRuiRoCaoV4ChuaDuyet: kqSauRuiRoV4,
      neuChiDungDaDuyet: {
        soMucKho: kqChiDaDuyet.soMucKho,
        khongCoMucNao: kqChiDaDuyet.khongCoMucNao,
        ngheoDuoi2Muc: kqChiDaDuyet.ngheoDuoi2Muc,
        tiLe0Muc: kqChiDaDuyet.tiLe0Muc,
        tiLeDuoi2Muc: kqChiDaDuyet.tiLeDuoi2Muc,
      },
    };
  }

  // Đo thêm theo từng cung (12 cung trên 60 lá số = 720 cung) xem cung nào hay nghèo căn cứ nhất
  const DANH_SACH_12_CUNG = [
    'Mệnh',
    'Phụ Mẫu',
    'Phúc Đức',
    'Điền Trạch',
    'Quan Lộc',
    'Nô Bộc',
    'Thiên Di',
    'Tật Ách',
    'Tài Bạch',
    'Tử Tức',
    'Phu Thê',
    'Huynh Đệ',
  ];
  const tatCaMucKhongBiBac = tatCaMuc.filter((m) => m.duyet !== 'bi-bac');
  const tatCaMucSauK1 = tatCaMucKhongBiBac.filter(
    (m) => !(m.nhan?.muc === 'manh' && m.duyet !== 'da-duyet')
  );
  const ngheoTheoCung: Record<
    string,
    {
      hienTai0Muc: number;
      hienTaiDuoi2Muc: number;
      sauK1_0Muc: number;
      sauK1_Duoi2Muc: number;
      tiLeSauK1Duoi2Muc: number;
    }
  > = {};

  for (const tenCung of DANH_SACH_12_CUNG) {
    let ht0 = 0,
      ht2 = 0,
      k1_0 = 0,
      k1_2 = 0;
    for (const laSo of dsLaSo) {
      const khopHT = khopThuVien(laSo, tatCaMucKhongBiBac, [tenCung]);
      const khopK1 = khopThuVien(laSo, tatCaMucSauK1, [tenCung]);
      if (khopHT.length === 0) ht0++;
      if (khopHT.length < 2) ht2++;
      if (khopK1.length === 0) k1_0++;
      if (khopK1.length < 2) k1_2++;
    }
    ngheoTheoCung[tenCung] = {
      hienTai0Muc: ht0,
      hienTaiDuoi2Muc: ht2,
      sauK1_0Muc: k1_0,
      sauK1_Duoi2Muc: k1_2,
      tiLeSauK1Duoi2Muc: Math.round((1000 * k1_2) / dsLaSo.length) / 10,
    };
  }

  // ---------------------------------------------------------------------------
  // PHẦN 6: LẬP BỘ 100 MỤC ĐÁP ÁN (`scripts/du-lieu/bo-100-muc-dap-an.json`)
  // ---------------------------------------------------------------------------
  console.log('[7/7] Đang lập bộ 100 mục đáp án và kiểm tra dấu vết duyệt thật của Chủ dự án...');

  // 1. Lấy tất cả mục có `duyet === 'da-duyet'` hoặc `duyet === 'bi-bac'` thật sự trong DB
  const mucDaDuyetThat = tatCaMuc.filter((m) => m.duyet === 'da-duyet');
  const mucBiBacThat = tatCaMuc.filter((m) => m.duyet === 'bi-bac');

  // Helper tra cứu vị trí dòng trong sách từ chunkId + trich
  const traViTriNguon = (m: MucThuVien) => {
    const cc = m.canCu?.[0];
    if (!cc) {
      return {
        documentId: null,
        tenSach: null,
        chunkId: null,
        chunkIndex: null,
        duongDeMuc: null,
        dongTrongChunk: null,
        sha1Trich: null,
      };
    }
    const ch = chunkMap.get(cc.chunkId);
    const doc = ch ? docMap.get(ch.document_id) : undefined;
    let dongTrongChunk: number | null = null;
    if (ch?.noi_dung && cc.trich) {
      const idx = ch.noi_dung.indexOf(cc.trich.slice(0, 40));
      if (idx >= 0) {
        dongTrongChunk = ch.noi_dung.slice(0, idx).split(/\r?\n/).length;
      }
    }
    return {
      documentId: ch?.document_id ?? cc.documentId ?? null,
      tenSach: doc?.tieu_de ?? null,
      chunkId: cc.chunkId,
      chunkIndex: ch?.thu_tu ?? null,
      duongDeMuc: ch?.duong_de_muc ?? null,
      dongTrongChunk,
      sha1Trich: cc.trich ? sha1(cc.trich.trim()) : null,
    };
  };

  // Chọn ứng viên gốc sạch (1 căn cứ rõ ràng, đoạn nguồn có `duongDeMuc` đầy đủ, không nằm trong cặp mâu thuẫn)
  // để:
  // (a) Tạo 30 mục "sai cố ý" (`sai-co-y`) bằng phép biến đổi tất định (phục vụ G2 kiểm máy bắt >= 28/30 theo v4 8.4)
  // (b) Tạo danh sách 70 mục ứng viên chờ Chủ dự án duyệt/bác thật (hoặc lấy từ `da-duyet`/`bi-bac` thật nếu có)
  //     TUYỆT ĐỐI KHÔNG tự đóng dấu `da-duyet` giả!
  const ungVienSach = tatCaMuc.filter((m) => {
    if (idMucMauThuanToanKho.has(m.id)) return false;
    if (!m.canCu || m.canCu.length !== 1) return false;
    const cc = m.canCu[0];
    if (!cc.trich || cc.trich.trim().length < 40) return false;
    const dm = duongDeMucCuaCanCu(cc);
    if (!dm) return false;
    const dsSao = saoCuaMuc(m);
    return dsSao.length >= 1 && m.dieuKien.cung.length >= 1;
  });

  // Lấy mẫu phân tầng đều qua các chủ đề
  const chonPhanTang = (ds: MucThuVien[], soLuong: number, boQuaIds: Set<string>): MucThuVien[] => {
    const theoCD = new Map<string, MucThuVien[]>();
    for (const m of ds) {
      if (boQuaIds.has(m.id)) continue;
      const cd = chuDeChinhCuaMuc(m);
      const arr = theoCD.get(cd) ?? [];
      arr.push(m);
      theoCD.set(cd, arr);
    }
    const cacCD = [...theoCD.keys()].sort();
    const kq: MucThuVien[] = [];
    let vong = 0;
    while (kq.length < soLuong) {
      let themDuoc = false;
      for (const cd of cacCD) {
        const arr = theoCD.get(cd)!;
        if (vong < arr.length) {
          kq.push(arr[vong]);
          boQuaIds.add(arr[vong].id);
          themDuoc = true;
          if (kq.length >= soLuong) break;
        }
      }
      if (!themDuoc) break;
      vong++;
    }
    return kq;
  };

  const daChonIds = new Set<string>();
  for (const m of mucDaDuyetThat) daChonIds.add(m.id);
  for (const m of mucBiBacThat) daChonIds.add(m.id);

  // Chọn 30 mục gốc để tạo 30 mục "sai cố ý" (`sai-co-y`) theo đúng 4 nhóm lỗi tất định:
  //   1. `dao-chieu-cat-hung` (8 mục): câu trích và ý là Cát nhưng nhãn/ý bị sửa ngược thành Hung (hoặc ngược lại)
  //   2. `dao-do-sang-sao` (8 mục): điều kiện sách yêu cầu Miếu/Vượng (`M`, `V`) nhưng sửa thành Hãm (`H`) (hoặc ngược lại)
  //   3. `sai-cung-ap-dung` (7 mục): đoạn sách và trích dẫn nói về cung A (vd Tài Bạch / Quan Lộc) nhưng sửa điều kiện sang cung không liên quan (vd Tử Tức / Tật Ách)
  //   4. `cat-cut-dieu-kien-sao` (7 mục): câu gốc đòi hỏi tổ hợp >= 2 sao đi cùng (vd Tử Vi + Thiên Phủ hoặc Kình Đà Hiệp Kỵ), nhưng điều kiện bị cắt mất sao đi kèm hoặc thay bằng sao trái ngược.
  const CUNG_DOI_NGUOC: Record<string, string> = {
    'Mệnh': 'Tật Ách',
    'Quan Lộc': 'Tử Tức',
    'Tài Bạch': 'Huynh Đệ',
    'Phu Thê': 'Điền Trạch',
    'Thiên Di': 'Phụ Mẫu',
    'Phúc Đức': 'Nô Bộc',
    'Điền Trạch': 'Phu Thê',
    'Tật Ách': 'Quan Lộc',
    'Tử Tức': 'Tài Bạch',
    'Phụ Mẫu': 'Tử Tức',
    'Huynh Đệ': 'Tật Ách',
    'Nô Bộc': 'Phúc Đức',
  };

  const ungVienCoDoSang = ungVienSach.filter((m) =>
    (m.dieuKien.sao ?? []).some((s) => s.doSang && s.doSang.length > 0 && s.doSang.length < 4)
  );
  const ungVienNhieuSao = ungVienSach.filter((m) => (m.dieuKien.sao ?? []).length >= 2);
  const ungVienCatHungRo = ungVienSach.filter(
    (m) => m.nhan.chieu === 'cat' || m.nhan.chieu === 'hung'
  );

  const gocDaoChieu = chonPhanTang(ungVienCatHungRo, 8, daChonIds);
  const gocDaoDoSang = chonPhanTang(ungVienCoDoSang, 8, daChonIds);
  const gocSaiCung = chonPhanTang(ungVienSach, 7, daChonIds);
  const gocCatCutSao = chonPhanTang(ungVienNhieuSao, 7, daChonIds);

  interface MucDapAnRepo {
    stt: number;
    id: string;
    nhomDapAn: 'da-duyet-that' | 'bi-bac-that' | 'sai-co-y' | 'ung-vien-cho-chu-du-an-duyet';
    coDauVetChuDuAnDuyet: boolean;
    trangThaiDuyetTrongDB: 'da-duyet' | 'chua' | 'bi-bac';
    dapAnKyVongChoMayKiem: 'hop-le' | 'bat-loi' | 'chua-co-dap-an-chu-du-an';
    chuDe: string;
    dotTrich: string;
    dieuKien: MucThuVien['dieuKien'];
    y: string;
    nhan: MucThuVien['nhan'];
    cheDo: MucThuVien['cheDo'];
    nguon: {
      documentId: string | null;
      tenSach: string | null;
      chunkId: string | null;
      chunkIndex: number | null;
      duongDeMuc: string | null;
      dongTrongChunk: number | null;
      sha1Trich: string | null;
    };
    bienDoiSaiCoY?: {
      mucGocId: string;
      loaiLoi:
        | 'dao-chieu-cat-hung'
        | 'dao-do-sang-sao'
        | 'sai-cung-ap-dung'
        | 'cat-cut-dieu-kien-sao';
      moTaPhepSua: string;
      giaTriGoc: unknown;
      giaTriSauSua: unknown;
      loiKyVongMayBat: string;
    };
  }

  const bo100Repo: MucDapAnRepo[] = [];
  const bo100KemTrich: Array<MucDapAnRepo & { trichDanGoc: string[] }> = [];

  const themVaoBo = (item: Omit<MucDapAnRepo, 'stt'>, trichList: string[]) => {
    const stt = bo100Repo.length + 1;
    const banRepo: MucDapAnRepo = { stt, ...item };
    bo100Repo.push(banRepo);
    bo100KemTrich.push({ ...banRepo, trichDanGoc: trichList });
  };

  // (A) Đưa các mục đã duyệt thật / bị bác thật (nếu có trong DB) vào trước
  for (const m of mucDaDuyetThat.slice(0, 50)) {
    themVaoBo(
      {
        id: m.id,
        nhomDapAn: 'da-duyet-that',
        coDauVetChuDuAnDuyet: true,
        trangThaiDuyetTrongDB: 'da-duyet',
        dapAnKyVongChoMayKiem: 'hop-le',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: m.dieuKien,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  for (const m of mucBiBacThat.slice(0, 20)) {
    themVaoBo(
      {
        id: m.id,
        nhomDapAn: 'bi-bac-that',
        coDauVetChuDuAnDuyet: true,
        trangThaiDuyetTrongDB: 'bi-bac',
        dapAnKyVongChoMayKiem: 'bat-loi',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: m.dieuKien,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  // (B) Tạo 30 mục "sai cố ý" (`sai-co-y`) tất định
  for (const m of gocDaoChieu) {
    const chieuCu = m.nhan.chieu;
    const chieuMoi = chieuCu === 'cat' ? 'hung' : 'cat';
    const yMoi =
      chieuMoi === 'hung'
        ? `[SAI CỐ Ý - ĐẢO CHIỀU] Tổ hợp này gây đại hung, phá bại nặng nề và tai họa liên miên (trái ngược hoàn toàn câu trích gốc).`
        : `[SAI CỐ Ý - ĐẢO CHIỀU] Tổ hợp này đại cát, phú quý song toàn và thuận lợi mỹ mãn (trái ngược hoàn toàn câu trích gốc).`;
    themVaoBo(
      {
        id: `sai-co-y:dao-chieu:${m.id}`,
        nhomDapAn: 'sai-co-y',
        coDauVetChuDuAnDuyet: true, // đáp án biết trước 100% do phép biến đổi tất định
        trangThaiDuyetTrongDB: m.duyet,
        dapAnKyVongChoMayKiem: 'bat-loi',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: structuredClone(m.dieuKien),
        y: yMoi,
        nhan: { ...m.nhan, chieu: chieuMoi },
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
        bienDoiSaiCoY: {
          mucGocId: m.id,
          loaiLoi: 'dao-chieu-cat-hung',
          moTaPhepSua: `Đảo chiều từ '${chieuCu}' sang '${chieuMoi}' và viết câu y trái ngược hẳn với câu trích sách.`,
          giaTriGoc: { chieu: chieuCu, y: m.y },
          giaTriSauSua: { chieu: chieuMoi, y: yMoi },
          loiKyVongMayBat: 'Mâu thuẫn chiều cát/hung và nghĩa giữa câu y/nhãn với câu trích gốc trong sách.',
        },
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  for (const m of gocDaoDoSang) {
    const dkMoi = structuredClone(m.dieuKien);
    const saoTarget = dkMoi.sao.find((s) => s.doSang && s.doSang.length > 0)!;
    const doSangCu = [...(saoTarget.doSang ?? [])];
    const coMieuVuong = doSangCu.includes('M') || doSangCu.includes('V');
    const doSangMoi: string[] = coMieuVuong ? ['H'] : ['M', 'V'];
    saoTarget.doSang = doSangMoi;

    themVaoBo(
      {
        id: `sai-co-y:dao-do-sang:${m.id}`,
        nhomDapAn: 'sai-co-y',
        coDauVetChuDuAnDuyet: true,
        trangThaiDuyetTrongDB: m.duyet,
        dapAnKyVongChoMayKiem: 'bat-loi',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: dkMoi,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
        bienDoiSaiCoY: {
          mucGocId: m.id,
          loaiLoi: 'dao-do-sang-sao',
          moTaPhepSua: `Đảo độ sáng của sao '${saoTarget.ten}' từ [${doSangCu.join(',')}] sang [${doSangMoi.join(',')}], giữ nguyên câu y và câu trích.`,
          giaTriGoc: { sao: saoTarget.ten, doSang: doSangCu },
          giaTriSauSua: { sao: saoTarget.ten, doSang: doSangMoi },
          loiKyVongMayBat: `Sai độ sáng của sao '${saoTarget.ten}' so với văn bản nguồn (${doSangCu.join('/')} bị đổi thành ${doSangMoi.join('/')}).`,
        },
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  for (const m of gocSaiCung) {
    const dkMoi = structuredClone(m.dieuKien);
    const cungCu = [...dkMoi.cung];
    const cungDau = cungCu[0] ?? 'Mệnh';
    const cungMoi = [CUNG_DOI_NGUOC[cungDau] ?? 'Tật Ách'];
    dkMoi.cung = cungMoi;

    themVaoBo(
      {
        id: `sai-co-y:sai-cung:${m.id}`,
        nhomDapAn: 'sai-co-y',
        coDauVetChuDuAnDuyet: true,
        trangThaiDuyetTrongDB: m.duyet,
        dapAnKyVongChoMayKiem: 'bat-loi',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: dkMoi,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
        bienDoiSaiCoY: {
          mucGocId: m.id,
          loaiLoi: 'sai-cung-ap-dung',
          moTaPhepSua: `Đổi dieuKien.cung từ [${cungCu.join(', ')}] sang [${cungMoi.join(', ')}] trái với cung trong đề mục/câu trích.`,
          giaTriGoc: { cung: cungCu },
          giaTriSauSua: { cung: cungMoi },
          loiKyVongMayBat: `Sai cung áp dụng: văn bản nguồn nói về cung [${cungCu.join(', ')}] nhưng dieuKien.cung lại ghi [${cungMoi.join(', ')}].`,
        },
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  for (const m of gocCatCutSao) {
    const dkMoi = structuredClone(m.dieuKien);
    const dsSaoCu = saoCuaMuc(m);
    // Cắt mất sao thứ 2 trở đi và chèn thêm 1 sao không hề có trong câu trích (vd 'Thiên Hình' hoặc 'Địa Không')
    const saoGia = dsSaoCu.includes('Thiên Hình') ? 'Địa Kiếp' : 'Thiên Hình';
    const saoGiuLai = m.dieuKien.sao[0];
    dkMoi.sao = [saoGiuLai, { ten: saoGia, quanHe: 'o-cung' }];
    delete dkMoi.nhom;

    themVaoBo(
      {
        id: `sai-co-y:cat-cut-sao:${m.id}`,
        nhomDapAn: 'sai-co-y',
        coDauVetChuDuAnDuyet: true,
        trangThaiDuyetTrongDB: m.duyet,
        dapAnKyVongChoMayKiem: 'bat-loi',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: dkMoi,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
        bienDoiSaiCoY: {
          mucGocId: m.id,
          loaiLoi: 'cat-cut-dieu-kien-sao',
          moTaPhepSua: `Cắt bỏ sao đi kèm trong [${dsSaoCu.join(', ')}] và bịa thêm sao '${saoGia}' không có trong câu trích gốc.`,
          giaTriGoc: { sao: dsSaoCu },
          giaTriSauSua: { sao: [saoGiuLai.ten, saoGia] },
          loiKyVongMayBat: `Điều kiện sao bị cắt cụt / bịa thêm sao '${saoGia}' không xuất hiện trong đoạn nguồn.`,
        },
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  // (C) Phần còn lại để đủ 100 mục: nếu DB chưa có đủ 70 mục được Chủ dự án duyệt/bác thật,
  // điền các mục ứng viên phân tầng từ kho nhưng ghi rõ `nhomDapAn: 'ung-vien-cho-chu-du-an-duyet'`
  // và `coDauVetChuDuAnDuyet: false` theo đúng Lưu ý 3 của Chủ dự án!
  const soConThieu = Math.max(0, 100 - bo100Repo.length);
  const ungVienBoSung = chonPhanTang(ungVienSach, soConThieu, daChonIds);
  for (const m of ungVienBoSung) {
    themVaoBo(
      {
        id: m.id,
        nhomDapAn: 'ung-vien-cho-chu-du-an-duyet',
        coDauVetChuDuAnDuyet: false,
        trangThaiDuyetTrongDB: m.duyet,
        dapAnKyVongChoMayKiem: 'chua-co-dap-an-chu-du-an',
        chuDe: chuDeChinhCuaMuc(m),
        dotTrich: m.dotTrich,
        dieuKien: m.dieuKien,
        y: m.y,
        nhan: m.nhan,
        cheDo: m.cheDo,
        nguon: traViTriNguon(m),
      },
      (m.canCu ?? []).map((c) => c.trich)
    );
  }

  // Ghi file trong repo (an toàn bản quyền, không chứa nguyên văn câu trích sách)
  const thuMucDuLieu = join(process.cwd(), 'scripts', 'du-lieu');
  mkdirSync(thuMucDuLieu, { recursive: true });
  const duongDanBo100Repo = join(thuMucDuLieu, 'bo-100-muc-dap-an.json');

  const metadataBo100 = {
    phienBan: '2026-10-22.G1',
    ngayTao: new Date().toISOString(),
    tuanThuLuuY3: true,
    ghiChuQuanTrong:
      'Theo Lưu ý 3 (KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md mục 9): Trạng thái duyet trong DB hiện tại có ' +
      `${mucDaDuyetThat.length} mục da-duyet thật và ${mucBiBacThat.length} mục bi-bac thật từ Chủ dự án. ` +
      'Không tự ý coi các mục duyet="chua" là đáp án Đúng. 30 mục sai-co-y có đáp án lỗi tất định 100%; ' +
      '70 mục còn lại được đánh dấu rõ coDauVetChuDuAnDuyet=false để Chủ dự án duyệt nhanh hoặc dùng làm tập kiểm tra đối chiếu.',
    thongKeBo100: {
      tongSoMuc: bo100Repo.length,
      soMucDaDuyetThat: bo100Repo.filter((x) => x.nhomDapAn === 'da-duyet-that').length,
      soMucBiBacThat: bo100Repo.filter((x) => x.nhomDapAn === 'bi-bac-that').length,
      soMucSaiCoYTatDinh: bo100Repo.filter((x) => x.nhomDapAn === 'sai-co-y').length,
      soMucUngVienChoChuDuAnDuyet: bo100Repo.filter(
        (x) => x.nhomDapAn === 'ung-vien-cho-chu-du-an-duyet'
      ).length,
      chiTietSaiCoY: {
        daoChieuCatHung: gocDaoChieu.length,
        daoDoSangSao: gocDaoDoSang.length,
        saiCungApDung: gocSaiCung.length,
        catCutDieuKienSao: gocCatCutSao.length,
      },
    },
    danhSach: bo100Repo,
  };

  writeFileSync(duongDanBo100Repo, JSON.stringify(metadataBo100, null, 2) + '\n', 'utf-8');
  console.log(`  -> Đã ghi bộ 100 mục (repo-safe, không chứa trích dẫn sách) tại: ${duongDanBo100Repo}`);

  // Ghi bản đầy đủ kèm câu trích và báo cáo ra thư mục ngoài repo (`D:\Celestia`)
  if (existsSync(thuMucNgoai)) {
    const duongDanKemTrich = join(thuMucNgoai, 'bo-100-muc-dap-an-kem-trich.json');
    writeFileSync(
      duongDanKemTrich,
      JSON.stringify({ ...metadataBo100, danhSach: bo100KemTrich }, null, 2) + '\n',
      'utf-8'
    );
    console.log(`  -> Đã ghi bản kèm trích dẫn đầy đủ (ngoài repo) tại: ${duongDanKemTrich}`);
  }

  // Lưu file kết quả đếm JSON đầy đủ ra ngoài repo để G2, K1, K2, X2 tham khảo trực tiếp
  const tongHopKetQua = {
    thoiDiemDo: new Date().toISOString(),
    khoSachNoiDungAi: {
      tongDongTrongBang: dongThuVien.length,
      soGoi: goiRows.length,
      soDongLe: leRows.length,
      soDongLeChiCoLe,
      soDongLeKhacGoi,
      tongMucDuyNhat: tatCaMuc.length,
      theoDuyet,
      theoMuc,
      theoChieu,
      theoCheDo,
      theoChuDe,
      theoDotTrich,
      thongKeGoi,
      phanTichRuiRoV4: {
        soMucManhChuaDuyet: tatCaMuc.filter((m) => m.nhan?.muc === 'manh' && m.duyet !== 'da-duyet').length,
        soMucCoTuKhoaBienCoNang: demBienCoNang,
        soMucCheDoKhacAdd: tatCaMuc.filter((m) => m.cheDo !== 'add').length,
        soMucNamTrongCapMauThuanToanKho: idMucMauThuanToanKho.size,
        soMucNamTrongCapMauThuanCungChuDe: idMucMauThuanCungChuDe.size,
        tongMucRuiRoCaoCanChanTheoV4Muc5_1: demRuiRoCaoV4,
        soMucCoTuKhoaThoiGianTrongYHoacTrich: demThoiGianTrongYHoacTrich,
        soMucCoTuKhoaThoiGianChiTrongDeMuc: demThoiGianTrongDeMuc,
      },
    },
    khoNghiemLyChuDuAn: khoNghiemLy,
    lichSuAuditLienQuanThuVien: {
      tongDongAuditLog: auditLogs?.length ?? 0,
      soDongLienQuanThuVien: auditLienQuanThuVien.length,
      mauAudit: auditLienQuanThuVien.slice(0, 10),
    },
    nhomDaGop: {
      phanBoSoCanCu,
      tongMucCoTu2CanCu: tongMucCoNhieuCanCu,
      tongMucCoTu2TrichDanKhacNhau: tongMucCoTrichKhacNhau,
      tongMucGopKhacChuongMuc: tongMucGopKhacChuongMuc,
      tongMucGopNghiMatVe10_10: tongMucGopNghiMatVe,
      mauNhomDaGop,
    },
    taiLieuNguon: {
      tongSoTaiLieu: docs.length,
      tongSoChunk: chunks.length,
      soTaiLieuHoanToanKhongCoDeMuc: thongKeTaiLieu.filter((d) => d.hoanToanKhongCoDeMuc).length,
      soTaiLieuCoChunkThieuDeMuc: thongKeTaiLieu.filter((d) => d.soChunkKhongDeMuc > 0).length,
      tongSoCanCuTrongKho: tongSoCanCu,
      soCanCuThieuDeMuc: soCanCuKhongDeMuc,
      chiTietTaiLieu: thongKeTaiLieu,
    },
    capMauThuan: {
      soCapMauThuanToanKho: capMauThuanToanKho.length,
      soMucLienQuanToanKho: idMucMauThuanToanKho.size,
      soCapMauThuanTheoChuDe: capMauThuanTheoChuDe,
      soMucLienQuanCungChuDe: idMucMauThuanCungChuDe.size,
      danhSachCapMauThuan: capMauThuanToanKho,
    },
    baiLuuNoiDungAi: {
      tongSoDongToanBang: tatCaNoiDungAi.length,
      theoBeMat,
    },
    tiLeLaSoNgheoCanCu: {
      soLaSoDo: SO_LA_DO_NGHEO,
      theoChuDe: baoCaoNgheoCanCu,
      theo12Cung: ngheoTheoCung,
    },
    bo100MucDapAn: metadataBo100.thongKeBo100,
  };

  if (existsSync(thuMucNgoai)) {
    const duongDanJsonNgoai = join(thuMucNgoai, 'SO-LIEU-G1-dem-kho-tri-thuc-2026-10-22.json');
    writeFileSync(duongDanJsonNgoai, JSON.stringify(tongHopKetQua, null, 2) + '\n', 'utf-8');
    console.log(`  -> Đã ghi toàn bộ số liệu JSON tại: ${duongDanJsonNgoai}`);
  }

  console.log('\n=== TÓM TẮT NHANH SỐ ĐO THẬT TRÊN DB ===');
  console.log(`1. Kho sách (noi_dung_ai): ${tatCaMuc.length} mục duy nhất (${goiRows.length} gói, ${leRows.length} dòng lẻ)`);
  console.log(`   - Trạng thái duyệt: da-duyet=${theoDuyet['da-duyet']}, chua=${theoDuyet.chua}, bi-bac=${theoDuyet['bi-bac']}`);
  console.log(`   - Mức độ: manh=${theoMuc.manh}, vua=${theoMuc.vua}, nhe=${theoMuc.nhe}`);
  console.log(`   - Chiều: cat=${theoChieu.cat}, hung=${theoChieu.hung}, trung=${theoChieu.trung}`);
  console.log(`   - Chế độ: add=${theoCheDo.add}, override=${theoCheDo.override}, modify=${theoCheDo.modify}, neutralize=${theoCheDo.neutralize}`);
  console.log(`2. Kho nghiệm lý (muc_thu_vien): tồn tại=${khoNghiemLy.bangMucThuVienTonTai}, số mục=${khoNghiemLy.soMucNghiemLy}`);
  console.log(`3. Nhóm đã gộp (>= 2 căn cứ): ${tongMucCoNhieuCanCu} mục (trong đó ${tongMucCoTrichKhacNhau} mục có >=2 câu trích khác nhau, ${tongMucGopNghiMatVe} mục nghi mất vế/khác chương)`);
  console.log(`4. Tài liệu nguồn: ${docs.length} tài liệu, ${chunks.length} chunks.`);
  console.log(`5. Cặp mâu thuẫn (cùng khoaDieuKien nhưng cat <> hung): ${capMauThuanToanKho.length} cặp toàn kho (${idMucMauThuanToanKho.size} mục).`);
  console.log(`6. Tổng dòng noi_dung_ai toàn bảng: ${tatCaNoiDungAi.length} dòng.`);
}

main().catch((err) => {
  console.error('LỖI KHI CHẠY G1:', err);
  process.exit(1);
});
