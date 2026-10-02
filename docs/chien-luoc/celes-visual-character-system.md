# Celes Visual Character System — v2.0

**Ngày chốt:** 02/10/2026 · **Phiên:** `[CHIẾN LƯỢC]`
**Đi kèm:** [`nhan-vat-celes.md`](./nhan-vat-celes.md) — nhân vật · [`ca-nhan-hoa-celes.md`](./ca-nhan-hoa-celes.md) — phần chạy được

> **`characterHook` CHƯA TỒN TẠI TRONG MÃ (soát 02/10/2026).** Phase 3 chỉ làm
> `nhip` và `kieu` (`lib/rag/hop-dong-tra-loi.ts`); `characterHook` và
> `playfulness` đã HOÃN không ngày hẹn vì chúng là lời model tự khai, không
> phải sự kiện đo được — xem mục 17.1 của
> [`ca-nhan-hoa-celes.md`](./ca-nhan-hoa-celes.md). Mọi chỗ dưới đây nói
> "nối dây `characterHook`" là BẢN THIẾT KẾ, chưa phải hiện trạng: nơi gọi
> linh vật vẫn truyền tay một giá trị cố định.

---

## Trạng thái

Tài liệu này chốt **hệ asset hình ảnh** của Celes Moon Hare sau vòng rà soát.

Bộ bàn giao hiện có:

- **49 PNG RGBA nền trong suốt**, không chữ nướng vào ảnh, 512×512 (riêng `default`
  768×768). Nền trong suốt nhưng **có bóng đổ nướng vào ảnh** và rìa nhiễm màu nền kem —
  đó là lý do bảy tệp lên `public/` phải đi qua `scripts/lam-sach-anh-celes.py` trước:
  - 6 master views
  - 16 expressions
  - 18 poses
  - 9 semantic product states
- 49 bản WebP alpha cho Web/preview.
- PNG source: **8.6 MB** (đo thật: 8740 KB)
- WebP: **1.9 MB** (đo thật: 1900 KB)
- 9 core states WebP: **352 KB**

Tất cả caption/nhãn chỉ nằm trong HTML/docs, **không nằm trong bitmap**.

**Asset nằm ở `docs/thiet-ke/celes-nhan-vat/v2/`.** Không nằm ở `public/` — xem mục 11.

---

## 1. Source of truth

Celes vẫn là **Moon Hare / Thỏ Trăng** theo Concept 01:

- soft sculptural 3D;
- midnight indigo / violet;
- cream face + chest;
- một tai cụp nặng, một tai dựng;
- mắt half-lidded/deadpan;
- celestial mark tiết chế.

Logo trăng + sao là **brand mark**.
Moon Hare là **character/mascot**.
Mascot không thay logo.

Luật khoá hình chi tiết nằm ở [`docs/thiet-ke/celes-nhan-vat/README.md`](../thiet-ke/celes-nhan-vat/README.md).
Khi chữ và ảnh mâu thuẫn, **ảnh thắng** — nguồn chuẩn là `nguon-chuan/concept-01.png`.

---

## 2. Phạm vi platform

### Asset source

Bộ asset này dùng chung cho:

- App
- Web
- Social/marketing

### Rollout

**App-first** vì Aurora v8 hiện áp cho App.

Web được phép dùng cùng mascot PNG/WebP nhưng không bị buộc phải chuyển toàn bộ Web
sang Aurora v8.

---

## 3. Motion — quyết định hiện tại

Phase 3 **không thêm Rive hoặc Lottie**.

Dùng:

- Web: CSS transform/opacity cho motion nhỏ.
- App: static PNG + animation primitive có sẵn của React Native/Expo khi cần.

Ví dụ motion được phép:

- idle breathing nhẹ;
- translateY vài px;
- scale rất nhỏ;
- opacity/blink;
- tiny side shift.

Rive/Lottie chỉ được xét lại sau một phiên thiết kế + `soat-chi-phi`.

Chi tiết chuyển động đã chốt cho phiên thi công: xem mục 12.

---

## 4. Asset loading

### App bundle

Chỉ import **core assets thật sự dùng trong màn hình product**.

Không import toàn bộ 49 file vào bundle chỉ vì chúng tồn tại.

Core tối thiểu:

- DEFAULT
- LISTENING
- THINKING
- FOUND_SOMETHING
- SIDE_EYE
- SERIOUS
- CELEBRATE

Hai state sau bị khoá:

- `HAS_RECEIPTS` → Phase 4
- `NOT_BUYING_IT` → điều kiện mở ở mục 5

### Web

Asset không critical phải lazy-load.

### Social

Pose/meme mở rộng để ngoài production app bundle.

---

## 5. CharacterHook → Visual State

`characterHook` và `Visual State` **không phải cùng một enum**.

| Runtime signal | Visual state | Phase | Rule |
|---|---|---:|---|
| `NONE` | `DEFAULT` | 3 | Trừ khi lifecycle/safety chọn state khác |
| `INSIGHT_FOUND` | `FOUND_SOMETHING` | 3 | Mapping trực tiếp |
| `DRY_HUMOR` | `DEFAULT` | 3 | Humor không bắt buộc mascot phải side-eye |
| `LIGHT_TEASE` | `SIDE_EYE` | 3 | Chỉ khi `playfulness=2`, Safety=NORMAL |
| user đang nhập/kể | `LISTENING` | 3 | Lifecycle event |
| AI đang reasoning | `THINKING` | 3 | Lifecycle event |
| sensitive/critical | `SERIOUS` | 3 | Safety luôn override |
| meaningful success | `CELEBRATE` | 3 | Product event |
| grounded memory H### | `HAS_RECEIPTS` | **4** | Không bật trước H### |
| *(chưa có tín hiệu)* | `NOT_BUYING_IT` | 3 | `characterHook` hiện không có giá trị nào dẫn tới state này. Tín hiệu bật do phiên thi công Phase 3 quyết, theo điều kiện bên dưới. |

### `NOT_BUYING_IT` — điều kiện mở

Asset tồn tại để khoá visual direction. Điều kiện bật, chốt 02/10/2026:

> **Chỉ mở khi có mâu thuẫn nằm TRONG CHÍNH lượt hiện tại.**

Đây là điều `ca-nhan-hoa-celes.md` mục 9 cho phép: *"Phase 3: Celes chỉ được phản ứng
với mâu thuẫn nằm ngay trong lượt hiện tại. Cấm nhắc lịch sử hội thoại."*

Nghĩa là:

| Được | Không được |
|---|---|
| Người dùng nói hai điều ngược nhau trong cùng một tin nhắn | Mâu thuẫn với điều họ nói lượt trước |
| Mâu thuẫn giữa điều họ vừa nói và `F###` engine vừa đưa ra | Mâu thuẫn với lịch sử hội thoại (cần `H###`, Phase 4) |

Ba ràng buộc cộng thêm, không được bỏ:

1. Safety phải `NORMAL`. `SERIOUS` luôn thắng — xem mục 9.
2. Vẫn tính vào ngân sách **một hook mỗi câu trả lời, một hook mỗi chủ đề mỗi phiên**.
3. Mâu thuẫn phải **quan sát được từ văn bản**, không phải suy diễn động cơ. Suy động cơ
   là đọc ý nghĩ — `nhan-vat-celes.md` mục 3.2 cấm.

Lý do ràng buộc chặt: state này dễ biến "user rationalization" thành mind-reading. Một
mâu thuẫn trong cùng một lượt thì **đọc được từ chữ**, không cần đoán.

---

## 6. Phase 3 lock

Ở Phase 3 **cấm**:

- câu "Mình nhớ…" dựa trên lịch sử chưa grounded;
- `HAS_RECEIPTS`;
- claim "lần trước bạn nói…";
- suy động cơ ẩn;
- `NOT_BUYING_IT` ngoài điều kiện ở mục 5.

`FOUND_SOMETHING` vẫn được dùng cho `INSIGHT_FOUND`.

---

## 7. Phase 4 — Living Memory

Khi `H###` được triển khai:

- `HAS_RECEIPTS` được mở;
- các claim history phải có `H###`;
- visual memory recall chỉ được bật khi retrieval thực sự thành công;
- `SERIOUS` vẫn override `HAS_RECEIPTS`.

---

## 8. Chuẩn asset

Yêu cầu bắt buộc với ảnh dùng cho sản phẩm:

- nền trong suốt (alpha);
- không nướng chữ vào ảnh;
- không nướng viền thẻ vào ảnh;
- không nhãn gắn với một ngôn ngữ cụ thể;
- không nền chữ nhật màu kem;
- nhân vật đặt giữa khung vuông;
- bản gốc (master) là **PNG**;
- bản tối ưu cho Web/preview là **WebP alpha**.

### WebP là bản LOSSY — hệ quả

Kiểm byte 12–15 của tệp WebP: cả bộ là `VP8X`, **không phải** `VP8L` (lossless).

Vì vậy:

> **Mọi lần tái xuất phải đi từ PNG. Không bao giờ tái xuất từ WebP.**

Tái xuất từ WebP là nhân đôi suy hao. Đây là lý do PNG gốc **phải nằm trong git** —
xem mục 11.

---

## 9. Serious mode

Nếu `SafetyOverlay != NORMAL`:

- playfulness = 0;
- characterHook = NONE;
- visualState = SERIOUS;
- không SIDE_EYE;
- không HAS_RECEIPTS meme pose;
- không NOT_BUYING_IT;
- **tắt idle breathing** — xem mục 12.

---

## 10. Quy tắc cuối

**Character system là lớp biểu hiện. Nó không được thay đổi domain conclusion, `ketLuan`,
`nghiengVe`, F### hay E###.**

Visual chỉ phản ánh trạng thái đã được runtime quyết định.

---

## 11. Asset nằm ở đâu — chốt 02/10/2026

**Cả 49 PNG và 49 WebP đều commit vào git**, tại `docs/thiet-ke/celes-nhan-vat/v2/`.

### Vì sao commit cả PNG

Khuyến nghị ban đầu là chỉ commit WebP (1.9MB) để tiết kiệm. Phiên `phan-bien`
đánh sập, ba lý do — hai cái đo được:

1. **WebP là lossy** (`VP8X`, đã kiểm). "PNG chỉ cần khi tái xuất" là lập luận tự huỷ:
   bỏ PNG là bỏ luôn đường tái xuất.
2. **"Master source = PNG" + "PNG để ngoài git" không thể cùng đúng.** Dự án do hai AI
   trên hai máy cùng làm (`AI-PHOI-HOP.md`); `Downloads/` của máy này không tồn tại với
   máy kia. Mất bản gốc là **không sửa được**; tốn 8.6MB là sửa được bất cứ lúc nào bằng
   `git filter-repo`.
3. **8.6MB không phải vấn đề thật.** `.git` 15MB → ~24MB, commit một lần rồi nằm im.
   Trong khi `PRODUCT-BACKLOG.xlsx` bị luật buộc cập nhật mỗi commit đổi tính năng và lưu
   nguyên tệp mỗi lần — đó mới là nguồn phình kho liên tục. Vercel giới hạn kích thước
   bundle, không giới hạn lịch sử git.

### Vì sao KHÔNG để ở `public/`

`public/` của Next.js phục vụ **công khai, không xác thực, có thể bị index**. Để cả 49
ảnh ở đó là phát hành công khai 40 asset social chưa duyệt và 2 state đang bị khoá
(`HAS_RECEIPTS`, `NOT_BUYING_IT`) — tức tự quyết thay chủ dự án một quyết định nhân vật.

**Luật:** chỉ copy sang `public/` (web) hoặc `apps/celes-app/assets/` (app) **đúng những
state đang thật sự dùng**, vào phiên thi công, khi có mã trỏ tới. Không copy trước.

**Trạng thái 02/10/2026 (CEL-187):** `public/celes/` có **18 tệp WebP** — đúng 18 ảnh
đang dùng ở mục 12, trích từ nguồn v2.3. 14 ảnh khoá (gồm `HAS_RECEIPTS`, `NOT_BUYING_IT`)
không có tệp. `apps/celes-app/assets/` chưa có tệp linh vật vì phía app chưa làm. Thêm
ảnh mới vào `public/` là lại phải qua luật trên, và `scripts/test-cho-dat-celes.ts` đỏ
cho đến khi mảng `TEN_ANH_CELES` khớp thư mục.

