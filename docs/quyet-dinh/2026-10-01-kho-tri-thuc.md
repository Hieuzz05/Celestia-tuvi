# Quyết định 01/10/2026 — Kho tri thức: hệ phái, luật ngầm, thư viện theo bản mới

Chủ dự án chốt trong phiên [CODE] "note thứ tự ưu tiên ở Kho tri thức". Mã: CEL-179.

> Ghi chú 06/10/2026: tệp chép từ nhánh `viec/kho-tri-thuc-uu-tien` (CHƯA gộp, mã chưa lên main). Mã CEL-179 trên main đã dùng cho việc khác (phủ dữ kiện); phần nào được port sẽ cấp mã mới.

## 1. Kho tri thức không lọc theo hệ phái

- Mọi tài liệu (Nam phái, Bắc phái, Dùng chung) cùng vào truy hồi; **mức tin cậy** phân xử khi hai
  nguồn ngang nhau về độ liên quan (`lib/rag/uu-tien-nguon.ts`).
- Nhãn hệ phái chỉ ghi nhận nguồn gốc. Tài liệu mới mặc định `chung`.
- "Nam phái làm chuẩn" (AGENTS.md, quyết định 1) **chỉ áp cho engine an sao**, không áp cho kho.

## 2. Luật ngầm áp cho mọi phần luận giải

- Nguồn `ghi-chu-chuyen-gia` và `noi-bo` vào được MỌI đường trả lời (chat, bài dài, bảng lĩnh vực,
  bản đọc sâu, bề mặt ngắn, mốc hành trình, Kết nối, v3), không chỉ v3.
- Model dùng để định hướng, nhưng không được để lộ là có nguồn ấy. Thiếu meta thì coi là ngầm
  (fail-closed).
- Cổng ngôn ngữ đường cũ chỉ **cảnh báo** (`lo-luat-ngam`), không chặn: chặn làm bài không vào đệm
  và sinh lại mỗi lần mở trang, trong khi danh sách cụm vẫn có thể bắt nhầm văn thường
  ("luật ngầm nơi công sở"). **Còn mở:** có nâng lên chặn như v3 không — cần số đo tỉ lệ lộ thật
  trước khi quyết.

## 3. Thư viện là bản mới nhất của tài liệu

- Xuất bản bản mới → tự đồng bộ thư viện (không gọi model): dời câu trích sang đoạn của bản mới;
  câu trích không còn → bỏ cả mục; mục lật mất hết đích → bỏ.
- Lưu trữ không gỡ mục (có thể xuất bản lại), nhưng mục đó không vào prompt.
- Xoá hẳn tài liệu → gỡ vĩnh viễn.
- Đồng bộ chỉ BỚT được. Nội dung mới của bản mới cần model đọc → **nút "đọc vào thư viện" trên
  trang admin** (chủ dự án chọn), làm ở nhánh sau, qua `soat-chi-phi` trước.

## Số đo (dữ liệu thật, chỉ đọc)

- 10 gói, 7.883 mục, đọc 3,4 giây.
- Tài liệu lớn nhất 1.587 câu trích / 927 đoạn. Giả lập mọi đoạn được biên tập và cấp id mới: dời được
  đủ 1.587 câu trong 0,8 giây. Phần ghi chưa đo trên DB thật.
