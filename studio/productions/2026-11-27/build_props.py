# Props du reel « Plus de 2 g au virage 6 » : temps calés sur la voix.
import json
# sous-titres : (début, fin) du premier et du dernier mot, d'après la transcription eleven_scribe_v1 de la prise
C = [(0.00, 1.68, "Ton cou brûle après la séance ?"),
     (2.72, 3.60, "Au virage 6,"), (3.64, 6.00, "le kart dépasse 2 g sur le côté."),
     (6.04, 7.68, "À ce niveau, ta tête et ton casque"), (7.76, 8.80, "tirent vers l'extérieur"),
     (8.88, 10.43, "avec plus du double de leur poids."),
     (11.00, 12.32, "Et ton cou retient."),
     (12.44, 14.64, "Sur 10 tours, ça arrive 7 fois."),
     (14.72, 16.73, "Les 3 autres sont les plus lents à cet endroit."),
     (17.36, 19.20, "Ton g baisse au même virage ?"), (19.28, 20.72, "Regarde ta vitesse en courbe."),
     (20.80, 22.72, "Envoie ça à ton pote qui se plaint de son cou.")]
caps = [{"t0": round(a, 2), "t1": round(b + 0.2, 2), "text": t} for a, b, t in C]
for a, b in zip(caps, caps[1:]):
    if a["t1"] > b["t0"]:
        a["t1"] = b["t0"]
B = [("hook", 2.4), ("turn", 3.6), ("helmet", 4.95), ("neck", 1.45), ("bars", 2.3), ("slow", 2.6), ("rule", 3.45), ("end", 3.75)]
beats = [{"dur": d, "kind": "virage6", "g": g} for g, d in B]
beats[6].update({"sfx": "pings", "sfxAt": -0.5})  # le « ting » positif (16,8 s), dans la pause avant la règle : il ne couvre pas la voix ; seul bruitage
print(round(sum(b["dur"] for b in beats), 2))
p = {"label": "", "voice": "voice/2026-11-27-reel-virage6-g.mp3", "voiceVolume": 1,
     "music": "music/apexai-theme-2026-11-27.mp3", "musicVolume": 0.1, "beats": beats, "captions": caps}
json.dump(p, open("reel-virage6-g.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

# Rendu (depuis apex-promo-video/apexai-video) :
#   npx remotion render src/index.ts T-Reel raw.mp4 --props=../../studio/productions/2026-11-27/reel-virage6-g.json
#   npx remotion still src/index.ts V6-Couverture cover.jpg
# puis mixage final : image copiée, son normalisé à -15,5 LUFS (ffmpeg loudnorm en deux passes, afade d'entrée 15 ms).
