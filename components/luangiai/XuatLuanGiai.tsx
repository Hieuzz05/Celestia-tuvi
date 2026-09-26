'use client';

import { useEffect, useState } from 'react';
import type { CauV3 } from '@/components/luangiai/CauTraLoiV3';
import { CAU_HOI_V3, CHU_DE_V3 } from '@/lib/rag/v3/khung';

/**
 * NÚT XUẤT DỮ LIỆU luận giải chuyên sâu (CEL-137) — chỉ hiện cho quản trị viên.
 *
 * Xuất chủ đề đang xem hoặc toàn bộ 14 chủ đề (kèm Bức tranh lớn), dạng Excel
 * hoặc PDF. Chủ đề trang đã đọc xong thì dùng luôn bài đang hiện; chủ đề chưa
 * mở thì gọi đúng route người đọc vẫn gọi (/api/luan-giai-v3) — bài đã đệm về
 * tức thì, chưa có thì Celes viết như khi mở chủ đề. Tệp dựng ở máy chủ
 * (/api/admin/xuat-luan-giai), route ấy kiểm lại quyền quản trị.
 */

export interface ThongTinXuat {
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: 'nam' | 'nu';
  namXem: number;
  ten: string;
}

export interface BaiDaDoc {
  cau: CauV3[];
  tomLai?: string | null;
}

type DinhDang = 'xlsx' | 'pdf';

async function goiLuanGiai(t: ThongTinXuat, them: Record<string, unknown>) {
  const { ngay, thang, nam, gio, gioiTinh, namXem } = t;
  const res = await fetch('/api/luan-giai-v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, namXem, ...them }),
  });
  const d = await res.json().catch(() => null);
  if (!res.ok) throw new Error(d?.loi ?? 'Celes chưa viết được phần này.');
  return d;
}

/** Đọc đủ một chủ đề: hai nửa nối tiếp (như trang đọc, để sổ ý chống lặp vẫn chạy) rồi "Tóm lại" */
async function docChuDe(t: ThongTinXuat, chuDe: string): Promise<BaiDaDoc> {
  const ids = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === chuDe).map((q) => q.id);
  const giua = ids.length >= 4 ? Math.ceil(ids.length / 2) : ids.length;
  const dau = await goiLuanGiai(t, { nhom: chuDe, chi: ids.slice(0, giua) });
  const sau = ids.length > giua ? await goiLuanGiai(t, { nhom: chuDe, chi: ids.slice(giua) }) : { cau: [] };
  const tom = await goiLuanGiai(t, { nhom: chuDe, tomLai: true }).catch(() => null);
  return { cau: [...(dau.cau ?? []), ...(sau.cau ?? [])], tomLai: tom?.tomLai ?? null };
}

