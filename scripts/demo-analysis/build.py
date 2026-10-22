#!/usr/bin/env python3
"""
Régénère src/components/landing/data/demoAnalysis.json : la VRAIE sortie du
moteur d'analyse ApexAI sur une session de démonstration (Adria Karting Raceway),
réduite aux champs que la page d'accueil affiche.

Rien n'est écrit à la main : carte, conseils, graphiques, mini-secteurs et
freinages viennent du moteur. Le nom du pilote présent dans le fichier d'origine
n'est PAS repris (il n'existe que dans `import_diagnostics`, qu'on n'exporte pas).

Usage (depuis la racine du dépôt front) :
    BACKEND_DIR=/chemin/vers/apexai-backend/apexai-backend \
    python3 scripts/demo-analysis/build.py [fichier.csv | fichier.csv.gz]

Sans argument, on utilise la fixture du backend (tests/fixtures/adria_4laps.csv.gz).
Prérequis : les dépendances du backend (pandas, numpy, scipy, fastapi, …).
"""
import gzip
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime

BACKEND = os.environ.get("BACKEND_DIR")
if not BACKEND:
    sys.exit("BACKEND_DIR manquant (dossier du backend, celui qui contient `src/`).")
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

from src.api.services import _run_analysis_pipeline_sync  # noqa: E402

OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "src", "components", "landing", "data", "demoAnalysis.json",
)
source = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BACKEND, "tests", "fixtures", "adria_4laps.csv.gz")

with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
    csv_path = tmp.name
opener = gzip.open if source.endswith(".gz") else open
with opener(source, "rb") as f_in, open(csv_path, "wb") as f_out:
    shutil.copyfileobj(f_in, f_out)
try:
    res = _run_analysis_pipeline_sync(
        csv_path, [], "demo-landing", datetime.now(),
        track_condition="dry", track_temperature=24.0,
    )
finally:
    os.unlink(csv_path)

pd = res["plot_data"]
ideal = res.get("ideal_lap") or {}
used = set(ideal.get("laps_used") or [])
best = ideal.get("best_lap_number")


# Pour garder le fichier léger, on n'embarque les courbes que de quelques tours :
# le meilleur + au plus 3 autres répartis sur la session (les chiffres, le tour
# idéal et les conseils restent ceux de TOUS les tours retenus).
_others = sorted(n for n in used if n != best)
shown = {best} | set(_others[:: max(1, len(_others) // 3)][:3])


def keep_lap(lap):
    n = lap.get("lap_number")
    return bool(lap.get("is_synthetic")) or n in shown


def rnd(o, key=""):
    if isinstance(o, float):
        return round(o, 6 if isinstance(key, str) and key.endswith(("lat", "lon")) else 3)
    if isinstance(o, list):
        return [rnd(v, key) for v in o]
    if isinstance(o, dict):
        return {k: rnd(v, k) for k, v in o.items()}
    return o


corner_fields = (
    "corner_id", "corner_number", "label", "corner_type", "apex_speed_real", "apex_speed_optimal",
    "speed_efficiency", "apex_distance_error", "lateral_g_max", "time_lost", "grade", "score",
    "apex_lat", "apex_lon", "entry_speed", "exit_speed", "target_entry_speed", "target_exit_speed",
    "braking_verdict", "has_braking_zone", "braking_time_lost", "coasting_s",
)
ideal_keep = {k: v for k, v in ideal.items() if k not in ("per_corner_laps",)}

out = {
    "lap_times": res["lap_times"],
    "best_lap_time": res["best_lap_time"],
    "corners_detected": res["corners_detected"],
    "performance_score": res["performance_score"],
    "coaching_advice": res["coaching_advice"],
    "corner_analysis": [{k: c[k] for k in corner_fields if k in c} for c in res["corner_analysis"]],
    "ideal_lap": ideal_keep,
    "plot_data": {
        "speed_trace": {**pd["speed_trace"], "laps": [l for l in pd["speed_trace"]["laps"] if l["lap_number"] in shown]},
        "time_delta_laps": {
            **pd["time_delta_laps"],
            # On garde le tour de référence du moteur même s'il n'est pas affiché.
            "laps": [
                l for l in pd["time_delta_laps"]["laps"]
                if l["lap_number"] in shown or l.get("is_best")
            ],
        },
        "performance_radar": pd["performance_radar"],
        "apex_margin": pd["apex_margin"],
        "racing_line_meta": pd["racing_line_meta"],
        "track_edges": pd["track_edges"],
        "braking": pd.get("braking"),
        "trajectory_2d": {
            "corners": pd["trajectory_2d"]["corners"],
            "laps": [l for l in pd["trajectory_2d"]["laps"] if keep_lap(l)],
        },
    },
}
out["best_lap_number"] = best

txt = json.dumps(rnd(out), ensure_ascii=False, separators=(",", ":"))
# Le nom du pilote que contient l'en-tête du CSV ne doit jamais être exporté : on
# lit ses champs « Racer / Driver / Pilote » dans le fichier et on vérifie qu'aucun
# n'apparaît dans la sortie (rien n'est écrit en dur dans le dépôt).
with opener(source, "rt", encoding="utf-8", errors="ignore") as f_chk:
    head = [next(f_chk, "") for _ in range(40)]
for line in head:
    cells = [c.strip().strip('"') for c in line.replace(";", ",").split(",")]
    if len(cells) >= 2 and cells[0].lower() in ("racer", "driver", "pilote", "pilot"):
        assert cells[1].upper() not in txt.upper(), "le nom du pilote ne doit jamais être exporté"
with open(os.path.normpath(OUT), "w", encoding="utf-8") as f:
    f.write(txt)
print(f"écrit {os.path.normpath(OUT)} — {len(txt) // 1024} Ko, meilleur tour {best}, tours {sorted(used)}")
