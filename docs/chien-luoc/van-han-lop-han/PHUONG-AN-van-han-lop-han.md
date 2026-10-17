# PHƯƠNG ÁN — Vận hạn kết luận bằng lớp hạn (phiên [CODE], 16/10/2026)

- Nhánh: `viec/van-han-lop-han` (worktree `D:\SAPP BA\tuvi-ai-van-han`), dựng trên `viec/sua-do-sang-cach-cuc` (đã push, chờ gộp).
- Căn cứ: `D:\Celestia\QUYET-DINH-van-han-dung-sao-luu.md` (các lượt 1–3 đã chốt).
- Mọi dòng "hiện trạng" dưới đây đã kiểm trong lượt viết tệp này (tệp:dòng ở worktree trên).

## Hiện trạng (đã kiểm)

| Chuyện | Mã đang chạy |
|---|---|
| Bảng tứ hoá theo can | `TU_HOA[can]` — `lib/tuvi/constants.ts:266`. Engine chỉ dùng cho tứ hoá GỐC (`ansao.ts:365`). |
| Lưu tứ hoá | Chỉ có MỘT chỗ tính, nằm trong bài luận v3: `moTaNam()` `lib/rag/v3/du-kien.ts:673-694`, trả CHUỖI văn. `truy-hoi-v3.ts:310-313` bóc lại chuỗi đó bằng regex. Chat không có. |
| Tứ hoá đại vận | Không có ở đâu (grep rỗng). Can cung đã có sẵn: `Cung.can` (`ansao.ts:64`), tính ở `ansao.ts:219`. |
| Sao lưu | `luuTinhTheoNam(namXem)` `ansao.ts:470-487`, 9 sao, không gắn vào LaSo. Gọi ở luan-han, nghieng-ve, boi-canh-la-so, v3/du-kien, TuViChart, app `menh-ban.tsx:772`. |
| Phép cân chat | `tinhNghiengVe` `lib/rag/nghieng-ve.ts`: cộng mọi `dauMoc` không phân lớp (414-415). Lớp `nen` (sao gốc) luôn vào tổng (358) → áp đảo; đây là gốc của "năm nào cũng thuận". |
| Cấm lưu Hóa ở chat | `focused/kiem.ts:315-317` (mã `LUU_HOA`), `focused/quet-ten.ts:28-29,161-167,223,255`, `focused/hop-dong.ts:45,72`; test `scripts/test-focused.ts:628,684`. |
| Dữ kiện chat | `boi-canh-la-so.ts:278-295`: chỉ thêm lưu tinh khi focused; dòng 283 là chú thích "không có lưu Tứ Hóa". |
| Câu thời điểm v3 | TQ08, TQ09 (`v3/khung.ts:89-90`), khối lớp vận `v3/du-kien.ts:634-710`. Khoá đệm v3 `THE_HE_DEM=9` (`v3/xu-ly.ts:51`). |

**Nhánh `viec/van-han-lop-goc` (CEL-085, 12/10, chưa push, chờ nghiệm thu):** bỏ hai cách theo vòng Thái Tuế GỐC
(Tang Tuế Điếu, Thiên Mã gặp Tuế Phá) khỏi câu năm xem, gắn trường `lop` cho mọi dữ kiện chat (`LOP_THEO_LOAI`),
thêm `test-lop-du-kien.ts`. Cùng hướng với đợt này, và commit 3 cần trường `lop` của nó. Gộp với nhánh độ sáng
có xung đột thật ở `cach-cuc.ts` (phiên bản cách cục, danh sách tên) và `boi-canh-dong-bang.json` (sinh lại), xlsx (làm lại bằng openpyxl).

## Bốn commit (một nhánh, mỗi commit xanh độc lập)

### Commit 0 (đề xuất) — gộp `viec/van-han-lop-goc` vào nhánh này
- `PHIEN_BAN_CACH_CUC` → `2026.10.3`; thêm "Tang Tuế Điếu", "Thiên Mã gặp Tuế Phá" vào `TEN_CHI_DE_CHAN`.
- Sinh lại `boi-canh-dong-bang.json` từ mã, không gộp tay. Backlog chạy lại hai tệp yêu cầu.
- Cần bạn chốt (câu Q-gop): gộp vào đây, hay nghiệm thu/gộp nó vào main riêng trước.

