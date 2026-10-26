-- Base de référence des circuits de karting de France (ApexAI).
-- Alimentée par scripts/circuits/ (FFSA + OpenStreetMap), puis enrichie par
-- les sessions des pilotes. Table de référence : l'app ne la lit pas encore.
create table if not exists public.circuit_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text,
  postal_code text,
  department_code text,
  department text,
  region text,
  country text not null default 'FR',
  lat double precision,
  lon double precision,
  indoor boolean,
  surface text,
  width_m numeric,
  length_m numeric,
  -- complet | partiel | fermé hors gabarit | à dessiner
  trace_status text not null,
  corners_count integer,
  hairpins_count integer,
  medium_count integer,
  fast_corners_count integer,
  -- [{kind, direction, angle_deg, min_radius_m, apex_m, start_m, end_m}]
  corners jsonb not null default '[]'::jsonb,
  -- [[lat, lon], …] — tracé OSM (© contributeurs OpenStreetMap, ODbL)
  centerline jsonb not null default '[]'::jsonb,
  ffsa_structures jsonb not null default '[]'::jsonb,
  website text,
  phone text,
  osm_url text,
  source text not null,
  -- Fiche relue et validée à la main
  verified boolean not null default false,
  -- Lien éventuel vers la table circuits de l'app
  app_circuit_id uuid references public.circuits (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists circuit_catalog_dept_idx on public.circuit_catalog (department_code);
create index if not exists circuit_catalog_geo_idx on public.circuit_catalog (lat, lon);

alter table public.circuit_catalog enable row level security;

-- Données publiques de référence : lecture pour tous les comptes connectés.
-- Écriture réservée au rôle service (scripts d'import).
drop policy if exists "circuit_catalog lisible par les comptes" on public.circuit_catalog;
create policy "circuit_catalog lisible par les comptes"
  on public.circuit_catalog for select
  to authenticated
  using (true);

comment on table public.circuit_catalog is 'Base de référence des circuits de karting de France (FFSA + OpenStreetMap, © contributeurs OSM, ODbL). Alimentée par scripts/circuits/.';
