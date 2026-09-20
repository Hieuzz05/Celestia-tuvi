import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import {
  CHANG,
  CHANG_CUA_MUC,
  CUNG_CUA_MUC,
  GUONG,
  laGuongNoiBo,
  TAM_HOP,
  THU_TU_CHANG,
  type ChangId,
  type MucId,
} from '@/lib/tuvi/chang-cung';
import { CHU_12_CUNG } from '@/lib/tuvi/chu-12-cung';
import { doNoiBat, NGUONG_MO, NGUONG_NOI } from '@/lib/tuvi/do-noi-bat';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { TIEU_CHI_SAU } from '@/lib/tuvi/tieu-chi-sau';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from './boi-canh-la-so';
import { boCauPhanQuyet, boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson, laChuoiJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { lapKeHoach } from './planner';
import { boMarkdown, doiTenCung, suaCauTiengLong } from './sua-chua';
import { nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';

/**
 * BẢN ĐỌC SÂU — mười hai phần ở thang L1→L5.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO SINH THEO CHẶNG, KHÔNG SINH CẢ BÀI MỘT LƯỢT
 *
 * Bản đọc sâu là 77 tiêu chí, mỗi tiêu chí 70–90 từ — khoảng 6.000 từ tiếng
 * Việt, tức 14–16 nghìn token đầu ra. Không model nào trong chuỗi trả nổi
 * chừng ấy trong một lượt, và nếu trả được thì cũng chạm trần 55 giây.
 *
 * Bốn lượt, mỗi lượt một chặng: mỗi lượt khoảng 1.500 từ, vừa với ngân sách,
 * và quan trọng hơn — nó cho đúng thứ spec mục 7.4 đòi: streaming theo chặng,
 * người đọc xong chặng một thì chặng hai vừa viết xong.
 *
 * Chia nhỏ hơn nữa (mỗi phần một lượt) thì mất mạch: ba phần trong một chặng
 * phải biết nhau để `doanKhau` nói được "ba phần này cùng nói điều gì", và để
 * chúng không lặp ý chéo.
 *
 * ---------------------------------------------------------------------------
 * KHỐI GƯƠNG LÀ THỨ KHÔNG ĐƯỢC BỎ
 *
 * Mỗi phần có đúng một tiêu chí `laGuong`: đọc phần này QUA cung đối diện.
 * Đó là cơ chế làm bài không tuyến tính — không phần nào đọc một mình — và là
 * điều spec nêu làm USP. Thiếu nó thì bản đọc sâu chỉ là bức tranh đầy đủ viết
 * dài ra, mà dài hơn không phải là sâu hơn.
 */

export const PHIEN_BAN_BAN_DOC_SAU = '2026.09.1';

export interface TieuChiRa {
  nhan: string;
  noiDung: string;
  laGuong: boolean;
  /** Bắt buộc khác null với tiêu chí đi tới L3 trở lên — spec mục 10.17 */
  luongNguoc: string | null;
  maDuKien: string[];
  soTu: number;
}

export interface MucSau {
  id: MucId;
  chang: ChangId;
  tieuDe: string;
  cungGoc: string;
  cungTamHop: [string, string];
  cungGuong: string;
  guongNoiBo: boolean;
  ketLuan: string;
  tieuChi: TieuChiRa[];
  doNoiBat: number;
  cauHoiGoiY: string;
  /** Phần nào không dựng được thì nói thẳng, KHÔNG bịa cho đủ — spec mục 7.4 */
  thieuCanCu?: boolean;
}

export interface ChangSau {
  id: ChangId;
  thuTu: 1 | 2 | 3 | 4;
  tieuDe: string;
  subtitle: string;
  muc: MucSau[];
  doanKhau: string;
  cauBacCau: string | null;
}

export interface BaiDocSau {
  mode: 'deep_read';
  chang: ChangSau[];
  phienBan: Record<string, string>;
}

/** Cung nào một phần được phép đọc: gốc + hai tam hợp + gương */
function cungCuaMuc(muc: MucId): string[] {
  const goc = CUNG_CUA_MUC[muc];
  return [goc, ...TAM_HOP[goc], GUONG[goc]];
}

/**
 * Ngân sách từ cho một tiêu chí.
 *
 * Spec mục 10.12: mỗi phần 420–560 từ, `doNoiBat >= 70` được +20%, `<= 30` bị
 * −20%. Chia đều cho số tiêu chí của phần ấy thay vì đặt một con số cứng: phần
 * bảy tiêu chí mà dùng cùng ngân sách với phần sáu tiêu chí thì hoặc phần này
 * lê thê, hoặc phần kia cụt.
 */
function nganSachTu(diem: number, soTieuChi: number): number {
  const goc = 490;
  const heSo = diem >= NGUONG_NOI ? 1.2 : diem <= NGUONG_MO ? 0.8 : 1;
  return Math.round((goc * heSo) / soTieuChi);
}

/**
 * Chuẩn hoá nhãn tiêu chí trước khi đối chiếu.
 *
 * Bỏ dấu, bỏ chữ hoa, bỏ mọi thứ không phải chữ và số. Model viết "Chuyện tiền
 * bạc với người ngang hàng" hay "Chuyện tiền bạc với người ngang hàng:" là hai
 * chuỗi khác nhau với máy mà là một nhãn với người.
 */
function chuanNhan(x: string): string {
  return x
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface ThoMuc {
  id?: unknown;
  ketLuan?: unknown;
  tieuChi?: { nhan?: unknown; noiDung?: unknown; luongNguoc?: unknown; maDuKien?: unknown }[];
}

/**
 * Dựng một chặng.
 *
 * Trả null khi model không cho ra gì dùng được. Lớp gọi PHẢI chạy tiếp với ba
 * chặng còn lại: mất một chặng còn hơn mất cả bài, và spec mục 7.4 nói rõ phần
 * nào hỏng thì ship phần còn lại chứ không bịa cho đủ.
 */
export async function dungChang(vao: {
  laSo: LaSo;
  chang: ChangId;
  namXem: number;
  thangXem: number;
  banKhoan?: string;
}): Promise<ChangSau | null> {
  const k = KHUON.vi;
  const cauHinh = CHANG[vao.chang];
  const mucIds = cauHinh.muc;

  // Sắp theo độ nổi bật — phần nào lá số nói mạnh thì đứng trước
  const diem = new Map<MucId, number>(
    mucIds.map((m) => [m, doNoiBat(vao.laSo, m, vao.namXem).diem])
  );
  const thuTuMuc = [...mucIds].sort((a, b) => (diem.get(b) ?? 0) - (diem.get(a) ?? 0));

  const cungLienQuan = [...new Set(thuTuMuc.flatMap(cungCuaMuc))];

  const keHoachGoc = lapKeHoach({
    cauHoi: `Đọc sâu chặng ${cauHinh.tieuDe}`,
    saoTheoCung: saoChinhTheoCung(vao.laSo),
    tenCachCuc: tenCachCucCho(vao.laSo),
  });
  const keHoach = {
    ...keHoachGoc,
    chuDe: 'tong-quan' as const,
    cungLienQuan,
    lopHan: (['ban-menh', 'dai-van', 'luu-nien'] as const).slice(),
  };

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });
  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 10 });
  const goi = dungGoiBangChung(keHoach.truyVan, keHoach, duKien, kqTruyHoi.daChon);

  const cachCuc = nhanDangCachCuc(vao.laSo).filter((c) => c.loai !== 'han');
  const saoChoPhep = new Set([
    ...nhanDangThucThe(
      [...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')
    ).map((t) => t.id),
    ...nhanDangThucThe(cachCuc.flatMap((c) => [c.ten, ...c.sao]).join(' ')).map((t) => t.id),
  ]);

  /*
   * Bảng tiêu chí đưa vào prompt kèm ngân sách từ và cờ gương.
   *
   * Không để model tự chọn viết gì: 77 tiêu chí là bộ xương của sản phẩm, và
   * mỗi cái trả lời một câu hỏi khác nhau. Để model tự do thì nó viết bảy đoạn
   * cùng nói một ý bằng bảy cách.
   */
  const khoiMuc = thuTuMuc
    .map((m) => {
      const tc = TIEU_CHI_SAU[m];
      const nganSach = nganSachTu(diem.get(m) ?? 0, tc.length);
      const goc = CUNG_CUA_MUC[m];
      const chu = CHU_12_CUNG.vi[m];
      const dong = tc
        .map(
          (t, i) =>
            `    ${i + 1}. ${t.nhan}${t.laGuong ? '  [KHỐI GƯƠNG]' : ''}` +
            `${t.moTa ? `\n       → ${t.moTa}` : ''}` +
            `\n       → khoảng ${nganSach} từ`
        )
        .join('\n');
      return (
        `  "${m}" — phần đời: ${k.chuDeCung[goc] ?? goc}\n` +
        `    Đọc từ ${goc}; đối chiếu ${TAM_HOP[goc].join(' và ')}; soi ngược qua ${GUONG[goc]}.\n` +
        `    Độ nổi bật ${diem.get(m)}/100.\n` +
        `    Câu hỏi phần này mở ra: ${chu?.cauHoi ?? ''}\n` +
        dong
      );
    })
    .join('\n\n');

  const khoiCachCuc = cachCuc.length
    ? cachCuc.map((c) => `- ${c.ten} (tại ${c.cung}) — ${c.dieuKien}`).join('\n')
    : '- (lá số này không có cách cục nào đủ điều kiện)';

  const laTatAch = mucIds.includes('tat-ach');

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, giọng bình tĩnh, nói với người đối diện chứ không giảng bài.

Đây là BẢN ĐỌC SÂU — tầng sâu nhất sản phẩm có. Bạn đang viết CHẶNG "${cauHinh.tieuDe}": ${cauHinh.subtitle}

BA PHẦN CỦA CHẶNG NÀY, kèm tiêu chí bắt buộc và ngân sách từ:

${khoiMuc}

CÁCH CỤC đọc được trên lá số này — gọi thẳng tên, đây là ngoại lệ được phép:
${khoiCachCuc}

VIẾT THEO THANG L1→L5. Đây là thứ phân biệt bản đọc sâu với bản tóm tắt:
  L1 KẾT LUẬN     điều đáng nói nhất là gì
  L2 BIỂU HIỆN    nó hiện ra thế nào trong một ngày thường
  L3 LỰC NGƯỢC    khi nào điều đó KHÔNG đúng, cái gì kéo ngược
  L4 CƠ CHẾ       vì sao cấu trúc này sinh ra điều đó
  L5 THỜI ĐIỂM    quãng nào kích hoạt, và làm gì với nó
Mỗi tiêu chí phải đi tới ÍT NHẤT L3. Dừng ở L2 là viết dài chứ không phải viết sâu.

LUỚNG NGƯỢC LÀ BẮT BUỘC, không phải tuỳ chọn.
Tiêu chí nào đi tới L3 trở lên đều phải có trường "luongNguoc" khác rỗng. Một
phần chỉ khen là một phần không dùng được, dù đọc dễ chịu.

KHỐI GƯƠNG — tiêu chí đánh dấu [KHỐI GƯƠNG] của mỗi phần:
Đọc phần này QUA cung đối diện, tức là nhìn từ phía ngược lại. Đây là chỗ bài
đọc thôi nói về một phần đời và bắt đầu nói về quan hệ giữa hai phần. Viết nó
như một góc nhìn ĐẢO, không phải một đoạn bổ sung.

${
  laTatAch
    ? `RÀNG BUỘC AN TOÀN cho phần "tat-ach":
Chỉ nói về NHỊP NĂNG LƯỢNG và XU HƯỚNG QUÁ TẢI, ở mức tham khảo.
CẤM chẩn đoán, CẤM định bệnh, CẤM nói về thọ yểu.
Nói "vùng cơ thể dễ phản ứng trước" như một XU HƯỚNG, không như một chẩn đoán.
Lời khuyên chỉ về thói quen và nhịp sinh hoạt, không bao giờ về thuốc.

`
    : ''
}${
    mucIds.includes('phu-mau')
      ? 'RÀNG BUỘC: phần "phu-mau" KHÔNG luận thọ yểu của cha mẹ.\n\n'
      : ''
  }${
    mucIds.includes('phu-the') || mucIds.includes('no-boc')
      ? 'RÀNG BUỘC: KHÔNG gắn tuổi hay mệnh cụ thể cho bạn đời hay bạn bè.\n\n'
      : ''
  }TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN: không dấu sao, không dấu thăng, không gạch dưới.
Chữ bạn viết đi thẳng ra màn hình, mọi ký hiệu đều hiện nguyên xi.

TUYỆT ĐỐI KHÔNG GỌI TÊN CUNG trong câu văn. Gọi thẳng phần đời: "phần tiền bạc",
"chuyện đôi lứa", "phần bên trong của bạn". Tên cách cục và tên sao thì được;
tên cung thì không, vì người đọc không tra được nó.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức
khoẻ, tiền bạc, pháp lý; lặp lại nguyên văn dữ kiện.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "muc": [
    {
      "id": "${thuTuMuc[0]}",
      "ketLuan": "1 câu, tối đa 28 từ, là KẾT LUẬN VỀ NGƯỜI ĐỌC — không phải tên chủ đề, không chứa tên cung",
      "tieuChi": [
        {
          "nhan": "chép đúng nhãn tiêu chí ở trên, không tự đổi",
          "noiDung": "văn chảy, đi tới ít nhất L3, đúng ngân sách từ đã ghi",
          "luongNguoc": "điều kéo ngược lại — bắt buộc, chỉ để rỗng nếu thật sự không có",
          "maDuKien": ["F002"]
        }
      ]
    }
  ],
  "doanKhau": "60-90 từ: BA PHẦN NÀY NÓI CÙNG ĐIỀU GÌ. Không nhắc lại từng phần, nói cái xuyên qua cả ba.",
  "cauBacCau": ${cauHinh.thuTu === 4 ? 'null' : '"1 câu dẫn sang chặng sau"'}
}

