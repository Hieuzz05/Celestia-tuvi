"""
Celes — Moon Hare. Bộ dựng nhân vật tham số.

Một hàm `celes()` vẽ ra MỌI tư thế và biểu cảm. Không có 34 bản vẽ rời — chỉ có
một nhân vật, nhận tham số khác nhau. Đó là điều kiện để qua được "Production
test" (mục 18.8 của brief): người khác dựng pose mới bằng cách đổi số, không
phải vẽ lại.

Hệ toạ độ: khung 200×200, nhân vật đứng trong vùng an toàn 24..176.
Tỉ lệ chốt theo Direction B của brief (mục 13): đầu ~55%, thân ~45%.

Luật hình (mục 12, 14, 25):
  - đường cong hình học sạch, không lông, không texture
  - mắt là viên thuốc NẰM NGANG, nửa mí — không bao giờ tròn long lanh
  - không lông mày (brief 25: "eyebrow gần như bỏ")
  - miệng mặc định là một nét cực ngắn, KHÔNG cười
  - biểu cảm đến từ: vị trí con mắt + độ mở mí + GÓC TAI + nghiêng đầu
"""

from dataclasses import dataclass, replace  # `replace` tái xuất cho bo_nhan_vat
from math import cos, radians, sin

# ---------------------------------------------------------------- bảng màu
# Mục 16: Deep Indigo / Midnight / Moon Cream / Muted Violet / Warm Gold.
# Tránh trắng chủ đạo, pastel hồng, tím neon, gradient dải ngân hà.
# Lấy thẳng từ bảng màu Concept 01 (mục 6 của brief redraw).
INDIGO = "#252442"   # Deep Indigo — thân chính, gần như đen trong đêm
INDIGO_T = "#1A1930"  # tối hơn thân: mặt trong tai, bóng dưới cằm
INDIGO_S = "#35334F"  # Indigo Mid — khối sáng nhẹ, tách chân khỏi thân
KEM = "#F1E4CB"      # Moon Cream — mặt nạ, yếm ngực, chóp chân
KEM_T = "#DFCEAF"    # kem tối hơn, dùng cho đường phân vùng
MUC = "#14122B"      # mắt, nét — gần đen nhưng là indigo rất tối
TIM = "#6E5D93"      # Muted Violet — ánh trăng hắt, hiệu ứng ký ức
VANG = "#EFCF8B"     # Warm Gold — CHỈ cho trăng lưỡi liềm + chòm sao
TIM_NHAT = TIM      # bí danh cũ, giữ cho mã đang gọi
NEN_TOI = "#0B0A0D"  # nền đêm, trùng token Aurora của app
NEN_SANG = "#F7F3EC"


@dataclass(frozen=True)
class Tu_The:
    """Mọi tham số của một khung hình Celes.

    Gom hết vào một chỗ để pose mới = một dòng `replace(MAC_DINH, ...)`.
    """

    # -- hướng nhìn ------------------------------------------------------
    # 0 = chính diện, 1 = nghiêng 3/4, 2 = cạnh bên. Âm = quay trái.
    huong: float = 0.0
    nghieng_dau: float = 0.0   # độ, dương = nghiêng sang phải

    # -- tai (mục 5: tai là hệ biểu cảm quan trọng nhất) -----------------
    # Mục 4 của brief redraw: "nên giữ bất đối xứng nhẹ — một tai alert/dựng,
    # tai còn lại relaxed/nghiêng/cụp". Concept 01 để lệch RÕ chứ không mờ nhạt;
    # đây là một nửa sức nhận diện của silhouette.
    tai_trai: float = -34.0    # tai thả lỏng, ngả hẳn sang
    tai_phai: float = 9.0      # tai cảnh giác, gần như dựng
    cong_trai: float = 0.0     # độ gập của chóp tai, dương = gập ra ngoài
    cong_phai: float = 0.0
    tai_dai: float = 1.0       # hệ số chiều dài

    # -- mắt -------------------------------------------------------------
    mat_x: float = 0.0         # con ngươi dịch ngang (-1..1) → side-eye
    mat_y: float = 0.0         # dịch dọc
    mi: float = 0.30           # 0 = mở to, 1 = nhắm. Mặc định nửa mí: deadpan
    mi_duoi: float = 0.0       # mí dưới nhướn lên — dùng cho nghi ngờ
    mat_cach: float = 1.0      # hệ số khoảng cách hai mắt

    # -- miệng ------------------------------------------------------------
    mieng: str = "neutral"     # neutral|nho|cuoi|phang|o|lech|nghien

    # -- thân -------------------------------------------------------------
    than_nghieng: float = 0.0  # độ
    than_y: float = 0.0        # dịch dọc — ngồi thì dương
    ngoi: bool = False
    tay: str = "xuoi"          # xuoi|khoanh|chi|vay|che|mot_ben

    # -- chi tiết celestial (mục 15, option 2 & 3) -------------------------
    trang: bool = True         # dấu trăng khuyết nhỏ trên tai phải
    sao: int = 0               # 0..3 chấm sao nhỏ cạnh đầu — dùng cho ký ức
    hao_quang: float = 0.0     # quầng sáng sau lưng (0..1)

    # -- kết xuất ----------------------------------------------------------
    bong_den: bool = False     # tô đen toàn bộ — bài test silhouette
    sau_lung: bool = False     # nhìn từ sau: không mặt, thấy mặt sau tai


MAC_DINH = Tu_The()


