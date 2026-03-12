-- Table notes pour le module Notes (dashboard)
-- À exécuter dans Supabase → SQL Editor → New query

drop table if exists public.notes;

create table public.notes (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);
