# Celes — hình nhân vật

> **`characterHook` CHƯA TỒN TẠI TRONG MÃ (soát 02/10/2026).** Phase 3 chỉ làm
> `nhip` và `kieu` (`lib/rag/hop-dong-tra-loi.ts`); `characterHook` và
> `playfulness` đã HOÃN không ngày hẹn vì chúng là lời model tự khai, không
> phải sự kiện đo được — xem mục 17.1 của
> [`ca-nhan-hoa-celes.md`](../../chien-luoc/ca-nhan-hoa-celes.md). Mọi chỗ dưới đây nói
> "nối dây `characterHook`" là BẢN THIẾT KẾ, chưa phải hiện trạng: nơi gọi
> linh vật vẫn truyền tay một giá trị cố định.

> **Nguồn chuẩn hình dáng (Visual Source of Truth v1) là `nguon-chuan/concept-01.png`.**
> Không phải SVG. Không phải chữ trong tệp này. Khi chữ và ảnh mâu thuẫn, **ảnh thắng**.

Bản SVG tham số hoá trước đây đã bị từ chối ngày 01/10/2026 và chuyển sang
`docs/thiet-ke/archive/rejected-v2/`. Không dùng nó làm tham chiếu — đọc README
trong thư mục đó để biết nó sai ở đâu.

## Luật khoá hình

Nhân vật đã có rồi. Việc còn lại là **tái tạo cho sạch**, không phải thiết kế lại.

| Thành phần | Phải giữ | Cấm |
|---|---|---|
| Chất liệu | Soft 3D, bề mặt nhung mờ, ánh sáng studio dịu | Flat vector ở bước master |
| Đầu | Rộng, tròn-vuông mềm, lớn hơn thân rõ rệt | Oval hẹp, đầu nhỏ |
| Tai cụp | Dài, DÀY, nặng, đổ ngang, thấy rõ trọng lượng | Mảnh như ăng-ten |
| Tai dựng | Dựng cao, dày, bo tròn | Nhọn, mảnh |
| Mắt | Lớn, DÀI NGANG, nửa mí, lạnh, deadpan | Mắt tròn kawaii, nét như lông mày giận |
| Mặt nạ kem | Mềm, hữu cơ, đỉnh tóc goá phụ dịu, nối tự nhiên vào trán/má | Cạnh hình học cứng, khe chữ V nhọn |
| Thân | Ngồi thấp, chắc, chân trước TO và tròn | Đứng cao, chân nhỏ như icon |
| Màu | Chàm đêm / tím sẫm, kem ấm | — |
| Thiên văn | Rất tiết chế, CHỈ trên tai dựng | Trang trí thiên hà dày đặc |
| Cảm xúc | Biết nhiều, bình tĩnh, hơi hoài nghi | Cáu, giận, phản diện |

Cảm giác đích: **"quiet rabbit who already knows."**

## Thứ tự bắt buộc — không nhảy bước

```
[1] master/master-3q.png     ✅ DUYỆT 02/10/2026
      ↓ chủ dự án duyệt
[2] master/front.png · master/side.png   ✅ DUYỆT 02/10/2026
      ↓ sinh từ CHÍNH master-3q.png đã duyệt (image-to-image),
        KHÔNG regenerate từ prompt trắng
      ↓ ba view khoá được identity
[3] biểu cảm + tư thế        ✅ DUYỆT 02/10/2026 — bộ v2, 49 ảnh
      ↓
[4] vector hoá cho UI — là DẪN XUẤT của mascot đã duyệt, không phải thiết kế lại
      ← ĐANG Ở ĐÂY (chưa mở)
```

## Bộ v2 — duyệt 02/10/2026

Bước [1]–[3] đã xong bằng bộ **Celes Character System v2**, 49 ảnh 512×512 (riêng
`default` 768×768), nằm ở
[`v2/`](./v2/). Chủ dự án duyệt ngày 02/10/2026 sau khi đối chiếu với `concept-01.png`:
soft 3D, tai cụp dày có trọng lượng, mắt nửa mí deadpan, mặt nạ kem hữu cơ, thân ngồi
thấp, thiên văn chỉ trên tai dựng — identity khớp, không phải redraw hỏng như bản v2 cũ
đã bị từ chối.

`master/` được điền từ chính bộ này: `master-3q.png` · `front.png` · `side.png`.

**Chiến lược dùng asset** (phase, mapping `characterHook`, nơi hiện trên giao diện):
xem [`docs/chien-luoc/celes-visual-character-system.md`](../../chien-luoc/celes-visual-character-system.md).

### Luật lưu trữ

- **PNG là bản gốc.** Mọi lần tái xuất đi từ PNG.
- **WebP là bản LOSSY** (`VP8X`, đã kiểm byte 12–15) — không bao giờ tái xuất từ WebP.
- Cả hai đều commit vào git. Lý do: mục 11 của tài liệu chiến lược.
- **Không copy vào `public/`** cho tới khi có mã trỏ tới, và chỉ copy state đang dùng.
  Đã copy 7 tệp WebP sang `public/celes/` ngày 02/10/2026 (CEL-181) — đúng 7 state Phase 3.

Mỗi bước phải được duyệt trước khi mở bước sau. Bỏ qua thứ tự này là cách bản v2
đã hỏng: nó nhảy thẳng tới bước 4.

