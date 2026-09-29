# -*- coding: utf-8 -*-
# Sinh canvas "Celes iOS — giao diện Aurora"
import json, os, datetime

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "project")
os.makedirs(OUT, exist_ok=True)

# ---------- token ----------
# Bản 8: nền gần đen (theo góp ý senior UI/UX — bản 7 nền tím quá sáng), mỗi luồng một VÙNG MÀU
# để người dùng biết mình đang ở đâu. Màu vùng đi vào: quầng sáng nền, chữ nhấn, thẻ chính, tab đang chọn.
BASE = "#0B0A0D"
TEXT = "#F3F1F4"
MUTED = "rgba(243,241,244,0.60)"
LINE = "rgba(255,255,255,0.08)"
ACCENT = "#F28AC9"
GOLD = "#FFCB0F"
INK = "#240029"
FUCHSIA = "#D32298"
HERO = "linear-gradient(145deg, #FFBDD3 0%, #FFF1BD 45%, #FFF1BD 58%, #FFCB0F 100%)"
GLASS = "background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025)); border: 1px solid rgba(255,255,255,0.075); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px)"
GRADTEXT = "background: linear-gradient(95deg, #FFBDD3 0%, #FFF1BD 50%, #FFCB0F 100%); -webkit-background-clip: text; background-clip: text; color: transparent"

# (tên, màu chính, màu sáng cho chữ gradient, rgb, [quầng sáng: (vị trí, kích thước, rgb, độ đậm)])
ZONES = {
    "celes":     ("Celes", "#F28AC9", "#FFD0EA", "242,138,201", [("50% -8%", "95% 42%", "211,34,152", 0.30), ("110% 60%", "60% 40%", "242,138,201", 0.08)]),
    "khoidau":   ("Khởi đầu", "#F6A96B", "#FFE0B8", "246,169,107", [("50% 112%", "120% 48%", "246,150,90", 0.30), ("50% 118%", "80% 30%", "226,59,168", 0.22)]),
    "homnay":    ("Hôm nay", "#F5C451", "#FFE9A8", "245,196,81", [("100% -6%", "85% 40%", "245,180,60", 0.20), ("-10% 45%", "60% 35%", "242,138,201", 0.06)]),
    "laso":      ("Lá số", "#A393FF", "#DCD5FF", "163,147,255", [("0% -4%", "90% 40%", "120,100,255", 0.22), ("110% 70%", "60% 40%", "163,147,255", 0.07)]),
    "hanhtrinh": ("Hành trình", "#5CD3BE", "#C4F5EA", "92,211,190", [("100% -4%", "85% 40%", "60,190,170", 0.20), ("-10% 80%", "60% 35%", "92,211,190", 0.06)]),
    "moiquanhe": ("Mối quan hệ", "#FF8F80", "#FFD6CF", "255,143,128", [("-6% -4%", "70% 36%", "255,120,110", 0.18), ("106% 8%", "70% 36%", "226,59,168", 0.14)]),
    "toi":       ("Tài khoản", "#C9C4CE", "#FFFFFF", "201,196,206", []),
}
ZCUR = "celes"


def zone_bg(z):
    _, _, _, _, glows = ZONES[z]
    layers = [f"radial-gradient({s} at {p}, rgba({rgb},{a}) 0%, rgba({rgb},0) 100%)" for p, s, rgb, a in glows]
    return "background: " + ", ".join(layers + [BASE])


def zone_hero(z=None, pad=True):
    # thẻ chính của vùng: nền tối, quầng màu vùng ở góc, viền mảnh cùng màu — thay mảng pastel chói của bản 7
    rgb = ZONES[z or ZCUR][3]
    return (f"background: radial-gradient(110% 90% at 100% 0%, rgba({rgb},0.20) 0%, rgba({rgb},0) 62%), linear-gradient(180deg, #19161D, #121015); "
            f"border: 1px solid rgba({rgb},0.30); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.5)")


def zone_on(z=None):
    # lựa chọn đang bật (tab con, chip): nền màu vùng rất nhạt, chữ màu vùng sáng
    _, c, light, rgb, _ = ZONES[z or ZCUR]
    return f"background: rgba({rgb},0.16); box-shadow: inset 0 0 0 1px rgba({rgb},0.40); color: {light}"


def set_zone(z):
    # đổi vùng cho các màn sinh tiếp theo: chữ nhấn, chữ gradient đi theo màu vùng
    global ZCUR, ACCENT, GRADTEXT
    ZCUR = z
    _, c, light, _, _ = ZONES[z]
    ACCENT = c
    GRADTEXT = f"background: linear-gradient(95deg, {light} 0%, {c} 100%); -webkit-background-clip: text; background-clip: text; color: transparent"
    DARK.update(accent=ACCENT, gradtext=GRADTEXT, bg=zone_bg(z))
DISPLAY = "font-family: 'Bricolage Grotesque', 'Be Vietnam Pro', system-ui, sans-serif"
VOICE = "font-family: 'Newsreader', Georgia, serif; font-style: italic"
MONO = "font-family: 'JetBrains Mono', ui-monospace, monospace"
EYEBROW = f"{MONO}; font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase"
CTA = f"height: 56px; border-radius: 14px; background: linear-gradient(135deg, #E23BA8 0%, {FUCHSIA} 55%, #A8157E 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 24px rgba(211,34,152,0.28); color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 700; text-decoration: none"
BG = zone_bg("celes")

FONTS = ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800"
         "&amp;family=Be+Vietnam+Pro:wght@400;500;600;700"
         "&amp;family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500"
         "&amp;family=JetBrains+Mono:wght@500&amp;display=swap")

HELMET = f"""<helmet>
<link rel="stylesheet" href="{FONTS}">
<style>
body{{margin:0;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:{TEXT};background:{BASE}}}
a{{color:{ACCENT}}}a:hover{{color:#FFB3E0}}
button{{font-family:inherit;cursor:pointer}}
input::placeholder{{color:rgba(243,241,244,0.50)}}
@keyframes celes-tho{{0%,100%{{transform:scale(1) rotate(0deg);filter:hue-rotate(0deg)}}50%{{transform:scale(1.06) rotate(12deg);filter:hue-rotate(-18deg)}}}}
@keyframes celes-troi{{0%,100%{{transform:translate(0,0)}}50%{{transform:translate(-18px,14px)}}}}
@keyframes celes-vong{{to{{transform:rotate(360deg)}}}}
@keyframes celes-nhip{{0%,100%{{opacity:.55}}50%{{opacity:1}}}}
@media (prefers-reduced-motion: reduce){{*{{animation:none!important}}}}
</style>
</helmet>"""

# ---------- icon (nét 1.75, bo tròn, lưới 24) ----------
IC = {
 "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 "path": '<path d="M4 19c4 0 4-6 8-6s4-6 8-6"/><circle cx="4" cy="19" r="1.6"/><circle cx="20" cy="7" r="1.6"/>',
 "rel": '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 "briefcase": '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
 "coin": '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3c-.6-.8-1.5-1.3-2.6-1.3-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.6-1.3M12 6.5V8M12 16v1.5"/>',
 "heart": '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
 "home": '<path d="M4 11l8-6.5 8 6.5V19.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
 "sparkle": '<path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
 "leaf": '<path d="M5 19.5C5 11 10 5.5 19.5 4.5 19.5 14 14 19.5 5 19.5z"/><path d="M5 19.5l7.5-7.5"/>',
 "sign": '<path d="M12 3v18"/><path d="M6 5.5h10.5L19 8l-2.5 2.5H6z"/><path d="M18 13.5H7.5L5 16l2.5 2.5H18z"/>',
 "eye": '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "back": '<path d="M15 5l-7 7 7 7"/>',
 "chev": '<path d="M9 5l7 7-7 7"/>',
 "up": '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>',
 "plus": '<path d="M12 5v14M5 12h14"/>',
 "bell": '<path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.5 7 2.5 7h-17S6 15 6 9.5z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 "wave": '<path d="M3 12c2 0 2-4 4.5-4S10 16 12.5 16 15 8 17.5 8 19 12 21 12"/>',
 "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
 "book": '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
 "memory": '<path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 3.6 2.5 4.8.8.8 1.5 1.7 1.5 3.2h4c0-1.5.7-2.4 1.5-3.2C16.8 12.6 18 11.2 18 9a6 6 0 0 0-6-6z"/><path d="M10 20.5h4"/>',
 "shield": '<path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z"/>',
 "moon": '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 "trash": '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/>',
 "mail": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>',
 "bookmark": '<path d="M6.5 4h11v16.5L12 16.5l-5.5 4z"/>',
 "radar": '<path d="M12 3l8 5.5-3 9.5H7L4 8.5z"/><path d="M12 8l3.5 2.5-1.3 4.2H9.8l-1.3-4.2z"/>',
 "new": '<path d="M12 20H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V12"/><path d="M17 15v6M14 18h6"/>',
}
APPLE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.8zM14.1 5.9c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z"/></svg>'


