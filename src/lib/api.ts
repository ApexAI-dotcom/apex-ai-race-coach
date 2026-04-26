/**
 * Apex AI - API Client
 * Client TypeScript pour communiquer avec le backend FastAPI
 */

// Configuration - unique source for API URL (VITE_API_URL en prod)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_TIMEOUT_MS = 30000; // 30 secondes
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CSV_UPLOAD_HINT_SHORT = `Fichier CSV uniquement (max ${MAX_FILE_SIZE_MB} Mo). Compatible avec les exports MyChron 5 et 6 via Race Studio. Si le fichier est trop lourd, réduisez les canaux ou appliquez une décimation (ex. 1:10) dans Race Studio.`;

// ============================================================================
// TYPES
// ============================================================================
import { type PlotData } from "@/types/analysis";

export interface ScoreBreakdown {
  apex_precision: number;
  trajectory_consistency: number;
  apex_speed: number;
  sector_times: number;
}

export interface PerformanceScore {
  overall_score: number;
  grade: string; // "A+", "A", "B", "C", "D"
  breakdown: ScoreBreakdown;
  percentile?: number;
}

/** Max par catégorie (somme = 100). */
export const BREAKDOWN_MAX = {
  apex_precision: 30,
  trajectory_consistency: 25,
  apex_speed: 25,
  sector_times: 20,
} as const;

/**
 * Valeur de score à afficher : overall_score uniquement.
 * Si incohérence avec sum(breakdown) > 0.5, log warning et utilise la somme en fallback.
 */
export function getDisplayScore(ps: PerformanceScore | null | undefined): number {
  if (!ps) return 0;
  const b = ps.breakdown;
  const sum =
    (b?.apex_precision ?? 0) +
    (b?.trajectory_consistency ?? 0) +
    (b?.apex_speed ?? 0) +
    (b?.sector_times ?? 0);
  const overall = ps.overall_score ?? 0;
  if (Math.abs(sum - overall) > 0.5 && sum > 0) {
    console.warn(
      "[ApexAI] Score inconsistency: overall_score",
      overall,
      "!= sum(breakdown)",
      sum,
      "; using sum as fallback."
    );
    return Math.round(sum * 10) / 10;
  }
  return overall;
}

export interface PerLapCornerData {
  lap: number;
  apex_speed_kmh?: number;
  max_lateral_g?: number;
  time_lost?: number;
}

export interface CornerAnalysis {
  corner_id: number;
  corner_number: number;
  corner_type: string; // "left" | "right" | "unknown"
  apex_speed_real: number;
  apex_speed_optimal: number;
  speed_efficiency: number;
  apex_distance_error: number;
  apex_direction_error: string;
  lateral_g_max: number;
  time_lost: number;
  grade: string;
  score: number;
  entry_speed?: number | null;
  exit_speed?: number | null;
  target_entry_speed?: number | null;
  target_exit_speed?: number | null;
  label?: string;
  avg_note?: string;
  per_lap_data?: PerLapCornerData[];
  apex_lat?: number | null;
  apex_lon?: number | null;
  avg_cumulative_distance?: number | null;
}

const CORNER_KEYS: (keyof CornerAnalysis)[] = [
  "corner_id", "corner_number", "corner_type", "apex_speed_real", "apex_speed_optimal",
  "speed_efficiency", "apex_distance_error", "apex_direction_error", "lateral_g_max",
  "time_lost", "grade", "score"
];

/**
 * Normalise un objet virage brut de l'API vers CornerAnalysis.
 * Gère les clés alternatives (type → corner_type, apex_distance_m → apex_distance_error)
 * et log un warning si une clé attendue est absente.
 */