### Commit 1 — engine: bảng sự thật lớp hạn (`lib/tuvi/tu-hoa-han.ts`, tệp mới)
Hàm thuần, không gọi model, web và app dùng chung qua `@tuvi/*`:

```ts
type Hoa = 'Hóa Lộc' | 'Hóa Quyền' | 'Hóa Khoa' | 'Hóa Kỵ';
interface HoaHan { hoa: Hoa; sao: string; chiIndex: number; tenCung: string; nguon: 'nam' | 'dai-van' }

tuHoaTheoCan(canIndex): { hoa: Hoa; sao: string }[]           // tra TU_HOA, 4 phần tử
luuTuHoaTheoNam(laSo, namXem): HoaHan[]                        // can năm = mod10(nam+6)
tuHoaDaiVan(laSo, tuoiAm): HoaHan[]                            // can = cungDaiVan(...).can; ngoài đại vận → []
lopHan(laSo, namXem, thangAm?): {                              // "bảng sự thật" ③ trong tệp giải đáp
  tieuHan, daiVan, nguyetHan?,                                 // chỉ số cung
  luuTinh,                                                     // = luuTinhTheoNam
  luuTuHoa, tuHoaDaiVan,
  trung: { loai: 'tieu-han-trung-dai-van' | 'hoa-chong' ; ... }[]   // vd: năm Bính lưu Quyền Cơ + đại vận Mậu Kỵ Cơ
}
```
- Chỉ tìm vị trí, không gắn nghĩa, không chấm thuận/cản (việc của commit 2–3).
- v3 `moTaNam` đổi sang gọi `luuTuHoaTheoNam`, GIỮ NGUYÊN chuỗi in ra (regex `truy-hoi-v3.ts:312` đang bóc nó).
  Ảnh chụp v3 phải không đổi một ký tự.
- Không đổi kết quả an sao → không tăng `phienBan`, `mau-ansao.json` đứng yên.
- Test mới `scripts/test-tu-hoa-han.ts` (đưa vào CI):
  - đáp án viết tay độc lập cho lá mẫu 24/08/2000 giờ Tuất nam: năm 2026 Bính (Lộc Đồng, Quyền Cơ, Khoa Xương, Kỵ Liêm),
    đại vận can Mậu (Lộc Tham, Quyền Âm, Khoa Hữu Bật, Kỵ Cơ), và báo trùng "Cơ được lưu Quyền và đại vận Kỵ";
  - đáp án can → bộ bốn chép từ `TU_HOA_SACH` của `test-ansao-chuan.ts` (bảng viết độc lập), không gọi `TU_HOA`;
  - quét 3.456 lá × 7 năm: mỗi sao hoá tìm thấy đúng một cung; ngoài khoảng đại vận → rỗng;
  - thử đột biến: đổi can đại vận sang can năm sinh thì test phải đỏ.

### Commit 2 — bảng luật tổ hợp hạt giống (dữ liệu, CẦN BẠN DUYỆT NỘI DUNG)
- Tệp `lib/tuvi/luat-to-hop.ts`: mỗi dòng = {mã, các sao/tứ hoá cần cùng có, phạm vi (đồng cung / tam phương / cung hỏi), lớp áp dụng,
  chiều (thuận / cản trở / hai mặt), câu nghĩa đời thường, nguồn sách:dòng}.
- Hạt giống chỉ gồm tổ hợp có ≥2 sách ghi giống nhau (theo luật Q-chuan), ưu tiên tổ hợp có sao lưu/tứ hoá theo hạn
  (vd Kỵ + Kình/Đà, Lộc + Lộc Tồn = song Lộc, Hổ + Kình...). Tôi soạn bảng, bạn duyệt từng dòng; commit chỉ khi duyệt.
- Test: mỗi dòng có nguồn; quét lá số đo tần suất, dòng 0 lần = viết sai.

