'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Field } from '@/components/FormSinh';
import { Eyebrow, Shell, The } from '@/components/ui';

/**
 * Kho tri thức — quản lý nguồn, không chỉ là chỗ tải tệp lên.
 *
 * Khác bản cũ ở một điểm quyết định: nạp xong tài liệu KHÔNG tự đi vào truy hồi.
 * Nó dừng ở "Cần duyệt", và chỉ khi có người bấm Xuất bản thì Celes mới dùng.
 * Cột "Được truy hồi?" nói thẳng điều đó cho từng phiên bản, vì đây là thứ dễ
 * hiểu nhầm nhất và hiểu nhầm thì hỏng cả chất lượng câu trả lời.
 */

interface PhienBan {
  id: string;
  phien_ban: string;
  trang_thai: string;
  so_chunk: number;
  canh_bao: string[];
  xuat_ban_luc: string | null;
  tao_luc: string;
  buoc_loi: string | null;
  loi: string | null;
}

interface TaiLieu {
  id: string;
  tieu_de: string;
  ten_tep: string | null;
  he_phai: string;
  tac_gia: string | null;
  loai_nguon: string;
  muc_tin_cay: string;
  the_chu_de: string[];
  cap_nhat_luc: string;
  knowledge_document_versions: PhienBan[];
}

const HE_PHAI = [
  { id: 'chung', nhan: 'Dùng chung' },
  { id: 'nam-phai', nhan: 'Nam phái' },
  { id: 'bac-phai', nhan: 'Bắc phái' },
];

const LOAI_NGUON = [
  { id: 'sach', nhan: 'Sách' },
  { id: 'ghi-chu-chuyen-gia', nhan: 'Ghi chú chuyên gia' },
  { id: 'quy-tac', nhan: 'Quy tắc' },
  { id: 'bai-viet', nhan: 'Bài viết' },
  { id: 'noi-bo', nhan: 'Nội bộ' },
];

const MUC_TIN_CAY = [
  { id: 'cot-loi', nhan: 'Quy tắc cốt lõi' },
  { id: 'chuyen-gia-duyet', nhan: 'Chuyên gia đã duyệt' },
  { id: 'tham-khao', nhan: 'Tham khảo' },
  { id: 'ho-tro', nhan: 'Bổ trợ' },
];

const TRANG_THAI: Record<string, { nhan: string; truyHoi: boolean; mau: string }> = {
  nhap: { nhan: 'Nháp', truyHoi: false, mau: 'var(--fg-muted)' },
  dang_xu_ly: { nhan: 'Đang xử lý', truyHoi: false, mau: 'var(--fg-muted)' },
  can_duyet: { nhan: 'Cần duyệt', truyHoi: false, mau: 'var(--chart-trung)' },
  da_xuat_ban: { nhan: 'Đã xuất bản', truyHoi: true, mau: 'var(--chart-cat)' },
  that_bai: { nhan: 'Thất bại', truyHoi: false, mau: 'var(--chart-hung)' },
  luu_tru: { nhan: 'Lưu trữ', truyHoi: false, mau: 'var(--fg-muted)' },
};

const nhan = (ds: { id: string; nhan: string }[], id: string) =>
  ds.find((x) => x.id === id)?.nhan ?? id;

const DINH_DANG = '.txt,.md,.markdown,.csv';

interface TienDoEmbed {
  daXong: number;
  tong: number;
  xong: boolean;
  canhBao?: string[];
  choGiay?: number;
  hetNgay?: boolean;
}

const nghi = (giay: number) => new Promise((r) => setTimeout(r, giay * 1000));

/**
 * Chạy hết các lượt điền vector cho một phiên bản.
 *
 * Nút thắt không phải tốc độ mà là hạn mức: free tier cho 100 đoạn mỗi phút.
 * Nên vòng lặp này chủ yếu là CHỜ — máy chủ trả về `choGiay` đúng bằng số giây
 * nhà cung cấp yêu cầu, và ở đây đếm ngược cho người dùng thấy nó vẫn đang chạy
 * chứ không phải treo.
 *
 * Bỏ dở giữa chừng không mất gì: lượt sau chỉ lấy đoạn chưa có vector.
 */