# ------------------------------------------------------------------ tiện ích
def _xoay(x: float, y: float, do: float, cx: float, cy: float) -> tuple:
    """Xoay điểm quanh tâm."""
    r = radians(do)
    dx, dy = x - cx, y - cy
    return (cx + dx * cos(r) - dy * sin(r), cy + dx * sin(r) + dy * cos(r))


def _p(*n) -> str:
    """Rút gọn số cho path SVG — bớt rác cho tệp cuối."""
    return " ".join(f"{v:.2f}".rstrip("0").rstrip(".") for v in n)


# -------------------------------------------------------------------- bộ phận
def _tai(goc: float, cong: float, dai: float, goc_x: float, goc_y: float,
         ben: int, mau: str, mau_trong: str, trang: bool) -> str:
    """Một chiếc tai.

    Hình: một viên thuốc dài, hơi thon về chóp. Gập ở chóp khi `cong` khác 0 —
    đó là cách tai "cụp" mà không cần vẽ lại.

    `ben`: -1 trái, +1 phải. Dùng để đổ bóng mặt trong đúng phía.
    """
    # Rút ngắn phối cảnh: tai cụp ra sau thì NGẮN LẠI theo mắt nhìn, không
    # phải quạt ngang hết cỡ. Không có bước này, pose nghiêm (|góc| > 60°)
    # vẽ ra hình chong chóng / cánh dơi — mất silhouette thỏ (brief mục 13).
    # Từ 46° trở đi co dần, sàn 0.56 để tai vẫn còn là tai.
    _a = abs(goc)
    _co = 1.0 if _a <= 46.0 else max(0.56, 1.0 - (_a - 46.0) / 46.0 * 0.44)

    L = 78 * dai * _co    # chiều dài
    W = 19.0              # bề ngang gốc tai
    Wc = 7.4              # bề ngang chóp

    # trục tai sau khi xoay
    r = radians(goc)
    ux, uy = sin(r), -cos(r)              # vector đơn vị dọc tai
    px, py = -uy, ux                      # vector vuông góc

    # điểm gập: 68% chiều dài
    gx = goc_x + ux * L * 0.68
    gy = goc_y + uy * L * 0.68
    rc = radians(goc + cong)
    cx_, cy_ = sin(rc), -cos(rc)
    tx = gx + cx_ * L * 0.32
    ty = gy + cy_ * L * 0.32
    pcx, pcy = -cy_, cx_

    # Hình tai: LÁ LIỄU, không phải que. Phình ở 1/3 dưới rồi thon dần tới
    # chóp nhọn-tù. Đây là chữ ký silhouette của Celes — cạnh ngoài cong hơn
    # cạnh trong, nên hai tai dựng cạnh nhau tạo khe hình giọt, không phải khe
    # song song như tai thỏ thường.
    def _cung(sign: float) -> str:
        """Một cạnh tai, từ gốc lên chóp. sign=+1 cạnh ngoài, -1 cạnh trong."""
        # cạnh ngoài phình nhiều hơn → bất đối xứng nội tại của từng chiếc tai
        phinh = W * (0.62 if sign > 0 else 0.46)
        b1x = goc_x + px * sign * phinh + ux * L * 0.30
        b1y = goc_y + py * sign * phinh + uy * L * 0.30
        b2x = gx + px * sign * W * 0.40
        b2y = gy + py * sign * W * 0.40
        return f"C{_p(b1x, b1y)} {_p(b2x, b2y)} {_p(tx + pcx * sign * Wc * 0.30, ty + pcy * sign * Wc * 0.30)}"

    # cạnh trong chạy ngược chiều (chóp → gốc), nên dựng riêng
    phinh_i = W * 0.46
    i1x = gx - px * W * 0.40
    i1y = gy - py * W * 0.40
    i2x = goc_x - px * phinh_i + ux * L * 0.30
    i2y = goc_y - py * phinh_i + uy * L * 0.30
    d = (f"M{_p(goc_x + px * W * 0.46, goc_y + py * W * 0.46)}"
         f"{_cung(1)}"
         f"Q{_p(tx + cx_ * Wc * 0.62, ty + cy_ * Wc * 0.62)} "
         f"{_p(tx - pcx * Wc * 0.30, ty - pcy * Wc * 0.30)}"
         f"C{_p(i1x, i1y)} {_p(i2x, i2y)} "
         f"{_p(goc_x - px * W * 0.46, goc_y - py * W * 0.46)}Z")

    out = [f'<path d="{d}" fill="{mau}"/>']

    # mặt trong tai — cùng hình lá, thu nhỏ, đẩy lên. Chừa viền dày ở gốc để
    # tai vẫn đọc được khối khi thu nhỏ còn 32px.
    if mau_trong:
        f_ = 0.52                      # hệ số thu
        o = L * 0.20                   # đẩy lên khỏi gốc
        bx, by = goc_x + ux * o, goc_y + uy * o
        Li = L * 0.74
        gix = bx + ux * Li * 0.66
        giy = by + uy * Li * 0.66
        tix = gix + cx_ * Li * 0.30
        tiy = giy + cy_ * Li * 0.30
        Wi, Wci = W * f_, Wc * f_
        a1x = bx + px * Wi * 0.62 + ux * Li * 0.30
        a1y = by + py * Wi * 0.62 + uy * Li * 0.30
        a2x = gix + px * Wi * 0.40
        a2y = giy + py * Wi * 0.40
        c1x = gix - px * Wi * 0.40
        c1y = giy - py * Wi * 0.40
        c2x = bx - px * Wi * 0.46 + ux * Li * 0.30
        c2y = by - py * Wi * 0.46 + uy * Li * 0.30
        d2 = (f"M{_p(bx + px * Wi * 0.46, by + py * Wi * 0.46)}"
              f"C{_p(a1x, a1y)} {_p(a2x, a2y)} {_p(tix + pcx * Wci * 0.30, tiy + pcy * Wci * 0.30)}"
              f"Q{_p(tix + cx_ * Wci * 0.62, tiy + cy_ * Wci * 0.62)} "
              f"{_p(tix - pcx * Wci * 0.30, tiy - pcy * Wci * 0.30)}"
              f"C{_p(c1x, c1y)} {_p(c2x, c2y)} "
              f"{_p(bx - px * Wi * 0.46, by - py * Wi * 0.46)}Z")
        out.append(f'<path d="{d2}" fill="{mau_trong}"/>')

    # Dấu trăng khuyết: một VẠCH cong ôm theo cạnh ngoài chóp tai phải, không
    # phải chấm dán lên tai. Vạch nên nó sống sót khi thu nhỏ, và vì nó nằm
    # trên đường biên nên nó tham gia vào silhouette thay vì chỉ là hoạ tiết.
    # Luật mục 15.2: tuyệt đối không đặt mặt trăng to giữa trán.
    if trang:
        s0 = 0.56                 # vị trí bắt đầu dọc tai
        s1 = 0.90                 # vị trí kết thúc, gần chóp
        def _diem(s: float, ra: float) -> tuple:
            if s <= 0.68:
                bx_, by_ = goc_x + ux * L * s, goc_y + uy * L * s
                return (bx_ + px * ra, by_ + py * ra)
            bx_ = gx + cx_ * L * (s - 0.68)
            by_ = gy + cy_ * L * (s - 0.68)
            return (bx_ + pcx * ra, by_ + pcy * ra)

        # TRĂNG LƯỠI LIỀM + CHÒM SAO trên MỘT tai (mục 7). Concept 01 vẽ trăng
        # đặc, khá to; mục 12 yêu cầu giảm 30–50% nên ở đây trăng nhỏ lại và
        # chòm sao rút còn hai chấm. Trăng vẽ bằng hai cung tròn lệch tâm —
        # hình liềm thật, không phải vạch cong, nên nó còn đọc được ở cỡ nhỏ.
        # Liềm = đĩa tròn trừ đi một đĩa lệch tâm. Vẽ bằng MỘT path hai cung
        # ngược chiều quét: cung ngoài theo đĩa đầy, cung trong theo đĩa khuyết.
        # Trục khuyết đặt dọc theo BỀ NGANG tai nên liềm luôn quay bụng về phía
        # cạnh ngoài, dù tai xoay góc nào.
        tx, ty = _diem(0.72, 0.0)          # tâm trăng, lùi khỏi chóp để không bị cắt
        rr = W * 0.34
        kx, ky = px * rr * 0.62, py * rr * 0.62   # lệch theo phương ngang tai
        d1x, d1y = tx + ux * rr, ty + uy * rr     # hai đầu liềm: dọc trục tai
        d2x, d2y = tx - ux * rr, ty - uy * rr
        out.append(
            f'<path d="M{_p(d1x, d1y)}'
            f'A{_p(rr)} {_p(rr)} 0 0 1 {_p(d2x, d2y)}'
            f'A{_p(rr * 1.18)} {_p(rr * 1.18)} 0 0 0 {_p(d1x, d1y)}Z"'
            f' fill="{VANG}" opacity="0.96"'
            f' transform="translate({_p(kx * 0.0)} {_p(ky * 0.0)})"/>')
        # Hai chấm sao nhỏ phía dưới trăng — tín hiệu chòm sao, đã rút gọn.
        for ss, rra, kt in ((0.56, W * 0.22, 1.5), (0.47, -W * 0.10, 1.15)):
            sx, sy = _diem(ss, rra)
            out.append(f'<circle cx="{_p(sx)}" cy="{_p(sy)}" r="{_p(kt)}"'
                       f' fill="{VANG}" opacity="0.88"/>')
    return "".join(out)


