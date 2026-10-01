'use client';

import { useEffect, useState } from 'react';
import { useLaQuanTri } from './VietLaiQuanTri';
import type { CauV3 } from './CauTraLoiV3';
import type { ThongTinLaSoV3 } from './TongQuanV3';

/**
 * CHẤM BÀI (QUẢN TRỊ) — 01/10/2026, chủ dự án: admin đánh giá từng câu luận là hay / chưa hay,
 * cho điểm, nhận xét và gợi ý cách viết; gom một chỗ (/admin/nhan-xet) để định kỳ đọc lại và sửa
 * luật viết. Người dùng thường không thấy gì: hook trả null khi không phải quản trị viên, và route
 * kiểm lại quyền. Đóng sẵn để không xô bố cục khi admin chỉ đang đọc.
 */

export interface DaCham {
  id_cau: string;
  danh_gia: 'hay' | 'chua-hay' | null;
  diem: number | null;
  binh_luan: string | null;
  goi_y_viet: string | null;
}

export interface ChamBaiTongQuan {
  laSo: ThongTinLaSoV3;
  daCham: Record<string, DaCham>;
  daLuu: (d: DaCham) => void;
}

async function docDaCham(laSo: ThongTinLaSoV3): Promise<DaCham[]> {
  const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(laSo).map(([k, v]) => [k, String(v)])), nhom: 'tong-quan' });
  try {
    const r = await fetch(`/api/admin/danh-gia-bai?${q}`, { cache: 'no-store' });
    const d = r.ok ? await r.json() : null;
    return Array.isArray(d?.danhGia) ? d.danhGia : [];
  } catch {
    return [];
  }
}

