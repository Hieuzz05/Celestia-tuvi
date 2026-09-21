'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { MarkdownLuanGiai } from '@/components/MarkdownLuanGiai';
import { CanCu, type CanCuTraLoi } from '@/components/CanCu';
import { FormSinh, tachNgaySinh, type ThongTinForm } from '@/components/FormSinh';
import { ghiSuKien } from '@/lib/analytics';
import { useBoiCanh } from '@/lib/store/boi-canh';
import type { HoSo } from '@/lib/store/hoso';
import { lapLaSo } from '@/lib/tuvi/ansao';
import { CHI } from '@/lib/tuvi/constants';
import { Eyebrow, NutVien, Shell } from '@/components/ui';
import { CongDangNhap } from '@/components/auth/CongDangNhap';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { CongUngHo } from '@/components/support/CongUngHo';
import { useQuyen } from '@/lib/support/useQuyen';
import { bamLaSoTrinhDuyet, docHoiThoai, luuLuot, xoaHoiThoai } from '@/lib/store/hoi-thoai';
import { dien, useT } from '@/lib/i18n/context';

interface TinNhan {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
  canCu?: CanCuTraLoi;
  /** Chip gợi ý lượt sau, do Celes đề xuất theo chính câu vừa trả lời */
  goiYTiep?: string[];
  /** Lối đi tiếp sang bề mặt khác — bảng tra ở máy chủ dựng, không phải model */
  loiDi?: { nhan: string; duong: string }[];
}

function formTuHoSo(h: HoSo): ThongTinForm {
  return {
    hoTen: h.hoTen,
    ngaySinh: `${h.nam}-${String(h.thang).padStart(2, '0')}-${String(h.ngay).padStart(2, '0')}`,
    gio: h.gio,
    gioiTinh: h.gioiTinh,
  };
}

/** Khoá nhận dạng một lá số — khoá đổi nghĩa là đang nói về lá số khác */
function khoaCua(form: ThongTinForm) {
  return `${form.ngaySinh}|${form.gio}|${form.gioiTinh}`;
}

/**
 * Hỏi Celes — hub duy nhất cho mọi ý định "tôi muốn hiểu điều gì đó về lá số".
 *
 * Spec v4 gộp "Khám phá bản đồ" vào đây. Lý do: hai màn cũ dẫn tới cùng một ý
 * định, mà để cạnh nhau ở thanh chính thì người dùng phải tự quyết định nên xem
 * dữ liệu trước hay hỏi trước — một lựa chọn họ không có cơ sở để quyết. Giờ
 * mặc định là hỏi; bản đồ 12 cung nằm trong một thẻ phụ cho ai muốn tự đọc.
 */