export function mapCornerData(raw: Record<string, unknown>): CornerAnalysis {
  const corner_type = (raw.corner_type ?? raw.type ?? "unknown") as string;
  const apex_distance_error = Number(raw.apex_distance_error ?? raw.apex_distance_m ?? 0);
  const time_lost = Number(raw.time_lost ?? 0);
  if (raw.type !== undefined && raw.corner_type === undefined) {
    console.warn("[ApexAI] corner: expected 'corner_type', got 'type'");
  }
  if (raw.apex_distance_m !== undefined && raw.apex_distance_error === undefined) {
    console.warn("[ApexAI] corner: expected 'apex_distance_error', got 'apex_distance_m'");
  }
  for (const k of CORNER_KEYS) {
    if (k === "corner_type" || k === "apex_distance_error" || k === "time_lost") continue;
    if (raw[k] === undefined && (k === "corner_id" || k === "corner_number" || k === "grade" || k === "score")) {
      console.warn("[ApexAI] corner: missing expected key", k);
    }
  }
  return {
    corner_id: Number(raw.corner_id ?? 0),
    corner_number: Number(raw.corner_number ?? raw.corner_id ?? 0),
    corner_type,
    apex_speed_real: Number(raw.apex_speed_real ?? 0),
    apex_speed_optimal: Number(raw.apex_speed_optimal ?? 0),
    speed_efficiency: Number(raw.speed_efficiency ?? 0),
    apex_distance_error,
    apex_direction_error: String(raw.apex_direction_error ?? "center"),
    lateral_g_max: Number(raw.lateral_g_max ?? 0),
    time_lost,
    grade: String(raw.grade ?? "C"),
    score: Number(raw.score ?? 50),
    entry_speed: raw.entry_speed != null ? Number(raw.entry_speed) : undefined,
    exit_speed: raw.exit_speed != null ? Number(raw.exit_speed) : undefined,
    target_entry_speed: raw.target_entry_speed != null ? Number(raw.target_entry_speed) : undefined,
    target_exit_speed: raw.target_exit_speed != null ? Number(raw.target_exit_speed) : undefined,
    label: raw.label != null ? String(raw.label) : undefined,
    avg_note: raw.avg_note != null ? String(raw.avg_note) : undefined,
    per_lap_data: Array.isArray(raw.per_lap_data) ? (raw.per_lap_data as PerLapCornerData[]) : undefined,
    apex_lat: raw.apex_lat != null ? Number(raw.apex_lat) : undefined,
    apex_lon: raw.apex_lon != null ? Number(raw.apex_lon) : undefined,
    avg_cumulative_distance: raw.avg_cumulative_distance != null ? Number(raw.avg_cumulative_distance) : undefined,
  };
}

export interface CoachingAdvice {
  priority: number;
  category: string; // "braking" | "apex" | "speed" | "trajectory" | "global"
  impact_seconds: number;
  corner?: number;
  message: string;
  explanation: string;
  difficulty: string; // "facile" | "moyen" | "difficile"
}

/**
 * Normalise un conseil brut (impact_seconds vs time_impact_seconds).
 */
function mapAdviceData(raw: Record<string, unknown>): CoachingAdvice {
  const impact_seconds = Number(raw.impact_seconds ?? raw.time_impact_seconds ?? 0);
  if (raw.time_impact_seconds !== undefined && raw.impact_seconds === undefined) {
    console.warn("[ApexAI] coaching: expected 'impact_seconds', got 'time_impact_seconds'");
  }
  return {
    priority: Number(raw.priority ?? 5),
    category: String(raw.category ?? "global"),
    impact_seconds,
    corner: raw.corner != null ? Number(raw.corner) : undefined,
    message: String(raw.message ?? ""),
    explanation: String(raw.explanation ?? ""),
    difficulty: String(raw.difficulty ?? "moyen"),
  };
}

export interface PlotUrls {
  trajectory_2d?: string;
  speed_heatmap?: string;
  lateral_g_chart?: string;
  speed_trace?: string;
  throttle_brake?: string;
  sector_times?: string;
  apex_precision?: string;
  performance_radar?: string;
  performance_score_breakdown?: string;
  corner_heatmap?: string;
  [key: string]: string | undefined;
}

export interface Statistics {
  processing_time_seconds: number;
  data_points: number;
  best_corners: number[];
  worst_corners: number[];
  avg_apex_distance: number;
  avg_apex_speed_efficiency: number;
  laps_analyzed?: number;
  fastest_lap_number?: number | null;
  max_speed?: number | null;
  max_speed_lap?: number | null;
  consistency_gap?: number | null;
  improvement_gap?: number | null;
}

export interface SessionConditions {
  session_name?: string | null;
  circuit_name?: string | null;
  track_condition: string; // "dry" | "damp" | "wet" | "rain"
  track_temperature?: number | null; // °C
}

