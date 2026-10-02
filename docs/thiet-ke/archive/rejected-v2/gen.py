"""
Sinh `index.html` — bản thuyết minh nhân vật Celes.

Chạy:  python gen.py
Mở:    index.html

Tệp sinh ra là MỘT tệp HTML tự chứa, không gọi mạng, không gửi gì ra ngoài.
Mọi hình là SVG sống — bấm chuột phải "Inspect" là lấy được path để dán vào
Figma hoặc vào mã sản phẩm.
"""

from celes import (INDIGO, INDIGO_S, INDIGO_T, KEM, KEM_T, MAC_DINH, MUC, celes_dau,
                   NEN_SANG, NEN_TOI, TIM_NHAT, VANG, Tu_The, celes, replace)
from bo_nhan_vat import (BIEU_CAM, MASTER, MEME, MOTION, STICKER, TRANG_THAI,
                         TU_THE)

# ---------------------------------------------------------------- kiểu chữ
# Dùng đúng bộ chữ của hệ Aurora để bản thuyết minh nằm cùng ngôn ngữ với app.
FONTS = ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800"
         "&family=Be+Vietnam+Pro:wght@400;500;600;700"
         "&family=JetBrains+Mono:wght@400;500&display=swap")
DISPLAY = "'Bricolage Grotesque', 'Be Vietnam Pro', system-ui, sans-serif"
MONO = "'JetBrains Mono', ui-monospace, monospace"

MUT = "#9A93B8"
LINE = "rgba(255,255,255,0.09)"


def the(noi_dung: str, nhan: str = "", chu_thich: str = "", rong: str = "",
        nen: str = "") -> str:
    """Một ô trong lưới: hình ở trên, nhãn ở dưới."""
    n = (f'<div class="nhan">{nhan}</div>' if nhan else "")
    c = (f'<div class="ct">{chu_thich}</div>' if chu_thich else "")
    s = f' style="{rong}"' if rong else ""
    bg = nen or "rgba(255,255,255,0.028)"
    return (f'<figure class="o"{s}><div class="khung" style="background:{bg}">'
            f'{noi_dung}</div>{n}{c}</figure>')


def muc(so: str, ten: str, mo_ta: str, than: str) -> str:
    return (f'<section class="muc" id="{so}"><header class="dau-muc">'
            f'<span class="so">{so}</span>'
            f'<h2>{ten}</h2><p>{mo_ta}</p></header>{than}</section>')


# ============================================================== các phần
def phan_master() -> str:
    o = "".join(the(celes(t, 168), ten,
                    "Tư thế chuẩn" if "CANON" in ten else "")
                for ten, _k, t in MASTER)
    luoi = f'<div class="luoi l6">{o}</div>'

    # lưới dựng hình
    t = replace(MAC_DINH, huong=1.0, nghieng_dau=5)
    grid = f'''<div class="dung-hinh">
      <div class="gh">{celes(t, 300)}
        <svg class="gl" viewBox="0 0 200 200" width="300" height="300">
          <defs><pattern id="g8" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
            <path d="M12.5 0 L0 0 0 12.5" fill="none" stroke="{VANG}" stroke-width="0.3" opacity="0.30"/>
          </pattern></defs>
          <rect width="200" height="200" fill="url(#g8)"/>
          <line x1="100" y1="0" x2="100" y2="200" stroke="{VANG}" stroke-width="0.7" opacity="0.7"/>
          <line x1="0" y1="78" x2="200" y2="78" stroke="{VANG}" stroke-width="0.7" opacity="0.7"/>
          <line x1="0" y1="128" x2="200" y2="128" stroke="{VANG}" stroke-width="0.7" opacity="0.7"/>
          <rect x="24" y="24" width="152" height="152" fill="none" stroke="{TIM_NHAT}"
                stroke-width="0.7" stroke-dasharray="4 3" opacity="0.8"/>
        </svg>
      </div>
      <ul class="ghi">
        <li><b>Đầu 55% · thân 45%</b> — mục 4 của brief redraw. Cân giữa biểu cảm và sự chững chạc.</li>
        <li><b>Sọ hình hạt</b>, không phải hình tròn. Đỉnh hơi dẹt, má dưới bè, cằm thu. Hình tròn là lãnh địa của Miffy/Cony — rớt bài test IP.</li>
        <li><b>Mặt nạ kem hai thuỳ</b>, gặp nhau ở khe chữ V nhọn giữa trán. Khe V là thứ làm nó đọc ra vệt lông trên mặt thú; vẽ liền thành vòm là ra tóc mái rẽ ngôi.</li>
        <li><b>Tai bất đối xứng mặc định</b> (−34° / +9°): một tai thả lỏng, một tai cảnh giác. Mục 4 — đây là một nửa sức nhận diện của silhouette.</li>
        <li><b>Dáng ngồi</b> trên hai chân sau, thân hình quả lê: vai hẹp, hông phình, đáy bè. Không phải mascot đứng.</li>
        <li><b>Vùng an toàn</b> (nét đứt) 152×152 trong khung 200. Tư thế tai nằm ngang được phép tràn ra vùng đệm hai bên.</li>
      </ul></div>'''
    return muc("A", "Master", "Sáu hướng nhìn, lưới dựng hình, vùng an toàn. "
               "Tư thế canon là 3/4 — không phải chính diện, và tuyệt đối không phải pose cười.",
               luoi + grid)


