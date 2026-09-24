'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

/**
 * Bề ngang GỐC của mệnh bàn, trước khi nhân tỉ lệ.
 *
 * Có hai con số vì điện thoại cần một bố cục khác, không phải cùng một bố cục
 * thu nhỏ. Đây là chỗ bản trước làm sai và chủ dự án bắt được: giữ nguyên gốc
 * 920 rồi ép tỉ lệ xuống 0.37 thì chữ còn ~4px, nên tôi đã tắt bớt phụ tinh
 * cho đỡ rối — tức là tự ý cắt mất thông tin của người ta.
 *
 * Hạ GỐC thay vì hạ tỉ lệ thì mọi thứ đổi khác: ô hẹp hơn nên chữ xuống dòng
 * nhiều hơn và bàn cao hơn, nhưng tỉ lệ lên khoảng 0.7 nên chữ to gần gấp đôi.
 * Bàn dài ra thì cuộn dọc — việc người ta vẫn làm; chữ 4px thì không đọc được
 * bằng cách nào cả.
 */
const CHART_WIDTH = 920;
const CHART_WIDTH_HEP = 480;

/**
 * Sàn thu nhỏ — ĐÃ HẠ TỪ 0.5 XUỐNG 0.3, và đây là một lần đảo quyết định.
 *
 * Bản trước chốt 0.5 với lý lẽ "dưới mức này chữ không đọc nổi, thà vuốt ngang
 * còn hơn". Lý lẽ ấy đúng về chữ nhưng sai về thứ người dùng gặp: 920 × 0.5 =
 * 460px nằm trong cột 342px của máy 390px, nên trên điện thoại mệnh bàn bị
 * CẮT MẤT GẦN MỘT NỬA và người mới không biết là còn phần bên phải để vuốt.
 * Chủ dự án mở bằng điện thoại và thấy đúng như vậy.
 *
 * Mất nửa bản đồ tệ hơn chữ nhỏ. Ở bề ngang điện thoại thì KHÔNG có cách nào
 * hiện mười hai cung với chữ đọc được — bốn cột trên 342px là mỗi ô 85px, chỗ
 * ấy không đủ cho một tên sao ở cỡ chữ bình thường. Nên phải chọn, và chọn
 * đúng là: cho thấy TOÀN BỘ hình, rồi đưa chữ sang chỗ khác.
 *
 * "Chỗ khác" đã có sẵn: chạm vào một cung là mở PalaceDrawer chiếm trọn bề
 * ngang, chữ cỡ thật. Mệnh bàn trên điện thoại vì thế làm đúng việc của một
 * TẤM BẢN ĐỒ — cho thấy cái gì nằm ở đâu — còn việc đọc thì thuộc về ngăn chi
 * tiết.
 */
const ZOOM_TOI_THIEU = 0.3;

