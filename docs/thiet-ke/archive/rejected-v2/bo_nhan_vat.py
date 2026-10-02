"""
Celes — thư viện tư thế, biểu cảm và trạng thái sản phẩm.

Mỗi mục ở đây là MỘT dòng tham số, không phải một bản vẽ. Thêm pose mới = thêm
một dòng. Đó là điều kiện qua bài "Production test" (brief mục 18.8).

Đọc kèm `celes.py` để biết ý nghĩa từng tham số.
"""

from celes import MAC_DINH, Tu_The, replace

# ============================================================ A. MASTER
# Sáu hướng nhìn chuẩn. Tư thế canon là 3/4 (brief mục 23), KHÔNG phải chính
# diện và KHÔNG phải pose cười.
MASTER = [
    ("Chính diện", "front", replace(MAC_DINH, huong=0)),
    ("3/4 trái", "3-4-left", replace(MAC_DINH, huong=-1.0, nghieng_dau=-5)),
    ("3/4 phải — CANON", "3-4-right", replace(MAC_DINH, huong=1.0, nghieng_dau=5)),
    ("Cạnh trái", "side-left", replace(MAC_DINH, huong=-1.9, mat_cach=0.42, nghieng_dau=-2)),
    ("Cạnh phải", "side-right", replace(MAC_DINH, huong=1.9, mat_cach=0.42, nghieng_dau=2)),
    ("Sau lưng", "back", replace(MAC_DINH, huong=0, tai_trai=-12, tai_phai=14,
                                 sau_lung=True, trang=False)),
]

