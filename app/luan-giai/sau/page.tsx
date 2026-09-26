'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CauTraLoiV3, DangDocV3, type CauV3 } from '@/components/luangiai/CauTraLoiV3';
import { GoiYCeles } from '@/components/luangiai/GoiYCeles';
import { BucTranhLon } from '@/components/luangiai/BucTranhLon';
import { DiSauHon } from '@/components/luangiai/DiSauHon';
import { Eyebrow, Shell } from '@/components/ui';
import { useTaiKhoan } from '@/components/auth/useTaiKhoan';
import { ghiSuKien } from '@/lib/analytics';
import { CAU_HOI_V3, CHU_DE_V3 } from '@/lib/rag/v3/khung';
import { QuayLai } from '@/components/QuayLai';
import { XuatLuanGiai, type BaiDaDoc } from '@/components/luangiai/XuatLuanGiai';

/**
 * LUẬN GIẢI CHUYÊN SÂU v3 (CEL-119) — 14 chủ đề, 61 câu hỏi.
 *
 * Thay bản đọc sâu bốn chặng. Mỗi chủ đề là MỘT lượt gọi (các câu trong chủ
 * đề chạy song song ở máy chủ), và chỉ gọi khi người đọc mở tới chủ đề ấy: đọc
 * hết 14 chủ đề ngay khi vào trang là bắt người đọc chờ cho những thứ họ có thể
 * không bao giờ mở.
 *
 * Cần đăng nhập, không trừ hạn mức (chủ dự án chốt 23/09/2026). Bài đã đệm theo
 * lá số + năm + chủ đề, nên mở lại là tức thì.
 */

const SO_CAU = new Map(
  CHU_DE_V3.map((c) => [c.id, CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === c.id).length])
);

/** Mục cuối của mục lục: ghép các chủ đề đã đọc thành một câu chuyện (26/09/2026) */
const BUC_TRANH = 'buc-tranh';

/** `conCho`: nửa sau của chủ đề còn đang viết — nửa đầu đã hiện */
/**
 * CÂU DẪN của từng chủ đề — nỗi băn khoăn thật người đọc mang tới (review chủ dự án
 * 25/09/2026: "một câu dẫn phản ánh pain point"). Tĩnh, không tốn lượt gọi.
 */
const DAN_CHU_DE: Record<string, string> = {
  'tinh-cach': 'Bạn thật sự là người thế nào — điều gì giúp bạn đi xa, và điều gì dễ khiến bạn tự làm khó mình?',
  'su-nghiep': 'Bạn tạo ra giá trị bằng cách nào, hợp đứng ở đâu, và bao giờ con đường nghề nghiệp mới thật sự bật lên?',
  'tien-bac': 'Tiền của bạn đến bằng cách nào, giữ được bao nhiêu, và khi nào mới thật sự tích thành tài sản?',
  'tinh-duyen': 'Bạn yêu theo kiểu nào, dễ gặp người ra sao, và điều gì quyết định một cuộc hôn nhân bền với bạn?',
  'con-cai': 'Duyên con cái đến sớm hay muộn, và quan hệ giữa bạn với con thay đổi thế nào theo năm tháng?',
  'gia-dinh': 'Gia đình gốc là nền tựa hay là phần bạn phải tự gánh — và nó theo bạn tới đâu?',
  'anh-em': 'Anh chị em có dựa được vào nhau không, và chuyện tiền bạc, tài sản chung nên đặt thế nào?',
  'quy-nhan': 'Ai là người thường nâng bạn lên, và kiểu người nào dễ kéo bạn vào rắc rối?',
  'phuc-duc': 'Khi gặp chuyện khó, bạn có hay tìm được đường thoát — và càng về sau đời có nhẹ đi không?',
  'suc-khoe': 'Thể trạng của bạn bền đến đâu, vùng nào đáng để ý hơn, và giai đoạn nào cần giữ sức hơn?',
  'nha-cua': 'Bạn có duyên tạo dựng nhà cửa không, nhà đến từ đâu, và khi nào mới an cư?',
  'ra-ngoai': 'Ra ngoài, đi xa có làm vận của bạn sáng hơn không — hay chỗ quen mới là chỗ bạn đứng vững?',
  'hoc-van': 'Học hành, thi cử và bằng cấp có phải thứ quyết định con đường của bạn không?',
  'van-han': 'Đời bạn lên xuống theo những chặng nào, bạn đang đứng ở đâu, và vài năm tới đang dẫn tới đâu?',
};

