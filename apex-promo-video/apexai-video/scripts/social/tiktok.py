#!/usr/bin/env python3
"""
Kit TikTok d'ApexAI (réutilise le kit Instagram) : légendes, calendrier 2 semaines, profil, README.

  python3 tiktok.py <dossier apex-social>   → out/08-tiktok/
"""
import csv
import os
import re
import sys

CTA = "Inscris-toi gratuitement et essaie, lien en bio."
AIM = "MyChron et Race Studio sont des marques d'AiM. ApexAI n'est pas affilié à AiM."
BASE = ["#karting", "#kartingfrance", "#mychron", "#apexairacing"]


def nbsp(s: str) -> str:
    """Typographie française : espace insécable avant ? ! : ; et dans les « »."""
    s = re.sub(r" ([?!:;»])", " \\1", s)
    return s.replace("« ", "« ")


VIDEOS = [
    {
        "id": "01", "file": "01-tour-parfait.mp4", "src": "05-pub/pub-2-g4-tour-parfait.mp4 (G4, mise en page « zone sûre pub »)", "dur": "14 s",
        "caption": """Ton meilleur tour n'est pas ton meilleur tour.
Session de démo à Adria : en enchaînant ses meilleurs mini-secteurs, l'IA trouve 1,23 s que le pilote a déjà roulées. Jamais dans le même tour.
Ton karting. Une seule app.""",
        "tag": "#telemetrie",
    },
    {
        "id": "02", "file": "02-delta.mp4", "src": "G7, re-rendu (étiquette « Session de démo » remontée)", "dur": "13,5 s",
        "caption": """+0,51 s entre deux tours. Mais où ?
Session de démo à Adria : le tour 9 perd 0,28 s rien qu'au virage 2. Puis l'IA classe tous tes virages par temps perdu.
Et autour : entretien, réglages, calendrier. Ton karting. Une seule app.""",
        "tag": "#pilotage",
    },
    {
        "id": "03", "file": "03-film.mp4", "src": "G1, le film 24 s", "dur": "24 s",
        "caption": """Ton chrono te dit combien. ApexAI te dit pourquoi.
Score sur 100, Tour Parfait IA, conseils virage par virage (session de démo à Adria). Et l'entretien de ton kart, tes réglages, ton calendrier.
Ton karting. Une seule app.""",
        "tag": "#motorsport",
    },
    {
        "id": "04", "file": "04-csv-au-score.mp4", "src": "S3, story « De ton CSV à ton score »", "dur": "8,5 s",
        "caption": """De ton CSV à ton score.
Exporte ta session depuis Race Studio, importe-la, lis ta note sur 100 (ici 71/100, session de démo à Adria).
Ton karting. Une seule app.""",
        "tag": "#racingdata",
    },
    {
        "id": "05", "file": "05-regularite.mp4", "src": "La data ne ment pas #1, re-rendu (étiquette remontée)", "dur": "13 s",
        "caption": """3,33 s entre ton pire et ton meilleur tour.
Session de démo à Adria : régularité notée 16/25. Avant de chercher le tour parfait, rends tes tours réguliers.
Ton karting. Une seule app.""",
        "tag": "#pilotage",
    },
    {
        "id": "06", "file": "06-film-15s.mp4", "src": "05-pub/pub-1-g1-15s.mp4 (le film, version courte)", "dur": "14,6 s",
        "caption": """Où perds-tu tes dixièmes ?
ApexAI lit ta session et te répond virage par virage (démo : Adria). Et il garde tout le reste : entretien, réglages, calendrier.
Ton karting. Une seule app.""",
        "tag": "#telemetrie",
    },
]
REPOSTS = [
    {"id": "07", "text": "Republication de la vidéo de la semaine 1 la plus enregistrée ou partagée (statistiques TikTok), avec une nouvelle 1re ligne :",
     "hooks": {"01": "Le tour que tu as déjà roulé… en morceaux.", "02": "0,28 s perdues dans un seul virage.", "03": "Ton karting tient dans une seule app.", "04": "Ton CSV a une note. Tu la connais ?"}},
    {"id": "08", "text": "Republication de la 2e vidéo la plus performante de la semaine 1, même principe (nouvelle 1re ligne ci-dessus)."},
]

# Calendrier : lundi 19 octobre → dimanche 1er novembre 2026 (2 semaines, 4 publications par semaine)
CAL = [
    ("2026-10-19", "lundi 19 octobre", "18:30", "01"),
    ("2026-10-21", "mercredi 21 octobre", "18:30", "02"),
    ("2026-10-23", "vendredi 23 octobre", "18:00", "03"),
    ("2026-10-25", "dimanche 25 octobre", "11:00", "04"),
    ("2026-10-27", "mardi 27 octobre", "18:30", "05"),
    ("2026-10-29", "jeudi 29 octobre", "18:30", "06"),
    ("2026-10-31", "samedi 31 octobre", "11:00", "07"),
    ("2026-11-01", "dimanche 1er novembre", "11:00", "08"),
]
LINK = "https://apexai.racing/login?mode=signup&utm_source=tiktok&utm_medium=social&utm_campaign=lancement&utm_content=bio"


def full(v):
    tags = " ".join(BASE + [v["tag"]])
    return nbsp(f"{v['caption']}\n{CTA}\n{AIM}") + f"\n{tags}"