def _mat(cx: float, cy: float, t: Tu_The, mau: str, nen: float = 1.0) -> str:
    """Một con mắt.

    Hình nền tảng: viên thuốc NẰM NGANG (mục 14). Mí trên hạ xuống theo `t.mi`
    bằng cách cắt bớt chiều cao từ phía trên — nên mắt nửa mí vẫn là cùng một
    con mắt, không phải hình khác.
    """
    import hashlib
    uid = hashlib.md5(f"{cx:.2f}{cy:.2f}{t.mi:.3f}{t.mi_duoi:.3f}"
                      f"{t.mat_x:.3f}{t.mat_y:.3f}".encode()).hexdigest()[:8]

    W, H = 17.4 * nen, 13.4      # hốc mắt; `nen` ép ngang khi quay 3/4
    rx, ry = W / 2, H / 2

    # Mí: cắt hốc mắt từ TRÊN xuống (mi) và từ DƯỚI lên (mi_duoi). Dùng mặt nạ
    # nên con ngươi bị xén theo đúng mí — đó là cách side-eye và nheo mắt đọc
    # được thật, thay vì chỉ thu nhỏ cả con mắt.
    tren = ry * 2 * t.mi * 0.80
    duoi = ry * 2 * t.mi_duoi * 0.50
    con_lai = ry * 2 - tren - duoi

    if con_lai <= 2.4:           # nhắm → một nét cong, giữ nguyên tinh thần deadpan
        yq = cy - ry + tren
        return (f'<path d="M{_p(cx - rx * 0.92, yq)}Q{_p(cx, yq + 3.6)} '
                f'{_p(cx + rx * 0.92, yq)}" stroke="{mau}" stroke-width="3.2"'
                f' fill="none" stroke-linecap="round"/>')

    # con ngươi: viên thuốc đứng, chạy trong hốc theo mat_x / mat_y
    pr_x, pr_y = rx * 0.52, ry * 0.92
    px_ = cx + t.mat_x * (rx - pr_x) * 1.02
    py_ = cy + t.mat_y * (ry - pr_y * 0.55) * 0.9

    o = [f'<defs><clipPath id="m{uid}">'
         f'<rect x="{_p(cx - rx - 2)}" y="{_p(cy - ry + tren)}"'
         f' width="{_p(W + 4)}" height="{_p(max(con_lai, 0.1))}"/>'
         f'</clipPath></defs>']
    o.append(f'<g clip-path="url(#m{uid})">')
    # lòng trắng — kem, không phải trắng tinh (giữ territory indigo/kem)
    o.append(f'<ellipse cx="{_p(cx)}" cy="{_p(cy)}" rx="{_p(rx)}" ry="{_p(ry)}"'
             f' fill="{KEM}"/>')
    o.append(f'<ellipse cx="{_p(px_)}" cy="{_p(py_)}" rx="{_p(pr_x)}"'
             f' ry="{_p(pr_y)}" fill="{mau}"/>')
    # điểm sáng — MỘT chấm nhỏ, không phải hai chấm long lanh kiểu kawaii
    o.append(f'<circle cx="{_p(px_ + pr_x * 0.34)}" cy="{_p(py_ - pr_y * 0.42)}"'
             f' r="{_p(pr_x * 0.30)}" fill="{KEM}" opacity="0.92"/>')
    o.append("</g>")
    # viền hốc mắt — mảnh, giúp mắt không chìm vào mảng kem của mõm
    o.append(f'<ellipse cx="{_p(cx)}" cy="{_p(cy)}" rx="{_p(rx)}" ry="{_p(ry)}"'
             f' fill="none" stroke="{mau}" stroke-width="1.5"'
             f' clip-path="url(#m{uid})" opacity="0.55"/>')
    # Nét mí trên. Độ dày TỈ LỆ với mi: mắt mở thì mí gần như biến mất, mắt
    # nheo thì mí dày lên. Nếu để dày cố định, mọi biểu cảm đều trông cau có —
    # đúng lỗi "anime villain eyebrow" mà brief mục 24 bắt bỏ.
    if t.mi > 0.06:
        ym = cy - ry + tren
        dm = 0.9 + t.mi * 2.3
        # mí phẳng khi mở, cong xuống khi nheo — cong là thứ tạo vẻ "đang xét"
        vong = 0.5 + t.mi * 2.0
        o.append(f'<path d="M{_p(cx - rx * 0.99, ym - 0.3)}'
                 f'Q{_p(cx, ym + vong)} {_p(cx + rx * 0.99, ym - 0.3)}"'
                 f' stroke="{mau}" stroke-width="{_p(dm)}" fill="none"'
                 f' stroke-linecap="round" opacity="{_p(0.55 + t.mi * 0.45)}"/>')
    return "".join(o)


