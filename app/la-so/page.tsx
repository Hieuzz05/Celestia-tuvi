'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { GocNhinCard } from '@/components/insight/GocNhinCard';
import { BaTheDauV3, TongQuanV3, useTongQuanV3 } from '@/components/luangiai/TongQuanV3';
import { BanDoManhYeu } from '@/components/luangiai/BanDoManhYeu';
import { ChuyenSauChuDe } from '@/components/luangiai/ChuyenSauChuDe';
import { HoiCelesDong } from '@/components/laso/HoiCelesDong';
import { TabLaSo, type MucTab } from '@/components/laso/TabLaSo';
import { CAU_HOI_V3 } from '@/lib/rag/v3/khung';
import { BangLuanGiai } from '@/components/laso/BangLuanGiai';
import { BuocNhapSinh, MAC_DINH, type ThongTinSinhForm } from '@/components/laso/BuocNhapSinh';
import { CanhBaoRoiTrang } from '@/components/laso/CanhBaoRoiTrang';
import { TuViChart } from '@/components/laso/TuViChart';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { Eyebrow, NutVien, Shell } from '@/components/ui';
import { ghiSuKien } from '@/lib/analytics';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { dien, useNgonNgu } from '@/lib/i18n/context';
import { goiLuanGiai, type KetQuaLuanGiai } from '@/lib/ai/goiLuanGiai';
import { useBoiCanh, type LaSoNhap } from '@/lib/store/boi-canh';
import { luuHoSo, type HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { docNhanh } from '@/lib/tuvi/quick-read';
import type { BaiLuanGiai } from '@/lib/tuvi/luan-giai-sau';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { themVe } from '@/components/QuayLai';

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

/**
 * Lá số từ tham số URL (`?ngay=&thang=&nam=&gio=&gt=&ten=` hoặc `?mau=1`).
 *
 * Giờ đọc bằng `has` chứ không `|| 9`: bản trước biến giờ 0 (sinh sau nửa đêm,
 * giờ Tý) thành 9 giờ — giờ Tỵ, tức là một lá số khác hẳn.
 */
function formTuUrl(params: URLSearchParams | { get(k: string): string | null }): ThongTinSinhForm | null {
  if (params.get('mau')) return MAU;
  const ngay = Number(params.get('ngay'));
  const thang = Number(params.get('thang'));
  const nam = Number(params.get('nam'));
  if (!ngay || !thang || !nam) return null;
  const gioTho = params.get('gio');
  const gio = gioTho !== null && gioTho !== '' && Number.isInteger(Number(gioTho)) ? Number(gioTho) : 9;
  return {
    hoTen: params.get('ten') ?? '',
    ngaySinh: `${nam}-${String(thang).padStart(2, '0')}-${String(ngay).padStart(2, '0')}`,
    gio: Math.min(23, Math.max(0, gio)),
    phut: 0,
    gioiTinh: params.get('gt') === 'nu' ? 'nu' : 'nam',
  };
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

  /*
   * Lá số trên URL được đọc NGAY LÚC KHỞI TẠO, không đợi effect.
   *
   * Bản trước đọc trong effect, nên lần vẽ đầu là một màn khác rồi mới nhảy sang
   * lá số — đo 24/09/2026: CLS 0,65 trên desktop, chân trang nhảy 791px. Các
   * nguồn còn lại (lá số vừa nhập, lá số đã lưu) vẫn nằm trong effect vì chúng
   * phải đợi dữ liệu nạp về.
   */
  const [formChon, setForm] = useState<ThongTinSinhForm | null>(() =>
    params.get('moi') === '1' ? null : formTuUrl(params)
  );
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

  /*
   * Chốt lá số sẽ hiển thị, theo đúng thứ tự ưu tiên ở trên: người dùng đã chọn
   * (hoặc URL) → lá số vừa nhập chưa lưu → lá số đang xem → "Lá số của tôi".
   * SUY RA chứ không đặt state trong effect — bản effect cũ vẽ một màn trống
   * trước rồi mới nhảy sang lá số (xem ghi chú ở `formChon`).
   */
  const formMacDinh = useMemo(() => {
    if (batNhapMoi || boiCanh.dangTai) return null;
    if (boiCanh.nhap) return formTuNhap(boiCanh.nhap);
    const hoSo =
      boiCanh.hoSoDangXem ?? boiCanh.hoSos.find((h) => h.id === boiCanh.idMacDinh) ?? null;
    return hoSo ? formTuHoSo(hoSo) : null;
  }, [batNhapMoi, boiCanh]);
  const form = formChon ?? formMacDinh;

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
    laSo
      ? `${laSo.thongTin.ngay}-${laSo.thongTin.thang}-${laSo.thongTin.nam}-${laSo.thongTin.gio}-${laSo.thongTin.gioiTinh}|${namXem}|${ngonNgu}`
      : null;
  const [khoaSauXong, setKhoaSauXong] = useState<string | null>(null);
  const dangDocSau = Boolean(khoaSau && khoaSauXong !== khoaSau);

  /*
   * LUẬN GIẢI TỔNG QUAN v3 (CEL-119) thay bảng lĩnh vực ở chỗ này.
   *
   * Bảng lĩnh vực cũ KHÔNG bị gỡ: nó là đường lùi. Nó chỉ được tải khi v3 báo
   * hỏng cho đúng lá số + năm + ngôn ngữ đang xem, hoặc khi giao diện không phải
   * tiếng Việt (v3 chỉ viết tiếng Việt). Tải cả hai thì người đã đăng nhập tốn
   * gấp đôi lượt gọi model cho cùng một chỗ trên trang.
   */
  const [v3HongKhoa, setV3HongKhoa] = useState<string | null>(null);
  /*
   * Khách chưa đăng nhập hết lượt lá số mới trong ngày (gioi-han-khach.ts):
   * lùi về bản tất định như khi v3 hỏng — bản đó không gọi model — và nói rõ
   * vì sao, kèm lối đăng nhập.
   */
  const [gioiHanKhoa, setGioiHanKhoa] = useState<string | null>(null);
  const dungV3 = ngonNgu === 'vi';
  const canBangCu = !dungV3 || (khoaSau !== null && v3HongKhoa === khoaSau);
  const tongQuan = useTongQuanV3(
    dungV3 && laSo && !canBangCu
      ? {
          ngay: laSo.thongTin.ngay,
          thang: laSo.thongTin.thang,
          nam: laSo.thongTin.nam,
          gio: laSo.thongTin.gio,
          gioiTinh: laSo.thongTin.gioiTinh,
          namXem,
        }
      : null,
    (gioiHanKhach) => {
      setV3HongKhoa(khoaSau);
      if (gioiHanKhach) setGioiHanKhoa(khoaSau);
    }
  );

  useEffect(() => {
    // Không dọn state ngay trong thân effect: đặt state đồng bộ ở đây là một
    // vòng vẽ lại thừa. Kết quả cũ bị thay khi câu trả lời mới về.
    // Phần TỔNG QUAN mở cho cả khách — chỉ luận giải chuyên sâu mới cần tài
    // khoản. Tuyến /api/luan-giai-sau tự quyết khách được thấy tới đâu.
    if (!laSo || !canBangCu) return;
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
  }, [laSo, namXem, ngonNgu, khoaSau, canBangCu]);

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

  /*
   * TAB (25/09/2026): Tổng quan · Chuyên sâu · Mạnh – yếu · Lá số (chỉ điện thoại).
   * Nhớ tab trên URL (?tab=) để quay lại/chia sẻ đúng chỗ — ghi bằng
   * history.replaceState chứ không router.replace: đổi tab không phải một lần
   * điều hướng, và không được chạm vào luồng đọc form từ URL.
   */
  const [tab, setTab] = useState(() => {
    const x = params.get('tab');
    return x && TAB_HOP_LE.includes(x) ? x : 'tong-quan';
  });
  // v3 chỉ có tiếng Việt: giao diện khác thì không có hai tab chuyên sâu và mạnh–yếu
  const tabHien = !dungV3 && (tab === 'chuyen-sau' || tab === 'manh-yeu') ? 'tong-quan' : tab;
  const doiTab = (id: string, cuonLen = false) => {
    setTab(id);
    ghiSuKien('chart_tab_opened', { tab: id });
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('tab', id);
      window.history.replaceState(window.history.state, '', u.toString());
    } catch {
      /* không ghi được URL thì tab vẫn đổi */
    }
    // Đang ở sâu dưới trang mà đổi tab: đưa đầu phần mới lên ngay dưới thanh điều hướng
    const dau = document.getElementById('dau-phan-doc');
    if (dau && (cuonLen || dau.getBoundingClientRect().top < 0)) {
      dau.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const tabs: MucTab[] = [
    { id: 'tong-quan', nhan: t.quickRead.tabTongQuan, dem: dungV3 ? String(SO_PHAN_TONG_QUAN) : undefined },
    ...(dungV3
      ? [
          { id: 'chuyen-sau', nhan: t.quickRead.tabChuyenSau, dem: '14' },
          { id: 'manh-yeu', nhan: t.quickRead.tabManhYeu, dem: '12' },
        ]
      : []),
    { id: 'la-so', nhan: t.quickRead.tabLaSo, chiDienThoai: true },
  ];

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
      <TabLaSo tabs={tabs} chon={tabHien} onChon={doiTab} />

      {/* ================= TỔNG QUAN: đánh giá chung + luận tổng quan ================= */}
      {(tabHien === 'tong-quan' || tabHien === 'la-so') && (
        <div
          id="panel-tong-quan"
          role="tabpanel"
          aria-labelledby="tab-tong-quan"
          className={`flex flex-col gap-[32px] ${tabHien === 'la-so' ? 'hidden lg:flex' : ''}`}
        >
          <section className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[4px]">
              <Eyebrow>{t.quickRead.danhGiaTieuDe}</Eyebrow>
              <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                {t.quickRead.danhGiaMo}
              </p>
            </div>
            {gioiHanKhoa !== null && gioiHanKhoa === khoaSau && (
              <div className="card flex flex-col gap-[8px]" style={{ borderTop: '3px solid var(--accent)' }}>
                <p className="body-text" style={{ color: 'var(--fg)' }}>
                  Hôm nay bạn đã mở khá nhiều lá số mới khi chưa đăng nhập, nên phần dưới đây là bản đọc nhanh.
                </p>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  Đăng nhập miễn phí để Celes viết luận giải tổng quan cho lá số này. Những lá số bạn đã mở trước đó vẫn xem lại được.
                </p>
                <Link
                  href={`/dang-nhap?intent=deep_read&next=${encodeURIComponent(duongVe)}`}
                  className="btn-outline btn-sm self-start"
                  onClick={() => ghiSuKien('auth_gate_viewed', { nguon: 'gioi_han_khach' })}
                >
                  Đăng nhập để đọc tiếp
                </Link>
              </div>
            )}
            {/* Ba thẻ đầu: v3 viết từ lá số; chỉ khi v3 hỏng mới lùi về thẻ khuôn cũ */}
            {!canBangCu ? (
              <BaTheDauV3 cau={tongQuan.cau} dangDoc={tongQuan.dangDoc} />
            ) : (
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
                <div className="grid gap-[16px] md:grid-cols-2">
                  {gocNhin.slice(1, 3).map((g) => (
                    <GocNhinCard key={g.id} gocNhin={g} nho />
                  ))}
                </div>
              </>
            )}
          </section>

          {loi && (
            <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
              {loi}
            </p>
          )}

          {dungV3 && laSo && !canBangCu && <TongQuanV3 cau={tongQuan.cau} dangDoc={tongQuan.dangDocDanhSach} />}

          {canBangCu && dangDocSau && !baiSau && (
            <section className="flex flex-col gap-[12px]">
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

          {/* Bảng luận giải theo lĩnh vực — đường lùi khi v3 hỏng hoặc giao diện không phải tiếng Việt */}
          {canBangCu && baiSau && baiSau.chang.length > 0 && (
            <BangLuanGiai bai={baiSau} duongHoi={duongHoi} day={dayLuanGiai} duongVe={duongVe} />
          )}

          {/*
            Hết tổng quan thì chỉ ĐÚNG một việc tiếp: sang chuyên sâu (nút chính).
            Mạnh – yếu và Hỏi Celes là lối phụ, nhỏ hơn một bậc.
          */}
          {dungV3 ? (
            <div className="card flex flex-col gap-[12px]" style={{ borderColor: 'var(--accent)' }}>
              <Eyebrow>{t.quickRead.tabChuyenSau}</Eyebrow>
              <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                {t.quickRead.tiepTieuDe}
              </h2>
              <p className="body-sm max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
                {t.quickRead.tiepMo}
              </p>
              <div className="mt-[4px] flex flex-wrap items-center gap-[12px]">
                <button type="button" className="btn-primary" onClick={() => doiTab('chuyen-sau', true)}>
                  {t.quickRead.tiepCta}
                </button>
                <button type="button" className="link-text link-action" onClick={() => doiTab('manh-yeu', true)}>
                  {t.quickRead.tiepManhYeu}
                </button>
              </div>
            </div>
          ) : (
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
              {ketQua && <MarkdownLuanGiai noiDung={ketQua.noiDung} nho />}
            </div>
          )}

          <HoiCelesDong
            tieuDe={t.quickRead.hoiTieuDe}
            mo={t.quickRead.hoiMo}
            href={duocVao ? themVe('/hoi-dap', `/la-so?${boiCanhUrl}&tab=tong-quan`) : `/dang-nhap?intent=ask_celes&next=${encodeURIComponent(duongVe)}`}
          />
        </div>
      )}

      {/* ================= CHUYÊN SÂU: 14 chủ đề ================= */}
      {tabHien === 'chuyen-sau' && laSo && dungV3 && (
        <div id="panel-chuyen-sau" role="tabpanel" aria-labelledby="tab-chuyen-sau" className="flex flex-col gap-[24px]">
          <ChuyenSauChuDe
            laSo={laSo}
            duongChuyenSau={themVe(`/luan-giai/sau?${boiCanhUrl}&namXem=${namXem}`, `/la-so?${boiCanhUrl}&tab=chuyen-sau`)}
            duocVao={duocVao}
          />
        </div>
      )}

      {/* ================= MẠNH – YẾU ================= */}
      {tabHien === 'manh-yeu' && laSo && dungV3 && (
        <div id="panel-manh-yeu" role="tabpanel" aria-labelledby="tab-manh-yeu" className="flex flex-col gap-[24px]">
          <BanDoManhYeu
            laSo={laSo}
            namXem={namXem}
            tomTat={tongQuan.cau?.find((c) => c.id === 'TQ04' && !c.chuaViet)?.luanGiai ?? null}
            dangDocTomTat={!canBangCu && tongQuan.dangDocDanhSach}
            duongChuyenSau={themVe(`/luan-giai/sau?${boiCanhUrl}&namXem=${namXem}`, `/la-so?${boiCanhUrl}&tab=manh-yeu`)}
            duocVao={duocVao}
          />
        </div>
      )}
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
            {/* Màn hẹp: mệnh bàn giờ là tab "Lá số" trên thanh tab — không cần lối tắt riêng ở đây */}
            {/*
              "Đã giữ lại" là TRẠNG THÁI, không phải hành động, nên nó không
              thuộc hàng nút. Đặt nó cạnh một cái nút là để hai thứ khác bản
              chất cùng một độ nổi — và ở đây còn lệch cả chiều cao: chip 26px
              đứng cạnh nút 39px. Hạ xuống thành một dòng nhỏ dưới phụ đề thì
              hàng bên phải còn đúng một việc để làm.
            */}
            {duocVao && (daCoTrongDanhSach || daLuu) && (
              <p className="caption mt-[8px] inline-flex items-center gap-[8px]">
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

      {/*
        Khối "mở bức tranh đầy đủ" — mệnh bàn mờ kèm lời mời đăng nhập — đã bỏ
        từ 23/09/2026: phần tổng quan giờ mở cho cả khách nên mệnh bàn thật
        hiện ngay bên dưới. Lời mời tài khoản chỉ còn ở những chỗ thật sự cần
        nó: luận giải chuyên sâu, lưu lá số, hỏi Celes.
      */}

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
      {laSo ? (
        <div className="grid items-start gap-[24px] lg:grid-cols-12">
          {/*
            Cột này CHỈ dính, không tự cuộn. Khung cuộn nằm bên trong
            TuViChart, ôm riêng mệnh bàn — xem chú thích ở đó.

            `lg:flex` + `lg:max-h`: cao tối đa một màn trừ hai mép 24px, và là
            cột dọc để con bên trong chia được phần cao còn lại.
          */}
          {/*
            Dưới 1024px: bài đọc TRƯỚC, mệnh bàn SAU (order). Đo 24/09/2026 trên
            390px: mệnh bàn chiếm gần hai màn đầu với chữ sao 9px, còn tiêu đề
            "Celes bắt đầu từ điểm nổi lên rõ nhất…" trỏ tới ba thẻ nằm tận màn
            thứ ba. Người mới tới để đọc về mình; người biết Tử Vi có lối tắt
            "Xem bàn 12 cung" ngay dưới tiêu đề.
          */}
          <aside
            id="ban-12-cung"
            className={`order-2 min-w-0 scroll-mt-[88px] flex-col gap-[12px] lg:order-none lg:sticky lg:top-[24px] lg:col-span-6 lg:flex lg:max-h-[calc(100vh-48px)] ${tabHien === 'la-so' ? 'flex' : 'hidden'}`}
          >
            <TuViChart laSo={laSo} namXem={namXem} thangXem={thangXem} onNamXemChange={setNamXem} />
          </aside>

          <div id="dau-phan-doc" className="order-1 flex min-w-0 scroll-mt-[76px] flex-col gap-[24px] lg:order-none lg:col-span-6 lg:scroll-mt-[65px]">{phanDoc}</div>
        </div>
      ) : (
        // Chưa có lá số thì chỉ có một cột chữ, nên giữ lại bề ngang 1200px của
        // cả trang: một cột chữ trải hết 1352px thì mỗi dòng dài quá tầm mắt.
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

const TAB_HOP_LE = ['tong-quan', 'chuyen-sau', 'manh-yeu', 'la-so'];
// Số phần của tab Tổng quan: mọi câu tổng quan trừ TQ04 (câu mạnh–yếu nằm ở tab riêng)
const SO_PHAN_TONG_QUAN = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && q.id !== 'TQ04').length;

export default function TrangLaSoBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangLaSo />
    </Suspense>
  );
}
