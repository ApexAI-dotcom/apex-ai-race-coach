# ApexAI · kit Instagram de lancement

Tout ce qu'il faut pour lancer le compte demain matin et tenir les 4 premières semaines : identité, 9 posts de lancement, stories, « À la une », semaine 2 prête, briefs des semaines 3-4, pubs, son, gabarits pour la suite.

## Le dossier

```
apex-social/
├── README-SOCIAL.md            ← ce fichier
├── PROMPT_DA_CM_APEXAI.md      ← le cahier des charges de départ
├── brand/
│   ├── charte-reseaux-apexai.pdf   la charte (10 pages) : logo, couleurs, typo, formats, motion, ton
│   ├── boards/                     les mêmes pages en PNG
│   └── logo/                       logo en SVG + PNG 256 à 4096 px (icône, horizontal, vertical, mono, filigrane) + sting/ (logo animé avec son)
└── out/
    ├── 00-profil/          avatars, couvertures des À la une, profil.md (identifiant, nom, bio, liens, épinglés)
    ├── 01-lancement/       G1 à G9 : un dossier par post, avec visuels, vidéo et caption.md (légende + texte alternatif)
    ├── 02-stories-j1/      S1 à S6 (S1 et S3 en vidéo) + versions « -guide » qui montrent où poser les stickers
    ├── 03-a-la-une/        les 11 stories des À la une (Démo, Tuto, Conseils, Offres, FAQ, Histoire)
    ├── 04-calendrier/      calendrier 4 semaines (.md et .csv pour Excel), semaine 2 prête, briefs semaines 3-4
    ├── 05-pub/             3 créas publicitaires + textes et ciblage (à lire avant toute dépense)
    ├── 06-videos-sonorisees/   le film 16:9 avec son (version web 60 i/s) ; le 9:16 est G1-manifeste.mp4
    ├── 07-son/             signature sonore, bibliothèque de 38 sons, repères de chaque mixage (cues-*-doux.json = v2)
    ├── qa/                 contrôles : maquette du profil, synchro son/image, rapport-qa.md
    ├── legendes.md         toutes les légendes, dans l'ordre de publication
    └── playbook-cm.md      voix, règles de vérité, réponses types, routine, chiffres à suivre
```

## Demain matin : la check-list du J1

Détail heure par heure : `out/04-calendrier/calendrier.md`. Réglages du profil : `out/00-profil/profil.md`.

