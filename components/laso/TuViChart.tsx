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
import { useT } from '@/lib/i18n/context';
import { CenterPanel } from './CenterPanel';
import { PalaceCell } from './PalaceCell';
import { PalaceDrawer } from './PalaceDrawer';
import { VoidMarkers, type VoidMarker } from './VoidMarkers';
import {
  NHAN_SETTINGS,
  SETTINGS_THEO_CHE_DO,
  type DisplaySettings,
} from './types';

const CHART_WIDTH = 920;
/** Dưới mức này chữ trong ô cung không còn đọc được */
const ZOOM_TOI_THIEU = 0.5;
/**
 * Bỏ qua thay đổi tỉ lệ nhỏ hơn ngưỡng này.
 * Thanh cuộn dọc xuất hiện/biến mất làm bề ngang đổi vài pixel; nếu tỉ lệ bám
 * theo từng pixel thì mệnh bàn co giãn liên tục và nhấp nháy.
 */
const NGUONG_DOI_TI_LE = 0.02;

export function TuViChart({
  laSo,
  namXem,
  thangXem,
  onNamXemChange,
  chiBanDo = false,
}: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
  onNamXemChange: (nam: number) => void;
  /** Chỉ vẽ mệnh bàn, bỏ hết thanh công cụ — dùng khi làm ảnh mờ sau cổng đăng nhập */
  chiBanDo?: boolean;
}) {
  const t = useT();
  /*
   * Luôn ở mức CHUYÊN SÂU. Không còn ba nút chọn độ dày.
   *
   * Ba chiếc nút ấy nằm ngay trên mệnh bàn là một câu hỏi đặt sai lúc: người mở
   * lá số ra để đọc, không phải để chọn mức hiển thị trước đã. Ai muốn bớt lớp
   * thì mở "Lớp hiển thị" và tắt đúng lớp mình không cần — chi tiết hơn hẳn ba
   * mức làm sẵn.
   */
  const [settings, setSettings] = useState<DisplaySettings>(SETTINGS_THEO_CHE_DO['chuyen-sau']);
  const [hoverCung, setHoverCung] = useState<number | null>(null);
  const [chonCung, setChonCung] = useState<number | null>(null);
  const [moDrawer, setMoDrawer] = useState(false);
  const [zoomThucTe, setZoomThucTe] = useState(1);
  const khungRef = useRef<HTMLDivElement>(null);
  const [hienSettings, setHienSettings] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Chỉ đo BỀ NGANG của khung chứa, tuyệt đối không đo lại mệnh bàn.
  // Đo mệnh bàn rồi đặt lại chiều cao wrapper sẽ làm thanh cuộn dọc xuất hiện
  // rồi biến mất, kéo theo bề ngang đổi -> tỉ lệ đổi -> lặp vô tận (nhấp nháy).
  useEffect(() => {
    const khung = khungRef.current;
    if (!khung) return;

    const doLai = () => {
      const moi = Math.max(ZOOM_TOI_THIEU, Math.min(1, khung.clientWidth / CHART_WIDTH));
      setZoomThucTe((cu) => (Math.abs(moi - cu) < NGUONG_DOI_TI_LE ? cu : moi));
    };

    doLai();
    const ro = new ResizeObserver(doLai);
    ro.observe(khung);
    return () => ro.disconnect();
  }, []);

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
      backgroundColor: nen || '#ffffff',
      pixelRatio: 2 / Math.max(zoomThucTe, 0.1),
    });
    const a = document.createElement('a');
    a.download = `la-so-${laSo.thongTin.hoTen?.trim() || 'tu-vi'}.png`;
    a.href = dataUrl;
    a.click();
  }, [laSo, zoomThucTe]);

  return (
    <div className="flex flex-col gap-[18px]">
      {/*
        Toolbar dính lên đầu khối cuộn.

        Mệnh bàn cao hơn màn hình nên cột chứa nó tự cuộn bên trong, và thanh
        này nằm trên cùng thì bị đẩy khuất ngay khi người dùng cuộn xuống xem
        cung dưới — đúng lúc họ cần đổi năm hoặc tắt bớt lớp.

        `-mx` rồi `px` bù lại để nền che kín mép khi nội dung trượt qua dưới.

        CHỈ dính từ lg trở lên. Dưới đó cột trái không còn cuộn riêng nữa, nên
        `sticky` sẽ bám vào khung nhìn và chui xuống dưới thanh điều hướng —
        thanh đó cũng dính ở top-0 và có z-index cao hơn.
      */}
      {!chiBanDo && (
      <div
        className="no-print -mx-[4px] flex flex-wrap items-center gap-x-[24px] gap-y-[12px] px-[4px] py-[8px] lg:sticky lg:top-0 lg:z-10"
        style={{ background: 'var(--bg)' }}
      >
        <div className="flex items-center gap-[12px]">
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            {t.banDo.namXem}
          </span>
          <button className="link-text" onClick={() => onNamXemChange(namXem - 1)} aria-label={t.banDo.namTruoc}>
            ‹
          </button>
          <span className="text-[15px] tabular-nums">{namXem}</span>
          <button className="link-text" onClick={() => onNamXemChange(namXem + 1)} aria-label={t.banDo.namSau}>
            ›
          </button>
        </div>

        <div className="ml-auto flex items-center gap-[16px]">
          {/* Bật tắt từng lớp là việc của người đã quen mệnh bàn — chỉ mở ở
              chế độ Chuyên sâu, bằng không nó phá luôn ý nghĩa của hai chế độ kia. */}
          <button className="link-text" onClick={() => setHienSettings((v) => !v)} data-active={hienSettings}>
            {t.banDo.lopHienThi}
          </button>
          <button className="link-text" onClick={xuatPng}>
            {t.banDo.xuatAnh}
          </button>
          <button className="link-text" onClick={() => window.print()}>
            {t.banDo.inRa}
          </button>
        </div>
      </div>
      )}

      {hienSettings && (
        <div className="no-print flex flex-wrap gap-x-[24px] gap-y-[10px] py-[6px]">
          {NHAN_SETTINGS.map(({ key, nhan }) => (
            <label key={key} className="flex cursor-pointer items-center gap-[8px] text-[13px]">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
                className="accent-[var(--fg)]"
              />
              <span style={{ color: settings[key] ? 'var(--fg)' : 'var(--fg-muted)' }}>
                {nhan}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Mệnh bàn
          Cuộn ngang khi màn hẹp. Dưới 0.5 thì chữ trong ô cung không đọc nổi
          nữa, nên ở điện thoại mệnh bàn giữ tỉ lệ 0.5 rồi cho vuốt ngang — thà
          vuốt còn hơn nhìn một mớ chữ không đọc được. Không có khung cuộn này
          thì mệnh bàn 460px nằm trong ô 342px và đẩy cả TRANG cuộn ngang. */}
      <div ref={khungRef} className="overflow-x-auto">
        <div
          ref={chartRef}
          className="relative grid grid-cols-4"
          style={{
            width: CHART_WIDTH,
            gridTemplateRows: 'repeat(4, auto)',
            background: 'var(--bg)',
            // Dùng CSS `zoom` chứ không phải transform: zoom có tác động tới
            // layout nên chiều cao tự co theo, khỏi phải đo và đặt tay.
            zoom: zoomThucTe,
          }}
          // Chỉ xoá trạng thái rê chuột khi ra khỏi CẢ mệnh bàn. Nếu từng ô cũng
          // xoá thì rê từ ô này sang ô kia sẽ đi qua trạng thái rỗng, làm hiệu
          // ứng làm mờ tắt rồi bật lại — nhìn như nhấp nháy.
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
