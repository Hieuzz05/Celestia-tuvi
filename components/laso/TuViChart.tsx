'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  tamPhuongTuChinh,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { CenterPanel } from './CenterPanel';
import { PalaceCell } from './PalaceCell';
import { PalaceDrawer } from './PalaceDrawer';
import { VoidMarkers, type VoidMarker } from './VoidMarkers';
import { MAC_DINH_SETTINGS, NHAN_SETTINGS, type DisplaySettings } from './types';

const ZOOM_LEVELS = [0.6, 0.8, 1, 1.25, 1.5];
const CHART_WIDTH = 920;

export function TuViChart({
  laSo,
  namXem,
  thangXem,
  onNamXemChange,
}: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
  onNamXemChange: (nam: number) => void;
}) {
  const [settings, setSettings] = useState<DisplaySettings>(MAC_DINH_SETTINGS);
  const [hoverCung, setHoverCung] = useState<number | null>(null);
  const [chonCung, setChonCung] = useState<number | null>(null);
  const [moDrawer, setMoDrawer] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hienSettings, setHienSettings] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const cungTieuHanIndex = cungTieuHan(laSo, tuoiAm);
  const cungNguyetHanIndex = cungNguyetHan(laSo, tuoiAm, thangXem);
  const daiVanHienTai = cungDaiVan(laSo, tuoiAm);

  const cungActive = chonCung ?? hoverCung;
  const quanHe = useMemo(() => {
    if (cungActive === null || !settings.tamPhuongTuChinh) return null;
    return tamPhuongTuChinh(cungActive);
  }, [cungActive, settings.tamPhuongTuChinh]);

  const markers = useMemo<VoidMarker[]>(() => {
    const tuan = laSo.cungs.filter((c) => c.coTuan).map((c) => c.chiIndex);
    const triet = laSo.cungs.filter((c) => c.coTriet).map((c) => c.chiIndex);
    const sapXep = (cap: number[]): [number, number] =>
      // Cặp Hợi-Tý liền kề theo vòng địa chi nhưng index không liền nhau
      cap.includes(0) && cap.includes(11) ? [11, 0] : ([...cap].sort((a, b) => a - b) as [number, number]);
    const out: VoidMarker[] = [];
    if (tuan.length === 2) out.push({ loai: 'tuan', cungs: sapXep(tuan) });
    if (triet.length === 2) out.push({ loai: 'triet', cungs: sapXep(triet) });
    return out;
  }, [laSo]);

  const trangThaiCung = (chiIndex: number) => {
    if (cungActive === null || !quanHe) return 'thuong' as const;
    if (chiIndex === cungActive) return 'chon' as const;
    if (quanHe.tamHop.includes(chiIndex)) return 'tam-hop' as const;
    if (chiIndex === quanHe.xungChieu) return 'xung-chieu' as const;
    return 'mo' as const;
  };

  const xuatPng = useCallback(async () => {
    if (!chartRef.current) return;
    const nen = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const dataUrl = await toPng(chartRef.current, { backgroundColor: nen || '#08080a', pixelRatio: 2 });
    const a = document.createElement('a');
    a.download = `la-so-${laSo.thongTin.hoTen?.trim() || 'tu-vi'}.png`;
    a.href = dataUrl;
    a.click();
  }, [laSo]);

  const chepJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(laSo, null, 2));
  }, [laSo]);

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-x-[24px] gap-y-[12px]">
        <div className="flex items-center gap-[12px]">
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Năm xem
          </span>
          <button className="link-text" onClick={() => onNamXemChange(namXem - 1)} aria-label="Năm trước">
            ‹
          </button>
          <span className="text-[15px] tabular-nums">{namXem}</span>
          <button className="link-text" onClick={() => onNamXemChange(namXem + 1)} aria-label="Năm sau">
            ›
          </button>
        </div>

        <div className="flex items-center gap-[10px]">
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Thu phóng
          </span>
          {ZOOM_LEVELS.map((z) => (
            <button
              key={z}
              className="pill-tag text-[13px]"
              data-active={zoom === z}
              onClick={() => setZoom(z)}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-[16px]">
          <button className="link-text" onClick={() => setHienSettings((v) => !v)} data-active={hienSettings}>
            Tuỳ chọn hiển thị
          </button>
          <button className="link-text" onClick={xuatPng}>
            Xuất PNG
          </button>
          <button className="link-text" onClick={chepJson}>
            Copy JSON
          </button>
          <button className="link-text" onClick={() => window.print()}>
            In
          </button>
        </div>
      </div>

      {hienSettings && (
        <div className="no-print flex flex-wrap gap-x-[24px] gap-y-[10px] py-[6px]">
          {NHAN_SETTINGS.map(({ key, nhan }) => (
            <label key={key} className="flex cursor-pointer items-center gap-[8px] text-[13px]">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                className="accent-[var(--accent)]"
              />
              <span style={{ color: settings[key] ? 'var(--fg)' : 'var(--fg-muted)' }}>
                {nhan}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Mệnh bàn */}
      <div className="overflow-auto">
        <div
          ref={chartRef}
          className="relative grid grid-cols-4 grid-rows-4"
          style={{
            minWidth: CHART_WIDTH,
            background: 'var(--bg)',
            // `zoom` thay cho `transform: scale()` — scale + width theo % trong
            // khung cuộn tạo vòng phản hồi layout làm treo trình duyệt.
            zoom,
          }}
          onMouseLeave={() => setHoverCung(null)}
        >
            {laSo.cungs.map((cung) => (
              <PalaceCell
                key={cung.chiIndex}
                cung={cung}
                settings={settings}
                trangThai={trangThaiCung(cung.chiIndex)}
                laTieuHan={settings.tieuHan && cungTieuHanIndex === cung.chiIndex}
                laDaiHanHienTai={daiVanHienTai?.chiIndex === cung.chiIndex}
                nguyetHanThang={cungNguyetHanIndex === cung.chiIndex ? thangXem : undefined}
                onHover={setHoverCung}
                onSelect={(i) => {
                  setChonCung(i);
                  setMoDrawer(true);
                }}
              />
            ))}
          <CenterPanel laSo={laSo} namXem={namXem} tuoiAm={tuoiAm} />
          {settings.tuanTriet && <VoidMarkers markers={markers} />}
        </div>
      </div>

      {/* Legend */}
      <div
        className="no-print flex flex-wrap items-center gap-x-[20px] gap-y-[6px] text-[12px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        <span>
          Độ sáng: <span style={{ color: 'var(--accent)' }}>M</span> Miếu ·{' '}
          <span style={{ color: 'var(--accent)' }}>V</span> Vượng ·{' '}
          <span style={{ color: 'var(--fg-body)' }}>D</span> Đắc ·{' '}
          <span style={{ color: 'var(--fg-muted)' }}>B</span> Bình ·{' '}
          <span style={{ color: 'var(--chart-hung)' }}>H</span> Hãm
        </span>
        <span style={{ color: 'var(--chart-hung)' }}>● Hung tinh</span>
        <span style={{ color: 'var(--accent)' }}>▢ Cung đang chọn / tam hợp</span>
        <span style={{ color: 'var(--accent)' }}>▢ Xung chiếu · tiểu hạn</span>
        <span>Rê chuột để xem tam phương tứ chính · bấm vào cung để mở chi tiết</span>
      </div>

      <PalaceDrawer
        laSo={laSo}
        chiIndex={moDrawer ? chonCung : null}
        tuoiAm={tuoiAm}
        thangXem={thangXem}
        cungTieuHanIndex={cungTieuHanIndex}
        cungNguyetHanIndex={cungNguyetHanIndex}
        onClose={() => {
          setMoDrawer(false);
          setChonCung(null);
        }}
      />
    </div>
  );
}
