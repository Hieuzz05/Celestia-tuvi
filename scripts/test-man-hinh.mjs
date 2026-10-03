/**
 * Đo bố cục ở nhiều cỡ màn — node scripts/test-man-hinh.mjs
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO ĐO BẰNG TRÌNH DUYỆT THẬT
 *
 * Bản rà trước đó đếm lớp breakpoint trong mã nguồn và kết luận mệnh bàn "giữ
 * 460px rồi cho vuốt ngang — một đánh đổi có chủ ý". Chủ dự án mở bằng điện
 * thoại và gửi ảnh: mệnh bàn mất gần một nửa. Đọc mã đúng từng dòng vẫn trả
 * lời sai câu hỏi "người dùng nhìn thấy gì", vì câu ấy chỉ trả lời được bằng
 * cách dựng trang lên rồi đo.
 *
 * ---------------------------------------------------------------------------
 * CÁCH CHẠY
 *
 *   1) npm run dev   — .env.local CÓ ĐỦ NEXT_PUBLIC_SUPABASE_* (Supabase thật)
 *   2) chrome --headless --remote-debugging-port=9333 --remote-allow-origins='*'
 *        --user-data-dir=<một thư mục tạm MỚI>   (hồ sơ sạch: chưa đăng nhập)
 *   3) node scripts/test-man-hinh.mjs
 *
 * Đo ở trạng thái KHÁCH, vì khách là người thấy sản phẩm lần đầu. Mẹo cũ "để
 * trống NEXT_PUBLIC_SUPABASE_*" biến mọi người thành admin (entitlements.ts),
 * và đã che mất thanh điều hướng tràn 404px trên iPhone với khách (23/09) —
 * nút "Đăng nhập" chỉ hiện khi Supabase bật. Nên script DỪNG nếu thấy trang
 * đang ở trạng thái admin hay đã đăng nhập, thay vì đo sai mà vẫn xanh.
 *
 * Kết quả ngoài các dòng OK/SAI:
 *   - ảnh toàn trang mỗi trang × cỡ màn ở .anh-man-hinh/<thời gian>/ (đổi
 *     bằng THU_MUC_ANH), để AI hay người mở ra xem lại;
 *   - CLS đo trên `next dev`: con số có thể khác bản production, nhưng một
 *     khối chờ thấp vài chục px thì dev hay prod đều làm nhảy như nhau.
 *
 * Chưa đưa vào CI (docs/chien-luoc/cong-cu-thiet-ke-2026-10.md): cần Supabase
 * thật, tức là cần mạng và secret. Luật cần soát kèm: docs/thiet-ke/celes-ui-quality-checklist.md
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDP_PORT = Number(process.env.CDP_PORT ?? 9333);
const GOC = process.env.GOC_TEST ?? 'http://localhost:3000';
const THU_MUC_ANH = resolve(
  process.env.THU_MUC_ANH ??
    join(dirname(fileURLToPath(import.meta.url)), '..', '.anh-man-hinh', new Date().toISOString().replace(/[:.]/g, '-'))
);

/** Bốn cỡ phải đi qua. deviceScaleFactor và mobile đổi cả cách trình duyệt bố trí. */
const MAY = [
  { ten: 'iPhone 12/13/14', rong: 390, cao: 844, dsf: 3, mobile: true },
  { ten: 'iPad dọc', rong: 820, cao: 1180, dsf: 2, mobile: true },
  { ten: 'iPad ngang', rong: 1180, cao: 820, dsf: 2, mobile: true },
  { ten: 'Laptop', rong: 1440, cao: 900, dsf: 1, mobile: false },
];

/** Trang khách đi qua. /hoi-dap và /luan-giai với khách là màn chắn đăng nhập — đúng thứ khách thấy. */
const TRANG = ['/', '/la-so?mau=1', '/gioi-thieu', '/hoi-dap', '/luan-giai'];

/** Tab riêng cho mỗi lần chạy, đóng khi xong — không mượn tab người dùng đang mở. */
async function moTab() {
  let res;
  try {
    res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
  } catch {
    throw new Error(`Không nối được Chrome ở cổng ${CDP_PORT}. Đã mở với --remote-debugging-port chưa?`);
  }
  return res.json();
}

