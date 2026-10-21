/**
 * Libellés de la session de démo, dans un module à part : les sections de la
 * page d'accueil qui se chargent d'emblée n'ont besoin que de ces deux
 * textes, et ne doivent surtout pas embarquer avec eux la trace GPS et les
 * courbes (`demoSession.ts`), qui ne se téléchargent que près des aperçus.
 */
export const DEMO_CIRCUIT = "Adria Karting Raceway";
export const DEMO_LABEL = `Session de démo · ${DEMO_CIRCUIT}`;
