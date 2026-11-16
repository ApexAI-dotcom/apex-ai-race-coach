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
| 3 carrousels par semaine | Instagram | Mardi, jeudi et samedi à 12 h 30 |
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

## Formule d'un carrousel (5 à 8 slides, 4:5)
| Slide | Contenu |
|---|---|
| 1 | Titre de 6 mots au plus, un mot-clé en dégradé, une promesse |
| 2 à 6 | Une idée par slide, un visuel héros par slide |
| Avant-dernière | Le résumé à enregistrer |
| Dernière | « Enregistre pour ta prochaine séance » + apexai.racing |

## Voix ApexAI
- **Voix off** : une voix française unique, signature de la marque. Elle est :
  - naturelle, posée, narrative ;
  - celle de quelqu'un du milieu qui conseille, comme un coach qu'on connaît ;
  - avec de petites hésitations naturelles (eleven_v4, balises de jeu légères).
  - Jamais publicitaire, jamais « voix IA ».
- **Choix de la voix** : par Yanis, l'identifiant est noté ici.
  - **voice_id retenu : _à choisir_.**
  - Tant qu'il n'est pas choisi : pas de voix off, texte à l'écran + musique.
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

## Journal
- 16/11/2026 : création. Gabarit T-Reel, base Notion « Calendrier contenu », tâche quotidienne.
