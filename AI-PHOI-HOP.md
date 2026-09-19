# Luật phối hợp cho AI

Đọc tệp này trước khi chạm vào bất cứ thứ gì. Sau đó đọc `AGENTS.md` để biết luật
kỹ thuật của dự án.

Celestia đang được phát triển bởi **hai AI trên hai máy khác nhau**, không nói
chuyện được với nhau, không thấy màn hình của nhau. Mọi luật dưới đây tồn tại vì
một lý do duy nhất: bạn không biết bên kia đang làm gì, nên phải hành xử sao cho
việc đó không quan trọng.

---

## 1. Bốn việc bắt buộc trước khi gõ dòng mã đầu tiên

```bash
git checkout main && git pull          # 1. lấy bản mới nhất
cat TRANG-THAI.md                      # 2. xem bên kia đang làm gì
npx tsx scripts/kiem-moi-truong.ts     # 3. xem máy này có đủ điều kiện chạy không
git checkout -b viec/<mo-ta-ngan>      # 4. sang nhánh riêng
```

Bỏ bước 1 thì bạn sửa trên bản cũ và sinh ra xung đột không cần thiết. Bỏ bước 2
thì bạn làm trùng việc bên kia đang làm dở. Bỏ bước 4 thì bạn phát hành thẳng ra
người dùng thật mà không ai duyệt.

Sau đó ghi một dòng vào `TRANG-THAI.md` mục "Đang làm", commit riêng, đẩy thẳng
lên `main`. Đó là cách duy nhất máy kia biết bạn đang động vào đâu.

---

## 2. Điều tuyệt đối không làm

- **Không commit thẳng lên `main`.** Ngoại lệ duy nhất: cập nhật `TRANG-THAI.md`.
- **Không `git push --force`** lên bất kỳ nhánh nào máy kia có thể đang dùng.
- **Không `git rebase` nhánh đã đẩy lên.** Nó viết lại lịch sử mà máy kia đã tải về.
- **Không sửa `.env.local`, không in nội dung nó ra, không đưa nó vào commit.**
- **Không chạy câu lệnh SQL phá huỷ.** Không `drop table`, `drop column`, `truncate`,
  `delete` không điều kiện, không đổi kiểu cột đang có dữ liệu. Hai máy có thể dùng
  chung một database, và bên kia không biết vì sao mã của họ đột nhiên hỏng.
- **Không xoá engine tất định trong `lib/tuvi/`.** Nó là đường lùi khi model hỏng
  hoặc hết hạn mức. Không có nó thì trang trắng.
- **Không tự đổi model trong `ai_model_configs`.** Chuỗi model là quyết định của
  chủ dự án, và đổi nó làm sai lệch mọi phép đo bên kia đang chạy.
- **Không tạo kho git mới, không đổi remote, không đổi chế độ công khai.**

---

## 3. Chia vùng làm việc

Mục đích: hai AI hiếm khi mở cùng một tệp.

| Vùng | Sở hữu | Thư mục |
|---|---|---|
| **A — Bộ não** | Đường luận giải, chất lượng chữ, model, kho tri thức | `lib/rag/`, `lib/ai/`, `app/api/`, `scripts/test-*` |
| **B — Mặt tiền** | Giao diện, bố cục, luồng bấm, chữ trên nút | `components/`, `app/` (trừ `app/api/`), `lib/i18n/` |
| **Chung** | Phải báo trước | `lib/tuvi/`, `AGENTS.md`, `package.json`, `supabase/` |

Trước khi sửa tệp thuộc vùng **Chung**, ghi vào `TRANG-THAI.md` rồi đẩy dòng ghi
đó lên `main` trước. Ba tệp đụng độ nhiều nhất:

- `lib/tuvi/quick-read-noi-dung.ts` — hơn 1000 dòng, là kho câu chữ của mọi bề mặt
- `lib/i18n/vi.ts` và `lib/i18n/en.ts` — mọi tính năng mới đều thêm chữ vào đây

Cần sửa tệp của vùng kia thì vẫn được, nhưng sửa **ít nhất có thể** và nói rõ
trong commit vì sao phải sang đó.

---

## 4. Trước khi đẩy lên: bốn cổng

Chạy đủ bốn, không bỏ cổng nào:

```bash
npx tsc --noEmit                        # phải sạch
npx eslint .                            # phải đúng 7 lỗi, không hơn
npx tsx scripts/test-rag-planner.ts     # phải "TẤT CẢ ĐỀU ĐÚNG"
npx tsx scripts/test-chuan-ngon-ngu.ts  # phải "TẤT CẢ ĐỀU ĐÚNG"
npx next build                          # phải "Compiled successfully"
```

**Mốc 7 lỗi eslint là cố ý.** Đó là 7 cảnh báo `react-hooks/set-state-in-effect`
đã tồn tại từ trước và đã được cân nhắc. Con số lên 8 nghĩa là bạn vừa thêm một
lỗi mới — sửa nó, đừng nâng mốc.

