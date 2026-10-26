"""
Base composants v1 : données relevées dans les manuels constructeurs et les
règlements 2026. Chaque ligne porte sa source (document + page ou article).
Rien n'est estimé ici : une valeur absente des documents reste vide.
"""

SOURCES = {
    "iame_x30": ("Manuel IAME 125cc X30 (MAN-80)", "https://cdn.shopify.com/s/files/1/0341/9396/5189/files/Manual_IAME_125cc_X30.pdf"),
    "rotax_evo_2016": ("Rotax 125 MAX evo / Junior / Mini / Micro MAX evo : Installation Instructions and Operators Manual (éd. 09/2016)", "https://kart.co.za/wp-content/uploads/2021/02/Installation-Instructions-and-Operators-Manual.pdf"),
    "rotax_dd2_2024": ("Rotax 125 MAX DD2 : Operating Manual 2024", "https://rotax-racing.com/assets/uploads/Engines/KA_Operating-Manual_125MAX_DD2_en_2024_2024-12-06-081458_vvwv.pdf"),
    "vortex_rokgp": ("Vortex ROK GP : manuel d'utilisation", "https://www.vortex-rok.com/gestione/allegati_motori_campionati/194_302.pdf"),
    "vortex_minirok": ("Vortex Mini ROK : manuel d'utilisation", "https://www.vortex-rok.com/gestione/allegati_motori_campionati/142_180.pdf"),
    "honda_gx": ("Honda GX120 / GX160 / GX200 : manuel du propriétaire", "https://engine-sit-01-dmm.engine.honda.ca/-/media/Brands/Engine/21GXSeriesListing/GX160/PDF/00X37Z4V6130.pdf"),
    "ka100_hom": ("IAME KA100 Reedjet : fiche d'homologation Karting Australia (MAJ 17/01/2023)", "https://kartingnetau.r6d.dev/wp-content/uploads/2023/01/IAME-KA100-100cc-REEDJET-Engine-Updated-17-January-2023.pdf"),
    "ffsa_annexe_2026": ("Annexe technique FFSA 2026 au règlement CIK-FIA 2026 (V3, 08/07/2026)", "https://www.ffsakarting.org/regulations/82/view"),
    "eurocup_2026": ("IAME Eurocup Karting 2026 : spécifications techniques", "https://www.iame-motorsport.com/files/noticeboard/Spécifications Techniques Eurocup Karting 2026_03082026033923.pdf"),
    "mojo": ("Rotax : pneus MOJO (gamme et usages)", "https://rotax-racing.com/mojo-tyres"),
    "otk_401rr": ("Tony Kart Racer 401RR : fiche technique", "https://tonykart.com/telai-racer-401RR_en.php"),
    "birel_s16": ("Birel ART : brochure gamme S16", "https://birelart.com/assets/elfinder-2/files/download/brochure/Birel%20ART%20S16%20web.pdf"),
    "crg_heron": ("CRG Heron : fiche technique", "https://kartcrg.com/2019/02/20/heron/?lang=en"),
}

