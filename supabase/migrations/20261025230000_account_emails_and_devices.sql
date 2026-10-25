-- Mails de compte envoyés par ApexAI (Edge Function account-events).
-- Une ligne par (compte, type de mail unique) : garantit qu'un mail comme la
-- bienvenue ne part qu'une fois.
create table if not exists public.account_emails (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

-- Appareils connus de chaque compte, pour l'alerte « nouvelle connexion ».
-- device_id : identifiant aléatoire gardé dans le navigateur (aucune IP).
create table if not exists public.user_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  user_agent text,
  alerted boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, device_id)
);

-- Lecture et écriture réservées au rôle service (Edge Functions) : RLS
-- activée, sans politique pour les rôles anon et authenticated.
alter table public.account_emails enable row level security;
alter table public.user_devices enable row level security;

comment on table public.account_emails is 'Mails uniques déjà envoyés (bienvenue…). Écrit par l''Edge Function account-events.';
comment on table public.user_devices is 'Appareils connus par compte, pour l''alerte de nouvelle connexion. Écrit par l''Edge Function account-events.';
