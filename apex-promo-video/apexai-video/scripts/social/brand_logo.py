#!/usr/bin/env python3
"""
Kit logo ApexAI : SVG vectorisés (texte converti en tracés) + PNG transparents,
photos de profil et planche de contrôle des tailles.

Le symbole est la copie exacte de assets/brand/apexai-icon.svg (carré arrondi rx 96/512,
dégradé 135° #FF4242 → #E60000, éclair plein). Le logotype reprend le site :
Space Grotesk 700, approche normale, crénage actif, « APEX » + « AI » collés.

Usage : python3 scripts/social/brand_logo.py <dossier apex-social>
Dépendances : fonttools, brotli, uharfbuzz, resvg-py, pillow
"""
import io
import math
import os
import sys

import resvg_py
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
FONTS = os.path.join(PROJECT, "public", "fonts")

OUT_ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(PROJECT, "..", "..", "apex-social")
LOGO_DIR = os.path.join(OUT_ROOT, "brand", "logo")
PROFILE_DIR = os.path.join(OUT_ROOT, "out", "00-profil")
QA_DIR = os.path.join(OUT_ROOT, "out", "qa")
for d in (LOGO_DIR, PROFILE_DIR, QA_DIR):
    os.makedirs(d, exist_ok=True)

# ── Charte (tokens.json) ────────────────────────────────────────────────
RED = "#FF4242"
RED_DEEP = "#E60000"
ORANGE = "#FF9933"
INK = "#0A0A0A"
WHITE = "#FAFAFA"

BOLT = "M256 64L128 288h96l-16 160 144-224h-96l112-160z"
BOLT_POLY = [(256, 64), (128, 288), (224, 288), (208, 448), (352, 224), (256, 224), (368, 64)]
RX = 96


def load_instance(name, wght):
    f = TTFont(os.path.join(FONTS, name))
    inst = instancer.instantiateVariableFont(f, {"wght": wght})
    inst.flavor = None
    buf = io.BytesIO()
    inst.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


SG, SG_DATA = load_instance("space-grotesk-latin-wght-normal.woff2", 700)
INTER, INTER_DATA = load_instance("inter-latin-wght-normal.woff2", 600)


def shape_text(ttf, data, text, size, x0=0.0, baseline=0.0, tracking_em=0.0):
    """Renvoie [(chemin_svg, bbox)] par glyphe, la largeur d'avance et la bbox d'encre globale."""
    upm = ttf["head"].unitsPerEm
    s = size / upm
    face = hb.Face(data)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    order = ttf.getGlyphOrder()
    gs = ttf.getGlyphSet()
    x = 0.0
    glyphs = []
    ink = [math.inf, math.inf, -math.inf, -math.inf]
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        tx = x0 + (x + pos.x_offset) * s
        ty = baseline - pos.y_offset * s
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        gs[name].draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
        bp = BoundsPen(gs)
        gs[name].draw(TransformPen(bp, (s, 0, 0, -s, tx, ty)))
        if bp.bounds:
            x_min, y_min, x_max, y_max = bp.bounds
            ink = [min(ink[0], x_min), min(ink[1], y_min), max(ink[2], x_max), max(ink[3], y_max)]
        glyphs.append((pen.getCommands(), bp.bounds))
        x += pos.x_advance + tracking_em * upm
    advance = (x - tracking_em * upm) * s
    return glyphs, advance, ink


def css_gradient_135(x, y, w, h):
    """Coordonnées userSpace d'un linear-gradient(135deg) CSS sur une boîte (x, y, w, h)."""
    a = math.radians(135)
    dx, dy = math.sin(a), -math.cos(a)
    length = abs(w * dx) + abs(h * dy)
    cx, cy = x + w / 2, y + h / 2
    return (cx - dx * length / 2, cy - dy * length / 2, cx + dx * length / 2, cy + dy * length / 2)