function noi(url) {
  return new Promise((ok, loi) => {
    const ws = new WebSocket(url);
    const cho = new Map();
    let id = 0;
    ws.onopen = () =>
      ok({
        goi: (method, params = {}) =>
          new Promise((r, hong) => {
            const n = ++id;
            cho.set(n, (m) => (m.error ? hong(new Error(`${method}: ${m.error.message}`)) : r(m.result)));
            ws.send(JSON.stringify({ id: n, method, params }));
          }),
        dong: () => ws.close(),
      });
    ws.onerror = loi;
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && cho.has(m.id)) {
        cho.get(m.id)(m);
        cho.delete(m.id);
      }
    };
  });
}

/*
 * Đo NHỮNG THỨ NGƯỜI DÙNG THẤY, không đo thuộc tính CSS.
 *
 * `scrollWidth > innerWidth` là định nghĩa của "trang bị tràn ngang" — nó đúng
 * bất kể tràn do nguyên nhân gì, nên không phải đoán trước xem chỗ nào có thể
 * hỏng. Mệnh bàn đo bằng hình chữ nhật thật sau khi đã nhân tỉ lệ zoom.
 */
const DO = `(() => {
  const r = {
    rongCuaSo: window.innerWidth,
    caoCuaSo: window.innerHeight,
    scrollNgang: document.documentElement.scrollWidth,
  };
  const header = document.querySelector('header');
  if (header) r.caoHeader = Math.round(header.getBoundingClientRect().height);
  const ban = document.querySelector('.grid.grid-cols-4');
  if (ban) {
    const b = ban.getBoundingClientRect();
    r.rongMenhBan = Math.round(b.width);
    r.traiMenhBan = Math.round(b.left);
    r.phaiMenhBan = Math.round(b.right);
  }
  /*
   * Hai phép đo về CHỮ TRONG Ô CUNG.
   *
   * Mệnh bàn vừa màn chưa có nghĩa là đọc được. Bản trước vừa màn nhờ ép tỉ lệ
   * xuống 0.37, và cái giá là tôi tự tắt bớt phụ tinh — chủ dự án mở lên thấy
   * lá số mất sạch sao phụ. Nên phải đo cả ba thứ cùng lúc: vừa màn, đủ sao,
   * và chữ không bị cắt.
   *
   * "oTran": nội dung rộng hơn ô, tức là chữ tràn ra ngoài viền.
   * "tenGay": một tên hai chữ bị cắt làm hai dòng — "Tham" một dòng, "Lang"
   * dòng dưới. Nhận ra bằng chiều cao lớn hơn 1,7 lần cỡ chữ.
   */
  const oCung = ban ? [...ban.children].filter((e) => e.className.includes('cursor-pointer')) : [];
  r.soOCung = oCung.length;
  r.oTran = oCung.filter((e) => e.scrollWidth > e.clientWidth + 1).length;
  /*
   * Ba nhóm sao nhỏ phải CÙNG MỘT CỠ CHỮ.
   *
   * Phụ tinh, vòng Thái Tuế/Lộc Tồn và lưu tinh trước dùng ba cỡ rời nhau
   * (12 / 11 / 11). Trên điện thoại phụ tinh xuống 8px còn hai nhóm kia vẫn
   * 11px, nên nhóm ít quan trọng nhất lại hiện TO HƠN nhóm quan trọng hơn nó.
   * Cỡ chữ là cách người đọc đoán thứ bậc, nên để lệch là nói sai thứ bậc.
   */
  const coSaoNho = new Set(
    [...document.querySelectorAll('[data-sao="phu"]')].map((e) => window.getComputedStyle(e).fontSize)
  );
  r.soCoSaoNho = coSaoNho.size;
  r.coSaoNho = [...coSaoNho].join(', ');

  r.tenGay = 0;
  for (const o of oCung) {
    for (const sp of o.querySelectorAll('span')) {
      const txt = sp.textContent.trim();
      if (!txt.includes(' ') || txt.length > 16) continue;
      const cs = window.getComputedStyle(sp);
      if (sp.getBoundingClientRect().height > parseFloat(cs.fontSize) * 1.7) r.tenGay += 1;
    }
  }

  // Mọi phần tử thò ra khỏi mép phải khung nhìn
  r.thoRa = [...document.querySelectorAll('body *')]
    .filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.right > window.innerWidth + 1;
    })
    .slice(0, 5)
    .map((e) => e.tagName.toLowerCase() + '.' + (e.className?.toString?.().slice(0, 40) ?? ''));
  return r;
})()`;