Nếu có động vào phần AI viết chữ, chạy thêm:

```bash
npx tsx scripts/test-be-mat-ai.ts       # gọi model thật, tốn tiền
```

Bài kiểm này gọi model nên kết quả dao động giữa các lần chạy. Một mục đỏ lẻ tẻ
là bình thường; đỏ lặp lại ở cùng một mục thì là lỗi thật.

---

## 5. Commit và bàn giao

Commit viết bằng tiếng Việt **không dấu** (git trên Windows hiển thị hỏng). Dòng
đầu nói việc đã làm, thân bài nói **vì sao**, không nói lại cái diff đã nói:

```
Bo khuon "moi du kien mot cau" o bang luan giai

Ban cu phat lan luot mot cau cho moi slot theo thu tu co dinh, khoi nao cung
vay. Doc den khoi thu hai la doan duoc khoi thu ba noi gi o dong nao.
```

Xong việc thì:

1. Cập nhật `PRODUCT-BACKLOG.xlsx` **trong cùng commit đó** — xem mục 5b ngay dưới.
2. `git push -u origin viec/<ten>` — Vercel tự dựng bản xem thử.
3. Chuyển dòng trong `TRANG-THAI.md` từ "Đang làm" xuống "Vừa xong", kèm mã commit.
4. Báo cho chủ dự án link bản xem thử. **Không tự gộp vào `main`.** Việc gộp là
   quyết định của con người.

### 5b. Cập nhật bản theo dõi tính năng

`PRODUCT-BACKLOG.xlsx` là chỗ chủ dự án theo dõi sản phẩm có gì và chạy thế nào.
Nó chỉ dùng được nếu việc cập nhật nằm TRONG luồng làm việc — để thành "nhớ thì
làm" là hai tuần sau nó mô tả một sản phẩm không còn tồn tại, mà người đọc vẫn
tin nó. Lúc ấy nó tệ hơn không có gì.

| Vừa đổi gì | Sửa sheet nào |
|---|---|
| Một tính năng | `Backlog` — sửa dòng tương ứng, cập nhật cả cột `Cập nhật` và `Commit` |
| Một luồng logic | `Logic chi tiết` — Backlog nói CÓ GÌ, Logic nói CHẠY THẾ NÀO |
| Bất cứ thứ gì ở trên | `Nhật ký thay đổi` — thêm một dòng, cột `Vì sao` là cột quan trọng nhất |
| Thêm tính năng mới | `Backlog` — cấp ID kế tiếp, **không dùng lại ID cũ** |
| Vừa trả giá để biết một luật | Cột `Luật bất biến` của `Logic chi tiết` |
| Một con số đo được đổi | `Chỉ số & cấu hình` |

Bỏ một tính năng thì **không xoá dòng** — đổi trạng thái thành `Tạm dừng` và ghi
lý do. Dòng bị xoá là một câu hỏi "sao hồi đó bỏ cái này?" không ai trả lời được.

Sửa bằng `openpyxl` trong một script ở thư mục tạm, đừng mở bằng tay: mở bằng
Excel rồi lưu lại sẽ đổi định dạng của những ô bạn không đụng tới, và diff thành
vô nghĩa.

Hai máy cùng sửa tệp này thì git **không gộp được** — nó là tệp nhị phân. Nên
mỗi lần sửa phải `git pull` ngay trước, và đẩy ngay sau. Đụng xung đột thì lấy
bản trên `main`, áp lại thay đổi của mình, đẩy lên.

---

## 6. Gặp xung đột thì làm gì

```bash
git pull origin main
```

Git báo `CONFLICT` ở tệp nào thì mở tệp đó ra. Nguyên tắc xử:

- **Giữ cả hai ý.** Hai AI sửa cùng một tệp thường là sửa hai việc khác nhau, chứ
  không phải tranh nhau một việc. Vứt bên kia đi là xoá mất công việc của họ.
- **Tệp câu chữ và i18n** gần như luôn gộp được: mỗi bên thêm khoá riêng.
- **Cùng một hàm bị hai bên viết lại** thì dừng lại, ghi vào `TRANG-THAI.md` mục
  "Đang vướng", và hỏi chủ dự án. Đừng tự chọn bên nào thắng.

Gộp xong chạy lại đủ bốn cổng ở mục 4 rồi mới đẩy.

---

## 7. Database dùng chung

Có thể hai máy dùng chung một Supabase. Trước khi viết SQL, kiểm:

```bash
npx tsx scripts/kiem-moi-truong.ts
```

Luật viết SQL mới:

1. Chỉ cộng thêm: `create table if not exists`, `add column if not exists`,
   `create index if not exists`.
