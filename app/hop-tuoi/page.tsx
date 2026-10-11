'use client';

import { useEffect, useState } from 'react';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { ChonYDinh } from '@/components/ketnoi/ChonYDinh';
import { KetQuaKetNoi, type DuLieuKetNoi } from '@/components/ketnoi/KetQuaKetNoi';
import { danhSachHoSo, type HoSo } from '@/lib/store/hoso';
import { CAU_HINH_Y_DINH, Y_DINH_MAC_DINH, type YDinhKetNoi } from '@/lib/ket-noi/y-dinh';
import type { KetQuaSoSanh, MucDo } from '@/lib/tuvi/hoptuoi';
import { Shell } from '@/components/ui';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { CelesMascot } from '@/components/CelesMascot';
import { CongUngHo } from '@/components/support/CongUngHo';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { ghiSuKien } from '@/lib/analytics';
import { useT } from '@/lib/i18n/context';

const MAU_MUC_DO: Record<MucDo, string> = {
  thuan: 'var(--chart-cat)',
  trung: 'var(--fg-muted)',
  nghich: 'var(--chart-hung)',
};


interface KetQua {
  soSanh: KetQuaSoSanh;
  ketNoi?: DuLieuKetNoi;
  model?: string;
  loiAi?: string;
}