def _mieng(cx: float, cy: float, kieu: str, mau: str) -> str:
    """Miệng. Luật mục 14: cực đơn giản, KHÔNG cười mặc định."""
    s = f'stroke="{mau}" fill="none" stroke-linecap="round"'
    if kieu == "neutral":      # một nét ngắn, phẳng
        return f'<path d="M{_p(cx - 3.4, cy)}L{_p(cx + 3.4, cy)}" {s} stroke-width="2.6"/>'
    if kieu == "phang":        # dài hơn, dẹt — nghiêm
        return f'<path d="M{_p(cx - 5.2, cy)}L{_p(cx + 5.2, cy)}" {s} stroke-width="2.6"/>'
    if kieu == "nho":          # nụ cười RẤT nhỏ, gần như không thấy
        return (f'<path d="M{_p(cx - 4.0, cy - 0.5)}Q{_p(cx, cy + 2.4)} '
                f'{_p(cx + 4.0, cy - 0.5)}" {s} stroke-width="2.5"/>')
    if kieu == "cuoi":         # cười rõ — chỉ dùng cho CELEBRATE
        return (f'<path d="M{_p(cx - 6.0, cy - 1.4)}Q{_p(cx, cy + 5.0)} '
                f'{_p(cx + 6.0, cy - 1.4)}" {s} stroke-width="2.7"/>')
    if kieu == "o":            # miệng mở nhỏ — ngạc nhiên, "Khoan."
        return f'<ellipse cx="{_p(cx)}" cy="{_p(cy + 0.6)}" rx="3.1" ry="3.9" fill="{mau}"/>'
    if kieu == "lech":         # một bên nhếch — side-eye, "Ừ…"
        return (f'<path d="M{_p(cx - 4.4, cy + 0.9)}Q{_p(cx + 0.6, cy + 0.4)} '
                f'{_p(cx + 4.6, cy - 1.7)}" {s} stroke-width="2.6"/>')
    if kieu == "nghien":       # mím chặt, hơi cong xuống — không tin
        return (f'<path d="M{_p(cx - 4.8, cy - 1.2)}Q{_p(cx, cy + 1.4)} '
                f'{_p(cx + 4.8, cy - 1.2)}" {s} stroke-width="2.6"/>')
    return ""


