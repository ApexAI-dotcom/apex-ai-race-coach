#!/usr/bin/env python3
"""
Calendrier éditorial Instagram d'ApexAI, semaines 1 à 4 (J1 = lundi 12 octobre 2026).

  python3 calendrier.py <dossier apex-social>
  → out/04-calendrier/calendrier.csv (séparateur ;, UTF-8 avec BOM, s'ouvre tel quel dans Excel)
  → out/04-calendrier/calendrier.md

Pour décaler tout le calendrier, change J1 ci-dessous : toutes les dates suivent.
"""
import csv
import datetime as dt
import os
import sys

J1 = dt.date(2026, 10, 12)
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def utm(path: str, medium: str, content: str) -> str:
    # v2 : posts et stories renvoient vers l'inscription gratuite (l'analyse sans compte reste sur le site)
    if medium == "social" or path == "upload":
        path = "login?mode=signup"
    sep = "&" if "?" in path else "?"
    return f"https://apexai.racing/{path}{sep}utm_source=instagram&utm_medium={medium}&utm_campaign=lancement&utm_content={content}"


def d(n: int) -> dt.date:
    """Jour n du lancement (n = 1 → J1)."""
    return J1 + dt.timedelta(days=n - 1)


def fdate(x: dt.date) -> str:
    jour = "1er" if x.day == 1 else str(x.day)
    return f"{JOURS[x.weekday()]} {jour} {MOIS[x.month - 1]}"


