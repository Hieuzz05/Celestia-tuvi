# Danh sách bài kiểm đầy đủ

Tách khỏi `AGENTS.md` (07/10/2026) để không nạp vào mọi lượt. Ba lệnh cốt lõi (tsc, build, lint) vẫn nằm ở AGENTS.md.
Trong lúc làm chỉ cần `node scripts/kiem-nhanh.mjs --chay`; danh sách này là thứ CI chạy, tay chỉ cần khi đổi cấu hình dựng hoặc tái hiện CI đỏ. Mốc lint là `MOC` trong `scripts/dem-loi-lint.mjs` — không nâng.

```
npx tsx scripts/test-ansao-chuan.ts   # engine an sao: công thức sách + lịch + 60 mẫu đóng băng — offline
npx tsx scripts/test-rag-planner.ts   # từ điển thực thể, planner (cả trục thời gian + chip sang năm), validator — offline
npx tsx scripts/eval-planner.ts       # bộ vàng 100 câu (tính 03/10/2026, CEL-186 vé A, có tháng mục tiêu, chặn năm sinh; có mục "đúng trục thời gian"), ĐANG 100% — không được tụt
npx tsx scripts/test-chuan-ngon-ngu.ts  # chuẩn ngôn ngữ trên bài đọc sâu — offline
npx tsx scripts/test-cach-cuc.ts      # lớp cách cục: luật nào chết, sàn 2 trần 8 — offline
npx tsx scripts/test-12-cung.ts       # bài luận 12 cung: bao phủ, ngân sách mở đầu — offline
npx tsx scripts/test-phu-du-kien.ts   # độ phủ dữ kiện: mọi sao cung chính có nghĩa theo cung, xung chiếu có nghĩa — offline
npx tsx scripts/test-boi-canh-doc.ts  # bối cảnh người đọc + cấu hình độ dài: khoá đệm, luật không đổi kết luận — offline
npx tsx scripts/test-an-toan.ts       # lớp an toàn chat: bắt đúng câu khủng hoảng, không bắt nhầm "Tử Tức" — offline
npx tsx scripts/test-hop-dong-tra-loi.ts # nhịp/kiểu lượt chat: không chạm kết luận, thứ tự khối — offline
npx tsx scripts/test-sua-chua-tach.ts  # lớp sửa câu giữ nguyên xuống dòng, tiêu đề, danh sách; ráp lại đúng nguyên văn — offline
npx tsx scripts/test-han-luu-nhat-ky.ts  # hạn lưu nhật ký 90 ngày / sổ khách 2 ngày, xoá đệm chung luôn lọc be_mat — offline
npx tsx scripts/test-dau-an.ts         # dấu ấn Celes: cổng (an toàn, ketLuan, bỏ dẫn dắt, câu nối), chống lặp, đầu-cuối trên văn cuối — offline
npx tsx scripts/do-coverage-dau-an.ts  # dấu ấn: thư viện qua checker, UNREACHABLE = 0, mọi cổng chặn đủ — offline (lượt thật: BỎ QUA, nhật ký không lưu chữ từ PRIV-01)
npx tsx scripts/test-linh-vat-an-toan.ts # linh vật nghiêm theo lượt MỚI NHẤT, không dính cả hội thoại — offline
npx tsx scripts/test-cho-dat-celes.ts   # linh vật: ảnh ↔ public/celes, không ảnh khoá, chỉ tệp trong danh sách mục 12 — offline
npx tsx scripts/test-du-kien.ts        # dữ kiện phần đang hỏi: nghiêng về, mốc, cờ Focused tắt giữ nguyên — offline
npx tsx scripts/test-focused.ts        # đường Focused: cờ tắt giữ STANDARD, guard, câu mã, hết câu có căn cứ → thử lại → 502 — offline
npx tsx scripts/test-loi-chi-ma.ts      # lối trả lượt bằng mã: chỉ dữ kiện / hỏi lại (không tính lượt) / đúng 1 ngoại lệ tạm AGE-02 — offline
npx tsx scripts/test-hieu-cau.ts        # hiểu câu qua lượt: meta ký HMAC + ràng buộc, F### dựng lại đúng y, hỏi lại "lá số của ai", giải thích lượt trước — offline
npx tsx scripts/test-fallback-giu-nguyen.ts # fallback.ts (vùng Chung): không đặt biến eval thì chọn model y như bản trước CEL-186 — offline
npx tsx scripts/test-moi-truong-dem.ts  # đệm AI tách theo môi trường: production giữ khoá cũ, Preview/local có tiền tố, cấu hình chỉ production ghi — offline
npx tsx scripts/test-kiem-id-cel.ts     # hàm so ID CEL giữa nhánh / main / nhánh khác — offline
npx tsx scripts/kiem-id-cel.ts          # máy canh trùng ID CEL (cần git fetch); CI chạy riêng ở kiem-id-cel.yml trên MỌI lần đẩy
npx tsx scripts/test-priv-01.ts        # PRIV-01: vết Production không giữ câu hỏi, văn trả lời, băm lá số không muối — offline
npx tsx scripts/test-p0-chan-doan.ts   # harness P0: chẩn đoán tầng hỏng sớm nhất, cờ không chặn chẩn đoán, nhãn judge/người — offline
npx tsx scripts/test-nghiem-ly.ts      # nghiệm lý của chủ dự án (QĐ-13) + khối T###: T phải kèm F, vòng T↔T giải tất định, cờ tắt giữ nguyên — offline
npx tsx scripts/test-phan-hoi.ts       # 👍👎: chỉ nhãn đóng, chỉ lượt của chính mình, màn Cần duyệt chỉ cột an toàn — offline
npx tsx scripts/test-do-phu-viet.ts    # độ phủ tầng viết (đo, chưa đổi Writer) — offline
npx tsx scripts/test-hoi-thoai.ts     # trí nhớ hội thoại: chạm DB thật, KHÔNG gọi model
npx tsx scripts/eval-chat-quyet-dinh.ts # model thật; chạy khi đổi prompt / schema đầu ra / cách cục
npx tsx scripts/eval-focused.ts        # model thật: 30+ ca Focused + Barnum 6×6; BẮT BUỘC AI_GHIM_MODEL + AI_TRAN_USD (≤ $2) + giá — xem đầu tệp
npx tsx scripts/eval-phu-du-kien.ts --sinh|--cham  # model thật: A/B mã cũ–mới trên dữ kiện cung chính/xung chiếu (xem đầu tệp)
npx tsx scripts/test-rag-toan-tuyen.ts  # chạm DB thật + model thật; chạy khi đổi schema/SQL
node scripts/test-hover-nhay.mjs   # mệnh bàn không được nhấp nháy khi rê chuột
npm run kiem-tra-sso      # trạng thái đăng nhập Google
```