def ic(name, size=22, sw=1.75, color="currentColor"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{IC[name]}</svg>')


# ---------- dấu thương hiệu (bộ logo 29/09/2026, cùng hình với components/Logo.tsx) ----------
def dau_celestia(size, glow=True):
    """Trăng khuyết + sao bốn cánh; khung nhìn cắt sát hình rồi nới 30%, căn giữa theo hình"""
    canh = 580 * 1.3; x0 = 431.5 - canh / 2; y0 = 512 - canh / 2
    g = "filter: drop-shadow(0 0 22px rgba(246,195,138,0.35)) drop-shadow(0 0 48px rgba(155,107,255,0.35));" if glow else ""
    return (f'<svg aria-hidden="true" width="{size}" height="{size}" viewBox="{x0} {y0} {canh} {canh}" style="display: block; flex-shrink: 0; {g}">'
            '<defs><linearGradient id="dau-trang" x1="319.5" y1="787" x2="666" y2="264.5" gradientUnits="userSpaceOnUse">'
            '<stop stop-color="#9B6BFF"/><stop offset="0.47" stop-color="#F6C38A"/><stop offset="1" stop-color="#FFF1CC"/></linearGradient>'
            '<radialGradient id="dau-sao"><stop stop-color="#FFF8DD"/><stop offset="0.55" stop-color="#FFF1CC"/><stop offset="1" stop-color="#F6C38A"/></radialGradient></defs>'
            '<path fill="url(#dau-trang)" d="M528.92 237.52A275 275 0 1 0 528.92 786.48A300 300 0 0 1 528.92 237.52Z"/>'
            '<path fill="url(#dau-sao)" d="M535 421C555.02 491.98 555.02 491.98 626 512C555.02 532.02 555.02 532.02 535 603C514.98 532.02 514.98 532.02 444 512C514.98 491.98 514.98 491.98 535 421Z"/></svg>')


def orb(size, anim=True, glow=True):
    a = "animation: celes-tho 7s ease-in-out infinite;" if anim else ""
    g = f"box-shadow: 0 0 {size//2}px rgba(255,139,208,0.55), inset -{size//8}px -{size//8}px {size//4}px rgba(90,10,94,0.55);" if glow else ""
    return (f'<span aria-hidden="true" style="display: block; width: {size}px; height: {size}px; border-radius: 999px; flex-shrink: 0; '
            f'background: radial-gradient(circle at 32% 28%, #FFFFFF 0%, #FFF1BD 14%, #FFBDD3 38%, #E23BA8 66%, #6A0B6E 100%); {g} {a}"></span>')


STATUS = f"""<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 0; height: 50px; box-sizing: border-box; padding: 16px 30px 0 34px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 5; color: {TEXT}">
<span style="font-size: 16px; font-weight: 600; letter-spacing: -0.01em">9:41</span>
<span style="display: flex; gap: 6px; align-items: center; padding-top: 3px">
<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3C13.3 1.5 10.8.4 8 .4S2.7 1.5.8 3.3L2 4.6c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3C11.4 4.7 9.8 4 8 4s-3.4.7-4.6 1.8l1.2 1.3C5.5 6.3 6.7 5.8 8 5.8zm0 3.5c.5 0 .9.2 1.2.5L8 11.2 6.8 9.8c.3-.3.7-.5 1.2-.5z"/></svg>
<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.4"/></svg>
</span>
</div>"""

HOMEBAR = '<div aria-hidden="true" style="position: absolute; left: 128px; bottom: 8px; width: 134px; height: 5px; border-radius: 3px; background: rgba(255,244,250,0.55); z-index: 6"></div>'

GLOWS = ""


def zone_deco(z):
    # dấu riêng của từng vùng, nằm sau nội dung
    import random
    if z == "laso":  # bầu trời sao
        r = random.Random(7)
        dots = "".join(f'<circle cx="{r.randint(0, 390)}" cy="{r.randint(0, 520)}" r="{r.choice([0.6, 0.8, 1, 1.3])}" fill="#FFFFFF" opacity="{r.choice([0.18, 0.28, 0.4, 0.55])}"/>' for _ in range(46))
        return f'<svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0; pointer-events: none">{dots}</svg>'
    if z == "khoidau":  # đường chân trời lúc bình minh
        return ('<svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0; pointer-events: none"><defs><linearGradient id="kd-ct" x1="0" x2="1"><stop offset="0" stop-color="#F6A96B" stop-opacity="0"/><stop offset="0.5" stop-color="#FFD9A8" stop-opacity="0.55"/><stop offset="1" stop-color="#E23BA8" stop-opacity="0"/></linearGradient></defs>'
                '<ellipse cx="195" cy="1180" rx="520" ry="420" fill="none" stroke="url(#kd-ct)" stroke-width="1.2"/></svg>')
    if z == "hanhtrinh":  # vệt quỹ đạo thời gian
        return ('<svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0; pointer-events: none"><g fill="none" stroke="#5CD3BE" stroke-opacity="0.10"><circle cx="390" cy="0" r="180"/><circle cx="390" cy="0" r="260" stroke-dasharray="2 7"/></g></svg>')
    return ""

IC["laso"] = '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/><path d="M3.5 8.5h5M15.5 8.5h5M3.5 15.5h5M15.5 15.5h5M8.5 3.5v5M15.5 3.5v5M8.5 15.5v5M15.5 15.5v5"/>'
IC["share"] = '<path d="M12 3.5v11M7.5 8L12 3.5 16.5 8"/><path d="M5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6"/>'
IC["x"] = '<path d="M6 6l12 12M18 6L6 18"/>'
IC["compass"] = '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'
IC["users"] = '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14.5 14.2c.6-.2 1.3-.3 2-.3 2.5 0 4 1.9 4 4.6"/>'
IC["cap"] = '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4c1.5 1.5 3.3 2 5.5 2s4-.5 5.5-2v-4"/>'
IC["baby"] = '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 15c1.4 1.1 3.6 1.1 5 0M12 3.5c-1 1.2-1 2.3 0 3"/><circle cx="9.3" cy="11" r="0.7"/><circle cx="14.7" cy="11" r="0.7"/>'
IC["tree"] = '<circle cx="12" cy="5.5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 8v4M6 15.5V12h12v3.5"/>'
IC["caret"] = '<path d="M7 10l5 5 5-5"/>'

# ---------- hai chế độ: đêm (mặc định) và sáng ----------
DARK = dict(
    name="dem", text=TEXT, muted=MUTED, accent=ACCENT, glass=GLASS, bg=BG, base=BASE, glows=GLOWS,
    gradtext=GRADTEXT, voice="#ECE3EF", line="rgba(255,255,255,0.07)",
    navbg="rgba(17,15,20,0.92)", navline="rgba(255,255,255,0.08)", navshadow="0 18px 40px rgba(0,0,0,0.6)",
    navoff="rgba(243,241,244,0.52)", navon="rgba(255,255,255,0.08)", fade="11,10,13",
    good=("rgba(74,222,128,0.13)", "#86EFAC"), warn=("rgba(240,164,75,0.15)", "#FBC98A"), mid=("rgba(255,255,255,0.07)", "rgba(243,241,244,0.78)"),
    tpink="rgba(242,138,201,0.13)", tgold=("rgba(255,203,15,0.13)", GOLD), track="rgba(255,255,255,0.10)",
    # lá số
    cell="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.065)",
    celltp="background: rgba(255,203,15,0.055); border: 1px solid rgba(255,203,15,0.26)",
    cellmenh="background: linear-gradient(160deg, #1D1826, #15121B) padding-box, linear-gradient(135deg, #A393FF, #F28AC9 60%, #FFCB0F) border-box; border: 1.5px solid transparent; box-shadow: 0 0 20px rgba(163,147,255,0.25)",
    star="#F3F1F4", sM="#86EFAC", sH="#FBC98A", sB="rgba(243,241,244,0.55)",
    cat="rgba(243,241,244,0.78)", hung="#FF9CA8", vong="#B6AAF0", small="rgba(243,241,244,0.50)",
    hoa={"LỘC": ("rgba(74,222,128,0.18)", "#86EFAC"), "QUYỀN": ("rgba(255,203,15,0.18)", "#FFE07A"),
         "KHOA": ("rgba(125,211,252,0.18)", "#9ADCFD"), "KỴ": ("rgba(255,120,140,0.2)", "#FFA3B1")},
    tag=("#15121A", GOLD), center="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05)",
    mark=("#15121A", GOLD, "rgba(255,203,15,0.6)"), seg="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)",
)
LIGHT_BG = ("background: radial-gradient(120% 55% at 105% -5%, rgba(255,189,211,0.45) 0%, rgba(255,189,211,0) 60%), "
            "radial-gradient(90% 45% at -10% 38%, rgba(255,241,189,0.55) 0%, rgba(255,241,189,0) 65%), "
            "radial-gradient(100% 50% at 50% 112%, rgba(255,139,208,0.14) 0%, rgba(255,139,208,0) 60%), #FFFBFD")
LIGHT_GLOWS = """<div aria-hidden="true" style="position: absolute; right: -90px; top: -70px; width: 280px; height: 280px; border-radius: 999px; background: radial-gradient(circle, rgba(255,139,208,0.18), rgba(255,139,208,0) 70%); filter: blur(10px); animation: celes-troi 12s ease-in-out infinite; pointer-events: none"></div>"""
LIGHT = dict(
    name="sang", text="#240029", muted="rgba(36,0,41,0.66)", accent="#B8157F",
    glass="background: rgba(255,255,255,0.92); border: 1px solid rgba(36,0,41,0.06); box-shadow: 0 1px 2px rgba(36,0,41,0.04), 0 8px 24px rgba(107,10,110,0.08); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px)",
    bg=LIGHT_BG, base="#FFFBFD", glows=LIGHT_GLOWS,
    gradtext="background: linear-gradient(95deg, #D32298 0%, #EC4F8E 55%, #D98C00 100%); -webkit-background-clip: text; background-clip: text; color: transparent",
    voice="#6A0B6E", line="rgba(36,0,41,0.09)",
    navbg="rgba(255,255,255,0.86)", navline="rgba(36,0,41,0.08)", navshadow="0 16px 36px rgba(107,10,110,0.16)",
    navoff="rgba(36,0,41,0.58)", navon="rgba(211,34,152,0.10)", fade="255,251,253",
    good=("#DCFCE7", "#15803D"), warn=("#FFEDD5", "#B45309"), mid=("rgba(36,0,41,0.06)", "rgba(36,0,41,0.7)"),
    tpink="rgba(211,34,152,0.09)", tgold=("rgba(255,203,15,0.22)", "#9A6A00"), track="rgba(36,0,41,0.08)",
    cell="background: #FFFFFF; border: 1px solid rgba(36,0,41,0.08); box-shadow: 0 1px 2px rgba(36,0,41,0.04)",
    celltp="background: #FFFAEB; border: 1px solid rgba(217,140,0,0.38)",
    cellmenh="background: linear-gradient(160deg, #FFF1F7, #FFF6DA) padding-box, linear-gradient(135deg, #FF8BD0, #FFCB0F) border-box; border: 1.5px solid transparent; box-shadow: 0 6px 16px rgba(211,34,152,0.16)",
    star="#240029", sM="#15803D", sH="#B45309", sB="rgba(36,0,41,0.55)",
    cat="rgba(36,0,41,0.78)", hung="#C2334A", vong="#8C698C", small="rgba(36,0,41,0.55)",
    hoa={"LỘC": ("#DCFCE7", "#15803D"), "QUYỀN": ("#FEF3C7", "#92400E"), "KHOA": ("#E0F2FE", "#0369A1"), "KỴ": ("#FFE4E6", "#BE123C")},
    tag=("#FDE7F3", "#B8157F"), center="background: rgba(255,255,255,0.6); border: 1px solid rgba(36,0,41,0.06)",
    mark=("#FFFFFF", "#9A6A00", "rgba(154,106,0,0.55)"), seg="background: rgba(36,0,41,0.05); border: 1px solid rgba(36,0,41,0.04)",
)

TABS = [("homnay", "HomNay.dc.html", "sun", "Hôm nay"),
        ("laso", "LaSo.dc.html", "laso", "Lá số"),
        ("celes", "Celes.dc.html", None, "Celes"),
        ("hanhtrinh", "HanhTrinh.dc.html", "path", "Hành trình"),
        ("moiquanhe", "MoiQuanHe.dc.html", "rel", "Mối quan hệ")]


def nav(active, th=DARK, suffix=""):
    items = []
    for key, href, icon, label in TABS:
        if suffix and key in ("homnay", "laso"):
            href = href.replace(".dc.html", suffix + ".dc.html")
        on = key == active
        cur = ' aria-current="page"' if on else ""
        col = th["text"] if on else th["navoff"]
        wt = 700 if on else 500
        if icon is None:
            ring = f"box-shadow: 0 0 0 3px {th['base']}, 0 0 0 5px {ZONES['celes'][1]}, 0 10px 26px rgba(242,138,201,0.45);" if on else f"box-shadow: 0 0 0 3px {th['base']}, 0 10px 22px rgba(242,138,201,0.30);"
            items.append(f'<a href="{href}"{cur} style="height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px; padding-bottom: 9px; box-sizing: border-box; text-decoration: none; color: {col}; font-size: 11px; font-weight: {wt}; white-space: nowrap; letter-spacing: -0.01em; position: relative">'
                         f'<span style="position: absolute; top: -18px; border-radius: 999px; {ring}">{orb(50)}</span><span>{label}</span></a>')
        else:
            zc = ZONES[key][1] if th is DARK else th["accent"]
            bg = (f"background: rgba({ZONES[key][3]},0.16);" if th is DARK else f"background: {th['navon']};") if on else ""
            icol = zc if on else "currentColor"
            items.append(f'<a href="{href}"{cur} style="height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-decoration: none; color: {col}; font-size: 11px; font-weight: {wt}; white-space: nowrap; letter-spacing: -0.01em">'
                         f'<span style="width: 44px; height: 30px; border-radius: 999px; {bg} display: flex; align-items: center; justify-content: center">{ic(icon, 22, 1.9 if on else 1.75, icol)}</span><span>{label}</span></a>')
    return (f'<nav aria-label="Điều hướng chính" style="position: absolute; left: 14px; right: 14px; bottom: 22px; height: 64px; border-radius: 24px; '
            f'background: {th["navbg"]}; border: 1px solid {th["navline"]}; backdrop-filter: blur(24px) saturate(160%); -webkit-backdrop-filter: blur(24px) saturate(160%); '
            f'box-shadow: {th["navshadow"]}; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); z-index: 4">'
            + "\n".join(items) + "</nav>")


def fade_bottom(th=DARK):
    f = th["fade"]
    return f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 150px; background: linear-gradient(180deg, rgba({f},0) 0%, rgba({f},0.92) 60%); z-index: 3; pointer-events: none"></div>'


def avatar(th=DARK):
    return (f'<a href="Toi.dc.html" aria-label="Tài khoản của tôi" style="width: 44px; height: 44px; border-radius: 999px; flex-shrink: 0; padding: 2px; box-sizing: border-box; '
            f'background: conic-gradient(from 0deg, #FFBDD3, #FFF1BD, #FFCB0F, #FF8BD0, #D32298, #FFBDD3); display: flex; text-decoration: none">'
            f'<span style="flex-grow: 1; border-radius: 999px; border: 2px solid {th["base"]}; background: {"#1F1B24" if th is DARK else "#FFBDD3"}; color: {TEXT if th is DARK else INK}; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-weight: 800; font-size: 16px">M</span></a>')


# Màn có thanh tab: nội dung dừng trên đỉnh orb Celes (844 - 22 đáy - 64 nav - 18 orb nhô = 740),
# chừa 8px thở; phần dài hơn coi như cuộn, mờ dần ở mép thay vì chui xuống nav.
SAFE_TAB = 732
MASK_TAB = "; overflow: hidden; -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(180deg, #000 calc(100% - 28px), transparent)"


def page(name, title, body, tab=None, gap=16, glows=True, pad="60px 20px 0", th=DARK, fade=True, suffix="", extra=""):
    root = (f'<div style="width: 390px; height: 844px; position: relative; overflow: hidden; {th["bg"]}; box-sizing: border-box; '
            f'font-family: \'Be Vietnam Pro\', system-ui, sans-serif; color: {th["text"]}">')
    html = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{HELMET if th is DARK else HELMET.replace("color:" + TEXT + ";background:" + BASE, "color:#240029;background:#FFFBFD").replace("a{color:" + ACCENT + "}a:hover{color:#FFB3E0}", "a{color:#B8157F}a:hover{color:#8E0F62}").replace("rgba(243,241,244,0.50)", "rgba(36,0,41,0.55)")}
{root}
{th["glows"] if glows else ''}
{zone_deco(ZCUR) if th is DARK else ''}
<div style="position: relative; z-index: 1; box-sizing: border-box; height: {SAFE_TAB if tab else 844}px; padding: {pad}; display: flex; flex-direction: column; gap: {gap}px{MASK_TAB if tab else ''}">
{body}
</div>
{extra}
{(fade_bottom(th) if fade else '') + nav(tab, th, suffix) if tab else ''}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":844}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(html)


def eyebrow(text, color=None, extra=""):
    return f'<div style="{EYEBROW}; color: {color or ACCENT}; {extra}">{text}</div>'


def zone_mark(extra=""):
    # dấu định vị đầu màn: chấm màu vùng + tên vùng (như breadcrumb của ảnh tham khảo)
    ten, c, _, rgb, _ = ZONES[ZCUR]
    return (f'<span style="display: inline-flex; align-items: center; gap: 7px; {MONO}; font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: {c}; {extra}">'
            f'<span style="width: 7px; height: 7px; border-radius: 999px; background: {c}; box-shadow: 0 0 10px rgba({rgb},0.9)"></span>{ten}</span>')


def icon_btn(icon, label, href=None, dot=False):
    d = f'<span style="position: absolute; top: 10px; right: 11px; width: 8px; height: 8px; border-radius: 999px; background: {GOLD}; box-shadow: 0 0 8px {GOLD}"></span>' if dot else ""
    tag_open = f'<a href="{href}"' if href else '<button type="button"'
    tag_close = "</a>" if href else "</button>"
    return (f'{tag_open} aria-label="{label}" style="position: relative; width: 44px; height: 44px; border-radius: 14px; {GLASS}; display: flex; align-items: center; justify-content: center; color: {TEXT}; padding: 0; flex-shrink: 0; text-decoration: none">'
            f'{ic(icon, 20, 2)}{d}{tag_close}')


# =====================================================================
# 0 · Hệ thiết kế
# =====================================================================
set_zone("celes")
# bảng màu bản 8: nền gần đen, một hành động fuchsia, sáu màu vùng
sw = [("#0B0A0D", "Đêm", "nền"), ("#15121A", "Bề mặt", "thẻ, thanh tab"), ("#D32298", "Fuchsia", "hành động"), ("#F28AC9", "Celes", "vùng trò chuyện"),
      ("#F6A96B", "Khởi đầu", "onboarding"), ("#F5C451", "Hôm nay", "vùng hằng ngày"), ("#A393FF", "Lá số", "vùng bản đồ"), ("#5CD3BE", "Hành trình", "vùng thời gian")]
swatch = "\n".join(
    f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="height: 46px; border-radius: 12px; background: {c}; border: 1px solid rgba(255,255,255,0.10)"></span>'
    f'<span style="font-size: 12px; font-weight: 600; line-height: 1.2">{n}</span><span style="{MONO}; font-size: 11px; color: {MUTED}">{c}</span></div>' for c, n, _ in sw)
icons = "\n".join(
    f'<span style="height: 44px; border-radius: 12px; {GLASS}; display: flex; align-items: center; justify-content: center; color: {TEXT}">{ic(k, 22)}</span>'
    for k in ["sun", "path", "rel", "user", "briefcase", "coin", "heart", "home", "sparkle", "leaf", "sign", "eye", "memory", "bell", "radar", "wave"])
body0 = f"""
<div style="display: flex; align-items: center; gap: 12px">{orb(44)}<div style="display: flex; flex-direction: column; gap: 2px">{eyebrow('Hệ thiết kế app')}<span style="{DISPLAY}; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1">Celes <span style="{GRADTEXT}">Aurora</span></span></div></div>
<div style="border-radius: 20px; padding: 16px; {GLASS}; display: flex; flex-direction: column; gap: 8px">
{eyebrow('Kiểu chữ', MUTED)}
<span style="{DISPLAY}; font-size: 30px; font-weight: 800; line-height: 1.02; letter-spacing: -0.035em">Hôm nay, bạn nên <span style="{GRADTEXT}">chậm lại</span>.</span>
<span style="font-size: 14px; line-height: 1.5; color: {MUTED}">Bricolage Grotesque cho tiêu đề — có cá tính, dấu tiếng Việt gọn. Be Vietnam Pro cho thân bài, sinh ra cho tiếng Việt.</span>
<span style="{VOICE}; font-size: 20px; line-height: 1.3; color: #ECE3EF">“Chuyện lời mời đó tới đâu rồi?” — giọng Celes</span>
</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">
{swatch}
</div>
<div style="display: flex; flex-direction: column; gap: 10px">
{eyebrow('Thành phần', MUTED)}
<div style="display: flex; gap: 10px">
<a href="Chao.dc.html" style="{CTA}; flex-grow: 1">Bắt đầu {ic('arrow', 18, 2.2)}</a>
<button type="button" style="height: 56px; padding: 0 18px; border-radius: 14px; {GLASS}; color: {TEXT}; font-size: 15px; font-weight: 600">Để sau</button>
</div>
<div style="display: flex; gap: 8px; flex-wrap: wrap">
<span style="height: 36px; padding: 0 14px; border-radius: 999px; {zone_on()}; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700">{ic('check', 16, 2.4)}Công việc</span>
<span style="height: 36px; padding: 0 14px; border-radius: 999px; {GLASS}; display: flex; align-items: center; font-size: 14px; font-weight: 500">Tình cảm</span>
<span style="height: 36px; padding: 0 12px; border-radius: 999px; background: rgba(74,222,128,0.16); color: #86EFAC; display: flex; align-items: center; font-size: 13px; font-weight: 700">Thuận lợi</span>
<span style="height: 36px; padding: 0 12px; border-radius: 999px; background: rgba(240,164,75,0.18); color: #FBC98A; display: flex; align-items: center; font-size: 13px; font-weight: 700">Cần chăm chút</span>
</div>
</div>
<div style="display: flex; flex-direction: column; gap: 10px">
{eyebrow('Icon · nét 1.75, bo tròn, lưới 24', MUTED)}
<div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px">
{icons}
</div>
</div>
"""
page("HeThong.dc.html", "Hệ thiết kế Celes Aurora", body0, gap=18)

# =====================================================================
# 1a · Điều bạn đang bận tâm
# =====================================================================
tiles = [("briefcase", "Công việc", True), ("coin", "Tiền bạc", True), ("heart", "Tình cảm", False), ("home", "Gia đình", False),
         ("sparkle", "Bản thân", False), ("leaf", "Sức khoẻ", False), ("sign", "Quyết định sắp tới", False), ("eye", "Hiểu mình hơn", False)]
set_zone("khoidau")
ZR = ZONES["khoidau"][3]

# =====================================================================
# 1 · Khởi đầu — màn chào và bốn bước lập lá số (thêm ở bản 8 để prototype đi được từ đầu)
# =====================================================================
def ob_head(n, back):
    seg = "".join(
        f'<div style="height: 5px; border-radius: 3px; background: {ACCENT}; box-shadow: 0 0 10px rgba({ZR},0.5)"></div>' if i < n
        else '<div style="height: 5px; border-radius: 3px; background: rgba(255,255,255,0.10)"></div>' for i in range(5))
    return (f'<div style="display: flex; align-items: center; gap: 12px">{icon_btn("back", "Quay lại", href=back)}'
            f'<div aria-label="Bước {n} trên 5" style="flex-grow: 1; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px">{seg}</div>'
            f'<span style="{MONO}; font-size: 12px; color: {MUTED}">{n}/5</span></div>')


def ob_title(eb, h1, p):
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px">{eyebrow(eb)}'
            f'<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 32px; line-height: 1.04; letter-spacing: -0.035em">{h1}</h1>'
            f'<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {MUTED}">{p}</p></div>')


def ob_cta(label, href, note=""):
    n = f'<p style="margin: 0; font-size: 13px; line-height: 1.4; color: {MUTED}; text-align: center">{note}</p>' if note else ""
    return (f'<div style="position: absolute; left: 20px; right: 20px; bottom: 34px; display: flex; flex-direction: column; gap: 12px">{n}'
            f'<a href="{href}" style="{CTA}">{label} {ic("arrow", 18, 2.2)}</a></div>')


