/**
 * ORACLE TÊN ĐỘC LẬP — CEL-186 final hardening (04/10/2026), invariant GROUND-04.
 *
 * Trả lời "model được thấy những tên nào trong lượt này" bằng cách RENDER prompt
 * thật (`dungPromptFocused`) rồi quét tên trên chữ in ra. Cố ý KHÔNG gọi
 * `tenDuocGoiTrongLuot` / `nghiengHienThi`: guard đọc hai hàm đó, nên một oracle
 * dựng từ chúng sẽ tự xác nhận cùng một nguồn sai (bài học 04/10: bộ đo báo 0
 * tên ngoài gói trong khi Phá Toái, Thiên Y lọt qua d.sao).
 *
 * Dòng giống hệt bản render chỉ có khung (gói rỗng, không khối nghiêng) là chữ
 * luật — tên ví dụ trong luật không cấp quyền gọi — nên trừ đi theo bội số dòng.
 * Câu hỏi chỉ được tính khi người dùng tra cứu đích danh (`tra-cuu`).
 *
 * Dùng chung cho scripts/test-focused.ts (CI) và scripts/eval-focused.ts (đo).
 */

import { dungPromptFocused, type DauVaoPromptFocused } from '../lib/rag/focused/prompt';
import { goiCoPhucDuc, khoaTen, quetTen, TEN_GHEP } from '../lib/rag/focused/quet-ten';

const GIU_CHO = '<<CAU_HOI>>';

/** Tên (khoá) trong một đoạn chữ: từ điển quét + cách cục in nguyên văn. */
export function tenTrongChu(chu: string, phucDuc: boolean): Set<string> {
  const ra = new Set<string>();
  for (const t of quetTen(chu, phucDuc)) if (t.loai !== 'cung' && t.loai !== 'luu-hoa') ra.add(khoaTen(t.ten));
  // Cách cục chưa chắc có trong từ điển quét: đọc thẳng hai lối prompt in nó ra.
  for (const m of chu.matchAll(/Cách cục đọc được ở phần này: ([^.\n]+)\./gu)) for (const c of m[1].split(', ')) ra.add(khoaTen(c));
  for (const m of chu.matchAll(/Cách cục (.+?) tại /gu)) ra.add(khoaTen(m[1]));
  return ra;
}

/** Tập tên model thấy trong prompt của lượt — KHÔNG đi qua hàm guard dùng. */
export function tenModelThay(p: DauVaoPromptFocused, traCuu: boolean): Set<string> {
  const phucDuc = goiCoPhucDuc(p.goi.duKien);
  const chung = { cauHoiGoc: GIU_CHO, lichSu: [], daNoiTruoc: [], lyDoThuLai: undefined };
  const day = dungPromptFocused({ ...p, ...chung });
  const khung = dungPromptFocused({ ...p, ...chung, nghieng: null, goi: { ...p.goi, duKien: [], bangChung: [] } });
  const conLai = new Map<string, number>();
  for (const l of `${khung.system}\n${khung.user}`.split('\n')) conLai.set(l, (conLai.get(l) ?? 0) + 1);
  const rieng: string[] = [];
  for (const l of `${day.system}\n${day.user}`.split('\n')) {
    const n = conLai.get(l) ?? 0;
    if (n > 0) conLai.set(l, n - 1);
    else rieng.push(l);
  }
  const ra = tenTrongChu(rieng.join('\n'), phucDuc);
  if (traCuu) for (const t of tenTrongChu(p.cauHoiGoc, phucDuc)) ra.add(t);
  return ra;
}

/**
 * Thước đo "tên ngoài gói" của eval (mục G): tên trong lời model không nằm trong
 * chữ prompt đã in. Tên ghép (Tả Hữu…) đi khi cả hai sao thành phần đều được thấy.
 */
export function tenNgoaiModelThay(cau: readonly string[], p: DauVaoPromptFocused, traCuu: boolean): string[] {
  const thay = tenModelThay(p, traCuu);
  const phucDuc = goiCoPhucDuc(p.goi.duKien);
  const ra: string[] = [];
  for (const c of cau)
    for (const t of quetTen(c, phucDuc)) {
      if (t.loai === 'cung') continue;
      if (t.loai === 'luu-hoa') ra.push(t.ten);
      else if (!thay.has(khoaTen(t.ten)) && !(t.loai === 'ghep' && (TEN_GHEP[t.ten] ?? []).length > 0 && TEN_GHEP[t.ten].every((x) => thay.has(khoaTen(x)))))
        ra.push(t.ten);
    }
  return ra;
}
