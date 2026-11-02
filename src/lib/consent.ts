/**
 * Consentement aux cookies et traceurs (RGPD, recommandations CNIL).
 *
 * Trois familles :
 * - nécessaires : connexion, préférences, panier d'abonnement — toujours actifs,
 *   exemptés de consentement ;
 * - mesure : la mesure d'audience de l'app RATTACHÉE au compte du pilote (quelles
 *   pages il utilise). Sans accord, la mesure reste anonyme : un identifiant de
 *   navigateur propre au site, sans lien avec le compte, conservé 13 mois au plus
 *   (mesure d'audience exemptée au sens de la CNIL) ;
 * - publicité : pixels Meta et Google Ads, chargés UNIQUEMENT après accord.
 *
 * Le choix vaut 6 mois ; « Tout refuser » est aussi simple que « Tout accepter ».
 * Google Consent Mode v2 est initialisé à « refusé » dans index.html, avant
 * tout chargement, et mis à jour ici.
 */

export interface ConsentChoice {
  v: 1;
  /** Date du choix (ms). */
  at: number;
  measure: boolean;
  ads: boolean;
}

const KEY = "apexai_consent";
const MAX_AGE_MS = 182 * 24 * 3600 * 1000; // ~6 mois
export const CONSENT_EVENT = "apexai:consent";
export const OPEN_CONSENT_EVENT = "apexai:consent-open";

export function readConsent(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentChoice;
    if (c?.v !== 1 || typeof c.at !== "number" || Date.now() - c.at > MAX_AGE_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveConsent(measure: boolean, ads: boolean): ConsentChoice {
  const c: ConsentChoice = { v: 1, at: Date.now(), measure, ads };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* navigation privée : le choix vaut pour la page */
  }
  applyConsent(c);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  return c;
}

/** Rouvre le bandeau (lien « Gérer les cookies » du pied de page). */
export function openConsentPanel() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

export function hasMeasureConsent(): boolean {
  return readConsent()?.measure === true;
}

/* ───────────── Pixels publicitaires ───────────── */

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const GOOGLE_TAG_ID = import.meta.env.VITE_GOOGLE_TAG_ID as string | undefined;

let googleLoaded = false;
let metaLoaded = false;

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGoogle() {
  if (googleLoaded || !GOOGLE_TAG_ID) return;
  googleLoaded = true;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`);
  window.gtag?.("js", new Date());
  window.gtag?.("config", GOOGLE_TAG_ID);
}

function loadMeta() {
  if (metaLoaded || !META_PIXEL_ID) return;
  metaLoaded = true;
  // Extrait officiel du pixel Meta, sans le <noscript>.
  const n = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = n as any;
    if (f.callMethod) f.callMethod(...args);
    else f.queue.push(args);
  } as NonNullable<Window["fbq"]>;
  if (!window.fbq) {
    window.fbq = n;
    window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

/** Applique un choix : Consent Mode Google, puis pixels si la publicité est acceptée. */
export function applyConsent(c: ConsentChoice | null) {
  const ads = c?.ads === true;
  const measure = c?.measure === true;
  window.gtag?.("consent", "update", {
    ad_storage: ads ? "granted" : "denied",
    ad_user_data: ads ? "granted" : "denied",
    ad_personalization: ads ? "granted" : "denied",
    analytics_storage: measure ? "granted" : "denied",
  });
  if (ads) {
    loadGoogle();
    loadMeta();
  } else if (metaLoaded) {
    window.fbq?.("consent", "revoke");
  }
}

/** Page vue pour les pixels (navigation interne de l'app). */
export function trackAdPageView() {
  if (readConsent()?.ads !== true) return;
  if (metaLoaded) window.fbq?.("track", "PageView");
}
