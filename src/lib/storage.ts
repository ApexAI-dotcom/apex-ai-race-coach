/**
 * Apex AI - Local Storage System
 * Système de stockage local pour les résultats d'analyse
 * Utilise localStorage du navigateur pour persister les analyses
 */

import type { AnalysisResult } from "./api";

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisSummary {
  id: string;
  date: string;
  timestamp: number;
  score: number;
  corner_count: number;
  lap_time: number;
  grade: string;
  filename?: string;
}

interface StoredAnalysis {
  id: string;
  timestamp: number;
  result: AnalysisResult;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_PREFIX = "apex_analysis_";
const STORAGE_INDEX_KEY = "apex_analyses_index";
const MAX_STORED_ANALYSES = 20; // Limite d'analyses dans localStorage

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Génère un ID unique pour une analyse
 */
function generateAnalysisId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
}

/**
 * Récupère l'index des analyses depuis localStorage
 */
function getAnalysesIndex(): string[] {
  try {
    const indexJson = localStorage.getItem(STORAGE_INDEX_KEY);
    if (!indexJson) return [];
    return JSON.parse(indexJson) as string[];
  } catch (error) {
    console.error("Error reading analyses index:", error);
    return [];
  }
}

/**
 * Sauvegarde l'index des analyses dans localStorage
 */
function saveAnalysesIndex(index: string[]): void {
  try {
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error("Error saving analyses index:", error);
  }
}

/**
 * Nettoie les anciennes analyses si on dépasse la limite
 */
function cleanupOldAnalyses(): void {
  try {
    const index = getAnalysesIndex();

    if (index.length <= MAX_STORED_ANALYSES) {
      return;
    }

    // Trier par timestamp (plus ancien en premier)
    const analysesWithTimestamps = index.map((id) => {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (!stored) return { id, timestamp: 0 };

      try {
        const data = JSON.parse(stored) as StoredAnalysis;
        return { id, timestamp: data.timestamp };
      } catch {
        return { id, timestamp: 0 };
      }
    });

    analysesWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

    // Supprimer les plus anciennes
    const toRemove = analysesWithTimestamps.slice(0, index.length - MAX_STORED_ANALYSES);

    for (const item of toRemove) {
      localStorage.removeItem(`${STORAGE_PREFIX}${item.id}`);
    }

    // Mettre à jour l'index
    const newIndex = analysesWithTimestamps
      .slice(index.length - MAX_STORED_ANALYSES)
      .map((item) => item.id);

    saveAnalysesIndex(newIndex);
  } catch (error) {
    console.error("Error cleaning up old analyses:", error);
  }
}

/**
 * Vérifie si localStorage est disponible
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Sauvegarde un résultat d'analyse
 *
 * @param result - Résultat de l'analyse à sauvegarder
 * @returns ID unique de l'analyse sauvegardée
 */
