# Celes — app di động của Celestia

App iOS/Android dựng bằng Expo + expo-router. Web ở gốc kho mã là kênh thu hút
người dùng và SEO; app này là sản phẩm chính cho dùng hằng ngày.

## Chạy thử

```bash
cd apps/celes-app
npm install
npx expo start          # quét mã QR bằng Expo Go
npm run kiem-tra        # tsc --noEmit
npx expo export --platform android --output-dir /tmp/kiem   # thử bundle
```

## Điểm kiến trúc quan trọng nhất

**App KHÔNG có bản sao engine an sao.** Nó đọc thẳng `lib/tuvi/` ở gốc kho mã qua
`metro.config.js` (`watchFolders`) và bí danh `@tuvi/*` trong `tsconfig.json`.

Sao chép engine sang đây là con đường chắc chắn dẫn tới việc app và web tính ra
hai lá số khác nhau sau vài tháng sửa đổi — mà lỗi kiểu đó cực khó phát hiện: cả
hai đều chạy được, chỉ khác kết quả. Sửa engine ở `lib/tuvi/`, cả hai cùng đổi.

Metro bị chặn không cho lần ngược lên `node_modules` ở gốc kho (đó là dự án
Next.js, bộ phụ thuộc khác hẳn). Đừng bật `disableHierarchicalLookup` — một số
gói như `expo-router` đặt phụ thuộc lồng bên trong và sẽ không tìm thấy.

**App không tự chạy model AI.** Phần điều phối AI, kho tri thức và hạn mức đều ở
máy chủ web (`src/du-lieu/api.ts` gọi sang `/api/hoi-dap`). Nhúng khoá API vào
gói cài đặt là ai tải app về cũng rút được khoá ra.

## Cấu trúc

```
app/                    màn hình (expo-router)
  gioi-thieu.tsx        giới thiệu thương hiệu
  onboarding/           5 bước: tên → ngày → giờ → giới tính → điều bận tâm
  dang-tao.tsx          nhịp chờ có chủ đích trước khi hiện kết quả
  quick-read.tsx        giá trị đầu tiên, trước khi hỏi tài khoản
  dang-ky.tsx           đăng ký mềm, luôn có đường "Để sau"
  ban-do.tsx            bản đồ: Dễ hiểu / Cổ điển / Chuyên sâu
  (tabs)/               5 tab: Hôm nay · Hành trình · Celes · Kết nối · Tôi
src/
  thiet-ke/             token màu, chữ, khoảng cách, theme sáng/tối
  giao-dien/            component dùng lại + bộ icon + tương tác "Vì sao?"
  i18n/                 VI/EN, vi.ts là nguồn chân lý cấu trúc khoá
  du-lieu/              hồ sơ, bản nháp onboarding, gọi API, ghi sự kiện
```

## Quy tắc không được phá

1. **Đúng năm tab.** Không đưa "Luận giải chi tiết", "Hỏi đáp", "Hồ sơ", "Quản
   trị" lên điều hướng chính.
2. **Mỗi màn đúng một nút hành động nổi trội.** Hồng Fuchsia chỉ dành cho nó.
3. **Không thu nhỏ mệnh bàn 920px của web.** Chế độ Cổ điển dựng lưới riêng cho
   di động, ô đủ lớn để chạm.
4. **Không hiện tên model, nhà cung cấp, hay từ "AI"** ở bất cứ đâu người dùng
   nhìn thấy. Lỗi thì nói bằng giọng Celes, không phải mã lỗi.
5. **Không đoán giờ sinh.** Người chọn "Tôi không chắc" phải được giải thích vì
   sao cần giờ sinh, không được gán một giờ mặc định rồi cho đi tiếp.
6. **Quick Read không có tường chắn.** Đăng ký chỉ được mời sau khi đã đọc.
7. **"Muốn biết vì sao không?"** luôn miễn phí, luôn có mặt, và luôn hiện lời
   đời thường trước thuật ngữ.
8. **Theme tối giữ nền Aubergine `#240029`**, không đổi sang đen hay navy.

## Chưa làm

Xem mục "Chưa làm" trong `AGENTS.md` ở gốc kho mã.