export interface AnalysisResult {
  success: boolean;
  analysis_id: string;
  timestamp: string;
  corners_detected: number;
  lap_time: number;
  best_lap_time?: number | null;
  avg_lap_time?: number | null;
  lap_times?: number[] | null;
  performance_score: PerformanceScore;
  corner_analysis: CornerAnalysis[];
  coaching_advice: CoachingAdvice[];
  plots: PlotUrls;
  statistics: Statistics;
  session_conditions?: SessionConditions | null;
  session_type?: string;
  plot_data?: PlotData;
}

export interface LapInfo {
  lap_number: number;
  lap_time_seconds: number;
  points_count: number;
  is_outlier: boolean;
}

export interface ParseLapsResponse {
  success: boolean;
  laps: LapInfo[];
}

export interface AnalysisStatus {
  analysis_id: string;
  status: string; // "completed" | "processing" | "failed"
  message?: string;
}

export interface BackendHealth {
  status: string;
  version?: string;
  environment?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/** Élément de la liste paginée GET /api/analyses */
export interface AnalysisListItem {
  id?: string;
  track_name?: string | null;
  created_at?: string | null;
  lap_count?: number | null;
  ai_insights?: { braking_score?: number | null; [key: string]: unknown } | null;
  [key: string]: unknown;
}

export interface GetAnalysesResponse {
  analyses: AnalysisListItem[];
  page: number;
  limit: number;
  total: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Crée un AbortController avec timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Valide un fichier CSV avant upload
 */
function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Vérifier extension
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return {
      valid: false,
      error: "Le fichier doit être un CSV (.csv)",
    };
  }

  // Vérifier taille
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Fichier trop volumineux (${sizeMB} Mo). Maximum : ${MAX_FILE_SIZE_MB} Mo. Astuce : sous Race Studio, réduisez les canaux exportés ou appliquez une décimation (1:10) pour réduire la taille.`,
    };
  }

  if (file.size < 1000) {
    return {
      valid: false,
      error: "Fichier trop petit (<1KB). Vérifiez que c'est un CSV valide.",
    };
  }

  return { valid: true };
}

/**
 * Gère les erreurs de fetch et retourne un message utilisateur-friendly
 */
function handleFetchError(error: unknown, context: string): ApiError {
  if (error instanceof Error) {
    // Timeout
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "timeout",
        message: "L'analyse a pris trop de temps (timeout adaptatif 30-120s). Le fichier est peut-être extrêmement volumineux ou le serveur est saturé.",
      };
    }

    // Network error
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return {
        success: false,
        error: "network",
        message: `Impossible de se connecter au serveur. Vérifiez que le backend est accessible (${API_BASE_URL})`,
      };
    }

    // Autre erreur
    return {
      success: false,
      error: "unknown",
      message: `Erreur lors de ${context}: ${error.message}`,
    };
  }

  return {
    success: false,
    error: "unknown",
    message: `Erreur inconnue lors de ${context}`,
  };
}

/**
 * Parse une réponse JSON avec gestion d'erreurs
 */
async function parseJSONResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("Réponse vide du serveur");
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Réponse JSON invalide: ${text.substring(0, 100)}`);
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Upload et analyse un fichier CSV de télémétrie
 *
 * @param file - Fichier CSV à analyser
 * @param options - Optionnel : lapFilter = liste des numéros de tours à inclure
 * @returns Résultats de l'analyse complète
 * @throws ApiError en cas d'erreur
 */
