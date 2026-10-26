# Base des composants de karting

`data.py` rassemble les valeurs relevées dans les manuels constructeurs et les règlements 2026 (catégories françaises, fiches moteurs, opérations d'entretien, pneus imposés, châssis, freins, carburateurs). Chaque ligne porte sa source et sa page ou son article. Une valeur que les documents ne donnent pas reste vide : rien n'est estimé.

`build_xlsx.py sortie.xlsx` produit le tableur à vérifier, avec l'onglet « Écarts catalogue » qui compare la table `kart_components` de l'app aux documents.

Prochaine étape après relecture : mettre à jour `kart_components` (durées de vie, unité « litres » pour IAME, nouveaux pneus et carburateurs) et ajouter une table des catégories 2026 pour préremplir Mon Kart et Réglages.

## Base de l'app (2026-2027)

`catalog.py` assemble `data.py` et les relevés complémentaires (listes d'homologation CIK-FIA des pneus 2024-2026 et des châssis, gammes moteurs 2026, pneus des catégories FFSA et des séries, retours de pilotes) en un seul fichier :

    python3 catalog.py ../../../apexai-backend/src/data/component_catalog.json ../../../apexai-backend/supabase/migrations/20261027010000_component_catalog.sql

- chaque fiche porte ses sources et leur nature (constructeur, règlement, homologation, retour pilotes, presse spécialisée, revendeur, base ApexAI) ;
- les lignes déjà présentes dans `kart_components` gardent leur identifiant et leur nom ; les valeurs héritées sans source sont signalées comme estimations ;
- durée avant révision retenue : celle du constructeur quand elle existe en heures, sinon celle des pilotes (ex. Rotax DD2 : 25 h d'après les pilotes ApexAI, le manuel renvoyant au contrôle complet en centre agréé).

L'API sert la fusion table + fichier (`/api/catalog/components`, `/api/catalog/parts`). La migration SQL élargit les catégories de la table et y copie les fiches : à appliquer après validation.