/** `tomLai`: phần ghép các câu thành một câu chuyện — `dangTom` khi đang viết */
type TrangThai =
  | { dang: true }
  | { dang: false; cau: CauV3[] | null; loi?: string; conCho?: boolean; tomLai?: string | null; dangTom?: boolean; banMoi?: boolean };

function TrangSau() {
  const { duocVao, dangDoc } = useTaiKhoan();
  const params = useSearchParams();

  const ngay = Number(params.get('ngay'));
  const thang = Number(params.get('thang'));
  const nam = Number(params.get('nam'));
  const gio = Number(params.get('gio'));
  const gioiTinh = params.get('gt') === 'nu' ? 'nu' : 'nam';
  const namXem = Number(params.get('namXem')) || new Date().getFullYear();
  const coLaSo = Boolean(ngay && thang && nam && !Number.isNaN(gio));
  // Không có `ve` (mở thẳng bằng đường dẫn) thì dựng lại đường về lá số từ chính thông tin sinh trên URL
  const veLaSo = coLaSo
    ? `/la-so?ngay=${ngay}&thang=${thang}&nam=${nam}&gio=${gio}&gt=${gioiTinh}&ten=${encodeURIComponent(params.get('ten') ?? '')}&tab=chuyen-sau`
    : '/la-so';
  const nutVe = <QuayLai macDinh={{ href: veLaSo, nhan: 'Về lá số' }} />;

  // Mở thẳng chủ đề được chỉ định (?chuDe=...) — Bản đồ mạnh–yếu ở /la-so dẫn sang đúng mặt đời vừa chạm
  const [chon, setChon] = useState<string>(() => {
    const c = params.get('chuDe');
    return c && (c === BUC_TRANH || CHU_DE_V3.some((x) => x.id === c)) ? c : CHU_DE_V3[0].id;
  });
  const [bai, setBai] = useState<Record<string, TrangThai>>({});
  const [lanBucTranh, setLanBucTranh] = useState(0);

  // Điện thoại: mục lục là hàng chip cuộn ngang — mở thẳng một chủ đề ở cuối
  // danh sách (từ Bản đồ mạnh–yếu) thì chip đang chọn phải cuộn vào tầm nhìn.
  useEffect(() => {
    document
      .querySelector<HTMLElement>(`[data-chu-de="${chon}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [chon, duocVao]);

  /*
   * Chủ đề đang mở chưa có gì và chưa gửi yêu cầu → gửi. Mọi setState nằm trong
   * callback bất đồng bộ của fetch, không trong thân effect (luật lint kho này
   * đang giữ ở mốc bảy lỗi cũ). "Đã gửi" giữ bằng một tập riêng.
   */
  const [daGui] = useState(() => new Set<string>());
  // Chủ đề người đọc vừa bấm "Tạo bản mới" — lượt gửi kế tiếp mang taoMoi
  const [lamMoi] = useState(() => new Set<string>());
  useEffect(() => {
    if (chon === BUC_TRANH || !duocVao || !coLaSo || bai[chon] || daGui.has(chon)) return;
    daGui.add(chon);
    const chuDe = chon;
    const taoMoi = lamMoi.delete(chuDe);
    ghiSuKien('deep_read_cta', { viTri: 'chuyen-sau-v3', chuDe });
    /*
     * HAI LƯỢT NỐI TIẾP (25/09/2026): nửa đầu các câu của chủ đề, rồi nửa sau.
     * Nửa sau được viết khi nửa đầu đã cất, nên sổ ý của route (so-y.ts) cho nó
     * biết các câu anh em đã nói gì — đo lá số A/C: câu lặp ý với câu đã đọc
     * 5–6% → 1–3%. Người đọc cũng thấy bài sớm hơn: nửa đầu hiện sau một lượt,
     * không chờ câu chậm nhất của cả chủ đề. Bài đã đệm thì hai lượt đều tức thì.
     */
    const ids = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === chuDe).map((q) => q.id);
    const giua = ids.length >= 4 ? Math.ceil(ids.length / 2) : ids.length;
    const goi = (chi: string[]) =>
      fetch('/api/luan-giai-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, namXem, nhom: chuDe, chi, taoMoi }),
      }).then(async (res) => ({ ok: res.ok, d: await res.json() }));
    const loiMang = 'Không kết nối được. Thử lại sau ít phút.';
    // Đủ các câu rồi mới xin phần "Tóm lại" — route không viết tóm lại từ bài dở dang
    const layTomLai = () =>
      fetch('/api/luan-giai-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngay, thang, nam, gio, gioiTinh, namXem, nhom: chuDe, tomLai: true, taoMoi }),
      })
        .then((r) => r.json())
        .then((d) => d?.tomLai ?? null)
        .catch(() => null)
        .then((tomLai: string | null) =>
          setBai((cu) => {
            const t = cu[chuDe];
            return t && !t.dang ? { ...cu, [chuDe]: { ...t, tomLai, dangTom: false } } : cu;
          })
        );
    goi(ids.slice(0, giua))
      .then(({ ok, d }) => {
        const conLai = ids.slice(giua);
        setBai((cu) => ({
          ...cu,
          [chuDe]: ok
            ? { dang: false, cau: d.cau as CauV3[], conCho: conLai.length > 0, dangTom: conLai.length === 0, banMoi: Boolean(d.banMoi) }
            : { dang: false, cau: null, loi: d?.loi ?? 'Celes chưa viết được phần này.' },
        }));
        if (ok && !conLai.length) return layTomLai();
        if (!ok) return;
        return goi(conLai).then(({ ok: ok2, d: d2 }) => {
          setBai((cu) => {
            const truoc = cu[chuDe];
            const dau = truoc && !truoc.dang && truoc.cau ? truoc.cau : [];
            return {
              ...cu,
              [chuDe]: {
                dang: false,
                cau: ok2 ? [...dau, ...((d2.cau as CauV3[]) ?? [])] : dau,
                loi: ok2 ? undefined : d2?.loi ?? 'Celes chưa viết xong phần còn lại.',
                dangTom: ok2,
                banMoi: Boolean((truoc && !truoc.dang && truoc.banMoi) || d2?.banMoi),
              },
            };
          });
          if (ok2) return layTomLai();
        });
      })
      .catch(() => {
        setBai((cu) => {
          const truoc = cu[chuDe];
          // Hỏng ở lượt sau thì giữ nửa đầu đã hiện
          if (truoc && !truoc.dang && truoc.cau?.length) return { ...cu, [chuDe]: { dang: false, cau: truoc.cau, loi: loiMang } };
          return { ...cu, [chuDe]: { dang: false, cau: null, loi: loiMang } };
        });
      });
  }, [duocVao, coLaSo, chon, bai, daGui, lamMoi, ngay, thang, nam, gio, gioiTinh, namXem]);

  if (dangDoc) {
    return (
      <Shell className="py-[48px]">
        <span />
      </Shell>
    );
  }

  if (!duocVao) {
    return (
      <Shell className="flex flex-col gap-[16px] py-[32px]">
        {nutVe}
        <div className="card mx-auto flex max-w-[520px] flex-col gap-[12px]">
          <h1 className="heading-sm">Luận giải chuyên sâu cần tài khoản</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Phần tổng quan mở cho mọi người. Đăng nhập để đọc sâu từng chủ đề và để Celes giữ bài
            đọc lại cho bạn.
          </p>
          <Link
            href={`/dang-nhap?intent=deep_read&next=${encodeURIComponent(`/luan-giai/sau?${params.toString()}`)}`}
            className="btn-primary self-start"
          >
            Đăng nhập
          </Link>
        </div>
      </Shell>
    );
  }

  if (!coLaSo) {
    return (
      <Shell className="flex flex-col gap-[16px] py-[32px]">
        {nutVe}
        <div className="card mx-auto flex max-w-[520px] flex-col gap-[12px]">
          <h1 className="heading-sm">Chưa có lá số</h1>
          <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
            Tạo lá số trước rồi quay lại — phần chuyên sâu đọc từ chính lá số đó.
          </p>
        </div>
      </Shell>
    );
  }

  const laBuc = chon === BUC_TRANH;
  const iChon = laBuc ? CHU_DE_V3.length : CHU_DE_V3.findIndex((c) => c.id === chon);
  const chuDe = CHU_DE_V3[Math.min(iChon, CHU_DE_V3.length - 1)];
  const truoc = CHU_DE_V3[iChon - 1];
  const tiep = CHU_DE_V3[iChon + 1];
  // Đường về đúng chủ đề đang đọc — cho các câu "Muốn đi sâu hơn" dẫn sang Hỏi Celes
  const veChuDe = `/luan-giai/sau?${new URLSearchParams({ ...Object.fromEntries(params.entries()), chuDe: chon }).toString()}`;
  const trangThai = bai[chon];
  const soDaDoc = CHU_DE_V3.filter((c) => {
    const tt = bai[c.id];
    return Boolean(tt && !tt.dang && tt.cau);
  }).length;
  const moChuDe = (id: string) => {
    if (id === BUC_TRANH) setLanBucTranh((n) => n + 1);
    setChon(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Nút xuất (chỉ quản trị viên): các chủ đề đã đọc trọn — đủ câu, đã có tóm lại, không lỗi
  const daDocTron: Record<string, BaiDaDoc> = {};
  for (const [id, tt] of Object.entries(bai)) {
    if (!tt.dang && tt.cau && !tt.conCho && !tt.dangTom && !tt.loi) daDocTron[id] = { cau: tt.cau, tomLai: tt.tomLai };
  }
  const daNapKhiXuat = (id: string, b: BaiDaDoc) => {
    daGui.add(id);
    setBai((cu) => (cu[id] && !cu[id].dang ? cu : { ...cu, [id]: { dang: false, cau: b.cau, tomLai: b.tomLai, dangTom: false } }));
  };
  /*
   * TẠO BẢN MỚI (26/09/2026): kho tri thức đã đổi kể từ khi chủ đề này được viết.
   * Route chỉ viết lại những câu viết với kho cũ, mỗi phiên bản kho một lần.
   */
  const taoBanMoi = () => {
    ghiSuKien('deep_read_cta', { viTri: 'tao-ban-moi', chuDe: chon });
    lamMoi.add(chon);
    daGui.delete(chon);
    setBai((cu) => {
      const moi = { ...cu };
      delete moi[chon];
      return moi;
    });
  };
  const thuLai = () => {
    daGui.delete(chon);
    setBai((cu) => {
      const moi = { ...cu };
      delete moi[chon];
      return moi;
    });
  };

  return (
    <Shell className="flex flex-col gap-[16px] py-[24px]">
      {nutVe}
      <div className="flex flex-col gap-[24px] lg:flex-row lg:items-start lg:gap-[32px]">
        {/*
          ---------- Mục lục chủ đề ----------
          Máy tính: một thẻ dọc dính theo khi cuộn, mỗi dòng có số, tên, số câu
          và dấu đã đọc. Điện thoại: một hàng chip cuộn ngang — mười bốn dòng
          dọc đẩy bài đọc xuống dưới cả màn hình đầu.
        */}
        <nav
          aria-label="Chủ đề"
          className="shrink-0 lg:sticky lg:top-[80px] lg:w-[272px] lg:rounded-[var(--radius-cards)] lg:bg-[var(--surface-card)] lg:p-[16px] lg:shadow-[var(--shadow-card)]"
        >
          <div className="mb-[12px] flex items-baseline justify-between gap-[8px] lg:px-[8px]">
            <Eyebrow>Chủ đề</Eyebrow>
            <span className="caption" style={{ color: 'var(--fg-muted)' }}>
              Đã đọc {soDaDoc}/{CHU_DE_V3.length}
            </span>
          </div>
          <ol className="-mx-[16px] flex gap-[8px] overflow-x-auto px-[16px] pb-[4px] lg:mx-0 lg:flex-col lg:gap-[4px] lg:overflow-visible lg:px-0 lg:pb-0">
            {CHU_DE_V3.map((c, i) => {
              const tt = bai[c.id];
              const daDoc = Boolean(tt && !tt.dang && tt.cau);
              const dangMo = chon === c.id;
              return (
                <li key={c.id} className="shrink-0" data-chu-de={c.id}>
                  <button
                    type="button"
                    onClick={() => moChuDe(c.id)}
                    aria-current={dangMo ? 'true' : undefined}
                    className="flex w-full items-center gap-[12px] whitespace-nowrap rounded-full border px-[12px] py-[8px] text-left text-[14px] transition-colors lg:whitespace-normal lg:rounded-[12px] lg:border-0"
                    style={{
                      borderColor: dangMo ? 'var(--accent)' : 'var(--line)',
                      background: dangMo ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      color: dangMo ? 'var(--fg)' : 'var(--fg-muted)',
                      fontWeight: dangMo ? 600 : 400,
                    }}
                  >
                    <span
                      className="inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                      style={
                        dangMo
                          ? { background: 'var(--accent)', color: 'var(--action-fg)' }
                          : daDoc
                            ? { background: 'var(--surface-panel)', color: 'var(--ok-fg)' }
                            : { border: '1px solid var(--line)', color: 'var(--fg-muted)' }
                      }
                      aria-hidden
                    >
                      {daDoc && !dangMo ? '✓' : i + 1}
                    </span>
                    <span className="flex-1">{c.ten}</span>
                    <span className="caption hidden lg:inline" style={{ color: 'var(--fg-muted)' }}>
                      {SO_CAU.get(c.id)} câu
                    </span>
                  </button>
                </li>
              );
            })}
            <li className="shrink-0" data-chu-de={BUC_TRANH}>
              <button
                type="button"
                onClick={() => moChuDe(BUC_TRANH)}
                aria-current={laBuc ? 'true' : undefined}
                className="flex w-full items-center gap-[12px] whitespace-nowrap rounded-full border px-[12px] py-[8px] text-left text-[14px] transition-colors lg:mt-[8px] lg:whitespace-normal lg:rounded-[12px] lg:border-0"
                style={{
                  borderColor: laBuc ? 'var(--accent)' : 'var(--line)',
                  background: laBuc ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  color: laBuc ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: laBuc ? 600 : 500,
                }}
              >
                <span
                  className="inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[13px]"
                  style={laBuc ? { background: 'var(--accent)', color: 'var(--action-fg)' } : { border: '1px solid var(--line)', color: 'var(--accent)' }}
                  aria-hidden
                >
                  ✦
                </span>
                <span className="flex-1">Bức tranh lớn</span>
              </button>
            </li>
          </ol>
        </nav>

        {/* ---------- Bài của chủ đề đang mở ---------- */}
        <main className="flex min-w-0 flex-1 flex-col gap-[24px] lg:max-w-[700px]">
          <header className="flex flex-col items-start gap-[12px]">
            <div className="flex w-full flex-wrap items-center justify-between gap-[12px]">
              <span
                className="inline-flex items-center gap-[8px] rounded-full px-[12px] py-[4px] text-[13px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                Luận giải chuyên sâu · Năm xem {namXem}
              </span>
              <XuatLuanGiai
                thongTin={{ ngay, thang, nam, gio, gioiTinh, namXem, ten: params.get('ten') ?? '' }}
                chuDeDangXem={laBuc ? null : chuDe.id}
                daDoc={daDocTron}
                danChuDe={DAN_CHU_DE}
                onDaNap={daNapKhiXuat}
              />
            </div>
            <h1 className="heading">{laBuc ? 'Bức tranh lớn của cuộc đời bạn' : chuDe.ten}</h1>
            <p className="body-text max-w-[620px]" style={{ color: 'var(--fg-muted)' }}>
              {laBuc
                ? 'Đây là kiểu cuộc đời nào, lợi thế lớn nhất và bài toán cứ lặp lại là gì, các mặt đời nối với nhau ra sao — và bạn đang đứng ở đâu.'
                : DAN_CHU_DE[chuDe.id]}
            </p>
            {/* Sức khỏe: MỘT dòng lưu ý ở đầu chủ đề thay cho câu an toàn gắn vào từng câu (26/09/2026) */}
            {!laBuc && chuDe.id === 'suc-khoe' && (
              <p className="caption max-w-[620px]">
                Đây là dự đoán xu hướng từ lá số để bạn lưu ý — không thay cho khám và chẩn đoán y khoa.
              </p>
            )}
          </header>

          {laBuc && (
            <BucTranhLon
              key={lanBucTranh}
              thongTin={{ ngay, thang, nam, gio, gioiTinh, namXem }}
              onMoChuDe={() => moChuDe(CHU_DE_V3[0].id)}
            />
          )}

          {laBuc ? null : !trangThai || trangThai.dang ? (
            <DangDocV3 key={chon} />
          ) : trangThai.cau ? (
            <div className="flex flex-col gap-[32px]">
              {trangThai.cau.map((c, i) => (
                <CauTraLoiV3 key={c.id} cau={c} so={i + 1} />
              ))}
              {/* Nửa sau của chủ đề còn đang viết — nửa đầu đã đọc được */}
              {trangThai.conCho && <DangDocV3 key={`${chon}-tiep`} chu="Celes đang viết tiếp các câu còn lại" />}
              {/* TÓM LẠI: ghép các câu thành một câu chuyện (review 25/09/2026) — đặt trước phần gợi ý */}
              {!trangThai.conCho && (trangThai.dangTom || trangThai.tomLai) && (
                <section className="card flex flex-col gap-[12px]" style={{ borderTop: '3px solid var(--accent)' }} aria-labelledby="tom-lai">
                  <span className="eyebrow">Tóm lại</span>
                  <h2 id="tom-lai" className="text-[20px] font-semibold leading-snug" style={{ color: 'var(--fg)' }}>
                    {chuDe.ten} của bạn, gói trong một đoạn
                  </h2>
                  {trangThai.tomLai ? (
                    trangThai.tomLai
                      .split(/\n\s*\n/)
                      .filter((x) => x.trim())
                      .map((d, i) => (
                        <p key={i} className="body-text" style={{ color: 'var(--fg)' }}>
                          {d}
                        </p>
                      ))
                  ) : (
                    <DangDocV3 key={`${chon}-tom`} chu="Celes đang ghép các câu thành một câu chuyện" />
                  )}
                </section>
              )}
              {!trangThai.conCho && <GoiYCeles cau={trangThai.cau} moTa={`Rút ra từ các câu của phần ${chuDe.ten.toLowerCase()}.`} />}
              {!trangThai.conCho && <DiSauHon chuDe={chuDe.id} ve={veChuDe} />}
              {!trangThai.conCho && trangThai.banMoi && (
                <div className="card flex flex-col gap-[8px]">
                  <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                    Kho tri thức của Celes vừa được cập nhật sau khi phần này được viết. Bạn có thể để Celes viết lại theo kho mới — mỗi lần kho cập nhật chỉ viết lại một lần.
                  </p>
                  <button type="button" onClick={taoBanMoi} className="btn-outline btn-sm self-start">
                    Tạo bản mới
                  </button>
                </div>
              )}
              {trangThai.loi && (
                <div className="flex flex-col gap-[12px]">
                  <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                    {trangThai.loi}
                  </p>
                  <button type="button" className="btn-outline btn-sm self-start" onClick={thuLai}>
                    Thử lại phần còn lại
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              <p className="body-sm" style={{ color: 'var(--chart-hung)' }}>
                {trangThai.loi}
              </p>
              <button type="button" className="btn-outline btn-sm self-start" onClick={thuLai}>
                Thử lại
              </button>
            </div>
          )}

          {/* Cuối bài: lùi về chủ đề trước (viền) và đi tiếp (nút chính duy nhất) */}
          {laBuc && (
            <div className="flex flex-wrap items-center gap-[12px] pt-[24px]" style={{ borderTop: '1px solid var(--line)' }}>
              <button type="button" className="btn-outline" onClick={() => moChuDe(CHU_DE_V3[CHU_DE_V3.length - 1].id)}>
                ← Đọc lại: {CHU_DE_V3[CHU_DE_V3.length - 1].ten}
              </button>
            </div>
          )}
          {!laBuc && trangThai && !trangThai.dang && !trangThai.conCho && (truoc || tiep || iChon === CHU_DE_V3.length - 1) && (
            <div
              className="flex flex-wrap items-center gap-[12px] pt-[24px]"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              {truoc && (
                <button type="button" className="btn-outline" onClick={() => moChuDe(truoc.id)}>
                  ← Đọc lại: {truoc.ten}
                </button>
              )}
              {tiep ? (
                <button type="button" className="btn-primary" onClick={() => moChuDe(tiep.id)}>
                  Đọc tiếp: {tiep.ten} →
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => moChuDe(BUC_TRANH)}>
                  Xem bức tranh lớn →
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </Shell>
  );
}

export default function TrangLuanGiaiChuyenSau() {
  return (
    <Suspense fallback={<Shell className="py-[40px]">Đang mở bài đọc…</Shell>}>
      <TrangSau />
    </Suspense>
  );
}
