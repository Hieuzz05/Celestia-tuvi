'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CauTraLoiV3, DangDocV3, type CauV3 } from '@/components/luangiai/CauTraLoiV3';
import { Eyebrow, Shell } from '@/components/ui';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { ghiSuKien } from '@/lib/analytics';
import { CAU_HOI_V3, CHU_DE_V3 } from '@/lib/rag/v3/khung';

/**
 * LUẬN GIẢI CHUYÊN SÂU v3 (CEL-119) — 14 chủ đề, 61 câu hỏi.
 *
 * Thay bản đọc sâu bốn chặng. Mỗi chủ đề là MỘT lượt gọi (các câu trong chủ
 * đề chạy song song ở máy chủ), và chỉ gọi khi người đọc mở tới chủ đề ấy: đọc
 * hết 14 chủ đề ngay khi vào trang là bắt người đọc chờ cho những thứ họ có thể
 * không bao giờ mở.
 *
 * Cần đăng nhập, không trừ hạn mức (chủ dự án chốt 23/09/2026). Bài đã đệm theo
 * lá số + năm + chủ đề, nên mở lại là tức thì.
 */

const SO_CAU = new Map(
  CHU_DE_V3.map((c) => [c.id, CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === c.id).length])
);

type TrangThai = { dang: true } | { dang: false; cau: CauV3[] | null; loi?: string };