# (jour n, heure, emplacement, série, id, accroche, fichiers, légende, lien, sticker, objectif, statut, notes)
L = "01-lancement/"
S = "02-stories-j1/"
A = "03-a-la-une/"
W2 = "04-calendrier/semaine-2/"
ROWS = [
    # ---------------- Semaine 1 : lancement ----------------
    (1, "07:30", "Story ×11 → À la une", "À la une", "AL", "Les 6 « À la une » : Démo, Tuto, Conseils, Offres, FAQ, Histoire",
     A + "ouverture-demo.png, tuto-01→03.png, ouverture-conseils.png, ouverture-offres.png, faq-01→04.png, ouverture-histoire.png",
     "—", "—", "—", "Profil complet dès la 1re visite", "Prêt",
     "À publier avant tout post : le compte n'a encore aucun abonné, personne n'est dérangé. Crée ensuite les 6 À la une avec les couvertures de 00-profil/a-la-une/ (détail dans 00-profil/profil.md)."),
    (1, "08:30", "Fil · post 4:5", "Manifeste", "G9", "Ton chrono te dit combien. Jamais pourquoi.", L + "G9-pourquoi/G9.png",
     L + "G9-pourquoi/caption.md", "—", "—", "Poser la promesse", "Prêt", "1er post publié = dernière case de la grille (en bas à droite)."),
    (1, "09:00", "Fil · carrousel 6", "Dans l'app", "G8", "Ton kart. Tes réglages. Ta saison.", L + "G8-carnet/G8-01→06.png",
     L + "G8-carnet/caption.md", utm("pricing", "social", "g8"), "—", "Montrer l'étendue de l'app", "Prêt", ""),
    (1, "09:30", "Reel 13,5 s", "La data ne ment pas", "G7", "+0,51 s. Sur un seul tour.", L + "G7-delta/G7-delta.mp4 (couverture : cover.png)",
     L + "G7-delta/caption.md", utm("upload", "social", "g7"), "—", "Accroche data", "Prêt",
     "Couverture : importer cover.png. « Afficher aussi dans le fil » activé. Pas de musique ajoutée : le son est déjà mixé."),
    (1, "10:00", "Fil · carrousel 7", "Mythe ou data", "G6", "Freiner plus tard = plus rapide ? Pas toujours.", L + "G6-mythe-ou-data/G6-01→07.png",
     L + "G6-mythe-ou-data/caption.md", "—", "—", "Enregistrements", "Prêt", ""),
    (1, "10:30", "Fil · carrousel 6", "Lire sa data", "G5", "71/100 : ton pilotage, noté sur 100.", L + "G5-score/G5-01→06.png",
     L + "G5-score/caption.md", utm("upload", "social", "g5"), "—", "Expliquer le score", "Prêt", ""),
    (1, "11:00", "Reel 14 s", "Dans l'app", "G4", "Ton meilleur tour n'est pas ton meilleur tour.", L + "G4-tour-parfait/G4-tour-parfait.mp4 (couverture : cover.png)",
     L + "G4-tour-parfait/caption.md", utm("upload", "social", "g4"), "—", "Effet « waouh » produit", "Prêt", "Même réglages que G7."),
    (1, "13:30", "Fil · carrousel 5", "Offres", "G3", "Commence gratuitement.", L + "G3-offres/G3-01→05.png",
     L + "G3-offres/caption.md", utm("login?mode=signup", "social", "g3"), "—", "Inscriptions", "Prêt", "Épingler juste après publication (1er épinglage)."),
    (1, "14:00", "Fil · carrousel 7", "Tuto", "G2", "Du CSV au conseil, en 3 étapes.", L + "G2-comment-ca-marche/G2-01→07.png",
     L + "G2-comment-ca-marche/caption.md", utm("upload", "social", "g2"), "—", "Lever le frein « c'est compliqué »", "Prêt", "Épingler (2e épinglage)."),
    (1, "18:45", "Reel 24 s", "Manifeste", "G1", "Où perds-tu tes dixièmes ?", L + "G1-manifeste/G1-manifeste.mp4 (couverture : cover.png)",
     L + "G1-manifeste/caption.md", utm("upload", "social", "g1"), "—", "Le film de lancement", "Prêt",
     "Épingler en dernier : il passe 1er. La rangée épinglée forme le panorama G1 · G2 · G3."),
    (1, "19:00", "Story", "Lancement", "S1", "Nouveau sur Instagram.", S + "S1.mp4", "—", "—", "Mention @apexai.racing (déjà dans le visuel)", "Annoncer le compte", "Prêt", "Ajouter ensuite à l'À la une « Histoire »."),
    (1, "19:02", "Story", "Lancement", "G1-story", "Partage du reel G1", "Bouton Partager du reel → Ajouter à la story", "—", "—", "—", "Pousser le film", "En direct", ""),
    (1, "19:05", "Story", "Démo", "S3", "De ton CSV à ton score.", S + "S3.mp4", "—", "—", "—", "Montrer le produit", "Prêt", "Ajouter à l'À la une « Démo »."),
    (1, "19:08", "Story", "Offres", "S5", "Ton karting. Une seule app.", S + "S5.png (S5-guide.png = repère de placement)",
     "—", utm("upload", "story", "s5"), "Lien « S'inscrire » dans la zone pointillée", "Inscriptions", "Prêt", "Ajouter à l'À la une « Offres »."),
    (1, "19:10", "Story", "Sondage", "S2", "Tu regardes ta data après chaque session ?", S + "S2.png (S2-guide.png = repère)",
     "—", "—", "Sondage : « Oui, toujours » / « Rarement »", "Engagement", "Prêt", ""),
    (1, "19:15", "Partage réseau", "Lancement", "—", "Envoi du lien du profil à ton réseau pilote", "—", "—", "https://instagram.com/apexai.racing", "—", "Premiers abonnés",
     "À faire toi-même", "Groupes WhatsApp de club, contacts pilotes, ton compte perso. Message court et personnel, pas de copier-coller en masse."),
    (2, "12:30", "Story", "Sondage", "S4", "Ton plus gros point faible ?", S + "S4.png (S4-guide.png = repère)", "—", "—",
     "Sondage à 3 options : « Freinage » / « Vitesse en courbe » / « Régularité »", "Sujets des prochains posts", "Prêt", ""),
    (2, "19:00", "Story", "Démo", "G4-story", "Partage du reel G4", "Partage natif du reel", "—", "—", "—", "Rappel produit", "En direct", ""),
    (3, "19:00", "Story", "Tuto", "G2-story", "Partage du carrousel G2", "Partage natif du post", "—", utm("upload", "story", "g2-story"), "Lien « S'inscrire »", "Inscriptions", "En direct", ""),
    (4, "12:30", "Story", "FAQ", "S6", "Compatible MyChron 5 et 6.", S + "S6.png (S6-guide.png = repère)", "—", "—",
     "Boîte à questions : « Ton boîtier ? Ta question ? »", "Récolter les questions", "Prêt", "Ajouter à l'À la une « FAQ ». Réponses en story avec le gabarit T-Story."),
    (5, "18:00", "Story", "Sondage", "S4-résultat", "Résultat du sondage S4", "Gabarit T-Story (Remotion) ou capture du résultat", "—", "—", "—", "Boucler la boucle", "À produire",
     "Annonce : « On décrypte ça la semaine prochaine. » Le résultat oriente le choix entre les briefs des semaines 3 et 4."),
    (5, "18:05", "Story", "Offres", "WE-1", "Tu roules ce week-end ? Garde ton CSV et inscris-toi.", "Gabarit T-Story", "—", utm("upload", "story", "we-1"), "Lien « S'inscrire »", "Clics", "À produire", ""),
    (6, "—", "Story (option)", "Terrain", "—", "Photo réelle en piste, si tu roules", "Photo smartphone", "—", "—", "—", "Authenticité", "Option", "Jamais de visage ni de nom de pilote sans accord écrit."),
    # ---------------- Semaine 2 ----------------
    (8, "19:00", "Fil · carrousel 6", "Virage décrypté", "S2-lundi", "Virage décrypté #1 : virage 10, 2,9 km/h à reprendre.", W2 + "virage-decrypte-1/VD1-01→06.png",
     W2 + "virage-decrypte-1/caption.md", utm("upload", "social", "s2-vd1"), "—", "Enregistrements", "Prêt", ""),
    (8, "19:05", "Story", "Virage décrypté", "VD1-story", "Partage du carrousel + sondage", "Partage natif", "—", "—", "Sondage : « Tu freines dégressif ? » Oui / C'est quoi ?", "Engagement", "En direct", ""),
    (9, "12:30", "Story", "FAQ", "Q-1", "Réponse à une question reçue (S6)", "Gabarit T-Story", "—", "—", "—", "Montrer qu'on répond", "À produire", ""),
    (10, "19:00", "Fil · carrousel 5", "Dans l'app", "S2-mercredi", "Dans l'app : Mon Kart.", W2 + "dans-l-app-mon-kart/MK-01→05.png",
     W2 + "dans-l-app-mon-kart/caption.md", utm("pricing", "social", "s2-mk"), "—", "Valeur du plan Racer", "Prêt", ""),
    (10, "19:05", "Story", "Dans l'app", "MK-story", "Partage du carrousel Mon Kart", "Partage natif", "—", utm("pricing", "story", "mk-story"), "Lien « Voir Racer »", "Clics vers /pricing", "En direct", ""),
    (11, "12:30", "Story", "FAQ", "Q-2", "Boîte à questions « Ta question data ? »", "Gabarit T-Story", "—", "—", "Boîte à questions", "Sujets", "À produire", ""),
    (12, "18:00", "Reel 13 s", "La data ne ment pas", "S2-vendredi", "La data ne ment pas #1 : 3,33 s entre ton pire et ton meilleur tour.",
     W2 + "la-data-ne-ment-pas-1/la-data-ne-ment-pas-1.mp4 (couverture : cover.png)", W2 + "la-data-ne-ment-pas-1/caption.md",
     utm("upload", "social", "s2-dnmp"), "—", "Portée", "Prêt", ""),
    (12, "18:05", "Story", "Offres", "WE-2", "Tu roules ce week-end ? Inscris-toi et essaie.", "Gabarit T-Story", "—", utm("upload", "story", "we-2"), "Lien", "Clics", "À produire", ""),
    # ---------------- Semaine 3 (briefs) ----------------
    (15, "19:00", "Fil · carrousel", "Lire sa data", "S3-lundi", "Lire sa data #1 : le Delta Temps", "Brief B1", "À rédiger depuis le brief", utm("upload", "social", "s3-delta"), "—", "Pédagogie", "Brief", "Voir briefs-semaines-3-4.md"),
    (17, "19:00", "Fil · carrousel", "Dans l'app", "S3-mercredi", "Dans l'app : comparer deux sessions", "Brief B2", "À rédiger depuis le brief", utm("upload", "social", "s3-compare"), "—", "Valeur produit", "Brief", ""),
    (19, "18:00", "Reel ou carrousel", "Mythe ou data", "S3-vendredi", "Mythe ou data #2 : la vitesse de pointe fait-elle le meilleur tour ?", "Brief B3", "À rédiger depuis le brief", utm("upload", "social", "s3-vmax"), "—", "Portée", "Brief", ""),
    # ---------------- Semaine 4 (briefs) ----------------
    (22, "19:00", "Fil · carrousel", "Lire sa data", "S4-lundi", "Lire sa data #2 : la trace de vitesse", "Brief B4", "À rédiger depuis le brief", utm("upload", "social", "s4-trace"), "—", "Pédagogie", "Brief", ""),
    (24, "19:00", "Fil · carrousel", "Dans l'app", "S4-mercredi", "Dans l'app : le rapport PDF", "Brief B5", "À rédiger depuis le brief", utm("pricing", "social", "s4-pdf"), "—", "Valeur produit", "Brief", "Vérifier d'abord quel plan débloque l'export PDF."),
    (26, "18:00", "Fil · carrousel", "Prépa week-end", "S4-vendredi", "Prépa week-end : la check-list data", "Brief B6", "À rédiger depuis le brief", utm("upload", "social", "s4-checklist"), "—", "Enregistrements", "Brief", ""),
]

