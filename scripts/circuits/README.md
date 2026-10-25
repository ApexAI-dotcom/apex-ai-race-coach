# Base des circuits de karting de France

Scripts qui construisent la base de référence des circuits (fiches + tableur à vérifier). Toutes les étapes se relancent sans tout retélécharger : les extraits OSM et les réponses Nominatim sont mis en cache dans le dossier de travail.

| Étape | Script | Entrée → sortie |
|---|---|---|
| 1 | `ffsa_list.py` | page publique FFSA « Où pratiquer » → circuits, clubs et écoles de karting (`ffsa_candidates.json`) |
| 1 bis | `nominatim_search.py` | recherche « karting / kart + département » → `nominatim_hits.json` |
| 1 ter | `nominatim_names.py` | recherche par nom + commune des structures FFSA sans piste trouvée → `name_hits.json` |
| 1 quater | `name_points.py` | positions relocalisées + nouveaux points à télécharger |
| 2 | `fetch_osm.py` | extrait OpenStreetMap (API « map », ~1,6 km²) autour de chaque point → `osm/*.xml` |
| 3 | `extract_tracks.py` | pistes de karting reconstituées (tronçons recollés) → `tracks.json` |
| 4 | `build_dataset.py` | une fiche par site, structures FFSA rattachées, tracés mesurés par les pilotes, géométrie → `circuits.json`, `clubs.json` |
| 4 bis | `enrich_places.py` | commune / département des fiches sans adresse (géocodage inverse) |
| 5 | `build_xlsx.py` | tableur à vérifier (Synthèse, Circuits, Virages, Clubs FFSA, Sources) |
| 6 | `build_gallery.py` | page de vérification visuelle (`gallery_template.html`) : une vignette par tracé, virages colorés |

`track_geometry.py` calcule la longueur et les virages d'un tracé (épingle ≥ 130°, rapide < 60° ou courbe large, moyen sinon). Le calcul repose sur la géométrie, il est donc indépendant du kart.

Politesse envers les services OSM : 1 requête toutes les 1,1 à 1,5 s, User-Agent `ApexAI-circuits/1.0 (contact@apexai.racing)`.

Licence des données : les tracés viennent d'OpenStreetMap (© contributeurs OSM, ODbL). Il faut citer « © OpenStreetMap » partout où un tracé est affiché. Si la base dérivée est publiée telle quelle, elle doit l'être sous ODbL. Un usage interne dans l'app ne pose pas de problème.
