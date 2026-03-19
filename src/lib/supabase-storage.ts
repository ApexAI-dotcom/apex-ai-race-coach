/**
 * Supabase Storage Helpers
 * Upload/download/delete plot images and avatars
 */
import { supabase } from "./supabase";

const PLOTS_BUCKET = "analysis-plots";
const AVATARS_BUCKET = "avatars";

// ============================================================================
// PLOT IMAGES
// ============================================================================

/**
 * Decode a base64 data-URI or raw base64 string into a Blob.
 */
function base64ToBlob(base64: string, contentType = "image/png"): Blob {
  // Strip the data URI prefix if present
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteCharacters = atob(raw);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: contentType });
}

/**
 * Upload all plot images for an analysis.
 * @param userId - Supabase auth user ID
 * @param analysisId - Analysis ID
 * @param plots - Record of plot name → base64 string
 * @returns Array of uploaded file keys (e.g. ["trajectory_2d.png", ...])
 */
export async function uploadPlotImages(
  userId: string,
  analysisId: string,
  plots: Record<string, string | undefined>
): Promise<string[]> {
  const uploadedKeys: string[] = [];

  for (const [name, base64] of Object.entries(plots)) {
    if (!base64 || typeof base64 !== "string" || base64.length < 100) continue;

    const filename = `${name}.png`;
    const path = `${userId}/${analysisId}/${filename}`;
    const blob = base64ToBlob(base64);

    const { error } = await supabase.storage
      .from(PLOTS_BUCKET)
      .upload(path, blob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase] Failed to upload ${path}:`, error.message);
    } else {
      uploadedKeys.push(filename);
    }
  }

  return uploadedKeys;
}

/**
 * Get signed URLs for all plot images of an analysis (valid 1 hour).
 */
export async function getPlotSignedUrls(
  userId: string,
  analysisId: string,
  plotKeys: string[]
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  for (const key of plotKeys) {
    const path = `${userId}/${analysisId}/${key}`;
    const { data, error } = await supabase.storage
      .from(PLOTS_BUCKET)
      .createSignedUrl(path, 3600); // 1 hour

    if (!error && data?.signedUrl) {
      const name = key.replace(".png", "");
      urls[name] = data.signedUrl;
    }
  }

  return urls;
}

/**
 * Delete all plot images for an analysis.
 */
export async function deletePlotImages(
  userId: string,
  analysisId: string,
  plotKeys: string[]
): Promise<void> {
  const paths = plotKeys.map((key) => `${userId}/${analysisId}/${key}`);
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(PLOTS_BUCKET)
    .remove(paths);

  if (error) {
    console.warn("[Supabase] Failed to delete plot images:", error.message);
  }
}

// ============================================================================
// AVATARS
// ============================================================================

/**
 * Upload a user avatar.
 * Automates:
 * 1. Storage upload (bucket "avatars", path "{userId}/avatar.jpg")
 * 2. Auth metadata update (avatar_url)
 * 3. Profiles table update (avatar_url)
 * @returns Public URL of the uploaded avatar (with cache busting)
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  // Always use avatar.jpg to avoid multiple files per user
  const path = `${userId}/avatar.jpg`;

  // 1. Storage Upload
  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

  // 2. Get Public URL + Cache Busting
  const { data: { publicUrl } } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(path);
    
  const finalUrl = `${publicUrl}?t=${Date.now()}`;

  // 3. Update Auth Metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: finalUrl }
  });
  if (authError) console.warn("[Supabase] Failed to update auth metadata:", authError.message);

  // 4. Update Profiles Table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: finalUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);
    
  if (profileError) {
    // If profiles table update fails, it might be because the row doesn't exist yet
    // Try to insert if it's a "no rows affected" situation (though .update doesn't error on 0 rows)
    console.warn("[Supabase] Failed to update profiles table:", profileError.message);
  }

  return finalUrl;
}

/**
 * Delete a user's avatar.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  // List all files in the user's avatar folder
  const { data: files } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(AVATARS_BUCKET).remove(paths);
  }
}
