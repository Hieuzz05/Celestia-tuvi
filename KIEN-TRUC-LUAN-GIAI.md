# Kiến trúc luận giải Celes — bản v2

> Tài liệu thiết kế. Viết cho chủ dự án (người quyết) và người/AI sẽ làm.
> v2 ngày 2026-09-26: gộp bản kiến trúc v1 (22/09) với thiết kế Thư viện tri thức,
> sau ba vòng phản biện và các quyết định của chủ dự án ngày 26/09.
>
> **Cách đọc:** mỗi mục ghi rõ **[ĐANG CHẠY]** (có mã trên production) hay **[ĐÍCH]**
> (mới trên giấy). Đừng cắm việc mới vào một lớp chỉ có trên giấy.
>
> Bản v1 giữ nguyên ở **Phụ lục V1** cuối tài liệu. Chú thích trong mã trỏ tới "mục 1",
> "mục 7.2", "A1–A5", "mục 11" là số mục **của Phụ lục V1**.

---

## 1. Vấn đề và mục tiêu

**Phản hồi gốc về văn (22/09):** lan man, trừu tượng, lủng củng, lặp ý giữa các phần.
Phase A của v1 và luồng v3 đã xử phần lớn (xem mục 2).

**Mục tiêu chuyên môn (26/09) — chủ dự án đặt:** khi luận một lá số, Celes phải

1. xét **đủ mọi sao**: chính tinh, phụ tinh, sao vòng, tứ hoá, lưu tinh;
2. biết **nghĩa từng sao**: nghĩa chung, nghĩa ở từng cung, nghĩa theo độ sáng;
3. biết **sao nào đi theo bộ** và bộ đó nghĩa gì;
4. biết **khi kết hợp** (bộ với chính tinh, bộ với bộ) thì nghĩa đổi ra sao, kể cả
   ngoại lệ kiểu phản vi kỳ cách;
5. **luận hạn nhiều tầng**: đại vận, tiểu hạn, lưu niên, nguyệt hạn, lưu tinh, tứ hoá
   theo Bắc phái.

---

## 2. Hiện trạng [ĐANG CHẠY] — rà trên mã ngày 26/09/2026

### 2.1 Luồng luận giải v3 (production)

```
engine (lib/tuvi) → dữ kiện F### theo ma trận cung (lib/rag/v3/du-kien.ts)
  → truy hồi THEO TỪNG CUNG → đoạn sách E### (lib/rag/v3/truy-hoi-v3.ts)
  → MỘT lượt gọi: dàn ý có mã căn cứ → bài luận → "vì sao" → gợi ý (prompt-v3.ts)
  → kiểm bằng mã (kiem-v3.ts + các kiểm trong index.ts)
  → lỗi chặn: MỘT vòng sửa có chỉ đích → kiểm lại
  → đệm theo lá số + năm + nhóm (noi_dung_ai), mỗi lá số chỉ sinh một lần
```

Route `/api/luan-giai-v3`: tổng quan mở cho khách (giới hạn 3 lá số mới / ngày / IP),
chuyên sâu cần đăng nhập, cắt cứng ở 52 giây.

### 2.2 Những gì đã có — không làm lại

| Hạng mục | Ở đâu |
|---|---|
| Truy hồi lai vector + từ khoá, trộn RRF | `lib/rag/truy-hoi.ts` |
| Truy hồi theo cung, chấm khớp sao–cung, lọc đoạn rác, xoay vòng giữa truy vấn | `lib/rag/v3/truy-hoi-v3.ts` |
| Mức tin cậy tài liệu **có tác dụng thật**: cộng điểm sau cổng khớp, nhãn trong prompt, kiểm "bổ trợ không làm căn cứ duy nhất"; admin gán lại được | `truy-hoi-v3.ts` `DIEM_TIN_CAY`, `lib/rag/tai-lieu-meta.ts`, `/admin/knowledge` |
| Luật ngầm (ghi chú chuyên gia, nội bộ): dùng nhưng không nhắc | `LOAI_NGUON_AN`, kiểm `lo-luat-ngam` |
| Luật ghép nghĩa hai sao (được ghép trừ khi nguồn nói ngược) + cờ `ghep` | `prompt-v3.ts` luật 12 |
| Sổ ý chống lặp giữa các phần | `lib/rag/v3/so-y.ts` |
| Phiên bản kho trên mỗi câu + nút "Tạo bản mới" | `phienBanKho()`, route `taoMoi` |
| Phase A của v1: ngân sách từ là trần, chỗ cắm mẫu vàng, chia ba nhóm luật | Phụ lục V1 mục 9 |
| Bộ đo so mù nhiều giám khảo | `scripts/so-sanh-v3.ts` |

### 2.3 Những gì CHƯA có — dù v1 vẽ trong sơ đồ

**Claim Synthesizer** và **Content Planner** (Phụ lục V1 mục 5–7) **chưa có dòng mã
nào**: không có `lib/rag/claim.ts`, không có `ke-hoach-noi-dung.ts`. Luồng v3 làm dàn ý
có mã căn cứ ngay trong một lượt prompt. Thư viện tri thức cắm vào **luồng v3**, không
cắm vào hai lớp đó.

### 2.4 Lỗ hổng so với mục tiêu chuyên môn

| Hạng mục | Đang có | Lỗ hổng |
|---|---|---|
| Sao đưa vào dữ kiện | chính tinh, tứ hoá, ~30 phụ tinh cát/hung | ~50 sao bị bỏ trừ khi thuộc chủ đề |
| Nghĩa sao | một dòng chung mỗi sao (từ điển engine) | không theo cung, không theo độ sáng, không có nguồn |
| Nghĩa tổ hợp | model tự ghép (nay có luật 12 + cờ `ghep`) | không có tri thức riêng về tổ hợp |
| Cách cục | engine nhận 25 cách; mỗi câu chỉ truy vấn sách cho 2 | mất thông tin trên lá số nhiều cách |
| Truy hồi | mỗi cung một truy vấn, chỉ chính tinh + tứ hoá, 8 đoạn / câu | phụ tinh không được hỏi đích danh |
| Vận hạn | đại vận, tiểu hạn, nguyệt hạn, 9 lưu tinh, lưu tứ hoá | chưa có tứ hoá đại vận, chưa có phi hoá |

Gốc chung: tri thức được **lấy lúc người dùng chờ**, nên mọi con số bị bóp theo thời
gian của route.

---

## 3. Đích [ĐÍCH]

```
TẦNG 1 — ENGINE: an sao, tính quan hệ → hợp đồng dữ kiện (mục 5)
        ↓
TẦNG 2 — THƯ VIỆN TRI THỨC: dựng TRƯỚC (offline), lúc luận chỉ TRA
         mọi mục có điều kiện khớp lá số, không giới hạn số sao / số bộ
        ↓
LUỒNG v3 ĐANG CHẠY: dàn ý có mã (thêm mã T### cho mục thư viện) → bài → kiểm
        ↓
người đọc

Thư viện thiếu mục → dùng đoạn sách như hiện nay (nhãn "chưa kiểm")
  → ghi SỔ LỖ HỔNG → bổ sung thư viện OFFLINE (không trích lúc người dùng chờ)
```

Kho sách không bị bỏ: nó là lưới đỡ, và mỗi lần phải dùng tới là một tín hiệu bổ sung.

---

## 4. Mười nguyên tắc

1. Dữ kiện lá số do engine tính, không do AI.
2. Tri thức nào cũng phải có căn cứ trỏ về một đoạn cụ thể.
3. **Tổ hợp có tri thức riêng thì theo tri thức đó.** Được ghép nghĩa hai sao đơn lẻ khi
   thư viện và sách không nói gì về tổ hợp ấy (chủ dự án chốt 26/09) — nhưng ý ghép
   được đánh dấu ngầm và cặp sao vào sổ lỗ hổng. Ghép ngược với một mục có sẵn là lỗi.
4. Chỉ dùng những kiểu quan hệ engine tính được (bộ từ vựng đóng, mục 5.2).
5. Mặc định là **cộng thêm**; điều chỉnh / hoá giải / thay thế phải chỉ rõ mục đích và có
   chữ trong sách nói rõ.
6. Độ tin đến từ bằng chứng (mức tin cậy tài liệu, số nguồn độc lập), không từ model tự chấm.
7. Trường phái là phạm vi áp dụng, không phải mâu thuẫn.
8. Thư viện không chứa câu văn của bài viết: mỗi mục là **một câu nghĩa trung tính**.
9. Thư viện đổi thì không lặng lẽ đổi bài đã giao — người đọc tự bấm "Tạo bản mới".
10. Câu trích sách nằm trong Supabase, **không vào repo** (repo công khai, sách có bản quyền).