Bảy tệp đó **không phải bản copy thẳng** từ `v2/states/`: chúng đi qua
`scripts/lam-sach-anh-celes.py`, bỏ bóng đổ nướng sẵn trong ảnh, khử màu nền kem bám ở
rìa, rồi chuẩn hoá cả bảy về khung 512×512 với nhân vật cao 86% khung. Ảnh gốc mỗi tệp
một khung (`default` 768, còn lại 512) và một tỉ lệ chiếm khung (83% so với 60%), nên
nếu copy thẳng thì cùng một `cao` mà con thỏ ở màn chờ nhỏ hơn con thỏ đầu trang 1,4 lần.
Thêm state mới thì chạy lại script đó, đừng copy tay.

---

## 12. Celes trên giao diện — chốt 02/10/2026 (CEL-187), WEB ĐÃ THI CÔNG

> Thay bản chốt đầu ngày 02/10 (5 chỗ, chỉ /hoi-dap và /ho-so). Chủ dự án duyệt lại cùng
> ngày: **18/32 artwork unique vào web ngay, 14/32 khoá có chủ đích.** Nguồn ảnh:
> `celes_character_system_v2_3_dark_halo_fix.html` (v2.3, đã sửa quầng trắng), trích ra
> `docs/thiet-ke/celes-nhan-vat/v2-3/` rồi chạy `scripts/lam-sach-anh-celes.py`. Phần
> **app** chưa thi công.

### Nguyên tắc đặt — vẫn giữ, phát biểu chặt hơn

> **Celes đứng ở đầu trang, màn vào / thẻ rỗng, màn chờ, cổng, lỗi và sự kiện.
> KHÔNG đứng TRONG vùng nội dung** — mệnh bàn, bài luận, dòng thời gian, kết quả hợp tuổi,
> danh sách lá số.

Lý do không đổi: lá số và bài luận là nơi người dùng **đọc** — con thỏ ở đó là cướp sự chú
ý khỏi thứ họ đến để xem. Bản cũ nói "không có Celes ở tab Lá số / Hành trình / luận giải";
bản này cho Celes vào các TRANG đó nhưng chỉ ở viền (đầu trang, lúc chờ, lúc rỗng), không
bao giờ vào vùng nội dung.

**Giữ bằng mã, không bằng lời:**
- `tsc` giữ ảnh đúng LOẠI CHỖ: `ANH_THEO_CHO` trong `components/CelesMascot.tsx`
  (`dau-trang` · `rong` · `cho` · `cong` · `loi` · `su-kien`). Đặt `proud` vào `rong` là đỏ.
- `scripts/test-cho-dat-celes.ts` (CI) giữ ảnh đúng MÀN: danh sách trắng tệp → ảnh, danh
  sách CẤM (TuViChart, PalaceCell, CenterPanel, PalaceDrawer, BangLuanGiai, CauTraLoiV3,
  TongQuanV3, BucTranhLon, DaiThoiGian, MarkdownLuanGiai), mảng ảnh khớp 1-1 với
  `public/celes/`, không ảnh khoá nào có tệp. **Danh sách là nguồn sự thật** — không có
  luật "đúng N tệp". Đặt ở màn mới: sửa mục này trước, rồi danh sách.

### 18 ảnh đang dùng