def wheel(cols):
    # bánh xe chọn kiểu iOS: mỗi cột (nhãn, [giá trị], chỉ số đang chọn)
    out = []
    for lab, vals, k in cols:
        rows = []
        for i, v in enumerate(vals):
            d = abs(i - k)
            op = [1, 0.42, 0.18][min(d, 2)]
            fs = [24, 19, 16][min(d, 2)]
            wt = 700 if d == 0 else 500
            rows.append(f'<span style="height: 44px; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-size: {fs}px; font-weight: {wt}; opacity: {op}">{v}</span>')
        out.append(f'<div style="display: flex; flex-direction: column; align-items: stretch"><span style="{EYEBROW}; font-size: 11px; color: {MUTED}; text-align: center; margin-bottom: 6px">{lab}</span>{"".join(rows)}</div>')
    band = f'<div aria-hidden="true" style="position: absolute; left: 10px; right: 10px; top: {27 + 44 * 2}px; height: 44px; border-radius: 12px; background: rgba({ZR},0.10); box-shadow: inset 0 0 0 1px rgba({ZR},0.35)"></div>'
    return (f'<div style="position: relative; border-radius: 20px; padding: 10px 8px 12px; {GLASS}">{band}'
            f'<div style="position: relative; display: grid; grid-template-columns: repeat({len(cols)}, minmax(0, 1fr))">{"".join(out)}</div></div>')


# màn chào
body_chao = f"""
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; text-align: center; margin-top: -60px">
{dau_celestia(136)}
<div style="display: flex; flex-direction: column; gap: 10px; align-items: center">
{eyebrow('Celestia')}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 38px; line-height: 1.02; letter-spacing: -0.04em">Chào bạn,<br>mình là <span style="{GRADTEXT}">Celes</span>.</h1>
<p style="margin: 0; max-width: 300px; font-size: 16px; line-height: 1.5; color: {MUTED}">Mình đọc lá số tử vi của bạn, rồi cùng bạn nghĩ về công việc, tình cảm và những quyết định sắp tới.</p>
</div>
<div style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 6px">
{''.join(f'<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 14px; {GLASS}; text-align: left"><span style="color: {ACCENT}; display: flex">{ic(i, 18, 2)}</span><span style="font-size: 14px; font-weight: 500">{t}</span></div>' for i, t in [('clock', 'Hai phút để lập lá số'), ('sparkle', 'Chỉ cần tên, ngày và giờ sinh'), ('compass', 'Gợi ý để bạn tự quyết, không phán số')])}
</div>
</div>
<div style="position: absolute; left: 20px; right: 20px; bottom: 34px; display: flex; flex-direction: column; gap: 6px">
<a href="OnbTen.dc.html" style="{CTA}">Bắt đầu {ic('arrow', 18, 2.2)}</a>
<a href="HomNay.dc.html" style="height: 44px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; color: {MUTED}; text-decoration: none">Tôi đã có tài khoản</a>
</div>
"""
page("Chao.dc.html", "Chào bạn, mình là Celes", body_chao, gap=14)

# bước 1 — tên
body_ten = f"""
{ob_head(1, 'Chao.dc.html')}
{ob_title('Làm quen', f'Celes nên <span style="{GRADTEXT}">gọi bạn</span> là gì?', 'Tên thân mật là đủ, không cần họ tên đầy đủ.')}
<label style="display: flex; align-items: center; gap: 10px; height: 60px; border-radius: 14px; background: #141117; border: 1px solid rgba({ZR},0.6); box-shadow: 0 0 0 4px rgba({ZR},0.10); padding: 0 16px">
<span style="{DISPLAY}; font-size: 22px; font-weight: 700; flex-grow: 1">Minh<span style="display: inline-block; width: 2px; height: 24px; margin-left: 2px; vertical-align: -4px; background: {ACCENT}; animation: celes-nhip 1s steps(2) infinite"></span></span>
{ic('check', 20, 2.4, ACCENT)}
</label>
{ob_cta('Tiếp tục', 'OnbGioiTinh.dc.html')}
"""
page("OnbTen.dc.html", "Bước 1 — Tên", body_ten, gap=14)

# bước 2 — giới tính
def gt_tile(lab, on):
    st = (f"border: 1px solid rgba({ZR},0.55); background: linear-gradient(160deg, rgba({ZR},0.16), rgba({ZR},0.05)), #141117" if on else GLASS)
    chk = (f'<span style="position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 999px; background: {ACCENT}; color: #2A1405; display: flex; align-items: center; justify-content: center">{ic("check", 13, 3)}</span>' if on else "")
    return (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="position: relative; height: 120px; border-radius: 20px; {st}; color: {TEXT}; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: 4px; padding: 16px">{chk}'
            f'<span style="{DISPLAY}; font-size: 24px; font-weight: 800">{lab}</span></button>')
body_gt = f"""
{ob_head(2, 'OnbTen.dc.html')}
{ob_title('Minh ơi', f'Bạn là <span style="{GRADTEXT}">nam hay nữ</span>?', 'Lá số cần điều này để tính các giai đoạn trong đời bạn theo đúng chiều.')}
<div role="group" aria-label="Giới tính" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">{gt_tile('Nam', True)}{gt_tile('Nữ', False)}</div>
{ob_cta('Tiếp tục', 'OnbNgay.dc.html')}
"""
page("OnbGioiTinh.dc.html", "Bước 2 — Giới tính", body_gt, gap=14)

# bước 3 — ngày sinh
seg_lich = (f'<div role="tablist" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 14px; {GLASS}">'
            f'<button type="button" role="tab" aria-selected="true" style="height: 40px; border-radius: 10px; border: none; {zone_on()}; font-size: 15px; font-weight: 700">Dương lịch</button>'
            f'<button type="button" role="tab" aria-selected="false" style="height: 40px; border-radius: 10px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 500">Âm lịch</button></div>')
body_ngay = f"""
{ob_head(3, 'OnbGioiTinh.dc.html')}
{ob_title('Ngày sinh', f'Minh sinh <span style="{GRADTEXT}">ngày nào</span>?', 'Chọn theo lịch bạn nhớ rõ nhất. Celes tự quy đổi sang lịch còn lại.')}
{seg_lich}
{wheel([('Ngày', ['12', '13', '14', '15', '16'], 2), ('Tháng', ['04', '05', '06', '07', '08'], 2), ('Năm', ['1988', '1989', '1990', '1991', '1992'], 2)])}
<div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: {MUTED}">{ic('moon', 16, 2, ACCENT)}Âm lịch: 22 tháng Năm, Canh Ngọ</div>
{ob_cta('Tiếp tục', 'OnbGio.dc.html')}
"""
page("OnbNgay.dc.html", "Bước 3 — Ngày sinh", body_ngay, gap=14)

# bước 4 — giờ sinh
body_gio = f"""
{ob_head(4, 'OnbNgay.dc.html')}
{ob_title('Giờ sinh', f'Bạn sinh <span style="{GRADTEXT}">lúc mấy giờ</span>?', 'Giờ sinh quyết định vị trí các cung. Hỏi người nhà hoặc xem giấy chứng sinh nếu có.')}
{wheel([('Giờ', ['05', '06', '07', '08', '09'], 2), ('Phút', ['20', '25', '30', '35', '40'], 2)])}
<div style="display: flex; align-items: center; gap: 10px"><span style="height: 32px; padding: 0 12px; border-radius: 999px; {zone_on()}; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700">{ic('clock', 14, 2.2)}Giờ Thìn · 7:00–8:59</span></div>
<a href="Main.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; {GLASS}; color: {TEXT}; text-decoration: none">
<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600">Tôi không nhớ giờ sinh</span><span style="font-size: 13px; line-height: 1.4; color: {MUTED}">Celes vẫn đọc được phần lớn và đánh dấu chỗ nào còn phụ thuộc giờ.</span></span>{ic('chev', 18, 2)}</a>
{ob_cta('Tiếp tục', 'Main.dc.html')}
"""
page("OnbGio.dc.html", "Bước 4 — Giờ sinh", body_gio, gap=14)

tl = []
for icn, lab, on in tiles:
    if on:
        tl.append(f'<button type="button" aria-pressed="true" style="position: relative; height: 58px; border-radius: 18px; border: 1px solid rgba({ZR},0.55); '
                  f'background: linear-gradient(160deg, rgba({ZR},0.16), rgba({ZR},0.05)), #141117; '
                  f'box-shadow: 0 10px 28px rgba(0,0,0,0.45); display: flex; align-items: center; gap: 10px; padding: 0 12px; color: {TEXT}; text-align: left">'
                  f'<span style="width: 38px; height: 38px; border-radius: 12px; background: {ACCENT}; color: #2A1405; display: flex; align-items: center; justify-content: center; flex-shrink: 0">{ic(icn, 20, 2)}</span>'
                  f'<span style="font-size: 15px; font-weight: 700; line-height: 1.2">{lab}</span>'
                  f'<span style="position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 999px; background: {ACCENT}; color: #2A1405; display: flex; align-items: center; justify-content: center">{ic("check", 12, 3)}</span></button>')
    else:
        tl.append(f'<button type="button" aria-pressed="false" style="height: 58px; border-radius: 18px; {GLASS}; display: flex; align-items: center; gap: 10px; padding: 0 12px; color: {TEXT}; text-align: left">'
                  f'<span style="width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.06); color: rgba(243,241,244,0.72); display: flex; align-items: center; justify-content: center; flex-shrink: 0">{ic(icn, 20)}</span>'
                  f'<span style="font-size: 15px; font-weight: 500; line-height: 1.2">{lab}</span></button>')
seg = "".join(f'<div style="height: 5px; border-radius: 3px; background: {ACCENT}; box-shadow: 0 0 10px rgba({ZR},0.5)"></div>' for _ in range(5))
body1 = f"""
<div style="display: flex; align-items: center; gap: 12px">
{icon_btn('back', 'Quay lại', href='OnbGio.dc.html')}
<div aria-label="Bước 5 trên 5" style="flex-grow: 1; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px">{seg}</div>
<span style="{MONO}; font-size: 12px; color: {MUTED}">5/5</span>
</div>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px">
{eyebrow('Minh ơi, câu cuối')}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 32px; line-height: 1.04; letter-spacing: -0.035em">Điều gì đang khiến bạn <span style="{GRADTEXT}">nghĩ nhiều nhất</span> lúc này?</h1>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {MUTED}">Chọn tối đa hai điều. Celes sẽ ưu tiên chúng ở Hôm nay, trong lời nhắc mỗi sáng và khi trò chuyện.</p>
</div>
<div role="group" aria-label="Điều đang bận tâm" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
{''.join(tl)}
</div>
<label style="display: flex; align-items: center; gap: 10px; height: 52px; border-radius: 14px; {GLASS}; padding: 0 14px">
{ic('sparkle', 18, 1.75, ACCENT)}
<input type="text" placeholder="Kể thêm cho Celes (có thể bỏ qua)" style="flex-grow: 1; min-width: 0; height: 50px; border: none; outline: none; background: transparent; font-family: inherit; font-size: 16px; color: {TEXT}">
</label>
<div style="position: absolute; left: 20px; right: 20px; bottom: 34px; display: flex; flex-direction: column; gap: 12px">
<p style="margin: 0; font-size: 13px; line-height: 1.4; color: {MUTED}; text-align: center">Celes chỉ nhớ điều bạn tự kể. Đổi lại được bất cứ lúc nào.</p>
<a href="QuickRead.dc.html" style="{CTA}">Xem Celes thấy gì {ic('arrow', 18, 2.2)}</a>
</div>
"""
page("Main.dc.html", "Điều bạn đang bận tâm", body1, gap=14)

# =====================================================================
# 1b · Ba điều Celes thấy ở bạn
# =====================================================================
rings = '<svg aria-hidden="true" width="200" height="200" viewBox="0 0 200 200" style="position: absolute; right: -60px; top: -60px; opacity: 0.7; animation: celes-vong 40s linear infinite"><g fill="none" stroke="#F6A96B" stroke-opacity="0.22"><circle cx="100" cy="100" r="40"/><circle cx="100" cy="100" r="64" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="92"/></g><circle cx="164" cy="100" r="5" fill="#F6A96B"/><circle cx="100" cy="8" r="3.5" fill="#FFE0B8" fill-opacity="0.6"/></svg>'
body2 = f"""
<div style="display: flex; flex-direction: column; gap: 6px">
{eyebrow('Dành riêng cho Minh')}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 32px; line-height: 1.04; letter-spacing: -0.035em">Ba điều Celes <span style="{GRADTEXT}">thấy ở bạn</span></h1>
</div>
<div style="position: relative; height: 340px; margin-top: 8px">
<div aria-hidden="true" style="position: absolute; left: 24px; right: 24px; top: -14px; height: 320px; border-radius: 24px; background: #121015; border: 1px solid rgba({ZR},0.14); transform: rotate(3deg)"></div>
<div aria-hidden="true" style="position: absolute; left: 12px; right: 12px; top: -7px; height: 330px; border-radius: 24px; background: #16131A; border: 1px solid rgba({ZR},0.20); transform: rotate(-2deg)"></div>
<article style="position: absolute; inset: 0; border-radius: 24px; padding: 22px; box-sizing: border-box; overflow: hidden; {zone_hero()}; color: {TEXT}; display: flex; flex-direction: column; gap: 10px">
{rings}
<div style="display: flex; align-items: center; gap: 10px; position: relative"><span style="{MONO}; font-size: 13px; font-weight: 500; padding: 4px 9px; border-radius: 999px; {zone_on()}">01 / 03</span><span style="{EYEBROW}; color: {ACCENT}">Điều bạn làm rất tự nhiên</span></div>
<h2 style="margin: 6px 0 0; {DISPLAY}; font-weight: 800; font-size: 29px; line-height: 1.05; letter-spacing: -0.03em; position: relative">Bạn giỏi biến một việc rối thành các bước làm được.</h2>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {MUTED}; position: relative">Người khác còn đang bàn, bạn đã chia việc và bắt tay làm. Bạn sáng nhất khi mọi thứ cần một người đứng ra sắp xếp.</p>
<a href="#" style="margin-top: auto; align-self: flex-start; height: 44px; padding: 0 16px 0 18px; border-radius: 14px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10); color: {TEXT}; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; text-decoration: none">Vì sao Celes thấy vậy {ic('arrow', 16, 2.2)}</a>
</article>
</div>
<div style="display: flex; justify-content: center; align-items: center; gap: 6px" aria-label="Thẻ 1 trên 3">
<span style="width: 28px; height: 6px; border-radius: 3px; background: {ACCENT}"></span><span style="width: 6px; height: 6px; border-radius: 3px; background: rgba(243,241,244,0.4)"></span><span style="width: 6px; height: 6px; border-radius: 3px; background: rgba(243,241,244,0.4)"></span>
<span style="margin-left: 10px; font-size: 13px; color: {MUTED}">Vuốt để xem tiếp</span>
</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; border-radius: 28px 28px 0 0; background: rgba(20,18,24,0.86); border-top: 1px solid rgba(255,255,255,0.099); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-sizing: border-box; padding: 10px 20px 38px; display: flex; flex-direction: column; gap: 10px; z-index: 2">
<div style="align-self: center; width: 38px; height: 5px; border-radius: 3px; background: rgba(243,241,244,0.35)"></div>
<h2 style="margin: 4px 0 0; {DISPLAY}; font-weight: 700; font-size: 22px; letter-spacing: -0.02em">Giữ lại để Celes nhớ bạn</h2>
<p style="margin: 0; font-size: 14px; line-height: 1.45; color: {MUTED}">Lưu lá số và những gì bạn kể, mở lại trên máy nào cũng còn.</p>
<a href="HomNay.dc.html" style="height: 52px; border-radius: 14px; background: #FFFFFF; color: #000000; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 600; text-decoration: none">{APPLE}Tiếp tục với Apple</a>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
<a href="HomNay.dc.html" style="height: 52px; border-radius: 14px; {GLASS}; color: {TEXT}; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 600; text-decoration: none"><span style="{DISPLAY}; font-weight: 800; font-size: 18px">G</span>Google</a>
<a href="HomNay.dc.html" style="height: 52px; border-radius: 14px; {GLASS}; color: {TEXT}; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 600; text-decoration: none">{ic('mail', 18)}Email</a>
</div>
<a href="HomNay.dc.html" style="height: 44px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; color: {MUTED}; text-decoration: none">Để sau</a>
</div>
"""
page("QuickRead.dc.html", "Ba điều Celes thấy ở bạn", body2, gap=14)