# ---------------------------------------------------------------- Catégories
# (organisateur, catégorie, moteur, pneu sec, pneu pluie, poids mini kg, carburateur, transmission imposée, châssis, autres, source, article)
CATEGORIES = [
    ("FFSA", "Mini Kart", "Moteur d'origine 2 ou 4 temps, 5,5 ch maximum", "Vega Cadetti", "", None, "", "", "Homologué FFSA ou CIK groupe 3 (annexe 7, listes 1 et 4), d'origine", "Magnésium, titane et céramique interdits", "ffsa_annexe_2026", "art. 4"),
    ("FFSA", "Mini 60", "Vortex MINI 60 FR (fiche FFSA « MINI FR »)", "Vega Cadetti", "", None, "Dell'Orto PHBG 18 BS", "", "CIK/FIA groupe 3 ou FFSA (annexe 7, liste 1)", "Allumage Selettra PF5858", "ffsa_annexe_2026", "art. 5"),
    ("FFSA", "Minime", "IAME MINIME FFSA (Gazelle 60 cm³)", "Vega Cadetti", "", None, "", "Pignon 11 dents", "FFSA ou CIK groupe 3 (annexe 7, listes 1 et 4), largeur hors tout 1 200 mm max", "", "ffsa_annexe_2026", "art. 11"),
    ("FFSA", "Cadet", "ROTAX CADET FFSA (Mini MAX 125 cm³), plombé par le délégué technique", "Vega M1", "", None, "", "Pignon 12 dents", "FFSA ou CIK groupe 3 (annexe 7, listes 1, 2 et 3), largeur hors tout 1 200 mm max", "", "ffsa_annexe_2026", "art. 12"),
    ("FFSA", "Nationale", "Rotax 125 (NATIONALE FFSA / J 125 MAX, ou versions EVO)", "Vega SL4", "Vega W6", None, "", "", "Homologué CIK-FIA ou conforme CIK-FIA (acier magnétique, art. 2.1.6 et 2.3)", "Freins avant interdits ; frein arrière mécanique autorisé", "ffsa_annexe_2026", "art. 6"),
    ("FFSA", "Senior / Master / Gentleman", "IAME X30 125 RL TaG ou Rotax 125 MAX / MAX EVO", "Vega XH4", "Vega W6", None, "", "", "Homologué CIK-FIA ou conforme CIK-FIA (acier magnétique)", "Freins avant interdits ; frein arrière mécanique autorisé", "ffsa_annexe_2026", "art. 7"),
    ("FFSA", "KZ2", "Monocylindre à clapets, refroidi par eau, homologué CIK-FIA", "LeCont LOH « Option » ASN FFSA", "LeCont LWR CIK", 175, "Dell'Orto VHSH 30 CS (venturi 30 mm max)", "Boîte et embrayage homologués CIK-FIA", "Châssis et freins homologués CIK-FIA", "180 kg en Master et Gentleman ; récupérateur d'huile obligatoire", "ffsa_annexe_2026", "art. 8"),
    ("FFSA", "Open", "Libre : 2 temps mono ≤ 175 cm³ ; 4 temps mono 4 soupapes ≤ 410 cm³ ; 4 temps bicylindre ≤ 250 cm³", "CIK/FIA Prime ou Option (marque libre)", "Pluie CIK/FIA (marque libre)", 155, "", "", "Acier magnétique (art. 2.1.6 et 2.3 CIK/FIA)", "Suralimentation interdite", "ffsa_annexe_2026", "art. 9"),
    ("FFSA", "Super Kart", "2 temps mono < 750 cm³ ou 4 temps mono/bi < 1 000 cm³, refroidis par eau", "", "", None, "", "", "", "", "ffsa_annexe_2026", "art. 3"),
    ("IAME Eurocup", "X30 Senior", "IAME X30 125 cm³ d'origine (fiche 254A1)", "Komet K3M", "Komet K3W", 158, "Tillotson HW-27A", "Pignons IAME Z10 à Z13", "", "SP98-E5, huile Wladoil K-2T, mélange 4 à 6 %", "eurocup_2026", "art. 14.3, 18.4, 26.1, 34.1"),
    ("IAME Eurocup", "X30 Master / Gentleman", "IAME X30 125 cm³ d'origine (fiche 254A1)", "Komet K3M", "Komet K3W", 167, "Tillotson HW-27A", "Pignons IAME Z10 à Z13", "", "SP98-E5, huile Wladoil K-2T, mélange 4 à 6 %", "eurocup_2026", "art. 14.4"),
    ("IAME Eurocup", "X30 Lady", "IAME X30 125 cm³ d'origine (fiche 254A1)", "Komet K3M", "Komet K3W", 150, "Tillotson HW-27A", "Pignons IAME Z10 à Z13", "", "SP98-E5, huile Wladoil K-2T, mélange 4 à 6 %", "eurocup_2026", "art. 14.5"),
    ("IAME Eurocup", "KA100", "IAME Reedjet KA100 d'origine (fiche 401E)", "Komet K3H", "Komet K3W", 140, "Tillotson HW-33A", "Pignons IAME Z10 à Z12", "", "Deux classes de poids : KA100-140 (140 kg) et KA100-155 (155 kg)", "eurocup_2026", "art. 14.1-14.2, 35.4, 43.1, 51.1"),
    ("Rotax Max Challenge", "Micro MAX / Mini MAX", "Rotax 125 Micro MAX evo / Mini MAX evo", "MOJO C2", "MOJO CW", None, "", "", "", "Pneus MOJO selon Rotax ; poids et rapports selon le règlement de chaque série nationale", "mojo", ""),
    ("Rotax Max Challenge", "Junior MAX", "Rotax 125 Junior MAX evo", "MOJO D2XX", "MOJO W5", None, "", "", "", "Pneus MOJO selon Rotax", "mojo", ""),
    ("Rotax Max Challenge", "Senior MAX / DD2", "Rotax 125 MAX evo / 125 MAX DD2", "MOJO D5", "MOJO W5", None, "", "", "", "Pneus MOJO selon Rotax", "mojo", ""),
]

