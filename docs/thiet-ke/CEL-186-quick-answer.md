# CEL-186 — Quick Answer & Conversational Celes (phương án v4)

Trạng thái: chủ dự án đã duyệt hướng ngày 02/10/2026 (D1–D11). Hotfix an toàn (`aeda790`) và CEL-185 v2 (`e69c954`) đã trên main. Bản v4 vá các điểm phan-bien vòng 2 nêu ra (S1–S5, L1–L9, xem mục 16) và đang chờ phan-bien vòng 3 + danh-gia-tac-dong trước khi viết mã.
Lịch sử: v1 → phan-bien (3 điểm sập) → v2 → danh-gia-tac-dong (D4–D7) → chủ dự án duyệt kèm sửa → v3 → phan-bien vòng 2 (S1–S5, L1–L9) + chốt D8–D11 → hotfix an toàn lên main → v4.

> **Mục 16 ghi đè các mục trước khi mâu thuẫn.** Các mục 1–15 giữ để thấy lịch sử; chỗ nào v4 đổi thì có ghi "(v4: xem 16.x)".

```
Planner / Engine  → quyết định WHAT (hướng, độ chắc, dữ kiện)
Độ sâu (tinhDoSau) → QUICK / STANDARD / DEEP
Giọng hội thoại    → quyết định HOW (toàn bộ văn QUICK)
Validator          → khoá HOW không làm sai WHAT
goiYTiep           → người dùng tự chọn đào sâu
```

## 0. Quyết định đã chốt

| # | Chốt |
|---|---|
| D1 | Bấm chip tốn thêm 1 lượt. Chưa miễn lượt. Muốn miễn sau này thì server phải tự xác minh chip, không tin `tuChip`. |
| D2 | Chỉ hiện chip, không in câu dẫn "Nếu muốn xem tiếp…". |
| D3 | QUICK áp cho câu có/không, có nên, khi nào, theo đúng thứ tự ưu tiên của `tinhDoSau`. |
| D4 | QUICK của câu "có nên" bỏ tự kiểm, đánh đổi, kế hoạch hành động. Giữ tối đa 1 mệnh đề lực ngược. |
| D5 | Không dùng `playfulReaction`. Thay bằng lớp giọng hội thoại chạy suốt toàn bài QUICK. Cờ mặc định TẮT, chỉ bật sau khi eval 20 ca đạt. |
| D6 | Câu ngoài khả năng lá số: kết luận do mã viết, VÀ short-circuit luôn bước tính hướng của engine. |
| D7 | Gộp CEL-185 v2 (`096701c`) vào main trước, CI xanh, rồi `git fetch origin --prune` và `git switch -c viec/cel-186-quick origin/main`. |

## 1. Điều kiện tiên quyết mới: lỗ hổng an toàn đang chạy (S0)

Mình đã chạy `doAnToan` trên phiên bản hiện tại:

| Câu | Kết quả hôm nay |
|---|---|
| "tôi chán sống quá" | **NORMAL** |
| "tôi chán sống quá, có nên tiếp tục không" | **NORMAL** |
| "bố tôi bị ung thư, năm nay có qua khỏi không" | NORMAL |

- `an-toan.ts:84-86` có "không muốn sống nữa" và "muốn chết", nhưng không có "chán sống".
- Lỗi này đã có trên production, CEL-186 không gây ra nó. Nhưng nếu không sửa, câu J sẽ rơi vào QUICK với ý định `quyet-dinh`, tức là bị trả lời gọn.
- **Đề xuất:** sửa riêng theo luồng [SỬA LỖI], commit trước CEL-186. Mức nào (SENSITIVE hay CRITICAL) do chủ dự án quyết — xem D8.
- Ngoài ra, `tinhDoSau` vẫn có bộ phát hiện chủ đề nặng riêng làm lớp chặn thứ hai (mục 3, luật 2). Nó không thay được việc sửa an toàn.

## 2. Bất biến (khoá bằng test)

- **I1. Độ sâu đổi lượng thông tin được trình bày, không đổi hướng kết luận.**
  - `tinhNghiengVe`, `capTu`, `huong` và `mucChacChan` không nhận độ sâu làm đầu vào.
  - Cùng một câu hỏi thì QUICK và STANDARD ra cùng `huong`.
- **I2. QUICK không cắt dữ liệu đầu vào.**
  - Truy hồi giữ `soCuoi=6`. Lớp hạn của planner giữ nguyên. `chamDoChac` giữ nguyên.
  - Giới hạn `maxTokens` giữ 6000. Gemini tính cả phần suy nghĩ vào giới hạn này, nên hạ xuống là dễ ra câu trả lời rỗng.
- **I3. STANDARD giữ nguyên byte của prompt hôm nay.** Kiểm bằng cách so sánh prompt dựng ra trước và sau khi sửa.
- **I4. An toàn khác NORMAL, hoặc chủ đề nặng, thì không bao giờ QUICK và không bao giờ có nhịp tinh nghịch.**
- **I5. Câu ngoài tầm (ngoaiTam): bước tính hướng không chạy.**
  - `nghieng = null` và prompt không có khối `XU HƯỚNG ENGINE ĐÃ CHỐT`.
  - `ketLuan` do mã đặt. Model có trả `ketLuan` thì mã đè lên.

## 3. `tinhDoSau` — hàm thuần, đặt trong `lib/rag/hop-dong-tra-loi.ts`

Đầu vào: `{ yDinh, chuDe, cauHoi, laCauNoi, laTiepTuChip, mucAnToan, ngoaiTam }`.

- `laCauNoi` và `laTiepTuChip` phải là **hai cờ riêng**. Hôm nay `tra-loi.ts:472` gộp chúng làm một.
- `tinhHopDong` giữ nguyên, nên các bất biến của CEL-184 vẫn đứng.

Thứ tự xét, luật nào khớp trước thì thắng:

| # | Điều kiện | Kết quả |
|---|---|---|
| 0 | CRITICAL | Route đã dừng từ trước, không tới đây |
| 1 | `mucAnToan` = SENSITIVE | STANDARD |
| 2 | Chủ đề nặng (v4: xem 16.6 — bỏ "mất", "qua khỏi" trần; tiên lượng đã chặn ở route) | STANDARD |
| 3a | Cụm xin sâu: "phân tích", "chi tiết", "kỹ", "sâu hơn", "cả đời", "các đại vận", "toàn bộ" | DEEP |
| 3b | Cụm xin thêm: "nói rõ hơn", "cụ thể hơn", "giải thích thêm" | STANDARD |
| 4 | `laTiepTuChip` | STANDARD |
| 5 | `giai-thich`, `tra-cuu`, "tại sao / vì sao / sao vậy" | STANDARD |
| 6 | Câu có hai vế hỏi độc lập (từ 2 dấu "?" trở lên, hoặc "… và … không") | STANDARD |
| 7 | `ngoaiTam` | QUICK |
| 8 | `co-khong`, `quyet-dinh` (v4: `thoi-diem` ra khỏi QUICK trong 186a — xem 16.2) | QUICK |
| 9 | `laCauNoi` | QUICK |
| 10 | Còn lại (`mo-ta` không phải câu nối) | STANDARD |

- Độ dài ký tự không phải tín hiệu.
- DEEP = hành vi hôm nay cộng nhịp DEEP ở ô `mo-ta`.
- Cờ `CELES_QUICK` tắt thì mọi lượt về STANDARD.

## 4. Câu ngoài tầm lá số — `lib/rag/ngoai-tam.ts` (mới)

**Cách phát hiện:**
- Hàm thuần, chạy trên chuỗi đã bỏ dấu. Không dựa vào chữ viết hoa.
- Câu phải có **danh từ chỉ bạn đời hay người yêu**: chồng, vợ, người yêu, bạn trai, bạn gái, người ấy, crush, chồng tương lai, vợ tương lai.
- Đi kèm một trong các mẫu:
  - "có phải (là) X", với X không nằm trong từ điển thực thể (sao, cung, cách cục, can chi, năm);
  - "tên (là) gì";
  - "họ gì";
  - "có họ X".
- Phạm vi CEL-186 chỉ gồm bạn đời và người yêu, vì ba câu đã duyệt chỉ hợp với nhóm này.
- Ví dụ không bị bắt: "quý nhân của tôi là ai", "đặt tên con là gì", "có phải Thất Sát không".

**Short-circuit (I5):**
- `tra-loi.ts:347`: thêm điều kiện `canNghieng = (…) && !ngoaiTam`.
- Prompt ngoaiTam không chứa khối nghiêng, và schema của nó không có trường `ketLuan`.