# =====================================================================
# 2a · Hôm nay
# =====================================================================
def homnay(th, suffix=""):
    T, M, G = th["text"], th["muted"], th["glass"]
    D = th is DARK  # bản tối: thẻ tối viền vàng; bản sáng giữ mảng pastel
    hs = f"{zone_hero()}; color: {T}" if D else f"background: {HERO}; color: {INK}; box-shadow: 0 24px 56px rgba(255,139,208,0.32)"
    hk = th["accent"] if D else "#4A2A4A"
    hp = M if D else "#3A1640"
    hb = f"background: rgba(255,255,255,0.04); border: 1px solid {th['line']}" if D else "background: rgba(255,255,255,0.55)"
    hl = M if D else "#4A2A4A"
    hc = zone_on() if D else "background: #240029; color: #FFF1BD"
    hg = "" if D else '<div aria-hidden="true" style="position: absolute; right: -40px; top: -50px; width: 170px; height: 170px; border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,255,255,0) 68%); animation: celes-troi 10s ease-in-out infinite"></div>'
    bar = th["accent"] if D else HERO
    bell = (f'<button type="button" aria-label="Thông báo, có tin mới" style="position: relative; width: 44px; height: 44px; border-radius: 14px; {G}; display: flex; align-items: center; justify-content: center; color: {T}; padding: 0; flex-shrink: 0">'
            f'{ic("bell", 20, 2)}<span style="position: absolute; top: 10px; right: 11px; width: 8px; height: 8px; border-radius: 999px; background: {GOLD}; box-shadow: 0 0 8px {GOLD}"></span></button>')
    return f"""
<div style="display: flex; align-items: flex-end; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px">
{zone_mark() if th is DARK else ''}{eyebrow('Thứ Ba · 29 tháng 9', th['muted'] if th is DARK else th['accent'])}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 26px; line-height: 1.05; letter-spacing: -0.03em">Chào buổi sáng,<br><span style="{th['gradtext']}">Minh</span></h1>
</div>
{bell}
{avatar(th)}
</div>
<article style="position: relative; overflow: hidden; border-radius: 24px; padding: 18px; {hs}; display: flex; flex-direction: column; gap: 8px">
{hg}
<div style="display: flex; justify-content: space-between; align-items: center; position: relative"><span style="{EYEBROW}; color: {hk}">Nhận định hôm nay</span><span style="height: 28px; padding: 0 10px; border-radius: 999px; {hc}; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600">{ic('briefcase', 14, 2)}Công việc</span></div>
<h2 style="margin: 2px 0 0; {DISPLAY}; font-weight: 800; font-size: 22px; line-height: 1.12; letter-spacing: -0.025em; position: relative">Chốt việc đang dở trước khi nhận thêm việc mới.</h2>
<p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: {hp}; position: relative">Hôm nay bạn làm tốt nhất khi khép lại một việc cũ. Việc mới hấp dẫn cỡ nào cũng để mai hẵng nhận lời.</p>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; position: relative; margin-top: 2px">
<div style="border-radius: 14px; padding: 9px 12px; {hb}; display: flex; flex-direction: column; gap: 2px"><span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: {hl}">{ic('clock', 14, 2)}Giờ thuận</span><span style="{DISPLAY}; font-size: 17px; font-weight: 700; white-space: nowrap">9h – 11h</span></div>
<div style="border-radius: 14px; padding: 9px 12px; {hb}; display: flex; flex-direction: column; gap: 2px"><span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: {hl}">{ic('wave', 14, 2)}Nhịp ngày</span><span style="{DISPLAY}; font-size: 17px; font-weight: 700; white-space: nowrap; letter-spacing: -0.01em">Chậm mà chắc</span></div>
</div>
</article>
<section style="border-radius: 20px; padding: 14px 16px; {G}; display: flex; flex-direction: column; gap: 10px">
<div style="display: flex; align-items: center; gap: 10px">{orb(30)}<span style="font-size: 13px; font-weight: 600; color: {th['accent']}">Celes vẫn nhớ</span><span style="margin-left: auto; font-size: 12px; color: {M}">Tuần trước</span></div>
<p style="margin: 0; {VOICE}; font-size: 17px; line-height: 1.32; color: {th['voice']}">“Bạn kể đang cân nhắc một lời mời làm việc. Chuyện đó tới đâu rồi?”</p>
<div style="display: flex; gap: 10px">
<a href="Celes.dc.html" style="flex-grow: 1; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #E23BA8, {FUCHSIA} 55%, #A8157E); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 22px rgba(211,34,152,0.4); color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none">Kể tiếp với Celes</a>
<button type="button" style="height: 44px; padding: 0 16px; border-radius: 14px; border: 1px solid {th['line']}; background: transparent; color: {T}; font-size: 15px; font-weight: 500">Để sau</button>
</div>
</section>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
<a href="LaSo{suffix}.dc.html" style="border-radius: 18px; padding: 12px; {G}; display: flex; align-items: center; gap: 10px; text-decoration: none; color: {T}">
<span style="width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px; background: {th['tgold'][0]}; color: {th['tgold'][1]}; display: flex; align-items: center; justify-content: center">{ic('laso', 20)}</span>
<span style="min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="{DISPLAY}; font-size: 15px; font-weight: 700; line-height: 1.15; white-space: nowrap">Lá số</span><span style="font-size: 12px; color: {M}; white-space: nowrap">12 cung</span></span></a>
<a href="BaiDoc.dc.html" style="border-radius: 18px; padding: 12px; {G}; display: flex; align-items: center; gap: 10px; text-decoration: none; color: {T}">
<span style="width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px; background: {th['tpink']}; color: {th['accent']}; display: flex; align-items: center; justify-content: center">{ic('book', 20)}</span>
<span style="min-width: 0; flex-grow: 1; display: flex; flex-direction: column; gap: 5px"><span style="{DISPLAY}; font-size: 15px; font-weight: 700; line-height: 1.15; white-space: nowrap">Đọc tiếp</span>
<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: {M}"><span style="flex-grow: 1; height: 5px; border-radius: 3px; background: {th['track']}; overflow: hidden"><span style="display: block; width: 38%; height: 5px; background: {bar}"></span></span>3/14</span></span></a>
</div>
"""


set_zone("homnay")
page("HomNay.dc.html", "Hôm nay", homnay(DARK), tab="homnay", gap=14, pad="56px 20px 0")
page("HomNaySang.dc.html", "Hôm nay — chế độ sáng", homnay(LIGHT, "Sang"), tab="homnay", gap=14, th=LIGHT, suffix="Sang", pad="56px 20px 0")

_old_body3 = f"""
<div style="display: flex; align-items: flex-end; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px">
{eyebrow('Thứ Ba · 29 tháng 9')}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 30px; line-height: 1.02; letter-spacing: -0.035em">Chào buổi sáng,<br><span style="{GRADTEXT}">Minh</span></h1>
</div>
{icon_btn('bell', 'Thông báo, có tin mới', dot=True)}
</div>
<article style="position: relative; overflow: hidden; border-radius: 24px; padding: 20px; background: {HERO}; color: {INK}; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 24px 56px rgba(255,139,208,0.32)">
<div aria-hidden="true" style="position: absolute; right: -40px; top: -50px; width: 170px; height: 170px; border-radius: 999px; background: radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,255,255,0) 68%); animation: celes-troi 10s ease-in-out infinite"></div>
<div style="display: flex; justify-content: space-between; align-items: center; position: relative"><span style="{EYEBROW}; color: #4A2A4A">Nhận định hôm nay</span><span style="height: 28px; padding: 0 10px; border-radius: 999px; background: #240029; color: #FFF1BD; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600">{ic('briefcase', 14, 2)}Công việc</span></div>
<h2 style="margin: 2px 0 0; {DISPLAY}; font-weight: 800; font-size: 26px; line-height: 1.06; letter-spacing: -0.03em; position: relative">Chốt việc đang dở trước khi nhận thêm việc mới.</h2>
<p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3A1640; position: relative">Hôm nay bạn làm tốt nhất khi khép lại một việc cũ. Việc mới hấp dẫn cỡ nào cũng để mai hẵng nhận lời.</p>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; position: relative; margin-top: 2px">
<div style="border-radius: 14px; padding: 10px 12px; background: rgba(255,255,255,0.55); display: flex; flex-direction: column; gap: 2px"><span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #4A2A4A">{ic('clock', 14, 2)}Giờ thuận</span><span style="{DISPLAY}; font-size: 19px; font-weight: 700">9h – 11h</span></div>
<div style="border-radius: 14px; padding: 10px 12px; background: rgba(255,255,255,0.55); display: flex; flex-direction: column; gap: 2px"><span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #4A2A4A">{ic('wave', 14, 2)}Nhịp ngày</span><span style="{DISPLAY}; font-size: 19px; font-weight: 700">Chậm mà chắc</span></div>
</div>
</article>
<section style="border-radius: 20px; padding: 16px; {GLASS}; display: flex; flex-direction: column; gap: 12px">
<div style="display: flex; align-items: center; gap: 10px">{orb(30)}<span style="font-size: 13px; font-weight: 600; color: {ACCENT}">Celes vẫn nhớ</span><span style="margin-left: auto; font-size: 12px; color: {MUTED}">Tuần trước</span></div>
<p style="margin: 0; {VOICE}; font-size: 19px; line-height: 1.32; color: #ECE3EF">“Bạn kể đang cân nhắc một lời mời làm việc. Chuyện đó tới đâu rồi?”</p>
<div style="display: flex; gap: 10px">
<a href="Celes.dc.html" style="flex-grow: 1; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #E23BA8, {FUCHSIA} 55%, #A8157E); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 22px rgba(211,34,152,0.4); color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 700; text-decoration: none">Kể tiếp với Celes</a>
<button type="button" style="height: 46px; padding: 0 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.11); background: transparent; color: {TEXT}; font-size: 15px; font-weight: 500">Để sau</button>
</div>
</section>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
<a href="ManhYeu.dc.html" style="border-radius: 20px; padding: 14px; {GLASS}; display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: {TEXT}">
<span style="width: 36px; height: 36px; border-radius: 12px; background: rgba(255,203,15,0.16); color: {GOLD}; display: flex; align-items: center; justify-content: center">{ic('radar', 20)}</span>
<span style="{DISPLAY}; font-size: 17px; font-weight: 700; line-height: 1.15">Bản đồ của Minh</span><span style="font-size: 12px; color: {MUTED}">Lá số · Mạnh – yếu</span></a>
<a href="#" style="border-radius: 20px; padding: 14px; {GLASS}; display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: {TEXT}">
<span style="width: 36px; height: 36px; border-radius: 12px; background: rgba(255,139,208,0.16); color: {ACCENT}; display: flex; align-items: center; justify-content: center">{ic('book', 20)}</span>
<span style="{DISPLAY}; font-size: 17px; font-weight: 700; line-height: 1.15">Đọc tiếp</span>
<span style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {MUTED}">Sự nghiệp<span style="flex-grow: 1; height: 5px; border-radius: 3px; background: rgba(243,241,244,0.16); overflow: hidden"><span style="display: block; width: 38%; height: 5px; background: {HERO}"></span></span>3/8</span></a>
</div>
"""

# =====================================================================
# 2b · Celes
# =====================================================================
set_zone("celes")
mem = ["Làm ở công ty 3 năm", "Cân nhắc lời mời làm việc", "Kết hôn 2021"]
memchips = "".join(f'<span style="flex-shrink: 0; height: 32px; padding: 0 12px; border-radius: 999px; {GLASS}; display: flex; align-items: center; gap: 6px; font-size: 13px; white-space: nowrap">{ic("memory", 14, 1.9, GOLD)}{m}</span>' for m in mem)
sugg = ["So với chỗ hiện tại?", "Tháng nào nên trả lời?", "Còn tiền bạc?"]
suggchips = "".join(f'<button type="button" style="flex-shrink: 0; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(242,138,201,0.35); background: rgba(242,138,201,0.08); color: #FFD0EA; font-size: 14px; font-weight: 500; white-space: nowrap">{s}</button>' for s in sugg)
body4 = f"""
<div style="display: flex; align-items: center; gap: 12px">
{orb(48)}
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="{DISPLAY}; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1">Celes</span><span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {MUTED}"><span style="width: 7px; height: 7px; border-radius: 999px; background: #4ADE80; box-shadow: 0 0 8px #4ADE80; animation: celes-nhip 2.4s ease-in-out infinite"></span>Đang nhớ 3 điều về bạn</span></div>
{icon_btn('new', 'Cuộc trò chuyện mới')}
</div>
<div style="display: flex; gap: 8px; overflow: hidden; margin-right: -20px; -webkit-mask-image: linear-gradient(90deg, #000 80%, transparent); mask-image: linear-gradient(90deg, #000 80%, transparent)">{memchips}</div>
<span style="align-self: center; font-size: 12px; color: {MUTED}">Hôm nay · 8:12</span>
<div style="align-self: flex-end; max-width: 280px; border-radius: 22px 22px 6px 22px; padding: 12px 16px; background: linear-gradient(135deg, #E23BA8, {FUCHSIA} 60%, #A8157E); box-shadow: 0 10px 26px rgba(211,34,152,0.35); font-size: 15px; line-height: 1.45; color: #FFFFFF">Tôi nhận được offer cụ thể rồi. Lương cao hơn 30% nhưng phải chuyển sang mảng mới.</div>
<div style="display: flex; gap: 10px; align-items: flex-start">
{orb(28, glow=False)}
<div style="flex-grow: 1; border-radius: 6px 22px 22px 22px; padding: 14px 16px; {GLASS}; display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; {VOICE}; font-size: 20px; line-height: 1.25; color: #ECE3EF">Một lời mời đáng để cân nhắc kỹ.</p>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {TEXT}">Quãng 35–44 của bạn thiên về dựng nền. Mảng mới hợp khi bạn mang theo được thứ mình giỏi nhất — sắp xếp việc rối.</p>
<span style="font-size: 13px; font-weight: 600; color: {ACCENT}">Hai câu nên tự hỏi</span>
<ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; font-size: 15px; line-height: 1.4"><li>Việc mới có cần thứ bạn giỏi?</li><li>Bạn đang chạy khỏi, hay chạy tới?</li></ol>
<div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.077); padding-top: 4px"><span style="{MONO}; font-size: 11px; color: {MUTED}">Sự nghiệp · Quãng 35–44</span><button type="button" aria-label="Lưu câu trả lời" style="width: 44px; height: 36px; border: none; background: transparent; color: {TEXT}; display: flex; align-items: center; justify-content: center; padding: 0">{ic('bookmark', 18)}</button></div>
</div>
</div>
<div style="position: absolute; left: 20px; right: 0; bottom: 30px; display: flex; flex-direction: column; gap: 10px; z-index: 5">
<div style="display: flex; gap: 8px; overflow: hidden">{suggchips}</div>
<div style="margin-right: 20px; height: 54px; border-radius: 18px; background: rgba(20,18,24,0.94); border: 1px solid rgba(242,138,201,0.30); box-shadow: 0 0 0 4px rgba(242,138,201,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); display: flex; align-items: center; gap: 4px; padding: 0 5px 0 16px">
<input type="text" aria-label="Tin nhắn cho Celes" placeholder="Hỏi Celes điều bạn đang nghĩ…" style="flex-grow: 1; min-width: 0; height: 50px; border: none; outline: none; background: transparent; font-family: inherit; font-size: 16px; color: {TEXT}">
<button type="button" aria-label="Nói" style="width: 44px; height: 44px; border: none; border-radius: 14px; background: transparent; color: {MUTED}; display: flex; align-items: center; justify-content: center; padding: 0">{ic('mic', 20)}</button>
<button type="button" aria-label="Gửi" style="width: 44px; height: 44px; border: none; border-radius: 14px; background: linear-gradient(135deg, #E23BA8, {FUCHSIA} 60%, #A8157E); box-shadow: 0 6px 16px rgba(211,34,152,0.45); color: #FFFFFF; display: flex; align-items: center; justify-content: center; padding: 0">{ic('up', 20, 2.3)}</button>
</div>
</div>
"""
page("Celes.dc.html", "Trò chuyện với Celes", body4, tab="celes", gap=12)

# =====================================================================
# 2c · Hành trình — đường đời có tính điểm trên đường cong
# =====================================================================
def cubic(p0, p1, p2, p3, t):
    u = 1 - t
    return tuple(u**3*a + 3*u*u*t*b + 3*u*t*t*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3))

SEGS = [((16, 130), (50, 124), (70, 92), (106, 96)),
        ((106, 96), (140, 100), (150, 70), (180, 62)),
        ((180, 62), (215, 54), (240, 100), (274, 92)),
        ((274, 92), (300, 86), (318, 52), (334, 44))]
D = "M16 130 " + " ".join(f"C{a[0]} {a[1]}, {b[0]} {b[1]}, {c[0]} {c[1]}" for _, a, b, c in SEGS)

def y_at(x):
    for s in SEGS:
        if s[0][0] <= x <= s[3][0]:
            lo, hi = 0.0, 1.0
            for _ in range(60):
                m = (lo + hi) / 2
                if cubic(*s, m)[0] < x: lo = m
                else: hi = m
            return round(cubic(*s, lo)[1], 1)
