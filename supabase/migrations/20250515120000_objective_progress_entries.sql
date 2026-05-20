-- Historial de avances por objetivo
begin;

create table public.objective_progress_entries (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives (id) on delete cascade,
  amount numeric(14, 4) not null check (amount > 0),
  description text,
  occurred_on date not null default ((now() at time zone 'utc'))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_objective_progress_entries_objective on public.objective_progress_entries (objective_id);
create index idx_objective_progress_entries_date on public.objective_progress_entries (objective_id, occurred_on desc);

create trigger tr_objective_progress_entries_touch before update on public.objective_progress_entries
  for each row execute function public.touch_updated_at();

alter table public.objective_progress_entries enable row level security;

create policy "objective_progress_entries_authenticated_all" on public.objective_progress_entries
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.objective_progress_entries to authenticated;

commit;