async function chayEmbed(
  versionId: string,
  tong: number,
  onTienDo: (s: string | null) => void
): Promise<TienDoEmbed | { loi: string }> {
  let tienDo: TienDoEmbed = { daXong: 0, tong, xong: false };
  // Chặn vòng lặp vô hạn khi máy chủ báo chưa xong mà cũng không tiến thêm và
  // cũng không hẹn chờ — lúc đó có gì đó hỏng thật.
  let khongTien = 0;
  // Trần thời gian chờ cộng dồn. Hạn mức theo PHÚT thì chờ là đúng, nhưng hạn
  // mức theo NGÀY cạn thì mỗi lượt vẫn hẹn chờ 60 giây và vòng lặp chạy tới sáng.
  let tongCho = 0;
  const TRAN_CHO = 45 * 60;

  while (!tienDo.xong) {
    onTienDo(`Đang sinh vector ${tienDo.daXong}/${tienDo.tong} đoạn…`);
    const r = await fetch('/api/admin/knowledge/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    const t: TienDoEmbed & { loi?: string } = await r.json();
    if (!r.ok) return { loi: t.loi ?? 'Lỗi khi sinh vector' };

    khongTien = t.daXong > tienDo.daXong || t.choGiay ? 0 : khongTien + 1;
    if (khongTien >= 3) {
      return { loi: `Dừng ở ${t.daXong}/${t.tong} đoạn: ba lượt liên tiếp không tiến thêm được.` };
    }
    tienDo = t;

    // Hạn mức theo NGÀY thì chờ bao lâu cũng vô ích. Dừng ngay và nói rõ, thay vì
    // để người dùng ngồi nhìn đồng hồ đếm ngược suốt 45 phút rồi mới biết.
    if (t.hetNgay) {
      return {
        loi:
          `Dừng ở ${t.daXong}/${t.tong} đoạn: đã cạn hạn mức embedding của cả ngày ` +
          '(gói miễn phí Gemini cho 1.000 đoạn/ngày). Mai mở lại trang này và bấm "Nạp tiếp" — ' +
          'phần đã xong vẫn được giữ. Muốn nạp liền mạch thì bật thanh toán cho khoá Gemini.',
      };
    }

    if (!t.xong && t.choGiay) {
      tongCho += t.choGiay;
      if (tongCho > TRAN_CHO) {
        return {
          loi:
            `Dừng ở ${t.daXong}/${t.tong} đoạn: đã chờ hạn mức quá ${Math.round(TRAN_CHO / 60)} phút. ` +
            'Nhiều khả năng hạn mức NGÀY của Gemini đã cạn — mai nạp tiếp, hoặc dùng key có trả phí.',
        };
      }
      for (let con = t.choGiay; con > 0; con--) {
        onTienDo(`${t.daXong}/${t.tong} đoạn — chờ hạn mức nhà cung cấp, còn ${con}s…`);
        await nghi(1);
      }
    }
  }

  onTienDo(null);
  return tienDo;
}

async function docKho(): Promise<{ taiLieu: TaiLieu[] } | { loi: string }> {
  try {
    const res = await fetch('/api/admin/knowledge', { cache: 'no-store' });
    const d = await res.json();
    if (!res.ok) return { loi: d.loi ?? 'Không đọc được kho tri thức' };
    return { taiLieu: (d.taiLieu ?? []) as TaiLieu[] };
  } catch {
    return { loi: 'Không kết nối được máy chủ' };
  }
}

export default function TrangKhoTriThuc() {
  const [taiLieu, setTaiLieu] = useState<TaiLieu[] | null>(null);
  const [loiTai, setLoiTai] = useState<string | null>(null);
  const [moNap, setMoNap] = useState(false);
  const [thongBao, setThongBao] = useState<{ loai: 'ok' | 'loi'; noiDung: string } | null>(null);
  const [dangEmbed, setDangEmbed] = useState<string | null>(null);

  // Hàm đọc để RỖNG khỏi setState, và việc đặt state nằm ở `.then` — đây là hình
  // dạng mà quy tắc set-state-in-effect chấp nhận, và cũng đúng tinh thần của nó.
  const tai = useCallback(async () => {
    const kq = await docKho();
    setLoiTai('loi' in kq ? kq.loi : null);
    setTaiLieu('loi' in kq ? [] : kq.taiLieu);
  }, []);

  useEffect(() => {
    docKho().then((kq) => {
      setLoiTai('loi' in kq ? kq.loi : null);
      setTaiLieu('loi' in kq ? [] : kq.taiLieu);
    });
  }, []);

  /** Chạy tiếp phần vector còn dở của một phiên bản */
  async function napTiep(versionId: string, soChunk: number) {
    setDangEmbed(versionId);
    const kq = await chayEmbed(versionId, soChunk, (s) =>
      setThongBao(s ? { loai: 'ok', noiDung: s } : null)
    );
    setDangEmbed(null);
    setThongBao(
      'loi' in kq
        ? { loai: 'loi', noiDung: kq.loi }
        : { loai: 'ok', noiDung: `Xong ${kq.tong} đoạn. Tài liệu đã chuyển sang Cần duyệt.` }
    );
    void tai();
  }

  async function doiTrangThai(versionId: string, hanhDong: 'xuat-ban' | 'luu-tru') {
    const res = await fetch('/api/admin/knowledge/phien-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, hanhDong }),
    });
    const d = await res.json();
    setThongBao(
      res.ok
        ? { loai: 'ok', noiDung: hanhDong === 'xuat-ban' ? 'Đã xuất bản. Celes sẽ dùng bản này.' : 'Đã chuyển sang lưu trữ.' }
        : { loai: 'loi', noiDung: d.loi ?? 'Không đổi được trạng thái' }
    );
    if (res.ok) void tai();
  }

  async function xoaNguon(documentId: string, tieuDe: string) {
    if (!confirm(`Xoá hẳn "${tieuDe}" cùng toàn bộ phiên bản và đoạn của nó?\n\nKhông khôi phục được. Nếu chỉ muốn Celes ngừng dùng, hãy chọn Lưu trữ.`)) {
      return;
    }
    const res = await fetch(`/api/admin/knowledge/phien-ban?documentId=${documentId}`, {
      method: 'DELETE',
    });
    const d = await res.json().catch(() => ({}));
    setThongBao(
      res.ok ? { loai: 'ok', noiDung: 'Đã xoá nguồn.' } : { loai: 'loi', noiDung: d.loi ?? 'Không xoá được' }
    );
    if (res.ok) void tai();
  }

  const soDaXuatBan =
    taiLieu?.filter((t) => t.knowledge_document_versions.some((v) => v.trang_thai === 'da_xuat_ban')).length ?? 0;
  const soDoanHoatDong =
    taiLieu?.reduce(
      (s, t) => s + (t.knowledge_document_versions.find((v) => v.trang_thai === 'da_xuat_ban')?.so_chunk ?? 0),
      0
    ) ?? 0;
  const soCanDuyet =
    taiLieu?.filter((t) => t.knowledge_document_versions.some((v) => v.trang_thai === 'can_duyet')).length ?? 0;
  const soHong =
    taiLieu?.filter((t) => t.knowledge_document_versions.some((v) => v.trang_thai === 'that_bai')).length ?? 0;

  return (
    <Shell className="flex flex-col gap-[28px] py-[36px]">
      <div>
        <Eyebrow className="mb-[10px]">QUẢN TRỊ · AI &amp; TRI THỨC</Eyebrow>
        <h1 className="heading-sm">Kho tri thức</h1>
        <div className="mt-[10px] flex flex-wrap gap-[16px]">
          <Link href="/admin" className="link-text">← Trang quản trị</Link>
        </div>
      </div>

      {loiTai && (
        <div
          className="rounded-[var(--radius-cards)] border p-[16px] text-[14px]"
          style={{ borderColor: 'var(--chart-hung)', color: 'var(--chart-hung)' }}
        >
          {loiTai}
        </div>
      )}

      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { nhan: 'Nguồn đang xuất bản', gt: soDaXuatBan },
          { nhan: 'Đoạn Celes đang dùng', gt: soDoanHoatDong },
          { nhan: 'Chờ duyệt', gt: soCanDuyet },
          { nhan: 'Xử lý lỗi', gt: soHong },
        ].map((x) => (
          <The key={x.nhan} className="flex flex-col gap-[6px]">
            <Eyebrow>{x.nhan}</Eyebrow>
            <span className="text-[26px] font-semibold tabular-nums" style={{ color: 'var(--fg)' }}>
              {x.gt}
            </span>
          </The>
        ))}
      </div>

      {thongBao && (
        <p
          className="body-sm"
          style={{ color: thongBao.loai === 'ok' ? 'var(--chart-cat)' : 'var(--chart-hung)' }}
        >
          {thongBao.noiDung}
        </p>
      )}

      <div>
        {moNap ? (
          <DangNap
            onXong={(tb) => {
              setThongBao(tb);
              setMoNap(false);
              void tai();
            }}
            onHuy={() => setMoNap(false)}
          />
        ) : (
          <button onClick={() => setMoNap(true)} className="btn-primary">
            Thêm nguồn
          </button>
        )}
      </div>

      <section className="flex flex-col gap-[12px]">
        <Eyebrow>Danh sách nguồn</Eyebrow>

        {taiLieu === null ? (
          <span />
        ) : taiLieu.length === 0 ? (
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Chưa có nguồn nào được xuất bản. Các luận giải chuyên môn cần nguồn sẽ bị giới hạn cho tới
            khi bạn thêm và xuất bản tài liệu.
          </p>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {taiLieu.map((t) => (
              <The key={t.id} className="flex flex-col gap-[12px]">
                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                  <div>
                    <h2 className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
                      {t.tieu_de}
                    </h2>
                    <p className="caption mt-[4px]" style={{ color: 'var(--fg-muted)' }}>
                      {nhan(HE_PHAI, t.he_phai)} · {nhan(LOAI_NGUON, t.loai_nguon)} ·{' '}
                      {nhan(MUC_TIN_CAY, t.muc_tin_cay)}
                      {t.tac_gia ? ` · ${t.tac_gia}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => xoaNguon(t.id, t.tieu_de)}
                    className="caption underline"
                    style={{ color: 'var(--chart-hung)' }}
                  >
                    Xoá nguồn
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr>
                        {['Phiên bản', 'Trạng thái', 'Được truy hồi?', 'Đoạn', 'Cập nhật', ''].map((h) => (
                          <th
                            key={h}
                            className="caption pb-[8px] font-normal"
                            style={{ borderBottom: '1px solid var(--line)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...t.knowledge_document_versions]
                        .sort((a, b) => b.tao_luc.localeCompare(a.tao_luc))
                        .map((v) => {
                          const tt = TRANG_THAI[v.trang_thai] ?? {
                            nhan: v.trang_thai,
                            truyHoi: false,
                            mau: 'var(--fg-muted)',
                          };
                          return (
                            <tr key={v.id}>
                              <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                                v{v.phien_ban}
                              </td>
                              <td
                                className="body-sm py-[9px]"
                                style={{ borderBottom: '1px solid var(--line)', color: tt.mau }}
                              >
                                {tt.nhan}
                                {v.loi ? ` — ${v.buoc_loi}: ${v.loi}` : ''}
                              </td>
                              <td
                                className="body-sm py-[9px]"
                                style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}
                              >
                                {tt.truyHoi ? 'Có' : 'Không'}
                              </td>
                              <td
                                className="body-sm py-[9px] tabular-nums"
                                style={{ borderBottom: '1px solid var(--line)' }}
                              >
                                {v.so_chunk}
                              </td>
                              <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                                {new Date(v.tao_luc).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="body-sm py-[9px]" style={{ borderBottom: '1px solid var(--line)' }}>
                                {v.trang_thai === 'da_xuat_ban' ? (
                                  <button
                                    onClick={() => doiTrangThai(v.id, 'luu-tru')}
                                    className="caption underline"
                                  >
                                    Lưu trữ
                                  </button>
                                ) : v.trang_thai === 'can_duyet' || v.trang_thai === 'luu_tru' ? (
                                  <button
                                    onClick={() => doiTrangThai(v.id, 'xuat-ban')}
                                    className="caption underline"
                                    style={{ color: 'var(--chart-cat)' }}
                                  >
                                    Xuất bản
                                  </button>
                                ) : v.trang_thai === 'dang_xu_ly' || v.trang_thai === 'that_bai' ? (
                                  // Nạp dở rồi đóng tab, hoặc một lượt hỏng giữa
                                  // chừng: bấm đây chạy tiếp từ đoạn chưa có vector,
                                  // không làm lại từ đầu và không tốn thêm quota.
                                  <button
                                    onClick={() => napTiep(v.id, v.so_chunk)}
                                    disabled={dangEmbed === v.id}
                                    className="caption underline"
                                  >
                                    {dangEmbed === v.id ? 'Đang chạy…' : 'Nạp tiếp'}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {t.knowledge_document_versions
                  .filter((v) => v.canh_bao?.length)
                  .map((v) => (
                    <div key={`cb-${v.id}`} className="flex flex-col gap-[4px]">
                      <Eyebrow>Cảnh báo v{v.phien_ban}</Eyebrow>
                      {v.canh_bao.map((c, i) => (
                        <p key={i} className="caption" style={{ color: 'var(--chart-trung)' }}>
                          {c}
                        </p>
                      ))}
                    </div>
                  ))}
              </The>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

/**
 * Biểu mẫu nạp nguồn.
 *
 * Tách thành component riêng và chỉ gắn vào cây khi mở: giữ nó luôn tồn tại rồi
 * ẩn đi thì state cũ của lần nạp trước còn nguyên ở lần sau.
 */
function DangNap({
  onXong,
  onHuy,
}: {
  onXong: (tb: { loai: 'ok' | 'loi'; noiDung: string }) => void;
  onHuy: () => void;
}) {
  const [tieuDe, setTieuDe] = useState('');
  const [phienBan, setPhienBan] = useState('1.0');
  const [hePhai, setHePhai] = useState('nam-phai');
  const [loaiNguon, setLoaiNguon] = useState('sach');
  const [mucTinCay, setMucTinCay] = useState('tham-khao');
  const [tacGia, setTacGia] = useState('');
  const [the, setThe] = useState('');
  const [noiDung, setNoiDung] = useState('');
  const [tenTep, setTenTep] = useState<string | null>(null);
  const [dangNap, setDangNap] = useState(false);
  const [tienDo, setTienDo] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  async function chonTep(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setTenTep(f.name);
    if (!tieuDe) setTieuDe(f.name.replace(/\.[^.]+$/, ''));
    setNoiDung(await f.text());
  }

  async function nap() {
    setDangNap(true);
    setLoi(null);
    try {
      const res = await fetch('/api/admin/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tieuDe,
          noiDung,
          phienBan,
          hePhai,
          loaiNguon,
          mucTinCay,
          tacGia,
          tenTep,
          theChuDe: the.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLoi(d.loi ?? 'Không nạp được tài liệu');
        return;
      }

      // Pha A chỉ lưu đoạn. Vector điền theo từng lượt ngắn để mỗi request nằm
      // gọn trong giới hạn thời gian của Vercel — vòng lặp nằm ở đây, người dùng
      // vẫn chỉ thao tác một lần.
      const kq = await chayEmbed(d.versionId, d.soDoan, setTienDo);
      if ('loi' in kq) {
        setLoi(kq.loi);
        setTienDo(null);
        return;
      }

      onXong({
        loai: 'ok',
        noiDung:
          `Đã xử lý ${kq.tong} đoạn.` +
          (kq.canhBao?.length ? ` ${kq.canhBao.length} cảnh báo cần xem.` : '') +
          ' Tài liệu đang ở trạng thái Cần duyệt — Celes chưa dùng cho tới khi bạn bấm Xuất bản.',
      });
    } catch {
      setLoi('Không kết nối được máy chủ');
    } finally {
      setDangNap(false);
      setTienDo(null);
    }
  }

  const duLieuDu = tieuDe.trim().length > 0 && noiDung.trim().length >= 100;

  return (
    <The className="flex flex-col gap-[14px]">
      <Eyebrow>Thêm nguồn</Eyebrow>

      <div className="grid gap-[14px] md:grid-cols-2">
        <Field label="Tiêu đề nguồn">
          <input value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} className="field-input" />
        </Field>
        <Field label="Phiên bản">
          <input value={phienBan} onChange={(e) => setPhienBan(e.target.value)} className="field-input" />
        </Field>
        <Field label="Hệ phái">
          <select value={hePhai} onChange={(e) => setHePhai(e.target.value)} className="field-input">
            {HE_PHAI.map((x) => (
              <option key={x.id} value={x.id}>{x.nhan}</option>
            ))}
          </select>
        </Field>
        <Field label="Loại nguồn">
          <select value={loaiNguon} onChange={(e) => setLoaiNguon(e.target.value)} className="field-input">
            {LOAI_NGUON.map((x) => (
              <option key={x.id} value={x.id}>{x.nhan}</option>
            ))}
          </select>
        </Field>
        <Field label="Mức tin cậy">
          <select value={mucTinCay} onChange={(e) => setMucTinCay(e.target.value)} className="field-input">
            {MUC_TIN_CAY.map((x) => (
              <option key={x.id} value={x.id}>{x.nhan}</option>
            ))}
          </select>
        </Field>
        <Field label="Tác giả / nguồn gốc">
          <input value={tacGia} onChange={(e) => setTacGia(e.target.value)} className="field-input" />
        </Field>
      </div>

      <Field label="Thẻ chủ đề (cách nhau bằng dấu phẩy)">
        <input
          value={the}
          onChange={(e) => setThe(e.target.value)}
          placeholder="công việc, lưu niên"
          className="field-input"
        />
      </Field>

      <Field label="Tệp (.txt, .md, .csv) hoặc dán nội dung bên dưới">
        <input type="file" accept={DINH_DANG} onChange={chonTep} className="field-input" />
      </Field>

      <Field label="Nội dung">
        <textarea
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value)}
          rows={10}
          className="field-input"
          placeholder="Dùng tiêu đề markdown (#, ##) để hệ thống cắt đoạn theo đúng mục."
        />
      </Field>

      <p className="caption" style={{ color: 'var(--fg-muted)' }}>
        {noiDung.trim().length.toLocaleString('vi-VN')} ký tự. Nạp xong tài liệu vào trạng thái{' '}
        <strong>Cần duyệt</strong> — Celes chưa dùng cho tới khi bạn xuất bản.
      </p>

      {loi && (
        <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
          {loi}
        </p>
      )}

      {tienDo && (
        <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
          {tienDo} Đừng đóng tab — tiến trình chạy từ trình duyệt này.
        </p>
      )}

      <div className="flex gap-[12px]">
        <button onClick={nap} disabled={!duLieuDu || dangNap} className="btn-primary">
          {dangNap ? 'Đang xử lý…' : 'Nạp và xử lý'}
        </button>
        <button onClick={onHuy} className="link-text">
          Huỷ
        </button>
      </div>
    </The>
  );
}