### Commit 3 — chat sau cờ `CELES_LOP_HAN=1` (tắt = đường cũ nguyên vẹn)
- **Công tắc câu vận hạn:** `lopHan` có lớp khác `ban-menh` (đã chốt, không thêm trường).
- **Phép cân `nghieng-ve.ts`** khi câu vận hạn + cờ bật:
  - chiều chỉ lấy từ lớp hạn: cung đại vận, tứ hoá đại vận, cung tiểu hạn, sao lưu, lưu tứ hoá, nguyệt hạn;
  - sao gốc ở cung hỏi (`nen`) ra khỏi tổng, chỉ thành mục "Nền" để dẫn chứng;
  - thứ bậc (Q-sao): cách cục theo hạn > luật tổ hợp (commit 2) > tứ hoá theo hạn (Kỵ = cản trở, Lộc/Quyền/Khoa = thuận) > sao lưu đơn lẻ (trọng thấp);
  - trả: nhãn chiều, hai danh sách (thuận lợi / cản trở, chỉ từ lớp hạn), cờ "nhấn mạnh" khi tiểu hạn trùng đại vận, mục nền.
  - `PHIEN_BAN_NGHIENG` → `2026.10.1`.
- **Dữ kiện chat** (`boi-canh-la-so.ts`): thêm dữ kiện lưu tứ hoá + tứ hoá đại vận (lop `luu-nien` / `dai-han`) từ `lopHan()`.
- **Bỏ cấm lưu Hóa** ở ba tệp focused; thay bằng kiểm "nhắc lưu Hóa phải đúng sao, đúng cung như bảng sự thật". Test-focused đổi theo, kèm thử đột biến.
- **Luôn nói hai mặt:** validator quét tên mục đầu của CẢ hai danh sách; bên mỏng thì prompt bảo nói đúng mức là mỏng.
- **Chữ nội bộ:** danh sách cấm cụ thể ("lực cản", "đỡ", "tín hiệu", "chồng lớp", "không có tài liệu", "không có nguồn"…) — bắt được thì thay bằng code theo bảng đối chiếu.
- **Q-nguon:** sửa 4 prompt: bỏ "nói thẳng là chưa đủ căn cứ" kiểu nói về hệ thống, giữ nói mức chắc chắn.
- **Q2:** sửa quyết định số 1 trong AGENTS.md đúng câu đã chốt.
- **Đo trước khi bật cờ (offline, không tốn tiền):** 60 lá × 2024–2030 × 4 chủ đề: phân bố nhãn chiều trước/sau (mục tiêu: hết cảnh mọi năm "thuận rõ"), tỉ lệ ca có đủ hai danh sách. Ca gốc 24/08/2000 giờ Tuất sự nghiệp 2026 phải ra "nghiêng cản trở" (lưu Kỵ Liêm ở Mệnh, tam hợp Quan Lộc).

### Commit 4 — bài luận v3 + kho + đệm
- `v3/du-kien.ts`: câu `thoiDiem` (TQ08, TQ09, các câu `co`) xếp khối lớp hạn lên trước, sao gốc thành dẫn chứng; khối đại vận thêm dòng tứ hoá đại vận (định dạng "Hóa X vào Sao (Cung)" để truy hồi bóc được; mở rộng regex sang vai trò đại vận).
- Kho: sửa nhãn sao (Hóa kỉ/kị, Linh Tinh, chữ viết tắt) — chạm DB thật, chạy tay; truy vấn từ khoá theo tín hiệu nặng + cổng "tên nằm gần nhau trong đoạn". Đo độ trễ.
- Đệm: nếu nhánh độ sáng CHƯA lên production khi đợt này lên thì dùng chung `THE_HE_DEM=9`, không tăng hai lần; đã lên rồi thì 9→10 (đếm chỉ-đọc trước).

