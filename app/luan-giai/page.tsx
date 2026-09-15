'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Field, FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { CHU_DE, type ChuDeId } from '@/lib/ai/prompt';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

interface ModelTrangThai {
  provider: string;
  model: string;
  daCauHinh: boolean;
}

/** Markdown tối giản: đủ cho ## đề mục, **đậm** và đoạn văn */
function RenderMarkdown({ noiDung }: { noiDung: string }) {
  const khoi = noiDung.split('\n').filter((d) => d.trim());
  return (
    <div className="flex flex-col gap-[14px]">
      {khoi.map((dong, i) => {
        const dam = (s: string) =>
          s.split(/\*\*(.+?)\*\*/g).map((phan, j) =>
            j % 2 === 1 ? (
              <strong key={j} style={{ color: 'var(--fg)' }}>
                {phan}
              </strong>
            ) : (
              <span key={j}>{phan}</span>
            )
          );
        if (dong.startsWith('## ')) {
          return (
            <h3
              key={i}
              className="heading-sm mt-[24px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {dong.slice(3)}
            </h3>
          );
        }
        if (dong.startsWith('# ')) {
          return (
            <h2 key={i} className="heading mt-[18px]">
              {dong.slice(2)}
            </h2>
          );
        }
        if (/^[-*]\s/.test(dong)) {
          return (
            <p key={i} className="body-text pl-[18px]" style={{ color: 'var(--fg-body)' }}>
              • {dam(dong.replace(/^[-*]\s/, ''))}
            </p>
          );
        }
        return (
          <p key={i} className="body-text" style={{ color: 'var(--fg-body)' }}>
            {dam(dong)}
          </p>
        );
      })}
    </div>
  );
}

