# X1 hạn mức token và lượt thử nghiệm

CELES-30 · 22/10/2026 · Nhánh viec/han-muc-token · Phạm vi CODE theo kế hoạch bản3 đã duyệt.

## Phạm vi và quyết định đã có

Việc lớn: chạm đường gọi AI dùng chung. Không sửa RAG/prompt/UI/engine hoặc ai_model_configs. Không đọc env/DB thật, gọi model thật hay chạy SQL. Không tạo dịch vụ/thư viện production mới. Không giữ chỗ nhiều máy; script thử tuần tự theo quyết định22/10. Claude ghi PRODUCT-BACKLOG.xlsx cuối vòng theo ngoại lệ đã duyệt; Codex bàn giao nội dung. Nhánh quyết định hiện chưa gộp origin/main; đã đọc bản duyệt tại viec/chien-luoc-kho-tri-thuc và kế hoạch bản3.

## Cách làm

1. Thêm helper thuần cho nhận diện lượt thử/nền từ AI_NHAN hoặc AI_NGAN_SACH_TOKEN/AI_MUC_DICH, kiểm cấu hình số dương, tính token dự kiến và trần. Script hiện có batDauLuotThu được giữ, bổ sung kiểm đầu vào. Không cho 0/NaN/chuỗi sai vô hiệu hóa trần ở chế độ thử.
2. Usage thêm đường đọc nghiêm ngặt theo UTC: provider/model/so_request/so_loi/tokens_vao/tokens_ra. Phân biệt số0 với lỗi đọc. Đếm cả lượt lỗi; tổng Groq và tổng nhóm thử/nền. Không tạo bảng mới. Thêm cách ghi nghiêm ngặt dùng cho thử, không đổi cách nuốt lỗi thống kê của production.
3. Hook ngay goiModel trước adapter để phủ cả gọi trực tiếp và fallback. Chế độ thử chỉ cho ba model Groq đã chọn trong kế hoạch: openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b. Không coi tên modelgpt-oss là providerOpenAI. Các provider trả phí/không xác nhận được miền cho phép bị chặn trước HTTP; không đổi cấu hình model lưu trên DB.
4. Ba cấu hình trần ngày phải được đặt rõ trước chạy thật: AI_GROQ_TRAN_TOKEN_NGAY, AI_THU_TRAN_TOKEN_NGAY, AI_THU_TRAN_LUOT_NGAY. Thiếu/sai thì thử dừng, không tự đoán hạn mức tài khoản. Ngân sách tiến trình vẫn AI_NGAN_SACH_TOKEN do thu-chung đặt. Guard tính cả lời gọi sắp thực hiện; lấy biên dự kiến bảo thủ từ prompt và maxTokens, ghi rõ đó là ước tính không phải tokenization chính xác.
5. Bộ đếm/khóa lượt tại tiến trình chỉ ngăn script gọi song song ngoài hợp đồng tuần tự, không có giữ chỗ xuyên máy. Thành công chốt usage; Exception provider ghi mức dự kiến bảo thủ và một lượt lỗi; phản hồi thành công thiếu usage ghi mức dự kiến ở lượt thành công rồi giữ dấu để đối soát. Trước HTTP tạo tệp dấu lượt chưa quyết toán bằng tạo độc quyền ở đường dẫn tuyệt đối AI_THU_TEP_DOI_SOAT do người vận hành đặt, dùng chung và lưu bền cho các script tuần tự trên máy. Chỉ chứa requestId, nhãn, provider/model, ngày và mức dự kiến, không key hay prompt. Chỉ xóa dấu sau ghi usage thành công; timeout/ghi lỗi/crash giữ dấu nên khởi động lại cũng dừng. Không đọc/ghi được tệp hoặc tệp tồn tại thì không gọi. Mở lại chỉ sau người vận hành đối soát sổ thực; không tự hết hạn/xóa dấu qua ngày. Đây là dấu lỗi/đối soát cục bộ, không giữ chỗ nhiều máy và không bảo đảm bảo vệ nếu người vận hành thay đường dẫn/mất ổ lưu. Chuyển ghi usage cho thử về một nơi để không ghi đôi trong fallback.
6. Fallback giữ production không biến thử như cũ. Khi thử lọc trảphí trước gọi; AI_KHONG_LUI=1 áp cả khi không truyền ưu tiên. Trần hết/lỗi đọc là lỗi dừng, không phải lỗi retryable để đổi nhà cung cấp.
7. Chặn đường embedding sống và OpenAI batch trong context thử trước fetch: embedding mặc định OpenAI trả phí, không được tự đổi sangGemini gây sai không gian vector; các phép đo sau phải dùng fixture/căn cứ đã chuẩn bị hoặc phương án được giao riêng. Không thay embedding của production.
8. Tài liệu hướng dẫn G2/K3: cách đặt trần, nhãn trial/background, tuần tự và giới hạn không bảo đảm quota còn nguyên cho production trên máy khác; nguồn thật account chưa kiểm. Không tự chạy đợt đo.

