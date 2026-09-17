import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { saoChinhTheoCung } from '@/lib/rag/boi-canh-la-so';
import { ghiLanTruyHoi } from '@/lib/rag/nhat-ky';
import { lapKeHoach, NHAN_CHU_DE, NHAN_LOP_HAN } from '@/lib/rag/planner';
import { truyHoi, type CauHinhTruyHoi } from '@/lib/rag/truy-hoi';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';

export const maxDuration = 60;

/**
 * Retrieval Lab — chạy đúng planner và truy hồi mà production dùng, rồi trả về
 * mọi thứ ở giữa.
 *
 * Không gọi model. Mục đích là tách bạch: khi câu trả lời sai, phải biết được
 * lỗi nằm ở planner (chọn nhầm cung), ở truy hồi (lấy nhầm đoạn), hay ở model.
 * Trộn cả ba vào một lần chạy thì không tách được gì.
 */

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;

  let body: {
    cauHoi?: string;
    hePhai?: string;
    cauHinh?: Partial<CauHinhTruyHoi>;
    laSo?: { ngay?: number; thang?: number; nam?: number; gio?: number; gioiTinh?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  const cauHoi = body.cauHoi?.trim();
  if (!cauHoi) return NextResponse.json({ loi: 'Chưa nhập câu hỏi' }, { status: 400 });
  if (cauHoi.length > 800) return NextResponse.json({ loi: 'Câu hỏi quá dài' }, { status: 400 });

  // Lá số thử là tuỳ chọn: hỏi "Hoá Kỵ tại Quan Lộc đọc thế nào" không cần lá số
  // nào cả, và bắt nhập thì chỉ làm chậm việc gỡ lỗi.
  const ls = body.laSo;
  const coLaSo =
    ls &&
    soHopLe(ls.ngay, 1, 31) &&
    soHopLe(ls.thang, 1, 12) &&
    soHopLe(ls.nam, 1900, 2100) &&
    soHopLe(ls.gio, 0, 23) &&
    (ls.gioiTinh === 'nam' || ls.gioiTinh === 'nu');

  const saoTheoCung = coLaSo
    ? saoChinhTheoCung(
        lapLaSo({
          ngay: ls!.ngay!,
          thang: ls!.thang!,
          nam: ls!.nam!,
          gio: ls!.gio!,
          gioiTinh: ls!.gioiTinh as GioiTinh,
        })
      )
    : undefined;

  const keHoach = lapKeHoach({ cauHoi, saoTheoCung });

  const cauHinh: Partial<CauHinhTruyHoi> = {
    ...body.cauHinh,
    hePhai: body.hePhai && body.hePhai !== 'tat-ca' ? body.hePhai : undefined,
  };

  const kq = await truyHoi(keHoach, cauHinh);

  const runId = await ghiLanTruyHoi(keHoach, kq, {
    cauHoi,
    cheDo: 'thu_nghiem',
    nguoiChay: cong.actor.id,
  });

  return NextResponse.json({
    runId,
    keHoach: {
      chuDe: NHAN_CHU_DE[keHoach.chuDe],
      chacChan: keHoach.chacChan,
      cungLienQuan: keHoach.cungLienQuan,
      lopHan: keHoach.lopHan.map((l) => NHAN_LOP_HAN[l]),
      thucThe: keHoach.thucThe.map((t) => ({ id: t.id, ten: t.ten, loai: t.loai })),
      truyVan: keHoach.truyVan,
      phienBan: keHoach.phienBan,
    },
    khoTrong: kq.khoTrong,
    doTreMs: kq.doTreMs,
    cauHinh: kq.cauHinh,
    phienBan: kq.phienBan,
    ketQua: kq.ungVien.map((u) => ({
      chunkId: u.chunkId,
      tieuDe: u.tieuDe,
      phienBanTaiLieu: u.phienBanTaiLieu,
      deMuc: u.duongDeMuc,
      hePhai: u.hePhai,
      mucTinCay: u.mucTinCay,
      hangVector: u.hangVector ?? null,
      diemVector: u.diemVector ?? null,
      hangTuKhoa: u.hangTuKhoa ?? null,
      diemTuKhoa: u.diemTuKhoa ?? null,
      diemRRF: u.diemRRF,
      duocChon: u.duocChon,
      trich: u.noiDung.slice(0, 400),
    })),
  });
}
