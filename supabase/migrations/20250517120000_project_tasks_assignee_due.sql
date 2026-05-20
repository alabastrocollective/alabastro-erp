-- Responsable y fecha de vencimiento en tareas del tablero
begin;

alter table public.project_tasks
  add column assigned_staff_id uuid references public.staff_members (id) on delete set null,
  add column due_on date;

create index idx_project_tasks_assigned_staff on public.project_tasks (assigned_staff_id);
create index idx_project_tasks_due on public.project_tasks (project_id, due_on);

commit;
