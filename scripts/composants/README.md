# Base des composants de karting

`data.py` rassemble les valeurs relevées dans les manuels constructeurs et les règlements 2026 (catégories françaises, fiches moteurs, opérations d'entretien, pneus imposés, châssis, freins, carburateurs). Chaque ligne porte sa source et sa page ou son article. Une valeur que les documents ne donnent pas reste vide : rien n'est estimé.

`build_xlsx.py sortie.xlsx` produit le tableur à vérifier, avec l'onglet « Écarts catalogue » qui compare la table `kart_components` de l'app aux documents.

Prochaine étape après relecture : mettre à jour `kart_components` (durées de vie, unité « litres » pour IAME, nouveaux pneus et carburateurs) et ajouter une table des catégories 2026 pour préremplir Mon Kart et Réglages.
