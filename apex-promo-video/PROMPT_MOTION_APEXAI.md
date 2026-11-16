# PROMPT — Vidéo motion design ApexAI (Remotion)

> **Pour Yanis :** ouvre Claude Code dans le dossier `Desktop/ApexAI/apex-promo-video/` et envoie :
> « Lis `PROMPT_MOTION_APEXAI.md` en entier et exécute-le. »
> Tout ce qui suit s'adresse à Claude.

---

## 1. Rôle et mission

Tu es directeur artistique motion design senior **et** ingénieur Remotion. Tu produis une vidéo publicitaire de découverte pour **ApexAI** (apexai.racing), une app web qui analyse la télémétrie de karting avec une IA. Elle sert d'ingénieur de course virtuel.

Le niveau attendu est celui d'un studio motion design haut de gamme. Concrètement :
- les mouvements sont fluides et continus, sans coupe sèche hors des temps forts ;
- la typographie est cinétique ;
- l'interface est recréée en vectoriel avec une caméra 3D et de la profondeur de champ ;
- le montage est calé sur une grille musicale.

Le style s'inspire directement de la vidéo de référence fournie (`assets/ref/style/reference-motion.mp4`). Il est transposé dans la charte sombre rouge/orange d'ApexAI.

Tu travailles en autonomie. Il y a **un seul point d'arrêt**, à la fin de la phase 1 (styleframes, voir §13). Si une consigne est techniquement impossible ou dégrade le rendu, prends l'option la plus proche, note-la dans le rapport final et continue.

**Interdit :** modifier quoi que ce soit dans `../apex-ai-fresh/`, `../backend/` ou `../input/`. Ce sont le code de production et les données de Yanis.

---

## 2. Livrables

| Fichier | Spécification |
|---|---|
| `apexai-video/out/apexai-promo-16x9.mp4` | Master : 1920×1080, 60 i/s, 46,0 s (2760 images), H.264 CRF 16, yuv420p |
| `apexai-video/out/apexai-promo-9x16.mp4` | Déclinaison réseaux sociaux : 1080×1920, 60 i/s, 24,0 s (1440 images), mêmes réglages |
| `apexai-video/out/cue-sheet-16x9.csv` et `cue-sheet-9x16.csv` | Feuille de montage son : timecode, image, type (musique/sfx), description, durée |
| `apexai-video/out/stills/` | Styleframes et images de contrôle QA |
| `apexai-video/out/thumbnail-1280x720.png` | Bonus : miniature YouTube/LinkedIn (accroche + carte + logo) |
| `apexai-video/README-RENDU.md` | Comment relancer un rendu, ce que font les réglages de `src/config.ts`, et le rapport QA final |

Les vidéos sont **muettes par défaut** : Yanis posera musique et effets sonores au montage à partir des cue sheets. Si `public/audio/music.mp3` existe, produis en plus `…-avec-son.mp4` (voir §9).

---

## 3. Brief créatif

- **Produit :** l'utilisateur importe le CSV de son data logger (MyChron 5, MyChron 6, AiM, RaceBox). L'IA renvoie :
  - un score de pilotage sur 100 ;
  - un « Tour Parfait IA » (le meilleur tour théorique) ;
  - des conseils classés par temps perdu, virage par virage ;
  - des graphiques (delta, vitesse, radar) ;
  - le suivi du kart, des réglages et du calendrier.
- **Cible :** pilotes de karting en loisir avancé ou en compétition, équipés d'un data logger, et leurs coachs et mécaniciens. Ils connaissent leurs chronos mais ne savent pas où ni pourquoi ils perdent du temps.
- **Angle :** problème → solution. « Où perds-tu tes dixièmes ? » → on rend la perte visible → ApexAI, ton ingénieur de course IA → la démonstration → l'appel à l'action.
- **Ton :** premium, technique, nerveux, précis. Un stand d'ingénieur de course, pas un jeu vidéo. Jamais criard.
- **Langue :** français, tutoiement dans toute la typographie cinétique. Les textes d'interface restent ceux de l'app, même quand ils vouvoient : c'est ce que le prospect verra.
- **Appel à l'action :** « Analyser ma session » · « 1re analyse offerte · sans compte » · **apexai.racing**.

---

## 4. Règles non négociables

### 4.1 Véracité
Tout chiffre affiché vient de `assets/data/ui-data.json` ou de `assets/data/adria-lap.json`. Tu n'inventes **aucune** statistique, aucun témoignage, aucune promesse de résultat chiffrée. La liste `forbidden` de `ui-data.json` est absolue : stats de la landing, témoignages, « Fiabilité 99 % », « 94 % précision », « 127 pilotes », badges Admin/Team, nom et e-mail de l'utilisateur, nom du pilote du CSV, marques tierces hors formats compatibles, prix.

### 4.2 Charte
Uniquement les couleurs, dégradés, polices, rayons et courbes de `assets/brand/tokens.json` :
- fond #0A0A0A, cartes #121212 et #181818, bordures #262626 ;
- rouge #FF4242 → #E60000 ;
- dégradé de mots-clés #FF4242 → #FF9933 ;
- vert de gain #22C55E, or « Tour IA » #FACC15, bleu de comparaison #3B82F6 ;
- polices : Space Grotesk (titres, chiffres, logo) et Inter (interface, sous-textes).

Le logo n'est jamais déformé, recoloré ni espacé. On écrit « APEXAI » sans espace : « APEX » en blanc, « AI » en rouge ou en dégradé.

### 4.3 Référence
La vidéo de référence sert **uniquement** pour le mouvement : rythme, flous, typographie cinétique, caméra, transitions. N'en reprends ni la palette bleue, ni les textes, ni l'interface, ni la marque.

### 4.4 Typographie française
- Espace fine insécable (U+202F) avant « ? ! : ; ».
- Virgule décimale dans la typographie cinétique (« +0,51 s »). Dans l'interface recréée, le format de l'app est conservé (« 0.27s », « 49.68s »).
- On écrit « 1re », pas « 1ère ».