## Ngoài đợt này (đề xuất tách nhánh riêng)
- **Q5** nâng `gomDieuTuKe` (ghi ngày, tin khủng hoảng, dòng "Celes đang nhớ" có nút bỏ): chạm giao diện + lưu trữ, vùng khác; tách nhánh `viec/celes-dang-nho`.
- **Khung cách cục + đợt 1 (~35 cách) + chuyển giáp cung về engine:** sau commit 1 (dùng chung bảng sự thật), nhánh riêng.

## Câu cần bạn chốt
- **Q-gop:** gộp `viec/van-han-lop-goc` vào nhánh này (commit 0) hay gộp main riêng trước?
- **Q-co:** tên cờ `CELES_LOP_HAN`, mặc định tắt trên production cho tới khi đo xong.
- **Q-luat:** duyệt bảng luật tổ hợp hạt giống ở commit 2 (tôi soạn, bạn duyệt từng dòng).

---

## SAU PHẢN BIỆN (16/10/2026) — đã tự kiểm lại các dẫn chứng

### Nguồn sách (tra `D:/Tài liệu tử vi/markdown`, 14 cuốn)
- **Tứ hoá đại vận theo can cung đại vận: KHÔNG cuốn nào ghi.** Grep "can đại hạn / tứ hóa đại hạn / hóa của đại hạn" = 0.
  Bản rà nguồn 05/10 (`Nguon-van-han-ra-soat-2026-10-05.md:66-67`) xếp nó vào phi tinh / tứ hoá phái (Lương Nhược Du, Từ Tăng Sinh): **CHẶN, không vào DB**.
  Trái luật Q-chuan (HS, hoặc ≥2 sách).
- **Lưu tứ hoá theo can năm:** HS (dòng 333-334) và KL (540-546) chỉ an 9 sao lưu, không có lưu tứ hoá. Chỉ bộ *Tử Vi ứng dụng*
  (Chính Tinh 2254, 2715, 4815; Phụ Tinh 154, 3145, cùng tác giả) dùng "lưu Kỵ". *Tử vi tổng hợp* 1097-1104: sao lưu "kết với sao cố định để ghép nghĩa".
- **Bảng tứ hoá có dị bản, HS không có bảng:**
  - Canh: "Nhật Vũ **Đồng Âm**" (Khoa Đồng, Kỵ Âm) ở KH 927, KL 467/2567, NL 1829/2005, AB 1067/1073 (4 sách);
    "Nhật Vũ **Âm Đồng**" (engine đang dùng, `constants.ts:273`) ở Chính Tinh ứng dụng 4232, TĐ 124 (2 sách).
  - Nhâm Khoa: Tả Phù/"Phụ" (KH 927, KL 467, NL 1833) và Thiên Phủ (NL 1979, AB 1073, TĐ 124): ba sách mỗi bên.
  - Mậu Khoa Hữu Bật: KL, NL, AB, KH cùng ghi, ổn.
  - Lá mẫu sinh năm Canh, nên Khoa và Kỵ GỐC của lá này cũng nằm trong ô dị bản.