def _tay(t: Tu_The, cx: float, vy: float, mau: str) -> str:
    """Tay. Giữ cực đơn giản — viên thuốc bo tròn, không ngón (mục 25)."""
    o = []
    def chi(x, y, goc, dai=17.0, w=9.2):
        r = radians(goc)
        x2, y2 = x + sin(r) * dai, y - cos(r) * dai
        return (f'<path d="M{_p(x, y)}L{_p(x2, y2)}" stroke="{mau}"'
                f' stroke-width="{_p(w)}" stroke-linecap="round"/>')

    if t.tay == "xuoi":
        o.append(chi(cx - 22.5, vy - 4, 196))
        o.append(chi(cx + 22.5, vy - 4, 164))
    elif t.tay == "khoanh":
        o.append(f'<path d="M{_p(cx - 21, vy + 2)}L{_p(cx + 21, vy + 7)}"'
                 f' stroke="{mau}" stroke-width="9.6" stroke-linecap="round"/>')
        o.append(f'<path d="M{_p(cx + 21, vy - 2)}L{_p(cx - 21, vy + 3)}"'
                 f' stroke="{mau}" stroke-width="9.6" stroke-linecap="round"/>')
    elif t.tay == "chi":
        o.append(chi(cx - 22.5, vy - 4, 196))
        o.append(chi(cx + 20, vy - 7, 104, 21))
    elif t.tay == "vay":
        o.append(chi(cx - 22.5, vy - 4, 196))
        o.append(chi(cx + 21, vy - 9, 143, 20))
    elif t.tay == "che":
        o.append(chi(cx - 21, vy - 6, 150, 19))
        o.append(chi(cx + 21, vy - 6, 210, 19))
    elif t.tay == "vo_tay":
        # Hai tay chụm trước ngực, ĐƯA CAO khỏi thân để nhìn thấy được — "che"
        # vẽ sát thân nên bị bụng kem nuốt mất, vỗ tay trông như đứng yên.
        o.append(chi(cx - 20, vy - 10, 128, 21, 8.8))
        o.append(chi(cx + 20, vy - 10, 232, 21, 8.8))
        o.append(f'<circle cx="{_p(cx)}" cy="{_p(vy - 23)}" r="{_p(6.2)}"'
                 f' fill="{mau}"/>')
    elif t.tay == "mot_ben":   # một tay chống cằm — dáng suy nghĩ
        o.append(chi(cx - 22.5, vy - 4, 196))
        o.append(chi(cx + 19, vy - 8, 168, 22, 8.6))
    return "".join(o)