# ---------------------------------------------------------------- Moteurs (fiche)
# id catalogue ApexAI (None si absent), marque, modèle, cylindrée, refroidissement, boîte, mélange, bougie, huile de boîte, régime, autres, source
ENGINES = [
    ("iame-x30", "IAME", "X30 (125 RL TaG)", 125, "liquide", "non", "Essence 98 RON + huile ≥ 5 % (20:1)", "NGK BR10EG (sec), NGK BR9EG (pluie)", "40 ml EP100 (Wladoil IAME Gear Oil) ou SAE 30", "", "Température de fonctionnement 45 à 65 °C ; avance fixe 22° ; squish 1,0 mm ; jeu à la coupe des segments 0,35 à 0,40 mm", "iame_x30"),
    ("rotax-max-125", "Rotax", "125 MAX evo", 125, "liquide", "non", "1:50 (2 %) huile 2T entièrement synthétique ; rodage 1:33 sur les 10 premiers litres", "NGK Iridium, écartement 0,7 à 0,8 mm, couple 25 à 27 Nm", "100 cm³ SAE 15W-40", "> 13 800 tr/min possibles à vide (réduit la durée de vie)", "Le Micro MAX evo a une bougie spécifique", "rotax_evo_2016"),
    ("rotax-junior", "Rotax", "125 Junior MAX evo", 125, "liquide", "non", "1:50 (2 %) ; rodage 1:33 sur 10 L", "NGK Iridium, 0,7 à 0,8 mm", "100 cm³ SAE 15W-40", "", "Même manuel que le 125 MAX evo", "rotax_evo_2016"),
    ("rotax-mini", "Rotax", "125 Mini MAX evo", 125, "liquide", "non", "1:50 (2 %) ; rodage 1:33 sur 10 L", "NGK Iridium, 0,7 à 0,8 mm", "100 cm³ SAE 15W-40", "", "Moteur de la catégorie FFSA Cadet (version plombée)", "rotax_evo_2016"),
    ("rotax-micro", "Rotax", "125 Micro MAX evo", 125, "liquide", "non", "1:50 (2 %) ; rodage 1:33 sur 10 L", "Bougie spécifique Micro MAX", "100 cm³ SAE 15W-40", "", "", "rotax_evo_2016"),
    ("rotax-dd2", "Rotax", "125 MAX DD2", 125, "liquide", "2 rapports", "1:50 (2 %) ; rodage 1:33 sur 10 L", "NGK (voir catalogue pièces)", "0,150 L SAE 15W-40 (XPS Kart-Tec)", "13 600 tr/min max", "Rodage : rapport long, gicleur 2 tailles plus riche ; 15 min ≤ 10 000 tr/min, 15 min ≤ 12 000 tr/min, 15 min pleine charge ; eau ≥ 55 °C", "rotax_dd2_2024"),
    ("vortex-rok", "Vortex", "ROK GP", 125, "liquide", "non", "Huile 4 % (40 cm³ pour 1 000 cm³)", "Écartement 0,8 mm", "", "", "", "vortex_rokgp"),
    ("vortex-mini-rok", "Vortex", "Mini ROK", 60, "liquide", "non", "Huile 3 % (30 cm³ pour 1 000 cm³)", "Écartement 0,8 mm", "", "", "", "vortex_minirok"),
    ("iame-ka100", "IAME", "KA100 Reedjet", 100, "air", "non", "", "Antiparasite PVL 401 222, NGK TB05EMA ou Selettra « S »", "", "", "Alésage 48,20 mm, course 54,05 mm ; carburateur Tillotson HW-33A ou HL-398A ; allumage Selettra analogique. Aucun intervalle d'entretien publié trouvé", "ka100_hom"),
    ("honda-gx160", "Honda", "GX160", 163, "air", "non (réducteur 2:1 selon version)", "Essence seule (4 temps)", "NGK BPR6ES ou Denso W20EPR-U, 0,7 à 0,8 mm, couple 18 Nm", "Carter : 0,58 L SAE 10W-30 API SJ ou plus", "Ralenti 1 400 tr/min ; 3,6 kW nets à 3 600 tr/min", "", "honda_gx"),
    ("honda-gx200", "Honda", "GX200", 196, "air", "non (réducteur 2:1 selon version)", "Essence seule (4 temps)", "NGK BPR6ES ou Denso W20EPR-U, 0,7 à 0,8 mm, couple 18 Nm", "Carter : 0,6 L SAE 10W-30 API SJ ou plus", "Ralenti 1 400 tr/min ; 4,3 kW nets à 3 600 tr/min", "", "honda_gx"),
]