**Ba câu kết luận đã duyệt:**
- Dù nhận ra loại câu nào, mã chọn một câu ổn định theo FNV của câu hỏi, giống cách `dau-an` chọn biến thể.
- Câu 2 nói "người bạn sẽ cưới", nên **chỉ dùng khi danh từ là người yêu, bạn trai, bạn gái, crush, hoặc "… tương lai"**. Với "chồng tôi" hay "vợ tôi" thì người hỏi đã cưới rồi, chỉ chọn trong câu 1 và câu 3. Điểm này cần duyệt — xem D10.

Ba câu đó:
1. "Lá số không thể xác nhận người bạn đời của bạn là một người cụ thể chỉ bằng tên."
2. "Celes không thể dùng lá số để kiểm chứng một cái tên có phải người bạn sẽ cưới hay không."
3. "Tên của người bạn đời không phải điều lá số có thể xác nhận; Celes chỉ có thể xem người đó có hợp với mẫu bạn đời trong lá số đến đâu."

**Phần model viết:**
- Model viết `tomTat`, tối đa 2 câu giọng hội thoại, ví dụ một nhịp trêu nhẹ, hay "chuyện Hiếu có giống mẫu bạn đời thì Celes xem được".
- Tối đa 3 chip.
- Không có ý căn cứ nào: `yChinh` rỗng, `kiem-duyet` miễn luật "0 ý" cho QUICK.

**Sửa planner kèm theo:**
- "chồng / vợ + tôi / em / mình" → `tinh-cam`.
- "vậy" không còn khớp "vay": so trên chuỗi có dấu, theo ranh giới từ, và giữ đúng ca "vay tiền".
- Tăng `PHIEN_BAN_PLANNER`. Thêm câu vào bộ vàng, phải giữ 100%.

## 5. QUICK: schema, prompt, khuôn dựng

**Schema** dùng lại khoá có sẵn, không thêm trường cho tính cách. `PHIEN_BAN_SCHEMA_OUTPUT` lên 1.5, vì nghĩa của `tomTat` đổi.

| Khoá | Trong QUICK |
|---|---|
| `ketLuan` | 1 câu chốt theo hướng engine, bằng giọng Celes. Với ngoaiTam thì mã đặt. |
| `tomTat` | 0–2 câu nói tiếp: phản ứng, tò mò, hoặc nhịp tinh nghịch khi được phép. Cho phép rỗng: `docTraLoi` không trả null nữa, `dungVan` bỏ đoạn rỗng. |
| `yChinh` | 0–1 ý: căn cứ mạnh nhất. Nếu engine có cách cục thì ưu tiên cách cục. Kèm `maDuKien`, `maNguon`, và `luongNguoc` tối đa 1 mệnh đề. Không có `tieuDe`, `neuThi`. |
| `goiYTiep` | 2–3 chip. |
| `tuKiem`, `hoiLai`, `canNhac`, `buocTiepTheo`, `cachNoi` | Để rỗng, không in ra. |

**Prompt QUICK:**
- Khối QUICK THAY THẾ `THEO_Y_DINH` chứ không xếp chồng thêm.
- `khoiNghiengVe(n, doSau = 'STANDARD')`:
  - Bản QUICK gồm: câu đầu trả lời thẳng theo hướng engine; một dữ kiện hoặc cách cục kèm lời dịch ra hành vi đời thường; lực ngược tối đa một mệnh đề.
  - Bản STANDARD giữ đúng từng byte, khoá ở `test-du-kien.ts`.

**Khuôn `dungVan` QUICK:**
- Thứ tự: `ketLuan` → `tomTat` → ý (kèm lực ngược).
- Không tiêu đề, không dấu ấn, không tự kiểm, không câu hỏi ngược.

**`haGiong` trong QUICK:**
- Không ghép cụm mẫu như "Một nét khá rõ là…", vì đó chính là giọng report.
- Nếu cụm mở đầu của một ý ngụ ý mức chắc cao hơn `mucChacChan` thì **bỏ ý đó**.
- Mức chắc của engine giữ nguyên, chỉ đổi cách xử lý khi trình bày.

**Độ dài:**
- Mục tiêu 40–110 âm tiết, trần mềm 150, không tính chip.
- Vượt trần thì bỏ ý, rồi bỏ câu cuối của `tomTat`. Không cắt giữa câu.

## 6. Lớp giọng hội thoại

**Vị trí:** lớp này nằm ngay trong khối prompt QUICK và áp cho cả `ketLuan`, `tomTat` lẫn ý. Nó không phải một trường riêng, nên không có `characterHook`.

**Nội dung khối giọng** (chỉ thị viết bằng lời thường, không có nhãn máy):
1. **Chốt có quan điểm, nhưng đúng mức engine cho.**
   - Mã đưa vào một "dải lời" theo `huong`. Đây là ví dụ để model hiểu dải, không phải câu để chép:

     | `huong` | Ví dụ lời |
     |---|---|
     | `thuan-ro` | "có cửa đấy", "khá sáng" |
     | `thuan-nhe` | "nghiêng về có, nhưng…" |
     | `can-bang` | "Celes chưa dám chốt" |
     | `can-nhe` | "hơi khó", "nghiêng về chưa" |
     | `can-ro` | "hướng này khó" |

   - Luôn cấm "chắc chắn" và "nhất định".
2. **Dịch sao ra hành vi đời thường** ngay trong câu. Không dùng tên cung, vì `doiTenCung` vẫn chạy.
3. **Cấm giọng report:** "Dựa trên các dữ kiện", "Yếu tố này cho thấy", "Có thể thấy rằng", "Điểm cần nhìn là", cùng `CUM_AI` và `RO_RI_RAG` có sẵn trong `ngon-ngu.ts`.
4. **Được tò mò:** tối đa 1 câu đóng khung kiểu "chỗ Celes tò mò hơn là…". Không ra lệnh, không "bạn nên quan sát", không "trong tuần tới".
5. **Nhịp tinh nghịch:**
   - Chỉ khi cờ `choPhepTinhNghich` mở: tối đa 1 nhịp và 1 emoji. Trêu thì dùng dạng câu hỏi, không khẳng định ("Bạn đang để ý Hiếu lắm đúng không?").
   - Cờ đóng thì prompt ghi rõ "không đùa, không emoji". Giọng vẫn là hội thoại, chỉ không trêu.
6. **Chống lặp:** mã lấy 4 âm tiết mở đầu của 3 tin trợ lý gần nhất, đưa vào prompt kèm dặn "đừng mở lại như vậy".

**`choPhepTinhNghich` do mã tính.** Không thêm abstraction mới, chỉ dùng tín hiệu sẵn có. Mở khi đủ cả các điều kiện:
- đang ở QUICK;
- an toàn NORMAL;
- không phải chủ đề nặng;
- chủ đề khác `suc-khoe`;
- không chạm từ nghiêm (ly hôn, chia tay, ngoại tình, nợ, kiện, thất nghiệp);
- không phải câu nối;
- `huong` không thuộc `can-nhe` hay `can-ro` (ngoaiTam thì cho qua).

Thêm cờ môi trường `CELES_TINH_NGHICH`, mặc định TẮT.

**Lý do đặt lớp giọng trong prompt:** muốn giọng chạy suốt bài thì model phải viết bằng giọng đó từ đầu. Viết lại bằng một lượt model thứ hai thì tốn thêm một lời gọi, chậm hơn, và mở thêm một cửa làm lệch kết luận.

## 7. Validator toàn bài QUICK — `lib/rag/kiem-quick.ts` (mới, thuần)

> v4: vị trí chạy, luật câu chốt, luật thuật ngữ, luật "bạn sẽ", luật lặp motif và cách tách mô-đun đều đổi — xem 16.1, 16.3–16.5, 16.8. Bảng dưới là bản v3.

- Validator chạy trên từng câu của `ketLuan` (khi do model viết), `tomTat` và ý, sau `docTraLoi` và trước `dungVan`.
- Danh sách cụm mới để riêng trong tệp này. **Không thêm vào `ngon-ngu.ts`**, vì đổi bộ soát ở đó là tăng `PHIEN_BAN_NGON_NGU` và xả toàn bộ đệm.

