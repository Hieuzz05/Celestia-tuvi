/**
 * Thử toàn tuyến kho tri thức trên database thật — npx tsx scripts/test-rag-toan-tuyen.ts
 *
 * Nạp một tài liệu THỬ, xuất bản, truy hồi, hỏi model, rồi **xoá sạch tài liệu
 * đó**. Mục đích là chứng minh cả đường đi chạy được, không phải để lại nội dung
 * trong kho — tài liệu do máy sinh ra mà nằm lại trong corpus thì mọi câu trả
 * lời sau đó đều mất nguồn gốc.
 *
 * Tốn quota embedding + một lượt gọi model. Chạy khi vừa dựng kho hoặc vừa đổi
 * schema, đừng chạy trong vòng lặp.
 */

import { readFileSync } from 'node:fs';

for (const dong of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const sach = dong.trim();
  if (!sach || sach.startsWith('#')) continue;
  const [khoa, ...phan] = sach.split('=');
  const giaTri = phan.join('=').trim();
  if (giaTri) process.env[khoa.trim()] = giaTri;
}

// Nội dung thử: cố ý ghi rõ là tài liệu kiểm thử ngay trong chữ, để nếu vì lý do
// nào đó nó sót lại trong kho thì người đọc nhận ra ngay.
const TAI_LIEU_THU = `## Tài liệu kiểm thử hệ thống — không phải nguồn tử vi

Đây là văn bản dùng để kiểm tra đường đi của kho tri thức Celestia. Nội dung bên
dưới chỉ nhằm tạo ra các đoạn có chứa tên sao và tên cung để kiểm tra việc cắt
đoạn, nhận dạng thực thể và truy hồi. Không được dùng làm căn cứ luận giải.

## Ghi chú kiểm thử về cung Quan Lộc

Cung Quan Lộc là cung phản ánh công việc và đường công danh. Khi xét cung Quan
Lộc, người xem thường nhìn thêm cung Mệnh để biết cách vận hành của đương số, và
cung Thiên Di để biết cơ hội đến từ bên trong hay bên ngoài. Đoạn này tồn tại để
kiểm tra việc truy hồi theo chủ đề sự nghiệp, không mang giá trị học thuyết.

## Ghi chú kiểm thử về Hóa Kỵ

Hóa Kỵ là một trong bốn sao Tứ Hóa. Đoạn văn này nhắc tới Hóa Kỵ và cung Quan Lộc
cùng lúc để kiểm tra xem nhánh tìm theo từ khoá có bắt đúng cụm từ chính xác hay
không, trong khi nhánh vector bắt theo ngữ nghĩa. Đây là dữ liệu kiểm thử.

## Ghi chú kiểm thử về Thiên Riêu

Thiên Riêu là một phụ tinh. Đoạn này tồn tại để kiểm tra trường hợp tên sao hiếm,
vốn là chỗ mà tìm kiếm thuần vector hay nhầm sang các sao có tên gần giống. Nội
dung không có giá trị luận giải.`;

