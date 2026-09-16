'use client';

import { useEffect, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { NguonTriThuc } from '@/components/NguonTriThuc';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import type { NguonTriThuc as Nguon } from '@/lib/ai/goiLuanGiai';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import type { KetQuaSoSanh, MucDo } from '@/lib/tuvi/hoptuoi';
import { Shell } from '@/components/ui';

const MAU_MUC_DO: Record<MucDo, string> = {
  thuan: 'var(--chart-cat)',
  trung: 'var(--fg-muted)',
  nghich: 'var(--chart-hung)',
};

const NHAN_MUC_DO: Record<MucDo, string> = {
  thuan: 'Thuận',
  trung: 'Trung tính',
  nghich: 'Dễ va chạm',
};

interface KetQua {
  soSanh: KetQuaSoSanh;
  noiDung?: string;
  model?: string;
  nguonTriThuc?: Nguon[];
  loiAi?: string;
}

export default function HopTuoiPage() {
  const [a, setA] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '1995-05-20',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [b, setB] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '1997-08-14',
    gio: 15,
    gioiTinh: 'nu',
  });
  const [hoSos, setHoSos] = useState<HoSo[]>([]);
  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
  }, []);

  const chonHoSo = (h: HoSo, dat: (v: ThongTinForm) => void) =>
    dat({
      hoTen: h.hoTen,
      ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
      gio: h.gio,
      gioiTinh: h.gioiTinh,
    });

  const chay = async () => {
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    try {
      const dung = (f: ThongTinForm) => {
        const { ngay, thang, nam } = tachNgaySinh(f.ngaySinh);
        return { ngay, thang, nam, gio: f.gio, gioiTinh: f.gioiTinh, hoTen: f.hoTen };
      };
      const res = await fetch('/api/hop-tuoi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: dung(a), b: dung(b) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.loi ?? 'So sánh thất bại');
      setKetQua(data);
    } catch {
      setLoi('Celestia chưa so được lúc này — thử lại sau một chút.');
    } finally {
      setDangChay(false);
    }
  };

  return (
    <Shell className="flex flex-col gap-[24px] py-[20px]">
      <div>
        <p className="eyebrow">KẾT NỐI</p>
        <h1 className="heading mt-[10px]">Hai người kết nối với nhau thế nào?</h1>
        <p className="body-text mt-[16px] max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
          So sánh theo các tiêu chí truyền thống: bản mệnh, địa chi, cục, âm dương, cung Mệnh và
          cung Phu Thê. Công cụ này mô tả dữ kiện chứ không chấm điểm — tử vi không quy chuyện hợp
          tuổi về một con số, và quyết định là của bạn.
        </p>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-2">
        {[
          { nhan: 'Người thứ nhất', giaTri: a, dat: setA },
          { nhan: 'Người thứ hai', giaTri: b, dat: setB },
        ].map(({ nhan, giaTri, dat }) => (
          <div
            key={nhan}
            className="flex flex-col gap-[14px] rounded-[var(--radius-cards)] border p-[18px]"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            <h2 className="subheading">{nhan}</h2>
            {hoSos.length > 0 && (
              <select
                className="field-input"
                defaultValue=""
                onChange={(e) => {
                  const h = hoSos.find((x) => x.id === e.target.value);
                  if (h) chonHoSo(h, dat);
                }}
              >
                <option value="">— Chọn một người đã lưu —</option>
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || 'Không tên'} — {h.ngay}/{h.thang}/{h.nam}
                  </option>
                ))}
              </select>
            )}
            <FormSinh giaTri={giaTri} onChange={dat} />
          </div>
        ))}
      </section>

      <button onClick={chay} disabled={dangChay} className="btn-primary self-start">
        {dangChay ? 'Đang so sánh…' : 'So hai lá số'}
      </button>

      {loi && (
        <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
          {loi}
        </p>
      )}

      {ketQua && (
        <section className="flex flex-col gap-[24px]">
          {/* Bảng so sánh do engine tính — luôn có, không phụ thuộc AI */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="heading-sm">Bảng so sánh</h2>
            <div className="flex flex-col">
              {ketQua.soSanh.tieuChi.map((t) => (
                <div
                  key={t.ten}
                  className="grid gap-x-[16px] gap-y-[4px] py-[12px] md:grid-cols-[180px_1fr_1fr_170px]"
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                    {t.ten}
                  </span>
                  <span className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
                    <span style={{ color: 'var(--fg-muted)' }}>{ketQua.soSanh.tenA}: </span>
                    {t.giaTriA}
                  </span>
                  <span className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
                    <span style={{ color: 'var(--fg-muted)' }}>{ketQua.soSanh.tenB}: </span>
                    {t.giaTriB}
                  </span>
                  <span className="flex flex-col gap-[2px]">
                    <span className="text-[13px] font-medium" style={{ color: MAU_MUC_DO[t.mucDo] }}>
                      {t.ketQua}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
                      {NHAN_MUC_DO[t.mucDo]}
                    </span>
                  </span>
                  <span
                    className="text-[12px] md:col-span-4"
                    style={{ color: 'var(--fg-subtle)' }}
                  >
                    {t.giaiThich}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {ketQua.noiDung && (
            <div className="flex flex-col gap-[12px]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="heading-sm">Nhận định</h2>
                <span className="caption">
                  Celestia soạn từ hai lá số
                </span>
              </div>
              <MarkdownLuanGiai noiDung={ketQua.noiDung} />
              <NguonTriThuc nguon={ketQua.nguonTriThuc} />
            </div>
          )}

          {ketQua.loiAi && (
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              Bảng so sánh ở trên tính bằng engine nên vẫn đầy đủ, nhưng phần nhận định AI chưa chạy
              được: {ketQua.loiAi}
            </p>
          )}

          <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            Nội dung mang tính tham khảo. Không dùng kết quả này làm cơ sở quyết định chuyện hệ
            trọng của đời người.
          </p>
        </section>
      )}
    </Shell>
  );
}