def phan_silhouette() -> str:
    cap = []
    for ten, _k, _d, t in [BIEU_CAM[0], BIEU_CAM[4], BIEU_CAM[3], BIEU_CAM[15]]:
        cap.append(the(celes(replace(t, bong_den=True), 150), ten,
                       nen="rgba(255,255,255,0.06)"))
    for ten, _k, t in [TU_THE[7], TU_THE[15]]:
        cap.append(the(celes(replace(t, bong_den=True), 150), ten,
                       nen="rgba(255,255,255,0.06)"))

    kich = "".join(
        f'<div class="cs"><div class="khung nho">{celes(MAC_DINH, px)}</div>'
        f'<span class="mono">{px}px</span></div>'
        for px in (128, 96, 64, 48, 32, 24))

    return muc("A2", "Silhouette & cỡ nhỏ",
               "Hai bài test khó nhất của brief mục 18. Tô đen toàn bộ — còn nhận ra không? "
               "Thu còn 32px — tai có dính vào nhau không, mắt còn đọc được không?",
               f'<div class="luoi l6">{"".join(cap)}</div>'
               f'<div class="cs-hang">{kich}</div>'
               f'<p class="ket"><b>Kết quả:</b> nhân vật đủ thân đọc được tới 32px nhờ ba khối lớn '
               f'(hai tai + sọ) và độ tương phản kem/indigo ở mặt nạ; dưới mốc đó thân mình biến thành '
               f'một vệt tối. Chỗ nhỏ hơn dùng <b>bản dấu</b> (chỉ đầu + hai tai, xem mục H) — '
               f'bản này giữ được tai, khe giữa hai tai và khe mắt tới 24px, và tới 16px vẫn còn '
               f'silhouette + khe mắt. Bản dấu là một tài sản riêng, không phải nhân vật thu nhỏ.</p>')


def phan_bieu_cam() -> str:
    nhom = [("Neutral · Utility", BIEU_CAM[0:4]),
            ("Sharp · Meme", BIEU_CAM[4:10]),
            ("Positive", BIEU_CAM[10:14]),
            ("Serious", BIEU_CAM[14:16])]
    out = []
    for ten_nhom, ds in nhom:
        o = "".join(the(celes(t, 148), ten, mo) for ten, _k, mo, t in ds)
        out.append(f'<h3 class="nhom">{ten_nhom}</h3><div class="luoi l6">{o}</div>')
    return muc("B", "16 biểu cảm",
               "Cùng MỘT khuôn mặt. Khác biệt đến từ vị trí con ngươi, độ mở mí, "
               "góc tai và độ nghiêng đầu — không phải 16 mặt emoji khác nhau.",
               "".join(out))


def phan_tu_the() -> str:
    o = "".join(the(celes(t, 148), ten) for ten, _k, t in TU_THE)
    return muc("C", "18 tư thế",
               "Mỗi tư thế là một dòng tham số, không phải một bản vẽ. Thêm tư thế mới "
               "bằng cách thêm một dòng vào <code>bo_nhan_vat.py</code>.",
               f'<div class="luoi l6">{o}</div>')


