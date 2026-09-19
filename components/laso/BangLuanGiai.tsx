'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CongUngHo } from '@/components/support/CongUngHo';
import { Eyebrow, NhanPill, NutChinh, The } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useT } from '@/lib/i18n/context';
import type { BaiLuanGiai, KhoiLuanGiai } from '@/lib/tuvi/luan-giai-sau';

/**
 * Bức tranh đầy đủ — mười hai phần gom trong bốn chặng.
 *
 * Accordion theo CHẶNG chứ không theo phần: bốn lần bấm, không phải mười hai.
 * Chặng một mở sẵn.
 *
 * Subtitle luôn hiện dưới tiêu đề chặng, kể cả khi accordion đóng — đó là thứ
 * nói được giá trị của chặng cho người chưa mở. Số thứ tự 1·2·3·4 hiện rõ để
 * người đọc cảm nhận đây là một cung đường, không phải một danh mục.
 *
 * Mỗi phần giữ đúng một trật tự: tiêu đề là KẾT LUẬN về người đọc → dòng "Đọc
 * từ" (chỗ DUY NHẤT tên cung được hiện) → kết luận → thân bài → căn cứ, mặc
 * định đóng.
 */
export function BangLuanGiai({
  bai,
  duongHoi,
  day = true,
  duongVe = '/la-so',
}: {
  bai: BaiLuanGiai;
  /** Dựng đường sang Hỏi Celes kèm sẵn câu hỏi của khối */
  duongHoi: (cauHoi: string) => string;
  /** Đã mở quyền đọc đầy đủ chưa; chưa thì máy chủ chỉ gửi câu kết luận */
  day?: boolean;
  duongVe?: string;
}) {
  const t = useT();
  const [moCong, setMoCong] = useState(false);
  // Chặng một mở sẵn: người dùng phải thấy ngay một phần thật, không phải bốn
  // cái tiêu đề đóng.
  const [dangMo, setDangMo] = useState<string | null>(bai.chang[0]?.id ?? null);
  /*
   * Đảo sang thứ tự PHẲNG theo độ nổi bật.
   *
   * Bốn chặng là mạch kể chuyện, nhưng có người mở bài ra vì đang nghĩ về đúng
   * một chuyện. Chip này cho họ đi thẳng tới đó mà không phá mạch của người
   * khác — bấm lại là về bốn chặng.
   */
  const [theoNoiBat, setTheoNoiBat] = useState(false);

  const phang = bai.chang.flatMap((c) => c.muc);
  const sapTheoNoiBat = [...phang].sort((a, b) => b.doNoiBat - a.doNoiBat);

  return (
    <section className="flex flex-col gap-[20px]">
      <div>
        <Eyebrow className="mb-[10px]">{t.luanSau.eyebrow}</Eyebrow>
        <h2 className="heading-sm">{t.luanSau.tieuDe}</h2>
        <p className="body-sm mt-[8px] max-w-[640px]" style={{ color: 'var(--fg-muted)' }}>
          {t.luanSau.moTa}
        </p>
        <button
          onClick={() => setTheoNoiBat((v) => !v)}
          className="link-text mt-[12px]"
          aria-pressed={theoNoiBat}
        >
          {theoNoiBat ? t.luanSau.theoChang : t.luanSau.theoNoiBat}
        </button>
      </div>

      {theoNoiBat ? (
        <div className="flex flex-col gap-[16px]">
          {sapTheoNoiBat.map((m) => (
            <KhoiCard key={m.id} khoi={m} duongHoi={duongHoi} day={day} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-[16px]">
          {bai.chang.map((c) => (
            <div key={c.id} className="flex flex-col gap-[12px]">
              {/*
                Chỉ dẫn mở chặng.
                Bản trước chỉ có tiêu đề và subtitle, không mũi tên, không chữ
                nào nói rằng bấm được. Người lần đầu vào đọc chặng một (mở sẵn)
                rồi thấy ba tiêu đề trơ ở dưới, và kết luận là ba chặng kia chưa
                có nội dung — chứ không phải là chúng đang đóng.

                Nên phải nói thẳng bằng chữ: "Xem 3 phần". Mũi tên một mình
                không đủ, vì nó chỉ có nghĩa với người đã quen dạng accordion.
              */}
              <button
                onClick={() => setDangMo((v) => (v === c.id ? null : c.id))}
                className="flex w-full items-start justify-between gap-[16px] text-left"
                aria-expanded={dangMo === c.id}
              >
                <span className="flex flex-col items-start gap-[4px]">
                  <span className="eyebrow">
                    {c.thuTu} · {c.muc.length} {t.luanSau.phan}
                  </span>
                  <span className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                    {c.tieuDe}
                  </span>
                  {/* Subtitle hiện cả khi đóng — đây là thứ bán giá trị của chặng */}
                  <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    {c.subtitle}
                  </span>
                </span>
                <span
                  className="link-text shrink-0 whitespace-nowrap pt-[2px]"
                  aria-hidden
                >
                  {dangMo === c.id ? t.luanSau.dongChang : t.luanSau.moChang}{' '}
                  <span
                    className="inline-block transition-transform"
                    style={{ transform: dangMo === c.id ? 'rotate(180deg)' : 'none' }}
                  >
                    ▾
                  </span>
                </span>
              </button>

              {dangMo === c.id && (
                <div className="flex flex-col gap-[16px]">
                  {c.muc.map((m) => (
                    <KhoiCard key={m.id} khoi={m} duongHoi={duongHoi} day={day} />
                  ))}

                  {day && (
                    <div
                      className="flex flex-col gap-[8px] pl-[14px]"
                      style={{ borderLeft: '2px solid var(--line)' }}
                    >
                      <p className="eyebrow">{t.luanSau.doanKhau}</p>
                      <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                        {c.doanKhau}
                      </p>
                      {c.cauBacCau && (
                        <p className="body-sm" style={{ color: 'var(--fg)' }}>
                          {c.cauBacCau}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
      <div className="flex flex-wrap items-center gap-[10px]">
        <Eyebrow>{khoi.nhomChu}</Eyebrow>
        {khoi.noiBat && <NhanPill>{t.luanSau.noiBat}</NhanPill>}
      </div>

      <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
        {khoi.tieuDe}
      </h3>

      {/*
        Dòng "Đọc từ" — chỗ DUY NHẤT tên cung được phép hiện ở mặt trước.
        Mọi chỗ khác gọi bằng chủ đề đời thường, theo bảng từ ngữ của brand spec.
      */}
      <p className="caption" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {t.luanSau.docTu} {khoi.cungGoc} · {t.luanSau.cung} {khoi.cungTamHop.join(', ')} ·{' '}
        {t.luanSau.soiQua} {khoi.cungGuong}
      </p>

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
