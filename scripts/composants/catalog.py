#!/usr/bin/env python3
"""
Base des composants ApexAI, version app (saison 2026-2027).

Assemble data.py (manuels constructeurs, règlements 2026) et les relevés
complémentaires ci-dessous (listes d'homologation CIK-FIA, gammes des
fabricants, retours de pilotes) en un seul fichier JSON lu par l'API :

    python3 catalog.py <dossier backend>/src/data/component_catalog.json [migration.sql]

Règles :
- chaque fiche porte ses sources et leur nature (constructeur, règlement,
  homologation, retour pilotes, presse spécialisée, revendeur, base ApexAI) ;
- une valeur qu'aucune source ne donne reste vide : rien n'est estimé ici ;
- les durées de vie déjà présentes dans kart_components et sans source sont
  marquées « estimation ».
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

from data import BRAKES, CARBS, CATEGORIES, CHASSIS, ENGINES, MAINTENANCE, SOURCES, TIRES

SEASON = "2026-2027"

# ------------------------------------------------------------------ Sources
# clé: (libellé, url, nature)
SRC = {
    **{k: (v[0], v[1], "constructeur") for k, v in SOURCES.items()},
    "ffsa_annexe_2026": (SOURCES["ffsa_annexe_2026"][0], SOURCES["ffsa_annexe_2026"][1], "règlement"),
    "eurocup_2026": (SOURCES["eurocup_2026"][0], SOURCES["eurocup_2026"][1], "règlement"),
    "ka100_hom": (SOURCES["ka100_hom"][0], SOURCES["ka100_hom"][1], "homologation"),
    "cik_tyres_2024": ("CIK-FIA : pneus homologués 2024-2026, liste technique (liée depuis KartSport News)", "https://www.kartsportnews.com/2024/01/15/2024-homologated-equipment/", "homologation"),
    "ffsa_tyres_2024": ("Kart-Actu : pneumatiques FFSA Karting 2024-2026 (modèles et prix TTC du train)", "https://kart-actu.com/ffsakarting/pneumatiques-ffsa-karting-2024-2026/2023/", "presse spécialisée"),
    "cik_chassis": ("Châssis homologués CIK-FIA, groupes 1 et 2 (relevé Motorsport Timing)", "https://www.motorsport-timing.co.uk/group-1-2/", "homologation"),
    "tm_2026": ("KartSport News : gamme moteurs TM Kart homologuée 2026-2028", "https://www.kartsportnews.com/2025/11/04/tms-new-engine-range/", "presse spécialisée"),
    "tkart_mini": ("TKART : guide des moteurs MINI", "https://tkart.it/en/collections/mini-engines-guide-to-models-from-leading-brands-and-manufacturers", "presse spécialisée"),
    "tkart_kz": ("TKART : les meilleurs moteurs KZ", "https://tkart.it/en/news/toolbox/the-best-kz-engines", "presse spécialisée"),
    "kartclass_iame": ("KartClass : guide des moteurs IAME", "https://kartclass.com/blogs/news/iame-engine-guide-types-models-and-specs", "presse spécialisée"),
    "kartclass_vortex": ("KartClass : les moteurs Vortex", "https://kartclass.com/blogs/news/types-of-vortex-engines", "presse spécialisée"),
    "kartclass_kz": ("KartClass : les moteurs KZ par marque", "https://kartclass.com/blogs/news/different-brand-of-kz-shifter-engines", "presse spécialisée"),
    "mg_names": ("eKartingNews : nouvelle nomenclature des pneus MG", "https://www.ekartingnews.com/?p=105749", "presse spécialisée"),
    "kp_lecont": ("KartPulse : LeCont LOH, LPM et LH03", "https://forums.kartpulse.com/t/lecont-tyres-loh-vs-lpm-vs-lh03/14045", "retour pilotes"),
    "zipnorth_vega": ("Zip North : gamme Vega (revendeur)", "https://zipnorth.com/collections/vega-kart-tyres", "revendeur"),
    "speedwear_komet": ("Speedwear : pneus Komet (revendeur)", "https://speedwear.be/en/product-tag/comet/", "revendeur"),
    "lecont_svc": ("Karting Australia : spécification du pneu LeCont SVC 2022-2026", "https://kartingnetau.r6d.dev/wp-content/uploads/2021/12/LeCont-SVC-Dry-Tyre-Specification-2022-2026.pdf", "règlement"),
    "kp_rotax": ("KartPulse : révision des Rotax (avis de pilotes)", "https://forums.kartpulse.com/t/rebuild-of-rotax/6352", "retour pilotes"),
    "kp_x30": ("KartPulse : calendrier de révision IAME X30 (préparateur et pilotes)", "https://forums.kartpulse.com/t/insight-and-opinion-wanted-into-rebuild-schedule-iame-x30/1008", "retour pilotes"),
    "kp_kz": ("KartPulse : entretien TM KZ (avis de pilotes)", "https://forums.kartpulse.com/t/tm-kz-r1-maintenance-intervals-before-after-session-prep/14551", "retour pilotes"),
    "kp_ka100": ("KartPulse : entretien IAME KA100 (avis de pilotes)", "https://forums.kartpulse.com/t/iame-ka100-maintenance-and-rebuild-time/1852", "retour pilotes"),
    "apexai_pilotes": ("Retours des pilotes ApexAI (octobre 2026)", None, "retour pilotes"),
    "apexai_base": ("Catalogue ApexAI d'origine (valeur usuelle sans document source)", None, "base ApexAI"),
}

CATEGORY_LABELS = {
    "engine": "Moteurs",
    "tire": "Pneus",
    "chassis": "Châssis",
    "brake": "Freins",
    "carburetor": "Carburateurs",
    "axle": "Axes arrière",
    "ignition": "Allumages",
    "spark_plug": "Bougies",
    "sprocket": "Pignons et couronnes",
    "chain": "Chaînes",
    "clutch": "Embrayages",
    "engine_part": "Pièces moteur",
    "lubricant": "Huiles",
    "fuel": "Carburant",
    "filter": "Filtres",
    "exhaust": "Échappements",
    "cooling": "Refroidissement",
    "brake_part": "Pièces de frein",
}

# Lignes déjà présentes dans kart_components (migrations 2026-07)
DB_IDS = {
    "rotax-micro", "rotax-mini", "rotax-junior", "rotax-max-125", "rotax-dd2", "iame-water-swift", "iame-ka100",
    "iame-x30-junior", "iame-x30", "iame-super-x30", "tm-r1", "tm-r2", "tm-kz10c", "vortex-rvx", "vortex-rok",
    "honda-gx160", "honda-gx270", "honda-gx390", "subaru-kx21", "iame-mini-swift", "vortex-mini-rok",
    "vortex-rok-junior", "honda-gx200",
    "vega-rouge-sl4", "vega-blanc-xm3", "vega-vert-xh3", "vega-bleu-w6", "lecont-jaune-svm", "lecont-blanc-svb",
    "lecont-prime-svc", "mg-jaune-sm", "mg-rouge-sh", "mg-blanc-wt", "mojo-d2", "mojo-d5", "mojo-w5", "komet-k2m",
    "komet-k2h", "komet-k1w", "bridgestone-yds",
    "otk-bsd", "otk-bss", "brembo-ma5", "parolin-ap", "rr-evo", "birel-freeline", "crg-ven11",
    "tonykart-racer-401r", "tonykart-racer-401rr", "tonykart-krypton-801", "sodi-sigma-rs3", "sodi-sigma-kz",
    "sodi-furia", "birel-ry30-s16", "birel-cry30-s16", "crg-road-rebel", "crg-kt2", "crg-heron",
    "kosmic-mercury-rr", "kosmic-mercury-r", "kr-kr2", "kr-kr3", "exprit-noesis-r", "praga-dragon",
    "intrepid-cruiser", "energy-kinetic",
    "tillotson-hw27a", "dellorto-vhsb34", "dellorto-vhsh30", "axle-soft-50", "axle-medium-50", "axle-hard-50",
    "otk-axle-q", "otk-axle-m", "otk-axle-h",
}


def slug(*parts: str) -> str:
    s = unicodedata.normalize("NFKD", " ".join(p for p in parts if p)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


ITEMS: dict[str, dict] = {}


def add(id_, category, brand, name, sub=None, specs=None, life=None, unit=None, uses=None, aliases=None,
        hom=None, src=(), notes=None, maintenance=None):
    """Ajoute (ou complète) une fiche. Une fiche déjà présente est enrichie, jamais écrasée à vide."""
    assert category in CATEGORY_LABELS, category
    for k in src:
        assert k in SRC, k
    e = ITEMS.get(id_) or {
        "id": id_, "category": category, "brand": brand, "name": name, "subcategory": None, "specs": {},
        "default_life": None, "life_unit": None, "uses": [], "aliases": [], "homologation": None,
        "sources": [], "notes": None, "maintenance": [], "season": SEASON,
    }
    if brand and not e["brand"]:
        e["brand"] = brand
    if name and not e["name"]:
        e["name"] = name
    if sub:
        e["subcategory"] = sub
    if specs:
        e["specs"].update({k: v for k, v in specs.items() if v not in (None, "", [])})
    if life is not None:
        e["default_life"], e["life_unit"] = life, unit
    for u in uses or []:
        if u and u not in e["uses"]:
            e["uses"].append(u)
    for a in aliases or []:
        if a and a not in e["aliases"]:
            e["aliases"].append(a)
    if hom:
        e["homologation"] = hom
    for k in src:
        if k not in e["sources"]:
            e["sources"].append(k)
    if notes:
        e["notes"] = notes if not e["notes"] else f'{e["notes"]} {notes}'
    for m in maintenance or []:
        e["maintenance"].append(m)
    ITEMS[id_] = e
    return e


def mnt(element, action, interval, unit, usage, source, ref="", kind=None):
    """Une opération d'entretien. kind : constructeur / retour pilotes (déduit de la source si absent)."""
    return {
        "element": element, "action": action, "interval": interval, "unit": unit or None,
        "usage": usage, "source": source, "ref": ref or None, "kind": kind or SRC[source][2],
    }


