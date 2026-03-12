-- Table rappels pour le module Rappels (dashboard)
-- À exécuter dans Supabase → SQL Editor → New query

drop table if exists public.rappels;

create table public.rappels (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);
