import { useEffect, useMemo, useState } from "react";
import {
  getAllAnalyses,
  getSessionDetails,
  peekCachedAnalyses,
  type AnalysisSummary,
  type SessionDetail,
} from "@/lib/storage";
import {
  fetchHomeInsights,
  getKartProfile,
  listUpcomingEvents,
  type HomeInsightsResponse,
  type KartProfile,
  type PilotEvent,
} from "@/lib/api";

export interface PaddockSession {
  id: string;
  date: string;
  timestamp: number;
  circuit: string;
  circuitKey: string;
  type: string;
  best: number;
  laps: number[];
  lapsCount: number;
  lengthM: number | null;
  vmax: number | null;
  score: number;
  lat?: number[];
  lon?: number[];
  /** Meilleur tour sur ce circuit avant cette séance (null : première séance ici). */
  previousRecord: number | null;
  /** Écart moyen des tours lancés au meilleur tour, en secondes (null : trop peu de tours). */
  regularity: number | null;
}

export interface CircuitRecord {
  circuit: string;
  circuitKey: string;
  best: number;
  date: string;
  sessions: number;
}

export interface Activity {
  sessions: number;
  laps: number;
  seconds: number;
  meters: number | null;
  vmax: number | null;
  /** Les mêmes chiffres sur les 30 jours d'avant, pour l'évolution. */
  previous: { sessions: number; laps: number };
}

export interface WeekBar {
  start: number;
  laps: number;
  sessions: number;
}

const DAY = 86400000;

function circuitKeyOf(name?: string) {
  return (name || "").trim().toLowerCase();
}

/**
 * Régularité : écart moyen au meilleur tour des tours lancés. On écarte le
 * tour de sortie des stands et les tours anormalement lents (au-delà de
 * 107 % du meilleur : drapeau, trafic, retour aux stands).
 */
export function regularityOf(laps: number[]): number | null {
  if (laps.length < 4) return null;
  const best = Math.min(...laps);
  const flying = laps.slice(1).filter((t) => t <= best * 1.07);
  if (flying.length < 3) return null;
  return flying.reduce((a, t) => a + (t - best), 0) / flying.length;
}

function mondayOf(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7;
  return d.getTime() - shift * DAY;
}

/**
 * Tout ce que l'accueil affiche, calculé à partir des séances du pilote.
 * Les doublons (même fichier analysé deux fois) ne comptent qu'une fois.
 */