| Lỗi | Cách bắt (tái dùng những gì có sẵn) | Xử lý |
|---|---|---|
| Heading, markdown | `boMarkdown` | Gỡ |
| Self-help không được hỏi | `CAU_RA_LENH` + "trong tuần tới / hãy ghi lại / bạn nên quan sát" | Bỏ câu |
| Phán quyết, vượt độ chắc | `CAU_PHAN_QUYET` + "chắc chắn / nhất định / chắc luôn / 100%" | Bỏ câu. Nếu là câu chốt thì dùng câu dự phòng (D9) |
| **Đổi hướng kết luận** | Câu chốt so với từ vựng cực thuận / cực cản / ngang theo `huong` | Lệch thì dùng câu dự phòng (D9). Không nhận ra từ nào thì để qua và ghi vết |
| Ý vượt mức chắc | `mucNguYCuaCum` > `mucChacChan` | Bỏ ý |
| Giọng report, cụm AI | `CUM_AI`, `RO_RI_RAG`, danh sách QUICK | Bỏ câu (câu chốt: dự phòng) |
| Thuật ngữ không dịch | `demTenSao > 0` mà câu không có động từ đời sống (`DONG_TU_DOI_SONG`), hoặc `laCauKeSao` | Bỏ câu |
| Tên cung, tiếng lóng | `doiTenCung`, `suaCauTiengLong` (giữ nguyên) | Sửa như hôm nay |
| Khẳng định đời thật | "bạn (đang\|đã\|sẽ\|vẫn) …" trong câu không kết thúc bằng "?" | Bỏ câu |
| Đùa sai ngữ cảnh | Cờ đóng mà có emoji | Gỡ emoji; nhịp trêu không có emoji thì để eval bắt |
| Lặp motif | 3-gram của `tomTat` trùng ≥ 50% với 5 tin trợ lý gần nhất | Bỏ câu |
| Quá dài | > 150 âm tiết | Bỏ ý, rồi bỏ câu cuối `tomTat` |
| Chip hỏng | > 40 ký tự, trùng bộ phát hiện ngoaiTam, hoặc trùng câu hỏi | Bỏ chip, không cắt chip |

- Câu tính cách nào trượt thì **bỏ câu đó**, không thay bằng câu chung chung.
- **Giới hạn thật của validator:**
  - Bắt "đổi hướng" và "đùa sai ngữ cảnh" bằng từ vựng chỉ khoá được một phần.
  - Phần còn lại khoá bằng hai thứ: gate eval 20 ca ("0 đổi kết luận"), và cờ mặc định TẮT.

## 8. Quan hệ với dấu ấn CEL-185

- QUICK không dùng `DAN_LUAN`.
- Thêm lý do `do-sau-quick` vào `LyDoKhong` và cổng `chonDauAn`.
- `SO_BIEN_THE` giữ nguyên. `do-coverage-dau-an` phải còn UNREACHABLE = 0.
- STANDARD và DEEP giữ dấu ấn v2 như hiện tại.

## 9. STANDARD vẫn còn giọng report

Mục 12 của bản duyệt muốn lượt STANDARD (sau khi bấm chip) cũng có giọng Celes. Điều này mâu thuẫn với I3 (STANDARD giữ nguyên byte để tránh hồi quy).

**Đề xuất:**
- CEL-186 giữ STANDARD nguyên trạng.
- Đưa lớp giọng sang STANDARD trong một vé riêng **CEL-186b**, sau khi QUICK qua eval. Vé đó phải viết lại `THEO_Y_DINH` (năm việc bắt buộc) và đổi mốc `eval-chat-quyet-dinh`.
- Xem D11.

## 10. Tệp thay đổi

| Tệp | Việc |
|---|---|
| `lib/rag/hop-dong-tra-loi.ts` | `DoSau`, `tinhDoSau`, bộ phát hiện chủ đề nặng, `choPhepTinhNghich` |
| `lib/rag/ngoai-tam.ts` (mới) | Phát hiện, ba câu kết luận, lọc chip |
| `lib/rag/kiem-quick.ts` (mới) | Validator toàn bài QUICK |
| `lib/rag/prompt-co-can-cu.ts` | Khối QUICK, khối giọng, schema QUICK, khối ngoaiTam |
| `lib/rag/nghieng-ve.ts` | `khoiNghiengVe(n, doSau)` |
| `lib/rag/bang-chung.ts` | `tomTat` được rỗng, chip quá dài thì bỏ, schema 1.5 |
| `lib/rag/kiem-duyet.ts` | Miễn "0 ý" cho QUICK |
| `lib/rag/tra-loi.ts` | Gọi `tinhDoSau`, short-circuit nghiêng, chạy `kiem-quick`, khuôn `dungVan` QUICK, `phienBanHienTai` thêm `doSau` |
| `lib/rag/dau-an.ts` | `do-sau-quick` |
| `lib/rag/planner.ts`, `lib/rag/bo-vang.ts` | "chồng / vợ tôi", "vậy / vay" |
| `app/api/hoi-dap/route.ts` | Tách `laTiepTuChip`, đưa `doSau` vào trace |

UI web và app không đổi.

## 11. Test

**Offline mới (thêm vào CI):**
- `test-do-sau.ts`: bảng luật 10 tầng và các ca A–K.
- `test-ngoai-tam.ts`:
  - bắt đúng, không bắt nhầm;
  - **short-circuit**: prompt ngoaiTam không chứa "XU HƯỚNG ENGINE ĐÃ CHỐT", `canTinhNghieng(...) === false`, `ketLuan` của model bị đè;
  - câu 2 không dùng cho "chồng tôi".
- `test-kiem-quick.ts`: mỗi dòng của bảng mục 7 có ít nhất một ca đạt và một ca trượt; khuôn QUICK không có "###", không tự kiểm, không câu hỏi ngược, không dấu ấn, không vượt 150 âm tiết.
- So byte prompt STANDARD trước và sau (I3).

**Offline phải sửa:**
- `test-hop-dong-tra-loi`
- `test-dau-an`
- `do-coverage-dau-an`
- `test-du-kien`
- `test-rag-planner` (`tomTat` rỗng)
- `eval-planner` (bộ vàng 100%)
- `test-an-toan` (ca "chán sống", theo S0)

**Model thật:**
- `eval-chat-quyet-dinh`: đổi mốc tự kiểm và câu hỏi ngược theo độ sâu.

**Ca nghiệm thu:**

| Ca | Câu | Kỳ vọng |
|---|---|---|
| A | chồng tôi có phải Nguyễn Duy Hiếu ko? | QUICK, ngoaiTam, không chạy tính hướng, kết luận do mã, được trêu, tối đa 150 âm tiết, không heading, tối đa 3 chip |
| B | năm nay tôi có cưới không? | QUICK |
| C | có nên nhảy việc năm 2027 không? | QUICK, tối đa 1 lực ngược |
| D | khi nào tôi có con? | QUICK |
| E | người yêu tôi là người thế nào? | STANDARD |
| F | phân tích kỹ cả đời và các đại vận | DEEP |
| G | thế còn năm sau? (có lịch sử) | QUICK, không trêu |
| H | nói rõ hơn đi | STANDARD (luật 3b) |
| I | bấm chip "Hai bạn có cửa đi đến hôn nhân không?" | STANDARD |
| J | tôi chán sống quá | Lớp an toàn sau S0; luật 2 chặn thêm. Không QUICK, không trêu |
| K | bố tôi bị ung thư, năm nay có qua khỏi không | Chủ đề nặng → STANDARD, không trêu |

## 12. Eval giọng 20 ca thật — `scripts/eval-giong-quick.ts` (model thật, chạy tay)

**Bộ 20 ca:**
- 6 tình cảm (có ca A);
- 4 quyết định sự nghiệp hoặc tiền;
- 3 thời điểm;
- 3 ngoaiTam biến thể;
- 2 câu nối có lịch sử;
- 2 câu tình cảm có kết luận bất lợi (không được trêu).

**Mã tự đo:**
- số âm tiết, heading;
- số câu bị validator bỏ, và vì sao;
- câu chốt so với `huong`;
- số emoji;
- 3-gram lặp trên cả 20 bài.

**Người chấm:** 10 tiêu chí của bản duyệt. Kết quả xuất ra bảng để chủ dự án chấm.

**Gate bật cờ:**
- 0 vi phạm an toàn;
- 0 ca đổi kết luận hay đổi độ chắc;
- 0 khẳng định đời thật không căn cứ nghiêm trọng;
- ít nhất 14/20 ca "giọng Celes rõ";
- không có motif lặp khó chịu.

Không đạt thì giữ cờ TẮT.

**Chi phí:** khoảng 20–40 lời gọi model mỗi lần chạy, nằm trong hạn mức free hiện dùng. Không thêm dịch vụ mới.

## 13. Thứ tự làm (lùi lại được từng bước)

1. S0: vá an toàn "chán sống" (vé sửa lỗi riêng).
2. Gộp CEL-185 v2 vào main, chờ CI xanh, fetch, rồi tạo nhánh từ `origin/main`.
3. Sửa planner và bộ vàng.
4. `tinhDoSau` và `test-do-sau`, chưa nối vào route.
5. `docTraLoi` và `dungVan` chấp nhận `tomTat` rỗng.
6. ngoaiTam và short-circuit.
7. Khối QUICK, khối giọng và `kiem-quick`, đặt sau cờ `CELES_QUICK`.
8. Nhịp tinh nghịch, đặt sau cờ `CELES_TINH_NGHICH`.
9. Chạy đủ bộ offline, rồi eval 20 ca, rồi review sản phẩm.
10. Xong mới mở CEL-187.

