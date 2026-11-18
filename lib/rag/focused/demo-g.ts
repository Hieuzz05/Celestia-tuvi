/**
 * DEMO_G (thử, KHÔNG gộp): lượt biên tập tách khỏi lượt luận.
 *
 * Lượt luận (F) chịu trách nhiệm ĐÚNG; lượt này chỉ chịu trách nhiệm DỄ ĐỌC. Mã — không phải lời dặn —
 * giữ cho lượt biên tập không đổi nội dung: tên sao / cung / cách cục và mọi con số của bản biên tập
 * phải nằm trong bản nháp, validator cứng phải sạch, độ dài không tụt quá nửa. Trượt một điều là
 * trả lại bản nháp nguyên vẹn.
 */

import type { goiVoiFallback } from "@/lib/ai/fallback";
import { boMarkdown } from "../sua-chua";
import type { BanNhap } from "./hop-dong";
import { kiemBaTang, type NguCanhKiem } from "./kiem";
import { SYSTEM_BIEN_TAP, SYSTEM_BIEN_TAP_H } from "./demo-f";
import { chatLieuK, coDoanSaoGoc, LOI_DOAN_SAO_GOC, SYSTEM_BIEN_TAP_K } from "./demo-k";
import { quetTen } from "./quet-ten";

const SO = /\d+/gu;

function tapTen(s: string): Set<string> {
  return new Set(quetTen(s).map((t) => t.ten));
}

/**
 * Vòng 2: biên tập viên không biết loại câu nên tự thêm lời chọn hộ vào câu quyết định ("chưa phải lúc
 * đổi việc", "có thể cân nhắc mua") — nháp không có, regex CHON_HO không bắt hết. Báo loại câu cho nó
 * thay vì nới regex: không cấm đủ được mọi cách nói "nên".
 */
function loaiCau(khuon: string): string {
  if (khuon === "C" || khuon === "E")
    return "LOẠI CÂU: người hỏi đang cân một quyết định. Bài nháp đã để họ tự quyết; giữ đúng như vậy. Đoạn kết nêu những điều cần xem kỹ trước khi quyết, không nói nên hay không nên, không nói lúc nào là lúc hợp để làm.\n";
  return "";
}

