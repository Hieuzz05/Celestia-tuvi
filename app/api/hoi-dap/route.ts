import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canDangNhap } from '@/lib/auth/cong';
import { chotCauHoi, datChoCauHoi, hoanCauHoi } from '@/lib/support/quota';
import { quyenHienTai } from '@/lib/support/entitlements';
import { KhongCoModelError } from '@/lib/ai/fallback';
import type { TinNhan } from '@/lib/ai/prompt';
import { bamLaSo, ghiVetTraLoi } from '@/lib/rag/nhat-ky';
import { traLoiCoCanCu } from '@/lib/rag/tra-loi';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { laNgayDuongCoThat } from '@/lib/tuvi/kiem-ngay';

export const maxDuration = 60;

interface Body {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  hoTen?: string;
  namXem?: number;
  thangXem?: number;
  cauHoi?: string;
  lichSu?: TinNhan[];
  /** Câu hỏi này đến từ chip gợi ý (goiYTiep) do chính Celes vừa đề xuất ở lượt trước */
  tuChip?: boolean;
}

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  // Ẩn nút ở giao diện không phải phân quyền — chặn thật phải ở đây
  const cong = await canDangNhap('ask_celes');
  if (!cong.duocPhep) return cong.chan!;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  if (
    !laNgayDuongCoThat(body.ngay, body.thang, body.nam) ||
    !soHopLe(body.ngay, 1, 31) ||
    !soHopLe(body.thang, 1, 12) ||
    !soHopLe(body.nam, 1900, 2100) ||
    !soHopLe(body.gio, 0, 23) ||
    (body.gioiTinh !== 'nam' && body.gioiTinh !== 'nu')
  ) {
    return NextResponse.json({ loi: 'Thông tin ngày giờ sinh không hợp lệ' }, { status: 400 });
  }

  const cauHoi = body.cauHoi?.trim();
  if (!cauHoi) return NextResponse.json({ loi: 'Chưa nhập câu hỏi' }, { status: 400 });
  if (cauHoi.length > 800) {
    return NextResponse.json({ loi: 'Câu hỏi quá dài (tối đa 800 ký tự)' }, { status: 400 });
  }

  /*
   * Lịch sử đến từ client nên phải lọc lại: chỉ nhận đúng hình dạng mong đợi và
   * cắt bớt độ dài, tránh việc nhét nội dung tuỳ ý vào prompt.
   *
   * TRẦN 60 (30 lượt hỏi–đáp), không phải 10 — sửa 27/09/2026 theo yêu cầu "kéo
   * dài ghi nhớ, không chỉ vài ba lượt". Nâng trần này an toàn về chi phí vì
   * mảng đầy đủ không bao giờ bị dán thẳng vào prompt: `chonBoiCanhHoiThoai`
   * (tiep-noi.ts) chỉ trích ra
   *   (a) MẠCH VỪA NÓI — luôn bị cắt còn tối đa 3 cặp gần nhất, bất kể mảng vào
   *       dài bao nhiêu, và
   *   (b) ĐIỀU NGƯỜI ĐỌC TỰ KỂ — quét bằng luật (không gọi model), giữ tối đa
   *       vài câu ngắn gần nhất, bất kể quét qua bao nhiêu tin nhắn.
   * Nâng trần chỉ nới ĐỘ SÂU của việc quét (b) — một chuyện đã kể từ hai mươi
   * lượt trước vẫn được nhớ — mà không làm phần dán nguyên văn ở (a) phình ra.
   */
  const lichSu: TinNhan[] = Array.isArray(body.lichSu)
    ? body.lichSu
        .filter(
          (t): t is TinNhan =>
            !!t &&
            (t.vaiTro === 'nguoi-dung' || t.vaiTro === 'tro-ly') &&
            typeof t.noiDung === 'string'
        )
        .slice(-60)
        .map((t) => ({ vaiTro: t.vaiTro, noiDung: t.noiDung.slice(0, 2000) }))
    : [];

  const namXem = soHopLe(body.namXem, 1900, 2100) ? body.namXem! : new Date().getFullYear();
  // Tháng ÂM, không phải tháng dương — xem lib/tuvi/bay-gio.ts
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : thangAmHienTai();

  const laSo = lapLaSo({
    ngay: body.ngay!,
    thang: body.thang!,
    nam: body.nam!,
    gio: body.gio!,
    gioiTinh: body.gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  // Đặt chỗ NGAY TRƯỚC khi gọi model: câu thứ 6 không được phép chạm tới nhà
  // cung cấp. Kiểm ở React không tính là chặn — ai cũng gọi thẳng endpoint được.
  const requestId = randomUUID();
  const cho = await datChoCauHoi(requestId);
  if (!cho.duocPhep) return cho.chan!;

  try {
    const chartHash = bamLaSo(
      body.ngay!,
      body.thang!,
      body.nam!,
      body.gio!,
      body.gioiTinh as string
    );

    const kq = await traLoiCoCanCu({
      laSo,
      cauHoi,
      namXem,
      thangXem,
      lichSu,
      laTiepTuChip: body.tuChip === true,
      requestId,
      // Để Celes biết bảng tám lĩnh vực đã nói gì với chính người này
      chartHash,
    });

    // Ghi vết trước khi rẽ nhánh: nhật ký hỏng không được làm mất dấu vết để chẩn đoán sau này,
    // dù lượt này có chốt hay hoàn lại.
    await ghiVetTraLoi({
      requestId,
      chartHash,
      cauHoi,
      runId: kq.runId,
      phienBan: kq.phienBan,
      provider: kq.provider,
      model: kq.model,
      doTreMs: kq.doTreMs.tong,
      kiemDuyet: kq.kiemDuyet ?? undefined,
    });

    /*
     * MODEL TRẢ JSON GÃY hoặc BÀI TRỐNG NGHĨA (27/09/2026 — rà thấy khi kiểm hội thoại dài).
     *
     * `traLoiCoCanCu` cố ý trả `van: ''` khi văn bản thô trông như JSON nhưng đọc không được
     * (xem lib/rag/doc-json.ts::laChuoiJson) — lý do là một khối JSON dở dang còn tệ hơn không có
     * gì. Nhưng route này trước đây ship thẳng chuỗi rỗng đó cho người đọc như một câu trả lời
     * bình thường (HTTP 200): người dùng thấy một bong bóng chat TRẮNG, không có chip, không có
     * lỗi, không có cách hỏi lại — và lượt hỏi của họ vẫn bị trừ.
     *
     * Coi đây là một lượt gọi HỎNG, giống hệt nhánh lỗi ở catch bên dưới: trả lại lượt (không gọi
     * `chotCauHoi`, không đánh dấu thành công), rồi trả lỗi để giao diện hiện đúng chỗ retry.
     * Đo lại (27/09/2026): không tái hiện được bằng cách lặp lại đúng bối cảnh 6 lần — đây là một
     * lần hỏng hiếm ở phía model, không phải lỗi cấu trúc; nhưng đường lùi này vẫn cần có, vì lần
     * hỏng kế tiếp — hiếm tới đâu — không được phép lại là một bong bóng trắng im lặng.
     */
    if (!kq.van) {
      await hoanCauHoi(cho.nguon, requestId);
      return NextResponse.json(
        { loi: 'Celes chưa trả lời được câu này. Bạn hỏi lại giúp.', chuaTraLoiDuoc: true },
        { status: 502 }
      );
    }

    await chotCauHoi(requestId, `${kq.provider}/${kq.model}`);

    /*
     * "Muốn biết vì sao không?" giờ CHỈ dành cho quản trị.
     *
     * Nó là công cụ đối soát: xem engine lấy dữ kiện nào, nối ra sao, mức chắc
     * chắn tới đâu. Với người dùng thường nó là nhiễu — và tệ hơn, dòng phương
     * pháp "celestia-nam-phai v2026.09.1" nằm cạnh các dữ kiện khiến người đọc
     * tưởng đó là tên một cuốn sách trong kho. Nó không phải: đó là phiên bản
     * bộ quy tắc AN SAO, ghi lại lá số được tính bằng luật nào.
     *
     * Chặn ở MÁY CHỦ chứ không ẩn ở giao diện: ẩn ở giao diện thì dữ liệu vẫn
     * nằm nguyên trong phản hồi, mở tab Network là đọc được.
     */
    const laQuanTri = (await quyenHienTai()).tier === 'admin';

    return NextResponse.json({
      traLoi: kq.van,
      model: `${kq.provider}/${kq.model}`,
      /*
       * Chip gợi ý cho lượt sau — gửi cho MỌI bậc quyền, khác với canCu.
       *
       * Nó không phải provenance: không tên tài liệu, không mã đoạn, không hệ
       * phái. Nó chỉ là vài câu người dùng có thể hỏi tiếp, và đó chính là thứ
       * biến một câu trả lời cụt thành một cuộc nói chuyện.
       */
      goiYTiep: kq.coCauTruc?.goiYTiep ?? [],
      /*
       * Lối đi tiếp — dựng từ bảng tra ở máy chủ, giao diện chỉ vẽ.
       *
       * Trả ra riêng chứ không nhét vào `traLoi`: nó là điều hướng, không phải
       * nội dung. Nằm trong bài markdown thì người đọc vấp vào hai cái liên kết
       * ngay giữa những câu Celes vừa nói.
       */
      loiDi: kq.loiDi,
      canCu: !laQuanTri ? undefined : {
        duKien: kq.goi.duKien.map((f) => ({ id: f.id, noiDung: f.noiDung })),
        cachNoi: kq.coCauTruc?.cachNoi ?? null,
        luongNguoc: (kq.coCauTruc?.yChinh ?? [])
          .map((y) => y.luongNguoc)
          .filter((x): x is string => !!x),
        mucChacChan: (kq.coCauTruc?.yChinh ?? []).map((y) => ({
          tieuDe: y.tieuDe,
          muc: y.mucChacChan ?? null,
        })),
        chuDe: kq.goi.chuDe,
        cungLienQuan: kq.goi.cungLienQuan,
        phuongPhap: `${kq.phienBan.engine} v${kq.phienBan.phuongPhap}`,
        coNguon: kq.goi.bangChung.length > 0,
        /*
         * Đoạn tri thức thật sự đã đưa vào prompt — chỉ quản trị mới nhận.
         *
         * Đây là thứ duy nhất trả lời được câu "Celes lấy cái này từ đâu". Thiếu
         * nó thì phần căn cứ chỉ nói được lá số có gì, còn nửa kia của câu trả
         * lời — phần đến từ sách — vẫn là hộp đen.
         *
         * Cắt nội dung ở 600 ký tự: đủ để đối chiếu xem đoạn có đúng chỗ không,
         * mà không biến mỗi lượt chat thành một phản hồi vài chục KB.
         */
        nguon: kq.goi.bangChung.map((e) => ({
          ma: e.id,
          maTaiLieu: e.maTaiLieu,
          tieuDe: e.tieuDe,
          duongDeMuc: e.duongDeMuc,
          hePhai: e.hePhai,
          mucTinCay: e.mucTinCay,
          trich: e.noiDung.replace(/\s+/g, ' ').slice(0, 600),
        })),
      },
    });
  } catch (e) {
    // Hỏng ở phía nhà cung cấp là lỗi của hệ thống, không phải của người dùng —
    // trả lại lượt vừa trừ.
    await hoanCauHoi(cho.nguon, requestId);
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi khi gọi AI' },
      { status: 502 }
    );
  }
}
