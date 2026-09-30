import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { docNhieuTheoTienTo, docNoiDung, docNoiDungMoiNhat, luuNoiDung } from '@/lib/rag/noi-dung-ai';
import { laKhach, xinLuotLaSoMoi } from '@/lib/auth/gioi-han-khach';
import { phienBanKho } from '@/lib/rag/tai-lieu-meta';
import { docThuVien } from '@/lib/rag/thu-vien/kho';
import { xuLyLuanGiaiV3, type BodyV3, type MoiTruongV3 } from '@/lib/rag/v3/xu-ly';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';

export const maxDuration = 60;

/**
 * Luận giải v3 — MỘT NHÓM câu hỏi mỗi lượt gọi: "tong-quan" (11 câu) hoặc một
 * chủ đề chuyên sâu ("su-nghiep", "tien-bac"…). Các câu trong nhóm chạy song
 * song, mỗi câu độc lập, nên hết giờ chỉ mất đúng câu ấy.
 *
 * Toàn bộ logic (đệm, thế hệ đệm THE_HE_DEM, thư viện, sổ ý, tóm lại, bức tranh
 * lớn) nằm ở `lib/rag/v3/xu-ly.ts` (30/09/2026). Route chỉ nối MÔI TRƯỜNG thật:
 * đệm là bảng noi_dung_ai, cổng đăng nhập, hạn mức khách. `scripts/test-luan-giai-v3.ts`
 * gọi đúng hàm ấy với đệm trong bộ nhớ — không có nhánh riêng cho sản phẩm. Đó là
 * điều kiện để con số đo được ở bộ thử là con số người dùng nhận.
 *
 * QUYỀN — chủ dự án chốt 23/09/2026:
 *   - Tổng quan mở cho cả khách chưa đăng nhập (kể cả khi phải gọi model).
 *   - Chuyên sâu cần đăng nhập.
 *   - KHÔNG trừ hạn mức ở cả hai. Bài đã đệm theo lá số + năm + nhóm, nên mở
 *     lại không tốn thêm lượt gọi nào.
 *   - Khách chưa đăng nhập: tối đa LA_SO_MOI_MOI_NGAY lá số PHẢI VIẾT MỚI mỗi
 *     IP mỗi ngày (26/09/2026, gioi-han-khach.ts). Lá số đã có bài thì không đếm.
 */
export async function POST(req: Request) {
  let body: BodyV3;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không phải JSON hợp lệ' }, { status: 400 });
  }
  const moiTruong: MoiTruongV3 = {
    dem: { doc: docNoiDung, luu: luuNoiDung, docMoiNhat: docNoiDungMoiNhat, docNhieu: docNhieuTheoTienTo },
    canDangNhap: async (lyDo) => {
      const cong = await canDangNhap(lyDo);
      return cong.duocPhep ? null : cong.chan!;
    },
    laKhach,
    xinLuotLaSoMoi: (chartHash) => xinLuotLaSoMoi(req, chartHash),
    phienBanKho,
    docThuVien,
    // Viết lại cưỡng bức (body.vietLai) — kiểm quyền ở máy chủ, nút ẩn ở giao diện không phải phân quyền
    quanTri: async () => {
      const cong = await canQuanTri();
      return cong.duocPhep ? cong.actor : null;
    },
    ghiVet: async (hanhDong, chiTiet) => {
      const cong = await canQuanTri();
      await ghiNhatKyQuanTri(hanhDong, 'luan-giai-v3', String(chiTiet.khoaKy ?? ''), cong.duocPhep ? cong.actor : {}, chiTiet);
    },
  };
  const kq = await xuLyLuanGiaiV3(body, moiTruong);
  if ('traThang' in kq) return kq.traThang;
  return NextResponse.json(kq.json, { status: kq.status });
}
