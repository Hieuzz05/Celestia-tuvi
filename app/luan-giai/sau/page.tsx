'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CauTraLoiV3, type CauV3 } from '@/components/luangiai/CauTraLoiV3';
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
  const tiep = CHU_DE_V3[iChon + 1];
  const trangThai = bai[chon];
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
        {/* ---------- Mục lục chủ đề ---------- */}
        <nav className="shrink-0 lg:sticky lg:top-[80px] lg:w-[240px]">
          <Eyebrow className="mb-[10px]">Chủ đề</Eyebrow>
          <ol className="flex flex-wrap gap-x-[14px] gap-y-[8px] lg:flex-col lg:gap-[6px]">
            {CHU_DE_V3.map((c) => {
              const tt = bai[c.id];
              const daDoc = Boolean(tt && !tt.dang && tt.cau);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => moChuDe(c.id)}
                    className="text-left text-[14px]"
                    style={{
                      color: chon === c.id ? 'var(--accent)' : 'var(--fg-muted)',
                      fontWeight: chon === c.id ? 600 : 400,
                    }}
                  >
                    {daDoc ? '● ' : '○ '}
                    {c.ten}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ---------- Bài của chủ đề đang mở ---------- */}
        <main className="flex min-w-0 flex-1 flex-col gap-[28px] lg:max-w-[700px]">
          <header className="flex flex-col gap-[8px]">
            <Eyebrow>Luận giải chuyên sâu · năm xem {namXem}</Eyebrow>
            <h1 className="heading-lg">{chuDe.ten}</h1>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {SO_CAU.get(chuDe.id)} câu hỏi. Mỗi câu được luận từ nhiều cung cùng lúc — cung chính,
              các cung soi vào nó và những cung hỗ trợ — kèm phần căn cứ để bạn kiểm.
            </p>
          </header>

          {!trangThai || trangThai.dang ? (
            <div className="flex flex-col gap-[8px]">
              <p className="body-text" style={{ color: 'var(--fg)' }}>
                Celes đang đọc phần này
                <span className="dot-dang-doc" aria-hidden />
              </p>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Lần đầu mất khoảng nửa phút. Các lần mở sau sẽ hiện ngay.
              </p>
            </div>
          ) : trangThai.cau ? (
            <div className="flex flex-col gap-[36px]">
              {trangThai.cau.map((c) => (
                <CauTraLoiV3 key={c.id} cau={c} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {trangThai.loi}
              </p>
              <button type="button" className="btn-outline btn-sm self-start" onClick={thuLai}>
                Thử lại
              </button>
            </div>
          )}

          {tiep && trangThai && !trangThai.dang && (
            <button type="button" className="btn-outline self-start" onClick={() => moChuDe(tiep.id)}>
              Đọc tiếp: {tiep.ten} →
            </button>
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