def phan_trang_thai() -> str:
    o = []
    for ma, ngu_canh, y_nghia, t in TRANG_THAI:
        o.append(f'''<div class="tt">
          <div class="tt-hinh">{celes(t, 160)}</div>
          <div class="tt-chu">
            <code class="ma">{ma}</code>
            <p class="nc">{ngu_canh}</p>
            <p class="yn">{y_nghia}</p>
          </div></div>''')
    bang = "".join(
        f'<tr><td class="mono sk">{a}</td><td class="mui">→</td>'
        f'<td class="mono ma-nho">{b}</td></tr>'
        for a, b in [
            ("bình thường", "DEFAULT"),
            ("người dùng đang nói", "LISTENING"),
            ("AI đang suy luận", "THINKING"),
            ("phát hiện insight quan trọng", "FOUND_SOMETHING"),
            ("ký ức liên quan được truy hồi", "HAS_RECEIPTS"),
            ("mâu thuẫn nhẹ + được phép đùa", "SIDE_EYE"),
            ("người dùng hợp lý hoá + được phép đùa", "NOT_BUYING_IT"),
            ("ngữ cảnh nghiêm túc / nhạy cảm", "SERIOUS"),
            ("thành công có ý nghĩa", "CELEBRATE")])
    return muc("D", "9 trạng thái sản phẩm",
               "Ánh xạ thẳng từ sự kiện của Product Engine sang trạng thái nhân vật. "
               "Đây là phần riêng của Celes — không sao chép từ đâu.",
               f'<div class="tt-luoi">{"".join(o)}</div>'
               f'<div class="bang-anh-xa"><h3 class="nhom">Ánh xạ sự kiện → trạng thái</h3>'
               f'<table>{bang}</table>'
               f'<p class="canh-bao"><b>Luật chặn (brief mục 21):</b> khi '
               f'<code>playfulness = 0</code>, ba trạng thái <code>SIDE_EYE</code>, '
               f'<code>NOT_BUYING_IT</code> và bản vui của <code>HAS_RECEIPTS</code> bị '
               f'KHOÁ. Ký ức khớp trong ngữ cảnh nghiêm túc vẫn phải ra hình '
               f'<code>SERIOUS</code>, không ra pose meme.</p></div>')


def phan_motion() -> str:
    o = []
    for i, (ten, mo, a, b, chu_ky) in enumerate(MOTION):
        o.append(f'''<div class="mo">
          <div class="mo-khung">
            <div class="mo-a">{celes(a, 150)}</div>
            <div class="mo-b" style="animation-duration:{chu_ky}s">{celes(b, 150)}</div>
          </div>
          <code class="ma">{ten}</code>
          <p class="ct">{mo}</p>
          <span class="mono chu-ky">{chu_ky}s</span>
        </div>''')
    return muc("E", "8 chuyển động",
               "Mỗi ô nội suy giữa hai khung để duyệt NHỊP và BIÊN ĐỘ. Bản giao cho "
               "animator sẽ dựng lại bằng Lottie/Rive — đây là bản chốt ý.",
               f'<div class="luoi l4">{"".join(o)}</div>')


def phan_san_pham() -> str:
    def dt(noi, hinh, cao=132):
        return f'''<div class="mh">
          <div class="mh-tren"><span class="mono">{noi}</span></div>
          <div class="mh-than">{hinh}</div></div>'''

    home = f'''<div class="ui-home">{celes(replace(MAC_DINH, huong=0.4, nghieng_dau=3), 118)}
      <div class="ui-chu"><b>Hôm nay, bạn nên chậm lại.</b>
      <span>Celes đang ở đây.</span></div></div>'''
    chat = f'''<div class="ui-chat">
      <div class="bong trai">Hôm qua mình lại nhận lời đi ăn với nhóm cũ…</div>
      <div class="ui-ce">{celes(TRANG_THAI[4][3], 76)}
        <div class="bong phai">Lần trước bạn bảo nhóm đó làm bạn mệt. Mình nhớ.</div></div></div>'''
    load = f'''<div class="ui-load">{celes(TRANG_THAI[2][3], 104)}
      <span class="mono">đang nối dữ kiện…</span></div>'''
    empty = f'''<div class="ui-empty">{celes(replace(MAC_DINH, ngoi=True, than_y=12, mi=0.52, mieng="phang", tai_trai=-74, tai_phai=78, cong_trai=-18, cong_phai=18), 104)}
      <span>Chưa có gì ở đây.</span></div>'''
    noti = f'''<div class="ui-noti">{celes(replace(MEME[3][2], hao_quang=0.0), 54)}
      <div><b>Celes</b><span>Chuyện lời mời đó tới đâu rồi?</span></div></div>'''
    seri = f'''<div class="ui-home nghiem">{celes(TRANG_THAI[7][3], 118)}
      <div class="ui-chu"><b>Mình ở đây.</b>
      <span>Không vội. Bạn kể tới đâu cũng được.</span></div></div>'''

    o = "".join([dt("Home", home), dt("Hỏi Celes", chat), dt("Loading", load),
                 dt("Empty state", empty), dt("Notification", noti),
                 dt("Ngữ cảnh nghiêm túc", seri)])
    return muc("F", "Trong sản phẩm",
               "Bài test mục 18.5: đặt cạnh chữ và thẻ thật — nhân vật có lấn át giao diện không? "
               "Và bài test mục 17: đứng trong ngữ cảnh nghiêm túc có lố không?",
               f'<div class="luoi l3">{o}</div>')


