'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LaSo } from '@/lib/tuvi/ansao';
import { cungDaiVan, cungTieuHan } from '@/lib/tuvi/ansao';
import { chiTietDiemTungCung, type ChiTietDiemCung } from '@/lib/rag/v3/du-kien';
import { CHU_DE_V3 } from '@/lib/rag/v3/khung';
import { ghiSuKien } from '@/lib/analytics';

/**
 * BẢN ĐỒ MẠNH – YẾU 12 mặt đời (chủ dự án duyệt 25/09/2026).
 *
 * Vì sao có: thử nghiệm mù 25/09 cho thấy bài luận thiếu THỨ BẬC — chỉ 3/30 bài
 * nói "mạnh nhất / yếu nhất" — và đưa thứ bậc qua prompt thì model gần như bỏ
 * qua. Thứ bậc vì thế hiện bằng ENGINE: tất định, kiểm được, cùng một lá số
 * luôn ra cùng một bản đồ.
 *
 * Nguyên tắc hiển thị:
 *  - So TRONG chính lá số, không so với người khác — nói rõ ở phụ đề. Điểm là
 *    xếp hạng tương đối (4 cao nhất / 4 giữa / 4 thấp nhất), không phải thang
 *    tốt–xấu tuyệt đối, nên KHÔNG hiện con số thô.
 *  - "Cần gắng" màu hổ phách, không đỏ: đây là phần phải bỏ công, không phải cảnh báo.
 *  - Thế mạnh và Cần gắng hiện sẵn; Bình gập lại — có thứ bậc thì mắt biết nhìn đâu trước.
 *  - Chạm một dòng: vì sao (sao đỡ, sao kéo, mặt đời soi vào) + lối sang đọc sâu.
 */

type Muc = ChiTietDiemCung['muc'];
const TEN_NHOM: Record<Muc, { tieuDe: string; moTa: string; mau: string }> = {
  'Mạnh': { tieuDe: 'Thế mạnh', moTa: 'Những mặt đời đang đỡ bạn nhiều nhất', mau: 'var(--tier-manh)' },
  'Bình': { tieuDe: 'Bình', moTa: 'Giữ nhịp, không nổi mà cũng không vướng', mau: 'var(--tier-binh)' },
  'Cần gắng': { tieuDe: 'Cần gắng', moTa: 'Phần phải bỏ công nhiều hơn — biết trước để chủ động', mau: 'var(--tier-gang)' },
};

function chuDeCuaCung(cung: string) {
  return CHU_DE_V3.find((c) => c.cungChinh === cung);
}

interface ChungDong {
  mo: string | null;
  onBam: (cung: string) => void;
  daThay: boolean;
  doDai: (d: number) => number;
  cungDv?: string;
  cungTh?: string;
  namXem: number;
  duongChuyenSau: string;
  duocVao: boolean;
}

