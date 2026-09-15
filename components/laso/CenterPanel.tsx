'use client';

import { canChiCuaNam, type LaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[12px] font-normal" style={{ color: 'var(--fg-muted)' }}>
        {nhan}
      </span>
      <span
        className="text-right text-[13px] font-medium"
        style={{ color: 'var(--fg)' }}
      >
        {giaTri}
      </span>
    </div>
  );
}

function Nhom({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-[3px]">{children}</div>;
}

export function CenterPanel({
  laSo,
  namXem,
  tuoiAm,
}: {
  laSo: LaSo;
  namXem: number;
  tuoiAm: number;
}) {
  const t = laSo.thongTin;
  return (
    <div
      className="flex flex-col gap-[14px] overflow-auto p-[22px]"
      style={{
        gridRow: '2 / 4',
        gridColumn: '2 / 4',
        border: '1px solid var(--line)',
        background: 'var(--chart-cell)',
      }}
    >
      <div className="text-center">
        <div
          className="text-[20px] font-normal tracking-tight"
          style={{ color: 'var(--fg)', letterSpacing: '-0.04em' }}
        >
          {t.hoTen?.trim() || 'Lá số Tử Vi'}
        </div>
        <div className="mt-[2px] text-[12px]" style={{ color: 'var(--fg-muted)' }}>
          {t.gioiTinh === 'nam' ? 'Nam mệnh' : 'Nữ mệnh'} · {laSo.amDuong}
        </div>
      </div>

      <Nhom>
        <Dong
          nhan="Dương lịch"
          giaTri={`${t.ngay}/${t.thang}/${t.nam} — ${String(t.gio).padStart(2, '0')}:${String(
            t.phut ?? 0
          ).padStart(2, '0')}`}
        />
        <Dong
          nhan="Âm lịch"
          giaTri={`${t.amLich.ngay}/${t.amLich.thang}${
            t.amLich.nhuan ? ' (nhuận)' : ''
          } — ${t.canChiNam}`}
        />
        <Dong nhan="Giờ sinh" giaTri={`${t.chiGio} (${t.canChiGio})`} />
      </Nhom>

      <Nhom>
        <Dong nhan="Can chi năm" giaTri={t.canChiNam} />
        <Dong nhan="Can chi tháng" giaTri={t.canChiThang} />
        <Dong nhan="Can chi ngày" giaTri={t.canChiNgay} />
        <Dong nhan="Can chi giờ" giaTri={t.canChiGio} />
      </Nhom>

      <Nhom>
        <Dong nhan="Âm Dương" giaTri={`${laSo.amDuong} — ${laSo.amDuongThuanLy}`} />
        <Dong nhan="Bản Mệnh" giaTri={laSo.banMenh.ten} />
        <Dong nhan="Cục" giaTri={laSo.cuc.ten} />
        <Dong nhan="Mệnh — Cục" giaTri={laSo.menhCucQuanHe} />
      </Nhom>

      <Nhom>
        <Dong nhan="Mệnh an tại" giaTri={CHI[laSo.menhIndex]} />
        <Dong nhan="Thân cư" giaTri={`${laSo.thanCuCung} (${CHI[laSo.thanIndex]})`} />
        <Dong nhan="Mệnh chủ" giaTri={laSo.menhChu} />
        <Dong nhan="Thân chủ" giaTri={laSo.thanChu} />
      </Nhom>

      <Nhom>
        <Dong nhan="Năm xem" giaTri={`${namXem} — ${canChiCuaNam(namXem)}`} />
        <Dong nhan="Tuổi hạn" giaTri={`${tuoiAm}`} />
      </Nhom>
    </div>
  );
}
