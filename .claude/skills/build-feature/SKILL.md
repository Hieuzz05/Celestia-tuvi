---
name: build-feature
description: Làm một tính năng Celes theo quy trình Spec → Research → Domain → Plan (dừng chờ duyệt) → Code → QA + Domain review → nhánh sẵn sàng duyệt. Dùng khi chủ dự án gõ /build-feature <mã-spec>.
---

# /build-feature <mã-spec>

Mã spec: `$ARGUMENTS` → tệp `specs/$ARGUMENTS.md`.

## 0. Phối hợp hai máy (bắt buộc — xem AI-PHOI-HOP.md)
- `git checkout main && git pull`, đọc `TRANG-THAI.md`. Nếu máy kia đang làm cùng vùng tệp → DỪNG, báo chủ dự án.
- Ghi một dòng "Đang làm" vào `TRANG-THAI.md`, commit riêng lên `main`.
- `git checkout -b viec/$ARGUMENTS`.

## 1. Spec
- Nếu `specs/$ARGUMENTS.md` chưa có: soạn nháp từ `specs/_MAU.md` dựa trên yêu cầu của chủ dự án, rồi **DỪNG — chờ duyệt spec**.
- Spec phải có tiêu chí chấp nhận (AC) kiểm được.

## 2. Research
Gọi agent `researcher` với spec. Không tự đọc tràn lan trong phiên chính.

## 3. Domain (chỉ khi chạm `lib/tuvi`, `lib/rag`, prompt, khung câu hỏi, nội dung luận)
Gọi agent `celes-domain` để nêu ràng buộc domain trước khi lên kế hoạch.

## 4. Kế hoạch — 🛑 DỪNG
Trình bày: tệp sẽ sửa, từng bước, test sẽ chạy, rủi ro (chi phí AI, đệm `THE_HE_DEM`, lệch web–app), dòng nào của `PRODUCT-BACKLOG.xlsx` phải cập nhật.
**Không viết mã cho tới khi chủ dự án trả lời "duyệt".**

## 5. Viết mã
Theo kế hoạch đã duyệt. Luật ở `AGENTS.md` (i18n vi + en, không lộ tên model ở mặt trước, không sửa `ai_model_configs` bằng mã, không SQL phá huỷ).

## 6. Kiểm
- Gọi agent `qa` với spec.
- Nếu đã chạm vùng domain: gọi `celes-domain` review lại.
- FAIL → sửa rồi kiểm lại, tối đa 2 vòng. Vẫn FAIL → dừng, báo rõ mục trượt.

## 7. Hoàn tất
- Cập nhật `PRODUCT-BACKLOG.xlsx` (Backlog / Logic chi tiết / Nhật ký thay đổi) TRONG CÙNG commit, bằng openpyxl.
- Commit: `git add` từng tệp cụ thể, thông điệp không dấu, kết thúc bằng dòng Co-Authored-By.
- Đẩy nhánh `viec/$ARGUMENTS`. **KHÔNG gộp vào `main`** khi chủ dự án chưa duyệt.
- Báo lại: tóm tắt thay đổi, bảng QA, việc cần chạy tay.
