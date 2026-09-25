/**
 * Tạm — xuất output HIỆN TẠI của mọi bề mặt ra một tệp markdown để viết lại tay.
 *
 * Chạy TRƯỚC khi sửa ngân sách từ (A1), để có đúng bản AI đang viết làm căn cứ.
 *
 *   npx tsx scripts/tam-xuat-mau.ts <tep-ra.md> <spec> <spec> ...
 *   spec = ngay/thang/nam/gio/gioiTinh
 *
 * KHÔNG nhúng dữ liệu sinh vào tệp mã. Tệp ra chỉ gắn nhãn theo CẤU HÌNH lá số
 * (chính tinh, cách cục), không ghi ngày sinh — nhãn ấy đủ để phân biệt tám lá
 * số mà không mang thông tin cá nhân nào.
 *
 * Ghi dần sau mỗi lượt: hết hạn mức giữa chừng thì phần đã sinh vẫn còn.
 * Xoá tệp này sau khi xong bộ mẫu.
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

type ChangId = 'ben-trong' | 'con-duong' | 'sat-canh' | 'de-lai';
type Them = 'chat-quyet-dinh' | 'chat-mo-ta' | 'moc-giai-doan' | 'moc-nam'
  | 'diem-noi-bat' | 'bang-linh-vuc';

/** Việc của từng lá số, theo đúng thứ tự tham số truyền vào */
const KE_HOACH: { chang: ChangId; them: Them[]; vaiTro: string }[] = [
  { chang: 'con-duong', them: ['chat-quyet-dinh'], vaiTro: 'công việc mạnh nhất bộ' },
  { chang: 'ben-trong', them: ['moc-giai-doan'], vaiTro: 'nội tâm mạnh, cách cục nghèo' },
  { chang: 'sat-canh', them: ['bang-linh-vuc'], vaiTro: 'tình cảm 100, cách cục giàu nhất' },
  { chang: 'con-duong', them: ['moc-nam'], vaiTro: 'tiền bạc 100' },
  { chang: 'con-duong', them: ['diem-noi-bat'], vaiTro: 'CÔNG VIỆC = 0 — ca độn chữ' },
  { chang: 'ben-trong', them: [], vaiTro: 'nữ 50t, Cơ Nguyệt Đồng Lương' },
  { chang: 'sat-canh', them: ['chat-mo-ta'], vaiTro: 'nữ 51t, vô chính diệu' },
  { chang: 'con-duong', them: ['diem-noi-bat'], vaiTro: '42t, 1 cách cục — nghèo dữ kiện' },
];

const CHAT_CAU_HOI: Record<string, string> = {
  'chat-quyet-dinh': 'tôi vừa nhận được 1 offer lương cao hơn nhưng phải chuyển ngành, tôi nên nhận ko',
  'chat-mo-ta': 'Công việc của tôi sắp tới thế nào?',
};

const tepRa = process.argv[2];
const specs = process.argv.slice(3);
if (!tepRa || !specs.length) {
  console.error('Cách dùng: npx tsx scripts/tam-xuat-mau.ts ra.md ngay/thang/nam/gio/gioiTinh ...');
  process.exit(1);
}

const khoi: string[] = [];
const loi: string[] = [];
const luu = () => writeFileSync(tepRa, khoi.join(''), 'utf-8');

