'use client';

import { useT } from '@/lib/i18n/context';

/**
 * "Muốn biết vì sao không?" — phần căn cứ phía sau một câu trả lời.
 *
 * Thay cho khối "Trích từ kho tri thức" cũ, vốn chỉ liệt kê tên tài liệu kèm
 * một con số phần trăm. Con số đó là điểm cosine — nó nói lên độ gần nghĩa giữa
 * hai vector, không nói lên tài liệu đó đáng tin đến đâu, và người đọc không có
 * cách nào dùng nó. Thứ họ cần biết là: lá số của họ đã cho thấy gì, và nhận
 * định dựa trên tài liệu nào.
 *
 * Mặc định đóng. Người đến đây để đọc câu trả lời, không phải để đọc dấu vết
 * của hệ thống — nhưng khi họ nghi ngờ thì dấu vết phải có sẵn ở đó.
 */

export interface DuKienHienThi {
  id: string;
  noiDung: string;
}

export interface NguonHienThi {
  id: string;
  tieuDe: string;
  phienBan: string;
  deMuc: string | null;
  hePhai: string;
}

export interface CanCuTraLoi {
  duKien: DuKienHienThi[];
  nguon: NguonHienThi[];
  chuDe: string;
  cungLienQuan: string[];
  phuongPhap: string;
}

export function CanCu({ canCu }: { canCu?: CanCuTraLoi }) {
  const t = useT();
  if (!canCu || canCu.duKien.length === 0) return null;

  return (
    <details className="rounded-[var(--radius-cards)] p-[12px]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <summary className="cursor-pointer text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        {t.hoiCeles.canCuMo}
      </summary>

      <div className="mt-[12px] flex flex-col gap-[14px]">
        <Nhom tieuDe={t.hoiCeles.canCuLaSo}>
          {canCu.duKien.map((d) => (
            <Dong key={d.id}>
              <Ma>{d.id}</Ma> {d.noiDung}
            </Dong>
          ))}
        </Nhom>

        <Nhom tieuDe={t.hoiCeles.canCuNguon}>
          {canCu.nguon.length === 0 ? (
            <Dong>{t.hoiCeles.canCuKhongNguon}</Dong>
          ) : (
            canCu.nguon.map((n) => (
              <Dong key={n.id}>
                <Ma>{n.id}</Ma> {n.tieuDe} v{n.phienBan}
                {n.deMuc ? ` — ${n.deMuc}` : ''} · {n.hePhai}
              </Dong>
            ))
          )}
        </Nhom>

        <Nhom tieuDe={t.hoiCeles.canCuPhuongPhap}>
          <Dong>{canCu.phuongPhap}</Dong>
          <Dong>
            {t.hoiCeles.canCuChuDe}: {canCu.chuDe} · {canCu.cungLienQuan.join(', ')}
          </Dong>
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

/** Mã F###/E### — in bằng chữ đều để tra ngược được trong nhật ký quản trị */
function Ma({ children }: { children: React.ReactNode }) {
  return (
    <span className="tabular-nums" style={{ color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
      {children}
    </span>
  );
}
