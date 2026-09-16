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