export async function uploadAndAnalyzeCSV(
  file: File,
  options?: {
    lapFilter?: number[];
    track_condition?: string;
    track_temperature?: number | null;
    session_name?: string;
    accessToken?: string | null;
  }
): Promise<AnalysisResult> {
  // Validation du fichier
  const validation = validateCSVFile(file);
  if (!validation.valid) {
    throw {
      success: false,
      error: "validation",
      message: validation.error || "Erreur de validation",
    } as ApiError;
  }

  // Créer FormData
  const formData = new FormData();
  formData.append("file", file);
  if (options?.lapFilter && options.lapFilter.length > 0) {
    formData.append("lap_filter", JSON.stringify(options.lapFilter));
  }
  const cond = options?.track_condition && ["dry", "damp", "wet", "rain"].includes(options.track_condition)
    ? options.track_condition
    : "dry";
  formData.append("track_condition", cond);
  if (options?.track_temperature != null && Number.isFinite(options.track_temperature)) {
    formData.append("track_temperature", String(options.track_temperature));
  }
  if (options?.session_name) {
    formData.append("session_name", options.session_name);
  }

  // Créer controller avec timeout adaptatif
  let timeoutMs = 45000;
  if (file.size > 20 * 1024 * 1024) {
    timeoutMs = 180000;
  } else if (file.size > 5 * 1024 * 1024) {
    timeoutMs = 120000;
  }
  const controller = createTimeoutController(timeoutMs);

  const headers: Record<string, string> = {};
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: Object.keys(headers).length ? headers : undefined,
    });

    // Gérer erreurs HTTP
    if (!response.ok) {
      let errorData: ApiError;

      try {
        const errorJson = await parseJSONResponse<{ detail?: ApiError } & ApiError>(response);
        const d = errorJson.detail ?? errorJson;
        const isRateLimit = response.status === 429;
        const defaultMsg = typeof d.error === 'string' && !d.message ? d.error : d.message;
        
        errorData = {
          success: false,
          error: isRateLimit ? "rate_limit" : (d.error || "http_error"),
          message: isRateLimit 
            ? "Limite de requêtes atteinte. Veuillez patienter un instant avant de réessayer." 
            : (defaultMsg || `Erreur HTTP ${response.status}`),
          details: d.details,
        };
      } catch {
        // Si pas de JSON, créer erreur générique
        errorData = {
          success: false,
          error: "http_error",
          message: `Erreur serveur (${response.status}): ${response.statusText}`,
        };
      }

      throw errorData;
    }

    // Parser réponse JSON
    const result = await parseJSONResponse<AnalysisResult>(response);

    // Normaliser les clés backend (corner_type, apex_distance_error, time_lost)
    if (Array.isArray(result.corner_analysis)) {
      result.corner_analysis = (result.corner_analysis as unknown[]).map((c) => mapCornerData(c as Record<string, unknown>));
    }
    if (Array.isArray(result.coaching_advice)) {
      result.coaching_advice = (result.coaching_advice as unknown[]).map((a) => mapAdviceData(a as Record<string, unknown>));
    }

    // Vérifier que la réponse contient success: true
    if (!result.success) {
      throw {
        success: false,
        error: "analysis_failed",
        message: "L'analyse a échoué. Vérifiez que le fichier CSV est valide.",
      } as ApiError;
    }

    return result;
  } catch (error) {
    // Si c'est déjà une ApiError, la relancer
    if (error && typeof error === "object" && "success" in error && error.success === false) {
      throw error;
    }

    // Sinon, gérer comme erreur fetch
    throw handleFetchError(error, "l'upload et l'analyse du CSV");
  }
}

/**
 * Parse un fichier CSV et retourne la liste des tours détectés (pour sélection avant analyse).
 *
 * @param file - Fichier CSV
 * @returns Liste des tours avec lap_number, lap_time_seconds, points_count, is_outlier
 */
export async function parseLaps(file: File): Promise<ParseLapsResponse> {
  const validation = validateCSVFile(file);
  if (!validation.valid) {
    throw {
      success: false,
      error: "validation",
      message: validation.error || "Erreur de validation",
    } as ApiError;
  }
  const formData = new FormData();
  formData.append("file", file);
  // Increase timeout for heavy files during initial upload
  const controller = createTimeoutController(120000);
  const response = await fetch(`${API_BASE_URL}/api/v1/parse-laps`, {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });
  if (!response.ok) {
    const err = (await parseJSONResponse<ApiError>(response).catch(() => ({ }))) as any;
    const isRateLimit = response.status === 429;
    const defaultMsg = typeof err.error === 'string' && !err.message ? err.error : err.message;

    throw {
      success: false,
      error: isRateLimit ? "rate_limit" : (err.error || "http_error"),
      message: isRateLimit 
        ? "Limite de requêtes atteinte. Veuillez patienter un instant."
        : (defaultMsg || `Erreur ${response.status}`),
    } as ApiError;
  }
  const data = await parseJSONResponse<ParseLapsResponse>(response);
  if (!data.success || !Array.isArray(data.laps)) {
    throw { success: false, error: "invalid_response", message: "Réponse parse-laps invalide" } as ApiError;
  }
  return data;
}

/**
 * Récupère le statut d'une analyse
 *
 * @param analysisId - ID de l'analyse
 * @returns Statut de l'analyse
 * @throws ApiError en cas d'erreur
 */