| Màn / sự kiện | Ảnh | Khi nào | Chỗ | Cỡ (≥640 / <640) |
|---|---|---|---|---|
| `/` | tiny-smile | luôn | hero, trên eyebrow, canh giữa | 80 / 64 |
| `/gioi-thieu` | default | luôn | hero | 96 / 72 |
| `/home` | one-ear-up | **chỉ** khi chưa có lá số | thẻ rỗng | 80 / 64 |
| `/la-so` nhập | leaning-closer | form nhập (kể cả báo ngày sai) | đầu thẻ form | 80 / 64 |
| `/la-so` chờ | thinking | `KHUNG_CHO_LA_SO`, hiện trễ 1s | màn chờ | 80 |
| `/la-so` giữ lại | proud | bấm "Giữ lại" và lưu thành công | nổi góc dưới, 4s | 72 / 56 |
| `/luan-giai` | reading · thinking | rỗng · đang tải | thẻ | 80 / 64 |
| `/luan-giai/sau` | thinking · curious | lần tải đầu (trễ 3s) · HoiBoiCanh | trước bài · cạnh câu hỏi | 80 / 64 |
| Bức tranh lớn | thinking | lần tải đầu (trễ 3s), qua `DangDocV3` | trước bài | 80 / 64 |
| Hành trình | moving | đầu trang (không ở nhánh cổng) | cạnh tiêu đề | 72 / 56 |
| Chi tiết hạn | curious · thinking · concerned | chưa có lá số · đang tải (trễ 1s) · lỗi tải + nút thử lại | thẻ | 80 / 64 |
| Hợp tuổi | curious · thinking | trước khi gửi (ẩn khi chạy / có kết quả) · đang tính | đầu trang · cạnh nút | 80 / 56 |
| `/hoi-dap` đầu trang | serious > listening > default | lượt mới nhất nặng > ô nhập focus và có chữ > rảnh | cạnh tiêu đề | 56 |
| `/hoi-dap` thân | default · thinking · serious | rỗng · đang trả lời · đang trả lời lượt nặng | thẻ rỗng / màn chờ | 80 |
| `/ho-so` | sitting-neutral · neutral | chưa có lá số · đã có | thẻ rỗng · cạnh tiêu đề (giữ chỗ bằng visibility) | 80 · 56 |
| `/tai-khoan` | using-laptop | luôn | cạnh tiêu đề | 64 / 56 |
| `/dang-nhap`, cổng đăng nhập toàn trang | waving | luôn | trên form / tiêu đề | 72–80 / 64 |
| `/support` | tiny-smile | luôn | **chỉ** đầu trang | 80 / 64 |
| Thanh toán | celebrate · default · concerned | thành công lần đầu · thành công xem lại · lỗi / hết hạn / lỗi tải | thẻ trạng thái | 96 · 80 · 80 |
| 404 | playing | luôn | giữa | 120 / 96 |
| `error.tsx` | concerned | lỗi thử lại được | trên chữ lỗi | 96 / 80 |
| `global-error.tsx` | concerned | lỗi toàn trang | trên chữ lỗi | 96 |

`celebrate` chỉ một lần mỗi giao dịch (`localStorage` `celes-mung-<id>`; đọc hỏng thì coi
như lần đầu). Tải lại trang thành công → `default`.

### 14 ảnh khoá — kèm lý do

| Ảnh | Vì sao khoá |
|---|---|
| Side-eye / Looking away, Really?, Not buying it, Suspicious, Caught you, Wink, Looking at user | Phán xét hoặc mỉa. Celes không phán xét người dùng — ở sản phẩm tử vi, một cái liếc dễ đọc thành "lá số anh xấu". |
| Has receipts / Reading focus | Thuộc Phase 4 (trích dẫn có căn cứ); chưa có tính năng đứng sau thì ảnh nói dối. |
| Excited / FOUND_SOMETHING | Chỉ hợp lệ khi có insight thật do engine phát hiện; đặt cố định là hứa hão. |
| Sad, Resting, Stretching, Lying relaxed, Sleeping | Chưa có ngữ cảnh nào trên web cần. |

Ảnh khoá **không có tệp** trong `public/celes/` và **không có tên** trong `TEN_ANH_CELES`.
Mở khoá là quyết định của chủ dự án, không phải một dòng thêm vào mảng.

### Động và tĩnh

- **Động** (`TRANG_THAI_CELES`: default, listening, thinking, serious, celebrate) — đổi theo
  tín hiệu lúc chạy. Không cùng enum với `characterHook` (mục 5); Phase 3 nối qua bảng ánh
  xạ, không map thẳng.
- **Tĩnh** (`MINH_HOA_CELES`: 13 ảnh còn lại) — gắn cố định theo ngữ cảnh màn. **KHÔNG chọn
  theo sao, theo hạn hay theo kết quả của người dùng** (mục 10).

### Luật hiển thị

1. **Mỗi khung nhìn tối đa một con.** Ngoại lệ duy nhất: `/hoi-dap` (đầu trang + một con ở
   thân). Đầu trang `/hoi-dap` **không bao giờ** `thinking` — lúc chờ con ở thân đã nghĩ, hai
   con cùng nghĩ là lặp.
2. **Màn chớp dưới 1 giây không có linh vật.** Màn chờ dùng `.celes-tre` (CSS, mặc định 1s;
   bài sâu 3s): giữ chỗ từ đầu, ảnh chỉ hiện nếu màn chờ còn đó. Chạy bằng CSS nên đúng cả
   với HTML tĩnh của khung Suspense.
