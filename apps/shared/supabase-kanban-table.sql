-- Table kanban_boards pour le module Kanban (dashboard)
-- À exécuter dans Supabase → SQL Editor → New query

drop table if exists public.kanban_boards;

create table public.kanban_boards (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);