### Phản biện đúng, phương án sửa theo
| Mục | Sửa |
|---|---|
| S1 test chép `TU_HOA_SACH` | Bảng đó để `null` ở Mậu Khoa, Canh Khoa/Kỵ, Nhâm Khoa (`test-ansao-chuan.ts:65-76`). Đáp án độc lập lấy từ các dòng sách kể trên; ô dị bản chờ chủ dự án chốt. |
| S2 sao gốc quay lại qua cung đại vận/tiểu hạn (`nghieng-ve.ts:362-364, 381-384` gọi `dauMocCuaCung`) | Sao gốc ở cung hạn KHÔNG cộng cát/hung lẻ. Nó chỉ vào chiều qua luật tổ hợp với sao lưu / lưu hoá (sách tổng hợp 1103-1104). Bỏ điều kiện "tiểu hạn trùng cung hỏi thì bỏ qua" (dòng 382). |
| S3 thiếu `scripts/oracle-ten-prompt.ts:25,62` (GROUND-04/06) và `CEL-186-ve-B-phuong-an.md:219,299` | Đưa vào danh sách sửa. Kiểm "đúng sao đúng cung" là validator MỚI: kiểm theo cặp (hoá, sao), cặp đó phải có trong gốc ∪ lưu (∪ đại vận nếu giữ). Có thiết kế riêng trong commit 3. |
| L2 thiếu ca trùng | Test thêm `tieu-han-trung-dai-van`: năm 2026 tiểu hạn = Tý = cung đại vận. |
| L3 ca gốc là tự đặt đáp án | Bỏ "ca gốc phải ra cản trở" khỏi tiêu chí. Thay bằng đo phân bố hai phía: không quá X% năm "thuận rõ", không quá X% năm "cản trở rõ" (9 sao lưu có 6 hung). Đưa X cho chủ dự án duyệt sau khi đo. Sao lưu tính ĐÚNG cung hỏi và tam phương: chờ chốt cùng bảng tổ hợp. |
| L4 công tắc rộng | Ghi rõ hệ quả: câu "có hợp kinh doanh không" (`planner.ts:609-611, 629`) cũng thành câu vận hạn. Chủ dự án đã chốt công tắc này, chỉ ghi nhận. |
| L5 commit 3 bật cờ khi v3 chưa đổi thì chat cãi bài v3 | Commit 3 và 4 dùng chung cờ. Cờ chỉ bật sau commit 4. Commit 2 tách: 2a kiểu dữ liệu + bảng rỗng (không cần duyệt), 2b dữ liệu (cần duyệt). Commit 3 không phải chờ 2b. |
| L6 tầng "cách cục theo hạn" đang trống | Thứ bậc lúc đầu chỉ có luật tổ hợp, lưu hoá, sao lưu. Tuần/Triệt (sao gốc) không lên tầng cao. |
| L7 `chonBoiCanh` phục vụ bảng lĩnh vực, bản đọc sâu, bài dài | Cờ truyền vào `chonBoiCanh`; cờ tắt thì các bề mặt khác giữ nguyên. Bật cờ trên production đụng `PHIEN_BAN_CHU`: hỏi lại chủ dự án lúc đó. |
| L8 | `PHIEN_BAN_NGHIENG` và `PHIEN_BAN_CACH_CUC` KHÔNG nằm trong khoá đệm nào (chỉ ghi vết, `tra-loi.ts:648-654`). Rút câu "đệm" khỏi chúng. `THE_HE_DEM` tăng thì bài th:9 vẫn làm dự phòng (`xu-ly.ts:293-299`). |
| L9 hai hệ tên lớp | Dữ kiện mới đặt tên theo hệ `LopDuKien` (`luu-nien` = sao lưu / lưu hoá); ghi chú ngay chỗ khai báo. |
| Sai chỗ khác: Hành trình | `lib/tuvi/luan-han.ts:162-165, 241-246` vẫn cộng sao gốc rồi ra nhãn nhịp (`nhipTu` 195-200). Nhãn này hiện ở web (`TrangChiTietNoiDung`, `/api/luan-han`, `/api/nhip`) và app (`chi-tiet-han.tsx`). Bật cờ thì chat và Hành trình nói ngược nhau. Phạm vi: chờ chốt. |

Đứng được: commit 1 là hàm thuần, tệp mới, không đổi an sao; đổi `moTaNam` sang hàm chung mà giữ nguyên chuỗi là làm được; thử đột biến "can đại vận → can năm sinh"; tiền lệ "cờ tắt = đường cũ" (`test-focused.ts:142-145`).

### Câu chờ chủ dự án — ĐÃ CHỐT lượt 4 (xem QUYET-DINH): ĐV vẫn làm; lưu hoá ngang sao lưu; dị bản giữ engine; thêm commit 5 Hành trình; gộp lop-goc vào nhánh này (mặc định).
1. Tứ hoá đại vận (không có nguồn sách Việt).
2. Lưu tứ hoá năm (chỉ một tác giả) đứng tầng nào.
3. Ô dị bản Canh, Nhâm.
4. Phạm vi Hành trình, bảng lĩnh vực.
5. Gộp `viec/van-han-lop-goc`: mặc định gộp vào nhánh này (commit 3 cần trường `lop`).
