'use client';

import Link from 'next/link';
import { CAU_HINH_Y_DINH, type YDinhKetNoi } from '@/lib/ket-noi/y-dinh';

/**
 * Kết quả so hai người.
 *
 * Thứ tự cố ý đảo so với bản cũ: kết luận trước, bảng kỹ thuật sau và đóng sẵn.
 * Bản cũ mở đầu bằng bảng bản mệnh/địa chi/cục — đúng về dữ liệu nhưng sai về
 * thứ người đọc đang cần. Họ tới đây để hiểu một mối quan hệ, không phải để tra
 * bảng; bảng là phần chứng minh, không phải phần trả lời.
 */

export interface MucKetQua {
  id: string;
  tieuDe: string;
  noiDung: string;
  luongNguoc?: string;
}

export interface DuLieuKetNoi {
  yDinh: YDinhKetNoi;
  dangChuY: { tieuDe: string; noiDung: string };
  muc: MucKetQua[];
  cauHoiCuaBan?: { cauHoi: string; traLoi: string };
  canCu: {
    duKien: { id: string; noiDung: string }[];
    cachNoi?: string | null;
    coNguon: boolean;
    phuongPhap: string;
  };
}

export function KetQuaKetNoi({
  duLieu,
  tenA,
  tenB,
  bangKyThuat,
}: {
  duLieu: DuLieuKetNoi;
  tenA: string;
  tenB: string;
  bangKyThuat: React.ReactNode;
}) {
  const cauHinh = CAU_HINH_Y_DINH[duLieu.yDinh];
  const cauHoiTiep = `Nếu hai người ${tenA} và ${tenB} đi tiếp với nhau, điều gì dễ gây khó khăn nhất?`;

  return (
    <section className="flex flex-col gap-[24px]">
      <div>
        <p className="eyebrow">
          {tenA} &amp; {tenB} · {cauHinh.nhan.toUpperCase()}
        </p>
        <h2 className="heading-sm mt-[10px]">{duLieu.dangChuY.tieuDe}</h2>
        <p className="body-text mt-[12px]" style={{ color: 'var(--fg-body)' }}>
          {duLieu.dangChuY.noiDung}
        </p>
      </div>

      <div className="flex flex-col gap-[24px]">
        {duLieu.muc
          .filter((m) => m.noiDung)
          .map((m) => (
            <article key={m.id} className="flex flex-col gap-[8px]">
              <h3 className="subheading">{m.tieuDe}</h3>
              <p className="body-text" style={{ color: 'var(--fg-body)' }}>
                {m.noiDung}
              </p>
              {m.luongNguoc && (
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {m.luongNguoc}
                </p>
              )}
            </article>
          ))}
      </div>

      {duLieu.cauHoiCuaBan && (
        <div
          className="flex flex-col gap-[8px] rounded-[var(--radius-cards)] p-[18px]"
          style={{ background: 'var(--surface-panel)' }}
        >
          <p className="eyebrow">CÂU HỎI CỦA BẠN</p>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {duLieu.cauHoiCuaBan.cauHoi}
          </p>
          <p className="body-text mt-[4px]" style={{ color: 'var(--fg-body)' }}>
            {duLieu.cauHoiCuaBan.traLoi}
          </p>
        </div>
      )}

      {/* Căn cứ: chỉ dữ kiện hai lá số và mạch suy luận. Không tên tài liệu,
          không điểm liên quan — xem ghi chú ở components/CanCu.tsx. */}
      <details className="rounded-[var(--radius-cards)] p-[14px]" style={{ boxShadow: 'var(--shadow-card)' }}>
        <summary className="cursor-pointer text-[13px]" style={{ color: 'var(--fg-muted)' }}>
          Muốn biết vì sao không?
        </summary>
        <div className="mt-[12px] flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <span className="eyebrow">CELES DỰA VÀO ĐÂU</span>
            {duLieu.canCu.duKien.map((d) => (
              <span key={d.id} className="text-[12px] leading-[1.55]" style={{ color: 'var(--fg-muted)' }}>
                {d.noiDung}
              </span>
            ))}
          </div>

          {duLieu.canCu.cachNoi && (
            <div className="flex flex-col gap-[4px]">
              <span className="eyebrow">KHI ĐẶT CẠNH NHAU</span>
              <span className="text-[12px] leading-[1.55]" style={{ color: 'var(--fg-muted)' }}>
                {duLieu.canCu.cachNoi}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-[4px]">
            <span className="eyebrow">PHƯƠNG PHÁP</span>
            <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              {duLieu.canCu.phuongPhap}
            </span>
            {!duLieu.canCu.coNguon && (
              <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Chưa có nguồn tài liệu nào trong kho khớp với chủ đề này, nên phần nhận định chuyên
                môn đã được thu hẹp lại.
              </span>
            )}
          </div>
        </div>
      </details>

      <Link href={`/hoi-dap?q=${encodeURIComponent(cauHoiTiep)}`} className="link-text link-action">
        Hỏi Celes thêm về hai người →
      </Link>

      <details className="rounded-[var(--radius-cards)] p-[14px]" style={{ boxShadow: 'var(--shadow-card)' }}>
        <summary className="cursor-pointer text-[13px]" style={{ color: 'var(--fg-muted)' }}>
          Xem căn cứ kỹ thuật
        </summary>
        <div className="mt-[14px]">{bangKyThuat}</div>
      </details>

      <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
        Celes đưa góc nhìn để hai người hiểu nhau hơn, không thay bạn quyết định. Không có mối quan
        hệ nào quy được về một con số.
      </p>
    </section>
  );
}