# 25–50 tuổi trên 16..334
def x_age(a): return round(16 + (a - 25) * (334 - 16) / 25, 1)
xn, x21, x24 = x_age(37), x_age(32), x_age(35)
yn, y21, y24 = y_at(xn), y_at(x21), y_at(x24)
b35, b45 = x_age(35), x_age(45)
chart = f"""<svg width="318" height="186" viewBox="0 0 350 186" role="img" aria-label="Đường đời từ 25 đến 50 tuổi. Mốc: kết hôn 2021, chuyển việc 2024. Bây giờ 37 tuổi, trong quãng 35 đến 44." style="display: block; width: 100%; height: auto; overflow: visible">
<defs>
<linearGradient id="ht-net" x1="0" x2="1"><stop offset="0" stop-color="#2FA99A"/><stop offset="0.6" stop-color="#5CD3BE"/><stop offset="1" stop-color="#C4F5EA"/></linearGradient>
<linearGradient id="ht-vung" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5CD3BE" stop-opacity="0.26"/><stop offset="1" stop-color="#5CD3BE" stop-opacity="0"/></linearGradient>
<clipPath id="ht-qua"><rect x="0" y="0" width="{xn}" height="186"/></clipPath><clipPath id="ht-toi"><rect x="{xn}" y="0" width="{round(350-xn,1)}" height="186"/></clipPath>
<filter id="ht-sang" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>
</defs>
<rect x="{b35}" y="10" width="{round(b45-b35,1)}" height="140" rx="10" fill="rgba(92,211,190,0.06)"/>
<g clip-path="url(#ht-qua)"><path d="{D} L334 150 L16 150 Z" fill="url(#ht-vung)"/><path d="{D}" fill="none" stroke="url(#ht-net)" stroke-width="7" stroke-linecap="round" filter="url(#ht-sang)" opacity="0.8"/><path d="{D}" fill="none" stroke="url(#ht-net)" stroke-width="3" stroke-linecap="round"/></g>
<path d="{D}" fill="none" stroke="rgba(243,241,244,0.35)" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round" clip-path="url(#ht-toi)"/>
<line x1="{xn}" y1="14" x2="{xn}" y2="150" stroke="#C4F5EA" stroke-opacity="0.5" stroke-dasharray="2 4"/>
<circle cx="{x21}" cy="{y21}" r="5" fill="#0B0A0D" stroke="#5CD3BE" stroke-width="2.5"/>
<circle cx="{x24}" cy="{y24}" r="5" fill="#0B0A0D" stroke="#C4F5EA" stroke-width="2.5"/>
<text x="{x21}" y="{y21-14}" text-anchor="middle" font-size="11" font-weight="600" fill="#E6DDEA" font-family="Be Vietnam Pro, sans-serif">Kết hôn</text>
<text x="{x24 - 6}" y="{y24+24}" text-anchor="middle" font-size="11" font-weight="600" fill="#E6DDEA" font-family="Be Vietnam Pro, sans-serif">Chuyển việc</text>
<circle cx="{xn}" cy="{yn}" r="14" fill="#5CD3BE" opacity="0.4" filter="url(#ht-sang)"/>
<circle cx="{xn}" cy="{yn}" r="7.5" fill="#C4F5EA" stroke="#0B0A0D" stroke-width="3"/>
<rect x="{xn-38}" y="0" width="76" height="22" rx="11" fill="#C4F5EA"/>
<text x="{xn}" y="15" text-anchor="middle" font-size="11" font-weight="700" fill="#06231E" font-family="Be Vietnam Pro, sans-serif">Bây giờ · 37</text>
<g font-family="JetBrains Mono, monospace" font-size="11" fill="rgba(243,241,244,0.72)" text-anchor="middle">
<text x="{x_age(25)}" y="172">25</text><text x="{x_age(30)}" y="172">30</text><text x="{x_age(35)}" y="172">35</text><text x="{x_age(40)}" y="172">40</text><text x="{x_age(45)}" y="172">45</text><text x="{x_age(50)}" y="172">50</text>
</g>
</svg>"""
set_zone("hanhtrinh")
mile = [("2024", "Chuyển sang công ty hiện tại", "Đúng năm bước vào quãng 35–44"), ("2021", "Kết hôn", "Năm phần tình cảm được đánh thức")]
miles = "".join(
    f'<div style="display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; {"border-bottom: 1px solid rgba(255,255,255,0.066);" if i == 0 else ""}">'
    f'<span style="{DISPLAY}; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; {GRADTEXT}; width: 52px; flex-shrink: 0">{y}</span>'
    f'<div style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600">{t}</span><span style="font-size: 13px; line-height: 1.4; color: {MUTED}">{s}</span></div></div>'
    for i, (y, t, s) in enumerate(mile))
body5 = f"""
<div style="display: flex; align-items: flex-start; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px">
{zone_mark()}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 26px; letter-spacing: -0.03em; line-height: 1.05">Hành trình <span style="{GRADTEXT}">của bạn</span></h1>
<span style="font-size: 13px; color: {MUTED}; white-space: nowrap">Mỗi quãng mười năm có một nhịp riêng.</span>
</div>
{avatar()}
</div>
<div role="tablist" aria-label="Xem theo" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 16px; {GLASS}">
<button type="button" role="tab" aria-selected="true" style="height: 40px; border-radius: 12px; border: none; {zone_on()}; font-size: 15px; font-weight: 700">Cả đời</button>
<button type="button" role="tab" aria-selected="false" style="height: 40px; border-radius: 12px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 500">Năm</button>
<button type="button" role="tab" aria-selected="false" style="height: 40px; border-radius: 12px; border: none; background: transparent; color: {MUTED}; font-size: 15px; font-weight: 500">Tháng</button>
</div>
<div style="border-radius: 22px; padding: 14px 16px 10px; {GLASS}">{chart}</div>
<a href="#" style="border-radius: 22px; text-decoration: none; color: {TEXT}">
<div style="border-radius: 22px; padding: 14px 16px; {zone_hero()}; display: flex; flex-direction: column; gap: 5px">
{eyebrow('Quãng hiện tại · 35–44 tuổi')}
<div style="display: flex; align-items: center; gap: 8px"><h2 style="margin: 0; flex-grow: 1; {DISPLAY}; font-weight: 700; font-size: 20px; line-height: 1.15; letter-spacing: -0.02em">Dựng nền và chọn lại vai trò</h2>{ic('chev', 18, 2, ACCENT)}</div>
<p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: {MUTED}">Hợp làm chắc từng bước hơn đổi hướng lớn. Việc xây mấy năm này quyết định nhịp mười năm sau.</p>
</div>
</a>
<div style="display: flex; align-items: center; justify-content: space-between">
{eyebrow('Mốc của riêng bạn', MUTED)}
<button type="button" style="height: 44px; padding: 0 4px; border: none; background: transparent; color: {ACCENT}; display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600">{ic('plus', 16, 2.2)}Thêm mốc</button>
</div>
<div style="margin-top: -12px">{miles}</div>
"""
page("HanhTrinh.dc.html", "Hành trình của bạn", body5, tab="hanhtrinh", gap=12, pad="56px 20px 0")

# =====================================================================
# 3a · Bản đồ — Mạnh yếu (radar)
# =====================================================================
set_zone("laso")
pts = "175,112.7 196.1,93.5 240.7,92 227.8,130 243.2,169.4 187.5,151.7 175,157.8 157.7,160 119.3,162.2 119.3,130 91.9,82 164.4,111.7"
kinds = ["c", "b", "t", "b", "T", "c", "c", "b", "t", "b", "t", "c"]
col = {"t": "#4ADE80", "T": "#4ADE80", "b": "rgba(243,241,244,0.55)", "c": "#F0A44B"}
dots = []
for (xy, k) in zip(pts.split(), kinds):
    x, y = xy.split(",")
    if k == "T":
        dots.append(f'<circle cx="{x}" cy="{y}" r="13" fill="#4ADE80" opacity="0.3" filter="url(#ra-sang)"/><circle cx="{x}" cy="{y}" r="7" fill="#4ADE80" stroke="#FFF4FA" stroke-width="2.5"/>')
    else:
        dots.append(f'<circle cx="{x}" cy="{y}" r="4.5" fill="{col[k]}" stroke="#0B0A0D" stroke-width="2"/>')
labels = [(175, 16, "middle", "Tính cách"), (234, 31, "start", "Cha mẹ"), (277, 74, "start", "Tinh thần"), (293, 134, "start", "Nhà cửa"),
          (277, 193, "start", "Sự nghiệp"), (234, 236, "start", "Bạn bè"), (175, 256, "middle", "Đi xa"), (116, 236, "end", "Sức khỏe"),
          (73, 193, "end", "Tiền bạc"), (57, 134, "end", "Con cái"), (73, 74, "end", "Tình duyên"), (116, 31, "end", "Anh em")]
lab = "".join(f'<text x="{x}" y="{y}" text-anchor="{a}" font-size="12" font-weight="{700 if t=="Sự nghiệp" else 500}" fill="{"#FFFFFF" if t=="Sự nghiệp" else "rgba(243,241,244,0.8)"}">{t}</text>' for x, y, a, t in labels)
radar = f"""<svg width="350" height="262" viewBox="0 0 350 262" role="img" aria-label="Biểu đồ radar độ thuận lợi của 12 lĩnh vực. Thuận lợi nhất: Tình duyên, Sự nghiệp, Tinh thần, Tiền bạc. Cần chăm chút: Tính cách, Bạn bè, Đi xa, Anh em." style="display: block; font-family: 'Be Vietnam Pro', sans-serif; overflow: visible">
<defs>
<linearGradient id="ra-vung" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A393FF" stop-opacity="0.5"/><stop offset="1" stop-color="#F28AC9" stop-opacity="0.32"/></linearGradient>
<linearGradient id="ra-net" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9BFFF"/><stop offset="1" stop-color="#F28AC9"/></linearGradient>
<radialGradient id="ra-nen"><stop offset="0" stop-color="#A393FF" stop-opacity="0.16"/><stop offset="1" stop-color="#A393FF" stop-opacity="0"/></radialGradient>
<filter id="ra-sang" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<circle cx="175" cy="130" r="100" fill="url(#ra-nen)"/>
<g fill="none" stroke="rgba(255,255,255,0.088)">
<polygon points="175,34 223,46.9 258.1,82 271,130 258.1,178 223,213.1 175,226 127,213.1 91.9,178 79,130 91.9,82 127,46.9"/>
<polygon points="175,65.7 207.2,74.3 230.7,97.9 239.3,130 230.7,162.2 207.2,185.7 175,194.3 142.9,185.7 119.3,162.2 110.7,130 119.3,97.9 142.9,74.3"/>
<polygon points="175,97.4 191.3,101.8 203.2,113.7 207.6,130 203.2,146.3 191.3,158.2 175,162.6 158.7,158.2 146.8,146.3 142.4,130 146.8,113.7 158.7,101.8"/>
<path d="M175 130L175 34M175 130L223 46.9M175 130L258.1 82M175 130L271 130M175 130L258.1 178M175 130L223 213.1M175 130L175 226M175 130L127 213.1M175 130L91.9 178M175 130L79 130M175 130L91.9 82M175 130L127 46.9"/>
</g>
<circle cx="175" cy="130" r="47.5" fill="none" stroke="rgba(243,241,244,0.4)" stroke-width="1.2" stroke-dasharray="4 4"/>
<polygon points="{pts}" fill="none" stroke="url(#ra-net)" stroke-width="6" stroke-linejoin="round" filter="url(#ra-sang)" opacity="0.7"/>
<polygon points="{pts}" fill="url(#ra-vung)" stroke="url(#ra-net)" stroke-width="2.2" stroke-linejoin="round"/>
{''.join(dots)}
{lab}
</svg>"""
def laso_header(th, active, suffix="", sub="Chạm một cung để đọc giải nghĩa"):
    T, M = th["text"], th["muted"]
    on = zone_on() if th is DARK else f"background: {HERO}; color: {INK}"
    tabs = [("laso", f"LaSo{suffix}.dc.html", "Lá số"), ("tongquan", "TongQuan.dc.html", "Tổng quan"), ("chuyensau", "ChuyenSau.dc.html", "Chuyên sâu"), ("manhyeu", "ManhYeu.dc.html", "Mạnh – yếu")]
    seg = "".join(
        (f'<a href="{h}" aria-current="page" style="height: 36px; border-radius: 10px; {on}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; white-space: nowrap; text-decoration: none">{l}</a>'
         if k == active else
         f'<a href="{h}" style="height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; white-space: nowrap; text-decoration: none; color: {M}">{l}</a>')
        for k, h, l in tabs)
    share = (f'<button type="button" aria-label="Chia sẻ lá số" style="width: 44px; height: 44px; border-radius: 14px; {th["glass"]}; display: flex; align-items: center; justify-content: center; color: {T}; padding: 0; flex-shrink: 0">{ic("share", 20, 2)}</button>')
    return f"""<div style="display: flex; align-items: center; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px">{zone_mark() if th is DARK else ''}<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; line-height: 1.05">Lá số của <span style="{th['gradtext']}">Minh</span></h1><span style="font-size: 12px; color: {M}; white-space: nowrap">{sub}</span></div>
{share}
{avatar(th)}
</div>
<nav aria-label="Chế độ xem lá số" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 14px; {th['seg']}">{seg}</nav>"""


body6 = f"""
{laso_header(DARK, 'manhyeu', sub='Nơi thuận lợi, nơi cần chăm chút')}
<p style="margin: 0; font-size: 14px; line-height: 1.45; color: {MUTED}">So trong chính lá số của bạn. Vòng nét đứt là mức giữa.</p>
{radar}
<div style="display: flex; justify-content: center; gap: 16px; font-size: 13px; font-weight: 500; color: {MUTED}">
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: #4ADE80; box-shadow: 0 0 8px #4ADE80"></span>Thuận lợi</span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: rgba(243,241,244,0.55)"></span>Bình</span>
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 999px; background: #F0A44B"></span>Cần chăm chút</span>
</div>
<article style="border-radius: 22px; padding: 16px; {GLASS}; display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; justify-content: space-between; align-items: center"><span style="{DISPLAY}; font-size: 18px; font-weight: 700">Sự nghiệp</span><span style="height: 28px; padding: 0 11px; border-radius: 999px; background: rgba(74,222,128,0.16); color: #86EFAC; display: flex; align-items: center; font-size: 12px; font-weight: 700">Thuận lợi</span></div>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {TEXT}">Có người có vị thế sẵn lòng nâng đỡ bạn, và phần này mượn được sức từ chuyện bạn đời rất vững.</p>
<a href="BaiDoc.dc.html" style="height: 36px; display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: {ACCENT}; text-decoration: none">Đọc chuyên sâu Sự nghiệp {ic('arrow', 16, 2.2)}</a>
</article>
"""
page("ManhYeu.dc.html", "Lá số — Mạnh yếu", body6, tab="laso", gap=12)

# =====================================================================
# 3b · Mối quan hệ
# =====================================================================
set_zone("moiquanhe")
ppl = [("M", "Bạn", "#FFBDD3", False), ("L", "Lan · vợ", "#FFF1BD", True), ("H", "Mẹ", "#BBF7D0", False), ("T", "Tuấn", "#E6DDEA", False)]
prow = []
for ch, nm, c, on in ppl:
    ring = f"padding: 3px; background: conic-gradient(from 200deg, #FFD6CF, #FF8F80, #E23BA8, #FFD6CF);" if on else "padding: 3px; background: rgba(255,255,255,0.088);"
    prow.append(f'<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: {TEXT if on else MUTED}; font-size: 13px; font-weight: {700 if on else 500}; width: 64px">'
                f'<span style="border-radius: 999px; {ring}"><span style="width: 52px; height: 52px; border-radius: 999px; border: 3px solid #0B0A0D; box-sizing: border-box; background: {c}; color: {INK}; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-weight: 800; font-size: 19px">{ch}</span></span>{nm}</a>')
prow.append(f'<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: {MUTED}; font-size: 13px; width: 64px"><span style="width: 58px; height: 58px; border-radius: 999px; border: 1.5px dashed rgba(255,255,255,0.22); box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: {TEXT}">{ic("plus", 20, 2)}</span>Thêm</a>')
body7 = f"""
<div style="display: flex; align-items: flex-start; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px">
{zone_mark()}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 26px; letter-spacing: -0.03em; line-height: 1.05">Mối <span style="{GRADTEXT}">quan hệ</span></h1>
<span style="font-size: 13px; color: {MUTED}; white-space: nowrap">Hiểu người thân qua lá số của hai người</span>
</div>
{avatar()}
</div>
<div style="display: flex; justify-content: space-between">{''.join(prow)}</div>
<article style="position: relative; overflow: hidden; border-radius: 24px; padding: 18px; {zone_hero()}; color: {TEXT}; display: flex; flex-direction: column; gap: 8px">
<div aria-hidden="true" style="display: flex; align-items: center">
<span style="width: 52px; height: 52px; border-radius: 999px; background: rgba(211,34,152,0.85); color: #FFFFFF; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-weight: 800; font-size: 19px; box-shadow: 0 0 0 3px #17141B">M</span>
<span style="width: 52px; height: 52px; margin-left: -14px; border-radius: 999px; background: #FF8F80; color: #2A0A06; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-weight: 800; font-size: 19px; box-shadow: 0 0 0 3px #17141B">L</span>
<span style="margin-left: 12px; {EYEBROW}; color: {ACCENT}">Minh &amp; Lan</span>
</div>
<h2 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 20px; line-height: 1.12; letter-spacing: -0.025em">Một người dựng, một người giữ.</h2>
<p style="margin: 0; font-size: 14px; line-height: 1.5; color: {MUTED}">Bạn lo đường dài, Lan giữ nhịp trong nhà. Hai người vững nhất khi mỗi người được làm đúng vai của mình.</p>
</article>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
<div style="border-radius: 20px; padding: 14px; {GLASS}; display: flex; flex-direction: column; gap: 2px"><span style="{DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1; color: #86EFAC">3</span><span style="font-size: 14px; font-weight: 600">điều hợp nhau</span><span style="font-size: 12px; color: {MUTED}">Tiền bạc · Con cái</span></div>
<div style="border-radius: 20px; padding: 14px; {GLASS}; display: flex; flex-direction: column; gap: 2px"><span style="{DISPLAY}; font-size: 34px; font-weight: 800; line-height: 1; color: #FBC98A">1</span><span style="font-size: 14px; font-weight: 600">điều cần nhường</span><span style="font-size: 12px; color: {MUTED}">Lúc căng thẳng</span></div>
</div>
<section style="border-radius: 20px; padding: 14px 16px; {GLASS}; display: flex; gap: 12px; align-items: flex-start">
{orb(28, glow=False)}
<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; font-weight: 600; color: {ACCENT}">Tuần này, Celes gợi ý</span><p style="margin: 0; {VOICE}; font-size: 17px; line-height: 1.3; color: #ECE3EF">“Kể cho Lan nghe về lời mời làm việc trước khi bạn quyết.”</p>
<a href="Celes.dc.html" style="height: 36px; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: {ACCENT}; text-decoration: none">Hỏi Celes về hai người {ic('arrow', 16, 2.2)}</a></div>
</section>
"""
page("MoiQuanHe.dc.html", "Mối quan hệ", body7, tab="moiquanhe", gap=14, pad="56px 20px 0")

