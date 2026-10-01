'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eyebrow } from '@/components/ui';
import { CAU_HOI_V3 } from '@/lib/rag/v3/khung';

/**
 * NHẬN XÉT BÀI LUẬN — mọi lượt quản trị viên chấm câu luận giải (01/10/2026). Bảng:
 * supabase/va-danh-gia-bai.sql; chấm ở thẻ "Chấm bài (quản trị)" trên trang lá số.
 *
 * Định kỳ (hoặc khi chủ dự án bảo): "Tải bản tổng hợp" → đưa tệp .md cho AI đọc, tìm luật viết cần
 * sửa. Bản xuất KHÔNG có email người chấm, KHÔNG có mã lá số — chỉ bài luận và nhận xét. Bài luận
 * vẫn là chữ viết từ lá số thật của người dùng: không commit tệp đó vào kho.
 */

interface DongCham {
  id: string;
  nhom: string;
  id_cau: string;
  cau_hoi: string | null;
  luan_giai: string | null;
  vi_sao: string | null;
  goi_y: string | null;
  phien_ban_prompt: string | null;
  model: string | null;
  khop_dem: boolean | null;
  danh_gia: 'hay' | 'chua-hay' | null;
  diem: number | null;
  binh_luan: string | null;
  goi_y_viet: string | null;
  email_cham: string | null;
  sua_luc: string;
}

async function docDanhGia(): Promise<DongCham[] | { loi: string }> {
  try {
    const r = await fetch('/api/admin/danh-gia-bai?gioiHan=1000', { cache: 'no-store' });
    const d = await r.json();
    return r.ok ? (d.danhGia as DongCham[]) : { loi: d.loi ?? 'Chưa đọc được danh sách. Tải lại trang để thử lần nữa.' };
  } catch {
    return { loi: 'Chưa kết nối được máy chủ. Tải lại trang để thử lần nữa.' };
  }
}

const tenCau = (id: string, d?: string | null) => d || CAU_HOI_V3.find((q) => q.id === id)?.cauHoi || id;
const ngay = (s: string) => new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const nhanDanhGia = (d: DongCham) => [d.danh_gia === 'hay' ? 'Hay' : d.danh_gia === 'chua-hay' ? 'Chưa hay' : '', d.diem ? `${d.diem}/5` : ''].filter(Boolean).join(' · ') || '—';

/** Gom theo câu hỏi: điểm TB, tỉ lệ chưa hay, rồi từng lượt chấm (câu chưa hay / điểm thấp lên trước) */
function banTongHop(ds: DongCham[]): string {
  const theoCau = new Map<string, DongCham[]>();
  for (const d of ds) theoCau.set(d.id_cau, [...(theoCau.get(d.id_cau) ?? []), d]);
  const tb = (xs: DongCham[]) => {
    const co = xs.filter((x) => x.diem);
    return co.length ? co.reduce((s, x) => s + (x.diem ?? 0), 0) / co.length : null;
  };
  const cau = [...theoCau.entries()].sort((a, b) => (tb(a[1]) ?? 9) - (tb(b[1]) ?? 9));
  const dong: string[] = [
    '# Tổng hợp nhận xét bài luận Celes',
    '',
    `Xuất lúc ${ngay(new Date().toISOString())} · ${ds.length} lượt chấm · ${theoCau.size} câu hỏi.`,
    '',
    '> Có chữ luận giải viết từ lá số thật của người dùng — KHÔNG commit tệp này vào kho. Không có email, không có mã lá số.',
    '',
    '## Tóm tắt theo câu',
    '',
    '| Câu | Lượt | Điểm TB | Chưa hay |',
    '|---|---|---|---|',
    ...cau.map(([id, xs]) => `| ${id} ${tenCau(id, xs[0].cau_hoi)} | ${xs.length} | ${tb(xs)?.toFixed(1) ?? '—'} | ${xs.filter((x) => x.danh_gia === 'chua-hay').length} |`),
    '',
  ];
  for (const [id, xs] of cau) {
    dong.push(`## ${id} — ${tenCau(id, xs[0].cau_hoi)}`, '');
    const xep = [...xs].sort((a, b) => Number(b.danh_gia === 'chua-hay') - Number(a.danh_gia === 'chua-hay') || (a.diem ?? 9) - (b.diem ?? 9));
    xep.forEach((d, i) => {
      dong.push(
        `### Lượt ${i + 1} · ${nhanDanhGia(d)} · ${ngay(d.sua_luc)}${d.phien_ban_prompt ? ` · prompt ${d.phien_ban_prompt}` : ''}${d.khop_dem === false ? ' · (bài chụp khác bài đệm)' : ''}`,
        '',
        d.binh_luan ? `**Nhận xét:** ${d.binh_luan}` : '',
        d.goi_y_viet ? `**Gợi ý cách viết:** ${d.goi_y_viet}` : '',
        '',
        '**Bài luận lúc chấm:**',
        '',
        ...(d.luan_giai ?? '').split(/\n\s*\n/).map((p) => `> ${p.trim()}\n>`),
        '',
        d.vi_sao ? `**Vì sao:** ${d.vi_sao}` : '',
        d.goi_y ? `**Gợi ý của Celes:** ${d.goi_y}` : '',
        ''
      );
    });
  }
  return dong.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n');
}

