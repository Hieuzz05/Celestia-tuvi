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
}: {
  sao: Sao;
  hienDoSang: boolean;
  trongYeu: boolean;
}) {
  const mau =
    sao.tinhChat === 'hung' ? 'var(--chart-hung)' : trongYeu ? 'var(--fg-body)' : 'var(--fg-muted)';
  return (
    <span
      className={trongYeu ? 'text-[13px] font-semibold' : 'text-[12px] font-normal'}
      style={{ color: mau, lineHeight: 1.45 }}
    >
      {sao.ten}
      {hienDoSang && sao.doSang && (
        <span style={{ color: MAU_DO_SANG[sao.doSang] }} className="ml-[3px] text-[10px]">
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

  const cot1 = phuTinh.filter((s) => s.tinhChat !== 'hung');
  const cot2 = phuTinh.filter((s) => s.tinhChat === 'hung');

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
      className="relative flex cursor-pointer flex-col p-[9px] transition-opacity duration-150"
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
        Header: Can.Chi — Tên cung [THÂN] — Đại hạn

        `flex-wrap` là bắt buộc, không phải cho đẹp. Ở bố cục hẹp của điện
        thoại ô chỉ rộng 117px, mà hàng này khi đủ cả ba phần cộng nhãn THÂN
        cần tới 137px — đo được trên ba ô. Không cho xuống dòng thì chữ tràn ra
        ngoài viền ô và đè lên ô bên cạnh.

        `min-w-0` trên các con: chữ trong flex mặc định không co dưới bề rộng
        nội dung, nên thiếu nó thì `flex-wrap` cũng không cứu được.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-1">
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
              style={{
                color: 'var(--chart-tot)',
                border: '1px solid var(--chart-tot)',
              }}
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
        Phụ tinh — 2 cột: cát/trung tính trái, hung/sát phải.

        Ở bố cục hẹp thì MỘT cột. Hai cột trong ô 102px là mỗi cột 47px, mà
        "Thiên Đức" đã 60px — đo được 48 chỗ tên bị cắt làm đôi. Một cột thì ô
        cao hơn và mệnh bàn dài ra, nhưng trang vốn cuộn dọc; còn một cái tên
        tách làm hai dòng thì không còn là cái tên.
      */}
      {settings.phuTinh && (
        <div className={`mt-[6px] grid gap-x-2 ${hep ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className="flex flex-col items-start">
            {cot1.map((s) => (
              <SaoText
                key={s.ten}
                sao={s}
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
                hienDoSang={settings.doSang}
                trongYeu={PHU_TINH_TRONG_YEU.has(s.ten)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vòng Thái Tuế / Lộc Tồn */}
      {settings.vongSao && vongSao.length > 0 && (
        <div className="mt-[4px] flex flex-wrap gap-x-[6px]">
          {vongSao.map((s) => (
            <span key={s.ten} className="text-[11px]" style={{ color: 'rgba(154,154,154,0.65)' }}>
              {s.ten}
            </span>
          ))}
        </div>
      )}

      {/* Lưu tinh theo năm xem — phủ thêm, không thuộc lá số gốc */}
      {settings.luuTinh && luuTinh && luuTinh.length > 0 && (
        <div className="mt-[4px] flex flex-wrap gap-x-[6px]">
          {luuTinh.map((s) => (
            <span
              key={s.ten}
              className="text-[11px] italic"
              style={{ color: s.tinhChat === 'hung' ? 'var(--chart-hung)' : 'var(--chart-tot)' }}
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
        className="mt-auto flex flex-wrap items-baseline justify-between gap-x-1 whitespace-nowrap pt-[8px] text-[11px] font-medium"
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