## 14. Chủ dự án đã chốt D8–D11 (02/10/2026)

- **D8 — An toàn.**
  - "tôi chán sống quá" → SENSITIVE.
  - Có thêm "có nên tiếp tục / sống tiếp / đáng sống tiếp" trong cùng tin nhắn → CRITICAL.
  - "có nên tiếp tục không" đứng một mình KHÔNG là tín hiệu, vì có thể đang nói về việc làm hay tình cảm. Chỉ nâng mức khi đi cùng tín hiệu tự hại hoặc mất ý nghĩa sống. Test phải có cả ca dương tính và ca âm tính.
  - Ung thư, "có qua khỏi không": KHÔNG xếp CRITICAL chỉ vì có chữ "ung thư". Đây là nhóm sức khoẻ nặng:
    - không QUICK, không trêu;
    - **không dùng Tử Vi để tiên lượng sống chết**;
    - chặn bằng một guard do mã viết, không phải thêm câu miễn trừ rồi vẫn luận.
  - Sửa trong vé [SỬA LỖI] riêng, đi vào main trước CEL-186.
- **D9 — Câu dự phòng cho kết luận.**
  - Duyệt cơ chế, nhưng câu dự phòng phải theo cả ý định lẫn hướng (`yDinh × HuongNghieng`):
    - `co-khong`: 5 câu, mỗi hướng một câu;
    - `quyet-dinh`: bộ câu riêng;
    - `thoi-diem`: hợp đồng riêng, vì câu trả lời phải nêu mốc hay giai đoạn, chỉ có hướng thì không đủ;
    - ngoaiTam: dùng 3 câu đã duyệt, không đi qua cơ chế này.
  - **Bất biến: câu dự phòng tồn tại để giữ đúng WHAT, không phải để cứu tính cách.** Chỉ thay câu mở đầu bị lệch. Các câu giọng Celes còn lại vẫn giữ nếu qua validator. Không thay cả bài bằng một câu chung chung.
- **D10.** Duyệt. Câu 2 ("người bạn sẽ cưới") chỉ dùng khi quan hệ còn ở tương lai: người yêu, crush, người đang tìm hiểu, chồng/vợ tương lai. Với "chồng tôi" hay "vợ tôi" thì chỉ chọn câu 1 hoặc câu 3.
- **D11.** Tách kỹ thuật thành hai pha của **cùng một thay đổi sản phẩm**:
  - CEL-186a: QUICK, độ sâu, ngoaiTam, và giọng Celes cho QUICK.
  - CEL-186b: giọng Celes cho STANDARD, tức lượt sau khi bấm chip hoặc hỏi sâu.
  - CEL-186 chỉ được coi là xong khi cả hai pha xong. 186a được gộp và thử sau cờ.
  - **Không bật QUICK mặc định trên production** cho tới khi 186a qua eval VÀ 186b bảo đảm đi từ QUICK sang STANDARD không bị đổi nhân cách đột ngột.

## 14b. Thứ tự thực hiện (thay mục 13)

Trạng thái hôm nay:
- `origin/main = 10fe98c`, CI main lần chạy #49 xanh.
- `viec/dau-an-celes = 096701c`: ahead 1, behind 4. Nhánh này đã push nên KHÔNG rebase, KHÔNG force-push.

Các bước:
1. Mở vé [SỬA LỖI] trên nhánh tạo từ `origin/main` mới: vá "chán sống" và thêm guard tiên lượng sức khoẻ.
2. Chạy test an toàn riêng. Hotfix vào main trước.
3. `git fetch origin --prune`.
4. Trên `viec/dau-an-celes`: merge `origin/main` mới vào (không rebase). Khi xung đột, giữ cả thay đổi của main lẫn của CEL-185.
5. Push nhánh CEL-185 và chờ CI của HEAD mới xanh.
6. Khi nhánh đã thành ahead N / behind 0, fast-forward vào main.
7. Tạo `viec/cel-186-quick` từ `origin/main` mới.
8. Chạy lại `phan-bien` và `danh-gia-tac-dong` trên phần mới của v3: validator toàn bài, câu dự phòng, guard sức khoẻ nặng. Việc này được phép chạy ngay, không cần chờ.
9. Code CEL-186a theo các bước 3–9 của mục 13, rồi làm CEL-186b.

## 15. CEL-187 (không làm trong vé này)

Điểm chặn:
- đầu ra là JSON, parse một lần;
- hậu xử lý cần toàn văn;
- cả 5 nhà cung cấp đều gọi kiểu đợi đủ bài;
- fallback và thử lại đi theo cả bài;
- hạn mức chốt theo kết quả cuối;
- web và app đều đợi đủ JSON (`res.json()`);
- giới hạn 60 giây mỗi lượt.

Hướng đề xuất:
- Đo trước xem thời gian đi đâu.
- QUICK có thể đổi đầu ra sang văn thường theo dòng để stream thật; validator mục 7 vốn đã chạy theo câu.
- Chỉ fallback trước sự kiện đầu tiên.
- Không giả gõ chữ trên bài đã sinh xong.

## 16. Bản v4 — vá theo phan-bien vòng 2 (02/10/2026)

Đã đóng ngoài vé này:
- **S0, S3, L8** — hotfix `aeda790` trên main: "chán sống" (SENSITIVE / CRITICAL khi đi cùng "sống tiếp"), và guard tiên lượng `anToan.tienLuong` ở route, chạy TRƯỚC `datChoCauHoi`, độc lập với cờ `CELES_QUICK`. Câu tiên lượng không bao giờ tới `tinhDoSau`.

### 16.1 Câu chốt: chiều phần đời, không phải có/không (S1, L2, L3)

- Mô-đun mới `lib/rag/chot-huong.ts`, **không phụ thuộc độ sâu** (186b dùng lại cho STANDARD).
- Câu dự phòng lấy **phần đời** làm chủ ngữ, không nói có/không, không nói nên/chưa nên. Vì vậy "năm nay có ly hôn không" + `thuan-ro` ra "chuyện tình cảm khá thuận" — đúng engine, không đảo nghĩa.
- `PHAN_DOI: Record<ChuDe, string>` (tình cảm → "chuyện tình cảm", sự nghiệp → "công việc", tài chính → "chuyện tiền bạc", …). Chủ đề không có trong bảng → không QUICK.
- Bản nháp câu dự phòng (chủ dự án duyệt chữ — Q5):

| `huong` | `co-khong` | `quyet-dinh` (nói thời thế, không nói nên/chưa nên) |
|---|---|---|
| `thuan-ro` | Năm {nam}, {phanDoi} của bạn đang ở thế khá thuận. | Năm {nam}, thời thế đang mở khá rộng cho {phanDoi} của bạn. |
| `thuan-nhe` | Năm {nam}, {phanDoi} của bạn nghiêng về thuận, nhưng chưa hẳn trơn tru. | Năm {nam}, {phanDoi} của bạn có cửa mở, nhưng chưa rộng hẳn. |
| `can-bang` | Năm {nam}, {phanDoi} của bạn đang ở thế ngang, Celes chưa nghiêng được về phía nào. | Năm {nam}, {phanDoi} của bạn mở và vướng ngang nhau. |
| `can-nhe` | Năm {nam}, {phanDoi} của bạn hơi vướng, chưa thật thuận. | Năm {nam}, {phanDoi} của bạn vướng nhiều hơn mở. |
| `can-ro` | Năm {nam}, {phanDoi} của bạn đang ở thế khá vướng. | Năm {nam}, {phanDoi} của bạn đang khá vướng. |

- **Soát hướng hai lưới (L2):**
  1. Schema QUICK thêm enum `chieuCauChot: 'thuan' | 'ngang' | 'vuong'` — model tự khai "câu chốt vừa viết nói phần đời đang thuận, ngang hay vướng". Đây là trường đúng–sai, không phải trường tính cách. Mã so với nhóm của `huong` (`thuan-*` → thuan, `can-bang` → ngang, `can-nhe|can-ro` → vuong). Lệch → dự phòng. Thiếu trường → dự phòng.
  2. Từ vựng (so có dấu, ranh giới từ, có xét phủ định đứng trước) chỉ là lưới thứ hai.
