'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Field } from '@/components/FormSinh';
import { NhatKySuDung } from '@/components/NhatKySuDung';
import { QuanLyNguoiDung } from '@/components/QuanLyNguoiDung';
import { MODEL_GOI_Y, TEN_PROVIDER, type ProviderId } from '@/lib/ai/types';
import { Shell } from '@/components/ui';

interface ModelTrangThai {
  provider: ProviderId;
  model: string;
  priority: number;
  daCauHinh: boolean;
  keyMasked: string | null;
}

export default function AdminPage() {
  const [models, setModels] = useState<ModelTrangThai[]>([]);
  const [provider, setProvider] = useState<ProviderId>('gemini');
  const [model, setModel] = useState(MODEL_GOI_Y.gemini[0]);
  const [apiKey, setApiKey] = useState('');
  const [ketQua, setKetQua] = useState<{ ok: boolean; thongDiep: string; doTre?: number } | null>(
    null
  );
  const [dangTest, setDangTest] = useState(false);

  const taiTrangThai = () =>
    fetch('/api/ai/trang-thai')
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));

  useEffect(() => {
    taiTrangThai();
  }, []);

  const doiProvider = (p: ProviderId) => {
    setProvider(p);
    setModel(MODEL_GOI_Y[p][0]);
    setKetQua(null);
  };

  const test = async () => {
    setDangTest(true);
    setKetQua(null);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey: apiKey || undefined }),
      });
      setKetQua(await res.json());
    } catch (e) {
      setKetQua({ ok: false, thongDiep: e instanceof Error ? e.message : 'Lỗi không xác định' });
    } finally {
      setDangTest(false);
    }
  };

  return (
    <Shell className="flex flex-col gap-[36px] py-[36px]">
      <div>
        <p className="eyebrow">
          Quản trị hệ thống
        </p>
        <h1 className="display mt-[18px]">Model AI &amp; kho tri thức.</h1>
      </div>

      <section className="flex flex-col gap-[18px]">
        <h2 className="heading-sm">Chuỗi fallback hiện tại</h2>
        <p className="body-text max-w-[620px]" style={{ color: 'var(--fg-body)' }}>
          Khi một model hết lượt hoặc lỗi, hệ thống tự chuyển sang model kế tiếp theo thứ tự dưới
          đây. Thứ tự và API key khai báo bằng biến môi trường trên Vercel.
        </p>

        <div className="flex flex-col">
          {models.map((m) => (
            <div
              key={`${m.provider}-${m.model}`}
              className="flex flex-wrap items-baseline justify-between gap-[12px] py-[14px]"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="flex items-baseline gap-[14px]">
                <span
                  className="text-[13px] tabular-nums"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  #{m.priority + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-[15px]">{TEN_PROVIDER[m.provider]}</span>
                  <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                    {m.model}
                  </span>
                </div>
              </div>
              <span
                className="text-[13px]"
                style={{ color: m.daCauHinh ? 'var(--chart-cat)' : 'var(--fg-muted)' }}
              >
                {m.daCauHinh ? `Đã cấu hình · ${m.keyMasked}` : 'Chưa có API key'}
              </span>
            </div>
          ))}
          {models.length === 0 && (
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              Không đọc được trạng thái model.
            </p>
          )}
        </div>
      </section>

      <section className="flex max-w-[560px] flex-col gap-[24px]">
        <h2 className="heading-sm">Kiểm tra kết nối</h2>
        <p className="body-text" style={{ color: 'var(--fg-body)' }}>
          Dán API key để thử trước khi đưa lên Vercel. Key nhập ở đây chỉ dùng cho lần gọi thử,
          không được lưu lại.
        </p>

        <Field label="Nhà cung cấp">
          <select
            value={provider}
            onChange={(e) => doiProvider(e.target.value as ProviderId)}
            className="field-input"
          >
            {Object.entries(TEN_PROVIDER).map(([id, ten]) => (
              <option key={id} value={id}>
                {ten}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Model">
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="field-input"
            list="goi-y-model"
          />
        </Field>
        <datalist id="goi-y-model">
          {MODEL_GOI_Y[provider].map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <Field label="API key (để trống nếu muốn thử key đang cấu hình trên server)">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••"
            className="field-input"
            autoComplete="off"
          />
        </Field>

        <button onClick={test} disabled={dangTest} className="btn-primary self-start">
          {dangTest ? 'Đang kiểm tra…' : 'Test kết nối'}
        </button>

        {ketQua && (
          <p
            className="text-[14px]"
            style={{ color: ketQua.ok ? 'var(--chart-cat)' : 'var(--chart-hung)' }}
          >
            {ketQua.ok ? '✓ ' : '✕ '}
            {ketQua.thongDiep}
            {ketQua.doTre ? ` (${ketQua.doTre}ms)` : ''}
          </p>
        )}
      </section>

      <QuanLyNguoiDung />

      <NhatKySuDung />

      <div className="flex flex-col gap-[10px] pt-[8px]">
        <Link href="/admin/models" className="link-text">
          Model &amp; thứ tự dự phòng — thêm, đổi key, sắp thứ tự &rarr;
        </Link>
        <Link href="/admin/knowledge" className="link-text">
          Kho tri thức — nguồn, phiên bản, xuất bản →
        </Link>
        <Link href="/admin/retrieval-lab" className="link-text">
          Retrieval Lab — xem Celes lấy đoạn nào →
        </Link>
        <Link href="/admin/support" className="link-text">
          Tình hình Ủng hộ Celes →
        </Link>
      </div>


    </Shell>
  );
}
