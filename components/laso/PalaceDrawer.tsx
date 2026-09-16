'use client';

import { useEffect } from 'react';
import { tamPhuongTuChinh, type LaSo } from '@/lib/tuvi/ansao';
import { CHI, NGU_HANH_CHI } from '@/lib/tuvi/constants';
import { NHAN_DO_SANG } from '@/lib/tuvi/dosang';

function Muc({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h4
        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: 'var(--chart-tot)' }}
      >
        {tieuDe}
      </h4>
      {children}
    </div>
  );
}

export function PalaceDrawer({
  laSo,
  chiIndex,
  tuoiAm,
  thangXem,
  cungTieuHanIndex,
  cungNguyetHanIndex,
  onClose,
}: {
  laSo: LaSo;
  chiIndex: number | null;
  tuoiAm: number;
  thangXem: number;
  cungTieuHanIndex: number;
  cungNguyetHanIndex: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (chiIndex === null) return null;
  const cung = laSo.cungs[chiIndex];
  const { tamHop, xungChieu } = tamPhuongTuChinh(chiIndex);
  const chinhTinh = cung.sao.filter((s) => s.loai === 'chinh-tinh');
  const phuTinh = cung.sao.filter((s) => s.loai === 'phu-tinh');
  const vongSao = cung.sao.filter((s) => s.loai === 'vong-sao');
  const tuHoa = cung.sao.filter((s) => s.loai === 'tu-hoa');
  const tenCung = (i: number) => `${laSo.cungs[i].tenCung} (${CHI[i]})`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <aside
        className="relative flex h-full w-full max-w-[420px] flex-col gap-[18px] overflow-y-auto p-[30px]"
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--line-strong)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="heading-sm" style={{ fontSize: 30 }}>
              {cung.tenCung}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
              {cung.can} {cung.chi} · Hành {NGU_HANH_CHI[chiIndex]}
              {cung.laCungThan && ' · Thân cư tại đây'}
              {cung.laCungMenh && ' · Cung Mệnh'}
            </div>
          </div>
          <button onClick={onClose} className="link-text text-[20px] leading-none" aria-label="Đóng">
            ✕
          </button>
        </div>

        <Muc tieuDe="Chính tinh">
          {chinhTinh.length ? (
            <ul className="flex flex-col gap-[3px]">
              {chinhTinh.map((s) => (
                <li key={s.ten} className="text-[15px]">
                  {s.ten}
                  {s.doSang && (
                    <span className="ml-2 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                      {NHAN_DO_SANG[s.doSang].ten}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              Vô chính diệu — luận theo cung xung chiếu {tenCung(xungChieu)}.
            </p>
          )}
        </Muc>

        {tuHoa.length > 0 && (
          <Muc tieuDe="Tứ Hóa">
            <div className="flex flex-wrap gap-2">
              {tuHoa.map((s) => (
                <span key={s.ten} className="text-[14px]">
                  {s.ten}
                </span>
              ))}
            </div>
          </Muc>
        )}

        <Muc tieuDe="Phụ tinh">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {phuTinh.map((s) => (
              <span
                key={s.ten}
                className="text-[13px]"
                style={{
                  color:
                    s.tinhChat === 'hung' ? 'var(--chart-hung)' : 'var(--fg-body)',
                }}
              >
                {s.ten}
                {s.doSang && (
                  <span className="ml-1 text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                    {s.doSang}
                  </span>
                )}
              </span>
            ))}
          </div>
        </Muc>

        <Muc tieuDe="Vòng sao">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
            <span style={{ color: 'var(--fg-body)' }}>{cung.trangSinh}</span>
            {vongSao.map((s) => (
              <span key={s.ten} style={{ color: 'var(--fg-muted)' }}>
                {s.ten}
              </span>
            ))}
          </div>
        </Muc>

        <Muc tieuDe="Vận hạn">
          <div className="flex flex-col gap-[3px] text-[13px]">
            <span>
              Đại hạn:{' '}
              {cung.daiVan ? `${cung.daiVan.tuTuoi} – ${cung.daiVan.denTuoi} tuổi` : '—'}
            </span>
            <span>
              Tiểu hạn {tuoiAm} tuổi:{' '}
              {cungTieuHanIndex === chiIndex ? 'đóng tại cung này' : `tại ${tenCung(cungTieuHanIndex)}`}
            </span>
            <span>
              Nguyệt hạn tháng {thangXem}:{' '}
              {cungNguyetHanIndex === chiIndex
                ? 'đóng tại cung này'
                : `tại ${tenCung(cungNguyetHanIndex)}`}
            </span>
            {(cung.coTuan || cung.coTriet) && (
              <span style={{ color: 'var(--chart-hung)' }}>
                Bị án: {[cung.coTuan && 'Tuần', cung.coTriet && 'Triệt'].filter(Boolean).join(' + ')}
              </span>
            )}
          </div>
        </Muc>

        <Muc tieuDe="Tam phương tứ chính">
          <div className="flex flex-col gap-[3px] text-[13px]">
            <span>Tam hợp: {tenCung(tamHop[0])} · {tenCung(tamHop[1])}</span>
            <span>Xung chiếu: {tenCung(xungChieu)}</span>
          </div>
        </Muc>

        <button className="btn-primary mt-auto w-full" disabled title="Sẽ có ở giai đoạn luận giải AI">
          Luận giải cung này
        </button>
        <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
          Luận giải AI sẽ được bổ sung ở giai đoạn tiếp theo.
        </p>
      </aside>
    </div>
  );
}
