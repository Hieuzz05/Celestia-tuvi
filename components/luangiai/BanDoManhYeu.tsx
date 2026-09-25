'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LaSo } from '@/lib/tuvi/ansao';
import { cungDaiVan, cungTieuHan } from '@/lib/tuvi/ansao';
import { chiTietDiemTungCung, TEN_MUC, type ChiTietDiemCung, type GopDiem } from '@/lib/rag/v3/du-kien';
import { CHU_DE_V3 } from '@/lib/rag/v3/khung';
import { ghiSuKien } from '@/lib/analytics';

/**
 * BẢN ĐỒ MẠNH – YẾU 12 lĩnh vực (chủ dự án duyệt 25/09/2026, thiết kế lại 25/09).
 *
 * Vì sao có: thử nghiệm mù 25/09 cho thấy bài luận thiếu THỨ BẬC — chỉ 3/30 bài
 * nói "mạnh nhất / yếu nhất" — và đưa thứ bậc qua prompt thì model gần như bỏ
 * qua. Thứ bậc vì thế hiện bằng ENGINE: tất định, cùng lá số luôn ra cùng bản đồ.
 *
 * Nguyên tắc hiển thị:
 *  - So TRONG chính lá số. Thanh là thanh LỆCH HAI PHÍA quanh mức giữa của lá số
 *    (trung vị 12 điểm): phải là thuận hơn mức giữa, trái là kém hơn. Cùng một
 *    thước cho cả hai phía — bản trước chuẩn hoá min–max nên bốn dòng đầu luôn
 *    gần đầy, bốn dòng cuối luôn gần rỗng, khoảng cách thật bị phóng đại.
 *  - Hiện đủ 12 dòng: nhóm Ổn định không gập nữa, chỉ nhạt màu. Gập lại thì mất
 *    cái "bản đồ" — người đọc thấy một bước nhảy từ đầy xuống rỗng.
 *  - Không hiện con số thô (là xếp hạng tương đối, không phải thang tốt–xấu).
 *  - "Cần chăm chút" màu hổ phách, không đỏ: phần phải bỏ công, không phải cảnh báo.
 *  - Phần "vì sao" nói bằng LỜI THƯỜNG trước, tên sao để trong ngoặc cho người biết tử vi.
 */

type Muc = ChiTietDiemCung['muc'];
const NHOM: Record<Muc, { moTa: string; mau: string }> = {
  'Mạnh': { moTa: 'Nơi bạn dễ phát huy nhất — nên dựa vào', mau: 'var(--tier-manh)' },
  'Bình': { moTa: 'Không nổi bật, cũng ít trắc trở', mau: 'var(--tier-binh)' },
  'Cần gắng': { moTa: 'Dễ gặp trở ngại hơn — biết trước để chuẩn bị', mau: 'var(--tier-gang)' },
};

/** Tên hiển thị khi tên lĩnh vực của engine quá cộc để đứng một mình */
const TEN_GON: Record<string, string> = { 'Ra ngoài': 'Đi xa, ra ngoài' };
const tenLv = (s: string) => TEN_GON[s] ?? s;