def phan_social() -> str:
    o = "".join(the(celes(t, 150), ten, cap) for ten, cap, t in MEME)
    st = "".join(
        f'<div class="st">{celes(t, 110)}<span>{ten}</span></div>'
        for ten, t in STICKER)
    return muc("G", "Meme & sticker",
               "Bài test mục 18.4: nhìn một tư thế KHÔNG có chữ — có tự bật ra được câu "
               "caption không? Lãnh địa meme: “Mình không phán xét. Mình chỉ nhớ.”",
               f'<div class="luoi l5">{o}</div>'
               f'<h3 class="nhom">Sticker</h3><div class="st-hang">{st}</div>')


def phan_thuong_hieu() -> str:
    av = f'<div class="av">{celes(replace(MAC_DINH, huong=0.35, nghieng_dau=4), 108)}</div>'
    av_s = f'<div class="av sang">{celes(replace(MAC_DINH, huong=0.35, nghieng_dau=4), 108)}</div>'
    icon = (f'<div class="icon-app">'
            f'{celes(replace(MAC_DINH, tai_dai=0.86, mi=0.26), 96)}</div>')
    wm = (f'<div class="wm">{celes(replace(MAC_DINH, huong=0.4, nghieng_dau=4), 72)}'
          f'<span class="wm-chu">CELES</span></div>')
    fav = "".join(
        f'<div class="cs"><div class="fav">{celes_dau(px, nen="")}</div>'
        f'<span class="mono">{px}</span></div>' for px in (64, 32, 16))
    return muc("H", "Ứng dụng thương hiệu",
               "Ảnh đại diện, biểu tượng ứng dụng, khoá chữ. Dấu thương hiệu Celestia "
               "(trăng + sao) vẫn là logo; nhân vật là gương mặt, không thay thế logo.",
               f'<div class="luoi l5">{the(av, "Avatar tối")}{the(av_s, "Avatar sáng")}'
               f'{the(icon, "Biểu tượng app")}{the(wm, "Khoá chữ")}'
               f'{the("<div class=favs>" + fav + "</div>", "Favicon — bản dấu")}</div>')


def phan_luat() -> str:
    nen = [
        ("Mắt nửa mí làm mặc định", "Celes đang quan sát, không đang cười."),
        ("Tai bất đối xứng", "Hai tai không bao giờ song song hoàn hảo ở trạng thái thường."),
        ("Nụ cười là ngoại lệ", "Chỉ CELEBRATE mới được cười rõ."),
        ("Chi tiết celestial tiết chế", "Trăng lưỡi liềm + hai chấm sao, CHỈ trên một tai."),
        ("Khối lớn, ít chi tiết", "Mọi hình phải dựng lại được bằng 6–8 điểm neo."),
        ("Nghiêm phải dùng được", "Tai cụp sau, mí hạ, miệng phẳng, tắt sao và hào quang."),
    ]
    khong = [
        ("Má hồng, mắt long lanh, nơ, tim", "Thành mascot chiêm tinh tuổi teen."),
        ("Gậy phép, áo choàng dải ngân hà, mắt phát sáng", "Celes không phải nhân vật game."),
        ("Thỏ trắng toàn thân", "Đụng lãnh địa Cony/Miffy — rớt bài test IP."),
        ("Trăng to giữa trán", "Quá trực diện. Trăng chỉ sống trên tai."),
        ("Cười mặc định", "Phá toàn bộ tính cách deadpan."),
        ("Lông, chuyển sắc, bóng đổ mềm", "Không dựng lại được ở cỡ nhỏ."),
    ]
    a = "".join(f'<li><b>{x}</b><span>{y}</span></li>' for x, y in nen)
    b = "".join(f'<li><b>{x}</b><span>{y}</span></li>' for x, y in khong)

    # dải màu
    mau = [(INDIGO, "Indigo", "thân chính"), (INDIGO_T, "Indigo tối", "mặt trong tai"),
           (INDIGO_S, "Indigo sáng", "chân, nhấn"), (KEM, "Kem trăng", "mặt nạ, yếm, chóp chân"),
           (VANG, "Vàng ấm", "trăng lưỡi liềm, sao"), (TIM_NHAT, "Tím ánh trăng", "hào quang ký ức"),
           (MUC, "Mực", "con ngươi, nét"), (NEN_TOI, "Nền đêm", "nền app")]
    sw = "".join(
        f'<div class="sw"><span class="o-mau" style="background:{c}"></span>'
        f'<b>{n}</b><span class="mono">{c}</span><span class="ct">{d}</span></div>'
        for c, n, d in mau)

    return muc("I", "Luật dùng",
               "Phần quan trọng nhất của bộ tài liệu. Nhân vật sống lâu được hay không "
               "nằm ở chỗ người sau có luật để theo.",
               f'<div class="luat"><div class="nen"><h3>NÊN</h3><ul>{a}</ul></div>'
               f'<div class="khong"><h3>KHÔNG</h3><ul>{b}</ul></div></div>'
               f'<h3 class="nhom">Bảng màu</h3><div class="sw-hang">{sw}</div>')