# ---------------------------------------------------------------- Entretien (une ligne par opération)
# moteur (id catalogue), élément, action, intervalle, unité, usage, source, page
H, L, S = "heures", "litres de mélange", "séance"
MAINTENANCE = [
    # IAME X30 — en litres de mélange consommés
    ("iame-x30", "Piston", "Remplacer (ou dès que le jeu piston/cylindre dépasse 0,14 mm)", 100, L, "compétition", "iame_x30", "p. 8"),
    ("iame-x30", "Piston", "Remplacer (ou dès que le jeu piston/cylindre dépasse 0,14 mm)", 150, L, "loisir", "iame_x30", "p. 8"),
    ("iame-x30", "Cage à aiguilles pied de bielle", "Remplacer", 100, L, "compétition", "iame_x30", "p. 9"),
    ("iame-x30", "Cage à aiguilles pied de bielle", "Remplacer", 150, L, "loisir", "iame_x30", "p. 9"),
    ("iame-x30", "Cage tête de bielle, maneton, cale", "Remplacer", 200, L, "compétition", "iame_x30", "p. 9"),
    ("iame-x30", "Cage tête de bielle, maneton, cale", "Remplacer", 300, L, "loisir", "iame_x30", "p. 9"),
    ("iame-x30", "Roulements de vilebrequin", "Remplacer", 200, L, "compétition", "iame_x30", "p. 9"),
    ("iame-x30", "Roulements de vilebrequin", "Remplacer", 300, L, "loisir", "iame_x30", "p. 9"),
    ("iame-x30", "Bielle", "Remplacer (ou dès que l'ovalisation de la tête dépasse 0,01 mm)", 400, L, "compétition", "iame_x30", "p. 9"),
    ("iame-x30", "Bielle", "Remplacer (ou dès que l'ovalisation de la tête dépasse 0,01 mm)", 600, L, "loisir", "iame_x30", "p. 9"),
    ("iame-x30", "Huile de boîte (carter d'embrayage)", "Vidange complète", 5, H, "tous", "iame_x30", "p. 1"),
    ("iame-x30", "Échappement", "Ouvrir et contrôler les perçages", "10 à 15", H, "tous", "iame_x30", "p. 7"),
    # Rotax MAX evo (125 / Junior / Mini / Micro)
    *[(e, el, ac, iv, un, "tous", "rotax_evo_2016", pg) for e in ("rotax-max-125", "rotax-junior", "rotax-mini", "rotax-micro") for el, ac, iv, un, pg in [
        ("Pignon / chaîne", "Contrôler l'usure et la déformation des dents, remplacer si besoin", "avant chaque roulage", "", "p. 55"),
        ("Pompe à eau", "Contrôler l'absence d'huile ou d'eau au trou témoin du carter", "avant chaque roulage", "", "p. 55"),
        ("Échappement", "Graisser contre la corrosion", "après chaque roulage", "", "p. 55"),
        ("Niveau d'huile de boîte", "Contrôler, compléter", 2, H, "p. 55"),
        ("Filtre à essence", "Contrôler la propreté", 2, H, "p. 55"),
        ("Roulement de cloche d'embrayage", "Nettoyer et graisser, remplacer si besoin", 2, H, "p. 55"),
        ("Silencieux d'échappement (laine)", "Remplacer la matière amortissante", 10, H, "p. 55"),
        ("Filtre à air", "Nettoyer et huiler, remplacer s'il est abîmé", 10, H, "p. 55"),
        ("Pignons de l'arbre d'équilibrage", "Contrôler l'usure, remplacer si besoin", 10, H, "p. 55"),
        ("Garnitures des masselottes d'embrayage", "Contrôler l'usure, remplacer si besoin", 10, H, "p. 55"),
        ("Pignon de démarreur", "Nettoyer et graisser les joints de roulement", 10, H, "p. 55"),
        ("Huile de boîte", "Remplacer (au moins une fois par an)", 50, H, "p. 55"),
        ("Filtre à essence", "Remplacer (au moins une fois par an)", 50, H, "p. 55"),
        ("Moteur complet (piston, axe et cage, bielle et cage, roulements de vilebrequin, entraînement d'équilibrage, joint de pompe à eau)", "Démontage et contrôle par un centre agréé Rotax", 50, H, "p. 56"),
    ]],
    # Rotax DD2
    ("rotax-dd2", "Huile de boîte", "Remplacer après les 5 premières heures, puis contrôler toutes les 5 h", 5, H, "tous", "rotax_dd2_2024", "ch. 4 p. 8"),
    ("rotax-dd2", "Moteur complet (piston, axe, bielle, roulements)", "Démontage et contrôle par un centre agréé Rotax (intervalle : tableau du manuel)", "", "", "tous", "rotax_dd2_2024", "ch. 4 p. 8"),
    ("rotax-dd2", "Filtre à air", "Nettoyer et huiler ; kit de nettoyage après chaque séance sous la pluie", "", "", "tous", "rotax_dd2_2024", "ch. 4 p. 8"),
    # Vortex ROK GP
    ("vortex-rok", "Piston", "Remplacer", 30, H, "tous", "vortex_rokgp", "§5.1 p. 28"),
    ("vortex-rok", "Bielle", "Remplacer (90 h au tableau, 60 h au §5.14 : retenir 60 h)", 60, H, "tous", "vortex_rokgp", "§5.1 et §5.14"),
    ("vortex-rok", "Roulements de vilebrequin", "Remplacer (90 h au tableau, 60 h au §5.15 : retenir 60 h)", 60, H, "tous", "vortex_rokgp", "§5.1 et §5.15"),
    ("vortex-rok", "Embrayage", "Contrôler et nettoyer", 10, H, "tous", "vortex_rokgp", "§5.1 p. 28"),
    ("vortex-rok", "Embrayage", "Remplacer", 30, H, "tous", "vortex_rokgp", "§5.1 p. 28"),
    ("vortex-rok", "Carburateur", "Nettoyer", "chaque séance", "", "tous", "vortex_rokgp", "§5.1 p. 28"),
    ("vortex-rok", "Échappement", "Nettoyage intérieur", 10, H, "tous", "vortex_rokgp", "§5.1 p. 28"),
    ("vortex-rok", "Bougie", "Contrôler à chaque course, nettoyer au moins toutes les 5 h", 5, H, "tous", "vortex_rokgp", "§5.7 p. 31"),
    ("vortex-rok", "Bougie", "Remplacer", 30, H, "tous", "vortex_rokgp", "§5.1 p. 28"),
    # Vortex Mini ROK
    ("vortex-mini-rok", "Piston", "Remplacer", 30, H, "tous", "vortex_minirok", "§5.13 p. 27"),
    ("vortex-mini-rok", "Bielle", "Remplacer (90 h au tableau, 60 h au §5.14 : retenir 60 h)", 60, H, "tous", "vortex_minirok", "§5.14 p. 29"),
    ("vortex-mini-rok", "Roulements de vilebrequin", "Réfection du bas moteur (90 h au tableau, 60 h au §5.15 : retenir 60 h)", 60, H, "tous", "vortex_minirok", "§5.15 p. 29"),
    ("vortex-mini-rok", "Embrayage", "Contrôler et nettoyer", 10, H, "tous", "vortex_minirok", "§5.9 p. 24"),
    ("vortex-mini-rok", "Embrayage", "Remplacer", 30, H, "tous", "vortex_minirok", "§5.9 p. 24"),
    ("vortex-mini-rok", "Carburateur", "Nettoyer", "chaque manche", "", "tous", "vortex_minirok", "§5.6 p. 22"),
    ("vortex-mini-rok", "Échappement", "Nettoyage intérieur", 10, H, "tous", "vortex_minirok", "§5.8 p. 23"),
    ("vortex-mini-rok", "Bougie", "Remplacer", 30, H, "tous", "vortex_minirok", "§5.7 p. 23"),
    # Honda GX
    *[(e, el, ac, iv, un, "tous", "honda_gx", pg) for e in ("honda-gx160", "honda-gx200") for el, ac, iv, un, pg in [
        ("Huile moteur", "Contrôler le niveau", "avant chaque utilisation", "", "p. 7-8"),
        ("Huile moteur", "Première vidange", 20, H, "p. 19"),
        ("Pare-étincelles (selon version)", "Nettoyer", 100, H, "p. 13"),
        ("Chambre de combustion", "Nettoyer (atelier)", 500, H, "p. 7"),
    ]],
]

