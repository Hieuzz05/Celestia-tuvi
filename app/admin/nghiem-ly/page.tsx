'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eyebrow, Shell } from '@/components/ui';

/**
 * Nghiệm lý của tôi (CEL-196, QĐ-13) — chủ dự án soạn và ký các phát biểu có điều kiện.
 *
 * Mỗi lần sửa là một PHIÊN BẢN mới; duyệt nằm trên phiên bản. Chat chỉ dùng phiên bản đang
 * dùng của mục đang dùng, đã duyệt — và chỉ khi máy chủ bật cờ CELES_OWNER_KNOWLEDGE_FOCUSED.
 */

interface DongMuc {
  id: string;
  trang_thai: 'nhap' | 'dang-dung' | 'luu-tru';
  phien_ban_dang_dung: number | null;
}
interface DongPhienBan {
  muc_id: string;
  phien_ban: number;
  noi_dung: {
    y: string;
    chuDe: string[];
    cheDo: string;
    dich?: string[];
    nhan: { chieu: string; muc: string };
    dieuKien: { cung: string[]; sao: { ten: string; quanHe: string }[] };
  };
  duyet: string;
  approved_by: string | null;
  approved_at: string | null;
}
interface DuLieu {
  muc: DongMuc[];
  phienBan: DongPhienBan[];
  cung: string[];
  quanHe: string[];
}

const NHAN_TRANG_THAI = { nhap: 'Nháp', 'dang-dung': 'Đang dùng', 'luu-tru': 'Lưu trữ' } as const;
const NHAN_DUYET: Record<string, string> = { chua: 'Chưa duyệt', 'da-duyet': 'Đã duyệt', 'bi-bac': 'Bị bác', 'tranh-chap': 'Tranh chấp' };

async function docDuLieu(): Promise<DuLieu | { loi: string }> {
  try {
    const res = await fetch('/api/admin/nghiem-ly', { cache: 'no-store' });
    const j = await res.json();
    if (!res.ok) return { loi: j.loi ?? 'Không đọc được nghiệm lý' };
    return j as DuLieu;
  } catch {
    return { loi: 'Không kết nối được máy chủ' };
  }
}

const FORM_TRONG = { id: '', y: '', cung: '', sao: '', quanHe: 'o-cung', chieu: 'cat', muc: 'vua', chuDe: '', cheDo: 'add', dich: '' };