# =====================================================================
# 3c · Tôi
# =====================================================================
set_zone("toi")
memrows = [("briefcase", "Làm ở công ty hiện tại 3 năm"), ("sign", "Đang cân nhắc một lời mời làm việc"), ("heart", "Đã kết hôn năm 2021")]
mr = "".join(
    f'<div style="height: 50px; display: flex; align-items: center; gap: 12px; padding: 0 14px; {"border-bottom: 1px solid rgba(255,255,255,0.066);" if i < 2 else ""}">'
    f'<span style="width: 30px; height: 30px; border-radius: 10px; background: rgba(255,203,15,0.14); color: {GOLD}; display: flex; align-items: center; justify-content: center; flex-shrink: 0">{ic(k, 16, 2)}</span>'
    f'<span style="font-size: 15px">{t}</span></div>' for i, (k, t) in enumerate(memrows))
sets = [("bell", "Thông báo", "Mỗi sáng 7:30"), ("moon", "Giao diện", "Theo máy"), ("shield", "Quyền riêng tư & điều khoản", None)]
st = "".join(
    f'<a href="#" style="height: 50px; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-bottom: 1px solid rgba(255,255,255,0.066); text-decoration: none; color: {TEXT}; font-size: 15px">'
    f'{ic(k, 20, 1.75, MUTED)}<span style="flex-grow: 1">{t.replace("&", "&amp;")}</span>'
    + (f'<span style="font-size: 13px; color: {MUTED}">{v}</span>' if v else ic("chev", 16, 2, MUTED)) + '</a>' for k, t, v in sets)
st += f'<a href="#" style="height: 50px; display: flex; align-items: center; gap: 12px; padding: 0 14px; text-decoration: none; color: #FF9CA8; font-size: 15px; font-weight: 600">{ic("trash", 20, 1.75, "#FF9CA8")}Xoá tài khoản</a>'
body8 = f"""
<div style="display: flex; align-items: center; gap: 12px; margin-bottom: -4px">{icon_btn('back', 'Quay lại', href='HomNay.dc.html')}{zone_mark()}</div>
<div style="display: flex; align-items: center; gap: 14px">
<span style="border-radius: 999px; padding: 2px; background: conic-gradient(from 0deg, #F28AC9, #A393FF, #5CD3BE, #F5C451, #F28AC9)"><span style="width: 64px; height: 64px; border-radius: 999px; border: 3px solid #0B0A0D; box-sizing: border-box; background: #1F1B24; color: {TEXT}; display: flex; align-items: center; justify-content: center; {DISPLAY}; font-weight: 800; font-size: 24px">M</span></span>
<div style="display: flex; flex-direction: column; gap: 3px"><span style="{DISPLAY}; font-weight: 800; font-size: 30px; letter-spacing: -0.03em; line-height: 1">Minh</span><span style="font-size: 13px; color: {MUTED}">Đăng nhập bằng Apple · từ 09/2026</span></div>
</div>
<a href="LaSo.dc.html" style="border-radius: 22px; padding: 14px 16px; {GLASS}; display: flex; align-items: center; gap: 14px; text-decoration: none; color: {TEXT}">
<svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56"><defs><linearGradient id="toi-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9BFFF"/><stop offset="1" stop-color="#F28AC9"/></linearGradient></defs><polygon points="28,4 49,16 49,40 28,52 7,40 7,16" fill="none" stroke="rgba(255,255,255,0.11)"/><polygon points="28,14 44,20 40,40 28,44 13,36 18,17" fill="url(#toi-r)" fill-opacity="0.5" stroke="url(#toi-r)" stroke-width="1.8" stroke-linejoin="round"/></svg>
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px"><span style="{DISPLAY}; font-size: 18px; font-weight: 700">Lá số của tôi</span><span style="font-size: 13px; color: {MUTED}">Lá số · Tổng quan · Chuyên sâu</span></div>
{ic('chev', 18, 2, MUTED)}
</a>
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: -8px">
{eyebrow('Celes đang nhớ', MUTED)}
<button type="button" style="height: 44px; padding: 0 4px; border: none; background: transparent; color: {ACCENT}; font-size: 14px; font-weight: 600">Sửa</button>
</div>
<div style="border-radius: 20px; {GLASS}; display: flex; flex-direction: column">{mr}</div>
<span style="font-size: 13px; color: {MUTED}; margin-top: -6px">Chỉ những điều bạn tự kể — Celes không tự suy ra.</span>
<div style="border-radius: 20px; {GLASS}; display: flex; flex-direction: column">{st}</div>
"""
page("Toi.dc.html", "Tài khoản", body8, gap=14)

# =====================================================================
# 4 · Lá số & luận giải
# =====================================================================
set_zone("laso")
# (cột, hàng, can.chi, cung, hạn, chính tinh [(tên, độ)], tứ hoá, cát, hung, tràng sinh)
CUNG = [
 (1, 1, "T.Tỵ", "Tật Ách", 75, [("Vũ Khúc", "H"), ("Phá Quân", "H")], "QUYỀN", ["Tả Phù", "Văn Xương·Đ", "Trực Phù*", "Đại Hao*"], ["Phá Toái", "Thiên Sứ"], "Tuyệt"),
 (2, 1, "N.Ngọ", "Tài Bạch", 85, [("Thái Dương", "M")], "LỘC", ["Thiên Khôi", "Bát Tọa", "Thiên Phúc", "Thái Tuế*", "Phục Binh*"], ["Địa Không·H", "Hỏa Tinh·Đ"], "Thai"),
 (3, 1, "Q.Mùi", "Tử Tức", 95, [("Thiên Phủ", "Đ")], None, ["Phong Cáo", "Ân Quang", "Thiên Quý", "Thiếu Dương*", "Quan Phủ*"], ["Đà La·Đ", "Thiên Không"], "Dưỡng"),
 (4, 1, "G.Thân", "Phu Thê", 105, [("Thiên Cơ", "V"), ("Thái Âm", "V")], "KHOA", ["Lộc Tồn", "Thiên Mã·Đ", "Tam Thai", "Địa Giải", "Tang Môn*", "Bác Sĩ*"], ["Cô Thần"], "Tr.Sinh"),
 (1, 2, "C.Thìn", "Thiên Di", 65, [("Thiên Đồng", "H")], "KỴ", ["Phượng Các", "Quốc Ấn", "Giải Thần", "Thiên Tài", "Điếu Khách*", "Bệnh Phù*"], ["Địa Kiếp·H", "Quả Tú", "Lưu Hà", "Thiên La"], "Mộ"),
 (4, 2, "Ấ.Dậu", "Huynh Đệ", 115, [("Tử Vi", "B"), ("Tham Lang", "H")], None, ["Hữu Bật", "Văn Khúc·H", "Hồng Loan", "Thiên Giải", "Thiếu Âm*", "Lực Sĩ*"], ["Kình Dương·H"], "Mộc Dục"),
 (1, 3, "K.Mão", "Nô Bộc", 55, [], None, ["Đào Hoa", "Thiên Hỷ", "Thiên Đức", "Phúc Đức*", "Hỷ Thần*"], ["Thiên Thương"], "Tử"),
 (4, 3, "B.Tuất", "Mệnh", 5, [("Cự Môn", "H")], None, ["Long Trì", "Hoa Cái", "Đẩu Quân", "Quan Phù*", "Thanh Long*"], ["Thiên Hình·H", "Linh Tinh·H", "Địa Võng"], "Quan Đới"),
 (1, 4, "M.Dần", "Quan Lộc", 45, [], None, ["Thiên Việt", "Thiên Y", "Thiên Trù", "Thiên Thọ", "Bạch Hổ*", "Phi Liêm*"], ["Thiên Riêu·Đ"], "Bệnh"),
 (2, 4, "K.Sửu", "Điền Trạch", 35, [("Liêm Trinh", "Đ"), ("Thất Sát", "Đ")], None, ["Đường Phù", "Long Đức*", "Tấu Thư*"], [], "Suy"),
 (3, 4, "M.Tý", "Phúc Đức", 25, [("Thiên Lương", "M")], None, ["Tuế Phá*", "Tướng Quân*"], ["Thiên Khốc·Đ", "Thiên Hư·Đ"], "Đế Vượng"),
 (4, 4, "Đ.Hợi", "Phụ Mẫu", 15, [("Thiên Tướng", "Đ")], None, ["Thai Phụ", "Nguyệt Đức", "Thiên Quan", "LN Văn Tinh", "Tử Phù*", "Tiểu Hao*"], ["Kiếp Sát"], "Lâm Quan"),
]
TAM_PHUONG = {"Tài Bạch", "Thiên Di", "Quan Lộc"}
DAI_HAN = 35
INFO = [("Năm", "1990 · Canh Ngọ"), ("Tháng", "3 (2 âm) · Kỷ Mão"), ("Ngày", "12 (16 âm) · Bính Tý"), ("Giờ", "9h–10h59 · Quý Tỵ"),
        ("Năm xem", "2026 · Bính Ngọ · 37t"), ("Âm dương", "Dương Nam · thuận lý"), ("Mệnh", "Lộ Bàng Thổ"), ("Cục", "Thổ Ngũ Cục"),
        ("Mệnh chủ", "Lộc Tồn"), ("Thân chủ", "Hỏa Tinh")]
ROW_H = 120
PHU_FS = 7


def sao_phu(name, th, hung=False):
    # mỗi sao một dòng trong cột của nó (như PalaceCell trên web); tên dài được xuống dòng ở chỗ cách chữ
    vong = name.endswith("*")
    n = name.rstrip("*")
    do = ""
    if "·" in n:
        n, d = n.split("·")
        do = f'<span style="font-weight: 700; margin-left: 1px; color: {th["sM"] if d in "MVĐ" else th["sH"]}">{d}</span>'
    c = th["hung"] if hung else (th["vong"] if vong else th["cat"])
    return f'<span style="display: block; color: {c}">{n}{do}</span>'


def laso_grid(th, link=True):
    cells = []
    for c, r, cc, ten, han, chinh, hoa, cat, hung, ts in CUNG:
        menh, tp, dh = ten == "Mệnh", ten in TAM_PHUONG, han == DAI_HAN
        box = th["cellmenh"] if menh else (th["celltp"] if tp else th["cell"])
        if chinh:
            stars = "".join(
                f'<span style="display: block; font-size: 9.5px; font-weight: 700; line-height: 12px; color: {th["star"]}; white-space: nowrap; text-align: center">{n}'
                f'<span style="font-size: 6.5px; font-weight: 700; margin-left: 2px; vertical-align: 1px; color: {th["sM"] if d in "MVĐ" else (th["sB"] if d == "B" else th["sH"])}">{d}</span></span>'
                for n, d in chinh)
        else:
            stars = f'<span style="display: block; font-size: 8px; font-style: italic; line-height: 12px; text-align: center; color: {th["small"]}">Vô chính diệu</span>'
        hoachip = ""
        if hoa:
            hb, hf = th["hoa"][hoa]
            hoachip = f'<span style="align-self: center; margin-top: 1px; height: 11px; padding: 0 5px; border-radius: 999px; background: {hb}; color: {hf}; font-size: 6.5px; font-weight: 800; letter-spacing: 0.06em; display: flex; align-items: center; white-space: nowrap">HOÁ {hoa}</span>'
        hanst = (f'<span style="justify-self: end; height: 11px; padding: 0 3px; border-radius: 4px; background: {th["good"][0]}; color: {th["good"][1]}; font-weight: 700; display: flex; align-items: center">{han}</span>' if dh
                 else f'<span style="justify-self: end">{han}</span>')
        namecol = th["accent"] if menh else th["text"]
        than = f'<span style="margin-left: 3px; height: 10px; padding: 0 3px; border-radius: 3px; background: {th["tag"][0]}; color: {th["tag"][1]}; font-size: 6px; font-weight: 800; letter-spacing: 0.04em; display: flex; align-items: center">THÂN</span>' if ten == "Phu Thê" else ""
        cot1 = "".join(sao_phu(s, th) for s in cat)
        cot2 = "".join(sao_phu(s, th, True) for s in hung)
        tag = "a" if link else "div"
        href = ' href="CungChiTiet.dc.html"' if link else ""
        cells.append(
            f'<{tag}{href} aria-label="Cung {ten}, {cc}" style="grid-column: {c}; grid-row: {r}; position: relative; border-radius: 9px; {box}; box-sizing: border-box; padding: 5px 3px 4px; overflow: hidden; display: flex; flex-direction: column; text-decoration: none; color: {th["text"]}">'
            # dòng đầu: can chi · tràng sinh · số hạn
            f'<span style="display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; column-gap: 2px; height: 11px; {MONO}; font-size: 6.5px; letter-spacing: -0.02em; color: {th["small"]}"><span>{cc}</span><span style="text-align: center; white-space: nowrap; overflow: hidden">{ts}</span>{hanst}</span>'
            f'<span style="display: flex; align-items: center; justify-content: center; height: 11px; margin: 1px 0 1px; font-size: 7.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; color: {namecol}">{ten}{than}</span>'
            f'{stars}{hoachip}'
            # phụ tinh: HAI CỘT như web — trái cát / vòng sao, phải hung
            f'<span style="flex: 1; min-height: 0; overflow: hidden; margin-top: 3px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 3px; align-items: start; font-size: {PHU_FS}px; line-height: 8.5px; letter-spacing: -0.02em">'
            f'<span style="min-width: 0">{cot1}</span><span style="min-width: 0; text-align: right">{cot2}</span></span>'
            f'</{tag}>')
    info = "".join(f'<div style="display: flex; justify-content: space-between; gap: 6px; font-size: 8.5px; line-height: 12.5px; white-space: nowrap"><span style="color: {th["muted"]}">{k}</span><span style="font-weight: 600; text-align: right">{v}</span></div>' for k, v in INFO)
    center = (f'<div style="grid-column: 2 / span 2; grid-row: 2 / span 2; position: relative; overflow: hidden; border-radius: 12px; {th["center"]}; padding: 12px 12px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 4px">'
              f'<svg aria-hidden="true" width="180" height="180" viewBox="0 0 200 200" style="position: absolute; right: -64px; bottom: -64px; opacity: 0.45; animation: celes-vong 60s linear infinite"><g fill="none" stroke="{th["accent"]}" stroke-opacity="0.22"><circle cx="100" cy="100" r="44"/><circle cx="100" cy="100" r="70" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="96"/></g><circle cx="170" cy="100" r="4" fill="{GOLD}"/></svg>'
              f'<div style="display: flex; align-items: center; gap: 6px; position: relative">{orb(14, glow=False)}<span style="{MONO}; font-size: 8px; letter-spacing: 0.14em; color: {th["accent"]}">LÁ SỐ TỬ VI</span></div>'
              f'<span style="{DISPLAY}; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; position: relative; margin-bottom: 3px">Minh</span>'
              f'<div style="position: relative; display: flex; flex-direction: column">{info}</div></div>')
    tb, tf, tl = th["mark"]
    pill = f"height: 12px; padding: 0 6px; border-radius: 999px; background: {tb}; color: {tf}; border: 1px solid {tl}; box-sizing: border-box; {MONO}; font-size: 7px; font-weight: 600; letter-spacing: 0.1em; display: flex; align-items: center; z-index: 2"
    marks = (f'<span style="position: absolute; left: 50%; top: {ROW_H - 4.5}px; transform: translateX(-50%); {pill}">TRIỆT</span>'
             f'<span style="position: absolute; right: 26px; top: {2 * ROW_H - 1.5}px; {pill}">TUẦN</span>')
    return (f'<div role="group" aria-label="Lá số 12 cung" style="position: relative; margin: 0 -16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, {ROW_H}px); gap: 3px">'
            + "".join(cells) + center + marks + "</div>")


