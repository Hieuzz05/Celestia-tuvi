/**
 * Chạy lại toàn bộ phần luận giải của một tài khoản — npx tsx scripts/chay-lai-luan-giai.ts [email]
 *
 * Khác `test-be-mat-ai.ts`: script kia gọi thẳng lớp sinh trên một lá số bịa và
 * cố ý KHÔNG đụng bộ nhớ đệm. Script này làm ngược lại — nó lấy lá số thật đã
 * lưu của tài khoản, XOÁ các bản đã cất, rồi sinh lại qua đúng `layHoacSinh`
 * mà tuyến API dùng. Nên khi mở trang lên là thấy đúng những bài in ra ở đây,
 * không phải một lượt sinh khác.
 *
 * Cần có để làm gì: nội dung AI cất theo kỳ. Đổi prompt hay đổi cấu trúc trả về
 * mà không xoá bản cũ thì trang vẫn hiện bài cũ cho tới hết kỳ — một bản luận
 * chỉ đổi sau nhiều tháng là không kiểm chứng được gì.
 */

import { readFileSync } from 'node:fs';
import type { GioiTinh } from '../lib/tuvi/ansao';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

/*
 * Không truyền email thì lấy cả danh sách quản trị trong ADMIN_EMAILS.
 *
 * Email không nằm ở bảng `profiles` mà ở `auth.users` — `profiles` chỉ giữ tên
 * hiển thị và lá số mặc định. Nên phải hỏi qua Admin API chứ không select được.
 */