# ---------------------------------------------------------------- Pneus
# marque, modèle, type, appellation, catégories qui l'imposent en France 2026, données constructeur, id catalogue actuel (ou None), source
TIRES = [
    ("Vega", "Cadetti", "sec", "", "FFSA Mini Kart, Mini 60, Minime", "", None, "ffsa_annexe_2026"),
    ("Vega", "M1", "sec", "", "FFSA Cadet", "", None, "ffsa_annexe_2026"),
    ("Vega", "SL4", "sec", "", "FFSA Nationale", "", "vega-rouge-sl4", "ffsa_annexe_2026"),
    ("Vega", "XH4", "sec", "", "FFSA Senior / Master / Gentleman", "", None, "ffsa_annexe_2026"),
    ("Vega", "W6", "pluie", "", "FFSA Nationale, Senior / Master / Gentleman", "", "vega-bleu-w6", "ffsa_annexe_2026"),
    ("LeCont", "LOH Option ASN FFSA", "sec", "Option", "FFSA KZ2", "", None, "ffsa_annexe_2026"),
    ("LeCont", "LWR", "pluie", "CIK", "FFSA KZ2", "", None, "ffsa_annexe_2026"),
    ("Komet", "K3M", "sec", "", "IAME Eurocup X30 Senior, Master / Gentleman, Lady", "", None, "eurocup_2026"),
    ("Komet", "K3H", "sec", "", "IAME Eurocup KA100", "", None, "eurocup_2026"),
    ("Komet", "K3W", "pluie", "", "IAME Eurocup (toutes catégories)", "", None, "eurocup_2026"),
    ("MOJO", "C2", "sec", "Mini", "Rotax Micro MAX / Mini MAX", "", None, "mojo"),
    ("MOJO", "CW", "pluie", "Mini", "Rotax Micro MAX / Mini MAX", "Pression piste détrempée : 0,85 bar", None, "mojo"),
    ("MOJO", "D2XX", "sec", "Option", "Rotax Junior MAX", "", None, "mojo"),
    ("MOJO", "D5", "sec", "Prime", "Rotax Senior MAX, DD2", "Après le premier roulage d'un pneu neuf, la pression ne doit pas monter de plus de 0,35 bar", "mojo-d5", "mojo"),
    ("MOJO", "W5", "pluie", "Wet", "Rotax Senior MAX, DD2, Junior MAX", "Pression piste détrempée : 1,0 bar", "mojo-w5", "mojo"),
]

