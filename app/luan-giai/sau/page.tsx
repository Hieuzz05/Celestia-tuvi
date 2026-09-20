'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CongUngHo } from '@/components/support/CongUngHo';
import { MucDeepSection } from '@/components/luangiai/MucDeepSection';
import { SoDoBonChang } from '@/components/luangiai/SoDoBonChang';
import { Eyebrow, Shell } from '@/components/ui';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { ghiSuKien } from '@/lib/analytics';
import type { ChangSau } from '@/lib/rag/ban-doc-sau';
import { THU_TU_CHANG, type ChangId, type MucId } from '@/lib/tuvi/chang-cung';

/**
 * BẢN ĐỌC SÂU — reader ba cột.
 *
 * ---------------------------------------------------------------------------
 * GỌI BỐN LƯỢT, KHÔNG GỌI MỘT LƯỢT
 *
 * Cả bài mất 153 giây để viết, mà trần một request trên Vercel là 60. Nên
 * trang này gọi từng chặng một và vẽ ngay khi chặng ấy về — người đọc bắt đầu
 * đọc chặng một trong khi chặng hai đang được viết.
 *
 * Đó cũng là lý do KHÔNG có màn chờ toàn trang: chờ 153 giây trước một màn
 * trắng là thứ không ai chịu được, còn đọc dần thì thời gian ấy biến mất.
 */

const TEN_CHANG_CHO: Record<ChangId, string> = {
  'ben-trong': 'Thế giới bên trong bạn',
  'con-duong': 'Con đường bạn gây dựng',
  'sat-canh': 'Những người sát cánh cùng bạn',
  'de-lai': 'Từ nơi bạn đến, đến điều bạn để lại',
};