---

## 5. Hợp đồng dữ kiện engine

### 5.1 Kiểm kê — đo trên 720 lá số tổng hợp ngày 26/09/2026 [ĐANG CHẠY]

| Dữ kiện | Engine có? | Chi tiết đo được | Ghi chú cho thư viện |
|---|---|---|---|
| Chính tinh | có | 14 | có độ sáng M/V/Đ/B/H |
| Phụ tinh | có | 55 tên | độ sáng chỉ có cho một phần (dưới) |
| Sao vòng (Bác Sĩ, Thái Tuế, …) | có | 24 tên, loại `vong-sao` | trùng tên với phụ tinh ở vài sao (Đại Hao, Tiểu Hao, Tang Môn, Bạch Hổ) — khớp theo tên đủ |
| Tứ hoá gốc | có | 4, là một "sao" đặt cùng cung với sao được hoá | **không ghi sao nào được hoá**; suy lại được từ `TU_HOA[canNam]` — hợp đồng phải thêm trường `hoaCua` |
| Độ sáng | có | 32 sao: 14 chính tinh + Kình, Đà, Không, Kiếp, Hoả, Linh, Xương, Khúc, Mã, Riêu, Hình, Khốc, Hư, Tang Môn, Bạch Hổ, Đại Hao, Tiểu Hao, Hoá Kỵ | phụ tinh ngoài danh sách này không mang độ sáng → mục có điều kiện độ sáng cho chúng là không khớp được |
| Tuần, Triệt | có | thuộc tính cung (`coTuan`, `coTriet`), ~2 cung mỗi loại / lá | không phải sao — hợp đồng biểu diễn là thuộc tính cung |
| Vòng Tràng Sinh | có | 12 giai đoạn, thuộc tính cung (`trangSinh`) | như trên |
| Vô chính diệu | có | ~2 cung / lá; dữ kiện v3 đã ghi "mượn chính tinh cung xung chiếu" | quan hệ `muon-tu` (mục 5.2) |
| Cung Thân | có | `laCungThan`, `thanCuCung` | |
| Cách cục | có | 25 cách định nghĩa, 23 gặp trên mẫu (Xương Khúc 35%, Sát Phá Tham 23%, …) | `lib/tuvi/cach-cuc.ts` |
| Đại vận, tiểu hạn, nguyệt hạn | có | `cungDaiVan`, `cungTieuHan`, `cungNguyetHan` | |
| Lưu tinh theo năm | có | 9: Thái Tuế, Lộc Tồn, Kình, Đà, Mã, Khốc, Hư, Tang Môn, Bạch Hổ | |
| Lưu tứ hoá theo năm | có | theo can năm xem | |
| Tứ hoá đại vận | **chưa** | | chỗ đặt sẵn trong hợp đồng (lớp `dai-van`) |
| Phi hoá Bắc phái, tự hoá | **chưa** | | chỗ đặt sẵn: quan hệ `hoa-den`, `tu-hoa` |

### 5.2 Bộ từ vựng quan hệ — đóng, do engine quyết

Mọi quan hệ **neo vào một cung gốc** (cung đang luận):

| Quan hệ | Nghĩa | Ví dụ |
|---|---|---|
| `o-cung` | sao nằm tại cung gốc | Tử Vi tại Quan Lộc |
| `xung` | sao ở cung xung chiếu | Tham Lang chiếu từ Phu Thê |
| `tam-hop` | sao ở một trong hai cung tam hợp | |
| `tam-phuong` | sao ở bất kỳ cung nào trong tam phương tứ chính (gốc + xung + 2 tam hợp) | "Quan Lộc hội Tả Hữu" |
| `giap` | **hai** sao ở **hai** cung kề, kẹp cung gốc — cần đủ cả hai bên | Kình Đà giáp Mệnh |
| `muon-tu` | cung gốc vô chính diệu, mượn chính tinh cung xung | |
| *(đặt sẵn)* `hoa-den`, `tu-hoa` | phi hoá từ can cung A vào cung B; tự hoá | chưa tính — không mục nào được dùng cho tới khi engine có |

Thuộc tính cung: `tuan`, `triet`, `trangSinh`, `voChinhDieu`, `laThan`. Thuộc tính sao:
`doSang`, `lop` (`goc` | `dai-van` | `luu-nien` | `nguyet`).

---

## 6. Thư viện tri thức [ĐÍCH — lát cắt đầu đang làm, mục 11]

### 6.1 Một mục

```ts
interface MucThuVien {
  id: string;                        // "TV-SN-0042"
  schemaVersion: 1;
  chuDe: string[];                   // ['su-nghiep']
  dieuKien: {
    cung: string[];                  // cung gốc được phép neo: ['Quan Lộc'] — rỗng = mọi cung
    sao: { ten: string; quanHe: QuanHe; doSang?: string[] }[];  // phải có đủ
    khong?: { ten: string; quanHe: QuanHe }[];                  // phải vắng (phá cách)
    thuocTinh?: { tuan?: boolean; triet?: boolean; trangSinh?: string[]; voChinhDieu?: boolean };
  };
  y: string;                         // MỘT câu nghĩa trung tính, ≤ 45 chữ
  nhan: { chieu: 'cat' | 'hung' | 'trung'; muc: 'manh' | 'vua' | 'nhe'; linhVuc: string[] };
  cheDo: 'add' | 'modify' | 'neutralize' | 'override';
  dich?: string[];                   // id mục bị tác động — BẮT BUỘC khi cheDo ≠ add
  canCu: { chunkId: string; documentId: string; trich: string }[];  // ≥ 1
  truongPhai: 'chung' | 'nam-phai' | 'bac-phai' | 'celes';
  duyet: 'chua' | 'da-duyet' | 'bi-bac';
  dotTrich: string;                  // đợt trích sinh ra mục — số đo nằm ở đợt, không ở mục
}
```

Luật của trường `y` — kiểm bằng mã: ≤ 45 chữ; không "bạn"; không "nên / hãy / cần phải";
không từ nối chuyển ý kiểu kể chuyện. `y` là ngữ nghĩa, bài văn là việc của khâu viết.

**Mức tin cậy không nằm trong mục.** Mục trỏ tới tài liệu qua `canCu.documentId`; mức
đọc tươi từ `knowledge_documents`. Admin đổi mức một tài liệu là mọi mục theo ngay.

