/**
 * Chargement des pages à la demande — et surtout AVANT la demande.
 *
 * Toute l'app tenait dans un seul fichier de 2,4 Mo : sur un téléphone, il
 * fallait le télécharger puis l'exécuter en entier avant d'afficher quoi que
 * ce soit. Chaque page vit désormais dans son propre morceau.
 *
 * Le piège classique du découpage, c'est l'écran blanc au premier tap sur un
 * onglet. On l'évite de deux façons :
 *   1. dès que l'app est au repos, on précharge silencieusement les pages
 *      principales, une par une, sans gêner le rendu ;
 *   2. au moindre contact du doigt sur un lien (avant même le « clic »), on
 *      lance le chargement de la page visée — les ~100 ms entre le toucher et
 *      le relâcher suffisent le plus souvent.
 * La navigation elle-même se fait en transition React : tant que la page
 * suivante n'est pas prête, l'actuelle reste affichée, sans flash.
 */

type Loader = () => Promise<unknown>;

export const loaders = {
  dashboard: () => import("./Dashboard"),
  upload: () => import("./Upload"),
  monKart: () => import("./MonKart"),
  monKartPreview: () => import("./MonKartPreviewPage"),
  setup: () => import("./SetupPage"),
  setupPreview: () => import("./SetupPreviewPage"),
  calendar: () => import("./CalendarPage"),
  pricing: () => import("./PricingPage"),
  profile: () => import("./Profile"),
  parametres: () => import("./Parametres"),
  login: () => import("./Login"),
  resetPassword: () => import("./ResetPassword"),
  success: () => import("./Success"),
  redeem: () => import("./RedeemPage"),
  analysisResult: () => import("./AnalysisResultPage"),
  admin: () => import("./Admin"),
  legal: () => import("./Legal"),
  cgu: () => import("./legal/CGU"),
  confidentialite: () => import("./legal/Confidentialite"),
} satisfies Record<string, Loader>;

/** Chemin → pages à précharger (Mon Kart et Réglages ont deux variantes). */
const byPath: Record<string, Loader[]> = {
  "/dashboard": [loaders.dashboard],
  "/upload": [loaders.upload],
  "/mon-kart": [loaders.monKart, loaders.monKartPreview],
  "/setup": [loaders.setup, loaders.setupPreview],
  "/calendrier": [loaders.calendar],
  "/pricing": [loaders.pricing],
  "/profile": [loaders.profile],
  "/parametres": [loaders.parametres],
  "/login": [loaders.login],
  "/legal": [loaders.legal],
  "/legal/cgu": [loaders.cgu],
  "/legal/confidentialite": [loaders.confidentialite],
  "/admin": [loaders.admin],
};

const started = new Set<Loader>();

function run(loader: Loader) {
  if (started.has(loader)) return;
  started.add(loader);
  // Un échec (réseau coupé) ne doit rien casser : la page sera simplement
  // rechargée au moment où on l'ouvre vraiment.
  loader().catch(() => started.delete(loader));
}

/** Précharge la page d'un lien. Sans effet si elle l'est déjà. */
export function prefetchRoute(to: string) {
  const path = to.split(/[?#]/)[0];
  const list = byPath[path] ?? (path.startsWith("/analysis/") ? [loaders.analysisResult] : null);
  list?.forEach(run);
}

/**
 * Précharge les pages principales pendant que le navigateur est au repos.
 * Une page par créneau libre : le fil principal n'est jamais monopolisé.
 */
export function prefetchCoreRoutes() {
  const queue: Loader[] = [
    loaders.dashboard,
    loaders.upload,
    loaders.monKart,
    loaders.monKartPreview,
    loaders.setup,
    loaders.setupPreview,
    loaders.calendar,
    loaders.pricing,
    loaders.profile,
    loaders.login,
  ];
  const idle: (cb: () => void) => void =
    "requestIdleCallback" in window
      ? (cb) => (window as Window & typeof globalThis).requestIdleCallback(cb, { timeout: 2500 })
      : (cb) => window.setTimeout(cb, 250);

  const next = () => {
    const loader = queue.shift();
    if (!loader) return;
    run(loader);
    idle(next);
  };
  idle(next);
}