def laso_controls(th):
    G, T, M = th["glass"], th["text"], th["muted"]
    return f"""<div style="display: flex; gap: 8px; align-items: center; white-space: nowrap">
<button type="button" aria-label="Đổi năm xem, đang là 2026" style="height: 40px; padding: 0 10px 0 14px; border-radius: 14px; {G}; color: {T}; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; white-space: nowrap"><span style="color: {M}; font-weight: 500">Năm xem</span>2026{ic('caret', 16, 2.2)}</button>
<button type="button" aria-pressed="true" style="height: 40px; padding: 0 14px; border-radius: 14px; border: 1px solid {th['tgold'][1]}; background: {th['tgold'][0]}; color: {T}; display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; white-space: nowrap"><span style="width: 9px; height: 9px; border-radius: 3px; background: {GOLD}; box-shadow: 0 0 8px {GOLD}"></span>Tam phương</button>
<button type="button" style="margin-left: auto; height: 40px; padding: 0 4px; border: none; background: transparent; color: {th['accent']}; font-size: 13px; font-weight: 600; white-space: nowrap">Chú giải</button>
</div>"""


def laso_page(th, name, title, suffix=""):
    body = f"""
{laso_header(th, 'laso', suffix)}
{laso_grid(th)}
{laso_controls(th)}
"""
    page(name, title, body, tab="laso", gap=8, th=th, fade=False, suffix=suffix, pad="52px 20px 0")


laso_page(DARK, "LaSo.dc.html", "Lá số của Minh")
laso_page(LIGHT, "LaSoSang.dc.html", "Lá số — chế độ sáng", "Sang")

# ---------- 4b · Chạm một cung: bottom sheet ----------
def chip(text, bgc, fg, extra=""):
    return f'<span style="height: 30px; padding: 0 11px; border-radius: 999px; background: {bgc}; color: {fg}; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; white-space: nowrap; {extra}">{text}</span>'


tp_rows = [("Tài Bạch", "Thái Dương · miếu", "Hoá Lộc"), ("Quan Lộc", "Vô chính diệu · Thiên Việt", None), ("Thiên Di", "Thiên Đồng · hãm", "Hoá Kỵ")]
tpr = "".join(
    f'<div style="display: flex; align-items: center; gap: 10px; padding: 9px 0; {"border-bottom: 1px solid rgba(255,255,255,0.055);" if i < 2 else ""}">'
    f'<span style="width: 8px; height: 8px; border-radius: 3px; background: {GOLD}; flex-shrink: 0"></span>'
    f'<span style="width: 74px; flex-shrink: 0; font-size: 14px; font-weight: 600">{a}</span><span style="flex-grow: 1; font-size: 13px; color: {MUTED}">{b}</span>'
    + (f'<span style="font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 999px; background: {DARK["hoa"]["LỘC" if "Lộc" in h else "KỴ"][0]}; color: {DARK["hoa"]["LỘC" if "Lộc" in h else "KỴ"][1]}">{h}</span>' if h else "")
    + '</div>' for i, (a, b, h) in enumerate(tp_rows))
sheet = f"""
<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(0,0,0,0.62); z-index: 5"></div>
<section role="dialog" aria-label="Cung Mệnh" style="position: absolute; left: 0; right: 0; bottom: 0; top: 214px; z-index: 6; border-radius: 30px 30px 0 0; background: radial-gradient(90% 40% at 50% 0%, rgba(163,147,255,0.12), rgba(163,147,255,0) 70%), #141117; border-top: 1px solid rgba(163,147,255,0.30); box-shadow: 0 -20px 60px rgba(0,0,0,0.6); box-sizing: border-box; padding: 10px 20px 30px; display: flex; flex-direction: column; gap: 12px; overflow: hidden">
<div style="align-self: center; width: 38px; height: 5px; border-radius: 3px; background: rgba(243,241,244,0.35)"></div>
<div style="display: flex; align-items: flex-start; gap: 10px">
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px">{eyebrow('Cung Mệnh · Bính Tuất · 5–14 tuổi')}<h2 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 22px; line-height: 1.1; letter-spacing: -0.025em">Người nói thẳng, <span style="{GRADTEXT}">nghĩ rất kỹ</span></h2></div>
<a href="LaSo.dc.html" aria-label="Đóng" style="width: 44px; height: 44px; border-radius: 14px; {GLASS}; display: flex; align-items: center; justify-content: center; color: {TEXT}; flex-shrink: 0">{ic('x', 18, 2.2)}</a>
</div>
<div style="display: flex; gap: 6px; flex-wrap: wrap">
{chip('Cự Môn <span style="font-size: 11px; color: #FBC98A">hãm</span>', 'rgba(255,255,255,0.08)', TEXT, 'border: 1px solid rgba(255,255,255,0.088)')}
{chip('Quan Đới', 'rgba(255,255,255,0.08)', TEXT, 'border: 1px solid rgba(255,255,255,0.088)')}
{chip('Tuần án ngữ', 'rgba(255,203,15,0.14)', '#FFE07A')}
</div>
<div style="display: flex; gap: 10px; align-items: flex-start; border-radius: 18px; padding: 12px 14px; {GLASS}">
{orb(26, glow=False)}
<p style="margin: 0; {VOICE}; font-size: 16.5px; line-height: 1.32; color: #ECE3EF">“Bạn hay thấy ra chỗ chưa ổn trước người khác. Nói ra thì đúng, nhưng nên nói kèm lý do — không thì dễ bị hiểu là bắt bẻ.”</p>
</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
<div style="border-radius: 16px; padding: 10px 12px; background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.22); display: flex; flex-direction: column; gap: 3px"><span style="font-size: 12px; font-weight: 700; color: #86EFAC">Sao đỡ</span><span style="font-size: 13px; line-height: 1.4">Long Trì, Hoa Cái, Thanh Long</span></div>
<div style="border-radius: 16px; padding: 10px 12px; background: rgba(255,120,140,0.08); border: 1px solid rgba(255,120,140,0.24); display: flex; flex-direction: column; gap: 3px"><span style="font-size: 12px; font-weight: 700; color: #FFA3B1">Cần để ý</span><span style="font-size: 13px; line-height: 1.4">Thiên Hình, Linh Tinh, Địa Võng</span></div>
</div>
<div style="display: flex; flex-direction: column">{eyebrow('Tam phương chiếu về Mệnh', MUTED)}{tpr}</div>
<div style="margin-top: auto; display: flex; gap: 10px">
<a href="Celes.dc.html" style="{CTA}; flex-grow: 1; height: 52px">Hỏi Celes về cung này</a>
<a href="BaiDoc.dc.html" aria-label="Đọc bài Tính cách" style="width: 52px; height: 52px; border-radius: 14px; {GLASS}; display: flex; align-items: center; justify-content: center; color: {TEXT}; flex-shrink: 0">{ic('book', 20)}</a>
</div>
</section>
"""
body_ct = f"""
{laso_header(DARK, 'laso')}
{laso_grid(DARK, link=False)}
"""
page("CungChiTiet.dc.html", "Cung Mệnh — giải nghĩa", body_ct, gap=8, pad="52px 20px 0", extra=sheet)

# ---------- 4c · Tổng quan: đọc cả lá số (như tab Tổng quan trên web /la-so) ----------
DG = [("sparkle", "good", "Điểm nổi bật", "Bạn đời và người đi trước là chỗ dựa."),
      ("shield", "warn", "Điều cần lưu ý", "Nói thẳng nên kèm lý do, kẻo bị hiểu lầm."),
      ("path", "tgold", "Giai đoạn hiện tại", "35–44 tuổi: dựng nền, chắc từng bước.")]
dg_rows = "".join(
    f'<div style="display: flex; gap: 12px; align-items: flex-start; padding: 10px 14px; {"border-bottom: 1px solid rgba(255,255,255,0.055);" if i < 2 else ""}">'
    f'<span style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; background: {DARK[k][0]}; color: {DARK[k][1]}; display: flex; align-items: center; justify-content: center">{ic(icn, 18, 1.9)}</span>'
    f'<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; font-weight: 700; color: {DARK[k][1]}">{lab}</span><span style="font-size: 14px; line-height: 1.4; white-space: nowrap">{txt}</span></span></div>'
    for i, (icn, k, lab, txt) in enumerate(DG))

body_tq = f"""
{laso_header(DARK, 'tongquan', sub='Đọc cả lá số trong vài phút')}
<div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: -4px">{eyebrow('Đánh giá chung', GOLD)}<span style="font-size: 12px; color: {MUTED}">3 điểm Celes thấy rõ nhất</span></div>
<section style="border-radius: 20px; {GLASS}; display: flex; flex-direction: column">{dg_rows}</section>
<div style="display: flex; align-items: baseline; justify-content: space-between; margin: 2px 0 -4px">{eyebrow('Bức tranh chung')}<span style="font-size: 12px; color: {MUTED}">Câu 1 / 6</span></div>
<article style="border-radius: 20px; padding: 14px 16px; {GLASS}; display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; gap: 10px; align-items: flex-start"><span style="{MONO}; font-size: 13px; font-weight: 500; color: {ACCENT}; margin-top: 3px">01</span>
<h2 style="margin: 0; {DISPLAY}; font-size: 18px; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em">Tôi là người thế nào khi đứng trước lựa chọn lớn?</h2></div>
<p style="margin: 0; font-size: 15px; line-height: 1.5; color: {TEXT}">Bạn soi kỹ chỗ chưa ổn rồi mới quyết. Chậm lúc đầu nhưng ít phải quay lại, nhất là khi có người tin cậy cùng nghĩ.</p>
<a href="#" style="height: 36px; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: {ACCENT}; text-decoration: none">Muốn biết vì sao không? {ic('caret', 16, 2.2)}</a>
</article>
<a href="ChuyenSau.dc.html" style="border-radius: 20px; text-decoration: none; color: {TEXT}">
<span style="border-radius: 20px; padding: 12px 12px 12px 16px; {zone_hero()}; display: flex; align-items: center; gap: 10px">
<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px">{eyebrow('Chuyên sâu')}<span style="{DISPLAY}; font-size: 16px; font-weight: 700; line-height: 1.2; white-space: nowrap">Đọc phần chuyên sâu</span><span style="font-size: 12px; color: {MUTED}; white-space: nowrap">14 chủ đề · 42 câu hỏi</span></span>
<span style="{CTA}; height: 44px; padding: 0 14px; font-size: 14px; flex-shrink: 0; white-space: nowrap">Xem 14 chủ đề</span>
</span></a>
"""
page("TongQuan.dc.html", "Lá số — Tổng quan", body_tq, tab="laso", gap=12, pad="56px 20px 0", fade=False)

# ---------- 4d · Chuyên sâu: 14 chủ đề (như tab Chuyên sâu trên web) ----------
# (icon, tên, trạng thái, nhãn, đã đọc / 3 câu)
CD = [("sparkle", "Tính cách &amp; con người", "warn", "Cần gắng", 3), ("briefcase", "Sự nghiệp", "good", "Mạnh", 1),
      ("coin", "Tiền bạc", "good", "Mạnh", 0), ("heart", "Tình duyên &amp; hôn nhân", "good", "Mạnh", 3),
      ("baby", "Con cái", "mid", "Bình", 0), ("tree", "Cha mẹ &amp; gia đình gốc", "mid", "Bình", 0),
      ("users", "Anh chị em", "mid", "Bình", 0), ("rel", "Bạn bè, cộng sự, quý nhân", "good", "Mạnh", 0),
      ("moon", "Phúc đức &amp; tinh thần", "good", "Mạnh", 0), ("leaf", "Sức khỏe", "mid", "Bình", 0),
      ("home", "Nhà cửa &amp; tài sản", "good", "Mạnh", 0), ("compass", "Đi xa &amp; môi trường", "warn", "Cần gắng", 0),
      ("cap", "Học vấn &amp; bằng cấp", "mid", "Bình", 0), ("path", "Vận hạn", "mid", "Bình", 0)]
DOT = {"good": "#4ADE80", "mid": "rgba(243,241,244,0.55)", "warn": "#F0A44B"}


def cd_tile(icn, name, k, lab, doc):
    b, f = DARK[k]
    if doc == 3:
        st = f'<span role="img" aria-label="Đã đọc" style="display: flex; align-items: center; color: #86EFAC">{ic("check", 13, 2.6)}</span>'
    elif doc:
        st = f'<span style="color: {ACCENT}">{doc}/3 câu</span>'
    else:
        st = '<span>3 câu</span>'
    href = "BaiDoc.dc.html" if "Sự nghiệp" in name else "#"
    cur = f"border: 1px solid rgba({ZONES[ZCUR][3]},0.50); background: rgba({ZONES[ZCUR][3]},0.07)" if doc and doc < 3 else GLASS
    return (f'<a href="{href}" style="min-height: 64px; box-sizing: border-box; border-radius: 16px; padding: 9px 10px; {cur}; display: flex; gap: 9px; align-items: flex-start; text-decoration: none; color: {TEXT}">'
            f'<span style="width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; background: {b}; color: {f}; display: flex; align-items: center; justify-content: center">{ic(icn, 17, 1.9)}</span>'
            f'<span style="min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13.5px; font-weight: 600; line-height: 1.22">{name}</span>'
            f'<span style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: {MUTED}; white-space: nowrap"><span style="display: flex; align-items: center; gap: 4px; color: {f}; font-weight: 600"><span style="width: 6px; height: 6px; border-radius: 999px; background: {DOT[k]}"></span>{lab}</span>{st}</span></span></a>')


body_cs = f"""
{laso_header(DARK, 'chuyensau', sub='14 chủ đề, 42 câu hỏi về chính bạn')}
<a href="BaiDoc.dc.html" style="border-radius: 20px; text-decoration: none; color: {TEXT}">
<span style="border-radius: 20px; padding: 12px 14px; {zone_hero()}; display: flex; align-items: center; gap: 12px">
<span style="position: relative; width: 48px; height: 48px; flex-shrink: 0; border-radius: 999px; background: conic-gradient({ACCENT} 0 21%, rgba(255,255,255,0.08) 21% 100%); display: flex; align-items: center; justify-content: center"><span style="width: 38px; height: 38px; border-radius: 999px; background: #17141C; display: flex; align-items: center; justify-content: center; color: {ACCENT}">{ic('briefcase', 18, 1.9)}</span></span>
<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px">{eyebrow('Đọc tiếp · đã đọc 3/14')}<span style="{DISPLAY}; font-size: 15px; font-weight: 700; line-height: 1.25">Sự nghiệp · câu 2: Tôi hợp làm công hay tự làm?</span></span>
{ic('chev', 18, 2, MUTED)}
</span></a>
<div style="display: flex; align-items: baseline; justify-content: space-between; margin: 2px 0 -4px">{eyebrow('14 chủ đề')}<span style="font-size: 12px; color: {MUTED}">Bài đọc được lưu lại cho lần sau</span></div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
{''.join(cd_tile(*x) for x in CD)}
</div>
"""
page("ChuyenSau.dc.html", "Lá số — Chuyên sâu 14 chủ đề", body_cs, tab="laso", gap=12, pad="56px 20px 0")

# ---------- 4e · Đọc một chủ đề (trang /luan-giai/sau trên web) ----------
cd_chips = []
for icn, name, k, lab, doc in CD[:6]:
    short = name.split(" &amp;")[0].split(",")[0]
    if "Sự nghiệp" in name:
        cd_chips.append(f'<span aria-current="true" style="flex-shrink: 0; height: 32px; padding: 0 12px; border-radius: 999px; {zone_on()}; display: flex; align-items: center; font-size: 13px; font-weight: 700; white-space: nowrap">{short}</span>')
    else:
        tick = ic("check", 12, 2.4, "#86EFAC") if doc == 3 else ""
        cd_chips.append(f'<a href="#" style="flex-shrink: 0; height: 32px; padding: 0 12px; border-radius: 999px; {GLASS}; color: {TEXT if doc else MUTED}; display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; white-space: nowrap; text-decoration: none">{tick}{short}</a>')
ANS = [("Bạn hợp đi làm trong một tổ chức có người dẫn đường hơn là tự đứng một mình từ đầu. Sức của bạn lên nhanh khi có người có vị thế tin tưởng giao việc lớn."),
       ("Tự làm riêng vẫn được, nhưng nên có người cùng làm đáng tin. Người đồng hành là điểm mạnh nhất trong lá số của bạn, nên đi hai người sẽ vững hơn.")]
ans = "".join(
    f'<div style="display: flex; gap: 12px; align-items: flex-start"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 999px; border: 1px solid rgba({ZONES[ZCUR][3]},0.5); color: {ACCENT}; {MONO}; font-size: 12px; display: flex; align-items: center; justify-content: center">{i + 1}</span>'
    f'<p style="margin: 0; font-size: 15.5px; line-height: 1.55; color: {TEXT}">{t}</p></div>' for i, t in enumerate(ANS))