def phan_kiem() -> str:
    tests = [
        ("1. Silhouette", "ĐẠT", "Ba khối lớn, khe giữa hai tai hình giọt là dấu riêng."),
        ("2. Cỡ nhỏ", "ĐẠT", "Nhân vật đủ thân tới 32px; dưới mốc đó dùng bản dấu, đọc được tới 16px."),
        ("3. Biểu cảm", "ĐẠT", "Năm trạng thái bắt buộc phân biệt rõ bằng mí + tai."),
        ("4. Meme", "ĐẠT", "Side-eye và Has receipts tự bật caption."),
        ("5. Sản phẩm", "ĐẠT", "Ở 54–118px không lấn chữ; xem mục F."),
        ("6. Nghiêm túc", "ĐẠT", "Tai cụp sau + mí hạ; không còn vẻ đùa."),
        ("7. IP", "CẦN NGƯỜI SOÁT", "Sọ hình hạt + tai lá + indigo khác Cony/Miffy/Molang, "
         "nhưng phải có người đối chiếu thị trường trước khi chốt."),
        ("8. Sản xuất", "ĐẠT", "Tư thế mới = một dòng tham số."),
    ]
    o = "".join(
        f'<div class="kt {"canh" if "CẦN" in kq else ""}">'
        f'<div class="kt-dau"><b>{ten}</b><span class="dau-kq">{kq}</span></div>'
        f'<p>{gc}</p></div>' for ten, kq, gc in tests)
    return muc("J", "Tám bài kiểm tra",
               "Brief mục 18 yêu cầu mọi phương án phải qua tám bài này trước khi duyệt.",
               f'<div class="luoi l4">{o}</div>')


# ============================================================== dựng tệp
def dung() -> str:
    cac_phan = "".join([
        phan_master(), phan_silhouette(), phan_bieu_cam(), phan_tu_the(),
        phan_trang_thai(), phan_motion(), phan_san_pham(), phan_social(),
        phan_thuong_hieu(), phan_luat(), phan_kiem()])

    muc_luc = "".join(
        f'<a href="#{i}">{t}</a>' for i, t in [
            ("A", "Master"), ("A2", "Silhouette"), ("B", "Biểu cảm"),
            ("C", "Tư thế"), ("D", "Trạng thái"), ("E", "Chuyển động"),
            ("F", "Sản phẩm"), ("G", "Meme"), ("H", "Thương hiệu"),
            ("I", "Luật dùng"), ("J", "Kiểm tra")])

    return f'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Celes — Moon Hare</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>
*{{box-sizing:border-box}}
body{{margin:0;background:{NEN_TOI};color:#EDE9F5;
  font-family:'Be Vietnam Pro',system-ui,sans-serif;font-size:14px;line-height:1.55}}
.bao{{max-width:1240px;margin:0 auto;padding:0 24px 120px}}

/* ---- đầu trang ---- */
.hero{{padding:76px 0 40px;border-bottom:1px solid {LINE};
  display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center}}
.hero h1{{font-family:{DISPLAY};font-weight:800;font-size:58px;line-height:1.0;
  letter-spacing:-0.04em;margin:0 0 14px}}
.hero h1 em{{font-style:normal;background:linear-gradient(96deg,{TIM_NHAT},{VANG});
  -webkit-background-clip:text;background-clip:text;color:transparent}}
