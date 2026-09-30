'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eyebrow, O, Shell, The } from '@/components/ui';

/**
 * Cấu hình luận giải — các con số độ dài của bài luận v3 (lib/rag/v3/cau-hinh.ts).
 *
 * Chủ dự án chỉnh số tại đây, không cần deploy. Máy chủ đọc lại cấu hình sau tối đa 60 giây.
 * Đổi số không làm bài đã lưu viết lại: mở một lá số, bấm "Viết lại (quản trị)" để thử.
 */

type Khoang = [number, number];
interface DoDaiLoai { luan: Khoang; muc: Khoang; viSao: Khoang; doan: Khoang }
interface CauHinh { doDai: Record<'tong-quan' | 'chuyen-sau', DoDaiLoai>; tranGoiY: number }
interface Ban { cauHinh: CauHinh; nhan: string; luc: string; boi?: string }
interface DuLieu { hienTai: Ban | null; lichSu: Ban[]; macDinh: CauHinh }

const LOAI: { id: 'tong-quan' | 'chuyen-sau'; ten: string }[] = [
  { id: 'tong-quan', ten: 'Tổng quan (11 câu ở trang lá số)' },
  { id: 'chuyen-sau', ten: 'Chuyên sâu (từng chủ đề)' },
];
const TRUONG: { id: keyof DoDaiLoai; ten: string; giaiThich: string }[] = [
  { id: 'muc', ten: 'Nên viết (từ)', giaiThich: 'Khoảng nói với Celes trong lời nhắc. Phải nằm trong sàn–trần.' },
  { id: 'luan', ten: 'Sàn – trần (từ)', giaiThich: 'Lệch quá 15% ngoài khoảng này là bắt viết lại.' },
  { id: 'viSao', ten: '"Vì sao" (từ)', giaiThich: 'Đoạn giải thích căn cứ dưới mỗi câu.' },
  { id: 'doan', ten: 'Số đoạn', giaiThich: 'Ngoài khoảng này là bắt viết lại.' },
];

async function docCauHinh(): Promise<DuLieu | { loi: string }> {
  try {
    const res = await fetch('/api/admin/cau-hinh-luan-giai', { cache: 'no-store' });
    const d = await res.json();
    return res.ok ? (d as DuLieu) : { loi: d.loi ?? 'Không đọc được cấu hình' };
  } catch {
    return { loi: 'Không kết nối được máy chủ' };
  }
}

const giongNhau = (a: Khoang, b: Khoang) => a[0] === b[0] && a[1] === b[1];
const luc = (s: string) => new Date(s).toLocaleString('vi-VN');

