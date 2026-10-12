import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canDangNhap } from '@/lib/auth/cong';
import { chotCauHoi, datChoCauHoi, hoanCauHoi } from '@/lib/support/quota';
import { quyenHienTai } from '@/lib/support/entitlements';
import { KhongCoModelError } from '@/lib/ai/fallback';
import type { TinNhan } from '@/lib/ai/prompt';
import { bamLaSo, ghiVetTraLoi, veGioLaSo } from '@/lib/rag/nhat-ky';
import {
  doAnToan,
  GOI_Y_TIEN_LUONG,
  LOI_NHAN_KHAN_CAP,
  LOI_NHAN_TIEN_LUONG,
  SO_KHAN_CAP,
} from '@/lib/rag/an-toan';
import { traLoiCoCanCu } from '@/lib/rag/tra-loi';
import { chonNgonNgu, COOKIE_NGON_NGU } from '@/lib/rag/focused/ngon-ngu';
import type { KetQuaFocused } from '@/lib/rag/focused/tra-loi-focused';
import { ghiVetPreview } from '@/lib/rag/focused/vet';
import { bam16, docMetaLuot } from '@/lib/rag/focused/hieu-cau';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { namAmHienTai, thangAmHienTai } from '@/lib/tuvi/bay-gio';
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
  /** Ngôn ngữ giao diện ('vi' | 'en') — câu do mã viết ở đường Focused theo nó */
  ngonNgu?: string;
  /** MetaLuot ký HMAC của lượt trợ lý trước (đường Focused, spec 2.3). Sai hình dạng → bỏ */
  luotTruoc?: unknown;
}