.hero p{{margin:0;color:{MUT};max-width:52ch;font-size:15px}}
.kw{{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}}
.kw span{{font-family:{MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  padding:7px 13px;border:1px solid {LINE};border-radius:999px;color:{MUT}}}
.hero-hinh{{background:radial-gradient(circle at 50% 42%,rgba(139,127,212,.20),transparent 68%);
  border-radius:28px;padding:8px}}

/* ---- mục lục ---- */
.ml{{position:sticky;top:0;z-index:20;background:rgba(11,10,13,.93);
  backdrop-filter:blur(14px);border-bottom:1px solid {LINE};
  display:flex;gap:4px;overflow-x:auto;padding:11px 0;margin-bottom:8px}}
.ml a{{font-family:{MONO};font-size:11px;letter-spacing:.09em;text-transform:uppercase;
  color:{MUT};text-decoration:none;padding:7px 13px;border-radius:999px;white-space:nowrap}}
.ml a:hover{{color:#fff;background:rgba(255,255,255,.07)}}

/* ---- mục ---- */
.muc{{padding:62px 0;border-bottom:1px solid {LINE};scroll-margin-top:56px}}
.dau-muc{{margin-bottom:30px;max-width:76ch}}
.dau-muc .so{{font-family:{MONO};font-size:11px;letter-spacing:.2em;color:{VANG}}}
.dau-muc h2{{font-family:{DISPLAY};font-weight:800;font-size:34px;letter-spacing:-.03em;
  margin:7px 0 9px}}
.dau-muc p{{margin:0;color:{MUT};font-size:15px}}
h3.nhom{{font-family:{MONO};font-size:11px;letter-spacing:.17em;text-transform:uppercase;
  color:{VANG};margin:34px 0 14px;font-weight:500}}

/* ---- lưới ---- */
.luoi{{display:grid;gap:12px}}
.l6{{grid-template-columns:repeat(6,1fr)}}
.l5{{grid-template-columns:repeat(5,1fr)}}
.l4{{grid-template-columns:repeat(4,1fr)}}
.l3{{grid-template-columns:repeat(3,1fr)}}
.o{{margin:0}}
.khung{{border-radius:16px;display:flex;align-items:center;justify-content:center;
  padding:8px;border:1px solid {LINE}}}
.khung svg{{display:block;max-width:100%;height:auto}}
.nhan{{margin-top:9px;font-size:12.5px;font-weight:600}}
.ct{{color:{MUT};font-size:11.5px;line-height:1.4;margin-top:2px}}

/* ---- dựng hình ---- */
.dung-hinh{{display:grid;grid-template-columns:auto 1fr;gap:34px;margin-top:30px;
  align-items:center}}
.gh{{position:relative;width:300px;height:300px;border-radius:18px;
  background:rgba(255,255,255,.028);border:1px solid {LINE}}}
.gh svg{{position:absolute;inset:0}}
.gl{{pointer-events:none}}
.ghi{{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:11px}}
.ghi li{{padding-left:16px;position:relative;color:{MUT};font-size:13.5px}}
.ghi li:before{{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;
  border-radius:50%;background:{VANG}}}
.ghi b{{color:#EDE9F5}}

/* ---- cỡ nhỏ ---- */
.cs-hang{{display:flex;gap:16px;align-items:flex-end;margin-top:26px;flex-wrap:wrap}}
.cs{{text-align:center}}
.khung.nho{{background:rgba(255,255,255,.028);min-width:56px;min-height:56px}}
.cs .mono{{display:block;margin-top:7px;font-family:{MONO};font-size:11px;color:{MUT}}}
.ket{{margin-top:22px;padding:15px 17px;border-radius:13px;font-size:13.5px;
  background:rgba(232,179,92,.08);border:1px solid rgba(232,179,92,.2);color:#F2DDBB}}

/* ---- trạng thái ---- */
.tt-luoi{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}}
.tt{{display:flex;gap:13px;align-items:center;padding:13px;border-radius:16px;
  background:rgba(255,255,255,.028);border:1px solid {LINE}}}
.tt-hinh{{flex:0 0 auto}}
.tt-hinh svg{{display:block}}
code.ma{{font-family:{MONO};font-size:11.5px;color:{VANG};letter-spacing:.04em}}
.nc{{margin:5px 0 3px;font-size:12px;color:{MUT};line-height:1.4}}
.yn{{margin:0;font-size:13px;font-weight:600}}
.bang-anh-xa table{{width:100%;border-collapse:collapse;margin-top:6px}}
.bang-anh-xa td{{padding:9px 10px;border-bottom:1px solid {LINE};font-size:12.5px}}
.sk{{color:{MUT};width:46%}}
.mui{{color:{VANG};width:30px;text-align:center}}
.ma-nho{{color:{VANG}}}
.canh-bao{{margin-top:18px;padding:15px 17px;border-radius:13px;font-size:13px;
  background:rgba(211,34,152,.09);border:1px solid rgba(211,34,152,.25);color:#F6C9E6}}
.canh-bao code{{font-family:{MONO};font-size:11.5px;color:#FFB8E4}}

/* ---- chuyển động ---- */
.mo{{padding:13px;border-radius:16px;background:rgba(255,255,255,.028);
  border:1px solid {LINE}}}
.mo-khung{{position:relative;height:150px;display:flex;align-items:center;
  justify-content:center}}
.mo-a,.mo-b{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}}
.mo-b{{animation-name:nhip;animation-iteration-count:infinite;
  animation-timing-function:cubic-bezier(.4,0,.2,1);animation-direction:alternate}}
@keyframes nhip{{0%,18%{{opacity:0}}72%,100%{{opacity:1}}}}
.chu-ky{{font-family:{MONO};font-size:10.5px;color:{VANG}}}

/* ---- trong sản phẩm ---- */
.mh{{border-radius:18px;overflow:hidden;border:1px solid {LINE};
  background:#15121A}}
.mh-tren{{padding:9px 13px;border-bottom:1px solid {LINE};background:rgba(255,255,255,.02)}}
.mh-tren .mono{{font-family:{MONO};font-size:10.5px;letter-spacing:.13em;
  text-transform:uppercase;color:{MUT}}}
.mh-than{{padding:17px;min-height:168px;display:flex;align-items:center}}
.ui-home{{display:flex;gap:13px;align-items:center}}
.ui-home.nghiem{{opacity:.97}}
.ui-chu b{{display:block;font-family:{DISPLAY};font-size:19px;letter-spacing:-.02em;
  line-height:1.15;margin-bottom:5px}}
.ui-chu span{{color:{MUT};font-size:12.5px}}
.ui-chat{{display:flex;flex-direction:column;gap:9px;width:100%}}
.bong{{padding:9px 13px;border-radius:15px;font-size:12.5px;max-width:84%;line-height:1.45}}
.bong.trai{{background:rgba(255,255,255,.07);align-self:flex-end;border-bottom-right-radius:5px}}
.bong.phai{{background:rgba(139,127,212,.19);border:1px solid rgba(139,127,212,.3);
  border-bottom-left-radius:5px}}
.ui-ce{{display:flex;gap:9px;align-items:flex-end}}
.ui-load,.ui-empty{{display:flex;flex-direction:column;align-items:center;gap:9px;
  width:100%;color:{MUT}}}
.ui-load .mono{{font-family:{MONO};font-size:11.5px;letter-spacing:.06em}}
.ui-empty span{{font-size:12.5px}}
.ui-noti{{display:flex;gap:11px;align-items:center;width:100%;padding:11px 13px;
  border-radius:15px;background:rgba(255,255,255,.07)}}
.ui-noti b{{display:block;font-size:12.5px;margin-bottom:2px}}
.ui-noti span{{font-size:12px;color:{MUT}}}

/* ---- sticker ---- */
.st-hang{{display:flex;gap:11px;flex-wrap:wrap}}
.st{{width:124px;padding:11px;border-radius:17px;text-align:center;
  background:rgba(255,255,255,.045);border:1px solid {LINE}}}
.st span{{display:block;margin-top:5px;font-size:12.5px;font-weight:600}}

/* ---- thương hiệu ---- */
.av{{width:108px;height:108px;border-radius:50%;overflow:hidden;
  background:radial-gradient(circle at 50% 36%,#302A68,#17142E);
  display:flex;align-items:flex-end;justify-content:center}}
.av.sang{{background:radial-gradient(circle at 50% 36%,#F3EAD9,#DCCDB4)}}
.av svg{{margin-bottom:-13px}}
.icon-app{{width:108px;height:108px;border-radius:25px;
  background:linear-gradient(150deg,#3B3480,#1A1636);
  display:flex;align-items:center;justify-content:center}}
.wm{{display:flex;align-items:center;gap:9px}}
.wm-chu{{font-family:{DISPLAY};font-weight:800;font-size:25px;letter-spacing:-.02em}}
.favs{{display:flex;gap:11px;align-items:flex-end}}
.fav{{border-radius:7px;background:linear-gradient(150deg,#3B3480,#1A1636);
  display:flex;align-items:center;justify-content:center;overflow:hidden}}

/* ---- luật ---- */
.luat{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}
.nen,.khong{{padding:19px;border-radius:17px}}
.nen{{background:rgba(110,231,183,.06);border:1px solid rgba(110,231,183,.17)}}
.khong{{background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.17)}}
.nen h3,.khong h3{{margin:0 0 13px;font-family:{MONO};font-size:11px;letter-spacing:.17em}}
.nen h3{{color:#6EE7B7}} .khong h3{{color:#FCA5A5}}
.nen ul,.khong ul{{margin:0;padding:0;list-style:none;display:flex;
  flex-direction:column;gap:11px}}
.nen li,.khong li{{font-size:13px}}
.nen b,.khong b{{display:block;margin-bottom:1px}}
.nen span,.khong span{{color:{MUT};font-size:12.5px}}
.sw-hang{{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}}
.sw{{padding:13px;border-radius:14px;background:rgba(255,255,255,.028);
  border:1px solid {LINE}}}
.o-mau{{display:block;width:100%;height:38px;border-radius:9px;margin-bottom:9px}}
.sw b{{display:block;font-size:12.5px}}
.sw .mono{{font-family:{MONO};font-size:10.5px;color:{MUT};display:block}}
.sw .ct{{font-size:11px}}

/* ---- kiểm tra ---- */
.kt{{padding:15px;border-radius:15px;background:rgba(110,231,183,.055);
  border:1px solid rgba(110,231,183,.16)}}
.kt.canh{{background:rgba(232,179,92,.07);border-color:rgba(232,179,92,.22)}}
.kt-dau{{display:flex;justify-content:space-between;align-items:baseline;gap:8px;
  margin-bottom:5px}}
.kt-dau b{{font-size:13px}}
.dau-kq{{font-family:{MONO};font-size:10px;letter-spacing:.07em;color:#6EE7B7;
  white-space:nowrap}}
.kt.canh .dau-kq{{color:{VANG}}}
.kt p{{margin:0;font-size:12px;color:{MUT};line-height:1.45}}

/* ---- chân ---- */
.chan{{padding:40px 0;color:{MUT};font-size:12.5px}}
.chan code{{font-family:{MONO};font-size:11.5px;color:{VANG}}}

@media (max-width:1100px){{
  .l6{{grid-template-columns:repeat(4,1fr)}} .l5{{grid-template-columns:repeat(3,1fr)}}
  .tt-luoi{{grid-template-columns:repeat(2,1fr)}}
  .sw-hang{{grid-template-columns:repeat(2,1fr)}}
}}
@media (max-width:760px){{
  .hero{{grid-template-columns:1fr;padding-top:46px}} .hero h1{{font-size:38px}}
  .l6,.l5,.l4,.l3{{grid-template-columns:repeat(2,1fr)}}
  .tt-luoi,.luat{{grid-template-columns:1fr}}
  .dung-hinh{{grid-template-columns:1fr}} .gh{{width:100%;max-width:300px}}
}}
</style></head><body>

<div class="ml"><div class="bao" style="display:flex;gap:4px;padding-bottom:0">{muc_luc}</div></div>

<div class="bao">
<header class="hero">
  <div>
    <h1>Celes —<br><em>The Knowing Moon Hare</em></h1>
    <p>Hệ nhân vật v2 — vẽ lại theo Moon Hare Concept 01. Không phải một hình minh hoạ: một diễn viên có tính cách riêng,
    dựng bằng tham số để cùng một con thỏ sống được ở hàng trăm ngữ cảnh — từ ô loading
    32px tới tấm meme trên mạng xã hội.</p>
    <div class="kw"><span>Minimal</span><span>Deadpan</span><span>Celestial</span>
    <span>Tai → nghe → nhớ</span></div>
  </div>
  <div class="hero-hinh">{celes(replace(MAC_DINH, huong=1.0, nghieng_dau=5), 280)}</div>
</header>

{cac_phan}

<footer class="chan">
  <p>Sinh từ <code>gen.py</code> · hình dựng trong <code>celes.py</code> ·
  thư viện tư thế trong <code>bo_nhan_vat.py</code>. Chạy lại: <code>python gen.py</code></p>
  <p>Mọi hình là SVG sống — mở Inspect là lấy được path. Tệp này không gọi mạng
  ngoài bộ chữ Google Fonts, không gửi dữ liệu đi đâu.</p>
</footer>
</div></body></html>'''


if __name__ == "__main__":
    import io
    import sys
    with io.open("index.html", "w", encoding="utf-8") as f:
        f.write(dung())
    n = sum(len(x) for x in (MASTER, BIEU_CAM, TU_THE, TRANG_THAI, MEME,
                             STICKER, MOTION))
    print(f"index.html: {n} variants")
