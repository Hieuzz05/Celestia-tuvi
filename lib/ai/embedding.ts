import { layApiKey } from './config';
import { AiRetryableError } from './types';

/**
 * Sinh vector ngữ nghĩa. Số chiều 768 phải khớp cột `vector(768)` trong
 * schema-rag.sql — đổi ở đây thì phải đổi cả bảng, nên để thành hằng số chung.
 */
export const SO_CHIEU_VECTOR = 768;

/**
 * Chọn nhà cung cấp embedding.
 *
 * Gemini nằm trong gói miễn phí nhưng có hai trần cứng: 100 đoạn mỗi phút và
 * 1.000 đoạn mỗi ngày. Cả kho tri thức vài nghìn đoạn, nên nạp hết mất nhiều
 * ngày — và đó là nút thắt thật, không phải kích thước tệp.
 *
 * OpenAI `text-embedding-3-small` nhận tham số `dimensions` nên trả đúng 768
 * chiều, khớp cột đang có mà không phải đổi bảng. Đo ngày 18/09/2026 trên khoá
 * hiện tại: 3.000 lượt/phút, 1 triệu token/phút, không có trần ngày, lô 64 đoạn
 * mất 1,3 giây. Giá 0,02 đô la cho một triệu token.
 *
 * CẢNH BÁO: vector của hai nhà cung cấp KHÔNG so sánh được với nhau. Đổi nhà
 * cung cấp thì phải sinh lại vector cho TOÀN BỘ kho, bằng
 * `npx tsx scripts/nap-lai-embedding.ts`. Trộn hai loại vector trong cùng một
 * cột không báo lỗi gì cả — nó chỉ làm truy hồi trả về kết quả vô nghĩa.
 */
export type NhaCungCapEmbedding = 'gemini' | 'openai';

/*
 * Mặc định là openai, không phải gemini.
 *
 * Mặc định phải khớp với thứ kho ĐANG chứa. Kho hiện tại — 7.559 đoạn của 15
 * cuốn — sinh bằng OpenAI. Để mặc định là gemini thì bản trên máy chủ sẽ mã hoá
 * câu hỏi bằng một model, còn kho thì chứa vector của model khác: truy vấn vẫn
 * chạy, vẫn trả về kết quả, chỉ là kết quả vô nghĩa. Và không có gì báo lỗi.
 *
 * Đổi kho sang nhà cung cấp khác thì đổi luôn dòng này, đừng chỉ đặt biến môi
 * trường ở một máy.
 */
export const NHA_CUNG_CAP_EMBEDDING: NhaCungCapEmbedding =
  process.env.EMBEDDING_PROVIDER === 'gemini' ? 'gemini' : 'openai';

const MODEL_EMBEDDING =
  NHA_CUNG_CAP_EMBEDDING === 'openai'
    ? (process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small')
    : 'gemini-embedding-001';

/** Tên model đang dùng — để ghi nhật ký và để người vận hành đối chiếu */
export const TEN_MODEL_EMBEDDING = `${NHA_CUNG_CAP_EMBEDDING}/${MODEL_EMBEDDING}`;

function layKhoaEmbedding(): string {
  const key = layApiKey(NHA_CUNG_CAP_EMBEDDING);
  if (!key) {
    throw new Error(
      NHA_CUNG_CAP_EMBEDDING === 'openai'
        ? 'EMBEDDING_PROVIDER=openai nhưng chưa có OPENAI_API_KEY.'
        : 'Kho tri thức cần GEMINI_API_KEY để sinh vector. Thêm key rồi thử lại.'
    );
  }
  return key;
}

/**
 * Gọi OpenAI cho một lô đoạn.
 *
 * Endpoint nhận thẳng mảng nên một lô là một lượt gọi, không phải gói nhiều
 * request con như Gemini. Trần đo được: 300.000 token mỗi lượt.
 */
async function goiLoOpenAi(lo: string[], apiKey: string, lanThu = 0): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL_EMBEDDING, input: lo, dimensions: SO_CHIEU_VECTOR }),
  });

  if (res.status === 429) {
    // OpenAI không có trần theo ngày cho embedding, chỉ có trần theo phút —
    // nên `hetNgay` luôn false: chờ là chạy tiếp được.
    const cho = Number(res.headers.get('retry-after') ?? '') || 20;
    throw new LoiHanMucEmbed(cho, false);
  }

  if (res.status >= 500) {
    if (lanThu >= 3) {
      throw new AiRetryableError('Nhà cung cấp embedding lỗi sau 3 lần thử', 'server', res.status);
    }
    await new Promise((r) => setTimeout(r, 2 ** lanThu * 1000));
    return goiLoOpenAi(lo, apiKey, lanThu + 1);
  }

  // 400 với lô nhiều phần tử gần như luôn là vượt trần token của cả lô
  if (res.status === 400 && lo.length > 1) {
    const giua = Math.floor(lo.length / 2);
    return [
      ...(await goiLoOpenAi(lo.slice(0, giua), apiKey)),
      ...(await goiLoOpenAi(lo.slice(giua), apiKey)),
    ];
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Embedding lỗi ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const hang: { index: number; embedding: number[] }[] = data.data ?? [];
  if (hang.length !== lo.length) {
    throw new Error(`OpenAI trả ${hang.length} vector cho ${lo.length} đoạn`);
  }

  // Sắp lại theo `index`: tài liệu không hứa thứ tự, mà ghép lệch vector vào sai
  // đoạn là sai lặng lẽ — không lỗi nào báo, chỉ lộ ra ở chất lượng truy hồi.
  const theoThuTu = [...hang].sort((a, b) => a.index - b.index).map((x) => x.embedding);
  for (const v of theoThuTu) {
    if (v.length !== SO_CHIEU_VECTOR) {
      throw new Error(`Embedding trả về ${v.length} chiều, cần ${SO_CHIEU_VECTOR}`);
    }
  }
  return theoThuTu;
}

/** taskType giúp Gemini tối ưu vector cho đúng mục đích dùng */
type MucDich = 'luu-tru' | 'truy-van';

async function goiEmbedding(text: string, mucDich: MucDich): Promise<number[]> {
  const apiKey = layKhoaEmbedding();

  if (NHA_CUNG_CAP_EMBEDDING === 'openai') {
    // OpenAI không phân biệt vector để lưu và vector để tra — cùng một không
    // gian, nên `mucDich` không dùng tới ở nhánh này.
    const [v] = await goiLoOpenAi([text], apiKey);
    return v;
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
const KICH_THUOC_LO = Number(
  process.env.EMBEDDING_BATCH_SIZE ?? (NHA_CUNG_CAP_EMBEDDING === 'openai' ? 64 : 45)
);

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
  if (NHA_CUNG_CAP_EMBEDDING === 'openai') return goiLoOpenAi(lo, apiKey, lanThu);

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
  const apiKey = layKhoaEmbedding();

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
    // Gemini free tier tính từng đoạn là một request nên phải nhả nhịp. OpenAI
    // cho 3.000 lượt/phút, nghỉ ở đó chỉ làm chậm mà không tránh được gì.
    if (NHA_CUNG_CAP_EMBEDDING !== 'openai' && i + KICH_THUOC_LO < doans.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
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