/** Đọc một cookie từ header thô — route này không dùng gì khác của cookie. */
function docCookie(req: Request, ten: string): string | null {
  for (const phan of (req.headers.get('cookie') ?? '').split(';')) {
    const i = phan.indexOf('=');
    if (i > 0 && phan.slice(0, i).trim() === ten) {
      try {
        return decodeURIComponent(phan.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
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

  /*
   * LỚP AN TOÀN — ĐỨNG TRƯỚC `datChoCauHoi`, CỐ Ý.
   *
   * Thứ tự ở đây là cả quyết định, không phải sắp xếp cho gọn. Người đang
   * khủng hoảng mà rơi vào nhánh này thì:
   *
   *   1. KHÔNG bị trừ một trong năm lượt hỏi miễn phí của ngày. Mất một lượt
   *      vì nói ra điều khó nói nhất là một cách trừng phạt, và tệ hơn nữa là
   *      họ có thể gặp cổng "hết lượt" ở đúng lần sau.
   *   2. KHÔNG sinh ra lượt gọi nhà cung cấp nào. `doAnToan` tất định, chạy
   *      cục bộ — nên nhánh này không tốn gì và không hỏng khi quota API cạn.
   *
   * CRITICAL thì DỪNG HẲN luồng luận Tử Vi. Không luận rồi nối lời miễn trừ
   * vào cuối: một bài tám trăm chữ về cung Mệnh kèm một dòng "hãy gọi 115" đọc
   * ra đúng cái nó là — tự bảo vệ về pháp lý, không phải quan tâm tới người
   * đọc. SENSITIVE thì vẫn luận bình thường, chỉ bảo đảm có lời miễn trừ.
   */
  const anToan = doAnToan(cauHoi);
  if (anToan.muc === 'CRITICAL') {
    return NextResponse.json({
      traLoi: LOI_NHAN_KHAN_CAP,
      /*
       * Lối đi tiếp phải là đường ra khỏi tình huống, không phải đường quay
       * lại lá số. "Xem vận hạn" ở đây là câu trả lời sai cho câu hỏi thật.
       *
       * CHỈ MỘT NÚT, và là 115. Số 111 nằm trong phần chữ chứ không thành nút,
       * vì hệ thống KHÔNG biết tuổi người hỏi: một nút "Tổng đài Bảo vệ Trẻ em"
       * hiện ra trước mặt người bốn mươi tuổi là lời khuyên sai địa chỉ, mà nút
       * thì không mang theo được câu điều kiện "nếu bạn dưới 16 tuổi" như câu
       * văn mang được. Hai nút cạnh nhau cũng bắt người đang hoảng phải chọn.
       */
      loiDi: [{ nhan: `Gọi ${SO_KHAN_CAP.capCuu}`, duong: `tel:${SO_KHAN_CAP.capCuu}` }],
      // Không chip gợi ý: mời hỏi tiếp về lá số là kéo người ta trở lại đúng
      // chỗ vừa quyết định không đi.
      goiYTiep: [],
      anToan: true,
    });
  }

  /*
   * Câu hỏi tiên lượng ("bố tôi bị ung thư, năm nay có qua khỏi không"): trả
   * câu do mã viết, không luận. Lá số không được dùng để đoán một người sống
   * hay chết — kể cả kèm lời miễn trừ. Cùng lý do với nhánh CRITICAL ở trên:
   * không trừ lượt, không gọi model. Chip mở về phần người hỏi tự lo được.
   */
  if (anToan.tienLuong) {
    return NextResponse.json({
      traLoi: LOI_NHAN_TIEN_LUONG,
      goiYTiep: GOI_Y_TIEN_LUONG,
    });
  }

  // Năm ÂM, cùng luật với tháng bên dưới. Năm dương thì từ 01/01 đến Tết web
  // đọc sang lưu niên năm sau, còn app (vốn gửi năm âm) vẫn đọc năm cũ — cùng
  // một lá số, hai câu trả lời.
  const namXem = soHopLe(body.namXem, 1900, 2100) ? body.namXem! : namAmHienTai();
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

    // Meta lượt trước: giới hạn cỡ + kiểm hình dạng ở đây; chữ ký và ràng buộc kiểm ở Focused.
    // Không đi vào lichSu. Ràng buộc người dùng bằng mã băm, không đưa userId thô vào meta.
    const luotTruoc =
      body.luotTruoc && JSON.stringify(body.luotTruoc).length <= 4000 ? docMetaLuot(body.luotTruoc) : null;

    const kq = await traLoiCoCanCu({
      laSo,
      cauHoi,
      ...(luotTruoc ? { luotTruoc } : {}),
      nguoiDung: bam16(cong.userId ?? ''),
      namXem,
      thangXem,
      lichSu,
      laTiepTuChip: body.tuChip === true,
      ngonNgu: chonNgonNgu(body.ngonNgu, docCookie(req, COOKIE_NGON_NGU)),
      // Đã đo ở trên, trước khi đặt chỗ — truyền xuống để khỏi đo lại
      mucAnToan: anToan.muc,
      requestId,
      // Để Celes biết bảng tám lĩnh vực đã nói gì với chính người này
      chartHash,
      // …và bài luận giải đã kết luận gì (khoá v3 băm theo giờ lá số)
      chartHashLaSo: bamLaSo(body.ngay!, body.thang!, body.nam!, veGioLaSo(body.gio!), body.gioiTinh as string),
    });

    // Ghi vết trước khi rẽ nhánh: nhật ký hỏng không được làm mất dấu vết để chẩn đoán sau này,
    // dù lượt này có chốt hay hoàn lại.
    // PRIV-01: không ghi câu hỏi, không băm lá số vào ai_requests.
    await ghiVetTraLoi({
      requestId,
      // CEL-195: chủ lượt — API phản hồi 👍👎 chỉ ghi được lên lượt có user_id của chính người bấm
      ...(cong.userId ? { userId: cong.userId } : {}),
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
    // Vết Preview của đường Focused (spec 5.4): chỉ mã và số; Production không bao giờ ghi.
    ghiVetPreview((kq as KetQuaFocused).vetPreview);

    /*
     * Câu phát lại sau hỏi lại "lá số này của ai" (spec 6.1) rơi vào lối an toàn: cùng hai nhánh ở
     * đầu route, chỉ là câu nguy hiểm nằm ở lượt TRƯỚC. Không trừ lượt, không meta.
     */
    const phatLai = (kq as KetQuaFocused).anToanPhatLai;
    if (phatLai) {
      await hoanCauHoi(cho.nguon, requestId);
      return NextResponse.json(
        phatLai === 'CRITICAL'
          ? {
              traLoi: LOI_NHAN_KHAN_CAP,
              loiDi: [{ nhan: `Gọi ${SO_KHAN_CAP.capCuu}`, duong: `tel:${SO_KHAN_CAP.capCuu}` }],
              goiYTiep: [],
              anToan: true,
            }
          : { traLoi: LOI_NHAN_TIEN_LUONG, goiYTiep: GOI_Y_TIEN_LUONG }
      );
    }

    if (!kq.van) {
      await hoanCauHoi(cho.nguon, requestId);
      return NextResponse.json(
        { loi: 'Celes chưa trả lời được câu này. Bạn hỏi lại giúp.', chuaTraLoiDuoc: true },
        { status: 502 }
      );
    }

    // Lá số không có gì để đọc (Focused: trước ngày sinh, chưa hợp tuổi, lệch giới tính) — không tính lượt.
    if (kq.khongTinhLuot) await hoanCauHoi(cho.nguon, requestId);
    else await chotCauHoi(requestId, `${kq.provider}/${kq.model}`);

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
      // CEL-195: khoá cho nút 👍👎 — UUID ngẫu nhiên, máy chủ kiểm chủ lượt khi nhận phản hồi
      requestId,
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
      // Trạng thái lượt (đường Focused, có khoá): client giữ ở sessionStorage, gửi lại lượt sau
      ...((kq as KetQuaFocused).meta ? { meta: (kq as KetQuaFocused).meta } : {}),
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
