/**
 * Boîtiers d'acquisition et logiciels compatibles, affichés dans la barre
 * « Compatible avec ton boîtier d'acquisition » (page d'accueil et page
 * Analyser quand on n'est pas connecté).
 *
 * Règle d'or : on n'affiche « compatible » que ce qui l'est vraiment — l'import
 * natif du fichier .xrk d'AiM (MyChron 5 / 6, via Race Studio 3). Le reste est
 * marqué « Bientôt » ou n'apparaît pas.
 *
 * Les logos sont des SVG déposés dans `public/logos/`. Ils servent uniquement à
 * dire que le produit lit leurs fichiers ; la mention de non-affiliation
 * ci-dessous doit toujours rester visible avec eux.
 */

export interface CompatItem {
  id: string;
  /** Nom complet (lu par les lecteurs d'écran, et texte de repli). */
  name: string;
  /** Chemin du logo dans `public/logos`. */
  logo: string;
  /** Hauteur d'affichage du logo, en pixels (les logos n'ont pas tous le même gabarit). */
  height: number;
  /** Précision affichée à côté du logo. */
  caption: string;
  /** `ok` = compatible aujourd'hui · `soon` = en préparation. */
  status: "ok" | "soon";
}

export const COMPAT_ITEMS: CompatItem[] = [
  {
    id: "aim",
    name: "AiM MyChron 5 et MyChron 6",
    logo: "/logos/aim.svg",
    height: 30,
    caption: "MyChron 5 · MyChron 6",
    status: "ok",
  },
  {
    id: "rs3",
    name: "Race Studio 3 (fichiers .xrk)",
    logo: "/logos/race-studio-3.svg",
    height: 40,
    caption: "Fichiers .xrk",
    status: "ok",
  },
  {
    id: "alfano",
    name: "Alfano (bientôt)",
    logo: "/logos/alfano.svg",
    height: 24,
    caption: "Bientôt",
    status: "soon",
  },
];

/**
 * Mention de non-affiliation, affichée sous la barre. Elle nomme les marques
 * pour ce qu'elles sont (propriété de leurs titulaires) et dit clairement
 * qu'ApexAI n'a aucun lien commercial avec elles.
 */
export const COMPAT_LEGAL =
  "AiM, MyChron, Race Studio et Alfano sont des marques de leurs propriétaires respectifs, citées uniquement pour indiquer la compatibilité des fichiers. ApexAI n'est ni affilié, ni sponsorisé, ni approuvé par ces sociétés.";