2. Chạy hai lần phải vẫn an toàn.
3. Cột mới phải cho phép rỗng hoặc có mặc định. Bản đang chạy trên production
   không biết cột đó tồn tại.
4. Ghi vào `supabase/DA-CHAY.md` **trong cùng commit** với tệp SQL.
5. Trước khi chạy tệp SQL trên database thật, báo vào `TRANG-THAI.md` mục "Đang
   vướng"; chạy xong thì xoá dòng đó.

Bạn **không tự chạy được SQL** — không có công cụ nào cho phép. Viết tệp `.sql`,
ghi sổ, rồi hướng dẫn chủ dự án dán vào Supabase SQL Editor.

---

## 8. Thử nghiệm mà không giẫm lên nhau

Celes cất bài đã viết vào bảng `noi_dung_ai`, khoá theo **lá số + bề mặt + kỳ**.
Hai máy cùng thử một ngày sinh thì máy này đọc phải bài máy kia vừa sinh, rồi
tưởng mã của mình không chạy.

Nên mỗi máy chọn một ngày sinh riêng và dùng cố định:

| Máy | Ngày sinh dùng để thử |
|---|---|
| Máy A | 12/5/1990, 10 giờ, nam |
| Máy B | 24/8/2000, 9 giờ, nam |

Khoá model dùng chung nghĩa là hạn mức dùng chung. Trước khi chạy một vòng thử
tốn kém, ngó `TRANG-THAI.md` xem bên kia có đang đo đạc gì không.

---

## 9. Biết chắc cái gì đang chạy ở đâu

```bash
git log --oneline -3      # máy này đang ở commit nào
git branch                # đang ở nhánh nào
git status                # có gì chưa commit
```

```
https://celestia-tuvi.vercel.app/api/phien-ban
```

Tuyến đó trả mã commit mà máy chủ thật đang chạy, kèm số hiệu từng lớp của đường
luận giải. Đây là câu trả lời duy nhất đáng tin cho câu hỏi "đã lên chưa". Đừng
đoán qua giao diện: phần lớn thay đổi gần đây nằm ở phía máy chủ nên gói gửi
xuống trình duyệt không đổi một byte.

---

## 10. Vài sự thật đã đo, đừng phát hiện lại

- **Trần chất lượng là model, không phải đường đi.** Cùng dữ kiện, cùng prompt:
  `gpt-4o-mini` cho bài 992 từ đầy tính từ chung chung, `gpt-5.4-mini` cho bài
  1420 từ gần như không nhắc tên sao. Chủ dự án chọn giữ `gpt-4o-mini`. Đừng tự
  đổi, và đừng kết luận rằng prompt sai khi thật ra model đang chạm trần.
- **`gpt-5.5` không dùng được** cho bài dài: quá 55 giây, mà hàm trên Vercel Hobby
  chỉ sống 60 giây.
- **Bề mặt ngắn gọi model theo NHÓM**, không theo từng phần tử. Dòng thời gian có
  ~29 mốc; gọi riêng từng mốc là 29 lượt cho một lần mở trang.
- **Model không giữ được luật "đừng mở giống nhau"** dù dặn hai lần. Những luật
  đếm được thì xử bằng mã, đừng xử bằng prompt.
- **Môi trường shell của công cụ nuốt một lớp dấu gạch chéo.** Sửa tệp có ký tự
  thoát thì viết script bằng công cụ Write rồi chạy, đừng dùng heredoc. Kiểm bằng
  cách đếm byte 0x08. Chi tiết trong `AGENTS.md`.
- **Tháng trên Hành trình là tháng ÂM.** "Tháng 8" hiện trong tháng 9 dương là
  đúng. Đừng cộng thêm một tháng để "sửa".

---

## 11. Bản đồ tệp cần đọc

| Tệp | Nội dung |
|---|---|
| `AGENTS.md` | Luật kỹ thuật của dự án. Đọc ngay sau tệp này |
| `TRANG-THAI.md` | Bên kia đang làm gì. Đọc trước mỗi phiên |
| `supabase/DA-CHAY.md` | SQL nào đã chạy |
| `HUONG-DAN.md` | Vận hành: nạp tài liệu, cấu hình model, hạn mức |
| `PHOI-HOP.md` | Bản dành cho chủ dự án. Đọc để biết họ được hướng dẫn thế nào |
| `PRODUCT-BACKLOG.xlsx` | Toàn bộ tính năng + logic từng luồng + nhật ký. **Đọc trước khi sửa, cập nhật sau khi sửa** |
| `D:\Celestia\Celestia_Universal_AI_Interpretation_Framework_v1.pdf` | Khung luận giải. Mọi chữ Celes viết ra đều phải theo tệp này |

Tệp cuối **không nằm trong git** vì là tài liệu sản phẩm. Máy nào cũng phải có bản
sao cục bộ. Không có nó thì đừng sửa cách luận giải.
