'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { Eyebrow, NhanPill, Section, Shell, The } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { useBoiCanh } from '@/lib/store/boi-canh';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CongUngHo } from '@/components/support/CongUngHo';
import type { CapLuanHan, LuanHan } from '@/lib/tuvi/luan-han';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';

/**
 * "Xem chi tiết" của Hành trình — tầng luận hạn đa lớp.
 *
 * Bố cục theo đúng thứ tự spec v4 mục 6: breadcrumb → tiêu đề đời thường →
 * tóm tắt điều hành → luận theo lĩnh vực → căn cứ (mặc định đóng) → CTA sang
 * Hỏi Celes mang theo nguyên bối cảnh.
 *
 * Thuật ngữ Tử Vi không xuất hiện ở dòng đầu. Nó nằm trong phần căn cứ, và ở
 * đó thì hiện đầy đủ — người muốn kiểm chứng phải kiểm chứng được.
 */
interface ChuyenDongAi {
  tieuDe: string;
  noiDung: string;
}

interface NhipChiTietAi {
  dangMo: ChuyenDongAi;
  dangCang: ChuyenDongAi;
  canCho: ChuyenDongAi;
  ghepLai: string;
}

export function TrangChiTietNoiDung() {
  const { t, ngonNgu } = useNgonNgu();
  const { duocVao, dangDoc } = useTaiKhoan();
  const boiCanh = useBoiCanh();
  const params = useSearchParams();
  const [moCanCu, setMoCanCu] = useState(false);
  // Nhãn của các khối nằm cùng chỗ với chữ đã sinh ra nội dung, để sửa một lần
  const k = KHUON[ngonNgu].luanHan;

  const cap = (params.get('cap') as CapLuanHan) ?? 'nam';
  const nam = Number(params.get('nam')) || new Date().getFullYear();
  // Thiếu tham số thì lấy tháng ÂM hiện tại. Mặc định cũ là tháng 1, nên mọi
  // liên kết thiếu `thang` đều đọc nguyệt hạn tháng Giêng — sai lặng lẽ.
  const thang = Number(params.get('thang')) || thangAmHienTai();

  const hoSo =
    boiCanh.hoSoDangXem ?? boiCanh.hoSos.find((h) => h.id === boiCanh.idMacDinh) ?? null;

  const laSo = useMemo(() => {
    if (!hoSo) return null;
    try {
      return lapLaSo({
        ngay: hoSo.ngay,
        thang: hoSo.thang,
        nam: hoSo.nam,
        gio: hoSo.gio,
        gioiTinh: hoSo.gioiTinh,
        hoTen: hoSo.hoTen,
      });
    } catch {
      return null;
    }
  }, [hoSo]);

  // Bài luận dựng ở MÁY CHỦ: đây là khả năng trả phí, dựng trong trình duyệt
  // thì mở devtools là đọc được hết.
  const [bai, setBai] = useState<LuanHan | null>(null);
  const [day, setDay] = useState(true);
  /*
   * Phần chữ do model viết. Các lớp tất định bên dưới — nhịp, yếu tố thuận/cản,
   * luận theo lĩnh vực, căn cứ — vẫn giữ nguyên và vẫn là thứ chứng minh kết
   * luận. Model viết phần mà luật không viết được, không thay chỗ của luật.
   */
  const [ai, setAi] = useState<NhipChiTietAi | null>(null);
  const [moCong, setMoCong] = useState(false);

  useEffect(() => {
    if (!laSo) return;
    let huy = false;
    fetch('/api/luan-han', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay: laSo.thongTin.ngay,
        thang: laSo.thongTin.thang,
        nam: laSo.thongTin.nam,
        gio: laSo.thongTin.gio,
        gioiTinh: laSo.thongTin.gioiTinh,
        hoTen: laSo.thongTin.hoTen,
        cap,
        namXem: nam,
        thangXem: thang,
        ngonNgu,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        setBai(d?.bai ?? null);
        setDay(Boolean(d?.day));
        setAi((d?.ai as NhipChiTietAi | null) ?? null);
      });
    return () => {
      huy = true;
    };
  }, [laSo, cap, nam, thang, ngonNgu]);

  if (!dangDoc && !duocVao) {
    return (
      <Section gon>
        <Shell>
          <CongDangNhap nguon="journey" />
        </Shell>
      </Section>
    );
  }

  if (!bai) {
    return (
      <Section gon>
        <Shell className="flex flex-col gap-[16px]">
          <h1 className="heading-sm">{t.chiTietHan.chuaCoLaSo}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.chiTietHan.chuaCoLaSoMo}
          </p>
          <Link href="/la-so" className="btn-primary self-start">
            {t.hanhTrinh.lapBanDo}
          </Link>
        </Shell>
      </Section>
    );
  }

  const duongHoi = `/hoi-dap?q=${encodeURIComponent(bai.cauHoiGoiY)}`;

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[32px]">
        {/* A. Header — breadcrumb, lá số đang xem, tiêu đề đời thường */}
        <div className="flex flex-col gap-[12px]">
          <nav className="flex flex-wrap items-center gap-[8px] text-[13px]">
            <Link href="/hanh-trinh" className="link-text">
              {t.chiTietHan.quayLai}
            </Link>
            <span style={{ color: 'var(--fg-subtle)' }}>›</span>
            <span style={{ color: 'var(--fg-muted)' }}>{nam}</span>
            {cap === 'thang' && (
              <>
                <span style={{ color: 'var(--fg-subtle)' }}>›</span>
                <span style={{ color: 'var(--fg-muted)' }}>
                  {dien(KHUON[ngonNgu].hanhTrinh.thangNhan, { thang })}
                </span>
              </>
            )}
          </nav>

          {/* Breadcrumb ngay trên đã nói "Hành trình" — không lặp lại ở eyebrow */}
          <div className="flex flex-wrap items-center gap-[10px]">
            {hoSo && (
              <NhanPill>
                {hoSo.hoTen?.trim() || `${hoSo.ngay}/${hoSo.thang}/${hoSo.nam}`}
                {hoSo.id === boiCanh.idMacDinh ? ` · ${t.danhSach.laSoCuaToi}` : ''}
              </NhanPill>
            )}
          </div>

          <h1 className="heading-sm">{bai.tieuDe}</h1>
          <p className="body-sm max-w-[640px]" style={{ color: 'var(--fg-muted)' }}>
            {bai.subline}
          </p>
        </div>

        {/* Chưa mở quyền: giữ tiêu đề và chủ đề chính để biết bên trong nói gì */}
        {!day && (
          <The className="flex flex-col gap-[12px]">
            <Eyebrow>{t.ungHo.ten}</Eyebrow>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.ungHo.cong.journey_detail.tieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.ungHo.cong.journey_detail.moTa}
            </p>
            <button onClick={() => setMoCong(true)} className="btn-primary self-start">
              {t.ungHo.cong.journey_detail.cta}
            </button>
            <p className="caption">{t.ungHo.khongPhuThuocSoTien}</p>
          </The>
        )}

        {moCong && (
          <CongUngHo
            lyDo="journey_detail"
            onDong={() => setMoCong(false)}
            quayLai={{
              path: `/hanh-trinh/chi-tiet?cap=${cap}&nam=${nam}&thang=${thang}`,
              profileId: hoSo?.id ?? null,
              year: nam,
              month: thang,
            }}
          />
        )}

        {/* A2. Ba chuyển động — phần chữ do model viết, theo §11.4 của khung luận.
            Đặt trên phần tóm tắt vì đây mới là thứ người đọc cần trước; các lớp
            đếm được ở dưới là chỗ để họ lần xuống khi muốn biết vì sao. */}
        {day && ai && (
          <div className="flex flex-col gap-[12px]">
            {(
              [
                [t.hanhTrinh.dangMo, ai.dangMo],
                [t.hanhTrinh.dangCang, ai.dangCang],
                [t.hanhTrinh.canCho, ai.canCho],
              ] as const
            ).map(([nhan, cd]) => (
              <The key={nhan} className="flex flex-col gap-[6px]">
                <Eyebrow>{nhan}</Eyebrow>
                {cd.tieuDe && (
                  <p className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
                    {cd.tieuDe}
                  </p>
                )}
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {cd.noiDung}
                </p>
              </The>
            ))}
            <The className="flex flex-col gap-[6px]">
              <Eyebrow>{k.nhomTongHop}</Eyebrow>
              <p className="body-text" style={{ color: 'var(--fg)' }}>
                {ai.ghepLai}
              </p>
            </The>
          </div>
        )}

        {/* B. Tóm tắt điều hành */}
        {day && (
        <div className="grid gap-[16px] md:grid-cols-2">
          <The className="flex flex-col gap-[8px]">
            <Eyebrow>{k.chuDeChinh}</Eyebrow>
            <p className="body-text" style={{ color: 'var(--fg)' }}>
              {bai.chuDeChinh}
            </p>
          </The>

          <The className="flex flex-col gap-[8px]">
            <Eyebrow>{k.nhipHanhDong}</Eyebrow>
            <p className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {bai.nhip.nhan}
            </p>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {bai.nhip.mo}
            </p>
          </The>

          <The className="flex flex-col gap-[10px]">
            <Eyebrow>{k.tanDung}</Eyebrow>
            {bai.tanDung.length ? (
              <ul className="flex flex-col gap-[8px]">
                {bai.tanDung.map((y, i) => (
                  <li key={i} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    {y.cau}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {k.tanDungTrong}
              </p>
            )}
          </The>

          <The className="flex flex-col gap-[10px]">
            <Eyebrow>{k.luuY}</Eyebrow>
            {bai.luuY.length ? (
              <ul className="flex flex-col gap-[8px]">
                {bai.luuY.map((y, i) => (
                  <li key={i} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    {y.cau}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {k.luuYTrong}
              </p>
            )}
          </The>
        </div>
        )}

        {/* C. Luận theo lĩnh vực */}
        {day && (
        <div className="flex flex-col gap-[16px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.chiTietHan.theoLinhVuc}
          </h2>
          <div className="grid gap-[12px] md:grid-cols-2">
            {bai.linhVuc.map((lv) => (
              <The key={lv.id} className="flex flex-col gap-[6px]">
                <span className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {lv.nhan}
                </span>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {lv.cau}
                </p>
              </The>
            ))}
          </div>
          <p className="caption">{k.khongThayTheYTe}</p>
        </div>
        )}

        {/* D. Căn cứ — mặc định đóng, mở ra là có cấu trúc chứ không phải dữ liệu thô */}
        {day && (
        <div className="flex flex-col gap-[12px]">
          <button
            onClick={() => {
              const moi = !moCanCu;
              setMoCanCu(moi);
              if (moi) ghiSuKien('why_opened', { man: 'luan-han', cap });
            }}
            className="link-text self-start"
            aria-expanded={moCanCu}
          >
            {moCanCu ? t.chiTietHan.viSaoDong : t.chiTietHan.viSao}
          </button>

          {moCanCu && (
            <The className="flex flex-col gap-[16px]">
              {bai.canCu.map((nhom) => (
                <div key={nhom.nhan} className="flex flex-col gap-[6px]">
                  <Eyebrow>{nhom.nhan}</Eyebrow>
                  <ul className="flex flex-col gap-[4px]">
                    {nhom.dong.map((d, i) => (
                      <li key={i} className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </The>
          )}
        </div>
        )}

        {/* E. CTA cuối bài — mang nguyên bối cảnh sang Hỏi Celes */}
        <The className="flex flex-col gap-[12px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.chiTietHan.ctaTieuDe}
          </h2>
          <Link href={duongHoi} className="btn-primary self-start">
            {t.chiTietHan.ctaNut}
          </Link>
        </The>
      </Shell>
    </Section>
  );
}
