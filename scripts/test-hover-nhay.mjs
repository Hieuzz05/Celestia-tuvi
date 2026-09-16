/**
 * Phát hiện mệnh bàn nhấp nháy khi rê chuột.
 *
 * Cách làm: mở trang bằng Chrome DevTools Protocol, rê chuột qua nhiều ô cung
 * rồi đo kích thước mệnh bàn sau mỗi lần. Kích thước dao động = layout đang bị
 * tính lại liên tục, đó chính là hiện tượng nhấp nháy người dùng nhìn thấy.
 *
 * Chạy: node scripts/test-hover-nhay.mjs
 * Cần: dev server ở cổng 3000 và Chrome headless mở cổng 9333.
 */

const CDP_PORT = 9333;
const TRANG = 'http://localhost:3000';

async function moTab() {
  const res = await fetch(`http://localhost:${CDP_PORT}/json/new?${encodeURIComponent(TRANG)}`, {
    method: 'PUT',
  });
  return res.json();
}

function taoKetNoi(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const cho = new Map();

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && cho.has(msg.id)) {
      cho.get(msg.id)(msg);
      cho.delete(msg.id);
    }
  });

  const sanSang = new Promise((res) => ws.addEventListener('open', res));

  const goi = (method, params = {}) =>
    new Promise((res) => {
      const thisId = ++id;
      cho.set(thisId, res);
      ws.send(JSON.stringify({ id: thisId, method, params }));
    });

  return { sanSang, goi, dong: () => ws.close() };
}

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const tab = await moTab();
  const { sanSang, goi, dong } = taoKetNoi(tab.webSocketDebuggerUrl);
  await sanSang;

  await goi('Page.enable');
  await goi('Runtime.enable');
  // Chờ lá số dựng xong (luận giải tổng quan chạy nền, không cần đợi)
  await nghi(6000);

  const doKichThuoc = async () => {
    const r = await goi('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.grid.grid-cols-4');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return JSON.stringify({ w: Math.round(b.width), h: Math.round(b.height) });
      })()`,
      returnByValue: true,
    });
    const v = r.result?.result?.value;
    return v ? JSON.parse(v) : null;
  };

  const banDau = await doKichThuoc();
  if (!banDau) {
    console.log('✗ Không tìm thấy mệnh bàn trên trang');
    dong();
    process.exit(1);
  }
  console.log(`Kích thước ban đầu: ${banDau.w} × ${banDau.h}`);

  // Rê chuột qua nhiều vị trí trong mệnh bàn, đo lại sau mỗi lần
  const viTri = [
    [300, 400], [600, 400], [900, 400], [300, 600],
    [900, 600], [300, 800], [600, 800], [900, 800],
    [450, 500], [750, 700],
  ];

  const kichThuoc = [banDau];
  for (const [x, y] of viTri) {
    await goi('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
    await nghi(180);
    const kt = await doKichThuoc();
    if (kt) kichThuoc.push(kt);
  }

  const rongs = [...new Set(kichThuoc.map((k) => k.w))];
  const caos = [...new Set(kichThuoc.map((k) => k.h))];

  console.log(`Đã đo ${kichThuoc.length} lần trong lúc rê chuột`);
  console.log(`  Bề ngang khác nhau: ${rongs.join(', ')}`);
  console.log(`  Chiều cao khác nhau: ${caos.join(', ')}`);

  const onDinh = rongs.length === 1 && caos.length === 1;
  console.log(
    onDinh
      ? '\n✓ Kích thước đứng yên tuyệt đối khi rê chuột — không còn nhấp nháy.'
      : '\n✗ Kích thước còn dao động — layout vẫn bị tính lại, tức là còn nháy.'
  );

  dong();
  process.exit(onDinh ? 0 : 1);
}

main();
