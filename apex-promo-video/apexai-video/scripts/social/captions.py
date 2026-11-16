#!/usr/bin/env python3
"""
Légendes, textes alternatifs, hashtags et liens des publications ApexAI.
Écrit caption.md dans chaque dossier de post, legendes.md (ordre de publication) et vérifie les longueurs.

  python3 scripts/social/captions.py <dossier apex-social>
"""
import os
import re
import sys

ROOT = os.path.abspath(sys.argv[1])
OUT = os.path.join(ROOT, "out")

UTM = "https://apexai.racing/{path}?utm_source=instagram&utm_medium=social&utm_campaign=lancement&utm_content={content}"


def nbsp(s: str) -> str:
    """Espace insécable (U+00A0) avant ? ! : ; dans les légendes Instagram."""
    s = re.sub(r"[   ]+([?!;:])(?=\s|$)", " \\1", s)
    s = s.replace("« ", "« ").replace(" »", " »")
    return s


POSTS = [
    {
        "id": "G9",
        "dir": "01-lancement/G9-pourquoi",
        "format": "Post unique 4:5 (aplat rouge)",
        "files": ["G9.png"],
        "caption": """Ton chrono te dit combien. Jamais pourquoi.

Après chaque session, le data logger enregistre tout : vitesse, freinage, trajectoire. Mais lire ces courbes demande du temps et de l'expérience.

ApexAI les lit à ta place et te répond virage par virage, en clair : où tu perds du temps, combien, et quoi changer.

Projet distingué par le 1er prix du 36h Chrono (PÉPITE Provence).

Abonne-toi : on te montre ici comment lire ta data, session après session.""",
        "hashtags": ["#karting", "#kartingfrance", "#motorsport", "#apexairacing"],
        "alt": "Visuel rouge avec le texte « Ton chrono te dit combien. Jamais pourquoi. » encadré de repères de construction, et le logo ApexAI.",
        "cta": "Abonne-toi pour la suite",
        "link": None,
    },
    {
        "id": "G8",
        "dir": "01-lancement/G8-carnet",
        "format": "Carrousel 4:5, 6 slides",
        "files": [f"G8-0{i}.png" for i in range(1, 7)],
        "caption": """Ton kart. Tes réglages. Ta saison.

ApexAI ne s'arrête pas à l'analyse de tes tours :
• Mon Kart suit l'état de ton kart : heures moteur, tours de pneus et de freins, chaîne, avec une alerte quand une limite approche.
• Le Carnet d'Ingénieur Digital garde tes réglages circuit par circuit, avec des recommandations.
• Le calendrier réunit courses, entraînements et échéances d'inscription.

Tout est au même endroit.

Passe Racer pour 9,90 €/mois : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#kartracing", "#apexairacing"],
        "alt": "Carrousel de six visuels montrant les écrans Mon Kart, compteurs d'usure, Carnet d'Ingénieur Digital et calendrier de l'app ApexAI, avec des données de démonstration.",
        "cta": "Passe Racer, 9,90 €/mois",
        "link": UTM.format(path="pricing", content="g8"),
    },
    {
        "id": "G7",
        "dir": "01-lancement/G7-delta",
        "format": "Reel 9:16, 13,5 s",
        "files": ["G7-delta.mp4", "cover.png"],
        "caption": """+0,51 s. Sur un seul tour.

Deux tours de la même session de démo à Adria, superposés : le tour 9 perd 0,51 s sur le tour 4, dont 0,28 s rien qu'au virage 2. Le chrono te donne l'écart. ApexAI te montre où il se crée.

Sur toute la session, l'analyse classe ensuite chaque virage par temps perdu. En tête : le virage 10, avec 0,27 s par tour à reprendre en relâchant les freins plus progressivement à l'inscription.

→ Trouve où tu perds tes dixièmes : 1re analyse offerte, sans compte, lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#mychron", "#telemetrie", "#apexairacing"],
        "alt": "Vidéo : deux tours de démonstration s'affrontent sur la carte du circuit d'Adria et finissent à 0,51 seconde d'écart, la caméra plonge sur le virage 2 où le tour 9 perd 0,28 seconde, puis les conseils de coaching des virages 10 et 6 apparaissent.",
        "cta": "Trouve où tu perds tes dixièmes",
        "link": UTM.format(path="upload", content="g7"),
    },
    {
        "id": "G6",
        "dir": "01-lancement/G6-mythe-ou-data",
        "format": "Carrousel 4:5, 7 slides",
        "files": [f"G6-0{i}.png" for i in range(1, 8)],
        "caption": """Freiner plus tard = plus rapide ? Pas toujours.

Sur cette session de démo à Adria, au virage 6, le pilote déclenche son freinage à 17 m de l'apex. Son passage le plus rapide à cet endroit freinait à 43 m : 26 m plus tôt, et pourtant plus rapide sur la portion.

Pourquoi ? Freiner plus tôt laisse le temps de relâcher les freins avant l'inscription. Le kart ressort mieux placé, et c'est la sortie qui paie sur la ligne droite suivante.

Gain mesuré : 0,16 s par tour.

Enregistre ce post pour ta prochaine session.""",
        "hashtags": ["#karting", "#kartingfrance", "#freinage", "#telemetrie", "#apexairacing"],
        "alt": "Carrousel « Mythe ou data » : au virage 6 de la session de démo, le passage le plus rapide freinait à 43 mètres de l'apex contre 17 mètres pour le tour étudié.",
        "cta": "Enregistre-le pour ta prochaine session",
        "link": None,
    },
    {
        "id": "G5",
        "dir": "01-lancement/G5-score",
        "format": "Carrousel 4:5, 6 slides (couverture rouge)",
        "files": [f"G5-0{i}.png" for i in range(1, 7)],
        "caption": """71/100 : ton pilotage, noté sur 100.

Le score ApexAI additionne 4 critères, mesurés sur tes propres tours :
• Précision Apex (/30) : l'écart entre tes points de corde d'un tour à l'autre.
• Régularité (/25) : tes corrections de volant brusques et la variation de ta courbe.
• Vitesse Apex (/25) : ta vitesse au point de corde, comparée au potentiel du virage.
• Temps Secteurs (/20) : le potentiel de tes secteurs.

Ici, une session de démo à Adria. Swipe pour voir quoi travailler sur chaque critère.

→ Obtiens ton score : 1re analyse offerte, sans compte, lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#mychron", "#racingdata", "#apexairacing"],
        "alt": "Carrousel qui explique le score de pilotage ApexAI : 71 sur 100 sur une session de démo, détaillé en Précision Apex 20/30, Régularité 16/25, Vitesse Apex 20/25 et Temps Secteurs 15/20.",
        "cta": "Obtiens ton score",
        "link": UTM.format(path="upload", content="g5"),
    },
    {
        "id": "G4",
        "dir": "01-lancement/G4-tour-parfait",
        "format": "Reel 9:16, 14 s",
        "files": ["G4-tour-parfait.mp4", "cover.png"],
        "caption": """Ton meilleur tour n'est pas ton meilleur tour.

Sur cette session de démo à Adria, le meilleur tour tombe en 49,68 s. En enchaînant les meilleurs mini-secteurs de la session, l'IA trouve un tour à 48,45 s.

Ces 1,23 s, le pilote les a déjà faites. Juste jamais dans le même tour.

C'est le Tour Parfait IA : il te montre où tu as déjà été rapide, pour que tu le refasses partout.

→ 1re analyse offerte, sans compte : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#mychron", "#telemetrie", "#apexairacing"],
        "alt": "Vidéo : la trace du circuit d'Adria se dessine en couleurs de vitesse, les meilleurs mini-secteurs s'allument et forment le Tour Parfait IA, 1,23 seconde plus rapide que le meilleur tour de la session de démo.",
        "cta": "Découvre ton tour idéal",
        "link": UTM.format(path="upload", content="g4"),
    },
    {
        "id": "G3",
        "dir": "01-lancement/G3-offres",
        "format": "Carrousel 4:5, 5 slides (épinglé, panorama 3/3)",
        "files": [f"G3-0{i}.png" for i in range(1, 6)],
        "caption": """Commence gratuitement.

• Sans compte : 1 analyse offerte, pour voir ce que ta télémétrie raconte.
• Rookie, 0 € : 3 analyses par mois, 1 circuit mémorisé, score global sur 100 et 2 conseils de coaching IA.
• Racer, 9,90 €/mois : analyses illimitées, tous les circuits, tous les graphiques, score par virage, Mon Kart et recommandations de réglages (ou 99 €/an).

Tu roules souvent et tu fais des courses ? Racer est fait pour toi. Tu découvres ? Commence par l'analyse offerte.

Crée ton compte gratuit : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#mychron", "#apexairacing"],
        "alt": "Carrousel des offres ApexAI : une analyse offerte sans compte, le plan Rookie gratuit et le plan Racer à 9,90 euros par mois.",
        "cta": "Crée ton compte gratuit",
        "link": UTM.format(path="login", content="g3").replace("login?", "login?mode=signup&"),
    },
    {
        "id": "G2",
        "dir": "01-lancement/G2-comment-ca-marche",
        "format": "Carrousel 4:5, 7 slides (épinglé, panorama 2/3)",
        "files": [f"G2-0{i}.png" for i in range(1, 8)],
        "caption": """Du CSV au conseil, en 3 étapes.

1. Exporte ta session en CSV depuis Race Studio (MyChron 5 ou 6).
2. Importe-la sur apexai.racing.
3. Lis ton analyse : score sur 100, Tour Parfait IA et conseils classés par temps perdu, virage par virage.

Pas besoin d'être ingénieur : les conseils sont écrits en clair.

→ Essaie sur ta dernière session, la 1re analyse est offerte et sans compte : lien en bio.

MyChron et Race Studio sont des marques d'AiM. ApexAI n'est pas affilié à AiM.""",
        "hashtags": ["#karting", "#mychron", "#telemetrie", "#kartingfrance", "#apexairacing"],
        "alt": "Carrousel en sept visuels : exporter son CSV depuis Race Studio, l'importer sur apexai.racing, puis lire le score sur 100 et les conseils de coaching ; compatibilité MyChron 5 et 6.",
        "cta": "Essaie sur ta dernière session",
        "link": UTM.format(path="upload", content="g2"),
    },
    {
        "id": "G1",
        "dir": "01-lancement/G1-manifeste",
        "format": "Reel 9:16, 24 s (le film, sonorisé ; épinglé, panorama 1/3)",
        "files": ["G1-manifeste.mp4", "cover.png"],
        "caption": """Où perds-tu tes dixièmes ?

Ton chrono te dit combien. Jamais pourquoi.

ApexAI lit la télémétrie de ton MyChron à ta place : score de pilotage sur 100, Tour Parfait IA et conseils classés par temps réellement perdu, virage par virage.

Ici, une session de démo à Adria : le duel entre deux tours, le score, le Tour Parfait IA et un conseil virage par virage.

→ 1re analyse offerte, sans compte : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#mychron", "#telemetrie", "#apexairacing"],
        "alt": "Vidéo de présentation d'ApexAI : un tour de démonstration sur le circuit d'Adria, le duel entre deux tours, le score de pilotage sur 100, le Tour Parfait IA et un conseil de coaching au virage 10.",
        "cta": "Teste sans compte",
        "link": UTM.format(path="upload", content="g1"),
    },
]