export function usePaddockData(userId: string | undefined, accessToken: string | undefined) {
  const [summaries, setSummaries] = useState<AnalysisSummary[]>(() => peekCachedAnalyses(userId) ?? []);
  const [details, setDetails] = useState<SessionDetail[] | null>(null);
  const [loading, setLoading] = useState(() => !(peekCachedAnalyses(userId)?.length));
  const [insights, setInsights] = useState<HomeInsightsResponse | null>(null);
  const [kart, setKart] = useState<KartProfile | null>(null);
  const [nextEvent, setNextEvent] = useState<PilotEvent | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    Promise.all([getAllAnalyses(userId), getSessionDetails().catch(() => [])])
      .then(([list, det]) => {
        if (!alive) return;
        setSummaries(list);
        setDetails(det);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    fetchHomeInsights(accessToken)
      .then((r) => alive && setInsights(r))
      .catch(() => {});
    getKartProfile(accessToken)
      .then((r) => alive && setKart(r.profile?.mon_kart_enabled ? r.profile : null))
      .catch(() => alive && setKart(null));
    listUpcomingEvents(accessToken, 90)
      .then((evts) => {
        if (!alive) return;
        const upcoming = evts
          .filter((e) => !e.completed)
          .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
        setNextEvent(upcoming[0] ?? null);
      })
      .catch(() => alive && setNextEvent(null));
    return () => {
      alive = false;
    };
  }, [accessToken]);

  const sessions = useMemo<PaddockSession[]>(() => {
    const byId = new Map((details ?? []).map((d) => [d.id, d]));
    const seen = new Set<string>();
    const list: PaddockSession[] = [];
    // Du plus ancien au plus récent, pour connaître le record d'avant chaque séance.
    const chrono = [...summaries].sort((a, b) => a.timestamp - b.timestamp);
    const records = new Map<string, number>();
    for (const s of chrono) {
      const d = byId.get(s.id);
      const laps = d?.lap_times ?? [];
      const key = circuitKeyOf(s.circuit_name);
      const dup = `${key}|${s.lap_time}|${laps.length}|${new Date(s.date).toDateString()}`;
      if (seen.has(dup)) continue;
      seen.add(dup);
      const best = s.lap_time || (laps.length ? Math.min(...laps) : 0);
      const previousRecord = key ? records.get(key) ?? null : null;
      if (key && best > 0) records.set(key, Math.min(previousRecord ?? Infinity, best));
      list.push({
        id: s.id,
        date: s.date,
        timestamp: s.timestamp,
        circuit: s.circuit_name?.trim() || "Circuit non renseigné",
        circuitKey: key,
        type: s.session_type || "practice",
        best,
        laps,
        lapsCount: laps.length,
        lengthM: d?.track_length_m ?? null,
        vmax: d?.max_speed_kmh ?? null,
        score: s.score,
        lat: d?.lat,
        lon: d?.lon,
        previousRecord,
        regularity: regularityOf(laps),
      });
    }
    // Tracé emprunté à une autre séance du même circuit quand celle-ci n'en a pas.
    const lineByCircuit = new Map<string, PaddockSession>();
    for (const s of list) if (s.lat && s.circuitKey && !lineByCircuit.has(s.circuitKey)) lineByCircuit.set(s.circuitKey, s);
    for (const s of list) {
      if (!s.lat && s.circuitKey && lineByCircuit.has(s.circuitKey)) {
        const src = lineByCircuit.get(s.circuitKey)!;
        s.lat = src.lat;
        s.lon = src.lon;
      }
      if (!s.lengthM && s.circuitKey) {
        const withLen = list.find((o) => o.circuitKey === s.circuitKey && o.lengthM);
        if (withLen) s.lengthM = withLen.lengthM;
      }
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [summaries, details]);

  const records = useMemo<CircuitRecord[]>(() => {
    const m = new Map<string, CircuitRecord>();
    for (const s of sessions) {
      if (!s.circuitKey || !(s.best > 0)) continue;
      const r = m.get(s.circuitKey);
      if (!r) m.set(s.circuitKey, { circuit: s.circuit, circuitKey: s.circuitKey, best: s.best, date: s.date, sessions: 1 });
      else {
        r.sessions += 1;
        if (s.best < r.best) {
          r.best = s.best;
          r.date = s.date;
        }
      }
    }
    return [...m.values()].sort((a, b) => b.sessions - a.sessions || a.circuit.localeCompare(b.circuit));
  }, [sessions]);

  const now = Date.now();
  const activity = useMemo<Activity>(() => {
    const recent = sessions.filter((s) => now - s.timestamp <= 30 * DAY);
    const before = sessions.filter((s) => now - s.timestamp > 30 * DAY && now - s.timestamp <= 60 * DAY);
    const withLen = recent.filter((s) => s.lengthM && s.lapsCount);
    const vmaxes = recent.map((s) => s.vmax).filter((v): v is number => v != null);
    return {
      sessions: recent.length,
      laps: recent.reduce((a, s) => a + s.lapsCount, 0),
      seconds: recent.reduce((a, s) => a + s.laps.reduce((x, y) => x + y, 0), 0),
      meters: withLen.length ? withLen.reduce((a, s) => a + (s.lengthM ?? 0) * s.lapsCount, 0) : null,
      vmax: vmaxes.length ? Math.max(...vmaxes) : null,
      previous: { sessions: before.length, laps: before.reduce((a, s) => a + s.lapsCount, 0) },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const weeks = useMemo<WeekBar[]>(() => {
    const thisMonday = mondayOf(now);
    const bars: WeekBar[] = Array.from({ length: 12 }, (_, i) => ({
      start: thisMonday - (11 - i) * 7 * DAY,
      laps: 0,
      sessions: 0,
    }));
    for (const s of sessions) {
      const idx = 11 - Math.round((thisMonday - mondayOf(s.timestamp)) / (7 * DAY));
      if (idx >= 0 && idx < 12) {
        bars[idx].laps += s.lapsCount;
        bars[idx].sessions += 1;
      }
    }
    return bars;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  return { loading, sessions, records, activity, weeks, insights, kart, nextEvent };
}

export type PaddockData = ReturnType<typeof usePaddockData>;
