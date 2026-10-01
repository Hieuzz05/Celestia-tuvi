# Celes Visual Character System — v2.0

**Ngày chốt:** 02/10/2026 · **Phiên:** `[CHIẾN LƯỢC]`
**Đi kèm:** [`nhan-vat-celes.md`](./nhan-vat-celes.md) — nhân vật · [`ca-nhan-hoa-celes.md`](./ca-nhan-hoa-celes.md) — phần chạy được

---

## Trạng thái

Tài liệu này chốt **hệ asset hình ảnh** của Celes Moon Hare sau vòng rà soát.

Bộ bàn giao hiện có:

- **49 PNG RGBA nền trong suốt**, không chữ nướng vào ảnh, 512×512:
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

**Trạng thái 02/10/2026:** đã copy **7 tệp WebP** sang `public/celes/` (280KB) — đúng 7
state Phase 3, `HAS_RECEIPTS` và `NOT_BUYING_IT` vẫn nằm ngoài. `apps/celes-app/assets/`
chưa có gì vì phía app chưa làm. Thêm state mới vào `public/` là lại phải qua luật trên.

---

## 12. Kế hoạch gắn lên giao diện — chốt 02/10/2026, THI CÔNG PHIÊN SAU

> Mục này là **kế hoạch đã duyệt**, chưa thi công. Phiên này chỉ ghi tài liệu,
> không chạm `lib/`, `app/`, `components/`, `apps/celes-app/`.

### Nguyên tắc đặt

> **Celes xuất hiện nơi người dùng đang CHỜ hoặc đang TRÒ CHUYỆN.
> Không xuất hiện nơi người ta đang ĐỌC nội dung.**

Lý do: **linh vật phải sống được cạnh chữ và thẻ thật, không lấn át content.** Lá số và
bài luận giải là nơi người dùng **đọc** — thả con thỏ vào đó là cướp sự chú ý khỏi thứ
họ trả tiền để xem.

> Bài test gốc của nguyên tắc này nằm ở `docs/thiet-ke/archive/rejected-v2/` mục F:
> *"đặt cạnh chữ và thẻ thật — nhân vật có lấn át giao diện không? … đứng trong ngữ cảnh
> nghiêm túc có lố không?"* Tài liệu đó **đã bị từ chối** vì phần tạo hình (flatten sang
> SVG quá sớm), nhưng **bài test thì vẫn đúng** — nó kiểm vị trí, không kiểm hình dáng.
> Giữ lại bài test, bỏ phần tạo hình.

### Có Celes

| Nơi | Nền tảng | Kích thước | State |
|---|---|---:|---|
| Tab Celes (khung chat) | app | 64px | theo `characterHook` |
| Onboarding 5 màn (tên / ngày sinh / giờ sinh / giới tính / băn khoăn) | app | 120px | `DEFAULT` cố định |
| Trang Hỏi Celes (`app/hoi-dap`) | web | 56px | theo `characterHook` |
| Màn chờ khi đang luận | cả hai | 80px | `THINKING` |
| Trạng thái rỗng | cả hai | 80px | `DEFAULT` |

### Không có Celes

```
Tab Lá số · Tab Hành trình · Tab Mối quan hệ · Tab Hôm nay
Mọi trang luận giải · Mệnh bàn
```

### Tab Hôm nay — điểm do dự, cố ý để mở

Đây là chỗ chủ dự án do dự nhất khi chốt, và nó được ghi lại thay vì giấu đi.

**Lý lẽ cho CÓ:** Hôm nay là màn **đầu tiên** người dùng thấy — rất hợp để Celes chào.
**Lý lẽ cho KHÔNG:** nó cũng là nơi hiện **nội dung chính của ngày**, tức là nơi người ta
đang đọc. Theo đúng nguyên tắc trên thì không được có.

**Chốt: KHÔNG** — giữ nguyên tắc nhất quán, không phá lệ cho một màn.

> **Xem lại sau khi thấy thật.** Đây là quyết định duy nhất trong mục 12 được đánh dấu
> mở lại. Phiên thi công dựng xong màn Hôm nay thì trình chủ dự án xem, rồi quyết lần
> hai. Không tự thêm Celes vào đó mà chưa hỏi.

Ghi lại điểm do dự là có chủ đích: sáu tuần nữa, câu hỏi *"sao Hôm nay không có Celes?"*
sẽ được trả lời bằng mục này, thay vì bằng một lần đoán lại từ đầu.

### Chuyển động

**Chỉ idle breathing.** Không có gì khác.

- `translateY` 2–3px, chu kỳ ~3s;
- Web: CSS;
- App: `Animated` của React Native;
- **KHÔNG Rive/Lottie** — thêm thư viện là kéo theo `soat-chi-phi` + `danh-gia-tac-dong`;
- **TẮT khi `SafetyOverlay != NORMAL`** — nhất quán với mục 9.

> **Con thỏ không được nhún nhảy khi người ta đang nói chuyện mất mát.**

Đó là lý do luật tắt chuyển động nằm cùng chỗ với luật `SERIOUS`, không phải một tuỳ
chọn giao diện rời.

### Thứ tự thi công

Trước Phase 3, `characterHook` **chưa tồn tại** trong mã. Nên:

1. Phiên thi công làm **phần hiển thị trước**, truyền tay một giá trị cố định ở mỗi chỗ —
   `DEFAULT` ở đầu trang và trạng thái rỗng, `THINKING` ở màn chờ. Màn chờ KHÔNG dùng
   `DEFAULT`: ở đó người dùng đang đợi, trạng thái đúng là đang nghĩ. Xem lại bảng ở trên.
2. Phase 3 chỉ **nối dây** `characterHook` → visual state, thay các giá trị cố định đó.

Tách như vậy để phần hiển thị không bị chặn bởi Phase 3, và để Phase 3 không phải vừa
làm hợp đồng ngôn ngữ vừa làm giao diện.

### Luật màn hẹp phải tuân

Xem `docs/bay/giao-dien.md`: 390px không cuộn ngang, vùng chạm ≥ 44px. Ảnh Celes là
trang trí — **không được** là vùng chạm, và không được đẩy nội dung ra khỏi 390px.