WEEK2 = [
    {
        "id": "S2-lundi",
        "dir": "04-calendrier/semaine-2/virage-decrypte-1",
        "format": "Carrousel 4:5, 6 slides",
        "files": [f"VD1-0{i}.png" for i in range(1, 7)],
        "caption": """Virage décrypté #1 : virage 10, 2,9 km/h à reprendre.

Sur cette session de démo à Adria, il manque 2,9 km/h au point de corde du virage 10 : le pilote y passe autour de 55 km/h, alors que son meilleur passage au même endroit approche 58 km/h. La vitesse est atteignable, il l'a déjà faite.

Le geste : relâcher les freins plus progressivement à l'inscription (freinage dégressif, ou trail braking). L'avant reste chargé, le kart tourne sans perdre de vitesse.

Gain mesuré : 0,27 s par tour, rien qu'à cet endroit.

Et toi, ton virage 10 ? 1re analyse offerte, sans compte : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#trajectoire", "#telemetrie", "#apexairacing"],
        "alt": "Carrousel « Virage décrypté » sur le virage 10 de la session de démo : 55 km/h à l'apex contre 58 km/h pour le meilleur passage, et le conseil de freinage dégressif.",
        "cta": "Analyse ta session",
        "link": UTM.format(path="upload", content="s2-vd1"),
    },
    {
        "id": "S2-mercredi",
        "dir": "04-calendrier/semaine-2/dans-l-app-mon-kart",
        "format": "Carrousel 4:5, 5 slides",
        "files": [f"MK-0{i}.png" for i in range(1, 6)],
        "caption": """Dans l'app : Mon Kart.

• Chaque élément a son compteur : heures moteur, tours de pneus et de freins, heures de chaîne.
• Une alerte arrive quand une limite approche.
• Importe les fichiers de ta journée de roulage : ils rejoignent l'historique de ton kart.
• Ta dernière session reste sous surveillance : tension de batterie, température d'échappement.

Mon Kart est inclus dans Racer, à 9,90 €/mois : lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#kartracing", "#apexairacing"],
        "alt": "Carrousel présentant Mon Kart dans ApexAI : schéma du kart, bilan de santé, compteurs d'usure du moteur, des pneus, des freins et de la chaîne, avec des données de démonstration.",
        "cta": "Passe Racer",
        "link": UTM.format(path="pricing", content="s2-mk"),
    },
    {
        "id": "S2-vendredi",
        "dir": "04-calendrier/semaine-2/la-data-ne-ment-pas-1",
        "format": "Reel 9:16, 13 s",
        "files": ["la-data-ne-ment-pas-1.mp4", "cover.png"],
        "caption": """La data ne ment pas #1 : 3,33 s entre ton pire et ton meilleur tour.

Sur cette session de démo à Adria, 3,33 s séparent le tour le plus lent du plus rapide, avec 1,15 s d'écart moyen. Le critère Régularité du score : 16/25.

Avant de chercher le tour parfait, rends tes tours réguliers. C'est la base, et ça se mesure.

→ Mesure ta régularité ce week-end : 1re analyse offerte, sans compte, lien en bio.""",
        "hashtags": ["#karting", "#kartingfrance", "#racingdata", "#mychron", "#apexairacing"],
        "alt": "Vidéo : 3,33 secondes entre le pire et le meilleur tour d'une session de démo, les cartes de statistiques de l'app, puis le critère Régularité du score à 16 sur 25.",
        "cta": "Mesure ta régularité",
        "link": UTM.format(path="upload", content="s2-dnmp"),
    },
]


