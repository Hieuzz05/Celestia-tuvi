'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eyebrow, HuyHieuOk, NutChinh, Shell } from '@/components/ui';
import { useBoiCanh } from '@/lib/store/boi-canh';
import {
  chuyenHoSoLenTaiKhoan,
  nguonLuuHienTai,
  xoaHoSo,
  type NguonLuu,
} from '@/lib/store/hoso';
import { dien, useT } from '@/lib/i18n/context';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';

/**
 * Danh sách lá số (trước đây gọi là "Người của tôi").
 *
 * Spec v4 đổi tên vì tên cũ giàu cảm xúc nhưng mô tả sai chức năng: đây là chỗ
 * quản lý các lá số, không riêng người thân. Đi kèm là khái niệm "Lá số của
 * tôi" — đúng một lá số mang badge đó, và nó là bối cảnh mặc định của Hôm nay,
 * Hành trình lẫn Hỏi Celes.
 */
export default function TrangDanhSachLaSo() {
  const t = useT();
  const router = useRouter();
  const boiCanh = useBoiCanh();
  const [nguon, setNguon] = useState<NguonLuu>('trinh-duyet');
  const [dangDat, setDangDat] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    nguonLuuHienTai()
      .then(setNguon)
      .catch(() => setNguon('trinh-duyet'));
  }, []);

  const datMacDinh = async (id: string) => {
    setDangDat(id);
    try {
      await boiCanh.datMacDinh(id);
      setLoi(null);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t.danhSach.loiDat);
    } finally {
      setDangDat(null);
    }
  };

  const xoa = async (id: string, ten: string) => {
    // Không cho xoá lá số đang là mặc định: xoá xong thì Hôm nay, Hành trình và
    // Hỏi Celes đều mất bối cảnh mà người dùng không hiểu vì sao.
    if (id === boiCanh.idMacDinh && boiCanh.hoSos.length > 1) {
      setLoi(t.danhSach.khongXoaMacDinh);
      return;
    }
    if (!window.confirm(dien(t.danhSach.xacNhanXoa, { ten: ten || '—' }))) return;
    try {
      await xoaHoSo(id);
      await boiCanh.taiLai();
      setLoi(null);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t.danhSach.loiXoa);
    }
  };

  const dongBo = async () => {
    try {
      const so = await chuyenHoSoLenTaiKhoan();
      await boiCanh.taiLai();
      setLoi(so > 0 ? null : t.danhSach.khongCoGiDeChuyen);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : t.danhSach.loiChuyen);
    }
  };

  const moLaSo = (id: string) => {
    const h = boiCanh.hoSos.find((x) => x.id === id);
    if (!h) return;
    boiCanh.xemHoSo(id);
    router.push(
      `/la-so?ngay=${h.ngay}&thang=${h.thang}&nam=${h.nam}&gio=${h.gio}&gt=${h.gioiTinh}&ten=${encodeURIComponent(h.hoTen)}`
    );
  };

  return (
    <Shell className="flex flex-col gap-[32px] py-[36px]">
      <div>
        <Eyebrow className="mb-[12px]">{t.danhSach.eyebrow}</Eyebrow>
        <h1 className="heading-sm">{t.danhSach.tieuDe}</h1>
        <p className="body-sm mt-[12px] max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
          {nguon === 'tai-khoan' ? t.danhSach.luuTheoTaiKhoan : t.danhSach.luuTheoTrinhDuyet}
        </p>
        {loi && (
          <p className="mt-[12px] text-[13px]" style={{ color: 'var(--chart-hung)' }}>
            {loi}
          </p>
        )}
        {nguon === 'tai-khoan' && (
          <button onClick={dongBo} className="link-text mt-[12px]">
            {t.danhSach.chuyenLenTaiKhoan}
          </button>
        )}
      </div>

      <NutChinh onClick={() => router.push('/la-so?moi=1')} className="self-start">
        {t.danhSach.themLaSo}
      </NutChinh>

      <section className="flex flex-col gap-[12px]">
        {!boiCanh.dangTai && boiCanh.hoSos.length === 0 && (
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.danhSach.trong}
          </p>
        )}

        {boiCanh.hoSos.map((h) => {
          let tomTat = '';
          try {
            const ls = lapLaSo({
              ngay: h.ngay,
              thang: h.thang,
              nam: h.nam,
              gio: h.gio,
              gioiTinh: h.gioiTinh,
            });
            tomTat = `Mệnh ${CHI[ls.menhIndex]} · ${ls.cuc.ten} · ${ls.banMenh.ten}`;
          } catch {
            tomTat = t.danhSach.khongTinhDuoc;
          }
          const laMacDinh = h.id === boiCanh.idMacDinh;

          return (
            <div key={h.id} className="card flex flex-wrap items-center justify-between gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <span className="flex flex-wrap items-center gap-[10px]">
                  <span className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                    {h.hoTen || t.danhSach.khongTen}
                  </span>
                  {laMacDinh && <HuyHieuOk>{t.danhSach.laSoCuaToi}</HuyHieuOk>}
                </span>
                <span className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                  {h.ngay}/{h.thang}/{h.nam} · {dien(t.danhSach.gio, { gio: h.gio })} ·{' '}
                  {h.gioiTinh === 'nam' ? t.danhSach.nam : t.danhSach.nu} · {tomTat}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-[18px]">
                {!laMacDinh && (
                  <button
                    onClick={() => datMacDinh(h.id)}
                    className="link-text"
                    disabled={dangDat === h.id}
                  >
                    {dangDat === h.id ? t.danhSach.dangDat : t.danhSach.datLamCuaToi}
                  </button>
                )}
                <button onClick={() => moLaSo(h.id)} className="link-text">
                  {t.danhSach.xemLaSo}
                </button>
                <button onClick={() => xoa(h.id, h.hoTen)} className="link-text">
                  {t.danhSach.xoa}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <Link href="/la-so" className="link-text self-start">
        {t.danhSach.taoLaSoKhac}
      </Link>
    </Shell>
  );
}
