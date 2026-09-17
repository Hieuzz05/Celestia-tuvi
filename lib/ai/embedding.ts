import { layApiKey } from './config';
import { AiRetryableError } from './types';

/**
 * Sinh vector ngữ nghĩa bằng Gemini embedding (nằm trong tier miễn phí).
 * Số chiều 768 phải khớp với cột `vector(768)` trong schema-rag.sql — đổi ở đây
 * thì phải đổi cả bảng, nên để thành hằng số dùng chung.
 */
export const SO_CHIEU_VECTOR = 768;
const MODEL_EMBEDDING = 'gemini-embedding-001';

/** taskType giúp Gemini tối ưu vector cho đúng mục đích dùng */
type MucDich = 'luu-tru' | 'truy-van';

async function goiEmbedding(text: string, mucDich: MucDich): Promise<number[]> {
  const apiKey = layApiKey('gemini');
  if (!apiKey) {
    throw new Error(
      'Kho tri thức cần GEMINI_API_KEY để sinh vector. Thêm key rồi thử lại.'
    );
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_EMBEDDING}:embedContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        content: { parts: [{ text }], role: 'user' },
        outputDimensionality: SO_CHIEU_VECTOR,
        taskType: mucDich === 'truy-van' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new AiRetryableError(`Embedding vượt hạn mức: ${body.slice(0, 200)}`, 'rate-limit', 429);
    }
    throw new Error(`Embedding lỗi ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const values: number[] = data.embedding?.values ?? [];
  if (values.length !== SO_CHIEU_VECTOR) {
    throw new Error(`Embedding trả về ${values.length} chiều, cần ${SO_CHIEU_VECTOR}`);
  }
  return values;
}

export const embedTaiLieu = (text: string) => goiEmbedding(text, 'luu-tru');
export const embedTruyVan = (text: string) => goiEmbedding(text, 'truy-van');

/**
 * Số đoạn mỗi lần gọi `batchEmbedContents`.
 *
 * Gemini cho tối đa 100 request một lô, nhưng còn một trần token cho cả lô mà
 * tài liệu không ghi con số. Để 45 là còn biên an toàn; nếu vẫn vượt thì `goiLo`
 * tự chẻ đôi nên đặt cao hơn cũng không vỡ.
 */
const KICH_THUOC_LO = Number(process.env.EMBEDDING_BATCH_SIZE ?? 45);

/**
 * Hạn mức đã chạm, kèm số giây nhà cung cấp bảo phải chờ.
 *
 * Tách riêng khỏi lỗi thường vì đây KHÔNG phải hỏng hóc — nó là áp lực ngược.
 * Coi nó là lỗi thì tài liệu bị đánh dấu "thất bại" chỉ vì nạp hơi nhanh, và
 * người vận hành đi tìm một cái bug không tồn tại.
 */
export class LoiHanMucEmbed extends Error {
  constructor(
    public readonly choGiay: number,
    /** Hạn mức theo NGÀY đã cạn — chờ thêm vô ích, phải sang hôm sau */
    public readonly hetNgay = false
  ) {
    super(
      hetNgay
        ? 'Đã cạn hạn mức embedding của cả ngày'
        : `Đã chạm hạn mức embedding, cần chờ ${choGiay} giây`
    );
    this.name = 'LoiHanMucEmbed';
  }
}

/**
 * Đọc thân lỗi 429 của Gemini.
 *
 * Phải phân biệt hai loại hạn mức, vì cách xử khác hẳn nhau:
 *   - Theo PHÚT (100 đoạn): chờ vài chục giây rồi chạy tiếp.
 *   - Theo NGÀY (1.000 đoạn): chờ bao lâu cũng vô ích, phải sang hôm sau.
 *
 * Gemini trả cùng mã 429 và cùng câu "Please retry in Ns" cho cả hai, kể cả khi
 * hạn mức ngày đã cạn — bám vào câu đó thì hệ thống sẽ ngồi chờ đến sáng. Dấu
 * hiệu tin được nằm ở `quotaId`.
 */
function docHanMuc(than: string): { giay: number; hetNgay: boolean } {
  const m = than.match(/retry in ([\d.]+)s/i);
  return {
    giay: m ? Math.ceil(Number(m[1])) : 60,
    hetNgay: /PerDay/i.test(than),
  };
}

async function goiLo(lo: string[], apiKey: string, lanThu = 0): Promise<number[][]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_EMBEDDING}:batchEmbedContents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        // Tên model phải lặp lại trong TỪNG request của lô, kèm tiền tố "models/"
        requests: lo.map((text) => ({
          model: `models/${MODEL_EMBEDDING}`,
          content: { parts: [{ text }], role: 'user' },
          outputDimensionality: SO_CHIEU_VECTOR,
          taskType: 'RETRIEVAL_DOCUMENT',
        })),
      }),
    }
  );

  // Hạn mức free tier đo được: 100 ĐOẠN mỗi phút, và mỗi phần tử trong lô tính
  // là một request. Gộp lô giảm số lần đi về nhưng không nâng thông lượng —
  // nạp một cuốn 1.134 đoạn không thể nhanh hơn ~12 phút, dù chia thế nào.
  //
  // Vì vậy không ngồi chờ trong request: Gemini bảo chờ 46 giây thì ngủ chừng ấy
  // là gần hết trần thời gian của Vercel. Ném ra ngoài để tầng gọi lưu phần đã
  // làm được rồi hẹn client quay lại.
  if (res.status === 429) {
    const than = await res.text().catch(() => '');
    const { giay, hetNgay } = docHanMuc(than);
    throw new LoiHanMucEmbed(giay, hetNgay);
  }

  // Lỗi phía máy chủ thì thử lại tại chỗ — chúng thường chỉ chớp nhoáng.
  if (res.status >= 500) {
    if (lanThu >= 3) {
      throw new AiRetryableError('Nhà cung cấp embedding lỗi sau 3 lần thử', 'server', res.status);
    }
    await new Promise((r) => setTimeout(r, 2 ** lanThu * 1000));
    return goiLo(lo, apiKey, lanThu + 1);
  }

  // 400 với lô nhiều phần tử gần như luôn là vượt trần token của cả lô. Chẻ đôi
  // rẻ hơn nhiều so với bắt người vận hành tự đoán kích thước lô phù hợp.
  if (res.status === 400 && lo.length > 1) {
    const giua = Math.floor(lo.length / 2);
    return [
      ...(await goiLo(lo.slice(0, giua), apiKey)),
      ...(await goiLo(lo.slice(giua), apiKey)),
    ];
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Embedding lỗi ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const emb: number[][] = (data.embeddings ?? []).map((e: { values: number[] }) => e.values);

  // Thứ tự vector khớp thứ tự request. Lệch số lượng nghĩa là vector bị ghép vào
  // sai đoạn — sai lặng lẽ, không lỗi nào báo, và chỉ lộ ra ở chất lượng truy hồi
  // hàng tháng sau. Chặn ngay tại đây.
  if (emb.length !== lo.length) {
    throw new Error(`batchEmbedContents trả ${emb.length} vector cho ${lo.length} đoạn`);
  }
  for (const v of emb) {
    if (v.length !== SO_CHIEU_VECTOR) {
      throw new Error(`Embedding trả về ${v.length} chiều, cần ${SO_CHIEU_VECTOR}`);
    }
  }
  return emb;
}

export interface KetQuaLoEmbed {
  /** Có thể NGẮN HƠN `doans` khi chạm hạn mức giữa chừng */
  vectors: number[][];
  /** Số giây cần chờ trước khi gọi tiếp; không có nghĩa là đã xong hết */
  choGiay?: number;
  /** Hạn mức theo ngày đã cạn — dừng hẳn, mai nạp tiếp */
  hetNgay?: boolean;
}

/**
 * Embed nhiều đoạn bằng `batchEmbedContents`.
 *
 * Trả về phần làm được kèm lời hẹn, thay vì ném lỗi khi chạm hạn mức. Ném lỗi
 * là vứt luôn những vector đã trả tiền quota để lấy — lô đầu thành công rồi lô
 * hai bị chặn thì 45 đoạn kia phải được giữ lại.
 */
export async function embedLoTaiLieu(doans: string[]): Promise<KetQuaLoEmbed> {
  const apiKey = layApiKey('gemini');
  if (!apiKey) {
    throw new Error('Kho tri thức cần GEMINI_API_KEY để sinh vector. Thêm key rồi thử lại.');
  }

  const vectors: number[][] = [];
  for (let i = 0; i < doans.length; i += KICH_THUOC_LO) {
    try {
      vectors.push(...(await goiLo(doans.slice(i, i + KICH_THUOC_LO), apiKey)));
    } catch (e) {
      if (e instanceof LoiHanMucEmbed) {
        return { vectors, choGiay: e.choGiay, hetNgay: e.hetNgay };
      }
      throw e;
    }
    if (i + KICH_THUOC_LO < doans.length) await new Promise((r) => setTimeout(r, 120));
  }
  return { vectors };
}

/**
 * Embed nhiều đoạn, chạy tuần tự có nghỉ giữa các lần gọi.
 * Free tier giới hạn số request/phút nên bắn song song sẽ dính 429 ngay.
 */
export async function embedNhieuDoan(
  doans: string[],
  onTienDo?: (daXong: number, tong: number) => void
): Promise<number[][]> {
  const ketQua: number[][] = [];
  for (let i = 0; i < doans.length; i++) {
    ketQua.push(await embedTaiLieu(doans[i]));
    onTienDo?.(i + 1, doans.length);
    if (i < doans.length - 1) await new Promise((r) => setTimeout(r, 120));
  }
  return ketQua;
}
