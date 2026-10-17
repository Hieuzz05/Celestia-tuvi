# QUYẾT ĐỊNH — Câu hỏi vận hạn kết luận bằng lớp hạn, không bằng sao gốc

- **Ngày chốt:** 16/10/2026
- **Người chốt:** chủ dự án
- **Trạng thái:** đã chốt, CHƯA sửa mã. Chủ dự án muốn chốt hết giải pháp rồi sửa một lượt.

## Nội dung

Với câu hỏi về **vận hạn** (năm nay, tháng này, 10 năm này, khi nào…), **kết luận phải dựa trên lớp hạn**:

- sao lưu (lưu tinh của năm);
- tứ hoá theo hạn: lưu tứ hoá theo can năm, tứ hoá theo đại vận (cách gắn nhãn chờ Q2);
- cung tiểu hạn, cung đại vận, nguyệt hạn.

**Bộ sao gốc chỉ là thông tin dẫn chứng, tham khảo thêm khi cần.** Nó không được quyết chiều kết luận
của câu hỏi vận hạn.

## Vì sao

Ngày 16/10/2026, chạy `tinhNghiengVe` trên lá số Dương Nam 24/08/2000 giờ Tuất, chủ đề sự nghiệp, thì
các năm 2025, 2026, 2027, 2028 và 2030 đều ra "thuận rõ". Con số khoảng 21.8 điểm thuận gần như toàn bộ
đến từ sao gốc ở Quan Lộc, mà sao gốc năm nào cũng giống nhau. Lớp năm chỉ cộng hoặc trừ khoảng 3 điểm,
lớp đại vận góp 0. Lưu Hóa Kỵ 2026 tại Mệnh, tam hợp với Quan Lộc, thì không được tính. Validator
Focused còn cấm model nói ngược chiều "thuận". Kết quả là năm nào Celes cũng trả lời "thuận".

## Chỗ phải sửa khi mở phiên [CODE]

- `lib/rag/nghieng-ve.ts`: phép cân cho câu hỏi hạn. Lớp hạn quyết chiều; lớp nền chỉ được ghi chú,
  không cộng vào chiều.
- `lib/rag/focused/kiem.ts:316` và `lib/rag/boi-canh-la-so.ts:283`: bỏ lệnh cấm lưu tứ hoá ở chat,
  đưa lưu tứ hoá vào dữ kiện.
- `lib/rag/v3/du-kien.ts`: câu thời điểm (TQ08, TQ09, các câu `thoiDiem: co`) xếp lớp hạn lên trước,
  sao gốc thành mục dẫn chứng.
- Tứ hoá đại vận: chờ Q2 (nguồn và nhãn).
- Sau khi sửa: tăng `THE_HE_DEM` gộp với các thay đổi khác trong cùng một đợt (`lib/rag/v3/xu-ly.ts:36-46`).

---

## Bổ sung ngày 16/10/2026 (lượt 2): chủ dự án chốt thêm

1. **Planner:** dùng `lopHan` sẵn có làm công tắc "câu vận hạn", không thêm trường phân loại mới.
2. **Gộp luật chọn cung:** chat và bài luận v3 dùng **một bảng chung** (cung chính, cung phụ, vai trò từng
   cung, lớp hạn nào quyết chiều). Hiện chat thiếu Tật Ách so với v3 ở câu "tôi là người thế nào".
3. **Bỏ lệnh cấm lưu Hóa ở chat** (ba tệp: `focused/kiem.ts`, `focused/quet-ten.ts`, `focused/hop-dong.ts`).
   Thay bằng: được nhắc lưu Hóa nhưng phải đúng sao, đúng cung như dữ kiện.
4. **Luôn nói cả hai mặt:** câu trả lời vận hạn phải có cả điều thuận lợi lẫn điều cản trở của lớp hạn.
   Nhãn chiều chỉ quyết phần nào nói trước, nói nặng hơn; không quyết bỏ phần nào. Bên nào mỏng thì nói
   đúng mức là mỏng, không phóng to. Sao gốc không nằm trong hai danh sách (chỉ dẫn chứng).
