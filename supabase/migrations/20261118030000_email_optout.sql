-- Désinscription des mails d'accompagnement (suite d'activation).
-- Écrite par l'Edge Function email-unsubscribe, lue par lifecycle-emails.
-- Les mails de sécurité du compte ne la consultent pas.
-- Retour arrière : 20261118030000_email_optout.down.sql
create table if not exists public.email_optout (
  user_id uuid primary key references auth.users (id) on delete cascade,
  source text not null default 'lien',
  created_at timestamptz not null default now()
);
alter table public.email_optout enable row level security;
comment on table public.email_optout is 'Comptes désinscrits des mails d''accompagnement. Rôle service seulement.';
