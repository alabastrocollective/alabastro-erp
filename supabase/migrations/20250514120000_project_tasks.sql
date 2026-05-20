-- Tareas por proyecto (tablero Kanban)
begin;

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'en_revision', 'terminado')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_tasks_project on public.project_tasks (project_id);
create index idx_project_tasks_status on public.project_tasks (project_id, status, sort_order);

create trigger tr_project_tasks_touch before update on public.project_tasks
  for each row execute function public.touch_updated_at();

alter table public.project_tasks enable row level security;

create policy "project_tasks_authenticated_all" on public.project_tasks
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.project_tasks to authenticated;

commit;
