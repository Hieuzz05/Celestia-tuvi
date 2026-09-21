'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Field } from '@/components/FormSinh';
import { Eyebrow, Shell, The } from '@/components/ui';

/**
 * Model & Routing — chuỗi model và thứ tự dự phòng, sửa ngay tại đây.
 *
 * Trước đây muốn thêm một nhà cung cấp là phải sửa biến môi trường trên Vercel
 * rồi chờ deploy. Với các free tier đổi tên model vài tháng một lần, vòng đó quá
 * chậm — và lúc model chính sập thì không ai muốn chờ một lượt build.
 *
 * API key đi một chiều: gõ vào thì gửi lên, không bao giờ nhận về. Thứ hiện ở
 * đây luôn là dạng rút gọn do máy chủ trả xuống.
 */

interface Dong {
  id: string;
  provider: string;
  model: string;
  coKeyRieng: boolean;
  uuTien: number;
  bat: boolean;
  ghiChu: string | null;
  daCoKey: boolean;
  keyRutGon: string | null;
}

interface DuLieu {
  tuDatabase: boolean;
  dong: Dong[];
  thieuTrongDanhSach: { provider: string; keyRutGon: string }[];
  coKhoaMaHoa: boolean;
  provider: string[];
}

const NHAN_PROVIDER: Record<string, string> = {
  gemini: 'Google Gemini',
  groq: 'Groq',
  cerebras: 'Cerebras',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

async function docCauHinh(): Promise<DuLieu | { loi: string }> {
  try {
    const res = await fetch('/api/admin/models', { cache: 'no-store' });
    const j = await res.json();
    if (!res.ok) return { loi: j.loi ?? 'Không đọc được cấu hình' };
    return j as DuLieu;
  } catch {
    return { loi: 'Không kết nối được máy chủ' };
  }
}

export default function TrangModel() {
  const [d, setD] = useState<DuLieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [dangThu, setDangThu] = useState<string | null>(null);
  const [ketQuaThu, setKetQuaThu] = useState<Record<string, { ok: boolean; thongDiep: string }>>({});
  const [moThem, setMoThem] = useState(false);
  const [suaKey, setSuaKey] = useState<string | null>(null);

  // Hàm đọc để RỖNG khỏi setState, và việc đặt state nằm ở `.then` — đây là hình
  // dạng mà quy tắc set-state-in-effect chấp nhận, và cũng đúng tinh thần của nó:
  // effect đồng bộ dữ liệu từ bên ngoài vào React qua callback, không gọi thẳng.
  const tai = useCallback(async () => {
    const kq = await docCauHinh();
    if ('loi' in kq) setLoi(kq.loi);
    else {
      setLoi(null);
      setD(kq);
    }
  }, []);

  useEffect(() => {
    docCauHinh().then((kq) => {
      if ('loi' in kq) setLoi(kq.loi);
      else setD(kq);
    });
  }, []);

  async function goi(cach: string, than?: unknown, truyVan = '') {
    setThongBao(null);
    const res = await fetch(`/api/admin/models${truyVan}`, {
      method: cach,
      headers: { 'Content-Type': 'application/json' },
      body: than ? JSON.stringify(than) : undefined,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setThongBao(j.loi ?? 'Không thực hiện được');
      return false;
    }
    await tai();
    return true;
  }

  /** Chuyển sang thứ tự mới: hiện ngay rồi mới gọi máy chủ */
  async function sapLai(ds: Dong[]) {
    if (!d) return;
    // Đổi chỗ mà phải chờ mạng thì bấm hai lần liên tiếp sẽ nhảy lung tung.
    setD({ ...d, dong: ds });
    await goi('PUT', { thuTu: ds.map((x) => x.id) });
  }

  async function doiCho(i: number, huong: -1 | 1) {
    if (!d) return;
    const ds = [...d.dong];
    const j = i + huong;
    if (j < 0 || j >= ds.length) return;
    [ds[i], ds[j]] = [ds[j], ds[i]];
    await sapLai(ds);
  }

  /** Đưa một dòng lên đầu — "tôi muốn model này chạy trước" là ý định hay gặp
   *  nhất, và bấm Lên bốn lần để làm việc đó là thừa. */
  async function lenDau(i: number) {
    if (!d || i === 0) return;
    const ds = [...d.dong];
    const [x] = ds.splice(i, 1);
    await sapLai([x, ...ds]);
  }

  /** Chép chuỗi từ biến môi trường xuống database để bắt đầu quản lý tại đây */
  async function khoiTao() {
    if (await goi('POST', { hanhDong: 'khoi-tao' })) {
      setThongBao(null);
    }
  }

  async function thu(id: string) {
    setDangThu(id);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      setKetQuaThu((s) => ({ ...s, [id]: { ok: Boolean(j.ok), thongDiep: j.thongDiep ?? '' } }));
    } catch {
      setKetQuaThu((s) => ({ ...s, [id]: { ok: false, thongDiep: 'Không gọi được' } }));
    } finally {
      setDangThu(null);
    }
  }

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · AI &amp; TRI THỨC</Eyebrow>
        <h1 className="heading-sm">Model &amp; thứ tự dự phòng</h1>
        <div className="mt-[10px] flex flex-wrap gap-[16px]">
          <Link href="/admin" className="link-text">← Trang quản trị</Link>
          <Link href="/admin/knowledge" className="link-text">Kho tri thức →</Link>
        </div>
        <p className="body-sm mt-[12px]" style={{ color: 'var(--fg-muted)' }}>
          Celes gọi lần lượt từ trên xuống. Model đầu tiên trả lời được là dừng — nên thứ tự ở đây
          quyết định model nào chạy thường ngày, và model nào chỉ đỡ khi bên trên hỏng.
        </p>
      </div>

      {loi && (
        <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
          {loi}
        </p>
      )}

      {d && !d.coKhoaMaHoa && (
        <div
          className="rounded-[var(--radius-cards)] border p-[14px] text-[13px]"
          style={{ borderColor: 'var(--chart-hung)', color: 'var(--chart-hung)' }}
        >
          Chưa đặt <code>CONFIG_SECRET</code> nên chưa lưu được API key ở đây. Thêm biến đó vào
          <code> .env.local</code> và Vercel (một chuỗi ngẫu nhiên dài) rồi tải lại trang. Hệ thống
          cố ý không lưu key dạng thô.
        </div>
      )}

      {d && !d.tuDatabase && (
        <div
          className="flex flex-col items-start gap-[12px] rounded-[var(--radius-cards)] p-[16px]"
          style={{ background: 'var(--surface-panel)' }}
        >
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Danh sách dưới đây đang đọc từ <strong>biến môi trường</strong>, nên chưa sắp lại thứ tự
            được — muốn sắp thì các dòng phải nằm trong database đã. Bấm nút bên dưới để chép nguyên
            chuỗi đang chạy xuống, không model nào bị mất và không có gì đổi cho tới khi bạn tự sắp.
          </p>
          <button onClick={khoiTao} className="btn-primary">
            Chuyển sang quản lý tại đây
          </button>
        </div>
      )}

      {thongBao && (
        <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
          {thongBao}
        </p>
      )}

      <section className="flex flex-col gap-[12px]">
        {d?.dong.map((x, i) => {
          const kq = ketQuaThu[x.id];
          return (
            <The key={x.id || `${x.provider}-${x.model}`} className="flex flex-col gap-[12px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div className="flex items-start gap-[12px]">
                  <span
                    className="mt-[2px] text-[13px] tabular-nums"
                    style={{ color: 'var(--fg-subtle)' }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-medium" style={{ color: 'var(--fg)' }}>
                      {NHAN_PROVIDER[x.provider] ?? x.provider}
                      {!x.bat && ' · đang tắt'}
                    </p>
                    <p className="caption mt-[2px]" style={{ color: 'var(--fg-muted)' }}>
                      {x.model}
                    </p>
                    <p className="caption mt-[4px]" style={{ color: 'var(--fg-muted)' }}>
                      {x.daCoKey
                        ? `${x.keyRutGon} · ${x.coKeyRieng ? 'key lưu tại đây' : 'key từ biến môi trường'}`
                        : 'chưa có key'}
                    </p>
                  </div>
                </div>

                {x.id && (
                  <div className="flex flex-wrap items-center gap-[12px]">
                    <button onClick={() => lenDau(i)} disabled={i === 0} className="caption underline">
                      Lên đầu
                    </button>
                    <button onClick={() => doiCho(i, -1)} disabled={i === 0} className="caption underline">
                      Lên
                    </button>
                    <button
                      onClick={() => doiCho(i, 1)}
                      disabled={i === d.dong.length - 1}
                      className="caption underline"
                    >
                      Xuống
                    </button>
                    <button
                      onClick={() => goi('PATCH', { id: x.id, bat: !x.bat })}
                      className="caption underline"
                    >
                      {x.bat ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => setSuaKey(suaKey === x.id ? null : x.id)} className="caption underline">
                      Đổi key
                    </button>
                    <button onClick={() => thu(x.id)} disabled={dangThu === x.id} className="caption underline">
                      {dangThu === x.id ? 'Đang thử…' : 'Thử kết nối'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xoá ${NHAN_PROVIDER[x.provider] ?? x.provider} / ${x.model} khỏi chuỗi?`)) {
                          void goi('DELETE', undefined, `?id=${x.id}`);
                        }
                      }}
                      className="caption underline"
                      style={{ color: 'var(--chart-hung)' }}
                    >
                      Xoá
                    </button>
                  </div>
                )}
              </div>

              {kq && (
                <p
                  className="body-sm"
                  style={{ color: kq.ok ? 'var(--chart-cat)' : 'var(--chart-hung)' }}
                >
                  {kq.ok ? '✓ ' : '✕ '}
                  {kq.thongDiep}
                </p>
              )}

              {suaKey === x.id && (
                <DoiKey
                  onLuu={async (key) => {
                    if (await goi('PATCH', { id: x.id, apiKey: key })) setSuaKey(null);
                  }}
                  onBoKey={async () => {
                    if (await goi('PATCH', { id: x.id, boKey: true })) setSuaKey(null);
                  }}
                  onHuy={() => setSuaKey(null)}
                  coKeyRieng={x.coKeyRieng}
                />
              )}
            </The>
          );
        })}
      </section>

      {d && d.thieuTrongDanhSach.length > 0 && (
        <div
          className="rounded-[var(--radius-cards)] p-[14px] text-[13px]"
          style={{ background: 'var(--surface-panel)', color: 'var(--fg-muted)' }}
        >
          Có key trong biến môi trường nhưng chưa nằm trong chuỗi:{' '}
          {d.thieuTrongDanhSach.map((x) => `${NHAN_PROVIDER[x.provider] ?? x.provider} (${x.keyRutGon})`).join(', ')}.
          Thêm vào bên dưới nếu muốn dùng làm lưới đỡ.
        </div>
      )}

      {moThem ? (
        <ThemModel
          provider={d?.provider ?? []}
          onXong={async (than) => {
            if (await goi('POST', than)) setMoThem(false);
          }}
          onHuy={() => setMoThem(false)}
        />
      ) : (
        <button onClick={() => setMoThem(true)} className="btn-primary self-start">
          Thêm model
        </button>
      )}
    </Shell>
  );
}

function DoiKey({
  onLuu,
  onBoKey,
  onHuy,
  coKeyRieng,
}: {
  onLuu: (key: string) => void;
  onBoKey: () => void;
  onHuy: () => void;
  coKeyRieng: boolean;
}) {
  const [key, setKey] = useState('');
  return (
    <div className="flex flex-col gap-[12px] border-t pt-[12px]" style={{ borderColor: 'var(--line)' }}>
      <Field label="API key mới">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="field-input"
          autoComplete="off"
          placeholder="Dán key vào đây"
        />
      </Field>
      <div className="flex flex-wrap gap-[12px]">
        <button onClick={() => onLuu(key)} disabled={!key.trim()} className="btn-primary">
          Lưu key
        </button>
        {coKeyRieng && (
          <button onClick={onBoKey} className="link-text">
            Bỏ key riêng, quay về dùng biến môi trường
          </button>
        )}
        <button onClick={onHuy} className="link-text">
          Huỷ
        </button>
      </div>
    </div>
  );
}

function ThemModel({
  provider,
  onXong,
  onHuy,
}: {
  provider: string[];
  onXong: (than: { provider: string; model: string; apiKey?: string; ghiChu?: string }) => void;
  onHuy: () => void;
}) {
  const [p, setP] = useState(provider[0] ?? 'gemini');
  const [model, setModel] = useState('');
  const [key, setKey] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  return (
    <The className="flex flex-col gap-[12px]">
      <Eyebrow>Thêm model</Eyebrow>

      <div className="grid gap-[12px] md:grid-cols-2">
        <Field label="Nhà cung cấp">
          <select value={p} onChange={(e) => setP(e.target.value)} className="field-input">
            {provider.map((x) => (
              <option key={x} value={x}>
                {NHAN_PROVIDER[x] ?? x}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tên model">
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="field-input"
            placeholder="gpt-4o-mini"
          />
        </Field>
      </div>

      <Field label="API key (để trống nếu muốn dùng key từ biến môi trường)">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="field-input"
          autoComplete="off"
        />
      </Field>

      <Field label="Ghi chú">
        <input
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          className="field-input"
          placeholder="Ví dụ: đã nạp tiền, dùng làm model chính"
        />
      </Field>

      <p className="caption" style={{ color: 'var(--fg-muted)' }}>
        Tên model phải đúng như nhà cung cấp đặt. Sai tên sẽ báo lỗi 404 khi thử kết nối — các free
        tier đổi tên model khá thường, nên thử ngay sau khi thêm.
      </p>

      <div className="flex gap-[12px]">
        <button
          onClick={() => onXong({ provider: p, model: model.trim(), apiKey: key.trim() || undefined, ghiChu })}
          disabled={!model.trim()}
          className="btn-primary"
        >
          Thêm vào cuối chuỗi
        </button>
        <button onClick={onHuy} className="link-text">
          Huỷ
        </button>
      </div>
    </The>
  );
}
