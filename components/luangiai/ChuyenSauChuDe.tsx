'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { LaSo } from '@/lib/tuvi/ansao';
import { diemTungCung, TEN_MUC } from '@/lib/rag/v3/du-kien';
import { CAU_HOI_V3, CHU_DE_V3 } from '@/lib/rag/v3/khung';
import { ghiSuKien } from '@/lib/analytics';

/**
 * TAB "CHUYÊN SÂU" ở /la-so (25/09/2026) — lối vào 14 chủ đề ngay trên trang lá số.
 *
 * Trước đây luận chuyên sâu chỉ là một thẻ mời giữa trang, sau ba thẻ đầu và
 * cả bản đồ mạnh–yếu; người đọc không thấy có bao nhiêu chủ đề, cũng không
 * biết nên đọc chủ đề nào trước. Ở đây hiện đủ 14 chủ đề, mỗi thẻ kèm số câu
 * hỏi và nhãn mạnh–yếu của cung chính — gợi ý nên đọc chỗ nào trước.
 */

const SO_CAU = new Map(
  CHU_DE_V3.map((c) => [c.id, CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === c.id).length])
);

const MAU_MUC = {
  'Mạnh': 'var(--tier-manh)',
  'Bình': 'var(--tier-binh)',
  'Cần gắng': 'var(--tier-gang)',
} as const;

export function ChuyenSauChuDe({
  laSo,
  duongChuyenSau,
  duocVao,
}: {
  laSo: LaSo;
  /** Đường sang /luan-giai/sau đã kèm thông tin lá số và năm xem, CHƯA có chuDe */
  duongChuyenSau: string;
  duocVao: boolean;
}) {
  const mucCung = useMemo(() => new Map(diemTungCung(laSo).map((d) => [d.cung, d.muc])), [laSo]);
  const tongCau = [...SO_CAU.values()].reduce((a, b) => a + b, 0);
  const toi = (chuDe: string) => {
    const dich = `${duongChuyenSau}&chuDe=${chuDe}`;
    return duocVao ? dich : `/dang-nhap?intent=deep_read&next=${encodeURIComponent(dich)}`;
  };

  return (
    <section className="flex flex-col gap-[24px]" aria-labelledby="tab-chuyen-sau-tieu-de">
      <div className="card flex flex-col gap-[12px]" style={{ borderTop: '3px solid var(--accent)' }}>
        <span className="eyebrow">Luận giải chuyên sâu</span>
        <h2 id="tab-chuyen-sau-tieu-de" className="text-[22px] font-semibold leading-snug md:text-[24px]" style={{ color: 'var(--fg)' }}>
          {CHU_DE_V3.length} chủ đề, {tongCau} câu hỏi cụ thể về chính bạn
        </h2>
        <p className="body-sm max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          Mỗi chủ đề đi sâu vào một phần đời — công việc, tiền bạc, tình cảm, gia đình, sức khỏe… Mỗi câu được luận từ nhiều
          cung trên lá số, kèm phần căn cứ để bạn biết Celes dựa vào đâu.
        </p>
        <div className="flex flex-wrap items-center gap-[12px] pt-[4px]">
          <Link
            href={toi(CHU_DE_V3[0].id)}
            className="btn-primary"
            onClick={() => ghiSuKien('deep_read_cta', { viTri: 'tab-chuyen-sau' })}
          >
            {duocVao ? 'Bắt đầu đọc' : 'Đăng nhập để đọc'}
          </Link>
          <span className="caption">{duocVao ? 'Miễn phí, bài đọc được lưu lại cho lần sau.' : 'Miễn phí — cần tài khoản để Celes lưu bài cho bạn.'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[12px]">
        <p className="caption px-[4px]">
          Nhãn màu cho biết lĩnh vực đó trong lá số của bạn đang thuận lợi hay cần chăm chút — gợi ý nên đọc chỗ nào trước.
        </p>
        <ol className="grid gap-[12px] sm:grid-cols-2">
          {CHU_DE_V3.map((c, i) => {
            const muc = mucCung.get(c.cungChinh);
            return (
              <li key={c.id}>
                <Link
                  href={toi(c.id)}
                  onClick={() => ghiSuKien('deep_read_cta', { viTri: 'tab-chuyen-sau-the', chuDe: c.id })}
                  className="group flex h-full min-h-[76px] items-center gap-[12px] rounded-[var(--radius-cards)] border p-[16px] transition-colors hover:border-[var(--accent)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
                >
                  <span
                    className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <span className="text-[16px] font-semibold leading-[22px]" style={{ color: 'var(--fg)' }}>
                      {c.ten}
                    </span>
                    <span className="caption flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
                      <span>{SO_CAU.get(c.id)} câu hỏi</span>
                      {muc && (
                        <span className="inline-flex items-center gap-[4px]" style={{ color: MAU_MUC[muc] }}>
                          <span className="inline-block h-[8px] w-[8px] rounded-full" style={{ background: MAU_MUC[muc] }} aria-hidden />
                          {TEN_MUC[muc]}
                        </span>
                      )}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 transition-transform group-hover:translate-x-[4px]" style={{ color: 'var(--fg-muted)' }}>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