export default function TrangCauHinhLuanGiai() {
  const [du, setDu] = useState<DuLieu | null>(null);
  const [nhap, setNhap] = useState<CauHinh | null>(null);
  const [nhan, setNhan] = useState('');
  const [thongBao, setThongBao] = useState<{ loai: 'ok' | 'loi'; noiDung: string } | null>(null);
  const [dang, setDang] = useState(false);

  const nhanDuLieu = (kq: DuLieu | { loi: string }) => {
    if ('loi' in kq) return setThongBao({ loai: 'loi', noiDung: kq.loi });
    setDu(kq);
    setNhap(structuredClone(kq.hienTai?.cauHinh ?? kq.macDinh));
  };
  useEffect(() => {
    docCauHinh().then(nhanDuLieu);
  }, []);

  const gui = async (body: Record<string, unknown>, xong: string) => {
    setDang(true);
    setThongBao(null);
    try {
      const res = await fetch('/api/admin/cau-hinh-luan-giai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.loi ?? 'Không lưu được');
      nhanDuLieu(d as DuLieu);
      setNhan('');
      setThongBao({ loai: 'ok', noiDung: `${xong} Máy chủ áp dụng sau tối đa 60 giây.` });
    } catch (e) {
      setThongBao({ loai: 'loi', noiDung: e instanceof Error ? e.message : 'Không lưu được' });
    } finally {
      setDang(false);
    }
  };

  const doiSo = (loai: 'tong-quan' | 'chuyen-sau', truong: keyof DoDaiLoai, viTri: 0 | 1, v: string) =>
    setNhap((cu) => {
      if (!cu) return cu;
      const moi = structuredClone(cu);
      moi.doDai[loai][truong][viTri] = Number(v) || 0;
      return moi;
    });

  const dangChay = du ? du.hienTai?.cauHinh ?? du.macDinh : null;
  const coThayDoi = Boolean(nhap && dangChay && JSON.stringify(nhap) !== JSON.stringify(dangChay));

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · LUẬN GIẢI</Eyebrow>
        <h1 className="heading-sm">Cấu hình luận giải</h1>
        <div className="mt-[10px] flex flex-wrap gap-[16px]">
          <Link href="/admin" className="link-text">← Trang quản trị</Link>
        </div>
        <p className="body-sm mt-[12px] max-w-[680px]" style={{ color: 'var(--fg-muted)' }}>
          Độ dài bài luận của Celes. Số in nghiêng xám là mặc định trong mã; ô tô màu là chỗ đang khác mặc định.
          Đổi số không làm bài đã lưu tự viết lại. Để thử: mở một lá số, bấm <b>Viết lại (quản trị)</b> ở cuối phần muốn xem.
        </p>
      </div>

      {thongBao && (
        <p className="body-sm" style={{ color: thongBao.loai === 'ok' ? 'var(--chart-cat)' : 'var(--chart-hung)' }}>
          {thongBao.noiDung}
        </p>
      )}

      {du && nhap && (
        <>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Đang chạy: {du.hienTai ? `“${du.hienTai.nhan}” — ${luc(du.hienTai.luc)}${du.hienTai.boi ? ` · ${du.hienTai.boi}` : ''}` : 'mặc định trong mã (chưa sửa lần nào)'}
          </p>

          {LOAI.map((l) => (
            <The key={l.id} className="flex flex-col gap-[16px]">
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>{l.ten}</h2>
              {TRUONG.map((t) => {
                const md = du.macDinh.doDai[l.id][t.id];
                const khac = !giongNhau(nhap.doDai[l.id][t.id], md);
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-[12px]">
                    <div className="min-w-[180px] flex-1">
                      <p className="text-[15px]" style={{ color: 'var(--fg)' }}>{t.ten}</p>
                      <p className="caption">{t.giaiThich}</p>
                    </div>
                    {([0, 1] as const).map((i) => (
                      <O
                        key={i}
                        type="number"
                        inputMode="numeric"
                        aria-label={`${l.ten} — ${t.ten} — ${i === 0 ? 'từ' : 'đến'}`}
                        className="w-[88px]"
                        style={khac ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)' } : undefined}
                        value={nhap.doDai[l.id][t.id][i]}
                        onChange={(e) => doiSo(l.id, t.id, i, e.target.value)}
                      />
                    ))}
                    <span className="caption italic">mặc định {md[0]}–{md[1]}</span>
                  </div>
                );
              })}
            </The>
          ))}

          <The className="flex flex-wrap items-center gap-[12px]">
            <div className="min-w-[180px] flex-1">
              <p className="text-[15px]" style={{ color: 'var(--fg)' }}>Trần phần gợi ý (từ)</p>
              <p className="caption">Quá trần là nhắc rút gọn; quá 1,5 lần là bắt viết lại.</p>
            </div>
            <O
              type="number"
              inputMode="numeric"
              aria-label="Trần phần gợi ý"
              className="w-[88px]"
              value={nhap.tranGoiY}
              onChange={(e) => setNhap((cu) => (cu ? { ...cu, tranGoiY: Number(e.target.value) || 0 } : cu))}
            />
            <span className="caption italic">mặc định {du.macDinh.tranGoiY}</span>
          </The>

          <div className="flex flex-wrap items-end gap-[12px]">
            <label className="flex min-w-[240px] flex-1 flex-col gap-[8px]">
              <span className="caption">Nhãn cho lần sửa này (để nhận ra khi khôi phục)</span>
              <O value={nhan} maxLength={120} placeholder="vd. Nới chuyên sâu lên 260 từ" onChange={(e) => setNhan(e.target.value)} />
            </label>
            <button type="button" className="btn-primary" disabled={dang || !coThayDoi} onClick={() => gui({ cauHinh: nhap, nhan }, 'Đã lưu.')}>
              Lưu
            </button>
            <button type="button" className="btn-outline" disabled={dang || !coThayDoi} onClick={() => dangChay && setNhap(structuredClone(dangChay))}>
              Bỏ thay đổi
            </button>
            <button type="button" className="btn-outline" disabled={dang || !du.hienTai} onClick={() => gui({ veMacDinh: true }, 'Đã về mặc định.')}>
              Về mặc định
            </button>
          </div>
          <p className="caption">Số không hợp lệ (vd. “nên viết” vượt trần) được máy chủ tự đưa về khoảng hợp lệ khi lưu.</p>

          {du.lichSu.length > 0 && (
            <section className="flex flex-col gap-[8px]">
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>Các bản trước</h2>
              {du.lichSu.map((b, i) => (
                <div key={`${b.luc}-${i}`} className="flex flex-wrap items-center justify-between gap-[12px] border-t py-[8px]" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <p className="text-[15px]" style={{ color: 'var(--fg)' }}>{b.nhan}</p>
                    <p className="caption">
                      {luc(b.luc)}{b.boi ? ` · ${b.boi}` : ''} · tổng quan {b.cauHinh.doDai['tong-quan'].muc.join('–')} · chuyên sâu {b.cauHinh.doDai['chuyen-sau'].muc.join('–')} (trần {b.cauHinh.doDai['chuyen-sau'].luan[1]})
                    </p>
                  </div>
                  <button type="button" className="btn-outline btn-sm" disabled={dang} onClick={() => gui({ khoiPhuc: i }, 'Đã khôi phục.')}>
                    Khôi phục
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </Shell>
  );
}