# ---------------------------------------------------------------- Châssis
# id catalogue, marque, modèle, tubes Ø mm, empattement mm, axe, freins, catégories, source
CHASSIS = [
    ("tonykart-racer-401rr", "Tony Kart", "Racer 401RR", "30", "1 045", "50 mm (OK, KZ, poinçon CIK-FIA) ; 40 mm (DD2)", "OK : BSD (étrier arrière 2 pistons Ø 34,5) ; KZ et DD2 : BSS (avant 4 pistons Ø 22, arrière 2 pistons Ø 34,5), liquide DOT 5.1", "OK, KZ, DD2", "otk_401rr"),
    ("birel-ry30-s16", "Birel ART", "RY30-S16 (direct drive)", "30", "1 045", "50x2x1020", "Arrière hydraulique 1FL I 32x2", "OK, X30, Rotax", "birel_s16"),
    ("birel-cry30-s16", "Birel ART", "RY30-S16 SH (boîte, appelé CRY30-S16 dans le catalogue)", "30", "1 045", "50x2x1020", "Arrière RR I 25/A ; avant RR I 25 EVO", "KZ", "birel_s16"),
    (None, "Birel ART", "RY32-S16", "32", "1 045", "50x2x1020", "Arrière hydraulique 1FL I 32x2", "OK, X30, Rotax", "birel_s16"),
    (None, "Birel ART", "CRY30/32-RX-DD2", "30 / 32", "1 045", "40x2x1040", "Arrière 3RR, avant RR-EVO (disque avant 150x12)", "Rotax DD2", "birel_s16"),
    (None, "Birel ART", "AM29-Y", "28 / 30", "1 020 / 1 030 / 1 040", "40x3x1000", "Arrière hydraulique 1B", "Mini / Cadet", "birel_s16"),
    (None, "Birel ART", "C28-S16", "28", "950", "30x5x960", "Arrière hydraulique 1CX", "Mini", "birel_s16"),
    (None, "Birel ART", "B25 Baby", "25", "780", "25x880", "Arrière mécanique", "Baby", "birel_s16"),
    ("crg-heron", "CRG", "Heron", "30", "1 050", "50", "VEN 13 DD de série (système ABA) ; VEN 11 en option", "Direct drive et boîte (OK, KZ)", "crg_heron"),
]