/*
 * P2 — TRẠNG THÁI KHÁCH, hỏi thẳng máy chủ.
 *
 * Header không có dấu hiệu nào phân biệt "khách" với "Supabase tắt": tắt thì
 * nút Đăng nhập biến mất và header trông như khách, nhưng quyền là admin. Nên
 * hỏi đúng nguồn quyền mà giao diện đọc: /api/entitlements/me. Khách là tier
 * 'anonymous'. Logo trỏ /home chỉ khi đã đăng nhập (SiteNav) — dùng nó để tách
 * hai trường hợp admin. Đừng dùng .pill-tag[aria-haspopup=menu]: nút đổi ngôn
 * ngữ của khách cũng mang đúng dấu đó (đã bắt nhầm ở lần chạy đầu).
 */
const TRANG_THAI = `(async () => {
  const q = await fetch('/api/entitlements/me', { cache: 'no-store' })
    .then((r) => r.json()).catch(() => ({ tier: 'lỗi khi đọc /api/entitlements/me' }));
  return { tier: q.tier, daDangNhap: !!document.querySelector('header a[aria-label="Celestia"][href="/home"]') };
})()`;

/*
 * P4 — VÙNG CHẠM, theo đúng hợp đồng trong app/globals.css (chỉ ở pointer: coarse).
 *
 * Ba loại, không gộp được vào một phép đo:
 *   - nút, .link-action, .btn-*, ô nhập, điều khiển đứng riêng: HỘP DOM thật cao
 *     ≥ 44px (hợp đồng .link-action là min-height; bề ngang chữ do nội dung);
 *   - .nav-link / .link-text: hộp chữ cố ý chỉ 30–34px (nới padding thì gạch
 *     chân rời chữ), vùng bấm là ::after cao 44px. Đo ::after, KHÔNG đo hộp
 *     chữ — đo hộp chữ sẽ báo SAI cả sản phẩm và dạy người sửa nới padding;
 *   - link nằm giữa câu văn: không áp 44px, nếu không nó phá nhịp dòng.
 * Hai loại lỗi báo tách nhau để người sửa biết lỗi ở phần tử hay ở CSS ::after.
 */
const VUNG_CHAM = (goc) => `(() => {
  const goc = ${goc ? `document.querySelector(${JSON.stringify(goc)})` : 'document.body'};
  if (!goc) return { khongThay: true };
  const hop = [], gia = [];
  const moTa = (e) => {
    const lop = [...e.classList].filter((c) => /^(pill-tag|btn-|nav-link|link-text|link-action)/.test(c)).join('.');
    const chu = (e.textContent || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 24);
    return e.tagName.toLowerCase() + (lop ? '.' + lop : '') + (chu ? ' "' + chu + '"' : '');
  };
  const dangHien = (e) => {
    const b = e.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && !e.closest('[aria-hidden="true"]');
  };
  // Link giữa câu: khối chứa nó còn chữ khác ngoài chính nó
  const giuaCau = (a) => {
    const p = a.closest('p, li, dd, td, blockquote, figcaption');
    if (!p || getComputedStyle(a).display !== 'inline') return false;
    return p.textContent.replace(/\\s+/g, '').length > a.textContent.replace(/\\s+/g, '').length;
  };
  const nutHop = 'button, [role="button"], input:not([type="hidden"]), select, textarea, summary, .link-action, [class*="btn-"]';
  for (const e of goc.querySelectorAll('a[href], ' + nutHop)) {
    if (!dangHien(e) || e.disabled) continue;
    if (!e.matches('.link-action, [class*="btn-"]') && e.matches('.nav-link, .link-text')) {
      const s = getComputedStyle(e, '::after');
      const cao = parseFloat(s.height) || 0;
      if (s.content === 'none' || s.position !== 'absolute' || cao < 44)
        gia.push(moTa(e) + ' ::after ' + (s.content === 'none' ? 'không có' : Math.round(cao) + 'px'));
      continue;
    }
    if (e.tagName === 'A' && !e.matches(nutHop) && giuaCau(e)) continue;
    const b = e.getBoundingClientRect();
    if (b.height < 44) hop.push(moTa(e) + ' cao ' + Math.round(b.height) + 'px');
  }
  return { hop, gia };
})()`;