1. **Avant 7 h 30** : compte professionnel Entreprise, identifiant, nom, catégorie, photo (`avatar-rouge-1080.png`), bio, 3 liens.
2. **7 h 30** : publier les 11 stories de `03-a-la-une/` (personne ne te suit encore, personne n'est dérangé), puis créer les 6 À la une avec leurs couvertures (`00-profil/a-la-une/`).
3. **8 h 30 → 11 h**, une publication toutes les 30 min : **G9, G8, G7, G6, G5, G4**.
4. **13 h 30** : **G3**, puis épingle-le. **14 h** : **G2**, épingle-le.
5. **18 h 45** : **G1** (le film), épingle-le en dernier. La rangée du haut devient le panorama G1 · G2 · G3.
6. **19 h** : stories S1 → partage de G1 → S3 → S5 (sticker lien) → S2 (sondage). Ajoute S1, S3 et S5 à leurs À la une.
7. **19 h 15** : envoie le lien du compte à ton réseau pilote, personnellement.
8. **Le soir** : réponds à chaque commentaire et message (modèles dans `playbook-cm.md`).

Ordre important : on publie du dernier au premier (G9 → G1), parce qu'Instagram affiche le plus récent en haut.

## Publier chaque format

- **Carrousel** : importer les images dans l'ordre des numéros (01, 02…). Format 4:5 : vérifier que l'aperçu n'est pas recadré en carré.
- **Reel** : importer le `.mp4` du dossier, **pas de musique ajoutée** (le son est mixé dedans), couverture = `cover.png` du dossier, « Afficher aussi dans le fil » activé.
- **Légende** : copier le bloc de `caption.md` (les espaces insécables de la typographie française sont déjà dedans).
- **Texte alternatif** : Paramètres avancés → Accessibilité → Écrire un texte alternatif, puis coller celui de `caption.md`.
- **Stories avec sticker** : publier l'image normale, poser le sticker là où la version `-guide` montre le cadre pointillé. Lien du sticker S5 : dans `calendrier.csv`.

## Les vidéos et le son

Toutes les vidéos sont sonorisées, en version v2 « douce » : une nappe feutrée, quelques souffles sur les transitions, un impact discret sur les chiffres clés et la signature sonore de 2 s sur chaque logo. Deux à cinq fois moins de sons qu'en v1, toujours espacés d'au moins 0,9 s, aigus adoucis. Niveau : −16 LUFS, crête −1,2 dBTP.

⚠️ **À écouter au casque et sur ton téléphone avant de publier** : je ne peux pas entendre le résultat moi-même. Les planches `out/qa/synchro/` montrent la forme d'onde calée sur l'image, repère par repère.

| Vidéo | Fichier | Durée |
|---|---|---|
| G1 · le film | `01-lancement/G1-manifeste/G1-manifeste.mp4` | 24 s |
| G4 · Tour Parfait IA | `01-lancement/G4-tour-parfait/G4-tour-parfait.mp4` | 14 s |
| G7 · le delta | `01-lancement/G7-delta/G7-delta.mp4` | 13,5 s |
| La data ne ment pas #1 | `04-calendrier/semaine-2/la-data-ne-ment-pas-1/la-data-ne-ment-pas-1.mp4` | 13 s |
| Stories S1, S3 | `02-stories-j1/S1.mp4`, `S3.mp4` | 6 s, 8,5 s |
| Logo animé | `brand/logo/sting/` (9:16 et 1:1) | 2,5 s |
| Pubs | `05-pub/pub-1-g1-15s.mp4`, `pub-2-g4-tour-parfait.mp4` | 15 s, 14 s |

Les exports Instagram sont en 1080 × 1920, 30 images/s. Les sources Remotion sont en 60 images/s : pour une version 60 i/s, relancer le rendu (ci-dessous).

## Créer les prochains visuels (gabarits Remotion)

Même qualité que les posts du lancement, sans Canva. Tout est dans `apex-promo-video/apexai-video/` (les films d'origine ne sont pas modifiés).

**Une fois** (PowerShell) :

```powershell
cd "$HOME\Desktop\ApexAI\apex-promo-video\apexai-video"
npm install
```

**Le Studio** (éditer à la souris, voir le résultat en direct) :

```powershell
npx remotion studio
```

Dans la colonne de gauche, dossier **Gabarits** :

| Gabarit | Pour |
|---|---|
| T-Carrousel | un carrousel complet (couverture, étapes, chiffres, comparaisons, offre, appel à l'action) |
| T-Couverture | une couverture de post ou de carrousel |
| T-ChiffreHeros | un chiffre + une leçon (« La data ne ment pas ») |
| T-Conseil | un virage décrypté (zoom sur le virage, gain) |
| T-Declaration | un post texte sur aplat rouge (type G9) |
| T-Story | une story, avec zone de sticker (sondage, question, lien) |
| T-CouvertureReel | la couverture d'un reel |
| T-Offre | un plan et son prix |

Modifie les champs dans le panneau de droite (Props), puis **Render** en haut à droite. Dans les textes : `*mot*` = mot-clé en dégradé, `\n` = retour à la ligne, `[vert]…[/vert]` / `[rouge]…[/rouge]` = chiffre gagné / perdu.

**En ligne de commande**, depuis un fichier de réglages (exemple : copie `src/social/posts/G6-mythe-ou-data.json` et modifie-le) :

```powershell
# un carrousel → une image PNG par slide
npx remotion render T-Carrousel out\mon-carrousel --props=mon-carrousel.json --sequence --image-format=png
# une image seule
npx remotion still T-Couverture out\ma-couverture.png --props=ma-couverture.json
# une vidéo (ex. G4)
npx remotion render G4-TourParfait out\g4.mp4 --crf=16
```

**Le son d'un nouveau reel** (Python 3 + ffmpeg) :

```powershell
pip install numpy scipy soundfile pyloudnorm pedalboard
python scripts\social\sfx\mix.py reperes.json --root "$HOME\Desktop\ApexAI\apex-social" --wav son.wav --video video-muette.mp4 --mux video-son.mp4 --ig video-instagram.mp4
```

`reperes.json` liste les sons et leurs instants (exemples dans `out/07-son/mixes/cues-*.json`, sons disponibles dans `out/07-son/sfx/`).

## Règles à ne jamais oublier

Message : tout ton karting dans une seule app ; appel à l'action : « Inscris-toi gratuitement et essaie ». Chaque chiffre vient de l'app, avec « Session de démo · Adria Karting Raceway ». Pas de chiffres d'utilisateurs, pas de faux avis, pas de promesse de gain. Prix : 1 analyse offerte sans compte, Rookie 0 €, Racer 9,90 €/mois. Marques : MyChron 5/6 et Race Studio seulement, avec la mention AiM. Le détail est dans `out/playbook-cm.md` et `brand/charte-reseaux-apexai.pdf`.

## Ce qui attend ta validation

Liste complète dans `out/qa/rapport-qa.md` : identifiant, boîtiers compatibles, date du J1, musique, et les corrections du site à faire avant la pub.