# ------------------------------------------------------------------- nhân vật
def celes(t: Tu_The = MAC_DINH, kich_thuoc: int = 200, nen: str = "") -> str:
    """Dựng một SVG Celes hoàn chỉnh.

    Thứ tự vẽ: hào quang → tai sau → thân → đầu → mặt → tay.
    Tai vẽ TRƯỚC đầu để gốc tai lẩn vào sọ, không thấy mối nối.
    """
    S = kich_thuoc

    # --- neo hình học ----------------------------------------------------
    # Direction B: đầu ~55%, thân ~45% tổng chiều cao thấy được.
    cx = 100.0
    dau_y = 78.0 + t.than_y * 0.35     # tâm đầu
    dau_r = 36.0                        # bán kính sọ
    than_y = 128.0 + t.than_y           # tâm thân
    # Concept 01: thân ngồi là một khối GỌN và BỆ, không thon. Bề ngang hông
    # xấp xỉ bề ngang sọ để hai khối chồng lên nhau thành một silhouette liền.
    than_w = 46.0
    than_h = 34.0 if not t.ngoi else 29.0

    # lệch ngang do quay 3/4 — mặt dịch, không phải vẽ lại
    # Quay đầu. Biên độ phải ĐỦ LỚN, nếu không sáu hướng nhìn trông y hệt nhau.
    # Ở `huong = 1` (3/4) mặt dịch ~13px; ở `huong = 2` (cạnh bên) ~24px.
    lech = t.huong * 13.0

    mau = MUC if t.bong_den else INDIGO
    mau_t = MUC if t.bong_den else INDIGO_T
    mau_k = MUC if t.bong_den else KEM
    mau_s = MUC if t.bong_den else INDIGO_S
    mau_mat = MUC if t.bong_den else MUC
    trang = t.trang and not t.bong_den

    o = []
    # Khung vẽ rộng hơn lưới dựng hình 200x200: tư thế tai NẰM NGANG (Concerned,
    # Serious, Not buying it) vươn quá mép 200 và bị cắt chóp. Nới mỗi bên 24 đơn
    # vị để chứa tai; lưới và vùng an toàn vẫn tính trên 200 như mục A mô tả.
    o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -20 248 248"'
             f' width="{S}" height="{S}" shape-rendering="geometricPrecision">')
    if nen:
        o.append(f'<rect x="-24" y="-20" width="248" height="248" fill="{nen}"/>')

    # --- hào quang (ký ức / phát hiện) ------------------------------------
    if t.hao_quang > 0 and not t.bong_den:
        o.append(f'<circle cx="{_p(cx)}" cy="{_p(dau_y)}" r="{_p(58)}"'
                 f' fill="{TIM_NHAT}" opacity="{_p(0.13 * t.hao_quang)}"/>')
        o.append(f'<circle cx="{_p(cx)}" cy="{_p(dau_y)}" r="{_p(46)}"'
                 f' fill="{TIM_NHAT}" opacity="{_p(0.11 * t.hao_quang)}"/>')

    # --- nhóm nghiêng đầu --------------------------------------------------
    g = f' transform="rotate({t.nghieng_dau:.1f} {_p(cx, dau_y + 14)})"' if t.nghieng_dau else ""

    # --- tai ---------------------------------------------------------------
    # Gốc tai TRƯỢT theo vòm sọ theo góc tai: tai càng ngả ngang thì gốc càng
    # chạy ra phía má. Không có bước này thì ở góc lớn (tư thế nghiêm, cụp)
    # tai rời khỏi đầu, lộ mối nối.
    def _goc_tai(do: float, ben: int) -> tuple:
        # đưa góc tai về khoảng [-90, 90] để nội suy
        nghieng = max(-1.0, min(1.0, do / 90.0))
        gx_ = cx + lech * 0.55 + ben * (13.0 + abs(nghieng) * 17.0)
        gy_ = dau_y - 29.0 + abs(nghieng) ** 1.6 * 24.0
        return gx_, gy_

    gt_x, gt_y = _goc_tai(t.tai_trai, -1)
    gp_x, gp_y = _goc_tai(t.tai_phai, 1)
    tai_html = (
        _tai(t.tai_trai, t.cong_trai, t.tai_dai, gt_x, gt_y, -1, mau,
             "" if (t.bong_den or t.sau_lung) else mau_t, False)
        + _tai(t.tai_phai, t.cong_phai, t.tai_dai, gp_x, gp_y, 1, mau,
               "" if (t.bong_den or t.sau_lung) else mau_t,
               trang and not t.sau_lung))

    # --- thân --------------------------------------------------------------
    tn = f' transform="rotate({t.than_nghieng:.1f} {_p(cx, than_y + than_h)})"' if t.than_nghieng else ""
    than = [f'<g{tn}>']
    than.append(_tay(t, cx, than_y, mau))
    # Thân NGỒI trên hai chân sau, theo Concept 01: một khối hình quả lê — vai
    # hẹp, hông phình, đáy bè đặt xuống đất. Không phải viên thuốc đứng; dáng
    # ngồi là thứ làm silhouette của Celes khác thỏ mascot đứng thông thường.
    vai = than_w * 0.70          # vai hẹp
    hong = than_w * 1.04         # hông phình
    dinh = than_y - than_h / 2   # vai
    day = than_y + than_h / 2 + 12  # mặt đất
    bx = cx + lech * 0.30
    than.append(
        f'<path d="M{_p(bx - vai / 2, dinh)}'
        f'C{_p(bx - vai * 0.82, dinh + than_h * 0.30)} {_p(bx - hong / 2, day - than_h * 0.34)}'
        f' {_p(bx - hong / 2, day - 9)}'
        f'C{_p(bx - hong / 2, day + 3)} {_p(bx - hong * 0.30, day + 5)} {_p(bx, day + 5)}'
        f'C{_p(bx + hong * 0.30, day + 5)} {_p(bx + hong / 2, day + 3)} {_p(bx + hong / 2, day - 9)}'
        f'C{_p(bx + hong / 2, day - than_h * 0.34)} {_p(bx + vai * 0.82, dinh + than_h * 0.30)}'
        f' {_p(bx + vai / 2, dinh)}Z" fill="{mau}"/>')

    # Đuôi: chấm tròn nhỏ sau hông. Mục 4 — không được cạnh tranh với tai.
    if not t.sau_lung:
        ben = -1 if t.huong >= 0 else 1
        than.append(f'<circle cx="{_p(bx + ben * hong * 0.50)}" cy="{_p(day - 17)}"'
                    f' r="{_p(8.4)}" fill="{mau_s if not t.bong_den else MUC}"/>')

    # Yếm kem chạy từ ngực xuống bụng — nối thẳng với mặt nạ kem trên mặt.
    if not t.bong_den and not t.sau_lung:
        # Yếm bắt đầu THẤP hơn vai: phải chừa một dải indigo dưới cằm, nếu không
        # yếm dính liền mặt nạ kem thành một cột kem và mất hẳn cổ.
        than.append(f'<path d="M{_p(bx + lech * 0.16, dinh + than_h * 0.30)}'
                    f'C{_p(bx - vai * 0.40, dinh + than_h * 0.48)}'
                    f' {_p(bx - hong * 0.30, day - than_h * 0.26)} {_p(bx - hong * 0.26, day - 6)}'
                    f'C{_p(bx - hong * 0.10, day + 2)} {_p(bx + hong * 0.10, day + 2)}'
                    f' {_p(bx + hong * 0.26, day - 6)}'
                    f'C{_p(bx + hong * 0.30, day - than_h * 0.26)}'
                    f' {_p(bx + vai * 0.40, dinh + than_h * 0.48)}'
                    f' {_p(bx + lech * 0.16, dinh + than_h * 0.30)}Z"'
                    f' fill="{mau_k}"/>')

    # Hai bàn chân trước chạm đất, chóp kem — chi tiết duy nhất ở phần đáy.
    if not t.sau_lung:
        for d in (-1, 1):
            px = bx + d * hong * 0.26
            than.append(f'<ellipse cx="{_p(px)}" cy="{_p(day + 1)}" rx="{_p(10.6)}"'
                        f' ry="{_p(6.6)}" fill="{mau_s if not t.bong_den else MUC}"/>')
            if not t.bong_den:
                than.append(f'<ellipse cx="{_p(px + d * 1.6)}" cy="{_p(day + 1.4)}"'
                            f' rx="{_p(6.0)}" ry="{_p(4.2)}" fill="{mau_k}"/>')
    than.append("</g>")

    # --- đầu ----------------------------------------------------------------
    dau = []
    # Sọ: KHÔNG phải hình tròn (hình tròn = Miffy/Cony, rớt bài test IP mục
    # 18.7). Celes có sọ hình hạt: đỉnh dẹt và hơi vuông, má dưới bè ra, cằm
    # thu gọn. Vẽ bằng bốn cung — đủ ít điểm neo để animator dựng lại nhanh.
    hx = cx + lech * 0.46
    R = dau_r
    dau.append(
        f'<path d="M{_p(hx - R * 0.995, dau_y + R * 0.06)}'
        f'C{_p(hx - R * 1.00, dau_y - R * 0.62)} {_p(hx - R * 0.64, dau_y - R * 0.95)} '
        f'{_p(hx - R * 0.10, dau_y - R * 0.95)}'           # vai trái lên đỉnh dẹt
        f'C{_p(hx + R * 0.46, dau_y - R * 0.95)} {_p(hx + R * 0.94, dau_y - R * 0.68)} '
        f'{_p(hx + R * 0.97, dau_y - R * 0.04)}'           # đỉnh sang phải
        f'C{_p(hx + R * 1.00, dau_y + R * 0.52)} {_p(hx + R * 0.70, dau_y + R * 0.95)} '
        f'{_p(hx, dau_y + R * 0.95)}'                      # má phải bè, xuống cằm
        f'C{_p(hx - R * 0.70, dau_y + R * 0.95)} {_p(hx - R * 0.99, dau_y + R * 0.56)} '
        f'{_p(hx - R * 0.995, dau_y + R * 0.06)}Z" fill="{mau}"/>')
    if not t.bong_den and not t.sau_lung:
        # MẶT NẠ KEM — dấu nhận diện số 1 của Concept 01. Cấu trúc đúng là HAI
        # THUỲ (mỗi thuỳ ôm một bên má + một con mắt) gặp nhau ở một khe chữ V
        # NHỌN giữa trán. Khe V mới là thứ làm nó đọc ra vệt lông trên mặt thú;
        # vẽ thành một vòm cong liền thì ra tóc mái rẽ ngôi, không phải thỏ.
        # Mục 11 cảnh báo mặt nạ kem dễ rơi vào mascot generic nên thuỳ ở đây
        # thấp hơn Concept 01, chừa lề indigo rộng ở thái dương.
        fx = cx + lech * 0.66
        R2 = dau_r
        khe_y = dau_y - R2 * 0.20      # đáy khe V, ngay giữa hai mắt
        thuy_y = dau_y - R2 * 0.46     # đỉnh mỗi thuỳ, cao hơn khe
        rong = R2 * 0.90
        day_y = dau_y + R2 * 0.76
        dau.append(
            f'<path d="M{_p(fx, khe_y)}'
            f'L{_p(fx - rong * 0.40, thuy_y)}'                      # cạnh trái khe V
            f'C{_p(fx - rong * 0.84, thuy_y + R2 * 0.16)}'
            f' {_p(fx - rong, dau_y + R2 * 0.14)} {_p(fx - rong, dau_y + R2 * 0.34)}'
            f'C{_p(fx - rong, day_y)} {_p(fx - rong * 0.54, day_y + R2 * 0.12)}'
            f' {_p(fx, day_y + R2 * 0.12)}'                          # đáy mõm
            f'C{_p(fx + rong * 0.54, day_y + R2 * 0.12)} {_p(fx + rong, day_y)}'
            f' {_p(fx + rong, dau_y + R2 * 0.34)}'
            f'C{_p(fx + rong, dau_y + R2 * 0.14)} {_p(fx + rong * 0.84, thuy_y + R2 * 0.16)}'
            f' {_p(fx + rong * 0.40, thuy_y)}'                       # cạnh phải khe V
            f'Z" fill="{mau_k}"/>')

    # mặt
    if not t.bong_den and not t.sau_lung:
        mx = cx + lech * 0.78
        my = dau_y + 2.4   # mắt nằm trên nền kem, không dính mép sọ
        kc = 17.6 * t.mat_cach
        # quay 3/4: mắt xa thu hẹp khoảng cách — ảo giác phối cảnh
        # Mắt xa (phía ngược chiều quay) bị nén ngang và dạt về biên sọ; mắt gần
        # giữ nguyên bề ngang. Đây mới là thứ làm người xem đọc ra "đang quay",
        # chứ không phải dịch cả khuôn mặt sang bên.
        # q > 0 là quay sang PHẢI người xem → mắt TRÁI là mắt xa.
        q = max(-1.0, min(1.0, t.huong / 1.9))
        xa_trai = q > 0
        nen_xa = max(0.12, 1.0 - abs(q) * 0.80)
        ex_t = mx - kc * ((1.0 - abs(q) * 0.46) if xa_trai else 1.0) + t.mat_x * 3.6
        ex_p = mx + kc * ((1.0 - abs(q) * 0.46) if not xa_trai else 1.0) + t.mat_x * 3.6
        ey = my + t.mat_y * 2.6
        # Sát cạnh bên thì mắt XA khuất sau sống mũi — phải giấu đúng con mắt
        # xa, không phải lúc nào cũng giấu mắt trái.
        khuat = abs(q) >= 0.95
        if not (khuat and xa_trai):
            dau.append(_mat(ex_t, ey, t, mau_mat,
                            nen=nen_xa if xa_trai else 1.0))
        if not (khuat and not xa_trai):
            dau.append(_mat(ex_p, ey, t, mau_mat,
                            nen=nen_xa if not xa_trai else 1.0))
        # mũi: một tam giác bo rất nhỏ
        dau.append(f'<path d="M{_p(mx - 2.9, dau_y + 16.4)}L{_p(mx + 2.9, dau_y + 16.4)}'
                   f'L{_p(mx, dau_y + 19.2)}Z" fill="{mau_mat}" opacity="0.92"/>')
        dau.append(_mieng(mx, dau_y + 24.2, t.mieng, mau_mat))

    # chấm sao celestial — 2–3 chấm nhỏ, dùng cho trạng thái ký ức (mục 15.3)
    sao_html = ""
    if t.sao and not t.bong_den:
        vt = [(cx + 46, dau_y - 24, 2.6), (cx + 53, dau_y - 12, 1.9),
              (cx + 41, dau_y - 7, 1.5)]
        sao_html = "".join(
            f'<circle cx="{_p(x)}" cy="{_p(y)}" r="{_p(r)}" fill="{VANG}"'
            f' opacity="{_p(0.95 - i * 0.16)}"/>'
            for i, (x, y, r) in enumerate(vt[:t.sao]))

    o.append(f'<g{g}>{tai_html}</g>')
    o.append("".join(than))
    o.append(f'<g{g}>{"".join(dau)}{sao_html}</g>')
    o.append("</svg>")
    return "".join(o)