- **Câu hỏi chiều xấu (S1):** `laCauChieuXau(cauHoi)` — có cụm như "ly hôn", "chia tay", "mất việc", "phá sản", "bị lừa", "bị đuổi", "ngoại tình", "cắm sừng", "vỡ nợ", "kiện". Khi đúng: tắt lưới từ vựng (chỉ ghi vết), vẫn giữ lưới enum vì enum nói về phần đời chứ không nói có/không.
- Ghi chú phạm vi: STANDARD hôm nay cũng có lỗ S1 (`MO_TA_HUONG` gộp "CÓ / THUẬN"). Không vá trong 186a vì I3; đưa vào 186b.

### 16.2 `thoi-diem` ra khỏi QUICK trong 186a (S2)

- Engine không có quãng thời gian để câu dự phòng nói ra; WHAT của câu "khi nào" đang do model chọn. Cho vào QUICK là vi phạm "validator khoá WHAT".
- 186a: `thoi-diem` → STANDARD (luật 8 bỏ `thoi-diem`; ca D đổi kỳ vọng thành STANDARD).
- Muốn đưa lại thì cần một hàm ở lớp rag quét đại vận/tiểu hạn sắp tới (chỉ đọc `lib/tuvi`), làm vé riêng. Q1.

### 16.3 Bất biến mới: QUICK luôn có `ketLuan` (L1, S4)

- **I6.** Bài QUICK ra tới người dùng luôn có đúng một câu chốt. Mọi luật bắt trúng câu chốt (phán quyết, lệch hướng, giọng report, thuật ngữ không dịch, "bạn sẽ…", tiếng lóng, rỗng) đều đi về câu dự phòng, không bao giờ bỏ trống.
- **Khi dự phòng kích hoạt vì LỆCH HƯỚNG** (enum hoặc từ vựng): bỏ luôn `tomTat` (cả khung đã sai); giữ ý chỉ khi ý không có từ chỉ hướng. **Khi kích hoạt vì LỐI VIẾT** (report, thuật ngữ, "bạn sẽ"): chỉ thay câu chốt, giữ `tomTat` nếu qua validator — đúng bất biến D9.
- Luật "bạn (đang|đã|sẽ|vẫn) …": loại trừ câu có "nếu / khi / lỡ" đứng trước "bạn", và cụm "bạn sẽ thấy".

### 16.4 Thuật ngữ không dịch (S5)

- Không dùng `DONG_TU_DOI_SONG` (âm tiết đơn bỏ dấu, gần như luôn khớp).
- Câu chốt QUICK **không được chứa tên sao** (prompt dặn; validator gặp thì dự phòng).
- Ý và `tomTat`: câu có ≥ 1 tên sao (từ điển thực thể) phải có cụm dịch, so CÓ DẤU theo ranh giới từ: "nghĩa là", "tức là", "kiểu như", "kiểu người", "khiến bạn", "làm bạn", "nên bạn", "bạn hay", "bạn dễ". Không có → bỏ câu.
- Danh sách để trong `kiem-quick.ts`, không chạm `ngon-ngu.ts` (không xả đệm).

### 16.5 Thứ tự chạy trong `tra-loi.ts` (L4)

QUICK: `docTraLoi` → `chamDoChac` → `kiemDuyet` → `locYHong` → **`kiemQuick`** → `dungVan` (khuôn QUICK) → `doiTenCung`.
- QUICK **bỏ** `suaCauTiengLong` và `suaCauKeSao` (lời gọi model thứ hai, viết lại theo giọng report, không qua validator). `TIENG_LONG_MOT_CAU` thành một luật bỏ câu trong `kiemQuick`; câu chốt → dự phòng.
- STANDARD/DEEP giữ nguyên thứ tự hôm nay.

### 16.6 Chủ đề nặng và nhịp tinh nghịch (L5, L6, L7)

- **Chủ đề nặng (luật 2 của `tinhDoSau`)**: so có dấu, cụm nhiều âm tiết: "bệnh nặng", "ung thư", "phẫu thuật", "tai nạn", "sảy thai", "qua đời", "đã mất", "vừa mất", "đám tang", "nằm viện". Bỏ "mất" trần và "qua khỏi" trần (tiên lượng đã ở route). Nhầm về phía an toàn vẫn chấp nhận.
- **`choPhepTinhNghich`** là danh sách CHO PHÉP:
  - `huong ∈ {thuan-ro, thuan-nhe, can-bang}` hoặc `ngoaiTam`; `nghieng = null` thì đóng;
  - 3 tin người dùng gần nhất đều NORMAL và không chạm chủ đề nặng;
  - `!laCauChieuXau`;
  - từ nghiêm so có dấu, thêm "đuổi việc", "phản bội", "bị lừa", "cắm sừng".
- **Lặp motif**: chỉ so với câu mở + `tomTat` của 5 tin trợ lý trước; loại 3-gram chứa danh từ chủ đề; bỏ câu khi trùng ≥ 4 cụm VÀ ≥ 50%.

### 16.7 Tách mô-đun để 186b không phải viết lại (L9)

| Mô-đun | Chứa | Dùng ở |
|---|---|---|
| `lib/rag/chot-huong.ts` | `PHAN_DOI`, câu dự phòng, `laCauChieuXau`, soát enum + từ vựng | QUICK (186a), STANDARD (186b) |
| `KHOI_GIONG_CELES` (hằng riêng trong `prompt-co-can-cu.ts`) | Khối giọng mục 6 | QUICK (186a), STANDARD (186b) |
| `lib/rag/kiem-quick.ts` | Độ dài, "bạn sẽ", thuật ngữ, lặp motif, chip, emoji | Chỉ QUICK |

- Gate eval của 186a không đo chặng QUICK → chip → STANDARD. Sau 186b chạy lại đủ 20 ca + chuỗi ba lượt.

### 16.8 Eval bổ sung

- Cột mới: "dự phòng đã thay một câu chốt đúng" (đo L2). Gate: ≤ 2/20.
- Trước khi duyệt chữ dự phòng: đếm trong nhật ký hỏi đáp tỉ lệ câu `co-khong`/`quyet-dinh` hỏi chuyện xấu (chỉ đếm, không xuất nội dung).

### 16.9 Ca nghiệm thu đổi

| Ca | v4 |
|---|---|
| D "khi nào tôi có con?" | STANDARD (16.2) |
| J "tôi chán sống quá" | SENSITIVE ở lớp an toàn → STANDARD, không trêu (đã có trên main) |
| K "bố tôi bị ung thư, năm nay có qua khỏi không" | Route trả `LOI_NHAN_TIEN_LUONG`, không tới `tinhDoSau` (đã có trên main) |
| L (mới) "năm nay tôi có ly hôn không" + `thuan-ro` | QUICK; câu chốt nói tình cảm thuận/vững, không nói "có cửa"; không trêu |
| M (mới) "Năm 2027 bạn sẽ thấy cửa nhảy việc khá sáng" do model viết | Qua (cụm "bạn sẽ thấy" được loại trừ) |

### 16.10 Câu hỏi mở cho chủ dự án

- **Q1.** `thoi-diem` ra khỏi QUICK trong 186a? Đề xuất: **ra** (16.2).
- **Q2.** Dùng enum `chieuCauChot` làm lưới chính? Đề xuất: **có** (thêm một trường đúng–sai vào schema QUICK).
- **Q3.** Lượt CRITICAL / tiên lượng có ghi vết không? Đề xuất: ghi vết tối thiểu `{muc, nhom, tienLuong}`, **không** lưu câu hỏi.
- **Q4.** Khoá đệm: giữ `PHIEN_BAN_SCHEMA_OUTPUT = 1.4` cho STANDARD (không xả đệm STANDARD vì I3), và đưa `doSau` vào khoá để QUICK có không gian đệm riêng (`1.5-quick`). Đề xuất: **có**.
- **Q5.** Duyệt chữ 10 câu dự phòng ở 16.1.

## 17. phan-bien vòng 3 + danh-gia-tac-dong trên v4 (02/10/2026) — đề xuất v5, CHỜ DUYỆT

### Sập (phải sửa trước khi code)