# ======================================================================= MOTEURS
ENGINE_CAT = {
    "iame-x30": "125 Senior", "rotax-max-125": "125 Senior", "rotax-junior": "Junior", "rotax-mini": "Mini",
    "rotax-micro": "Micro", "rotax-dd2": "125 DD2", "vortex-rok": "125 Senior", "vortex-mini-rok": "Mini",
    "iame-ka100": "100", "honda-gx160": "4 Temps", "honda-gx200": "4 Temps",
}
for eid, brand, model, cc, cooling, box, mix, plug, gearoil, rpm, other, s in ENGINES:
    add(eid, "engine", brand, model, ENGINE_CAT.get(eid), specs={
        "displacement_cc": cc, "cooling": cooling, "gearbox": None if box == "non" else box, "fuel_mix": mix,
        "spark_plug": plug, "gearbox_oil": gearoil, "rpm": rpm, "technical": other,
    }, src=[s])

for eid, element, action, interval, unit, usage, s, ref in MAINTENANCE:
    add(eid, "engine", "", "", maintenance=[mnt(element, action, interval, unit, usage, s, ref)])

# Durée avant révision retenue par l'app (heures moteur) et ce qu'en disent les sources.
add("rotax-dd2", "engine", "Rotax", "125 MAX DD2", life=25, unit="hours", src=["apexai_pilotes", "kp_rotax"],
    notes="Révision haut et bas moteur vers 25 h selon les pilotes ApexAI. Le manuel prévoit un démontage complet en centre agréé Rotax (50 h pour la famille 125 MAX evo).",
    maintenance=[
        mnt("Moteur (haut et bas)", "Révision", 25, "heures", "compétition", "apexai_pilotes"),
        mnt("Haut moteur", "Révision", "15 à 20", "heures", "compétition", "kp_rotax"),
        mnt("Moteur complet", "Réfection", "40 à 50", "heures", "compétition", "kp_rotax"),
    ])
for eid in ("rotax-max-125", "rotax-junior"):
    add(eid, "engine", "Rotax", "", life=25, unit="hours", src=["apexai_pilotes", "kp_rotax"],
        notes="Constructeur : démontage et contrôle complet toutes les 50 h en centre agréé. En compétition, les pilotes révisent le haut moteur bien avant (15 à 25 h).",
        maintenance=[
            mnt("Haut moteur", "Révision", "15 à 20", "heures", "compétition", "kp_rotax"),
            mnt("Moteur complet", "Réfection", "40 à 50", "heures", "compétition", "kp_rotax"),
            mnt("Moteur (haut et bas, version DD2)", "Révision", 25, "heures", "compétition", "apexai_pilotes"),
        ])
for eid in ("rotax-mini", "rotax-micro"):
    add(eid, "engine", "Rotax", "", life=50, unit="hours", src=["rotax_evo_2016"],
        notes="Démontage et contrôle complet toutes les 50 h en centre agréé Rotax.")
add("iame-x30", "engine", "IAME", "X30", life=10, unit="hours", src=["kp_x30"],
    notes="IAME compte en litres de mélange (piston 100 L en compétition). Côté pilotes et préparateurs : haut moteur vers 8 à 10 h, bas moteur vers 20 h.",
    maintenance=[
        mnt("Haut moteur", "Révision", "8 à 10", "heures", "compétition", "kp_x30"),
        mnt("Bas moteur", "Réfection", "≈ 20", "heures", "compétition", "kp_x30"),
    ])
add("iame-x30-junior", "engine", "IAME", "X30 Junior", life=10, unit="hours", src=["iame_x30", "kp_x30"],
    notes="Même moteur que le X30, bridé : mêmes intervalles en litres de mélange.")
add("iame-ka100", "engine", "IAME", "KA100", life=15, unit="hours", src=["ka100_hom", "kp_ka100"],
    notes="Aucun intervalle constructeur publié. Pilotes : 10 à 15 h entre deux hauts moteurs sans tirer haut dans les tours ; kit de carburateur vers 5 à 6 h.",
    maintenance=[
        mnt("Haut moteur", "Révision", "10 à 15", "heures", "compétition", "kp_ka100"),
        mnt("Carburateur", "Kit de réfection", "5 à 6", "heures", "compétition", "kp_ka100"),
    ])
for eid in ("vortex-rok", "vortex-mini-rok"):
    add(eid, "engine", "Vortex", "", life=30, unit="hours", src=[ "vortex_rokgp" if eid == "vortex-rok" else "vortex_minirok"],
        notes="Constructeur : piston toutes les 30 h, bielle et roulements de vilebrequin toutes les 60 h.")
add("vortex-rok-junior", "engine", "Vortex", "ROK Junior", life=30, unit="hours", src=["vortex_rokgp", "kartclass_vortex"],
    notes="Le manuel ROK GP couvre la version Junior : piston 30 h, bas moteur 60 h.")
for eid in ("tm-r1", "tm-r2", "tm-kz10c", "vortex-rvx"):
    add(eid, "engine", "", "", life=6, unit="hours", src=["kp_kz"], uses=["KZ", "KZ2"],
        notes="Aucun intervalle constructeur publié. Pilotes KZ : piston toutes les 3 à 6 h, bas moteur 12 à 18 h, huile de boîte toutes les 2 à 4 séances.",
        maintenance=[
            mnt("Piston", "Remplacer", "3 à 6", "heures", "compétition", "kp_kz"),
            mnt("Bas moteur", "Réfection", "12 à 18", "heures", "compétition", "kp_kz"),
            mnt("Huile de boîte", "Vidange", "2 à 4", "séances", "compétition", "kp_kz"),
            mnt("Clapets", "Contrôler (au moins à chaque changement de piston)", "3 à 6", "heures", "compétition", "kp_kz"),
        ])
for eid in ("iame-water-swift", "iame-mini-swift", "iame-super-x30", "subaru-kx21", "honda-gx270", "honda-gx390"):
    add(eid, "engine", "", "", src=["apexai_base"], notes="Durée avant révision : valeur usuelle du catalogue d'origine, sans document constructeur.")
