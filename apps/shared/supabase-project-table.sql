-- Table project_roadmap pour le module Gestion de projet (dashboard)
-- À exécuter dans Supabase → SQL Editor → New query

drop table if exists public.project_roadmap;

create table public.project_roadmap (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);