# ============================================================ B. 16 BIỂU CẢM
# Luật mục B: KHÔNG biến thành 16 khuôn mặt emoji. Cùng một khuôn mặt — thay đổi
# đến từ vị trí con ngươi, độ mở mí, GÓC TAI và nghiêng đầu.
BIEU_CAM = [
    # --- Neutral / Utility
    ("Neutral", "neutral", "Mặc định. Đang quan sát, không cười.",
     MAC_DINH),
    ("Listening", "listening", "Tai hướng về phía người nói.",
     replace(MAC_DINH, tai_trai=-16, tai_phai=4, cong_phai=-14, mi=0.28,
             nghieng_dau=4)),
    ("Thinking", "thinking", "Mắt dời khỏi người xem, một tai gập.",
     replace(MAC_DINH, mat_x=0.55, mat_y=-0.45, mi=0.46, tai_trai=-26,
             tai_phai=30, cong_phai=-34, nghieng_dau=-6)),
    ("Curious", "curious", "Một tai lệch — chữ ký của tò mò.",
     replace(MAC_DINH, tai_trai=-48, tai_phai=10, cong_trai=-26, mi=0.22,
             nghieng_dau=7, mat_y=-0.15)),

    # --- Sharp / Meme
    ("Side-eye", "side-eye", "Con ngươi dạt hẳn sang, tai bất đối xứng mạnh.",
     replace(MAC_DINH, mat_x=-0.95, mi=0.52, mi_duoi=0.30, mieng="lech",
             tai_trai=6, tai_phai=32, nghieng_dau=-5)),
    ("Really?", "really", "Nửa mí, đầu nghiêng, miệng mím.",
     replace(MAC_DINH, mi=0.58, mi_duoi=0.22, mieng="nghien", tai_trai=-34,
             tai_phai=40, cong_phai=-20, nghieng_dau=9)),
    ("Not buying it", "not-buying-it", "Mí dưới nhướn cao — dấu của hoài nghi.",
     replace(MAC_DINH, mi=0.50, mi_duoi=0.52, mieng="nghien", mat_x=-0.35,
             tai_trai=-58, tai_phai=26, cong_trai=-22, nghieng_dau=-4)),
    ("Suspicious", "suspicious", "Hai mí hẹp, tai hạ thấp không đều.",
     replace(MAC_DINH, mi=0.63, mi_duoi=0.40, mieng="phang", tai_trai=-66,
             tai_phai=18, cong_trai=-30, mat_x=0.3)),
    ("Has receipts", "has-receipts", "Tai dựng, có chấm sao — ký ức vừa khớp.",
     replace(MAC_DINH, mi=0.40, mi_duoi=0.18, mieng="lech", tai_trai=-4,
             tai_phai=8, sao=3, hao_quang=0.7, nghieng_dau=3)),
    ("Caught you", "caught-you", "Nhìn thẳng, một tai giật lên.",
     replace(MAC_DINH, mi=0.30, mi_duoi=0.35, mieng="lech", tai_trai=-2,
             tai_phai=26, cong_phai=-18, mat_x=0.12, sao=1)),

    # --- Positive
    ("Tiny smile", "tiny-smile", "Nụ cười rất nhỏ — gần như phải nhìn kỹ.",
     replace(MAC_DINH, mieng="nho", mi=0.34, tai_trai=-10, tai_phai=14)),
    ("Excited", "excited", "Tai dựng thẳng và vươn cao, mắt mở hơn mức thường.",
     replace(MAC_DINH, mieng="nho", mi=0.08, tai_trai=-2, tai_phai=4,
             cong_trai=4, cong_phai=-4, mat_y=-0.22, tai_dai=1.1, than_y=-3)),
    ("Celebrate", "celebrate", "Trạng thái duy nhất được cười rõ.",
     replace(MAC_DINH, mieng="cuoi", mi=0.52, tai_trai=-14, tai_phai=18,
             cong_trai=12, cong_phai=-12, sao=2, hao_quang=0.5)),
    ("Proud", "proud", "Cằm lên, mí nửa, tai dựng vững và hơi ngả sau.",
     replace(MAC_DINH, mieng="nho", mi=0.48, mat_y=0.26, tai_trai=-16,
             tai_phai=19, cong_trai=-8, cong_phai=8, nghieng_dau=-3,
             tai_dai=1.04, than_y=-2)),

    # --- Serious
    ("Concerned", "concerned", "Lo — tai ngả sau nhưng CHƯA nằm, mắt mở to, đầu hơi nghiêng.",
     replace(MAC_DINH, mi=0.12, mieng="phang", tai_trai=-74, tai_phai=80,
             cong_trai=26, cong_phai=-26, nghieng_dau=5, tai_dai=0.94)),
    ("Serious", "serious", "Bài kiểm bắt buộc của mục 17. Không hài, không trêu. "
     "Tai HẠ và khép sát, mí xuống, đầu thẳng — khác Concerned ở chỗ thu mình, không cảnh giác.",
     replace(MAC_DINH, mi=0.42, mieng="phang", tai_trai=-68, tai_phai=70,
             cong_trai=-6, cong_phai=6, nghieng_dau=0, tai_dai=0.84,
             than_y=3, trang=True)),
]

