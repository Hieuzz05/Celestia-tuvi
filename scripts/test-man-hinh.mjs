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
 *   1) npm run dev                          (cổng 3000)
 *   2) chrome --headless --remote-debugging-port=9333 --remote-allow-origins='*'
 *   3) node scripts/test-man-hinh.mjs
 *
 * Mệnh bàn đầy đủ nằm sau cổng đăng nhập, nên chạy dev server với hai biến
 * NEXT_PUBLIC_SUPABASE_* để trống thì sản phẩm không có tài khoản nào và mệnh
 * bàn mở thẳng — cùng mẹo mà test-hover-nhay.mjs đang dùng.
 */

const CDP_PORT = Number(process.env.CDP_PORT ?? 9333);
const GOC = process.env.GOC_TEST ?? 'http://localhost:3000';

/** Bốn cỡ phải đi qua. deviceScaleFactor và mobile đổi cả cách trình duyệt bố trí. */
const MAY = [
  { ten: 'iPhone 12/13/14', rong: 390, cao: 844, dsf: 3, mobile: true },
  { ten: 'iPad dọc', rong: 820, cao: 1180, dsf: 2, mobile: true },
  { ten: 'iPad ngang', rong: 1180, cao: 820, dsf: 2, mobile: true },
  { ten: 'Laptop', rong: 1440, cao: 900, dsf: 1, mobile: false },
];

const TRANG = ['/', '/la-so?mau=1', '/hoi-dap', '/luan-giai'];

async function moTab() {
  const ds = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const tab = ds.find((t) => t.type === 'page');
  if (!tab) throw new Error('Không thấy tab nào. Chrome đã mở với --remote-debugging-port chưa?');
  return tab.webSocketDebuggerUrl;
}

function noi(url) {
  return new Promise((ok, loi) => {
    const ws = new WebSocket(url);
    const cho = new Map();
    let id = 0;
    ws.onopen = () =>
      ok({
        goi: (method, params = {}) =>
          new Promise((r) => {
            const n = ++id;
            cho.set(n, r);
            ws.send(JSON.stringify({ id: n, method, params }));
          }),
        dong: () => ws.close(),
      });
    ws.onerror = loi;
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && cho.has(m.id)) {
        cho.get(m.id)(m.result);
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

let sai = 0;
function kiem(ten, dat, chiTiet) {
  if (!dat) sai += 1;
  console.log(`    ${dat ? 'OK  ' : 'SAI '} ${ten}${chiTiet !== undefined ? ` — ${chiTiet}` : ''}`);
}

const c = await noi(await moTab());
await c.goi('Page.enable');
await c.goi('Runtime.enable');

for (const m of MAY) {
  console.log(`\n== ${m.ten} (${m.rong}x${m.cao}) ==`);
  await c.goi('Emulation.setDeviceMetricsOverride', {
    width: m.rong,
    height: m.cao,
    deviceScaleFactor: m.dsf,
    mobile: m.mobile,
  });

  for (const t of TRANG) {
    await c.goi('Page.navigate', { url: GOC + t });
    // Chờ mệnh bàn dựng xong và ResizeObserver chạy một vòng
    await new Promise((r) => setTimeout(r, 2500));
    const { result } = await c.goi('Runtime.evaluate', { expression: DO, returnByValue: true });
    const d = result.value;
    console.log(`  ${t}`);

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
    }
  }
}

await c.goi('Emulation.clearDeviceMetricsOverride');
c.dong();
console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
