# Kho tri thức Celes: TO-BE và các quyết định (21/10/2026)

Nguồn: `D:\Celestia\KIEN-TRUC-kho-tri-thuc-Celes-AS-IS-TO-BE-v4-2026-10-21.docx` (bản v4, đã qua
phan-bien, chuyen-gia-tu-vi). Chủ dự án trả lời "duyệt" ngày 21/10/2026 = **duyệt toàn bộ đề xuất
ở mục 10.1–10.24**. Riêng 10.6 thì đề xuất chính là "chưa chốt", nên vẫn chưa chốt.
Task Vibe: CELES-16. Kế hoạch chia phiên code: `D:\Celestia\KE-HOACH-PHIEN-CODE-kho-tri-thuc-2026-10-21.md`.

## Quyết định

| # | Chủ đề | Đã quyết | Đã loại, vì sao |
|---|---|---|---|
| 10.1 | Kiến trúc | 5 tầng + trục quản trị, thêm bước "hiệu lực từng vế" (trước trần) và "kế hoạch bài", cổng thu hồi cho mọi đường trả. Không thêm CSDL đồ thị, không thêm dịch vụ. | Giữ hiện tại: model vẫn "cân cả hai". |
| 10.2 | Mô hình phát biểu v2 | Thêm đủ vào chuẩn: sao thuộc bộ nào + vai trò cung, tuổi theo cặp can-chi, Mệnh/Thân, kết luận nhiều vế có căn cứ riêng, khớp 3 trạng thái. Chiều nào trích chưa chắc thì giữ ở dạng ứng viên. | Thêm dần: câu phụ thuộc tuổi/lớp bị giữ lâu. |
| 10.3 | Mục rủi ro thấp theo lô | Cho phép. Nhận định nặng không bao giờ đi theo lô. Vừa/nhẹ: cận trên ≤ 5% với n ≥ 60 (chủ dự án chốt ngưỡng từng loại khi có số). | Không cho: ~7.900 quyết định tay. |
| 10.4 | Phát biểu tranh chấp | Không phục vụ vùng giao; được dùng đoạn giải thích trung tính đã duyệt ở B nếu có. Phân xử theo mức hại và lượt dùng. Khác hệ phái tự nó KHÔNG phải tranh chấp. | "Có sách cho rằng…": đụng luật chống ba phải. |
| 10.5 | Mức tối thiểu theo đường | Focused giữ "đã duyệt"; các đường khác "đang phục vụ". | Một mức chung: phải hạ cổng Focused. |
| 10.6 | Lượt AI đối chiếu thứ hai | **Chưa chốt.** Chờ số đo lỗi trích và soát chi phí. | — |
| 10.7 | Kiểu quan hệ | 4 kiểu: Bổ sung · Hạn chế/điều chỉnh · Ghi đè · Tranh chấp. Chọn "Hạn chế/điều chỉnh" thì bắt buộc ghi chú là thu hẹp hay đổi mức. | 5 kiểu: thêm một lựa chọn trên thẻ duyệt. |
| 10.8 | Độ trễ thu hồi | (a) Chặn ngay ở đệm DB và đường bài cũ; chấp nhận tối đa ~30 phút ở đệm RAM. Chuyển (c) nếu có ca pháp lý cần chặn tức thời. | (b) hạ đệm 5 phút: thêm truy vấn mà không giải hết. |
| 10.9 | Bài đệm cũ | (a) Bài cũ giữ nguyên, không hết hạn, không viết lại (chủ dự án chốt 21/10). Từ nay lưu kèm mỗi bài danh sách căn cứ đã dùng. Đường dự phòng bài thế hệ trước phải đi qua cổng thu hồi. | (b) không làm được (bài là một khối văn); (c) sinh lại hàng loạt: tốn quota. |
| 10.10 | Nhóm đã gộp mất phương diện | Đếm trước, rồi (a) suy lại câu nghĩa từ các câu trích đã có; (b) trích lại cả đoạn chỉ cho nhóm rủi ro cao. | (c) chấp nhận tạm. |
| 10.11 | Sàng lọc chuyên môn bằng AI | Thêm, **sau khi** đo trên 100 mục có đáp án. | Không thêm: chủ dự án tự đọc từng thẻ. |
| 10.12 | Model sàng lọc (v3) | Thay bằng 10.21. | — |
| 10.13 | Câu luật hệ phái | Đã sửa AGENTS.md + `celes-domain` + `chuyen-gia-tu-vi` trong cùng commit với tệp này: "Nam phái làm chuẩn cho engine an sao. Kho tri thức không lọc theo hệ phái; mọi nguồn dùng được cho mọi phần, kể cả vận hạn." | Giữ: AI sau tiếp tục đọc sai (v2 đã sai vì câu này). |
| 10.14 | Cổng chung | Chuyển từng tính năng, chạy song song và đo trước khi tắt đường cũ. Có B tối thiểu (đoạn định nghĩa sao, cung) trước khi chuyển Hỏi Celes. Tắt đường cũ khi tỉ lệ lá số nghèo căn cứ dưới ngưỡng chủ dự án chốt. Hợp tuổi chuyển sau cùng. | Chuyển một lần: Hỏi Celes hụt căn cứ câu khái niệm. |
| 10.15 | Thứ tự | **Làm phương án tối thiểu trước** (7.1: chặn mục nặng chưa duyệt; bỏ câu phủ định + lời dặn "cân cả hai"; lưu danh sách căn cứ mỗi bài), đo lại điểm đau, rồi mới quyết đầu tư phần còn lại. | Làm thẳng TO-BE: chưa có số chứng minh đáng công. |
| 10.16 | Ngân sách bằng 0 | **0 đồng tuyệt đối** cho tới khi chạy thử một đợt nhỏ và đo được số lượt gọi thật; quyết lại khi có số. | Cho phép chi một lần: chưa có số. |
| 10.17 | Nhịp đóng lô | Mỗi 2 tuần hoặc khi hàng chờ đủ ~200 mục, cái nào tới trước. | Chỉ theo lịch / chỉ theo số. |
| 10.18 | Thu hồi khẩn với bài đã lưu | (a) không đụng bài cũ hiện có; (c) từ nay ghi mã mục cho từng câu, thu hồi thì ẩn đúng câu và thay câu trung tính. Bắt đầu ghi ngay ở đợt mã đầu tiên. | (b) ẩn cả bài: rộng, tốn hạn mức. |
| 10.19 | Khoá đệm khi sửa giọng | **C**: tách phần giọng văn khỏi mã tự tính; giữ tự tính cho phần logic (phương pháp an sao, bộ kiểm). Sửa giọng không kéo bài cũ; sửa logic thì bài viết lại khi mở. Đây là **ngoại lệ thứ hai** của "bài cũ giữ nguyên", chủ dự án đã đồng ý. Gỡ nút "Tạo bản mới" gắn với kho đổi ở hai màn. | A (số đếm tay): đảo thiết kế cũ, dễ quên tăng số. B: bỏ quyết định 21/10 cho các tính năng này. |
| 10.20 | Cách viết luận | **So mù A và B cùng lúc**, chọn bản "tự nhiên hơn và không thua về đúng"; hoà thì chọn A. A = gọn prompt một lượt. B = luận ra **ý có cấu trúc** rồi model riêng diễn đạt (kèm giọng Celes), máy kiểm so với dữ kiện engine. Quyết định này thay chỗ các bản phương án luận giải 08/10 (bản 5–8) ghi "người viết chỉ gọi model một lượt". | Chỉ B / chỉ A: chưa có số. Bản H/K ngày 08/10 (biên tập lại bản nháp) đã lộ lỗi bịa khi thiếu chất liệu. |
| 10.21 | Model cho chuyên gia AI duyệt | Model miễn phí (gpt-oss-120b + qwen3.8-27b, ban đêm, hạn mức tách khỏi người dùng thật) + Cerebras dùng thử cho đợt đầu, **sau** bài hiệu chuẩn hai phần. Model miễn phí không bắt được mục sai cố ý thì lúc đó mới cân nhắc chi một lần (phải quyết lại 10.16). | Trả một lần 1–80 USD: trái 10.16. |
| 10.22 | Cổng "không thua sách thô" | Giữ bật 8 chủ đề, chạy cổng ngay; chủ đề nào thua hoặc thêm lỗi nặng thì tắt. | Tắt cả 8: bài đổi chất lượng đột ngột. Miễn cổng: không có căn cứ. |
| 10.23 | Ba chỗ sách nói ngược về luận hạn | Nguyệt hạn theo Hàm số + Hà Thúc Hồng (đếm nghịch đến tháng sinh, thuận đến giờ sinh), Celes nói về tháng ở mức chắc thấp. Sao lưu: 9 sao lõi (Hàm số) + tầng hai mức nhẹ Lưu Khôi, Việt, Xương, Khúc, Loan, Hỷ (Tinh Thành); không theo "mọi sao đều lưu". Chưa thêm "lưu niên đại hạn". Tiểu hạn và Lưu Thái Tuế dùng cả hai, mỗi cái một vai trò cung; trùng cung thì nặng hơn. | "Mọi sao đều lưu"; lưu niên đại hạn (còn tranh chấp). |
| 10.24 | Quick Read | Giữ như hiện nay (hiện ngay, không tốn lượt model, kho lời dùng chung cho luận hạn và Hành trình). Muốn bỏ thì mở việc riêng. | Bỏ ở các chỗ còn lại. |

## Lý do chung

- Điểm đau nặng nhất (2, 5, 10, 11) nằm ở chỗ mục chưa duyệt và câu phủ định lọt vào prompt, cộng lời
  dặn "cân cả hai" khiến model ba phải. Ba sửa của 7.1 đánh thẳng vào đó, nhỏ, trong mã hiện có, và đều
  là một phần của TO-BE nên không phí.
- Truy vết (danh sách căn cứ, mã mục từng câu) càng làm muộn càng nhiều bài không thu hồi được, nên đi
  cùng đợt đầu.
- Phần lớn của TO-BE (xưởng, hàng chờ, bản phát hành, quan hệ, cổng chung) chỉ làm sau khi đo lại.

## Còn treo

- 10.6: chờ số đo lỗi trích + soát chi phí.
- 10.3 / 10.14: ngưỡng cụ thể chủ dự án chốt khi có số.
- 10.21: Cerebras đang hết tiền (CELES-19). Nếu không có lượt dùng thử thì đợt đầu chạy model miễn phí
  (~10 ngày), không chi tiền.