/*
 * P5 — CLS theo đúng định nghĩa Core Web Vitals: cửa sổ phiên LỚN NHẤT, không
 * phải tổng mọi lần dịch. Một cửa sổ đóng khi hai lần dịch cách nhau > 1 giây
 * hoặc cửa sổ đã dài 5 giây; lần dịch ngay sau thao tác (hadRecentInput) bỏ.
 * Ảnh tĩnh không thấy được CLS: /la-so từng 0,34 (27/09) mà ảnh vẫn đẹp.
 */
const CLS = `new Promise((xong) => {
  const ds = [];
  const po = new PerformanceObserver((l) => ds.push(...l.getEntries()));
  po.observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => {
    ds.push(...po.takeRecords());
    po.disconnect();
    ds.sort((a, b) => a.startTime - b.startTime);
    const ten = (e) => {
      const n = e.sources?.find((s) => s.node)?.node;
      const lop = n?.className?.toString?.().split(' ')[0];
      return n ? n.nodeName.toLowerCase() + (lop ? '.' + lop : '') : '';
    };
    let lonNhat = 0, nguon = '', phien = 0, dau = 0, cuoi = 0, dichLon = 0, nguonPhien = '';
    for (const e of ds) {
      if (e.hadRecentInput) continue;
      if (phien && (e.startTime - cuoi > 1000 || e.startTime - dau > 5000)) {
        phien = 0;
        dichLon = 0;
      }
      if (!phien) dau = e.startTime;
      phien += e.value;
      cuoi = e.startTime;
      if (e.value > dichLon) {
        dichLon = e.value;
        nguonPhien = ten(e);
      }
      if (phien > lonNhat) {
        lonNhat = phien;
        nguon = nguonPhien;
      }
    }
    xong({ cls: lonNhat, nguon });
  }, 200);
})`;

let sai = 0;
function kiem(ten, dat, chiTiet) {
  if (!dat) sai += 1;
  console.log(`    ${dat ? 'OK  ' : 'SAI '} ${ten}${chiTiet !== undefined ? ` — ${chiTiet}` : ''}`);
}

/** Gộp phần tử trùng mô tả, để một nút lặp 12 lần không chiếm 12 dòng. */
function gon(ds, toiDa = 6) {
  const dem = new Map();
  for (const x of ds) dem.set(x, (dem.get(x) ?? 0) + 1);
  const dong = [...dem].map(([x, n]) => (n > 1 ? `${x} (${n} chỗ)` : x));
  return dong.slice(0, toiDa).join(' | ') + (dong.length > toiDa ? ` | …+${dong.length - toiDa}` : '');
}

function kiemVungCham(v) {
  kiem('Vùng chạm — hộp DOM cao ≥ 44px', v.hop.length === 0, v.hop.length ? gon(v.hop) : undefined);
  kiem('Vùng chạm — ::after của .nav-link/.link-text ≥ 44px', v.gia.length === 0, v.gia.length ? gon(v.gia) : undefined);
}

const danhGia = async (c, bieuThuc) =>
  (await c.goi('Runtime.evaluate', { expression: bieuThuc, returnByValue: true, awaitPromise: true })).result.value;