for eid in ("honda-gx160", "honda-gx200"):
    add(eid, "engine", "Honda", "", src=["honda_gx"], notes="Première vidange à 20 h. La durée avant révision affichée est une valeur usuelle, pas une donnée Honda.")

# Usages réglementaires 2026 (catégories françaises et séries)
USES = {
    "rotax-mini": ["FFSA Cadet (version plombée)", "Rotax Mini MAX"],
    "rotax-micro": ["Rotax Micro MAX"],
    "rotax-junior": ["FFSA Nationale", "Rotax Junior MAX"],
    "rotax-max-125": ["FFSA Senior / Master / Gentleman", "Rotax Senior MAX"],
    "rotax-dd2": ["Rotax DD2"],
    "iame-x30": ["FFSA Senior / Master / Gentleman", "IAME Eurocup X30 Senior / Master / Lady"],
    "iame-ka100": ["IAME Eurocup KA100"],
    "vortex-rok": ["ROK Cup"],
    "vortex-rok-junior": ["ROK Cup Junior"],
    "vortex-mini-rok": ["ROK Cup Mini"],
}
for eid, uses in USES.items():
    add(eid, "engine", "", "", uses=uses)
add("rotax-junior", "engine", "Rotax", "", aliases=["J 125 MAX", "Nationale FFSA", "Rotax Nationale", "Junior MAX evo"])
add("iame-x30", "engine", "IAME", "", aliases=["X30", "X30 Senior", "125 RL TaG"])
add("rotax-max-125", "engine", "Rotax", "", aliases=["125 MAX evo", "Max Evo", "Senior MAX"])
add("rotax-dd2", "engine", "Rotax", "", aliases=["DD2", "Max DD2", "125 MAX DD2 evo"])
add("vortex-rok", "engine", "Vortex", "", aliases=["ROK GP", "ROK"])
add("iame-ka100", "engine", "IAME", "", aliases=["KA100", "Reedjet KA100"])
add("rotax-mini", "engine", "Rotax", "", aliases=["Rotax Cadet FFSA"])

# Nouveaux moteurs (gammes 2026)
NEW_ENGINES = [
    # id, marque, modèle, sous-cat, cylindrée, catégories, sources, notes
    ("tm-kz-r3", "TM Kart", "KZ-R3", "KZ", 125, ["KZ", "KZ2", "KZ2 Masters"], ["tm_2026"], "Homologation CIK-FIA 2026-2028, successeur du KZ-R2 (existe en version Total Black)."),
    ("tm-ok-s3-senior", "TM Kart", "OK S3-Senior", "OK", 125, ["OK"], ["tm_2026"], "Homologation prolongée pour 2026-2028."),
    ("tm-ok-s3-junior", "TM Kart", "OK S3-Junior", "OK-Junior", 125, ["OK-Junior"], ["tm_2026"], "Homologation prolongée pour 2026-2028."),
    ("tm-ok-s3-okn", "TM Kart", "OK S3-OKN", "OK-N", 125, ["OK-N", "OK-N Junior"], ["tm_2026"], "Homologation prolongée pour 2026-2028."),
    ("tm-mini-4", "TM Kart", "MINI 4 / 4B", "Mini", 60, ["MINI (60 cm³)"], ["tm_2026", "tkart_mini"], "Homologation 2026-2028, successeur du MINI 3 / 3B."),
    ("tm-mini-3", "TM Kart", "MINI 3 / 3B", "Mini", 60, ["MINI (60 cm³)"], ["tkart_mini"], "Homologation 2023-2025."),
    ("tm-mini-60", "TM Kart", "Mini 60", "Mini", 60, ["Mini"], ["tkart_mini"], None),
    ("iame-gr3", "IAME", "GR-3", "Mini", 60, ["MINI FIA"], ["kartclass_iame"], None),
    ("iame-reedster-v", "IAME", "Reedster V", "OK", 125, ["OK", "OK-Junior", "OK-N"], ["kartclass_iame"], None),
    ("iame-screamer-iii", "IAME", "Screamer III", "KZ", 125, ["KZ", "KZ2"], ["kartclass_iame", "kartclass_kz"], None),
    ("iame-screamer-iv", "IAME", "Screamer IV", "KZ", 125, ["KZ", "KZ2"], ["kartclass_iame"], None),
    ("iame-x30-super-shifter", "IAME", "X30 Super Shifter 175", "175 Shifter", 175, ["175 à boîte"], ["kartclass_iame"], None),
    ("iame-gazelle-minime", "IAME", "MINIME FFSA (Gazelle 60 cm³)", "Mini", 60, ["FFSA Minime"], ["ffsa_annexe_2026"], "Pignon 11 dents imposé en Minime."),
    ("vortex-vtm", "Vortex", "VTM", "Mini", 60, ["Mini"], ["kartclass_vortex"], None),
    ("vortex-vtj", "Vortex", "VTJ", "OK-Junior", 125, ["OK-Junior"], ["kartclass_vortex"], None),
    ("vortex-vts", "Vortex", "VTS", "OK", 125, ["OK"], ["kartclass_vortex"], None),
    ("vortex-vtz", "Vortex", "VTZ", "KZ", 125, ["KZ", "KZ2"], ["kartclass_vortex"], None),
    ("vortex-rsz", "Vortex", "RSZ", "KZ", 125, ["KZ", "KZ2"], ["kartclass_kz", "tkart_kz"], None),
    ("vortex-rok-shifter", "Vortex", "ROK Shifter", "Shifter", 125, ["ROK Shifter"], ["kartclass_kz"], None),
    ("vortex-mini-60-fr", "Vortex", "MINI 60 FR", "Mini", 60, ["FFSA Mini 60"], ["ffsa_annexe_2026"], "Carburateur Dell'Orto PHBG 18 BS, allumage Selettra PF5858."),
    ("vortex-mcx", "Vortex", "MCX", "Mini", 60, ["Mini"], ["tkart_mini"], None),
    ("modena-kk2", "Modena Engines", "KK2", "KZ", 125, ["KZ", "KZ2"], ["tkart_kz"], None),
    ("modena-kk3", "Modena Engines", "KK3", "KZ", 125, ["KZ", "KZ2"], ["kartclass_kz"], None),
    ("lke-r15", "LKE", "R15", "Mini", 60, ["Mini"], ["tkart_mini"], None),
    ("lke-black-rock", "LKE", "Black Rock", "KZ", 125, ["KZ", "KZ2"], ["tkart_kz"], None),
    ("maxter-mxs2", "Maxter", "MXS 2", "KZ", 125, ["KZ", "KZ2"], ["tkart_kz"], None),
]
for eid, brand, model, sub, cc, uses, s, notes in NEW_ENGINES:
    kz = sub in ("KZ", "Shifter", "175 Shifter")
    add(eid, "engine", brand, model, sub, specs={"displacement_cc": cc, "stroke": "2T", "gearbox": "6 rapports" if kz else None},
        uses=uses, src=s, notes=notes)
    if sub == "KZ":
        add(eid, "engine", brand, model, src=["kp_kz"], life=6, unit="hours",
            notes="Pas d'intervalle constructeur publié : 6 h avant révision, d'après les pilotes KZ (piston 3 à 6 h).",
            maintenance=[mnt("Piston", "Remplacer", "3 à 6", "heures", "compétition", "kp_kz"),
                         mnt("Bas moteur", "Réfection", "12 à 18", "heures", "compétition", "kp_kz")])

# ======================================================================= PNEUS
# Lignes existantes : on garde leur nom (les profils pilotes y font référence) et on documente.
for tid in ("vega-blanc-xm3", "vega-vert-xh3", "lecont-jaune-svm", "lecont-blanc-svb", "mojo-d2", "komet-k2m",
            "komet-k2h", "bridgestone-yds", "mg-blanc-wt", "lecont-prime-svc"):
    add(tid, "tire", "", "", src=["apexai_base"],
        notes="Durée de vie en tours et pressions : valeurs de départ du catalogue d'origine, pas des données du fabricant.")
add("lecont-prime-svc", "tire", "LeCont", "", src=["lecont_svc"])

