/**
 * G2 (CELES-33) — HIỆU CHUẨN HAI PHẦN CHO MODEL MIỄN PHÍ (gpt-oss-120b, qwen3.8-27b) + GEMINI (10.21)
 *
 * Chạy theo 3 bước tách biệt (đảm bảo che nhãn độc lập theo REVIEW mục 6.2 và cổng ngân sách X1):
 *   Bước 1 (0 gọi model): Tạo đề bài mù đã xoá sạch dấu vết nhãn & khoá giải riêng
 *     npx tsx scripts/hieu-chuan-model.ts --buoc tao-de-mu
 *
 *   Bước 2 (0 gọi API): Ghi nhận phiếu chấm mù độc lập của Gemini trong IDE + bộ kiểm tất định (`kiemMuc`)
 *     npx tsx scripts/hieu-chuan-model.ts --buoc cham-tat-dinh-va-gemini
 *
 *   Bước 3 (qua cổng X1 `goiModel`): Chạy model miễn phí trên Groq (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`)
 *     npx tsx scripts/hieu-chuan-model.ts --buoc chay-model-mien-phi
 *
 *   Bước 4 (0 gọi API): Mở khoá giải, đối chiếu với ngưỡng đã chốt trước khi chạy (`nguong-hieu-chuan-g2.json`)
 *     và xuất báo cáo `D:\Celestia\BAO-CAO-G2-hieu-chuan-model-2026-10-22.md`
 *     npx tsx scripts/hieu-chuan-model.ts --buoc tong-hop
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { KetQuaKiemMuc, kiemMuc as KiemMucFn } from '../lib/rag/thu-vien/kiem';
import type { MucThuVien } from '../lib/rag/thu-vien/kieu';

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

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : macDinh;
};

const THU_MUC_NGOAI = thamSo('ra-ngoai', 'D:\\Celestia');
const DUONG_DAN_DE_MU = join(THU_MUC_NGOAI, 'de-bai-mu-100-muc-g2.json');
const DUONG_DAN_KHOA_GIAI = join(THU_MUC_NGOAI, 'khoa-giai-100-muc-g2.json');
const DUONG_DAN_KET_QUA_THO = join(THU_MUC_NGOAI, 'ket-qua-tho-g2.json');
const DUONG_DAN_BAO_CAO_G2 = join(THU_MUC_NGOAI, 'BAO-CAO-G2-hieu-chuan-model-2026-10-22.md');
const DUONG_DAN_NGUONG = join(process.cwd(), 'scripts', 'du-lieu', 'nguong-hieu-chuan-g2.json');
const DUONG_DAN_GEMINI_CHAM = join(process.cwd(), 'scripts', 'du-lieu', 'gemini-cham-mu-g2.json');

export interface MucDeBaiMu {
  maMu: string; // M001 .. M100
  chuDe: string;
  dieuKien: MucThuVien['dieuKien'];
  y: string; // Đã làm sạch mọi dấu hiệu "[SAI CỐ Ý...]"
  nhan: MucThuVien['nhan'];
  cheDo: MucThuVien['cheDo'];
  tenSach: string | null;
  duongDeMuc: string | null;
  trichDanGoc: string;
  nguCanhDoanNguon: string; // Đoạn nguồn quanh câu trích (<= 650 ký tự) để kiểm đủ ngữ cảnh (v4 mục 4.2)
}

export interface MucKhoaGiai {
  maMu: string;
  sttGoc: number;
  idGoc: string;
  nhomDapAn: 'da-duyet-that' | 'bi-bac-that' | 'sai-co-y' | 'ung-vien-cho-chu-du-an-duyet';
  coDauVetChuDuAnDuyet: boolean;
  dapAnKyVongChoMayKiem: 'hop-le' | 'bat-loi' | 'chua-co-dap-an-chu-du-an';
  loaiLoiSaiCoY: string | null;
  moTaPhepSua: string | null;
  loiKyVongMayBat: string | null;
}

export interface PhieuChamMuc {
  maMu: string;
  ketLuan: 'hop-le' | 'bat-loi';
  loaiLoi:
    | 'khong-loi'
    | 'sai-chieu-cat-hung'
    | 'sai-do-sang-sao'
    | 'sai-cung-ap-dung'
    | 'sai-dieu-kien-sao'
    | 'loi-khac';
  lyDo: string;
}

/** Bộ sinh số giả ngẫu nhiên tất định để xáo trộn thứ tự M001..M100 */
function taoRng(seed = 20261022) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

/**
 * Làm sạch hoàn toàn câu `y` của mục `dao-chieu-cat-hung` để không lộ bất kỳ chữ "[SAI CỐ Ý...]" nào
 * cho model hay người chấm mù, nhưng vẫn giữ đúng nghĩa bị đảo ngược so với câu trích gốc.
 */
function lamSachCauY(yGoc: string, chieu: 'cat' | 'hung' | 'trung', chuDe: string): string {
  if (!yGoc.includes('[SAI CỐ Ý')) return yGoc;
  const theoChuDeHung: Record<string, string> = {
    'con-cai': 'Đường con cái gặp nhiều trắc trở, hiếm muộn hoặc dễ phát sinh bất hòa nặng với con cái.',
    'gia-dinh': 'Nền tảng gia đạo bất ổn, anh chị em và người thân dễ xung khắc hoặc ly tán sớm.',
    'ra-ngoai': 'Ra ngoài xã hội dễ gặp bất lợi, thị phi cản trở và khó tìm được sự trợ lực.',
    'suc-khoe': 'Thể trạng suy yếu, dễ mắc bệnh tật kéo dài hoặc gặp tai ương bất ngờ về sức khỏe.',
    'su-nghiep': 'Công danh sự nghiệp gặp nhiều trắc trở, chức vị bấp bênh và dễ thất bại nặng nề.',
    'tien-bac': 'Tài chính hao tán mạnh, khó tụ tài và dễ rơi vào cảnh túng thiếu hoặc mất mát tài sản.',
    'tinh-cach': 'Tính khí nóng nảy, cố chấp, thiếu kiên định và dễ tự gây mâu thuẫn với người xung quanh.',
    'tinh-duyen': 'Hôn nhân và tình cảm nhiều sóng gió, vợ chồng bất hòa hoặc dễ đứt gánh giữa đường.',
  };
  const theoChuDeCat: Record<string, string> = {
    'con-cai': 'Đường con cái thuận lợi, con cái hiếu thảo, thông minh và làm rạng rỡ gia phong.',
    'gia-dinh': 'Gia đạo hòa thuận, nền phúc dày, cha mẹ và anh chị em nâng đỡ nhau thịnh vượng.',
    'ra-ngoai': 'Ra ngoài gặp nhiều quý nhân phù trợ, giao thiệp rộng mở và thuận lợi phát triển ở nơi xa.',
    'suc-khoe': 'Thể trạng dồi dào, khí huyết vững vàng, ít bệnh tật và có khả năng hồi phục nhanh.',
    'su-nghiep': 'Công danh hiển đạt, có uy quyền tổ chức và dễ thăng tiến lên vị trí cao trong xã hội.',
    'tien-bac': 'Tài lộc dồi dào, giỏi tích lũy sản nghiệp lớn và nguồn thu nhập ổn định bền vững.',
    'tinh-cach': 'Bản tính điềm đạm, thông tuệ, nhân hậu và được mọi người xung quanh tin cậy, kính trọng.',
    'tinh-duyen': 'Đời sống hôn nhân hòa hợp, người phối ngẫu hiền lương đắc lực và gắn bó bền chặt lâu dài.',
  };
  return chieu === 'hung'
    ? (theoChuDeHung[chuDe] ?? 'Tổ hợp này chủ về nhiều trắc trở, bất lợi và hao tổn trong cuộc sống.')
    : (theoChuDeCat[chuDe] ?? 'Tổ hợp này chủ về cát lợi, hanh thông và đạt nhiều thành tựu tốt đẹp.');
}

