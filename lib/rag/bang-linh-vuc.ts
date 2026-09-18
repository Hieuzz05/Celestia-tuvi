import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import type { LinhVucId } from '@/lib/tuvi/luan-giai-sau';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung } from './boi-canh-la-so';
import { boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { suaCauKeSao } from './sua-chua';
import { lapKeHoach } from './planner';
import { nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';

/**
 * Bảng luận giải 8 lĩnh vực của trang Lá số, do model viết.
 *
 * Bản trước là chữ tất định: mỗi dữ kiện một câu, ghép theo một thứ tự cố định.
 * Viết lại khuôn câu làm nó đỡ lộ bộ xương, nhưng không đổi được bản chất — tám
 * khối vẫn là tám lần chạy cùng một hàm, nên vẫn cùng một hình.
 *
 * §11.2 của khung luận đòi đúng thứ mà template không làm được: "Không để 8
 * domain thành 8 template giống nhau. Thứ tự và độ dài có thể khác dựa trên mức
 * độ nổi bật của domain." Độ nổi bật là một phán đoán, không phải một phép đếm.
 *
 * MỘT lượt gọi cho cả tám lĩnh vực, không phải tám lượt.
 *
 * Tám lượt cho một lần mở trang là hỏng ở ba mặt cùng lúc: cạn hạn mức ngày sau
 * hai người dùng, tám lần trả tiền cho cùng một lá số, và tám bài không biết
 * nhau nên lặp ý chéo. Một lượt thì model nhìn cả tám cùng lúc và tự phân bổ
 * được chỗ nào đáng nói dài.
 *
 * Căn cứ ("Muốn biết vì sao không?") KHÔNG lấy từ model: nó vẫn do engine tất
 * định dựng từ cung và sao. Model viết nhận định, luật giữ phần chứng minh.
 */

export const PHIEN_BAN_BANG_LINH_VUC = '2026.09.1';

/** Cung cần có mặt trong dữ kiện để tám lĩnh vực đều có cái mà đọc */
const CUNG_CAN_CO = [
  'Mệnh',
  'Quan Lộc',
  'Tài Bạch',
  'Phu Thê',
  'Phụ Mẫu',
  'Nô Bộc',
  'Phúc Đức',
  'Thiên Di',
];

const NHAN_LINH_VUC: Record<LinhVucId, string> = {
  'tinh-cach': 'Tính cách — khí chất và cách phản ứng',
  'cong-viec': 'Công việc — môi trường nào phát huy được',
  'tai-loc': 'Tài lộc — cách tạo ra và giữ nguồn lực',
  'tinh-duyen': 'Tình duyên — cách gắn kết với một người',
  'gia-dao': 'Gia đạo — vai trò thường đảm nhận trong nhà',
  'quan-he': 'Quan hệ xã hội — cách đứng giữa những người xung quanh',
  'van-han': 'Giai đoạn hiện tại — nhịp đang đi qua',
  'phat-trien': 'Phát triển — chỗ đáng rèn nếu muốn đi xa hơn',
};

export interface KhoiAi {
  id: LinhVucId;
  ketLuan: string;
  doan: string[];
}

interface ThoKhoi {
  id?: unknown;
  ketLuan?: unknown;
  bieuHien?: unknown;
  matThuan?: unknown;
  deMac?: unknown;
  dangCanNhac?: unknown;
}

export async function sinhBangLinhVuc(vao: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
}): Promise<{
  noiDung: KhoiAi[];
  provider: string;
  model: string;
  phienBan: Record<string, string>;
} | null> {
  const cauHoi = 'Đọc toàn bộ lá số theo tám lĩnh vực đời sống';
  const keHoachGoc = lapKeHoach({ cauHoi, saoTheoCung: saoChinhTheoCung(vao.laSo) });
  const keHoach = {
    ...keHoachGoc,
    chuDe: 'tong-quan' as const,
    cungLienQuan: [...new Set([...CUNG_CAN_CO, ...keHoachGoc.cungLienQuan])],
    lopHan: (['ban-menh', 'dai-van', 'luu-nien'] as const).slice(),
  };

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  });
  const kqTruyHoi = await truyHoi(keHoach, { soCuoi: 8 });
  const goi = dungGoiBangChung(cauHoi, keHoach, duKien, kqTruyHoi.daChon);

  const saoChoPhep = new Set(
    nhanDangThucThe(
      [...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')
    ).map((t) => t.id)
  );

  const danhSach = (Object.keys(NHAN_LINH_VUC) as LinhVucId[])
    .map((id) => `  "${id}": ${NHAN_LINH_VUC[id]}`)
    .join('\n');

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, giọng bình tĩnh, nói với người đối diện chứ không giảng bài.

Đây là BẢNG TÁM LĨNH VỰC của một lá số. Tám lĩnh vực:
${danhSach}

CẤU TRÚC MỖI LĨNH VỰC (§11.2): kết luận → biểu hiện → mặt thuận → điểm dễ mắc → điều đáng cân nhắc.

ĐIỀU QUAN TRỌNG NHẤT: TÁM LĨNH VỰC KHÔNG ĐƯỢC GIỐNG NHAU VỀ HÌNH.
- Lĩnh vực nào lá số nói mạnh thì viết dài và cụ thể. Lĩnh vực nào dữ kiện mỏng thì viết NGẮN, bỏ bớt trường, và nói thẳng là chỗ này lá số nói ít.
- Ít nhất HAI lĩnh vực phải ngắn rõ rệt so với phần còn lại. Tám khối dài bằng nhau là tám khối sai.
- "matThuan" và "dangCanNhac" được phép bỏ trống khi không có gì đáng nói. Đừng điền cho đủ ô.
- KHÔNG HAI KẾT LUẬN NÀO ĐƯỢC BẮT ĐẦU BẰNG CÙNG BA TỪ. Luật đếm được, không phải lời khuyên.
- Xoay vòng kiểu mở đầu của kết luận: khi thì bắt đầu bằng hành vi ("Bạn đo mọi thứ bằng…"), khi thì bằng hệ quả ("Chỗ này hay đến muộn…"), khi thì bằng điều kiện ("Khi được giao quyền…"), khi thì bằng chính chỗ vướng ("Điều làm bạn mệt ở đây…"). Cấm mở cả tám bằng "Một nét…" hay "Bạn có…".

ĐIỀU KIỆN ĐỂ MỘT CÂU KẾT LUẬN ĐƯỢC CHẤP NHẬN:
Nó phải nói CƠ CHẾ, tức là cấu trúc nào tạo ra hệ quả nào trong đời sống. Một tính từ về người thì không phải kết luận.
- HỎNG: "Bạn điềm tĩnh và thông minh trong cách ứng xử." — ai đọc cũng gật, không đến từ lá số nào.
- HỎNG: "Bạn dễ gần và tạo được sự thân thiện." — không có cơ chế, không có hệ quả.
- ĐƯỢC: "Bạn đo mọi thứ bằng kết quả đếm được, nên hợp việc có chỉ tiêu rõ và rất mệt ở việc phải chiều nhiều bên cùng lúc."
- ĐƯỢC: "Phần đời này của bạn hay đến muộn: thường phải qua một quãng chệch nhịp rồi mới thấy mình thật sự muốn gì."

CẤM các tính từ chung chung làm nội dung chính: thông minh, hòa nhã, thân thiện, chân thành, tận tâm, cẩn trọng, mạnh mẽ, nhạy cảm, sâu sắc, đặc biệt. Dùng chúng thì phải kèm ngay một hệ quả cụ thể, bằng không bỏ hẳn câu.

BỐN NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN LÁ SỐ (mã F###) — do engine tính. Bất khả xâm phạm.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết Tử Vi. Mọi khẳng định chuyên môn dựa vào đây.
3. Kiến thức chung của bạn — chỉ cho ngôn ngữ đời thường, KHÔNG thay cho mục 2.

BA LUẬT CỨNG VỀ TÊN SAO VÀ MÃ:
- KHÔNG chép lại danh sách sao từ dữ kiện. "Cung này có A, B, C" là chép, không phải luận.
- Tối đa HAI tên sao trong một câu, và chỉ khi nó giải thích được điều vừa nói bằng lời thường.
- Mã F###/E### CHỈ nằm trong "maDuKien"/"maNguon". Tuyệt đối không viết vào câu văn.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức khoẻ, tiền bạc, pháp lý; lặp lại nguyên văn dữ kiện.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không lời dẫn:
{
  "linhVuc": [
    {
      "id": "tinh-cach",
      "ketLuan": "1 câu nói thẳng điều đáng chú ý nhất ở lĩnh vực này, cụ thể cho lá số này",
      "bieuHien": "1-3 câu: nó hiện ra thế nào trong đời sống thường ngày",
      "matThuan": "1-2 câu: chỗ nó đang đỡ được cho người này. Bỏ trống nếu không có gì đáng nói.",
      "deMac": "1-2 câu: chỗ dễ mắc kẹt, và khi nào nó lộ ra",
      "dangCanNhac": "1 câu: điều đáng cân nhắc, hoặc một câu hỏi phản chiếu. Bỏ trống nếu lĩnh vực này mỏng.",
      "maDuKien": ["F002"],
      "maNguon": []
    }
  ]
}

Đủ cả tám id, theo thứ tự lĩnh vực nào nổi bật nhất ở lá số này thì đứng trước.`;

  const user = [
    dungKhoiChoPrompt(goi),
    kqTruyHoi.daChon.length
      ? ''
      : '\nLƯU Ý: không có nguồn tham chiếu nào. Chỉ mô tả điều dữ kiện lá số nói, và nêu rõ phần học thuyết chưa có căn cứ.',
  ].join('\n');

  const kq = await goiVoiFallback({ system, user, maxTokens: 8000 });
  const tho = docObjectJson(kq.text);
  const mang = Array.isArray((tho as { linhVuc?: unknown } | null)?.linhVuc)
    ? ((tho as { linhVuc: unknown[] }).linhVuc as ThoKhoi[])
    : null;
  if (!mang) {
    console.warn('[bang-linh-vuc] model không trả về mảng linhVuc');
    return null;
  }

  /** Bóc mã khỏi câu, và bỏ câu nhắc sao không có trong dữ liệu */
  const sach = (x: unknown): string | null => {
    if (typeof x !== 'string') return null;
    const s = x
      .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
      .replace(/\b[FE]\d{3}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;])/g, '$1')
      .trim();
    if (s.length < 12) return null;

    // Celes mô tả và nêu điều đáng cân nhắc, không ra lệnh cho người đọc. Bỏ
    // đúng câu sai vai, không bỏ cả khối — một lỗi giọng không được phép làm
    // hỏng một khối còn lại vẫn đúng.
    const khongLenh = boCauRaLenh(s);
    if (khongLenh.length < 12) return null;

    const bia = nhanDangThucThe(khongLenh).filter(
      (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !saoChoPhep.has(t.id)
    );
    return bia.length ? null : khongLenh;
  };

  const hopLe = new Set(Object.keys(NHAN_LINH_VUC));
  const ra: KhoiAi[] = [];
  for (const k of mang) {
    const id = typeof k.id === 'string' && hopLe.has(k.id) ? (k.id as LinhVucId) : null;
    const ketLuan = sach(k.ketLuan);
    if (!id || !ketLuan || ra.some((x) => x.id === id)) continue;

    // Mặt thuận mà không có chỗ dễ mắc là vi phạm luật counterweight §5.3 — một
    // khối chỉ khen là khối không dùng được, dù đọc dễ chịu.
    const deMac = sach(k.deMac);
    if (!deMac) continue;

    const doan = [sach(k.bieuHien), sach(k.matThuan), deMac, sach(k.dangCanNhac)].filter(
      (x): x is string => Boolean(x)
    );
    if (doan.length < 2) continue;

    ra.push({ id, ketLuan, doan });
  }

  // Thiếu quá nửa thì đừng vá víu: trả null để lớp gọi lùi hẳn về bản tất định,
  // thay vì hiện một bảng nửa AI nửa template với hai giọng khác nhau.
  if (ra.length < 5) {
    console.warn('[bang-linh-vuc] chỉ dựng được', ra.length, 'lĩnh vực — lùi về bản tất định');
    return null;
  }

  /*
   * Sửa những câu kê sao trước khi qua cổng.
   *
   * Gom cả bảng vào một lần gọi: tám lĩnh vực mà sửa riêng từng câu là tám lượt
   * cho một thứ vốn chỉ tốn một. Không có câu nào phạm thì hàm không gọi model.
   */
  const phang: Record<string, string> = {};
  ra.forEach((k, i) => {
    phang[`k${i}`] = [k.ketLuan, ...k.doan].join(' ');
  });
  const daSua = await suaCauKeSao(phang);
  if (daSua !== phang) {
    ra.forEach((k, i) => {
      const cs = daSua[`k${i}`]?.split(/(?<=[.!?])\s+/).filter((c) => c.trim()) ?? [];
      if (cs.length) {
        k.ketLuan = cs[0];
        k.doan = cs.slice(1);
      }
    });
  }

  const gate = soatNgonNgu(
    ra.flatMap((k) => [k.ketLuan, ...k.doan]).join(' '),
    ra.map((k) => k.ketLuan)
  );
  if (!gate.dat) {
    console.warn('[bang-linh-vuc] không qua cổng ngôn ngữ', gate.loi.map((l) => `${l.mucDo}:${l.ma}`));
    return null;
  }

  return {
    noiDung: ra,
    provider: kq.provider,
    model: kq.model,
    phienBan: {
      bangLinhVuc: PHIEN_BAN_BANG_LINH_VUC,
      planner: keHoach.phienBan,
      truyHoi: kqTruyHoi.phienBan,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}