def rounded_rect_path(x, y, w, h, r):
    return (
        f"M{x + r},{y} H{x + w - r} A{r},{r} 0 0 1 {x + w},{y + r} V{y + h - r} "
        f"A{r},{r} 0 0 1 {x + w - r},{y + h} H{x + r} A{r},{r} 0 0 1 {x},{y + h - r} "
        f"V{y + r} A{r},{r} 0 0 1 {x + r},{y} Z"
    )


def icon_group(x, y, size, mode="color", gid="g", opacity=1.0):
    """Symbole à (x, y), côté `size`. mode : color | mono-white | mono-black."""
    k = size / 512
    tr = f'transform="translate({x:.2f} {y:.2f}) scale({k:.6f})"'
    if mode == "color":
        return (
            f'<defs><linearGradient id="{gid}-bg" x1="0%" y1="0%" x2="100%" y2="100%">'
            f'<stop offset="0%" stop-color="{RED}"/><stop offset="100%" stop-color="{RED_DEEP}"/></linearGradient></defs>'
            f'<g {tr}><rect width="512" height="512" rx="{RX}" fill="url(#{gid}-bg)"/>'
            f'<path fill="#FFFFFF" d="{BOLT}"/></g>'
        )
    color = "#FFFFFF" if mode == "mono-white" else INK
    knock = rounded_rect_path(0, 0, 512, 512, RX) + " " + BOLT
    return f'<g {tr} opacity="{opacity}"><path fill="{color}" fill-rule="evenodd" d="{knock}"/></g>'


def wordmark_group(x0, baseline, size, apex_color, ai="gradient", gid="w", opacity=1.0):
    glyphs, adv, ink = shape_text(SG, SG_DATA, "APEXAI", size, x0, baseline)
    apex = " ".join(g[0] for g in glyphs[:4])
    ai_path = " ".join(g[0] for g in glyphs[4:])
    # boîte du span « AI » (comme le fond clippé du site)
    ai_x0 = min(g[1][0] for g in glyphs[4:] if g[1])
    ai_x1 = max(g[1][2] for g in glyphs[4:] if g[1])
    asc, desc = 0.984 * size, 0.292 * size
    gx1, gy1, gx2, gy2 = css_gradient_135(ai_x0, baseline - asc, ai_x1 - ai_x0, asc + desc)
    if ai == "gradient":
        defs = (
            f'<defs><linearGradient id="{gid}-ai" gradientUnits="userSpaceOnUse" x1="{gx1:.2f}" y1="{gy1:.2f}" x2="{gx2:.2f}" y2="{gy2:.2f}">'
            f'<stop offset="0%" stop-color="{RED}"/><stop offset="100%" stop-color="{ORANGE}"/></linearGradient></defs>'
        )
        ai_fill = f"url(#{gid}-ai)"
    else:
        defs = ""
        ai_fill = ai
    svg = f'{defs}<g opacity="{opacity}"><path fill="{apex_color}" d="{apex}"/><path fill="{ai_fill}" d="{ai_path}"/></g>'
    return svg, adv, ink


def svg_doc(w, h, body, pad=0):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.2f}" height="{h:.2f}" '
        f'viewBox="{-pad:.2f} {-pad:.2f} {w:.2f} {h:.2f}">{body}</svg>'
    )


def lockup_h(theme="dark", mono=None):
    """Icône + logotype sur une ligne. Proportions du film : logotype 1,1 × l'icône, espace 0,25 × l'icône."""
    H = 512
    size = 1.1 * H
    gap = 0.25 * H
    cap = 0.700 * size
    baseline = H / 2 + cap / 2
    if mono:
        color = "#FFFFFF" if mono == "white" else INK
        icon = icon_group(0, 0, H, "mono-" + mono, "lh")
        word, adv, ink = wordmark_group(H + gap, baseline, size, color, ai=color, gid="lh")
    else:
        icon = icon_group(0, 0, H, "color", "lh")
        word, adv, ink = wordmark_group(H + gap, baseline, size, WHITE if theme == "dark" else INK, gid="lh")
    right = ink[2]
    return svg_doc(right, H, icon + word)