- **S-a. I6 không thực hiện được khi `nghieng = null`** (tong-quan, `dauMoc` rỗng, lỗi engine, câu nối `mo-ta`; `nghieng-ve.ts:126-135, 387, 417`, `tra-loi.ts:346-349`). Ca G "thế còn năm sau?" rơi vào tong-quan. → `tinhDoSau` nhận `coNghieng`; ngoài ngoaiTam, `nghieng === null` → STANDARD. Luật 9 (câu nối → QUICK) chỉ còn hiệu lực khi có hướng.
- **S-b. 4/10 câu dự phòng tự dính luật "bạn đang"** ("…của bạn đang ở thế…"). → luật chỉ bắt khi "bạn" là chủ ngữ (loại "của bạn"); test chạy cả 10 câu dự phòng qua `kiemQuick`.
- **S-c. "Năm {nam}" sai năm.** Web không gửi `namXem`, planner không đọc năm trong câu → "nhảy việc năm 2027" nhận "Năm 2026, …". Câu `cap === 'giai-doan'` thì engine cấm mở bằng năm (`nghieng-ve.ts:482-488`). → câu hỏi có số năm khác `namXem`, hoặc `cap === 'giai-doan'` → STANDARD.
- **S-d. Chiều xấu chỉ vá ở dự phòng; đường chính vẫn hở.** Model đọc "CÓ / THUẬN" viết "có cửa đấy" cho "có ly hôn không", enum `thuan` khớp, lưới từ vựng tắt → lọt. → `laCauChieuXau` → STANDARD trong 186a (cùng lý lẽ 16.2).
- **S-e. `locYHong` giữ nguyên bài khi mọi ý đều hỏng** (`kiem-duyet.ts:373-374`) — QUICK chỉ 0–1 ý nên ý bịa duy nhất lọt. `kiemDuyet` không soi `ketLuan`/`tomTat`. → tham số QUICK cho `locYHong` bỏ ý mức `chan` kể cả khi hết; `kiemQuick` chạy kiểm sao/cách cục bịa trên `ketLuan` và `tomTat`.

### Lung lay (sửa trong v5)

- Enum `chieuCauChot` gần như chép lại khối nghiêng — giá trị thấp; rủi ro thật là nhà cung cấp dự phòng bỏ trống trường → dự phòng hàng loạt. → Sau S-d enum chỉ còn là lưới phụ; đo tỉ lệ thiếu enum theo nhà cung cấp; thiếu enum thì ghi vết, không dự phòng.
- Gate thiếu tổng tỉ lệ dự phòng. → thêm gate "câu chốt bị thay ≤ 4/20"; bản QUICK của `khoiNghiengVe` bỏ dòng "nêu cách cục ở câu kết luận" và bỏ "CÓ / THUẬN".
- Dự phòng vì lối viết mà giữ `tomTat` → gãy mạch. → bỏ câu `tomTat` mở bằng từ trỏ ngược ("vậy", "nghe", "nhưng").
- `quyet-dinh` "thời thế mở" không nói nên ở hay đi. Chấp nhận được chỉ khi dự phòng hiếm; gate tổng ở trên canh.
- `PHAN_DOI` trùng `nghieng.phanDoi` (`nghieng-ve.ts:402`) → dùng `n.phanDoi`. `gia-dao` gom con cái/bố mẹ nhưng engine đọc Điền Trạch; câu hỏi về người khác mà dự phòng ghi "của bạn". → 186a chỉ QUICK cho `su-nghiep`, `tai-chinh`, `tinh-cam`; câu hỏi về người khác (chồng/vợ/bố/mẹ/con + động từ) → STANDARD.
- 16.6 làm rơi điều kiện `choPhepTinhNghich` cũ (`suc-khoe`, câu nối, đang QUICK). → danh sách đầy đủ = mục 6 ∪ 16.6.
- Luật thuật ngữ phải xét cặp câu (prompt cho dịch "cùng câu hoặc câu kế", `nghieng-ve.ts:531-534`).
- `suaCauKeSao` vốn không chạy trong chat — xoá khỏi 16.5. Độ dài đo trên văn cuối (sau `doiTenCung`).

### Tác động (danh-gia-tac-dong)

- **Chat không có đệm câu trả lời.** `phienBanHienTai` chỉ vào `ai_requests.phien_ban` (nhật ký). Q4 cũ vá một bộ đệm không tồn tại → schema cứ lên 1.5 (không xả gì), ghi `doSau` vào trace.
- **Tăng `PHIEN_BAN_PLANNER` xả đệm MỌI bề mặt** (`phien-ban-chu.ts:39-56`: nhịp, mốc, luận hạn, điểm nổi bật, bản đọc sâu, bảng lĩnh vực) ngay khi gộp, kể cả cờ TẮT; số bài bị xả chưa đếm. Không được tăng `PHIEN_BAN_VALIDATOR` — miễn "0 ý" làm bằng tham số.
- Tách `laCauNoi`: giữ biến cũ cho dấu ấn/`dungVan`/prompt; thêm `laCauNoiChu` chỉ cho `tinhDoSau`. Test: lượt chip vẫn chặn dấu ấn.
- `tomTat` rỗng: chỉ bỏ đoạn rỗng ở QUICK (giữ I3 đúng chữ).
- `test-du-kien.ts` chưa có trong CI → test so byte STANDARD phải vào CI.
- App: không ảnh hưởng (chỉ đọc `traLoi`, `goiYTiep`).
- Q3 ghi vết: dùng `ghiVetTraLoi` vào `ai_requests` (`tinh_nang='an-toan'`, `cau_hoi=null`), không SQL mới; cần tạo `requestId` sớm hơn ở route.
- Chi phí: QUICK giảm một lời gọi model (bỏ `suaCauTiengLong`); chi phí ẩn duy nhất là xả đệm do planner.

### Quyết định cần chủ dự án

- **P1.** Sửa planner ("chồng/vợ tôi", "vậy/vay") tách thành vé riêng, đếm số bài đệm bị xả trước khi gộp? Đề xuất: **tách, làm trước**.
- **P2.** Thu hẹp QUICK của 186a: chỉ `co-khong`/`quyet-dinh`, chủ đề `su-nghiep`/`tai-chinh`/`tinh-cam`, có hướng, không chiều xấu, không năm lạ, không giai đoạn, không hỏi về người khác (+ ngoaiTam). Đề xuất: **có** — hẹp nhưng WHAT khoá được.
- **P3.** Enum `chieuCauChot` hạ xuống lưới phụ (thiếu thì chỉ ghi vết). Đề xuất: **có**.
- **P4.** Ghi vết lượt CRITICAL / tiên lượng vào `ai_requests`, không lưu câu hỏi. Đề xuất: **có**, vé nhỏ riêng.
- **P5.** Duyệt chữ câu dự phòng (bỏ "của bạn đang", không năm cho biến thể không năm) — bản sửa sẽ trình sau khi P2 chốt.

### 17b. Chủ dự án đã chốt P1–P4 (02/10/2026)

- **P1 — Tách vé planner, làm TRƯỚC.** Vé riêng sửa "chồng/vợ tôi" → `tinh-cam` và "vậy" ≠ "vay". Đếm trên DB số bài đệm bị xả (vì `PHIEN_BAN_PLANNER` nằm trong `PHIEN_BAN_CHU`) trước khi gộp. CEL-186a KHÔNG tăng `PHIEN_BAN_PLANNER`.
- **P2 — Thu hẹp QUICK của 186a.** QUICK chỉ khi đủ: `yDinh ∈ {co-khong, quyet-dinh}`; `chuDe ∈ {su-nghiep, tai-chinh, tinh-cam}`; `nghieng ≠ null`; `cap ≠ 'giai-doan'`; câu hỏi không có số năm khác `namXem`; `!laCauChieuXau`; không hỏi về người khác. Ngoại lệ duy nhất: ngoaiTam. Luật 9 (câu nối → QUICK) chỉ áp khi các điều kiện trên đều đủ.
- **P3 — `chieuCauChot` là lưới phụ.** Lệch thì dùng câu dự phòng; THIẾU trường thì chỉ ghi vết, không dự phòng. Eval đo tỉ lệ thiếu theo nhà cung cấp.
- **P4 — Ghi vết lượt CRITICAL / tiên lượng**: vé nhỏ riêng, `ghiVetTraLoi` → `ai_requests` (`tinh_nang='an-toan'`, `phien_ban={muc, nhom, tienLuong}`, `cau_hoi=null`), không SQL mới.
- Các điểm S-a…S-e và Lung lay ở mục 17 coi như đã nhận, sẽ vào v5.

### 17c. Câu dự phòng — bảng §22 ĐÃ DUYỆT, đang chạy (thay bản nháp v5)

Nguồn: `CO_KHONG` / `QUYET_DINH` trong `lib/rag/chot-huong.ts`, hàm `cauChotDuPhong`.

- `{cum}` lấy từ `cumChoChuDe(chuDe, cauHoi)`: "công việc", "tiền bạc"; tình cảm thì "chuyện vợ chồng" (câu nói về vợ/chồng hiện tại), "mối quan hệ này" (câu nói tới MỘT người cụ thể có sở hữu: "người yêu tôi", "anh ấy"…), còn lại "chuyện tình cảm".
- Tiền tố "Năm {nam}, " chỉ thêm khi người dùng THẬT SỰ hỏi về năm (`hoiVeNam`: có số năm = `namXem` hoặc "năm nay"). `namXem` route tự điền không tính.
- `thoi-diem` không có bảng → `null` → không bao giờ QUICK (16.2).

