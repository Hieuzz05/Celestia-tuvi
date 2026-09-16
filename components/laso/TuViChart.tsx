'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { CenterPanel } from './CenterPanel';
import { PalaceCell } from './PalaceCell';
import { PalaceDrawer } from './PalaceDrawer';
import { VoidMarkers, type VoidMarker } from './VoidMarkers';
import { MAC_DINH_SETTINGS, NHAN_SETTINGS, type DisplaySettings } from './types';

const CHART_WIDTH = 920;
/**
 * Chiều cao tự nhiên của mệnh bàn. Ô cung tự giãn theo nội dung nên con số này
 * chỉ dùng để ước lượng tỉ lệ ban đầu; sau khi render sẽ đo lại cho chính xác.
 */
const CHART_HEIGHT_UOC_LUONG = 820;
/** Dưới mức này chữ trong ô cung không còn đọc được */
const ZOOM_TOI_THIEU = 0.5;

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
  const [zoomVuaKhung, setZoomVuaKhung] = useState(1);
  const [cheoThuc, setCheoThuc] = useState(CHART_HEIGHT_UOC_LUONG);
  const khungRef = useRef<HTMLDivElement>(null);
  const [hienSettings, setHienSettings] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Ô cung giãn theo nội dung nên chiều cao thật chỉ biết sau khi render. Đo
  // bằng scrollHeight của phần tử KHÔNG bị biến đổi (transform không tác động
  // tới layout) rồi mới tính tỉ lệ — tránh vòng phản hồi từng làm treo trình duyệt.
  useEffect(() => {
    const khung = khungRef.current;
    const chart = chartRef.current;
    if (!khung || !chart) return;

    const doLai = () => {
      const cao = chart.scrollHeight;
      if (cao > 0) setCheoThuc(cao);
      setZoomVuaKhung(Math.max(ZOOM_TOI_THIEU, Math.min(1, khung.clientWidth / CHART_WIDTH)));
    };

    doLai();
    const ro = new ResizeObserver(doLai);
    ro.observe(khung);
    ro.observe(chart);
    window.addEventListener('resize', doLai);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', doLai);
    };
  }, [settings, laSo]);

  const zoomThucTe = zoomVuaKhung;

  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
  const cungTieuHanIndex = cungTieuHan(laSo, tuoiAm);
  const cungNguyetHanIndex = cungNguyetHan(laSo, tuoiAm, thangXem);
  const daiVanHienTai = cungDaiVan(laSo, tuoiAm);

  const luuTinhTheoCung = useMemo(() => {
    const theoCung = new Map<number, { ten: string; tinhChat?: string }[]>();
    for (const s of luuTinhTheoNam(namXem)) {
      if (!theoCung.has(s.chiIndex)) theoCung.set(s.chiIndex, []);
      theoCung.get(s.chiIndex)!.push({ ten: s.ten, tinhChat: s.tinhChat });
    }
    return theoCung;
  }, [namXem]);

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
    const dataUrl = await toPng(chartRef.current, {
      backgroundColor: nen || '#08080a',
      pixelRatio: 2 / Math.max(zoomThucTe, 0.1),
    });
    const a = document.createElement('a');
    a.download = `la-so-${laSo.thongTin.hoTen?.trim() || 'tu-vi'}.png`;
    a.href = dataUrl;
    a.click();
  }, [laSo, zoomThucTe]);

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
      <div className="overflow-auto" ref={khungRef}>
        <div
          style={{
            width: CHART_WIDTH * zoomThucTe,
            height: cheoThuc * zoomThucTe,
          }}
        >
          <div
            ref={chartRef}
            className="relative grid grid-cols-4"
            style={{
              width: CHART_WIDTH,
              gridTemplateRows: 'repeat(4, auto)',
              background: 'var(--bg)',
              transform: `scale(${zoomThucTe})`,
              transformOrigin: 'top left',
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
                luuTinh={luuTinhTheoCung.get(cung.chiIndex)}
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
