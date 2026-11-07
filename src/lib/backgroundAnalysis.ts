/**
 * Analyses qui continuent quand le pilote change de page.
 *
 * Le suivi vit ici, hors des composants : quitter « Analyser » ne coupe plus
 * rien. Au retour, la page relit l'état (jauge en cours, ou résultat prêt).
 * Les numéros de tâche sont gardés dans le navigateur : même après un
 * rechargement, le suivi reprend tant que le serveur garde la tâche (30 min).
 */
import { useSyncExternalStore } from "react";
import type { AnalysisResult, ApiError } from "./api";
import { analyzeInBackground, getAnalysisJob, toProgress, waitForJob, type JobOptions, type JobProgress } from "./analysisJobs";
import { saveAnalysis } from "./storage";

export type TaskStatus = "running" | "done" | "error";

export interface SingleTask {
  kind: "single";
  fileName: string;
  sessionName?: string;
  startedAt: number;
  jobId?: string;
  status: TaskStatus;
  progress: JobProgress;
  error?: string;
  errorCode?: string;
  result?: AnalysisResult;
  /** Identifiant de la séance enregistrée dans Sessions (null : non enregistrée). */
  savedId?: string | null;
}

export interface CompareTask {
  kind: "compare";
  names: [string, string];
  sameFile: boolean;
  startedAt: number;
  jobIds: [string | null, string | null];
  status: TaskStatus;
  progress: JobProgress;
  error?: string;
  results?: [AnalysisResult, AnalysisResult];
}

interface State {
  single: SingleTask | null;
  compare: CompareTask | null;
}

const KEY = "apexai_bg_analysis";
let state: State = { single: null, compare: null };
const listeners = new Set<() => void>();
/** Pages qui affichent elles-mêmes le résultat (pas de notification à envoyer). */
const viewers = { single: 0, compare: 0 };
type DoneListener = (kind: "single" | "compare") => void;
const doneListeners = new Set<DoneListener>();

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function patchSingle(p: Partial<SingleTask>) {
  if (state.single) set({ single: { ...state.single, ...p } });
}

function patchCompare(p: Partial<CompareTask>) {
  if (state.compare) set({ compare: { ...state.compare, ...p } });
}

/* ───────────── Persistance légère (sans les résultats) ───────────── */

interface Persisted {
  single?: { jobId: string; fileName: string; sessionName?: string; startedAt: number; userId?: string | null };
  compare?: { jobIds: [string | null, string | null]; names: [string, string]; sameFile: boolean; startedAt: number };
}
let persistedUser: string | null | undefined;

function persist() {
  try {
    const p: Persisted = {};
    if (state.single?.status === "running" && state.single.jobId) {
      p.single = { jobId: state.single.jobId, fileName: state.single.fileName, sessionName: state.single.sessionName, startedAt: state.single.startedAt, userId: persistedUser };
    }
    const c = state.compare;
    if (c?.status === "running" && (c.sameFile ? !!c.jobIds[0] : c.jobIds.every(Boolean))) {
      p.compare = { jobIds: state.compare.jobIds, names: state.compare.names, sameFile: state.compare.sameFile, startedAt: state.compare.startedAt };
    }
    if (p.single || p.compare) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* navigation privée : le suivi vaut pour la page */
  }
}

/* ───────────── API publique ───────────── */

export function useBackgroundAnalysis(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );
}

/** Une page qui affiche le résultat se déclare : pas de notification en double. */
export function watchTask(kind: "single" | "compare") {
  viewers[kind] += 1;
  return () => {
    viewers[kind] = Math.max(0, viewers[kind] - 1);
  };
}

export function isWatched(kind: "single" | "compare") {
  return viewers[kind] > 0;
}

export function onTaskDone(fn: DoneListener) {
  doneListeners.add(fn);
  return () => {
    doneListeners.delete(fn);
  };
}

function done(kind: "single" | "compare") {
  doneListeners.forEach((l) => l(kind));
}

export function clearSingle() {
  set({ single: null });
}

export function clearCompare() {
  set({ compare: null });
}

const msg = (e: unknown, fallback: string) => (e as ApiError)?.message ?? (e instanceof Error ? e.message : fallback);

