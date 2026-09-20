'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ghiSuKien } from '@/lib/analytics';
import type { MucSau } from '@/lib/rag/ban-doc-sau';
import { CHANG, CHANG_CUA_MUC, MUC_CUA_CUNG } from '@/lib/tuvi/chang-cung';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';
import { NGUONG_NOI } from '@/lib/tuvi/do-noi-bat';
import { KhoiGuong } from './KhoiGuong';

/**
 * Một PHẦN ở bản đọc sâu.
 *
 * ---------------------------------------------------------------------------
 * NHÃN TIÊU CHÍ KHÔNG DÙNG THẺ TIÊU ĐỀ
 *
 * Spec mục 7.2 nói rõ: dùng `body-lg 18/600`, không dùng h3. Lý do đo được
 * ngay khi nhìn: mỗi phần có sáu tới bảy nhãn, nhân mười hai phần là hơn tám
 * mươi đề mục. Để chúng thành h3 thì trang biến thành một mục lục dài, và mắt
 * người đọc nhảy từ nhãn sang nhãn thay vì đọc văn.
 *
 * Nhãn ở đây là BIỂN CHỈ ĐƯỜNG trong một bài văn, không phải chương mục.
 */
export function MucDeepSection({
  muc,
  soChang,
  soPhan,
  onThuLai,
  duongHoi,
}: {
  muc: MucSau;
  soChang: number;
  soPhan: number;
  onThuLai?: () => void;
  duongHoi: (cauHoi: string) => string;
}) {
  const [moCanCu, setMoCanCu] = useState(false);

  /*
   * Phần chưa dựng được thì NÓI THẲNG.
   *
   * Spec mục 7.4: ship các phần pass, phần fail hiện câu thành thật và nút thử
   * lại. Bịa cho đủ mười hai phần là đúng thứ cả sản phẩm này được dựng ra để
   * không làm.
   */
  if (muc.thieuCanCu) {
    return (
      <section id={muc.id} className="flex flex-col gap-[10px] scroll-mt-[90px]">
        <p className="eyebrow">
          Chặng {soChang} · Phần {soPhan}
        </p>
        <h2 className="heading-sm">{muc.tieuDe}</h2>
        <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
          Celes chưa có đủ căn cứ để đi xa hơn ở phần này.
        </p>
        {onThuLai && (
          <button onClick={onThuLai} className="link-text self-start">
            Thử lại phần này
          </button>
        )}
      </section>
    );
  }

  const tieuChiThuong = muc.tieuChi.filter((t) => !t.laGuong);
  const guong = muc.tieuChi.find((t) => t.laGuong);

  // Phần mà cung gương ứng vào — để chân khối gương nói được đang nối đi đâu
  const mucGuong = MUC_CUA_CUNG[muc.cungGuong];
  const tenPhanGuong = mucGuong ? CHU_12_CUNG.vi[mucGuong]?.nhan : undefined;
  const tenChangGuong = mucGuong ? CHANG[CHANG_CUA_MUC[mucGuong]].tieuDe : undefined;

  return (
    <section id={muc.id} className="flex flex-col gap-[16px] scroll-mt-[90px]">
      <div className="flex flex-col gap-[6px]">
        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="eyebrow">
            Chặng {soChang} · Phần {soPhan}
          </span>
          {muc.doNoiBat >= NGUONG_NOI && (
            <span
              className="rounded-full px-[10px] py-[2px] text-[11px] font-semibold"
              style={{ background: 'var(--color-cream, #FFF1BD)', color: '#240029' }}
            >
              Đáng chú ý nhất
            </span>
          )}
        </div>

        <h2 className="heading-sm">{muc.tieuDe}</h2>

        {/* Dòng "Đọc từ" — nơi DUY NHẤT tên cung được hiện ở mặt trước */}
        <p
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--fg-muted)' }}
        >
          Đọc từ: {muc.cungGoc} · cùng {muc.cungTamHop.join(', ')} · soi qua {muc.cungGuong}
        </p>
      </div>

      <p className="text-[21px] font-semibold" style={{ color: 'var(--fg)', lineHeight: 1.45 }}>
        {muc.ketLuan}
      </p>

      {tieuChiThuong.map((t) => (
        <div key={t.nhan} className="flex flex-col gap-[6px]">
          {/* body-lg 18/600 — KHÔNG phải h3, xem ghi chú đầu tệp */}
          <p className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.nhan}
          </p>
          <p className="body-text" style={{ color: 'var(--fg-body)', lineHeight: 1.7 }}>
            {t.noiDung}
          </p>
          {t.luongNguoc && (
            <p className="body-sm" style={{ color: 'var(--fg-muted)', lineHeight: 1.65 }}>
              {t.luongNguoc}
            </p>
          )}
        </div>
      ))}

      {guong && (
        <KhoiGuong
          muc={muc}
          nhan={guong.nhan}
          noiDung={guong.noiDung}
          luongNguoc={guong.luongNguoc}
          tenPhanGuong={tenPhanGuong}
          tenChangGuong={tenChangGuong}
          onNhay={
            mucGuong
              ? () => document.getElementById(mucGuong)?.scrollIntoView({ behavior: 'smooth' })
              : undefined
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-[18px]">
        <button
          onClick={() => {
            const moi = !moCanCu;
            setMoCanCu(moi);
            if (moi) ghiSuKien('why_opened', { khoi: muc.id });
          }}
          className="link-text"
          aria-expanded={moCanCu}
        >
          {moCanCu ? 'Thu gọn' : 'Vì sao Celes nói vậy?'}
        </button>
        <Link href={duongHoi(muc.cauHoiGoiY)} className="link-text">
          Hỏi Celes về phần này
        </Link>
      </div>

      {/*
        WhyDrawer là accordion INLINE, không phải modal — spec mục 7.3.
        Modal cắt người đọc khỏi đoạn họ đang đọc, mà câu hỏi "vì sao" chỉ có
        nghĩa khi đứng cạnh chính câu vừa gây ra nó.
      */}
      {moCanCu && (
        <div
          className="flex flex-col gap-[10px] rounded-[14px] px-[16px] py-[14px]"
          style={{ background: 'var(--bg-soft, rgba(0,0,0,0.03))' }}
        >
          <p className="eyebrow">Celes dựa vào đâu</p>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Phần này đọc từ {muc.cungGoc}, đối chiếu với {muc.cungTamHop.join(' và ')}, rồi soi
            ngược qua {muc.cungGuong}. Độ nổi bật {muc.doNoiBat}/100 — con số này quyết định phần
            được viết dài hay ngắn.
          </p>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Mức chắc chắn:{' '}
            {muc.doNoiBat >= NGUONG_NOI
              ? 'nhiều tín hiệu cùng hướng'
              : muc.doNoiBat <= 30
                ? 'ít tín hiệu — đọc như một nền phẳng'
                : 'có tín hiệu, chưa áp đảo'}
            .
          </p>
        </div>
      )}
    </section>
  );
}
