import { NextResponse } from 'next/server';
import { embedTruyVan } from '@/lib/ai/embedding';
import { modelKhaDungThuc } from '@/lib/ai/nguon-cau-hinh';
import { goiModel } from '@/lib/ai/providers';
import { ghiSuCo } from '@/lib/ai/su-co';
import { AiRetryableError } from '@/lib/ai/types';

/**
 * Kiểm tra sức khoẻ chuỗi model, mỗi ngày một lần (vercel.json).
 *
 * Sự cố được ghi từ luồng thật khi có người dùng gọi — nhưng hết credit lúc 2
 * giờ sáng thì phải đợi người dùng đầu tiên gặp lỗi mới biết. Cron này gọi thử
 * mỗi model một lượt tí hon (và một lượt embedding) để bắt những thứ không tự
 * khỏi: hết credit, key hết hạn.
 *
 * Tốn khoảng một lượt gọi ~10 token cho mỗi model mỗi ngày.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const bem = process.env.CRON_SECRET?.trim();
  if (!bem) return NextResponse.json({ loi: 'Chưa đặt CRON_SECRET' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${bem}`) {
    return NextResponse.json({ loi: 'Không có quyền' }, { status: 401 });
  }

  const ketQua: { ten: string; ok: boolean; loai?: string; thongDiep?: string }[] = [];

  const models = await modelKhaDungThuc();
  await Promise.all(
    models.map(async (m) => {
      const ten = `${m.provider}/${m.model}`;
      try {
        await goiModel(m.provider, m.model, m.apiKey, {
          system: 'Trả lời đúng một từ.',
          user: 'OK',
          // 256 chứ không 16: model suy luận (groq gpt-oss) tiêu token cho phần nghĩ trước, 16 là báo hỏng oan
          maxTokens: 256,
          temperature: 0,
          tatSuyNghi: true,
        });
        ketQua.push({ ten, ok: true });
      } catch (e) {
        const loai = e instanceof AiRetryableError ? e.loai : 'server';
        const thongDiep = e instanceof Error ? e.message : String(e);
        await ghiSuCo({ nguon: 'kiem-tra', provider: m.provider, model: m.model, loai, thongDiep });
        ketQua.push({ ten, ok: false, loai, thongDiep: thongDiep.slice(0, 160) });
      }
    })
  );

  try {
    await embedTruyVan('kiểm tra sức khoẻ');
    ketQua.push({ ten: 'embedding', ok: true });
  } catch (e) {
    const loai = e instanceof AiRetryableError ? e.loai : 'server';
    const thongDiep = e instanceof Error ? e.message : String(e);
    await ghiSuCo({
      nguon: 'kiem-tra',
      provider: process.env.EMBEDDING_PROVIDER === 'gemini' ? 'gemini' : 'openai',
      model: 'embedding',
      loai,
      thongDiep,
    });
    ketQua.push({ ten: 'embedding', ok: false, loai, thongDiep: thongDiep.slice(0, 160) });
  }

  return NextResponse.json({ soModel: models.length, hong: ketQua.filter((k) => !k.ok).length, ketQua });
}