/** Dưới bề ngang này thì dùng bố cục hẹp: gốc 480 thay vì 920, thêm lời nhắc chạm */
const BE_NGANG_HEP = 520;
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
  const [hep, setHep] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Chỉ đo BỀ NGANG của khung chứa, tuyệt đối không đo lại mệnh bàn.
  // Đo mệnh bàn rồi đặt lại chiều cao wrapper sẽ làm thanh cuộn dọc xuất hiện
  // rồi biến mất, kéo theo bề ngang đổi -> tỉ lệ đổi -> lặp vô tận (nhấp nháy).
  //
  // useLayoutEffect, không phải useEffect: đo TRƯỚC khi vẽ. Bản useEffect vẽ
  // mệnh bàn ở tỉ lệ 1 một nhịp rồi mới co lại — đo 24/09/2026: chân trang
  // nhảy 791px, phần lớn điểm CLS của /la-so.
  useLayoutEffect(() => {
    const khung = khungRef.current;
    if (!khung) return;

    const doLai = () => {
      const rong = khung.clientWidth;
      const laHep = rong > 0 && rong < BE_NGANG_HEP;
      /*
       * KHÔNG tắt bớt lớp thông tin nữa.
       *
       * Bản trước tự hạ về chế độ "dễ hiểu" khi màn hẹp, và chủ dự án chỉ ra
       * ngay: lá số mất sạch phụ tinh. Người mở lá số trên điện thoại vẫn cần
       * đủ sao như trên máy tính — họ chỉ có ít chỗ hơn để bày, chứ không cần
       * ít thông tin hơn. Chỗ ít thì giải bằng bố cục hẹp và cuộn dọc, không
       * giải bằng cách giấu bớt đi.
       */
      const goc = laHep ? CHART_WIDTH_HEP : CHART_WIDTH;
      const moi = Math.max(ZOOM_TOI_THIEU, Math.min(1, rong / goc));
      setZoomThucTe((cu) => (Math.abs(moi - cu) < NGUONG_DOI_TI_LE ? cu : moi));
      setHep(laHep);
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
    /*
      `min-h-0` + `flex-1`: khi nằm trong cột dính ở /la-so thì nhận đúng phần
      cao còn lại và cho phép khung cuộn bên trong co lại.

      `min-w-0` là thứ THIẾU suốt và là nguyên nhân thật của lỗi mệnh bàn tràn
      trên điện thoại. Con của flex/grid mặc định `min-width: auto`, nghĩa là
      nó KHÔNG co xuống dưới bề ngang nội dung — nên khung `overflow-x-auto`
      bên trong nở ra đúng 920px thay vì nhận 342px của màn. Phép đo tỉ lệ đọc
      được 920/920 rồi kết luận "không cần thu nhỏ", và cả TRANG bị đẩy rộng
      945px. Sàn thu nhỏ chưa bao giờ là vấn đề: nó không có cơ hội chạy.
    */
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[18px]">
      {/*
        Thanh công cụ đứng yên cùng mệnh bàn.

        Không dùng `sticky` nữa. Bản trước cho thanh này `sticky top-0` bên
        trong cột trái, mà cột trái khi đó vừa dính vừa tự cuộn — thanh dính so
        với khung cuộn ấy chứ không so với màn hình, nên cửa sổ thấp hơn mệnh
        bàn là nó trôi mất.

        Giờ khung cuộn chuyển xuống ôm riêng mệnh bàn, còn thanh nằm NGOÀI nó,
        chỉ cần `shrink-0` để không bị bóp lại. Đã ở ngoài khung cuộn thì không
        có đường nào trôi đi được, bất kể cửa sổ cao bao nhiêu.
      */}
      {!chiBanDo && (
      <div className="no-print flex shrink-0 flex-wrap items-center gap-x-[24px] gap-y-[12px]">
        {/*
          Nút đổi năm: đo 24/09/2026 chỉ rộng 5px — chữ "‹" trần, gần như không
          chạm trúng được trên điện thoại. Giờ là ô 44×44 có viền.
        */}
        <div className="flex items-center gap-[8px]">
          <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            {t.banDo.namXem}
          </span>
          <button
            type="button"
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border text-[18px]"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--fg)' }}
            onClick={() => onNamXemChange(namXem - 1)}
            aria-label={t.banDo.namTruoc}
          >
            ‹
          </button>
          <span className="min-w-[44px] text-center text-[16px] font-semibold tabular-nums">{namXem}</span>
          <button
            type="button"
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border text-[18px]"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--fg)' }}
            onClick={() => onNamXemChange(namXem + 1)}
            aria-label={t.banDo.namSau}
          >
            ›
          </button>
        </div>

        <div className="ml-auto flex items-center gap-[16px]">
          {/* Bật tắt từng lớp là việc của người đã quen mệnh bàn — chỉ mở ở
              chế độ Chuyên sâu, bằng không nó phá luôn ý nghĩa của hai chế độ kia. */}
          <button className="link-text link-action inline-flex min-h-[44px] items-center" onClick={() => setHienSettings((v) => !v)} data-active={hienSettings}>
            {t.banDo.lopHienThi}
          </button>
          <button className="link-text link-action inline-flex min-h-[44px] items-center" onClick={xuatPng}>
            {t.banDo.xuatAnh}
          </button>
          {/*
            In ra: ẩn trên màn hẹp.

            Không phải vì điện thoại không in được — vì trên thanh công cụ chỉ
            vừa ba bốn mục, mà "in" là mục ít ai chạm nhất ở đó. Giữ nó là đẩy
            "Lớp hiển thị" và "Xuất ảnh" — hai việc người dùng điện thoại thật
            sự làm — xuống hàng thứ hai của thanh (đo 24/09/2026: bị cắt mép phải).
          */}
          {/* Bọc ngoài: `.link-action` đặt display ngoài layer nên thắng `max-sm:hidden` gắn thẳng lên nút */}
          <span className="max-sm:hidden">
            <button className="link-text link-action" onClick={() => window.print()}>
              {t.banDo.inRa}
            </button>
          </span>
        </div>
      </div>
      )}

      {hienSettings && (
        <div className="no-print flex shrink-0 flex-wrap gap-x-[24px] gap-y-[10px] py-[6px]">
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

      {/* Mệnh bàn — và là khung cuộn DUY NHẤT của khối này.

          Cuộn ngang khi màn hẹp. Dưới 0.5 thì chữ trong ô cung không đọc nổi
          nữa, nên ở điện thoại mệnh bàn giữ tỉ lệ 0.5 rồi cho vuốt ngang — thà
          vuốt còn hơn nhìn một mớ chữ không đọc được. Không có khung cuộn này
          thì mệnh bàn 460px nằm trong ô 342px và đẩy cả TRANG cuộn ngang.

          Từ lg thêm cuộn DỌC: ở /la-so khối này nằm trong cột dính cao tối đa
          một màn, nên khi cửa sổ thấp hơn mệnh bàn thì phần thừa phải cuộn ở
          đây — không phải ở cả cột, vì cuộn cả cột là kéo thanh công cụ đi
          theo. Dưới lg thì cột không dính, trang cuộn như thường. */}
      <div ref={khungRef} className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <div
          ref={chartRef}
          className="relative grid grid-cols-4"
          style={{
            width: hep ? CHART_WIDTH_HEP : CHART_WIDTH,
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
                hep={hep}
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

      {/*
        Lời nhắc CHẠM, chỉ hiện ở màn hẹp.
        Ở tỉ lệ thu nhỏ của điện thoại, chữ trong ô cung là để nhận dạng chứ
        không phải để đọc. Ngăn chi tiết mới là chỗ đọc — nhưng người dùng
        không đoán được điều đó nếu không có ai nói, và một mệnh bàn chữ li ti
        trông như một lỗi hiển thị chứ không như một tấm bản đồ bấm được.
      */}
      {hep && !chiBanDo && (
        <p className="caption px-[2px] pt-[8px]">{t.banDo.chamDeXem}</p>
      )}

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
