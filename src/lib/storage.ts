/**
 * Apex AI — Storage System
 * Hybrid: Supabase (authenticated users) + localStorage (guests)
 *
 * All public functions keep the same async signatures as before,
 * so every consumer (Dashboard, CSVUploader, Profile, etc.) works unchanged.
 */

import { supabase } from "./supabase";
import {
  uploadPlotImages,
  getPlotSignedUrls,
  deletePlotImages,
} from "./supabase-storage";
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
  circuit_name?: string;
  session_name?: string;
}

interface StoredAnalysis {
  id: string;
  timestamp: number;
  result: AnalysisResult;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_INDEX_PREFIX = "apex_analyses_index_";
const STORAGE_ITEM_PREFIX = "apex_analysis_";
const STORAGE_GUEST = "guest";
const MAX_STORED_ANALYSES = 20;
const MIGRATION_KEY_PREFIX = "apex_migrated_";

// ============================================================================
// INTERNAL HELPERS — localStorage (Guest fallback)
// ============================================================================

function getStorageSuffix(userId: string | null | undefined): string {
  return userId && typeof userId === "string" && userId.trim()
    ? userId.trim()
    : STORAGE_GUEST;
}
function getIndexKey(s: string) { return `${STORAGE_INDEX_PREFIX}${s}`; }
function getItemKey(s: string, id: string) { return `${STORAGE_ITEM_PREFIX}${s}_${id}`; }

function generateAnalysisId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function isLocalStorageAvailable(): boolean {
  try {
    const t = "__ls_test__";
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    return true;
  } catch { return false; }
}

function getAnalysesIndexLS(suffix: string): string[] {
  try {
    const raw = localStorage.getItem(getIndexKey(suffix));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAnalysesIndexLS(index: string[], suffix: string): void {
  try { localStorage.setItem(getIndexKey(suffix), JSON.stringify(index)); } catch {}
}

function cleanupOldAnalysesLS(suffix: string): void {
  try {
    const index = getAnalysesIndexLS(suffix);
    if (index.length <= MAX_STORED_ANALYSES) return;
    const prefix = `${STORAGE_ITEM_PREFIX}${suffix}_`;
    const items = index.map((id) => {
      const s = localStorage.getItem(prefix + id);
      if (!s) return { id, timestamp: 0 };
      try { return { id, timestamp: (JSON.parse(s) as StoredAnalysis).timestamp }; }
      catch { return { id, timestamp: 0 }; }
    });
    items.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = items.slice(0, items.length - MAX_STORED_ANALYSES);
    for (const item of toRemove) localStorage.removeItem(prefix + item.id);
    saveAnalysesIndexLS(items.slice(items.length - MAX_STORED_ANALYSES).map((i) => i.id), suffix);
  } catch {}
}

// ============================================================================
// INTERNAL HELPERS — Supabase
// ============================================================================

async function getSupabaseUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Reconstruct a full AnalysisResult from the Supabase row + signed image URLs.
 */
async function rowToAnalysisResult(row: any, userId: string): Promise<AnalysisResult> {
  // Get signed URLs for images
  let plots: Record<string, string> = {};
  if (row.plot_keys && row.plot_keys.length > 0) {
    plots = await getPlotSignedUrls(userId, row.id, row.plot_keys);
  }

  return {
    success: true,
    analysis_id: row.id,
    timestamp: row.created_at,
    corners_detected: row.corners_detected ?? 0,
    lap_time: row.lap_time ?? 0,
    best_lap_time: row.best_lap_time,
    lap_times: row.lap_times,
    performance_score: row.performance_score ?? { overall_score: 0, grade: "C", breakdown: {} },
    corner_analysis: row.corner_analysis ?? [],
    coaching_advice: row.coaching_advice ?? [],
    plots,
    statistics: row.statistics ?? {},
    session_conditions: row.session_conditions,
    plot_data: row.plot_data,
  };
}

// ============================================================================
// PUBLIC API — Analyses
// ============================================================================

/**
 * Save an analysis result.
 * - Authenticated user → Supabase DB + Storage
 * - Guest → localStorage
 */
export async function saveAnalysis(result: AnalysisResult, userId?: string | null): Promise<string> {
  const supaUserId = await getSupabaseUserId();

  // ─── Supabase path ───
  if (supaUserId) {
    const analysisId = result.analysis_id || generateAnalysisId();

    // 1. Upload plot images to Storage bucket
    let plotKeys: string[] = [];
    if (result.plots && typeof result.plots === "object") {
      plotKeys = await uploadPlotImages(supaUserId, analysisId, result.plots as Record<string, string>);
    }

    // 2. Insert row into analyses table
    const { error } = await supabase.from("analyses").upsert({
      id: analysisId,
      user_id: supaUserId,
      created_at: new Date().toISOString(),
      score: Math.round(result.performance_score?.overall_score ?? 0),
      grade: result.performance_score?.grade ?? "C",
      lap_time: result.lap_time,
      best_lap_time: result.best_lap_time,
      corners_detected: result.corners_detected,
      circuit_name: result.session_conditions?.circuit_name,
      session_name: result.session_conditions?.session_name,
      session_type: "practice",
      corner_analysis: result.corner_analysis,
      coaching_advice: result.coaching_advice,
      plot_data: result.plot_data,
      performance_score: result.performance_score,
      statistics: result.statistics,
      session_conditions: result.session_conditions,
      lap_times: result.lap_times,
      plot_keys: plotKeys,
    });

    if (error) throw new Error(`Supabase save failed: ${error.message}`);

    // 3. Also cache lightweight metadata in localStorage for fast reads
    try {
      const cacheKey = `apex_cache_${supaUserId}`;
      const cache = JSON.parse(localStorage.getItem(cacheKey) || "[]") as AnalysisSummary[];
      const summary: AnalysisSummary = {
        id: analysisId,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        score: Math.round(result.performance_score?.overall_score ?? 0),
        corner_count: result.corners_detected,
        lap_time: result.lap_time,
        grade: result.performance_score?.grade ?? "C",
        circuit_name: result.session_conditions?.circuit_name || undefined,
        session_name: result.session_conditions?.session_name || undefined,
      };
      cache.unshift(summary);
      localStorage.setItem(cacheKey, JSON.stringify(cache.slice(0, 50)));
    } catch {}

    return analysisId;
  }

  // ─── Guest fallback (localStorage) ───
  if (!isLocalStorageAvailable()) throw new Error("localStorage non disponible");

  const suffix = getStorageSuffix(userId);
  const analysisId = result.analysis_id || generateAnalysisId();
  const stored: StoredAnalysis = {
    id: analysisId,
    timestamp: Date.now(),
    result: { ...result, analysis_id: analysisId },
  };
  localStorage.setItem(getItemKey(suffix, analysisId), JSON.stringify(stored));
  const index = getAnalysesIndexLS(suffix);
  if (!index.includes(analysisId)) {
    index.push(analysisId);
    saveAnalysesIndexLS(index, suffix);
  }
  cleanupOldAnalysesLS(suffix);
  return analysisId;
}

/**
 * Get all analysis summaries (lightweight list).
 */
export async function getAllAnalyses(userId?: string | null): Promise<AnalysisSummary[]> {
  const supaUserId = await getSupabaseUserId();

  // ─── Supabase path ───
  if (supaUserId) {
    const { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, score, grade, lap_time, corners_detected, circuit_name, session_name")
      .eq("user_id", supaUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase] getAllAnalyses failed:", error.message);
      // Fallback to cache
      try {
        const cache = JSON.parse(localStorage.getItem(`apex_cache_${supaUserId}`) || "[]");
        return cache as AnalysisSummary[];
      } catch { return []; }
    }

    const summaries: AnalysisSummary[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.created_at,
      timestamp: new Date(row.created_at).getTime(),
      score: row.score,
      corner_count: row.corners_detected ?? 0,
      lap_time: row.lap_time ?? 0,
      grade: row.grade,
      circuit_name: row.circuit_name || undefined,
      session_name: row.session_name || undefined,
    }));

    // Update the lightweight cache
    try {
      localStorage.setItem(`apex_cache_${supaUserId}`, JSON.stringify(summaries.slice(0, 50)));
    } catch {}

    return summaries;
  }

  // ─── Guest fallback ───
  if (!isLocalStorageAvailable()) return [];
  const suffix = getStorageSuffix(userId);
  const index = getAnalysesIndexLS(suffix);
  const summaries: AnalysisSummary[] = [];
  const prefix = `${STORAGE_ITEM_PREFIX}${suffix}_`;
  for (const id of index) {
    try {
      const raw = localStorage.getItem(prefix + id);
      if (!raw) continue;
      const stored = JSON.parse(raw) as StoredAnalysis;
      const r = stored.result;
      summaries.push({
        id: stored.id,
        date: new Date(stored.timestamp).toISOString(),
        timestamp: stored.timestamp,
        score: Math.round(r.performance_score.overall_score),
        corner_count: r.corners_detected,
        lap_time: r.lap_time,
        grade: r.performance_score.grade,
        circuit_name: r.session_conditions?.circuit_name || undefined,
        session_name: r.session_conditions?.session_name || undefined,
      });
    } catch {}
  }
  summaries.sort((a, b) => b.timestamp - a.timestamp);
  return summaries;
}

/**
 * Get a full analysis by ID.
 */
export async function getAnalysisById(id: string, userId?: string | null): Promise<AnalysisResult | null> {
  if (!id || !id.trim()) return null;

  const supaUserId = await getSupabaseUserId();

  // ─── Supabase path ───
  if (supaUserId) {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .eq("user_id", supaUserId)
      .single();

    if (error || !data) {
      console.warn("[Supabase] getAnalysisById failed:", error?.message);
      return null;
    }

    return rowToAnalysisResult(data, supaUserId);
  }

  // ─── Guest fallback ───
  if (!isLocalStorageAvailable()) return null;
  const suffix = getStorageSuffix(userId);
  try {
    const raw = localStorage.getItem(getItemKey(suffix, id));
    if (!raw) return null;
    return (JSON.parse(raw) as StoredAnalysis).result;
  } catch { return null; }
}

/**
 * Delete an analysis.
 */
export async function deleteAnalysis(id: string, userId?: string | null): Promise<boolean> {
  if (!id || !id.trim()) return false;

  const supaUserId = await getSupabaseUserId();

  // ─── Supabase path ───
  if (supaUserId) {
    // Get plot_keys before deleting the row
    const { data: row } = await supabase
      .from("analyses")
      .select("plot_keys")
      .eq("id", id)
      .eq("user_id", supaUserId)
      .single();

    // Delete images from bucket
    if (row?.plot_keys?.length > 0) {
      await deletePlotImages(supaUserId, id, row.plot_keys);
    }

    // Delete row
    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("id", id)
      .eq("user_id", supaUserId);

    if (error) {
      console.error("[Supabase] deleteAnalysis failed:", error.message);
      return false;
    }

    // Remove from cache
    try {
      const cacheKey = `apex_cache_${supaUserId}`;
      const cache = JSON.parse(localStorage.getItem(cacheKey) || "[]") as AnalysisSummary[];
      localStorage.setItem(cacheKey, JSON.stringify(cache.filter((a) => a.id !== id)));
    } catch {}

    return true;
  }

  // ─── Guest fallback ───
  if (!isLocalStorageAvailable()) return false;
  const suffix = getStorageSuffix(userId);
  try {
    const key = getItemKey(suffix, id);
    if (!localStorage.getItem(key)) return false;
    localStorage.removeItem(key);
    const index = getAnalysesIndexLS(suffix);
    saveAnalysesIndexLS(index.filter((x) => x !== id), suffix);
    return true;
  } catch { return false; }
}

/**
 * Export analysis as JSON Blob.
 */
export async function exportAnalysisAsJSON(id: string, userId?: string | null): Promise<Blob> {
  const analysis = await getAnalysisById(id, userId);
  if (!analysis) throw new Error(`Analyse non trouvée: ${id}`);
  return new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
}

/**
 * Download analysis as JSON file.
 */
export async function downloadAnalysis(id: string, filename?: string, userId?: string | null): Promise<void> {
  const blob = await exportAnalysisAsJSON(id, userId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `apex-analysis-${id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get count of stored analyses.
 */
export async function getAnalysesCount(userId?: string | null): Promise<number> {
  const supaUserId = await getSupabaseUserId();

  if (supaUserId) {
    const { count, error } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", supaUserId);

    if (!error && count !== null) return count;
  }

  if (!isLocalStorageAvailable()) return 0;
  return getAnalysesIndexLS(getStorageSuffix(userId)).length;
}

/**
 * Clear all analyses.
 */
export async function clearAllAnalyses(userId?: string | null): Promise<number> {
  const supaUserId = await getSupabaseUserId();

  if (supaUserId) {
    // Get all analyses to delete their images
    const { data } = await supabase
      .from("analyses")
      .select("id, plot_keys")
      .eq("user_id", supaUserId);

    if (data && data.length > 0) {
      for (const row of data) {
        if (row.plot_keys?.length > 0) {
          await deletePlotImages(supaUserId, row.id, row.plot_keys);
        }
      }
      await supabase.from("analyses").delete().eq("user_id", supaUserId);
    }

    try { localStorage.removeItem(`apex_cache_${supaUserId}`); } catch {}
    return data?.length ?? 0;
  }

  if (!isLocalStorageAvailable()) return 0;
  const suffix = getStorageSuffix(userId);
  const index = getAnalysesIndexLS(suffix);
  let count = 0;
  const prefix = `${STORAGE_ITEM_PREFIX}${suffix}_`;
  for (const id of index) {
    try { localStorage.removeItem(prefix + id); count++; } catch {}
  }
  localStorage.removeItem(getIndexKey(suffix));
  return count;
}

/**
 * Check if an analysis exists.
 */
export async function analysisExists(id: string, userId?: string | null): Promise<boolean> {
  if (!id || !id.trim()) return false;

  const supaUserId = await getSupabaseUserId();

  if (supaUserId) {
    const { count } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("id", id)
      .eq("user_id", supaUserId);

    return (count ?? 0) > 0;
  }

  if (!isLocalStorageAvailable()) return false;
  return localStorage.getItem(getItemKey(getStorageSuffix(userId), id)) !== null;
}

// ============================================================================
// FOLDERS — Supabase for auth users, localStorage for guests
// ============================================================================

export interface AnalysisFolder {
  id: string;
  name: string;
  parentId: string | null;
  analysisIds: string[];
  createdAt: number;
}

const FOLDERS_KEY_PREFIX = "apex_folders_";
function getFoldersKeyLS(userId: string | null | undefined) {
  return `${FOLDERS_KEY_PREFIX}${getStorageSuffix(userId)}`;
}

export function getAllFolders(userId?: string | null): AnalysisFolder[] {
  // Sync function — uses localStorage cache. Supabase sync happens via hooks.
  try {
    const raw = localStorage.getItem(getFoldersKeyLS(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFolders(folders: AnalysisFolder[], userId?: string | null): void {
  localStorage.setItem(getFoldersKeyLS(userId), JSON.stringify(folders));

  // Also sync to Supabase in background (fire-and-forget)
  syncFoldersToSupabase(folders).catch(() => {});
}

async function syncFoldersToSupabase(folders: AnalysisFolder[]): Promise<void> {
  const supaUserId = await getSupabaseUserId();
  if (!supaUserId) return;

  // Upsert all folders
  const rows = folders.map((f) => ({
    id: f.id,
    user_id: supaUserId,
    name: f.name,
    parent_id: f.parentId,
    created_at: new Date(f.createdAt).toISOString(),
  }));

  if (rows.length > 0) {
    await supabase.from("folders").upsert(rows);
  }
}

export function createFolder(name: string, parentId: string | null, userId?: string | null): AnalysisFolder {
  const folders = getAllFolders(userId);
  const folder: AnalysisFolder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    parentId,
    analysisIds: [],
    createdAt: Date.now(),
  };
  folders.push(folder);
  saveFolders(folders, userId);
  return folder;
}

export function renameFolder(folderId: string, newName: string, userId?: string | null): void {
  const folders = getAllFolders(userId);
  const f = folders.find((x) => x.id === folderId);
  if (f) { f.name = newName; saveFolders(folders, userId); }
}

export function deleteFolder(folderId: string, userId?: string | null): void {
  let folders = getAllFolders(userId);
  const toRemove = new Set<string>();
  const collect = (id: string) => {
    toRemove.add(id);
    folders.filter((f) => f.parentId === id).forEach((f) => collect(f.id));
  };
  collect(folderId);
  folders = folders.filter((f) => !toRemove.has(f.id));
  saveFolders(folders, userId);

  // Also delete from Supabase
  (async () => {
    const supaUserId = await getSupabaseUserId();
    if (supaUserId) {
      for (const id of toRemove) {
        await supabase.from("folders").delete().eq("id", id).eq("user_id", supaUserId);
      }
    }
  })().catch(() => {});
}

export function moveAnalysisToFolder(analysisId: string, folderId: string | null, userId?: string | null): void {
  const folders = getAllFolders(userId);
  for (const f of folders) f.analysisIds = f.analysisIds.filter((id) => id !== analysisId);
  if (folderId) {
    const target = folders.find((f) => f.id === folderId);
    if (target) target.analysisIds.push(analysisId);
  }
  saveFolders(folders, userId);

  // Also update the analysis row in Supabase
  (async () => {
    const supaUserId = await getSupabaseUserId();
    if (supaUserId) {
      await supabase.from("analyses").update({ folder_id: folderId }).eq("id", analysisId).eq("user_id", supaUserId);
    }
  })().catch(() => {});
}

// ============================================================================
// OBJECTIVES
// ============================================================================

export interface UserObjective {
  id: string;
  label: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

const OBJECTIVES_KEY_PREFIX = "apex_objectives_";

export function getObjectives(userId?: string | null): UserObjective[] {
  try {
    const raw = localStorage.getItem(`${OBJECTIVES_KEY_PREFIX}${getStorageSuffix(userId)}`);
    if (!raw) return [
      { id: "score", label: "Score de", targetValue: 85, currentValue: 0, unit: "/100" },
      { id: "laptime", label: "Passer sous", targetValue: 49, currentValue: 0, unit: "s" },
    ];
    return JSON.parse(raw) as UserObjective[];
  } catch { return []; }
}

export function saveObjectives(objectives: UserObjective[], userId?: string | null): void {
  localStorage.setItem(`${OBJECTIVES_KEY_PREFIX}${getStorageSuffix(userId)}`, JSON.stringify(objectives));
}

// ============================================================================
// MIGRATION — One-shot localStorage → Supabase
// ============================================================================

/**
 * Migrate all analyses from localStorage to Supabase.
 * Called once on first Dashboard load for authenticated users.
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<number> {
  const migrationKey = `${MIGRATION_KEY_PREFIX}${userId}`;

  // Already migrated?
  if (localStorage.getItem(migrationKey) === "done") return 0;

  const suffix = getStorageSuffix(userId);
  const index = getAnalysesIndexLS(suffix);
  if (index.length === 0) {
    localStorage.setItem(migrationKey, "done");
    return 0;
  }

  console.log(`[Migration] Starting migration of ${index.length} analyses to Supabase...`);
  let migrated = 0;
  const prefix = `${STORAGE_ITEM_PREFIX}${suffix}_`;

  for (const id of index) {
    try {
      const raw = localStorage.getItem(prefix + id);
      if (!raw) continue;

      const stored = JSON.parse(raw) as StoredAnalysis;

      // Check if already in Supabase
      const { count } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("id", stored.id);

      if ((count ?? 0) > 0) {
        // Already exists, skip upload but remove from localStorage
        localStorage.removeItem(prefix + id);
        migrated++;
        continue;
      }

      // Save to Supabase via our own function
      await saveAnalysis(stored.result, userId);

      // Remove from localStorage
      localStorage.removeItem(prefix + id);
      migrated++;
      console.log(`[Migration] Migrated analysis ${stored.id}`);
    } catch (err) {
      console.warn(`[Migration] Failed to migrate analysis ${id}:`, err);
    }
  }

  // Clean up localStorage index
  localStorage.removeItem(getIndexKey(suffix));
  localStorage.setItem(migrationKey, "done");

  console.log(`[Migration] Done! Migrated ${migrated}/${index.length} analyses.`);
  return migrated;
}

// Also try migrating "guest" analyses if the user was previously a guest
export async function migrateGuestAnalyses(): Promise<number> {
  const supaUserId = await getSupabaseUserId();
  if (!supaUserId) return 0;

  const guestIndex = getAnalysesIndexLS(STORAGE_GUEST);
  if (guestIndex.length === 0) return 0;

  console.log(`[Migration] Found ${guestIndex.length} guest analyses to migrate...`);
  let migrated = 0;
  const prefix = `${STORAGE_ITEM_PREFIX}${STORAGE_GUEST}_`;

  for (const id of guestIndex) {
    try {
      const raw = localStorage.getItem(prefix + id);
      if (!raw) continue;
      const stored = JSON.parse(raw) as StoredAnalysis;
      await saveAnalysis(stored.result, supaUserId);
      localStorage.removeItem(prefix + id);
      migrated++;
    } catch (err) {
      console.warn(`[Migration] Failed to migrate guest analysis ${id}:`, err);
    }
  }

  localStorage.removeItem(getIndexKey(STORAGE_GUEST));
  console.log(`[Migration] Migrated ${migrated} guest analyses.`);
  return migrated;
}

// ============================================================================
// DEFAULT EXPORT (backwards compatibility)
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
  getAllFolders,
  saveFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveAnalysisToFolder,
  getObjectives,
  saveObjectives,
  migrateLocalStorageToSupabase,
  migrateGuestAnalyses,
};