function TrangSau() {
  const { duocVao, dangDoc } = useTaiKhoan();
  const params = useSearchParams();

  const [chang, setChang] = useState<ChangSau[]>([]);
  const [dangViet, setDangViet] = useState<ChangId | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [moCong, setMoCong] = useState(false);
  const [dangXem, setDangXem] = useState<MucId | null>(null);
  // Tên sao và cách cục CÓ THẬT trên lá số — dùng để tô màu, xem ChuSao.tsx
  const [tenCoThat, setTenCoThat] = useState<string[]>([]);
  const daChay = useRef(false);

  const ngay = Number(params.get('ngay'));
  const thang = Number(params.get('thang'));
  const nam = Number(params.get('nam'));
  const gio = Number(params.get('gio'));
  const gioiTinh = params.get('gt') === 'nu' ? 'nu' : 'nam';
  const coLaSo = Boolean(ngay && thang && nam && !Number.isNaN(gio));

  const goiMotChang = useCallback(
    async (id: ChangId): Promise<ChangSau | null> => {
      const res = await fetch('/api/ban-doc-sau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, chang: id }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d?.canUngHo) {
          setLoi(d.loi);
          setMoCong(true);
        } else {
          setLoi(d?.loi ?? 'Celes chưa viết được phần này.');
        }
        return null;
      }
      if (Array.isArray(d.tenCoThat)) setTenCoThat(d.tenCoThat as string[]);
      return d.chang as ChangSau;
    },
    [ngay, thang, nam, gio, gioiTinh]
  );

  useEffect(() => {
    if (!duocVao || !coLaSo || daChay.current) return;
    daChay.current = true;
    let huy = false;

    (async () => {
      ghiSuKien('deep_read_cta', { viTri: 'ban-doc-sau' });
      for (const id of THU_TU_CHANG) {
        if (huy) return;
        setDangViet(id);
        const c = await goiMotChang(id);
        if (huy) return;
        if (!c) break;
        setChang((cu) => [...cu, c]);
      }
      if (!huy) setDangViet(null);
    })();

    return () => {
      huy = true;
    };
  }, [duocVao, coLaSo, goiMotChang]);

  if (dangDoc) {
    return (
      <Shell className="py-[48px]">
        <span />
      </Shell>
    );
  }

  if (!duocVao) {
    return (
      <Shell className="py-[48px]">
        <div className="card mx-auto flex max-w-[520px] flex-col gap-[12px]">
          <h1 className="heading-sm">Bản đọc sâu cần tài khoản</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Đăng nhập để Celes giữ bài đọc này lại cho bạn.
          </p>
        </div>
      </Shell>
    );
  }

  if (!coLaSo) {
    return (
      <Shell className="py-[48px]">
        <div className="card mx-auto flex max-w-[520px] flex-col gap-[12px]">
          <h1 className="heading-sm">Chưa có lá số</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Tạo lá số trước rồi quay lại — bản đọc sâu đọc từ chính lá số đó.
          </p>
        </div>
      </Shell>
    );
  }

  const duongHoi = (cauHoi: string) => `/hoi-dap?q=${encodeURIComponent(cauHoi)}`;
  const nhay = (m: MucId) => {
    setDangXem(m);
    document.getElementById(m)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Shell className="py-[32px]">
      <div className="flex flex-col gap-[28px] lg:flex-row lg:items-start lg:gap-[36px]">
        {/* ---------- Cột trái: mục lục ---------- */}
        <nav className="hidden shrink-0 lg:block lg:w-[230px] lg:sticky lg:top-[80px]">
          <Eyebrow className="mb-[10px]">Mục lục</Eyebrow>
          <ol className="flex flex-col gap-[14px]">
            {chang.map((c) => (
              <li key={c.id} className="flex flex-col gap-[4px]">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.thuTu}. {c.tieuDe}
                </span>
                {c.muc.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => nhay(m.id)}
                    className="text-left text-[13px]"
                    style={{ color: dangXem === m.id ? 'var(--accent)' : 'var(--fg-muted)' }}
                  >
                    {m.doNoiBat >= 70 ? '● ' : m.doNoiBat >= 40 ? '◐ ' : '○ '}
                    {m.tieuDe}
                  </button>
                ))}
              </li>
            ))}
          </ol>
        </nav>

        {/* ---------- Cột giữa: bài ---------- */}
        <main className="flex min-w-0 flex-1 flex-col gap-[36px] lg:max-w-[680px]">
          <header className="flex flex-col gap-[8px]">
            <Eyebrow>Bản đọc sâu</Eyebrow>
            <h1 className="heading-lg">Mười hai phần, mỗi phần soi bằng một phần khác</h1>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              Celes đọc từng phần qua cung gốc, hai cung cùng tam hợp và cung đối diện — rồi nối
              chúng lại thành bốn chặng.
            </p>
          </header>

          {/* Sơ đồ chèn sau phần mở đầu ở mobile — spec mục 7.2 */}
          <div className="lg:hidden">
            <SoDoBonChang dangDoc={dangXem} onChon={nhay} />
          </div>

          {chang.map((c) => (
            <section key={c.id} className="flex flex-col gap-[28px]">
              <div className="flex flex-col gap-[4px]">
                <span className="eyebrow">Chặng {c.thuTu}</span>
                <h2 className="text-[24px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.tieuDe}
                </h2>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {c.subtitle}
                </p>
              </div>

              {c.muc.map((m, i) => (
                <MucDeepSection
                  key={m.id}
                  muc={m}
                  soChang={c.thuTu}
                  soPhan={i + 1}
                  duongHoi={duongHoi}
                  tenCoThat={tenCoThat}
                />
              ))}

              {c.doanKhau && (
                <div
                  className="flex flex-col gap-[8px] pl-[14px]"
                  style={{ borderLeft: '2px solid var(--line)' }}
                >
                  <p className="eyebrow">Ba phần này nói cùng điều gì</p>
                  <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    {c.doanKhau}
                  </p>
                  {c.cauBacCau && (
                    <p className="body-text" style={{ color: 'var(--fg)' }}>
                      {c.cauBacCau}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}

          {/*
            Khung chờ mang TÊN THẬT của chặng đang viết, không phải "đang tải".
            Spec mục 7.4: skeleton hiện tên + subtitle chặng thật, và dòng trạng
            thái nói bằng lời đời thường — cấm nhắc "AI" hay "model".
          */}
          {dangViet && (
            <section className="flex flex-col gap-[8px]">
              <span className="eyebrow">Chặng {THU_TU_CHANG.indexOf(dangViet) + 1}</span>
              <h2 className="text-[24px] font-semibold" style={{ color: 'var(--fg-muted)' }}>
                {TEN_CHANG_CHO[dangViet]}
              </h2>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Celes đang đọc phần này
                <span className="dot-dang-doc" aria-hidden />
              </p>
            </section>
          )}

          {loi && !moCong && (
            <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
              {loi}
            </p>
          )}
        </main>

        {/* ---------- Cột phải: sơ đồ ---------- */}
        <aside className="hidden shrink-0 xl:block xl:w-[250px] xl:sticky xl:top-[80px]">
          <SoDoBonChang dangDoc={dangXem} onChon={nhay} />
        </aside>
      </div>

      {moCong && (
        <CongUngHo
          lyDo="long_report"
          onDong={() => setMoCong(false)}
          quayLai={{ path: '/luan-giai/sau' }}
        />
      )}
    </Shell>
  );
}

export default function TrangBanDocSau() {
  return (
    <Suspense fallback={<Shell className="py-[40px]">Đang mở bài đọc…</Shell>}>
      <TrangSau />
    </Suspense>
  );
}