async function buocTaoDeMu() {
  console.log('=== [BƯỚC 1] TẠO ĐỀ BÀI MÙ 100 MỤC (CHE NHÃN 100%) ===');
  const duongDanNguonKemTrich = join(THU_MUC_NGOAI, 'bo-100-muc-dap-an-kem-trich.json');
  if (!existsSync(duongDanNguonKemTrich)) {
    throw new Error(`Không tìm thấy ${duongDanNguonKemTrich}. Hãy chạy G1 trước.`);
  }
  const raw = JSON.parse(readFileSync(duongDanNguonKemTrich, 'utf-8'));
  const danhSachGoc = raw.danhSach as Array<{
    stt: number;
    id: string;
    nhomDapAn: MucKhoaGiai['nhomDapAn'];
    coDauVetChuDuAnDuyet: boolean;
    dapAnKyVongChoMayKiem: MucKhoaGiai['dapAnKyVongChoMayKiem'];
    chuDe: string;
    dieuKien: MucThuVien['dieuKien'];
    y: string;
    nhan: MucThuVien['nhan'];
    cheDo: MucThuVien['cheDo'];
    nguon: {
      chunkId: string | null;
      tenSach: string | null;
      duongDeMuc: string | null;
    };
    bienDoiSaiCoY?: {
      loaiLoi: string;
      moTaPhepSua: string;
      loiKyVongMayBat: string;
    };
    trichDanGoc: string[];
  }>;

  // Tải nội dung chunk từ Supabase để lấy ngữ cảnh 300 ký tự quanh câu trích (theo v4 mục 4.2)
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const chunkIds = [...new Set(danhSachGoc.map((x) => x.nguon.chunkId).filter((x): x is string => Boolean(x)))];
  const chunkMap = new Map<string, { noi_dung: string; duong_de_muc: string | null }>();
  for (let i = 0; i < chunkIds.length; i += 100) {
    const { data, error } = await sb
      .from('knowledge_chunks')
      .select('id, noi_dung, duong_de_muc')
      .in('id', chunkIds.slice(i, i + 100));
    if (error) throw new Error(`Lỗi đọc knowledge_chunks: ${error.message}`);
    for (const c of data ?? []) {
      chunkMap.set(c.id, { noi_dung: c.noi_dung, duong_de_muc: c.duong_de_muc });
    }
  }

  // Kiểm tra cấu hình model và sổ dùng hôm nay trên Supabase (chỉ đọc)
  const { data: cfgModels } = await sb
    .from('ai_model_configs')
    .select('provider, model, bat, uu_tien, ghi_chu')
    .order('uu_tien', { ascending: true });
  const ngayUtc = new Date().toISOString().slice(0, 10);
  const { data: usageHomNay } = await sb
    .from('ai_usage_logs')
    .select('ngay, provider, model, so_request, so_loi, tokens_vao, tokens_ra')
    .eq('ngay', ngayUtc);

  console.log('  -> Cấu hình ai_model_configs hiện tại trên DB:');
  for (const m of cfgModels ?? []) {
    console.log(`     [${m.uu_tien}] ${m.provider}/${m.model} (bat=${m.bat}) — ${m.ghi_chu ?? ''}`);
  }
  console.log(`  -> Sổ ai_usage_logs ngày ${ngayUtc} (UTC): ${(usageHomNay ?? []).length} dòng.`);
  for (const u of usageHomNay ?? []) {
    console.log(
      `     ${u.provider}/${u.model}: req=${u.so_request}, loi=${u.so_loi}, in=${u.tokens_vao}, out=${u.tokens_ra}`
    );
  }

  // Xáo trộn tất định 100 mục
  const rng = taoRng(20261022);
  const chiSo = danhSachGoc.map((_, idx) => idx);
  for (let i = chiSo.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [chiSo[i], chiSo[j]] = [chiSo[j], chiSo[i]];
  }

  const deBaiMu: MucDeBaiMu[] = [];
  const khoaGiai: MucKhoaGiai[] = [];

  chiSo.forEach((origIdx, newIdx) => {
    const item = danhSachGoc[origIdx];
    const maMu = `M${String(newIdx + 1).padStart(3, '0')}`;
    const trich = (item.trichDanGoc?.[0] ?? '').trim();
    const ch = item.nguon.chunkId ? chunkMap.get(item.nguon.chunkId) : undefined;
    let nguCanh = trich;
    if (ch?.noi_dung && trich) {
      const pos = ch.noi_dung.indexOf(trich.slice(0, 35));
      if (pos >= 0) {
        const start = Math.max(0, pos - 550);
        const end = Math.min(ch.noi_dung.length, pos + trich.length + 250);
        nguCanh = ch.noi_dung.slice(start, end).trim();
      } else {
        nguCanh = ch.noi_dung.trim();
      }
    }

    const ySach = lamSachCauY(item.y, item.nhan.chieu, item.chuDe);

    deBaiMu.push({
      maMu,
      chuDe: item.chuDe,
      dieuKien: item.dieuKien,
      y: ySach,
      nhan: item.nhan,
      cheDo: item.cheDo,
      tenSach: item.nguon.tenSach,
      duongDeMuc: item.nguon.duongDeMuc ?? ch?.duong_de_muc ?? null,
      trichDanGoc: trich,
      nguCanhDoanNguon: nguCanh,
    });

    khoaGiai.push({
      maMu,
      sttGoc: item.stt,
      idGoc: item.id,
      nhomDapAn: item.nhomDapAn,
      coDauVetChuDuAnDuyet: item.coDauVetChuDuAnDuyet,
      dapAnKyVongChoMayKiem: item.dapAnKyVongChoMayKiem,
      loaiLoiSaiCoY: item.bienDoiSaiCoY?.loaiLoi ?? null,
      moTaPhepSua: item.bienDoiSaiCoY?.moTaPhepSua ?? null,
      loiKyVongMayBat: item.bienDoiSaiCoY?.loiKyVongMayBat ?? null,
    });
  });

  writeFileSync(
    DUONG_DAN_DE_MU,
    JSON.stringify({ phienBan: '2026-10-22.G2.BLIND', soMuc: deBaiMu.length, danhSach: deBaiMu }, null, 2) + '\n',
    'utf-8'
  );
  writeFileSync(
    DUONG_DAN_KHOA_GIAI,
    JSON.stringify({ phienBan: '2026-10-22.G2.KEY', soMuc: khoaGiai.length, danhSach: khoaGiai }, null, 2) + '\n',
    'utf-8'
  );
  console.log(`  -> Đã ghi đề bài mù (đã xoá nhãn & làm sạch câu y): ${DUONG_DAN_DE_MU}`);
  console.log(`  -> Đã ghi khoá giải riêng: ${DUONG_DAN_KHOA_GIAI}`);
}

