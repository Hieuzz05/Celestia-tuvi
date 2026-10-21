# X1 — giới hạn thử nghiệm và chạy nền

CELES-30 · 22/10/2026 · Bàn giao cho G2/K3. Chưa chạy phép đo thật.

## Những gì cổng kiểm

Khi có bất kỳ biến AI_NHAN, AI_NGAN_SACH_TOKEN hoặc AI_MUC_DICH, mọi lời gọi qua goiModel chịu cổng X1, gồm gọi trực tiếp, fallback và thử lại. Biến có đặt nhưng rỗng/sai vẫn bật cổng; không biến thành lượt người dùng.

Chỉ cho provider Groq với ba định danh đã chọn trong kế hoạch: openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b. Tên model chứa openai không đổi provider thành OpenAI. Fallback lọc những model ngoài danh sách trước khi gọi. AI_KHONG_LUI=1 giữ đúng một lựa chọn kể cả không truyền model ưu tiên.

Embedding sống (đơn/lô) và OpenAI batch bị chặn trong context này. Dùng căn cứ/fixture chuẩn bị trước cho phép đo, không đổi provider embedding: vector kho hiện tại phải giữ cùng không gian với vector câu hỏi. X1 không đổi cấu hình model lưu trên DB.

## Chuẩn bị trước khi chạy thật

Người vận hành xác nhận tài khoản Groq đang thuộc gói miễn phí và giới hạn thực trên console. Danh sách model trong mã không chứng nhận gói tài khoản hoặc quota còn lại. Không chạy đồng thời script thử trên nhiều máy; X1 không có cơ chế giữ chỗ quota xuyên máy.

Đặt rõ các biến sau cho tiến trình thử; không cần sửa .env.local:

| Biến | Ý nghĩa |
|---|---|
| AI_NHAN | Nhãn ASCII 1–48 ký tự, ví dụ test hoặc nen; ghi vào model@nhan |
| AI_MUC_DICH | Nếu dùng: test, thu-nghiem, nen hoặc background |
| AI_NGAN_SACH_TOKEN | Trần token cho toàn tiến trình; thu-chung đặt từ --ngan-sach |
| AI_GROQ_TRAN_TOKEN_NGAY | Trần tổng token Groq trong ngày UTC, gồm sổ lượt người dùng và lượt thử |
| AI_THU_TRAN_TOKEN_NGAY | Trần token riêng nhóm thử/nền, cộng mọi model có nhãn @ |
| AI_THU_TRAN_LUOT_NGAY | Trần số lần thử/nền, gồm thành công và lỗi |
| AI_THU_TEP_DOI_SOAT | Đường dẫn tuyệt đối đến tệp dấu chưa quyết toán trên ổ lưu bền; thư mục cha phải có sẵn |

Bốn trần số phải là số nguyên dương, thiếu hoặc sai thì dừng. Không có trần ngày mặc định. Chọn trần thử thấp hơn phần tài nguyên thực dành cho thử sau khi chừa người dùng; X1 không tự suy ra con số từ chính sách công bố của nhà cung cấp.

Mọi script tuần tự trên cùng máy phải dùng cùng AI_THU_TEP_DOI_SOAT. Đường dẫn là tên tệp sẽ được tạo; ban đầu tệp chưa tồn tại. Không đặt vào thư mục tạm tự dọn, trong Git hoặc ổ không bền. Không đổi đường dẫn để đi tiếp khi đang bị chặn.

## Khi một lượt chạy

1. Kiểm provider/model, cấu hình và ngân sách tiến trình.
2. Đọc đầy đủ sổ hôm nay theo UTC; lỗi đọc hoặc số liệu không hợp lệ thì dừng.
3. Ước đầu vào theo byte UTF-8 cộng biên giao thức 128 và toàn bộ maxTokens đầu ra (mặc định Groq 2048). Kiểm tổng sau khi cộng lượt sắp gọi với từng trần.
4. Tạo độc quyền dấu đối soát, ghi bền trước HTTP. Dấu chỉ chứa mã lượt, ngày, nhãn, provider/model và mức dự kiến; không lưu prompt hoặc key.
5. Gọi model. Thành công ghi số token thực vào sổ đúng một lần; không cộng reasoning thêm lần nữa. Lỗi không biết usage ghi mức dự kiến và một lượt lỗi. Timeout/mất mạng/lỗi server giữ dấu và dừng toàn chuỗi. Chỉ phản hồi từ chối rõ (401/402/403/429) mới được xóa dấu sau ghi sổ và thử lựa chọn được phép tiếp theo.
6. Ghi sổ thành công mới xóa dấu. Thiếu usage, usage vượt dự kiến hoặc ghi sổ thất bại thì giữ dấu và dừng. Khởi động lại vẫn bị chặn.

Ước lượng trước gọi không phải tokenizer và không bảo đảm tuyệt đối token thực. Nếu thực tế vượt dự kiến, lượt đã gọi vẫn có thể vượt trần; hệ thống ghi lượng thực và giữ dấu để chặn lượt sau. Với lỗi mạng không rõ lượng dùng, con số trong sổ là dự kiến bảo thủ, không phải hóa đơn của nhà cung cấp.

## Khi bị chặn bởi dấu đối soát

Không tự xóa dấu hoặc tự thử lại. Người vận hành kiểm dấu, sổ ai_usage_logs và usage trên console để xác định lượt trước đã được tính đủ chưa. Nếu thiếu thì bổ sung/điều chỉnh bằng quy trình dữ liệu được giao riêng, kiểm trần còn lại, rồi mới chủ động gỡ dấu sau đối soát. X1 không có lệnh tự gỡ, không tự hết hạn qua ngày và không chạy SQL.

Nếu tiến trình chết sau ghi sổ nhưng trước xóa dấu, có thể sổ đã đủ; vẫn phải đối soát để tránh ghi đôi. Nếu mất tệp/đổi ổ hoặc có usage ngoài ứng dụng, X1 không thể phát hiện đầy đủ. Tổng Groq dựa trên sổ hiện có cũng không bảo đảm chừa quota cho production chạy đồng thời ở máy khác.

## Kiểm và bàn giao

- scripts/test-ngan-sach-thu.ts: HTTP/DB giả, kiểm cả restart tiến trình; không cần key thật.
- scripts/test-fallback-giu-nguyen.ts: 14 tình huống production so với bản đóng băng trước CEL-186; ca trial cũ chuyển sang kiểm theo chính sách X1.
- Không có cờ thử: adapter model, embedding, batch và cách ghi usage production giữ đường cũ.
- Claude cập nhật ba sheet PRODUCT-BACKLOG.xlsx cuối vòng theo ngoại lệ kế hoạch bản 3. Nội dung bàn giao ở docs/chien-luoc/X1-han-muc-token-phuong-an.md và dashboard CELES-30.

X1 hoàn thành bằng kiểm offline. G2/K3 chỉ được chạy thật khi có cấu hình hợp lệ và điều kiện tài khoản đã được người vận hành xác nhận; không có phép đo/model/embedding thật trong phiên X1.
