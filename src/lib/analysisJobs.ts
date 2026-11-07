/**
 * Analyses en tâche de fond, côté app.
 *
 * Le fichier est déposé (avec la progression réelle de l'envoi), le serveur
 * répond aussitôt par un numéro de tâche, puis l'app lit la progression
 * RÉELLE du calcul (étape en cours, place dans la file) jusqu'au résultat.
 * Plus aucune requête ne reste ouverte pendant le calcul : il n'y a plus de
 * délai dépassé côté navigateur, et le pilote peut changer de page.
 */
import { API_BASE_URL, finalizeAnalysisResult, validateCSVFile, type AnalysisResult, type ApiError } from "./api";

export type JobMode = "full" | "light";

export interface JobState {
  job_id: string;
  status: "queued" | "running" | "done" | "error";
  mode: JobMode;
  progress: number;
  step: string;
  position: number;
  cached: boolean;
  elapsed_s: number;
  result?: AnalysisResult;
  error?: { error: string; message: string };
}

export interface JobOptions {
  mode?: JobMode;
  lapFilter?: number[];
  track_condition?: string;
  track_temperature?: number | null;
  session_name?: string;
  accessToken?: string | null;
}

/** Vue d'ensemble affichée par la jauge : envoi (0-12 %) puis calcul serveur (12-100 %). */
export interface JobProgress {
  phase: "upload" | "queued" | "running" | "done";
  pct: number;
  label: string;
  position?: number;
}

const UPLOAD_SHARE = 12;

function apiError(error: string, message: string): ApiError {
  return { success: false, error, message } as ApiError;
}

/** Dépose le fichier ; la progression de l'envoi est réelle (XMLHttpRequest). */
export function startAnalysisJob(file: File, opts: JobOptions, onUpload?: (pct: number) => void): Promise<JobState> {
  const validation = validateCSVFile(file);
  if (!validation.valid) return Promise.reject(apiError("validation", validation.error || "Fichier invalide"));

  const form = new FormData();
  form.append("file", file);
  form.append("mode", opts.mode ?? "full");
  if (opts.lapFilter?.length) form.append("lap_filter", JSON.stringify(opts.lapFilter));
  const cond = opts.track_condition && ["dry", "damp", "wet", "rain", "auto"].includes(opts.track_condition) ? opts.track_condition : "auto";
  form.append("track_condition", cond);
  if (opts.track_temperature != null && Number.isFinite(opts.track_temperature)) form.append("track_temperature", String(opts.track_temperature));
  if (opts.session_name) form.append("session_name", opts.session_name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/analysis/jobs`);
    if (opts.accessToken) xhr.setRequestHeader("Authorization", `Bearer ${opts.accessToken}`);
    // L'envoi seul a un délai : au-delà de 2 min sans fin d'envoi, la connexion est en cause.
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onUpload?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* réponse non JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as unknown as JobState);
        return;
      }
      const d = ((body.detail as Record<string, unknown>) ?? body) as { error?: string; message?: string };
      if (xhr.status === 404) return reject(apiError("jobs_unavailable", "Service d'analyse en cours de mise à jour."));
      if (xhr.status === 429) return reject(apiError("rate_limit", "Trop d'analyses d'un coup. Patiente une minute avant de relancer."));
      reject(apiError(d.error || "http_error", d.message || `Erreur serveur (${xhr.status}).`));
    };
    xhr.onerror = () => reject(apiError("network_error", "Connexion perdue pendant l'envoi du fichier. Vérifie ton réseau et réessaie."));
    xhr.ontimeout = () => reject(apiError("timeout", "L'envoi du fichier est trop lent. Vérifie ton réseau et réessaie."));
    xhr.send(form);
  });
}

export async function getAnalysisJob(jobId: string): Promise<JobState> {
  const r = await fetch(`${API_BASE_URL}/api/analysis/jobs/${encodeURIComponent(jobId)}`);
  const body = await r.json().catch(() => ({}));
  if (r.status === 404) throw apiError("job_not_found", body?.detail?.message ?? "Cette analyse n'est plus suivie par le serveur. Relance-la.");
  if (!r.ok) throw apiError("http_error", `Erreur serveur (${r.status}).`);
  return body as JobState;
}

export function toProgress(job: JobState): JobProgress {
  if (job.status === "done") return { phase: "done", pct: 100, label: job.cached ? "Déjà analysé : résultat retrouvé" : "Terminé" };
  if (job.status === "queued") {
    return {
      phase: "queued",
      pct: UPLOAD_SHARE,
      label: job.position > 0 ? `En file d'attente : ${job.position} analyse${job.position > 1 ? "s" : ""} avant la tienne` : "Démarrage de l'analyse",
      position: job.position,
    };
  }
  return { phase: "running", pct: Math.round(UPLOAD_SHARE + ((100 - UPLOAD_SHARE) * job.progress) / 100), label: job.step };
}

export function uploadProgress(pct: number): JobProgress {
  return { phase: "upload", pct: Math.round((UPLOAD_SHARE * pct) / 100), label: pct < 100 ? `Envoi du fichier : ${pct} %` : "Fichier reçu" };
}

/**
 * Suit une tâche jusqu'au bout. Un réseau qui coupe quelques secondes (tunnel,
 * paddock) n'arrête rien : on réessaie pendant une minute avant d'abandonner.
 */
export async function waitForJob(
  jobId: string,
  onUpdate: (job: JobState) => void,
  signal?: { cancelled: boolean }
): Promise<AnalysisResult> {
  let failingSince: number | null = null;
  let delay = 600;
  for (;;) {
    if (signal?.cancelled) throw apiError("cancelled", "Suivi interrompu.");
    try {
      const job = await getAnalysisJob(jobId);
      failingSince = null;
      onUpdate(job);
      if (job.status === "done" && job.result) return finalizeAnalysisResult(job.result);
      if (job.status === "error") throw apiError(job.error?.error ?? "analysis_failed", job.error?.message ?? "L'analyse a échoué.");
      delay = job.status === "queued" ? 1200 : 700;
    } catch (e) {
      const err = e as ApiError;
      if (err?.error && err.error !== "http_error") throw e;
      failingSince ??= Date.now();
      if (Date.now() - failingSince > 60000) {
        throw apiError("network_error", "Le serveur ne répond plus. Ton analyse continue peut-être : regarde dans Sessions dans un instant.");
      }
      delay = 2000;
    }
    await new Promise((r) => setTimeout(r, delay));
  }
}

/** Raccourci : dépôt + suivi + résultat, avec une seule fonction de progression. */
export async function analyzeInBackground(
  file: File,
  opts: JobOptions,
  onProgress?: (p: JobProgress) => void,
  onJob?: (jobId: string) => void
): Promise<AnalysisResult> {
  onProgress?.(uploadProgress(0));
  const job = await startAnalysisJob(file, opts, (pct) => onProgress?.(uploadProgress(pct)));
  onJob?.(job.job_id);
  if (job.status === "done" && job.result) {
    onProgress?.(toProgress(job));
    return finalizeAnalysisResult(job.result);
  }
  onProgress?.(toProgress(job));
  return waitForJob(job.job_id, (j) => onProgress?.(toProgress(j)));
}