**Trạng thái duyệt là của từng mục; độ chính xác là của cả đợt trích** ("đợt 3: đúng
92% trên 100 mẫu"). Không có trạng thái "đã lấy mẫu" cho một mục.

**Nguồn chuyên gia Celes** (`truongPhai: 'celes'`, tài liệu loại ghi chú chuyên gia) là
luật ngầm: tham gia khớp và phân xử như mọi mục, nhưng bài không bao giờ nhắc tới.
Chỉ trang quản trị thấy.

### 6.2 Chế độ tương tác

| Chế độ | Nghĩa | Khi nào được gán |
|---|---|---|
| `add` (mặc định) | chồng thêm nghĩa | luôn luôn |
| `modify` | đổi mức / sắc thái của mục đích | câu trích có dấu hiệu rõ + có `dich` |
| `neutralize` | hoá giải mặt xấu của mục đích | câu trích có "giải", "hoá giải", "không sợ", "chẳng kỵ"… + có `dich` |
| `override` | thay hẳn nghĩa mục đích (phản vi kỳ cách, phá cách) | câu trích có "phản vi", "trái lại", "lại thành", "phá cách"… + có `dich` |

Thiếu dấu hiệu hoặc thiếu đích → **ép về `add`** (bằng mã). Mặc định `add` vì nó không
bao giờ lặng lẽ xoá tri thức.

---

## 7. Dựng thư viện — offline

1. **Chọn đoạn**: từ trên xuống (khoá sao × cung của chủ đề, nhiều cách viết: tên đủ,
   tên tắt "Vũ, Tướng", tên cung cổ "Bào", "Thê") và từ dưới lên (đọc trọn các mục sách
   đặt tên theo cung của chủ đề). Chiều dưới lên là cách duy nhất bắt được ngoại lệ hiếm.
2. **Trích**: model đọc lô đoạn, trả các mục theo lược đồ 6.1 kèm câu trích nguyên văn.
3. **Kiểm tất định** — trượt là bỏ, không nhờ model:
   - câu trích có nguyên văn trong đoạn (chuẩn hoá khoảng trắng);
   - mọi tên sao trong điều kiện có trong từ điển engine; độ sáng chỉ cho 32 sao có độ sáng;
   - mọi sao và cung trong điều kiện **được nhắc** trong câu trích, câu liền trước hoặc đề
     mục (dùng bảng tên tắt / bí danh cung của `truy-hoi-v3.ts`);
   - `y` qua luật 6.1; chế độ ≠ `add` phải qua luật 6.2.
4. **Gộp**: cùng điều kiện, cùng chiều → một mục, nhiều căn cứ. Bỏ bản chép phú của nhau
   (hàm `doTrung` có sẵn).
5. **Mâu thuẫn**: cùng điều kiện, ngược chiều → giữ cả hai, mục chưa duyệt, vào hàng duyệt.
6. **Đo đợt trích**: tỉ lệ qua kiểm tất định; lấy mẫu chấm độ đúng.

**Sổ lỗ hổng**: lúc luận, cấu hình không khớp mục nào và các cặp sao bị ghép → đếm vào
sổ (không lưu ngày giờ sinh, chỉ cấu hình). Sổ là danh sách việc bổ sung, xếp theo tần
suất. **Bản đồ độ phủ** lấy thẳng từ sổ này.

---

## 8. Lúc luận — tra thư viện

1. **Bộ khớp** chạy trên các cung câu hỏi đọc, qua **chỉ mục theo tên sao** (không duyệt
   hết thư viện). So điều kiện trong bộ nhớ — mili-giây, nên không còn "2 cách cục",
   "một truy vấn mỗi cung".
2. **Gom nhóm**: mục tổ hợp đứng cùng các mục đơn cấu thành nó — tổ hợp là hiệu ứng chung,
   mục đơn là nền.
3. **Chế độ**: `override` / `neutralize` gắn cờ lên mục đích (mục đích vẫn hiện, kèm chú
   "bị … lật / hoá giải") — model không phải tự đoán.
4. **Xung đột**: hai mục `add` ngược chiều cát/hung cùng khớp trên một cung → vẫn đưa cả
   hai, kèm lời dặn "cân cả hai", và cặp đó vào hàng duyệt ưu tiên cao (dấu hiệu một chế độ
   lẽ ra phải là `override`).
5. **Ngân sách**: chọn theo ngân sách chữ, xếp theo: tổ hợp trước → khớp cung chính →
   mức tin cậy → `muc`.
6. **Mã T###** trong prompt cạnh F### và E###; dàn ý trích T### như trích E###.
7. **Kho sách dự phòng**: vẫn truy hồi đoạn sách; khi thư viện đã khớp đủ, số đoạn sách
   giảm để giữ độ dài prompt.

---

## 9. Vận hạn [ĐÍCH — sau lát cắt đầu]

Bổ sung engine: tứ hoá đại vận, phi hoá Bắc phái (cần chủ dự án chọn nhánh). An sao vẫn
Nam phái; Bắc phái chỉ dùng cho vận hạn (AGENTS.md quyết định số 1). Luận năm = chồng lớp
gốc / đại vận / lưu niên, khớp các mục có điều kiện `lop`.

---

## 10. Phiên bản và làm mới bài cũ [ĐANG CHẠY]

- Mỗi lá số chỉ sinh một lần (CEL-122); khoá đệm không chứa phiên bản.
- Mỗi câu lưu `kho` = dấu vân tay kho tri thức đang xuất bản; bản ghi lưu phiên bản
  prompt / khung / dữ kiện / truy hồi ở cột `phien_ban`.
- **Phương án C** (chủ dự án chốt): người đã đăng nhập bấm "Tạo bản mới" khi kho đổi; mỗi
  lá số một lần mỗi phiên bản kho. Khách không bấm được.
- `THE_HE_DEM` chỉ tăng khi chủ dự án đồng ý (đo 26/09: tăng liên tục làm một lá số sinh
  lại 8 lần trong 2 ngày).

---

## 11. Lát cắt đầu: "Sự nghiệp — lá số gốc"

### 11.1 Phạm vi

- Câu hỏi: **SN01, SN02, SN03, SN05, SN06** — năm câu sự nghiệp không dùng dữ kiện vận
  hạn. SN04, SN07 (chuỗi đại vận) và SN08 (đại vận + tiểu hạn) nằm ngoài: engine còn thiếu
  phần vận hạn, đưa vào là đo engine chứ không đo thư viện.
- Cung: Quan Lộc (chính) + tam phương (Mệnh, Tài Bạch, Thiên Di) + phụ trợ của khung.
- Thư viện: dự kiến khoảng 200 mục; lượt 1 trích được 1.091 mục từ phần sách liên quan sự nghiệp.
- Bật trong production **chỉ khi đạt đủ ngưỡng 11.2**.

### 11.2 Ngưỡng đạt — CHỐT TRƯỚC KHI CHẠY (26/09/2026)

Bộ đo: **12 lá số tổng hợp cố định** (sinh bằng hạt giống trong script, không lá số thật)
× 5 câu = **60 cặp**. Bản A = production hiện tại (prompt 2026.09.17, truy hồi 2026.09.6).
Bản B = A + thư viện. Cùng model viết.

| # | Tiêu chí | Cách đo | Ngưỡng |
|---|---|---|---|
| 1 | Ghép bỏ qua thư viện | ý gắn `ghep` mà cặp sao của nó đã có mục tổ hợp khớp trên lá số, chia cho tổng số ý của B | **≤ 1%** |
| 2 | Độ phủ căn cứ nguồn | tỉ lệ ý trong dàn ý có ít nhất một mã E### hoặc T### | **B > A** |
| 3 | Độ phủ thư viện | trên 12 lá × 4 cung (Quan Lộc, Mệnh, Tài Bạch, Thiên Di) = 48 đơn vị: đơn vị có ít nhất một mục khớp neo vào cung đó | **≥ 80%** |
| 4 | So mù | 3 giám khảo (gpt-oss-120b, gpt-4o-mini, gpt-5.6-luna) chấm **đủ 60 cặp, không dừng sớm**; tỉ lệ thắng = thắng / (thắng + thua), bỏ hoà | **trung bình ≥ 60%**, không giám khảo nào < 50% |
| 5 | Thời gian | p95 thời gian mỗi câu (ms) | **B ≤ A + 2 giây và B ≤ 45 giây** |

Chỉ theo dõi, **không phải tiêu chí** (đặt làm tiêu chí thì khuyến khích nhồi): số mục T
dùng mỗi bài, số cặp `add` ngược chiều, tỉ lệ qua kiểm tất định của đợt trích, độ đúng
trên mẫu.

Trượt một tiêu chí → không bật; báo kết quả kèm khâu hỏng (trích / khớp / căn cứ / bài).

### 11.3 Kết quả lượt 1 — 26/09/2026: TRƯỢT tiêu chí 4, CHƯA bật

Thư viện đợt `sn-1`: 997 đoạn sách → 1.746 ứng viên → **1.295 qua kiểm tất định (74%)** → gộp còn
**1.091 mục** (741 tổ hợp, 97 mục có ≥ 2 tài liệu độc lập, 19 cặp mâu thuẫn). Tốn 0,64 triệu token vào
(0,27 triệu được đệm), 0,37 triệu ra.

| # | Tiêu chí | Kết quả | Đạt? |
|---|---|---|---|
| 1 | Ghép bỏ qua thư viện | 0,4% (1 / 258 ý) | đạt |
| 2 | Ý có mã nguồn E / T | A 51,1% → B 78,3% | đạt |
| 3 | Độ phủ | 48 / 48 = 100% | đạt (xem lưu ý) |
| 4 | So mù | luna 48% và 42% (hai lượt), gpt-4o-mini 50% (30 cặp) rồi 46% (50 cặp) — trung bình ~47% | **trượt** |
| 5 | p95 mỗi câu | A 30,2 giây → B 22,4 giây | đạt |

Theo dõi: 14 mục T mỗi bài (chạm trần); 160 / 258 ý trích T; **392 cặp `add` ngược chiều trên 60 bài
(~6,5 mỗi bài)**; token vào B +7%; đạt hết luật 58/60 ở cả hai bản.

**Lượt so mù chưa hợp lệ hoàn toàn:** chuỗi dự phòng chỉ gọi được hai model khác nhau (luna,
gpt-4o-mini) — groq / gemini / anthropic đều rơi về luna. Muốn đủ ba giám khảo khác nhau cần chủ dự án
bật thêm một nhà cung cấp trong trang quản trị models. Kết quả hiện có đã đủ để kết luận không đạt 60%.

**Chẩn đoán:** A và B cùng độ dài (354 chữ), cùng giọng; B đổi *nội dung được nêu* sang điều có căn cứ.
Giám khảo so mù chấm "đọc như người thật, cụ thể, có giá trị" — không chấm được độ đúng chuyên môn. Thư
viện tăng độ có căn cứ mà không làm bài *hay hơn*. Lưu ý thêm: tiêu chí 3 dễ đạt vì nhiều mục không
giới hạn cung.

**Bốn câu 11.4 — đã có số:** (1) độ đúng trích: 74% qua kiểm tất định; trên 40 mẫu, giám khảo
gpt-4o-mini thấy 80% đúng cả điều kiện lẫn nghĩa — lỗi chính là **bỏ sót điều kiện cung** (ngữ cảnh
đoạn nói về một cung, mục lại để "mọi cung"). (2) 15 cuốn có nhiều quy tắc sự nghiệp hơn dự kiến
(1.091 mục, 741 tổ hợp). (3) `add` mặc định sinh ~6,5 cặp ngược chiều mỗi bài — cao, nhiều cặp là
cùng bộ sao khác độ sáng mà lúc trích bị mất độ sáng. (4) Lượng mục khớp vượt xa ngân sách (một câu khớp
tới ~150 mục) — trần 14 đang cắt.

**Hướng tiếp** (chủ dự án chọn): (a) chủ dự án tự đọc mù ~10 cặp để chấm độ ĐÚNG — thứ giám khảo máy
không chấm được; (b) sửa khâu trích (bắt điều kiện cung và độ sáng từ ngữ cảnh đoạn) rồi đo lại với
cùng ngưỡng; (c) đổi ngưỡng 4 thành "không thua" (≥ 45%) kèm tiêu chí 2 — là đổi luật đã chốt, chỉ chủ
dự án được quyết.

### 11.5 Bộ đo ĐỘ ĐÚNG — chốt 26/09/2026, TRƯỚC khi chạy

Chủ dự án yêu cầu sau lượt 1: so mù đo độ *hay*, không đo độ *đúng* — cần bộ đo riêng.

**Gói bằng chứng CHUNG cho mỗi cặp (lá số, câu)** — hai bản bị đối chiếu với đúng một gói:
- dữ kiện lá số F### (engine tính; giống hệt nhau ở A và B);
- N## = hợp mọi đoạn sách mà A **hoặc** B đã dùng, cộng câu trích gốc đứng sau các mục thư viện B
  đã dùng. Chỉ đưa văn sách, **không** đưa câu nghĩa của mục thư viện — tránh thiên vị B.

**Cách chấm:** giám khảo chấm TỪNG BÀI riêng, không biết bài của bản nào. Tách 5–10 nhận định chính
(bỏ câu minh hoạ không mang khẳng định), mỗi nhận định vào một loại:

| Loại | Nghĩa |
|---|---|
| `co-can-cu` | dữ kiện lá số và / hoặc đoạn N## ủng hộ, đúng cấu hình của lá số này |
| `mau-thuan` | trái với dữ kiện, hoặc trái với đoạn N## nói về đúng cấu hình ấy |
| `chung-chung` | đúng với gần như ai, không gắn gì riêng của lá số |
| `khong-kiem-duoc` | không có gì trong gói ủng hộ hay phản bác |

Thêm phần "vì sao": đếm tên sao / cung nêu sai so với dữ kiện.

**Kiểm giám khảo trước — điều kiện để tin số của giám khảo đó:**
- *Cài lỗi*: 12 bài, đổi một tên sao trong phần "vì sao" thành một chính tinh không có trong dữ kiện →
  giám khảo phải bắt ≥ 10 / 12.
- *Lệch lá*: 12 bài chấm với dữ kiện + nguồn của MỘT LÁ SỐ KHÁC → tỉ lệ `co-can-cu` phải thấp hơn bài
  thật ít nhất 15 điểm.
- Giám khảo trượt một trong hai → loại số của giám khảo đó.

Giám khảo: gpt-5.6-luna và gpt-4o-mini (hai model khác nhau duy nhất gọi được, xem 11.3).

**B đúng hơn A khi MỌI giám khảo hợp lệ cùng cho:**
1. tỉ lệ `mau-thuan` của B ≤ A;
2. tỉ lệ `co-can-cu` của B ≥ A + 10 điểm;
3. tỉ lệ `chung-chung` của B ≤ A + 3 điểm;
4. lỗi sao / cung trong "vì sao" của B ≤ A.

Bộ đo này KHÔNG thay tiêu chí so mù (11.2 #4). Bật thư viện khi so mù trượt mà độ đúng đạt là đổi luật
đã chốt — chủ dự án quyết.

### 11.4 Bốn câu chỉ lát cắt trả lời được

1. Model trích quy tắc từ sách cổ tiếng Việt đúng bao nhiêu phần trăm?
2. Riêng sự nghiệp, 15 cuốn trong kho có bao nhiêu quy tắc tổ hợp thật?
3. Mặc định `add` sinh ra bao nhiêu cặp ngược chiều?
4. Lượng mục khớp có vừa ngân sách prompt không?

---

## 12. Đo lường

Đo **từng khâu**, bài kém thì biết hỏng ở đâu:

| Khâu | Chỉ số |
|---|---|
| Trích | tỉ lệ qua kiểm tất định; độ đúng trên mẫu |
| Khớp | độ phủ (11.2 #3); số mục khớp / câu |
| Căn cứ | 11.2 #1, #2 |
| Bài | so mù ≥ 3 giám khảo × ≥ 60 cặp (một giám khảo tự chấm lệch tới ±30%) |

Bốn tầng eval của v1 (Phụ lục V1 mục 8) vẫn là khung chung.

---

## 13. Lộ trình

| Giai đoạn | Việc | Trạng thái |
|---|---|---|
| Phase A (v1) | ngân sách từ là trần, mẫu vàng, chia nhóm luật | **xong** |
| Luồng v3 | tổng quan + chuyên sâu, sổ ý, tóm lại, bức tranh lớn | **đang chạy** |
| Dọn nền | mức tin cậy có tác dụng + admin gán lại; luật ngầm; phiên bản kho; Tạo bản mới | **xong 26/09** |
| Lát cắt Sự nghiệp | mục 11 | **lượt 1 xong 26/09 — trượt so mù, chưa bật** (11.3) |
| Toàn thư viện | các chủ đề còn lại, đọc toàn kho | chỉ khi lát cắt đạt + chủ dự án duyệt chi phí |
| Vận hạn | mục 9 | sau khi chủ dự án chọn nhánh phi hoá |
| Duyệt + sổ lỗ hổng trên trang quản trị | | sau lát cắt |
| Claim Synthesizer / Content Planner (v1 Phase B) | | **hoãn** — xem nhật ký QĐ-07 |

---

## 14. Nhật ký quyết định

| # | Quyết định | Vì sao | Phương án đã bác | Xét lại khi |
|---|---|---|---|---|
| QĐ-01 | Tri thức dựng trước, lúc luận chỉ tra | route còn ~13 giây dư trên trần 52 giây; tra trong bộ nhớ mất mili-giây | trích quy tắc lúc người dùng chờ | ngân sách thời gian route nới ra đáng kể |
| QĐ-02 | Quan hệ neo vào cung, bộ từ vựng đóng | quan hệ hai ngôi không biểu diễn được "giáp", tam phương | `{from, type, to}` tự do; đồ thị | engine thêm loại quan hệ mới |
| QĐ-03 | Chế độ mặc định `add` | Tử Vi là chồng nghĩa; "cụ thể thắng" xoá nghĩa nền | tổ hợp ghi đè nghĩa đơn; mặc định `modify` | số cặp ngược chiều (11.3 #3) quá lớn |
| QĐ-04 | Mức tin cậy nằm ở tài liệu | admin đổi mức thì mọi mục theo | chép mức vào từng mục | — |
| QĐ-05 | Được ghép nghĩa hai sao trừ khi có tri thức nói khác | chủ dự án 26/09 | cấm ghép tuyệt đối | sổ lỗ hổng cho thấy ghép sai nhiều |
| QĐ-06 | Nguồn chuyên gia Celes là luật ngầm | chủ dự án 26/09 | hiện tên nguồn trong bài | — |
| QĐ-07 | Hoãn Claim Synthesizer / Planner | luồng v3 một lượt đã đạt chất lượng đo được; thêm lớp là thêm lượt gọi và độ trễ | làm Phase B trước thư viện | so mù cho thấy thư viện không đủ, lỗi nằm ở khâu luận |
| QĐ-08 | Không dùng đồ thị (Neo4j, GraphRAG) | quan hệ do engine tính, thư viện vài nghìn mục | cơ sở dữ liệu đồ thị | số quan hệ vượt vài trăm nghìn |
| QĐ-09 | Không dùng reranker | chưa đo ra tăng | reranker sau RRF | đo ra NDCG / MRR tăng rõ |
| QĐ-10 | Không có điểm tin cậy do model chấm | model tự chấm không hiệu chỉnh được | điểm 0–1 cho mỗi mục | có dữ liệu thực nghiệm để hiệu chỉnh |
| QĐ-11 | Bài cũ làm mới theo phương án C | "đọc lại phải thấy đúng bài cũ" (CEL-122) | giữ mãi (A); làm mới toàn bộ (B) | — |
| QĐ-12 | Lát cắt đầu là Sự nghiệp, không phải Tính cách | tính cách chạy tạm ổn bằng nghĩa sao đơn nên không thử được kiến trúc | Tính cách | — |
| QĐ-13 | Thư viện tạm lưu trong `noi_dung_ai` (bề mặt `thu-vien`) | máy làm không chạy được SQL; bảng có sẵn khoá duy nhất đúng dạng | chờ chủ dự án chạy SQL bảng riêng | chủ dự án chạy `supabase/thu-vien-tri-thuc.sql` (sẽ viết khi lát cắt đạt) |
| QĐ-15 | Lát cắt Sự nghiệp lượt 1 KHÔNG bật (26/09) | trượt so mù (~47% < 60%) theo luật đã chốt trước | dời ngưỡng sau khi thấy kết quả | chủ dự án chọn hướng ở 11.3, hoặc lượt đo sau đạt đủ năm tiêu chí |
| QĐ-14 | `THE_HE_DEM` chỉ tăng khi chủ dự án đồng ý | tăng liên tục làm bài "load lại" trên mọi thiết bị | tự tăng khi đổi prompt | — |

---

## 15. Chi phí

Số từ `ai_usage_logs`. Quy về "phần trăm lượng tiêu ngày 25/09" (15,6 triệu token vào):

| Khoản | Ước tính |
|---|---|
| Một lá số, tổng quan | ~12 lượt ≈ 0,7% |
| Một chủ đề chuyên sâu | ~5 lượt ≈ 0,3% |
| Dựng lát cắt Sự nghiệp (một lần) | ≈ 0,2–0,3 ngày — **chủ dự án đã duyệt 26/09** |
| Dựng toàn thư viện (một lần) | ≈ 1,3–1,6 ngày; giảm ~một nửa với Batch API — **cần duyệt riêng** |
| Mỗi lần luận sau khi có thư viện | không tăng; token vào ước giảm 15–25% |

---

## 16. Rủi ro

| Rủi ro | Cách xử |
|---|---|
| Model trích sai điều kiện | kiểm tất định mục 7.3; mục chưa duyệt không dùng cho miền rủi ro |
| Sách mâu thuẫn, nhất là phụ tinh | mức tin cậy thật (chủ dự án xếp lại 15 tài liệu) |
| Lời phán nặng của sách cổ | `y` viết ở mức ôn hoà ngay lúc dựng |
| Kho sách ít quy tắc tổ hợp cho một chủ đề | 11.3 #2 trả lời; thiếu thì dựa thêm nguồn chuyên gia Celes |
| Prompt phình khi nhiều mục khớp | ngân sách chữ, giảm đoạn sách khi thư viện đủ |
| Đổi kho bật "Tạo bản mới" cho mọi lá số | gom thay đổi kho thành đợt |

---

## 17. Việc chủ dự án

1. Xếp lại mức tin cậy 15 tài liệu; lưu trữ tài liệu "README" đang xuất bản.
2. Danh sách phụ tinh / bộ / cách cục bắt buộc cho sự nghiệp (để kiểm độ phủ).
3. Chọn nhánh phi hoá Bắc phái (cho vận hạn, chưa gấp).
4. Duyệt chi phí dựng toàn thư viện — chỉ khi lát cắt đạt.

---

## 18. Ghi chú vận hành

- Mọi thay đổi tính năng / logic cập nhật `PRODUCT-BACKLOG.xlsx` trong cùng commit.
- Không đổi truy hồi / prompt / model khi chưa có bài kiểm hồi quy.
- Tăng `PHIEN_BAN_*` tương ứng khi đổi luật đo được.
- SQL mới chỉ cộng thêm, ghi `supabase/DA-CHAY.md`.

---
---

# Phụ lục V1 — bản chốt ngày 22/09/2026 (giữ nguyên số mục)


> Tài liệu thiết kế. Viết cho người (hoặc AI) sẽ implement.
> Chốt sau năm vòng phản biện, ngày 2026-09-22.
> **Không thêm lớp nào nữa trừ khi eval chỉ ra một failure mode mới.**

---

## 1. Vấn đề đang giải

Phản hồi gốc của chủ dự án về các bản luận giải AI:

- lan man, dài dòng, chưa đúng trọng tâm
- dùng từ trừu tượng, khó hiểu với người chưa biết Tử Vi
- diễn đạt chưa trôi chảy, câu từ lủng củng
- đọc 12 phần liên tiếp thấy lặp đi lặp lại vài ý

Chẩn đoán sau khi đọc code:

1. **Thừa luật, thiếu mẫu.** `CHUAN_NGON_NGU_CELES` khoảng 11.000 ký tự, ~80% là
   điều cấm. Không có một bản văn mẫu hoàn chỉnh nào trong prompt. Mạch văn là
   thuộc tính cấp đoạn; luật cấp câu không dạy được.
2. **Ngân sách từ là ĐÍCH chứ không phải TRẦN.** `nganSachTu()` phát chỉ tiêu từ
   cho mọi tiêu chí bất kể lá số có gì để nói, và prompt chốt "Đủ ba phần, đủ tiêu
   chí của từng phần". Đây là nguyên nhân CƠ HỌC của lan man — mạnh hơn mọi luật
   văn phong cộng lại.
3. **Không ai chịu trách nhiệm luận chuyên môn.** RAG trả về văn sách, Writer vừa
   phải luận vừa phải viết. Tầng chuyên môn cao nhất đang nằm ở tầng viết văn.
4. **Chống lặp bằng cơ chế tuần tự.** `daNoiTruoc` chỉ mang câu `ketLuan`, cửa sổ
   9 mục, chặng sau không biết chặng trước sẽ cần gì. Đã thử, không đủ.
5. **Không đo được thứ đang phàn nàn.** Mọi phép đo hiện có là đếm từ khoá. Không
   có gì đo mạch lạc, trọng tâm, trôi chảy.

---

## 2. Năm trách nhiệm tách sạch

| Tầng | Câu hỏi nó trả lời |
|---|---|
| RAG | Celes **đọc được** gì? |
| Claim Synthesizer | Từ đó **kết luận được** gì? |
| Content Planner | Điều nào **nói ở đâu**, sâu tới đâu? |
| Writer | **Nói thế nào** cho ra chất Celes? |
| Validator | Có **vượt căn cứ** hay phạm luật không? |

Nguyên tắc bất di bất dịch: **Writer không bao giờ nhìn thấy văn sách.**

---

## 3. Sơ đồ

```
KHO TRI THỨC
  chunk + authority tier [đã có] + forbidden_inference [mới]
        |
        v
RETRIEVAL  [đã có gần đủ]
  query rewriting từ lá số | vector + ts_rank | RRF | đa dạng nguồn | authority
  + RERANKER [mới, chỉ giữ nếu eval chứng minh]
        |
        v
EVIDENCE PACK (F### + E###)
        |
        v
CLAIM SYNTHESIZER  [LỚP MỚI — lõi chuyên môn]
  batch theo NGÂN SÁCH TOKEN, không hard-code số lượt
        |
        +-- A. STRUCTURAL CHECK   (tất định, mọi claim)
        +-- B. GROUNDING CHECK    (semantic, CÓ ĐIỀU KIỆN)
        |
        v
CONTENT PLANNER  (chỉ bề mặt dài)
  claim -> tiêu chí | signature | role | importance
        |
        v
RÀNG BUỘC PHÂN BỐ (tất định — vi phạm thì plan lại, chưa gọi Writer)
        |
        v
CELES WRITER
  chỉ thấy: Claim Card + role + độ dài + 1-3 mẫu vàng
        |
        v
OUTPUT GROUNDING CHECK  [mới — xem §7.3, luật miễn trừ câu cảnh]
        |
        v
LANGUAGE / SAFETY VALIDATOR  [đã có]
   PASS -> ra     FAIL -> EDITOR CÓ ĐIỀU KIỆN -> validate lại -> không tăng thì rollback
```

---

## 4. Cái ĐÃ CÓ — không làm lại

Kiểm trên code ngày 2026-09-22. Đừng xây lại những thứ này.

| Hạng mục | Ở đâu |
|---|---|
| Truy hồi lai vector + từ khoá, trộn RRF (k=60) | `lib/rag/truy-hoi.ts` |
| Viết lại truy vấn từ lá số | `lib/rag/planner.ts` — `vietLaiTruyVan`, `dungTruyVanTuKhoa` |
| Đa dạng nguồn, tối đa 2 đoạn mỗi tài liệu | `lib/rag/uu-tien-nguon.ts` — `chonDaDang` |
| Thứ bậc tin cậy nguồn 4 bậc | `lib/rag/uu-tien-nguon.ts` — `BAC_TIN_CAY` |
| Đếm nguồn độc lập -> mức chắc chắn | `lib/rag/uu-tien-nguon.ts` — `MucChacChan` |
| **Salience cấp phần (0-100) + ngân sách theo salience** | `lib/tuvi/do-noi-bat.ts`, `nganSachTu()` |
| Kiểm bịa sao / bịa cách cục / bịa mã | `lib/rag/kiem-duyet.ts` |
| Cổng ngôn ngữ đếm cụm cấm | `lib/rag/ngon-ngu.ts` |
| Lớp sửa cấp câu (kê sao, tiếng lóng, tên cung, markdown) | `lib/rag/sua-chua.ts` |
| Bảng chữ trừu tượng + phép đếm | `lib/rag/chu-truu-tuong.ts` |
| Phép đo câu cảnh | `lib/rag/cau-canh.ts` |
| Bốn thói quen viết | `lib/rag/van-phong.ts` |
| Bộ vàng planner (72 câu) | `lib/rag/bo-vang.ts` |
| Prefix caching: luật ở `system`, dữ kiện ở `user` | `lib/rag/ban-doc-sau.ts` |

**Hệ quả quan trọng:** Salience đã chạy production ở cấp phần. Planner mới KHÔNG
xây hệ điểm 0-100 cho claim — dùng ba mức HIGH/MEDIUM/LOW (§5.3).

---

## 5. Hợp đồng dữ liệu

### 5.1 Claim Card — `lib/rag/claim.ts`

```ts
/** Trạng thái bằng chứng của một claim. Quyết định Writer được nói tới đâu. */
export type TrangThaiClaim = 'SUPPORTED' | 'CONTESTED' | 'INSUFFICIENT';

/** Phạm vi phát biểu — chặn việc biến xu hướng thành lời hứa. */
export type PhamVi = 'tendency' | 'condition' | 'observation';

export interface ChuKyClaim {
  facet: FacetId;                    // enum đóng, §5.2
  domain: DomainId;                  // enum đóng, 12 phần đời
  mechanism: MechanismId | 'OTHER';  // enum mở, §5.2
}

export interface ClaimCard {
  id: string;                  // "C012"
  chuKy: ChuKyClaim;           // khoá chống lặp — KHÔNG dùng văn xuôi
  claim: string;               // 1-2 câu, viết ở register đích, KHÔNG thuật ngữ
  supports: string[];          // mã F###/E###
  contradicts: string[];       // mã E### nói ngược
  trangThai: TrangThaiClaim;
  giaiQuyet?: { phuongPhap: 'source_priority' | 'scope_narrowing'; lyDo: string };
  doChac: MucChacChan;         // tái dùng type đã có ở uu-tien-nguon.ts
  phamVi: PhamVi;
  camSuyRa: string[];          // từ forbidden_inference của chunk nguồn
}
```

**Luật cho trường `claim`:** viết ở register đích ngay từ đây. Phải qua
`demChuTruuTuong()`; trả về không rỗng thì sinh lại. Đây là cửa chặn nhiễm văn
phong — claim viết bằng chữ trừu tượng thì bài viết ra bằng chữ trừu tượng.

**Luật theo trạng thái:**

| Trạng thái | Writer được làm gì |
|---|---|
| `SUPPORTED` | luận đầy đủ theo role |
| `CONTESTED` | phải thể hiện dè dặt, nêu rằng có hai cách đọc |
| `INSUFFICIENT` | tối đa 1 câu, không được làm PRIMARY |

### 5.2 Taxonomy — `lib/rag/facet.ts`

```ts
/** 20-30 facet + OTHER. Taxonomy NỘI BỘ — Writer không bao giờ thấy. */
export type FacetId =
  | 'GANH_VIEC' | 'AN_TOAN_TAI_CHINH' | 'TIN_NGUOI' | 'CAN_KHOANG_RIENG'
  | 'THICH_THAY_DOI' | 'SO_LAM_NGUOI_KHAC_THAT_VONG' | /* ... */ | 'OTHER';
```

Ba luật:

1. **Writer không nhận `FacetId`.** Nó chỉ dùng cho Planner nhóm / phát hiện trùng /
   phân vai.
2. **Không có trường `vietLa`.** Đã cân nhắc và loại: một bản dịch cố định gắn với
   facet sẽ thành template mới ở mọi lá số — chỉ chuyển sự lặp từ prompt sang
   taxonomy.
3. **`OTHER` là hợp lệ.** Xuất hiện nhiều với cùng mô thức -> xem log -> thêm facet.
   Không ngồi nghĩ đủ 60 cái từ ngày đầu.

`mechanism` bắt đầu bằng một enum nhỏ + `OTHER`, cùng quy tắc phát triển.

### 5.3 Kế hoạch nội dung — `lib/rag/ke-hoach-noi-dung.ts`

```ts
export type VaiTro = 'PRIMARY' | 'SUPPORT' | 'REFERENCE';
export type MucQuanTrong = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PhanCong {
  tieuChi: string;   // nhãn tiêu chí, khớp TIEU_CHI_SAU
  claimId: string;
  vaiTro: VaiTro;
  quanTrong: MucQuanTrong;
}
```

**Đơn vị chống lặp là `ChuKyClaim`, KHÔNG phải `facet`.** Cùng `GANH_VIEC` nhưng
khác `domain` + `mechanism` là hai insight khác nhau, cả hai có quyền PRIMARY:

```
GANH_VIEC | CONG_VIEC   | GANH_NHIEU_HON_QUYEN_DUOC_QUYET
GANH_VIEC | BAN_DOI     | LAM_THAY_PHAN_NGUOI_KIA
```

**Ràng buộc phân bố — cưỡng chế bằng code sau khi plan xong, không nhờ model giữ:**

1. Mỗi `ChuKyClaim`: đúng **1 PRIMARY**, tối đa **3 SUPPORT**. Vượt thì cắt theo `doChac`.
2. Mỗi phần đời: tối thiểu **1 PRIMARY**. Không có thì plan lại với ràng buộc.
3. Toàn bài: REFERENCE tối đa **20%** số tiêu chí. Vượt thì **giảm số tiêu chí**,
   không độn trỏ chéo.
4. `INSUFFICIENT` không được làm PRIMARY.

Vi phạm -> **plan lại, chưa gọi Writer.** Rẻ hơn sửa văn rất nhiều.

**Độ dài đi theo `quanTrong`, KHÔNG theo `doChac`:**

```
quanTrong  -> độ dài     (đáng nói bao nhiêu)
doChac     -> cách nói   (được nói chắc tới đâu) — đã có qua MucChacChan
vaiTro     -> có nói không
```

Không nhân ba số lại. `doChac` thấp mà quan trọng thì viết **đủ dài và nói rào**,
không phải viết ngắn.

### 5.4 SUPPORT — định nghĩa mềm, không hard gate

SUPPORT phải mang **thông tin mới**, thể hiện một mặt khác của cùng cơ chế.

```
PRIMARY (công việc):  Bạn thường nhận thêm việc vì muốn mọi thứ được xử lý đến nơi.
SUPPORT (bạn đời):    Khi thói quen ấy đi vào đời sống riêng, bạn cũng dễ làm thay
                      phần của người bên cạnh.
```

**KHÔNG ép SUPPORT phải có câu cảnh.** `laCauCanh()` tự nhận là phép đo xấp xỉ;
biến nó thành hard gate sẽ đẻ ra template "chín giờ tối" ở mọi đoạn.

Nguyên tắc: **cụ thể khi cần, không cụ thể vì quota.**

---

## 6. Claim Synthesizer — `lib/rag/claim.ts`

**Input:** evidence pack (F### + E###) của một batch.
**Output:** `ClaimCard[]`.

### 6.1 Batching

Chia theo **ngân sách token và nhóm tiêu chí dùng chung bằng chứng**, KHÔNG
hard-code số lượt. Mặc định 1 batch mỗi chặng; tách đôi khi vượt ngưỡng.

```ts
const NGUONG_TOKEN_BATCH = 12_000;    // chỉnh theo đo
const NGUONG_NHOM_MAU_THUAN = 3;
```

Ngưỡng phải **tất định**, không để model tự quyết — nếu không chi phí mất kiểm soát.

Chi phí mục tiêu: **+4 đến +6 lượt mỗi lá số.** Tuyệt đối không 1 lượt mỗi tiêu chí
(= 77 lượt).

### 6.2 Mâu thuẫn nguồn nằm TRONG Claim Synthesizer

Không có `SOURCE RESOLVER` riêng. Ba trạng thái ở §5.1 là đủ.

Ghi chú lịch sử: `uu-tien-nguon.ts` từng loại bỏ việc phát hiện mâu thuẫn vì
*"cần một model thứ hai, chậm và không đáng tin ở P0"*. Claim Synthesizer **chính
là** model thứ hai đó. Lý do loại bỏ đã hết hiệu lực.

Giải không được thì **không cố hợp nhất**: đặt `CONTESTED`, và Writer nói rằng các
nguồn cho hai cách đọc khác nhau, với cấu hình này chưa đủ căn cứ nghiêng hẳn.

### 6.3 Hai cửa kiểm — A và B là hai thứ khác nhau

**A. STRUCTURAL CHECK (tất định, mọi claim).** Tái dùng `kiemDuyet()`:

- mã F###/E### có tồn tại trong gói không
- sao / cách cục có trên lá số không
- có phạm `camSuyRa` không
- `INSUFFICIENT` mà `doChac = 'manh'` là mâu thuẫn nội tại

**B. GROUNDING CHECK (semantic, có điều kiện).** Đây là thứ code KHÔNG kiểm được:

> E102 nói *"thu nhập có xu hướng gắn với trách nhiệm"*.
> Claim viết *"có khả năng trở thành người giàu nhờ quản lý"*, `supports: ["E102"]`.
> Structural check đậu hết. Nhưng E102 **không chứng minh** phần "trở thành người giàu".

**Có mã nguồn KHÁC VỚI được nguồn chứng minh.** Cần một model đọc hiểu.

Chạy có điều kiện để không tốn:

| Điều kiện | Chạy B? |
|---|---|
| `SUPPORTED` + `doChac = 'manh'` + không thuộc miền rủi ro | không |
| `doChac` = `vua` hoặc `yeu` | có |
| miền rủi ro (sức khoẻ, tiền bạc, pháp lý, thọ yểu, hôn nhân) | **luôn có** |
| `CONTESTED` | có |

---

## 7. Writer và cửa kiểm đầu ra

### 7.1 Writer thấy gì

```
ĐƯỢC THẤY:  Claim Card | vaiTro | quanTrong | 1-3 mẫu vàng
            | luật không cưỡng chế được
KHÔNG THẤY: văn sách (E### nguyên văn) | FacetId | claim của tiêu chí khác
```

### 7.2 Prompt

Cắt `CHUAN_NGON_NGU_CELES` theo bảng ba nhóm, **đo từng nhát cắt** bằng regression set:

| Nhóm | Xử lý |
|---|---|
| Đã có validator hoặc lớp sửa cưỡng chế ở code (tên cung, tiếng lóng, kê sao, phán quyết) | **bỏ khỏi prompt** |
| Mẫu vàng dạy được (nhịp câu, cách mở đoạn, câu cảnh, cặp phân biệt) | **chuyển sang mẫu** |
| Không cưỡng chế được, mẫu không dạy được (thứ bậc 4 nguồn sự thật, ranh giới nghiêng-về vs hứa-sự-việc, ràng buộc an toàn `tat-ach`) | **giữ** |

**KHÔNG đặt mục tiêu độ dài.** Tiêu chí duy nhất: mỗi dòng còn lại phải chứng minh
được rằng **bỏ nó gây regression**.

**Vị trí mẫu vàng:** đặt trong `user`, SAU khối luật tĩnh ở `system`. Mẫu vàng là
nội dung động; đặt trong `system` trước khối luật sẽ giết prefix cache cho mọi lượt
gọi. Đặt ở `user` vừa giữ cache vừa để mẫu gần điểm sinh chữ nhất.

### 7.3 Output Grounding Check — và luật miễn trừ BẮT BUỘC

Claim đúng chưa đủ. Writer vẫn tự thêm được:

```
Claim:  Bạn thường cần mức tài chính đủ rõ để thấy an tâm.
Writer: Vì thế bạn thường không yên nếu chưa sở hữu nhà hoặc có một khoản tiền rất lớn.
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ không có trong claim
```

Kiểm ở **cấp tiêu chí**, không cấp câu:

```ts
{ tieuChi: 'nguon_an_yen', claimChoPhep: ['C12', 'C16'], van: '...' }
```

Batch **1 lượt mỗi chặng** cho toàn bộ tiêu chí của chặng đó. Không 1 lượt mỗi tiêu chí.

#### LUẬT MIỄN TRỪ — không có luật này thì Phase B phá sản phẩm

Câu cảnh **theo định nghĩa không nằm trong Claim Card**. Không nguồn tử vi nào nói
về "chín giờ tối". Grounding check ngây thơ sẽ cờ **mọi câu cảnh** là bịa, rồi lớp
sửa xoá sạch đúng thứ `cau-canh.ts` sinh ra để ép có.

**Luật:** grounding chỉ áp lên câu mang **nhận định**; câu **minh hoạ** được miễn
nếu không chứa khẳng định chuyên môn nào.

Máy phân biệt đã có sẵn:

```ts
laKhangDinhChuyenMon(cau)   // kiem-duyet.ts — câu có nhắc sao / Tứ Hóa
laCauCanh(cau)              // cau-canh.ts   — câu có người / việc / lúc

// miễn kiểm khi:  laCauCanh(cau) && !laKhangDinhChuyenMon(cau)
```

Câu cảnh mà nhắc tên sao thì **không được miễn** — lúc đó nó đang phát biểu chuyên môn.

---

## 8. Bốn tầng eval — độc lập

| # | Tầng | Câu hỏi | Chỉ số | Bộ dữ liệu |
|---|---|---|---|---|
| 1 | Retrieval | Có lấy đúng bằng chứng không? | recall@k, NDCG | mở rộng `BO_VANG_PLANNER` với nhãn cấp chunk |
| 2 | Claim | Từ bằng chứng đó luận đúng không? | tỉ lệ grounded, tỉ lệ vượt `phamVi` | ~50 claim card nhãn tay |
| 3 | Writing | Viết đúng chất Celes chưa? | 5 rubric 1-5 | 30-50 cặp (bản máy, bản sửa tay) |
| 4 | **End-to-end** | **Bài nào đáng đọc hơn?** | **blind A/B preference** | 10-15 cặp bài hoàn chỉnh |

**Tầng 4 là tầng nghiệm thu thật.** Có thể xảy ra: retrieval tăng, claim tăng,
rubric tăng, mà cả bài lại lạnh hơn, khó đọc hơn, ít chất Celes hơn. Chỉ tầng 4
bắt được điều đó.

### 8.1 Năm rubric của tầng 3

Mỗi rubric **một tiêu chí**, thang 1-5, có anchor. Judge **viết lý do trước, chấm sau**.

| Rubric | Anchor 1 | Anchor 5 |
|---|---|---|
| `trong-tam` | nói sang chuyện khác, hoặc chung chung ai cũng đúng | mọi câu phục vụ đúng một nhận định |
| `cu-the` | toàn danh từ trừu tượng | đối chiếu được với đời mình |
| `mach-lac` | các câu rời, đảo thứ tự không đổi nghĩa | mỗi câu nối từ câu trước, đảo là gãy |
| `gon` | lặp ý, câu đệm, mở bài dài | bỏ câu nào cũng mất thông tin |
| `rieng-biet` | dùng gần như nguyên xi cho đa số người | chỉ đúng với cấu hình lá số này |

`rieng-biet` thay tạm cho baseRate ở v1 (xem §10).

### 8.2 1-call hay 4-call: quyết bằng đo, không bằng lý thuyết

Chạy **cả hai cấu hình trên cùng 30 đoạn đã có nhãn tay**, so mức đồng thuận với
nhãn người. Cấu hình nào khớp cao hơn thì thắng.

**Gài sẵn 4 case đối kháng** vào bộ 30:

- 2 đoạn viết rất hay, bịa dữ kiện
- 2 đoạn viết vụng, căn cứ hoàn hảo

Nếu judge 1-call chấm bốn case này theo cùng một chiều thì halo có thật với task
này — phát hiện được với n = 4, không cần 30.

---

## 9. Lộ trình

### Phase A — người dùng thấy ngay (~2 tuần, phần lớn là công của chủ dự án)

| | Việc | Nghiệm thu |
|---|---|---|
| A1 | `nganSachTu()` -> **trần** thay vì đích; thêm `thieuCanCu` cấp tiêu chí; gỡ câu "Đủ ba phần, đủ tiêu chí" | bài ra ngắn hơn ở phần `doNoiBat` thấp; `soBaoPhu` không gãy |
| A2 | Kho vàng 12 đoạn + nhãn cặp | đủ 6 loại bài x 2 |
| A3 | Nạp mẫu vàng vào prompt (trong `user`, sau khối luật ở `system`) | prefix cache còn nguyên — đo `đệm/vào` |
| A4 | A/B số mẫu: 0 / 1 / 2 / 3 | chọn theo rubric, không theo lý thuyết |
| A5 | Cắt prompt theo bảng ba nhóm | mỗi nhát cắt đo lại; regression thì hoàn tác |

**Chốt Phase A bằng mắt chủ dự án trên 5 lá số.** Nếu văn đã khá lên rõ thì phần
còn lại của lộ trình được xếp theo giá trị thật, không theo độ đẹp của sơ đồ.

### Phase B — lõi chuyên môn (~3 tuần)

| | Việc |
|---|---|
| B1 | `lib/rag/facet.ts` — 20-30 facet + OTHER; `ChuKyClaim` canonical |
| B2 | `lib/rag/claim.ts` — Claim Synthesizer, batch theo token |
| B3 | Structural check (dời phần lớn `kiemDuyet` lên claim, **giữ lại bản sau Writer**) |
| B4 | Grounding check có điều kiện |
| B5 | `lib/rag/ke-hoach-noi-dung.ts` — Planner + role + ràng buộc phân bố tất định |
| B6 | Writer chỉ nhận Claim Card |
| B7 | Output grounding check + **luật miễn trừ câu cảnh (§7.3)** |

### Phase C — RAG bằng số liệu (~1-2 tuần)

| | Việc | Nghiệm thu |
|---|---|---|
| C1 | Retrieval gold set (nhãn cấp chunk) | — |
| C2 | Reranker sau RRF: top 30-50 -> top 8-15 | giữ nếu NDCG tăng đáng kể |
| C3 | Contextual chunks | **chỉ giữ nếu đo tăng** — chunk hiện đã cắt theo đề mục, gain có thể nhỏ |
| C4 | `forbidden_inference` theo ưu tiên = tần suất x tỉ lệ lỗi x rủi ro x mơ hồ | — |

Làm C2 **trước** C3: ít thay đổi dữ liệu nhất.

### Phase D — scale

D1 automated judge · D2 conditional editor · D3 backlog nếu dữ liệu chứng minh ROI

---

## 10. Backlog — bị loại khỏi v1, kèm lý do

| Hạng mục | Lý do loại |
|---|---|
| **baseRate trên 300 lá số** | Phụ thuộc: chỉ tính được **sau** khi Claim Synthesizer chạy hàng trăm lá số. Khi làm phải dùng **một chiều**: base rate CAO là tín hiệu HẠ BẬC (Barnum); base rate THẤP **không** tự động đáng nói. Thay tạm bằng rubric `rieng-biet` (§8.1) |
| GEPA | Cần evaluation signal đáng tin trước. Tối ưu rất nhanh theo một cái thước sai thì tệ hơn không tối ưu |
| GraphRAG | Corpus chưa đủ dày — `chonDaDang` còn phải nới hạn mức đa dạng vì thiếu tài liệu |
| Expert system rule atom đầy đủ | Dự án nội dung hàng tháng, không phải sprint kỹ thuật. Vào dần qua C4 |
| Salience 0-100 cấp claim | Ba mức HIGH/MEDIUM/LOW là đủ. Tránh một hệ điểm mà sau này không ai giải thích được 73 khác 68 ở chỗ nào |
| Trace cấp câu | Cấp tiêu chí đủ để localize lỗi; marker trong văn làm hỏng văn |
| Contextual chunks | Chỉ nếu C3 đo ra tăng |
| Judge 4-call | Chỉ nếu §8.2 đo ra 1-call thua |

---

## 11. Phạm vi theo bề mặt

Celes có **6 bề mặt sinh chữ**. Xây cho một bề mặt là lặp lại đúng sai lầm mà
`van-phong.ts` sinh ra để chống: *"sản phẩm nói bằng hai giọng"*.

| Lớp | ban-doc-sau | bai-dai | bang-linh-vuc | be-mat-ngan | moc-hanh-trinh | tra-loi (chat) |
|---|---|---|---|---|---|---|
| Facet + claim signature | có | có | có | có | có | có |
| Claim Synthesizer | có | có | có | có | có | có |
| Kho vàng | có | có | có | có | có | có |
| Rubric + regression | có | có | có | có | có | có |
| **Content Planner + role** | có | có | có | không | không | không |
| Bỏ ép word count | có | có | có | không | không | không |
| Output grounding check | có | có | có | có | có | có |

---

## 12. Rủi ro đã biết

| Rủi ro | Cách xử |
|---|---|
| Claim Synthesizer thành điểm hallucination nguy hiểm nhất | Hai cửa §6.3; miền rủi ro luôn qua cửa B |
| Claim viết bằng chữ trừu tượng -> Writer viết trừu tượng | `claim` phải qua `demChuTruuTuong()`, không đậu thì sinh lại |
| Claim signature trôi thành văn xuôi viết liền | Enum đóng cho `facet` và `domain`; `mechanism` enum + OTHER có review |
| Planner gán PRIMARY cho tất cả | Ràng buộc phân bố cưỡng chế bằng code, plan lại nếu vi phạm |
| Grounding check xoá sạch câu cảnh | **Luật miễn trừ §7.3** — bắt buộc |
| Mẫu vàng động phá prefix cache | Đặt trong `user`, sau khối luật tĩnh ở `system` |
| **Model chép nguyên văn mẫu trong prompt** — đo ngày 2026-09-23 trên 8 lá số: câu ví dụ của `cau-canh.ts` ("chín giờ tối") xuất hiện 25 lần; ví dụ của `van-phong.ts` bị chép làm câu hỏi soi, câu mở đoạn, câu giữ lại | (1) Mỗi lượt chỉ chèn 1–3 mẫu, **xoay vòng** trong kho, không cố định; (2) thêm phép đo trùng cụm 6–8 từ giữa bài sinh ra và kho mẫu, vượt ngưỡng thì cờ; (3) rút bớt câu ví dụ cố định trong `cau-canh.ts` / `van-phong.ts` khi đã có kho mẫu thay thế |
| Chi phí tăng 2-3 lần | Claim batch theo token; grounding có điều kiện; judge offline; editor chỉ khi FAIL |
| 12 phần thành 5 phần thật + 7 phần trỏ chéo | Trần REFERENCE 20%; vượt thì **giảm số tiêu chí**, không độn |
| Kiến trúc đúng mà không bao giờ xong | Chốt Phase A bằng mắt trước khi vào Phase B |

---

## 13. Ghi chú vận hành

- Mọi thay đổi tính năng hoặc logic ở đây phải cập nhật `PRODUCT-BACKLOG.xlsx`
  **trong cùng commit**.
- Không đổi retrieval / prompt / model nếu chưa có bài kiểm hồi quy (spec mục 14).
- Tăng `PHIEN_BAN_*` tương ứng khi đổi luật đo được.
