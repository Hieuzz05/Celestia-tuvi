'use client';

import { useEffect, useRef, useState } from 'react';
import { Eyebrow } from '@/components/ui';
import { CauTraLoiV3, DangDocV3, type CauV3 } from './CauTraLoiV3';

export interface ThongTinLaSoV3 {
  ngay: number;
  thang: number;
  nam: number;
  gio: number;
  gioiTinh: 'nam' | 'nu';
  namXem: number;
}

/**
 * Ba câu tổng quan đứng lên ba thẻ đầu trang /la-so, thay các thẻ khuôn chữ cũ
 * ("Điểm nổi bật", "Điều bạn thường cần", "Giai đoạn hiện tại"). Thẻ cũ lặp
 * nguyên câu và nói chung chung — chủ dự án chỉ ra ngày 24/09/2026.
 *
 * Câu đã lên thẻ thì KHÔNG lặp lại ở danh sách bên dưới.
 */
export const THE_DAU: { id: string; nhan: string; tieuDe: string }[] = [
  { id: 'TQ02', nhan: 'Điểm nổi bật', tieuDe: 'Điểm mạnh nổi bật nhất của bạn' },
  { id: 'TQ03', nhan: 'Điều cần lưu ý', tieuDe: 'Điều bạn nên để ý nhất' },
  { id: 'TQ08', nhan: 'Giai đoạn hiện tại', tieuDe: 'Mười năm bạn đang đi qua' },
];

/**
 * Tải nhóm tổng quan MỘT lần cho cả trang (ba thẻ đầu + danh sách).
 *
 * `laSo = null` là tắt (giao diện không phải tiếng Việt). Hỏng thì gọi `onHong`
 * để trang dựng lại phần tất định cũ — người đọc không nhận khoảng trống chỉ
 * vì Celes lỗi. "Đang đọc" là DẪN XUẤT từ việc khoá kết quả khớp khoá đang cần,
 * không setState đồng bộ trong effect (luật lint kho này đang giữ).
 */
export function useTongQuanV3(laSo: ThongTinLaSoV3 | null, onHong?: () => void) {
  const khoa = laSo
    ? `${laSo.ngay}-${laSo.thang}-${laSo.nam}-${laSo.gio}-${laSo.gioiTinh}|${laSo.namXem}`
    : null;
  const [kq, setKq] = useState<{ khoa: string; cau: CauV3[] | null } | null>(null);
  const hong = useRef(onHong);
  useEffect(() => {
    hong.current = onHong;
  });

  useEffect(() => {
    if (!laSo || !khoa) return;
    let huy = false;
    fetch('/api/luan-giai-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...laSo, nhom: 'tong-quan' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        const cau = Array.isArray(d?.cau) ? (d.cau as CauV3[]) : null;
        setKq({ khoa, cau });
        if (!cau || cau.every((c) => c.chuaViet)) hong.current?.();
      })
      .catch(() => {
        if (huy) return;
        setKq({ khoa, cau: null });
        hong.current?.();
      });
    return () => {
      huy = true;
    };
    // laSo đã nằm trọn trong khoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa]);

  const dangDoc = Boolean(khoa) && (!kq || kq.khoa !== khoa);
  return { dangDoc, cau: !dangDoc && kq ? kq.cau : null };
}

/** Một thẻ đầu trang dựng từ một câu tổng quan */
function TheDau({
  nhan,
  tieuDe,
  cau,
  lon,
}: {
  nhan: string;
  tieuDe: string;
  cau: CauV3 | undefined;
  lon?: boolean;
}) {
  const [mo, setMo] = useState(false);
  return (
    <div className="card flex flex-col gap-[12px]" style={lon ? { borderTop: '3px solid var(--accent)' } : undefined}>
      <span className="eyebrow">{nhan}</span>
      <h3 className={lon ? 'heading-sm' : 'text-[20px] font-semibold'} style={{ color: 'var(--fg)' }}>
        {tieuDe}
      </h3>
      {!cau ? (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Celes đang đọc phần này
          <span className="dot-dang-doc" aria-hidden />
        </p>
      ) : cau.chuaViet ? (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Celes chưa viết được phần này. Mở lại trang sau ít phút để thử lại.
        </p>
      ) : (
        <>
          {cau.luanGiai
            .split(/\n\s*\n/)
            .filter((x) => x.trim())
            .map((d, i) => (
              <p key={i} className={lon ? 'body-lg' : 'body-text'} style={{ color: 'var(--fg)' }}>
                {d}
              </p>
            ))}
          <button type="button" className="link-text self-start" aria-expanded={mo} onClick={() => setMo(!mo)}>
            {mo ? 'Thu gọn' : 'Muốn biết vì sao không?'}
          </button>
          {mo && (
            <div className="flex flex-col gap-[8px] pt-[12px]" style={{ borderTop: '1px solid var(--line)' }}>
              <p className="eyebrow">Căn cứ trên lá số của bạn</p>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {cau.viSao}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Ba thẻ đầu trang: thẻ lớn điểm nổi bật, hai thẻ nhỏ đứng cạnh nhau */
export function BaTheDauV3({ cau, dangDoc }: { cau: CauV3[] | null; dangDoc: boolean }) {
  const lay = (id: string) => (dangDoc ? undefined : cau?.find((c) => c.id === id));
  const [a, b, c] = THE_DAU;
  return (
    <>
      <TheDau nhan={a.nhan} tieuDe={a.tieuDe} cau={lay(a.id)} lon />
      <div className="grid gap-[16px] md:grid-cols-2">
        <TheDau nhan={b.nhan} tieuDe={b.tieuDe} cau={lay(b.id)} />
        <TheDau nhan={c.nhan} tieuDe={c.tieuDe} cau={lay(c.id)} />
      </div>
    </>
  );
}

/**
 * LUẬN GIẢI TỔNG QUAN — phần còn lại sau ba thẻ đầu, mỗi câu một thẻ đánh số.
 *
 * Thẻ riêng chứ không phải một cột văn liền: mười một đoạn nối nhau đọc như
 * một bức tường chữ, người đọc không biết mình đang ở câu nào (chủ dự án:
 * "làm nổi bật phần luận giải tổng quan, cho dễ nhìn hơn").
 */
export function TongQuanV3({ cau, dangDoc }: { cau: CauV3[] | null; dangDoc: boolean }) {
  const boQua = new Set(THE_DAU.map((x) => x.id));
  const conLai = (cau ?? []).filter((c) => !boQua.has(c.id));
  if (!dangDoc && !cau) return null;

  return (
    <section className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[8px] pb-[16px]" style={{ borderBottom: '1px solid var(--line)' }}>
        <Eyebrow>Luận giải tổng quan</Eyebrow>
        <h2 className="heading-sm" style={{ color: 'var(--fg)' }}>
          Bức tranh chung của lá số
        </h2>
        <p className="body-sm max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          Những câu người ta hay tự hỏi khi xem lá số, mỗi câu kèm phần căn cứ nếu bạn muốn biết
          Celes dựa vào đâu.
        </p>
      </div>

      {dangDoc ? (
        <DangDocV3 />
      ) : (
        <ol className="flex flex-col gap-[16px]">
          {conLai.map((c, i) => (
            <li key={c.id} className="card">
              <CauTraLoiV3 cau={c} so={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
