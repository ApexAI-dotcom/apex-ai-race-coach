-- ============================================================================
-- ApexAI — Migration localStorage → Supabase
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- Date: 2026-03-19
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: folders
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON public.folders(user_id);

-- RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: analyses
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.analyses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Métadonnées légères (pour les listes, tris, filtres)
  score INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'C',
  lap_time REAL,
  best_lap_time REAL,
  corners_detected INTEGER DEFAULT 0,
  circuit_name TEXT,
  session_name TEXT,
  session_type TEXT DEFAULT 'practice',
  folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,

  -- Données structurées en JSONB (pas d'images)
  corner_analysis JSONB,
  coaching_advice JSONB,
  plot_data JSONB,
  performance_score JSONB NOT NULL DEFAULT '{}',
  statistics JSONB,
  session_conditions JSONB,
  lap_times JSONB,

  -- Liste des clés d'images dans le bucket Storage
  plot_keys TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_analyses_user ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_folder ON public.analyses(folder_id);

-- RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 3. STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════════════════

-- Bucket pour les images de plots (privé)
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-plots', 'analysis-plots', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les avatars (public pour affichage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. STORAGE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- analysis-plots: chaque utilisateur gère ses propres fichiers
-- Structure: {user_id}/{analysis_id}/filename.png
CREATE POLICY "Users read own plots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'analysis-plots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own plots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'analysis-plots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own plots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'analysis-plots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: chaque utilisateur gère son propre avatar
-- Structure: {user_id}/avatar.ext
CREATE POLICY "Users read own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars publics: tout le monde peut lire (bucket public)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');


-- ════════════════════════════════════════════════════════════════════════════
-- ✅ DONE — Vérification
-- ════════════════════════════════════════════════════════════════════════════
-- Après exécution, vérifiez dans le Dashboard Supabase :
-- 1. Table Editor → analyses et folders existent
-- 2. Storage → analysis-plots et avatars existent
-- 3. Authentication → Policies → RLS est activé sur les 2 tables
