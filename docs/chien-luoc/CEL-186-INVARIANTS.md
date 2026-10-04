# CEL-186 — Bất biến của đường Focused (final hardening 04/10/2026)

Mỗi dòng là một luật đã khoá bằng mã **và** bằng test chạy trong CI (`scripts/test-focused.ts`, trừ
khi ghi khác). Sửa mã làm đỏ một test ở đây là phá một bất biến: dừng và hỏi, đừng sửa kỳ vọng
cho xanh. Thông điệp lỗi trong test mang đúng mã bất biến (`AGE-01 …`, `GROUND-04 …`) để grep.

Phiên bản lúc khoá: `focused-2026.10.9`, planner `2026.10.4` (không đổi, nên không xả đệm STANDARD).

## TIME — thời gian

| ID | Luật | Lớp chịu trách nhiệm | Test |
|---|---|---|---|
| TIME-01 | "tháng N" không ghi âm là tháng **dương**; quy đổi sang tháng âm chiếm phần lớn, nói rõ việc quy đổi là của Celes | `phan-loai.ts` `boiCanhThoiGian`, `thang-am.ts` `thangAmChuYeu`, `cau-ma.ts` `cauThangDuong` | bảng "Tháng 6 năm 2025… / Tháng 11…" + "câu tháng dương sắp tới sai" |
| TIME-02 | Tháng **nhuận** (gõ thẳng, chip, hoặc tháng dương rơi vào nhuận) → dừng bằng câu mã, không truy hồi, không đọc tháng thường | `tra-loi-focused.ts` nhánh nhuận, `cauNhuanChuaTach` | "8/2025 ra …", vòng "Tháng 6 nhuận năm 2025" (đầu-cuối) |
| TIME-03 | Biên tháng/năm âm tính bằng ngày dương thật (tháng nhuận có độ dài riêng) | `thang-am.ts` `ngayCuoiThangAm`, `ngayCuoiNamAm` | `TIME-03` (khối 5) |
| TIME-04 | Tháng dương vắt hai tháng âm → chọn tất định tháng có phần dài hơn, không nói "phần lớn" khi gần đều | `thangAmChuYeu`, `cauThangDuong` | "câu tháng dương vắt hai tháng sai", `TIME-04` |
| TIME-05 | Hỏi tháng dương rơi vào nhuận: không nói "hai tháng 6" / "tách" — người hỏi không hỏi chuyện đó | `cauNhuanChuaTach` (nhánh `m.duong`) | "câu nhuận từ tháng dương sai" |
| TIME-06 | Hỏi MỘT tháng: bản cuối phải còn ≥ 1 câu dựa nguyệt hạn; thiếu → thử lại; vẫn thiếu → văn rỗng (502 + hoàn lượt) | `kiem.ts` `thieu-nguyet-han`, `chay.ts` | "tháng thiếu câu nguyệt hạn…", "tháng thiếu nguyệt hạn ra…" (đầu-cuối) |
| TIME-07 | Tháng đã qua: câu có "sẽ" bị bỏ; câu mã nói rõ là nhìn lại, không dự báo | `kiem.ts` `tuong-lai`, `cauThangDuong` | "tháng đã qua nói "sẽ" không bị chặn", "câu tháng dương đã qua sai" |

## GROUND — căn cứ và tên

| ID | Luật | Lớp | Test |
|---|---|---|---|
| GROUND-01 | Tập tên được gọi chỉ dựng từ **mặt chữ prompt đã in**: `noiDung`, khối nghiêng đã dựng, câu hỏi khi tra cứu | `prompt.ts` `tenDuocGoiTrongLuot` / `nghiengHienThi` | hồi quy (1)–(4) |
| GROUND-02 | `d.sao[]` là metadata, không cấp quyền gọi tên; câu nhắc tên chỉ-metadata bị bỏ | `quet-ten.ts` `tapTenTuGoi`, `kiem.ts` | (1), (5) ca thật Phá Toái/Thiên Y, `GROUND-02 oracle` (378 câu) |
| GROUND-03 | Prompt và guard đọc CÙNG một hàm (`nghiengHienThi`) — không dựng tay hai lần | `prompt.ts` | (1) khối nghiêng không in tên chỉ-metadata |
| GROUND-04 | **Oracle độc lập**: render prompt thật (mốc thời gian thật, có khối tháng), quét tên trên chữ in ra; guard ⊆ oracle trên bộ ca. Oracle KHÔNG gọi `tenDuocGoiTrongLuot`. Giới hạn đã biết: oracle dùng chung từ điển `quetTen` với guard — tên thiếu trong từ điển lọt cả hai | `scripts/oracle-ten-prompt.ts` | `GROUND-04 oracle` (3 lá số × 10 câu, có tháng dương và âm) + đột biến `d.sao` phải bị bắt ở MỌI ca có tên chỉ-metadata |
| GROUND-05 | Đầu mốc chỉ-metadata in **không tên**, kèm lệnh không gán nét sang sao khác | `khoiNghiengFocused` | (1) "đầu mốc chỉ ở d.sao phải in nét, không in tên" |
| GROUND-06 | Bộ đo eval "tên ngoài gói" dùng oracle render, không dùng chung tập với guard | `eval-focused.ts` `cham` | `G:` (5 kiểm: metadata bị bắt, tên đã in qua, cách cục trong khối qua, tra cứu qua, dòng cách cục đọc được) |

