/**
 * Durées des Paddock Pass, lisibles par un humain.
 *
 * Un pass va de 24 h (essai sur un circuit) à 3 mois (pilote testeur). Écrit en
 * heures, « 2160 h » ne veut rien dire pour un pilote : on parle en heures pour
 * les essais courts, en jours, semaines ou mois au-delà.
 */

export const PADDOCK_PASS_MAX_HOURS = 90 * 24;

export const PADDOCK_PASS_PRESETS: { label: string; hours: number }[] = [
  { label: "24 h", hours: 24 },
  { label: "48 h", hours: 48 },
  { label: "1 semaine", hours: 7 * 24 },
  { label: "1 mois", hours: 30 * 24 },
  { label: "2 mois", hours: 60 * 24 },
  { label: "3 mois", hours: 90 * 24 },
];

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** 48 → « 48 h », 168 → « 1 semaine », 1440 → « 2 mois ». */
export function formatPassDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  if (hours <= 48 || hours % 24 !== 0) return `${hours} h`;
  const days = hours / 24;
  if (days % 30 === 0) return `${days / 30} mois`;
  if (days % 7 === 0) return plural(days / 7, "semaine");
  return plural(days, "jour");
}

/** Temps restant d'un pass actif, à la précision utile : jours, puis heures. */
export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "expiré";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d >= 2) return `${d} jours`;
  if (d === 1) return `1 j ${h}h`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

/* ── Code en attente (QR du flyer) ─────────────────────────────────────────
 * Un pilote qui scanne le QR sans compte doit d'abord s'inscrire, confirmer
 * son mail (souvent dans un autre navigateur : l'appli Gmail…), puis se
 * connecter. Le code doit survivre à tout ce parcours :
 *  - dans le navigateur (localStorage, 14 jours) ;
 *  - dans le compte lui-même à l'inscription (métadonnées Supabase), pour le
 *    cas où le lien de confirmation s'ouvre ailleurs.
 * Il est ensuite activé automatiquement dès que le pilote est connecté.
 */
const PENDING_KEY = "apexai_pending_pass";
const PENDING_TTL_MS = 14 * 24 * 3600 * 1000;

export function setPendingPassCode(code: string) {
  const c = code.trim().toUpperCase();
  if (!c) return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ code: c, at: Date.now() }));
  } catch {
    /* stockage indisponible : le code reste au moins dans l'URL */
  }
}

export function getPendingPassCode(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) {
      const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
      if (code && at && Date.now() - at < PENDING_TTL_MS) return code;
      localStorage.removeItem(PENDING_KEY);
    }
    // Ancienne clé (sessionStorage) des versions précédentes.
    const legacy = sessionStorage.getItem("apexai_pending_code");
    if (legacy) return legacy.toUpperCase();
  } catch {
    /* noop */
  }
  return null;
}

export function clearPendingPassCode() {
  try {
    localStorage.removeItem(PENDING_KEY);
    sessionStorage.removeItem("apexai_pending_code");
  } catch {
    /* noop */
  }
}