export default function TrangNghiemLy() {
  const [d, setD] = useState<DuLieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [f, setF] = useState(FORM_TRONG);
  const [dangSua, setDangSua] = useState(false);

  const tai = useCallback(async () => {
    const kq = await docDuLieu();
    if ('loi' in kq) setLoi(kq.loi);
    else {
      setLoi(null);
      setD(kq);
    }
  }, []);

  useEffect(() => {
    docDuLieu().then((kq) => {
      if ('loi' in kq) setLoi(kq.loi);
      else setD(kq);
    });
  }, []);

  async function goi(than: Record<string, unknown>) {
    setThongBao(null);
    const res = await fetch('/api/admin/nghiem-ly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(than),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setThongBao(j.loi ?? 'Không thực hiện được');
      return false;
    }
    await tai();
    return true;
  }

  async function luu() {
    const tach = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const ok = await goi({
      hanhDong: dangSua ? 'sua' : 'tao',
      id: f.id,
      noiDung: {
        y: f.y,
        chuDe: tach(f.chuDe),
        cheDo: f.cheDo,
        dich: tach(f.dich),
        nhan: { chieu: f.chieu, muc: f.muc },
        dieuKien: { cung: f.cung ? [f.cung] : [], sao: tach(f.sao).map((ten) => ({ ten, quanHe: f.quanHe })) },
      },
    });
    if (ok) {
      setF(FORM_TRONG);
      setDangSua(false);
    }
  }

  function napDeSua(p: DongPhienBan) {
    const nd = p.noi_dung;
    setDangSua(true);
    setF({
      id: p.muc_id,
      y: nd.y,
      cung: nd.dieuKien.cung[0] ?? '',
      sao: nd.dieuKien.sao.map((s) => s.ten).join(', '),
      quanHe: nd.dieuKien.sao[0]?.quanHe ?? 'o-cung',
      chieu: nd.nhan.chieu,
      muc: nd.nhan.muc,
      chuDe: nd.chuDe.join(', '),
      cheDo: nd.cheDo,
      dich: (nd.dich ?? []).join(', '),
    });
  }

  const o = 'rounded-[10px] border px-[10px] py-[8px] text-[14px] bg-transparent';
  const st = { borderColor: 'var(--line)' };

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · TRI THỨC</Eyebrow>
        <h1 className="heading-sm">Nghiệm lý của tôi</h1>
        <p className="body-sm mt-[12px]" style={{ color: 'var(--fg-muted)' }}>
          Mỗi nghiệm lý là một phát biểu có điều kiện: sao nào, ở cung nào, nghĩa là gì. Sửa là thêm
          phiên bản mới; phiên bản cũ giữ nguyên. Chat chỉ dùng phiên bản <strong>đã duyệt</strong> và
          đang được chọn dùng.
        </p>
      </div>

      {loi && <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>{loi}</p>}
      {thongBao && <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>{thongBao}</p>}

      {d && (
        <section className="flex flex-col gap-[12px] rounded-[var(--radius-cards)] p-[16px]" style={{ background: 'var(--surface-panel)' }}>
          <h2 className="text-[16px] font-semibold">{dangSua ? `Phiên bản mới cho ${f.id}` : 'Nghiệm lý mới'}</h2>
          <div className="grid gap-[12px] sm:grid-cols-2">
            <input className={o} style={st} placeholder="Mã (NL-...)" value={f.id} disabled={dangSua} onChange={(e) => setF({ ...f, id: e.target.value })} />
            <select className={o} style={st} value={f.cung} onChange={(e) => setF({ ...f, cung: e.target.value })}>
              <option value="">Mọi cung</option>
              {d.cung.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={o} style={st} placeholder="Sao (cách nhau dấu phẩy)" value={f.sao} onChange={(e) => setF({ ...f, sao: e.target.value })} />
            <select className={o} style={st} value={f.quanHe} onChange={(e) => setF({ ...f, quanHe: e.target.value })}>
              {d.quanHe.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
            <select className={o} style={st} value={f.chieu} onChange={(e) => setF({ ...f, chieu: e.target.value })}>
              <option value="cat">Cát</option><option value="hung">Hung</option><option value="trung">Trung</option>
            </select>
            <select className={o} style={st} value={f.muc} onChange={(e) => setF({ ...f, muc: e.target.value })}>
              <option value="manh">Mạnh</option><option value="vua">Vừa</option><option value="nhe">Nhẹ</option>
            </select>
            <input className={o} style={st} placeholder="Chủ đề (su-nghiep, tinh-cam…)" value={f.chuDe} onChange={(e) => setF({ ...f, chuDe: e.target.value })} />
            <select className={o} style={st} value={f.cheDo} onChange={(e) => setF({ ...f, cheDo: e.target.value })}>
              <option value="add">Thêm (add)</option><option value="modify">Sửa (modify)</option>
              <option value="neutralize">Trung hoà (neutralize)</option><option value="override">Thay (override)</option>
            </select>
            {f.cheDo !== 'add' && (
              <input className={o} style={st} placeholder="Áp lên mã (NL-…, cách nhau dấu phẩy)" value={f.dich} onChange={(e) => setF({ ...f, dich: e.target.value })} />
            )}
          </div>
          <textarea className={o} style={st} rows={2} placeholder="Câu nghĩa trung tính, ≤ 45 chữ, không 'bạn'" value={f.y} onChange={(e) => setF({ ...f, y: e.target.value })} />
          <div className="flex gap-[12px]">
            <button className="btn-primary" onClick={luu}>{dangSua ? 'Lưu phiên bản mới' : 'Tạo'}</button>
            {dangSua && <button className="link-text" onClick={() => { setDangSua(false); setF(FORM_TRONG); }}>Huỷ</button>}
          </div>
        </section>
      )}

      {d?.muc.map((m) => (
        <section key={m.id} className="flex flex-col gap-[8px] rounded-[var(--radius-cards)] border p-[16px]" style={st}>
          <div className="flex flex-wrap items-center gap-[12px]">
            <strong>{m.id}</strong>
            <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
              {NHAN_TRANG_THAI[m.trang_thai]}{m.phien_ban_dang_dung ? ` · dùng v${m.phien_ban_dang_dung}` : ''}
            </span>
            {m.trang_thai !== 'luu-tru' && (
              <button className="link-text text-[13px]" onClick={() => goi({ hanhDong: 'luu-tru', id: m.id })}>Lưu trữ</button>
            )}
          </div>
          {d.phienBan.filter((p) => p.muc_id === m.id).map((p) => (
            <div key={p.phien_ban} className="flex flex-col gap-[4px] border-t pt-[8px] text-[14px]" style={st}>
              <div>
                <strong>v{p.phien_ban}</strong> · {NHAN_DUYET[p.duyet] ?? p.duyet}
                {p.approved_by && <span style={{ color: 'var(--fg-muted)' }}> · {p.approved_by} · {p.approved_at?.slice(0, 10)}</span>}
              </div>
              <div>{p.noi_dung.y}</div>
              <div className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                {p.noi_dung.dieuKien.sao.map((s) => `${s.ten} (${s.quanHe})`).join(', ')} · {p.noi_dung.dieuKien.cung.join(', ') || 'mọi cung'} ·{' '}
                {p.noi_dung.nhan.chieu}/{p.noi_dung.nhan.muc} · {p.noi_dung.cheDo}{p.noi_dung.dich?.length ? ` → ${p.noi_dung.dich.join(', ')}` : ''}
              </div>
              <div className="flex flex-wrap gap-[12px] text-[13px]">
                {p.duyet !== 'da-duyet' && <button className="link-text" onClick={() => goi({ hanhDong: 'duyet', id: m.id, phienBan: p.phien_ban })}>Duyệt</button>}
                {p.duyet !== 'bi-bac' && <button className="link-text" onClick={() => goi({ hanhDong: 'bac', id: m.id, phienBan: p.phien_ban })}>Bác</button>}
                {p.duyet === 'da-duyet' && m.phien_ban_dang_dung !== p.phien_ban && (
                  <button className="link-text" onClick={() => goi({ hanhDong: 'dung', id: m.id, phienBan: p.phien_ban })}>Dùng bản này</button>
                )}
                <button className="link-text" onClick={() => napDeSua(p)}>Sửa từ bản này</button>
              </div>
            </div>
          ))}
        </section>
      ))}
    </Shell>
  );
}