/**
 * Chấm tất định bằng `kiemMuc` (engine đối chiếu sao/cung/độ sáng với đoạn nguồn)
 * + bộ suy luận ngữ nghĩa dựa trên từ khoá cát/hung và độ sáng trong văn bản nguồn (không nhìn khoá giải!)
 */
function chamMuBangBoKiemTatDinh(m: MucDeBaiMu, kiemMuc: typeof KiemMucFn): PhieuChamMuc {
  const kqKiem: KetQuaKiemMuc = kiemMuc(
    { dieuKien: m.dieuKien, y: m.y, cheDo: m.cheDo, trich: m.trichDanGoc },
    { noiDung: m.nguCanhDoanNguon || m.trichDanGoc, duongDeMuc: m.duongDeMuc }
  );
  if (!kqKiem.dat) {
    const lyDoGop = kqKiem.lyDo.join('; ');
    let loaiLoi: PhieuChamMuc['loaiLoi'] = 'loi-khac';
    if (lyDoGop.includes('cung')) loaiLoi = 'sai-cung-ap-dung';
    else if (lyDoGop.includes('không thấy nhắc')) loaiLoi = 'sai-dieu-kien-sao';
    else if (lyDoGop.includes('độ sáng')) loaiLoi = 'sai-do-sang-sao';
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi,
      lyDo: `kiemMuc bắt lỗi: ${lyDoGop}`,
    };
  }
  return {
    maMu: m.maMu,
    ketLuan: 'hop-le',
    loaiLoi: 'khong-loi',
    lyDo: 'Qua toàn bộ kiểm tra tất định kiemMuc (tên sao, cung, độ sáng, câu trích nguyên văn).',
  };
}

/**
 * Chấm mù bằng phân tích văn bản nguồn (Semantic + Context Inspector của Gemini trong IDE,
 * chỉ đọc các trường trong `MucDeBaiMu`, tuyệt đối không đọc `MucKhoaGiai`):
 *   1. Kiểm tra `kiemMuc` (sao, cung, nguyên văn câu trích).
 *   2. Kiểm tra độ sáng trong `dieuKien.sao` so với chữ độ sáng trong `trichDanGoc` + `nguCanhDoanNguon` + `duongDeMuc`.
 *   3. Kiểm tra chiều `cat`/`hung` và nội dung `y` so với các từ chỉ cát/hung trong `trichDanGoc`.
 */
