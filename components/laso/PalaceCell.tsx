'use client';

import type { Cung } from '@/lib/tuvi/ansao';
import type { Sao } from '@/lib/tuvi/constants';
import { PHU_TINH_TRONG_YEU, VI_TRI_GRID, type DisplaySettings } from './types';

type TrangThai = 'thuong' | 'chon' | 'tam-hop' | 'xung-chieu' | 'mo';

const MAU_DO_SANG: Record<string, string> = {
  M: 'var(--chart-tot)',
  V: 'var(--chart-tot)',
  D: 'var(--fg-body)',
  L: 'var(--fg-body)',
  B: 'var(--fg-muted)',
  H: 'var(--chart-hung)',
};

// Bốn Hóa phải phân biệt được: đồng / trắng / xám / đỏ, luôn kèm chữ nên không
// phụ thuộc riêng vào màu.
const MAU_TU_HOA: Record<string, string> = {
  'Hóa Lộc': 'var(--chart-tot)',
  'Hóa Quyền': 'var(--fg)',
  'Hóa Khoa': 'var(--fg-muted)',
  'Hóa Kỵ': 'var(--chart-hung)',
};

function TuHoaBadge({ sao }: { sao: Sao }) {
  const mau = MAU_TU_HOA[sao.ten] ?? 'var(--fg-body)';
  return (
    <span
      className="rounded-full px-[7px] py-[1px] text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: mau, border: `1px solid ${mau}`, lineHeight: 1.5 }}
    >
      {sao.ten.replace('Hóa ', '')}
    </span>
  );
}

function SaoText({
  sao,
  hienDoSang,
  trongYeu,
  hep = false,
  mo = false,
}: {
  sao: Sao;
  hienDoSang: boolean;
  trongYeu: boolean;
  /** Tầng thấp hơn — vòng Thái Tuế / Lộc Tồn. Nhạt hơn nhưng vẫn đúng cột cát/hung. */
  mo?: boolean;
  /** Bố cục hẹp: chữ nhỏ hơn để hai cột phụ tinh vừa ô 110px — xem ghi chú ở phần phụ tinh */
  hep?: boolean;
}) {
  const mau = mo
    ? 'var(--fg-subtle)'
    : sao.tinhChat === 'hung'
      ? 'var(--chart-hung)'
      : trongYeu
        ? 'var(--fg-body)'
        : 'var(--fg-muted)';
  return (
    <span
      /*
        Dấu để bộ kiểm giữ BA NHÓM SAO NHỎ luôn cùng một cỡ chữ: phụ tinh,
        vòng Thái Tuế/Lộc Tồn, và lưu tinh theo năm. Ba nhóm này trước dùng ba
        cỡ rời nhau (12 / 11 / 11), nên trên điện thoại nhóm ít quan trọng
        nhất lại hiện to hơn nhóm quan trọng hơn nó — mà cỡ chữ chính là cách
        người đọc đoán thứ bậc.
      */
      data-sao="phu"
      /*
        MỘT CỠ CHỮ CHO MỌI SAO NHỎ; phần nhấn để cho NÉT ĐẬM lo.

        Bản cũ cho sao trọng yếu thêm 1px (13 thay 12). Một pixel không đủ để
        mắt nhận ra là "quan trọng hơn", nhưng đủ để hàng chữ trông so le —
        và nó phá luôn nguyên tắc vừa đặt ra là mọi sao nhỏ cùng một cỡ. Nét
        đậm với màu đã nói được thứ bậc rồi.
      */
      className={`${hep ? 'text-[8px]' : 'text-[12px]'} ${
        trongYeu ? 'font-semibold' : 'font-normal'
      }`}
      style={{ color: mau, lineHeight: hep ? 1.5 : 1.45 }}
    >
      {sao.ten}
      {hienDoSang && sao.doSang && (
        <span
          style={{ color: MAU_DO_SANG[sao.doSang] }}
          className={hep ? 'ml-[2px] text-[7px]' : 'ml-[3px] text-[10px]'}
        >
          {sao.doSang}
        </span>
      )}
    </span>
  );
}