# ---------------------------------------------------------------- Freins
# id catalogue, marque, système, montage, détail constructeur, source
BRAKES = [
    ("otk-bsd", "OTK", "BSD", "arrière", "Étrier arrière 2 pistons Ø 34,5 mm ; liquide DOT 5.1 (direct drive OK)", "otk_401rr"),
    ("otk-bss", "OTK", "BSS", "avant + arrière", "Étriers avant 4 pistons Ø 22 mm, arrière 2 pistons Ø 34,5 mm ; liquide DOT 5.1 (KZ, DD2)", "otk_401rr"),
    ("crg-ven11", "CRG", "VEN 11", "arrière", "Proposé en option sur le Heron (VEN 13 DD de série avec le système ABA)", "crg_heron"),
    (None, "CRG", "VEN 13 DD", "arrière", "Système de série du Heron direct drive, avec ABA", "crg_heron"),
    ("birel-freeline", "Birel ART", "Freeline (1FL I 32x2)", "arrière", "Frein arrière hydraulique de la gamme direct drive S16", "birel_s16"),
    (None, "Birel ART", "RR I 25 / RR I 25 EVO", "avant + arrière", "Système des châssis à boîte S16 (KZ)", "birel_s16"),
]

# ---------------------------------------------------------------- Carburateurs manquants au catalogue
CARBS = [
    ("tillotson-hw27a", "Tillotson", "HW-27A", "IAME X30 (imposé en Eurocup)", "eurocup_2026"),
    (None, "Tillotson", "HW-33A", "IAME KA100 (imposé en Eurocup)", "eurocup_2026"),
    ("dellorto-vhsh30", "Dell'Orto", "VHSH 30 CS", "KZ2 FFSA (venturi 30 mm max)", "ffsa_annexe_2026"),
    (None, "Dell'Orto", "PHBG 18 BS", "Vortex MINI 60 FR (FFSA Mini 60)", "ffsa_annexe_2026"),
]
