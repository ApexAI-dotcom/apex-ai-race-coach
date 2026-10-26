-- Back-office : suivi de lancement (visites, provenance, parcours, inscrits).

-- 1. Les départs de page étaient enregistrés comme des vues (le champ
--    « eventType » n'était pas lu) : ce sont les lignes qui portent une durée.
update public.page_events set event_type = 'leave' where event_type = 'view' and duration_ms is not null;

-- 2. Contexte de la visite.
alter table public.page_events
  add column if not exists visit_id text,
  add column if not exists device text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists tz text,
  add column if not exists lang text;

create index if not exists page_events_created_at_idx on public.page_events (created_at desc);
create index if not exists page_events_session_idx on public.page_events (session_id);
create index if not exists page_events_user_idx on public.page_events (user_id) where user_id is not null;

-- 3. Les pilotes inscrits, pour le back-office uniquement (rôle service).
create or replace function public.admin_launch_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed boolean,
  tier text,
  subscription_status text,
  trial_tier text,
  trial_until timestamptz,
  analyses integer,
  first_analysis_at timestamptz,
  last_analysis_at timestamptz,
  circuits text[],
  devices integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email::text,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    coalesce(u.raw_app_meta_data->>'provider', 'email'),
    u.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at is not null),
    p.subscription_tier,
    p.subscription_status,
    p.trial_tier,
    p.trial_until,
    coalesce(a.n, 0)::int,
    a.first_at,
    a.last_at,
    coalesce(a.circuits, '{}'),
    coalesce(d.n, 0)::int
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lateral (
    select count(*) n, min(created_at) first_at, max(created_at) last_at,
           array_agg(distinct circuit_name) filter (where circuit_name is not null) circuits
    from public.analyses an where an.user_id = u.id
  ) a on true
  left join lateral (
    select count(*) n from public.user_devices ud where ud.user_id = u.id
  ) d on true
  order by u.created_at desc;
$$;

revoke all on function public.admin_launch_users() from public, anon, authenticated;
grant execute on function public.admin_launch_users() to service_role;