def lockup_v(theme="dark"):
    H = 512
    size = 0.7 * H
    gap = 0.3 * H
    glyphs, adv, ink = shape_text(SG, SG_DATA, "APEXAI", size, 0, 0)
    ink_w = ink[2] - ink[0]
    W = max(H, ink_w)
    cap = 0.700 * size
    baseline = H + gap + cap
    x0 = (W - ink_w) / 2 - ink[0]
    icon = icon_group((W - H) / 2, 0, H, "color", "lv")
    word, _, ink2 = wordmark_group(x0, baseline, size, WHITE if theme == "dark" else INK, gid="lv")
    return svg_doc(W, baseline + 2, icon + word)


def wordmark_only(theme="dark"):
    size = 512
    glyphs, adv, ink = shape_text(SG, SG_DATA, "APEXAI", size, 0, 0)
    x0 = -ink[0]
    cap_top = ink[1]
    baseline = -cap_top
    word, _, ink2 = wordmark_group(x0, baseline, size, WHITE if theme == "dark" else INK, gid="wm")
    return svg_doc(ink[2] - ink[0], ink[3] - ink[1], word)


def watermark():
    H = 64
    gap = 16
    fs = 36  # hauteur de capitale ≈ 26 px
    glyphs, adv, ink = shape_text(INTER, INTER_DATA, "apexai.racing", fs, H + gap, 0)
    cap = 0.7275 * fs
    baseline = H / 2 + cap / 2
    glyphs, adv, ink = shape_text(INTER, INTER_DATA, "apexai.racing", fs, H + gap, baseline)
    paths = " ".join(g[0] for g in glyphs)
    body = icon_group(0, 0, H, "mono-white", "wmk", opacity=0.85) + f'<path fill="#FFFFFF" fill-opacity="0.85" d="{paths}"/>'
    return svg_doc(ink[2] + 2, H, body)


def icon_svg():
    return svg_doc(512, 512, icon_group(0, 0, 512, "color", "ic"))


def write_logo(name, svg):
    with open(os.path.join(LOGO_DIR, f"{name}.svg"), "w", encoding="utf-8") as f:
        f.write(svg)
    for w in (4096, 1024, 512, 256):
        png = resvg_py.svg_to_bytes(svg_string=svg, width=w)
        with open(os.path.join(LOGO_DIR, f"{name}-{w}.png"), "wb") as f:
            f.write(bytes(png))


# ── Photo de profil ─────────────────────────────────────────────────────
def bolt_centroid():
    """Centre de gravité de l'éclair (polygone), pour un centrage optique."""
    a = cx = cy = 0.0
    pts = BOLT_POLY + [BOLT_POLY[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        c = x0 * y1 - x1 * y0
        a += c
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    a *= 0.5
    return cx / (6 * a), cy / (6 * a)


def avatar_svg(variant="rouge"):
    S = 1080
    bolt_h = 0.52 * S
    k = bolt_h / 384  # hauteur de l'éclair : 448 − 64
    bx0, by0, bx1, by1 = 128, 64, 368, 448
    gx, gy = bolt_centroid()
    # centrage optique : moitié centre de la boîte, moitié centre de gravité
    ox = 0.5 * (bx0 + bx1) / 2 + 0.5 * gx
    oy = 0.5 * (by0 + by1) / 2 + 0.5 * gy
    tx = S / 2 - ox * k
    ty = S / 2 - oy * k
    if variant == "rouge":
        bg = (
            f'<defs><linearGradient id="av" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="{RED}"/>'
            f'<stop offset="100%" stop-color="{RED_DEEP}"/></linearGradient>'
            f'<radialGradient id="avh" cx="32%" cy="26%" r="70%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.16"/>'
            f'<stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>'
            f'<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="{0.012 * S:.1f}" stdDeviation="{0.018 * S:.1f}" flood-color="#7A0000" flood-opacity="0.45"/></filter></defs>'
            f'<rect width="{S}" height="{S}" fill="url(#av)"/><rect width="{S}" height="{S}" fill="url(#avh)"/>'
        )
        bolt = f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.5f})" filter="url(#sh)"><path fill="#FFFFFF" d="{BOLT}"/></g>'
    else:
        bg = (
            f'<defs><linearGradient id="bt" gradientUnits="userSpaceOnUse" x1="{tx + bx0 * k:.1f}" y1="{ty + by0 * k:.1f}" x2="{tx + bx1 * k:.1f}" y2="{ty + by1 * k:.1f}">'
            f'<stop offset="0%" stop-color="{RED}"/><stop offset="100%" stop-color="{ORANGE}"/></linearGradient>'
            f'<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="{RED}" stop-opacity="0.32"/>'
            f'<stop offset="60%" stop-color="{RED}" stop-opacity="0.08"/><stop offset="100%" stop-color="{RED}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{S}" height="{S}" fill="{INK}"/><circle cx="{S / 2}" cy="{S / 2}" r="{0.46 * S:.1f}" fill="url(#glow)"/>'
        )
        bolt = f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.5f})"><path fill="url(#bt)" d="{BOLT}"/></g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">{bg}{bolt}</svg>'


def circle_crop(img):
    size = img.size[0]
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img.convert("RGBA"), (0, 0), mask)
    return out


