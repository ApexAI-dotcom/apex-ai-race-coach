# Props du reel « 12 virages notés, une priorité » : temps calés sur la voix.
import json
# sous-titres : (début, fin) du premier et du dernier mot, d'après la transcription eleven_scribe_v1 de la prise
C = [(0.00, 1.68, "Ce virage est noté A."), (1.72, 2.72, "Travaille-le en premier."),
     (3.20, 4.16, "Sur cette session,"), (4.20, 5.76, "douze virages sont notés."),
     (5.84, 7.20, "Tu irais sans doute chercher un B."),
     (7.68, 8.64, "L'app met le virage"), (8.72, 10.00, "sept en priorité."),
     (10.04, 11.04 - 0.08, "Et le moins bien noté"), (11.04, 12.88, "n'est même pas dans ses priorités."),
     (12.92, 14.40, "Elle classe par temps perdu,"), (14.52, 16.00, "mesuré sur tes chronos."),
     (16.04, 17.04, "Avant de choisir,"), (17.20, 18.96, "regarde ce que le virage te coûte."),
     (19.04, 20.80, "Inscris-toi et viens essayer."), (20.84, 21.68, "Lien en bio.")]
caps = [{"t0": round(a, 2), "t1": round(b + 0.2, 2), "text": t} for a, b, t in C]
for a, b in zip(caps, caps[1:]):
    if a["t1"] > b["t0"]:
        a["t1"] = b["t0"]
B = [("hero", 3.0), ("all", 2.75), ("b", 1.75), ("rank", 2.45), ("absent", 2.95), ("subtitle", 3.1), ("rule", 3.0), ("end", 5.0)]
beats = [{"dur": d, "kind": "notes", "view": v} for v, d in B]
beats[6].update({"sfx": "pings", "sfxAt": 0.0})  # le « ting » positif sur la règle, seul bruitage
print(round(sum(b["dur"] for b in beats), 2))
p = {"label": "", "voice": "voice/2026-11-26-reel-12-virages.mp3", "voiceVolume": 1,
     "music": "music/apexai-theme-2026-11-26.mp3", "musicVolume": 0.1, "beats": beats, "captions": caps}
json.dump(p, open("reel-12-virages.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

# Rendu (depuis apex-promo-video/apexai-video) :
#   npx remotion render src/index.ts T-Reel raw.mp4 --props=../../studio/productions/2026-11-26/reel-12-virages.json
# puis mixage final : image copiée, son normalisé à -15,5 LUFS (ffmpeg loudnorm en deux passes, afade d'entrée 15 ms).
# Miniature : image à 1,0 s (thumb_offset 1000 ms).