CIK = "Homologation CIK-FIA 2024-2026"
TIRE_ROWS = [
    # id, marque, modèle, usage, type CIK, catégories, sources, aliases, prix TTC du train, note
    ("maxxis-ma01", "Maxxis", "MA01", "slick", "Prime / Option", [], ["cik_tyres_2024"], [], None, None),
    ("maxxis-mw11-mw12", "Maxxis", "MW11 / MW12", "rain", "Wet", [], ["cik_tyres_2024"], ["MW11", "MW12"], None, None),
    ("maxxis-mc01", "Maxxis", "MC01", "slick", "Mini", [], ["cik_tyres_2024"], [], None, None),
    ("maxxis-mw21-mw22", "Maxxis", "MW21 / MW22", "rain", "Wet Mini", [], ["cik_tyres_2024"], ["MW21", "MW22"], None, None),
    ("lecont-lpm", "LeCont", "LPM", "slick", "Prime", ["KZ"], ["cik_tyres_2024", "kp_lecont"], [], None, "Gomme à fort grip, surtout utilisée en KZ."),
    ("lecont-loh", "LeCont", "LOH Option", "slick", "Option", ["FFSA KZ2 (version ASN FFSA)"], ["cik_tyres_2024", "ffsa_annexe_2026", "ffsa_tyres_2024", "kp_lecont"], ["LOH"], 212, "Grip moyen à élevé."),
    ("lecont-lmk", "LeCont", "LMK", "slick", "Mini", [], ["cik_tyres_2024"], [], None, None),
    ("lecont-lwr", "LeCont", "LWR", "rain", "Wet", ["FFSA KZ2"], ["cik_tyres_2024", "ffsa_annexe_2026", "ffsa_tyres_2024"], [], 212, None),
    ("lecont-lmw", "LeCont", "LMW", "rain", "Wet Mini", [], ["cik_tyres_2024"], [], None, None),
    ("lecont-lh03", "LeCont", "LH03", "slick", None, ["Catégories nationales"], ["kp_lecont"], [], None, "Grip moyen, flanc plus tolérant que les pneus CIK-FIA."),
    ("mg-sm2", "MG", "SM2", "slick", "Prime", [], ["cik_tyres_2024"], [], None, None),
    ("mg-sh2", "MG", "SH2", "slick", "Option", [], ["cik_tyres_2024"], ["MG Red SH2"], None, None),
    ("mg-sc2", "MG", "SC2", "slick", "Mini", [], ["cik_tyres_2024"], [], None, None),
    ("mg-sw2", "MG", "SW2", "rain", "Wet", [], ["cik_tyres_2024"], [], None, None),
    ("mg-scw2", "MG", "SCW2", "rain", "Wet Mini", [], ["cik_tyres_2024"], [], None, None),
    ("mg-ss", "MG", "SS (vert)", "slick", None, [], ["mg_names"], ["YZ"], None, None),
    ("mg-si", "MG", "SI (blanc, intermédiaire)", "slick", None, [], ["mg_names"], ["IZ"], None, "Pneu intermédiaire."),
    ("mg-rl1", "MG", "RL1 (orange)", "slick", None, ["4 temps", "Location"], ["mg_names"], ["VK"], None, None),
    ("mg-rl2", "MG", "RL2 (bleu)", "slick", None, ["4 temps", "Location"], ["mg_names"], ["IR"], None, None),
    ("mg-rl3", "MG", "RL3", "slick", None, ["Location"], ["mg_names"], [], None, None),
    ("mojo-d2xx", "MOJO", "D2XX", "slick", "Option", ["Rotax Junior MAX"], ["cik_tyres_2024", "mojo"], [], None, None),
    ("mojo-c2", "MOJO", "C2", "slick", "Mini", ["Rotax Micro MAX / Mini MAX"], ["cik_tyres_2024", "mojo"], [], None, None),
    ("mojo-cw", "MOJO", "CW", "rain", "Wet Mini", ["Rotax Micro MAX / Mini MAX"], ["cik_tyres_2024", "mojo"], [], None, "Pression en piste détrempée donnée par Rotax : 0,85 bar."),
    ("shinko-prime", "Shinko", "Prime", "slick", "Prime", [], ["cik_tyres_2024"], [], None, None),
    ("shinko-option", "Shinko", "Option", "slick", "Option", [], ["cik_tyres_2024"], [], None, None),
    ("shinko-wet", "Shinko", "Wet", "rain", "Wet", [], ["cik_tyres_2024"], [], None, None),
    ("dunlop-dh-m", "Dunlop", "DH M", "slick", "Prime", [], ["cik_tyres_2024"], [], None, None),
    ("dunlop-dh-h", "Dunlop", "DH H", "slick", "Option", [], ["cik_tyres_2024"], [], None, None),
    ("dunlop-kt14-w15", "Dunlop", "KT14 W15", "rain", "Wet", [], ["cik_tyres_2024"], [], None, None),
    ("vega-xm4", "Vega", "XM4 (Prime, blanc)", "slick", "Prime", [], ["cik_tyres_2024", "zipnorth_vega"], ["XM4"], None, None),
    ("vega-xh4", "Vega", "XH4 (Option, vert)", "slick", "Option", ["FFSA Senior / Master / Gentleman"], ["cik_tyres_2024", "ffsa_annexe_2026", "ffsa_tyres_2024", "zipnorth_vega"], ["XH4"], 215, "Gomme dure."),
    ("vega-m1", "Vega", "M1", "slick", "Mini", ["FFSA Cadet"], ["cik_tyres_2024", "ffsa_annexe_2026"], [], None, None),
    ("vega-wm1", "Vega", "WM1", "rain", "Wet Mini", [], ["cik_tyres_2024", "zipnorth_vega"], [], None, None),
    ("vega-cadetti", "Vega", "Cadetti", "slick", None, ["FFSA Mini Kart", "FFSA Mini 60", "FFSA Minime"], ["ffsa_annexe_2026", "ffsa_tyres_2024", "zipnorth_vega"], [], 158, "Dureté IRHD 69 avant et arrière (revendeur)."),
    ("komet-k3m", "Komet", "K3M", "slick", None, ["IAME Eurocup X30 Senior / Master / Gentleman / Lady"], ["eurocup_2026"], [], None, None),
    ("komet-k3h", "Komet", "K3H", "slick", None, ["IAME Eurocup KA100"], ["eurocup_2026"], [], None, None),
    ("komet-k3w", "Komet", "K3W", "rain", None, ["IAME Eurocup (toutes catégories)"], ["eurocup_2026", "speedwear_komet"], [], None, None),
]
for tid, brand, model, use, cik, uses, s, aliases, price, note in TIRE_ROWS:
    compound = "wet" if use == "rain" else {"Prime": "soft", "Option": "hard"}.get(cik or "", None)
    add(tid, "tire", brand, model, "Wet" if use == "rain" else cik, specs={
        "use": use, "cik_type": cik, "compound": compound, "price_eur_set": price,
    }, uses=uses, aliases=aliases, src=s, hom=CIK if "cik_tyres_2024" in s else None, notes=note)

# Lignes existantes = mêmes pneus que des modèles sourcés
add("vega-rouge-sl4", "tire", "Vega", "Rouge SL4", specs={"price_eur_set": 205}, uses=["FFSA Nationale"],
    aliases=["SL4", "Vega SL4"], src=["ffsa_annexe_2026", "ffsa_tyres_2024"])
add("vega-bleu-w6", "tire", "Vega", "Bleu W6", specs={"price_eur_set": 220, "cik_type": "Wet"},
    uses=["FFSA Nationale", "FFSA Senior / Master / Gentleman"], aliases=["W6", "Vega W6"], hom=CIK,
    src=["cik_tyres_2024", "ffsa_annexe_2026", "ffsa_tyres_2024"])
add("mojo-d5", "tire", "Mojo", "D5", specs={"cik_type": "Prime"}, uses=["Rotax Senior MAX", "Rotax DD2"], hom=CIK,
    src=["cik_tyres_2024", "mojo"], notes="Rotax : après le premier roulage d'un pneu neuf, la pression ne doit pas monter de plus de 0,35 bar.")
