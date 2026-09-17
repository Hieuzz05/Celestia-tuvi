import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * payOS — chỉ gọi từ mã chạy phía máy chủ.
 *
 * API key và checksum key KHÔNG bao giờ được đi ra trình duyệt. Vì vậy tệp này
 * không có `'use client'`, không export hằng nào chứa khoá, và mọi hàm ở đây
 * chỉ được import từ route handler.
 */

const API = 'https://api-merchant.payos.vn/v2/payment-requests';

/**
 * `.trim()` không phải cho đẹp: dán khoá vào Vercel rất dễ lẫn một dấu cách
 * hoặc ký tự xuống dòng ở cuối. Checksum key thừa một ký tự thì MỌI chữ ký đều
 * sai, mà triệu chứng chỉ là payOS báo "webhook không hoạt động" — không có gì
 * chỉ ra nguyên nhân nằm ở khoảng trắng.
 */
function khoa() {
  return {
    clientId: process.env.PAYOS_CLIENT_ID?.trim() ?? '',
    apiKey: process.env.PAYOS_API_KEY?.trim() ?? '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY?.trim() ?? '',
  };
}

export const payosDaCauHinh = Boolean(
  khoa().clientId && khoa().apiKey && khoa().checksumKey
);

/** Độ dài khoá, dùng cho chẩn đoán — không lộ nội dung khoá */
export function nhanDangCauHinh() {
  const k = khoa();
  return {
    clientId: k.clientId.length,
    apiKey: k.apiKey.length,
    checksumKey: k.checksumKey.length,
    // Có khoảng trắng thừa trong biến gốc không?
    thuaKhoangTrang:
      (process.env.PAYOS_CLIENT_ID ?? '') !== k.clientId ||
      (process.env.PAYOS_API_KEY ?? '') !== k.apiKey ||
      (process.env.PAYOS_CHECKSUM_KEY ?? '') !== k.checksumKey,
  };
}

/**
 * Chữ ký của yêu cầu tạo đơn.
 *
 * payOS quy định đúng năm trường, xếp theo thứ tự chữ cái, nối bằng dấu &.
 * Sai thứ tự là chữ ký sai, và payOS chỉ trả về một mã lỗi chung — nên thứ tự
 * này cố định ở đây thay vì dựng động từ object.
 */
function kyTaoDon(d: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}) {
  const chuoi =
    `amount=${d.amount}&cancelUrl=${d.cancelUrl}&description=${d.description}` +
    `&orderCode=${d.orderCode}&returnUrl=${d.returnUrl}`;
  return createHmac('sha256', khoa().checksumKey).update(chuoi).digest('hex');
}

export interface DonPayos {
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  accountNumber?: string;
  accountName?: string;
  status: string;
}

export class LoiPayos extends Error {}

export async function taoDonPayos(d: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
}): Promise<DonPayos> {
  if (!payosDaCauHinh) throw new LoiPayos('Chưa cấu hình payOS');

  const { clientId, apiKey } = khoa();
  const body = {
    orderCode: d.orderCode,
    amount: d.amount,
    description: d.description,
    returnUrl: d.returnUrl,
    cancelUrl: d.cancelUrl,
    ...(d.expiredAt ? { expiredAt: d.expiredAt } : {}),
    signature: kyTaoDon(d),
  };

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { code?: string; desc?: string; data?: DonPayos };
  if (!res.ok || json.code !== '00' || !json.data) {
    throw new LoiPayos(json.desc ?? `payOS trả về ${res.status}`);
  }
  return json.data;
}

/**
 * Kiểm tra chữ ký webhook.
 *
 * Cách payOS ký: sắp khoá của `data` theo thứ tự chữ cái, nối thành
 * `k1=v1&k2=v2`, HMAC-SHA256 bằng checksum key. Mảng và object lồng được
 * chuyển thành JSON trước khi nối.
 *
 * So sánh bằng `timingSafeEqual`: so bằng `===` để lộ độ dài tiền tố khớp qua
 * thời gian chạy, đủ để dò dần ra chữ ký đúng.
 */
export function chuKyWebhookHopLe(data: unknown, signature: unknown): boolean {
  if (!payosDaCauHinh || typeof signature !== 'string' || !data || typeof data !== 'object') {
    return false;
  }

  // Ghép chuỗi đúng y bản tham chiếu của payOS: sắp khoá theo alphabet, bỏ
  // chính khoá `signature`, mảng thì JSON.stringify sau khi sắp khoá từng phần
  // tử, và coi cả chuỗi "undefined"/"null" là rỗng. Lệch một quy ước nhỏ ở đây
  // là chữ ký sai toàn bộ mà không có cách nào nhìn ra.
  const sapKhoa = (o: Record<string, unknown>) =>
    Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((ra, k) => {
        ra[k] = o[k];
        return ra;
      }, {});

  const obj = data as Record<string, unknown>;
  const chuoi = Object.keys(obj)
    .sort()
    .filter((k) => k !== 'signature')
    .map((k) => {
      let v = obj[k];
      if (Array.isArray(v)) {
        v = JSON.stringify(v.map((x) => (x && typeof x === 'object' ? sapKhoa(x as Record<string, unknown>) : x)));
      }
      if (v === null || v === undefined || v === 'undefined' || v === 'null') v = '';
      return `${k}=${v}`;
    })
    .join('&');

  const mong = createHmac('sha256', khoa().checksumKey).update(chuoi).digest('hex');
  const a = Buffer.from(mong, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Hỏi thẳng payOS xem một đơn đã trả chưa.
 *
 * Webhook là luồng chính, nhưng nó phụ thuộc vào việc khai đúng URL ở phía
 * payOS và vào việc gói tin tới được. Cả hai đều hỏng được mà không báo gì:
 * người dùng chuyển tiền xong, payOS báo thành công, còn Celestia thì vẫn thấy
 * đơn treo ở `pending` mãi.
 *
 * Nên trang thanh toán hỏi lại đường này mỗi lần nó hỏi trạng thái. Đây không
 * phải cách thay webhook — vẫn là payOS xác nhận, chỉ khác ở chỗ ta chủ động
 * hỏi thay vì chờ được báo.
 */
export async function docDonPayos(
  dinhDanh: string | number
): Promise<{ status: string; amount: number; reference?: string } | null> {
  if (!payosDaCauHinh) return null;
  const { clientId, apiKey } = khoa();

  const res = await fetch(`${API}/${dinhDanh}`, {
    headers: { 'x-client-id': clientId, 'x-api-key': apiKey },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    code?: string;
    data?: { status?: string; amountPaid?: number; amount?: number; transactions?: { reference?: string }[] };
  };
  if (json.code !== '00' || !json.data) return null;

  return {
    status: String(json.data.status ?? ''),
    // amountPaid là số tiền THỰC SỰ đã về; amount chỉ là số tiền yêu cầu
    amount: Number(json.data.amountPaid ?? json.data.amount ?? 0),
    reference: json.data.transactions?.[0]?.reference,
  };
}