// Đóng tab trước khi thoát: Chrome headless chạy lâu, tab bỏ lại sẽ tích dần.
async function dungLai(thongBao) {
  console.error(`\nDỪNG — ${thongBao}\n`);
  await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${tab.id}`).catch(() => {});
  process.exit(2);
}

/*
 * P3 — ảnh TOÀN TRANG, không chỉ khung nhìn: lấy chiều cao nội dung thật rồi
 * chụp với captureBeyondViewport. Chụp theo pixel CSS (scale = 1/dsf): ảnh
 * 390px × dsf 3 của một trang dài vượt 20.000px, quá cỡ để mở ra xem. Trả về
 * kích thước đọc từ đầu tệp PNG để tự kiểm ảnh dài đúng bằng trang.
 */
async function chup(c, m, ten) {
  const { cssContentSize: kt } = await c.goi('Page.getLayoutMetrics');
  const { data } = await c.goi('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: Math.ceil(kt.width), height: Math.ceil(kt.height), scale: 1 / m.dsf },
  });
  const buf = Buffer.from(data, 'base64');
  writeFileSync(join(THU_MUC_ANH, ten), buf);
  return { rong: buf.readUInt32BE(16), cao: buf.readUInt32BE(20), caoTrang: Math.ceil(kt.height) };
}

const tab = await moTab();
const c = await noi(tab.webSocketDebuggerUrl);
await c.goi('Page.enable');
/*
 * Đo bằng tiếng Việt như người dùng thật. Chrome headless mặc định en, và chữ
 * dài ngắn khác là bố cục khác. Giao diện chọn ngôn ngữ theo navigator.languages
 * (lib/i18n/context.tsx), thứ mà acceptLanguage điều khiển.
 */
const { userAgent } = await c.goi('Browser.getVersion');
await c.goi('Emulation.setUserAgentOverride', { userAgent, acceptLanguage: 'vi-VN,vi' });
await c.goi('Runtime.enable');
mkdirSync(THU_MUC_ANH, { recursive: true });

// P2: kiểm MỘT lần trước khi đo gì — sai trạng thái thì mọi con số sau đều vô nghĩa
await c.goi('Page.navigate', { url: GOC + '/' });
await new Promise((r) => setTimeout(r, 2500));
const tt = await danhGia(c, TRANG_THAI);
if (tt.tier !== 'anonymous') {
  if (tt.daDangNhap)
    await dungLai(`trang đang ĐĂNG NHẬP (tier ${tt.tier}). Mở Chrome với --user-data-dir là một thư mục tạm mới.`);
  if (tt.tier === 'admin')
    await dungLai('Supabase đang TẮT nên ai cũng là admin. Điền NEXT_PUBLIC_SUPABASE_* vào .env.local rồi chạy lại npm run dev.');
  await dungLai(`trạng thái không phải khách (tier ${tt.tier}).`);
}
console.log(`Trạng thái: khách (tier anonymous). Ảnh lưu ở: ${THU_MUC_ANH}`);

for (const m of MAY) {
  console.log(`\n== ${m.ten} (${m.rong}x${m.cao}) ==`);
  await c.goi('Emulation.setDeviceMetricsOverride', {
    width: m.rong,
    height: m.cao,
    deviceScaleFactor: m.dsf,
    mobile: m.mobile,
  });
  // Bật cảm ứng thì (pointer: coarse) khớp — điều kiện để ::after 44px có mặt
  await c.goi('Emulation.setTouchEmulationEnabled', m.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });

  for (const t of TRANG) {
    await c.goi('Page.navigate', { url: GOC + t });
    // Chờ mệnh bàn dựng xong và ResizeObserver chạy một vòng
    await new Promise((r) => setTimeout(r, 2500));
    const d = await danhGia(c, DO);
    console.log(`  ${t}`);

    // Kiểm lại ở mỗi trang: một lần đăng nhập giữa chừng không được lẫn vào số đo
    if ((await danhGia(c, TRANG_THAI)).daDangNhap) await dungLai(`ở ${t} header là của người đã đăng nhập — không còn là khách.`);

    /*
     * PHÉP ĐO QUAN TRỌNG NHẤT, và là chỗ bản đầu của bộ này SAI.
     *
     * Bản đầu so `scrollWidth` với `innerWidth`. Nhưng khi nội dung rộng hơn
     * màn, trình duyệt di động THU NHỎ cả trang cho vừa, và lúc ấy `innerWidth`
     * tự nở ra theo nội dung — nên hai con số cùng thành 945 và phép so xanh
     * đẹp trong khi người dùng đang nhìn một trang bị bóp lại.
     *
     * Đo đúng là so với bề ngang THẬT của máy. `innerWidth` khác nó nghĩa là
     * trang đã bị thu nhỏ, và đó chính là thứ người dùng gửi ảnh phàn nàn.
     */
    kiem('Khung nhìn đúng bề ngang máy (trang không bị bóp)', d.rongCuaSo === m.rong, `${d.rongCuaSo} / ${m.rong}`);
    kiem('Trang không tràn ngang', d.scrollNgang <= m.rong + 1, `${d.scrollNgang} / ${m.rong}`);
    kiem('Không phần tử nào thò khỏi mép phải', (d.thoRa ?? []).length === 0, (d.thoRa ?? []).join(' | '));
    if (d.caoHeader !== undefined) {
      // Header dính: quá 1/6 chiều cao màn là nó ăn mất phần đọc
      kiem('Header không chiếm quá 1/6 màn', d.caoHeader <= m.cao / 6, `${d.caoHeader}px / ${Math.round(m.cao / 6)}px`);
    }
    if (d.rongMenhBan !== undefined) {
      // Cũng so với bề ngang máy, không so với innerWidth — cùng lý do ở trên
      kiem('Mệnh bàn nằm trọn trong khung nhìn', d.phaiMenhBan <= m.rong + 1, `mép phải ${d.phaiMenhBan} / ${m.rong}`);
      kiem('Đủ 12 cung', d.soOCung === 12, d.soOCung);
      kiem('Không ô cung nào bị tràn chữ', d.oTran === 0, `${d.oTran}/12 ô`);
      kiem('Không tên sao nào bị cắt làm hai dòng', d.tenGay === 0, `${d.tenGay} tên`);
      kiem('Mọi sao nhỏ cùng một cỡ chữ', d.soCoSaoNho === 1, d.coSaoNho);
    }

    // CLS đo TRƯỚC mọi thao tác và trước khi chụp: chụp toàn trang có thể tự làm dịch bố cục
    const { cls, nguon } = await danhGia(c, CLS);
    kiem('CLS (cửa sổ phiên lớn nhất) ≤ 0,1', cls <= 0.1, `${cls.toFixed(3)}${nguon ? `, dịch nhiều nhất: ${nguon}` : ''}`);

    if (m.mobile) {
      if (!(await danhGia(c, `matchMedia('(pointer: coarse)').matches`)))
        await dungLai('đã bật cảm ứng mà (pointer: coarse) vẫn không khớp — phép đo vùng chạm sẽ sai.');
      kiemVungCham(await danhGia(c, VUNG_CHAM()));
    }

    const ten = `${m.rong}-${t.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'trang-chu'}.png`;
    const a = await chup(c, m, ten);
    kiem('Ảnh toàn trang dài đúng bằng trang', Math.abs(a.cao - a.caoTrang) <= 2, `${ten} ${a.rong}×${a.cao}, trang cao ${a.caoTrang}`);

    /*
     * Panel Menu ở màn hẹp chỉ dựng khi bấm. Không mở thì phép đo vùng chạm bỏ
     * sót đúng chỗ điều hướng chính trên điện thoại, kể cả nút theme/ngôn ngữ.
     */
    if (t === '/' && m.mobile && m.rong < 1024) {
      await danhGia(c, `document.querySelector('button[aria-controls="menu-dieu-huong"]')?.click()`);
      await new Promise((r) => setTimeout(r, 400));
      const v = await danhGia(c, VUNG_CHAM('#menu-dieu-huong'));
      console.log('  / (panel Menu đang mở)');
      if (v.khongThay) kiem('Panel Menu mở được', false, 'không thấy #menu-dieu-huong');
      else {
        kiemVungCham(v);
        await chup(c, m, `${m.rong}-trang-chu-menu.png`);
      }
    }
  }
}

await c.goi('Emulation.clearDeviceMetricsOverride');
c.dong();
await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${tab.id}`).catch(() => {});
console.log(`\nẢnh: ${THU_MUC_ANH}`);
console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
