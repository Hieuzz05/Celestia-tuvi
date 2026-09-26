/**
 * DỰNG THƯ VIỆN TRI THỨC — một chủ đề, offline (KIEN-TRUC-LUAN-GIAI.md mục 7, 11).
 *
 *   npx tsx scripts/dung-thu-vien.ts --dot sn-1 [--gioi-han 1200] [--lo 6] [--song-song 4] [--thu]
 *                                    [--bao-cao <tệp.json ngoài repo>]
 *
 * Chọn đoạn sách liên quan sự nghiệp → model trích mục theo lược đồ → KIỂM TẤT
 * ĐỊNH (lib/rag/thu-vien/kiem.ts) → gộp → phát hiện mâu thuẫn → gán đích cho mục
 * khác add → lưu (lib/rag/thu-vien/kho.ts). `--thu`: không lưu.
 *
 * Câu trích là văn sách có bản quyền: chỉ lưu vào Supabase. Báo cáo chi tiết
 * (có câu trích) phải ghi RA NGOÀI repo — repo công khai.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { batDauLuotThu } from './thu-chung';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}
batDauLuotThu('dung-thu-vien');

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

/** Nhóm dự phòng khi model vẫn ghi danh sách dài thành "phải có đủ": [tên, sao, số tối thiểu] */
const NHOM_DU_PHONG: [string, string[], number][] = [
  ['lục sát', ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Hóa Kỵ'], 1],
  ['lục cát', ['Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt'], 2],
  ['tam hoá', ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Lộc Tồn'], 2],
];

type Doan = { id: string; document_id: string; duong_de_muc: string | null; noi_dung: string; thu_tu?: number; tieuDe: string; hePhai: string; loaiNguon: string };

async function main() {
  const dot = thamSo('dot', 'sn-1');
  const gioiHan = Number(thamSo('gioi-han', '1200'));
  const loKyTu = Number(thamSo('lo-ky-tu', '7000'));
  const loToiDa = Number(thamSo('lo', '6'));
  const songSong = Number(thamSo('song-song', '4'));
  const thu = process.argv.includes('--thu');
  const themToHop = process.argv.includes('--to-hop');
  // --do-sang: thêm tập độ sáng; --chi-do-sang: CHỈ tập độ sáng (bổ sung vào một đợt đã có, lưu dưới đợt riêng)
  const themDoSang = process.argv.includes('--do-sang');
  const chiDoSang = process.argv.includes('--chi-do-sang');
  const baoCao = thamSo('bao-cao');

  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const { boDau, nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const { laDoanRac } = await import('../lib/rag/v3/truy-hoi-v3');
  const { doTrung, NGUONG_TRUNG } = await import('../lib/rag/uu-tien-nguon');
  const { kiemMuc, khoaGop, khoaDieuKien, tuDienSao, TEN_CUNG, chuanDoSang, cungTuDeMuc, dienDoSang, dienDoSangNguCanh, coNguyenVan } = await import('../lib/rag/thu-vien/kiem');
  const { SCHEMA_THU_VIEN, QUAN_HE, saoCuaMuc } = await import('../lib/rag/thu-vien/kieu');
  type MucThuVien = import('../lib/rag/thu-vien/kieu').MucThuVien;
  const { luuThuVien, xoaDotTrich } = await import('../lib/rag/thu-vien/kho');

  const sb = taoSupabaseAdmin();
  if (!sb) throw new Error('Thiếu Supabase');

  // ---------- 1. Chọn đoạn ----------
  const { data: tl } = await sb
    .from('knowledge_documents')
    .select('id, tieu_de, he_phai, loai_nguon, luu_tru, knowledge_document_versions(id, trang_thai)');
  const taiLieu = new Map((tl ?? []).map((d) => [d.id as string, d]));
  const banXuat = (tl ?? []).flatMap((d) =>
    d.luu_tru ? [] : (d.knowledge_document_versions as { id: string; trang_thai: string }[]).filter((v) => v.trang_thai === 'da_xuat_ban').map((v) => v.id)
  );
  const tatCa: Doan[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await sb
      .from('knowledge_chunks')
      .select('id, document_id, duong_de_muc, noi_dung, thu_tu')
      .in('version_id', banXuat)
      .eq('trang_thai', 'hoat_dong')
      .order('id')
      .range(tu, tu + 999);
    if (error) throw error;
    for (const c of data ?? []) {
      const d = taiLieu.get(c.document_id)!;
      tatCa.push({ ...c, tieuDe: d.tieu_de, hePhai: d.he_phai, loaiNguon: d.loai_nguon });
    }
    if (!data || data.length < 1000) break;
  }
  // Ngữ cảnh: cuối đoạn liền trước cùng tài liệu — nhiều đoạn chỉ nói "sao này gặp…" mà cung / sao chủ nằm ở đoạn trước
  const theoViTri = new Map(tatCa.map((c) => [`${c.document_id}#${c.thu_tu}`, c]));
  const nguCanhTruoc = (c: Doan) => theoViTri.get(`${c.document_id}#${(c.thu_tu ?? 0) - 1}`)?.noi_dung.slice(-400) ?? '';

  const NHAN_SN = /(quan loc|cong danh|su nghiep|lam quan|nghe nghiep|chuc vu|quyen chuc)/;
  const deMuc = (c: Doan) => NHAN_SN.test(boDau(c.duong_de_muc ?? ''));
  const sach = (c: Doan) =>
    !/readme/i.test(c.tieuDe) &&
    !laDoanRac({ tieuDe: c.tieuDe, duongDeMuc: c.duong_de_muc, noiDung: c.noi_dung }) &&
    nhanDangThucThe(c.noi_dung).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION');
  const suNghiep = tatCa.filter((c) => (deMuc(c) || NHAN_SN.test(boDau(c.noi_dung))) && sach(c));

  /*
   * TẬP TỔ HỢP (lượt 2, KIEN-TRUC 11.8): đoạn nói chính tinh CÙNG sao lớn trong một câu,
   * trên toàn kho — lượt 1 chỉ đọc đoạn có chữ "quan lộc / công danh", nên câu kiểu "Liêm
   * Phủ gặp Tả Hữu thì phú quý" ở phần bàn cung Mệnh bị bỏ (0 mục Liêm Phủ + lục cát).
   * Bỏ đoạn thuộc mục của cung không liên quan sự nghiệp.
   */
  const CUNG_KHAC = /(phu the|tu tuc|huynh de|phu mau|phuc duc|dien trach|tat ach|no boc)/;
  const CHINH = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];
  const DI_KEM = /(ta phu|huu bat|ta huu|van xuong|van khuc|xuong khuc|thien khoi|thien viet|khoi viet|kinh duong|da la|kinh da|hoa tinh|linh tinh|hoa linh|dia khong|dia kiep|khong kiep|hoa loc|hoa quyen|hoa khoa|hoa ky|khoa quyen|loc ton|thien ma|loc ma|tuan|triet)/;
  const doanToHop = themToHop
    ? tatCa.filter((c) => {
        if (suNghiep.includes(c) || CUNG_KHAC.test(boDau(c.duong_de_muc ?? '')) || !sach(c)) return false;
        return boDau(c.noi_dung).split(/[.;!?\n]/).some((cau) => CHINH.some((x) => cau.includes(boDau(x))) && DI_KEM.test(cau));
      })
    : [];
  /*
   * TẬP ĐỘ SÁNG (lượt 2b, KIEN-TRUC 11.8): đoạn nói một sao KÈM độ sáng trong cùng câu ("Thái
   * Dương hãm địa…", "Kình Dương đắc địa…") — sách hay có phần "miếu địa: … / hãm địa: …" cho
   * từng sao, nằm ngoài cả tập sự nghiệp lẫn tập tổ hợp. Đợt sn-2 chỉ phủ 13,5% điểm cần độ sáng.
   */
  const SAO_SANG = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân', 'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Văn Xương', 'Văn Khúc', 'Thiên Mã', 'Hóa Kỵ'];
  const TU_SANG = /(mieu|vuong dia|dac dia|ham dia|lac ham|binh hoa)/;
  const daCo = new Set([...suNghiep, ...doanToHop]);
  const doanDoSang = chiDoSang || themDoSang
    ? tatCa.filter((c) => {
        if (daCo.has(c) || CUNG_KHAC.test(boDau(c.duong_de_muc ?? '')) || !sach(c)) return false;
        return boDau(c.noi_dung.replace(/-/g, ' ')).split(/[.;!?\n]/).some((cau) => TU_SANG.test(cau) && SAO_SANG.some((x) => cau.includes(boDau(x))));
      })
    : [];
  const chon = (chiDoSang ? doanDoSang : [...suNghiep.sort((a, b) => Number(deMuc(b)) - Number(deMuc(a))), ...doanToHop, ...doanDoSang]).slice(0, gioiHan);
  /*
   * TRÍCH TĂNG DẦN (26/09/2026): --bo-qua <báo cáo lượt trước> bỏ các đoạn đã đọc ở lượt ấy — kho thêm
   * sách mới thì chỉ trích phần mới, không đọc lại cả kho.
   */
  const boQuaTep = thamSo('bo-qua');
  if (boQuaTep) {
    const daDoc = new Set<string>(JSON.parse(readFileSync(boQuaTep, 'utf-8')).daXuLy ?? []);
    const truoc = chon.length;
    chon.splice(0, chon.length, ...chon.filter((c) => !daDoc.has(c.id)));
    console.log(`Trích tăng dần: bỏ ${truoc - chon.length} đoạn đã đọc ở ${boQuaTep}`);
  }
  console.log(`Đoạn trong kho ${tatCa.length} → chọn ${chon.length} (sự nghiệp ${suNghiep.length}, đề mục sự nghiệp ${suNghiep.filter(deMuc).length}; tổ hợp ${doanToHop.length}; độ sáng ${doanDoSang.length})`);

  // Lô theo số ký tự, tối đa `loToiDa` đoạn
  const lo: Doan[][] = [];
  for (const c of chon) {
    const cuoi = lo[lo.length - 1];
    const dai = (cuoi ?? []).reduce((s, x) => s + x.noi_dung.length, 0);
    if (!cuoi || cuoi.length >= loToiDa || dai + c.noi_dung.length > loKyTu) lo.push([c]);
    else cuoi.push(c);
  }

  // ---------- 2. Trích ----------
  const dict = [...tuDienSao()].sort();
  const system = `Bạn trích QUY TẮC TỬ VI từ đoạn sách thành dữ liệu có cấu trúc, cho một thư viện tri thức về SỰ NGHIỆP (công danh, nghề, vị trí, quyền chức, cách làm việc, quý nhân / trở ngại trong công việc).

MỖI QUY TẮC = điều kiện máy đọc được + một câu nghĩa + câu trích NGUYÊN VĂN.

ĐIỀU KIỆN neo vào MỘT cung gốc (cung đang xét):
- "cung": các cung gốc được phép (chọn trong: ${TEN_CUNG.join(', ')}). Sách nói "Quan Lộc có…" → ["Quan Lộc"]; "Mệnh có… thì công danh…" → ["Mệnh"]; không nói cung → [].
- "chi": nếu sách nói "tại Dần Thân", "ở Tý Ngọ"… → ["Dần","Thân"]; không thì bỏ.
- "sao": mỗi sao PHẢI CÓ: {"ten": tên đúng như danh sách dưới, "quanHe": một trong ${QUAN_HE.join(' | ')}, "doSang": ["M"|"V"|"D"|"B"|"H"] nếu sách nói miếu/vượng/đắc/bình/hãm}.
  o-cung = ngay tại cung gốc (đồng cung, thủ, tọa); xung = cung xung chiếu; tam-hop = hai cung tam hợp; tam-phuong = bất kỳ đâu trong tam phương tứ chính ("hội", "gặp", "chiếu" chung chung); giap = kẹp hai bên cung gốc; muon-tu = cung vô chính diệu mượn sao cung xung.
- "nhom": khi sách liệt kê một NHÓM sao với nghĩa "gặp các sao này" (có một vài là đủ, không cần đủ cả nhóm) — vd. "gặp Kình Đà Hỏa Linh", "hội Tả Hữu Xương Khúc Khôi Việt", "Khoa Quyền Lộc hội chiếu" — ghi {"ten": [các sao], "quanHe": "tam-phuong", "toiThieu": 1 nếu gặp một sao đã đủ, 2 nếu sách nhấn mạnh gặp nhiều}. Chỉ ghi vào "sao" những sao BẮT BUỘC phải có mặt.
- "khong": các sao phải VẮNG ("không gặp", "chẳng có") — cùng dạng {ten, quanHe}.
- "thuocTinh": {"tuan": true} / {"triet": true} / {"trangSinh": ["Tuyệt"]} / {"voChinhDieu": true} khi sách nói tới.
- "gioiTinh": "nam" | "nu" nếu quy tắc chỉ cho một giới.

TÊN SAO HỢP LỆ (chỉ dùng đúng các tên này; "Xương Khúc" = hai sao Văn Xương + Văn Khúc; "Tả Hữu" = Tả Phù + Hữu Bật; "Khôi Việt" = Thiên Khôi + Thiên Việt; "Kình Đà" = Kình Dương + Đà La; "Không Kiếp" = Địa Không + Địa Kiếp; "Hỏa Linh" = Hỏa Tinh + Linh Tinh; "Lộc" có thể là Lộc Tồn hoặc Hóa Lộc — chọn theo văn cảnh):
${dict.join(', ')}

"y": MỘT câu nghĩa trung tính về sự nghiệp, 8–40 chữ, lời thường hiện đại, mức ôn hòa (bỏ phán quyết cực đoan kiểu "tù tội", "yểu"). Không "bạn", không "nên / hãy", không kể chuyện.
"chieu": "cat" | "hung" | "trung". "muc": "manh" | "vua" | "nhe".
"cheDo": "add" (mặc định) | "modify" | "neutralize" | "override". Chỉ khác "add" khi câu trích NÓI RÕ tổ hợp làm đổi / hoá giải / lật nghĩa (vd. "phản vi kỳ cách", "lại thành tốt", "giải được", "phá cách").
"trich": câu (hoặc vế câu) NGUYÊN VĂN trong đoạn làm căn cứ, chép đúng từng chữ, 12–300 ký tự.
"doan": số thứ tự đoạn [D#] chứa câu trích.

ĐỘ CHI TIẾT — thư viện dùng để luận ĐÚNG từng lá số, nên điều kiện phải đủ như sách viết:
- ĐỘ SÁNG BẮT BUỘC khi câu trích hoặc câu ngay trước nói miếu / vượng / đắc địa / bình hòa / hãm (kể cả "sáng sủa" = M/V/D, "mờ ám / lạc hãm" = H) — ghi "doSang" cho đúng sao ấy. Câu nêu HAI trường hợp ("miếu vượng thì…, hãm địa thì…") là HAI quy tắc riêng, mỗi quy tắc một độ sáng và một chiều cát / hung.
- CUNG: đề mục hoặc ngữ cảnh đoạn trước cho biết đang bàn cung nào (vd. đề mục "QUAN LỘC", "cung Mệnh") thì ghi cung đó, kể cả khi câu trích không lặp lại tên cung.
- SAO ĐI CÙNG: ghi ĐỦ mọi sao câu trích đặt làm điều kiện ("gặp Tả Hữu, Xương Khúc" → Tả Phù, Hữu Bật, Văn Xương, Văn Khúc; "gặp / hội / chiếu" chung chung → tam-phuong). Sao phải vắng ("không gặp sát tinh", "chẳng bị Không Kiếp") → "khong".
- CÁCH CỤC CÓ TÊN (Tử Phủ Vũ Tướng, Sát Phá Tham, Cơ Nguyệt Đồng Lương, Cự Nhật, Nhật Nguyệt…): các sao của cách nằm rải trong tam phương — ghi sao đóng tại cung gốc là "o-cung" (tối đa HAI chính tinh), các sao còn lại "tam-phuong". Chỉ có những cặp chính tinh engine an được mới đồng cung.
- Chính tinh gặp sát tinh / Hóa Kỵ / Tuần / Triệt thì ghi cả điều kiện đó — đó thường là chỗ nghĩa đổi chiều.

"A hay B", "A hoặc B" là HAI quy tắc riêng — tách ra, mỗi quy tắc một sao; chỉ gộp vào một quy tắc khi sách nói các sao phải CÙNG có mặt.
"y" nói ĐẶC TÍNH làm việc / công danh mà sao cho thấy; tên một nghề cụ thể chỉ là ví dụ và chỉ nêu khi chính câu trích nêu nghề đó.

CHỈ trích quy tắc có điều kiện sao cụ thể và nói về sự nghiệp / công danh / năng lực làm việc (quy tắc ở cung Mệnh nói "phú quý", "quyền chức", "hiển đạt", "làm nên" cũng tính). Bỏ lời bàn chung, lịch sử, cách an sao. Không bịa: đoạn không có quy tắc nào thì trả mảng rỗng.

Trả MỘT object JSON: {"muc": [ {"doan": 1, "cung": [...], "chi": [...], "sao": [...], "nhom": [...], "khong": [...], "thuocTinh": {...}, "gioiTinh": "...", "y": "...", "chieu": "...", "muc": "...", "cheDo": "...", "trich": "..."} ]}`;

  type Tho = Record<string, unknown>;
  const ungVien: { tho: Tho; doan: Doan; lo: Doan[] }[] = [];
  const token = { vao: 0, ra: 0, dem: 0 };
  let loi = 0;
  let k = 0;
  const userCua = (ds: Doan[]) =>
    ds
      .map((d, i) => {
        const nc = nguCanhTruoc(d);
        return `[D${i + 1}] (đề mục: ${d.duong_de_muc ?? '—'})${nc ? `\n(ngữ cảnh đoạn trước — KHÔNG trích từ đây: …${nc})` : ''}\n${d.noi_dung}`;
      })
      .join('\n\n');
  const nhanKetQua = (ds: Doan[], text: string) => {
    const o = docObjectJson(text);
    const mang = Array.isArray(o?.muc) ? (o!.muc as Tho[]) : [];
    for (const t of mang) {
      const d = ds[Number(t.doan) - 1];
      if (d) ungVien.push({ tho: t, doan: d, lo: ds });
    }
  };
  if (process.argv.includes('--batch')) {
    // Batch API: nửa giá, kết quả về sau vài phút (26/09/2026 — giảm chi phí dựng thư viện)
    const { chayBatchOpenAi } = await import('../lib/ai/batch-openai');
    const kq = await chayBatchOpenAi(
      lo.map((ds, i) => ({ id: String(i), system, user: userCua(ds), model: thamSo('model', 'gpt-5.6-luna'), maxTokens: 5000 })),
      { nhan: `dung-${dot}`, khiCho: (t, x, n) => console.log(`  batch ${t} ${x}/${n}`) }
    );
    lo.forEach((ds, i) => {
      const r = kq.get(String(i));
      if (!r || r.loi) {
        loi++;
        return;
      }
      token.vao += r.tokensIn;
      token.ra += r.tokensOut;
      token.dem += r.tokensDem;
      nhanKetQua(ds, r.text);
    });
  } else {
    const tho = async () => {
      while (k < lo.length) {
        const ds = lo[k++];
        try {
          const kq = await goiVoiFallback({ system, user: userCua(ds), maxTokens: 5000 }, undefined, 90_000);
          token.vao += kq.tokensIn ?? 0;
          token.ra += kq.tokensOut ?? 0;
          token.dem += kq.tokensDem ?? 0;
          nhanKetQua(ds, kq.text);
        } catch (e) {
          loi++;
          console.warn('lô hỏng:', e instanceof Error ? e.message.slice(0, 120) : e);
          if (e instanceof Error && e.name === 'VuotNganSachError') break;
        }
        if (k % 10 === 0) console.log(`  … ${k}/${lo.length} lô, ${ungVien.length} ứng viên`);
      }
    };
    await Promise.all(Array.from({ length: songSong }, tho));
  }
  console.log(`Trích: ${lo.length} lô (${loi} hỏng) → ${ungVien.length} ứng viên. Token vào ${token.vao} (đệm ${token.dem}), ra ${token.ra}`);

  // ---------- 3. Kiểm tất định ----------
  const mang = (v: unknown) => (Array.isArray(v) ? v : []);
  const lyDoTruot = new Map<string, number>();
  const dat: MucThuVien[] = [];
  for (const { tho: t, doan: doanGhi, lo: loCua } of ungVien) {
    // Model hay ghi nhầm số [D#] hoặc trích từ ngữ cảnh đoạn trước — tìm đoạn THẬT chứa câu trích
    // trong lô và các đoạn liền trước (lượt thử 11.8: 17 / 48 trượt "không có nguyên văn")
    const trichTho = String(t.trich ?? '');
    const doan =
      [doanGhi, ...loCua, ...loCua.map((c) => theoViTri.get(`${c.document_id}#${(c.thu_tu ?? 0) - 1}`)).filter((c): c is Doan => Boolean(c))]
        .find((c) => coNguyenVan(trichTho, c.noi_dung)) ?? doanGhi;
    const dieuKien = {
      cung: mang(t.cung).filter((x): x is string => typeof x === 'string'),
      chi: mang(t.chi).filter((x): x is string => typeof x === 'string'),
      sao: mang(t.sao)
        .filter((x): x is Tho => !!x && typeof x === 'object')
        .map((x) => ({
          ten: String(x.ten ?? ''),
          quanHe: String(x.quanHe ?? 'o-cung') as MucThuVien['dieuKien']['sao'][number]['quanHe'],
          ...(chuanDoSang(String(x.ten ?? ''), mang(x.doSang).map(String))?.length ? { doSang: chuanDoSang(String(x.ten ?? ''), mang(x.doSang).map(String)) } : {}),
        })),
      khong: mang(t.khong)
        .filter((x): x is Tho => !!x && typeof x === 'object')
        .map((x) => ({ ten: String(x.ten ?? ''), quanHe: String(x.quanHe ?? 'tam-phuong') as MucThuVien['dieuKien']['sao'][number]['quanHe'] })),
      ...(t.thuocTinh && typeof t.thuocTinh === 'object' && Object.keys(t.thuocTinh).length ? { thuocTinh: t.thuocTinh as MucThuVien['dieuKien']['thuocTinh'] } : {}),
      ...(t.gioiTinh === 'nam' || t.gioiTinh === 'nu' ? { gioiTinh: t.gioiTinh as 'nam' | 'nu' } : {}),
    };
    if (!dieuKien.chi.length) delete (dieuKien as { chi?: string[] }).chi;
    // Cung trống mà đề mục nêu đúng một cung → lấy cung ấy (lượt 1: 43% mục để "mọi cung")
    const cungDm = cungTuDeMuc(doan.duong_de_muc);
    if (!dieuKien.cung.length && cungDm) dieuKien.cung = [cungDm];
    // Câu trích nói "vô chính diệu" mà điều kiện quên ghi → khớp nhầm cung có chính tinh (thấy ở lượt sn-1)
    if (/vo chinh dieu|khong co chinh tinh/.test(boDau(`${t.trich ?? ''} ${t.y ?? ''}`))) {
      (dieuKien as { thuocTinh?: MucThuVien['dieuKien']['thuocTinh'] }).thuocTinh = { ...(dieuKien as { thuocTinh?: object }).thuocTinh, voChinhDieu: true };
    }
    if (!dieuKien.khong.length) delete (dieuKien as { khong?: unknown[] }).khong;
    // Nhóm "ít nhất k": từ model, và luật dự phòng tất định — ≥ 3 sao cùng một nhóm (lục sát / lục
    // cát / tam hoá) cùng quan hệ ngoài cung gốc là cách sách liệt kê "gặp các sao này", không
    // phải "phải có đủ" (lượt thử 11.8: "Kình Đà Hỏa Linh" ghi thành bốn điều kiện bắt buộc)
    const nhom: NonNullable<MucThuVien['dieuKien']['nhom']> = mang(t.nhom)
      .filter((x): x is Tho => !!x && typeof x === 'object' && Array.isArray((x as Tho).ten))
      .map((x) => ({
        ten: mang(x.ten).map(String),
        quanHe: String(x.quanHe ?? 'tam-phuong') as MucThuVien['dieuKien']['sao'][number]['quanHe'],
        toiThieu: Math.max(1, Math.min(Number(x.toiThieu) || 1, mang(x.ten).length)),
      }));
    for (const [nhomTen, ds, toiThieu] of NHOM_DU_PHONG) {
      const trong = dieuKien.sao.filter((s) => ds.includes(s.ten) && s.quanHe !== 'o-cung' && !s.doSang?.length);
      const theoQh = new Map<string, typeof trong>();
      for (const s of trong) theoQh.set(s.quanHe, [...(theoQh.get(s.quanHe) ?? []), s]);
      for (const [qh, cac] of theoQh) {
        if (cac.length < 3) continue;
        nhom.push({ ten: cac.map((s) => s.ten), quanHe: qh as MucThuVien['dieuKien']['sao'][number]['quanHe'], toiThieu });
        dieuKien.sao = dieuKien.sao.filter((s) => !cac.includes(s));
        void nhomTen;
      }
    }
    if (nhom.length) (dieuKien as { nhom?: typeof nhom }).nhom = nhom;
    const cheDo = (['add', 'modify', 'neutralize', 'override'].includes(String(t.cheDo)) ? t.cheDo : 'add') as MucThuVien['cheDo'];
    const y = String(t.y ?? '').trim();
    const trich = String(t.trich ?? '').trim();
    dienDoSang(dieuKien, trich);
    dienDoSangNguCanh(dieuKien, doan.duong_de_muc, doan.noi_dung, trich);
    const kq = kiemMuc({ dieuKien, y, cheDo, trich }, { noiDung: doan.noi_dung, duongDeMuc: doan.duong_de_muc });
    if (!kq.dat && process.env.GO_LOI && kq.lyDo.some((l) => l.includes(process.env.GO_LOI!))) console.log('GO:', JSON.stringify({ sao: t.sao, nhom: t.nhom, trich: String(t.trich).slice(0, 80) }));
    if (!kq.dat) {
      for (const l of kq.lyDo) {
        const loai = l.replace(/:.*$/, '').replace(/ \d+ chữ.*/, ' (độ dài)').replace(/không thấy nhắc cung .*/, 'không thấy nhắc cung').replace(/không thấy nhắc .*/, 'không thấy nhắc sao');
        lyDoTruot.set(loai, (lyDoTruot.get(loai) ?? 0) + 1);
      }
      continue;
    }
    dat.push({
      id: '',
      schemaVersion: SCHEMA_THU_VIEN,
      chuDe: ['su-nghiep'],
      dieuKien,
      y,
      nhan: {
        chieu: (['cat', 'hung', 'trung'].includes(String(t.chieu)) ? t.chieu : 'trung') as MucThuVien['nhan']['chieu'],
        muc: (['manh', 'vua', 'nhe'].includes(String(t.muc)) ? t.muc : 'vua') as MucThuVien['nhan']['muc'],
        linhVuc: ['su-nghiep'],
      },
      cheDo: kq.cheDo,
      canCu: [{ chunkId: doan.id, documentId: doan.document_id, trich }],
      truongPhai: doan.loaiNguon === 'ghi-chu-chuyen-gia' ? 'celes' : doan.hePhai === 'nam-phai' ? 'nam-phai' : doan.hePhai === 'bac-phai' ? 'bac-phai' : 'chung',
      duyet: 'chua',
      dotTrich: dot,
    });
  }
  console.log(`Kiểm tất định: ${dat.length}/${ungVien.length} đạt (${Math.round((100 * dat.length) / Math.max(1, ungVien.length))}%)`);
  console.log('  Lý do trượt:', [...lyDoTruot.entries()].sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l}: ${n}`).join(' · '));

  // ---------- 4. Gộp ----------
  const theoKhoa = new Map<string, MucThuVien>();
  for (const m of dat) {
    const khoa = khoaGop(m);
    const co = theoKhoa.get(khoa);
    if (!co) {
      theoKhoa.set(khoa, m);
      continue;
    }
    const c = m.canCu[0];
    // Bản chép phú của nhau (cùng câu ở hai sách) chỉ tính một căn cứ
    if (co.canCu.some((x) => x.chunkId === c.chunkId || doTrung(x.trich, c.trich) >= NGUONG_TRUNG)) continue;
    if (co.canCu.length < 4) co.canCu.push(c);
  }
  const gop = [...theoKhoa.values()];

  // ---------- 5. Mâu thuẫn: cùng điều kiện, khác chiều ----------
  const theoDk = new Map<string, MucThuVien[]>();
  for (const m of gop) theoDk.set(khoaDieuKien(m), [...(theoDk.get(khoaDieuKien(m)) ?? []), m]);
  const mauThuan = [...theoDk.values()].filter((ds) => new Set(ds.map((m) => m.nhan.chieu).filter((c) => c !== 'trung')).size > 1);

  // Thứ tự id ổn định: tổ hợp trước, rồi theo tên sao
  gop.sort((a, b) => saoCuaMuc(b).length - saoCuaMuc(a).length || saoCuaMuc(a).join().localeCompare(saoCuaMuc(b).join()) || a.y.localeCompare(b.y));
  const tienTo = dot === 'sn-1' ? 'TV-SN' : `TV-${dot.toUpperCase()}`;
  gop.forEach((m, i) => (m.id = `${tienTo}-${String(i + 1).padStart(4, '0')}`));

  // ---------- 6. Đích cho mục khác add ----------
  let epAdd = 0;
  for (const m of gop) {
    if (m.cheDo === 'add') continue;
    const sao = new Set(saoCuaMuc(m));
    const dich = gop.filter(
      (x) =>
        x !== m &&
        saoCuaMuc(x).every((s) => sao.has(s)) &&
        saoCuaMuc(x).length < sao.size &&
        (m.cheDo === 'modify' || (x.nhan.chieu !== m.nhan.chieu && x.nhan.chieu !== 'trung'))
    );
    if (dich.length) m.dich = dich.map((x) => x.id);
    else {
      m.cheDo = 'add';
      epAdd++;
    }
  }

  const toHop = gop.filter((m) => saoCuaMuc(m).length >= 2).length;
  const theoCheDo = gop.reduce<Record<string, number>>((a, m) => ((a[m.cheDo] = (a[m.cheDo] ?? 0) + 1), a), {});
  const nguonDocLap = gop.filter((m) => new Set(m.canCu.map((c) => c.documentId)).size >= 2).length;
  console.log(`Gộp: ${dat.length} → ${gop.length} mục · tổ hợp ${toHop} · ≥2 tài liệu độc lập ${nguonDocLap} · chế độ ${JSON.stringify(theoCheDo)} (ép về add vì không có đích: ${epAdd}) · cặp mâu thuẫn ${mauThuan.length}`);

  if (baoCao) {
    writeFileSync(baoCao, JSON.stringify({ dot, token, daXuLy: chon.map((c) => c.id), soLo: lo.length, ungVien: ungVien.length, dat: dat.length, lyDoTruot: Object.fromEntries(lyDoTruot), muc: gop, mauThuan: mauThuan.map((ds) => ds.map((m) => m.id)) }, null, 1));
    console.log(`Báo cáo: ${baoCao}`);
  }
  if (thu) {
    console.log('--thu: không lưu.');
    return;
  }
  await xoaDotTrich(dot);
  const n = await luuThuVien(gop);
  console.log(`Đã lưu ${n} mục (đợt ${dot}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