/** Nghĩa ngắn của từng sao — vài chữ, đủ để người chưa biết tử vi hiểu vì sao */
const NGHIA_NGAN: Record<string, string> = {
  'Tả Phù': 'có người giúp sức',
  'Hữu Bật': 'có người giúp sức',
  'Văn Xương': 'học hành, diễn đạt tốt',
  'Văn Khúc': 'khéo léo, có duyên ăn nói',
  'Thiên Khôi': 'gặp người đi trước nâng đỡ',
  'Thiên Việt': 'gặp người có vị thế nâng đỡ',
  'Lộc Tồn': 'giữ được của, vững vàng',
  'Hóa Lộc': 'mở ra cơ hội, tài lộc',
  'Hóa Quyền': 'nắm được quyền quyết định',
  'Hóa Khoa': 'được công nhận, có tiếng tốt',
  'Thiên Quan': 'hay gặp may, được phù hộ',
  'Thiên Phúc': 'hay gặp may, được phù hộ',
  'Ân Quang': 'được người khác nhớ tới, giúp đỡ',
  'Thiên Quý': 'được người khác nhớ tới, giúp đỡ',
  'Long Trì': 'có chừng mực, dễ được việc',
  'Phượng Các': 'có gu, dễ gây thiện cảm',
  'Thiên Mã': 'năng động, dịch chuyển mang lại cơ hội',
  'Tam Thai': 'có vị thế, được nể trọng',
  'Bát Tọa': 'có vị thế, được nể trọng',
  'Thiên Đức': 'hiền hòa, ít gặp chuyện xấu',
  'Nguyệt Đức': 'hiền hòa, ít gặp chuyện xấu',
  'Giải Thần': 'gặp khó thường có lối thoát',
  'Kình Dương': 'dễ va chạm, nóng vội',
  'Đà La': 'dễ chậm trễ, dây dưa',
  'Hỏa Tinh': 'dễ nóng nảy, bốc đồng',
  'Linh Tinh': 'dễ bực bội âm ỉ',
  'Địa Không': 'dễ hụt hẫng, công cốc',
  'Địa Kiếp': 'dễ mất mát bất ngờ',
  'Hóa Kỵ': 'hay vướng mắc, phải làm lại',
  'Thiên Hình': 'khắt khe, dễ va vấp',
  'Kiếp Sát': 'dễ mất đúng lúc đang cần',
  'Đại Hao': 'dễ hao hụt, tốn kém',
  'Tiểu Hao': 'dễ hao hụt, tốn kém',
  'Tang Môn': 'dễ buồn phiền, lo âu',
  'Bạch Hổ': 'dễ có tranh chấp, sóng gió',
  'Thiên Riêu': 'dễ bị cám dỗ, sa đà',
};

const THE_SAO_CHINH: Record<string, string> = {
  M: 'Sao chính đang ở thế rất vững',
  V: 'Sao chính đang ở thế vững',
  D: 'Sao chính đang ở thế khá vững',
  L: 'Sao chính ở thế tương đối ổn',
  B: 'Sao chính ở mức bình thường',
  H: 'Sao chính đang yếu',
};

/** Một dòng "vì sao": lời thường + tên sao (cho người biết tử vi) */
function yNghia(g: GopDiem): { loi: string; sao?: string } {
  if (g.loai === 'chinh') return { loi: THE_SAO_CHINH[g.doSang ?? 'B'] ?? 'Sao chính', sao: g.sao };
  if (g.loai === 'vcd')
    return {
      loi: 'Không có sao chính, mượn sức từ lĩnh vực đối diện',
      sao: g.sao ? `mượn ${g.sao}` : undefined,
    };
  if (g.loai === 'tuan')
    return { loi: 'Cả điều tốt lẫn điều xấu ở đây đều được giảm nhẹ', sao: g.sao };
  const nghia = NGHIA_NGAN[g.sao ?? ''] ?? g.ten;
  const dac = g.loai === 'hung' && g.doSang === 'D';
  return {
    loi: nghia.charAt(0).toUpperCase() + nghia.slice(1) + (dac ? ' (đã bớt nặng vì sao ở vị trí tốt)' : ''),
    sao: g.sao,
  };
}

/** Tên ngắn cho nhãn quanh biểu đồ — nhãn dài chen nhau ở màn 360px */
const TEN_NGAN: Record<string, string> = {
  'Mệnh': 'Bản thân', 'Phụ Mẫu': 'Cha mẹ', 'Phúc Đức': 'Tinh thần', 'Điền Trạch': 'Nhà cửa',
  'Quan Lộc': 'Sự nghiệp', 'Nô Bộc': 'Bạn bè', 'Thiên Di': 'Đi xa', 'Tật Ách': 'Sức khỏe',
  'Tài Bạch': 'Tiền bạc', 'Tử Tức': 'Con cái', 'Phu Thê': 'Tình duyên', 'Huynh Đệ': 'Anh em',
};