export async function saveAnalysis(result: AnalysisResult): Promise<string> {
  if (!isLocalStorageAvailable()) {
    throw new Error("localStorage n'est pas disponible dans ce navigateur");
  }

  try {
    // Générer un ID unique si pas déjà présent
    const analysisId = result.analysis_id || generateAnalysisId();
    const timestamp = Date.now();

    // Créer l'objet à stocker
    const stored: StoredAnalysis = {
      id: analysisId,
      timestamp,
      result: {
        ...result,
        analysis_id: analysisId,
      },
    };

    // Sauvegarder dans localStorage
    const storageKey = `${STORAGE_PREFIX}${analysisId}`;
    localStorage.setItem(storageKey, JSON.stringify(stored));

    // Mettre à jour l'index
    const index = getAnalysesIndex();
    if (!index.includes(analysisId)) {
      index.push(analysisId);
      saveAnalysesIndex(index);
    }

    // Nettoyer les anciennes analyses
    cleanupOldAnalyses();

    return analysisId;
  } catch (error) {
    console.error("Error saving analysis:", error);
    throw new Error(
      `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Récupère toutes les analyses sauvegardées (résumés)
 *
 * @returns Tableau des résumés d'analyses, trié par date (plus récent en premier)
 */
export async function getAllAnalyses(): Promise<AnalysisSummary[]> {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const index = getAnalysesIndex();
    const summaries: AnalysisSummary[] = [];

    for (const id of index) {
      try {
        const storedJson = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (!storedJson) continue;

        const stored = JSON.parse(storedJson) as StoredAnalysis;
        const result = stored.result;

        summaries.push({
          id: stored.id,
          date: new Date(stored.timestamp).toISOString(),
          timestamp: stored.timestamp,
          score: Math.round(result.performance_score.overall_score),
          corner_count: result.corners_detected,
          lap_time: result.lap_time,
          grade: result.performance_score.grade,
          filename: result.analysis_id ? `${result.analysis_id}.json` : undefined,
        });
      } catch (error) {
        console.warn(`Error reading analysis ${id}:`, error);
        // Continuer avec les autres analyses
      }
    }

    // Trier par date (plus récent en premier)
    summaries.sort((a, b) => b.timestamp - a.timestamp);

    return summaries;
  } catch (error) {
    console.error("Error getting all analyses:", error);
    return [];
  }
}

/**
 * Récupère une analyse complète par son ID
 *
 * @param id - ID de l'analyse
 * @returns Résultat complet de l'analyse ou null si non trouvé
 */
export async function getAnalysisById(id: string): Promise<AnalysisResult | null> {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  if (!id || id.trim() === "") {
    return null;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${id}`;
    const storedJson = localStorage.getItem(storageKey);

    if (!storedJson) {
      return null;
    }

    const stored = JSON.parse(storedJson) as StoredAnalysis;
    return stored.result;
  } catch (error) {
    console.error(`Error getting analysis ${id}:`, error);
    return null;
  }
}

/**
 * Supprime une analyse
 *
 * @param id - ID de l'analyse à supprimer
 * @returns true si la suppression a réussi, false sinon
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  if (!id || id.trim() === "") {
    return false;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${id}`;

    // Vérifier si l'analyse existe
    if (!localStorage.getItem(storageKey)) {
      return false;
    }

    // Supprimer l'analyse
    localStorage.removeItem(storageKey);

    // Mettre à jour l'index
    const index = getAnalysesIndex();
    const newIndex = index.filter((analysisId) => analysisId !== id);
    saveAnalysesIndex(newIndex);

    return true;
  } catch (error) {
    console.error(`Error deleting analysis ${id}:`, error);
    return false;
  }
}

/**
 * Exporte une analyse en tant que Blob JSON téléchargeable
 *
 * @param id - ID de l'analyse à exporter
 * @returns Blob contenant le JSON de l'analyse
 */
export async function exportAnalysisAsJSON(id: string): Promise<Blob> {
  const analysis = await getAnalysisById(id);

  if (!analysis) {
    throw new Error(`Analyse non trouvée: ${id}`);
  }

  try {
    const jsonString = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    return blob;
  } catch (error) {
    console.error(`Error exporting analysis ${id}:`, error);
    throw new Error(
      `Erreur lors de l'export: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Télécharge une analyse en tant que fichier JSON
 *
 * @param id - ID de l'analyse à télécharger
 * @param filename - Nom du fichier (optionnel, par défaut: apex-analysis-{id}.json)
 */
export async function downloadAnalysis(id: string, filename?: string): Promise<void> {
  try {
    const blob = await exportAnalysisAsJSON(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `apex-analysis-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Error downloading analysis ${id}:`, error);
    throw error;
  }
}

/**
 * Récupère le nombre d'analyses sauvegardées
 *
 * @returns Nombre d'analyses dans le stockage
 */
export async function getAnalysesCount(): Promise<number> {
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  try {
    const index = getAnalysesIndex();
    return index.length;
  } catch (error) {
    console.error("Error getting analyses count:", error);
    return 0;
  }
}

/**
 * Vide toutes les analyses sauvegardées
 *
 * @returns Nombre d'analyses supprimées
 */
export async function clearAllAnalyses(): Promise<number> {
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  try {
    const index = getAnalysesIndex();
    let deletedCount = 0;

    for (const id of index) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
        deletedCount++;
      } catch (error) {
        console.warn(`Error deleting analysis ${id}:`, error);
      }
    }

    // Vider l'index
    localStorage.removeItem(STORAGE_INDEX_KEY);

    return deletedCount;
  } catch (error) {
    console.error("Error clearing all analyses:", error);
    return 0;
  }
}

/**
 * Vérifie si une analyse existe
 *
 * @param id - ID de l'analyse
 * @returns true si l'analyse existe, false sinon
 */
export async function analysisExists(id: string): Promise<boolean> {
  if (!isLocalStorageAvailable() || !id || id.trim() === "") {
    return false;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${id}`;
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    console.error(`Error checking if analysis ${id} exists:`, error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  saveAnalysis,
  getAllAnalyses,
  getAnalysisById,
  deleteAnalysis,
  exportAnalysisAsJSON,
  downloadAnalysis,
  getAnalysesCount,
  clearAllAnalyses,
  analysisExists,
};