add("mojo-w5", "tire", "Mojo", "W5", specs={"cik_type": "Wet"}, uses=["Rotax Senior MAX", "Rotax DD2", "Rotax Junior MAX"], hom=CIK,
    src=["cik_tyres_2024", "mojo"], notes="Pression en piste détrempée donnée par Rotax : 1,0 bar.")
add("mg-jaune-sm", "tire", "MG", "Jaune SM", aliases=["SM", "FZ", "MG Yellow"], src=["mg_names"])
add("mg-rouge-sh", "tire", "MG", "Rouge SH", aliases=["SH", "HZI", "MG Red"], src=["mg_names"])
add("komet-k1w", "tire", "Komet", "K1W", src=["speedwear_komet"])
for tid in ("vega-rouge-sl4", "vega-bleu-w6", "mojo-d5", "mojo-w5", "mg-jaune-sm", "mg-rouge-sh", "komet-k1w"):
    add(tid, "tire", "", "", src=["apexai_base"],
        notes="Durée de vie en tours et pressions de départ : valeurs du catalogue d'origine, pas des données du fabricant.")

# ======================================================================= CHÂSSIS
CIK_CHASSIS = [
    ("Alpha Karting", "SP40", "022-CH-39"), ("Bestkart", "F01", "013-CH-30"), ("Bestkart", "F03", "013-CH-20"),
    ("Birel ART", "RY32", "007-CH-12"), ("Birel ART", "RY30", "007-CH-10"), ("BRM", "CR95", "021-CH-95"),
    ("CKR", "Barracuda", "021-CH-71"), ("CKR", "Blue Shark", "021-CH-11"), ("Compkart", "Covert 3.0", "007-CH-08"),
    ("CRG", "Heron", "002-CH-45"), ("CRG", "KT2", "002-CH-24"), ("CRG", "KT4", "002-CH-17"), ("CRG", "KT5", "002-CH-25"),
    ("CRG", "Road Rebel", "002-CH-20"), ("Croc Promotion", "MC-01", "009-CH-20"), ("DFM Racing", "Nascart S", "024-CH-66"),
    ("DR", "J90", "002-CH-28"), ("DR", "M92", "002-CH-26"), ("DR", "M99", "002-CH-27"), ("DR", "S97", "002-CH-66"),
    ("Drago Corse", "RM-01", "009-CH-54"), ("EKS", "Condor Evo 2", "009-CH-10"), ("Energy Corse", "Eclipse", "017-CH-20"),
    ("Energy Corse", "Kinetic", "017-CH-26"), ("Energy Corse", "Space", "017-CH-30"), ("EOS", "Typhoon", "012-CH-01"),
    ("Evo Kart", "Allen", "002-CH-88"), ("Evo Kart", "EK-01", "002-CH-02"), ("Exprit", "Noesis", "012-CH-05"),
    ("Falcon", "Charlotte", "017-CH-50"), ("Falcon", "Indy", "017-CH-56"), ("Gillard", "TG17", "012-CH-08"),
    ("GP / Alu Group", "Aluminos RS1", "002-CH-74"), ("GP / Alu Group", "GP Racing GP15", "002-CH-11"),
    ("Haase Corsa", "Karif CH22", "014-CH-22"), ("Haase Corsa", "Zenit CH20", "014-CH-01"), ("HRK", "Sunrise", "021-CH-30"),
    ("Intrepid", "Cruiser MS3", "015-CH-60"), ("Intrepid", "Escape-17", "015-CH-03"), ("Intrepid", "Matrix", "015-CH-65"),
    ("IPK / Praga", "Dragon", "006-CH-90"), ("IPK / Praga", "Fighter", "006-CH-80"), ("Italcorse", "IT20", "001-CH-59"),
    ("Jesolo", "JP1-EVO Fly", "056-CH-99"), ("Kali Kart", "KK02", "002-CH-54"), ("Kali Kart", "KK03", "002-CH-78"),
    ("Kali Kart", "KK04", "002-CH-12"), ("Kart Mini", "M3", "028-CH-76"), ("Kosmic", "Mercury", "012-CH-10"),
    ("Kart Republic", "KR1", "023-CH-07"), ("Kart Republic", "KR2", "023-CH-98"), ("Kart Republic", "KR3", "023-CH-47"),
    ("Lenzokart", "KK", "033-CH-05"), ("Lenzokart", "Ramses", "033-CH-10"), ("Lion Kart", "Gold Lioness", "009-CH-99"),
    ("LN Racing Kart", "Four", "012-CH-12"), ("Mach1", "Zelos", "025-CH-05"), ("Maranello", "MK1", "002-CH-21"),
    ("Maranello", "MK3", "002-CH-22"), ("Maranello", "MK4", "002-CH-23"), ("Mega", "Black", "029-CH-53"),
    ("MS Kart", "Blue Phoenix", "008-CH-02"), ("MS Kart", "Blue Swift Evo", "008-CH-88"), ("Oberon Racing Kart", "Ocean", "017-CH-36"),
    ("ONS", "Bravar", "059-CH-01"), ("OTK", "TDX", "012-CH-20"), ("Pantano", "P1", "057-CH-10"), ("Pantano", "P2", "057-CH-20"),
    ("Parolin", "Le Mans", "017-CH-60"), ("Parolin", "Invader", "017-CH-99"), ("PCR Factory", "PL22", "009-CH-30"),
    ("Redspeed", "RX", "012-CH-99"), ("Righetti Ridolfi", "GTR30", "005-CH-49"), ("Righetti Ridolfi", "Prime", "005-CH-12"),
    ("Sodikart", "S3032", "022-CH-32"), ("Sodikart", "Sigma", "022-CH-97"), ("Swiss Hutless", "Performance", "007-CH-06"),
    ("TB Kart", "S197", "020-CH-32"), ("TB Kart", "S55 M", "020-CH-04"), ("Tecno", "S30", "010-CH-78"), ("Tecno", "TR30", "010-CH-36"),
    ("TK", "Passion", "009-CH-33"), ("Tony Kart", "Racer", "012-CH-30"), ("Tony Kart", "Vektor", "012-CH-14"),
    ("Top Kart", "Dreamer", "017-CH-66"), ("Wildkart", "Xenon", "019-CH-12"), ("Wright", "Jupiter", "027-CH-02"),
]
# Modèles commerciaux déjà au catalogue qui reposent sur une homologation de la liste
HOM_OF_DB = {
    "tonykart-racer-401r": "012-CH-30", "tonykart-racer-401rr": "012-CH-30", "kosmic-mercury-rr": "012-CH-10",
    "kosmic-mercury-r": "012-CH-10", "exprit-noesis-r": "012-CH-05", "crg-heron": "002-CH-45", "crg-kt2": "002-CH-24",
    "crg-road-rebel": "002-CH-20", "sodi-sigma-rs3": "022-CH-97", "sodi-sigma-kz": "022-CH-97", "birel-ry30-s16": "007-CH-10",
    "birel-cry30-s16": "007-CH-10", "kr-kr2": "023-CH-98", "kr-kr3": "023-CH-47", "praga-dragon": "006-CH-90",
    "intrepid-cruiser": "015-CH-60", "energy-kinetic": "017-CH-26",
    # Fiches constructeur (brochure Birel ART S16) qui reposent sur une homologation de la liste
    "birel-art-ry32-s16": "007-CH-12",
}
covered = set(HOM_OF_DB.values())
for brand, model, hom in CIK_CHASSIS:
    if hom in covered:
        continue
    add(slug(brand, model), "chassis", brand, model, "Groupes 1 et 2", uses=["OK", "OK-Junior", "KZ", "KZ2"],
        hom=f"CIK-FIA {hom}", src=["cik_chassis"])
for cid, hom in HOM_OF_DB.items():
    add(cid, "chassis", "", "", hom=f"CIK-FIA {hom}", src=["cik_chassis"])

for cid, brand, model, tubes, wheelbase, axle, brakes, cats, s in CHASSIS:
    add(cid or slug(brand, model), "chassis", brand, model, f"{tubes} mm", specs={
        "tubes_mm": int(tubes) if tubes.isdigit() else tubes, "wheelbase_mm": wheelbase, "axle": axle, "brakes": brakes,
    }, uses=[c.strip() for c in cats.split(",")], src=[s])