function DongCung({ d, i, c }: { d: ChiTietDiemCung; i: number; c: ChungDong }) {
  const { mo, daThay, doDai, cungDv, cungTh, namXem, duongChuyenSau, duocVao } = c;
  const dangMo = mo === d.cung;
  const nhom = TEN_NHOM[d.muc];
  const chuDe = chuDeCuaCung(d.cung);
  const dong = d.trongCung.filter((g) => g.diem > 0).sort((a, b) => b.diem - a.diem);
  const keo = d.trongCung.filter((g) => g.diem < 0).sort((a, b) => a.diem - b.diem);
  const ghiChu = d.trongCung.filter((g) => g.diem === 0);
  const soi = d.soiVao.filter((s) => Math.abs(s.diem) >= 0.3);
  const idPanel = `ban-do-${d.cung.replace(/\s+/g, '-')}`;
  const lienKet = chuDe
    ? duocVao
      ? `${duongChuyenSau}&chuDe=${chuDe.id}`
      : `/dang-nhap?intent=deep_read&next=${encodeURIComponent(`${duongChuyenSau}&chuDe=${chuDe.id}`)}`
    : null;

  return (
    <li className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <button
        type="button"
        onClick={() => c.onBam(d.cung)}
        aria-expanded={dangMo}
        aria-controls={idPanel}
        className="grid min-h-[56px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[12px] gap-y-[8px] py-[12px] text-left sm:grid-cols-[180px_minmax(0,1fr)_auto]"
      >
        <span className="flex flex-wrap items-center gap-[8px]">
          <span className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>
            {d.linhVuc}
          </span>
          <span className="sr-only">— {nhom.tieuDe}</span>
          {cungDv === d.cung && (
            <span className="caption rounded-full border px-[8px] py-[2px]" style={{ borderColor: 'var(--line-strong)' }}>
              Đang đi qua
            </span>
          )}
          {cungTh === d.cung && (
            <span className="caption rounded-full border px-[8px] py-[2px]" style={{ borderColor: 'var(--line-strong)' }}>
              Năm {namXem}
            </span>
          )}
        </span>
        {/* Chevron nằm cột cuối; trên điện thoại thanh xuống hàng dưới, trải hết bề ngang */}
        <span
          aria-hidden
          className="col-start-2 row-start-1 inline-flex leading-none transition-transform duration-200 motion-reduce:transition-none sm:col-start-3"
          style={{ color: 'var(--fg-muted)', transform: dangMo ? 'rotate(180deg)' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        <span
          aria-hidden
          className="col-span-2 block h-[8px] overflow-hidden rounded-full sm:col-span-1 sm:col-start-2 sm:row-start-1"
          style={{ background: 'color-mix(in srgb, var(--line) 70%, transparent)' }}
        >
          <span
            className="block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{
              width: daThay ? `${doDai(d.diem)}%` : '0%',
              background: nhom.mau,
              transitionDelay: `${i * 45}ms`,
            }}
          />
        </span>
      </button>

      {/* Mở / đóng mượt bằng grid-rows 0fr → 1fr (không cần đo chiều cao) */}
      <div
        id={idPanel}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: dangMo ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-[12px] pb-[16px] pl-[2px]">
            {dong.length > 0 && (
              <p className="body-sm">
                <span className="font-semibold" style={{ color: 'var(--tier-manh)' }}>Đang đỡ: </span>
                {dong.map((g) => g.ten).join(', ')}
              </p>
            )}
            {keo.length > 0 && (
              <p className="body-sm">
                <span className="font-semibold" style={{ color: 'var(--tier-gang)' }}>Đang kéo: </span>
                {keo.map((g) => g.ten).join(', ')}
              </p>
            )}
            {ghiChu.length > 0 && (
              <p className="caption">{ghiChu.map((g) => g.ten).join(' · ')}</p>
            )}
            {soi.length > 0 && (
              <p className="caption">
                Các mặt đời soi vào:{' '}
                {soi
                  .map((s) => `${s.linhVuc} ${s.diem > 0 ? 'đỡ thêm' : 'kéo bớt'}`)
                  .join(', ')}
                .
              </p>
            )}
            {d.cung === 'Tật Ách' && (
              <p className="caption">Đây là xu hướng để tham khảo, không phải chẩn đoán sức khỏe.</p>
            )}
            {lienKet && chuDe && (
              <Link
                href={lienKet}
                className="link-text link-action self-start"
                onClick={() => ghiSuKien('deep_read_cta', { viTri: 'ban-do-manh-yeu', chuDe: chuDe.id })}
              >
                Đọc sâu về {chuDe.ten.toLowerCase()} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function NhomCung({ m, ds, thuTu, c }: { m: Muc; ds: ChiTietDiemCung[]; thuTu: Map<string, number>; c: ChungDong }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex flex-wrap items-baseline gap-x-[8px] gap-y-[4px]">
        <span className="inline-block h-[10px] w-[10px] shrink-0 self-center rounded-full" style={{ background: TEN_NHOM[m].mau }} aria-hidden />
        <h3 className="whitespace-nowrap text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
          {TEN_NHOM[m].tieuDe}
        </h3>
        <span className="caption w-full pl-[18px] sm:w-auto sm:pl-0">{TEN_NHOM[m].moTa}</span>
      </div>
      <ol className="flex flex-col">
        {ds.map((d) => (
          <DongCung key={d.cung} d={d} i={thuTu.get(d.cung) ?? 0} c={c} />
        ))}
      </ol>
    </div>
  );
}

export function BanDoManhYeu({
  laSo,
  namXem,
  tomTat,
  dangDocTomTat,
  duongChuyenSau,
  duocVao,
}: {
  laSo: LaSo;
  namXem: number;
  /** Đoạn Celes viết cho câu TQ04 — có thì hiện dưới tiêu đề */
  tomTat?: string | null;
  dangDocTomTat?: boolean;
  /** Đường sang /luan-giai/sau đã kèm thông tin lá số, CHƯA có chuDe */
  duongChuyenSau: string;
  duocVao: boolean;
}) {
  const ds = useMemo(() => chiTietDiemTungCung(laSo).sort((a, b) => b.diem - a.diem), [laSo]);
  const [thapNhat, caoNhat] = [ds[ds.length - 1].diem, ds[0].diem];
  // Thanh độ mạnh: tương đối trong lá số, sàn 10% để dòng yếu nhất vẫn có vệt nhìn thấy
  const doDai = (d: number) => (caoNhat === thapNhat ? 60 : 10 + ((d - thapNhat) / (caoNhat - thapNhat)) * 90);

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const cungDv = cungDaiVan(laSo, tuoiAm)?.tenCung;
  const cungTh = laSo.cungs[cungTieuHan(laSo, tuoiAm)]?.tenCung;

  const [mo, setMo] = useState<string | null>(null);
  const [moBinh, setMoBinh] = useState(false);
  const [moTomTat, setMoTomTat] = useState(false);

  // Thanh chạy dần khi khối vào màn hình — một lần, rồi đứng yên
  const khoiRef = useRef<HTMLElement>(null);
  const [daThay, setDaThay] = useState(false);
  useEffect(() => {
    const el = khoiRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setDaThay(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDaThay(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const bam = (cung: string) => {
    const moi = mo === cung ? null : cung;
    setMo(moi);
    if (moi) ghiSuKien('strength_map_opened', { cung });
  };

  const nhomDs = (m: Muc) => ds.filter((d) => d.muc === m);
  const chung: ChungDong = { mo, onBam: bam, daThay, doDai, cungDv, cungTh, namXem, duongChuyenSau, duocVao };
  const thuTuDong = new Map(ds.map((d, i) => [d.cung, i]));

  return (
    <section ref={khoiRef} className="card flex flex-col gap-[16px]" aria-labelledby="ban-do-manh-yeu">
      <div className="flex flex-col gap-[8px]">
        <span className="eyebrow">Bản đồ mạnh – yếu</span>
        <h2 id="ban-do-manh-yeu" className="text-[22px] font-semibold leading-snug md:text-[24px]" style={{ color: 'var(--fg)' }}>
          Mặt nào đang đỡ bạn, mặt nào cần bỏ công hơn
        </h2>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          So 12 mặt đời trong chính lá số của bạn — không so với người khác. Chạm vào một dòng để xem vì sao.
        </p>
        {tomTat ? (
          /* Ba dòng rồi "Đọc tiếp": đoạn đầy đủ dài 8–13 dòng trên điện thoại, đẩy
             các thanh — phần người ta đến để xem — xuống khỏi màn đầu. */
          <div className="flex flex-col items-start gap-[4px]">
            <p className={`body-text ${moTomTat ? '' : 'line-clamp-3'}`} style={{ color: 'var(--fg)' }}>
              {tomTat}
            </p>
            <button type="button" className="link-text link-action" onClick={() => setMoTomTat((v) => !v)} aria-expanded={moTomTat}>
              {moTomTat ? 'Thu gọn' : 'Đọc tiếp nhận xét của Celes'}
            </button>
          </div>
        ) : dangDocTomTat ? (
          <div className="flex flex-col gap-[8px]" aria-hidden>
            {[96, 88, 70].map((w) => (
              <span key={w} className="block h-[10px] rounded-full" style={{ width: `${w}%`, background: 'var(--line)' }} />
            ))}
          </div>
        ) : null}
      </div>

      <NhomCung m="Mạnh" ds={nhomDs('Mạnh')} thuTu={thuTuDong} c={chung} />

      <div className="flex flex-col gap-[4px]">
        <button
          type="button"
          onClick={() => setMoBinh((v) => !v)}
          aria-expanded={moBinh}
          className="flex min-h-[44px] items-center gap-[8px] text-left"
        >
          <span className="inline-block h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: TEN_NHOM['Bình'].mau }} aria-hidden />
          <span className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
            Bình
          </span>
          <span className="caption">
            {moBinh ? 'Thu gọn' : `Xem ${nhomDs('Bình').length} mặt đời ở mức bình: ${nhomDs('Bình').map((d) => d.linhVuc).join(', ')}`}
          </span>
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: moBinh ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <ol className="flex flex-col">
              {nhomDs('Bình').map((d) => (
                <DongCung key={d.cung} d={d} i={thuTuDong.get(d.cung) ?? 0} c={chung} />
              ))}
            </ol>
          </div>
        </div>
      </div>

      <NhomCung m="Cần gắng" ds={nhomDs('Cần gắng')} thuTu={thuTuDong} c={chung} />

      <p className="caption">
        Engine chấm theo độ sáng của chính tinh, cát tinh – hung tinh trong cung và các cung soi vào. Mạnh – yếu ở đây là so
        sánh tương đối để biết nên dựa vào đâu, chú ý chỗ nào — không phải lời phán tốt xấu.
      </p>
    </section>
  );
}
