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

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

type Doan = { id: string; document_id: string; duong_de_muc: string | null; noi_dung: string; tieuDe: string; hePhai: string; loaiNguon: string };

async function main() {
  const dot = thamSo('dot', 'sn-1');
  const gioiHan = Number(thamSo('gioi-han', '1200'));
  const loKyTu = Number(thamSo('lo-ky-tu', '7000'));
  const loToiDa = Number(thamSo('lo', '6'));
  const songSong = Number(thamSo('song-song', '4'));
  const thu = process.argv.includes('--thu');
  const baoCao = thamSo('bao-cao');

  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const { boDau, nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const { laDoanRac } = await import('../lib/rag/v3/truy-hoi-v3');
  const { doTrung, NGUONG_TRUNG } = await import('../lib/rag/uu-tien-nguon');
  const { kiemMuc, khoaGop, khoaDieuKien, tuDienSao, TEN_CUNG, chuanDoSang } = await import('../lib/rag/thu-vien/kiem');
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
      .select('id, document_id, duong_de_muc, noi_dung')
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
  const NHAN_SN = /(quan loc|cong danh|su nghiep|lam quan|nghe nghiep|chuc vu|quyen chuc)/;
  const deMuc = (c: Doan) => NHAN_SN.test(boDau(c.duong_de_muc ?? ''));
  const chon = tatCa
    .filter((c) => (deMuc(c) || NHAN_SN.test(boDau(c.noi_dung))) && !/readme/i.test(c.tieuDe))
    .filter((c) => !laDoanRac({ tieuDe: c.tieuDe, duongDeMuc: c.duong_de_muc, noiDung: c.noi_dung }))
    .filter((c) => nhanDangThucThe(c.noi_dung).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION'))
    .sort((a, b) => Number(deMuc(b)) - Number(deMuc(a)))
    .slice(0, gioiHan);
  console.log(`Đoạn trong kho ${tatCa.length} → chọn ${chon.length} (đề mục sự nghiệp ${chon.filter(deMuc).length})`);

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

"A hay B", "A hoặc B" là HAI quy tắc riêng — tách ra, mỗi quy tắc một sao; chỉ gộp vào một quy tắc khi sách nói các sao phải CÙNG có mặt.
"y" nói ĐẶC TÍNH làm việc / công danh mà sao cho thấy; tên một nghề cụ thể chỉ là ví dụ và chỉ nêu khi chính câu trích nêu nghề đó.

CHỈ trích quy tắc có điều kiện sao cụ thể và nói về sự nghiệp / công danh / năng lực làm việc. Bỏ lời bàn chung, lịch sử, cách an sao. Không bịa: đoạn không có quy tắc nào thì trả mảng rỗng.

Trả MỘT object JSON: {"muc": [ {"doan": 1, "cung": [...], "chi": [...], "sao": [...], "khong": [...], "thuocTinh": {...}, "gioiTinh": "...", "y": "...", "chieu": "...", "muc": "...", "cheDo": "...", "trich": "..."} ]}`;

  type Tho = Record<string, unknown>;
  const ungVien: { tho: Tho; doan: Doan }[] = [];
  const token = { vao: 0, ra: 0, dem: 0 };
  let loi = 0;
  let k = 0;
  const tho = async () => {
    while (k < lo.length) {
      const ds = lo[k++];
      const user = ds
        .map((d, i) => `[D${i + 1}] (đề mục: ${d.duong_de_muc ?? '—'})\n${d.noi_dung}`)
        .join('\n\n');
      try {
        const kq = await goiVoiFallback({ system, user, maxTokens: 5000 }, undefined, 90_000);
        token.vao += kq.tokensIn ?? 0;
        token.ra += kq.tokensOut ?? 0;
        token.dem += kq.tokensDem ?? 0;
        const o = docObjectJson(kq.text);
        const mang = Array.isArray(o?.muc) ? (o!.muc as Tho[]) : [];
        for (const t of mang) {
          const d = ds[Number(t.doan) - 1];
          if (d) ungVien.push({ tho: t, doan: d });
        }
      } catch (e) {
        loi++;
        console.warn('lô hỏng:', e instanceof Error ? e.message.slice(0, 120) : e);
      }
      if (k % 10 === 0) console.log(`  … ${k}/${lo.length} lô, ${ungVien.length} ứng viên`);
    }
  };
  await Promise.all(Array.from({ length: songSong }, tho));
  console.log(`Trích: ${lo.length} lô (${loi} hỏng) → ${ungVien.length} ứng viên. Token vào ${token.vao} (đệm ${token.dem}), ra ${token.ra}`);

  // ---------- 3. Kiểm tất định ----------
  const mang = (v: unknown) => (Array.isArray(v) ? v : []);
  const lyDoTruot = new Map<string, number>();
  const dat: MucThuVien[] = [];
  for (const { tho: t, doan } of ungVien) {
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
    // Câu trích nói "vô chính diệu" mà điều kiện quên ghi → khớp nhầm cung có chính tinh (thấy ở lượt sn-1)
    if (/vo chinh dieu|khong co chinh tinh/.test(boDau(`${t.trich ?? ''} ${t.y ?? ''}`))) {
      (dieuKien as { thuocTinh?: MucThuVien['dieuKien']['thuocTinh'] }).thuocTinh = { ...(dieuKien as { thuocTinh?: object }).thuocTinh, voChinhDieu: true };
    }
    if (!dieuKien.khong.length) delete (dieuKien as { khong?: unknown[] }).khong;
    const cheDo = (['add', 'modify', 'neutralize', 'override'].includes(String(t.cheDo)) ? t.cheDo : 'add') as MucThuVien['cheDo'];
    const y = String(t.y ?? '').trim();
    const trich = String(t.trich ?? '').trim();
    const kq = kiemMuc({ dieuKien, y, cheDo, trich }, { noiDung: doan.noi_dung, duongDeMuc: doan.duong_de_muc });
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
  gop.forEach((m, i) => (m.id = `TV-SN-${String(i + 1).padStart(4, '0')}`));

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
    writeFileSync(baoCao, JSON.stringify({ dot, token, soLo: lo.length, ungVien: ungVien.length, dat: dat.length, lyDoTruot: Object.fromEntries(lyDoTruot), muc: gop, mauThuan: mauThuan.map((ds) => ds.map((m) => m.id)) }, null, 1));
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
