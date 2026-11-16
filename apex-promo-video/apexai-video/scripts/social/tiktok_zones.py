#!/usr/bin/env python3
"""Contrôle des zones sûres TikTok (1080×1920) : texte ou logo clair sous l'interface ?
Échantillonne une image toutes les 0,25 s et cherche du TEXTE dans les zones masquées par l'interface :
pixels clairs (luminance > 100) ET forte densité de contours par bloc de 12 px (assez fin pour la petite étiquette « Session de démo ») (un texte est dense en contours ;
un aplat, un halo ou une trace de circuit ne l'est pas). Planche tracée sur l'image la plus exposée de chaque vidéo."""
import subprocess, sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
W, H = 1080, 1920
# Zones masquées (marges TikTok publiées par poster.ly, voir rapport) : onglets en haut, colonne d'icônes à droite, pseudo/légende/son en bas
ZONES = {"haut": (0, 0, W, 160), "droite": (960, 700, W, 1440), "bas": (0, 1440, W, H)}  # marges poster.ly : 160 haut, 480 bas, 120 droite
def frames(path, step=0.25):
    dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",path]))
    raw = subprocess.check_output(["ffmpeg","-v","error","-i",path,"-vf",f"fps={1/step},scale={W}:{H}","-f","rawvideo","-pix_fmt","rgb24","-"])
    a = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    return a, dur
def lum(f): return 0.299*f[...,0] + 0.587*f[...,1] + 0.114*f[...,2]
B = 12
def textmask(f):
    Y = lum(f.astype(np.float32))
    gx = np.abs(np.diff(Y, axis=1, prepend=Y[:, :1])); gy = np.abs(np.diff(Y, axis=0, prepend=Y[:1]))
    e = ((gx + gy) > 50) & (Y > 90)
    d = e.reshape(H // B, B, W // B, B).mean(axis=(1, 3))      # densité de contours clairs par bloc
    blk = d > 0.10
    return np.repeat(np.repeat(blk, B, 0), B, 1) & e
res = {}; tiles = []
FONT = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
font = ImageFont.truetype(FONT, 34)
for name, path in json.loads(sys.argv[1]).items():
    fr, dur = frames(path)
    worst = (0, 0, {}); flags = []
    for i, f in enumerate(fr):
        L = textmask(f)
        c = {z: int(L[y0:y1, x0:x1].sum()) for z, (x0, y0, x1, y1) in ZONES.items()}
        s = sum(c.values()); flags.append(s > 120)  # quelques lettres suffisent
        if s >= worst[0]: worst = (s, i, c)
    s, i, c = worst
    run = best = 0
    for f in flags: run = run + 1 if f else 0; best = max(best, run)
    col = best >= 3  # texte présent ≥ 0,75 s d'affilée ; en dessous = élément qui traverse l'écran (passage)
    res[name] = {"collision": col, "passage_bref": (not col) and s > 120, "pixels": c, "t": round(i*0.25, 2), "duree_max_s": best * 0.25, "duree": round(dur, 2)}
    im = Image.fromarray(fr[i]).convert("RGBA"); ov = Image.new("RGBA", im.size, (0,0,0,0)); d = ImageDraw.Draw(ov)
    for z, (x0, y0, x1, y1) in ZONES.items(): d.rectangle((x0, y0, x1-1, y1-1), fill=(255,40,40,70), outline=(255,60,60,255), width=6)
    L = textmask(fr[i])
    mask = np.zeros((H, W), bool)
    for (x0, y0, x1, y1) in ZONES.values(): mask[y0:y1, x0:x1] = True
    hit = np.dstack([L & mask]*1)[...,0]
    hl = np.zeros((H, W, 4), np.uint8); hl[hit] = (255, 230, 0, 255)
    im = Image.alpha_composite(Image.alpha_composite(im, ov), Image.fromarray(hl))
    d = ImageDraw.Draw(im); d.rectangle((0, 1700, W, H), fill=(0,0,0,200))
    d.text((30, 1730), f"{name} · image {i*0.25:.2f} s", fill="white", font=font)
    d.text((30, 1790), ("COLLISION" if col else ("OK (passage bref < 0,75 s)" if s > 120 else "OK")) + f" · pixels de texte : haut {c['haut']} / droite {c['droite']} / bas {c['bas']}", fill=(255,80,80) if col else (80,220,120), font=font)
    tiles.append(im.convert("RGB").resize((432, 768)))
n = len(tiles); cols = min(n, 3); rows = (n + cols - 1)//cols
P = Image.new("RGB", (cols*432 + (cols+1)*20, rows*768 + (rows+1)*20 + 60), (14,14,14))
ImageDraw.Draw(P).text((20, 18), "Zones sûres TikTok · rouge = masqué par l'interface · jaune = texte détecté dedans", fill="white", font=ImageFont.truetype(FONT, 26))
for k, t in enumerate(tiles): P.paste(t, (20 + (k % cols)*452, 80 + (k//cols)*788))
P.save(sys.argv[2]); print(json.dumps(res, ensure_ascii=False, indent=1))
