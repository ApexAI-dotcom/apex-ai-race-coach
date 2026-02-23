/**
 * Apex AI - API Client
 * Client TypeScript pour communiquer avec le backend FastAPI
 */

// Configuration - unique source for API URL (VITE_API_URL en prod)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_TIMEOUT_MS = 30000; // 30 secondes
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================================
// TYPES
// ============================================================================

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
}

export interface SessionConditions {
  track_condition: string; // "dry" | "damp" | "wet" | "rain"
  track_temperature?: number | null; // °C
}

export interface AnalysisResult {
  success: boolean;
  analysis_id: string;
  timestamp: string;
  corners_detected: number;
  lap_time: number;
  performance_score: PerformanceScore;
  corner_analysis: CornerAnalysis[];
  coaching_advice: CoachingAdvice[];
  plots: PlotUrls;
  statistics: Statistics;
  session_conditions?: SessionConditions | null;
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
      error: `Fichier trop volumineux (${sizeMB}MB). Maximum: ${MAX_FILE_SIZE_MB}MB`,
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
        message: "La requête a expiré (timeout 30s). Le fichier est peut-être trop volumineux.",
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
  options?: { lapFilter?: number[]; track_condition?: string; track_temperature?: number | null }
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

  // Créer controller avec timeout
  const controller = createTimeoutController(API_TIMEOUT_MS);

  try {
    // Requête POST
    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      // Headers sont automatiquement gérés par fetch pour FormData
    });

    // Gérer erreurs HTTP
    if (!response.ok) {
      let errorData: ApiError;

      try {
        const errorJson = await parseJSONResponse<ApiError>(response);
        errorData = {
          success: false,
          error: errorJson.error || "http_error",
          message: errorJson.message || `Erreur HTTP ${response.status}`,
          details: errorJson.details,
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
  const controller = createTimeoutController(20000);
  const response = await fetch(`${API_BASE_URL}/api/v1/parse-laps`, {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });
  if (!response.ok) {
    const err = await parseJSONResponse<ApiError>(response).catch(() => ({}));
    throw {
      success: false,
      error: err.error || "http_error",
      message: err.message || `Erreur ${response.status}`,
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  uploadAndAnalyzeCSV,
  getAnalysisStatus,
  getBackendHealth,
  checkBackendConnection,
  API_BASE_URL,
};