function TrangSau() {
  const { duocVao, dangDoc } = useTaiKhoan();
  const params = useSearchParams();

  const ngay = Number(params.get('ngay'));
  const thang = Number(params.get('thang'));
  const nam = Number(params.get('nam'));
  const gio = Number(params.get('gio'));
  const gioiTinh = params.get('gt') === 'nu' ? 'nu' : 'nam';
  const namXem = Number(params.get('namXem')) || new Date().getFullYear();
  const coLaSo = Boolean(ngay && thang && nam && !Number.isNaN(gio));

  const [chon, setChon] = useState<string>(CHU_DE_V3[0].id);
  const [bai, setBai] = useState<Record<string, TrangThai>>({});

  /*
   * Chủ đề đang mở chưa có gì và chưa gửi yêu cầu → gửi. Mọi setState nằm trong
   * callback bất đồng bộ của fetch, không trong thân effect (luật lint kho này
   * đang giữ ở mốc bảy lỗi cũ). "Đã gửi" giữ bằng một tập riêng.
   */
  const [daGui] = useState(() => new Set<string>());
  useEffect(() => {
    if (!duocVao || !coLaSo || bai[chon] || daGui.has(chon)) return;
    daGui.add(chon);
    const chuDe = chon;
    ghiSuKien('deep_read_cta', { viTri: 'chuyen-sau-v3', chuDe });
    fetch('/api/luan-giai-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, namXem, nhom: chuDe }),
    })
      .then(async (res) => {
        const d = await res.json();
        setBai((cu) => ({
          ...cu,
          [chuDe]: res.ok
            ? { dang: false, cau: d.cau as CauV3[] }
            : { dang: false, cau: null, loi: d?.loi ?? 'Celes chưa viết được phần này.' },
        }));
      })
      .catch(() => {
        setBai((cu) => ({
          ...cu,
          [chuDe]: { dang: false, cau: null, loi: 'Không kết nối được. Thử lại sau ít phút.' },
        }));
      });
  }, [duocVao, coLaSo, chon, bai, daGui, ngay, thang, nam, gio, gioiTinh, namXem]);

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
          <h1 className="heading-sm">Luận giải chuyên sâu cần tài khoản</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Phần tổng quan mở cho mọi người. Đăng nhập để đọc sâu từng chủ đề và để Celes giữ bài
            đọc lại cho bạn.
          </p>
          <Link
            href={`/dang-nhap?intent=deep_read&next=${encodeURIComponent(`/luan-giai/sau?${params.toString()}`)}`}
            className="btn-primary self-start"
          >
            Đăng nhập
          </Link>
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
            Tạo lá số trước rồi quay lại — phần chuyên sâu đọc từ chính lá số đó.
          </p>
        </div>
      </Shell>
    );
  }

  const iChon = CHU_DE_V3.findIndex((c) => c.id === chon);
  const chuDe = CHU_DE_V3[iChon];
  const truoc = CHU_DE_V3[iChon - 1];
  const tiep = CHU_DE_V3[iChon + 1];
  const trangThai = bai[chon];
  const soDaDoc = CHU_DE_V3.filter((c) => {
    const tt = bai[c.id];
    return Boolean(tt && !tt.dang && tt.cau);
  }).length;
  const moChuDe = (id: string) => {
    setChon(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const thuLai = () => {
    daGui.delete(chon);
    setBai((cu) => {
      const moi = { ...cu };
      delete moi[chon];
      return moi;
    });
  };

  return (
    <Shell className="py-[32px]">
      <div className="flex flex-col gap-[24px] lg:flex-row lg:items-start lg:gap-[32px]">
        {/*
          ---------- Mục lục chủ đề ----------
          Máy tính: một thẻ dọc dính theo khi cuộn, mỗi dòng có số, tên, số câu
          và dấu đã đọc. Điện thoại: một hàng chip cuộn ngang — mười bốn dòng
          dọc đẩy bài đọc xuống dưới cả màn hình đầu.
        */}
        <nav
          aria-label="Chủ đề"
          className="shrink-0 lg:sticky lg:top-[80px] lg:w-[272px] lg:rounded-[var(--radius-cards)] lg:bg-[var(--surface-card)] lg:p-[16px] lg:shadow-[var(--shadow-card)]"
        >
          <div className="mb-[12px] flex items-baseline justify-between gap-[8px] lg:px-[8px]">
            <Eyebrow>Chủ đề</Eyebrow>
            <span className="caption" style={{ color: 'var(--fg-muted)' }}>
              Đã đọc {soDaDoc}/{CHU_DE_V3.length}
            </span>
          </div>
          <ol className="-mx-[16px] flex gap-[8px] overflow-x-auto px-[16px] pb-[4px] lg:mx-0 lg:flex-col lg:gap-[4px] lg:overflow-visible lg:px-0 lg:pb-0">
            {CHU_DE_V3.map((c, i) => {
              const tt = bai[c.id];
              const daDoc = Boolean(tt && !tt.dang && tt.cau);
              const dangMo = chon === c.id;
              return (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => moChuDe(c.id)}
                    aria-current={dangMo ? 'true' : undefined}
                    className="flex w-full items-center gap-[12px] whitespace-nowrap rounded-full border px-[12px] py-[8px] text-left text-[14px] transition-colors lg:whitespace-normal lg:rounded-[12px] lg:border-0"
                    style={{
                      borderColor: dangMo ? 'var(--accent)' : 'var(--line)',
                      background: dangMo ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      color: dangMo ? 'var(--fg)' : 'var(--fg-muted)',
                      fontWeight: dangMo ? 600 : 400,
                    }}
                  >
                    <span
                      className="inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                      style={
                        dangMo
                          ? { background: 'var(--accent)', color: 'var(--action-fg)' }
                          : daDoc
                            ? { background: 'var(--surface-panel)', color: 'var(--ok-fg)' }
                            : { border: '1px solid var(--line)', color: 'var(--fg-muted)' }
                      }
                      aria-hidden
                    >
                      {daDoc && !dangMo ? '✓' : i + 1}
                    </span>
                    <span className="flex-1">{c.ten}</span>
                    <span className="caption hidden lg:inline" style={{ color: 'var(--fg-muted)' }}>
                      {SO_CAU.get(c.id)} câu
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ---------- Bài của chủ đề đang mở ---------- */}
        <main className="flex min-w-0 flex-1 flex-col gap-[24px] lg:max-w-[700px]">
          <header className="flex flex-col items-start gap-[12px]">
            <span
              className="inline-flex items-center gap-[8px] rounded-full px-[12px] py-[4px] text-[13px] font-semibold uppercase tracking-[0.08em]"
              style={{
                background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                color: 'var(--accent)',
              }}
            >
              Luận giải chuyên sâu · Năm xem {namXem}
            </span>
            <h1 className="heading">{chuDe.ten}</h1>
          </header>

          {!trangThai || trangThai.dang ? (
            <DangDocV3 key={chon} />
          ) : trangThai.cau ? (
            <div className="flex flex-col gap-[32px]">
              {trangThai.cau.map((c, i) => (
                <CauTraLoiV3 key={c.id} cau={c} so={i + 1} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {trangThai.loi}
              </p>
              <button type="button" className="btn-outline btn-sm self-start" onClick={thuLai}>
                Thử lại
              </button>
            </div>
          )}

          {/* Cuối bài: lùi về chủ đề trước (viền) và đi tiếp (nút chính duy nhất) */}
          {trangThai && !trangThai.dang && (truoc || tiep) && (
            <div
              className="flex flex-wrap items-center gap-[12px] pt-[24px]"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              {truoc && (
                <button type="button" className="btn-outline" onClick={() => moChuDe(truoc.id)}>
                  ← Đọc lại: {truoc.ten}
                </button>
              )}
              {tiep && (
                <button type="button" className="btn-primary" onClick={() => moChuDe(tiep.id)}>
                  Đọc tiếp: {tiep.ten} →
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </Shell>
  );
}

export default function TrangLuanGiaiChuyenSau() {
  return (
    <Suspense fallback={<Shell className="py-[40px]">Đang mở bài đọc…</Shell>}>
      <TrangSau />
    </Suspense>
  );
}