export async function getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
  if (!analysisId || analysisId.trim() === "") {
    throw {
      success: false,
      error: "validation",
      message: "ID d'analyse invalide",
    } as ApiError;
  }

  const controller = createTimeoutController(10000); // 10s pour status

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/status/${analysisId}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw {
        success: false,
        error: "http_error",
        message: `Erreur lors de la récupération du statut (${response.status})`,
      } as ApiError;
    }

    return await parseJSONResponse<AnalysisStatus>(response);
  } catch (error) {
    if (error && typeof error === "object" && "success" in error && error.success === false) {
      throw error;
    }
    throw handleFetchError(error, "la récupération du statut");
  }
}

/**
 * Vérifie si le backend est accessible et opérationnel
 *
 * @returns Statut de santé du backend
 * @throws ApiError si le backend n'est pas accessible
 */
export async function getBackendHealth(): Promise<BackendHealth> {
  const controller = createTimeoutController(5000); // 5s pour health check

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw {
        success: false,
        error: "http_error",
        message: `Backend non disponible (${response.status})`,
      } as ApiError;
    }

    return await parseJSONResponse<BackendHealth>(response);
  } catch (error) {
    if (error && typeof error === "object" && "success" in error && error.success === false) {
      throw error;
    }
    throw handleFetchError(error, "la vérification de santé du backend");
  }
}

/**
 * Vérifie la connectivité au backend avant d'effectuer une analyse
 * Utile pour afficher un message d'erreur précoce à l'utilisateur
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    await getBackendHealth();
    return true;
  } catch {
    return false;
  }
}

/** Clés price_id acceptées par le backend Stripe */
export type StripePriceId =
  | "racer_monthly"
  | "racer_annual"
  | "team_monthly"
  | "team_annual";

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
}

/**
 * Crée une session Stripe Checkout pour abonnement.
 * Rediriger l'utilisateur vers checkout_url après appel réussi.
 */
export async function createCheckoutSession(
  accessToken: string,
  priceId: StripePriceId
): Promise<CreateCheckoutSessionResponse> {
  const controller = createTimeoutController(15000);
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ price_id: priceId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (data?.message as string) || (data?.detail?.message as string) || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return parseJSONResponse<CreateCheckoutSessionResponse>(response);
}

export interface CreatePortalSessionResponse {
  portal_url: string;
}

/**
 * Crée une session Stripe Customer Portal pour gérer l'abonnement.
 * Rediriger l'utilisateur vers portal_url après appel réussi.
 */
export async function createPortalSession(accessToken: string): Promise<CreatePortalSessionResponse> {
  const controller = createTimeoutController(15000);
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (data?.message as string) || (data?.detail?.message as string) || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return parseJSONResponse<CreatePortalSessionResponse>(response);
}

/**
 * Liste paginée des analyses de l'utilisateur (JWT obligatoire).
 * GET /api/analyses?page=&limit=
 */
export async function getAnalyses(
  accessToken: string,
  page: number = 1,
  limit: number = 20
): Promise<GetAnalysesResponse> {
  const controller = createTimeoutController(15000);
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/api/analyses?${params}`, {
    method: "GET",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      (data?.message as string) || (data?.detail?.message as string) || `Erreur ${response.status}`;
    throw new Error(message);
  }
  return parseJSONResponse<GetAnalysesResponse>(response);
}

// ============================================================================
// HOME — Tips, Insights, Reset
// ============================================================================

export interface HomeTip {
  badge: string;
  badge_color: string;
  title: string;
  body: string;
}

export interface HomeTipsResponse {
  week: number;
  tips: HomeTip[];
}

export interface HomeWeakPoint {
  label: string;
  corners: number[];
}

export interface HomeInsightsResponse {
  insufficient_data: boolean;
  time_gained: number | null;
  weak_point: HomeWeakPoint | null;
  best_score: number;
  best_lap_time: number;
  analyses_count: number;
  baseline_score: number | null;
  baseline_time: number | null;
  reset_at: string | null;
}

export interface HomeResetResponse {
  success: boolean;
  baseline_score: number | null;
  baseline_time: number | null;
  reset_at: string;
}

/**
 * Fetch weekly rotating driving tips (public, no auth).
 */
export async function fetchHomeTips(): Promise<HomeTipsResponse> {
  const controller = createTimeoutController(10000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/home/tips`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    return await parseJSONResponse<HomeTipsResponse>(response);
  } catch (error) {
    console.warn("[ApexAI] fetchHomeTips failed:", error);
    // Return fallback
    return {
      week: 0,
      tips: [
        { badge: "Nouveau", badge_color: "blue", title: "Optimise tes freinages", body: "Un freinage progressif en 3 temps permet de gagner 0.3s par virage en moyenne." },
        { badge: "Populaire", badge_color: "purple", title: "Le regard en sortie", body: "Regarde toujours la sortie du virage, pas l'apex. Ta trajectoire suivra ton regard." },
      ],
    };
  }
}

