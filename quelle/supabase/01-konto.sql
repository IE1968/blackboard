-- Skizix: Konto mit eigener Board-Liste
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
-- Kann gefahrlos mehrfach ausgeführt werden. Bestehende Tabellen und Funktionen von Skizix bleiben unverändert.
--
-- Jede Zeile = ein eigenes Board des angemeldeten Kontos (Board-Schlüssel und Name).
-- Zeilenrechte (Row Level Security): Jedes Konto sieht und ändert nur seine eigenen Zeilen.
-- Ohne Anmeldung (anon) gibt es keinen Zugriff.

create table if not exists public.skizix_konto_boards (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key        text        not null check (key ~ '^[A-Za-z0-9]{20,64}$'),
  name       text        not null default 'Board' check (char_length(name) <= 120),
  del        boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.skizix_konto_boards enable row level security;

drop policy if exists konto_lesen   on public.skizix_konto_boards;
drop policy if exists konto_anlegen on public.skizix_konto_boards;
drop policy if exists konto_aendern on public.skizix_konto_boards;
drop policy if exists konto_loeschen on public.skizix_konto_boards;
create policy konto_lesen    on public.skizix_konto_boards for select to authenticated using (user_id = (select auth.uid()));
create policy konto_anlegen  on public.skizix_konto_boards for insert to authenticated with check (user_id = (select auth.uid()));
create policy konto_aendern  on public.skizix_konto_boards for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy konto_loeschen on public.skizix_konto_boards for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.skizix_konto_boards from anon;
grant select, insert, update, delete on public.skizix_konto_boards to authenticated;

create or replace function public.skizix_konto_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists skizix_konto_touch on public.skizix_konto_boards;
create trigger skizix_konto_touch before update on public.skizix_konto_boards
  for each row execute function public.skizix_konto_touch();