## PERSON — người được hỏi

| ID | Luật | Lớp | Test |
|---|---|---|---|
| PERSON-01 | Hỏi vận riêng của người khác (bố thi, chồng thăng chức) → F2: câu mã, không đọc cung của người hỏi | `doi-tuong.ts`, F2 | bảng `loai: 'van-rieng'`, "F2 ra …" (đầu-cuối) |
| PERSON-02 | Câu quan hệ (tôi với bố có hợp không) → đọc cung lục thân, không gán nét sao thành tính cách người hỏi | `chot-huong.ts` `cumChoChuDe` | "dự phòng lục thân sai", chip F2 → F1 |
| PERSON-03 | "chồng tôi" trên lá số nam / "vợ tôi" trên lá số nữ → câu hỏi lại tất định, không model, không suy đoán xu hướng; "mẹ chồng", "con gái lấy chồng", người thứ ba ("anh ấy đã có vợ", "lấy vợ cho thằng cả") không bắt — đường từ khoá đòi người hỏi tự xưng ("tôi lấy chồng") | `gioi-han.ts` `chanLechGioi` | `PERSON-03` (8 ca + EN) + đầu-cuối `focused-lech-gioi` |
| PERSON-04 | Chip của câu hỏi lại ("bạn đời của tôi") đọc đúng Phu Thê và không bị chặn lại | `chanLechGioi`, planner | `PERSON-03 chip bạn đời…`, `PERSON-03 chip lại bị chặn` |

## AGE — tuổi và ngày sinh

| ID | Luật | Lớp | Test |
|---|---|---|---|
| AGE-01 | Mốc NGƯỜI HỎI GỌI TÊN kết thúc trước ngày sinh → dừng bằng mã trước truy hồi, không model, **hoàn lượt**. Tháng chứa ngày sinh vẫn đọc. Không gọi mốc → không xét (kể cả lá số sinh sau hôm nay: "tính cách của bé" vẫn đọc). Năm gọi bằng tiếng Anh ("in 2025", "Will 2027…") được lớp Focused đọc vào `namMucTieu` (planner chỉ hiểu tiếng Việt; UAT 04/10 câu EN trước sinh lọt rồi 502) | `gioi-han.ts` `chanTruocSinh`, `tra-loi-focused.ts` `gioiHan`, route `khongTinhLuot` | `AGE-01` bảng 8 ca + 2 ca lá số 1990 + EN + `AGE-01 năm EN` 4 ca + đầu-cuối "How was my health in 2025?" |
| AGE-02 | Tuổi âm < 15 hỏi việc làm / hôn nhân / người yêu CỦA CHÍNH người có lá số (VI và EN) → câu mã, hoàn lượt. Không chặn: câu cả đời (`giai-doan`), câu thiên hướng nghề, câu về người khác trong nhà ("bố tôi công việc", "bố mẹ tôi ly hôn"), học hành, tính cách, sức khoẻ. Lượt chặn thứ hai (sau model phân loại) chỉ xét từ khoá + vai, không xét chủ đề — cùng câu không lúc chặn lúc không | `chanChuaHopTuoi` | `AGE-02` bảng 9 ca × 2 lá số + bảng lá số 2016 (8 ca) + EN "work out" + lượt hai + đầu-cuối |
| AGE-03 | Cùng lá số, năm đủ tuổi thì đọc bình thường (luật tính theo năm đang đọc, không theo hôm nay) | `tuoiAmTai(laSo, tg.namHieuLuc)` | `AGE-03 năm 2045` |

Thứ tự trong `gioiHan`: trước sinh → lệch giới → tuổi. Chạy hai lần: sau kế hoạch luật và sau kế
hoạch model (vòng hai có thể đổi năm/chủ đề).

## TOPIC — chủ đề

| ID | Luật | Lớp | Test |
|---|---|---|---|
| TOPIC-01 | "bản thân tôi … công việc" → sự nghiệp ("bản thân" là bí danh của Mệnh, không được thắng chủ đề thật) | `ke-thua.ts` `lapKeHoachChinh` | `TOPIC` 3 ca (có dấu, không dấu, chỉ "bản thân" → tổng quan) |
| TOPIC-02 | "nhà cửa / chỗ ở / chuyển nhà" → gia đạo, Điền Trạch | `lapKeHoachChinh` + `lapKeHoachVoiChuDe` | `TOPIC` 3 ca |
| TOPIC-03 | Mua nhà, vay tiền, BĐS, nhà + tiền bạc → giữ tài chính. Không bắt "vay" / "tien" trần (gõ không dấu "vậy", "thuận tiện") | `lapKeHoachChinh` (`NHA_TIEN`) | `TOPIC` 4 ca âm + 2 ca không dấu |