def celes_dau(kich_thuoc: int = 32, nen: str = "") -> str:
    """Bản DẤU của Celes — chỉ đầu + hai tai, dùng dưới 32px.

    Ở cỡ favicon, nhân vật đủ thân mình biến thành một vệt tối. Bản này bỏ thân,
    phóng to đầu chiếm gần hết khung, tăng tương phản mắt. Đây KHÔNG phải nhân
    vật thu nhỏ — nó là một tài sản riêng, dùng đúng chỗ của nó.
    """
    S = kich_thuoc
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"'
         f' width="{S}" height="{S}" shape-rendering="geometricPrecision">']
    if nen:
        o.append(f'<rect width="100" height="100" rx="22" fill="{nen}"/>')
    # Tai BẤT ĐỐI XỨNG đúng như nhân vật đủ thân: trái thả lỏng ngả ra, phải
    # dựng cảnh giác. Ở cỡ dấu đây là tín hiệu nhận ra Celes nhanh nhất.
    o.append(f'<path d="M26 48C16 38 12 20 18 13C24 7 34 18 36 34'
             f'C37 42 37 46 36 50Z" fill="{INDIGO}"/>')
    o.append(f'<path d="M70 47C76 34 75 15 69 9C63 4 57 16 57 32'
             f'C57 40 58 44 60 47Z" fill="{INDIGO}"/>')
    o.append(f'<path d="M26 40C21 32 19 21 22 18C25 16 30 24 31 34'
             f'C32 39 31 42 31 44Z" fill="{INDIGO_T}"/>')
    o.append(f'<path d="M67 24C69 19 68 12 66 11C64 10 62 16 62 24'
             f'C62 29 63 32 64 33Z" fill="{INDIGO_T}"/>')
    # Trăng lưỡi liềm trên tai phải — chữ ký IP, giữ cả ở cỡ dấu.
    o.append(f'<path d="M68 15A7 7 0 0 1 68 29A8.6 8.6 0 0 0 68 15Z"'
             f' fill="{VANG}"/>')
    # Sọ
    o.append(f'<ellipse cx="50" cy="62" rx="31" ry="28" fill="{INDIGO}"/>')
    # Mặt nạ kem hai thuỳ + khe V — cùng cấu trúc với nhân vật đủ thân.
    o.append(f'<path d="M50 56L38 48C30 50 24 57 24 64'
             f'C24 74 36 82 50 82C64 82 76 74 76 64'
             f'C76 57 70 50 62 48Z" fill="{KEM}"/>')
    # Mắt: to, tương phản mạnh, nửa mí giữ đúng tinh thần deadpan
    for ex in (38, 62):
        o.append(f'<ellipse cx="{ex}" cy="62" rx="7.5" ry="6" fill="{KEM_T}"'
                 f' opacity="0.55"/>')
        o.append(f'<ellipse cx="{ex}" cy="63" rx="4.2" ry="4.6" fill="{MUC}"/>')
        # Mí NGANG và mảnh. Nét dày + cong xuống ở giữa đọc ra lông mày giận —
        # đúng thứ mục 5 và 11 cấm. Giữ nửa mí deadpan, không giữ thái độ.
        o.append(f'<path d="M{ex - 7.4} 59.4Q{ex} 60.2 {ex + 7.4} 59.4"'
                 f' stroke="{INDIGO}" stroke-width="3.0" fill="none"'
                 f' stroke-linecap="round"/>')
    o.append("</svg>")
    return "".join(o)