add("tonykart-krypton-801", "chassis", "Tony Kart", "Krypton 801", src=["apexai_base"])
for cid in ("sodi-furia", "crg-road-rebel", "crg-kt2", "kosmic-mercury-rr", "kosmic-mercury-r", "kr-kr2", "kr-kr3",
            "exprit-noesis-r", "praga-dragon", "intrepid-cruiser", "energy-kinetic", "sodi-sigma-rs3", "sodi-sigma-kz",
            "tonykart-racer-401r", "tonykart-krypton-801"):
    add(cid, "chassis", "", "", notes="Poids du châssis : valeur usuelle du catalogue d'origine, à confirmer.")

# ======================================================================= FREINS
for bid, brand, system, mount, detail, s in BRAKES:
    add(bid or slug(brand, system), "brake", brand, system, "Hydraulique", specs={"position": mount, "detail": detail}, src=[s])
for bid in ("brembo-ma5", "parolin-ap", "rr-evo"):
    add(bid, "brake", "", "", src=["apexai_base"])
for bid in ("otk-bsd", "otk-bss", "brembo-ma5", "parolin-ap", "rr-evo", "birel-freeline", "crg-ven11"):
    add(bid, "brake", "", "", notes="Durée de vie en tours : valeur usuelle du catalogue d'origine, aucun intervalle publié par le fabricant.")
add("brake-fluid-dot51", "brake_part", "Générique", "Liquide de frein DOT 5.1", specs={"spec": "DOT 5.1"},
    uses=["OTK BSD", "OTK BSS"], src=["otk_401rr"], notes="Liquide indiqué par OTK pour les systèmes BSD et BSS.")

# ======================================================================= CARBURATEURS
for cid, brand, model, use, s in CARBS:
    add(cid or slug(brand, model), "carburetor", brand, model, uses=[use], src=[s])
add("tillotson-hw27a", "carburetor", "Tillotson", "HW-27A", "Membrane", src=["eurocup_2026"])
add("tillotson-hw33a", "carburetor", "Tillotson", "HW-33A", "Membrane", src=["ka100_hom"])
add("tillotson-hl398a", "carburetor", "Tillotson", "HL-398A", "Membrane", uses=["IAME KA100 (alternative à l'homologation)"], src=["ka100_hom"])
add("dellorto-vhsh30", "carburetor", "Dell'Orto", "VHSH 30 CS", "Cuve", specs={"venturi_mm": 30}, src=["ffsa_annexe_2026"],
    notes="Venturi 30 mm maximum en KZ2 FFSA.")
add("dellorto-phbg18bs", "carburetor", "Dell'Orto", "PHBG 18 BS", "Cuve", src=["ffsa_annexe_2026"])
add("dellorto-vhsb34", "carburetor", "Dell'Orto", "VHSB 34", "Cuve", src=["apexai_base"])

# ======================================================================= AXES
for aid in ("axle-soft-50", "axle-medium-50", "axle-hard-50", "otk-axle-q", "otk-axle-m", "otk-axle-h"):
    add(aid, "axle", "", "", src=["apexai_base"])
AXLES = [
    ("axle-50-1020", "Birel ART", "Axe 50 x 2 x 1020 mm", "50 mm", ["Birel ART RY30-S16 / RY32-S16 (OK, X30, Rotax, KZ)"], "birel_s16"),
    ("axle-40-1040", "Birel ART", "Axe 40 x 2 x 1040 mm", "40 mm", ["Birel ART CRY30/32-RX-DD2 (Rotax DD2)"], "birel_s16"),
    ("axle-40-1000", "Birel ART", "Axe 40 x 3 x 1000 mm", "40 mm", ["Birel ART AM29-Y (Mini / Cadet)"], "birel_s16"),
    ("axle-30-960", "Birel ART", "Axe 30 x 5 x 960 mm", "30 mm", ["Birel ART C28-S16 (Mini)"], "birel_s16"),
    ("axle-25-880", "Birel ART", "Axe 25 x 880 mm", "25 mm", ["Birel ART B25 Baby"], "birel_s16"),
    ("otk-axle-50", "OTK", "Axe 50 mm (poinçon CIK-FIA)", "50 mm", ["Tony Kart Racer 401RR (OK, KZ)"], "otk_401rr"),
    ("otk-axle-40", "OTK", "Axe 40 mm", "40 mm", ["Tony Kart Racer 401RR (DD2)"], "otk_401rr"),
]
for aid, brand, name, dia, uses, s in AXLES:
    add(aid, "axle", brand, name, dia, specs={"diameter_mm": int(dia.split()[0])}, uses=uses, src=[s])

# ======================================================================= PETITES PIÈCES
# Allumages
add("selettra-pf5858", "ignition", "Selettra", "PF5858", uses=["Vortex MINI 60 FR (FFSA Mini 60)"], src=["ffsa_annexe_2026"])
add("selettra-analog-ka100", "ignition", "Selettra", "Allumage analogique (KA100)", uses=["IAME KA100"], src=["ka100_hom"])
add("iame-x30-ignition", "ignition", "IAME", "Allumage X30 (avance fixe 22°)", specs={"advance_deg": 22}, uses=["IAME X30"], src=["iame_x30"])

# Bougies
PLUGS = [
    ("ngk-br10eg", "NGK", "BR10EG", ["IAME X30 (piste sèche)"], "iame_x30", None),
    ("ngk-br9eg", "NGK", "BR9EG", ["IAME X30 (pluie)"], "iame_x30", None),
    ("ngk-tb05ema", "NGK", "TB05EMA", ["IAME KA100"], "ka100_hom", "Antiparasite PVL 401 222 ; Selettra « S » également homologuée."),
    ("rotax-plug-iridium", "NGK", "Iridium (moteurs Rotax evo)", ["Rotax 125 MAX evo", "Junior MAX evo", "Mini MAX evo"], "rotax_evo_2016",
     "Écartement 0,7 à 0,8 mm, serrage 25 à 27 Nm. Le Micro MAX evo a une bougie spécifique."),
    ("ngk-bpr6es", "NGK", "BPR6ES", ["Honda GX160 / GX200"], "honda_gx", "Écartement 0,7 à 0,8 mm, serrage 18 Nm. Équivalent Denso W20EPR-U."),
    ("denso-w20epr-u", "Denso", "W20EPR-U", ["Honda GX160 / GX200"], "honda_gx", "Écartement 0,7 à 0,8 mm, serrage 18 Nm."),
]
for pid, brand, name, uses, s, note in PLUGS:
    add(pid, "spark_plug", brand, name, uses=uses, src=[s], notes=note)
add("rotax-plug-iridium", "spark_plug", "NGK", "", specs={"gap_mm": "0,7 à 0,8", "torque_nm": "25 à 27"})
add("vortex-plug", "spark_plug", "Vortex", "Bougie ROK GP / Mini ROK", specs={"gap_mm": "0,8"}, uses=["Vortex ROK GP", "Mini ROK"],
    src=["vortex_rokgp"], maintenance=[
        mnt("Bougie", "Contrôler à chaque course, nettoyer au moins toutes les 5 h", 5, "heures", "tous", "vortex_rokgp", "§5.7 p. 31"),
        mnt("Bougie", "Remplacer", 30, "heures", "tous", "vortex_rokgp", "§5.1 p. 28"),
    ])

# Pignons, couronnes, chaînes
SPROCKETS = [
    ("iame-x30-sprocket", "IAME", "Pignon moteur X30 (Z10 à Z13)", ["IAME Eurocup X30"], "eurocup_2026"),
    ("iame-ka100-sprocket", "IAME", "Pignon moteur KA100 (Z10 à Z12)", ["IAME Eurocup KA100"], "eurocup_2026"),
    ("ffsa-cadet-sprocket", "Rotax", "Pignon 12 dents (Cadet FFSA)", ["FFSA Cadet"], "ffsa_annexe_2026"),
    ("ffsa-minime-sprocket", "IAME", "Pignon 11 dents (Minime FFSA)", ["FFSA Minime"], "ffsa_annexe_2026"),
]
for sid, brand, name, uses, s in SPROCKETS:
    add(sid, "sprocket", brand, name, uses=uses, src=[s])