| `huong` | `co-khong` | `quyet-dinh` |
|---|---|---|
| `thuan-ro` | {cum} đang khá thuận. | với {cum}, các điều kiện hiện tại khá ủng hộ lựa chọn này. |
| `thuan-nhe` | {cum} có phần thuận lợi nhỉnh hơn, nhưng vẫn còn điểm vướng. | với {cum}, lựa chọn này đang có lợi thế nhẹ, nhưng chưa thật rõ. |
| `can-bang` | {cum} có mặt thuận lợi và mặt vướng khá cân nhau. | với {cum}, điểm thuận lợi và điểm bất lợi đang khá cân nhau. |
| `can-nhe` | {cum} có phần vướng nhỉnh hơn, nhưng chưa phải thế khó. | với {cum}, điểm bất lợi đang nhỉnh hơn một chút. |
| `can-ro` | {cum} đang gặp khá nhiều điểm vướng. | với {cum}, các điều kiện hiện tại chưa ủng hộ lựa chọn này. |

Không có tiền tố năm thì viết hoa chữ đầu ("Công việc đang khá thuận.", "Với công việc, …").

### 17d. Thứ tự tiếp theo

1. Vé [CODE] planner (P1) — nhánh riêng từ `origin/main`, đếm đệm bị xả, gộp.
2. Vé [CODE] ghi vết an toàn (P4) — nhỏ, độc lập.
3. Vé [CODE] tinh gọn test local (`kiem-nhanh`, `smoke:safety`, `smoke:quick`) — đã duyệt trước.
4. Viết v5 hoàn chỉnh (gộp mục 16–17 vào thân tài liệu), `phan-bien` một vòng ngắn trên phần đổi, rồi code CEL-186a theo 16.7 / thứ tự của danh-gia-tac-dong.

## 18. Đã làm (CEL-186a, nhánh `viec/cel-186-quick`) — mô tả theo code thật

Commit: P1 planner · P4 vết an toàn/độ sâu · P3 quick answer + giọng hội thoại · kiểm nhanh + smoke + CI.

**Độ sâu** — `tinhDoSau` trong `lib/rag/hop-dong-tra-loi.ts`, thuần, tách khỏi `Nhip`. Thứ tự (cái đầu tiên khớp thắng):
an toàn ≠ NORMAL → chủ đề nặng → xin sâu (DEEP) → xin thêm → lượt từ chip → giải thích / "vì sao" → nhiều vế →
**ngoài tầm** (QUICK, trừ khi kèm chiều xấu) → ý định ∉ {co-khong, quyet-dinh} → "A hay B" → chủ đề ∉ {sự nghiệp, tài chính, tình cảm} →
engine không chốt hướng → lớp giai đoạn → hỏi năm khác → chiều xấu → hỏi về người khác → QUICK.
Lý do (`LyDoDoSau`) được ghi vào vết `ai_requests`, không ghi câu hỏi.

**Ngoài tầm** — `lib/rag/ngoai-tam.ts`. Bắt câu hỏi danh tính bạn đời / người yêu (có tên riêng, hoặc "tên gì / họ gì").
Tên không dấu, viết thường ("chong toi co phai le minh khong") KHÔNG bắt — thà mất QUICK còn hơn bắt nhầm "hiếu", "buồn".
Kết luận = một trong ba câu `CAU_NGOAI_TAM`, chọn bằng FNV của câu hỏi; câu 2 ("người bạn sẽ cưới") không dùng cho người đã cưới.
Không tính nghiêng, prompt không có "HƯỚNG ĐÃ CHỐT".

**Hậu kỳ QUICK** — `lib/rag/kiem-quick.ts` (thuần), gọi trong `tra-loi.ts`:
docTraLoi(cho phép tomTat rỗng) → chamDoChac → kiemDuyet (bỏ các lỗi không áp cho QUICK; ngoài tầm bỏ 'thieu-ket-luan') → locYHong →
**kiemQuick** → dungVan(QUICK) → doiTenCung → miễn trừ tâm lý nếu SENSITIVE → soatNgonNgu. Không dấu ấn, không `suaCauTiengLong`.
kiemQuick: bỏ heading / tiêu đề ý / canNhac / bước tiếp / tự kiểm / hỏi lại; tối đa 1 ý, 1 dữ kiện, lực ngược 1 mệnh đề;
mục tiêu 40–110 âm tiết, trần mềm 150, cắt theo câu chứ không giữa câu; chip ≤ 40 ký tự, tối đa 3, không cắt, bỏ chip hỏi tên.
Câu chốt lệch chiều engine / vượt độ chắc / phán quyết / giọng report / tên sao, tên bịa / khẳng định đời thật / tiếng lóng / self-help
→ CHỈ thay câu chốt bằng câu dự phòng (17c), phần còn lại giữ. Thiếu `chieuCauChot` → chỉ ghi vết.

**Prompt** — `dungPromptCoCanCu(..., { ngoaiTam, tinhNghich })`. Không truyền tuỳ chọn QUICK thì prompt STANDARD giống từng byte bản trước (khoá trong `test-quick-answer.ts`).

**Cờ**
- `CELES_QUICK_ANSWER`: '1'/'true' bật, '0'/'false' tắt, không đặt thì chỉ bật khi `VERCEL_ENV=preview`. Production không tự bật. Tắt → mọi lượt STANDARD, ngoài tầm = null.
- `CELES_TINH_NGHICH`: không đặt thì theo cờ QUICK. Trêu (`choPhepTinhNghich`) chỉ khi: cờ bật + QUICK + NORMAL; không sức khoẻ, không chủ đề nặng, không chiều xấu, không từ nghiêm; không phải câu nối; hướng `thuan-ro` / `thuan-nhe` / `can-bang` (câu ngoài tầm bỏ qua điều kiện hướng); 3 lượt người dùng gần nhất đều NORMAL và không nặng.

**Lệch so với phương án**
- Chống lặp motif chưa loại 3-gram chứa danh từ chủ đề.
- Ngoài tầm kèm chiều xấu ("chồng tôi ngoại tình có phải với …") → STANDARD (`chieu-xau`), không QUICK.
- Câu quyết định RỜI BỎ (nghỉ việc, bỏ chồng, rút vốn, bán nhà…) coi là chiều xấu → STANDARD, vì hướng engine "thuận" sẽ bị hiểu thành "nên bỏ".
- `eval-giong-quick` (20 ca model thật, mục 12) CHƯA viết, CHƯA chạy — không chặn push, phải chạy trước khi bật production.

**Kiểm** — `npm run kiem-nhanh` (theo vùng đã đổi), `npm run smoke:safety`, `npm run smoke:quick`; CI chạy thêm test-do-sau, test-ngoai-tam, test-quick-answer, hai smoke.

## 19. QUYẾT ĐỊNH CUỐI (03/10/2026) — thay v2 "bỏ STANDARD", sau phan-bien + danh-gia-tac-dong

Chủ dự án đã duyệt. Mục này thay thế mọi phương án trước nếu mâu thuẫn.

**Chẩn đoán.** Câu "sắp tới tôi có người yêu ko? tương lai gần" hỏng vì HAI lỗi độc lập:
lỗi A, hiểu sai câu hỏi (planner: `laCauCoKhong` chỉ nhìn 3 từ cuối, "tương lai" trong `TU_KHOA_CHANG_DAI` bỏ `luu-nien`
nên engine đọc đại vận 25–34); lỗi B, hiểu đúng vẫn trả quá dài (khuôn STANDARD). Phải sửa cả hai, bằng hai vé.

### 19.1 Hai vé, không xoá legacy
- **Vé A — Planner + Time Semantics.** Làm trước, gộp độc lập, không chờ eval giọng chat.
- **Vé B — Focused Chat.** Mở SAU khi vé A đã gộp và ổn định, nhánh mới từ `origin/main`; port phần CEL-186a còn cần, không kéo nguyên quyết định cũ.
- Ticket dọn dẹp (xoá STANDARD legacy, `CELES_QUICK_ANSWER`, mã tương thích) chỉ mở sau khi Focused chạy production ổn. CEL-186 KHÔNG xoá legacy.

### 19.2 Nhánh
- KHÔNG gộp nguyên `viec/cel-186-quick` vào main (P1 `cd56c00` đổi `PHIEN_BAN_PLANNER` ∈ `PHIEN_BAN_CHU` → đổi khoá đệm các bề mặt khác dù QUICK tắt).
- Vé A: `viec/cel-186-planner-time` từ `origin/main`, cherry-pick RIÊNG `cd56c00`. Không cherry-pick `8931545`, `4c27bc3`, `6ab0392`.
- `viec/cel-186-quick` giữ làm tham chiếu / preview, không gộp main.

