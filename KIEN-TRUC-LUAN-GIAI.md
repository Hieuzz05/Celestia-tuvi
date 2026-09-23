# Kiến trúc luận giải Celes — bản chốt v1

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
| Chi phí tăng 2-3 lần | Claim batch theo token; grounding có điều kiện; judge offline; editor chỉ khi FAIL |
| 12 phần thành 5 phần thật + 7 phần trỏ chéo | Trần REFERENCE 20%; vượt thì **giảm số tiêu chí**, không độn |
| Kiến trúc đúng mà không bao giờ xong | Chốt Phase A bằng mắt trước khi vào Phase B |

---

## 13. Ghi chú vận hành

- Mọi thay đổi tính năng hoặc logic ở đây phải cập nhật `PRODUCT-BACKLOG.xlsx`
  **trong cùng commit**.
- Không đổi retrieval / prompt / model nếu chưa có bài kiểm hồi quy (spec mục 14).
- Tăng `PHIEN_BAN_*` tương ứng khi đổi luật đo được.