async function chay() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
  const { dungChang, tomTatChang, PHIEN_BAN_BAN_DOC_SAU } = await import('../lib/rag/ban-doc-sau');
  const { THU_TU_CHANG } = await import('../lib/tuvi/chang-cung');
  const { sinhMocHanhTrinh } = await import('../lib/rag/moc-hanh-trinh');
  const { sinhDiemNoiBat } = await import('../lib/rag/be-mat-ngan');
  const { sinhBangLinhVuc } = await import('../lib/rag/bang-linh-vuc');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { cacGiaiDoan, cacNam } = await import('../lib/tuvi/hanh-trinh');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { CHI, CHINH_TINH } = await import('../lib/tuvi/constants');

  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();

  khoi.push(`# Bản Celes đang gen — để viết lại\n\n`);
  khoi.push(`## Xuất xứ — đây là bản thật, không phải bản viết tay\n\n`);
  khoi.push(`| | |\n|---|---|\n`);
  khoi.push(`| Sinh lúc | ${new Date().toISOString().slice(0, 16).replace('T', ' ')} |\n`);
  khoi.push(`| Trạng thái code | **TRƯỚC** khi sửa ngân sách từ (A1) — đúng thứ người dùng đang đọc |\n`);
  khoi.push(`| Hàm gọi | \`dungChang()\` — **cùng hàm** \`app/api/ban-doc-sau/route.ts:150\` gọi |\n`);
  khoi.push(`| Nối chặng | \`daNoiTruoc\` dựng từ \`tomTatChang()\` của các chặng trước, y như route |\n`);
  khoi.push(`| Lớp dọn | chạy trong \`dungChang\`: \`boMarkdown\` · \`doiTenCung\` · \`suaCauTiengLong\` · \`boCauRaLenh\` · \`boCauPhanQuyet\` · \`boCauTenBia\` |\n`);
  khoi.push(`| Model | chuỗi fallback thật trong \`.env.local\` (\`AI_FALLBACK_ORDER\`) |\n`);
  khoi.push(`| RAG | truy hồi thật trên Supabase — vector + từ khoá, trộn RRF |\n`);
  khoi.push(`| Phiên bản | \`${PHIEN_BAN_BAN_DOC_SAU}\` |\n`);
  khoi.push(`| Bề mặt khác | \`traLoiCoCanCu\` · \`sinhMocHanhTrinh\` · \`sinhDiemNoiBat\` · \`sinhBangLinhVuc\` — cùng hàm các route gọi |\n`);
  khoi.push(`\n**Không một chữ nào trong tệp này do Claude viết.** Mọi câu đều là chữ model trả về.\n`);
  khoi.push(`\n## Cách dùng\n\n`);
  khoi.push(`Viết lại **cách nói**, giữ nguyên mọi nhận định. Không thêm dữ kiện, không bỏ kết luận.\n`);
  khoi.push(`Chỗ thừa thì xoá, chỗ thiếu dẫn chứng thì ghi \`[cần dẫn chứng]\`.\n\n`);
  khoi.push(`**Giữ lại bản máy, viết bản của anh ngay DƯỚI nó** — cặp (máy, tay) trên cùng một lá số\n`);
  khoi.push(`là thứ dùng để đo, vì nó khử hết biến thiên do lá số.\n\n`);
  khoi.push(`Mỗi lá số có đủ **4 chặng / 12 phần đời** — đọc liền mạch để thấy chỗ lặp giữa các chặng.\n`);
  luu();

  const doiMoc = (ds: ReturnType<typeof cacGiaiDoan>) =>
    ds.map((m) => ({
      id: m.id,
      nhan: m.nhan,
      tenCung: m.cung.tenCung,
      chi: CHI[m.cung.chiIndex],
      sao: m.cung.sao
        .filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten))
        .slice(0, 2)
        .map((s) => s.ten)
        .join(', '),
      vong: [m.cung.coTuan ? 'Tuần' : null, m.cung.coTriet ? 'Triệt' : null].filter(Boolean).join(' + '),
    }));

  for (const [i, spec] of specs.entries()) {
    const [ngay, thang, nam, gio, gt] = spec.split('/');
    const laSo = lapLaSo({
      ngay: Number(ngay), thang: Number(thang), nam: Number(nam), gio: Number(gio),
      gioiTinh: gt === 'nu' ? 'nu' : 'nam',
    });
    const viec = KE_HOACH[i] ?? { chang: 'ben-trong' as ChangId, them: [], vaiTro: '' };

    const menh = laSo.cungs.find((c) => c.tenCung === 'Mệnh');
    const ct = menh?.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten) ?? [];
    const cc = nhanDangCachCuc(laSo).filter((c) => c.loai !== 'han');
    const nhan = `Lá số ${String.fromCharCode(65 + i)}`;

    khoi.push(`\n\n---\n\n# ${nhan} — ${viec.vaiTro}\n\n`);
    khoi.push(`\`Mệnh: ${ct.join(', ') || 'vô chính diệu'} · cách cục: ${cc.map((c) => c.ten).join(' · ') || '(không có)'}\`\n`);
    luu();

    /*
     * BẢN ĐỌC SÂU — CẢ BỐN CHẶNG, nối `daNoiTruoc` y như production.
     *
     * Lặp tay thay vì gọi `sinhBanDocSau` vì hai lý do, và cả hai đều để bản
     * xuất ra GIỐNG bản người dùng thật đang đọc:
     *
     *  1. `app/api/ban-doc-sau/route.ts` cũng lặp tay như thế này: nó gọi
     *     `dungChang` từng chặng một, dựng `daNoiTruoc` từ các chặng trước đã
     *     nằm trong đệm. Đây là đúng đường chạy thật.
     *  2. `sinhBanDocSau` bỏ qua im lặng chặng nào hỏng (`if (!c) continue`),
     *     nên một lần hết giờ là mất hẳn một chặng mà không biết. Lặp tay thì
     *     thử lại được.
     *
     * KHÔNG tự viết một chữ nào vào đây. Mọi câu trong tệp ra đều là chữ model
     * trả về, đã đi qua đúng các lớp dọn của `dungChang`.
     */
    const daNoiTruoc: string[] = [];
    for (const chang of THU_TU_CHANG) {
      let c: Awaited<ReturnType<typeof dungChang>> = null;
      for (let lan = 1; lan <= 2 && !c; lan++) {
        try {
          console.log(`[${nhan}] chặng ${chang}${lan > 1 ? ' (thử lại)' : ''}...`);
          c = await dungChang({ laSo, chang, namXem, thangXem, daNoiTruoc });
        } catch (e) {
          const m = `[${nhan}] ${chang} lần ${lan}: ${e instanceof Error ? e.message : e}`;
          console.warn('  ' + m);
          if (lan === 2) loi.push(m);
        }
      }
      if (!c) {
        const m = `[${nhan}] chặng ${chang}: không dựng được sau 2 lần`;
        if (!loi.includes(m)) loi.push(m);
        khoi.push(`\n## Bản đọc sâu — chặng ${chang}\n\n_(KHÔNG SINH ĐƯỢC)_\n`);
        luu();
        continue;
      }

      khoi.push(`\n## Chặng ${c.thuTu}. ${c.tieuDe}\n\n_${c.subtitle}_\n`);
      for (const m of c.muc) {
        khoi.push(`\n### ${m.tieuDe}  \`nổi bật ${m.doNoiBat}/100\`\n`);
        if (m.thieuCanCu) { khoi.push(`\n_(model báo thiếu căn cứ)_\n`); continue; }
        khoi.push(`\n**Câu hỏi soi:** ${m.cauHoiSoi}\n`);
        khoi.push(`\n**Kết luận:** ${m.ketLuan}\n`);
        for (const t of m.tieuChi) {
          khoi.push(`\n#### ${t.nhan}${t.laGuong ? ' [GƯƠNG]' : ''}  \`${t.soTu} từ\`\n`);
          khoi.push(t.thieuCanCu ? `\n_(thiếu căn cứ)_\n` : `\n${t.noiDung}\n`);
          if (t.luongNguoc) khoi.push(`\n> Lực ngược: ${t.luongNguoc}\n`);
        }
        khoi.push(`\n**Giữ lại:** ${m.giuLai}\n`);
      }
      if (c.doanKhau) khoi.push(`\n**Đoạn khâu (tổng kết chặng):** ${c.doanKhau}\n`);
      if (c.cauBacCau) khoi.push(`\n**Bắc cầu sang chặng sau:** ${c.cauBacCau}\n`);
      luu();

      daNoiTruoc.push(...tomTatChang(c));
    }

    // ---- các bề mặt khác
    for (const t of viec.them) {
      try {
        console.log(`[${nhan}] ${t}...`);
        if (t === 'chat-quyet-dinh' || t === 'chat-mo-ta') {
          const r = await traLoiCoCanCu({
            laSo, cauHoi: CHAT_CAU_HOI[t], namXem, thangXem, ghiNhatKy: false,
          });
          khoi.push(`\n## Chat Celes — "${CHAT_CAU_HOI[t]}"\n\n${r.van}\n`);
        } else if (t === 'moc-giai-doan' || t === 'moc-nam') {
          const ds = t === 'moc-giai-doan'
            ? cacGiaiDoan(laSo, namXem, 'vi')
            : cacNam(laSo, namXem, namXem, 'vi');
          const r = await sinhMocHanhTrinh({
            laSo, loai: t === 'moc-giai-doan' ? 'giai-doan' : 'nam',
            moc: doiMoc(ds), namXem, thangXem,
          });
          if (!r) throw new Error('trả về null');
          khoi.push(`\n## Hành trình — mốc ${t === 'moc-giai-doan' ? 'giai đoạn' : 'năm'}\n`);
          for (const m of ds) {
            const v = r.noiDung[m.id];
            if (v) khoi.push(`\n- **${m.nhan}** — ${v}\n`);
          }
        } else if (t === 'diem-noi-bat') {
          const r = await sinhDiemNoiBat({ laSo, namXem, thangXem });
          if (!r) throw new Error('trả về null');
          khoi.push(`\n## Bề mặt ngắn — Điểm nổi bật\n\n\`\`\`json\n${JSON.stringify(r.noiDung, null, 2)}\n\`\`\`\n`);
        } else if (t === 'bang-linh-vuc') {
          const r = await sinhBangLinhVuc({ laSo, namXem, thangXem });
          if (!r) throw new Error('trả về null');
          khoi.push(`\n## Bảng 12 lĩnh vực\n`);
          for (const k of r.noiDung) {
            khoi.push(`\n### ${(k as { tieuDe?: string }).tieuDe ?? '(không tiêu đề)'}\n\n${JSON.stringify(k, null, 2)}\n`);
          }
        }
      } catch (e) {
        const m = `[${nhan}] ${t}: ${e instanceof Error ? e.message : e}`;
        loi.push(m); console.warn('  ' + m);
        khoi.push(`\n_(không sinh được ${t} — ${m})_\n`);
      }
      luu();
    }
  }

  luu();
  console.log(`\nghi: ${tepRa}`);
  if (loi.length) {
    console.log(`\n${loi.length} mục lỗi:`);
    loi.forEach((l) => console.log('  - ' + l));
  }
}

void chay();