# ============================================================ C. 18 TƯ THẾ
TU_THE = [
    ("Standing neutral", "standing", MAC_DINH),
    ("Sitting neutral", "sitting", replace(MAC_DINH, ngoi=True, than_y=12)),
    ("Listening", "listening", replace(MAC_DINH, tai_trai=-16, tai_phai=4,
                                       cong_phai=-14, mi=0.28, nghieng_dau=5,
                                       than_nghieng=3)),
    ("Leaning closer", "leaning", replace(MAC_DINH, than_nghieng=11,
                                          nghieng_dau=6, mi=0.22, mat_y=-0.2,
                                          tai_trai=-12, tai_phai=6)),
    ("Thinking", "thinking", replace(MAC_DINH, tay="mot_ben", mat_x=0.55,
                                     mat_y=-0.45, mi=0.46, tai_trai=-26,
                                     tai_phai=30, cong_phai=-34,
                                     nghieng_dau=-7)),
    ("One ear up", "one-ear-up", replace(MAC_DINH, tai_trai=-52, tai_phai=6,
                                         cong_trai=-24, mi=0.26,
                                         nghieng_dau=6)),
    ("Both ears up", "both-ears-up", replace(MAC_DINH, tai_trai=-3, tai_phai=4,
                                             mi=0.10, mieng="o")),
    ("Arms crossed", "arms-crossed", replace(MAC_DINH, tay="khoanh", mi=0.52,
                                             mi_duoi=0.2, mieng="nghien",
                                             tai_trai=-30, tai_phai=36)),
    ("Pointing", "pointing", replace(MAC_DINH, tay="chi", mi=0.30,
                                     tai_trai=-8, tai_phai=14, mieng="neutral")),
    ("Peeking", "peeking", replace(MAC_DINH, than_nghieng=-14, nghieng_dau=-10,
                                   mat_x=0.75, mi=0.40, tai_trai=-20,
                                   tai_phai=22)),
    ("Over shoulder", "over-shoulder", replace(MAC_DINH, huong=1.4,
                                               mat_x=-0.6, mi=0.44,
                                               nghieng_dau=-6, mat_cach=0.6)),
    ("Looking at user", "at-user", replace(MAC_DINH, mi=0.24, mat_y=-0.1,
                                           tai_trai=-9, tai_phai=12)),
    ("Looking away", "away", replace(MAC_DINH, mat_x=-0.9, mi=0.50,
                                     nghieng_dau=-8, tai_trai=4, tai_phai=30)),
    ("Shrug", "shrug", replace(MAC_DINH, tay="che", mi=0.42, mieng="phang",
                               tai_trai=-74, tai_phai=78, cong_trai=-18,
                               cong_phai=18)),
    ("Caught you", "caught-you", replace(MAC_DINH, tay="chi", mi=0.30,
                                         mi_duoi=0.35, mieng="lech",
                                         tai_trai=-2, tai_phai=26,
                                         cong_phai=-18, sao=1)),
    ("Celebrate", "celebrate", replace(MAC_DINH, tay="vay", mieng="cuoi",
                                       mi=0.52, tai_trai=-14, tai_phai=18,
                                       cong_trai=12, cong_phai=-12, sao=2,
                                       hao_quang=0.5)),
    ("Serious sitting", "serious-sitting", replace(MAC_DINH, ngoi=True,
                                                   than_y=12, mi=0.30,
                                                   mieng="phang",
                                                   tai_trai=-80, tai_phai=82,
                                                   cong_trai=12,
                                                   cong_phai=-12)),
    ("Resting", "resting", replace(MAC_DINH, ngoi=True, than_y=12, mi=0.97,
                                   mieng="nho", tai_trai=-74, tai_phai=78,
                                   cong_trai=22, cong_phai=-22,
                                   nghieng_dau=8)),
]