body_bd = f"""
<div style="display: flex; align-items: center; gap: 12px">
{icon_btn('back', 'Về 14 chủ đề', href='ChuyenSau.dc.html')}
<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px">{zone_mark()}<span style="{DISPLAY}; font-size: 17px; font-weight: 700">Luận giải chuyên sâu</span><span style="font-size: 12px; color: {MUTED}">Đã đọc 3/14 · Năm xem 2026</span></div>
<button type="button" aria-label="Lưu bài" style="width: 44px; height: 44px; border-radius: 14px; {GLASS}; display: flex; align-items: center; justify-content: center; color: {TEXT}; padding: 0">{ic('bookmark', 18, 2)}</button>
</div>
<nav aria-label="Chọn chủ đề" style="margin: 0 -20px; padding: 0 20px; display: flex; gap: 6px; overflow: hidden">{''.join(cd_chips)}</nav>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 2px">
{eyebrow('Sự nghiệp · câu 2 / 3')}
<h1 style="margin: 0; {DISPLAY}; font-weight: 800; font-size: 25px; line-height: 1.12; letter-spacing: -0.03em">Tôi hợp làm công, làm tự do hay <span style="{GRADTEXT}">tự xây sự nghiệp riêng?</span></h1>
</div>
{ans}
<blockquote style="margin: 0; border-radius: 20px; padding: 14px 16px; {zone_hero()}; color: {TEXT}; display: flex; flex-direction: column; gap: 4px">
<span style="{EYEBROW}; color: {ACCENT}">Tóm lại</span>
<span style="{DISPLAY}; font-size: 18px; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em">Đi cùng người dẫn đường trước, tự làm khi đã có người đồng hành.</span>
</blockquote>
<div style="border-radius: 16px; padding: 12px 14px; border: 1px dashed rgba(255,255,255,0.154); display: flex; align-items: center; gap: 10px">{orb(22)}<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 600">Celes đang viết tiếp câu 3</span><span style="font-size: 13px; color: {MUTED}">Khi nào nên đổi hướng?</span></span></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 170px; background: linear-gradient(180deg, rgba(11,10,13,0) 0%, rgba(11,10,13,0.95) 45%); z-index: 3; pointer-events: none"></div>
<div style="position: absolute; left: 20px; right: 20px; bottom: 34px; z-index: 4; display: flex; gap: 10px">
<a href="Celes.dc.html" style="height: 56px; padding: 0 16px; border-radius: 14px; {GLASS}; display: flex; align-items: center; gap: 8px; color: {TEXT}; font-size: 15px; font-weight: 600; text-decoration: none; flex-shrink: 0">{orb(20, glow=False)}Hỏi Celes</a>
<a href="#" style="{CTA}; flex-grow: 1">Câu tiếp {ic('arrow', 18, 2.2)}</a>
</div>
"""
page("BaiDoc.dc.html", "Chuyên sâu — Sự nghiệp", body_bd, gap=14)

# =====================================================================
# canvas.json
# =====================================================================
X = [0, 470, 940, 1410, 1880, 2350, 2820, 3290]
ROWY = [300, 1544, 2788, 4032, 5276]
boards = {}
layout = [
    [("HeThong.dc.html", "0 · Hệ thiết kế Celes Aurora"), ("Chao.dc.html", "1 · Chào"), ("OnbTen.dc.html", "1.1 · Tên"), ("OnbGioiTinh.dc.html", "1.2 · Giới tính"),
     ("OnbNgay.dc.html", "1.3 · Ngày sinh"), ("OnbGio.dc.html", "1.4 · Giờ sinh"), ("Main.dc.html", "1a · Điều bạn đang bận tâm"), ("QuickRead.dc.html", "1b · Ba điều Celes thấy ở bạn")],
    [("HomNay.dc.html", "2a · Hôm nay"), ("Celes.dc.html", "2b · Trò chuyện với Celes"), ("HanhTrinh.dc.html", "2c · Hành trình")],
    [("MoiQuanHe.dc.html", "3a · Mối quan hệ"), ("Toi.dc.html", "3b · Tài khoản (chạm avatar)")],
    [("LaSo.dc.html", "4a · Lá số 12 cung"), ("CungChiTiet.dc.html", "4b · Chạm một cung"), ("TongQuan.dc.html", "4c · Tổng quan (đọc cả lá số)"),
     ("ChuyenSau.dc.html", "4d · Chuyên sâu — 14 chủ đề"), ("BaiDoc.dc.html", "4e · Đọc một chủ đề"), ("ManhYeu.dc.html", "4f · Mạnh – yếu")],
    [("HomNaySang.dc.html", "5a · Hôm nay — chế độ sáng"), ("LaSoSang.dc.html", "5b · Lá số — chế độ sáng")],
]
NOTE_X = [1410, 1410, 940, 2350, 940]
order = []
for r, row in enumerate(layout):
    for c, (f, t) in enumerate(row):
        boards[f] = {"h": 844, "is_interactive": True, "radius": 44, "title": t, "w": 390, "x": X[c], "y": ROWY[r]}
        order.append(f)

notes = {
 "t1": {"kind": "title1", "maxW": 1330, "w": 240, "x": 0, "y": 40, "text": "1 · Hệ thiết kế & lần đầu mở app"},
 "t2": {"kind": "title1", "maxW": 1330, "w": 240, "x": 0, "y": 1284, "text": "2 · Mỗi ngày"},
 "t3": {"kind": "title1", "maxW": 1330, "w": 240, "x": 0, "y": 2528, "text": "3 · Người thân, của riêng bạn"},
 "t4": {"kind": "title1", "maxW": 2800, "w": 240, "x": 0, "y": 3772, "text": "4 · Lá số & luận giải (tab mới)"},
 "t5": {"kind": "title1", "maxW": 1330, "w": 240, "x": 0, "y": 5016, "text": "5 · Chế độ sáng"},
 "n4": {"fill": "purple", "maxH": 844, "w": 440, "x": 2820, "y": 4032, "text":
  "Tab Lá số: xem lá số → tổng quan → chuyên sâu (đi theo đúng web /la-so)\n\n"
  "Bốn chế độ xem trong tab: Lá số · Tổng quan · Chuyên sâu · Mạnh – yếu.\n\n"
  "1. Lá số (4a): 12 cung đầy đủ như web. Phụ tinh chia HAI CỘT: cát/trung tính bên trái, hung/sát bên phải; vòng Thái Tuế / Lộc Tồn nằm chung hai cột, màu tím nhạt. Chạm một cung → tấm trượt (4b).\n"
  "2. Tổng quan (4c) = đọc CẢ lá số. Gồm: Đánh giá chung (điểm nổi bật · điều cần lưu ý · giai đoạn hiện tại), rồi Bức tranh chung (khoảng 6 câu hỏi, mỗi câu có 'Muốn biết vì sao không?'). Cuối bài là thẻ 'Đọc tiếp phần chuyên sâu' → nút 'Xem 14 chủ đề'.\n"
  "3. Chuyên sâu (4d) = 14 chủ đề, mỗi chủ đề 2–4 câu hỏi về chính bạn. Ô nào cũng có nhãn Mạnh / Bình / Cần gắng và trạng thái đã đọc.\n"
  "4. Đọc một chủ đề (4e): hàng chip để nhảy giữa 14 chủ đề ('Đã đọc 3/14'); câu hỏi mở đầu, các câu trả lời đánh số, 'Tóm lại' ở cuối, rồi 'Đọc tiếp: chủ đề sau'. Bài được viết khi người dùng mở chủ đề lần đầu (hiện 'Celes đang viết tiếp…'), sau đó được lưu, mở lại là có ngay.\n\n"
  "Lối vào khác của phần chuyên sâu: ô 'Đọc tiếp' ở Hôm nay, nút sách trong tấm trượt của một cung, và 'Đọc chuyên sâu' ở Mạnh – yếu.\n\n"
  "Chuyên sâu cần đăng nhập (giống web). Chữ trong lá số được phép nhỏ (6.5–9.5px) — ngoại lệ duy nhất của luật 'không chữ dưới 11px'."},
 "n5": {"fill": "teal", "maxH": 844, "w": 420, "x": 940, "y": 5276, "text":
  "Chế độ sáng — cùng bố cục, chỉ đổi token\n\n"
  "• App đi theo cài đặt của máy (Tài khoản → Giao diện: Theo máy / Đêm / Sáng).\n"
  "• Nền sáng #FFF8FB (giống web) với quầng hồng – vàng mờ; thẻ trắng mờ đổ bóng tím rất nhẹ thay cho kính tối.\n"
  "• Riêng bản sáng giữ thẻ nhận định hồng–vàng (trên nền sáng nó không chói). Bản đêm dùng thẻ tối theo màu vùng.\n"
  "• Chữ gradient đổi sang fuchsia → cam đậm để đủ tương phản trên nền sáng; chữ nhấn dùng #B8157F thay #FF8BD0.\n"
  "• Trạng thái: xanh đậm / cam đậm trên nền nhạt (thay vì chữ sáng trên nền tối).\n\n"
  "Bấm Play ở 5a: thanh tab dẫn sang Lá số bản sáng. Các màn khác sẽ sinh bản sáng tự động từ cùng bộ token khi code."},
 "n1": {"fill": "purple", "maxH": 844, "w": 420, "x": 3760, "y": 300, "text":
  "Celes Aurora bản 8 — nền gần đen, mỗi luồng một vùng màu\n\n"
  "• Vì sao đổi (góp ý senior UI/UX 29/09): bản 7 nền tím #1A001E quá sáng cho chế độ tối, và mọi luồng cùng một nền nên người dùng không biết mình đang ở đâu — onboarding xong vào app nền vẫn y như cũ.\n"
  "• Nền: #0B0A0D gần đen, thẻ kính tối viền trắng 7–8%. Màu chỉ còn ở một quầng sáng mờ nơi góc màn và ở chỗ cần nhấn.\n"
  "• Vùng màu: Khởi đầu cam bình minh (quầng hắt từ dưới lên) · Hôm nay vàng · Lá số tím chàm (có bầu sao) · Hành trình xanh ngọc (vòng quỹ đạo) · Mối quan hệ san hô · Celes hồng · Tài khoản xám trung tính. Màu vùng đi vào: quầng nền, chữ nhấn, thẻ chính, tab con đang chọn, tab dưới đang chọn.\n"
  "• Đầu mỗi màn tab có dấu vùng (chấm màu + TÊN VÙNG kiểu mono), như breadcrumb của dashboard tham khảo.\n"
  "• Fuchsia #D32298 vẫn là màu duy nhất cho nút hành động, ở mọi vùng.\n"
  "• Celes có hình hài: một quả cầu sáng thở nhẹ, xuất hiện ở tab giữa, đầu trò chuyện và mọi lời Celes nói.\n\n"
  "Kiểu chữ: Bricolage Grotesque (tiêu đề, có cá tính, dấu tiếng Việt gọn) + Be Vietnam Pro (thân bài, làm riêng cho tiếng Việt) + Newsreader nghiêng (chỉ cho câu Celes nói) + JetBrains Mono (nhãn nhỏ). Bỏ Inter."},
 "n2": {"fill": "teal", "maxH": 844, "w": 420, "x": 1410, "y": 1544, "text":
  "Kỹ thuật dùng\n\n"
  "• Thẻ kính mờ (glass) trên nền có ánh sáng, viền 1px sáng mờ.\n"
  "• Thanh tab nổi, bo 24, mờ nền; Celes nhô lên ở giữa như nút chính.\n"
  "• Bento: ô thông tin nhỏ xếp lưới (giờ thuận, nhịp ngày, bản đồ, đọc tiếp).\n"
  "• Chữ tiêu đề lớn, khoảng chữ âm, một cụm chữ phủ gradient để dẫn mắt.\n"
  "• Biểu đồ phát sáng: đường đời có quãng đã qua sáng / quãng tới nét đứt; radar tô gradient tím chàm→hồng.\n"
  "• Chuyển động nhẹ: quả cầu thở, quầng sáng trôi, vòng quỹ đạo quay chậm. Tắt hết khi máy bật Giảm chuyển động.\n"
  "• Icon: một bộ nét 1.75 bo tròn tự vẽ, không emoji.\n\n"
  "Bấm Play ở từng khung: các nút chuyển màn đã nối (1a → 1b → Hôm nay, thanh tab)."},
 "n3": {"fill": "orange", "maxH": 844, "w": 420, "x": 940, "y": 2788, "text":
  "Cần anh/chị duyệt\n\n"
  "1. Thanh tab mới: Hôm nay · Lá số · Celes · Hành trình · Mối quan hệ; 'Tôi' thành avatar góc phải. Đây là đổi so với luồng đã duyệt trước — nếu muốn giữ tab 'Tôi' thì Mối quan hệ phải vào trong Hôm nay.\n"
  "2. Bo góc lớn hơn web: thẻ 20–24, nút 14, ô nhập 14 (web đang 14 / 8 / 6).\n"
  "3. Nền đêm là mặc định khi máy đang tối; máy sáng thì dùng bản sáng (hàng 5).\n"
  "4. Font mới chỉ áp cho app, hay đổi luôn cả web cho đồng bộ?\n\n"
  "Giữ nguyên các luật đã chốt: tối đa một nút fuchsia nổi mỗi màn, pill chỉ cho lựa chọn và tag, vùng chạm ≥ 44px, không chữ dưới 11px (trừ lá số), không nhắc 'AI' hay tên model.\n\n"
  "Chưa vẽ lại: Nhắc mỗi sáng, Khám phá sâu hơn."},
}
canvas = {
 "v": 3, "attachments": {}, "boards": boards,
 "createdOnFiles": {"at": "2026-09-29T04:28:58.211Z", "v": 1},
 "designSystems": [], "launch": {"view": "canvas"}, "notes": notes, "order": order, "pages": [],
 "title": "Celes iOS — giao diện Aurora",
}
with open(os.path.join(OUT, "canvas.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(canvas, f, ensure_ascii=False, indent=2)
print("ok", sorted(os.listdir(OUT)), xn, yn, x21, y21, x24, y24)

# =====================================================================
# index.html — trang mục lục để chia sẻ bản thiết kế ra ngoài claude.ai (deploy tĩnh lên Vercel)
# =====================================================================
NHOM = ["Mở đầu", "Ba tab chính", "Mối quan hệ · Tài khoản", "Lá số và luận giải", "Chế độ sáng"]
the = []
for ten_nhom, hang in zip(NHOM, layout):
    o = "".join(
        f'<a class="o" href="project/{f}"><span class="khung"><iframe src="project/{f}" loading="lazy" tabindex="-1" title="{t}"></iframe></span><span class="nhan">{t}</span></a>'
        for f, t in hang)
    the.append(f'<section><h2>{ten_nhom}</h2><div class="luoi">{o}</div></section>')
index = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Celes iOS — thiết kế</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap">
<style>
:root{{--nen:#0B0A0D;--chu:#F3F1F4;--mo:#A9A3AD;--vien:rgba(255,255,255,.09)}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--nen);color:var(--chu);font-family:'Be Vietnam Pro',system-ui,sans-serif}}
main{{max-width:1240px;margin:0 auto;padding:40px 16px 64px}}
h1{{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:34px;letter-spacing:-.03em;margin:0 0 8px}}
.dan{{overflow-wrap:anywhere;color:var(--mo);font-size:15px;line-height:1.55;max-width:640px;margin:0 0 8px}}
h2{{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:20px;margin:40px 0 16px}}
.luoi{{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:24px 20px}}
.o{{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:var(--chu)}}
.khung{{display:block;width:195px;height:422px;border-radius:26px;overflow:hidden;border:1px solid var(--vien);box-shadow:0 18px 40px rgba(0,0,0,.35);position:relative}}
.khung iframe{{width:390px;height:844px;border:0;transform:scale(.5);transform-origin:0 0;pointer-events:none}}
.o:hover .khung,.o:focus-visible .khung{{border-color:#FF8BD0}}
.nhan{{font-size:14px;font-weight:500;line-height:1.4}}
.proto{{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;border-radius:8px;background:#D32298;color:#fff;font-weight:600;font-size:15px;text-decoration:none;margin:8px 0 4px}}
@media (max-width:640px){{.luoi{{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}}.khung{{width:100%;height:auto;aspect-ratio:390/844}}.khung iframe{{position:absolute;left:0;top:0}}}}
</style>
</head>
<body>
<main>
<h1>Celes — thiết kế app iOS</h1>
<p class="dan">Bản 8 · 29/09/2026 — nền gần đen, mỗi luồng một vùng màu. Muốn đi thử cả luồng như app thật, mở prototype. Chạm một màn bên dưới để xem riêng màn đó ở cỡ thật. Dùng nút quay lại của trình duyệt để về mục lục. Xem đẹp nhất trên điện thoại.</p>
<p><a class="proto" href="prototype.html">Bấm thử luồng app (prototype) →</a></p>
<p class="dan">Dữ liệu trong thiết kế là dữ liệu mẫu.</p>
{''.join(the)}
</main>
<script>
// thu nhỏ iframe theo đúng bề ngang ô khi màn hẹp
function vua(){{document.querySelectorAll('.khung').forEach(k=>{{const i=k.querySelector('iframe');i.style.transform='scale('+(k.clientWidth/390)+')'}})}}
addEventListener('resize',vua);vua();
</script>
</body>
</html>
"""
with open(os.path.join(os.path.dirname(OUT), "index.html"), "w", encoding="utf-8", newline="\n") as f:
    f.write(index)