def avatar_board(paths):
    """Planche : chaque variante à 320, 110 et 40 px, sur fond sombre et sur fond clair."""
    W, Hh = 1600, 1000
    board = Image.new("RGB", (W, Hh), (10, 10, 10))
    d = ImageDraw.Draw(board)
    light = (245, 245, 245)
    d.rectangle((0, Hh // 2, W, Hh), fill=light)
    font_path = os.path.join(QA_DIR, "_inter-600.ttf")
    INTER.save(font_path)
    lab = ImageFont.truetype(font_path, 22)
    head = ImageFont.truetype(font_path, 26)
    for row, bg in enumerate([(10, 10, 10), light]):
        y0 = row * (Hh // 2)
        col = (153, 153, 153) if row == 0 else (90, 90, 90)
        x = 60
        for name, p in paths:
            src = Image.open(p)
            d.text((x, y0 + 36), f"{name}  ·  fond {'sombre' if row == 0 else 'clair'}", font=head, fill=(230, 230, 230) if row == 0 else (40, 40, 40))
            for s in (320, 110, 40):
                im = circle_crop(src.resize((s, s), Image.LANCZOS))
                board.paste(im, (x, y0 + 90 + (320 - s) // 2), im)
                d.text((x + s // 2, y0 + 440), f"{s} px", font=lab, fill=col, anchor="mt")
                x += max(s, 70) + 50
            x += 90
    os.remove(font_path)
    board.save(os.path.join(QA_DIR, "avatar-tailles.png"))


def main():
    write_logo("apexai-icon", icon_svg())
    write_logo("apexai-lockup-h-dark", lockup_h("dark"))
    write_logo("apexai-lockup-h-light", lockup_h("light"))
    write_logo("apexai-lockup-v-dark", lockup_v("dark"))
    write_logo("apexai-lockup-v-light", lockup_v("light"))
    write_logo("apexai-wordmark-dark", wordmark_only("dark"))
    write_logo("apexai-wordmark-light", wordmark_only("light"))
    write_logo("apexai-mono-white", lockup_h(mono="white"))
    write_logo("apexai-mono-black", lockup_h(mono="black"))
    write_logo("apexai-watermark", watermark())

    paths = []
    for v in ("rouge", "noir"):
        svg = avatar_svg(v)
        p = os.path.join(PROFILE_DIR, f"avatar-{v}-1080.png")
        with open(p, "wb") as f:
            f.write(bytes(resvg_py.svg_to_bytes(svg_string=svg, width=1080)))
        with open(os.path.join(LOGO_DIR, f"apexai-avatar-{v}.svg"), "w", encoding="utf-8") as f:
            f.write(svg)
        paths.append((f"avatar-{v}", p))
    avatar_board(paths)
    print("Kit logo :", len([n for n in os.listdir(LOGO_DIR) if n.endswith('.svg')]), "SVG")


if __name__ == "__main__":
    main()