export async function bienTapG(v: {
  ban: BanNhap;
  ctx: NguCanhKiem;
  cauHoi: string;
  goi: typeof goiVoiFallback;
}): Promise<{
  ban: BanNhap;
  vet: { dung: boolean; lyDo: string; nhap: string; ms: number };
}> {
  const nhap = v.ban.answer;
  const H = process.env.DEMO_H === "1";
  const K = process.env.DEMO_K === "1";
  const t0 = Date.now();
  const tra = (dung: boolean, lyDo: string, answer = nhap) => ({
    ban: dung ? { ...v.ban, answer } : v.ban,
    vet: { dung, lyDo, nhap, ms: Date.now() - t0 },
  });
  const thu = async (phanHoi: string) => {
    let ra: string;
    try {
      const kq = await v.goi(
        {
          system: K
            ? process.env.DEMO_DONG === '1'
              ? SYSTEM_BIEN_TAP_K.replace('- Kết luận của bài và mức độ của nó.', '- Kết luận của bài và mức độ của nó. Nháp nói năm này có thay đổi (đổi chỗ, đổi vai trò, đổi hướng…) thì bản biên tập vẫn nói điều đó ngay câu đầu, kèm tên sao lưu gây ra thay đổi ấy; tên sao đó nói một lần ở câu đầu rồi thôi, đoạn sau không kể lại. Ngược lại, nháp nói năm này đi tiếp hướng đang có thì bản biên tập giữ đúng như thế ở câu đầu; được giao thêm việc, thêm quyền trong hướng cũ là đi tiếp, không gọi đó là thay đổi. Nháp có đoạn nói thay đổi ấy mang hình dạng gì ở tuổi, chặng đời của người hỏi thì giữ ý đó (có thể gọt chữ), không viết lại thành bài chung cho mọi tuổi.')
              : SYSTEM_BIEN_TAP_K
            : H
              ? SYSTEM_BIEN_TAP_H
              : SYSTEM_BIEN_TAP,
          user: `CÂU NGƯỜI ĐỌC HỎI: ${v.cauHoi}\n${H ? loaiCau(v.ctx.phanLoai.khuon) : ""}${K ? chatLieuK(v.ctx.nghieng, nhap) : ""}\nBÀI NHÁP:\n${nhap}${phanHoi}`,
          maxTokens: 4000,
        },
        undefined,
        30_000,
      );
      ra = boMarkdown(kq.text.trim().replace(/^"|"$/g, ""));
    } catch (e) {
      return tra(false, `lỗi gọi: ${(e as Error).message.slice(0, 80)}`);
    }
    if (!ra) return tra(false, "rỗng");
    // Vòng K1: model chèn rác chữ Hán vào cuối bài ("娱乐登陆") và không mã kiểm nào bắt. Chặn mọi chữ
    // ngoài bảng Latin (gồm tiếng Việt) — đường thật cũng thiếu máy canh này.
    if (/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(ra))
      return tra(false, "chữ lạ");

    const tenNhap = tapTen(nhap);
    const tenLa = [...tapTen(ra)].filter((t) => !tenNhap.has(t));
    if (tenLa.length) return tra(false, `tên mới: ${tenLa.join(", ")}`);

    const soNhap = new Set(nhap.match(SO) ?? []);
    const soLa = (ra.match(SO) ?? []).filter((x) => !soNhap.has(x));
    if (soLa.length) return tra(false, `số mới: ${soLa.join(", ")}`);

    // "chiếu về" là dữ kiện vị trí, không phải câu chữ: bản biên tập không được làm rơi.
    if (H) {
      // H được bỏ tên (cách cục không kèm nghĩa), nên không đếm chữ "chiếu" được nữa. Luật đúng hơn:
      // tên nào trong nháp CHỈ xuất hiện ở câu có "chiếu" thì ở bản biên tập cũng chỉ được ở câu có "chiếu".
      const cau = (s: string) => s.split(/(?<=[.!?:;])\s+|\n+/u);
      const doiChieu = [...tapTen(ra)].filter(
        (t) =>
          cau(nhap)
            .filter((c) => c.includes(t))
            .every((c) => c.includes("chiếu")) &&
          cau(ra).some((c) => c.includes(t) && !c.includes("chiếu")),
      );
      if (doiChieu.length)
        return tra(false, `"chiếu về" thành "ở": ${doiChieu.join(", ")}`);
    } else {
      const chieu = (s: string) => (s.match(/chiếu/gu) ?? []).length;
      if (chieu(ra) < chieu(nhap))
        return tra(false, `mất "chiếu về" (${chieu(ra)}/${chieu(nhap)})`);
    }

    // Lớp hạn (lưu tinh, lưu Tứ Hóa) là phần chính của câu vận hạn: không được rơi.
    const luuNhap = quetTen(nhap)
      .filter((t) => t.loai === "luu" || t.loai === "luu-hoa")
      .map((t) => t.ten);
    const tenRa = tapTen(ra);
    const roi = luuNhap.filter((t) => !tenRa.has(t));
    if (roi.length) return tra(false, `rơi lớp hạn: ${roi.join(", ")}`);

    // DEMO_DONG v9: nháp đọc năm theo tuổi / chặng đại vận, biên tập xoá mất đoạn đó (C1 lần 2) dù luật dặn
    // giữ — bài thành chung cho mọi tuổi. Dặn bằng chữ đã thử, không đủ: bắt bằng mã.
    const tuoiChang = /tuổi|chặng|đại vận/u;
    if (process.env.DEMO_DONG === "1" && tuoiChang.test(nhap) && !tuoiChang.test(ra))
      return tra(false, "mất đoạn đọc theo tuổi, chặng đời của người hỏi");

    // v16: hỏi năm/tháng mà bài vẫn có cả đoạn tả sao gốc (khối dữ kiện đã tách riêng và dặn, còn 4/8).
    if (K && coDoanSaoGoc(v.ctx.nghieng, ra)) return tra(false, LOI_DOAN_SAO_GOC);

    if (ra.length < nhap.length * 0.5)
      return tra(false, `ngắn quá (${ra.length}/${nhap.length})`);

    const { chan } = kiemBaTang({ ...v.ban, answer: ra }, v.ctx);
    if (chan.length)
      return tra(false, `validator: ${chan.map((l) => l.ma).join(",")}`);

    return tra(true, "đạt", ra);
  };
  const lan1 = await thu("");
  // Vòng K2: 4/11 bài bị trả về vì một lỗi máy (rơi một sao lưu, thêm tên) và bản nháp thô — chính bản có
  // "giữ được nền" — đi thẳng ra người đọc. Lỗi máy thì nói đúng lỗi và cho sửa một lần; lỗi gọi thì thôi.
  if (!K || lan1.vet.dung || /^(lỗi gọi|rỗng)/u.test(lan1.vet.lyDo))
    return lan1;
  const lan2 = await thu(
    `\n\nBẢN BIÊN TẬP TRƯỚC BỊ TRẢ VỀ VÌ: ${lan1.vet.lyDo}. Viết lại từ bài nháp, sửa đúng chỗ đó (tên bị rơi thì giữ lại cùng nghĩa của nó; tên mới thì bỏ).`,
  );
  return {
    ban: lan2.ban,
    vet: { ...lan2.vet, lyDo: `lần 2 (${lan1.vet.lyDo}): ${lan2.vet.lyDo}` },
  };
}