/** Gọi MỘT lần ở trang; null = không phải quản trị viên (không render gì) */
export function useChamBaiTongQuan(laSo: ThongTinLaSoV3 | null): ChamBaiTongQuan | null {
  const laQuanTri = useLaQuanTri();
  const khoa = laSo ? `${laSo.ngay}-${laSo.thang}-${laSo.nam}-${laSo.gio}-${laSo.gioiTinh}|${laSo.namXem}` : null;
  const [ds, setDs] = useState<{ khoa: string; daCham: Record<string, DaCham> } | null>(null);
  useEffect(() => {
    if (!laQuanTri || !laSo || !khoa) return;
    let huy = false;
    docDaCham(laSo).then((rows) => {
      if (!huy) setDs({ khoa, daCham: Object.fromEntries(rows.map((r) => [r.id_cau, r])) });
    });
    return () => {
      huy = true;
    };
    // laSo đã nằm trọn trong khoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laQuanTri, khoa]);
  if (!laQuanTri || !laSo || !khoa) return null;
  const daCham = ds?.khoa === khoa ? ds.daCham : {};
  return { laSo, daCham, daLuu: (d) => setDs({ khoa, daCham: { ...daCham, [d.id_cau]: d } }) };
}

export function ChamBaiAdmin({ cau, cham }: { cau: CauV3; cham: ChamBaiTongQuan | null }) {
  const cu = cham?.daCham[cau.id];
  const [mo, setMo] = useState(false);
  const [danhGia, setDanhGia] = useState<DaCham['danh_gia']>(cu?.danh_gia ?? null);
  const [diem, setDiem] = useState<number | null>(cu?.diem ?? null);
  const [binhLuan, setBinhLuan] = useState(cu?.binh_luan ?? '');
  const [goiYViet, setGoiYViet] = useState(cu?.goi_y_viet ?? '');
  const [trangThai, setTrangThai] = useState<{ dang?: boolean; loi?: string; xong?: string }>({});
  if (!cham || cau.chuaViet || !cau.luanGiai) return null;

  const moRa = () => {
    // Lượt chấm cũ về sau khi thẻ đã dựng — nạp lại lúc mở để không ghi đè bằng ô trống
    setDanhGia(cu?.danh_gia ?? null);
    setDiem(cu?.diem ?? null);
    setBinhLuan(cu?.binh_luan ?? '');
    setGoiYViet(cu?.goi_y_viet ?? '');
    setTrangThai({});
    setMo(true);
  };

  const luu = async () => {
    setTrangThai({ dang: true });
    try {
      const r = await fetch('/api/admin/danh-gia-bai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laSo: { ...cham.laSo, nhom: 'tong-quan' },
          idCau: cau.id,
          cauHoi: cau.cauHoi,
          luanGiai: cau.luanGiai,
          viSao: cau.viSao,
          goiY: cau.goiY,
          danhGia,
          diem,
          binhLuan,
          goiYViet,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setTrangThai({ loi: `${d.loi ?? 'Chưa lưu được.'} Nhận xét vừa gõ vẫn còn ở đây, bấm Lưu để thử lại.` });
      cham.daLuu({ id_cau: cau.id, danh_gia: danhGia, diem, binh_luan: binhLuan || null, goi_y_viet: goiYViet || null });
      setTrangThai({ xong: d.khopDem ? 'Đã lưu.' : 'Đã lưu. Lưu ý: bài đang hiện không khớp bài đã lưu trong hệ thống (có thể là bản cũ).' });
    } catch {
      setTrangThai({ loi: 'Chưa kết nối được máy chủ. Nhận xét vẫn còn ở đây, thử lưu lại sau ít phút.' });
    }
  };

  const nhanCu = cu ? `${cu.danh_gia === 'hay' ? 'Hay' : cu.danh_gia === 'chua-hay' ? 'Chưa hay' : ''}${cu.diem ? ` · ${cu.diem}/5` : ''}` : '';

  if (!mo) {
    return (
      <button type="button" className="btn-outline btn-sm min-h-[44px] self-start" style={{ borderStyle: 'dashed' }} onClick={moRa}>
        {nhanCu ? `Chấm bài này (quản trị) · ${nhanCu}` : 'Chấm bài này (quản trị)'}
      </button>
    );
  }

  const chon = (bat: boolean) => (bat ? { borderColor: 'var(--fg)', color: 'var(--fg)', fontWeight: 600 } : undefined);
  return (
    <div className="flex flex-col gap-[12px] rounded-[12px] border p-[12px]" style={{ borderColor: 'var(--line)', borderStyle: 'dashed' }}>
      <span className="eyebrow">Chấm bài · {cau.id} · {cau.cauHoi}</span>
      <div className="flex flex-wrap gap-[8px]" role="group" aria-label="Đánh giá">
        {(['hay', 'chua-hay'] as const).map((g) => (
          <button key={g} type="button" className="btn-outline btn-sm min-h-[44px]" aria-pressed={danhGia === g} style={chon(danhGia === g)} onClick={() => setDanhGia(danhGia === g ? null : g)}>
            {g === 'hay' ? 'Hay' : 'Chưa hay'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-[8px]" role="group" aria-label="Điểm 1 đến 5">
        <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>Điểm</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="btn-outline btn-sm min-h-[44px] min-w-[44px]" aria-pressed={diem === n} style={chon(diem === n)} onClick={() => setDiem(diem === n ? null : n)}>
            {n}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>Nhận xét</span>
        <textarea className="field-input min-h-[72px]" value={binhLuan} maxLength={4000} onChange={(e) => setBinhLuan(e.target.value)} placeholder="Câu nào dài dòng, lặp ý, khó hiểu hoặc sai?" />
      </label>
      <label className="flex flex-col gap-[4px]">
        <span className="body-sm" style={{ color: 'var(--fg-muted)' }}>Gợi ý cách viết</span>
        <textarea className="field-input min-h-[72px]" value={goiYViet} maxLength={4000} onChange={(e) => setGoiYViet(e.target.value)} placeholder="Nên viết thế nào cho hay hơn — có thể chép lại câu đã sửa" />
      </label>
      {trangThai.loi && <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>{trangThai.loi}</p>}
      {trangThai.xong && <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>{trangThai.xong}</p>}
      <div className="flex flex-wrap gap-[8px]">
        <button type="button" className="btn-outline btn-sm min-h-[44px]" style={{ fontWeight: 600 }} disabled={trangThai.dang} onClick={luu}>
          {trangThai.dang ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button type="button" className="btn-outline btn-sm min-h-[44px]" onClick={() => setMo(false)}>
          Đóng
        </button>
      </div>
    </div>
  );
}