add("rear-sprocket", "sprocket", "Générique", "Couronne arrière", src=["rotax_evo_2016"], maintenance=[
    mnt("Pignon / couronne / chaîne", "Contrôler l'usure et la déformation des dents, remplacer si besoin", "avant chaque roulage", None, "tous", "rotax_evo_2016", "p. 55")])
add("drive-chain", "chain", "Générique", "Chaîne de transmission", src=["rotax_evo_2016"], maintenance=[
    mnt("Chaîne", "Contrôler l'usure, la tension et le graissage", "avant chaque roulage", None, "tous", "rotax_evo_2016", "p. 55")])

# Embrayages
add("rotax-evo-clutch", "clutch", "Rotax", "Embrayage centrifuge 125 MAX evo", uses=["Rotax 125 MAX evo", "Junior / Mini / Micro MAX evo"], src=["rotax_evo_2016"], maintenance=[
    mnt("Roulement de cloche d'embrayage", "Nettoyer et graisser, remplacer si besoin", 2, "heures", "tous", "rotax_evo_2016", "p. 55"),
    mnt("Garnitures des masselottes", "Contrôler l'usure, remplacer si besoin", 10, "heures", "tous", "rotax_evo_2016", "p. 55"),
])
add("rotax-dd2-clutch", "clutch", "Rotax", "Embrayage de surcharge DD2", uses=["Rotax 125 MAX DD2"], src=["rotax_dd2_2024"], maintenance=[
    mnt("Embrayage de surcharge", "Contrôler", "tableau du manuel", None, "tous", "rotax_dd2_2024", "ch. 4 p. 9")])
add("vortex-clutch", "clutch", "Vortex", "Embrayage ROK GP / Mini ROK", uses=["Vortex ROK GP", "Mini ROK"], src=["vortex_rokgp", "vortex_minirok"], maintenance=[
    mnt("Embrayage", "Contrôler et nettoyer", 10, "heures", "tous", "vortex_rokgp", "§5.1 p. 28"),
    mnt("Embrayage", "Remplacer", 30, "heures", "tous", "vortex_rokgp", "§5.1 p. 28"),
])

# Pièces moteur (X30 en litres de mélange : unité du manuel IAME)
X30_PARTS = [
    ("iame-x30-piston", "Piston X30", 100, 150, "Remplacer (ou dès que le jeu piston / cylindre dépasse 0,14 mm)", "p. 8"),
    ("iame-x30-small-end", "Cage à aiguilles de pied de bielle X30", 100, 150, "Remplacer", "p. 9"),
    ("iame-x30-big-end", "Cage de tête de bielle, maneton et cale X30", 200, 300, "Remplacer", "p. 9"),
    ("iame-x30-main-bearings", "Roulements de vilebrequin X30", 200, 300, "Remplacer", "p. 9"),
    ("iame-x30-conrod", "Bielle X30", 400, 600, "Remplacer (ou dès que l'ovalisation de la tête dépasse 0,01 mm)", "p. 9"),
]
for pid, name, comp, leisure, action, ref in X30_PARTS:
    add(pid, "engine_part", "IAME", name, uses=["IAME X30", "X30 Junior"], src=["iame_x30"], life=comp, unit="litres",
        maintenance=[mnt(name, action, comp, "litres de mélange", "compétition", "iame_x30", ref),
                     mnt(name, action, leisure, "litres de mélange", "loisir", "iame_x30", ref)])
VORTEX_PARTS = [
    ("vortex-rok-piston", "Piston ROK GP", 30, "vortex_rokgp", "§5.1 p. 28", ["Vortex ROK GP", "ROK Junior"]),
    ("vortex-rok-conrod", "Bielle ROK GP", 60, "vortex_rokgp", "§5.1 et §5.14", ["Vortex ROK GP", "ROK Junior"]),
    ("vortex-rok-main-bearings", "Roulements de vilebrequin ROK GP", 60, "vortex_rokgp", "§5.1 et §5.15", ["Vortex ROK GP", "ROK Junior"]),
    ("vortex-minirok-piston", "Piston Mini ROK", 30, "vortex_minirok", "§5.13 p. 27", ["Mini ROK"]),
    ("vortex-minirok-conrod", "Bielle Mini ROK", 60, "vortex_minirok", "§5.14 p. 29", ["Mini ROK"]),
]
for pid, name, h, s, ref, uses in VORTEX_PARTS:
    add(pid, "engine_part", "Vortex", name, uses=uses, src=[s], life=h, unit="hours",
        maintenance=[mnt(name, "Remplacer", h, "heures", "tous", s, ref)])
add("rotax-evo-teardown", "engine_part", "Rotax", "Révision complète 125 MAX evo (piston, axe, bielle, roulements, équilibrage, pompe à eau)",
    uses=["Rotax 125 MAX evo", "Junior / Mini / Micro MAX evo"], src=["rotax_evo_2016", "kp_rotax"], life=50, unit="hours", maintenance=[
        mnt("Moteur complet", "Démontage et contrôle par un centre agréé Rotax", 50, "heures", "tous", "rotax_evo_2016", "p. 56"),
        mnt("Haut moteur", "Révision", "15 à 20", "heures", "compétition", "kp_rotax"),
    ])
add("rotax-dd2-teardown", "engine_part", "Rotax", "Révision haut et bas moteur DD2", uses=["Rotax 125 MAX DD2"],
    src=["apexai_pilotes", "rotax_dd2_2024"], life=25, unit="hours", maintenance=[
        mnt("Moteur (haut et bas)", "Révision", 25, "heures", "compétition", "apexai_pilotes"),
        mnt("Moteur complet", "Démontage et contrôle par un centre agréé Rotax", "tableau du manuel", None, "tous", "rotax_dd2_2024", "ch. 4 p. 8"),
    ])
add("rotax-balance-gears", "engine_part", "Rotax", "Pignons de l'arbre d'équilibrage 125 MAX evo", uses=["Rotax 125 MAX evo"], src=["rotax_evo_2016"], maintenance=[
    mnt("Pignons de l'arbre d'équilibrage", "Contrôler l'usure, remplacer si besoin", 10, "heures", "tous", "rotax_evo_2016", "p. 55")])
add("kz-piston", "engine_part", "Générique", "Piston moteur KZ", uses=["KZ", "KZ2"], src=["kp_kz"], life=6, unit="hours", maintenance=[
    mnt("Piston", "Remplacer", "3 à 6", "heures", "compétition", "kp_kz")])
add("kz-reeds", "engine_part", "Générique", "Clapets moteur KZ", uses=["KZ", "KZ2"], src=["kp_kz"], maintenance=[
    mnt("Clapets", "Contrôler à chaque week-end de course, remplacer à l'usure", "≈ 3 à 6", "heures", "compétition", "kp_kz")])

# Huiles et carburant
add("wladoil-k2t", "lubricant", "Wladoil", "K-2T (huile 2 temps)", uses=["IAME Eurocup"], src=["eurocup_2026"], notes="Mélange 4 à 6 % imposé en Eurocup.")
add("wladoil-ep100", "lubricant", "Wladoil", "IAME Gear Oil EP100 (huile de boîte)", specs={"volume_ml": 40}, uses=["IAME X30"], src=["iame_x30"],
    maintenance=[mnt("Huile de boîte (carter d'embrayage)", "Vidange complète", 5, "heures", "tous", "iame_x30", "p. 1")])
add("xps-kart-tec", "lubricant", "XPS", "Kart-Tec SAE 15W-40 (huile de boîte DD2)", specs={"volume_l": 0.15}, uses=["Rotax 125 MAX DD2"], src=["rotax_dd2_2024"],
    maintenance=[mnt("Huile de boîte", "Remplacer après les 5 premières heures, puis contrôler toutes les 5 h", 5, "heures", "tous", "rotax_dd2_2024", "ch. 4 p. 8")])
