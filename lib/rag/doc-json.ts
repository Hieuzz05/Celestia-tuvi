/**
 * Đọc object JSON từ câu trả lời của model, chịu được vài kiểu hỏng quen thuộc.
 *
 * Ba bề mặt có AI đều bắt model trả JSON, và cả ba trước đây đều dùng một đoạn
 * `JSON.parse` riêng, hỏng là trả null. Điều đó tưởng an toàn nhưng rất đắt: đo
 * ngày 18/09/2026 trên gpt-5.4-mini, model viết đúng một bài 1561 từ vừa sâu vừa
 * đủ căn cứ, rồi đóng object sau mục "giaiDoan" và mở object mới cho phần còn
 * lại — `{...},{"ghepLai": ...}`. Nội dung không sai một chữ; chỉ sai một dấu
 * ngoặc. Cả bài bị vứt, và người đọc nhận về một khối JSON thô.
 *
 * Nên gom về một chỗ: sửa được ở đây thì cả ba bề mặt cùng được, thay vì phải
 * nhớ ra ba tệp mỗi lần gặp một kiểu hỏng mới.
 *
 * Cố ý KHÔNG vá kiểu đoán nội dung (tự đóng ngoặc thiếu, tự thêm dấu phẩy). Vá
 * kiểu đó dựng ra những object nửa vời trông như thật, và lớp kiểm duyệt phía
 * sau sẽ kiểm một thứ mà model chưa từng nói. Chỉ gộp những mảnh mà chính model
 * đã viết trọn vẹn.
 */

function thuDoc(x: string): unknown {
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

export function docObjectJson(text: string): Record<string, unknown> | null {
  const sach = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const dau = sach.indexOf('{');
  const cuoi = sach.lastIndexOf('}');
  if (dau === -1 || cuoi <= dau) return null;
  const than = sach.slice(dau, cuoi + 1);

  const mot = thuDoc(than);
  if (mot && typeof mot === 'object' && !Array.isArray(mot)) {
    return mot as Record<string, unknown>;
  }

  // Model đóng ngoặc sớm rồi viết tiếp bằng một object mới: bọc thành mảng thì
  // cả chuỗi lại hợp lệ. Gộp theo thứ tự xuất hiện, khoá sau đè khoá trước.
  const nhieu = thuDoc(`[${than}]`);
  if (Array.isArray(nhieu)) {
    const gop = nhieu.reduce<Record<string, unknown>>(
      (t, x) => (x && typeof x === 'object' && !Array.isArray(x) ? { ...t, ...(x as object) } : t),
      {}
    );
    if (Object.keys(gop).length) return gop;
  }

  return null;
}

/**
 * Chuỗi này có phải JSON (hoặc JSON gãy) không.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN, VÀ VÌ SAO NÓ Ở ĐÂY
 *
 * Mọi bề mặt AI đều theo cùng một hình: gọi model → `docObjectJson` → không đọc
 * được thì có một đường lùi. Đường lùi của màn chat là trả thẳng `kq.text` cho
 * người đọc, với lý lẽ "thà có chữ còn hơn không có gì".
 *
 * Lý lẽ ấy đúng khi model trả về VĂN XUÔI không đúng khuôn. Nó sai hoàn toàn
 * khi model trả về JSON bị cắt giữa chừng — và người dùng nhận về nguyên màn
 * hình `{ "ketLuan": "…", "tomTat": "…", "yChinh": [` với dấu ngoặc và dấu
 * phẩy. Đó không phải "có chữ", đó là sản phẩm trông như vỡ ở tầng sâu.
 *
 * Đặt ở đây, cạnh `docObjectJson`, vì hai hàm này là hai nửa của cùng một câu
 * hỏi: đọc được không, và nếu không thì thứ đọc không được ấy là cái gì. Để
 * mỗi bề mặt tự viết lấy thì bề mặt viết sau sẽ quên, như đã quên một lần.
 *
 * Nhận diện bằng hai dấu hiệu, chỉ cần một là đủ:
 *   - mở đầu bằng `{` hoặc `[`, kể cả sau rào ```json
 *   - có khoá dạng `"tên":` ở phần đầu chuỗi
 */
export function laChuoiJson(text: string): boolean {
  const s = text.trim().replace(/^```(?:json)?\s*/i, '');
  return /^[{[]/.test(s) || /"[a-zA-Z_][\w-]*"\s*:/.test(s.slice(0, 400));
}