5. **Chữ cho người đọc phải đời thường:** "lực cản", "đỡ", "tín hiệu", "chồng lớp" chỉ là tên nội bộ;
   Celes nói "điều cản trở", "điều thuận lợi"…

Còn chờ chốt (xem bảng cuối `giai-dap-chi-tiet-luong-luan-giai.md`): Q2 (sửa câu quyết định số 1 để kết
hợp sao lưu với tứ hoá theo hạn), Q-nguon, Q5, Q-tham, Q-sao, Q-dot, Q-dem.

## Bổ sung ngày 16/10/2026 (lượt 3)

Đã chốt:
- **Q2:** sửa quyết định số 1 trong AGENTS.md: "Nam phái làm chuẩn cho an sao. Khi luận vận hạn, kết hợp sao
  lưu với tứ hoá theo hạn; cả hai cùng là căn cứ của lớp hạn." (sửa trong phiên [CODE])
- **Q-nguon:** Celes không bao giờ nói "không có tài liệu", vẫn được nói mức chắc chắn. Sửa 4 prompt.
- **Q-dem:** chấp nhận tăng THE_HE_DEM cuối đợt bài luận.
- **Q-sao (định hướng của chủ dự án):** BỎ cộng cát/hung từng sao. Tử vi không cố định nghĩa một sao; phải xét
  theo tổ hợp, cách cục, quy tắc xem cung tổng thể (ví dụ Sát Phá Tham hợp sát tinh). Thứ bậc: cách cục > luật
  tổ hợp > sao đơn lẻ. Chi tiết đang chờ chốt.
- **Q-dot:** AI quyết: nhiều commit trên một nhánh, mỗi commit xanh độc lập (engine → chat → bài luận + kho).

Phát hiện khi phản biện lượt 3:
- Bảng độ sáng `lib/tuvi/dosang.ts` lấy từ dự án mã nguồn mở CanChi, không có nguồn sách. Tham Lang miếu chỉ
  ở Sửu Mùi, Thìn Tuất là Vượng. Cần chủ dự án chốt bảng độ sáng chuẩn có nguồn.
- Mỗi lá số chỉ có MỘT luồng chat (chat_messages theo chartHash, đọc lại 60 tin). `gomDieuTuKe` đã tự nhớ điều
  người dùng kể trong 60 tin đó, bằng khớp mẫu — ngược lời cấm ở mục 21 ca-nhan-hoa-celes.md chưa ai đối chiếu.

Còn chờ: Q5 (cách nhớ), Q-tham (bảng độ sáng chuẩn), Q-sao (duyệt bảng luật tổ hợp hạt giống).

### Lượt 3, chốt thêm (16/10/2026)
- **Q5 ok:** giữ và nâng cấp `gomDieuTuKe` (ghi ngày, loại tin khủng hoảng, hiện dòng "Celes đang nhớ" có nút
  bỏ), bỏ ý nút "Nhớ điều này", sửa mục 21 ca-nhan-hoa-celes.md cho khớp.
- **Q-sao ok:** đọc theo tổ hợp (cách cục > luật tổ hợp theo đúng cặp sao sách nêu > sao đơn lẻ), chiều mặc định
  thấp nhất theo tứ hoá/lớp hạn; đo tỉ lệ "hai mặt" trước khi bật.
- **Q-dot ok:** 4 commit một nhánh: engine → bảng luật tổ hợp (chủ dự án duyệt) → chat sau cờ → v3 + kho + đệm.
- **Đính chính:** "bảng độ sáng chưa chuẩn" là nói quá. Đối chiếu bảng "thế đứng" trong *Tử Vi khảo luận*:
  ranh giới sáng/hãm của chính tinh khớp; lệch bậc ở Tham Lang, Thiên Lương, Thiên Cơ, Liêm Trinh, Thái Âm;
  lệch thật (đắc ↔ hãm) ở Hỏa Tinh (Thìn), Linh Tinh (Mão, Thìn).