# ============================================================ D. 9 TRẠNG THÁI
# Ánh xạ thẳng từ mục 20. Tên khoá viết HOA để trùng với hằng số trong mã sản
# phẩm — người code chỉ việc tra bảng này.
TRANG_THAI = [
    ("DEFAULT", "Idle, Home, hiện diện chung.", "Celes đang ở đây.",
     MAC_DINH),
    ("LISTENING", "Người dùng đang nhập hoặc đang kể.", "Celes đang nghe.",
     replace(MAC_DINH, tai_trai=-16, tai_phai=4, cong_phai=-14, mi=0.28,
             nghieng_dau=5, than_nghieng=3)),
    ("THINKING", "Loading, suy luận, đang nối dữ kiện.", "Celes đang xử lý.",
     replace(MAC_DINH, tay="mot_ben", mat_x=0.55, mat_y=-0.45, mi=0.46,
             tai_trai=-26, tai_phai=30, cong_phai=-34, nghieng_dau=-7)),
    ("FOUND_SOMETHING", "Phát hiện insight, pattern mới.", "“Khoan.”",
     replace(MAC_DINH, tai_trai=-3, tai_phai=4, mi=0.08, mieng="o",
             mat_y=-0.2, sao=2, hao_quang=0.55)),
    ("HAS_RECEIPTS", "Ký ức liên quan vừa được truy hồi.", "“Mình nhớ.”",
     replace(MAC_DINH, mi=0.40, mi_duoi=0.18, mieng="lech", tai_trai=-4,
             tai_phai=8, sao=3, hao_quang=0.75, nghieng_dau=3)),
    ("SIDE_EYE", "Mâu thuẫn nhẹ, tình huống đùa được.", "“Ừ…”",
     replace(MAC_DINH, mat_x=-0.95, mi=0.52, mi_duoi=0.30, mieng="lech",
             tai_trai=6, tai_phai=32, nghieng_dau=-5)),
    ("NOT_BUYING_IT", "Người dùng đang hợp lý hoá, đang né.", "“Bạn chắc chứ?”",
     replace(MAC_DINH, tay="khoanh", mi=0.50, mi_duoi=0.52, mieng="nghien",
             mat_x=-0.35, tai_trai=-58, tai_phai=26, cong_trai=-22,
             nghieng_dau=-4)),
    ("SERIOUS", "Bệnh, mất mát, khủng hoảng, chủ đề nhạy cảm.",
     "Hài TẮT. Trêu TẮT. Cử động giảm.",
     replace(MAC_DINH, mi=0.42, mieng="phang", tai_trai=-68, tai_phai=70,
             cong_trai=-6, cong_phai=6, tai_dai=0.84, than_y=3)),
    ("CELEBRATE", "Cột mốc, mục tiêu đạt, sự kiện có ý nghĩa.",
     "Ăn mừng kiểu Celes — tiết chế.",
     replace(MAC_DINH, tay="vay", mieng="cuoi", mi=0.52, tai_trai=-14,
             tai_phai=18, cong_trai=12, cong_phai=-12, sao=2, hao_quang=0.5)),
]

# ============================================================ E. 10 POSE MEME
MEME = [
    ("Side-eye", "“Ừ.”",
     replace(MAC_DINH, mat_x=-0.95, mi=0.52, mi_duoi=0.30, mieng="lech",
             tai_trai=6, tai_phai=32, nghieng_dau=-5)),
    ("Has receipts", "“Mình không phán xét. Mình chỉ nhớ.”",
     replace(MAC_DINH, tay="khoanh", mi=0.40, mi_duoi=0.18, mieng="lech",
             tai_trai=-4, tai_phai=8, sao=3, hao_quang=0.75)),
    ("Peeking", "“Celes nghe thấy rồi nhé.”",
     replace(MAC_DINH, than_nghieng=-14, nghieng_dau=-10, mat_x=0.75,
             mi=0.40, tai_trai=-20, tai_phai=22)),
    ("Ears suddenly up", "“Nó lại nhớ rồi.”",
     replace(MAC_DINH, tai_trai=-3, tai_phai=4, mi=0.08, mieng="o", sao=2)),
    ("Fake innocent", "“Mình có nói gì đâu.”",
     replace(MAC_DINH, mi=0.86, mieng="nho", tai_trai=-16, tai_phai=20,
             nghieng_dau=6)),
    ("Looking at receipts", "“Để mình xem lại.”",
     replace(MAC_DINH, mat_y=0.75, mi=0.60, mieng="phang", tai_trai=-40,
             tai_phai=44, cong_trai=-18, cong_phai=18, nghieng_dau=4)),
    ("Tiny clap", "“Nice.”",
     replace(MAC_DINH, tay="vo_tay", mieng="nho", mi=0.40, tai_trai=-10,
             tai_phai=14, cong_trai=10, cong_phai=-10, than_y=-1)),
    ("Blank stare", "“…”",
     replace(MAC_DINH, mi=0.44, mieng="phang", tai_trai=-11, tai_phai=13,
             mat_x=0.0)),
    ("Judging, not judging", "“Không phán xét đâu.”",
     replace(MAC_DINH, mi=0.58, mi_duoi=0.30, mieng="nghien", mat_x=-0.5,
             tai_trai=-34, tai_phai=38, nghieng_dau=7)),
    ("Walk away", "“Thôi mình đi đây.”",
     replace(MAC_DINH, huong=1.7, mat_cach=0.46, mi=0.46, than_nghieng=5,
             tai_trai=-44, tai_phai=48, cong_trai=-16, cong_phai=16)),
]