### 4.5 Lisibilité
- Une ligne cinétique reste lisible au moins 0,25 s × nombre de mots + 0,35 s, compté depuis l'apparition de son premier mot.
- 6 mots maximum par ligne cinétique.
- En 16:9 : au plus 2 lignes cinétiques en grand corps et 1 sous-ligne visibles à la fois. En 9:16 : au plus 3 lignes.
- Taille minimale à l'écran d'un texte d'interface censé être lu : 22 px en 16:9, 30 px en 9:16.
- Exception assumée : le montage rythmique de S11 (mots de 1 à 2 mots, un par temps, qui restent empilés à l'écran).

### 4.6 Déterminisme
Tout se déduit de `useCurrentFrame()`. Donc :
- pas de `Math.random` : utilise `random(seed)` de Remotion ;
- pas d'animation ni de transition CSS ;
- pas de `Date.now()`.

---

## 5. Assets fournis (dossier `assets/`)

```
assets/
  brand/
    tokens.json            ← couleurs, dégradés, polices, rayons, ombres, courbes : source de vérité
    apexai-icon.svg        ← icône officielle (carré arrondi dégradé + éclair blanc)
    zap-lucide.svg         ← éclair lucide (celui de la barre de navigation)
  data/
    adria-lap.json         ← tracé RÉEL du circuit (Adria Karting Raceway), calculé depuis la télémétrie GPS
    adria-lap-preview.png  ← aperçu attendu du tracé (couleurs de vitesse et numéros de virages)
    ui-data.json           ← textes et valeurs exacts de chaque écran, plus la liste « forbidden »
  photo/
    circuit-adria-night.jpg ← photo aérienne de nuit fournie par Yanis (droits à confirmer → flag useCircuitPhoto)
  showcase/1..10.webp      ← captures du produit utilisées par le mur 3D du hero du site
  ref/
    screens/ui-01…13-*.png ← captures haute définition des écrans à recréer (source de vérité visuelle)
    screens/rec-01…14-*.png← images clés de l'enregistrement complet de l'app (états intermédiaires)
    style/reference-motion.mp4 ← vidéo de référence de STYLE (32 s, 30 i/s)
    style/planche-01…06.png← planches de la référence, une image toutes les 0,5 s avec timecode
    style/zoom-*.png       ← zooms à 10 i/s sur 4 passages clés de la référence
    code/*.tsx|ts|css      ← copies (lecture seule) des composants de l'app : classes exactes, structure, couleurs
```

### Structure de `adria-lap.json`
- Les coordonnées sont dans une boîte 1000×1000, nord en haut. C'est l'orientation de la « Carte du Circuit » de l'app.
- `pathD` : chemin SVG fermé.
- `points[i] = [x, y, vitesseT4_kmh, tempsT4_s, tempsT9_s, vitesseT9_kmh]` : 440 points à distance égale. T4 est le meilleur tour, T9 le tour de comparaison.
- `corners[]` contient les 12 virages, numérotés comme dans l'app. Pour chacun : `{ n, i, x, y, distM, dir: 'G'|'D', apexKmh, deltaGainS }`.
- `lossSegments[]` : plages d'index où le Tour 9 perd du temps sur le Tour 4.
- `lapTimesS` = { T4 : 49.802, T9 : 50.316 } : temps au tour mesurés par les balises du logger. Ils servent **uniquement** à animer le duel et ne s'affichent jamais. L'app affiche « 49.68s » pour le T4.
- `deltaFinalS` = 0.51 : l'écart à la ligne d'arrivée.
- Delta à l'index i = `points[i][4] − points[i][3]`.

### Code de référence à lire avant de recréer l'interface
- `trackMapColors.ts` : reprends `speedToColor()` à l'identique, avec la coloration par rang percentile.
- `CSVUploader.tsx` : états d'import, d'analyse et de succès, étapes de chargement.
- `MetricsHeader.tsx`, `CoachingAdvice.tsx`, `TrackMapCanvas.tsx`.
- `KartSchematic.tsx`, `KartHealthStatus.tsx`, `WearGauge.tsx`, `TireSetupCard.tsx`, `MonthGrid.tsx`.
- `3d-marquee.tsx` : mur 3D du hero.
- `Navbar.tsx` : logo.
- `tailwind.config.ts` et `index.css`.

---

## 6. Direction artistique

### 6.1 Ce que tu reprends de la référence
Étudie les planches et les zooms, puis la vidéo si nécessaire :
- **0,0–1,6 s :** un mot géant entre avec un fort flou gaussien et un léger zoom arrière. Un dégradé coloré balaie les lettres de gauche à droite puis se pose. Le mot s'efface ensuite lettre par lettre, de la dernière à la première, comme une frappe à l'envers.
- **8,3–10 s :** des lettres brouillées se résolvent en mot. Le mot suivant entre en se resserrant. Le panneau plein écran rétrécit en carte arrondie.
- **14,3–16,2 s :** un balayage de couleur passe sur les mots. Le texte rapetisse, puis un trait se dessine autour et le transforme en titre de carte (raccord texte → interface).
- **20,3–22 s :** l'interface est inclinée en 3D, avec profondeur de champ et un basculement flou vers une section sombre. Un appareil sort du flou et une lumière de balayage le traverse.
- **En permanence :** la caméra ne reste jamais figée (au moins 1 à 2 % de dérive par seconde). Les transitions se chevauchent. Il y a une idée toutes les 1 à 2,5 s, et des mouvements secondaires discrets.

### 6.2 Transposition clair → sombre
La référence est claire avec des taches bleues. ApexAI est **sombre**. On garde la même légèreté avec :
- des **taches lumineuses rouge et orange** qui respirent sur fond #0A0A0A ;
- un grain filmique fin ;
- un vignettage.

Le contraste que la référence obtient en passant au sombre, nous l'obtenons avec **le panneau rouge plein écran** (S05) et les éclats de lumière rouge.

### 6.3 Atmosphère (composant `Atmosphere`, présent sous toutes les scènes)
- **Base :** #0A0A0A (#050505 pour les noirs d'ouverture et de fin).
- **3 taches :**
  - A : #FF4242, rayon 700 px, opacité 0,28, en bas à gauche ;
  - B : #FF9933, rayon 520 px, opacité 0,14, en haut à droite ;
  - C : #E60000, rayon 900 px, opacité 0,18, en bas au centre.
  
  Chacune a un `filter: blur(140px)` et un `mix-blend-mode: screen`. Leur position dérive avec `noise2D` de `@remotion/noise` (amplitude 60 px, vitesse 0,0025 par image). Une prop `intensity` (0–1) règle leur intensité par scène.
- **Grain :** génère une fois `public/textures/grain.png` (bruit monochrome 512×512) avec un script Node. Pose-le en mosaïque, opacité 0,05, avec un décalage pseudo-aléatoire déterministe toutes les 2 images.
- **Vignettage :** `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)`.

### 6.4 Typographie cinétique
- Space Grotesk 700 pour la typo cinétique ; Inter 500 pour les sous-lignes ; labels en Inter 600, capitales, interlettrage 0,2 em.
- Tailles en 16:9 :
  - mot héros : 300 à 400 px ;
  - phrase : 84 à 150 px ;
  - sous-ligne : 34 à 46 px ;
  - label : 20 à 26 px.
- Tailles en 9:16 :
  - mot héros : 360 à 380 px ;
  - phrase : 100 à 130 px ;
  - sous-ligne : 40 à 48 px.
- Interlignage 0,95 à 1,05. Interlettrage −0,02 à −0,04 em pour les grands corps.
- Couleurs : blanc #FAFAFA ; mots-clés en dégradé textPrimary ; gains en #22C55E ; pertes en #FF4242.

### 6.5 Caméra et profondeur
- Chaque plan d'interface est placé dans un conteneur 3D :
  - perspective 1400 à 1800 px ;
  - rotations douces (rotateX 4–14°, rotateY ±4–18°) ;
  - dérive lente.
- Profondeur de champ : un flou de 4 à 10 px sur les calques éloignés (barre de navigation, arrière-plans).
- Le flou de mouvement (`CameraMotionBlur` de `@remotion/motion-blur`, samples 8, shutterAngle 180) est réservé aux plongées et aux whips, uniquement pendant ces images.

---

## 7. Vocabulaire d'animation

Implémente ces effets une seule fois, en composants ou helpers réutilisables (`src/components/fx/`). Easing par défaut : `Easing.bezier(0.16, 1, 0.3, 1)` (outExpo, la courbe de l'app).

| Effet | Spécification |
|---|---|
| **BlurIn** | opacity 0→1, blur 16→0 px, translateY 24→0, scale 1,03→1 ; 0,50 s ; outExpo |
| **BlurOut** | inverse de BlurIn ; 0,35 s ; `Easing.bezier(0.7, 0, 0.84, 0)` |
| **BlurWords / BlurLetters** | BlurIn par mot (décalage 0,08–0,10 s) ou par lettre (0,025–0,035 s) |
| **GradientSweep** | texte en `background-clip: text`, dégradé 100° [#FAFAFA 0 %, #FAFAFA p−25 %, #FF4242 p−8 %, #FF9933 p, #FAFAFA p+20 %], p de −30 % à 130 % en 0,9 s (courbe ios 0.32, 0.72, 0, 1). Les mots-clés finissent en textPrimary |
| **DecodeText** | chaque lettre affiche des glyphes pseudo-aléatoires (jeu « APEXI0123456789/<>#+ ») renouvelés toutes les 3 images pendant 6 à 10 images, puis se fige. Graine : `random(\`${id}-${i}-${Math.floor(frame/3)}\`)`. La largeur de chaque lettre est fixée à celle de la lettre finale (`measureText` de `@remotion/layout-utils`) pour que la ligne ne tremble pas |
| **Underline** | trait #FF4242 de 6 px, radius 3, scaleX 0→1 depuis la gauche, 0,30 s |
| **Counter** | `interpolate` + outExpo, `tabular-nums` ; format FR en typo cinétique, format app dans l'interface |
| **Pop** | `spring({ damping: 14, stiffness: 180, mass: 0.6 })`, scale 0→1 (dépassement ≤ 1,06). Réservé aux pastilles, marqueurs et icônes |
| **LineDraw** | `evolvePath` de `@remotion/paths`. Tête lumineuse : point blanc de 6 px et halo de 18 px, placé avec `getPointAtLength` |
| **Dive (plongée)** | scale ×2,5–3,5 vers un point cible (transform-origin sur ce point), 0,40–0,50 s, outExpo, avec flou de mouvement |
| **Whip** | translation de 1200 à 1600 px en 0,25–0,30 s avec flou de mouvement. La scène suivante arrive avec le même vecteur |
| **BlurDissolve** | la scène sortante passe de blur 0 à 24 px et d'opacity 1 à 0 ; l'entrante fait l'inverse ; chevauchement 0,30 s |
| **ScanLine** | bande horizontale de 90 px, `linear-gradient(transparent, rgba(255,66,66,0.30), transparent)`, mode screen, traverse une carte en 0,8 s |
| **LightSweep** | reflet : bande blanche à 25 %, skewX −20°, largeur 30 %, traversée en 0,45 s |
| **Ripple** | cercle contour #FF4242 de 2 px, scale 0,3→2,2, opacity 0,8→0, 0,45 s |
| **Cursor** | flèche type macOS (blanche, contour noir 1,5 px, ombre douce) à 1,6× ; trajets en Bézier, easing inOut ; clic = scale 0,85 pendant 0,12 s puis Ripple |
| **Flash** | calque #FF4242 à 35–40 % pendant 2 à 3 images, uniquement sur un temps fort (3 fois maximum dans le film) |

Règles :
- Un même élément n'a jamais deux mouvements concurrents.
- Aucun élément n'apparaît ou ne disparaît sans transition, sauf sur les coupes autorisées (10,00 s et 42,00 s).
- Le linéaire est réservé aux dérives.

---

## 8. Grille temporelle et musique

- **Tempo de référence :** 120 BPM. Un temps = 0,5 s = 30 images à 60 i/s ; une mesure = 2 s.
- **Temps forts 16:9 :**
  - 10,00 s : drop, révélation du logo ;
  - 39,00 s : break ;
  - 42,00 s : hit final, carte de fin.
- **Temps forts 9:16 :** 6,00 s (drop), 20,50 s (break), 22,00 s (hit final).
- Les timings du storyboard sont la référence. Tu peux ajuster de ±0,1 s pour la lisibilité, **sans jamais déplacer les temps forts**.
- Toutes les durées sont écrites en secondes dans `src/timeline.ts` et converties avec `s(sec) = Math.round(sec * FPS)`. Le fps reste ainsi modifiable : si le rendu à 60 i/s est trop lent, passer `FPS = 30` dans `config.ts` doit suffire.

---

## 9. Son

Tu ne crées pas de musique. Prévois :
- **Brief musique** (à écrire dans le README) : électro hybride moderne (tech-house ou trap hybride), 120 BPM, tonalité mineure.
  - Intro tendue 0–10 s : pulsation sub et hi-hats façon chronomètre.
  - Drop énergique à 10 s.
  - Groove de 10 à 39 s.
  - Break filtré de 39 à 41,5 s.
  - Hit final à 42 s, queue jusqu'à 46 s.
  
  Banques suggérées : Artlist, Epidemic Sound, Musicbed, Uppbeat. Vérifier que la licence couvre la publicité.
- **Musique optionnelle :** si `public/audio/music.mp3` existe et que `FLAGS.withAudio` est vrai, monte-la avec un décalage `FLAGS.musicOffsetSec` (= instant du drop dans la piste − 10,0) et un fondu de sortie de 45 à 46 s. Utilise l'API de découpe audio de ta version de Remotion (`trimBefore` ou `startFrom`, vérifie avec le skill).
- **Effets sonores optionnels :** `src/audio/cues.ts` liste chaque effet avec son timecode. Si un fichier `public/sfx/<nom>.mp3` du même nom existe, il est joué.
- **Cue sheets :** reprends les lignes « Son » de chaque scène du storyboard et exporte-les en CSV (`out/cue-sheet-*.csv`).

---

## 10. Storyboard 16:9 (1920×1080 · 60 i/s · 46,0 s = 2760 images)

| # | Scène | Début → fin (s) | Images |
|---|---|---|---|
| S01 | Accroche | 0,00 → 3,00 | 0–180 |
| S02 | Le problème rendu visible (duel fantôme) | 3,00 → 7,75 | 180–465 |
| S03 | Le constat | 7,75 → 10,00 | 465–600 |
| S04 | Révélation du logo (DROP) | 10,00 → 12,50 | 600–750 |
| S05 | Positionnement, panneau rouge | 12,50 → 15,00 | 750–900 |
| S06 | Import | 15,00 → 18,00 | 900–1080 |
| S07 | Analyse IA | 18,00 → 20,50 | 1080–1230 |
| S08 | Score | 20,50 → 24,00 | 1230–1440 |
| S09 | Tour Parfait IA | 24,00 → 29,00 | 1440–1740 |
| S10 | Coaching | 29,00 → 33,00 | 1740–1980 |
| S11 | Profondeur des données | 33,00 → 36,00 | 1980–2160 |
| S12 | Écosystème (bento) | 36,00 → 39,00 | 2160–2340 |
| S13 | L'appel (break) | 39,00 → 42,00 | 2340–2520 |
| S14 | Carte de fin et CTA | 42,00 → 45,00 | 2520–2700 |
| S15 | Sortie au noir | 45,00 → 46,00 | 2700–2760 |

Les timecodes ci-dessous sont **absolus**, en secondes.

### S01 — Accroche · 0,00 → 3,00
- **Fond :** noir #050505. L'atmosphère monte de 0 à 35 % d'intensité entre 0,10 et 1,20.
- **0,10 → 0,55 :** « Où » (Space Grotesk 700, 400 px, centré, interlettrage −0,04 em) entre : blur 28→0 px, scale 1,18→1,00, opacity 0→1, outExpo.
  - En même temps, un GradientSweep (#FF4242 → #FF9933) balaie les lettres de 0,10 à 0,90, puis le mot se pose en #FAFAFA. C'est l'équivalent du « What » de la référence.
- **0,55 → 1,00 :** tenue, avec un push-in caméra de 1,00 à 1,03.
- **1,00 → 1,40 :** « Où » rétrécit (scale 1→0,30, courbe ios) et glisse jusqu'à sa place de premier mot de la phrase « Où perds-tu tes dixièmes ? » (Space Grotesk 700, 120 px, centrée). Calcule sa position finale avec `measureText`.
  - À partir de 1,10 : « perds-tu », « tes », « dixièmes ? » entrent en BlurWords (décalage 0,09 s).
- **« dixièmes » :** en dégradé textPrimary. Un Underline se dessine dessous de 1,55 à 1,85 (largeur 40 % du mot, centré), comme sous les titres de section du site. Espace fine insécable avant « ? ».
- **1,85 → 2,70 :** tenue et dérive.
- **2,70 → 3,00 :** BlurOut global (blur 0→24, opacity 1→0, scale 1→0,96).
  - À 2,80, une traînée lumineuse rouge (ligne de 2 px, halo #FF4242 de 18 px, 60 % de la largeur) traverse l'écran de gauche à droite en 0,20 s.
- **Son :** 0,00 nappe sub + hi-hats chrono · 0,10 whoosh doux · 1,10 swish · 2,80 passage de kart (2-temps, effet Doppler) + whoosh.

### S02 — Le problème rendu visible · 3,00 → 7,75
- **3,00 → 4,10 (si `useCircuitPhoto`)**
  - La photo `circuit-adria-night.jpg` occupe tout le cadre : brightness 0,5, saturate 0,85, calque #FF4242 à 8 % en overlay, vignettage fort.
  - Push-in de 1,08 à 1,14 avec un léger glissement horizontal.
  - Mise au point : blur 12→0 px de 3,00 à 3,40.
  - Sans photo : la bande d'asphalte vectorielle apparaît dès 3,00, à la même échelle.
- **3,90 → 4,30 :** la photo se dissout (blur 0→20, opacity 1→0,12). La carte vectorielle (`TrackMap`, boîte 1000 → 860 px de haut, centrée) entre en BlurIn.
  - Asphalte : trait #161616 de largeur 36 (unités du viewBox), sur un liseré rgba(255,255,255,0,07) de largeur 40.
  - Caméra 3D sur toute la scène, courbe inOut : perspective 1600, rotateX 38°→24°, rotateZ −8°→−3°, scale 0,94→1,04.
  - À 4,15, le label « ADRIA KARTING RACEWAY » (Inter 600, 22 px, interlettrage 0,24 em, #999) entre en BlurIn en haut à gauche (x 120, y 110).
- **4,10 → 6,10 : DUEL FANTÔME (données réelles)**
  - Le temps de course τ va de 0 à 50,32 s (`lapTimesS.T9`) en 2,00 s d'écran, en linéaire avec une accélération de 0,15 s au départ.
  - Le point T4 franchit la ligne à τ = 49,80 s, s'y arrête et pulse ; le point T9 la franchit 0,51 s de course plus tard. À l'écran, le point bleu suit le rouge à 20–50 px : c'est la poursuite.
  - Point Tour 4 : disque de 9 px #FF4242 avec un halo de 22 px. Point Tour 9 : idem en #3B82F6. Positions interpolées depuis `points[i][3]` pour T4 et `points[i][4]` pour T9 (recherche binaire sur le temps).
  - Derrière le point T4, la trace se dessine en blanc à 70 % (largeur 4), avec une tête lumineuse.
  - Quand le point T9 traverse un `lossSegment`, ce segment s'allume en #FF4242 (largeur 10, halo 16 px) et reste allumé à 90 %. On voit où le temps file.
  - Les marqueurs de virage 1 → 12 apparaissent en Pop quand le point T4 atteint `corners[n].i`. Style : disque #0A0A0A, contour #FF4242 de 2 px, numéro blanc en Inter 700, petit triangle blanc au-dessus.
  - **HUD en haut à droite** (x 1460–1800, y 120) :
    - label « ÉCART T9 / T4 » (Inter 600, 20 px, interlettrage 0,2 em, #999) ;
    - valeur live = `points[i9][4] − points[i9][3]`, en « +0,00 s » (Space Grotesk 700, 84 px, tabular-nums). Elle est en #FF4242 quand elle augmente, en #FAFAFA sinon. Quand T9 franchit la ligne, elle se fige sur `deltaFinalS` : « +0,51 s ».
  - **Légende en bas à gauche :** « ● Tour 4 (meilleur) » et « ● Tour 9 » (Inter 500, 24 px).
- **6,00 :** sur le temps fort, les segments rouges pulsent une fois (halo ×1,6 puis retour, 0,3 s).
- **6,05 → 6,40 : raccord HUD → titre.** La valeur « +0,51 s » quitte le coin, grandit de 84 à 150 px, passe en dégradé textPrimary et se pose en bas au centre, sur un dégradé noir.
  - En même temps, la caméra recule (scale →0,98, rotateX →18°).
  - À 6,10, « Sur un seul tour. » (Inter 500, 46 px, #FAFAFA à 85 %) entre en BlurWords sous le chiffre.
- **7,50 → 7,75 :** la carte bascule (rotateX +12°, blur →20, opacity →0), puis BlurDissolve vers S03.
- **Son :** 3,00 impact grave + ambiance de circuit de nuit · 4,10–6,10 un tick par virage (12) et une tonalité qui monte avec le delta · 6,00 impact · 7,50 whoosh inversé.

### S03 — Le constat · 7,75 → 10,00
- **Fond :** atmosphère faible (intensity 0,18), composition centrée.
- **7,80 :** « Ton chrono te dit combien. » (Space Grotesk 700, 92 px) en BlurWords (décalage 0,08 s).
- **8,60 :** la ligne 1 monte de 80 px et passe à 35 % d'opacité (courbe ios, 0,4 s).
  - « Jamais pourquoi. » (Space Grotesk 700, 132 px) entre en BlurIn avec un GradientSweep. « pourquoi » reste en textPrimary.
- **8,95 → 9,80 :** montée en tension : push-in de 1,00 à 1,10 en accélérant, taches de 0,18 à 0,75, grain +50 %.
- **9,80 → 10,00 :** tout se contracte vers le centre (scale →0,85, blur →30, opacity →0). Flash de 3 images à 9,97. **Coupe franche autorisée à 10,00.**
- **Son :** riser de 7,75 à 10,00, chronomètre qui accélère, 2 images de silence juste avant 10,00.

### S04 — Révélation du logo (DROP) · 10,00 → 12,50
- **Fond :** #0A0A0A. Une tache rouge en bas à gauche et une orange en haut à droite dérivent, comme les coins bleus de la référence.
  - Grille de construction : 2 lignes horizontales et 2 verticales en pointillés (1 px, rgba(255,255,255,0,14), tirets 5/5) encadrent le logo et filent jusqu'aux bords.
  - 4 poignées carrées de 7 px (#FAFAFA à 60 %) aux intersections, façon sélection Figma.
  - Tracé du centre vers l'extérieur de 10,00 à 10,40 (outExpo).
- **10,00 :** icône (carré de 140 px, radius 26, dégradé primary, ombre glowPrimaryStrong) en `spring({ damping: 12, stiffness: 170, mass: 0.7 })` : scale 0→1 et rotation −14°→0.
  - L'éclair blanc se trace en contour de 10,05 à 10,25, puis se remplit de 10,25 à 10,35.
- **10,20 :** « APEX » (Space Grotesk 700, 150 px, #FAFAFA) : les lettres montent d'un masque (y +60→0, décalage 0,035 s).
- **10,45 :** « AI » en DecodeText, qui se pose en dégradé textPrimary.
- **10,90 :** un LightSweep traverse tout le logo.
- **10,95 :** la pastille « Propulsé par l'IA », précédée de l'icône Zap de lucide (pas d'emoji), entre en BlurIn au-dessus du logo. Style du hero du site : fond rgba(255,66,66,0,10), bordure rgba(255,66,66,0,30), texte #FF4242 en Inter 500 26 px, forme pilule.
- **11,40 → 11,90 :** les pointillés défilent puis s'effacent ; les poignées disparaissent.
- **12,00 → 12,50 : transition signature.** Le carré rouge de l'icône grandit jusqu'à remplir l'écran (scale ×22 centré sur l'icône, 0,45 s, accélération, flou de mouvement court). Le logotype et la pastille partent en blur. L'écran devient le panneau rouge de S05.
- **Son :** 10,00 impact + shimmer · 10,45 blip glitch · 12,00 whoosh profond.

### S05 — Positionnement · 12,50 → 15,00
- **Fond :** plein écran en dégradé primary (#FF4242 → #E60000, 135°), avec un reflet radial #FF9933 à 25 % (900 px) qui dérive et un grain visible.
- **12,55 → 13,30 :** « Ton ingénieur » (Space Grotesk 700, 124 px, blanc) en DecodeText avec flou par lettre (décalage 0,03 s).
- **13,30 → 13,75 :** « de course IA » complète la ligne : l'interlettrage passe de 0,35 em à −0,02 em pendant l'apparition, comme « assistant » qui se resserre dans la référence.
- **13,85 → 14,55 :** le panneau rétrécit en carte (courbe ios, 0,7 s).
  - scale 1→0,64 ; radius 0→28 px.
  - Le fond #0A0A0A apparaît autour, avec les taches ; contour 1 px rgba(255,255,255,0,18).
  - Le texte suit la carte.
- **14,55 → 15,00 : raccord.** La carte rouge vire au #121212. Le texte se fond (crossfade flou) en « Analysez votre session », le titre d'interface. La carte devient la carte d'import de S06, à la même position et à la même taille.
- **Son :** 12,55 chirps de décodage · 13,85 swoosh · 14,55 tick d'interface.

### S06 — Import · 15,00 → 18,00
- **Mise en page :** texte à gauche (x 130–700) ; interface à droite (x 720–1840) en 3D (perspective 1600, rotateY −14°→−7°, rotateX 8°→5°).
- **Interface** (fidèle à `ui-03`, `rec-01`, `rec-02`) :
  - barre de navigation en haut, floutée à 4 px ;
  - titre « Analysez votre session » et sous-titre ;
  - carte #121212, bordure #262626, radius 16 ;
  - zone de dépôt en pointillés 2 px #333, radius 12, avec l'icône d'upload, « Glissez votre fichier CSV ici » et « ou cliquez pour sélectionner » ;
  - pastilles « MyChron 5 · MyChron 6 · AiM · RaceBox ».
- **Texte à gauche :**
  - 15,15 « Importe » (Space Grotesk 700, 104 px) ;
  - 15,35 « ta session. » en dégradé ;
  - 15,70 « Ton export CSV suffit. » (Inter 500, 34 px, #999).
- **15,30 → 16,40 :** le curseur arrive du bas à droite en tenant une vignette fichier.
  - Vignette : 220×64, fond #181818, icône fichier verte, « session_adria.csv », « 26727.1 KB », ombre cardLift.
  - Trajet en Bézier, courbe inOut.
  - Survol à 16,00 : bordure → #FF4242, fond rgba(255,66,66,0,06), scale 1,02.
- **16,40 :** dépôt. La vignette rétrécit (scale 0,5, opacity 0) dans la zone, avec un Ripple.
- **16,50 → 17,20 :** état « fichier sélectionné » : pointillés #22C55E à 50 %, fond rgba(34,197,94,0,06), tuile fichier en dégradé success.
  - Le panneau « Informations de Session » glisse dessous : Conditions de piste avec « Sec » sélectionné (#FF6B35), Type de session avec « Essais » sélectionné.
  - Les pastilles apparaissent en Pop (décalage 0,04 s).
- **17,25 → 17,60 :** le curseur va sur « Analyser le fichier » (bouton en dégradé primary) et clique à 17,60.
- **17,65 → 18,00 :** Dive dans le bouton (scale ×1,7, blur →16), avec flou de mouvement.
- **Son :** 15,30 frottement · 16,40 « thunk » + onde · 16,55 pops · 17,60 clic · 17,65 whoosh.

### S07 — Analyse IA · 18,00 → 20,50
- **Au centre**, la carte « Analyse en cours… » (fidèle à `ui-04`) :
  - anneau de 104 px (piste #262626, arc #FF4242 de 4 px qui tourne) avec l'icône Brain au centre ;
  - titre et sous-titre ;
  - ligne d'état rouge qui fait défiler les 5 vraies étapes (`ui-data.analyzing.steps`), une toutes les 0,32 s, avec un échange flou de 0,12 s ;
  - barre de progression rouge de 0 à 100 % avec le pourcentage, par paliers non linéaires : 0 → 20 → 40 → 60 → 85 → 100.
- **En fond :**
  - le tracé du circuit se redessine très vite à 10 % d'opacité ;
  - des particules (points #FF4242 de 2 px) circulent le long du tracé ;
  - une ScanLine passe sur la carte à 18,30 et à 19,10.
- **Texte au-dessus** (y 170) : à 18,10, « L'IA analyse chaque virage. » (Space Grotesk 700, 72 px, « chaque virage » en dégradé).
- **19,85 :** à 100 %, l'anneau se ferme et devient un disque vert (dégradé success).
  - Une coche blanche se dessine (0,2 s), avec un éclat de 8 traits radiaux.
  - « Analyse terminée ! » remplace le titre (échange flou), avec le sous-titre « Votre session a été analysée avec succès. ».
- **20,20 → 20,50 :** whip vertical vers le haut, comme un défilement rapide jusqu'aux résultats, avec flou de mouvement.
- **Son :** 18,00 bourdonnement de traitement + blips de données · 19,85 carillon de succès · 20,20 whip.

### S08 — Score · 20,50 → 24,00
- **Mise en page :** carte « Score de Performance » à gauche (x 120–1080), en 3D (rotateY 12°→5°, rotateX 10°→4°) ; texte à droite (x 1160–1800).
- **Carte** (fidèle à `ui-05`) :
  - fond #121212, bordure rgba(255,66,66,0,35), radius 16 ;
  - en-tête : icône TrendingUp rouge, « Score de Performance » et badge « B » (fond rgba(59,130,246,0,15), texte #60A5FA) ;
  - « 71/100 » en Space Grotesk 700, #F5456F ;
  - « Note de pilotage sur cette session » ;
  - 4 tuiles de sous-scores (#181818, radius 10).
- **20,55 → 21,45 :** « 71 » compte de 0 à 71 (outExpo, 0,9 s) ; « /100 » reste fixe.
- **20,90 :** les tuiles apparaissent en Pop (décalage 0,07 s) et leurs valeurs comptent jusqu'à leur cible.
- **Texte à droite :** 21,00 « Ton pilotage, » (Space Grotesk 700, 96 px) ; 21,40 « noté sur 100. » (« 100 » en dégradé).
- **22,30 → 23,20 :** la caméra descend. Les 4 cartes de stats entrent en BlurIn (décalage 0,08 s) et « 49.680s » (vert) prend un halo vert.
- **23,40 → 24,00 : raccord.** Dive sur « 49.680s » (zoom ×3, 0,45 s, flou de mouvement). La valeur devient le « 49.68s » du bandeau TOUR PARFAIT IA de S09, au même endroit de l'écran (crossfade flou de 0,15 s).
- **Son :** 20,55 ticks du compteur · 20,90 pops · 23,40 whoosh de plongée.

### S09 — Tour Parfait IA (scène pivot) · 24,00 → 29,00
- **Composition :**
  - bandeau doré en haut (y 110–250, 1500 px de large, centré) ;
  - sous le bandeau, en petit : onglets « Vitesse | Freinage | Mini-secteurs | Comparaison » (Vitesse actif, pilule en dégradé primary) et bouton doré « MASQUER TOUR IA » ;
  - carte du circuit au centre (760 px de haut, centre x 1180) ;
  - texte à gauche (x 120–700).
- **24,00 → 24,55 :** le bandeau s'assemble autour de « 49.68s ».
  - « TOUR PARFAIT IA » (#FACC15, Space Grotesk 700, capitales), « Meilleur tour 49.68s (tour 4) », « Tour idéal 48.45s », « À aller chercher −1.23s » entrent en BlurIn de gauche à droite (décalage 0,08 s).
  - « −1.23s » compte de −0.00 à −1.23 en #22C55E et pulse (halo) à 24,60.
  - La ligne d'explication s'affiche en dessous (Inter 400, 18 px, #999, 2 lignes).
- **24,35 → 25,85 :** la carte se dessine.
  - L'asphalte entre en BlurIn.
  - La ligne colorée par la vitesse (`speedToColor`, données réelles) se trace avec une tête lumineuse blanche (evolvePath 1,5 s, courbe inOut).
  - Les marqueurs 1 → 12 apparaissent en Pop au passage de la tête.
  - Caméra 3D lente : rotateX 26°→18°, rotateZ −5°→0°.
- **25,85 → 26,45 :** la trajectoire « Tour IA » se trace par-dessus en pointillés dorés (#FACC15, tirets 10/8, largeur 3), avec un scintillement doré qui la parcourt.
- **Texte à gauche :**
  - 25,40 « Ton tour idéal, » (Space Grotesk 700, 84 px) ;
  - 25,95 « tu l'as déjà roulé. » (« déjà roulé » en dégradé) ;
  - 26,70 « Juste pas dans le même tour. » en sous-ligne (Inter 500, 40 px, de #999 à #FAFAFA).
- **26,70 → 28,60 :** tenue, avec une orbite lente.
- **28,60 → 29,00 :** Dive vers le marqueur du virage 10 (`corners` n=10, x 678, y 918,5), zoom ×3,2 en 0,4 s. Le bandeau et le texte partent en blur.
- **Son :** 24,00 tick · 24,35–25,85 balayage électrique ascendant · 25,85 shimmer · 28,60 whoosh de plongée.

### S10 — Coaching · 29,00 → 33,00
- **29,00 → 29,60 :** plan serré sur le virage 10. Le marqueur pulse (2 Ripple) et la portion de trace locale brille. La pastille « Virage 10 » (texte #FF4242, icône MapPin) apparaît à côté.
- **29,30 → 29,90 :** la carte « Priorité 1 » (fidèle à `ui-08`, contenu exact de `ui-data.coaching.cards[0]`) monte du bas au premier plan (y +140→0, blur 14→0, courbe ios, 0,6 s).
  - La carte du circuit passe en arrière-plan : blur 8 px, luminosité 50 %.
  - Le titre entre en BlurWords (décalage 0,035 s) et reste au premier plan jusqu'à 31,30. Les lignes du corps entrent en fondu (décalage 0,08 s). Seules les 3 premières lignes sont lisibles, puis un masque dégradé coupe la suite.
  - À 30,40, un surlignage doré (rgba(250,204,21,0,22)) balaie « Relâche les freins plus progressivement à l'inscription » en 0,4 s.
  - « 0.27s » est en vert, avec un halo.
- **Texte en haut à gauche :** 29,50 « Virage par virage. » (Space Grotesk 700, 84 px) ; 30,20 « Classés par temps perdu. » en sous-ligne (Inter 500, 38 px, #999).
- **31,30 → 31,80 :** la carte 1 recule (y −40, scale 0,94, opacity 0,6). La carte « Priorité 2 » (Virage 6, Braking, 0.16s) glisse devant ; son titre reste lisible jusqu'au whip.
- **31,90 → 32,70 :** la caméra recule et pivote (rotateY −18°). On voit la pile de cartes en 3D au-dessus de la carte du circuit.
- **32,70 → 33,00 :** whip latéral vers la gauche.
- **Son :** 29,00 pings · 29,30 swoosh · 30,40 feutre · 31,30 swoosh · 32,70 whip.

### S11 — Profondeur des données · 33,00 → 36,00 (montage sur les temps)
- Trois cartes de graphiques flottent dans l'espace 3D, chacune à une profondeur et une rotation différentes :
  - **33,00 · « Delta Temps »** (fidèle à `ui-09`) : axes, bandes V1–V12, ligne verte T4 à 0. La ligne bleue T9 est tracée depuis les données réelles (evolvePath 0,8 s).
  - **33,50 · « Trace de Vitesse »** : T4 en #F97316 et T9 en #3B82F6, tracées depuis `points[i][2]` et `points[i][5]` (0,8 s).
  - **34,00 · « Radar de Performance »** : losange à 4 axes, remplissage orange qui pousse depuis le centre (spring), valeurs `ui-data.charts.radar`.
- **Mots cinétiques à gauche**, un par temps (Space Grotesk 700, 110 px, remplacement en flou) :
  - 33,00 « Freinage. »
  - 33,50 « Vitesse d'apex. »
  - 34,00 « Trajectoire. »
  - 34,50 « Régularité. »
  
  Le mot actif est blanc ; les précédents s'empilent au-dessus à 25 % d'opacité.
- **35,00 → 36,00 :** les cartes filent vers la caméra (translateZ +900, blur) et traversent l'écran. Les mots se compactent puis disparaissent.
- **Son :** un coup percussif sur chaque mot (33,00 / 33,50 / 34,00 / 34,50) · 35,00 passage de caméra (fly-through).

### S12 — Écosystème (bento) · 36,00 → 39,00
- **Grille bento** de 3 cartes (espacement 28 px, largeur totale 1560, centrée, rotateX 8°) :
  - **A (à gauche, haute) — Mon Kart :** schéma du kart vu de dessus avec ses nœuds verts lumineux, « Bilan Santé Global 98 » et les 4 tuiles (100 % / 93 % / 99 % / 99 %). Sources : `ui-11`, `rec-13`, `KartSchematic.tsx`.
  - **B (en haut à droite) — Carnet d'Ingénieur :** carte Pneumatiques avec les pressions et les pastilles « Recommandation » (`ui-data.setup`).
  - **C (en bas à droite) — Calendrier :** grille Octobre 2026, le 5 en rouge (aujourd'hui), 3 événements de démonstration (`ui-data.calendar`).
- **36,00 :** les cartes arrivent de la profondeur (translateZ −700→0, blur 20→0, décalage 0,15 s, outExpo).
  - 36,50 → 37,20 : les nœuds du kart s'allument un par un (halo vert) et « 98 » compte depuis 0.
  - 37,00 → 37,40 : les événements du calendrier apparaissent en Pop.
- **Texte en haut, centré** (y 120) :
  - 36,30 « Ton kart. » · 36,75 « Tes réglages. » · 37,20 « Ta saison. » (Space Grotesk 700, 72 px, sur une ligne, mot à mot) ;
  - 37,60 « Au même endroit. » sur une deuxième ligne, en dégradé.
- **38,70 → 39,00 :** tout recule (scale 1→0,7), se floute et s'assombrit.
- **Son :** 36,00 trois whooshes · 36,50 blips · 37,60 impact doux · 38,70 whoosh inversé.

### S13 — L'appel · 39,00 → 42,00 (break)
- **Fond :** noir, atmosphère très basse.
- **39,00 → 40,20 :** une ligne rouge lumineuse (3 px, halo 20 px) se trace de gauche à droite sur toute la largeur (centrée en y 760, amplitude 220 px). C'est la vraie courbe delta.
- **Texte :** 39,15 « Va chercher » (Space Grotesk 700, 150 px) en BlurWords ; 39,75 « tes dixièmes. » (150 px, dégradé + GradientSweep).
- **40,40 → 41,20 :** la courbe s'aplatit en ligne droite (`interpolatePath` vers un y constant) : l'écart est comblé.
- **41,30 → 42,00 :** courte montée. Le texte remonte de 40 px et passe à scale 0,9. **Coupe sur le temps fort à 42,00.**
- **Son :** 39,00 break (musique filtrée passe-bas) + pulsation sub · 41,30 riser court · 42,00 hit final.

### S14 — Carte de fin et CTA · 42,00 → 45,00
- **Fond :** mur 3D de captures (`assets/showcase/*.webp`).
  - Perspective rotateX 55°, rotateZ −45°, comme le hero du site (voir `3d-marquee.tsx`).
  - 4 colonnes qui dérivent en sens alternés à 40 px/s.
  - Luminosité 14 %, blur 2 px, vignettage fort, taches rouge et orange.
- **42,00 :** logo (icône 104 px + « APEXAI » 120 px) en spring, puis un LightSweep à 42,30.
- **42,35 :** « Ton ingénieur de course IA » (Inter 500, 40 px, #BDBDBD) en BlurIn.
- **42,75 :** bouton pilule en dégradé primary (hauteur 92, padding 44, Space Grotesk 600 36 px, blanc), glowPrimary : « Analyser ma session » avec un carré intérieur et un chevron, comme le bouton « S'inscrire › » du site.
- **43,00 :** « 1re analyse offerte · sans compte » (Inter 500, 28 px, #A3A3A3).
- **43,10 :** « apexai.racing » en bas (y 960, Inter 600, 32 px, #FAFAFA).
- **43,30 → 43,80 :** le curseur entre par le bas à droite. Au survol, le bouton passe à scale 1,03 et son halo à ×1,5. Clic à 43,80 (scale 0,96 + Ripple).
- **43,90 → 45,00 :** tenue, avec un push-in de 1,00 à 1,03.
- **Son :** 42,00 hit + shimmer · 43,80 clic + « ding » discret.

### S15 — Sortie · 45,00 → 46,00
Fondu au noir (opacity 1→0, accélération), sur la queue musicale.

---

## 11. Déclinaison 9:16 (1080×1920 · 60 i/s · 24,0 s = 1440 images)

- **Ce n'est pas un recadrage :** les scènes sont **réagencées**. Chaque scène reçoit une prop `layout: 'landscape' | 'portrait'` et adapte sa mise en page.
- **Zone sûre :** tout texte et tout élément clé reste dans x ∈ [80, 940] et y ∈ [260, 1480]. Au-dessus, en dessous et à droite se trouvent les interfaces d'Instagram et de TikTok.

| # | Scène | s | Adaptation |
|---|---|---|---|
| V01 | Accroche | 0,00 → 2,50 | « Où » (380 px) de 0,10 à 0,90, puis « Où perds-tu / tes dixièmes ? » sur 2 lignes (120 px) dès 0,95. Whip de sortie à 2,35 |
| V02 | Duel fantôme | 2,50 → 6,00 | Photo de 2,50 à 3,10 (si le flag est actif). Carte sur 900 px de large dès 2,90 : la piste est plus haute que large, idéale en vertical. Duel de 3,00 à 4,60 (τ sur 1,6 s). HUD delta en haut (y 300), qui devient le titre « +0,51 s » à 4,55. « Sur un seul tour. » en bas (y 1320–1480) à 4,60 |
| V03 | Marque + positionnement | 6,00 → 8,50 | **Drop à 6,00** : logo sur une ligne (icône 120 + APEXAI 130 px). Zoom à travers l'icône à 6,80. Panneau rouge de 6,90 à 8,50 : « Ton / ingénieur / de course IA » (3 lignes, 120 px, DecodeText dès 6,95). Rétrécissement en carte d'import de 8,10 à 8,50 |
| V04 | Import + analyse | 8,50 → 11,50 | Carte d'import pleine largeur (960 px). Fichier glissé de 8,60 à 9,40, dépôt à 9,40, état vert à 9,50, clic « Analyser le fichier » à 9,90. Analyse accélérée de 10,05 à 11,10, succès de 11,10 à 11,50. En haut (y 300) : « Importe ta session. » puis, à 10,05, « L'IA analyse chaque virage. » |
| V05 | Score | 11,50 → 14,00 | Carte score à 960 px de large. « 71 » compte de 11,55 à 12,35. En haut : « Ton pilotage, / noté sur 100. ». Dive sur « 71/100 », puis whip vers V06 à 13,70 |
| V06 | Tour Parfait IA | 14,00 → 18,00 | Bandeau doré en haut (y 280–480, sur 2 lignes). Carte du circuit au centre (900 px). En bas (y 1300–1480) : « Ton tour idéal, / tu l'as déjà roulé. » à 15,00 et 15,40, puis « Juste pas dans le même tour. » à 15,80. Dive sur le virage 10 à 17,70 |
| V07 | Coaching | 18,00 → 20,50 | Carte Priorité 1 en pleine largeur (960 px). En haut : « Virage par virage. ». Surlignage doré à 19,40 |
| V08 | Appel + fin | 20,50 → 24,00 | **Break à 20,50** : « Va chercher / tes dixièmes. ». **Hit à 22,00** : carte de fin avec logo, baseline, bouton, sous-ligne et URL, tous au-dessus de y 1480. Clic à 23,00, fondu de 23,60 à 24,00 |

Les 9:16 réutilisent les mêmes composants, données et effets, avec des tailles typographiques portrait (voir §6.4).

---

## 12. Architecture Remotion

### 12.1 Mise en place
```bash
node -v          # il faut ≥ 18 ; sinon, demande à Yanis d'installer Node LTS
cd apex-promo-video
npx create-video@latest --yes --blank --no-tailwind apexai-video   # ne nomme PAS le projet « remotion »
cd apexai-video
npx remotion skills add                                   # skill officiel Remotion pour agents (sinon : npx skills add remotion-dev/skills) : lis-le avant de coder
npx remotion add @remotion/transitions
npx remotion add @remotion/paths
npx remotion add @remotion/motion-blur
npx remotion add @remotion/google-fonts
npx remotion add @remotion/noise
npx remotion add @remotion/layout-utils
npm i lucide-react
```

Copie ensuite les assets depuis `../assets/` :
- `brand/apexai-icon.svg` → `public/brand/` ;
- `photo/*` → `public/photo/` ;
- `showcase/*` → `public/showcase/` ;
- `data/*.json` → `src/data/` ;
- génère `src/theme.ts` à partir de `brand/tokens.json`.

Polices : charge-les avec `@remotion/google-fonts/SpaceGrotesk` (500, 600, 700) et `@remotion/google-fonts/Inter` (400–800), sous-ensembles latin et latin-ext.

### 12.2 Arborescence cible
```
src/
  Root.tsx                 ← compositions ApexAI-16x9, ApexAI-9x16 et Still « Thumbnail » (1280×720)
  config.ts                ← FPS = 60 ; FLAGS = { useCircuitPhoto: true, debugGrid: false, withAudio: false, musicOffsetSec: 0 }
  timeline.ts              ← TIMELINE_16x9 et TIMELINE_9x16 en secondes (tableaux §10 et §11) ; s(), beat()
  theme.ts  fonts.ts
  data/adria-lap.json  data/ui-data.json
  lib/ease.ts  lib/kf.ts (keyframes → interpolate avec clamp + easing)  lib/track.ts (positions par temps, delta, speedToColor)
  components/
    Atmosphere.tsx  Camera3D.tsx  Cursor.tsx  Logo.tsx  Marquee3D.tsx  DebugOverlay.tsx
    fx/  BlurIn, BlurWords, GradientSweep, DecodeText, Underline, Counter, Pop, ScanLine, LightSweep, Ripple, Flash
    track/TrackMap.tsx     ← asphalte, ligne vitesse, ligne Tour IA, marqueurs, points du duel, segments perdus
    charts/  DeltaChart, SpeedTraceChart, Radar
    ui/      AppNavbar, UploadCard, SessionInfo, AnalyzingCard, ScoreCard, StatCards, PerfectLapBanner, MapTabs,
             CoachingCard, KartHealthCard, KartSchematic, SetupTiresCard, CalendarCard, Button, Badge, Chip
  scenes/   S01Hook … S15Out (chacune accepte layout + durée)
  compositions/ Promo16x9.tsx  Promo9x16.tsx
  audio/    Soundtrack.tsx  cues.ts
scripts/    make-grain.mjs  export-cuesheets.mjs
```

### 12.3 Règles techniques
- **Montage :** chaque scène est une `<Sequence from={s(start)} durationInFrames={s(dur + 0.3)}>`. Les 0,3 s supplémentaires permettent le chevauchement des transitions. L'ordre d'empilement suit l'ordre des scènes.
- **`DebugOverlay`** (si `FLAGS.debugGrid`) affiche le timecode, l'id de la scène, les ticks de temps et de mesure, et les zones sûres 9:16.
- **Interface :** recréée en React avec des styles inline issus de `theme.ts`, et les icônes `lucide-react` (les mêmes que l'app). Aucune capture n'est utilisée comme image dans le film, sauf le mur 3D (`showcase`) et la photo.
- **Images :** `<Img src={staticFile(...)} />`. Aucun chargement réseau hors polices.
- **Performance :**
  - `filter: blur()` sur de grandes surfaces coûte cher : floute les éléments, pas des calques plein écran inutiles ;
  - `CameraMotionBlur` uniquement sur les images de Dive et de Whip ;
  - halos SVG faits de traits dupliqués et floutés plutôt que de filtres empilés.
- **Données du circuit :** calcule les positions directement depuis `points` (index + interpolation). Utilise `evolvePath` pour le tracé progressif et `getPointAtLength` pour la tête lumineuse.

---

## 13. Processus de production

### Phase 0 — Préparation
Fais tout ceci avant d'écrire du code :
- lis ce document en entier ;
- regarde chaque image de `assets/ref/screens/` et `assets/ref/style/` ;
- ouvre `adria-lap-preview.png` ;
- lis les fichiers de `assets/ref/code/` cités au §5 ;
- extrais si besoin d'autres images de la référence : `npx remotion ffmpeg -ss <t> -i ../assets/ref/style/reference-motion.mp4 -frames:v 1 out/ref_<t>.png`.

### Phase 1 — Fondations et styleframes ⟶ ARRÊT
1. Construis les fondations : `theme`, `fonts`, `Atmosphere`, `fx/*`, `Camera3D`, `Logo`, `TrackMap`, `ScoreCard`, `PerfectLapBanner`.
2. Rends **6 styleframes** en 16:9 (`npx remotion still ApexAI-16x9 out/stills/sf-XX.png --frame=N`) :
   - S01 à 2,0 s ;
   - S02 à 6,6 s ;
   - S04 à 11,7 s ;
   - S08 à 22,0 s ;
   - S09 à 28,0 s ;
   - S14 à 44,0 s.
3. **Regarde-les toi-même** et corrige-les jusqu'à ce qu'ils soient au niveau. Ensuite seulement, montre-les à Yanis avec 3 lignes d'intention.
4. **Attends son feu vert ou ses retours** avant la phase 2. C'est le seul arrêt.

### Phase 2 — Animatic 16:9
- Toutes les scènes, aux timings exacts, avec les vraies transitions. Le polish peut rester incomplet.
- Rendu d'aperçu : `npx remotion render ApexAI-16x9 out/preview-16x9.mp4 --scale=0.5`.
- Revue : vérifie timing, lisibilité, rythme et temps forts. Tu peux extraire des images de l'aperçu pour les regarder.

### Phase 3 — Animation finale 16:9
- Polish : courbes, micro-mouvements, halos, grain, flou de mouvement.
- Contrôle de fidélité de l'interface : compare chaque écran recréé à sa capture de référence (rendu fixe à côté de la capture) sur les couleurs, rayons, espacements, typographie et textes exacts.

### Phase 4 — 9:16
Mêmes exigences, avec la mise en page portrait et les zones sûres.

### Phase 5 — Son, exports, contrôle qualité
1. Cue sheets en CSV. Musique et effets sonores seulement s'ils sont fournis.
2. Rendus finaux :
   ```bash
   npx remotion render ApexAI-16x9 out/apexai-promo-16x9.mp4 --codec=h264 --crf=16
   npx remotion render ApexAI-9x16 out/apexai-promo-9x16.mp4 --codec=h264 --crf=16
   npx remotion still Thumbnail out/thumbnail-1280x720.png
   npx remotion ffprobe out/apexai-promo-16x9.mp4
   ```
   Vérifie la syntaxe exacte des options avec le skill Remotion.
3. Contrôle qualité sur des images fixes, en 16:9 aux secondes suivantes :
   0,4 · 1,9 · 3,5 · 5,3 · 6,9 · 8,9 · 10,3 · 11,3 · 13,3 · 14,3 · 16,0 · 17,0 · 19,0 · 20,0 · 21,6 · 22,8 · 25,0 · 27,0 · 29,3 · 30,4 · 31,3 · 33,2 · 34,6 · 36,8 · 37,9 · 40,0 · 41,0 · 43,0 · 44,5.
   En 9:16, prends une image au milieu de chaque scène.
4. Écris `README-RENDU.md` : comment relancer, ce que fait chaque flag, le brief musique, et le rapport QA (ce qui a été vérifié, les écarts au storyboard et leur raison).

---

## 14. Définition de « terminé »

- [ ] Les durées sont exactes : 2760 images en 16:9, 1440 en 9:16, à 60 i/s. Les résolutions sont 1920×1080 et 1080×1920, en H.264 yuv420p.
- [ ] Les temps forts (10,00 / 39,00 / 42,00 s, et 6,00 / 20,50 / 22,00 s en 9:16) tombent sur la grille à 120 BPM.
- [ ] Aucune coupe sèche hors des coupes autorisées. Aucun élément ne surgit ou ne disparaît sans transition. La caméra n'est jamais figée.
- [ ] Les couleurs et polices sont toutes issues de `tokens.json`. Le logo est intact. Les accents et la typographie française sont corrects.
- [ ] Chaque chiffre vient de `ui-data.json` ou de `adria-lap.json`. Rien de la liste `forbidden` n'apparaît, même en arrière-plan.
- [ ] Le texte d'interface lisible respecte les tailles minimales. Chaque ligne cinétique reste assez longtemps à l'écran (règle §4.5).
- [ ] Les 9:16 respectent la zone sûre.
- [ ] Le rendu est déterministe : deux rendus de la même image sont identiques.
- [ ] Le dossier `apex-ai-fresh/` n'a pas été touché.
- [ ] Les livrables du §2 sont présents, et le README contient le rapport QA.