async function main() {
  const { dongBoTuDienThucThe, napTaiLieu } = await import('../lib/rag/nap-tai-lieu');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { lapKeHoach } = await import('../lib/rag/planner');
  const { truyHoi } = await import('../lib/rag/truy-hoi');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { lapLaSo } = await import('../lib/tuvi/ansao');

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    console.log('DUNG: chua co SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }

  let sai = 0;
  const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
    if (!ok) sai += 1;
    console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
  };

  console.log('\n== 1. ĐỒNG BỘ TỪ ĐIỂN THỰC THỂ ==');
  await dongBoTuDienThucThe();
  const { count: soThucThe } = await supabase
    .from('knowledge_entities')
    .select('*', { count: 'exact', head: true });
  kiem(`Bảng knowledge_entities có ${soThucThe} mục`, (soThucThe ?? 0) > 100, soThucThe);

  console.log('\n== 2. NẠP TÀI LIỆU THỬ ==');
  const nap = await napTaiLieu({
    tieuDe: '[KIỂM THỬ] Tài liệu tự động — xoá sau khi chạy',
    noiDung: TAI_LIEU_THU,
    hePhai: 'chung',
    loaiNguon: 'noi-bo',
    mucTinCay: 'ho-tro',
    phienBan: `test-${Date.now()}`,
  });
  kiem(`Cắt được ${nap.soDoan} đoạn`, nap.soDoan >= 3, nap.soDoan);
  kiem(`Nhận ra ${nap.soThucThe} thực thể`, nap.soThucThe >= 3, nap.soThucThe);
  if (nap.canhBao.length) console.log('     cảnh báo:', nap.canhBao.join(' | '));

  const donDep = async () => {
    await supabase.from('knowledge_documents').delete().eq('id', nap.documentId);
  };

  try {
    console.log('\n== 3. CHƯA XUẤT BẢN THÌ KHÔNG ĐƯỢC TRUY HỒI ==');
    const keHoach = lapKeHoach({ cauHoi: 'Hóa Kỵ ở cung Quan Lộc thì đọc thế nào?' });
    const truoc = await truyHoi(keHoach);
    kiem('Truy hồi không trả về đoạn nào', truoc.ungVien.length === 0, truoc.ungVien.length);

    console.log('\n== 4. XUẤT BẢN ==');
    const { error: loiXb } = await supabase.rpc('xuat_ban_phien_ban', {
      p_version_id: nap.versionId,
      p_actor: null,
    });
    kiem('Gọi được hàm xuất bản', !loiXb, loiXb?.message);

    console.log('\n== 5. TRUY HỒI SAU KHI XUẤT BẢN ==');
    const sau = await truyHoi(keHoach);
    kiem(`Có ${sau.ungVien.length} ứng viên`, sau.ungVien.length > 0, sau.ungVien.length);
    kiem('Nhánh vector có kết quả', sau.ungVien.some((u) => u.hangVector), '');
    kiem('Nhánh từ khoá có kết quả', sau.ungVien.some((u) => u.hangTuKhoa), '');
    kiem(
      'Đoạn được cả hai nhánh xếp hạng cao nhất',
      sau.daChon.length > 0 && sau.daChon[0].diemRRF > 0,
      sau.daChon[0]?.diemRRF
    );
    for (const u of sau.ungVien) {
      console.log(
        `     RRF ${u.diemRRF.toFixed(5)} | vector #${u.hangVector ?? '—'} (${u.diemVector?.toFixed(3) ?? '—'}) | từ khoá #${u.hangTuKhoa ?? '—'} | ${u.duongDeMuc ?? '(không đề mục)'}`
      );
    }

    console.log('\n== 6. LỌC THEO THỰC THỂ ==');
    const loc = await truyHoi(keHoach, { locThucThe: true });
    kiem('Lọc theo thực thể vẫn ra kết quả', loc.ungVien.length > 0, loc.ungVien.length);

    console.log('\n== 7. HỎI MODEL VỚI NGUỒN THẬT ==');
    const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
    const kq = await traLoiCoCanCu({
      laSo,
      cauHoi: 'Hóa Kỵ ở cung Quan Lộc thì đọc thế nào?',
      namXem: 2026,
      thangXem: 9,
      requestId: `test-${Date.now()}`,
    });
    kiem(`Gói bằng chứng có ${kq.goi.bangChung.length} nguồn`, kq.goi.bangChung.length > 0, kq.goi.bangChung.length);
    kiem('Model trả về JSON đọc được', kq.coCauTruc !== null);
    kiem('Có ghi nhật ký truy hồi', kq.runId !== null, kq.runId);
    if (kq.coCauTruc) {
      const coNguon = kq.coCauTruc.yChinh.filter((y) => y.maNguon.length > 0).length;
      console.log(`     ${coNguon}/${kq.coCauTruc.yChinh.length} ý có trích mã nguồn E###`);
    }
    if (kq.kiemDuyet) {
      console.log(`     kiểm duyệt: ${kq.kiemDuyet.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'} · phủ sóng nguồn ${(kq.kiemDuyet.phuSong * 100).toFixed(0)}%`);
      for (const l of kq.kiemDuyet.loi) console.log(`       [${l.mucDo}] ${l.ma}`);
    }

    console.log('\n== 8. NHẬT KÝ ĐÃ GHI ==');
    const { count: soRun } = await supabase
      .from('retrieval_runs')
      .select('*', { count: 'exact', head: true });
    const { count: soKq } = await supabase
      .from('retrieval_results')
      .select('*', { count: 'exact', head: true });
    kiem(`retrieval_runs có ${soRun} dòng`, (soRun ?? 0) > 0, soRun);
    kiem(`retrieval_results có ${soKq} dòng`, (soKq ?? 0) > 0, soKq);
  } finally {
    console.log('\n== 9. DỌN DẸP ==');
    await donDep();
    const { count } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true })
      .eq('id', nap.documentId);
    kiem('Đã xoá tài liệu thử khỏi kho', (count ?? 0) === 0, count);
    const { count: conDoan } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', nap.documentId);
    kiem('Đoạn cũng bị xoá theo (cascade)', (conDoan ?? 0) === 0, conDoan);
  }

  console.log(sai === 0 ? '\nTOÀN TUYẾN CHẠY ĐÚNG\n' : `\n${sai} BƯỚC SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main();
