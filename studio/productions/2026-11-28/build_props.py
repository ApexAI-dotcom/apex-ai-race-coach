# Props du reel « 9 sur 49 » : temps calés sur la voix.
import json
# sous-titres : (début, fin) de chaque groupe, d'après les pauses de la prise (ffmpeg silencedetect, -38 dB)
C = [(0.00, 1.40, "Meilleur tour de la séance."),
     (1.94, 3.50, "Le tour parfait n'en garde que"), (3.50, 5.01, "9 morceaux sur 49."),
     (5.48, 6.34, "D'où viennent les autres ?"),
     (6.90, 8.51, "Voilà comment on construit ce tour."),
     (9.09, 10.67, "On découpe la piste en petits bouts."),
     (11.24, 12.09, "Pour chacun, on prend"), (12.09, 14.34, "le passage le plus rapide de la séance."),
     (14.77, 16.96, "Regarde : ce bout vient d'un tour."),
     (17.39, 18.62, "Le suivant, d'un autre."),
     (19.14, 20.05, "Dans ton tour parfait,"), (20.35, 21.96, "chaque bout, tu l'as déjà roulé."),
     (22.52, 24.76, "Ta règle : vise d'abord ce tour-là."),
     (25.25, 27.46, "Envoie ça au pote qui ne parle que de son chrono.")]
caps = [{"t0": round(a, 2), "t1": round(b + 0.2, 2), "text": t} for a, b, t in C]
for a, b in zip(caps, caps[1:]):
    if a["t1"] > b["t0"]:
        a["t1"] = b["t0"]
# (vue, durée, apparition interne en s depuis le début du temps)
B = [("hook", 5.25, None), ("others", 3.55, 1.65), ("cut", 5.75, 2.44), ("zoom", 4.35, 2.84), ("yours", 3.35, None), ("end", 6.95, 3.0)]
beats = []
for m, d, cue in B:
    b = {"dur": d, "kind": "morceaux", "m": m}
    if cue is not None:
        b["cues"] = [cue]
    beats.append(b)
beats[-1].update({"sfx": "pings", "sfxAt": -0.22})  # le « ting » positif (22,0 s), dans la pause avant la règle ; seul bruitage
print(round(sum(b["dur"] for b in beats), 2))
p = {"label": "", "voice": "voice/2026-11-28-reel-9-sur-49.mp3", "voiceVolume": 1,
     "music": "music/apexai-theme-2026-11-28.mp3", "musicVolume": 0.1, "beats": beats, "captions": caps}
json.dump(p, open("reel-9-sur-49.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

# Rendu (depuis apex-promo-video/apexai-video) :
#   npx remotion render src/index.ts T-Reel raw.mp4 --props=../../studio/productions/2026-11-28/reel-9-sur-49.json
#   npx remotion still src/index.ts M49-Couverture cover.jpg
# puis mixage final : image copiée, son normalisé à -15,5 LUFS (ffmpeg loudnorm en deux passes, afade d'entrée 15 ms).