# ============================================================ F. STICKER
STICKER = [
    ("Ừ.", replace(MAC_DINH, mat_x=-0.95, mi=0.52, mi_duoi=0.30, mieng="lech",
                   tai_trai=6, tai_phai=32, nghieng_dau=-5)),
    ("Khoan.", replace(MAC_DINH, tai_trai=-3, tai_phai=4, mi=0.08, mieng="o",
                       mat_y=-0.2, sao=2)),
    ("Mình nhớ.", replace(MAC_DINH, mi=0.40, mi_duoi=0.18, mieng="lech",
                          tai_trai=-4, tai_phai=8, sao=3, hao_quang=0.75)),
    ("Really?", replace(MAC_DINH, mi=0.58, mi_duoi=0.22, mieng="nghien",
                        tai_trai=-34, tai_phai=40, cong_phai=-20,
                        nghieng_dau=9)),
    ("Nice.", replace(MAC_DINH, mieng="nho", mi=0.34, tai_trai=-10,
                      tai_phai=14, cong_trai=8, cong_phai=-8)),
    ("...", replace(MAC_DINH, mi=0.44, mieng="phang", tai_trai=-11,
                    tai_phai=13)),
]

# ============================================================ G. MOTION
# 8 chuyển động của mục 4. Mỗi mục: (tên, mô tả, khung A, khung B, chu kỳ giây).
# Hoạt hình ở bản xem là nội suy A↔B — đủ để duyệt nhịp và biên độ trước khi
# giao cho animator.
MOTION = [
    ("idle_breathe", "Loop 2–4 giây. Biên độ CỰC nhỏ.",
     MAC_DINH, replace(MAC_DINH, than_y=-1.6, tai_trai=-9.5, tai_phai=15.5),
     3.4),
    ("blink", "Không chớp kiểu dễ thương. Mắt Celes vốn deadpan.",
     MAC_DINH, replace(MAC_DINH, mi=0.97), 0.26),
    ("ear_twitch", "Chuyển động chữ ký. Alert, nghe thấy gì đó.",
     MAC_DINH, replace(MAC_DINH, tai_phai=26, cong_phai=-12), 0.5),
    ("listening_ear_turn", "Tai xoay về phía tương tác. “Celes đang nghe bạn.”",
     MAC_DINH, replace(MAC_DINH, tai_trai=-16, tai_phai=4, cong_phai=-14,
                       mi=0.28, nghieng_dau=4), 0.9),
    ("side_eye", "Mắt dịch ngang + đầu/tai động nhẹ. Motion meme quan trọng.",
     MAC_DINH, replace(MAC_DINH, mat_x=-0.95, mi=0.52, mi_duoi=0.30,
                       mieng="lech", tai_trai=6, tai_phai=32, nghieng_dau=-5),
     1.1),
    ("memory_recall", "Tai dựng + chấm sao hiện dần. Không cần hiệu ứng lớn.",
     replace(MAC_DINH, mi=0.40),
     replace(MAC_DINH, mi=0.40, mi_duoi=0.18, mieng="lech", tai_trai=-4,
             tai_phai=8, sao=3, hao_quang=0.75), 1.5),
    ("found_something", "Đầu/tai alert. “Khoan.”",
     MAC_DINH, replace(MAC_DINH, tai_trai=-3, tai_phai=4, mi=0.08, mieng="o",
                       mat_y=-0.2, sao=2, hao_quang=0.55), 0.6),
    ("serious_transition", "Từ playful về nghiêm. Rất quan trọng (mục 4).",
     replace(MAC_DINH, mat_x=-0.95, mi=0.52, mieng="lech", tai_trai=6,
             tai_phai=32),
     replace(MAC_DINH, mi=0.30, mieng="phang", tai_trai=-80, tai_phai=82,
             cong_trai=12, cong_phai=-12), 1.8),
]