export default function KetNoiPage() {
  const t = useT();
  const nhanMucDo: Record<MucDo, string> = {
    thuan: t.hopTuoi.mucThuan,
    trung: t.hopTuoi.mucTrung,
    nghich: t.hopTuoi.mucNghich,
  };
  const yd = (bang: object) => (bang as Record<string, string>)[yDinh];
  const { duocVao, dangDoc } = useTaiKhoan();
  const [moCongUngHo, setMoCongUngHo] = useState(false);
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
  const [yDinh, setYDinh] = useState<YDinhKetNoi>(Y_DINH_MAC_DINH);
  const [cauHoi, setCauHoi] = useState('');
  const [hoSos, setHoSos] = useState<HoSo[]>([]);
  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    danhSachHoSo()
      .then(setHoSos)
      .catch(() => setHoSos([]));
  }, []);

  const cauHinh = CAU_HINH_Y_DINH[yDinh];
  // "Một điều khác" thì câu hỏi là nguồn duy nhất cho biết phải nhìn vào đâu,
  // nên nó thành bắt buộc — thiếu nó thì chẳng còn gì để lập kế hoạch.
  const thieuCauHoi = yDinh === 'khac' && cauHoi.trim().length < 10;

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
    ghiSuKien('connection_compare_started', { yDinh, coCauHoi: Boolean(cauHoi.trim()) });
    try {
      const dung = (f: ThongTinForm) => {
        const { ngay, thang, nam } = tachNgaySinh(f.ngaySinh);
        return { ngay, thang, nam, gio: f.gio, gioiTinh: f.gioiTinh, hoTen: f.hoTen };
      };
      const res = await fetch('/api/hop-tuoi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          a: dung(a),
          b: dung(b),
          comparison: { intent: yDinh, question: cauHoi.trim() || undefined },
        }),
      });
      const data = await res.json();

      // 402 là hàng rào thật của máy chủ cho khả năng trả phí — mở cổng ủng hộ
      // chứ không hiện lỗi, vì đây không phải hỏng hóc mà là một lời mời.
      if (res.status === 402) {
        setMoCongUngHo(true);
        return;
      }

      if (!res.ok) throw new Error(data.loi ?? 'So sánh thất bại');
      setKetQua(data);
      ghiSuKien('connection_compare_completed', { yDinh, coAi: Boolean(data.ketNoi) });
    } catch {
      setLoi(t.hopTuoi.loiSo);
      ghiSuKien('connection_compare_failed', { yDinh });
    } finally {
      setDangChay(false);
    }
  };

  // Chưa đăng nhập thì KHÔNG dựng phần nội dung sâu — spec v2 yêu cầu chặn
  // ở tầng đường dẫn, và server cũng chặn lại ở API tương ứng.
  if (dangDoc) return <Shell className="py-[48px]"><span /></Shell>;
  if (!duocVao)
    return (
      <Shell className="py-[48px]">
        <div className="mx-auto max-w-[620px]">
          <CongDangNhap nguon="connection" toanTrang />
        </div>
      </Shell>
    );

  const bangKyThuat = ketQua ? (
    <div className="flex flex-col">
      {ketQua.soSanh.tieuChi.map((tc) => (
        <div
          key={tc.ten}
          className="grid gap-x-[16px] gap-y-[4px] py-[12px] md:grid-cols-[180px_1fr_1fr_170px]"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
            {tc.ten}
          </span>
          <span className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>{ketQua.soSanh.tenA}: </span>
            {tc.giaTriA}
          </span>
          <span className="text-[13px]" style={{ color: 'var(--fg-body)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>{ketQua.soSanh.tenB}: </span>
            {tc.giaTriB}
          </span>
          <span className="flex flex-col gap-[4px]">
            <span className="text-[13px] font-medium" style={{ color: MAU_MUC_DO[tc.mucDo] }}>
              {tc.ketQua}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
              {nhanMucDo[tc.mucDo]}
            </span>
          </span>
          <span className="text-[12px] md:col-span-4" style={{ color: 'var(--fg-subtle)' }}>
            {tc.giaiThich}
          </span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <Shell className="flex flex-col gap-[24px] py-[20px]">
      <div className="flex items-start gap-[16px]">
        {/* Tò mò TRƯỚC khi gửi hai lá số. Đang tính hoặc đã có kết quả thì ẩn
            bằng visibility (giữ chỗ, không nhảy layout) — kết quả hợp tuổi là
            vùng đọc, và lúc chờ đã có Celes đang nghĩ bên dưới. */}
        <CelesMascot
          cho="rong"
          minhHoa="curious"
          cao={80}
          caoNho={56}
          ngay
          className={dangChay || ketQua ? 'invisible' : ''}
        />
        <div className="min-w-0">
          <p className="eyebrow">{t.hopTuoi.eyebrow}</p>
          <h1 className="heading mt-[10px]">{t.hopTuoi.tieuDe}</h1>
          <p className="body-text mt-[16px] max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
            {t.hopTuoi.moTa}
          </p>
        </div>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-2">
        {[
          { nhan: t.hopTuoi.nguoi1, giaTri: a, dat: setA },
          { nhan: t.hopTuoi.nguoi2, giaTri: b, dat: setB },
        ].map(({ nhan, giaTri, dat }) => (
          <div
            key={nhan}
            className="flex flex-col gap-[12px] rounded-[var(--radius-cards)] border p-[18px]"
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
                <option value="">{t.hopTuoi.chonDaLuu}</option>
                {hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || t.hopTuoi.khongTen} — {h.ngay}/{h.thang}/{h.nam}
                  </option>
                ))}
              </select>
            )}
            <FormSinh giaTri={giaTri} onChange={dat} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-[12px]">
        <h2 className="subheading">{t.hopTuoi.hieuGi}</h2>
        <ChonYDinh
          giaTri={yDinh}
          onChon={(y) => {
            setYDinh(y);
            ghiSuKien('connection_intent_selected', { yDinh: y });
          }}
        />
      </section>

      <section className="flex flex-col gap-[8px]">
        <label className="subheading" htmlFor="cau-hoi-ket-noi">
          {t.hopTuoi.cuThe}
        </label>
        <textarea
          id="cau-hoi-ket-noi"
          value={cauHoi}
          onChange={(e) => setCauHoi(e.target.value.slice(0, 500))}
          rows={3}
          className="field-input"
          placeholder={yd(t.yDinhGoiY) ?? cauHinh.goiYCauHoi}
        />
        <p className="caption" style={{ color: 'var(--fg-muted)' }}>
          {yDinh === 'khac'
            ? t.hopTuoi.batBuoc
            : t.hopTuoi.khongBatBuoc}
        </p>
      </section>

      <div className="flex items-center gap-[16px]">
        <button onClick={chay} disabled={dangChay || thieuCauHoi} className="btn-primary self-start">
          {dangChay ? t.hopTuoi.dangNhin : (yd(t.yDinhNut) ?? cauHinh.nutBam)}
        </button>
        {dangChay && <CelesMascot cho="cho" trangThai="thinking" cao={80} caoNho={56} />}
      </div>

      {loi && (
        <p className="body-text" style={{ color: 'var(--chart-hung)' }}>
          {loi}
        </p>
      )}

      {ketQua?.ketNoi && bangKyThuat && (
        <KetQuaKetNoi
          duLieu={ketQua.ketNoi}
          tenA={ketQua.soSanh.tenA}
          tenB={ketQua.soSanh.tenB}
          bangKyThuat={bangKyThuat}
        />
      )}

      {/* Model hỏng nhưng engine chạy: vẫn phải trả được phần dữ kiện. */}
      {ketQua && !ketQua.ketNoi && bangKyThuat && (
        <section className="flex flex-col gap-[12px]">
          <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
            {t.hopTuoi.chuaXong}
          </p>
          <button onClick={chay} className="link-text self-start">
            {t.hopTuoi.thuLai}
          </button>
          <div>{bangKyThuat}</div>
        </section>
      )}

      {moCongUngHo && (
        <CongUngHo
          lyDo="connection_full"
          onDong={() => setMoCongUngHo(false)}
          quayLai={{ path: '/hop-tuoi' }}
        />
      )}
    </Shell>
  );
}