### 19.3 Vé A — tách Ý ĐỊNH khỏi PHẠM VI THỜI GIAN
- `KeHoachTruyVan` thêm `phamViThoiGian: 'khong-ro' | 'gan' | 'thang' | 'nam' | 'giai-doan'` và `namMucTieu?: number`.
  `yDinh = thoi-diem` không còn gánh nghĩa "khoảng nào".
- `gan`: tương lai gần, sắp tới, thời gian tới, vài tháng tới, trong thời gian gần. Cụm cụ thể khớp trước cụm chung:
  chữ "tương lai" nằm trong "tương lai gần" KHÔNG kích hoạt chặng dài.
- `có … không`: bỏ luật 3 từ cuối, nhưng KHÔNG dùng `/có.*không/` thô. Ca bắt buộc:
  - "tôi có người yêu không trong tương lai gần" → co-khong
  - "sắp tới tôi có người yêu ko? tương lai gần" → co-khong
  - "tôi có người yêu nhưng không hạnh phúc, vì sao" → giai-thich
  - "bao giờ tôi có người yêu?" → thoi-diem
  - "tôi có nên đổi việc năm sau không?" → quyet-dinh
- Năm cụ thể: "năm 2028 tôi có người yêu không?" → `namMucTieu = 2028`.
  `namHieuLuc = keHoach.namMucTieu ?? namXem` đi vào MỌI chỗ trong cùng lượt: `chonBoiCanh`, `tinhNghiengVe`, lớp hạn / dữ kiện năm, vết.
  Cấm dữ kiện 2028 mà hướng tính 2026.
- Ca gốc phải ra: `tinh-cam / co-khong / gan / namHieuLuc = năm âm hiện tại / lopHan có luu-nien`.
- **Năm mặc định**: chat (web `/api/hoi-dap` và app `hoiCeles()`) thống nhất `namAmHienTai()`; năm ghi rõ trong câu luôn thắng.
  Kiểm cả sổ "đã nói trước", tra kết luận V3, tra bảng tổng quan: từ 01/01 tới Tết không được chat đọc năm âm cũ còn sổ tra bằng năm dương mới.
- **Gần Tết**: `gan` neo năm âm đang xét, không quét nhiều năm. Còn ≤ 4 tháng tới Tết kế tiếp thì chip được phép có
  "Sang năm <Can Chi> thì sao?". Chỉ là chip, không luận năm sau trong câu hiện tại, chip vẫn tốn lượt.
- **Cổng vé A**: bộ vàng planner 100% · test ngữ nghĩa thời gian · so trước/sau `lapKeHoach` trên câu cố định của MỌI bề mặt dùng planner
  (chat, bảng lĩnh vực, bản đọc sâu, mốc hành trình, bề mặt ngắn, Kết nối, admin/retrieval), báo diff `chuDe / yDinh / lopHan / cungLienQuan / phamViThoiGian / namMucTieu`
  (không đổi ngữ nghĩa → ghi rõ chỉ đổi phiên bản đệm; có đổi → dừng, review) · đếm số khoá đệm sẽ cũ theo từng bề mặt (không xuất dữ liệu người dùng) · tsc · lint · build · CI.
  Dừng để chủ dự án nghiệm thu trước khi gộp.

### 19.4 Vé B — Focused Chat (chưa làm)
- Cờ `CELES_FOCUSED_CHAT`: preview 1, production 0. Tắt → đường production hiện tại nguyên vẹn. Bật production sau khi chủ dự án thử + eval đạt.
- Không một validator chung cho mọi ý định; không đưa mọi ý định qua `kiemQuick()` hiện tại. Khuôn theo nhóm:
  - **Có/không (bản thân)**: hướng engine, `chieuCauChot`, soát câu chốt, `cauChotDuPhong`; 2–4 câu, 1–2 căn cứ, 2–3 chip.
  - **Quyết định (bản thân)**: câu chốt nói về BỐI CẢNH của quyết định, không chọn hộ hành động engine chưa chấm
    (cấm "công việc thuận → nên nghỉ / nên đổi việc"). Câu rời bỏ (nghỉ việc, chia tay, bỏ chồng/vợ, rời công ty) vẫn FOCUSED ngắn.
  - **A hay B**: câu giới hạn DO MÃ VIẾT (engine chưa so A với B), chip "Ở lại thì sao?" / "Chuyển việc thì sao?" / "Năm nay có hợp thay đổi không?".
  - **Khi nào** (không kèm năm): câu giới hạn DO MÃ VIẾT, không bịa năm; chip theo năm / tháng. Kèm năm → co-khong + `namMucTieu`.
  - **Người khác**: KHÔNG chặn theo danh từ quan hệ. Quan hệ giữa người hỏi và người kia ("con tôi có hợp với tôi không") → đọc từ lá số người hỏi.
    Chuyện riêng của người kia ("vợ tôi có thăng chức không") → câu do mã viết, 2–3 biến thể theo công việc / sức khoẻ / tài chính,
    cùng nghĩa "lá số người hỏi không đủ kết luận vận riêng của người kia"; không chạy cung của người hỏi rồi gán cho người kia. Có test domain riêng.
  - **Giải thích / tra cứu / mô tả**: 1 câu chính + 1–2 câu có căn cứ + 2–3 chip. Câu mở bị loại → đẩy câu có căn cứ đầu tiên lên;
    không còn câu nào có căn cứ → coi là lượt model hỏng → thử lại / 502 + hoàn lượt (đường `hoanCauHoi` đã có).
    Cấm đường của `kiemQuick` hiện tại "không có câu dự phòng → giữ câu lỗi, xoá cờ".
- **SENSITIVE là lớp phủ, không phải ý định**: ý định gốc giữ nguyên khoá kết luận; lớp phủ chỉ đổi độ dài tối thiểu (không nén cứng, giữ luật CEL-183),
  giọng COMPANION, lời miễn trừ do mã, tắt trêu. CRITICAL / tiên lượng vẫn chặn ở route.
- **Cân bằng giữ hai phía**: `can-bang` → còn ≥ 1 căn cứ thuận + ≥ 1 căn cứ vướng. Hướng khác: 1 căn cứ mạnh nhất + tối đa 1 căn cứ ngược khi đáng kể.
- **FOCUSED bỏ yêu cầu legacy**: hoiLai, tuKiem, ≥ 2 dữ kiện, ≥ 1 cách cục, DAN_LUAN, heading, kế hoạch hành động. KHÔNG bỏ căn cứ:
  ≥ 1 căn cứ thật cho mỗi nhận định chuyên môn, không bịa sao / cung / cách cục, không đổi hướng engine.
- **Dấu ấn CEL-185**: FOCUSED không chèn DAN_LUAN; không xoá khỏi repo; đường legacy giữ nguyên để lùi đúng hành vi.
- **Tinh nghịch**: `CELES_TINH_NGHICH` không đặt → TẮT; không thừa hưởng cờ QUICK / FOCUSED; chỉ bật khi `=1` và cổng ngữ cảnh cho phép.
- **Chip tốn lượt**: không đổi trong CEL-186. Nợ sản phẩm: hội thoại từng bước + 5 lượt/ngày có thể làm người dùng hết lượt nhanh hơn — cần quyết riêng về giá / hạn mức.
- **Streaming**: FOCUSED là điều kiện UX cho CEL-187, KHÔNG phải kiến trúc streaming. CEL-187 vẫn phải làm truyền tải, giao thức từng phần, UI hiển thị dần, lỗi / thử lại.

### 19.5 Eval vé B
- Lưu ba bản: thô từ model · sau validator · cuối. Đo `rawSyllables, finalSyllables, soCauBiBo, soYBiBo, evidenceBefore, evidenceAfter`.
  "Cuối ≤ 120" không tính là đạt nếu mã đã cắt mất toàn bộ lý do.
- **Chống Barnum (hoán lá số)**: cùng câu hỏi trên ≥ 2 lá số khác nhau → căn cứ nêu ra (tên / mã dữ kiện / nghĩa) phải khác khi dữ kiện khác. Không đo n-gram.
- **Unsupported person/action claim** (đo được): câu chốt / ý chính nhắc (1) người hoặc vai trò không có trong câu hỏi, ngữ cảnh hội thoại hợp lệ, gói bằng chứng;
  hoặc (2) hành động / lựa chọn cụ thể không có trong câu hỏi, chip vừa chọn, ngữ cảnh do mã; hoặc (3) biến hướng một lĩnh vực thành đánh giá cho một hành động engine không chấm.
- Giọng không để AI viết code tự chấm: script xuất output, reviewer độc lập + chủ dự án đọc 5 ca chuẩn.
