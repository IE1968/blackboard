-- Skizix: Ordner für Boards im Konto
-- Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken (nach 01-konto.sql).
-- Kann gefahrlos mehrfach ausgeführt werden. Vorhandene Boards bleiben unverändert (ohne Ordner).

alter table public.skizix_konto_boards
  add column if not exists folder text not null default '' check (char_length(folder) <= 60);
