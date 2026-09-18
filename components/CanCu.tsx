'use client';

import { useT } from '@/lib/i18n/context';

/**
 * "Muốn biết vì sao không?" — phần căn cứ phía sau một câu trả lời.
 *
 * Chỉ ba thứ: dữ kiện lá số, cách Celes nối chúng lại, và điểm kéo ngược.
 *
 * Cố ý KHÔNG có tên tài liệu, hệ phái hay điểm liên quan. Đó là quyết định sản
 * phẩm, không phải thiếu sót: người dùng không cần biết Celes lấy đoạn nào từ
 * cuốn nào, và một con số "82% liên quan" là điểm cosine giữa hai vector — nó
 * không nói lên nguồn đó đáng tin đến đâu, mà người đọc cũng chẳng làm gì được
 * với nó. Toàn bộ nguồn gốc kỹ thuật nằm ở trang quản trị để gỡ lỗi và đánh giá.
 *
 * CHỈ HIỆN VỚI TÀI KHOẢN QUẢN TRỊ. Máy chủ không gửi khối này cho người dùng
 * thường, nên đây là công cụ đối soát chứ không phải một phần của sản phẩm.
 * Chặn ở máy chủ chứ không ẩn ở giao diện: ẩn ở giao diện thì dữ liệu vẫn nằm
 * nguyên trong phản hồi.
 */

export interface DuKienHienThi {
  id: string;
  noiDung: string;
}

export type MucChacChan = 'manh' | 'vua' | 'yeu' | 'trai-chieu' | 'chua-du';

export interface CanCuTraLoi {
  duKien: DuKienHienThi[];
  cachNoi?: string | null;
  luongNguoc?: string[];
  mucChacChan?: { tieuDe: string; muc: MucChacChan | null }[];
  chuDe: string;
  cungLienQuan: string[];
  phuongPhap: string;
  coNguon?: boolean;
}

export function CanCu({ canCu }: { canCu?: CanCuTraLoi }) {
  const t = useT();
  if (!canCu || canCu.duKien.length === 0) return null;

  const nhanMuc: Record<MucChacChan, string> = {
    manh: t.hoiCeles.chacManh,
    vua: t.hoiCeles.chacVua,
    yeu: t.hoiCeles.chacYeu,
    'trai-chieu': t.hoiCeles.chacTraiChieu,
    'chua-du': t.hoiCeles.chacChuaDu,
  };

  const coMuc = (canCu.mucChacChan ?? []).filter((m) => m.muc);

  return (
    <details className="rounded-[var(--radius-cards)] p-[12px]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <summary className="cursor-pointer text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        {t.hoiCeles.canCuMo}
      </summary>

      <div className="mt-[12px] flex flex-col gap-[14px]">
        <Nhom tieuDe={t.hoiCeles.canCuLaSo}>
          {canCu.duKien.map((d) => (
            <Dong key={d.id}>{d.noiDung}</Dong>
          ))}
        </Nhom>

        {canCu.cachNoi && (
          <Nhom tieuDe={t.hoiCeles.canCuCachNoi}>
            <Dong>{canCu.cachNoi}</Dong>
          </Nhom>
        )}

        {canCu.luongNguoc && canCu.luongNguoc.length > 0 && (
          <Nhom tieuDe={t.hoiCeles.canCuLuongNguoc}>
            {canCu.luongNguoc.map((l, i) => (
              <Dong key={i}>{l}</Dong>
            ))}
          </Nhom>
        )}

        {coMuc.length > 0 && (
          <Nhom tieuDe={t.hoiCeles.canCuMucChac}>
            {coMuc.map((m, i) => (
              <Dong key={i}>
                {m.tieuDe ? `${m.tieuDe}: ` : ''}
                {nhanMuc[m.muc as MucChacChan]}
              </Dong>
            ))}
          </Nhom>
        )}

        <Nhom tieuDe={t.hoiCeles.canCuPhuongPhap}>
          <Dong>{canCu.phuongPhap}</Dong>
          {/* Dòng này từng bị đọc nhầm thành tên một cuốn sách trong kho. Nó là
              phiên bản bộ quy tắc AN SAO — giờ Tý sớm hay muộn, cách xử tháng
              nhuận, bộ Tứ Hóa, chiều an đại vận. Nói rõ ngay tại chỗ. */}
          <Dong>{t.hoiCeles.canCuPhuongPhapMo}</Dong>
          <Dong>
            {t.hoiCeles.canCuChuDe}: {canCu.chuDe} · {canCu.cungLienQuan.join(', ')}
          </Dong>
          {canCu.coNguon === false && <Dong>{t.hoiCeles.canCuKhongNguon}</Dong>}
        </Nhom>
      </div>
    </details>
  );
}

function Nhom({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="eyebrow">{tieuDe}</span>
      {children}
    </div>
  );
}

function Dong({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] leading-[1.55]" style={{ color: 'var(--fg-muted)' }}>
      {children}
    </span>
  );
}
