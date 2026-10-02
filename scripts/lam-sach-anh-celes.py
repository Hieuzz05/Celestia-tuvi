# -*- coding: utf-8 -*-
"""Lam sach anh linh vat Celes: bo bong nen nuong vao anh, khu nhiem mau nen o ria,
roi chuan hoa ca bo ve mot khung chung.

Vi sao KHONG tach bong bang mau: da do tren anh that, mat na kem va bong CHONG
phan bo len nhau — kem sat 0.166-0.177, bong sat 0.092-0.099, duoi kem (p10 0.045)
con thap hon tren bong. Moi nguong bao hoa deu an mat con tho o thinking /
listening / found-something, la ba tu the co mat cham ria silhouette.

Tach bang HINH HOC thay vi mau: bong la vung MONG, NAM NGANG, DINH VAO DAY than
va loe ra hai ben. Than la khoi DAY, dung. Dung phep mo hinh thai (opening) de
giu phan day va bo phan mong.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

# Mau nen render goc. Do duoc: pixel ria alpha thap tien ve rgb(249,246,243).
NEN = np.array([249.0, 246.0, 243.0])

# Khung chung cho MOI state, va ti le chieu cao nhan vat chiem trong khung.
# 512 du cho moi noi dang dung (to nhat la onboarding app 120px @3x = 360).
KHUNG = 512
CHIEM = 0.86


def _bo_bong(alpha, rgb):
    """Tra ve alpha da bo bong tiep dat. Thuan hinh hoc + do sang theo HANG.

    Vi sao khong dung nguong bao hoa: da do tren anh that, mat na kem va bong
    CHONG phan bo len nhau (kem sat 0.166-0.177, bong 0.092-0.099, duoi kem con
    thap hon tren bong). Moi nguong mau deu an mat con tho o thinking /
    listening / found-something.

    Dau hieu that cua bong, do duoc tren thinking.png: di tu duoi than len, be
    rong dang THU HEP dan (chan chum lai) thi dot ngot LOE RA kem do sang TANG:
      y=421 rong 127 sang 71.9  <- chan that het o day
      y=426 rong 179 sang 116.5 <- bong bat dau
      y=431 rong 225 sang 130.1
    Tim dung hang do roi cat tu do xuong.
    """
    dac = alpha > 0.5
    do_sang = rgb.mean(axis=2)
    H = dac.shape[0]

    rong = dac.sum(axis=1)
    hang = np.where(rong > 0)[0]
    if hang.size == 0:
        return alpha
    y_day = hang.max()

    sang_hang = np.array([do_sang[y][dac[y]].mean() if rong[y] else 0.0
                          for y in range(H)])

    # Chi xet 1/3 duoi: bong khong bao gio o tren do.
    y_min = max(hang.min() + 1, int(H * 0.66))

    y_cat = None
    for y in range(y_day - 2, y_min, -1):
        if rong[y] < 12:
            continue
        # So voi dai 12px ngay tren: than dang thu hep, hang nay lai loe + sang len
        tren = slice(max(y_min, y - 12), y)
        if rong[tren].size == 0:
            continue
        r_tren = rong[tren].mean(); s_tren = sang_hang[tren].mean()
        # Hai dang: loe manh (thinking: 1.18x) hoac loe nhe nhung sang vot
        # (serious: 1.05x nhung sang +44). Doi mot trong hai.
        loe = rong[y] / max(r_tren, 1e-6)
        dsang = sang_hang[y] - s_tren
        if (loe > 1.18 and dsang > 18) or (loe > 1.04 and dsang > 30):
            y_cat = y
    if y_cat is None:
        return alpha

    bong = np.zeros_like(dac)
    bong[y_cat:, :] = True
    return np.where(bong & (alpha > 0), 0.0, alpha)


# Nen tham chieu cua buoc tach matte va tong mau bong (vung san xa than).
MATTE_NEN = np.array([246.0, 241.0, 232.0])   # #F6F1E8
TONG_BONG = np.array([22.0, 16.0, 40.0])
RIM = 12


def _tach_lai_matte(alpha, rgb):
    """Tach lai mau that va alpha o dai ria, so voi nen kem MATTE_NEN.

    Vi sao: mat na tach nhan vat cat long, de lai mot dai matte sang (trang /
    lavender nhat) 2-9px quanh mep va mot vet san duoi chan. Tren nen kem no hoa
    vao nen nen ban sang trong dung; tren nen toi no thanh vien cham trang. Khong
    sua duoc bang CSS, va KHONG duoc che bang bong.

    Cach lam: coi moi pixel ria la tron giua mau that F (lay tu pixel loi gan
    nhat) va nen B. Tu C = F*a + B*(1-a) giai ra a, roi C' = B - (B-C)/a.
    Ghep C' len B voi alpha a la ra lai dung C, nen ban sang gan nhu khong doi;
    tren nen toi phan "nen" da duoc tach ra khoi pixel nen het vien.

    Tra ve (alpha, rgb, sel): sel la vung da ghi de, de buoc khu ria sau bo qua.
    """
    H = alpha.shape[0]
    k = H / 512.0
    A = alpha
    B = MATTE_NEN
    C = rgb
    co = A > 0

    mn = C.min(axis=2); mx = C.max(axis=2)
    bgl = (mn >= 150) & ((mx - mn) <= 30) & co
    dist = ndimage.distance_transform_edt(co)

    hang = np.where(co.any(axis=1))[0]
    san = np.zeros_like(co)
    if hang.size:
        y0, y1 = hang.min(), hang.max()
        san[int(y1 - 0.12 * (y1 - y0 + 1)):, :] = True

    allow = bgl & ((dist <= RIM * k) | san)
    nhan, so = ndimage.label(allow)
    cham_mep = np.unique(nhan[(dist <= 2) & allow])
    cham_mep = cham_mep[cham_mep > 0]
    sel = np.isin(nhan, cham_mep) & allow
    sel |= co & (dist <= 3 * k)

    core = ~sel & (A >= 250 / 255.0) & ~bgl
    if not core.any():
        return alpha, rgb, np.zeros_like(co)
    d_core, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    F = C[iy, ix].astype(float)
    F[sel & san & (d_core > 2)] = TONG_BONG

    D = B - C
    BF = B - F
    hop_le = BF > 8
    ti = np.where(hop_le, D / np.where(hop_le, BF, 1.0), 0.0)
    a = np.clip(ti.max(axis=2), 0.0, 1.0)
    a = np.ceil(a * 255.0) / 255.0

    C_moi = np.clip(B - D / np.maximum(a, 1e-6)[:, :, None], 0, 255)
    A_moi = A * a

    out_a = alpha.copy(); out_rgb = rgb.copy()
    out_a[sel] = A_moi[sel]
    out_rgb[sel] = C_moi[sel]
    out_rgb[sel & (out_a <= 0)] = 0
    return out_a, out_rgb, sel


def _va_lo(alpha_goc, rgb_goc, alpha, rgb, sel):
    """Lam dac lai pixel nam SAU trong than ma alpha < 1.

    Vi sao: mat na tach theo nen kem nen an ca long kem that o mat va bung
    (do 02/10/2026: ~7000 pixel ben trong than co alpha < 0.9 o moi state).
    Tren nen kem khong thay; tren nen toi mat Celes loang xam vi nen lot qua.

    Pixel cach mep than (da lap lo) qua RIM*k thi khong the la nen that — ghep
    ban GOC len MATTE_NEN roi dat alpha = 1. Nen kem vi the khong doi mot pixel
    nao. Dai RIM*k sat mep de nguyen cho buoc 1b: rac matte day toi 9px, lam
    dac no la ve lai dung cai vien kem vua go.
    """
    k = alpha.shape[0] / 512.0
    than = ndimage.binary_fill_holes(alpha_goc > 0.5)
    sau = ndimage.distance_transform_edt(than) > RIM * k
    lo = sau & (alpha_goc < 1.0)
    a3 = alpha_goc[:, :, None]
    ghep = rgb_goc * a3 + MATTE_NEN * (1 - a3)
    out_a = alpha.copy()
    out_rgb = rgb.copy()
    out_a[lo] = 1.0
    out_rgb[lo] = ghep[lo]
    return out_a, out_rgb, sel | lo


def lam_sach(duong_vao, duong_ra):
    im = Image.open(duong_vao).convert('RGBA')
    a = np.array(im).astype(float)
    alpha = a[:, :, 3] / 255.0
    rgb = a[:, :, :3]

    # --- 1. Bo bong nen nuong vao anh ---
    alpha_moi = _bo_bong(alpha, rgb)

    # --- 1b. Tach lai matte o ria (halo trang tren nen toi) ---
    alpha_goc, rgb_goc = alpha_moi, rgb
    alpha_moi, rgb, sel = _tach_lai_matte(alpha_moi, rgb)

    # --- 1c. Va lo alpha trong than (mat / bung kem bi mat na an mat) ---
    alpha_moi, rgb, sel = _va_lo(alpha_goc, rgb_goc, alpha_moi, rgb, sel)

    # --- 2. Khu nhiem mau nen o ria (un-premultiply) ---
    # observed = fg*alpha + NEN*(1-alpha)  =>  fg = (observed - NEN*(1-alpha)) / alpha
    # Chi ap trong dai alpha trung binh: alpha rat thap thi chia cho so nho,
    # sai so bi khuech dai thanh vien den ban.
    # Bo qua vung `sel`: buoc 1b da tach mau that ra roi, khu them lan nua la
    # tru nen hai lan.
    out_rgb = rgb.copy()
    ap = (alpha_moi > 0.15) & (alpha_moi < 0.95) & ~sel
    al3 = alpha_moi[:, :, None]
    goc = (out_rgb - NEN * (1 - al3)) / np.maximum(al3, 1e-6)
    out_rgb[ap] = np.clip(goc[ap], 0, 255)

    # --- 2b. Bo manh vun roi rac (tan du bong) ---
    dac0 = alpha_moi > 0.08
    nhan0, so0 = ndimage.label(dac0)
    if so0 > 1:
        kich0 = ndimage.sum(dac0, nhan0, range(1, so0 + 1))
        giu = int(np.argmax(kich0)) + 1
        alpha_moi = np.where(dac0 & (nhan0 != giu), 0.0, alpha_moi)

    out = Image.fromarray(np.dstack([out_rgb, alpha_moi * 255]).astype(np.uint8), 'RGBA')

    # --- 3. Trim theo bbox alpha roi CHUAN HOA ve mot khung chung ---
    # Vi sao phai chuan hoa: anh goc moi tep mot khung (default 768, con lai 512)
    # va moi tep mot ti le chiem khung (83% voi default, 60% voi thinking).
    # Cung truyen cao=56 ma con tho ra to nho khac nhau 1.4 lan.
    dac = Image.fromarray((np.where(alpha_moi > 0.08, 255, 0)).astype(np.uint8), 'L')
    bbox = dac.getbbox()
    if bbox:
        cat = out.crop(bbox)
        w, h = cat.size
        # Neo theo CHIEU CAO: con tho ngoi, chieu cao la thu mat doc thay truoc.
        ty = (KHUNG * CHIEM) / h
        if w * ty > KHUNG * 0.94:      # tu the qua be ngang thi moi neo theo ngang
            ty = (KHUNG * 0.94) / w
        w2 = max(1, int(round(w * ty))); h2 = max(1, int(round(h * ty)))
        cat = cat.resize((w2, h2), Image.LANCZOS)
        khung = Image.new('RGBA', (KHUNG, KHUNG), (0, 0, 0, 0))
        khung.alpha_composite(cat, ((KHUNG - w2) // 2, (KHUNG - h2) // 2))
        out = khung

    out.save(duong_ra, 'WEBP', quality=92, method=6)
    return out.size


if __name__ == '__main__':
    TEN = ['default', 'listening', 'thinking', 'found-something',
           'side-eye', 'serious', 'celebrate']
    for t in TEN:
        kt = lam_sach('docs/thiet-ke/celes-nhan-vat/v2/states/%s.png' % t,
                      'public/celes/%s.webp' % t)
        print('%-16s -> %s  %d KB' % (t, kt, os.path.getsize('public/celes/%s.webp' % t) // 1024))
