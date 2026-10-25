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