const EMAILS = (process.argv[2] ?? process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function inKhoi(nhan: string, than: Record<string, string>) {
  console.log(`\n--- ${nhan} ---`);
  for (const [k, v] of Object.entries(than)) {
    if (!v) continue;
    console.log(`  [${k}] ${v}`);
  }
}

async function main() {
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { lapLaSo, cungDaiVan } = await import('../lib/tuvi/ansao');
  const { luanHan } = await import('../lib/tuvi/luan-han');
  const { tuoiAmTaiNam } = await import('../lib/tuvi/hanh-trinh');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { bamLaSo } = await import('../lib/rag/nhat-ky');
  const { layHoacSinh, kyTheoNgay, kyTheoThangAm } = await import('../lib/rag/noi-dung-ai');
  const { sinhDiemNoiBat, sinhNhipHanhTrinh } = await import('../lib/rag/be-mat-ngan');
  const { sinhBangLinhVuc } = await import('../lib/rag/bang-linh-vuc');

  const sb = taoSupabaseAdmin();
  if (!sb) throw new Error('Thiếu cấu hình Supabase admin');

  if (!EMAILS.length) throw new Error('Không có email nào — đặt ADMIN_EMAILS hoặc truyền tham số');

  const { data: dsUser, error: loiUser } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (loiUser) throw new Error(`Không đọc được danh sách tài khoản: ${loiUser.message}`);

  const tenTheoId = new Map<string, string>();
  for (const u of dsUser.users) {
    const e = (u.email ?? '').toLowerCase();
    if (EMAILS.includes(e)) tenTheoId.set(u.id, e);
  }
  if (!tenTheoId.size) throw new Error(`Không thấy tài khoản nào khớp: ${EMAILS.join(', ')}`);

  const { data: cacLaSo, error: loiLaSo } = await sb
    .from('charts')
    .select('id, user_id, ho_ten, ngay, thang, nam, gio, gioi_tinh')
    .in('user_id', [...tenTheoId.keys()])
    .order('tao_luc', { ascending: true });
  if (loiLaSo) throw new Error(`Không đọc được lá số: ${loiLaSo.message}`);

  if (!cacLaSo?.length) throw new Error(`Các tài khoản ${[...tenTheoId.values()].join(', ')} chưa lưu lá số nào`);
  console.log(`${[...tenTheoId.values()].join(', ')}: ${cacLaSo.length} lá số\n`);

  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();

  for (const c of cacLaSo) {
    const ngay = Number(c.ngay);
    const thang = Number(c.thang);
    const nam = Number(c.nam);
    const gio = Number(c.gio);
    const gioiTinh = (c.gioi_tinh === 'nu' ? 'nu' : 'nam') as GioiTinh;

    const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh, hoTen: c.ho_ten ?? undefined });
    const chartHash = bamLaSo(ngay, thang, nam, gio, gioiTinh);

    console.log('='.repeat(72));
    console.log(
      `${c.ho_ten ?? '(không tên)'} (${tenTheoId.get(c.user_id)}) — ${ngay}/${thang}/${nam} giờ ${gio}, ${gioiTinh}`
    );
    console.log(`chart_hash ${chartHash} · năm xem ${namXem} · tháng âm ${thangXem}`);

    // Xoá bản đã cất của CHÍNH lá số này. Không đụng lá số của người khác.
    const { error: loiXoa, count } = await sb
      .from('noi_dung_ai')
      .delete({ count: 'exact' })
      .eq('chart_hash', chartHash);
    console.log(loiXoa ? `xoá đệm HỎNG: ${loiXoa.message}` : `xoá ${count ?? 0} bản đã cất`);

    // 1. Điểm nổi bật — trang Hôm nay và thẻ dẫn đầu trang Lá số
    const dnb = await layHoacSinh(
      { chartHash, beMat: 'diem-noi-bat', khoaKy: kyTheoNgay(), ngonNgu: 'vi' },
      async () => {
        const r = await sinhDiemNoiBat({ laSo, namXem, thangXem });
        return r ? { noiDung: r.noiDung, provider: r.provider, model: r.model, phienBan: r.phienBan } : null;
      }
    );
    if (dnb) inKhoi('Điểm nổi bật', dnb.noiDung as unknown as Record<string, string>);
    else console.log('\n--- Điểm nổi bật --- KHÔNG SINH ĐƯỢC');

    // 2. Bảng 8 lĩnh vực trang Lá số
    const blv = await layHoacSinh(
      { chartHash, beMat: 'bang-linh-vuc', khoaKy: `nam:${namXem}`, ngonNgu: 'vi' },
      async () => {
        const r = await sinhBangLinhVuc({ laSo, namXem, thangXem });
        return r ? { noiDung: r.noiDung, provider: r.provider, model: r.model, phienBan: r.phienBan } : null;
      }
    );
    if (blv) {
      // KhoiAi[]: { id, ketLuan, doan[] } — mảng, không phải object theo id
      const b = blv.noiDung as { id: string; ketLuan: string; doan: string[] }[];
      inKhoi(
        'Bảng 8 lĩnh vực',
        Object.fromEntries(b.map((o) => [o.id, `${o.ketLuan} || ${o.doan.join(' ')}`]))
      );
    } else console.log('\n--- Bảng 8 lĩnh vực --- KHÔNG SINH ĐƯỢC');

    // 3. Luận hạn chi tiết, cả ba cấp — đây là chỗ sáu ô lĩnh vực vừa đổi
    const giaiDoan = cungDaiVan(laSo, tuoiAmTaiNam(laSo, namXem));
    const caps = [
      {
        cap: 'giai-doan' as const,
        khoaKy: `giai-doan:${giaiDoan?.daiVan?.tuTuoi ?? '?'}-${giaiDoan?.daiVan?.denTuoi ?? '?'}`,
      },
      { cap: 'nam' as const, khoaKy: `nam:${namXem}` },
      { cap: 'thang' as const, khoaKy: kyTheoThangAm(namXem, thangXem) },
    ];

    for (const { cap, khoaKy } of caps) {
      const bai = luanHan(laSo, cap, namXem, thangXem, 'vi');
      const kq = await layHoacSinh(
        { chartHash, beMat: 'luan-han-chi-tiet', khoaKy, ngonNgu: 'vi' },
        async () => {
          const r = await sinhNhipHanhTrinh({
            laSo,
            cap,
            namXem,
            thangXem,
            nhip: bai.nhip.nhan,
            linhVuc: bai.linhVuc.map((lv) => ({
              id: lv.id,
              nhan: lv.nhan,
              cung: lv.cung,
              cham: lv.cham,
              thuan: lv.thuan,
              can: lv.can,
            })),
          });
          return r ? { noiDung: r.noiDung, provider: r.provider, model: r.model, phienBan: r.phienBan } : null;
        }
      );

      if (!kq) {
        console.log(`\n--- Luận hạn ${cap} --- KHÔNG SINH ĐƯỢC (trang lùi về khuôn câu)`);
        continue;
      }
      const n = kq.noiDung as {
        dangMo: { tieuDe: string; noiDung: string };
        dangCang: { tieuDe: string; noiDung: string };
        canCho: { tieuDe: string; noiDung: string };
        ghepLai: string;
        linhVuc?: Record<string, string>;
      };
      inKhoi(`Luận hạn ${cap} — nhịp "${bai.nhip.nhan}"`, {
        'Đang mở ra': `${n.dangMo.tieuDe}: ${n.dangMo.noiDung}`,
        'Đang căng': `${n.dangCang.tieuDe}: ${n.dangCang.noiDung}`,
        'Cần chờ': `${n.canCho.tieuDe}: ${n.canCho.noiDung}`,
        'Nếu ghép lại': n.ghepLai,
      });
      console.log(`  Luận theo lĩnh vực — model viết ${Object.keys(n.linhVuc ?? {}).length}/6 ô:`);
      for (const lv of bai.linhVuc) {
        const tuAi = n.linhVuc?.[lv.id];
        console.log(`    ${tuAi ? 'AI ' : 'khuôn'} · ${lv.nhan}: ${tuAi ?? lv.cau}`);
      }
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log('Xong. Mở lại trang là thấy đúng những bài trên.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
