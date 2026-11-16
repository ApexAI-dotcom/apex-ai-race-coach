#!/usr/bin/env python3
"""Génère la liste des rendus fixes (posts, carrousels, stories, couvertures) vers <apex-social>/out."""
import json
import os
import sys

OUT = os.path.abspath(sys.argv[1])
dst = sys.argv[2]
o = lambda *p: os.path.join(OUT, "out", *p)

jobs = [
    {"type": "still", "id": "G1-Couverture", "out": o("01-lancement", "G1-manifeste", "cover.png")},
    {"type": "frames", "id": "G2-Comment-ca-marche", "outDir": o("01-lancement", "G2-comment-ca-marche"), "prefix": "G2-"},
    {"type": "frames", "id": "G3-Offres", "outDir": o("01-lancement", "G3-offres"), "prefix": "G3-"},
    {"type": "still", "id": "G4-Couverture", "out": o("01-lancement", "G4-tour-parfait", "cover.png")},
    {"type": "frames", "id": "G5-Score", "outDir": o("01-lancement", "G5-score"), "prefix": "G5-"},
    {"type": "frames", "id": "G6-Mythe-ou-data", "outDir": o("01-lancement", "G6-mythe-ou-data"), "prefix": "G6-"},
    {"type": "still", "id": "G7-Couverture", "out": o("01-lancement", "G7-delta", "cover.png")},
    {"type": "frames", "id": "G8-Carnet", "outDir": o("01-lancement", "G8-carnet"), "prefix": "G8-"},
    {"type": "still", "id": "G9-Pourquoi", "out": o("01-lancement", "G9-pourquoi", "G9.png")},
    {"type": "frames", "id": "S2-Virage-decrypte-1", "outDir": o("04-calendrier", "semaine-2", "virage-decrypte-1"), "prefix": "VD1-"},
    {"type": "frames", "id": "S2-Dans-l-app-Mon-Kart", "outDir": o("04-calendrier", "semaine-2", "dans-l-app-mon-kart"), "prefix": "MK-"},
    {"type": "still", "id": "S2-Data-ne-ment-pas-Couverture", "out": o("04-calendrier", "semaine-2", "la-data-ne-ment-pas-1", "cover.png")},
]
stories_j1 = {"S2-Sondage-data": "S2", "S4-Sondage-point-faible": "S4", "S5-Essai-gratuit": "S5", "S6-Compatibilite": "S6"}
for cid, name in stories_j1.items():
    jobs.append({"type": "still", "id": cid, "out": o("02-stories-j1", f"{name}.png")})
    jobs.append({"type": "still", "id": cid, "out": o("02-stories-j1", f"{name}-guide.png"), "props": {"guide": True}})
for cid, name in {
    "AL-Tuto-1": "tuto-01", "AL-Tuto-2": "tuto-02", "AL-Tuto-3": "tuto-03",
    "AL-FAQ-1": "faq-01", "AL-FAQ-2": "faq-02", "AL-FAQ-3": "faq-03", "AL-FAQ-4": "faq-04",
    "AL-Ouverture-Demo": "ouverture-demo", "AL-Ouverture-Conseils": "ouverture-conseils",
    "AL-Ouverture-Offres": "ouverture-offres", "AL-Ouverture-Histoire": "ouverture-histoire",
}.items():
    jobs.append({"type": "still", "id": cid, "out": o("03-a-la-une", f"{name}.png")})
for icon in ["demo", "tuto", "conseils", "offres", "faq", "histoire"]:
    jobs.append({"type": "still", "id": f"AL-{icon}-story", "out": o("00-profil", "a-la-une", f"a-la-une-{icon}-1080x1920.png")})
    jobs.append({"type": "still", "id": f"AL-{icon}-carre", "out": o("00-profil", "a-la-une", f"a-la-une-{icon}-1080x1080.png")})
json.dump(jobs, open(dst, "w"), indent=1)
print(len(jobs), "tâches")
