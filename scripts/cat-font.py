# -*- coding: utf-8 -*-
"""Cắt font cho Celes (chạy: pip install fonttools brotli && python scripts/cat-font.py): MỘT file / họ chữ gồm latin + tiếng Việt.

Lý do: next/font/google khai báo đủ các bộ ký tự (latin, latin-ext, vietnamese…) với
unicode-range chồng nhau. Với chữ ă/đ/ơ/ư trình duyệt chọn file latin-ext (Inter 85KB,
Inter Tight 37KB) dù file vietnamese (10KB) đã có sẵn glyph. Gộp latin + vietnamese vào
một file thì chữ Việt không kéo thêm file nào.

Nguồn: google/fonts (OFL) — cùng bản Google Fonts phục vụ.
"""
import os, urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

import tempfile
GOC = tempfile.gettempdir()  # tệp font gốc tải về để ở thư mục tạm, không vào repo
RA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app', 'fonts')
os.makedirs(RA, exist_ok=True)

NGUON = {
    'Inter': 'https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf',
    'InterTight': 'https://github.com/google/fonts/raw/main/ofl/intertight/InterTight%5Bwght%5D.ttf',
    'JetBrainsMono': 'https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf',
}

LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
VIET = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'
THEM = 'U+2190-21FF,U+2212,U+2713-2714,U+2726,U+25A0-25FF'  # mũi tên, dấu tích, ✦ — có glyph thì giữ
DAI = f'{LATIN},{VIET},{THEM}'


def ma(dai):
    out = []
    for p in dai.split(','):
        p = p.strip().replace('U+', '')
        if '-' in p:
            a, b = p.split('-'); out += range(int(a, 16), int(b, 16) + 1)
        else:
            out.append(int(p, 16))
    return out


def tai(ten, url):
    p = os.path.join(GOC, f'{ten}.ttf')
    if not os.path.exists(p):
        urllib.request.urlretrieve(url, p)
    return p


def cat(nguon, dich, truc):
    f = TTFont(nguon, lazy=False)
    if truc:
        f = instancer.instantiateVariableFont(f, truc)
        tam = dich + '.tam.ttf'
        f.save(tam)                      # nạp lại để gvar không còn ở chế độ đọc lười
        f = TTFont(tam, lazy=False)
        os.remove(tam)
    opt = subset.Options()
    opt.flavor = 'woff2'
    opt.layout_features = ['*']           # giữ đủ calt, cv11, ss02, ss03, tnum… như bản Google
    opt.name_IDs = ['*']
    opt.notdef_outline = True
    opt.hinting = False                   # Google Fonts woff2 cho web cũng bỏ hinting
    opt.desubroutinize = True
    s = subset.Subsetter(opt)
    s.populate(unicodes=ma(DAI))
    s.subset(f)
    f.flavor = 'woff2'
    f.save(dich)
    return os.path.getsize(dich)


kq = {}
kq['inter-latin-vi.woff2'] = cat(tai('Inter', NGUON['Inter']), os.path.join(RA, 'inter-latin-vi.woff2'),
                                 {'opsz': 14, 'wght': (400, 700)})
kq['inter-tight-700-latin-vi.woff2'] = cat(tai('InterTight', NGUON['InterTight']), os.path.join(RA, 'inter-tight-700-latin-vi.woff2'),
                                           {'wght': 700})
kq['jetbrains-mono-400-latin-vi.woff2'] = cat(tai('JetBrainsMono', NGUON['JetBrainsMono']), os.path.join(RA, 'jetbrains-mono-400-latin-vi.woff2'),
                                              {'wght': 400})
for k, v in kq.items():
    print(f'{k}: {v/1024:.1f} KB')
print('Tổng:', round(sum(kq.values()) / 1024, 1), 'KB')

# Kiểm glyph tiếng Việt có đủ không
for k in kq:
    f = TTFont(os.path.join(RA, k))
    cmap = f.getBestCmap()
    mau = 'ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ₫–—“”…→✓'
    thieu = [c for c in mau if ord(c) not in cmap]
    print(k, 'thiếu glyph:', ''.join(thieu) or 'không')
