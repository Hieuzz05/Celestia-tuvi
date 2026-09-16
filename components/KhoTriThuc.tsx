'use client';

import { useCallback, useEffect, useState } from 'react';
import { Field } from '@/components/FormSinh';

interface TaiLieu {
  id: string;
  tieu_de: string;
  ten_tep: string | null;
  he_phai: string;
  so_chunk: number;
  so_ky_tu: number;
  tao_luc: string;
}

const HE_PHAI = [
  { id: 'chung', nhan: 'Dùng chung' },
  { id: 'nam-phai', nhan: 'Nam phái' },
  { id: 'bac-phai', nhan: 'Bắc phái' },
];

const DINH_DANG_NHAN_DUOC = '.txt,.md,.markdown,.csv';

export function KhoTriThuc() {
  const [taiLieu, setTaiLieu] = useState<TaiLieu[]>([]);
  const [tieuDe, setTieuDe] = useState('');
  const [hePhai, setHePhai] = useState('nam-phai');
  const [noiDung, setNoiDung] = useState('');
  const [tenTep, setTenTep] = useState<string | null>(null);
  const [dangNap, setDangNap] = useState(false);
  const [thongBao, setThongBao] = useState<{ loai: 'loi' | 'ok'; noiDung: string } | null>(null);
  const [chuaCauHinh, setChuaCauHinh] = useState(false);

  const taiDanhSach = useCallback(async () => {
    try {
      const res = await fetch('/api/kho-tri-thuc');
      const d = await res.json();
      if (!res.ok) {
        if (d.chuaCauHinh) setChuaCauHinh(true);
        setThongBao({ loai: 'loi', noiDung: d.loi ?? 'Không đọc được kho tri thức' });
        return;
      }
      setTaiLieu(d.taiLieu ?? []);
      setChuaCauHinh(false);
    } catch {
      setThongBao({ loai: 'loi', noiDung: 'Không kết nối được tới máy chủ' });
    }
  }, []);

  useEffect(() => {
    taiDanhSach();
  }, [taiDanhSach]);

  const chonTep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const tep = e.target.files?.[0];
    if (!tep) return;
    const text = await tep.text();
    setNoiDung(text);
    setTenTep(tep.name);
    if (!tieuDe.trim()) setTieuDe(tep.name.replace(/\.[^.]+$/, ''));
  };

  const nap = async () => {
    setDangNap(true);
    setThongBao(null);
    try {
      const res = await fetch('/api/kho-tri-thuc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tieuDe, noiDung, hePhai, tenTep }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.loi ?? 'Nạp tài liệu thất bại');
      setThongBao({ loai: 'ok', noiDung: `Đã nạp "${tieuDe}" — cắt thành ${d.soDoan} đoạn.` });
      setTieuDe('');
      setNoiDung('');
      setTenTep(null);
      await taiDanhSach();
    } catch (e) {
      setThongBao({ loai: 'loi', noiDung: e instanceof Error ? e.message : 'Có lỗi xảy ra' });
    } finally {
      setDangNap(false);
    }
  };

  const xoa = async (id: string, ten: string) => {
    if (!window.confirm(`Xoá tài liệu "${ten}" khỏi kho tri thức?`)) return;
    try {
      const res = await fetch(`/api/kho-tri-thuc?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.loi ?? 'Xoá thất bại');
      await taiDanhSach();
    } catch (e) {
      setThongBao({ loai: 'loi', noiDung: e instanceof Error ? e.message : 'Có lỗi xảy ra' });
    }
  };

  const soDoanUocTinh = Math.max(1, Math.round(noiDung.length / 1000));

  return (
    <section className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[8px]">
        <h2 className="heading-sm">Kho tri thức (RAG)</h2>
        <p className="body-text max-w-[640px]" style={{ color: 'var(--fg-muted)' }}>
          Tài liệu nạp vào đây được cắt thành đoạn, sinh vector ngữ nghĩa và lưu trong Postgres.
          Khi luận giải, hệ thống truy hồi những đoạn liên quan nhất tới bộ sao trong lá số rồi đưa
          vào prompt — AI ưu tiên tài liệu của bạn khi nó mâu thuẫn với kiến thức chung.
        </p>
      </div>

      {chuaCauHinh && (
        <p
          className="rounded-[var(--radius-cards)] border p-[14px] text-[13px]"
          style={{ borderColor: 'var(--chart-hung)', color: 'var(--chart-hung)' }}
        >
          Kho tri thức chưa dùng được: thiếu <code>SUPABASE_SERVICE_ROLE_KEY</code>. Chạy thêm
          <code> supabase/schema-rag.sql</code> trong SQL Editor nếu chưa tạo bảng.
        </p>
      )}

      <div className="grid gap-[24px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Nạp tài liệu mới */}
        <div className="flex flex-col gap-[14px]">
          <h3 className="subheading">Nạp tài liệu</h3>

          <Field label="Tiêu đề">
            <input
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="VD: Tử Vi Đẩu Số Tân Biên — chương Mệnh thân"
              className="field-input"
            />
          </Field>

          <Field label="Hệ phái">
            <select
              value={hePhai}
              onChange={(e) => setHePhai(e.target.value)}
              className="field-input"
            >
              {HE_PHAI.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nhan}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Chọn tệp (${DINH_DANG_NHAN_DUOC}) hoặc dán nội dung bên dưới`}>
            <input
              type="file"
              accept={DINH_DANG_NHAN_DUOC}
              onChange={chonTep}
              className="field-input"
            />
          </Field>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              Nội dung {noiDung && `— ${noiDung.length.toLocaleString('vi')} ký tự, khoảng ${soDoanUocTinh} đoạn`}
            </span>
            <textarea
              value={noiDung}
              onChange={(e) => setNoiDung(e.target.value)}
              rows={10}
              placeholder="Dán nội dung tài liệu tử vi vào đây…"
              className="field-input"
              style={{ borderRadius: 'var(--radius-cards)', resize: 'vertical' }}
            />
          </label>

          {thongBao && (
            <p
              className="text-[13px]"
              style={{
                color: thongBao.loai === 'loi' ? 'var(--chart-hung)' : 'var(--chart-cat)',
              }}
            >
              {thongBao.noiDung}
            </p>
          )}

          <button
            onClick={nap}
            disabled={dangNap || !tieuDe.trim() || noiDung.trim().length < 100}
            className="btn-primary self-start"
          >
            {dangNap ? 'Đang cắt đoạn và sinh vector…' : 'Nạp vào kho'}
          </button>
          {dangNap && (
            <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              Mỗi đoạn là một lần gọi API embedding, tài liệu dài sẽ mất vài chục giây.
            </p>
          )}
        </div>

        {/* Danh sách tài liệu */}
        <div className="flex flex-col gap-[10px]">
          <h3 className="subheading">
            Đã nạp {taiLieu.length > 0 && `(${taiLieu.length} tài liệu)`}
          </h3>

          {taiLieu.length === 0 && !chuaCauHinh && (
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              Kho đang trống. Luận giải vẫn chạy bằng kiến thức sẵn có của model.
            </p>
          )}

          {taiLieu.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-baseline justify-between gap-[10px] py-[12px]"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex flex-col gap-[3px]">
                <span className="text-[15px]" style={{ color: 'var(--fg)' }}>
                  {t.tieu_de}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {HE_PHAI.find((h) => h.id === t.he_phai)?.nhan ?? t.he_phai} · {t.so_chunk} đoạn ·{' '}
                  {t.so_ky_tu.toLocaleString('vi')} ký tự
                </span>
              </div>
              <button onClick={() => xoa(t.id, t.tieu_de)} className="link-text">
                Xoá
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