HEAD = ["Date", "Jour", "Heure", "Emplacement", "Série", "ID", "Accroche", "Fichier(s) dans out/", "Légende", "Lien (UTM)", "Sticker", "Objectif", "Statut", "Notes"]


def main(root: str) -> None:
    out = os.path.join(root, "out", "04-calendrier")
    os.makedirs(out, exist_ok=True)
    rows = []
    for n, h, place, serie, pid, hook, files, cap, link, sticker, goal, status, notes in ROWS:
        day = d(n)
        rows.append([day.isoformat(), fdate(day), h, place, serie, pid, hook, files, cap, link, sticker, goal, status, notes])
    with open(os.path.join(out, "calendrier.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(HEAD)
        w.writerows(rows)

    md = [
        "# Calendrier éditorial Instagram · 4 semaines",
        "",
        f"J1 = {fdate(J1)} {J1.year}. Tout le calendrier se décale en changeant `J1` dans `scripts/social/calendrier.py`.",
        "Version tableur : `calendrier.csv` (s'ouvre dans Excel, séparateur point-virgule).",
        "",
        "## Rythme",
        "",
        "- **Fil** : lundi 19 h, mercredi 19 h, vendredi 18 h (veille des week-ends de roulage).",
        "- **Stories** : 4 à 6 par semaine, à 12 h 30 ou 19 h. Chaque post du fil est repartagé en story dans l'heure.",
        "- **Séries récurrentes** : Lire sa data · Virage décrypté · Mythe ou data · Dans l'app · La data ne ment pas · Prépa week-end.",
        "- Après chaque publication : 15 minutes de présence (répondre aux commentaires, aux messages, liker les réponses).",
        "",
    ]
    weeks = [(1, 7, "Semaine 1 · lancement"), (8, 14, "Semaine 2 · fichiers prêts"), (15, 21, "Semaine 3 · briefs"), (22, 28, "Semaine 4 · briefs")]
    for a, b, title in weeks:
        md += [f"## {title} ({fdate(d(a))} → {fdate(d(b))})", "", "| Date | Heure | Emplacement | ID | Accroche | Statut |", "|---|---|---|---|---|---|"]
        for r, raw in zip(rows, ROWS):
            if a <= raw[0] <= b:
                md.append(f"| {r[1]} | {r[2]} | {r[3]} | {r[5]} | {r[6]} | {r[12]} |")
        md.append("")
    md += [
        "## Détails par ligne",
        "",
        "Fichiers, légendes, liens UTM, stickers et notes : voir `calendrier.csv` (une ligne par publication).",
        "Les légendes prêtes à coller sont dans chaque dossier de post (`caption.md`) et réunies dans `out/legendes.md`.",
        "",
    ]
    open(os.path.join(out, "calendrier.md"), "w", encoding="utf-8").write("\n".join(md))
    print(f"{len(rows)} lignes → {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
