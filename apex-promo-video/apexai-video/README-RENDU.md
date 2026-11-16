# ApexAI — film promo en motion design (Remotion)

Deux montages muets (musique et effets à ajouter au montage, repères fournis), réalisés en Remotion avec la charte du site (noir / rouge #FF4242 / orange #FF9933), les vraies données de télémétrie (circuit d'Adria, tours 4 et 9) et les écrans de l'app recréés en vectoriel.

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `apexai-promo-16x9.mp4` | Master · 1920 × 1080 · 60 i/s · 46,0 s (2760 images) · H.264 CRF 16 · yuv420p BT.709 · 222 Mo · muet |
| `apexai-promo-9x16.mp4` | Master · 1080 × 1920 · 60 i/s · 24,0 s (1440 images) · H.264 CRF 16 · yuv420p BT.709 · 119 Mo · muet |
| `apexai-promo-16x9-web.mp4`, `apexai-promo-9x16-web.mp4` | Copies légères pour prévisualiser ou envoyer (CRF 21, 29 Mo et 17 Mo), visuellement quasi identiques au master |
| `thumbnail-1280x720.png` | Vignette (YouTube, LinkedIn, site) |
| `cue-sheet-16x9.csv`, `cue-sheet-9x16.csv` | Repères son : scène, seconde, image, timecode, type, description, fichier attendu (séparateur « ; », s'ouvre dans Excel FR) |
| `qa-16x9.png`, `qa-9x16.png` | Planches de contrôle (images aux secondes du §13 du prompt ; milieu de chaque scène en 9:16, zone sûre en bleu) |

## Relancer les rendus

```bash
cd apexai-video
npm install
npx remotion studio                       # prévisualiser et ajuster
npx remotion render ApexAI-16x9 out/apexai-promo-16x9.mp4 --codec=h264 --crf=16 --image-format=png --pixel-format=yuv420p --color-space=bt709
npx remotion render ApexAI-9x16 out/apexai-promo-9x16.mp4 --codec=h264 --crf=16 --image-format=png --pixel-format=yuv420p --color-space=bt709
npx remotion still Thumbnail out/thumbnail-1280x720.png
node scripts/export-cuesheets.mjs         # régénère les deux cue sheets
npx remotion ffprobe out/apexai-promo-16x9.mp4
```

- Sous macOS / Linux, `./scripts/render-all.sh` enchaîne tout. Sous Windows, lance les commandes une par une dans PowerShell.
- Aperçu rapide : ajoute `--scale=0.5`, ou passe `FPS = 30` dans `src/config.ts` (toutes les durées sont en secondes, rien d'autre à changer).
- `--image-format=png` (images intermédiaires sans perte) et `--color-space=bt709` donnent un vrai yuv420p en plage vidéo, lu à l'identique partout. Sans ces options, Remotion passe par du JPEG et sort du yuvj420p.
- Temps de rendu mesuré ici, sur 2 cœurs : 23 min pour le 16:9 et 12 min pour le 9:16. Une machine de bureau va nettement plus vite (`--concurrency` = nombre de cœurs).
- Copie légère : `npx remotion ffmpeg -i out/apexai-promo-16x9.mp4 -c:v libx264 -preset slow -crf 21 -maxrate 9M -bufsize 18M -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart -an out/apexai-promo-16x9-web.mp4`.

## Réglages (`src/config.ts`)

| Flag | Défaut | Effet |
|---|---|---|
| `useCircuitPhoto` | `false` | Photo aérienne de nuit en ouverture du duel. Désactivée pour ce premier film, à ta demande. |
| `debugGrid` | `false` | Timecode, scène, temps musicaux, zones sûres 9:16 en surimpression. |
| `withAudio` | `false` | Monte `public/audio/music.mp3`. |
| `musicOffsetSec` | `0` | Instant du drop dans la piste − 10,0 s. Le 16:9 cale le drop à 10,00 s, le 9:16 à 6,00 s, automatiquement. |
| `withSfx` + `sfxAvailable` | `false`, `[]` | Joue `public/sfx/<nom>.mp3` à chaque repère ; liste dans `sfxAvailable` les noms réellement déposés (colonne « Fichier SFX attendu » des cue sheets). |

## Brief musique

Électro hybride moderne (tech-house ou trap hybride), 120 BPM, tonalité mineure.

- **16:9 (46 s)** : intro tendue 0–10 s (pulsation sub, hi-hats façon chronomètre) · **drop à 10,00** · groove 10–39 s · break filtré passe-bas 39,00–41,50 · **hit final à 42,00** · queue et fondu 45–46 s.
- **9:16 (24 s)** : même piste en version courte · **drop à 6,00** · **break à 20,50** · **hit à 22,00** · fondu 23,60–24,00.
- Banques : Artlist, Epidemic Sound, Musicbed, Uppbeat. Vérifier que la licence couvre la publicité.
- Tous les temps forts tombent sur la grille à 120 BPM (un temps = 0,5 s) : un monteur son peut caler la piste sans toucher à l'image.

## Organisation du code

```
src/
  config.ts  timeline.ts  theme.ts  fonts.ts      réglages, découpage en secondes, tokens de la charte, polices locales
  lib/anim.ts                                     helpers en temps absolu (prog, kf, reveal, springAt, wobble)
  lib/track.ts                                    télémétrie : tracé, virages, écart T9 − T4, couleurs de vitesse de l'app
  components/                                     Atmosphere, Camera3D, TrackMap, Logo, fx (Words, DecodeText…), Cursor, Marquee3D, DirBlur
  ui/                                             écrans de l'app recréés (import, analyse, score, Tour Parfait IA, coaching, graphiques, Mon Kart…)
  scenes/                                         16:9 — S01 à S14 (S15 = fondu dans la composition)
  scenes916/                                      9:16 — V01 à V08
  compositions/                                   Promo16x9, Promo9x16, Thumbnail
  audio/                                          cues.json (repères), cues.ts, Soundtrack.tsx (optionnel)
scripts/export-cuesheets.mjs  scripts/render-all.sh  scripts/make-grain.mjs
```

## Rapport QA

**Vérifié**

- Fichiers (ffprobe) : 16:9 = H.264, 1920 × 1080, 60/1, 2760 images, 46,000 s, yuv420p, plage tv, BT.709 ; 9:16 = H.264, 1080 × 1920, 60/1, 1440 images, 24,000 s, yuv420p, BT.709. Couleurs vérifiées au pixel près contre un rendu PNG de référence (rouge du panneau : 253, 68, 63 contre 253, 71, 65).
- Temps forts : 16:9 à 10,00 (drop, flash rouge de 3 images à 9,97), 39,00 (break) et 42,00 (hit) ; 9:16 à 6,00, 20,50 et 22,00. Tous sur la grille à 120 BPM.
- Coupes franches seulement aux temps forts autorisés (10,00 et 42,00 ; 6,00 et 22,00 en 9:16). Toutes les autres transitions sont des raccords : zoom à travers l'icône, panneau rouge qui devient la carte d'import, plongée dans le bouton, whips avec le même vecteur d'entrée, plongée dans 49.680s, plongée sur le virage 10 avec la même caméra, traversée des graphiques, recul du bento. Les transitions ont été vérifiées image par image pour ne laisser aucun « trou » noir.
- Caméra jamais figée : dérive lente (bruit déterministe) sur chaque plan.
- Liste `forbidden` : aucune stat de la landing, aucun témoignage, ni compteur d'analyses, score moyen ou meilleur score, badge, prénom ou e-mail, nom du pilote du CSV, marque tierce (hors MyChron, AiM, RaceBox), Bilan Poids, roadmap ou prix. Le mur de captures de la carte de fin n'utilise que 6 captures d'analyse. Les captures Tableau de bord (compteurs du compte), Mon Kart (marques), accueil (prénom + badge) et profil sont exclues.
- Chiffres : tous issus de `ui-data.json` ou `adria-lap.json`.
  - Score : 71/100, tuiles 20/30 · 16/25 · 20/25 · 15/20.
  - Stats : 49.680s, 118.7 km/h, 1.15 s, 3.33 s.
  - Tour Parfait IA : 49.68s → 48.45s, −1.23s.
  - Duel : écart réel T9 − T4 qui monte jusqu'à +0,51 s.
  - Coaching : virage 10, 2.9 km/h, 0.27 s.
- Zone sûre 9:16 : x ∈ [80, 940], y ∈ [260, 1480], contrôlée sur chaque scène (cadre bleu de `qa-9x16.png`).
- Déterminisme : l'image 1500 rendue deux fois donne deux fichiers identiques (même empreinte SHA-256).
- Fidélité de l'interface : chaque écran recréé a été comparé à sa capture de référence (couleurs, rayons, espacements, typographie, textes exacts).

**Écarts au storyboard, et pourquoi**

1. **Pas de photo de circuit**, à ta demande. Le duel s'ouvre sur le tracé qui se dessine (tête lumineuse), plan serré puis recul caméra.
2. **9:16 en scènes dédiées** (`src/scenes916`) plutôt qu'une prop `layout` sur chaque scène 16:9. Mêmes composants, données et effets, sans risque de dérégler le 16:9 déjà calé.
3. **9:16 : cartes de 860 px au lieu de 960 px.** À 960 px, elles sortiraient de la zone sûre (x 80–940), et la zone sûre prime.
4. **9:16 : tailles de texte.** Les phrases sont à 100–112 px quand la largeur le permet. « tu l'as déjà roulé. » (V06) est à 76 px, car elle ne tient pas en 860 px à 100 px.
5. **9:16 : ajouts pour remplir le cadre vertical.**
   - V05 : les 4 cartes de stats (2 × 2) sous le score.
   - V07 : la carte Priorité 2, atténuée, sous la Priorité 1, pour illustrer « Classés par temps perdu ».
6. **Flou de mouvement :** flou directionnel (SVG) sur les whips et les plongées, au lieu de `CameraMotionBlur`. Avec 8 échantillons, ce dernier multiplierait le temps de rendu par 8, pour une lecture identique à 60 i/s.
7. **Ajustements ≤ 0,1 s** (autorisés par le prompt), pour la lisibilité ou pour éviter des images vides entre deux scènes :
   - HUD → titre de S02 à 6,05 ;
   - décodage de V03 à 7,02, qui attend que le zoom couvre l'écran ;
   - traversée des graphiques de S11 de 35,40 à 36,06 ;
   - texte de S13 à 39,02.
   - Hors timing : la plongée de S08 est recentrée sur la valeur 49.680s.
8. **Polices locales** (Space Grotesk, Inter en woff2, via `@remotion/fonts`) : rendu identique hors ligne.
9. **Carte de fin :** le mur en perspective utilise des captures PNG de l'app (et non des composants animés), limitées aux 6 captures autorisées.
10. **Schéma « Mon Kart »** (S12) redessiné en SVG d'après la capture de l'app.

## Ne pas toucher

`apex-ai-fresh/`, `backend/` et `input/` n'ont pas été modifiés. Tout le film vit dans `apex-promo-video/`.
