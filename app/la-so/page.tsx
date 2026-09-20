'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { BangLuanGiai } from '@/components/laso/BangLuanGiai';
import { BuocNhapSinh, MAC_DINH, type ThongTinSinhForm } from '@/components/laso/BuocNhapSinh';
import { CanhBaoRoiTrang } from '@/components/laso/CanhBaoRoiTrang';
import { KhoiChuyenDoi } from '@/components/laso/KhoiChuyenDoi';
import { TuViChart } from '@/components/laso/TuViChart';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { Eyebrow, NutVien, Shell } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { goiLuanGiai, type KetQuaLuanGiai } from '@/lib/ai/goiLuanGiai';
import { useBoiCanh, type LaSoNhap } from '@/lib/store/boi-canh';
import { luuHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';
import type { BaiLuanGiai } from '@/lib/tuvi/luan-giai-sau';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { LuotBaiSau } from '@/components/support/LuotBaiSau';

/** Lá số mẫu cho liên kết "Xem một lá số mẫu" từ trang chủ */
const MAU: ThongTinSinhForm = {
  hoTen: 'Lá số mẫu',
  ngaySinh: '2000-08-24',
  gio: 9,
  phut: 0,
  gioiTinh: 'nam',
};

function tachNgay(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}

function formTuHoSo(h: HoSo): ThongTinSinhForm {
  return {
    hoTen: h.hoTen,
    ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
    gio: h.gio,
    phut: 0,
    gioiTinh: h.gioiTinh,
  };
}

function nhapTuForm(f: ThongTinSinhForm): LaSoNhap | null {
  const { ngay, thang, nam } = tachNgay(f.ngaySinh);
  if (!ngay || !thang || !nam) return null;
  return { hoTen: f.hoTen ?? '', ngay, thang, nam, gio: f.gio, phut: f.phut, gioiTinh: f.gioiTinh };
}

function formTuNhap(n: LaSoNhap): ThongTinSinhForm {
  return {
    hoTen: n.hoTen,
    ngaySinh: `${n.nam}-${String(n.thang).padStart(2, '0')}-${String(n.ngay).padStart(2, '0')}`,
    gio: n.gio,
    phut: n.phut ?? 0,
    gioiTinh: n.gioiTinh,
  };
}

/**
 * Khám phá bản đồ.
 *
 * Spec v4 đổi hẳn cách màn này chọn xem lá số nào. Bản cũ coi form nhập là
 * trạng thái mặc định, nên đổi tab rồi quay lại là mất sạch và phải khai lại
 * ngày giờ sinh. Giờ thứ tự ưu tiên là: tham số trên URL → lá số vừa nhập chưa
 * lưu → lá số đang xem trong phiên → "Lá số của tôi". Form chỉ hiện khi không
 * còn gì để hiện, hoặc khi người dùng chủ động bấm tạo lá số khác.
 */
function TrangLaSo() {
  const { t, ngonNgu } = useNgonNgu();
  const { duocVao } = useTaiKhoan();
  const boiCanh = useBoiCanh();
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState<ThongTinSinhForm | null>(null);
  /*
   * `?moi=1` ép vào màn nhập bốn bước, bỏ qua mọi lá số đã lưu.
   *
   * Nút "Thêm lá số" ở danh sách trước đây bung một form phẳng ngay tại chỗ —
   * không có bước chọn ý định, cũng không hỏi phút sinh. Nghĩa là lá số thêm từ
   * đó thiếu đúng thứ dùng để xếp thứ tự các thẻ insight. Giờ nó dẫn sang đây.
   */
  const [batNhapMoi, setBatNhapMoi] = useState(params.get('moi') === '1');
  const [namXem, setNamXem] = useState(new Date().getFullYear());
  // Tháng ÂM: nguyệt hạn chia theo tuần trăng, đưa tháng dương vào là lệch cung
  // Luôn là tháng ÂM hiện tại. Ô chọn tháng đã bỏ: người mở lá số muốn xem
  // tháng này, và ai cần tháng khác thì sang Hành trình — nơi cả dòng thời
  // gian bày ra chứ không phải một ô thả xuống.
  const thangXem = thangAmHienTai();
  const [daLuu, setDaLuu] = useState(false);

  const [dangChay, setDangChay] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaLuanGiai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Chốt lá số sẽ hiển thị, theo đúng thứ tự ưu tiên ở trên
  useEffect(() => {
    if (form || batNhapMoi) return;

    if (params.get('mau')) {
      setForm(MAU);
      return;
    }

    const ngay = Number(params.get('ngay'));
    const thang = Number(params.get('thang'));
    const nam = Number(params.get('nam'));
    if (ngay && thang && nam) {
      setForm({
        hoTen: params.get('ten') ?? '',
        ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
        gio: Number(params.get('gio')) || 9,
        phut: 0,
        gioiTinh: (params.get('gt') as GioiTinh) || 'nam',
      });
      return;
    }

    if (boiCanh.dangTai) return;

    if (boiCanh.nhap) {
      setForm(formTuNhap(boiCanh.nhap));
      return;
    }

    const hoSo =
      boiCanh.hoSoDangXem ?? boiCanh.hoSos.find((h) => h.id === boiCanh.idMacDinh) ?? null;
    if (hoSo) setForm(formTuHoSo(hoSo));
  }, [form, batNhapMoi, params, boiCanh]);

  const laSo = useMemo(() => {
    if (!form) return null;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({
        ngay,
        thang,
        nam,
        gio: form.gio,
        phut: form.phut,
        gioiTinh: form.gioiTinh,
        hoTen: form.hoTen,
      });
    } catch {
      return null;
    }
  }, [form]);

  /**
   * Lá số đang xem đã nằm trong danh sách đã lưu chưa.
   *
   * SUY RA từ thông tin sinh, không phải một cờ đặt lúc nạp. Bản cũ đặt cờ ở
   * nhánh "nạp từ hồ sơ", nhưng khi mở lá số từ danh sách thì /ho-so điều hướng
   * sang đây kèm tham số URL, và nhánh đọc tham số thoát sớm trước khi tới chỗ
   * đặt cờ. Kết quả: lá số đã lưu vẫn bị hỏi "có muốn lưu không", và bấm có là
   * có hai bản giống hệt nhau.
   *
   * Trạng thái suy ra thì không có nhánh nào để quên.
   */
  const daCoTrongDanhSach = useMemo(() => {
    if (!form || boiCanh.dangTai) return false;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    if (!ngay || !thang || !nam) return false;
    return boiCanh.hoSos.some(
      (h) =>
        h.ngay === ngay &&
        h.thang === thang &&
        h.nam === nam &&
        h.gio === form.gio &&
        h.gioiTinh === form.gioiTinh
    );
  }, [form, boiCanh.hoSos, boiCanh.dangTai]);

  /*
   * Thẻ dẫn đầu cũng do model viết, một bài mỗi ngày — cùng tuyến với trang chủ
   * nên hai màn nói cùng một thứ thì đọc ra cùng một bài.
   *
   * Thẻ tất định vẫn hiện ngay và vẫn là đường lùi: model hỏng hoặc hết hạn mức
   * thì màn này vẫn có chữ, chỉ là chữ cũ.
   */
  const [noiBatAi, setNoiBatAi] = useState<DiemNoiBatAi | null>(null);
  useEffect(() => {
    if (!form) return;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    if (!ngay || !thang || !nam) return;
    let huy = false;
    fetch('/api/diem-noi-bat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh, ngonNgu }),
    })
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => {
        if (!huy && d) setNoiBatAi(d as DiemNoiBatAi);
      })
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [form, ngonNgu]);

  const gocNhin = useMemo(
    () => (laSo ? docNhanh(laSo, namXem, form?.yDinh, ngonNgu) : []),
    [laSo, namXem, form?.yDinh, ngonNgu]
  );

  // Tám khối dựng ở MÁY CHỦ. Đây là khả năng trả phí, mà dựng trong trình duyệt
  // thì mở devtools là đọc được hết — ẩn ở giao diện không phải phân quyền.
  const [baiSau, setBaiSau] = useState<BaiLuanGiai | null>(null);
  const [dayLuanGiai, setDayLuanGiai] = useState(true);
  /*
   * Đang chờ máy chủ đọc lá số.
   *
   * Không có trạng thái này thì giữa lúc gọi và lúc có bài, khu vực ấy trống
   * trơn — và người dùng kết luận là hỏng. Họ đúng khi kết luận vậy: một khoảng
   * trống mười lăm giây không phân biệt được với một tính năng chết.
   *
   * Vẫn chỉ vẽ bài khi đã có ĐỦ mười hai phần, không vẽ dần: bài được viết
   * trong MỘT lượt gọi để mười hai phần biết nhau, nên không có gì để vẽ dần.
   *
   * DẪN XUẤT, không phải một cờ được bật trong thân effect. Bật cờ ở đó là gọi
   * setState đồng bộ trong effect — đúng luật lint mà kho này đang có bảy lỗi
   * tồn đọng, và thêm cái thứ tám thì con số nền mất nghĩa.
   *
   * So khoá của lượt ĐANG cần với khoá của lượt ĐÃ xong. Đổi năm xem hay đổi
   * ngôn ngữ là đổi khoá, nên trạng thái chờ tự bật lại mà không cần dọn tay.
   */
  const khoaSau =
    laSo && duocVao
      ? `${laSo.thongTin.ngay}-${laSo.thongTin.thang}-${laSo.thongTin.nam}-${laSo.thongTin.gio}-${laSo.thongTin.gioiTinh}|${namXem}|${ngonNgu}`
      : null;
  const [khoaSauXong, setKhoaSauXong] = useState<string | null>(null);
  const dangDocSau = Boolean(khoaSau && khoaSauXong !== khoaSau);

  useEffect(() => {
    // Không dọn state ngay trong thân effect: đặt state đồng bộ ở đây là một
    // vòng vẽ lại thừa. Kết quả cũ bị thay khi câu trả lời mới về.
    if (!laSo || !duocVao) return;
    let huy = false;
    fetch('/api/luan-giai-sau', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay: laSo.thongTin.ngay,
        thang: laSo.thongTin.thang,
        nam: laSo.thongTin.nam,
        gio: laSo.thongTin.gio,
        gioiTinh: laSo.thongTin.gioiTinh,
        hoTen: laSo.thongTin.hoTen,
        namXem,
        ngonNgu,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (huy) return;
        setBaiSau(d?.bai ?? null);
        setDayLuanGiai(Boolean(d?.day));
      })
      .finally(() => {
        // Đặt trong callback bất đồng bộ, không trong thân effect
        if (!huy) setKhoaSauXong(khoaSau);
      });
    return () => {
      huy = true;
    };
  }, [laSo, duocVao, namXem, ngonNgu, khoaSau]);

  useEffect(() => {
    if (!laSo) return;
    ghiSuKien('chart_generated');
    ghiSuKien('quick_read_viewed');
  }, [laSo]);

  const nhanFormMoi = (f: ThongTinSinhForm) => {
    setForm(f);
    // Đổi thông tin sinh thì bài đọc sâu cũ không còn đúng với lá số nữa
    setKetQua(null);
    setLoi(null);
    setBatNhapMoi(false);
    setDaLuu(false);
    // Giữ vào bối cảnh phiên: rời trang rồi quay lại không phải nhập lại
    boiCanh.datNhap(nhapTuForm(f));
  };

  /** Lá số đang xem có nguy cơ mất nếu rời trang? */
  const chuaLuu = Boolean(laSo) && !daCoTrongDanhSach && !daLuu && !params.get('mau');

  const luu = async (): Promise<boolean> => {
    if (!form) return false;
    // Lưu là khả năng của tài khoản — khách bấm vào thì đưa sang cổng, kèm ý định
    if (!duocVao) {
      ghiSuKien('auth_gate_viewed', { nguon: 'save_chart' });
      router.push(`/dang-nhap?intent=save_chart&next=${encodeURIComponent(duongVe)}`);
      return false;
    }
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    try {
      const moi = await luuHoSo({
        hoTen: form.hoTen ?? '',
        ngay,
        thang,
        nam,
        gio: form.gio,
        gioiTinh: form.gioiTinh,
      });
      setDaLuu(true);
      boiCanh.datNhap(null);
      await boiCanh.taiLai();
      boiCanh.xemHoSo(moi.id);
      ghiSuKien('signup_after_result');
      return true;
    } catch {
      setLoi(t.quickRead.loiLuu);
      return false;
    }
  };

  const docSau = async () => {
    if (!form) return;
    const { ngay, thang, nam } = tachNgay(form.ngaySinh);
    setDangChay(true);
    setLoi(null);
    setKetQua(null);
    try {
      setKetQua(
        await goiLuanGiai({
          ngay,
          thang,
          nam,
          gio: form.gio,
          gioiTinh: form.gioiTinh,
          hoTen: form.hoTen,
          chuDe: 'tong-quan',
          namXem,
          thangXem,
        })
      );
    } catch {
      // Người dùng không cần biết provider nào hỏng — chỉ cần biết lá số vẫn còn nguyên
      setLoi(t.quickRead.loiDocDai);
    } finally {
      setDangChay(false);
    }
  };

  const boiCanhUrl = laSo
    ? `ngay=${laSo.thongTin.ngay}&thang=${laSo.thongTin.thang}&nam=${laSo.thongTin.nam}&gio=${laSo.thongTin.gio}&gt=${laSo.thongTin.gioiTinh}&ten=${encodeURIComponent(form?.hoTen ?? '')}`
    : '';

  // Nơi quay lại sau khi đăng nhập, mang sẵn thông tin sinh để không phải nhập lại
  const duongVe = laSo ? `/la-so?${boiCanhUrl}` : '/la-so';
  const lienKetSau = laSo ? `/luan-giai?${boiCanhUrl}` : '/luan-giai';
  const duongHoi = (cauHoi: string) => `/hoi-dap?q=${encodeURIComponent(cauHoi)}`;

  /** Đổi lá số: đã đăng nhập và có lá số đã lưu thì mở danh sách trước, không quăng vào form */
  const doiLaSo = () => {
    if (duocVao && boiCanh.hoSos.length > 0) {
      router.push('/ho-so');
      return;
    }
    taoLaSoKhac();
  };

  const taoLaSoKhac = () => {
    setForm(null);
    setKetQua(null);
    setLoi(null);
    setBatNhapMoi(true);
    boiCanh.datNhap(null);
  };

  // --- Chưa có lá số nào để hiện: luồng nhập từng bước ---
  if (!form) {
    if (boiCanh.dangTai && !batNhapMoi) {
      return <Shell className="py-[48px]"><span /></Shell>;
    }
    return (
      <Shell className="py-[48px]">
        <BuocNhapSinh giaTriDau={MAC_DINH} onXong={nhanFormMoi} />
      </Shell>
    );
  }

  if (!laSo) {
    return (
      <Shell className="py-[48px]">
        <div className="card mx-auto flex max-w-[560px] flex-col gap-[16px]">
          <h1 className="heading-sm">{t.quickRead.ngaySai}</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            {t.quickRead.ngaySaiMo}
          </p>
          <NutVien nho onClick={taoLaSoKhac} className="self-start">
            {t.quickRead.nhapLai}
          </NutVien>
        </div>
      </Shell>
    );
  }

  /*
   * Phần đọc, viết MỘT lần cho cả hai nhánh.
   *
   * Khách và người đã đăng nhập chỉ khác lớp bọc bên ngoài, không khác nội dung.
   * Chép đôi khối JSX thì sớm muộn hai bản lệch nhau, mà lệch ở đây nghĩa là
   * khách thấy một sản phẩm khác người dùng thấy.
   */
  const phanDoc = (
    <>
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

          {/*
            LUẬN GIẢI SÂU — đặt ngay sau thẻ đầu, không để cuối trang.

            Trước đây khối này nằm dưới cùng, sau cả bảng mười hai phần, dưới
            dạng một nút viền nhạt cạnh một nút khác. Người dùng đọc hết trang
            mà không nhận ra đây là phần sâu nhất sản phẩm có — nút ở cuối một
            trang dài thì gần như không tồn tại.

            Nút CHÍNH, không phải nút viền: trang này chỉ có đúng một việc đáng
            làm tiếp, và nó phải trông như vậy.
          */}
          <div
            className="card flex flex-col gap-[10px]"
            style={{ borderColor: 'var(--accent)' }}
          >
            <Eyebrow>{t.nav.khamPha}</Eyebrow>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.quickRead.sauNoiBatTieuDe}
            </h2>
            <p className="body-sm max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.sauNoiBatMo}
            </p>
            <div className="mt-[4px] flex flex-wrap items-center gap-[14px]">
              <Link
                href={duocVao ? lienKetSau : `/dang-nhap?intent=deep_read&next=${encodeURIComponent(duongVe)}`}
                className="btn-primary"
                onClick={() => ghiSuKien('deep_read_cta', { viTri: 'dau-trang' })}
              >
                {t.quickRead.sauNoiBatCta}
              </Link>
              <Link
                href={
                  duocVao
                    ? `/luan-giai/sau?${boiCanhUrl}`
                    : `/dang-nhap?intent=deep_read&next=${encodeURIComponent(duongVe)}`
                }
                className="link-text link-action"
                onClick={() => ghiSuKien('deep_read_cta', { viTri: 'dau-trang-doc-sau' })}
              >
                Hoặc đọc cả mười hai phần →
              </Link>
              <LuotBaiSau macDinh={t.quickRead.sauNoiBatHanMuc} />
            </div>
          </div>

          <div className="grid gap-[16px] md:grid-cols-2">
            {gocNhin.slice(1, 3).map((g) => (
              <GocNhinCard key={g.id} gocNhin={g} nho />
            ))}
          </div>

          {loi && (
            <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
              {loi}
            </p>
          )}

        {/* Đang đọc: nói rõ đang chờ cái gì và chờ bao lâu, thay vì để trống */}
        {duocVao && dangDocSau && !baiSau && (
          <section className="flex flex-col gap-[10px]">
            <Eyebrow>{t.luanSau.eyebrow}</Eyebrow>
            <p className="body-text" style={{ color: 'var(--fg)' }}>
              {t.luanSau.dangDoc}
              <span className="dot-dang-doc" aria-hidden />
            </p>
            <p className="body-sm max-w-[560px]" style={{ color: 'var(--fg-muted)' }}>
              {t.luanSau.dangDocMo}
            </p>
          </section>
        )}

        {/* Bảng luận giải theo lĩnh vực — phần mở ra sau khi đăng nhập */}
        {duocVao && baiSau && baiSau.chang.length > 0 && (
          <BangLuanGiai
            bai={baiSau}
            duongHoi={duongHoi}
            day={dayLuanGiai}
            duongVe={duongVe}
          />
        )}

        {/* ---------- Đi sâu hơn: spec v4 giữ khối này cho cả hai trạng thái ----------

            Một cột, không phải hai.

            Thẻ trái chứa cả BÀI ĐỌC DÀI sau khi bấm — vài trăm từ. Xếp nó cạnh
            một thẻ bốn dòng thì cột trái dài gấp nhiều lần cột phải, và khoảng
            trắng bên phải kéo suốt cả bài. Xếp dọc thì Khám phá tự xuống cuối,
            đúng vai của nó: lối đi tiếp, không phải nội dung để đọc.
        */}
        <section className="flex flex-col gap-[16px]">
          <div className="card flex flex-col gap-[12px]">
            <span className="eyebrow">{t.quickRead.sauTieuDe}</span>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.quickRead.docDai}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.sauMo}
            </p>

            {!duocVao ? (
              <Link
                href={`/dang-nhap?intent=deep_read&next=${encodeURIComponent(duongVe)}`}
                className="btn-outline btn-sm self-start"
                onClick={() => ghiSuKien('auth_gate_viewed', { nguon: 'deep_read' })}
              >
                {t.quickRead.docDai}
              </Link>
            ) : dangChay ? (
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {t.quickRead.dangDoc}
              </p>
            ) : (
              <NutVien nho onClick={docSau} className="self-start">
                {ketQua ? t.quickRead.docLai : t.quickRead.docDai}
              </NutVien>
            )}

            {ketQua && (
              <>
                <MarkdownLuanGiai noiDung={ketQua.noiDung} nho />
              </>
            )}
          </div>

          {/*
            Thẻ cuối trang giờ CHỈ còn Hỏi Celes.

            Nút "Khám phá sâu hơn" đã lên đầu trang. Để nguyên ở cả hai chỗ là
            hiện cùng một lời mời hai lần trong một màn — người đọc không hiểu
            hai nút khác nhau chỗ nào, và cái ở đầu mất đi phần sức nặng.
          */}
          <div className="card flex flex-col gap-[12px]">
            <span className="eyebrow">{t.nav.hoiCeles}</span>
            <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.quickRead.theoChuDeTieuDe}
            </h2>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.theoChuDeMo}
            </p>
            <div className="mt-auto flex flex-wrap gap-[12px]">
              <Link
                href={duocVao ? '/hoi-dap' : `/dang-nhap?intent=ask_celes&next=${encodeURIComponent(duongVe)}`}
                className="btn-outline btn-sm"
              >
                {t.quickRead.hoiThang}
              </Link>
            </div>
          </div>
        </section>
    </>
  );

  return (
    <div className="flex flex-col gap-[24px] py-[32px]">
      <Shell className="flex flex-col gap-[24px]">
      <CanhBaoRoiTrang
        bat={chuaLuu}
        daDangNhap={duocVao}
        onLuu={luu}
        duongDangNhap={`/dang-nhap?intent=save_chart&next=${encodeURIComponent(duongVe)}`}
      />

      <section className="flex flex-col gap-[16px]">
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <div>
            <h1 className="heading-sm">
              {form.hoTen?.trim()
                ? dien(t.quickRead.tieuDeCoTen, { ten: form.hoTen.trim() })
                : t.quickRead.tieuDeChinh}
            </h1>
            <p className="body-sm mt-[6px]" style={{ color: 'var(--fg-muted)' }}>
              {t.quickRead.moTa}
            </p>
            {/*
              "Đã giữ lại" là TRẠNG THÁI, không phải hành động, nên nó không
              thuộc hàng nút. Đặt nó cạnh một cái nút là để hai thứ khác bản
              chất cùng một độ nổi — và ở đây còn lệch cả chiều cao: chip 26px
              đứng cạnh nút 39px. Hạ xuống thành một dòng nhỏ dưới phụ đề thì
              hàng bên phải còn đúng một việc để làm.
            */}
            {duocVao && (daCoTrongDanhSach || daLuu) && (
              <p className="caption mt-[8px] inline-flex items-center gap-[6px]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden
                >
                  <path d="M4 12.5l5.5 5.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.quickRead.daGiu}
              </p>
            )}
          </div>

          {/* Khách chưa đăng nhập không thấy nút "Giữ lại" ở đây: việc lưu đã
              nằm trong khối chuyển đổi duy nhất bên dưới. Hai chỗ cùng mời một
              hành động chính là kiểu phân tán mà bản audit chỉ ra. */}
          <div className="flex items-center gap-[12px]">
            {duocVao && !daCoTrongDanhSach && !daLuu && (
              <NutVien nho onClick={luu}>
                {t.quickRead.giuLai}
              </NutVien>
            )}
            <NutVien nho onClick={doiLaSo}>
              {t.danhSach.xemLaSoKhac}
            </NutVien>
          </div>
        </div>
      </section>

      {/* Khách gặp lời mời mở bức tranh đầy đủ ngay sau phần tổng quan */}
      {!duocVao && (
        <KhoiChuyenDoi
          duongVe={duongVe}
          tieuDe={t.quickRead.moBucTranhTieuDe}
          moTa={t.quickRead.moBucTranhMo}
          nhanCta={t.quickRead.moLuanGiaiDayDu}
          chu={t.quickRead.chuMoBucTranh}
          xemTruoc={
            <TuViChart
              laSo={laSo}
              namXem={namXem}
              thangXem={thangXem}
              onNamXemChange={setNamXem}
              chiBanDo
            />
          }
        />
      )}

      </Shell>

      {/*
        Hai cột: lá số đứng yên bên trái, phần đọc cuộn bên phải.

        Chia 5/12 và 7/12 chứ không 50/50 — mệnh bàn là hình vuông nên quá nửa
        màn là thừa chỗ trống, còn phần đọc thì càng rộng càng dễ đọc. Trên màn
        1440 thì cột trái khoảng 540px, đủ để 12 cung không chen chữ.

        Lá số bên TRÁI vì nó là đối tượng, phần bên phải là lời giải thích cho
        nó. Đọc từ vật thể sang lời giải thích thuận hơn chiều ngược lại.

        `items-start` là bắt buộc: ô lưới mặc định kéo dãn hết chiều cao, mà một
        phần tử bị kéo dãn thì `sticky` không còn chỗ nào để dính.

        Dưới 1024px thì xếp dọc và bỏ dính — màn hẹp mà dính một khối cao là ăn
        mất chỗ đọc.
      */}
      {/*
        Riêng khối này dùng 1400px thay vì 1200px của cả trang.

        Mệnh bàn vẽ ở bề ngang gốc 920px rồi thu nhỏ cho vừa cột, nên cột hẹp là
        chữ trong 12 cung bé đi theo. Ở 1200px thì nó chạy ở tỉ lệ 0,51 — đúng
        một nửa thiết kế. Nới riêng khối này, giữ 1200px cho tiêu đề và các phần
        khác để chúng vẫn thẳng hàng với thanh điều hướng.
      */}
      <div className="mx-auto w-full max-w-[1400px] px-[24px]">
      {duocVao ? (
        <div className="grid items-start gap-[24px] lg:grid-cols-12">
          {/*
            Cột này CHỈ dính, không tự cuộn. Khung cuộn nằm bên trong
            TuViChart, ôm riêng mệnh bàn — xem chú thích ở đó.

            `lg:flex` + `lg:max-h`: cao tối đa một màn trừ hai mép 24px, và là
            cột dọc để con bên trong chia được phần cao còn lại.
          */}
          <aside className="flex min-w-0 flex-col gap-[12px] lg:sticky lg:top-[24px] lg:col-span-6 lg:max-h-[calc(100vh-48px)]">
            <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />
          </aside>

          <div className="flex flex-col gap-[32px] lg:col-span-6">{phanDoc}</div>
        </div>
      ) : (
        // Khách chỉ có một cột, nên giữ lại bề ngang 1200px của cả trang: một
        // cột chữ trải hết 1352px thì mỗi dòng dài quá tầm mắt.
        <div className="mx-auto flex max-w-[1200px] flex-col gap-[32px]">{phanDoc}</div>
      )}
      </div>
    </div>
  );
}

interface DiemNoiBatAi {
  insight: string;
  doiSong: string;
  matTrai: string;
  cauMangTheo: string;
}

export default function TrangLaSoBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangLaSo />
    </Suspense>
  );
}