## Cách tạo master (việc của người, không phải của AI viết mã)

Claude Code **không sinh được ảnh raster** — mọi công cụ của nó là mã và chữ.
Vẽ bằng SVG chính là thứ bước master cấm. Nên bước [1] phải làm bằng model sinh ảnh.

Ưu tiên **workflow editing / reference-preserving**: đưa thẳng `concept-01.png` vào
model, yêu cầu *edit / redraw ra một master duy nhất*. Mọi view sau dùng chính master
đã duyệt làm reference.

Không ưu tiên Midjourney `--cref`: nó giữ "cảm giác nhân vật" nhưng trôi hình dáng —
mà ở đây mục tiêu là giữ morphology rất sát.

Lưu kết quả vào `master/master-3q.png` rồi báo lại để đi tiếp bước [2].

### Prompt khoá — dùng nguyên văn

```
REFERENCE LOCK — DO NOT REDESIGN

The attached CELES Moon Hare Concept 01 is the immutable source of truth.
Recreate the same character, not a new interpretation.

Preserve the exact visual identity:
- broad oversized rounded head
- compact, low seated body
- one long, thick, heavy floppy ear extending sideways
- one thick upright rounded ear
- large horizontal half-lidded eyes
- calm, knowing, slightly skeptical expression; never angry
- soft organic warm-cream facial mask with a gentle widow's peak
- thick rounded front paws
- deep midnight-indigo / violet body
- matte velvet-like sculptural surface
- soft premium studio lighting
- very subtle celestial motif on the upright ear only

Do not change the morphology, proportions, face structure, ear construction,
eye shape or body mass.

Do not use flat SVG/vector aesthetics, anime eyebrows, angry eyes, skinny
antenna ears, tiny body, thin limbs, kawaii round eyes, fantasy clothing,
astronaut styling or heavy galaxy decoration.

The target feeling is:
"quiet rabbit who already knows."

Output ONE canonical 3/4 master character only, on a clean warm off-white
background. No turnaround sheet, no expressions, no logos, no stickers yet.
```

## Nghiệm thu master-3q.png

Đặt cạnh `nguon-chuan/concept-01.png` và soi đúng bảy điểm:

1. Tai cụp có **dày và nặng** không, hay đã thành ăng-ten?
2. Đầu có **rộng hơn thân rõ rệt** không?
3. Mắt có **dài ngang, nửa mí** không, hay tròn to kiểu kawaii?
4. Có **nét nào đọc ra lông mày giận** không? Có là trượt.
5. Mép mặt nạ kem có **mềm** không, hay đã thành hình học cứng?
6. Chân trước có **to và tròn** không?
7. Nhìn 2 giây có thấy **đúng con thỏ đó** không, hay là họ hàng của nó?

Trượt bất kỳ điểm nào thì sinh lại, đừng sửa tay — sửa tay là mở lại đúng cái cửa
đã làm hỏng bản v2.

## Nghiệm thu tệp — bảy câu trên là về HÌNH, đây là về TỆP

Bộ v2 duyệt ngày 02/10/2026 chỉ qua bảy câu về hình dáng, nên ba khuyết tật kỹ thuật
lọt thẳng lên production: bóng đổ nướng vào ảnh (nền tối thành vệt trắng dưới chân),
rìa nhiễm màu nền kem, và mỗi tệp một khung với một tỉ lệ chiếm khung khác nhau
(`default` 768px chiếm 83%, `thinking` 512px chiếm 60% — cùng một `cao` mà ra hai cỡ).
Hình đúng vẫn hỏng nếu tệp sai. Soi thêm năm điểm này trước khi đưa vào `public/`:

1. Đặt ảnh lên **bốn nền**: `#F7F3EA` · `#FFFFFF` · `#20002B` · `#0B0A0D`. Có vệt sáng
   nào dưới chân trên hai nền tối không? Có là bóng đã bị nướng vào ảnh.
2. Rìa nhân vật trên nền tối có **quầng sáng** không? Có là rìa còn nhiễm màu nền.
3. Mọi state có **cùng kích thước khung** và **cùng tỉ lệ chiếm khung** không?
4. Nhìn ở **đúng cỡ hiển thị thật** (56px và 80px), không phải cỡ gốc — khuyết tật ở
   512px có thể vô hình, ở 56px lại thành thứ đập vào mắt, và ngược lại.
5. Nền có thật sự **trong suốt**, không phải hình chữ nhật màu kem?

Cách sửa khi trượt: chạy `scripts/lam-sach-anh-celes.py` từ PNG gốc. Không sửa từ WebP.

## Thư mục

| Đường dẫn | Là gì |
|---|---|
| `nguon-chuan/concept-01.png` | **Nguồn chuẩn v1.** Không sửa, không thay. |
| `nguon-chuan/visual-lock-correction-brief.md` | Brief khoá hình, bản chữ |
| `master/` | Master đã duyệt: `master-3q.png` · `front.png` · `side.png` (02/10/2026) |
| `v2/` | Bộ 49 ảnh đã duyệt — PNG gốc + WebP. Xem mục "Bộ v2". |
| `../archive/rejected-v2/` | Bản SVG bị từ chối. KHÔNG dùng làm tham chiếu. |