function TrangHoiDap() {
  const t = useT();
  const { duocVao, dangDoc } = useTaiKhoan();
  const boiCanh = useBoiCanh();
  const quyenCeles = useQuyen();
  const params = useSearchParams();
  const [moCongUngHo, setMoCongUngHo] = useState(false);

  const [form, setForm] = useState<ThongTinForm>({
    hoTen: '',
    ngaySinh: '2000-08-24',
    gio: 9,
    gioiTinh: 'nam',
  });
  const [tinNhan, setTinNhan] = useState<TinNhan[]>([]);
  const [cauHoi, setCauHoi] = useState('');
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hienFormSinh, setHienFormSinh] = useState(false);
  // Lá số đã chốt để hỏi, giữ bằng khoá chứ không phải cờ true/false: đổi ngày
  // sinh là khoá lệch ngay, nên không có đường nào lỡ hỏi tiếp trên lá số khác.
  const [khoaDaChot, setKhoaDaChot] = useState<string | null>(null);
  /*
   * Khoá nhóm hội thoại — bằm của lá số đang hỏi.
   *
   * Giữ riêng khỏi `khoaDaChot` vì hai thứ khác nhau: `khoaDaChot` là cờ "đã
   * chốt lá số nào để hỏi", còn cái này là khoá dùng để đọc/ghi xuống database.
   * Nó bất đồng bộ (Web Crypto) nên không tính thẳng trong lúc render được.
   */
  const [khoaHoiThoai, setKhoaHoiThoai] = useState<string | null>(null);
  const cuoiRef = useRef<HTMLDivElement>(null);
  const daHoiTuUrl = useRef(false);

  // Lá số đang xem lấy từ bối cảnh chung, không tự đi hỏi lại: đổi lá số ở màn
  // khác rồi sang đây phải thấy đúng lá số đó (spec v4 mục 13B).
  const idDangDung = boiCanh.idDangXem ?? boiCanh.idMacDinh;
  useEffect(() => {
    if (khoaDaChot || boiCanh.dangTai) return;
    const h = boiCanh.hoSos.find((x) => x.id === idDangDung) ?? boiCanh.hoSos[0];
    if (!h) return;
    const f = formTuHoSo(h);
    setForm(f);
    setKhoaDaChot(khoaCua(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boiCanh.dangTai, boiCanh.hoSos, idDangDung]);

  useEffect(() => {
    cuoiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tinNhan, dangChay]);

  /*
   * Bằm lá số đang hỏi, rồi đọc lại mạch hội thoại của chính nó.
   *
   * `huy` chặn đúng một lỗi: đổi lá số hai lần thật nhanh thì hai lượt đọc chạy
   * song song, và lượt về SAU có thể là lượt của lá số TRƯỚC — người dùng thấy
   * hội thoại của người khác dán vào màn hình đang mở.
   */
  useEffect(() => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    /*
     * Bằm theo FORM HIỆN TẠI, không chờ người dùng bấm nút chốt.
     *
     * `khoaDaChot` chỉ được đặt khi bấm nút, nên giữa lúc sửa ngày sinh và lúc
     * bấm, nó vẫn trỏ về lá số cũ. Nếu khoá hội thoại đi theo nó thì câu hỏi về
     * lá số mới bị cất vào mạch của lá số cũ — và lần sau mở lên, hai người
     * lẫn vào nhau.
     */
    if (!ngay || !thang || !nam) return;

    let huy = false;
    (async () => {
      const khoa = await bamLaSoTrinhDuyet(ngay, thang, nam, form.gio, form.gioiTinh);
      if (huy) return;
      setKhoaHoiThoai(khoa);

      const cu = await docHoiThoai(khoa);
      if (huy || cu.length === 0) return;
      // Chỉ nạp khi màn còn trống: người dùng vừa hỏi xong mà mạch cũ đổ đè lên
      // là mất câu họ vừa nhận.
      setTinNhan((ds) => (ds.length ? ds : cu.map((l) => ({ vaiTro: l.vaiTro, noiDung: l.noiDung }))));
    })();

    return () => {
      huy = true;
    };
  }, [form.ngaySinh, form.gio, form.gioiTinh]);

  const laSo = (() => {
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return null;
    try {
      return lapLaSo({ ngay, thang, nam, gio: form.gio, gioiTinh: form.gioiTinh, hoTen: form.hoTen });
    } catch {
      return null;
    }
  })();

  const daChonLaSo = khoaDaChot === khoaCua(form);
  const quyen = quyenCeles.quyen;

  const doiNguoi = (h: HoSo) => {
    const f = formTuHoSo(h);
    setForm(f);
    setKhoaDaChot(khoaCua(f));
    // Xem tạm lá số khác trong phiên này; "Lá số của tôi" không đổi theo
    boiCanh.xemHoSo(h.id);
    setTinNhan([]);
    setLoi(null);
  };

  const suaForm = (f: ThongTinForm) => {
    setForm(f);
    // Đổi sang lá số khác thì hội thoại cũ không còn đúng ngữ cảnh nữa
    if (khoaCua(f) !== khoaDaChot) {
      setTinNhan([]);
      setLoi(null);
    }
  };

  const hoi = async (noiDung: string) => {
    const cau = noiDung.trim();
    if (!cau || dangChay) return;
    const { ngay, thang, nam } = tachNgaySinh(form.ngaySinh);
    if (!ngay || !thang || !nam) return;

    // KHÔNG chặn ở đây dựa trên số lượt phía trình duyệt.
    //
    // Bản trước có một lớp kiểm trước khi gửi, và nó tạo ra đúng một kiểu hỏng
    // không cách nào chẩn đoán từ phía người dùng: chỉ cần /api/entitlements/me
    // trả về sai một lần — phiên chưa kịp làm mới, mạng chập — là số lượt về 0,
    // và từ đó mọi lần bấm Gửi đều im lặng mở cổng ủng hộ. Không lỗi, không chữ,
    // chỉ là không bao giờ gửi được.
    //
    // Hạn mức vốn đã được chặn ở máy chủ, và máy chủ trả 402 kèm lý do. Cứ gửi
    // đi rồi xử theo câu trả lời thật: đúng một nguồn sự thật, và khi hết lượt
    // thì cổng mở vì máy chủ nói thế, không phải vì một con số cũ trong bộ nhớ.
    const lichSu = tinNhan.map((m) => ({ vaiTro: m.vaiTro, noiDung: m.noiDung }));
    setTinNhan((ds) => [...ds, { vaiTro: 'nguoi-dung', noiDung: cau }]);
    setCauHoi('');
    setDangChay(true);
    setLoi(null);
    ghiSuKien('ask_submitted');

    try {
      const res = await fetch('/api/hoi-dap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngay,
          thang,
          nam,
          gio: form.gio,
          gioiTinh: form.gioiTinh,
          hoTen: form.hoTen,
          cauHoi: cau,
          lichSu,
        }),
      });
      const data = await res.json();

      // 402 là hàng rào thật ở phía máy chủ. Bỏ câu vừa đẩy vào khung chat ra và
      // trả lại ô nhập, rồi mới mở cổng — người dùng không mất chữ nào.
      if (res.status === 402) {
        setTinNhan((ds) => ds.slice(0, -1));
        setCauHoi(cau);
        setMoCongUngHo(true);
        return;
      }

      if (!res.ok) throw new Error(data.loi ?? 'Không nhận được trả lời');
      setTinNhan((ds) => [
        ...ds,
        {
          vaiTro: 'tro-ly',
          noiDung: data.traLoi,
          canCu: data.canCu,
          goiYTiep: Array.isArray(data.goiYTiep) ? data.goiYTiep : [],
          loiDi: Array.isArray(data.loiDi) ? data.loiDi : [],
        },
      ]);
      // Cất CẢ CẶP sau khi đã có câu trả lời. Cất câu hỏi ngay lúc gửi thì model
      // hỏng sẽ để lại một câu lơ lửng, và lần mở sau Celes đọc nó như một lượt
      // đã xong. Không chờ: cất hỏng không được làm chậm màn hình.
      if (khoaHoiThoai) void luuLuot(khoaHoiThoai, cau, data.traLoi, data.model);
      quyenCeles.taiLai();
    } catch {
      setLoi(t.hoiCeles.loi);
    } finally {
      setDangChay(false);
    }
  };

  // Câu mang sang từ nơi khác (ô "Hôm nay bạn đang nghĩ gì?", "Hỏi Celes về
  // phần này", hoặc từ Hành trình). Chỉ gửi một lần và chỉ khi đã chốt lá số.
  useEffect(() => {
    const q = params.get('q');
    if (!q || daHoiTuUrl.current || !daChonLaSo || !laSo) return;
    daHoiTuUrl.current = true;
    ghiSuKien('post_signup_feature_resumed', { nguon: 'lien_ket' });
    hoi(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, daChonLaSo, laSo]);

  // Chưa đăng nhập thì KHÔNG dựng phần nội dung sâu — spec yêu cầu chặn ở tầng
  // đường dẫn, và server cũng chặn lại ở API tương ứng.
  if (dangDoc) return <Shell className="py-[48px]"><span /></Shell>;
  if (!duocVao)
    return (
      <Shell className="py-[48px]">
        <div className="mx-auto max-w-[620px]">
          <CongDangNhap nguon="ask_celes" />
        </div>
      </Shell>
    );

  return (
    <Shell className="flex flex-col gap-[24px] py-[20px]">
      <div>
        <Eyebrow>{t.hoiCeles.eyebrow}</Eyebrow>
        <h1 className="heading mt-[10px]">{t.hoiCeles.tieuDe}</h1>
      </div>

      <section className="grid gap-[24px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Cột trái: đang nói về lá số nào, và lối sang bản đồ 12 cung */}
        <div className="flex flex-col gap-[12px]">
          {boiCanh.hoSos.length > 0 && (
            <label className="flex flex-col gap-[8px]">
              <span className="field-label">{t.hoiCeles.dangNoiVe}</span>
              <select
                className="field-input"
                value={boiCanh.hoSos.find((h) => khoaCua(formTuHoSo(h)) === khoaCua(form))?.id ?? ''}
                onChange={(e) => {
                  const h = boiCanh.hoSos.find((x) => x.id === e.target.value);
                  if (h) doiNguoi(h);
                }}
              >
                <option value="">{t.hoiCeles.nguoiVuaNhap}</option>
                {boiCanh.hoSos.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hoTen || '—'} — {h.ngay}/{h.thang}/{h.nam}
                    {h.id === boiCanh.idMacDinh ? ` · ${t.danhSach.laSoCuaToi}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(boiCanh.hoSos.length === 0 || hienFormSinh) && (
            <>
              <FormSinh giaTri={form} onChange={suaForm} />
              {!daChonLaSo && (
                <NutVien nho onClick={() => setKhoaDaChot(khoaCua(form))} disabled={!laSo}>
                  {t.hoiCeles.hoiVeNguoiNay}
                </NutVien>
              )}
            </>
          )}

          {boiCanh.hoSos.length > 0 && !hienFormSinh && (
            <button onClick={() => setHienFormSinh(true)} className="link-text self-start">
              {t.hoiCeles.hoiVeNguoiKhac}
            </button>
          )}

          {laSo && (
            <div
              className="flex flex-wrap gap-x-[12px] gap-y-[4px] pt-[12px] text-[13px]"
              style={{ color: 'var(--fg-muted)', borderTop: '1px solid var(--line)' }}
            >
              <span>
                Mệnh <b style={{ color: 'var(--fg)' }}>{CHI[laSo.menhIndex]}</b>
              </span>
              <span style={{ color: 'var(--fg)' }}>{laSo.cuc.ten}</span>
              <span>
                Thân cư <b style={{ color: 'var(--fg)' }}>{laSo.thanCuCung}</b>
              </span>
            </div>
          )}

          {/* Bản đồ 12 cung là lối phụ, không tranh chỗ với việc hỏi */}
          <div className="card flex flex-col gap-[12px]">
            <span className="text-[16px] font-semibold" style={{ color: 'var(--fg)' }}>
              {t.hoiCeles.tuXemTieuDe}
            </span>
            <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
              {t.hoiCeles.tuXemMo}
            </p>
            <Link href="/la-so" className="btn-outline btn-sm self-start">
              {t.hoiCeles.tuXemNut}
            </Link>
          </div>
        </div>

        {/* Cột phải: hội thoại — chỉ mở khi đã biết đang nói về lá số nào */}
        {!daChonLaSo ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center gap-[12px] rounded-[var(--radius-cards)] border p-[24px] text-center"
            style={{ borderColor: 'var(--line)', background: 'var(--surface-card)' }}
          >
            <h2 className="subheading">{t.hoiCeles.canBietAi}</h2>
            <p className="body-text max-w-[420px]" style={{ color: 'var(--fg-muted)' }}>
              {t.hoiCeles.canBietAiMo}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            <div
              className="flex min-h-[380px] flex-col gap-[16px] overflow-y-auto rounded-[var(--radius-cards)] border p-[18px]"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--surface-card)',
                maxHeight: '58vh',
              }}
            >
              {tinNhan.length === 0 && !dangChay && (
                <div className="flex flex-col gap-[16px]">
                  <div className="flex flex-col gap-[12px]">
                    <p className="eyebrow">{t.hoiCeles.khamPhaNhanhTieuDe}</p>
                    <div className="flex flex-wrap gap-[8px]">
                      {t.hoiCeles.khamPhaNhanh.map((c) => (
                        <button
                          key={c.nhan}
                          onClick={() => hoi(c.cauHoi)}
                          className="pill-tag"
                        >
                          {c.nhan}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-[12px]">
                    <p className="eyebrow">{t.hoiCeles.goiYTieuDe}</p>
                    <div className="flex flex-col items-start gap-[8px]">
                      {t.hoiCeles.goiY.map((g) => (
                        <button key={g} onClick={() => hoi(g)} className="link-text text-left">
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tinNhan.map((m, i) =>
                m.vaiTro === 'nguoi-dung' ? (
                  <div key={i} className="flex justify-end">
                    <p
                      className="max-w-[80%] rounded-[var(--radius-cards)] px-[14px] py-[10px] text-[14px]"
                      style={{ background: 'var(--surface-panel)', color: 'var(--fg)' }}
                    >
                      {m.noiDung}
                    </p>
                  </div>
                ) : (
                  /* Không in tên model ra đây: người dùng nói chuyện với Celes,
                     nhà cung cấp phía sau là chuyện của trang quản trị. */
                  <div key={i} className="flex flex-col gap-[8px]">
                    <MarkdownLuanGiai noiDung={m.noiDung} nho />

                    {/*
                      Chip chỉ hiện dưới lượt CUỐI CÙNG của Celes.
                      Hiện dưới mọi lượt thì cuộn lên giữa hội thoại là gặp một
                      rừng chip đã hết thời sự, và bấm vào đó là hỏi lại một
                      chuyện đã nói xong. Dùng lại đúng lớp pill-tag của phần
                      "Khám phá nhanh" để hai chỗ không lệch nhau.
                    */}
                    {i === tinNhan.length - 1 && !dangChay && !!m.goiYTiep?.length && (
                      <div className="flex flex-wrap gap-[8px] pt-[2px]">
                        {m.goiYTiep.map((g) => (
                          <button key={g} onClick={() => hoi(g)} className="pill-tag">
                            {g}
                          </button>
                        ))}
                      </div>
                    )}

                    {/*
                      Lối đi tiếp — nhẹ hơn chip một bậc, và cũng chỉ dưới lượt
                      cuối. Chip là "hỏi tiếp ở đây"; đây là "rời khỏi đây".
                      Hai việc khác nhau nên không trộn vào cùng một hàng.
                    */}
                    {i === tinNhan.length - 1 && !dangChay && !!m.loiDi?.length && (
                      <div className="flex flex-wrap gap-x-[16px] gap-y-[8px] pt-[2px]">
                        {m.loiDi.map((l) => (
                          <Link key={l.duong} href={l.duong} className="link-text text-[13px]">
                            {l.nhan}
                          </Link>
                        ))}
                      </div>
                    )}

                    <CanCu canCu={m.canCu} />
                  </div>
                )
              )}

              {dangChay && (
                <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>
                  {t.hoiCeles.dangTraLoi}
                </p>
              )}

              {loi && (
                <p className="text-[14px]" style={{ color: 'var(--chart-hung)' }}>
                  {loi}
                </p>
              )}

              <div ref={cuoiRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                hoi(cauHoi);
              }}
              className="flex gap-[12px]"
            >
              <input
                value={cauHoi}
                onChange={(e) => setCauHoi(e.target.value)}
                placeholder={t.hoiCeles.oNhap}
                maxLength={800}
                className="field-input"
                disabled={dangChay || !laSo}
              />
              <button
                type="submit"
                disabled={dangChay || !cauHoi.trim() || !laSo}
                className="btn-primary shrink-0"
              >
                {t.hoiCeles.gui}
              </button>
            </form>

            {/* Chỉ nhắc khi còn ít: hiện bộ đếm ngay từ câu đầu là biến cuộc trò
                chuyện thành cái đồng hồ đo. */}
            {quyenCeles.conCau !== null && quyenCeles.conCau <= 2 && quyen && (
              <p className="caption">
                {quyenCeles.conCau > 0
                  ? dien(t.ungHo.conCau, {
                      con: quyenCeles.conCau,
                      tong: quyen.ask.freeDailyLimit,
                    })
                  : dien(t.ungHo.hetCau, { tong: quyen.ask.freeDailyLimit })}
              </p>
            )}

            {/*
              Từ khi hội thoại được cất lên máy chủ, nút này không còn là dọn
              màn hình nữa. Người dùng bấm nó là muốn thứ họ đã kể biến mất
              thật — nên phải xoá cả ở database, không chỉ ở state.
            */}
            {tinNhan.length > 0 && (
              <button
                onClick={() => {
                  setTinNhan([]);
                  if (khoaHoiThoai) void xoaHoiThoai(khoaHoiThoai);
                }}
                className="link-text self-start"
              >
                {t.hoiCeles.xoaHoiThoai}
              </button>
            )}

            <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              {t.hoiCeles.mienTru}
            </p>
          </div>
        )}
      </section>

      {moCongUngHo && (
      <CongUngHo
        lyDo="ask_quota"
        onDong={() => setMoCongUngHo(false)}
        quayLai={{
          path: '/hoi-dap',
          profileId: boiCanh.idDangXem,
          draftMessage: cauHoi,
        }}
      />
      )}
    </Shell>
  );
}

export default function TrangHoiDapBoc() {
  return (
    <Suspense fallback={<Shell className="py-[48px]"><span /></Shell>}>
      <TrangHoiDap />
    </Suspense>
  );
}