def first_line(t):
    return t.strip().split("\n")[0]


def words(t):
    return len(re.findall(r"\w+", t))


def write_caption(p):
    cap = nbsp(p["caption"].strip())
    tags = " ".join(p["hashtags"])
    full = f"{cap}\n\n{tags}"
    md = [
        f"# {p['id']} · {p['format']}",
        "",
        "## Fichiers à publier",
        *[f"- `{f}`" for f in p["files"]],
        "",
        "## Légende (à copier telle quelle)",
        "",
        "```",
        full,
        "```",
        "",
        "## Texte alternatif",
        "",
        nbsp(p["alt"]),
        "",
        f"**Appel à l'action :** {nbsp(p['cta'])}  ",
        f"**Lien (bio ou sticker) :** {p['link'] or '— (pas de lien : objectif enregistrement / abonnement)'}",
        "",
    ]
    d = os.path.join(OUT, p["dir"])
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "caption.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    return full


def check(p, full):
    fl = first_line(p["caption"])
    n_tags = len(p["hashtags"])
    w = words(p["caption"])
    issues = []
    if len(fl) > 125:
        issues.append(f"1re ligne {len(fl)} > 125")
    if n_tags > 5:
        issues.append(f"{n_tags} hashtags > 5")
    if not 60 <= w <= 180:
        issues.append(f"{w} mots (cible 60–180)")
    if len(full) > 2200:
        issues.append("légende > 2200 caractères")
    return fl, n_tags, w, issues


