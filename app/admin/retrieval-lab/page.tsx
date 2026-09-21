'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Field } from '@/components/FormSinh';
import { Eyebrow, Shell, The } from '@/components/ui';

/**
 * Retrieval Lab — màn để biết RAG có thật sự chạy hay không.
 *
 * Bảng kết quả cố ý hiện điểm vector và điểm từ khoá ở hai cột riêng, không gộp.
 * Chúng là hai thang đo khác nhau; gộp lại thành một con số là đúng thứ khiến
 * không ai còn gỡ được lỗi. Cột RRF là điểm thật sự quyết định thứ hạng.
 */

interface Dong {
  chunkId: string;
  tieuDe: string;
  phienBanTaiLieu: string;
  deMuc: string | null;
  hePhai: string;
  mucTinCay: string;
  hangVector: number | null;
  diemVector: number | null;
  hangTuKhoa: number | null;
  diemTuKhoa: number | null;
  diemRRF: number;
  duocChon: boolean;
  trich: string;
}

interface KetQua {
  runId: string | null;
  keHoach: {
    chuDe: string;
    chacChan: boolean;
    cungLienQuan: string[];
    lopHan: string[];
    thucThe: { id: string; ten: string; loai: string }[];
    truyVan: string;
    phienBan: string;
  };
  khoTrong: boolean;
  doTreMs: number;
  cauHinh: Record<string, unknown>;
  phienBan: string;
  ketQua: Dong[];
}

const VI_DU = [
  'Năm nay tôi có nên đổi việc không?',
  'Hóa Kỵ tại Quan Lộc năm nay nên đọc thế nào?',
  'Chuyện tình cảm của tôi sắp tới ra sao?',
  'Sức khỏe tôi có gì đáng lưu ý trong tháng này?',
];