export interface SingleHooks {
  userId?: string | null;
  /** Appelé une fois la séance enregistrée (compteurs de l'abonnement, invité). */
  onSaved?: (result: AnalysisResult, savedId: string | null) => void;
}

/** Analyse simple : dépôt, suivi, enregistrement dans Sessions. Ne dépend d'aucune page. */
export function startSingle(file: File, opts: JobOptions, hooks: SingleHooks = {}) {
  persistedUser = hooks.userId ?? null;
  set({
    single: {
      kind: "single",
      fileName: file.name,
      sessionName: opts.session_name,
      startedAt: Date.now(),
      status: "running",
      progress: { phase: "upload", pct: 0, label: "Envoi du fichier" },
    },
  });
  analyzeInBackground(
    file,
    { ...opts, mode: "full" },
    (progress) => patchSingle({ progress }),
    (jobId) => patchSingle({ jobId })
  )
    .then((result) => finishSingle(result, hooks))
    .catch((e) => {
      patchSingle({ status: "error", error: msg(e, "L'analyse a échoué."), errorCode: (e as ApiError)?.error });
      done("single");
    });
}

async function finishSingle(result: AnalysisResult, hooks: SingleHooks) {
  let savedId: string | null = null;
  try {
    savedId = await saveAnalysis(result, hooks.userId ?? undefined);
  } catch (e) {
    console.warn("Enregistrement de l'analyse impossible :", e);
  }
  try {
    hooks.onSaved?.(result, savedId);
  } catch {
    /* compteurs : non bloquant */
  }
  patchSingle({ status: "done", result, savedId, progress: { phase: "done", pct: 100, label: "Terminé" } });
  done("single");
}

export interface CompareSlotInput {
  /** Fichier à analyser, ou résultat déjà disponible (séance de Sessions). */
  file?: File | null;
  result?: AnalysisResult | null;
  /** Séance du pilote : analyse complète et enregistrée dans Sessions. */
  mine: boolean;
  label: string;
}

/**
 * Comparaison : la séance du pilote en analyse complète, celle du coéquipier
 * en analyse allégée (ni quota, ni Sessions). Les deux envois partent en
 * même temps ; le serveur les calcule l'un après l'autre.
 */
export function startCompare(
  a: CompareSlotInput,
  b: CompareSlotInput | null,
  names: [string, string],
  opts: { accessToken?: string | null; userId?: string | null }
) {
  const sameFile = b === null;
  const parts: JobProgress[] = [
    a.result ? { phase: "done", pct: 100, label: "" } : { phase: "upload", pct: 0, label: "" },
    !b || b.result ? { phase: "done", pct: 100, label: "" } : { phase: "upload", pct: 0, label: "" },
  ];
  const jobIds: [string | null, string | null] = [null, null];
  set({
    compare: {
      kind: "compare",
      names,
      sameFile,
      startedAt: Date.now(),
      jobIds,
      status: "running",
      progress: { phase: "upload", pct: 0, label: "Envoi des fichiers" },
    },
  });

  const update = () => {
    const pct = Math.round((parts[0].pct + parts[1].pct) / 2);
    // On montre l'étape de la séance encore en cours de calcul.
    const i = parts[0].phase !== "done" ? 0 : 1;
    const who = sameFile ? "" : `${b && i === 1 ? b.label : a.label} : `;
    const label = parts[i].phase === "done" ? "Mise en face des deux séances" : `${who}${parts[i].label}`;
    const phase = parts.every((p) => p.phase === "done") ? "running" : parts[i].phase;
    patchCompare({ progress: { phase, pct: Math.min(99, pct), label, position: parts[i].position }, jobIds: [...jobIds] as [string | null, string | null] });
  };

  const run = async (slot: CompareSlotInput, idx: 0 | 1): Promise<AnalysisResult> => {
    if (slot.result) return slot.result;
    if (!slot.file) throw new Error(`Il manque le fichier de ${slot.label}.`);
    const r = await analyzeInBackground(
      slot.file,
      { mode: slot.mine ? "full" : "light", track_condition: "auto", accessToken: opts.accessToken },
      (p) => {
        parts[idx] = p;
        update();
      },
      (id) => {
        jobIds[idx] = id;
        update();
      }
    );
    parts[idx] = { phase: "done", pct: 100, label: "" };
    update();
    if (slot.mine) {
      try {
        await saveAnalysis(r, opts.userId ?? undefined);
      } catch {
        /* la comparaison reste affichée même si l'enregistrement échoue */
      }
    }
    return r;
  };

  Promise.all([run(a, 0), b ? run(b, 1) : Promise.resolve(null)])
    .then(([ra, rb]) => {
      patchCompare({ status: "done", results: [ra, rb ?? ra], progress: { phase: "done", pct: 100, label: "Terminé" } });
      done("compare");
    })
    .catch((e) => {
      patchCompare({ status: "error", error: msg(e, "La comparaison a échoué.") });
      done("compare");
    });
}