- **Q-tham (đề xuất, chờ chốt):** Tham Hỏa/Linh tương phùng thành khi Tham Lang + Hỏa hoặc Linh đồng cung ở tứ mộ.
  Câu "tại Mão" (Đẩu số toàn thư 1992) loại vì Tham ở Mão hãm ở mọi bảng. Không xét độ sáng Hỏa/Linh.

## Lượt 3, chốt thêm (tiếp)

- **Q-chuan: đã chốt.** Chuẩn độ sáng và điều kiện cách cục là *Tử Vi hàm số* (theo Thái Thứ Lang).
- **Q-dosang: đã chốt.** Sửa bảng độ sáng theo sách, làm thành phiên [SỬA LỖI] riêng, TRƯỚC đợt vận hạn.
- **Rà cách cục:** chủ dự án yêu cầu rà toàn bộ. Kết quả ở `D:\Celestia\ra-soat-cach-cuc.md`: 84 mục; engine khớp 2, có một phần 17, sai 1 (Hình Tù giáp Ấn), thiếu 64. Chờ chủ dự án chốt các đề xuất và sổ mâu thuẫn.
- **Rà cách cục: chủ dự án ok 3 mục đề xuất.** (1) Chuẩn = HS; HS không có thì lấy cách mà ít nhất 2 sách khác ghi giống nhau; mâu thuẫn thì vào sổ "chưa rõ". (2) Sửa #49, #50, #29 trong phiên [SỬA LỖI] bảng độ sáng. (3) Làm khung trước → đợt 1 khoảng 35 cách → đợt 2 → tạp cục cùng đợt vận hạn; đo tần suất từng cách; chuyển giáp cung về engine. Đề xuất xử lý mâu thuẫn ở cuối `ra-soat-cach-cuc.md`, chờ chốt.

## Lượt 4, chốt sau phản biện phương án [CODE] (16/10/2026)
Căn cứ: tra 14 sách ở `D:/Tài liệu tử vi/markdown` (chi tiết trong `PHUONG-AN-van-han-lop-han.md`, mục "Sau phản biện").
- **Tứ hoá đại vận: VẪN LÀM** dù chưa có nguồn sách Việt (chủ dự án sẽ bổ sung nguồn sau). Làm để khi có nguồn thì chạy được như đã chốt. Ghi sổ chưa rõ: "chưa có nguồn".
- **Lưu tứ hoá theo can năm: tầng NGANG sao lưu.** Kỵ = cản trở, Lộc/Quyền/Khoa = thuận; ghép nghĩa qua luật tổ hợp.
- **Dị bản tứ hoá (Canh: Đồng Âm 4 sách / Âm Đồng 2 sách; Nhâm Khoa: Tả Phù / Thiên Phủ 3–3): giữ engine, vào sổ chưa rõ.** Không đổi an sao.
- **Phạm vi: thêm commit 5 Hành trình** (`lib/tuvi/luan-han.ts` theo cùng bảng sự thật lớp hạn). Cờ chỉ bật production khi chat, v3, Hành trình đều đã đổi.
- **Tứ hoá chưa có nguồn: xử lý code như đã chốt** (vào dữ kiện chat + v3), để khi bổ sung nguồn tứ hoá thì chạy được ngay.
- **Đệm Hành trình:** đưa nhãn nhịp vào khoá của `nhip-hien-tai` và `luan-han-chi-tiet` (`|nhip:<nhãn>`).
- **Cờ:** một cờ server `CELES_LOP_HAN=1`, truyền tham số vào engine (engine không đọc env); bật/tắt chat + v3 + Hành trình cùng lúc.
- **Gộp `viec/van-han-lop-goc` vào nhánh vận hạn** (commit 0), nghiệm thu chung.
- **Duyệt phương án**: làm commit 0 → 1 → 2a, rồi trình bảng luật tổ hợp (2b) duyệt từng dòng; commit 3 làm với bảng rỗng.
