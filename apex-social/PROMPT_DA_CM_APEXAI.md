# PROMPT — Identité sociale et lancement Instagram d'ApexAI (DA + CM)

> **Pour Yanis :** ouvre une session Claude avec le dossier `Desktop/ApexAI` connecté (ou Claude Code dans ce dossier) et envoie :
> « Lis `apex-social/PROMPT_DA_CM_APEXAI.md` en entier et exécute-le. »
> Tout ce qui suit s'adresse à Claude.

---

## 1. Rôle et mission

Tu tiens trois rôles à la fois :
- **directeur artistique senior** : identité de marque, système graphique, direction motion ;
- **community manager et stratège social**, spécialiste du SaaS et du sport auto ;
- **producteur technique** : tu fabriques tout toi-même en code (Remotion, scripts audio), au niveau d'un studio.

**Mission :** créer l'identité sociale complète d'ApexAI et le kit de lancement Instagram : logo décliné, premiers posts, reels, stories et stories à la une. Dès la première visite, le compte doit paraître établi, crédible et désirable. Il pousse vers le tunnel : analyse gratuite sans compte → compte gratuit → Racer.

**Barre de qualité :** au moins le niveau des deux films Remotion déjà livrés (`apex-promo-video/apexai-video/out/`), idéalement au-dessus. Pas de Canva, pas de gabarit générique, pas d'esthétique « template ». Chaque visuel doit pouvoir passer pour le travail d'un studio de campagnes SaaS et motorsport.

Tu travailles en autonomie. Si une consigne est impossible ou dégrade le résultat, prends l'option la plus proche, note-la dans le rapport final et continue. Il y a **un seul point de contrôle, non bloquant** (§18).

**Interdit :**
- modifier `apex-ai-fresh/`, `backend/` ou `input/` (code de production et données de Yanis) ; les lire est autorisé ;
- publier quoi que ce soit, créer ou configurer un compte : c'est Yanis qui publie ;
- acheter ou télécharger de la musique ;
- utiliser des visuels générés par IA qui représentent des personnes, des karts ou des circuits réels.

---

## 2. Sources de vérité

### 2.1 Fichiers (chemins depuis `Desktop/ApexAI/`)

| Fichier | Rôle |
|---|---|
| `apex-promo-video/PROMPT_MOTION_APEXAI.md` | Prompt du film : vocabulaire d'animation (§7), règles typographiques et de lisibilité. **À lire en entier** |
| `apex-promo-video/assets/brand/tokens.json` | Couleurs, dégradés, polices, rayons, ombres, courbes. Source de vérité de la charte |
| `apex-promo-video/assets/brand/apexai-icon.svg` | Icône officielle (carré arrondi en dégradé, éclair plein). Symbole maître |
| `apex-promo-video/assets/data/ui-data.json` | Textes et chiffres exacts de chaque écran, et liste `forbidden` |
| `apex-promo-video/assets/data/adria-lap.json` | Tracé réel d'Adria, vitesses T4 et T9, 12 virages, segments perdus |
| `apex-promo-video/assets/ref/screens/ui-01…13`, `rec-01…14` | Captures de l'app, comme référence visuelle uniquement |
| `apex-promo-video/assets/ref/code/*` | Copies des composants de l'app : classes, structure, couleurs |
| `apex-promo-video/apexai-video/` | Projet Remotion du film : composants (`Atmosphere`, `Camera3D`, `TrackMap`, `Logo`, `fx`, `ui/*`), polices locales, `src/audio/cues.json` et `cues.ts`, `README-RENDU.md`. Ignore `out/_to_delete/` (morceaux de transfert) |
| `apex-promo-video/apexai-video/out/apexai-promo-{16x9,9x16}.mp4` | Masters 60 i/s, muets : à sonoriser |
| `apex-ai-fresh/src/components/ui/pricing-section-4.tsx` | Offres affichées sur /pricing, avec les libellés exacts (lecture seule) |
| `apex-ai-fresh/src/pages/Index.tsx`, `src/lib/api.ts`, `src/components/upload/CSVUploader.tsx` | Textes du site, compatibilité, limite de taille de fichier (lecture seule) |

L'enregistrement d'écran de l'app n'est **pas** utilisé : il montre des e-mails, des comptes Google, un nom et des badges. Tout est recréé en vectoriel, comme dans le film.

### 2.2 Faits vérifiés
Tu n'ajoutes aucun fait sans preuve dans le code ou sans validation de Yanis.

**Produit**
- **Import :** CSV d'un data logger, 50 Mo maximum.
- **Compatibilité à annoncer :** MyChron 5 et MyChron 6, export CSV via Race Studio (FAQ du site). Astuce officielle si le fichier est trop lourd : réduire les canaux ou décimer à 1:10 dans Race Studio.
- **Offre d'essai :** 1 analyse gratuite sans compte (mode invité de `CSVUploader.tsx`).
- **Ce que donne l'analyse :**
  - un score de pilotage sur 100, avec 4 sous-scores (Précision Apex /30, Régularité /25, Vitesse Apex /25, Temps Secteurs /20) ;
  - le Tour Parfait IA : les meilleurs mini-secteurs enchaînés, avec une trajectoire qui reste dans les limites de piste ;
  - des conseils de coaching classés par temps réellement perdu, virage par virage ;
  - la carte du circuit (vitesse, freinage, mini-secteurs, comparaison) ;
  - des graphiques (delta temps, trace de vitesse, accélérateur et frein, radar, points de corde) ;
  - la comparaison de sessions et un rapport PDF.
- **Autour de l'analyse :**
  - le tableau de bord ;
  - Mon Kart : santé du kart, heures moteur, tours de pneus, freins, chaîne, stock de pneus, historique des journées de roulage ;
  - le Carnet d'Ingénieur Digital : réglages par circuit (pneumatiques, châssis et géométrie, moteur et carburation), avec recommandations ;
  - le calendrier : courses, entraînements, échéances d'inscription.

**Offres**

Les prix sont identiques à ceux du site, sans arrondi. Pour le contenu de chaque plan, reprends les libellés exacts de `pricing-section-4.tsx`.

| Plan | Prix | Contenu |
|---|---|---|
| Invité | 0 € | 1 analyse, sans compte |
| Rookie | 0 € | 3 analyses par mois · 1 seul circuit (mémorisé) · tracé de piste + 1 graphique · score global /100 · 2 conseils de coaching IA · comparaison de sessions |
| Racer | **9,90 €/mois** (ou 99 €/an, −17 %) | analyses illimitées · tous les circuits détectés · tous les graphiques IA avancés · score par virage · 4 conseils personnalisés par tour · Mon Kart · recommandations de réglages IA · suivi d'entretien mécanique |
| Team | — | « Bientôt disponible » : **ne pas promouvoir** |

- Mets en avant **9,90 €/mois**. Le prix annuel (99 €) n'apparaît qu'en mention secondaire.
- Pour le gratuit, écris « l'essentiel, gratuit », jamais « presque tout » : Rookie est limité.

**Preuves de crédibilité réelles**
- L'app est en ligne et fonctionne : apexai.racing.
- 1er prix du 36h Chrono (PÉPITE Provence). **La formulation exacte doit être validée par Yanis** avant publication.
- Les analyses montrées sont de vraies sorties de l'app, obtenues sur un vrai fichier de télémétrie de démo (Adria Karting Raceway).