export default function NhanXetPage() {
  const [ds, setDs] = useState<DongCham[] | null>(null);
  const [loi, setLoi] = useState('');
  const [locCau, setLocCau] = useState('');
  const [chiChuaHay, setChiChuaHay] = useState(false);
  const [mo, setMo] = useState<string | null>(null);

  useEffect(() => {
    docDanhGia().then((d) => {
      if (Array.isArray(d)) setDs(d);
      else setLoi(d.loi);
    });
  }, []);

  const loc = useMemo(
    () => (ds ?? []).filter((d) => (!locCau || d.id_cau === locCau) && (!chiChuaHay || d.danh_gia === 'chua-hay')),
    [ds, locCau, chiChuaHay]
  );
  const cacCau = useMemo(() => [...new Set((ds ?? []).map((d) => d.id_cau))].sort(), [ds]);

  const taiXuong = () => {
    const blob = new Blob([banTongHop(loc)], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nhan-xet-bai-luan-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[8px]">
        <Eyebrow>Nhận xét bài luận</Eyebrow>
        <h1 className="heading-sm" style={{ color: 'var(--fg)' }}>
          Các lượt chấm bài
        </h1>
        <p className="body-sm max-w-[680px]" style={{ color: 'var(--fg-muted)' }}>
          Chấm ở nút &quot;Chấm bài này (quản trị)&quot; dưới mỗi câu tổng quan trên trang lá số. Định kỳ tải bản tổng hợp và đưa cho trợ lý AI đọc để tìm luật viết cần sửa. Bản tải về không có email hay mã lá số, nhưng có chữ luận của lá số thật — đừng commit vào kho.
        </p>
      </div>

      {loi && <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>{loi}</p>}

      <div className="flex flex-wrap items-center gap-[12px]">
        <select className="field-input w-auto min-h-[44px]" value={locCau} onChange={(e) => setLocCau(e.target.value)} aria-label="Lọc theo câu">
          <option value="">Mọi câu</option>
          {cacCau.map((id) => (
            <option key={id} value={id}>{`${id} · ${tenCau(id)}`}</option>
          ))}
        </select>
        <label className="body-sm flex min-h-[44px] items-center gap-[8px]" style={{ color: 'var(--fg)' }}>
          <input type="checkbox" checked={chiChuaHay} onChange={(e) => setChiChuaHay(e.target.checked)} />
          Chỉ bài chưa hay
        </label>
        <button type="button" className="btn-outline btn-sm min-h-[44px]" disabled={!loc.length} onClick={taiXuong}>
          Tải bản tổng hợp (.md)
        </button>
        <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>{ds ? `${loc.length} / ${ds.length} lượt` : 'Đang tải…'}</span>
      </div>

      {ds && !ds.length && <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>Chưa có lượt chấm nào. Chấm bài ở trang lá số.</p>}
      {ds && ds.length > 0 && !loc.length && <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>Không có lượt nào khớp bộ lọc.</p>}
      <ul className="flex flex-col gap-[12px]">
        {loc.map((d) => (
          <li key={d.id} className="card flex flex-col gap-[8px]">
            <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
              <span className="body-sm font-semibold" style={{ color: 'var(--fg)' }}>{`${d.id_cau} · ${tenCau(d.id_cau, d.cau_hoi)}`}</span>
              <span className="body-sm" style={{ color: d.danh_gia === 'chua-hay' ? 'var(--chart-hung)' : 'var(--fg-muted)' }}>{nhanDanhGia(d)}</span>
            </div>
            {d.binh_luan && <p className="body-sm" style={{ color: 'var(--fg)' }}><b>Nhận xét:</b> {d.binh_luan}</p>}
            {d.goi_y_viet && <p className="body-sm" style={{ color: 'var(--fg)' }}><b>Gợi ý cách viết:</b> {d.goi_y_viet}</p>}
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {[ngay(d.sua_luc), d.email_cham, d.phien_ban_prompt ? `prompt ${d.phien_ban_prompt}` : 'chưa ghi phiên bản prompt', d.model, d.khop_dem === false ? 'bài chụp khác bài đệm' : ''].filter(Boolean).join(' · ')}
            </p>
            <button type="button" className="link-text link-action inline-flex min-h-[44px] items-center self-start" aria-expanded={mo === d.id} onClick={() => setMo(mo === d.id ? null : d.id)}>
              {mo === d.id ? 'Thu gọn bài' : 'Xem bài lúc chấm'}
            </button>
            {mo === d.id && (
              <div className="flex flex-col gap-[8px] pt-[8px]" style={{ borderTop: '1px solid var(--line)' }}>
                {(d.luan_giai ?? '').split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="body-text" style={{ color: 'var(--fg)' }}>{p}</p>
                ))}
                {d.vi_sao && <p className="body-sm" style={{ color: 'var(--fg-muted)' }}><b>Vì sao:</b> {d.vi_sao}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
