'use client';

import type { LaSo } from '@/lib/tuvi/ansao';

/**
 * Mệnh bàn dạng DANH SÁCH cho màn hẹp (CEL-072, 25/09/2026).
 *
 * Lưới 4×4 trên bề ngang 342px chỉ còn chữ ~9px — đo 24/09/2026: 149 cụm chữ
 * dưới 12px trên /la-so mobile. Không có cách nào hiện mười hai cung với chữ đọc
 * được trong lưới đó, nên màn hẹp có thêm một cách xem: mỗi cung một thẻ, chữ cỡ
 * thật, ĐỦ sao như trên máy tính (không bớt phụ tinh — chủ dự án từng bắt lỗi
 * bản giấu bớt sao). Lưới vẫn còn, người dùng tự chọn.
 *
 * Thứ tự: Mệnh trước, rồi đi theo vòng mười hai cung — thứ tự người xem Tử Vi
 * quen đọc, không phải thứ tự địa chi.
 */

const THU_TU = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];

const MAU_DO_SANG: Record<string, string> = {
  M: 'var(--ok-fg)',
  V: 'var(--ok-fg)',
  D: 'var(--fg-muted)',
  L: 'var(--fg-muted)',
  B: 'var(--fg-muted)',
  H: 'var(--chart-hung)',
};

export function DanhSachCung({
  laSo,
  luuTinhTheoCung,
  cungTieuHanIndex,
  cungDaiVanIndex,
  onChon,
}: {
  laSo: LaSo;
  luuTinhTheoCung: Map<number, { ten: string; tinhChat?: string }[]>;
  cungTieuHanIndex: number;
  cungDaiVanIndex?: number;
  onChon: (chiIndex: number) => void;
}) {
  const cungs = [...laSo.cungs].sort((a, b) => THU_TU.indexOf(a.tenCung) - THU_TU.indexOf(b.tenCung));

  return (
    <ol className="flex flex-col gap-[12px]">
      {cungs.map((c) => {
        const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
        const hoa = c.sao.filter((s) => s.loai === 'tu-hoa');
        const phu = c.sao.filter((s) => s.loai === 'phu-tinh');
        const cat = phu.filter((s) => s.tinhChat === 'cat');
        const hung = phu.filter((s) => s.tinhChat === 'hung');
        const khac = phu.filter((s) => s.tinhChat !== 'cat' && s.tinhChat !== 'hung');
        const luu = luuTinhTheoCung.get(c.chiIndex) ?? [];
        const nhan = [
          c.laCungThan && c.tenCung !== 'Mệnh' ? 'Thân' : null,
          cungDaiVanIndex === c.chiIndex ? 'Đại vận hiện tại' : null,
          cungTieuHanIndex === c.chiIndex ? 'Tiểu hạn năm nay' : null,
          c.coTuan ? 'Tuần' : null,
          c.coTriet ? 'Triệt' : null,
        ].filter(Boolean) as string[];

        return (
          <li key={c.chiIndex}>
            <button
              type="button"
              onClick={() => onChon(c.chiIndex)}
              className="card flex w-full flex-col gap-[8px] text-left"
              style={c.laCungMenh ? { borderLeft: '3px solid var(--accent)' } : undefined}
              aria-label={`Cung ${c.tenCung} — mở chi tiết`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[4px]">
                <span className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.tenCung}
                </span>
                <span className="caption tabular-nums">
                  {c.can} {c.chi}
                  {c.daiVan ? ` · ${c.daiVan.tuTuoi}–${c.daiVan.denTuoi} tuổi` : ''}
                </span>
              </div>

              {nhan.length > 0 && (
                <div className="flex flex-wrap gap-[8px]">
                  {nhan.map((n) => (
                    <span key={n} className="caption rounded-full border px-[8px] py-[2px]" style={{ borderColor: 'var(--line-strong)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[16px] font-medium" style={{ color: 'var(--fg)' }}>
                {chinh.length
                  ? chinh.map((s, i) => (
                      <span key={s.ten}>
                        {i > 0 && ', '}
                        {s.ten}
                        {s.doSang && (
                          <span className="ml-[4px] text-[13px]" style={{ color: MAU_DO_SANG[s.doSang] }}>
                            ({s.doSang})
                          </span>
                        )}
                      </span>
                    ))
                  : 'Vô chính diệu'}
                {hoa.length > 0 && (
                  <span className="ml-[8px] text-[14px]" style={{ color: 'var(--accent)' }}>
                    {hoa.map((s) => s.ten).join(', ')}
                  </span>
                )}
              </p>

              {cat.length > 0 && (
                <p className="body-sm">
                  <span style={{ color: 'var(--ok-fg)' }}>Sao tốt: </span>
                  {cat.map((s) => s.ten + (s.doSang ? ` (${s.doSang})` : '')).join(', ')}
                </p>
              )}
              {hung.length > 0 && (
                <p className="body-sm">
                  <span style={{ color: 'var(--chart-hung)' }}>Sao xấu: </span>
                  {hung.map((s) => s.ten + (s.doSang ? ` (${s.doSang})` : '')).join(', ')}
                </p>
              )}
              {khac.length > 0 && (
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {khac.map((s) => s.ten).join(', ')}
                </p>
              )}
              {luu.length > 0 && (
                <p className="caption">Lưu niên: {luu.map((s) => s.ten.replace('Lưu ', '')).join(', ')}</p>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