def main():
    lines = ["# Légendes et textes alternatifs", "", "Dans l'ordre de publication du J1 (G9 → G1), puis la semaine 2.", ""]
    report = []
    for group, items in (("Lancement (J1)", POSTS), ("Semaine 2", WEEK2)):
        lines += [f"## {group}", ""]
        for p in items:
            full = write_caption(p)
            fl, n_tags, w, issues = check(p, full)
            report.append((p["id"], len(fl), n_tags, w, issues))
            lines += [f"### {p['id']} · {p['format']}", "", "```", full, "```", "", f"*Texte alternatif :* {nbsp(p['alt'])}", "", f"*Lien :* {p['link'] or '—'}", ""]
    with open(os.path.join(OUT, "legendes.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{'post':12s} 1re ligne  #tags  mots  problèmes")
    for pid, fl, nt, w, iss in report:
        print(f"{pid:12s} {fl:9d}  {nt:5d}  {w:4d}  {'; '.join(iss) or 'ok'}")



# ---------------------------------------------------------------------------
# v2 (11 oct.) : positionnement « tout ton karting dans une seule app » et appel à l'action
# « inscris-toi gratuitement et essaie ». L'analyse reste la porte d'entrée ; l'écosystème
# (Mon Kart, entretien, réglages, calendrier) est ce qu'on met en avant.
SIGNUP = lambda content: UTM.format(path="login", content=content).replace("login?", "login?mode=signup&")
CTA = "→ Inscris-toi gratuitement et essaie : lien en bio."
ECO = "Et ce n'est qu'une partie de l'app : entretien de ton kart, réglages circuit par circuit et calendrier de saison t'attendent au même endroit."
V2 = {
    "G9": {
        "caption": """Planning. Réglages. Entretien. Une seule app.

Ton calendrier de courses dans un agenda, tes réglages dans un carnet, l'entretien du moteur sur un coin de feuille, ta data sur l'ordi… Chaque week-end, un pilote de karting jongle avec tout ça.

ApexAI réunit tout au même endroit : Mon Kart pour l'état et l'entretien de ton kart, le Carnet d'Ingénieur Digital pour tes réglages circuit par circuit, le calendrier de ta saison, et l'analyse de tes sessions par l'IA.

Projet distingué par le 1er prix du 36h Chrono (PÉPITE Provence).

""" + CTA,
        "alt": "Visuel rouge avec le texte « Planning. Réglages. Entretien. Une seule app. » encadré de repères de construction, et le logo ApexAI.",
        "cta": "Inscris-toi gratuitement et essaie", "link": SIGNUP("g9"),
    },
    "G8": {
        "caption": """Ton kart. Tes réglages. Ta saison.

Ce que tu notais dans un carnet, sur ton téléphone ou de tête, ApexAI le garde pour toi :
• Mon Kart suit l'état de ton kart : heures moteur, tours de pneus et de freins, chaîne, avec une alerte quand une limite approche.
• Le Carnet d'Ingénieur Digital garde tes réglages circuit par circuit, avec des recommandations.
• Le calendrier réunit courses, entraînements et échéances d'inscription.

Fini les notes éparpillées : tout est au même endroit, à côté de l'analyse de tes sessions.

Mon Kart et les recommandations de réglages sont inclus dans Racer, à 9,90 €/mois.
→ Inscris-toi gratuitement et découvre l'app : lien en bio.""",
        "cta": "Inscris-toi gratuitement et découvre l'app", "link": SIGNUP("g8"),
    },
    "G3": {
        "caption": """Ton karting. Une seule app.

• Rookie, 0 € : inscris-toi et commence avec 3 analyses par mois, le score sur 100 et des conseils de coaching IA.
• Racer, 9,90 €/mois : tout ton karting au même endroit. Analyses illimitées sur tous les circuits, Mon Kart, suivi d'entretien et recommandations de réglages (ou 99 €/an).

Tu roules souvent et tu fais des courses ? Racer est fait pour toi. Tu découvres ? Commence par Rookie, c'est gratuit.

→ Crée ton compte : lien en bio.""",
        "alt": "Carrousel des offres ApexAI : « Ton karting. Une seule app. », le plan Rookie gratuit et le plan Racer à 9,90 euros par mois.",
        "cta": "Crée ton compte", "link": SIGNUP("g3"),
    },
    "G1": {
        "caption": """Où perds-tu tes dixièmes ?

Ton chrono te dit combien. ApexAI te dit pourquoi : score de pilotage sur 100, Tour Parfait IA et conseils virage par virage, à partir de la télémétrie de ton data logger.

Et autour de l'analyse, tout ton karting : l'entretien de ton kart, tes réglages circuit par circuit, ton calendrier de saison. Une seule app.

Ici, une session de démo à Adria : le duel entre deux tours, le score, le Tour Parfait IA et un conseil virage par virage.

""" + CTA,
        "cta": "Inscris-toi gratuitement et essaie", "link": SIGNUP("g1"),
    },
    "S2-mercredi": {
        "caption": """Dans l'app : Mon Kart.

Fini le carnet d'entretien papier.
• Chaque élément a son compteur : heures moteur, tours de pneus et de freins, heures de chaîne.
• Une alerte arrive quand une limite approche.
• Importe les fichiers de ta journée de roulage : ils rejoignent l'historique de ton kart.
• Ta dernière session reste sous surveillance : tension de batterie, température d'échappement.

Mon Kart est inclus dans Racer, à 9,90 €/mois.
→ Inscris-toi gratuitement et découvre l'app : lien en bio.""",
        "cta": "Inscris-toi gratuitement et découvre l'app", "link": SIGNUP("s2-mk"),
    },
}
SWAP = {  # fin de légende : ancien appel à l'action → nouveau
    "G7": ("→ Trouve où tu perds tes dixièmes : 1re analyse offerte, sans compte, lien en bio.", ECO + "\n\n→ Inscris-toi gratuitement et trouve où tu perds tes dixièmes : lien en bio."),
    "G6": ("Enregistre ce post pour ta prochaine session.", "Enregistre ce post pour ta prochaine session. Et pour tout suivre d'une sortie à l'autre, inscris-toi gratuitement : lien en bio."),
    "G5": ("→ Obtiens ton score : 1re analyse offerte, sans compte, lien en bio.", "→ Inscris-toi gratuitement et obtiens ton score : lien en bio."),
    "G4": ("→ 1re analyse offerte, sans compte : lien en bio.", ECO + "\n\n→ Inscris-toi gratuitement et découvre ton tour idéal : lien en bio."),
    "G2": ("→ Essaie sur ta dernière session, la 1re analyse est offerte et sans compte : lien en bio.", "L'analyse, c'est la porte d'entrée. Ensuite, Mon Kart, tes réglages et ton calendrier t'attendent dans la même app.\n\n→ Inscris-toi gratuitement et essaie sur ta dernière session : lien en bio."),
    "S2-lundi": ("Et toi, ton virage 10 ? 1re analyse offerte, sans compte : lien en bio.", "Et toi, ton virage 10 ? Inscris-toi gratuitement et analyse ta session : lien en bio."),
    "S2-vendredi": ("→ Mesure ta régularité ce week-end : 1re analyse offerte, sans compte, lien en bio.", "→ Mesure ta régularité ce week-end : inscris-toi gratuitement, lien en bio."),
}
for _p in POSTS + WEEK2:
    _p.update(V2.get(_p["id"], {}))
    if _p["id"] in SWAP:
        a, b = SWAP[_p["id"]]
        assert a in _p["caption"], (_p["id"], a)
        _p["caption"] = _p["caption"].replace(a, b)
        _p["cta"] = b.split("→ ")[-1].split(" : lien")[0].split(", lien")[0] if "→" in b else "Inscris-toi gratuitement"
        _p["link"] = SIGNUP((_p["link"] or "").split("utm_content=")[-1] or _p["id"].lower())


if __name__ == "__main__":
    main()
