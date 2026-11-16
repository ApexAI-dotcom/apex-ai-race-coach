# Stratégie contenu ApexAI : Instagram + TikTok

*Créée le 16/11/2026. Ce document fait foi pour le studio de contenu automatique. Le studio le met à jour (sections « Ce qui marche » et « Journal ») ; Yanis peut tout changer.*

## Objectif
Devenir LA référence française du « karting expliqué par la data ». On vise :
- de la portée : partages, enregistrements, abonnés de vrais pilotes ;
- de la crédibilité : on apprend vraiment quelque chose ;
- des inscriptions sur apexai.racing.

Le volume vient de la constance : un contenu de qualité chaque jour, jamais de remplissage. Tous les contenus sont pensés pour être réutilisables plus tard en publicité.

## Cible
- **Pilotes de 12 à 30 ans** : Rotax, X30, KZ, loisir-compétition, Grand Ouest puis France.
- **Parents de jeunes pilotes.**
- **Coachs et moniteurs.**

Ils veulent aller plus vite, comprendre leurs données, et voir des virages qu'ils connaissent.

## Promesse éditoriale
« Ton ingénieur de course IA. » Chaque contenu répond à une question qu'un pilote se pose vraiment, avec une preuve visuelle : une trace, un chiffre, un virage.

## Piliers (rotation sur la semaine)
1. **Virage décrypté** : un virage, ce qui fait gagner ou perdre du temps, une consigne simple.
2. **Apprendre (data)** : lire sa télémétrie (freinage, point de corde, réaccélération, régularité, tour idéal).
3. **Mythe ou data** : une croyance du paddock confrontée aux données (« freiner plus tard = plus vite ? »).
4. **Dans l'app** : une fonction montrée en 10 s, du fichier de session au conseil.
5. **Coulisses fondateur** : Yanis, 19 ans, pilote qui construit son app. Paddock, décisions, erreurs. Seulement avec ses rushes ou sa validation.
6. **Communauté pilotes** : questions reçues, défis, « envoie ton fichier, on décrypte » (avec accord, jamais de nom tiré d'un fichier).
7. **Culture karting** : catégories, réglages, pneus, entretien (base de composants sourcée de l'app).

## Rythme et horaires (heure de Paris)

| Format | Plateformes | Quand |
|---|---|---|
| 1 reel par jour | Instagram + TikTok | 18 h 45 (sortie des cours et du travail) |
| 3 carrousels par semaine | Instagram | Mardi, jeudi et samedi vers 11 h 45 |
| TikTok en plus | TikTok | Dès que les premières vidéos dépassent la moyenne : 2e vidéo à 12 h 30 (variante d'accroche ou recoupe d'un reel) |
| Stories | Instagram | Quand il y a de la matière (paddock, sondage, coulisses), pas forcées |

Le studio ajuste les horaires à partir des statistiques après 3 semaines.

## Formule d'un reel (15 à 35 s)
| Temps | Rôle |
|---|---|
| 0–2 s | Accroche visuelle + texte : une tension, une question, un chiffre (« Tu perds 0,3 s ici sans le savoir. ») |
| 2–8 s | Le problème, montré : trace, comparaison de deux tours, virage |
| 8–25 s | L'explication : une seule idée, un seul conseil actionnable |
| Fin | Boucle ou carte de fin (« Va chercher tes dixièmes. »), puis l'appel à l'action en légende plutôt qu'à l'écran |

Production :
- sous-titres incrustés ;
- musique discrète sous la voix ;
- sons espacés (règle de la charte : ≥ 0,9 s entre deux sons) ;
- zone sûre reel x 80–940, y 260–1480.

## Le grab : les 2 premières secondes décident de tout
On écrit, on monte et on teste l'accroche avant tout le reste. Une vidéo sans grab ne sort pas.

**Les trois couches, à l'image 0 (rien ne commence en fondu) :**
- **Image** : du mouvement tout de suite (trace qui se dessine, chiffre qui se décode, zoom sur un virage, rush embarqué).
- **Texte** : 3 à 7 mots, très grand.
- **Voix** : la première phrase est l'accroche elle-même, sans « salut » ni présentation.

**Les modèles d'accroche (on varie, et on mesure lequel retient le mieux) :**
- **Chiffre choc vrai** : « 0,27 s par tour. Au même virage. »
- **Erreur commune** : « Tu freines trop tard au virage 1, et ça te coûte. »
- **Question qui pique** : « Pourquoi ton meilleur tour n'est pas ton tour idéal ? »
- **Contre-intuitif** : « Freiner plus tard ne te rend pas plus rapide. »
- **Défi** : « Trouve où ce pilote perd du temps. Réponse dans 10 s. »
- **Identification** : « Si tu roules en Rotax, regarde ça avant ta prochaine séance. »

**Retenir jusqu'au bout :**
- Une boucle ouverte annoncée tôt (« le 3e point est celui que personne ne fait »).
- Une relance visuelle toutes les 2 à 3 s (changement de plan, chiffre, zoom).
- Des sous-titres mot à mot.
- Pas de logo au début. La carte de fin est courte, ou bien on boucle sur l'image du début.

**Mesure :** la rétention à 3 s et le taux de visionnage complet de chaque reel sont notés. Les modèles d'accroche qui retiennent le mieux deviennent la règle.

## Formule d'un carrousel (5 à 8 slides, 4:5)
| Slide | Contenu |
|---|---|
| 1 | Titre de 6 mots au plus, un mot-clé en dégradé, une promesse |
| 2 à 6 | Une idée par slide, un visuel héros par slide |
| Avant-dernière | Le résumé à enregistrer |
| Dernière | « Enregistre pour ta prochaine séance » + apexai.racing |

## Publication (canaux techniques)
- **Instagram** : publication automatique par Windsor.ai (`instagram` → create_video_post / create_carousel_post).
  - Les médias sont commités dans `media/<date>/` de la branche `content-studio` (dépôt public, fichiers < 20 Mo).
  - Ils sont servis par `https://cdn.jsdelivr.net/gh/ApexAI-dotcom/apex-ai-race-coach@<sha du commit>/media/<date>/<fichier>` (sha exact, pas le nom de branche, à cause du cache).
  - Windsor publie immédiatement : c'est la tâche de 18 h 41 qui publie le reel du jour, et celle de 11 h 41 qui publie le carrousel.
- **TikTok** : pas d'API de publication gratuite. Tant que Postiz n'est pas actif (abonnement), la vidéo et la légende sont prêtes dans Notion et Yanis la poste depuis son téléphone (30 s).
  - Une notification lui est envoyée à l'heure prévue.

## Voix ApexAI
- **Voix off** : une voix française unique, signature de la marque. Elle est :
  - naturelle, posée, narrative ;
  - celle de quelqu'un du milieu qui conseille, comme un coach qu'on connaît ;
  - avec de petites hésitations naturelles (eleven_v4, balises de jeu légères).
  - Jamais publicitaire, jamais « voix IA ».
- **Choix de la voix** : par Yanis, l'identifiant est noté ici.
  - **voice_id retenu : `V8kvppYJoYqSL61Tr8Dn` (Sid, grave et dynamique, eleven_v4), choisi par Yanis le 17/11 à 0 h 45 (remplace Nathan Doré).** Sid est très entendue sur TikTok, donc on se l'approprie : écriture de pilote, une même musique d'action tendue (un seul thème ApexAI décliné), et le son signature (`sonic-logo`) toujours sur la carte de fin. La page réglages Notion fait foi s'il change.
  - Si la génération échoue (2 essais par run) : le reel sort sans voix, texte à l'écran + sons.
- **Texte** :
  - tutoiement, phrases courtes, vocabulaire de pilote (dixièmes, inscription, point de corde, réaccélération, tour lancé, train de pneus) ;
  - jamais « apex » (sauf la marque), jamais « CSV » (« fichier de session »), jamais « relais » (« prochaine séance ») ;
  - compatibles : AiM MyChron et Alfano uniquement, jamais RaceBox.
- **Vérité** :
  - les chiffres viennent de vraies séances (données de démo Adria ou séances anonymisées), jamais inventés ;
  - aucune promesse de gain ;
  - aucun nombre d'utilisateurs ;
  - jamais un nom de pilote tiré d'un fichier de session.

## Légendes
- **Instagram** :
  - 1re ligne = l'accroche ;
  - 2 à 4 lignes de valeur ;
  - une question pour les commentaires ;
  - CTA « lien en bio » ;
  - 3 à 5 hashtags spécifiques (banque : #karting #kartingfrance #kartracing #mychron #alfano #telemetrie #rotaxmax #pilotage #apexairacing).
  - Pas de #fyp, pas de #reels.
- **TikTok** : plus court, une phrase + une question, 3 à 5 hashtags (dont #karting #kartingfrance).

## Visuels autorisés
- Gabarits Remotion de la branche `content-studio` (T-Reel, T-Carrousel, T-Conseil, T-ChiffreHeros…) et visuels de l'app (`Visual` : traces, score, tour parfait, coaching…).
- Captures de l'app générées à partir de vraies séances, mises en scène à la charte.
- Rushes de Yanis (dossier `Desktop/ApexAI/rushes` sur son PC, ou envoyés en discussion).
- Images générées par IA :
  - avec parcimonie, en décor seulement ;
  - jamais un kart, une personne ou un circuit réel « faux » ;
  - Yanis vérifie.
- **Interdits** : stats placeholder de la landing, témoignages, données du compte de Yanis, marques tierces sur les visuels publicitaires, clichés (damier, flammes, fumée, carbone).

## Boucle d'apprentissage
- **Chaque jour** : lire les statistiques J+1 et J+3 des contenus publiés et remplir les colonnes Vues, J'aime, Commentaires, Partages, Enregistrements, Abonnés gagnés et Score dans Notion.
- **Chaque lundi** :
  - classer les contenus de la semaine par Score (partages + enregistrements pondérés le plus) ;
  - écrire 3 leçons dans « Ce qui marche » ;
  - ajuster la rotation des piliers, les accroches, la durée et les horaires.
- **Tests** : une variable testée à la fois (accroche, durée, voix ou non, visuel d'ouverture). On garde ce qui gagne.
- **Retours de Yanis** (colonne Commentaire Yanis) : ils deviennent des règles, notées ici.

## Ce qui marche
*(rempli par le studio)*

## Règles apprises
*(retours de Yanis et résultats prouvés)*
- Rendu reel : toujours `--image-format=png --color-space=bt709 --pixel-format=yuv420p`, sinon Remotion sort du yuvj420p (constaté le 16/11).
- T-Reel : l'accroche du 1er temps s'affiche dès l'image 0 (plus de révélation mot à mot au départ) et les temps texte / chiffre sont descendus vers le centre de la zone sûre (ils laissaient 60 % de l'écran vide).
- Carrousel, slide `compare` : deux chiffres signés à 3 décimales (« +0,52 » / « −0,01 ») débordent et se touchent. Au-delà de 3 caractères, passer en slide `number`.
- Musique ElevenLabs : ne pas l'utiliser tant que l'offre ElevenLabs du compte n'est pas confirmée comme couvrant l'usage commercial (l'espace semble en offre gratuite le 16/11). Un fond de 20 s a été généré pour le reel du 17/11, sans voix (vérifié), mais il n'est pas monté.
- Une fiche n'est « Produit » que si le média est commité dans `media/<date>/`, que l'URL jsDelivr répond 200 et que « Lien du média » est rempli (le 16/11, les deux fiches du 17/11 étaient « Produit » sans lien : la publication aurait échoué).
- Carrousel : publication à 11 h 45 (tâche de 11 h 41), pas 12 h 30.
- Sujets déjà traités au lancement (ne pas refaire avant longtemps) : virage 10 (0,27 s), virage 6 / freiner plus tôt (mythe ou data), Tour Parfait IA 1,23 s, score 71/100, carnet, Mon Kart.

## Journal
- 16/11/2026 : création. Gabarit T-Reel, base Notion « Calendrier contenu », tâche quotidienne.
- 16/11/2026 (1er passage, lundi) : aucun contenu publié ces 7 derniers jours (dernier TikTok le 31/10 : 292 vues, 5 % de visionnage complet ; Instagram : rien depuis plus de 30 jours, 1 004 abonnés). Pas de bilan possible : rotation, durées et horaires inchangés. Produits pour le 17/11 : carrousel « Ta courbe delta, enfin lisible » (12 h 30) et reel « Deux virages font tout l'écart » (18 h 45), série « Lire sa télémétrie ». Correctifs du gabarit T-Reel (accroche visible à l'image 0, centrage vertical) et du rendu (yuv420p).
- 16/11/2026 (2e passage, lancement manuel) : réglages et fiches inchangés. Le reel du 17/11 a été revérifié (accroche lisible à l'image 0, 19,6 s, 1080×1920, yuv420p, son présent) : il reste tel quel. La musique générée n'est pas montée, à cause du doute sur la licence.
- 16/11/2026 (3e passage, nuit) : toujours aucun contenu publié sur 7 jours (Instagram 1 004 abonnés, TikTok 0 à 2 vues/jour) : rien à classer. Erreur détectée et corrigée : les médias du 17/11 n'avaient jamais été commités et les fiches n'avaient pas de « Lien du média ». Re-rendu, contrôlé, commité dans `media/2026-11-17/`, liens jsDelivr (sha) posés. Carrousel déplacé de 12 h 30 à 11 h 45. Voix choisie par Yanis (Nathan Doré) : génération tentée 2 fois, refusée (« free generations busy », offre gratuite) → reel du 17/11 sans voix. Une clé Postiz est apparue dans les réglages : pas encore utilisée, en attente de la validation de Yanis sur son usage (TikTok).