export function XuatLuanGiai({
  thongTin,
  chuDeDangXem,
  daDoc,
  danChuDe,
  onDaNap,
}: {
  thongTin: ThongTinXuat;
  /** null khi đang ở mục Bức tranh lớn — chỉ xuất được toàn bộ */
  chuDeDangXem: string | null;
  /** Các chủ đề trang đã đọc xong (đủ câu, đã có tóm lại) */
  daDoc: Record<string, BaiDaDoc>;
  danChuDe: Record<string, string>;
  /** Báo lại cho trang các chủ đề vừa đọc để khỏi gọi lần nữa khi mở */
  onDaNap?: (chuDe: string, bai: BaiDaDoc) => void;
}) {
  const [laAdmin, setLaAdmin] = useState(false);
  const [mo, setMo] = useState(false);
  const [phamVi, setPhamVi] = useState<'mot' | 'tat-ca'>(chuDeDangXem ? 'mot' : 'tat-ca');
  const [dinhDang, setDinhDang] = useState<DinhDang>('xlsx');
  const [dang, setDang] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/xuat-luan-giai')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLaAdmin(Boolean(d?.laAdmin)))
      .catch(() => setLaAdmin(false));
  }, []);

  if (!laAdmin) return null;

  const tenChuDe = CHU_DE_V3.find((c) => c.id === chuDeDangXem)?.ten;
  const phamViThat = chuDeDangXem ? phamVi : 'tat-ca';

  const xuat = async () => {
    setLoi(null);
    try {
      const ds = phamViThat === 'mot' && chuDeDangXem ? CHU_DE_V3.filter((c) => c.id === chuDeDangXem) : CHU_DE_V3;
      const chuDe = [];
      for (const [i, c] of ds.entries()) {
        let bai = daDoc[c.id];
        if (!bai) {
          setDang(ds.length > 1 ? `Đang lấy ${c.ten} (${i + 1}/${ds.length})…` : `Đang lấy ${c.ten}…`);
          bai = await docChuDe(thongTin, c.id);
          onDaNap?.(c.id, bai);
        }
        chuDe.push({ id: c.id, ten: c.ten, dan: danChuDe[c.id], cau: bai.cau, tomLai: bai.tomLai ?? null });
      }
      let bucTranh: string | null = null;
      if (phamViThat === 'tat-ca') {
        setDang('Đang lấy Bức tranh lớn…');
        bucTranh = await goiLuanGiai(thongTin, { nhom: 'tinh-cach', bucTranh: true })
          .then((d) => d?.bucTranh ?? null)
          .catch(() => null);
      }

      setDang(dinhDang === 'pdf' ? 'Đang dựng tệp PDF…' : 'Đang dựng tệp Excel…');
      const { ngay, thang, nam, gio, gioiTinh, namXem, ten } = thongTin;
      const res = await fetch('/api/admin/xuat-luan-giai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dinhDang,
          goi: {
            ten,
            thongTinSinh: `Sinh ${ngay}/${thang}/${nam}, ${gio} giờ, ${gioiTinh === 'nu' ? 'nữ' : 'nam'}`,
            namXem,
            chuDe,
            bucTranh,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.loi ?? 'Không tạo được tệp.');
      }
      const blob = await res.blob();
      const tenTep = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? `luan-giai.${dinhDang}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tenTep;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMo(false);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không xuất được.');
    } finally {
      setDang(null);
    }
  };

  const nutChon = (chon: boolean) => ({
    borderColor: chon ? 'var(--accent)' : 'var(--line)',
    background: chon ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
    color: chon ? 'var(--fg)' : 'var(--fg-muted)',
    fontWeight: chon ? 600 : 400,
  });
  const lop = 'rounded-full border px-[12px] py-[6px] text-[13px] transition-colors disabled:opacity-40';

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-outline btn-sm"
        onClick={() => setMo((x) => !x)}
        aria-expanded={mo}
        aria-haspopup="dialog"
      >
        ⤓ Xuất dữ liệu
      </button>
      {mo && (
        <div
          role="dialog"
          aria-label="Xuất luận giải"
          className="card absolute right-0 z-20 mt-[8px] flex w-[300px] max-w-[calc(100vw-32px)] flex-col gap-[16px]"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-baseline justify-between gap-[8px]">
            <span className="eyebrow">Xuất luận giải</span>
            <span className="caption" style={{ color: 'var(--fg-muted)' }}>
              Chỉ quản trị viên
            </span>
          </div>

          <fieldset className="flex flex-col gap-[8px]">
            <legend className="caption mb-[6px]" style={{ color: 'var(--fg-muted)' }}>
              Phạm vi
            </legend>
            <div className="flex flex-wrap gap-[8px]">
              <button
                type="button"
                className={lop}
                style={nutChon(phamViThat === 'mot')}
                disabled={!chuDeDangXem || Boolean(dang)}
                onClick={() => setPhamVi('mot')}
              >
                {tenChuDe ?? 'Chủ đề đang xem'}
              </button>
              <button
                type="button"
                className={lop}
                style={nutChon(phamViThat === 'tat-ca')}
                disabled={Boolean(dang)}
                onClick={() => setPhamVi('tat-ca')}
              >
                Toàn bộ {CHU_DE_V3.length} chủ đề
              </button>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-[8px]">
            <legend className="caption mb-[6px]" style={{ color: 'var(--fg-muted)' }}>
              Định dạng
            </legend>
            <div className="flex flex-wrap gap-[8px]">
              {(['xlsx', 'pdf'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={lop}
                  style={nutChon(dinhDang === d)}
                  disabled={Boolean(dang)}
                  onClick={() => setDinhDang(d)}
                >
                  {d === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                </button>
              ))}
            </div>
          </fieldset>

          {phamViThat === 'tat-ca' && !dang && (
            <p className="caption" style={{ color: 'var(--fg-muted)' }}>
              Chủ đề chưa mở sẽ được Celes viết trước khi xuất — lần đầu có thể mất vài phút.
            </p>
          )}
          {dang && (
            <p className="body-sm" style={{ color: 'var(--fg)' }} aria-live="polite">
              {dang}
              <span className="dot-dang-doc" aria-hidden />
            </p>
          )}
          {loi && (
            <p className="body-sm" style={{ color: 'var(--chart-hung)' }} role="alert">
              {loi}
            </p>
          )}

          <button type="button" className="btn-primary btn-sm self-start" onClick={xuat} disabled={Boolean(dang)}>
            {dang ? 'Đang xuất…' : 'Xuất tệp'}
          </button>
        </div>
      )}
    </div>
  );
}
