'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import {
  Eyebrow,
  IconDongHo,
  IconHaiNguoi,
  IconLaSo,
  IconMuiTenPhai,
  IconSao,
  IconTroChuyen,
  Section,
  Shell,
  The,
} from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { useBoiCanh } from '@/lib/store/boi-canh';
import { cungDaiVan, lapLaSo, type LaSo } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { namAmHienTai, thangAmHienTai } from '@/lib/tuvi/bay-gio';

/**
 * Trang chủ cá nhân hoá — nơi người đã đăng nhập đáp xuống.
 *
 * Bản spec v2 chỉ ra vấn đề: đăng nhập xong người dùng vẫn phải tự đi lại giữa
 * các công cụ rời rạc, không có "nơi của tôi". Trang này là nơi đó — mỗi lần mở
 * lên có một điều đáng chú ý, biết mình đang ở giai đoạn nào, và có đường đi
 * tiếp rõ ràng.
 *
 * Không làm theo kiểu bảng điều khiển đếm số: xếp theo thứ tự cảm xúc, mỗi khối
 * là một câu chuyện ngắn.
 */
interface DiemNoiBatAi {
  insight: string;
  doiSong: string;
  matTrai: string;
  cauMangTheo: string;
}

export function TrangHomeNoiDung() {
  const { t, ngonNgu } = useNgonNgu();
  const { taiKhoan, dangDoc } = useTaiKhoan();
  const router = useRouter();
  const boiCanh = useBoiCanh();
  const [dangNghi, setDangNghi] = useState('');

  useEffect(() => {
    ghiSuKien('home_returned');
  }, []);


  // Hôm nay LUÔN đọc "Lá số của tôi", không phải lá số đang xem tạm ở màn khác
  // và cũng không phải hoSos[0]. Bản cũ lấy phần tử đầu danh sách nên đặt lá số
  // khác làm mặc định xong quay lại đây vẫn thấy lá số cũ.
  const chinh =
    boiCanh.hoSos.find((h) => h.id === boiCanh.idMacDinh) ?? boiCanh.hoSos[0] ?? null;

  const laSo: LaSo | null = useMemo(() => {
    if (!chinh) return null;
    try {
      return lapLaSo({
        ngay: chinh.ngay,
        thang: chinh.thang,
        nam: chinh.nam,
        gio: chinh.gio,
        gioiTinh: chinh.gioiTinh,
        hoTen: chinh.hoTen,
      });
    } catch {
      return null;
    }
  }, [chinh]);

  /*
   * Điểm nổi bật do model viết, một bài mỗi ngày cho mỗi lá số.
   *
   * Không dọn `noiBatAi` khi đổi lá số ngay trong thân effect: đặt state đồng bộ
   * ở đó là một vòng vẽ lại thừa. Bài cũ bị thay khi bài mới về.
   */
  const [noiBatAi, setNoiBatAi] = useState<DiemNoiBatAi | null>(null);
  useEffect(() => {
    if (!chinh) return;
    let huy = false;
    fetch('/api/diem-noi-bat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay: chinh.ngay,
        thang: chinh.thang,
        nam: chinh.nam,
        gio: chinh.gio,
        gioiTinh: chinh.gioiTinh,
        ngonNgu,
      }),
    })
      // 204 = không có gì để thay. Giữ nguyên thẻ tất định đang hiện.
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => {
        if (!huy && d) setNoiBatAi(d as DiemNoiBatAi);
      })
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [chinh, ngonNgu]);

  /*
   * Thẻ Giai đoạn cũng do model viết, nhưng khoá theo KHOẢNG TUỔI chứ không theo
   * ngày: một quãng kéo mười năm thì không có lý do gì mỗi hôm một bài khác.
   * Dùng chung tuyến /api/nhip với Hành trình nên không thêm đường sinh mới.
   */
  const [giaiDoanAi, setGiaiDoanAi] = useState<string | null>(null);
  useEffect(() => {
    if (!chinh) return;
    let huy = false;
    fetch('/api/nhip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay: chinh.ngay,
        thang: chinh.thang,
        nam: chinh.nam,
        gio: chinh.gio,
        gioiTinh: chinh.gioiTinh,
        cap: 'giai-doan',
        namXem: namAmHienTai(),
        thangXem: thangAmHienTai(),
        ngonNgu,
      }),
    })
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => {
        if (!huy && d?.ghepLai) setGiaiDoanAi(String(d.ghepLai));
      })
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [chinh, ngonNgu]);

  const namNay = new Date().getFullYear();
  const gocNhin = useMemo(
    () => (laSo ? docNhanh(laSo, namNay, undefined, ngonNgu) : []),
    [laSo, namNay, ngonNgu]
  );

  const giaiDoan = useMemo(() => {
    if (!laSo) return null;
    return cungDaiVan(laSo, namNay - laSo.thongTin.amLich.nam + 1) ?? null;
  }, [laSo, namNay]);

  const ten = taiKhoan?.tenHienThi ?? chinh?.hoTen ?? '';

  const loiTat = [
    { icon: <IconLaSo />, nhan: t.nav.banDo, href: '/la-so' },
    { icon: <IconDongHo />, nhan: t.nav.hanhTrinh, href: '/hanh-trinh' },
    { icon: <IconTroChuyen />, nhan: t.nav.hoiCeles, href: '/hoi-dap' },
    { icon: <IconSao />, nhan: t.nav.khamPha, href: '/luan-giai' },
    { icon: <IconHaiNguoi />, nhan: t.nav.ketNoi, href: '/hop-tuoi' },
  ];

  // Mang theo thông tin sinh để trang đích không hỏi lại — spec v2 xếp việc bắt
  // nhập lại ngày giờ sinh giữa luồng vào nhóm lỗi "đứt ngữ cảnh".
  const thamSoLaSo = chinh
    ? `&ngay=${chinh.ngay}&thang=${chinh.thang}&nam=${chinh.nam}&gio=${chinh.gio}&gt=${chinh.gioiTinh}&ten=${encodeURIComponent(chinh.hoTen ?? '')}`
    : '';

  const chuDes = [
    { nhan: t.home.chuDeCongViec, href: `/luan-giai?chuDe=su-nghiep${thamSoLaSo}` },
    { nhan: t.home.chuDeTinhCam, href: `/luan-giai?chuDe=tinh-duyen${thamSoLaSo}` },
    { nhan: t.home.chuDeBanThan, href: `/luan-giai?chuDe=tong-quan${thamSoLaSo}` },
    {
      nhan: t.home.chuDeQuyetDinh,
      href: `/hoi-dap?q=${encodeURIComponent(t.home.quyetDinhCauHoi)}`,
    },
  ];

  const noiVoiCeles = () => {
    const cau = dangNghi.trim();
    if (!cau) return;
    ghiSuKien('ask_submitted', { nguon: 'home_composer' });
    router.push(`/hoi-dap?q=${encodeURIComponent(cau)}`);
  };

  return (
    <Section gon>
      <Shell className="flex flex-col gap-[40px]">
        <div>
          <Eyebrow className="mb-[12px]">{t.nav.homNay}</Eyebrow>
          <h1 className="heading-sm">
            {ten ? dien(t.home.chao, { ten }) : t.home.chaoKhongTen}
          </h1>
        </div>

        {/* Chưa có bản đồ nào thì việc tiếp theo chỉ có một, nói thẳng ra */}
        {!dangDoc && !boiCanh.dangTai && !chinh && (
          <The className="flex flex-col gap-[12px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.home.chuaCoTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.home.chuaCoMo}
            </p>
            <Link href="/la-so" className="btn-primary self-start">
              {t.nav.batDauMienPhi}
            </Link>
          </The>
        )}

        {/* Điều đáng chú ý lúc này — thẻ đã tự mang nhóm chữ của nó, đặt thêm
            tiêu đề bên trên là nói hai lần cùng một câu */}
        {gocNhin[0] && (
          <GocNhinCard
            gocNhin={
              noiBatAi
                ? {
                    ...gocNhin[0],
                    noiDung: `${noiBatAi.insight} ${noiBatAi.doiSong} ${noiBatAi.matTrai}`,
                  }
                : gocNhin[0]
            }
            chinh
          />
        )}

        {/* Câu để mang theo — mọc ra từ chính điểm mạnh vừa nói ở trên, nên chỉ
            hiện khi có bài của model. Một câu châm ngôn chung chung gắn dưới một
            thẻ tất định thì chỉ là chữ trang trí. */}
        {noiBatAi?.cauMangTheo && (
          <figure className="card flex flex-col gap-[8px] p-[24px]">
            <span className="eyebrow">{t.home.mangTheo}</span>
            <blockquote className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
              {noiBatAi.cauMangTheo}
            </blockquote>
          </figure>
        )}

        {/* Giai đoạn đang đi qua */}
        {giaiDoan?.daiVan && (
          <div className="flex flex-col gap-[16px]">
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.home.giaiDoan}
            </h2>
            <The className="flex flex-col gap-[8px]">
              <Eyebrow>
                {dien(t.home.doTuoi, {
                  tu: giaiDoan.daiVan.tuTuoi,
                  den: giaiDoan.daiVan.denTuoi,
                })}
              </Eyebrow>
              {/* Tên cung là chữ của lớp chuyên môn — mặt trước gọi bằng chủ đề
                  đời thường, đúng bảng từ ngữ của brand spec */}
              <p className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                {KHUON[ngonNgu].chuDeCung[giaiDoan.tenCung] ??
                  KHUON[ngonNgu].tenCung[giaiDoan.tenCung] ??
                  giaiDoan.tenCung}
              </p>
              {(giaiDoanAi || gocNhin[1]) && (
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {giaiDoanAi ?? gocNhin[1]?.noiDung}
                </p>
              )}
              <Link href="/hanh-trinh" className="link-text self-start">
                {t.home.xemHanhTrinh}
              </Link>
            </The>
          </div>
        )}

        {/* Cửa trò chuyện: thứ người dùng mở app để làm, nên đặt ngay trên đường đi tiếp */}
        {chinh && (
          <div className="flex flex-col gap-[16px]">
            <The className="flex flex-col gap-[12px]">
              <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                {t.home.composerNhan}
              </h2>
              <textarea
                className="field-input min-h-[88px] resize-y"
                placeholder={t.home.composerGoiY}
                value={dangNghi}
                onChange={(e) => setDangNghi(e.target.value)}
                onKeyDown={(e) => {
                  // Enter gửi, Shift+Enter xuống dòng — thói quen của mọi khung chat
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    noiVoiCeles();
                  }
                }}
              />
              <button
                className="btn-primary self-start"
                onClick={noiVoiCeles}
                disabled={!dangNghi.trim()}
              >
                {t.home.composerGui}
              </button>
            </The>

            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.home.chuDeTieuDe}
            </p>
            <div className="flex flex-wrap gap-[10px]">
              {chuDes.map((c) => (
                <Link key={c.nhan} href={c.href} className="btn-outline btn-sm">
                  {c.nhan}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Đường đi tiếp */}
        <div className="flex flex-col gap-[16px]">
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
            {t.home.diTiep}
          </h2>
          <div className="grid gap-[12px] sm:grid-cols-2">
            {loiTat.map((m) => (
              <Link key={m.href} href={m.href} className="card flex items-center gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{m.icon}</span>
                <span className="body-text flex-1">{m.nhan}</span>
                <IconMuiTenPhai size={18} />
              </Link>
            ))}
          </div>
        </div>
      </Shell>
    </Section>
  );
}
