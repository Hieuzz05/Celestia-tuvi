'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CongUngHo } from '@/components/support/CongUngHo';
import { Eyebrow, NhanPill, NutChinh, The } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useT } from '@/lib/i18n/context';
import type { KhoiLuanGiai } from '@/lib/tuvi/luan-giai-sau';

/**
 * Bảng luận giải theo lĩnh vực — phần mở ra sau khi đăng nhập.
 *
 * Mỗi khối giữ đúng một trật tự: kết luận trước, chi tiết sau, căn cứ nằm dưới
 * và mặc định đóng. Trật tự đó là điều spec nhấn mạnh: thuật ngữ chuyên sâu
 * không được chiếm lớp hiển thị đầu tiên, nhưng cũng không được giấu đi.
 */
export function BangLuanGiai({
  khoi,
  duongHoi,
  day = true,
  duongVe = '/la-so',
}: {
  khoi: KhoiLuanGiai[];
  /** Dựng đường sang Hỏi Celes kèm sẵn câu hỏi của khối */
  duongHoi: (cauHoi: string) => string;
  /** Đã mở quyền đọc đầy đủ chưa; chưa thì máy chủ chỉ gửi câu kết luận */
  day?: boolean;
  duongVe?: string;
}) {
  const t = useT();
  const [moCong, setMoCong] = useState(false);

  return (
    <section className="flex flex-col gap-[20px]">
      <div>
        <Eyebrow className="mb-[10px]">{t.luanSau.eyebrow}</Eyebrow>
        <h2 className="heading-sm">{t.luanSau.tieuDe}</h2>
        <p className="body-sm mt-[8px] max-w-[640px]" style={{ color: 'var(--fg-muted)' }}>
          {t.luanSau.moTa}
        </p>
      </div>

      <div className="flex flex-col gap-[16px]">
        {khoi.map((k) => (
          <KhoiCard key={k.id} khoi={k} duongHoi={duongHoi} day={day} />
        ))}
      </div>

      {/* Chưa mở quyền: vẫn thấy tám câu kết luận ở trên, nên biết rõ mình đang
          đổi lấy cái gì. Ẩn sạch là mất luôn lý do để ủng hộ. */}
      {!day && (
        <The className="flex flex-col gap-[12px]">
          <Eyebrow>{t.ungHo.ten}</Eyebrow>
          <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.ungHo.cong.deep_map.tieuDe}
          </h3>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.ungHo.cong.deep_map.moTa}
          </p>
          <NutChinh onClick={() => setMoCong(true)} className="self-start">
            {t.ungHo.cong.deep_map.cta}
          </NutChinh>
          <p className="caption">{t.ungHo.khongPhuThuocSoTien}</p>
        </The>
      )}

      {moCong && (
        <CongUngHo
          lyDo="deep_map"
          onDong={() => setMoCong(false)}
          quayLai={{ path: duongVe }}
        />
      )}
    </section>
  );
}

function KhoiCard({
  khoi,
  duongHoi,
  day,
}: {
  khoi: KhoiLuanGiai;
  duongHoi: (cauHoi: string) => string;
  day: boolean;
}) {
  const t = useT();
  const [moCanCu, setMoCanCu] = useState(false);

  const doiTrangThai = () => {
    const moi = !moCanCu;
    setMoCanCu(moi);
    if (moi) ghiSuKien('why_opened', { khoi: khoi.id });
  };

  return (
    <The className="flex flex-col gap-[12px]">
      <Eyebrow>{khoi.nhomChu}</Eyebrow>

      <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
        {khoi.tieuDe}
      </h3>

      <p className="body-text" style={{ color: 'var(--fg)' }}>
        {khoi.ketLuan}
      </p>

      {khoi.doan.map((d, i) => (
        <p key={i} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {d}
        </p>
      ))}

      <div className="flex flex-wrap items-center gap-[18px]">
        {day && (
          <button onClick={doiTrangThai} className="link-text" aria-expanded={moCanCu}>
            {moCanCu ? t.quickRead.viSaoDong : t.quickRead.viSao}
          </button>
        )}
        <Link
          href={duongHoi(khoi.cauHoiGoiY)}
          className="link-text"
          onClick={() => ghiSuKien('ask_submitted', { nguon: `luan_sau:${khoi.id}` })}
        >
          {t.luanSau.hoiVePhanNay}
        </Link>
      </div>

      {moCanCu && (
        <div
          className="flex flex-col gap-[10px] pt-[12px]"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p className="eyebrow">{t.quickRead.viSaoTieuDe}</p>
          <p className="caption">{t.quickRead.viSaoMo}</p>

          <div className="flex flex-wrap gap-[6px]">
            {khoi.canCu.map((c) => (
              <NhanPill key={c.nhan}>{c.nhan}</NhanPill>
            ))}
          </div>

          <ul className="flex flex-col gap-[8px]">
            {khoi.canCu.map((c) => (
              <li key={c.nhan} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                <b style={{ color: 'var(--fg)' }}>{c.nhan}.</b> {c.giaiThich}
              </li>
            ))}
          </ul>
        </div>
      )}
    </The>
  );
}