/**
 * Fetch personalized homepage insights (JWT required).
 */
export async function fetchHomeInsights(accessToken: string): Promise<HomeInsightsResponse> {
  const controller = createTimeoutController(15000);
  const response = await fetch(`${API_BASE_URL}/api/home/insights`, {
    method: "GET",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<HomeInsightsResponse>(response);
}

/**
 * Reset objectives baseline (JWT required).
 */
export async function resetHomeInsights(accessToken: string): Promise<HomeResetResponse> {
  const controller = createTimeoutController(15000);
  const response = await fetch(`${API_BASE_URL}/api/home/insights/reset`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<HomeResetResponse>(response);
}

// ============================================================================
// MON KART (MVP)
// ============================================================================

export interface KartProfile {
  user_id: string;
  engine_hours_current: number;
  engine_sessions: number;
  tires_sessions_current: number;
  brakes_sessions_current: number;
  battery_voltage_last: number | null;
  battery_voltage_min_ever: number | null;
  mon_kart_enabled: boolean;
  driving_profile?: 'longevity' | 'performance' | 'balanced' | 'leisure';
  
  engine_model?: string | null;
  engine_preset?: string | null;
  engine_hours_life?: number;
  
  tires_model?: string | null;
  tires_preset?: string | null;
  tires_sessions_life?: number;
  
  brakes_model?: string | null;
  brakes_preset?: string | null;
  brakes_sessions_life?: number;
  
  setup_json?: any;
  saved_setups?: any[];
}

export interface KartProfileResponse {
  profile: KartProfile;
  recent_sessions: any[]; // Tableau de log_sessions
  history?: any[]; // Tableau de kart_component_history
}

export async function getKartProfile(accessToken: string): Promise<KartProfileResponse> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/profile`, {
    method: "GET",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<KartProfileResponse>(response);
}

export async function updateKartProfile(accessToken: string, updates: Partial<KartProfile>): Promise<{ profile: KartProfile }> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/profile`, {
    method: "PUT",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<{ profile: KartProfile }>(response);
}

export async function resetKartComponent(accessToken: string, componentType: "engine" | "tires" | "brakes", notes?: string): Promise<{ profile: KartProfile }> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/component-reset`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ component_type: componentType, notes }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<{ profile: KartProfile }>(response);
}

export async function addKartHistoryEntry(accessToken: string, componentType: string, notes: string, date?: string): Promise<{ entry: any }> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/history/add`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ component_type: componentType, notes, date }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse(response);
}

export async function bulkImportKartSessions(accessToken: string, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const controller = createTimeoutController(60000);
  const response = await fetch(`${API_BASE_URL}/api/kart/bulk-import`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<any>(response);
}

export async function deleteKartSession(accessToken: string, sessionId: string): Promise<any> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/session/${sessionId}`, {
    method: "DELETE",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<any>(response);
}

export async function deleteKartHistoryEntry(accessToken: string, entryId: string): Promise<any> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/history/${entryId}`, {
    method: "DELETE",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<any>(response);
}

export async function deleteKartSessionDay(accessToken: string, date: string): Promise<any> {
  const controller = createTimeoutController(10000);
  const response = await fetch(`${API_BASE_URL}/api/kart/day/${date}`, {
    method: "DELETE",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data?.detail as string) || `Erreur ${response.status}`);
  }
  return await parseJSONResponse<any>(response);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  uploadAndAnalyzeCSV,
  getAnalysisStatus,
  getBackendHealth,
  checkBackendConnection,
  getAnalyses,
  fetchHomeTips,
  fetchHomeInsights,
  resetHomeInsights,
  getKartProfile,
  updateKartProfile,
  resetKartComponent,
  bulkImportKartSessions,
  deleteKartSession,
  deleteKartHistoryEntry,
  deleteKartSessionDay,
  API_BASE_URL,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  CSV_UPLOAD_HINT_SHORT,
};