def main(root):
    out = os.path.join(root, "out", "08-tiktok")
    os.makedirs(out, exist_ok=True)
    by = {v["id"]: v for v in VIDEOS}
    L = ["# Légendes TikTok", "", "Une par vidéo, à coller telle quelle. Accroche en 1re ligne, un seul appel à l'action, 5 hashtags.", ""]
    for v in VIDEOS:
        c = full(v)
        L += [f"## {v['id']} · `{v['file']}` ({v['dur']})", "", "```", c, "```", "", f"*{len(c)} caractères (limite TikTok : 4 000).*", ""]
    L += ["## 07 et 08 · republications (semaine 2)", "", REPOSTS[0]["text"], ""]
    L += [f"- {k} → « {h} »" for k, h in REPOSTS[0]["hooks"].items()]
    L += ["", REPOSTS[1]["text"], "Garde le reste de la légende d'origine.", ""]
    open(os.path.join(out, "legendes-tiktok.md"), "w", encoding="utf-8").write("\n".join(L))

    rows = []
    for iso, day, h, vid in CAL:
        if vid in by:
            v = by[vid]
            rows.append([iso, day, h, vid, v["file"], v["dur"], v["caption"].split("\n")[0], "legendes-tiktok.md §" + vid, "Prête"])
        else:
            rows.append([iso, day, h, vid, "meilleure vidéo de la semaine 1" if vid == "07" else "2e meilleure vidéo de la semaine 1", "—",
                         "Nouvelle 1re ligne (voir légendes §07)", "legendes-tiktok.md §07", "À choisir le samedi 31 selon les statistiques"])
    with open(os.path.join(out, "calendrier-tiktok.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["Date", "Jour", "Heure", "N°", "Fichier", "Durée", "Accroche", "Légende", "Statut"])
        w.writerows(rows)
    M = ["# Calendrier TikTok · 2 semaines", "", "4 vidéos par semaine. Soir en semaine (18 h - 18 h 30), fin de matinée le week-end. Version tableur : `calendrier-tiktok.csv`.", "",
         "| Date | Heure | N° | Vidéo | Accroche | Statut |", "|---|---|---|---|---|---|"]
    M += [f"| {r[1]} | {r[2]} | {r[3]} | `{r[4]}` | {r[6]} | {r[8]} |" for r in rows]
    M += ["", "Après chaque publication : 15 minutes pour répondre aux commentaires (réponses types dans `../playbook-cm.md`)."]
    open(os.path.join(out, "calendrier-tiktok.md"), "w", encoding="utf-8").write("\n".join(M))

    bio = "L'app tout-en-un du pilote de karting.\nInscris-toi gratuitement ↓"
    bio_b = "Entretien, réglages, calendrier, data.\nTon karting. Une seule app ↓"
    P = ["# Profil TikTok", "",
         "| Champ | Valeur |", "|---|---|",
         "| Pseudo | **apexai.racing** (identique à Instagram ; points autorisés, 24 caractères max). Si pris : **apexairacing** |",
         "| Nom | **ApexAI \\| App pilote de karting** (30/30 caractères) |",
         "| Photo | `../00-profil/avatar-rouge-1080.png` |",
         "| Type de compte | **Compte entreprise** (Paramètres → Compte → Passer à un compte entreprise), catégorie la plus proche de « Logiciel / Applications » |",
         f"| Lien | {LINK} |", "",
         f"**Bio (80 caractères max)**, recommandée ({len(bio)} caractères) :", "", "```", bio, "```", "",
         f"Variante ({len(bio_b)} caractères) :", "", "```", bio_b, "```", "",
         "Le lien en bio est cliquable tout de suite avec un compte entreprise (un compte personnel doit attendre 1 000 abonnés).",
         "Sons : le compte entreprise limite la musique à la bibliothèque commerciale ; nos vidéos n'ont que nos effets sonores (son d'origine), donc **n'ajoute aucune musique** à la publication.",
         "Contenu IA : nos vidéos sont du motion design à partir de vraies données, sans personne ni scène réaliste générée par IA : le label « contenu généré par IA » n'est pas requis, laisse-le désactivé."]
    open(os.path.join(out, "profil.md"), "w", encoding="utf-8").write("\n".join(P))

    R = ["# README TikTok", "",
         "1. Envoie-toi ce dossier sur le téléphone (Drive), règle le profil avec `profil.md` (compte entreprise, pseudo, nom, bio, lien, avatar rouge).",
         "2. Pour chaque date de `calendrier-tiktok.md` : **+** → importer la vidéo du jour (n° du fichier = ordre de publication).",
         "3. N'ajoute aucun son ni musique : le son est déjà dans la vidéo. Pas de texte ni sticker en bas de l'écran.",
         "4. Couverture : garde la 1re image (lisible dès le départ) ou choisis l'image du titre.",
         "5. Colle la légende du même n° depuis `legendes-tiktok.md`, laisse « contenu généré par IA » désactivé.",
         "6. Publier, puis 15 min de réponses aux commentaires. Samedi 31 : choisis les 2 vidéos à republier (§07).",
         "Zones sûres contrôlées : `planche-zones-sures.png`. Choix et sources : `rapport-tiktok.md`."]
    open(os.path.join(out, "README-TIKTOK.md"), "w", encoding="utf-8").write("\n".join(R))
    for v in VIDEOS:
        c = full(v)
        assert len(c) < 450, (v["id"], len(c))
    print("ok", len(rows), "dates")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
