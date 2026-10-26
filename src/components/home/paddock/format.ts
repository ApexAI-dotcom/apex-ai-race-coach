// Mise en forme des chronos et des dates pour l'accueil (virgule décimale, à la française).

export function formatLap(seconds: number | null | undefined): string {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  const sec = s.toFixed(3).replace(".", ",");
  return m > 0 ? `${m}:${s < 10 ? "0" : ""}${sec}` : sec;
}

/** Écart signé en secondes : « −0,092 s », « +0,310 s ». */
export function formatDelta(seconds: number): string {
  const sign = seconds < 0 ? "−" : "+";
  return `${sign}${Math.abs(seconds).toFixed(3).replace(".", ",")} s`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return "0 min";
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function formatKm(meters: number): string {
  const km = meters / 1000;
  return km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** « aujourd'hui », « hier », « il y a 5 jours », « il y a 3 semaines ». */
export function sinceLabel(iso: string, now = Date.now()): string {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso).getTime())) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 14) return `il y a ${days} jours`;
  if (days < 60) return `il y a ${Math.round(days / 7)} semaines`;
  return `il y a ${Math.round(days / 30)} mois`;
}

export const SESSION_TYPE: Record<string, string> = {
  practice: "essais",
  qualifying: "qualifications",
  race: "course",
};