export default function TrangRetrievalLab() {
  const [cauHoi, setCauHoi] = useState('');
  const [hePhai, setHePhai] = useState('tat-ca');
  const [soVector, setSoVector] = useState(15);
  const [soTuKhoa, setSoTuKhoa] = useState(15);
  const [soCuoi, setSoCuoi] = useState(6);
  const [nguong, setNguong] = useState(0);
  const [locThucThe, setLocThucThe] = useState(false);
  const [dangChay, setDangChay] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  async function chay() {
    setDangChay(true);
    setLoi(null);
    try {
      const res = await fetch('/api/admin/retrieval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cauHoi,
          hePhai,
          cauHinh: {
            soUngVienVector: soVector,
            soUngVienTuKhoa: soTuKhoa,
            soCuoi,
            nguongVector: nguong,
            locThucThe,
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLoi(d.loi ?? 'Không chạy được');
        setKq(null);
        return;
      }
      setKq(d);
    } catch {
      setLoi('Không kết nối được máy chủ');
    } finally {
      setDangChay(false);
    }
  }

  const so = (n: number | null, chuSo = 3) => (n === null ? '—' : n.toFixed(chuSo));

  return (
    <Shell className="flex flex-col gap-[24px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · AI &amp; TRI THỨC</Eyebrow>
        <h1 className="heading-sm">Retrieval Lab</h1>
        <div className="mt-[10px] flex flex-wrap gap-[16px]">
          <Link href="/admin" className="link-text">← Trang quản trị</Link>
          <Link href="/admin/knowledge" className="link-text">Kho tri thức →</Link>
        </div>
        <p className="body-sm mt-[12px]" style={{ color: 'var(--fg-muted)' }}>
          Chạy đúng bộ lập kế hoạch và truy hồi mà Celes dùng, nhưng không gọi model. Dùng để tách
          xem lỗi nằm ở chỗ chọn cung, chỗ lấy đoạn, hay ở chỗ model diễn giải.
        </p>
      </div>

      <The className="flex flex-col gap-[12px]">
        <Field label="Câu hỏi">
          <input
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cauHoi.trim()) void chay();
            }}
            className="field-input"
            placeholder="Năm nay tôi có nên đổi việc không?"
          />
        </Field>

        <div className="flex flex-wrap gap-[8px]">
          {VI_DU.map((v) => (
            <button
              key={v}
              onClick={() => setCauHoi(v)}
              className="caption rounded-full border px-[12px] py-[6px]"
              style={{ borderColor: 'var(--line)', color: 'var(--fg-muted)' }}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="grid gap-[12px] md:grid-cols-3 lg:grid-cols-5">
          <Field label="Hệ phái">
            <select value={hePhai} onChange={(e) => setHePhai(e.target.value)} className="field-input">
              <option value="tat-ca">Tất cả</option>
              <option value="nam-phai">Nam phái</option>
              <option value="bac-phai">Bắc phái</option>
              <option value="chung">Dùng chung</option>
            </select>
          </Field>
          <Field label="Top K vector">
            <input
              type="number"
              min={1}
              max={50}
              value={soVector}
              onChange={(e) => setSoVector(Number(e.target.value))}
              className="field-input"
            />
          </Field>
          <Field label="Top K từ khoá">
            <input
              type="number"
              min={0}
              max={50}
              value={soTuKhoa}
              onChange={(e) => setSoTuKhoa(Number(e.target.value))}
              className="field-input"
            />
          </Field>
          <Field label="Số đoạn cuối">
            <input
              type="number"
              min={1}
              max={20}
              value={soCuoi}
              onChange={(e) => setSoCuoi(Number(e.target.value))}
              className="field-input"
            />
          </Field>
          <Field label="Ngưỡng cosine">
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={nguong}
              onChange={(e) => setNguong(Number(e.target.value))}
              className="field-input"
            />
          </Field>
        </div>

        <label className="body-sm flex items-center gap-[8px]" style={{ color: 'var(--fg-muted)' }}>
          <input
            type="checkbox"
            checked={locThucThe}
            onChange={(e) => setLocThucThe(e.target.checked)}
          />
          Chỉ lấy đoạn có gắn thực thể mà câu hỏi nhắc tới
        </label>

        <button onClick={chay} disabled={!cauHoi.trim() || dangChay} className="btn-primary self-start">
          {dangChay ? 'Đang chạy…' : 'Chạy truy hồi'}
        </button>

        {loi && (
          <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
            {loi}
          </p>
        )}
      </The>

      {kq && (
        <>
          <The className="flex flex-col gap-[12px]">
            <Eyebrow>Bộ lập kế hoạch · v{kq.keHoach.phienBan}</Eyebrow>
            <Hang nhan="Chủ đề" gt={`${kq.keHoach.chuDe}${kq.keHoach.chacChan ? '' : ' (đoán mặc định, câu hỏi không có tín hiệu rõ)'}`} />
            <Hang nhan="Cung liên quan" gt={kq.keHoach.cungLienQuan.join(', ')} />
            <Hang nhan="Lớp hạn" gt={kq.keHoach.lopHan.join(', ')} />
            <Hang
              nhan="Thực thể nhận ra"
              gt={
                kq.keHoach.thucThe.length
                  ? kq.keHoach.thucThe.map((t) => `${t.ten} (${t.id})`).join(', ')
                  : 'không có'
              }
            />
            <div className="flex flex-col gap-[4px]">
              <Eyebrow>Truy vấn đã viết lại</Eyebrow>
              <p className="body-sm" style={{ color: 'var(--fg)' }}>
                {kq.keHoach.truyVan}
              </p>
            </div>
          </The>

          <section className="flex flex-col gap-[12px]">
            <div className="flex flex-wrap items-baseline justify-between gap-[12px]">
              <Eyebrow>
                Kết quả · {kq.ketQua.length} ứng viên · {kq.doTreMs}ms · truy hồi v{kq.phienBan}
              </Eyebrow>
            </div>

            {kq.khoTrong ? (
              <p className="body-sm" style={{ color: 'var(--chart-trung)' }}>
                Chưa có nguồn nào được xuất bản, hoặc chưa cấu hình kho. Truy hồi không trả về gì —
                Celes sẽ chỉ nói được những gì lá số cho thấy.
              </p>
            ) : kq.ketQua.length === 0 ? (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                Kho có nguồn nhưng không đoạn nào khớp. Thử hạ ngưỡng cosine hoặc bỏ lọc hệ phái.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr>
                      {['Chọn', 'Nguồn', 'Hạng vector', 'Điểm vector', 'Hạng từ khoá', 'Điểm từ khoá', 'RRF', 'Trích'].map(
                        (h) => (
                          <th
                            key={h}
                            className="caption pb-[8px] font-normal"
                            style={{ borderBottom: '1px solid var(--line)' }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {kq.ketQua.map((d) => (
                      <tr key={d.chunkId}>
                        <td
                          className="body-sm py-[9px]"
                          style={{
                            borderBottom: '1px solid var(--line)',
                            color: d.duocChon ? 'var(--chart-cat)' : 'var(--fg-muted)',
                          }}
                        >
                          {d.duocChon ? '✓' : '—'}
                        </td>
                        <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--fg)' }}>{d.tieuDe}</span> v{d.phienBanTaiLieu}
                          <br />
                          <span className="caption">
                            {d.deMuc ?? 'không có đề mục'} · {d.hePhai} · {d.mucTinCay}
                          </span>
                        </td>
                        <td className="body-sm py-[9px] tabular-nums" style={{ borderBottom: '1px solid var(--line)' }}>
                          {d.hangVector ?? '—'}
                        </td>
                        <td className="body-sm py-[9px] tabular-nums" style={{ borderBottom: '1px solid var(--line)' }}>
                          {so(d.diemVector)}
                        </td>
                        <td className="body-sm py-[9px] tabular-nums" style={{ borderBottom: '1px solid var(--line)' }}>
                          {d.hangTuKhoa ?? '—'}
                        </td>
                        <td className="body-sm py-[9px] tabular-nums" style={{ borderBottom: '1px solid var(--line)' }}>
                          {so(d.diemTuKhoa, 4)}
                        </td>
                        <td
                          className="body-sm py-[9px] tabular-nums"
                          style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}
                        >
                          {so(d.diemRRF, 5)}
                        </td>
                        <td
                          className="caption py-[9px]"
                          style={{ borderBottom: '1px solid var(--line)', maxWidth: 360 }}
                        >
                          {d.trich}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}

function Hang({ nhan, gt }: { nhan: string; gt: string }) {
  return (
    <div className="flex flex-wrap gap-[12px] body-sm">
      <span style={{ color: 'var(--fg-muted)', minWidth: 140 }}>{nhan}</span>
      <span style={{ color: 'var(--fg)' }}>{gt}</span>
    </div>
  );
}