**Chiffres utilisables** (session de démo, tous issus de `ui-data.json` ou `adria-lap.json`)
- **Score :** 71/100 (note B), avec les sous-scores 20/30 · 16/25 · 20/25 · 15/20.
- **Stats de session :**
  - tour le plus rapide : 49.680s (tour 4) ;
  - vitesse maximale : 118.7 km/h (tour 7) ;
  - cohérence : 1.15 s d'écart moyen ;
  - 3.33 s entre le pire et le meilleur tour.
- **Tour Parfait IA :** 49.68s → 48.45s, soit −1.23s à aller chercher.
- **Duel T9 contre T4 :** +0,51 s sur un tour.
- **Coaching, virage 10 :** 55 km/h contre 58 km/h à l'apex, 2.9 km/h à reprendre, 0.27s par tour.
- **Coaching, virage 6 :** le meilleur passage freinait 26 m plus tôt (à 43 m de l'apex contre 17 m), 0.16s par tour.

---

## 3. Règles non négociables

### 3.1 Véracité
- Rien d'inventé : aucune statistique d'usage, aucun témoignage, aucun nombre d'utilisateurs, aucune promesse de gain (« gagne 1 s »).
- Aucun superlatif invérifiable : « le meilleur », « la première plateforme », « précision 99 % ».
- La liste `forbidden` de `ui-data.json` reste absolue, à une exception près : la ligne « Prix et offres » est désormais autorisée, selon le §2.2. Deux ajouts à la liste :
  - le « +1.2s gain estimé » du tableau de bord, qu'on confondrait avec la stat fictive de la landing ;
  - le plan Team.

  Pour les marques de boîtiers, c'est le §3.2 qui s'applique : il est plus strict que la liste.
- Tout visuel qui montre des chiffres d'analyse porte le label discret **« Session de démo · Adria Karting Raceway »** : Inter 600, capitales, 20 à 22 px, #999.
- **Interface recréée :**
  - aucun nom ni avatar réel, aucun badge Admin ou Team ;
  - si un nom de pilote est nécessaire, il s'appelle « Pilote démo » ;
  - toute marque de matériel visible dans l'app (châssis, moteur, pneus, freins) devient un libellé générique, par exemple « Train 2 · slicks ».
- Une fonctionnalité n'est montrée que si elle existe dans le code ou sur les captures. Pas de roadmap, pas de date promise.

### 3.2 Marques et droit
- **Autorisé :** écrire « MyChron 5 », « MyChron 6 » et « Race Studio » en texte, pour dire qu'ApexAI lit leurs exports. C'est un usage descriptif de compatibilité.
  - Dans la FAQ et le post « Comment ça marche », ajoute : « MyChron et Race Studio sont des marques d'AiM. ApexAI n'est pas affilié à AiM. »
- **Interdit :**
  - les logos de ces marques ;
  - toute suggestion de partenariat avec elles ;
  - toute autre marque tierce ;
  - les marques F1 et FIA, les noms d'écuries et de pilotes.

  L'inspiration F1 passe par le langage graphique (timing, secteurs, télémétrie), jamais par les marques.
- Tu n'annonces AiM au sens large ou RaceBox qu'après confirmation de Yanis.
- **Musique :** aucune piste commerciale. Sur un compte Entreprise, seulement la bibliothèque libre de droits de Meta dans l'app, ou une piste dont la licence couvre la publicité.
- **Contenus de la communauté** (fichiers, captures, avis) : consentement écrit explicite avant toute publication, données anonymisées par défaut.

### 3.3 Charte
- **Couleurs :** uniquement les valeurs de `tokens.json`.
  - Fond #0A0A0A, cartes #121212 et #181818, bordures #262626.
  - Rouge #FF4242 → #E60000. Dégradé des mots-clés #FF4242 → #FF9933.
  - Couleurs de data : gain #22C55E, perte #FF4242, Tour IA #FACC15, comparaison #3B82F6.
- **Polices :** Space Grotesk pour les titres, les chiffres et le logo ; Inter pour le texte et les labels. Les chiffres animés sont en `tabular-nums`.
- **Logo :**
  - il n'est jamais déformé ni espacé, et jamais recoloré en dehors des variantes officielles (§6) ;
  - « APEXAI » s'écrit sans espace : « APEX » en blanc (en noir sur fond clair), « AI » en rouge ou en dégradé ;
  - le symbole est toujours l'éclair plein de `apexai-icon.svg`. L'éclair « Zap » de lucide, en contour, reste une icône d'interface et ne sert jamais de logo.

### 3.4 Typographie française
- Visuels : espace fine insécable (U+202F) avant « ? ! : ; ». Légendes Instagram : espace insécable (U+00A0).
- Typo cinétique et titres : virgule décimale (« −1,23 s »). Interface recréée : format de l'app (« −1.23s »).
- On écrit « 1re », pas « 1ère ».
- Tutoiement partout. Seule exception : les textes d'interface recréés, laissés tels quels.

### 3.5 Lisibilité et accessibilité
- Sur aplat rouge, le texte est blanc et fait au moins 48 px : le contraste ne permet pas de petits textes.
- Tailles minimales sur un visuel de 1080 px de large : 28 px pour un texte destiné à être lu, 22 px pour un label.
- Chaque post a un texte alternatif rédigé.
- Les vidéos se comprennent **sans le son**, puisque tout le message est à l'écran. Elles sont **meilleures avec** (§11).

---

## 4. Stratégie (casquette CM)

### 4.1 Cible
- **Cœur :** pilotes amateurs licenciés qui roulent souvent, avec leur propre kart et un MyChron, et font quelques courses par saison. Ils connaissent leurs chronos, pas l'endroit où ils perdent du temps. Ils ne sont pas ingénieurs et n'en ont pas à leurs côtés.
- **Secondaire :** parents de jeunes pilotes, coachs, préparateurs, clubs et circuits. Ce sont des relais d'audience.
- **Exclue :** le karting de location et de loisir. Pas de kart de location, pas d'indoor, pas d'enterrement de vie de garçon, pas de « sortie entre potes ».

### 4.2 Positionnement
> Pour les pilotes qui roulent avec un MyChron, ApexAI est l'ingénieur de course IA qui lit ta télémétrie à ta place. Il te dit, virage par virage, où tu perds du temps et quoi changer.

L'ennemi commun : le chrono, qui dit combien mais jamais pourquoi. La promesse : comprendre sa session en quelques secondes, sans être ingénieur.

### 4.3 Objectifs, par ordre de priorité
1. **Crédibilité** pour les premières ventes. Dès la première visite, le profil doit faire « vrai produit, vraie équipe, vraie data ».
2. **Essais :** des analyses gratuites lancées depuis Instagram.
3. **Inscriptions** au plan Rookie, puis passages à Racer.

L'indicateur phare : les analyses et inscriptions attribuées à Instagram, mesurées par les liens UTM (§7).

### 4.4 Piliers éditoriaux (sur 4 semaines)
| Pilier | Part | Rôle | Formats |
|---|---|---|---|
| Pédagogie data : lire sa télémétrie, le freinage, l'apex, la régularité | 35 % | portée, enregistrements, partages | carrousels, reels |
| Produit en action : score, Tour Parfait, coaching, delta, Mon Kart, carnet | 30 % | désir, preuve | reels, carrousels |
| Offre et tunnel : sans compte, gratuit, Racer | 15 % | conversion | posts, stories avec lien |
| Coulisses du projet : fondateur sans visage, nouveautés réelles, 36h Chrono | 10 % | crédibilité, attachement | posts, stories |
| Communauté : sondages, questions, défi data avec consentement | 10 % | engagement, futurs témoignages | stories |

### 4.5 Tunnel et appels à l'action
| Étape | Message | CTA type | Lien |
|---|---|---|---|
| Découverte | « Où perds-tu tes dixièmes ? » | « Enregistre ce post pour ta prochaine session » ou « Envoie-le à ton pote de team » | — |
| Essai | « 1re analyse offerte, sans compte » | « Teste sur ta dernière session : lien en bio » | /upload |
| Inscription | « L'essentiel, gratuit : 3 analyses par mois » | « Crée ton compte gratuit » | / |
| Abonnement | « Racer : tout ApexAI pour 9,90 €/mois » | « Passe Racer » | /pricing |

Un seul CTA par post.

### 4.6 Voix
**Expert accessible** : un ingénieur de course qui parle comme au paddock.
- **Précis :** chiffres réels, unités, virages numérotés. Jamais vague, jamais emphatique (« révolutionnaire », « incroyable »).
- **Direct :** tutoiement, phrases courtes, verbes d'action. Tout jargon s'explique en quatre mots, par exemple « freinage dégressif (trail braking) ».
- **Complice :** vocabulaire de pilote (dixièmes, corde, inscription, réaccélération, tour lancé, train de pneus). Jamais « gamer », jamais moqueur.
- **Emojis :** aucun sur les visuels ; 2 au plus par légende, et seulement fonctionnels (→, ↓).

### 4.7 Référencement Instagram
- Place ces mots-clés naturellement dans le nom, la bio, les légendes et les textes alternatifs : télémétrie karting, analyse MyChron, data karting, trajectoire, point de corde, freinage, chrono.
- **5 hashtags au maximum** par post, c'est la limite actuelle d'Instagram. Mets-en 3 à 5, spécifiques, en rotation.
  - Banque : #karting #kartingfrance #kartinglife #kartracing #mychron #telemetrie #motorsport #racingdata, plus le hashtag de marque #apexairacing.
  - Jamais #reels, #explore ni #fyp.

### 4.8 Autres réseaux
Instagram d'abord ; les autres réseaux suivront. Rien n'est produit spécialement pour eux maintenant.
- Les reels 9:16 servent tels quels pour TikTok et YouTube Shorts : la zone sûre est compatible.
- Le 16:9 sonorisé sert pour LinkedIn et YouTube.
- Identifiant : le même partout où c'est possible (§7).

---

## 5. Direction artistique : le système social

### 5.1 Concept
**« Le stand d'ingénieur, en poche. »** Le profil ressemble à l'écran d'un ingénieur de course : nuit noire, data lumineuse et une seule couleur d'énergie, le rouge ApexAI. Deux influences assumées :
- **SaaS récent :**
  - cartes d'interface flottantes en 3D, bordures de 1 px, halos doux, grain fin ;
  - grands titres serrés, labels en capitales espacées, mots-clés en dégradé.
- **Habillage TV du sport auto :** traces de télémétrie superposées, cartes de circuit numérotées, deltas +/−, barres de secteurs, chiffres héros.

**Clichés interdits :** drapeau à damier, flammes, fumée de pneus, typo « racing » en italique, fibre de carbone, casque générique, kart en image de synthèse.

### 5.2 Formats et zones sûres
| Format | Taille | Zone sûre |
|---|---|---|
| Post et carrousel | 1080×1350 (4:5) | Marges de 72 px. La grille du profil affiche un recadrage 3:4 centré (x 34 → 1046) : rien d'essentiel hors de x 72 → 1008 |
| Reel | 1080×1920 | x 80 → 940, y 260 → 1480 (zone du film, compatible TikTok) |
| Couverture de reel | 1080×1920 | Titre dans x 80 → 1000, y 300 → 1600. La grille 3:4 montre y 240 → 1680 ; la marge en plus couvre un éventuel recadrage 4:5 dans le fil |
| Story | 1080×1920 | x 64 → 1016, y 250 → 1670. Zones des stickers réservées et documentées |
| Reel publicitaire | 1080×1920 | x 65 → 1015, y 270 → 1248 : Meta demande de laisser libres 14 % en haut, 35 % en bas et 6 % sur les côtés |
| Photo de profil | 1080×1080 | Affichée à ~110 px puis à 40 px : doit rester lisible aux deux tailles |
| Couverture « À la une » | 1080×1920 et 1080×1080 | Pictogramme centré, à 38 % du diamètre du cercle |

Les posts sont en 4:5, pas en 3:4 : c'est le format standard, et il est éligible à la publicité.

### 5.3 Mise en page des posts
- Grille de 12 colonnes, marges de 72 px, gouttière de 24 px.
- **En-tête** (y 72 → 110) : label de rubrique en Inter 600, capitales, interlettrage 0,2 em, #999. Par exemple « TÉLÉMÉTRIE · MÉTHODE ».
- **Pied de page** (y 1262 → 1290) :
  - à gauche, l'icône en 32 px et « apexai.racing » (Inter 600, 22 px, #999) ;
  - à droite, sur les carrousels, le compteur « 02/07 » (Space Grotesk 600, 22 px, tabular-nums).
- **Un seul héros par visuel :** un chiffre, une trace ou un titre, jamais les trois au même niveau.
- Titres de couverture : 6 mots au plus, point final, mot-clé en dégradé. Le modèle : « Ton pilotage, noté sur 100. »

### 5.4 Échelle typographique (visuel de 1080 px de large)
| Rôle | Police | Taille (px) | Interlettrage |
|---|---|---|---|
| Chiffre héros | Space Grotesk 700 | 220–360 | −0,04 em |
| Titre de couverture | Space Grotesk 700 | 104–140 | −0,03 em |
| Titre de slide | Space Grotesk 700 | 64–84 | −0,02 em |
| Texte | Inter 500 | 32–40, interligne 1,3 | 0 |
| Label | Inter 600, capitales | 20–24 | 0,2 em |

Texte de slide : 30 mots au plus, 42 caractères au plus par ligne.

### 5.5 Couleur à l'échelle du profil
- Répartition : environ 60 % de noir, 25 % de surfaces (#121212, #181818), 10 % de rouge et d'orange, 5 % de couleurs de data.
- **L'aplat rouge plein** (le panneau du film) est une signature réservée aux posts « déclaration ». Deux tuiles rouges ne se touchent jamais par un côté dans la grille ; la diagonale est autorisée.

### 5.6 Signatures graphiques
Ces éléments rendent un post ApexAI reconnaissable même sans le logo.
1. **La trace :** la vraie ligne d'Adria, colorée selon la vitesse (`speedToColor`), avec ses marqueurs numérotés. C'est le motif de la marque. On peut la recadrer, la zoomer, la faire sortir du cadre ou traverser les slides d'un carrousel.
2. **Le chiffre héros :** un delta, un score ou un chrono en Space Grotesk très grand. Il est signé (+ en rouge, − en vert) et son unité est plus petite.
3. **La carte flottante :** un écran de l'app recréé et incliné en 3D (perspective 1400–1800, rotateX 6–12°, rotateY ±6–14°), avec un halo et l'ombre `cardLift`.
4. **L'atmosphère :** fond #0A0A0A, taches rouges et orange floutées, grain fin, vignettage. C'est le composant `Atmosphere`.
5. **Les repères de construction :** pointillés et poignées façon Figma, comme dans la révélation du logo du film. Ils servent aux posts « coulisses ».
6. **La barre de secteurs :** des mini-secteurs colorés (vert, #FACC15, rouge), façon écran de timing, pour illustrer la régularité ou le Tour Parfait.

### 5.7 Carrousels
- Chaque carrousel est conçu comme **une bande continue** de 1080 × n px de large, puis découpé. La trace ou un trait lumineux passe d'une slide à l'autre : le swipe donne envie de continuer.
- Structure : la couverture porte l'accroche, chaque slide porte une seule idée, la dernière porte un CTA unique.
- 5 à 8 slides.

### 5.8 Motion (reels, stories animées)
- On reprend le vocabulaire du film (§7 de `PROMPT_MOTION_APEXAI.md`) : BlurIn, BlurWords, GradientSweep, DecodeText, Counter, Pop, LineDraw, Dive, Whip, LightSweep, ScanLine.
- Rythme : une idée toutes les 0,8 à 1,5 s.
- **L'image 0 montre déjà l'accroche, lisible.** Pas d'ouverture au noir ni de fondu d'entrée : le premier mot est à l'écran dès le départ, et peut finir de se déflouter en 0,3 s.
- **Fin bouclable :** la dernière image se raccorde à la première, pour inviter à revoir la vidéo.
- La caméra n'est jamais figée et les transitions se chevauchent. Les coupes franches sont réservées aux temps forts.

### 5.9 Photo
Pour l'instant, pas de photo : Yanis n'en a pas encore. Inscris quand même dans la charte le traitement prévu pour plus tard : ambiance de nuit, désaturation de 15 %, calque rouge à 8 %, grain et vignettage. Uniquement des photos réelles, avec l'accord des personnes visibles.

---

## 6. Identité : logo, avatar, stories à la une

Yanis a décidé de **conserver** le logo actuel. Tu ne le redessines pas : tu construis le système qui l'entoure.

### 6.1 Kit logo
Dossier `brand/logo/`. Chaque version est livrée en SVG et en PNG (4096, 1024, 512 et 256 px), sur fond transparent.

| Fichier | Contenu |
|---|---|
| `apexai-icon` | Symbole maître, copie exacte de `apexai-icon.svg` |
| `apexai-lockup-h-dark` / `-light` | Icône et APEXAI sur une ligne, pour fond sombre ou clair (« APEX » en #0A0A0A sur fond clair) |
| `apexai-lockup-v-dark` / `-light` | Icône au-dessus, APEXAI en dessous |
| `apexai-wordmark-dark` / `-light` | APEXAI seul |
| `apexai-mono-white` / `-black` | Version une couleur : carré plein, éclair évidé |
| `apexai-watermark` | Icône en 64 px et « apexai.racing », blanc à 85 %, pour les vidéos |

Documente ces règles sur une planche (`brand/boards/logo.png`) :
- la zone de protection vaut 0,25 × le côté de l'icône ;
- tailles minimales : 24 px pour l'icône, 120 px de large pour le lockup horizontal ;
- exemples d'usages interdits : logo étiré ou recoloré, ombre ajoutée, espace dans APEXAI, éclair lucide à la place du symbole.

### 6.2 Photo de profil
Le pictogramme est un disque plein en dégradé primary, avec l'éclair blanc centré optiquement. L'éclair occupe environ 52 % du diamètre en hauteur. Le cercle d'Instagram coupe les coins du carré.
- **Variante A (recommandée) :** `out/00-profil/avatar-rouge-1080.png`. Elle ressort dans la barre de stories et dans les commentaires.
- **Variante B :** `avatar-noir-1080.png`, éclair en dégradé sur #0A0A0A.
- **Contrôle :** la planche `qa/avatar-tailles.png` montre chaque variante à 320, 110 et 40 px, sur fond clair et sur fond sombre.

### 6.3 Couvertures « À la une »
Six pictogrammes lucide, trait de 2 px, blancs, sur un disque #0A0A0A. Chaque disque porte un anneau intérieur de 2 px en dégradé primary et un halo rouge discret.

| À la une | Icône lucide | Contenu |
|---|---|---|
| Démo | Play | Reels produit |
| Tuto | FileUp | Exporter son CSV, l'importer, lire son analyse |
| Conseils | Target | Posts pédagogiques |
| Offres | Tag | Sans compte, Rookie, Racer |
| FAQ | Une icône de question (MessageCircleQuestion, CircleHelp… selon la version de lucide) | Compatibilité, prix, données |
| Histoire | Flag | Pourquoi ApexAI, 36h Chrono |

---

## 7. Profil Instagram (à livrer dans `out/00-profil/profil.md`)

- **Identifiant :** @apexai.racing, à confirmer par Yanis. On le reprend partout où le réseau l'accepte, sinon `apexai_racing`.
- **Nom :** `ApexAI | Télémétrie karting IA` (30 caractères). Ce champ est indexé par la recherche et limité à 30 caractères.
- **Type de compte :** professionnel, catégorie Entreprise. Il donne accès à la publicité, aux statistiques et à la programmation via Meta Business Suite. Choisis la catégorie la plus proche de « Logiciel » ou « Application ».
- **Bio** (150 caractères maximum). Version recommandée, 128 caractères :
  ```
  Ton ingénieur de course IA.
  Ta télémétrie MyChron → score /100 + conseils, virage par virage.
  1re analyse offerte, sans compte ↓
  ```
  Propose aussi 2 variantes. Vérifie toutes les longueurs avec un script (≤ 150).
- **Liens, dans cet ordre :**
  1. « Analyse gratuite, sans compte » → `https://apexai.racing/upload?utm_source=instagram&utm_medium=social&utm_campaign=lancement&utm_content=bio`
  2. « Offres » → `https://apexai.racing/pricing?utm_source=instagram&utm_medium=social&utm_campaign=lancement&utm_content=bio`
  3. « Site » → `https://apexai.racing/?utm_source=instagram&utm_medium=social&utm_campaign=lancement&utm_content=bio`

  Pour les stickers lien en story, remplace `utm_content` par l'identifiant de la story (`s5-j1`…).
- **Posts épinglés :** G1, G2 et G3 (§8).

---

## 8. Grille de lancement : 9 posts

### 8.1 Plan de grille
La rangée du haut est épinglée et forme un **panorama** : la trace d'Adria entre dans G1, traverse G2 et finit dans G3, avec le logo.
- Construis le panorama sur un canevas virtuel de 3 tuiles 3:4.
- Projette ensuite chaque tuile dans le cadrage réel de son post : pour un reel, une bande de 1080×1440 centrée verticalement ; pour un post 4:5, une bande de 1012×1350 centrée horizontalement.
- Chaque couverture doit aussi fonctionner seule dans le fil.

```
┌────────────┬────────────┬────────────┐
│ G1  reel   │ G2  carr.  │ G3  carr.  │  ← épinglés (panorama)
├────────────┼────────────┼────────────┤
│ G4  reel   │ G5  ROUGE  │ G6  carr.  │
├────────────┼────────────┼────────────┤
│ G7  reel   │ G8  carr.  │ G9  ROUGE  │
└────────────┴────────────┴────────────┘
```

### 8.2 Fiches
Pour chaque post, livre dans `out/01-lancement/Gx-<slug>/` :
- les fichiers à publier ;
- `caption.md` : légende, texte alternatif, hashtags, CTA et lien ;
- `cover.png` pour les reels.

| # | Format | Sujet | Accroche (couverture ou image 0) | Contenu | CTA |
|---|---|---|---|---|---|
| G1 | Reel, 24 s | Manifeste | « Où perds-tu tes dixièmes ? » | Le film 9:16 existant, **sonorisé** (§11), en export Instagram. Couverture : panorama 1/3 et accroche | Teste sans compte |
| G2 | Carrousel, 7 slides | Comment ça marche | « Du CSV au conseil. En 3 étapes. » | 1. Exporte ton CSV depuis Race Studio (MyChron 5/6). 2. Importe-le sur apexai.racing. 3. Score /100, Tour Parfait IA, conseils classés par temps perdu, avec une carte flottante pour chaque écran. Puis une slide « Ça marche avec quoi ? » avec la mention AiM, puis le CTA | Essaie sur ta dernière session |
| G3 | Carrousel, 5 slides | Offres | « Commence gratuitement. » | Invité (1 analyse sans compte), puis Rookie 0 € (contenu exact), puis Racer 9,90 €/mois (contenu exact, 99 €/an en petit). Puis « Quel plan pour toi ? » : tu roules souvent et fais des courses, c'est Racer. Puis le CTA | Crée ton compte gratuit |
| G4 | Reel, ~14 s | Tour Parfait IA | « Ton meilleur tour n'est pas ton meilleur tour. » | Voir le séquencier du §10.2 | Découvre ton tour idéal |
| G5 | Carrousel, 6 slides, couverture rouge | Le score décrypté | « 71/100. » en très grand, puis « Ton pilotage, noté sur 100. » | Une slide par sous-score (Précision Apex 20/30, Régularité 16/25, Vitesse Apex 20/25, Temps Secteurs 15/20) : ce qu'il mesure et comment le travailler. Pour savoir ce que mesure chaque sous-score, lis le calcul du score dans `backend/apexai-backend/src/analysis/scoring.py` (lecture seule) ; à défaut, reste au niveau de la FAQ du site. Puis le CTA | Obtiens ton score |
| G6 | Carrousel, 7 slides | Mythe ou data | « Freiner plus tard = plus rapide ? Pas toujours. » | Virage 6 de la démo : le passage le plus rapide freinait 26 m plus tôt (43 m contre 17 m de l'apex). Pourquoi : on rend les freins avant l'inscription, on ressort mieux placé, et c'est la sortie qui paie sur la ligne droite. Puis « Ce que ta data peut te dire », puis le CTA | Enregistre-le pour ta prochaine session |
| G7 | Reel, ~12 s | Le delta | « +0,51 s. Sur un seul tour. » | Voir le séquencier du §10.3 | Trouve où tu perds tes dixièmes |
| G8 | Carrousel, 6 slides | Le carnet d'ingénieur | « Ton kart. Tes réglages. Ta saison. » | Mon Kart (santé, heures moteur, tours de pneus), puis le Carnet d'Ingénieur Digital (réglages par circuit, recommandations), l'historique des journées et le calendrier. Puis « Au même endroit. » et le CTA Racer | Passe Racer, 9,90 €/mois |
| G9 | Post unique, rouge | Pourquoi ApexAI | « Ton chrono te dit combien. Jamais pourquoi. » | Un manifeste court et « Projet lauréat du 36h Chrono (PÉPITE Provence) » (formulation à valider). Typographie seule, avec repères de construction. Sans nom ni visage par défaut | Abonne-toi pour la suite |

**Exemple du niveau de légende attendu (G4) :**
```
Ton meilleur tour n'est pas ton meilleur tour.

Sur cette session de démo à Adria, le meilleur tour tombe en 49.68s. En enchaînant les meilleurs mini-secteurs de la session, l'IA trouve un tour à 48.45s.

Ces 1,23 s, le pilote les a déjà faites. Juste jamais dans le même tour.

C'est le Tour Parfait IA : il te montre où tu as déjà été rapide, pour que tu le refasses partout.

→ 1re analyse offerte, sans compte : lien en bio.

#karting #kartingfrance #mychron #telemetrie #apexairacing
```

**Règles des légendes :**
- la 1re ligne est l'accroche, en 125 caractères au plus (au-delà, Instagram coupe avec « … plus ») ;
- 60 à 180 mots au total ;
- un seul CTA ;
- 3 à 5 hashtags, à la fin ;
- un texte alternatif de 1 à 2 phrases descriptives, avec les mots-clés.

### 8.3 Ordre et rythme de publication (J1)
**Ordre :** on publie de la case la plus ancienne vers la plus récente : G9 → G8 → G7 → G6 → G5 → G4 → G3 → G2 → G1.

**Épinglage :** on épingle ensuite G3, puis G2, puis G1, et on vérifie que l'ordre affiché est G1-G2-G3. Sinon, on désépingle et on réépingle dans l'ordre inverse.

**Horaires :**
- le matin : G9 à G4, espacés de 20 à 30 minutes ;
- en début d'après-midi : G3 puis G2 ;
- entre 18 h 30 et 19 h : G1, le reel héros, suivi de la séquence de stories J1.

Tout peut être programmé la veille dans Meta Business Suite. G1, G4, G7 et G3 sont partagés en story dans l'heure qui suit leur publication.

---

## 9. Stories

### 9.1 Séquence J1 (`out/02-stories-j1/`)
| # | Type | Contenu | Sticker (ajouté dans l'app par Yanis) |
|---|---|---|---|
| S1 | Vidéo, 6 s | Révélation du logo (scène V03 du 9:16), « Nouveau sur Instagram. » et la signature sonore | — |
| S2 | Image | « Tu regardes ta data après chaque session ? » | Sondage : « À chaque fois » / « Parfois » / « Jamais » |
| S3 | Vidéo, 8 à 10 s | Import, analyse, score : extrait du 9:16 (V04-V05), accroche ajoutée | — |
| S4 | Image | « Ton plus gros point faible ? » | Sondage : « Freinage » / « Vitesse en courbe » / « Régularité » |
| S5 | Image | « 1re analyse offerte. Sans compte. » et la carte de l'upload | Lien → /upload (`utm_content=s5-j1`) |
| S6 | Image | « Compatible MyChron 5 et 6 (export CSV Race Studio). » | Question : « Une question sur ApexAI ? » |

Chaque story existe en deux versions :
- une version guide (`Sx-guide.png`), qui montre où placer le sticker ;
- la version à publier, sans ce repère.

### 9.2 Contenus des stories à la une (`out/03-a-la-une/`)
- **Tuto (3 stories) :**
  - **« Exporte ton CSV » :** dans Race Studio, ouvre la session et exporte-la en CSV. Reste générique sur les menus, sauf si Yanis fournit des captures. Ajoute l'astuce : fichier trop lourd → réduis les canaux ou décime à 1:10.
  - **« Importe-le » :** sur apexai.racing, sans compte pour la 1re analyse.
  - **« Lis ton analyse » :** le score, le Tour Parfait, les conseils classés par temps perdu.
- **FAQ (4 stories) :**
  - **Quels boîtiers ?** Avec la mention AiM.
  - **C'est combien ?** Prix du §2.2.
  - **Et mes données ?** La réponse renvoie vers apexai.racing/legal/confidentialite, sans promesse inventée.
  - **Il faut être ingénieur ?** Non : les conseils sont rédigés en clair, virage par virage.
- **Démo, Conseils, Offres, Histoire :** elles se remplissent avec les partages en story des posts G1 à G9. Prévois pour chacune une story d'ouverture, titrée dans le style de sa couverture.

---

## 10. Reels

### 10.1 Spécifications
- **Masters :** 1080×1920, 60 i/s, H.264 CRF 16, yuv420p BT.709, avec les options de rendu du `README-RENDU.md`.
- **Exports Instagram :** 30 i/s, H.264 High, CRF 17, maxrate 25M, AAC 48 kHz à 256 kb/s, `+faststart`.
- **Son :** environ −14 LUFS intégrés, crête vraie ≤ −1 dBTP.
- **Chaque reel a :**
  - une couverture conçue à part (`cover.png`, zone de titre du §5.2) ;
  - une signature de fin : le logo et la signature sonore, en 1,5 à 2 s au plus ;
  - le label « Session de démo · Adria Karting Raceway » dès qu'un chiffre apparaît.

  Exception : G1 reprend le film tel quel, sans ce label. C'est sa légende qui précise « session de démo ».

### 10.2 G4 — Tour Parfait IA (~14 s)
| s | Image | Son |
|---|---|---|
| 0,0–1,2 | Dès l'image 0, « Ton meilleur tour » est à l'écran. Puis « n'est pas ton meilleur tour. » entre en BlurWords, avec « meilleur tour » de la 2e ligne en dégradé | impact doux + whoosh |
| 1,2–3,6 | La trace d'Adria se dessine avec les couleurs de vitesse réelles et une tête lumineuse. Compteur « Meilleur tour 49.68s » | balayage électrique |
| 3,6–6,6 | Les mini-secteurs s'allument en or un par un. C'est une illustration du principe : n'attribue aucun tour précis à un secteur. La ligne Tour IA se compose en pointillés dorés. Compteur « Tour idéal 48.45s » | ticks montants + shimmer |
| 6,6–8,6 | Chiffre héros « −1,23 s » en vert, en DecodeText, avec « à aller chercher » | glitch-blip + impact |
| 8,6–11,0 | « Tu l'as déjà roulé. », puis « Juste pas dans le même tour. » | swoosh |
| 11,0–13,0 | Fin : logo, « Découvre ton tour idéal », « 1re analyse offerte · sans compte », apexai.racing | signature sonore |
| 13,0–14,0 | Raccord vers l'image 0 : la trace se replie en ligne de texte | reverse-whoosh |

### 10.3 G7 — Le delta (~12 s)
| s | Image | Son |
|---|---|---|
| 0,0–1,0 | Dès l'image 0, « +0,51 s » est à l'écran, rouge et énorme, avec « Sur un seul tour. » | impact grave |
| 1,0–5,0 | Duel fantôme T4 contre T9 sur la vraie trace (même logique que V02 et S02). Les segments perdus s'allument en rouge. HUD de l'écart en direct | ticks de virage, tonalité montante |
| 5,0–5,6 | « Où ? » plein cadre, puis plongée sur le virage 10 | whoosh-dive |
| 5,6–8,4 | Carte « Priorité 1 · Virage 10 » (interface exacte), avec le surlignage doré du conseil. « L'IA classe chaque virage par temps perdu. » | swoosh + marker |
| 8,4–10,2 | La carte « Priorité 2 · Virage 6 » glisse devant ; les deux s'empilent en 3D | swoosh |
| 10,2–12,0 | Fin et raccord de boucle | signature sonore |

Ne dis jamais que les 0,51 s se décomposent en 0,27 + 0,16 : ces chiffres n'ont pas la même référence.

### 10.4 Autres vidéos à livrer
- `logo-sting-9x16.mp4` et `logo-sting-1x1.mp4`, 2,5 s chacun, tirés de la révélation du logo (S04 et V03).
- Les stories S1 et S3 (§9.1).
- Le reel de la semaine 2 (§12).

---

## 11. Sound design
Yanis l'a demandé explicitement : « des sons de fluidité, il n'y a aucun son ».

### 11.1 Intention
Le son doit être **fluide, aérien, précis et premium** :
- des souffles qui suivent le mouvement ;
- des clics d'interface feutrés ;
- des impacts graves et ronds ;
- des scintillements légers.

C'est le son d'une interface haut de gamme, pas celui d'un dessin animé. Jamais de son de jeu vidéo, de klaxon, de « ding » criard ni de moteur caricatural.

### 11.2 Bibliothèque
Synthétise une bibliothèque originale, entièrement libre de droits. Utilise Python (numpy, scipy, soundfile, pyloudnorm, pedalboard) s'il est disponible, sinon Node avec écriture de fichiers WAV.
- **Formats :** WAV 48 kHz 24 bits dans `out/07-son/sfx/`, et une copie MP3 320 kb/s dans `apexai-video/public/sfx/`.
- **Noms exacts attendus par `cues.json` :** whoosh-soft, swish, kart-pass, impact-low, impact, reverse-whoosh, riser, riser-short, impact-shimmer, glitch-blip, whoosh-deep, decode-chirps, swoosh, ui-tick, drag, thunk, pops, click, whoosh, processing, success-chime, whip, counter-ticks, whoosh-dive, electric-sweep, shimmer, pings, marker, hit, fly-through, whooshes, blips, soft-impact, click-ding, tick-corner.
- **Variantes panoramiques** pour les mouvements latéraux (`whip-lr`, `whip-rl`) : le son suit la direction du mouvement.

**Recettes de départ**, à affiner à l'oreille :
- **Whoosh :**
  - bruit rose filtré en passe-bande, dont le centre balaie de 300 Hz vers 2,5–4 kHz puis redescend ;
  - enveloppe calée sur la courbe de mouvement, avec le pic au moment où la vitesse est maximale ;
  - canaux gauche et droit décorrélés, petite réverbération (wet ~0,15).
- **Clic / tick :** transitoire de 3 à 8 ms (sinus de 2 à 4 kHz à décroissance exponentielle + souffle très court), avec un corps à 400–600 Hz à −12 dB.
- **Pop :** sinus qui glisse de 300 à 900 Hz en 40 ms.
- **Impact :** sinus qui descend de 110 à 45 Hz en 250 ms, bruit passé au passe-bas à 3 kHz, queue de réverbération.
- **Impact-shimmer :** l'impact, plus une cloche FM aiguë (quinte juste) qui décroît en 1,5 s, avec un léger chorus.
- **Riser :** bruit et sinus qui montent de 200 à 2000 Hz, passe-haut progressif, crescendo exponentiel, coupure nette.
- **Decode-chirps :** micro-glissés de 10 à 20 ms sur une gamme pentatonique, un toutes les 50 ms, au rythme des glyphes.
- **Success-chime :** deux notes de cloche douce.
- **Kart-pass :** moteur 2-temps de synthèse (dent de scie à 180–250 Hz, harmoniques et souffle), effet Doppler de ±8 %, panoramique de gauche à droite, discret.

### 11.3 Signature sonore
`sonic-logo.wav` dure environ 1,6 s : un impact grave et rond, un scintillement en quinte et un micro-crépitement électrique, pour l'éclair. Elle est jouée à chaque apparition du logo. C'est l'équivalent sonore du symbole.

### 11.4 Mixage
Le mixage se fait **hors Remotion**, avec un script :
1. Il lit une liste de repères : `cues.json` pour les films, une liste dédiée pour chaque nouveau reel.
2. Il place chaque son avec son gain, son panoramique et son pré-roll.
3. Il passe le tout dans un bus léger : compression douce et limiteur.
4. Il normalise.
5. Il assemble l'audio sur la vidéo. Quand le master ne change pas, il ne réencode pas l'image (`-c:v copy`).

Réglages :
- **Pré-roll :** chaque son démarre 2 à 4 images avant le mouvement.
- **Niveaux de départ :** impacts à −6 dBFS en crête, whooshes à −12, sons d'interface à −18.
- **Tolérance de synchro :** ±1 image.
- **Silence :** on garde les 2 images de silence avant les drops du film.
- **Musique :** aucune par défaut.
  - Les vidéos sont livrées avec les effets seuls, et elles doivent tenir sans musique.
  - Le script accepte une piste optionnelle (`music.mp3`) et baisse alors automatiquement les effets.
  - Le README explique comment ajouter dans l'app un morceau de la bibliothèque libre de droits d'Instagram, à 10–20 % du volume.

### 11.5 Films existants
Sonorise `apexai-promo-16x9.mp4` et `apexai-promo-9x16.mp4` à partir de `cues.json`. Les instants des ticks de virage se calculent avec `cues.ts`.

Livre dans `out/06-videos-sonorisees/` :
- les deux masters avec son, sous leur nom d'origine suffixé de `-son` ;
- `apexai-promo-9x16-ig.mp4`, l'export Instagram à 30 i/s ;
- une planche de contrôle de la synchro : forme d'onde, avec une vignette à chaque repère.

---

## 12. Calendrier sur 4 semaines (`out/04-calendrier/`)

J1 est la date réelle du lancement. Demande-la à Yanis ; sans réponse, prends le lendemain de l'exécution.

Le rythme suit les week-ends de roulage :
- **Lundi, 19 h — Débrief.** Pédagogie data ou décryptage, au moment où les pilotes ont des données fraîches. Plus une story « Tu as roulé ce week-end ? Analyse ta session », avec le lien.
- **Mercredi, 19 h — Produit.** Un reel ou un carrousel sur une fonctionnalité.
- **Vendredi, 18 h — Prépa week-end.** Un conseil court, applicable en piste.
- **Stories :** 4 à 6 par semaine au minimum, dont au moins 1 sondage ou 1 question.

Ces horaires sont à ajuster après 2 semaines de statistiques.

**Séries récurrentes**, pour que le compte soit reconnaissable :
- « Virage décrypté #n » (carrousel) ;
- « La data ne ment pas #n » (reel : un chiffre, une leçon) ;
- « Mythe ou data ? » (carrousel) ;
- « Dans l'app » (une fonctionnalité, par exemple la comparaison de sessions ou le rapport PDF) ;
- « Débrief du lundi » (story) ;
- « Coulisses » : uniquement des nouveautés réelles fournies par Yanis.

**Semaine 2, à produire entièrement :**
- « Virage décrypté #1 · Virage 10 » : le freinage dégressif (trail braking), 55 → 58 km/h à l'apex, 0.27s par tour.
- « La data ne ment pas #1 · 3,33 s entre ton pire et ton meilleur tour » (reel) : la régularité, avec une cohérence de 1.15 s.
- « Dans l'app · Mon Kart ». Avant d'écrire, vérifie dans `ref/code/KartHealthStatus.tsx` et `WearGauge.tsx` ce qui est réellement automatique.

**Semaines 3 et 4 :** des briefs prêts à produire, avec l'accroche, les slides, les données sources, le CTA et la légende.

Formats à livrer : `calendrier.csv` (date, heure, format, série, sujet, CTA, statut) et `calendrier.md`.

---

## 13. Playbook CM (`out/playbook-cm.md`)

- **Routine quotidienne (15 à 20 min) :**
  - répondre à chaque commentaire et message dans l'heure qui suit une publication, et sous 24 h le reste du temps ;
  - laisser un commentaire utile sur 5 à 10 publications de comptes karting : circuits, clubs, championnats, coachs, préparateurs, médias ;
  - partager en story.
- **Réponses types :**
  - **« Ça marche avec mon boîtier ? »**
  - **« C'est combien ? »**
  - **« Quelle différence avec Race Studio ? »** Réponse factuelle, sans dénigrer : « Race Studio te montre tes courbes ; ApexAI les lit pour toi et te dit quoi changer, virage par virage. »
  - **« Et mes données ? »**
  - **« Je n'ai pas de MyChron »** : on ne promet aucun format, on demande quel boîtier la personne utilise.
  - **Critique ou troll.**
- **Partenariats :** un modèle de message pour les circuits, les clubs et les coachs (posts en collaboration, analyse d'un tour sur leur piste, avec leur accord). Uniquement des catégories : aucun nom inventé.
- **Défi data :** un abonné envoie son CSV et on le décrypte en story, avec son consentement écrit au préalable et des données anonymisées. C'est la source des futurs vrais témoignages.
- **Indicateurs à suivre chaque semaine :**
  - comptes touchés et part de non-abonnés ;
  - enregistrements et partages par post ;
  - visites du profil et clics sur le lien ;
  - analyses, inscriptions et abonnements Racer attribués aux liens UTM.

  Les objectifs chiffrés se fixent au bout de 2 semaines, une fois la base mesurée.
- **Revue du lundi :** les 3 contenus qui ont le mieux marché et les 3 qui ont le moins marché, pourquoi, et l'ajustement prévu pour la semaine.
- **Plus tard :** les reels d'essai d'Instagram, diffusés d'abord aux non-abonnés, pour tester deux accroches d'un même reel.

---

## 14. Kit publicité, préparé mais pas lancé (`out/05-pub/`)

- **3 créas**, dans les zones sûres publicitaires du §5.2 :
  - G1 recoupé en ~15 s (nouvelle composition qui réutilise les scènes du 9:16) ;
  - G4 ;
  - le carrousel Offres, en visuel 4:5.
- **Pour chaque créa :** 2 textes principaux, 2 titres, 1 description, et le CTA « En savoir plus » ou « S'inscrire ».
- **Ciblage proposé :** France, intérêts karting et sport auto, placements Reels, Stories et fil, un petit budget de test réparti sur les 3 créas. Les montants sont à décider par Yanis.
- **Blocage à signaler en tête du fichier :** pas de publicité tant que la landing affiche des statistiques et des témoignages fictifs (§20).

---

## 15. Gabarits réutilisables (pour que Yanis continue sans Canva)

Chaque type de post devient une composition Remotion avec un **schéma zod** (`zod` et `@remotion/zod-types`). Installe la version de zod demandée par la documentation de ta version de Remotion ; vérifie-la avec le skill Remotion.

Pour créer un post, Yanis :
1. lance `npx remotion studio` ;
2. choisit un gabarit ;
3. modifie les textes et les chiffres dans le panneau de droite ;
4. clique sur Render.

Gabarits à créer :
- `T-Couverture` : titre et héros ;
- `T-Carrousel` : tableau de slides (titre, texte, visuel choisi dans une liste) ;
- `T-ChiffreHeros` ;
- `T-Declaration` : aplat rouge ;
- `T-Conseil` : virage, titre, texte, gain ;
- `T-Story` : titre et zone de sticker ;
- `T-CouvertureReel` ;
- `T-Offre`.

Les posts du lancement sont produits avec ces gabarits autant que possible, et leurs props sont rangées dans `src/social/posts/*.json`. Les pièces sur mesure (panorama, reels) peuvent être des compositions dédiées.

Documente l'usage des gabarits en 5 étapes dans le README, avec les commandes PowerShell pour Windows.

---

## 16. Architecture technique

- **Projet :** étends le projet Remotion existant `apex-promo-video/apexai-video/`. Il contient déjà les polices locales, la charte, `TrackMap`, `Logo`, les effets et les écrans recréés.
  - Ajoute un dossier `src/social/` (kit, gabarits, compositions, données des posts) et déclare les nouvelles compositions dans `Root.tsx`.
  - **Aucune scène existante n'est modifiée.** Si tu extrais un composant partagé, prouve que les deux films n'ont pas bougé : les images 300, 1500 et 2500 du 16:9, et 300, 900 et 1300 du 9:16, doivent être identiques avant et après (empreinte SHA-256).
- **Scripts :**
  - `scripts/sfx/` : synthèse et mixage du son ;
  - `scripts/export-social.mjs` : rend tous les visuels et toutes les vidéos d'une liste, puis les range dans `apex-social/out/` ;
  - `scripts/pdf-charte.mjs` : assemble la charte en PDF avec `pdf-lib`.
- **Rendus fixes :**
  - `npx remotion still <id> <fichier>.png`, en sRGB ;
  - livre des PNG, la meilleure base avant la recompression d'Instagram ;
  - un grain de 3 à 4 % évite les bandes dans les dégradés ;
  - pas de trait isolé de 1 px, qui scintille après recompression : 2 px au minimum.
- **Vidéo :** options de rendu du `README-RENDU.md` (`--image-format=png --pixel-format=yuv420p --color-space=bt709`).
- **Déterminisme :** pas de `Math.random`, pas de `Date.now()`, pas d'animation CSS. Tout se déduit de la frame.
- **Charte :** aucune couleur hexadécimale en dur dans `src/social/` en dehors de `theme.ts`. Vérifie-le avec un grep.
- **Option :** si ta session dispose de l'outil Artifact et du type « Design System », publie aussi la charte sous ce type (tokens, typographie, logo, composants). Les futurs decks et designs Claude pourront la réutiliser.

---

## 17. Arborescence des livrables (`Desktop/ApexAI/apex-social/`)

```
apex-social/
  PROMPT_DA_CM_APEXAI.md
  README-SOCIAL.md                 ← guide de Yanis : profil, J1 pas à pas, gabarits, routine, indicateurs
  brand/
    logo/                          ← kit du §6.1
    boards/                        ← planches : logo, couleurs, typo, signatures, gabarits, motion et son
    charte-reseaux-apexai.pdf      ← 10 pages en 1920×1080
  out/
    00-profil/      avatar-rouge-1080.png  avatar-noir-1080.png  profil.md  a-la-une/*.png
    01-lancement/   G1-manifeste/ … G9-pourquoi/   (fichiers à publier + caption.md + cover.png)
    02-stories-j1/  S1…S6 (+ versions guide)
    03-a-la-une/    tuto-01…03  faq-01…04  stories d'ouverture
    04-calendrier/  calendrier.csv  calendrier.md  semaine-2/…
    05-pub/
    06-videos-sonorisees/
    07-son/         sfx/*.wav  sonic-logo.wav  mixes/
    playbook-cm.md
    legendes.md                    ← toutes les légendes et tous les textes alternatifs, dans l'ordre de publication
    qa/             profil-mockup.png  planches/  avatar-tailles.png  rapport-qa.md
```

---

## 18. Processus

### Phase 0 — Audit, avant tout code
- Lis ce document, `PROMPT_MOTION_APEXAI.md`, `README-RENDU.md`, `tokens.json` et `ui-data.json`.
- Regarde chaque capture de `ref/screens/`, ainsi que la planche du film `out/stills/styleframes-planche.png`.
- Fais l'inventaire des composants réutilisables de `apexai-video/src/`.
- Vérifie l'environnement (node, ffmpeg via `npx remotion ffmpeg`, python et ses bibliothèques) et choisis ta chaîne audio.
- Calcule les empreintes de référence des deux films (§16).

### Phase 1 — Fondations et couvertures
1. Le kit logo, les avatars et les couvertures « À la une ».
2. Le kit social et les gabarits zod. Composants du kit : `PostFrame`, `StoryFrame`, `ReelCover`, `HeroNumber`, `TrackRibbon`, `FloatingCard`, `RedPanel`, `SectorBar`, `Footer`.
3. La bibliothèque de sons, la signature sonore et le 9:16 sonorisé.
4. Les 9 couvertures de la grille, panorama compris, et la **maquette du profil** (`qa/profil-mockup.png`). C'est un téléphone générique, sans logo Instagram, qui montre à l'échelle réelle l'avatar, le nom, la bio, les « À la une » et la grille 3×3.
5. **Regarde tout toi-même** à l'échelle d'un téléphone, et corrige jusqu'à atteindre le niveau.

**→ Point de contrôle non bloquant.** Montre à Yanis la maquette du profil, la planche logo et le 9:16 sonorisé, avec 5 lignes d'intention. **Continue sans attendre sa réponse.** S'il répond, intègre ses retours avant les rendus finaux : les gabarits rendent ces reprises peu coûteuses.

### Phase 2 — Kit J1
- Tous les carrousels, et les reels G4 et G7.
- Les stories J1, Tuto et FAQ.
- Les légendes, textes alternatifs et hashtags.
- Les exports Instagram et le 16:9 sonorisé.

### Phase 3 — Système et suite
- La semaine 2, produite entièrement, et les briefs des semaines 3 et 4.
- Le playbook, le kit pub, la charte en PDF et le README-SOCIAL.

### Phase 4 — QA et rapport
Vérifie la liste du §19, puis rédige le rapport du §20.

---

## 19. Définition de « terminé »

- [ ] Tous les livrables du §17 sont présents et nommés comme indiqué.
- [ ] Les formats et zones sûres du §5.2 sont respectés, avec un contrôle visuel sur des planches où les zones sont tracées.
- [ ] La maquette du profil montre une grille cohérente : le panorama se lit, deux tuiles rouges ne se touchent jamais par un côté, chaque couverture a un seul héros.
- [ ] Chaque chiffre vient du §2.2.
- [ ] Aucun élément de la liste interdite n'apparaît, même en arrière-plan. Fais une recherche automatique dans les textes de `src/social/` et dans les légendes, puis une vérification visuelle.
- [ ] Les prix sont exacts : 9,90 €/mois et 99 €/an pour Racer, Rookie et Invité tels que sur le site. Team n'apparaît pas.
- [ ] La mention AiM est présente partout où elle est requise. Aucun logo tiers.
- [ ] La typographie française est correcte, le tutoiement respecté, « 1re » bien écrit.
- [ ] Les longueurs sont vérifiées par script : bio ≤ 150 caractères, nom ≤ 30, 1re ligne des légendes ≤ 125, 5 hashtags au maximum.
- [ ] Chaque reel :
  - a une image 0 lisible, une fin bouclable et une couverture conçue à part ;
  - a un son synchronisé à ±1 image ;
  - est mesuré à environ −14 LUFS, avec une crête ≤ −1 dBTP.
- [ ] Les films existants sont identiques à l'image près, et désormais sonorisés.
- [ ] Le rendu est déterministe et n'utilise aucune couleur hors charte.
- [ ] `apex-ai-fresh/`, `backend/` et `input/` n'ont pas été modifiés.

---

## 20. Rapport final (`out/qa/rapport-qa.md`, plus un message à Yanis)

1. **Livrables :** une ligne par dossier.
2. **La check-list J1**, à suivre telle quelle : réglages du profil, ordre et horaires de publication, épinglage, « À la une », stories et stickers.
3. **Les décisions de DA** prises seul, et les écarts au prompt, avec leur raison.
4. **Les entrées à confirmer par Yanis**, avec la valeur par défaut utilisée :
   - l'identifiant (@apexai.racing) ;
   - la formulation du prix du 36h Chrono ;
   - les formats annoncés (MyChron 5 et 6 uniquement) ;
   - la signature du post G9 (anonyme par défaut) ;
   - la date de J1 ;
   - la musique (aucune par défaut).
5. **À corriger sur le site avant toute publicité.** Signale ces points, ne modifie rien :
   - les statistiques fictives de la landing (12,847 tours, +1.2s, 99 %) ;
   - les témoignages fictifs ;
   - la phrase de la FAQ sur le « gain moyen de 1,2 seconde » ;
   - « la première plateforme » ;
   - la compatibilité « RaceBox et autres », incohérente avec la FAQ.

   Ces éléments mettent en jeu la crédibilité du compte, exposent les publicités à un refus de Meta et relèvent de la pratique commerciale trompeuse.