/**
 * BIỂU ĐỒ RADAR 12 cung — hình dạng của cả lá số trong một cái nhìn.
 *
 * Trục xếp ĐÚNG thứ tự vòng lá số (Mệnh ở đỉnh, đi theo chiều địa chi), không
 * theo điểm: nhờ vậy hai trục đối diện là hai cung xung chiếu, bốn trục cách
 * đều là một bộ tam hợp — người biết tử vi đọc được quan hệ giữa các cung ngay
 * trên hình. Bán kính: tương đối trong lá số (sàn 18% để cung thấp nhất vẫn
 * có hình); vòng nét đứt là mức giữa (trung vị), cùng mốc với vạch giữa của thanh.
 */
function RadarManhYeu({
  laSo,
  ds,
  mo,
  daThay,
  onChon,
}: {
  laSo: LaSo;
  ds: ChiTietDiemCung[];
  mo: string | null;
  daThay: boolean;
  onChon: (cung: string) => void;
}) {
  const menh = laSo.cungs.find((c) => c.tenCung === 'Mệnh');
  const theoCung = new Map(ds.map((d) => [d.cung, d]));
  const vong = Array.from({ length: 12 }, (_, k) => laSo.cungs[((menh?.chiIndex ?? 0) + k) % 12]?.tenCung)
    .map((ten) => (ten ? theoCung.get(ten) : undefined))
    .filter((d): d is ChiTietDiemCung => Boolean(d));
  const diem = ds.map((d) => d.diem);
  const [min, max] = [Math.min(...diem), Math.max(...diem)];
  const giua = (ds[5].diem + ds[6].diem) / 2;
  // Khung 400: nhãn dài nhất (~62px) ở trục ngang vẫn nằm trong khung, không tràn thẻ
  const W = 400;
  const C = W / 2;
  const R = 108;
  const r = (d: number) => R * (max === min ? 0.6 : 0.18 + (0.82 * (d - min)) / (max - min));
  const goc = (k: number) => -Math.PI / 2 + (k * 2 * Math.PI) / vong.length;
  const diemXY = (k: number, rr: number) => [C + rr * Math.cos(goc(k)), C + rr * Math.sin(goc(k))] as const;
  const hinh = vong.map((d, k) => diemXY(k, r(d.diem)).join(',')).join(' ');
  const luoi = [0.34, 0.67, 1].map((f) => vong.map((_, k) => diemXY(k, R * f).join(',')).join(' '));
  const rGiua = r(giua);

  return (
    <figure className="flex flex-col items-center gap-[8px]">
      <svg
        // Cắt bớt khoảng trống trên/dưới: nhãn đỉnh và đáy chỉ cách tâm R + 24
        viewBox={`0 ${C - R - 48} ${W} ${2 * (R + 48)}`}
        className="w-full max-w-[420px]"
        role="group"
        aria-label="Biểu đồ radar độ thuận lợi của 12 lĩnh vực"
      >
        {luoi.map((p, i) => (
          <polygon key={i} points={p} fill="none" stroke="var(--line)" strokeWidth={1} />
        ))}
        {vong.map((_, k) => {
          const [x, y] = diemXY(k, R);
          return <line key={k} x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />;
        })}
        <circle cx={C} cy={C} r={rGiua} fill="none" stroke="var(--line-strong)" strokeWidth={1.2} strokeDasharray="4 4" />
        <g
          className="transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transformOrigin: `${C}px ${C}px`, transform: daThay ? 'scale(1)' : 'scale(0.2)' }}
        >
          <polygon
            points={hinh}
            fill="color-mix(in srgb, var(--accent) 18%, transparent)"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {vong.map((d, k) => {
            const [x, y] = diemXY(k, r(d.diem));
            const chon = mo === d.cung;
            return (
              <circle
                key={d.cung}
                cx={x}
                cy={y}
                r={chon ? 7 : 5}
                fill={NHOM[d.muc].mau}
                stroke={chon ? 'var(--fg)' : 'var(--surface-card)'}
                strokeWidth={2}
              />
            );
          })}
        </g>
        {vong.map((d, k) => {
          const [x, y] = diemXY(k, R + 24);
          const cos = Math.cos(goc(k));
          const chon = mo === d.cung;
          const neo = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          return (
            <g
              key={d.cung}
              role="button"
              tabIndex={0}
              aria-label={`${tenLv(d.linhVuc)} — ${TEN_MUC[d.muc]}`}
              aria-pressed={chon}
              className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-[var(--accent)]"
              onClick={() => onChon(d.cung)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChon(d.cung);
                }
              }}
            >
              {/* Vùng chạm 64×44 quanh nhãn */}
              <rect
                x={neo === 'middle' ? x - 32 : neo === 'start' ? x - 8 : x - 56}
                y={y - 22}
                width={64}
                height={44}
                rx={10}
                fill={chon ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent'}
                stroke="transparent"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y}
                textAnchor={neo}
                dominantBaseline="middle"
                fontSize={15}
                fontWeight={chon ? 700 : 600}
                fill={d.muc === 'Bình' && !chon ? 'var(--fg-muted)' : 'var(--fg)'}
              >
                {TEN_NGAN[d.cung] ?? d.linhVuc}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="caption max-w-[440px] text-center">
        Hình phình ra ở hướng nào, lĩnh vực đó càng thuận lợi. Vòng nét đứt là mức trung bình của lá số. Hai lĩnh vực đối
        diện nhau trên vòng là hai cung chiếu thẳng vào nhau. Chạm vào tên để xem lý do.
      </figcaption>
    </figure>
  );
}

function chuDeCuaCung(cung: string) {
  return CHU_DE_V3.find((c) => c.cungChinh === cung);
}

interface ChungDong {
  mo: string | null;
  onBam: (cung: string) => void;
  daThay: boolean;
  /** % bề rộng của nửa thanh (0–50) và phía */
  thuoc: (d: number) => { rong: number; phai: boolean };
  cungDv?: string;
  cungTh?: string;
  namXem: number;
  duongChuyenSau: string;
  duocVao: boolean;
}

function Nhan({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-[8px] py-[2px] text-[12px] font-medium leading-[18px]"
      style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
    >
      {children}
    </span>
  );
}

function DanhSachLyDo({ tieuDe, mau, ds }: { tieuDe: string; mau: string; ds: GopDiem[] }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: mau }}>
        {tieuDe}
      </p>
      <ul className="flex flex-col gap-[8px]">
        {ds.map((g, k) => {
          const y = yNghia(g);
          return (
            <li key={k} className="flex items-start gap-[8px]">
              <span className="mt-[8px] h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: mau }} aria-hidden />
              <span className="body-sm" style={{ color: 'var(--fg)' }}>
                {y.loi}
                {y.sao && (
                  <span className="caption" style={{ color: 'var(--fg-muted)' }}>
                    {' '}· {y.sao}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DongCung({ d, i, c }: { d: ChiTietDiemCung; i: number; c: ChungDong }) {
  const { mo, daThay, thuoc, cungDv, cungTh, namXem, duongChuyenSau, duocVao } = c;
  const dangMo = mo === d.cung;
  const nhom = NHOM[d.muc];
  const binh = d.muc === 'Bình';
  const chuDe = chuDeCuaCung(d.cung);
  const giup = d.trongCung.filter((g) => g.diem > 0).sort((a, b) => b.diem - a.diem);
  const tro = d.trongCung.filter((g) => g.diem < 0).sort((a, b) => a.diem - b.diem);
  const ghiChu = d.trongCung.filter((g) => g.diem === 0 && (g.loai === 'tuan' || g.loai === 'chinh'));
  const hoTro = d.soiVao.filter((s) => s.diem >= 0.3);
  const keoXuong = d.soiVao.filter((s) => s.diem <= -0.3);
  const idPanel = `ban-do-${d.cung.replace(/\s+/g, '-')}`;
  const lienKet = chuDe
    ? duocVao
      ? `${duongChuyenSau}&chuDe=${chuDe.id}`
      : `/dang-nhap?intent=deep_read&next=${encodeURIComponent(`${duongChuyenSau}&chuDe=${chuDe.id}`)}`
    : null;
  const { rong, phai } = thuoc(d.diem);

  return (
    <li
      id={`dong-${idPanel}`}
      className="rounded-[12px] transition-colors"
      style={{ background: dangMo ? 'color-mix(in srgb, var(--fg) 4%, transparent)' : 'transparent' }}
    >
      <button
        type="button"
        onClick={() => c.onBam(d.cung)}
        aria-expanded={dangMo}
        aria-controls={idPanel}
        className="grid min-h-[56px] w-full grid-cols-[minmax(0,120px)_minmax(0,1fr)_18px] items-center gap-x-[12px] rounded-[12px] px-[8px] py-[8px] text-left sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)_18px]"
      >
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
            <span className="text-[16px] font-semibold leading-[22px]" style={{ color: binh ? 'var(--fg-muted)' : 'var(--fg)' }}>
              {tenLv(d.linhVuc)}
            </span>
            {cungDv === d.cung && <Nhan>Vận hiện tại</Nhan>}
            {cungTh === d.cung && <Nhan>Năm {namXem}</Nhan>}
          </span>
          <span className="caption" style={{ color: 'var(--fg-muted)' }}>
            Cung {d.cung}
            <span className="sr-only"> — {TEN_MUC[d.muc]}</span>
          </span>
        </span>

        <span
          aria-hidden
          className="col-start-3 row-start-1 inline-flex leading-none transition-transform duration-200 motion-reduce:transition-none"
          style={{ color: 'var(--fg-muted)', transform: dangMo ? 'rotate(180deg)' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>

        {/* Thanh lệch hai phía quanh mức giữa của lá số */}
        <span aria-hidden className="relative col-start-2 row-start-1 block h-[12px]">
          <span className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full" style={{ background: 'color-mix(in srgb, var(--line) 60%, transparent)' }} />
          <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full" style={{ background: 'var(--line-strong)' }} />
          <span
            className="absolute top-1/2 h-[8px] -translate-y-1/2 transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{
              [phai ? 'left' : 'right']: '50%',
              width: daThay ? `${rong}%` : '0%',
              background: nhom.mau,
              borderRadius: phai ? '0 999px 999px 0' : '999px 0 0 999px',
              transitionDelay: `${i * 40}ms`,
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
          <div className="flex flex-col gap-[16px] px-[8px] pb-[16px] pt-[4px]">
            {giup.length > 0 && <DanhSachLyDo tieuDe="Điều giúp bạn" mau="var(--tier-manh)" ds={giup} />}
            {tro.length > 0 && <DanhSachLyDo tieuDe="Điều gây trở ngại" mau="var(--tier-gang)" ds={tro} />}
            {ghiChu.length > 0 && <DanhSachLyDo tieuDe="Cần biết thêm" mau="var(--fg-muted)" ds={ghiChu} />}
            {giup.length === 0 && tro.length === 0 && (
              <p className="body-sm" style={{ color: 'var(--fg)' }}>
                Không có sao nào nổi trội ở đây — lĩnh vực này chủ yếu chịu ảnh hưởng từ các lĩnh vực liên quan.
              </p>
            )}
            {(hoTro.length > 0 || keoXuong.length > 0) && (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {hoTro.length > 0 && (
                  <>
                    Được tiếp sức từ <strong style={{ color: 'var(--fg)' }}>{hoTro.map((s) => tenLv(s.linhVuc)).join(', ')}</strong>.{' '}
                  </>
                )}
                {keoXuong.length > 0 && (
                  <>
                    Bị ảnh hưởng không tốt từ <strong style={{ color: 'var(--fg)' }}>{keoXuong.map((s) => tenLv(s.linhVuc)).join(', ')}</strong>.
                  </>
                )}
              </p>
            )}
            {d.cung === 'Tật Ách' && (
              <p className="caption">Chỉ để tham khảo về xu hướng, không thay cho lời khuyên của bác sĩ.</p>
            )}
            {lienKet && chuDe && (
              <Link
                href={lienKet}
                className="link-text link-action self-start"
                onClick={() => ghiSuKien('deep_read_cta', { viTri: 'ban-do-manh-yeu', chuDe: chuDe.id })}
              >
                Đọc phân tích chi tiết về {chuDe.ten.toLowerCase()} →
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
      <div className="flex flex-wrap items-baseline gap-x-[8px] gap-y-[4px] px-[8px]">
        <span className="inline-block h-[10px] w-[10px] shrink-0 self-center rounded-full" style={{ background: NHOM[m].mau }} aria-hidden />
        <h3 className="whitespace-nowrap text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
          {TEN_MUC[m]}
        </h3>
        <span className="caption w-full pl-[18px] sm:w-auto sm:pl-0">{NHOM[m].moTa}</span>
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
  /** Đoạn Celes viết cho câu TQ04 — có thì hiện dưới bản đồ */
  tomTat?: string | null;
  dangDocTomTat?: boolean;
  /** Đường sang /luan-giai/sau đã kèm thông tin lá số, CHƯA có chuDe */
  duongChuyenSau: string;
  duocVao: boolean;
}) {
  const ds = useMemo(() => chiTietDiemTungCung(laSo).sort((a, b) => b.diem - a.diem), [laSo]);
  // Mức giữa = trung vị; một thước chung cho hai phía để độ lệch so được với nhau
  const giua = (ds[5].diem + ds[6].diem) / 2;
  const bien = Math.max(ds[0].diem - giua, giua - ds[ds.length - 1].diem) || 1;
  const thuoc = (d: number) => ({ rong: Math.max(3, (Math.abs(d - giua) / bien) * 48), phai: d >= giua });

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const cungDv = cungDaiVan(laSo, tuoiAm)?.tenCung;
  const cungTh = laSo.cungs[cungTieuHan(laSo, tuoiAm)]?.tenCung;

  const [mo, setMo] = useState<string | null>(null);
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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const bam = (cung: string) => {
    const moi = mo === cung ? null : cung;
    setMo(moi);
    if (moi) ghiSuKien('strength_map_opened', { cung });
  };
  // Hai ô tóm tắt ở đầu: mở luôn dòng đó và cuộn tới
  const toiDong = (cung: string) => {
    setMo(cung);
    ghiSuKien('strength_map_opened', { cung });
    document
      .getElementById(`dong-ban-do-${cung.replace(/\s+/g, '-')}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const nhomDs = (m: Muc) => ds.filter((d) => d.muc === m);
  const chung: ChungDong = { mo, onBam: bam, daThay, thuoc, cungDv, cungTh, namXem, duongChuyenSau, duocVao };
  const thuTuDong = new Map(ds.map((d, i) => [d.cung, i]));
  const [dau, cuoi] = [ds[0], ds[ds.length - 1]];

  return (
    <section ref={khoiRef} className="card flex flex-col gap-[24px]" aria-labelledby="ban-do-manh-yeu">
      <div className="flex flex-col gap-[8px]">
        <span className="eyebrow">Điểm mạnh – điểm yếu</span>
        <h2 id="ban-do-manh-yeu" className="text-[22px] font-semibold leading-snug md:text-[24px]" style={{ color: 'var(--fg)' }}>
          Lĩnh vực nào thuận lợi, lĩnh vực nào cần chăm chút
        </h2>
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          Celes so 12 lĩnh vực trong lá số của bạn với nhau — không so với người khác. Chạm vào từng dòng để xem lý do.
        </p>
      </div>

      <RadarManhYeu laSo={laSo} ds={ds} mo={mo} daThay={daThay} onChon={toiDong} />

      {/* Nhìn một giây là biết: mạnh nhất và cần chăm chút nhất */}
      <div className="grid grid-cols-2 gap-[12px]">
        {[
          { d: dau, nhan: 'Thuận lợi nhất', mau: 'var(--tier-manh)' },
          { d: cuoi, nhan: 'Cần chăm chút nhất', mau: 'var(--tier-gang)' },
        ].map(({ d, nhan, mau }) => (
          <button
            key={nhan}
            type="button"
            onClick={() => toiDong(d.cung)}
            className="flex min-h-[72px] flex-col items-start gap-[4px] rounded-[12px] border p-[12px] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]"
            style={{ borderColor: `color-mix(in srgb, ${mau} 45%, transparent)`, background: `color-mix(in srgb, ${mau} 8%, transparent)` }}
          >
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: mau }}>
              {nhan}
            </span>
            <span className="text-[17px] font-semibold leading-[22px]" style={{ color: 'var(--fg)' }}>
              {tenLv(d.linhVuc)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[16px]">
        {/* Cách đọc thanh — một câu, vừa cả cột hẹp của điện thoại (nhãn trục ba chữ ở đó bị gãy dòng) */}
        <p className="caption flex items-center gap-[8px] px-[8px]" style={{ color: 'var(--fg-muted)' }}>
          <span aria-hidden className="inline-block h-[12px] w-[2px] shrink-0 rounded-full" style={{ background: 'var(--line-strong)' }} />
          Vạch giữa là mức trung bình của lá số. Thanh lệch sang phải là thuận hơn, sang trái là kém hơn.
        </p>
        <NhomCung m="Mạnh" ds={nhomDs('Mạnh')} thuTu={thuTuDong} c={chung} />
        <NhomCung m="Bình" ds={nhomDs('Bình')} thuTu={thuTuDong} c={chung} />
        <NhomCung m="Cần gắng" ds={nhomDs('Cần gắng')} thuTu={thuTuDong} c={chung} />
      </div>

      {tomTat ? (
        /* Ba dòng rồi "Đọc tiếp" — bản đồ là phần người ta đến để xem, lời bình đi sau */
        <div
          className="flex flex-col items-start gap-[8px] rounded-[12px] p-[16px]"
          style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)' }}
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
            Celes nhận xét
          </span>
          <p className={`body-text ${moTomTat ? '' : 'line-clamp-3'}`} style={{ color: 'var(--fg)' }}>
            {tomTat}
          </p>
          <button type="button" className="link-text link-action" onClick={() => setMoTomTat((v) => !v)} aria-expanded={moTomTat}>
            {moTomTat ? 'Thu gọn' : 'Đọc tiếp'}
          </button>
        </div>
      ) : dangDocTomTat ? (
        <div className="flex flex-col gap-[8px] rounded-[12px] p-[16px]" style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)' }} aria-hidden>
          {[96, 88, 70].map((w) => (
            <span key={w} className="block h-[10px] rounded-full" style={{ width: `${w}%`, background: 'var(--line)' }} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-[8px]">
        {cungDv && (
          <p className="caption">
            <Nhan>Vận hiện tại</Nhan> Lĩnh vực mà giai đoạn 10 năm này của bạn đang đi qua.
          </p>
        )}
        {cungTh && (
          <p className="caption">
            <Nhan>Năm {namXem}</Nhan> Lĩnh vực được chú ý nhiều nhất trong năm {namXem}.
          </p>
        )}
        <p className="caption">
          Cách tính: mỗi cung được cộng điểm từ các sao tốt, trừ điểm từ các sao xấu, và tính thêm ảnh hưởng của các cung liên
          quan; 12 lĩnh vực sau đó được xếp hạng với nhau. Đây là so sánh để biết nên dựa vào đâu, chú ý chỗ nào — không phải
          lời phán tốt hay xấu.
        </p>
      </div>
    </section>
  );
}
