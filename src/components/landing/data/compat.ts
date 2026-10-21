/**
 * Enregistreurs et logiciels compatibles, affichés dans la barre défilante.
 *
 * Règle d'or : on n'affiche « compatible » que ce qui l'est vraiment — l'import
 * natif du fichier .xrk d'AiM (MyChron 5 / 6, via Race Studio 3). Le reste est
 * marqué « bientôt » ou n'apparaît pas.
 *
 * LOGOS OFFICIELS : déposer le fichier dans `public/logos/` (SVG ou PNG
 * transparent, idéalement en blanc ou en niveaux de gris) puis renseigner
 * `logo` ci-dessous, par ex. `logo: "/logos/aim.svg"`. Tant qu'il n'y en a pas,
 * le nom s'affiche en texte simple : ApexAI ne redessine pas les logos des
 * marques tierces.
 */

export interface CompatItem {
  id: string;
  /** Nom complet (lu par les lecteurs d'écran, et texte de repli). */
  name: string;
  /** Début du nom, mis en gras. */
  strong: string;
  /** Suite du nom, en plus discret. */
  rest?: string;
  /** Chemin d'un logo déposé dans `public/logos` (facultatif). */
  logo?: string;
  /** `ok` = compatible aujourd'hui · `soon` = en préparation. */
  status: "ok" | "soon";
}

export const COMPAT_ITEMS: CompatItem[] = [
  { id: "mychron5", name: "AiM MyChron 5", strong: "AiM", rest: "MyChron 5", status: "ok" },
  { id: "mychron6", name: "AiM MyChron 6", strong: "AiM", rest: "MyChron 6", status: "ok" },
  { id: "rs3", name: "Race Studio 3 (fichiers .xrk)", strong: "Race Studio 3", rest: ".xrk", status: "ok" },
  { id: "alfano", name: "Alfano", strong: "Alfano", status: "soon" },
];