function TrangLuanGiai() {
  const params = useSearchParams();
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [chuDe, setChuDe] = useState<ChuDeId>('tong-quan');
  const [namXem, setNamXem] = useState(new Date().getFullYear());
  const [thangXem, setThangXem] = useState(new Date().getMonth() + 1);
  const [cauHoi, setCauHoi] = useState('');
  const [modelChon, setModelChon] = useState('');
  const [models, setModels] = useState<ModelTrangThai[]>([]);
  const [hoSos, setHoSos] = useState<HoSo[]>([]);

  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<{ noiDung: string; model: string } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
    fetch('/api/ai/trang-thai')
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));
  }, []);

  // Nhận thông tin sinh khi bấm "Luận giải lá số này" từ trang lá số
  useEffect(() => {
    const ngay = Number(params.get('ngay'));
    const thang = Number(params.get('thang'));
    const nam = Number(params.get('nam'));
    if (!ngay || !thang || !nam) return;
    setForm({
      hoTen: params.get('ten') ?? '',
      ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
      gio: Number(params.get('gio')) || 9,
      gioiTinh: (params.get('gt') as ThongTinForm['gioiTinh']) || 'nam',
    });
  }, [params]);

  const laSo = useMemo(() => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({ ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh, hoTen: form.hoTen });
    } catch {
      return null;
    }
  }, [form]);

  const modelSanSang = models.filter((m) => m.daCauHinh);

  const chay = async () => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    try {
      const res = await fetch('/api/luan-giai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngay,
          thang,
          nam,
          gio: form.gio,
          gioiTinh: form.gioiTinh,
          hoTen: form.hoTen,
          chuDe,
          namXem,
          thangXem,
          cauHoi,
          model: modelChon || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.loi ?? 'Luận giải thất bại');
      setKetQua({ noiDung: data.noiDung, model: data.model });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setDangChay(false);
    }
  };

  return (
    <main className="flex flex-col gap-[36px] py-[36px]">
      <div>
        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          Luận giải bằng AI
        </p>
        <h1 className="display mt-[18px]">Lá số nói gì về bạn?</h1>
        <p className="body-text mt-[24px] max-w-[560px]" style={{ color: 'var(--fg-body)' }}>
          AI đọc trực tiếp dữ liệu an sao — tên sao, độ sáng, Tuần Triệt, tứ hóa — rồi diễn giải
          theo Nam phái, đối chiếu Bắc phái ở phần vận hạn.
        </p>
      </div>

      <section className="grid gap-[36px] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-[24px]">
          {hoSos.length > 0 && (
            <Field label="Chọn từ hồ sơ đã lưu">
              <select
                className="field-input"
                onChange={(e) => {
                  const h = hoSos.find((x) => x.id === e.target.value);
                  if (!h) return;
                  setForm({
                    hoTen: h.hoTen,
                    ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
                    gio: h.gio,
                    gioiTinh: h.gioiTinh,
                  });
                }}
                defaultValue=""
              >
                <option value="">— Nhập thủ công —</option>
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || 'Không tên'} — {h.ngay}/{h.thang}/{h.nam}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <FormSinh giaTri={form} onChange={setForm} />

          <Field label="Chủ đề luận giải">
            <select
              value={chuDe}
              onChange={(e) => setChuDe(e.target.value as ChuDeId)}
              className="field-input"
            >
              {Object.entries(CHU_DE).map(([id, cd]) => (
                <option key={id} value={id}>
                  {cd.nhan}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-[18px]">
            <Field label="Năm xem hạn">
              <input
                type="number"
                value={namXem}
                onChange={(e) => setNamXem(Number(e.target.value))}
                className="field-input"
              />
            </Field>
            <Field label="Tháng xem hạn">
              <select
                value={thangXem}
                onChange={(e) => setThangXem(Number(e.target.value))}
                className="field-input"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Câu hỏi riêng (tuỳ chọn)">
            <input
              value={cauHoi}
              onChange={(e) => setCauHoi(e.target.value)}
              placeholder="VD: Năm nay có nên chuyển việc không?"
              className="field-input"
            />
          </Field>

          <Field label="Model AI">
            <select
              value={modelChon}
              onChange={(e) => setModelChon(e.target.value)}
              className="field-input"
            >
              <option value="">Tự động (ưu tiên theo thứ tự cấu hình)</option>
              {modelSanSang.map((m) => (
                <option key={`${m.provider}|${m.model}`} value={`${m.provider}|${m.model}`}>
                  {m.provider} — {m.model}
                </option>
              ))}
            </select>
          </Field>

          <button onClick={chay} disabled={dangChay || !laSo} className="btn-primary self-start">
            {dangChay ? 'Đang luận giải…' : 'Luận giải'}
          </button>

          {modelSanSang.length === 0 && (
            <p className="text-[13px]" style={{ color: 'var(--accent)' }}>
              Chưa có model AI nào được cấu hình. Thêm API key trong biến môi trường (xem trang
              Quản trị) để bật luận giải.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[18px]">
          {laSo && (
            <div
              className="flex flex-wrap gap-x-[24px] gap-y-[6px] pb-[18px] text-[13px]"
              style={{ color: 'var(--fg-muted)', borderBottom: '1px solid var(--line)' }}
            >
              <span>
                Mệnh tại <b style={{ color: 'var(--fg)' }}>{CHI[laSo.menhIndex]}</b>
              </span>
              <span>
                Cục <b style={{ color: 'var(--fg)' }}>{laSo.cuc.ten}</b>
              </span>
              <span>
                Bản mệnh <b style={{ color: 'var(--fg)' }}>{laSo.banMenh.ten}</b>
              </span>
              <span>
                Thân cư <b style={{ color: 'var(--fg)' }}>{laSo.thanCuCung}</b>
              </span>
            </div>
          )}

          {dangChay && (
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              Đang đọc lá số và soạn luận giải… Quá trình này mất khoảng 15–45 giây.
            </p>
          )}

          {loi && (
            <div className="flex flex-col gap-[6px]">
              <p className="text-[14px]" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Nếu tất cả model đều lỗi, hệ thống đã tự thử lần lượt từng model trong danh sách
                fallback trước khi báo lỗi này.
              </p>
            </div>
          )}

          {ketQua && (
            <article className="flex flex-col gap-[12px]">
              <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Soạn bởi <span style={{ color: 'var(--accent)' }}>{ketQua.model}</span>
              </p>
              <RenderMarkdown noiDung={ketQua.noiDung} />
              <p className="mt-[18px] text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                Nội dung do AI tạo ra, mang tính tham khảo — không thay thế tư vấn chuyên môn về y
                tế, tài chính hay pháp lý.
              </p>
            </article>
          )}

          {!ketQua && !dangChay && !loi && (
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              Chọn chủ đề rồi bấm Luận giải để bắt đầu.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}


export default function LuanGiaiPage() {
  return (
    <Suspense fallback={<main className="py-[60px]">Đang tải…</main>}>
      <TrangLuanGiai />
    </Suspense>
  );
}
