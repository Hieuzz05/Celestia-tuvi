'use client';

import { useEffect, useRef, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import type { NguonTriThuc as Nguon } from '@/lib/ai/goiLuanGiai';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';
import { Shell } from '@/components/ui';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';

interface TinNhan {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
  model?: string;
  nguon?: Nguon[];
}

const GOI_Y = [
  'Tính cách nổi bật nhất của tôi là gì?',
  'Nghề nào hợp với lá số này?',
  'Năm nay tôi nên chú ý điều gì?',
  'Cung Phu Thê của tôi nói lên điều gì?',
];

export default function HoiDapPage() {
  const { duocVao, dangDoc } = useTaiKhoan();
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [hoSos, setHoSos] = useState<HoSo[]>([]);
  const [tinNhan, setTinNhan] = useState<TinNhan[]>([]);
  const [cauHoi, setCauHoi] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  // Phải chốt lá số trước khi mở khung chat: hỏi đáp mà chưa biết hỏi về lá số
  // nào thì câu trả lời vô nghĩa.
  const [daChonLaSo, setDaChonLaSo] = useState(false);
  const cuoiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
  }, []);

  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tinNhan, dangChay]);

  const laSo = (() => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({ ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh, hoTen: form.hoTen });
    } catch {
      return null;
    }
  })();

  // Đổi lá số thì hội thoại cũ không còn đúng ngữ cảnh nữa
  useEffect(() => {
    setTinNhan([]);
    setLoi(null);
    setDaChonLaSo(false);
  }, [form.ngaySinh, form.gio, form.gioiTinh]);

  const hoi = async (noiDung: string) => {
    const cau = noiDung.trim();
    if (!cau || dangChay) return;
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;

    const lichSu = tinNhan.map((t) => ({ vaiTro: t.vaiTro, noiDung: t.noiDung }));
    setTinNhan((ds) => [...ds, { vaiTro: 'nguoi-dung', noiDung: cau }]);
    setCauHoi('');
    setDangChay(true);
    setLoi(null);

    try {
      const res = await fetch('/api/hoi-dap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngay,
          thang,
          nam,
          gio: form.gio,
          gioiTinh: form.gioiTinh,
          hoTen: form.hoTen,
          cauHoi: cau,
          lichSu,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.loi ?? 'Không nhận được trả lời');
      setTinNhan((ds) => [
        ...ds,
        {
          vaiTro: 'tro-ly',
          noiDung: data.traLoi,
          model: data.model,
          nguon: data.nguonTriThuc,
        },
      ]);
    } catch {
      setLoi('Celestia chưa trả lời được lúc này. Câu hỏi của bạn vẫn được giữ — thử lại sau một chút.');
    } finally {
      setDangChay(false);
    }
  };

  // Chưa đăng nhập thì KHÔNG dựng phần nội dung sâu — spec v2 yêu cầu chặn
  // ở tầng đường dẫn, và server cũng chặn lại ở API tương ứng.
  if (dangDoc) return <Shell className="py-[48px]"><span /></Shell>;
  if (!duocVao)
    return (
      <Shell className="py-[48px]">
        <div className="mx-auto max-w-[620px]">
          <CongDangNhap nguon="ask_celes" />
        </div>
      </Shell>
    );

  return (
    <Shell className="flex flex-col gap-[20px] py-[20px]">
      <div>
        <p className="eyebrow">HỎI CELESTIA</p>
        <h1 className="heading mt-[10px]">Bạn đang muốn hiểu điều gì lúc này?</h1>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Cột trái: chọn lá số */}
        <div className="flex flex-col gap-[14px]">
          {hoSos.length > 0 && (
            <select
              className="field-input"
              defaultValue=""
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
            >
              <option value="">— Chọn một người đã lưu —</option>
              {hoSos.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hoTen || 'Không tên'} — {h.ngay}/{h.thang}/{h.nam}
                </option>
              ))}
            </select>
          )}

          <FormSinh giaTri={form} onChange={setForm} />

          {laSo && (
            <div
              className="flex flex-wrap gap-x-[14px] gap-y-[4px] pt-[12px] text-[13px]"
              style={{ color: 'var(--fg-muted)', borderTop: '1px solid var(--line)' }}
            >
              <span>
                Mệnh <b style={{ color: 'var(--fg)' }}>{CHI[laSo.menhIndex]}</b>
              </span>
              <span style={{ color: 'var(--fg)' }}>{laSo.cuc.ten}</span>
              <span>
                Thân cư <b style={{ color: 'var(--fg)' }}>{laSo.thanCuCung}</b>
              </span>
            </div>
          )}

          {!daChonLaSo ? (
            <button
              onClick={() => setDaChonLaSo(true)}
              disabled={!laSo}
              className="btn-primary self-start"
            >
              Dùng lá số này để hỏi đáp
            </button>
          ) : (
            <button onClick={() => setDaChonLaSo(false)} className="link-text self-start">
              Đổi lá số khác
            </button>
          )}
        </div>

        {/* Cột phải: hội thoại — chỉ mở sau khi đã chốt lá số */}
        {!daChonLaSo ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center gap-[10px] rounded-[var(--radius-cards)] border p-[24px] text-center"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            <h2 className="subheading">Chọn lá số trước</h2>
            <p className="body-text max-w-[420px]" style={{ color: 'var(--fg-muted)' }}>
              Nhập ngày giờ sinh ở bên trái (hoặc chọn một người đã lưu), rồi bấm
              <b style={{ color: 'var(--fg)' }}> Dùng lá số này để hỏi đáp</b>. AI cần biết đang
              nói về lá số nào thì câu trả lời mới có căn cứ.
            </p>
          </div>
        ) : (
        <div className="flex flex-col gap-[14px]">
          <div
            className="flex min-h-[380px] flex-col gap-[16px] overflow-y-auto rounded-[var(--radius-cards)] border p-[18px]"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--surface-card)',
              maxHeight: '58vh',
            }}
          >
            {tinNhan.length === 0 && !dangChay && (
              <div className="flex flex-col gap-[12px]">
                <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
                  AI đọc trực tiếp lá số bên trái để trả lời. Thử một câu gợi ý:
                </p>
                <div className="flex flex-wrap gap-[8px]">
                  {GOI_Y.map((g) => (
                    <button key={g} onClick={() => hoi(g)} className="pill-tag text-left">
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tinNhan.map((t, i) =>
              t.vaiTro === 'nguoi-dung' ? (
                <div key={i} className="flex justify-end">
                  <p
                    className="max-w-[80%] rounded-[var(--radius-cards)] px-[14px] py-[10px] text-[14px]"
                    style={{ background: 'var(--surface-panel)', color: 'var(--fg)' }}
                  >
                    {t.noiDung}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-[6px]">
                  <MarkdownLuanGiai noiDung={t.noiDung} nho />
                  <NguonTriThuc nguon={t.nguon} />
                  {t.model && (
                    <span className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
                      {t.model}
                    </span>
                  )}
                </div>
              )
            )}

            {dangChay && (
              <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                Celestia đang đọc lá số của bạn…
              </p>
            )}

            {loi && (
              <p className="text-[14px]" style={{ color: 'var(--chart-hung)' }}>
                {loi}
              </p>
            )}

            <div ref={cuoiRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              hoi(cauHoi);
            }}
            className="flex gap-[10px]"
          >
            <input
              value={cauHoi}
              onChange={(e) => setCauHoi(e.target.value)}
              placeholder="Hỏi về lá số này…"
              maxLength={800}
              className="field-input"
              disabled={dangChay || !laSo}
            />
            <button
              type="submit"
              disabled={dangChay || !cauHoi.trim() || !laSo}
              className="btn-primary shrink-0"
            >
              Gửi
            </button>
          </form>

          {tinNhan.length > 0 && (
            <button onClick={() => setTinNhan([])} className="link-text self-start">
              Xoá hội thoại
            </button>
          )}

          <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Nội dung do AI tạo ra, mang tính tham khảo — không thay thế tư vấn y tế, tài chính hay
            pháp lý.
          </p>
        </div>
        )}
      </section>
    </Shell>
  );
}