## Tệp dự kiến

lib/ai/usage.ts; lib/ai/providers.ts; lib/ai/fallback.ts; helper mới lib/ai/ngan-sach-thu.ts; lib/ai/embedding.ts; lib/ai/batch-openai.ts; scripts/thu-chung.ts; bài test offline mới; docs/quy-trinh/danh-sach-kiem-tra.md và một bước CI đăng ký bài test; tài liệu sử dụng X1. Không sửa package.json. Nếu cần mở rộng ngoài đây sẽ báo trước.

## Kiểm

Test thuần cho cấu hình, cận token/lượt, nhóm ngày; test provider giả không fetch khi trảphí/quátrần/usageđọc lỗi; gọi trực tiếp, fallback không ưu tiên, retry, loggingmột lần, thiếuusage/ghi lỗi, ghi lỗi rồi khởi động lại vẫn không gọi, tệp đối soát lỗi/có sẵn, hai lượt cùng tiến trình bị từ chối; embedding và batch không fetch trong thử. Kiểm tương thích production bằng test-fallback-giu-nguyen hiện có, giữ phần so hành vi khôngcontextthử; điều chỉnh harness nếu thêm module helper nhưng không xóa bảo vệ production. Tsc/lint/kiem-nhanh và bài mới, không model/DB thật.

## Rủi ro và giới hạn

Các script cũ đặt AI_NHAN/test nhưng thiếu cấu hình mới sẽ dừng chủ động; đây là cổng an toàn theo ngân sách0, không ảnh hưởng production không có context thử. Groq tổng token lấy sổ hiệncó; không bảo đảm đếm toàn bộ usage ngoài ứng dụng/khác máy. Ước token trước gọi bảo thủ nhưng vẫn không là tokenization chính xác. Không SQL hoặc hệ thống quota đa máy. Bài test fallback có một ca AI_NHAN trước đây được phép gọi Gemini; ca thử được kiểm riêng theo chính sách mới, không âm thầm đổi bản đóng băng production.

## Backlog bàn giao Claude

CEL liên quan theo CELES-30/CELES-16; không cấp CEL mới. Backlog: cổng trial trước gọi provider, trần ngày Groq và nhóm trial, cấm paidfallback. Logicchi tiết: đọc usage failclosed, chốt một lần, nhãn thử/nền, không DBmigration/khóađệm/prompt. Nhật ký: vì phép đếm sau gọi không bảo vệ trần và script có thể bỏ qua fallback hoặc gọi embedding trảphí.

## Mốc QC và triển khai

- Researcher, phản biện, chi phí và tác động đã PASS trước code. Tác động: VỪA; không phát sinh yêu cầu chủ dự án duyệt ngoài X1.
- QC diff phát hiện nhánh timeout xóa dấu quá sớm; đã sửa, thêm AbortError/HTTP 500 và restart. 17 nhóm X1 (gồm retry 429 và chặn attempt tiếp theo) cùng 14 ca so production PASS. Tác động rà lại PASS, không mở phạm vi.
- Có tài liệu vận hành docs/quy-trinh/X1-han-muc-thu-nghiem.md. Bài học timeout ghi tại docs/bai-hoc/NHAT-KY.md và docs/bay/ai-rag.md; không đẩy main vì phạm vi cấm push.
- Các phép kiểm dùng HTTP/DB giả, không đọc .env.local, không chạy SQL hay API model/embedding thật. Không mở X2/X3 trước vòng tiếp theo.

- Kiểm cuối: 35 cổng kiem-nhanh đều ĐẠT (typegen, tsc, lint và 32 bài CI offline); máy canh ID không trùng; git diff --check sạch. Build Turbopack PASS, 56 trang tĩnh. Worktree dùng junction node_modules nên lần build đầu dừng do root; đã kiểm lại với turbopack.root cục bộ tạm tới thư mục cha theo tài liệu Next, rồi khôi phục next.config.ts. Không đưa cấu hình cục bộ vào commit.
