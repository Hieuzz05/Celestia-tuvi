import { NextResponse } from 'next/server';
import { PHIEN_BAN_KET_NOI } from '@/lib/ket-noi/tra-loi';
import { PHIEN_BAN_BAI_DAI } from '@/lib/rag/bai-dai';
import { PHIEN_BAN_SCHEMA_OUTPUT } from '@/lib/rag/bang-chung';
import { PHIEN_BAN_VALIDATOR } from '@/lib/rag/kiem-duyet';
import { PHIEN_BAN_NGON_NGU } from '@/lib/rag/ngon-ngu';
import { PHIEN_BAN_PLANNER } from '@/lib/rag/planner';
import { PHIEN_BAN_TRUY_HOI } from '@/lib/rag/truy-hoi';
import { PHIEN_BAN_UU_TIEN } from '@/lib/rag/uu-tien-nguon';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';

/**
 * Bản nào đang chạy trên máy chủ — công khai, không kèm bí mật.
 *
 * Có tuyến này vì một câu hỏi lặp lại mà trước đó không trả lời được: "đã deploy
 * chưa?". Mọi thay đổi vừa rồi đều nằm ở phía máy chủ, gói JavaScript gửi xuống
 * trình duyệt không đổi một byte, nên nhìn từ ngoài không có cách nào biết bản
 * mới đã lên hay chưa. Mã commit thì Vercel đưa sẵn vào biến môi trường.
 *
 * Chỉ trả mã commit, thời điểm dựng và số hiệu từng lớp của đường luận giải.
 * Không trả tên tài liệu, không trả khoá, không trả gì của người dùng.
 */

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'cuc-bo',
      commitDay: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      nhanh: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      moiTruong: process.env.VERCEL_ENV ?? 'cuc-bo',
      dungLuc: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      duongLuanGiai: {
        baiDai: PHIEN_BAN_BAI_DAI,
        ketNoi: PHIEN_BAN_KET_NOI,
        planner: PHIEN_BAN_PLANNER,
        truyHoi: PHIEN_BAN_TRUY_HOI,
        uuTienNguon: PHIEN_BAN_UU_TIEN,
        validator: PHIEN_BAN_VALIDATOR,
        ngonNgu: PHIEN_BAN_NGON_NGU,
        schemaOutput: PHIEN_BAN_SCHEMA_OUTPUT,
        phuongPhap: `${PHUONG_PHAP.id}@${PHUONG_PHAP.phienBan}`,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
