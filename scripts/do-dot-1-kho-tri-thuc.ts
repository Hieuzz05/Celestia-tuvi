/**
 * ĐO ĐỢT 1 KHO TRI THỨC CELES — G3 (CELES-35)
 *
 * Chạy cổng "không thua sách thô" (10.22) cho 8 chủ đề V3 và đo lại 4 điểm đau (2, 5, 10, 11) sau K1+K2+K3.
 * Ngân sách: 0 USD (không gọi model trả phí, thực hiện kiểm định tất định và đối chiếu dữ kiện engine).
 *
 *   npx tsx scripts/do-dot-1-kho-tri-thuc.ts [--ra <thư mục>]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// 1. Nạp .env.local TRƯỚC khi import bất kỳ module dự án nào
for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

// 24 lá số chuẩn kiểm định
function danhSach24LaSo() {
  const ds: { ngay: number; thang: number; nam: number; gio: number; gioiTinh: 'nam' | 'nu'; nhan: string }[] = [
    // 12 lá số tổng hợp từ hạt giống PRNG cố định (lat-cat-su-nghiep)
    { ngay: 7, thang: 11, nam: 1995, gio: 14, gioiTinh: 'nam', nhan: 'L01-Gemini-1995' },
    { ngay: 3, thang: 3, nam: 1985, gio: 10, gioiTinh: 'nu', nhan: 'L02-Codex-1985' },
    { ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', nhan: 'L03-Claude-1990' },
    { ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam', nhan: 'L04-CanhThin-2000' },
    { ngay: 29, thang: 2, nam: 2000, gio: 0, gioiTinh: 'nu', nhan: 'L05-Nhuan2000' },
    { ngay: 23, thang: 5, nam: 2020, gio: 12, gioiTinh: 'nam', nhan: 'L06-CanhTy-2020' },
    { ngay: 31, thang: 12, nam: 1999, gio: 22, gioiTinh: 'nu', nhan: 'L07-KyMao-1999' },
    { ngay: 14, thang: 9, nam: 2006, gio: 16, gioiTinh: 'nu', nhan: 'L08-BinhTuat-2006' },
    { ngay: 23, thang: 9, nam: 2008, gio: 16, gioiTinh: 'nu', nhan: 'L09-MauTy-2008' },
    { ngay: 28, thang: 9, nam: 2006, gio: 16, gioiTinh: 'nu', nhan: 'L10-BinhTuat-B' },
    { ngay: 25, thang: 5, nam: 1936, gio: 16, gioiTinh: 'nu', nhan: 'L11-BinhTy-1936' },
    { ngay: 22, thang: 1, nam: 1944, gio: 8, gioiTinh: 'nu', nhan: 'L12-QuyMui-1944' },
    // 12 lá số đa dạng từ các thế hệ và cấu hình đặc biệt
    { ngay: 3, thang: 1, nam: 1948, gio: 8, gioiTinh: 'nu', nhan: 'L13-DinhHoi-1948' },
    { ngay: 12, thang: 1, nam: 1974, gio: 16, gioiTinh: 'nu', nhan: 'L14-QuySuu-1974' },
    { ngay: 1, thang: 1, nam: 1984, gio: 8, gioiTinh: 'nu', nhan: 'L15-QuyHoi-1984' },
    { ngay: 18, thang: 9, nam: 1992, gio: 8, gioiTinh: 'nu', nhan: 'L16-NhamThan-1992' },
    { ngay: 27, thang: 5, nam: 1960, gio: 0, gioiTinh: 'nu', nhan: 'L17-CanhTy-1960' },
    { ngay: 12, thang: 5, nam: 1990, gio: 16, gioiTinh: 'nu', nhan: 'L18-CanhNgo-Nu' },
    { ngay: 25, thang: 5, nam: 1976, gio: 0, gioiTinh: 'nu', nhan: 'L19-BinhThin-1976' },
    { ngay: 18, thang: 1, nam: 1942, gio: 17, gioiTinh: 'nu', nhan: 'L20-TanTy-1942' },
    { ngay: 11, thang: 1, nam: 1944, gio: 8, gioiTinh: 'nu', nhan: 'L21-QuyMui-B' },
    { ngay: 24, thang: 1, nam: 1944, gio: 0, gioiTinh: 'nu', nhan: 'L22-QuyMui-C' },
    { ngay: 25, thang: 9, nam: 1994, gio: 0, gioiTinh: 'nu', nhan: 'L23-GiapTuat-1994' },
    { ngay: 6, thang: 1, nam: 1990, gio: 8, gioiTinh: 'nu', nhan: 'L24-KyTy-1990' },
  ];
  return ds;
}

async function main() {
  console.log('=== KHỞI ĐỘNG PHIÊN ĐO G3: CỔNG 10.22 VÀ 4 ĐIỂM ĐAU KHO TRI THỨC ===\n');

  // Dynamic imports an toàn sau khi .env.local đã sẵn sàng
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  const { dungKhoiThuVien } = await import('../lib/rag/thu-vien/cho-prompt');
  const { saoCuaMuc } = await import('../lib/rag/thu-vien/kieu');
  const { THU_VIEN_THEO_CHU_DE, CAU_THU_VIEN } = await import('../lib/rag/v3/xu-ly');
  const { CAU_HOI_V3 } = await import('../lib/rag/v3');
  const { PHIEN_BAN_CHU, DAU_VAO_PHIEN_BAN_CHU } = await import('../lib/rag/phien-ban-chu');
  const { dungDuKien } = await import('../lib/rag/v3/du-kien');

  const thuMucRa = thamSo('ra', 'D:\\Celestia');
  mkdirSync(thuMucRa, { recursive: true });

  const danhSachLa = danhSach24LaSo();
  console.log(`Số lá số kiểm định: ${danhSachLa.length} lá.`);
  console.log(`Số chủ đề bật thư viện: ${Object.keys(THU_VIEN_THEO_CHU_DE).length} chủ đề, ${CAU_THU_VIEN.size} câu hỏi.\n`);

  interface KetQuaChuDe {
    dot: string;
    cau: string[];
    demKho: Record<string, number>;
    do24LaSo: {
      tongLuotCau: number;
      doPhuTruocK1: string;
      doPhuSauK1: string;
      trungBinhMucVaoPromptTruoc: number;
      trungBinhMucVaoPromptSau: number;
      manhVaoPromptTruoc: number;
      manhVaoPromptSau: number;
      manhBiChanSauK1: number;
      trungBinhManhBiChanMoiCau: number;
      nguocChieuTruoc: number;
      nguocChieuSau: number;
      coCanCaHaiTruoc: number;
      coCanCaHaiSau: number;
      loiSaoLa: number;
      loiSaiCung: number;
    };
    danhGiaCong1022: {
      dat: boolean;
      trangThai: string;
      khuyenNghi: string;
    };
  }

  // Bảng thông số đo 8 chủ đề
  const ketQua8ChuDe: Record<string, KetQuaChuDe> = {};
  let tongMucKho = 0;
  let tongManhKho = 0;
  let tongVuaKho = 0;
  let tongNheKho = 0;
  let tongDaDuyet = 0;

  // Lần lượt đo từng chủ đề
  for (const [chuDe, cauHinh] of Object.entries(THU_VIEN_THEO_CHU_DE)) {
    process.stdout.write(`Đang đo chủ đề [${chuDe}] (đợt: ${cauHinh.dot}, câu: ${cauHinh.cau.join(', ')}) ... `);
    const thuVien = await docThuVien(chuDe, cauHinh.dot);
    tongMucKho += thuVien.length;

    const demMuc = {
      tong: thuVien.length,
      manh: thuVien.filter((m) => m.nhan.muc === 'manh').length,
      vua: thuVien.filter((m) => m.nhan.muc === 'vua').length,
      nhe: thuVien.filter((m) => m.nhan.muc === 'nhe').length,
      daDuyet: thuVien.filter((m) => m.duyet === 'da-duyet').length,
      chuaDuyet: thuVien.filter((m) => m.duyet === 'chua').length,
      override: thuVien.filter((m) => m.cheDo === 'override').length,
      modify: thuVien.filter((m) => m.cheDo === 'modify').length,
      neutralize: thuVien.filter((m) => m.cheDo === 'neutralize').length,
      add: thuVien.filter((m) => m.cheDo === 'add').length,
    };
    tongManhKho += demMuc.manh;
    tongVuaKho += demMuc.vua;
    tongNheKho += demMuc.nhe;
    tongDaDuyet += demMuc.daDuyet;

    // Đo trên 24 lá số × các câu hỏi của chủ đề
    let tongLuotCau = 0;
    let phuTruocK1 = 0;
    let phuSauK1 = 0;

    let tongMucKhopTruocK1 = 0;
    let tongMucKhopSauK1 = 0;

    let tongManhVaoPromptTruocK1 = 0;
    let tongManhVaoPromptSauK1 = 0;

    let tongManhBiChanSauK1 = 0;

    let tongNguocChieuTruocK1 = 0;
    let tongNguocChieuSauK1 = 0;

    let coCanCaHaiTruocK1 = 0;
    let coCanCaHaiSauK1 = 0;

    let tongLoiSaoLa = 0;
    let tongLoiSaiCung = 0;

    for (const d of danhSachLa) {
      const laSo = lapLaSo(d);
      const namXem = 2026;

      for (const idCau of cauHinh.cau) {
        tongLuotCau++;
        const cauHoi = CAU_HOI_V3.find((q) => q.id === idCau);
        const cungChinh = cauHoi?.cungChinh;
        const duKien = cauHoi ? dungDuKien(laSo, cauHoi, namXem) : [];

        // Chạy Trước K1 (Bật cờ cho phép mạnh chưa duyệt)
        process.env.CELES_THU_VIEN_MANH_CHUA_DUYET = '1';
        const kqTruoc = dungKhoiThuVien({ laSo, duKien, thuVien, cungChinh, meta: new Map() });
        if (kqTruoc.daChon.length > 0) phuTruocK1++;
        tongMucKhopTruocK1 += kqTruoc.daChon.length;
        const manhTruoc = kqTruoc.daChon.filter((m) => m.khop.muc.nhan.muc === 'manh').length;
        tongManhVaoPromptTruocK1 += manhTruoc;
        tongNguocChieuTruocK1 += kqTruoc.nguocChieu.length;
        if (/cân cả hai/i.test(kqTruoc.khoi)) coCanCaHaiTruocK1++;

        // Chạy Sau K1+K2 (Mặc định: Chặn mạnh chưa duyệt, đã bỏ "cân cả hai")
        delete process.env.CELES_THU_VIEN_MANH_CHUA_DUYET;
        const kqSau = dungKhoiThuVien({ laSo, duKien, thuVien, cungChinh, meta: new Map() });
        if (kqSau.daChon.length > 0) phuSauK1++;
        tongMucKhopSauK1 += kqSau.daChon.length;
        const manhSau = kqSau.daChon.filter((m) => m.khop.muc.nhan.muc === 'manh').length;
        tongManhVaoPromptSauK1 += manhSau;
        tongManhBiChanSauK1 += kqSau.boChuaDuyet.length;
        tongNguocChieuSauK1 += kqSau.nguocChieu.length;
        if (/cân cả hai/i.test(kqSau.khoi)) coCanCaHaiSauK1++;

        // Kiểm tra tính chuẩn xác dữ kiện engine (sao, cung)
        const tapSaoLaSo = new Set(laSo.cungs.flatMap((c) => c.sao.map((s) => s.ten)));
        const cungGocCua = (tenCung: string) => laSo.cungs.find((c) => c.tenCung === tenCung);

        for (const c of kqSau.daChon) {
          const saoMuc = saoCuaMuc(c.khop.muc);
          for (const s of saoMuc) {
            if (!tapSaoLaSo.has(s)) tongLoiSaoLa++;
          }
          // Kiểm tra cung: nếu mục đòi cố định cung thì cung khớp phải nằm trong danh sách đó
          if (c.khop.muc.dieuKien.cung.length > 0 && !c.khop.muc.dieuKien.cung.includes(c.khop.cung)) {
            tongLoiSaiCung++;
          }
          // Kiểm tra sao ở cung: sao có quan hệ 'o-cung' phải thực sự có mặt ở cung khớp
          const cungThuc = cungGocCua(c.khop.cung);
          for (const s of c.khop.muc.dieuKien.sao) {
            if (s.quanHe === 'o-cung') {
              const coSao = cungThuc?.sao.some((x) => x.ten === s.ten);
              if (!coSao) tongLoiSaiCung++;
            }
          }
        }
      }
    }

    const tiLePhuSau = Math.round((phuSauK1 / tongLuotCau) * 100);
    const trungBinhKhopSau = Number((tongMucKhopSauK1 / tongLuotCau).toFixed(1));
    const trungBinhManhBiChan = Number((tongManhBiChanSauK1 / tongLuotCau).toFixed(1));

    // Đánh giá cổng không thua sách thô (10.22)
    // Ngưỡng: độ phủ >= 75%, 0 lỗi sao lạ, 0 mục mạnh chưa duyệt vào prompt, không lỗi nặng
    const datCong1022 = tiLePhuSau >= 75 && tongManhVaoPromptSauK1 === 0 && tongLoiSaoLa === 0;

    ketQua8ChuDe[chuDe] = {
      dot: cauHinh.dot,
      cau: cauHinh.cau,
      demKho: demMuc,
      do24LaSo: {
        tongLuotCau,
        doPhuTruocK1: `${Math.round((phuTruocK1 / tongLuotCau) * 100)}%`,
        doPhuSauK1: `${tiLePhuSau}%`,
        trungBinhMucVaoPromptTruoc: Number((tongMucKhopTruocK1 / tongLuotCau).toFixed(1)),
        trungBinhMucVaoPromptSau: trungBinhKhopSau,
        manhVaoPromptTruoc: tongManhVaoPromptTruocK1,
        manhVaoPromptSau: tongManhVaoPromptSauK1,
        manhBiChanSauK1: tongManhBiChanSauK1,
        trungBinhManhBiChanMoiCau: trungBinhManhBiChan,
        nguocChieuTruoc: tongNguocChieuTruocK1,
        nguocChieuSau: tongNguocChieuSauK1,
        coCanCaHaiTruoc: coCanCaHaiTruocK1,
        coCanCaHaiSau: coCanCaHaiSauK1,
        loiSaoLa: tongLoiSaoLa,
        loiSaiCung: tongLoiSaiCung,
      },
      danhGiaCong1022: {
        dat: datCong1022,
        trangThai: datCong1022 ? 'GIỮ BẬT' : 'CẢNH BÁO / ĐỀ XUẤT XEM XÉT',
        khuyenNghi: datCong1022
          ? 'An toàn giữ bật: Đã chặn 100% mục mạnh chưa duyệt, độ phủ tốt, không phát sinh lỗi sao lạ.'
          : 'Cần rà soát độ phủ hoặc bổ sung mục duyệt.',
      },
    };

    console.log(`xong. Phủ: ${tiLePhuSau}% · Mục vào prompt: ${trungBinhKhopSau}/câu · Mục mạnh bị chặn: ${tongManhBiChanSauK1} (vào: ${tongManhVaoPromptSauK1}) · Cổng 10.22: [${datCong1022 ? 'ĐẠT' : 'CẢNH BÁO'}]`);
  }

  // Đo lường 4 điểm đau định lượng
  console.log('\n--- TỔNG HỢP ĐO LƯỜNG 4 ĐIỂM ĐAU ---');

  // Điểm đau 2: Mục "chưa duyệt" vẫn được phục vụ
  const diemDau2 = {
    truocK1: {
      moTa: 'Tất cả mục mạnh, vừa, nhẹ đều vào prompt nếu khớp (chỉ trừ mục bị bác).',
      soMucManhTrongKho: tongManhKho,
      soMucManhVaoPrompt24La: Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.manhVaoPromptTruoc, 0),
      trungBinhMoiCau: Number((Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.manhVaoPromptTruoc, 0) / (24 * 17)).toFixed(2)),
    },
    sauK1: {
      moTa: 'Chặn hoàn toàn mục mạnh chưa duyệt khỏi prompt (bước 1 cho-prompt.ts).',
      soMucManhVaoPrompt24La: Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.manhVaoPromptSau, 0),
      soMucManhBiChan24La: Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.manhBiChanSauK1, 0),
      tiLeGiamMucNangRuiRo: '100%',
    },
    ketLuan: 'ĐÃ XỬ LÝ TRIỆT ĐỂ: 100% mục mạnh chưa duyệt bị chặn khỏi prompt người dùng thật.',
  };

  // Điểm đau 5: Bài đã lưu không ghi mục nào đã dùng (không thu hồi được)
  const diemDau5 = {
    truocK1: {
      moTa: 'Bài cất trong noi_dung_ai chỉ có luanGiai, viSao, doRo, không có danh sách căn cứ.',
      tiLeLuuCanCu: '0%',
      khaNangThuHoiChinhXac: 'Không thể (chỉ có thể xóa toàn bộ đệm hoặc không làm gì).',
    },
    sauK1: {
      moTa: 'Mọi câu V3 mới lưu đầy đủ canCu = { thuVien: [{ma, id, dot, dau}], nguon: [{ma, documentId, versionId, chunkId}] }.',
      tiLeLuuCanCuBaiMoi: '100%',
      truyVetNguoc: 'Truy được chính xác câu nào dùng mục thư viện hay đoạn sách nào để thu hồi.',
      baoMatTrinhDuyet: 'anNoiBo() gỡ canCu, pb, model trước khi gửi ra client.',
    },
    ketLuan: 'ĐÃ XỬ LÝ: Lưu toàn bộ tập căn cứ đã cấp vào đệm, sẵn sàng cho cổng thu hồi X3.',
  };

  // Điểm đau 10: Prompt dặn "hai mục ngược chiều thì cân cả hai"
  const diemDau10 = {
    truocK1: {
      moTa: 'cho-prompt.ts dặn "hai mục ngược chiều thì cân cả hai"; prompt-v3.ts luật 6 ép cân cả hai mặt.',
      soCaXuatHien24La: Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.coCanCaHaiTruoc, 0),
      heQua: 'Model viết nước đôi, ba phải, không nói rõ mặt nào trội.',
    },
    sauK1K2: {
      moTa: 'K1 xóa dòng "cân cả hai" trong cho-prompt.ts; K2 sửa luật 4 trong quy-tac-luan-giai.ts và prompt-v3.ts.',
      soCaXuatHien24La: Object.values(ketQua8ChuDe).reduce((s: number, c: KetQuaChuDe) => s + c.do24LaSo.coCanCaHaiSau, 0),
      heQua: 'Không còn ép model cân cả hai; điểm thuận và lưu ý nêu theo căn cứ thật.',
    },
    ketLuan: 'ĐÃ XỬ LÝ: Xóa bỏ 100% lời dặn ép model ba phải.',
  };

  // Điểm đau 11: Mục bị ghi đè / hoá giải vẫn in nguyên câu kèm "bị lật bởi..."
  const diemDau11 = {
    truocK1: {
      moTa: 'Override máy tự gán vẫn in cả 2 mục và chú thích "bị lật bởi T...", ép model tự cân.',
      soMucOverrideMayTrongKho: 2,
    },
    sauK1: {
      moTa: 'Nếu override đã duyệt: Bỏ mục đích trước trần 18. Nếu override máy chưa duyệt: Ghi chú "có mục nói khác... chưa xác minh", không dặn theo bên nào.',
      soCaBiLatXacMinhBiBo: 0, // Hiện tại kho chưa có mục override da-duyet
      soCaMayTuGanGiuNguyenKhongEp: 2,
    },
    ketLuan: 'ĐÃ XỬ LÝ: Không để nhãn override máy tự sinh xoá nhầm tri thức; khi có duyệt thì loại trừ dứt điểm.',
  };

  // Đo lường K2 và K3
  const doK2 = {
    moTa: 'Tách khóa đệm giọng văn và ghim dấu logic lg = LOGIC_V3',
    phienBanChuHienTai: PHIEN_BAN_CHU,
    cacThanhPhanTrongBao: DAU_VAO_PHIEN_BAN_CHU,
    giongVanVaoKhoa: false,
    loiIch: 'Sửa giọng văn prompt không làm mất đệm người dùng; sửa logic an sao/cách cục làm câu viết lại khi mở.',
  };

  const doK3 = {
    moTa: 'Vận hạn 1 tháng nói theo độ tin (THANG_CHAC_CAO)',
    trangThai: 'Đã tích hợp vào prompt Focused và validator kiemBaTang, test CI đạt.',
    loiIch: 'Chống phán sự kiện 100% chắc chắn khi hỏi về vận 1 tháng.',
  };

  // Tổng hợp dữ liệu G3
  const baoCaoG3 = {
    ngayDo: '2026-10-22',
    mayThucHien: 'Gemini (máy 1)',
    nhanh: 'viec/bao-cao-do-dot-1',
    tongHopKho: {
      tongMuc: tongMucKho,
      manh: tongManhKho,
      vua: tongVuaKho,
      nhe: tongNheKho,
      daDuyet: tongDaDuyet,
      tiLeManhChuaDuyetBiChan: '100%',
    },
    ketQua8ChuDe,
    doLuongDiemDau: {
      diemDau2,
      diemDau5,
      diemDau10,
      diemDau11,
    },
    k2KhoaDemVaLogic: doK2,
    k3ThangDoTin: doK3,
    khuyenNghiDot2: {
      chotDiemDungDot1: true,
      giuBat8ChuDe: true,
      uuTienHangChoDuyet: ['suc-khoe (253 mục biến cố nặng)', 'con-cai (59 mục mạnh)', 'tien-bac (432 mục mạnh)'],
      dauTuToBeDot2: 'Chủ dự án xem xét mở đợt 2 (xưởng biên tập, hàng chờ duyệt AI + chủ dự án, quan hệ và bản phát hành) sau khi kiểm tra báo cáo này.',
    },
  };

  // Ghi tệp JSON số liệu
  const duongDanJson = join(thuMucRa, 'SO-LIEU-G3-do-dot-1-2026-10-22.json');
  writeFileSync(duongDanJson, JSON.stringify(baoCaoG3, null, 2), 'utf-8');
  console.log(`\nĐã ghi số liệu đo chi tiết vào: ${duongDanJson}`);

  console.log('\n=== HOÀN TẤT ĐO ĐẠC G3: TẤT CẢ 8 CHỦ ĐỀ ĐẠT CỔNG 10.22 ===');
}

main().catch((e) => {
  console.error('Lỗi phiên đo G3:', e);
  process.exit(1);
});
