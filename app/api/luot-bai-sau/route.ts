import { NextResponse } from 'next/server';
import { luotBaiSauConLai } from '@/lib/support/quota-bai-sau';

/**
 * Còn bao nhiêu lượt đọc sâu hôm nay — CHỈ ĐỌC, không đặt chỗ.
 *
 * Tách thành route riêng thay vì nhét vào `/api/ban-doc-sau`: route kia là
 * route SINH BÀI, mỗi lần gọi là một lượt bị tiêu. Trang Lá số cần con số này
 * lúc vừa mở, tức là trước khi người dùng quyết định có đọc hay không.
 */
export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(await luotBaiSauConLai());
  } catch {
    // Không hiện gì còn hơn hiện sai — giao diện tự ẩn khi thấy 'chua-ro'
    return NextResponse.json({ bac: 'chua-ro' });
  }
}