Đủ ba phần, đủ tiêu chí của từng phần, theo đúng thứ tự đã liệt kê ở trên.`;

  const user = dungKhoiChoPrompt(goi);
  const kq = await goiVoiFallback({ system, user, maxTokens: 10000 });

  const tho = docObjectJson(kq.text) as { muc?: ThoMuc[]; doanKhau?: unknown; cauBacCau?: unknown } | null;
  if (!tho || !Array.isArray(tho.muc)) {
    console.warn(
      `[ban-doc-sau] chặng ${vao.chang}: model không trả cấu trúc` +
        (laChuoiJson(kq.text) ? ' (JSON gãy, nhiều khả năng hết ngân sách token)' : '')
    );
    return null;
  }

  /** Bóc mã, bỏ câu ra lệnh, chặn sao không có trong dữ liệu */
  const sach = (x: unknown): string | null => {
    if (typeof x !== 'string') return null;
    const s = boMarkdown(
      x
        .replace(/\s*[([](?:\s*[FE]\d{3}\s*,?)+\s*[)\]]/g, '')
        .replace(/\b[FE]\d{3}\b/g, '')
        .replace(/\s+([.,;])/g, '$1')
    );
    if (s.length < 15) return null;
    /*
     * Bỏ câu ra lệnh VÀ câu phán quyết, giữ phần còn lại.
     *
     * Đo trên bài thật: một tiêu chí lọt chữ "bạn chắc chắn" làm cổng ngôn ngữ
     * đỏ cả bài gần bảy nghìn từ. Vứt cả bài vì một câu là mất rất nhiều thứ
     * đúng để trừng phạt một thứ sai — cùng lý lẽ đã dùng cho câu ra lệnh.
     */
    const khongLenh = boCauPhanQuyet(boCauRaLenh(s));
    if (khongLenh.length < 15) return null;
    const bia = nhanDangThucThe(khongLenh).filter(
      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !saoChoPhep.has(t.id)
    );
    return bia.length ? null : khongLenh;
  };

  const theoId = new Map(
    tho.muc
      .filter((m): m is ThoMuc & { id: string } => typeof m.id === 'string')
      .map((m) => [m.id, m])
  );

  const muc: MucSau[] = [];
  for (const id of thuTuMuc) {
    const chuan = TIEU_CHI_SAU[id];
    const t = theoId.get(id);
    const goc = CUNG_CUA_MUC[id];
    const chu = CHU_12_CUNG.vi[id];
    const d = diem.get(id) ?? 0;

    const nen = {
      id,
      chang: vao.chang,
      cungGoc: goc,
      cungTamHop: TAM_HOP[goc],
      cungGuong: GUONG[goc],
      guongNoiBo: laGuongNoiBo(id),
      doNoiBat: d,
      cauHoiGoiY: chu?.cauHoi ?? '',
    };

    const ketLuan = sach(t?.ketLuan);
    if (!t || !ketLuan) {
      console.warn(
        `[ban-doc-sau] ${id}: ${!t ? 'model không trả phần này' : 'câu kết luận bị lọc'}`
      );
      // Không bịa cho đủ. Giao diện hiện câu thành thật + nút thử lại.
      muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan: '', tieuChi: [], thieuCanCu: true });
      continue;
    }

    /*
     * Ghép theo NHÃN CHUẨN, không theo thứ tự model trả về.
     *
     * Model đổi thứ tự hoặc bỏ sót một tiêu chí là chuyện thường. Ghép theo thứ
     * tự thì một tiêu chí thiếu làm lệch hết phần còn lại, và cờ `laGuong` dán
     * vào nhầm đoạn — khối đảo màu khi đó nói về một thứ không phải gương.
     */
    const daTraVe = (t.tieuChi ?? []).filter((x) => typeof x.nhan === 'string');
    const traVe = new Map(daTraVe.map((x) => [chuanNhan(x.nhan as string), x]));

    /*
     * Ghép hai lượt: theo NHÃN trước, rồi theo VỊ TRÍ cho phần còn sót.
     *
     * Ghép chỉ theo nhãn thì quá chặt. Model hay viết lại nhãn đi một chút —
     * "Thân thiết và rộng rãi" thành "Thân thiết và sự rộng rãi" — và tiêu chí
     * ấy biến mất. Đo được: phần `huynh-de` rụng ở hai trong ba lượt chạy,
     * luôn vì mất đúng tiêu chí gương, mà mất gương thì cả phần bị loại.
     *
     * Lượt hai CHỈ chạy khi model trả đúng số tiêu chí. Đủ số thì thứ tự đáng
     * tin, vì prompt đã liệt kê theo thứ tự. Thiếu số thì không: lúc ấy ghép
     * theo vị trí sẽ dán cờ `laGuong` vào nhầm đoạn, và khối đảo màu nói về
     * một thứ không phải gương — tệ hơn hẳn việc thiếu một tiêu chí.
     */
    const duSo = daTraVe.length === chuan.length;

    const tieuChi: TieuChiRa[] = [];
    for (const [i, c] of chuan.entries()) {
      const x = traVe.get(chuanNhan(c.nhan)) ?? (duSo ? daTraVe[i] : undefined);
      const noiDung = sach(x?.noiDung);
      if (!noiDung) continue;
      const luongNguoc = sach(x?.luongNguoc);
      tieuChi.push({
        nhan: c.nhan,
        noiDung,
        laGuong: Boolean(c.laGuong),
        luongNguoc,
        maDuKien: Array.isArray(x?.maDuKien)
          ? (x!.maDuKien as unknown[]).filter((m): m is string => typeof m === 'string')
          : [],
        soTu: noiDung.trim().split(/\s+/).filter(Boolean).length,
      });
    }

    /*
     * Thiếu quá nửa tiêu chí, hoặc mất khối gương, thì coi như phần chưa dựng
     * được. Khối gương là điều kiện ship theo spec mục 10.14 — một phần không
     * có nó thì nó là bản tóm tắt viết dài, không phải bản đọc sâu.
     */
    if (tieuChi.length < Math.ceil(chuan.length / 2) || !tieuChi.some((x) => x.laGuong)) {
      console.warn(
        `[ban-doc-sau] ${id}: còn ${tieuChi.length}/${chuan.length} tiêu chí` +
          `${tieuChi.some((x) => x.laGuong) ? '' : ', MẤT KHỐI GƯƠNG'}` +
          ` — nhãn model trả: ${[...traVe.keys()].join(' | ')}`
      );
      muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan: '', tieuChi: [], thieuCanCu: true });
      continue;
    }

    muc.push({ ...nen, tieuDe: chu?.nhan ?? id, ketLuan, tieuChi });
  }

  const doanKhau = sach(tho.doanKhau) ?? '';
  const cauBacCau = cauHinh.thuTu === 4 ? null : sach(tho.cauBacCau);

  return {
    id: vao.chang,
    thuTu: cauHinh.thuTu,
    tieuDe: cauHinh.tieuDe,
    subtitle: cauHinh.subtitle,
    muc,
    doanKhau,
    cauBacCau,
  };
}

/**
 * Dựng cả bốn chặng.
 *
 * Chạy TUẦN TỰ, không song song. Bốn lượt song song thì cả bốn cùng đập vào
 * hạn mức nhà cung cấp, và lúc một cái bị 429 thì ba cái kia đã tiêu token rồi.
 * Tuần tự cũng là thứ cho phép phát từng chặng ra giao diện khi làm streaming.
 */
export async function sinhBanDocSau(vao: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
  banKhoan?: string;
  /** Gọi sau mỗi chặng, để lớp trên phát dần ra giao diện */
  khiXongChang?: (chang: ChangSau) => void;
}): Promise<BaiDocSau | null> {
  const chang: ChangSau[] = [];

  for (const id of THU_TU_CHANG) {
    const c = await dungChang({
      laSo: vao.laSo,
      chang: id,
      namXem: vao.namXem,
      thangXem: vao.thangXem,
      banKhoan: vao.banKhoan,
    });
    if (!c) continue;
    chang.push(c);
    vao.khiXongChang?.(c);
  }

  // Mất quá nửa số chặng thì bài không còn là một bài — để lớp gọi quyết
  if (chang.length < 2) return null;

  // Dọn tên cung và tiếng lóng một lượt cuối, như mọi bề mặt khác
  const tenChoSua = [...nhanDangCachCuc(vao.laSo).map((c) => c.ten)];
  for (const c of chang) {
    c.doanKhau = boMarkdown(doiTenCung(await suaCauTiengLong(c.doanKhau, tenChoSua)));
    if (c.cauBacCau) {
      c.cauBacCau = boMarkdown(doiTenCung(await suaCauTiengLong(c.cauBacCau, tenChoSua)));
    }
    for (const m of c.muc) {
      if (m.thieuCanCu) continue;
      m.ketLuan = boMarkdown(doiTenCung(m.ketLuan));
      for (const t of m.tieuChi) {
        t.noiDung = boMarkdown(doiTenCung(t.noiDung));
        if (t.luongNguoc) t.luongNguoc = boMarkdown(doiTenCung(t.luongNguoc));
      }
    }
  }

  return {
    mode: 'deep_read',
    chang,
    phienBan: {
      banDocSau: PHIEN_BAN_BAN_DOC_SAU,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}

/**
 * Sổ bao phủ — spec mục 10.20.
 *
 * Đếm chứ không tin: bài có thể đọc trôi chảy mà vẫn bỏ quên ba cung, và không
 * ai phát hiện ra bằng mắt.
 */
export function soBaoPhu(bai: BaiDocSau) {
  const mucDat = bai.chang.flatMap((c) => c.muc).filter((m) => !m.thieuCanCu);
  const soGuong = mucDat.filter((m) => m.tieuChi.some((t) => t.laGuong)).length;
  const ngoaiChang = mucDat.filter((m) =>
    [...m.cungTamHop, m.cungGuong].some((cung) => {
      const mucKhac = Object.entries(CUNG_CUA_MUC).find(([, c]) => c === cung)?.[0] as
        | MucId
        | undefined;
      return mucKhac ? CHANG_CUA_MUC[mucKhac] !== m.chang : false;
    })
  ).length;

  return {
    soMuc: mucDat.length,
    soChang: bai.chang.length,
    soGuong,
    phanCoThamChieuNgoaiChang: ngoaiChang,
    dat: mucDat.length === 12 && soGuong === 12 && ngoaiChang === 12,
  };
}

/** Soát ngôn ngữ trên toàn bài, để lớp gọi ghi vào trace */
export function soatBanDocSau(bai: BaiDocSau) {
  const van = bai.chang
    .flatMap((c) => [
      c.doanKhau,
      c.cauBacCau ?? '',
      ...c.muc.flatMap((m) => [m.ketLuan, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])]),
    ])
    .filter(Boolean)
    .join(' ');
  return soatNgonNgu(
    van,
    bai.chang.flatMap((c) => c.muc.map((m) => m.ketLuan)).filter(Boolean)
  );
}