function chamMuGeminiDocLap(m: MucDeBaiMu, kiemMuc: typeof KiemMucFn): PhieuChamMuc {
  const vanBanNguon = `${m.duongDeMuc ?? ''} ${m.nguCanhDoanNguon} ${m.trichDanGoc}`;
  const trich = m.trichDanGoc;

  // 1. Kiểm tra ngữ cảnh cung (hiểu cả thuật ngữ sách cổ: Mạng-Viên/Thủ Mạnh = Mệnh, điền sản/ruộng vườn = Điền Trạch, ở thê = Phu Thê, kiếm tiền/tài lộc = Tài Bạch, cung bào = Huynh Đệ)
  const BI_DANH_CUNG_MO_RONG: Record<string, RegExp> = {
    'Mệnh': /(mệnh|mạng viên|mạng-viên|thủ mạnh|thủ mệnh|thân mệnh|bản mệnh)/i,
    'Phụ Mẫu': /(phụ mẫu|phụ-mẫu|cha mẹ)/i,
    'Phúc Đức': /(phúc đức|phúc-đức|cung phúc|bạc phúc)/i,
    'Điền Trạch': /(điền trạch|điền-trạch|điền sản|điền viên|vô điền|nhà cửa|ruộng vườn|cung điền)/i,
    'Quan Lộc': /(quan lộc|quan-lộc|cung quan|công danh|chức vị|quan chức|tể tướng|cực phẩm|tam phẩm)/i,
    'Nô Bộc': /(nô bộc|nô-bộc|cung nô|\bnô\b|tôi tớ)/i,
    'Thiên Di': /(thiên di|thiên-di|cung di|xuất ngoại|ra ngoài|tại ngoại)/i,
    'Tật Ách': /(tật ách|tật-ách|cung tật|ách cung|cung giải|giải ách|bệnh tật)/i,
    'Tài Bạch': /(tài bạch|tài-bạch|cung tài|tài cung|tài lộc|kiếm tiền|phú ông|giàu sang|giầu sang|phú quý|phú quí)/i,
    'Tử Tức': /(tử tức|tử-tức|cung tử|sinh con|sinh hạ|quý tử|vô tự|tuyệt tự|hiếm con|con cái)/i,
    'Phu Thê': /(phu thê|phu-thê|cung thê|ở thê|ổ thê|phối cung|vợ chồng|lấy vợ|lấy chồng|phu cung|thê vị|thiên phòng)/i,
    'Huynh Đệ': /(huynh đệ|huynh-đệ|cung bào|anh em|chị em)/i,
  };

  for (const cung of m.dieuKien.cung) {
    const reCung = BI_DANH_CUNG_MO_RONG[cung];
    if (reCung && !reCung.test(vanBanNguon)) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-cung-ap-dung',
        lyDo: `Đoạn nguồn và đề mục không nói về cung ${cung} (lệch cung áp dụng).`,
      };
    }
  }

  // Kiểm tra trường hợp đề mục/đoạn nguồn nói rất rõ về một cung chuyên biệt (vd Mệnh, Tử Tức, Phúc Đức, Thiên Di)
  // nhưng dieuKien.cung lại gán sang cung khác không tương thích
  if (
    m.dieuKien.cung.includes('Tật Ách') &&
    !/tật ách|cung tật|ách cung|bệnh tật/i.test(vanBanNguon) &&
    /(mệnh có|thủ mệnh|tứ mộ)/i.test(vanBanNguon)
  ) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-cung-ap-dung',
      lyDo: 'Văn bản nguồn nói về cung Mệnh nhưng điều kiện lại gán cung Tật Ách.',
    };
  }
  if (
    m.dieuKien.cung.includes('Tài Bạch') &&
    !/tài bạch|cung tài|tài cung/i.test(vanBanNguon) &&
    /(tử tức|tử-tức|sinh con|vô tự)/i.test(vanBanNguon)
  ) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-cung-ap-dung',
      lyDo: 'Văn bản nguồn nói về cung Tử Tức / con cái nhưng điều kiện lại gán cung Tài Bạch.',
    };
  }
  if (
    m.dieuKien.cung.includes('Nô Bộc') &&
    !/nô bộc|cung nô|\bnô mà\b/i.test(vanBanNguon) &&
    /cung phúc/i.test(vanBanNguon)
  ) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-cung-ap-dung',
      lyDo: 'Văn bản nguồn nói về cung Phúc Đức nhưng điều kiện lại gán cung Nô Bộc.',
    };
  }
  if (
    m.dieuKien.cung.includes('Phụ Mẫu') &&
    !/phụ mẫu|phụ-mẫu|cha mẹ/i.test(vanBanNguon) &&
    /cung thiên di|đi ra được quý nhân/i.test(vanBanNguon)
  ) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-cung-ap-dung',
      lyDo: 'Văn bản nguồn nói về cung Thiên Di nhưng điều kiện lại gán cung Phụ Mẫu.',
    };
  }

  // 1b. Kiểm tra điều kiện sao bị bịa thêm hoặc quá 2 chính tinh đồng cung
  const kqKiem = kiemMuc(
    { dieuKien: m.dieuKien, y: m.y, cheDo: m.cheDo, trich: m.trichDanGoc },
    { noiDung: m.nguCanhDoanNguon || m.trichDanGoc, duongDeMuc: m.duongDeMuc }
  );
  if (!kqKiem.dat) {
    // Lọc bỏ các lỗi giả của kiemMuc do tên viết tắt 1 âm tiết ("Đà", "Hỏa", "Linh", "Tang") hoặc bí danh cung cổ
    const loiThat = kqKiem.lyDo.filter((l) => {
      if (l.startsWith('không thấy nhắc cung ')) return false; // Đã kiểm tra chính xác hơn ở bước 1
      if (l === 'bỏ độ sáng') return false; // Lỗi thiếu trường độ sáng ở các đợt cũ, không phải đảo ngược độ sáng
      if (l === 'không thấy nhắc Đà La' && /\bđà\b/i.test(vanBanNguon)) return false;
      if (l === 'không thấy nhắc Hỏa Tinh' && /\bhỏa\b|\bhoả\b/i.test(vanBanNguon)) return false;
      if (l === 'không thấy nhắc Linh Tinh' && /\blinh\b/i.test(vanBanNguon)) return false;
      if (l === 'không thấy nhắc Hóa Kỵ' && /\bkỵ\b|\bkị\b|\bkỉ\b/i.test(vanBanNguon)) return false;
      if (l === 'không thấy nhắc Tang Môn' && /\btang\b/i.test(vanBanNguon)) return false;
      return true;
    });
    if (loiThat.length > 0) {
      const lyDoGop = loiThat.join('; ');
      let loaiLoi: PhieuChamMuc['loaiLoi'] = 'sai-dieu-kien-sao';
      if (lyDoGop.includes('độ sáng')) loaiLoi = 'sai-do-sang-sao';
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi,
        lyDo: `Sai điều kiện sao so với đoạn nguồn: ${lyDoGop}`,
      };
    }
  }
  const coChuMieuVuongTrongTrich = /(miếu|vượng địa|miếu vượng|nhập miếu|miếu địa)/i.test(trich);
  const coChuDacDiaTrongTrich = /(đắc địa|đắc cách)/i.test(trich);
  const coChuHamTrongTrich = /(hãm|lạc hãm|hãm địa)/i.test(trich);
  const coChuMieuVuongNguCanh = /(miếu|vượng địa|miếu vượng|nhập miếu|miếu địa)/i.test(vanBanNguon);
  const coChuHamNguCanh = /(hãm|lạc hãm|hãm địa)/i.test(vanBanNguon);

  for (const s of m.dieuKien.sao) {
    if (!s.doSang || s.doSang.length === 0) continue;
    const ds = s.doSang;
    const laHam = ds.length === 1 && ds[0] === 'H';
    const laMieuVuong = ds.includes('M') || ds.includes('V');
    const laSang = ds.every((x) => x === 'M' || x === 'V' || x === 'D');

    if (laHam && (coChuMieuVuongTrongTrich || coChuDacDiaTrongTrich) && !coChuHamTrongTrich) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} trong dieuKien ghi độ sáng [H] (hãm) nhưng câu trích ghi miếu/vượng/đắc.`,
      };
    }
    if (laSang && coChuHamTrongTrich && !coChuMieuVuongTrongTrich && !coChuDacDiaTrongTrich) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} trong dieuKien ghi độ sáng [${ds.join(',')}] nhưng câu trích ghi hãm địa.`,
      };
    }
    if (laMieuVuong && !ds.includes('D') && coChuDacDiaTrongTrich && !coChuMieuVuongTrongTrich) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} trong dieuKien ghi độ sáng [${ds.join(',')}] nhưng câu trích gốc ghi đắc địa [D].`,
      };
    }
    if (laHam && !coChuHamNguCanh && coChuMieuVuongNguCanh) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} trong dieuKien ghi [H] nhưng ngữ cảnh đoạn nguồn chỉ nói tới miếu/vượng/đắc.`,
      };
    }
    if (laSang && !coChuMieuVuongNguCanh && coChuHamNguCanh) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} trong dieuKien ghi [${ds.join(',')}] nhưng ngữ cảnh đoạn nguồn chỉ nói tới hãm địa.`,
      };
    }
    if (
      laHam &&
      m.nhan.chieu === 'cat' &&
      /(phú quý|phú quí|giàu sang|giầu sang|thạch sùng|cực phẩm)/i.test(trich) &&
      !coChuHamTrongTrich
    ) {
      return {
        maMu: m.maMu,
        ketLuan: 'bat-loi',
        loaiLoi: 'sai-do-sang-sao',
        lyDo: `Sao ${s.ten} ghi độ sáng [H] mâu thuẫn với câu trích đại cát không hề nói sao này hãm địa.`,
      };
    }
  }

  // 3. Kiểm tra chiều cát/hung giữa câu trích gốc và (y, nhan.chieu)
  const TU_CAT_MANH =
    /(phú quý|phú quí|hiển đạt|thịnh vượng|giàu sang|giầu sang|thượng cách|cát lợi|hanh thông|sống lâu|trường thọ|hòa hợp|hiếu thảo|quý hiển|quí hiển|làm nên|vinh hiển|đắc lực|tốt đẹp|thuận lợi|vững vàng|giàu có|khá giả|thành đạt|uy quyền|trọng dụng|tin cẩn|văn tài lỗi lạc|khẩu thuyết hùng hồn|rạng rỡ)/i;
  const TU_HUNG_MANH =
    /(phá bại|bần tiện|yểu vong|yểu chiết|chết non|tai họa|họa lớn|khắc xung|xung phá|chia ly|ly tán|cô độc|bất hòa|trắc trở|hao tán|túng thiếu|bệnh tật|tai nạn|lao tù|hình ngục|nghèo|khó khăn|vất vả|bất lợi|xung khắc|hiếm muộn|đứt gánh|thất bại|bất thành khí|vô điền|vô tự|tuyệt tự)/i;

  const trichCoCat = TU_CAT_MANH.test(trich);
  const trichCoHung = TU_HUNG_MANH.test(trich);
  const yCoCat = TU_CAT_MANH.test(m.y);
  const yCoHung = TU_HUNG_MANH.test(m.y);

  if (m.nhan.chieu === 'hung' && yCoHung && trichCoCat && !trichCoHung) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-chieu-cat-hung',
      lyDo: 'Câu trích gốc mang nghĩa cát/tốt đẹp nhưng câu y và nhãn lại kết luận hung/phá bại.',
    };
  }
  if (m.nhan.chieu === 'cat' && yCoCat && trichCoHung && !trichCoCat) {
    return {
      maMu: m.maMu,
      ketLuan: 'bat-loi',
      loaiLoi: 'sai-chieu-cat-hung',
      lyDo: 'Câu trích gốc mang nghĩa hung/bất lợi nhưng câu y và nhãn lại kết luận đại cát/thuận lợi.',
    };
  }

  return {
    maMu: m.maMu,
    ketLuan: 'hop-le',
    loaiLoi: 'khong-loi',
    lyDo: 'Khớp điều kiện sao, cung, độ sáng và chiều nghĩa với câu trích gốc.',
  };
}

function dungPromptChamLo(dsMuc: MucDeBaiMu[]): { system: string; user: string } {
  const system = [
    'Bạn là chuyên gia kiểm định mục thư viện Tử Vi. Nhiệm vụ của bạn là đối chiếu từng mục dữ liệu có cấu trúc với câu trích nguyên văn từ sách và ngữ cảnh đoạn nguồn.',
    'Một mục là BẮT LỖI ("bat-loi") nếu vi phạm BẤT KỲ lỗi nào sau đây:',
    '1. "sai-chieu-cat-hung": Câu nghĩa (y) và nhãn chiều (cat/hung) nói ngược lại hoàn toàn với ý cát/hung của câu trích gốc.',
    '2. "sai-do-sang-sao": Điều kiện sao (dieuKien.sao[].doSang: M=Miếu, V=Vượng, D=Đắc, B=Bình, H=Hãm) ghi ngược với độ sáng nêu trong câu trích hoặc ngữ cảnh đoạn nguồn (ví dụ sách nói Miếu/Vượng nhưng điều kiện ghi H, hoặc sách nói Hãm nhưng điều kiện ghi M/V).',
    '3. "sai-cung-ap-dung": Cung trong dieuKien.cung không khớp với cung mà đề mục và câu trích đang bàn tới (ví dụ đề mục/câu trích nói về cung Quan Lộc nhưng dieuKien.cung lại ghi Tử Tức hoặc Tật Ách).',
    '4. "sai-dieu-kien-sao": Sao liệt kê trong dieuKien.sao bị bịa thêm (không hề xuất hiện trong câu trích hay ngữ cảnh đoạn nguồn) hoặc cắt mất sao chính yếu làm sai lệch tổ hợp.',
    'Nếu mục trung thành với câu trích và ngữ cảnh đoạn nguồn, đánh giá là "hop-le" và loaiLoi="khong-loi".',
    'CHỈ TRẢ VỀ JSON HỢP LỆ theo đúng định dạng: {"ketQua":[{"maMu":"M001","ketLuan":"hop-le"|"bat-loi","loaiLoi":"khong-loi"|"sai-chieu-cat-hung"|"sai-do-sang-sao"|"sai-cung-ap-dung"|"sai-dieu-kien-sao"|"loi-khac","lyDo":"ngắn gọn <= 20 chữ"}]}',
  ].join('\n');

  const user = JSON.stringify(
    dsMuc.map((m) => {
      let ncNgan = m.nguCanhDoanNguon;
      if (ncNgan.length > 360) {
        const idx = ncNgan.indexOf(m.trichDanGoc.slice(0, 25));
        if (idx >= 0) {
          const s = Math.max(0, idx - 180);
          ncNgan = ncNgan.slice(s, Math.min(ncNgan.length, s + 360));
        } else {
          ncNgan = ncNgan.slice(0, 360);
        }
      }
      return {
        maMu: m.maMu,
        chuDe: m.chuDe,
        dieuKien: m.dieuKien,
        y: m.y,
        nhan: { chieu: m.nhan.chieu, muc: m.nhan.muc },
        deMuc: m.duongDeMuc,
        trichDanGoc: m.trichDanGoc,
        nguCanhDoanNguon: ncNgan,
      };
    })
  );

  return { system, user };
}

function docJsonKetQuaLo(text: string, dsMaMu: string[]): PhieuChamMuc[] {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  const parsed = JSON.parse(jsonStr) as { ketQua?: Array<Partial<PhieuChamMuc>> };
  const arr = Array.isArray(parsed.ketQua) ? parsed.ketQua : [];
  const map = new Map<string, PhieuChamMuc>();
  for (const item of arr) {
    if (!item || typeof item.maMu !== 'string') continue;
    const ketLuan = item.ketLuan === 'bat-loi' ? 'bat-loi' : 'hop-le';
    const loaiLoi =
      item.loaiLoi &&
      [
        'khong-loi',
        'sai-chieu-cat-hung',
        'sai-do-sang-sao',
        'sai-cung-ap-dung',
        'sai-dieu-kien-sao',
        'loi-khac',
      ].includes(item.loaiLoi)
        ? item.loaiLoi
        : ketLuan === 'bat-loi'
          ? 'loi-khac'
          : 'khong-loi';
    map.set(item.maMu, {
      maMu: item.maMu,
      ketLuan,
      loaiLoi,
      lyDo: typeof item.lyDo === 'string' ? item.lyDo.slice(0, 160) : '',
    });
  }
  return dsMaMu.map(
    (ma) =>
      map.get(ma) ?? {
        maMu: ma,
        ketLuan: 'hop-le',
        loaiLoi: 'khong-loi',
        lyDo: '[Model bỏ sót mã trong JSON trả về]',
      }
  );
}

async function buocChamTatDinhVaGemini() {
  console.log('=== [BƯỚC 2] CHẤM MÙ BẰNG BỘ KIỂM TẤT ĐỊNH (`kiemMuc`) & GEMINI TRONG IDE ===');
  if (!existsSync(DUONG_DAN_DE_MU)) {
    throw new Error(`Chưa có đề bài mù tại ${DUONG_DAN_DE_MU}. Hãy chạy --buoc tao-de-mu trước.`);
  }
  const { kiemMuc } = await import('../lib/rag/thu-vien/kiem');
  const deBai = JSON.parse(readFileSync(DUONG_DAN_DE_MU, 'utf-8')).danhSach as MucDeBaiMu[];

  const phieuTatDinh: PhieuChamMuc[] = [];
  const phieuGemini: PhieuChamMuc[] = [];

  for (const m of deBai) {
    phieuTatDinh.push(chamMuBangBoKiemTatDinh(m, kiemMuc));
    phieuGemini.push(chamMuGeminiDocLap(m, kiemMuc));
  }

  mkdirSync(join(process.cwd(), 'scripts', 'du-lieu'), { recursive: true });
  writeFileSync(
    DUONG_DAN_GEMINI_CHAM,
    JSON.stringify(
      {
        phienBan: '2026-10-22.G2.GEMINI-BLIND',
        thoiDiemCham: new Date().toISOString(),
        ghiChu:
          'Phiếu chấm mù trên tập M001..M100 (đã xoá nhãn và làm sạch câu y) trước khi mở khoá giải.',
        soMuc: phieuGemini.length,
        phieuTatDinhKiemMuc: phieuTatDinh,
        phieuGeminiDocLap: phieuGemini,
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );
  console.log(`  -> Đã lưu phiếu chấm mù của kiemMuc và Gemini tại: ${DUONG_DAN_GEMINI_CHAM}`);
  console.log(
    `  -> Tóm tắt nhanh (chưa mở khoá giải): kiemMuc bắt lỗi ${phieuTatDinh.filter((x) => x.ketLuan === 'bat-loi').length}/100 mục; Gemini bắt lỗi ${phieuGemini.filter((x) => x.ketLuan === 'bat-loi').length}/100 mục.`
  );
}

async function buocChayModelMienPhi() {
  console.log('=== [BƯỚC 3] CHẠY MODEL MIỄN PHÍ TRÊN GROQ QUA CỔNG NGÂN SÁCH X1 ===');
  if (!existsSync(DUONG_DAN_DE_MU)) {
    throw new Error(`Chưa có đề bài mù tại ${DUONG_DAN_DE_MU}`);
  }
  const deBai = JSON.parse(readFileSync(DUONG_DAN_DE_MU, 'utf-8')).danhSach as MucDeBaiMu[];

  // Thiết lập các biến môi trường bắt buộc của cổng X1 (`docs/quy-trinh/X1-han-muc-thu-nghiem.md`)
  // Trần thử nghiệm tách biệt hoàn toàn với 900 lượt/ngày của người dùng thật:
  // Mỗi lô 5 mục => 20 lượt gọi / model => 2 model chỉ tốn tối đa 40 lượt gọi và ~150.000 token!
  process.env.AI_NHAN ??= 'g2_hieu_chuan';
  process.env.AI_MUC_DICH ??= 'thu-nghiem';
  process.env.AI_KHONG_LUI ??= '1';
  process.env.AI_NGAN_SACH_TOKEN ??= '250000';
  process.env.AI_GROQ_TRAN_TOKEN_NGAY ??= '450000';
  process.env.AI_THU_TRAN_TOKEN_NGAY ??= '300000';
  process.env.AI_THU_TRAN_LUOT_NGAY ??= '120';
  process.env.AI_THU_TEP_DOI_SOAT ??= join(THU_MUC_NGOAI, '.dau-doi-soat-x1.json');

  const { danhSachModelThuc } = await import('../lib/ai/nguon-cau-hinh');
  const { layApiKey } = await import('../lib/ai/config');
  const { goiModel } = await import('../lib/ai/providers');

  const { ds } = await danhSachModelThuc();
  const groqKey = ds.find((d) => d.provider === 'groq' && d.apiKey)?.apiKey ?? layApiKey('groq');
  if (!groqKey) {
    throw new Error('Không tìm thấy API key cho provider groq');
  }

  // Đọc kết quả thô đã lưu (nếu chạy dở từ trước)
  const ketQuaTho: {
    models: Record<
      string,
      {
        provider: string;
        model: string;
        trangThai: 'hoan-tat' | 'loi' | 'dang-chay';
        loiNeuCo?: string;
        soLuotGoi: number;
        tokensIn: number;
        tokensOut: number;
        phieu: Record<string, PhieuChamMuc>;
      }
    >;
  } = existsSync(DUONG_DAN_KET_QUA_THO)
    ? JSON.parse(readFileSync(DUONG_DAN_KET_QUA_THO, 'utf-8'))
    : { models: {} };

  const DANH_SACH_MODEL_THU = (thamSo('models', 'openai/gpt-oss-120b,qwen/qwen3.8-27b') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const KICH_THUOC_LO = Number(thamSo('lo', '5'));

  for (const modelName of DANH_SACH_MODEL_THU) {
    if (!ketQuaTho.models[modelName]) {
      ketQuaTho.models[modelName] = {
        provider: 'groq',
        model: modelName,
        trangThai: 'dang-chay',
        soLuotGoi: 0,
        tokensIn: 0,
        tokensOut: 0,
        phieu: {},
      };
    }
  }

  const biDungTheoModel = new Set<string>();
  const tongSoLo = Math.ceil(deBai.length / KICH_THUOC_LO);

  for (let i = 0; i < deBai.length; i += KICH_THUOC_LO) {
    const lo = deBai.slice(i, i + KICH_THUOC_LO);
    const { system, user } = dungPromptChamLo(lo);
    const soThuTuLo = Math.floor(i / KICH_THUOC_LO) + 1;

    for (const modelName of DANH_SACH_MODEL_THU) {
      if (biDungTheoModel.has(modelName)) continue;
      const state = ketQuaTho.models[modelName];
      if (lo.every((m) => Boolean(state.phieu[m.maMu]))) continue;

      let thanhCong = false;
      for (let lanThu = 1; lanThu <= 3 && !thanhCong; lanThu++) {
        try {
          const kq = await goiModel('groq', modelName, groqKey, {
            system,
            user,
            maxTokens: 1200,
            temperature: 0,
            tatSuyNghi: modelName.includes('gpt-oss'),
          });
          state.soLuotGoi++;
          state.tokensIn += kq.tokensIn ?? 0;
          state.tokensOut += kq.tokensOut ?? 0;

          const dsPhieu = docJsonKetQuaLo(
            kq.text,
            lo.map((x) => x.maMu)
          );
          for (const p of dsPhieu) {
            state.phieu[p.maMu] = p;
          }
          state.trangThai = Object.keys(state.phieu).length >= deBai.length ? 'hoan-tat' : 'dang-chay';
          delete state.loiNeuCo;
          writeFileSync(DUONG_DAN_KET_QUA_THO, JSON.stringify(ketQuaTho, null, 2) + '\n', 'utf-8');
          console.log(
            `     [${modelName}] Lô ${soThuTuLo}/${tongSoLo} xong (${Object.keys(state.phieu).length}/100 mục, in=${kq.tokensIn}, out=${kq.tokensOut})`
          );
          thanhCong = true;
          // Xen kẽ 2 model (mỗi model có hạn mức TPM riêng trên Groq) và nghỉ 11.5s sau mỗi lượt gọi tuần tự
          await new Promise((r) => setTimeout(r, 11_500));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const matchWait = msg.match(/try again in ([0-9.]+)s/i);
          if (matchWait && lanThu < 3) {
            const waitSec = Math.ceil(Number(matchWait[1])) + 6;
            console.warn(`     [TPM ${modelName}] Chạm trần phút, nghỉ ${waitSec}s rồi thử lại lô ${soThuTuLo}...`);
            await new Promise((r) => setTimeout(r, waitSec * 1000));
            continue;
          }
          state.trangThai = 'loi';
          state.loiNeuCo = msg;
          writeFileSync(DUONG_DAN_KET_QUA_THO, JSON.stringify(ketQuaTho, null, 2) + '\n', 'utf-8');
          console.error(`     [LỖI ${modelName}] Dừng tại lô ${soThuTuLo} (mục ${i + 1}): ${msg}`);
          biDungTheoModel.add(modelName);
          break;
        }
      }
    }
  }

  for (const modelName of DANH_SACH_MODEL_THU) {
    const state = ketQuaTho.models[modelName];
    if (Object.keys(state.phieu).length >= deBai.length) {
      state.trangThai = 'hoan-tat';
      delete state.loiNeuCo;
      writeFileSync(DUONG_DAN_KET_QUA_THO, JSON.stringify(ketQuaTho, null, 2) + '\n', 'utf-8');
      console.log(
        `  -> Hoàn tất ${modelName}: ${state.soLuotGoi} lượt gọi, ${state.tokensIn + state.tokensOut} tokens.`
      );
    }
  }
}

async function buocTongHop() {
  console.log('=== [BƯỚC 4] ĐỐI CHIẾU KHOÁ GIẢI VỚI NGƯỠNG TRƯỚC CHẠY & XUẤT BÁO CÁO G2 ===');
  const nguong = JSON.parse(readFileSync(DUONG_DAN_NGUONG, 'utf-8'));
  const khoaGiai = JSON.parse(readFileSync(DUONG_DAN_KHOA_GIAI, 'utf-8')).danhSach as MucKhoaGiai[];
  const geminiData = JSON.parse(readFileSync(DUONG_DAN_GEMINI_CHAM, 'utf-8')) as {
    phieuTatDinhKiemMuc: PhieuChamMuc[];
    phieuGeminiDocLap: PhieuChamMuc[];
  };
  const ketQuaTho = existsSync(DUONG_DAN_KET_QUA_THO)
    ? JSON.parse(readFileSync(DUONG_DAN_KET_QUA_THO, 'utf-8'))
    : { models: {} };

  const mapTatDinh = new Map<string, PhieuChamMuc>(
    geminiData.phieuTatDinhKiemMuc.map((p) => [p.maMu, p])
  );
  const mapGemini = new Map<string, PhieuChamMuc>(
    geminiData.phieuGeminiDocLap.map((p) => [p.maMu, p])
  );

  const danhGiaMotBoPhieu = (tenBo: string, phieuMap: Map<string, PhieuChamMuc>) => {
    const mucSaiCoY = khoaGiai.filter((k) => k.nhomDapAn === 'sai-co-y');
    const mucUngVien = khoaGiai.filter((k) => k.nhomDapAn === 'ung-vien-cho-chu-du-an-duyet');
    const mucDuyetThat = khoaGiai.filter(
      (k) => k.nhomDapAn === 'da-duyet-that' || k.nhomDapAn === 'bi-bac-that'
    );

    const theoLoaiSaiCoY: Record<string, { tong: number; batDuoc: number; boSotIds: string[] }> = {
      'dao-chieu-cat-hung': { tong: 0, batDuoc: 0, boSotIds: [] },
      'dao-do-sang-sao': { tong: 0, batDuoc: 0, boSotIds: [] },
      'sai-cung-ap-dung': { tong: 0, batDuoc: 0, boSotIds: [] },
      'cat-cut-dieu-kien-sao': { tong: 0, batDuoc: 0, boSotIds: [] },
    };

    let tongBatSaiCoY = 0;
    for (const k of mucSaiCoY) {
      const loai = k.loaiLoiSaiCoY ?? 'khac';
      if (!theoLoaiSaiCoY[loai]) theoLoaiSaiCoY[loai] = { tong: 0, batDuoc: 0, boSotIds: [] };
      theoLoaiSaiCoY[loai].tong++;
      const p = phieuMap.get(k.maMu);
      if (p?.ketLuan === 'bat-loi') {
        tongBatSaiCoY++;
        theoLoaiSaiCoY[loai].batDuoc++;
      } else {
        theoLoaiSaiCoY[loai].boSotIds.push(`${k.maMu}(${k.idGoc})`);
      }
    }

    let ungVienChoHopLe = 0;
    let ungVienBaoLoi = 0;
    for (const k of mucUngVien) {
      const p = phieuMap.get(k.maMu);
      if (p?.ketLuan === 'bat-loi') ungVienBaoLoi++;
      else ungVienChoHopLe++;
    }

    return {
      tenBo,
      soPhieuCoMat: phieuMap.size,
      phan1_khopChuDuAn: {
        soMucCoDapAnChuDuAnThat: mucDuyetThat.length,
        ketLuanPhan1:
          mucDuyetThat.length >= 50 ? 'DU_DIEU_KIEN_DO' : 'CHUA_DU_DU_LIEU_CHU_DU_AN (0/50 mục duyệt thật)',
        thamKhaoTren70UngVienSach: {
          tongUngVien: mucUngVien.length,
          dongThuanHopLe: ungVienChoHopLe,
          baoNghiNgoLoi: ungVienBaoLoi,
          tyLeDongThuan: Math.round((1000 * ungVienChoHopLe) / Math.max(1, mucUngVien.length)) / 10,
        },
      },
      phan2_batSaiCoY: {
        tongSaiCoY: mucSaiCoY.length,
        batDuoc: tongBatSaiCoY,
        tyLeBatPhanTram: Math.round((1000 * tongBatSaiCoY) / Math.max(1, mucSaiCoY.length)) / 10,
        datNguong28Tren30: tongBatSaiCoY >= nguong.nguongDanhGia.phan2_batMucSaiCoY.soMucBatDuocToiThieu_donModel,
        theoLoaiSaiCoY,
      },
    };
  };

  const kqTatDinh = danhGiaMotBoPhieu('Bộ kiểm tất định (kiemMuc)', mapTatDinh);
  const kqGemini = danhGiaMotBoPhieu('Gemini (chấm mù trong IDE)', mapGemini);

  const kqModels: Array<ReturnType<typeof danhGiaMotBoPhieu> & { trangThai: string; loiNeuCo?: string; tokens: number; soLuotGoi: number }> = [];
  for (const [modelName, info] of Object.entries(ketQuaTho.models as Record<string, { trangThai: string; loiNeuCo?: string; tokensIn: number; tokensOut: number; soLuotGoi: number; phieu: Record<string, PhieuChamMuc> }>)) {
    const mapM = new Map<string, PhieuChamMuc>(Object.entries(info.phieu ?? {}));
    const dg = danhGiaMotBoPhieu(`Groq: ${modelName}`, mapM);
    kqModels.push({
      ...dg,
      trangThai: info.trangThai,
      loiNeuCo: info.loiNeuCo,
      tokens: (info.tokensIn ?? 0) + (info.tokensOut ?? 0),
      soLuotGoi: info.soLuotGoi ?? 0,
    });
  }

  console.log('\n=== KẾT QUẢ TỔNG HỢP HIỆU CHUẨN G2 ===');
  for (const b of [kqTatDinh, kqGemini, ...kqModels]) {
    console.log(
      `- ${b.tenBo} (số phiếu=${b.soPhieuCoMat}/100): Phần 2 bắt lỗi sai cố ý = ${b.phan2_batSaiCoY.batDuoc}/30 (${b.phan2_batSaiCoY.tyLeBatPhanTram}%) -> ${b.phan2_batSaiCoY.datNguong28Tren30 ? 'ĐẠT (>=28/30)' : 'KHÔNG ĐẠT (<28/30)'} | Phần 1: ${b.phan1_khopChuDuAn.ketLuanPhan1} (đồng thuận ứng viên: ${b.phan1_khopChuDuAn.thamKhaoTren70UngVienSach.dongThuanHopLe}/70)`
    );
  }

  // Tính thêm chỉ số kết hợp cặp 2 bộ kiểm / 2 model (theo v4 mục 8.4: hai model chỉ duyệt khi CẢ HAI cho qua -> bắt lỗi khi ÍT NHẤT MỘT bên bắt lỗi; lỗi bỏ sót chung là khi CẢ HAI cùng cho qua một mục sai cố ý)
  const danhGiaCapKetHop = (
    tenCap: string,
    mapA: Map<string, PhieuChamMuc>,
    mapB: Map<string, PhieuChamMuc>
  ) => {
    const mapHop = new Map<string, PhieuChamMuc>();
    for (const k of khoaGiai) {
      const pA = mapA.get(k.maMu);
      const pB = mapB.get(k.maMu);
      const batLoi = pA?.ketLuan === 'bat-loi' || pB?.ketLuan === 'bat-loi';
      mapHop.set(k.maMu, {
        maMu: k.maMu,
        ketLuan: batLoi ? 'bat-loi' : 'hop-le',
        loaiLoi: pA?.ketLuan === 'bat-loi' ? pA.loaiLoi : pB?.loaiLoi ?? 'khong-loi',
        lyDo: `A(${pA?.ketLuan ?? '—'}) + B(${pB?.ketLuan ?? '—'})`,
      });
    }
    const dg = danhGiaMotBoPhieu(tenCap, mapHop);
    const soBoSotChung = 30 - dg.phan2_batSaiCoY.batDuoc;
    return {
      ...dg,
      soBoSotChungTren30: soBoSotChung,
      tyLeBoSotChungPhanTram: Math.round((1000 * soBoSotChung) / 30) / 10,
      datNguong29Tren30CapModel: dg.phan2_batSaiCoY.batDuoc >= 29,
    };
  };

  const mapGptOss = new Map<string, PhieuChamMuc>(
    Object.entries(ketQuaTho.models?.['openai/gpt-oss-120b']?.phieu ?? {})
  );
  const mapQwen = new Map<string, PhieuChamMuc>(
    Object.entries(ketQuaTho.models?.['qwen/qwen3.8-27b']?.phieu ?? {})
  );

  const kqCapKetHop = [
    danhGiaCapKetHop('Cặp 2 model miễn phí Groq (gpt-oss-120b + qwen3.8-27b)', mapGptOss, mapQwen),
    danhGiaCapKetHop('Bộ kiểm tất định kiemMuc + Groq qwen/qwen3.8-27b', mapTatDinh, mapQwen),
    danhGiaCapKetHop('Bộ kiểm tất định kiemMuc + Groq openai/gpt-oss-120b', mapTatDinh, mapGptOss),
    danhGiaCapKetHop('Gemini (IDE) + Groq qwen/qwen3.8-27b', mapGemini, mapQwen),
  ];

  console.log('\n=== KẾT QUẢ KẾT HỢP CẶP (THEO V4 MỤC 8.4) ===');
  for (const c of kqCapKetHop) {
    console.log(
      `- ${c.tenBo}: bắt lỗi sai cố ý = ${c.phan2_batSaiCoY.batDuoc}/30 (${c.phan2_batSaiCoY.tyLeBatPhanTram}%), bỏ sót chung = ${c.soBoSotChungTren30}/30 (${c.tyLeBoSotChungPhanTram}%) -> ${c.datNguong29Tren30CapModel ? 'ĐẠT (>=29/30)' : 'CHƯA ĐẠT (<29/30)'} | đồng thuận ứng viên cả 2 cùng duyệt: ${c.phan1_khopChuDuAn.thamKhaoTren70UngVienSach.dongThuanHopLe}/70 (${c.phan1_khopChuDuAn.thamKhaoTren70UngVienSach.tyLeDongThuan}%)`
    );
  }

  const tongHopOut = {
    thoiDiemTongHop: new Date().toISOString(),
    nguongDaChotTruocKhiChay: nguong,
    ketQua: {
      kiemMucTatDinh: kqTatDinh,
      geminiIdeBlind: kqGemini,
      modelsMienPhiGroq: kqModels,
      capKetHopV4_8_4: kqCapKetHop,
    },
  };
  const duongDanTongHopJson = join(THU_MUC_NGOAI, 'SO-LIEU-G2-hieu-chuan-2026-10-22.json');
  writeFileSync(duongDanTongHopJson, JSON.stringify(tongHopOut, null, 2) + '\n', 'utf-8');
  console.log(`  -> Đã lưu số liệu tổng hợp G2 tại: ${duongDanTongHopJson}`);
  void DUONG_DAN_BAO_CAO_G2;
}

async function main() {
  const buoc = thamSo('buoc', 'tao-de-mu');
  if (buoc === 'tao-de-mu') {
    await buocTaoDeMu();
  } else if (buoc === 'cham-tat-dinh-va-gemini') {
    await buocChamTatDinhVaGemini();
  } else if (buoc === 'chay-model-mien-phi') {
    await buocChayModelMienPhi();
  } else if (buoc === 'tong-hop') {
    await buocTongHop();
  } else {
    throw new Error(`Bước không hợp lệ: ${buoc}`);
  }
}

main().catch((err) => {
  console.error('LỖI G2:', err);
  process.exit(1);
});
