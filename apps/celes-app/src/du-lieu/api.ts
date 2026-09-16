import type { HoSo } from './ho-so';

/**
 * Gọi sang dịch vụ của Celestia.
 *
 * App KHÔNG tự chạy model: phần điều phối AI, kho tri thức và hạn mức đều nằm ở
 * máy chủ web — cùng một chỗ với web thì hai bên trả lời nhất quán, và khoá API
 * không bị nhúng vào gói cài đặt (ai tải app về cũng rút được khoá ra).
 *
 * Địa chỉ đổi được qua biến môi trường khi dựng bản chạy thử nội bộ.
 */

const GOC =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'https://celestia-tuvi.vercel.app';

/** Ném ra khi máy chủ không trả lời được — màn hình tự đổi sang thông điệp của Celes */
export class LoiCeles extends Error {}

export interface TinNhanGui {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}

function tachNgay(ngaySinh: string) {
  const [nam, thang, ngay] = ngaySinh.split('-').map(Number);
  return { ngay, thang, nam };
}

export async function hoiCeles(
  hoSo: HoSo,
  cauHoi: string,
  lichSu: TinNhanGui[]
): Promise<string> {
  const { ngay, thang, nam } = tachNgay(hoSo.ngaySinh);
  const bayGio = new Date();

  let res: Response;
  try {
    res = await fetch(`${GOC}/api/hoi-dap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay,
        thang,
        nam,
        gio: hoSo.gio,
        gioiTinh: hoSo.gioiTinh,
        hoTen: hoSo.ten,
        namXem: bayGio.getFullYear(),
        thangXem: bayGio.getMonth() + 1,
        cauHoi,
        // Chỉ gửi vài lượt gần nhất: đủ giữ mạch mà không phình yêu cầu
        lichSu: lichSu.slice(-6),
      }),
    });
  } catch {
    throw new LoiCeles('khong-ket-noi-duoc');
  }

  if (!res.ok) throw new LoiCeles(`http-${res.status}`);

  const data = (await res.json()) as { noiDung?: string; loi?: string };
  if (!data.noiDung) throw new LoiCeles(data.loi ?? 'khong-co-noi-dung');

  return data.noiDung;
}