3. **Không nhảy layout.** Ảnh có width/height thật; ảnh ẩn theo điều kiện dùng `invisible`
   (giữ chỗ), không gỡ khỏi cây. Sự kiện (`proud`) là `.celes-noi` — `position: fixed`, không
   chiếm chỗ, không nhận chạm.
4. **Proud chỉ khi người dùng CHỦ ĐỘNG bấm "Giữ lại" và lưu thành công.** Không ở lưu-khi-rời-
   trang, không sau đăng nhập rồi quay lại.
5. **`concerned` chỉ cho lỗi HỆ THỐNG / thanh toán.** Không cho lỗi nhập liệu (ngày sai vẫn
   `leaning-closer`), không bao giờ phản ứng với nội dung lá số.
6. **Ảnh là trang trí**: `alt=""`, `aria-hidden`, không là vùng chạm; chữ đi cùng phải tự đủ
   nghĩa. Chữ trong thẻ là lời Celes, ngôi thứ nhất ("Mình đang…").
7. **Ảnh trên nếp gấp** → `loading="eager"` (prop `ngay`). KHÔNG dùng `priority` (lỗi thời ở
   Next 16). `unoptimized` — tệp tĩnh 30–44KB, bộ biến đổi ảnh chỉ tốn hạn mức.
8. **Cỡ đổi bằng CSS** (`--celes-cao` / `--celes-cao-nho` dưới 640px), không bằng JS — SSR
   khớp hydrate.

**Chiều cao khung ≠ chiều cao thân.** Cả 18 ảnh chuẩn hoá về khung 512px, nhân vật cao 86%
khung. Cùng `cao` thì cùng KHUNG, không cùng THÂN: tư thế nằm ngang (concerned,
leaning-closer, playing) trông nhỏ hơn. Đã chấp nhận, không phóng riêng từng ảnh.

### Luật an toàn (mục 9) trên web

Lượt người dùng **mới nhất** có `doAnToan() != NORMAL` thì mọi linh vật trên `/hoi-dap` đổi
sang `serious` và tắt thở; câu NORMAL tiếp theo hoặc xoá hội thoại là tự về. Chấm ở trình
duyệt bằng đúng hàm máy chủ dùng (`lib/linh-vat.ts` → `lib/rag/an-toan.ts`).

> **Bất biến (chủ dự án chốt):** `safety(lượt mới nhất) ≠ safety(mức nặng nhất cả hội
> thoại)`. KHÔNG "dính". Bài kiểm: `scripts/test-linh-vat-an-toan.ts` (CI).

`serious` và `concerned` tự đứng yên, không cần cờ.

### Hôm nay — đã đảo, phạm vi hẹp

Bản đầu chốt "Tab Hôm nay: KHÔNG" và đánh dấu mở lại. CEL-187 đảo **chỉ cho thẻ rỗng**
(chưa có lá số → `one-ear-up`). Màn Hôm nay khi đã có lá số vẫn **KHÔNG** — đó là nơi hiện
nội dung chính của ngày.

### Ngoại lệ và lệch có chủ đích

- `/`: hero canh giữa nên Celes đứng **trên** eyebrow, không cạnh tiêu đề.
- `/support`: chỉ đầu trang, không ở thẻ hay cổng ủng hộ.
- Loading dưới 1 giây: không linh vật (luật 2), kể cả chỗ bảng trên ghi `thinking`.

### Chuyển động

**Chỉ idle breathing** (`.celes-tho`: `translateY` 2–3px, ~3s, CSS). Không Rive/Lottie —
thêm thư viện là kéo theo `soat-chi-phi` + `danh-gia-tac-dong`. Tắt khi an toàn ≠ NORMAL
và dưới `prefers-reduced-motion` (`.celes-tre` giữ độ trễ, chỉ bỏ mờ dần).

> **Con thỏ không được nhún nhảy khi người ta đang nói chuyện mất mát.**

### App

Chưa thi công. Bảng trên là của web; app làm theo cùng nguyên tắc khi tới lượt (tab Celes
64px theo `characterHook`, onboarding 120px `default`).

### Luật màn hẹp phải tuân

Xem `docs/bay/giao-dien.md`: 390px không cuộn ngang, vùng chạm ≥ 44px. Ảnh Celes không
được đẩy nội dung ra khỏi 390px.