add("rotax-gear-oil", "lubricant", "Générique", "Huile de boîte SAE 15W-40 (Rotax evo)", specs={"volume_ml": 100}, uses=["Rotax 125 MAX evo", "Junior / Mini / Micro MAX evo"], src=["rotax_evo_2016"],
    maintenance=[mnt("Niveau d'huile de boîte", "Contrôler, compléter", 2, "heures", "tous", "rotax_evo_2016", "p. 55"),
                 mnt("Huile de boîte", "Remplacer (au moins une fois par an)", 50, "heures", "tous", "rotax_evo_2016", "p. 55")])
add("rotax-2t-oil", "lubricant", "Générique", "Huile 2 temps entièrement synthétique (Rotax)", uses=["Moteurs Rotax evo"], src=["rotax_evo_2016"],
    notes="Mélange 1:50 (2 %) ; 1:33 pendant le rodage, sur les 10 premiers litres.")
add("honda-engine-oil", "lubricant", "Générique", "Huile moteur SAE 10W-30 API SJ (Honda GX)", uses=["Honda GX160 (0,58 L)", "Honda GX200 (0,6 L)"], src=["honda_gx"],
    maintenance=[mnt("Huile moteur", "Contrôler le niveau", "avant chaque utilisation", None, "tous", "honda_gx", "p. 7-8"),
                 mnt("Huile moteur", "Première vidange", 20, "heures", "tous", "honda_gx", "p. 19")])
add("sp98-e5", "fuel", "Générique", "Essence SP98-E5", uses=["IAME Eurocup"], src=["eurocup_2026"])

# Filtres, échappement, refroidissement
add("rotax-air-filter", "filter", "Rotax", "Filtre à air (moteurs evo)", uses=["Rotax 125 MAX evo", "DD2"], src=["rotax_evo_2016", "rotax_dd2_2024"], maintenance=[
    mnt("Filtre à air", "Nettoyer et huiler, remplacer s'il est abîmé", 10, "heures", "tous", "rotax_evo_2016", "p. 55"),
    mnt("Filtre à air", "Kit de nettoyage après chaque séance sous la pluie", "après chaque séance sous la pluie", None, "tous", "rotax_dd2_2024", "ch. 4 p. 8"),
])
add("rotax-fuel-filter", "filter", "Rotax", "Filtre à essence (moteurs evo)", uses=["Rotax 125 MAX evo"], src=["rotax_evo_2016"], maintenance=[
    mnt("Filtre à essence", "Contrôler la propreté", 2, "heures", "tous", "rotax_evo_2016", "p. 55"),
    mnt("Filtre à essence", "Remplacer (au moins une fois par an)", 50, "heures", "tous", "rotax_evo_2016", "p. 55"),
])
add("rotax-muffler-wool", "exhaust", "Rotax", "Laine du silencieux d'échappement", uses=["Rotax 125 MAX evo", "DD2"], src=["rotax_evo_2016"], maintenance=[
    mnt("Silencieux d'échappement", "Remplacer la matière amortissante", 10, "heures", "tous", "rotax_evo_2016", "p. 55"),
    mnt("Échappement", "Graisser contre la corrosion", "après chaque roulage", None, "tous", "rotax_evo_2016", "p. 55"),
])
add("iame-x30-exhaust", "exhaust", "IAME", "Échappement X30", uses=["IAME X30"], src=["iame_x30"], maintenance=[
    mnt("Échappement", "Ouvrir et contrôler les perçages", "10 à 15", "heures", "tous", "iame_x30", "p. 7")])
add("vortex-exhaust", "exhaust", "Vortex", "Échappement ROK GP / Mini ROK", uses=["Vortex ROK GP", "Mini ROK"], src=["vortex_rokgp"], maintenance=[
    mnt("Échappement", "Nettoyage intérieur", 10, "heures", "tous", "vortex_rokgp", "§5.1 p. 28")])
add("rotax-water-pump", "cooling", "Rotax", "Pompe à eau (moteurs evo)", uses=["Rotax 125 MAX evo"], src=["rotax_evo_2016"], maintenance=[
    mnt("Pompe à eau", "Contrôler l'absence d'huile ou d'eau au trou témoin du carter", "avant chaque roulage", None, "tous", "rotax_evo_2016", "p. 55")])
add("iame-x30-cooling", "cooling", "IAME", "Circuit de refroidissement X30", specs={"water_temp_c": "45 à 65"}, uses=["IAME X30"], src=["iame_x30"],
    notes="Température de fonctionnement 45 à 65 °C.")


# ======================================================================= SORTIE
def finalize() -> list[dict]:
    out = []
    for e in ITEMS.values():
        if not e["brand"] or not e["name"]:
            # Fiche existante en base complétée seulement : le nom vient de la base.
            e["brand"] = e["brand"] or None
            e["name"] = e["name"] or None
        e["category_label"] = CATEGORY_LABELS[e["category"]]
        e["in_db_seed"] = e["id"] in DB_IDS
        e["source_types"] = sorted({SRC[k][2] for k in e["sources"]})
        e["sources"] = [{"key": k, "label": SRC[k][0], "url": SRC[k][1], "type": SRC[k][2]} for k in e["sources"]]
        out.append(e)
    out.sort(key=lambda e: (list(CATEGORY_LABELS).index(e["category"]), (e["brand"] or "").lower(), (e["name"] or "").lower()))
    return out


def sql(items: list[dict]) -> str:
    """Migration : catégories élargies + fiches du catalogue (à appliquer après validation)."""
    cats = ", ".join(f"'{c}'" for c in CATEGORY_LABELS)
    q = lambda s: "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"
    lines = [
        "-- Apex AI : base des composants 2026-2027 (générée par scripts/composants/catalog.py)",
        "-- Élargit les catégories et ajoute les fiches sourcées. Les lignes existantes gardent",
        "-- leur nom ; leurs specs sont complétées (sources, entretien, usages).",
        "ALTER TABLE public.kart_components DROP CONSTRAINT IF EXISTS kart_components_category_check;",
        f"ALTER TABLE public.kart_components ADD CONSTRAINT kart_components_category_check CHECK (category IN ({cats}));",
        "ALTER TABLE public.kart_components DROP CONSTRAINT IF EXISTS kart_components_life_unit_check;",
        "ALTER TABLE public.kart_components ADD CONSTRAINT kart_components_life_unit_check CHECK (life_unit IN ('hours','laps','sessions','litres'));",
        "",
    ]
    for e in items:
        extra = {k: e[k] for k in ("uses", "aliases", "homologation", "notes", "maintenance", "season") if e[k]}
        extra["sources"] = [s["key"] for s in e["sources"]]
        specs = json.dumps({**e["specs"], **extra}, ensure_ascii=False)
        if e["in_db_seed"]:
            sets = [f"specs = specs || {q(specs)}::jsonb"]
            if e["default_life"] is not None:
                sets.append(f"default_life = {e['default_life']}, life_unit = {q(e['life_unit'])}")
            lines.append(f"UPDATE public.kart_components SET {', '.join(sets)} WHERE id = {q(e['id'])};")
        else:
            life = "NULL" if e["default_life"] is None else e["default_life"]
            lines.append(
                "INSERT INTO public.kart_components (id, category, brand, name, subcategory, default_life, life_unit, specs) VALUES "
                f"({q(e['id'])}, {q(e['category'])}, {q(e['brand'])}, {q(e['name'])}, {q(e['subcategory'])}, {life}, {q(e['life_unit'])}, {q(specs)}::jsonb) "
                "ON CONFLICT (id) DO NOTHING;"
            )
    return "\n".join(lines) + "\n"


def main() -> None:
    items = finalize()
    payload = {"season": SEASON, "categories": CATEGORY_LABELS, "components": items}
    payload["version"] = hashlib.sha1(json.dumps(items, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("component_catalog.json")
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(sql(items), encoding="utf-8")
    by_cat: dict[str, int] = {}
    for e in items:
        by_cat[e["category"]] = by_cat.get(e["category"], 0) + 1
    print(f"{len(items)} fiches", by_cat)
    incomplete = [e["id"] for e in items if not e["name"] and not e["in_db_seed"]]
    if incomplete:
        raise SystemExit(f"Fiches sans nom hors base : {incomplete}")


if __name__ == "__main__":
    main()