Sửa ở lớp Focused, không ở bảng planner: đổi bảng là đổi `PHIEN_BAN_PLANNER` → xả đệm `noi_dung_ai`
và đổi STANDARD.

## FALLBACK — câu chốt dự phòng

| ID | Luật | Lớp | Test |
|---|---|---|---|
| FALLBACK-01 | Hướng cân bằng, hai phía đều có tên được phép → nêu cả hai | `chot-huong.ts` `mocChoCauChot` | `FALLBACK-01` |
| FALLBACK-02 | Một phía không có tên được phép → không nêu tên phía nào, không mượn tên | `mocChoCauChot` | `FALLBACK-02` |
| FALLBACK-03 | Dự phòng chỉ gọi đầu mốc có tên trong chữ (lọc theo tập guard) | `kiemLuot` | (4) "câu chốt dự phòng gọi tên chỉ có ở d.sao" |
| FALLBACK-04 | Dự phòng EN không còn chữ Việt (ngoài tên sao) | `cauChotDuPhong` | `FALLBACK-04`, "dự phòng EN người khác còn chữ Việt" |

## VOICE — giọng

| ID | Luật | Lớp | Test |
|---|---|---|---|
| VOICE-01 | Mọi câu mã có bản VI và EN; bản EN không còn chữ Việt | `cau-ma.ts`, `ngon-ngu.ts` | vòng `CAU_*.en`, EN của AGE/PERSON/TIME |
| VOICE-02 | Lớp sửa tiếng lóng / giọng máy chỉ đổi lối nói, không thêm dữ kiện; câu hỏng thì bỏ, không sửa nghĩa | `kiem.ts`, `chay.ts` `suaTiengLong` | "giong-may", độ dài |
| VOICE-03 | Văn phong mới (A/B 04/10) **HOLD** — không có trong nhánh này | — | không áp dụng (nhánh local `viec/cel-186-van-focused-thu*`) |
| VOICE-04 | Không lộ tên model / nhà cung cấp / quota ở mặt trước | route + `ngon-ngu.ts` | `bien-tap-vi` (người soát) |

## RETRY — thử lại và lỗi

| ID | Luật | Lớp | Test |
|---|---|---|---|
| RETRY-01 | Thử lại tối đa MỘT lần | `chay.ts` | "ca 10 gọi … lần, cần đúng 2" |
| RETRY-02 | Hết câu có căn cứ sau thử lại → văn rỗng → route 502 + `hoanCauHoi` | `chay.ts`, route | ca 10 |
| RETRY-03 | SENSITIVE không bị cắt độ dài; miễn trừ nối sau guard, kể cả lượt mã | `kiem.ts`, `datMienTruTheoNgonNgu` | "SENSITIVE bị cắt", "F2 SENSITIVE thiếu lời miễn trừ" |
| RETRY-04 | CRITICAL dừng ở route trước mọi luận giải — Focused không đổi nhánh này | `app/api/hoi-dap/route.ts` | `scripts/test-an-toan.ts` |

## Ngoài bộ bất biến

- **Giả định đã biết, chưa khoá:** ba lớp chặn mới coi lá số đang chat là của người hỏi. Giao diện cho
  chat trên lá số đang xem bất kỳ (`idDangXem ?? idMacDinh`): vợ xem lá số chồng mà hỏi "chồng tôi"
  sẽ nhận câu hỏi lại, và chip "bạn đời của tôi" đọc Phu Thê của lá số đang xem. Sửa tận gốc cần
  biết quan hệ người hỏi ↔ lá số — nợ sau Production.
- **Tiêu chí hoàn lượt:** chỉ ba lớp chặn mới (`khongTinhLuot`) được hoàn; câu mã F2 / D / tháng nhuận
  vẫn tính lượt như trước. Chưa thống nhất thành một luật — nợ, quyết khi định giá gói.

- Cờ `CELES_FOCUSED_CHAT` tắt → STANDARD nguyên vẹn: `test-focused` ("phienBanHienTai của STANDARD
  mang khoá focused"), `test-fallback-giu-nguyen`, `test-moi-truong-dem`, bộ vàng planner 100/100.
- Lượt trả bằng mã (`khongTinhLuot`) không trừ lượt: route gọi `hoanCauHoi` thay vì `chotCauHoi`.
- **Dễ đọc là luồng việc SAU Production**, không phải điều kiện mở. Mọi đổi văn phong phải qua cổng
  cứng: đúng dữ kiện không thấp hơn bản đang chạy, lỗi nặng không nhiều hơn, thử lại / 502 không
  tăng — rồi mới xét dễ đọc. Xem `docs/bay/ai-rag.md` (bài học 04/10).
