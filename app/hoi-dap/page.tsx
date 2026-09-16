'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import type { NguonTriThuc as Nguon } from '@/lib/ai/goiLuanGiai';
import { ghiSuKien } from '@/lib/analytics';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';
import { NutVien, Shell } from '@/components/ui';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';

interface TinNhan {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
  nguon?: Nguon[];
}

/**
 * Gợi ý mở đầu đi từ nỗi băn khoăn, không từ tính năng.
 *
 * Bản cũ mở lời bằng "Nghề nào hợp với lá số này?" — câu của người đang thử công
 * cụ, không phải của người đang vướng một chuyện. Brand spec xếp việc này vào
 * nhóm lỗi giọng: sản phẩm bán sự thấu hiểu mà lại mở lời bằng tra cứu.
 */
const GOI_Y = [
  'Tôi có nên đổi việc lúc này?',
  'Tôi đang cố giữ điều gì quá lâu?',
  'Mối quan hệ này đang cần điều gì từ tôi?',
  'Giai đoạn này đang muốn nói gì với tôi?',
];

function formTuHoSo(h: HoSo): ThongTinForm {
  return {
    hoTen: h.hoTen,
    ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
    gio: h.gio,
    gioiTinh: h.gioiTinh,
  };
}

/** Khoá nhận dạng một lá số — khoá đổi nghĩa là đang nói về người khác */
function khoaCua(form: ThongTinForm) {
  return `${form.ngaySinh}|${form.gio}|${form.gioiTinh}`;
}

function TrangHoiDap() {
  const { duocVao, dangDoc } = useTaiKhoan();
  const params = useSearchParams();
  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [hoSos, setHoSos] = useState<HoSo[]>([]);
  const [idHoSoChon, setIdHoSoChon] = useState('');
  const [tinNhan, setTinNhan] = useState<TinNhan[]>([]);
  const [cauHoi, setCauHoi] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hienFormSinh, setHienFormSinh] = useState(false);
  // Lá số đã chốt để hỏi, giữ bằng khoá chứ không phải cờ true/false: đổi ngày
  // sinh là khoá lệch ngay, nên không có đường nào lỡ hỏi tiếp trên lá số khác.
  const [khoaDaChot, setKhoaDaChot] = useState<string | null>(null);
  const cuoiRef = useRef<HTMLDivElement>(null);
  const daHoiTuUrl = useRef(false);

  // Tải danh sách người đã lưu, và chốt luôn người đầu tiên ngay trong callback:
  // vừa lập xong bản đồ mà sang đây lại phải khai lại ngày giờ sinh chính là lỗi
  // "đứt ngữ cảnh" bản audit chỉ đích danh.
  useEffect(() => {
    danhSachHoSo()
      .then((ds) => {
        setHoSos(ds);
        if (!ds[0]) return;
        const f = formTuHoSo(ds[0]);
        setForm(f);
        setIdHoSoChon(ds[0].id);
        setKhoaDaChot(khoaCua(f));
      })
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

  const daChonLaSo = khoaDaChot === khoaCua(form);

  const doiNguoi = (h: HoSo) => {
    const f = formTuHoSo(h);
    setForm(f);
    setIdHoSoChon(h.id);
    setKhoaDaChot(khoaCua(f));
    setTinNhan([]);
    setLoi(null);
  };

  const suaForm = (f: ThongTinForm) => {
    setForm(f);
    setIdHoSoChon('');
    // Đổi sang người khác thì hội thoại cũ không còn đúng ngữ cảnh nữa
    if (khoaCua(f) !== khoaDaChot) {
      setTinNhan([]);
      setLoi(null);
    }
  };

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
    ghiSuKien('ask_submitted');

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
        { vaiTro: 'tro-ly', noiDung: data.traLoi, nguon: data.nguonTriThuc },
      ]);
    } catch {
      setLoi('Celes chưa trả lời được lúc này. Câu hỏi của bạn vẫn được giữ — thử lại sau một chút.');
    } finally {
      setDangChay(false);
    }
  };

  // Câu mang sang từ ô "Hôm nay bạn đang nghĩ gì?" ở trang chủ. Chỉ gửi một lần
  // và chỉ sau khi đã chốt được lá số — sớm hơn là hỏi mà chưa biết hỏi về ai.
  useEffect(() => {
    const q = params.get('q');
    if (!q || daHoiTuUrl.current || !daChonLaSo || !laSo) return;
    daHoiTuUrl.current = true;
    ghiSuKien('post_signup_feature_resumed', { nguon: 'home_composer' });
    hoi(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, daChonLaSo, laSo]);

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
        <p className="eyebrow">HỎI CELES</p>
        <h1 className="heading mt-[10px]">Bạn đang băn khoăn điều gì?</h1>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Cột trái: đang nói về ai */}
        <div className="flex flex-col gap-[14px]">
          {hoSos.length > 0 && (
            <label className="flex flex-col gap-[6px]">
              <span className="field-label">Đang nói về</span>
              <select
                className="field-input"
                value={idHoSoChon}
                onChange={(e) => {
                  const h = hoSos.find((x) => x.id === e.target.value);
                  if (h) doiNguoi(h);
                }}
              >
                {idHoSoChon === '' && <option value="">— Người vừa nhập —</option>}
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || 'Không tên'} — {h.ngay}/{h.thang}/{h.nam}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Chưa lưu ai thì phải nhập; đã lưu rồi chỉ mở form khi muốn hỏi về
              một người khác. */}
          {(hoSos.length === 0 || hienFormSinh) && (
            <>
              <FormSinh giaTri={form} onChange={suaForm} />
              {!daChonLaSo && (
                <NutVien nho onClick={() => setKhoaDaChot(khoaCua(form))} disabled={!laSo}>
                  Hỏi về người này
                </NutVien>
              )}
            </>
          )}

          {hoSos.length > 0 && !hienFormSinh && (
            <button onClick={() => setHienFormSinh(true)} className="link-text self-start">
              Hỏi về một người khác
            </button>
          )}

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
        </div>

        {/* Cột phải: hội thoại — chỉ mở khi đã biết đang nói về ai */}
        {!daChonLaSo ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center gap-[10px] rounded-[var(--radius-cards)] border p-[24px] text-center"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            <h2 className="subheading">Celes cần biết đang nói về ai</h2>
            <p className="body-text max-w-[420px]" style={{ color: 'var(--fg-muted)' }}>
              Điền ngày giờ sinh ở bên trái rồi bấm{' '}
              <b style={{ color: 'var(--fg)' }}>Hỏi về người này</b>. Không có bản đồ thì câu trả
              lời chỉ còn là lời khuyên chung chung.
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
                    Celes đọc thẳng bản đồ bên trái để trả lời. Nếu chưa biết bắt đầu từ đâu:
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
                  /* Không in tên model ra đây: người dùng nói chuyện với Celes,
                     nhà cung cấp phía sau là chuyện của trang quản trị. */
                  <div key={i} className="flex flex-col gap-[6px]">
                    <MarkdownLuanGiai noiDung={t.noiDung} nho />
                    <NguonTriThuc nguon={t.nguon} />
                  </div>
                )
              )}

              {dangChay && (
                <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                  Celes đang đọc bản đồ của bạn…
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
                placeholder="Điều bạn đang nghĩ…"
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
              Celes đưa ra góc nhìn để bạn cân nhắc, không phải phán quyết — và không thay thế tư
              vấn y tế, tài chính hay pháp lý.
            </p>
          </div>
        )}
      </section>
    </Shell>
  );
}

export default function TrangHoiDapBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangHoiDap />
    </Suspense>
  );
}