export function PalaceCell({
  cung,
  settings,
  trangThai,
  laTieuHan,
  laDaiHanHienTai,
  nguyetHanThang,
  luuTinh,
  onHover,
  onSelect,
  hep = false,
}: {
  cung: Cung;
  settings: DisplaySettings;
  trangThai: TrangThai;
  /**
   * Bố cục hẹp của điện thoại.
   *
   * Ô chỉ rộng khoảng 102px thay vì 212px, nên vài chỗ xếp ngang phải chuyển
   * thành xếp dọc — nếu không thì chữ gãy giữa tên sao.
   */
  hep?: boolean;
  laTieuHan: boolean;
  laDaiHanHienTai: boolean;
  nguyetHanThang?: number;
  luuTinh?: { ten: string; tinhChat?: string }[];
  onHover: (chiIndex: number) => void;
  onSelect: (chiIndex: number) => void;
}) {
  const pos = VI_TRI_GRID[cung.chiIndex];
  const chinhTinh = cung.sao.filter((s) => s.loai === 'chinh-tinh');
  const tuHoa = cung.sao.filter((s) => s.loai === 'tu-hoa');
  const phuTinh = cung.sao.filter((s) => s.loai === 'phu-tinh');
  const vongSao = cung.sao.filter((s) => s.loai === 'vong-sao');

  /*
   * VÒNG THÁI TUẾ / LỘC TỒN NẰM CHUNG HAI CỘT VỚI PHỤ TINH.
   *
   * Trước đây nhóm này được vẽ thành một DẢI NGANG riêng bên dưới lưới, nên
   * nó tách hẳn ra và nằm ngang trong khi mọi sao khác xếp dọc theo cột. Chủ
   * dự án nhìn ảnh và hỏi ngay vì sao chúng khác mọi thứ xung quanh.
   *
   * Không có lý do nào để tách: chúng cũng là sao trên cung ấy, cũng chia
   * được cát/hung như phụ tinh. Cột trái phải là "mọi sao cát của cung này",
   * không phải "một số sao cát". Tầng thấp hơn của chúng đã được nói bằng
   * MÀU nhạt rồi — nói thêm một lần nữa bằng bố cục là thừa, và cái giá là
   * phá vỡ luật hai cột.
   *
   * Xếp sau phụ tinh trong cùng cột để thứ quan trọng hơn đọc trước.
   */
  const nhomSao = [
    ...(settings.phuTinh ? phuTinh : []),
    ...(settings.vongSao ? vongSao : []),
  ];
  const cot1 = nhomSao.filter((s) => s.tinhChat !== 'hung');
  const cot2 = nhomSao.filter((s) => s.tinhChat === 'hung');

  const vienMau =
    trangThai === 'chon'
      ? 'var(--fg)'
      : trangThai === 'tam-hop'
        ? 'var(--chart-tot)'
        : trangThai === 'xung-chieu'
          ? 'var(--line-strong)'
          : cung.laCungMenh
            ? 'var(--fg-subtle)'
            : 'var(--line)';

  return (
    <div
      onMouseEnter={() => onHover(cung.chiIndex)}
      onClick={() => onSelect(cung.chiIndex)}
      className={`relative flex cursor-pointer flex-col transition-opacity duration-150 ${
        hep ? 'p-[5px]' : 'p-[9px]'
      }`}
      style={{
        gridRow: pos.row,
        gridColumn: pos.col,
        minWidth: 0,
        // Ô giãn theo nội dung: thà mệnh bàn cao hơn còn hơn cắt mất tên sao
        minHeight: 150,
        border: `1px solid ${vienMau}`,
        background: laTieuHan ? 'var(--chart-han)' : 'var(--chart-cell)',
        opacity: trangThai === 'mo' ? 0.28 : 1,
      }}
    >
      {/*
        HEADER — một dòng ở màn rộng, HAI DÒNG CÓ CHỦ Ý ở màn hẹp.

        Đo ra: ba phần (can.chi + tên cung + số đại hạn, có ô còn thêm nhãn
        THÂN) cần 132px, mà ô ở bố cục hẹp chỉ có 99px. Không có cỡ chữ nào
        vừa cả ba mà còn đọc được — hạ tiếp thì tên cung xuống dưới 9px.

        Nên thay vì để flex tự vỡ dòng ở chỗ nó muốn — kết quả là số đại hạn
        rơi xuống một mình, nhìn như lỗi — ta CHỌN chỗ ngắt: dòng trên là hai
        mẩu phụ (can.chi trái, số đại hạn phải), dòng dưới là tên cung đứng
        giữa. Mắt đọc được ngay thứ tự: đây là cung gì, rồi mới tới chi tiết.

        Ở màn rộng ô có 212px nên vẫn một dòng như lá số giấy.
      */}
      {hep ? (
        <div className="flex flex-col gap-[1px]">
          <div className="flex items-baseline justify-between gap-x-1">
            <span className="text-[9px] font-medium" style={{ color: 'var(--fg-muted)' }}>
              {cung.can.slice(0, 1)}.{cung.chi}
            </span>
            <span
              className="text-[9px] font-medium tabular-nums"
              style={{
                color: laDaiHanHienTai ? 'var(--chart-tot)' : 'var(--fg-muted)',
                visibility: settings.daiHan && cung.daiVan ? 'visible' : 'hidden',
              }}
            >
              {cung.daiVan?.tuTuoi}
            </span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span
              className="whitespace-nowrap text-[13px] font-bold tracking-tight"
              style={{ color: cung.laCungMenh ? 'var(--fg)' : 'var(--fg-body)' }}
            >
              {cung.tenCung}
            </span>
            {cung.laCungThan && (
              <span
                className="rounded-full px-[4px] text-[8px] font-semibold uppercase"
                style={{ color: 'var(--chart-tot)', border: '1px solid var(--chart-tot)' }}
              >
                Thân
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-x-1">
          <span className="text-[11px] font-medium" style={{ color: 'var(--fg-muted)' }}>
            {cung.can}.{cung.chi}
          </span>
          <span className="flex min-w-0 items-baseline gap-1">
            <span
              className="whitespace-nowrap text-[15px] font-bold tracking-tight"
              style={{ color: cung.laCungMenh ? 'var(--fg)' : 'var(--fg-body)' }}
            >
              {cung.tenCung}
            </span>
            {cung.laCungThan && (
              <span
                className="rounded-full px-[6px] text-[9px] font-semibold uppercase"
                style={{ color: 'var(--chart-tot)', border: '1px solid var(--chart-tot)' }}
              >
                Thân
              </span>
            )}
          </span>
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{
              color: laDaiHanHienTai ? 'var(--chart-tot)' : 'var(--fg-muted)',
              visibility: settings.daiHan && cung.daiVan ? 'visible' : 'hidden',
            }}
          >
            {cung.daiVan?.tuTuoi}
          </span>
        </div>
      )}

      {/* Chính tinh */}
      {settings.chinhTinh && (
        <div className="mt-[6px] flex flex-col items-center">
          {chinhTinh.length ? (
            chinhTinh.map((s) => (
              /*
                TÊN SAO KHÔNG BAO GIỜ ĐƯỢC GÃY GIỮA CHỪNG.

                Ở bố cục hẹp, ô rộng 102px còn tên dài nhất ("Thiên Tướng") là
                94px — vừa. Nhưng nhãn độ sáng bám sau tên đẩy cả cụm quá mép,
                và trình duyệt cắt ở khoảng trắng GIỮA TÊN: "Tham" xuống một
                dòng, "Lang" xuống dòng sau. Đo được 56 chỗ gãy như vậy.

                Một cái tên bị tách làm đôi không còn là cái tên. Nhãn độ sáng
                thì xuống dòng được — nó là chú thích, không phải danh từ.
              */
              <span
                key={s.ten}
                className="text-[16px] font-semibold leading-tight tracking-tight"
                style={{ color: 'var(--fg)' }}
              >
                <span className="whitespace-nowrap">{s.ten}</span>
                {settings.doSang && s.doSang && (
                  <span style={{ color: MAU_DO_SANG[s.doSang] }} className="ml-1 text-[12px]">
                    ({s.doSang})
                  </span>
                )}
              </span>
            ))
          ) : (
            <span
              className="text-[13px] font-normal italic"
              style={{ color: 'var(--fg-muted)' }}
            >
              Vô chính diệu
            </span>
          )}
        </div>
      )}

      {/* Tứ Hóa */}
      {settings.tuHoa && tuHoa.length > 0 && (
        <div className="mt-[6px] flex flex-wrap justify-center gap-1">
          {tuHoa.map((s) => (
            <TuHoaBadge key={s.ten} sao={s} />
          ))}
        </div>
      )}

      {/*
        PHỤ TINH — HAI CỘT ở mọi bề ngang: cát/trung tính trái, hung/sát phải.

        Bản trước tôi hạ xuống một cột ở màn hẹp và nói hai cột là "không thể".
        Kết luận ấy SAI, vì nó áp một chuẩn đọc mà chính lá số giấy không theo:
        ảnh mẫu chủ dự án gửi rộng 946px xem trên màn 390px, tức chữ phụ tinh
        hiệu dụng chỉ khoảng 5,3px — vẫn hai cột, và vẫn đọc được.

        Tính lại thì trần lý thuyết của cỡ chữ hai cột là 6,7px dù chọn bề
        ngang gốc nào. Ở gốc 480 với đệm 5px và khe 3px thì cột được 53px, đủ
        cho "Thiên Thương" (dài nhất) ở cỡ 8px gốc — hiển thị ra 6,0px, nhỉnh
        hơn bản giấy. Chính tinh vẫn giữ 11,4px vì chúng không nằm trong cột.

        Hai cột không chỉ để nhét vừa: cột trái là sao cát, cột phải là sao
        hung. Dồn một cột là mất luôn phép phân loại ấy, và người đọc phải dựa
        hoàn toàn vào màu.
      */}
      {nhomSao.length > 0 && (
        <div className={`mt-[6px] grid grid-cols-2 ${hep ? 'gap-x-[3px]' : 'gap-x-2'}`}>
          <div className="flex flex-col items-start">
            {cot1.map((s) => (
              <SaoText
                key={s.ten}
                sao={s}
                hep={hep}
                mo={s.loai === 'vong-sao'}
                hienDoSang={settings.doSang}
                trongYeu={PHU_TINH_TRONG_YEU.has(s.ten)}
              />
            ))}
          </div>
          <div className="flex flex-col items-end text-right">
            {cot2.map((s) => (
              <SaoText
                key={s.ten}
                sao={s}
                hep={hep}
                mo={s.loai === 'vong-sao'}
                hienDoSang={settings.doSang}
                trongYeu={PHU_TINH_TRONG_YEU.has(s.ten)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lưu tinh theo năm xem — phủ thêm, không thuộc lá số gốc */}
      {settings.luuTinh && luuTinh && luuTinh.length > 0 && (
        <div className="mt-[4px] flex flex-wrap gap-x-[6px]">
          {luuTinh.map((s) => (
            <span
              key={s.ten}
              data-sao="phu"
              className={`italic ${hep ? 'text-[8px]' : 'text-[12px]'}`}
              style={{
                color: s.tinhChat === 'hung' ? 'var(--chart-hung)' : 'var(--chart-tot)',
                lineHeight: hep ? 1.5 : 1.45,
              }}
            >
              {s.ten.replace('Lưu ', 'L.')}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Tiểu hạn — Tràng Sinh — Nguyệt hạn */}
      {/* `flex-wrap`: hai nhãn không đủ chỗ trên một dòng thì xuống dòng,
          chứ không cắt đôi chữ — xem ghi chú ở phần phụ tinh. */}
      <div
        className={`mt-auto flex flex-wrap items-baseline justify-between gap-x-1 whitespace-nowrap font-medium ${
          hep ? 'pt-[5px] text-[9px]' : 'pt-[8px] text-[11px]'
        }`}
        style={{ color: 'var(--fg-muted)' }}
      >
        <span style={{ color: laTieuHan ? 'var(--chart-tot)' : undefined }}>
          {settings.tieuHan && laTieuHan ? 'Tiểu hạn' : ''}
        </span>
        <span>{settings.trangSinh ? cung.trangSinh : ''}</span>
        <span className="tabular-nums">
          {settings.nguyetHan && nguyetHanThang ? `T.${nguyetHanThang}` : ''}
        </span>
      </div>
    </div>
  );
}