/* ───────────── Reprise après un rechargement de page ───────────── */

function resume() {
  let p: Persisted | null = null;
  try {
    p = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    p = null;
  }
  if (!p) return;
  // Au-delà de 30 min, le serveur a oublié la tâche.
  const fresh = (t: number) => Date.now() - t < 30 * 60 * 1000;

  if (p.single && fresh(p.single.startedAt)) {
    const s = p.single;
    persistedUser = s.userId;
    state = {
      ...state,
      single: {
        kind: "single",
        fileName: s.fileName,
        sessionName: s.sessionName,
        startedAt: s.startedAt,
        jobId: s.jobId,
        status: "running",
        progress: { phase: "queued", pct: 12, label: "Reprise du suivi" },
      },
    };
    waitForJob(s.jobId, (j) => patchSingle({ progress: toProgress(j) }))
      .then((result) => finishSingle(result, { userId: s.userId }))
      .catch((e) => {
        patchSingle({ status: "error", error: msg(e, "L'analyse a échoué."), errorCode: (e as ApiError)?.error });
        done("single");
      });
  }

  if (p.compare && fresh(p.compare.startedAt)) {
    const c = p.compare;
    state = {
      ...state,
      compare: {
        kind: "compare",
        names: c.names,
        sameFile: c.sameFile,
        startedAt: c.startedAt,
        jobIds: c.jobIds,
        status: "running",
        progress: { phase: "queued", pct: 12, label: "Reprise du suivi" },
      },
    };
    const ids = c.jobIds.filter(Boolean) as string[];
    Promise.all(
      ids.map((id) =>
        waitForJob(id, () => {
          /* progression globale relue ci-dessous */
        })
      )
    )
      .then((rs) => {
        const ra = rs[0];
        const rb = rs[1] ?? ra;
        patchCompare({ status: "done", results: [ra, rb], progress: { phase: "done", pct: 100, label: "Terminé" } });
        done("compare");
      })
      .catch((e) => {
        patchCompare({ status: "error", error: msg(e, "La comparaison a échoué.") });
        done("compare");
      });
    // Jauge pendant la reprise : moyenne des deux tâches, relue toutes les secondes.
    const tick = window.setInterval(async () => {
      if (state.compare?.status !== "running") return window.clearInterval(tick);
      try {
        const js = await Promise.all(ids.map((id) => getAnalysisJob(id)));
        const ps = js.map(toProgress);
        const pct = Math.round(ps.reduce((s, x) => s + x.pct, 0) / ps.length);
        const cur = ps.find((x) => x.phase !== "done") ?? ps[0];
        patchCompare({ progress: { ...cur, pct: Math.min(99, pct) } });
      } catch {
        /* le suivi principal gère les erreurs */
      }
    }, 1200);
  }
}

if (typeof window !== "undefined") resume();

// Utilisé par les tests : remet l'état à zéro.
export function __resetForTests() {
  state = { single: null, compare: null };
  emit();
}

// Diagnostic (support) : état courant lisible depuis la console.
if (typeof window !== "undefined") {
  (window as unknown as { __apexBg?: () => unknown }).__apexBg = () => ({
    single: state.single && { ...state.single, result: !!state.single.result },
    compare: state.compare && { ...state.compare, results: !!state.compare.results },
    viewers: { ...viewers },
  });
}
